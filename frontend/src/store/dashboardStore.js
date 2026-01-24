import { create } from 'zustand'

export const useDashboardStore = create((set) => ({
  // Metrics data
  metrics: {
    activeAgents: 127,
    totalPolicies: 48,
    violationsCount: 7,
    complianceScore: 94.2,
    datasetsManaged: 342,
    auditEventsToday: 1247,
  },

  // Recent alerts
  recentAlerts: [
    {
      id: 1,
      severity: 'critical',
      title: 'Unauthorized Data Access Detected',
      agent: 'CustomerServiceBot',
      timestamp: '2026-01-23T09:45:00Z',
      status: 'active',
    },
    {
      id: 2,
      severity: 'warning',
      title: 'Policy Threshold Exceeded',
      agent: 'AnalyticsAgent',
      timestamp: '2026-01-23T08:30:00Z',
      status: 'active',
    },
    {
      id: 3,
      severity: 'critical',
      title: 'PII Exposure Risk',
      agent: 'DataProcessorBot',
      timestamp: '2026-01-23T07:15:00Z',
      status: 'investigating',
    },
  ],

  // Update metrics
  updateMetrics: (newMetrics) =>
    set((state) => ({ metrics: { ...state.metrics, ...newMetrics } })),

  // Add alert
  addAlert: (alert) =>
    set((state) => ({ recentAlerts: [alert, ...state.recentAlerts] })),
}))
