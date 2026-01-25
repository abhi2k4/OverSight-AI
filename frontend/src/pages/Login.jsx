import { useNavigate } from 'react-router-dom';
import { getUserRoles, getUserInfo, logout } from '../services/KeycloakService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { User, Mail, Shield, LogOut } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const userRoles = getUserRoles();
  const userInfo = getUserInfo();

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to OverSight</CardTitle>
          <CardDescription>You are successfully authenticated</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <User className="h-5 w-5 text-slate-600" />
              <div className="flex-1">
                <p className="text-sm text-slate-500">Username</p>
                <p className="font-medium">{userInfo?.username || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <User className="h-5 w-5 text-slate-600" />
              <div className="flex-1">
                <p className="text-sm text-slate-500">Full Name</p>
                <p className="font-medium">{userInfo?.name || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Mail className="h-5 w-5 text-slate-600" />
              <div className="flex-1">
                <p className="text-sm text-slate-500">Email</p>
                <p className="font-medium">{userInfo?.email || 'N/A'}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-slate-600" />
                <p className="text-sm text-slate-500">Roles</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {userRoles.length > 0 ? (
                  userRoles.map((role) => (
                    <Badge key={role} variant="secondary">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No roles assigned</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Button 
              className="w-full" 
              onClick={handleGoToDashboard}
            >
              Go to Dashboard
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
