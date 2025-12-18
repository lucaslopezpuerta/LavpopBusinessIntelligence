// haptics.js v1.0
// Haptic feedback utilities for mobile devices
//
// FEATURES:
// - Light, medium, heavy feedback patterns
// - Success, error, warning feedback
// - Selection tick feedback
// - Safe fallback when vibration not supported
//
// USAGE:
// import { haptics } from '../utils/haptics';
// haptics.light(); // Light tap
// haptics.success(); // Success pattern
//
// CHANGELOG:
// v1.0 (2025-12-18): Initial implementation

/**
 * Check if vibration is supported
 */
const canVibrate = () => {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
};

/**
 * Safely trigger vibration
 * @param {number|number[]} pattern - Vibration pattern in ms
 */
const vibrate = (pattern) => {
  if (canVibrate()) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Silently fail if vibration fails
    }
  }
};

export const haptics = {
  /**
   * Light tap feedback (navigation, selection)
   */
  light: () => vibrate(10),

  /**
   * Medium tap feedback (toggle, action)
   */
  medium: () => vibrate(25),

  /**
   * Heavy tap feedback (important action)
   */
  heavy: () => vibrate(50),

  /**
   * Selection tick (quick feedback)
   */
  tick: () => vibrate(5),

  /**
   * Success pattern (two short taps)
   */
  success: () => vibrate([10, 50, 10]),

  /**
   * Error pattern (three pulses)
   */
  error: () => vibrate([50, 50, 50, 50, 50]),

  /**
   * Warning pattern (single long pulse)
   */
  warning: () => vibrate([100]),

  /**
   * Notification pattern
   */
  notification: () => vibrate([100, 50, 100]),

  /**
   * Custom pattern
   * @param {number|number[]} pattern - Vibration pattern
   */
  custom: (pattern) => vibrate(pattern),

  /**
   * Check if device supports haptics
   */
  isSupported: canVibrate,
};

export default haptics;
