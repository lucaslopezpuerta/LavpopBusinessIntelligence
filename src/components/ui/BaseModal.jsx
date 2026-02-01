// BaseModal.jsx v1.0 - Unified modal component for consistent UX
// Design System v5.1 compliant - Variant D (Glassmorphism)
//
// FEATURES:
// - Platform-aware animations (bottom sheet on mobile, centered on desktop)
// - Swipe-to-close gesture support on mobile
// - Focus trap for accessibility
// - Keyboard navigation (Escape to close)
// - Safe area handling for notched devices
// - Scroll lock to prevent body scroll
// - Reduced motion support
//
// CHANGELOG:
// v1.0 (2026-01-31): Initial implementation

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import useMediaQuery from '../../hooks/useMediaQuery';
import useReducedMotion from '../../hooks/useReducedMotion';
import useScrollLock from '../../hooks/useScrollLock';
import useSwipeToClose from '../../hooks/useSwipeToClose';
import DragHandle from './DragHandle';
import { MODAL, MODAL_SWIPE } from '../../constants/animations';

/**
 * BaseModal - Unified modal component
 *
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Callback when modal should close
 * @param {React.ReactNode} children - Modal content
 * @param {'small' | 'medium' | 'large' | 'full' | 'auto'} size - Modal height variant
 * @param {'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'} maxWidth - Maximum width on desktop
 * @param {string} title - Modal title
 * @param {string} subtitle - Optional subtitle
 * @param {React.ComponentType} icon - Optional Lucide icon for header
 * @param {'blue' | 'green' | 'purple' | 'cyan' | 'orange' | 'red' | 'slate' | 'emerald' | 'teal' | 'amber'} iconColor - Icon well color
 * @param {boolean} solidIconColors - Use solid background with white text instead of tinted (default: false)
 * @param {React.ReactNode} badge - Optional badge next to title
 * @param {React.ReactNode} headerActions - Optional actions in header (before close button)
 * @param {React.ReactNode} footer - Optional footer content
 * @param {boolean} closeOnBackdrop - Whether clicking backdrop closes modal (default: true)
 * @param {boolean} closeOnEscape - Whether Escape key closes modal (default: true)
 * @param {boolean} showCloseButton - Whether to show X close button (default: true)
 * @param {boolean} showHeader - Whether to show the header section (default: true)
 * @param {boolean} preventScroll - Whether to lock body scroll (default: true)
 * @param {boolean} enableSwipeToClose - Whether swipe gesture is enabled on mobile (default: true)
 * @param {boolean} showDragHandle - Whether to show drag handle on mobile (default: true)
 * @param {string} ariaLabel - Accessible label for screen readers
 * @param {string} ariaDescribedBy - ID of element describing the modal
 * @param {React.RefObject} initialFocusRef - Element to focus when modal opens
 * @param {React.RefObject} returnFocusRef - Element to focus when modal closes
 * @param {string} className - Additional classes for modal container
 * @param {string} contentClassName - Additional classes for content area
 * @param {number} zIndex - Z-index for modal (default: 50)
 */
const BaseModal = ({
  isOpen,
  onClose,
  children,
  size = 'large',
  maxWidth = '2xl',
  title,
  subtitle,
  icon: Icon,
  iconColor = 'slate',
  solidIconColors = false,
  badge,
  headerActions,
  footer,
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  showHeader = true,
  preventScroll = true,
  enableSwipeToClose = true,
  showDragHandle = true,
  ariaLabel,
  ariaDescribedBy,
  initialFocusRef,
  returnFocusRef,
  className = '',
  contentClassName = '',
  zIndex = 50,
}) => {
  const { isDark } = useTheme();
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const prefersReducedMotion = useReducedMotion();
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Scroll lock
  useScrollLock(isOpen && preventScroll);

  // Swipe-to-close gesture
  const {
    handlers: swipeHandlers,
    style: swipeStyle,
    isDragging,
    progress,
    hasReachedThreshold,
    backdropOpacity,
  } = useSwipeToClose({
    onClose,
    threshold: MODAL_SWIPE.THRESHOLD,
    resistance: MODAL_SWIPE.RESISTANCE,
    velocityThreshold: MODAL_SWIPE.VELOCITY_THRESHOLD,
    disabled: !isMobile || !isOpen || !enableSwipeToClose,
  });

  // Escape key handler
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store the element that had focus before modal opened
      previousActiveElement.current = document.activeElement;

      // Focus initial element or modal itself
      requestAnimationFrame(() => {
        if (initialFocusRef?.current) {
          initialFocusRef.current.focus();
        } else if (modalRef.current) {
          modalRef.current.focus();
        }
      });
    } else {
      // Return focus when modal closes
      if (returnFocusRef?.current) {
        returnFocusRef.current.focus();
      } else if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }
  }, [isOpen, initialFocusRef, returnFocusRef]);

  // Focus trap
  const handleKeyDown = useCallback((e) => {
    if (e.key !== 'Tab' || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  }, []);

  // Backdrop click handler
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose();
    }
  }, [closeOnBackdrop, onClose]);

  // Size classes
  const sizeClasses = {
    small: 'max-h-[60vh]',
    medium: 'max-h-[75vh]',
    large: isMobile ? 'max-h-[85vh]' : 'max-h-[90vh]',
    full: isMobile ? 'h-[100dvh] max-h-[100dvh]' : 'max-h-[90vh]',
    auto: '',
  };

  // Max width classes
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  };

  // Icon color mapping - tinted backgrounds with colored text
  const tintedIconColorClasses = {
    blue: {
      bg: isDark ? 'bg-blue-500/20' : 'bg-blue-100',
      text: isDark ? 'text-blue-400' : 'text-blue-600',
    },
    green: {
      bg: isDark ? 'bg-green-500/20' : 'bg-green-100',
      text: isDark ? 'text-green-400' : 'text-green-600',
    },
    purple: {
      bg: isDark ? 'bg-purple-500/20' : 'bg-purple-100',
      text: isDark ? 'text-purple-400' : 'text-purple-600',
    },
    cyan: {
      bg: isDark ? 'bg-cyan-500/20' : 'bg-cyan-100',
      text: isDark ? 'text-cyan-400' : 'text-cyan-600',
    },
    orange: {
      bg: isDark ? 'bg-orange-500/20' : 'bg-orange-100',
      text: isDark ? 'text-orange-400' : 'text-orange-600',
    },
    red: {
      bg: isDark ? 'bg-red-500/20' : 'bg-red-100',
      text: isDark ? 'text-red-400' : 'text-red-600',
    },
    slate: {
      bg: isDark ? 'bg-slate-500/20' : 'bg-slate-100',
      text: isDark ? 'text-slate-400' : 'text-slate-600',
    },
    emerald: {
      bg: isDark ? 'bg-emerald-500/20' : 'bg-emerald-100',
      text: isDark ? 'text-emerald-400' : 'text-emerald-600',
    },
    teal: {
      bg: isDark ? 'bg-teal-500/20' : 'bg-teal-100',
      text: isDark ? 'text-teal-400' : 'text-teal-600',
    },
    amber: {
      bg: isDark ? 'bg-amber-500/20' : 'bg-amber-100',
      text: isDark ? 'text-amber-400' : 'text-amber-600',
    },
  };

  // Solid icon colors - solid backgrounds with white text
  const solidIconColorClasses = {
    blue: { bg: 'bg-blue-600 dark:bg-blue-500', text: 'text-white' },
    green: { bg: 'bg-emerald-600 dark:bg-emerald-500', text: 'text-white' },
    purple: { bg: 'bg-purple-600 dark:bg-purple-500', text: 'text-white' },
    cyan: { bg: 'bg-cyan-600 dark:bg-cyan-500', text: 'text-white' },
    orange: { bg: 'bg-orange-600 dark:bg-orange-500', text: 'text-white' },
    red: { bg: 'bg-red-600 dark:bg-red-500', text: 'text-white' },
    slate: { bg: 'bg-slate-600 dark:bg-slate-500', text: 'text-white' },
    emerald: { bg: 'bg-emerald-600 dark:bg-emerald-500', text: 'text-white' },
    teal: { bg: 'bg-teal-600 dark:bg-teal-500', text: 'text-white' },
    amber: { bg: 'bg-amber-600 dark:bg-amber-500', text: 'text-white' },
  };

  // Select icon color based on solidIconColors prop
  const iconColorClasses = solidIconColors ? solidIconColorClasses : tintedIconColorClasses;

  // Get animation variants based on platform and motion preference
  const getContentAnimation = () => {
    if (prefersReducedMotion) {
      return isMobile ? MODAL.CONTENT_MOBILE_REDUCED : MODAL.CONTENT_REDUCED;
    }
    return isMobile ? MODAL.CONTENT_MOBILE : MODAL.CONTENT;
  };

  const getBackdropAnimation = () => {
    if (prefersReducedMotion) {
      return MODAL.BACKDROP_REDUCED;
    }
    return MODAL.BACKDROP;
  };

  // Don't render if not open (AnimatePresence handles exit animation)
  if (typeof document === 'undefined') return null;

  const iconColors = iconColorClasses[iconColor] || iconColorClasses.slate;
  const contentAnimation = getContentAnimation();
  const backdropAnimation = getBackdropAnimation();

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <div
          className={`fixed inset-0 flex ${isMobile ? 'items-end' : 'items-center'} justify-center`}
          style={{ zIndex }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={backdropAnimation.initial}
            animate={{
              ...backdropAnimation.animate,
              opacity: isDragging ? backdropOpacity : backdropAnimation.animate.opacity,
            }}
            exit={backdropAnimation.exit}
            transition={backdropAnimation.transition}
            onClick={handleBackdropClick}
          />

          {/* Modal Container */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel || title}
            aria-describedby={ariaDescribedBy}
            tabIndex={-1}
            className={`
              relative flex flex-col
              ${isMobile ? 'w-full rounded-t-2xl' : `w-full ${maxWidthClasses[maxWidth]} rounded-2xl mx-4`}
              ${sizeClasses[size]}
              ${isDark ? 'bg-space-dust' : 'bg-white'}
              ${isDark ? 'border-stellar-cyan/15' : 'border-slate-200'}
              border
              shadow-2xl
              overflow-hidden
              ${className}
            `}
            initial={contentAnimation.initial}
            animate={contentAnimation.animate}
            exit={contentAnimation.exit}
            transition={contentAnimation.transition}
            style={isMobile && enableSwipeToClose ? swipeStyle : undefined}
            onKeyDown={handleKeyDown}
            {...(isMobile && enableSwipeToClose ? swipeHandlers : {})}
          >
            {/* Drag Handle (mobile only) */}
            {isMobile && showDragHandle && (
              <div className="flex justify-center pt-3 pb-1">
                <DragHandle
                  isDragging={isDragging}
                  progress={progress}
                  hasReachedThreshold={hasReachedThreshold}
                />
              </div>
            )}

            {/* Header */}
            {showHeader && (title || showCloseButton) && (
              <header
                className={`
                  flex items-center gap-3 px-4 sm:px-6
                  ${isMobile && !showDragHandle ? 'pt-safe' : ''}
                  ${isMobile ? 'py-3' : 'py-4'}
                  border-b
                  ${isDark ? 'border-stellar-cyan/10' : 'border-slate-200'}
                  flex-shrink-0
                `}
              >
                {/* Icon */}
                {Icon && (
                  <div
                    className={`
                      flex-shrink-0 w-10 h-10 rounded-xl
                      flex items-center justify-center
                      ${iconColors.bg}
                    `}
                  >
                    <Icon className={`w-5 h-5 ${iconColors.text}`} />
                  </div>
                )}

                {/* Title & Subtitle */}
                <div className="flex-1 min-w-0">
                  {title && (
                    <h2
                      className={`
                        text-lg font-semibold truncate
                        ${isDark ? 'text-white' : 'text-slate-900'}
                      `}
                    >
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p
                      className={`
                        text-sm truncate
                        ${isDark ? 'text-slate-400' : 'text-slate-500'}
                      `}
                    >
                      {subtitle}
                    </p>
                  )}
                </div>

                {/* Badge */}
                {badge && (
                  <div className="flex-shrink-0">
                    {typeof badge === 'string' ? (
                      <span
                        className={`
                          px-2 py-1 rounded-full text-xs font-medium
                          ${isDark ? 'bg-stellar-cyan/20 text-stellar-cyan' : 'bg-blue-100 text-blue-700'}
                        `}
                      >
                        {badge}
                      </span>
                    ) : (
                      badge
                    )}
                  </div>
                )}

                {/* Header Actions */}
                {headerActions && (
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {headerActions}
                  </div>
                )}

                {/* Close Button */}
                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    className={`
                      flex-shrink-0 p-2 rounded-lg transition-colors
                      ${isDark
                        ? 'text-slate-400 hover:text-white hover:bg-white/10'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}
                    `}
                    aria-label="Fechar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </header>
            )}

            {/* Content */}
            <main
              className={`
                flex-1 overflow-y-auto overscroll-contain
                ${footer ? 'pb-4' : isMobile ? 'pb-safe' : 'pb-4'}
                ${contentClassName}
              `}
            >
              {children}
            </main>

            {/* Footer */}
            {footer && (
              <footer
                className={`
                  flex-shrink-0 px-4 sm:px-6 py-4
                  ${isMobile ? 'pb-safe' : ''}
                  border-t
                  ${isDark ? 'border-stellar-cyan/10' : 'border-slate-200'}
                  ${isDark ? 'bg-space-dust' : 'bg-white'}
                `}
              >
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default BaseModal;
