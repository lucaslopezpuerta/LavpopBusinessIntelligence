// ChurnHistogram.jsx v2.1 - INTERACTIVE INSIGHTS + BAR CLICKS
// Time-to-churn distribution histogram with contact tracking integration
//
// CHANGELOG:
// v2.1 (2025-12-15): Interactive insights + bar clicks
//   - REFACTORED: Reduced insights from 6 to 2 (primary clickable, secondary info)
//   - NEW: Click bar → opens modal with NON-CONTACTED customers in that bin
//   - NEW: Click insight → opens modal with danger zone customers
//   - NEW: onOpenCustomerProfile and onCreateCampaign props
// v2.0 (2025-12-13): Contact status + dynamic insights
//   - NEW: contactedIds prop for contact tracking integration
//   - NEW: Dynamic peak detection (actual peak bin, not hardcoded)
//   - NEW: Contact status shown in insights (contacted vs not in danger zone)
//   - NEW: Revenue at risk calculation using customerSpending
//   - IMPROVED: Data-driven insights based on actual distribution
// v1.2 (2025-11-29): Design System v3.0 compliance
// v1.1 (2025-11-24): Added actionable insights
// v1.0 (2025-11-23): Initial implementation

import React, { useMemo, useCallback, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertCircle } from 'lucide-react';
import InsightBox from './ui/InsightBox';
import CustomerSegmentModal from './modals/CustomerSegmentModal';

const ChurnHistogram = ({
    data,
    contactedIds = new Set(),
    customerSpending = {},
    customerMap = {},
    onOpenCustomerProfile,
    onMarkContacted,
    onCreateCampaign
}) => {
    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalData, setModalData] = useState({ title: '', customers: [], audienceType: 'atRisk', color: 'red' });

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
            peakBin,
            dangerCustomerIds
        };
    }, [data, contactedIds, customerSpending]);

    // Helper to convert customer IDs to customer objects
    const getCustomersFromIds = useCallback((customerIds) => {
        return customerIds
            .map(id => customerMap[String(id)] || { id, name: `Cliente ${String(id).slice(-4)}` })
            .filter(Boolean);
    }, [customerMap]);

    // Click handler for bar - shows NON-CONTACTED customers in that bin
    const handleBarClick = useCallback((binData) => {
        if (!binData || !binData.customerIds) return;

        // Filter to non-contacted customers only
        const notContactedIds = binData.customerIds.filter(id => !contactedIds.has(String(id)));
        const customers = getCustomersFromIds(notContactedIds);

        if (customers.length === 0) return;

        setModalData({
            title: `Clientes: ${binData.bin} dias`,
            subtitle: `${customers.length} clientes sem contato`,
            customers,
            audienceType: 'atRisk',
            color: binData.min >= 30 ? 'red' : binData.min >= 20 ? 'amber' : 'green',
            icon: AlertCircle
        });
        setModalOpen(true);
    }, [contactedIds, getCustomersFromIds]);

    // Click handler for danger zone insight
    const handleDangerZoneClick = useCallback(() => {
        // Get non-contacted customers in danger zone
        const notContactedIds = stats.dangerCustomerIds.filter(id => !contactedIds.has(String(id)));
        const customers = getCustomersFromIds(notContactedIds);

        if (customers.length === 0) return;

        setModalData({
            title: 'Zona de Perigo (30+ dias)',
            subtitle: `${customers.length} clientes sem contato`,
            customers,
            audienceType: 'atRisk',
            color: 'red',
            icon: AlertCircle
        });
        setModalOpen(true);
    }, [stats.dangerCustomerIds, contactedIds, getCustomersFromIds]);

    // Format currency helper
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    // Generate simplified insights (reduced from 6 to 2)
    const insights = useMemo(() => {
        const result = [];

        // Primary insight: Danger zone customers (clickable if > 0)
        if (stats.notContactedInDanger > 0) {
            result.push({
                type: 'warning',
                text: `${stats.notContactedInDanger} clientes em zona de perigo sem contato`,
                onClick: handleDangerZoneClick,
                customerCount: stats.notContactedInDanger
            });
        } else if (stats.dangerCount > 0) {
            result.push({
                type: 'success',
                text: `${stats.dangerCount} clientes em zona de perigo - todos contactados`
            });
        } else {
            result.push({
                type: 'success',
                text: 'Nenhum cliente em zona de perigo'
            });
        }

        // Secondary insight: Revenue at risk (info only)
        if (stats.revenueAtRisk > 0) {
            result.push({
                type: 'info',
                text: `${formatCurrency(stats.revenueAtRisk)} em risco na zona de perigo`
            });
        } else {
            result.push({
                type: 'success',
                text: `${stats.healthyPct}% dos clientes retornam em ate 20 dias`
            });
        }

        return result;
    }, [stats, handleDangerZoneClick]);

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
                        <Bar
                            dataKey="count"
                            radius={[4, 4, 0, 0]}
                            onClick={(barData) => handleBarClick(barData)}
                            cursor="pointer"
                        >
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

            {/* Customer Segment Modal */}
            <CustomerSegmentModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={modalData.title}
                subtitle={modalData.subtitle}
                icon={modalData.icon}
                color={modalData.color}
                customers={modalData.customers}
                audienceType={modalData.audienceType}
                contactedIds={contactedIds}
                onOpenCustomerProfile={onOpenCustomerProfile}
                onMarkContacted={onMarkContacted}
                onCreateCampaign={onCreateCampaign}
            />
        </div>
    );
};

export default ChurnHistogram;
