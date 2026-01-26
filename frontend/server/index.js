import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import multer from 'multer';
import fs from 'fs';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createAgent, queryAgent, getAgent, listAgents, deleteAgent, getConversationHistory, storeAgentMetadata, getAgentMetadata, recreateAgentFromMetadata } from './agentManager.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const app = express();
const PORT = process.env.API_PORT || 3003;

// Initialize Groq, Langfuse, and Gemini dynamically
let groq = null;
let langfuse = null;
let gemini = null;

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

    // Hardcoded Gemini API key
    const GEMINI_API_KEY = 'AIzaSyBag-dj15WK8BYPJP0W_hfZ5mwPkRRB8BY';
    
    if (GEMINI_API_KEY) {
      const { GoogleGenAI } = await import('@google/genai');
      gemini = new GoogleGenAI({
        apiKey: GEMINI_API_KEY,
      });
      console.log('✅ Gemini client initialized');
    }
  } catch (error) {
    console.warn('⚠️ Failed to initialize clients:', error.message);
  }
}

// Initialize on startup
initializeClients();

// Middleware
app.use(cors());

// Python Backend Proxy Configuration
// Use 127.0.0.1 instead of localhost to avoid IPv6 issues
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000';

// List of routes handled by Express (don't proxy these)
const expressRoutes = [
  '/health',
  '/chat',
  '/agents',
  '/metrics',
  '/datasets/register', // Express version
  '/policies',
];

// Create proxy middleware for Python backend
// Note: Express receives paths WITHOUT /api prefix (Vite strips it)
// So /api/ingest/upload becomes /ingest/upload in Express
// We need to add /api back when proxying to Python backend
const pythonBackendProxy = createProxyMiddleware({
  target: PYTHON_API_URL,
  changeOrigin: true,
  // Add /api prefix back when proxying (Express path is /ingest/upload, Python needs /api/ingest/upload)
  pathRewrite: (path) => {
    // Express receives /ingest/upload, we need /api/ingest/upload for Python backend
    // Simple: prepend /api if path doesn't already start with it
    if (path.startsWith('/api')) {
      return path; // Already has /api
    }
    return `/api${path}`; // Add /api prefix
  },
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
  // Handle file uploads - http-proxy-middleware handles multipart/form-data automatically
  onProxyReq: (proxyReq, req, res) => {
    // Log proxied requests in development (path is already rewritten by pathRewrite)
    if (process.env.NODE_ENV === 'development') {
      const rewrittenPath = req.path.startsWith('/api') ? req.path : `/api${req.path}`;
      console.log(`[Proxy] ${req.method} ${req.path} -> ${PYTHON_API_URL}${rewrittenPath}`);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // Log successful proxy responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Proxy] ${req.method} ${req.path} -> ${proxyRes.statusCode}`);
    }
  },
  onError: (err, req, res) => {
    console.error('[Proxy Error]', err.message);
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Backend service unavailable',
        message: 'Python API server may not be running. Please ensure the backend is started on port 8000.',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  },
});

// Catch-all proxy middleware (runs for ALL routes)
// Vite strips /api prefix, so Express receives paths like /ingest/upload, /health, /chat, etc.
// We check if it's an Express route, if not, proxy to Python backend
app.use((req, res, next) => {
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Express] ${req.method} ${req.path} - Checking route...`);
  }
  
  // Check if this route is handled by Express
  const isExpressRoute = expressRoutes.some(route => {
    // Handle exact matches and path starts with
    if (req.path === route || req.path.startsWith(route + '/')) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Express] Route matched: ${req.path} -> Express handler`);
      }
      return true;
    }
    // Special case for /agents/:id routes
    if (route === '/agents' && req.path.startsWith('/agents/')) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Express] Route matched: ${req.path} -> Express handler`);
      }
      return true;
    }
    return false;
  });
  
  if (isExpressRoute) {
    // Let Express handle it - continue to next middleware
    return next();
  }
  
  // Not an Express route - proxy to Python backend
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Proxy] Routing ${req.method} ${req.path} to Python backend`);
  }
  return pythonBackendProxy(req, res, next);
});

// JSON body parser (only for Express routes that need it)
app.use(express.json());

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Ensure uploads directory exists
const uploadsDir = join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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
    gemini: {
      connected: !!gemini,
      configured: true,
      model: 'gemini-3-pro-preview',
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
        // Use Langfuse API to fetch traces
        const baseUrl = process.env.LANGFUSE_BASE_URL || 'http://localhost:3000';
        const authHeader = Buffer.from(
          `${process.env.LANGFUSE_PUBLIC_KEY}:${process.env.LANGFUSE_SECRET_KEY}`
        ).toString('base64');
        
        // Fetch traces from Langfuse API
        const tracesResponse = await fetch(
          `${baseUrl}/api/public/traces?limit=100`,
          {
            headers: {
              'Authorization': `Basic ${authHeader}`,
              'Content-Type': 'application/json',
            },
          }
        );

        let traceData = [];
        if (tracesResponse.ok) {
          const responseData = await tracesResponse.json();
          traceData = responseData.data || responseData || [];
        }

        if (traceData && traceData.length > 0) {
          const totalTraces = traceData.length;
          
          // Calculate metrics from trace data
          const latencies = traceData
            .map(t => {
              // Try different latency fields
              return t.latency || t.duration || 
                     (t.endTime && t.startTime ? new Date(t.endTime) - new Date(t.startTime) : 0);
            })
            .filter(l => l > 0);
          const avgLatency = latencies.length > 0
            ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
            : 0;

          const totalCostFromTraces = traceData.reduce((sum, t) => {
            return sum + (t.calculatedTotalCost || t.totalCost || 0);
          }, 0);

          const modelUsage = {};
          traceData.forEach(trace => {
            // Check observations array or nested structure
            const observations = trace.observations || trace.children || [];
            observations.forEach(obs => {
              const model = obs.model || obs.modelName || trace.model || 'unknown';
              modelUsage[model] = (modelUsage[model] || 0) + 1;
            });
            // Also check trace-level model
            if (trace.model && !observations.length) {
              modelUsage[trace.model] = (modelUsage[trace.model] || 0) + 1;
            }
          });

          const userActivity = {};
          traceData.forEach(trace => {
            const userId = trace.userId || trace.user_id || 'anonymous';
            userActivity[userId] = (userActivity[userId] || 0) + 1;
          });

          const sessionActivity = {};
          traceData.forEach(trace => {
            const sessionId = trace.sessionId || trace.session_id;
            if (sessionId) {
              sessionActivity[sessionId] = (sessionActivity[sessionId] || 0) + 1;
            }
          });

          const errorTraces = traceData.filter(t => 
            t.level === 'ERROR' || t.status === 'ERROR' || t.statusMessage?.toLowerCase().includes('error')
          ).length;
          const successRate = totalTraces > 0
            ? (((totalTraces - errorTraces) / totalTraces) * 100)
            : 100;

          const tracesByHour = {};
          traceData.forEach(trace => {
            const timestamp = trace.timestamp || trace.createdAt || trace.startTime;
            if (timestamp) {
              const hour = new Date(timestamp).getHours();
              tracesByHour[hour] = (tracesByHour[hour] || 0) + 1;
            }
          });

          const recentTraces = traceData.slice(0, 10).map(trace => ({
            id: trace.id,
            name: trace.name || 'agent-query',
            userId: trace.userId || trace.user_id || '-',
            timestamp: trace.timestamp || trace.createdAt || trace.startTime || new Date().toISOString(),
            latency: trace.latency || trace.duration || 
                    (trace.endTime && trace.startTime ? new Date(trace.endTime) - new Date(trace.startTime) : 0),
            level: trace.level || trace.status || 'DEFAULT',
            statusMessage: trace.statusMessage || trace.status || 'Success',
            tokensUsed: (trace.inputUsage || trace.inputTokens || 0) + (trace.outputUsage || trace.outputTokens || 0),
            cost: trace.calculatedTotalCost || trace.totalCost || 0,
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

// Helper function to read and analyze file
async function analyzeFile(filePath, fileName) {
  const fileExtension = fileName.split('.').pop().toLowerCase();
  let content = '';
  let fileInfo = {
    type: 'Unknown',
    rows: 0,
    columns: [],
    sampleData: '',
  };

  try {
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    
    switch (fileExtension) {
      case 'csv':
        const csvLines = fileContent.split('\n').filter(line => line.trim());
        fileInfo.type = 'CSV';
        fileInfo.rows = csvLines.length - 1; // Subtract header
        if (csvLines.length > 0) {
          fileInfo.columns = csvLines[0].split(',').map(col => col.trim());
          fileInfo.sampleData = csvLines.slice(0, Math.min(5, csvLines.length)).join('\n');
        }
        content = `CSV File Analysis:\n- Rows: ${fileInfo.rows}\n- Columns: ${fileInfo.columns.join(', ')}\n- Sample Data:\n${fileInfo.sampleData}`;
        break;
      
      case 'json':
        try {
          const jsonData = JSON.parse(fileContent);
          fileInfo.type = 'JSON';
          if (Array.isArray(jsonData)) {
            fileInfo.rows = jsonData.length;
            if (jsonData.length > 0) {
              fileInfo.columns = Object.keys(jsonData[0]);
              fileInfo.sampleData = JSON.stringify(jsonData.slice(0, 3), null, 2);
            }
          } else {
            fileInfo.columns = Object.keys(jsonData);
            fileInfo.sampleData = JSON.stringify(jsonData, null, 2);
          }
          content = `JSON File Analysis:\n- Type: ${Array.isArray(jsonData) ? 'Array' : 'Object'}\n- Rows: ${fileInfo.rows || 1}\n- Columns/Keys: ${fileInfo.columns.join(', ')}\n- Sample Data:\n${fileInfo.sampleData}`;
        } catch (e) {
          content = `JSON File (parse error): ${fileContent.substring(0, 1000)}`;
        }
        break;
      
      case 'txt':
        fileInfo.type = 'Text';
        const txtLines = fileContent.split('\n');
        fileInfo.rows = txtLines.length;
        fileInfo.sampleData = txtLines.slice(0, 10).join('\n');
        content = `Text File Analysis:\n- Lines: ${fileInfo.rows}\n- Sample Content:\n${fileInfo.sampleData}`;
        break;
      
      default:
        content = `File Analysis:\n- Filename: ${fileName}\n- Type: ${fileExtension}\n- Size: ${(fileContent.length / 1024).toFixed(2)} KB\n- Sample Content (first 1000 chars):\n${fileContent.substring(0, 1000)}`;
    }
  } catch (error) {
    content = `Error reading file: ${error.message}`;
  }

  return { content, fileInfo };
}

// Dataset registration endpoint using Gemini
app.post('/datasets/register', upload.single('file'), async (req, res) => {
  const startTime = Date.now();

  if (!req.file) {
    return res.status(400).json({
      error: 'File is required',
      code: 'MISSING_FILE',
    });
  }

  if (!gemini) {
    // Clean up uploaded file
    if (req.file && req.file.path) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file:', cleanupError);
      }
    }
    return res.status(503).json({
      error: 'Gemini service unavailable. Please check GEMINI_API_KEY configuration.',
      code: 'SERVICE_UNAVAILABLE',
    });
  }

  try {
    // Analyze the uploaded file
    const { content: fileAnalysis, fileInfo } = await analyzeFile(req.file.path, req.file.originalname);
    
    // Get file size
    const stats = await fs.promises.stat(req.file.path);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    const fileSizeGB = (stats.size / (1024 * 1024 * 1024)).toFixed(2);
    const fileSizeStr = stats.size > 1024 * 1024 * 1024 
      ? `${fileSizeGB} GB` 
      : `${fileSizeMB} MB`;

    const prompt = `You are a data governance assistant. Analyze the following dataset file and generate structured metadata.

File Information:
- Filename: ${req.file.originalname}
- File Type: ${fileInfo.type}
- File Size: ${fileSizeStr}
- Estimated Records: ${fileInfo.rows || 'Unknown'}
- Columns/Fields: ${fileInfo.columns.length > 0 ? fileInfo.columns.join(', ') : 'Unknown'}

File Analysis:
${fileAnalysis}

Generate a JSON response with the following structure:
{
  "dataset_name": "A concise, descriptive name for the dataset",
  "description": "A one-line description of what this dataset contains",
  "sensitivity": "Low, Medium, High, or Critical",
  "records": <estimated number of records as integer>,
  "size": "Estimated size in GB or MB (e.g., '24.5 GB' or '150 MB')",
  "compliance": ["List", "of", "applicable", "compliance", "frameworks", "like", "GDPR", "HIPAA", "CCPA", "PCI-DSS"],
  "status": "active",
  "last_accessed": "Just now"
}

Rules:
- Dataset name should be clear and professional, based on the filename and content
- Description must be exactly one line describing what the dataset contains
- Sensitivity: Analyze the data content - Use "Low" for public/non-sensitive data, "Medium" for internal business data, "High" for sensitive personal/financial data, "Critical" for highly sensitive data (health, financial, PII)
- Records: Use the actual row count from the file analysis, or estimate if not available
- Size: Use the actual file size provided (${fileSizeStr})
- Compliance: Analyze the data fields and content to determine applicable frameworks:
  * GDPR: If contains EU personal data, email addresses, names, addresses
  * HIPAA: If contains health information, medical records, patient data
  * CCPA: If contains California resident personal information
  * PCI-DSS: If contains payment card information, credit card numbers
  * SOC 2: If contains security-sensitive data
- Status: Always "active" for new registrations
- Last accessed: Always "Just now" for new registrations

Return ONLY valid JSON, no markdown formatting, no code blocks.`;

    const config = {
      thinkingConfig: {
        thinkingLevel: 'HIGH',
      },
      systemInstruction: [
        {
          text: `You are a data governance expert. Generate accurate, realistic metadata for datasets based on descriptions. Always return valid JSON.`,
        },
      ],
    };

    const model = 'gemini-3-pro-preview';
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ];

    const response = await gemini.models.generateContentStream({
      model,
      config,
      contents,
    });

    let fullText = '';
    for await (const chunk of response) {
      if (chunk.text) {
        fullText += chunk.text;
      }
    }

    // Parse the response
    let responseText = fullText.trim();
    
    // Clean up response - remove markdown code blocks if present
    if (responseText.startsWith('```json')) {
      responseText = responseText.slice(7);
    } else if (responseText.startsWith('```')) {
      responseText = responseText.slice(3);
    }
    if (responseText.endsWith('```')) {
      responseText = responseText.slice(0, -3);
    }
    responseText = responseText.trim();

    // Parse JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      // Try to extract JSON from the response if it's embedded in text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error(`Failed to parse JSON response: ${parseError.message}`);
      }
    }

    // Validate and set defaults
    const result = {
      dataset_name: data.dataset_name || req.file.originalname.replace(/\.[^/.]+$/, ''),
      description: data.description || `Dataset file: ${req.file.originalname}`,
      sensitivity: data.sensitivity || 'Medium',
      records: parseInt(data.records) || fileInfo.rows || 100000,
      size: data.size || fileSizeStr,
      compliance: Array.isArray(data.compliance) ? data.compliance : [],
      status: data.status || 'active',
      last_accessed: data.last_accessed || 'Just now',
    };

    // Clean up uploaded file
    try {
      await fs.promises.unlink(req.file.path);
    } catch (cleanupError) {
      console.warn('Failed to cleanup uploaded file:', cleanupError);
    }

    const latency = Date.now() - startTime;
    console.log(`Dataset registered in ${latency}ms: ${result.dataset_name}`);

    res.json(result);
  } catch (error) {
    console.error('Dataset registration error:', error);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file on error:', cleanupError);
      }
    }
    
    res.status(500).json({
      error: error.message || 'Failed to register dataset',
      code: 'REGISTRATION_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Policy creation endpoint using Gemini
app.post('/policies/create', async (req, res) => {
  const startTime = Date.now();
  const { description } = req.body;

  if (!description || !description.trim()) {
    return res.status(400).json({
      error: 'Description is required',
      code: 'MISSING_DESCRIPTION',
    });
  }

  if (!gemini) {
    return res.status(503).json({
      error: 'Gemini service unavailable. Please check GEMINI_API_KEY configuration.',
      code: 'SERVICE_UNAVAILABLE',
    });
  }

  try {
    const prompt = `You are a policy governance expert. Based on the following policy description, generate structured metadata for an AI governance policy.

Policy Description: ${description.trim()}

Generate a JSON response with the following structure:
{
  "policy_name": "A concise, descriptive name for the policy (e.g., 'Data Privacy Policy v2.1', 'PII Protection Policy')",
  "category": "One of: Privacy, Security, Performance, Quality, Compliance",
  "severity": "One of: Low, Medium, High, Critical",
  "applied_to": <estimated number of agents this policy should apply to as integer (typically 20-70)>,
  "violations": <estimated number of current violations as integer (typically 0-5)>,
  "last_updated": "Current date in YYYY-MM-DD format",
  "status": "active"
}

Rules:
- Policy name should be clear, professional, and descriptive (include version if applicable)
- Category: Choose the most appropriate category:
  * Privacy: For data privacy, PII protection, GDPR-related policies
  * Security: For security protocols, access control, encryption policies
  * Performance: For resource usage, optimization, efficiency policies
  * Quality: For model quality, accuracy, validation policies
  * Compliance: For regulatory compliance, audit, governance policies
- Severity: Analyze the policy's importance:
  * Critical: For policies protecting sensitive data, preventing security breaches, or ensuring regulatory compliance
  * High: For important security or privacy policies
  * Medium: For standard operational policies
  * Low: For optional or informational policies
- Applied to: Estimate based on policy scope and ensure VARIETY - generate DIFFERENT numbers for different policies:
  * Privacy policies: typically 35-55 agents (choose a specific number like 42, 48, 51, etc. - vary it!)
  * Security policies: typically 45-70 agents (choose a specific number like 56, 62, 67, etc. - vary it!)
  * Performance policies: typically 20-45 agents (choose a specific number like 24, 31, 38, etc. - vary it!)
  * Quality policies: typically 15-35 agents (choose a specific number like 18, 24, 29, etc. - vary it!)
  * Compliance policies: typically 50-75 agents (choose a specific number like 55, 63, 71, etc. - vary it!)
  CRITICAL: Each policy MUST have a UNIQUE "applied_to" value. Do NOT use the same number twice. Generate varied, realistic numbers within the ranges.
- Violations: Estimate based on policy type and ensure VARIETY:
  * New policies: 0-2 violations (choose 0, 1, or 2 - vary it!)
  * Established policies: 1-5 violations (choose 1, 2, 3, 4, or 5 - vary it!)
  * Critical policies may have 2-4 violations
  CRITICAL: Vary the violations count - do not use the same number for all policies. Mix 0, 1, 2, 3, etc.
- Last updated: This will be automatically set to today's date by the server - you can ignore this field
- Status: Always "active" for new policies

Return ONLY valid JSON, no markdown formatting, no code blocks.`;

    const config = {
      thinkingConfig: {
        thinkingLevel: 'HIGH',
      },
      systemInstruction: [
        {
          text: `You are a policy governance expert. Generate accurate, realistic metadata for AI governance policies based on descriptions. Always return valid JSON.`,
        },
      ],
    };

    const model = 'gemini-3-pro-preview';
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ];

    const response = await gemini.models.generateContentStream({
      model,
      config,
      contents,
    });

    let fullText = '';
    for await (const chunk of response) {
      if (chunk.text) {
        fullText += chunk.text;
      }
    }

    // Parse the response
    let responseText = fullText.trim();
    
    // Clean up response - remove markdown code blocks if present
    if (responseText.startsWith('```json')) {
      responseText = responseText.slice(7);
    } else if (responseText.startsWith('```')) {
      responseText = responseText.slice(3);
    }
    if (responseText.endsWith('```')) {
      responseText = responseText.slice(0, -3);
    }
    responseText = responseText.trim();

    // Parse JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      // Try to extract JSON from the response if it's embedded in text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error(`Failed to parse JSON response: ${parseError.message}`);
      }
    }

    // Validate and set defaults
    const validCategories = ['Privacy', 'Security', 'Performance', 'Quality', 'Compliance'];
    const validSeverity = ['Low', 'Medium', 'High', 'Critical'];
    
    // Get today's date (not future dates)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Ensure applied_to is varied and realistic
    let appliedTo = parseInt(data.applied_to) || 30;
    // Add some randomness to ensure variety (within reasonable range)
    if (appliedTo < 20) appliedTo = 20 + Math.floor(Math.random() * 15);
    if (appliedTo > 75) appliedTo = 60 + Math.floor(Math.random() * 15);
    
    // Ensure violations is varied
    let violations = parseInt(data.violations) || 0;
    if (violations < 0) violations = 0;
    if (violations > 5) violations = Math.min(violations, 5);
    
    const result = {
      policy_name: data.policy_name || 'New Policy',
      category: validCategories.includes(data.category) ? data.category : 'Compliance',
      severity: validSeverity.includes(data.severity) ? data.severity : 'Medium',
      applied_to: appliedTo,
      violations: violations,
      last_updated: todayStr, // Always use today's date, not AI-generated date
      status: data.status || 'active',
    };

    const latency = Date.now() - startTime;
    console.log(`Policy created in ${latency}ms: ${result.policy_name}`);

    res.json(result);
  } catch (error) {
    console.error('Policy creation error:', error);
    res.status(500).json({
      error: error.message || 'Failed to create policy',
      code: 'POLICY_CREATION_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Agent creation endpoint using Gemini + LangChain JS
app.post('/agents/create', async (req, res) => {
  const startTime = Date.now();
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      error: 'Agent name is required',
      code: 'MISSING_NAME',
    });
  }

  if (!description || !description.trim()) {
    return res.status(400).json({
      error: 'Agent description is required',
      code: 'MISSING_DESCRIPTION',
    });
  }

  if (!gemini) {
    return res.status(503).json({
      error: 'Gemini service unavailable. Please check GEMINI_API_KEY configuration.',
      code: 'SERVICE_UNAVAILABLE',
    });
  }

  try {
    const prompt = `You are an AI agent architect. Based on the following agent name and description, generate structured metadata for creating an AI agent.

Agent Name: ${name.trim()}
Agent Description: ${description.trim()}

Generate a JSON response with the following structure:
{
  "agent_name": "The provided agent name (keep as is)",
  "agent_type": "One of: supervisor, data_discovery, metadata, compliance, analytics, sales, product, or a custom type based on description",
  "description": "A detailed description of what this agent does (expand on the provided description)",
  "specialization_prompt": "A comprehensive system prompt for this agent that defines its role, capabilities, behavior, and how it should respond. This should be detailed and specific to the agent's purpose. Include instructions on tone, response style, and any specific guidelines.",
  "risk_level": "One of: low, medium, high, critical",
  "tools_enabled": ["List", "of", "relevant", "tools", "based", "on", "agent", "type"],
  "owner": "Suggested owner/team name (e.g., 'Data Team', 'Security Team', 'Operations')"
}

Rules:
- Agent name: Use the exact name provided
- Agent type: Choose the most appropriate type:
  * supervisor: For general purpose, multi-agent coordination
  * data_discovery: For finding and exploring datasets
  * metadata: For querying metadata and lineage
  * compliance: For checking PII, security, governance
  * analytics: For generating insights and statistics
  * sales: For sales data analysis
  * product: For product data analysis
  * Or create a custom type if none fit (e.g., "customer_support", "content_moderation")
- Description: Expand on the provided description with more detail about the agent's purpose
- Specialization prompt: This is CRITICAL - create a detailed system prompt that:
  * Defines the agent's role and expertise
  * Describes its capabilities and limitations
  * Sets the tone and response style to be natural, conversational, and friendly
  * IMPORTANT: Explicitly instructs the agent to respond in natural, conversational language - NOT in structured formats, bullet points, or technical jargon unless specifically asked
  * The agent should communicate like a helpful colleague, using complete sentences and natural flow
  * Avoid structured output formats like "Anomaly/Violation:", "Severity Level:", etc. unless the user explicitly requests structured data
  * Should be comprehensive (3-5 paragraphs) to guide the agent's behavior
  * Should reflect the nuances and requirements from the description
- Risk level: Assess based on the agent's purpose:
  * Low: For informational, non-sensitive tasks
  * Medium: For standard business operations
  * High: For sensitive data handling
  * Critical: For security, compliance, or high-risk operations
- Tools enabled: Suggest relevant tools based on agent type (e.g., data_discovery agents might use search_datasets_tool, get_dataset_metadata_tool)
- Owner: Suggest an appropriate team/owner based on the agent's purpose

Return ONLY valid JSON, no markdown formatting, no code blocks.`;

    const config = {
      thinkingConfig: {
        thinkingLevel: 'HIGH',
      },
      systemInstruction: [
        {
          text: `You are an AI agent architect expert. Generate accurate, detailed metadata for AI agents based on descriptions. Always return valid JSON. Pay special attention to creating comprehensive specialization prompts that capture all nuances from the description.`,
        },
      ],
    };

    const model = 'gemini-3-pro-preview';
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ];

    const response = await gemini.models.generateContentStream({
      model,
      config,
      contents,
    });

    let fullText = '';
    for await (const chunk of response) {
      if (chunk.text) {
        fullText += chunk.text;
      }
    }

    // Parse the response
    let responseText = fullText.trim();
    
    // Clean up response - remove markdown code blocks if present
    if (responseText.startsWith('```json')) {
      responseText = responseText.slice(7);
    } else if (responseText.startsWith('```')) {
      responseText = responseText.slice(3);
    }
    if (responseText.endsWith('```')) {
      responseText = responseText.slice(0, -3);
    }
    responseText = responseText.trim();

    // Parse JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      // Try to extract JSON from the response if it's embedded in text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error(`Failed to parse JSON response: ${parseError.message}`);
      }
    }

    // Validate and set defaults
    const validAgentTypes = ['supervisor', 'data_discovery', 'metadata', 'compliance', 'analytics', 'sales', 'product'];
    const validRiskLevels = ['low', 'medium', 'high', 'critical'];
    
    const agentType = validAgentTypes.includes(data.agent_type?.toLowerCase()) 
      ? data.agent_type.toLowerCase() 
      : 'supervisor';
    
    const riskLevel = validRiskLevels.includes(data.risk_level?.toLowerCase())
      ? data.risk_level.toLowerCase()
      : 'medium';

    const agentId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Store metadata for agent recreation
    const agentMetadata = {
      id: agentId,
      name: data.agent_name || name.trim(),
      agentType: agentType,
      systemPrompt: data.specialization_prompt || `You are ${name.trim()}. ${description.trim()}`,
      specializationPrompt: data.specialization_prompt || `You are ${name.trim()}. ${description.trim()}`,
      description: data.description || description.trim(),
      riskLevel: riskLevel,
      toolsEnabled: Array.isArray(data.tools_enabled) ? data.tools_enabled : [],
      owner: data.owner || 'Operations Team',
    };

    // Store metadata for later recreation
    storeAgentMetadata(agentId, agentMetadata);
    
    // Create LangChain agent
    try {
      await createAgent({
        id: agentId,
        name: agentMetadata.name,
        agentType: agentType,
        systemPrompt: agentMetadata.systemPrompt,
        tools: [],
        llmConfig: {
          model: 'gemini-2.5-flash',
          temperature: 0.3,
          max_tokens: 4096,
        },
      });
      console.log(`✅ LangChain agent created: ${agentId}`);
    } catch (agentError) {
      console.warn('Failed to create LangChain agent, will recreate on query:', agentError);
    }

    const result = {
      id: agentId,
      agent_name: agentMetadata.name,
      agent_type: agentType,
      description: agentMetadata.description,
      specialization_prompt: agentMetadata.systemPrompt,
      risk_level: riskLevel,
      tools_enabled: agentMetadata.toolsEnabled,
      owner: agentMetadata.owner,
    };

    const latency = Date.now() - startTime;
    console.log(`Agent metadata generated in ${latency}ms: ${result.agent_name}`);

    res.json(result);
  } catch (error) {
    console.error('Agent creation error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate agent metadata',
      code: 'AGENT_CREATION_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Agent metadata storage endpoint
app.post('/agents/:id/metadata', async (req, res) => {
  try {
    const { id } = req.params;
    const metadata = req.body;
    
    storeAgentMetadata(id, metadata);
    
    // Also try to create the agent if it doesn't exist
    const existingAgent = getAgent(id);
    if (!existingAgent) {
      try {
        await createAgent({
          id: metadata.id || id,
          name: metadata.name,
          agentType: metadata.agentType || 'supervisor',
          systemPrompt: metadata.specializationPrompt || metadata.systemPrompt || 'You are a helpful AI assistant.',
          tools: [],
          llmConfig: {
            model: 'gemini-2.5-flash',
            temperature: 0.3,
            max_tokens: 4096,
          },
        });
        console.log(`✅ Agent recreated from metadata: ${id}`);
      } catch (error) {
        console.warn('Failed to recreate agent from metadata:', error);
      }
    }
    
    res.json({ success: true, message: 'Agent metadata stored' });
  } catch (error) {
    console.error('Error storing agent metadata:', error);
    res.status(500).json({
      error: error.message || 'Failed to store agent metadata',
      code: 'METADATA_STORAGE_ERROR',
    });
  }
});

// Get agent metadata endpoint
app.get('/agents/:id/metadata', async (req, res) => {
  try {
    const { id } = req.params;
    const metadata = getAgentMetadata(id);
    
    if (!metadata) {
      return res.status(404).json({
        error: 'Agent metadata not found',
        code: 'METADATA_NOT_FOUND',
      });
    }
    
    res.json(metadata);
  } catch (error) {
    console.error('Error getting agent metadata:', error);
    res.status(500).json({
      error: error.message || 'Failed to get agent metadata',
      code: 'METADATA_RETRIEVAL_ERROR',
    });
  }
});

// Agent query endpoint using LangChain JS
app.post('/agents/query', async (req, res) => {
  const { agent_id, query, session_id } = req.body;

  if (!agent_id) {
    return res.status(400).json({
      error: 'Agent ID is required',
      code: 'MISSING_AGENT_ID',
    });
  }

  if (!query || !query.trim()) {
    return res.status(400).json({
      error: 'Query is required',
      code: 'MISSING_QUERY',
    });
  }

  try {
    // Get conversation history if session_id provided
    const chatHistory = session_id ? getConversationHistory(session_id) : [];

    // Query the agent (will recreate if needed)
    // chatHistory is already in the correct format for direct Gemini API
    const result = await queryAgent(agent_id, query.trim(), session_id || null, chatHistory);

    if (!result.success) {
      return res.status(500).json({
        error: result.error || 'Agent query failed',
        code: 'AGENT_QUERY_ERROR',
      });
    }

    res.json({
      success: true,
      response: result.response,
      agent: result.agent,
      agent_type: result.agent_type,
      execution_time_ms: result.execution_time_ms,
      timestamp: result.timestamp,
      tool_calls: result.tool_calls || [],
      session_id: session_id || null,
    });
  } catch (error) {
    console.error('Agent query error:', error);
    res.status(500).json({
      error: error.message || 'Failed to query agent. The agent may not exist or may need to be recreated.',
      code: 'AGENT_QUERY_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// List all agents
app.get('/agents', async (req, res) => {
  try {
    const agents = listAgents();
    res.json({
      agents,
      total: agents.length,
    });
  } catch (error) {
    console.error('List agents error:', error);
    res.status(500).json({
      error: error.message || 'Failed to list agents',
      code: 'LIST_AGENTS_ERROR',
    });
  }
});

// Get agent by ID
app.get('/agents/:id', async (req, res) => {
  try {
    const agent = getAgent(req.params.id);
    if (!agent) {
      return res.status(404).json({
        error: 'Agent not found',
        code: 'AGENT_NOT_FOUND',
      });
    }
    res.json({
      id: agent.id,
      name: agent.name,
      agentType: agent.agentType,
      systemPrompt: agent.systemPrompt,
      createdAt: agent.createdAt,
    });
  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get agent',
      code: 'GET_AGENT_ERROR',
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
    console.log(`🤖 Gemini: ${gemini ? '✅ Connected' : '❌ Not configured'}`);
    console.log(`\nEndpoints:`);
    console.log(`  GET    http://localhost:${PORT}/api/health`);
    console.log(`  POST   http://localhost:${PORT}/api/chat`);
    console.log(`  POST   http://localhost:${PORT}/api/datasets/register`);
    console.log(`  POST   http://localhost:${PORT}/api/policies/create`);
    console.log(`  POST   http://localhost:${PORT}/api/agents/create`);
    console.log(`  POST   http://localhost:${PORT}/api/agents/query`);
    console.log(`  POST   http://localhost:${PORT}/api/agents/:id/metadata`);
    console.log(`  GET    http://localhost:${PORT}/api/agents`);
    console.log(`  GET    http://localhost:${PORT}/api/agents/:id`);
    console.log(`  GET    http://localhost:${PORT}/api/agents/:id/metadata`);
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
