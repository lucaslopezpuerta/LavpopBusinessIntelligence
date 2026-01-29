// haptics.js v2.1
// Haptic feedback utilities with native Capacitor support
//
// FEATURES:
// - Native Capacitor Haptics on Android/iOS (richer feedback)
// - Web fallback using navigator.vibrate
// - Light, medium, heavy feedback patterns
// - Success, error, warning, notification feedback
// - Selection tick feedback
// - Safe fallback when vibration not supported
// - Chrome intervention-safe (tracks user interaction)
//
// USAGE:
// import { haptics } from '../utils/haptics';
// await haptics.light();   // Light tap (async on native)
// await haptics.success(); // Success pattern
//
// CHANGELOG:
// v2.1 (2026-01-28): Chrome intervention fix
//   - Track user interaction to avoid "Blocked call to navigator.vibrate"
//   - Web vibration only triggers after first user gesture
//   - Silently skips vibration before user interaction (no console warnings)
// v2.0 (2026-01-28): Capacitor Haptics integration
//   - Added @capacitor/haptics for native Android/iOS support
//   - Async API for native haptics (returns Promise)
//   - Web fallback maintained for browser testing
//   - Richer haptic patterns on native (ImpactStyle, NotificationType)
// v1.0 (2025-12-18): Initial implementation

import { Capacitor } from '@capacitor/core';

// Lazy-load Capacitor Haptics to avoid bundle bloat on web
let HapticsModule = null;

// Track user interaction to avoid Chrome intervention warning
// "Blocked call to navigator.vibrate because user hasn't tapped on the frame"
let hasUserInteracted = false;

// Set up user interaction detection (runs once)
if (typeof window !== 'undefined') {
  const markInteracted = () => {
    hasUserInteracted = true;
    // Remove listeners after first interaction
    window.removeEventListener('touchstart', markInteracted, { capture: true });
    window.removeEventListener('click', markInteracted, { capture: true });
    window.removeEventListener('keydown', markInteracted, { capture: true });
  };

  // Listen for first user interaction
  window.addEventListener('touchstart', markInteracted, { capture: true, passive: true });
  window.addEventListener('click', markInteracted, { capture: true });
  window.addEventListener('keydown', markInteracted, { capture: true });
}

/**
 * Check if running on native platform
 */
const isNative = () => {
  return Capacitor.isNativePlatform();
};

/**
 * Check if web vibration is supported
 */
const canVibrate = () => {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
};

/**
 * Get the Capacitor Haptics module (lazy-loaded)
 */
const getHaptics = async () => {
  if (!HapticsModule && isNative()) {
    try {
      HapticsModule = await import('@capacitor/haptics');
    } catch (e) {
      // Haptics not available, fall back to web
      HapticsModule = null;
    }
  }
  return HapticsModule;
};

/**
 * Safely trigger web vibration
 * Only triggers after user has interacted with the page (Chrome intervention fix)
 * @param {number|number[]} pattern - Vibration pattern in ms
 */
const vibrate = (pattern) => {
  // Skip if user hasn't interacted yet (prevents Chrome intervention warning)
  if (!hasUserInteracted) {
    return;
  }

  if (canVibrate()) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Silently fail if vibration fails
    }
  }
};

/**
 * Trigger native haptic impact
 * @param {'Light'|'Medium'|'Heavy'} style - Impact style
 */
const nativeImpact = async (style) => {
  const haptics = await getHaptics();
  if (haptics?.Haptics) {
    try {
      await haptics.Haptics.impact({ style: haptics.ImpactStyle[style] });
    } catch (e) {
      // Fall back to web vibration if native fails
      const webPatterns = { Light: 10, Medium: 25, Heavy: 50 };
      vibrate(webPatterns[style] || 10);
    }
  }
};

/**
 * Trigger native notification haptic
 * @param {'Success'|'Warning'|'Error'} type - Notification type
 */
const nativeNotification = async (type) => {
  const haptics = await getHaptics();
  if (haptics?.Haptics) {
    try {
      await haptics.Haptics.notification({ type: haptics.NotificationType[type] });
    } catch (e) {
      // Fall back to web vibration patterns
      const webPatterns = {
        Success: [10, 50, 10],
        Warning: [100],
        Error: [50, 50, 50, 50, 50]
      };
      vibrate(webPatterns[type] || [10]);
    }
  }
};

/**
 * Trigger native selection changed haptic
 */
const nativeSelectionChanged = async () => {
  const haptics = await getHaptics();
  if (haptics?.Haptics) {
    try {
      await haptics.Haptics.selectionChanged();
    } catch (e) {
      vibrate(5);
    }
  }
};

export const haptics = {
  /**
   * Light tap feedback (navigation, selection)
   * Native: ImpactStyle.Light
   * Web: 10ms vibration
   */
  light: async () => {
    if (isNative()) {
      await nativeImpact('Light');
    } else {
      vibrate(10);
    }
  },

  /**
   * Medium tap feedback (toggle, action)
   * Native: ImpactStyle.Medium
   * Web: 25ms vibration
   */
  medium: async () => {
    if (isNative()) {
      await nativeImpact('Medium');
    } else {
      vibrate(25);
    }
  },

  /**
   * Heavy tap feedback (important action)
   * Native: ImpactStyle.Heavy
   * Web: 50ms vibration
   */
  heavy: async () => {
    if (isNative()) {
      await nativeImpact('Heavy');
    } else {
      vibrate(50);
    }
  },

  /**
   * Selection tick (quick feedback)
   * Native: selectionChanged
   * Web: 5ms vibration
   */
  tick: async () => {
    if (isNative()) {
      await nativeSelectionChanged();
    } else {
      vibrate(5);
    }
  },

  /**
   * Success pattern (action completed)
   * Native: NotificationType.Success
   * Web: Two short taps
   */
  success: async () => {
    if (isNative()) {
      await nativeNotification('Success');
    } else {
      vibrate([10, 50, 10]);
    }
  },

  /**
   * Error pattern (action failed)
   * Native: NotificationType.Error
   * Web: Three pulses
   */
  error: async () => {
    if (isNative()) {
      await nativeNotification('Error');
    } else {
      vibrate([50, 50, 50, 50, 50]);
    }
  },

  /**
   * Warning pattern (attention needed)
   * Native: NotificationType.Warning
   * Web: Single long pulse
   */
  warning: async () => {
    if (isNative()) {
      await nativeNotification('Warning');
    } else {
      vibrate([100]);
    }
  },

  /**
   * Notification pattern
   * Web-only: 100ms-50ms-100ms pattern
   */
  notification: async () => {
    if (isNative()) {
      // Use success notification for native (no specific notification type)
      await nativeNotification('Success');
    } else {
      vibrate([100, 50, 100]);
    }
  },

  /**
   * Custom pattern
   * @param {number|number[]} pattern - Vibration pattern
   * Web-only (native ignores custom patterns)
   */
  custom: async (pattern) => {
    if (isNative()) {
      // Native doesn't support custom patterns, use medium impact as fallback
      await nativeImpact('Medium');
    } else {
      vibrate(pattern);
    }
  },

  /**
   * Check if device supports haptics
   * Returns true for native or web with vibration support
   */
  isSupported: () => {
    return isNative() || canVibrate();
  },

  /**
   * Check if running on native platform
   */
  isNative,
};

export default haptics;
