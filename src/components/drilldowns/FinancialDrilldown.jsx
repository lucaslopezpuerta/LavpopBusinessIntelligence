// FinancialDrilldown.jsx v2.8 - UTILIZATION AVERAGE
// ✅ Daily revenue and cycle tracking
// ✅ Uses shared parseSalesRecords for consistent date handling
// ✅ Gradient area chart with centralized colors
// ✅ Separate wash/dry metric support
// ✅ MTD gross revenue tracking
// ✅ Daily utilization tracking
// ✅ Design System v3.3 compliant
//
// CHANGELOG:
// v2.8 (2025-12-22): Utilization shows average (not sum)
//   - FIXED: First card shows "Média 30 dias" for utilization (average, not sum)
//   - Hide redundant "Média Diária" card for utilization
//   - 2-column layout for utilization drilldown
// v2.7 (2025-12-22): Fixed utilization to show percentage
//   - FIXED: 'utilization' now shows daily utilization % (not machine-minutes)
//   - Uses BUSINESS_PARAMS for accurate capacity calculation
//   - Weighted average across washers and dryers
// v2.6 (2025-12-22): Added utilization metric type
//   - NEW: 'utilization' metricType shows daily utilization trend
//   - Calculates machine-minutes utilization per day
//   - Uses purple color scheme for utilization
// v2.5 (2025-12-22): Added MTD gross revenue metric type
//   - NEW: 'mtd' metricType shows gross revenue trend
//   - Tracks grossRevenue separately from netRevenue
//   - Uses amber color scheme for MTD
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
import { Calendar, TrendingUp, Award } from 'lucide-react';
import { parseSalesRecords } from '../../utils/transactionParser';
import { formatDate } from '../../utils/dateUtils';
import { useTheme } from '../../contexts/ThemeContext';
import { getChartColors, getSeriesColors } from '../../utils/chartColors';
import { BUSINESS_PARAMS } from '../../utils/operationsMetrics';
import KPICard, { KPIGrid } from '../ui/KPICard';

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
            dailyMap[dateKey] = { revenue: 0, grossRevenue: 0, cycles: 0, wash: 0, dry: 0 };
        }

        records.forEach(record => {
            if (record.date >= startDate && record.date <= today) {
                const dateKey = record.dateStr; // parseSalesRecords provides dateStr as YYYY-MM-DD

                if (dailyMap[dateKey]) {
                    dailyMap[dateKey].revenue += record.netValue;
                    dailyMap[dateKey].grossRevenue += record.grossValue || record.netValue;
                    dailyMap[dateKey].cycles += record.totalServices;
                    dailyMap[dateKey].wash += record.washCount || 0;
                    dailyMap[dateKey].dry += record.dryCount || 0;
                }
            }
        });

        // Calculate daily utilization % using business parameters
        const operatingHours = BUSINESS_PARAMS.OPERATING_HOURS.end - BUSINESS_PARAMS.OPERATING_HOURS.start;
        const minutesPerDay = operatingHours * 60;
        const efficiencyFactor = BUSINESS_PARAMS.EFFICIENCY_FACTOR;

        // Daily available minutes per machine type (with efficiency factor)
        const washerMinutesAvailable = BUSINESS_PARAMS.TOTAL_WASHERS * minutesPerDay * efficiencyFactor;
        const dryerMinutesAvailable = BUSINESS_PARAMS.TOTAL_DRYERS * minutesPerDay * efficiencyFactor;
        const totalMachines = BUSINESS_PARAMS.TOTAL_WASHERS + BUSINESS_PARAMS.TOTAL_DRYERS;

        return Object.keys(dailyMap).sort().map(dateKey => {
            const day = dailyMap[dateKey];

            // Calculate machine-minutes used
            const washerMinutesUsed = day.wash * BUSINESS_PARAMS.WASHER_CYCLE_MINUTES;
            const dryerMinutesUsed = day.dry * BUSINESS_PARAMS.DRYER_CYCLE_MINUTES;

            // Calculate weighted utilization %
            const washerUtil = washerMinutesAvailable > 0
                ? (washerMinutesUsed / washerMinutesAvailable) * 100 : 0;
            const dryerUtil = dryerMinutesAvailable > 0
                ? (dryerMinutesUsed / dryerMinutesAvailable) * 100 : 0;

            // Weighted average by machine count
            const utilization = (
                (washerUtil * BUSINESS_PARAMS.TOTAL_WASHERS) +
                (dryerUtil * BUSINESS_PARAMS.TOTAL_DRYERS)
            ) / totalMachines;

            return {
                date: dateKey,
                revenue: Math.round(day.revenue * 100) / 100,
                grossRevenue: Math.round(day.grossRevenue * 100) / 100,
                cycles: day.cycles,
                wash: day.wash,
                dry: day.dry,
                utilization: Math.round(utilization * 10) / 10 // 1 decimal place
            };
        });
    }, [salesData]);

    // Helper to get value based on metric type
    const getMetricValue = (day) => {
        switch (metricType) {
            case 'revenue': return day.revenue;
            case 'mtd': return day.grossRevenue; // MTD shows gross revenue
            case 'utilization': return day.utilization; // Daily utilization %
            case 'wash': return day.wash;
            case 'dry': return day.dry;
            case 'cycles':
            default: return day.cycles;
        }
    };

    // Calculate totals, average, and best day
    const stats = useMemo(() => {
        if (dailyData.length === 0) return { total: 0, average: 0, bestDay: null, bestValue: 0 };

        const sum = dailyData.reduce((acc, day) => acc + getMetricValue(day), 0);
        const average = dailyData.length > 0 ? sum / dailyData.length : 0;

        // For utilization %, "total" should be average (summing % doesn't make sense)
        const total = metricType === 'utilization' ? average : sum;

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
    // wash/dry use explicit colors to match SecondaryKPICard header icons
    const metricConfig = useMemo(() => ({
        revenue: { label: 'Receita Líquida', unit: '', color: seriesColors[1] },      // Emerald/green
        mtd: { label: 'Receita Bruta', unit: '', color: seriesColors[3] },            // Amber for MTD
        cycles: { label: 'Ciclos', unit: ' ciclos', color: seriesColors[0] },         // Primary blue
        utilization: { label: 'Utilização', unit: '%', color: seriesColors[2] },      // Purple/violet
        wash: { label: 'Lavagens', unit: ' lavagens', color: isDark ? '#22d3ee' : '#06b6d4' },  // Cyan (matches header)
        dry: { label: 'Secagens', unit: ' secagens', color: isDark ? '#fb923c' : '#f97316' },   // Orange (matches header)
    }), [seriesColors, isDark]);

    const config = metricConfig[metricType] || metricConfig.cycles;

    const formatValue = (val) => {
        if (metricType === 'revenue' || metricType === 'mtd') {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
        }
        if (metricType === 'utilization') {
            // Format as percentage with 1 decimal place
            return `${val.toFixed(1)}%`;
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

    // Map metricType to KPICard semantic color
    // Uses semantic color keys from colorMapping.js (revenue, warning, blue, purple, cyan, orange, etc.)
    const colorMapping = {
        revenue: 'revenue',      // emerald - net revenue
        mtd: 'warning',          // amber - gross revenue MTD
        cycles: 'blue',          // blue - cycle count
        utilization: 'purple',   // purple - utilization %
        wash: 'cyan',            // cyan - wash cycles (matches SecondaryKPICard)
        dry: 'orange',           // orange - dry cycles (matches SecondaryKPICard)
    };
    const cardColor = colorMapping[metricType] || 'blue';

    return (
        <div className="space-y-6">
            {/* Summary Stats - using KPICard components */}
            <KPIGrid columns={metricType === 'utilization' ? 2 : 3} animate={false}>
                <KPICard
                    label={metricType === 'utilization' ? 'Média 30 dias' : 'Últimos 30 dias'}
                    value={formatValue(stats.total)}
                    icon={Calendar}
                    color={cardColor}
                    variant="compact"
                />
                {/* Hide "Média Diária" for utilization since it's the same as "Média 30 dias" */}
                {metricType !== 'utilization' && (
                    <KPICard
                        label="Média Diária"
                        value={formatValue(Math.round(stats.average * 10) / 10)}
                        icon={TrendingUp}
                        color={cardColor}
                        variant="compact"
                    />
                )}
                <KPICard
                    label="Melhor Dia"
                    value={stats.bestValue > 0 ? formatValue(stats.bestValue) : '-'}
                    subtitle={stats.bestDay && stats.bestValue > 0 ? stats.bestDay : undefined}
                    icon={Award}
                    color={cardColor}
                    variant="compact"
                />
            </KPIGrid>

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
