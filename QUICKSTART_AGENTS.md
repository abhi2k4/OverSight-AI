# AI Agents Quick Start Guide

Get started with the OverSightAI Agents system in 5 minutes!

## Prerequisites

- Python 3.8+
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))
- (Optional) DataHub instance running

## Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

## Step 2: Configure Environment

Create a `.env` file:

```bash
# Required
GEMINI_API_KEY=your_gemini_key_here

# Optional - Enable DataHub
DATAHUB_SERVER_URL=http://localhost:8080
DATAHUB_ENABLED=false
```

## Step 3: Initialize Database & Agents

```bash
# Initialize database tables
python -c "from backend.database import init_db; init_db()"

# Create default agents
python scripts/init_agents.py
```

This creates 5 default agents:
- Supervisor Agent (coordinator)
- Data Discovery Agent
- Metadata Agent  
- Compliance Agent
- Analytics Agent

## Step 4: Start the Server

```bash
python backend/api/main.py
```

Server starts at: http://localhost:8000

API Docs: http://localhost:8000/docs

## Step 5: Test the Agents!

### Option A: Using REST API

```bash
# Query the supervisor agent
curl -X POST "http://localhost:8000/api/agents/query?agent_type=supervisor" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What datasets are available?",
    "session_id": "test-session-123"
  }'
```

### Option B: Using Python

```python
import requests

response = requests.post(
    "http://localhost:8000/api/agents/query",
    params={"agent_type": "supervisor"},
    json={
        "query": "Show me all collections",
        "session_id": "my-session"
    }
)

result = response.json()
print(result["response"])
```

### Option C: Using WebSocket (JavaScript)

```javascript
const ws = new WebSocket(
  "ws://localhost:8000/api/ws/agent/chat?session_id=test&agent_type=supervisor"
);

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: "query",
    content: "What analytics can you show me?"
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.content);
};
```

## Example Queries

### Data Discovery Agent
```
"Find all sales datasets"
"What datasets are from Snowflake?"
"Show me datasets in the finance domain"
```

### Metadata Agent
```
"What's the schema of dataset X?"
"Show me the lineage for this dataset"
"Find datasets tagged as PII"
```

### Compliance Agent
```
"Check compliance status for HR data"
"Show me all sensitive datasets"
"Are there any PII violations?"
```

### Analytics Agent
```
"How many datasets were enriched today?"
"What's the average confidence score?"
"Show me statistics by entity type"
```

### Supervisor Agent (Routes to appropriate agent)
```
"Find all PII datasets and check their compliance status"
"What sales data is available and show me its metadata"
"Give me analytics on our enriched records"
```

## View Agents

```bash
# List all agents
curl http://localhost:8000/api/agents

# Get agent details
curl http://localhost:8000/api/agents/{agent_id}

# Get agent statistics
curl http://localhost:8000/api/agents/{agent_id}/stats
```

## View Conversations

```bash
# Get conversation history for an agent
curl http://localhost:8000/api/agents/{agent_id}/conversations

# Get specific conversation details
curl http://localhost:8000/api/agents/conversations/{conversation_id}
```

## WebSocket Connection

### Connect to Real-time Chat

```javascript
// Connect
const ws = new WebSocket(
  "ws://localhost:8000/api/ws/agent/chat?session_id=user-123&agent_type=supervisor&user_id=john@example.com"
);

// Send query
ws.send(JSON.stringify({
  type: "query",
  content: "Your question here"
}));

// Receive response
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case "status":
      console.log("Status:", data.content);
      break;
    case "thinking":
      console.log("Agent is thinking...");
      break;
    case "response":
      console.log("Agent:", data.content);
      console.log("Execution time:", data.execution_time_ms, "ms");
      break;
    case "error":
      console.error("Error:", data.content);
      break;
  }
};

// Heartbeat
setInterval(() => {
  ws.send(JSON.stringify({ type: "ping" }));
}, 30000);
```

## Create Custom Agent

```bash
curl -X POST "http://localhost:8000/api/agents" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Custom Agent",
    "agent_type": "data_discovery",
    "description": "Specialized agent for my use case",
    "owner": "My Team",
    "risk_level": "low"
  }'
```

## Troubleshooting

### "GEMINI_API_KEY not set"
- Make sure you created `.env` file with valid API key
- Restart the server after adding the key

### "DataHub connection failed"
- Set `DATAHUB_ENABLED=false` in `.env` if not using DataHub
- DataHub integration is optional

### "No agents found"
- Run `python scripts/init_agents.py` to create default agents

### WebSocket connection fails
- Check if server is running on correct port
- Ensure firewall allows WebSocket connections
- Verify session_id is provided as query parameter

## Next Steps

1. **Read Full Documentation**: See `backend/agents/README.md`
2. **View Implementation Details**: See `AGENTS_IMPLEMENTATION.md`
3. **Integrate with Frontend**: Update frontend to use agent APIs
4. **Add Custom Tools**: Extend agents with custom functionality
5. **Configure DataHub**: Connect to your DataHub instance

## API Documentation

Interactive API documentation available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Need Help?

Check out:
- `backend/agents/README.md` - Complete agent documentation
- `AGENTS_IMPLEMENTATION.md` - Technical implementation details
- API docs at `/docs` - Interactive API explorer
