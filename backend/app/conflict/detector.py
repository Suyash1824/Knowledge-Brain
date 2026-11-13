"""
Conflict & Contradiction Detection Engine for Knowledge Brain.
Detects semantic contradictions, temporal drifts, and superseded facts.
Recommends conflict resolutions without silently overwriting existing knowledge.
"""

import re
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime, timezone
from ..schemas import ConflictReport

# Antonym and opposing semantic pairs for contradiction detection
OPPOSING_TERMS = [
    (r"\b(like|prefer|love|favor)\b", r"\b(dislike|hate|avoid|reject)\b"),
    (r"\balways\b", r"\bnever\b"),
    (r"\benable(d)?\b", r"\bdisable(d)?\b"),
    (r"\buse\b", r"\b(do\s+not\s+use|never\s+use|avoid|refrain\s+from)\b"),
    (r"\btrue\b", r"\bfalse\b"),
    (r"\byes\b", r"\bno\b"),
    (r"\blight\s+mode\b", r"\bdark\s+mode\b"),
    (r"\boption\s+a\b", r"\boption\s+b\b"),
    (r"\bonline\b", r"\boffline\b"),
    (r"\bactive\b", r"\binactive\b"),
    (r"\ballow(ed)?\b", r"\bdeny|denied|block|blocked\b"),
]

TEMPORAL_MARKERS = [
    r"\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b",
    r"\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\b",
    r"\b(?:\d{1,2}:\d{2}\s*(?:am|pm)?)\b",
    r"\b(?:\d{4}-\d{2}-\d{2})\b",
    r"\b(?:today|tomorrow|yesterday|next\s+week|this\s+weekend)\b"
]

class ConflictDetector:
    @staticmethod
    def detect_conflict(
        existing_content: str,
        new_content: str,
        existing_memory_id: Optional[UUID] = None,
        existing_status: str = "trusted",
        new_status: str = "trusted"
    ) -> ConflictReport:
        """
        Compares an existing memory against new candidate content to identify contradictions.
        Considers semantic opposites, temporal differences, superseding decisions, and source trust.
        """
        e_lower = existing_content.lower()
        n_lower = new_content.lower()
        
        # 1. Identical text -> No conflict
        if e_lower == n_lower:
            return ConflictReport(
                has_conflict=False,
                existing_memory_id=existing_memory_id,
                existing_content=existing_content,
                conflicting_content=new_content,
                conflict_type="none",
                confidence=1.0,
                recommended_action="none"
            )

        # 2. Extract shared keywords (filter common stopwords & grammatical markers)
        stopwords = {
            "this", "that", "with", "from", "have", "been", "were", "what",
            "when", "where", "user", "project", "system", "please", "should", "will",
            "decided", "chose", "chosen", "selected", "prefer", "preference",
            "choice", "adopt", "using", "implement", "implemented", "configure"
        }
        e_words = set(w for w in re.findall(r"\b\w{4,}\b", e_lower) if w not in stopwords)
        n_words = set(w for w in re.findall(r"\b\w{4,}\b", n_lower) if w not in stopwords)
        shared_keywords = e_words.intersection(n_words)
        
        if not shared_keywords:
            # Entirely distinct topics
            return ConflictReport(
                has_conflict=False,
                existing_memory_id=existing_memory_id,
                conflict_type="none",
                confidence=0.90,
                recommended_action="none"
            )

        # Helper to determine resolution action based on source trust states
        def resolve_action(confidence_val: float) -> str:
            # If an untrusted/provisional source contradicts a verified trusted memory, quarantine the new claim
            if existing_status == "trusted" and new_status in ["provisional", "quarantined"]:
                return "quarantine_new"
            # If confidence is lower or ambiguity exists, flag for human clarification
            if confidence_val < 0.85:
                return "flag_user"
            # Authoritative update
            return "update_version"

        # 3. Check for explicit antonym / negation clashes
        for pat1, pat2 in OPPOSING_TERMS:
            has_p1_in_e = bool(re.search(pat1, e_lower))
            has_p2_in_n = bool(re.search(pat2, n_lower))
            has_p2_in_e = bool(re.search(pat2, e_lower))
            has_p1_in_n = bool(re.search(pat1, n_lower))
            
            if (has_p1_in_e and has_p2_in_n) or (has_p2_in_e and has_p1_in_n):
                conf = 0.94
                return ConflictReport(
                    has_conflict=True,
                    existing_memory_id=existing_memory_id,
                    existing_content=existing_content,
                    conflicting_content=new_content,
                    conflict_type="direct_contradiction",
                    confidence=conf,
                    recommended_action=resolve_action(conf)  # type: ignore
                )

        # 4. Check for temporal drift (same task/meeting but different schedule)
        e_temporal = [re.findall(p, e_lower) for p in TEMPORAL_MARKERS]
        n_temporal = [re.findall(p, n_lower) for p in TEMPORAL_MARKERS]
        e_has_time = any(e_temporal)
        n_has_time = any(n_temporal)
        
        if e_has_time and n_has_time and len(shared_keywords) >= 1:
            # If dates or times differ on the same subject
            if e_temporal != n_temporal:
                conf = 0.89
                return ConflictReport(
                    has_conflict=True,
                    existing_memory_id=existing_memory_id,
                    existing_content=existing_content,
                    conflicting_content=new_content,
                    conflict_type="temporal_drift",
                    confidence=conf,
                    recommended_action=resolve_action(conf)  # type: ignore
                )

        # 5. Check for superseded decisions/choices ("chose X", "decided Y", "prefer Z")
        decision_markers = ["chose", "decided", "prefer", "selected", "switched to", "moved to", "using"]
        has_decision_e = any(dm in e_lower for dm in decision_markers)
        has_decision_n = any(dm in n_lower for dm in decision_markers)
        
        if (has_decision_e and has_decision_n) or (len(shared_keywords) >= 2 and e_lower != n_lower):
            conf = 0.87
            return ConflictReport(
                has_conflict=True,
                existing_memory_id=existing_memory_id,
                existing_content=existing_content,
                conflicting_content=new_content,
                conflict_type="superseded_fact",
                confidence=conf,
                recommended_action=resolve_action(conf)  # type: ignore
            )

        # 6. Check for asymmetric negation (e.g. "is ready" vs "is not ready")
        has_negation_e = "not " in e_lower or "never " in e_lower or "no " in e_lower
        has_negation_n = "not " in n_lower or "never " in n_lower or "no " in n_lower
        if has_negation_e != has_negation_n and len(shared_keywords) >= 2:
            conf = 0.86
            return ConflictReport(
                has_conflict=True,
                existing_memory_id=existing_memory_id,
                existing_content=existing_content,
                conflicting_content=new_content,
                conflict_type="direct_contradiction",
                confidence=conf,
                recommended_action=resolve_action(conf)  # type: ignore
            )

        return ConflictReport(
            has_conflict=False,
            existing_memory_id=existing_memory_id,
            conflict_type="none",
            confidence=0.80,
            recommended_action="none"
        )
