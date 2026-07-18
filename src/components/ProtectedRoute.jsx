// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Security wrapper that forces unauthenticated sessions back to the login gateway.
 */
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();

  // If the security engine confirms no active profile, force-route to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authorized, load the child route component seamlessly
  return <Outlet />;
};

export default ProtectedRoute;