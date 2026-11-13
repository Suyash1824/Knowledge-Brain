"""
Knowledge Brain Background Ingestion & Consolidation Worker.
Executes asynchronous memory consolidation, promotion sweeps, and expiration pruning.
Runs either as a standalone process (Docker background worker) or within FastAPI background tasks.
"""

import os
import sys
import time
import logging
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

# Ensure module path resolution
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(os.path.dirname(current_dir))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database import get_engine, SessionLocal
from app.models import (
    Memory, ExperienceRecord, ContextRecord, KnowledgeRecord, LifecycleEvent
)
from app.services.hierarchical_service import HierarchicalMemoryService
from app.schemas import ExtractedMemoryItem

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [KnowledgeBrain-Worker] [%(levelname)s] %(message)s"
)
logger = logging.getLogger("knowledge-brain-worker")

class IngestionWorker:
    def __init__(self, poll_interval_seconds: int = 10):
        self.poll_interval = poll_interval_seconds
        self.running = False

    def process_unconsolidated_experiences(self, db: Session) -> int:
        """
        Gathers unconsolidated Level 1 Experience records, performs semantic grouping,
        and consolidates them into Level 2 Context memories.
        """
        unconsolidated = db.query(ExperienceRecord).filter(
            ExperienceRecord.is_consolidated == False
        ).limit(50).all()

        if not unconsolidated:
            return 0

        consolidated_count = 0
        for exp in unconsolidated:
            try:
                candidates_raw = exp.extracted_candidates or []
                candidates = [ExtractedMemoryItem(**c) for c in candidates_raw if isinstance(c, dict)]
                
                if candidates:
                    # Select top candidate
                    top_cand = max(candidates, key=lambda c: c.importance_score)
                    ctx_domain = top_cand.memory_type if top_cand.memory_type in ["task", "decision", "preference"] else "task"
                    
                    HierarchicalMemoryService.consolidate_experience_to_context(
                        db=db,
                        experience_memory_id=exp.memory_id,
                        target_context_domain=ctx_domain,
                        summary_content=top_cand.content,
                        active_status="active",
                        agent_id="background_worker"
                    )
                    consolidated_count += 1
                else:
                    # No candidates extracted; mark consolidated to avoid re-scanning
                    exp.is_consolidated = True
                    db.commit()
            except Exception as e:
                logger.error(f"Error consolidating experience {exp.id}: {e}")
                db.rollback()

        return consolidated_count

    def evaluate_pending_promotions(self, db: Session) -> int:
        """
        Evaluates Level 2 Context records that have accumulated corroborating evidence
        and promotes qualifying items to Level 3 Knowledge.
        """
        candidates = db.query(Memory).filter(
            Memory.hierarchy_level == 2,
            Memory.status == "trusted",
            Memory.evidence_count >= 2,
            Memory.importance_score >= 0.80
        ).limit(20).all()

        promoted_count = 0
        for mem in candidates:
            try:
                HierarchicalMemoryService.promote_to_knowledge(
                    db=db,
                    context_memory_id=mem.id,
                    knowledge_domain="architecture_rule" if mem.memory_type == "decision" else "stable_preference",
                    promoted_by="background_promotion_worker",
                    force=False
                )
                promoted_count += 1
            except Exception as e:
                logger.debug(f"Memory {mem.id} not yet ready for promotion: {e}")

        return promoted_count

    def sweep_expired_memories(self, db: Session) -> int:
        """
        Identifies memories that have passed their valid_until threshold
        and applies non-destructive expiration state.
        """
        now = datetime.now(timezone.utc)
        expired = db.query(Memory).filter(
            Memory.valid_until != None,
            Memory.valid_until < now,
            Memory.status != "revoked",
            Memory.hierarchy_level < 3 # Never expire verified Knowledge
        ).all()

        count = 0
        for m in expired:
            m.status = "revoked"
            HierarchicalMemoryService.log_lifecycle_event(
                db=db,
                memory_id=m.id,
                transition_type="expire",
                from_level=m.hierarchy_level,
                to_level=m.hierarchy_level,
                reason=f"Temporal validity window expired at {m.valid_until}",
                triggered_by="background_worker"
            )
            count += 1

        if count > 0:
            db.commit()
        return count

    def run_cycle(self, db: Session) -> dict:
        """Executes a single maintenance and consolidation cycle."""
        consolidated = self.process_unconsolidated_experiences(db)
        promoted = self.evaluate_pending_promotions(db)
        expired = self.sweep_expired_memories(db)
        return {
            "consolidated": consolidated,
            "promoted": promoted,
            "expired": expired
        }

    def start(self):
        """Continuous background execution loop for standalone Docker worker."""
        self.running = True
        logger.info("Knowledge Brain Background Ingestion & Consolidation Worker started.")
        while self.running:
            if SessionLocal is not None:
                db = SessionLocal()
                try:
                    stats = self.run_cycle(db)
                    if stats["consolidated"] > 0 or stats["promoted"] > 0 or stats["expired"] > 0:
                        logger.info(f"Worker cycle completed: {stats}")
                except Exception as e:
                    logger.error(f"Worker cycle failed: {e}")
                finally:
                    db.close()
            time.sleep(self.poll_interval)

    def stop(self):
        self.running = False
        logger.info("Knowledge Brain Worker stopped.")

if __name__ == "__main__":
    worker = IngestionWorker(poll_interval_seconds=10)
    try:
        worker.start()
    except KeyboardInterrupt:
        worker.stop()

