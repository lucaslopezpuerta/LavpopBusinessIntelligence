// SecondaryKPICard.jsx v1.2
// Compact KPI card for secondary metrics
// Design System v3.0 compliant
//
// CHANGELOG:
// v1.2 (2025-11-30): Accessibility improvements
//   - Added focus-visible ring for keyboard navigation
//   - Added role="button" and tabIndex for clickable cards
//   - Added keyboard event handler for Enter/Space
// v1.1 (2025-11-30): Gradient backgrounds + mobile text fix
//   - Added gradient backgrounds matching original KPICards
//   - Fixed text truncation on mobile by removing truncate
//   - Adjusted layout for better mobile display
// v1.0 (2025-11-30): Initial implementation
//   - Compact horizontal layout
//   - Click-to-drill-down support
//   - Dark mode support

import React from 'react';
import TrendBadge from './TrendBadge';

const SecondaryKPICard = ({
  title,
  value,
  displayValue,
  subtitle,
  trend,
  icon: Icon,
  color = 'slate',
  onClick,
  className = '',
}) => {
  // Gradient backgrounds matching original KPICards design
  const colorMap = {
    cyan: {
      gradient: 'bg-gradient-to-br from-cyan-500 to-blue-600 dark:from-cyan-600 dark:to-blue-700',
      icon: 'text-white/90',
      title: 'text-white/80',
      value: 'text-white',
      subtitle: 'text-white/70',
    },
    orange: {
      gradient: 'bg-gradient-to-br from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-700',
      icon: 'text-white/90',
      title: 'text-white/80',
      value: 'text-white',
      subtitle: 'text-white/70',
    },
    purple: {
      gradient: 'bg-gradient-to-br from-purple-500 to-violet-600 dark:from-purple-600 dark:to-violet-700',
      icon: 'text-white/90',
      title: 'text-white/80',
      value: 'text-white',
      subtitle: 'text-white/70',
    },
    blue: {
      gradient: 'bg-gradient-to-br from-amber-500 to-yellow-600 dark:from-amber-600 dark:to-yellow-700',
      icon: 'text-white/90',
      title: 'text-white/80',
      value: 'text-white',
      subtitle: 'text-white/70',
    },
    red: {
      gradient: 'bg-gradient-to-br from-red-500 to-rose-600 dark:from-red-600 dark:to-rose-700',
      icon: 'text-white/90',
      title: 'text-white/80',
      value: 'text-white',
      subtitle: 'text-white/70',
    },
    green: {
      gradient: 'bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700',
      icon: 'text-white/90',
      title: 'text-white/80',
      value: 'text-white',
      subtitle: 'text-white/70',
    },
    slate: {
      gradient: 'bg-gradient-to-br from-slate-500 to-gray-600 dark:from-slate-600 dark:to-gray-700',
      icon: 'text-white/90',
      title: 'text-white/80',
      value: 'text-white',
      subtitle: 'text-white/70',
    },
  };

  const colors = colorMap[color] || colorMap.slate;
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
        ${colors.gradient}
        rounded-xl
        px-3 py-3 sm:px-4
        shadow-sm
        transition-all duration-200
        ${isClickable ? 'cursor-pointer hover:shadow-md hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600' : ''}
        ${className}
      `}
    >
      <div className="flex flex-col gap-1">
        {/* Header: Icon + Title */}
        <div className="flex items-center gap-2">
          {Icon && (
            <div className={`flex-shrink-0 ${colors.icon}`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div className={`text-[10px] sm:text-xs font-semibold ${colors.title} uppercase tracking-wider leading-tight`}>
            {title}
          </div>
        </div>

        {/* Value + Trend Row */}
        <div className="flex items-center justify-between gap-2">
          <div className={`text-xl sm:text-2xl font-bold ${colors.value}`}>
            {displayValue}
          </div>
          {trend?.show && (
            <TrendBadge value={trend.value} size="sm" inverted />
          )}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div className={`text-[10px] sm:text-xs ${colors.subtitle} leading-tight`}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

export default SecondaryKPICard;
