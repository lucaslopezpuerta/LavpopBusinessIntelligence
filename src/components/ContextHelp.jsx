import React from 'react';
import { HelpCircle } from 'lucide-react';
import Tooltip from './Tooltip';

const ContextHelp = ({ title, description, formula, children }) => {
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
        <Tooltip content={content} position="top">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 hover:text-lavpop-blue dark:hover:text-blue-400 transition-colors cursor-help" />
        </Tooltip>
    );
};

export default ContextHelp;
