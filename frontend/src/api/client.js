import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  register: (userData) => apiClient.post('/auth/register', userData),
  me: () => apiClient.get('/auth/me'),
};

export const subordinateAPI = {
  getAll: () => apiClient.get('/subordinates'),
  create: (data) => apiClient.post('/subordinates', data),
  delete: (id) => apiClient.delete(`/subordinates/${id}`),
};

export const observationAPI = {
  getAll: () => apiClient.get('/observations'),
  create: (data) => apiClient.post('/observations', data),
  delete: (id) => apiClient.delete(`/observations/${id}`),
};

export const dashboardAPI = {
  getStats: () => apiClient.get('/dashboard/stats'),
};

export default apiClient;
