// RFMScatterPlot.jsx v5.8.1 - BUBBLE ENTRANCE ANIMATION
// Visual representation of customer value and recency with contact tracking
//
// CHANGELOG:
// v5.8.1 (2026-01-30): Switched to Recharts native animation
//   - FIXED: CSS animations caused SVG coordinate glitches
//   - Uses Recharts isAnimationActive/animationDuration props
//   - Bubbles animate smoothly without positioning issues
//   - Respects useReducedMotion for accessibility
// v5.7.0 (2026-01-29): Premium Gradient Pill
//   - Applied amber→orange gradient to "At Risk" pill button
//   - Matches HealthPill/FrequencyDegradationAlert gradient styling
//   - Added text shadows and icon drop shadows for depth
//   - Updated hover states with gradient transitions
// v5.6.0 (2026-01-29): Yellow to amber color migration with mode-aware badges
//   - CHANGED: "At Risk" tooltip badge from yellow-600/500 solid to mode-aware amber styling
//   - CHANGED: At Risk pill button to amber-600/500 with amber-700/600 hover
//   - CHANGED: At Risk pill focus ring from yellow to amber
//   - CHANGED: At Risk list view badge from yellow-600/500 solid to mode-aware amber
//   - Mode-aware badges: bg-amber-50 text-amber-800 border border-amber-200 (light)
//                        bg-amber-500 text-white border-amber-400 (dark)
// v5.5.0 (2026-01-29): Orange to yellow color migration for At Risk badges
//   - CHANGED: "At Risk" tooltip badge from orange-600/500 to yellow-600/500
//   - CHANGED: At Risk pill button from orange-600/500 to yellow-600/500
//   - CHANGED: At Risk pill border from orange-700/400 to yellow-700/400
//   - CHANGED: At Risk list view badge from orange-600/500 to yellow-600/500
//   - Improves visual distinction from other semantic colors
// v5.4.0 (2026-01-29): Amber to orange color migration for At Risk badges
//   - CHANGED: "At Risk" tooltip badge from amber-600/500 to orange-600/500
//   - CHANGED: At Risk pill button from amber-600/500 to orange-600/500
//   - CHANGED: At Risk pill border from amber-700/400 to orange-700/400
//   - CHANGED: At Risk list view badge from amber-600/500 to orange-600/500
//   - Improves visual distinction from other semantic colors
// v5.3.0 (2026-01-28): Solid color badges for WCAG AA compliance
//   - Risk status badges now use solid colors with white text
//   - Updated tooltip, list view, and button badges
//   - Consistent with Design System v5.1 solid color palette
// v5.2.0 (2026-01-23): Legend Simplification & Toggle Controls
//   - Removed VIP count from legend header
//   - Removed icons from risk status labels (cleaner look)
//   - Contacted/Blocked indicators are now toggle buttons
//   - Toggle buttons show/hide corresponding border styles on chart bubbles
//   - Blocked customers stay dimmed even when borders hidden
// v5.1.0 (2026-01-20): Premium Glass Effects
//   - Upgraded to soft glow border system (ring + layered shadows)
//   - Added cyan outer glow (dark) / subtle elevation (light)
//   - Added inner top-edge reflection for glass depth
//   - Improved transparency for premium feel
// v5.0.0 (2026-01-20): Cosmic Glass Card refactor
//   - Replaced gradient background with glass effect (bg-space-dust/50)
//   - Upgraded backdrop-blur-md to backdrop-blur-xl
//   - Softer borders blending with page background
// v4.4.0 (2026-01-15): Added ContextHelp tooltip
//   - NEW: Tooltip explaining RFM methodology
//   - Import ContextHelp component
//   - Explains axes, bubble size, and danger zone
// v4.3.0 (2026-01-15): Header styling consistency
//   - Updated header to match Design System pattern
//   - Added Target icon in colored background pill
//   - Title uses text-base font-bold for consistency with other cards
// v4.2.3 (2026-01-11): Configure skipTouchAutoDismiss for MobileTooltipSheet
//   - NEW: Added skipTouchAutoDismiss: true to useTouchTooltip config
//   - This disables auto-dismiss on touch devices since MobileTooltipSheet has
//     explicit close controls (swipe, backdrop tap, X button)
// v4.2.2 (2026-01-09): Fix MobileTooltipSheet "Ver Perfil" button not opening modal
//   - FIXED: onViewProfile callback now wrapped in useCallback for stable reference
//   - Root cause: inline JSX callback was recreated on every render, losing reference during close
// v4.2.1 (2026-01-09): Bug fix for Recharts data extraction
//   - FIXED: handleBubbleClick now extracts data from entry.payload (Recharts wraps actual data)
//   - FIXED: MobileTooltipSheet now receives correct customer data (name, value, days, visits)
// v4.2.0 (2026-01-09): Mobile touch UX improvements (Phase 5)
//   - NEW: Active bubble visual feedback - white 4px ring + full opacity (SVG doesn't support CSS transforms)
//   - NEW: Uses isActive from useTouchTooltip to track selected bubble
//   - NEW: Long-press (500ms) alternative to double-tap when tooltip is showing
//   - NEW: MobileTooltipSheet bottom sheet replaces floating tooltip on touch devices
//   - NEW: Haptic feedback on tap (light) and action (success)
//   - IMPROVED: Clear visual indicator of which bubble is currently selected on mobile
// v4.1.3 (2026-01-09): List view UX improvements
//   - CHANGED: List view now sorted by days since last visit (ascending - recent first)
//   - NEW: Danger zone visual separator in list view when crossing >30 days threshold
//   - NEW: Red background tint for rows in danger zone
// v4.1.2 (2026-01-09): Zoom implementation fix
//   - CHANGED: Zoom now filters data instead of using allowDataOverflow (caused clipping)
//   - REMOVED: allowDataOverflow, key prop, CSS overflow hacks
//   - NEW: zoomedData memo filters points by max days based on zoom level
// v4.1.0 (2026-01-09): UX Fixes
//   - FIXED: Zoom/view controls moved to dedicated toolbar row (was inside legend)
//   - FIXED: Zoom now adjusts chart domain instead of CSS transform (no overflow)
//   - FIXED: Monitor status now has proper blue styling in list view
//   - FIXED: All status badges (Healthy, Monitor, At Risk, Churning) have distinct colors
// v4.0.0 (2026-01-09): WCAG Accessibility + Enhanced UX
//   - NEW: Icons alongside colors in legend for colorblind accessibility
//   - NEW: StatusIcon component for consistent icon rendering
//   - NEW: Tooltip now shows icon + text for risk status
//   - NEW: Zoom controls (1x, 1.5x, 2x) for dense data exploration
//   - NEW: List view toggle for alternative data representation
//   - IMPROVED: Uses RISK_LABELS from customerMetrics.js for consistency
// v3.4.0 (2026-01-07): Cleaner tooltip UX
//   - REMOVED: "Toque novamente" mobile hint (unnecessary, users discover naturally)
//   - REMOVED: Pointer icon and animation from tooltip
// v3.3.0 (2025-12-22): UX/Design Refactor
//   - CHANGED: "Champions" → "VIP" terminology
//   - FIXED: Tooltip visibility after modal close (resetTooltipVisibility)
//   - IMPROVED: Mobile hint uses Pointer icon instead of emoji
//   - IMPROVED: Danger zone more visible (shaded area + thicker line)
//   - IMPROVED: Responsive danger zone label (">30d" on mobile)
//   - IMPROVED: Header decluttered (VIP count moved to legend)
//   - IMPROVED: Blocked customers dimmed (40% opacity)
//   - ADDED: Responsive chart height (280px mobile, 350px tablet, 420px desktop)
//   - ADDED: ARIA labels and focus states for accessibility
//   - ADDED: 44px minimum touch targets on mobile
//   - ADDED: At-risk pill discrete positioning (top-right on mobile)
//   - PERF: Memoized contact stats and CustomTooltip
// v3.2 (2025-12-22): Fixed frequency to use visits (unique days)
//   - Tooltip now correctly shows visits, not transactions
//   - ZAxis (r) data now comes from customer.visits
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
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, ReferenceArea, Label } from 'recharts';
import { AlertTriangle, CheckCircle, ChevronRight, XCircle, Eye, Sparkles, MinusCircle, ZoomIn, ZoomOut, List, Grid2X2, Target } from 'lucide-react';
import ContextHelp from './ContextHelp';
import { formatCurrency } from '../utils/numberUtils';
import { RISK_LABELS } from '../utils/customerMetrics';
import { getChartColors } from '../utils/chartColors';
import { useTheme } from '../contexts/ThemeContext';
import CustomerSegmentModal from './modals/CustomerSegmentModal';
import MobileTooltipSheet from './ui/MobileTooltipSheet';
import { useTouchTooltip } from '../hooks/useTouchTooltip';
import { useBlacklist } from '../hooks/useBlacklist';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { haptics } from '../utils/haptics';
import { CHART_ANIMATION } from '../constants/animations';

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

    // Reduced motion preference for accessibility
    const prefersReducedMotion = useReducedMotion();
    const scatterAnim = prefersReducedMotion ? CHART_ANIMATION.REDUCED : CHART_ANIMATION.SCATTER;

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

    // Zoom and view mode state (Phase 1.2 - UX Enhancement)
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isListView, setIsListView] = useState(false);

    // Toggle states for border visibility (hidden by default for cleaner look)
    const [showContactedBorders, setShowContactedBorders] = useState(false);
    const [showBlockedBorders, setShowBlockedBorders] = useState(false);

    // Zoom handlers
    const handleZoomIn = useCallback(() => {
        setZoomLevel(prev => Math.min(prev + 0.5, 2));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoomLevel(prev => Math.max(prev - 0.5, 1));
    }, []);

    const toggleView = useCallback(() => {
        setIsListView(prev => !prev);
    }, []);

    // Use shared touch tooltip hook for mobile-friendly interactions
    // Desktop: single click opens profile immediately
    // Mobile: tap-to-preview with bottom sheet, tap-again-to-action, or long-press for direct action
    const {
        handleTouch,
        tooltipHidden,
        resetTooltipVisibility,
        isActive,
        chartContainerHandlers,
        activeTooltip,
        clearTooltip,
        isTouchDevice
    } = useTouchTooltip({
        onAction: (entry) => {
            if (entry?.id && onOpenCustomerProfile) {
                onOpenCustomerProfile(entry.id);
            }
        },
        dismissTimeout: 5000,
        longPressDuration: 500,
        skipTouchAutoDismiss: true  // MobileTooltipSheet has explicit close controls
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

    // Filter data based on zoom level (zoom works by filtering, not clipping)
    const zoomedData = useMemo(() => {
        const maxDays = zoomLevel === 1 ? 60 : zoomLevel === 1.5 ? 40 : 30;
        return enrichedData.filter(d => d.x <= maxDays);
    }, [enrichedData, zoomLevel]);

    // Calculate segment stats
    const highValueAtRiskCustomers = useMemo(() =>
        enrichedData.filter(d => d.y > 500 && d.x > 30), [enrichedData]);
    const vipCustomers = useMemo(() =>
        enrichedData.filter(d => d.y > 500 && d.x <= 20), [enrichedData]);

    // Memoize contact stats for performance
    const contactStats = useMemo(() => ({
        notContactedHighValue: highValueAtRiskCustomers.filter(d => !d.isContacted).length,
        totalContacted: enrichedData.filter(d => d.isContacted).length,
        totalBlacklisted: enrichedData.filter(d => d.isBlacklisted).length
    }), [highValueAtRiskCustomers, enrichedData]);

    const { notContactedHighValue, totalContacted, totalBlacklisted } = contactStats;

    // Click handler for bubble - uses shared touch hook
    // Desktop: immediate action, Mobile: tap-to-preview, tap-again-to-action
    // Note: Recharts passes computed coordinates at root level, actual data is in payload
    const handleBubbleClick = useCallback((entry) => {
        // Extract actual data from payload (Recharts wraps it)
        const data = entry?.payload || entry;
        if (!data?.id) return;
        handleTouch(data, data.id);
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

    // Stable callback for mobile sheet "Ver Perfil" action
    // Uses useCallback to prevent callback reference loss during re-renders
    const handleMobileViewProfile = useCallback((id) => {
        if (id && onOpenCustomerProfile) {
            onOpenCustomerProfile(id);
        }
    }, [onOpenCustomerProfile]);

    // Icon mapping for status badges (WCAG accessibility)
    const StatusIcon = ({ status }) => {
        const iconMap = {
            'Healthy': CheckCircle,
            'Monitor': Eye,
            'At Risk': AlertTriangle,
            'Churning': XCircle,
            'New Customer': Sparkles,
            'Lost': MinusCircle
        };
        const Icon = iconMap[status] || MinusCircle;
        return <Icon className="w-3 h-3" aria-hidden="true" />;
    };

    // Custom Tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;

            // Translate risk status to Portuguese using RISK_LABELS
            const getRiskLabel = (status) => {
                return RISK_LABELS[status]?.pt || status;
            };

            // Format contact date
            const formatContactDate = (isoDate) => {
                if (!isoDate) return '';
                const date = new Date(isoDate);
                return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            };

            return (
                <div role="tooltip" className="bg-white/90 dark:bg-space-dust/90 backdrop-blur-xl p-3 border border-slate-200 dark:border-stellar-cyan/10 rounded-lg shadow-xl text-xs max-w-[220px]">
                    <p className="font-bold text-slate-800 dark:text-white mb-1">{d.name}</p>
                    <p className="text-slate-600 dark:text-slate-300">Gasto: <span className="font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(d.y)}</span></p>
                    <p className="text-slate-600 dark:text-slate-300">Última visita: <span className="font-semibold text-red-500 dark:text-red-400">{d.x} dias atrás</span></p>
                    <p className="text-slate-600 dark:text-slate-300">Frequência: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{d.r} visitas</span></p>

                    {/* Risk Status Badge - Mode-aware styling for WCAG AA compliance */}
                    <div className={`mt-2 text-xs font-bold uppercase px-2 py-0.5 rounded-full w-fit flex items-center gap-1 ${
                        d.status === 'Healthy' ? 'bg-emerald-600 dark:bg-emerald-500 text-white' :
                        d.status === 'Monitor' ? 'bg-blue-600 dark:bg-blue-500 text-white' :
                        d.status === 'At Risk' ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500 dark:text-white dark:border-amber-400' :
                        d.status === 'Churning' ? 'bg-red-600 dark:bg-red-500 text-white' :
                        d.status === 'New Customer' ? 'bg-violet-600 dark:bg-violet-500 text-white' :
                        d.status === 'Lost' ? 'bg-slate-500 dark:bg-slate-600 text-white' :
                        'bg-slate-500 dark:bg-slate-600 text-white'
                    }`}>
                        <StatusIcon status={d.status} />
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
                </div>
            );
        }
        return null;
    };

    return (
        <div className={`
            relative
            ${isDark ? 'bg-space-dust/40' : 'bg-white/80'}
            backdrop-blur-xl
            rounded-2xl p-4 sm:p-5
            ${isDark
                ? 'ring-1 ring-white/[0.05] shadow-[0_0_20px_-5px_rgba(103,232,249,0.15),inset_0_1px_1px_rgba(255,255,255,0.10)]'
                : 'ring-1 ring-slate-200/80 shadow-[0_8px_32px_-12px_rgba(100,116,139,0.15),inset_0_1px_0_rgba(255,255,255,0.8)]'
            }
        `}>
            <div className="mb-4">
                {/* Header row with title and insight pills */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-red-500 dark:bg-red-600 flex items-center justify-center shadow-sm shrink-0">
                            <Target className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                Mapa de Risco (RFM)
                                <ContextHelp
                                    title="Como funciona o RFM?"
                                    description="RFM = Recência, Frequência, Valor Monetário. Cada bolha é um cliente: posição horizontal = dias sem visitar (esquerda = recente, direita = risco), posição vertical = valor gasto, tamanho = frequência de visitas. A zona vermelha (30+ dias) indica clientes em risco de churn."
                                />
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                <span className="hidden sm:inline">Valor x Recência: </span>
                                <span className="font-semibold text-green-600 dark:text-green-400">VIPs</span> (esq) |
                                <span className="font-semibold text-red-500 ml-1">Em Risco</span> (dir)
                            </p>
                        </div>
                    </div>

                    {/* At-Risk Pill - premium gradient button with hover states */}
                    {notContactedHighValue > 0 ? (
                        <button
                            onClick={() => { haptics.light(); handleHighValueAtRiskClick(); }}
                            className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2.5 sm:min-h-[44px] bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 dark:from-amber-500 dark:to-orange-600 dark:hover:from-amber-600 dark:hover:to-orange-700 border border-amber-400/50 dark:border-orange-400/50 rounded-full hover:shadow-md hover:scale-[1.02] transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 absolute top-4 right-4 sm:relative sm:top-auto sm:right-auto shadow-sm"
                            aria-label={`${notContactedHighValue} clientes de alto valor em risco sem contato. Clique para ver detalhes.`}
                        >
                            <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.15))' }} />
                            <span className="text-xs font-medium text-white whitespace-nowrap" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>
                                {notContactedHighValue}
                                <span className="hidden sm:inline"> em risco</span>
                            </span>
                            <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/80 group-hover:translate-x-0.5 transition-transform" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.15))' }} />
                        </button>
                    ) : highValueAtRiskCustomers.length > 0 ? (
                        <div className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-2 bg-emerald-600 dark:bg-emerald-500 border border-emerald-700 dark:border-emerald-400 rounded-full absolute top-4 right-4 sm:relative sm:top-auto sm:right-auto">
                            <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                            <span className="text-xs font-medium text-white whitespace-nowrap hidden sm:inline">
                                Todos contactados
                            </span>
                        </div>
                    ) : null}
                </div>

                {/* Legend for risk status */}
                <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                    <div className="flex items-center gap-1.5" title="Clientes saudáveis - visitam regularmente">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                        <span className="text-slate-600 dark:text-slate-400 hidden sm:inline">Saudável</span>
                        <span className="text-slate-600 dark:text-slate-400 sm:hidden">OK</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Clientes em risco - precisam de atenção">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                        <span className="text-slate-600 dark:text-slate-400">Em Risco</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Clientes críticos - alta probabilidade de perda">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                        <span className="text-slate-600 dark:text-slate-400">Crítico</span>
                    </div>
                    {/* Contacted toggle */}
                    {totalContacted > 0 && (
                        <button
                            onClick={() => setShowContactedBorders(!showContactedBorders)}
                            className={`flex items-center gap-1.5 pl-2 border-l border-slate-300 dark:border-slate-600 transition-all duration-200 ${
                                showContactedBorders
                                    ? 'opacity-100'
                                    : 'opacity-50 hover:opacity-75'
                            }`}
                            title={showContactedBorders ? 'Ocultar bordas de contactados' : 'Mostrar bordas de contactados'}
                        >
                            <div className={`w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 border-2 border-dashed border-blue-500 ${!showContactedBorders && 'border-slate-400'}`}></div>
                            <span className={`font-medium ${showContactedBorders ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-400'}`}>
                                <span className="hidden sm:inline">Contactado </span>({totalContacted})
                            </span>
                        </button>
                    )}
                    {/* Blocked toggle */}
                    {totalBlacklisted > 0 && (
                        <button
                            onClick={() => setShowBlockedBorders(!showBlockedBorders)}
                            className={`flex items-center gap-1.5 pl-2 border-l border-slate-300 dark:border-slate-600 transition-all duration-200 ${
                                showBlockedBorders
                                    ? 'opacity-100'
                                    : 'opacity-50 hover:opacity-75'
                            }`}
                            title={showBlockedBorders ? 'Ocultar bordas de bloqueados' : 'Mostrar bordas de bloqueados'}
                        >
                            <div className={`w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 border-2 border-dotted ${showBlockedBorders ? 'border-slate-900 dark:border-slate-100' : 'border-slate-400'}`}></div>
                            <span className={`font-medium ${showBlockedBorders ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400 dark:text-slate-400'}`}>
                                <span className="hidden sm:inline">Bloqueado </span>({totalBlacklisted})
                            </span>
                        </button>
                    )}
                </div>

                {/* Toolbar - View Toggle and Zoom Controls (separate from legend) */}
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    {/* View Toggle */}
                    <button
                        onClick={toggleView}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs font-medium text-slate-700 dark:text-slate-300"
                        aria-label={isListView ? 'Alternar para visualização de gráfico' : 'Alternar para visualização de lista'}
                    >
                        {isListView ? (
                            <>
                                <Grid2X2 className="w-3.5 h-3.5" />
                                <span>Gráfico</span>
                            </>
                        ) : (
                            <>
                                <List className="w-3.5 h-3.5" />
                                <span>Lista</span>
                            </>
                        )}
                    </button>

                    {/* Zoom Controls - only show in chart view */}
                    {!isListView && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleZoomOut}
                                disabled={zoomLevel <= 1}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                aria-label="Diminuir zoom"
                            >
                                <ZoomOut className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </button>
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-10 text-center">
                                {zoomLevel}x
                            </span>
                            <button
                                onClick={handleZoomIn}
                                disabled={zoomLevel >= 2}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                aria-label="Aumentar zoom"
                            >
                                <ZoomIn className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* List View - Alternative data representation */}
            {isListView ? (
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-10">
                            <tr className="border-b border-slate-200 dark:border-slate-700">
                                <th className="text-left py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">Cliente</th>
                                <th className="text-left py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                                <th className="text-right py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">Dias</th>
                                <th className="text-right py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">Valor</th>
                                <th className="text-right py-2 px-3 font-semibold text-slate-700 dark:text-slate-300 hidden sm:table-cell">Visitas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {enrichedData
                                .sort((a, b) => a.x - b.x) // Sort by days ascending (recent first)
                                .map((d, i, arr) => {
                                    // Check if this is the first row in danger zone (>30 days)
                                    const isFirstInDangerZone = d.x > 30 && (i === 0 || arr[i - 1].x <= 30);
                                    const isInDangerZone = d.x > 30;

                                    return (
                                    <React.Fragment key={d.id || `row-${i}`}>
                                        {/* Danger Zone separator line */}
                                        {isFirstInDangerZone && (
                                            <tr className="bg-red-50 dark:bg-red-900/20">
                                                <td colSpan={5} className="py-1.5 px-3 text-xs font-semibold text-red-600 dark:text-red-400 border-t-2 border-red-300 dark:border-red-700">
                                                    <span className="flex items-center gap-1.5">
                                                        <AlertTriangle className="w-3.5 h-3.5" />
                                                        Zona de Perigo (&gt;30 dias)
                                                    </span>
                                                </td>
                                            </tr>
                                        )}
                                        <tr
                                            onClick={() => onOpenCustomerProfile?.(d.id)}
                                            className={`border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${isInDangerZone ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}
                                        >
                                        <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                                            {d.name}
                                        </td>
                                        <td className="py-2 px-3">
                                            {/* Risk Status Badge - Mode-aware styling for WCAG AA */}
                                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                                d.status === 'Healthy' ? 'bg-emerald-600 dark:bg-emerald-500 text-white' :
                                                d.status === 'Monitor' ? 'bg-blue-600 dark:bg-blue-500 text-white' :
                                                d.status === 'At Risk' ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500 dark:text-white dark:border-amber-400' :
                                                d.status === 'Churning' ? 'bg-red-600 dark:bg-red-500 text-white' :
                                                d.status === 'New Customer' ? 'bg-violet-600 dark:bg-violet-500 text-white' :
                                                d.status === 'Lost' ? 'bg-slate-500 dark:bg-slate-600 text-white' :
                                                'bg-slate-500 dark:bg-slate-600 text-white'
                                            }`}>
                                                <StatusIcon status={d.status} />
                                                {RISK_LABELS[d.status]?.pt || d.status}
                                            </div>
                                        </td>
                                        <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                                            {d.x}d
                                        </td>
                                        <td className="py-2 px-3 text-right font-semibold text-blue-600 dark:text-blue-400">
                                            {formatCurrency(d.y)}
                                        </td>
                                        <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                                            {d.r}
                                        </td>
                                    </tr>
                                    </React.Fragment>
                                );
                                })}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* Chart View - zoom filters data to show subset
                   Note: chartContainerHandlers enable long-press on chart area (outside MobileTooltipSheet)
                   when a tooltip is active. Main long-press functionality is in MobileTooltipSheet itself. */
                <div
                    className="h-[280px] sm:h-[350px] lg:h-[420px]"
                    role="img"
                    aria-label="Gráfico de dispersão RFM mostrando valor do cliente versus dias desde última visita"
                    {...chartContainerHandlers}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                        <XAxis
                            type="number"
                            dataKey="x"
                            name="Recência"
                            unit=" dias"
                            domain={[0, zoomLevel === 1 ? 60 : zoomLevel === 1.5 ? 40 : 30]}
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
                        {/* ZAxis controls bubble size based on frequency (r = visits = unique days) */}
                        <ZAxis
                            type="number"
                            dataKey="r"
                            range={isDesktop ? [80, 600] : [40, 400]}
                            name="Frequência"
                        />
                        {/* Hide floating tooltip on touch devices (use MobileTooltipSheet instead) */}
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ strokeDasharray: '3 3' }}
                            wrapperStyle={{ visibility: (tooltipHidden || isTouchDevice) ? 'hidden' : 'visible' }}
                        />

                        {/* Danger Zone - shaded area for visual emphasis (adjusts with zoom) */}
                        <ReferenceArea
                            x1={30}
                            x2={zoomLevel === 1 ? 60 : zoomLevel === 1.5 ? 40 : 30}
                            fill={isDark ? '#ef444420' : '#ef444410'}
                            fillOpacity={1}
                        />

                        {/* Danger Zone Reference Line - improved visibility */}
                        <ReferenceLine
                            x={30}
                            stroke={chartColors.error}
                            strokeWidth={2}
                            strokeDasharray="8 4"
                        >
                            <Label
                                value={isDesktop ? "Zona de Perigo (>30d)" : ">30d"}
                                position="insideTopRight"
                                fill={chartColors.error}
                                fontSize={labelFontSize}
                                fontWeight="bold"
                            />
                        </ReferenceLine>

                        <Scatter
                            name="Clientes"
                            data={zoomedData}
                            fill="#8884d8"
                            onClick={(data) => handleBubbleClick(data)}
                            cursor={onOpenCustomerProfile ? 'pointer' : 'default'}
                            isAnimationActive={!prefersReducedMotion}
                            animationDuration={scatterAnim.duration}
                            animationEasing={scatterAnim.easing}
                        >
                            {zoomedData.map((entry, index) => {
                                // Determine base fill color
                                const baseColor = entry.status === 'Healthy' ? '#10b981' :
                                    entry.status === 'At Risk' ? '#f59e0b' :
                                    entry.status === 'Churning' ? '#ef4444' : '#94a3b8';

                                // Check if this bubble is the active/selected one
                                const bubbleIsActive = isActive(entry.id);

                                // Determine stroke style: active > blacklisted > contacted > none
                                let strokeColor = 'transparent';
                                let strokeWidth = 0;
                                let strokeDash = undefined;
                                let fillOpacity = 0.8;

                                if (bubbleIsActive) {
                                    // Active bubble: white ring with glow effect
                                    strokeColor = '#ffffff';
                                    strokeWidth = 4;
                                    strokeDash = undefined;
                                } else if (entry.isBlacklisted && showBlockedBorders) {
                                    strokeColor = isDark ? '#f1f5f9' : '#0f172a';
                                    strokeWidth = 3;
                                    strokeDash = '3 3';
                                    fillOpacity = 0.4; // Dim blocked customers significantly
                                } else if (entry.isBlacklisted && !showBlockedBorders) {
                                    // Still dim blocked customers even when borders hidden
                                    fillOpacity = 0.4;
                                } else if (entry.isContacted && showContactedBorders) {
                                    strokeColor = '#3b82f6';
                                    strokeWidth = 3;
                                    strokeDash = '6 3';
                                }

                                return (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={baseColor}
                                        fillOpacity={bubbleIsActive ? 1 : fillOpacity}
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
            )}

            {/* Customer Segment Modal */}
            <CustomerSegmentModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    // Reset tooltip visibility after modal closes
                    setTimeout(() => resetTooltipVisibility?.(), 300);
                }}
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

            {/* Mobile Bottom Sheet Tooltip - replaces floating tooltip on touch devices */}
            {isTouchDevice && (
                <MobileTooltipSheet
                    isOpen={!!activeTooltip?.data}
                    onClose={clearTooltip}
                    data={activeTooltip?.data}
                    onViewProfile={handleMobileViewProfile}
                />
            )}
        </div>
    );
};

export default RFMScatterPlot;
