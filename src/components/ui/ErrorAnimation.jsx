// ErrorAnimation.jsx v1.0 - Animated error X mark
// SVG X mark with path drawing and shake animation using Framer Motion
//
// CHANGELOG:
// v1.0 (2026-01-27): Initial implementation
//   - Animated circle and X path drawing
//   - Shake effect after drawing completes
//   - Spring-based container scale animation
//   - Respects useReducedMotion for accessibility
//   - Configurable size, color, and stroke width
//   - onComplete callback when animation finishes

import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { ERROR_ANIMATION } from '../../constants/animations';

const ErrorAnimation = ({
  size = 64,
  color = '#ef4444', // Red
  strokeWidth = 4,
  onComplete,
  className = ''
}) => {
  const prefersReducedMotion = useReducedMotion();

  // Reduced motion - show static X
  if (prefersReducedMotion) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 52 52"
        className={className}
      >
        <circle
          cx="26"
          cy="26"
          r="22"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
        <path
          d="M16 16 L36 36"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d="M36 16 L16 36"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <motion.div
      initial={ERROR_ANIMATION.CONTAINER.initial}
      animate={[
        ERROR_ANIMATION.CONTAINER.animate,
        ERROR_ANIMATION.SHAKE
      ]}
      transition={ERROR_ANIMATION.CONTAINER.transition}
      className={className}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 52 52"
      >
        {/* Circle */}
        <motion.circle
          cx="26"
          cy="26"
          r="22"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          initial={ERROR_ANIMATION.CIRCLE.initial}
          animate={ERROR_ANIMATION.CIRCLE.animate}
          transition={ERROR_ANIMATION.CIRCLE.transition}
        />

        {/* X line 1 */}
        <motion.path
          d="M16 16 L36 36"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={ERROR_ANIMATION.X_LINE.initial}
          animate={ERROR_ANIMATION.X_LINE.animate}
          transition={ERROR_ANIMATION.X_LINE.transition}
        />

        {/* X line 2 */}
        <motion.path
          d="M36 16 L16 36"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={ERROR_ANIMATION.X_LINE.initial}
          animate={ERROR_ANIMATION.X_LINE.animate}
          transition={{
            ...ERROR_ANIMATION.X_LINE.transition,
            delay: ERROR_ANIMATION.X_LINE.transition.delay + 0.1
          }}
          onAnimationComplete={onComplete}
        />
      </svg>
    </motion.div>
  );
};

export default ErrorAnimation;
