"""
Base agent class and agent factory for creating specialized agents
"""
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain.agents import AgentExecutor, create_tool_calling_agent

from backend.api.config import settings, AGENT_PROMPTS
from backend.agents.tools import TOOL_GROUPS

logger = logging.getLogger(__name__)


class BaseAgent:
    """Base class for all specialized agents"""
    
    def __init__(
        self,
        agent_type: str,
        name: str,
        tools: Optional[List] = None,
        llm_config: Optional[Dict[str, Any]] = None
    ):
        self.agent_type = agent_type
        self.name = name
        self.llm_config = llm_config or {}
        
        # Initialize LLM
        self.llm = self._create_llm()
        
        # Get tools for this agent type
        self.tools = tools or TOOL_GROUPS.get(agent_type, [])
        
        # Get specialization prompt
        self.system_prompt = AGENT_PROMPTS.get(agent_type, "You are a helpful AI assistant.")
        
        # Create agent
        self.agent_executor = self._create_agent()
        
        logger.info(f"Initialized {name} ({agent_type}) with {len(self.tools)} tools")
    
    def _create_llm(self) -> ChatGoogleGenerativeAI:
        """Create and configure the LLM"""
        model = self.llm_config.get("model", settings.agent_default_model)
        temperature = self.llm_config.get("temperature", settings.agent_default_temperature)
        max_tokens = self.llm_config.get("max_tokens", settings.agent_max_tokens)
        
        return ChatGoogleGenerativeAI(
            model=model,
            temperature=temperature,
            max_output_tokens=max_tokens,
            google_api_key=settings.gemini_api_key,
            convert_system_message_to_human=True  # Gemini compatibility
        )
    
    def _create_agent(self) -> AgentExecutor:
        """Create the agent executor with tools and memory"""
        # Create prompt template
        prompt = ChatPromptTemplate.from_messages([
            ("system", self.system_prompt),
            MessagesPlaceholder(variable_name="chat_history", optional=True),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad")
        ])
        
        # Create agent
        agent = create_tool_calling_agent(self.llm, self.tools, prompt)
        
        # Create executor
        agent_executor = AgentExecutor(
            agent=agent,
            tools=self.tools,
            verbose=True,
            handle_parsing_errors=True,
            max_iterations=5,
            return_intermediate_steps=True
        )
        
        return agent_executor
    
    async def process_query(
        self,
        query: str,
        chat_history: Optional[List] = None,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process a user query and return the response
        
        Args:
            query: User query string
            chat_history: Optional chat history for context
            session_id: Optional session ID for memory
            
        Returns:
            Dictionary with response and metadata
        """
        try:
            start_time = datetime.now()
            
            # Prepare input
            agent_input = {
                "input": query,
                "chat_history": chat_history or []
            }
            
            # Invoke agent
            result = await self.agent_executor.ainvoke(agent_input)
            
            end_time = datetime.now()
            execution_time = (end_time - start_time).total_seconds() * 1000
            
            # Extract response and intermediate steps
            response = result.get("output", "")
            intermediate_steps = result.get("intermediate_steps", [])
            
            # Build tool execution info
            tool_calls = []
            for step in intermediate_steps:
                if len(step) >= 2:
                    action, observation = step[0], step[1]
                    tool_calls.append({
                        "tool": action.tool,
                        "input": action.tool_input,
                        "output": str(observation)[:500]  # Truncate long outputs
                    })
            
            return {
                "success": True,
                "response": response,
                "agent": self.name,
                "agent_type": self.agent_type,
                "execution_time_ms": int(execution_time),
                "tool_calls": tool_calls,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error processing query in {self.name}: {e}")
            return {
                "success": False,
                "error": str(e),
                "agent": self.name,
                "agent_type": self.agent_type
            }
    
    def get_info(self) -> Dict[str, Any]:
        """Get agent information"""
        return {
            "name": self.name,
            "agent_type": self.agent_type,
            "tools": [tool.name for tool in self.tools],
            "model": self.llm.model_name,
            "temperature": self.llm.temperature
        }


class AgentFactory:
    """Factory for creating specialized agents"""
    
    _agents: Dict[str, BaseAgent] = {}
    
    @classmethod
    def create_agent(
        cls,
        agent_type: str,
        name: Optional[str] = None,
        llm_config: Optional[Dict[str, Any]] = None
    ) -> BaseAgent:
        """
        Create or retrieve an agent instance
        
        Args:
            agent_type: Type of agent (data_discovery, metadata, compliance, analytics, supervisor)
            name: Optional custom name
            llm_config: Optional LLM configuration
            
        Returns:
            BaseAgent instance
        """
        # Generate default name if not provided
        if not name:
            name = f"{agent_type.replace('_', ' ').title()} Agent"
        
        # Check if agent already exists
        cache_key = f"{agent_type}:{name}"
        if cache_key in cls._agents:
            return cls._agents[cache_key]
        
        # Create new agent
        agent = BaseAgent(
            agent_type=agent_type,
            name=name,
            llm_config=llm_config
        )
        
        # Cache agent
        cls._agents[cache_key] = agent
        
        return agent
    
    @classmethod
    def get_agent(cls, agent_type: str, name: Optional[str] = None) -> Optional[BaseAgent]:
        """Get an existing agent"""
        if not name:
            name = f"{agent_type.replace('_', ' ').title()} Agent"
        cache_key = f"{agent_type}:{name}"
        return cls._agents.get(cache_key)
    
    @classmethod
    def list_agents(cls) -> List[Dict[str, Any]]:
        """List all created agents"""
        return [agent.get_info() for agent in cls._agents.values()]
    
    @classmethod
    def clear_cache(cls):
        """Clear agent cache"""
        cls._agents.clear()
