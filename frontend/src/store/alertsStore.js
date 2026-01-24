import { create } from 'zustand'

export const useAlertsStore = create((set) => ({
  alerts: [
    {
      id: 1,
      severity: 'critical',
      title: 'Unauthorized Data Access Detected',
      description: 'CustomerServiceBot attempted to access restricted PII database',
      agent: 'CustomerServiceBot',
      policy: 'Data Privacy Policy v2.1',
      timestamp: '2026-01-23T09:45:00Z',
      status: 'active',
      impact: 'High - Potential PII exposure',
    },
    {
      id: 2,
      severity: 'warning',
      title: 'Rate Limit Threshold Exceeded',
      description: 'AnalyticsAgent exceeded maximum query rate of 1000 req/min',
      agent: 'AnalyticsAgent',
      policy: 'Resource Usage Policy',
      timestamp: '2026-01-23T08:30:00Z',
      status: 'active',
      impact: 'Medium - Performance degradation',
    },
    {
      id: 3,
      severity: 'critical',
      title: 'PII Exposure Risk',
      description: 'DataProcessorBot logging contains unmasked sensitive data',
      agent: 'DataProcessorBot',
      policy: 'PII Protection Policy',
      timestamp: '2026-01-23T07:15:00Z',
      status: 'investigating',
      impact: 'Critical - Compliance violation',
    },
    {
      id: 4,
      severity: 'warning',
      title: 'Model Drift Detected',
      description: 'RecommendationEngine performance degraded by 15%',
      agent: 'RecommendationEngine',
      policy: 'Model Quality Standards',
      timestamp: '2026-01-22T18:20:00Z',
      status: 'resolved',
      impact: 'Medium - User experience affected',
    },
    {
      id: 5,
      severity: 'info',
      title: 'Policy Update Required',
      description: 'SecurityGuardBot requires policy refresh after system update',
      agent: 'SecurityGuardBot',
      policy: 'Security Protocols v3.0',
      timestamp: '2026-01-22T14:10:00Z',
      status: 'acknowledged',
      impact: 'Low - Administrative task',
    },
  ],

  filterSeverity: 'all',
  filterStatus: 'all',
  selectedAlert: null,

  setFilterSeverity: (severity) => set({ filterSeverity: severity }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setSelectedAlert: (alert) => set({ selectedAlert: alert }),

  updateAlertStatus: (id, newStatus) =>
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert.id === id ? { ...alert, status: newStatus } : alert
      ),
    })),

  getFilteredAlerts: () => {
    const { alerts, filterSeverity, filterStatus } = useAlertsStore.getState()
    let filtered = alerts

    if (filterSeverity !== 'all') {
      filtered = filtered.filter((alert) => alert.severity === filterSeverity)
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((alert) => alert.status === filterStatus)
    }

    return filtered
  },
}))
