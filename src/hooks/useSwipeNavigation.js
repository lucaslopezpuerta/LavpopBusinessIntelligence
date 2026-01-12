// useSwipeNavigation.js v1.3 - SIMPLIFIED (PREVENTDEFAULT HANDLES CONFLICT)
// Hook for swipe gesture navigation between tabs
//
// FEATURES:
// - Swipe left/right to navigate between main tabs
// - Uses Framer Motion drag gesture detection
// - Configurable swipe threshold and velocity
// - Only active on mobile (< lg breakpoint)
// - Haptic feedback on successful swipe
//
// USAGE:
// const { handlers, isSwipeable } = useSwipeNavigation();
// <motion.div {...handlers}>content</motion.div>
//
// NOTE: Child components that have their own swipe gestures should use
// e.preventDefault() in their touch handlers to prevent conflicts.
// See AtRiskCustomersTable.jsx and CustomerListDrilldown.jsx for examples.
//
// CHANGELOG:
// v1.3 (2026-01-11): Simplified - removed data-swipe-row detection
//   - Child components now use preventDefault in touch handlers
//   - Removed onDragStart and ignoreDragRef (no longer needed)
//   - Cleaner, more reliable conflict resolution
// v1.2 (2026-01-11): Tried data-swipe-row approach (incomplete fix)
//   - Added onDragStart to detect drags from [data-swipe-row] elements
//   - Used ref to track if current drag should be ignored
//   - Didn't fully work because native touch and Framer Motion run in parallel
// v1.1 (2025-12-22): Corrected tab order to match desktop sidebar
//   - Order: dashboard → customers → diretorio → campaigns
//   - Added haptic feedback on successful swipe
// v1.0 (2025-12-18): Initial implementation

import { useCallback } from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import { useMediaQuery } from './useMediaQuery';
import { haptics } from '../utils/haptics';

// Tab order for swipe navigation (matches desktop sidebar and bottom nav)
const SWIPEABLE_TABS = ['dashboard', 'customers', 'diretorio', 'campaigns'];

// Swipe configuration
const SWIPE_THRESHOLD = 50;      // Minimum distance in pixels
const VELOCITY_THRESHOLD = 500;  // Minimum velocity in px/s

/**
 * Hook for swipe gesture navigation between tabs
 * @returns {Object} handlers - Framer Motion drag handlers
 * @returns {boolean} isSwipeable - Whether swipe navigation is active
 */
export function useSwipeNavigation() {
  const { activeTab, navigateTo } = useNavigation();
  const isMobile = useMediaQuery('(max-width: 1023px)');

  const currentIndex = SWIPEABLE_TABS.indexOf(activeTab);
  const isSwipeable = isMobile && currentIndex !== -1;

  const navigateToNext = useCallback(() => {
    if (currentIndex < SWIPEABLE_TABS.length - 1) {
      haptics.light();
      navigateTo(SWIPEABLE_TABS[currentIndex + 1]);
    }
  }, [currentIndex, navigateTo]);

  const navigateToPrev = useCallback(() => {
    if (currentIndex > 0) {
      haptics.light();
      navigateTo(SWIPEABLE_TABS[currentIndex - 1]);
    }
  }, [currentIndex, navigateTo]);

  // Handle drag end to determine swipe direction
  const handleDragEnd = useCallback((event, info) => {
    if (!isSwipeable) return;

    const { offset, velocity } = info;

    // Check if swipe meets threshold
    const swipedRight = offset.x > SWIPE_THRESHOLD || velocity.x > VELOCITY_THRESHOLD;
    const swipedLeft = offset.x < -SWIPE_THRESHOLD || velocity.x < -VELOCITY_THRESHOLD;

    if (swipedRight) {
      navigateToPrev();
    } else if (swipedLeft) {
      navigateToNext();
    }
  }, [isSwipeable, navigateToNext, navigateToPrev]);

  // Framer Motion drag handlers
  const handlers = isSwipeable ? {
    drag: 'x',
    dragConstraints: { left: 0, right: 0 },
    dragElastic: 0.1,
    onDragEnd: handleDragEnd,
  } : {};

  return {
    handlers,
    isSwipeable,
    currentIndex,
    totalTabs: SWIPEABLE_TABS.length,
    navigateToNext,
    navigateToPrev,
  };
}

export default useSwipeNavigation;
