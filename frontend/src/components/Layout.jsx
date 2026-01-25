import { Outlet, Navigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
// import { getToken } from '../services/KeycloakService'; // BYPASSED: Keycloak auth
import CollapsibleSidebar from './CollapsibleSidebar';
import Header from './Header';

export default function Layout() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  // const token = getToken(); // BYPASSED: Keycloak token

  // BYPASSED: Skip token check - always authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen w-full flex overflow-hidden bg-slate-50">
      <CollapsibleSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

