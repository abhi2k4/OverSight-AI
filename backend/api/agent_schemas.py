"""
Pydantic schemas for agent API endpoints
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class AgentTypeEnum(str, Enum):
    """Agent type enumeration"""
    SUPERVISOR = "supervisor"
    DATA_DISCOVERY = "data_discovery"
    METADATA = "metadata"
    COMPLIANCE = "compliance"
    ANALYTICS = "analytics"


class AgentStatusEnum(str, Enum):
    """Agent status enumeration"""
    ACTIVE = "active"
    IDLE = "idle"
    TRAINING = "training"
    SUSPENDED = "suspended"


class RiskLevelEnum(str, Enum):
    """Risk level enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class MessageRoleEnum(str, Enum):
    """Message role enumeration"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    TOOL = "tool"


# Request Schemas
class AgentCreateRequest(BaseModel):
    """Request schema for creating an agent"""
    name: str = Field(..., description="Agent name")
    agent_type: AgentTypeEnum = Field(..., description="Type of agent")
    description: Optional[str] = Field(None, description="Agent description")
    owner: Optional[str] = Field(None, description="Agent owner/team")
    llm_config: Optional[Dict[str, Any]] = Field(default_factory=dict, description="LLM configuration")
    tools_enabled: Optional[List[str]] = Field(default_factory=list, description="Enabled tools")
    risk_level: RiskLevelEnum = Field(RiskLevelEnum.LOW, description="Risk level")


class AgentUpdateRequest(BaseModel):
    """Request schema for updating an agent"""
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[AgentStatusEnum] = None
    owner: Optional[str] = None
    llm_config: Optional[Dict[str, Any]] = None
    tools_enabled: Optional[List[str]] = None
    risk_level: Optional[RiskLevelEnum] = None
    trust_score: Optional[float] = None


class AgentQueryRequest(BaseModel):
    """Request schema for querying an agent"""
    query: str = Field(..., description="User query")
    session_id: Optional[str] = Field(None, description="Session ID for conversation context")
    user_id: Optional[str] = Field(None, description="User ID")
    include_history: bool = Field(True, description="Include conversation history")


# Response Schemas
class AgentResponse(BaseModel):
    """Response schema for agent data"""
    id: str
    name: str
    agent_type: str
    description: Optional[str]
    status: str
    owner: Optional[str]
    llm_config: Dict[str, Any]
    tools_enabled: List[str]
    trust_score: float
    risk_level: str
    created_at: datetime
    updated_at: Optional[datetime]
    last_active_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class AgentListResponse(BaseModel):
    """Response schema for list of agents"""
    agents: List[AgentResponse]
    total: int
    limit: int
    offset: int


class AgentQueryResponse(BaseModel):
    """Response schema for agent query results"""
    success: bool
    response: str
    agent: str
    agent_type: str
    execution_time_ms: int
    timestamp: str
    routed_to: Optional[List[str]] = None
    tool_calls: Optional[List[Dict[str, Any]]] = None
    session_id: Optional[str] = None
    conversation_id: Optional[str] = None


class ConversationResponse(BaseModel):
    """Response schema for conversation data"""
    id: str
    agent_id: str
    user_id: Optional[str]
    session_id: str
    created_at: datetime
    message_count: int
    
    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    """Response schema for message data"""
    id: str
    conversation_id: str
    role: str
    content: str
    metadata: Dict[str, Any]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ConversationDetailResponse(BaseModel):
    """Response schema for conversation with messages"""
    conversation: ConversationResponse
    messages: List[MessageResponse]


class AgentStatsResponse(BaseModel):
    """Response schema for agent statistics"""
    agent_id: str
    name: str
    status: str
    trust_score: float
    conversation_count: int
    message_count: int
    tool_execution_count: int
    last_active: Optional[str]


class ToolExecutionResponse(BaseModel):
    """Response schema for tool execution data"""
    id: str
    agent_id: str
    tool_name: str
    input_params: Dict[str, Any]
    output_result: Dict[str, Any]
    execution_time_ms: Optional[int]
    success: bool
    error_message: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ToolStatsResponse(BaseModel):
    """Response schema for tool statistics"""
    total_executions: int
    success_count: int
    failure_count: int
    success_rate: float
    average_execution_time_ms: float
    tool_usage: Dict[str, int]
