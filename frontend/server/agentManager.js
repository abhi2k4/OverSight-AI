/**
 * Agent Manager
 * Manages AI agents using direct Gemini API calls
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { executeTool, queryLocalCollections, getAvailableCollections } from './dataTools.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory agent storage
const agents = new Map();
const conversations = new Map();
const agentMetadata = new Map(); // Store metadata for agent recreation

// File path for persistent storage
const DATA_DIR = path.join(__dirname, 'data');
const METADATA_FILE = path.join(DATA_DIR, 'agents_metadata.json');

// Hardcoded Gemini API key
const GEMINI_API_KEY = 'AIzaSyBag-dj15WK8BYPJP0W_hfZ5mwPkRRB8BY';

// Initialize Gemini client
let gemini = null;
async function initializeGemini() {
  if (!gemini && GEMINI_API_KEY) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      gemini = new GoogleGenAI({
        apiKey: GEMINI_API_KEY,
      });
      console.log('✅ Gemini client initialized for agents');
    } catch (error) {
      console.error('Failed to initialize Gemini:', error);
    }
  }
  return gemini;
}

/**
 * Create an agent with custom system prompt
 * Stores agent configuration for direct Gemini API calls
 */
export async function createAgent({
  id,
  name,
  agentType,
  systemPrompt,
  tools = [],
  llmConfig = {},
}) {
  try {
    await initializeGemini();
    
    const agentData = {
      id,
      name,
      agentType,
      systemPrompt: systemPrompt || 'You are a helpful AI assistant.',
      llmConfig: {
        model: llmConfig.model || 'gemini-2.5-flash',
        temperature: llmConfig.temperature || 0.3,
        maxTokens: llmConfig.max_tokens || 4096,
      },
      tools,
      createdAt: new Date().toISOString(),
    };

    agents.set(id, agentData);
    return agentData;
  } catch (error) {
    console.error('Error creating agent:', error);
    throw error;
  }
}

/**
 * Save metadata to file
 */
function saveMetadataToFile() {
  try {
    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Convert Map to object for JSON serialization
    const metadataObj = {};
    agentMetadata.forEach((value, key) => {
      metadataObj[key] = value;
    });

    // Write to file
    fs.writeFileSync(METADATA_FILE, JSON.stringify(metadataObj, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving agent metadata to file:', error);
  }
}

/**
 * Load metadata from file
 */
function loadMetadataFromFile() {
  try {
    if (fs.existsSync(METADATA_FILE)) {
      const fileContent = fs.readFileSync(METADATA_FILE, 'utf8');
      const metadataObj = JSON.parse(fileContent);
      
      // Load into Map
      Object.entries(metadataObj).forEach(([key, value]) => {
        agentMetadata.set(key, value);
      });
      
      console.log(`✅ Loaded ${agentMetadata.size} agent(s) from file`);
    }
  } catch (error) {
    console.error('Error loading agent metadata from file:', error);
    // If file is corrupted, create empty file
    if (error instanceof SyntaxError) {
      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(METADATA_FILE, '{}', 'utf8');
        console.log('Created new metadata file');
      } catch (writeError) {
        console.error('Error creating new metadata file:', writeError);
      }
    }
  }
}

/**
 * Store agent metadata for recreation
 */
export function storeAgentMetadata(id, metadata) {
  agentMetadata.set(id, metadata);
  // Save to file immediately
  saveMetadataToFile();
}

/**
 * Get agent metadata
 */
export function getAgentMetadata(id) {
  return agentMetadata.get(id);
}

/**
 * Recreate agent from stored metadata
 */
export async function recreateAgentFromMetadata(id) {
  const metadata = agentMetadata.get(id);
  if (!metadata) {
    return null;
  }

  try {
    const agent = await createAgent({
      id: metadata.id || id,
      name: metadata.name,
      agentType: metadata.agentType || 'supervisor',
      systemPrompt: metadata.systemPrompt || metadata.specializationPrompt || 'You are a helpful AI assistant.',
      tools: [],
      llmConfig: {
        model: 'gemini-2.5-flash',
        temperature: 0.3,
        max_tokens: 4096,
      },
    });

    return agent;
  } catch (error) {
    console.error('Error recreating agent from metadata:', error);
    return null;
  }
}

/**
 * Query an agent using direct Gemini API calls
 */
export async function queryAgent(agentId, query, sessionId = null, chatHistory = []) {
  let agent = agents.get(agentId);
  
  // If agent doesn't exist, try to recreate from metadata
  if (!agent) {
    console.log(`Agent ${agentId} not found in memory, attempting to recreate from metadata...`);
    agent = await recreateAgentFromMetadata(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}. Please ensure the agent exists.`);
    }
  }

  // Initialize Langfuse for tracing
  let langfuse = null;
  let trace = null;
  let generation = null;
  
  try {
    const { Langfuse } = await import('langfuse');
    if (process.env.LANGFUSE_SECRET_KEY && process.env.LANGFUSE_PUBLIC_KEY) {
      langfuse = new Langfuse({
        secretKey: process.env.LANGFUSE_SECRET_KEY,
        publicKey: process.env.LANGFUSE_PUBLIC_KEY,
        baseUrl: process.env.LANGFUSE_BASE_URL || 'http://localhost:3000',
      });
      
      // Create trace for this agent query
      trace = langfuse.trace({
        name: `agent-query-${agent.agentType}`,
        userId: sessionId || 'anonymous',
        sessionId: sessionId,
        metadata: {
          agentId: agentId,
          agentName: agent.name,
          agentType: agent.agentType,
        },
      });
    }
  } catch (error) {
    console.warn('Langfuse initialization failed:', error.message);
  }

  try {
    const geminiClient = await initializeGemini();
    if (!geminiClient) {
      throw new Error('Gemini client not initialized');
    }

    // ========== AGENT INPUT LOGGING ==========
    console.log('\n' + '='.repeat(80));
    console.log('🤖 AGENT QUERY - INPUT');
    console.log('='.repeat(80));
    console.log(`Agent ID: ${agentId}`);
    console.log(`Agent Name: ${agent.name}`);
    console.log(`Agent Type: ${agent.agentType}`);
    console.log(`Session ID: ${sessionId || 'N/A'}`);
    console.log(`\n📝 USER QUERY:\n${query}`);
    console.log('='.repeat(80) + '\n');
    
    // Log that we're about to fetch governance data
    console.log('[Governance] Fetching policies and compliances...');

    const startTime = Date.now();

    // Check if this agent type needs data access
    const dataAgentTypes = ['product', 'sales', 'data_discovery', 'supervisor'];
    const needsData = dataAgentTypes.includes(agent.agentType);
    
    console.log(`[Data Access] Agent type: ${agent.agentType}, Needs data: ${needsData}`);
    
    // Automatically fetch relevant data for certain agent types
    let contextData = null;
    let toolCalls = [];
    
    if (needsData) {
      // Determine what data to fetch based on query and agent type
      const queryLower = query.toLowerCase();
      let collectionName = null;
      
      if (agent.agentType === 'product' || queryLower.includes('product')) {
        collectionName = 'products';
      } else if (agent.agentType === 'sales' || queryLower.includes('sales')) {
        collectionName = 'sales';
      } else if (queryLower.includes('user')) {
        collectionName = 'users';
      }
      
      console.log(`[Data Access] Query: "${query}"`);
      console.log(`[Data Access] Collection to fetch: ${collectionName || 'ALL'}`);
      
      // Fetch data from local collections
      try {
        const dataResult = await queryLocalCollections(collectionName, 20);
        console.log(`[Data Access] Data fetched:`, dataResult.collections ? 'SUCCESS' : 'NO DATA');
        if (dataResult.collections) {
          console.log(`[Data Access] Collections:`, Object.keys(dataResult.collections));
        }
        
        toolCalls.push({
          tool: 'query_local_collections',
          params: { collection_name: collectionName, limit: 20 },
          status: 'success',
          result: dataResult
        });
        contextData = dataResult;
      } catch (error) {
        console.error('[Data Access] Error fetching data:', error);
        toolCalls.push({
          tool: 'query_local_collections',
          status: 'error',
          error: error.message
        });
      }
    }

    // Prepare messages for Gemini API
    // Gemini expects: systemInstruction and contents array with role and parts
    const contents = [];
    
    // Add chat history
    if (chatHistory && chatHistory.length > 0) {
      for (const msg of chatHistory) {
        if (msg.content) {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          });
        }
      }
    }
    
    // Enhance query with data context if available
    let enhancedQuery = query;
    if (contextData && contextData.collections) {
      const collectionSummary = Object.entries(contextData.collections)
        .map(([key, data]) => {
          const sampleRecords = data.records.slice(0, 3);
          return `\n\n**Data from ${key}** (${data.record_count} total records):\n${JSON.stringify(sampleRecords, null, 2)}`;
        })
        .join('\n');
      
      enhancedQuery = `${query}\n\n**Available Data Context:**${collectionSummary}\n\nPlease use this data to answer the question above. Analyze the actual data and provide insights based on what you see.`;
    }
    
    // Add current query (enhanced with data if available)
    contents.push({
      role: 'user',
      parts: [{ text: enhancedQuery }],
    });

    // Fetch active policies and compliances to inject into system prompt
    let governancePrompt = '';
    try {
      const apiBase = process.env.API_BASE_URL || 'http://127.0.0.1:8000';
      console.log(`[Governance] Fetching from: ${apiBase}/api/policies and ${apiBase}/api/compliances`);
      
      const [policiesRes, compliancesRes] = await Promise.all([
        fetch(`${apiBase}/api/policies?status=active`).catch(() => null),
        fetch(`${apiBase}/api/compliances`).catch(() => null)
      ]);
      
      let policies = [];
      let compliances = [];
      
      if (policiesRes?.ok) {
        policies = await policiesRes.json();
        console.log(`[Governance] ✅ Fetched ${policies.length} policies`);
      } else {
        console.warn(`[Governance] ❌ Failed to fetch policies: ${policiesRes?.status || 'No response'}`);
      }
      
      if (compliancesRes?.ok) {
        compliances = await compliancesRes.json();
        console.log(`[Governance] ✅ Fetched ${compliances.length} compliances`);
      } else {
        console.warn(`[Governance] ❌ Failed to fetch compliances: ${compliancesRes?.status || 'No response'}`);
      }
      
      // Build governance prompt with whatever data is available
      if (policies.length > 0 || compliances.length > 0) {
        governancePrompt = '\n\n=== GOVERNANCE POLICIES & COMPLIANCE REQUIREMENTS ===\n\n';
        
        if (policies.length > 0) {
          governancePrompt += 'POLICIES:\n';
          policies.forEach(policy => {
            governancePrompt += `- ${policy.name} (${policy.category}, ${policy.severity}): ${policy.description}\n`;
          });
          governancePrompt += '\n';
        }
        
        if (compliances.length > 0) {
          governancePrompt += 'COMPLIANCE FRAMEWORKS:\n';
          compliances.forEach(compliance => {
            governancePrompt += `- ${compliance.name} (${compliance.full_name}): ${compliance.description}\n`;
            if (compliance.details) {
              const details = compliance.details.length > 500 
                ? compliance.details.substring(0, 500) + '...' 
                : compliance.details;
              governancePrompt += `  Key Requirements: ${details}\n`;
            }
          });
          governancePrompt += '\n';
        }
        
        governancePrompt += 'IMPORTANT: You must comply with all policies and compliance requirements above. ';
        governancePrompt += 'If your response or actions would violate any policy, you must indicate this clearly. ';
        governancePrompt += 'When responding, ensure your answer adheres to these governance requirements.\n';
        
        console.log(`[Governance] ✅ Built governance prompt (${governancePrompt.length} chars)`);
      } else {
        console.warn('[Governance] ⚠️ No policies or compliances found - governance prompt will be empty');
      }
    } catch (error) {
      console.error('[Governance] ❌ Error fetching policies/compliances:', error.message);
    }
    
    const enhancedSystemPrompt = `${agent.systemPrompt}${governancePrompt}

IMPORTANT: Always respond in natural, conversational language. Use complete sentences and a friendly, helpful tone. Avoid structured formats, bullet points, or technical jargon unless the user specifically requests them. Communicate like a helpful colleague having a conversation.`;
    
    // ========== SYSTEM PROMPT LOGGING ==========
    if (governancePrompt) {
      console.log('\n' + '='.repeat(80));
      console.log('📋 GOVERNANCE PROMPT INJECTED');
      console.log('='.repeat(80));
      console.log(governancePrompt);
      console.log('='.repeat(80) + '\n');
    }
    
    const config = {
      systemInstruction: [
        {
          text: enhancedSystemPrompt,
        },
      ],
    };

    // Use a more stable model name - fallback to gemini-1.5-flash if 2.0-flash-exp fails
    let model = agent.llmConfig.model || 'gemini-2.5-flash';
    
    if (model === 'gemini-2.5-flash') {
    }
    
    // Create generation span in Langfuse
    if (trace) {
      generation = trace.generation({
        name: 'gemini-generation',
        model: model,
        input: enhancedQuery,
        metadata: {
          systemPrompt: agent.systemPrompt?.substring(0, 200) || '',
          chatHistoryLength: chatHistory.length,
          hasContextData: !!contextData,
        },
      });
    }
    
    // Retry logic for API calls
    let response = null;
    let fullText = '';
    const maxRetries = 2;
    let lastError = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // On retry, try with a more stable model
        if (attempt > 0 && model === 'gemini-2.5-flash') {
          model = 'gemini-1.5-flash';
          console.log(`[Agent Query] Retrying with fallback model: ${model}`);
        }
        
        console.log(`[Agent Query] Attempt ${attempt + 1}: Calling Gemini API with model: ${model}`);
        console.log(`[Agent Query] Contents length: ${contents.length}, Config:`, JSON.stringify(config, null, 2).substring(0, 200));
        
        response = await geminiClient.models.generateContentStream({
          model,
          config,
          contents,
        });

        // Stream the response
        fullText = '';
        for await (const chunk of response) {
          if (chunk.text) {
            fullText += chunk.text;
          }
        }
        
        // Success - break out of retry loop
        break;
      } catch (error) {
        lastError = error;
        console.error(`[Agent Query] Attempt ${attempt + 1} failed:`, error.message);
        console.error(`[Agent Query] Error details:`, error);
        
        // If it's the last attempt, throw the error
        if (attempt === maxRetries) {
          throw new Error(`Failed to query Gemini API after ${maxRetries + 1} attempts: ${error.message}. Original error: ${error}`);
        }
        
        // Wait before retrying (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s
        console.log(`[Agent Query] Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    const responseText = fullText.trim() || 'No response generated';
    const executionTime = Date.now() - startTime;
    
    // ========== AGENT OUTPUT LOGGING ==========
    console.log('\n' + '='.repeat(80));
    console.log('✅ AGENT QUERY - OUTPUT');
    console.log('='.repeat(80));
    console.log(`Agent: ${agent.name} (${agent.agentType})`);
    console.log(`Execution Time: ${executionTime}ms`);
    console.log(`\n💬 AGENT RESPONSE:\n${responseText}`);
    console.log(`\n📊 Response Length: ${responseText.length} characters`);
    console.log('='.repeat(80) + '\n');
    
    // Estimate token usage (rough approximation: 1 token ≈ 4 characters)
    const inputTokens = Math.ceil(enhancedQuery.length / 4);
    const outputTokens = Math.ceil(responseText.length / 4);
    const totalTokens = inputTokens + outputTokens;
    
    // Detect violations (call backend API) - non-blocking
    let violationsDetected = [];
    const detectViolations = async () => {
      try {
        const apiBase = process.env.API_BASE_URL || 'http://127.0.0.1:8000';
        const violationRes = await fetch(`${apiBase}/api/violations/detect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: query,
            response: responseText,
            agent_id: agentId,
            agent_name: agent.name,
            langfuse_trace_id: trace?.id || null
          })
        }).catch(() => null);
        
        if (violationRes?.ok) {
          const detected = await violationRes.json();
          violationsDetected = detected;
          console.log(`[Violation Detection] Detected ${violationsDetected.length} violations`);
          
          // Update trace with violations if they were detected
          if (trace && violationsDetected.length > 0) {
            trace.update({
              metadata: {
                ...trace.metadata,
                violations: violationsDetected.map(v => ({
                  policy_id: v.policy_id,
                  compliance_id: v.compliance_id,
                  violation_type: v.violation_type,
                  severity: v.severity,
                  description: v.description?.substring(0, 200)
                })),
                violations_count: violationsDetected.length
              },
              level: 'WARNING',
              statusMessage: `${violationsDetected.length} violation(s) detected`
            });
            await langfuse.flush();
          }
        }
      } catch (error) {
        console.warn('Failed to detect violations:', error.message);
      }
    };
    
    // Start violation detection (don't await - non-blocking)
    detectViolations();
    
    // Update generation with output and metrics
    if (generation) {
      generation.end({
        output: responseText,
        usage: {
          input: inputTokens,
          output: outputTokens,
          total: totalTokens,
        },
        model: model,
        latency: executionTime,
      });
    }
    
    // End trace (violations will be updated asynchronously)
    if (trace) {
      trace.update({
        metadata: {
          ...trace.metadata,
          executionTime: executionTime,
          toolCallsCount: toolCalls.length,
        },
        level: 'DEFAULT',
        statusMessage: 'Success'
      });
      await langfuse.flush();
    }

    // Store conversation
    if (sessionId) {
      if (!conversations.has(sessionId)) {
        conversations.set(sessionId, []);
      }
      const sessionHistory = conversations.get(sessionId);
      sessionHistory.push({ role: 'user', content: query });
      sessionHistory.push({ role: 'assistant', content: responseText });
      // Keep last 20 messages
      if (sessionHistory.length > 20) {
        conversations.set(sessionId, sessionHistory.slice(-20));
      }
    }

    return {
      success: true,
      response: responseText,
      agent: agent.name,
      agent_type: agent.agentType,
      execution_time_ms: executionTime,
      timestamp: new Date().toISOString(),
      tool_calls: toolCalls,
      data_context: contextData ? {
        collections_used: contextData.collections ? Object.keys(contextData.collections) : [],
        total_records: contextData.collections ? 
          Object.values(contextData.collections).reduce((sum, c) => sum + c.record_count, 0) : 0
      } : null,
      trace_id: trace?.id || null,
      violations: violationsDetected,
    };
  } catch (error) {
    console.error('Error querying agent:', error);
    
    // Log error to Langfuse if trace exists
    if (trace) {
      trace.update({
        level: 'ERROR',
        statusMessage: error.message || 'Failed to query agent',
      });
      if (generation) {
        generation.end({
          level: 'ERROR',
          statusMessage: error.message,
        });
      }
      await langfuse?.flush();
    }
    
    return {
      success: false,
      error: error.message || 'Failed to query agent',
      agent: agent.name,
      agent_type: agent.agentType,
      trace_id: trace?.id || null,
      violations: [],
    };
  }
}

/**
 * Get agent by ID
 */
export function getAgent(agentId) {
  return agents.get(agentId);
}

/**
 * List all agents
 */
export function listAgents() {
  return Array.from(agents.values()).map(agent => ({
    id: agent.id,
    name: agent.name,
    agentType: agent.agentType,
    systemPrompt: agent.systemPrompt,
    createdAt: agent.createdAt,
  }));
}

/**
 * Delete an agent
 */
export function deleteAgent(agentId) {
  return agents.delete(agentId);
}

/**
 * Get conversation history
 */
export function getConversationHistory(sessionId) {
  return conversations.get(sessionId) || [];
}

// Load metadata from file on module initialization
loadMetadataFromFile();
