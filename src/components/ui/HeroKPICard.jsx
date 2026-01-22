/**
 * HeroKPICard.jsx v4.0 - COSMIC PRECISION REDESIGN
 * Primary KPI card for hero metrics (Revenue, Cycles, etc.)
 * Design System v5.1 compliant - Glassmorphic Hero variant
 *
 * CHANGELOG:
 * v4.0 (2026-01-22): Complete UI redesign - "Cosmic Precision" theme
 *   - NEW: Glassmorphism background with backdrop-blur
 *   - NEW: Accent-tinted radial gradient overlays
 *   - NEW: Orbitron font for value display
 *   - NEW: Constellation-style sparkline with star points
 *   - NEW: Space-themed icon container
 *   - NEW: Theme-aware colors (dark/light mode)
 *   - CHANGED: Removed colored glow on hover (clean shadow only)
 *   - CHANGED: Removed click indicator dot
 *   - KEPT: All props and functionality unchanged
 * v3.0 (2026-01-07): Status color badges
 * v2.9-v1.0: See previous changelog entries
 */

import React, { useMemo, useId, useCallback } from 'react';
import { motion } from 'framer-motion';
import TrendBadge from './TrendBadge';
import ContextHelp from '../ContextHelp';
import { haptics } from '../../utils/haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';

// Static hover transition config - defined outside component to prevent recreation
const hoverTransition = { type: 'tween', duration: 0.2, ease: 'easeOut' };

// Constellation-style sparkline with star points
const ConstellationSparkline = ({ data, isDark, id, compact = false, accentColor }) => {
  const gradientId = `constellation-gradient-${id}`;

  const pathData = useMemo(() => {
    if (!data || data.length < 2) return null;

    const width = compact ? 180 : 140;
    const height = compact ? 56 : 48;
    const padding = 4;
    const pointRadius = compact ? 1.0 : 3;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => ({
      x: padding + (index / (data.length - 1)) * (width - padding * 2),
      y: height - padding - ((value - min) / range) * (height - padding * 2),
    }));

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return { points, pathD, width, height, pointRadius };
  }, [data, compact]);

  if (!pathData) return null;

  const { points, pathD, width, height, pointRadius } = pathData;
  // Use the card's accent color for the sparkline
  const lineColor = accentColor;
  const pointColor = accentColor;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      {/* Connecting line - uses accent color */}
      <path
        d={pathD}
        fill="none"
        stroke={lineColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={isDark ? 0.85 : 0.7}
      />

      {/* Data points - stars */}
      {points.map((point, index) => (
        <g key={index}>
          {/* Glow effect for last point */}
          <circle
            cx={point.x}
            cy={point.y}
            r={pointRadius + 3}
            fill={pointColor}
            opacity={index === points.length - 1 ? 0.5 : 0.15}
          />
          {/* Point */}
          <circle
            cx={point.x}
            cy={point.y}
            r={pointRadius}
            fill={index === points.length - 1 ? pointColor : isDark ? '#64748b' : '#94a3b8'}
          />
        </g>
      ))}
    </svg>
  );
};

const HeroKPICard = ({
  title,
  shortTitle,
  value,
  displayValue,
  subtitle,
  trend,
  icon: Icon,
  color = 'blue',
  tooltip,
  onClick,
  className = '',
  sparklineData,
  isSelected = false,
  compact = false,
  status,
}) => {
  const uniqueId = useId();
  const { isDark } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  // Color configuration for glassmorphism with accent tints
  const colorMap = {
    blue: {
      glow: 'rgba(45, 56, 138, 0.25)',
      border: 'border-l-blue-500 dark:border-l-blue-400',
      iconBg: isDark ? 'bg-blue-500/20' : 'bg-blue-50',
      iconColor: isDark ? 'text-blue-400' : 'text-blue-600',
      sparkline: { dark: '#60a5fa', light: '#2563eb' }, // blue-400 / blue-600
    },
    green: {
      glow: 'rgba(16, 185, 129, 0.25)',
      border: 'border-l-emerald-500 dark:border-l-emerald-400',
      iconBg: isDark ? 'bg-emerald-500/20' : 'bg-emerald-50',
      iconColor: isDark ? 'text-emerald-400' : 'text-emerald-600',
      sparkline: { dark: '#34d399', light: '#059669' }, // emerald-400 / emerald-600
    },
    purple: {
      glow: 'rgba(168, 85, 247, 0.25)',
      border: 'border-l-purple-500 dark:border-l-purple-400',
      iconBg: isDark ? 'bg-purple-500/20' : 'bg-purple-50',
      iconColor: isDark ? 'text-purple-400' : 'text-purple-600',
      sparkline: { dark: '#c084fc', light: '#9333ea' }, // purple-400 / purple-600
    },
    amber: {
      glow: 'rgba(245, 158, 11, 0.25)',
      border: 'border-l-amber-500 dark:border-l-amber-400',
      iconBg: isDark ? 'bg-amber-500/20' : 'bg-amber-50',
      iconColor: isDark ? 'text-amber-400' : 'text-amber-600',
      sparkline: { dark: '#fbbf24', light: '#d97706' }, // amber-400 / amber-600
    },
    red: {
      glow: 'rgba(239, 68, 68, 0.25)',
      border: 'border-l-rose-500 dark:border-l-rose-400',
      iconBg: isDark ? 'bg-rose-500/20' : 'bg-rose-50',
      iconColor: isDark ? 'text-rose-400' : 'text-rose-600',
      sparkline: { dark: '#fb7185', light: '#e11d48' }, // rose-400 / rose-600
    },
    slate: {
      glow: 'rgba(100, 116, 139, 0.15)',
      border: 'border-l-slate-500 dark:border-l-slate-400',
      iconBg: isDark ? 'bg-slate-500/20' : 'bg-slate-50',
      iconColor: isDark ? 'text-slate-400' : 'text-slate-600',
      sparkline: { dark: '#94a3b8', light: '#475569' }, // slate-400 / slate-600
    },
  };

  const colors = colorMap[color] || colorMap.blue;
  // Always use the card's own color for border accent
  const borderClass = colors.border;
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

  // Memoized animation states - prevents object recreation on re-render
  const restState = useMemo(() => ({
    y: 0,
    boxShadow: isDark
      ? '0 1px 3px rgba(0, 0, 0, 0.2)'
      : '0 1px 3px rgba(0, 0, 0, 0.1)',
  }), [isDark]);

  const hoverState = useMemo(() => ({
    y: -4,
    boxShadow: isDark
      ? '0 16px 48px rgba(0, 0, 0, 0.4)'
      : '0 16px 48px rgba(0, 0, 0, 0.12)',
  }), [isDark]);

  return (
    <motion.div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      initial={restState}
      animate={restState}
      whileHover={prefersReducedMotion ? undefined : hoverState}
      whileTap={isClickable && !prefersReducedMotion ? { scale: 0.98 } : undefined}
      transition={hoverTransition}
      className={`
        relative overflow-hidden
        ${compact ? 'px-4 pt-3 pb-4' : 'p-4 sm:p-5'}
        rounded-2xl
        border-l-4 ${borderClass}
        ${isDark
          ? 'bg-space-dust/70 border border-stellar-cyan/15'
          : 'bg-white border border-slate-200 shadow-md'
        }
        ${isSelected
          ? 'ring-2 ring-stellar-cyan ring-offset-2 ring-offset-space-dust'
          : ''
        }
        ${isClickable
          ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan focus-visible:ring-offset-2'
          : ''
        }
        ${className}
      `}
    >
      {/* Accent gradient overlay */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top left, ${colors.glow}, transparent 70%)`,
          opacity: isDark ? 0.4 : 0.3,
        }}
      />

      {/* Constellation sparkline - z-20 to appear above content */}
      {sparklineData && sparklineData.length >= 2 && (
        <div className={`absolute z-20 hidden sm:block ${compact ? 'right-3 bottom-3' : 'right-4 bottom-4'}`}>
          <ConstellationSparkline
            data={sparklineData}
            isDark={isDark}
            id={uniqueId}
            compact={compact}
            accentColor={isDark ? colors.sparkline.dark : colors.sparkline.light}
          />
        </div>
      )}

      {/* Header: Icon + Title + Trend Badge */}
      <div className={`flex items-center ${compact ? 'gap-2 mb-2' : 'gap-2 sm:gap-3 mb-3'} relative z-10`}>
        {Icon && (
          <div
            className={`
              ${compact ? 'p-2' : 'p-2.5 sm:p-2'}
              rounded-xl flex-shrink-0
              ${colors.iconBg}
              ${isDark ? 'border border-white/10' : 'border border-slate-200/50'}
            `}
          >
            <Icon
              className={`
                ${compact ? 'w-6 h-6' : 'w-5 h-5 sm:w-6 sm:h-6'}
                ${colors.iconColor}
              `}
            />
          </div>
        )}
        <h3
          className={`
            ${compact ? 'text-sm sm:text-base' : 'text-sm sm:text-base'}
            font-semibold uppercase tracking-wider
            flex items-center gap-1.5 leading-tight
            ${isDark ? 'text-slate-300' : 'text-slate-600'}
          `}
        >
          {compact ? (
            <span>{shortTitle || title}</span>
          ) : (
            <>
              <span className="sm:hidden">{shortTitle || title}</span>
              <span className="hidden sm:inline">{title}</span>
            </>
          )}
          {tooltip && (
            <ContextHelp
              description={tooltip}
              className={isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}
            />
          )}
        </h3>
        {/* Trend Badge - header position */}
        {trend?.show && (
          <div className={`flex-shrink-0 ml-auto ${compact ? '' : 'hidden sm:block'}`}>
            <TrendBadge value={trend.value} size={compact ? 'base' : 'sm'} />
          </div>
        )}
      </div>

      {/* Value - Orbitron font */}
      <div
        className={`
          ${compact ? 'text-2xl' : 'text-2xl sm:text-3xl'}
          font-bold tracking-tight
          ${compact ? 'mb-1' : 'mb-1.5 sm:mb-2'}
          relative z-10
          ${isDark ? 'text-white' : 'text-slate-900'}
        `}
        style={{ fontFamily: "'Orbitron', sans-serif" }}
      >
        {displayValue}
      </div>

      {/* Footer: Subtitle + Trend Badge (mobile only in expanded mode) */}
      <div className="flex items-center justify-between gap-1 relative z-10">
        {subtitle && (
          <div
            className={`
              ${compact ? 'text-xs' : 'text-xs sm:text-sm'}
              ${isDark ? 'text-slate-400' : 'text-slate-500'}
            `}
          >
            {subtitle}
          </div>
        )}
        {/* Trend Badge - Mobile only in expanded mode */}
        {!compact && trend?.show && (
          <div className="flex-shrink-0 ml-auto sm:hidden">
            <TrendBadge value={trend.value} size="xs" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default HeroKPICard;
