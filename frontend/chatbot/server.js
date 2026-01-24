import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Groq } from 'groq-sdk';
import { Langfuse } from 'langfuse';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Initialize Langfuse
const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  baseUrl: process.env.LANGFUSE_HOST || 'http://localhost:3000',
});

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for demo purposes
const conversations = new Map();
const metrics = {
  totalRequests: 0,
  totalTokens: 0,
  totalCost: 0,
  averageLatency: 0,
  errorCount: 0,
  requestsByHour: {},
};

// System prompt for the AI Governance Assistant
const SYSTEM_PROMPT = `You are OverSight AI Assistant, an AI governance and compliance expert.
Your role is to help users understand and manage AI governance, data privacy, compliance, and auditability.

You provide clear guidance on:

AI governance policies and best practices

Regulatory compliance (GDPR, CCPA, HIPAA, SOX, AI Act)

Data privacy, security, and lineage risks

AI model monitoring, accountability, and evaluation

Audit trails, logging, and regulatory evidence

Be concise, professional, and actionable.
Explain what happened, why it matters, and what to do next.
Do not speculate or invent information.
If something is unknown, say so clearly.
No emojis.`;

// Chat endpoint with LangFuse tracing
app.post('/api/chat', async (req, res) => {
  const startTime = Date.now();
  const { message, conversationId = uuidv4(), userId = 'anonymous' } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

    // Create LangFuse trace
    const trace = langfuse.trace({
      id: uuidv4(),
      name: 'chat-completion',
      userId: userId,
      sessionId: conversationId,
      metadata: {
        endpoint: '/api/chat',
        model: 'llama-3.3-70b-versatile',
      },
    });  try {
    // Get or create conversation history
    let history = conversations.get(conversationId) || [];
    
    // Add user message to history
    history.push({ role: 'user', content: message });

    // Create generation span in LangFuse
    const generation = trace.generation({
      name: 'groq-completion',
      model: 'llama-3.3-70b-versatile',
      modelParameters: {
        temperature: 0.7,
        maxTokens: 800,
      },
      input: history,
    });

    // Call Groq API with Llama model
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history,
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const assistantMessage = completion.choices[0].message.content;
    const usage = completion.usage;

    // Add assistant response to history
    history.push({ role: 'assistant', content: assistantMessage });
    conversations.set(conversationId, history.slice(-10)); // Keep last 10 messages

    // Calculate costs (Groq is free/very cheap - $0.0001 per 1M tokens for reference)
    const promptCost = (usage.prompt_tokens / 1000000) * 0.0001; // Approximate
    const completionCost = (usage.completion_tokens / 1000000) * 0.0002; // Approximate
    const totalCost = promptCost + completionCost;

    const latency = Date.now() - startTime;

    // Update generation with output and metrics
    generation.end({
      output: assistantMessage,
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      },
      metadata: {
        latency,
        cost: totalCost,
        finishReason: completion.choices[0].finish_reason,
      },
    });

    // Update metrics
    metrics.totalRequests++;
    metrics.totalTokens += usage.total_tokens;
    metrics.totalCost += totalCost;
    metrics.averageLatency = 
      (metrics.averageLatency * (metrics.totalRequests - 1) + latency) / metrics.totalRequests;

    const hour = new Date().getHours();
    metrics.requestsByHour[hour] = (metrics.requestsByHour[hour] || 0) + 1;

    // Score the interaction
    trace.score({
      name: 'user-satisfaction',
      value: 1, // Default positive score
      comment: 'Auto-scored successful completion',
    });

    // End trace
    trace.update({
      output: assistantMessage,
      metadata: {
        latency,
        tokensUsed: usage.total_tokens,
        cost: totalCost,
      },
    });

    // Flush LangFuse events
    await langfuse.flushAsync();

    res.json({
      response: assistantMessage,
      conversationId,
      metadata: {
        tokens: usage.total_tokens,
        latency,
        cost: totalCost.toFixed(6),
      },
    });

  } catch (error) {
    console.error('Chat error:', error);
    metrics.errorCount++;

    // Log error to LangFuse
    trace.update({
      level: 'ERROR',
      statusMessage: error.message,
    });

    await langfuse.flushAsync();

    res.status(500).json({
      error: 'Failed to process chat request',
      details: error.message,
    });
  }
});

// Metrics endpoint with LangFuse data
app.get('/api/metrics', async (req, res) => {
  try {
    // Local metrics (fast)
    const localMetrics = {
      totalRequests: metrics.totalRequests,
      totalTokens: metrics.totalTokens,
      totalCost: parseFloat(metrics.totalCost.toFixed(6)),
      averageLatency: Math.round(metrics.averageLatency),
      errorCount: metrics.errorCount,
      successRate: metrics.totalRequests > 0 
        ? ((metrics.totalRequests - metrics.errorCount) / metrics.totalRequests * 100).toFixed(2)
        : 100,
    };

    const hourlyActivity = Object.entries(metrics.requestsByHour).map(([hour, count]) => ({
      hour: parseInt(hour),
      requests: count,
    }));

    // Fetch LangFuse data using proper API client methods
    let langfuseData = null;
    try {
      // Fetch traces for detailed metrics
      const tracesResponse = await langfuse.fetchTraces({
        limit: 100,
      });

      if (tracesResponse && tracesResponse.data) {
        const traceData = tracesResponse.data;
        const totalTraces = traceData.length;
        
        // Calculate average latency from traces
        const latencies = traceData
          .map(t => t.latency || 0)
          .filter(l => l > 0);
        const avgLatency = latencies.length > 0
          ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
          : 0;

        // Calculate total cost from traces
        const totalCostFromTraces = traceData.reduce((sum, t) => {
          const cost = t.calculatedTotalCost || 0;
          return sum + cost;
        }, 0);

        // Get model distribution from observations
        const modelUsage = {};
        traceData.forEach(trace => {
          if (trace.observations) {
            trace.observations.forEach(obs => {
              const model = obs.model || 'unknown';
              modelUsage[model] = (modelUsage[model] || 0) + 1;
            });
          }
        });

        // Get user activity
        const userActivity = {};
        traceData.forEach(trace => {
          const userId = trace.userId || 'anonymous';
          userActivity[userId] = (userActivity[userId] || 0) + 1;
        });

        // Get session distribution
        const sessionActivity = {};
        traceData.forEach(trace => {
          if (trace.sessionId) {
            sessionActivity[trace.sessionId] = (sessionActivity[trace.sessionId] || 0) + 1;
          }
        });

        // Calculate success rate
        const errorTraces = traceData.filter(t => t.level === 'ERROR').length;
        const successRate = totalTraces > 0
          ? (((totalTraces - errorTraces) / totalTraces) * 100)
          : 100;

        // Get traces by timestamp for time series
        const tracesByHour = {};
        traceData.forEach(trace => {
          const hour = new Date(trace.timestamp).getHours();
          tracesByHour[hour] = (tracesByHour[hour] || 0) + 1;
        });

        // Recent traces with details
        const recentTraces = traceData.slice(0, 10).map(trace => ({
          id: trace.id,
          name: trace.name,
          userId: trace.userId,
          timestamp: trace.timestamp,
          latency: trace.latency || 0,
          level: trace.level || 'DEFAULT',
          statusMessage: trace.statusMessage || 'Success',
          tokensUsed: (trace.inputUsage || 0) + (trace.outputUsage || 0),
          cost: trace.calculatedTotalCost || 0,
        }));

        langfuseData = {
          totalTraces,
          avgLatency,
          totalCost: parseFloat(totalCostFromTraces.toFixed(6)),
          successRate: parseFloat(successRate.toFixed(2)),
          modelUsage,
          userActivity,
          sessionActivity,
          tracesByHour: Object.entries(tracesByHour).map(([hour, traces]) => ({
            hour: parseInt(hour),
            traces: traces,
          })),
          recentTraces,
        };
      }
    } catch (langfuseError) {
      console.warn('LangFuse fetch error (continuing with local metrics):', langfuseError.message);
      // Continue with local metrics only
    }

    res.json({
      source: 'hybrid', // local + langfuse
      overview: localMetrics,
      hourlyActivity,
      activeConversations: conversations.size,
      timestamp: new Date().toISOString(),
      langfuse: langfuseData, // Full LangFuse data
    });
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'oversight-chatbot',
    timestamp: new Date().toISOString(),
    langfuse: {
      connected: !!process.env.LANGFUSE_SECRET_KEY,
    },
    groq: {
      connected: !!process.env.GROQ_API_KEY,
      model: 'llama-3.3-70b-versatile',
    },
  });
});

// Clear conversation history
app.delete('/api/conversations/:id', (req, res) => {
  const { id } = req.params;
  conversations.delete(id);
  res.json({ message: 'Conversation cleared', conversationId: id });
});

// Get detailed LangFuse sessions
app.get('/api/langfuse/sessions', async (req, res) => {
  try {
    const sessions = await langfuse.fetchSessions({
      limit: 20,
    });

    if (!sessions || !sessions.data) {
      return res.json({ sessions: [] });
    }

    const sessionDetails = sessions.data.map(session => ({
      id: session.id,
      createdAt: session.createdAt,
      traces: session.countTraces || 0,
      observations: session.countObservations || 0,
      totalCost: session.totalCost || 0,
      inputTokens: session.inputTokens || 0,
      outputTokens: session.outputTokens || 0,
      totalTokens: session.totalTokens || 0,
    }));

    res.json({
      sessions: sessionDetails,
      total: sessions.totalItems || sessionDetails.length,
    });
  } catch (error) {
    console.error('LangFuse sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions', details: error.message });
  }
});

// Get detailed trace information
app.get('/api/langfuse/traces/:traceId', async (req, res) => {
  try {
    const { traceId } = req.params;
    
    const trace = await langfuse.fetchTrace(traceId);
    
    if (!trace) {
      return res.status(404).json({ error: 'Trace not found' });
    }

    res.json({
      trace: {
        id: trace.id,
        name: trace.name,
        userId: trace.userId,
        sessionId: trace.sessionId,
        timestamp: trace.timestamp,
        latency: trace.latency,
        level: trace.level,
        statusMessage: trace.statusMessage,
        input: trace.input,
        output: trace.output,
        metadata: trace.metadata,
        scores: trace.scores || [],
        observations: trace.observations || [],
      }
    });
  } catch (error) {
    console.error('LangFuse trace error:', error);
    res.status(500).json({ error: 'Failed to fetch trace', details: error.message });
  }
});

// Get LangFuse scores
app.get('/api/langfuse/scores', async (req, res) => {
  try {
    const scores = await langfuse.fetchScores({
      limit: 50,
    });

    if (!scores || !scores.data) {
      return res.json({ scores: [] });
    }

    const scoreDetails = scores.data.map(score => ({
      id: score.id,
      name: score.name,
      value: score.value,
      comment: score.comment,
      traceId: score.traceId,
      observationId: score.observationId,
      timestamp: score.timestamp,
    }));

    res.json({
      scores: scoreDetails,
      total: scores.totalItems || scoreDetails.length,
    });
  } catch (error) {
    console.error('LangFuse scores error:', error);
    res.status(500).json({ error: 'Failed to fetch scores', details: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🤖 OverSight Chatbot Server running on port ${PORT}`);
  console.log(`📊 LangFuse integration: ${process.env.LANGFUSE_SECRET_KEY ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`🧠 Groq Llama API: ${process.env.GROQ_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`\nEndpoints:`);
  console.log(`  POST   http://localhost:${PORT}/api/chat`);
  console.log(`  GET    http://localhost:${PORT}/api/metrics`);
  console.log(`  GET    http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await langfuse.shutdownAsync();
  process.exit(0);
});
