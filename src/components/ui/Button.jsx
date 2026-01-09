// Button.jsx v1.0 - PREMIUM BUTTON WITH MICRO-INTERACTIONS
// Reusable button component with Framer Motion animations
// Design System v3.4 compliant
//
// CHANGELOG:
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

// Animation configs
const buttonAnimation = {
  tap: { scale: 0.98 },
  hover: { scale: 1.02 }
};

const springConfig = { type: 'spring', stiffness: 400, damping: 25 };

/**
 * Premium Button Component
 *
 * @param {string} variant - 'primary' | 'secondary' | 'ghost' | 'danger'
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

  // Variant styles
  const variants = {
    primary: 'bg-gradient-to-r from-lavpop-blue-500 to-lavpop-blue-600 hover:from-lavpop-blue-600 hover:to-lavpop-blue-700 text-white font-semibold shadow-md hover:shadow-lg hover:shadow-lavpop-blue-500/25 focus-visible:ring-lavpop-blue-500 dark:from-lavpop-blue-600 dark:to-lavpop-blue-700 dark:hover:from-lavpop-blue-500 dark:hover:to-lavpop-blue-600',
    secondary: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 shadow-sm hover:shadow focus-visible:ring-slate-400',
    ghost: 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-slate-400',
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
      whileHover={!isDisabled ? buttonAnimation.hover : undefined}
      whileTap={!isDisabled ? buttonAnimation.tap : undefined}
      transition={springConfig}
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

  const variants = {
    ghost: 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200',
    secondary: 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm',
  };

  return (
    <motion.button
      className={`inline-flex items-center justify-center rounded-xl transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${sizes[size]} ${variants[variant] || variants.ghost} ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={springConfig}
      aria-label={label}
      {...props}
    >
      <Icon className={iconSizes[size]} aria-hidden="true" />
    </motion.button>
  );
};

export default Button;
