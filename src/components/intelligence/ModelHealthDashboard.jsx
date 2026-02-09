// ModelHealthDashboard.jsx v1.0 - ML Model Accuracy Dashboard
// Shows prediction accuracy, bias, scatter plot, and weekly trends
// Design System v6.4 compliant - Cosmic Precision
//
// DATA SOURCES:
// - prediction_accuracy view (30-day rolling MAE/MAPE)
// - prediction_accuracy_weekly view (weekly MAPE trends)
// - revenue_predictions table (predicted vs actual scatter)
//
// CHANGELOG:
// v1.0 (2026-02-09): Initial implementation
//   - Traffic-light MAPE indicator (green/amber/red)
//   - Predicted vs Actual scatter chart with perfect-prediction line
//   - Weekly MAPE sparkline (compact h-20)
//   - KPI cards: MAE, MAPE, total predictions, bias
//   - Graceful empty-data handling (returns null)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info
} from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { getSupabaseClient } from '../../utils/supabaseClient';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAPE_GREEN_THRESHOLD = 15;
const MAPE_AMBER_THRESHOLD = 25;

const CURRENCY_FMT = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

const PERCENT_FMT = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});

/**
 * Format a date string as DD/MM
 */
function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
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
        <div className={`h-4 w-40 rounded animate-pulse ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
        <div className={`h-3 w-28 rounded animate-pulse ${isDark ? 'bg-slate-700/60' : 'bg-slate-200/70'}`} />
      </div>
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      {[...Array(4)].map((_, i) => (
        <div key={i} className={`h-20 rounded-xl animate-pulse ${isDark ? 'bg-slate-700/40' : 'bg-slate-100'}`} />
      ))}
    </div>
    <div className={`h-48 rounded-xl animate-pulse ${isDark ? 'bg-slate-700/30' : 'bg-slate-100/80'}`} />
  </div>
);

/** Custom tooltip for the scatter chart */
const ScatterTooltip = ({ active, payload, isDark }) => {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div
      className={`
        px-3 py-2 rounded-lg text-xs shadow-lg
        ${isDark
          ? 'bg-space-nebula/95 border border-stellar-cyan/20 text-white'
          : 'bg-white/95 border border-slate-200 text-slate-800'}
      `}
    >
      <p className="font-semibold mb-1">{point.label}</p>
      <p>Previsto: {CURRENCY_FMT.format(point.predicted)}</p>
      <p>Real: {CURRENCY_FMT.format(point.actual)}</p>
      <p>Erro: {PERCENT_FMT.format(Math.abs(point.pctError))}%</p>
    </div>
  );
};

/** Custom tooltip for the weekly sparkline */
const WeeklyTooltip = ({ active, payload, isDark }) => {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div
      className={`
        px-3 py-2 rounded-lg text-xs shadow-lg
        ${isDark
          ? 'bg-space-nebula/95 border border-stellar-cyan/20 text-white'
          : 'bg-white/95 border border-slate-200 text-slate-800'}
      `}
    >
      <p className="font-semibold mb-1">Semana de {point.weekLabel}</p>
      <p>MAPE: {PERCENT_FMT.format(point.mape)}%</p>
      <p>Previsoes: {point.predictions}</p>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const ModelHealthDashboard = ({ className = '' }) => {
  const { isDark } = useTheme();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // State
  const [accuracy, setAccuracy] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // -----------------------------------------------------------------------
  // Data fetching
  // -----------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const client = await getSupabaseClient();
      if (!client) {
        setError('Supabase not configured');
        return;
      }

      const [accResult, weeklyResult, predResult] = await Promise.all([
        // 30-day rolling accuracy
        client
          .from('prediction_accuracy')
          .select('*')
          .single(),

        // Weekly trend
        client
          .from('prediction_accuracy_weekly')
          .select('*')
          .order('week_start', { ascending: true }),

        // Recent predictions with actuals (for scatter)
        client
          .from('revenue_predictions')
          .select('prediction_date, predicted_revenue, actual_revenue, error, pct_error, is_closure')
          .not('actual_revenue', 'is', null)
          .or('is_closure.is.null,is_closure.eq.false')
          .order('prediction_date', { ascending: false })
          .limit(30)
      ]);

      if (accResult.error) throw accResult.error;
      if (weeklyResult.error) throw weeklyResult.error;
      if (predResult.error) throw predResult.error;

      setAccuracy(accResult.data);
      setWeeklyData(weeklyResult.data || []);
      setPredictions(predResult.data || []);
    } catch (err) {
      console.error('[ModelHealthDashboard] Fetch error:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // -----------------------------------------------------------------------
  // Derived data
  // -----------------------------------------------------------------------

  /** Traffic-light health status based on MAPE */
  const healthStatus = useMemo(() => {
    if (!accuracy || accuracy.avg_mape == null) {
      return { level: 'unknown', label: 'Sem Dados', color: 'slate', Icon: Info };
    }

    const mape = accuracy.avg_mape;

    if (mape < MAPE_GREEN_THRESHOLD) {
      return {
        level: 'healthy',
        label: 'Modelo Saudavel',
        color: 'green',
        Icon: CheckCircle
      };
    }
    if (mape < MAPE_AMBER_THRESHOLD) {
      return {
        level: 'warning',
        label: 'Modelo Atencao',
        color: 'amber',
        Icon: AlertTriangle
      };
    }
    return {
      level: 'degraded',
      label: 'Modelo Degradado',
      color: 'red',
      Icon: XCircle
    };
  }, [accuracy]);

  /** Scatter chart data — predicted vs actual */
  const scatterData = useMemo(() => {
    if (!predictions.length) return [];

    return predictions.map((p) => ({
      predicted: Number(p.predicted_revenue),
      actual: Number(p.actual_revenue),
      pctError: p.pct_error != null ? Number(p.pct_error) : 0,
      label: formatShortDate(p.prediction_date)
    }));
  }, [predictions]);

  /** Domain for scatter chart axes — shared min/max for square aspect */
  const scatterDomain = useMemo(() => {
    if (!scatterData.length) return [0, 1000];
    const allValues = scatterData.flatMap((d) => [d.predicted, d.actual]);
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min) * 0.1 || 100;
    return [Math.max(0, Math.floor(min - padding)), Math.ceil(max + padding)];
  }, [scatterData]);

  /** Weekly sparkline data */
  const sparklineData = useMemo(() => {
    return weeklyData.map((w) => ({
      weekLabel: formatShortDate(w.week_start),
      mape: Number(w.avg_mape),
      predictions: w.predictions
    }));
  }, [weeklyData]);

  /** Average bias from weekly data */
  const avgBias = useMemo(() => {
    if (!weeklyData.length) return null;
    const biasValues = weeklyData
      .filter((w) => w.avg_bias != null)
      .map((w) => Number(w.avg_bias));
    if (!biasValues.length) return null;
    return biasValues.reduce((sum, b) => sum + b, 0) / biasValues.length;
  }, [weeklyData]);

  // -----------------------------------------------------------------------
  // Render guards
  // -----------------------------------------------------------------------

  if (loading) return <LoadingSkeleton isDark={isDark} />;

  // Silently hide when there is no data (model not yet trained or no predictions evaluated)
  if (error || !accuracy) return null;

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

  // Badge colors by health level
  const badgeStyles = {
    healthy: {
      bg: 'bg-emerald-600 dark:bg-emerald-500',
      text: 'text-white',
      dot: 'bg-white/80',
      border: 'ring-emerald-700 dark:ring-emerald-400'
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-500',
      text: 'text-amber-800 dark:text-white',
      dot: 'bg-amber-500 dark:bg-white/80',
      border: 'ring-amber-200 dark:ring-amber-400'
    },
    degraded: {
      bg: 'bg-red-600 dark:bg-red-500',
      text: 'text-white',
      dot: 'bg-white/80',
      border: 'ring-red-700 dark:ring-red-400'
    },
    unknown: {
      bg: 'bg-slate-400 dark:bg-slate-500',
      text: 'text-white',
      dot: 'bg-white/80',
      border: 'ring-slate-500 dark:ring-slate-400'
    }
  };

  const badge = badgeStyles[healthStatus.level];

  // Chart colors
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const axisColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)';
  const referenceLineColor = isDark ? 'rgba(0,174,239,0.35)' : 'rgba(0,174,239,0.5)';
  const scatterFill = isDark ? '#00aeef' : '#0ea5e9';
  const sparklineStroke = isDark ? '#00d68f' : '#10b981';

  // Bias direction label
  const biasLabel = (() => {
    if (avgBias == null) return '--';
    if (Math.abs(avgBias) < 1) return 'Neutro';
    return avgBias > 0 ? 'Otimista' : 'Pessimista';
  })();

  const biasColor = (() => {
    if (avgBias == null || Math.abs(avgBias) < 1) return 'text-slate-900 dark:text-white';
    return avgBias > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400';
  })();

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
          <div className="w-10 h-10 rounded-xl bg-indigo-500 dark:bg-indigo-600 flex items-center justify-center shadow-sm shrink-0">
            <Activity className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className={`${isDesktop ? 'text-base' : 'text-sm'} font-bold text-slate-800 dark:text-white`}>
              Saude do Modelo ML
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              Ultimos 30 dias &bull; {accuracy.total_predictions || 0} previsoes avaliadas
            </p>
          </div>
        </div>

        {/* Right: Health Badge */}
        <div
          className={`
            flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shrink-0
            backdrop-blur-sm ring-1 ${badge.bg} ${badge.border}
          `}
        >
          <div className={`w-2 h-2 rounded-full ${badge.dot} animate-pulse`} aria-hidden="true" />
          <span className={`text-xs font-medium ${badge.text} whitespace-nowrap`}>
            {isDesktop ? healthStatus.label : healthStatus.label.split(' ')[1] || healthStatus.label}
          </span>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* KPI CARDS                                                         */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {/* MAE */}
        <div className={statCardClass}>
          <p className={labelClass}>MAE</p>
          <p className={valueClass}>
            {accuracy.avg_mae != null ? CURRENCY_FMT.format(accuracy.avg_mae) : '--'}
          </p>
        </div>

        {/* MAPE */}
        <div className={statCardClass}>
          <p className={labelClass}>MAPE</p>
          <p className={`${valueClass} ${
            accuracy.avg_mape != null && accuracy.avg_mape >= MAPE_AMBER_THRESHOLD
              ? 'text-red-600 dark:text-red-400'
              : accuracy.avg_mape != null && accuracy.avg_mape >= MAPE_GREEN_THRESHOLD
                ? 'text-amber-600 dark:text-amber-400'
                : ''
          }`}>
            {accuracy.avg_mape != null ? `${PERCENT_FMT.format(accuracy.avg_mape)}%` : '--'}
          </p>
        </div>

        {/* Total Predictions */}
        <div className={statCardClass}>
          <p className={labelClass}>Previsoes</p>
          <p className={valueClass}>
            {accuracy.total_predictions != null ? accuracy.total_predictions : '--'}
          </p>
        </div>

        {/* Bias */}
        <div className={statCardClass}>
          <p className={labelClass}>Vies</p>
          <p className={`${isDesktop ? 'text-xl' : 'text-lg'} font-bold tabular-nums ${biasColor}`}>
            {biasLabel}
          </p>
          {avgBias != null && Math.abs(avgBias) >= 1 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {CURRENCY_FMT.format(Math.abs(avgBias))}/dia
            </p>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* PREDICTED vs ACTUAL SCATTER CHART                                 */}
      {/* ----------------------------------------------------------------- */}
      {scatterData.length > 0 && (
        <div className="mb-5">
          <p className={`text-xs font-medium tracking-wider text-slate-500 dark:text-slate-400 mb-2`}>
            Previsto vs Real
          </p>
          <div
            className={`
              rounded-xl p-3
              ${isDark
                ? 'bg-space-nebula/40 ring-1 ring-white/[0.04]'
                : 'bg-slate-50/60 ring-1 ring-slate-100'}
            `}
          >
            <ResponsiveContainer width="100%" height={isDesktop ? 240 : 200}>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 5, left: isDesktop ? 5 : 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  vertical={false}
                />
                <XAxis
                  type="number"
                  dataKey="predicted"
                  name="Previsto"
                  domain={scatterDomain}
                  tick={{ fontSize: 11, fill: axisColor }}
                  tickFormatter={(v) => CURRENCY_FMT.format(v)}
                  axisLine={{ stroke: gridColor }}
                  tickLine={false}
                  label={isDesktop ? {
                    value: 'Previsto (R$)',
                    position: 'insideBottom',
                    offset: -2,
                    style: { fontSize: 11, fill: axisColor }
                  } : undefined}
                />
                <YAxis
                  type="number"
                  dataKey="actual"
                  name="Real"
                  domain={scatterDomain}
                  tick={{ fontSize: 11, fill: axisColor }}
                  tickFormatter={(v) => CURRENCY_FMT.format(v)}
                  axisLine={{ stroke: gridColor }}
                  tickLine={false}
                  width={isDesktop ? 70 : 55}
                  label={isDesktop ? {
                    value: 'Real (R$)',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 10,
                    style: { fontSize: 11, fill: axisColor }
                  } : undefined}
                />
                {/* Perfect prediction reference line (diagonal) */}
                <ReferenceLine
                  segment={[
                    { x: scatterDomain[0], y: scatterDomain[0] },
                    { x: scatterDomain[1], y: scatterDomain[1] }
                  ]}
                  stroke={referenceLineColor}
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                  ifOverflow="extendDomain"
                />
                <Tooltip
                  content={<ScatterTooltip isDark={isDark} />}
                  cursor={false}
                />
                <Scatter
                  data={scatterData}
                  fill={scatterFill}
                  fillOpacity={0.7}
                  r={isDesktop ? 5 : 4}
                  shape="circle"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* WEEKLY MAPE SPARKLINE                                             */}
      {/* ----------------------------------------------------------------- */}
      {sparklineData.length > 1 && (
        <div className="mb-4">
          <p className="text-xs font-medium tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Tendencia Semanal (MAPE)
          </p>
          <div
            className={`
              rounded-xl px-3 py-2
              ${isDark
                ? 'bg-space-nebula/40 ring-1 ring-white/[0.04]'
                : 'bg-slate-50/60 ring-1 ring-slate-100'}
            `}
          >
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={sparklineData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                <XAxis
                  dataKey="weekLabel"
                  tick={{ fontSize: 10, fill: axisColor }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                {/* Threshold reference lines */}
                <ReferenceLine
                  y={MAPE_GREEN_THRESHOLD}
                  stroke={isDark ? 'rgba(0,214,143,0.3)' : 'rgba(16,185,129,0.35)'}
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                <ReferenceLine
                  y={MAPE_AMBER_THRESHOLD}
                  stroke={isDark ? 'rgba(251,191,36,0.3)' : 'rgba(217,119,6,0.35)'}
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                <Tooltip
                  content={<WeeklyTooltip isDark={isDark} />}
                  cursor={false}
                />
                <Line
                  type="monotone"
                  dataKey="mape"
                  stroke={sparklineStroke}
                  strokeWidth={2}
                  dot={{ r: 3, fill: sparklineStroke, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: sparklineStroke, strokeWidth: 2, stroke: isDark ? '#0a0f1e' : '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* FOOTER                                                            */}
      {/* ----------------------------------------------------------------- */}
      <div
        className={`
          flex items-center gap-1.5 pt-3
          border-t ${isDark ? 'border-white/[0.05]' : 'border-slate-200/50'}
        `}
      >
        <Info className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 flex-shrink-0" aria-hidden="true" />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {accuracy.period_start && accuracy.period_end
            ? `Periodo: ${formatShortDate(accuracy.period_start)} - ${formatShortDate(accuracy.period_end)} | Regressao OLS com dados historicos`
            : 'Regressao OLS com dados historicos de receita diaria'}
        </p>
      </div>
    </div>
  );
};

export default ModelHealthDashboard;
