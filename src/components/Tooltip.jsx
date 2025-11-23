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

import ReactDOM from 'react-dom';

const Tooltip = ({
    content,
    children,
    position = 'top',
    className = '',
    showIcon = false,
    iconSize = 'w-4 h-4'
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    const handleMouseEnter = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setCoords({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height
        });
        setIsVisible(true);
    };

    const tooltipContent = (
        <div
            className={`
                fixed z-[9999] px-3 py-2 
                bg-slate-900 dark:bg-slate-700
                text-white text-xs font-medium
                rounded-lg shadow-xl
                pointer-events-none
                animate-fade-in
                min-w-max max-w-xs
                border border-slate-700 dark:border-slate-600
            `}
            style={{
                top: position === 'top' ? coords.top - 8 : position === 'bottom' ? coords.top + coords.height + 8 : coords.top + coords.height / 2,
                left: position === 'left' ? coords.left - 8 : position === 'right' ? coords.left + coords.width + 8 : coords.left + coords.width / 2,
                transform: position === 'top' ? 'translate(-50%, -100%)' :
                    position === 'bottom' ? 'translate(-50%, 0)' :
                        position === 'left' ? 'translate(-100%, -50%)' :
                            'translate(0, -50%)'
            }}
            role="tooltip"
        >
            {content}
            {/* Arrow - simplified for portal */}
            <div
                className={`
                    absolute w-2 h-2 bg-slate-900 dark:bg-slate-700
                    transform rotate-45 border-slate-700 dark:border-slate-600
                `}
                style={{
                    bottom: position === 'top' ? '-4px' : 'auto',
                    top: position === 'bottom' ? '-4px' : 'auto',
                    left: '50%',
                    marginLeft: '-4px',
                    borderRight: position === 'left' ? '1px solid' : 'none',
                    borderBottom: position === 'top' ? '1px solid' : 'none',
                    borderTop: position === 'bottom' ? '1px solid' : 'none',
                    borderLeft: position === 'right' ? '1px solid' : 'none',
                    visibility: (position === 'left' || position === 'right') ? 'hidden' : 'visible'
                }}
            />
        </div>
    );

    return (
        <div className={`inline-flex items-center ${className}`}>
            <div
                className="inline-flex items-center gap-1 cursor-help"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={() => setIsVisible(false)}
                onFocus={handleMouseEnter}
                onBlur={() => setIsVisible(false)}
                tabIndex={0}
            >
                {children}
                {showIcon && (
                    <HelpCircle className={`${iconSize} text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors`} />
                )}
            </div>

            {isVisible && ReactDOM.createPortal(tooltipContent, document.body)}
        </div>
    );
};

export default Tooltip;
