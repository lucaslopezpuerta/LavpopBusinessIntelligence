// SegmentCampaignMatrix.jsx v3.1 - COSMIC PRECISION POLISH
// Shows campaign return rates by customer segment and discount level
// Design System v6.4 compliant - Cosmic Precision
//
// DATA SOURCE:
// - contact_tracking (campaign contacts with return data)
// - campaigns (discount_percent per campaign)
// - customers (rfm_segment per customer)
//
// FEATURES:
// - Heatmap grid: rows = RFM segments, columns = discount buckets
// - Cell color intensity maps to return rate (green > amber > red > gray)
// - Sample size indicator (N=X) per cell for statistical confidence
// - Low-N cells (N<5) are dimmed with hatched pattern
// - Row totals showing overall segment response rate
// - Natural language insight summary in Portuguese
// - CSS-only hover (row highlighting, cell brightness)
// - Mobile card layout (replaces table on small screens)
// - Best segment row accent (emerald left border)
// - Loading skeleton, returns null on empty data
//
// CHANGELOG:
// v3.1 (2026-02-12): Cosmic Precision visual polish
//   - Header: gradient icon box (purple→indigo) with drop-shadow, tracking-tight title
//   - Badge: gradient pill with textShadow matching HealthPill pattern
//   - Table headers: subtle gradient background + uppercase labels
//   - Heatmap cells: glassmorphic inset highlight + ring on confident cells
//   - Row totals: gradient emphasis (stellar-cyan gradient)
//   - Insights: layered shadow cards replacing Bootstrap-style alerts
//   - Legend: pill-grouped items with ring-bordered color swatches
//   - Mobile cards: inset highlight + tracking-tight metrics
//   - Fixed text-[10px] → text-xs throughout (12px minimum per design system)
// v3.0 (2026-02-12): Coherence refactoring
//   - Stripped all framer-motion (parent AnimatedSection handles entrance)
//   - Simplified hover to CSS-only (matches CouponEffectiveness pattern)
//   - Removed bestCell overlay, keyboard nav, developer footer
//   - Aligned table styling with sibling components (bg-slate-100 headers, ring-1)
//   - HeatmapCell simplified from 16 props to 3
// v2.0 (2026-02-12): Interactive heatmap with 5 UX improvements
//   - Hover: row+column highlighting with cross-reference ring
//   - Mobile: card-based layout per segment with 3-col discount grid
//   - Animations: Framer Motion entrance with staggered cell reveal
//   - Accessibility: aria-labels, keyboard nav, scope attrs, improved contrast
//   - Polish: best segment row accent, best cell gradient, legend repositioned
// v1.0 (2026-02-09): Initial implementation
//   - Fetches contact_tracking, campaigns, customers from Supabase
//   - Builds segment x discount_bucket matrix in JS
//   - Heatmap with color-coded return rates
//   - Insight generation for best segment/discount combos
//   - Responsive: scrollable table on mobile
//   - Skeleton loading, graceful error handling

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LayoutGrid, Users, Target, Lightbulb, Info, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { getSupabaseClient } from '../../utils/supabaseClient';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEGMENTS = [
  { key: 'VIP', label: 'VIP', color: 'amber' },
  { key: 'Frequente', label: 'Frequente', color: 'emerald' },
  { key: 'Promissor', label: 'Promissor', color: 'blue' },
  { key: 'Novato', label: 'Novato', color: 'purple' },
  { key: 'Esfriando', label: 'Esfriando', color: 'orange' },
  { key: 'Inativo', label: 'Inativo', color: 'red' }
];

const DISCOUNT_BUCKETS = [
  { key: '0', label: 'Sem desconto', min: 0, max: 0 },
  { key: '5', label: '5%', min: 1, max: 5 },
  { key: '10', label: '10%', min: 6, max: 10 },
  { key: '15', label: '15%', min: 11, max: 15 },
  { key: '20', label: '20%', min: 16, max: 20 },
  { key: '25+', label: '25%+', min: 21, max: Infinity }
];

/** Minimum sample size for statistical confidence */
const MIN_SAMPLE_SIZE = 5;

/** Segment badge colors for row labels — solid gradient pills */
const SEGMENT_BADGE_COLORS = {
  amber: {
    dark: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/20',
    light: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/25'
  },
  emerald: {
    dark: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm shadow-emerald-500/20',
    light: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm shadow-emerald-500/25'
  },
  blue: {
    dark: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm shadow-blue-500/20',
    light: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm shadow-blue-500/25'
  },
  purple: {
    dark: 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-sm shadow-purple-500/20',
    light: 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-sm shadow-purple-500/25'
  },
  orange: {
    dark: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/20',
    light: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/25'
  },
  red: {
    dark: 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-sm shadow-red-500/20',
    light: 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-sm shadow-red-500/25'
  }
};

const NUMBER_FMT = new Intl.NumberFormat('pt-BR');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determine which discount bucket a given percent falls into
 */
function getDiscountBucket(percent) {
  const val = Number(percent) || 0;
  for (const bucket of DISCOUNT_BUCKETS) {
    if (val >= bucket.min && val <= bucket.max) {
      return bucket.key;
    }
  }
  return '25+';
}

/**
 * Return a heatmap color class based on return rate percentage.
 * Green (>40%) -> Amber (20-40%) -> Red (<20%) -> Gray (no data)
 */
function getHeatmapStyle(returnRate, contacts, isDark) {
  // No data
  if (contacts === 0) {
    return {
      bg: isDark ? 'bg-slate-800/40' : 'bg-slate-100/60',
      text: isDark ? 'text-slate-600' : 'text-slate-400',
      subText: isDark ? 'text-slate-700' : 'text-slate-400'
    };
  }

  // Insufficient data — improved contrast (a11y)
  if (contacts < MIN_SAMPLE_SIZE) {
    return {
      bg: isDark ? 'bg-slate-700/30' : 'bg-slate-100/80',
      text: isDark ? 'text-slate-300' : 'text-slate-600',
      subText: isDark ? 'text-slate-400' : 'text-slate-500',
      dimmed: true
    };
  }

  // High return rate (>40%)
  if (returnRate > 40) {
    return {
      bg: isDark ? 'bg-emerald-500/50' : 'bg-emerald-200',
      text: isDark ? 'text-emerald-100' : 'text-emerald-900',
      subText: isDark ? 'text-emerald-200/80' : 'text-emerald-700'
    };
  }

  // Medium-high return rate (30-40%)
  if (returnRate > 30) {
    return {
      bg: isDark ? 'bg-emerald-600/35' : 'bg-emerald-100',
      text: isDark ? 'text-emerald-100' : 'text-emerald-800',
      subText: isDark ? 'text-emerald-200/70' : 'text-emerald-600'
    };
  }

  // Medium return rate (20-30%)
  if (returnRate > 20) {
    return {
      bg: isDark ? 'bg-amber-500/40' : 'bg-amber-200',
      text: isDark ? 'text-amber-100' : 'text-amber-900',
      subText: isDark ? 'text-amber-200/80' : 'text-amber-700'
    };
  }

  // Low return rate (10-20%)
  if (returnRate > 10) {
    return {
      bg: isDark ? 'bg-orange-500/40' : 'bg-orange-200',
      text: isDark ? 'text-orange-100' : 'text-orange-900',
      subText: isDark ? 'text-orange-200/80' : 'text-orange-700'
    };
  }

  // Very low return rate (0-10%)
  return {
    bg: isDark ? 'bg-red-500/40' : 'bg-red-200',
    text: isDark ? 'text-red-100' : 'text-red-900',
    subText: isDark ? 'text-red-200/80' : 'text-red-700'
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Loading skeleton */
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
    {/* Header skeleton */}
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-10 h-10 rounded-xl animate-pulse ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
      <div className="flex-1 space-y-2">
        <div className={`h-4 w-56 rounded animate-pulse ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
        <div className={`h-3 w-36 rounded animate-pulse ${isDark ? 'bg-slate-700/60' : 'bg-slate-200/70'}`} />
      </div>
    </div>
    {/* Grid skeleton */}
    <div className="space-y-2 mb-5">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex gap-2">
          <div className={`h-10 w-24 rounded-lg animate-pulse ${isDark ? 'bg-slate-700/40' : 'bg-slate-100'}`} />
          {[...Array(6)].map((_, j) => (
            <div key={j} className={`h-10 flex-1 rounded-lg animate-pulse ${isDark ? 'bg-slate-700/30' : 'bg-slate-100/80'}`} />
          ))}
          <div className={`h-10 w-20 rounded-lg animate-pulse ${isDark ? 'bg-slate-700/40' : 'bg-slate-100'}`} />
        </div>
      ))}
    </div>
    {/* Insight skeleton */}
    <div className={`h-20 rounded-xl animate-pulse ${isDark ? 'bg-slate-700/30' : 'bg-slate-100/80'}`} />
  </div>
);

/** Individual heatmap cell — CSS-only hover */
const HeatmapCell = ({ returnRate, contacts, isDark }) => {
  const style = getHeatmapStyle(returnRate, contacts, isDark);

  return (
    <td className="p-0.5 sm:p-1">
      <div
        className={`
          relative rounded-lg px-2 py-2.5 text-center min-w-[56px] sm:min-w-[64px]
          ${style.bg}
          ${style.dimmed ? 'opacity-60' : ''}
          ${contacts > 0 ? 'hover:brightness-110' : ''}
          ${contacts >= MIN_SAMPLE_SIZE
            ? (isDark
                ? 'ring-1 ring-white/[0.06] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
                : 'ring-1 ring-black/[0.04] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]')
            : ''}
          transition-all duration-150 cursor-default
        `}
        role="gridcell"
        aria-label={contacts === 0
          ? 'sem dados'
          : `${returnRate.toFixed(1)}% retorno, ${contacts} contatos`}
      >
        {/* Hatched pattern overlay for insufficient data */}
        {style.dimmed && (
          <div
            className="absolute inset-0 rounded-lg pointer-events-none opacity-20"
            style={{
              backgroundImage: isDark
                ? 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(148,163,184,0.3) 3px, rgba(148,163,184,0.3) 4px)'
                : 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(100,116,139,0.15) 3px, rgba(100,116,139,0.15) 4px)'
            }}
            aria-hidden="true"
          />
        )}

        {contacts === 0 ? (
          <span className={`text-xs ${style.text}`}>--</span>
        ) : (
          <>
            <span className={`text-xs sm:text-sm font-bold tabular-nums tracking-tight block relative ${style.text}`}>
              {returnRate.toFixed(1)}%
            </span>
            <span className={`text-xs tabular-nums block mt-0.5 relative ${style.subText}`}>
              N={NUMBER_FMT.format(contacts)}
            </span>
          </>
        )}
      </div>
    </td>
  );
};

/** Row total cell showing overall segment response rate */
const RowTotalCell = ({ returnRate, contacts, isDark }) => {
  if (contacts === 0) {
    return (
      <td className="p-0.5 sm:p-1">
        <div
          className={`
            rounded-lg px-2 py-2 sm:py-2.5 text-center min-w-[56px] sm:min-w-[64px]
            ${isDark ? 'bg-slate-700/30' : 'bg-slate-100/60'}
          `}
        >
          <span className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>--</span>
        </div>
      </td>
    );
  }

  return (
    <td className="p-0.5 sm:p-1">
      <div
        className={`
          rounded-lg px-2 py-2.5 text-center min-w-[56px] sm:min-w-[64px]
          ${isDark
            ? 'bg-gradient-to-br from-stellar-cyan/15 to-stellar-cyan/5 ring-1 ring-stellar-cyan/20 shadow-[inset_0_1px_0_0_rgba(0,174,239,0.1)]'
            : 'bg-gradient-to-br from-sky-50 to-blue-50 ring-1 ring-sky-200/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]'}
        `}
      >
        <span className={`text-xs sm:text-sm font-bold tabular-nums tracking-tight block ${isDark ? 'text-stellar-cyan' : 'text-sky-700'}`}>
          {returnRate.toFixed(1)}%
        </span>
        <span className={`text-xs tabular-nums block mt-0.5 ${isDark ? 'text-stellar-cyan/60' : 'text-sky-500/70'}`}>
          N={NUMBER_FMT.format(contacts)}
        </span>
      </div>
    </td>
  );
};

/** Mobile card for a single segment's discount breakdown */
const SegmentCard = ({ segment, discountData, total, isDark, bestSegKey }) => {
  const badgeColor = SEGMENT_BADGE_COLORS[segment.color] || SEGMENT_BADGE_COLORS.blue;

  // Find best discount for this segment
  const bestBucket = discountData
    .filter(d => d.contacts >= MIN_SAMPLE_SIZE)
    .sort((a, b) => b.returnRate - a.returnRate)[0];

  const isTopSegment = segment.key === bestSegKey;

  return (
    <div
      className={`
        p-4 rounded-xl
        ${isTopSegment ? 'border-l-[3px] border-l-emerald-500' : ''}
        ${isDark
          ? 'bg-gradient-to-br from-space-dust via-space-dust to-space-nebula/30 ring-1 ring-white/[0.08] shadow-[inset_0_1px_0_0_rgba(0,174,239,0.05)]'
          : 'bg-gradient-to-br from-white via-white to-slate-50/50 ring-1 ring-slate-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]'}
        shadow-sm
      `}
    >
      {/* Segment header */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${isDark ? badgeColor.dark : badgeColor.light}`}
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}
        >
          {segment.label}
        </span>
        <div className="text-right">
          <span className={`text-sm font-bold tabular-nums tracking-tight ${isDark ? 'text-stellar-cyan' : 'text-sky-700'}`}>
            {total.contacts > 0 ? `${total.returnRate.toFixed(1)}%` : '--'}
          </span>
          <span className={`text-xs block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {total.contacts > 0 ? `${NUMBER_FMT.format(total.contacts)} contatos` : 'sem dados'}
          </span>
        </div>
      </div>

      {/* Discount breakdown grid */}
      <div className="grid grid-cols-3 gap-2">
        {discountData.map(d => {
          const cellStyle = getHeatmapStyle(d.returnRate, d.contacts, isDark);
          const isBest = bestBucket && d.bucketKey === bestBucket.bucketKey;
          return (
            <div
              key={d.bucketKey}
              className={`
                rounded-lg px-2 py-2 text-center
                ${cellStyle.bg}
                ${d.contacts < MIN_SAMPLE_SIZE && d.contacts > 0 ? 'opacity-60' : ''}
                ${isBest ? (isDark ? 'ring-1 ring-stellar-cyan/30' : 'ring-1 ring-indigo-300') : ''}
                ${d.contacts >= MIN_SAMPLE_SIZE
                  ? (isDark
                      ? 'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
                      : 'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]')
                  : ''}
              `}
            >
              <p className={`text-xs font-medium ${isDark ? 'text-white' : 'text-slate-600'} mb-0.5`}>
                {d.bucketLabel}
              </p>
              {d.contacts === 0 ? (
                <span className={`text-xs ${cellStyle.text}`}>--</span>
              ) : (
                <>
                  <span className={`text-xs font-bold tabular-nums tracking-tight block ${cellStyle.text}`}>
                    {d.returnRate.toFixed(1)}%
                  </span>
                  <span className={`text-xs tabular-nums block ${cellStyle.subText}`}>
                    N={NUMBER_FMT.format(d.contacts)}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Insight generation
// ---------------------------------------------------------------------------

/**
 * Generate natural-language insights from the matrix data.
 * Returns array of { type, title, message } for InsightBox-like rendering.
 */
function generateInsights(matrix, segmentTotals) {
  const insights = [];

  // Buckets with actual discounts (exclude "sem desconto" campaigns)
  const discountBuckets = DISCOUNT_BUCKETS.filter(b => b.key !== '0');

  // Helper: find best bucket for a segment within a set of buckets
  const findBest = (segKey, buckets) => {
    let best = null;
    let bestRate = -1;
    for (const bucket of buckets) {
      const cell = matrix[segKey]?.[bucket.key];
      if (cell && cell.contacts >= MIN_SAMPLE_SIZE && cell.returnRate > bestRate) {
        bestRate = cell.returnRate;
        best = { discount: bucket.label, bucketKey: bucket.key, ...cell };
      }
    }
    return best;
  };

  // 1. Best segment x discount combination (only actual discounts)
  let bestCombo = null;
  let bestRate = -1;

  for (const seg of SEGMENTS) {
    for (const bucket of discountBuckets) {
      const cell = matrix[seg.key]?.[bucket.key];
      if (cell && cell.contacts >= MIN_SAMPLE_SIZE && cell.returnRate > bestRate) {
        bestRate = cell.returnRate;
        bestCombo = { segment: seg.label, discount: bucket.label, ...cell };
      }
    }
  }

  if (bestCombo) {
    insights.push({
      type: 'success',
      title: 'Melhor Combinacao',
      message: `Clientes "${bestCombo.segment}" com ${bestCombo.discount} de desconto têm a melhor taxa de retorno: ${bestCombo.returnRate.toFixed(1)}% (${NUMBER_FMT.format(bestCombo.returned)}/${NUMBER_FMT.format(bestCombo.contacts)} retornaram).`
    });
  }

  // 2. Per-segment insights (VIP + at-risk segments)
  for (const seg of ['VIP', 'Esfriando', 'Inativo']) {
    const segData = SEGMENTS.find(s => s.key === seg);
    if (!segData) continue;

    if (seg === 'VIP') {
      // Check if VIPs return naturally (sem desconto)
      const noDiscountCell = matrix.VIP?.['0'];
      const hasNaturalReturn = noDiscountCell && noDiscountCell.contacts >= MIN_SAMPLE_SIZE && noDiscountCell.returnRate > 0;

      if (hasNaturalReturn) {
        insights.push({
          type: 'info',
          title: 'VIPs',
          message: `VIPs retornam naturalmente sem necessidade de desconto (${noDiscountCell.returnRate.toFixed(1)}% de retorno com ${NUMBER_FMT.format(noDiscountCell.contacts)} contatos), indicando alta fidelidade.`
        });
      } else {
        // Fallback: find best actual discount for VIPs
        const segBest = findBest('VIP', discountBuckets);
        if (segBest) {
          insights.push({
            type: 'info',
            title: 'VIPs',
            message: `VIPs respondem melhor com ${segBest.discount} de desconto (${segBest.returnRate.toFixed(1)}% de retorno).`
          });
        }
      }
    } else {
      // At-risk segments: only look at actual discounts
      const segBest = findBest(seg, discountBuckets);
      if (segBest) {
        insights.push({
          type: 'warning',
          title: segData.label,
          message: `${segData.label === 'Inativo' ? 'Inativos precisam' : 'Clientes esfriando precisam'} de pelo menos ${segBest.discount} de desconto para retornar (${segBest.returnRate.toFixed(1)}% de taxa).`
        });
      }
    }
  }

  // 3. Best overall segment by return rate
  const rankedSegments = [...segmentTotals]
    .filter(s => s.contacts >= MIN_SAMPLE_SIZE)
    .sort((a, b) => b.returnRate - a.returnRate);

  if (rankedSegments.length >= 2) {
    const best = rankedSegments[0];
    const worst = rankedSegments[rankedSegments.length - 1];

    insights.push({
      type: 'action',
      title: 'Desempenho Geral',
      message: `"${best.label}" e o segmento mais responsivo (${best.returnRate.toFixed(1)}% retorno geral), enquanto "${worst.label}" e o menos responsivo (${worst.returnRate.toFixed(1)}%).`
    });
  }

  // 4. Segments with insufficient data
  const lowDataSegments = segmentTotals
    .filter(s => s.contacts > 0 && s.contacts < MIN_SAMPLE_SIZE);

  if (lowDataSegments.length > 0) {
    insights.push({
      type: 'default',
      title: 'Dados Insuficientes',
      message: `${lowDataSegments.map(s => `"${s.label}"`).join(', ')} ${lowDataSegments.length === 1 ? 'tem' : 'têm'} menos de ${MIN_SAMPLE_SIZE} contatos - envie mais campanhas para dados confiaveis.`
    });
  }

  return insights;
}

// ---------------------------------------------------------------------------
// Insight item renderer (simplified version matching InsightBox patterns)
// ---------------------------------------------------------------------------

const INSIGHT_STYLES = (isDark) => ({
  success: {
    bg: isDark ? 'bg-emerald-500/[0.06] border-emerald-500/20' : 'bg-green-50 border-green-200',
    icon: isDark ? 'text-emerald-400' : 'text-green-600',
    title: isDark ? 'text-emerald-100' : 'text-green-900',
    message: isDark ? 'text-emerald-300/80' : 'text-green-700',
    borderAccent: isDark ? 'border-l-emerald-400/50' : 'border-l-emerald-400'
  },
  warning: {
    bg: isDark ? 'bg-amber-500/[0.06] border-amber-500/20' : 'bg-amber-50 border-amber-200',
    icon: isDark ? 'text-amber-400' : 'text-amber-600',
    title: isDark ? 'text-amber-100' : 'text-amber-900',
    message: isDark ? 'text-amber-300/80' : 'text-amber-700',
    borderAccent: isDark ? 'border-l-amber-400/50' : 'border-l-amber-400'
  },
  info: {
    bg: isDark ? 'bg-stellar-cyan/[0.06] border-stellar-cyan/20' : 'bg-blue-50 border-blue-200',
    icon: isDark ? 'text-stellar-cyan' : 'text-blue-600',
    title: isDark ? 'text-blue-100' : 'text-blue-900',
    message: isDark ? 'text-blue-300/80' : 'text-blue-700',
    borderAccent: isDark ? 'border-l-stellar-cyan/50' : 'border-l-blue-400'
  },
  action: {
    bg: isDark ? 'bg-purple-500/[0.06] border-purple-500/20' : 'bg-purple-50 border-purple-200',
    icon: isDark ? 'text-purple-400' : 'text-purple-600',
    title: isDark ? 'text-purple-100' : 'text-purple-900',
    message: isDark ? 'text-purple-300/80' : 'text-purple-700',
    borderAccent: isDark ? 'border-l-purple-400/50' : 'border-l-purple-400'
  },
  default: {
    bg: isDark ? 'bg-slate-500/[0.06] border-slate-500/20' : 'bg-slate-50 border-slate-200',
    icon: isDark ? 'text-slate-400' : 'text-slate-600',
    title: isDark ? 'text-slate-100' : 'text-slate-900',
    message: isDark ? 'text-slate-300/80' : 'text-slate-700',
    borderAccent: isDark ? 'border-l-slate-400/50' : 'border-l-slate-400'
  }
});

const INSIGHT_ICONS = {
  success: Target,
  warning: AlertTriangle,
  info: Lightbulb,
  action: Users,
  default: Info
};

const InsightItem = ({ type, title, message, isDark }) => {
  const styles = INSIGHT_STYLES(isDark);
  const style = styles[type] || styles.default;
  const Icon = INSIGHT_ICONS[type] || Info;

  return (
    <div
      className={`
        ${style.bg} border-l-[3px] ${style.borderAccent} rounded-xl p-3 sm:p-4
        ${isDark
          ? 'ring-1 ring-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]'
          : 'ring-1 ring-slate-200/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]'}
        shadow-sm
      `}
      role="alert"
    >
      <div className="flex items-start gap-2.5 sm:gap-3">
        <div className={`flex-shrink-0 mt-0.5 ${style.icon}`}>
          <Icon className="w-4 h-4" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`font-semibold text-sm ${style.title} mb-0.5`}>
              {title}
            </h4>
          )}
          <p className={`text-xs sm:text-sm ${style.message} leading-relaxed`}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Legend renderer (shared between mobile and desktop)
// ---------------------------------------------------------------------------

const LegendItems = ({ items, isDark }) => (
  <>
    {items.map(item => (
      <div
        key={item.label}
        className="inline-flex items-center gap-1.5"
        role="listitem"
      >
        <div
          className={`
            w-2.5 h-2.5 rounded-sm ${item.bg} ${item.hatched ? 'opacity-50' : ''}
            ring-1 ${isDark ? 'ring-white/[0.08]' : 'ring-black/[0.06]'}
          `}
          style={item.hatched ? {
            backgroundImage: isDark
              ? 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(148,163,184,0.3) 2px, rgba(148,163,184,0.3) 3px)'
              : 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(100,116,139,0.15) 2px, rgba(100,116,139,0.15) 3px)'
          } : undefined}
        />
        <span className={`text-xs tabular-nums ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {item.label}
        </span>
      </div>
    ))}
  </>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const SegmentCampaignMatrix = ({ className = '' }) => {
  const { isDark } = useTheme();
  const isMobile = useIsMobile();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // State
  const [contacts, setContacts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [customers, setCustomers] = useState([]);
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
        setError('Supabase nao configurado');
        return;
      }

      // Fetch all three data sources in parallel
      const [contactsRes, campaignsRes, customersRes] = await Promise.all([
        client
          .from('contact_tracking')
          .select('customer_id, campaign_id, returned_at, return_revenue, risk_level')
          .not('campaign_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(5000),
        client
          .from('campaigns')
          .select('id, name, discount_percent, service_type')
          .order('created_at', { ascending: false }),
        client
          .from('customers')
          .select('doc, rfm_segment, risk_level')
          .not('rfm_segment', 'is', null)
      ]);

      if (contactsRes.error) throw contactsRes.error;
      if (campaignsRes.error) throw campaignsRes.error;
      if (customersRes.error) throw customersRes.error;

      setContacts(contactsRes.data || []);
      setCampaigns(campaignsRes.data || []);
      setCustomers(customersRes.data || []);
    } catch (err) {
      console.error('[SegmentCampaignMatrix] Fetch error:', err);
      setError(err.message || 'Erro ao carregar dados da matriz');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // -----------------------------------------------------------------------
  // Data processing
  // -----------------------------------------------------------------------

  const { matrix, segmentTotals, totalContacts, bestSegKey, insights } = useMemo(() => {
    if (!contacts.length || !campaigns.length || !customers.length) {
      return { matrix: {}, segmentTotals: [], totalContacts: 0, bestSegKey: null, insights: [] };
    }

    // 1. Build lookup maps
    const customerSegmentMap = new Map();
    for (const c of customers) {
      if (c.doc && c.rfm_segment) {
        customerSegmentMap.set(c.doc, c.rfm_segment);
      }
    }

    const campaignDiscountMap = new Map();
    for (const c of campaigns) {
      if (c.id != null) {
        campaignDiscountMap.set(c.id, Number(c.discount_percent) || 0);
      }
    }

    // 2. Build matrix: segment x discount_bucket -> { contacts, returned }
    const matrixData = {};
    const segTotals = {};

    // Initialize matrix
    for (const seg of SEGMENTS) {
      matrixData[seg.key] = {};
      segTotals[seg.key] = { contacts: 0, returned: 0 };
      for (const bucket of DISCOUNT_BUCKETS) {
        matrixData[seg.key][bucket.key] = { contacts: 0, returned: 0 };
      }
    }

    let total = 0;

    // 3. Populate matrix
    for (const contact of contacts) {
      const segment = customerSegmentMap.get(contact.customer_id);
      if (!segment || !matrixData[segment]) continue;

      const discount = campaignDiscountMap.get(contact.campaign_id);
      if (discount === undefined) continue;

      const bucketKey = getDiscountBucket(discount);
      const cell = matrixData[segment][bucketKey];
      if (!cell) continue;

      cell.contacts++;
      segTotals[segment].contacts++;
      total++;

      if (contact.returned_at != null) {
        cell.returned++;
        segTotals[segment].returned++;
      }
    }

    // 4. Calculate return rates
    for (const seg of SEGMENTS) {
      for (const bucket of DISCOUNT_BUCKETS) {
        const cell = matrixData[seg.key][bucket.key];
        cell.returnRate = cell.contacts > 0
          ? (cell.returned / cell.contacts) * 100
          : 0;
      }
      const st = segTotals[seg.key];
      st.returnRate = st.contacts > 0 ? (st.returned / st.contacts) * 100 : 0;
      st.label = seg.label;
    }

    // 5. Build segment totals array for insights
    const segTotalsArray = SEGMENTS.map(seg => ({
      ...segTotals[seg.key],
      key: seg.key,
      label: seg.label
    }));

    // 6. Best segment (for row accent)
    const topSeg = [...segTotalsArray]
      .filter(s => s.contacts >= MIN_SAMPLE_SIZE)
      .sort((a, b) => b.returnRate - a.returnRate)[0]?.key || null;

    // 7. Generate insights
    const insightsData = generateInsights(matrixData, segTotalsArray);

    return {
      matrix: matrixData,
      segmentTotals: segTotalsArray,
      totalContacts: total,
      bestSegKey: topSeg,
      insights: insightsData
    };
  }, [contacts, campaigns, customers]);

  // Legend items — use stronger/opaque colors so tiny swatches are distinguishable
  const legendItems = useMemo(() => [
    { label: '>40%', bg: isDark ? 'bg-emerald-500' : 'bg-emerald-500' },
    { label: '30-40%', bg: isDark ? 'bg-emerald-700' : 'bg-emerald-300' },
    { label: '20-30%', bg: isDark ? 'bg-amber-500' : 'bg-amber-400' },
    { label: '10-20%', bg: isDark ? 'bg-orange-500' : 'bg-orange-400' },
    { label: '<10%', bg: isDark ? 'bg-red-500' : 'bg-red-400' },
    { label: 'N<5', bg: isDark ? 'bg-slate-600' : 'bg-slate-300', hatched: true }
  ], [isDark]);

  // -----------------------------------------------------------------------
  // Render guards
  // -----------------------------------------------------------------------

  if (loading) return <LoadingSkeleton isDark={isDark} />;

  // No contact tracking data at all: return null (silently hide)
  if (error || totalContacts === 0) return null;

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
        <div className="flex items-start gap-3 min-w-0">
          <div className={`
            w-10 h-10 rounded-xl shrink-0 flex items-center justify-center
            bg-gradient-to-br from-purple-500 to-indigo-600
            shadow-md shadow-purple-500/25 dark:shadow-purple-400/20
          `}>
            <LayoutGrid className="w-5 h-5 text-white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className={`${isDesktop ? 'text-base' : 'text-sm'} font-bold tracking-tight text-slate-900 dark:text-white`}>
              Matriz Segmento x Campanha
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              Taxa de retorno por segmento RFM e nivel de desconto &bull; {NUMBER_FMT.format(totalContacts)} contatos
            </p>
          </div>
        </div>

        {/* Total contacts badge */}
        <div
          className={`
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0
            bg-gradient-to-r from-purple-500 to-indigo-500
            shadow-md shadow-purple-500/20
          `}
        >
          <Users className="w-3.5 h-3.5 text-white" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.15))' }} aria-hidden="true" />
          <span
            className="text-xs font-bold text-white tabular-nums whitespace-nowrap"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}
          >
            {NUMBER_FMT.format(totalContacts)}
          </span>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* HEATMAP (Desktop: table, Mobile: cards)                           */}
      {/* ----------------------------------------------------------------- */}
      <div className="mb-5">
        {/* Section label + desktop legend */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isMobile ? 'Retorno por Segmento' : 'Heatmap de Retorno (%)'}
          </p>

          {/* Desktop inline legend */}
          {!isMobile && (
            <div className="flex items-center gap-3" role="list" aria-label="Legenda de cores">
              <LegendItems items={legendItems} isDark={isDark} />
            </div>
          )}
        </div>

        {isMobile ? (
          /* ============================================================= */
          /* MOBILE: Card-based layout                                     */
          /* ============================================================= */
          <div className="space-y-3">
            {SEGMENTS.map(seg => {
              const rowTotal = segmentTotals.find(s => s.key === seg.key) || { contacts: 0, returned: 0, returnRate: 0 };
              const discountData = DISCOUNT_BUCKETS.map(bucket => ({
                bucketKey: bucket.key,
                bucketLabel: bucket.label,
                ...(matrix[seg.key]?.[bucket.key] || { contacts: 0, returned: 0, returnRate: 0 })
              }));
              return (
                <SegmentCard
                  key={seg.key}
                  segment={seg}
                  discountData={discountData}
                  total={rowTotal}
                  isDark={isDark}
                  bestSegKey={bestSegKey}
                />
              );
            })}
          </div>
        ) : (
          /* ============================================================= */
          /* DESKTOP: Heatmap table                                        */
          /* ============================================================= */
          <div
            className={`
              rounded-xl overflow-hidden
              ${isDark
                ? 'ring-1 ring-white/[0.06]'
                : 'ring-1 ring-slate-200/60'}
            `}
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" role="grid" aria-label="Matriz de retorno por segmento e desconto">
                {/* Column Headers */}
                <thead>
                  <tr className={`
                    ${isDark
                      ? 'bg-space-nebula border-b border-white/[0.06]'
                      : 'bg-slate-100 border-b border-slate-200/60'}
                  `}>
                    {/* Segment label column */}
                    <th
                      scope="col"
                      className={`
                        text-center px-3 py-2.5 text-xs font-semibold uppercase tracking-wider
                        ${isDark ? 'text-slate-400' : 'text-slate-500'}
                        sticky left-0 z-10
                        ${isDark ? 'bg-space-nebula' : 'bg-slate-100'}
                      `}
                    >
                      Segmento
                    </th>

                    {/* Discount bucket columns */}
                    {DISCOUNT_BUCKETS.map(bucket => (
                      <th
                        key={bucket.key}
                        scope="col"
                        className={`
                          text-center px-1 py-2.5 text-xs font-semibold uppercase tracking-wider
                          ${isDark ? 'text-slate-400' : 'text-slate-500'}
                        `}
                      >
                        {bucket.label}
                      </th>
                    ))}

                    {/* Row total column */}
                    <th
                      scope="col"
                      className={`
                        text-center px-1 py-2.5 text-xs font-bold uppercase tracking-wider
                        ${isDark ? 'text-stellar-cyan' : 'text-sky-600'}
                      `}
                    >
                      Total
                    </th>
                  </tr>
                </thead>

                {/* Data Rows */}
                <tbody>
                  {SEGMENTS.map((seg, rowIdx) => {
                    const rowTotal = segmentTotals.find(s => s.key === seg.key) || { contacts: 0, returned: 0, returnRate: 0 };
                    const badgeColor = SEGMENT_BADGE_COLORS[seg.color] || SEGMENT_BADGE_COLORS.blue;
                    const isOdd = rowIdx % 2 !== 0;
                    const isBestRow = seg.key === bestSegKey;

                    // Alternating row bg (matching CouponEffectiveness pattern)
                    const rowBg = isOdd
                      ? (isDark ? 'bg-space-dust/20' : 'bg-slate-50/50')
                      : '';

                    return (
                      <tr
                        key={seg.key}
                        className={`
                          ${rowBg}
                          ${isBestRow ? 'border-l-[3px] border-l-emerald-500' : 'border-l-[3px] border-l-transparent'}
                          ${isDark ? 'hover:bg-space-dust/50' : 'hover:bg-slate-50'}
                          transition-colors duration-150
                        `}
                      >
                        {/* Segment label (sticky on scroll) */}
                        <th
                          scope="row"
                          className={`
                            px-2 sm:px-3 py-1.5
                            sticky left-0 z-10 text-center font-normal
                            ${rowBg}
                            ${isDark ? 'hover:bg-space-dust/50' : 'hover:bg-slate-50'}
                          `}
                        >
                          <span
                            className={`
                              inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap
                              ${isDark ? badgeColor.dark : badgeColor.light}
                            `}
                            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}
                          >
                            {seg.label}
                          </span>
                        </th>

                        {/* Heatmap cells */}
                        {DISCOUNT_BUCKETS.map(bucket => {
                          const cell = matrix[seg.key]?.[bucket.key] || { contacts: 0, returned: 0, returnRate: 0 };
                          return (
                            <HeatmapCell
                              key={bucket.key}
                              returnRate={cell.returnRate}
                              contacts={cell.contacts}
                              isDark={isDark}
                            />
                          );
                        })}

                        {/* Row total */}
                        <RowTotalCell
                          returnRate={rowTotal.returnRate}
                          contacts={rowTotal.contacts}
                          isDark={isDark}
                        />
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mobile legend (below cards) */}
        {isMobile && (
          <div className="flex flex-wrap items-center gap-2.5 mt-3" role="list" aria-label="Legenda de cores">
            <span className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Legenda:
            </span>
            <LegendItems items={legendItems} isDark={isDark} />
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* INSIGHTS                                                          */}
      {/* ----------------------------------------------------------------- */}
      {insights.length > 0 && (
        <div aria-live="polite">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }} aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Insights
            </p>
          </div>
          <div className="space-y-2">
            {insights.map((insight, idx) => (
              <InsightItem
                key={idx}
                type={insight.type}
                title={insight.title}
                message={insight.message}
                isDark={isDark}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SegmentCampaignMatrix;
