import React from 'react';
import { getUserRoles, getUserInfo, logout } from '../services/KeycloakService';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const userRoles = getUserRoles();
  const userInfo = getUserInfo();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="dashboard">
      <header className="header">
        <h1>Test App Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {userInfo?.name || userInfo?.username}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="content">
        <div className="user-details">
          <h2>Your Information</h2>
          <p><strong>Username:</strong> {userInfo?.username}</p>
          <p><strong>Email:</strong> {userInfo?.email}</p>
          <p><strong>Roles:</strong> {userRoles.join(', ')}</p>
        </div>

        <div className="navigation">
          <h2>Available Pages</h2>
          <div className="nav-links">
            {userRoles.includes('data-engineer') && (
              <Link to="/data-engineer" className="nav-link">
                Data Engineer Page
              </Link>
            )}
            {userRoles.includes('ai-engineer') && (
              <Link to="/ai-engineer" className="nav-link">
                AI Engineer Page
              </Link>
            )}
            {userRoles.includes('org-admin') && (
              <Link to="/org-admin" className="nav-link">
                Org Admin Page
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;