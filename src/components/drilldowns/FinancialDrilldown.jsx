import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import { getDailyRevenue } from '../../utils/businessMetrics';
import { useTheme } from '../../contexts/ThemeContext';

const FinancialDrilldown = ({ salesData, metricType = 'revenue', onNavigate }) => {
    const { isDark } = useTheme();

    // Get daily data using shared utility
    const dailyData = useMemo(() => {
        if (!salesData || salesData.length === 0) return [];
        // getDailyRevenue returns { date: 'YYYY-MM-DD', revenue: number }
        // We need to adapt it if metricType is 'cycles' or just use it for revenue

        if (metricType === 'revenue') {
            return getDailyRevenue(salesData, 30);
        } else {
            // Custom logic for cycles if getDailyRevenue doesn't support it (it seems it only does revenue)
            // Let's implement a simple cycle counter here similar to getDailyRevenue structure
            const today = new Date();
            const startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 30);

            const dailyMap = {};

            // Initialize map
            for (let i = 0; i <= 30; i++) {
                const d = new Date(startDate);
                d.setDate(d.getDate() + i);
                const dateKey = d.toISOString().split('T')[0];
                dailyMap[dateKey] = 0;
            }

            salesData.forEach(row => {
                const dateStr = row.Data || row.Data_Hora || row.date;
                if (!dateStr) return;

                // Parse date (assuming ISO or BR format handled by a helper, but here we need to be careful)
                // If salesData comes from CSV, it might be DD/MM/YYYY. 
                // Let's assume standard parsing for now or use the same logic as getDailyRevenue
                // Actually, getDailyRevenue uses parseSalesRecords internally.
                // We should probably expose a getDailyCycles function in businessMetrics.js or just do it here.

                // For now, let's rely on the fact that we can just count rows if we parse them correctly.
                // But to be safe and consistent with "math utils", we should probably add getDailyCycles to businessMetrics.js
                // However, I cannot edit businessMetrics.js easily right now without context.
                // Let's use the same logic as getDailyRevenue but count items.

                // ... actually, let's just implement the cycle counting here carefully.
                let date;
                if (dateStr.includes('/')) {
                    const [d, m, y] = dateStr.split('/');
                    date = new Date(y, m - 1, d);
                } else {
                    date = new Date(dateStr);
                }

                if (date >= startDate && date <= today) {
                    const dateKey = date.toISOString().split('T')[0];
                    if (dailyMap[dateKey] !== undefined) {
                        dailyMap[dateKey] += 1;
                    }
                }
            });

            return Object.keys(dailyMap).sort().map(dateKey => ({
                date: dateKey,
                revenue: dailyMap[dateKey] // We use 'revenue' key to keep chart compatible or map it
            }));
        }
    }, [salesData, metricType]);

    // Calculate totals and best day
    const stats = useMemo(() => {
        if (dailyData.length === 0) return { total: 0, bestDay: null, bestValue: 0 };

        const total = dailyData.reduce((sum, day) => sum + day.revenue, 0);

        const best = dailyData.reduce((max, day) =>
            day.revenue > max.revenue ? day : max
            , dailyData[0]);

        // Format best day date (YYYY-MM-DD -> DD/MM)
        const [year, month, day] = best.date.split('-');
        const bestDateFormatted = `${day}/${month}`;

        return {
            total,
            bestDay: bestDateFormatted,
            bestValue: best.revenue
        };
    }, [dailyData]);

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
                value: d.revenue
            };
        });
    }, [dailyData]);

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
