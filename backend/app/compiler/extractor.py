"""
Multi-Facet Memory Extractor for Knowledge Brain.
Extracts facts, preferences, decisions, tasks, and experiences from unstructured text.
Calculates multi-dimensional confidence and importance scores with temporal and provenance metadata.
"""

import re
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from ..schemas import ExtractedMemoryItem, MemoryType

# Heuristic patterns for rule-based zero-dependency extraction across 5 facets
PATTERNS = {
    "preference": [
        r"(?i)(?:\b(?:i\s+prefer|i\s+like|i\s+dislike|i\s+hate|i\s+want|never\s+use|always\s+use|my\s+favorite|please\s+ensure)\b|\b(?:preference|style)\s*:|\b(?:preference\s+is|format\s+as|style\s+should\s+be|rather\s+than|opt\s+for)\b).*?[.!?\n]",
    ],
    "decision": [
        r"(?i)(?:\b(?:decided\s+to|we\s+chose|i\s+have\s+decided|agreed\s+on|approved\s+to|selected\s+option|settled\s+on)\b|\b(?:decision|architecture\s+decision)\s*:|\b(?:chosen\s+approach\s+is|final\s+verdict)\b).*?[.!?\n]",
    ],
    "task": [
        r"(?i)(?:\b(?:todo|task|action\s+item)\s*:|\b(?:need\s+to|must\s+implement|have\s+to|remember\s+to|plan\s+to|completed\s+auth|remaining\s+step\s+is|next\s+step\s+is|upcoming\s+milestone|deadline\s+is|assigned\s+to)\b).*?[.!?\n]",
    ],
    "experience": [
        r"(?i)\b(?:learned\s+that|discovered\s+that|the\s+issue\s+was|the\s+bug\s+was\s+caused\s+by|solution\s+was|lesson\s+learned)\b.*?[.!?\n]",
        r"(?i)\b(?:encountered\s+error|fixed\s+by|root\s+cause\s+was|turns\s+out\s+that)\b.*?[.!?\n]"
    ],
    "fact": [
        r"(?i)(?:\b(?:fact|metric|architecture\s+fact)\s*:|\b(?:is\s+located\s+in|uses\s+version|configured\s+with|system\s+runs\s+on|built\s+with|database\s+is)\b).*?[.!?\n]",
        r"(?i)\b(?:my\s+name\s+is|i\s+am\s+a|the\s+project\s+(?:repository\s+)?is|project\s+is|repo\s+is|license\s+is|platform\s+is)\b.*?[.!?\n]"
    ]
}

# Salience modifiers for importance calculation
IMPORTANCE_BOOSTERS = [
    r"(?i)\b(?:critical|mandatory|crucial|essential|urgent|vital|high\s+priority|must\s+never|strictly)\b",
    r"(?i)\b(?:security|architecture|production|breaking\s+change|permanent)\b"
]

IMPORTANCE_REDUCERS = [
    r"(?i)\b(?:minor|temporary|optional|maybe|might|trivial|low\s+priority|fyi)\b"
]

class MemoryExtractor:
    def __init__(self, use_llm: bool = False):
        self.use_llm = use_llm

    @staticmethod
    def calculate_importance(content: str, facet: str) -> float:
        """
        Calculates a normalized importance score (0.0 - 1.0) based on facet and lexical salience.
        """
        base_scores = {
            "decision": 0.85,
            "preference": 0.80,
            "task": 0.75,
            "experience": 0.70,
            "fact": 0.60
        }
        score = base_scores.get(facet, 0.65)
        
        # Boost for high-salience markers
        for pat in IMPORTANCE_BOOSTERS:
            if re.search(pat, content):
                score += 0.10
                
        # Diminish for tentative/transient markers
        for pat in IMPORTANCE_REDUCERS:
            if re.search(pat, content):
                score -= 0.15
                
        return max(0.1, min(1.0, round(score, 2)))

    @staticmethod
    def extract_temporal_validity(content: str) -> Optional[datetime]:
        """
        Detects temporary or time-bounded assertions and calculates expiration.
        """
        now = datetime.now(timezone.utc)
        c_lower = content.lower()
        if "until tomorrow" in c_lower or "for 24 hours" in c_lower:
            return now + timedelta(days=1)
        if "for this sprint" in c_lower or "for the next week" in c_lower:
            return now + timedelta(days=7)
        if "temporary" in c_lower or "transient" in c_lower:
            return now + timedelta(days=3)
        return None

    def extract(self, text: str, context_metadata: Optional[Dict[str, Any]] = None) -> List[ExtractedMemoryItem]:
        """
        Extracts structured memory items from conversation text across the 5 core facets.
        Enriches each item with confidence, importance, temporal validity, and provenance metadata.
        """
        extracted: List[ExtractedMemoryItem] = []
        covered_spans = set()
        now_iso = datetime.now(timezone.utc).isoformat()
        
        # 1. Run pattern-based extraction across facets
        for facet, regex_list in PATTERNS.items():
            for p in regex_list:
                for match in re.finditer(p, text):
                    span = match.span()
                    # Prevent severe overlap with previously extracted items
                    if any(s in range(span[0], span[1]) for s in covered_spans):
                        continue
                    
                    matched_content = match.group().strip()
                    matched_content = re.sub(r"^[^\w]+", "", matched_content)
                    
                    if len(matched_content) > 10:
                        for idx in range(span[0], span[1]):
                            covered_spans.add(idx)
                        
                        importance = self.calculate_importance(matched_content, facet)
                        valid_until = self.extract_temporal_validity(matched_content)
                        confidence = 0.95 if facet in ["decision", "preference"] else 0.88
                        
                        extracted.append(
                            ExtractedMemoryItem(
                                content=matched_content,
                                memory_type=facet,  # type: ignore
                                confidence_score=confidence,
                                importance_score=importance,
                                valid_until=valid_until,
                                metadata={
                                    "extraction_method": "regex_heuristic",
                                    "matched_pattern": p[:30],
                                    "extracted_at": now_iso,
                                    **(context_metadata or {})
                                }
                            )
                        )
        
        # 2. Fallback: If no facet matched but text has declarative substance, extract as facts
        if not extracted and len(text.strip()) > 15:
            sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if len(s.strip()) > 15]
            for s in sentences[:3]:
                importance = self.calculate_importance(s, "fact")
                valid_until = self.extract_temporal_validity(s)
                extracted.append(
                    ExtractedMemoryItem(
                        content=s,
                        memory_type="fact",
                        confidence_score=0.75,
                        importance_score=importance,
                        valid_until=valid_until,
                        metadata={
                            "extraction_method": "sentence_fallback",
                            "extracted_at": now_iso,
                            **(context_metadata or {})
                        }
                    )
                )

        return extracted
