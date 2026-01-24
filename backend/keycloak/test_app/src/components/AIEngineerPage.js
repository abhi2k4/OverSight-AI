import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserInfo } from '../services/KeycloakService';
import RequestStore from '../store/RequestStore';

const AIEngineerPage = () => {
  const [agentName, setAgentName] = useState('');
  const [message, setMessage] = useState('');
  const userInfo = getUserInfo();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!agentName.trim()) {
      setMessage('Please enter an agent name');
      return;
    }

    const request = RequestStore.createAgentRequest(
      agentName.trim(),
      userInfo?.username
    );

    setMessage(`AI Agent request "${request.name}" created successfully!`);
    setAgentName('');
  };

  const agentRequests = RequestStore.getAgentRequests();

  return (
    <div className="page">
      <header className="page-header">
        <h1>AI Engineer Page</h1>
        <Link to="/" className="back-link">← Back to Dashboard</Link>
      </header>

      <div className="content">
        <div className="section">
          <h2>Create AI Agent Request</h2>
          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label htmlFor="agentName">Agent Name:</label>
              <input
                type="text"
                id="agentName"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="Enter AI agent name"
                className="form-input"
              />
            </div>
            <button type="submit" className="submit-btn">
              Create Request
            </button>
          </form>
          {message && <div className="message">{message}</div>}
        </div>

        <div className="section">
          <h2>Your AI Agent Requests</h2>
          {agentRequests.length === 0 ? (
            <p>No agent requests yet.</p>
          ) : (
            <div className="requests-list">
              {agentRequests
                .filter(req => req.createdBy === userInfo?.username)
                .map(request => (
                  <div key={request.id} className="request-item">
                    <h3>{request.name}</h3>
                    <p>Status: <span className={`status ${request.status.toLowerCase()}`}>
                      {request.status}
                    </span></p>
                    <p>Created: {new Date(request.createdAt).toLocaleString()}</p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIEngineerPage;