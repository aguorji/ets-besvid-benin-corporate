// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Public Corporate Pages
import Home from './pages/Home';
import Products from './pages/Products';
import Services from './pages/Services';
import About from './pages/About';
import Contact from './pages/Contact';
import Team from './pages/Team';

// Administrative & Protected Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ConsignmentReconciliation from './pages/ConsignmentReconciliation';
import AuditLogs from './pages/AuditLogs';
import StaffTerminal from './pages/StaffTerminal';
import UserManagement from './pages/UserManagement';

// Standalone Security Layout Wrapper & Auth Context
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';

/**
 * 🎓 Role Dispatcher Component
 * Directs 'user' (staff) accounts to the simplified Staff Terminal
 * and 'admin' accounts to the main Executive Dashboard.
 */

const RoleBasedDashboard = () => {
  const { user } = useAuth();

  // Recognize both 'user' and 'staff' roles for the terminal view
  if (user?.role === 'user' || user?.role === 'staff') {
    return <StaffTerminal user={user} />;
  }

  return <Dashboard user={user} />;
};

/**
 * 🔒 Admin Guard Component
 * Restricts sensitive administrative management views strictly to Admin role.
 */
const AdminOnlyRoute = ({ children }) => {
  const { user } = useAuth();
  return user?.role === 'admin' ? children : <Navigate to="/dashboard" replace />;
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
    <AuthProvider>
      <Router>
        <Routes>
          {/* 1. Public Corporate Front Facing Routes */}
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/products" element={<PublicLayout><Products /></PublicLayout>} />
          <Route path="/services" element={<PublicLayout><Services /></PublicLayout>} />
          <Route path="/team" element={<PublicLayout><Team /></PublicLayout>} />
          <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />

          {/* 2. Isolated Authentication Route */}
          <Route path="/login" element={<Login />} />

          {/* 3. Secure Protected App Matrix */}
          <Route element={<ProtectedRoute />}>
            {/* Automatic Role Dispatcher: Staff -> StaffTerminal, Admin -> Executive Dashboard */}
            <Route path="/dashboard" element={<RoleBasedDashboard />} />
            <Route path="/terminal" element={<StaffTerminal />} />

            {/* Shared Operational Views */}
            <Route path="/consignment-reconciliation/:id" element={<ConsignmentReconciliation />} />
            {/* Old standalone pages removed — Consignments.jsx, PriceListManager.jsx,
                and SalesLedger.jsx were redundant with Dashboard/ConsignmentCommandCenter
                and used raw fetch() calls that never attached the auth token, so they'd
                now fail with 401 on every submit. Redirecting rather than leaving dead
                links, in case anything still links to these paths. */}
            <Route path="/consignments" element={<Navigate to="/dashboard" replace />} />
            <Route path="/pricelist" element={<Navigate to="/dashboard" replace />} />
            <Route path="/salesledger" element={<Navigate to="/dashboard" replace />} />

            {/* Admin Restricted Views */}
            <Route path="/users" element={<AdminOnlyRoute><UserManagement /></AdminOnlyRoute>} />
            <Route path="/audit-logs" element={<AdminOnlyRoute><AuditLogs /></AdminOnlyRoute>} />
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}