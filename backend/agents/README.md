# AI Agents System - Implementation Guide

## Overview

This implementation provides a complete AI agents system powered by Google Gemini LLM and LangChain, integrated with DataHub for metadata operations.

## Architecture

### Components

1. **Base Agent System** (`base_agent.py`)
   - BaseAgent class with LLM integration
   - AgentFactory for creating and caching agents
   - Tool integration with LangChain

2. **Specialized Agents** (`specialized_agents.py`)
   - Data Discovery Agent - Find and explore datasets
   - Metadata Agent - Query metadata and lineage
   - Compliance Agent - Check PII and governance
   - Analytics Agent - Generate insights and statistics

3. **Supervisor Agent** (`supervisor_agent.py`)
   - Multi-agent coordinator using LangGraph patterns
   - Intelligent query routing
   - Response aggregation

4. **Agent Tools** (`tools.py`)
   - DataHub integration tools
   - Internal database query tools
   - Compliance checking tools

5. **Memory Management** (`memory_manager.py`)
   - Short-term (in-memory) conversation history
   - Long-term (database) persistence
   - Session management with automatic cleanup

## Agent Types

### Supervisor Agent
Routes queries to appropriate specialized agents and aggregates responses.

**Use cases:**
- General queries requiring multiple agent expertise
- Complex questions spanning different domains
- Default agent for user interactions

### Data Discovery Agent
Finds datasets, explores schemas, and discovers relationships.

**Tools:**
- search_datasets_tool
- get_dataset_metadata_tool
- search_by_domain_tool
- get_collections_tool

**Example queries:**
- "Find all sales datasets"
- "What datasets are available in the finance domain?"
- "Show me datasets from Snowflake"

### Metadata Agent
Queries metadata, tags, descriptions, and lineage information.

**Tools:**
- get_dataset_metadata_tool
- search_by_tags_tool
- get_lineage_tool
- get_enriched_records_tool

**Example queries:**
- "What's the schema of dataset X?"
- "Show me the lineage for this dataset"
- "Find all datasets tagged as PII"

### Compliance Agent
Checks PII, sensitivity levels, and compliance requirements.

**Tools:**
- search_by_tags_tool
- check_compliance_tool
- get_enriched_records_tool

**Example queries:**
- "Show me all PII datasets"
- "Check compliance status for HR data"
- "Which datasets contain sensitive information?"

### Analytics Agent
Generates insights from enriched data statistics.

**Tools:**
- get_analytics_tool
- get_enriched_records_tool
- get_collections_tool

**Example queries:**
- "How many datasets were enriched today?"
- "What's the average confidence score?"
- "Show me statistics by entity type"

## API Endpoints

### Agent Management

- `POST /api/agents` - Create new agent
- `GET /api/agents` - List all agents
- `GET /api/agents/{id}` - Get agent details
- `PUT /api/agents/{id}` - Update agent
- `DELETE /api/agents/{id}` - Delete agent
- `GET /api/agents/{id}/stats` - Get agent statistics

### Agent Interaction

- `POST /api/agents/query` - Query an agent (REST)
- `WS /api/ws/agent/chat` - Real-time chat (WebSocket)
- `WS /api/ws/agent/stream` - Streaming responses (WebSocket)

### Conversation Management

- `GET /api/agents/{id}/conversations` - Get agent conversations
- `GET /api/agents/conversations/{id}` - Get conversation details

### Tool Statistics

- `GET /api/agents/tools/stats` - Get tool execution statistics

## Usage Examples

### REST API

```python
import requests

# Query supervisor agent
response = requests.post(
    "http://localhost:8000/api/agents/query",
    params={"agent_type": "supervisor"},
    json={
        "query": "Find all datasets containing PII",
        "session_id": "user-session-123",
        "user_id": "john@example.com"
    }
)

result = response.json()
print(result["response"])
```

### WebSocket

```javascript
const ws = new WebSocket(
  "ws://localhost:8000/api/ws/agent/chat?session_id=user-123&agent_type=supervisor"
);

ws.onopen = () => {
  // Send query
  ws.send(JSON.stringify({
    type: "query",
    content: "Show me sales datasets"
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.type, data.content);
};
```

## Configuration

### Environment Variables

```bash
# Gemini API
GEMINI_API_KEY=your_key_here

# DataHub (optional)
DATAHUB_SERVER_URL=http://localhost:8080
DATAHUB_TOKEN=your_token_here
DATAHUB_ENABLED=true

# Redis (optional, for distributed memory)
REDIS_URL=redis://localhost:6379/0
REDIS_ENABLED=false
```

### Agent Configuration

Agents can be configured with custom LLM settings:

```python
llm_config = {
    "model": "gemini-2.0-flash-exp",
    "temperature": 0.3,
    "max_tokens": 4096
}

agent = AgentFactory.create_agent(
    agent_type="data_discovery",
    llm_config=llm_config
)
```

## Database Schema

The system uses the following tables:

- `agents` - Agent registration and configuration
- `agent_conversations` - Conversation sessions
- `agent_messages` - Conversation messages
- `agent_tool_executions` - Tool execution tracking

All tables are automatically created on application startup.

## Memory Management

### Short-term Memory
- Stored in-memory for active sessions
- Configurable size (default: 50 messages)
- Automatic cleanup of inactive sessions

### Long-term Memory
- Persisted to database
- Enables context retrieval across sessions
- Supports conversation history queries

## Tool Development

Create custom tools using the `@tool` decorator:

```python
from langchain_core.tools import tool

@tool
async def my_custom_tool(param: str) -> str:
    """Tool description for the LLM"""
    # Implementation
    return result
```

Add to tool groups in `tools.py`:

```python
TOOL_GROUPS = {
    "my_agent": [my_custom_tool, ...],
}
```

## Performance Considerations

1. **Caching**: DataHub responses are cached (30 min TTL)
2. **Connection Pooling**: Database sessions use pooling
3. **Memory Cleanup**: Inactive sessions auto-cleanup after 60 min
4. **Tool Timeouts**: Tools have configurable timeouts

## Monitoring

Track agent performance through:

- Agent statistics endpoint
- Tool execution tracking
- Conversation metrics
- WebSocket connection counts

## Security

- API endpoints support authentication (integrate with Keycloak)
- User IDs tracked in conversations
- Agent access can be restricted by owner/team
- Tool execution is logged for audit

## Future Enhancements

- LangGraph state machines for complex workflows
- Custom agent specializations
- Multi-turn conversation strategies
- Advanced memory retrieval (semantic search)
- Agent-to-agent communication
- Human-in-the-loop workflows
