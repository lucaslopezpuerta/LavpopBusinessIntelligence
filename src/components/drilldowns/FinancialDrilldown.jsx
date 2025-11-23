// FinancialDrilldown.jsx v2.1 - FIXED & ROBUST
// ✅ Daily revenue and cycle tracking
// ✅ Uses shared parseSalesRecords for consistent date handling
// ✅ Gradient area chart
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import { parseSalesRecords } from '../../utils/transactionParser';
import { useTheme } from '../../contexts/ThemeContext';

const FinancialDrilldown = ({ salesData, metricType = 'revenue', onNavigate }) => {
    const { isDark } = useTheme();

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
        for (let i = 0; i <= 30; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const dateKey = d.toISOString().split('T')[0];
            dailyMap[dateKey] = { revenue: 0, cycles: 0 };
        }

        records.forEach(record => {
            if (record.date >= startDate && record.date <= today) {
                const dateKey = record.dateStr; // parseSalesRecords provides dateStr as YYYY-MM-DD

                if (dailyMap[dateKey]) {
                    dailyMap[dateKey].revenue += record.netValue;
                    dailyMap[dateKey].cycles += record.totalServices; // Count services (cycles)
                }
            }
        });

        return Object.keys(dailyMap).sort().map(dateKey => ({
            date: dateKey,
            revenue: Math.round(dailyMap[dateKey].revenue * 100) / 100,
            cycles: dailyMap[dateKey].cycles
        }));
    }, [salesData]);

    // Calculate totals and best day
    const stats = useMemo(() => {
        if (dailyData.length === 0) return { total: 0, bestDay: null, bestValue: 0 };

        const total = dailyData.reduce((sum, day) => sum + (metricType === 'revenue' ? day.revenue : day.cycles), 0);

        const best = dailyData.reduce((max, day) => {
            const currentVal = metricType === 'revenue' ? day.revenue : day.cycles;
            const maxVal = metricType === 'revenue' ? max.revenue : max.cycles;
            return currentVal > maxVal ? day : max;
        }, dailyData[0]);

        const bestVal = metricType === 'revenue' ? best.revenue : best.cycles;

        // Format best day date (YYYY-MM-DD -> DD/MM)
        const [year, month, day] = best.date.split('-');
        const bestDateFormatted = `${day}/${month}`;

        return {
            total,
            bestDay: bestDateFormatted,
            bestValue: bestVal
        };
    }, [dailyData, metricType]);

    const formatValue = (val) => {
        if (metricType === 'revenue') {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
        }
        return `${val} ciclos`;
    };

    // Chart data formatting
    const chartData = useMemo(() => {
        return dailyData.map(d => {
            const [year, month, day] = d.date.split('-');
            return {
                ...d,
                displayDate: `${day}/${month}`,
                value: metricType === 'revenue' ? d.revenue : d.cycles
            };
        });
    }, [dailyData, metricType]);

    const color = metricType === 'revenue' ? '#10b981' : '#3b82f6'; // Emerald vs Blue
    const gradientId = `gradient-${metricType}`;
    const isRevenue = metricType === 'revenue';

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total (30 dias)</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {formatValue(stats.total)}
                    </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Melhor Dia</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
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
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
                        <XAxis
                            dataKey="displayDate"
                            tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            hide={true}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: isDark ? '#1e293b' : '#fff',
                                borderColor: isDark ? '#334155' : '#e2e8f0',
                                borderRadius: '8px',
                                fontSize: '12px'
                            }}
                            formatter={(value) => [formatValue(value), isRevenue ? 'Receita' : 'Ciclos']}
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

            {/* Action */}
            <div className="flex justify-end">
                <button
                    onClick={onNavigate}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                    Ver Análise Completa
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default FinancialDrilldown;
