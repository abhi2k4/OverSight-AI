---
sidebar_position: 2
title: Langfuse - LLM Observability
---

# Langfuse - LLM Observability Platform

## What is Langfuse?

Langfuse is an open-source LLM engineering platform designed to help teams debug, analyze, and iterate on their LLM applications. It provides comprehensive observability, analytics, and prompt management capabilities for large language model applications.

## Key Features

### 🔍 Tracing & Observability
Complete visibility into LLM application behavior:
- **Detailed traces** of all LLM calls
- **Nested spans** for complex workflows
- **Request/response logging**
- **Latency tracking**
- **Error monitoring**

### 📝 Prompt Management
Centralized prompt engineering:
- **Version control** for prompts
- **A/B testing** capabilities
- **Template management**
- **Collaboration tools**
- **Production deployment**

### 📊 Analytics & Metrics
Comprehensive performance insights:
- **Cost tracking** per model and user
- **Latency analysis** with percentiles
- **Usage statistics** and trends
- **Model comparison**
- **Custom dashboards**

### ✅ Evaluation & Testing
Quality assurance for LLM outputs:
- **Manual scoring** interface
- **Automated evaluations**
- **Test dataset management**
- **Regression testing**
- **Quality metrics**

### 🎯 User Segmentation
Understand user behavior:
- **User-level analytics**
- **Session tracking**
- **Cohort analysis**
- **Feedback collection**

## Architecture

Langfuse consists of several integrated services:

- **Web Application**: User interface for visualization
- **Worker Service**: Background processing
- **PostgreSQL**: Primary data store
- **ClickHouse**: Analytics database
- **Redis**: Caching and queuing
- **MinIO**: Object storage

## Quick Start

```bash
# Clone repository
git clone https://github.com/langfuse/langfuse
cd langfuse

# Start all services
docker compose up -d

# Access at http://localhost:3000
```

## Integration Options

### Python

```bash
pip install langfuse
```

```python
from langfuse import Langfuse

langfuse = Langfuse()
trace = langfuse.trace(name="llm-query")
```

### JavaScript/TypeScript

```bash
npm install langfuse
```

```typescript
import { Langfuse } from "langfuse";

const langfuse = new Langfuse();
const trace = langfuse.trace({ name: "llm-query" });
```

### OpenAI

```python
from langfuse.openai import openai

# Automatic tracking
response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

### LangChain

```python
from langfuse.callback import CallbackHandler

handler = CallbackHandler()

# Use with LangChain
chain.run(input="Hello", callbacks=[handler])
```

## Use Cases

### Production Monitoring
Monitor LLM applications in production with real-time alerts and dashboards.

### Cost Optimization
Track and optimize LLM costs across models, users, and use cases.

### Quality Assurance
Evaluate output quality and catch regressions before they reach users.

### Prompt Engineering
Iterate on prompts with version control and A/B testing.

### Debugging
Quickly identify and fix issues in complex LLM workflows.

### Compliance
Maintain audit logs of all LLM interactions for regulatory compliance.

## Key Concepts

### Traces
Top-level container for a complete LLM interaction or workflow.

### Spans
Nested steps within a trace (e.g., retrieval, processing, generation).

### Generations
LLM API calls with input, output, and metadata.

### Scores
Quality ratings (manual or automated) for evaluating outputs.

### Datasets
Collections of test cases for evaluation and regression testing.

## Integration with Oversight

Langfuse seamlessly integrates with other Oversight components:

- **Keycloak**: SSO and user authentication
- **MinIO**: Object storage for events and media
- **DataHub**: Cross-reference with data lineage

## Supported Models

Langfuse works with all major LLM providers:
- OpenAI (GPT-3.5, GPT-4, GPT-4-turbo)
- Anthropic (Claude)
- Google (PaLM, Gemini)
- Cohere
- Hugging Face
- Azure OpenAI
- Custom models

## Supported Frameworks

- **LangChain**: Native callback integration
- **LlamaIndex**: Built-in observability
- **Haystack**: Custom integration
- **AutoGPT**: Agent monitoring
- **Raw API calls**: Direct SDK integration

## Dashboard Features

### Overview
- Request volume over time
- Cost trends
- Latency percentiles
- Error rates

### Traces
- Searchable trace list
- Detailed trace viewer
- Span visualization
- Timeline view

### Generations
- Model usage statistics
- Token consumption
- Cost per generation
- Performance metrics

### Prompts
- Prompt library
- Version history
- Usage statistics
- Performance comparison

### Users
- User-level analytics
- Session tracking
- Feedback scores
- Usage patterns

## Security & Privacy

- **Self-hosted**: Full data control
- **Encryption**: At-rest and in-transit
- **Access control**: Role-based permissions
- **Audit logs**: Complete activity tracking
- **Data retention**: Configurable policies

## Pricing

Langfuse is **100% open-source** and free to self-host. For managed cloud hosting, see [Langfuse Cloud](https://langfuse.com).

## Resources

- [Official Documentation](https://langfuse.com/docs)
- [GitHub Repository](https://github.com/langfuse/langfuse)
- [Discord Community](https://langfuse.com/discord)
- [Example Cookbook](https://langfuse.com/docs/cookbook)
- [API Reference](https://api.reference.langfuse.com)

## Next Steps

- [Install Langfuse](/getting-started)
- [Langfuse Integration Guide](/guides/langfuse)
- [Instrument your application](https://langfuse.com/docs/get-started)
- [Set up evaluations](https://langfuse.com/docs/scores/overview)
