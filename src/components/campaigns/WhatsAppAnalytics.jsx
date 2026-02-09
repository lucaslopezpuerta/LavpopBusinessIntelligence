// WhatsAppAnalytics.jsx v4.2 - REFRESH OVERLAY
// WhatsApp Business API Analytics Dashboard
// Design System v6.4 compliant
//
// CHANGELOG:
// v4.2 (2026-02-05): Refresh overlay (Design System v6.4)
//   - Added BackgroundRefreshIndicator overlay during sync
//   - Consistent refresh UX across all analytics screens
// v4.1 (2026-01-29): Design enhancements
//   - Micro-interactions: active:scale-[0.98] on filter/sort buttons
//   - Visual hierarchy: divider above Engajamento section
//   - Focus states: focus:ring-stellar-cyan on filter buttons
//   - Code quality: extracted getMessageCardClasses() helper function
//   - Opt-out badge: solid amber for consistency
// v4.0 (2026-01-29): Design System v5.1 compliance fixes
//   - Chart axis font size: 11px → 12px (accessibility minimum)
//   - DateFilter touch targets: 28px → 44px (accessibility)
//   - ProfileHeader: dark:bg-slate-800 → dark:bg-space-dust (cosmic pattern)
//   - Tooltip: dark:bg-slate-800 → dark:bg-space-dust (cosmic pattern)
//   - Select: dark:bg-slate-800 → dark:bg-space-dust, focus:ring-stellar-cyan
//   - Pagination buttons: added 44px touch targets, dark:hover:bg-space-dust
//   - Page numbers: 32px → 44px touch targets
//   - Table row hover: dark:hover:bg-space-dust/50
// v3.9 (2026-01-29): Mode-aware amber badges for better light mode visibility
//   - QualityBadge YELLOW: now uses bg-amber-50 text-amber-800 border in light, solid amber in dark
//   - Opt-out message icon wells: kept solid bg-amber-600 dark:bg-amber-500 for proper icon contrast
//   - Opt-out badges: now use bg-amber-50 text-amber-800 border in light, solid amber in dark
// v3.8 (2026-01-29): Migrated orange colors to yellow
//   - QualityBadge YELLOW: orange-600/orange-500 → yellow-600/yellow-500
//   - Opt-out message icon wells: orange-600/orange-500 → yellow-600/yellow-500
//   - Opt-out badges: orange-600/orange-500 → yellow-600/yellow-500
// v3.7 (2026-01-29): Migrated amber colors to orange
//   - QualityBadge YELLOW: amber-600/amber-500 → orange-600/orange-500
//   - Opt-out message icon wells: amber-600/amber-500 → orange-600/orange-500
//   - Opt-out badges: amber-600/amber-500 → orange-600/orange-500
// v3.6 (2026-01-29): Solid color badges for WCAG AA compliance
//   - QualityBadge and TierBadge now use solid colors with white text
//   - Summary stat pills now use solid colors with white text
//   - Template category badges now use solid colors with white text
//   - Message type icon wells now use solid colors with white icons
//   - Message type badges now use solid colors with white text
// v3.5 (2026-01-09): Light background KPI cards (Hybrid Card Design)
//   - Changed KPICard variant from "gradient" to "default"
//   - Cards now use light backgrounds (bg-white dark:bg-slate-800)
//   - Icon containers retain gradient colors for visual accent
// v3.4 (2026-01-09): Design System v4.0 compliance
//   - Fixed text-[10px]/text-[11px] → text-xs (12px minimum)
//   - Fixed touch targets: mobile refresh button now min 44px
// v3.3 (2025-12-22): Added haptic feedback on interactive elements
// v3.2 (2025-12-19): Mobile sort asc/desc support
//   - Mobile sort: Split into field selector + direction toggle button
//   - Direction button: Green gradient with up/down chevron
//   - Tap field name to switch Data/Tipo, tap arrow to toggle asc/desc
// v3.1 (2025-12-19): Mobile filter/sort layout fix
//   - Mobile filter: Single pill container with flex-1 buttons (Todos, Sim, Não, Outro)
//   - Mobile sort: Compact toggle button showing current sort field
//   - Desktop: Clean separation of filter pills and sort controls
//   - Removed arrow icons from inactive sort buttons (cleaner look)
// v3.0 (2025-12-19): Received Messages filter/sort branding
//   - Filter pills: WhatsApp green gradient active state
//   - Mobile: 4-column grid layout with short labels (Interes., Opt-out)
//   - Desktop: Pill container with rounded-full design
//   - Sort controls: Matching pill container style
//   - SectionCard color: Changed from purple to green (WhatsApp brand)
// v2.9 (2025-12-19): Pagination consistency with BlacklistManager
//   - Added "Mostrar X por página" selector (5/10/25, default 10)
//   - Added "Mostrando X-Y de Z entradas" info with filter count
//   - Updated button styling: rounded-lg, transition-colors
//   - Page number buttons: w-8 h-8 with green-600 active state (WhatsApp brand)
//   - Select focus ring: green-500 (WhatsApp brand)
//   - Responsive layout: stacks vertically on mobile
// v2.8 (2025-12-19): Fixed pagination button icons
//   - Replaced double ChevronLeft/Right with ChevronsLeft/ChevronsRight icons
//   - Consistent p-1.5 padding on all pagination buttons
// v2.7 (2025-12-19): Mobile layout refinement for Received Answers table
//   - Fixed text-xs → text-xs (Design System compliance: min 12px)
//   - Restructured card layout: Name/Phone + Badge on top row
//   - Phone + Date on second row (only phone shown if name exists)
//   - Better spacing and visual hierarchy for narrow screens
// v2.6 (2025-12-19): Display customer name in Received Answers table
//   - Shows customer name (from customers table lookup) when available
//   - Name displayed prominently before phone number
//   - Phone becomes secondary text when name is present
// v2.5 (2025-12-19): Filter, sort, and pagination for Received Answers table
//   - Added filter pills: Todos, Interessados, Opt-out, Outros
//   - Added sort controls: Date (default desc), Type
//   - Added pagination: 10 items per page with numbered navigation
//   - Auto-reset to page 1 when filter changes
// v2.4 (2025-12-19): Fixed sync resilience with Promise.allSettled
//   - Changed from Promise.all to Promise.allSettled for sync operations
//   - WABA sync failure (500 error) no longer blocks Twilio sync
//   - Each sync service now runs independently and logs failures
// v2.3 (2025-12-19): Database-cached Twilio sync (aligned with WABA pattern)
//   - Now reads engagement/cost data from Supabase (fast) instead of Twilio API (slow)
//   - Uses api.twilio.getStoredEngagementAndCosts() for database reads
//   - Uses api.twilio.triggerSync() for manual sync button
//   - Falls back to direct API if database is empty (first-time load)
//   - Follows same pattern as WABA analytics and Instagram
// v2.2 (2025-12-19): Engagement & Cost Tracking (Twilio)
//   - Added engagement detection: positive button clicks, opt-outs, custom messages
//   - Added cost tracking: per-message cost from Twilio API
//   - New KPI cards: Engajamentos Positivos, Opt-outs, Taxa de Resposta, Custo Total
//   - New "Respostas Recebidas" section showing inbound messages with classification
//   - Uses api.twilio.getEngagementAndCosts() for real-time Twilio data
// v2.1 (2025-12-19): Date filter consistency with Instagram
//   - "Tudo" now fetches all available data (no hardcoded date limit)
//   - All KPIs and charts respond to the date filter
// v2.0 (2025-12-18): Date filter design consistency
//   - Pill-style date filter matching Instagram design
//   - WhatsApp green gradient for active state
// v1.9 (2025-12-18): Layout coherence with Instagram
//   - Removed redundant stats row from desktop (KPI cards show same data)
//   - Mobile: Removed badges, show date filter + sync time like Instagram
//   - Cleaner ProfileHeader with just name, phone, badges (desktop), about
// v1.8 (2025-12-18): Sync date display and label consistency
//   - Added last sync timestamp display (like Instagram tab)
//   - Changed button labels to "Atualizar" for consistency with Instagram
//   - Fetches status from API to show actual last sync time
// v1.7 (2025-12-18): Profile header similar to Instagram
//   - Added ProfileHeader component with business profile data
//   - Shows: verified name, phone number, quality rating, messaging tier, about
//   - Mobile and desktop responsive layouts
//   - WhatsApp green gradient branding
// v1.6 (2025-12-18): Fixed KPICard color props
//   - Changed from invalid gradientFrom/gradientTo to color prop
//   - Uses whatsapp, whatsappTeal, whatsappDark, whatsappRead from colorMapping.js
// v1.5 (2025-12-18): Layout and WhatsApp branding
//   - Message chart now full-width
//   - Funnel and Template table side-by-side on desktop
//   - WhatsApp green color theme (green→teal→cyan gradient)
//   - Updated section card colors (green/teal/emerald)
// v1.4 (2025-12-18): Table UX improvements
//   - Template names now readable: "lavpop_winback_desconto_hx..." → "Winback Desconto"
//   - Category badge inline with name (MKT/UTIL), consistent fuchsia color
//   - Center-aligned numeric columns (headers + data)
//   - Fixed column widths with table-fixed layout
// v1.3 (2025-12-18): Mobile responsiveness improvements
//   - Template table: hide Entregues/Lidas columns on mobile
//   - Shorter column headers for mobile (Env., % Ent., % Leit.)
//   - Template name constrained width (120px mobile, 200px desktop)
//   - Added tabular-nums for number alignment
//   - Edge-to-edge table on mobile (-mx-2)
// v1.2 (2025-12-18): Per-template analytics with READ metrics
//   - Added 4th KPI card: "Taxa de Leitura" (from template-level data)
//   - Added template analytics table with per-template metrics
//   - Read metrics now available via template analytics API
// v1.1 (2025-12-17): Updated for available data
//   - Message metrics: sent, delivered (read not available at account level)
//   - Daily trend chart for message volume
//   - Delivery funnel visualization
// v1.0 (2025-12-17): Initial implementation

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { haptics } from '../../utils/haptics';
import {
  MessageCircle,
  Send,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Calendar,
  ArrowRight,
  Loader2,
  Eye,
  ExternalLink,
  Phone,
  Shield,
  Zap,
  BadgeCheck,
  ThumbsUp,
  ThumbsDown,
  DollarSign,
  MessageSquare,
  Users,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// UI Components
import KPICard, { KPIGrid } from '../ui/KPICard';
import SectionCard from '../ui/SectionCard';
import BackgroundRefreshIndicator from '../ui/BackgroundRefreshIndicator';

// Services
import { api, getHeaders } from '../../utils/apiService';

// WhatsApp brand colors
const COLORS = {
  // WhatsApp greens
  waPrimary: '#25D366',    // WhatsApp green
  waDark: '#128C7E',       // Teal green
  waDeep: '#075E54',       // Deep teal
  waBubble: '#DCF8C6',     // Chat bubble green
  // Chart colors
  sent: '#25D366',         // WhatsApp green for sent
  delivered: '#128C7E',    // Teal for delivered
  read: '#075E54',         // Deep teal for read
  // Neutral
  gray: '#6b7280',
  lightGray: '#d1d5db'
};

// ==================== HELPER FUNCTIONS ====================

const formatNumber = (value) => {
  return new Intl.NumberFormat('pt-BR').format(value || 0);
};

const formatPercent = (value) => {
  return `${(value || 0).toFixed(1)}%`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

// Get date range based on filter
// Returns null for 'from' when 'all' is selected to fetch all available data
const getDateRange = (filter) => {
  const now = new Date();
  const to = now.toISOString().split('T')[0];

  let from;
  switch (filter) {
    case '7d':
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      break;
    case '30d':
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      break;
    case 'all':
    default:
      from = null; // No date limit - fetch all available data
      break;
  }

  return { from, to };
};

// Get message card styling based on engagement type
const getMessageCardClasses = (engagementType) => {
  const baseClasses = 'flex items-start gap-3 p-3 rounded-lg border';
  const variants = {
    button_positive: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    button_optout: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    other: 'bg-slate-50 dark:bg-space-dust border-slate-200 dark:border-stellar-cyan/10'
  };
  return `${baseClasses} ${variants[engagementType] || variants.other}`;
};

// ==================== DATE FILTER COMPONENT ====================

const DateFilter = ({ value, onChange }) => {
  const options = [
    { id: '7d', label: '7 dias' },
    { id: '30d', label: '30 dias' },
    { id: 'all', label: 'Tudo' }
  ];

  const handleChange = useCallback((id) => {
    haptics.tick();
    onChange(id);
  }, [onChange]);

  return (
    <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-full p-0.5">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => handleChange(option.id)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all min-h-[44px] flex items-center ${
            value === option.id
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

// ==================== QUALITY RATING BADGE ====================

const QualityBadge = ({ rating }) => {
  const config = {
    GREEN: { className: 'bg-emerald-600 dark:bg-emerald-500 text-white', label: 'Alta' },
    YELLOW: { className: 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500 dark:text-white dark:border-amber-400', label: 'Média' },
    RED: { className: 'bg-red-600 dark:bg-red-500 text-white', label: 'Baixa' }
  };
  const { className, label } = config[rating] || config.GREEN;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${className}`}>
      <Shield className="w-3 h-3" />
      {label}
    </span>
  );
};

// ==================== MESSAGING TIER BADGE ====================

const TierBadge = ({ tier }) => {
  const tierMap = {
    'TIER_250': '250/dia',
    'TIER_1K': '1K/dia',
    'TIER_10K': '10K/dia',
    'TIER_100K': '100K/dia',
    'UNLIMITED': 'Ilimitado'
  };
  const label = tierMap[tier] || tier || 'N/A';

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-600 dark:bg-blue-500 text-white">
      <Zap className="w-3 h-3" />
      {label}
    </span>
  );
};

// ==================== PROFILE HEADER ====================

const ProfileHeader = ({ profile, summary, dateFilter, onDateFilterChange, onRefresh, isSyncing, isLoading, lastSync }) => {
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}min`;
    return 'agora';
  };

  return (
    <div className="bg-white dark:bg-space-dust rounded-2xl border border-slate-200 dark:border-stellar-cyan/10 p-4 sm:p-5">
      {/* ===== MOBILE LAYOUT ===== */}
      <div className="sm:hidden">
        {/* Row 1: Avatar + Name + Refresh */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-green-400 via-emerald-500 to-teal-600 flex-shrink-0">
            {profile?.profilePictureUrl ? (
              <img src={profile.profilePictureUrl} alt={profile.verifiedName} className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-800" />
            ) : (
              <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center border-2 border-white dark:border-slate-800">
                <MessageCircle className="w-5 h-5 text-green-500" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">{profile?.verifiedName || 'WhatsApp Business'}</h2>
              {profile?.verifiedName && <BadgeCheck className="w-4 h-4 text-green-500 flex-shrink-0" />}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <Phone className="w-3 h-3" />
              <span>{profile?.displayPhoneNumber || 'N/A'}</span>
            </div>
          </div>
          <button onClick={() => { haptics.light(); onRefresh(); }} disabled={isSyncing} className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 disabled:opacity-50 text-white rounded-full shadow-md flex-shrink-0">
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {/* Row 2: About */}
        {profile?.about && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2">{profile.about}</p>}
        {/* Row 3: Date filter + Sync time (like Instagram) */}
        <div className="flex items-center justify-between mt-3 gap-2">
          <DateFilter value={dateFilter} onChange={onDateFilterChange} />
          <span className="text-slate-500 dark:text-slate-400 text-xs flex-shrink-0">{lastSync ? formatTimeAgo(lastSync) : ''}</span>
        </div>
      </div>

      {/* ===== DESKTOP LAYOUT ===== */}
      <div className="hidden sm:flex sm:items-start sm:gap-6">
        {/* Left: Large Avatar */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full p-[3px] bg-gradient-to-tr from-green-400 via-emerald-500 to-teal-600">
            {profile?.profilePictureUrl ? (
              <img src={profile.profilePictureUrl} alt={profile.verifiedName} className="w-full h-full rounded-full object-cover border-[3px] border-white dark:border-slate-800" />
            ) : (
              <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center border-[3px] border-white dark:border-slate-800">
                <MessageCircle className="w-8 h-8 text-green-500" />
              </div>
            )}
          </div>
        </div>

        {/* Center: Profile Info */}
        <div className="flex-1 min-w-0">
          {/* Name row */}
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{profile?.verifiedName || 'WhatsApp Business'}</h2>
            {profile?.verifiedName && <BadgeCheck className="w-5 h-5 text-green-500" />}
          </div>

          {/* Phone + Badges */}
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
              <Phone className="w-4 h-4 text-green-500" />
              {profile?.displayPhoneNumber || 'N/A'}
            </span>
            {profile?.qualityRating && <QualityBadge rating={profile.qualityRating} />}
            {profile?.messagingLimitTier && <TierBadge tier={profile.messagingLimitTier} />}
          </div>

          {/* About */}
          {profile?.about && (
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl line-clamp-2">{profile.about}</p>
          )}
        </div>

        {/* Right: Date filter */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <DateFilter value={dateFilter} onChange={onDateFilterChange} />
        </div>
      </div>

      {/* ===== SUMMARY BAR (shared) ===== */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {dateFilter === '7d' ? '7 dias' : dateFilter === '30d' ? '30 dias' : 'Todo período'}
          </span>
          {isLoading ? (
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Carregando...</span>
            </div>
          ) : summary ? (
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <span className="px-2 py-0.5 rounded-full bg-green-600 dark:bg-green-500 text-white font-medium text-xs sm:text-xs">
                Enviadas: {formatNumber(summary.totalSent || 0)}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-teal-600 dark:bg-teal-500 text-white font-medium text-xs sm:text-xs">
                Entregues: {formatNumber(summary.totalDelivered || 0)}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-600 dark:bg-cyan-500 text-white font-medium text-xs sm:text-xs">
                Lidas: {formatNumber(summary.totalRead || 0)}
              </span>
            </div>
          ) : (
            <span className="text-slate-500 dark:text-slate-400">Sem dados</span>
          )}
          {/* Desktop: Sync button and last sync time */}
          <div className="hidden sm:flex items-center gap-2 ml-auto">
            {lastSync && (
              <span className="text-slate-500 dark:text-slate-400 text-xs">Sync: {formatTimeAgo(lastSync)}</span>
            )}
            <button onClick={() => { haptics.light(); onRefresh(); }} disabled={isSyncing} className="px-3 py-1 flex items-center gap-1.5 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 disabled:opacity-50 text-white text-xs font-semibold rounded-full shadow-sm transition-all">
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== MESSAGE TREND CHART ====================

const MessageTrendChart = ({ data, isLoading }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map(d => ({
      date: formatDate(d.bucket_date),
      sent: d.sent || 0,
      delivered: d.delivered || 0
    }));
  }, [data]);

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-500 dark:text-slate-400 animate-spin" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-slate-500 dark:text-slate-400">
        <div className="text-center">
          <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Sem dados para o período selecionado</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white dark:bg-space-dust border border-slate-200 dark:border-stellar-cyan/10 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium text-slate-900 dark:text-white mb-1">{label}</p>
        <p style={{ color: COLORS.sent }}>
          Enviadas: {formatNumber(payload[0]?.payload?.sent)}
        </p>
        <p style={{ color: COLORS.delivered }}>
          Entregues: {formatNumber(payload[0]?.payload?.delivered)}
        </p>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.lightGray} opacity={0.3} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: COLORS.gray }}
          tickLine={false}
          axisLine={{ stroke: COLORS.lightGray }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: COLORS.gray }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="sent"
          stroke={COLORS.sent}
          strokeWidth={2}
          dot={{ fill: COLORS.sent, strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5, fill: COLORS.sent }}
        />
        <Line
          type="monotone"
          dataKey="delivered"
          stroke={COLORS.delivered}
          strokeWidth={2}
          dot={{ fill: COLORS.delivered, strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5, fill: COLORS.delivered }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

// ==================== DELIVERY FUNNEL ====================

const DeliveryFunnel = ({ summary, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const funnelData = [
    {
      label: 'Enviadas',
      value: summary?.totalSent || 0,
      color: COLORS.sent,
      icon: Send,
      percentage: 100
    },
    {
      label: 'Entregues',
      value: summary?.totalDelivered || 0,
      color: COLORS.delivered,
      icon: CheckCircle2,
      percentage: summary?.deliveryRate || 0
    }
  ];

  return (
    <div className="space-y-6">
      {funnelData.map((stage, index) => {
        const Icon = stage.icon;
        const width = Math.max(30, stage.percentage);

        return (
          <div key={stage.label} className="relative">
            {/* Arrow connector */}
            {index > 0 && (
              <div className="absolute -top-4 left-6 text-slate-300 dark:text-slate-600">
                <ArrowRight className="w-4 h-4 rotate-90" />
              </div>
            )}

            <div className="flex items-center gap-3">
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${stage.color}20` }}
              >
                <Icon className="w-5 h-5" style={{ color: stage.color }} />
              </div>

              {/* Bar and info */}
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {stage.label}
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {formatNumber(stage.value)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${width}%`,
                      backgroundColor: stage.color
                    }}
                  />
                </div>

                {/* Percentage */}
                {index > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {formatPercent(stage.percentage)} das enviadas
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const WhatsAppAnalytics = ({ onDateFilterChange: notifyParent }) => {
  const [dateFilter, setDateFilter] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);

  // Data states
  const [profile, setProfile] = useState(null);
  const [dailyMetrics, setDailyMetrics] = useState([]);
  const [messageSummary, setMessageSummary] = useState(null);
  const [templateData, setTemplateData] = useState({ templates: [], summary: null });
  const [lastSync, setLastSync] = useState(null);

  // v3.25: Engagement and cost data from Twilio
  const [engagementData, setEngagementData] = useState({
    engagements: [],
    optOuts: [],
    inboundMessages: [],
    costSummary: { outboundCount: 0, outboundCost: 0, inboundCount: 0, inboundCost: 0, currency: 'USD' }
  });
  const [engagementLoading, setEngagementLoading] = useState(true); // Start true so section shows while loading

  // v2.5: Inbound messages table state (filter, sort, pagination)
  const [inboundFilter, setInboundFilter] = useState('all'); // all, button_positive, button_optout, other
  const [inboundSort, setInboundSort] = useState({ field: 'dateSent', direction: 'desc' });
  const [inboundPage, setInboundPage] = useState(1);
  const [inboundPageSize, setInboundPageSize] = useState(10);
  const INBOUND_PAGE_SIZE_OPTIONS = [5, 10, 25];

  // Notify parent of date filter changes (for sibling components like TemplatePerformance)
  useEffect(() => {
    notifyParent?.(dateFilter);
  }, [dateFilter, notifyParent]);

  // Fetch profile and status (once on mount)
  const fetchProfileAndStatus = useCallback(async () => {
    try {
      const [profileData, statusData] = await Promise.all([
        api.waba.getProfile(),
        fetch('/.netlify/functions/waba-analytics?action=status', { headers: getHeaders() }).then(r => r.json())
      ]);
      setProfile(profileData);
      // Use template sync time as it's more relevant for analytics
      setLastSync(statusData?.lastTemplateSync || statusData?.lastSync || null);
    } catch (err) {
      console.error('Failed to fetch WABA profile/status:', err);
    }
  }, []);

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { from, to } = getDateRange(dateFilter);

      // Fetch message data and template analytics
      const [dailyRes, messagesRes, templateRes] = await Promise.all([
        api.waba.getDailyMetrics(from, to),
        api.waba.getMessages(from, to),
        api.waba.getTemplateAnalyticsSummary(from, to)
      ]);

      setDailyMetrics(dailyRes.metrics || []);
      setMessageSummary(messagesRes.summary);
      setTemplateData({
        templates: templateRes.templates || [],
        summary: templateRes.summary || null
      });
      // Don't update lastSync here - it should only reflect actual Meta API sync time
    } catch (err) {
      console.error('Failed to fetch WABA analytics:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter]);

  // v2.3: Fetch Twilio engagement and cost data from database (fast)
  // Falls back to direct API if database is empty
  const fetchEngagementData = useCallback(async () => {
    setEngagementLoading(true);
    try {
      const { from, to } = getDateRange(dateFilter);
      // For 'all' filter (from is null), use 90 days as default
      const dateFrom = from || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const dateTo = to || new Date().toISOString().split('T')[0];

      // First try to read from database (fast, cached)
      let result = await api.twilio.getStoredEngagementAndCosts(dateFrom, dateTo);

      // If database has data, use it
      if (result.inboundMessages?.length > 0 || result.costSummary?.outboundCount > 0) {
        setEngagementData(result);
      } else {
        // Database empty - fall back to direct API for first-time load
        const directResult = await api.twilio.getEngagementAndCosts({ dateSentAfter: dateFrom, pageSize: 200 });
        setEngagementData(directResult);

        // Trigger async sync to populate database for next time (non-blocking)
        api.twilio.triggerSync({ dateSentAfter: dateFrom, force: true }).catch(console.error);
      }
    } catch (err) {
      console.error('Failed to fetch Twilio engagement data:', err);
      // Don't set error state - engagement data is optional
    } finally {
      setEngagementLoading(false);
    }
  }, [dateFilter]);

  // Fetch profile and status once on mount
  useEffect(() => {
    fetchProfileAndStatus();
  }, [fetchProfileAndStatus]);

  // Fetch data on filter change
  useEffect(() => {
    fetchData();
    fetchEngagementData();
  }, [fetchData, fetchEngagementData]);

  // Manual sync handler - syncs WABA + Twilio data
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // Get date range for Twilio sync
      const { from } = getDateRange(dateFilter);
      const dateSentAfter = from || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Sync WABA analytics, templates, and Twilio engagement/costs in parallel
      // Use allSettled so one failure doesn't block the others (e.g., WABA 500 shouldn't block Twilio)
      const syncResults = await Promise.allSettled([
        api.waba.triggerSync(),
        api.waba.triggerTemplateSync(),
        api.twilio.triggerSync({ dateSentAfter, force: true })
      ]);

      // Log any sync failures for debugging
      syncResults.forEach((result, index) => {
        const syncNames = ['WABA', 'WABA Templates', 'Twilio'];
        if (result.status === 'rejected') {
          console.warn(`${syncNames[index]} sync failed:`, result.reason);
        }
      });

      // Refresh all data after sync (also use allSettled to be resilient)
      await Promise.allSettled([
        fetchData(),
        fetchEngagementData(),
        fetchProfileAndStatus()
      ]);
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Calculate KPIs from message data + template summary
  const kpis = useMemo(() => {
    return {
      totalSent: messageSummary?.totalSent || 0,
      totalDelivered: messageSummary?.totalDelivered || 0,
      deliveryRate: messageSummary?.deliveryRate || 0,
      // Read rate from template analytics (only available at template level)
      readRate: templateData.summary?.readRate || 0,
      totalRead: templateData.summary?.totalRead || 0
    };
  }, [messageSummary, templateData.summary]);

  // v3.25: Calculate engagement KPIs from Twilio data
  const engagementKpis = useMemo(() => {
    const { engagements, optOuts, inboundMessages, costSummary } = engagementData;
    const positiveCount = engagements.length;
    const optOutCount = optOuts.length;
    const otherCount = inboundMessages.filter(m => m.engagementType === 'other').length;
    const totalResponses = inboundMessages.length;

    // Calculate rates based on outbound messages in this period
    const outboundCount = costSummary.outboundCount || 0;
    const engagementRate = outboundCount > 0 ? (positiveCount / outboundCount) * 100 : 0;
    const optOutRate = outboundCount > 0 ? (optOutCount / outboundCount) * 100 : 0;
    const responseRate = outboundCount > 0 ? (totalResponses / outboundCount) * 100 : 0;

    // Cost metrics
    const totalCost = costSummary.outboundCost || 0;
    const costPerMessage = outboundCount > 0 ? totalCost / outboundCount : 0;

    return {
      positiveCount,
      optOutCount,
      otherCount,
      totalResponses,
      engagementRate,
      optOutRate,
      responseRate,
      outboundCount,
      totalCost,
      costPerMessage,
      currency: costSummary.currency || 'USD'
    };
  }, [engagementData]);

  // Check if we have any data
  const hasData = dailyMetrics.length > 0 || messageSummary?.totalSent > 0;
  const hasEngagementData = engagementData.inboundMessages.length > 0 || engagementData.costSummary.outboundCount > 0;

  // v2.5: Filter, sort, and paginate inbound messages
  const processedInboundMessages = useMemo(() => {
    let messages = [...engagementData.inboundMessages];

    // Filter by engagement type
    if (inboundFilter !== 'all') {
      messages = messages.filter(m => m.engagementType === inboundFilter);
    }

    // Sort
    messages.sort((a, b) => {
      let aVal, bVal;
      if (inboundSort.field === 'dateSent') {
        aVal = new Date(a.dateSent).getTime();
        bVal = new Date(b.dateSent).getTime();
      } else if (inboundSort.field === 'type') {
        // Sort order: button_positive, button_optout, other
        const typeOrder = { button_positive: 0, button_optout: 1, other: 2 };
        aVal = typeOrder[a.engagementType] ?? 3;
        bVal = typeOrder[b.engagementType] ?? 3;
      } else if (inboundSort.field === 'phone') {
        aVal = a.phone || '';
        bVal = b.phone || '';
      }
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return inboundSort.direction === 'asc' ? cmp : -cmp;
    });

    // Calculate pagination
    const totalPages = Math.ceil(messages.length / inboundPageSize);
    const startIdx = (inboundPage - 1) * inboundPageSize;
    const endIdx = Math.min(startIdx + inboundPageSize, messages.length);
    const paginatedMessages = messages.slice(startIdx, endIdx);

    return {
      messages: paginatedMessages,
      totalCount: messages.length,
      totalPages,
      currentPage: inboundPage,
      startIdx: startIdx + 1,
      endIdx
    };
  }, [engagementData.inboundMessages, inboundFilter, inboundSort, inboundPage, inboundPageSize]);

  // Reset page when filter changes
  useEffect(() => {
    setInboundPage(1);
  }, [inboundFilter]);

  // Create summary for ProfileHeader
  const profileSummary = useMemo(() => ({
    totalSent: kpis.totalSent,
    totalDelivered: kpis.totalDelivered,
    totalRead: kpis.totalRead,
    deliveryRate: kpis.deliveryRate,
    readRate: kpis.readRate
  }), [kpis]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Profile Header */}
      <ProfileHeader
        profile={profile}
        summary={profileSummary}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        onRefresh={handleSync}
        isSyncing={isSyncing}
        isLoading={isLoading}
        lastSync={lastSync}
      />

      {/* Error state */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !hasData && !error && (
        <SectionCard>
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-slate-500 dark:text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              Nenhum dado disponível
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4 max-w-md mx-auto">
              Os dados do WhatsApp Business serão sincronizados automaticamente a cada 4 horas.
              Clique em "Atualizar" para buscar os dados agora.
            </p>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Atualizando...' : 'Atualizar Agora'}
            </button>
          </div>
        </SectionCard>
      )}

      {/* KPI Cards - WhatsApp green theme */}
      {(hasData || isLoading) && (
        <KPIGrid columns={4}>
          <KPICard
            label="Mensagens Enviadas"
            value={formatNumber(kpis.totalSent)}
            icon={Send}
            variant="default"
            color="whatsapp"
            isLoading={isLoading}
            subtitle="Total no período"
          />
          <KPICard
            label="Mensagens Entregues"
            value={formatNumber(kpis.totalDelivered)}
            icon={CheckCircle2}
            variant="default"
            color="whatsappTeal"
            isLoading={isLoading}
            subtitle="Chegaram ao destinatário"
          />
          <KPICard
            label="Taxa de Entrega"
            value={formatPercent(kpis.deliveryRate)}
            icon={TrendingUp}
            variant="default"
            color="whatsappDark"
            isLoading={isLoading}
            subtitle="Entregues / Enviadas"
          />
          <KPICard
            label="Taxa de Leitura"
            value={formatPercent(kpis.readRate)}
            icon={Eye}
            variant="default"
            color="whatsappRead"
            isLoading={isLoading}
            subtitle="Lidas / Entregues"
          />
        </KPIGrid>
      )}

      {/* Message Volume Chart - Full Width */}
      {(hasData || isLoading) && (
        <SectionCard
          title="Volume de Mensagens"
          subtitle="Enviadas e entregues por dia"
          icon={TrendingUp}
          color="green"
        >
          <MessageTrendChart data={dailyMetrics} isLoading={isLoading} />
        </SectionCard>
      )}

      {/* Delivery Funnel */}
      {(hasData || isLoading) && (
        <SectionCard
          title="Funil de Entrega"
          subtitle="Enviadas → Entregues"
          icon={Send}
          color="teal"
        >
          <DeliveryFunnel summary={messageSummary} isLoading={isLoading} />
        </SectionCard>
      )}

      {/* v3.25: Engagement & Cost Section */}
      {(hasEngagementData || engagementLoading) && (
        <>
          {/* Engagement KPI Cards */}
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-stellar-cyan/10">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Engajamento & Custos (Twilio)
            </h3>
            <KPIGrid columns={4}>
              <KPICard
                label="Engajamentos Positivos"
                value={engagementKpis.positiveCount}
                icon={ThumbsUp}
                variant="default"
                color="success"
                isLoading={engagementLoading}
                subtitle={`${formatPercent(engagementKpis.engagementRate)} das enviadas`}
              />
              <KPICard
                label="Opt-outs"
                value={engagementKpis.optOutCount}
                icon={ThumbsDown}
                variant="default"
                color="warning"
                isLoading={engagementLoading}
                subtitle={`${formatPercent(engagementKpis.optOutRate)} das enviadas`}
              />
              <KPICard
                label="Taxa de Resposta"
                value={formatPercent(engagementKpis.responseRate)}
                icon={Users}
                variant="default"
                color="purple"
                isLoading={engagementLoading}
                subtitle={`${engagementKpis.totalResponses} respostas`}
              />
              <KPICard
                label="Custo Total"
                value={`$${engagementKpis.totalCost.toFixed(2)}`}
                icon={DollarSign}
                variant="default"
                color="blue"
                isLoading={engagementLoading}
                subtitle={`$${engagementKpis.costPerMessage.toFixed(4)}/msg`}
              />
            </KPIGrid>
          </div>

          {/* Inbound Messages List - v2.5 with filter, sort, pagination */}
          {engagementData.inboundMessages.length > 0 && (
            <SectionCard
              title="Respostas Recebidas"
              subtitle={`${processedInboundMessages.totalCount} de ${engagementData.inboundMessages.length} mensagens`}
              icon={MessageSquare}
              color="green"
            >
              {/* Filter and Sort Controls */}
              <div className="flex flex-col gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                {/* Mobile: Filter row */}
                <div className="sm:hidden flex items-center gap-2">
                  <div className="flex-1 inline-flex bg-slate-100 dark:bg-slate-800 rounded-full p-0.5 gap-0.5">
                    {[
                      { value: 'all', short: 'Todos' },
                      { value: 'button_positive', short: 'Sim' },
                      { value: 'button_optout', short: 'Não' },
                      { value: 'other', short: 'Outro' }
                    ].map(({ value, short }) => (
                      <button
                        key={value}
                        onClick={() => { haptics.tick(); setInboundFilter(value); }}
                        className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded-full transition-all text-center active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-stellar-cyan focus:ring-offset-1 ${
                          inboundFilter === value
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        {short}
                      </button>
                    ))}
                  </div>
                  {/* Mobile sort: field selector + direction toggle */}
                  <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-full p-0.5">
                    <button
                      onClick={() => { haptics.tick(); setInboundSort(prev => ({
                        field: prev.field === 'dateSent' ? 'type' : 'dateSent',
                        direction: 'desc'
                      })); }}
                      className="px-2.5 py-1 text-xs font-semibold rounded-full text-slate-600 dark:text-slate-300 transition-all active:scale-[0.98]"
                    >
                      {inboundSort.field === 'dateSent' ? 'Data' : 'Tipo'}
                    </button>
                    <button
                      onClick={() => { haptics.tick(); setInboundSort(prev => ({
                        ...prev,
                        direction: prev.direction === 'desc' ? 'asc' : 'desc'
                      })); }}
                      className="p-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white transition-all active:scale-[0.98]"
                    >
                      {inboundSort.direction === 'desc' ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronUp className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Desktop: Filter + Sort in one row */}
                <div className="hidden sm:flex items-center justify-between gap-3">
                  {/* Filter pills */}
                  <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-full p-0.5 gap-0.5">
                    {[
                      { value: 'all', label: 'Todos' },
                      { value: 'button_positive', label: 'Interessados' },
                      { value: 'button_optout', label: 'Opt-out' },
                      { value: 'other', label: 'Outros' }
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => { haptics.tick(); setInboundFilter(value); }}
                        className={`px-3 py-1 text-xs font-semibold rounded-full transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-stellar-cyan focus:ring-offset-1 ${
                          inboundFilter === value
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Sort Controls */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Ordenar:</span>
                    <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-full p-0.5 gap-0.5">
                      {[
                        { field: 'dateSent', label: 'Data' },
                        { field: 'type', label: 'Tipo' }
                      ].map(({ field, label }) => (
                        <button
                          key={field}
                          onClick={() => { haptics.tick(); setInboundSort(prev => ({
                            field,
                            direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
                          })); }}
                          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-stellar-cyan focus:ring-offset-1 ${
                            inboundSort.field === field
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                        >
                          {label}
                          {inboundSort.field === field && (
                            inboundSort.direction === 'desc' ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronUp className="w-3 h-3" />
                            )
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages List */}
              <div className="space-y-2">
                {processedInboundMessages.messages.length === 0 ? (
                  <p className="text-sm text-center text-slate-500 dark:text-slate-400 py-8">
                    Nenhuma mensagem encontrada com este filtro
                  </p>
                ) : (
                  processedInboundMessages.messages.map((msg, idx) => (
                    <div
                      key={msg.messageSid || idx}
                      className={getMessageCardClasses(msg.engagementType)}
                    >
                      {/* Icon */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.engagementType === 'button_positive'
                          ? 'bg-green-600 dark:bg-green-500'
                          : msg.engagementType === 'button_optout'
                          ? 'bg-amber-600 dark:bg-amber-500'
                          : 'bg-slate-500 dark:bg-slate-600'
                      }`}>
                        {msg.engagementType === 'button_positive' ? (
                          <ThumbsUp className="w-4 h-4 text-white" />
                        ) : msg.engagementType === 'button_optout' ? (
                          <ThumbsDown className="w-4 h-4 text-white" />
                        ) : (
                          <MessageCircle className="w-4 h-4 text-white" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Header row: Name/Phone + Badge */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="min-w-0 flex-1">
                            {msg.customerName ? (
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-200 block truncate">
                                {msg.customerName}
                              </span>
                            ) : (
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-300 block">
                                {msg.phone?.replace(/^\+55/, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
                              </span>
                            )}
                          </div>
                          {/* Badge */}
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${
                            msg.engagementType === 'button_positive'
                              ? 'bg-green-600 dark:bg-green-500 text-white'
                              : msg.engagementType === 'button_optout'
                              ? 'bg-amber-600 dark:bg-amber-500 text-white'
                              : 'bg-slate-500 dark:bg-slate-600 text-white'
                          }`}>
                            {msg.engagementType === 'button_positive' ? 'Interessado' :
                             msg.engagementType === 'button_optout' ? 'Opt-out' : 'Outro'}
                          </span>
                        </div>
                        {/* Secondary info: Phone (if name shown) + Date */}
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                          {msg.customerName && (
                            <span>{msg.phone?.replace(/^\+55/, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}</span>
                          )}
                          <span>{new Date(msg.dateSent).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {/* Message body */}
                        <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                          {msg.body}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination Controls */}
              {processedInboundMessages.totalCount > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  {/* Items per page selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Mostrar</span>
                    <select
                      value={inboundPageSize}
                      onChange={(e) => {
                        setInboundPageSize(Number(e.target.value));
                        setInboundPage(1);
                      }}
                      className="px-2 py-1 text-sm bg-white dark:bg-space-dust border border-slate-200 dark:border-stellar-cyan/10 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-stellar-cyan"
                    >
                      {INBOUND_PAGE_SIZE_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <span className="text-xs text-slate-500 dark:text-slate-400">por página</span>
                  </div>

                  {/* Page info */}
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Mostrando {processedInboundMessages.startIdx}-{processedInboundMessages.endIdx} de {processedInboundMessages.totalCount} entradas
                    {processedInboundMessages.totalCount !== engagementData.inboundMessages.length && (
                      <span className="text-slate-400 dark:text-slate-400"> (filtrado de {engagementData.inboundMessages.length})</span>
                    )}
                  </div>

                  {/* Page navigation */}
                  {processedInboundMessages.totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setInboundPage(1)}
                        disabled={inboundPage === 1}
                        className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-space-dust disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Primeira página"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setInboundPage(p => Math.max(1, p - 1))}
                        disabled={inboundPage === 1}
                        className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-space-dust disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Página anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {/* Page numbers */}
                      <div className="flex items-center gap-1 mx-2">
                        {Array.from({ length: Math.min(5, processedInboundMessages.totalPages) }, (_, i) => {
                          let pageNum;
                          const total = processedInboundMessages.totalPages;
                          const current = processedInboundMessages.currentPage;

                          if (total <= 5) {
                            pageNum = i + 1;
                          } else if (current <= 3) {
                            pageNum = i + 1;
                          } else if (current >= total - 2) {
                            pageNum = total - 4 + i;
                          } else {
                            pageNum = current - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setInboundPage(pageNum)}
                              className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
                                pageNum === current
                                  ? 'bg-green-600 text-white'
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-space-dust'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setInboundPage(p => Math.min(processedInboundMessages.totalPages, p + 1))}
                        disabled={inboundPage === processedInboundMessages.totalPages}
                        className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-space-dust disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Próxima página"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setInboundPage(processedInboundMessages.totalPages)}
                        disabled={inboundPage === processedInboundMessages.totalPages}
                        className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-space-dust disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Última página"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </SectionCard>
          )}
        </>
      )}

      {/* Refresh overlay (during sync only) */}
      <BackgroundRefreshIndicator
        isRefreshing={isSyncing}
        variant="overlay"
        message="Atualizando WhatsApp..."
      />
    </div>
  );
};

export default WhatsAppAnalytics;
