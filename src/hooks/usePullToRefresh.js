// usePullToRefresh.js v1.5 - RAF BATCHING OPTIMIZATION
// Hook for pull-to-refresh functionality on mobile
//
// FEATURES:
// - Pull down gesture triggers refresh callback
// - Visual feedback during pull (progress indicator)
// - Configurable pull threshold
// - Only active at top of scroll area
// - Works with touch events
// - Haptic feedback when threshold reached (v1.1)
// - Disabled when modals are open (v1.2)
// - Non-passive touchmove for preventDefault support (v1.3)
// - RAF-batched UI updates (v1.5)
//
// USAGE:
// const { ref, pullDistance, isPulling, isRefreshing, handlers } = usePullToRefresh(onRefresh);
// <div ref={ref} {...handlers}>...</div>
//
// CHANGELOG:
// v1.5 (2026-01-25): Performance optimization
//   - Use ref for pullDistance to avoid 60+ setState/sec during touch
//   - Batch UI updates with requestAnimationFrame
//   - Only trigger state updates for threshold crossing (showIndicator)
//   - Prevents frame drops on mid-range Android devices
// v1.4 (2026-01-25): Reduce sensitivity
//   - Increased threshold from 80px to 100px
//   - Increased resistance from 2.5 to 3.0
// v1.3 (2026-01-24): Fix passive event listener error
//   - Use useEffect to attach touchmove with { passive: false }
//   - Return containerRef for wrapper to attach
//   - Check e.cancelable before preventDefault to avoid errors when scrolling started
//   - Fixes "Unable to preventDefault inside passive event listener" error
// v1.2 (2026-01-24): Modal awareness - disabled when modals open
//   - Detects modals via role="dialog" or body scroll lock
//   - Prevents gesture conflict with useSwipeToClose
// v1.1 (2025-12-22): Added haptic feedback when pull threshold reached
// v1.0 (2025-12-18): Initial implementation

import { useState, useCallback, useRef, useEffect } from 'react';
import { useMediaQuery } from './useMediaQuery';
import { haptics } from '../utils/haptics';

// Pull configuration
const PULL_THRESHOLD = 100;   // Distance in pixels to trigger refresh (increased from 80)
const RESISTANCE = 3.0;       // Pull resistance factor (increased from 2.5)

/**
 * Hook for pull-to-refresh functionality
 * @param {Function} onRefresh - Callback to execute on refresh
 * @returns {Object} Pull state, ref, and touch handlers
 */
export function usePullToRefresh(onRefresh) {
  // Use ref for pull distance to avoid 60+ setState/sec during touch gestures
  // This prevents frame drops on mid-range Android devices
  const pullDistanceRef = useRef(0);
  const rafIdRef = useRef(null);

  // State only for values that need to trigger re-renders
  const [showIndicator, setShowIndicator] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const containerRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const hasTriggeredHaptic = useRef(false);
  const isPullingRef = useRef(false); // For use in event listener
  const isMobile = useMediaQuery('(max-width: 1023px)');

  // Keep ref in sync with state for event listener
  useEffect(() => {
    isPullingRef.current = isPulling;
  }, [isPulling]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (!isMobile || isRefreshing) return;

    // Don't activate when modal is open (detected via scroll lock or dialog role)
    const isModalOpen = document.body.style.position === 'fixed' ||
                        !!document.querySelector('[role="dialog"]');
    if (isModalOpen) return;

    // Only start if at top of scroll
    if (window.scrollY <= 0) {
      startY.current = e.touches[0].clientY;
      hasTriggeredHaptic.current = false;
      setIsPulling(true);
    }
  }, [isMobile, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current) return;

    const distance = pullDistanceRef.current;

    if (distance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);

      try {
        await onRefresh?.();
      } finally {
        setIsRefreshing(false);
      }
    }

    // Reset pull state
    pullDistanceRef.current = 0;
    setShowIndicator(false);
    setIsPulling(false);
  }, [isRefreshing, onRefresh]);

  // Attach touchmove with { passive: false } to allow preventDefault
  // Uses RAF batching to prevent 60+ setState/sec
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isMobile) return;

    const handleTouchMove = (e) => {
      if (!isPullingRef.current || isRefreshing) return;

      currentY.current = e.touches[0].clientY;
      const distance = Math.max(0, (currentY.current - startY.current) / RESISTANCE);

      // Only pull if scrolled to top
      if (window.scrollY <= 0 && distance > 0) {
        // Update ref immediately (no re-render)
        pullDistanceRef.current = distance;

        // Batch UI update with RAF - only one update per frame
        if (!rafIdRef.current) {
          rafIdRef.current = requestAnimationFrame(() => {
            rafIdRef.current = null;
            // Trigger re-render only when crossing indicator threshold
            const shouldShow = pullDistanceRef.current > 10;
            setShowIndicator(prev => prev !== shouldShow ? shouldShow : prev);
          });
        }

        // Haptic feedback when crossing threshold
        if (distance >= PULL_THRESHOLD && !hasTriggeredHaptic.current) {
          hasTriggeredHaptic.current = true;
          haptics.tick();
        }

        // Prevent default scroll when pulling (only if event is cancelable)
        if (distance > 10 && e.cancelable) {
          e.preventDefault();
        }
      }
    };

    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      container.removeEventListener('touchmove', handleTouchMove);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [isMobile, isRefreshing]);

  // Getter for pull distance (avoids exposing mutable ref directly)
  const getPullDistance = useCallback(() => pullDistanceRef.current, []);

  // Calculate progress (0 to 1) - uses ref value
  const getProgress = useCallback(() => Math.min(pullDistanceRef.current / PULL_THRESHOLD, 1), []);

  const handlers = isMobile ? {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  } : {};

  return {
    ref: containerRef,
    // Expose getter function for pull distance (avoids re-renders)
    getPullDistance,
    getProgress,
    // For backward compatibility, also expose ref for direct DOM manipulation
    pullDistanceRef,
    isPulling,
    isRefreshing,
    showIndicator: showIndicator || isRefreshing,
    handlers,
    threshold: PULL_THRESHOLD,
  };
}

export default usePullToRefresh;
