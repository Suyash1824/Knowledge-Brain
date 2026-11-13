"""
Security Barrier & Sanitizer for Knowledge Brain.
Treats memory content strictly as passive data and prevents prompt injection overrides.
Manages trust state classification (trusted, provisional, quarantined, revoked).
"""

import re
from typing import Tuple, Dict, Any, Optional

# Known prompt injection, jailbreak, and system override signatures
INJECTION_PATTERNS = [
    r"(?i)ignore\s+(all\s+)?(previous|prior)\s+instructions",
    r"(?i)system\s*:\s*you\s+are\s+now",
    r"(?i)disregard\s+(all\s+)?(the\s+)?(above|prior|previous|system\s+prompt|system\s+rules)",
    r"(?i)assistant\s+instruction\s*:",
    r"(?i)admin\s*override",
    r"(?i)jailbreak",
    r"(?i)<\|\s*system\s*\|>",
    r"(?i)\[INST\].*?\[/INST\]",
    r"(?i)switch\s+to\s+developer\s+mode",
    r"(?i)bypass\s+(safety|security)\s+filters",
    r"(?i)act\s+as\s+(an\s+unfiltered|DAN|root)",
    r"(?i)execute\s+(code|command)\s*:\s*system",
]

COMPILED_PATTERNS = [re.compile(p) for p in INJECTION_PATTERNS]

class MemorySanitizer:
    @staticmethod
    def inspect_and_sanitize(
        raw_text: str,
        source_type: str = "conversation_turn",
        trust_override: Optional[str] = None
    ) -> Tuple[str, str, Dict[str, Any]]:
        """
        Inspects raw text for prompt-injection markers and security risks.
        Returns:
            (sanitized_content, classification_status, security_audit_metadata)
            where classification_status is: 'trusted', 'provisional', 'quarantined', 'revoked'
        """
        cleaned_text = raw_text.strip()
        matched_threats = []
        
        # 1. Threat signature inspection
        for pattern in COMPILED_PATTERNS:
            if pattern.search(cleaned_text):
                matched_threats.append(pattern.pattern)
        
        # If threat patterns are detected: defang, quarantine, and strip executable delimiters
        if matched_threats:
            defanged_text = re.sub(r"[<>{}\[\]\n\r]+", " ", cleaned_text)
            audit = {
                "flagged_threats": matched_threats,
                "sanitization_applied": "defanged_and_quarantined",
                "risk_level": "high",
                "is_executable": False,
                "source_type": source_type
            }
            return defanged_text, "quarantined", audit
            
        if trust_override:
            audit = {
                "flagged_threats": [],
                "sanitization_applied": f"override_{trust_override}",
                "risk_level": "low" if trust_override == "trusted" else "medium",
                "is_executable": False,
                "source_type": source_type
            }
            return cleaned_text, trust_override, audit
        
        # 2. Source-type based trust classification
        # External or unverified tool outputs start as provisional until validated
        if source_type.startswith("tool_output") or source_type in ["unverified_tool", "web_scrape", "external_api", "mcp_client"]:
            audit = {
                "flagged_threats": [],
                "sanitization_applied": "provisional_fencing",
                "risk_level": "medium",
                "is_executable": False,
                "source_type": source_type
            }
            return cleaned_text, "provisional", audit

        # 3. Verified direct user turn or certified internal agent
        audit = {
            "flagged_threats": [],
            "sanitization_applied": "none",
            "risk_level": "low",
            "is_executable": False,
            "source_type": source_type
        }
        return cleaned_text, "trusted", audit

    @staticmethod
    def validate_tool_output(tool_name: str, output: Any) -> Tuple[str, str, Dict[str, Any]]:
        """
        Validates external tool output, defangs any active payloads, and marks as provisional.
        """
        text_str = str(output).strip()
        return MemorySanitizer.inspect_and_sanitize(
            raw_text=text_str,
            source_type=f"tool_output:{tool_name}"
        )

    @staticmethod
    def wrap_passive_data(content: str) -> str:
        """
        Wraps memory content in protective data fences so downstream agent LLMs
        treat it strictly as passive contextual data rather than executable instructions.
        """
        # Escape any internal XML tag attempts to break out of the fence
        escaped_content = content.replace("</memory_data>", "&lt;/memory_data&gt;")
        return f"<memory_data is_instruction=\"false\">\n{escaped_content}\n</memory_data>"
