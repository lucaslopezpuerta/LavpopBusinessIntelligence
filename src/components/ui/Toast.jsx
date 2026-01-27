// Toast.jsx v1.0 - Toast notification component
// Variant D (Glassmorphism) styling with Framer Motion animations
//
// CHANGELOG:
// v1.0 (2026-01-27): Initial implementation
//   - Glassmorphism design with stellar-cyan accents
//   - Animated entry/exit with TOAST constants
//   - Type-based icons and colors (success, error, warning, info)
//   - Optional action button support
//   - Respects useReducedMotion for accessibility

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { TOAST, SPRING } from '../../constants/animations';
import { TOAST_TYPES } from '../../contexts/ToastContext';
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
    bg: 'bg-cosmic-green/10'
  },
  [TOAST_TYPES.ERROR]: {
    icon: 'text-red-500',
    border: 'border-red-500/30',
    bg: 'bg-red-500/10'
  },
  [TOAST_TYPES.WARNING]: {
    icon: 'text-amber-500',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10'
  },
  [TOAST_TYPES.INFO]: {
    icon: 'text-stellar-cyan',
    border: 'border-stellar-cyan/30',
    bg: 'bg-stellar-cyan/10'
  }
};

const Toast = ({ toast, onDismiss }) => {
  const { isDark } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  const { id, type, message, action } = toast;
  const Icon = TOAST_ICONS[type] || Info;
  const colors = TOAST_COLORS[type] || TOAST_COLORS[TOAST_TYPES.INFO];

  // Select animation based on reduced motion preference
  const enterAnimation = prefersReducedMotion ? TOAST.ENTER_REDUCED : TOAST.ENTER;
  const exitAnimation = prefersReducedMotion ? TOAST.EXIT_REDUCED : TOAST.EXIT;

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
      animate={enterAnimation.animate}
      exit={exitAnimation}
      transition={enterAnimation.transition}
      className={`
        relative flex items-start gap-3 p-4 rounded-xl
        border backdrop-blur-xl shadow-lg
        min-w-[300px] max-w-[400px]
        ${colors.border}
        ${isDark
          ? 'bg-space-dust/90 text-white'
          : 'bg-white/90 text-slate-900'
        }
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
    </motion.div>
  );
};

export default Toast;
