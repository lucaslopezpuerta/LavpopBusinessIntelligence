// HeroKPICard.jsx v2.4 - HAPTIC FEEDBACK
// Primary KPI card for hero metrics (Revenue, Cycles, etc.)
// Design System v3.2 compliant - Clean design with sparkline trends
//
// CHANGELOG:
// v2.4 (2025-12-22): Added haptic feedback on card click
// v2.3 (2025-12-16): Responsive trend badge position
//   - FIXED: Desktop (sm+): Badge in header row (avoids sparkline overlap)
//   - FIXED: Mobile: Badge in footer row (sparklines hidden, more title space)
//   - Uses responsive visibility classes for position switching
// v2.1 (2025-12-16): Dark mode border visibility fix
//   - FIXED: Border accent now uses brighter colors in dark mode
//   - border-l-*-500 → border-l-*-400 for dark mode
// v2.0 (2025-12-16): Sparkline + visual enhancements
//   - NEW: sparklineData prop for mini trend visualization
//   - NEW: Subtle left border accent for visual hierarchy
//   - NEW: isSelected prop for active card highlight
//   - Sparkline positioned behind value for layered effect
//   - Better visual distinction from secondary cards
// v1.6 (2025-12-01): Mobile layout redesign
//   - Moved WoW badge to bottom right corner
//   - Reduced badge font size on mobile
//   - Restored icons on mobile (smaller size)
//   - Added shortTitle prop for abbreviated mobile titles
// v1.5 (2025-12-01): Fixed mobile text overflow
// v1.4 (2025-12-01): Mobile responsive improvements
// v1.3 (2025-11-30): Prop standardization
// v1.2 (2025-11-30): Color contrast fix
// v1.1 (2025-11-30): Accessibility improvements
// v1.0 (2025-11-30): Initial implementation

import React, { useMemo, useId, useCallback } from 'react';
import { MousePointerClick } from 'lucide-react';
import TrendBadge from './TrendBadge';
import { haptics } from '../../utils/haptics';

// Mini sparkline component for hero cards
const HeroSparkline = ({ data, color = '#3b82f6', width = 100, height = 36, id }) => {
  const gradientId = `hero-sparkline-gradient-${id}`;

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
      className="absolute right-3 bottom-3 opacity-40 hidden sm:block"
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
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
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
    </svg>
  );
};

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
  sparklineData, // Array of numbers for trend visualization
  isSelected = false, // Active card highlight
}) => {
  // Generate unique ID for SVG gradient to avoid collisions
  const uniqueId = useId();

  const colorMap = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-l-blue-500 dark:border-l-blue-400',
      sparkline: '#3b82f6',
      ring: 'ring-blue-500',
    },
    green: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-l-emerald-500 dark:border-l-emerald-400',
      sparkline: '#10b981',
      ring: 'ring-emerald-500',
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-l-purple-500 dark:border-l-purple-400',
      sparkline: '#8b5cf6',
      ring: 'ring-purple-500',
    },
    amber: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-l-amber-500 dark:border-l-amber-400',
      sparkline: '#f59e0b',
      ring: 'ring-amber-500',
    },
    red: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-l-red-500 dark:border-l-red-400',
      sparkline: '#ef4444',
      ring: 'ring-red-500',
    },
    slate: {
      bg: 'bg-slate-100 dark:bg-slate-700',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-l-slate-500 dark:border-l-slate-400',
      sparkline: '#64748b',
      ring: 'ring-slate-500',
    },
  };

  const colors = colorMap[color] || colorMap.blue;
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
        relative
        bg-white dark:bg-slate-800
        rounded-xl
        border border-slate-200 dark:border-slate-700
        border-l-4 ${colors.border}
        p-3 sm:p-5
        shadow-sm
        transition-all duration-200
        overflow-hidden
        ${isSelected ? `ring-2 ${colors.ring} ring-offset-2 shadow-lg` : ''}
        ${isClickable ? 'cursor-pointer hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 hover:scale-[1.01] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2' : ''}
        ${className}
      `}
      title={tooltip}
    >
      {/* Sparkline background */}
      {sparklineData && sparklineData.length >= 2 && (
        <HeroSparkline
          data={sparklineData}
          color={colors.sparkline}
          id={uniqueId}
        />
      )}

      {/* Header: Icon + Title + Trend Badge */}
      <div className="flex items-center gap-1.5 sm:gap-3 mb-1 sm:mb-3 relative z-10">
        {Icon && (
          <div className={`p-1 sm:p-2.5 rounded-lg flex-shrink-0 ${colors.bg} ${colors.text}`}>
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
        {/* Trend Badge - Desktop only (header position avoids sparkline) */}
        {trend?.show && (
          <div className="flex-shrink-0 ml-auto hidden sm:block">
            <TrendBadge value={trend.value} size="sm" />
          </div>
        )}
      </div>

      {/* Value */}
      <div className="text-lg sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-0.5 sm:mb-1 relative z-10">
        {displayValue}
      </div>

      {/* Footer: Subtitle + Trend Badge (mobile only) */}
      <div className="flex items-center justify-between gap-1 relative z-10">
        {subtitle && (
          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {subtitle}
          </div>
        )}
        {/* Trend Badge - Mobile only (footer position, no sparkline overlap) */}
        {trend?.show && (
          <div className="flex-shrink-0 ml-auto sm:hidden">
            <TrendBadge value={trend.value} size="xs" />
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroKPICard;
