import { IconShieldCheck, IconAlertCircle } from '@tabler/icons-react'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'

export default function Policies() {
  const policies = [
    {
      id: 1,
      name: 'Data Privacy Policy v2.1',
      category: 'Privacy',
      status: 'active',
      appliedTo: 42,
      violations: 3,
      lastUpdated: '2026-01-15',
      severity: 'Critical',
    },
    {
      id: 2,
      name: 'Resource Usage Policy',
      category: 'Performance',
      status: 'active',
      appliedTo: 38,
      violations: 1,
      lastUpdated: '2026-01-10',
      severity: 'Medium',
    },
    {
      id: 3,
      name: 'PII Protection Policy',
      category: 'Security',
      status: 'active',
      appliedTo: 56,
      violations: 2,
      lastUpdated: '2026-01-20',
      severity: 'Critical',
    },
    {
      id: 4,
      name: 'Model Quality Standards',
      category: 'Quality',
      status: 'active',
      appliedTo: 24,
      violations: 1,
      lastUpdated: '2026-01-18',
      severity: 'Medium',
    },
    {
      id: 5,
      name: 'Security Protocols v3.0',
      category: 'Security',
      status: 'active',
      appliedTo: 67,
      violations: 0,
      lastUpdated: '2026-01-22',
      severity: 'High',
    },
  ]

  const getSeverityColor = (severity) => {
    const colors = {
      Low: 'bg-emerald-50 text-emerald-700',
      Medium: 'bg-amber-50 text-amber-700',
      High: 'bg-red-50 text-red-700',
      Critical: 'bg-red-600 text-white',
    }
    return colors[severity] || colors.Low
  }

  const columns = [
    {
      header: 'Policy Name',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <IconShieldCheck size={20} className="text-[#1E40AF]" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-500">{row.category}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Severity',
      accessor: 'severity',
      render: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${getSeverityColor(
            row.severity
          )}`}
        >
          {row.severity}
        </span>
      ),
    },
    {
      header: 'Applied To',
      accessor: 'appliedTo',
      render: (row) => (
        <span className="text-sm font-medium text-text-primary">{row.appliedTo} agents</span>
      ),
    },
    {
      header: 'Violations',
      accessor: 'violations',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.violations > 0 ? (
            <>
              <IconAlertCircle size={16} className="text-red-600" />
              <span className="text-sm font-bold text-red-600">{row.violations}</span>
            </>
          ) : (
            <>
              <IconShieldCheck size={16} className="text-emerald-600" />
              <span className="text-sm text-emerald-600">None</span>
            </>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      header: 'Last Updated',
      accessor: 'lastUpdated',
      render: (row) => (
        <span className="text-sm text-text-secondary">
          {new Date(row.lastUpdated).toLocaleDateString()}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6 px-6 py-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            Policy & Governance Engine
          </h1>
          <p className="text-slate-600">
            Define, manage, and enforce governance policies across your AI ecosystem
          </p>
        </div>
        <button className="px-4 py-2 bg-[#1E40AF] text-white rounded-lg hover:bg-[#1e3a8a] transition-colors shadow-sm font-medium">
          Create New Policy
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <IconShieldCheck size={24} className="text-[#1E40AF]" />
            <p className="text-slate-600 text-sm font-medium">Total Policies</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">{policies.length}</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <IconShieldCheck size={24} className="text-emerald-600" />
            <p className="text-slate-600 text-sm font-medium">Active</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {policies.filter((p) => p.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <IconAlertCircle size={24} className="text-red-600" />
            <p className="text-slate-600 text-sm font-medium">Total Violations</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {policies.reduce((sum, p) => sum + p.violations, 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <IconShieldCheck size={24} className="text-emerald-600" />
            <p className="text-slate-600 text-sm font-medium">Coverage</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">98.5%</p>
        </div>
      </div>

      {/* Policies Table */}
      <DataTable columns={columns} data={policies} />

      {/* Policy Categories */}
      <div className="bg-white rounded-lg p-6 shadow-card">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Policy Categories Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-2">Privacy</p>
            <p className="text-2xl font-bold text-slate-900">12</p>
            <p className="text-xs text-red-600 mt-1">3 violations</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-2">Security</p>
            <p className="text-2xl font-bold text-slate-900">18</p>
            <p className="text-xs text-red-600 mt-1">2 violations</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-2">Performance</p>
            <p className="text-2xl font-bold text-slate-900">8</p>
            <p className="text-xs text-amber-600 mt-1">1 violation</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-2">Quality</p>
            <p className="text-2xl font-bold text-slate-900">10</p>
            <p className="text-xs text-emerald-600 mt-1">0 violations</p>
          </div>
        </div>
      </div>
    </div>
  )
}
