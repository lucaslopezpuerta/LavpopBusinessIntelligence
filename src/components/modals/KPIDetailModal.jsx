// KPIDetailModal.jsx v2.8 - COSMIC PRECISION UPDATE
// Enhanced modal with metric-aware header and cosmic glassmorphism
// Design System v4.3 compliant - Tier 2 Enhanced
//
// CHANGELOG:
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
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useTheme } from '../../contexts/ThemeContext';

// Color mapping for accent backgrounds
const colorMap = {
    green: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
    cyan: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400',
    orange: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400',
    red: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
    slate: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
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

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={prefersReducedMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                        transition={prefersReducedMotion ? { duration: 0 } : undefined}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        {/* Modal Container - Cosmic Tier 2 */}
                        <motion.div
                            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.95, y: 20 }}
                            transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", duration: 0.5, bounce: 0.3 }}
                            onClick={(e) => e.stopPropagation()}
                            className={`
                                relative w-full ${maxWidth}
                                ${isDark ? 'bg-space-dust' : 'bg-white/95'}
                                backdrop-blur-xl
                                rounded-2xl shadow-2xl
                                border ${isDark ? 'border-stellar-cyan/15' : 'border-slate-200'}
                                flex flex-col max-h-[90vh]
                            `}
                        >
                            {/* Header - Cosmic border */}
                            <div className={`
                                flex items-center justify-between p-4 sm:p-6
                                border-b ${isDark ? 'border-stellar-cyan/10' : 'border-slate-200'}
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
                                            p-2 rounded-full transition-colors
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
};

export default KPIDetailModal;
