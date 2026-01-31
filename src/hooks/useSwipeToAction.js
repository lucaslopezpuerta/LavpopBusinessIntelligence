// useSwipeToAction.js v1.0 - Swipe-to-Action Gesture Hook
// Shared hook for swipe gestures with haptic feedback and success animations
//
// FEATURES:
// - Spring physics for smooth card movement
// - Haptic feedback at threshold crossing (10ms pulse)
// - Success vibration pattern on action trigger ([20, 50, 20]ms)
// - Visual threshold indicator (icon scale bump at 56px)
// - Success state for card flash animation
// - Velocity-based fast flick detection
// - Deadzone for preventing accidental triggers
// - Respects prefers-reduced-motion
//
// USAGE:
// const { swipeState, actionSuccess, handlers, isSwipingItem, getSuccessState } = useSwipeToAction({
//   onSwipeLeft: (id, data) => handleCall(data),
//   onSwipeRight: (id, data) => handleWhatsApp(data),
// });
//
// CHANGELOG:
// v1.0 (2026-01-30): Initial release
//   - Extracted from AtRiskCustomersTable and CustomerListDrilldown
//   - Added haptic feedback at threshold crossing
//   - Added success vibration pattern
//   - Added threshold indicator (icon scale bump)
//   - Added success state for visual feedback

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSpring, useTransform } from 'framer-motion';
import { SWIPE_ACTION } from '../constants/animations';

/**
 * Hook for swipe-to-action gestures with haptic feedback and visual confirmation
 *
 * @param {Object} options
 * @param {Function} options.onSwipeLeft - Callback for left swipe (e.g., call)
 * @param {Function} options.onSwipeRight - Callback for right swipe (e.g., WhatsApp)
 * @param {boolean} options.canSwipeLeft - Enable left swipe (default: true)
 * @param {boolean} options.canSwipeRight - Enable right swipe (default: true)
 * @param {boolean} options.disabled - Disable all swipe gestures (default: false)
 * @param {boolean} options.reduceMotion - Respect reduced motion preference (default: false)
 * @returns {Object} Swipe state, animations, and handlers
 */
export const useSwipeToAction = ({
  onSwipeLeft,
  onSwipeRight,
  canSwipeLeft = true,
  canSwipeRight = true,
  disabled = false,
  reduceMotion = false,
} = {}) => {
  const [swipeState, setSwipeState] = useState({ id: null, direction: null, offset: 0 });
  const [actionSuccess, setActionSuccess] = useState(null); // 'left' | 'right' | null
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const prevThresholdRef = useRef(false);
  const successTimeoutRef = useRef(null);

  // Spring for smooth card movement
  const x = useSpring(0, SWIPE_ACTION.CARD_SPRING);

  // Icon transforms with threshold indicator (bump at 56px)
  // Left side (WhatsApp - swipe right to reveal)
  const leftIconScale = useTransform(
    x,
    [0, 40, 56, 72],
    [0.6, 0.9, 1.15, 1.0] // Scale bump at threshold then settle
  );
  const leftIconOpacity = useTransform(x, [0, 30, 56], [0, 0.7, 1]);

  // Right side (Call - swipe left to reveal)
  const rightIconScale = useTransform(
    x,
    [-72, -56, -40, 0],
    [1.0, 1.15, 0.9, 0.6] // Scale bump at threshold then settle
  );
  const rightIconOpacity = useTransform(x, [-56, -30, 0], [1, 0.7, 0]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  // Haptic feedback at threshold crossing
  useEffect(() => {
    if (disabled || reduceMotion) return;

    const { THRESHOLDS } = SWIPE_ACTION;
    const meetsThreshold = Math.abs(swipeState.offset) >= THRESHOLDS.ACTION_TRIGGER;

    // Vibrate when crossing threshold (not already past it)
    if (meetsThreshold && !prevThresholdRef.current) {
      if (navigator.vibrate) {
        navigator.vibrate(10); // Subtle 10ms pulse
      }
    }
    prevThresholdRef.current = meetsThreshold;
  }, [swipeState.offset, disabled, reduceMotion]);

  /**
   * Handle touch start - initialize swipe tracking
   */
  const handleTouchStart = useCallback((e, itemId) => {
    if (disabled) return;

    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    setSwipeState({ id: itemId, direction: null, offset: 0 });
  }, [disabled]);

  /**
   * Handle touch move - track swipe progress with constraints
   */
  const handleTouchMove = useCallback((e, itemId) => {
    if (disabled || swipeState.id !== itemId) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    const absX = Math.abs(deltaX);
    const { THRESHOLDS } = SWIPE_ACTION;

    // Deadzone: ignore micro-movements (prevents accidental triggers)
    if (absX < THRESHOLDS.DEADZONE) return;

    // Stricter vertical tolerance - cancel if too vertical (scrolling)
    if (deltaY > absX * THRESHOLDS.VERTICAL_RATIO) {
      setSwipeState({ id: null, direction: null, offset: 0 });
      x.set(0);
      return;
    }

    // Respect directional constraints
    let clampedOffset = deltaX;
    if (!canSwipeRight && deltaX > 0) clampedOffset = 0;
    if (!canSwipeLeft && deltaX < 0) clampedOffset = 0;

    const offset = Math.max(-THRESHOLDS.MAX_OFFSET, Math.min(THRESHOLDS.MAX_OFFSET, clampedOffset));
    const direction = offset > THRESHOLDS.DIRECTION_MIN ? 'right'
                    : offset < -THRESHOLDS.DIRECTION_MIN ? 'left'
                    : null;

    setSwipeState({ id: itemId, direction, offset });
    x.set(offset);
  }, [disabled, swipeState.id, canSwipeLeft, canSwipeRight, x]);

  /**
   * Handle touch end - trigger action or snap back
   */
  const handleTouchEnd = useCallback((itemId, itemData) => {
    if (disabled) return;

    const { THRESHOLDS } = SWIPE_ACTION;
    const absOffset = Math.abs(swipeState.offset);
    const elapsed = Date.now() - touchStartRef.current.time;
    const velocity = elapsed > 0 ? absOffset / elapsed : 0;

    // Must meet threshold OR have high velocity (for quick flicks)
    const meetsThreshold = absOffset >= THRESHOLDS.ACTION_TRIGGER;
    const hasHighVelocity = velocity >= THRESHOLDS.MIN_VELOCITY && absOffset > THRESHOLDS.DIRECTION_MIN;

    if (swipeState.direction && (meetsThreshold || hasHighVelocity)) {
      // Success haptic feedback (pattern: short-pause-short)
      if (navigator.vibrate && !reduceMotion) {
        navigator.vibrate([20, 50, 20]);
      }

      // Set success state for visual feedback
      const successDirection = swipeState.direction;
      setActionSuccess(successDirection);

      // Trigger the appropriate callback
      if (successDirection === 'right' && onSwipeRight) {
        onSwipeRight(itemId, itemData);
      } else if (successDirection === 'left' && onSwipeLeft) {
        onSwipeLeft(itemId, itemData);
      }

      // Hold success state briefly, then reset
      successTimeoutRef.current = setTimeout(() => {
        setActionSuccess(null);
        setSwipeState({ id: null, direction: null, offset: 0 });
        x.set(0);
        prevThresholdRef.current = false;
      }, reduceMotion ? 0 : 350);
    } else {
      // Snap back without action
      setSwipeState({ id: null, direction: null, offset: 0 });
      x.set(0);
      prevThresholdRef.current = false;
    }
  }, [disabled, swipeState, onSwipeLeft, onSwipeRight, x, reduceMotion]);

  /**
   * Handle touch cancel - reset state
   */
  const handleTouchCancel = useCallback(() => {
    setSwipeState({ id: null, direction: null, offset: 0 });
    x.set(0);
    prevThresholdRef.current = false;
  }, [x]);

  /**
   * Reset swipe state (useful for external control)
   */
  const resetSwipe = useCallback(() => {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    setActionSuccess(null);
    setSwipeState({ id: null, direction: null, offset: 0 });
    x.set(0);
    prevThresholdRef.current = false;
  }, [x]);

  return {
    // State
    swipeState,
    actionSuccess,

    // Spring motion value for card position
    x,

    // Icon animation transforms (with threshold indicator)
    leftIconScale,
    leftIconOpacity,
    rightIconScale,
    rightIconOpacity,

    // Touch event handlers
    handlers: {
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      handleTouchCancel,
    },

    // Helper methods
    isSwipingItem: (id) => swipeState.id === id,
    getSuccessState: (id) => swipeState.id === id ? actionSuccess : null,
    resetSwipe,
  };
};

export default useSwipeToAction;
