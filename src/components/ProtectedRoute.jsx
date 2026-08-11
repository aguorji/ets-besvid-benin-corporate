// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  // 1. Wait until AuthContext finishes initializing from LocalStorage
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-400 flex justify-center items-center font-mono text-xs">
        Verifying Security Credentials...
      </div>
    );
  }

  // 2. If authenticated, render protected child routes; otherwise redirect to /login
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}