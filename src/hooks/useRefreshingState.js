// useRefreshingState.js v1.0 - UNIFIED REFRESH STATE HOOK
// Combines DataFreshnessContext with animation triggers for UI feedback
//
// Features:
// - Exposes isRefreshing boolean from DataFreshnessContext
// - Tracks stale data (older than 15 minutes)
// - Provides animationKey for triggering CSS/Framer animations
// - Memoized for performance
//
// CHANGELOG:
// v1.0 (2026-01-31): Initial implementation
//   - Unified hook for background refresh state
//   - Animation key for triggering visual feedback
//   - Stale data detection
//
// Usage:
// const { isRefreshing, isStale, animationKey } = useRefreshingState();

import { useState, useEffect, useMemo } from 'react';
import { useDataRefresh } from '../contexts/DataFreshnessContext';

// Stale threshold: 15 minutes
const STALE_THRESHOLD_MS = 15 * 60 * 1000;

/**
 * Unified hook for background refresh state
 *
 * @returns {Object} Refresh state object
 * @property {boolean} isRefreshing - True when background refresh is active
 * @property {boolean} isStale - True when data is older than 15 minutes
 * @property {number} animationKey - Increments on each refresh (for triggering animations)
 * @property {number|null} lastRefreshed - Timestamp of last successful refresh
 * @property {function} triggerRefresh - Function to manually trigger refresh
 */
export function useRefreshingState() {
  const {
    refreshing,
    lastRefreshed,
    triggerRefresh,
    getLastRefreshedText
  } = useDataRefresh();

  // Animation key increments on each refresh start to trigger CSS/Framer animations
  const [animationKey, setAnimationKey] = useState(0);

  // Increment animation key when refresh starts
  useEffect(() => {
    if (refreshing) {
      setAnimationKey(k => k + 1);
    }
  }, [refreshing]);

  // Calculate stale state
  const isStale = useMemo(() => {
    if (!lastRefreshed) return false;
    return (Date.now() - lastRefreshed) > STALE_THRESHOLD_MS;
  }, [lastRefreshed]);

  // Memoized return value
  return useMemo(() => ({
    isRefreshing: refreshing,
    isStale,
    animationKey,
    lastRefreshed,
    lastRefreshedText: getLastRefreshedText(),
    triggerRefresh,
  }), [refreshing, isStale, animationKey, lastRefreshed, getLastRefreshedText, triggerRefresh]);
}

export default useRefreshingState;
