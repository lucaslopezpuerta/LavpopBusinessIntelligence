// SearchInput.jsx v1.3 - FOCUS RING CONSISTENCY
// Reusable search input with consistent styling and debounced onChange
// Design System v6.4 compliant
//
// CHANGELOG:
// v1.3 (2026-02-05): Focus ring consistency (Design System v6.4)
//   - Input: Added focus-visible:ring-offset-white/space-dust for accessibility
//   - Clear button: Already had proper focus ring, verified
// v1.2 (2026-01-31): Touch target accessibility fix (WCAG 2.5.5)
//   - Clear button now has minimum 44x44px touch target across all sizes
//   - Visual icon size unchanged, touch area expanded via padding
// v1.1 (2026-01-27): Accessibility improvements
//   - Added useReducedMotion hook for prefers-reduced-motion support
//   - Clear button animation disabled when user prefers reduced motion
// v1.0 (2026-01-09): Initial implementation (UX Audit Phase 3.2)
//   - Search icon prefix
//   - Clear button when value present
//   - Debounced onChange for performance
//   - Multiple size variants (sm, md, lg)
//   - Full dark mode support
//   - WCAG accessible with aria labels

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import useReducedMotion from '../../hooks/useReducedMotion';

// Animation configs
const clearButtonAnimation = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
  transition: { type: 'spring', stiffness: 400, damping: 25 }
};

// Reduced motion variant - instant visibility change
const clearButtonAnimationReduced = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.1 }
};

/**
 * Search Input Component
 * Provides a consistent search experience across the application
 *
 * @param {string} value - Controlled input value
 * @param {function} onChange - Callback when value changes (debounced)
 * @param {string} placeholder - Input placeholder text (default: "Buscar...")
 * @param {number} debounceMs - Debounce delay in milliseconds (default: 300)
 * @param {string} size - 'sm' | 'md' | 'lg' - Controls overall sizing
 * @param {boolean} autoFocus - Whether to focus on mount
 * @param {boolean} disabled - Disable the input
 * @param {string} className - Additional CSS classes for container
 * @param {string} ariaLabel - Accessible label for screen readers
 */
const SearchInput = ({
  value = '',
  onChange,
  placeholder = 'Buscar...',
  debounceMs = 300,
  size = 'md',
  autoFocus = false,
  disabled = false,
  className = '',
  ariaLabel = 'Campo de busca'
}) => {
  const [internalValue, setInternalValue] = useState(value);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  // Size configurations
  // NOTE: clearButton uses min-w-11 min-h-11 (44px) for WCAG 2.5.5 touch target compliance
  // The visual icon remains small but the touch area expands
  const sizes = {
    sm: {
      container: 'h-8',
      input: 'text-xs pl-8 pr-12',
      searchIcon: 'w-3.5 h-3.5 left-2.5',
      clearButton: '-right-1.5 min-w-11 min-h-11',
      clearIcon: 'w-3 h-3'
    },
    md: {
      container: 'h-10',
      input: 'text-sm pl-10 pr-12',
      searchIcon: 'w-4 h-4 left-3',
      clearButton: '-right-1 min-w-11 min-h-11',
      clearIcon: 'w-3.5 h-3.5'
    },
    lg: {
      container: 'h-12',
      input: 'text-base pl-12 pr-14',
      searchIcon: 'w-5 h-5 left-4',
      clearButton: '-right-0.5 min-w-11 min-h-11',
      clearIcon: 'w-4 h-4'
    }
  };

  const sizeConfig = sizes[size] || sizes.md;

  // Sync internal value with external value
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Debounced onChange
  const debouncedOnChange = useCallback((newValue) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (onChange) {
        onChange(newValue);
      }
    }, debounceMs);
  }, [onChange, debounceMs]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    debouncedOnChange(newValue);
  };

  const handleClear = () => {
    setInternalValue('');
    if (onChange) {
      onChange('');
    }
    // Clear any pending debounced call
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    // Focus input after clearing
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && internalValue) {
      handleClear();
    }
  };

  return (
    <div className={`relative ${sizeConfig.container} ${className}`}>
      {/* Search Icon */}
      <Search
        className={`absolute ${sizeConfig.searchIcon} top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 pointer-events-none`}
        aria-hidden="true"
      />

      {/* Input Field */}
      <input
        ref={inputRef}
        type="search"
        name="search"
        autoComplete="off"
        value={internalValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        className={`
          w-full h-full
          ${sizeConfig.input}
          bg-white dark:bg-slate-800
          border border-slate-200 dark:border-slate-700
          rounded-xl
          text-slate-700 dark:text-slate-200
          placeholder:text-slate-400 dark:placeholder:text-slate-400
          transition-colors duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-space-dust focus-visible:border-stellar-cyan dark:focus-visible:border-stellar-cyan
          hover:border-slate-300 dark:hover:border-slate-600
          disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-900
        `}
      />

      {/* Clear Button - Touch target is 44x44px minimum per WCAG 2.5.5 */}
      <AnimatePresence>
        {internalValue && !disabled && (
          <motion.button
            {...(prefersReducedMotion ? clearButtonAnimationReduced : clearButtonAnimation)}
            type="button"
            onClick={handleClear}
            className={`
              absolute ${sizeConfig.clearButton} top-1/2 -translate-y-1/2
              flex items-center justify-center
              cursor-pointer
              text-slate-400 hover:text-slate-600
              dark:text-slate-400 dark:hover:text-slate-300
              transition-colors duration-150
              focus:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan focus-visible:ring-offset-2
            `}
            aria-label="Limpar busca"
          >
            <span className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <X className={sizeConfig.clearIcon} aria-hidden="true" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchInput;
