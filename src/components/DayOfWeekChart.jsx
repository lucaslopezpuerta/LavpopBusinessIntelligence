// DayOfWeekChart Component v3.6.0
// Day-of-week utilization patterns with dual-axis chart
//
// CHANGELOG:
// v3.6.0 (2026-01-23): Premium Glass summary cards
//   - Redesigned Best/Worst day cards with glass morphism
//   - Icon badges (TrendingUp/TrendingDown) for visual clarity
//   - Hero metric (utilization %) with improved hierarchy
//   - Compact stats row with icons for services + revenue
//   - Theme-aware glow effects (emerald/red subtle shadows)
// v3.5.0 (2026-01-23): UX optimization + Premium Glass styling
//   - Upgraded to Premium Glass card (matches ChurnHistogram v4.1)
//   - Header icon badge: cyan bg with white icon
//   - Removed left border stripe (accent via icon badge)
//   - Consistent bar colors using threshold-based getColor()
//   - Responsive chart height (mobile: 240px, desktop: 280px)
//   - Loading skeleton animation
//   - Added framer-motion for card hover effects
// v3.4.0 (2026-01-23): Cosmic Design System v5.1 alignment
//   - Fixed dark mode: bg-slate-800 → bg-space-dust, border-slate-700 → border-stellar-cyan/10
//   - Added useTheme hook for theme-aware chart colors
// v3.3.0 (2025-11-30): Visual polish
//   - Bar colors now highlight best (green) and worst (red) days
//   - Fixed Y-axis formatter: shows "R$ 353" for values < 1000, "R$ 1.4k" for >= 1000
// v3.2.0 (2025-11-30): Design System audit fixes + threshold unification
//   - Imported DAILY_THRESHOLDS from operationsMetrics.js (single source of truth)
//   - Fixed fontSize: 11 → 12 in all Recharts configs (Design System minimum)
//   - Fixed text-[10px] → text-xs in summary cards
//   - Fixed mobile padding: p-6 → px-3 py-4 sm:p-6
//   - Removed redundant insight box (summary cards already show best/worst days)
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
// v1.0 (Previous): Initial implementation with local period control

import React, { useMemo, useCallback } from 'react';
import { ComposedChart, Bar, Cell, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar, Droplet, Flame, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { DAILY_THRESHOLDS } from '../utils/operationsMetrics';
import { useTheme } from '../contexts/ThemeContext';
import { useMediaQuery } from '../hooks/useMediaQuery';

// Pure function using unified DAILY_THRESHOLDS
const getColor = (utilization) => {
  if (utilization >= DAILY_THRESHOLDS.excellent) return '#10b981'; // emerald-500
  if (utilization >= DAILY_THRESHOLDS.good) return '#1a5a8e'; // lavpop-blue
  if (utilization >= DAILY_THRESHOLDS.fair) return '#f59e0b'; // amber-500
  return '#dc2626'; // red-600
};

const DayOfWeekChart = ({ dayPatterns, dateFilter = 'currentWeek', dateWindow }) => {
  const { isDark } = useTheme();
  const isMobile = useMediaQuery('(max-width: 640px)');

  // Theme-aware chart colors
  const chartColors = useMemo(() => ({
    grid: isDark ? '#1e293b' : '#e5e7eb',
    axis: isDark ? '#94a3b8' : '#6b7280',
    axisLine: isDark ? '#334155' : '#e5e7eb',
  }), [isDark]);

  // Responsive chart height
  const chartHeight = isMobile ? 240 : 280;

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
        <div className="bg-white dark:bg-space-dust p-4 rounded-lg border border-slate-200 dark:border-stellar-cyan/10 shadow-xl min-w-[200px]">
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
      <div
        className={`
          ${isDark ? 'bg-space-dust/40' : 'bg-white/80'}
          backdrop-blur-xl rounded-2xl p-5
          ${isDark
            ? 'ring-1 ring-white/[0.05] shadow-[0_0_20px_-5px_rgba(103,232,249,0.15),inset_0_1px_1px_rgba(255,255,255,0.10)]'
            : 'ring-1 ring-slate-200/80 shadow-[0_8px_32px_-12px_rgba(100,116,139,0.15),inset_0_1px_0_rgba(255,255,255,0.8)]'
          }
          overflow-hidden h-full flex flex-col
        `}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500 dark:bg-cyan-600 flex items-center justify-center shadow-sm shrink-0">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              Utilização por Dia da Semana
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Carregando dados...
            </p>
          </div>
        </div>
        <div className="flex-1 min-h-[240px] animate-pulse">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4"></div>
          <div className="flex items-end justify-between gap-2 h-[200px] px-4">
            {[65, 80, 45, 90, 70, 55, 85].map((height, i) => (
              <div
                key={i}
                className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-t"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        ${isDark ? 'bg-space-dust/40' : 'bg-white/80'}
        backdrop-blur-xl rounded-2xl p-5
        ${isDark
          ? 'ring-1 ring-white/[0.05] shadow-[0_0_20px_-5px_rgba(103,232,249,0.15),inset_0_1px_1px_rgba(255,255,255,0.10)]'
          : 'ring-1 ring-slate-200/80 shadow-[0_8px_32px_-12px_rgba(100,116,139,0.15),inset_0_1px_0_rgba(255,255,255,0.8)]'
        }
        overflow-hidden h-full flex flex-col
      `}
    >
      {/* Header with Icon Badge */}
      <div className="mb-4">
        <div className="flex items-start gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-cyan-500 dark:bg-cyan-600 flex items-center justify-center shadow-sm shrink-0">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              Utilização por Dia da Semana
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Período: {dateWindow?.dateRange || 'Carregando...'}
            </p>
          </div>
        </div>
      </div>

      {/* Dual-Axis Chart: Revenue (bars) + Utilization (line) */}
      <div className="flex-1 min-h-[240px] mb-4">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: chartColors.axis, fontWeight: 600 }}
              axisLine={{ stroke: chartColors.axisLine }}
            />
            {/* Left Y-Axis: Revenue */}
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12, fill: chartColors.axis }}
              axisLine={{ stroke: chartColors.axisLine }}
              tickFormatter={(value) => value >= 1000 ? `R$ ${(value / 1000).toFixed(1)}k` : `R$ ${Math.round(value)}`}
              label={{
                value: 'Receita (R$)',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 12, fill: chartColors.axis }
              }}
            />
            {/* Right Y-Axis: Utilization */}
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: chartColors.axis }}
              axisLine={{ stroke: chartColors.axisLine }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              label={{
                value: 'Utilização (%)',
                angle: 90,
                position: 'insideRight',
                style: { fontSize: 12, fill: chartColors.axis }
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
              radius={[8, 8, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="utilization"
              name="Utilização (%)"
              stroke={isDark ? '#22d3ee' : '#0891b2'}
              strokeWidth={isMobile ? 2 : 3}
              dot={{ r: isMobile ? 4 : 5, fill: isDark ? '#22d3ee' : '#0891b2' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats - Premium Glass Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Best Day */}
        <div className={`
          p-4 rounded-xl
          ${isDark ? 'bg-emerald-950/30' : 'bg-emerald-50/80'}
          backdrop-blur-sm
          ${isDark
            ? 'ring-1 ring-emerald-500/20 shadow-[0_0_15px_-3px_rgba(16,185,129,0.15)]'
            : 'ring-1 ring-emerald-200 shadow-sm'
          }
        `}>
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500 dark:bg-emerald-600 flex items-center justify-center shadow-sm">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                Melhor Dia
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-white truncate">
                {bestDay.dayName}
              </p>
            </div>
          </div>

          {/* Hero Metric */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {bestDay.totalUtilization.toFixed(0)}%
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-400">utilização</span>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Droplet className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">{bestDay.avgWash.toFixed(0)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">{bestDay.avgDry.toFixed(0)}</span>
            </div>
            <div className="ml-auto text-base font-bold text-emerald-700 dark:text-emerald-300">
              {formatCurrency(bestDay.avgRevenue)}
            </div>
          </div>
        </div>

        {/* Worst Day */}
        <div className={`
          p-4 rounded-xl
          ${isDark ? 'bg-red-950/30' : 'bg-red-50/80'}
          backdrop-blur-sm
          ${isDark
            ? 'ring-1 ring-red-500/20 shadow-[0_0_15px_-3px_rgba(239,68,68,0.15)]'
            : 'ring-1 ring-red-200 shadow-sm'
          }
        `}>
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-red-500 dark:bg-red-600 flex items-center justify-center shadow-sm">
              <TrendingDown className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-red-700 dark:text-red-300 uppercase tracking-wide">
                Menor Movimento
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-white truncate">
                {worstDay.dayName}
              </p>
            </div>
          </div>

          {/* Hero Metric */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">
              {worstDay.totalUtilization.toFixed(0)}%
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-400">utilização</span>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Droplet className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">{worstDay.avgWash.toFixed(0)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">{worstDay.avgDry.toFixed(0)}</span>
            </div>
            <div className="ml-auto text-base font-bold text-red-700 dark:text-red-300">
              {formatCurrency(worstDay.avgRevenue)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayOfWeekChart;
