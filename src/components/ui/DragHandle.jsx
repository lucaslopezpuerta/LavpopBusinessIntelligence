// DragHandle.jsx v1.0 - ANIMATED DRAG HANDLE FOR MODALS
// Visual feedback component for swipe-to-close gesture
// Design System v5.1 compliant
//
// FEATURES:
// - Width animates: 48px → 56px (dragging) → 64px (threshold)
// - Subtle Y translation follows drag progress (max 4px)
// - Color intensifies based on drag progress
// - Glow effect when threshold reached
// - Respects prefers-reduced-motion
//
// USAGE:
// <DragHandle
//   isDragging={boolean}
//   progress={0-1}
//   hasReachedThreshold={boolean}
// />
//
// CHANGELOG:
// v1.0 (2026-01-31): Initial implementation
//   - Extracted from CustomerSegmentModal pattern
//   - Added progress-based Y translation
//   - Added threshold glow effect
//   - Reduced motion support

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { DRAG_HANDLE } from '../../constants/animations';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Animated drag handle for modal swipe-to-close
 * @param {Object} props
 * @param {boolean} props.isDragging - Whether user is actively dragging
 * @param {number} props.progress - Drag progress 0-1 (0 = start, 1 = threshold)
 * @param {boolean} props.hasReachedThreshold - Whether drag has reached close threshold
 * @param {string} props.className - Additional CSS classes for container
 */
const DragHandle = ({
  isDragging = false,
  progress = 0,
  hasReachedThreshold = false,
  className = ''
}) => {
  const prefersReducedMotion = useReducedMotion();
  const { isDark } = useTheme();

  // Calculate dynamic width based on state
  const width = useMemo(() => {
    if (hasReachedThreshold) {
      return DRAG_HANDLE.WIDTH_THRESHOLD;
    }
    if (isDragging) {
      // Interpolate between DRAGGING and THRESHOLD based on progress
      const range = DRAG_HANDLE.WIDTH_THRESHOLD - DRAG_HANDLE.WIDTH_DRAGGING;
      return DRAG_HANDLE.WIDTH_DRAGGING + (range * progress);
    }
    return DRAG_HANDLE.WIDTH_DEFAULT;
  }, [isDragging, progress, hasReachedThreshold]);

  // Calculate Y translation following drag (max 4px)
  const translateY = useMemo(() => {
    if (!isDragging) return 0;
    return progress * DRAG_HANDLE.TRANSLATE_MAX;
  }, [isDragging, progress]);

  // Determine color class based on state
  const colorClass = useMemo(() => {
    if (hasReachedThreshold) {
      return isDark ? DRAG_HANDLE.COLORS.THRESHOLD_DARK : DRAG_HANDLE.COLORS.THRESHOLD_LIGHT;
    }
    if (isDragging) {
      return isDark ? DRAG_HANDLE.COLORS.DRAGGING_DARK : DRAG_HANDLE.COLORS.DRAGGING_LIGHT;
    }
    return isDark ? DRAG_HANDLE.COLORS.DEFAULT_DARK : DRAG_HANDLE.COLORS.DEFAULT_LIGHT;
  }, [isDragging, hasReachedThreshold, isDark]);

  // Calculate opacity based on state
  const opacity = useMemo(() => {
    if (hasReachedThreshold) return 1;
    if (isDragging) return 0.8 + (progress * 0.2);
    return 0.8;
  }, [isDragging, progress, hasReachedThreshold]);

  // Animation transition
  const transition = prefersReducedMotion
    ? { duration: 0 }
    : DRAG_HANDLE.SPRING;

  // Glow style for threshold state
  const glowStyle = hasReachedThreshold && !prefersReducedMotion
    ? DRAG_HANDLE.GLOW
    : {};

  return (
    <div className={`flex justify-center ${className}`}>
      <motion.div
        className={`rounded-full ${colorClass}`}
        style={{
          height: DRAG_HANDLE.HEIGHT,
          ...glowStyle
        }}
        animate={{
          width,
          y: translateY,
          opacity
        }}
        transition={transition}
        aria-hidden="true"
      />
    </div>
  );
};

export default DragHandle;
