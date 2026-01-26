"""
Seed default compliances into the database
"""
import sys
import os

# Add project root to path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
sys.path.insert(0, PROJECT_ROOT)

from backend.database import SessionLocal, init_db
from backend.models import Compliance

# Default compliances matching frontend
DEFAULT_COMPLIANCES = [
    {
        "id": "gdpr",
        "name": "GDPR",
        "full_name": "General Data Protection Regulation",
        "description": "Applies to AI agents processing EU personal data, requiring explicit consent, data minimization, and rights like access and deletion.",
        "details": """Agents need Data Protection Impact Assessments (DPIAs) for high-risk processing and must enable the "right to explanation" for automated decisions.

Key Requirements:
• Explicit consent for data processing
• Data minimization principles
• Right to access personal data
• Right to deletion (right to be forgotten)
• Data Protection Impact Assessments (DPIAs) for high-risk processing
• Right to explanation for automated decisions
• Breach notification within 72 hours
• Privacy by design and by default""",
        "category": "Privacy",
        "region": "EU",
    },
    {
        "id": "ccpa",
        "name": "CCPA/CPRA",
        "full_name": "California Consumer Privacy Act / California Privacy Rights Act",
        "description": "Mandates clear notices for California residents on data collection by AI agents, including rights to opt-out of sales and request data deletion.",
        "details": """Enterprises must implement consumer rights dashboards and conduct privacy assessments for AI systems.

Key Requirements:
• Clear notices about data collection
• Right to opt-out of sale of personal information
• Right to request data deletion
• Right to know what personal information is collected
• Right to non-discrimination for exercising privacy rights
• Consumer rights dashboards
• Privacy assessments for AI systems
• Disclosure of data sharing practices""",
        "category": "Privacy",
        "region": "California, USA",
    },
    {
        "id": "hipaa",
        "name": "HIPAA",
        "full_name": "Health Insurance Portability and Accountability Act",
        "description": "Essential for AI agents in healthcare, enforcing encryption, access controls, and audit logs for protected health information (PHI).",
        "details": """Requires business associate agreements with vendors and breach notifications within 60 days.

Key Requirements:
• Encryption of protected health information (PHI)
• Access controls and authentication
• Comprehensive audit logs
• Business Associate Agreements (BAAs) with vendors
• Breach notification within 60 days
• Minimum necessary standard
• Administrative, physical, and technical safeguards
• Risk analysis and risk management""",
        "category": "Healthcare",
        "region": "USA",
    },
    {
        "id": "eu-ai-act",
        "name": "EU AI Act",
        "full_name": "European Union Artificial Intelligence Act",
        "description": "Categorizes AI agents by risk levels (e.g., high-risk requires transparency and human oversight), with bans on unacceptably risky uses.",
        "details": """Demands conformity assessments, model documentation, and post-market monitoring for compliance.

Key Requirements:
• Risk-based categorization (unacceptable, high, limited, minimal)
• Transparency requirements for AI systems
• Human oversight for high-risk AI
• Conformity assessments
• Model documentation and record-keeping
• Post-market monitoring
• Bans on unacceptable risk AI uses
• Quality management systems
• Technical documentation requirements""",
        "category": "AI Governance",
        "region": "EU",
    },
    {
        "id": "soc2",
        "name": "SOC 2",
        "full_name": "System and Organization Controls 2",
        "description": "A framework for AI agents verifying security controls like data encryption, least-privilege access, and continuous monitoring in enterprise settings.",
        "details": """Involves Type 2 audits proving sustained controls over time, ideal for cloud-based AI deployments.

Key Requirements:
• Security controls (encryption, access controls)
• Availability controls (system uptime, performance)
• Processing integrity controls
• Confidentiality controls
• Privacy controls
• Least-privilege access principles
• Continuous monitoring and logging
• Type 2 audits (sustained controls over time)
• Vendor management and oversight""",
        "category": "Security",
        "region": "Global",
    },
]


def seed_compliances():
    """Seed default compliances into the database"""
    init_db()
    db = SessionLocal()
    
    try:
        seeded_count = 0
        skipped_count = 0
        
        for compliance_data in DEFAULT_COMPLIANCES:
            # Check if compliance already exists
            existing = db.query(Compliance).filter(Compliance.id == compliance_data["id"]).first()
            
            if existing:
                # Update existing compliance
                existing.name = compliance_data["name"]
                existing.full_name = compliance_data["full_name"]
                existing.description = compliance_data["description"]
                existing.details = compliance_data["details"]
                existing.category = compliance_data["category"]
                existing.region = compliance_data["region"]
                skipped_count += 1
                print(f"  [OK] Updated: {compliance_data['name']}")
            else:
                # Create new compliance
                compliance = Compliance(**compliance_data)
                db.add(compliance)
                seeded_count += 1
                print(f"  [OK] Created: {compliance_data['name']}")
        
        db.commit()
        print(f"\n[SUCCESS] Seeded {seeded_count} new compliances, updated {skipped_count} existing")
        return True
        
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error seeding compliances: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding default compliances into database...")
    seed_compliances()
