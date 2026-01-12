// PullToRefreshWrapper.jsx v1.1 - SAFE AREA COMPLIANCE
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
//
// USAGE:
// <PullToRefreshWrapper onRefresh={handleRefresh}>
//   {/* Your scrollable content */}
// </PullToRefreshWrapper>
//
// CHANGELOG:
// v1.1 (2026-01-12): Safe area compliance
//   - Indicator now uses safe-area-inset-top in positioning
//   - Prevents clipping behind iPhone notch/Dynamic Island
// v1.0 (2026-01-12): Initial implementation

import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';

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
    pullDistance,
    isPulling,
    isRefreshing,
    progress,
    showIndicator,
    handlers
  } = usePullToRefresh(handleRefresh);

  return (
    <div {...handlers} className={`relative ${className}`}>
      {/* Pull indicator */}
      <AnimatePresence>
        {showIndicator && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed left-1/2 z-50 pointer-events-none"
            style={{
              top: `calc(${Math.min(20 + pullDistance * 0.5, 80)}px + env(safe-area-inset-top, 0px))`,
              transform: 'translateX(-50%)'
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
                className={`w-5 h-5 text-lavpop-blue dark:text-blue-400
                  ${isRefreshing ? 'animate-spin' : ''}
                `}
                style={{
                  transform: isRefreshing ? 'none' : `rotate(${progress * 360}deg)`,
                  opacity: Math.min(progress + 0.3, 1),
                  transition: isRefreshing ? 'none' : 'transform 0.1s ease-out'
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content with pull offset */}
      <div
        style={{
          transform: isPulling && pullDistance > 0 ? `translateY(${pullDistance * 0.3}px)` : 'none',
          transition: isPulling ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefreshWrapper;
