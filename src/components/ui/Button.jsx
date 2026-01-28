// Button.jsx v1.2 - COSMIC PRECISION UPDATE
// Reusable button component with Framer Motion animations
// Design System v4.3 compliant - Tier 1 Essential
//
// CHANGELOG:
// v1.2 (2026-01-27): Accessibility improvements
//   - Added useReducedMotion hook for prefers-reduced-motion support
//   - Animations disabled when user prefers reduced motion
//   - Uses centralized SPRING.SNAPPY constant
// v1.1 (2026-01-17): Cosmic Precision upgrade
//   - NEW: 'cosmic' variant using stellar gradient (bg-gradient-stellar)
//   - Updated secondary variant to use space-dust background
//   - Updated ghost variant hover to use space-dust
//   - Cosmic compliant: Tier 1 Essential
// v1.0 (2026-01-07): Initial implementation (Figma-quality enhancement)
//   - Multiple variants: primary, secondary, ghost, danger
//   - Multiple sizes: sm, md, lg
//   - Spring-based press animation (scale 0.98)
//   - Glow effect on hover for primary variant
//   - Loading state with spinner
//   - Icon support (left and right positions)
//   - Full accessibility support

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import useReducedMotion from '../../hooks/useReducedMotion';
import { SPRING, INTERACTIVE } from '../../constants/animations';

/**
 * Premium Button Component
 *
 * @param {string} variant - 'primary' | 'secondary' | 'ghost' | 'danger' | 'cosmic'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} loading - Show loading spinner
 * @param {boolean} disabled - Disable button
 * @param {boolean} fullWidth - Make button full width
 * @param {React.ComponentType} leftIcon - Icon component to show on left
 * @param {React.ComponentType} rightIcon - Icon component to show on right
 * @param {string} className - Additional CSS classes
 * @param {React.ReactNode} children - Button content
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  children,
  ...props
}) => {
  const isDisabled = disabled || loading;
  const prefersReducedMotion = useReducedMotion();

  // Variant styles - Cosmic Precision (v4.3)
  const variants = {
    primary: 'bg-gradient-to-r from-lavpop-blue-500 to-lavpop-blue-600 hover:from-lavpop-blue-600 hover:to-lavpop-blue-700 text-white font-semibold shadow-md hover:shadow-lg hover:shadow-lavpop-blue-500/25 focus-visible:ring-lavpop-blue-500 dark:from-lavpop-blue-600 dark:to-lavpop-blue-700 dark:hover:from-lavpop-blue-500 dark:hover:to-lavpop-blue-600',
    // NEW: Cosmic variant using stellar gradient
    cosmic: 'bg-gradient-stellar text-white font-semibold shadow-md hover:shadow-lg hover:shadow-stellar-cyan/25 focus-visible:ring-stellar-cyan',
    secondary: 'bg-white dark:bg-space-dust text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-stellar-cyan/15 hover:bg-slate-50 dark:hover:bg-space-nebula hover:border-slate-300 dark:hover:border-stellar-cyan/20 shadow-sm hover:shadow focus-visible:ring-slate-400',
    ghost: 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-space-dust focus-visible:ring-slate-400',
    danger: 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-semibold shadow-md hover:shadow-lg hover:shadow-red-500/25 focus-visible:ring-red-500',
  };

  // Size styles
  const sizes = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2 rounded-xl gap-2',
    lg: 'text-base px-6 py-3 rounded-xl gap-2.5',
  };

  // Icon sizes
  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

  return (
    <motion.button
      className={`${baseClasses} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={isDisabled}
      whileHover={!isDisabled && !prefersReducedMotion ? INTERACTIVE.HOVER : undefined}
      whileTap={!isDisabled && !prefersReducedMotion ? INTERACTIVE.TAP : undefined}
      transition={prefersReducedMotion ? { duration: 0 } : SPRING.SNAPPY}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className={`${iconSizes[size]} animate-spin`} />
          <span className="ml-2">{children}</span>
        </>
      ) : (
        <>
          {LeftIcon && <LeftIcon className={iconSizes[size]} aria-hidden="true" />}
          {children}
          {RightIcon && <RightIcon className={iconSizes[size]} aria-hidden="true" />}
        </>
      )}
    </motion.button>
  );
};

/**
 * Icon-only button variant
 */
export const IconButton = ({
  icon: Icon,
  size = 'md',
  variant = 'ghost',
  label,
  className = '',
  ...props
}) => {
  const prefersReducedMotion = useReducedMotion();

  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  // Cosmic Precision (v4.3) - Uses space-dust for dark backgrounds
  const variants = {
    ghost: 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-space-dust hover:text-slate-700 dark:hover:text-slate-200',
    secondary: 'bg-white dark:bg-space-dust text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-stellar-cyan/10 hover:bg-slate-50 dark:hover:bg-space-nebula shadow-sm',
  };

  return (
    <motion.button
      className={`inline-flex items-center justify-center rounded-xl transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${sizes[size]} ${variants[variant] || variants.ghost} ${className}`}
      whileHover={prefersReducedMotion ? undefined : INTERACTIVE.ICON_HOVER}
      whileTap={prefersReducedMotion ? undefined : INTERACTIVE.ICON_TAP}
      transition={prefersReducedMotion ? { duration: 0 } : SPRING.SNAPPY}
      aria-label={label}
      {...props}
    >
      <Icon className={iconSizes[size]} aria-hidden="true" />
    </motion.button>
  );
};

export default Button;
