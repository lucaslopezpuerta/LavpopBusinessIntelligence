// StaleDataIndicator.jsx v2.1 - STELLAR COMMAND BRIDGE
// Data freshness indicator designed for MinimalTopBar integration
// Design System v6.4 compliant
//
// Matches MinimalTopBar action button pattern:
// - motion.button with spring physics (400/17)
// - 44px min touch targets, rounded-xl corners
// - Cosmic color tokens with hover micro-interactions
//
// States:
//   - Fresh: Subtle slate, blends with other topbar actions
//   - Stale: Amber accent text + background tint
//   - Refreshing: Stellar cyan highlight with spinning icon
//
// CHANGELOG:
// v2.1 (2026-02-13): Show time label on mobile
//   - Time label visible on all screen sizes (was hidden sm:inline)
//   - Removed stale dot badge (time label makes it redundant)
// v2.0 (2026-02-13): Stellar Command Bridge integration
//   - Redesigned for MinimalTopBar placement (moved out of view headers)
//   - motion.button with spring physics (stiffness:400, damping:17)
//   - 44px touch targets, rounded-xl (matching topbar buttons)
//   - Stale amber dot badge (mobile), amber tint (desktop)
//   - Desktop: icon + time label; Mobile: icon-only + dot badge
//   - Removed old variant/showLabel props
// v1.1 (2026-01-28): Solid color for stale state
// v1.0 (2026-01-27): Initial implementation

import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/**
 * StaleDataIndicator - Cosmic data freshness button for MinimalTopBar
 *
 * @param {number} lastUpdated - Timestamp of last data update
 * @param {boolean} isRefreshing - Whether data is currently being refreshed
 * @param {function} onRefresh - Callback to trigger data refresh
 * @param {boolean} prefersReducedMotion - Disable spring animations
 */
const StaleDataIndicator = ({
  lastUpdated,
  isRefreshing,
  onRefresh,
  prefersReducedMotion = false
}) => {
  const [, forceUpdate] = useState(0);
  const { isDark } = useTheme();

  // Update the "time ago" display every minute
  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!lastUpdated) return null;

  const elapsed = Math.max(0, Date.now() - lastUpdated);
  const isStale = elapsed > STALE_THRESHOLD_MS;

  // Format time ago in Portuguese
  const minutes = Math.floor(elapsed / 60000);
  const timeAgo = minutes < 1
    ? 'agora'
    : minutes < 60
      ? `${minutes}min`
      : `${Math.floor(minutes / 60)}h`;

  // State-based styling matching MinimalTopBar button patterns
  const getButtonClasses = () => {
    if (isRefreshing) {
      return isDark
        ? 'bg-stellar-cyan/15 text-stellar-cyan'
        : 'bg-stellar-cyan/10 text-stellar-cyan';
    }
    if (isStale) {
      return isDark
        ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
        : 'bg-amber-50 text-amber-600 hover:bg-amber-100';
    }
    return isDark
      ? 'text-slate-400 hover:bg-stellar-cyan/10 hover:text-stellar-cyan'
      : 'text-slate-500 hover:bg-stellar-blue/5 hover:text-stellar-blue';
  };

  return (
    <motion.button
      onClick={onRefresh}
      disabled={isRefreshing}
      whileHover={prefersReducedMotion ? {} : { y: -2 }}
      whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      aria-live="polite"
      aria-atomic="true"
      className={`
        relative flex items-center justify-center gap-1.5
        min-h-[44px] min-w-[44px] px-2.5 rounded-xl
        text-xs font-medium tabular-nums
        transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan
        disabled:cursor-not-allowed
        ${getButtonClasses()}
      `}
      title={isRefreshing ? 'Sincronizando...' : `Atualizado ${timeAgo} — Clique para sincronizar`}
      aria-label={
        isRefreshing
          ? 'Sincronizando dados'
          : `Dados atualizados ${timeAgo}. Clique para sincronizar.`
      }
    >
      {/* Refresh icon — matches topbar icon size (w-5 h-5) */}
      <RefreshCw
        className={`w-5 h-5 flex-shrink-0 ${isRefreshing ? 'animate-spin' : ''}`}
        style={isRefreshing ? { animationDuration: '1.5s' } : undefined}
      />

      {/* Time label — visible on all screens */}
      <span className="leading-none">
        {isRefreshing ? 'Sync...' : timeAgo}
      </span>

      {/* Stale dot badge — no longer needed since time label is always visible */}
    </motion.button>
  );
};

export default StaleDataIndicator;
