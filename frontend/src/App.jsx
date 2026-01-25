import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { initKeycloak, getToken } from './services/KeycloakService'; // BYPASSED: Keycloak auth
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
import Login from './pages/Login';
import { Toaster } from './components/ui/toaster';

function App() {
  const [keycloakInitialized, setKeycloakInitialized] = useState(true); // BYPASSED: Set to true directly
  const [initError, setInitError] = useState(null);
  const setAuthenticated = useAppStore((state) => state.setAuthenticated);

  useEffect(() => {
    // BYPASSED: Keycloak initialization - directly set authenticated
    setAuthenticated(true);
    setKeycloakInitialized(true);
    
    /* ORIGINAL KEYCLOAK CODE - COMMENTED OUT
    initKeycloak()
      .then((authenticated) => {
        if (authenticated) {
          setAuthenticated(true);
          setKeycloakInitialized(true);
        } else {
          setInitError('Authentication failed');
        }
      })
      .catch((error) => {
        console.error('Keycloak initialization failed:', error);
        setInitError('Failed to initialize authentication');
      });
    */
  }, [setAuthenticated]);

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
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="agents" element={<AIAgents />} />
          <Route path="agents/:id" element={<AgentDetail />} />
          <Route path="datasets" element={<Datasets />} />
          <Route path="datasets/:id" element={<DatasetDetail />} />
          <Route path="policies" element={<Policies />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="chatbot" element={<ChatbotMonitor />} />
          <Route path="compliance" element={<ComplianceManager />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;

