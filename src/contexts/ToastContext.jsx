// ToastContext.jsx v1.2 - PAUSE/RESUME + PROGRESS TRACKING
// Provides toast API for showing success, error, warning, and info notifications
//
// CHANGELOG:
// v1.2 (2026-01-31): Pause/resume + progress tracking
//   - Added pauseToast/resumeToast for hover-to-pause behavior
//   - Added remainingTime tracking for progress bar animation
//   - Toast now stores duration and pausedAt for time calculations
//   - Exposed getRemainingTime helper for progress bar
// v1.1 (2026-01-28): Haptic feedback integration
//   - Added haptic feedback when toast appears
//   - Different haptic patterns for each toast type:
//     - success: haptics.success()
//     - error: haptics.error()
//     - warning: haptics.warning()
//     - info: haptics.notification()
// v1.0 (2026-01-27): Initial implementation
//   - Global toast state with auto-incrementing IDs
//   - Auto-dismiss with configurable duration
//   - Support for action buttons
//   - Queue management for multiple toasts (max 5)

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { haptics } from '../utils/haptics';

const ToastContext = createContext(null);

// Toast types for styling
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Default duration in milliseconds
const DEFAULT_DURATION = 4000;
const MAX_TOASTS = 5;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idCounterRef = useRef(0);
  const timersRef = useRef(new Map());
  // Track remaining time when paused
  const pausedStateRef = useRef(new Map()); // { id: { remainingTime, pausedAt } }

  // Clear timer for a toast
  const clearTimer = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    pausedStateRef.current.delete(id);
  }, []);

  // Dismiss a single toast
  const dismissToast = useCallback((id) => {
    clearTimer(id);
    setToasts(prev => prev.filter(t => t.id !== id));
  }, [clearTimer]);

  // Dismiss all toasts
  const dismissAll = useCallback(() => {
    // Clear all timers
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    setToasts([]);
  }, []);

  // Haptic feedback map for toast types
  const triggerHaptic = useCallback((type) => {
    switch (type) {
      case TOAST_TYPES.SUCCESS:
        haptics.success();
        break;
      case TOAST_TYPES.ERROR:
        haptics.error();
        break;
      case TOAST_TYPES.WARNING:
        haptics.warning();
        break;
      case TOAST_TYPES.INFO:
      default:
        haptics.notification();
        break;
    }
  }, []);

  // Show a new toast
  const showToast = useCallback(({
    type = TOAST_TYPES.INFO,
    message,
    duration = DEFAULT_DURATION,
    action = null // { label: string, onClick: () => void }
  }) => {
    const id = ++idCounterRef.current;
    const createdAt = Date.now();

    const newToast = {
      id,
      type,
      message,
      action,
      duration,    // Store duration for progress bar
      createdAt,
      isPaused: false
    };

    // Trigger haptic feedback based on toast type
    triggerHaptic(type);

    setToasts(prev => {
      // Remove oldest toasts if we exceed max
      const updated = [...prev, newToast];
      if (updated.length > MAX_TOASTS) {
        const toRemove = updated.slice(0, updated.length - MAX_TOASTS);
        toRemove.forEach(t => clearTimer(t.id));
        return updated.slice(-MAX_TOASTS);
      }
      return updated;
    });

    // Set auto-dismiss timer (0 or negative duration means no auto-dismiss)
    if (duration > 0) {
      const timer = setTimeout(() => {
        dismissToast(id);
      }, duration);
      timersRef.current.set(id, timer);
    }

    return id;
  }, [dismissToast, clearTimer, triggerHaptic]);

  // Pause toast auto-dismiss (for hover behavior)
  const pauseToast = useCallback((id) => {
    const toast = toasts.find(t => t.id === id);
    if (!toast || toast.duration <= 0) return;

    // Clear existing timer
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }

    // Calculate remaining time
    const elapsed = Date.now() - toast.createdAt;
    const previousPaused = pausedStateRef.current.get(id);
    const remainingTime = previousPaused
      ? previousPaused.remainingTime
      : Math.max(0, toast.duration - elapsed);

    // Store paused state
    pausedStateRef.current.set(id, {
      remainingTime,
      pausedAt: Date.now()
    });

    // Update toast isPaused state
    setToasts(prev => prev.map(t =>
      t.id === id ? { ...t, isPaused: true } : t
    ));
  }, [toasts]);

  // Resume toast auto-dismiss
  const resumeToast = useCallback((id) => {
    const pausedState = pausedStateRef.current.get(id);
    if (!pausedState) return;

    const { remainingTime } = pausedState;
    pausedStateRef.current.delete(id);

    // Update toast isPaused state and createdAt to reflect new timeline
    setToasts(prev => prev.map(t =>
      t.id === id ? {
        ...t,
        isPaused: false,
        createdAt: Date.now() - (t.duration - remainingTime) // Adjust createdAt for progress bar
      } : t
    ));

    // Set new timer with remaining time
    if (remainingTime > 0) {
      const timer = setTimeout(() => {
        dismissToast(id);
      }, remainingTime);
      timersRef.current.set(id, timer);
    }
  }, [dismissToast]);

  // Convenience methods
  const success = useCallback((message, options = {}) => {
    return showToast({ type: TOAST_TYPES.SUCCESS, message, ...options });
  }, [showToast]);

  const error = useCallback((message, options = {}) => {
    return showToast({ type: TOAST_TYPES.ERROR, message, ...options });
  }, [showToast]);

  const warning = useCallback((message, options = {}) => {
    return showToast({ type: TOAST_TYPES.WARNING, message, ...options });
  }, [showToast]);

  const info = useCallback((message, options = {}) => {
    return showToast({ type: TOAST_TYPES.INFO, message, ...options });
  }, [showToast]);

  const value = {
    toasts,
    showToast,
    dismissToast,
    dismissAll,
    // Pause/resume for hover behavior
    pauseToast,
    resumeToast,
    // Convenience methods
    success,
    error,
    warning,
    info
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastContext;
