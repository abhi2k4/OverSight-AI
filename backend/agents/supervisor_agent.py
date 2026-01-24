"""
Supervisor agent implementation using LangGraph for multi-agent coordination
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate

from backend.api.config import settings, AGENT_PROMPTS
from backend.agents.specialized_agents import (
    DataDiscoveryAgent,
    MetadataAgent,
    ComplianceAgent,
    AnalyticsAgent,
    SalesAgent,
    ProductAgent
)

logger = logging.getLogger(__name__)


class SupervisorAgent:
    """
    Supervisor agent that routes queries to specialized agents
    Uses LangGraph patterns for coordination
    """
    
    def __init__(self, llm_config: Optional[Dict[str, Any]] = None):
        self.name = "Supervisor Agent"
        self.agent_type = "supervisor"
        self.llm_config = llm_config or {}
        
        # Initialize LLM for routing
        self.llm = self._create_llm()
        
        # Initialize specialized agents
        self.specialized_agents = self._initialize_agents()
        
        logger.info(f"Supervisor Agent initialized with {len(self.specialized_agents)} specialized agents")
    
    def _create_llm(self) -> ChatGoogleGenerativeAI:
        """Create and configure the LLM for routing"""
        model = self.llm_config.get("model", settings.agent_default_model)
        temperature = self.llm_config.get("temperature", 0.2)  # Lower for routing decisions
        
        return ChatGoogleGenerativeAI(
            model=model,
            temperature=temperature,
            max_output_tokens=1024,
            google_api_key=settings.gemini_api_key,
            convert_system_message_to_human=True
        )
    
    def _initialize_agents(self) -> Dict[str, Any]:
        """Initialize all specialized agents"""
        return {
            "data_discovery": DataDiscoveryAgent(),
            "metadata": MetadataAgent(),
            "compliance": ComplianceAgent(),
            "analytics": AnalyticsAgent(),
            "sales": SalesAgent(),
            "product": ProductAgent()
        }
    
    async def _route_query(self, query: str) -> List[str]:
        """
        Analyze query and determine which agent(s) should handle it
        
        Args:
            query: User query
            
        Returns:
            List of agent types to invoke
        """
        routing_prompt = f"""Analyze the following user query and determine which specialized agent(s) should handle it.

Available agents:
- data_discovery: For finding datasets, exploring schemas, discovering data relationships
- metadata: For querying metadata, tags, descriptions, lineage information
- compliance: For checking PII, sensitivity levels, access policies, compliance requirements
- analytics: For generating insights, statistics, and trends from enriched data
- sales: For analyzing sales data, revenue insights, customer patterns, sales trends, and business intelligence
- product: For analyzing product data, inventory information, catalog details, and product specifications

User query: "{query}"

Respond with ONLY the agent type(s) that should handle this query, separated by commas.
Examples: "data_discovery", "compliance,metadata", "analytics", "sales", "product"

Agent(s):"""
        
        try:
            response = await self.llm.ainvoke([
                SystemMessage(content=AGENT_PROMPTS["supervisor"]),
                HumanMessage(content=routing_prompt)
            ])
            
            # Extract agent types from response
            content = response.content.strip().lower()
            
            # Parse response
            agent_types = []
            for agent_type in ["data_discovery", "metadata", "compliance", "analytics", "sales", "product"]:
                if agent_type in content:
                    agent_types.append(agent_type)
            
            # Default to data_discovery if no match
            if not agent_types:
                agent_types = ["data_discovery"]
            
            logger.info(f"Routed query to agents: {agent_types}")
            return agent_types
            
        except Exception as e:
            logger.error(f"Error routing query: {e}")
            # Default fallback
            return ["data_discovery"]
    
    async def process_query(
        self,
        query: str,
        chat_history: Optional[List] = None,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process a user query by routing to appropriate agent(s)
        
        Args:
            query: User query string
            chat_history: Optional chat history for context
            session_id: Optional session ID for memory
            
        Returns:
            Dictionary with aggregated response and metadata
        """
        try:
            start_time = datetime.now()
            
            # Step 1: Route query to appropriate agent(s)
            agent_types = await self._route_query(query)
            
            # Step 2: Execute queries on selected agents
            agent_responses = []
            for agent_type in agent_types:
                agent = self.specialized_agents.get(agent_type)
                if agent:
                    response = await agent.process_query(
                        query=query,
                        chat_history=chat_history,
                        session_id=session_id
                    )
                    agent_responses.append(response)
            
            # Step 3: Aggregate responses
            aggregated_response = await self._aggregate_responses(query, agent_responses)
            
            end_time = datetime.now()
            execution_time = (end_time - start_time).total_seconds() * 1000
            
            return {
                "success": True,
                "response": aggregated_response,
                "agent": self.name,
                "agent_type": self.agent_type,
                "routed_to": agent_types,
                "agent_responses": agent_responses,
                "execution_time_ms": int(execution_time),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in supervisor processing: {e}")
            return {
                "success": False,
                "error": str(e),
                "agent": self.name,
                "agent_type": self.agent_type
            }
    
    async def _aggregate_responses(
        self,
        query: str,
        agent_responses: List[Dict[str, Any]]
    ) -> str:
        """
        Aggregate responses from multiple agents into a coherent answer
        
        Args:
            query: Original user query
            agent_responses: List of responses from agents
            
        Returns:
            Aggregated response string
        """
        if not agent_responses:
            return "I apologize, but I couldn't process your query at this time."
        
        # If single agent, return its response directly
        if len(agent_responses) == 1:
            return agent_responses[0].get("response", "No response available")
        
        # Multiple agents - aggregate responses
        try:
            responses_text = ""
            for i, resp in enumerate(agent_responses, 1):
                agent_name = resp.get("agent", "Agent")
                response = resp.get("response", "")
                responses_text += f"\n\n{agent_name}:\n{response}"
            
            aggregation_prompt = f"""The user asked: "{query}"

Multiple specialized agents have provided responses:
{responses_text}

Please synthesize these responses into a single, coherent, and comprehensive answer for the user.
Focus on the most relevant information and eliminate redundancy.

Synthesized Response:"""
            
            response = await self.llm.ainvoke([
                SystemMessage(content=AGENT_PROMPTS["supervisor"]),
                HumanMessage(content=aggregation_prompt)
            ])
            
            return response.content
            
        except Exception as e:
            logger.error(f"Error aggregating responses: {e}")
            # Fallback: concatenate responses
            return "\n\n".join([
                f"{resp.get('agent', 'Agent')}: {resp.get('response', '')}"
                for resp in agent_responses
            ])
    
    def get_info(self) -> Dict[str, Any]:
        """Get supervisor agent information"""
        return {
            "name": self.name,
            "agent_type": self.agent_type,
            "specialized_agents": list(self.specialized_agents.keys()),
            "model": self.llm.model_name,
            "temperature": self.llm.temperature
        }
    
    async def list_available_agents(self) -> List[Dict[str, Any]]:
        """List all available specialized agents"""
        agents_info = []
        for agent_type, agent in self.specialized_agents.items():
            info = agent.get_info()
            agents_info.append(info)
        return agents_info


# Singleton instance
_supervisor_instance: Optional[SupervisorAgent] = None


def get_supervisor_agent(llm_config: Optional[Dict[str, Any]] = None) -> SupervisorAgent:
    """Get or create supervisor agent singleton"""
    global _supervisor_instance
    if _supervisor_instance is None:
        _supervisor_instance = SupervisorAgent(llm_config=llm_config)
    return _supervisor_instance
