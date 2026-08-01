// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  // Prevent flash redirection while the session token verification pipeline resolves
  if (loading) {
    return (
      <div className="p-6 font-mono text-xs text-gray-400 animate-pulse bg-off-white min-h-screen flex items-center justify-center">
        Verifying secure terminal clearance...
      </div>
    );
  }

  // Enforce secure boundaries: stream child components or bounce to login portal
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}