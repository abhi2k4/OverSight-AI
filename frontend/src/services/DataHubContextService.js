/**
 * DataHub integration service for frontend
 * Provides context about datasets and metadata to enhance agent responses
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

class DataHubContextService {
  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
  }

  /**
   * Search for relevant datasets based on query keywords
   * @param {string} query - User query to analyze for dataset context
   * @param {Object} options - Search options
   * @returns {Promise<Object>} DataHub context data
   */
  async getQueryContext(query, options = {}) {
    try {
      // Extract potential keywords for DataHub search
      const keywords = this.extractKeywords(query)
      
      if (keywords.length === 0) {
        return { hasContext: false, message: 'No relevant datasets found for this query' }
      }

      // Check cache first
      const cacheKey = `context_${keywords.join('_')}_${JSON.stringify(options)}`
      const cached = this.getCached(cacheKey)
      if (cached) {
        return cached
      }

      // Search for relevant datasets
      const context = await Promise.all([
        this.searchDatasets(keywords, options),
        this.searchByDomain(this.detectDomain(query), options),
        this.searchByTags(this.detectTags(query), options)
      ])

      const result = {
        hasContext: true,
        datasets: context[0],
        domainDatasets: context[1],
        taggedDatasets: context[2],
        keywords,
        summary: this.generateContextSummary(context)
      }

      this.setCache(cacheKey, result)
      return result

    } catch (error) {
      console.error('Error getting DataHub context:', error)
      return { 
        hasContext: false, 
        error: error.message,
        message: 'DataHub context unavailable - proceeding without dataset context'
      }
    }
  }

  /**
   * Search datasets using DataHub API through backend
   */
  async searchDatasets(keywords, options = {}) {
    const query = keywords.join(' ')
    const params = new URLSearchParams({
      query,
      limit: options.limit || 5,
      ...(options.platform && { platform: options.platform })
    })

    const response = await fetch(`${API_BASE}/datahub/search?${params}`)
    if (!response.ok) {
      throw new Error(`DataHub search failed: ${response.status}`)
    }

    return await response.json()
  }

  /**
   * Search by business domain
   */
  async searchByDomain(domain, options = {}) {
    if (!domain) return []

    const params = new URLSearchParams({
      domain,
      limit: options.limit || 3
    })

    const response = await fetch(`${API_BASE}/datahub/search/domain?${params}`)
    if (!response.ok) return []

    return await response.json()
  }

  /**
   * Search by tags (e.g., PII, sensitive)
   */
  async searchByTags(tags, options = {}) {
    if (!tags || tags.length === 0) return []

    const params = new URLSearchParams({
      tags: tags.join(','),
      limit: options.limit || 3
    })

    const response = await fetch(`${API_BASE}/datahub/search/tags?${params}`)
    if (!response.ok) return []

    return await response.json()
  }

  /**
   * Extract keywords from user query that might relate to datasets
   */
  extractKeywords(query) {
    const text = query.toLowerCase()
    
    // Common data-related keywords
    const dataKeywords = [
      'customer', 'user', 'sales', 'product', 'order', 'transaction', 'payment',
      'revenue', 'analytics', 'report', 'dashboard', 'metric', 'kpi',
      'employee', 'hr', 'finance', 'marketing', 'inventory', 'warehouse',
      'campaign', 'email', 'conversion', 'funnel', 'retention', 'churn',
      'segment', 'cohort', 'attribution', 'forecast', 'budget', 'cost'
    ]

    // Extract table/dataset-like terms (often nouns)
    const words = text.match(/\b\w+(?:_\w+)*\b/g) || []
    const keywords = new Set()

    // Add data-related keywords found in query
    dataKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        keywords.add(keyword)
      }
    })

    // Add potential table names (words with underscores or plural nouns)
    words.forEach(word => {
      if (word.includes('_') || (word.endsWith('s') && word.length > 3)) {
        keywords.add(word)
      }
    })

    return Array.from(keywords).slice(0, 5) // Limit to top 5 keywords
  }

  /**
   * Detect business domain from query
   */
  detectDomain(query) {
    const text = query.toLowerCase()
    const domains = {
      'sales': ['sales', 'revenue', 'deal', 'lead', 'prospect', 'commission'],
      'marketing': ['marketing', 'campaign', 'email', 'conversion', 'funnel', 'attribution'],
      'finance': ['finance', 'accounting', 'budget', 'cost', 'expense', 'profit'],
      'hr': ['hr', 'employee', 'hiring', 'recruitment', 'payroll', 'benefits'],
      'operations': ['operations', 'logistics', 'inventory', 'warehouse', 'supply'],
      'analytics': ['analytics', 'report', 'dashboard', 'metric', 'kpi', 'insight']
    }

    for (const [domain, keywords] of Object.entries(domains)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return domain
      }
    }

    return null
  }

  /**
   * Detect potential data tags from query
   */
  detectTags(query) {
    const text = query.toLowerCase()
    const tagPatterns = {
      'pii': ['personal', 'private', 'sensitive', 'confidential', 'email', 'phone', 'address'],
      'financial': ['financial', 'payment', 'credit', 'banking', 'transaction'],
      'healthcare': ['health', 'medical', 'patient', 'diagnosis', 'treatment'],
      'public': ['public', 'open', 'external', 'published']
    }

    const tags = []
    for (const [tag, patterns] of Object.entries(tagPatterns)) {
      if (patterns.some(pattern => text.includes(pattern))) {
        tags.push(tag)
      }
    }

    return tags
  }

  /**
   * Generate context summary for agent
   */
  generateContextSummary(contextData) {
    const [datasets, domainDatasets, taggedDatasets] = contextData
    const totalDatasets = (datasets?.length || 0) + (domainDatasets?.length || 0) + (taggedDatasets?.length || 0)
    
    if (totalDatasets === 0) {
      return 'No relevant datasets found in DataHub'
    }

    const parts = []
    if (datasets?.length) parts.push(`${datasets.length} matching datasets`)
    if (domainDatasets?.length) parts.push(`${domainDatasets.length} domain-specific datasets`)
    if (taggedDatasets?.length) parts.push(`${taggedDatasets.length} tagged datasets`)

    return `Found ${totalDatasets} relevant datasets: ${parts.join(', ')}`
  }

  /**
   * Cache management
   */
  getCached(key) {
    const item = this.cache.get(key)
    if (item && Date.now() - item.timestamp < this.cacheTimeout) {
      return item.data
    }
    this.cache.delete(key)
    return null
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * Format DataHub context for agent prompt
   */
  formatContextForAgent(context) {
    if (!context.hasContext) {
      return null
    }

    const sections = []

    if (context.datasets?.length) {
      sections.push(`Available Datasets: ${context.datasets.map(d => d.name).join(', ')}`)
    }

    if (context.domainDatasets?.length) {
      sections.push(`Domain Datasets: ${context.domainDatasets.map(d => d.name).join(', ')}`)
    }

    if (context.taggedDatasets?.length) {
      sections.push(`Tagged Datasets: ${context.taggedDatasets.map(d => d.name).join(', ')}`)
    }

    return sections.length > 0 ? sections.join('\n') : null
  }
}

export default new DataHubContextService()