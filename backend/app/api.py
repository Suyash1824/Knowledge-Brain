"""
REST and Model Context Protocol (MCP) API implementation for Knowledge Brain.
Enforces strict 503 Service Unavailable on persistent storage endpoints when database is unconfigured.
Guarantees zero unpersisted success reports.
"""

from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .schemas import (
    MemoryCompileInput, ExtractedMemoryItem,
    MemoryCreate, MemoryResponse, MemoryVersionResponse, MemorySourceResponse,
    ConflictReport,
    CapsuleQueryRequest, MemoryCapsuleResponse,
    DeletionRequestCreate, DeletionVerificationResponse,
    MCPToolCallRequest, MCPToolCallResponse
)
from .database import check_db_health, get_db, require_db
from .models import Memory, MemoryVersion, MemorySource, VerificationRecord
from .compiler.extractor import MemoryExtractor
from .compiler.sanitizer import MemorySanitizer
from .conflict.detector import ConflictDetector
from .capsule.generator import MemoryCapsuleGenerator
from .forgetting.engine import ForgettingEngine
from .services.memory_service import MemoryService

router = APIRouter()
extractor = MemoryExtractor()

# ==========================================
# 1. System Health & Database Status
# ==========================================

@router.get("/health", tags=["System"])
async def system_health():
    """Returns database connectivity and pgvector availability status."""
    db_status = check_db_health()
    return {
        "status": "healthy",
        "service": "Knowledge Brain API",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_status
    }

# ==========================================
# 2. Memory Compiler Endpoints (Stateless Inspection)
# ==========================================

@router.post("/compiler/compile", tags=["Memory Compiler"], response_model=List[ExtractedMemoryItem])
async def compile_memories(payload: MemoryCompileInput):
    """
    Stateless memory extraction: parses text into 5 facets with security defanging.
    Does not persist to database; outputs candidate memory items.
    """
    sanitized_text, sec_status, audit = MemorySanitizer.inspect_and_sanitize(
        payload.raw_content, source_type=payload.source_type
    )
    
    extracted = extractor.extract(
        sanitized_text,
        context_metadata={"origin_agent": payload.agent_id, "security_status": sec_status, "audit": audit}
    )
    return extracted

@router.post("/compiler/detect-conflicts", tags=["Memory Compiler"], response_model=ConflictReport)
async def detect_memory_conflicts(
    memory_id: Optional[UUID] = None,
    new_content: str = Query(...),
    reference_content: Optional[str] = Query(None),
    db: Optional[Session] = Depends(get_db)
):
    """
    Evaluates new information against existing memory content to detect contradictions.
    Can operate against a database record (if DB connected) or against reference_content statelessly.
    """
    existing_content = reference_content or ""
    if db is not None and memory_id is not None:
        mem = db.query(Memory).filter(Memory.id == memory_id).first()
        if mem:
            existing_content = mem.content
    
    if not existing_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must supply reference_content or a valid memory_id backed by persistent storage."
        )
        
    return ConflictDetector.detect_conflict(existing_content, new_content, memory_id)

# ==========================================
# 3. Persistent Memories Endpoints (Requires Live Database: 503 if unconfigured)
# ==========================================

@router.post("/memories", response_model=MemoryResponse, status_code=status.HTTP_201_CREATED, tags=["Memories"])
async def create_memory(mem: MemoryCreate, db: Session = Depends(require_db)):
    """
    Creates a new memory record with automatic versioning, provenance, and classification.
    Returns 503 Service Unavailable if database is unconfigured. Never reports false success.
    """
    return MemoryService.store_memory(mem, db=db)

@router.get("/memories", response_model=List[MemoryResponse], tags=["Memories"])
async def list_memories(
    conversation_id: Optional[UUID] = None,
    memory_type: Optional[str] = None,
    limit: int = Query(default=20, le=100),
    db: Session = Depends(require_db)
):
    """Retrieves memories filtered by conversation, memory type, or status from persistent storage."""
    q = db.query(Memory)
    if conversation_id:
        q = q.filter(Memory.conversation_id == conversation_id)
    if memory_type:
        q = q.filter(Memory.memory_type == memory_type)
        
    memories = q.limit(limit).all()
    return [
        MemoryResponse(
            id=m.id,
            conversation_id=m.conversation_id,
            content=m.content,
            memory_type=m.memory_type,
            status=m.status,
            confidence_score=m.confidence_score,
            metadata_=m.metadata_ or {},
            valid_until=m.valid_until,
            created_at=m.created_at,
            updated_at=m.updated_at
        )
        for m in memories
    ]

@router.get("/memories/{memory_id}", response_model=MemoryResponse, tags=["Memories"])
async def get_memory(memory_id: UUID, db: Session = Depends(require_db)):
    """Retrieves a single memory by ID from persistent storage."""
    m = db.query(Memory).filter(Memory.id == memory_id).first()
    if m:
        return MemoryResponse(
            id=m.id,
            conversation_id=m.conversation_id,
            content=m.content,
            memory_type=m.memory_type,
            status=m.status,
            confidence_score=m.confidence_score,
            metadata_=m.metadata_ or {},
            valid_until=m.valid_until,
            created_at=m.created_at,
            updated_at=m.updated_at
        )
    raise HTTPException(status_code=404, detail=f"Memory {memory_id} not found.")

@router.get("/memories/{memory_id}/versions", response_model=List[MemoryVersionResponse], tags=["Provenance & Versions"])
async def get_memory_versions(memory_id: UUID, db: Session = Depends(require_db)):
    """Inspects the revision history of a specific memory from persistent storage."""
    versions = db.query(MemoryVersion).filter(MemoryVersion.memory_id == memory_id).order_by(MemoryVersion.version_number).all()
    return [
        MemoryVersionResponse(
            id=v.id,
            memory_id=v.memory_id,
            content=v.content,
            version_number=v.version_number,
            change_reason=v.change_reason,
            created_at=v.created_at
        )
        for v in versions
    ]

@router.get("/memories/{memory_id}/provenance", response_model=List[MemorySourceResponse], tags=["Provenance & Versions"])
async def get_memory_provenance(memory_id: UUID, db: Session = Depends(require_db)):
    """Inspects where a memory originated and its provenance trail from persistent storage."""
    sources = db.query(MemorySource).filter(MemorySource.memory_id == memory_id).all()
    return [
        MemorySourceResponse(
            id=s.id,
            memory_id=s.memory_id,
            source_type=s.source_type,
            source_id=s.source_id,
            provenance_metadata=s.provenance_metadata or {},
            created_at=s.created_at
        )
        for s in sources
    ]

# ==========================================
# 4. Memory Capsule Endpoints (Requires Live Database: 503 if unconfigured)
# ==========================================

@router.post("/capsules/generate", response_model=MemoryCapsuleResponse, tags=["Memory Capsules"])
async def generate_capsule(request: CapsuleQueryRequest, db: Session = Depends(require_db)):
    """
    Generates a compact, task-specific Memory Capsule for an agent.
    Requires persistent storage for vector similarity search and graph expansion.
    """
    return MemoryCapsuleGenerator.generate_capsule(request, db=db)

# ==========================================
# 5. Dependency-Aware Forgetting Endpoints (Requires Live Database: 503 if unconfigured)
# ==========================================

@router.post("/forgetting/request-deletion", response_model=DeletionVerificationResponse, tags=["Forgetting & Audit"])
async def request_deletion(request: DeletionRequestCreate, db: Session = Depends(require_db)):
    """
    Executes a dependency-aware deletion request. Traces parent/child graph dependencies,
    removes derived memories, and generates a multi-backend deletion receipt.
    """
    result = ForgettingEngine.execute_deletion(
        target_memory_id=request.memory_id,
        requested_by=request.requested_by,
        reason=request.reason or "User right-to-be-forgotten request",
        db=db
    )
    return DeletionVerificationResponse(**result)

@router.get("/forgetting/verify/{request_id}", response_model=DeletionVerificationResponse, tags=["Forgetting & Audit"])
async def get_deletion_verification(request_id: UUID, db: Session = Depends(require_db)):
    """Retrieves an immutable cryptographic proof report verifying that a memory was erased."""
    rec = db.query(VerificationRecord).filter(VerificationRecord.deletion_request_id == request_id).first()
    if rec:
        return DeletionVerificationResponse(
            deletion_request_id=rec.deletion_request_id,
            memory_id=rec.memory_id,
            status="completed",
            cascaded_memories_deleted=rec.details.get("cascaded_dependencies_invalidated", []).__len__(),
            verification_hash=rec.verification_hash,
            verified=rec.verified,
            timestamp=rec.timestamp,
            details=rec.details or {}
        )
    raise HTTPException(status_code=404, detail="Deletion verification record not found.")

# ==========================================
# 6. Model Context Protocol (MCP) Interface
# ==========================================

@router.post("/mcp/tools/call", tags=["MCP Agent Interface"], response_model=MCPToolCallResponse)
async def mcp_tool_call(call: MCPToolCallRequest, db: Optional[Session] = Depends(get_db)):
    """
    Standard Model Context Protocol (MCP) tool execution gateway allowing
    external AI agents to access Knowledge Brain. Enforces 503 on persistence tools if DB unconfigured.
    """
    args = call.arguments
    
    if call.name == "kb_compile_memory":
        raw_text = args.get("content", "")
        extracted = extractor.extract(raw_text)
        return MCPToolCallResponse(
            content=[{"type": "json", "data": [e.model_dump(mode="json") for e in extracted]}],
            is_error=False
        )
        
    elif call.name == "kb_retrieve_capsule":
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database unconfigured: cannot retrieve memory capsule without persistent storage."
            )
        capsule_req = CapsuleQueryRequest(
            agent_id=args.get("agent_id", "mcp_agent"),
            task_description=args.get("task", ""),
            max_tokens=args.get("max_tokens", 1500)
        )
        capsule = MemoryCapsuleGenerator.generate_capsule(capsule_req, db=db)
        return MCPToolCallResponse(
            content=[{"type": "json", "data": capsule.model_dump(mode="json")}],
            is_error=False
        )
        
    elif call.name == "kb_check_conflict":
        report = ConflictDetector.detect_conflict(
            existing_content=args.get("existing_content", ""),
            new_content=args.get("new_content", "")
        )
        return MCPToolCallResponse(
            content=[{"type": "json", "data": report.model_dump(mode="json")}],
            is_error=False
        )
        
    elif call.name == "kb_request_forgetting":
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database unconfigured: cannot execute deletion without persistent storage."
            )
        del_res = ForgettingEngine.execute_deletion(
            target_memory_id=UUID(args.get("memory_id")),
            requested_by=UUID(args.get("requested_by", str(uuid4()))),
            reason=args.get("reason", "MCP agent deletion request"),
            db=db
        )
        del_res_serializable = {
            k: str(v) if isinstance(v, (UUID, datetime)) else v
            for k, v in del_res.items()
        }
        return MCPToolCallResponse(
            content=[{"type": "json", "data": del_res_serializable}],
            is_error=False
        )
        
    raise HTTPException(status_code=400, detail=f"Unsupported MCP tool '{call.name}'")
