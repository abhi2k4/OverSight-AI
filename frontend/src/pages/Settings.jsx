import { IconUser, IconShield, IconMail, IconCalendar, IconKey, IconCheck, IconLogout } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAppStore } from '../store/appStore';
import { logout } from '../services/KeycloakService';

export default function Settings() {
  const user = useAppStore((state) => state.user);

  const handleLogout = () => {
    logout();
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      'org-admin': 'bg-red-100 text-red-700 border-red-200',
      'ai-engineer': 'bg-blue-100 text-blue-700 border-blue-200',
      'data-engineer': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    };
    return colors[role] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getRoleDisplayName = (role) => {
    const names = {
      'org-admin': 'Organization Admin',
      'ai-engineer': 'AI Engineer',
      'data-engineer': 'Data Engineer',
    };
    return names[role] || role;
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'min' : 'mins'} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
    }
    
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Enhanced Page Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-8 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">User Profile</h1>
          <p className="text-slate-600 text-base">
            Manage your account information and view your access permissions
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Hero Profile Section - Prominent and Discoverable */}
          <Card className="p-8 bg-gradient-to-br from-white to-blue-50/50 border-2 border-blue-100 shadow-lg">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Large Avatar - Visual Anchor */}
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-4xl shadow-lg ring-4 ring-blue-100">
                  {user?.name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              </div>

              {/* User Identity Section */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-bold text-slate-900">
                    {user?.name || user?.username || 'User'}
                  </h2>
                  {user?.roles && user.roles.length > 0 && (
                    <Badge className="bg-blue-600 text-white border-0 px-3 py-1 text-xs font-semibold hover:bg-blue-600">
                      {getRoleDisplayName(user.roles[0])}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-slate-600 mb-4">
                  <IconMail size={16} />
                  <span className="text-base">{user?.email || 'No email provided'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <IconCalendar size={16} />
                  <span className="text-sm">
                    Last active: {formatRelativeTime(user?.lastLogin)}
                  </span>
                </div>
              </div>

              {/* Quick Action */}
              <div className="flex-shrink-0">
                <Button 
                  variant="outline" 
                  onClick={handleLogout} 
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 gap-2"
                >
                  <IconLogout size={18} />
                  Logout
                </Button>
              </div>
            </div>
          </Card>

          {/* Information Grid - Better Organization */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Account Details Card */}
            <Card className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <IconUser size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Account Details</h3>
                  <p className="text-xs text-slate-500">Personal information</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    Username
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <IconUser size={16} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-900">{user?.username || 'N/A'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    Full Name
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <IconUser size={16} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-900">{user?.name || 'N/A'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <IconMail size={16} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-900">{user?.email || 'N/A'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    Last Login
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <IconCalendar size={16} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-900">
                      {formatRelativeTime(user?.lastLogin)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Roles & Permissions Card */}
            <Card className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <IconShield size={20} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Roles & Permissions</h3>
                  <p className="text-xs text-slate-500">Access control</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
                    Assigned Roles
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {user?.roles && user.roles.length > 0 ? (
                      user.roles
                        .filter(role => ['org-admin', 'ai-engineer', 'data-engineer'].includes(role))
                        .map((role) => (
                          <Badge
                            key={role}
                            className={cn(
                              'px-4 py-2 text-xs font-semibold border flex items-center gap-2 transition-none',
                              getRoleBadgeColor(role),
                              // Prevent any hover color changes - maintain current background
                              role === 'org-admin' && 'hover:bg-red-100 hover:text-red-700',
                              role === 'ai-engineer' && 'hover:bg-blue-100 hover:text-blue-700',
                              role === 'data-engineer' && 'hover:bg-emerald-100 hover:text-emerald-700'
                            )}
                          >
                            <IconShield size={14} />
                            {getRoleDisplayName(role)}
                          </Badge>
                        ))
                    ) : (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-sm text-slate-500">No roles assigned</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
                    Permissions Overview
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                      <span className="text-sm font-medium text-slate-700">Dashboard Access</span>
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 transition-none">
                        <IconCheck size={12} className="mr-1" />
                        Granted
                      </Badge>
                    </div>
                    {user?.roles?.includes('org-admin') && (
                      <>
                        <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                          <span className="text-sm font-medium text-slate-700">Admin Dashboard</span>
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 transition-none">
                            <IconCheck size={12} className="mr-1" />
                            Granted
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                          <span className="text-sm font-medium text-slate-700">All Features</span>
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 transition-none">
                            <IconCheck size={12} className="mr-1" />
                            Full Access
                          </Badge>
                        </div>
                      </>
                    )}
                    {user?.roles?.includes('ai-engineer') && (
                      <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                        <span className="text-sm font-medium text-slate-700">AI Agents Management</span>
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 transition-none">
                          <IconCheck size={12} className="mr-1" />
                          Granted
                        </Badge>
                      </div>
                    )}
                    {user?.roles?.includes('data-engineer') && (
                      <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                        <span className="text-sm font-medium text-slate-700">Datasets Management</span>
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 transition-none">
                          <IconCheck size={12} className="mr-1" />
                          Granted
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Authentication Status Card */}
          {/* <Card className="p-6 bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <IconKey size={24} className="text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-slate-900 mb-1">Authentication Provider</h4>
                  <p className="text-sm text-slate-600">Keycloak (OpenID Connect)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 px-4 py-1.5">
                  Active & Secure
                </Badge>
              </div>
            </div>
          </Card> */}
        </div>
      </div>
    </div>
  );
}
