"""
Specialized agent implementations
"""
from typing import Dict, Any, Optional
from backend.agents.base_agent import BaseAgent, AgentFactory


class DataDiscoveryAgent(BaseAgent):
    """Agent specialized in discovering and exploring datasets"""
    
    def __init__(self, name: str = "Data Discovery Agent", llm_config: Optional[Dict[str, Any]] = None):
        super().__init__(
            agent_type="data_discovery",
            name=name,
            llm_config=llm_config
        )


class MetadataAgent(BaseAgent):
    """Agent specialized in querying and analyzing metadata"""
    
    def __init__(self, name: str = "Metadata Agent", llm_config: Optional[Dict[str, Any]] = None):
        super().__init__(
            agent_type="metadata",
            name=name,
            llm_config=llm_config
        )


class ComplianceAgent(BaseAgent):
    """Agent specialized in compliance and governance checks"""
    
    def __init__(self, name: str = "Compliance Agent", llm_config: Optional[Dict[str, Any]] = None):
        super().__init__(
            agent_type="compliance",
            name=name,
            llm_config=llm_config
        )


class AnalyticsAgent(BaseAgent):
    """Agent specialized in data analytics and insights"""
    
    def __init__(self, name: str = "Analytics Agent", llm_config: Optional[Dict[str, Any]] = None):
        super().__init__(
            agent_type="analytics",
            name=name,
            llm_config=llm_config
        )


class SalesAgent(BaseAgent):
    """Agent specialized in sales data analysis and business intelligence"""
    
    def __init__(self, name: str = "Sales Agent", llm_config: Optional[Dict[str, Any]] = None):
        super().__init__(
            agent_type="sales",
            name=name,
            llm_config=llm_config
        )


class ProductAgent(BaseAgent):
    """Agent specialized in product data analysis and inventory management"""
    
    def __init__(self, name: str = "Product Agent", llm_config: Optional[Dict[str, Any]] = None):
        super().__init__(
            agent_type="product",
            name=name,
            llm_config=llm_config
        )


def create_specialized_agents() -> Dict[str, BaseAgent]:
    """
    Create all specialized agents and return them as a dictionary
    
    Returns:
        Dictionary mapping agent type to agent instance
    """
    agents = {
        "data_discovery": DataDiscoveryAgent(),
        "metadata": MetadataAgent(),
        "compliance": ComplianceAgent(),
        "analytics": AnalyticsAgent(),
        "sales": SalesAgent(),
        "product": ProductAgent()
    }
    
    return agents


def get_agent_by_type(agent_type: str, llm_config: Optional[Dict[str, Any]] = None) -> Optional[BaseAgent]:
    """
    Get or create a specialized agent by type
    
    Args:
        agent_type: Type of agent to retrieve
        llm_config: Optional LLM configuration
        
    Returns:
        BaseAgent instance or None
    """
    agent_classes = {
        "data_discovery": DataDiscoveryAgent,
        "metadata": MetadataAgent,
        "compliance": ComplianceAgent,
        "analytics": AnalyticsAgent,
        "sales": SalesAgent,
        "product": ProductAgent
    }
    
    agent_class = agent_classes.get(agent_type)
    if not agent_class:
        return None
    
    # Try to get from factory first
    agent = AgentFactory.get_agent(agent_type)
    if agent:
        return agent
    
    # Create new agent
    return agent_class(llm_config=llm_config)
