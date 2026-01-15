// useLongPress.js v1.1
// Hook for detecting long-press gestures on touch devices
//
// FEATURES:
// - Configurable press duration (default 500ms)
// - Prevents accidental triggers during scroll
// - Visual feedback via callback
// - Cancels on movement threshold exceeded
// - Works with both touch and mouse events
// - Haptic feedback via centralized haptics utility
//
// USAGE:
// const { handlers, isLongPressing } = useLongPress({
//   onLongPress: () => console.log('Long pressed!'),
//   onPress: () => console.log('Short press'),
//   onLongPressStart: () => console.log('Hold started'),
//   duration: 500,
//   enabled: true
// });
// <div {...handlers}>Press me</div>
//
// CHANGELOG:
// v1.1 (2026-01-15): Enhancements for chart integration
//   - Use haptics utility instead of navigator.vibrate()
//   - Add enabled option for conditional activation
//   - Add onLongPressStart callback for visual feedback during hold
// v1.0 (2025-12-18): Initial implementation

import { useState, useRef, useCallback } from 'react';
import { haptics } from '../utils/haptics';

/**
 * Hook for long-press gesture detection
 * @param {Object} options
 * @param {Function} options.onLongPress - Callback when long press is detected
 * @param {Function} options.onPress - Callback for short press (click)
 * @param {Function} options.onLongPressStart - Callback when press starts (for visual feedback)
 * @param {number} options.duration - Duration in ms to trigger long press (default: 500)
 * @param {number} options.moveThreshold - Movement threshold in px to cancel (default: 10)
 * @param {boolean} options.vibrate - Enable haptic feedback on long press (default: true)
 * @param {boolean} options.enabled - Enable/disable the hook (default: true)
 */
export function useLongPress({
  onLongPress,
  onPress,
  onLongPressStart,
  duration = 500,
  moveThreshold = 10,
  vibrate = true,
  enabled = true
} = {}) {
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [isPressing, setIsPressing] = useState(false); // True while holding (before long press fires)
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

    // Haptic feedback using centralized haptics utility
    if (vibrate) {
      haptics.medium();
    }

    onLongPress?.(e);

    // Reset after animation
    setTimeout(() => setIsLongPressing(false), 200);
  }, [onLongPress, vibrate]);

  const handleStart = useCallback((e) => {
    // Skip if disabled
    if (!enabled) return;

    // Get touch/mouse position
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startPosRef.current = { x: clientX, y: clientY };
    isLongPressTriggeredRef.current = false;
    setIsPressing(true);

    // Notify that press started (for visual feedback like scaling)
    onLongPressStart?.({ x: clientX, y: clientY, event: e });

    // Start timer
    timerRef.current = setTimeout(() => {
      triggerLongPress(e);
    }, duration);
  }, [duration, triggerLongPress, enabled, onLongPressStart]);

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
      setIsPressing(false);
    }
  }, [clearTimer, moveThreshold]);

  const handleEnd = useCallback((e) => {
    clearTimer();
    setIsPressing(false);

    // If it was a short press (not long press), trigger onPress
    if (!isLongPressTriggeredRef.current && onPress) {
      onPress(e);
    }

    isLongPressTriggeredRef.current = false;
  }, [clearTimer, onPress]);

  const handleCancel = useCallback(() => {
    clearTimer();
    setIsPressing(false);
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
    isLongPressing,   // True briefly when long press fires (for pulse animation)
    isPressing,       // True while holding down (for scale/opacity feedback)
    startPos: startPosRef.current, // Touch/click position for hit-testing
  };
}

export default useLongPress;
