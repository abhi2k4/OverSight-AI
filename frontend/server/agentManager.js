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
        model: llmConfig.model || 'gemini-2.0-flash-exp',
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
        model: 'gemini-2.0-flash-exp',
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

  try {
    const geminiClient = await initializeGemini();
    if (!geminiClient) {
      throw new Error('Gemini client not initialized');
    }

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

    // Call Gemini API directly
    // Enhance system prompt to ensure natural language responses
    const enhancedSystemPrompt = `${agent.systemPrompt}

IMPORTANT: Always respond in natural, conversational language. Use complete sentences and a friendly, helpful tone. Avoid structured formats, bullet points, or technical jargon unless the user specifically requests them. Communicate like a helpful colleague having a conversation.`;
    
    const config = {
      systemInstruction: [
        {
          text: enhancedSystemPrompt,
        },
      ],
    };

    const model = agent.llmConfig.model || 'gemini-2.0-flash-exp';
    
    const response = await geminiClient.models.generateContentStream({
      model,
      config,
      contents,
    });

    // Stream the response
    let fullText = '';
    for await (const chunk of response) {
      if (chunk.text) {
        fullText += chunk.text;
      }
    }

    const responseText = fullText.trim() || 'No response generated';
    const executionTime = Date.now() - startTime;

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
      } : null
    };
  } catch (error) {
    console.error('Error querying agent:', error);
    return {
      success: false,
      error: error.message || 'Failed to query agent',
      agent: agent.name,
      agent_type: agent.agentType,
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
