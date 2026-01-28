// ContentReveal.jsx v1.0
// Smooth skeleton-to-content transition wrapper
// Design System v5.1 compliant
//
// Usage:
//   <ContentReveal isLoading={!data} skeleton={<MySkeleton />}>
//     <ActualContent />
//   </ContentReveal>
//
// Features:
//   - Skeleton fades out with blur + scale
//   - Content reveals with blur-to-sharp focus effect
//   - Respects prefers-reduced-motion
//   - Uses Framer Motion for smooth animations
//
// CHANGELOG:
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
 * @param {number} blurAmount - Blur pixels during transition (default: 4)
 * @param {number} duration - Animation duration in seconds (default: 0.3)
 */
const ContentReveal = ({
  isLoading,
  skeleton,
  children,
  blurAmount = 4,
  duration = 0.3
}) => {
  const prefersReducedMotion = useReducedMotion();

  // Skip animations if user prefers reduced motion
  if (prefersReducedMotion) {
    return isLoading ? skeleton : children;
  }

  // Skeleton exit animation
  const skeletonVariants = {
    initial: { opacity: 1 },
    exit: {
      opacity: 0,
      scale: 0.98,
      filter: `blur(${blurAmount}px)`,
      transition: {
        duration: duration * 0.7,
        ease: 'easeOut'
      }
    }
  };

  // Content enter animation
  const contentVariants = {
    initial: {
      opacity: 0,
      filter: `blur(${blurAmount}px)`,
      scale: 0.98
    },
    animate: {
      opacity: 1,
      filter: 'blur(0px)',
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
