import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
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
  const { toast } = useToast()

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
          
          if (contextData.hasContext) {
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

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-slate-900">{agent.name}</h2>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                {agent.status}
              </Badge>
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
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <IconDownload className="w-4 h-4" />
              Export Report
            </Button>
            <Button variant="outline" className="gap-2">
              <IconRefresh className="w-4 h-4" />
              Re-evaluate
            </Button>
            <Button className="bg-[#1E40AF] hover:bg-[#1e3a8a]">Take Action</Button>
          </div>
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
          /* Chat Interface */
          <div className="max-w-4xl mx-auto">
            <Card className="p-6 h-[calc(100vh-300px)] flex flex-col">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <IconRobot size={24} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Chat with {agent.name}</h3>
                  <p className="text-xs text-slate-500">
                    {agent.specializationPrompt
                      ? 'Agent is configured with custom system prompt'
                      : 'Using default agent behavior'}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <IconMessage size={48} className="text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-600 mb-2">Start a conversation with {agent.name}</p>
                      <p className="text-sm text-slate-500">
                        Ask questions or give instructions to interact with the agent
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((message, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'flex gap-3',
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.role !== 'user' && (
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
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
                          'rounded-lg px-4 py-3 max-w-[80%]',
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : message.role === 'error'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : message.role === 'context'
                                ? 'bg-purple-50 text-purple-900 border border-purple-200'
                                : 'bg-slate-100 text-slate-900'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.metadata && (
                          <p className="text-xs mt-2 opacity-70">
                            {message.metadata.execution_time_ms}ms
                            {message.metadata.tool_calls &&
                              message.metadata.tool_calls.length > 0 &&
                              ` • ${message.metadata.tool_calls.length} tool calls`}
                            {message.metadata.datahub_context_used &&
                              ` • DataHub context (${message.metadata.datasets_found} datasets)`}
                          </p>
                        )}
                        {message.context && (
                          <div className="mt-2 text-xs">
                            <details className="cursor-pointer">
                              <summary className="text-purple-700 hover:text-purple-900">
                                View DataHub Context ({message.context.keywords?.join(', ')})
                              </summary>
                              <div className="mt-2 p-2 bg-white rounded border">
                                {message.context.datasets?.length > 0 && (
                                  <div className="mb-2">
                                    <strong>Matching Datasets:</strong>
                                    <ul className="list-disc list-inside ml-2">
                                      {message.context.datasets.slice(0, 3).map((dataset, i) => (
                                        <li key={i}>{dataset.name}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {message.context.domainDatasets?.length > 0 && (
                                  <div className="mb-2">
                                    <strong>Domain Datasets:</strong>
                                    <ul className="list-disc list-inside ml-2">
                                      {message.context.domainDatasets.slice(0, 3).map((dataset, i) => (
                                        <li key={i}>{dataset.name}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
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

              {/* DataHub Context Toggle */}
              <div className="flex items-center justify-between py-3 border-t border-slate-200">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useDataHubContext}
                      onChange={(e) => setUseDataHubContext(e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <div className="flex items-center gap-2 text-sm">
                      <IconDatabase size={16} className="text-purple-600" />
                      <span className="text-slate-700">Use DataHub Context</span>
                    </div>
                  </label>
                  <Badge variant="outline" className="text-xs">
                    Port 9002
                  </Badge>
                </div>
                {datahubContext && datahubContext.hasContext && (
                  <div className="text-xs text-slate-500">
                    {datahubContext.summary}
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="flex gap-2 pt-2">
                <Input
                  placeholder={`Type your message...${useDataHubContext ? ' (DataHub context will be included)' : ''}`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  disabled={chatLoading || contextLoading}
                  className="flex-1 h-11"
                />
                <Button
                  onClick={sendMessage}
                  disabled={chatLoading || contextLoading || !input.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-6"
                >
                  {chatLoading || contextLoading ? (
                    <IconLoader size={18} className="animate-spin" />
                  ) : (
                    <IconSend size={18} />
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
