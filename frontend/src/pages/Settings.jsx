import { useState } from 'react';
import { IconUser, IconKey, IconBell, IconPlus, IconTrash, IconRefresh, IconShield } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAppStore } from '../store/appStore';
import { logout } from '../services/KeycloakService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const tabs = [
  { id: 'profile', label: 'User Profile', icon: IconUser },
  { id: 'team', label: 'Team Management', icon: IconUser },
  { id: 'api', label: 'API Keys', icon: IconKey },
  { id: 'notifications', label: 'Notifications', icon: IconBell },
];

const teamMembers = [
  { id: 1, name: 'Sarah Koenig', email: 'sarah@oversight.ai', role: 'ADMIN', status: 'Active', lastActivity: '2 mins ago', avatar: 'SK' },
  { id: 2, name: 'Marcus Blackwell', email: 'marcus@oversight.ai', role: 'AUDITOR', status: 'Active', lastActivity: '4 hours ago', avatar: 'MB' },
  { id: 3, name: 'Jessica Tan', email: 'jtan@oversight.ai', role: 'DEVELOPER', status: 'Pending', lastActivity: 'Never', avatar: 'JT' },
];

const apiKeys = [
  { id: 1, name: 'Production SDK Key', key: 'sk_live_••••••••••••', lastUsed: '1hr ago', created: '14 May 2024' },
  { id: 2, name: 'Dev Environment', key: 'sk_test_••••••••••••', lastUsed: '0 mins', created: '14 May 2024' },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isKeyDialogOpen, setIsKeyDialogOpen] = useState(false);
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

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-6">
        <h2 className="text-3xl font-bold text-slate-900">Platform Settings</h2>
        <p className="text-slate-600 text-sm mt-1">
          Manage your enterprise configurations, team access, and API security.
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-8">
        <div className="flex gap-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-1 py-4 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-[#1E40AF] text-[#1E40AF]'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl">
          {/* User Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* User Info Card */}
              <Card className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">User Profile</h3>
                    <p className="text-sm text-slate-600">Your account information and authentication details</p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl">
                    {user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
                      <Input value={user?.username || 'N/A'} disabled className="bg-slate-50" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                      <Input value={user?.email || 'N/A'} disabled className="bg-slate-50" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                    <Input value={user?.name || 'N/A'} disabled className="bg-slate-50" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Last Login</label>
                    <Input 
                      value={user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'} 
                      disabled 
                      className="bg-slate-50" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">Assigned Roles</label>
                    <div className="flex flex-wrap gap-2">
                      {user?.roles && user.roles.length > 0 ? (
                        user.roles
                          .filter(role => ['org-admin', 'ai-engineer', 'data-engineer'].includes(role))
                          .map((role) => (
                            <Badge
                              key={role}
                              className={cn(
                                'px-3 py-1.5 text-xs font-semibold border',
                                getRoleBadgeColor(role)
                              )}
                            >
                              <IconShield size={14} className="mr-1" />
                              {role}
                            </Badge>
                          ))
                      ) : (
                        <span className="text-sm text-slate-500">No roles assigned</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-700">Authentication Provider</p>
                        <p className="text-xs text-slate-500 mt-1">Keycloak (OpenID Connect)</p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                        Active
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Role Permissions Card */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Role Permissions</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-700">Dashboard Access</span>
                    <Badge className="bg-emerald-100 text-emerald-700">Granted</Badge>
                  </div>
                  {user?.roles?.includes('org-admin') && (
                    <>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm font-medium text-slate-700">Admin Dashboard</span>
                        <Badge className="bg-emerald-100 text-emerald-700">Granted</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm font-medium text-slate-700">All Features</span>
                        <Badge className="bg-emerald-100 text-emerald-700">Full Access</Badge>
                      </div>
                    </>
                  )}
                  {user?.roles?.includes('ai-engineer') && (
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">AI Agents Management</span>
                      <Badge className="bg-emerald-100 text-emerald-700">Granted</Badge>
                    </div>
                  )}
                  {user?.roles?.includes('data-engineer') && (
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">Datasets Management</span>
                      <Badge className="bg-emerald-100 text-emerald-700">Granted</Badge>
                    </div>
                  )}
                </div>
              </Card>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  Logout
                </Button>
              </div>
            </div>
          )}

          {/* Team Management Tab */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Active Members</h3>
                  <p className="text-sm text-slate-600">You have {teamMembers.length} members in your organization team.</p>
                </div>
                <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#1E40AF] hover:bg-[#1e3a8a] gap-2">
                      <IconPlus className="w-4 h-4" />
                      Invite Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Team Member</DialogTitle>
                      <DialogDescription>
                        Send an invitation to a new team member to join your organization.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                        <Input placeholder="member@company.com" type="email" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                        <select className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm">
                          <option>Admin</option>
                          <option>Auditor</option>
                          <option>Developer</option>
                          <option>Viewer</option>
                        </select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
                      <Button className="bg-[#1E40AF] hover:bg-[#1e3a8a]" onClick={() => setIsInviteOpen(false)}>
                        Send Invitation
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">User</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Role</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Last Activity</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                              {member.avatar}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{member.name}</div>
                              <div className="text-sm text-slate-500">{member.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              member.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            )}
                          >
                            ● {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">{member.lastActivity}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <span className="text-slate-400">⋯</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-600">
                  <span>Showing 1-3 of 12 results</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Previous</Button>
                    <Button variant="outline" size="sm">Next</Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* API Keys Tab */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">API Integrations</h3>
                  <p className="text-sm text-slate-600">
                    Manage keys used for OverSight SDK and external model compliance tracking.
                  </p>
                </div>
                <Dialog open={isKeyDialogOpen} onOpenChange={setIsKeyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#1E40AF] hover:bg-[#1e3a8a] gap-2">
                      Generate New Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Generate New API Key</DialogTitle>
                      <DialogDescription>
                        Create a new API key for your application. Keep it secure and don't share it publicly.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Key Name</label>
                        <Input placeholder="e.g., Production Backend" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Environment</label>
                        <select className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm">
                          <option>Production</option>
                          <option>Staging</option>
                          <option>Development</option>
                        </select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsKeyDialogOpen(false)}>Cancel</Button>
                      <Button className="bg-[#1E40AF] hover:bg-[#1e3a8a]" onClick={() => setIsKeyDialogOpen(false)}>
                        Generate Key
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4">
                {apiKeys.map((key) => (
                  <Card key={key.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center">
                          <IconKey className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">{key.name}</h4>
                          <p className="text-sm text-slate-600 font-mono mt-1">{key.key}</p>
                          <p className="text-xs text-slate-500 mt-2">
                            Last used: {key.lastUsed} • Created: {key.created}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                          <IconRefresh className="w-4 h-4" />
                          Revoke
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Storage Usage Card */}
              <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-slate-900">Storage Usage</h4>
                    <p className="text-sm text-slate-600 mt-1">80GB of 100GB used</p>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </Card>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Global Notifications</h3>
                <p className="text-sm text-slate-600">Configure how you receive alerts and updates.</p>
              </div>

              <div className="space-y-4">
                <Card className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">Policy Violation Alerts</h4>
                      <p className="text-sm text-slate-600 mt-1">
                        Receive immediate notifications when an AI agent violates predefined organizational governance policies.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">Weekly Governance Summary</h4>
                      <p className="text-sm text-slate-600 mt-1">
                        A consolidated report of all activities, compliance scores, and new datasets registered over the last 7 days.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">Audit Trail Exports</h4>
                      <p className="text-sm text-slate-600 mt-1">
                        Get notified when a scheduled CSV or PDF export of the audit trail is ready for download.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </Card>
              </div>

              <div className="pt-4">
                <Button className="bg-[#1E40AF] hover:bg-[#1e3a8a]">Save Configuration</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
