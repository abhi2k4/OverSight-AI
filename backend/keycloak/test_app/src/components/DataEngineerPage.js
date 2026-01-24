import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserInfo } from '../services/KeycloakService';
import RequestStore from '../store/RequestStore';

const DataEngineerPage = () => {
  const [datasetName, setDatasetName] = useState('');
  const [message, setMessage] = useState('');
  const userInfo = getUserInfo();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!datasetName.trim()) {
      setMessage('Please enter a dataset name');
      return;
    }

    const request = RequestStore.createDatasetRequest(
      datasetName.trim(),
      userInfo?.username
    );

    setMessage(`Dataset request "${request.name}" created successfully!`);
    setDatasetName('');
  };

  const datasetRequests = RequestStore.getDatasetRequests();

  return (
    <div className="page">
      <header className="page-header">
        <h1>Data Engineer Page</h1>
        <Link to="/" className="back-link">← Back to Dashboard</Link>
      </header>

      <div className="content">
        <div className="section">
          <h2>Create Dataset Request</h2>
          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label htmlFor="datasetName">Dataset Name:</label>
              <input
                type="text"
                id="datasetName"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                placeholder="Enter dataset name"
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
          <h2>Your Dataset Requests</h2>
          {datasetRequests.length === 0 ? (
            <p>No dataset requests yet.</p>
          ) : (
            <div className="requests-list">
              {datasetRequests
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

export default DataEngineerPage;