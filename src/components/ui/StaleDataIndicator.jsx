// StaleDataIndicator.jsx v1.0
// Unified component for showing data freshness status
// Design System v5.1 compliant
//
// Usage:
//   <StaleDataIndicator
//     lastUpdated={timestamp}
//     isRefreshing={boolean}
//     onRefresh={() => {}}
//   />
//
// States:
//   - Fresh: Slate badge, subtle appearance
//   - Stale: Amber badge with breathing glow animation
//   - Refreshing: Cyan badge with spinning icon
//
// CHANGELOG:
// v1.0 (2026-01-27): Initial implementation
//   - Extracted from Intelligence.jsx StaleDataIndicator
//   - Added cosmic styling with stale-breathe animation
//   - Portuguese localization for time labels
//   - Responsive design (compact on mobile)
//   - Accessibility: button role, disabled state

import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, AlertCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useIsMobile } from '../../hooks/useMediaQuery';

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/**
 * StaleDataIndicator - Shows data freshness with refresh capability
 *
 * @param {number} lastUpdated - Timestamp of last data update
 * @param {boolean} isRefreshing - Whether data is currently being refreshed
 * @param {function} onRefresh - Callback to trigger data refresh
 * @param {boolean} showLabel - Whether to show icon labels (default: true)
 * @param {string} variant - Display variant: 'compact' | 'expanded' (default: 'compact')
 */
const StaleDataIndicator = ({
  lastUpdated,
  isRefreshing,
  onRefresh,
  showLabel = true,
  variant = 'compact'
}) => {
  const [, forceUpdate] = useState(0);
  const { isDark } = useTheme();
  const isMobile = useIsMobile();

  // Update the "time ago" display every minute
  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!lastUpdated) return null;

  const now = Date.now();
  const elapsed = now - lastUpdated;
  const isStale = elapsed > STALE_THRESHOLD_MS;

  // Format time ago in Portuguese
  const minutes = Math.floor(elapsed / 60000);
  const timeAgo = minutes < 1
    ? 'agora'
    : minutes < 60
      ? `${minutes}min`
      : `${Math.floor(minutes / 60)}h`;

  // State-based styling
  const stateStyles = {
    fresh: isDark
      ? 'bg-space-dust text-slate-400 border-stellar-cyan/10 hover:bg-space-nebula hover:border-stellar-cyan/20'
      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200',
    stale: isDark
      ? 'bg-amber-900/30 text-amber-400 border-amber-800/60 stale-indicator hover:bg-amber-900/40'
      : 'bg-amber-100 text-amber-700 border-amber-200 stale-indicator hover:bg-amber-200',
    refreshing: isDark
      ? 'bg-stellar-cyan/10 text-stellar-cyan border-stellar-cyan/20'
      : 'bg-blue-50 text-blue-600 border-blue-200'
  };

  const currentState = isRefreshing ? 'refreshing' : isStale ? 'stale' : 'fresh';
  const isCompact = variant === 'compact' || isMobile;

  return (
    <button
      onClick={onRefresh}
      disabled={isRefreshing}
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-1.5 rounded-lg
        text-xs font-medium
        border transition-all duration-200
        ${stateStyles[currentState]}
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan/50
      `}
      title={isRefreshing ? 'Atualizando...' : 'Clique para atualizar'}
      aria-label={
        isRefreshing
          ? 'Atualizando dados'
          : `Dados atualizados ${timeAgo}. Clique para atualizar.`
      }
    >
      {/* Refresh icon */}
      <RefreshCw
        className={`w-3.5 h-3.5 ${isRefreshing ? 'refresh-spin-glow' : ''}`}
      />

      {/* Stale warning icon (only when stale and not refreshing) */}
      {isStale && !isRefreshing && !isCompact && (
        <AlertCircle className="w-3 h-3" />
      )}

      {/* Clock icon (only in expanded mode when fresh) */}
      {!isStale && !isRefreshing && !isCompact && showLabel && (
        <Clock className="w-3 h-3" />
      )}

      {/* Time label */}
      <span>
        {isRefreshing ? 'Atualizando...' : timeAgo}
      </span>
    </button>
  );
};

export default StaleDataIndicator;
