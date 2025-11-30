// ChartTooltip.jsx v1.0
// Reusable chart tooltip component for Recharts
// Design System v3.0 compliant
//
// CHANGELOG:
// v1.0 (2025-11-30): Initial implementation
//   - Consistent styling across all charts
//   - Supports icons and multiple data items
//   - Dark mode support
//   - Accessible with proper contrast

import React from 'react';

/**
 * ChartTooltip - Reusable tooltip for Recharts
 *
 * @param {string} title - Tooltip header text
 * @param {React.ComponentType} icon - Optional Lucide icon component
 * @param {Array} items - Array of { label, value, color, unit? } objects
 * @param {string} className - Additional CSS classes
 */
const ChartTooltip = ({
  title,
  icon: Icon,
  items = [],
  className = '',
}) => {
  if (!items || items.length === 0) return null;

  return (
    <div
      className={`
        bg-white dark:bg-slate-800
        border border-slate-200 dark:border-slate-700
        rounded-lg
        p-3
        shadow-lg
        z-50
        min-w-[140px]
        ${className}
      `}
      role="tooltip"
    >
      {/* Header */}
      {title && (
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-700">
          {Icon && (
            <Icon
              className="w-4 h-4 text-lavpop-blue dark:text-blue-400"
              aria-hidden="true"
            />
          )}
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {title}
          </p>
        </div>
      )}

      {/* Data Items */}
      <div className="space-y-1.5">
        {items.map((item, index) => {
          // Skip items with zero value if hideZero is true
          if (item.hideZero && (item.value === 0 || item.value === '0')) {
            return null;
          }

          return (
            <div
              key={index}
              className="flex items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-center gap-2">
                {item.color && (
                  <div
                    className={`w-2 h-2 rounded-sm flex-shrink-0 ${item.shape === 'circle' ? 'rounded-full' : ''}`}
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  />
                )}
                <span className="text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">
                  {item.label}:
                </span>
              </div>
              <span className="font-bold text-slate-900 dark:text-white whitespace-nowrap">
                {item.value}
                {item.unit && <span className="font-normal text-slate-500 ml-0.5">{item.unit}</span>}
              </span>
            </div>
          );
        })}
      </div>

      {/* Optional footer note */}
      {items.some(item => item.note) && (
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
          {items
            .filter(item => item.note)
            .map((item, index) => (
              <p
                key={index}
                className="text-[10px] text-slate-500 dark:text-slate-400 italic"
              >
                {item.note}
              </p>
            ))}
        </div>
      )}
    </div>
  );
};

/**
 * Helper function to create a Recharts-compatible tooltip wrapper
 *
 * Usage:
 * <Tooltip content={createRechartsTooltip({
 *   titleKey: 'day',
 *   titlePrefix: 'Dia ',
 *   icon: Calendar,
 *   dataKeys: [
 *     { key: 'revenue', label: 'Receita', color: '#3b82f6', format: formatCurrency },
 *     { key: 'cycles', label: 'Ciclos', color: '#22c55e' }
 *   ]
 * })} />
 */
export const createRechartsTooltip = ({
  titleKey,
  titlePrefix = '',
  titleSuffix = '',
  icon,
  dataKeys = [],
}) => {
  return ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    const title = titleKey
      ? `${titlePrefix}${payload[0]?.payload?.[titleKey] || label}${titleSuffix}`
      : `${titlePrefix}${label}${titleSuffix}`;

    const items = dataKeys.map(config => {
      const payloadItem = payload.find(p => p.dataKey === config.key);
      const rawValue = payloadItem?.value ?? 0;
      const formattedValue = config.format ? config.format(rawValue) : rawValue;

      return {
        label: config.label || payloadItem?.name || config.key,
        value: formattedValue,
        color: config.color || payloadItem?.color,
        unit: config.unit,
        shape: config.shape,
        hideZero: config.hideZero,
        note: config.note,
      };
    });

    return <ChartTooltip title={title} icon={icon} items={items} />;
  };
};

export default ChartTooltip;
