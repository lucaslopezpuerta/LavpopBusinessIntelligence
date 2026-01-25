// NavigationContext.jsx v2.5 - TRANSITIONING FLAG
// Provides navigation state synced with React Router
//
// CHANGELOG:
// v2.5 (2026-01-25): Transitioning flag for BottomNavBar fade fix
//   - Added isTransitioning state and setIsTransitioning function
//   - App.jsx sets true on navigation, false on animation complete
//   - BottomNavItem disables CSS transitions when isTransitioning=true
//   - Fixes BottomNavBar fade during page transitions
// v2.4 (2026-01-25): Ref-based direction getter
//   - Direction exposed via getNavigationDirection() function instead of value
//   - Prevents BottomNavBar/IconSidebar re-renders during page transitions
//   - Context value only changes on actual tab navigation, not direction changes
// v2.3 (2026-01-24): Memoized context value
//   - Context value now memoized to prevent unnecessary re-renders
//   - Fixes BottomNavBar flicker during page transitions
// v2.2 (2026-01-24): Direction-aware navigation
//   - Added TAB_ORDER for index-based direction calculation
//   - Tracks previousTab for direction computation
//   - Exposes navigationDirection (1=forward, -1=backward, 0=initial)
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

import React, { createContext, useContext, useCallback, useMemo, useEffect, useRef, useState } from 'react';
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

  // Transitioning flag - true during page transition animations
  // Used by BottomNavItem to disable CSS transitions during page navigation
  const [isTransitioning, setIsTransitioning] = useState(false);

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
  } else if (prevTab === activeTab) {
    // Reset direction when staying on same tab
    directionRef.current = 0;
  }

  // Getter function - stable reference, doesn't trigger re-renders in consumers
  // Only App.jsx needs this for page transition animations
  const getNavigationDirection = useCallback(() => directionRef.current, []);

  // Update previousTab after render (direction already calculated)
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
  const navigateTo = useCallback((tabId) => {
    const route = TAB_TO_ROUTE[tabId];
    if (route && route !== location.pathname) {
      navigate(route);
    }
  }, [navigate, location.pathname]);

  // Memoize context value to prevent unnecessary re-renders of consumers
  // (BottomNavBar, IconSidebar, etc.) during page transitions
  // NOTE: getNavigationDirection is a stable function ref - direction changes
  // don't cause context value to change, so consumers don't re-render
  // NOTE: setIsTransitioning is stable (from useState), doesn't cause re-renders
  const contextValue = useMemo(() => ({
    activeTab,
    navigateTo,
    isUnknownRoute,
    getNavigationDirection,
    isTransitioning,
    setIsTransitioning
  }), [activeTab, navigateTo, isUnknownRoute, getNavigationDirection, isTransitioning]);

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
