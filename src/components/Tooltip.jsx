// Tooltip.jsx v1.0 - REUSABLE TOOLTIP COMPONENT
// ✅ Position-aware (top, bottom, left, right)
// ✅ Dark mode support
// ✅ Smooth animations
// ✅ Keyboard accessible
//
// CHANGELOG:
// v1.0 (2025-11-23): Initial implementation

import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

const Tooltip = ({
    content,
    children,
    position = 'top',
    className = '',
    showIcon = false,
    iconSize = 'w-4 h-4'
}) => {
    const [isVisible, setIsVisible] = useState(false);

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 -translate-y-2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 translate-y-2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 -translate-x-2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 translate-x-2 ml-2',
    };

    const arrowClasses = {
        top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent',
        bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent',
        left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent',
        right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent',
    };

    return (
        <div className={`relative inline-flex items-center ${className}`}>
            {/* Trigger */}
            <div
                className="inline-flex items-center gap-1 cursor-help"
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                onFocus={() => setIsVisible(true)}
                onBlur={() => setIsVisible(false)}
                tabIndex={0}
            >
                {children}
                {showIcon && (
                    <HelpCircle className={`${iconSize} text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors`} />
                )}
            </div>

            {/* Tooltip Content */}
            {isVisible && (
                <div
                    className={`
            absolute z-tooltip
            ${positionClasses[position]}
            px-3 py-2 
            bg-slate-900 dark:bg-slate-700
            text-white text-xs font-medium
            rounded-lg shadow-lg
            rounded-lg shadow-lg
            pointer-events-none
            animate-fade-in
            min-w-max max-w-xs
          `}
                    role="tooltip"
                >
                    {content}

                    {/* Arrow */}
                    <div
                        className={`
              absolute w-0 h-0
              border-4 border-slate-900 dark:border-slate-700
              ${arrowClasses[position]}
            `}
                    />
                </div>
            )}
        </div>
    );
};

export default Tooltip;
