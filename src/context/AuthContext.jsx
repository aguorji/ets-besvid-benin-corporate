// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for an existing token on app initialization
  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem('ets_token');
      const storedUser = localStorage.getItem('ets_user');
      
      if (token && storedUser && storedUser !== "undefined") {
        try {
          const parsed = JSON.parse(storedUser);
          // Ensure token is attached inside user object for role/route guards
          setUser({ ...parsed, token });
        } catch (error) {
          localStorage.removeItem('ets_token');
          localStorage.removeItem('ets_user');
          localStorage.removeItem('userInfo');
        }
      } else {
        localStorage.removeItem('ets_token');
        localStorage.removeItem('ets_user');
        localStorage.removeItem('userInfo');
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  /**
   * Handles user authentication submission.
   */
  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const data = response.data;

      if (!data.token) {
        throw new Error("No token returned from server structure.");
      }

      // Store both for Axios client and backward compatibility with page components
      localStorage.setItem('ets_token', data.token);
      localStorage.setItem('ets_user', JSON.stringify(data));
      localStorage.setItem('userInfo', JSON.stringify(data));
      
      setUser(data);
      return { success: true, user: data };
    } catch (error) {
      const backendMessage = error.response?.data?.error || error.response?.data?.message;
      
      return {
        success: false,
        message: backendMessage || 'Authentication failed. Server unreachable.'
      };
    }
  };

  // Log user out and wipe local credentials cleanly
  const logout = () => {
    localStorage.removeItem('ets_token');
    localStorage.removeItem('ets_user');
    localStorage.removeItem('userInfo');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be executed within an active AuthProvider container');
  }
  return context;
};