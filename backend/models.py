from sqlalchemy import Column, Integer, String, JSON, DateTime, Index, Float, Boolean, ForeignKey, Text, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from backend.database import Base


class AgentType(str, enum.Enum):
    """Agent type enumeration"""
    SUPERVISOR = "supervisor"
    DATA_DISCOVERY = "data_discovery"
    METADATA = "metadata"
    COMPLIANCE = "compliance"
    ANALYTICS = "analytics"


class AgentStatus(str, enum.Enum):
    """Agent status enumeration"""
    ACTIVE = "active"
    IDLE = "idle"
    TRAINING = "training"
    SUSPENDED = "suspended"


class RiskLevel(str, enum.Enum):
    """Risk level enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class MessageRole(str, enum.Enum):
    """Message role enumeration"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    TOOL = "tool"


class UnifiedRecord(Base):
    __tablename__ = "unified_records"

    id = Column(Integer, primary_key=True, index=True)
    source_system = Column(String, index=True)  # e.g., 'product_db', 'sales_nosql', 'users_csv'
    entity_type = Column(String, index=True)    # e.g., 'product', 'transaction', 'user'
    raw_data = Column(JSON)                     # Stores the flexible payload
    
    ingestion_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Placeholder for future governance fields
    # risk_score = Column(Float, nullable=True)
    # compliance_status = Column(String, nullable=True)


class EnrichedRecord(Base):
    """Model for storing enriched records with AI-generated metadata"""
    __tablename__ = "enriched_records"

    id = Column(Integer, primary_key=True, index=True)
    
    # Source metadata
    source_system = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(100), nullable=False, index=True)
    
    # Data
    raw_data = Column(JSON, nullable=False)
    enriched_metadata = Column(JSON, nullable=False)  # {description, tags, confidence, entities}
    
    # Timestamps
    ingestion_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    enrichment_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Versioning
    enrichment_version = Column(String(50))
    
    # Add index for common queries
    __table_args__ = (
        Index('idx_enrichment_ts', 'enrichment_timestamp'),
    )


class Agent(Base):
    """Model for AI agent registration and configuration"""
    __tablename__ = "agents"

    id = Column(String(36), primary_key=True)  # UUID
    name = Column(String(100), unique=True, nullable=False, index=True)
    agent_type = Column(Enum(AgentType), nullable=False, index=True)
    description = Column(Text, nullable=True)
    status = Column(Enum(AgentStatus), default=AgentStatus.ACTIVE, index=True)
    owner = Column(String(100), nullable=True)
    
    # Configuration
    llm_config = Column(JSON, nullable=True)  # {model, temperature, max_tokens}
    tools_enabled = Column(JSON, nullable=True)  # Array of tool names
    specialization_prompt = Column(Text, nullable=True)  # System prompt
    
    # Metrics
    trust_score = Column(Float, default=0.0)
    risk_level = Column(Enum(RiskLevel), default=RiskLevel.LOW)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_active_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    conversations = relationship("AgentConversation", back_populates="agent", cascade="all, delete-orphan")
    tool_executions = relationship("AgentToolExecution", back_populates="agent", cascade="all, delete-orphan")


class AgentConversation(Base):
    """Model for agent conversation sessions"""
    __tablename__ = "agent_conversations"

    id = Column(String(36), primary_key=True)  # UUID
    agent_id = Column(String(36), ForeignKey("agents.id"), nullable=False, index=True)
    user_id = Column(String(100), nullable=True, index=True)  # From Keycloak
    session_id = Column(String(36), nullable=False, index=True)  # Groups related queries
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    agent = relationship("Agent", back_populates="conversations")
    messages = relationship("AgentMessage", back_populates="conversation", cascade="all, delete-orphan")
    tool_executions = relationship("AgentToolExecution", back_populates="conversation", cascade="all, delete-orphan")


class AgentMessage(Base):
    """Model for conversation messages"""
    __tablename__ = "agent_messages"

    id = Column(String(36), primary_key=True)  # UUID
    conversation_id = Column(String(36), ForeignKey("agent_conversations.id"), nullable=False, index=True)
    role = Column(Enum(MessageRole), nullable=False)
    content = Column(Text, nullable=False)
    metadata = Column(JSON, nullable=True)  # Tool calls, thinking, sources
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    conversation = relationship("AgentConversation", back_populates="messages")


class AgentToolExecution(Base):
    """Model for tracking agent tool executions"""
    __tablename__ = "agent_tool_executions"

    id = Column(String(36), primary_key=True)  # UUID
    agent_id = Column(String(36), ForeignKey("agents.id"), nullable=False, index=True)
    conversation_id = Column(String(36), ForeignKey("agent_conversations.id"), nullable=True, index=True)
    tool_name = Column(String(100), nullable=False, index=True)
    
    # Execution data
    input_params = Column(JSON, nullable=True)
    output_result = Column(JSON, nullable=True)
    execution_time_ms = Column(Integer, nullable=True)
    success = Column(Boolean, default=True)
    error_message = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    agent = relationship("Agent", back_populates="tool_executions")
    conversation = relationship("AgentConversation", back_populates="tool_executions")
