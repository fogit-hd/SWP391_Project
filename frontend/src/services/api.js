import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const evAPI = {
  // Get all EVs
  getAllEVs: async () => {
    try {
      const response = await api.get('/evs');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get single EV by ID
  getEVById: async (id) => {
    try {
      const response = await api.get(`/evs/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create new EV
  createEV: async (evData) => {
    try {
      const response = await api.post('/evs', evData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update EV
  updateEV: async (id, evData) => {
    try {
      const response = await api.put(`/evs/${id}`, evData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete EV
  deleteEV: async (id) => {
    try {
      const response = await api.delete(`/evs/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default api;
