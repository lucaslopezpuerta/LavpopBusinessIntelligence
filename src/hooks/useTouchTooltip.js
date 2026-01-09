// useTouchTooltip.js v1.5 - IMPROVED DEVICE DETECTION
// Shared hook for mobile-friendly tooltip interactions on charts
//
// CHANGELOG:
// v1.5 (2026-01-07): Mobile compatibility improvements
//   - FIXED: Touch detection now uses matchMedia for hybrid device support
//   - FIXED: Added passive flag to touch listeners (scroll performance)
//   - NEW: modalAnimationDelay option for configurable timing (default: 300ms)
// v1.4 (2025-12-18): Robust tooltip dismiss when modal opens
//   - FIXED: Tooltip now properly hides before modal opens (using rAF delay)
//   - FIXED: Hover tooltips work again after modal closes (mousemove listener)
//   - NEW: Chart wrapper ref for scoped event handling
//   - NEW: resetTooltipVisibility() for explicit reset from components
// v1.3 (2025-12-18): Attempted fix (incomplete)
// v1.2 (2025-12-16): Tooltip dismiss when action triggers
//   - NEW: tooltipHidden state to control Recharts tooltip visibility
//   - FIXED: Tooltip now hides when modal opens (desktop & mobile)
// v1.1 (2025-12-16): Desktop vs mobile behavior fix
//   - FIXED: Desktop now triggers action immediately on click
//   - FIXED: Only touch devices use two-tap behavior
//   - Added isTouchDevice check in handleTouch
// v1.0 (2025-12-16): Initial implementation
//   - Tap-to-show tooltip pattern for touch devices
//   - Second tap on same item triggers action
//   - Tap elsewhere dismisses tooltip
//   - Auto-dismiss after timeout
//   - Works with Recharts onClick handlers

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Detect if the current device is primarily touch-based using CSS media queries.
 * More reliable than runtime detection for hybrid devices (Surface, iPad with keyboard, etc.)
 */
const getIsTouchDevice = () => {
  // Check if matchMedia is available (SSR safety)
  if (typeof window === 'undefined' || !window.matchMedia) return false;

  // Primary input is touch (not hover-capable)
  // This correctly identifies touch-primary devices even if they have mouse attached
  return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
};

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
 * @param {number} options.modalAnimationDelay - Time to wait for modal animations (default: 300)
 * @returns {Object} { activeTooltip, handleTouch, clearTooltip, tooltipHidden, resetTooltipVisibility, isTouchDevice }
 */
export function useTouchTooltip({ onAction, dismissTimeout = 5000, modalAnimationDelay = 300 } = {}) {
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [tooltipHidden, setTooltipHidden] = useState(false);
  const timeoutRef = useRef(null);
  const actionPendingRef = useRef(false);

  // Use matchMedia for reliable touch detection (handles hybrid devices)
  // Re-check on each call as device mode can change (e.g., tablet mode toggle)
  const checkIsTouchDevice = useCallback(() => getIsTouchDevice(), []);

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
      document.addEventListener('touchstart', handleOutsideClick, { passive: true });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [activeTooltip]);

  // Re-enable tooltip visibility when mouse moves over chart after modal closes
  // This ensures hover tooltips work again after using click-to-action
  useEffect(() => {
    if (!tooltipHidden) return;

    const handleMouseMove = (e) => {
      // Only reset if mouse is over a chart area and no action is pending
      if (actionPendingRef.current) return;

      const isOverChart = e.target.closest('.recharts-wrapper');
      if (isOverChart) {
        // Delay reset slightly to avoid showing tooltip during modal close animation
        setTimeout(() => {
          if (!actionPendingRef.current) {
            setTooltipHidden(false);
          }
        }, 100);
      }
    };

    // Add listener after a delay (wait for modal to fully open)
    // Use modalAnimationDelay + buffer to ensure modal animation completes
    const setupTimeout = setTimeout(() => {
      document.addEventListener('mousemove', handleMouseMove, { passive: true });
    }, modalAnimationDelay + 200);

    return () => {
      clearTimeout(setupTimeout);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [tooltipHidden, modalAnimationDelay]);

  /**
   * Reset tooltip visibility manually (call from modal onClose)
   */
  const resetTooltipVisibility = useCallback(() => {
    actionPendingRef.current = false;
    setTooltipHidden(false);
  }, []);

  /**
   * Hide tooltip when action triggers (e.g., modal opens)
   */
  const hideTooltip = useCallback(() => {
    setTooltipHidden(true);
    setActiveTooltip(null);
    actionPendingRef.current = true;
  }, []);

  /**
   * Handle touch/click on a chart data point
   * @param {Object} data - The data point object
   * @param {string|number} id - Unique identifier for this data point
   */
  const handleTouch = useCallback((data, id) => {
    // On desktop (non-touch), always trigger action immediately
    // Use matchMedia check for reliable hybrid device detection
    if (!checkIsTouchDevice()) {
      // Hide tooltip first
      hideTooltip();

      // Delay action by one animation frame to ensure tooltip hides first
      if (onAction) {
        requestAnimationFrame(() => {
          onAction(data);
          // Clear action pending after modal animation (configurable)
          // Note: resetTooltipVisibility() is preferred - this is a fallback
          setTimeout(() => {
            actionPendingRef.current = false;
          }, modalAnimationDelay);
        });
      }
      return true; // Action was triggered
    }

    // On touch devices: two-tap behavior
    // If tapping the same point that's already active, trigger action
    if (activeTooltip?.id === id) {
      hideTooltip();

      if (onAction) {
        requestAnimationFrame(() => {
          onAction(data);
          // Clear action pending after modal animation (configurable)
          setTimeout(() => {
            actionPendingRef.current = false;
          }, modalAnimationDelay);
        });
      }
      return true; // Action was triggered
    }

    // First tap - show tooltip (reset hidden state if needed)
    if (tooltipHidden) {
      setTooltipHidden(false);
    }
    actionPendingRef.current = false;
    setActiveTooltip({ id, data });
    return false; // Just showing tooltip
  }, [activeTooltip, onAction, hideTooltip, tooltipHidden, checkIsTouchDevice, modalAnimationDelay]);

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
    isTouchDevice: checkIsTouchDevice(), // Now uses matchMedia for reliability
    tooltipHidden, // Use to control Recharts Tooltip visibility
    resetTooltipVisibility, // Optional: call from modal onClose
  };
}

export default useTouchTooltip;
