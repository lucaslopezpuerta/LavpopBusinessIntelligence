// ToastContext.jsx v1.1 - Global toast notification state management
// Provides toast API for showing success, error, warning, and info notifications
//
// CHANGELOG:
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

  // Clear timer for a toast
  const clearTimer = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
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

    const newToast = {
      id,
      type,
      message,
      action,
      createdAt: Date.now()
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
