// SecondaryKPICard.jsx v2.2 - HAPTIC FEEDBACK
// Compact KPI card for secondary metrics
// Design System v3.2 compliant
//
// CHANGELOG:
// v2.2 (2025-12-22): Added haptic feedback on card click
// v2.1 (2025-12-16): Responsive trend badge position
//   - FIXED: Desktop (sm+): Badge in header row (avoids sparkline overlap)
//   - FIXED: Mobile: Badge in footer row (sparklines hidden, more title space)
//   - Uses responsive visibility classes for position switching
// v1.9 (2025-12-16): Hide sparklines on mobile
//   - FIXED: Sparklines now hidden on mobile (hidden sm:block)
//   - Matches HeroKPICard behavior for consistency
//   - Better readability on small gradient cards
// v1.8 (2025-12-16): Sparkline unique ID fix
//   - Fixed SVG gradient ID collision when multiple cards render
//   - Each sparkline now uses React useId() for unique gradient reference
// v1.7 (2025-12-16): Sparkline support
//   - NEW: sparklineData prop for mini trend visualization
//   - SVG-based sparkline with gradient fill
//   - Auto-scales to data range
//   - Positioned behind value for layered effect
// v1.6 (2025-12-13): Informative pill support
//   - NEW: pill prop for contextual status indicators
//   - Supports variants: warning, success, info, error
//   - Semi-transparent styling for gradient backgrounds
//   - Positioned in footer alongside subtitle
// v1.5 (2025-12-01): Relocated WoW badge to bottom right
//   - Moved TrendBadge from Value row to footer
//   - Footer layout: subtitle left, badge right
//   - Consistent with HeroKPICard layout pattern
// v1.4 (2025-12-01): Design System compliance
//   - Fixed text-[10px] violations (min 12px = text-xs)
//   - Changed title and subtitle to text-xs
// v1.3 (2025-11-30): Color mapping fix
//   - Fixed blue color mapping (was incorrectly amber/yellow)
//   - Added explicit amber color option
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

import React, { useMemo, useId, useCallback } from 'react';
import TrendBadge from './TrendBadge';
import { haptics } from '../../utils/haptics';

// Mini sparkline component
const Sparkline = ({ data, width = 80, height = 32, className = '', id }) => {
  const gradientId = `sparkline-gradient-${id}`;

  const pathData = useMemo(() => {
    if (!data || data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * (height * 0.8) - height * 0.1;
      return `${x},${y}`;
    });

    return {
      line: `M${points.join(' L')}`,
      area: `M0,${height} L${points.join(' L')} L${width},${height} Z`
    };
  }, [data, width, height]);

  if (!pathData) return null;

  return (
    <svg
      width={width}
      height={height}
      className={`absolute right-2 bottom-2 opacity-40 hidden sm:block ${className}`}
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Gradient fill - unique ID per instance */}
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.4" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <path
        d={pathData.area}
        fill={`url(#${gradientId})`}
      />

      {/* Line */}
      <path
        d={pathData.line}
        fill="none"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
};

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
  pill, // { text: string, variant: 'warning' | 'success' | 'info' | 'error' }
  sparklineData, // Array of numbers for trend visualization
}) => {
  // Generate unique ID for SVG gradient to avoid collisions
  const uniqueId = useId();
  // Pill variants - semi-transparent for gradient backgrounds
  const pillVariants = {
    warning: 'bg-white/20 text-white border border-amber-300/50',
    success: 'bg-white/20 text-white border border-emerald-300/50',
    info: 'bg-white/20 text-white border border-blue-300/50',
    error: 'bg-white/20 text-white border border-red-300/50',
  };
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
      gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700',
      icon: 'text-white/90',
      title: 'text-white/80',
      value: 'text-white',
      subtitle: 'text-white/70',
    },
    amber: {
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

  // Handle click with haptic feedback
  const handleClick = useCallback(() => {
    if (isClickable) {
      haptics.light();
      onClick();
    }
  }, [isClickable, onClick]);

  const handleKeyDown = useCallback((e) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      haptics.light();
      onClick();
    }
  }, [isClickable, onClick]);

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      className={`
        ${colors.gradient}
        rounded-xl
        px-3 py-3 sm:px-4
        shadow-sm
        transition-all duration-200
        relative overflow-hidden
        ${isClickable ? 'cursor-pointer hover:shadow-md hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600' : ''}
        ${className}
      `}
    >
      {/* Sparkline background */}
      {sparklineData && sparklineData.length >= 2 && (
        <Sparkline data={sparklineData} width={100} height={40} id={uniqueId} />
      )}

      <div className="flex flex-col gap-1 relative z-10">
        {/* Header: Icon + Title + Trend Badge */}
        <div className="flex items-center gap-2">
          {Icon && (
            <div className={`flex-shrink-0 ${colors.icon}`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div className={`text-xs font-semibold ${colors.title} uppercase tracking-wider leading-tight`}>
            {title}
          </div>
          {/* Trend Badge - Desktop only (header position avoids sparkline) */}
          {trend?.show && (
            <div className="flex-shrink-0 ml-auto hidden sm:block">
              <TrendBadge value={trend.value} size="xs" inverted />
            </div>
          )}
        </div>

        {/* Value */}
        <div className={`text-xl sm:text-2xl font-bold ${colors.value}`}>
          {displayValue}
        </div>

        {/* Footer: Subtitle + Pill + Trend Badge (mobile only) */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            {subtitle && (
              <div className={`text-xs ${colors.subtitle} leading-tight`}>
                {subtitle}
              </div>
            )}
            {pill && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pillVariants[pill.variant] || pillVariants.info}`}>
                {pill.text}
              </span>
            )}
          </div>
          {/* Trend Badge - Mobile only (footer position, no sparkline overlap) */}
          {trend?.show && (
            <div className="flex-shrink-0 ml-auto sm:hidden">
              <TrendBadge value={trend.value} size="xs" inverted />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecondaryKPICard;
