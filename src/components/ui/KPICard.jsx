// KPICard.jsx v1.1
// Unified KPI card component for Intelligence dashboard
// Design System v3.1 compliant - Replaces duplicated patterns
//
// CHANGELOG:
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

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getSemanticColor } from '../../utils/colorMapping';

/**
 * Unified KPI Card Component
 *
 * @param {string} label - Card label/title
 * @param {string|number} value - Main display value (formatted)
 * @param {string} subtitle - Optional secondary text
 * @param {object} trend - Optional trend data { value: number, label?: string }
 * @param {string} trendPosition - Trend badge position: 'inline' (below subtitle) | 'bottom-right' (saves vertical space)
 * @param {React.ComponentType} icon - Optional Lucide icon component
 * @param {string} color - Color theme key (blue, revenue, cost, profit, etc.)
 * @param {string} variant - Card variant: 'default' | 'hero' | 'compact' | 'gradient'
 * @param {function} onClick - Optional click handler
 * @param {string} className - Additional CSS classes
 */
const KPICard = ({
  label,
  value,
  subtitle,
  trend,
  trendPosition = 'inline',
  icon: Icon,
  color = 'blue',
  variant = 'default',
  onClick,
  className = '',
}) => {
  const colors = getSemanticColor(color);

  // Variant-specific styling
  const variants = {
    default: {
      container: 'p-4 sm:p-5 bg-white dark:bg-slate-800',
      value: 'text-xl sm:text-2xl',
      label: 'text-xs',
      subtitle: 'text-xs',
    },
    hero: {
      container: 'p-5 sm:p-6 bg-white dark:bg-slate-800',
      value: 'text-2xl sm:text-3xl lg:text-4xl',
      label: 'text-xs sm:text-sm',
      subtitle: 'text-xs sm:text-sm',
    },
    compact: {
      container: 'p-3 sm:p-4 bg-white dark:bg-slate-800',
      value: 'text-lg sm:text-xl',
      label: 'text-xs',
      subtitle: 'text-xs',
    },
    gradient: {
      container: `p-4 sm:p-5 ${colors.bgGradient}`,
      value: 'text-xl sm:text-2xl',
      label: 'text-xs',
      subtitle: 'text-xs',
    },
  };

  const v = variants[variant] || variants.default;
  const isGradient = variant === 'gradient';

  // Render trend indicator
  const renderTrend = () => {
    if (!trend || trend.value === null || trend.value === undefined) return null;

    const isPositive = trend.value > 0;
    const isNeutral = Math.abs(trend.value) < 0.5;

    if (isNeutral) {
      return (
        <span
          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
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
    border border-gray-100 dark:border-slate-700
    shadow-soft
    transition-all duration-200
    ${onClick ? 'cursor-pointer hover:shadow-soft-lg hover:border-gray-200 dark:hover:border-slate-600 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-lavpop-blue focus:ring-offset-2 dark:focus:ring-offset-slate-800' : ''}
    ${className}
  `.trim();

  const CardElement = onClick ? 'button' : 'div';

  const showInlineTrend = trend && trendPosition === 'inline';
  const showBottomRightTrend = trend && trendPosition === 'bottom-right';

  return (
    <CardElement
      className={cardClasses}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      aria-label={onClick ? `${label}: ${value}` : undefined}
    >
      <div className="flex items-start justify-between gap-3">
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={`
              ${v.label} font-medium uppercase tracking-wide mb-1
              ${isGradient ? colors.textMuted : 'text-gray-500 dark:text-slate-400'}
            `}>
              {label}
            </p>
            <p className={`
              ${v.value} font-bold truncate mb-0.5
              ${isGradient ? colors.text : 'text-gray-900 dark:text-white'}
            `}>
              {value}
            </p>
            {/* Subtitle row with inline trend (bottom-right mode) */}
            {showBottomRightTrend ? (
              <div className="flex items-baseline gap-2 flex-wrap">
                {subtitle && (
                  <span className={`
                    ${v.subtitle}
                    ${isGradient ? colors.textSubtle : 'text-gray-500 dark:text-slate-400'}
                  `}>
                    {subtitle}
                  </span>
                )}
                {renderTrend()}
              </div>
            ) : (
              <>
                {/* Standard subtitle */}
                {subtitle && (
                  <p className={`
                    ${v.subtitle} truncate
                    ${isGradient ? colors.textSubtle : 'text-gray-500 dark:text-slate-400'}
                  `}>
                    {subtitle}
                  </p>
                )}
                {/* Inline trend below subtitle */}
                {showInlineTrend && (
                  <div className="mt-2">
                    {trend.label ? (
                      <span
                        className={`text-xs font-medium ${trend.value > 0 ? 'text-emerald-600 dark:text-emerald-400' : trend.value < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-slate-400'}`}
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

        {/* Icon */}
        {Icon && (
          <div className={`
            p-2 sm:p-2.5 rounded-lg flex-shrink-0
            ${isGradient ? colors.iconBg : `bg-gradient-to-br ${colors.gradient}`}
          `}>
            <Icon
              className={`w-5 h-5 sm:w-6 sm:h-6 ${isGradient ? colors.icon : 'text-white'}`}
              aria-hidden="true"
            />
          </div>
        )}
      </div>
    </CardElement>
  );
};

/**
 * KPI Grid wrapper for consistent spacing
 */
export const KPIGrid = ({
  children,
  columns = 4,
  className = ''
}) => {
  const gridClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
  };

  return (
    <div className={`grid ${gridClasses[columns] || gridClasses[4]} gap-3 sm:gap-4 ${className}`}>
      {children}
    </div>
  );
};

export default KPICard;
