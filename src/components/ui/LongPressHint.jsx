// LongPressHint.jsx v1.0 - FIRST-TIME USER EDUCATION
// Contextual hint to teach users about long-press interactions
// Design System v5.1 compliant - Cosmic Precision
//
// FEATURES:
// - Shows on first mobile visit (localStorage tracking)
// - Dismissible with "Entendi" button
// - Subtle entrance animation
// - Reduced motion support
// - Dark/light mode
//
// USAGE:
// <LongPressHint
//   id="campaigns"
//   message="Segure para duplicar ou exportar"
//   delay={2000}
// />
//
// CHANGELOG:
// v1.0 (2026-01-31): Initial implementation
//   - localStorage persistence with unique IDs
//   - Delayed appearance for non-intrusive UX
//   - AnimatePresence entrance/exit

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import useReducedMotion from '../../hooks/useReducedMotion';
import { haptics } from '../../utils/haptics';

// LocalStorage key prefix
const STORAGE_PREFIX = 'longpress_hint_';

/**
 * Long Press Hint Component
 *
 * @param {string} id - Unique identifier for this hint (for persistence)
 * @param {string} message - Hint message to display
 * @param {number} delay - Delay before showing hint (ms, default: 2000)
 * @param {string} className - Additional CSS classes
 */
const LongPressHint = ({
  id,
  message = 'Segure para mais ações',
  delay = 2000,
  className = ''
}) => {
  const { isDark } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);

  const storageKey = `${STORAGE_PREFIX}${id}`;

  // Check if hint was already seen
  useEffect(() => {
    // Only show on touch devices
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) return;

    // Check localStorage
    const seen = localStorage.getItem(storageKey);
    if (seen) return;

    // Show hint after delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [storageKey, delay]);

  // Dismiss hint
  const handleDismiss = useCallback(() => {
    haptics.light();
    localStorage.setItem(storageKey, 'true');
    setIsVisible(false);
  }, [storageKey]);

  // Animation variants
  const hintVariants = {
    hidden: {
      opacity: 0,
      y: 10,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: prefersReducedMotion
        ? { duration: 0.1 }
        : { type: 'spring', stiffness: 400, damping: 25 }
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: { duration: 0.15, ease: 'easeIn' }
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={hintVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`
            inline-flex items-center gap-2
            px-3 py-2 rounded-xl
            text-xs font-medium
            shadow-lg
            ${isDark
              ? 'bg-space-dust/95 text-slate-200 border border-stellar-cyan/20'
              : 'bg-white/95 text-slate-700 border border-slate-200'
            }
            backdrop-blur-md
            ${className}
          `}
          role="tooltip"
        >
          {/* Hand icon with subtle pulse */}
          <motion.span
            animate={prefersReducedMotion ? {} : {
              scale: [1, 1.1, 1],
              transition: { repeat: Infinity, repeatDelay: 2, duration: 0.4 }
            }}
            className={isDark ? 'text-stellar-cyan' : 'text-blue-500'}
          >
            <Hand className="w-4 h-4" aria-hidden="true" />
          </motion.span>

          {/* Message */}
          <span>{message}</span>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className={`
              ml-1 px-2 py-0.5 rounded-md
              text-xs font-semibold
              transition-colors duration-150
              ${isDark
                ? 'text-stellar-cyan hover:bg-stellar-cyan/10'
                : 'text-blue-600 hover:bg-blue-50'
              }
            `}
          >
            Entendi
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Hook to check if a hint has been seen
 * @param {string} id - Hint identifier
 * @returns {boolean} - Whether hint was seen
 */
export const useHintSeen = (id) => {
  const [seen, setSeen] = useState(true);

  useEffect(() => {
    const storageKey = `${STORAGE_PREFIX}${id}`;
    const wasSeen = localStorage.getItem(storageKey) === 'true';
    setSeen(wasSeen);
  }, [id]);

  return seen;
};

/**
 * Mark a hint as seen programmatically
 * @param {string} id - Hint identifier
 */
export const markHintSeen = (id) => {
  const storageKey = `${STORAGE_PREFIX}${id}`;
  localStorage.setItem(storageKey, 'true');
};

/**
 * Reset a hint (for testing)
 * @param {string} id - Hint identifier
 */
export const resetHint = (id) => {
  const storageKey = `${STORAGE_PREFIX}${id}`;
  localStorage.removeItem(storageKey);
};

export default LongPressHint;
