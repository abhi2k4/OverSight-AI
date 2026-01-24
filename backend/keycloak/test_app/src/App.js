import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initKeycloak } from './services/KeycloakService';
import Dashboard from './components/Dashboard';
import DataEngineerPage from './components/DataEngineerPage';
import AIEngineerPage from './components/AIEngineerPage';
import OrgAdminPage from './components/OrgAdminPage';
import RoleBasedRoute from './components/RoleBasedRoute';
import './App.css';

function App() {
  const [keycloakInitialized, setKeycloakInitialized] = useState(false);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    initKeycloak()
      .then((authenticated) => {
        if (authenticated) {
          setKeycloakInitialized(true);
        } else {
          setInitError('Authentication failed');
        }
      })
      .catch((error) => {
        console.error('Keycloak initialization failed:', error);
        setInitError('Failed to initialize authentication');
      });
  }, []);

  if (initError) {
    return (
      <div className="error-container">
        <h1>Authentication Error</h1>
        <p>{initError}</p>
        <p>Please check your Keycloak configuration and try again.</p>
      </div>
    );
  }

  if (!keycloakInitialized) {
    return (
      <div className="loading-container">
        <h1>Loading...</h1>
        <p>Initializing authentication...</p>
      </div>
    );
  }



  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          
          <Route 
            path="/data-engineer" 
            element={
              <RoleBasedRoute 
                allowedRoles={['data-engineer']} 
                fallback={<Navigate to="/" replace />}
              >
                <DataEngineerPage />
              </RoleBasedRoute>
            } 
          />
          
          <Route 
            path="/ai-engineer" 
            element={
              <RoleBasedRoute 
                allowedRoles={['ai-engineer']} 
                fallback={<Navigate to="/" replace />}
              >
                <AIEngineerPage />
              </RoleBasedRoute>
            } 
          />
          
          <Route 
            path="/org-admin" 
            element={
              <RoleBasedRoute 
                allowedRoles={['org-admin']} 
                fallback={<Navigate to="/" replace />}
              >
                <OrgAdminPage />
              </RoleBasedRoute>
            } 
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
