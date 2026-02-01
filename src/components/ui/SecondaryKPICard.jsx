/**
 * SecondaryKPICard.jsx v3.3 - UNIFIED ICON & TYPOGRAPHY
 * Compact KPI card for secondary metrics
 * Design System v6.0 compliant - Aligned with KPICard v1.21 styling
 *
 * CHANGELOG:
 * v3.3 (2026-01-31): Unified icon & typography patterns
 *   - Icon container: rounded-xl (aligned with KPICard/HeroKPICard)
 *   - Maintains consistent styling across all KPI card variants
 * v3.2 (2026-01-31): Premium visual alignment with KPICard v1.19
 *   - Background: Gradient depth (from-space-dust via-space-dust to-space-nebula/30)
 *   - Shadow: Inner highlight for premium feel
 *   - Hover: Deeper lift (y:-4, scale:1.01) with cyan glow
 *   - Typography: font-extrabold + tabular-nums for values
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
      iconColor: isDark ? 'text-cyan-400' : 'text-cyan-600',
      iconGradient: 'from-cyan-500 to-cyan-600',
      accentColor: '#22d3ee', // cyan-400
    },
    orange: {
      glow: 'rgba(249, 115, 22, 0.2)',
      iconColor: isDark ? 'text-orange-400' : 'text-orange-600',
      iconGradient: 'from-orange-500 to-orange-600',
      accentColor: '#fb923c', // orange-400
    },
    purple: {
      glow: 'rgba(168, 85, 247, 0.2)',
      iconColor: isDark ? 'text-purple-400' : 'text-purple-600',
      iconGradient: 'from-purple-500 to-purple-600',
      accentColor: '#c084fc', // purple-400
    },
    blue: {
      glow: 'rgba(59, 130, 246, 0.2)',
      iconColor: isDark ? 'text-blue-400' : 'text-blue-600',
      iconGradient: 'from-blue-500 to-blue-600',
      accentColor: '#60a5fa', // blue-400
    },
    amber: {
      glow: 'rgba(245, 158, 11, 0.2)',
      iconColor: isDark ? 'text-amber-400' : 'text-amber-600',
      iconGradient: 'from-amber-500 to-amber-600',
      accentColor: '#fbbf24', // amber-400
    },
    red: {
      glow: 'rgba(239, 68, 68, 0.2)',
      iconColor: isDark ? 'text-red-400' : 'text-red-600',
      iconGradient: 'from-red-500 to-red-600',
      accentColor: '#f87171', // red-400
    },
    green: {
      glow: 'rgba(16, 185, 129, 0.2)',
      iconColor: isDark ? 'text-emerald-400' : 'text-emerald-600',
      iconGradient: 'from-emerald-500 to-emerald-600',
      accentColor: '#34d399', // emerald-400
    },
    slate: {
      glow: 'rgba(100, 116, 139, 0.15)',
      iconColor: isDark ? 'text-slate-400' : 'text-slate-600',
      iconGradient: 'from-slate-500 to-slate-600',
      accentColor: '#94a3b8', // slate-400
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

  // Memoized animation states - aligned with KPICard v1.19
  const restState = useMemo(() => ({
    y: 0,
    scale: 1,
    boxShadow: isDark
      ? '0 2px 8px rgba(0, 0, 0, 0.3)'
      : '0 1px 3px rgba(0, 0, 0, 0.08)',
  }), [isDark]);

  const hoverState = useMemo(() => ({
    y: -4,
    scale: 1.01,
    boxShadow: isDark
      ? '0 16px 48px rgba(0, 0, 0, 0.4), 0 0 24px rgba(0, 174, 239, 0.15)'
      : '0 16px 48px rgba(0, 0, 0, 0.12), 0 0 20px rgba(0, 174, 239, 0.08)',
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
        ${isDark
          ? 'bg-gradient-to-br from-space-dust via-space-dust to-space-nebula/30 border border-stellar-cyan/10 shadow-[inset_0_1px_0_0_rgba(0,174,239,0.05)]'
          : 'bg-gradient-to-br from-white via-white to-slate-50/50 border border-slate-200/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]'
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
                relative ${compact ? 'p-2' : 'p-2'} rounded-xl flex-shrink-0 overflow-hidden
                ${isDark
                  ? 'bg-gradient-to-br from-white/5 to-white/10 border border-white/10 backdrop-blur-sm'
                  : `bg-gradient-to-br ${colors.iconGradient}`
                }
              `}
            >
              {/* Subtle accent color reflection in dark mode */}
              {isDark && (
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, ${colors.accentColor}, transparent 70%)`
                  }}
                />
              )}
              <Icon
                className={`
                  relative z-10 ${compact ? 'w-4 h-4' : 'w-5 h-5'}
                  ${isDark ? colors.iconColor : 'text-white'}
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
            font-extrabold tracking-tight tabular-nums
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
