// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth(); // 👈 Tap into our centralized login system

  // Local component states for form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!email || !password) {
      setError('Please fill in all security credential fields.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Execute network login request via our centralized Auth Context
      const result = await login(email, password);

      if (result.success) {
        // Direct the authenticated manager into the live dashboard console
        navigate('/dashboard');
      } else {
        // Display the specific error message returned by the backend layout
        setError(result.message);
      }
    } catch (err) {
      setError('A routing interruption occurred during validation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-off-white flex flex-col justify-center items-center p-4">
      <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-md w-full shadow-md space-y-6">
        
        {/* Header Title */}
        <div className="text-center">
          <h2 className="font-serif text-2xl font-bold text-navy">Corporate Terminal</h2>
          <p className="text-xs text-gray-500 mt-1 font-mono">Secure Access Gateway</p>
        </div>

        {/* Error Notification Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-xs font-mono">
            🚨 {error}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
              Admin Email Address
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@etsbesvid.com"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gold font-mono"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
              Security Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gold font-mono"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full mt-2 bg-navy text-white text-xs font-bold uppercase tracking-wider py-3 rounded cursor-pointer border-none transition-colors ${
              isSubmitting ? 'bg-navy/50 cursor-not-allowed animate-pulse' : 'hover:bg-navy/90'
            }`}
          >
            {isSubmitting ? 'Verifying Credentials...' : 'Establish Secure Connection'}
          </button>
        </form>

        {/* Quick Link back to public corporate website */}
        <div className="text-center pt-2 border-t border-gray-100">
          <button 
            onClick={() => navigate('/')}
            className="text-xs text-gray-400 hover:text-gold font-medium bg-transparent border-none cursor-pointer"
          >
            ← Return to Corporate Home
          </button>
        </div>

      </div>
    </div>
  );
}