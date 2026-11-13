"""
Conflict & Contradiction Detection Engine for Knowledge Brain.
Detects semantic contradictions, temporal drifts, and superseded facts.
"""

import re
from typing import List, Dict, Any, Optional
from uuid import UUID
from ..schemas import ConflictReport

# Antonym and negation pairs for contradiction detection
OPPOSING_TERMS = [
    (r"\b(like|prefer|love)\b", r"\b(dislike|hate|avoid)\b"),
    (r"\balways\b", r"\bnever\b"),
    (r"\benable(d)?\b", r"\bdisable(d)?\b"),
    (r"\buse\b", r"\b(do\s+not\s+use|never\s+use|avoid)\b"),
    (r"\btrue\b", r"\bfalse\b"),
    (r"\byes\b", r"\bno\b"),
    (r"\blight\s+mode\b", r"\bdark\s+mode\b"),
    (r"\boption\s+a\b", r"\boption\s+b\b"),
    (r"\bmonday\b", r"\bfriday\b"),
]

class ConflictDetector:
    @staticmethod
    def detect_conflict(
        existing_content: str,
        new_content: str,
        existing_memory_id: Optional[UUID] = None
    ) -> ConflictReport:
        """
        Compares an existing memory against new candidate content to identify contradictions.
        """
        e_lower = existing_content.lower()
        n_lower = new_content.lower()
        
        # Exact match -> No conflict, it's identical
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

        # 1. Check for entity / topic overlap
        # Extract keywords (words with len > 3 excluding common stop words)
        stopwords = {"this", "that", "with", "from", "have", "been", "were", "what", "when", "where", "user", "project"}
        e_words = set(w for w in re.findall(r"\b\w{4,}\b", e_lower) if w not in stopwords)
        n_words = set(w for w in re.findall(r"\b\w{4,}\b", n_lower) if w not in stopwords)
        
        shared_keywords = e_words.intersection(n_words)
        if not shared_keywords:
            # Different topics altogether
            return ConflictReport(
                has_conflict=False,
                existing_memory_id=existing_memory_id,
                conflict_type="none",
                confidence=0.9,
                recommended_action="none"
            )

        # 2. Check for explicit antonym / negation clash on the same topic
        for pat1, pat2 in OPPOSING_TERMS:
            has_p1_in_e = bool(re.search(pat1, e_lower))
            has_p2_in_n = bool(re.search(pat2, n_lower))
            has_p2_in_e = bool(re.search(pat2, e_lower))
            has_p1_in_n = bool(re.search(pat1, n_lower))
            
            if (has_p1_in_e and has_p2_in_n) or (has_p2_in_e and has_p1_in_n):
                return ConflictReport(
                    has_conflict=True,
                    existing_memory_id=existing_memory_id,
                    existing_content=existing_content,
                    conflicting_content=new_content,
                    conflict_type="direct_contradiction",
                    confidence=0.92,
                    recommended_action="update_version"
                )

        # 3. Check for decision/state updates (e.g. "we chose X" vs "we chose Y" with shared topic)
        if ("chose" in e_lower and "chose" in n_lower) or ("decided" in e_lower and "decided" in n_lower):
            if e_lower != n_lower:
                return ConflictReport(
                    has_conflict=True,
                    existing_memory_id=existing_memory_id,
                    existing_content=existing_content,
                    conflicting_content=new_content,
                    conflict_type="superseded_fact",
                    confidence=0.88,
                    recommended_action="update_version"
                )

        # 4. Check for negation difference (e.g. "is configured" vs "is not configured")
        has_negation_e = "not " in e_lower or "never " in e_lower
        has_negation_n = "not " in n_lower or "never " in n_lower
        if has_negation_e != has_negation_n and len(shared_keywords) >= 2:
            return ConflictReport(
                has_conflict=True,
                existing_memory_id=existing_memory_id,
                existing_content=existing_content,
                conflicting_content=new_content,
                conflict_type="direct_contradiction",
                confidence=0.85,
                recommended_action="update_version"
            )

        return ConflictReport(
            has_conflict=False,
            existing_memory_id=existing_memory_id,
            conflict_type="none",
            confidence=0.80,
            recommended_action="none"
        )

