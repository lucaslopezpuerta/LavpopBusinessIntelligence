// DateRangeSelector Component v2.2.0
// Unified date filter for Operations tab
//
// CHANGELOG:
// v2.2.0 (2025-11-30): Configurable options filtering
//   - Added excludeAllTime prop to filter out "Todo Período" option
//   - Used by Operations tab (allTime not actionable for operations)
// v2.1.1 (2025-11-30): Mobile font size refinement
//   - Reduced select font: text-sm → text-xs sm:text-sm (smaller on mobile)
//   - Reduced select padding: px-4 → px-3 sm:px-4 (tighter on mobile)
// v2.1.0 (2025-11-30): Mobile overflow fix + Design System audit
//   - Fixed text-[10px] → text-xs (Design System min 12px)
//   - Fixed mobile overflow: removed min-w-[200px], select now full-width on mobile
//   - Stacks vertically on mobile (flex-col), horizontal on sm+ (sm:flex-row)
//   - Select stretches to fill available width on mobile
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

const DateRangeSelector = ({ value, onChange, dateWindow, excludeAllTime = false }) => {
  const options = useMemo(() => getDateOptions({ excludeAllTime }), [excludeAllTime]);

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center px-3 py-4 sm:px-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm gap-4">
      {/* Left: Date range display */}
      <div className="flex items-center gap-3">
        <Calendar className="w-5 h-5 text-lavpop-blue dark:text-blue-400 flex-shrink-0" />
        <div>
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
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
      <div className="w-full sm:w-auto">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 px-3 sm:px-4 w-full sm:min-w-[280px] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-lavpop-blue dark:focus:ring-blue-500 transition-all"
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
