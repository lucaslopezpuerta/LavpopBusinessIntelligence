// useSwipeToClose.js v2.0 - FRAMER MOTION DRAG SYSTEM
// Hook for swipe-down-to-close gesture on mobile modals/sheets
//
// FEATURES:
// - Header-only drag zone (content scrolls freely)
// - Natural spring physics for snap-back and close
// - Velocity-based closing (fast swipe = close)
// - Backdrop opacity tied to drag progress
// - Haptic feedback at threshold
// - Uses Framer Motion's useDragControls for precise control
//
// USAGE:
// const { dragZoneProps, modalMotionProps, isDragging, progress, ... } = useSwipeToClose({
//   onClose: () => setIsOpen(false),
// });
// <motion.div {...modalMotionProps}>
//   <div {...dragZoneProps}>Header / Drag handle</div>
//   <main>Content (scrollable)</main>
// </motion.div>
//
// CHANGELOG:
// v2.0 (2026-02-01): Framer Motion drag system
//   - Complete refactor using useDragControls
//   - Header-only drag zone to prevent scroll interference
//   - Natural spring physics for snap-back and close animations
//   - Uses onDrag info.offset for position tracking
// v1.1 (2026-01-31): Threshold haptic feedback
// v1.0 (2025-12-18): Initial implementation

import { useCallback, useRef, useState } from 'react';
import { useDragControls, useMotionValue, useTransform } from 'framer-motion';
import { haptics } from '../utils/haptics';
import { MODAL_SWIPE } from '../constants/animations';

/**
 * Hook for swipe-to-close gesture on modals/sheets
 * Uses Framer Motion's drag system for natural spring physics
 *
 * @param {Object} options
 * @param {Function} options.onClose - Callback when swipe threshold is exceeded
 * @param {number} options.threshold - Distance in px to trigger close (default: 100)
 * @param {number} options.velocityThreshold - Velocity in px/s to trigger close (default: 500)
 * @param {boolean} options.disabled - Disable swipe gesture
 */
export function useSwipeToClose({
  onClose,
  threshold = MODAL_SWIPE.THRESHOLD,
  velocityThreshold = MODAL_SWIPE.VELOCITY_THRESHOLD,
  disabled = false,
} = {}) {
  const dragControls = useDragControls();

  // Track current drag offset for derived values
  const dragY = useMotionValue(0);

  // Track drag state
  const [isDragging, setIsDragging] = useState(false);
  const [hasReachedThreshold, setHasReachedThreshold] = useState(false);
  const hasTriggeredHapticRef = useRef(false);
  const isClosingRef = useRef(false);

  // Derived values using useTransform for real-time updates
  const progress = useTransform(dragY, [0, threshold], [0, 1]);
  const backdropOpacity = useTransform(dragY, [0, threshold], [1, 0.3]);

  // Handle drag start from header zone
  const handlePointerDown = useCallback((e) => {
    if (disabled || isClosingRef.current) return;

    hasTriggeredHapticRef.current = false;
    setIsDragging(true);
    setHasReachedThreshold(false);
    dragY.set(0);
    dragControls.start(e);
  }, [disabled, dragControls, dragY]);

  // Monitor drag position for feedback
  const handleDrag = useCallback((event, info) => {
    const currentY = Math.max(0, info.offset.y);
    dragY.set(currentY);

    // Update threshold state
    const reachedThreshold = currentY >= threshold;
    setHasReachedThreshold(reachedThreshold);

    // Haptic feedback when crossing threshold (once per gesture)
    if (reachedThreshold && !hasTriggeredHapticRef.current) {
      hasTriggeredHapticRef.current = true;
      haptics.tick();
    }
  }, [dragY, threshold]);

  // Handle drag end - decide to close or snap back
  const handleDragEnd = useCallback((event, info) => {
    setIsDragging(false);
    hasTriggeredHapticRef.current = false;

    const { velocity, offset } = info;
    const shouldClose = offset.y > threshold || velocity.y > velocityThreshold;

    if (shouldClose && onClose && !isClosingRef.current) {
      isClosingRef.current = true;
      haptics.light();
      setHasReachedThreshold(false);

      // Let AnimatePresence handle the exit animation
      // Reset state and call onClose
      dragY.set(0);
      onClose();
      isClosingRef.current = false;
    } else {
      // Snap back - the dragConstraints will handle this automatically
      setHasReachedThreshold(false);
      dragY.set(0);
    }
  }, [threshold, velocityThreshold, onClose, dragY]);

  // Props for the drag initiation zone (header area)
  const dragZoneProps = {
    onPointerDown: handlePointerDown,
    style: { touchAction: 'none' },
  };

  // Motion props for the modal container
  const modalMotionProps = {
    drag: disabled ? false : 'y',
    dragControls,
    dragListener: false, // Important: only allow drag from dragZoneProps
    dragConstraints: { top: 0, bottom: 0 },
    dragElastic: { top: 0, bottom: MODAL_SWIPE.ELASTIC },
    dragSnapToOrigin: true, // Spring back to origin when released
    dragTransition: MODAL_SWIPE.SNAP_BACK, // Use spring physics
    onDrag: handleDrag,
    onDragEnd: handleDragEnd,
  };

  // Get current values for components that need them
  const getCurrentProgress = useCallback(() => progress.get(), [progress]);
  const getCurrentBackdropOpacity = useCallback(() => backdropOpacity.get(), [backdropOpacity]);

  return {
    // New API for header-only drag
    dragZoneProps,
    modalMotionProps,

    // State
    isDragging,
    hasReachedThreshold,

    // Motion values for external components (e.g., DragHandle, backdrop)
    dragY,
    progress,
    backdropOpacity,

    // Utility functions
    getCurrentProgress,
    getCurrentBackdropOpacity,

    // Legacy compatibility: handlers object (deprecated)
    handlers: dragZoneProps,
    style: {}, // No longer needed, use modalMotionProps
  };
}

export default useSwipeToClose;
