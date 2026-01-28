// AnimatedView.jsx v1.0 - Stellar Cascade View Animation
// Provides orchestrated entrance animations for view content
// Design System v5.1 compliant
//
// Usage:
//   import { AnimatedView, AnimatedHeader, AnimatedSection } from '../components/ui/AnimatedView';
//   <AnimatedView>
//     <AnimatedHeader>{/* header */}</AnimatedHeader>
//     <AnimatedSection>{/* section 1 */}</AnimatedSection>
//     <AnimatedSection>{/* section 2 */}</AnimatedSection>
//   </AnimatedView>
//
// Timing (~250ms total perceived):
//   - Container fade: 120ms
//   - Header: +30ms delay, ~150ms spring settle
//   - Section 1: +70ms from start
//   - Section 2: +110ms from start

import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import {
  PAGE_TRANSITION_STELLAR,
  PAGE_TRANSITION_STELLAR_REDUCED
} from '../../constants/animations';

/**
 * Animated view container with cascading section entrance
 * Wraps entire view content and orchestrates child animations
 *
 * @param {React.ReactNode} children - View content (AnimatedHeader, AnimatedSection, etc.)
 * @param {string} className - Additional container classes
 */
export const AnimatedView = ({ children, className = '' }) => {
  const prefersReducedMotion = useReducedMotion();
  const variants = prefersReducedMotion
    ? PAGE_TRANSITION_STELLAR_REDUCED
    : PAGE_TRANSITION_STELLAR;

  return (
    <motion.div
      className={`space-y-6 sm:space-y-8 ${className}`}
      variants={variants.container}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.div>
  );
};

/**
 * Animated header section - appears first in the cascade
 * Use for page title, icon, and primary controls
 *
 * @param {React.ReactNode} children - Header content
 * @param {string} className - Additional classes
 */
export const AnimatedHeader = ({ children, className = '' }) => {
  const prefersReducedMotion = useReducedMotion();
  const variants = prefersReducedMotion
    ? PAGE_TRANSITION_STELLAR_REDUCED
    : PAGE_TRANSITION_STELLAR;

  return (
    <motion.header variants={variants.header} className={className}>
      {children}
    </motion.header>
  );
};

/**
 * Animated content section - staggered entrance after header
 * Use for main content areas, card grids, charts
 *
 * @param {React.ReactNode} children - Section content
 * @param {string} className - Additional classes
 * @param {string} ariaLabel - Accessibility label for the section
 */
export const AnimatedSection = ({ children, className = '', ariaLabel }) => {
  const prefersReducedMotion = useReducedMotion();
  const variants = prefersReducedMotion
    ? PAGE_TRANSITION_STELLAR_REDUCED
    : PAGE_TRANSITION_STELLAR;

  return (
    <motion.section
      variants={variants.section}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </motion.section>
  );
};

/**
 * Animated item - for individual cards or list items within a section
 * Fastest stagger with subtle scale effect
 *
 * @param {React.ReactNode} children - Item content
 * @param {string} className - Additional classes
 * @param {string} as - HTML element to render (default: 'div')
 */
export const AnimatedItem = ({ children, className = '', as = 'div' }) => {
  const prefersReducedMotion = useReducedMotion();
  const variants = prefersReducedMotion
    ? PAGE_TRANSITION_STELLAR_REDUCED
    : PAGE_TRANSITION_STELLAR;

  const Component = motion[as] || motion.div;

  return (
    <Component variants={variants.item} className={className}>
      {children}
    </Component>
  );
};

export default AnimatedView;
