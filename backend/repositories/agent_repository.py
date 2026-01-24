"""
Repository for agent database operations
"""
import uuid
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.models import (
    Agent, AgentConversation, AgentMessage, AgentToolExecution,
    AgentType, AgentStatus, RiskLevel, MessageRole
)

logger = logging.getLogger(__name__)


class AgentRepository:
    """Repository for agent CRUD operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_agent(
        self,
        name: str,
        agent_type: AgentType,
        description: Optional[str] = None,
        owner: Optional[str] = None,
        llm_config: Optional[Dict[str, Any]] = None,
        tools_enabled: Optional[List[str]] = None,
        specialization_prompt: Optional[str] = None,
        risk_level: RiskLevel = RiskLevel.LOW
    ) -> Agent:
        """Create a new agent"""
        agent = Agent(
            id=str(uuid.uuid4()),
            name=name,
            agent_type=agent_type,
            description=description,
            owner=owner,
            status=AgentStatus.ACTIVE,
            llm_config=llm_config or {},
            tools_enabled=tools_enabled or [],
            specialization_prompt=specialization_prompt,
            trust_score=0.0,
            risk_level=risk_level
        )
        
        self.db.add(agent)
        self.db.commit()
        self.db.refresh(agent)
        
        logger.info(f"Created agent: {name} ({agent_type})")
        return agent
    
    def get_agent(self, agent_id: str) -> Optional[Agent]:
        """Get agent by ID"""
        return self.db.query(Agent).filter(Agent.id == agent_id).first()
    
    def get_agent_by_name(self, name: str) -> Optional[Agent]:
        """Get agent by name"""
        return self.db.query(Agent).filter(Agent.name == name).first()
    
    def list_agents(
        self,
        status: Optional[AgentStatus] = None,
        agent_type: Optional[AgentType] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Agent]:
        """List agents with optional filters"""
        query = self.db.query(Agent)
        
        if status:
            query = query.filter(Agent.status == status)
        
        if agent_type:
            query = query.filter(Agent.agent_type == agent_type)
        
        return query.order_by(desc(Agent.created_at)).limit(limit).offset(offset).all()
    
    def update_agent(
        self,
        agent_id: str,
        **kwargs
    ) -> Optional[Agent]:
        """Update agent fields"""
        agent = self.get_agent(agent_id)
        if not agent:
            return None
        
        for key, value in kwargs.items():
            if hasattr(agent, key):
                setattr(agent, key, value)
        
        agent.updated_at = datetime.now()
        self.db.commit()
        self.db.refresh(agent)
        
        logger.info(f"Updated agent: {agent_id}")
        return agent
    
    def update_agent_activity(self, agent_id: str) -> Optional[Agent]:
        """Update last activity timestamp"""
        agent = self.get_agent(agent_id)
        if agent:
            agent.last_active_at = datetime.now()
            self.db.commit()
            self.db.refresh(agent)
        return agent
    
    def update_trust_score(self, agent_id: str, score: float) -> Optional[Agent]:
        """Update agent trust score"""
        return self.update_agent(agent_id, trust_score=score)
    
    def delete_agent(self, agent_id: str) -> bool:
        """Delete an agent"""
        agent = self.get_agent(agent_id)
        if agent:
            self.db.delete(agent)
            self.db.commit()
            logger.info(f"Deleted agent: {agent_id}")
            return True
        return False
    
    def get_agent_stats(self, agent_id: str) -> Dict[str, Any]:
        """Get statistics for an agent"""
        agent = self.get_agent(agent_id)
        if not agent:
            return {}
        
        conversation_count = self.db.query(AgentConversation).filter(
            AgentConversation.agent_id == agent_id
        ).count()
        
        message_count = self.db.query(AgentMessage).join(AgentConversation).filter(
            AgentConversation.agent_id == agent_id
        ).count()
        
        tool_execution_count = self.db.query(AgentToolExecution).filter(
            AgentToolExecution.agent_id == agent_id
        ).count()
        
        return {
            "agent_id": agent_id,
            "name": agent.name,
            "status": agent.status.value,
            "trust_score": agent.trust_score,
            "conversation_count": conversation_count,
            "message_count": message_count,
            "tool_execution_count": tool_execution_count,
            "last_active": agent.last_active_at.isoformat() if agent.last_active_at else None
        }


class ConversationRepository:
    """Repository for conversation operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_conversation(
        self,
        agent_id: str,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> AgentConversation:
        """Create a new conversation"""
        conversation = AgentConversation(
            id=str(uuid.uuid4()),
            agent_id=agent_id,
            user_id=user_id,
            session_id=session_id or str(uuid.uuid4())
        )
        
        self.db.add(conversation)
        self.db.commit()
        self.db.refresh(conversation)
        
        return conversation
    
    def get_conversation(self, conversation_id: str) -> Optional[AgentConversation]:
        """Get conversation by ID"""
        return self.db.query(AgentConversation).filter(
            AgentConversation.id == conversation_id
        ).first()
    
    def get_conversations_by_session(self, session_id: str) -> List[AgentConversation]:
        """Get all conversations in a session"""
        return self.db.query(AgentConversation).filter(
            AgentConversation.session_id == session_id
        ).order_by(AgentConversation.created_at).all()
    
    def get_conversations_by_agent(
        self,
        agent_id: str,
        limit: int = 50,
        offset: int = 0
    ) -> List[AgentConversation]:
        """Get conversations for an agent"""
        return self.db.query(AgentConversation).filter(
            AgentConversation.agent_id == agent_id
        ).order_by(desc(AgentConversation.created_at)).limit(limit).offset(offset).all()
    
    def add_message(
        self,
        conversation_id: str,
        role: MessageRole,
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> AgentMessage:
        """Add a message to a conversation"""
        message = AgentMessage(
            id=str(uuid.uuid4()),
            conversation_id=conversation_id,
            role=role,
            content=content,
            metadata=metadata or {}
        )
        
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        
        return message
    
    def get_messages(
        self,
        conversation_id: str,
        limit: Optional[int] = None
    ) -> List[AgentMessage]:
        """Get messages in a conversation"""
        query = self.db.query(AgentMessage).filter(
            AgentMessage.conversation_id == conversation_id
        ).order_by(AgentMessage.created_at)
        
        if limit:
            query = query.limit(limit)
        
        return query.all()
    
    def get_recent_messages(
        self,
        conversation_id: str,
        limit: int = 50
    ) -> List[AgentMessage]:
        """Get recent messages in a conversation"""
        return self.db.query(AgentMessage).filter(
            AgentMessage.conversation_id == conversation_id
        ).order_by(desc(AgentMessage.created_at)).limit(limit).all()


class ToolExecutionRepository:
    """Repository for tool execution tracking"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def log_execution(
        self,
        agent_id: str,
        tool_name: str,
        input_params: Optional[Dict[str, Any]] = None,
        output_result: Optional[Dict[str, Any]] = None,
        execution_time_ms: Optional[int] = None,
        success: bool = True,
        error_message: Optional[str] = None,
        conversation_id: Optional[str] = None
    ) -> AgentToolExecution:
        """Log a tool execution"""
        execution = AgentToolExecution(
            id=str(uuid.uuid4()),
            agent_id=agent_id,
            conversation_id=conversation_id,
            tool_name=tool_name,
            input_params=input_params or {},
            output_result=output_result or {},
            execution_time_ms=execution_time_ms,
            success=success,
            error_message=error_message
        )
        
        self.db.add(execution)
        self.db.commit()
        self.db.refresh(execution)
        
        return execution
    
    def get_executions_by_agent(
        self,
        agent_id: str,
        limit: int = 100,
        offset: int = 0
    ) -> List[AgentToolExecution]:
        """Get tool executions for an agent"""
        return self.db.query(AgentToolExecution).filter(
            AgentToolExecution.agent_id == agent_id
        ).order_by(desc(AgentToolExecution.created_at)).limit(limit).offset(offset).all()
    
    def get_executions_by_conversation(
        self,
        conversation_id: str
    ) -> List[AgentToolExecution]:
        """Get tool executions for a conversation"""
        return self.db.query(AgentToolExecution).filter(
            AgentToolExecution.conversation_id == conversation_id
        ).order_by(AgentToolExecution.created_at).all()
    
    def get_tool_stats(self, agent_id: Optional[str] = None) -> Dict[str, Any]:
        """Get tool execution statistics"""
        query = self.db.query(AgentToolExecution)
        
        if agent_id:
            query = query.filter(AgentToolExecution.agent_id == agent_id)
        
        executions = query.all()
        
        tool_counts = {}
        total_time = 0
        success_count = 0
        
        for execution in executions:
            tool_name = execution.tool_name
            tool_counts[tool_name] = tool_counts.get(tool_name, 0) + 1
            
            if execution.execution_time_ms:
                total_time += execution.execution_time_ms
            
            if execution.success:
                success_count += 1
        
        return {
            "total_executions": len(executions),
            "success_count": success_count,
            "failure_count": len(executions) - success_count,
            "success_rate": success_count / len(executions) if executions else 0,
            "average_execution_time_ms": total_time / len(executions) if executions else 0,
            "tool_usage": tool_counts
        }
