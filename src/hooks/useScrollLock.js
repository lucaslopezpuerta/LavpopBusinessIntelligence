/**
 * useScrollLock - iOS-compatible scroll lock hook
 * v1.1
 *
 * Prevents body scroll while a modal/sheet is open.
 * Uses fixed position method to work on iOS Safari which ignores overflow:hidden.
 * Preserves and restores scroll position when unlocked.
 *
 * USAGE:
 *   useScrollLock(isOpen);
 *
 * WHY FIXED POSITION?
 * iOS Safari ignores `overflow: hidden` on body. The workaround is to:
 * 1. Save current scroll position
 * 2. Set body to position: fixed with negative top offset
 * 3. On cleanup, restore original styles and scroll back to saved position
 *
 * MODAL-AWARE NAVIGATION:
 * Adds 'modal-open' class to body when locked. BottomNavBar uses this
 * to slide out of view, preventing accidental taps behind modals.
 *
 * CHANGELOG:
 * v1.1 (2026-01-27): Modal-aware navigation
 *   - Add 'modal-open' class to body for BottomNavBar hiding
 * v1.0 (2026-01-12): Initial implementation
 *   - Extracted from 8 modal components to reduce code duplication
 *   - Consistent scroll lock behavior across all modals
 */

import { useEffect } from 'react';

export function useScrollLock(isLocked) {
  useEffect(() => {
    if (!isLocked) return;

    // Save current scroll position
    const scrollY = window.scrollY;

    // Save original body styles
    const originalStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };

    // Apply scroll lock
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    // Add modal-open class for BottomNavBar hiding
    document.body.classList.add('modal-open');

    // Cleanup: restore original styles and scroll position
    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = originalStyles.overflow;
      document.body.style.position = originalStyles.position;
      document.body.style.top = originalStyles.top;
      document.body.style.width = originalStyles.width;
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
}

export default useScrollLock;
