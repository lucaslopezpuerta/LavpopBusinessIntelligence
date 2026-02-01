// TrendBadge.jsx v1.6 - NEUTRAL CONTRAST FIX
// Reusable trend indicator badge
// Design System v3.1 compliant
//
// CHANGELOG:
// v1.6 (2026-01-31): Neutral state WCAG AA contrast fix
//   - Fixed neutral state dark mode contrast (was ~3.5:1, now ~7:1)
//   - Changed from slate-700/slate-300 to slate-600/slate-100
// v1.5 (2026-01-28): Solid colors for WCAG AA compliance
//   - Positive/negative trends now use solid colors with white text
//   - Inverted variant unchanged (designed for gradient backgrounds)
// v1.4 (2025-12-01): Added xs size for compact mobile displays
//   - New xs size: smaller padding, same text-xs (min 12px compliant)
//   - Added className prop for responsive visibility control
// v1.3 (2025-11-30): Accessibility fix
//   - Changed sm size from text-[10px] to text-xs (min 12px)
// v1.2 (2025-11-30): Accessibility improvements
//   - Added aria-hidden to decorative icons
//   - Added aria-label for screen reader context
// v1.1 (2025-11-30): Added onDarkBg prop for gradient cards
//   - New onDarkBg prop for white/transparent styling
//   - Works on gradient backgrounds
// v1.0 (2025-11-30): Initial implementation
//   - Semantic colors (green=positive, red=negative, slate=neutral)
//   - Two sizes: sm and md
//   - Dark mode support

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const TrendBadge = ({
  value,
  size = 'md',
  showIcon = false,
  inverted = false, // For styling on dark/gradient backgrounds
  flipDirection = false, // For metrics where down is good (e.g., churn rate)
  className = ''
}) => {
  if (value === null || value === undefined || isNaN(value)) {
    return null;
  }

  const absValue = Math.abs(value);
  const isNeutral = absValue < 0.5;
  const isPositive = flipDirection ? value < 0 : value > 0;

  const sizeClasses = {
    xs: 'text-xs px-1 py-0.5 gap-0.5',
    sm: 'text-xs px-1.5 py-0.5 gap-0.5',
    md: 'text-xs px-2 py-1 gap-1',
  };

  const iconSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
  };

  // Generate aria-label for screen readers
  const getAriaLabel = () => {
    if (isNeutral) return 'Sem variação significativa';
    const direction = isPositive ? 'aumento' : 'redução';
    return `${direction} de ${absValue.toFixed(1)} por cento`;
  };

  // Styling for gradient/dark backgrounds
  if (inverted) {
    if (isNeutral) {
      return (
        <span
          className={`
            inline-flex items-center
            ${sizeClasses[size]}
            rounded-md font-semibold
            bg-white/20 text-white/90
            ${className}
          `}
          aria-label={getAriaLabel()}
          role="status"
        >
          {showIcon && <Minus className={iconSizes[size]} aria-hidden="true" />}
          <span aria-hidden="true">→</span>
        </span>
      );
    }

    const Icon = isPositive ? TrendingUp : TrendingDown;

    return (
      <span
        className={`
          inline-flex items-center
          ${sizeClasses[size]}
          rounded-md font-bold
          ${isPositive
            ? 'bg-white/25 text-white'
            : 'bg-black/20 text-white/90'
          }
          ${className}
        `}
        aria-label={getAriaLabel()}
        role="status"
      >
        {showIcon && <Icon className={iconSizes[size]} aria-hidden="true" />}
        <span aria-hidden="true">{isPositive ? '↑' : '↓'}{absValue.toFixed(1)}%</span>
      </span>
    );
  }

  // Standard styling for light backgrounds
  // Neutral state: WCAG AA compliant contrast (slate-100 on slate-600 = ~7:1)
  if (isNeutral) {
    return (
      <span
        className={`
          inline-flex items-center
          ${sizeClasses[size]}
          rounded-md font-semibold
          bg-slate-200 dark:bg-slate-600
          text-slate-700 dark:text-slate-100
          ${className}
        `}
        aria-label={getAriaLabel()}
        role="status"
      >
        {showIcon && <Minus className={iconSizes[size]} aria-hidden="true" />}
        <span aria-hidden="true">→</span>
      </span>
    );
  }

  const Icon = isPositive ? TrendingUp : TrendingDown;

  // Solid colors for standard styling (WCAG AA compliant)
  return (
    <span
      className={`
        inline-flex items-center
        ${sizeClasses[size]}
        rounded-md font-bold
        ${isPositive
          ? 'bg-emerald-600 dark:bg-emerald-500 text-white'
          : 'bg-red-600 dark:bg-red-500 text-white'
        }
        ${className}
      `}
      aria-label={getAriaLabel()}
      role="status"
    >
      {showIcon && <Icon className={iconSizes[size]} aria-hidden="true" />}
      <span aria-hidden="true">{isPositive ? '↑' : '↓'}{absValue.toFixed(1)}%</span>
    </span>
  );
};

export default TrendBadge;
