import uuid
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Boolean,
    Text, Float, func, Table, Index
)
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import expression
from sqlalchemy.ext.mutable import MutableDict
from pgvector.sqlalchemy import Vector

Base = declarative_base()

# ==============================================================================
# Association Tables: Explicit Separation of Dependency DAG vs Semantic Links
# ==============================================================================

# 1. Dependency Graph (Strict DAG: 'depends_on', 'derives_from')
memory_dependencies = Table(
    "memory_dependencies",
    Base.metadata,
    Column("parent_id", UUID(as_uuid=True), ForeignKey("memories.id", ondelete="CASCADE"), primary_key=True),
    Column("child_id", UUID(as_uuid=True), ForeignKey("memories.id", ondelete="CASCADE"), primary_key=True),
    Column("type", String(32), nullable=False, default="depends_on"), # 'depends_on', 'derives_from'
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
    Index("idx_memory_dep_type", "type"),
)

# 2. Semantic Relationship Graph (Cross-Branch / Cycle-Tolerant: 'contradicts', 'updates')
memory_semantic_links = Table(
    "memory_semantic_links",
    Base.metadata,
    Column("source_id", UUID(as_uuid=True), ForeignKey("memories.id", ondelete="CASCADE"), primary_key=True),
    Column("target_id", UUID(as_uuid=True), ForeignKey("memories.id", ondelete="CASCADE"), primary_key=True),
    Column("type", String(32), nullable=False, default="updates"), # 'contradicts', 'updates'
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
    Index("idx_memory_sem_type", "type"),
)

# Alias for backward compatibility
memory_relationship = memory_dependencies

# ==============================================================================
# Core Domain Entities
# ==============================================================================

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, server_default=expression.true())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    conversations = relationship("Conversation", back_populates="owner", cascade="all, delete-orphan")
    deletion_requests = relationship("DeletionRequest", back_populates="requester")

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=True)
    metadata_ = Column("metadata", MutableDict.as_mutable(JSONB), default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    owner = relationship("User", back_populates="conversations")
    memories = relationship("Memory", back_populates="conversation", cascade="all, delete-orphan")

class Memory(Base):
    __tablename__ = "memories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    memory_type = Column(String(32), nullable=False, default="fact", index=True) # fact, preference, decision, task, experience
    embedding = Column(Vector(1536), nullable=True) # pgvector column (OpenAI text-embedding-3-small standard)
    embedding_model = Column(String(64), default="text-embedding-3-small") # records embedding model version
    confidence_score = Column(Float, default=1.0)
    metadata_ = Column("metadata", MutableDict.as_mutable(JSONB), default=dict)
    status = Column(String(32), default="trusted", index=True) # trusted, provisional, quarantined, revoked
    valid_until = Column(DateTime(timezone=True), nullable=True) # temporal expiration if transient
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    conversation = relationship("Conversation", back_populates="memories")
    versions = relationship("MemoryVersion", back_populates="memory", cascade="all, delete-orphan", order_by="MemoryVersion.version_number")
    sources = relationship("MemorySource", back_populates="memory", cascade="all, delete-orphan")
    permissions = relationship("MemoryPermission", back_populates="memory", cascade="all, delete-orphan")
    
    # 1. Dependency DAG relationships (Acyclic: depends_on, derives_from)
    parents = relationship(
        "Memory",
        secondary=memory_dependencies,
        primaryjoin=id == memory_dependencies.c.child_id,
        secondaryjoin=id == memory_dependencies.c.parent_id,
        backref="children",
    )
    
    # 2. Semantic Links (Cross-branch: contradicts, updates)
    semantic_targets = relationship(
        "Memory",
        secondary=memory_semantic_links,
        primaryjoin=id == memory_semantic_links.c.source_id,
        secondaryjoin=id == memory_semantic_links.c.target_id,
        backref="semantic_sources",
    )

class MemoryVersion(Base):
    __tablename__ = "memory_versions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    memory_id = Column(UUID(as_uuid=True), ForeignKey("memories.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False) # In forgetting, purged or defanged to non-sensitive tombstone
    version_number = Column(Integer, nullable=False)
    change_reason = Column(String(255), nullable=True) # e.g. "conflict_resolution", "user_edit", "agent_update"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    memory = relationship("Memory", back_populates="versions")

class MemorySource(Base):
    __tablename__ = "memory_sources"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    memory_id = Column(UUID(as_uuid=True), ForeignKey("memories.id", ondelete="CASCADE"), nullable=False, index=True)
    source_type = Column(String(64), nullable=False) # "conversation_turn", "api_payload", "tool_result", "user_directive"
    source_id = Column(UUID(as_uuid=True), nullable=True) # reference to originating turn / message
    provenance_metadata = Column(MutableDict.as_mutable(JSONB), default=dict) # Non-sensitive attribution metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    memory = relationship("Memory", back_populates="sources")

class MemoryPermission(Base):
    __tablename__ = "memory_permissions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    memory_id = Column(UUID(as_uuid=True), ForeignKey("memories.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_id = Column(String(128), nullable=False, index=True) # Identifier of authorized agent (e.g. "researcher-agent-1")
    can_read = Column(Boolean, server_default=expression.true())
    can_write = Column(Boolean, server_default=expression.false())
    classification_level = Column(String(32), default="standard") # "standard", "confidential", "restricted"
    
    memory = relationship("Memory", back_populates="permissions")

class DeletionRequest(Base):
    __tablename__ = "deletion_requests"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    memory_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    requested_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reason = Column(Text, nullable=True)
    status = Column(String(32), default="pending", index=True) # pending, executing, completed, failed
    cascade_count = Column(Integer, default=0) # number of dependent memories invalidated or pruned
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    requester = relationship("User", back_populates="deletion_requests")
    verification_record = relationship("VerificationRecord", back_populates="deletion_request", uselist=False)

class VerificationRecord(Base):
    __tablename__ = "verification_records"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    deletion_request_id = Column(UUID(as_uuid=True), ForeignKey("deletion_requests.id", ondelete="CASCADE"), nullable=False, unique=True)
    memory_id = Column(UUID(as_uuid=True), nullable=False)
    verified = Column(Boolean, nullable=False, default=False)
    verification_hash = Column(String(64), nullable=False) # SHA-256 audit integrity hash (tamper evidence)
    details = Column(MutableDict.as_mutable(JSONB), default=dict) # Sanitized audit metadata (NEVER stores deleted content)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    deletion_request = relationship("DeletionRequest", back_populates="verification_record")
