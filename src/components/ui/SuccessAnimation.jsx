// SuccessAnimation.jsx v1.0 - Animated success checkmark
// SVG checkmark with path drawing animation using Framer Motion
//
// CHANGELOG:
// v1.0 (2026-01-27): Initial implementation
//   - Animated circle and checkmark path drawing
//   - Spring-based container scale animation
//   - Respects useReducedMotion for accessibility
//   - Configurable size, color, and stroke width
//   - onComplete callback when animation finishes

import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { SUCCESS_ANIMATION } from '../../constants/animations';

const SuccessAnimation = ({
  size = 64,
  color = '#00d68f', // Cosmic Green
  strokeWidth = 4,
  onComplete,
  className = ''
}) => {
  const prefersReducedMotion = useReducedMotion();

  // Reduced motion - show static checkmark
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
          d="M14 27 L22 35 L38 19"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 52 52"
      className={className}
      initial={SUCCESS_ANIMATION.CONTAINER.initial}
      animate={SUCCESS_ANIMATION.CONTAINER.animate}
      transition={SUCCESS_ANIMATION.CONTAINER.transition}
    >
      {/* Circle */}
      <motion.circle
        cx="26"
        cy="26"
        r="22"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        initial={SUCCESS_ANIMATION.CIRCLE.initial}
        animate={SUCCESS_ANIMATION.CIRCLE.animate}
        transition={SUCCESS_ANIMATION.CIRCLE.transition}
      />

      {/* Checkmark */}
      <motion.path
        d="M14 27 L22 35 L38 19"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={SUCCESS_ANIMATION.CHECK.initial}
        animate={SUCCESS_ANIMATION.CHECK.animate}
        transition={SUCCESS_ANIMATION.CHECK.transition}
        onAnimationComplete={onComplete}
      />
    </motion.svg>
  );
};

export default SuccessAnimation;
