// KPICard.jsx v1.23 - TYPOGRAPHY CONSISTENCY
// Unified KPI card component for Intelligence dashboard
// Design System v6.4 compliant - Tier 1 Essential with enhanced aesthetics
//
// CHANGELOG:
// v1.23 (2026-02-05): Typography consistency (Design System v6.4)
//   - Fixed text-[10px] minimum font size violations (now text-xs minimum)
//   - Added tracking-tight to value typography for consistent number display
//   - All variants now meet WCAG 2.1 minimum font size requirements
// v1.22 (2026-01-31): Tooltip accessibility for screen readers
//   - Added aria-describedby linking clickable cards to tooltip content
//   - Screen readers now announce tooltip description when focusing card
// v1.21 (2026-01-31): Unified icon & typography patterns
//   - Label tracking: tracking-wider (aligned with Hero/Secondary cards)
//   - Value typography: Added tracking-tight for consistent number display
//   - Maintains consistency across all KPI card variants
// v1.20 (2026-01-31): Sparkline support
//   - NEW: sparklineData prop for optional full-width sparkline background
//   - Absorbs CleanKPICard functionality for card consolidation
//   - Sparkline uses semantic color with gradient fill
//   - Dark/light mode aware sparkline colors
// v1.19 (2026-01-31): Premium visual redesign
//   - Typography: tabular-nums for values, refined tracking on labels
//   - Background: Subtle gradient depth (via → to-nebula/30)
//   - Borders: Inner highlight shadow for premium feel
//   - Hover: Deeper lift (y:-4, scale:1.01) with cyan glow
//   - Icons: Glassmorphic container in dark mode
//   - Maintains full accessibility (WCAG AA, reduced motion)
// v1.18 (2026-01-31): Refresh overlay support
//   - Added isRefreshing prop for background refresh visual feedback
//   - Subtle stellar-cyan shimmer overlay during data refresh
//   - Non-blocking (pointer-events: none)
// v1.17 (2026-01-28): Solid color trend badges for WCAG AA compliance
//   - WoW trend badges now use solid colors with white text
//   - Positive: emerald-600/500, Negative: red-600/500
// v1.16 (2026-01-28): Haptic feedback integration
//   - Added haptics.light() on clickable card press
//   - Native Capacitor haptics on Android/iOS, web fallback
// v1.15 (2026-01-27): Accessibility & consistency improvements
//   - Added useReducedMotion hook for prefers-reduced-motion support
//   - KPICard and KPIGrid animations disabled when user prefers reduced motion
//   - Replaced inline hoverTransition with TWEEN.HOVER constant
//   - Uses centralized STAGGER constants
// v1.14 (2026-01-27): Fixed DOM nesting warning
//   - Changed label wrapper from <p> to <div> to allow ContextHelp tooltip (contains <div>)
//   - Fixes: "validateDOMNesting(...): <div> cannot appear as a descendant of <p>"
// v1.13 (2026-01-27): Stellar Cascade timing optimization
//   - Reduced staggerChildren from 0.05 to 0.035 for snappier cascade
//   - Removed delayChildren (parent AnimatedSection handles orchestration)
//   - Increased spring stiffness from 300 to 450 for faster settle
//   - Added subtle scale (0.98→1) to gridItemVariants
// v1.12 (2026-01-18): Dark mode status border colors
//   - Added brighter dark mode variants for status borders
//   - success: dark:border-l-emerald-400, warning: dark:border-l-amber-400, danger: dark:border-l-red-400
//   - Better visibility against space-dust background
// v1.11 (2026-01-17): Cosmic Precision - neutral trend badge
//   - Updated neutral trend badge to space-dust/80 (from slate-700)
//   - Full cosmic compliance achieved
// v1.10 (2026-01-17): Cosmic Precision upgrade
//   - Updated to space-dust background (from slate-800)
//   - Updated to stellar-cyan borders (from slate-700)
//   - Cosmic compliant: Tier 1 Essential
// v1.9 (2026-01-07): Status color badges (Plan Item 1.3)
//   - NEW: status prop for colored left border ('success'|'warning'|'danger'|'neutral')
//   - Green border for good metrics, yellow for warning, red for critical
//   - Use with getMetricStatus from constants/metricThresholds.js
// v1.8 (2026-01-07): Staggered entrance animations (Figma-quality enhancement)
//   - KPIGrid now animates children with staggered entrance
//   - Each card fades in and rises 15px with spring physics
//   - Optional animate prop to disable (default: true)
// v1.7 (2026-01-07): Premium hover elevation (Figma-quality enhancement)
//   - Added Framer Motion spring animations for hover lift effect
//   - Cards lift 2px with enhanced shadow on hover
//   - Uses spring physics for natural, premium feel
// v1.6 (2026-01-07): Tooltip help icons (Plan Item 1.2)
//   - NEW: tooltip prop for ContextHelp icon next to label
//   - Adapts styling for gradient vs default variants
// v1.5 (2025-12-28): KPIGrid 6-column option
//   - Added columns={6} option: 2 cols mobile, 3 cols desktop
//   - Ideal for 6-card layouts (e.g., ProfitabilitySection)
// v1.4 (2025-12-11): Vibrant gradient variant (Design System v4.0)
//   - Gradient variant now uses solidGradient (vibrant colors) with white text
//   - Added shadow-lg to gradient cards for depth
//   - Improved icon styling for gradient variant
// v1.3 (2025-12-03): Responsive label/subtitle props
//   - Added mobileLabel prop: shorter label for mobile screens
//   - Added mobileSubtitle prop: shorter subtitle for mobile screens
//   - Uses sm:hidden/hidden sm:inline for responsive text switching
// v1.2 (2025-12-03): Mobile truncation fixes
//   - Removed truncate from value - values must always be fully visible
//   - Subtitle now wraps on mobile instead of truncating
//   - Reduced padding on mobile for more content space
//   - Label uses single line with text-ellipsis only when truly needed
// v1.1 (2025-12-02): Trend position option
//   - Added trendPosition prop: 'inline' (default) | 'bottom-right'
//   - bottom-right saves vertical space by positioning trend badge at card bottom
// v1.0 (2025-11-30): Initial implementation
//   - Three variants: default, hero, compact
//   - Unified color system from colorMapping.js
//   - Responsive typography (minimum 12px for accessibility)
//   - Trend badge integration
//   - Dark mode support
//   - Optional click handler with proper a11y

import React, { useCallback, useId, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getSemanticColor } from '../../utils/colorMapping';
import ContextHelp from '../ContextHelp';
import useReducedMotion from '../../hooks/useReducedMotion';
import { useTheme } from '../../contexts/ThemeContext';
import { TWEEN, STAGGER, SPRING } from '../../constants/animations';
import { haptics } from '../../utils/haptics';

// Sparkline color mapping for semantic colors (light/dark mode)
const sparklineColors = {
  blue: { light: '#3b82f6', dark: '#60a5fa' },
  revenue: { light: '#10b981', dark: '#34d399' },
  emerald: { light: '#10b981', dark: '#34d399' },
  cost: { light: '#ef4444', dark: '#f87171' },
  profit: { light: '#8b5cf6', dark: '#a78bfa' },
  purple: { light: '#9333ea', dark: '#a855f7' },
  indigo: { light: '#6366f1', dark: '#818cf8' },
  amber: { light: '#f59e0b', dark: '#fbbf24' },
  warning: { light: '#f59e0b', dark: '#fbbf24' },
  positive: { light: '#10b981', dark: '#34d399' },
  negative: { light: '#ef4444', dark: '#f87171' },
  stellar: { light: '#00aeef', dark: '#00aeef' },
  neutral: { light: '#64748b', dark: '#94a3b8' },
};

/**
 * Full-width sparkline background component
 * Renders an SVG area chart behind card content
 */
const Sparkline = ({ data, color, isDark, id }) => {
  const pathData = useMemo(() => {
    if (!data || data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Use percentage-based coordinates for full responsiveness
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 70 - 15; // 70% height range, 15% padding
      return `${x},${y}`;
    });

    return {
      line: `M${points.join(' L')}`,
      area: `M0,100 L${points.join(' L')} L100,100 Z`
    };
  }, [data]);

  if (!pathData) return null;

  const gradientId = `kpi-sparkline-${id}`;
  const strokeColor = sparklineColors[color]?.[isDark ? 'dark' : 'light'] || sparklineColors.stellar[isDark ? 'dark' : 'light'];

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.12" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path d={pathData.area} fill={`url(#${gradientId})`} />
      {/* Line */}
      <path
        d={pathData.line}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

// Premium hover animation - deeper lift with cyan glow accent
const hoverAnimation = {
  rest: {
    y: 0,
    scale: 1,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
  },
  hover: {
    y: -4,
    scale: 1.01,
    boxShadow: '0 16px 48px rgba(0,0,0,0.12), 0 0 20px rgba(0,174,239,0.08)'
  }
};

// Dark mode hover - enhanced cyan glow
const hoverAnimationDark = {
  rest: {
    y: 0,
    scale: 1,
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
  },
  hover: {
    y: -4,
    scale: 1.01,
    boxShadow: '0 16px 48px rgba(0,0,0,0.4), 0 0 24px rgba(0,174,239,0.15)'
  }
};

// Reduced motion variants - no movement, just subtle opacity
const hoverAnimationReduced = {
  rest: { opacity: 1 },
  hover: { opacity: 0.9 }
};

/**
 * Unified KPI Card Component
 *
 * @param {string} label - Card label/title (or use mobileLabel for responsive)
 * @param {string} mobileLabel - Optional shorter label for mobile screens
 * @param {string|number} value - Main display value (formatted)
 * @param {string} subtitle - Optional secondary text
 * @param {string} mobileSubtitle - Optional shorter subtitle for mobile screens
 * @param {object} trend - Optional trend data { value: number, label?: string }
 * @param {string} trendPosition - Trend badge position: 'inline' (below subtitle) | 'bottom-right' (saves vertical space)
 * @param {React.ComponentType} icon - Optional Lucide icon component
 * @param {string} color - Color theme key (blue, revenue, cost, profit, etc.)
 * @param {string} variant - Card variant: 'default' | 'hero' | 'compact' | 'gradient'
 * @param {function} onClick - Optional click handler
 * @param {string} className - Additional CSS classes
 * @param {string} tooltip - Optional plain language description for ContextHelp icon
 * @param {string} status - Optional status for colored left border: 'success' | 'warning' | 'danger' | 'neutral'
 * @param {boolean} isRefreshing - Shows subtle shimmer overlay when true (for background refresh feedback)
 * @param {number[]} sparklineData - Optional array of values for full-width sparkline background
 */
const KPICard = ({
  label,
  mobileLabel,
  value,
  subtitle,
  mobileSubtitle,
  trend,
  trendPosition = 'inline',
  icon: Icon,
  color = 'blue',
  variant = 'default',
  onClick,
  className = '',
  tooltip,
  status,
  isRefreshing = false,
  sparklineData,
}) => {
  const uniqueId = useId();
  const tooltipDescId = tooltip ? `${uniqueId}-tooltip-desc` : undefined;
  const colors = getSemanticColor(color);
  const prefersReducedMotion = useReducedMotion();
  const { isDark } = useTheme();

  // Wrap onClick with haptic feedback for clickable cards
  const handleClick = useCallback((e) => {
    if (onClick) {
      haptics.light();
      onClick(e);
    }
  }, [onClick]);

  // Variant-specific styling - Cosmic Precision v6.4
  // Premium gradient backgrounds with depth, refined typography
  // v6.4: Fixed text-[10px] minimum font size violations (now text-xs minimum per Design System)
  const variants = {
    default: {
      container: 'p-3 sm:p-5 bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-space-dust dark:via-space-dust dark:to-space-nebula/30',
      value: 'text-lg sm:text-2xl tabular-nums tracking-tight',
      label: 'text-xs tracking-wider',
      subtitle: 'text-xs',
    },
    hero: {
      container: 'p-4 sm:p-6 bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-space-dust dark:via-space-dust dark:to-space-nebula/30',
      value: 'text-xl sm:text-3xl lg:text-4xl tabular-nums tracking-tight',
      label: 'text-xs sm:text-sm tracking-wider',
      subtitle: 'text-xs sm:text-sm',
    },
    compact: {
      container: 'p-2.5 sm:p-4 bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-space-dust dark:via-space-dust dark:to-space-nebula/30',
      value: 'text-base sm:text-xl tabular-nums tracking-tight',
      label: 'text-xs tracking-wider',
      subtitle: 'text-xs',
    },
    gradient: {
      // Design System v6.4: Vibrant gradients with white text
      container: `p-3 sm:p-5 ${colors.solidGradient || colors.bgGradient} shadow-lg`,
      value: 'text-lg sm:text-2xl tabular-nums tracking-tight',
      label: 'text-xs tracking-wider',
      subtitle: 'text-xs',
    },
  };

  const v = variants[variant] || variants.default;
  const isGradient = variant === 'gradient';

  // Status border classes for metric health indication
  // Brighter variants in dark mode for visibility against space-dust
  const statusBorders = {
    success: 'border-l-4 border-l-emerald-500 dark:border-l-emerald-400',
    warning: 'border-l-4 border-l-amber-500 dark:border-l-amber-400',
    danger: 'border-l-4 border-l-red-500 dark:border-l-red-400',
    neutral: ''
  };

  // Render trend indicator
  const renderTrend = () => {
    if (!trend || trend.value === null || trend.value === undefined) return null;

    const isPositive = trend.value > 0;
    const isNeutral = Math.abs(trend.value) < 0.5;

    if (isNeutral) {
      return (
        <span
          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium bg-slate-100 dark:bg-space-dust/80 text-slate-600 dark:text-slate-300"
          role="status"
          aria-label="Sem variacao significativa"
        >
          <Minus className="w-3 h-3" aria-hidden="true" />
          <span aria-hidden="true">Estavel</span>
        </span>
      );
    }

    const TrendIcon = isPositive ? TrendingUp : TrendingDown;
    // Solid colors for WCAG AA compliance (4.5:1+ contrast)
    const trendClasses = isPositive
      ? 'bg-emerald-600 dark:bg-emerald-500 text-white'
      : 'bg-red-600 dark:bg-red-500 text-white';

    return (
      <span
        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-semibold ${trendClasses}`}
        role="status"
        aria-label={`${isPositive ? 'Aumento' : 'Reducao'} de ${Math.abs(trend.value).toFixed(1)} por cento`}
      >
        <TrendIcon className="w-3 h-3" aria-hidden="true" />
        <span aria-hidden="true">
          {isPositive ? '+' : ''}{trend.value.toFixed(1)}%
        </span>
      </span>
    );
  };

  const hasSparkline = sparklineData && sparklineData.length >= 2;

  const cardClasses = `
    relative
    ${v.container}
    rounded-xl
    border border-slate-200/80 dark:border-stellar-cyan/10
    shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[inset_0_1px_0_0_rgba(0,174,239,0.05)]
    ${statusBorders[status] || ''}
    ${hasSparkline ? 'overflow-hidden' : ''}
    ${onClick ? 'cursor-pointer active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-stellar-cyan focus:ring-offset-2 dark:focus:ring-offset-space-dust' : ''}
    ${className}
  `.trim();

  // Use motion.button or motion.div based on clickability
  const MotionCard = onClick ? motion.button : motion.div;

  const showInlineTrend = trend && trendPosition === 'inline';
  const showBottomRightTrend = trend && trendPosition === 'bottom-right';

  return (
    <MotionCard
      className={cardClasses}
      onClick={onClick ? handleClick : undefined}
      type={onClick ? 'button' : undefined}
      aria-label={onClick ? `${label}: ${value}` : undefined}
      aria-describedby={onClick && tooltipDescId ? tooltipDescId : undefined}
      initial="rest"
      whileHover="hover"
      variants={prefersReducedMotion ? hoverAnimationReduced : (isDark ? hoverAnimationDark : hoverAnimation)}
      transition={prefersReducedMotion ? { duration: 0 } : TWEEN.HOVER}
    >
      {/* Hidden tooltip description for screen readers */}
      {onClick && tooltip && (
        <span id={tooltipDescId} className="sr-only">{tooltip}</span>
      )}
      {/* Optional sparkline background */}
      {hasSparkline && (
        <Sparkline
          data={sparklineData}
          color={color}
          isDark={isDark}
          id={uniqueId}
        />
      )}

      <div className="relative z-10 flex items-start justify-between gap-2 sm:gap-3">
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Responsive label: show mobileLabel on small screens, full label on larger */}
            {/* Using div instead of p to allow ContextHelp tooltip (contains div) as child */}
            <div className={`
              ${v.label} font-semibold uppercase mb-0.5 sm:mb-1 leading-tight flex items-center gap-1
              ${isGradient ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}
            `}>
              {mobileLabel ? (
                <>
                  <span className="sm:hidden">{mobileLabel}</span>
                  <span className="hidden sm:inline">{label}</span>
                </>
              ) : label}
              {/* Tooltip help icon */}
              {tooltip && (
                <ContextHelp
                  description={tooltip}
                  className={isGradient ? 'text-white/60 hover:text-white/90' : 'text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300'}
                />
              )}
            </div>
            <p className={`
              ${v.value} font-extrabold tracking-tight mb-0.5 leading-tight break-words
              ${isGradient ? 'text-white' : 'text-slate-900 dark:text-white'}
            `}>
              {value}
            </p>
            {/* Subtitle row with inline trend (bottom-right mode) */}
            {showBottomRightTrend ? (
              <div className="flex items-baseline gap-2 flex-wrap">
                {(subtitle || mobileSubtitle) && (
                  <span className={`
                    ${v.subtitle} leading-tight
                    ${isGradient ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'}
                  `}>
                    {mobileSubtitle ? (
                      <>
                        <span className="sm:hidden">{mobileSubtitle}</span>
                        <span className="hidden sm:inline">{subtitle}</span>
                      </>
                    ) : subtitle}
                  </span>
                )}
                {renderTrend()}
              </div>
            ) : (
              <>
                {/* Standard subtitle - responsive with mobile variant */}
                {(subtitle || mobileSubtitle) && (
                  <p className={`
                    ${v.subtitle} leading-tight
                    ${isGradient ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'}
                  `}>
                    {mobileSubtitle ? (
                      <>
                        <span className="sm:hidden">{mobileSubtitle}</span>
                        <span className="hidden sm:inline">{subtitle}</span>
                      </>
                    ) : subtitle}
                  </p>
                )}
                {/* Inline trend below subtitle */}
                {showInlineTrend && (
                  <div className="mt-1.5 sm:mt-2">
                    {trend.label ? (
                      <span
                        className={`text-xs font-medium ${trend.value > 0 ? 'text-emerald-600 dark:text-emerald-400' : trend.value < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}
                        role="status"
                      >
                        {trend.label}
                      </span>
                    ) : (
                      renderTrend()
                    )}
                  </div>
                )}
              </>
            )}
          </div>

        {/* Icon - glassmorphic container in dark mode */}
        {Icon && (
          <div className={`
            relative p-1.5 sm:p-2.5 rounded-xl flex-shrink-0 overflow-hidden
            ${isGradient
              ? 'bg-white/20'
              : isDark
                ? 'bg-gradient-to-br from-white/5 to-white/10 border border-white/10 backdrop-blur-sm'
                : `bg-gradient-to-br ${colors.gradient}`
            }
          `}>
            {/* Subtle accent color reflection in dark mode - uses semantic color */}
            {isDark && !isGradient && (
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at center, ${colors.accentColor?.dark || '#00aeef'}, transparent 70%)`
                }}
              />
            )}
            <Icon
              className={`relative z-10 w-4 h-4 sm:w-6 sm:h-6 ${isGradient ? 'text-white' : isDark ? (colors.textSubtle || 'text-stellar-cyan') : 'text-white'}`}
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      {/* Refresh overlay - shows during background data refresh */}
      <AnimatePresence>
        {isRefreshing && (
          <motion.div
            className="absolute inset-0 rounded-xl refresh-overlay z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </MotionCard>
  );
};

// Staggered animation variants for grid items
// Tuned for snappier feel with Stellar Cascade transitions
const gridContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      ...STAGGER.FAST,
      staggerChildren: 0.035,  // Reduced from 0.05 for snappier cascade
      delayChildren: 0         // Parent AnimatedSection handles delay
    }
  }
};

const gridItemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },  // Added subtle scale
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...SPRING.QUICK, stiffness: 450, damping: 28 }  // Increased stiffness for snap
  }
};

// Reduced motion variants - instant transitions
const gridContainerVariantsReduced = {
  hidden: { opacity: 1 },
  visible: { opacity: 1 }
};

const gridItemVariantsReduced = {
  hidden: { opacity: 1 },
  visible: { opacity: 1 }
};

/**
 * KPI Grid wrapper with staggered entrance animations
 *
 * @param {boolean} animate - Enable staggered entrance animation (default: true)
 */
export const KPIGrid = ({
  children,
  columns = 4,
  className = '',
  animate = true
}) => {
  const prefersReducedMotion = useReducedMotion();

  const gridClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3', // 6 cards: 2 cols mobile, 3 cols desktop
  };

  // Disable animation if user prefers reduced motion
  if (!animate || prefersReducedMotion) {
    return (
      <div className={`grid ${gridClasses[columns] || gridClasses[4]} gap-3 sm:gap-4 ${className}`}>
        {children}
      </div>
    );
  }

  // Wrap children with motion.div for stagger effect
  const animatedChildren = React.Children.map(children, (child, index) => (
    <motion.div key={index} variants={gridItemVariants}>
      {child}
    </motion.div>
  ));

  return (
    <motion.div
      className={`grid ${gridClasses[columns] || gridClasses[4]} gap-3 sm:gap-4 ${className}`}
      variants={gridContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {animatedChildren}
    </motion.div>
  );
};

export default KPICard;
