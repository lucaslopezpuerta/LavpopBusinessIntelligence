// HeroKPICard.jsx v1.6
// Primary KPI card for hero metrics (Revenue, Cycles, etc.)
// Design System v3.1 compliant - Clean, non-gradient design
//
// CHANGELOG:
// v1.6 (2025-12-01): Mobile layout redesign
//   - Moved WoW badge to bottom right corner
//   - Reduced badge font size on mobile
//   - Restored icons on mobile (smaller size)
//   - Added shortTitle prop for abbreviated mobile titles
// v1.5 (2025-12-01): Fixed mobile text overflow
//   - Added text truncation on title
//   - Reduced value font to text-base on mobile
//   - Hide icon on very small screens to save space
// v1.4 (2025-12-01): Mobile responsive improvements
//   - Smaller padding on mobile (p-3 sm:p-5)
//   - Smaller value font on mobile (text-xl sm:text-3xl)
//   - Tighter margins for 3-column mobile layout
// v1.3 (2025-11-30): Prop standardization
//   - Renamed iconColor to color for consistency with SecondaryKPICard
// v1.2 (2025-11-30): Color contrast fix
//   - Changed text-slate-500 to text-slate-600 for WCAG AA compliance (4.5:1 ratio)
// v1.1 (2025-11-30): Accessibility improvements
//   - Added focus-visible ring for keyboard navigation
//   - Added role="button" and tabIndex for clickable cards
//   - Added keyboard event handler for Enter/Space
// v1.0 (2025-11-30): Initial implementation
//   - Clean white/slate background (not gradient)
//   - Large metric display for visual hierarchy
//   - Trend badge integration
//   - Click-to-drill-down support
//   - Dark mode support

import React from 'react';
import { MousePointerClick } from 'lucide-react';
import TrendBadge from './TrendBadge';

const HeroKPICard = ({
  title,
  shortTitle, // Abbreviated title for mobile
  value,
  displayValue,
  subtitle,
  trend,
  icon: Icon,
  color = 'blue',
  tooltip,
  onClick,
  className = '',
}) => {
  const colorMap = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    slate: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
  };

  const isClickable = !!onClick;

  const handleKeyDown = (e) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      className={`
        relative
        bg-white dark:bg-slate-800
        rounded-xl
        border border-slate-200 dark:border-slate-700
        p-3 sm:p-5
        shadow-sm
        transition-all duration-200
        ${isClickable ? 'cursor-pointer hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2' : ''}
        ${className}
      `}
      title={tooltip}
    >
      {/* Header: Icon + Title */}
      <div className="flex items-center gap-1.5 sm:gap-3 mb-1 sm:mb-3">
        {Icon && (
          <div className={`p-1 sm:p-2.5 rounded-lg flex-shrink-0 ${colorMap[color]}`}>
            <Icon className="w-3 h-3 sm:w-5 sm:h-5" />
          </div>
        )}
        <h3 className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 leading-tight">
          {/* Short title on mobile, full title on desktop */}
          <span className="sm:hidden">{shortTitle || title}</span>
          <span className="hidden sm:inline">{title}</span>
          {isClickable && (
            <MousePointerClick className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hidden sm:block" />
          )}
        </h3>
      </div>

      {/* Value */}
      <div className="text-lg sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-0.5 sm:mb-1">
        {displayValue}
      </div>

      {/* Footer: Subtitle + Trend Badge */}
      <div className="flex items-center justify-between gap-1">
        {subtitle && (
          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {subtitle}
          </div>
        )}
        {trend?.show && (
          <div className="flex-shrink-0 ml-auto">
            <TrendBadge value={trend.value} size="xs" className="sm:hidden" />
            <TrendBadge value={trend.value} size="sm" className="hidden sm:flex" />
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroKPICard;
