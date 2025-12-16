// useTouchTooltip.js v1.0
// Shared hook for mobile-friendly tooltip interactions on charts
//
// CHANGELOG:
// v1.0 (2025-12-16): Initial implementation
//   - Tap-to-show tooltip pattern for touch devices
//   - Second tap on same item triggers action
//   - Tap elsewhere dismisses tooltip
//   - Auto-dismiss after timeout
//   - Works with Recharts onClick handlers

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Hook for mobile-friendly tooltip interactions
 *
 * Pattern:
 * - First tap: Show tooltip for that data point
 * - Second tap on same point: Execute action (open modal)
 * - Tap elsewhere: Dismiss tooltip
 * - Auto-dismiss after 5 seconds of inactivity
 *
 * @param {Object} options
 * @param {Function} options.onAction - Callback when user double-taps (opens modal)
 * @param {number} options.dismissTimeout - Auto-dismiss timeout in ms (default: 5000)
 * @returns {Object} { activeTooltip, handleTouch, clearTooltip, isTouchDevice }
 */
export function useTouchTooltip({ onAction, dismissTimeout = 5000 } = {}) {
  const [activeTooltip, setActiveTooltip] = useState(null);
  const timeoutRef = useRef(null);
  const isTouchDevice = useRef(false);

  // Detect touch device on first touch
  useEffect(() => {
    const handleTouchStart = () => {
      isTouchDevice.current = true;
    };

    window.addEventListener('touchstart', handleTouchStart, { once: true });
    return () => window.removeEventListener('touchstart', handleTouchStart);
  }, []);

  // Auto-dismiss timeout
  useEffect(() => {
    if (activeTooltip && dismissTimeout > 0) {
      timeoutRef.current = setTimeout(() => {
        setActiveTooltip(null);
      }, dismissTimeout);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [activeTooltip, dismissTimeout]);

  // Clear tooltip when clicking outside (for touch devices)
  useEffect(() => {
    if (!activeTooltip) return;

    const handleOutsideClick = (e) => {
      // Don't clear if clicking inside a Recharts component
      if (e.target.closest('.recharts-wrapper')) return;
      setActiveTooltip(null);
    };

    // Small delay to prevent immediate dismissal
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [activeTooltip]);

  /**
   * Handle touch/click on a chart data point
   * @param {Object} data - The data point object
   * @param {string|number} id - Unique identifier for this data point
   */
  const handleTouch = useCallback((data, id) => {
    // If tapping the same point that's already active, trigger action
    if (activeTooltip?.id === id) {
      if (onAction) {
        onAction(data);
      }
      setActiveTooltip(null);
      return true; // Action was triggered
    }

    // First tap - show tooltip
    setActiveTooltip({ id, data });
    return false; // Just showing tooltip
  }, [activeTooltip, onAction]);

  /**
   * Clear the active tooltip
   */
  const clearTooltip = useCallback(() => {
    setActiveTooltip(null);
  }, []);

  /**
   * Check if a specific item is the active tooltip target
   */
  const isActive = useCallback((id) => {
    return activeTooltip?.id === id;
  }, [activeTooltip]);

  return {
    activeTooltip,
    handleTouch,
    clearTooltip,
    isActive,
    isTouchDevice: isTouchDevice.current,
  };
}

export default useTouchTooltip;
