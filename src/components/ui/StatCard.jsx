// StatCard.jsx v1.0
// Reusable stat card for summary metrics
// Extracted from Intelligence.jsx
//
// CHANGELOG:
// v1.0 (2025-11-30): Initial extraction
//   - Extracted from Intelligence.jsx
//   - Added responsive padding
//   - Dark mode support

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({
  label,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
  className = ''
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    amber: 'from-amber-500 to-amber-600',
    indigo: 'from-indigo-500 to-indigo-600',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <div
      className={`
        bg-white dark:bg-slate-800
        rounded-xl shadow-soft
        p-4 sm:p-6
        border border-gray-100 dark:border-slate-700
        hover:shadow-lg transition-shadow
        ${className}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-slate-400 mb-1 sm:mb-2">
            {label}
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-0.5 sm:mb-1 truncate">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 truncate">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-1.5 sm:mt-2">
              {trend.direction === 'up' && (
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" aria-hidden="true" />
              )}
              {trend.direction === 'down' && (
                <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" aria-hidden="true" />
              )}
              <span
                className={`text-xs sm:text-sm font-medium ${
                  trend.direction === 'up'
                    ? 'text-green-600 dark:text-green-400'
                    : trend.direction === 'down'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-slate-400'
                }`}
                role="status"
                aria-label={`Tendência: ${trend.value}`}
              >
                {trend.value}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div
            className={`
              p-2 sm:p-3 rounded-lg flex-shrink-0
              bg-gradient-to-br ${colorClasses[color] || colorClasses.blue}
            `}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
