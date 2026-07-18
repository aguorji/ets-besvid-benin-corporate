// src/api/client.js
import axios from 'axios';

// Create a centralized instance pointing to your Node.js backend
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000, // 10 second timeout guard
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor: Automatically attaches the authorization token
 * from localStorage to every outgoing request before it hits your backend protectGate.
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ets_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor: Catches errors globally. If the server says a token 
 * is expired or invalid (401), it automatically cleans up local storage.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect if unauthorized
      localStorage.removeItem('ets_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;