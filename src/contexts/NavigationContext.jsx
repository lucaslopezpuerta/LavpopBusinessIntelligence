// NavigationContext.jsx v3.1 - URL-BASED NAVIGATION (SIMPLIFIED)
// Provides navigation state synced with React Router
//
// FEATURES:
// - URL-based tab navigation with React Router
// - Memoized context value for performance
// - 404 handling with redirect to dashboard
//
// CHANGELOG:
// v3.1 (2026-01-27): Simplified for navigation refactoring
//   - Removed direction-aware navigation (TAB_ORDER, getTabIndex, getNavigationDirection)
//   - Page transitions now use "Cosmic Emergence" fade animation
// v2.7 (2026-01-25): Stable navigateTo callback via ref
// v2.1 (2025-12-22): 404 route handling
// v2.0 (2025-12-16): URL routing integration
// v1.0 (2025-11-27): Initial implementation

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
  '/insights': 'insights',
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
  insights: '/insights',
  operations: '/operations',
  upload: '/upload',
};

export const NavigationProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const hasShownToast = useRef(false);
  const locationRef = useRef(location.pathname);

  // Keep locationRef current (used by navigateTo to avoid recreating callback)
  locationRef.current = location.pathname;

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
  // Uses ref for pathname to keep callback stable (prevents context re-renders)
  const navigateTo = useCallback((tabId) => {
    const route = TAB_TO_ROUTE[tabId];
    if (route && route !== locationRef.current) {
      navigate(route);
    }
  }, [navigate]);

  // Memoize context value to prevent unnecessary re-renders during page transitions
  const contextValue = useMemo(() => ({
    activeTab,
    navigateTo,
    isUnknownRoute,
  }), [activeTab, navigateTo, isUnknownRoute]);

  return (
    <NavigationContext.Provider value={contextValue}>
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
