// ChurnHistogram.jsx v2.9 - HAPTIC FEEDBACK
// Time-to-churn distribution histogram with contact tracking integration
//
// CHANGELOG:
// v2.9 (2025-12-22): Added haptic feedback on insight button
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
import { AlertCircle, AlertTriangle, CheckCircle, ChevronRight, DollarSign, Clock } from 'lucide-react';
import CustomerSegmentModal from './modals/CustomerSegmentModal';
import { useTouchTooltip } from '../hooks/useTouchTooltip';
import { getChartColors } from '../utils/chartColors';
import { useTheme } from '../contexts/ThemeContext';
import { useBlacklist } from '../hooks/useBlacklist';
import { haptics } from '../utils/haptics';
import { DAY_THRESHOLDS } from '../utils/customerMetrics';

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
                color: binData.min >= DAY_THRESHOLDS.HEALTHY ? 'red' : binData.min >= 20 ? 'amber' : 'green',
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

        // Check bins within healthy threshold (v3.8.0: uses DAY_THRESHOLDS)
        // Healthy = bins where max is <= HEALTHY threshold (30 days)
        const healthy = data.filter(d => d.max <= DAY_THRESHOLDS.HEALTHY).reduce((sum, d) => sum + d.count, 0);
        const healthyPct = total > 0 ? Math.round((healthy / total) * 100) : 0;

        // Danger zone: bins with min >= HEALTHY threshold (v3.8.0: 30 days)
        const dangerBins = data.filter(d => d.min >= DAY_THRESHOLDS.HEALTHY);
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
            title: `Zona de Perigo (${DAY_THRESHOLDS.HEALTHY}+ dias)`,
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
            {/* Header */}
            <div className="mb-4">
                {/* Title + Subtitle */}
                <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg shrink-0">
                        <Clock className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-base font-bold text-slate-800 dark:text-white">
                                Risco de Churn
                            </h3>
                            {/* Contact status badge */}
                            {contactedIds.size > 0 && stats.dangerCount > 0 && (
                                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium shrink-0">
                                    {stats.contactedInDanger}/{stats.dangerCount} contactados
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Dias desde última visita. Após <span className="font-semibold text-red-500">30 dias</span>, risco aumenta.
                        </p>
                    </div>
                </div>

                {/* Insight Pills - responsive grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Danger zone status pill */}
                    {stats.notContactedInDanger > 0 ? (
                        <button
                            onClick={() => { haptics.light(); handleDangerZoneClick(); }}
                            className="flex items-center justify-between gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors group"
                        >
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400" />
                                <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                                    {stats.notContactedInDanger}
                                </span>
                                <span className="text-xs text-red-600 dark:text-red-400">
                                    sem contato
                                </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-red-400 dark:text-red-500 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    ) : stats.dangerCount > 0 ? (
                        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                Todos contactados
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                Nenhum em perigo
                            </span>
                        </div>
                    )}

                    {/* Revenue at risk pill */}
                    {stats.revenueAtRisk > 0 ? (
                        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg">
                            <DollarSign className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                            <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                                {formatCurrency(stats.revenueAtRisk)}
                            </span>
                            <span className="text-xs text-amber-600 dark:text-amber-400">
                                em risco
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                {stats.healthyPct}%
                            </span>
                            <span className="text-xs text-emerald-600 dark:text-emerald-400">
                                retornam em 20d
                            </span>
                        </div>
                    )}
                </div>
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
