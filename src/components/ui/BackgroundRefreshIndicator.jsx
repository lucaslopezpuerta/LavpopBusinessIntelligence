// BackgroundRefreshIndicator.jsx v1.3 - PORTAL FOR OVERLAY
// Floating indicator for background data refresh operations
// Design System v6.4 compliant - Cosmic Precision
//
// Features:
// - Four variants: floating, pill, inline, overlay
// - Stellar cyan pulsing animation
// - Smooth AnimatePresence transitions
// - Reduced motion support
// - Full dark/light mode support
//
// CHANGELOG:
// v1.3 (2026-02-05): Portal for overlay variant
//   - Overlay now uses createPortal to render at document.body
//   - Fixes issue where parent animations (animate-fade-in) created stacking context
//   - Ensures true full-viewport coverage regardless of component hierarchy
// v1.2 (2026-02-05): Fix overlay z-index
//   - Increased z-index from z-40 to z-50 to appear above MinimalTopBar (z-40)
//   - Ensures full-screen coverage including fixed navigation elements
// v1.1 (2026-02-05): Overlay variant (Design System v6.4)
//   - NEW: 'overlay' variant - full-screen centered card (WhatChimpAnalytics pattern)
//   - Non-blocking (pointer-events-none) with subtle backdrop
//   - Semi-transparent overlay (bg-black/10 light, bg-black/30 dark)
//   - Centered card with icon and customizable message
//   - Added 'message' prop for custom loading text
// v1.0 (2026-01-31): Initial implementation
//   - Floating badge in corner (mobile-friendly)
//   - Pill variant for inline display
//   - Inline variant for header integration
//   - Success flash on refresh complete
//
// Usage:
// <BackgroundRefreshIndicator isRefreshing={true} variant="overlay" message="Carregando..." />

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import useReducedMotion from '../../hooks/useReducedMotion';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Background Refresh Indicator
 *
 * @param {boolean} isRefreshing - Whether a background refresh is in progress
 * @param {'floating' | 'pill' | 'inline' | 'overlay'} variant - Display style
 * @param {string} message - Custom loading message (default: "Atualizando...")
 * @param {string} className - Additional CSS classes
 */
const BackgroundRefreshIndicator = ({
  isRefreshing = false,
  variant = 'floating',
  message = 'Atualizando...',
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const { isDark } = useTheme();

  // Animation variants
  const floatingVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 10,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 10,
      transition: {
        duration: 0.15,
        ease: 'easeIn'
      }
    }
  };

  // Reduced motion variants
  const reducedVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const variants = prefersReducedMotion ? reducedVariants : floatingVariants;

  // Base styles by variant
  const variantStyles = {
    floating: `
      fixed bottom-20 right-4 z-50
      px-3 py-2 rounded-full
      shadow-lg shadow-stellar-cyan/20
      ${isDark ? 'bg-space-dust/90' : 'bg-white/90'}
      ${isDark ? 'ring-1 ring-stellar-cyan/20' : 'ring-1 ring-stellar-cyan/30'}
      backdrop-blur-md
    `,
    pill: `
      inline-flex items-center gap-1.5
      px-2.5 py-1 rounded-full
      ${isDark ? 'bg-stellar-cyan/10' : 'bg-stellar-cyan/5'}
      ${isDark ? 'ring-1 ring-stellar-cyan/20' : 'ring-1 ring-stellar-cyan/30'}
    `,
    inline: `
      inline-flex items-center gap-1.5
      px-2 py-0.5
    `,
    overlay: `
      px-4 py-3 rounded-xl
      shadow-lg
      ${isDark ? 'bg-space-dust border border-stellar-cyan/20' : 'bg-white border border-slate-200'}
    `
  };

  // Icon styles by variant
  const iconStyles = {
    floating: 'w-4 h-4',
    pill: 'w-3.5 h-3.5',
    inline: 'w-3 h-3',
    overlay: 'w-5 h-5'
  };

  // Text styles by variant
  const textStyles = {
    floating: 'text-xs font-medium',
    pill: 'text-xs font-medium',
    inline: 'text-xs',
    overlay: 'text-sm font-medium'
  };

  // Overlay variant uses Portal to escape parent stacking contexts
  // This ensures true full-viewport coverage even when parent has animations/transforms
  if (variant === 'overlay') {
    return createPortal(
      <AnimatePresence mode="wait">
        {isRefreshing && (
          <motion.div
            key="refresh-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className={`
              fixed inset-0 z-50
              flex items-center justify-center
              pointer-events-none
              ${isDark ? 'bg-black/30' : 'bg-black/10'}
              ${className}
            `}
            role="status"
            aria-live="polite"
            aria-label={message}
          >
            <motion.div
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
              className={variantStyles.overlay}
            >
              <div className="flex items-center gap-3">
                <RefreshCw
                  className={`
                    ${iconStyles.overlay}
                    text-stellar-cyan
                    ${!prefersReducedMotion && 'animate-spin'}
                  `}
                  style={{ animationDuration: '1.5s' }}
                />
                <span className={`${textStyles.overlay} ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {message}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    );
  }

  return (
    <AnimatePresence mode="wait">
      {isRefreshing && (
        <motion.div
          key="refresh-indicator"
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`
            ${variantStyles[variant]}
            flex items-center gap-2
            text-stellar-cyan
            ${className}
          `}
          role="status"
          aria-live="polite"
          aria-label="Atualizando dados"
        >
          {/* Pulsing glow container */}
          <span className={`relative ${!prefersReducedMotion && 'refresh-pulse'}`}>
            <RefreshCw
              className={`
                ${iconStyles[variant]}
                ${!prefersReducedMotion && 'animate-spin'}
              `}
              style={{ animationDuration: '1.5s' }}
            />
          </span>

          {/* Text label (hidden on inline variant) */}
          {variant !== 'inline' && (
            <span className={textStyles[variant]}>
              {message}
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BackgroundRefreshIndicator;
