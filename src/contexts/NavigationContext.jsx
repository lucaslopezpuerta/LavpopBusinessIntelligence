// NavigationContext.jsx v2.1 - 404 HANDLING
// Provides navigation state synced with React Router
//
// CHANGELOG:
// v2.1 (2025-12-22): 404 route handling
//   - Added isUnknownRoute flag for invalid paths
//   - Logs warning for unknown routes
//   - Auto-redirects to dashboard
// v2.0 (2025-12-16): URL routing integration
//   - Uses React Router for URL-based navigation
//   - Syncs activeTab with URL path
//   - Supports bookmarks, browser back/forward, refresh
//   - Maintains same API for backward compatibility
// v1.0 (2025-11-27): Initial implementation
//   - State-based navigation

import React, { createContext, useContext, useCallback, useMemo, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const NavigationContext = createContext();

// Route configuration - maps paths to tab IDs
const ROUTE_TO_TAB = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/customers': 'customers',
  '/clientes': 'customers',
  '/diretorio': 'diretorio',
  '/directory': 'diretorio',
  '/campaigns': 'campaigns',
  '/campanhas': 'campaigns',
  '/social': 'social',
  '/social-media': 'social',
  '/redes-sociais': 'social',
  '/weather': 'weather',
  '/clima': 'weather',
  '/intelligence': 'intelligence',
  '/inteligencia': 'intelligence',
  '/operations': 'operations',
  '/operacoes': 'operations',
  '/upload': 'upload',
  '/importar': 'upload',
};

// Tab to route mapping (canonical URLs)
const TAB_TO_ROUTE = {
  dashboard: '/',
  customers: '/customers',
  diretorio: '/diretorio',
  campaigns: '/campaigns',
  social: '/social',
  weather: '/weather',
  intelligence: '/intelligence',
  operations: '/operations',
  upload: '/upload',
};

export const NavigationProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const hasShownToast = useRef(false);

  // Derive activeTab from URL path
  const { activeTab, isUnknownRoute } = useMemo(() => {
    const path = location.pathname.toLowerCase();
    const tab = ROUTE_TO_TAB[path];
    return {
      activeTab: tab || 'dashboard',
      isUnknownRoute: !tab && path !== '/',
    };
  }, [location.pathname]);

  // Handle 404: log warning and redirect to dashboard
  useEffect(() => {
    if (isUnknownRoute && !hasShownToast.current) {
      hasShownToast.current = true;

      console.warn(`[Navigation] Unknown route "${location.pathname}", redirecting to Dashboard`);

      // Redirect to dashboard immediately
      navigate('/', { replace: true });
    }
  }, [isUnknownRoute, location.pathname, navigate]);

  // Reset flag when navigating to valid route
  useEffect(() => {
    if (!isUnknownRoute) {
      hasShownToast.current = false;
    }
  }, [isUnknownRoute]);

  // Navigate by changing URL
  const navigateTo = useCallback((tabId) => {
    const route = TAB_TO_ROUTE[tabId];
    if (route && route !== location.pathname) {
      navigate(route);
    }
  }, [navigate, location.pathname]);

  return (
    <NavigationContext.Provider value={{ activeTab, navigateTo, isUnknownRoute }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

// Export route config for use in App.jsx
export { TAB_TO_ROUTE, ROUTE_TO_TAB };
