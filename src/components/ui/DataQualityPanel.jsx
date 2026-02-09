// DataQualityPanel.jsx v1.0 - Data Quality & Observability Dashboard
// Shows data freshness, gap detection, upload history, and sync status
// Design System v6.4 compliant - Cosmic Precision
//
// FEATURES:
// - Data source status grid (POS, Instagram, WhatsApp, ML Model)
// - Transaction gap detection (missing business days in last 30 days)
// - Recent uploads timeline (last 10 uploads with status badges)
// - Relative timestamps with Brazilian timezone handling
// - Loading skeleton during fetch, null on total failure
//
// CHANGELOG:
// v1.0 (2026-02-09): Initial implementation
//   - 4-card data source status grid with freshness indicators
//   - Gap detection for missing business days (Mon-Sat)
//   - Recent uploads timeline with status color coding
//   - Cosmic Precision v6.4 card wrapper (Variant A)
//   - Portuguese labels, America/Sao_Paulo timezone
//   - Reduced motion support, responsive layout

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Database,
  Instagram,
  MessageSquare,
  Brain,
  AlertTriangle,
  CheckCircle,
  Clock,
  Upload,
  XCircle,
  RefreshCw,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
// useIsMobile available for future responsive refinements
// import { useIsMobile } from '../../hooks/useMediaQuery';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getSupabaseClient } from '../../utils/supabaseClient';
import { SPRING } from '../../constants/animations';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Freshness thresholds in milliseconds */
const FRESHNESS = {
  GOOD: 24 * 60 * 60 * 1000,       // < 24h = green
  WARNING: 72 * 60 * 60 * 1000     // 24-72h = amber, >72h = red
};

/** Brazilian timezone for all date formatting */
const BR_TZ = 'America/Sao_Paulo';

/** Status badge color mapping */
const STATUS_COLORS = {
  success: {
    dark: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    light: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  partial: {
    dark: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    light: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  failed: {
    dark: 'bg-red-500/15 text-red-400 border-red-500/20',
    light: 'bg-red-50 text-red-700 border-red-200'
  }
};

/** Upload type labels in Portuguese */
const UPLOAD_TYPE_LABELS = {
  manual: 'Manual',
  automated: 'Automatizado',
  sync: 'Sincronização'
};

/** Source labels in Portuguese */
const SOURCE_LABELS = {
  web_ui: 'Interface Web',
  github_actions: 'GitHub Actions',
  pos_automation: 'POS Automação'
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Formats a timestamp as relative time in Portuguese.
 * Example outputs: "agora", "5min atrás", "2h atrás", "3d atrás"
 * @param {string|Date} timestamp - ISO timestamp or Date object
 * @returns {string} Relative time string
 */
function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Nunca';

  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  if (isNaN(date.getTime())) return 'Inválido';

  const now = Date.now();
  const elapsed = now - date.getTime();

  if (elapsed < 0) return 'agora';

  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}min atrás`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d atrás`;

  const months = Math.floor(days / 30);
  return `${months}m atrás`;
}

/**
 * Formats a timestamp for display in Brazilian timezone (DD/MM HH:mm)
 * @param {string|Date} timestamp
 * @returns {string}
 */
function formatBrTimestamp(timestamp) {
  if (!timestamp) return '--';
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  if (isNaN(date.getTime())) return '--';

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: BR_TZ,
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/**
 * Formats a date as DD/MM/YYYY in Brazilian timezone
 * @param {string} dateStr - ISO date string (YYYY-MM-DD)
 * @returns {string}
 */
function formatBrDate(dateStr) {
  if (!dateStr) return '--';
  // Parse as local date to avoid timezone shifts on date-only strings
  const [year, month, day] = dateStr.split('-').map(Number);
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

/**
 * Gets the freshness level for a timestamp.
 * @param {string|Date|null} timestamp
 * @returns {'good'|'warning'|'critical'|'unknown'}
 */
function getFreshnessLevel(timestamp) {
  if (!timestamp) return 'unknown';
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  if (isNaN(date.getTime())) return 'unknown';

  const elapsed = Date.now() - date.getTime();
  if (elapsed < FRESHNESS.GOOD) return 'good';
  if (elapsed < FRESHNESS.WARNING) return 'warning';
  return 'critical';
}

/**
 * Returns the day of week (0=Sun ... 6=Sat) for a YYYY-MM-DD date string,
 * interpreting it as a Brazil calendar date.
 */
function getDayOfWeek(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * Loading skeleton for the panel (cosmic shimmer pattern).
 */
const PanelSkeleton = ({ isDark }) => (
  <div className="space-y-6">
    {/* Source grid skeleton */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={`skeleton-cosmic rounded-xl p-4 ${i > 0 ? `skeleton-stagger-${Math.min(i + 1, 3)}` : ''}`}
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className={`w-9 h-9 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-slate-200/60'}`} />
            <div className={`h-3.5 rounded w-16 ${isDark ? 'bg-slate-700/50' : 'bg-slate-200/60'}`} />
          </div>
          <div className={`h-3 rounded w-20 ${isDark ? 'bg-slate-700/30' : 'bg-slate-200/40'}`} />
        </div>
      ))}
    </div>
    {/* Gap detection skeleton */}
    <div className={`skeleton-cosmic rounded-xl p-4`}>
      <div className={`h-3.5 rounded w-40 mb-3 ${isDark ? 'bg-slate-700/50' : 'bg-slate-200/60'}`} />
      <div className={`h-3 rounded w-full ${isDark ? 'bg-slate-700/30' : 'bg-slate-200/40'}`} />
    </div>
    {/* Uploads skeleton */}
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className={`skeleton-cosmic rounded-xl p-3 ${i > 0 ? `skeleton-stagger-${Math.min(i + 1, 3)}` : ''}`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full ${isDark ? 'bg-slate-700/50' : 'bg-slate-200/60'}`} />
            <div className="flex-1 space-y-1.5">
              <div className={`h-3 rounded w-3/4 ${isDark ? 'bg-slate-700/40' : 'bg-slate-200/50'}`} />
              <div className={`h-2.5 rounded w-1/2 ${isDark ? 'bg-slate-700/30' : 'bg-slate-200/40'}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Single data source status card.
 */
const SourceStatusCard = ({ name, icon: Icon, lastSync, isDark, animationDelay, prefersReducedMotion }) => {
  const level = getFreshnessLevel(lastSync);

  const statusConfig = {
    good: {
      dot: isDark ? 'bg-emerald-400' : 'bg-emerald-500',
      ring: isDark ? 'ring-emerald-400/20' : 'ring-emerald-500/20',
      label: isDark ? 'text-emerald-400' : 'text-emerald-600',
      text: 'Atualizado'
    },
    warning: {
      dot: isDark ? 'bg-amber-400' : 'bg-amber-500',
      ring: isDark ? 'ring-amber-400/20' : 'ring-amber-500/20',
      label: isDark ? 'text-amber-400' : 'text-amber-600',
      text: 'Desatualizado'
    },
    critical: {
      dot: isDark ? 'bg-red-400' : 'bg-red-500',
      ring: isDark ? 'ring-red-400/20' : 'ring-red-500/20',
      label: isDark ? 'text-red-400' : 'text-red-600',
      text: 'Crítico'
    },
    unknown: {
      dot: isDark ? 'bg-slate-500' : 'bg-slate-400',
      ring: isDark ? 'ring-slate-500/20' : 'ring-slate-400/20',
      label: isDark ? 'text-slate-500' : 'text-slate-400',
      text: 'Sem dados'
    }
  };

  const status = statusConfig[level];

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...SPRING.SMOOTH, delay: animationDelay }}
      className={`
        rounded-xl p-3.5 sm:p-4 border
        ${isDark
          ? 'bg-space-dust/70 border-stellar-cyan/8 hover:border-stellar-cyan/15'
          : 'bg-white border-slate-200/80 hover:border-slate-300'}
        transition-colors duration-200
      `}
    >
      <div className="flex items-center gap-2.5 mb-2.5">
        {/* Icon container - glassmorphic */}
        <div className={`
          w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
          ${isDark
            ? 'bg-gradient-to-br from-white/5 to-white/10 border border-white/10'
            : 'bg-slate-100 border border-slate-200/50'}
        `}>
          <Icon className={`w-4 h-4 ${isDark ? 'text-stellar-cyan' : 'text-slate-600'}`} aria-hidden="true" />
        </div>
        <span className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {name}
        </span>
      </div>

      {/* Freshness indicator */}
      <div className="flex items-center gap-1.5">
        <span className={`relative flex h-2 w-2`}>
          {level === 'critical' && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${status.dot}`} />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ring-2 ${status.dot} ${status.ring}`} />
        </span>
        <span className={`text-[11px] font-medium ${status.label}`}>
          {formatRelativeTime(lastSync)}
        </span>
      </div>
    </motion.div>
  );
};

/**
 * Gap detection section.
 */
const GapDetection = ({ gaps, isDark, prefersReducedMotion }) => {
  const hasGaps = gaps && gaps.length > 0;

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING.SMOOTH, delay: 0.2 }}
    >
      {/* Section label */}
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className={`w-4 h-4 ${isDark ? 'text-stellar-cyan/60' : 'text-slate-400'}`} aria-hidden="true" />
        <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Integridade dos Dados (30 dias)
        </h4>
      </div>

      {hasGaps ? (
        <div className={`
          rounded-xl p-3.5 border
          ${isDark
            ? 'bg-amber-500/[0.06] border-amber-500/15'
            : 'bg-amber-50/60 border-amber-200/60'}
        `}>
          <div className="flex items-start gap-2 mb-2.5">
            <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} aria-hidden="true" />
            <p className={`text-xs font-medium ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
              {gaps.length} {gaps.length === 1 ? 'dia sem dados' : 'dias sem dados'} detectado{gaps.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 ml-6">
            {gaps.map((dateStr) => (
              <span
                key={dateStr}
                className={`
                  inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border
                  ${isDark
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                    : 'bg-amber-100 text-amber-800 border-amber-200'}
                `}
              >
                {formatBrDate(dateStr)}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className={`
          rounded-xl p-3.5 border
          ${isDark
            ? 'bg-emerald-500/[0.06] border-emerald-500/15'
            : 'bg-emerald-50/60 border-emerald-200/60'}
        `}>
          <div className="flex items-center gap-2">
            <CheckCircle className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} aria-hidden="true" />
            <p className={`text-xs font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
              Sem lacunas — dados completos nos últimos 30 dias
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

/**
 * Single upload timeline item.
 */
const UploadTimelineItem = ({ upload, isDark, animationDelay, prefersReducedMotion }) => {
  const statusKey = upload.status || 'success';
  const colors = STATUS_COLORS[statusKey] || STATUS_COLORS.success;
  const colorSet = isDark ? colors.dark : colors.light;

  const StatusIcon = statusKey === 'success' ? CheckCircle
    : statusKey === 'partial' ? AlertCircle
    : XCircle;

  const statusLabel = statusKey === 'success' ? 'Sucesso'
    : statusKey === 'partial' ? 'Parcial'
    : 'Falha';

  const totalRecords = (upload.records_inserted || 0) + (upload.records_updated || 0);
  const typeLabel = UPLOAD_TYPE_LABELS[upload.upload_type] || upload.upload_type || '--';
  const sourceLabel = SOURCE_LABELS[upload.source] || upload.source || '';

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...SPRING.SMOOTH, delay: animationDelay }}
      className={`
        flex items-center gap-3 px-3.5 py-2.5 rounded-xl border
        ${isDark
          ? 'bg-space-dust/40 border-stellar-cyan/5 hover:border-stellar-cyan/10'
          : 'bg-white/60 border-slate-100 hover:border-slate-200'}
        transition-colors duration-150
      `}
    >
      {/* Status icon */}
      <StatusIcon
        className={`w-4 h-4 flex-shrink-0 ${
          statusKey === 'success'
            ? (isDark ? 'text-emerald-400' : 'text-emerald-500')
            : statusKey === 'partial'
              ? (isDark ? 'text-amber-400' : 'text-amber-500')
              : (isDark ? 'text-red-400' : 'text-red-500')
        }`}
        aria-hidden="true"
      />

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {typeLabel}
          </span>
          {sourceLabel && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-500'}`}>
              {sourceLabel}
            </span>
          )}
        </div>
        <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {totalRecords > 0 && (
            <span>{totalRecords.toLocaleString('pt-BR')} registro{totalRecords !== 1 ? 's' : ''}</span>
          )}
          {upload.records_skipped > 0 && (
            <span className="ml-1.5">({upload.records_skipped} ignorado{upload.records_skipped !== 1 ? 's' : ''})</span>
          )}
        </div>
      </div>

      {/* Status badge */}
      <span className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border flex-shrink-0
        ${colorSet}
      `}>
        {statusLabel}
      </span>

      {/* Timestamp */}
      <span className={`text-[10px] flex-shrink-0 tabular-nums ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        {formatBrTimestamp(upload.started_at)}
      </span>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * DataQualityPanel - Data Quality & Observability Dashboard
 *
 * Shows data freshness, gap detection, upload history, and sync status.
 *
 * @param {string} [className] - Additional CSS classes for the outer container
 */
const DataQualityPanel = ({ className = '' }) => {
  const { isDark } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data state
  const [uploads, setUploads] = useState([]);
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [settings, setSettings] = useState(null);
  const [latestTxDate, setLatestTxDate] = useState(null);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const client = await getSupabaseClient();
      if (!client) {
        setError('Supabase não configurado');
        setLoading(false);
        return;
      }

      // Calculate 30 days ago in Brazil time
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

      // Run all queries in parallel
      const [uploadsRes, revenueRes, settingsRes, latestTxRes] = await Promise.allSettled([
        // 1. Upload history (last 10)
        client
          .from('upload_history')
          .select('id, upload_type, file_type, status, records_inserted, records_updated, records_skipped, errors, started_at, completed_at, source')
          .order('started_at', { ascending: false })
          .limit(10),

        // 2. Daily revenue for gap detection (last 30 days)
        client
          .from('daily_revenue')
          .select('date, transactions, total_revenue')
          .gte('date', thirtyDaysAgoStr)
          .order('date', { ascending: true }),

        // 3. App settings for sync timestamps
        client
          .from('app_settings')
          .select('instagram_last_sync, waba_template_last_sync, revenue_model_last_trained')
          .eq('id', 'default')
          .single(),

        // 4. Latest transaction date
        client
          .from('transactions')
          .select('data_hora')
          .order('data_hora', { ascending: false })
          .limit(1)
          .single()
      ]);

      // Track how many queries succeeded
      let successCount = 0;

      if (uploadsRes.status === 'fulfilled' && uploadsRes.value.data) {
        setUploads(uploadsRes.value.data);
        successCount++;
      }

      if (revenueRes.status === 'fulfilled' && revenueRes.value.data) {
        setDailyRevenue(revenueRes.value.data);
        successCount++;
      }

      if (settingsRes.status === 'fulfilled' && settingsRes.value.data) {
        setSettings(settingsRes.value.data);
        successCount++;
      }

      if (latestTxRes.status === 'fulfilled' && latestTxRes.value.data) {
        setLatestTxDate(latestTxRes.value.data.data_hora);
        successCount++;
      }

      // Return null if ALL queries failed
      if (successCount === 0) {
        setError('Todos os dados falharam ao carregar');
      }
    } catch (err) {
      console.error('[DataQualityPanel] Fetch error:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh timer — update relative timestamps every minute
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(n => n + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  /** Detect missing business days (Mon-Sat) with 0 transactions */
  const gaps = useMemo(() => {
    if (!dailyRevenue || dailyRevenue.length === 0) return [];

    // Build a set of dates that have data
    const datesWithData = new Set(dailyRevenue.map(d => d.date));

    // Generate all business days in the last 30 days
    const today = new Date();
    const missingDates = [];

    for (let i = 30; i >= 1; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = getDayOfWeek(dateStr);

      // Skip Sundays (day 0) — laundromat is closed
      if (dayOfWeek === 0) continue;

      // Check if this business day has data
      if (!datesWithData.has(dateStr)) {
        missingDates.push(dateStr);
      }
    }

    // Also check dates in the data that have 0 transactions (uploaded but empty)
    dailyRevenue.forEach(row => {
      const dayOfWeek = getDayOfWeek(row.date);
      if (dayOfWeek !== 0 && (row.transactions === 0 || row.transactions === null)) {
        if (!missingDates.includes(row.date)) {
          missingDates.push(row.date);
        }
      }
    });

    return missingDates.sort();
  }, [dailyRevenue]);

  /** Data source definitions with resolved sync timestamps */
  const dataSources = useMemo(() => [
    {
      name: 'POS',
      icon: Database,
      lastSync: latestTxDate
    },
    {
      name: 'Instagram',
      icon: Instagram,
      lastSync: settings?.instagram_last_sync
    },
    {
      name: 'WhatsApp',
      icon: MessageSquare,
      lastSync: settings?.waba_template_last_sync
    },
    {
      name: 'Modelo ML',
      icon: Brain,
      lastSync: settings?.revenue_model_last_trained
    }
  ], [latestTxDate, settings]);

  // ---------------------------------------------------------------------------
  // Return null if all queries failed
  // ---------------------------------------------------------------------------

  if (error && !uploads.length && !dailyRevenue.length && !settings && !latestTxDate) {
    return null;
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      className={`
        bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-space-dust dark:via-space-dust dark:to-space-nebula/30
        rounded-xl
        border border-slate-200/80 dark:border-stellar-cyan/10
        shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[inset_0_1px_0_0_rgba(0,174,239,0.05)]
        p-4 sm:p-5
        ${className}
      `}
      role="region"
      aria-label="Qualidade dos Dados"
    >
      {/* Panel header */}
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div className="flex items-center gap-2.5">
          <div className={`
            w-9 h-9 rounded-lg flex items-center justify-center
            ${isDark
              ? 'bg-gradient-to-br from-white/5 to-white/10 border border-white/10'
              : 'bg-slate-100 border border-slate-200/50'}
          `}>
            <ShieldCheck className={`w-4.5 h-4.5 ${isDark ? 'text-stellar-cyan' : 'text-slate-600'}`} aria-hidden="true" />
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Qualidade dos Dados
            </h3>
            <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Frescor, integridade e histórico de uploads
            </p>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={fetchData}
          disabled={loading}
          className={`
            p-2 rounded-lg transition-colors duration-200 cursor-pointer
            ${isDark
              ? 'text-slate-500 hover:text-stellar-cyan hover:bg-white/5'
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}
            disabled:opacity-40 disabled:cursor-not-allowed
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan/50 focus-visible:ring-offset-2
            ${isDark ? 'focus-visible:ring-offset-space-dust' : 'focus-visible:ring-offset-white'}
          `}
          aria-label="Atualizar dados de qualidade"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <PanelSkeleton isDark={isDark} />
      ) : (
        <div className="space-y-5 sm:space-y-6">
          {/* Section 1: Data Source Status Grid */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className={`w-3.5 h-3.5 ${isDark ? 'text-stellar-cyan/50' : 'text-slate-400'}`} aria-hidden="true" />
              <h4 className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Fontes de Dados
              </h4>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {dataSources.map((source, i) => (
                <SourceStatusCard
                  key={source.name}
                  name={source.name}
                  icon={source.icon}
                  lastSync={source.lastSync}
                  isDark={isDark}
                  animationDelay={prefersReducedMotion ? 0 : i * 0.06}
                  prefersReducedMotion={prefersReducedMotion}
                />
              ))}
            </div>
          </div>

          {/* Section 2: Gap Detection */}
          <GapDetection
            gaps={gaps}
            isDark={isDark}
            prefersReducedMotion={prefersReducedMotion}
          />

          {/* Section 3: Recent Uploads Timeline */}
          {uploads.length > 0 && (
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING.SMOOTH, delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Upload className={`w-3.5 h-3.5 ${isDark ? 'text-stellar-cyan/50' : 'text-slate-400'}`} aria-hidden="true" />
                <h4 className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Uploads Recentes
                </h4>
              </div>
              <div className="space-y-1.5">
                {uploads.map((upload, i) => (
                  <UploadTimelineItem
                    key={upload.id}
                    upload={upload}
                    isDark={isDark}
                    animationDelay={prefersReducedMotion ? 0 : 0.35 + (i * 0.04)}
                    prefersReducedMotion={prefersReducedMotion}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Empty state — no uploads at all */}
          {uploads.length === 0 && (
            <div className={`
              text-center py-6 rounded-xl border border-dashed
              ${isDark
                ? 'text-slate-500 border-stellar-cyan/10'
                : 'text-slate-400 border-slate-200'}
            `}>
              <Upload className="w-6 h-6 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-medium">Nenhum upload registrado</p>
              <p className="text-[11px] mt-0.5 opacity-70">
                Uploads aparecerão aqui quando dados forem importados
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataQualityPanel;
