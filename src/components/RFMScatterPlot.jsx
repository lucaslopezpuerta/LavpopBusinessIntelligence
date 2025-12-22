// RFMScatterPlot.jsx v3.1 - HAPTIC FEEDBACK
// Visual representation of customer value and recency with contact tracking
//
// CHANGELOG:
// v3.1 (2025-12-22): Added haptic feedback on insight button
// v3.0 (2025-12-16): Blacklist visual indicator
//   - NEW: Black dotted border for blacklisted customers
//   - Blacklisted takes visual precedence over contacted
//   - Added legend entry for blacklisted indicator
// v2.9 (2025-12-16): Pills relocated to header + responsive labels
//   - MOVED: Insight pills from bottom to top-right header area
//   - CHANGED: X-axis domain back to 60 days (matches LOST_THRESHOLD)
//   - IMPROVED: Responsive font sizes (12px mobile, 14px desktop)
// v2.8 (2025-12-16): Compact insight pills + Y-axis fix
//   - FIXED: Y-axis no longer shows duplicate "R$" (removed unit prop)
//   - CHANGED: Bottom banners replaced with compact inline insight pills
//   - Preserved onClick action for at-risk customers pill
// v2.7 (2025-12-16): Design System v3.2 compliance
//   - FIXED: fontSize 10 → 12 (minimum text-xs per Design System)
//   - FIXED: Now uses centralized getChartColors for theme-aware colors
//   - Grid, axis, and label colors now respond to dark mode
// v2.6 (2025-12-16): Desktop visual enhancements
//   - NEW: Responsive height (350px mobile, 420px desktop)
//   - NEW: Extended X-axis to 90 days for better long-term visibility
//   - Better use of full-width layout on desktop
// v2.5 (2025-12-16): Fixed layout overflow issue
//   - REMOVED: h-full flex flex-col (caused overflow when relocated)
//   - CHANGED: Chart container from flex-1 min-h-[300px] to fixed h-[350px]
//   - Component now sizes naturally without parent height dependency
// v2.4 (2025-12-16): Tooltip dismiss on action
//   - FIXED: Tooltip now hides when modal opens
//   - Uses tooltipHidden from hook to control Recharts Tooltip visibility
// v2.3 (2025-12-16): Refactored to use useTouchTooltip hook
//   - REMOVED: Duplicated touch handling logic
//   - Uses shared hook for consistent desktop/mobile behavior
//   - Desktop: single click opens profile
//   - Mobile: tap-to-preview, tap-again-to-action
// v2.2 (2025-12-16): Mobile touch tooltip support
//   - Uses useTouchTooltip hook for tap-to-preview, tap-again-to-action
//   - First tap shows tooltip with "Toque novamente" hint on mobile
//   - Second tap opens CustomerProfileModal
//   - Fixed text-[10px] violation in tooltip risk badge (min 12px)
// v2.1 (2025-12-16): Pass ALL customers to modal (let modal filter)
//   - Removed pre-filtering of non-contacted customers
//   - Modal's hideContacted=true handles filtering (more flexible for user)
//   - Fixes issue where unchecking "Ocultar Contactados" showed empty list
// v2.0 (2025-12-15): Interactive insights + modal integration
//   - REFACTORED: Reduced insights from 4 to 2 (primary clickable, secondary info)
//   - NEW: Click bubble → opens CustomerProfileModal
//   - NEW: Click insight → opens CustomerSegmentModal with customers
//   - NEW: onOpenCustomerProfile and onOpenSegmentModal props
// v1.4 (2025-12-13): Contact status visualization
//   - NEW: Blue dashed stroke for contacted customers (pending in contact_tracking)
//   - NEW: Tooltip shows contact status and campaign name
//   - NEW: Legend indicating stroke meaning
//   - NEW: Insight for contacted high-value customers
//   - Accepts contactedIds and pendingContacts props from parent
// v1.3 (2025-11-24): Added explanation for likelihood-based classification
// v1.2 (2025-11-24): Added actionable insights
// v1.1 (2025-11-24): Portuguese translations
// v1.0 (2025-11-23): Initial implementation

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, Label } from 'recharts';
import { AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../utils/numberUtils';
import { getChartColors } from '../utils/chartColors';
import { useTheme } from '../contexts/ThemeContext';
import CustomerSegmentModal from './modals/CustomerSegmentModal';
import { useTouchTooltip } from '../hooks/useTouchTooltip';
import { useBlacklist } from '../hooks/useBlacklist';
import { haptics } from '../utils/haptics';

// Desktop breakpoint for responsive chart labels
const DESKTOP_BREAKPOINT = 1024;

const RFMScatterPlot = ({
    data,
    contactedIds = new Set(),
    pendingContacts = {},
    onOpenCustomerProfile,
    onMarkContacted,
    onCreateCampaign
}) => {
    // Theme-aware chart colors (Design System v3.2)
    const { isDark } = useTheme();
    const chartColors = useMemo(() => getChartColors(isDark), [isDark]);

    // Blacklist check for visual indicator
    const { isBlacklisted } = useBlacklist();

    // Responsive font sizes for chart labels (12px mobile, 14px desktop)
    const [isDesktop, setIsDesktop] = useState(false);
    useEffect(() => {
        const checkDesktop = () => setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);
    const labelFontSize = isDesktop ? 14 : 12;

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalData, setModalData] = useState({ title: '', customers: [], audienceType: 'atRisk', color: 'amber' });

    // Use shared touch tooltip hook for mobile-friendly interactions
    // Desktop: single click opens profile immediately
    // Mobile: tap-to-preview, tap-again-to-action
    const { handleTouch, isActive: isActiveTouch, tooltipHidden } = useTouchTooltip({
        onAction: (entry) => {
            if (entry?.id && onOpenCustomerProfile) {
                onOpenCustomerProfile(entry.id);
            }
        },
        dismissTimeout: 5000
    });

    if (!data || data.length === 0) return null;

    // Enrich data with contact and blacklist status
    const enrichedData = useMemo(() => {
        return data.map(d => ({
            ...d,
            isContacted: contactedIds.has(String(d.id)),
            contactInfo: pendingContacts[String(d.id)] || null,
            isBlacklisted: isBlacklisted(d.phone)
        }));
    }, [data, contactedIds, pendingContacts, isBlacklisted]);

    // Calculate segment stats
    const highValueAtRiskCustomers = useMemo(() =>
        enrichedData.filter(d => d.y > 500 && d.x > 30), [enrichedData]);
    const championsCustomers = useMemo(() =>
        enrichedData.filter(d => d.y > 500 && d.x <= 20), [enrichedData]);

    const notContactedHighValue = highValueAtRiskCustomers.filter(d => !d.isContacted).length;
    const totalContacted = enrichedData.filter(d => d.isContacted).length;
    const totalBlacklisted = enrichedData.filter(d => d.isBlacklisted).length;

    // Click handler for bubble - uses shared touch hook
    // Desktop: immediate action, Mobile: tap-to-preview, tap-again-to-action
    const handleBubbleClick = useCallback((entry) => {
        if (!entry?.id) return;
        handleTouch(entry, entry.id);
    }, [handleTouch]);

    // Click handler for high-value at-risk insight - passes ALL high-value at-risk customers
    const handleHighValueAtRiskClick = useCallback(() => {
        if (!highValueAtRiskCustomers || highValueAtRiskCustomers.length === 0) return;

        // v2.1: Pass ALL high-value at-risk customers, let modal filter
        setModalData({
            title: 'Clientes de Alto Valor em Risco',
            subtitle: `${highValueAtRiskCustomers.length} clientes`,
            customers: highValueAtRiskCustomers,
            audienceType: 'atRisk',
            color: 'amber',
            icon: AlertTriangle
        });
        setModalOpen(true);
    }, [highValueAtRiskCustomers]);

    // Custom Tooltip - with mobile hint support
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            const isActiveTouchItem = isActiveTouch(d.id);

            // Translate risk status to Portuguese
            const getRiskLabel = (status) => {
                const labels = {
                    'Healthy': 'Saudável',
                    'Monitor': 'Monitorar',
                    'At Risk': 'Em Risco',
                    'Churning': 'Crítico',
                    'New Customer': 'Novo',
                    'Lost': 'Perdido'
                };
                return labels[status] || status;
            };

            // Format contact date
            const formatContactDate = (isoDate) => {
                if (!isoDate) return '';
                const date = new Date(isoDate);
                return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            };

            return (
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl text-xs max-w-[220px]">
                    <p className="font-bold text-slate-800 dark:text-white mb-1">{d.name}</p>
                    <p className="text-slate-600 dark:text-slate-300">Gasto: <span className="font-semibold text-lavpop-blue dark:text-blue-400">{formatCurrency(d.y)}</span></p>
                    <p className="text-slate-600 dark:text-slate-300">Última visita: <span className="font-semibold text-red-500 dark:text-red-400">{d.x} dias atrás</span></p>
                    <p className="text-slate-600 dark:text-slate-300">Frequência: <span className="font-semibold text-lavpop-green dark:text-emerald-400">{d.r} visitas</span></p>

                    {/* Risk Status Badge - Fixed: text-xs instead of text-[10px] */}
                    <div className={`mt-2 text-xs font-bold uppercase px-2 py-0.5 rounded-full w-fit ${d.status === 'Healthy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                        d.status === 'At Risk' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                            d.status === 'Churning' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                        {getRiskLabel(d.status)}
                    </div>

                    {/* Contact Status */}
                    {d.isContacted && d.contactInfo && (
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="font-semibold">Contactado</span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                                {d.contactInfo.campaign_name || 'Campanha'}
                                {d.contactInfo.contacted_at && ` • ${formatContactDate(d.contactInfo.contacted_at)}`}
                            </p>
                        </div>
                    )}
                    {!d.isContacted && d.y > 500 && d.x > 30 && (
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-amber-600 dark:text-amber-400 text-xs font-medium">
                                ⚡ Cliente de alto valor sem contato recente
                            </p>
                        </div>
                    )}

                    {/* Mobile hint - shows when item is active from first tap */}
                    {isActiveTouchItem && onOpenCustomerProfile && (
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-blue-600 dark:text-blue-400 text-xs font-medium text-center animate-pulse">
                                👆 Toque novamente para ver perfil
                            </p>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 border border-white/20 dark:border-slate-700/50 shadow-sm">
            <div className="mb-4">
                {/* Header row with title and insight pills */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-lavpop-blue"></span>
                            Mapa de Risco (RFM)
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Identifique visualmente onde estão seus clientes de maior valor.
                            <br />
                            <span className="font-semibold text-green-600">Topo-Esquerda:</span> Campeões |
                            <span className="font-semibold text-red-500 ml-1">Topo-Direita:</span> Em Perigo
                        </p>
                    </div>

                    {/* Insight Pills - relocated to header */}
                    <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                        {/* At-Risk High-Value Pill */}
                        {notContactedHighValue > 0 ? (
                            <button
                                onClick={() => { haptics.light(); handleHighValueAtRiskClick(); }}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-full hover:shadow-md hover:scale-[1.02] transition-all duration-200 group"
                            >
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                <span className="text-xs font-medium text-amber-700 dark:text-amber-300 whitespace-nowrap">
                                    {notContactedHighValue} em risco sem contato
                                </span>
                                <ChevronRight className="w-3 h-3 text-amber-500 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        ) : highValueAtRiskCustomers.length > 0 ? (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-full">
                                <CheckCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span className="text-xs font-medium text-blue-700 dark:text-blue-300 whitespace-nowrap">
                                    Todos contactados
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-full">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                                    Sem alto valor em risco
                                </span>
                            </div>
                        )}

                        {/* Champions Pill */}
                        {championsCustomers.length > 0 && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-full">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                                    {championsCustomers.length} campeões
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Legend for contact status - Design System compliant (min text-xs) */}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-emerald-500/60"></div>
                        <span className="text-slate-600 dark:text-slate-400">Saudável</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-amber-500/60"></div>
                        <span className="text-slate-600 dark:text-slate-400">Em Risco</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/60"></div>
                        <span className="text-slate-600 dark:text-slate-400">Crítico</span>
                    </div>
                    {totalContacted > 0 && (
                        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-300 dark:border-slate-600">
                            <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 border-2 border-dashed border-blue-500"></div>
                            <span className="text-blue-600 dark:text-blue-400 font-medium">Contactado ({totalContacted})</span>
                        </div>
                    )}
                    {totalBlacklisted > 0 && (
                        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-300 dark:border-slate-600">
                            <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 border-2 border-dotted border-slate-900 dark:border-slate-100"></div>
                            <span className="text-slate-700 dark:text-slate-300 font-medium">Bloqueado ({totalBlacklisted})</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="h-[350px] lg:h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                        <XAxis
                            type="number"
                            dataKey="x"
                            name="Recência"
                            unit=" dias"
                            domain={[0, 60]}
                            stroke={chartColors.axis}
                            fontSize={labelFontSize}
                            tick={{ fill: chartColors.tickText }}
                            label={{ value: 'Dias sem visitar (Recência)', position: 'bottom', offset: 0, fontSize: labelFontSize, fill: chartColors.tickText }}
                        />
                        <YAxis
                            type="number"
                            dataKey="y"
                            name="Valor"
                            stroke={chartColors.axis}
                            fontSize={labelFontSize}
                            tick={{ fill: chartColors.tickText }}
                            tickFormatter={(val) => `R$${val}`}
                        />
                        {/* ZAxis controls bubble size based on frequency (r = transactions count) */}
                        <ZAxis
                            type="number"
                            dataKey="r"
                            range={isDesktop ? [80, 600] : [40, 400]}
                            name="Frequência"
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} wrapperStyle={{ visibility: tooltipHidden ? 'hidden' : 'visible' }} />

                        {/* Danger Zone Reference Line */}
                        <ReferenceLine x={30} stroke={chartColors.error} strokeDasharray="3 3">
                            <Label value="Zona de Perigo (>30d)" position="insideTopRight" fill={chartColors.error} fontSize={labelFontSize} />
                        </ReferenceLine>

                        <Scatter
                            name="Clientes"
                            data={enrichedData}
                            fill="#8884d8"
                            onClick={(data) => handleBubbleClick(data)}
                            cursor={onOpenCustomerProfile ? 'pointer' : 'default'}
                        >
                            {enrichedData.map((entry, index) => {
                                // Determine stroke style: blacklisted (black dotted) > contacted (blue dashed) > none
                                const strokeColor = entry.isBlacklisted ? (isDark ? '#f1f5f9' : '#0f172a') :
                                    entry.isContacted ? '#3b82f6' : 'transparent';
                                const strokeWidth = entry.isBlacklisted || entry.isContacted ? 3 : 0;
                                const strokeDash = entry.isBlacklisted ? '2 2' :
                                    entry.isContacted ? '4 2' : undefined;

                                return (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={
                                            entry.status === 'Healthy' ? '#10b981' :
                                                entry.status === 'At Risk' ? '#f59e0b' :
                                                    entry.status === 'Churning' ? '#ef4444' :
                                                        '#94a3b8'
                                        }
                                        stroke={strokeColor}
                                        strokeWidth={strokeWidth}
                                        strokeDasharray={strokeDash}
                                    />
                                );
                            })}
                        </Scatter>
                    </ScatterChart>
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

export default RFMScatterPlot;
