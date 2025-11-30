// DayOfWeekChart Component v3.1.0
// Day-of-week utilization patterns with dual-axis chart
//
// CHANGELOG:
// v3.1.0 (2025-11-30): Chart memoization for performance
//   - Moved getColor outside component (pure function)
//   - Memoized chartData, sortedDays, bestDay, worstDay
//   - Memoized CustomTooltip component
// v3.0.0 (2025-11-26): Design System alignment
//   - Replaced all inline styles with Tailwind CSS
//   - Added dark mode support throughout
//   - Removed COLORS object (using Tailwind classes and theme colors)
//   - Updated Recharts colors to match design system
//   - Replaced emoji with Lightbulb icon
//   - Improved responsive design
//   - Aligned with Design System v3.0
// v2.0 (2025-11-15): Unified date filtering
//   - Removed individual period dropdown
//   - Now receives dateFilter and dateWindow props from parent
//   - Displays explicit date range in subtitle
//   - Synchronized with Operations tab DateRangeSelector
// v1.0 (Previous): Initial implementation with local period control

import React, { useMemo, useCallback } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar, Droplet, Flame, Lightbulb } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

// Pure function moved outside component for stability
const getColor = (utilization) => {
  if (utilization >= 60) return '#10b981'; // emerald-500
  if (utilization >= 40) return '#1a5a8e'; // lavpop-blue
  if (utilization >= 25) return '#f59e0b'; // amber-500
  return '#dc2626'; // red-600
};

const DayOfWeekChart = ({ dayPatterns, dateFilter = 'currentWeek', dateWindow }) => {
  // Memoize chart data to prevent new object references on every render
  const chartData = useMemo(() => {
    if (!dayPatterns || dayPatterns.length === 0) return [];
    return dayPatterns.map(day => ({
      name: day.dayShort,
      revenue: day.avgRevenue,
      utilization: day.totalUtilization,
      wash: day.avgWash,
      dry: day.avgDry,
      color: getColor(day.totalUtilization)
    }));
  }, [dayPatterns]);

  // Memoize sorted days and best/worst calculations
  const { sortedDays, bestDay, worstDay } = useMemo(() => {
    if (!dayPatterns || dayPatterns.length === 0) {
      return { sortedDays: [], bestDay: null, worstDay: null };
    }
    const sorted = [...dayPatterns].sort((a, b) => b.totalUtilization - a.totalUtilization);
    return {
      sortedDays: sorted,
      bestDay: sorted[0],
      worstDay: sorted[sorted.length - 1]
    };
  }, [dayPatterns]);

  // Memoize CustomTooltip to prevent recreation on every render
  const CustomTooltip = useCallback(({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const dayData = dayPatterns?.find(d => d.dayShort === data.name);

      return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl min-w-[200px]">
          <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2 m-0">
            {dayData?.dayName || data.name}
          </p>
          <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
            <div className="flex items-center gap-2">
              <Droplet className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              <strong>{data.wash.toFixed(1)} lavagens</strong>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <strong>{data.dry.toFixed(1)} secagens</strong>
            </div>
            <div>
              <strong>Receita:</strong> {formatCurrency(data.revenue)}
            </div>
            <div>
              <strong>Utilização:</strong> {data.utilization.toFixed(1)}%
            </div>
          </div>
        </div>
      );
    }
    return null;
  }, [dayPatterns]);

  if (!dayPatterns || dayPatterns.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 text-center text-slate-600 dark:text-slate-400">
        Loading day of week patterns...
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
      {/* Header with Date Range Display */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-5 h-5 text-lavpop-blue dark:text-blue-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Utilização por Dia da Semana
          </h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Período: {dateWindow?.dateRange || 'Carregando...'}
        </p>
      </div>

      {/* Dual-Axis Chart: Revenue (bars) + Utilization (line) */}
      <div className="mb-4">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 600 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            {/* Left Y-Axis: Revenue */}
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              label={{
                value: 'Receita (R$)',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 11, fill: '#6b7280' }
              }}
            />
            {/* Right Y-Axis: Utilization */}
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              label={{
                value: 'Utilização (%)',
                angle: 90,
                position: 'insideRight',
                style: { fontSize: 11, fill: '#6b7280' }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
            />
            <Bar
              yAxisId="left"
              dataKey="revenue"
              name="Receita"
              fill="#1a5a8e"
              radius={[8, 8, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="utilization"
              name="Utilização (%)"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 5, fill: '#10b981' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Best Day */}
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
            Melhor Dia
          </div>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mb-2">
            {bestDay.dayName}
          </div>
          <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
            <div>{bestDay.totalUtilization.toFixed(1)}% utilização</div>
            <div className="flex items-center gap-1">
              <Droplet className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              {bestDay.avgWash.toFixed(1)} lavagens
            </div>
            <div className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              {bestDay.avgDry.toFixed(1)} secagens
            </div>
            <div className="font-semibold text-slate-900 dark:text-white mt-1">
              {formatCurrency(bestDay.avgRevenue)}
            </div>
          </div>
        </div>

        {/* Worst Day */}
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
            Menor Movimento
          </div>
          <div className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">
            {worstDay.dayName}
          </div>
          <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
            <div>{worstDay.totalUtilization.toFixed(1)}% utilização</div>
            <div className="flex items-center gap-1">
              <Droplet className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              {worstDay.avgWash.toFixed(1)} lavagens
            </div>
            <div className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              {worstDay.avgDry.toFixed(1)} secagens
            </div>
            <div className="font-semibold text-slate-900 dark:text-white mt-1">
              {formatCurrency(worstDay.avgRevenue)}
            </div>
          </div>
        </div>
      </div>

      {/* Self-Service Recommendation */}
      <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
          <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong className="text-slate-900 dark:text-white">Recomendação:</strong> Em {bestDay.dayName}, verifique máquinas antes do pico.
            Em {worstDay.dayName}, agende manutenção preventiva ou oferece promoções para aumentar fluxo.
          </span>
        </div>
      </div>
    </div>
  );
};

export default DayOfWeekChart;
