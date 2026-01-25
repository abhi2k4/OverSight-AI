import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  IconLayoutDashboard,
  IconRobot,
  IconDatabase,
  IconGavel,
  IconAlertTriangle,
  IconFileText,
  IconShieldCheck,
  IconMenu2,
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconSettings,
  IconMessageChatbot,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '../store/appStore';
import { Button } from './ui/button';

const navItems = [
  { path: '/dashboard', icon: IconLayoutDashboard, label: 'Dashboard' },
  { path: '/agents', icon: IconRobot, label: 'AI Agents' },
  { path: '/datasets', icon: IconDatabase, label: 'Datasets' },
  { path: '/policies', icon: IconGavel, label: 'Policies' },
  { path: '/compliance', icon: IconShieldCheck, label: 'Compliance Manager' },
  { path: '/alerts', icon: IconAlertTriangle, label: 'Alerts' },
  { path: '/audit-logs', icon: IconFileText, label: 'Audit Logs' },
  { path: '/chatbot', icon: IconMessageChatbot, label: 'Chatbot Monitor' },
];

const bottomNavItems = [
  { path: '/settings', icon: IconSettings, label: 'Settings' },
];

export default function CollapsibleSidebar() {
  const location = useLocation();
  const user = useAppStore((state) => state.user);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'h-full border-r border-slate-200 bg-white flex flex-col transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className={cn('p-6 border-b border-slate-200', collapsed && 'p-4')}>
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <img 
                src="/OverSight.png" 
                alt="OverSight Logo" 
                className="w-9 h-9 rounded-md object-cover"
              />
              <div className="flex flex-col">
                <h1 className="text-sm font-bold leading-tight text-slate-900">OverSight</h1>
                <p className="text-xs text-slate-500">AI Governance</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8 text-slate-600', collapsed && 'mx-auto')}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <IconChevronRight className="h-4 w-4" />
            ) : (
              <IconChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all',
                isActive
                  ? 'bg-blue-50 text-[#1E40AF] border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                collapsed && 'justify-center'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" stroke={1.5} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-slate-200">
        {/* Bottom Navigation */}
        <nav className="px-3 py-2 space-y-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all',
                  isActive
                    ? 'bg-blue-50 text-[#1E40AF] border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  collapsed && 'justify-center'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" stroke={1.5} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className={cn('p-4 border-t border-slate-200', collapsed && 'p-2')}>
          <div
            className={cn(
              'flex items-center gap-3 p-3 rounded-md bg-slate-50 border border-slate-200',
              collapsed && 'p-2 justify-center'
            )}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            {!collapsed && (
              <div className="flex flex-col overflow-hidden min-w-0">
                <span className="text-sm font-medium text-slate-900 truncate">
                  {user?.name || 'User'}
                </span>
                <span className="text-xs text-slate-500 truncate">{user?.role || 'Role'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
