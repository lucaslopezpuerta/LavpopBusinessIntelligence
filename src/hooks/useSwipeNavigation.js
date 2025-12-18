// useSwipeNavigation.js v1.0
// Hook for swipe gesture navigation between tabs
//
// FEATURES:
// - Swipe left/right to navigate between main tabs
// - Uses Framer Motion drag gesture detection
// - Configurable swipe threshold and velocity
// - Only active on mobile (< lg breakpoint)
//
// USAGE:
// const { handlers, isSwipeable } = useSwipeNavigation();
// <motion.div {...handlers}>content</motion.div>
//
// CHANGELOG:
// v1.0 (2025-12-18): Initial implementation

import { useCallback } from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import { useMediaQuery } from './useMediaQuery';

// Tab order for swipe navigation (matches bottom nav)
const SWIPEABLE_TABS = ['dashboard', 'diretorio', 'customers', 'campaigns'];

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
      navigateTo(SWIPEABLE_TABS[currentIndex + 1]);
    }
  }, [currentIndex, navigateTo]);

  const navigateToPrev = useCallback(() => {
    if (currentIndex > 0) {
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
