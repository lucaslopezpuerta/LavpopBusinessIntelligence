// ProgressBar.jsx v1.0
// Accessible progress bar component with semantic colors
// Design System v3.1 compliant
//
// CHANGELOG:
// v1.0 (2025-11-30): Initial implementation
//   - Multiple color variants
//   - Accessible with proper ARIA attributes
//   - Optional value labels
//   - Animated fill transitions
//   - Dark mode support

import React from 'react';
import { getSemanticColor } from '../../utils/colorMapping';

/**
 * Progress Bar Component
 *
 * @param {number} value - Current value
 * @param {number} max - Maximum value (default: 100)
 * @param {number} min - Minimum value (default: 0)
 * @param {string} color - Color theme key (emerald, amber, red, blue, lavpop, etc.)
 * @param {string} size - Size variant: 'sm' | 'md' | 'lg'
 * @param {boolean} showLabels - Show min/max labels below bar
 * @param {string} minLabel - Custom minimum label
 * @param {string} maxLabel - Custom maximum label
 * @param {string} ariaLabel - Accessible label for screen readers
 * @param {boolean} animated - Enable fill animation
 * @param {string} className - Additional CSS classes
 */
const ProgressBar = ({
  value,
  max = 100,
  min = 0,
  color = 'blue',
  size = 'md',
  showLabels = false,
  minLabel,
  maxLabel,
  ariaLabel,
  animated = true,
  className = '',
}) => {
  // Calculate percentage
  const range = max - min;
  const progress = range > 0 ? ((value - min) / range) * 100 : 0;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  // Size variants
  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  // Color gradients
  const gradients = {
    emerald: 'from-emerald-500 to-emerald-600',
    green: 'from-green-500 to-green-600',
    amber: 'from-amber-500 to-amber-600',
    red: 'from-red-500 to-red-600',
    blue: 'from-blue-500 to-blue-600',
    lavpop: 'from-stellar-blue to-blue-600',
    indigo: 'from-indigo-500 to-purple-500',
    purple: 'from-purple-500 to-violet-600',
    gradient: 'from-stellar-blue via-purple-500 to-pink-500',
  };

  const gradient = gradients[color] || gradients.blue;
  const sizeClass = sizes[size] || sizes.md;

  // Generate aria-label
  const accessibleLabel = ariaLabel || `Progresso: ${clampedProgress.toFixed(0)}%`;

  return (
    <div className={className}>
      {/* Progress Bar Container */}
      <div
        className={`
          w-full ${sizeClass}
          bg-slate-200 dark:bg-slate-700
          rounded-full overflow-hidden
          shadow-inner
        `}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label={accessibleLabel}
        aria-valuetext={`${clampedProgress.toFixed(0)} por cento`}
      >
        {/* Progress Fill */}
        <div
          className={`
            h-full rounded-full
            bg-gradient-to-r ${gradient}
            ${animated ? 'transition-all duration-500 ease-out' : ''}
          `}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>

      {/* Labels */}
      {showLabels && (
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1.5">
          <span>{minLabel || min}</span>
          <span>{maxLabel || max}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Progress Bar with Value Display
 * Shows the current value/percentage next to or above the bar
 */
export const ProgressBarWithValue = ({
  value,
  max = 100,
  label,
  valueFormatter = (v) => `${v.toFixed(0)}%`,
  color = 'blue',
  size = 'md',
  className = '',
}) => {
  const progress = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className={className}>
      {/* Header with label and value */}
      <div className="flex justify-between items-center mb-1.5">
        {label && (
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {label}
          </span>
        )}
        <span className="text-xs font-semibold text-slate-900 dark:text-white">
          {valueFormatter(progress)}
        </span>
      </div>

      {/* Progress Bar */}
      <ProgressBar
        value={value}
        max={max}
        color={color}
        size={size}
      />
    </div>
  );
};

/**
 * Segmented Progress Bar
 * Shows progress in segments (like goal milestones)
 */
export const SegmentedProgressBar = ({
  value,
  max = 100,
  segments = 4,
  color = 'blue',
  className = '',
}) => {
  const progress = max > 0 ? (value / max) * 100 : 0;
  const segmentWidth = 100 / segments;

  const gradients = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    lavpop: 'bg-stellar-blue',
  };

  const bgColor = gradients[color] || gradients.blue;

  return (
    <div className={`flex gap-1 ${className}`}>
      {Array.from({ length: segments }).map((_, index) => {
        const segmentStart = index * segmentWidth;
        const segmentEnd = (index + 1) * segmentWidth;
        const isFilled = progress >= segmentEnd;
        const isPartial = progress > segmentStart && progress < segmentEnd;
        const partialFill = isPartial
          ? ((progress - segmentStart) / segmentWidth) * 100
          : 0;

        return (
          <div
            key={index}
            className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"
          >
            <div
              className={`h-full ${bgColor} rounded-full transition-all duration-300`}
              style={{
                width: isFilled ? '100%' : isPartial ? `${partialFill}%` : '0%',
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

/**
 * Circular Progress Indicator
 * For compact progress display (like in goal cards)
 */
export const CircularProgress = ({
  value,
  max = 100,
  size = 64,
  strokeWidth = 6,
  color = 'blue',
  showValue = true,
  valueFormatter = (v) => `${v.toFixed(0)}%`,
  className = '',
}) => {
  const progress = max > 0 ? (value / max) * 100 : 0;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (clampedProgress / 100) * circumference;

  const colors = {
    emerald: 'stroke-emerald-500',
    green: 'stroke-green-500',
    amber: 'stroke-amber-500',
    red: 'stroke-red-500',
    blue: 'stroke-blue-500',
    lavpop: 'stroke-stellar-blue',
    indigo: 'stroke-indigo-500',
    purple: 'stroke-purple-500',
  };

  const strokeColor = colors[color] || colors.blue;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${strokeColor} transition-all duration-500 ease-out`}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            {valueFormatter(clampedProgress)}
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
