// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../api/client';

// Create the authentication context object
const AuthContext = createContext(null);

/**
 * AuthProvider Component
 * Manages global authentication state, token persistence, login execution, and logout logic.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize and validate stored user session tokens upon component mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('ets_token') || localStorage.getItem('token');
        const storedUser = localStorage.getItem('ets_user') || localStorage.getItem('userInfo');
        
        if (token && storedUser && storedUser !== "undefined") {
          const parsed = JSON.parse(storedUser);
          const normalizedUser = {
            id: parsed.id || parsed._id || parsed.user?._id,
            name: parsed.name || parsed.user?.name,
            email: parsed.email || parsed.user?.email,
            role: parsed.role || parsed.user?.role || 'user',
            token: token
          };

          // Synchronize keys across local storage mechanisms
          localStorage.setItem('ets_token', token);
          localStorage.setItem('ets_user', JSON.stringify(normalizedUser));
          
          setUser(normalizedUser);
        } else {
          // Clear invalid or expired tokens
          localStorage.removeItem('ets_token');
          localStorage.removeItem('ets_user');
          localStorage.removeItem('userInfo');
          setUser(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        localStorage.clear();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Executes user authentication. Supports either email/password credentials or pre-fetched user payloads.
   */
  const login = async (emailOrPayload, password) => {
    try {
      let data, token;

      // Handle direct payload objects vs. credential string inputs
      if (typeof emailOrPayload === 'object' && emailOrPayload !== null) {
        data = emailOrPayload;
        token = data.token || data.accessToken;
      } else {
        const response = await apiClient.post('/auth/login', { email: emailOrPayload, password });
        data = response.data;
        token = data.token || data.accessToken;
      }

      if (!token) {
        throw new Error("No token returned from server structure.");
      }

      const userPayload = {
        id: data.id || data._id || data.user?._id,
        name: data.name || data.user?.name,
        email: data.email || data.user?.email,
        role: data.role || data.user?.role || 'user',
        token: token
      };

      // Persist user details and tokens securely in local storage
      localStorage.setItem('ets_token', token);
      localStorage.setItem('ets_user', JSON.stringify(userPayload));
      localStorage.setItem('userInfo', JSON.stringify(userPayload));
      
      setUser(userPayload);
      return { success: true, user: userPayload };
    } catch (error) {
      const backendMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      return {
        success: false,
        message: backendMessage || 'Authentication failed. Server unreachable.'
      };
    }
  };

  /**
   * Clears active sessions and redirects the user back to the login gateway.
   */
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

/**
   * Custom hook to consume authentication context safely across components.
   */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be executed within an active AuthProvider container');
  }
  return context;
};