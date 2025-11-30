// ChartSection.jsx v1.0
// Wrapper component for chart sections with consistent styling
// Design System v3.1 compliant
//
// CHANGELOG:
// v1.0 (2025-11-30): Initial implementation
//   - Header with title, subtitle, filters, and actions
//   - Loading skeleton state
//   - Empty state with icon and message
//   - Responsive padding
//   - Dark mode support

import React from 'react';
import { BarChart3 } from 'lucide-react';

/**
 * Chart Section Wrapper
 *
 * @param {string} title - Section title
 * @param {string} subtitle - Optional subtitle
 * @param {React.ReactNode} children - Chart content
 * @param {React.ReactNode} filters - Optional filter controls
 * @param {React.ReactNode} actions - Optional action buttons
 * @param {boolean} isLoading - Show loading skeleton
 * @param {boolean} isEmpty - Show empty state
 * @param {string} emptyMessage - Message for empty state
 * @param {string} className - Additional CSS classes
 */
const ChartSection = ({
  title,
  subtitle,
  children,
  filters,
  actions,
  isLoading = false,
  isEmpty = false,
  emptyMessage = 'Nenhum dado disponivel',
  emptyIcon: EmptyIcon = BarChart3,
  className = '',
}) => {
  return (
    <div className={`
      bg-white dark:bg-slate-800
      rounded-xl
      border border-gray-100 dark:border-slate-700
      shadow-soft
      overflow-hidden
      ${className}
    `}>
      {/* Header */}
      {(title || filters || actions) && (
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-100 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Title area */}
            <div className="min-w-0">
              {title && (
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Controls area */}
            {(filters || actions) && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {filters}
                {actions}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Body */}
      <div className="p-4 sm:p-6">
        {isLoading ? (
          <ChartSkeleton />
        ) : isEmpty ? (
          <EmptyState message={emptyMessage} icon={EmptyIcon} />
        ) : (
          children
        )}
      </div>
    </div>
  );
};

/**
 * Chart Skeleton Loading State
 */
const ChartSkeleton = ({ height = 'h-64' }) => (
  <div className={`${height} animate-pulse`}>
    <div className="flex items-end justify-between gap-2 h-full px-4">
      {[40, 65, 45, 80, 55, 70, 50, 75, 60, 85, 55, 90].map((h, i) => (
        <div
          key={i}
          className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-t"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  </div>
);

/**
 * Empty State Component
 */
const EmptyState = ({
  message,
  icon: Icon = BarChart3,
  action,
  onAction,
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center mb-4">
      <Icon className="w-7 h-7 text-gray-400 dark:text-slate-500" aria-hidden="true" />
    </div>
    <p className="text-sm text-gray-600 dark:text-slate-400 max-w-xs">
      {message}
    </p>
    {action && onAction && (
      <button
        onClick={onAction}
        className="mt-4 px-4 py-2 text-sm font-medium text-lavpop-blue dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-lavpop-blue rounded"
      >
        {action}
      </button>
    )}
  </div>
);

/**
 * Chart Legend Component
 * For displaying custom legends below charts (especially on mobile)
 */
export const ChartLegend = ({ items, className = '' }) => (
  <div
    className={`flex flex-wrap justify-center gap-4 mt-3 ${className}`}
    role="list"
    aria-label="Legenda do grafico"
  >
    {items.map((item, index) => (
      <div key={index} className="flex items-center gap-1.5" role="listitem">
        <div
          className="w-3 h-3 rounded-sm flex-shrink-0"
          style={{ backgroundColor: item.color }}
          aria-hidden="true"
        />
        <span className="text-xs text-gray-600 dark:text-slate-400">
          {item.label}
        </span>
      </div>
    ))}
  </div>
);

/**
 * Chart Filter Button
 */
export const ChartFilterButton = ({
  label,
  isActive,
  onClick,
  className = '',
}) => (
  <button
    onClick={onClick}
    className={`
      px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
      ${isActive
        ? 'bg-lavpop-blue text-white'
        : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
      }
      ${className}
    `}
  >
    {label}
  </button>
);

export { ChartSkeleton, EmptyState };
export default ChartSection;
