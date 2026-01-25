"""
API routes for agent management and interaction
"""
import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import AgentType, AgentStatus, RiskLevel, MessageRole
from backend.repositories.agent_repository import (
    AgentRepository,
    ConversationRepository,
    ToolExecutionRepository
)
from backend.api.agent_schemas import (
    AgentCreateRequest,
    AgentUpdateRequest,
    AgentQueryRequest,
    AgentResponse,
    AgentListResponse,
    AgentQueryResponse,
    AgentStatsResponse,
    ConversationResponse,
    ConversationDetailResponse,
    MessageResponse,
    ToolStatsResponse
)
from backend.agents.supervisor_agent import get_supervisor_agent
from backend.agents.specialized_agents import get_agent_by_type
from backend.api.config import AGENT_PROMPTS

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agents", tags=["agents"])


@router.post("/", response_model=AgentResponse)
async def create_agent(
    request: AgentCreateRequest,
    db: Session = Depends(get_db)
):
    """Create a new agent"""
    try:
        repo = AgentRepository(db)
        
        # Check if agent with same name exists
        existing = repo.get_agent_by_name(request.name)
        if existing:
            raise HTTPException(status_code=400, detail=f"Agent with name '{request.name}' already exists")
        
        # Get specialization prompt from config
        specialization_prompt = AGENT_PROMPTS.get(request.agent_type.value)
        
        # Create agent
        agent = repo.create_agent(
            name=request.name,
            agent_type=AgentType[request.agent_type.value.upper()],
            description=request.description,
            owner=request.owner,
            llm_config=request.llm_config,
            tools_enabled=request.tools_enabled,
            specialization_prompt=specialization_prompt,
            risk_level=RiskLevel[request.risk_level.value.upper()]
        )
        
        return AgentResponse.model_validate(agent)
        
    except Exception as e:
        logger.error(f"Error creating agent: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=AgentListResponse)
async def list_agents(
    status: Optional[str] = Query(None, description="Filter by status"),
    agent_type: Optional[str] = Query(None, description="Filter by type"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """List all agents with optional filters"""
    try:
        repo = AgentRepository(db)
        
        # Convert string to enum if provided
        status_enum = AgentStatus[status.upper()] if status else None
        type_enum = AgentType[agent_type.upper()] if agent_type else None
        
        agents = repo.list_agents(
            status=status_enum,
            agent_type=type_enum,
            limit=limit,
            offset=offset
        )
        
        total = len(agents)  # In production, add count query
        
        return AgentListResponse(
            agents=[AgentResponse.model_validate(agent) for agent in agents],
            total=total,
            limit=limit,
            offset=offset
        )
        
    except Exception as e:
        logger.error(f"Error listing agents: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: str,
    db: Session = Depends(get_db)
):
    """Get agent by ID"""
    try:
        repo = AgentRepository(db)
        agent = repo.get_agent(agent_id)
        
        if not agent:
            raise HTTPException(status_code=404, detail=f"Agent not found: {agent_id}")
        
        return AgentResponse.model_validate(agent)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting agent: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: str,
    request: AgentUpdateRequest,
    db: Session = Depends(get_db)
):
    """Update agent configuration"""
    try:
        repo = AgentRepository(db)
        
        # Build update dict
        update_data = {}
        if request.name is not None:
            update_data["name"] = request.name
        if request.description is not None:
            update_data["description"] = request.description
        if request.status is not None:
            update_data["status"] = AgentStatus[request.status.value.upper()]
        if request.owner is not None:
            update_data["owner"] = request.owner
        if request.llm_config is not None:
            update_data["llm_config"] = request.llm_config
        if request.tools_enabled is not None:
            update_data["tools_enabled"] = request.tools_enabled
        if request.risk_level is not None:
            update_data["risk_level"] = RiskLevel[request.risk_level.value.upper()]
        if request.trust_score is not None:
            update_data["trust_score"] = request.trust_score
        
        agent = repo.update_agent(agent_id, **update_data)
        
        if not agent:
            raise HTTPException(status_code=404, detail=f"Agent not found: {agent_id}")
        
        return AgentResponse.model_validate(agent)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating agent: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{agent_id}")
async def delete_agent(
    agent_id: str,
    db: Session = Depends(get_db)
):
    """Delete an agent"""
    try:
        repo = AgentRepository(db)
        success = repo.delete_agent(agent_id)
        
        if not success:
            raise HTTPException(status_code=404, detail=f"Agent not found: {agent_id}")
        
        return {"success": True, "message": f"Agent {agent_id} deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting agent: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/query", response_model=AgentQueryResponse)
async def query_agent(
    request: AgentQueryRequest,
    agent_type: Optional[str] = Query("supervisor", description="Agent type to query"),
    db: Session = Depends(get_db)
):
    """
    Query an agent with a natural language question.
    Uses supervisor agent by default for intelligent routing.
    """
    try:
        # Get or create conversation
        conv_repo = ConversationRepository(db)
        agent_repo = AgentRepository(db)
        
        # Determine which agent to use
        if agent_type == "supervisor":
            agent = get_supervisor_agent()
        else:
            agent = get_agent_by_type(agent_type)
            if not agent:
                raise HTTPException(status_code=400, detail=f"Invalid agent type: {agent_type}")
        
        # Get or create session
        session_id = request.session_id
        conversations = conv_repo.get_conversations_by_session(session_id) if session_id else []
        
        # Get conversation history if requested
        chat_history = []
        conversation_id = None
        
        if request.include_history and conversations:
            # Use most recent conversation
            latest_conv = conversations[-1]
            conversation_id = latest_conv.id
            messages = conv_repo.get_recent_messages(conversation_id, limit=10)
            
            # Convert to chat history format
            for msg in reversed(messages):  # Oldest first
                if msg.role == MessageRole.USER:
                    chat_history.append(("human", msg.content))
                elif msg.role == MessageRole.ASSISTANT:
                    chat_history.append(("assistant", msg.content))
        
        # Process query
        result = await agent.process_query(
            query=request.query,
            chat_history=chat_history,
            session_id=session_id
        )
        
        # Create or get conversation for logging
        if not conversation_id:
            # Find agent in DB or create placeholder
            agent_name = agent.name
            db_agent = agent_repo.get_agent_by_name(agent_name)
            if db_agent:
                conversation = conv_repo.create_conversation(
                    agent_id=db_agent.id,
                    user_id=request.user_id,
                    session_id=session_id or result.get("timestamp", "default")
                )
                conversation_id = conversation.id
        
        # Log messages if we have a conversation
        if conversation_id:
            # Log user message
            conv_repo.add_message(
                conversation_id=conversation_id,
                role=MessageRole.USER,
                content=request.query
            )
            
            # Log assistant response
            conv_repo.add_message(
                conversation_id=conversation_id,
                role=MessageRole.ASSISTANT,
                content=result.get("response", ""),
                message_metadata={
                    "tool_calls": result.get("tool_calls", []),
                    "execution_time_ms": result.get("execution_time_ms", 0),
                    "routed_to": result.get("routed_to", [])
                }
            )
        
        return AgentQueryResponse(
            success=result.get("success", True),
            response=result.get("response", ""),
            agent=result.get("agent", agent.name),
            agent_type=result.get("agent_type", agent.agent_type),
            execution_time_ms=result.get("execution_time_ms", 0),
            timestamp=result.get("timestamp", ""),
            routed_to=result.get("routed_to"),
            tool_calls=result.get("tool_calls"),
            session_id=session_id,
            conversation_id=conversation_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying agent: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{agent_id}/stats", response_model=AgentStatsResponse)
async def get_agent_stats(
    agent_id: str,
    db: Session = Depends(get_db)
):
    """Get statistics for an agent"""
    try:
        repo = AgentRepository(db)
        stats = repo.get_agent_stats(agent_id)
        
        if not stats:
            raise HTTPException(status_code=404, detail=f"Agent not found: {agent_id}")
        
        return AgentStatsResponse(**stats)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting agent stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{agent_id}/conversations", response_model=List[ConversationResponse])
async def get_agent_conversations(
    agent_id: str,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Get conversations for an agent"""
    try:
        conv_repo = ConversationRepository(db)
        conversations = conv_repo.get_conversations_by_agent(agent_id, limit=limit, offset=offset)
        
        result = []
        for conv in conversations:
            messages = conv_repo.get_messages(conv.id)
            result.append(
                ConversationResponse(
                    id=conv.id,
                    agent_id=conv.agent_id,
                    user_id=conv.user_id,
                    session_id=conv.session_id,
                    created_at=conv.created_at,
                    message_count=len(messages)
                )
            )
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting conversations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation_detail(
    conversation_id: str,
    db: Session = Depends(get_db)
):
    """Get conversation with all messages"""
    try:
        conv_repo = ConversationRepository(db)
        conversation = conv_repo.get_conversation(conversation_id)
        
        if not conversation:
            raise HTTPException(status_code=404, detail=f"Conversation not found: {conversation_id}")
        
        messages = conv_repo.get_messages(conversation_id)
        
        return ConversationDetailResponse(
            conversation=ConversationResponse(
                id=conversation.id,
                agent_id=conversation.agent_id,
                user_id=conversation.user_id,
                session_id=conversation.session_id,
                created_at=conversation.created_at,
                message_count=len(messages)
            ),
            messages=[MessageResponse.model_validate(msg) for msg in messages]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting conversation detail: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tools/stats", response_model=ToolStatsResponse)
async def get_tool_stats(
    agent_id: Optional[str] = Query(None, description="Filter by agent ID"),
    db: Session = Depends(get_db)
):
    """Get tool execution statistics"""
    try:
        tool_repo = ToolExecutionRepository(db)
        stats = tool_repo.get_tool_stats(agent_id=agent_id)
        
        return ToolStatsResponse(**stats)
        
    except Exception as e:
        logger.error(f"Error getting tool stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
