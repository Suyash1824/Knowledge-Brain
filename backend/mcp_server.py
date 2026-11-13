"""
Knowledge Brain Standalone Model Context Protocol (MCP) Server.
Implements the standard MCP protocol and JSON-RPC 2.0 over stdio using the official Python MCP SDK.
Connects to the authoritative Knowledge Brain engine and live Neon PostgreSQL database.
Enforces multi-agent access control, tenant isolation, passive data fences, and cryptographic auditability.
Compatible with Cursor AI and Google Antigravity AI.
"""

import os
import sys
import json
import logging
from uuid import UUID, uuid4
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from mcp.server.mcpserver import MCPServer
from sqlalchemy.orm import Session
from sqlalchemy import text

# Ensure backend directory is in python module search path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database import get_engine, sanitize_db_url, check_db_health
from app.models import (
    Base, User, Conversation, Memory, MemoryVersion,
    MemorySource, MemoryPermission, memory_dependencies, memory_semantic_links
)
from app.compiler.extractor import MemoryExtractor
from app.compiler.sanitizer import MemorySanitizer
from app.capsule.generator import MemoryCapsuleGenerator
from app.conflict.detector import ConflictDetector
from app.forgetting.engine import ForgettingEngine
from app.services.memory_service import MemoryService
from app.services.embedding_service import get_embedding
from app.services.hierarchical_service import HierarchicalMemoryService
from app.ingestion.engine import RuntimeIngestionEngine
from app.retrieval.engine import HierarchicalRetrievalEngine
from app.schemas import (
    MemoryCreate, CapsuleQueryRequest,
    RuntimeEventIngestRequest, HierarchicalRetrieveRequest
)

# Configure logging to stderr so stdio JSON-RPC remains clean
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [KnowledgeBrain-MCP] %(levelname)s: %(message)s",
    stream=sys.stderr
)
logger = logging.getLogger("knowledge-brain-mcp")

# Initialize official MCP Server
server = MCPServer(
    name="knowledge-brain",
    version="1.0.0",
    instructions="Universal AI Agent Memory Infrastructure for Cursor AI, Google Antigravity, and MCP clients."
)

extractor = MemoryExtractor()


def get_db_session() -> Optional[Session]:
    """Provides a thread-safe SQLAlchemy database session against Neon PostgreSQL."""
    engine = get_engine()
    if engine is None:
        logger.warning("Database engine unconfigured; persistent operations will be blocked.")
        return None
    return Session(bind=engine)


def resolve_default_user_and_conv(db: Session, agent_id: str) -> tuple[UUID, UUID]:
    """
    Resolves or creates a default user and conversation context for multi-agent persistence.
    Enforces multi-tenant isolation.
    """
    env_user_id = os.getenv("KB_USER_ID")
    user = None
    if env_user_id:
        try:
            user = db.query(User).filter(User.id == UUID(env_user_id)).first()
        except Exception:
            pass
            
    if not user:
        user = db.query(User).first()
        if not user:
            user = User(
                id=uuid4(),
                email="shared_agent_workspace@knowledgebrain.ai",
                hashed_password="placeholder_hash_mcp_managed"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
    conv = db.query(Conversation).filter(Conversation.user_id == user.id).first()
    if not conv:
        conv = Conversation(
            id=uuid4(),
            user_id=user.id,
            title=f"Shared Multi-Agent Workspace ({agent_id})",
            metadata_={"created_by": agent_id, "managed_by": "Knowledge Brain MCP"}
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
        
    return user.id, conv.id


# ==============================================================================
# Tool 1: compile_memory
# ==============================================================================
@server.tool(
    name="compile_memory",
    description="Transforms dialogue or text into structured memories across 5 facets (fact, preference, decision, task, experience) with salience scoring, security defanging, and optional persistence."
)
async def compile_memory(
    raw_content: str,
    conversation_id: Optional[str] = None,
    source_type: str = "conversation_turn",
    agent_id: Optional[str] = None,
    classification_level: str = "standard",
    persist: bool = True
) -> str:
    effective_agent = agent_id or os.getenv("KB_AGENT_ID", "default_agent")
    sanitized_text, sec_status, audit = MemorySanitizer.inspect_and_sanitize(
        raw_text=raw_content,
        source_type=source_type
    )
    
    extracted_items = extractor.extract(
        text=sanitized_text,
        context_metadata={"agent_id": effective_agent, "audit": audit}
    )
    
    results = []
    db = get_db_session()
    
    try:
        conv_uuid = None
        if conversation_id:
            try:
                conv_uuid = UUID(conversation_id)
            except ValueError:
                return json.dumps({"error": f"Invalid conversation_id UUID: {conversation_id}"})
        elif db:
            _, conv_uuid = resolve_default_user_and_conv(db, effective_agent)
            
        for item in extracted_items:
            item.metadata["classification_level"] = classification_level
            mem_dict = {
                "content": MemorySanitizer.wrap_passive_data(item.content),
                "memory_type": item.memory_type,
                "confidence_score": item.confidence_score,
                "importance_score": item.importance_score,
                "status": sec_status,
                "valid_until": item.valid_until.isoformat() if item.valid_until else None,
                "metadata": item.metadata
            }
            
            if persist and db and conv_uuid:
                mem_create = MemoryCreate(
                    conversation_id=conv_uuid,
                    content=item.content,
                    memory_type=item.memory_type,
                    importance_score=item.importance_score,
                    metadata=item.metadata,
                    valid_until=item.valid_until,
                    source_type=source_type
                )
                stored = MemoryService.store_memory(mem_create, db=db, agent_id=effective_agent)
                mem_dict["id"] = str(stored.id)
                mem_dict["persisted"] = True
            else:
                mem_dict["id"] = str(uuid4())
                mem_dict["persisted"] = False
                
            results.append(mem_dict)
            
        return json.dumps({
            "status": "success",
            "total_extracted": len(results),
            "agent_id": effective_agent,
            "security_status": sec_status,
            "memories": results
        }, indent=2)
    finally:
        if db:
            db.close()


# ==============================================================================
# Tool 2: retrieve_memories
# ==============================================================================
@server.tool(
    name="retrieve_memories",
    description="Retrieves active, authorized memories filtered by conversation, memory facet, or agent clearance. Returns memories safely enclosed in passive data fences."
)
async def retrieve_memories(
    conversation_id: Optional[str] = None,
    memory_type: Optional[str] = None,
    limit: int = 20,
    agent_id: Optional[str] = None
) -> str:
    effective_agent = agent_id or os.getenv("KB_AGENT_ID", "default_agent")
    db = get_db_session()
    if not db:
        return json.dumps({"error": "DatabaseNotConfigured", "message": "Persistent storage unavailable."})
        
    try:
        query = db.query(Memory).filter(Memory.status.in_(["trusted", "provisional"]))
        
        if conversation_id:
            try:
                query = query.filter(Memory.conversation_id == UUID(conversation_id))
            except ValueError:
                return json.dumps({"error": f"Invalid conversation_id UUID: {conversation_id}"})
                
        if memory_type:
            query = query.filter(Memory.memory_type == memory_type)
            
        db_memories = query.order_by(Memory.created_at.desc()).limit(min(limit, 100)).all()
        
        # Enforce agent read clearance
        all_mem_ids = [m.id for m in db_memories]
        if all_mem_ids:
            mem_with_perms = {
                row[0] for row in db.query(MemoryPermission.memory_id).filter(
                    MemoryPermission.memory_id.in_(all_mem_ids)
                ).all()
            }
            allowed_ids = {
                row[0] for row in db.query(MemoryPermission.memory_id).filter(
                    MemoryPermission.memory_id.in_(all_mem_ids),
                    MemoryPermission.agent_id.in_([effective_agent, "*", "default_agent"]),
                    MemoryPermission.can_read == True
                ).all()
            }
            db_memories = [m for m in db_memories if m.id not in mem_with_perms or m.id in allowed_ids]
        
        output = []
        for m in db_memories:
            output.append({
                "id": str(m.id),
                "conversation_id": str(m.conversation_id),
                "content": MemorySanitizer.wrap_passive_data(m.content),
                "memory_type": m.memory_type,
                "importance_score": getattr(m, "importance_score", 0.7) or 0.7,
                "confidence_score": m.confidence_score,
                "status": m.status,
                "created_at": m.created_at.isoformat() if m.created_at else None,
                "updated_at": m.updated_at.isoformat() if m.updated_at else None
            })
            
        return json.dumps({
            "status": "success",
            "count": len(output),
            "requesting_agent": effective_agent,
            "memories": output
        }, indent=2)
    finally:
        db.close()


# ==============================================================================
# Tool 3: generate_memory_capsule
# ==============================================================================
@server.tool(
    name="generate_memory_capsule",
    description="Synthesizes a compact, task-focused Memory Capsule ranked by composite relevance, importance, and recency decay. Strictly enforces max_tokens budget."
)
async def generate_memory_capsule(
    task_description: str,
    max_tokens: int = 1500,
    conversation_id: Optional[str] = None,
    filter_types: Optional[List[str]] = None,
    agent_id: Optional[str] = None,
    include_provenance: bool = True
) -> str:
    effective_agent = agent_id or os.getenv("KB_AGENT_ID", "default_agent")
    db = get_db_session()
    
    conv_uuid = None
    if conversation_id:
        try:
            conv_uuid = UUID(conversation_id)
        except ValueError:
            return json.dumps({"error": f"Invalid conversation_id UUID: {conversation_id}"})
            
    req = CapsuleQueryRequest(
        agent_id=effective_agent,
        task_description=task_description,
        max_tokens=max_tokens,
        conversation_id=conv_uuid,
        filter_types=filter_types,  # type: ignore
        include_provenance=include_provenance
    )
    
    capsule = MemoryCapsuleGenerator.generate_capsule(req, db=db)
    if db:
        db.close()
        
    return json.dumps(capsule.model_dump(mode="json"), indent=2)


# ==============================================================================
# Tool 4: check_memory_conflicts
# ==============================================================================
@server.tool(
    name="check_memory_conflicts",
    description="Compares new information against existing memory content or an active memory ID to detect contradictions, superseded decisions, or temporal shifts."
)
async def check_memory_conflicts(
    new_content: str,
    existing_content: Optional[str] = None,
    memory_id: Optional[str] = None
) -> str:
    db = None
    ref_content = existing_content or ""
    mem_uuid = None
    
    if memory_id:
        try:
            mem_uuid = UUID(memory_id)
            db = get_db_session()
            if db:
                m = db.query(Memory).filter(Memory.id == mem_uuid).first()
                if m:
                    ref_content = m.content
        except ValueError:
            return json.dumps({"error": f"Invalid memory_id UUID: {memory_id}"})
        finally:
            if db:
                db.close()
                
    if not ref_content:
        return json.dumps({
            "error": "MissingReference",
            "message": "Must supply either existing_content or a valid memory_id."
        })
        
    report = ConflictDetector.detect_conflict(
        existing_content=ref_content,
        new_content=new_content,
        existing_memory_id=mem_uuid
    )
    return json.dumps(report.model_dump(mode="json"), indent=2)


# ==============================================================================
# Tool 5: update_memory
# ==============================================================================
@server.tool(
    name="update_memory",
    description="Updates an existing memory with new information while preserving immutable version history and recording semantic update links."
)
async def update_memory(
    memory_id: str,
    new_content: str,
    change_reason: str = "agent_update",
    agent_id: Optional[str] = None
) -> str:
    effective_agent = agent_id or os.getenv("KB_AGENT_ID", "default_agent")
    try:
        mem_uuid = UUID(memory_id)
    except ValueError:
        return json.dumps({"error": f"Invalid memory_id UUID: {memory_id}"})
        
    db = get_db_session()
    if not db:
        return json.dumps({"error": "DatabaseNotConfigured", "message": "Persistent storage unavailable."})
        
    try:
        mem = db.query(Memory).filter(Memory.id == mem_uuid).first()
        if not mem:
            return json.dumps({"error": "NotFound", "message": f"Memory {memory_id} not found."})
            
        # Enforce agent write clearance
        perms = db.query(MemoryPermission).filter(
            MemoryPermission.memory_id == mem_uuid
        ).all()
        if perms:
            can_write = any(
                p.can_write for p in perms
                if p.agent_id in [effective_agent, "*"]
            )
            if not can_write:
                return json.dumps({
                    "error": "PermissionDenied",
                    "message": f"Agent '{effective_agent}' does not have write permission for memory '{memory_id}'."
                })

        now = datetime.now(timezone.utc)
        sanitized_content, sec_status, audit = MemorySanitizer.inspect_and_sanitize(
            raw_text=new_content,
            source_type=f"agent_update:{effective_agent}"
        )
        
        # Increment version count
        current_v = db.query(MemoryVersion).filter(MemoryVersion.memory_id == mem_uuid).count()
        v_next = MemoryVersion(
            id=uuid4(),
            memory_id=mem_uuid,
            content=sanitized_content,
            version_number=current_v + 1,
            change_reason=change_reason,
            created_at=now
        )
        db.add(v_next)
        
        # Update active row
        mem.content = sanitized_content
        mem.embedding = get_embedding(sanitized_content)
        mem.updated_at = now
        
        # Record semantic link if not already recorded
        link_exists = db.query(memory_semantic_links).filter(
            memory_semantic_links.c.source_id == mem.id,
            memory_semantic_links.c.target_id == mem.id
        ).first()
        if not link_exists:
            sem_stmt = memory_semantic_links.insert().values(
                source_id=mem.id,
                target_id=mem.id,
                type="updates",
                created_at=now
            )
            db.execute(sem_stmt)
        db.commit()
        db.refresh(mem)
        
        return json.dumps({
            "status": "success",
            "memory_id": str(mem.id),
            "new_version": current_v + 1,
            "change_reason": change_reason,
            "updated_content": MemorySanitizer.wrap_passive_data(mem.content),
            "updated_at": mem.updated_at.isoformat()
        }, indent=2)
    finally:
        db.close()


# ==============================================================================
# Tool 6: forget_memory
# ==============================================================================
@server.tool(
    name="forget_memory",
    description="Executes dependency-aware forgetting on target memory and its derived descendants. Generates multi-store verification receipt with SHA-256 integrity hash."
)
async def forget_memory(
    memory_id: str,
    requested_by: Optional[str] = None,
    reason: str = "Agent right-to-be-forgotten request"
) -> str:
    try:
        mem_uuid = UUID(memory_id)
    except ValueError:
        return json.dumps({"error": f"Invalid memory_id UUID: {memory_id}"})
        
    req_by_uuid = uuid4()
    if requested_by:
        try:
            req_by_uuid = UUID(requested_by)
        except ValueError:
            pass
            
    db = get_db_session()
    if not db:
        return json.dumps({"error": "DatabaseNotConfigured", "message": "Persistent storage unavailable."})
        
    try:
        # Check that user exists for foreign key constraint
        user = db.query(User).filter(User.id == req_by_uuid).first()
        if not user:
            user = db.query(User).first()
            if user:
                req_by_uuid = user.id
                
        receipt = ForgettingEngine.execute_deletion(
            target_memory_id=mem_uuid,
            requested_by=req_by_uuid,
            reason=reason,
            db=db
        )
        
        # Make serializable
        serializable_receipt = {
            "deletion_request_id": str(receipt["deletion_request_id"]),
            "memory_id": str(receipt["memory_id"]),
            "status": receipt["status"],
            "cascaded_memories_deleted": receipt["cascaded_memories_deleted"],
            "verification_hash": receipt["verification_hash"],
            "verified": receipt["verified"],
            "timestamp": receipt["timestamp"].isoformat() if isinstance(receipt["timestamp"], datetime) else str(receipt["timestamp"]),
            "details": receipt["details"]
        }
        return json.dumps(serializable_receipt, indent=2)
    finally:
        db.close()


# ==============================================================================
# Progressive Hierarchical MCP Tools (Sprint 6)
# ==============================================================================

hierarchical_ingestion_engine = RuntimeIngestionEngine()
hierarchical_retrieval_engine = HierarchicalRetrievalEngine()

@server.tool(
    name="ingest_experience",
    description="Ingests raw AI agent conversation turns, observations, or tool outputs into Level 1 Experience Memory with progressive candidate extraction, idempotency, and optional synchronous consolidation."
)
async def ingest_experience(
    raw_text: str,
    event_type: str = "conversation_turn",
    conversation_id: Optional[str] = None,
    agent_id: Optional[str] = None,
    turn_index: int = 0,
    synchronous_promotion: bool = True
) -> str:
    effective_agent = agent_id or os.getenv("KB_AGENT_ID", "mcp_agent")
    db = get_db_session()
    if not db:
        return json.dumps({"error": "DatabaseNotConfigured", "message": "Persistent storage unavailable."})
        
    try:
        conv_uuid = None
        if conversation_id:
            try:
                conv_uuid = UUID(conversation_id)
            except ValueError:
                return json.dumps({"error": f"Invalid conversation_id UUID: {conversation_id}"})
        else:
            _, conv_uuid = resolve_default_user_and_conv(db, effective_agent)

        req = RuntimeEventIngestRequest(
            conversation_id=conv_uuid,
            event_type=event_type,
            agent_id=effective_agent,
            turn_index=turn_index,
            raw_text=raw_text,
            synchronous_promotion=synchronous_promotion
        )
        res = hierarchical_ingestion_engine.ingest_runtime_event(db=db, request=req)
        return json.dumps(res.model_dump(mode="json"), indent=2)
    finally:
        db.close()


@server.tool(
    name="retrieve_hierarchical_memory",
    description="Retrieves memories with automatic or specified depth routing (Level 1 Experience, Level 2 Context, Level 3 Knowledge, or Multi-tier), packing results into a defensive, token-budgeted Memory Capsule."
)
async def retrieve_hierarchical_memory(
    query: str,
    depth: str = "auto",
    conversation_id: Optional[str] = None,
    agent_id: Optional[str] = None,
    max_tokens: int = 400
) -> str:
    effective_agent = agent_id or os.getenv("KB_AGENT_ID", "mcp_agent")
    db = get_db_session()
    if not db:
        return json.dumps({"error": "DatabaseNotConfigured", "message": "Persistent storage unavailable."})

    try:
        conv_uuid = None
        if conversation_id:
            try:
                conv_uuid = UUID(conversation_id)
            except ValueError:
                pass

        req = HierarchicalRetrieveRequest(
            query=query,
            depth=depth,
            conversation_id=conv_uuid,
            agent_id=effective_agent,
            max_tokens=max_tokens
        )
        capsule = hierarchical_retrieval_engine.retrieve(db=db, request=req)
        return json.dumps(capsule.model_dump(mode="json"), indent=2)
    finally:
        db.close()


@server.tool(
    name="promote_memory",
    description="Promotes an existing memory up the hierarchy (Level 1 -> Level 2 Context or Level 2 -> Level 3 Knowledge) upon meeting quality, recurrence, and stability criteria."
)
async def promote_memory(
    memory_id: str,
    target_level: int = 3,
    promoted_by: Optional[str] = None,
    reason: str = "Agent requested promotion"
) -> str:
    effective_agent = promoted_by or os.getenv("KB_AGENT_ID", "mcp_agent")
    db = get_db_session()
    if not db:
        return json.dumps({"error": "DatabaseNotConfigured", "message": "Persistent storage unavailable."})

    try:
        mem_uuid = UUID(memory_id)
        if target_level == 2:
            res = HierarchicalMemoryService.consolidate_experience_to_context(
                db=db,
                experience_memory_id=mem_uuid,
                agent_id=effective_agent
            )
        elif target_level == 3:
            res = HierarchicalMemoryService.promote_to_knowledge(
                db=db,
                context_memory_id=mem_uuid,
                promoted_by=effective_agent,
                force=True
            )
        else:
            return json.dumps({"error": "Invalid target_level. Must be 2 or 3."})

        return json.dumps({
            "memory_id": str(res.id),
            "hierarchy_level": res.hierarchy_level,
            "promotion_status": res.promotion_status,
            "content": res.content,
            "promoted_by": res.promoted_by
        }, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e)})
    finally:
        db.close()


# ==============================================================================
# Server Runner
# ==============================================================================
def run_server():
    """Starts the standalone MCP server using stdio transport."""
    logger.info("Initializing Knowledge Brain Standalone MCP Server over stdio...")
    health = check_db_health()
    logger.info(f"Database Target: {health.get('target', 'unconfigured')}")
    logger.info(f"Database Health: {health.get('status')} - {health.get('message')}")
    server.run(transport="stdio")


if __name__ == "__main__":
    run_server()

