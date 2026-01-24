import { IconFileText, IconDownload, IconFilter } from '@tabler/icons-react'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'

export default function AuditLogs() {
  const auditLogs = [
    {
      id: 1,
      timestamp: '2026-01-23T10:45:32Z',
      event: 'Data Access',
      agent: 'CustomerServiceBot',
      user: 'sarah.jenkins@company.com',
      action: 'Query Execution',
      resource: 'customer_records_db',
      status: 'success',
      details: 'Retrieved 150 customer records',
    },
    {
      id: 2,
      timestamp: '2026-01-23T10:42:18Z',
      event: 'Policy Update',
      agent: 'System',
      user: 'admin@company.com',
      action: 'Configuration Change',
      resource: 'Data Privacy Policy v2.1',
      status: 'success',
      details: 'Updated access threshold parameters',
    },
    {
      id: 3,
      timestamp: '2026-01-23T10:38:56Z',
      event: 'Unauthorized Access Attempt',
      agent: 'DataProcessorBot',
      user: 'system.agent@company.com',
      action: 'Database Connection',
      resource: 'sensitive_pii_db',
      status: 'critical',
      details: 'Access denied - insufficient permissions',
    },
    {
      id: 4,
      timestamp: '2026-01-23T10:35:22Z',
      event: 'Model Execution',
      agent: 'RecommendationEngine',
      user: 'ml.pipeline@company.com',
      action: 'Inference Request',
      resource: 'recommendation_model_v4',
      status: 'success',
      details: 'Processed 1,247 prediction requests',
    },
    {
      id: 5,
      timestamp: '2026-01-23T10:30:15Z',
      event: 'Configuration Change',
      agent: 'SecurityGuardBot',
      user: 'admin@company.com',
      action: 'Settings Update',
      resource: 'security_protocols',
      status: 'warning',
      details: 'Modified rate limiting thresholds',
    },
  ]

  const getEventTypeColor = (status) => {
    const colors = {
      success: 'text-emerald-600',
      warning: 'text-amber-600',
      critical: 'text-red-600',
      info: 'text-[#1E40AF]',
    }
    return colors[status] || colors.info
  }

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'timestamp',
      render: (row) => (
        <div className="text-sm">
          <p className="text-text-primary">
            {new Date(row.timestamp).toLocaleDateString()}
          </p>
          <p className="text-xs text-text-tertiary">
            {new Date(row.timestamp).toLocaleTimeString()}
          </p>
        </div>
      ),
    },
    {
      header: 'Event',
      accessor: 'event',
      render: (row) => (
        <div>
          <p className="font-medium text-text-primary">{row.event}</p>
          <p className="text-xs text-text-secondary">{row.action}</p>
        </div>
      ),
    },
    {
      header: 'Agent/System',
      accessor: 'agent',
      render: (row) => (
        <div>
          <p className="text-sm text-text-primary">{row.agent}</p>
          <p className="text-xs text-text-tertiary">{row.user}</p>
        </div>
      ),
    },
    {
      header: 'Resource',
      accessor: 'resource',
      render: (row) => (
        <span className="text-sm font-mono text-text-secondary">{row.resource}</span>
      ),
    },
    {
      header: 'Details',
      accessor: 'details',
      render: (row) => (
        <span className="text-sm text-text-secondary">{row.details}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
  ]

  return (
    <div className="space-y-6 px-6 py-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            Audit & Compliance Logs
          </h1>
          <p className="text-slate-600">
            Comprehensive audit trail of all system activities and events
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 transition-colors shadow-sm font-medium">
            <IconFilter size={20} />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1E40AF] text-white rounded-lg hover:bg-[#1e3a8a] transition-colors shadow-sm font-medium">
            <IconDownload size={20} />
            Export Logs
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <IconFileText size={24} className="text-[#1E40AF]" />
            <p className="text-slate-600 text-sm font-medium">Total Events Today</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">1,247</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
            <p className="text-slate-600 text-sm font-medium">Successful</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">1,189</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <p className="text-slate-600 text-sm font-medium">Warnings</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">51</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">✕</span>
            </div>
            <p className="text-slate-600 text-sm font-medium">Critical</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">7</p>
        </div>
      </div>

      {/* Audit Logs Table */}
      <DataTable columns={columns} data={auditLogs} />

      {/* Activity Summary */}
      <div className="bg-white rounded-lg p-6 shadow-card">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Activity Summary (Last 24 Hours)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-2">Data Access Events</p>
            <p className="text-2xl font-bold text-slate-900">842</p>
            <p className="text-xs text-emerald-600 mt-1">↑ 12% from yesterday</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-2">Policy Changes</p>
            <p className="text-2xl font-bold text-slate-900">28</p>
            <p className="text-xs text-slate-600 mt-1">Standard activity</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-2">Security Events</p>
            <p className="text-2xl font-bold text-slate-900">15</p>
            <p className="text-xs text-amber-600 mt-1">↑ 3 from yesterday</p>
          </div>
        </div>
      </div>
    </div>
  )
}
