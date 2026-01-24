"""
Memory management for agent conversations
Handles short-term (in-memory) and long-term (database) conversation history
"""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from sqlalchemy.orm import Session

from backend.repositories.agent_repository import ConversationRepository
from backend.models import MessageRole
from backend.api.config import settings

logger = logging.getLogger(__name__)


class ConversationMemory:
    """Manages conversation history for agents"""
    
    def __init__(self, session_id: str, conversation_id: Optional[str] = None):
        self.session_id = session_id
        self.conversation_id = conversation_id
        self._messages = []
        self._max_messages = settings.agent_conversation_memory_size
    
    def add_message(self, role: str, content: str, metadata: Optional[Dict[str, Any]] = None):
        """Add a message to memory"""
        message = {
            "role": role,
            "content": content,
            "metadata": metadata or {},
            "timestamp": datetime.now().isoformat()
        }
        self._messages.append(message)
        
        # Trim if exceeds max size (keep most recent)
        if len(self._messages) > self._max_messages:
            self._messages = self._messages[-self._max_messages:]
    
    def get_messages(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get messages from memory"""
        if limit:
            return self._messages[-limit:]
        return self._messages
    
    def get_langchain_messages(self, limit: Optional[int] = None) -> List:
        """Convert messages to LangChain format"""
        messages = self.get_messages(limit=limit)
        
        langchain_messages = []
        for msg in messages:
            role = msg["role"]
            content = msg["content"]
            
            if role == "user":
                langchain_messages.append(HumanMessage(content=content))
            elif role == "assistant":
                langchain_messages.append(AIMessage(content=content))
            elif role == "system":
                langchain_messages.append(SystemMessage(content=content))
        
        return langchain_messages
    
    def clear(self):
        """Clear all messages from memory"""
        self._messages = []
    
    def to_chat_history(self) -> List[tuple]:
        """Convert to simple chat history format (role, content)"""
        return [(msg["role"], msg["content"]) for msg in self._messages]


class MemoryManager:
    """
    Manages conversation memories across sessions
    Handles both in-memory (active sessions) and database persistence
    """
    
    def __init__(self):
        self._active_memories: Dict[str, ConversationMemory] = {}
        self._last_access: Dict[str, datetime] = {}
        self._cleanup_threshold = timedelta(minutes=settings.agent_session_timeout_minutes)
    
    def get_or_create_memory(
        self,
        session_id: str,
        conversation_id: Optional[str] = None,
        db: Optional[Session] = None
    ) -> ConversationMemory:
        """
        Get existing memory or create new one
        Loads from database if exists
        """
        # Check if in active memory
        if session_id in self._active_memories:
            self._last_access[session_id] = datetime.now()
            return self._active_memories[session_id]
        
        # Create new memory
        memory = ConversationMemory(session_id, conversation_id)
        
        # Try to load from database if conversation_id provided
        if conversation_id and db:
            self._load_from_database(memory, conversation_id, db)
        
        # Store in active memory
        self._active_memories[session_id] = memory
        self._last_access[session_id] = datetime.now()
        
        return memory
    
    def _load_from_database(
        self,
        memory: ConversationMemory,
        conversation_id: str,
        db: Session
    ):
        """Load conversation history from database"""
        try:
            conv_repo = ConversationRepository(db)
            messages = conv_repo.get_recent_messages(
                conversation_id,
                limit=settings.agent_conversation_memory_size
            )
            
            # Load messages in chronological order
            for msg in reversed(messages):
                memory.add_message(
                    role=msg.role.value,
                    content=msg.content,
                    metadata=msg.metadata or {}
                )
            
            logger.info(f"Loaded {len(messages)} messages from database for conversation {conversation_id}")
            
        except Exception as e:
            logger.error(f"Error loading conversation from database: {e}")
    
    def persist_to_database(
        self,
        session_id: str,
        conversation_id: str,
        db: Session
    ):
        """Persist conversation memory to database"""
        if session_id not in self._active_memories:
            return
        
        try:
            memory = self._active_memories[session_id]
            conv_repo = ConversationRepository(db)
            
            # Get messages that haven't been persisted yet
            messages = memory.get_messages()
            
            for msg in messages:
                # Check if message needs to be persisted
                # (In production, track which messages are already persisted)
                role_enum = MessageRole[msg["role"].upper()]
                conv_repo.add_message(
                    conversation_id=conversation_id,
                    role=role_enum,
                    content=msg["content"],
                    metadata=msg.get("metadata")
                )
            
            logger.info(f"Persisted {len(messages)} messages to database")
            
        except Exception as e:
            logger.error(f"Error persisting conversation to database: {e}")
    
    def cleanup_inactive_sessions(self):
        """Remove inactive sessions from memory"""
        now = datetime.now()
        inactive_sessions = []
        
        for session_id, last_access in self._last_access.items():
            if now - last_access > self._cleanup_threshold:
                inactive_sessions.append(session_id)
        
        for session_id in inactive_sessions:
            if session_id in self._active_memories:
                del self._active_memories[session_id]
            if session_id in self._last_access:
                del self._last_access[session_id]
        
        if inactive_sessions:
            logger.info(f"Cleaned up {len(inactive_sessions)} inactive sessions")
    
    def get_active_session_count(self) -> int:
        """Get number of active sessions"""
        return len(self._active_memories)
    
    def clear_session(self, session_id: str):
        """Clear a specific session from memory"""
        if session_id in self._active_memories:
            del self._active_memories[session_id]
        if session_id in self._last_access:
            del self._last_access[session_id]


class ConversationContext:
    """
    Context manager for handling conversation sessions
    Automatically persists to database when context exits
    """
    
    def __init__(
        self,
        session_id: str,
        conversation_id: Optional[str],
        db: Session,
        memory_manager: MemoryManager
    ):
        self.session_id = session_id
        self.conversation_id = conversation_id
        self.db = db
        self.memory_manager = memory_manager
        self.memory: Optional[ConversationMemory] = None
    
    def __enter__(self) -> ConversationMemory:
        """Enter context - get or create memory"""
        self.memory = self.memory_manager.get_or_create_memory(
            session_id=self.session_id,
            conversation_id=self.conversation_id,
            db=self.db
        )
        return self.memory
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Exit context - persist to database if conversation_id exists"""
        if self.conversation_id and self.memory:
            self.memory_manager.persist_to_database(
                session_id=self.session_id,
                conversation_id=self.conversation_id,
                db=self.db
            )


# Singleton instance
_memory_manager: Optional[MemoryManager] = None


def get_memory_manager() -> MemoryManager:
    """Get or create memory manager singleton"""
    global _memory_manager
    if _memory_manager is None:
        _memory_manager = MemoryManager()
    return _memory_manager


def create_conversation_context(
    session_id: str,
    conversation_id: Optional[str],
    db: Session
) -> ConversationContext:
    """
    Create a conversation context for managing memory
    
    Usage:
        with create_conversation_context(session_id, conv_id, db) as memory:
            memory.add_message("user", "Hello")
            # ... process conversation ...
            # Memory automatically persisted on exit
    """
    manager = get_memory_manager()
    return ConversationContext(session_id, conversation_id, db, manager)
