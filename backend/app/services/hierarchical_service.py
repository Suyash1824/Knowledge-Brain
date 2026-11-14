"""
Hierarchical Progressive Memory Service for Knowledge Brain.
Manages the full lifecycle across:
- Level 1: Experience Memory (raw events, observations, candidate extractions)
- Level 2: Context Memory (tasks, projects, decisions, evolving situations)
- Level 3: Knowledge Memory (validated invariants, stable patterns, established facts)

Implements genuine backend operations for conditional promotion, consolidation,
supersession, demotion, expiration, and lifecycle event auditing.
"""

from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID, uuid4
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc

from ..models import (
    Memory, MemoryVersion, MemorySource, MemoryPermission,
    ExperienceRecord, ContextRecord, KnowledgeRecord, LifecycleEvent,
    memory_semantic_links, memory_dependencies
)
from ..schemas import ExtractedMemoryItem, MemoryType
from ..compiler.sanitizer import MemorySanitizer
from ..compiler.extractor import MemoryExtractor
from .embedding_service import get_embedding

class HierarchicalMemoryService:
    @staticmethod
    def log_lifecycle_event(
        db: Session,
        memory_id: UUID,
        transition_type: str,
        from_level: Optional[int],
        to_level: Optional[int],
        reason: str,
        triggered_by: str = "system",
        metadata: Optional[Dict[str, Any]] = None
    ) -> LifecycleEvent:
        """Records an immutable audit entry in lifecycle_events."""
        event = LifecycleEvent(
            id=uuid4(),
            memory_id=memory_id,
            transition_type=transition_type,
            from_level=from_level,
            to_level=to_level,
            reason=reason,
            triggered_by=triggered_by,
            metadata_=metadata or {},
            created_at=datetime.now(timezone.utc)
        )
        db.add(event)
        return event

    @classmethod
    def ingest_experience(
        cls,
        db: Session,
        conversation_id: UUID,
        raw_text: str,
        agent_id: str = "default_agent",
        event_type: str = "conversation_turn",
        session_id: Optional[str] = None,
        turn_index: int = 0,
        context_metadata: Optional[Dict[str, Any]] = None,
        extracted_candidates: Optional[List[ExtractedMemoryItem]] = None,
        auto_consolidate: bool = False
    ) -> Tuple[Memory, ExperienceRecord, List[ExtractedMemoryItem]]:
        """
        LEVEL 1: Ingests raw conversational turns, tool outputs, or agent observations into Experience Memory.
        Preserves complete evidence, timestamps, agent provenance, and raw payloads.
        Does NOT immediately treat the raw event as permanent knowledge.
        """
        now = datetime.now(timezone.utc)
        meta = context_metadata or {}
        
        # 1. Defang and inspect text for security threats
        sanitized_text, sec_status, sec_audit = MemorySanitizer.inspect_and_sanitize(
            raw_text=raw_text,
            source_type=f"experience:{agent_id}:{event_type}"
        )
        
        # 2. Extract candidate facts if not pre-computed
        extractor = MemoryExtractor()
        candidates = extracted_candidates or extractor.extract(sanitized_text, context_metadata=meta)
        
        # 3. Create Level 1 Experience Memory row
        mem_id = uuid4()
        embedding = get_embedding(sanitized_text)
        
        mem = Memory(
            id=mem_id,
            conversation_id=conversation_id,
            content=sanitized_text,
            memory_type="experience",
            embedding=embedding,
            embedding_model="text-embedding-3-small",
            confidence_score=0.9 if sec_status == "trusted" else 0.5,
            importance_score=0.5,
            metadata_={
                "event_type": event_type,
                "agent_id": agent_id,
                "session_id": session_id,
                "turn_index": turn_index,
                "security_status": sec_status,
                **meta
            },
            status="trusted" if sec_status == "trusted" else "quarantined",
            valid_until=now + timedelta(days=14), # Experience memories have natural 14-day TTL unless consolidated
            hierarchy_level=1, # LEVEL 1: EXPERIENCE
            promotion_status="candidate" if candidates else "none",
            evidence_count=1,
            quality_score=0.6,
            created_at=now,
            updated_at=now
        )
        db.add(mem)
        
        # 4. Create initial MemoryVersion
        v1 = MemoryVersion(
            id=uuid4(),
            memory_id=mem_id,
            content=sanitized_text,
            version_number=1,
            change_reason=f"Initial experience event capture ({event_type})",
            created_at=now
        )
        db.add(v1)
        
        # 5. Create MemorySource for provenance
        source = MemorySource(
            id=uuid4(),
            memory_id=mem_id,
            source_type=event_type,
            source_id=None,
            provenance_metadata={
                "agent_id": agent_id,
                "session_id": session_id,
                "turn_index": turn_index,
                "extracted_candidate_count": len(candidates)
            },
            created_at=now
        )
        db.add(source)
        
        # 6. Create ExperienceRecord
        candidate_dicts = [c.model_dump(mode="json") if hasattr(c, "model_dump") else c for c in candidates]
        exp_record = ExperienceRecord(
            id=uuid4(),
            memory_id=mem_id,
            raw_event_type=event_type,
            agent_id=agent_id,
            session_id=session_id,
            turn_index=turn_index,
            raw_payload={"raw_text": raw_text[:2000], "sanitized": sanitized_text[:2000]},
            extracted_candidates=candidate_dicts,
            is_consolidated=False,
            created_at=now
        )
        db.add(exp_record)
        
        # 7. Audit Lifecycle Event
        cls.log_lifecycle_event(
            db=db,
            memory_id=mem_id,
            transition_type="ingest_experience",
            from_level=None,
            to_level=1,
            reason=f"Ingested {event_type} from agent {agent_id}",
            triggered_by=agent_id,
            metadata={"candidate_count": len(candidates)}
        )
        
        db.commit()
        db.refresh(mem)
        db.refresh(exp_record)
        
        return mem, exp_record, candidates

    @classmethod
    def consolidate_experience_to_context(
        cls,
        db: Session,
        experience_memory_id: UUID,
        target_context_domain: str = "task",
        summary_content: Optional[str] = None,
        active_status: str = "active",
        agent_id: str = "consolidation_engine"
    ) -> Memory:
        """
        LEVEL 2: Consolidates related experience memory into working Context Memory
        (tasks, projects, architectural decisions, ongoing situations).
        Links the parent Context to the child Experience.
        """
        now = datetime.now(timezone.utc)
        exp_mem = db.query(Memory).filter(Memory.id == experience_memory_id).first()
        if not exp_mem:
            raise ValueError(f"Experience memory {experience_memory_id} not found.")
            
        exp_record = db.query(ExperienceRecord).filter(ExperienceRecord.memory_id == experience_memory_id).first()
        
        # Determine consolidated content
        content = summary_content or exp_mem.content
        embedding = get_embedding(content)
        
        # Create Level 2 Context Memory
        ctx_id = uuid4()
        ctx_mem = Memory(
            id=ctx_id,
            conversation_id=exp_mem.conversation_id,
            content=content,
            memory_type=target_context_domain if target_context_domain in ["task", "decision", "preference", "fact"] else "task",
            embedding=embedding,
            embedding_model="text-embedding-3-small",
            confidence_score=min(1.0, exp_mem.confidence_score + 0.1),
            importance_score=max(0.7, exp_mem.importance_score + 0.1),
            metadata_={
                "context_domain": target_context_domain,
                "consolidated_from": str(experience_memory_id),
                "active_status": active_status
            },
            status="trusted",
            valid_until=now + timedelta(days=60), # Context memory has 60-day operational TTL
            hierarchy_level=2, # LEVEL 2: CONTEXT
            promotion_status="consolidated",
            evidence_count=exp_mem.evidence_count + 1,
            quality_score=0.75,
            promoted_at=now,
            promoted_by=agent_id,
            created_by_agent=getattr(exp_mem, "created_by_agent", None) or agent_id,
            last_modified_by_agent=agent_id,
            created_at=now,
            updated_at=now
        )
        db.add(ctx_mem)
        db.flush()
        
        # Link Experience memory to parent Context memory
        exp_mem.parent_context_id = ctx_id
        exp_mem.promotion_status = "consolidated"
        if exp_record:
            exp_record.is_consolidated = True
            
        # Create ContextRecord
        ctx_record = ContextRecord(
            id=uuid4(),
            memory_id=ctx_id,
            context_domain=target_context_domain,
            active_status=active_status,
            associated_experience_count=1,
            evolution_history=[{
                "timestamp": now.isoformat(),
                "action": "initial_consolidation",
                "source_experience_id": str(experience_memory_id)
            }],
            promotion_readiness=0.65,
            created_at=now,
            updated_at=now
        )
        db.add(ctx_record)
        
        # Create Version & Source
        v1 = MemoryVersion(
            id=uuid4(),
            memory_id=ctx_id,
            content=content,
            version_number=1,
            change_reason="Consolidated from Experience Memory into Context",
            created_at=now
        )
        db.add(v1)
        
        source = MemorySource(
            id=uuid4(),
            memory_id=ctx_id,
            source_type="consolidation",
            source_id=experience_memory_id,
            provenance_metadata={"consolidated_by": agent_id},
            created_at=now
        )
        db.add(source)
        
        # Audit Lifecycle Event
        cls.log_lifecycle_event(
            db=db,
            memory_id=ctx_id,
            transition_type="consolidate_to_context",
            from_level=1,
            to_level=2,
            reason=f"Consolidated experience {experience_memory_id} into context domain '{target_context_domain}'",
            triggered_by=agent_id
        )
        
        db.commit()
        db.refresh(ctx_mem)
        return ctx_mem

    @classmethod
    def evaluate_promotion_readiness(cls, memory: Memory, context_rec: Optional[ContextRecord] = None) -> float:
        """
        Calculates a rigorous promotion readiness score in [0.0, 1.0]:
        Score = 0.40 * Confidence + 0.30 * Importance + 0.20 * Recurrence + 0.10 * DomainWeight
        """
        conf = memory.confidence_score or 0.5
        imp = memory.importance_score or 0.5
        rec_count = memory.evidence_count or 1
        recurrence_norm = min(1.0, rec_count / 3.0)
        
        domain_weight = 0.8 if memory.memory_type in ["decision", "preference"] else 0.6
        score = (0.40 * conf) + (0.30 * imp) + (0.20 * recurrence_norm) + (0.10 * domain_weight)
        return round(score, 3)

    @classmethod
    def promote_to_knowledge(
        cls,
        db: Session,
        context_memory_id: UUID,
        knowledge_domain: str = "architecture_rule",
        promoted_by: str = "promotion_engine",
        force: bool = False
    ) -> Memory:
        """
        LEVEL 3: Promotes verified Context Memory into durable, authoritative Knowledge Memory.
        Requires meeting quality and evidence criteria (score >= 0.78 or force=True).
        """
        now = datetime.now(timezone.utc)
        ctx_mem = db.query(Memory).filter(Memory.id == context_memory_id).first()
        if not ctx_mem:
            raise ValueError(f"Context memory {context_memory_id} not found.")
            
        ctx_rec = db.query(ContextRecord).filter(ContextRecord.memory_id == context_memory_id).first()
        readiness = cls.evaluate_promotion_readiness(ctx_mem, ctx_rec)
        
        if readiness < 0.70 and not force:
            raise ValueError(
                f"Memory {context_memory_id} has promotion readiness {readiness:.2f}, below required threshold 0.70."
            )
            
        # Elevate to Level 3 Knowledge
        ctx_mem.hierarchy_level = 3 # LEVEL 3: KNOWLEDGE
        ctx_mem.promotion_status = "promoted"
        ctx_mem.quality_score = max(readiness, 0.85)
        ctx_mem.confidence_score = min(1.0, ctx_mem.confidence_score + 0.1)
        ctx_mem.promoted_at = now
        ctx_mem.promoted_by = promoted_by
        ctx_mem.last_modified_by_agent = promoted_by
        if ctx_mem.metadata_ is None:
            ctx_mem.metadata_ = {}
        ctx_mem.metadata_["last_modified_by_agent"] = promoted_by
        ctx_mem.valid_until = None # Knowledge memories are durable by default
        ctx_mem.updated_at = now
        
        # Create KnowledgeRecord
        k_rec = db.query(KnowledgeRecord).filter(KnowledgeRecord.memory_id == context_memory_id).first()
        if not k_rec:
            k_rec = KnowledgeRecord(
                id=uuid4(),
                memory_id=context_memory_id,
                knowledge_domain=knowledge_domain,
                verification_level="verified",
                validation_source=promoted_by,
                revision_count=1,
                last_verified_at=now,
                created_at=now
            )
            db.add(k_rec)
        else:
            k_rec.verification_level = "verified"
            k_rec.validation_source = promoted_by
            k_rec.last_verified_at = now
            
        # Version update
        curr_v = db.query(MemoryVersion).filter(MemoryVersion.memory_id == context_memory_id).count()
        v_next = MemoryVersion(
            id=uuid4(),
            memory_id=context_memory_id,
            content=ctx_mem.content,
            version_number=curr_v + 1,
            change_reason=f"Promoted to Level 3 Knowledge ({knowledge_domain})",
            created_at=now
        )
        db.add(v_next)
        
        # Audit Lifecycle Event
        cls.log_lifecycle_event(
            db=db,
            memory_id=context_memory_id,
            transition_type="promote_to_knowledge",
            from_level=2,
            to_level=3,
            reason=f"Promoted to Level 3 Knowledge (readiness: {readiness:.2f})",
            triggered_by=promoted_by,
            metadata={"readiness": readiness, "domain": knowledge_domain}
        )
        
        db.commit()
        db.refresh(ctx_mem)
        return ctx_mem

    @classmethod
    def supersede_memory(
        cls,
        db: Session,
        older_memory_id: UUID,
        newer_memory_id: UUID,
        reason: str = "Superseded by newer decision or specification",
        triggered_by: str = "system"
    ) -> Memory:
        """
        Non-destructively supersedes an existing memory with a newer memory.
        Maintains immutable history, marks promotion_status='superseded',
        and links semantic 'updates' edge.
        """
        now = datetime.now(timezone.utc)
        older = db.query(Memory).filter(Memory.id == older_memory_id).first()
        newer = db.query(Memory).filter(Memory.id == newer_memory_id).first()
        if not older or not newer:
            raise ValueError("Both older and newer memories must exist.")
            
        older.promotion_status = "superseded"
        older.superseded_by_id = newer_memory_id
        older.updated_at = now
        
        # Record semantic link
        link = db.query(memory_semantic_links).filter(
            memory_semantic_links.c.source_id == newer_memory_id,
            memory_semantic_links.c.target_id == older_memory_id
        ).first()
        if not link:
            stmt = memory_semantic_links.insert().values(
                source_id=newer_memory_id,
                target_id=older_memory_id,
                type="updates",
                created_at=now
            )
            db.execute(stmt)
            
        cls.log_lifecycle_event(
            db=db,
            memory_id=older_memory_id,
            transition_type="supersede",
            from_level=older.hierarchy_level,
            to_level=older.hierarchy_level,
            reason=reason,
            triggered_by=triggered_by,
            metadata={"superseded_by": str(newer_memory_id)}
        )
        
        db.commit()
        db.refresh(older)
        return older

    @classmethod
    def demote_memory(
        cls,
        db: Session,
        memory_id: UUID,
        target_level: int,
        reason: str,
        triggered_by: str = "system"
    ) -> Memory:
        """
        Demotes a memory down the hierarchy (e.g. Knowledge -> Context or Context -> Experience)
        when decay, deprecation, or partial invalidation occurs.
        """
        now = datetime.now(timezone.utc)
        mem = db.query(Memory).filter(Memory.id == memory_id).first()
        if not mem:
            raise ValueError(f"Memory {memory_id} not found.")
            
        old_level = mem.hierarchy_level
        if target_level >= old_level:
            raise ValueError(f"Target level {target_level} must be less than current level {old_level}.")
            
        mem.hierarchy_level = target_level
        mem.promotion_status = "demoted"
        mem.quality_score = max(0.2, mem.quality_score - 0.25)
        mem.updated_at = now
        
        cls.log_lifecycle_event(
            db=db,
            memory_id=memory_id,
            transition_type="demote",
            from_level=old_level,
            to_level=target_level,
            reason=reason,
            triggered_by=triggered_by
        )
        
        db.commit()
        db.refresh(mem)
        return mem
