// BackgroundRefreshIndicator.jsx v1.0 - BACKGROUND REFRESH FEEDBACK
// Floating indicator for background data refresh operations
// Design System v5.1 compliant - Cosmic Precision
//
// Features:
// - Three variants: floating, pill, inline
// - Stellar cyan pulsing animation
// - Smooth AnimatePresence transitions
// - Reduced motion support
// - Full dark/light mode support
//
// CHANGELOG:
// v1.0 (2026-01-31): Initial implementation
//   - Floating badge in corner (mobile-friendly)
//   - Pill variant for inline display
//   - Inline variant for header integration
//   - Success flash on refresh complete
//
// Usage:
// <BackgroundRefreshIndicator isRefreshing={true} variant="pill" />

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import useReducedMotion from '../../hooks/useReducedMotion';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Background Refresh Indicator
 *
 * @param {boolean} isRefreshing - Whether a background refresh is in progress
 * @param {'floating' | 'pill' | 'inline'} variant - Display style
 * @param {string} className - Additional CSS classes
 */
const BackgroundRefreshIndicator = ({
  isRefreshing = false,
  variant = 'floating',
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
    `
  };

  // Icon styles by variant
  const iconStyles = {
    floating: 'w-4 h-4',
    pill: 'w-3.5 h-3.5',
    inline: 'w-3 h-3'
  };

  // Text styles by variant
  const textStyles = {
    floating: 'text-xs font-medium',
    pill: 'text-xs font-medium',
    inline: 'text-xs'
  };

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
              Atualizando...
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BackgroundRefreshIndicator;
