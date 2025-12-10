// FinancialDrilldown.jsx v2.4 - SERVICE BREAKDOWN
// ✅ Daily revenue and cycle tracking
// ✅ Uses shared parseSalesRecords for consistent date handling
// ✅ Gradient area chart with centralized colors
// ✅ Separate wash/dry metric support
// ✅ Design System v3.1 compliant
//
// CHANGELOG:
// v2.4 (2025-12-10): Fixed date key mismatch (UTC vs local timezone)
//   - Changed dailyMap initialization from toISOString() to formatDate()
//   - Ensures consistent local timezone keys matching record.dateStr
// v2.3 (2025-12-01): Design System compliance
//   - Added Média Diária (daily average) card
//   - Changed to 3-column grid layout
//   - Using centralized getChartColors/getSeriesColors
//   - Fixed font size 10 → 12, border colors
//   - Removed navigation button
// v2.2 (2025-12-01): Added wash/dry metric types
//   - Now tracks washCount and dryCount separately
//   - metricType can be 'revenue', 'cycles', 'wash', or 'dry'
//   - Each metric type has distinct color and label
// v2.1: Fixed & Robust implementation
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { parseSalesRecords } from '../../utils/transactionParser';
import { formatDate } from '../../utils/dateUtils';
import { useTheme } from '../../contexts/ThemeContext';
import { getChartColors, getSeriesColors } from '../../utils/chartColors';

const FinancialDrilldown = ({ salesData, metricType = 'revenue' }) => {
    const { isDark } = useTheme();
    const chartColors = getChartColors(isDark);
    const seriesColors = getSeriesColors(isDark);

    // Get daily data using shared utility
    const dailyData = useMemo(() => {
        if (!salesData || salesData.length === 0) return [];

        // Use shared parser for consistent date handling
        const records = parseSalesRecords(salesData);
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);

        const dailyMap = {};

        // Initialize map for last 30 days
        // Use formatDate for consistent LOCAL timezone keys (matches record.dateStr)
        for (let i = 0; i <= 30; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const dateKey = formatDate(d); // LOCAL timezone: YYYY-MM-DD
            dailyMap[dateKey] = { revenue: 0, cycles: 0, wash: 0, dry: 0 };
        }

        records.forEach(record => {
            if (record.date >= startDate && record.date <= today) {
                const dateKey = record.dateStr; // parseSalesRecords provides dateStr as YYYY-MM-DD

                if (dailyMap[dateKey]) {
                    dailyMap[dateKey].revenue += record.netValue;
                    dailyMap[dateKey].cycles += record.totalServices;
                    dailyMap[dateKey].wash += record.washCount || 0;
                    dailyMap[dateKey].dry += record.dryCount || 0;
                }
            }
        });

        return Object.keys(dailyMap).sort().map(dateKey => ({
            date: dateKey,
            revenue: Math.round(dailyMap[dateKey].revenue * 100) / 100,
            cycles: dailyMap[dateKey].cycles,
            wash: dailyMap[dateKey].wash,
            dry: dailyMap[dateKey].dry
        }));
    }, [salesData]);

    // Helper to get value based on metric type
    const getMetricValue = (day) => {
        switch (metricType) {
            case 'revenue': return day.revenue;
            case 'wash': return day.wash;
            case 'dry': return day.dry;
            case 'cycles':
            default: return day.cycles;
        }
    };

    // Calculate totals, average, and best day
    const stats = useMemo(() => {
        if (dailyData.length === 0) return { total: 0, average: 0, bestDay: null, bestValue: 0 };

        const total = dailyData.reduce((sum, day) => sum + getMetricValue(day), 0);
        const average = dailyData.length > 0 ? total / dailyData.length : 0;

        const best = dailyData.reduce((max, day) => {
            return getMetricValue(day) > getMetricValue(max) ? day : max;
        }, dailyData[0]);

        const bestVal = getMetricValue(best);

        // Format best day date (YYYY-MM-DD -> DD/MM)
        const [year, month, day] = best.date.split('-');
        const bestDateFormatted = `${day}/${month}`;

        return {
            total,
            average,
            bestDay: bestDateFormatted,
            bestValue: bestVal
        };
    }, [dailyData, metricType]);

    // Metric configuration using centralized colors
    const metricConfig = useMemo(() => ({
        revenue: { label: 'Receita', unit: '', color: seriesColors[1] },      // Emerald/green
        cycles: { label: 'Ciclos', unit: ' ciclos', color: seriesColors[0] }, // Primary blue
        wash: { label: 'Lavagens', unit: ' lavagens', color: seriesColors[5] }, // Cyan
        dry: { label: 'Secagens', unit: ' secagens', color: seriesColors[3] },  // Amber
    }), [seriesColors]);

    const config = metricConfig[metricType] || metricConfig.cycles;

    const formatValue = (val) => {
        if (metricType === 'revenue') {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
        }
        return `${val}${config.unit}`;
    };

    // Chart data formatting
    const chartData = useMemo(() => {
        return dailyData.map(d => {
            const [year, month, day] = d.date.split('-');
            return {
                ...d,
                displayDate: `${day}/${month}`,
                value: getMetricValue(d)
            };
        });
    }, [dailyData, metricType]);

    const color = config.color;
    const gradientId = `gradient-${metricType}`;

    return (
        <div className="space-y-6">
            {/* Summary Stats - responsive grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-slate-700/50 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Últimos 30 dias</p>
                    <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                        {formatValue(stats.total)}
                    </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Média Diária</p>
                    <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                        {formatValue(Math.round(stats.average * 10) / 10)}
                    </p>
                </div>
                <div className="col-span-2 sm:col-span-1 bg-slate-50 dark:bg-slate-700/50 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Melhor Dia</p>
                    <div className="flex items-baseline gap-1">
                        <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                            {stats.bestValue > 0 ? formatValue(stats.bestValue) : '-'}
                        </p>
                        {stats.bestDay && stats.bestValue > 0 && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                ({stats.bestDay})
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="h-48 sm:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.axis} vertical={false} />
                        <XAxis
                            dataKey="displayDate"
                            tick={{ fontSize: 12, fill: chartColors.tickText }}
                            axisLine={false}
                            tickLine={false}
                            interval="preserveStartEnd"
                            minTickGap={20}
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
                            labelFormatter={(label) => `Dia ${label}`}
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

export default FinancialDrilldown;
