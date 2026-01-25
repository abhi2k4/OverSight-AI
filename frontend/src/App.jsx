import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { 
  initKeycloak, 
  getUserInfo,
  canAccessAdmin,
  canAccessAI,
  canAccessData,
  canAccessMetadata,
  canAccessPolicies,
  canAccessCompliance,
  canAccessAlerts,
  canAccessAuditLogs,
  canAccessChatbot,
} from './services/KeycloakService';
import { useAppStore } from './store/appStore';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AIAgents from './pages/AIAgents';
import AgentDetail from './pages/AgentDetail';
import Datasets from './pages/Datasets';
import DatasetDetail from './pages/DatasetDetail';
import Policies from './pages/Policies';
import Alerts from './pages/Alerts';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';
import ChatbotMonitor from './pages/ChatbotMonitor';
import ComplianceManager from './pages/ComplianceManager';
import MetadataManager from './pages/MetadataManager';
import AdminDashboard from './pages/AdminDashboard';
import Unauthorized from './pages/Unauthorized';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from './components/ui/toaster';

function App() {
  const [keycloakInitialized, setKeycloakInitialized] = useState(false);
  const [initError, setInitError] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const setAuthenticated = useAppStore((state) => state.setAuthenticated);
  const setUser = useAppStore((state) => state.setUser);

  useEffect(() => {
    initKeycloak()
      .then((authenticated) => {
        if (authenticated) {
          const userInfo = getUserInfo();
          setAuthenticated(true);
          setUser(userInfo);
          setUserRoles(userInfo.roles);
          setKeycloakInitialized(true);
        } else {
          setInitError('Authentication failed');
        }
      })
      .catch((error) => {
        console.error('Keycloak initialization failed:', error);
        setInitError('Failed to initialize authentication');
      });
  }, [setAuthenticated, setUser]);

  if (initError) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#ef4444', marginBottom: '16px' }}>Authentication Error</h1>
        <p style={{ marginBottom: '8px' }}>{initError}</p>
        <p style={{ color: '#6b7280' }}>Please check your Keycloak configuration and try again.</p>
      </div>
    );
  }

  if (!keycloakInitialized) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h1 style={{ marginBottom: '16px' }}>Loading...</h1>
        <p style={{ color: '#6b7280' }}>Initializing authentication...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          <Route 
            path="admin" 
            element={
              <ProtectedRoute allow={canAccessAdmin(userRoles)}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="agents" 
            element={
              <ProtectedRoute allow={canAccessAI(userRoles)}>
                <AIAgents />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="agents/:id" 
            element={
              <ProtectedRoute allow={canAccessAI(userRoles)}>
                <AgentDetail />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="datasets" 
            element={
              <ProtectedRoute allow={canAccessData(userRoles)}>
                <Datasets />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="datasets/:id" 
            element={
              <ProtectedRoute allow={canAccessData(userRoles)}>
                <DatasetDetail />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="metadata" 
            element={
              <ProtectedRoute allow={canAccessMetadata(userRoles)}>
                <MetadataManager />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="policies" 
            element={
              <ProtectedRoute allow={canAccessPolicies(userRoles)}>
                <Policies />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="alerts" 
            element={
              <ProtectedRoute allow={canAccessAlerts(userRoles)}>
                <Alerts />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="audit-logs" 
            element={
              <ProtectedRoute allow={canAccessAuditLogs(userRoles)}>
                <AuditLogs />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="chatbot" 
            element={
              <ProtectedRoute allow={canAccessChatbot(userRoles)}>
                <ChatbotMonitor />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="compliance" 
            element={
              <ProtectedRoute allow={canAccessCompliance(userRoles)}>
                <ComplianceManager />
              </ProtectedRoute>
            } 
          />
          
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;

