import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import { Toaster } from './components/ui/toaster';

function App() {
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
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/landing" element={<LandingPage />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;

