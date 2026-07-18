// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for an existing token on app initialization
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('ets_token');
      if (token) {
        try {
          // Verify token validity against a profile/me checkpoint if available
          // For now, we assume the token is active if present
          const storedUser = localStorage.getItem('ets_user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        } catch (error) {
          localStorage.removeItem('ets_token');
          localStorage.removeItem('ets_user');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  /**
   * Handles user authentication submission.
   * @param {string} email 
   * @param {string} password 
   */
  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;

      localStorage.setItem('ets_token', token);
      localStorage.setItem('ets_user', JSON.stringify(userData));
      
      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Authentication failed. Server unreachable.'
      };
    }
  };

  // Log user out and wipe local credentials cleanly
  const logout = () => {
    localStorage.removeItem('ets_token');
    localStorage.removeItem('ets_user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook for rapid context deployment across UI panels
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be executed within an active AuthProvider container');
  }
  return context;
};