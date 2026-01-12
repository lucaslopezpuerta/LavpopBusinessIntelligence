// KPIDetailModal.jsx v2.4
// Enhanced modal with metric-aware header
// Design System v3.1 compliant
//
// CHANGELOG:
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

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

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
                        {/* Modal Container */}
                        <motion.div
                            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.95, y: 20 }}
                            transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", duration: 0.5, bounce: 0.3 }}
                            onClick={(e) => e.stopPropagation()}
                            className={`
                relative w-full ${maxWidth}
                bg-white dark:bg-slate-800 
                rounded-2xl shadow-2xl 
                border border-slate-200 dark:border-slate-700
                flex flex-col max-h-[90vh]
              `}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-3">
                                    {Icon && (
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color] || colorMap.slate}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                    )}
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                            {title}
                                        </h2>
                                        {subtitle && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {subtitle}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {badge && (
                                        <span className="text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full">
                                            {badge}
                                        </span>
                                    )}
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Content - Scrollable */}
                            <div className="p-6 overflow-y-auto custom-scrollbar">
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
