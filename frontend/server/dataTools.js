/**
 * Data Access Tools for Frontend Agents
 * Provides access to local data sources from /output directory
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to output directory - resolve relative to frontend/server directory
// frontend/server/dataTools.js -> go up 2 levels to project root, then into output
const OUTPUT_DIR = path.resolve(__dirname, '..', '..', 'output');

/**
 * Query local collections from /output directory
 * @param {string} collectionName - Optional collection/source name (e.g., 'products', 'sales', 'users')
 * @param {number} limit - Maximum number of records to return
 * @returns {Object} Query results
 */
export async function queryLocalCollections(collectionName = null, limit = 10) {
  try {
    if (!fs.existsSync(OUTPUT_DIR)) {
      return {
        error: 'Output directory not found',
        message: 'Data has not been ingested yet. Run ingestion first.',
        available_collections: []
      };
    }

    // Scan output directory for available collections
    const collections = {};
    
    const sourceDirs = fs.readdirSync(OUTPUT_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory());
    
    for (const sourceDir of sourceDirs) {
      const sourceName = sourceDir.name;
      const sourcePath = path.join(OUTPUT_DIR, sourceName);
      
      // Look for entity directories inside source
      const entityDirs = fs.readdirSync(sourcePath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory());
      
      for (const entityDir of entityDirs) {
        const entityName = entityDir.name;
        const entityPath = path.join(sourcePath, entityName);
        
        // Look for date directories
        const dateDirs = fs.readdirSync(entityPath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory());
        
        for (const dateDir of dateDirs) {
          const datePath = path.join(entityPath, dateDir.name);
          const dataFile = path.join(datePath, 'data.jsonl');
          
          if (fs.existsSync(dataFile)) {
            // Read the data
            const records = [];
            const fileContent = fs.readFileSync(dataFile, 'utf8');
            const lines = fileContent.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
              try {
                records.push(JSON.parse(line));
              } catch (e) {
                console.error(`Error parsing line in ${dataFile}:`, e);
              }
            }
            
            const collectionKey = `${sourceName}/${entityName}`;
            collections[collectionKey] = {
              source: sourceName,
              entity_type: entityName,
              record_count: records.length,
              records: records.slice(0, limit)
            };
          }
        }
      }
    }
    
    if (Object.keys(collections).length === 0) {
      return {
        message: 'No data found in output directory',
        available_collections: []
      };
    }
    
    // Filter by collection_name if provided
    if (collectionName) {
      const matchingCollections = {};
      
      for (const [key, data] of Object.entries(collections)) {
        const searchTerm = collectionName.toLowerCase();
        if (key.toLowerCase().includes(searchTerm) ||
            data.source.toLowerCase().includes(searchTerm) ||
            data.entity_type.toLowerCase().includes(searchTerm)) {
          matchingCollections[key] = data;
        }
      }
      
      if (Object.keys(matchingCollections).length === 0) {
        return {
          message: `No collections found matching: ${collectionName}`,
          available_collections: Object.keys(collections),
          query: collectionName
        };
      }
      
      return {
        message: `Found ${Object.keys(matchingCollections).length} collection(s) matching: ${collectionName}`,
        collections: matchingCollections,
        total_collections: Object.keys(collections).length
      };
    }
    
    // Return all collections
    return {
      message: `Found ${Object.keys(collections).length} collection(s)`,
      collections,
      available_collections: Object.keys(collections)
    };
    
  } catch (error) {
    console.error('Error in queryLocalCollections:', error);
    return {
      error: error.message,
      message: 'Failed to query local collections'
    };
  }
}

/**
 * Get list of available data sources/collections
 * @returns {Object} List of available collections
 */
export async function getAvailableCollections() {
  try {
    if (!fs.existsSync(OUTPUT_DIR)) {
      return {
        message: 'No data available',
        collections: []
      };
    }

    const collections = [];
    
    const sourceDirs = fs.readdirSync(OUTPUT_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory());
    
    for (const sourceDir of sourceDirs) {
      const sourceName = sourceDir.name;
      const sourcePath = path.join(OUTPUT_DIR, sourceName);
      
      const entityDirs = fs.readdirSync(sourcePath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory());
      
      for (const entityDir of entityDirs) {
        const entityName = entityDir.name;
        const entityPath = path.join(sourcePath, entityName);
        
        const dateDirs = fs.readdirSync(entityPath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory());
        
        let totalRecords = 0;
        
        for (const dateDir of dateDirs) {
          const datePath = path.join(entityPath, dateDir.name);
          const dataFile = path.join(datePath, 'data.jsonl');
          
          if (fs.existsSync(dataFile)) {
            const fileContent = fs.readFileSync(dataFile, 'utf8');
            const lines = fileContent.split('\n').filter(line => line.trim());
            totalRecords += lines.length;
          }
        }
        
        collections.push({
          name: `${sourceName}/${entityName}`,
          source: sourceName,
          entity_type: entityName,
          record_count: totalRecords
        });
      }
    }
    
    return {
      message: `Found ${collections.length} collection(s)`,
      count: collections.length,
      collections
    };
    
  } catch (error) {
    console.error('Error in getAvailableCollections:', error);
    return {
      error: error.message,
      collections: []
    };
  }
}

/**
 * Query specific product data
 * @param {number} limit - Maximum number of records to return
 * @returns {Object} Product data
 */
export async function queryProducts(limit = 10) {
  return await queryLocalCollections('products', limit);
}

/**
 * Query specific sales data
 * @param {number} limit - Maximum number of records to return
 * @returns {Object} Sales data
 */
export async function querySales(limit = 10) {
  return await queryLocalCollections('sales', limit);
}

/**
 * Query specific users data
 * @param {number} limit - Maximum number of records to return
 * @returns {Object} Users data
 */
export async function queryUsers(limit = 10) {
  return await queryLocalCollections('users', limit);
}

/**
 * Execute tool based on name
 * @param {string} toolName - Name of the tool to execute
 * @param {Object} params - Tool parameters
 * @returns {Promise<Object>} Tool execution result
 */
export async function executeTool(toolName, params = {}) {
  const limit = params.limit || 10;
  const collectionName = params.collection_name || params.collectionName || null;
  
  switch (toolName) {
    case 'query_local_collections':
    case 'query_local_collections_tool':
      return await queryLocalCollections(collectionName, limit);
    
    case 'get_available_collections':
    case 'get_collections_tool':
      return await getAvailableCollections();
    
    case 'query_products':
      return await queryProducts(limit);
    
    case 'query_sales':
      return await querySales(limit);
    
    case 'query_users':
      return await queryUsers(limit);
    
    default:
      return {
        error: `Unknown tool: ${toolName}`,
        available_tools: [
          'query_local_collections',
          'get_available_collections',
          'query_products',
          'query_sales',
          'query_users'
        ]
      };
  }
}
