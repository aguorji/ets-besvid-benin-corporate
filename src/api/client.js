// src/api/client.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000, 
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    // CRITICAL: Double check this key! 
    // If your Login.jsx saves it as localStorage.setItem('token', ...), change this to 'token'.
    // If your Login.jsx saves it as 'ets_token', leave it as 'ets_token'.
    const token = localStorage.getItem('ets_token'); 
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Must use the exact same key name here to clear it out on failure
      localStorage.removeItem('ets_token'); 
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;