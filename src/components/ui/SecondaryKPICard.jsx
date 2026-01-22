/**
 * SecondaryKPICard.jsx v3.1 - COSMIC PRECISION REDESIGN
 * Compact KPI card for secondary metrics
 * Design System v5.1 compliant - Glassmorphic variant
 *
 * CHANGELOG:
 * v3.1 (2026-01-22): Visual polish improvements
 *   - NEW: 2px accent-colored top border for visual connection to color
 *   - IMPROVED: Larger icon sizes (w-4/w-5 instead of w-3.5/w-4)
 *   - Creates clear visual hierarchy: Hero = left border, Secondary = top border
 * v3.0 (2026-01-22): Complete UI redesign - "Cosmic Precision" theme
 *   - NEW: Glassmorphism background with backdrop-blur
 *   - NEW: Accent-tinted radial gradient overlays
 *   - NEW: Theme-aware colors (dark/light mode)
 *   - NEW: Space-themed icon container with accent colors
 *   - REMOVED: Sparklines (per design decision)
 *   - REMOVED: Colored left borders (clean edge design)
 *   - KEPT: Inter font for values (differentiated from Hero cards)
 *   - KEPT: All props and functionality unchanged
 * v2.8 (2026-01-07): Status color badges
 * v2.7-v1.0: See previous changelog entries
 */

import React, { useId, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import TrendBadge from './TrendBadge';
import ContextHelp from '../ContextHelp';
import { haptics } from '../../utils/haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';

// Static hover transition config - defined outside component to prevent recreation
const hoverTransition = { type: 'tween', duration: 0.2, ease: 'easeOut' };

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
  pill,
  sparklineData, // Kept for API compatibility but not rendered
  compact = false,
  tooltip,
  status, // Kept for API compatibility but not used for borders
}) => {
  const uniqueId = useId();
  const { isDark } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  // Pill variants - adjusted for glassmorphism
  const pillVariants = {
    warning: isDark
      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
      : 'bg-amber-50 text-amber-700 border border-amber-200',
    success: isDark
      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
      : 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    info: isDark
      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
      : 'bg-blue-50 text-blue-700 border border-blue-200',
    error: isDark
      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
      : 'bg-red-50 text-red-700 border border-red-200',
  };

  // Color configuration for glassmorphism with accent tints
  const colorMap = {
    cyan: {
      glow: 'rgba(6, 182, 212, 0.2)',
      iconBg: isDark ? 'bg-cyan-500/20' : 'bg-cyan-50',
      iconColor: isDark ? 'text-cyan-400' : 'text-cyan-600',
      topBorder: 'border-t-cyan-500 dark:border-t-cyan-400',
    },
    orange: {
      glow: 'rgba(249, 115, 22, 0.2)',
      iconBg: isDark ? 'bg-orange-500/20' : 'bg-orange-50',
      iconColor: isDark ? 'text-orange-400' : 'text-orange-600',
      topBorder: 'border-t-orange-500 dark:border-t-orange-400',
    },
    purple: {
      glow: 'rgba(168, 85, 247, 0.2)',
      iconBg: isDark ? 'bg-purple-500/20' : 'bg-purple-50',
      iconColor: isDark ? 'text-purple-400' : 'text-purple-600',
      topBorder: 'border-t-purple-500 dark:border-t-purple-400',
    },
    blue: {
      glow: 'rgba(59, 130, 246, 0.2)',
      iconBg: isDark ? 'bg-blue-500/20' : 'bg-blue-50',
      iconColor: isDark ? 'text-blue-400' : 'text-blue-600',
      topBorder: 'border-t-blue-500 dark:border-t-blue-400',
    },
    amber: {
      glow: 'rgba(245, 158, 11, 0.2)',
      iconBg: isDark ? 'bg-amber-500/20' : 'bg-amber-50',
      iconColor: isDark ? 'text-amber-400' : 'text-amber-600',
      topBorder: 'border-t-amber-500 dark:border-t-amber-400',
    },
    red: {
      glow: 'rgba(239, 68, 68, 0.2)',
      iconBg: isDark ? 'bg-red-500/20' : 'bg-red-50',
      iconColor: isDark ? 'text-red-400' : 'text-red-600',
      topBorder: 'border-t-red-500 dark:border-t-red-400',
    },
    green: {
      glow: 'rgba(16, 185, 129, 0.2)',
      iconBg: isDark ? 'bg-emerald-500/20' : 'bg-emerald-50',
      iconColor: isDark ? 'text-emerald-400' : 'text-emerald-600',
      topBorder: 'border-t-emerald-500 dark:border-t-emerald-400',
    },
    slate: {
      glow: 'rgba(100, 116, 139, 0.15)',
      iconBg: isDark ? 'bg-slate-500/20' : 'bg-slate-100',
      iconColor: isDark ? 'text-slate-400' : 'text-slate-600',
      topBorder: 'border-t-slate-500 dark:border-t-slate-400',
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

  // Memoized animation states - prevents variants object recreation on re-render
  const restState = useMemo(() => ({
    y: 0,
    boxShadow: isDark
      ? '0 1px 3px rgba(0, 0, 0, 0.15)'
      : '0 1px 3px rgba(0, 0, 0, 0.08)',
  }), [isDark]);

  const hoverState = useMemo(() => ({
    y: -3,
    boxShadow: isDark
      ? '0 12px 36px rgba(0, 0, 0, 0.35)'
      : '0 12px 36px rgba(0, 0, 0, 0.1)',
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
        ${compact ? 'px-3 py-3' : 'px-3 py-3 sm:px-4 sm:py-4'}
        rounded-xl
        border-t-2 ${colors.topBorder}
        ${isDark
          ? 'bg-space-dust/70 border border-stellar-cyan/10'
          : 'bg-white border border-slate-200 shadow-sm'
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
          opacity: isDark ? 0.5 : 0.4,
        }}
      />

      <div className="flex flex-col gap-1 relative z-10">
        {/* Header: Icon + Title + Trend Badge */}
        <div className="flex items-center gap-2">
          {Icon && (
            <div
              className={`
                ${compact ? 'p-2' : 'p-2'}
                rounded-lg flex-shrink-0
                ${colors.iconBg}
                ${isDark ? 'border border-white/10' : 'border border-slate-200/50'}
              `}
            >
              <Icon
                className={`
                  ${compact ? 'w-4 h-4' : 'w-5 h-5'}
                  ${colors.iconColor}
                `}
              />
            </div>
          )}
          <div
            className={`
              ${compact ? 'text-xs' : 'text-xs sm:text-sm'}
              font-semibold uppercase tracking-wider leading-tight
              flex items-center gap-1
              ${isDark ? 'text-slate-300' : 'text-slate-600'}
            `}
          >
            {title}
            {tooltip && (
              <ContextHelp
                description={tooltip}
                className={isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}
              />
            )}
          </div>
          {/* Trend Badge - header position */}
          {trend?.show && (
            <div className={`flex-shrink-0 ml-auto ${compact ? '' : 'hidden sm:block'}`}>
              <TrendBadge value={trend.value} size="xs" />
            </div>
          )}
        </div>

        {/* Value - Inter font (standard, not Orbitron) */}
        <div
          className={`
            ${compact ? 'text-xl' : 'text-xl sm:text-2xl'}
            font-bold tracking-tight
            ${isDark ? 'text-white' : 'text-slate-900'}
          `}
        >
          {displayValue}
        </div>

        {/* Footer: Subtitle + Pill + Trend Badge */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            {subtitle && (
              <div
                className={`
                  text-xs leading-tight
                  ${isDark ? 'text-slate-400' : 'text-slate-500'}
                `}
              >
                {subtitle}
              </div>
            )}
            {pill && (
              <span
                className={`
                  px-2 py-0.5 rounded-full text-xs font-medium
                  ${pillVariants[pill.variant] || pillVariants.info}
                `}
              >
                {pill.text}
              </span>
            )}
          </div>
          {/* Trend Badge - Mobile only in expanded mode */}
          {!compact && trend?.show && (
            <div className="flex-shrink-0 ml-auto sm:hidden">
              <TrendBadge value={trend.value} size="xs" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SecondaryKPICard;
