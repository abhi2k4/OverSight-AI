import {
  IconRobot,
  IconShieldCheck,
  IconAlertTriangle,
  IconChartBar,
  IconDatabase,
  IconClock,
  IconTrendingUp,
} from '@tabler/icons-react'
import MetricCard from '../components/MetricCard'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import { useDashboardStore } from '../store/dashboardStore'

export default function Dashboard() {
  const { metrics, recentAlerts } = useDashboardStore()

  const alertColumns = [
    {
      header: 'Severity',
      accessor: 'severity',
      render: (row) => <StatusBadge status={row.severity} size="sm" />,
    },
    {
      header: 'Alert',
      accessor: 'title',
      render: (row) => (
        <div>
          <p className="font-medium text-text-primary">{row.title}</p>
          <p className="text-xs text-text-tertiary">{row.agent}</p>
        </div>
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
        <span className="text-sm text-text-secondary">
          {new Date(row.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6 px-6 py-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary mb-2">
          Global Governance Dashboard
        </h1>
        <p className="text-text-secondary">
          Comprehensive overview of AI governance, compliance, and monitoring
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <MetricCard
          title="Active AI Agents"
          value={metrics.activeAgents}
          icon={IconRobot}
          color="primary"
          trend={{ direction: 'up', value: '12%', label: 'vs last month' }}
        />
        <MetricCard
          title="Total Policies"
          value={metrics.totalPolicies}
          icon={IconShieldCheck}
          color="info"
          trend={{ direction: 'up', value: '3', label: 'new this week' }}
        />
        <MetricCard
          title="Active Violations"
          value={metrics.violationsCount}
          icon={IconAlertTriangle}
          color="danger"
          trend={{ direction: 'down', value: '2', label: 'from yesterday' }}
        />
        <MetricCard
          title="Compliance Score"
          value={`${metrics.complianceScore}%`}
          icon={IconChartBar}
          color="success"
          trend={{ direction: 'up', value: '2.3%', label: 'improvement' }}
        />
        <MetricCard
          title="Datasets Managed"
          value={metrics.datasetsManaged}
          icon={IconDatabase}
          color="info"
        />
        <MetricCard
          title="Audit Events Today"
          value={metrics.auditEventsToday.toLocaleString()}
          icon={IconClock}
          color="primary"
        />
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Alerts</h2>
            <button className="text-sm text-[#1E40AF] hover:text-[#1e3a8a] font-medium">
              View All
            </button>
          </div>
          <DataTable columns={alertColumns} data={recentAlerts} />
        </div>

        {/* Compliance Trends */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Compliance Trends</h2>
            <IconTrendingUp size={20} className="text-emerald-600" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-background rounded-lg">
              <div>
                <p className="text-sm font-medium text-text-primary">Data Privacy</p>
                <p className="text-xs text-text-secondary">GDPR & CCPA</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold text-status-success">98%</p>
                <p className="text-xs text-status-success">+3% this week</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-background rounded-lg">
              <div>
                <p className="text-sm font-medium text-text-primary">Security Standards</p>
                <p className="text-xs text-text-secondary">SOC 2 & ISO 27001</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold text-status-success">96%</p>
                <p className="text-xs text-status-success">+1% this week</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-background rounded-lg">
              <div>
                <p className="text-sm font-medium text-text-primary">Model Ethics</p>
                <p className="text-xs text-text-secondary">Fairness & Bias</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold text-status-warning">89%</p>
                <p className="text-xs text-status-warning">-2% this week</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-emerald-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-2">API Health</p>
            <p className="text-3xl font-bold text-emerald-600">99.9%</p>
            <p className="text-xs text-emerald-600 mt-1">All systems operational</p>
          </div>
          <div className="text-center p-4 bg-emerald-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-2">Monitoring Coverage</p>
            <p className="text-3xl font-bold text-emerald-600">100%</p>
            <p className="text-xs text-emerald-600 mt-1">All agents monitored</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-2">Response Time</p>
            <p className="text-3xl font-bold text-[#1E40AF]">42ms</p>
            <p className="text-xs text-[#1E40AF] mt-1">Average latency</p>
          </div>
        </div>
      </div>
    </div>
  )
}
