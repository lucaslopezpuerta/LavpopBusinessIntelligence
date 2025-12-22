// usePullToRefresh.js v1.1 - HAPTIC FEEDBACK
// Hook for pull-to-refresh functionality on mobile
//
// FEATURES:
// - Pull down gesture triggers refresh callback
// - Visual feedback during pull (progress indicator)
// - Configurable pull threshold
// - Only active at top of scroll area
// - Works with touch events
// - Haptic feedback when threshold reached (v1.1)
//
// USAGE:
// const { pullDistance, isPulling, isRefreshing, handlers } = usePullToRefresh(onRefresh);
//
// CHANGELOG:
// v1.1 (2025-12-22): Added haptic feedback when pull threshold reached
// v1.0 (2025-12-18): Initial implementation

import { useState, useCallback, useRef } from 'react';
import { useMediaQuery } from './useMediaQuery';
import { haptics } from '../utils/haptics';

// Pull configuration
const PULL_THRESHOLD = 80;    // Distance in pixels to trigger refresh
const RESISTANCE = 2.5;       // Pull resistance factor

/**
 * Hook for pull-to-refresh functionality
 * @param {Function} onRefresh - Callback to execute on refresh
 * @returns {Object} Pull state and touch handlers
 */
export function usePullToRefresh(onRefresh) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startY = useRef(0);
  const currentY = useRef(0);
  const hasTriggeredHaptic = useRef(false);
  const isMobile = useMediaQuery('(max-width: 1023px)');

  const handleTouchStart = useCallback((e) => {
    if (!isMobile || isRefreshing) return;

    // Only start if at top of scroll
    if (window.scrollY <= 0) {
      startY.current = e.touches[0].clientY;
      hasTriggeredHaptic.current = false;
      setIsPulling(true);
    }
  }, [isMobile, isRefreshing]);

  const handleTouchMove = useCallback((e) => {
    if (!isPulling || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, (currentY.current - startY.current) / RESISTANCE);

    // Only pull if scrolled to top
    if (window.scrollY <= 0 && distance > 0) {
      setPullDistance(distance);

      // Haptic feedback when crossing threshold
      if (distance >= PULL_THRESHOLD && !hasTriggeredHaptic.current) {
        hasTriggeredHaptic.current = true;
        haptics.tick();
      }

      // Prevent default scroll when pulling
      if (distance > 10) {
        e.preventDefault();
      }
    }
  }, [isPulling, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);

      try {
        await onRefresh?.();
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
    setIsPulling(false);
  }, [isPulling, pullDistance, isRefreshing, onRefresh]);

  // Calculate progress (0 to 1)
  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);

  // Should show indicator
  const showIndicator = pullDistance > 10 || isRefreshing;

  const handlers = isMobile ? {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  } : {};

  return {
    pullDistance,
    isPulling,
    isRefreshing,
    progress,
    showIndicator,
    handlers,
    threshold: PULL_THRESHOLD,
  };
}

export default usePullToRefresh;
