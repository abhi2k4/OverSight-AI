import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import RequestStore from '../store/RequestStore';

const OrgAdminPage = () => {
  const [message, setMessage] = useState('');
  const [requests, setRequests] = useState(RequestStore.getAllRequests());

  const handleStatusChange = (requestId, newStatus) => {
    const success = RequestStore.updateRequestStatus(requestId, newStatus);
    if (success) {
      setRequests([...RequestStore.getAllRequests()]);
      setMessage(`Request status updated to ${newStatus}`);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const pendingRequests = requests.filter(req => req.status === 'PENDING');
  const processedRequests = requests.filter(req => req.status !== 'PENDING');

  return (
    <div className="page">
      <header className="page-header">
        <h1>Organization Admin Page</h1>
        <Link to="/" className="back-link">← Back to Dashboard</Link>
      </header>

      <div className="content">
        {message && <div className="message success">{message}</div>}

        <div className="section">
          <h2>Pending Requests ({pendingRequests.length})</h2>
          {pendingRequests.length === 0 ? (
            <p>No pending requests.</p>
          ) : (
            <div className="requests-list">
              {pendingRequests.map(request => (
                <div key={request.id} className="request-item pending">
                  <div className="request-header">
                    <h3>{request.name}</h3>
                    <span className="request-type">{request.type}</span>
                  </div>
                  <p>Created by: {request.createdBy}</p>
                  <p>Created: {new Date(request.createdAt).toLocaleString()}</p>
                  <p>Status: <span className="status pending">PENDING</span></p>
                  <div className="actions">
                    <button
                      onClick={() => handleStatusChange(request.id, 'APPROVED')}
                      className="approve-btn"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusChange(request.id, 'REJECTED')}
                      className="reject-btn"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="section">
          <h2>Processed Requests ({processedRequests.length})</h2>
          {processedRequests.length === 0 ? (
            <p>No processed requests yet.</p>
          ) : (
            <div className="requests-list">
              {processedRequests.map(request => (
                <div key={request.id} className="request-item processed">
                  <div className="request-header">
                    <h3>{request.name}</h3>
                    <span className="request-type">{request.type}</span>
                  </div>
                  <p>Created by: {request.createdBy}</p>
                  <p>Created: {new Date(request.createdAt).toLocaleString()}</p>
                  <p>Status: <span className={`status ${request.status.toLowerCase()}`}>
                    {request.status}
                  </span></p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrgAdminPage;