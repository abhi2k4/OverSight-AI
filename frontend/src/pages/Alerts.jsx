import { IconAlertTriangle, IconAlertCircle, IconInfoCircle } from '@tabler/icons-react'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import { useAlertsStore } from '../store/alertsStore'

export default function Alerts() {
  const { alerts, filterSeverity, filterStatus, setFilterSeverity, setFilterStatus } =
    useAlertsStore()

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

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          Alerts & Violations Center
        </h1>
        <p className="text-slate-600">
          Monitor, investigate, and resolve compliance alerts and policy violations
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-card border-l-4 border-red-600">
          <div className="flex items-center gap-3 mb-2">
            <IconAlertCircle size={24} className="text-red-600" />
            <p className="text-slate-600 text-sm font-medium">Critical</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {alerts.filter((a) => a.severity === 'critical').length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-card border-l-4 border-amber-600">
          <div className="flex items-center gap-3 mb-2">
            <IconAlertTriangle size={24} className="text-amber-600" />
            <p className="text-slate-600 text-sm font-medium">Warnings</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {alerts.filter((a) => a.severity === 'warning').length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-card border-l-4 border-[#1E40AF]">
          <div className="flex items-center gap-3 mb-2">
            <IconInfoCircle size={24} className="text-[#1E40AF]" />
            <p className="text-slate-600 text-sm font-medium">Active</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {alerts.filter((a) => a.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-card border-l-4 border-emerald-600">
          <div className="flex items-center gap-3 mb-2">
            <IconInfoCircle size={24} className="text-emerald-600" />
            <p className="text-slate-600 text-sm font-medium">Resolved Today</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {alerts.filter((a) => a.status === 'resolved').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow-card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
              Filter by Severity
            </label>
            <div className="flex gap-2">
              {severityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilterSeverity(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterSeverity === option.value
                      ? 'bg-[#1E40AF] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
              Filter by Status
            </label>
            <div className="flex gap-2 flex-wrap">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilterStatus(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === option.value
                      ? 'bg-[#1E40AF] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <DataTable columns={columns} data={filteredAlerts} />
    </div>
  )
}
