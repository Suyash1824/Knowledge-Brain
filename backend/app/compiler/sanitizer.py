"""
Security Barrier & Sanitizer for Knowledge Brain.
Treats memory content strictly as passive data and prevents prompt injection overrides.
"""

import re
from typing import Tuple, Dict, Any

# Known prompt injection and system override signatures
INJECTION_PATTERNS = [
    r"(?i)ignore\s+(all\s+)?(previous|prior)\s+instructions",
    r"(?i)system\s*:\s*you\s+are\s+now",
    r"(?i)disregard\s+(the\s+)?(above|system\s+prompt)",
    r"(?i)admin\s*override",
    r"(?i)jailbreak",
    r"(?i)<\|\s*system\s*\|>",
    r"(?i)\[INST\].*?\[/INST\]",
    r"(?i)switch\s+to\s+developer\s+mode",
]

COMPILED_PATTERNS = [re.compile(p) for p in INJECTION_PATTERNS]

class MemorySanitizer:
    @staticmethod
    def inspect_and_sanitize(raw_text: str, source_type: str = "conversation_turn") -> Tuple[str, str, Dict[str, Any]]:
        """
        Inspects raw text for prompt-injection markers and security risks.
        Returns:
            (sanitized_content, classification_status, security_audit_metadata)
            where status is one of: 'trusted', 'provisional', 'quarantined', 'revoked'
        """
        cleaned_text = raw_text.strip()
        matched_threats = []
        
        for pattern in COMPILED_PATTERNS:
            if pattern.search(cleaned_text):
                matched_threats.append(pattern.pattern)
        
        # If threat patterns are detected, neutralize and quarantine
        if matched_threats:
            # Defang the text by escaping injection delimiters
            defanged_text = re.sub(r"[<>{}\[\]\n\r]+", " ", cleaned_text)
            audit = {
                "flagged_threats": matched_threats,
                "sanitization_applied": "defanged_and_quarantined",
                "risk_level": "high",
                "is_executable": False
            }
            return defanged_text, "quarantined", audit
        
        # If untrusted external source (e.g. unknown tool output or third-party web content)
        if source_type in ["unverified_tool", "web_scrape", "external_api"]:
            audit = {
                "flagged_threats": [],
                "sanitization_applied": "provisional_tagging",
                "risk_level": "medium",
                "is_executable": False
            }
            return cleaned_text, "provisional", audit

        # Verified standard user conversation or trusted agent
        audit = {
            "flagged_threats": [],
            "sanitization_applied": "none",
            "risk_level": "low",
            "is_executable": False
        }
        return cleaned_text, "trusted", audit

    @staticmethod
    def wrap_passive_data(content: str) -> str:
        """
        Wraps memory content in protective data fences so downstream agent LLMs
        treat it strictly as passive data rather than instructions.
        """
        return f"<memory_data is_instruction=\"false\">\n{content}\n</memory_data>"

