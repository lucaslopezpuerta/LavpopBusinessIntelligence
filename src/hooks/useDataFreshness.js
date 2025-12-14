// useDataFreshness.js v1.0
// Smart data refresh hook for near-real-time updates
//
// Features:
// - Visibility-based refresh (when tab becomes visible after being hidden)
// - Periodic background refresh (configurable interval)
// - Staleness tracking with configurable threshold
// - Manual refresh with loading state
// - Prevents duplicate refreshes
//
// Usage:
// const { refresh, isStale, lastRefreshed, refreshing } = useDataFreshness({
//   onRefresh: async () => await loadData(),
//   staleTime: 5 * 60 * 1000,  // 5 minutes
//   refreshInterval: 10 * 60 * 1000,  // 10 minutes
// });

import { useState, useEffect, useCallback, useRef } from 'react';

const DEFAULT_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const DEFAULT_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes
const MIN_REFRESH_GAP = 30 * 1000; // 30 seconds minimum between refreshes

export function useDataFreshness({
  onRefresh,
  staleTime = DEFAULT_STALE_TIME,
  refreshInterval = DEFAULT_REFRESH_INTERVAL,
  enableVisibilityRefresh = true,
  enableAutoRefresh = true,
  enabled = true,
}) {
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);
  const lastRefreshAttemptRef = useRef(0);

  // Check if data is stale
  const isStale = useCallback(() => {
    if (!lastRefreshed) return true;
    return Date.now() - lastRefreshed > staleTime;
  }, [lastRefreshed, staleTime]);

  // Get time until next refresh
  const getTimeUntilStale = useCallback(() => {
    if (!lastRefreshed) return 0;
    const remaining = staleTime - (Date.now() - lastRefreshed);
    return Math.max(0, remaining);
  }, [lastRefreshed, staleTime]);

  // Core refresh function with deduplication
  const refresh = useCallback(async (options = {}) => {
    const { force = false, silent = false } = options;

    // Prevent duplicate refreshes
    if (refreshingRef.current) {
      console.log('[DataFreshness] Refresh already in progress, skipping');
      return false;
    }

    // Prevent too-frequent refreshes (unless forced)
    const timeSinceLastAttempt = Date.now() - lastRefreshAttemptRef.current;
    if (!force && timeSinceLastAttempt < MIN_REFRESH_GAP) {
      console.log('[DataFreshness] Too soon since last refresh, skipping');
      return false;
    }

    // Skip if data is fresh (unless forced)
    if (!force && !isStale()) {
      console.log('[DataFreshness] Data is fresh, skipping refresh');
      return false;
    }

    try {
      refreshingRef.current = true;
      lastRefreshAttemptRef.current = Date.now();

      if (!silent) {
        setRefreshing(true);
      }

      console.log('[DataFreshness] Starting refresh...');
      await onRefresh();

      setLastRefreshed(Date.now());
      console.log('[DataFreshness] Refresh completed');
      return true;

    } catch (error) {
      console.error('[DataFreshness] Refresh failed:', error);
      throw error;
    } finally {
      refreshingRef.current = false;
      if (!silent) {
        setRefreshing(false);
      }
    }
  }, [onRefresh, isStale]);

  // Visibility change handler
  useEffect(() => {
    if (!enabled || !enableVisibilityRefresh) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[DataFreshness] Tab became visible, checking staleness...');
        // Only refresh if stale when returning to tab
        if (isStale()) {
          console.log('[DataFreshness] Data is stale, triggering refresh');
          refresh({ silent: true }).catch(() => {});
        } else {
          console.log('[DataFreshness] Data is still fresh');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, enableVisibilityRefresh, isStale, refresh]);

  // Periodic refresh interval
  useEffect(() => {
    if (!enabled || !enableAutoRefresh || !refreshInterval) return;

    console.log(`[DataFreshness] Setting up auto-refresh every ${refreshInterval / 1000}s`);

    const intervalId = setInterval(() => {
      // Only auto-refresh if tab is visible
      if (document.visibilityState === 'visible') {
        console.log('[DataFreshness] Auto-refresh triggered');
        refresh({ silent: true }).catch(() => {});
      } else {
        console.log('[DataFreshness] Skipping auto-refresh (tab hidden)');
      }
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [enabled, enableAutoRefresh, refreshInterval, refresh]);

  // Mark data as fresh (called after initial load)
  const markFresh = useCallback(() => {
    setLastRefreshed(Date.now());
  }, []);

  // Force immediate refresh
  const forceRefresh = useCallback(() => {
    return refresh({ force: true });
  }, [refresh]);

  return {
    refresh,
    forceRefresh,
    markFresh,
    isStale: isStale(),
    lastRefreshed,
    refreshing,
    getTimeUntilStale,
  };
}

export default useDataFreshness;
