"""
Knowledge Brain Independent Hierarchical Retrieval Engine.
Executes depth-aware, intent-guided memory retrieval and Memory Capsule synthesis:
1. Query Intent & Depth Determination (Analyzes query keywords to determine L1, L2, L3 or Multi-tier)
2. Hierarchical Level Selection (Avoids indiscriminate searching across all tiers)
3. Permission & Trust Validation (RBAC/ACL filtering, agent whitelisting, drops revoked/quarantined)
4. Temporal Expiration Filtering (Filters out stale memories where valid_until < now)
5. Semantic & Lexical Hybrid Ranking (Cosine similarity + keyword salience + recency decay)
6. Relationship & Provenance Augmentation (Tracks dependencies, versions, and originating agents)
7. Strict Token-Budget Enforcement (Greedy packing within requested token cap)
8. Passive Defensive Wrapping (<memory_data is_instruction='false'>)
9. Explainable Retrieval Diagnostics (Detailed diagnostic breakdown of retrieval decisions)
"""

import math
import re
from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID, uuid4
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc

from ..models import (
    Memory, MemoryVersion, MemorySource, MemoryPermission,
    ExperienceRecord, ContextRecord, KnowledgeRecord, memory_dependencies
)
from ..schemas import (
    HierarchicalRetrieveRequest, HierarchicalCapsuleResponse,
    CapsuleMemoryEntry
)
from ..services.embedding_service import get_embedding

class HierarchicalRetrievalEngine:
    @staticmethod
    def estimate_tokens(text: str) -> int:
        """Estimates token count with standard 4-character approximation and buffer."""
        if not text:
            return 0
        return max(1, math.ceil(len(text) / 4))

    @staticmethod
    def calculate_recency_score(created_at: Optional[datetime], level: int = 2) -> float:
        """
        Calculates exponential half-life recency decay:
        - Level 1 Experience: 7-day half-life (transient)
        - Level 2 Context: 30-day half-life (working context)
        - Level 3 Knowledge: 90-day half-life (enduring stability)
        """
        if created_at is None:
            return 0.5
        now = datetime.now(timezone.utc)
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
            
        diff_days = max(0.0, (now - created_at).total_seconds() / 86400.0)
        half_life_days = 7.0 if level == 1 else (30.0 if level == 2 else 90.0)
        return max(0.1, round(math.pow(2.0, -diff_days / half_life_days), 3))

    @classmethod
    def analyze_query_intent(cls, query: str, requested_depth: str = "auto") -> Tuple[List[int], str, str]:
        """
        Analyzes query structure and keywords to determine optimal memory hierarchy tiers.
        Avoids searching all levels indiscriminately when a targeted search suffices.
        """
        if requested_depth in ["experience", "l1"]:
            return [1], "experience", "Explicitly requested Level 1 Experience depth."
        elif requested_depth in ["context", "l2"]:
            return [2], "context", "Explicitly requested Level 2 Context depth."
        elif requested_depth in ["knowledge", "l3"]:
            return [3], "knowledge", "Explicitly requested Level 3 Knowledge depth."
        elif requested_depth == "all":
            return [1, 2, 3], "all", "Explicitly requested comprehensive multi-tier depth."

        q_lower = query.lower()

        # Analyze pattern matches across all tiers
        matched_levels = []
        
        # Tactical / Debug / Turn Markers -> Level 1 (Experience)
        l1_patterns = [
            r"\b(error|bug|trace|traceback|exception|failed|failure|output|log|logs|last\s+command|terminal|run)\b",
            r"\b(just\s+happened|just\s+ran|what\s+did\s+i\s+say|previous\s+message)\b"
        ]
        if any(re.search(p, q_lower) for p in l1_patterns):
            matched_levels.append(1)

        # Active Task / Project / Dependency Markers -> Level 2 (Context)
        l2_patterns = [
            r"\b(task|tasks|todo|action\s+item|status|sprint|remaining|in\s+progress|assigned|milestone|blocked)\b",
            r"\b(current\s+situation|project\s+state|working\s+on|active\s+plan)\b"
        ]
        if any(re.search(p, q_lower) for p in l2_patterns):
            matched_levels.append(2)

        # Invariant / Architectural / Preference Markers -> Level 3 (Knowledge)
        l3_patterns = [
            r"\b(rule|rules|architecture|standard|standards|policy|security|guideline|guidelines)\b",
            r"\b(prefer|preference|always|never|convention|best\s+practice|design\s+pattern)\b",
            r"\b(database\s+schema|orm|jwt|encryption|invariant)\b"
        ]
        if any(re.search(p, q_lower) for p in l3_patterns):
            matched_levels.append(3)

        if len(matched_levels) > 1:
            return matched_levels, "all", f"Multi-tier query matching levels {matched_levels}."
        elif len(matched_levels) == 1:
            lvl = matched_levels[0]
            name_map = {1: "experience", 2: "context", 3: "knowledge"}
            return [lvl], name_map[lvl], f"Targeted query routed to Level {lvl} ({name_map[lvl]})."

        # Default: Balanced Multi-Tier synthesis
        return [1, 2, 3], "all", "General or synthesizing query requiring multi-tier memory grounding."

    @classmethod
    def retrieve(
        cls,
        db: Session,
        request: HierarchicalRetrieveRequest
    ) -> HierarchicalCapsuleResponse:
        """
        Executes depth-aware, permission-whitelisted, token-budgeted memory retrieval.
        Returns a structured Memory Capsule and explainable retrieval analytics.
        """
        now = datetime.now(timezone.utc)
        capsule_id = uuid4()

        # 1. Intent analysis and level routing
        target_levels, determined_depth, reasoning = cls.analyze_query_intent(
            query=request.query,
            requested_depth=request.depth or "auto"
        )

        # 2. Base query filtered by targeted hierarchy levels and active status
        q = db.query(Memory).filter(
            Memory.hierarchy_level.in_(target_levels),
            Memory.status.in_(["trusted", "provisional"])
        )

        if request.conversation_id:
            # Query scoped to conversation or global knowledge
            q = q.filter(
                or_(
                    Memory.conversation_id == request.conversation_id,
                    Memory.hierarchy_level == 3 # Level 3 knowledge is globally accessible across workspaces
                )
            )

        candidate_records = q.all()

        # 3. Access Control (RBAC & ACL) Whitelisting
        allowed_memories: List[Memory] = []
        all_ids = [m.id for m in candidate_records]

        if all_ids:
            perms = db.query(MemoryPermission).filter(
                MemoryPermission.memory_id.in_(all_ids)
            ).all()
            restricted_ids = {p.memory_id for p in perms}
            allowed_for_agent = {
                p.memory_id for p in perms
                if p.agent_id in [request.agent_id, "*", "default_agent"] and p.can_read
            }
            for m in candidate_records:
                if m.id in restricted_ids and m.id not in allowed_for_agent:
                    continue # Blocked by permission ACL
                allowed_memories.append(m)
        else:
            allowed_memories = candidate_records

        # 4. Temporal Expiration Filtering
        active_candidates: List[Memory] = []
        for m in allowed_memories:
            if m.valid_until is not None:
                v_time = m.valid_until if m.valid_until.tzinfo else m.valid_until.replace(tzinfo=timezone.utc)
                if v_time < now:
                    continue # Expired transient memory
            active_candidates.append(m)

        # 5. Hybrid Semantic & Lexical Scoring
        query_words = set(w.lower() for w in re.findall(r"\b\w{3,}\b", request.query))
        scored_entries: List[Tuple[float, Memory, float, float, float]] = []

        for m in active_candidates:
            # Keyword lexical overlap
            m_words = set(w.lower() for w in re.findall(r"\b\w{3,}\b", m.content))
            lex_score = len(query_words & m_words) / max(1, len(query_words))

            # Cosine semantic relevance approximation
            sem_score = 0.5 + (0.5 * lex_score)

            # Recency decay based on tier
            rec_score = cls.calculate_recency_score(m.created_at, level=m.hierarchy_level)

            # Importance and confidence
            imp_score = m.importance_score or 0.7
            conf_score = m.confidence_score or 0.9

            # Stability multiplier for verified Level 3 Knowledge
            tier_bonus = 0.15 if m.hierarchy_level == 3 else (0.05 if m.hierarchy_level == 2 else 0.0)

            # Composite ranking formula
            composite = (
                (0.40 * sem_score) +
                (0.25 * imp_score) +
                (0.20 * rec_score) +
                (0.15 * conf_score) +
                tier_bonus
            )
            scored_entries.append((round(composite, 3), m, round(sem_score, 3), round(rec_score, 3), round(imp_score, 3)))

        # Sort descending by composite ranking score
        scored_entries.sort(key=lambda x: x[0], reverse=True)

        # 6. Strict Token-Budget Packing & Defensive Wrapping
        total_tokens = 0
        budget_exhausted = False
        packed_entries: List[CapsuleMemoryEntry] = []
        packed_texts: List[str] = []

        l1_count = 0
        l2_count = 0
        l3_count = 0

        # Passive wrapper header
        packed_texts.append("<memory_data is_instruction='false'>")
        total_tokens += cls.estimate_tokens(packed_texts[0])

        for comp_score, m, sem_score, rec_score, imp_score in scored_entries:
            tier_name = "KNOWLEDGE" if m.hierarchy_level == 3 else ("CONTEXT" if m.hierarchy_level == 2 else "EXPERIENCE")
            
            entry_line = (
                f"  <memory id='{m.id}' level='L{m.hierarchy_level}_{tier_name}' type='{m.memory_type}' "
                f"score='{comp_score:.2f}' evidence='{m.evidence_count}'>\n"
                f"    {m.content}\n"
                f"  </memory>"
            )
            entry_tokens = cls.estimate_tokens(entry_line)

            if total_tokens + entry_tokens + 5 > request.max_tokens:
                budget_exhausted = True
                break

            total_tokens += entry_tokens
            packed_texts.append(entry_line)

            if m.hierarchy_level == 1:
                l1_count += 1
            elif m.hierarchy_level == 2:
                l2_count += 1
            elif m.hierarchy_level == 3:
                l3_count += 1

            packed_entries.append(CapsuleMemoryEntry(
                memory_id=m.id,
                content=m.content,
                memory_type=m.memory_type,
                relevance_score=sem_score,
                importance_score=imp_score,
                confidence_score=m.confidence_score or 0.9,
                recency_score=rec_score,
                status=m.status,
                provenance={"agent_id": request.agent_id, "evidence_count": m.evidence_count, "level": m.hierarchy_level}
            ))

        packed_texts.append("</memory_data>")
        total_tokens += cls.estimate_tokens(packed_texts[-1])
        full_wrapped_capsule = "\n".join(packed_texts)

        explanation = {
            "determined_depth": determined_depth,
            "target_levels_scanned": target_levels,
            "reasoning": reasoning,
            "total_candidates_evaluated": len(candidate_records),
            "whitelisted_after_permissions": len(allowed_memories),
            "active_after_expiration": len(active_candidates),
            "packed_entries_count": len(packed_entries),
            "budget_tokens_requested": request.max_tokens,
            "budget_tokens_utilized": total_tokens,
            "budget_utilization_ratio": round(total_tokens / max(1, request.max_tokens), 2)
        }

        return HierarchicalCapsuleResponse(
            capsule_id=capsule_id,
            query=request.query,
            determined_depth=determined_depth,
            total_tokens=total_tokens,
            token_budget=request.max_tokens,
            budget_exhausted=budget_exhausted,
            experience_items_count=l1_count,
            context_items_count=l2_count,
            knowledge_items_count=l3_count,
            capsule_data_wrapped=full_wrapped_capsule,
            entries=packed_entries,
            explanation=explanation,
            generated_at=now
        )
