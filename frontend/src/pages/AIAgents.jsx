import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconSearch,
  IconPlus,
  IconFilter,
  IconRefresh,
  IconCircleCheck,
  IconAlertTriangle,
  IconClock,
  IconRobot,
  IconLoader,
  IconCheck,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'

const STORAGE_KEY = 'agents_data'

// Default mock agents
const defaultAgents = [
  {
    id: 'AGT-8821',
    name: 'ClaimsProcessor_v4',
    owner: 'Ops Team',
    status: 'Active',
    riskLevel: 'Low',
    datasets: ['Claims_2023', 'PII_Data'],
    trustScore: 98,
  },
  {
    id: 'AGT-9004',
    name: 'CustomerService_L1',
    owner: 'Support',
    status: 'Active',
    riskLevel: 'Medium',
    datasets: ['Chat_Logs_Enc'],
    trustScore: 85,
  },
  {
    id: 'AGT-3102',
    name: 'FraudDetection_Beta',
    owner: 'SecOps',
    status: 'Idle',
    riskLevel: 'Critical',
    datasets: ['Tx_Ledger'],
    trustScore: 42,
  },
  {
    id: 'AGT-3329',
    name: 'MarketAnalyst_Pro',
    owner: 'Marketing',
    status: 'Active',
    riskLevel: 'Low',
    datasets: ['Public_Web'],
    trustScore: 92,
  },
  {
    id: 'AGT-5511',
    name: 'HR_Onboarding_Bot',
    owner: 'People Ops',
    status: 'Active',
    riskLevel: 'Medium',
    datasets: ['Emp_Records'],
    trustScore: 78,
  },
]

export default function AIAgents() {
  const navigate = useNavigate()
  // Lazy initialization: load from localStorage synchronously
  const [agents, setAgents] = useState(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Only return if valid array with data
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch (error) {
      console.error('Error loading agents from localStorage:', error)
    }
    // Return empty array, not defaultAgents
    return []
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [agentName, setAgentName] = useState('')
  const [agentDescription, setAgentDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()

  // Save to localStorage whenever agents change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(agents))
    }
  }, [agents])

  // Filter agents based on search
  const filteredAgents = agents.filter((agent) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      agent.name.toLowerCase().includes(query) ||
      agent.id.toLowerCase().includes(query) ||
      agent.owner.toLowerCase().includes(query)
    )
  })

  const handleCreateAgent = async () => {
    if (!agentName.trim() || !agentDescription.trim()) {
      toast({
        variant: 'destructive',
        title: 'Fields Required',
        description: 'Please provide both agent name and description.',
      })
      return
    }

    setIsLoading(true)
    try {
      // Step 1: Generate agent metadata using Gemini (Node.js endpoint)
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'

      const metadataResponse = await fetch(`${apiBase}/agents/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: agentName.trim(),
          description: agentDescription.trim(),
        }),
      })

      if (!metadataResponse.ok) {
        const errorData = await metadataResponse.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(errorData.error || errorData.detail || `HTTP ${metadataResponse.status}`)
      }

      const metadata = await metadataResponse.json()

      // Step 2: Agent is already created in Node.js server with LangChain JS
      // The metadata response includes the agent ID
      const agentId = metadata.id || `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Step 3: Create local agent entry with all metadata
      const newAgent = {
        id: agentId,
        name: metadata.agent_name,
        owner: metadata.owner,
        status: 'Active',
        riskLevel: metadata.risk_level.charAt(0).toUpperCase() + metadata.risk_level.slice(1),
        datasets: [],
        trustScore: metadata.risk_level === 'critical' ? 45 : metadata.risk_level === 'high' ? 65 : 85,
        description: metadata.description,
        agentType: metadata.agent_type,
        specializationPrompt: metadata.specialization_prompt, // Store the generated prompt
        toolsEnabled: metadata.tools_enabled || [],
      }

      // Step 4: Send metadata to server for storage and agent recreation
      try {
        await fetch(`${apiBase}/agents/${agentId}/metadata`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newAgent),
        })
      } catch (metadataError) {
        console.warn('Failed to store agent metadata on server:', metadataError)
        // Continue anyway - agent will be recreated on query if needed
      }

      // Step 5: Update state and explicitly save to localStorage immediately
      const updatedAgents = [...agents, newAgent]
      setAgents(updatedAgents)
      
      // Explicitly save to localStorage immediately before navigation
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAgents))
        } catch (storageError) {
          console.error('Error saving agent to localStorage:', storageError)
        }
      }

      setAgentName('')
      setAgentDescription('')
      setIsDialogOpen(false)

      toast({
        variant: 'default',
        title: 'Agent Created',
        description: `Successfully created "${metadata.agent_name}"`,
      })

      // Navigate to agent detail page after localStorage save is complete
      navigate(`/agents/${newAgent.id}`, { state: { agent: newAgent } })
    } catch (error) {
      console.error('Error creating agent:', error)
      toast({
        variant: 'destructive',
        title: 'Creation Failed',
        description: error.message || 'Failed to create agent. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getRiskColor = (riskLevel) => {
    const colors = {
      Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Medium: 'bg-amber-50 text-amber-700 border-amber-200',
      High: 'bg-red-50 text-red-700 border-red-200',
      Critical: 'bg-red-600 text-white border-red-700',
    }
    return colors[riskLevel] || colors.Low
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">AI Agents Inventory</h1>
            <p className="text-slate-600">
              Track compliance status, trust scores, and activity logs across your AI ecosystem
            </p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 h-11 px-6"
            size="lg"
          >
            <IconPlus size={20} />
            Onboard New Agent
          </Button>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search by agent name, ID, or owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <Button variant="outline" size="lg" className="border-slate-300">
              <IconFilter className="w-4 h-4" />
              Filter
            </Button>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Showing <span className="font-semibold text-slate-900">{filteredAgents.length}</span> of{' '}
            <span className="font-semibold text-slate-900">{agents.length}</span> agents
          </p>
        </div>

        {/* Agents Table */}
        {filteredAgents.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-xs font-semibold uppercase">Agent Name</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">Owner</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">Risk Level</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">Trust Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.map((agent) => (
                  <TableRow
                    key={agent.id}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => navigate(`/agents/${agent.id}`, { state: { agent } })}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                          <IconRobot size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{agent.name}</div>
                          <div className="text-xs text-slate-500">ID: {agent.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-700">{agent.owner}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {agent.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${getRiskColor(agent.riskLevel)} border`}
                      >
                        {agent.riskLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Progress value={agent.trustScore} className="h-2 flex-1" />
                        <span className="text-sm font-bold text-slate-900 min-w-[40px] text-right">
                          {agent.trustScore}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-16 text-center border border-slate-200">
            <IconRobot size={48} className="text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-semibold text-slate-900 mb-2">No agents found</p>
            <p className="text-slate-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search to see more results.'
                : 'Get started by onboarding your first AI agent.'}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <IconPlus size={18} />
                Onboard Agent
              </Button>
            )}
          </div>
        )}

        {/* Create Agent Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle className="text-2xl">Onboard New AI Agent</DialogTitle>
              <DialogDescription className="text-base">
                Provide the agent name and description. Our AI will automatically generate the agent
                configuration, system prompt, and metadata using LangChain.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Agent Name *</label>
                <Input
                  placeholder="e.g., Customer Support Agent, Data Analyst Bot, Compliance Checker"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  disabled={isLoading}
                  className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500">
                  Choose a clear, descriptive name for your AI agent
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Agent Description *</label>
                <textarea
                  className="flex min-h-[200px] w-full rounded-md border border-slate-300 bg-transparent px-4 py-3 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  placeholder="e.g., An AI agent that helps customer support representatives by answering common questions, looking up order information, processing refunds, and escalating complex issues. The agent should be friendly, professional, and always verify customer identity before sharing sensitive information. It should have access to customer databases, order systems, and knowledge bases..."
                  value={agentDescription}
                  onChange={(e) => setAgentDescription(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-slate-500">
                  Provide a detailed description of what the agent should do, its capabilities, behavior,
                  and any specific requirements. The AI will generate a comprehensive system prompt and
                  configuration based on this.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false)
                  setAgentName('')
                  setAgentDescription('')
                }}
                disabled={isLoading}
                className="border-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateAgent}
                disabled={isLoading || !agentName.trim() || !agentDescription.trim()}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
              >
                {isLoading ? (
                  <>
                    <IconLoader size={18} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <IconCheck size={18} />
                    Create Agent
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
