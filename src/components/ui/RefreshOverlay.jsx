// RefreshOverlay.jsx v1.0 - CARD/CHART REFRESH OVERLAY
// Subtle shimmer overlay for cards and charts during data refresh
// Design System v5.1 compliant - Cosmic Precision
//
// Features:
// - Glassmorphism overlay with stellar cyan shimmer
// - Non-blocking (pointer-events: none)
// - Smooth fade transitions
// - Reduced motion support
// - Full dark/light mode support
//
// CHANGELOG:
// v1.0 (2026-01-31): Initial implementation
//   - Shimmer overlay variant
//   - Pulse variant for subtle feedback
//   - Minimal variant for light touch
//
// Usage:
// <RefreshOverlay isRefreshing={true} variant="shimmer" />

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useReducedMotion from '../../hooks/useReducedMotion';

/**
 * Refresh Overlay Component
 *
 * Provides subtle visual feedback during background data refresh
 * without blocking user interaction or replacing content.
 *
 * @param {boolean} isRefreshing - Whether refresh is in progress
 * @param {'shimmer' | 'pulse' | 'minimal'} variant - Overlay style
 * @param {string} className - Additional CSS classes
 */
const RefreshOverlay = ({
  isRefreshing = false,
  variant = 'shimmer',
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();

  // Animation variants for entrance/exit
  const overlayVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.2,
        ease: 'easeOut'
      }
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.15,
        ease: 'easeIn'
      }
    }
  };

  // Reduced motion - instant transitions
  const reducedVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const variants = prefersReducedMotion ? reducedVariants : overlayVariants;

  // Variant-specific styles
  const variantStyles = {
    shimmer: 'refresh-overlay',  // CSS animation in index.css
    pulse: 'refresh-pulse bg-stellar-cyan/5 dark:bg-stellar-cyan/10',
    minimal: 'bg-stellar-cyan/[0.02] dark:bg-stellar-cyan/[0.04]'
  };

  return (
    <AnimatePresence mode="wait">
      {isRefreshing && (
        <motion.div
          key="refresh-overlay"
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`
            absolute inset-0
            rounded-xl
            pointer-events-none
            z-10
            ${variantStyles[variant]}
            ${className}
          `}
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
  );
};

export default RefreshOverlay;
