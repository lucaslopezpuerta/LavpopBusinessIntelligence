// IconButton.jsx v2.0 - Shared icon button component with Framer Motion
// Reusable icon button with consistent sizing and accessibility
//
// CHANGELOG:
// v2.0 (2026-01-27): Framer Motion upgrade
//   - Converted to motion.button for smooth animations
//   - Added whileHover and whileTap with INTERACTIVE constants
//   - Added haptic feedback on tap
//   - Respects useReducedMotion for accessibility
// v1.0 (2025-12-22): Initial implementation
//   - 44px minimum touch target for accessibility
//   - Active state support
//   - Focus-visible ring for keyboard navigation
//   - Press feedback with scale animation

import React from 'react';
import { motion } from 'framer-motion';
import { SPRING, INTERACTIVE } from '../../constants/animations';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { haptics } from '../../utils/haptics';

const IconButton = ({
  icon: Icon,
  label,
  onClick,
  active = false,
  disabled = false,
  className = '',
  size = 'default', // 'small' | 'default'
}) => {
  const prefersReducedMotion = useReducedMotion();

  const sizeClasses = size === 'small'
    ? 'min-h-[36px] min-w-[36px] p-1.5'
    : 'min-h-[44px] min-w-[44px] p-2';

  const iconSize = size === 'small' ? 'w-4 h-4' : 'w-5 h-5';

  const handleClick = (e) => {
    if (!disabled) {
      haptics.light();
      onClick?.(e);
    }
  };

  // Animation props - disabled when reduced motion is preferred or button is disabled
  const animationProps = (!prefersReducedMotion && !disabled) ? {
    whileHover: INTERACTIVE.ICON_HOVER,
    whileTap: INTERACTIVE.ICON_TAP,
    transition: SPRING.SNAPPY
  } : {};

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      {...animationProps}
      className={`
        flex items-center justify-center rounded-lg
        transition-colors duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses}
        ${active
          ? 'bg-stellar-cyan/10 text-stellar-blue dark:bg-stellar-cyan/20 dark:text-stellar-cyan'
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
        }
        ${className}
      `}
    >
      <Icon className={iconSize} />
    </motion.button>
  );
};

export default IconButton;
