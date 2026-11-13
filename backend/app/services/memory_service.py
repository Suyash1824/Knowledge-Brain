"""
Memory Service layer managing persistence, versioning, provenance, conflict resolution, and relationships.
Orchestrates Memory Compiler, Conflict Detection, and Access Control.
"""

from typing import List, Optional, Dict, Any, Tuple
from uuid import UUID, uuid4
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from ..models import (
    Memory, MemoryVersion, MemorySource,
    MemoryPermission, memory_dependencies, memory_semantic_links
)
from ..schemas import MemoryCreate, MemoryResponse, ExtractedMemoryItem, ConflictReport
from ..compiler.sanitizer import MemorySanitizer
from ..compiler.extractor import MemoryExtractor
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
        Stores a memory with sanitization, conflict inspection, versioning, provenance, and access control.
        """
        now = datetime.now(timezone.utc)
        sanitized_content, sec_status, audit = MemorySanitizer.inspect_and_sanitize(
            mem_data.content, source_type=mem_data.source_type or "api"
        )
        
        mem_id = uuid4()
        metadata = dict(mem_data.metadata or {})
        metadata["security_audit"] = audit
        importance = getattr(mem_data, "importance_score", 0.7) or 0.7
        
        if db is not None:
            # 1. Inspect existing active memories in this conversation for contradictions or updates
            existing = db.query(Memory).filter(
                Memory.conversation_id == mem_data.conversation_id,
                Memory.status.in_(["trusted", "provisional"])
            ).all()
            
            conflict_report = None
            conflicting_mem = None
            for old_m in existing:
                report = ConflictDetector.detect_conflict(
                    existing_content=old_m.content,
                    new_content=sanitized_content,
                    existing_memory_id=old_m.id,
                    existing_status=old_m.status,
                    new_status=sec_status
                )
                if report.has_conflict:
                    conflict_report = report
                    conflicting_mem = old_m
                    break
            
            # 2. Conflict Handling according to recommendation
            if conflict_report and conflicting_mem:
                if conflict_report.recommended_action == "update_version":
                    # Non-silent version increment on existing memory
                    max_v = db.query(MemoryVersion).filter(MemoryVersion.memory_id == conflicting_mem.id).count()
                    new_version = MemoryVersion(
                        id=uuid4(),
                        memory_id=conflicting_mem.id,
                        content=sanitized_content,
                        version_number=max_v + 1,
                        change_reason=f"superseded_update ({conflict_report.conflict_type})",
                        created_at=now
                    )
                    db.add(new_version)
                    conflicting_mem.content = sanitized_content
                    conflicting_mem.importance_score = max(conflicting_mem.importance_score or 0.7, importance)
                    conflicting_mem.updated_at = now
                    
                    # Record semantic update link
                    rel_stmt = memory_semantic_links.insert().values(
                        source_id=conflicting_mem.id,
                        target_id=mem_id,
                        type="updates",
                        created_at=now
                    )
                    db.execute(rel_stmt)
                    db.commit()
                    db.refresh(conflicting_mem)
                    
                    return MemoryResponse(
                        id=conflicting_mem.id,
                        conversation_id=conflicting_mem.conversation_id,
                        content=conflicting_mem.content,
                        memory_type=conflicting_mem.memory_type,
                        status=conflicting_mem.status,
                        confidence_score=conflicting_mem.confidence_score,
                        importance_score=conflicting_mem.importance_score,
                        metadata_=conflicting_mem.metadata_ or {},
                        valid_until=conflicting_mem.valid_until,
                        created_at=conflicting_mem.created_at,
                        updated_at=conflicting_mem.updated_at
                    )
                
                elif conflict_report.recommended_action == "quarantine_new":
                    sec_status = "quarantined"
                    metadata["conflict_quarantine_reason"] = f"Contradicts trusted memory {conflicting_mem.id}"
                elif conflict_report.recommended_action == "flag_user":
                    sec_status = "provisional"
                    metadata["conflict_flagged"] = True
                    metadata["flagged_against_memory_id"] = str(conflicting_mem.id)

            # 3. Persist new primary memory record
            db_mem = Memory(
                id=mem_id,
                conversation_id=mem_data.conversation_id,
                content=sanitized_content,
                memory_type=mem_data.memory_type,
                confidence_score=1.0 if sec_status == "trusted" else 0.85,
                importance_score=importance,
                metadata_=metadata,
                status=sec_status,
                valid_until=mem_data.valid_until,
                created_at=now,
                updated_at=now
            )
            db.add(db_mem)
            db.flush()
            
            # Persist Version 1 (Immutable history)
            v1 = MemoryVersion(
                id=uuid4(),
                memory_id=mem_id,
                content=sanitized_content,
                version_number=1,
                change_reason="initial_creation",
                created_at=now
            )
            db.add(v1)
            
            # Persist Provenance Source Record
            source = MemorySource(
                id=uuid4(),
                memory_id=mem_id,
                source_type=mem_data.source_type or "api",
                source_id=mem_data.source_id,
                provenance_metadata={"agent_id": agent_id, "timestamp": now.isoformat()},
                created_at=now
            )
            db.add(source)
            
            # Persist Agent Access Control
            perm = MemoryPermission(
                id=uuid4(),
                memory_id=mem_id,
                agent_id=agent_id,
                can_read=True,
                can_write=True,
                classification_level="standard"
            )
            db.add(perm)
            
            # If conflicting, record semantic contradiction link
            if conflict_report and conflicting_mem:
                sem_stmt = memory_semantic_links.insert().values(
                    source_id=conflicting_mem.id,
                    target_id=mem_id,
                    type="contradicts",
                    created_at=now
                )
                db.execute(sem_stmt)
                
            db.commit()
            db.refresh(db_mem)
            
            return MemoryResponse(
                id=db_mem.id,
                conversation_id=db_mem.conversation_id,
                content=db_mem.content,
                memory_type=db_mem.memory_type,
                status=db_mem.status,
                confidence_score=db_mem.confidence_score,
                importance_score=db_mem.importance_score,
                metadata_=db_mem.metadata_ or {},
                valid_until=db_mem.valid_until,
                created_at=db_mem.created_at,
                updated_at=db_mem.updated_at
            )

        # Standalone object when DB is unpersisted (e.g. schema testing)
        return MemoryResponse(
            id=mem_id,
            conversation_id=mem_data.conversation_id,
            content=sanitized_content,
            memory_type=mem_data.memory_type,
            status=sec_status,
            confidence_score=1.0,
            importance_score=importance,
            metadata_=metadata,
            valid_until=mem_data.valid_until,
            created_at=now,
            updated_at=now
        )

    @classmethod
    def compile_dialogue(
        cls,
        conversation_id: UUID,
        raw_text: str,
        source_type: str = "conversation_turn",
        agent_id: str = "default_agent",
        context_metadata: Optional[Dict[str, Any]] = None,
        db: Optional[Session] = None
    ) -> List[MemoryResponse]:
        """
        End-to-end Memory Compiler workflow:
        1. Multi-facet extraction across conversation text.
        2. Sanitization, classification, and importance calculation.
        3. Persistence and conflict inspection per extracted item.
        """
        extractor = MemoryExtractor()
        extracted_items = extractor.extract(raw_text, context_metadata=context_metadata)
        
        persisted_memories: List[MemoryResponse] = []
        for item in extracted_items:
            mem_create = MemoryCreate(
                conversation_id=conversation_id,
                content=item.content,
                memory_type=item.memory_type,
                importance_score=item.importance_score,
                metadata=item.metadata,
                valid_until=item.valid_until,
                source_type=source_type
            )
            resp = cls.store_memory(mem_create, db=db, agent_id=agent_id)
            persisted_memories.append(resp)
            
        return persisted_memories
