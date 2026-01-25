import { useState, useEffect } from 'react'
import {
  IconShieldCheck,
  IconAlertCircle,
  IconPlus,
  IconCheck,
  IconLoader,
  IconFileText,
} from '@tabler/icons-react'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import { Button } from '../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { useToast } from '../hooks/use-toast'


// Helper function to get a date in the past
const getPastDate = (daysAgo) => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString().split('T')[0]
}

// Default mock policies with realistic dates and varied values
const defaultPolicies = [
  {
    id: 1,
    name: 'Data Privacy Policy v2.1',
    category: 'Privacy',
    status: 'active',
    appliedTo: 42,
    violations: 3,
    lastUpdated: getPastDate(10), // 10 days ago
    severity: 'Critical',
  },
  {
    id: 2,
    name: 'Resource Usage Policy',
    category: 'Performance',
    status: 'active',
    appliedTo: 38,
    violations: 1,
    lastUpdated: getPastDate(15), // 15 days ago
    severity: 'Medium',
  },
  {
    id: 3,
    name: 'PII Protection Policy',
    category: 'Security',
    status: 'active',
    appliedTo: 56,
    violations: 2,
    lastUpdated: getPastDate(5), // 5 days ago
    severity: 'Critical',
  },
  {
    id: 4,
    name: 'Model Quality Standards',
    category: 'Quality',
    status: 'active',
    appliedTo: 24,
    violations: 1,
    lastUpdated: getPastDate(7), // 7 days ago
    severity: 'Medium',
  },
  {
    id: 5,
    name: 'Security Protocols v3.0',
    category: 'Security',
    status: 'active',
    appliedTo: 67,
    violations: 0,
    lastUpdated: getPastDate(3), // 3 days ago
    severity: 'High',
  },
]

export default function Policies() {
  const [policies, setPolicies] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Clean up and fix policy data
  const cleanupPolicyData = (policiesData) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const cleaned = policiesData.map((policy, index) => {
      const cleanedPolicy = { ...policy }
      
      // Fix future dates - set to past dates with variation
      const lastUpdated = new Date(cleanedPolicy.lastUpdated)
      if (isNaN(lastUpdated.getTime()) || lastUpdated > today) {
        // Set to a date in the past (3-20 days ago)
        const daysAgo = 3 + (index % 18)
        const fixedDate = new Date(today)
        fixedDate.setDate(fixedDate.getDate() - daysAgo)
        cleanedPolicy.lastUpdated = fixedDate.toISOString().split('T')[0]
      }
      
      return cleanedPolicy
    })
    
    // Fix duplicate appliedTo values in a second pass
    const appliedToSet = new Set()
    return cleaned.map((policy, index) => {
      let appliedTo = policy.appliedTo
      
      // If duplicate, find a unique value
      if (appliedToSet.has(appliedTo)) {
        // Try to find a unique value nearby
        let attempts = 0
        while (appliedToSet.has(appliedTo) && attempts < 50) {
          const variation = (index % 10) - 5 // -5 to +4
          appliedTo = Math.max(20, Math.min(75, policy.appliedTo + variation + attempts))
          attempts++
        }
      }
      
      appliedToSet.add(appliedTo)
      return { ...policy, appliedTo }
    })
  }

  // Fetch policies from backend API on mount
  useEffect(() => {
    fetchPolicies()
  }, [])

  const fetchPolicies = async () => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
      const response = await fetch(`${apiBase}/policies`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch policies: ${response.status}`)
      }

      const data = await response.json()
      
      // Fetch violation counts for each policy
      const violationsResponse = await fetch(`${apiBase}/violations?limit=1000`).catch(() => null)
      let violationsByPolicy = {}
      if (violationsResponse?.ok) {
        const violations = await violationsResponse.json()
        violations.forEach(v => {
          if (v.policy_id) {
            violationsByPolicy[v.policy_id] = (violationsByPolicy[v.policy_id] || 0) + 1
          }
        })
      }
      
      // Transform backend format to frontend format
      const transformedPolicies = data.map(policy => ({
        id: policy.id,
        name: policy.name,
        category: policy.category,
        status: policy.status,
        violations: violationsByPolicy[policy.id] || 0,
        lastUpdated: policy.updated_at || policy.created_at,
        severity: policy.severity,
        description: policy.description
      }))
      
      setPolicies(transformedPolicies)
    } catch (error) {
      console.error('Error fetching policies:', error)
      toast({
        variant: 'destructive',
        title: 'Failed to Load Policies',
        description: 'Could not fetch policies from server. Using default data.',
      })
      // Fallback to default policies
      setPolicies(defaultPolicies)
    }
  }

  const getSeverityColor = (severity) => {
    const colors = {
      Low: 'bg-emerald-50 text-emerald-700',
      Medium: 'bg-amber-50 text-amber-700',
      High: 'bg-red-50 text-red-700',
      Critical: 'bg-red-600 text-white',
    }
    return colors[severity] || colors.Low
  }

  const handleCreatePolicy = async () => {
    if (!description.trim()) {
      toast({
        variant: 'destructive',
        title: 'Description Required',
        description: 'Please provide a description of the policy.',
      })
      return
    }

    setIsLoading(true)
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'

      // First, use AI to generate policy metadata
      const createResponse = await fetch(`${apiBase}/policies/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: description.trim() }),
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(errorData.detail || `HTTP ${createResponse.status}`)
      }

      const aiData = await createResponse.json()

      // Then create the policy in backend database
      const response = await fetch(`${apiBase}/policies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: aiData.policy_name,
          description: description.trim(),
          category: aiData.category,
          severity: aiData.severity,
          status: 'active'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(errorData.detail || `HTTP ${response.status}`)
      }

      const newPolicy = await response.json()

      // Refresh policies list
      await fetchPolicies()

      setDescription('')
      setIsDialogOpen(false)

      toast({
        variant: 'default',
        title: 'Policy Created',
        description: `Successfully created "${newPolicy.name}"`,
      })
    } catch (error) {
      console.error('Error creating policy:', error)
      toast({
        variant: 'destructive',
        title: 'Creation Failed',
        description: error.message || 'Failed to create policy. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const columns = [
    {
      header: 'Policy Name',
      accessor: 'name',
      width: '280px',
      nowrap: false,
      render: (row) => (
        <div className="flex items-center gap-3 group min-w-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-200 shadow-sm flex-shrink-0">
            <IconShieldCheck size={22} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
              {row.name}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{row.category}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Severity',
      accessor: 'severity',
      width: '140px',
      nowrap: true,
      render: (row) => (
        <div className="flex-shrink-0">
          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap ${getSeverityColor(
              row.severity
            )}`}
          >
            {row.severity}
          </span>
        </div>
      ),
    },
    {
      header: 'Violations',
      accessor: 'violations',
      width: '140px',
      nowrap: false,
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.violations > 0 ? (
            <>
              <IconAlertCircle size={16} className="text-red-600 flex-shrink-0" />
              <span className="text-sm font-bold text-red-600">{row.violations}</span>
            </>
          ) : (
            <>
              <IconShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
              <span className="text-sm text-emerald-600">None</span>
            </>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      width: '100px',
      nowrap: true,
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      header: 'Last Updated',
      accessor: 'lastUpdated',
      width: '150px',
      nowrap: true,
      render: (row) => {
        // Ensure date is valid and not in future
        const date = new Date(row.lastUpdated)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        // If date is invalid or in future, show "Today"
        if (isNaN(date.getTime()) || date > today) {
          return (
            <span className="text-sm text-slate-600 whitespace-nowrap">
              {today.toLocaleDateString()}
            </span>
          )
        }
        
        // Format date properly
        return (
          <span className="text-sm text-slate-600 whitespace-nowrap">
            {date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            })}
          </span>
        )
      },
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Policy & Governance Engine
            </h1>
            <p className="text-slate-600">
              Define, manage, and enforce governance policies across your AI ecosystem
            </p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 h-11 px-6"
            size="lg"
          >
            <IconPlus size={20} />
            Create New Policy
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                <IconShieldCheck size={24} className="text-blue-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Total Policies</p>
            <p className="text-3xl font-bold text-slate-900">{policies.length}</p>
            <p className="text-xs text-slate-500 mt-2">Active policies</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                <IconShieldCheck size={24} className="text-emerald-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Active</p>
            <p className="text-3xl font-bold text-slate-900">
              {policies.filter((p) => p.status === 'active').length}
            </p>
            <p className="text-xs text-slate-500 mt-2">Currently enforced</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                <IconAlertCircle size={24} className="text-red-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Total Violations</p>
            <p className="text-3xl font-bold text-slate-900">
              {policies.reduce((sum, p) => sum + (p.violations || 0), 0)}
            </p>
            <p className="text-xs text-slate-500 mt-2">Require attention</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-purple-50 group-hover:bg-purple-100 flex items-center justify-center transition-colors">
                <IconShieldCheck size={24} className="text-purple-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Coverage</p>
            <p className="text-3xl font-bold text-slate-900">98.5%</p>
            <p className="text-xs text-slate-500 mt-2">AI agents covered</p>
          </div>
        </div>

        {/* Policies Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <DataTable columns={columns} data={policies} />
        </div>

        {/* Policy Categories */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Policy Categories Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-2">Privacy</p>
              <p className="text-3xl font-bold text-blue-900">
                {policies.filter((p) => p.category === 'Privacy').length}
              </p>
              <p className="text-xs text-blue-700 mt-2">
                {policies
                  .filter((p) => p.category === 'Privacy')
                  .reduce((sum, p) => sum + (p.violations || 0), 0)}{' '}
                violations
              </p>
            </div>
            <div className="p-5 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
              <p className="text-sm font-medium text-red-900 mb-2">Security</p>
              <p className="text-3xl font-bold text-red-900">
                {policies.filter((p) => p.category === 'Security').length}
              </p>
              <p className="text-xs text-red-700 mt-2">
                {policies
                  .filter((p) => p.category === 'Security')
                  .reduce((sum, p) => sum + (p.violations || 0), 0)}{' '}
                violations
              </p>
            </div>
            <div className="p-5 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
              <p className="text-sm font-medium text-amber-900 mb-2">Performance</p>
              <p className="text-3xl font-bold text-amber-900">
                {policies.filter((p) => p.category === 'Performance').length}
              </p>
              <p className="text-xs text-amber-700 mt-2">
                {policies
                  .filter((p) => p.category === 'Performance')
                  .reduce((sum, p) => sum + (p.violations || 0), 0)}{' '}
                violations
              </p>
            </div>
            <div className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
              <p className="text-sm font-medium text-emerald-900 mb-2">Quality</p>
              <p className="text-3xl font-bold text-emerald-900">
                {policies.filter((p) => p.category === 'Quality').length}
              </p>
              <p className="text-xs text-emerald-700 mt-2">
                {policies
                  .filter((p) => p.category === 'Quality')
                  .reduce((sum, p) => sum + (p.violations || 0), 0)}{' '}
                violations
              </p>
            </div>
          </div>
        </div>

        {/* Create Policy Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle className="text-2xl">Create New Policy</DialogTitle>
              <DialogDescription className="text-base">
                Describe your policy and our AI will automatically generate structured metadata
                including category, severity, and enforcement details.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Policy Description *</label>
                <textarea
                  className="flex min-h-[200px] w-full rounded-md border border-slate-300 bg-transparent px-4 py-3 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  placeholder="e.g., A policy that ensures all customer data is encrypted at rest and in transit, requires multi-factor authentication for access, and automatically redacts PII before any AI model training. This policy applies to all customer-facing AI agents and must comply with GDPR and CCPA regulations..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-slate-500">
                  Provide a detailed description of your policy. The AI will analyze it and generate
                  category, severity, and other metadata automatically.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false)
                  setDescription('')
                }}
                disabled={isLoading}
                className="border-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePolicy}
                disabled={isLoading || !description.trim()}
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
                    Create Policy
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
