// MobileTooltipSheet.jsx v1.7 - PORTAL EXCLUSION FIX
// Slide-up bottom sheet for displaying customer data on mobile touch devices
// Replaces floating tooltip for better mobile UX
// Design System v4.0 compliant
//
// CHANGELOG:
// v1.7 (2026-01-09): Portal exclusion fix
//   - NEW: Added data-mobile-tooltip-sheet attribute to sheet container
//   - This attribute is checked by useTouchTooltip's handleOutsideClick
//   - Prevents premature tooltip clear when interacting with sheet buttons
// v1.6 (2026-01-09): Callback execution order fix
//   - FIXED: Action callbacks now fire BEFORE onClose to prevent unmount race condition
//   - Removed setTimeout delays that caused callbacks to be lost when component unmounted
// v1.5 (2026-01-09): Touch event fix for buttons
//   - FIXED: Buttons now use onTouchEnd with stopPropagation to prevent parent swipe handlers from intercepting
//   - FIXED: Added touch-action: manipulation CSS for immediate touch response
//   - FIXED: Buttons now reliably work on mobile touch devices
// v1.4 (2026-01-09): Z-index fix for bottom navigation overlap
//   - FIXED: Backdrop now z-50 (was z-40, same as BottomNavBar)
//   - FIXED: Sheet now z-[60] to ensure it's above backdrop
//   - This prevents touch events from reaching BottomNavBar beneath the sheet
// v1.3 (2026-01-09): Animation and action fixes
//   - FIXED: Slide-up animation now smooth (swipe style only applied when dragging)
//   - FIXED: Ver Perfil button now properly triggers CustomerProfileModal
//   - FIXED: Action callbacks now close sheet after ensuring action completes
// v1.2 (2026-01-09): Long-press support
//   - NEW: Long-press (500ms) on sheet triggers "Ver Perfil" action
//   - NEW: Haptic feedback on long-press
//   - Long-press provides quick access without precise button tapping
// v1.1 (2026-01-09): Bug fixes
//   - FIXED: z-index now uses static Tailwind classes (was dynamic template literals)
//   - FIXED: Removed unused Z_INDEX import
// v1.0 (2026-01-09): Initial implementation (Phase 5.3 - Mobile Tooltip UX)
//   - Slide-up bottom sheet animation
//   - Swipe-to-dismiss via useSwipeToClose hook
//   - Action buttons: Ver Perfil + WhatsApp
//   - Dark mode support with glass morphism
//   - React Portal rendering (prevents clipping)
//   - WCAG accessible with proper focus management

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MessageCircle, Calendar, DollarSign, RefreshCw, CheckCircle, AlertTriangle, XCircle, Sparkles, MinusCircle, Eye } from 'lucide-react';
import { formatCurrency } from '../../utils/numberUtils';
import { RISK_LABELS } from '../../utils/customerMetrics';
import { useSwipeToClose } from '../../hooks/useSwipeToClose';
import { MOBILE_SHEET, TWEEN } from '../../constants/animations';
import { haptics } from '../../utils/haptics';

/**
 * Status icon mapping for WCAG accessibility
 */
const StatusIcon = ({ status, className = 'w-4 h-4' }) => {
  const iconMap = {
    'Healthy': CheckCircle,
    'Monitor': Eye,
    'At Risk': AlertTriangle,
    'Churning': XCircle,
    'New Customer': Sparkles,
    'Lost': MinusCircle
  };
  const Icon = iconMap[status] || MinusCircle;
  return <Icon className={className} aria-hidden="true" />;
};

/**
 * Get status color classes
 */
const getStatusClasses = (status) => {
  const classMap = {
    'Healthy': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    'Monitor': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'At Risk': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    'Churning': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    'New Customer': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    'Lost': 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300'
  };
  return classMap[status] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
};

/**
 * Mobile Tooltip Sheet Component
 *
 * @param {boolean} isOpen - Whether the sheet is visible
 * @param {function} onClose - Callback to close the sheet
 * @param {object} data - Customer data to display (name, y, x, r, status, phone)
 * @param {function} onViewProfile - Callback when "Ver Perfil" is clicked
 * @param {function} onWhatsApp - Callback when "WhatsApp" is clicked (optional)
 */
const MobileTooltipSheet = ({
  isOpen,
  onClose,
  data,
  onViewProfile,
  onWhatsApp
}) => {
  const sheetRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const longPressTriggeredRef = useRef(false);
  const LONG_PRESS_DURATION = 500; // ms

  // Swipe-to-close gesture
  const { handlers, style, isDragging, backdropOpacity, dragY } = useSwipeToClose({
    onClose,
    threshold: 80,
    resistance: 0.5
  });

  // Only apply swipe style when actually dragging to prevent Framer Motion animation conflict
  const swipeStyle = dragY > 0 ? style : undefined;

  // Long-press handlers - triggers "Ver Perfil" action
  const handleLongPressStart = useCallback((e) => {
    // Don't start long-press if touch is on a button
    if (e.target.closest('button')) return;

    longPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      haptics.medium();

      const customerId = data?.id;

      // Call action FIRST (before closing) to ensure callback fires while component is mounted
      if (customerId && onViewProfile) {
        onViewProfile(customerId);
      }

      // Then close the sheet
      onClose();
    }, LONG_PRESS_DURATION);
  }, [data?.id, onViewProfile, onClose]);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Combine swipe handlers with long-press handlers
  const combinedHandlers = {
    ...handlers,
    onTouchStart: (e) => {
      handlers.onTouchStart?.(e);
      handleLongPressStart(e);
    },
    onTouchEnd: (e) => {
      handlers.onTouchEnd?.(e);
      handleLongPressEnd();
    },
    onTouchCancel: (e) => {
      handlers.onTouchCancel?.(e);
      handleLongPressEnd();
    },
    onTouchMove: (e) => {
      handlers.onTouchMove?.(e);
      // Cancel long-press if user starts swiping
      if (isDragging) {
        handleLongPressEnd();
      }
    }
  };

  // Focus management - trap focus in sheet when open
  useEffect(() => {
    if (isOpen && sheetRef.current) {
      // Focus the first focusable element
      const firstButton = sheetRef.current.querySelector('button');
      if (firstButton) {
        setTimeout(() => firstButton.focus(), 100);
      }
    }
  }, [isOpen]);

  // Keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle view profile click
  const handleViewProfile = useCallback(() => {
    const customerId = data?.id;

    // Call action FIRST (before closing) to ensure callback fires while component is mounted
    if (customerId && onViewProfile) {
      onViewProfile(customerId);
    }

    // Then close the sheet
    onClose();
  }, [data?.id, onViewProfile, onClose]);

  // Handle WhatsApp click
  const handleWhatsApp = useCallback(() => {
    const phone = data?.phone;
    const name = data?.name;

    // Call action FIRST (before closing) to ensure callback fires while component is mounted
    if (phone && onWhatsApp) {
      onWhatsApp(phone, name);
    }

    // Then close the sheet
    onClose();
  }, [data?.phone, data?.name, onWhatsApp, onClose]);

  // Don't render if no data
  if (!data) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            data-mobile-tooltip-sheet
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={MOBILE_SHEET.BACKDROP}
            transition={TWEEN.FADE}
            className="fixed inset-0 bg-black/30 z-50"
            style={{ opacity: backdropOpacity }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            data-mobile-tooltip-sheet
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={MOBILE_SHEET.SLIDE_UP}
            className="fixed bottom-0 left-0 right-0 z-[60]
                       bg-white/95 dark:bg-slate-800/95
                       backdrop-blur-xl rounded-t-3xl
                       shadow-2xl
                       pb-safe"
            style={swipeStyle}
            {...combinedHandlers}
            role="dialog"
            aria-modal="true"
            aria-label={`Detalhes de ${data.name}`}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div
                className={`w-10 h-1 rounded-full transition-colors ${
                  isDragging ? 'bg-slate-400 dark:bg-slate-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}
                aria-hidden="true"
              />
            </div>

            {/* Content */}
            <div className="px-5 pb-6">
              {/* Header - Name and Status */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white truncate">
                    {data.name}
                  </h2>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusClasses(data.status)}`}>
                  <StatusIcon status={data.status} className="w-4 h-4" />
                  <span>{RISK_LABELS[data.status]?.pt || data.status}</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {/* Value */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
                  <DollarSign className="w-5 h-5 mx-auto mb-1 text-lavpop-blue dark:text-blue-400" aria-hidden="true" />
                  <div className="text-base font-bold text-lavpop-blue dark:text-blue-400">
                    {formatCurrency(data.y)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Valor total
                  </div>
                </div>

                {/* Days */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
                  <Calendar className="w-5 h-5 mx-auto mb-1 text-red-500 dark:text-red-400" aria-hidden="true" />
                  <div className="text-base font-bold text-red-500 dark:text-red-400">
                    {data.x}d
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Última visita
                  </div>
                </div>

                {/* Visits */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
                  <RefreshCw className="w-5 h-5 mx-auto mb-1 text-lavpop-green dark:text-emerald-400" aria-hidden="true" />
                  <div className="text-base font-bold text-lavpop-green dark:text-emerald-400">
                    {data.r}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Visitas
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {/* View Profile Button */}
                <button
                  onClick={handleViewProfile}
                  onTouchEnd={(e) => {
                    // Stop propagation to prevent parent swipe handlers from intercepting
                    e.stopPropagation();
                    // Prevent default to avoid double-firing with onClick
                    e.preventDefault();
                    // Haptic feedback
                    haptics.light();
                    // Trigger action immediately
                    handleViewProfile();
                  }}
                  className="flex-1 flex items-center justify-center gap-2
                           h-12 px-4 rounded-xl
                           bg-lavpop-blue hover:bg-lavpop-blue/90
                           text-white font-semibold
                           transition-colors duration-150
                           focus:outline-none focus:ring-2 focus:ring-lavpop-blue focus:ring-offset-2
                           dark:focus:ring-offset-slate-800"
                  style={{ touchAction: 'manipulation' }}
                >
                  <User className="w-5 h-5" aria-hidden="true" />
                  <span>Ver Perfil</span>
                </button>

                {/* WhatsApp Button (only if phone available and handler provided) */}
                {data.phone && onWhatsApp && (
                  <button
                    onClick={handleWhatsApp}
                    onTouchEnd={(e) => {
                      // Stop propagation to prevent parent swipe handlers from intercepting
                      e.stopPropagation();
                      // Prevent default to avoid double-firing with onClick
                      e.preventDefault();
                      // Haptic feedback
                      haptics.light();
                      // Trigger action immediately
                      handleWhatsApp();
                    }}
                    className="flex-1 flex items-center justify-center gap-2
                             h-12 px-4 rounded-xl
                             bg-green-500 hover:bg-green-600
                             text-white font-semibold
                             transition-colors duration-150
                             focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                             dark:focus:ring-offset-slate-800"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <MessageCircle className="w-5 h-5" aria-hidden="true" />
                    <span>WhatsApp</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default MobileTooltipSheet;
