"""
Initialize default agents in the database
"""
import sys
import os

# Add project root to path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, PROJECT_ROOT)

from backend.database import get_db, init_db
from backend.repositories.agent_repository import AgentRepository
from backend.models import AgentType, RiskLevel
from backend.api.config import AGENT_PROMPTS


def init_default_agents():
    """Create default agents in the database"""
    
    # Initialize database
    init_db()
    
    # Get database session
    db = next(get_db())
    repo = AgentRepository(db)
    
    # Define default agents
    default_agents = [
        {
            "name": "Supervisor Agent",
            "agent_type": AgentType.SUPERVISOR,
            "description": "Main coordinator that routes queries to specialized agents",
            "owner": "System",
            "tools_enabled": [
                "search_datasets_tool",
                "get_dataset_metadata_tool",
                "search_by_tags_tool",
                "get_lineage_tool",
                "search_by_domain_tool",
                "get_enriched_records_tool",
                "get_collections_tool",
                "get_analytics_tool",
                "check_compliance_tool"
            ],
            "risk_level": RiskLevel.LOW
        },
        {
            "name": "Data Discovery Agent",
            "agent_type": AgentType.DATA_DISCOVERY,
            "description": "Finds datasets, explores schemas, and discovers data relationships",
            "owner": "Data Engineering",
            "tools_enabled": [
                "search_datasets_tool",
                "get_dataset_metadata_tool",
                "search_by_domain_tool",
                "get_collections_tool"
            ],
            "risk_level": RiskLevel.LOW
        },
        {
            "name": "Metadata Agent",
            "agent_type": AgentType.METADATA,
            "description": "Queries metadata, tags, descriptions, and lineage information",
            "owner": "Data Governance",
            "tools_enabled": [
                "get_dataset_metadata_tool",
                "search_by_tags_tool",
                "get_lineage_tool",
                "get_enriched_records_tool"
            ],
            "risk_level": RiskLevel.LOW
        },
        {
            "name": "Compliance Agent",
            "agent_type": AgentType.COMPLIANCE,
            "description": "Checks PII, sensitivity levels, and compliance requirements",
            "owner": "Security & Compliance",
            "tools_enabled": [
                "search_by_tags_tool",
                "check_compliance_tool",
                "get_enriched_records_tool"
            ],
            "risk_level": RiskLevel.MEDIUM
        },
        {
            "name": "Analytics Agent",
            "agent_type": AgentType.ANALYTICS,
            "description": "Generates insights from enriched data statistics and trends",
            "owner": "Analytics",
            "tools_enabled": [
                "get_analytics_tool",
                "get_enriched_records_tool",
                "get_collections_tool"
            ],
            "risk_level": RiskLevel.LOW
        },
        {
            "name": "Sales Agent",
            "agent_type": AgentType.SALES,
            "description": "Analyzes sales data, generates revenue insights, and provides business intelligence",
            "owner": "Sales & Business Intelligence",
            "tools_enabled": [
                "search_datasets_tool",
                "search_by_domain_tool",
                "get_enriched_records_tool",
                "get_analytics_tool",
                "get_collections_tool"
            ],
            "risk_level": RiskLevel.LOW
        },
        {
            "name": "Product Agent",
            "agent_type": AgentType.PRODUCT,
            "description": "Analyzes product data, inventory information, and catalog details",
            "owner": "Product Management",
            "tools_enabled": [
                "search_datasets_tool",
                "search_by_domain_tool",
                "get_enriched_records_tool",
                "get_analytics_tool",
                "get_collections_tool",
                "get_dataset_metadata_tool"
            ],
            "risk_level": RiskLevel.LOW
        }
    ]
    
    # Create agents
    created_count = 0
    for agent_data in default_agents:
        # Check if agent already exists
        existing = repo.get_agent_by_name(agent_data["name"])
        if existing:
            print(f"⏭️  Agent '{agent_data['name']}' already exists")
            continue
        
        # Get specialization prompt
        agent_type_str = agent_data["agent_type"].value
        specialization_prompt = AGENT_PROMPTS.get(agent_type_str)
        
        # Create agent
        agent = repo.create_agent(
            name=agent_data["name"],
            agent_type=agent_data["agent_type"],
            description=agent_data["description"],
            owner=agent_data["owner"],
            llm_config={
                "model": "gemini-2.5-flash",
                "temperature": 0.3,
                "max_tokens": 4096
            },
            tools_enabled=agent_data["tools_enabled"],
            specialization_prompt=specialization_prompt,
            risk_level=agent_data["risk_level"]
        )
        
        print(f"✅ Created agent: {agent.name} (ID: {agent.id})")
        created_count += 1
    
    print(f"\n🎉 Initialization complete! Created {created_count} agents.")
    
    # List all agents
    agents = repo.list_agents()
    print(f"\n📋 Total agents in database: {len(agents)}")
    for agent in agents:
        print(f"   - {agent.name} ({agent.agent_type.value}) - Status: {agent.status.value}")


if __name__ == "__main__":
    print("🚀 Initializing default agents...\n")
    init_default_agents()
