// SkeletonGroup.jsx v1.0 - PROGRESSIVE SKELETON REVEAL
// Motion-enabled wrapper for coordinated skeleton animations
// Design System v5.1 compliant - Cosmic Precision
//
// Features:
// - Framer Motion orchestration with stagger
// - Progressive entrance animations
// - Reduced motion support
// - Works with existing skeleton components
//
// CHANGELOG:
// v1.0 (2026-01-31): Initial implementation
//   - SkeletonGroup container for orchestration
//   - SkeletonItem wrapper for individual elements
//   - Uses SKELETON_REVEAL animation constants
//
// Usage:
// <SkeletonGroup className="space-y-4">
//   <SkeletonItem>
//     <SkeletonHeader />
//   </SkeletonItem>
//   <SkeletonItem>
//     <SkeletonCard />
//   </SkeletonItem>
// </SkeletonGroup>

import React from 'react';
import { motion } from 'framer-motion';
import useReducedMotion from '../../hooks/useReducedMotion';
import { SKELETON_REVEAL } from '../../constants/animations';

/**
 * Skeleton Group Container
 *
 * Orchestrates staggered entrance animations for child SkeletonItems.
 * Children should be wrapped in SkeletonItem for coordinated animation.
 *
 * @param {React.ReactNode} children - SkeletonItem components
 * @param {string} className - Additional CSS classes
 */
export const SkeletonGroup = ({
  children,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const containerVariants = prefersReducedMotion
    ? SKELETON_REVEAL.containerReduced
    : SKELETON_REVEAL.container;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Skeleton Item Wrapper
 *
 * Wraps individual skeleton elements for coordinated stagger animation.
 * Must be a direct child of SkeletonGroup for animation to work.
 *
 * @param {React.ReactNode} children - Skeleton element(s)
 * @param {string} className - Additional CSS classes
 */
export const SkeletonItem = ({
  children,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const itemVariants = prefersReducedMotion
    ? SKELETON_REVEAL.itemReduced
    : SKELETON_REVEAL.item;

  return (
    <motion.div
      variants={itemVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default SkeletonGroup;
