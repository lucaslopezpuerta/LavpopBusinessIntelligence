// PullToRefreshWrapper.jsx v1.4 - RAF-OPTIMIZED ANIMATIONS
// Reusable pull-to-refresh container for mobile views
//
// FEATURES:
// - Pull down gesture triggers refresh callback
// - Visual progress indicator with rotation animation
// - Haptic feedback when threshold reached (via hook)
// - Mobile-only activation
// - Dark mode support
// - Smooth spring animations
// - Safe area aware indicator positioning (v1.1)
// - Uses ref from hook for non-passive touchmove (v1.2)
// - Extracted animation constants (v1.3)
// - RAF-batched DOM updates (v1.4)
//
// USAGE:
// <PullToRefreshWrapper onRefresh={handleRefresh}>
//   {/* Your scrollable content */}
// </PullToRefreshWrapper>
//
// CHANGELOG:
// v1.4 (2026-01-25): Performance optimization
//   - Uses pullDistanceRef from hook for smooth RAF-batched animations
//   - Direct DOM manipulation during pull (no React re-renders)
//   - Prevents frame drops on mid-range Android devices
// v1.3 (2026-01-25): Animation performance optimization
//   - Extracted inline animation objects to INDICATOR_ANIMATION constant
//   - Uses SPRING.SNAPPY from animations.js for consistency
// v1.2 (2026-01-24): Passive listener fix
//   - Uses ref from usePullToRefresh hook for event listener attachment
//   - Fixes "Unable to preventDefault inside passive event listener" error
// v1.1 (2026-01-12): Safe area compliance
//   - Indicator now uses safe-area-inset-top in positioning
//   - Prevents clipping behind iPhone notch/Dynamic Island
// v1.0 (2026-01-12): Initial implementation

import React, { useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { SPRING } from '../../constants/animations';

// Extracted animation config to prevent re-renders
const INDICATOR_ANIMATION = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
  transition: SPRING.SNAPPY
};

const PullToRefreshWrapper = ({
  children,
  onRefresh,
  className = '',
  disabled = false
}) => {
  const handleRefresh = useCallback(async () => {
    if (disabled || !onRefresh) return;
    await onRefresh();
  }, [onRefresh, disabled]);

  const {
    ref,
    pullDistanceRef,
    isPulling,
    isRefreshing,
    showIndicator,
    handlers,
    threshold
  } = usePullToRefresh(handleRefresh);

  // Refs for direct DOM manipulation (no React re-renders during pull)
  const indicatorRef = useRef(null);
  const contentRef = useRef(null);
  const iconRef = useRef(null);
  const rafIdRef = useRef(null);

  // RAF-based DOM updates during pull gesture
  useEffect(() => {
    if (!isPulling) {
      // Reset transforms when not pulling
      if (contentRef.current) {
        contentRef.current.style.transform = 'none';
        contentRef.current.style.transition = 'transform 0.3s ease-out';
      }
      return;
    }

    const updateDOM = () => {
      const distance = pullDistanceRef.current;
      const progress = Math.min(distance / threshold, 1);

      // Update indicator position
      if (indicatorRef.current) {
        const top = Math.min(20 + distance * 0.5, 80);
        indicatorRef.current.style.transform = `translate(-50%, ${top}px)`;
      }

      // Update icon rotation
      if (iconRef.current && !isRefreshing) {
        iconRef.current.style.transform = `rotate(${progress * 360}deg)`;
        iconRef.current.style.opacity = Math.min(progress + 0.3, 1);
      }

      // Update content offset
      if (contentRef.current) {
        contentRef.current.style.transform = distance > 0 ? `translateY(${distance * 0.3}px)` : 'none';
        contentRef.current.style.transition = 'none';
      }

      // Continue RAF loop while pulling
      if (isPulling) {
        rafIdRef.current = requestAnimationFrame(updateDOM);
      }
    };

    rafIdRef.current = requestAnimationFrame(updateDOM);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [isPulling, isRefreshing, threshold, pullDistanceRef]);

  return (
    <div ref={ref} {...handlers} className={`relative ${className}`}>
      {/* Pull indicator */}
      <AnimatePresence>
        {showIndicator && (
          <motion.div
            ref={indicatorRef}
            {...INDICATOR_ANIMATION}
            className="fixed left-1/2 z-50 pointer-events-none"
            style={{
              top: 'env(safe-area-inset-top, 0px)',
              transform: 'translate(-50%, 20px)'
            }}
          >
            <div className={`
              flex items-center justify-center
              w-10 h-10 rounded-full
              bg-white dark:bg-slate-800
              shadow-lg border border-slate-200 dark:border-slate-700
              transition-shadow duration-200
              ${isRefreshing ? 'shadow-xl' : ''}
            `}>
              <RefreshCw
                ref={iconRef}
                className={`w-5 h-5 text-lavpop-blue dark:text-blue-400
                  ${isRefreshing ? 'animate-spin' : ''}
                `}
                style={{
                  transform: 'rotate(0deg)',
                  opacity: 0.3,
                  transition: isRefreshing ? 'none' : 'transform 0.1s ease-out'
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content with pull offset */}
      <div
        ref={contentRef}
        style={{
          transform: 'none',
          transition: 'transform 0.3s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefreshWrapper;
