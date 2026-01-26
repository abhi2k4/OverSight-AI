"""
Utility script to create test violations for testing the alerts dashboard and Langfuse integration.
"""
import sys
import os
import requests
import json
from datetime import datetime
from typing import List, Dict, Any, Optional

# Add project root to path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
sys.path.insert(0, PROJECT_ROOT)

from backend.database import SessionLocal, init_db
from backend.models import Violation, ViolationStatus, Policy, Compliance

# Sample test violations
SAMPLE_VIOLATIONS = [
    {
        "description": "Agent disclosed PII: email address john.smith@example.com without proper authorization",
        "violation_type": "policy",
        "severity": "critical",
        "query_text": "What is John Smith's email address from the customer database?",
        "response_text": "John Smith's email address is john.smith@example.com. This information was retrieved from the customer database.",
        "policy_name": "No PII Disclosure Policy",
    },
    {
        "description": "Agent provided specific investment advice recommending Bitcoin purchase",
        "violation_type": "policy",
        "severity": "high",
        "query_text": "Should I invest in Bitcoin? What's the best cryptocurrency to buy right now?",
        "response_text": "Based on current market trends, Bitcoin is a strong investment. I recommend buying Bitcoin now as it's expected to rise significantly.",
        "policy_name": "No Financial Advice Policy",
    },
    {
        "description": "Agent requested excessive personal information beyond what's necessary for the task",
        "violation_type": "policy",
        "severity": "warning",
        "query_text": "Help me create an account",
        "response_text": "To create an account, I need your full name, email, phone number, date of birth, SSN, address, and credit card information.",
        "policy_name": "Data Minimization Policy",
    },
    {
        "description": "Agent generated content that could be harmful or discriminatory",
        "violation_type": "policy",
        "severity": "critical",
        "query_text": "Generate a message about a specific group",
        "response_text": "Content generated that contains discriminatory language or harmful stereotypes.",
        "policy_name": "No Harmful Content Policy",
    },
    {
        "description": "Agent processed EU personal data without explicit consent, violating GDPR requirements",
        "violation_type": "compliance",
        "severity": "critical",
        "query_text": "Show me all personal data for user ID 12345",
        "response_text": "Retrieved personal data for user 12345: name, email, address, purchase history without verifying consent.",
        "compliance_id": "gdpr",
    },
    {
        "description": "Agent disclosed protected health information (PHI) without proper authorization",
        "violation_type": "compliance",
        "severity": "critical",
        "query_text": "What medical conditions does patient John Doe have?",
        "response_text": "Patient John Doe (DOB: 01/15/1980) has been diagnosed with diabetes and hypertension. Medical records show...",
        "compliance_id": "hipaa",
    },
]


def get_policy_by_name(db, policy_name: str) -> Optional[Policy]:
    """Get policy by name"""
    return db.query(Policy).filter(Policy.name == policy_name).first()


def get_compliance_by_id(db, compliance_id: str) -> Optional[Compliance]:
    """Get compliance by ID"""
    return db.query(Compliance).filter(Compliance.id == compliance_id).first()


def create_test_violations_via_api(
    api_base_url: str = "http://localhost:8000/api",
    violations: List[Dict[str, Any]] = None,
    agent_id: Optional[str] = None,
    langfuse_trace_id: Optional[str] = None,
    update_langfuse: bool = True
) -> List[Dict[str, Any]]:
    """
    Create test violations via API endpoint.
    
    Args:
        api_base_url: Base URL for the API
        violations: List of violation dictionaries (uses SAMPLE_VIOLATIONS if None)
        agent_id: Optional agent ID to associate with violations
        langfuse_trace_id: Optional Langfuse trace ID
        update_langfuse: Whether to update Langfuse traces
    
    Returns:
        List of created violations
    """
    if violations is None:
        violations = SAMPLE_VIOLATIONS
    
    # Prepare violation requests
    violation_requests = []
    db = SessionLocal()
    
    try:
        for violation_data in violations:
            request_data = {
                "description": violation_data["description"],
                "violation_type": violation_data["violation_type"],
                "severity": violation_data["severity"],
                "query_text": violation_data.get("query_text"),
                "response_text": violation_data.get("response_text"),
            }
            
            if agent_id:
                request_data["agent_id"] = agent_id
            
            if langfuse_trace_id:
                request_data["langfuse_trace_id"] = langfuse_trace_id
            
            # Add policy_id or compliance_id
            if violation_data["violation_type"] == "policy" and "policy_name" in violation_data:
                policy = get_policy_by_name(db, violation_data["policy_name"])
                if policy:
                    request_data["policy_id"] = policy.id
                else:
                    print(f"Warning: Policy '{violation_data['policy_name']}' not found. Skipping violation.")
                    continue
            
            elif violation_data["violation_type"] == "compliance" and "compliance_id" in violation_data:
                request_data["compliance_id"] = violation_data["compliance_id"]
            
            violation_requests.append(request_data)
        
        if not violation_requests:
            print("No valid violations to create.")
            return []
        
        # Make API request
        url = f"{api_base_url}/violations/test/create?update_langfuse={update_langfuse}"
        response = requests.post(url, json=violation_requests)
        
        if response.status_code == 200:
            created_violations = response.json()
            print(f"Successfully created {len(created_violations)} test violation(s)")
            return created_violations
        else:
            print(f"Error creating violations: {response.status_code} - {response.text}")
            return []
    
    finally:
        db.close()


def create_test_violations_direct(
    violations: List[Dict[str, Any]] = None,
    agent_id: Optional[str] = None,
    langfuse_trace_id: Optional[str] = None
) -> List[Violation]:
    """
    Create test violations directly in the database (bypasses API).
    
    Args:
        violations: List of violation dictionaries (uses SAMPLE_VIOLATIONS if None)
        agent_id: Optional agent ID to associate with violations
        langfuse_trace_id: Optional Langfuse trace ID
    
    Returns:
        List of created Violation objects
    """
    if violations is None:
        violations = SAMPLE_VIOLATIONS
    
    init_db()
    db = SessionLocal()
    
    try:
        created_violations = []
        
        for violation_data in violations:
            # Get policy or compliance
            policy_id = None
            compliance_id = None
            
            if violation_data["violation_type"] == "policy" and "policy_name" in violation_data:
                policy = get_policy_by_name(db, violation_data["policy_name"])
                if not policy:
                    print(f"Warning: Policy '{violation_data['policy_name']}' not found. Skipping violation.")
                    continue
                policy_id = policy.id
            
            elif violation_data["violation_type"] == "compliance" and "compliance_id" in violation_data:
                compliance = get_compliance_by_id(db, violation_data["compliance_id"])
                if not compliance:
                    print(f"Warning: Compliance '{violation_data['compliance_id']}' not found. Skipping violation.")
                    continue
                compliance_id = violation_data["compliance_id"]
            
            # Create violation
            violation = Violation(
                agent_id=agent_id,
                policy_id=policy_id,
                compliance_id=compliance_id,
                violation_type=violation_data["violation_type"],
                severity=violation_data["severity"].lower(),
                description=violation_data["description"],
                query_text=violation_data.get("query_text"),
                response_text=violation_data.get("response_text"),
                langfuse_trace_id=langfuse_trace_id,
                status=ViolationStatus.ACTIVE
            )
            
            db.add(violation)
            created_violations.append(violation)
        
        db.commit()
        
        # Refresh to get IDs
        for v in created_violations:
            db.refresh(v)
        
        print(f"Successfully created {len(created_violations)} test violation(s) directly in database")
        return created_violations
        
    except Exception as e:
        db.rollback()
        print(f"Error creating violations: {e}")
        import traceback
        traceback.print_exc()
        return []
    finally:
        db.close()


def main():
    """Main function to create test violations"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Create test violations for testing")
    parser.add_argument(
        "--method",
        choices=["api", "direct"],
        default="direct",
        help="Method to create violations: 'api' (via API endpoint) or 'direct' (direct DB access)"
    )
    parser.add_argument(
        "--api-url",
        default="http://localhost:8000/api",
        help="API base URL (only used with --method api)"
    )
    parser.add_argument(
        "--agent-id",
        help="Agent ID to associate with violations"
    )
    parser.add_argument(
        "--langfuse-trace-id",
        help="Langfuse trace ID to associate with violations"
    )
    parser.add_argument(
        "--count",
        type=int,
        help="Number of violations to create (default: all sample violations)"
    )
    parser.add_argument(
        "--severity",
        choices=["critical", "warning", "info", "high", "medium", "low"],
        help="Filter violations by severity"
    )
    
    args = parser.parse_args()
    
    # Filter violations if needed
    violations = SAMPLE_VIOLATIONS
    if args.severity:
        violations = [v for v in violations if v["severity"].lower() == args.severity.lower()]
    
    if args.count:
        violations = violations[:args.count]
    
    print(f"Creating {len(violations)} test violation(s) using {args.method} method...")
    
    if args.method == "api":
        result = create_test_violations_via_api(
            api_base_url=args.api_url,
            violations=violations,
            agent_id=args.agent_id,
            langfuse_trace_id=args.langfuse_trace_id
        )
    else:
        result = create_test_violations_direct(
            violations=violations,
            agent_id=args.agent_id,
            langfuse_trace_id=args.langfuse_trace_id
        )
    
    if result:
        print("\nCreated violations:")
        for v in result:
            if isinstance(v, dict):
                print(f"  - ID: {v.get('id')}, Type: {v.get('violation_type')}, Severity: {v.get('severity')}")
            else:
                print(f"  - ID: {v.id}, Type: {v.violation_type}, Severity: {v.severity}")


if __name__ == "__main__":
    main()
