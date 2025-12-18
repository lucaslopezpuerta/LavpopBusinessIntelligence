// useLongPress.js v1.0
// Hook for detecting long-press gestures on touch devices
//
// FEATURES:
// - Configurable press duration (default 500ms)
// - Prevents accidental triggers during scroll
// - Visual feedback via callback
// - Cancels on movement threshold exceeded
// - Works with both touch and mouse events
//
// USAGE:
// const { handlers, isLongPressing } = useLongPress({
//   onLongPress: () => console.log('Long pressed!'),
//   onPress: () => console.log('Short press'),
//   duration: 500
// });
// <div {...handlers}>Press me</div>
//
// CHANGELOG:
// v1.0 (2025-12-18): Initial implementation

import { useState, useRef, useCallback } from 'react';

/**
 * Hook for long-press gesture detection
 * @param {Object} options
 * @param {Function} options.onLongPress - Callback when long press is detected
 * @param {Function} options.onPress - Callback for short press (click)
 * @param {number} options.duration - Duration in ms to trigger long press (default: 500)
 * @param {number} options.moveThreshold - Movement threshold in px to cancel (default: 10)
 * @param {boolean} options.vibrate - Enable haptic feedback on long press (default: true)
 */
export function useLongPress({
  onLongPress,
  onPress,
  duration = 500,
  moveThreshold = 10,
  vibrate = true
} = {}) {
  const [isLongPressing, setIsLongPressing] = useState(false);
  const timerRef = useRef(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const isLongPressTriggeredRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const triggerLongPress = useCallback((e) => {
    isLongPressTriggeredRef.current = true;
    setIsLongPressing(true);

    // Haptic feedback
    if (vibrate && navigator.vibrate) {
      navigator.vibrate(50);
    }

    onLongPress?.(e);

    // Reset after animation
    setTimeout(() => setIsLongPressing(false), 200);
  }, [onLongPress, vibrate]);

  const handleStart = useCallback((e) => {
    // Get touch/mouse position
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startPosRef.current = { x: clientX, y: clientY };
    isLongPressTriggeredRef.current = false;

    // Start timer
    timerRef.current = setTimeout(() => {
      triggerLongPress(e);
    }, duration);
  }, [duration, triggerLongPress]);

  const handleMove = useCallback((e) => {
    if (!timerRef.current) return;

    // Get current position
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // Calculate movement
    const deltaX = Math.abs(clientX - startPosRef.current.x);
    const deltaY = Math.abs(clientY - startPosRef.current.y);

    // Cancel if moved too much
    if (deltaX > moveThreshold || deltaY > moveThreshold) {
      clearTimer();
    }
  }, [clearTimer, moveThreshold]);

  const handleEnd = useCallback((e) => {
    clearTimer();

    // If it was a short press (not long press), trigger onPress
    if (!isLongPressTriggeredRef.current && onPress) {
      onPress(e);
    }

    isLongPressTriggeredRef.current = false;
  }, [clearTimer, onPress]);

  const handleCancel = useCallback(() => {
    clearTimer();
    isLongPressTriggeredRef.current = false;
  }, [clearTimer]);

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
    isLongPressing,
  };
}

export default useLongPress;
