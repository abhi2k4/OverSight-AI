import { useState, useEffect } from 'react'
import { 
  IconAlertTriangle, 
  IconAlertCircle, 
  IconInfoCircle, 
  IconRefresh, 
  IconLoader,
  IconShieldCheck,
  IconTrendingDown,
  IconTrendingUp
} from '@tabler/icons-react'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import { useAlertsStore } from '../store/alertsStore'
import { Button } from '../components/ui/button'
import { cn } from '@/lib/utils'

export default function Alerts() {
  const { alerts, isLoading, filterSeverity, filterStatus, setFilterSeverity, setFilterStatus, fetchAlerts } =
    useAlertsStore()

  useEffect(() => {
    fetchAlerts()
    // Refresh every 30 seconds
    const interval = setInterval(fetchAlerts, 30000)
    return () => clearInterval(interval)
  }, [fetchAlerts])

  const filteredAlerts = alerts.filter((alert) => {
    if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false
    if (filterStatus !== 'all' && alert.status !== filterStatus) return false
    return true
  })

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <IconAlertCircle size={20} className="text-red-600" />
      case 'warning':
        return <IconAlertTriangle size={20} className="text-amber-600" />
      default:
        return <IconInfoCircle size={20} className="text-[#1E40AF]" />
    }
  }

  const columns = [
    {
      header: 'Severity',
      accessor: 'severity',
      render: (row) => (
        <div className="flex items-center gap-2">
          {getSeverityIcon(row.severity)}
          <StatusBadge status={row.severity} size="sm" />
        </div>
      ),
    },
    {
      header: 'Alert Details',
      accessor: 'title',
      render: (row) => (
        <div>
          <p className="font-medium text-text-primary mb-1">{row.title}</p>
          <p className="text-sm text-text-secondary">{row.description}</p>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs text-text-tertiary">Agent: {row.agent}</span>
            <span className="text-xs text-text-tertiary">Policy: {row.policy}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Impact',
      accessor: 'impact',
      render: (row) => (
        <span className="text-sm text-text-secondary">{row.impact}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      header: 'Time',
      accessor: 'timestamp',
      render: (row) => (
        <div className="text-sm text-text-secondary">
          <p>{new Date(row.timestamp).toLocaleDateString()}</p>
          <p className="text-xs text-text-tertiary">
            {new Date(row.timestamp).toLocaleTimeString()}
          </p>
        </div>
      ),
    },
  ]

  const severityOptions = [
    { value: 'all', label: 'All Severities' },
    { value: 'critical', label: 'Critical' },
    { value: 'warning', label: 'Warning' },
    { value: 'info', label: 'Info' },
  ]

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'investigating', label: 'Investigating' },
    { value: 'acknowledged', label: 'Acknowledged' },
    { value: 'resolved', label: 'Resolved' },
  ]

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length
  const warningCount = alerts.filter((a) => a.severity === 'warning').length
  const activeCount = alerts.filter((a) => a.status === 'active').length
  const resolvedCount = alerts.filter((a) => a.status === 'resolved').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-slate-600">
          <span className="hover:text-slate-900 cursor-pointer">Governance</span>
          <span>/</span>
          <span className="text-slate-900 font-medium">Alerts</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Alerts & Violations Center
            </h1>
            <p className="text-slate-600">
              Monitor, investigate, and resolve compliance alerts and policy violations across your AI ecosystem
            </p>
          </div>
          <Button
            onClick={fetchAlerts}
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-2 border-slate-300 hover:bg-slate-50 h-11 px-6"
          >
            {isLoading ? (
              <>
                <IconLoader size={18} className="animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <IconRefresh size={18} />
                Refresh
              </>
            )}
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                <IconAlertCircle size={24} className="text-red-600" />
              </div>
              <IconTrendingUp size={16} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-slate-600 text-sm font-medium mb-1">Critical</p>
            <p className="text-3xl font-bold text-slate-900">
              {criticalCount}
            </p>
            <p className="text-xs text-slate-500 mt-2">Requires immediate attention</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                <IconAlertTriangle size={24} className="text-amber-600" />
              </div>
              <IconTrendingUp size={16} className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-slate-600 text-sm font-medium mb-1">Warnings</p>
            <p className="text-3xl font-bold text-slate-900">
              {warningCount}
            </p>
            <p className="text-xs text-slate-500 mt-2">Needs review</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <IconInfoCircle size={24} className="text-blue-600" />
              </div>
              <IconTrendingDown size={16} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-slate-600 text-sm font-medium mb-1">Active</p>
            <p className="text-3xl font-bold text-slate-900">
              {activeCount}
            </p>
            <p className="text-xs text-slate-500 mt-2">Currently open</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                <IconShieldCheck size={24} className="text-emerald-600" />
              </div>
              <IconTrendingUp size={16} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-slate-600 text-sm font-medium mb-1">Resolved</p>
            <p className="text-3xl font-bold text-slate-900">
              {resolvedCount}
            </p>
            <p className="text-xs text-slate-500 mt-2">Successfully closed</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
                Filter by Severity
              </label>
              <div className="flex gap-2 flex-wrap">
                {severityOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilterSeverity(option.value)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      filterSeverity === option.value
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/25'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:shadow-sm'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
                Filter by Status
              </label>
              <div className="flex gap-2 flex-wrap">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilterStatus(option.value)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      filterStatus === option.value
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/25'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:shadow-sm'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Table */}
        {isLoading && alerts.length === 0 ? (
          <div className="bg-white rounded-xl p-16 text-center shadow-sm border border-slate-200">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <IconLoader size={32} className="text-slate-400 animate-spin" />
              </div>
              <p className="text-slate-600 font-medium">Loading violations...</p>
              <p className="text-sm text-slate-500 mt-1">Please wait while we fetch the latest alerts</p>
            </div>
          </div>
        ) : filteredAlerts.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <DataTable columns={columns} data={filteredAlerts} />
          </div>
        ) : (
          <div className="bg-white rounded-xl p-16 text-center shadow-sm border border-slate-200">
            <div className="flex flex-col items-center justify-center max-w-md mx-auto">
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
                <IconShieldCheck size={40} className="text-emerald-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No violations found</h3>
              <p className="text-slate-600 leading-relaxed">
                All agents are currently compliant with policies and regulations. Your AI ecosystem is operating within governance guidelines.
              </p>
              <div className="mt-6 pt-6 border-t border-slate-200 w-full">
                <p className="text-xs text-slate-500">
                  Violations will appear here automatically when detected by the monitoring system
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
