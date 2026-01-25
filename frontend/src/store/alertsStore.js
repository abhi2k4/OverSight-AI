import { create } from 'zustand'

export const useAlertsStore = create((set, get) => ({
  alerts: [],
  isLoading: false,
  filterSeverity: 'all',
  filterStatus: 'all',
  selectedAlert: null,

  fetchAlerts: async () => {
    set({ isLoading: true });
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
      const response = await fetch(`${apiBase}/violations?limit=100`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch violations: ${response.status}`);
      }

      const violations = await response.json();
      
      // Transform violations to alert format
      const transformedAlerts = violations.map(violation => {
        // Use policy/compliance names from backend response
        const policyName = violation.policy_name || (violation.policy_id ? `Policy #${violation.policy_id}` : '');
        const complianceName = violation.compliance_name || (violation.compliance_id ? violation.compliance_id.toUpperCase() : '');
        const policyOrCompliance = policyName || complianceName || 'Unknown';
        
        // Build title based on violation type
        let title = 'Policy Violation';
        if (violation.violation_type === 'compliance') {
          title = 'Compliance Violation';
        } else if (violation.violation_type === 'policy') {
          title = policyName || 'Policy Violation';
        }
        
        return {
          id: violation.id,
          severity: violation.severity,
          title: title,
          description: violation.description,
          agent: violation.agent_id || 'Unknown Agent',
          policy: policyOrCompliance,
          timestamp: violation.detected_at,
          status: violation.status,
          impact: violation.severity === 'critical' 
            ? 'Critical - Immediate action required'
            : violation.severity === 'warning'
            ? 'Medium - Review required'
            : 'Low - Monitor',
          violation_id: violation.id,
          policy_id: violation.policy_id,
          compliance_id: violation.compliance_id,
          violation_type: violation.violation_type,
        };
      });
      
      set({ alerts: transformedAlerts, isLoading: false });
    } catch (error) {
      console.error('Error fetching alerts:', error);
      set({ isLoading: false });
      // Keep existing alerts on error
    }
  },

  updateAlertStatus: async (alertId, newStatus) => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
      const alert = get().alerts.find(a => a.id === alertId);
      if (!alert?.violation_id) return;
      
      const response = await fetch(`${apiBase}/violations/${alert.violation_id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update violation status: ${response.status}`);
      }

      // Update local state
      set(state => ({
        alerts: state.alerts.map(a => 
          a.id === alertId ? { ...a, status: newStatus } : a
        )
      }));
    } catch (error) {
      console.error('Error updating alert status:', error);
      throw error;
    }
  },

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
