// PeriodSelector.jsx v1.0
// Period selector dropdown for Intelligence tab
// Design System v3.0 compliant
//
// CHANGELOG:
// v1.0 (2025-11-30): Initial implementation
//   - Period options: current month, last month, last 90 days, YTD
//   - Responsive design (full-width on mobile)
//   - Dark mode support
//   - Accessible with proper labels

import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

const PERIOD_OPTIONS = [
  { value: 'current-month', label: 'Mês Atual', shortLabel: 'Atual' },
  { value: 'last-month', label: 'Mês Anterior', shortLabel: 'Anterior' },
  { value: 'last-90-days', label: 'Últimos 90 Dias', shortLabel: '90 Dias' },
  { value: 'ytd', label: 'Ano Atual (YTD)', shortLabel: 'YTD' },
  { value: 'all-time', label: 'Todo o Período', shortLabel: 'Tudo' }
];

/**
 * Get date range for a given period
 * @param {string} period - Period identifier
 * @returns {{ startDate: Date, endDate: Date, label: string }}
 */
export const getPeriodDateRange = (period) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case 'current-month': {
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        startDate,
        endDate: today,
        label: now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      };
    }
    case 'last-month': {
      const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        startDate,
        endDate,
        label: startDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      };
    }
    case 'last-90-days': {
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 90);
      return {
        startDate,
        endDate: today,
        label: 'Últimos 90 dias'
      };
    }
    case 'ytd': {
      const startDate = new Date(now.getFullYear(), 0, 1);
      return {
        startDate,
        endDate: today,
        label: `Jan - ${now.toLocaleDateString('pt-BR', { month: 'short' })} ${now.getFullYear()}`
      };
    }
    case 'all-time':
    default: {
      // Return a very old date to include all data
      const startDate = new Date(2020, 0, 1);
      return {
        startDate,
        endDate: today,
        label: 'Todo o período'
      };
    }
  }
};

const PeriodSelector = ({
  value = 'current-month',
  onChange,
  className = '',
  showIcon = true,
  size = 'md' // 'sm' | 'md'
}) => {
  const sizeClasses = {
    sm: 'text-xs py-1.5 pl-2 pr-7',
    md: 'text-sm py-2 pl-3 pr-8'
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4'
  };

  return (
    <div className={`relative ${className}`}>
      {showIcon && (
        <Calendar
          className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 ${iconSizes[size]} text-gray-500 dark:text-slate-400 pointer-events-none`}
          aria-hidden="true"
        />
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full appearance-none cursor-pointer
          bg-white dark:bg-slate-800
          border border-gray-300 dark:border-slate-600
          rounded-lg
          ${sizeClasses[size]}
          ${showIcon ? 'pl-8 sm:pl-9' : ''}
          text-gray-900 dark:text-white
          font-medium
          hover:border-gray-400 dark:hover:border-slate-500
          focus:outline-none focus:ring-2 focus:ring-lavpop-blue/50 focus:border-lavpop-blue
          transition-colors
        `}
        aria-label="Selecionar período de análise"
      >
        {PERIOD_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${iconSizes[size]} text-gray-500 dark:text-slate-400 pointer-events-none`}
        aria-hidden="true"
      />
    </div>
  );
};

export { PERIOD_OPTIONS };
export default PeriodSelector;
