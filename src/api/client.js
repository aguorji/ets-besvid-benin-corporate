// src/api/client.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Authorization Bearer Token
apiClient.interceptors.request.use(
  (config) => {
    // 1. Primary token retrieval key
    let token = localStorage.getItem('ets_token'); 

    // 2. Structural fallback: extract token from ets_user or userInfo if ets_token is missing
    if (!token) {
      const storedUserRaw = localStorage.getItem('ets_user') || localStorage.getItem('userInfo');
      if (storedUserRaw && storedUserRaw !== "undefined") {
        try {
          const parsedUser = JSON.parse(storedUserRaw);
          token = parsedUser.token || parsedUser.tokenKey;
        } catch (e) {
          // Ignore JSON parse errors here
        }
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Clean wipe on 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Cleanly remove all auth state keys to prevent persistent redirect loops
      localStorage.removeItem('ets_token'); 
      localStorage.removeItem('ets_user');
      localStorage.removeItem('userInfo');

      // Only force redirect if not already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;