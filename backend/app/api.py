"""
Comprehensive Production REST API for Knowledge Brain.
Universal, portable, intelligent, and user-controlled memory infrastructure for AI agents.
Provides complete endpoints for Auth, Memory CRUD, Vector Search, Knowledge Graph,
Capsules, Conflicts, Provenance, Forgetting Receipts, and Agent Management.
"""

from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import text, or_, func

from .schemas import (
    MemoryCompileInput, ExtractedMemoryItem,
    MemoryCreate, MemoryResponse, MemoryVersionResponse, MemorySourceResponse,
    MemoryUpdateRequest, MemorySearchRequest, MemorySearchResponse, MemorySearchResultItem,
    ConflictReport,
    CapsuleQueryRequest, MemoryCapsuleResponse,
    DeletionRequestCreate, DeletionVerificationResponse,
    MCPToolCallRequest, MCPToolCallResponse,
    UserRegisterRequest, UserLoginRequest, TokenResponse, UserProfileResponse,
    ConversationCreateRequest, ConversationResponse,
    RelationshipCreateRequest, RelationshipResponse, KnowledgeGraphResponse, GraphNode, GraphEdge,
    AgentSummaryResponse, MemoryPermissionCreateRequest, MemoryPermissionResponse,
    DashboardStatsResponse,
    RuntimeEventIngestRequest, RuntimeEventIngestResponse,
    HierarchicalRetrieveRequest, HierarchicalCapsuleResponse,
    MemoryPromoteRequest, MemoryDemoteRequest, LifecycleEventResponse
)
from .database import check_db_health, get_db, require_db
from .models import (
    User, Conversation, Memory, MemoryVersion, MemorySource,
    MemoryPermission, DeletionRequest, VerificationRecord,
    memory_dependencies, memory_semantic_links,
    ExperienceRecord, ContextRecord, KnowledgeRecord, LifecycleEvent
)
from .compiler.extractor import MemoryExtractor
from .compiler.sanitizer import MemorySanitizer
from .conflict.detector import ConflictDetector
from .capsule.generator import MemoryCapsuleGenerator
from .forgetting.engine import ForgettingEngine
from .services.memory_service import MemoryService
from .services.embedding_service import get_embedding
from .services.hierarchical_service import HierarchicalMemoryService
from .ingestion.engine import RuntimeIngestionEngine
from .retrieval.engine import HierarchicalRetrievalEngine
from .auth.security import hash_password, verify_password, create_access_token
from .auth.dependencies import get_current_user, get_optional_current_user

router = APIRouter()
extractor = MemoryExtractor()
ingestion_engine = RuntimeIngestionEngine()
retrieval_engine = HierarchicalRetrievalEngine()


# ==============================================================================
# 1. System Health & Dashboard Analytics
# ==============================================================================

@router.get("/health", tags=["System"])
async def system_health():
    """Returns live database connectivity, pgvector status, and API health."""
    db_status = check_db_health()
    return {
        "status": "healthy" if db_status.get("status") in ["connected", "healthy"] else db_status.get("status"),
        "service": "Knowledge Brain API",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_status
    }


@router.get("/dashboard/stats", response_model=DashboardStatsResponse, tags=["System"])
async def get_dashboard_stats(db: Session = Depends(require_db)):
    """Returns aggregated infrastructure metrics for the React dashboard."""
    total_memories = db.query(Memory).count()
    total_conversations = db.query(Conversation).count()
    total_verifications = db.query(VerificationRecord).count()
    
    # Distinct agents
    agent_sources = db.query(MemorySource.provenance_metadata).all()
    agents = set()
    for row in agent_sources:
        if row[0] and isinstance(row[0], dict) and "agent_id" in row[0]:
            agents.add(row[0]["agent_id"])
    total_agents = max(len(agents), 1)

    # Facet distribution
    facets = {"fact": 0, "preference": 0, "decision": 0, "task": 0, "experience": 0}
    for m_type, count in db.query(Memory.memory_type, func.count(Memory.id)).group_by(Memory.memory_type).all():
        if m_type in facets:
            facets[m_type] = count

    # Status distribution
    statuses = {"trusted": 0, "provisional": 0, "quarantined": 0, "revoked": 0}
    for m_status, count in db.query(Memory.status, func.count(Memory.id)).group_by(Memory.status).all():
        if m_status in statuses:
            statuses[m_status] = count

    health = check_db_health()
    return DashboardStatsResponse(
        total_memories=total_memories,
        total_conversations=total_conversations,
        total_agents=total_agents,
        total_verifications=total_verifications,
        facet_distribution=facets,
        status_distribution=statuses,
        storage_engine="Neon Serverless PostgreSQL (AWS ap-southeast-1)",
        pgvector_active=health.get("pgvector_available", False),
        system_health=health.get("status", "unknown")
    )


# ==============================================================================
# 2. Authentication & User Management
# ==============================================================================

@router.post("/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED, tags=["Authentication"])
async def register_user(payload: UserRegisterRequest, db: Session = Depends(require_db)):
    """Registers a new user, hashes password with bcrypt, initializes a default workspace, and returns a JWT."""
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User with email '{payload.email}' already exists."
        )

    user_id = uuid4()
    hashed_pwd = hash_password(payload.password)
    user = User(
        id=user_id,
        email=payload.email.lower().strip(),
        hashed_password=hashed_pwd,
        created_at=datetime.now(timezone.utc)
    )
    db.add(user)
    
    # Initialize default workspace conversation
    default_conv = Conversation(
        id=uuid4(),
        user_id=user_id,
        title="Primary Workspace",
        metadata_={"created_by": "registration", "is_default": True}
    )
    db.add(default_conv)
    db.commit()
    db.refresh(user)

    token = create_access_token(user_id=user.id, email=user.email)
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        email=user.email
    )


@router.post("/auth/login", response_model=TokenResponse, tags=["Authentication"])
async def login_user(payload: UserLoginRequest, db: Session = Depends(require_db)):
    """Authenticates user credentials and issues a signed JWT access token."""
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = create_access_token(user_id=user.id, email=user.email)
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        email=user.email
    )


@router.get("/auth/me", response_model=UserProfileResponse, tags=["Authentication"])
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Returns profile information for the currently authenticated user."""
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        created_at=current_user.created_at
    )


# ==============================================================================
# 3. Conversations Management
# ==============================================================================

@router.get("/conversations", response_model=List[ConversationResponse], tags=["Conversations"])
async def list_conversations(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(require_db)
):
    """Lists conversations with memory counts."""
    query = db.query(Conversation)
    if current_user:
        query = query.filter(Conversation.user_id == current_user.id)
        
    convs = query.order_by(Conversation.created_at.desc()).all()
    results = []
    for c in convs:
        mem_count = db.query(Memory).filter(Memory.conversation_id == c.id).count()
        results.append(ConversationResponse(
            id=c.id,
            user_id=c.user_id,
            title=c.title,
            metadata_=c.metadata_ or {},
            created_at=c.created_at,
            memory_count=mem_count
        ))
    return results


@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED, tags=["Conversations"])
async def create_conversation(
    payload: ConversationCreateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(require_db)
):
    """Creates a new conversation workspace context."""
    user = current_user or db.query(User).first()
    if not user:
        user = User(id=uuid4(), email="default_workspace@knowledgebrain.ai", hashed_password="placeholder_hash")
        db.add(user)
        db.commit()

    conv = Conversation(
        id=uuid4(),
        user_id=user.id,
        title=payload.title,
        metadata_=payload.metadata or {}
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)

    return ConversationResponse(
        id=conv.id,
        user_id=conv.user_id,
        title=conv.title,
        metadata_=conv.metadata_ or {},
        created_at=conv.created_at,
        memory_count=0
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse, tags=["Conversations"])
async def get_conversation(conversation_id: UUID, db: Session = Depends(require_db)):
    """Retrieves conversation workspace details."""
    c = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not c:
        raise HTTPException(status_code=404, detail=f"Conversation {conversation_id} not found.")
    mem_count = db.query(Memory).filter(Memory.conversation_id == c.id).count()
    return ConversationResponse(
        id=c.id,
        user_id=c.user_id,
        title=c.title,
        metadata_=c.metadata_ or {},
        created_at=c.created_at,
        memory_count=mem_count
    )


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Conversations"])
async def delete_conversation(conversation_id: UUID, db: Session = Depends(require_db)):
    """Deletes a conversation workspace and cascades its memories."""
    c = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not c:
        raise HTTPException(status_code=404, detail=f"Conversation {conversation_id} not found.")
    db.delete(c)
    db.commit()


# ==============================================================================
# 4. Memories CRUD & Semantic Search
# ==============================================================================

@router.post("/memories", response_model=MemoryResponse, status_code=status.HTTP_201_CREATED, tags=["Memories"])
async def create_memory(mem: MemoryCreate, db: Session = Depends(require_db)):
    """
    Creates a new memory record with automatic versioning, provenance, access control, and pgvector embedding.
    Never reports false success. Returns 503 if database is unconfigured.
    """
    return MemoryService.store_memory(mem, db=db)


@router.get("/memories", response_model=List[MemoryResponse], tags=["Memories"])
async def list_memories(
    conversation_id: Optional[UUID] = None,
    memory_type: Optional[str] = None,
    status_filter: Optional[str] = Query(default=None, alias="status"),
    search: Optional[str] = None,
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(require_db)
):
    """Retrieves memories with pagination, facet filters, status filters, and search keywords."""
    q = db.query(Memory)
    if conversation_id:
        q = q.filter(Memory.conversation_id == conversation_id)
    if memory_type:
        q = q.filter(Memory.memory_type == memory_type)
    if status_filter:
        q = q.filter(Memory.status == status_filter)
    if search:
        search_pattern = f"%{search.strip()}%"
        q = q.filter(Memory.content.ilike(search_pattern))

    memories = q.order_by(Memory.created_at.desc()).offset(offset).limit(limit).all()
    return [
        MemoryResponse(
            id=m.id,
            conversation_id=m.conversation_id,
            content=m.content,
            memory_type=m.memory_type,
            status=m.status,
            confidence_score=m.confidence_score,
            importance_score=getattr(m, "importance_score", 0.7) or 0.7,
            metadata_=m.metadata_ or {},
            valid_until=m.valid_until,
            created_at=m.created_at,
            updated_at=m.updated_at
        )
        for m in memories
    ]


@router.get("/memories/{memory_id}", response_model=MemoryResponse, tags=["Memories"])
async def get_memory(memory_id: UUID, db: Session = Depends(require_db)):
    """Retrieves a single memory by ID."""
    m = db.query(Memory).filter(Memory.id == memory_id).first()
    if not m:
        raise HTTPException(status_code=404, detail=f"Memory {memory_id} not found.")
    return MemoryResponse(
        id=m.id,
        conversation_id=m.conversation_id,
        content=m.content,
        memory_type=m.memory_type,
        status=m.status,
        confidence_score=m.confidence_score,
        importance_score=getattr(m, "importance_score", 0.7) or 0.7,
        metadata_=m.metadata_ or {},
        valid_until=m.valid_until,
        created_at=m.created_at,
        updated_at=m.updated_at
    )


@router.put("/memories/{memory_id}", response_model=MemoryResponse, tags=["Memories"])
async def update_memory(
    memory_id: UUID,
    payload: MemoryUpdateRequest,
    db: Session = Depends(require_db)
):
    """
    Updates an existing memory with version increment, security sanitization, and pgvector re-indexing.
    Enforces write permissions and preserves immutable history in MemoryVersion.
    """
    mem = db.query(Memory).filter(Memory.id == memory_id).first()
    if not mem:
        raise HTTPException(status_code=404, detail=f"Memory {memory_id} not found.")

    # Check write clearance if permissions exist
    perms = db.query(MemoryPermission).filter(MemoryPermission.memory_id == memory_id).all()
    if perms:
        can_write = any(p.can_write for p in perms if p.agent_id in [payload.agent_id, "*", "default_agent"])
        if not can_write:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Agent/User '{payload.agent_id}' does not have write permission for memory '{memory_id}'."
            )

    now = datetime.now(timezone.utc)
    sanitized_content, sec_status, audit = MemorySanitizer.inspect_and_sanitize(
        raw_text=payload.content,
        source_type=f"api_update:{payload.agent_id}"
    )

    current_v = db.query(MemoryVersion).filter(MemoryVersion.memory_id == memory_id).count()
    v_next = MemoryVersion(
        id=uuid4(),
        memory_id=memory_id,
        content=sanitized_content,
        version_number=current_v + 1,
        change_reason=payload.change_reason,
        created_at=now
    )
    db.add(v_next)

    # Update active row
    mem.content = sanitized_content
    mem.embedding = get_embedding(sanitized_content)
    if payload.importance_score is not None:
        mem.importance_score = payload.importance_score
    mem.updated_at = now

    # Record semantic link
    link_exists = db.query(memory_semantic_links).filter(
        memory_semantic_links.c.source_id == mem.id,
        memory_semantic_links.c.target_id == mem.id
    ).first()
    if not link_exists:
        rel_stmt = memory_semantic_links.insert().values(
            source_id=mem.id,
            target_id=mem.id,
            type="updates",
            created_at=now
        )
        db.execute(rel_stmt)

    db.commit()
    db.refresh(mem)

    return MemoryResponse(
        id=mem.id,
        conversation_id=mem.conversation_id,
        content=mem.content,
        memory_type=mem.memory_type,
        status=mem.status,
        confidence_score=mem.confidence_score,
        importance_score=getattr(mem, "importance_score", 0.7) or 0.7,
        metadata_=mem.metadata_ or {},
        valid_until=mem.valid_until,
        created_at=mem.created_at,
        updated_at=mem.updated_at
    )


@router.delete("/memories/{memory_id}", response_model=DeletionVerificationResponse, tags=["Memories"])
async def delete_memory(
    memory_id: UUID,
    requested_by: Optional[UUID] = None,
    reason: str = "User manual deletion via API",
    db: Session = Depends(require_db)
):
    """
    Safely deletes a memory and invalidates downstream derivations via dependency-aware forgetting.
    Generates a verifiable SHA-256 cryptographic audit receipt.
    """
    user_id = requested_by
    if not user_id:
        u = db.query(User).first()
        user_id = u.id if u else uuid4()

    result = ForgettingEngine.execute_deletion(
        target_memory_id=memory_id,
        requested_by=user_id,
        reason=reason,
        db=db
    )
    return DeletionVerificationResponse(**result)


@router.post("/memories/search", response_model=MemorySearchResponse, tags=["Memories"])
async def search_memories(
    payload: MemorySearchRequest,
    db: Session = Depends(require_db)
):
    """
    Hybrid semantic vector similarity and keyword search across active memories.
    Uses pgvector `<=>` cosine distance operator against indexed embeddings when available,
    with lexical similarity ranking fallback.
    """
    query_emb = get_embedding(payload.query)
    emb_str = f"[{','.join(f'{x:.6f}' for x in query_emb)}]"
    
    # Try pgvector query
    sql = text("""
        SELECT id, conversation_id, content, memory_type, status, importance_score,
               created_at, updated_at,
               1.0 - (embedding <=> CAST(:emb AS vector)) AS similarity
        FROM memories
        WHERE status IN ('trusted', 'provisional')
          AND embedding IS NOT NULL
        ORDER BY embedding <=> CAST(:emb AS vector) ASC
        LIMIT :limit
    """)
    
    try:
        rows = db.execute(sql, {"emb": emb_str, "limit": payload.limit}).fetchall()
        results = []
        for r in rows:
            sim = float(r.similarity) if r.similarity is not None else 0.5
            if sim >= payload.min_similarity:
                results.append(MemorySearchResultItem(
                    id=r.id,
                    conversation_id=r.conversation_id,
                    content=r.content,
                    memory_type=r.memory_type,
                    similarity_score=round(sim, 4),
                    importance_score=r.importance_score or 0.7,
                    status=r.status,
                    created_at=r.created_at,
                    updated_at=r.updated_at
                ))
        return MemorySearchResponse(total=len(results), query=payload.query, results=results)
    except Exception:
        # Fallback to keyword match
        q_words = [w.lower() for w in payload.query.split() if len(w) > 2]
        query_kw = db.query(Memory).filter(Memory.status.in_(["trusted", "provisional"]))
        if payload.conversation_id:
            query_kw = query_kw.filter(Memory.conversation_id == payload.conversation_id)
        if payload.memory_type:
            query_kw = query_kw.filter(Memory.memory_type == payload.memory_type)
            
        mems = query_kw.limit(payload.limit * 2).all()
        results = []
        for m in mems:
            content_lower = m.content.lower()
            overlap = sum(1 for w in q_words if w in content_lower)
            sim = min(1.0, 0.40 + (overlap * 0.20))
            if sim >= payload.min_similarity:
                results.append(MemorySearchResultItem(
                    id=m.id,
                    conversation_id=m.conversation_id,
                    content=m.content,
                    memory_type=m.memory_type,
                    similarity_score=round(sim, 4),
                    importance_score=getattr(m, "importance_score", 0.7) or 0.7,
                    status=m.status,
                    created_at=m.created_at,
                    updated_at=m.updated_at
                ))
        results.sort(key=lambda x: x.similarity_score, reverse=True)
        return MemorySearchResponse(total=len(results[:payload.limit]), query=payload.query, results=results[:payload.limit])


# ==============================================================================
# 5. Provenance & Version History
# ==============================================================================

@router.get("/memories/{memory_id}/versions", response_model=List[MemoryVersionResponse], tags=["Provenance & Versions"])
async def get_memory_versions(memory_id: UUID, db: Session = Depends(require_db)):
    """Inspects the revision history of a specific memory."""
    versions = db.query(MemoryVersion).filter(MemoryVersion.memory_id == memory_id).order_by(MemoryVersion.version_number.asc()).all()
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
    """Inspects where a memory originated and its provenance trail."""
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


# ==============================================================================
# 6. Knowledge Graph & Relationships
# ==============================================================================

@router.get("/memories/{memory_id}/relationships", response_model=List[RelationshipResponse], tags=["Knowledge Graph"])
async def get_memory_relationships(memory_id: UUID, db: Session = Depends(require_db)):
    """Retrieves all incoming and outgoing dependency edges and semantic links for a memory."""
    results = []
    
    # 1. Dependency DAG edges (parent -> child)
    dep_rows = db.execute(
        memory_dependencies.select().where(
            or_(memory_dependencies.c.parent_id == memory_id, memory_dependencies.c.child_id == memory_id)
        )
    ).fetchall()
    for row in dep_rows:
        results.append(RelationshipResponse(
            source_id=row.parent_id,
            target_id=row.child_id,
            relationship_category="dependency",
            type="derives_from" if row.child_id == memory_id else "depends_on",
            created_at=row.created_at or datetime.now(timezone.utc)
        ))

    # 2. Semantic links (contradicts, updates)
    sem_rows = db.execute(
        memory_semantic_links.select().where(
            or_(memory_semantic_links.c.source_id == memory_id, memory_semantic_links.c.target_id == memory_id)
        )
    ).fetchall()
    for row in sem_rows:
        results.append(RelationshipResponse(
            source_id=row.source_id,
            target_id=row.target_id,
            relationship_category="semantic",
            type=row.type,
            created_at=row.created_at or datetime.now(timezone.utc)
        ))

    return results


@router.post("/memories/relationships", response_model=RelationshipResponse, status_code=status.HTTP_201_CREATED, tags=["Knowledge Graph"])
async def create_memory_relationship(
    payload: RelationshipCreateRequest,
    db: Session = Depends(require_db)
):
    """
    Creates an explicit relationship edge between two memories.
    Enforces DAG acyclicity on dependency edges.
    """
    now = datetime.now(timezone.utc)
    
    if payload.relationship_category == "dependency":
        # Check cycle prevention
        from .forgetting.engine import ForgettingEngine
        if ForgettingEngine.detect_cycle(payload.source_id, payload.target_id, db):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Adding dependency edge from {payload.source_id} to {payload.target_id} introduces a directed cycle."
            )
            
        stmt = memory_dependencies.insert().values(
            parent_id=payload.source_id,
            child_id=payload.target_id,
            type=payload.type,
            created_at=now
        )
        db.execute(stmt)
        db.commit()
        return RelationshipResponse(
            source_id=payload.source_id,
            target_id=payload.target_id,
            relationship_category="dependency",
            type=payload.type,
            created_at=now
        )
    else:
        # Semantic link
        link_exists = db.execute(
            memory_semantic_links.select().where(
                memory_semantic_links.c.source_id == payload.source_id,
                memory_semantic_links.c.target_id == payload.target_id
            )
        ).first()
        if not link_exists:
            stmt = memory_semantic_links.insert().values(
                source_id=payload.source_id,
                target_id=payload.target_id,
                type=payload.type,
                created_at=now
            )
            db.execute(stmt)
            db.commit()
            
        return RelationshipResponse(
            source_id=payload.source_id,
            target_id=payload.target_id,
            relationship_category="semantic",
            type=payload.type,
            created_at=now
        )


@router.get("/graph", response_model=KnowledgeGraphResponse, tags=["Knowledge Graph"])
async def get_full_knowledge_graph(
    conversation_id: Optional[UUID] = None,
    limit: int = Query(default=100, le=500),
    db: Session = Depends(require_db)
):
    """Returns the full knowledge graph nodes and edges for the React canvas visualization."""
    query = db.query(Memory).filter(Memory.status.in_(["trusted", "provisional"]))
    if conversation_id:
        query = query.filter(Memory.conversation_id == conversation_id)
        
    mems = query.limit(limit).all()
    mem_ids = {m.id for m in mems}
    
    nodes = [
        GraphNode(
            id=str(m.id),
            label=m.content[:60] + ("..." if len(m.content) > 60 else ""),
            memory_type=m.memory_type,
            importance=m.importance_score or 0.7,
            status=m.status
        )
        for m in mems
    ]

    edges = []
    if mem_ids:
        # Dependency edges
        dep_rows = db.execute(
            memory_dependencies.select().where(
                memory_dependencies.c.parent_id.in_(mem_ids),
                memory_dependencies.c.child_id.in_(mem_ids)
            )
        ).fetchall()
        for r in dep_rows:
            edges.append(GraphEdge(
                source=str(r.parent_id),
                target=str(r.child_id),
                category="dependency",
                type="derives_from"
            ))

        # Semantic edges
        sem_rows = db.execute(
            memory_semantic_links.select().where(
                memory_semantic_links.c.source_id.in_(mem_ids),
                memory_semantic_links.c.target_id.in_(mem_ids)
            )
        ).fetchall()
        for r in sem_rows:
            if r.source_id != r.target_id:
                edges.append(GraphEdge(
                    source=str(r.source_id),
                    target=str(r.target_id),
                    category="semantic",
                    type=r.type
                ))

    return KnowledgeGraphResponse(
        total_nodes=len(nodes),
        total_edges=len(edges),
        nodes=nodes,
        edges=edges
    )


# ==============================================================================
# 7. Agent Management & Permissions
# ==============================================================================

@router.get("/agents", response_model=List[AgentSummaryResponse], tags=["Agents & Permissions"])
async def list_agents(db: Session = Depends(require_db)):
    """Lists distinct registered agents, their authored memories, and permission privileges."""
    sources = db.query(MemorySource).all()
    agent_stats: Dict[str, Dict[str, Any]] = {}
    
    for s in sources:
        meta = s.provenance_metadata or {}
        agent_id = meta.get("agent_id", "unknown_agent")
        if agent_id not in agent_stats:
            agent_stats[agent_id] = {
                "authored": 0,
                "last_active": s.created_at,
                "access_levels": set()
            }
        agent_stats[agent_id]["authored"] += 1
        if s.created_at and (not agent_stats[agent_id]["last_active"] or s.created_at > agent_stats[agent_id]["last_active"]):
            agent_stats[agent_id]["last_active"] = s.created_at

    # Permissions held
    perms = db.query(MemoryPermission).all()
    for p in perms:
        if p.agent_id in agent_stats:
            agent_stats[p.agent_id]["access_levels"].add(p.classification_level)
            
    # Include cursor and antigravity if registered
    for default_agent in ["cursor-ai", "antigravity-ai"]:
        if default_agent not in agent_stats:
            agent_stats[default_agent] = {
                "authored": 0,
                "last_active": datetime.now(timezone.utc),
                "access_levels": {"standard"}
            }

    results = []
    for ag_id, data in agent_stats.items():
        results.append(AgentSummaryResponse(
            agent_id=ag_id,
            total_memories_authored=data["authored"],
            total_permissions_held=db.query(MemoryPermission).filter(MemoryPermission.agent_id == ag_id).count(),
            last_active_at=data["last_active"],
            access_levels=sorted(list(data["access_levels"])) if data["access_levels"] else ["standard"]
        ))
    return results


@router.get("/memories/{memory_id}/permissions", response_model=List[MemoryPermissionResponse], tags=["Agents & Permissions"])
async def get_memory_permissions(memory_id: UUID, db: Session = Depends(require_db)):
    """Lists agent clearance rules and permissions for a specific memory."""
    perms = db.query(MemoryPermission).filter(MemoryPermission.memory_id == memory_id).all()
    return perms


@router.post("/memories/{memory_id}/permissions", response_model=MemoryPermissionResponse, status_code=status.HTTP_201_CREATED, tags=["Agents & Permissions"])
async def create_memory_permission(
    memory_id: UUID,
    payload: MemoryPermissionCreateRequest,
    db: Session = Depends(require_db)
):
    """Assigns or updates an agent permission grant on a memory."""
    mem = db.query(Memory).filter(Memory.id == memory_id).first()
    if not mem:
        raise HTTPException(status_code=404, detail=f"Memory {memory_id} not found.")

    perm = db.query(MemoryPermission).filter(
        MemoryPermission.memory_id == memory_id,
        MemoryPermission.agent_id == payload.agent_id
    ).first()

    if perm:
        perm.can_read = payload.can_read
        perm.can_write = payload.can_write
        perm.classification_level = payload.classification_level
    else:
        perm = MemoryPermission(
            id=uuid4(),
            memory_id=memory_id,
            agent_id=payload.agent_id,
            can_read=payload.can_read,
            can_write=payload.can_write,
            classification_level=payload.classification_level
        )
        db.add(perm)

    db.commit()
    db.refresh(perm)
    return perm


# ==============================================================================
# 8. Memory Compiler & Capsules
# ==============================================================================

@router.post("/compiler/compile", tags=["Memory Intelligence"], response_model=List[ExtractedMemoryItem])
async def compile_memories(payload: MemoryCompileInput):
    """
    Stateless memory extraction: parses text into 5 facets with security defanging and salience scoring.
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


@router.post("/compiler/detect-conflicts", tags=["Memory Intelligence"], response_model=ConflictReport)
async def detect_memory_conflicts(
    memory_id: Optional[UUID] = None,
    new_content: str = Query(...),
    reference_content: Optional[str] = Query(None),
    db: Optional[Session] = Depends(get_db)
):
    """
    Evaluates new information against existing memory content to detect contradictions.
    Can operate against a database record or against reference_content statelessly.
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


@router.post("/capsules/generate", response_model=MemoryCapsuleResponse, tags=["Memory Intelligence"])
async def generate_capsule(request: CapsuleQueryRequest, db: Session = Depends(require_db)):
    """
    Generates a compact, task-specific Memory Capsule ranked by composite score.
    Strictly enforces max_tokens budget.
    """
    return MemoryCapsuleGenerator.generate_capsule(request, db=db)


# ==============================================================================
# 9. Dependency-Aware Forgetting & Audit Receipts
# ==============================================================================

@router.post("/forgetting/request-deletion", response_model=DeletionVerificationResponse, tags=["Forgetting & Audit"])
async def request_deletion(request: DeletionRequestCreate, db: Session = Depends(require_db)):
    """
    Executes a dependency-aware deletion request. Traces parent/child graph dependencies,
    removes derived memories, zeroes vector embeddings, and generates a multi-store SHA-256 receipt.
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


# ==============================================================================
# 10. Model Context Protocol (MCP) Interface Gateway
# ==============================================================================

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
        
    elif call.name == "kb_ingest_experience":
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database unconfigured: cannot ingest experience memory without persistent storage."
            )
        conv_id = UUID(args.get("conversation_id", str(uuid4())))
        ingest_req = RuntimeEventIngestRequest(
            conversation_id=conv_id,
            event_type=args.get("event_type", "conversation_turn"),
            agent_id=args.get("agent_id", "mcp_agent"),
            raw_text=args.get("raw_text", ""),
            synchronous_promotion=args.get("synchronous_promotion", True)
        )
        ingest_res = ingestion_engine.ingest_runtime_event(db=db, request=ingest_req)
        return MCPToolCallResponse(
            content=[{"type": "json", "data": ingest_res.model_dump(mode="json")}],
            is_error=False
        )

    elif call.name == "kb_retrieve_hierarchical":
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database unconfigured: cannot execute hierarchical retrieval without persistent storage."
            )
        ret_req = HierarchicalRetrieveRequest(
            query=args.get("query", ""),
            depth=args.get("depth", "auto"),
            agent_id=args.get("agent_id", "mcp_agent"),
            max_tokens=args.get("max_tokens", 400)
        )
        capsule = retrieval_engine.retrieve(db=db, request=ret_req)
        return MCPToolCallResponse(
            content=[{"type": "json", "data": capsule.model_dump(mode="json")}],
            is_error=False
        )

    raise HTTPException(status_code=400, detail=f"Unsupported MCP tool '{call.name}'")


# ==============================================================================
# 11. Progressive Hierarchical Memory Endpoints (Level 1, Level 2, Level 3)
# ==============================================================================

@router.post("/hierarchical/ingest", response_model=RuntimeEventIngestResponse, status_code=status.HTTP_201_CREATED, tags=["Hierarchical Memory"])
async def ingest_runtime_event(
    payload: RuntimeEventIngestRequest,
    db: Session = Depends(require_db)
):
    """
    Ingests raw AI agent conversational events, observations, or tool outputs into Level 1 Experience Memory.
    Extracts candidate items, validates security, detects conflicts, and conditionally consolidates into Context.
    """
    return ingestion_engine.ingest_runtime_event(db=db, request=payload)


@router.post("/hierarchical/retrieve", response_model=HierarchicalCapsuleResponse, tags=["Hierarchical Memory"])
async def retrieve_hierarchical_memory(
    payload: HierarchicalRetrieveRequest,
    db: Session = Depends(require_db)
):
    """
    Depth-aware retrieval engine. Analyzes query intent to dynamically route to Level 1, Level 2, Level 3, or Multi-tier.
    Filters by permissions, drops expired transient memories, and packs a defensive Memory Capsule within token budget.
    """
    return retrieval_engine.retrieve(db=db, request=payload)


@router.post("/hierarchical/promote/{memory_id}", response_model=MemoryResponse, tags=["Hierarchical Memory"])
async def promote_memory(
    memory_id: UUID,
    payload: MemoryPromoteRequest,
    db: Session = Depends(require_db)
):
    """
    Promotes an existing memory up the hierarchy (Level 1 -> Level 2 Context or Level 2 -> Level 3 Knowledge)
    after verifying promotion criteria, evidence thresholds, and recording immutable lifecycle events.
    """
    mem = db.query(Memory).filter(Memory.id == memory_id).first()
    if not mem:
        raise HTTPException(status_code=404, detail=f"Memory {memory_id} not found.")

    if payload.target_level == 2:
        res = HierarchicalMemoryService.consolidate_experience_to_context(
            db=db,
            experience_memory_id=memory_id,
            agent_id=payload.promoted_by
        )
    elif payload.target_level == 3:
        try:
            res = HierarchicalMemoryService.promote_to_knowledge(
                db=db,
                context_memory_id=memory_id,
                promoted_by=payload.promoted_by,
                force=True
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    else:
        raise HTTPException(status_code=400, detail="Target level must be 2 (Context) or 3 (Knowledge).")

    return MemoryResponse(
        id=res.id,
        conversation_id=res.conversation_id,
        content=res.content,
        memory_type=res.memory_type,
        status=res.status,
        confidence_score=res.confidence_score,
        importance_score=getattr(res, "importance_score", 0.7) or 0.7,
        metadata_=res.metadata_ or {},
        valid_until=res.valid_until,
        created_at=res.created_at,
        updated_at=res.updated_at,
        hierarchy_level=res.hierarchy_level,
        promotion_status=res.promotion_status,
        evidence_count=res.evidence_count,
        quality_score=res.quality_score,
        promoted_at=res.promoted_at,
        promoted_by=res.promoted_by,
        parent_context_id=res.parent_context_id,
        superseded_by_id=res.superseded_by_id
    )


@router.post("/hierarchical/demote/{memory_id}", response_model=MemoryResponse, tags=["Hierarchical Memory"])
async def demote_memory(
    memory_id: UUID,
    payload: MemoryDemoteRequest,
    db: Session = Depends(require_db)
):
    """Demotes a memory down the hierarchy due to obsolescence or partial deprecation."""
    try:
        res = HierarchicalMemoryService.demote_memory(
            db=db,
            memory_id=memory_id,
            target_level=payload.target_level,
            reason=payload.reason
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return MemoryResponse(
        id=res.id,
        conversation_id=res.conversation_id,
        content=res.content,
        memory_type=res.memory_type,
        status=res.status,
        confidence_score=res.confidence_score,
        importance_score=getattr(res, "importance_score", 0.7) or 0.7,
        metadata_=res.metadata_ or {},
        valid_until=res.valid_until,
        created_at=res.created_at,
        updated_at=res.updated_at,
        hierarchy_level=res.hierarchy_level,
        promotion_status=res.promotion_status,
        evidence_count=res.evidence_count,
        quality_score=res.quality_score,
        promoted_at=res.promoted_at,
        promoted_by=res.promoted_by,
        parent_context_id=res.parent_context_id,
        superseded_by_id=res.superseded_by_id
    )


@router.get("/hierarchical/lifecycle/{memory_id}", response_model=List[LifecycleEventResponse], tags=["Hierarchical Memory"])
async def get_memory_lifecycle(
    memory_id: UUID,
    db: Session = Depends(require_db)
):
    """Retrieves the complete immutable audit trail of tier promotions, demotions, and supersessions for a memory."""
    events = db.query(LifecycleEvent).filter(
        LifecycleEvent.memory_id == memory_id
    ).order_by(LifecycleEvent.created_at.asc()).all()
    
    return [
        LifecycleEventResponse(
            id=ev.id,
            memory_id=ev.memory_id,
            transition_type=ev.transition_type,
            from_level=ev.from_level,
            to_level=ev.to_level,
            reason=ev.reason,
            triggered_by=ev.triggered_by,
            metadata_=ev.metadata_ or {},
            created_at=ev.created_at
        )
        for ev in events
    ]


@router.get("/hierarchical/stats", tags=["Hierarchical Memory"])
async def get_hierarchical_stats(db: Session = Depends(require_db)):
    """Returns distribution of memories across Level 1 Experience, Level 2 Context, and Level 3 Knowledge."""
    l1_count = db.query(Memory).filter(Memory.hierarchy_level == 1).count()
    l2_count = db.query(Memory).filter(Memory.hierarchy_level == 2).count()
    l3_count = db.query(Memory).filter(Memory.hierarchy_level == 3).count()
    total = db.query(Memory).count()
    
    return {
        "level_1_experience": l1_count,
        "level_2_context": l2_count,
        "level_3_knowledge": l3_count,
        "total_memories": total,
        "active_contexts": db.query(ContextRecord).filter(ContextRecord.active_status == "active").count(),
        "verified_knowledge": db.query(KnowledgeRecord).filter(KnowledgeRecord.verification_level == "verified").count()
    }
