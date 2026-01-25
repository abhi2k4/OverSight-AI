import { useNavigate } from 'react-router-dom';
import { IconShieldX, IconHome } from '@tabler/icons-react';
import { Button } from '../components/ui/button';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <IconShieldX size={48} className="text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Access Denied</h1>
          <p className="text-lg text-slate-600 mb-2">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-slate-500">
            Please contact your administrator if you believe this is an error.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            <IconHome size={20} />
            Go to Dashboard
          </Button>
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Go Back
          </Button>
        </div>

        <div className="mt-8 p-4 bg-slate-100 rounded-lg">
          <p className="text-xs text-slate-600">
            <strong>Need access?</strong> Contact your organization administrator to request the
            appropriate role permissions.
          </p>
        </div>
      </div>
    </div>
  );
}
