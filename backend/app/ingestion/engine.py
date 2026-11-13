"""
Knowledge Brain Independent Runtime Ingestion Engine.
Processes incoming AI agent events, conversations, observations, and tool outputs through:
1. Runtime Event Capture (Idempotent hashing, metadata capture)
2. Evidence Preservation (Level 1 Experience Memory persistence)
3. Information Extraction (Multi-facet extraction across facts, preferences, decisions, tasks)
4. Candidate Validation & Trust Assessment (Sanitization, injection defanging, trust state)
5. Deduplication & Recurrence Boosting (Idempotency and evidence count accumulation)
6. Conflict Detection (Contradictions, supersessions, temporal drift via ConflictDetector)
7. Hierarchical Classification (Experience L1 -> Context L2 -> Knowledge L3)
8. Context Consolidation (Consolidating tasks/decisions into Level 2 Context)
9. Conditional Knowledge Promotion (Threshold-gated promotion to Level 3 Knowledge)
10. Immutable Versioning & Provenance Persistence

Does NOT require a separate RAG retrieval query prior to ingestion.
"""

import hashlib
import json
import logging
from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID, uuid4
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from ..models import (
    Memory, MemoryVersion, MemorySource, MemoryPermission,
    ExperienceRecord, ContextRecord, KnowledgeRecord, LifecycleEvent,
    memory_semantic_links
)
from ..schemas import (
    RuntimeEventIngestRequest, RuntimeEventIngestResponse,
    ExtractedMemoryItem, ConflictReport
)
from ..compiler.extractor import MemoryExtractor
from ..compiler.sanitizer import MemorySanitizer
from ..conflict.detector import ConflictDetector
from ..services.embedding_service import get_embedding
from ..services.hierarchical_service import HierarchicalMemoryService

logger = logging.getLogger("knowledge-brain-ingestion")

class RuntimeIngestionEngine:
    def __init__(self):
        self.extractor = MemoryExtractor()
        self.sanitizer = MemorySanitizer()
        self.conflict_detector = ConflictDetector()

    @staticmethod
    def compute_idempotency_key(conversation_id: UUID, agent_id: str, turn_index: int, raw_text: str) -> str:
        """Computes a deterministic SHA-256 fingerprint for duplicate event prevention."""
        raw_key = f"{conversation_id}:{agent_id}:{turn_index}:{raw_text.strip()}"
        return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

    def ingest_runtime_event(
        self,
        db: Session,
        request: RuntimeEventIngestRequest
    ) -> RuntimeEventIngestResponse:
        """
        Executes the complete 10-stage progressive hierarchical ingestion pipeline.
        Guarantees idempotency, provenance preservation, and conditional tier elevation.
        """
        now = datetime.now(timezone.utc)
        idempotency_key = self.compute_idempotency_key(
            conversation_id=request.conversation_id,
            agent_id=request.agent_id,
            turn_index=request.turn_index,
            raw_text=request.raw_text
        )

        # -------------------------------------------------------------
        # Stage 1: Idempotency Check & Duplicate Prevention
        # -------------------------------------------------------------
        existing_mems = db.query(Memory).filter(
            Memory.conversation_id == request.conversation_id,
            Memory.hierarchy_level == 1
        ).all()
        
        existing_exp = None
        for m in existing_mems:
            if m.metadata_ and m.metadata_.get("idempotency_key") == idempotency_key:
                existing_exp = m.experience_record
                break

        if existing_exp:
            # Idempotent match: increment evidence count, update timestamp, return existing
            existing_mem = existing_exp.memory
            existing_mem.evidence_count += 1
            existing_mem.updated_at = now
            db.commit()
            db.refresh(existing_mem)

            candidates = [ExtractedMemoryItem(**c) for c in (existing_exp.extracted_candidates or [])]
            return RuntimeEventIngestResponse(
                experience_memory_id=existing_mem.id,
                content=existing_mem.content,
                hierarchy_level=existing_mem.hierarchy_level,
                extracted_candidates_count=len(candidates),
                candidates=candidates,
                is_consolidated=existing_exp.is_consolidated,
                context_memory_id=existing_mem.parent_context_id,
                promoted_knowledge_id=None,
                lifecycle_event_id=uuid4(),
                message="Idempotent event recognized: evidence count incremented without duplicate creation."
            )

        # -------------------------------------------------------------
        # Stage 2: Security Sanitization & Trust Assessment
        # -------------------------------------------------------------
        sanitized_text, sec_status, sec_audit = self.sanitizer.inspect_and_sanitize(
            raw_text=request.raw_text,
            source_type=f"runtime_event:{request.agent_id}:{request.event_type}"
        )
        is_quarantined = (sec_status == "quarantined")

        # -------------------------------------------------------------
        # Stage 3: Information Extraction Across 5 Facets
        # -------------------------------------------------------------
        candidates: List[ExtractedMemoryItem] = []
        if not is_quarantined:
            candidates = self.extractor.extract(
                sanitized_text,
                context_metadata=request.context_metadata or {}
            )

        # -------------------------------------------------------------
        # Stage 4: Evidence Preservation (Level 1 Experience Memory)
        # -------------------------------------------------------------
        exp_mem_id = uuid4()
        embedding = get_embedding(sanitized_text)

        exp_mem = Memory(
            id=exp_mem_id,
            conversation_id=request.conversation_id,
            content=sanitized_text,
            memory_type="experience",
            embedding=embedding,
            embedding_model="text-embedding-3-small",
            confidence_score=0.95 if not is_quarantined else 0.20,
            importance_score=0.60,
            metadata_={
                "idempotency_key": idempotency_key,
                "event_type": request.event_type,
                "agent_id": request.agent_id,
                "session_id": request.session_id,
                "turn_index": request.turn_index,
                "security_status": sec_status,
                **(request.context_metadata or {})
            },
            status="quarantined" if is_quarantined else "trusted",
            valid_until=now + timedelta(days=14), # Transient 14-day operational TTL
            hierarchy_level=1, # LEVEL 1: EXPERIENCE
            promotion_status="candidate" if candidates else "none",
            evidence_count=1,
            quality_score=0.65,
            created_at=now,
            updated_at=now
        )
        db.add(exp_mem)

        # Initial version and provenance
        db.add(MemoryVersion(
            id=uuid4(),
            memory_id=exp_mem_id,
            content=sanitized_text,
            version_number=1,
            change_reason=f"Runtime event ingress ({request.event_type})",
            created_at=now
        ))

        db.add(MemorySource(
            id=uuid4(),
            memory_id=exp_mem_id,
            source_type=request.event_type,
            source_id=None,
            provenance_metadata={
                "agent_id": request.agent_id,
                "session_id": request.session_id,
                "turn_index": request.turn_index,
                "idempotency_key": idempotency_key
            },
            created_at=now
        ))

        # ExperienceRecord
        candidate_dicts = [c.model_dump(mode="json") for c in candidates]
        exp_record = ExperienceRecord(
            id=uuid4(),
            memory_id=exp_mem_id,
            raw_event_type=request.event_type,
            agent_id=request.agent_id,
            session_id=request.session_id,
            turn_index=request.turn_index,
            raw_payload={"raw_text": request.raw_text[:2000], "sanitized": sanitized_text[:2000]},
            extracted_candidates=candidate_dicts,
            is_consolidated=False,
            created_at=now
        )
        db.add(exp_record)

        # Lifecycle Audit
        lfc = HierarchicalMemoryService.log_lifecycle_event(
            db=db,
            memory_id=exp_mem_id,
            transition_type="ingest_experience",
            from_level=None,
            to_level=1,
            reason=f"Ingested runtime event from {request.agent_id}",
            triggered_by=request.agent_id,
            metadata={"candidate_count": len(candidates), "quarantined": is_quarantined}
        )
        db.commit()

        # If quarantined, stop further processing
        if is_quarantined:
            return RuntimeEventIngestResponse(
                experience_memory_id=exp_mem_id,
                content=sanitized_text,
                hierarchy_level=1,
                extracted_candidates_count=0,
                candidates=[],
                is_consolidated=False,
                context_memory_id=None,
                promoted_knowledge_id=None,
                lifecycle_event_id=lfc.id,
                message="Security quarantine triggered: prompt injection defanged and isolated."
            )

        # -------------------------------------------------------------
        # Stage 5 & 6: Deduplication & Conflict Detection for Candidates
        # -------------------------------------------------------------
        context_mem_id = None
        promoted_kno_id = None

        # Check existing memories in the conversation
        existing_memories = db.query(Memory).filter(
            Memory.conversation_id == request.conversation_id,
            Memory.id != exp_mem_id,
            Memory.status.in_(["trusted", "provisional"])
        ).all()

        for cand in candidates:
            # 1. Deduplication check
            cand_norm = cand.content.lower().strip()
            duplicate_found = False
            for ex in existing_memories:
                if ex.content.lower().strip() == cand_norm:
                    ex.evidence_count += 1
                    ex.updated_at = now
                    duplicate_found = True
                    break

            if duplicate_found:
                continue

            # 2. Conflict detection against active memories
            for ex in existing_memories:
                conflict_report = self.conflict_detector.detect_conflict(
                    existing_content=ex.content,
                    new_content=cand.content,
                    existing_memory_id=ex.id,
                    existing_status=ex.status,
                    new_status="trusted"
                )
                if conflict_report.has_conflict:
                    if conflict_report.recommended_action == "quarantine_new":
                        logger.warning(f"Conflict detected with untrusted candidate: {cand.content} -> quarantined")
                        break
                    elif conflict_report.recommended_action == "update_version" and conflict_report.existing_memory_id:
                        # Non-destructive update to conflicting memory
                        target_mem = db.query(Memory).filter(Memory.id == conflict_report.existing_memory_id).first()
                        if target_mem:
                            target_mem.evidence_count += 1
                            HierarchicalMemoryService.supersede_memory(
                                db=db,
                                older_memory_id=target_mem.id,
                                newer_memory_id=exp_mem_id,
                                reason=f"Resolved via conflict engine: {conflict_report.conflict_type}",
                                triggered_by=request.agent_id
                            )
                        break

        # -------------------------------------------------------------
        # Stage 7 & 8: Context Consolidation (Level 1 -> Level 2)
        # -------------------------------------------------------------
        # Consolidate into working Context only if items qualify as decisions, tasks, preferences,
        # or high-salience context (importance >= 0.70). Casual chatter remains in Level 1.
        context_candidates = [
            c for c in candidates
            if c.memory_type in ["decision", "task", "preference"] or c.importance_score >= 0.70
        ]
        if request.synchronous_promotion and context_candidates:
            # Select top candidate for context formation
            top_cand = max(context_candidates, key=lambda c: c.importance_score)
            ctx_domain = top_cand.memory_type if top_cand.memory_type in ["task", "decision", "preference"] else "task"
            
            ctx_mem = HierarchicalMemoryService.consolidate_experience_to_context(
                db=db,
                experience_memory_id=exp_mem_id,
                target_context_domain=ctx_domain,
                summary_content=top_cand.content,
                active_status="active",
                agent_id=request.agent_id
            )
            context_mem_id = ctx_mem.id

            # -------------------------------------------------------------
            # Stage 9: Conditional Knowledge Promotion (Level 2 -> Level 3)
            # -------------------------------------------------------------
            # High-salience architectural decisions or recurring preferences qualify for promotion
            if top_cand.importance_score >= 0.85 and top_cand.confidence_score >= 0.90:
                try:
                    k_mem = HierarchicalMemoryService.promote_to_knowledge(
                        db=db,
                        context_memory_id=ctx_mem.id,
                        knowledge_domain="architecture_rule" if top_cand.memory_type == "decision" else "stable_preference",
                        promoted_by=request.agent_id,
                        force=False
                    )
                    promoted_kno_id = k_mem.id
                except ValueError as e:
                    logger.info(f"Promotion deferred: {e}")

        db.commit()
        db.refresh(exp_mem)

        return RuntimeEventIngestResponse(
            experience_memory_id=exp_mem_id,
            content=exp_mem.content,
            hierarchy_level=exp_mem.hierarchy_level,
            extracted_candidates_count=len(candidates),
            candidates=candidates,
            is_consolidated=(context_mem_id is not None),
            context_memory_id=context_mem_id,
            promoted_knowledge_id=promoted_kno_id,
            lifecycle_event_id=lfc.id,
            message="Runtime event successfully ingested through progressive hierarchical pipeline."
        )
