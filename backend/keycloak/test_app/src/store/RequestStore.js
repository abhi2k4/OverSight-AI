class RequestStore {
  constructor() {
    this.datasetRequests = [];
    this.agentRequests = [];
    this.nextId = 1;
  }

  createDatasetRequest(name, createdBy) {
    const request = {
      id: this.nextId++,
      name,
      createdBy,
      status: 'PENDING',
      type: 'dataset',
      createdAt: new Date().toISOString(),
    };
    this.datasetRequests.push(request);
    return request;
  }

  createAgentRequest(name, createdBy) {
    const request = {
      id: this.nextId++,
      name,
      createdBy,
      status: 'PENDING',
      type: 'agent',
      createdAt: new Date().toISOString(),
    };
    this.agentRequests.push(request);
    return request;
  }

  getAllRequests() {
    return [...this.datasetRequests, ...this.agentRequests];
  }

  updateRequestStatus(id, status) {
    const allRequests = this.getAllRequests();
    const request = allRequests.find(r => r.id === id);
    if (request) {
      request.status = status;
      return true;
    }
    return false;
  }

  getDatasetRequests() {
    return this.datasetRequests;
  }

  getAgentRequests() {
    return this.agentRequests;
  }
}

const requestStore = new RequestStore();
export default requestStore;