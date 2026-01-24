import { IconDatabase, IconLock, IconUsers, IconClock } from '@tabler/icons-react'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'

export default function Datasets() {
  const datasets = [
    {
      id: 1,
      name: 'Customer Records',
      type: 'Structured',
      sensitivity: 'High',
      records: 1250000,
      size: '24.5 GB',
      lastAccessed: '2 mins ago',
      status: 'active',
      compliance: ['GDPR', 'CCPA'],
    },
    {
      id: 2,
      name: 'Transaction Logs',
      type: 'Time Series',
      sensitivity: 'Medium',
      records: 8900000,
      size: '156 GB',
      lastAccessed: '15 mins ago',
      status: 'active',
      compliance: ['PCI-DSS'],
    },
    {
      id: 3,
      name: 'Training Data - NLP',
      type: 'Unstructured',
      sensitivity: 'Low',
      records: 500000,
      size: '8.2 GB',
      lastAccessed: '1 hour ago',
      status: 'active',
      compliance: [],
    },
    {
      id: 4,
      name: 'Healthcare Records',
      type: 'Structured',
      sensitivity: 'Critical',
      records: 450000,
      size: '32 GB',
      lastAccessed: '5 mins ago',
      status: 'active',
      compliance: ['HIPAA', 'GDPR'],
    },
  ]

  const getSensitivityColor = (sensitivity) => {
    const colors = {
      Low: 'bg-emerald-50 text-emerald-700',
      Medium: 'bg-amber-50 text-amber-700',
      High: 'bg-red-50 text-red-700',
      Critical: 'bg-red-600 text-white',
    }
    return colors[sensitivity] || colors.Low
  }

  const columns = [
    {
      header: 'Dataset Name',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <IconDatabase size={20} className="text-[#1E40AF]" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-500">{row.type}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Sensitivity',
      accessor: 'sensitivity',
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${getSensitivityColor(
            row.sensitivity
          )}`}
        >
          <IconLock size={14} />
          {row.sensitivity}
        </span>
      ),
    },
    {
      header: 'Records',
      accessor: 'records',
      render: (row) => (
        <span className="text-sm font-medium text-text-primary">
          {row.records.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Size',
      accessor: 'size',
      render: (row) => (
        <span className="text-sm text-text-secondary">{row.size}</span>
      ),
    },
    {
      header: 'Compliance',
      accessor: 'compliance',
      render: (row) => (
        <div className="flex gap-1 flex-wrap">
          {row.compliance.length > 0 ? (
            row.compliance.map((comp) => (
              <span
                key={comp}
                className="px-2 py-0.5 bg-blue-50 text-[#1E40AF] text-xs font-medium rounded"
              >
                {comp}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500">None</span>
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
      header: 'Last Accessed',
      accessor: 'lastAccessed',
      render: (row) => (
        <span className="text-sm text-text-tertiary">{row.lastAccessed}</span>
      ),
    },
  ]

  return (
    <div className="space-y-6 px-6 py-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            Dataset & Context Management
          </h1>
          <p className="text-slate-600">
            Manage data sources, monitor access, and ensure compliance
          </p>
        </div>
        <button className="px-4 py-2 bg-[#1E40AF] text-white rounded-lg hover:bg-[#1e3a8a] transition-colors shadow-sm font-medium">
          Register New Dataset
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <IconDatabase size={24} className="text-[#1E40AF]" />
            <p className="text-slate-600 text-sm font-medium">Total Datasets</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">{datasets.length}</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <IconLock size={24} className="text-red-600" />
            <p className="text-slate-600 text-sm font-medium">High Sensitivity</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {datasets.filter((d) => d.sensitivity === 'High' || d.sensitivity === 'Critical').length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <IconUsers size={24} className="text-emerald-600" />
            <p className="text-slate-600 text-sm font-medium">Active Users</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">247</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <IconClock size={24} className="text-[#1E40AF]" />
            <p className="text-slate-600 text-sm font-medium">Avg Response Time</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">38ms</p>
        </div>
      </div>

      {/* Datasets Table */}
      <DataTable columns={columns} data={datasets} />

      {/* Data Lineage Overview */}
      <div className="bg-white rounded-lg p-6 shadow-card">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Data Lineage Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-2">Source Systems</p>
            <p className="text-2xl font-bold text-slate-900">12</p>
            <p className="text-xs text-slate-500 mt-1">Connected systems</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-2">Data Pipelines</p>
            <p className="text-2xl font-bold text-slate-900">28</p>
            <p className="text-xs text-slate-500 mt-1">Active transformations</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-2">Downstream Consumers</p>
            <p className="text-2xl font-bold text-slate-900">64</p>
            <p className="text-xs text-slate-500 mt-1">AI agents & services</p>
          </div>
        </div>
      </div>
    </div>
  )
}
