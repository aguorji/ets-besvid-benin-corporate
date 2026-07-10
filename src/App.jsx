import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Public Corporate Pages
import Home from './pages/Home';
import Products from './pages/Products';
import About from './pages/About';
import Contact from './pages/Contact';
import Team from './pages/Team';

// Administrative Protected Pages
import Login from './pages/Login';

// Temporary Mock Dashboard View (Replace with your separate Dashboard file later)
const Dashboard = () => (
  <div className="p-8 max-w-4xl mx-auto">
    <h1 className="text-2xl font-bold text-gray-800">ETS Besvid Corporate Dashboard</h1>
    <p className="text-sm text-gray-600 mt-2">Secure Multi-Currency Management Console Active.</p>
    <button 
      onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
      className="mt-4 bg-red-600 text-white text-xs px-4 py-2 rounded font-bold uppercase tracking-wider"
    >
      Secure Disconnect / Logout
    </button>
  </div>
);

/**
 * 🛡️ Security Gatekeeper Wrapper
 * Intercepts unauthorized navigation attempts to administrative pages.
 */
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  if (!token || userRole !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

/**
 * 🏢 Public Navigation Master Frame Layout
 * Wraps your original corporate header, dynamic views, and system footer.
 */
const PublicLayout = ({ children }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-off-white flex flex-col justify-between">
      {/* Original Header & Brand Navigation Matrix */}
      <header className="bg-navy p-4 border-b border-gold/20">
        <div className="max-w-6xl mx-auto flex justify-between items-center text-white text-xs">
          <button onClick={() => navigate('/')} className="font-serif text-gold font-bold text-sm tracking-wider cursor-pointer bg-transparent border-none">
            ETS BESVID BENIN
          </button>
          <nav className="flex gap-4 font-bold uppercase tracking-wider">
            <button onClick={() => navigate('/')} className="cursor-pointer hover:text-gold bg-transparent border-none text-white">Home</button>
            <button onClick={() => navigate('/products')} className="cursor-pointer hover:text-gold bg-transparent border-none text-white">Products</button>
            <button onClick={() => navigate('/team')} className="cursor-pointer hover:text-gold bg-transparent border-none text-white">Our Team</button>
            <button onClick={() => navigate('/contact')} className="cursor-pointer hover:text-gold bg-transparent border-none text-white">Contact</button>
          </nav>
        </div>
      </header>

      {/* Main Dynamic Page Viewport */}
      <div className="flex-grow">
        {children}
      </div>

      {/* Standard Brand Footer */}
      <footer className="bg-navy text-white/40 text-[10px] text-center py-4 border-t border-white/5">
        &copy; 2026 ETS Besvid Benin. All Rights Reserved.
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        {/* 1. Public Corporate Front Facing Routes */}
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/products" element={<PublicLayout><Products /></PublicLayout>} />
        <Route path="/team" element={<PublicLayout><Team /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
        <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />

        {/* 2. Isolated Administrative Portal Routes (No Public Header/Footer) */}
        <Route path="/login" element={<Login />} />

        {/* 3. Securely Protected Ledger Dashboard Matrix */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}