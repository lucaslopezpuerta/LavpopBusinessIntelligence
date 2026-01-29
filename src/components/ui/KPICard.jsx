// KPICard.jsx v1.16 - HAPTIC FEEDBACK UPDATE
// Unified KPI card component for Intelligence dashboard
// Design System v5.0 compliant - Tier 1 Essential
//
// CHANGELOG:
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

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getSemanticColor } from '../../utils/colorMapping';
import ContextHelp from '../ContextHelp';
import useReducedMotion from '../../hooks/useReducedMotion';
import { TWEEN, STAGGER, SPRING } from '../../constants/animations';
import { haptics } from '../../utils/haptics';

// Smooth tween animation config for hover (avoids spring oscillation/trembling)
const hoverAnimation = {
  rest: { y: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  hover: { y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }
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
}) => {
  const colors = getSemanticColor(color);
  const prefersReducedMotion = useReducedMotion();

  // Wrap onClick with haptic feedback for clickable cards
  const handleClick = useCallback((e) => {
    if (onClick) {
      haptics.light();
      onClick(e);
    }
  }, [onClick]);

  // Variant-specific styling - Cosmic Precision (v4.3)
  // Uses space-dust for dark backgrounds (Tier 1 Essential)
  const variants = {
    default: {
      container: 'p-3 sm:p-5 bg-white dark:bg-space-dust',
      value: 'text-lg sm:text-2xl',
      label: 'text-xs',
      subtitle: 'text-xs',
    },
    hero: {
      container: 'p-4 sm:p-6 bg-white dark:bg-space-dust',
      value: 'text-xl sm:text-3xl lg:text-4xl',
      label: 'text-xs sm:text-sm',
      subtitle: 'text-xs sm:text-sm',
    },
    compact: {
      container: 'p-2.5 sm:p-4 bg-white dark:bg-space-dust',
      value: 'text-base sm:text-xl',
      label: 'text-xs',
      subtitle: 'text-xs',
    },
    gradient: {
      // Design System v4.0: Vibrant gradients with white text
      container: `p-3 sm:p-5 ${colors.solidGradient || colors.bgGradient} shadow-lg`,
      value: 'text-lg sm:text-2xl',
      label: 'text-xs',
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
    const trendClasses = isPositive
      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
      : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300';

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

  const cardClasses = `
    ${v.container}
    rounded-xl
    border border-slate-100 dark:border-stellar-cyan/10
    ${statusBorders[status] || ''}
    ${onClick ? 'cursor-pointer active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-lavpop-blue focus:ring-offset-2 dark:focus:ring-offset-space-dust' : ''}
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
      initial="rest"
      whileHover="hover"
      variants={prefersReducedMotion ? hoverAnimationReduced : hoverAnimation}
      transition={prefersReducedMotion ? { duration: 0 } : TWEEN.HOVER}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3">
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Responsive label: show mobileLabel on small screens, full label on larger */}
            {/* Using div instead of p to allow ContextHelp tooltip (contains div) as child */}
            <div className={`
              ${v.label} font-medium uppercase tracking-wide mb-0.5 sm:mb-1 leading-tight flex items-center gap-1
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
                  className={isGradient ? 'text-white/60 hover:text-white/90' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}
                />
              )}
            </div>
            <p className={`
              ${v.value} font-bold mb-0.5 leading-tight break-words
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

        {/* Icon - smaller on mobile */}
        {Icon && (
          <div className={`
            p-1.5 sm:p-2.5 rounded-lg flex-shrink-0
            ${isGradient ? 'bg-white/20' : `bg-gradient-to-br ${colors.gradient}`}
          `}>
            <Icon
              className={`w-4 h-4 sm:w-6 sm:h-6 ${isGradient ? 'text-white' : 'text-white'}`}
              aria-hidden="true"
            />
          </div>
        )}
      </div>
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
