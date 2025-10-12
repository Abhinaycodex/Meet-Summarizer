import axios from 'axios';

const API_URL =  'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Summary API methods
export const summaryAPI = {
  uploadFile: async (file, title, participants) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('participants', JSON.stringify(participants));

    return api.post('/summaries/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  summarizeText: async (text, title, participants) => {
    return api.post('/summaries/text', { text, title, participants });
  },

  getAllSummaries: async (page = 1, limit = 10, status) => {
    return api.get('/summaries', { params: { page, limit, status } });
  },

  getSummaryById: async (id) => {
    return api.get(`/summaries/${id}`);
  },

  updateSummary: async (id, updates) => {
    return api.put(`/summaries/${id}`, updates);
  },

  deleteSummary: async (id) => {
    return api.delete(`/summaries/${id}`);
  },

  getProcessingStatus: async (id) => {
    return api.get(`/summaries/status/${id}`);
  },
};

export default api;