// DashboardDateControl.jsx v1.1 - FLOATING DATE TOGGLE
// ✅ Compact toggle for Complete/Current week
// ✅ Date range display
// ✅ Glassmorphism styling
// ✅ Fixed sticky positioning (below header)
//
// CHANGELOG:
// v1.1 (2025-12-01): Sticky and label fixes
//   - Fixed sticky top position to account for header height
//   - Changed labels from "Anterior/Atual" to "Completa/Parcial" for clarity
//   - "Completa" = last 7 complete days
//   - "Parcial" = current week so far
// v1.0: Initial implementation
import React from 'react';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';

const DashboardDateControl = ({ viewMode, setViewMode, dateRange }) => {
    if (!dateRange) return null;

    return (
        <div className="sticky top-14 lg:top-[60px] z-30 -mt-2 mb-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm">
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
                        title="Últimos 7 dias completos"
                    >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Completa</span>
                        <span className="sm:hidden">7d</span>
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
                        title="Semana atual (parcial)"
                    >
                        <Clock className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Parcial</span>
                        <span className="sm:hidden">Hoje</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardDateControl;
