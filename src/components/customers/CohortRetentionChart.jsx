// CohortRetentionChart.jsx v1.0 - COHORT RETENTION HEATMAP
// Triangular retention heatmap showing customer return rates by acquisition cohort
// Design System v6.4 compliant - Variant A (Solid cards)
//
// FEATURES:
// - Triangular heatmap: rows = cohort months, columns = months after acquisition (M+0 to M+6)
// - Color gradient: green (>70%) -> yellow (40-70%) -> red (<40%)
// - Summary insight box identifying the main drop-off cliff
// - Cohort size column showing customer count per cohort
// - Responsive: horizontally scrollable table on mobile
// - Loading skeleton with cosmic shimmer
// - Brazilian month abbreviations (Jan/26, Fev/26, etc.)
//
// CHANGELOG:
// v1.0 (2026-02-09): Initial implementation
//   - Fetches data via get_cohort_retention() RPC
//   - Triangular heatmap with color-coded retention cells
//   - Staggered cell reveal animation (CHART_ANIMATION.HEATMAP)
//   - Insight box with drop-off cliff analysis
//   - Responsive horizontal scroll on mobile

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingDown, Info } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getSupabaseClient } from '../../utils/supabaseClient';
import { CHART_ANIMATION, SPRING } from '../../constants/animations';

// ---------------------------------------------------------------------------
// Brazilian month abbreviations (index 0 = January)
// ---------------------------------------------------------------------------
const BR_MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/**
 * Format a Date or ISO string as "Mmm/YY" in Brazilian style
 * e.g. 2026-02-01 -> "Fev/26"
 */
const formatCohortLabel = (dateStr) => {
  const d = new Date(dateStr);
  const month = d.getUTCMonth(); // 0-indexed
  const year = String(d.getUTCFullYear()).slice(-2);
  return `${BR_MONTHS[month]}/${year}`;
};

// ---------------------------------------------------------------------------
// Color scale for retention percentage cells
// ---------------------------------------------------------------------------
const getRetentionColor = (pct, isDark) => {
  if (pct === null || pct === undefined) return '';
  if (pct >= 70) return isDark ? 'bg-emerald-700/60 text-emerald-200' : 'bg-emerald-100 text-emerald-800';
  if (pct >= 50) return isDark ? 'bg-emerald-800/40 text-emerald-300' : 'bg-emerald-50 text-emerald-700';
  if (pct >= 30) return isDark ? 'bg-amber-800/40 text-amber-300' : 'bg-amber-50 text-amber-700';
  if (pct >= 15) return isDark ? 'bg-red-800/30 text-red-300' : 'bg-red-50 text-red-700';
  return isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800';
};

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
const CohortRetentionSkeleton = ({ isDark }) => {
  const rows = 6;
  const cols = 8; // cohort label + size + 7 month columns
  return (
    <div className={`
      rounded-xl p-4 sm:p-5
      ${isDark
        ? 'bg-gradient-to-br from-space-dust via-space-dust to-space-nebula/30 ring-1 ring-white/[0.08]'
        : 'bg-white ring-1 ring-slate-200 shadow-sm'}
    `}>
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-9 h-9 rounded-lg cosmic-shimmer ${isDark ? 'bg-space-nebula' : 'bg-slate-100'}`} />
        <div className="flex-1">
          <div className={`h-4 w-40 rounded cosmic-shimmer ${isDark ? 'bg-space-nebula' : 'bg-slate-100'}`} />
          <div className={`h-3 w-56 rounded mt-1.5 cosmic-shimmer ${isDark ? 'bg-space-nebula/60' : 'bg-slate-100/80'}`} />
        </div>
      </div>
      {/* Table skeleton */}
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-1.5">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className={`
                  h-8 rounded cosmic-shimmer
                  ${c === 0 ? 'w-16' : c === 1 ? 'w-12' : 'w-14'}
                  ${isDark ? 'bg-space-nebula' : 'bg-slate-100'}
                `}
                style={{ animationDelay: `${(r * cols + c) * 30}ms` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const CohortRetentionChart = ({ monthsBack = 12 }) => {
  const { isDark } = useTheme();
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ---- Data fetching ----
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const client = await getSupabaseClient();
      if (!client) {
        setError('Supabase nao configurado');
        return;
      }

      const { data: rows, error: rpcError } = await client.rpc('get_cohort_retention', {
        p_months_back: monthsBack
      });

      if (rpcError) {
        console.error('[CohortRetention] RPC error:', rpcError);
        setError(rpcError.message);
        return;
      }

      setData(rows);
    } catch (err) {
      console.error('[CohortRetention] Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [monthsBack]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---- Derived insight: find the biggest drop-off cliff ----
  const insight = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Average retention across all cohorts for each month offset
    const monthKeys = ['month_0_pct', 'month_1_pct', 'month_2_pct', 'month_3_pct', 'month_4_pct', 'month_5_pct', 'month_6_pct'];
    const avgRetention = monthKeys.map((key) => {
      const values = data.map(r => r[key]).filter(v => v !== null && v !== undefined);
      if (values.length === 0) return null;
      return values.reduce((sum, v) => sum + Number(v), 0) / values.length;
    });

    // Find the largest drop between consecutive months
    let maxDrop = 0;
    let dropFromIdx = 0;
    for (let i = 0; i < avgRetention.length - 1; i++) {
      if (avgRetention[i] !== null && avgRetention[i + 1] !== null) {
        const drop = avgRetention[i] - avgRetention[i + 1];
        if (drop > maxDrop) {
          maxDrop = drop;
          dropFromIdx = i;
        }
      }
    }

    const fromPct = avgRetention[dropFromIdx];
    const toPct = avgRetention[dropFromIdx + 1];
    const avgMonth1 = avgRetention[1];
    const avgMonth3 = avgRetention[3];

    return {
      avgRetention,
      dropFromIdx,
      dropToIdx: dropFromIdx + 1,
      fromPct: fromPct !== null ? fromPct.toFixed(1) : '-',
      toPct: toPct !== null ? toPct.toFixed(1) : '-',
      dropAmount: maxDrop.toFixed(1),
      avgMonth1: avgMonth1 !== null ? avgMonth1.toFixed(1) : '-',
      avgMonth3: avgMonth3 !== null ? avgMonth3.toFixed(1) : '-',
    };
  }, [data]);

  // Column headers
  const columnHeaders = ['M+0', 'M+1', 'M+2', 'M+3', 'M+4', 'M+5', 'M+6'];

  // ---- Render states ----
  if (loading) {
    return <CohortRetentionSkeleton isDark={isDark} />;
  }

  if (error) {
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  // Check if a month_N_pct value is valid for a given row
  // For triangular shape: month offset should not exceed the number of months
  // between the cohort month and the current month
  const now = new Date();
  const currentMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));

  const isCellAvailable = (cohortMonth, monthOffset) => {
    const cohort = new Date(cohortMonth);
    const monthsDiff = (currentMonth.getUTCFullYear() - cohort.getUTCFullYear()) * 12
      + (currentMonth.getUTCMonth() - cohort.getUTCMonth());
    return monthOffset <= monthsDiff;
  };

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING.SMOOTH}
      className={`
        rounded-xl p-4 sm:p-5
        ${isDark
          ? 'bg-gradient-to-br from-space-dust via-space-dust to-space-nebula/30 shadow-[inset_0_1px_0_0_rgba(0,174,239,0.05)] ring-1 ring-white/[0.08]'
          : 'bg-gradient-to-br from-white via-white to-slate-50/50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] ring-1 ring-slate-200 shadow-sm'}
      `}
    >
      {/* ---- Header ---- */}
      <div className="flex items-center gap-3 mb-4 sm:mb-5">
        {/* Icon badge */}
        <div className={`
          relative flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden
          ${isDark
            ? 'bg-gradient-to-br from-white/5 to-white/10 border border-white/10'
            : 'bg-gradient-to-br from-blue-500 to-blue-600'}
        `}>
          {isDark && (
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{ background: 'radial-gradient(circle at center, #00aeef, transparent 70%)' }}
            />
          )}
          <Users className={`relative z-10 w-4.5 h-4.5 ${isDark ? 'text-stellar-cyan' : 'text-white'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm sm:text-base font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Retencao por Coorte
          </h3>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
            % de clientes que retornaram apos o primeiro mes
          </p>
        </div>
      </div>

      {/* ---- Heatmap table ---- */}
      <div className={`${isMobile ? 'overflow-x-auto -mx-4 px-4' : ''}`}>
        <motion.table
          variants={prefersReducedMotion ? undefined : CHART_ANIMATION.HEATMAP.container}
          initial="hidden"
          animate="visible"
          className="w-full border-collapse"
          style={{ minWidth: isMobile ? '540px' : undefined }}
        >
          <thead>
            <tr>
              {/* Cohort month header */}
              <th className={`
                text-left text-xs font-medium px-2 py-2 whitespace-nowrap
                ${isDark ? 'text-slate-400' : 'text-slate-500'}
              `}>
                Coorte
              </th>
              {/* Cohort size header */}
              <th className={`
                text-center text-xs font-medium px-1.5 py-2 whitespace-nowrap
                ${isDark ? 'text-slate-400' : 'text-slate-500'}
              `}>
                <span className="flex items-center justify-center gap-1">
                  <Users className="w-3 h-3" />
                  Tam.
                </span>
              </th>
              {/* Month offset headers */}
              {columnHeaders.map((header) => (
                <th
                  key={header}
                  className={`
                    text-center text-xs font-medium px-1.5 py-2 whitespace-nowrap
                    ${isDark ? 'text-slate-400' : 'text-slate-500'}
                  `}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => {
              const monthPcts = [
                row.month_0_pct,
                row.month_1_pct,
                row.month_2_pct,
                row.month_3_pct,
                row.month_4_pct,
                row.month_5_pct,
                row.month_6_pct,
              ];

              return (
                <tr key={row.cohort_month}>
                  {/* Cohort month label */}
                  <td className={`
                    text-xs font-medium px-2 py-1.5 whitespace-nowrap
                    ${isDark ? 'text-slate-300' : 'text-slate-700'}
                  `}>
                    {formatCohortLabel(row.cohort_month)}
                  </td>
                  {/* Cohort size */}
                  <td className={`
                    text-center text-xs font-semibold tabular-nums px-1.5 py-1.5
                    ${isDark ? 'text-slate-300' : 'text-slate-600'}
                  `}>
                    {row.cohort_size}
                  </td>
                  {/* Retention cells */}
                  {monthPcts.map((pct, colIdx) => {
                    const available = isCellAvailable(row.cohort_month, colIdx);
                    const hasPct = pct !== null && pct !== undefined && available;

                    return (
                      <td key={colIdx} className="px-0.5 py-0.5">
                        {hasPct ? (
                          <motion.div
                            variants={prefersReducedMotion ? undefined : CHART_ANIMATION.HEATMAP.cell}
                            className={`
                              flex items-center justify-center rounded-md text-xs font-semibold tabular-nums
                              h-8 min-w-[48px]
                              ${getRetentionColor(Number(pct), isDark)}
                            `}
                          >
                            {Number(pct).toFixed(1)}%
                          </motion.div>
                        ) : (
                          <div className={`
                            flex items-center justify-center rounded-md h-8 min-w-[48px]
                            ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50/50'}
                          `}>
                            <span className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>
                              --
                            </span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </motion.table>
      </div>

      {/* ---- Insight box ---- */}
      {insight && (
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING.SMOOTH, delay: 0.3 }}
          className={`
            mt-4 rounded-xl border border-l-[3px] p-3 sm:p-4
            ${isDark
              ? 'bg-amber-500/[0.06] border-amber-500/20 border-l-amber-400/50'
              : 'bg-amber-50 border-amber-200 border-l-amber-400'}
          `}
        >
          <div className="flex items-start gap-2.5">
            {/* Icon */}
            <div className={`
              relative flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden mt-0.5
              ${isDark
                ? 'bg-gradient-to-br from-white/5 to-white/10 border border-white/10'
                : 'bg-gradient-to-br from-amber-500 to-amber-600'}
            `}>
              {isDark && (
                <div
                  className="absolute inset-0 opacity-25 pointer-events-none"
                  style={{ background: 'radial-gradient(circle at center, #f59e0b, transparent 70%)' }}
                />
              )}
              <TrendingDown className={`relative z-10 w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-white'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs sm:text-sm font-semibold ${isDark ? 'text-amber-100' : 'text-amber-900'}`}>
                Queda principal entre M+{insight.dropFromIdx} e M+{insight.dropToIdx}
              </p>
              <p className={`text-xs mt-0.5 leading-relaxed ${isDark ? 'text-amber-300/80' : 'text-amber-700'}`}>
                {insight.fromPct}% &rarr; {insight.toPct}% (queda de {insight.dropAmount} p.p.)
              </p>
              <div className={`flex flex-wrap items-center gap-3 mt-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <span className="flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Media M+1: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{insight.avgMonth1}%</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Media M+3: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{insight.avgMonth3}%</strong>
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ---- Color legend ---- */}
      <div className={`flex flex-wrap items-center gap-2 mt-3 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        <span className="mr-1">Escala:</span>
        {[
          { label: '>70%', color: isDark ? 'bg-emerald-700/60' : 'bg-emerald-100' },
          { label: '50-70%', color: isDark ? 'bg-emerald-800/40' : 'bg-emerald-50' },
          { label: '30-50%', color: isDark ? 'bg-amber-800/40' : 'bg-amber-50' },
          { label: '15-30%', color: isDark ? 'bg-red-800/30' : 'bg-red-50' },
          { label: '<15%', color: isDark ? 'bg-red-900/30' : 'bg-red-100' },
        ].map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1">
            <span className={`inline-block w-3 h-3 rounded ${color}`} />
            {label}
          </span>
        ))}
      </div>
    </motion.div>
  );
};

export default CohortRetentionChart;
