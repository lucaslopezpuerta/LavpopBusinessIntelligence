// useLongPressMenu.js v1.0 - LONG-PRESS MENU STATE MANAGEMENT
// Wrapper hook combining useLongPress with menu state management
// Design System v5.1 compliant - Cosmic Precision
//
// FEATURES:
// - Integrates useLongPress with menu open/close state
// - Tracks context data for the active menu item
// - Provides handlers for element binding
// - Exposes pressing states for visual feedback
//
// USAGE:
// const { isOpen, contextData, handlers, isPressing, close } = useLongPressMenu({
//   getContextData: () => currentItem,
//   onPress: () => handleTap(),
//   enabled: true
// });
//
// <div {...handlers} className={isPressing ? 'scale-[0.98]' : ''}>
//   Card content
// </div>
//
// <LongPressMenu
//   isOpen={isOpen}
//   onClose={close}
//   contextData={contextData}
//   actions={[...]}
// />
//
// CHANGELOG:
// v1.0 (2026-01-31): Initial implementation
//   - Wraps useLongPress hook
//   - Manages menu open state and context data
//   - Provides open/close methods

import { useState, useCallback, useMemo } from 'react';
import { useLongPress } from './useLongPress';

/**
 * Hook for managing long-press menu interactions
 * @param {Object} options
 * @param {Function} options.getContextData - Function returning context data when menu opens
 * @param {Function} options.onPress - Callback for short press (click)
 * @param {Function} options.onLongPressStart - Callback when press starts (visual feedback)
 * @param {number} options.duration - Duration in ms to trigger long press (default: 500)
 * @param {boolean} options.enabled - Enable/disable the hook (default: true)
 * @param {boolean} options.vibrate - Enable haptic feedback (default: true)
 */
export function useLongPressMenu({
  getContextData,
  onPress,
  onLongPressStart,
  duration = 500,
  enabled = true,
  vibrate = true
} = {}) {
  const [menuState, setMenuState] = useState({
    isOpen: false,
    contextData: null
  });

  // Open menu with context data
  const open = useCallback((data) => {
    setMenuState({
      isOpen: true,
      contextData: data ?? null
    });
  }, []);

  // Close menu and clear context
  const close = useCallback(() => {
    setMenuState({
      isOpen: false,
      contextData: null
    });
  }, []);

  // Handle long press trigger
  const handleLongPress = useCallback((e) => {
    const data = getContextData?.() ?? null;
    open(data);
  }, [getContextData, open]);

  // Integrate with useLongPress hook
  const {
    handlers,
    isLongPressing,
    isPressing,
    startPos
  } = useLongPress({
    onLongPress: handleLongPress,
    onPress,
    onLongPressStart,
    duration,
    enabled,
    vibrate
  });

  // Memoize return value
  return useMemo(() => ({
    // Menu state
    isOpen: menuState.isOpen,
    contextData: menuState.contextData,

    // Menu control methods
    open,
    close,

    // Long press handlers (spread onto element)
    handlers,

    // Visual feedback states
    isLongPressing,  // Brief pulse when triggered
    isPressing,      // True while holding down
    startPos         // Touch position for hit testing
  }), [
    menuState.isOpen,
    menuState.contextData,
    open,
    close,
    handlers,
    isLongPressing,
    isPressing,
    startPos
  ]);
}

export default useLongPressMenu;
