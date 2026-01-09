// HeroKPICard.jsx v3.0 - STATUS COLOR BADGES
// Primary KPI card for hero metrics (Revenue, Cycles, etc.)
// Design System v3.3 compliant - Unified gradient style with secondary cards
//
// CHANGELOG:
// v3.0 (2026-01-07): Status color badges (Plan Item 1.3)
//   - NEW: status prop for colored left border ('success'|'warning'|'danger'|'neutral')
//   - Left border accent visible through gradient background
//   - Use with getMetricStatus from constants/metricThresholds.js
// v2.9 (2026-01-07): Focus ring color now matches card gradient
//   - FIXED: Hardcoded blue-600 ring offset replaced with dynamic color
//   - Each color variant now has matching focus ring offset
//   - Improves accessibility and visual consistency
// v2.8 (2026-01-07): Premium hover elevation (Figma-quality enhancement)
//   - Added Framer Motion spring animations for hover lift effect
//   - Cards lift 2px with enhanced shadow on hover
//   - Replaces CSS hover:scale with spring physics for natural feel
// v2.7 (2026-01-07): Tooltip help icons (Plan Item 1.2)
//   - NEW: ContextHelp icon shows next to title when tooltip prop provided
//   - REMOVED: HTML title attribute (now using proper tooltip component)
//   - Styled for visibility on gradient backgrounds (white/60 hover:white/90)
// v2.6 (2025-12-23): Compact mode for single-glance dashboard
//   - Added compact prop for tighter layout
//   - Compact: smaller padding, smaller text, no sparklines
// v2.5 (2025-12-22): Gradient backgrounds to match secondary cards
//   - Changed from light bg with border-l accent to gradient backgrounds
//   - Unified visual style with SecondaryKPICard
//   - Text changed to white for gradient readability
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
import { motion } from 'framer-motion';
import { MousePointerClick } from 'lucide-react';
import TrendBadge from './TrendBadge';
import ContextHelp from '../ContextHelp';
import { haptics } from '../../utils/haptics';

// Smooth tween animation config for hover (avoids spring oscillation/trembling)
const hoverAnimation = {
  rest: { y: 0, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  hover: { y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }
};

const hoverTransition = { type: 'tween', duration: 0.2, ease: 'easeOut' };

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
  compact = false, // Compact mode for single-glance dashboard
  status, // 'success' | 'warning' | 'danger' | 'neutral' - for colored left border
}) => {
  // Generate unique ID for SVG gradient to avoid collisions
  const uniqueId = useId();

  // Modernized 3-stop gradient backgrounds (v2.5)
  // Uses via- for richer, more premium gradients matching SecondaryKPICard
  const colorMap = {
    blue: {
      gradient: 'bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 dark:from-blue-600 dark:via-indigo-600 dark:to-violet-700',
      icon: 'text-white/90',
      title: 'text-white/80',
      value: 'text-white',
      subtitle: 'text-white/70',
      sparkline: '#ffffff',
      ring: 'ring-blue-400',
      focusRingOffset: 'focus-visible:ring-offset-blue-600',
    },
    green: {
      gradient: 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 dark:from-emerald-600 dark:via-teal-600 dark:to-cyan-700',
      icon: 'text-white/90',
      title: 'text-white/80',
      value: 'text-white',
      subtitle: 'text-white/70',
      sparkline: '#ffffff',
      ring: 'ring-emerald-400',
      focusRingOffset: 'focus-visible:ring-offset-emerald-600',
    },
    purple: {
      gradient: 'bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 dark:from-violet-600 dark:via-purple-600 dark:to-fuchsia-700',
      icon: 'text-white/90',
      title: 'text-white/80',
      value: 'text-white',
      subtitle: 'text-white/70',
      sparkline: '#ffffff',
      ring: 'ring-purple-400',
      focusRingOffset: 'focus-visible:ring-offset-purple-600',
    },
    amber: {
      gradient: 'bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 dark:from-amber-600 dark:via-orange-600 dark:to-rose-600',
      icon: 'text-white/90',
      title: 'text-white/80',
      value: 'text-white',
      subtitle: 'text-white/70',
      sparkline: '#ffffff',
      ring: 'ring-amber-400',
      focusRingOffset: 'focus-visible:ring-offset-amber-600',
    },
    red: {
      gradient: 'bg-gradient-to-br from-rose-500 via-red-500 to-pink-600 dark:from-rose-600 dark:via-red-600 dark:to-pink-700',
      icon: 'text-white/90',
      title: 'text-white/80',
      value: 'text-white',
      subtitle: 'text-white/70',
      sparkline: '#ffffff',
      ring: 'ring-red-400',
      focusRingOffset: 'focus-visible:ring-offset-rose-600',
    },
    slate: {
      gradient: 'bg-gradient-to-br from-slate-500 via-gray-500 to-zinc-600 dark:from-slate-600 dark:via-gray-600 dark:to-zinc-700',
      icon: 'text-white/90',
      title: 'text-white/80',
      value: 'text-white',
      subtitle: 'text-white/70',
      sparkline: '#ffffff',
      ring: 'ring-slate-400',
      focusRingOffset: 'focus-visible:ring-offset-slate-600',
    },
  };

  const colors = colorMap[color] || colorMap.blue;
  const isClickable = !!onClick;

  // Status border classes for metric health indication (visible through gradient)
  const statusBorders = {
    success: 'border-l-4 border-l-emerald-300',
    warning: 'border-l-4 border-l-amber-300',
    danger: 'border-l-4 border-l-red-300',
    neutral: ''
  };

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
    <motion.div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      initial="rest"
      whileHover="hover"
      whileTap={isClickable ? { scale: 0.98 } : undefined}
      variants={hoverAnimation}
      transition={hoverTransition}
      className={`
        relative
        ${colors.gradient}
        rounded-xl
        ${compact ? 'px-6 pt-4 pb-6' : 'p-3 sm:p-5'}
        overflow-hidden
        ${statusBorders[status] || ''}
        ${isSelected ? `ring-2 ${colors.ring} ring-offset-2 shadow-lg` : ''}
        ${isClickable ? `cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 ${colors.focusRingOffset}` : ''}
        ${className}
      `}
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
      <div className={`flex items-center ${compact ? 'gap-1.5 mb-1' : 'gap-1.5 sm:gap-3 mb-1 sm:mb-3'} relative z-10`}>
        {Icon && (
          <div className={`${compact ? 'p-2' : 'p-2 sm:p-2.5'} rounded-lg flex-shrink-0 bg-white/20 ${colors.icon}`}>
            <Icon className={compact ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5'} />
          </div>
        )}
        <h3 className={`text-base ${compact ? '' : 'sm:text-sm'} font-semibold ${colors.title} uppercase tracking-wider flex items-center gap-1.5 leading-tight`}>
          {/* In compact mode, always show short title; otherwise responsive */}
          {compact ? (
            <span>{shortTitle || title}</span>
          ) : (
            <>
              <span className="sm:hidden">{shortTitle || title}</span>
              <span className="hidden sm:inline">{title}</span>
            </>
          )}
          {/* Tooltip help icon - visible on gradient backgrounds */}
          {tooltip && (
            <ContextHelp
              description={tooltip}
              className="text-white/60 hover:text-white/90"
            />
          )}
          {isClickable && !compact && (
            <MousePointerClick className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-white/60 hidden sm:block" />
          )}
        </h3>
        {/* Trend Badge - header position (always in compact, desktop-only otherwise) */}
        {trend?.show && (
          <div className={`flex-shrink-0 ml-auto ${compact ? '' : 'hidden sm:block'}`}>
            <TrendBadge value={trend.value} size={compact ? 'base' : 'sm'} inverted />
          </div>
        )}
      </div>

      {/* Value */}
      <div className={`${compact ? 'text-3xl' : 'text-lg sm:text-3xl'} font-bold ${colors.value} tracking-tight ${compact ? 'mb-1.5' : 'mb-1.5 sm:mb-1'} relative z-10`}>
        {displayValue}
      </div>

      {/* Footer: Subtitle + Trend Badge (mobile only in expanded mode) */}
      <div className="flex items-center justify-between gap-1 relative z-10">
        {subtitle && (
          <div className={`text-sm ${compact ? '' : 'sm:text-sm'} ${colors.subtitle}`}>
            {subtitle}
          </div>
        )}
        {/* Trend Badge - Mobile only in expanded mode (footer position) */}
        {!compact && trend?.show && (
          <div className="flex-shrink-0 ml-auto sm:hidden">
            <TrendBadge value={trend.value} size="xs" inverted />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default HeroKPICard;
