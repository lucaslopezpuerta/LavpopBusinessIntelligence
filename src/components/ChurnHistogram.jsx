// ChurnHistogram.jsx v2.0 - CONTACT STATUS + DYNAMIC INSIGHTS
// Time-to-churn distribution histogram with contact tracking integration
//
// CHANGELOG:
// v2.0 (2025-12-13): Contact status + dynamic insights
//   - NEW: contactedIds prop for contact tracking integration
//   - NEW: Dynamic peak detection (actual peak bin, not hardcoded)
//   - NEW: Contact status shown in insights (contacted vs not in danger zone)
//   - NEW: Revenue at risk calculation using customerSpending
//   - IMPROVED: Data-driven insights based on actual distribution
//   - IMPROVED: Memoized calculations for performance
// v1.2 (2025-11-29): Design System v3.0 compliance
//   - Removed emojis from insight text strings
// v1.1 (2025-11-24): Added actionable insights
//   - NEW: InsightBox with churn pattern analysis
// v1.0 (2025-11-23): Initial implementation

import React, { useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import InsightBox from './ui/InsightBox';

const ChurnHistogram = ({ data, contactedIds = new Set(), customerSpending = {} }) => {
    if (!data || data.length === 0) return null;

    // Memoize all calculations
    const stats = useMemo(() => {
        const total = data.reduce((sum, d) => sum + d.count, 0);

        // Check bins that represent 0-20 days (healthy)
        const healthy = data.filter(d => {
            const binStr = d.bin || '';
            return binStr === '0-10' || binStr === '10-20';
        }).reduce((sum, d) => sum + d.count, 0);
        const healthyPct = total > 0 ? Math.round((healthy / total) * 100) : 0;

        // Danger zone: bins with min >= 30
        const dangerBins = data.filter(d => d.min >= 30);
        const dangerCount = dangerBins.reduce((sum, d) => sum + d.count, 0);

        // Get customer IDs in danger zone
        const dangerCustomerIds = dangerBins.flatMap(d => d.customerIds || []);

        // Count contacted in danger zone
        const contactedInDanger = dangerCustomerIds.filter(id => contactedIds.has(String(id))).length;
        const notContactedInDanger = dangerCount - contactedInDanger;

        // Calculate revenue at risk in danger zone
        const revenueAtRisk = dangerCustomerIds.reduce((sum, id) => {
            return sum + (customerSpending[String(id)] || 0);
        }, 0);

        // Dynamic peak detection - find bin with highest count
        const peakBin = data.reduce((max, d) => d.count > max.count ? d : max, data[0]);

        return {
            total,
            healthy,
            healthyPct,
            dangerCount,
            contactedInDanger,
            notContactedInDanger,
            revenueAtRisk,
            peakBin
        };
    }, [data, contactedIds, customerSpending]);

    // Generate dynamic insights
    const insights = useMemo(() => {
        const result = [];

        // Health status
        if (stats.healthyPct >= 60) {
            result.push({ type: 'success', text: `${stats.healthyPct}% retornam em 0-20 dias (padrão saudável)` });
        } else if (stats.healthyPct > 0) {
            result.push({ type: 'warning', text: `Apenas ${stats.healthyPct}% retornam em 0-20 dias` });
        } else {
            result.push({ type: 'warning', text: 'Nenhum cliente com padrão de retorno < 20 dias' });
        }

        // Dynamic peak detection
        if (stats.peakBin && stats.peakBin.count > 0) {
            const peakLabel = stats.peakBin.min >= 30 ? '(zona crítica)' : '';
            result.push({
                type: stats.peakBin.min >= 30 ? 'warning' : 'info',
                text: `Pico em ${stats.peakBin.bin} dias ${peakLabel}`
            });
        }

        // Contact status in danger zone
        if (stats.notContactedInDanger > 0) {
            result.push({
                type: 'warning',
                text: `${stats.notContactedInDanger} clientes em zona de perigo sem contato`
            });
        }
        if (stats.contactedInDanger > 0) {
            result.push({
                type: 'info',
                text: `${stats.contactedInDanger} clientes em zona de perigo já contactados`
            });
        }

        // Revenue at risk
        if (stats.revenueAtRisk > 0) {
            const formattedRevenue = new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(stats.revenueAtRisk);
            result.push({ type: 'warning', text: `${formattedRevenue} em risco na zona de perigo` });
        }

        // Action item
        result.push({ type: 'action', text: 'Ação: Contatar clientes após 25 dias sem visitar' });

        return result;
    }, [stats]);

    // Memoized tooltip
    const CustomTooltip = useCallback(({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const binData = payload[0].payload;
            const binCustomerIds = binData.customerIds || [];
            const contactedCount = binCustomerIds.filter(id => contactedIds.has(String(id))).length;
            const notContactedCount = binData.count - contactedCount;

            return (
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl text-xs">
                    <p className="font-bold text-slate-800 dark:text-white mb-1">Intervalo: {label} dias</p>
                    <p className="text-slate-600 dark:text-slate-300">
                        <span className="font-bold text-lavpop-blue dark:text-blue-400 text-lg">{payload[0].value}</span> clientes
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 italic">
                        retornam geralmente neste período
                    </p>

                    {/* Contact status breakdown */}
                    {binData.count > 0 && contactedIds.size > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-blue-600 dark:text-blue-400">Contactados:</span>
                                <span className="font-bold text-blue-600 dark:text-blue-400">{contactedCount}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-500 dark:text-slate-400">Sem contato:</span>
                                <span className="font-bold text-slate-600 dark:text-slate-300">{notContactedCount}</span>
                            </div>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    }, [contactedIds]);

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

                {/* Contact status legend */}
                {contactedIds.size > 0 && stats.dangerCount > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px]">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm bg-red-500/60"></div>
                            <span className="text-slate-600 dark:text-slate-400">Zona de perigo</span>
                        </div>
                        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-300 dark:border-slate-600">
                            <span className="text-blue-600 dark:text-blue-400 font-medium">
                                {stats.contactedInDanger}/{stats.dangerCount} contactados
                            </span>
                        </div>
                    </div>
                )}
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
