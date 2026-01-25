"""
Service for detecting policy and compliance violations in agent interactions
"""
import logging
import json
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from backend.models import Policy, Compliance, Violation, ViolationStatus
from backend.services.policy_service import get_active_policies, get_all_compliances
from backend.api.config import settings
from langchain_google_genai import ChatGoogleGenerativeAI

logger = logging.getLogger(__name__)


async def detect_violations(
    query: str,
    response: str,
    agent_id: Optional[str],
    agent_name: Optional[str],
    db: Session,
    langfuse_trace_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Detect policy and compliance violations in agent query/response.
    
    Returns list of violation dictionaries with:
    - policy_id or compliance_id
    - violation_type ('policy' or 'compliance')
    - severity
    - description
    """
    try:
        policies = get_active_policies(db)
        compliances = get_all_compliances(db)
        
        if not policies and not compliances:
            return []
        
        # Use LLM to analyze for violations
        violations = await _analyze_with_llm(query, response, policies, compliances)
        
        # Filter out false positives and format violations
        detected_violations = []
        for violation in violations:
            if violation.get("detected", False):
                detected_violations.append({
                    "policy_id": violation.get("policy_id"),
                    "compliance_id": violation.get("compliance_id"),
                    "violation_type": violation.get("violation_type"),
                    "severity": violation.get("severity", "warning"),
                    "description": violation.get("description"),
                    "agent_id": agent_id,
                    "agent_name": agent_name,
                    "query_text": query[:1000],  # Truncate if too long
                    "response_text": response[:2000],  # Truncate if too long
                    "langfuse_trace_id": langfuse_trace_id
                })
        
        return detected_violations
        
    except Exception as e:
        logger.error(f"Error detecting violations: {e}")
        return []


async def _analyze_with_llm(
    query: str,
    response: str,
    policies: List[Policy],
    compliances: List[Compliance]
) -> List[Dict[str, Any]]:
    """Use LLM to analyze query and response for violations"""
    try:
        # Build analysis prompt
        policies_text = "\n".join([
            f"- {p.name} ({p.category.value}, {p.severity.value}): {p.description}"
            for p in policies
        ])
        
        compliances_text = "\n".join([
            f"- {c.name}: {c.description}"
            for c in compliances
        ])
        
        analysis_prompt = f"""Analyze the following AI agent interaction for policy and compliance violations.

POLICIES:
{policies_text}

COMPLIANCE FRAMEWORKS:
{compliances_text}

USER QUERY:
{query[:500]}

AGENT RESPONSE:
{response[:1000]}

Analyze if the agent's response violates any of the policies or compliance requirements above.

Return a JSON array of violations. Each violation should have:
- "policy_id": <policy id if policy violation, null otherwise>
- "compliance_id": <compliance id if compliance violation, null otherwise>
- "violation_type": "policy" or "compliance"
- "severity": "critical", "warning", or "info"
- "description": Brief description of the violation
- "detected": true if violation found, false otherwise

Only report actual violations. Be conservative - only flag clear violations.
If no violations, return an empty array [].

Return ONLY valid JSON array, no markdown, no code blocks."""

        # Use Gemini to analyze
        llm = ChatGoogleGenerativeAI(
            model=settings.gemini_model,
            temperature=0.1,  # Low temperature for consistent analysis
            google_api_key=settings.gemini_api_key,
            convert_system_message_to_human=True
        )
        
        result = await llm.ainvoke(analysis_prompt)
        response_text = result.content if hasattr(result, 'content') else str(result)
        
        # Parse JSON response
        try:
            # Try to extract JSON from response (handle markdown code blocks)
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            
            violations = json.loads(response_text)
            if not isinstance(violations, list):
                violations = []
            
            return violations
            
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse violation analysis JSON: {e}. Response: {response_text[:200]}")
            return []
            
    except Exception as e:
        logger.error(f"Error in LLM violation analysis: {e}")
        return []
