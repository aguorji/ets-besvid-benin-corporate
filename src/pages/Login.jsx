// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Login Component
 * Renders the secure access gateway for administrative and staff terminal logins.
 */
export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Component state management for credentials, errors, and submission feedback
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handles secure form submission, prevents browser reloads, and invokes context login.
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevents standard form browser refresh behavior
    e.stopPropagation(); // Stops bubbling to parent forms
    setError('');
    setIsSubmitting(true);

    try {
      // Authenticate via Auth Context
      const result = await login(email, password);

      if (!result.success) {
        throw new Error(result.message);
      }

      const userRole = result.user?.role;

      // Role-based routing redirection
      if (userRole === 'admin') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/terminal', { replace: true });
      }

    } catch (err) {
      setError(err.message || 'Invalid email or password credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 font-sans">
      <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-md w-full shadow-2xl space-y-6">
        
        {/* Header Branding */}
        <div className="text-center">
          <h2 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">Corporate Terminal</h2>
          <p className="text-xs text-gray-500 mt-1 font-mono">Secure Access Gateway</p>
        </div>

        {/* Error Feedback Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs font-mono shadow-sm">
            🚨 {error}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
              User / Admin Email Address
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@etsbesvid.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 font-mono text-slate-900"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
              Security Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 font-mono text-slate-900"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full mt-2 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl cursor-pointer border-none transition-all shadow-md ${
              isSubmitting ? 'bg-slate-900/50 cursor-not-allowed animate-pulse' : 'hover:bg-slate-800'
            }`}
          >
            {isSubmitting ? 'Verifying Credentials...' : 'Establish Secure Connection'}
          </button>
        </form>

        {/* Home Navigation Link */}
        <div className="text-center pt-2 border-t border-gray-100">
          <button 
            type="button"
            onClick={() => navigate('/')}
            className="text-xs text-gray-400 hover:text-amber-600 font-medium bg-transparent border-none cursor-pointer transition"
          >
            ← Return to Corporate Home
          </button>
        </div>

      </div>
    </div>
  );
}