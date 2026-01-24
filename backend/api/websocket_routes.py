"""
WebSocket routes for real-time agent interactions
"""
import json
import logging
import asyncio
from typing import Dict, Set
from datetime import datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.agents.supervisor_agent import get_supervisor_agent
from backend.agents.specialized_agents import get_agent_by_type
from backend.agents.memory_manager import get_memory_manager, create_conversation_context
from backend.repositories.agent_repository import ConversationRepository, AgentRepository
from backend.models import MessageRole
from backend.api.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["websocket"])


class ConnectionManager:
    """Manages WebSocket connections"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.connection_count = 0
    
    async def connect(self, websocket: WebSocket, client_id: str):
        """Accept and register a new WebSocket connection"""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.connection_count += 1
        logger.info(f"Client {client_id} connected. Total connections: {self.connection_count}")
    
    def disconnect(self, client_id: str):
        """Remove a WebSocket connection"""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            self.connection_count -= 1
            logger.info(f"Client {client_id} disconnected. Total connections: {self.connection_count}")
    
    async def send_message(self, client_id: str, message: dict):
        """Send message to specific client"""
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_json(message)
            except Exception as e:
                logger.error(f"Error sending message to {client_id}: {e}")
                self.disconnect(client_id)
    
    async def send_text(self, client_id: str, text: str):
        """Send text message to specific client"""
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_text(text)
            except Exception as e:
                logger.error(f"Error sending text to {client_id}: {e}")
                self.disconnect(client_id)
    
    def is_connected(self, client_id: str) -> bool:
        """Check if client is connected"""
        return client_id in self.active_connections
    
    def get_connection_count(self) -> int:
        """Get total active connections"""
        return self.connection_count


# Singleton connection manager
manager = ConnectionManager()


@router.websocket("/agent/chat")
async def websocket_agent_chat(
    websocket: WebSocket,
    session_id: str = Query(..., description="Session ID for conversation"),
    agent_type: str = Query("supervisor", description="Agent type to use"),
    user_id: str = Query(None, description="User ID")
):
    """
    WebSocket endpoint for real-time agent chat
    
    Message format (client to server):
    {
        "type": "query",
        "content": "User message here",
        "metadata": {...}
    }
    
    Message format (server to client):
    {
        "type": "response|error|status|thinking",
        "content": "Message content",
        "agent": "Agent name",
        "timestamp": "ISO timestamp",
        "metadata": {...}
    }
    """
    client_id = f"{session_id}_{datetime.now().timestamp()}"
    
    # Get database session
    db = next(get_db())
    
    try:
        # Connect client
        await manager.connect(websocket, client_id)
        
        # Send connection success
        await manager.send_message(client_id, {
            "type": "status",
            "content": "Connected to OverSight AI Agent",
            "session_id": session_id,
            "agent_type": agent_type,
            "timestamp": datetime.now().isoformat()
        })
        
        # Get or create agent
        if agent_type == "supervisor":
            agent = get_supervisor_agent()
        else:
            agent = get_agent_by_type(agent_type)
            if not agent:
                await manager.send_message(client_id, {
                    "type": "error",
                    "content": f"Invalid agent type: {agent_type}",
                    "timestamp": datetime.now().isoformat()
                })
                return
        
        # Initialize repositories
        conv_repo = ConversationRepository(db)
        agent_repo = AgentRepository(db)
        memory_manager = get_memory_manager()
        
        # Get or create conversation
        db_agent = agent_repo.get_agent_by_name(agent.name)
        conversation = None
        conversation_id = None
        
        if db_agent:
            # Check for existing conversations in this session
            existing_convs = conv_repo.get_conversations_by_session(session_id)
            if existing_convs:
                conversation = existing_convs[-1]  # Use most recent
                conversation_id = conversation.id
            else:
                # Create new conversation
                conversation = conv_repo.create_conversation(
                    agent_id=db_agent.id,
                    user_id=user_id,
                    session_id=session_id
                )
                conversation_id = conversation.id
        
        # Main message loop
        while True:
            # Receive message from client
            try:
                data = await websocket.receive_json()
            except Exception as e:
                logger.error(f"Error receiving message: {e}")
                break
            
            message_type = data.get("type")
            content = data.get("content", "")
            
            if message_type == "query":
                try:
                    # Send thinking status
                    await manager.send_message(client_id, {
                        "type": "thinking",
                        "content": "Processing your query...",
                        "timestamp": datetime.now().isoformat()
                    })
                    
                    # Get conversation history
                    chat_history = []
                    if conversation_id:
                        memory = memory_manager.get_or_create_memory(
                            session_id=session_id,
                            conversation_id=conversation_id,
                            db=db
                        )
                        chat_history = memory.to_chat_history()
                    
                    # Process query
                    result = await agent.process_query(
                        query=content,
                        chat_history=chat_history,
                        session_id=session_id
                    )
                    
                    # Save messages to database
                    if conversation_id:
                        # Save user message
                        conv_repo.add_message(
                            conversation_id=conversation_id,
                            role=MessageRole.USER,
                            content=content
                        )
                        
                        # Save assistant response
                        conv_repo.add_message(
                            conversation_id=conversation_id,
                            role=MessageRole.ASSISTANT,
                            content=result.get("response", ""),
                            metadata={
                                "tool_calls": result.get("tool_calls", []),
                                "execution_time_ms": result.get("execution_time_ms", 0)
                            }
                        )
                        
                        # Update memory
                        memory.add_message("user", content)
                        memory.add_message("assistant", result.get("response", ""))
                    
                    # Send response to client
                    await manager.send_message(client_id, {
                        "type": "response",
                        "content": result.get("response", ""),
                        "agent": result.get("agent", agent.name),
                        "agent_type": result.get("agent_type", agent.agent_type),
                        "execution_time_ms": result.get("execution_time_ms", 0),
                        "routed_to": result.get("routed_to", []),
                        "tool_calls": result.get("tool_calls", []),
                        "timestamp": datetime.now().isoformat(),
                        "conversation_id": conversation_id
                    })
                    
                    # Update agent activity
                    if db_agent:
                        agent_repo.update_agent_activity(db_agent.id)
                    
                except Exception as e:
                    logger.error(f"Error processing query: {e}")
                    await manager.send_message(client_id, {
                        "type": "error",
                        "content": f"Error processing query: {str(e)}",
                        "timestamp": datetime.now().isoformat()
                    })
            
            elif message_type == "ping":
                # Heartbeat response
                await manager.send_message(client_id, {
                    "type": "pong",
                    "timestamp": datetime.now().isoformat()
                })
            
            elif message_type == "clear_history":
                # Clear conversation history
                if session_id:
                    memory_manager.clear_session(session_id)
                    await manager.send_message(client_id, {
                        "type": "status",
                        "content": "Conversation history cleared",
                        "timestamp": datetime.now().isoformat()
                    })
            
            else:
                await manager.send_message(client_id, {
                    "type": "error",
                    "content": f"Unknown message type: {message_type}",
                    "timestamp": datetime.now().isoformat()
                })
    
    except WebSocketDisconnect:
        logger.info(f"Client {client_id} disconnected normally")
    except Exception as e:
        logger.error(f"WebSocket error for client {client_id}: {e}")
    finally:
        manager.disconnect(client_id)


@router.websocket("/agent/stream")
async def websocket_agent_stream(
    websocket: WebSocket,
    session_id: str = Query(..., description="Session ID"),
    agent_type: str = Query("supervisor", description="Agent type")
):
    """
    WebSocket endpoint for streaming agent responses
    Streams partial responses as they are generated
    """
    client_id = f"stream_{session_id}_{datetime.now().timestamp()}"
    
    try:
        await manager.connect(websocket, client_id)
        
        # Send connection status
        await manager.send_message(client_id, {
            "type": "connected",
            "content": "Streaming connection established",
            "timestamp": datetime.now().isoformat()
        })
        
        # Get agent
        if agent_type == "supervisor":
            agent = get_supervisor_agent()
        else:
            agent = get_agent_by_type(agent_type)
            if not agent:
                await manager.send_message(client_id, {
                    "type": "error",
                    "content": f"Invalid agent type: {agent_type}"
                })
                return
        
        # Message loop
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "query":
                query = data.get("content", "")
                
                # Stream thinking status
                await manager.send_message(client_id, {
                    "type": "stream_start",
                    "content": "",
                    "timestamp": datetime.now().isoformat()
                })
                
                # Process and stream response
                # Note: For true streaming, need LLM with streaming support
                result = await agent.process_query(query=query, session_id=session_id)
                
                # Stream response in chunks
                response = result.get("response", "")
                chunk_size = 50
                for i in range(0, len(response), chunk_size):
                    chunk = response[i:i+chunk_size]
                    await manager.send_message(client_id, {
                        "type": "stream_chunk",
                        "content": chunk,
                        "timestamp": datetime.now().isoformat()
                    })
                    await asyncio.sleep(0.05)  # Small delay for streaming effect
                
                # Stream complete
                await manager.send_message(client_id, {
                    "type": "stream_end",
                    "content": "",
                    "execution_time_ms": result.get("execution_time_ms", 0),
                    "timestamp": datetime.now().isoformat()
                })
    
    except WebSocketDisconnect:
        logger.info(f"Stream client {client_id} disconnected")
    except Exception as e:
        logger.error(f"Stream error: {e}")
    finally:
        manager.disconnect(client_id)


@router.get("/connections/count")
async def get_connection_count():
    """Get count of active WebSocket connections"""
    return {
        "active_connections": manager.get_connection_count(),
        "timestamp": datetime.now().isoformat()
    }
