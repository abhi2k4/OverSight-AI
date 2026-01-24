import { create } from 'zustand'

export const useAgentsStore = create((set) => ({
  agents: [
    {
      id: 1,
      name: 'CustomerServiceBot',
      type: 'Conversational AI',
      status: 'active',
      riskLevel: 'Medium',
      policies: 8,
      lastActivity: '2 mins ago',
      department: 'Customer Support',
      version: 'v2.4.1',
    },
    {
      id: 2,
      name: 'AnalyticsAgent',
      type: 'Data Analytics',
      status: 'active',
      riskLevel: 'High',
      policies: 12,
      lastActivity: '15 mins ago',
      department: 'Business Intelligence',
      version: 'v3.1.0',
    },
    {
      id: 3,
      name: 'DataProcessorBot',
      type: 'ETL Pipeline',
      status: 'warning',
      riskLevel: 'Critical',
      policies: 15,
      lastActivity: '5 mins ago',
      department: 'Data Engineering',
      version: 'v1.9.2',
    },
    {
      id: 4,
      name: 'RecommendationEngine',
      type: 'ML Model',
      status: 'active',
      riskLevel: 'Low',
      policies: 6,
      lastActivity: '1 hour ago',
      department: 'Product',
      version: 'v4.0.1',
    },
    {
      id: 5,
      name: 'SentimentAnalyzer',
      type: 'NLP Model',
      status: 'active',
      riskLevel: 'Medium',
      policies: 9,
      lastActivity: '30 mins ago',
      department: 'Marketing',
      version: 'v2.8.0',
    },
    {
      id: 6,
      name: 'SecurityGuardBot',
      type: 'Security Agent',
      status: 'active',
      riskLevel: 'Low',
      policies: 18,
      lastActivity: '10 mins ago',
      department: 'Security',
      version: 'v5.2.3',
    },
  ],

  filterBy: 'all',
  searchQuery: '',
  selectedAgent: null,

  setFilterBy: (filter) => set({ filterBy: filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),

  getFilteredAgents: () => {
    const { agents, filterBy, searchQuery } = useAgentsStore.getState()
    let filtered = agents

    if (filterBy !== 'all') {
      filtered = filtered.filter(
        (agent) => agent.status.toLowerCase() === filterBy.toLowerCase()
      )
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (agent) =>
          agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agent.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return filtered
  },
}))
