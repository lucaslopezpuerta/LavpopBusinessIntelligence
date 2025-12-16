// CustomerTrendDrilldown.jsx v1.3
// Customer acquisition and activity trend visualization
// Shows weekly trends for new and active customers
//
// CHANGELOG:
// v1.3 (2025-12-16): Fixed chart colors to match card colors
//   - FIXED: newClients now uses seriesColors[2] (violet) instead of [4] (red)
//   - Purple card → purple chart, blue card → blue chart
// v1.2 (2025-12-16): Subtitle moved to modal header
//   - REMOVED: Inline subtitle (now passed to KPIDetailModal)
//   - Component is now pure chart + stats
// v1.1 (2025-12-16): UI cleanup
//   - REMOVED: Bottom insight banner
//   - Cleaner, more compact design
// v1.0 (2025-12-16): Initial implementation
//   - Weekly trend chart for customer metrics
//   - Supports newClients and activeClients metric types
//   - Design System v3.2 compliant

import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { getChartColors, getSeriesColors } from '../../utils/chartColors';

const CustomerTrendDrilldown = ({ customers, metricType = 'newClients' }) => {
  const { isDark } = useTheme();
  const chartColors = getChartColors(isDark);
  const seriesColors = getSeriesColors(isDark);

  // Generate weekly data for customer metrics
  const weeklyData = useMemo(() => {
    if (!customers || customers.length === 0) return [];

    const weeks = [];
    const today = new Date();

    // Generate last 8 weeks of data
    for (let i = 7; i >= 0; i--) {
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      weekEnd.setHours(23, 59, 59, 999);

      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      let value = 0;

      if (metricType === 'newClients') {
        // Count customers whose first visit is in this week
        value = customers.filter(c => {
          if (!c.firstVisit) return false;
          return c.firstVisit >= weekStart && c.firstVisit <= weekEnd;
        }).length;
      } else if (metricType === 'activeClients') {
        // Count customers who were active (not lost) as of this week's end
        // For historical approximation, use customers who had visited by that date
        value = customers.filter(c => {
          if (!c.firstVisit) return false;
          // Customer existed by this week's end
          if (c.firstVisit > weekEnd) return false;
          // If they have a last visit, check they weren't churned by then
          // (Approximation: show current count for recent weeks)
          if (i <= 2) return c.riskLevel !== 'Lost';
          return true;
        }).length;
      }

      // Format week label
      const weekLabel = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;

      weeks.push({
        week: weekLabel,
        value,
        weekStart,
        weekEnd
      });
    }

    return weeks;
  }, [customers, metricType]);

  // Calculate stats
  const stats = useMemo(() => {
    if (weeklyData.length === 0) return { current: 0, average: 0, trend: 0 };

    const current = weeklyData[weeklyData.length - 1]?.value || 0;
    const previous = weeklyData[weeklyData.length - 2]?.value || 0;
    const total = weeklyData.reduce((sum, w) => sum + w.value, 0);
    const average = total / weeklyData.length;
    const trend = previous > 0 ? ((current - previous) / previous * 100) : 0;

    return { current, average, trend };
  }, [weeklyData]);

  // Metric configuration
  // Colors matched to SecondaryKPICard gradients:
  // - purple card → seriesColors[2] (violet-500 #8b5cf6)
  // - blue card → seriesColors[0] (lavpop-blue #1a5a8e / blue-500 #3b82f6)
  const metricConfig = useMemo(() => ({
    newClients: {
      label: 'Novos Clientes',
      unit: ' clientes',
      color: seriesColors[2], // Violet (matches purple card)
      statLabel: 'Esta semana'
    },
    activeClients: {
      label: 'Clientes Ativos',
      unit: ' clientes',
      color: seriesColors[0], // Blue (matches blue card)
      statLabel: 'Atualmente'
    }
  }), [seriesColors]);

  const config = metricConfig[metricType] || metricConfig.newClients;
  const color = config.color;
  const gradientId = `customer-gradient-${metricType}`;

  const formatValue = (val) => `${val}${config.unit}`;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-slate-50 dark:bg-slate-700/50 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{config.statLabel}</p>
          <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            {stats.current}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700/50 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Média Semanal</p>
          <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            {Math.round(stats.average * 10) / 10}
          </p>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-slate-50 dark:bg-slate-700/50 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">vs Semana Anterior</p>
          <div className="flex items-baseline gap-1">
            <p className={`text-lg sm:text-xl font-bold ${stats.trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {stats.trend >= 0 ? '+' : ''}{Math.round(stats.trend)}%
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 sm:h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={weeklyData}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.axis} vertical={false} />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 12, fill: chartColors.tickText }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide={true} />
            <Tooltip
              contentStyle={{
                backgroundColor: chartColors.tooltipBg,
                borderColor: chartColors.tooltipBorder,
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value) => [formatValue(value), config.label]}
              labelFormatter={(label) => `Semana de ${label}`}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

export default CustomerTrendDrilldown;
