// ChurnHistogram.jsx v2.8 - BLACKLIST INTEGRATION
// Time-to-churn distribution histogram with contact tracking integration
//
// CHANGELOG:
// v2.8 (2025-12-16): Blacklist integration
//   - Added blacklisted count to bar tooltips
//   - Uses useBlacklist hook for phone-based blacklist check
// v2.7 (2025-12-16): Design System v3.2 chart colors
//   - Added theme-aware colors via getChartColors()
//   - Fixed fontSize from 10 to 12 (Design System minimum)
//   - Updated grid, axis, and cursor colors
// v2.6 (2025-12-16): Insight pills relocated to header
//   - MOVED: Insights from bottom InsightBox to compact header pills
//   - REMOVED: InsightBox component dependency
//   - Added DollarSign icon for revenue at risk pill
// v2.5 (2025-12-16): Tooltip dismiss on action
//   - FIXED: Tooltip now hides when modal opens
//   - Uses tooltipHidden from hook to control Recharts Tooltip visibility
// v2.4 (2025-12-16): Refactored to use useTouchTooltip hook
//   - REMOVED: Duplicated touch handling logic
//   - Uses shared hook for consistent desktop/mobile behavior
//   - Desktop: single click opens modal immediately
//   - Mobile: tap-to-preview, tap-again-to-action
// v2.3 (2025-12-16): Mobile touch tooltip support
//   - Uses tap-to-preview, tap-again-to-action pattern
//   - First tap shows tooltip with "Toque novamente" hint on mobile
//   - Second tap opens CustomerSegmentModal
//   - Fixed text-[10px] violation in tooltip contact status (min 12px)
// v2.2 (2025-12-16): Pass ALL customers to modal (let modal filter)
//   - Removed pre-filtering of non-contacted customers
//   - Modal's hideContacted=true handles filtering (more flexible for user)
//   - Fixes issue where unchecking "Ocultar Contactados" showed empty list
// v2.1 (2025-12-15): Interactive insights + bar clicks
//   - REFACTORED: Reduced insights from 6 to 2 (primary clickable, secondary info)
//   - NEW: Click bar → opens modal with customers in that bin
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
import { AlertCircle, AlertTriangle, CheckCircle, ChevronRight, DollarSign } from 'lucide-react';
import CustomerSegmentModal from './modals/CustomerSegmentModal';
import { useTouchTooltip } from '../hooks/useTouchTooltip';
import { getChartColors } from '../utils/chartColors';
import { useTheme } from '../contexts/ThemeContext';
import { useBlacklist } from '../hooks/useBlacklist';

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

    // Theme-aware chart colors (Design System v3.2)
    const { isDark } = useTheme();
    const chartColors = useMemo(() => getChartColors(isDark), [isDark]);

    // Blacklist check for tooltip display
    const { isBlacklisted } = useBlacklist();

    // Helper to convert customer IDs to customer objects (moved up for use in hook callback)
    const getCustomersFromIds = useCallback((customerIds) => {
        return customerIds
            .map(id => customerMap[String(id)] || { id, name: `Cliente ${String(id).slice(-4)}` })
            .filter(Boolean);
    }, [customerMap]);

    // Use shared touch tooltip hook for mobile-friendly interactions
    // Desktop: single click opens modal immediately
    // Mobile: tap-to-preview, tap-again-to-action
    const { handleTouch, isActive: isActiveTouch, tooltipHidden } = useTouchTooltip({
        onAction: (binData) => {
            if (!binData || !binData.customerIds || binData.customerIds.length === 0) return;

            const customers = getCustomersFromIds(binData.customerIds);
            if (customers.length === 0) return;

            setModalData({
                title: `Clientes: ${binData.bin} dias`,
                subtitle: `${customers.length} clientes`,
                customers,
                audienceType: 'atRisk',
                color: binData.min >= 30 ? 'red' : binData.min >= 20 ? 'amber' : 'green',
                icon: AlertCircle
            });
            setModalOpen(true);
        },
        dismissTimeout: 5000
    });

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

    // Click handler for bar - uses shared touch hook
    // Desktop: immediate action, Mobile: tap-to-preview, tap-again-to-action
    const handleBarClick = useCallback((binData) => {
        if (!binData || !binData.customerIds || binData.customerIds.length === 0) return;
        handleTouch(binData, binData.bin);
    }, [handleTouch]);

    // Click handler for danger zone insight
    const handleDangerZoneClick = useCallback(() => {
        if (!stats.dangerCustomerIds || stats.dangerCustomerIds.length === 0) return;

        // v2.2: Pass ALL customers in danger zone, let modal filter
        const customers = getCustomersFromIds(stats.dangerCustomerIds);

        if (customers.length === 0) return;

        setModalData({
            title: 'Zona de Perigo (30+ dias)',
            subtitle: `${customers.length} clientes`,
            customers,
            audienceType: 'atRisk',
            color: 'red',
            icon: AlertCircle
        });
        setModalOpen(true);
    }, [stats.dangerCustomerIds, getCustomersFromIds]);

    // Format currency helper
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };


    // Memoized tooltip - with mobile hint support
    const CustomTooltip = useCallback(({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const binData = payload[0].payload;
            const binCustomerIds = binData.customerIds || [];
            const contactedCount = binCustomerIds.filter(id => contactedIds.has(String(id))).length;
            const notContactedCount = binData.count - contactedCount;
            const isActiveTouchItem = isActiveTouch(binData.bin);

            // Count blacklisted customers in this bin
            const blacklistedCount = binCustomerIds.filter(id => {
                const customer = customerMap[String(id)];
                const phone = customer?.phone || customer?.telefone;
                return phone && isBlacklisted(phone);
            }).length;

            return (
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl text-xs">
                    <p className="font-bold text-slate-800 dark:text-white mb-1">Intervalo: {label} dias</p>
                    <p className="text-slate-600 dark:text-slate-300">
                        <span className="font-bold text-lavpop-blue dark:text-blue-400 text-lg">{payload[0].value}</span> clientes
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 italic">
                        retornam geralmente neste período
                    </p>

                    {/* Contact and blacklist status breakdown */}
                    {binData.count > 0 && (contactedIds.size > 0 || blacklistedCount > 0) && (
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                            {contactedIds.size > 0 && (
                                <>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-blue-600 dark:text-blue-400">Contactados:</span>
                                        <span className="font-bold text-blue-600 dark:text-blue-400">{contactedCount}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-500 dark:text-slate-400">Sem contato:</span>
                                        <span className="font-bold text-slate-600 dark:text-slate-300">{notContactedCount}</span>
                                    </div>
                                </>
                            )}
                            {blacklistedCount > 0 && (
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-red-600 dark:text-red-400">Bloqueados:</span>
                                    <span className="font-bold text-red-600 dark:text-red-400">{blacklistedCount}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Mobile hint - shows when item is active from first tap */}
                    {isActiveTouchItem && binData.customerIds?.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-blue-600 dark:text-blue-400 text-xs font-medium text-center animate-pulse">
                                👆 Toque novamente para ver clientes
                            </p>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    }, [contactedIds, isActiveTouch, customerMap, isBlacklisted]);

    return (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 border border-white/20 dark:border-slate-700/50 shadow-sm h-full flex flex-col">
            <div className="mb-4">
                {/* Header row with title and insight pills */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
                    <div>
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

                    {/* Insight Pills - relocated to header */}
                    <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                        {/* Danger zone status pill */}
                        {stats.notContactedInDanger > 0 ? (
                            <button
                                onClick={handleDangerZoneClick}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-full hover:shadow-md hover:scale-[1.02] transition-all duration-200 group"
                            >
                                <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                <span className="text-xs font-medium text-red-700 dark:text-red-300 whitespace-nowrap">
                                    {stats.notContactedInDanger} em perigo sem contato
                                </span>
                                <ChevronRight className="w-3 h-3 text-red-500 dark:text-red-400 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        ) : stats.dangerCount > 0 ? (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-full">
                                <CheckCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span className="text-xs font-medium text-blue-700 dark:text-blue-300 whitespace-nowrap">
                                    Todos em perigo contactados
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-full">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                                    Sem clientes em perigo
                                </span>
                            </div>
                        )}

                        {/* Revenue at risk / healthy rate pill */}
                        {stats.revenueAtRisk > 0 ? (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-full">
                                <DollarSign className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                <span className="text-xs font-medium text-amber-700 dark:text-amber-300 whitespace-nowrap">
                                    {formatCurrency(stats.revenueAtRisk)} em risco
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-full">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                                    {stats.healthyPct}% retornam em 20d
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Contact status legend - Design System compliant (min text-xs) */}
                {contactedIds.size > 0 && stats.dangerCount > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
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
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                        <XAxis
                            dataKey="bin"
                            stroke={chartColors.axis}
                            fontSize={12}
                            tick={{ fill: chartColors.tickText }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke={chartColors.axis}
                            fontSize={12}
                            tick={{ fill: chartColors.tickText }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: chartColors.cursorFill }} wrapperStyle={{ visibility: tooltipHidden ? 'hidden' : 'visible' }} />
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
