// useSwipeToClose.js v1.1 - THRESHOLD HAPTIC FEEDBACK
// Hook for swipe-down-to-close gesture on mobile modals/sheets
//
// FEATURES:
// - Swipe down to close (configurable threshold)
// - Visual feedback during drag (translateY)
// - Resistance factor for natural feel
// - Velocity-based closing (fast swipe = close)
// - Optional backdrop opacity tied to drag
// - Haptic feedback when crossing threshold (once per gesture)
// - Exposes hasReachedThreshold for visual feedback
// - Works with Framer Motion or vanilla
//
// USAGE:
// const { handlers, style, isDragging, progress, hasReachedThreshold } = useSwipeToClose({
//   onClose: () => setIsOpen(false),
//   threshold: 100,
// });
// <div {...handlers} style={style}>Modal content</div>
//
// CHANGELOG:
// v1.1 (2026-01-31): Threshold haptic feedback
//   - Added hasTriggeredHapticRef to track threshold crossing
//   - Added haptics.tick() when crossing threshold (once per gesture)
//   - Reset haptic ref on gesture end/cancel
//   - Exposed hasReachedThreshold boolean state for visual feedback
// v1.0 (2025-12-18): Initial implementation

import { useState, useRef, useCallback, useMemo } from 'react';
import { haptics } from '../utils/haptics';

/**
 * Hook for swipe-to-close gesture on modals/sheets
 * @param {Object} options
 * @param {Function} options.onClose - Callback when swipe threshold is exceeded
 * @param {number} options.threshold - Distance in px to trigger close (default: 100)
 * @param {number} options.velocityThreshold - Velocity in px/ms to trigger close (default: 0.5)
 * @param {number} options.resistance - Resistance factor for drag (default: 0.5)
 * @param {boolean} options.disabled - Disable swipe gesture
 */
export function useSwipeToClose({
  onClose,
  threshold = 100,
  velocityThreshold = 0.5,
  resistance = 0.5,
  disabled = false,
} = {}) {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const currentYRef = useRef(0);
  const hasTriggeredHapticRef = useRef(false);

  const handleStart = useCallback((e) => {
    if (disabled) return;

    // Get touch/mouse Y position
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startYRef.current = clientY;
    currentYRef.current = clientY;
    startTimeRef.current = Date.now();
    hasTriggeredHapticRef.current = false;
    setIsDragging(true);
  }, [disabled]);

  const handleMove = useCallback((e) => {
    if (!isDragging || disabled) return;

    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - startYRef.current;
    currentYRef.current = clientY;

    // Only allow downward drag (positive deltaY)
    if (deltaY > 0) {
      // Apply resistance
      const resistedDelta = deltaY * resistance;
      setDragY(resistedDelta);

      // Haptic feedback when crossing threshold (once per gesture)
      if (resistedDelta >= threshold && !hasTriggeredHapticRef.current) {
        hasTriggeredHapticRef.current = true;
        haptics.tick();
      }
    } else {
      setDragY(0);
    }
  }, [isDragging, disabled, resistance, threshold]);

  const handleEnd = useCallback(() => {
    if (!isDragging || disabled) return;

    const endTime = Date.now();
    const duration = endTime - startTimeRef.current;
    const distance = currentYRef.current - startYRef.current;
    const velocity = distance / duration; // px/ms

    // Check if should close (threshold or velocity)
    const shouldClose = dragY > threshold || velocity > velocityThreshold;

    if (shouldClose && onClose) {
      haptics.light();
      onClose();
    }

    // Reset
    setDragY(0);
    setIsDragging(false);
    hasTriggeredHapticRef.current = false;
  }, [isDragging, disabled, dragY, threshold, velocityThreshold, onClose]);

  const handleCancel = useCallback(() => {
    setDragY(0);
    setIsDragging(false);
    hasTriggeredHapticRef.current = false;
  }, []);

  // Style to apply to the modal container
  const style = useMemo(() => ({
    transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
    transition: isDragging ? 'none' : 'transform 0.3s ease-out',
  }), [dragY, isDragging]);

  // Opacity for backdrop (fades as you drag)
  const backdropOpacity = useMemo(() => {
    if (!isDragging || dragY <= 0) return 1;
    return Math.max(0.3, 1 - (dragY / threshold) * 0.7);
  }, [isDragging, dragY, threshold]);

  // Progress value 0-1 for animations
  const progress = useMemo(() => {
    return Math.min(1, Math.max(0, dragY / threshold));
  }, [dragY, threshold]);

  // Boolean for threshold visual feedback
  const hasReachedThreshold = useMemo(() => {
    return dragY >= threshold;
  }, [dragY, threshold]);

  return {
    handlers: {
      onTouchStart: handleStart,
      onTouchMove: handleMove,
      onTouchEnd: handleEnd,
      onTouchCancel: handleCancel,
      onMouseDown: handleStart,
      onMouseMove: handleMove,
      onMouseUp: handleEnd,
      onMouseLeave: handleCancel,
    },
    style,
    isDragging,
    dragY,
    progress,
    backdropOpacity,
    hasReachedThreshold,
  };
}

export default useSwipeToClose;
