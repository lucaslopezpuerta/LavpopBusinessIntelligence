import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import { parseBrDate } from '../../utils/dateUtils';
import { useTheme } from '../../contexts/ThemeContext';

const FinancialDrilldown = ({ salesData, metricType = 'revenue', onNavigate }) => {
    const { isDark } = useTheme();

    const { chartData, bestDay, totalValue } = useMemo(() => {
        if (!salesData || salesData.length === 0) return { chartData: [], bestDay: null, totalValue: 0 };

        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const dailyMap = {};
        let maxVal = 0;
        let best = null;
        let total = 0;

        salesData.forEach(row => {
            const date = parseBrDate(row.Data || row.Data_Hora || row.date || '');
            if (!date) return;

            if (date >= thirtyDaysAgo && date <= now) {
                const dateStr = date.toISOString().split('T')[0];

                if (!dailyMap[dateStr]) {
                    dailyMap[dateStr] = {
                        date: date,
                        dateStr: dateStr,
                        value: 0
                    };
                }

                let val = 0;
                if (metricType === 'revenue') {
                    // Net Revenue logic
                    let gross = parseFloat(String(row.Valor_Venda || row.gross_value || 0).replace(',', '.')) || 0;
                    let net = parseFloat(String(row.Valor_Pago || row.net_value || 0).replace(',', '.')) || 0;

                    // Cashback logic (simplified for drilldown)
                    if (date >= new Date(2024, 5, 1)) {
                        net = net - (gross * 0.075);
                    }
                    val = net;
                } else {
                    // Cycles logic
                    const machines = String(row.Maquina || row.machine || row.Maquinas || '').toLowerCase();
                    if (machines.includes('lavadora')) val++;
                    if (machines.includes('secadora')) val++;
                }

                dailyMap[dateStr].value += val;
                total += val;
            }
        });

        const data = Object.values(dailyMap)
            .sort((a, b) => a.date - b.date)
            .map(d => {
                if (d.value > maxVal) {
                    maxVal = d.value;
                    best = d;
                }
                return {
                    ...d,
                    day: d.date.getDate(),
                    month: d.date.getMonth() + 1,
                    displayDate: `${d.date.getDate()}/${d.date.getMonth() + 1}`
                };
            });

        return { chartData: data, bestDay: best, totalValue: total };
    }, [salesData, metricType]);

    const formatValue = (val) => {
        if (metricType === 'revenue') {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
        }
        return `${val} ciclos`;
    };

    const color = metricType === 'revenue' ? '#10b981' : '#3b82f6'; // Emerald vs Blue
    const gradientId = `gradient-${metricType}`;

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total (30 dias)</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {formatValue(totalValue)}
                    </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Melhor Dia</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {bestDay ? formatValue(bestDay.value) : '-'}
                        </p>
                        {bestDay && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                ({bestDay.date.getDate()}/{bestDay.date.getMonth() + 1})
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
                            formatter={(value) => [formatValue(value), metricType === 'revenue' ? 'Receita' : 'Ciclos']}
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
