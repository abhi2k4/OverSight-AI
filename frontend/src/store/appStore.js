import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAppStore = create(
  persist(
    (set) => ({
      // Authentication
      isAuthenticated: false,
      user: null,
      setAuthenticated: (status, user = null) =>
        set({ isAuthenticated: status, user }),
      logout: () => set({ isAuthenticated: false, user: null }),

      // Current route
      currentRoute: 'Dashboard',
      setCurrentRoute: (route) => set({ currentRoute: route }),

      // Sidebar state
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // Loading state
      loading: false,
      setLoading: (status) => set({ loading: status }),

      // Notifications/Alerts count
      alertsCount: 7,
      setAlertsCount: (count) => set({ alertsCount: count }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
)
