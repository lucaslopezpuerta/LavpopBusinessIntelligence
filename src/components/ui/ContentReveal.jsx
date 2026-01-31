// ContentReveal.jsx v1.1
// Smooth skeleton-to-content transition wrapper
// Design System v5.1 compliant
//
// Usage:
//   <ContentReveal isLoading={!data} skeleton={<MySkeleton />}>
//     <ActualContent />
//   </ContentReveal>
//
// Features:
//   - Skeleton fades out with opacity + scale
//   - Content reveals with smooth opacity transition
//   - Respects prefers-reduced-motion
//   - Uses Framer Motion for smooth animations
//
// CHANGELOG:
// v1.1 (2026-01-31): Performance optimization
//   - Removed filter: blur() animation (paint-triggering)
//   - Now uses compositor-only properties (opacity, transform)
// v1.0 (2026-01-27): Initial implementation
//   - Framer Motion AnimatePresence for state transitions
//   - Blur-to-sharp content reveal (4px -> 0)
//   - Scale 0.98 -> 1 for subtle depth
//   - Reduced motion fallback

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * ContentReveal - Wraps content to provide smooth skeleton-to-content transitions
 *
 * @param {boolean} isLoading - Whether to show skeleton (true) or content (false)
 * @param {React.ReactNode} skeleton - Skeleton component to show during loading
 * @param {React.ReactNode} children - Content to reveal after loading
 * @param {number} duration - Animation duration in seconds (default: 0.3)
 */
const ContentReveal = ({
  isLoading,
  skeleton,
  children,
  duration = 0.3
}) => {
  const prefersReducedMotion = useReducedMotion();

  // Skip animations if user prefers reduced motion
  if (prefersReducedMotion) {
    return isLoading ? skeleton : children;
  }

  // Skeleton exit animation (compositor-only: opacity + scale)
  const skeletonVariants = {
    initial: { opacity: 1 },
    exit: {
      opacity: 0,
      scale: 0.98,
      transition: {
        duration: duration * 0.7,
        ease: 'easeOut'
      }
    }
  };

  // Content enter animation (compositor-only: opacity + scale)
  const contentVariants = {
    initial: {
      opacity: 0,
      scale: 0.98
    },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration,
        ease: [0.25, 0.1, 0.25, 1] // Custom easing for smooth reveal
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="skeleton"
          variants={skeletonVariants}
          initial="initial"
          exit="exit"
        >
          {skeleton}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          variants={contentVariants}
          initial="initial"
          animate="animate"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * ContentRevealSimple - CSS-only version without Framer Motion
 * Lighter weight, suitable for many simultaneous transitions
 */
const ContentRevealSimple = ({
  isLoading,
  skeleton,
  children
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return isLoading ? skeleton : children;
  }

  return (
    <div className="relative">
      {isLoading ? (
        <div className="skeleton-fade-out">
          {skeleton}
        </div>
      ) : (
        <div className="content-reveal">
          {children}
        </div>
      )}
    </div>
  );
};

export { ContentReveal, ContentRevealSimple };
export default ContentReveal;
