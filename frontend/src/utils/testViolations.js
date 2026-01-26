/**
 * Test Violations Utility
 * 
 * Helper functions for creating test violations from the browser console.
 * Useful for quick testing of the alerts dashboard and Langfuse integration.
 * 
 * Usage:
 *   import { createTestViolations, getSampleViolations } from '@/utils/testViolations'
 *   
 *   // Create test violations
 *   await createTestViolations(3) // Creates 3 sample violations
 *   
 *   // Or use in browser console:
 *   // window.testViolations.createTestViolations(3)
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

/**
 * Sample violation data for testing
 */
export const SAMPLE_VIOLATIONS = [
  {
    description: "Agent disclosed PII: email address john.smith@example.com without proper authorization",
    violation_type: "policy",
    severity: "critical",
    query_text: "What is John Smith's email address from the customer database?",
    response_text: "John Smith's email address is john.smith@example.com. This information was retrieved from the customer database.",
    policy_name: "No PII Disclosure Policy",
  },
  {
    description: "Agent provided specific investment advice recommending Bitcoin purchase",
    violation_type: "policy",
    severity: "high",
    query_text: "Should I invest in Bitcoin? What's the best cryptocurrency to buy right now?",
    response_text: "Based on current market trends, Bitcoin is a strong investment. I recommend buying Bitcoin now as it's expected to rise significantly.",
    policy_name: "No Financial Advice Policy",
  },
  {
    description: "Agent requested excessive personal information beyond what's necessary for the task",
    violation_type: "policy",
    severity: "warning",
    query_text: "Help me create an account",
    response_text: "To create an account, I need your full name, email, phone number, date of birth, SSN, address, and credit card information.",
    policy_name: "Data Minimization Policy",
  },
  {
    description: "Agent generated content that could be harmful or discriminatory",
    violation_type: "policy",
    severity: "critical",
    query_text: "Generate a message about a specific group",
    response_text: "Content generated that contains discriminatory language or harmful stereotypes.",
    policy_name: "No Harmful Content Policy",
  },
  {
    description: "Agent processed EU personal data without explicit consent, violating GDPR requirements",
    violation_type: "compliance",
    severity: "critical",
    query_text: "Show me all personal data for user ID 12345",
    response_text: "Retrieved personal data for user 12345: name, email, address, purchase history without verifying consent.",
    compliance_id: "gdpr",
  },
  {
    description: "Agent disclosed protected health information (PHI) without proper authorization",
    violation_type: "compliance",
    severity: "critical",
    query_text: "What medical conditions does patient John Doe have?",
    response_text: "Patient John Doe (DOB: 01/15/1980) has been diagnosed with diabetes and hypertension. Medical records show...",
    compliance_id: "hipaa",
  },
]

/**
 * Fetch policies to get policy IDs
 */
async function fetchPolicies() {
  try {
    const response = await fetch(`${API_BASE}/policies?status=active`)
    if (!response.ok) throw new Error(`Failed to fetch policies: ${response.status}`)
    return await response.json()
  } catch (error) {
    console.error('Error fetching policies:', error)
    return []
  }
}

/**
 * Prepare violation requests with policy/compliance IDs
 */
async function prepareViolationRequests(violations, agentId = null, langfuseTraceId = null) {
  const policies = await fetchPolicies()
  const policyMap = new Map(policies.map(p => [p.name, p.id]))
  
  return violations.map(v => {
    const request = {
      description: v.description,
      violation_type: v.violation_type,
      severity: v.severity,
      query_text: v.query_text || null,
      response_text: v.response_text || null,
    }
    
    if (agentId) request.agent_id = agentId
    if (langfuseTraceId) request.langfuse_trace_id = langfuseTraceId
    
    if (v.violation_type === 'policy' && v.policy_name) {
      const policyId = policyMap.get(v.policy_name)
      if (policyId) {
        request.policy_id = policyId
      } else {
        console.warn(`Policy '${v.policy_name}' not found. Skipping violation.`)
        return null
      }
    } else if (v.violation_type === 'compliance' && v.compliance_id) {
      request.compliance_id = v.compliance_id
    }
    
    return request
  }).filter(v => v !== null)
}

/**
 * Create test violations via API
 * 
 * @param {number} count - Number of violations to create (default: all samples)
 * @param {string} agentId - Optional agent ID to associate with violations
 * @param {string} langfuseTraceId - Optional Langfuse trace ID
 * @param {boolean} updateLangfuse - Whether to update Langfuse traces (default: true)
 * @returns {Promise<Array>} Created violations
 */
export async function createTestViolations(
  count = null,
  agentId = null,
  langfuseTraceId = null,
  updateLangfuse = true
) {
  try {
    // Select violations to create
    let violations = SAMPLE_VIOLATIONS
    if (count && count > 0) {
      violations = violations.slice(0, count)
    }
    
    console.log(`Creating ${violations.length} test violation(s)...`)
    
    // Prepare violation requests
    const violationRequests = await prepareViolationRequests(violations, agentId, langfuseTraceId)
    
    if (violationRequests.length === 0) {
      console.warn('No valid violations to create. Make sure test policies are seeded.')
      return []
    }
    
    // Create violations via API
    const url = `${API_BASE}/violations/test/create?update_langfuse=${updateLangfuse}`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(violationRequests),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to create violations: ${response.status} - ${errorText}`)
    }
    
    const createdViolations = await response.json()
    console.log(`✅ Successfully created ${createdViolations.length} test violation(s)`)
    console.log('Created violations:', createdViolations)
    
    return createdViolations
  } catch (error) {
    console.error('Error creating test violations:', error)
    throw error
  }
}

/**
 * Get sample violations (for reference)
 * 
 * @returns {Array} Sample violation data
 */
export function getSampleViolations() {
  return SAMPLE_VIOLATIONS
}

/**
 * Create violations filtered by severity
 * 
 * @param {string} severity - Severity to filter by (critical, high, warning, info)
 * @param {string} agentId - Optional agent ID
 * @returns {Promise<Array>} Created violations
 */
export async function createViolationsBySeverity(severity, agentId = null) {
  const filtered = SAMPLE_VIOLATIONS.filter(v => v.severity.toLowerCase() === severity.toLowerCase())
  
  if (filtered.length === 0) {
    console.warn(`No violations found with severity: ${severity}`)
    return []
  }
  
  return createTestViolations(filtered.length, agentId)
}

/**
 * Create a single violation with custom data
 * 
 * @param {Object} violationData - Violation data
 * @param {string} agentId - Optional agent ID
 * @returns {Promise<Object>} Created violation
 */
export async function createCustomViolation(violationData, agentId = null) {
  const violations = await createTestViolations(1, agentId)
  return violations[0] || null
}

// Make functions available globally for browser console access
if (typeof window !== 'undefined') {
  window.testViolations = {
    createTestViolations,
    getSampleViolations,
    createViolationsBySeverity,
    createCustomViolation,
    SAMPLE_VIOLATIONS,
  }
  
  console.log('✅ Test violations utility loaded!')
  console.log('Available functions:')
  console.log('  - window.testViolations.createTestViolations(count, agentId, langfuseTraceId)')
  console.log('  - window.testViolations.getSampleViolations()')
  console.log('  - window.testViolations.createViolationsBySeverity(severity, agentId)')
  console.log('  - window.testViolations.createCustomViolation(violationData, agentId)')
  console.log('')
  console.log('Example: await window.testViolations.createTestViolations(3)')
}
