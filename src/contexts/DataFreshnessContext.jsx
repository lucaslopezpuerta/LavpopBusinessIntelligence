// DataFreshnessContext.jsx v1.1 - MEMOIZED CONTEXT VALUE
// Provides app-wide data refresh capabilities
//
// Features:
// - Centralized refresh trigger for all components
// - Smart refresh after user actions (campaigns, etc.)
// - Refresh status indicator for UI feedback
// - Allows child components to trigger refresh
// - Memoized context value (prevents unnecessary re-renders)
//
// CHANGELOG:
// v1.1 (2026-01-25): Performance optimization
//   - Memoized context value with useMemo
// v1.0: Initial implementation
//
// Usage in child components:
// const { refreshAfterAction } = useDataRefresh();
// await refreshAfterAction('campaign_sent'); // After sending a campaign

import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';

const DataFreshnessContext = createContext(null);

export function DataFreshnessProvider({ children }) {
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const refreshCallbackRef = useRef(null);

  // Register refresh callback from AppContent
  const registerRefreshCallback = useCallback((callback) => {
    refreshCallbackRef.current = callback;
  }, []);

  // Trigger refresh (called by child components)
  const triggerRefresh = useCallback(async (options = {}) => {
    const { reason = 'manual' } = options;

    if (refreshCallbackRef.current) {
      console.log(`[DataFreshness] Triggering refresh (reason: ${reason})`);
      setRefreshing(true);
      try {
        await refreshCallbackRef.current();
        setLastRefreshed(Date.now());
      } finally {
        setRefreshing(false);
      }
    } else {
      console.warn('[DataFreshness] No refresh callback registered');
    }
  }, []);

  // Refresh after user action (e.g., campaign sent)
  const refreshAfterAction = useCallback(async (actionName = 'action') => {
    console.log(`[DataFreshness] Refreshing after ${actionName}...`);
    // Small delay to let backend process
    await new Promise(resolve => setTimeout(resolve, 1000));
    return triggerRefresh({ reason: actionName });
  }, [triggerRefresh]);

  // Mark data as fresh (after load)
  const markFresh = useCallback(() => {
    setLastRefreshed(Date.now());
  }, []);

  // Get formatted last refresh time
  const getLastRefreshedText = useCallback(() => {
    if (!lastRefreshed) return 'Nunca';

    const seconds = Math.floor((Date.now() - lastRefreshed) / 1000);
    if (seconds < 60) return 'Agora';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min atrás`;

    const hours = Math.floor(minutes / 60);
    return `${hours}h atrás`;
  }, [lastRefreshed]);

  // Memoized context value - only recreates when dependencies change
  const value = useMemo(() => ({
    // State
    lastRefreshed,
    refreshing,

    // Actions
    triggerRefresh,
    markFresh,
    refreshAfterAction,
    registerRefreshCallback,

    // Helpers
    getLastRefreshedText,
  }), [
    lastRefreshed,
    refreshing,
    triggerRefresh,
    markFresh,
    refreshAfterAction,
    registerRefreshCallback,
    getLastRefreshedText
  ]);

  return (
    <DataFreshnessContext.Provider value={value}>
      {children}
    </DataFreshnessContext.Provider>
  );
}

export function useDataRefresh() {
  const context = useContext(DataFreshnessContext);
  if (!context) {
    throw new Error('useDataRefresh must be used within DataFreshnessProvider');
  }
  return context;
}

export default DataFreshnessContext;
