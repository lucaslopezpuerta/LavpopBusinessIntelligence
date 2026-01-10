// animations.js v1.0
// Centralized animation configurations for consistent motion design
// Design System v4.0 compliant
//
// CHANGELOG:
// v1.0 (2026-01-09): Initial implementation (UX Audit Phase 4.2)
//   - Spring configurations for interactive elements
//   - Tween configurations for hover/focus states
//   - Stagger configurations for lists and grids
//   - Entrance/exit animation presets
//   - Single source of truth for motion timing

/**
 * Animation Configuration System
 *
 * Usage:
 *   import { SPRING, TWEEN, ENTRANCE, STAGGER } from '../constants/animations';
 *   <motion.div transition={SPRING.SNAPPY} />
 *   <motion.div variants={ENTRANCE.FADE_UP} />
 *
 * Guidelines:
 *   - Use SPRING for interactive elements (buttons, toggles, cards)
 *   - Use TWEEN for hover/focus transitions
 *   - Use ENTRANCE for element appearance animations
 *   - Use STAGGER for list/grid item sequencing
 */

// Spring configurations - for physics-based animations
export const SPRING = {
  // Snappy response for buttons and toggles
  SNAPPY: {
    type: 'spring',
    stiffness: 400,
    damping: 25
  },

  // Bouncy feel for playful interactions
  BOUNCY: {
    type: 'spring',
    stiffness: 300,
    damping: 15
  },

  // Smooth settling for tooltips and popovers
  SMOOTH: {
    type: 'spring',
    stiffness: 300,
    damping: 20
  },

  // Gentle motion for modals and overlays
  GENTLE: {
    type: 'spring',
    stiffness: 200,
    damping: 25
  },

  // Quick response for micro-interactions
  QUICK: {
    type: 'spring',
    stiffness: 500,
    damping: 30
  }
};

// Tween configurations - for non-spring animations
export const TWEEN = {
  // Standard hover transition
  HOVER: {
    type: 'tween',
    duration: 0.2,
    ease: 'easeOut'
  },

  // Fast focus indicator
  FOCUS: {
    type: 'tween',
    duration: 0.15,
    ease: 'easeOut'
  },

  // Smooth color transitions
  COLOR: {
    type: 'tween',
    duration: 0.25,
    ease: 'easeInOut'
  },

  // Standard fade
  FADE: {
    type: 'tween',
    duration: 0.2,
    ease: 'easeInOut'
  },

  // Slow reveal for charts
  CHART: {
    type: 'tween',
    duration: 0.8,
    ease: 'easeOut'
  }
};

// Entrance animation variants
export const ENTRANCE = {
  // Fade in with upward motion
  FADE_UP: {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: SPRING.SMOOTH
    }
  },

  // Fade in with downward motion (for dropdowns)
  FADE_DOWN: {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: SPRING.SMOOTH
    }
  },

  // Scale up from center
  SCALE: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: SPRING.SNAPPY
    }
  },

  // Slide from right
  SLIDE_RIGHT: {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: SPRING.SMOOTH
    }
  },

  // Slide from left
  SLIDE_LEFT: {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: SPRING.SMOOTH
    }
  },

  // Simple fade
  FADE: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: TWEEN.FADE
    }
  }
};

// Exit animation variants
export const EXIT = {
  FADE_UP: {
    opacity: 0,
    y: -10,
    transition: TWEEN.FADE
  },

  FADE_DOWN: {
    opacity: 0,
    y: 10,
    transition: TWEEN.FADE
  },

  SCALE: {
    opacity: 0,
    scale: 0.95,
    transition: TWEEN.FADE
  },

  FADE: {
    opacity: 0,
    transition: TWEEN.FADE
  }
};

// Stagger configurations for lists
export const STAGGER = {
  // Fast stagger for short lists (< 5 items)
  FAST: {
    staggerChildren: 0.05,
    delayChildren: 0
  },

  // Standard stagger for medium lists
  DEFAULT: {
    staggerChildren: 0.08,
    delayChildren: 0.1
  },

  // Slow stagger for large grids
  SLOW: {
    staggerChildren: 0.12,
    delayChildren: 0.15
  }
};

// Interactive element animations
export const INTERACTIVE = {
  // Button tap/press
  TAP: { scale: 0.98 },
  HOVER: { scale: 1.02 },

  // Card hover effect
  CARD_HOVER: {
    scale: 1.01,
    y: -2,
    transition: SPRING.SNAPPY
  },

  // Icon button
  ICON_TAP: { scale: 0.9 },
  ICON_HOVER: { scale: 1.1 }
};

// Mobile bottom sheet animations
export const MOBILE_SHEET = {
  // Slide up from bottom
  SLIDE_UP: {
    hidden: { y: '100%' },
    visible: {
      y: 0,
      transition: SPRING.SMOOTH
    },
    exit: {
      y: '100%',
      transition: { type: 'tween', duration: 0.2, ease: 'easeIn' }
    }
  },

  // Backdrop fade
  BACKDROP: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  }
};

// Active bubble visual feedback
export const BUBBLE_ACTIVE = {
  scale: 1.15,
  ringWidth: 4,
  shadowBlur: 8,
  transitionDuration: 200
};

// Default export for convenience
export default {
  SPRING,
  TWEEN,
  ENTRANCE,
  EXIT,
  STAGGER,
  INTERACTIVE,
  MOBILE_SHEET,
  BUBBLE_ACTIVE
};
