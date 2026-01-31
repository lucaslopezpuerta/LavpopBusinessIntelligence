// KPIDetailModal.jsx v2.13 - SWIPE-TO-CLOSE GESTURES
// Enhanced modal with metric-aware header and cosmic glassmorphism
// Design System v5.1 compliant - Tier 2 Enhanced
//
// CHANGELOG:
// v2.13 (2026-01-30): Swipe-to-close and portal rendering
//   - Added useSwipeToClose hook for mobile gesture support
//   - Added portal rendering for proper z-index stacking
//   - Added drag handle indicator on mobile
//   - Backdrop opacity linked to swipe progress
// v2.12 (2026-01-29): Amber color standardization for icon wells
//   - Icon well 'orange' key now uses bg-amber-600/500 for consistency
// v2.11 (2026-01-29): Orange to yellow color migration
//   - Updated orange-600/orange-500 to yellow-600/yellow-500 in colorMap
// v2.10 (2026-01-29): Solid color migration
//   - Updated colorMap icon wells to solid colors (bg-{color}-600/500)
//   - All icon wells now use text-white instead of colored text
//   - Better contrast and visual consistency across themes
// v2.9 (2026-01-27): Animation standardization
//   - Uses MODAL constants from animations.js
//   - Consistent animation timing with other modals
//   - Proper reduced motion support via spread pattern
// v2.8 (2026-01-17): Cosmic Precision upgrade
//   - Added useTheme hook for reliable dark mode
//   - Updated to space-dust background (from slate-800)
//   - Updated to stellar-cyan borders (from slate-700)
//   - Added glassmorphism (backdrop-blur-xl)
//   - Cosmic compliant: Tier 2 Enhanced
// v2.7 (2026-01-12): Refactored to useScrollLock hook
//   - Replaced inline scroll lock useEffect with shared useScrollLock hook
//   - Reduces code duplication across modals
// v2.6 (2026-01-12): Safe area compliance
//   - Added pb-safe to content area for iPhone home indicator
// v2.5 (2026-01-12): iOS-compatible scroll lock
//   - Upgraded scroll lock to fixed position method for iOS Safari
//   - Preserves scroll position when modal closes
// v2.4 (2025-12-16): Added subtitle prop
//   - Subtitle displayed below title in header
//   - Useful for context like "Últimas 8 semanas"
// v2.3 (2025-12-16): Standardized z-index system
//   - Uses z-50 (MODAL_PRIMARY) instead of z-[1050]
//   - Consistent layering across all modals
// v2.2 (2025-12-01): Added badge prop to header
//   - Badge displays count/summary in header
//   - Positioned between title and close button
// v2.1 (2025-12-01): Removed displayValue from header
//   - Cleaner header with just icon and title
// v2.0 (2025-12-01): Enhanced header with metric context
//   - Added icon and color props for visual continuity from KPI card
//   - Header now shows icon with accent color background
//   - Visual connection between card and drill-down modal
// v1.0: Initial implementation

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { MODAL, MODAL_SWIPE } from '../../constants/animations';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useSwipeToClose } from '../../hooks/useSwipeToClose';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useTheme } from '../../contexts/ThemeContext';

// Color mapping for accent backgrounds (solid colors)
const colorMap = {
    green: 'bg-emerald-600 dark:bg-emerald-500 text-white',
    blue: 'bg-blue-600 dark:bg-blue-500 text-white',
    purple: 'bg-purple-600 dark:bg-purple-500 text-white',
    cyan: 'bg-cyan-600 dark:bg-cyan-500 text-white',
    orange: 'bg-amber-600 dark:bg-amber-500 text-white',
    red: 'bg-red-600 dark:bg-red-500 text-white',
    slate: 'bg-slate-600 dark:bg-slate-500 text-white',
};

const KPIDetailModal = ({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    maxWidth = 'max-w-2xl',
    icon: Icon,
    color = 'slate',
    badge
}) => {
    const prefersReducedMotion = useReducedMotion();
    const { isDark } = useTheme();
    const isMobile = useMediaQuery('(max-width: 1023px)');

    // Swipe-to-close gesture (mobile only)
    const { handlers, style, isDragging, backdropOpacity } = useSwipeToClose({
        onClose,
        threshold: MODAL_SWIPE.THRESHOLD,
        resistance: MODAL_SWIPE.RESISTANCE,
        velocityThreshold: MODAL_SWIPE.VELOCITY_THRESHOLD,
        disabled: !isMobile || !isOpen
    });

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    // iOS-compatible scroll lock - prevents body scroll while modal is open
    useScrollLock(isOpen);

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop - opacity linked to swipe progress on mobile */}
                    <motion.div
                        {...(prefersReducedMotion ? MODAL.BACKDROP_REDUCED : MODAL.BACKDROP)}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
                        style={isMobile ? { opacity: backdropOpacity } : undefined}
                    >
                        {/* Modal Container - Cosmic Tier 2 */}
                        <motion.div
                            role="dialog"
                            aria-modal="true"
                            {...(prefersReducedMotion ? MODAL.CONTENT_REDUCED : MODAL.CONTENT)}
                            onClick={(e) => e.stopPropagation()}
                            className={`
                                relative w-full ${maxWidth}
                                ${isDark ? 'bg-space-dust' : 'bg-white/95'}
                                backdrop-blur-xl
                                rounded-2xl shadow-2xl
                                border ${isDark ? 'border-stellar-cyan/15' : 'border-slate-200'}
                                flex flex-col max-h-[90vh]
                            `}
                            style={isMobile ? style : undefined}
                            {...(isMobile ? handlers : {})}
                        >
                            {/* Drag Handle (mobile only) */}
                            {isMobile && (
                                <div className="flex justify-center pt-2 pb-1">
                                    <div className={`w-10 h-1 rounded-full transition-colors ${
                                        isDragging
                                            ? 'bg-stellar-cyan'
                                            : isDark ? 'bg-stellar-cyan/30' : 'bg-slate-300'
                                    }`} />
                                </div>
                            )}

                            {/* Header - Cosmic border */}
                            <div className={`
                                flex items-center justify-between p-4 sm:p-6
                                border-b ${isDark ? 'border-stellar-cyan/10' : 'border-slate-200'}
                                ${isMobile ? 'pt-2' : ''}
                            `}>
                                <div className="flex items-center gap-3">
                                    {Icon && (
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color] || colorMap.slate}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                    )}
                                    <div>
                                        <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            {title}
                                        </h2>
                                        {subtitle && (
                                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                {subtitle}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {badge && (
                                        <span className={`
                                            text-xs font-medium px-2.5 py-1 rounded-full
                                            ${isDark ? 'bg-space-nebula text-slate-300' : 'bg-slate-100 text-slate-600'}
                                        `}>
                                            {badge}
                                        </span>
                                    )}
                                    <button
                                        onClick={onClose}
                                        className={`
                                            p-2 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center
                                            ${isDark
                                                ? 'text-slate-400 hover:bg-white/5 hover:text-slate-300'
                                                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                            }
                                        `}
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Content - Scrollable with safe area */}
                            <div className="p-6 pb-safe overflow-y-auto custom-scrollbar">
                                {children}
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    // Render via portal for proper z-index stacking
    return createPortal(modalContent, document.body);
};

export default KPIDetailModal;
