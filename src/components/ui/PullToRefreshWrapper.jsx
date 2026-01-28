// PullToRefreshWrapper.jsx v2.2 - ACCESSIBILITY
// Reusable pull-to-refresh container for mobile views
//
// FEATURES:
// - Pull down gesture triggers refresh callback
// - Visual progress indicator with rotation animation
// - Haptic feedback when threshold reached (via hook)
// - Mobile-only activation
// - Dark mode support
// - Safe area aware indicator positioning
// - State-driven transforms (no RAF conflicts)
// - "Ready" state visual feedback (pulse + glow)
//
// USAGE:
// <PullToRefreshWrapper onRefresh={handleRefresh}>
//   {/* Your scrollable content */}
// </PullToRefreshWrapper>
//
// CHANGELOG:
// v2.2 (2026-01-27): Accessibility improvements
//   - Added useReducedMotion hook for prefers-reduced-motion support
//   - Animations disabled/simplified when user prefers reduced motion
// v2.1 (2026-01-27): Animation refinements
//   - Smoothed icon rotation during pull (spring interpolation)
//   - Faster exit animation for snappy dismiss
//   - "Ready to refresh" pulse effect at threshold
//   - Stellar cyan glow when ready
//   - Slower, smoother spinner (1s vs 0.8s)
// v2.0 (2026-01-27): Complete rewrite - State-driven architecture
//   - Removed RAF-based DOM manipulation (caused conflicts with Framer Motion)
//   - Uses useMemo for computed styles (single source of truth)
//   - Framer Motion handles scale/opacity; CSS handles position
//   - Icon rotation via Framer Motion (no conflicts with CSS animation)
//   - Simpler, more maintainable code

import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { PULL_REFRESH } from '../../constants/animations';
import useReducedMotion from '../../hooks/useReducedMotion';

const PullToRefreshWrapper = ({
  children,
  onRefresh,
  className = '',
  disabled = false
}) => {
  const prefersReducedMotion = useReducedMotion();

  const handleRefresh = useCallback(async () => {
    if (disabled || !onRefresh) return;
    await onRefresh();
  }, [onRefresh, disabled]);

  const {
    ref,
    pullDistance,
    progress,
    isPulling,
    isRefreshing,
    showIndicator,
    handlers,
  } = usePullToRefresh(handleRefresh);

  // Compute indicator position from state (no RAF, single source of truth)
  const indicatorTop = useMemo(() => {
    // Position follows pull with diminishing returns (max 80px from top)
    const offset = Math.min(20 + pullDistance * 0.5, 80);
    return offset;
  }, [pullDistance]);

  // Compute content offset from state
  // Uses CSS transition for smooth snap-back (spring would require Framer wrapper)
  const contentStyle = useMemo(() => ({
    transform: pullDistance > 0 ? `translateY(${pullDistance * 0.3}px)` : 'none',
    transition: isPulling ? 'none' : 'transform 0.25s cubic-bezier(0.32, 0, 0.67, 0)',
  }), [pullDistance, isPulling]);

  // Icon rotation (0-360 based on progress, with spring smoothing)
  const iconRotation = progress * 360;

  // "Ready to refresh" state - threshold reached
  const isReady = progress >= 1 && !isRefreshing;

  return (
    <div ref={ref} {...handlers} className={`relative ${className}`}>
      {/* Pull indicator */}
      <AnimatePresence mode="wait">
        {showIndicator && (
          <motion.div
            className="fixed left-1/2 z-50 pointer-events-none"
            style={{
              top: `calc(env(safe-area-inset-top, 0px) + ${indicatorTop}px)`,
              x: '-50%', // Framer Motion handles centering
            }}
            initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : PULL_REFRESH.INDICATOR.initial}
            animate={prefersReducedMotion ? { opacity: 1, scale: 1 } : PULL_REFRESH.INDICATOR.animate}
            exit={prefersReducedMotion ? { opacity: 0 } : PULL_REFRESH.INDICATOR.exit}
            transition={prefersReducedMotion ? { duration: 0.1 } : (isPulling ? PULL_REFRESH.INDICATOR.transition : PULL_REFRESH.EXIT_TRANSITION)}
          >
            {/* Indicator bubble with ready state styling */}
            <motion.div
              className={`
                flex items-center justify-center
                w-10 h-10 rounded-full
                bg-white dark:bg-slate-800
                border border-slate-200 dark:border-slate-700
                transition-shadow duration-200
                ${isRefreshing ? 'shadow-xl' : isReady ? 'shadow-xl' : 'shadow-lg'}
              `}
              animate={isReady && !prefersReducedMotion ? PULL_REFRESH.READY_PULSE : {}}
              style={isReady ? PULL_REFRESH.READY_SHADOW : {}}
            >
              {/* Rotating icon */}
              <motion.div
                animate={prefersReducedMotion
                  ? {}
                  : { rotate: isRefreshing ? [0, 360] : iconRotation }
                }
                transition={prefersReducedMotion
                  ? { duration: 0 }
                  : (isRefreshing ? PULL_REFRESH.ICON_SPIN : PULL_REFRESH.ICON_PULL)
                }
              >
                <RefreshCw
                  className={`
                    w-5 h-5 transition-colors duration-150
                    ${isReady || isRefreshing
                      ? 'text-stellar-cyan'
                      : 'text-lavpop-blue dark:text-blue-400'
                    }
                  `}
                  style={{
                    opacity: isRefreshing ? 1 : Math.min(progress + 0.3, 1),
                  }}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content with pull offset */}
      <div style={contentStyle}>
        {children}
      </div>
    </div>
  );
};

export default PullToRefreshWrapper;
