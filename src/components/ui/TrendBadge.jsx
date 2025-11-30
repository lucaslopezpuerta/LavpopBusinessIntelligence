// TrendBadge.jsx v1.3
// Reusable trend indicator badge
// Design System v3.1 compliant
//
// CHANGELOG:
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
  flipDirection = false // For metrics where down is good (e.g., churn rate)
}) => {
  if (value === null || value === undefined || isNaN(value)) {
    return null;
  }

  const absValue = Math.abs(value);
  const isNeutral = absValue < 0.5;
  const isPositive = flipDirection ? value < 0 : value > 0;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-0.5',
    md: 'text-xs px-2 py-1 gap-1',
  };

  const iconSizes = {
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
  if (isNeutral) {
    return (
      <span
        className={`
          inline-flex items-center
          ${sizeClasses[size]}
          rounded-md font-semibold
          bg-slate-100 dark:bg-slate-700
          text-slate-600 dark:text-slate-300
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
          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
          : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
        }
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
