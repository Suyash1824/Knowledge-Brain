"""
Multi-Facet Memory Extractor for Knowledge Brain.
Extracts facts, preferences, decisions, tasks, and experiences from unstructured text.
"""

import re
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from ..schemas import ExtractedMemoryItem, MemoryType

# Heuristic patterns for rule-based zero-dependency extraction
PATTERNS = {
    "preference": [
        r"(?i)\b(?:i\s+prefer|i\s+like|i\s+dislike|i\s+hate|i\s+want|never\s+use|always\s+use|my\s+favorite|please\s+ensure)\b.*?[.!?\n]",
        r"(?i)\b(?:preference\s+is|format\s+as|style\s+should\s+be)\b.*?[.!?\n]"
    ],
    "decision": [
        r"(?i)\b(?:decided\s+to|we\s+chose|i\s+have\s+decided|agreed\s+on|approved\s+to|selected\s+option|settled\s+on)\b.*?[.!?\n]",
        r"(?i)\b(?:decision\s*:\s*|architecture\s+decision\s*:\s*)\b.*?[.!?\n]"
    ],
    "task": [
        r"(?i)\b(?:todo\s*:|task\s*:|need\s+to|must\s+implement|have\s+to|action\s+item\s*:|remember\s+to|plan\s+to)\b.*?[.!?\n]",
        r"(?i)\b(?:next\s+step\s+is|upcoming\s+milestone)\b.*?[.!?\n]"
    ],
    "experience": [
        r"(?i)\b(?:learned\s+that|discovered\s+that|the\s+issue\s+was|the\s+bug\s+was\s+caused\s+by|solution\s+was|lesson\s+learned)\b.*?[.!?\n]",
        r"(?i)\b(?:encountered\s+error|fixed\s+by|root\s+cause\s+was)\b.*?[.!?\n]"
    ],
    "fact": [
        r"(?i)\b(?:is\s+located\s+in|uses\s+version|configured\s+with|system\s+runs\s+on|built\s+with|database\s+is)\b.*?[.!?\n]",
        r"(?i)\b(?:my\s+name\s+is|i\s+am\s+a|the\s+project\s+is)\b.*?[.!?\n]"
    ]
}

class MemoryExtractor:
    def __init__(self, use_llm: bool = False):
        self.use_llm = use_llm

    def extract(self, text: str, context_metadata: Optional[Dict[str, Any]] = None) -> List[ExtractedMemoryItem]:
        """
        Extracts structured memory items from conversation text across the 5 core facets.
        """
        extracted: List[ExtractedMemoryItem] = []
        covered_spans = set()
        
        # 1. Run pattern-based extraction across facets
        for facet, regex_list in PATTERNS.items():
            for p in regex_list:
                for match in re.finditer(p, text):
                    span = match.span()
                    # Prevent severe overlap
                    if any(s in range(span[0], span[1]) for s in covered_spans):
                        continue
                    
                    matched_content = match.group().strip()
                    # Clean trailing punctuation and whitespace
                    matched_content = re.sub(r"^[^\w]+", "", matched_content)
                    
                    if len(matched_content) > 10:
                        for idx in range(span[0], span[1]):
                            covered_spans.add(idx)
                        
                        extracted.append(
                            ExtractedMemoryItem(
                                content=matched_content,
                                memory_type=facet, # type: ignore
                                confidence_score=0.90 if facet in ["decision", "preference"] else 0.85,
                                metadata={
                                    "extraction_method": "regex_heuristic",
                                    "matched_pattern": p[:30],
                                    "extracted_at": datetime.now(timezone.utc).isoformat(),
                                    **(context_metadata or {})
                                }
                            )
                        )
        
        # 2. Fallback: If no facet matched but text has substance, extract meaningful declarative sentences as facts
        if not extracted and len(text.strip()) > 15:
            # Split into candidate sentences
            sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if len(s.strip()) > 15]
            for s in sentences[:3]: # top sentences
                extracted.append(
                    ExtractedMemoryItem(
                        content=s,
                        memory_type="fact",
                        confidence_score=0.75,
                        metadata={
                            "extraction_method": "sentence_fallback",
                            "extracted_at": datetime.now(timezone.utc).isoformat(),
                            **(context_metadata or {})
                        }
                    )
                )

        return extracted

