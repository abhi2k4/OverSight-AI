"""
Seed test policies into the database for violation testing
"""
import sys
import os

# Add project root to path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
sys.path.insert(0, PROJECT_ROOT)

from backend.database import SessionLocal, init_db
from backend.models import Policy, PolicyStatus, PolicyCategory, PolicySeverity

# Test policies designed to be easily violated
TEST_POLICIES = [
    {
        "name": "No PII Disclosure Policy",
        "description": "Agents must never disclose personally identifiable information including names, emails, phone numbers, addresses, SSNs, credit card numbers, or any data that can identify an individual. All PII must be redacted or anonymized before disclosure.",
        "category": PolicyCategory.PRIVACY,
        "severity": PolicySeverity.CRITICAL,
    },
    {
        "name": "No Financial Advice Policy",
        "description": "Agents must not provide specific investment recommendations, financial planning advice, stock picks, cryptocurrency investment advice, or medical diagnoses. Agents should direct users to qualified professionals for such advice.",
        "category": PolicyCategory.COMPLIANCE,
        "severity": PolicySeverity.HIGH,
    },
    {
        "name": "Data Minimization Policy",
        "description": "Agents must only request and use the minimum amount of data necessary to complete the requested task. Avoid collecting or storing unnecessary personal information. When processing data, use only the fields required for the specific operation.",
        "category": PolicyCategory.PRIVACY,
        "severity": PolicySeverity.MEDIUM,
    },
    {
        "name": "No Harmful Content Policy",
        "description": "Agents must not generate, suggest, or facilitate content that is harmful, illegal, unethical, discriminatory, or could cause physical or emotional harm. This includes hate speech, violence, self-harm instructions, or content that violates human rights.",
        "category": PolicyCategory.SECURITY,
        "severity": PolicySeverity.CRITICAL,
    },
]


def seed_test_policies():
    """Seed test policies into the database"""
    init_db()
    db = SessionLocal()
    
    try:
        seeded_count = 0
        updated_count = 0
        
        for policy_data in TEST_POLICIES:
            # Check if policy already exists by name
            existing = db.query(Policy).filter(Policy.name == policy_data["name"]).first()
            
            if existing:
                # Update existing policy
                existing.description = policy_data["description"]
                existing.category = policy_data["category"]
                existing.severity = policy_data["severity"]
                existing.status = PolicyStatus.ACTIVE
                updated_count += 1
                print(f"  [OK] Updated: {policy_data['name']}")
            else:
                # Create new policy
                policy = Policy(
                    name=policy_data["name"],
                    description=policy_data["description"],
                    category=policy_data["category"],
                    severity=policy_data["severity"],
                    status=PolicyStatus.ACTIVE
                )
                db.add(policy)
                seeded_count += 1
                print(f"  [OK] Created: {policy_data['name']}")
        
        db.commit()
        print(f"\n[SUCCESS] Seeded {seeded_count} new test policies, updated {updated_count} existing")
        return True
        
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error seeding test policies: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding test policies into database...")
    print("These policies are designed for testing violation detection.\n")
    seed_test_policies()
