// ProtectedRoute.jsx v1.0 - Route Protection Wrapper
// Redirects unauthenticated users to login page
//
// Features:
// - Shows loading skeleton while checking auth
// - Redirects to /login if not authenticated
// - Renders children if authenticated
//
// CHANGELOG:
// v1.1 (2025-12-26): Remove initial HTML loader for seamless transition
// v1.0 (2025-12-26): Initial implementation

import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingScreen from '../ui/LoadingScreen';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Remove HTML initial loader when React takes over
  useEffect(() => {
    if (window.removeInitialLoader) {
      window.removeInitialLoader();
    }
  }, []);

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <LoadingScreen
        progress={{
          loaded: 0,
          total: 3,
          percent: 0,
          tableStates: {}
        }}
      />
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render protected content
  return children;
};

export default ProtectedRoute;
