// animations.js v4.3 - DRAG HANDLE ANIMATIONS
// Centralized animation configurations for consistent motion design
// Design System v5.1 compliant
//
// CHANGELOG:
// v4.3 (2026-01-31): Drag handle animations
//   - Added DRAG_HANDLE constants for modal swipe-to-close visual feedback
//   - Width animation: 48px → 56px (dragging) → 64px (threshold)
//   - Subtle Y translation follows drag (max 4px)
//   - Glow effect configuration for threshold state
// v4.2 (2026-01-31): Enhanced modal transitions
//   - Platform-aware animations: slide-up on mobile, scale+lift on desktop
//   - MODAL.CONTENT now has subtle Y offset (20px) for "emerging" effect
//   - Added MODAL.CONTENT_MOBILE for bottom sheet slide-up animation
//   - Added MODAL.STAGGER_CONTAINER and STAGGER_ITEM for content sequencing
//   - Improved spring physics: stiffer (380), less mass for snappier feel
//   - Faster exit animations for decisive dismissal
// v4.1 (2026-01-31): Skeleton reveal animations
//   - Added SKELETON_REVEAL for progressive skeleton entrance
//   - Container orchestrates staggered children (60ms stagger)
//   - Item uses spring physics with subtle y+scale entrance
//   - Includes reduced motion variants
// v4.0 (2026-01-30): Chart animation enhancements
//   - Added BAR_STAGGER for left-to-right bar entrance animations
//   - Added SCATTER for bubble pop-in animations
//   - Added LINE_DRAW for path drawing effect
//   - Added TOOLTIP for spring-based tooltip entrance
//   - Added HEATMAP for staggered cell reveal
//   - Added COUNTER for animated number component
// v3.6 (2026-01-30): Modal swipe-to-close standardization
//   - Added MODAL_SWIPE constants for unified swipe threshold configuration
//   - Used by all modal components for consistent gesture behavior
// v3.5 (2026-01-29): Navigation micro-interactions
//   - Added NAV_MICRO for navigation component animations
//   - TAP_BOUNCE, ICON_WIGGLE, GLOW_PULSE presets
//   - PILL_SPRING, ICON_POP for bottom nav enhancements
//   - DRAWER_SWIPE thresholds for mobile gestures
// v3.4 (2026-01-28): Bottom navigation modal transitions
//   - Added BOTTOM_NAV_MODAL for smooth slide-fade when modals open
//   - Uses CSS `translate` property to avoid Framer Motion conflicts
//   - Easing: ease-out-quart for hide, ease-out for show
// v3.3 (2026-01-28): Swipe gesture sensitivity improvements
//   - Added SWIPE_ACTION.THRESHOLDS for configurable gesture detection
//   - Increased direction threshold from 20px to 50px (industry standard)
//   - Added deadzone (8px) to filter micro-movements
//   - Added velocity checking (0.3 px/ms) for fast flick support
//   - Reduced vertical tolerance ratio from 0.5 to 0.35
// v3.1 (2026-01-27): Performance & consistency improvements
//   - Removed blur filter from PAGE_TRANSITION (non-GPU accelerated)
//   - Added SPRING.MEDIUM for intermediate stiffness (350, damping: 22)
//   - Performance: blur filter caused expensive CPU calculations
// v3.0 (2026-01-27): Stellar Cascade page transitions
//   - Added PAGE_TRANSITION_STELLAR with orchestrated container/header/section/item variants
//   - Added PAGE_TRANSITION_STELLAR_REDUCED for accessibility
//   - Enables layered content entrance with stagger timing (~250ms total)
// v2.0 (2026-01-27): Navigation refactoring
//   - Replaced PAGE_TRANSITION with "Cosmic Emergence" (fade + scale + blur)
//   - Removed direction-aware slide animations
//   - Removed BOTTOM_NAV (now uses CSS-only animations)
// v1.9 (2026-01-27): Bottom navigation animations (now removed)
// v1.8 (2026-01-27): Micro-interaction animations
//   - Added TOAST animations for notification system
//   - Added SUCCESS_ANIMATION for checkmark path drawing
//   - Added ERROR_ANIMATION for shake effects
//   - Added INTERACTIVE.FIELD_FOCUS and OPTION_HOVER
// v1.7 (2026-01-27): Direction-aware exit easing for page transitions
//   - Forward navigation: exit opacity uses easeOut (fast exit, no lingering)
//   - Backward navigation: exit opacity uses easeIn (natural deceleration)
//   - Reduced exit opacity duration from 0.3s to 0.2s
//   - Fixes BottomNavBar flicker during forward navigation
// v1.6 (2026-01-25): Opacity duration sync for page transitions
//   - Changed opacity duration from 0.2s to 0.3s (matches slide duration)
//   - Fixes page becoming invisible before slide animation completes
//   - Both animate and exit now have synchronized x/opacity timing
// v1.5 (2026-01-25): Cleanup - restored original page transitions
//   - Reverted PAGE_TRANSITION to include opacity (original behavior)
//   - Previous attempts to fix BottomNavBar fade didn't work
//   - Keeping MODAL constants (beneficial for performance)
// v1.2 (2026-01-25): Modal animation constants
//   - Added MODAL variants for backdrop and content animations
//   - Added MODAL_REDUCED variants for reduced-motion accessibility
//   - Extracted from inline objects to prevent re-renders
// v1.1 (2026-01-24): Direction-aware page transitions
//   - Added PAGE_TRANSITION variants for forward/backward navigation
//   - Added PAGE_TRANSITION_REDUCED for accessibility
//   - Uses GPU-accelerated transforms (x, opacity)
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
  },

  // Medium response - balanced between SMOOTH and SNAPPY
  // Use for general-purpose interactive elements
  MEDIUM: {
    type: 'spring',
    stiffness: 350,
    damping: 22
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

// Chart-specific animation configurations for Recharts
// Used with Bar, Line, Area components
// NOTE: Recharts uses hyphenated easing names ('ease-out', not 'easeOut')
export const CHART_ANIMATION = {
  // Bar charts - quick reveal with subtle delay
  BAR: {
    duration: 800,
    delay: 100,
    easing: 'ease-out'
  },
  // Line/Area charts - smooth draw-in effect
  LINE: {
    duration: 1200,
    delay: 0,
    easing: 'ease-out'
  },
  // Reduced motion - instant render
  REDUCED: {
    duration: 0,
    delay: 0,
    easing: 'linear'
  },
  // Staggered bar entrance - bars animate left-to-right (v4.0)
  BAR_STAGGER: {
    duration: 600,
    baseDelay: 50,      // Initial delay before first bar
    staggerDelay: 30,   // 30ms between each bar
    easing: 'ease-out'
  },
  // ScatterChart bubble pop-in (v4.0)
  SCATTER: {
    duration: 400,
    staggerDelay: 15,   // 15ms between each bubble
    easing: 'ease-out'
  },
  // Line path drawing effect - starts after bars (v4.0)
  LINE_DRAW: {
    duration: 1200,
    delay: 800,         // Start after bars complete
    easing: 'ease-out'
  },
  // Tooltip entrance animation (v4.0)
  TOOLTIP: {
    initial: { opacity: 0, y: 8, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 4, scale: 0.98 },
    transition: { type: 'spring', stiffness: 300, damping: 20 }
  },
  // Heatmap cell reveal - staggered grid animation (v4.0)
  HEATMAP: {
    cell: {
      hidden: { opacity: 0, scale: 0 },
      visible: { opacity: 1, scale: 1 }
    },
    container: {
      hidden: { opacity: 1 },
      visible: {
        opacity: 1,
        transition: {
          delayChildren: 0.1,
          staggerChildren: 0.015
        }
      }
    }
  },
  // Animated number counter (v4.0)
  COUNTER: {
    duration: 800,
    easing: 'easeOut'
  }
};

// Progressive skeleton reveal configurations (v4.1)
// Orchestrates cascading entrance of skeleton elements
export const SKELETON_REVEAL = {
  // Container orchestration - coordinates children with stagger
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.15,
        ease: 'easeOut',
        when: 'beforeChildren',
        staggerChildren: 0.06,
        delayChildren: 0.05
      }
    }
  },

  // Individual skeleton item - subtle upward motion with scale
  item: {
    hidden: { opacity: 0, y: 8, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 28
      }
    }
  },

  // Reduced motion variants - instant transitions
  containerReduced: {
    hidden: { opacity: 1 },
    visible: { opacity: 1 }
  },
  itemReduced: {
    hidden: {},
    visible: {}
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
  ICON_HOVER: { scale: 1.1 },

  // Form field focus
  FIELD_FOCUS: {
    scale: 1.01,
    transition: SPRING.QUICK
  },

  // Dropdown option hover
  OPTION_HOVER: {
    backgroundColor: 'rgba(0, 174, 239, 0.1)', // stellar-cyan at 10%
    transition: { duration: 0.15 }
  }
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

// Modal animations - extracted for performance (avoids inline object creation)
// v4.1: Enhanced transitions with platform-aware animations and content stagger
export const MODAL = {
  // Backdrop overlay - smooth fade with slight delay for depth
  BACKDROP: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] }
  },

  // Desktop content panel - scale + subtle Y movement for "lift" effect
  CONTENT: {
    initial: { opacity: 0, scale: 0.92, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 10 },
    transition: {
      type: 'spring',
      stiffness: 380,
      damping: 28,
      mass: 0.9
    }
  },

  // Mobile content - slide up from bottom (bottom sheet style)
  CONTENT_MOBILE: {
    initial: { opacity: 0, y: '100%' },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 32,
        mass: 0.8
      }
    },
    exit: {
      opacity: 0,
      y: '100%',
      transition: {
        type: 'tween',
        duration: 0.2,
        ease: [0.4, 0, 1, 1] // ease-in for quick exit
      }
    }
  },

  // Staggered content entrance - for header/body/footer sequencing
  STAGGER_CONTAINER: {
    initial: { opacity: 1 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.1
      }
    }
  },

  STAGGER_ITEM: {
    initial: { opacity: 0, y: 12 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 28
      }
    }
  },

  // Reduced motion variants (instant transitions)
  BACKDROP_REDUCED: {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    exit: { opacity: 1 },
    transition: { duration: 0 }
  },

  CONTENT_REDUCED: {
    initial: { opacity: 1, scale: 1, y: 0 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 1, scale: 1, y: 0 },
    transition: { duration: 0 }
  },

  CONTENT_MOBILE_REDUCED: {
    initial: { opacity: 1, y: 0 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 1, y: 0 },
    transition: { duration: 0 }
  }
};

// Active bubble visual feedback
export const BUBBLE_ACTIVE = {
  scale: 1.15,
  ringWidth: 4,
  shadowBlur: 8,
  transitionDuration: 200
};

// Page transitions - "Cosmic Emergence"
// Elegant fade with subtle scale effect (GPU-accelerated only)
// Note: blur filter removed in v3.1 for performance (was CPU-intensive)
export const PAGE_TRANSITION = {
  initial: {
    opacity: 0,
    scale: 0.98
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.1, 0.25, 1] // Custom cubic-bezier for smooth emergence
    }
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

// Reduced motion - simple fade only
export const PAGE_TRANSITION_REDUCED = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.1 } },
  exit: { opacity: 0, transition: { duration: 0.1 } }
};

// Page transitions - "Stellar Cascade" (v3.0)
// Content materializes in layered sequence creating visual hierarchy through timing
// Header appears first, then sections cascade in sequence
// Fast, modern, and stylish - total perceived time ~250ms
export const PAGE_TRANSITION_STELLAR = {
  // Container orchestrates children with stagger
  container: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.12,
        ease: [0.32, 0, 0.67, 0], // ease-out-cubic
        when: 'beforeChildren',
        staggerChildren: 0.04,
        delayChildren: 0.03
      }
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.08,
        ease: [0.33, 1, 0.68, 1] // ease-in-cubic
      }
    }
  },

  // Header section - first to appear, subtle upward motion
  header: {
    initial: { opacity: 0, y: -8 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 30,
        mass: 0.8
      }
    }
  },

  // Primary content sections - staggered with upward motion
  section: {
    initial: { opacity: 0, y: 12 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 350,
        damping: 28,
        mass: 0.9
      }
    }
  },

  // Cards/grid items - fastest stagger with subtle scale
  item: {
    initial: { opacity: 0, y: 8, scale: 0.98 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 32
      }
    }
  }
};

// Stellar Cascade - Reduced motion variant (instant transitions)
export const PAGE_TRANSITION_STELLAR_REDUCED = {
  container: {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    exit: { opacity: 1 }
  },
  header: {
    initial: {},
    animate: {}
  },
  section: {
    initial: {},
    animate: {}
  },
  item: {
    initial: {},
    animate: {}
  }
};

// Toast notification animations (v1.1 - Progress bar + Swipe dismiss)
export const TOAST = {
  // Entry from top
  ENTER: {
    initial: { opacity: 0, y: -20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: SPRING.SNAPPY
  },
  // Exit animation
  EXIT: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { type: 'tween', duration: 0.15, ease: 'easeIn' }
  },
  // Swipe dismiss exit (horizontal)
  SWIPE_EXIT: {
    opacity: 0,
    x: 100,
    transition: { type: 'tween', duration: 0.2, ease: 'easeIn' }
  },
  // Progress bar countdown
  PROGRESS: {
    initial: { scaleX: 1 },
    animate: { scaleX: 0 },
    // Duration set dynamically based on toast duration
    transition: { ease: 'linear' }
  },
  // Reduced motion variants
  ENTER_REDUCED: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.1 }
  },
  EXIT_REDUCED: {
    opacity: 0,
    transition: { duration: 0.1 }
  },
  // Swipe threshold for dismiss (px)
  SWIPE_THRESHOLD: 80,
  // Velocity threshold for fast swipe dismiss (px/ms)
  VELOCITY_THRESHOLD: 0.4
};

// Success animation (SVG checkmark)
export const SUCCESS_ANIMATION = {
  // Container scale-up
  CONTAINER: {
    initial: { scale: 0 },
    animate: { scale: 1 },
    transition: SPRING.BOUNCY
  },
  // Circle path drawing
  CIRCLE: {
    initial: { pathLength: 0 },
    animate: { pathLength: 1 },
    transition: { duration: 0.5, ease: 'easeOut' }
  },
  // Checkmark path drawing
  CHECK: {
    initial: { pathLength: 0 },
    animate: { pathLength: 1 },
    transition: { duration: 0.4, delay: 0.3, ease: 'easeOut' }
  }
};

// Error animation (SVG X with shake)
export const ERROR_ANIMATION = {
  // Container with shake
  CONTAINER: {
    initial: { scale: 0 },
    animate: { scale: 1 },
    transition: SPRING.BOUNCY
  },
  // Circle path drawing
  CIRCLE: {
    initial: { pathLength: 0 },
    animate: { pathLength: 1 },
    transition: { duration: 0.5, ease: 'easeOut' }
  },
  // X path drawing
  X_LINE: {
    initial: { pathLength: 0 },
    animate: { pathLength: 1 },
    transition: { duration: 0.3, delay: 0.3, ease: 'easeOut' }
  },
  // Shake effect keyframes
  SHAKE: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.5, delay: 0.6 }
  }
};

// Card swipe actions (v3.3)
// Spring physics for smooth swipe-to-reveal actions
// v3.3: Added THRESHOLDS for improved gesture recognition
export const SWIPE_ACTION = {
  // Spring for card sliding
  CARD_SPRING: {
    type: 'spring',
    stiffness: 400,
    damping: 30,
    mass: 0.8
  },
  // Snap back to center
  SNAP_BACK: {
    type: 'spring',
    stiffness: 500,
    damping: 35
  },
  // Action button reveal
  ACTION_REVEAL: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
      delay: 0.05
    }
  },
  // Swipe gesture thresholds (v3.3)
  // Tuned for intentional actions, not accidental triggers
  THRESHOLDS: {
    DIRECTION_MIN: 50,      // Minimum px to set a direction (was 20)
    ACTION_TRIGGER: 56,     // Minimum px to trigger action on release
    MAX_OFFSET: 72,         // Maximum swipe distance (was 64)
    DEADZONE: 8,            // Initial pixels ignored (prevents accidental)
    VERTICAL_RATIO: 0.35,   // Max vertical/horizontal ratio (was 0.5)
    MIN_VELOCITY: 0.3       // Minimum px/ms velocity to trigger action
  },
  // Success flash animation (v3.4)
  // Brief visual confirmation after action triggers
  SUCCESS_FLASH: {
    // Card pulse animation
    CARD: {
      scale: [1, 1.02, 1],
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    },
    // Success hold duration before snap-back (ms)
    HOLD_DURATION: 350,
    // Haptic patterns
    HAPTIC: {
      THRESHOLD: 10,         // 10ms pulse at threshold crossing
      SUCCESS: [20, 50, 20]  // Short-pause-short pattern on action
    }
  }
};

// Tab content transitions (v3.2)
// Smooth crossfade with subtle slide for tab content
export const TAB_CONTENT = {
  // Default transition (fade + slide up)
  FADE_SLIDE: {
    initial: { opacity: 0, y: 8 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    exit: {
      opacity: 0,
      y: -8,
      transition: {
        duration: 0.15,
        ease: 'easeIn'
      }
    }
  },
  // Simple crossfade (lighter)
  CROSSFADE: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.15, ease: 'easeIn' }
    }
  },
  // Reduced motion variant
  REDUCED: {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    exit: { opacity: 1 }
  }
};

// Alert notification animations (v3.2)
// Slide in from top with attention-grabbing entrance
export const ALERT = {
  // Default entrance (slide + scale)
  ENTER: {
    initial: { opacity: 0, y: -12, scale: 0.96 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: SPRING.SNAPPY
    }
  },
  // Exit animation
  EXIT: {
    opacity: 0,
    y: -8,
    scale: 0.96,
    transition: { type: 'tween', duration: 0.15, ease: 'easeIn' }
  },
  // Shake for error emphasis
  SHAKE: {
    x: [0, -6, 6, -6, 6, 0],
    transition: { duration: 0.4 }
  },
  // Reduced motion
  ENTER_REDUCED: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.1 } }
  },
  EXIT_REDUCED: {
    opacity: 0,
    transition: { duration: 0.1 }
  }
};

// Bottom Navigation Modal Transitions (v3.4)
// Smooth slide-fade for when modals/drawers open
// Uses CSS `translate` property to avoid Framer Motion transform conflicts
export const BOTTOM_NAV_MODAL = {
  // Hide transition (modal opens)
  HIDE: {
    duration: 0.25,
    ease: [0.4, 0, 0.2, 1], // ease-out-quart (fast start, gentle end)
    translate: '0 100%',
    opacity: 0
  },
  // Show transition (modal closes)
  SHOW: {
    duration: 0.3,
    ease: [0.0, 0, 0.2, 1], // ease-out (decelerate)
    translate: '0 0',
    opacity: 1
  },
  // Reduced motion variant
  REDUCED: {
    duration: 0.1,
    ease: 'linear'
  }
};

// Navigation micro-interactions (v3.5)
// Refined animations for navigation components
export const NAV_MICRO = {
  // Subtle bounce on nav item tap
  TAP_BOUNCE: {
    scale: [1, 0.95, 1.02, 1],
    transition: { duration: 0.3, times: [0, 0.2, 0.6, 1] }
  },

  // Icon wiggle on hover (desktop)
  ICON_WIGGLE: {
    rotate: [0, -5, 5, -3, 3, 0],
    transition: { duration: 0.4 }
  },

  // Glow pulse for active indicator
  GLOW_PULSE: {
    boxShadow: [
      '0 0 8px rgba(0,174,239,0.3)',
      '0 0 16px rgba(0,174,239,0.5)',
      '0 0 8px rgba(0,174,239,0.3)'
    ],
    transition: { duration: 2, repeat: Infinity }
  },

  // Enhanced pill spring for bottom nav
  PILL_SPRING: {
    type: 'spring',
    bounce: 0.25,
    duration: 0.5,
    mass: 0.8
  },

  // Icon pop on active state
  ICON_POP: {
    scale: [1, 1.15, 1],
    transition: { duration: 0.3, ease: 'easeOut' }
  },

  // Drawer swipe thresholds
  DRAWER_SWIPE: {
    CLOSE_THRESHOLD: 50,      // px to trigger close
    VELOCITY_THRESHOLD: 300,  // px/s for fast flick
    ELASTIC: 0.1,             // drag elasticity
    SPRING: {
      type: 'spring',
      damping: 25,
      stiffness: 250
    }
  }
};

// Modal swipe-to-close thresholds (v3.6)
// Standardized configuration for all modal components
export const MODAL_SWIPE = {
  THRESHOLD: 80,              // px to trigger close (after resistance applied)
  RESISTANCE: 0.5,            // drag resistance factor (0.5 = need ~160px actual drag)
  VELOCITY_THRESHOLD: 0.5,    // px/ms for fast flick detection
};

// Drag handle animations (v4.3)
// Visual feedback for modal swipe-to-close gesture
export const DRAG_HANDLE = {
  // Width states (px)
  WIDTH_DEFAULT: 48,          // Default/idle width
  WIDTH_DRAGGING: 56,         // Width when actively dragging
  WIDTH_THRESHOLD: 64,        // Width when threshold reached

  // Size (px)
  HEIGHT: 6,                  // Handle height

  // Y translation (px)
  TRANSLATE_MAX: 4,           // Max Y translation following drag

  // Spring physics for smooth transitions
  SPRING: {
    type: 'spring',
    stiffness: 500,
    damping: 30
  },

  // Glow effect for threshold state
  GLOW: {
    boxShadow: '0 0 8px rgba(0, 174, 239, 0.5)'
  },

  // Color values for different states
  COLORS: {
    DEFAULT_DARK: 'bg-stellar-cyan/20',
    DEFAULT_LIGHT: 'bg-slate-300',
    DRAGGING_DARK: 'bg-stellar-cyan/50',
    DRAGGING_LIGHT: 'bg-slate-400',
    THRESHOLD_DARK: 'bg-stellar-cyan',
    THRESHOLD_LIGHT: 'bg-slate-500'
  }
};

// Pull-to-refresh animations (v2.1)
// Refined timing for smooth, responsive feel
export const PULL_REFRESH = {
  // Indicator bubble enter/exit
  INDICATOR: {
    initial: { opacity: 0, scale: 0.6 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
    transition: SPRING.SNAPPY
  },
  // Faster exit for snappy dismiss
  EXIT_TRANSITION: {
    type: 'spring',
    stiffness: 500,
    damping: 30
  },
  // Icon rotation during pull (smoothed)
  ICON_PULL: {
    type: 'spring',
    stiffness: 300,
    damping: 20,
    mass: 0.5
  },
  // Icon rotation during refresh (continuous spin)
  ICON_SPIN: {
    repeat: Infinity,
    duration: 1,
    ease: 'linear'
  },
  // "Ready to refresh" pulse effect
  READY_PULSE: {
    scale: [1, 1.08, 1],
    transition: {
      duration: 0.4,
      ease: 'easeInOut'
    }
  },
  // Shadow intensification when ready
  READY_SHADOW: {
    boxShadow: '0 8px 25px -5px rgba(0, 174, 239, 0.4), 0 4px 10px -6px rgba(0, 174, 239, 0.3)'
  }
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
  MODAL,
  MODAL_SWIPE,
  DRAG_HANDLE,
  BUBBLE_ACTIVE,
  PAGE_TRANSITION,
  PAGE_TRANSITION_REDUCED,
  PAGE_TRANSITION_STELLAR,
  PAGE_TRANSITION_STELLAR_REDUCED,
  CHART_ANIMATION,
  SKELETON_REVEAL,
  TOAST,
  SUCCESS_ANIMATION,
  ERROR_ANIMATION,
  SWIPE_ACTION,
  TAB_CONTENT,
  ALERT,
  BOTTOM_NAV_MODAL,
  NAV_MICRO,
  PULL_REFRESH
};
