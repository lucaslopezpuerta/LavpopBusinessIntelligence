// AnimatedNumber.jsx v1.0 - COUNT-UP ANIMATION COMPONENT
// Animated number counter with spring physics
// Design System v5.1 compliant
//
// CHANGELOG:
// v1.0 (2026-01-30): Initial implementation
//   - Count-up animation using Framer Motion useSpring
//   - Respects useReducedMotion for accessibility
//   - Customizable formatter function
//   - Triggers re-animation when value changes
//
// Usage:
//   <AnimatedNumber value={1234} />
//   <AnimatedNumber value={1234.56} formatter={formatCurrency} />

import React, { useEffect, useRef } from 'react';
import { useSpring, useMotionValue, useTransform, animate } from 'framer-motion';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { CHART_ANIMATION } from '../../constants/animations';

/**
 * Animated number counter component
 *
 * @param {number} value - The target number to animate to
 * @param {function} formatter - Optional formatter function (default: pt-BR locale)
 * @param {number} duration - Animation duration in ms (default: 800)
 * @param {string} className - Additional CSS classes
 * @param {boolean} decimals - Whether to show decimal places (default: false)
 */
const AnimatedNumber = ({
  value,
  formatter,
  duration = CHART_ANIMATION.COUNTER.duration,
  className = '',
  decimals = false
}) => {
  const prefersReducedMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const previousValue = useRef(0);

  // Default formatter: Brazilian locale with optional decimals
  const defaultFormatter = (n) => {
    if (decimals) {
      return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return Math.round(n).toLocaleString('pt-BR');
  };

  const formatFn = formatter || defaultFormatter;

  // Transform motion value to formatted string
  const displayValue = useTransform(motionValue, (latest) => formatFn(latest));

  useEffect(() => {
    // Skip animation if user prefers reduced motion
    if (prefersReducedMotion) {
      motionValue.set(value);
      return;
    }

    // Animate from previous value to new value
    const controls = animate(motionValue, value, {
      duration: duration / 1000, // Framer uses seconds
      ease: 'easeOut',
      onComplete: () => {
        previousValue.current = value;
      }
    });

    return () => controls.stop();
  }, [value, duration, prefersReducedMotion, motionValue]);

  return (
    <motion.span className={className}>
      {displayValue}
    </motion.span>
  );
};

export default AnimatedNumber;
