import { IconBell, IconHelpCircle, IconLogout } from '@tabler/icons-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const routeNames = {
  '/dashboard': 'Dashboard',
  '/agents': 'Agents Inventory',
  '/datasets': 'Datasets',
  '/policies': 'Policies',
  '/alerts': 'Alerts',
  '/audit-logs': 'Audit Logs',
};

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const setAuthenticated = useAppStore((state) => state.setAuthenticated);
  const currentPage = routeNames[location.pathname] || 'Dashboard';

  const handleLogout = () => {
    setAuthenticated(false, null);
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-500">Governance</span>
        <span className="text-slate-400">›</span>
        <span className="text-slate-900 font-medium">{currentPage}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative h-9 w-9 text-slate-600">
          <IconBell className="h-5 w-5" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-[10px] border-2 border-white">
            3
          </Badge>
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-600">
          <IconHelpCircle className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-slate-600 hover:text-red-600"
          onClick={handleLogout}
          title="Logout"
        >
          <IconLogout className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}

