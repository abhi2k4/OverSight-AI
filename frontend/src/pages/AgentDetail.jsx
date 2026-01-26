import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  IconChevronLeft,
  IconDownload,
  IconRefresh,
  IconAlertTriangle,
  IconCircleCheck,
  IconDatabase,
  IconShieldCheck,
  IconActivity,
  IconSend,
  IconLoader,
  IconMessage,
  IconRobot,
  IconSearch,
  IconBrain,
  IconBuilding,
  IconExternalLink,
  IconTag,
  IconShield,
  IconCurrencyDollar,
  IconUser,
  IconCalendar,
  IconShoppingCart,
  IconCode,
  IconChevronDown,
  IconChevronUp,
  IconX,
  IconMenu2,
  IconSettings,
  IconHistory,
  IconWand,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import DataHubContextService from '@/services/DataHubContextService'

const STORAGE_KEY = 'agents_data'

export default function AgentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [agent, setAgent] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [datahubContext, setDatahubContext] = useState(null)
  const [contextLoading, setContextLoading] = useState(false)
  const [useDataHubContext, setUseDataHubContext] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { toast } = useToast()

  // Get suggested prompts based on agent type
  const getSuggestedPrompts = () => {
    if (!agent) return []
    
    const agentType = agent.agentType?.toLowerCase() || ''
    const prompts = {
      'sales': [
        'What are the top performing products this month?',
        'Show me recent customer transactions',
        'Analyze sales trends for the last quarter',
        'What are the best-selling items?'
      ],
      'product': [
        'What are the current product specifications?',
        'Show me inventory levels across all locations',
        'What products need restocking?',
        'Analyze product performance metrics'
      ],
      'compliance': [
        'Check for compliance violations',
        'Review data privacy policies',
        'Analyze compliance status across datasets',
        'What are the current compliance requirements?'
      ],
      'analytics': [
        'Generate insights from recent data',
        'What are the key metrics this week?',
        'Analyze trends and patterns',
        'Create a summary of data activity'
      ],
      'metadata': [
        'What datasets are available?',
        'Show me data quality metrics',
        'Analyze metadata completeness',
        'What are the data lineage relationships?'
      ]
    }
    
    return prompts[agentType] || [
      'How can you help me today?',
      'What are your capabilities?',
      'Show me recent activity',
      'Explain your functionality'
    ]
  }

  // Load agent data
  useEffect(() => {
    // First try to get from location state (newly created agent)
    if (location.state?.agent) {
      setAgent(location.state.agent)
      return
    }

    // Then try localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const agents = JSON.parse(stored)
          if (Array.isArray(agents)) {
            const foundAgent = agents.find((a) => a.id === id)
            if (foundAgent) {
              // Use found agent with defaults only for missing fields
              setAgent({
                owner: foundAgent.owner || 'Operations Team',
                status: foundAgent.status || 'Active',
                trustScore: foundAgent.trustScore || 85,
                riskLevel: foundAgent.riskLevel || 'Medium',
                agentType: foundAgent.agentType || 'supervisor',
                description: foundAgent.description || '',
                specializationPrompt: foundAgent.specializationPrompt || 'You are a helpful AI assistant.',
                toolsEnabled: foundAgent.toolsEnabled || [],
                datasets: foundAgent.datasets || [],
                violations: foundAgent.violations || [],
                metrics: foundAgent.metrics || {
                  fairness: 85,
                  privacy: 75,
                  accuracy: 90,
                  robustness: 80,
                },
                logs: foundAgent.logs || [],
                ...foundAgent,
                id: foundAgent.id,
                name: foundAgent.name,
              })
              return
            }
          }
        } catch (error) {
          console.error('Error loading agent from localStorage:', error)
        }
      }
    }

    // Don't fallback to default - set to null to show "not found" state
    setAgent(null)
  }, [id, location.state])

  // Initialize session ID
  useEffect(() => {
    if (!sessionId) {
      setSessionId(`session-${id}-${Date.now()}`)
    }
  }, [id, sessionId])

  const getMetricColor = (value) => {
    if (value >= 80) return 'text-emerald-600'
    if (value >= 60) return 'text-amber-600'
    return 'text-red-600'
  }

  const sendMessage = async () => {
    if (!input.trim() || !agent) return

    const userMessage = { role: 'user', content: input, timestamp: new Date() }
    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput('')
    setChatLoading(true)

    try {
      let contextData = null
      
      // Get DataHub context if enabled
      if (useDataHubContext) {
        setContextLoading(true)
        try {
          contextData = await DataHubContextService.getQueryContext(currentInput, {
            limit: 5
          })
          setDatahubContext(contextData)
          
          // Only add context message if there are actual datasets found
          const hasDatasets = contextData.hasContext && (
            (contextData.datasets && contextData.datasets.length > 0) ||
            (contextData.domainDatasets && contextData.domainDatasets.length > 0) ||
            (contextData.taggedDatasets && contextData.taggedDatasets.length > 0)
          );
          
          if (hasDatasets) {
            // Add context indicator message
            setMessages((prev) => [
              ...prev,
              {
                role: 'context',
                content: `🔍 DataHub Context: ${contextData.summary}`,
                timestamp: new Date(),
                context: contextData
              }
            ])
          }
        } catch (error) {
          console.warn('DataHub context error:', error)
          // Continue without context
        } finally {
          setContextLoading(false)
        }
      }

      // Call agent query endpoint with enhanced query
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
      const agentId = agent.id

      // Enhance query with DataHub context if available
      let enhancedQuery = currentInput
      if (contextData && contextData.hasContext) {
        const formattedContext = DataHubContextService.formatContextForAgent(contextData)
        if (formattedContext) {
          enhancedQuery = `${currentInput}\n\n[DataHub Context]\n${formattedContext}\n\nPlease use this dataset context to provide more specific and actionable responses.`
        }
      }

      const response = await fetch(`${apiBase}/agents/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: agentId,
          query: enhancedQuery,
          session_id: sessionId,
          datahub_context: contextData
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        const errorMsg = errorData.error || errorData.detail || `HTTP ${response.status}`
        
        // If backend is not available, provide helpful message
        if (response.status === 0 || response.status >= 500) {
          throw new Error(
            'Agent service is not available. Please ensure the server is running.'
          )
        }
        
        throw new Error(errorMsg)
      }

      const data = await response.json()

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response || 'No response received',
          timestamp: new Date(),
          metadata: {
            execution_time_ms: data.execution_time_ms,
            tool_calls: data.tool_calls,
            datahub_context_used: !!contextData?.hasContext,
            datasets_found: contextData?.hasContext ? 
              (contextData.datasets?.length || 0) + (contextData.domainDatasets?.length || 0) + (contextData.taggedDatasets?.length || 0) : 0
          },
        },
      ])

      toast({
        variant: 'default',
        title: 'Response Received',
        description: `Agent responded in ${data.execution_time_ms || 0}ms${contextData?.hasContext ? ' with DataHub context' : ''}`,
      })
    } catch (error) {
      console.error('Chat error:', error)

      setMessages((prev) => [
        ...prev,
        {
          role: 'error',
          content: error.message || 'Failed to get response from agent',
          timestamp: new Date(),
        },
      ])

      toast({
        variant: 'destructive',
        title: 'Chat Error',
        description: error.message || 'Failed to communicate with agent. Please try again.',
      })
    } finally {
      setChatLoading(false)
    }
  }

  if (agent === null) {
    return (
      <div className="h-full flex flex-col bg-slate-50">
        <div className="bg-white border-b border-slate-200 px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/agents')}
              className="h-8 w-8"
            >
              <IconChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>AI Agents</span>
              <span>›</span>
              <span className="text-slate-900 font-medium">Agent Not Found</span>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <IconRobot size={64} className="text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Agent Not Found</h2>
            <p className="text-slate-600 mb-6">
              The agent with ID "{id}" could not be found.
            </p>
            <Button onClick={() => navigate('/agents')} className="bg-blue-600 hover:bg-blue-700">
              Back to Agents
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <IconLoader size={48} className="text-slate-300 mx-auto mb-4 animate-spin" />
          <p className="text-slate-500">Loading agent...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/agents')}
            className="h-8 w-8"
          >
            <IconChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>AI Agents</span>
            <span>›</span>
            <span className="text-slate-900 font-medium">{agent.name}</span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold text-slate-900">{agent.name}</h2>
          </div>
          <p className="text-slate-600 text-sm mt-2">
            {agent.description || 'AI Agent for automated tasks and interactions'}
          </p>
          {agent.deploymentId && (
            <p className="text-slate-500 text-xs mt-1">
              Deployment ID: {agent.deploymentId} | Last Audit: {agent.lastAudit || 'N/A'} |
              Runtime: {agent.runtime || 'Local'}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              'px-1 py-4 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            )}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={cn(
              'px-1 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
              activeTab === 'chat'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            )}
          >
            <IconMessage size={18} />
            Chat with Agent
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {activeTab === 'overview' ? (
          <div className="grid grid-cols-3 gap-6 max-w-7xl">
            {/* Left Column - Trust Score & Datasets */}
            <div className="space-y-6">
              {/* Trust Score */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <IconShieldCheck className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-slate-900">Trust Score Breakdown</h3>
                </div>

                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-40 h-40">
                    <svg className="transform -rotate-90 w-40 h-40">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="#e2e8f0"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="#3b82f6"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 70}`}
                        strokeDashoffset={`${2 * Math.PI * 70 * (1 - agent.trustScore / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold text-slate-900">{agent.trustScore}</span>
                      <span className="text-xs text-slate-500 uppercase tracking-wider">
                        {agent.riskLevel === 'Critical' || agent.riskLevel === 'High'
                          ? 'High Risk'
                          : agent.riskLevel === 'Medium'
                            ? 'Medium Risk'
                            : 'Low Risk'}
                      </span>
                    </div>
                  </div>
                </div>

                {agent.metrics && (
                  <div className="space-y-3">
                    {Object.entries(agent.metrics).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-700 capitalize">{key} & Bias</span>
                          <span className={cn('text-sm font-bold', getMetricColor(value))}>
                            {value}/100
                          </span>
                        </div>
                        <Progress value={value} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Active Datasets */}
              {agent.datasets && agent.datasets.length > 0 && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <IconDatabase className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-slate-900">Active Datasets</h3>
                    </div>
                    <button className="text-sm text-blue-600 hover:text-blue-700">
                      View All Source Logs
                    </button>
                  </div>

                  <div className="space-y-3">
                    {agent.datasets.map((dataset, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200 text-xs mb-2"
                            >
                              {dataset.status}
                            </Badge>
                            <h4 className="font-medium text-slate-900 text-sm">{dataset.name}</h4>
                            <p className="text-xs text-slate-500 mt-1">
                              Last synced: {dataset.lastSynced}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600">
                          {dataset.records || dataset.chunks || dataset.drift}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column - Violations & Logs */}
            <div className="col-span-2 space-y-6">
              {/* Policy Violations */}
              {agent.violations && agent.violations.length > 0 && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <IconAlertTriangle className="w-5 h-5 text-red-600" />
                      <h3 className="font-semibold text-slate-900">Policy Violations</h3>
                    </div>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      {agent.violations.length} Active Flags
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {agent.violations.map((violation, idx) => (
                      <div key={idx} className="p-4 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                              {violation.severity === 'CRITICAL' ? '🔴' : '⚠️'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-slate-900">{violation.type}</h4>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    violation.severity === 'CRITICAL'
                                      ? 'bg-red-100 text-red-700 border-red-300'
                                      : 'bg-amber-100 text-amber-700 border-amber-300'
                                  )}
                                >
                                  {violation.severity}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-700">{violation.description}</p>
                              <p className="text-xs text-slate-500 mt-2">{violation.time}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" className="text-xs">
                            Review Logs
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs text-red-600 border-red-300 hover:bg-red-50"
                          >
                            Mute Thread
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Real-time Decision Log */}
              {agent.logs && agent.logs.length > 0 && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <IconActivity className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-slate-900">Real-time Decision Summary Log</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-xs text-slate-600">Live Stream</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-md p-4 font-mono text-sm overflow-auto max-h-80">
                    {agent.logs.map((log, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'mb-1',
                          log.type === 'VIOLATION' && 'text-red-400',
                          log.type === 'PASSED' && 'text-emerald-400',
                          log.type === 'POLICY' && 'text-amber-400',
                          log.type === 'CONTEXT' && 'text-cyan-400',
                          log.type === 'INBOUND' && 'text-blue-400'
                        )}
                      >
                        <span className="text-slate-500">{log.timestamp}</span>{' '}
                        <span className="font-semibold">{log.type}:</span>{' '}
                        <span className="text-slate-300">{log.message}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        ) : (
          /* Chat Interface - Full Width with Left Sidebar */
          <div className="flex gap-6 h-[calc(100vh-300px)]">
            {/* Contextual Sidebar - Left Side */}
            {sidebarOpen && (
              <aside className="w-72 flex-shrink-0 hidden lg:block">
                <Card className="h-full flex flex-col shadow-lg">
                  <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-slate-900">Agent Details</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarOpen(false)}
                        className="h-7 w-7"
                      >
                        <IconX size={16} />
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">Context and capabilities</p>
                  </div>

                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2 custom-scrollbar">
                    {/* Agent Capabilities - Direct Content */}
                    {agent.toolsEnabled && agent.toolsEnabled.length > 0 ? (
                      agent.toolsEnabled.map((tool, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                          <IconCode size={14} className="text-slate-400" />
                          <span className="text-xs text-slate-700">{tool}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">No specific tools configured</p>
                    )}
                    {agent.specializationPrompt && (
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <p className="text-xs font-medium text-slate-700 mb-1">Custom Prompt</p>
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {agent.specializationPrompt.substring(0, 100)}...
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </aside>
            )}

            {/* Main Chat Area - Full Width */}
            <div className="flex-1 min-w-0">
              <Card className="h-full flex flex-col shadow-lg">
                {/* Chat Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-white to-slate-50/50">
                  {!sidebarOpen && (
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarOpen(true)}
                      >
                        <IconMenu2 size={20} />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 mb-4 custom-scrollbar bg-gradient-to-b from-white via-slate-50/30 to-white">
                  {messages.length === 0 ? (
                    /* Enhanced Empty State */
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center max-w-2xl px-6">
                        <h3 className="text-2xl font-bold text-slate-900 mb-8">
                          Start a conversation with {agent.name}
                        </h3>
                        
                        {/* Suggested Prompts */}
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-slate-700 mb-4">Try asking:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {getSuggestedPrompts().slice(0, 4).map((prompt, idx) => (
                              <button
                                key={idx}
                                onClick={() => setInput(prompt)}
                                className="group relative p-4 text-left bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 hover:bg-blue-50/50"
                              >
                                <p className="text-sm text-slate-700 group-hover:text-slate-900 font-medium leading-relaxed">
                                  {prompt}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                  messages.map((message, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'flex gap-3 items-start',
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.role !== 'user' && (
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1',
                          message.role === 'context' 
                            ? 'bg-purple-100' 
                            : 'bg-blue-100'
                        )}>
                          {message.role === 'context' ? (
                            <IconBrain size={18} className="text-purple-600" />
                          ) : (
                            <IconRobot size={18} className="text-blue-600" />
                          )}
                        </div>
                      )}
                      <div
                        className={cn(
                          'rounded-xl px-5 py-4 max-w-[75%] shadow-sm transition-all hover:shadow-md',
                          message.role === 'user'
                            ? 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-900 border border-blue-200'
                            : message.role === 'error'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : message.role === 'context'
                                ? 'bg-purple-50 text-purple-900 border border-purple-200'
                                : 'bg-white text-slate-900 border border-slate-200'
                        )}
                      >
                        <div className={cn(
                          "text-sm markdown-content break-words",
                          message.role === 'user' ? 'text-blue-900' : 'text-slate-900'
                        )}>
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({node, children, ...props}) => (
                                <p className="my-2 leading-relaxed break-words" {...props}>
                                  {children}
                                </p>
                              ),
                              strong: ({node, children, ...props}) => (
                                <strong 
                                  className={cn(
                                    "font-semibold inline break-words",
                                    message.role === 'user' 
                                      ? 'text-blue-900' 
                                      : 'text-slate-900'
                                  )} 
                                  style={{ color: 'inherit' }}
                                  {...props}
                                >
                                  {children}
                                </strong>
                              ),
                              em: ({node, ...props}) => <em className="italic" {...props} />,
                              h1: ({node, ...props}) => <h1 className={cn("text-lg font-semibold mt-4 mb-2", message.role === 'user' ? 'text-blue-900' : 'text-slate-900')} {...props} />,
                              h2: ({node, ...props}) => <h2 className={cn("text-base font-semibold mt-3 mb-2", message.role === 'user' ? 'text-blue-900' : 'text-slate-900')} {...props} />,
                              h3: ({node, ...props}) => <h3 className={cn("text-sm font-semibold mt-3 mb-1", message.role === 'user' ? 'text-blue-900' : 'text-slate-900')} {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc list-outside my-2 space-y-2 ml-6 pl-2" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal list-outside my-2 space-y-2 ml-6 pl-2" {...props} />,
                              li: ({node, ...props}) => <li className="leading-relaxed pl-2" {...props} />,
                              code: ({node, inline, children, ...props}) => 
                                inline ? (
                                  <code className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                                    {children}
                                  </code>
                                ) : (
                                  <code className="block bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto text-xs font-mono my-2" {...props}>
                                    {children}
                                  </code>
                                ),
                              pre: ({node, children, ...props}) => (
                                <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto text-xs font-mono my-2" {...props}>
                                  {children}
                                </pre>
                              ),
                              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-slate-300 pl-4 my-2 italic text-slate-700" {...props} />,
                              a: ({node, ...props}) => <a className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer" {...props} />,
                              hr: ({node, ...props}) => <hr className="my-4 border-slate-200" {...props} />,
                              table: ({node, ...props}) => <table className="border-collapse border border-slate-300 my-2 w-full" {...props} />,
                              thead: ({node, ...props}) => <thead className="bg-slate-100" {...props} />,
                              tbody: ({node, ...props}) => <tbody {...props} />,
                              tr: ({node, ...props}) => <tr className="border-b border-slate-200" {...props} />,
                              th: ({node, ...props}) => <th className="border border-slate-300 px-3 py-2 text-left font-semibold" {...props} />,
                              td: ({node, ...props}) => <td className="border border-slate-300 px-3 py-2" {...props} />,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                        {/* Show actual data used from tool calls - Minimal Modern Design */}
                        {message.metadata?.tool_calls && message.metadata.tool_calls.length > 0 && (() => {
                          // Find tool calls that have data results
                          const dataToolCalls = message.metadata.tool_calls.filter(tc => 
                            tc.tool === 'query_local_collections' && 
                            tc.status === 'success' && 
                            tc.result?.collections
                          );
                          
                          if (dataToolCalls.length === 0) return null;
                          
                          // Helper function to extract key fields from a record
                          const extractRecordFields = (record) => {
                            const recordData = record.record || record.raw_record || record.raw_data || {};
                            const fields = {};
                            
                            if (recordData.transaction_id || recordData.id) {
                              fields.id = recordData.transaction_id || recordData.id;
                            }
                            if (recordData.customer || recordData.customer_name || recordData.name) {
                              fields.customer = recordData.customer || recordData.customer_name || recordData.name;
                            }
                            if (recordData.amount || recordData.price || recordData.total) {
                              fields.amount = recordData.amount || recordData.price || recordData.total;
                            }
                            if (recordData.timestamp || recordData.date || recordData.created_at) {
                              fields.timestamp = recordData.timestamp || recordData.date || recordData.created_at;
                            }
                            if (recordData.items || recordData.products || recordData.sku) {
                              fields.items = recordData.items || recordData.products || (recordData.sku ? [{sku: recordData.sku}] : []);
                            }
                            
                            return { fields, rawRecord: record };
                          };
                          
                          // Aggregate all collections from all tool calls
                          const allCollections = {};
                          let totalRecords = 0;
                          
                          dataToolCalls.forEach(toolCall => {
                            const collections = toolCall.result.collections;
                            Object.entries(collections).forEach(([key, data]) => {
                              if (!allCollections[key]) {
                                allCollections[key] = {
                                  source: data.source,
                                  entity_type: data.entity_type,
                                  record_count: data.record_count,
                                  records: []
                                };
                              }
                              if (data.records) {
                                allCollections[key].records.push(...data.records);
                              }
                              totalRecords += data.record_count || 0;
                            });
                          });
                          
                          const collectionCount = Object.keys(allCollections).length;
                          
                          return (
                            <div className="mt-2">
                              <details className="group">
                                <summary className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-900 text-xs py-1.5 px-2 rounded hover:bg-slate-50 transition-colors">
                                  <IconDatabase size={14} className="text-slate-400" />
                                  <span className="font-medium">Data Used</span>
                                  <span className="text-slate-400">•</span>
                                  <span className="text-slate-500">{totalRecords} record{totalRecords !== 1 ? 's' : ''}</span>
                                  {collectionCount > 1 && <span className="text-slate-400">• {collectionCount} collections</span>}
                                  <IconChevronDown size={12} className="ml-auto text-slate-400 group-open:hidden" />
                                  <IconChevronUp size={12} className="ml-auto text-slate-400 hidden group-open:block" />
                                </summary>
                                <div className="mt-2 space-y-2">
                                  {Object.entries(allCollections).map(([collectionKey, collectionData]) => (
                                    <div key={collectionKey} className="bg-slate-50/50 rounded border border-slate-200 overflow-hidden">
                                      {/* Compact Collection Header */}
                                      <div className="px-2.5 py-1.5 border-b border-slate-200 bg-white/50">
                                        <div className="flex items-center justify-between text-xs">
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium text-slate-700">{collectionData.source}</span>
                                            <span className="text-slate-400">/</span>
                                            <span className="text-slate-600">{collectionData.entity_type.replace(/_/g, ' ')}</span>
                                          </div>
                                          <span className="text-slate-500">{collectionData.record_count} records</span>
                                        </div>
                                      </div>
                                      
                                      {/* Compact Records List */}
                                      <div className="divide-y divide-slate-200">
                                        {collectionData.records && collectionData.records.length > 0 ? (
                                          collectionData.records.map((record, recordIndex) => {
                                            const { fields, rawRecord } = extractRecordFields(record);
                                            const hasKeyFields = Object.keys(fields).length > 0;
                                            
                                            return (
                                              <details key={recordIndex} className="group/record">
                                                <summary className="cursor-pointer px-2.5 py-2 hover:bg-slate-50/50 transition-colors">
                                                  <div className="flex items-center gap-3 text-xs">
                                                    {hasKeyFields ? (
                                                      <>
                                                        {fields.id && (
                                                          <span className="font-mono text-slate-500">{fields.id}</span>
                                                        )}
                                                        {fields.customer && (
                                                          <div className="flex items-center gap-1">
                                                            <IconUser size={12} className="text-slate-400" />
                                                            <span className="text-slate-700 font-medium">{fields.customer}</span>
                                                          </div>
                                                        )}
                                                        {fields.amount !== undefined && (
                                                          <div className="flex items-center gap-1">
                                                            <IconCurrencyDollar size={12} className="text-emerald-500" />
                                                            <span className="text-emerald-700 font-medium">
                                                              ${typeof fields.amount === 'number' ? fields.amount.toLocaleString() : fields.amount}
                                                            </span>
                                                          </div>
                                                        )}
                                                        {fields.timestamp && (
                                                          <div className="flex items-center gap-1 text-slate-500">
                                                            <IconCalendar size={11} className="text-slate-400" />
                                                            <span>{new Date(fields.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                          </div>
                                                        )}
                                                        {fields.items && fields.items.length > 0 && (
                                                          <div className="flex items-center gap-1 text-slate-500">
                                                            <IconShoppingCart size={11} className="text-slate-400" />
                                                            <span>{fields.items.length} item{fields.items.length !== 1 ? 's' : ''}</span>
                                                          </div>
                                                        )}
                                                      </>
                                                    ) : (
                                                      <span className="text-slate-600">Record {recordIndex + 1}</span>
                                                    )}
                                                    <IconChevronDown size={12} className="ml-auto text-slate-400 group-open/record:hidden" />
                                                    <IconChevronUp size={12} className="ml-auto text-slate-400 hidden group-open/record:block" />
                                                  </div>
                                                </summary>
                                                
                                                {/* Minimal Full Record Data */}
                                                <div className="px-2.5 py-2 bg-white border-t border-slate-100">
                                                  <pre className="text-[10px] text-slate-600 whitespace-pre-wrap overflow-x-auto font-mono leading-relaxed">
                                                    {JSON.stringify(rawRecord, null, 2)}
                                                  </pre>
                                                </div>
                                              </details>
                                            );
                                          })
                                        ) : (
                                          <div className="px-2.5 py-3 text-center text-xs text-slate-400">
                                            No records available
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            </div>
                          );
                        })()}
                        {/* Only show DataHub Context section if there are actual datasets */}
                        {message.context && (
                          (message.context.datasets?.length > 0 ||
                           message.context.domainDatasets?.length > 0 ||
                           message.context.taggedDatasets?.length > 0) && (
                            <div className="mt-3">
                              <details className="cursor-pointer">
                                <summary className="text-purple-700 hover:text-purple-900 font-medium text-sm">
                                  View DataHub Context ({message.context.keywords?.join(', ')})
                                </summary>
                                <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200 space-y-4">
                                  {/* Matching Datasets */}
                                  {message.context.datasets?.length > 0 && (
                                    <div>
                                      <h4 className="text-sm font-semibold text-purple-900 mb-2">Matching Datasets</h4>
                                      <div className="space-y-2">
                                        {message.context.datasets.map((dataset, i) => (
                                          <div key={i} className="bg-slate-50 rounded-lg p-3 border border-purple-100">
                                            <div className="flex items-start justify-between">
                                              <div className="flex-1">
                                                <h5 className="font-medium text-slate-900 text-sm">{dataset.name}</h5>
                                                {dataset.description && (
                                                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{dataset.description}</p>
                                                )}
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                  {dataset.platform && (
                                                    <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                                                      <IconBuilding size={10} className="mr-1" />
                                                      {dataset.platform}
                                                    </Badge>
                                                  )}
                                                  {dataset.tags && dataset.tags.length > 0 && (
                                                    dataset.tags.slice(0, 3).map((tag, j) => (
                                                      <Badge key={j} variant="outline" className="text-xs border-red-300 text-red-700">
                                                        <IconShield size={10} className="mr-1" />
                                                        {tag}
                                                      </Badge>
                                                    ))
                                                  )}
                                                </div>
                                              </div>
                                              {dataset.urn && (
                                                <IconExternalLink size={14} className="text-purple-600 cursor-pointer hover:text-purple-800 ml-2 flex-shrink-0" />
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Domain Datasets */}
                                  {message.context.domainDatasets?.length > 0 && (
                                    <div>
                                      <h4 className="text-sm font-semibold text-purple-900 mb-2">Domain-Specific Datasets</h4>
                                      <div className="space-y-2">
                                        {message.context.domainDatasets.map((dataset, i) => (
                                          <div key={i} className="bg-slate-50 rounded-lg p-3 border border-purple-100">
                                            <div className="flex items-start justify-between">
                                              <div className="flex-1">
                                                <h5 className="font-medium text-slate-900 text-sm">{dataset.name}</h5>
                                                {dataset.description && (
                                                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{dataset.description}</p>
                                                )}
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                  {dataset.domain && (
                                                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                                                      <IconTag size={10} className="mr-1" />
                                                      {dataset.domain}
                                                    </Badge>
                                                  )}
                                                  {dataset.platform && (
                                                    <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                                                      <IconBuilding size={10} className="mr-1" />
                                                      {dataset.platform}
                                                    </Badge>
                                                  )}
                                                </div>
                                              </div>
                                              {dataset.urn && (
                                                <IconExternalLink size={14} className="text-purple-600 cursor-pointer hover:text-purple-800 ml-2 flex-shrink-0" />
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Tagged Datasets */}
                                  {message.context.taggedDatasets?.length > 0 && (
                                    <div>
                                      <h4 className="text-sm font-semibold text-purple-900 mb-2">Tagged Datasets</h4>
                                      <div className="space-y-2">
                                        {message.context.taggedDatasets.map((dataset, i) => (
                                          <div key={i} className="bg-slate-50 rounded-lg p-3 border border-purple-100">
                                            <div className="flex items-start justify-between">
                                              <div className="flex-1">
                                                <h5 className="font-medium text-slate-900 text-sm">{dataset.name}</h5>
                                                {dataset.description && (
                                                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{dataset.description}</p>
                                                )}
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                  {dataset.tags && dataset.tags.length > 0 && (
                                                    dataset.tags.slice(0, 5).map((tag, j) => (
                                                      <Badge key={j} variant="outline" className="text-xs border-red-300 text-red-700">
                                                        <IconShield size={10} className="mr-1" />
                                                        {tag}
                                                      </Badge>
                                                    ))
                                                  )}
                                                  {dataset.platform && (
                                                    <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                                                      <IconBuilding size={10} className="mr-1" />
                                                      {dataset.platform}
                                                    </Badge>
                                                  )}
                                                </div>
                                              </div>
                                              {dataset.urn && (
                                                <IconExternalLink size={14} className="text-purple-600 cursor-pointer hover:text-purple-800 ml-2 flex-shrink-0" />
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </details>
                            </div>
                          )
                        )}
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-xs font-semibold text-slate-700">U</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <IconRobot size={18} className="text-blue-600" />
                    </div>
                    <div className="bg-slate-100 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2">
                        <IconLoader size={16} className="animate-spin text-blue-600" />
                        <span className="text-sm text-slate-600">Agent is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                {contextLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <IconBrain size={18} className="text-purple-600" />
                    </div>
                    <div className="bg-purple-50 rounded-lg px-4 py-3 border border-purple-200">
                      <div className="flex items-center gap-2">
                        <IconLoader size={16} className="animate-spin text-purple-600" />
                        <span className="text-sm text-purple-700">Gathering DataHub context...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

                {/* Enhanced Input Area */}
                <div className="px-6 py-4 border-t border-slate-200 bg-white">
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Ask Anything"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage()
                          }
                        }}
                        disabled={chatLoading || contextLoading}
                        className="h-12 pr-12 text-base border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                      {input.length > 0 && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                          {input.length}
                        </span>
                      )}
                    </div>
                    <Button
                      onClick={sendMessage}
                      disabled={chatLoading || contextLoading || !input.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 shadow-md hover:shadow-lg transition-all"
                    >
                      {chatLoading || contextLoading ? (
                        <IconLoader size={20} className="animate-spin" />
                      ) : (
                        <IconSend size={20} />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
