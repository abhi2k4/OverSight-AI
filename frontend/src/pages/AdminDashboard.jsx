import { useState, useMemo } from 'react';
import {
  IconUsers,
  IconActivity,
  IconShieldCheck,
  IconDatabase,
  IconAlertTriangle,
  IconTrendingUp,
  IconClock,
  IconUserPlus,
  IconUserMinus,
  IconEye,
  IconSettings,
  IconChartBar,
  IconFileText,
} from '@tabler/icons-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useAppStore } from '../store/appStore';

// Mock data for admin dashboard
const recentActivities = [
  {
    id: 1,
    user: 'john.doe@company.com',
    action: 'Created new dataset',
    resource: 'Customer Analytics',
    timestamp: '2 mins ago',
    type: 'create',
  },
  {
    id: 2,
    user: 'sarah.smith@company.com',
    action: 'Modified AI Agent',
    resource: 'Sentiment Analyzer',
    timestamp: '15 mins ago',
    type: 'update',
  },
  {
    id: 3,
    user: 'mike.johnson@company.com',
    action: 'Accessed dataset',
    resource: 'Financial Records',
    timestamp: '1 hour ago',
    type: 'access',
  },
  {
    id: 4,
    user: 'admin@company.com',
    action: 'Updated policy',
    resource: 'Data Retention Policy',
    timestamp: '2 hours ago',
    type: 'update',
  },
  {
    id: 5,
    user: 'jane.wilson@company.com',
    action: 'Failed login attempt',
    resource: 'Authentication',
    timestamp: '3 hours ago',
    type: 'error',
  },
];

const systemUsers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@company.com',
    role: 'data-engineer',
    status: 'active',
    lastLogin: '2 mins ago',
    datasets: 12,
  },
  {
    id: 2,
    name: 'Sarah Smith',
    email: 'sarah.smith@company.com',
    role: 'ai-engineer',
    status: 'active',
    lastLogin: '15 mins ago',
    datasets: 8,
  },
  {
    id: 3,
    name: 'Mike Johnson',
    email: 'mike.johnson@company.com',
    role: 'data-engineer',
    status: 'active',
    lastLogin: '1 hour ago',
    datasets: 15,
  },
  {
    id: 4,
    name: 'Jane Wilson',
    email: 'jane.wilson@company.com',
    role: 'ai-engineer',
    status: 'inactive',
    lastLogin: '2 days ago',
    datasets: 5,
  },
];

const systemAlerts = [
  {
    id: 1,
    severity: 'high',
    message: 'Unusual data access pattern detected',
    timestamp: '10 mins ago',
  },
  {
    id: 2,
    severity: 'medium',
    message: 'Storage capacity at 85%',
    timestamp: '1 hour ago',
  },
  {
    id: 3,
    severity: 'low',
    message: 'Scheduled backup completed',
    timestamp: '3 hours ago',
  },
];

export default function AdminDashboard() {
  const [timeRange, setTimeRange] = useState('7d');
  const user = useAppStore((state) => state.user);

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      totalUsers: systemUsers.length,
      activeUsers: systemUsers.filter((u) => u.status === 'active').length,
      totalDatasets: systemUsers.reduce((sum, u) => sum + u.datasets, 0),
      totalActivities: recentActivities.length,
      criticalAlerts: systemAlerts.filter((a) => a.severity === 'high').length,
      dataEngineers: systemUsers.filter((u) => u.role === 'data-engineer').length,
      aiEngineers: systemUsers.filter((u) => u.role === 'ai-engineer').length,
    };
  }, []);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'create':
        return <IconUserPlus size={16} className="text-emerald-600" />;
      case 'update':
        return <IconSettings size={16} className="text-blue-600" />;
      case 'access':
        return <IconEye size={16} className="text-purple-600" />;
      case 'error':
        return <IconAlertTriangle size={16} className="text-red-600" />;
      default:
        return <IconActivity size={16} className="text-slate-600" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'create':
        return 'bg-emerald-50 border-emerald-200';
      case 'update':
        return 'bg-blue-50 border-blue-200';
      case 'access':
        return 'bg-purple-50 border-purple-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'org-admin':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'ai-engineer':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'data-engineer':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
            <p className="text-slate-600">
              System overview and administrative controls for organization management
            </p>
          </div>
          <div className="flex gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <IconFileText size={18} />
              Export Report
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <IconUsers size={24} className="text-blue-600" />
              </div>
              <IconTrendingUp size={18} className="text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Total Users</p>
            <p className="text-3xl font-bold text-slate-900">{stats.totalUsers}</p>
            <p className="text-xs text-slate-500 mt-2">
              {stats.activeUsers} active • {stats.totalUsers - stats.activeUsers} inactive
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                <IconDatabase size={24} className="text-emerald-600" />
              </div>
              <IconTrendingUp size={18} className="text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Total Datasets</p>
            <p className="text-3xl font-bold text-slate-900">{stats.totalDatasets}</p>
            <p className="text-xs text-slate-500 mt-2">Across all users</p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
                <IconActivity size={24} className="text-purple-600" />
              </div>
              <IconTrendingUp size={18} className="text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Recent Activities</p>
            <p className="text-3xl font-bold text-slate-900">{stats.totalActivities}</p>
            <p className="text-xs text-slate-500 mt-2">In the last hour</p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center">
                <IconAlertTriangle size={24} className="text-red-600" />
              </div>
              <IconTrendingUp size={18} className="text-red-500" />
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Critical Alerts</p>
            <p className="text-3xl font-bold text-slate-900">{stats.criticalAlerts}</p>
            <p className="text-xs text-slate-500 mt-2">Requires attention</p>
          </Card>
        </div>

        {/* Role Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Role Distribution</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <IconUsers size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Data Engineers</p>
                    <p className="text-xs text-slate-500">Dataset management</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-slate-900">{stats.dataEngineers}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <IconShieldCheck size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">AI Engineers</p>
                    <p className="text-xs text-slate-500">AI agent management</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-slate-900">{stats.aiEngineers}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                    <IconShieldCheck size={20} className="text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Org Admins</p>
                    <p className="text-xs text-slate-500">Full access</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-slate-900">1</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">System Alerts</h3>
            <div className="space-y-3">
              {systemAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <IconAlertTriangle
                    size={20}
                    className={cn(
                      alert.severity === 'high'
                        ? 'text-red-600'
                        : alert.severity === 'medium'
                          ? 'text-amber-600'
                          : 'text-blue-600'
                    )}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-slate-900">{alert.message}</p>
                      <Badge className={cn('text-xs', getSeverityColor(alert.severity))}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">{alert.timestamp}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Activities */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Recent Activities</h3>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-lg border',
                  getActivityColor(activity.type)
                )}
              >
                <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {activity.user} • {activity.resource}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <IconClock size={14} />
                  {activity.timestamp}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* User Management */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">User Management</h3>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <IconUserPlus size={18} />
              Add User
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Datasets</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {systemUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900">{user.name}</p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs border', getRoleBadgeColor(user.role))}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          'text-xs border',
                          user.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        )}
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-slate-900">{user.datasets}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">{user.lastLogin}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600">
                          <IconUserMinus size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* System Health */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Storage Usage</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-600">Used</span>
                  <span className="text-xs font-semibold text-slate-900">850 GB / 1 TB</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">API Usage</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-600">Requests</span>
                  <span className="text-xs font-semibold text-slate-900">
                    45.2K / 100K
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">System Uptime</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <IconChartBar size={24} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">99.9%</p>
                <p className="text-xs text-slate-500">Last 30 days</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
