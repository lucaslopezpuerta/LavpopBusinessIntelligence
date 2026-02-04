/**
 * useScrollLock - iOS-compatible scroll lock hook
 * v1.2
 *
 * Prevents body scroll while a modal/sheet is open.
 * Uses fixed position method to work on iOS Safari which ignores overflow:hidden.
 * Preserves and restores scroll position when unlocked.
 *
 * USAGE:
 *   useScrollLock(isOpen);           // Regular modal
 *   useScrollLock(isOpen, true);     // Sidebar (adds sidebar-open class)
 *
 * WHY FIXED POSITION?
 * iOS Safari ignores `overflow: hidden` on body. The workaround is to:
 * 1. Save current scroll position
 * 2. Set body to position: fixed with negative top offset
 * 3. On cleanup, restore original styles and scroll back to saved position
 *
 * MODAL-AWARE NAVIGATION:
 * Adds 'modal-open' class to body when locked. BottomNavBar uses CSS
 * to slide out of view for non-sidebar modals.
 *
 * For sidebar, also adds 'sidebar-open' class. BottomNavBar uses Framer Motion
 * for coordinated spring animation with the drawer.
 *
 * CHANGELOG:
 * v1.2 (2026-02-02): Sidebar-specific class
 *   - Add optional isSidebar param for 'sidebar-open' class
 *   - Enables Framer Motion coordination for sidebar animations
 * v1.1 (2026-01-27): Modal-aware navigation
 *   - Add 'modal-open' class to body for BottomNavBar hiding
 * v1.0 (2026-01-12): Initial implementation
 *   - Extracted from 8 modal components to reduce code duplication
 *   - Consistent scroll lock behavior across all modals
 */

import { useEffect } from 'react';

export function useScrollLock(isLocked, isSidebar = false) {
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

    // Add modal-open class for BottomNavBar hiding (CSS handles non-sidebar modals)
    document.body.classList.add('modal-open');

    // For sidebar, add sidebar-open class (Framer Motion handles animation)
    if (isSidebar) {
      document.body.classList.add('sidebar-open');
    }

    // Cleanup: restore original styles and scroll position
    return () => {
      document.body.classList.remove('modal-open');
      if (isSidebar) {
        document.body.classList.remove('sidebar-open');
      }
      document.body.style.overflow = originalStyles.overflow;
      document.body.style.position = originalStyles.position;
      document.body.style.top = originalStyles.top;
      document.body.style.width = originalStyles.width;
      window.scrollTo(0, scrollY);
    };
  }, [isLocked, isSidebar]);
}

export default useScrollLock;
