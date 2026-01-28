// OfflineIndicator.jsx v2.1 - ACCESSIBILITY
// Banner component that shows when the user is offline
//
// CHANGELOG:
// v2.1 (2026-01-27): Accessibility improvements
//   - Added useReducedMotion hook for prefers-reduced-motion support
//   - Banner slide and spin animations disabled when user prefers reduced motion
//
// FEATURES:
// - Detects online/offline status via navigator.onLine
// - Animated slide-in/out banner with glassmorphism
// - Shows last sync time when offline
// - Auto-hides when back online
// - Bilavnova brand integration (Saturn logo, Orbitron font)
// - Full dark mode support via useTheme
//
// USAGE:
// <OfflineIndicator lastSyncTime={timestamp} />
//
// CHANGELOG:
// v2.0 (2026-01-18): Cosmic Precision upgrade + Bilavnova brand migration
//   - Applied Variant D: Glassmorphism Cosmic with amber/emerald accents
//   - Added useTheme() hook for proper dark mode support
//   - Added backdrop-blur-xl glassmorphism effect
//   - Replaced WifiOff/RefreshCw icons with BilavnovaIcon (Saturn logo)
//   - Added Orbitron font for status text (brand consistency)
//   - Updated colors for cosmic theme compliance
//   - Cosmic compliant: Design System v5.0
// v1.0 (2025-12-18): Initial implementation

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { BilavnovaIcon } from './ui/BilavnovaLogo';
import useReducedMotion from '../hooks/useReducedMotion';

/**
 * Format time for display (e.g., "há 5 minutos")
 */
const formatTimeAgo = (timestamp) => {
  if (!timestamp) return null;

  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return 'agora mesmo';
  if (minutes < 60) return `há ${minutes} min`;
  if (hours < 24) return `há ${hours}h`;
  return 'há mais de 24h';
};

/**
 * Offline indicator banner
 * @param {number} lastSyncTime - Timestamp of last successful data sync
 */
const OfflineIndicator = ({ lastSyncTime }) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const { isDark } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Keep banner visible briefly to show reconnection
      setTimeout(() => setShowBanner(false), 2000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={prefersReducedMotion ? { opacity: 0 } : { y: -100, opacity: 0 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { y: -100, opacity: 0 }}
          transition={prefersReducedMotion ? { duration: 0.1 } : { type: 'spring', damping: 20, stiffness: 300 }}
          className={`
            fixed top-0 inset-x-0 z-50
            safe-area-top
            backdrop-blur-xl
            ${isOffline
              ? isDark
                ? 'bg-amber-900/80 border-b border-amber-500/30 shadow-[0_4px_24px_rgba(245,158,11,0.15)]'
                : 'bg-amber-50/95 border-b border-amber-300 shadow-md'
              : isDark
                ? 'bg-emerald-900/80 border-b border-emerald-500/30 shadow-[0_4px_24px_rgba(16,185,129,0.15)]'
                : 'bg-emerald-50/95 border-b border-emerald-300 shadow-md'
            }
          `}
        >
          <div className="flex items-center justify-center gap-3 px-4 py-2.5">
            {isOffline ? (
              <>
                {/* Saturn icon with amber glow - Offline */}
                <div className={`
                  w-7 h-7 rounded-lg flex items-center justify-center
                  ${isDark
                    ? 'bg-amber-500/20 border border-amber-400/30'
                    : 'bg-amber-100 border border-amber-300'}
                `}>
                  <BilavnovaIcon
                    className="w-4 h-4"
                    variant="current"
                    style={{ color: isDark ? '#fbbf24' : '#b45309' }}
                  />
                </div>
                <span
                  className={`text-sm font-medium tracking-wide ${isDark ? 'text-amber-100' : 'text-amber-900'}`}
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  OFFLINE
                </span>
                {lastSyncTime && (
                  <span className={`text-sm ${isDark ? 'text-amber-200/80' : 'text-amber-700'}`}>
                    • Última sincronização: {formatTimeAgo(lastSyncTime)}
                  </span>
                )}
              </>
            ) : (
              <>
                {/* Saturn icon with emerald glow + spin - Reconnected */}
                <motion.div
                  className={`
                    w-7 h-7 rounded-lg flex items-center justify-center
                    ${isDark
                      ? 'bg-emerald-500/20 border border-emerald-400/30'
                      : 'bg-emerald-100 border border-emerald-300'}
                  `}
                  animate={prefersReducedMotion ? {} : { rotate: 360 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <BilavnovaIcon
                    className="w-4 h-4"
                    variant="current"
                    style={{ color: isDark ? '#34d399' : '#047857' }}
                  />
                </motion.div>
                <span
                  className={`text-sm font-medium tracking-wide ${isDark ? 'text-emerald-100' : 'text-emerald-900'}`}
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  SINCRONIZANDO
                </span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;
