// InstagramGrowthAnalytics.jsx v1.0 - INSTAGRAM GROWTH VELOCITY
// Instagram growth analytics with velocity KPIs, trend charts, and sparklines
// Design System v6.4 compliant - Variant A (Solid)
//
// FEATURES:
// - Growth velocity KPI cards (Followers, Reach, Engagement, Views)
// - Multi-metric AreaChart with growth trends over time
// - Inline sparklines (14-day) per metric
// - Date range filter: 7/30/90 dias
// - Portuguese labels and Brazilian number formatting
// - Responsive mobile/desktop layout
// - Theme-aware dark/light mode
// - Loading skeleton states
//
// DATA SOURCE:
// Fetches from Supabase view `instagram_metrics_with_growth`
// which joins instagram_daily_metrics with computed growth columns.
//
// CHANGELOG:
// v1.0 (2026-02-09): Initial implementation
//   - Growth velocity KPI cards with sparklines
//   - Multi-metric AreaChart (Followers, Reach, Interactions)
//   - Date range filter (7/30/90 dias)
//   - Custom tooltip with growth percentages
//   - Compact number formatting (1.2K, 1.5M)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Activity,
  Play,
  ArrowUp,
  ArrowDown,
  Minus,
  Loader2,
  Database
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { toBrazilDateString } from '../../utils/dateUtils';
import { getSupabaseClient } from '../../utils/supabaseClient';
import { getChartColors, getSeriesColors } from '../../utils/chartColors';

const RANGE_OPTIONS = [
  { id: 7, label: '7 dias' },
  { id: 30, label: '30 dias' },
  { id: 90, label: '90 dias' }
];

// ==================== UTILITIES ====================

const formatCompact = (value) => {
  if (value === null || value === undefined) return '0';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return new Intl.NumberFormat('pt-BR').format(value);
};

const formatBrNumber = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return new Intl.NumberFormat('pt-BR').format(value);
};

const formatGrowthPct = (value) => {
  if (value === null || value === undefined || isNaN(value)) return null;
  const rounded = Math.round(value * 10) / 10;
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded.toFixed(1).replace('.', ',')}%`;
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const formatDateFull = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// ==================== DATE RANGE FILTER ====================

const DateRangeFilter = ({ value, onChange }) => {
  return (
    <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-full p-0.5">
      {RANGE_OPTIONS.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
          className={`px-3 py-1 text-xs font-semibold rounded-full transition-all min-h-[28px] ${
            value === option.id
              ? 'bg-purple-500 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

// ==================== GROWTH BADGE ====================

const GrowthBadge = ({ value, size = 'default' }) => {
  const formatted = formatGrowthPct(value);
  if (formatted === null) {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 text-xs font-medium">
        <Minus className="w-3 h-3" />
        N/A
      </span>
    );
  }

  const isPositive = value > 0;
  const isZero = value === 0;

  if (isZero) {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-medium">
        <Minus className="w-3 h-3" />
        0%
      </span>
    );
  }

  const sizeClasses = size === 'compact' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center gap-0.5 ${sizeClasses} rounded-full font-semibold text-white ${
      isPositive
        ? 'bg-emerald-600 dark:bg-emerald-500'
        : 'bg-red-600 dark:bg-red-500'
    }`}>
      {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {formatted}
    </span>
  );
};

// ==================== MINI SPARKLINE ====================

const MiniSparkline = ({ data, dataKey, color, height = 32 }) => {
  if (!data || data.length < 2) return null;

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// ==================== GROWTH KPI CARD ====================

const GrowthKPICard = ({ label, value, growthPct, icon: Icon, color, sparklineData, sparklineKey }) => {
  return (
    <div className={`
      bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-space-dust dark:via-space-dust dark:to-space-nebula/30
      rounded-xl
      border border-slate-200/80 dark:border-stellar-cyan/10
      shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[inset_0_1px_0_0_rgba(0,174,239,0.05)]
      p-3 sm:p-4
      flex flex-col
    `}>
      {/* Header row: icon + growth badge */}
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center`}
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <GrowthBadge value={growthPct} size="compact" />
      </div>

      {/* Label */}
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-0.5">
        {label}
      </div>

      {/* Value */}
      <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
        {formatBrNumber(value)}
      </div>

      {/* Sparkline (last 14 days) */}
      {sparklineData && sparklineData.length >= 2 && (
        <div className="mt-2 -mx-1">
          <MiniSparkline data={sparklineData} dataKey={sparklineKey} color={color} height={28} />
        </div>
      )}
    </div>
  );
};

// ==================== CUSTOM TOOLTIP ====================

const CustomChartTooltip = ({ active, payload, label, isDark }) => {
  if (!active || !payload || !payload.length) return null;

  const dataPoint = payload[0]?.payload;

  return (
    <div className={`
      rounded-lg border px-3 py-2.5 text-xs shadow-lg
      ${isDark
        ? 'bg-space-dust border-stellar-cyan/20 text-white'
        : 'bg-white border-slate-200 text-slate-900'
      }
    `}>
      <p className={`font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
        {label}
      </p>
      <div className="space-y-1">
        {payload.map((entry, idx) => {
          const metricKey = entry.dataKey;
          const growthKey = `${metricKey}_growth`;
          const growthVal = dataPoint?.[growthKey];

          return (
            <div key={idx} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{entry.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tabular-nums">{formatBrNumber(entry.value)}</span>
                {growthVal !== undefined && growthVal !== null && (
                  <span className={`text-xs font-medium ${
                    growthVal > 0 ? 'text-emerald-500' : growthVal < 0 ? 'text-red-500' : 'text-slate-400'
                  }`}>
                    {formatGrowthPct(growthVal)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==================== LOADING SKELETON ====================

const LoadingSkeleton = () => (
  <div className={`
    bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-space-dust dark:via-space-dust dark:to-space-nebula/30
    rounded-xl
    border border-slate-200/80 dark:border-stellar-cyan/10
    shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[inset_0_1px_0_0_rgba(0,174,239,0.05)]
    p-4 sm:p-5
  `}>
    {/* Header skeleton */}
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="space-y-1.5">
          <div className="w-40 h-5 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="w-56 h-3 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        </div>
      </div>
      <div className="w-48 h-7 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
    </div>

    {/* KPI grid skeleton */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="w-14 h-5 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>
          <div className="w-12 h-3 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="w-20 h-6 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="w-full h-7 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        </div>
      ))}
    </div>

    {/* Chart skeleton */}
    <div className="h-56 sm:h-72 flex items-end justify-between gap-2 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
      {[40, 65, 45, 80, 55, 70, 50, 75, 60, 85, 55, 90].map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t animate-pulse bg-slate-200 dark:bg-slate-700"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================

const InstagramGrowthAnalytics = ({ refreshKey = 0 }) => {
  const { isDark } = useTheme();
  const isMobile = useIsMobile();
  const chartColors = useMemo(() => getChartColors(isDark), [isDark]);
  const seriesColors = useMemo(() => getSeriesColors(isDark), [isDark]);

  // Semantic mapping: series index → Instagram metric
  // [0] brand/blue, [1] green, [2] purple, [3] amber
  const metricColors = useMemo(() => ({
    followers: seriesColors[2], // purple
    reach: seriesColors[0],     // brand blue/cyan
    interactions: seriesColors[1], // green
    views: seriesColors[3],     // amber
  }), [seriesColors]);

  // State
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rangeDays, setRangeDays] = useState(30);

  // ==================== DATA FETCHING ====================

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const client = await getSupabaseClient();
      if (!client) {
        setError('Supabase não configurado');
        return;
      }

      const { data, error: supaError } = await client
        .from('instagram_metrics_with_growth')
        .select('*')
        .order('bucket_date', { ascending: true })
        .limit(90);

      if (supaError) {
        console.error('[InstagramGrowthAnalytics] Supabase error:', supaError);
        setError(supaError.message);
        return;
      }

      setRawData(data || []);
    } catch (err) {
      console.error('[InstagramGrowthAnalytics] Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  // ==================== FILTERED DATA ====================

  const filteredData = useMemo(() => {
    if (!rawData.length) return [];

    // Apply date range filter
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - rangeDays);
    const cutoffStr = toBrazilDateString(cutoffDate);

    return rawData.filter(d => d.bucket_date >= cutoffStr);
  }, [rawData, rangeDays]);

  // ==================== LATEST METRICS ====================

  const latestMetrics = useMemo(() => {
    if (!filteredData.length) return null;

    // Most recent data point
    const latest = filteredData[filteredData.length - 1];

    return {
      followers: latest.followers || 0,
      followersGrowthPct: latest.followers_growth_pct ?? null,
      reach: latest.reach || 0,
      reachChange: latest.reach_change ?? null,
      views: latest.views || 0,
      viewsChange: latest.views_change ?? null,
      interactions: latest.total_interactions || 0,
      interactionsChange: latest.interactions_change ?? null,
      // Compute growth percentages for reach/views/interactions
      reachGrowthPct: latest.prev_reach
        ? ((latest.reach_change || 0) / latest.prev_reach) * 100
        : null,
      viewsGrowthPct: latest.prev_views
        ? ((latest.views_change || 0) / latest.prev_views) * 100
        : null,
      interactionsGrowthPct: latest.prev_interactions
        ? ((latest.interactions_change || 0) / latest.prev_interactions) * 100
        : null
    };
  }, [filteredData]);

  // ==================== SPARKLINE DATA (last 14 entries) ====================

  const sparklineData = useMemo(() => {
    if (!filteredData.length) return { followers: [], reach: [], views: [], interactions: [] };

    const last14 = filteredData.slice(-14);

    return {
      followers: last14.map(d => ({ value: d.followers || 0 })),
      reach: last14.map(d => ({ value: d.reach || 0 })),
      views: last14.map(d => ({ value: d.views || 0 })),
      interactions: last14.map(d => ({ value: d.total_interactions || 0 }))
    };
  }, [filteredData]);

  // ==================== CHART DATA ====================

  const chartData = useMemo(() => {
    if (!filteredData.length) return [];

    return filteredData.map(d => ({
      date: formatDateShort(d.bucket_date),
      fullDate: formatDateFull(d.bucket_date),
      followers: d.followers || 0,
      reach: d.reach || 0,
      interactions: d.total_interactions || 0,
      views: d.views || 0,
      // Growth percentages for tooltip
      followers_growth: d.followers_growth_pct ?? null,
      reach_growth: d.prev_reach
        ? ((d.reach_change || 0) / d.prev_reach) * 100
        : null,
      interactions_growth: d.prev_interactions
        ? ((d.interactions_change || 0) / d.prev_interactions) * 100
        : null,
      views_growth: d.prev_views
        ? ((d.views_change || 0) / d.prev_views) * 100
        : null
    }));
  }, [filteredData]);

  // ==================== RENDER ====================

  if (loading) return <LoadingSkeleton />;

  if (!rawData.length) return null;

  if (error) {
    return (
      <div className={`
        bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-space-dust dark:via-space-dust dark:to-space-nebula/30
        rounded-xl
        border border-slate-200/80 dark:border-stellar-cyan/10
        shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[inset_0_1px_0_0_rgba(0,174,239,0.05)]
        p-6 text-center
      `}>
        <Database className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Erro ao carregar dados de crescimento</p>
        <p className="text-xs text-slate-400 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className={`
      bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-space-dust dark:via-space-dust dark:to-space-nebula/30
      rounded-xl
      border border-slate-200/80 dark:border-stellar-cyan/10
      shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[inset_0_1px_0_0_rgba(0,174,239,0.05)]
      p-4 sm:p-5
    `}>
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
              Velocidade de Crescimento
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tendencias e variacao do Instagram
            </p>
          </div>
        </div>
        <DateRangeFilter value={rangeDays} onChange={setRangeDays} />
      </div>

      {/* ===== GROWTH KPI CARDS ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <GrowthKPICard
          label="Seguidores"
          value={latestMetrics?.followers}
          growthPct={latestMetrics?.followersGrowthPct}
          icon={Users}
          color={metricColors.followers}
          sparklineData={sparklineData.followers}
          sparklineKey="value"
        />
        <GrowthKPICard
          label="Alcance"
          value={latestMetrics?.reach}
          growthPct={latestMetrics?.reachGrowthPct}
          icon={Eye}
          color={metricColors.reach}
          sparklineData={sparklineData.reach}
          sparklineKey="value"
        />
        <GrowthKPICard
          label="Engajamento"
          value={latestMetrics?.interactions}
          growthPct={latestMetrics?.interactionsGrowthPct}
          icon={Activity}
          color={metricColors.interactions}
          sparklineData={sparklineData.interactions}
          sparklineKey="value"
        />
        <GrowthKPICard
          label="Visualizacoes"
          value={latestMetrics?.views}
          growthPct={latestMetrics?.viewsGrowthPct}
          icon={Play}
          color={metricColors.views}
          sparklineData={sparklineData.views}
          sparklineKey="value"
        />
      </div>

      {/* ===== TREND CHART ===== */}
      <div className="bg-slate-50/50 dark:bg-space-nebula/20 rounded-xl border border-slate-100 dark:border-stellar-cyan/5 p-3 sm:p-4">
        {/* Chart header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              Tendencia de Metricas
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {rangeDays} dias - Seguidores, Alcance, Engajamento e Visualizacoes
            </p>
          </div>
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: metricColors.followers }} />
              <span className="text-slate-500 dark:text-slate-400">Seguidores</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: metricColors.reach }} />
              <span className="text-slate-500 dark:text-slate-400">Alcance</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: metricColors.interactions }} />
              <span className="text-slate-500 dark:text-slate-400">Engajamento</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: metricColors.views }} />
              <span className="text-slate-500 dark:text-slate-400">Visualizacoes</span>
            </span>
          </div>
        </div>

        {/* Mobile legend */}
        <div className="flex sm:hidden items-center gap-2 text-xs mb-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: metricColors.followers }} />
            Seg.
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: metricColors.reach }} />
            Alcance
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: metricColors.interactions }} />
            Engaj.
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: metricColors.views }} />
            Views
          </span>
        </div>

        {/* Chart */}
        {chartData.length > 1 ? (
          <div className="h-56 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="igGrowthFollowers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={metricColors.followers} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={metricColors.followers} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="igGrowthReach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={metricColors.reach} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={metricColors.reach} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="igGrowthInteractions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={metricColors.interactions} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={metricColors.interactions} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="igGrowthViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={metricColors.views} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={metricColors.views} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={chartColors.grid}
                  strokeOpacity={0.5}
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: isMobile ? 9 : 12, fill: chartColors.tickText }}
                  interval={isMobile ? 'preserveStartEnd' : 0}
                />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: isMobile ? 9 : 12, fill: chartColors.tickText }}
                  width={isMobile ? 35 : 50}
                  tickFormatter={formatCompact}
                  domain={[dataMin => Math.floor(dataMin * 0.99), dataMax => Math.ceil(dataMax * 1.01)]}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: isMobile ? 9 : 12, fill: chartColors.tickText }}
                  width={isMobile ? 30 : 45}
                  tickFormatter={formatCompact}
                  domain={[dataMin => Math.floor(dataMin * 0.9), dataMax => Math.ceil(dataMax * 1.1)]}
                />
                <YAxis
                  yAxisId="interactions"
                  orientation="right"
                  hide
                  domain={[0, dataMax => Math.ceil(dataMax * 1.2)]}
                />
                <YAxis
                  yAxisId="views"
                  orientation="right"
                  hide
                  domain={[dataMin => Math.floor(dataMin * 0.9), dataMax => Math.ceil(dataMax * 1.1)]}
                />
                <Tooltip
                  content={<CustomChartTooltip isDark={isDark} />}
                  cursor={{ fill: chartColors.cursorFill }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="followers"
                  name="Seguidores"
                  stroke={metricColors.followers}
                  strokeWidth={2}
                  fill="url(#igGrowthFollowers)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, fill: isDark ? '#1a1f35' : '#fff' }}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="reach"
                  name="Alcance"
                  stroke={metricColors.reach}
                  strokeWidth={2}
                  fill="url(#igGrowthReach)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, fill: isDark ? '#1a1f35' : '#fff' }}
                />
                <Area
                  yAxisId="interactions"
                  type="monotone"
                  dataKey="interactions"
                  name="Engajamento"
                  stroke={metricColors.interactions}
                  strokeWidth={2}
                  fill="url(#igGrowthInteractions)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, fill: isDark ? '#1a1f35' : '#fff' }}
                />
                <Area
                  yAxisId="views"
                  type="monotone"
                  dataKey="views"
                  name="Visualizacoes"
                  stroke={metricColors.views}
                  strokeWidth={2}
                  fill="url(#igGrowthViews)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, fill: isDark ? '#1a1f35' : '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-56 sm:h-72 flex flex-col items-center justify-center text-slate-400">
            <Database className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">Dados insuficientes</p>
            <p className="text-xs mt-1">Necessario ao menos 2 dias de dados</p>
          </div>
        )}
      </div>

      {/* ===== PERIOD SUMMARY ===== */}
      {filteredData.length >= 2 && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-stellar-cyan/5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Periodo: {formatDateFull(filteredData[0]?.bucket_date)} - {formatDateFull(filteredData[filteredData.length - 1]?.bucket_date)}</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span>{filteredData.length} dias de dados</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstagramGrowthAnalytics;
