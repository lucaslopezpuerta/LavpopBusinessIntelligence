// usePullToRefresh.js v2.0 - STATE-DRIVEN ARCHITECTURE
// Hook for pull-to-refresh functionality on mobile
//
// FEATURES:
// - Pull down gesture triggers refresh callback
// - Visual feedback during pull (progress indicator)
// - Configurable pull threshold and resistance
// - Only active at top of scroll area
// - Haptic feedback when threshold reached
// - Disabled when modals are open
// - State-driven (matches useSwipeToClose pattern)
//
// USAGE:
// const { ref, pullDistance, progress, isPulling, isRefreshing, showIndicator, handlers } = usePullToRefresh(onRefresh);
// <div ref={ref} {...handlers}>...</div>
//
// CHANGELOG:
// v2.0 (2026-01-27): Complete rewrite - State-driven architecture
//   - Removed RAF-based DOM manipulation (caused conflicts with Framer Motion)
//   - Uses state for pullDistance (React 18 batching handles frequent updates)
//   - Matches useSwipeToClose pattern for consistency
//   - Simpler reset logic: just set state to 0
//   - No more race conditions or transform conflicts
// v1.6 (2026-01-27): Touch cancel fix (superseded by v2.0)
// v1.5 (2026-01-25): RAF batching optimization (superseded by v2.0)

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useMediaQuery } from './useMediaQuery';
import { haptics } from '../utils/haptics';

// Pull configuration
const PULL_THRESHOLD = 100;   // Distance in pixels to trigger refresh
const RESISTANCE = 3.0;       // Pull resistance factor (higher = more resistance)

/**
 * Hook for pull-to-refresh functionality
 * @param {Function} onRefresh - Async callback to execute on refresh
 * @returns {Object} Pull state, ref, and touch handlers
 */
export function usePullToRefresh(onRefresh) {
  // State - drives all rendering (React 18 batches efficiently)
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refs for touch tracking (don't need re-renders)
  const containerRef = useRef(null);
  const startYRef = useRef(0);
  const hasTriggeredHapticRef = useRef(false);

  const isMobile = useMediaQuery('(max-width: 1023px)');

  // Derived values
  const progress = useMemo(() =>
    Math.min(pullDistance / PULL_THRESHOLD, 1),
    [pullDistance]
  );

  const showIndicator = useMemo(() =>
    pullDistance > 10 || isRefreshing,
    [pullDistance, isRefreshing]
  );

  // Touch start - begin tracking
  const handleTouchStart = useCallback((e) => {
    if (!isMobile || isRefreshing) return;

    // Don't activate when modal is open
    const isModalOpen = document.body.style.position === 'fixed' ||
                        !!document.querySelector('[role="dialog"]');
    if (isModalOpen) return;

    // Only start if at top of scroll
    if (window.scrollY <= 0) {
      startYRef.current = e.touches[0].clientY;
      hasTriggeredHapticRef.current = false;
      setIsPulling(true);
    }
  }, [isMobile, isRefreshing]);

  // Touch move - update pull distance
  const handleTouchMove = useCallback((e) => {
    if (!isPulling || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const rawDistance = currentY - startYRef.current;
    const distance = Math.max(0, rawDistance / RESISTANCE);

    // Only pull if scrolled to top and pulling down
    if (window.scrollY <= 0 && distance > 0) {
      setPullDistance(distance);

      // Haptic feedback when crossing threshold
      if (distance >= PULL_THRESHOLD && !hasTriggeredHapticRef.current) {
        hasTriggeredHapticRef.current = true;
        haptics.tick();
      }

      // Prevent default scroll when pulling
      if (distance > 10 && e.cancelable) {
        e.preventDefault();
      }
    }
  }, [isPulling, isRefreshing]);

  // Touch end - trigger refresh or reset
  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      // Trigger refresh
      setIsRefreshing(true);
      setPullDistance(0);
      setIsPulling(false);

      try {
        await onRefresh?.();
      } finally {
        setIsRefreshing(false);
      }
    } else {
      // Cancelled pull - just reset
      setPullDistance(0);
      setIsPulling(false);
    }
  }, [isPulling, pullDistance, isRefreshing, onRefresh]);

  // Touch cancel - reset (gesture interrupted by system)
  const handleTouchCancel = useCallback(() => {
    setPullDistance(0);
    setIsPulling(false);
  }, []);

  // Attach touchmove with { passive: false } to allow preventDefault
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isMobile) return;

    const touchMoveHandler = (e) => {
      handleTouchMove(e);
    };

    container.addEventListener('touchmove', touchMoveHandler, { passive: false });

    return () => {
      container.removeEventListener('touchmove', touchMoveHandler);
    };
  }, [isMobile, handleTouchMove]);

  // Handlers for React events (touchstart, touchend, touchcancel)
  const handlers = useMemo(() => isMobile ? {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
  } : {}, [isMobile, handleTouchStart, handleTouchEnd, handleTouchCancel]);

  return {
    ref: containerRef,
    pullDistance,
    progress,
    isPulling,
    isRefreshing,
    showIndicator,
    handlers,
    threshold: PULL_THRESHOLD,
  };
}

export default usePullToRefresh;
