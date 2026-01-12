// MobileTooltipSheet.jsx v2.3 - iOS SCROLL LOCK
// Slide-up bottom sheet for displaying customer data on mobile touch devices
// Replaces floating tooltip for better mobile UX
// Design System v4.0 compliant
//
// CHANGELOG:
// v2.3 (2026-01-12): iOS-compatible scroll lock
//   - Added body scroll lock to prevent background scrolling
//   - Preserves scroll position when sheet closes
// v2.2 (2026-01-11): Two-row header layout
//   - CHANGED: Name and status badge now on separate rows for better name visibility
//   - Row 1: Full-width name + X close button
//   - Row 2: Status badge (left-aligned)
//   - Prevents long names from being truncated too aggressively
// v2.1 (2026-01-11): Mobile layout improvements
//   - FIXED: X button moved into content area to prevent clipping at screen edge
//   - FIXED: Increased X button tap target to 44px (WCAG compliance)
//   - FIXED: Added horizontal safe margins (mx-2) to prevent edge clipping
//   - IMPROVED: Better spacing between header elements and close button
//   - IMPROVED: Stats grid uses responsive gap (gap-2 sm:gap-3)
// v2.0 (2026-01-11): Close button and improved UX
//   - NEW: Added explicit close button (X) in top-right corner for accessibility
//   - CHANGED: No more auto-dismiss (handled in useTouchTooltip v1.9)
//   - Users now have: swipe-to-close, backdrop tap, close button (X)
//   - No time pressure - users can read/decide at their own pace
// v1.9 (2026-01-11): Swipe threshold fix
//   - FIXED: Swipe-to-close threshold lowered from 80 to 40 (accounts for 0.5 resistance)
//   - With resistance=0.5, threshold=40 means ~80px actual drag to close
//   - Previously required ~160px actual drag which felt too heavy
// v1.8 (2026-01-11): Long-press fix
//   - FIXED: Long-press was cancelled on any touchmove (isDragging check was too aggressive)
//   - NEW: Added movement threshold (10px) before cancelling long-press
//   - NEW: Track touch start position to calculate actual movement distance
//   - Long-press now works reliably even with minor finger wobble
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
import { User, MessageCircle, Calendar, DollarSign, RefreshCw, CheckCircle, AlertTriangle, XCircle, Sparkles, MinusCircle, Eye, X } from 'lucide-react';
import { formatCurrency } from '../../utils/numberUtils';
import { RISK_LABELS } from '../../utils/customerMetrics';
import { useSwipeToClose } from '../../hooks/useSwipeToClose';
import { useReducedMotion } from '../../hooks/useReducedMotion';
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
  const longPressStartPosRef = useRef({ x: 0, y: 0 });
  const prefersReducedMotion = useReducedMotion();
  const LONG_PRESS_DURATION = 500; // ms
  const LONG_PRESS_MOVE_THRESHOLD = 10; // pixels - cancel if moved more than this

  // Swipe-to-close gesture
  // Note: threshold is applied to resisted dragY, so with resistance=0.5,
  // threshold=40 means ~80px actual finger movement to trigger close
  const { handlers, style, isDragging, backdropOpacity, dragY } = useSwipeToClose({
    onClose,
    threshold: 40,
    resistance: 0.5
  });

  // Only apply swipe style when actually dragging to prevent Framer Motion animation conflict
  const swipeStyle = dragY > 0 ? style : undefined;

  // Long-press handlers - triggers "Ver Perfil" action
  const handleLongPressStart = useCallback((e) => {
    // Don't start long-press if touch is on a button
    if (e.target.closest('button')) return;

    // Record start position for movement threshold check
    const touch = e.touches?.[0];
    if (touch) {
      longPressStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    }

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
      // Cancel long-press if user has moved beyond threshold (actual swiping)
      // Using movement distance instead of isDragging to allow minor finger wobble
      if (longPressTimerRef.current) {
        const touch = e.touches?.[0];
        if (touch) {
          const deltaX = Math.abs(touch.clientX - longPressStartPosRef.current.x);
          const deltaY = Math.abs(touch.clientY - longPressStartPosRef.current.y);
          if (deltaX > LONG_PRESS_MOVE_THRESHOLD || deltaY > LONG_PRESS_MOVE_THRESHOLD) {
            handleLongPressEnd();
          }
        }
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

  // iOS-compatible scroll lock - prevents body scroll while sheet is open
  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    const originalStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = originalStyles.overflow;
      document.body.style.position = originalStyles.position;
      document.body.style.top = originalStyles.top;
      document.body.style.width = originalStyles.width;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

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
            initial={prefersReducedMotion ? false : "hidden"}
            animate="visible"
            exit={prefersReducedMotion ? undefined : "exit"}
            variants={MOBILE_SHEET.BACKDROP}
            transition={prefersReducedMotion ? { duration: 0 } : TWEEN.FADE}
            className="fixed inset-0 bg-black/30 z-50"
            style={{ opacity: backdropOpacity }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            data-mobile-tooltip-sheet
            initial={prefersReducedMotion ? false : "hidden"}
            animate="visible"
            exit={prefersReducedMotion ? undefined : "exit"}
            variants={MOBILE_SHEET.SLIDE_UP}
            transition={prefersReducedMotion ? { duration: 0 } : undefined}
            className="fixed bottom-0 left-2 right-2 z-[60]
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
            <div className="flex justify-center pt-3 pb-1">
              <div
                className={`w-10 h-1 rounded-full transition-colors ${
                  isDragging ? 'bg-slate-400 dark:bg-slate-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}
                aria-hidden="true"
              />
            </div>

            {/* Content */}
            <div className="px-4 sm:px-5 pb-6">
              {/* Header - Name on first row, Status badge on second row */}
              <div className="mb-4">
                {/* Row 1: Name + Close Button */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white truncate flex-1">
                    {data.name}
                  </h2>
                  {/* Close Button (X) */}
                  <button
                    onClick={onClose}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      haptics.light();
                      onClose();
                    }}
                    className="w-10 h-10 flex items-center justify-center flex-shrink-0
                             rounded-full -mr-2
                             text-slate-400 hover:text-slate-600
                             dark:text-slate-500 dark:hover:text-slate-300
                             hover:bg-slate-100 dark:hover:bg-slate-700
                             transition-colors duration-150
                             focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2
                             dark:focus:ring-offset-slate-800"
                    style={{ touchAction: 'manipulation' }}
                    aria-label="Fechar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {/* Row 2: Status Badge */}
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs sm:text-sm font-semibold ${getStatusClasses(data.status)}`}>
                  <StatusIcon status={data.status} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{RISK_LABELS[data.status]?.pt || data.status}</span>
                </div>
              </div>

              {/* Stats Grid - responsive gap and padding */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
                {/* Value */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2.5 sm:p-3 text-center">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-lavpop-blue dark:text-blue-400" aria-hidden="true" />
                  <div className="text-sm sm:text-base font-bold text-lavpop-blue dark:text-blue-400 truncate">
                    {formatCurrency(data.y)}
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                    Valor total
                  </div>
                </div>

                {/* Days */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2.5 sm:p-3 text-center">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-red-500 dark:text-red-400" aria-hidden="true" />
                  <div className="text-sm sm:text-base font-bold text-red-500 dark:text-red-400">
                    {data.x}d
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                    Última visita
                  </div>
                </div>

                {/* Visits */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2.5 sm:p-3 text-center">
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-lavpop-green dark:text-emerald-400" aria-hidden="true" />
                  <div className="text-sm sm:text-base font-bold text-lavpop-green dark:text-emerald-400">
                    {data.r}
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                    Visitas
                  </div>
                </div>
              </div>

              {/* Action Buttons - responsive sizing */}
              <div className="flex gap-2 sm:gap-3">
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
                           min-h-[48px] px-3 sm:px-4 rounded-xl
                           bg-lavpop-blue hover:bg-lavpop-blue/90
                           text-white text-sm sm:text-base font-semibold
                           transition-colors duration-150
                           focus:outline-none focus:ring-2 focus:ring-lavpop-blue focus:ring-offset-2
                           dark:focus:ring-offset-slate-800"
                  style={{ touchAction: 'manipulation' }}
                >
                  <User className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
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
                             min-h-[48px] px-3 sm:px-4 rounded-xl
                             bg-green-500 hover:bg-green-600
                             text-white text-sm sm:text-base font-semibold
                             transition-colors duration-150
                             focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                             dark:focus:ring-offset-slate-800"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <MessageCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
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
