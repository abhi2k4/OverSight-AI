import { Link, useLocation } from 'react-router-dom'
import {
  IconDashboard,
  IconRobot,
  IconDatabase,
  IconShieldCheck,
  IconAlertTriangle,
  IconHistory,
  IconSettings,
  IconX,
} from '@tabler/icons-react'
import { useAppStore } from '../store/appStore'

const navigationItems = [
  { name: 'Dashboard', path: '/', icon: IconDashboard },
  { name: 'AI Agents', path: '/agents', icon: IconRobot },
  { name: 'Datasets', path: '/datasets', icon: IconDatabase },
  { name: 'Policies', path: '/policies', icon: IconShieldCheck },
  { name: 'Alerts', path: '/alerts', icon: IconAlertTriangle, badge: true },
  { name: 'Audit Logs', path: '/audit-logs', icon: IconHistory },
]

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const location = useLocation()
  const alertsCount = useAppStore((state) => state.alertsCount)

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-60 bg-white border-r border-border
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <IconShieldCheck size={24} stroke={2} className="text-white" />
            </div>
            <div>
              <h1 className="text-text-primary text-base font-semibold leading-tight">
                OverSight
              </h1>
              <p className="text-text-secondary text-xs">Governance Platform</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-text-secondary hover:text-text-primary"
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.path
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-colors group relative
                    ${
                      isActive
                        ? 'bg-primary text-white shadow-card'
                        : 'text-text-secondary hover:bg-background-gray hover:text-primary'
                    }
                  `}
                >
                  <Icon
                    size={20}
                    stroke={2}
                    className={isActive ? 'text-white' : 'group-hover:text-primary'}
                  />
                  <span className="text-sm font-medium">{item.name}</span>
                  {item.badge && alertsCount > 0 && (
                    <span className="ml-auto flex items-center justify-center h-5 min-w-[20px] px-1.5 bg-status-danger text-white text-xs font-bold rounded-full">
                      {alertsCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Settings */}
        <div className="p-4 border-t border-border">
          <Link
            to="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:bg-background-gray hover:text-primary transition-colors group"
          >
            <IconSettings size={20} stroke={2} className="group-hover:text-primary" />
            <span className="text-sm font-medium">Settings</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
