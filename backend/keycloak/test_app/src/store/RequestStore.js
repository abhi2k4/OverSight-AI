class RequestStore {
  constructor() {
    this.nextId = this.getNextId();
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem('oversightRequests');
      if (stored) {
        const data = JSON.parse(stored);
        this.datasetRequests = data.datasetRequests || [];
        this.agentRequests = data.agentRequests || [];
        this.nextId = data.nextId || 1;
      } else {
        this.datasetRequests = [];
        this.agentRequests = [];
      }
    } catch (error) {
      console.error('Error loading requests from storage:', error);
      this.datasetRequests = [];
      this.agentRequests = [];
    }
  }

  saveToStorage() {
    try {
      const data = {
        datasetRequests: this.datasetRequests,
        agentRequests: this.agentRequests,
        nextId: this.nextId
      };
      localStorage.setItem('oversightRequests', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving requests to storage:', error);
    }
  }

  getNextId() {
    try {
      const stored = localStorage.getItem('oversightRequests');
      if (stored) {
        const data = JSON.parse(stored);
        return data.nextId || 1;
      }
    } catch (error) {
      console.error('Error getting next ID:', error);
    }
    return 1;
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
    this.saveToStorage();
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
    this.saveToStorage();
    return request;
  }

  getAllRequests() {
    this.loadFromStorage(); // Refresh data from storage
    return [...this.datasetRequests, ...this.agentRequests];
  }

  updateRequestStatus(id, status) {
    this.loadFromStorage(); // Refresh data from storage
    const allRequests = [...this.datasetRequests, ...this.agentRequests];
    const request = allRequests.find(r => r.id === id);
    if (request) {
      request.status = status;
      
      // Update the request in the appropriate array
      if (request.type === 'dataset') {
        const index = this.datasetRequests.findIndex(r => r.id === id);
        if (index !== -1) {
          this.datasetRequests[index] = request;
        }
      } else if (request.type === 'agent') {
        const index = this.agentRequests.findIndex(r => r.id === id);
        if (index !== -1) {
          this.agentRequests[index] = request;
        }
      }
      
      this.saveToStorage();
      return true;
    }
    return false;
  }

  getDatasetRequests() {
    this.loadFromStorage(); // Refresh data from storage
    return this.datasetRequests;
  }

  getAgentRequests() {
    this.loadFromStorage(); // Refresh data from storage
    return this.agentRequests;
  }
}

const requestStore = new RequestStore();
export default requestStore;