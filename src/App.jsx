import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Public Corporate Pages
import Home from './pages/Home';
import Products from './pages/Products';
import Services from './pages/Services';
import About from './pages/About';
import Contact from './pages/Contact';
import Team from './pages/Team';

// Administrative Protected Pages
import Login from './pages/Login';
import Consignments from './pages/Consignments';

// Temporary Mock Dashboard View
const Dashboard = () => {
  const navigate = useNavigate();
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ETS Besvid Corporate Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Secure Multi-Currency Management Console Active.</p>
        </div>
        <button 
          onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
          className="bg-red-600 text-white text-xs px-4 py-2 rounded font-bold uppercase tracking-wider cursor-pointer"
        >
          Secure Disconnect / Logout
        </button>
      </div>

      {/* Internal Management Control Links */}
      <div className="bg-white border border-gray-200 rounded p-4 flex gap-4 shadow-sm">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="bg-navy text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded cursor-pointer"
        >
          Overview Console
        </button>
        <button 
          onClick={() => navigate('/consignments')} 
          className="bg-gold text-navy text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded cursor-pointer"
        >
          Manage Shipments & Arrivals
        </button>
      </div>
    </div>
  );
};

/**
 * 🛡️ Security Gatekeeper Wrapper
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
 */
const PublicLayout = ({ children }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-off-white flex flex-col justify-between">
      <header className="bg-navy p-4 border-b border-gold/20">
        <div className="max-w-6xl mx-auto flex justify-between items-center text-white text-xs">
          <button onClick={() => navigate('/')} className="font-serif text-gold font-bold text-sm tracking-wider cursor-pointer bg-transparent border-none">
            ETS BESVID BENIN
          </button>
          <nav className="flex gap-4 font-bold uppercase tracking-wider">
            <button onClick={() => navigate('/')} className="cursor-pointer hover:text-gold bg-transparent border-none text-white">Home</button>
            <button onClick={() => navigate('/products')} className="cursor-pointer hover:text-gold bg-transparent border-none text-white">Products</button>
            <button onClick={() => navigate('/services')} className="cursor-pointer hover:text-gold bg-transparent border-none text-white">Services</button>
            <button onClick={() => navigate('/team')} className="cursor-pointer hover:text-gold bg-transparent border-none text-white">Our Team</button>
            <button onClick={() => navigate('/contact')} className="cursor-pointer hover:text-gold bg-transparent border-none text-white">Contact</button>
          </nav>
        </div>
      </header>

      <div className="flex-grow">
        {children}
      </div>

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
        <Route path="/services" element={<PublicLayout><Services /></PublicLayout>} />
        <Route path="/team" element={<PublicLayout><Team /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
        <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />

        {/* 2. Isolated Administrative Portal Routes */}
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
        <Route 
          path="/consignments" 
          element={
            <ProtectedRoute>
              <Consignments />
            </ProtectedRoute>
          } 
        />

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
