// DateRangeSelector Component v3.2.0 - RESPONSIVE FONT SIZE
// Unified date filter - consistent with DashboardDateControl
//
// CHANGELOG:
// v3.2.0 (2025-12-28): Improved desktop font size
//   - Date display: text-xs → text-xs sm:text-sm
//   - Dropdown: text-xs → text-xs sm:text-sm
// v3.1.0 (2025-12-22): Added haptic feedback on date change
// v3.0.0 (2025-12-02): Unified design with DashboardDateControl
//   - Compact inline layout matching Dashboard style
//   - Added sticky positioning support
//   - Removed verbose "Período Selecionado" label
//   - Streamlined date display format
//   - Consistent visual hierarchy across app
// v2.2.0 (2025-11-30): Configurable options filtering
//   - Added excludeAllTime prop to filter out "Todo Período" option
//   - Used by Operations tab (allTime not actionable for operations)
// v2.1.1 (2025-11-30): Mobile font size refinement
// v2.1.0 (2025-11-30): Mobile overflow fix + Design System audit
// v2.0 (2025-11-26): Design System alignment
// v1.0 (2025-11-15): Initial implementation

import React, { useMemo, useCallback } from 'react';
import { Calendar } from 'lucide-react';
import { getDateOptions } from '../utils/dateWindows';
import { haptics } from '../utils/haptics';

const DateRangeSelector = ({ value, onChange, dateWindow, excludeAllTime = false, sticky = false }) => {
  const options = useMemo(() => getDateOptions({ excludeAllTime }), [excludeAllTime]);

  // Handle change with haptic feedback
  const handleChange = useCallback((e) => {
    haptics.tick();
    onChange(e.target.value);
  }, [onChange]);

  const content = (
    <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm">
      {/* Left: Date range display */}
      <div className="flex items-center gap-2 text-xs sm:text-base text-slate-600 dark:text-slate-400">
        <Calendar className="w-4 h-4 text-amber-500 dark:text-amber-400" />
        <span className="font-medium">
          {dateWindow.dateRange}
        </span>
        <span className="hidden sm:inline text-slate-400 dark:text-slate-500">•</span>
        <span className="hidden sm:inline font-medium">
          {dateWindow.label}
        </span>
      </div>

      {/* Right: Dropdown selector */}
      <select
        value={value}
        onChange={handleChange}
        className="h-9 px-3 bg-slate-100 dark:bg-slate-700/50 border-0 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 transition-all"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  if (sticky) {
    return (
      <div className="sticky top-14 lg:top-[60px] z-30 -mt-2 mb-6 -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 py-2 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

export default DateRangeSelector;
