// RealtimeStatusIndicator.jsx v1.4 - COSMIC REALTIME STATUS
// Visual indicator for Supabase Realtime connection status
//
// FEATURES:
// - Breathing dot animation when connected
// - Pulse animation when connecting
// - Subtle tooltip on hover (desktop) / tap (mobile)
// - Dark/light mode support
// - Reduced motion accessibility support
// - Cosmic design system compliant
// - Portal-based tooltip (escapes overflow containers)
//
// USAGE:
// <RealtimeStatusIndicator />  // Compact mode (default)
// <RealtimeStatusIndicator showLabel />  // With text label
//
// CHANGELOG:
// v1.4 (2026-01-30): Portal-based tooltip (fixes drawer clipping)
//   - Tooltip now renders via createPortal to document.body
//   - Escapes overflow-hidden containers (mobile drawer)
//   - Smart positioning: prefers below, falls back to above
//   - Viewport edge clamping prevents overflow
//   - Added backdrop overlay for mobile tap-to-dismiss
// v1.3 (2026-01-30): Attempted CSS-only fixes (superseded by v1.4)
// v1.2 (2026-01-23): Touch-friendly tooltip
//   - Added touch device detection
//   - Mobile: tap to toggle tooltip (stays open until tap elsewhere)
//   - Desktop: hover to show tooltip
//   - Added haptic feedback on mobile tap
// v1.1 (2026-01-23): Portuguese accents and tooltip fixes
//   - Added proper Portuguese accents (ã, ç, etc.)
//   - Fixed tooltip positioning to stay on-screen on mobile
//   - Improved text wrapping with whitespace-nowrap
//   - Simplified "Última atualização" to "Atualização"
// v1.0 (2026-01-23): Initial implementation

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, RefreshCw } from 'lucide-react';
import { useRealtimeSyncContext } from '../../contexts/RealtimeSyncContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { haptics } from '../../utils/haptics';

// Hook to detect touch/mobile device
const useIsTouchDevice = () => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(pointer: coarse)');
    setIsTouch(mediaQuery.matches);

    const handler = (e) => setIsTouch(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return isTouch;
};

// Safe area constants for positioning
const SAFE_AREA = {
  top: 60,      // iOS Dynamic Island + status bar
  bottom: 100,  // Bottom nav + home indicator
  padding: 12   // Edge padding
};

// Tooltip dimensions (approximate)
const TOOLTIP_WIDTH = 176;  // w-44 = 11rem = 176px
const TOOLTIP_HEIGHT = 100; // Approximate height

const RealtimeStatusIndicator = ({ showLabel = false, className = '' }) => {
  const { isConnected, lastUpdate, getConnectionStatusText } = useRealtimeSyncContext();
  const { isDark } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const isTouch = useIsTouchDevice();
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, position: 'bottom' });
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const tooltipRef = useRef(null);

  // Format last update time
  const getLastUpdateText = () => {
    if (!lastUpdate) return 'Sem atualizações';
    const now = new Date();
    const diff = Math.floor((now - lastUpdate) / 1000);

    if (diff < 60) return `Há ${diff}s`;
    if (diff < 3600) return `Há ${Math.floor(diff / 60)} min`;
    return `Há ${Math.floor(diff / 3600)}h`;
  };

  // Calculate tooltip position from button rect
  const calculatePosition = useCallback(() => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate available space
    const spaceBelow = viewportHeight - rect.bottom - SAFE_AREA.bottom;
    const spaceAbove = rect.top - SAFE_AREA.top;

    // Determine vertical position (prefer below, fallback to above)
    let top, position;
    if (spaceBelow >= TOOLTIP_HEIGHT || spaceBelow >= spaceAbove) {
      // Position below
      top = rect.bottom + 8;
      position = 'bottom';
    } else {
      // Position above
      top = rect.top - TOOLTIP_HEIGHT - 8;
      position = 'top';
    }

    // Calculate horizontal position (centered under button, clamped to viewport)
    const buttonCenter = rect.left + rect.width / 2;
    let left = buttonCenter - TOOLTIP_WIDTH / 2;

    // Clamp to viewport edges
    const minLeft = SAFE_AREA.padding;
    const maxLeft = viewportWidth - TOOLTIP_WIDTH - SAFE_AREA.padding;
    left = Math.max(minLeft, Math.min(left, maxLeft));

    setTooltipPosition({ top, left, position });
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // Hide tooltip on scroll
  useEffect(() => {
    if (!showTooltip) return;
    const handleScroll = () => setShowTooltip(false);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showTooltip]);

  // Desktop only: hover handlers
  const handleMouseEnter = useCallback(() => {
    if (isTouch) return;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    calculatePosition();
    setShowTooltip(true);
  }, [isTouch, calculatePosition]);

  const handleMouseLeave = useCallback(() => {
    if (isTouch) return;
    closeTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 150);
  }, [isTouch]);

  // Mobile: tap to toggle with haptic feedback
  const handleClick = useCallback(() => {
    if (isTouch) {
      haptics.light();
      if (!showTooltip) {
        calculatePosition();
      }
      setShowTooltip(!showTooltip);
    }
  }, [isTouch, showTooltip, calculatePosition]);

  // Mobile: tap backdrop to dismiss
  const handleBackdropClick = useCallback(() => {
    setShowTooltip(false);
  }, []);

  // Status colors
  const getStatusColor = () => {
    if (isConnected) {
      return isDark ? 'bg-emerald-400' : 'bg-emerald-500';
    }
    return isDark ? 'bg-amber-400' : 'bg-amber-500';
  };

  const getGlowColor = () => {
    if (isConnected) {
      return isDark
        ? 'rgba(52, 211, 153, 0.6)' // emerald-400
        : 'rgba(16, 185, 129, 0.5)'; // emerald-500
    }
    return isDark
      ? 'rgba(251, 191, 36, 0.6)' // amber-400
      : 'rgba(245, 158, 11, 0.5)'; // amber-500
  };

  // Animation variants based on position
  const getAnimationVariants = () => {
    const yOffset = tooltipPosition.position === 'top' ? 8 : -8;
    return {
      initial: { opacity: 0, y: yOffset, scale: 0.95 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: yOffset, scale: 0.95 }
    };
  };

  // Tooltip content (rendered in portal)
  const tooltipContent = (
    <motion.div
      ref={tooltipRef}
      {...(prefersReducedMotion
        ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
        : getAnimationVariants()
      )}
      transition={prefersReducedMotion ? { duration: 0.1 } : { type: 'spring', damping: 25, stiffness: 350 }}
      className={`fixed w-44 rounded-xl shadow-xl border py-2.5 px-3 z-[9999] pointer-events-auto
        ${isDark
          ? 'bg-space-dust/95 backdrop-blur-xl border-stellar-cyan/20 shadow-stellar'
          : 'bg-white/95 backdrop-blur-xl border-stellar-blue/10 shadow-bilavnova'
        }`}
      style={{
        top: tooltipPosition.top,
        left: tooltipPosition.left,
      }}
      data-realtime-tooltip
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        {isConnected ? (
          <Wifi className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        ) : (
          <RefreshCw className={`w-4 h-4 text-amber-500 flex-shrink-0 ${!prefersReducedMotion ? 'animate-spin' : ''}`} />
        )}
        <span className={`text-sm font-semibold whitespace-nowrap ${isDark ? 'text-white' : 'text-slate-800'}`}>
          {getConnectionStatusText()}
        </span>
      </div>

      {/* Divider */}
      <div className={`h-px mb-2 ${isDark ? 'divider-cosmic' : 'bg-slate-200'}`} />

      {/* Details */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <span className={`text-[11px] whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Status
          </span>
          <span className={`text-[11px] font-medium ${isConnected ? 'text-emerald-500' : 'text-amber-500'}`}>
            {isConnected ? 'Ativo' : 'Reconectando'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className={`text-[11px] whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Atualização
          </span>
          <span className={`text-[11px] font-medium whitespace-nowrap ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {getLastUpdateText()}
          </span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Status indicator button */}
      <button
        ref={buttonRef}
        onClick={handleClick}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-200 min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan
          ${isDark
            ? 'hover:bg-stellar-cyan/10'
            : 'hover:bg-stellar-cyan/5'
          }
          ${showTooltip && isTouch ? (isDark ? 'bg-stellar-cyan/10' : 'bg-stellar-cyan/5') : ''}`}
        title={getConnectionStatusText()}
        aria-label={`Status da conexão: ${getConnectionStatusText()}`}
        aria-expanded={showTooltip}
      >
        {/* Animated dot indicator */}
        <div className="relative flex items-center justify-center w-3 h-3">
          {/* Glow effect */}
          {isConnected && !prefersReducedMotion && (
            <motion.div
              className={`absolute inset-0 rounded-full ${getStatusColor()}`}
              animate={{
                scale: [1, 1.8, 1],
                opacity: [0.6, 0, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          {/* Connecting pulse */}
          {!isConnected && !prefersReducedMotion && (
            <motion.div
              className={`absolute inset-0 rounded-full ${getStatusColor()}`}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.8, 0.3, 0.8],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          {/* Core dot */}
          <motion.div
            className={`relative w-2 h-2 rounded-full ${getStatusColor()}`}
            animate={prefersReducedMotion ? {} : {
              boxShadow: isConnected
                ? [
                    `0 0 4px ${getGlowColor()}`,
                    `0 0 8px ${getGlowColor()}`,
                    `0 0 4px ${getGlowColor()}`,
                  ]
                : `0 0 4px ${getGlowColor()}`,
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        {/* Optional label */}
        {showLabel && (
          <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {isConnected ? 'Conectado' : 'Conectando'}
          </span>
        )}
      </button>

      {/* Portal-based tooltip - renders at document.body to escape overflow containers */}
      {createPortal(
        <AnimatePresence>
          {showTooltip && (
            <>
              {/* Backdrop for mobile - tap outside to dismiss */}
              {isTouch && (
                <div
                  className="fixed inset-0 z-[9998]"
                  onClick={handleBackdropClick}
                  aria-hidden="true"
                />
              )}
              {tooltipContent}
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default RealtimeStatusIndicator;
