// DateRangeSelector Component v2.0.0
// Unified date filter for Operations tab
//
// CHANGELOG:
// v2.0 (2025-11-26): Design System alignment
//   - Replaced all inline styles with Tailwind CSS
//   - Added dark mode support
//   - Removed COLORS object (using Tailwind classes)
//   - Improved responsive design
//   - Aligned with Design System v3.0
// v1.0 (2025-11-15): Initial implementation
//   - Created unified date selector component
//   - Displays current date range prominently
//   - Dropdown with 4 date options (each showing date ranges)
//   - Single source of truth for Operations tab filtering

import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { getDateOptions } from '../utils/dateWindows';

const DateRangeSelector = ({ value, onChange, dateWindow }) => {
  const options = useMemo(() => getDateOptions(), []);

  return (
    <div className="flex justify-between items-center px-4 sm:px-6 py-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex-wrap gap-4">
      {/* Left: Date range display */}
      <div className="flex items-center gap-3">
        <Calendar className="w-5 h-5 text-lavpop-blue dark:text-blue-400" />
        <div>
          <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
            Período Selecionado
          </div>
          <div className="text-base font-semibold text-slate-900 dark:text-white">
            {dateWindow.dateRange}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {dateWindow.label}
          </div>
        </div>
      </div>

      {/* Right: Dropdown selector */}
      <div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 px-4 min-w-[200px] sm:min-w-[280px] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-lavpop-blue dark:focus:ring-blue-500 transition-all"
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.displayLabel}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default DateRangeSelector;
