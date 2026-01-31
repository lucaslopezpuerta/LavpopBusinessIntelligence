// Toast.jsx v1.1 - PROGRESS BAR + SWIPE DISMISS
// Variant D (Glassmorphism) styling with Framer Motion animations
//
// CHANGELOG:
// v1.1 (2026-01-31): Progress bar + swipe dismiss
//   - Added progress bar countdown at bottom of toast
//   - Hover-to-pause: pauses auto-dismiss timer on mouse enter
//   - Swipe-to-dismiss: horizontal swipe gesture for mobile
//   - Progress bar color matches toast type
//   - Respects reduced motion (no progress animation)
// v1.0 (2026-01-27): Initial implementation
//   - Glassmorphism design with stellar-cyan accents
//   - Animated entry/exit with TOAST constants
//   - Type-based icons and colors (success, error, warning, info)
//   - Optional action button support
//   - Respects useReducedMotion for accessibility

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import useReducedMotion from '../../hooks/useReducedMotion';
import { TOAST, SPRING } from '../../constants/animations';
import { TOAST_TYPES, useToast } from '../../contexts/ToastContext';
import { haptics } from '../../utils/haptics';

// Icon mapping by toast type
const TOAST_ICONS = {
  [TOAST_TYPES.SUCCESS]: CheckCircle,
  [TOAST_TYPES.ERROR]: AlertCircle,
  [TOAST_TYPES.WARNING]: AlertTriangle,
  [TOAST_TYPES.INFO]: Info
};

// Color classes by toast type
const TOAST_COLORS = {
  [TOAST_TYPES.SUCCESS]: {
    icon: 'text-cosmic-green',
    border: 'border-cosmic-green/30',
    bg: 'bg-cosmic-green/10',
    progress: 'bg-cosmic-green'
  },
  [TOAST_TYPES.ERROR]: {
    icon: 'text-red-500',
    border: 'border-red-500/30',
    bg: 'bg-red-500/10',
    progress: 'bg-red-500'
  },
  [TOAST_TYPES.WARNING]: {
    icon: 'text-amber-500',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    progress: 'bg-amber-500'
  },
  [TOAST_TYPES.INFO]: {
    icon: 'text-stellar-cyan',
    border: 'border-stellar-cyan/30',
    bg: 'bg-stellar-cyan/10',
    progress: 'bg-stellar-cyan'
  }
};

const Toast = ({ toast, onDismiss }) => {
  const { isDark } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const { pauseToast, resumeToast } = useToast();

  const { id, type, message, action, duration, createdAt, isPaused } = toast;
  const Icon = TOAST_ICONS[type] || Info;
  const colors = TOAST_COLORS[type] || TOAST_COLORS[TOAST_TYPES.INFO];

  // Swipe state
  const [isDragging, setIsDragging] = useState(false);
  const dragX = useMotionValue(0);
  const controls = useAnimation();
  const startXRef = useRef(0);
  const startTimeRef = useRef(0);
  const hasTriggeredHapticRef = useRef(false);

  // Transform dragX to opacity for visual feedback
  const opacity = useTransform(
    dragX,
    [-TOAST.SWIPE_THRESHOLD, 0, TOAST.SWIPE_THRESHOLD],
    [0.5, 1, 0.5]
  );

  // Select animation based on reduced motion preference
  const enterAnimation = prefersReducedMotion ? TOAST.ENTER_REDUCED : TOAST.ENTER;
  const exitAnimation = prefersReducedMotion ? TOAST.EXIT_REDUCED : TOAST.EXIT;

  // Trigger entry animation on mount
  useEffect(() => {
    controls.start(enterAnimation.animate);
  }, [controls, enterAnimation.animate]);

  // Calculate progress bar duration (remaining time)
  const progressDuration = useMemo(() => {
    if (!duration || duration <= 0) return 0;
    if (prefersReducedMotion) return 0; // No animation for reduced motion
    const elapsed = Date.now() - createdAt;
    return Math.max(0, (duration - elapsed) / 1000); // Convert to seconds
  }, [duration, createdAt, prefersReducedMotion]);

  // Hover handlers for pause/resume
  const handleMouseEnter = useCallback(() => {
    if (duration > 0) {
      pauseToast(id);
    }
  }, [id, duration, pauseToast]);

  const handleMouseLeave = useCallback(() => {
    if (duration > 0 && !isDragging) {
      resumeToast(id);
    }
  }, [id, duration, isDragging, resumeToast]);

  // Swipe handlers
  const handleDragStart = useCallback((e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    startXRef.current = clientX;
    startTimeRef.current = Date.now();
    hasTriggeredHapticRef.current = false;
    setIsDragging(true);
    // Pause timer during swipe
    if (duration > 0) {
      pauseToast(id);
    }
  }, [duration, id, pauseToast]);

  const handleDragMove = useCallback((e) => {
    if (!isDragging) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - startXRef.current;
    dragX.set(deltaX);

    // Haptic feedback when crossing threshold
    if (Math.abs(deltaX) >= TOAST.SWIPE_THRESHOLD && !hasTriggeredHapticRef.current) {
      hasTriggeredHapticRef.current = true;
      haptics.tick();
    }
  }, [isDragging, dragX]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;

    const endTime = Date.now();
    const duration_ = endTime - startTimeRef.current;
    const distance = dragX.get();
    const velocity = Math.abs(distance / duration_);

    // Check if should dismiss (threshold or velocity)
    const shouldDismiss = Math.abs(distance) > TOAST.SWIPE_THRESHOLD || velocity > TOAST.VELOCITY_THRESHOLD;

    if (shouldDismiss) {
      haptics.light();
      // Animate out in swipe direction
      controls.start({
        x: distance > 0 ? 200 : -200,
        opacity: 0,
        transition: { duration: 0.2, ease: 'easeIn' }
      }).then(() => {
        onDismiss(id);
      });
    } else {
      // Snap back
      dragX.set(0);
      // Resume timer if we didn't dismiss
      if (duration > 0) {
        resumeToast(id);
      }
    }

    setIsDragging(false);
    hasTriggeredHapticRef.current = false;
  }, [isDragging, dragX, controls, id, onDismiss, duration, resumeToast]);

  const handleDismiss = () => {
    haptics.light();
    onDismiss(id);
  };

  const handleAction = () => {
    if (action?.onClick) {
      haptics.tick();
      action.onClick();
    }
  };

  return (
    <motion.div
      layout
      initial={enterAnimation.initial}
      animate={controls}
      exit={exitAnimation}
      transition={enterAnimation.transition}
      style={{ x: dragX, opacity }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleDragStart}
      onTouchMove={handleDragMove}
      onTouchEnd={handleDragEnd}
      onTouchCancel={handleDragEnd}
      className={`
        relative flex items-start gap-3 p-4 pb-5 rounded-xl
        border backdrop-blur-xl shadow-lg
        min-w-[300px] max-w-[400px]
        touch-pan-y select-none
        ${colors.border}
        ${isDark
          ? 'bg-space-dust/90 text-white'
          : 'bg-white/90 text-slate-900'
        }
        ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Icon with background */}
      <div className={`flex-shrink-0 p-1.5 rounded-lg ${colors.bg}`}>
        <Icon className={`w-5 h-5 ${colors.icon}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p className={`text-sm font-medium leading-snug ${
          isDark ? 'text-slate-100' : 'text-slate-800'
        }`}>
          {message}
        </p>

        {/* Optional action button */}
        {action && (
          <button
            onClick={handleAction}
            className={`
              mt-2 text-xs font-semibold
              ${colors.icon} hover:underline
              focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
              ${isDark ? 'focus-visible:ring-stellar-cyan' : 'focus-visible:ring-blue-500'}
            `}
          >
            {action.label}
          </button>
        )}
      </div>

      {/* Dismiss button */}
      <motion.button
        onClick={handleDismiss}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={SPRING.QUICK}
        className={`
          flex-shrink-0 p-1 rounded-lg
          transition-colors duration-150
          focus:outline-none focus-visible:ring-2
          ${isDark
            ? 'text-slate-400 hover:text-slate-200 hover:bg-white/10 focus-visible:ring-stellar-cyan'
            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus-visible:ring-blue-500'
          }
        `}
        aria-label="Fechar notificacao"
      >
        <X className="w-4 h-4" />
      </motion.button>

      {/* Progress bar at bottom */}
      {duration > 0 && progressDuration > 0 && (
        <div
          className={`
            absolute bottom-0 left-0 right-0 h-1
            rounded-b-xl overflow-hidden
            ${isDark ? 'bg-white/5' : 'bg-black/5'}
          `}
        >
          <motion.div
            className={`h-full ${colors.progress} origin-left`}
            initial={{ scaleX: 1 }}
            animate={{ scaleX: isPaused ? undefined : 0 }}
            transition={{
              duration: progressDuration,
              ease: 'linear'
            }}
            style={{
              // If paused, freeze at current position
              animationPlayState: isPaused ? 'paused' : 'running'
            }}
          />
        </div>
      )}
    </motion.div>
  );
};

export default Toast;
