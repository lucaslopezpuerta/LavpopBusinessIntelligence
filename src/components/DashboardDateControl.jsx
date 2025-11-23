// DashboardDateControl.jsx v1.0 - FLOATING DATE TOGGLE
// ✅ Compact toggle for Anterior/Atual
// ✅ Date range display
// ✅ Glassmorphism styling
// ✅ Sticky positioning
import React from 'react';
import { Calendar, CheckCircle2 } from 'lucide-react';

const DashboardDateControl = ({ viewMode, setViewMode, dateRange }) => {
    if (!dateRange) return null;

    return (
        <div className="sticky top-0 z-40 -mt-6 mb-6">
            <div className="flex items-center justify-between gap-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-3 shadow-sm">
                {/* Date Range Display */}
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <Calendar className="w-4 h-4 text-lavpop-blue dark:text-blue-400" />
                    <span className="font-medium">
                        {dateRange.start} - {dateRange.end}
                    </span>
                    <span className="hidden sm:inline text-slate-400 dark:text-slate-500">•</span>
                    <span className="hidden sm:inline font-medium">
                        {dateRange.label}
                    </span>
                    <span className="hidden md:inline text-slate-400 dark:text-slate-500">•</span>
                    <span className="hidden md:inline">
                        {viewMode === 'current' ? 'Semana Atual' : 'Semana Anterior'}
                    </span>
                </div>

                {/* Toggle Buttons */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('complete')}
                        className={`
              px-3 py-1.5 rounded-md text-xs font-semibold 
              transition-all duration-200 
              flex items-center gap-1.5
              ${viewMode === 'complete'
                                ? 'bg-white dark:bg-slate-600 text-lavpop-blue dark:text-blue-400 shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}
            `}
                    >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Anterior</span>
                        <span className="sm:hidden">Ant.</span>
                    </button>
                    <button
                        onClick={() => setViewMode('current')}
                        className={`
              px-3 py-1.5 rounded-md text-xs font-semibold 
              transition-all duration-200 
              flex items-center gap-1.5
              ${viewMode === 'current'
                                ? 'bg-white dark:bg-slate-600 text-lavpop-blue dark:text-blue-400 shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}
            `}
                    >
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Atual</span>
                        <span className="sm:hidden">Atual</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardDateControl;
