// NavigationContext.jsx v3.0 - URL-BASED NAVIGATION
// Provides navigation state synced with React Router
//
// FEATURES:
// - URL-based tab navigation with React Router
// - Direction-aware transitions (forward/backward) via ref
// - Memoized context value for performance
// - 404 handling with redirect to dashboard
//
// CHANGELOG:
// v3.0 (2026-01-27): Simplified after BottomNavBarV2 migration
//   - Removed historical flicker-fix changelog entries
//   - Context value and callbacks remain optimized
// v2.7 (2026-01-25): Stable navigateTo callback via ref
// v2.2 (2026-01-24): Direction-aware navigation
// v2.1 (2025-12-22): 404 route handling
// v2.0 (2025-12-16): URL routing integration
// v1.0 (2025-11-27): Initial implementation

import React, { createContext, useContext, useCallback, useMemo, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Tab order determines navigation direction
// Forward = higher index, Backward = lower index
const TAB_ORDER = [
  'dashboard',    // 0
  'customers',    // 1
  'diretorio',    // 2
  'campaigns',    // 3
  'social',       // 4
  'weather',      // 5
  'intelligence', // 6
  'operations',   // 7
  'upload'        // 8
];

const getTabIndex = (tabId) => TAB_ORDER.indexOf(tabId);

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
  const previousTabRef = useRef(null);
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

  // Store direction in ref - calculated once per activeTab change
  // This ensures stable value for context memoization
  const directionRef = useRef(0);

  // Calculate direction when activeTab changes
  // Uses previousTabRef (old value) before it's updated in the effect below
  const prevTab = previousTabRef.current;
  if (prevTab !== null && prevTab !== activeTab) {
    const prevIndex = getTabIndex(prevTab);
    const currIndex = getTabIndex(activeTab);
    if (prevIndex !== -1 && currIndex !== -1) {
      directionRef.current = currIndex > prevIndex ? 1 : -1;
    }
  }

  // Getter function - stable reference for page transition animations
  // Returns: 1 (forward), -1 (backward), 0 (initial)
  const getNavigationDirection = useCallback(() => directionRef.current, []);

  // Update previousTab after render (direction already calculated above)
  useEffect(() => {
    previousTabRef.current = activeTab;
  }, [activeTab]);

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
  // NOTE: getNavigationDirection is a stable function ref - direction changes
  // don't cause context value to change
  const contextValue = useMemo(() => ({
    activeTab,
    navigateTo,
    isUnknownRoute,
    getNavigationDirection
  }), [activeTab, navigateTo, isUnknownRoute, getNavigationDirection]);

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
