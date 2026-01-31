// ChartRefreshWrapper.jsx v1.0 - CHART REFRESH STATE WRAPPER
// Wrapper component for Recharts with refresh overlay
// Design System v5.1 compliant - Cosmic Precision
//
// Features:
// - Subtle shimmer overlay during refresh
// - Works with ResponsiveContainer
// - Non-blocking user interaction
// - Reduced motion support
//
// CHANGELOG:
// v1.0 (2026-01-31): Initial implementation
//   - Shimmer overlay for Recharts
//   - Border glow variant
//   - Works with ResponsiveContainer
//
// Usage:
// <ChartRefreshWrapper isRefreshing={isRefreshing}>
//   <ResponsiveContainer>
//     <AreaChart data={data}>...</AreaChart>
//   </ResponsiveContainer>
// </ChartRefreshWrapper>

import React from 'react';
import RefreshOverlay from './RefreshOverlay';

/**
 * Chart Refresh Wrapper
 *
 * Wraps Recharts components to provide visual feedback during data refresh.
 *
 * @param {boolean} isRefreshing - Whether refresh is in progress
 * @param {'overlay' | 'border-glow'} variant - Overlay style
 * @param {React.ReactNode} children - Chart component(s)
 * @param {string} className - Additional CSS classes
 */
const ChartRefreshWrapper = ({
  isRefreshing = false,
  variant = 'overlay',
  children,
  className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      {children}

      {/* Shimmer overlay for refresh state */}
      {variant === 'overlay' && (
        <RefreshOverlay
          isRefreshing={isRefreshing}
          variant="shimmer"
        />
      )}

      {/* Border glow variant */}
      {variant === 'border-glow' && isRefreshing && (
        <div
          className={`
            absolute inset-0
            rounded-xl
            pointer-events-none
            z-10
            ring-2 ring-stellar-cyan/30
            refresh-pulse
          `}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default ChartRefreshWrapper;
