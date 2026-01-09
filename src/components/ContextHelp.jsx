// ContextHelp.jsx v1.3
// Tooltip-wrapped help icon for providing context on metrics
// Design System v3.4 compliant
//
// CHANGELOG:
// v1.3 (2026-01-07): Changed default position to bottom (UX improvement)
//   - Bottom position doesn't obstruct the label user is trying to understand
//   - Follows natural top-to-bottom reading flow
//   - Smart positioning still falls back to other positions when needed
// v1.2 (2026-01-07): Fixed tooltip not showing on desktop
//   - REMOVED: Negative margin (-m-3) that broke tooltip trigger bounds
//   - Touch target now uses padding instead of negative margin
//   - Tooltip properly shows on hover/tap
// v1.1 (2026-01-07): Touch target accessibility (had bug)
// v1.0: Initial implementation

import React from 'react';
import { HelpCircle } from 'lucide-react';
import Tooltip from './Tooltip';

const ContextHelp = ({ title, description, formula, children, className }) => {
    const content = (
        <div className="space-y-2 p-1">
            {title && (
                <div className="font-bold text-xs border-b border-white/20 pb-1 mb-1">
                    {title}
                </div>
            )}
            <div className="text-xs opacity-90 leading-relaxed">
                {description}
            </div>
            {formula && (
                <div className="bg-black/20 rounded px-2 py-1 mt-2 font-mono text-[10px]">
                    {formula}
                </div>
            )}
            {children}
        </div>
    );

    return (
        <Tooltip content={content} position="bottom">
            {/* Simple icon wrapper - touch target handled by Tooltip's trigger div */}
            <HelpCircle className={`w-3.5 h-3.5 transition-colors ${className || 'text-slate-400 dark:text-slate-500 hover:text-lavpop-blue dark:hover:text-blue-400'}`} />
        </Tooltip>
    );
};

export default ContextHelp;
