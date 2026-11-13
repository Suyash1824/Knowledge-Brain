"""
Memory Service layer managing persistence, versioning, provenance, and relationships.
"""

from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from ..models import (
    Memory, MemoryVersion, MemorySource,
    MemoryPermission, memory_dependencies, memory_semantic_links
)
from ..schemas import MemoryCreate, MemoryResponse, ExtractedMemoryItem
from ..compiler.sanitizer import MemorySanitizer
from ..conflict.detector import ConflictDetector

class MemoryService:
    @classmethod
    def store_memory(
        cls,
        mem_data: MemoryCreate,
        db: Optional[Session] = None,
        agent_id: str = "default_agent"
    ) -> MemoryResponse:
        """
        Stores a memory with sanitization, initial version (v1), provenance, and default agent permission.
        """
        now = datetime.now(timezone.utc)
        sanitized_content, sec_status, audit = MemorySanitizer.inspect_and_sanitize(
            mem_data.content, source_type=mem_data.source_type or "api"
        )
        
        mem_id = uuid4()
        metadata = dict(mem_data.metadata or {})
        metadata["security_audit"] = audit
        
        if db is not None:
            # Check for existing memory conflicts on the same conversation
            existing = db.query(Memory).filter(
                Memory.conversation_id == mem_data.conversation_id,
                Memory.status == "trusted"
            ).all()
            
            conflict_found = False
            for old_m in existing:
                report = ConflictDetector.detect_conflict(old_m.content, sanitized_content, old_m.id)
                if report.has_conflict:
                    conflict_found = True
                    # Versioning update: increment existing memory version and link relationship
                    max_v = db.query(MemoryVersion).filter(MemoryVersion.memory_id == old_m.id).count()
                    new_version = MemoryVersion(
                        id=uuid4(),
                        memory_id=old_m.id,
                        content=sanitized_content,
                        version_number=max_v + 1,
                        change_reason=f"conflict_resolution ({report.conflict_type})",
                        created_at=now
                    )
                    db.add(new_version)
                    old_m.content = sanitized_content
                    old_m.updated_at = now
                    
                    # Record relationship in semantic links graph (updates/contradicts)
                    rel_stmt = memory_semantic_links.insert().values(
                        source_id=old_m.id,
                        target_id=mem_id,
                        type="updates",
                        created_at=now
                    )
                    db.execute(rel_stmt)
                    break
            
            # Persist new memory record
            db_mem = Memory(
                id=mem_id,
                conversation_id=mem_data.conversation_id,
                content=sanitized_content,
                memory_type=mem_data.memory_type,
                metadata_=metadata,
                status=sec_status,
                valid_until=mem_data.valid_until,
                created_at=now,
                updated_at=now
            )
            db.add(db_mem)
            db.flush()
            
            # Persist Version 1
            v1 = MemoryVersion(
                id=uuid4(),
                memory_id=mem_id,
                content=sanitized_content,
                version_number=1,
                change_reason="initial_creation",
                created_at=now
            )
            db.add(v1)
            
            # Persist Provenance Source
            source = MemorySource(
                id=uuid4(),
                memory_id=mem_id,
                source_type=mem_data.source_type or "api",
                source_id=mem_data.source_id,
                provenance_metadata={"agent_id": agent_id, "timestamp": now.isoformat()},
                created_at=now
            )
            db.add(source)
            
            # Persist Agent Permission
            perm = MemoryPermission(
                id=uuid4(),
                memory_id=mem_id,
                agent_id=agent_id,
                can_read=True,
                can_write=True,
                classification_level="standard"
            )
            db.add(perm)
            db.commit()
            
            return MemoryResponse(
                id=db_mem.id,
                conversation_id=db_mem.conversation_id,
                content=db_mem.content,
                memory_type=db_mem.memory_type,
                status=db_mem.status,
                confidence_score=db_mem.confidence_score,
                metadata_=db_mem.metadata_ or {},
                valid_until=db_mem.valid_until,
                created_at=db_mem.created_at,
                updated_at=db_mem.updated_at
            )

        # Standalone mock response when database is unconfigured
        return MemoryResponse(
            id=mem_id,
            conversation_id=mem_data.conversation_id,
            content=sanitized_content,
            memory_type=mem_data.memory_type,
            status=sec_status,
            confidence_score=1.0,
            metadata_=metadata,
            valid_until=mem_data.valid_until,
            created_at=now,
            updated_at=now
        )

