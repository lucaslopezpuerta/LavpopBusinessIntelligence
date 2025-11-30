// HeroKPICard.jsx v1.2
// Primary KPI card for hero metrics (Revenue, Cycles, etc.)
// Design System v3.0 compliant - Clean, non-gradient design
//
// CHANGELOG:
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
  value,
  displayValue,
  subtitle,
  trend,
  icon: Icon,
  iconColor = 'blue',
  tooltip,
  onClick,
  className = '',
}) => {
  const iconColorMap = {
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
        p-5
        shadow-sm
        transition-all duration-200
        ${isClickable ? 'cursor-pointer hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2' : ''}
        ${className}
      `}
      title={tooltip}
    >
      {/* Header: Icon + Title + Trend */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={`p-2.5 rounded-lg ${iconColorMap[iconColor]}`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              {title}
              {isClickable && (
                <MousePointerClick className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
              )}
            </h3>
          </div>
        </div>

        {trend?.show && (
          <TrendBadge value={trend.value} size="md" />
        )}
      </div>

      {/* Value */}
      <div className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">
        {displayValue}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div className="text-sm text-slate-600 dark:text-slate-400">
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default HeroKPICard;
