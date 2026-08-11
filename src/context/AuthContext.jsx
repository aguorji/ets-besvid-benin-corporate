// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        // Check multiple fallback storage names used across components
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

          // Synchronize keys so both client and context match
          localStorage.setItem('ets_token', token);
          localStorage.setItem('ets_user', JSON.stringify(normalizedUser));
          
          setUser(normalizedUser);
        } else {
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

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const data = response.data;
      const token = data.token || data.accessToken;

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

      localStorage.setItem('ets_token', token);
      localStorage.setItem('ets_user', JSON.stringify(userPayload));
      localStorage.setItem('userInfo', JSON.stringify(userPayload));
      
      setUser(userPayload);
      return { success: true, user: userPayload };
    } catch (error) {
      const backendMessage = error.response?.data?.error || error.response?.data?.message;
      return {
        success: false,
        message: backendMessage || 'Authentication failed. Server unreachable.'
      };
    }
  };

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