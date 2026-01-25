"""
Service for managing policies and compliances for agent governance
"""
import logging
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from backend.models import Policy, Compliance, PolicyStatus
from backend.database import SessionLocal

logger = logging.getLogger(__name__)

# Cache for policies and compliances (refresh every 5 minutes)
_policy_cache = {
    "policies": [],
    "compliances": [],
    "last_refresh": None,
    "cache_ttl": timedelta(minutes=5)
}


def get_active_policies(db: Optional[Session] = None) -> List[Policy]:
    """Get all active policies from database"""
    if db is None:
        db = SessionLocal()
        try:
            return get_active_policies(db)
        finally:
            db.close()
    
    policies = db.query(Policy).filter(
        Policy.status == PolicyStatus.ACTIVE
    ).order_by(Policy.severity.desc(), Policy.created_at.desc()).all()
    
    return policies


def get_all_compliances(db: Optional[Session] = None) -> List[Compliance]:
    """Get all compliances from database"""
    if db is None:
        db = SessionLocal()
        try:
            return get_all_compliances(db)
        finally:
            db.close()
    
    compliances = db.query(Compliance).order_by(Compliance.created_at.desc()).all()
    return compliances


def get_cached_policies_and_compliances() -> tuple[List[Policy], List[Compliance]]:
    """Get policies and compliances with caching"""
    now = datetime.now()
    
    # Check if cache is valid
    if (_policy_cache["last_refresh"] is None or 
        now - _policy_cache["last_refresh"] > _policy_cache["cache_ttl"]):
        # Refresh cache
        db = SessionLocal()
        try:
            _policy_cache["policies"] = get_active_policies(db)
            _policy_cache["compliances"] = get_all_compliances(db)
            _policy_cache["last_refresh"] = now
            logger.info(f"Cached {len(_policy_cache['policies'])} policies and {len(_policy_cache['compliances'])} compliances")
        except Exception as e:
            logger.error(f"Error refreshing policy cache: {e}")
            # Return cached data even if stale
        finally:
            db.close()
    
    return _policy_cache["policies"], _policy_cache["compliances"]


def build_governance_prompt() -> str:
    """
    Build governance prompt string from active policies and compliances.
    This will be appended to agent system prompts.
    """
    try:
        policies, compliances = get_cached_policies_and_compliances()
    except Exception as e:
        logger.warning(f"Failed to fetch policies/compliances: {e}. Using empty governance prompt.")
        return ""
    
    if not policies and not compliances:
        return ""
    
    prompt = "\n\n=== GOVERNANCE POLICIES & COMPLIANCE REQUIREMENTS ===\n\n"
    
    if policies:
        prompt += "POLICIES:\n"
        for policy in policies:
            prompt += f"- {policy.name} ({policy.category.value}, {policy.severity.value}): {policy.description}\n"
        prompt += "\n"
    
    if compliances:
        prompt += "COMPLIANCE FRAMEWORKS:\n"
        for compliance in compliances:
            prompt += f"- {compliance.name} ({compliance.full_name}): {compliance.description}\n"
            if compliance.details:
                # Truncate details if too long (keep first 500 chars)
                details = compliance.details[:500] + "..." if len(compliance.details) > 500 else compliance.details
                prompt += f"  Key Requirements: {details}\n"
        prompt += "\n"
    
    prompt += "IMPORTANT: You must comply with all policies and compliance requirements above. "
    prompt += "If your response or actions would violate any policy, you must indicate this clearly. "
    prompt += "Report any potential violations immediately. "
    prompt += "When responding, ensure your answer adheres to these governance requirements.\n"
    
    return prompt


def clear_policy_cache():
    """Clear the policy cache (useful for testing or manual refresh)"""
    _policy_cache["policies"] = []
    _policy_cache["compliances"] = []
    _policy_cache["last_refresh"] = None
    logger.info("Policy cache cleared")
