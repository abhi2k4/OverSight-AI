import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const app = express();
const PORT = process.env.API_PORT || 3003;

// Initialize Groq and Langfuse dynamically
let groq = null;
let langfuse = null;

async function initializeClients() {
  try {
    const { Groq } = await import('groq-sdk');
    const { Langfuse } = await import('langfuse');

    if (process.env.GROQ_API_KEY) {
      groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      });
      console.log('✅ Groq client initialized');
    }

    if (process.env.LANGFUSE_SECRET_KEY && process.env.LANGFUSE_PUBLIC_KEY) {
      langfuse = new Langfuse({
        secretKey: process.env.LANGFUSE_SECRET_KEY,
        publicKey: process.env.LANGFUSE_PUBLIC_KEY,
        baseUrl: process.env.LANGFUSE_BASE_URL || 'http://localhost:3000',
      });
      console.log('✅ Langfuse client initialized');
    }
  } catch (error) {
    console.warn('⚠️ Failed to initialize clients:', error.message);
  }
}

// Initialize on startup
initializeClients();

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage
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
- AI governance policies and best practices
- Regulatory compliance (GDPR, CCPA, HIPAA, SOX, AI Act)
- Data privacy, security, and lineage risks
- AI model monitoring, accountability, and evaluation
- Audit trails, logging, and regulatory evidence

Be concise, professional, and actionable.
Explain what happened, why it matters, and what to do next.
Do not speculate or invent information.
If something is unknown, say so clearly.
No emojis.`;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'oversight-api',
    timestamp: new Date().toISOString(),
    langfuse: {
      connected: !!langfuse,
      configured: !!(process.env.LANGFUSE_SECRET_KEY && process.env.LANGFUSE_PUBLIC_KEY),
    },
    groq: {
      connected: !!groq,
      configured: !!process.env.GROQ_API_KEY,
      model: 'llama-3.3-70b-versatile',
    },
  });
});

// Chat endpoint with LangFuse tracing
app.post('/chat', async (req, res) => {
  const startTime = Date.now();
  const { message, conversationId = uuidv4(), userId = 'anonymous' } = req.body;

  if (!message) {
    return res.status(400).json({ 
      error: 'Message is required',
      code: 'MISSING_MESSAGE'
    });
  }

  if (!groq) {
    return res.status(503).json({ 
      error: 'Chat service unavailable. Please check GROQ_API_KEY configuration.',
      code: 'SERVICE_UNAVAILABLE'
    });
  }

  let trace = null;

  try {
    // Create LangFuse trace if available
    if (langfuse) {
      trace = langfuse.trace({
        id: uuidv4(),
        name: 'chat-completion',
        userId: userId,
        sessionId: conversationId,
        metadata: {
          endpoint: '/api/chat',
          model: 'llama-3.3-70b-versatile',
        },
      });
    }

    // Get or create conversation history
    let history = conversations.get(conversationId) || [];
    
    // Add user message to history
    history.push({ role: 'user', content: message });

    // Create generation span in LangFuse
    let generation = null;
    if (trace) {
      generation = trace.generation({
        name: 'groq-completion',
        model: 'llama-3.3-70b-versatile',
        modelParameters: {
          temperature: 0.7,
          maxTokens: 800,
        },
        input: history,
      });
    }

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

    // Calculate costs (Groq pricing)
    const promptCost = (usage.prompt_tokens / 1000000) * 0.0001;
    const completionCost = (usage.completion_tokens / 1000000) * 0.0002;
    const totalCost = promptCost + completionCost;

    const latency = Date.now() - startTime;

    // Update generation with output and metrics
    if (generation) {
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
    }

    // Update metrics
    metrics.totalRequests++;
    metrics.totalTokens += usage.total_tokens;
    metrics.totalCost += totalCost;
    metrics.averageLatency = 
      (metrics.averageLatency * (metrics.totalRequests - 1) + latency) / metrics.totalRequests;

    const hour = new Date().getHours();
    metrics.requestsByHour[hour] = (metrics.requestsByHour[hour] || 0) + 1;

    // Score the interaction
    if (trace) {
      trace.score({
        name: 'user-satisfaction',
        value: 1,
        comment: 'Auto-scored successful completion',
      });

      trace.update({
        output: assistantMessage,
        metadata: {
          latency,
          tokensUsed: usage.total_tokens,
          cost: totalCost,
        },
      });

      await langfuse.flushAsync();
    }

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

    if (trace && langfuse) {
      trace.update({
        level: 'ERROR',
        statusMessage: error.message,
      });
      await langfuse.flushAsync();
    }

    // Return specific error messages
    let errorMessage = 'Failed to process chat request';
    let errorCode = 'CHAT_ERROR';

    if (error.message?.includes('rate limit')) {
      errorMessage = 'Rate limit exceeded. Please try again in a moment.';
      errorCode = 'RATE_LIMIT';
    } else if (error.message?.includes('invalid_api_key')) {
      errorMessage = 'Invalid API key configuration.';
      errorCode = 'INVALID_API_KEY';
    } else if (error.message?.includes('model')) {
      errorMessage = 'Model unavailable. Please try again later.';
      errorCode = 'MODEL_ERROR';
    }

    res.status(500).json({
      error: errorMessage,
      code: errorCode,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    // Local metrics
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

    // Fetch LangFuse data if available
    let langfuseData = null;
    if (langfuse) {
      try {
        const tracesResponse = await langfuse.fetchTraces({
          limit: 100,
        });

        if (tracesResponse && tracesResponse.data) {
          const traceData = tracesResponse.data;
          const totalTraces = traceData.length;
          
          const latencies = traceData
            .map(t => t.latency || 0)
            .filter(l => l > 0);
          const avgLatency = latencies.length > 0
            ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
            : 0;

          const totalCostFromTraces = traceData.reduce((sum, t) => {
            return sum + (t.calculatedTotalCost || 0);
          }, 0);

          const modelUsage = {};
          traceData.forEach(trace => {
            if (trace.observations) {
              trace.observations.forEach(obs => {
                const model = obs.model || 'unknown';
                modelUsage[model] = (modelUsage[model] || 0) + 1;
              });
            }
          });

          const userActivity = {};
          traceData.forEach(trace => {
            const userId = trace.userId || 'anonymous';
            userActivity[userId] = (userActivity[userId] || 0) + 1;
          });

          const sessionActivity = {};
          traceData.forEach(trace => {
            if (trace.sessionId) {
              sessionActivity[trace.sessionId] = (sessionActivity[trace.sessionId] || 0) + 1;
            }
          });

          const errorTraces = traceData.filter(t => t.level === 'ERROR').length;
          const successRate = totalTraces > 0
            ? (((totalTraces - errorTraces) / totalTraces) * 100)
            : 100;

          const tracesByHour = {};
          traceData.forEach(trace => {
            const hour = new Date(trace.timestamp).getHours();
            tracesByHour[hour] = (tracesByHour[hour] || 0) + 1;
          });

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
        console.warn('LangFuse fetch error:', langfuseError.message);
      }
    }

    res.json({
      source: langfuse ? 'hybrid' : 'local',
      overview: localMetrics,
      hourlyActivity,
      activeConversations: conversations.size,
      timestamp: new Date().toISOString(),
      langfuse: langfuseData,
    });
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch metrics',
      code: 'METRICS_ERROR'
    });
  }
});

// V2 Metrics endpoint using LangFuse Metrics API
app.get('/metrics/v2', async (req, res) => {
  if (!langfuse) {
    return res.status(503).json({
      error: 'LangFuse not configured',
      code: 'LANGFUSE_NOT_CONFIGURED'
    });
  }

  try {
    const { view = 'observations', days = 7 } = req.query;
    
    const toTimestamp = new Date().toISOString();
    const fromTimestamp = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Build query based on view
    let query;
    if (view === 'observations') {
      query = {
        view: 'observations',
        dimensions: [{ field: 'name' }],
        metrics: [
          { measure: 'count', aggregation: 'sum' },
          { measure: 'latency', aggregation: 'avg' },
          { measure: 'totalTokens', aggregation: 'sum' },
          { measure: 'totalCost', aggregation: 'sum' },
        ],
        timeDimension: { granularity: 'day' },
        fromTimestamp,
        toTimestamp,
        config: { row_limit: 100 },
      };
    } else if (view === 'scores-numeric') {
      query = {
        view: 'scores-numeric',
        dimensions: [{ field: 'name' }],
        metrics: [
          { measure: 'count', aggregation: 'sum' },
          { measure: 'value', aggregation: 'avg' },
        ],
        fromTimestamp,
        toTimestamp,
        config: { row_limit: 100 },
      };
    }

    // Use the metrics API v2
    const baseUrl = process.env.LANGFUSE_BASE_URL || 'http://localhost:3000';
    const response = await fetch(
      `${baseUrl}/api/public/v2/metrics?query=${encodeURIComponent(JSON.stringify(query))}`,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.LANGFUSE_PUBLIC_KEY}:${process.env.LANGFUSE_SECRET_KEY}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LangFuse API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Metrics V2 error:', error);
    res.status(500).json({
      error: 'Failed to fetch metrics from LangFuse',
      code: 'LANGFUSE_API_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Clear conversation history
app.delete('/conversations/:id', (req, res) => {
  const { id } = req.params;
  conversations.delete(id);
  res.json({ message: 'Conversation cleared', conversationId: id });
});

// Get LangFuse sessions
app.get('/langfuse/sessions', async (req, res) => {
  if (!langfuse) {
    return res.status(503).json({
      error: 'LangFuse not configured',
      code: 'LANGFUSE_NOT_CONFIGURED'
    });
  }

  try {
    const sessions = await langfuse.fetchSessions({ limit: 20 });

    if (!sessions || !sessions.data) {
      return res.json({ sessions: [], total: 0 });
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
    res.status(500).json({ 
      error: 'Failed to fetch sessions',
      code: 'LANGFUSE_SESSIONS_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Get trace details
app.get('/langfuse/traces/:traceId', async (req, res) => {
  if (!langfuse) {
    return res.status(503).json({
      error: 'LangFuse not configured',
      code: 'LANGFUSE_NOT_CONFIGURED'
    });
  }

  try {
    const { traceId } = req.params;
    const trace = await langfuse.fetchTrace(traceId);
    
    if (!trace) {
      return res.status(404).json({ 
        error: 'Trace not found',
        code: 'TRACE_NOT_FOUND'
      });
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
    res.status(500).json({ 
      error: 'Failed to fetch trace',
      code: 'LANGFUSE_TRACE_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Get LangFuse scores
app.get('/langfuse/scores', async (req, res) => {
  if (!langfuse) {
    return res.status(503).json({
      error: 'LangFuse not configured',
      code: 'LANGFUSE_NOT_CONFIGURED'
    });
  }

  try {
    const scores = await langfuse.fetchScores({ limit: 50 });

    if (!scores || !scores.data) {
      return res.json({ scores: [], total: 0 });
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
    res.status(500).json({ 
      error: 'Failed to fetch scores',
      code: 'LANGFUSE_SCORES_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Only start standalone server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Start server
  app.listen(PORT, () => {
    console.log(`\n🚀 OverSight API Server running on port ${PORT}`);
    console.log(`📊 LangFuse: ${langfuse ? '✅ Connected' : '❌ Not configured'}`);
    console.log(`🧠 Groq: ${groq ? '✅ Connected' : '❌ Not configured'}`);
    console.log(`\nEndpoints:`);
    console.log(`  GET    http://localhost:${PORT}/api/health`);
    console.log(`  POST   http://localhost:${PORT}/api/chat`);
    console.log(`  GET    http://localhost:${PORT}/api/metrics`);
    console.log(`  GET    http://localhost:${PORT}/api/metrics/v2`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    if (langfuse) {
      await langfuse.shutdownAsync();
    }
    process.exit(0);
  });
}

export default app;
