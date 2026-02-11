// TemplatePerformance.jsx v1.0 - WhatsApp Template Performance Analytics
// Per-template read rates, trends, and best performer highlight
// Design System v6.4 compliant - Cosmic Precision
//
// DATA SOURCE:
// - twilio_template_performance (per-template per-day metrics from Twilio webhooks)
//
// FEATURES:
// - Summary KPI cards (total templates, avg read rate, best read rate, total sent)
// - Best template highlight card with green glow accent
// - Per-template metrics table (desktop) / card list (mobile)
// - Inline sparklines showing read rate trend over time per template
// - Color-coded progress bars (green >50%, amber 30-50%, red <30%)
// - Portuguese labels (Brazilian app)
//
// CHANGELOG:
// v1.0 (2026-02-09): Initial implementation
//   - Fetches from twilio_template_performance
//   - Groups rows by template_name, aggregates sent/delivered/read
//   - KPI summary row with 4 cards
//   - Best template highlight card with green glow
//   - Inline Recharts sparklines per template
//   - Responsive table (desktop) / card list (mobile)
//   - Skeleton loading state, null on empty data

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MessageSquare, Award, Send, Eye, CheckCheck, Info, TrendingUp, BarChart3 } from 'lucide-react';
import { LineChart, Line } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { getSupabaseClient } from '../../utils/supabaseClient';

// ---------------------------------------------------------------------------
// Constants & Formatters
// ---------------------------------------------------------------------------

const NUMBER_FMT = new Intl.NumberFormat('pt-BR');

const PERCENT_FMT = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});

/** Minimum delivered count to qualify for "best template" */
const MIN_DELIVERED_FOR_BEST = 10;

/** Read rate color thresholds */
const READ_RATE_GREEN = 50;
const READ_RATE_AMBER = 30;

/**
 * Get the color class for a read rate value
 */
function getReadRateColor(rate) {
  if (rate >= READ_RATE_GREEN) return 'green';
  if (rate >= READ_RATE_AMBER) return 'amber';
  return 'red';
}

/**
 * Get Tailwind classes for progress bar fill based on read rate tier
 */
function getProgressBarFill(tier, isDark) {
  switch (tier) {
    case 'green':
      return isDark ? 'bg-emerald-500' : 'bg-emerald-500';
    case 'amber':
      return isDark ? 'bg-amber-500' : 'bg-amber-500';
    case 'red':
      return isDark ? 'bg-red-500' : 'bg-red-500';
    default:
      return isDark ? 'bg-slate-500' : 'bg-slate-400';
  }
}

/**
 * Get Tailwind text color classes for read rate tier
 */
function getReadRateTextColor(tier) {
  switch (tier) {
    case 'green':
      return 'text-emerald-600 dark:text-emerald-400';
    case 'amber':
      return 'text-amber-600 dark:text-amber-400';
    case 'red':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-slate-600 dark:text-slate-400';
  }
}

/**
 * Humanize a template name for display
 * e.g. "reativacao_7dias_v2" -> "Reativacao 7dias V2"
 */
function humanizeTemplateName(name) {
  if (!name) return '--';
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Skeleton placeholder while data loads */
const LoadingSkeleton = ({ isDark }) => (
  <div
    className={`
      ${isDark ? 'bg-space-dust/40' : 'bg-white/80'}
      backdrop-blur-xl rounded-2xl p-5
      ${isDark
        ? 'ring-1 ring-white/[0.05]'
        : 'ring-1 ring-slate-200/80'}
      overflow-hidden
    `}
  >
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-10 h-10 rounded-xl animate-pulse ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
      <div className="flex-1 space-y-2">
        <div className={`h-4 w-56 rounded animate-pulse ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
        <div className={`h-3 w-36 rounded animate-pulse ${isDark ? 'bg-slate-700/60' : 'bg-slate-200/70'}`} />
      </div>
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      {[...Array(4)].map((_, i) => (
        <div key={i} className={`h-20 rounded-xl animate-pulse ${isDark ? 'bg-slate-700/40' : 'bg-slate-100'}`} />
      ))}
    </div>
    <div className={`h-28 rounded-xl animate-pulse mb-5 ${isDark ? 'bg-slate-700/30' : 'bg-slate-100/80'}`} />
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className={`h-14 rounded-lg animate-pulse ${isDark ? 'bg-slate-700/30' : 'bg-slate-100/80'}`} />
      ))}
    </div>
  </div>
);

/** Inline sparkline for a template's read rate trend */
const ReadRateSparkline = ({ data, tier, isDark }) => {
  if (!data || data.length < 2) return null;

  const strokeColor = (() => {
    switch (tier) {
      case 'green': return isDark ? '#34d399' : '#10b981';
      case 'amber': return isDark ? '#fbbf24' : '#f59e0b';
      case 'red':   return isDark ? '#f87171' : '#ef4444';
      default:      return isDark ? '#94a3b8' : '#64748b';
    }
  })();

  return (
    <div className="w-20 h-8 flex-shrink-0">
      <LineChart width={80} height={32} data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line
          type="monotone"
          dataKey="readRate"
          stroke={strokeColor}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </div>
  );
};

/** Read rate progress bar */
const ReadRateBar = ({ rate, isDark }) => {
  const tier = getReadRateColor(rate);
  const fillClass = getProgressBarFill(tier, isDark);
  const clampedWidth = Math.min(100, Math.max(0, rate));

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div
        className={`
          flex-1 h-2 rounded-full overflow-hidden
          ${isDark ? 'bg-white/[0.06]' : 'bg-slate-200/80'}
        `}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${fillClass}`}
          style={{ width: `${clampedWidth}%` }}
        />
      </div>
      <span className={`text-xs font-semibold tabular-nums whitespace-nowrap ${getReadRateTextColor(tier)}`}>
        {PERCENT_FMT.format(rate)}%
      </span>
    </div>
  );
};

/** Best template highlight card */
const BestTemplateCard = ({ template, isDark, isDesktop }) => {
  if (!template) return null;

  const tier = getReadRateColor(template.readRate);

  return (
    <div
      className={`
        relative p-4 rounded-xl mb-5 overflow-hidden
        ${isDark
          ? 'bg-gradient-to-br from-emerald-950/40 via-space-dust to-space-nebula/30 ring-1 ring-emerald-500/20 shadow-[0_0_24px_-6px_rgba(0,214,143,0.15)]'
          : 'bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/30 ring-1 ring-emerald-200/60 shadow-[0_0_24px_-6px_rgba(16,185,129,0.12)]'}
      `}
    >
      {/* Subtle glow accent */}
      <div
        className={`
          absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none
          ${isDark ? 'bg-emerald-500' : 'bg-emerald-400'}
        `}
        aria-hidden="true"
      />

      <div className="relative flex items-start gap-3">
        {/* Award icon */}
        <div className="w-10 h-10 rounded-xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center shadow-sm shrink-0">
          <Award className="w-5 h-5 text-white" aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-medium tracking-wider text-emerald-700 dark:text-emerald-400">
              Melhor Template
            </p>
          </div>
          <h4 className={`${isDesktop ? 'text-base' : 'text-sm'} font-bold text-slate-900 dark:text-white truncate`}>
            {humanizeTemplateName(template.templateName)}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {template.category || 'Sem categoria'}
          </p>

          {/* Metrics row */}
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Enviadas</p>
              <p className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                {NUMBER_FMT.format(template.totalSent)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Entregues</p>
              <p className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                {NUMBER_FMT.format(template.totalDelivered)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Taxa Leitura</p>
              <p className={`text-sm font-bold tabular-nums ${getReadRateTextColor(tier)}`}>
                {PERCENT_FMT.format(template.readRate)}%
              </p>
            </div>
          </div>

          {/* Read rate bar */}
          <div className="mt-3">
            <ReadRateBar rate={template.readRate} isDark={isDark} />
          </div>
        </div>

        {/* Sparkline on the right */}
        {template.trend && template.trend.length >= 2 && (
          <div className="hidden sm:block">
            <ReadRateSparkline data={template.trend} tier={tier} isDark={isDark} />
          </div>
        )}
      </div>
    </div>
  );
};

/** Mobile card for a single template */
const TemplateCard = ({ template, isBest, isDark }) => {
  const tier = getReadRateColor(template.readRate);

  return (
    <div
      className={`
        p-4 rounded-xl
        ${isBest ? 'border-l-[3px] border-l-emerald-500' : ''}
        ${isDark
          ? 'bg-gradient-to-br from-space-dust via-space-dust to-space-nebula/30 ring-1 ring-white/[0.08] shadow-[inset_0_1px_0_0_rgba(0,174,239,0.05)]'
          : 'bg-gradient-to-br from-white via-white to-slate-50/50 ring-1 ring-slate-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]'}
        shadow-sm
      `}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[70%]">
          {humanizeTemplateName(template.templateName)}
        </span>
        {isBest && (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <Award className="w-3.5 h-3.5" aria-hidden="true" />
            Melhor
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        {template.category || 'Sem categoria'}
      </p>

      {/* Read rate bar */}
      <div className="mb-3">
        <ReadRateBar rate={template.readRate} isDark={isDark} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div>
          <span className="text-slate-500 dark:text-slate-400">Enviadas</span>
          <p className="font-semibold text-slate-900 dark:text-white tabular-nums">
            {NUMBER_FMT.format(template.totalSent)}
          </p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Entregues</span>
          <p className="font-semibold text-slate-900 dark:text-white tabular-nums">
            {NUMBER_FMT.format(template.totalDelivered)}
          </p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Lidas</span>
          <p className="font-semibold text-slate-900 dark:text-white tabular-nums">
            {NUMBER_FMT.format(template.totalRead)}
          </p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Taxa Entrega</span>
          <p className="font-semibold text-slate-900 dark:text-white tabular-nums">
            {PERCENT_FMT.format(template.deliveryRate)}%
          </p>
        </div>
      </div>

      {/* Sparkline */}
      {template.trend && template.trend.length >= 2 && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">Tendencia</span>
          <ReadRateSparkline data={template.trend} tier={tier} isDark={isDark} />
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const TemplatePerformance = ({ className = '', dateFilter = 'all', refreshKey = 0 }) => {
  const { isDark } = useTheme();
  const isMobile = useIsMobile();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // State
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // usingFallback is derived from processedData (not a separate state)

  // -----------------------------------------------------------------------
  // Data fetching
  // -----------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const client = await getSupabaseClient();
      if (!client) {
        setError('Supabase nao configurado');
        return;
      }

      // Always fetch all data — date filtering happens client-side with fallback
      // (Template analytics has sparse data; server-side filter may return empty)
      const { data, error: fetchError } = await client
        .from('twilio_template_performance')
        .select('*')
        .order('bucket_date', { ascending: false })
        .limit(500);

      if (fetchError) throw fetchError;

      setRawData(data || []);
    } catch (err) {
      console.error('[TemplatePerformance] Fetch error:', err);
      setError(err.message || 'Erro ao carregar dados de templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  // -----------------------------------------------------------------------
  // Derived data: group by template_name, aggregate metrics, compute trends
  // -----------------------------------------------------------------------

  const processedData = useMemo(() => {
    if (!rawData.length) return { templates: [], isFallback: false };

    // Client-side date filtering with fallback to all data
    let filteredData = rawData;
    let isFallback = false;

    if (dateFilter && dateFilter !== 'all') {
      const now = new Date();
      const days = dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : 0;
      if (days > 0) {
        const fromDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0];
        const dateFiltered = rawData.filter(r => r.bucket_date >= fromDate);
        // Only use filtered data if it has non-zero metrics
        const hasNonZero = dateFiltered.some(r =>
          (Number(r.sent) || 0) + (Number(r.delivered) || 0) + (Number(r.read_count) || 0) > 0
        );
        if (hasNonZero) {
          filteredData = dateFiltered;
        } else {
          isFallback = true;
        }
      }
    }

    // Group rows by template_name
    const grouped = {};
    for (const row of filteredData) {
      const name = row.template_name;
      if (!name) continue;

      if (!grouped[name]) {
        grouped[name] = {
          templateName: name,
          templateId: row.template_id,
          category: row.category,
          status: row.status,
          totalSent: 0,
          totalDelivered: 0,
          totalRead: 0,
          dailyData: []
        };
      }

      const sent = Number(row.sent) || 0;
      const delivered = Number(row.delivered) || 0;
      const readCount = Number(row.read_count) || 0;

      grouped[name].totalSent += sent;
      grouped[name].totalDelivered += delivered;
      grouped[name].totalRead += readCount;

      // Collect daily data for sparkline (will sort later)
      if (row.bucket_date) {
        grouped[name].dailyData.push({
          date: row.bucket_date,
          sent,
          delivered,
          readCount
        });
      }
    }

    // Process each template: compute rates and sparkline trend
    const result = Object.values(grouped).map((t) => {
      const deliveryRate = t.totalSent > 0
        ? (t.totalDelivered / t.totalSent) * 100
        : 0;
      const readRate = t.totalDelivered > 0
        ? (t.totalRead / t.totalDelivered) * 100
        : 0;

      // Sort daily data ascending by date for sparkline
      const sortedDaily = t.dailyData
        .sort((a, b) => a.date.localeCompare(b.date));

      // Build sparkline data: per-day read rate
      const trend = sortedDaily.map((d) => ({
        date: d.date,
        readRate: d.delivered > 0 ? (d.readCount / d.delivered) * 100 : 0
      }));

      return {
        templateName: t.templateName,
        templateId: t.templateId,
        category: t.category,
        status: t.status,
        totalSent: t.totalSent,
        totalDelivered: t.totalDelivered,
        totalRead: t.totalRead,
        deliveryRate,
        readRate,
        trend
      };
    });

    // Sort by read rate descending (primary), then by total sent descending
    result.sort((a, b) => {
      if (b.readRate !== a.readRate) return b.readRate - a.readRate;
      return b.totalSent - a.totalSent;
    });

    return { templates: result, isFallback };
  }, [rawData, dateFilter]);

  const templates = processedData.templates;
  const usingFallback = processedData.isFallback;

  /** Best template: highest read rate among those with enough delivered messages */
  const bestTemplate = useMemo(() => {
    if (!templates.length) return null;

    const qualified = templates.filter((t) => t.totalDelivered >= MIN_DELIVERED_FOR_BEST);
    if (!qualified.length) return null;

    // Already sorted by readRate desc, so first qualified is the best
    return qualified[0];
  }, [templates]);

  /** Summary KPIs */
  const summary = useMemo(() => {
    if (!templates.length) return null;

    const totalTemplates = templates.length;
    const totalSent = templates.reduce((sum, t) => sum + t.totalSent, 0);
    const totalDelivered = templates.reduce((sum, t) => sum + t.totalDelivered, 0);
    const totalRead = templates.reduce((sum, t) => sum + t.totalRead, 0);

    // Overall average read rate (weighted by delivered count)
    const avgReadRate = totalDelivered > 0
      ? (totalRead / totalDelivered) * 100
      : 0;

    // Best read rate (from best template)
    const bestReadRate = bestTemplate ? bestTemplate.readRate : 0;

    return {
      totalTemplates,
      totalSent,
      totalDelivered,
      totalRead,
      avgReadRate,
      bestReadRate
    };
  }, [templates, bestTemplate]);

  /** Best template name for highlighting in the table */
  const bestTemplateName = bestTemplate?.templateName;

  /** Compute actual data date range for display */
  const dataDateRange = useMemo(() => {
    if (!rawData.length) return null;
    const dates = rawData
      .filter(r => (Number(r.sent) || 0) + (Number(r.delivered) || 0) + (Number(r.read_count) || 0) > 0)
      .map(r => r.bucket_date)
      .filter(Boolean)
      .sort();
    if (!dates.length) return null;
    const fmt = (d) => {
      const [y, m, day] = d.split('-');
      return `${day}/${m}`;
    };
    return { from: fmt(dates[0]), to: fmt(dates[dates.length - 1]) };
  }, [rawData]);

  // -----------------------------------------------------------------------
  // Render guards
  // -----------------------------------------------------------------------

  if (loading) return <LoadingSkeleton isDark={isDark} />;

  // Silently hide when no template data exists
  if (error || !templates.length || !summary) return null;

  // -----------------------------------------------------------------------
  // Style helpers
  // -----------------------------------------------------------------------

  const statCardClass = `
    p-4 rounded-xl
    ${isDark
      ? 'bg-gradient-to-br from-space-dust via-space-dust to-space-nebula/30 shadow-[inset_0_1px_0_0_rgba(0,174,239,0.05)]'
      : 'bg-gradient-to-br from-white via-white to-slate-50/50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]'}
    ring-1 ${isDark ? 'ring-white/[0.08]' : 'ring-slate-200'}
    shadow-sm
  `;

  const labelClass = `${isDesktop ? 'text-sm' : 'text-xs'} tracking-wider text-slate-500 dark:text-slate-400 mb-1`;
  const valueClass = `${isDesktop ? 'text-xl' : 'text-lg'} font-bold tabular-nums text-slate-900 dark:text-white`;

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div
      className={`
        ${isDark ? 'bg-space-dust/40' : 'bg-white/80'}
        backdrop-blur-xl rounded-2xl p-5
        ${isDark
          ? 'ring-1 ring-white/[0.05] shadow-[0_0_20px_-5px_rgba(0,174,239,0.12),inset_0_1px_1px_rgba(255,255,255,0.10)]'
          : 'ring-1 ring-slate-200/80 shadow-[0_8px_32px_-12px_rgba(100,116,139,0.15),inset_0_1px_0_rgba(255,255,255,0.8)]'}
        overflow-hidden
        ${className}
      `}
    >
      {/* ----------------------------------------------------------------- */}
      {/* HEADER                                                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-start justify-between gap-3 mb-5">
        {/* Left: Icon Badge + Title */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center shadow-sm shrink-0">
            <MessageSquare className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className={`${isDesktop ? 'text-base' : 'text-sm'} font-bold text-slate-800 dark:text-white`}>
              Performance de Templates
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {summary.totalTemplates} {summary.totalTemplates === 1 ? 'template' : 'templates'} &bull; {NUMBER_FMT.format(summary.totalSent)} enviadas
              {dataDateRange && ` \u00b7 ${dataDateRange.from} - ${dataDateRange.to}`}
              {usingFallback && (
                <span className="text-amber-500 dark:text-amber-400"> &bull; Exibindo todos os dados</span>
              )}
            </p>
          </div>
        </div>

        {/* Right: Avg Read Rate Badge */}
        <div
          className={`
            flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shrink-0
            backdrop-blur-sm ring-1
            ${summary.avgReadRate >= READ_RATE_GREEN
              ? 'bg-emerald-600 dark:bg-emerald-500 ring-emerald-700 dark:ring-emerald-400'
              : summary.avgReadRate >= READ_RATE_AMBER
                ? 'bg-amber-600 dark:bg-amber-500 ring-amber-700 dark:ring-amber-400'
                : 'bg-red-600 dark:bg-red-500 ring-red-700 dark:ring-red-400'}
          `}
        >
          <Eye className="w-3.5 h-3.5 text-white" aria-hidden="true" />
          <span className="text-xs font-medium text-white whitespace-nowrap">
            {PERCENT_FMT.format(summary.avgReadRate)}% leitura
          </span>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* KPI CARDS                                                         */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {/* Total Templates */}
        <div className={statCardClass}>
          <div className="flex items-center gap-1.5 mb-1">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" aria-hidden="true" />
            <p className={labelClass}>Templates</p>
          </div>
          <p className={valueClass}>
            {summary.totalTemplates}
          </p>
        </div>

        {/* Avg Read Rate */}
        <div className={statCardClass}>
          <div className="flex items-center gap-1.5 mb-1">
            <Eye className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" aria-hidden="true" />
            <p className={labelClass}>Taxa Leitura Media</p>
          </div>
          <p className={`${valueClass} ${getReadRateTextColor(getReadRateColor(summary.avgReadRate))}`}>
            {PERCENT_FMT.format(summary.avgReadRate)}%
          </p>
        </div>

        {/* Best Read Rate */}
        <div className={statCardClass}>
          <div className="flex items-center gap-1.5 mb-1">
            <Award className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" aria-hidden="true" />
            <p className={labelClass}>Melhor Taxa</p>
          </div>
          <p className={`${valueClass} ${getReadRateTextColor(getReadRateColor(summary.bestReadRate))}`}>
            {PERCENT_FMT.format(summary.bestReadRate)}%
          </p>
          {bestTemplate && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {humanizeTemplateName(bestTemplate.templateName)}
            </p>
          )}
        </div>

        {/* Total Sent */}
        <div className={statCardClass}>
          <div className="flex items-center gap-1.5 mb-1">
            <Send className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" aria-hidden="true" />
            <p className={labelClass}>Mensagens Enviadas</p>
          </div>
          <p className={valueClass}>
            {NUMBER_FMT.format(summary.totalSent)}
          </p>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* BEST TEMPLATE HIGHLIGHT                                           */}
      {/* ----------------------------------------------------------------- */}
      {bestTemplate && (
        <BestTemplateCard
          template={bestTemplate}
          isDark={isDark}
          isDesktop={isDesktop}
        />
      )}

      {/* ----------------------------------------------------------------- */}
      {/* TEMPLATE TABLE (Desktop) / CARD LIST (Mobile)                     */}
      {/* ----------------------------------------------------------------- */}
      <div className="mb-4">
        <p className="text-xs font-medium tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          Detalhamento por Template
        </p>

        {isMobile ? (
          /* ---- Mobile: Card List ---- */
          <div className="space-y-3">
            {templates.map((template) => (
              <TemplateCard
                key={template.templateName}
                template={template}
                isBest={template.templateName === bestTemplateName}
                isDark={isDark}
              />
            ))}
          </div>
        ) : (
          /* ---- Desktop: Full Table ---- */
          <div
            className={`
              rounded-xl overflow-hidden
              ${isDark
                ? 'ring-1 ring-white/[0.06]'
                : 'ring-1 ring-slate-200'}
            `}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className={`
                      ${isDark ? 'bg-space-nebula' : 'bg-slate-100'}
                      sticky top-0 z-10
                    `}
                  >
                    <th className="text-left px-4 py-3 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400">
                      Template
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400">
                      Enviadas
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400">
                      Entregues
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400">
                      Lidas
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400">
                      Entrega
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 min-w-[160px]">
                      Taxa Leitura
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400">
                      Tendencia
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((template, idx) => {
                    const isBest = template.templateName === bestTemplateName;
                    const isEven = idx % 2 === 0;
                    const tier = getReadRateColor(template.readRate);

                    return (
                      <tr
                        key={template.templateName}
                        className={`
                          ${isBest ? 'border-l-[3px] border-l-emerald-500' : 'border-l-[3px] border-l-transparent'}
                          ${isEven
                            ? (isDark ? 'bg-space-dust/20' : 'bg-white')
                            : (isDark ? 'bg-space-dust/40' : 'bg-slate-50/60')}
                          hover:${isDark ? 'bg-space-dust/60' : 'bg-slate-100/80'}
                          transition-colors duration-150
                        `}
                      >
                        {/* Template Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                              {humanizeTemplateName(template.templateName)}
                            </span>
                            {isBest && (
                              <Award className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {template.category || 'Sem categoria'}
                          </p>
                        </td>

                        {/* Sent */}
                        <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900 dark:text-white">
                          {NUMBER_FMT.format(template.totalSent)}
                        </td>

                        {/* Delivered */}
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                          {NUMBER_FMT.format(template.totalDelivered)}
                        </td>

                        {/* Read */}
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                          {NUMBER_FMT.format(template.totalRead)}
                        </td>

                        {/* Delivery Rate */}
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`
                              inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                              ${isDark
                                ? 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/30'
                                : 'bg-sky-50 text-sky-700 ring-1 ring-sky-200'}
                            `}
                          >
                            {PERCENT_FMT.format(template.deliveryRate)}%
                          </span>
                        </td>

                        {/* Read Rate with progress bar */}
                        <td className="px-4 py-3">
                          <ReadRateBar rate={template.readRate} isDark={isDark} />
                        </td>

                        {/* Sparkline */}
                        <td className="px-4 py-3 text-center">
                          {template.trend && template.trend.length >= 2 ? (
                            <div className="flex justify-center">
                              <ReadRateSparkline data={template.trend} tier={tier} isDark={isDark} />
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500">--</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* FOOTER                                                            */}
      {/* ----------------------------------------------------------------- */}
      <div
        className={`
          flex items-center gap-1.5 pt-3
          border-t ${isDark ? 'border-white/[0.05]' : 'border-slate-200/50'}
        `}
      >
        <Info className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 flex-shrink-0" aria-hidden="true" />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Dados da view twilio_template_performance &bull; Taxa de leitura = lidas / entregues &bull; Minimo {MIN_DELIVERED_FOR_BEST} entregas para destaque
        </p>
      </div>
    </div>
  );
};

export default TemplatePerformance;
