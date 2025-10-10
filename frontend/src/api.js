import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add language header to all requests
api.interceptors.request.use((config) => {
  const language = localStorage.getItem('language') || 'tr';
  config.headers['Accept-Language'] = language;
  
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
};

// Public API (no auth required)
export const publicAPI = {
  shortenUrl: (originalUrl) => api.post('/public/shorten', { original_url: originalUrl }),
};

// User API
export const userAPI = {
  shortenUrl: (originalUrl) => api.post('/user/shorten', { original_url: originalUrl }),
  getStats: (shortCode) => api.get(`/user/stats/${shortCode}`),
  getUserUrls: () => api.get('/user/urls'),
};

export default api;