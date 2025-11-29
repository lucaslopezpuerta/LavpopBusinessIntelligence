// ChurnHistogram.jsx v1.2 - DANGER ZONE WITH INSIGHTS
// Time-to-churn distribution histogram
//
// CHANGELOG:
// v1.2 (2025-11-29): Design System v3.0 compliance
//   - Removed emojis from insight text strings
// v1.1 (2025-11-24): Added actionable insights
//   - NEW: InsightBox with churn pattern analysis
// v1.0 (2025-11-23): Initial implementation

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import InsightBox from './InsightBox';

const ChurnHistogram = ({ data }) => {
    if (!data || data.length === 0) return null;

    // Generate insights - ✅ FIXED: Use correct data property
    const total = data.reduce((sum, d) => sum + d.count, 0);
    // Check bins that represent 0-20 days (0-10 and 10-20)
    const healthy = data.filter(d => {
        const binStr = d.bin || '';
        return binStr === '0-10' || binStr === '10-20';
    }).reduce((sum, d) => sum + d.count, 0);
    const healthyPct = total > 0 ? Math.round((healthy / total) * 100) : 0;

    const insights = [];
    if (healthyPct >= 60) {
        insights.push({ type: 'success', text: `${healthyPct}% retornam em 0-20 dias (padrão saudável)` });
    } else if (healthyPct > 0) {
        insights.push({ type: 'warning', text: `Apenas ${healthyPct}% retornam em 0-20 dias` });
    } else {
        insights.push({ type: 'warning', text: `Apenas 0% retornam em 0-20 dias` });
    }
    insights.push({ type: 'warning', text: 'Pico em 30 dias = ponto crítico de abandono' });
    insights.push({ type: 'action', text: 'Ação: Contatar clientes após 25 dias sem visitar' });

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl text-xs">
                    <p className="font-bold text-slate-800 dark:text-white mb-1">Intervalo: {label} dias</p>
                    <p className="text-slate-600 dark:text-slate-300">
                        <span className="font-bold text-lavpop-blue dark:text-blue-400 text-lg">{payload[0].value}</span> clientes
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 italic">
                        retornam geralmente neste período
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 border border-white/20 dark:border-slate-700/50 shadow-sm h-full flex flex-col">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Zona de Perigo (Churn)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Distribuição do tempo de retorno. A maioria dos clientes volta em <span className="font-bold text-slate-700 dark:text-slate-300">0-20 dias</span>.
                    <br />
                    Após <span className="font-bold text-red-500">30 dias</span>, a chance de retorno cai drasticamente.
                </p>
            </div>

            <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                            dataKey="bin"
                            stroke="#94a3b8"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={
                                        entry.min < 20 ? '#10b981' : // Safe (Green)
                                            entry.min < 30 ? '#f59e0b' : // Warning (Amber)
                                                '#ef4444' // Danger (Red)
                                    }
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <InsightBox insights={insights} />
        </div>
    );
};

export default ChurnHistogram;
