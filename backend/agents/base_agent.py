"""
Base agent class and agent factory for creating specialized agents
"""
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage
from langchain.agents import create_agent
from langchain_core.runnables import Runnable

from backend.api.config import settings, AGENT_PROMPTS
from backend.agents.tools import TOOL_GROUPS
from backend.services.policy_service import build_governance_prompt

logger = logging.getLogger(__name__)


class BaseAgent:
    """Base class for all specialized agents"""
    
    def __init__(
        self,
        agent_type: str,
        name: str,
        tools: Optional[List] = None,
        llm_config: Optional[Dict[str, Any]] = None,
        system_prompt: Optional[str] = None
    ):
        self.agent_type = agent_type
        self.name = name
        self.llm_config = llm_config or {}
        
        # Initialize LLM
        self.llm = self._create_llm()
        
        # Get tools for this agent type
        self.tools = tools or TOOL_GROUPS.get(agent_type, [])
        
        # Get specialization prompt - use provided one or get from config
        base_system_prompt = system_prompt or AGENT_PROMPTS.get(agent_type, "You are a helpful AI assistant.")
        
        # Inject governance policies and compliances into system prompt
        governance_prompt = build_governance_prompt()
        self.system_prompt = base_system_prompt + governance_prompt
        
        # Create agent
        self.agent = self._create_agent()
        
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
    
    def _create_agent(self) -> Runnable:
        """Create the agent with tools using create_agent (LangChain 1.2+ API)"""
        # Create agent using create_agent (newer API)
        agent = create_agent(
            model=self.llm,
            tools=self.tools,
            system_prompt=self.system_prompt
        )
        
        return agent
    
    async def process_query(
        self,
        query: str,
        chat_history: Optional[List] = None,
        session_id: Optional[str] = None,
        langfuse_trace: Optional[Any] = None
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
            
            # Prepare messages for the agent (create_agent uses messages format)
            messages = []
            
            # Add chat history if provided
            if chat_history:
                for msg in chat_history:
                    if isinstance(msg, dict):
                        role = msg.get("role", "user")
                        content = msg.get("content", "")
                        if role == "user":
                            messages.append(HumanMessage(content=content))
                        elif role == "assistant":
                            messages.append(AIMessage(content=content))
                    elif isinstance(msg, (HumanMessage, AIMessage, SystemMessage, ToolMessage)):
                        messages.append(msg)
            
            # Add current query
            messages.append(HumanMessage(content=query))
            
            # Create Langfuse generation span for LLM call
            generation = None
            if langfuse_trace:
                try:
                    generation = langfuse_trace.generation(
                        name="agent-invoke",
                        model=self.llm_config.get("model", "unknown"),
                        input=query,
                        metadata={
                            "agent_name": self.name,
                            "agent_type": self.agent_type,
                            "chat_history_length": len(chat_history) if chat_history else 0,
                        },
                    )
                except Exception as e:
                    logger.warning(f"Failed to create Langfuse generation: {e}")
            
            # Invoke agent with messages format (create_agent API)
            try:
                result = await self.agent.ainvoke({"messages": messages})
            except Exception as e:
                logger.error(f"Error invoking agent: {e}")
                
                # Log error to Langfuse
                if generation:
                    try:
                        generation.end(
                            level="ERROR",
                            status_message=str(e),
                        )
                    except:
                        pass
                
                return {
                    "success": False,
                    "error": str(e),
                    "agent": self.name,
                    "agent_type": self.agent_type
                }
            
            # Extract response from result
            # create_agent returns a state dict with messages
            tool_calls = []
            response = ""
            
            if isinstance(result, dict):
                # Extract messages from state
                if "messages" in result:
                    response_messages = result["messages"]
                    # Get the last message which should be the AI response
                    if response_messages:
                        last_message = response_messages[-1]
                        if hasattr(last_message, "content"):
                            response = last_message.content
                        elif isinstance(last_message, dict):
                            response = last_message.get("content", str(last_message))
                        else:
                            response = str(last_message)
                        
                        # Extract tool calls if any
                        for msg in response_messages:
                            if hasattr(msg, "tool_calls") and msg.tool_calls:
                                for tool_call in msg.tool_calls:
                                    tool_name = tool_call.get("name", "") if isinstance(tool_call, dict) else getattr(tool_call, "name", "")
                                    tool_args = tool_call.get("args", {}) if isinstance(tool_call, dict) else getattr(tool_call, "args", {})
                                    tool_calls.append({
                                        "tool": tool_name,
                                        "input": tool_args,
                                        "output": ""  # Tool outputs are handled by the agent
                                    })
                elif "output" in result:
                    response = result["output"]
                else:
                    response = str(result)
            elif hasattr(result, "content"):
                response = result.content
            else:
                response = str(result)
            
            if not response:
                response = "No response generated"
            
            end_time = datetime.now()
            execution_time = (end_time - start_time).total_seconds() * 1000
            
            # End Langfuse generation with output
            if generation:
                try:
                    # Estimate token usage (rough: 1 token ≈ 4 characters)
                    input_tokens = len(query) // 4
                    output_tokens = len(response) // 4
                    
                    generation.end(
                        output=response,
                        usage={
                            "input": input_tokens,
                            "output": output_tokens,
                            "total": input_tokens + output_tokens,
                        },
                        latency=execution_time,
                    )
                except Exception as e:
                    logger.warning(f"Failed to end Langfuse generation: {e}")
            
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
