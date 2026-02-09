// CouponEffectiveness.jsx v1.0 - Coupon Performance Analytics
// Shows per-coupon metrics, discount vs ticket chart, and summary KPIs
// Design System v6.4 compliant - Cosmic Precision
//
// DATA SOURCE:
// - coupon_effectiveness view (per-coupon aggregated metrics)
//
// FEATURES:
// - Summary KPI cards (total redemptions, revenue, best coupon, avg ticket)
// - Bar chart comparing discount % vs avg ticket across coupons
// - Sortable per-coupon metrics table (desktop) / card list (mobile)
// - Best-performing coupon highlighted with green left border accent
// - Portuguese labels (Brazilian app)
//
// CHANGELOG:
// v1.0 (2026-02-09): Initial implementation
//   - Fetches from coupon_effectiveness view
//   - KPI summary row with 4 cards
//   - Recharts BarChart (discount % vs avg ticket)
//   - Responsive table (desktop) / card list (mobile)
//   - Skeleton loading state, null on empty data
//   - Graceful error handling

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Ticket, Award, DollarSign, Users, Hash, Info, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { getSupabaseClient } from '../../utils/supabaseClient';

// ---------------------------------------------------------------------------
// Constants & Formatters
// ---------------------------------------------------------------------------

const CURRENCY_FMT = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const CURRENCY_SHORT_FMT = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

const NUMBER_FMT = new Intl.NumberFormat('pt-BR');

/**
 * Format a TIMESTAMPTZ string as DD/MM/YYYY
 */
function formatDate(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '--';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Chart bar accent colors (alternating)
const BAR_COLORS_DARK = ['#00aeef', '#a78bfa', '#00d68f', '#fbbf24', '#f472b6', '#60a5fa'];
const BAR_COLORS_LIGHT = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

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
        <div className={`h-4 w-48 rounded animate-pulse ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
        <div className={`h-3 w-32 rounded animate-pulse ${isDark ? 'bg-slate-700/60' : 'bg-slate-200/70'}`} />
      </div>
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      {[...Array(4)].map((_, i) => (
        <div key={i} className={`h-20 rounded-xl animate-pulse ${isDark ? 'bg-slate-700/40' : 'bg-slate-100'}`} />
      ))}
    </div>
    <div className={`h-52 rounded-xl animate-pulse mb-5 ${isDark ? 'bg-slate-700/30' : 'bg-slate-100/80'}`} />
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className={`h-12 rounded-lg animate-pulse ${isDark ? 'bg-slate-700/30' : 'bg-slate-100/80'}`} />
      ))}
    </div>
  </div>
);

/** Custom tooltip for the bar chart */
const ChartTooltip = ({ active, payload, isDark }) => {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div
      className={`
        px-3 py-2 rounded-lg text-xs shadow-lg
        ${isDark
          ? 'bg-space-nebula/95 border border-stellar-cyan/20 text-white'
          : 'bg-white/95 border border-slate-200 text-slate-800'}
      `}
    >
      <p className="font-semibold mb-1">{item.codigo_cupom}</p>
      <p>Desconto: {item.discount_percent}%</p>
      <p>Ticket Medio: {CURRENCY_FMT.format(item.avg_ticket)}</p>
      <p>Resgates: {NUMBER_FMT.format(item.redemptions)}</p>
    </div>
  );
};

/** Mobile card for a single coupon */
const CouponCard = ({ coupon, isBest, isDark }) => (
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
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
        {coupon.codigo_cupom}
      </span>
      {isBest && (
        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <Award className="w-3.5 h-3.5" aria-hidden="true" />
          Melhor
        </span>
      )}
    </div>
    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 truncate">
      {coupon.campaign_name || '--'}
    </p>
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
      <div>
        <span className="text-slate-500 dark:text-slate-400">Resgates</span>
        <p className="font-semibold text-slate-900 dark:text-white tabular-nums">
          {NUMBER_FMT.format(coupon.redemptions)}
        </p>
      </div>
      <div>
        <span className="text-slate-500 dark:text-slate-400">Clientes</span>
        <p className="font-semibold text-slate-900 dark:text-white tabular-nums">
          {NUMBER_FMT.format(coupon.unique_customers)}
        </p>
      </div>
      <div>
        <span className="text-slate-500 dark:text-slate-400">Receita</span>
        <p className="font-semibold text-slate-900 dark:text-white tabular-nums">
          {CURRENCY_FMT.format(coupon.total_revenue)}
        </p>
      </div>
      <div>
        <span className="text-slate-500 dark:text-slate-400">Ticket Medio</span>
        <p className="font-semibold text-slate-900 dark:text-white tabular-nums">
          {CURRENCY_FMT.format(coupon.avg_ticket)}
        </p>
      </div>
      <div>
        <span className="text-slate-500 dark:text-slate-400">Desconto</span>
        <p className="font-semibold text-slate-900 dark:text-white tabular-nums">
          {coupon.discount_percent}%
        </p>
      </div>
      <div>
        <span className="text-slate-500 dark:text-slate-400">Ultimo Resgate</span>
        <p className="font-semibold text-slate-900 dark:text-white tabular-nums">
          {formatDate(coupon.last_redemption)}
        </p>
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const CouponEffectiveness = ({ className = '' }) => {
  const { isDark } = useTheme();
  const isMobile = useIsMobile();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // State
  const [coupons, setCoupons] = useState([]);
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

      const { data, error: fetchError } = await client
        .from('coupon_effectiveness')
        .select('*')
        .order('total_revenue', { ascending: false });

      if (fetchError) throw fetchError;

      setCoupons(data || []);
    } catch (err) {
      console.error('[CouponEffectiveness] Fetch error:', err);
      setError(err.message || 'Erro ao carregar dados de cupons');
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

  /** Summary KPIs */
  const summary = useMemo(() => {
    if (!coupons.length) return null;

    const totalRedemptions = coupons.reduce((sum, c) => sum + (Number(c.redemptions) || 0), 0);
    const totalRevenue = coupons.reduce((sum, c) => sum + (Number(c.total_revenue) || 0), 0);
    const totalCustomers = coupons.reduce((sum, c) => sum + (Number(c.unique_customers) || 0), 0);

    // Weighted average ticket (weighted by redemptions)
    const weightedTicketSum = coupons.reduce(
      (sum, c) => sum + (Number(c.avg_ticket) || 0) * (Number(c.redemptions) || 0),
      0
    );
    const avgTicket = totalRedemptions > 0 ? weightedTicketSum / totalRedemptions : 0;

    // Best coupon = highest total_revenue (already sorted desc)
    const bestCoupon = coupons[0];

    return {
      totalRedemptions,
      totalRevenue,
      totalCustomers,
      avgTicket,
      bestCoupon
    };
  }, [coupons]);

  /** Chart data for discount vs avg ticket comparison */
  const chartData = useMemo(() => {
    if (!coupons.length) return [];

    return coupons
      .filter((c) => c.discount_percent != null && c.avg_ticket != null)
      .map((c) => ({
        codigo_cupom: c.codigo_cupom,
        discount_percent: Number(c.discount_percent),
        avg_ticket: Number(c.avg_ticket),
        redemptions: Number(c.redemptions) || 0
      }))
      .sort((a, b) => a.discount_percent - b.discount_percent);
  }, [coupons]);

  /** Best coupon code for row highlighting */
  const bestCouponCode = summary?.bestCoupon?.codigo_cupom;

  // -----------------------------------------------------------------------
  // Render guards
  // -----------------------------------------------------------------------

  if (loading) return <LoadingSkeleton isDark={isDark} />;

  // Silently hide when no coupon data exists
  if (error || !coupons.length) return null;

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

  // Chart colors
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const axisColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)';
  const barColors = isDark ? BAR_COLORS_DARK : BAR_COLORS_LIGHT;

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
          <div className="w-10 h-10 rounded-xl bg-purple-500 dark:bg-purple-600 flex items-center justify-center shadow-sm shrink-0">
            <Ticket className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className={`${isDesktop ? 'text-base' : 'text-sm'} font-bold text-slate-800 dark:text-white`}>
              Efetividade de Cupons
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {coupons.length} {coupons.length === 1 ? 'cupom ativo' : 'cupons ativos'} &bull; {NUMBER_FMT.format(summary.totalRedemptions)} resgates
            </p>
          </div>
        </div>

        {/* Right: Total Revenue Badge */}
        <div
          className={`
            flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shrink-0
            backdrop-blur-sm ring-1
            bg-emerald-600 dark:bg-emerald-500 ring-emerald-700 dark:ring-emerald-400
          `}
        >
          <DollarSign className="w-3.5 h-3.5 text-white" aria-hidden="true" />
          <span className="text-xs font-medium text-white whitespace-nowrap">
            {CURRENCY_SHORT_FMT.format(summary.totalRevenue)}
          </span>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* KPI CARDS                                                         */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {/* Total Redemptions */}
        <div className={statCardClass}>
          <div className="flex items-center gap-1.5 mb-1">
            <Hash className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" aria-hidden="true" />
            <p className={labelClass}>Resgates</p>
          </div>
          <p className={valueClass}>
            {NUMBER_FMT.format(summary.totalRedemptions)}
          </p>
        </div>

        {/* Total Revenue */}
        <div className={statCardClass}>
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" aria-hidden="true" />
            <p className={labelClass}>Receita Total</p>
          </div>
          <p className={valueClass}>
            {CURRENCY_SHORT_FMT.format(summary.totalRevenue)}
          </p>
        </div>

        {/* Best Coupon */}
        <div className={statCardClass}>
          <div className="flex items-center gap-1.5 mb-1">
            <Award className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" aria-hidden="true" />
            <p className={labelClass}>Melhor Cupom</p>
          </div>
          <p className={`${isDesktop ? 'text-lg' : 'text-base'} font-bold tabular-nums text-slate-900 dark:text-white font-mono truncate`}>
            {summary.bestCoupon?.codigo_cupom || '--'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {CURRENCY_FMT.format(summary.bestCoupon?.total_revenue || 0)}
          </p>
        </div>

        {/* Avg Ticket */}
        <div className={statCardClass}>
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" aria-hidden="true" />
            <p className={labelClass}>Ticket Medio</p>
          </div>
          <p className={valueClass}>
            {CURRENCY_FMT.format(summary.avgTicket)}
          </p>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* BAR CHART: Discount % vs Avg Ticket                               */}
      {/* ----------------------------------------------------------------- */}
      {chartData.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-medium tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Desconto vs Ticket Medio por Cupom
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
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, bottom: 5, left: isDesktop ? 5 : 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  vertical={false}
                />
                <XAxis
                  dataKey="codigo_cupom"
                  tick={{ fontSize: 10, fill: axisColor }}
                  axisLine={{ stroke: gridColor }}
                  tickLine={false}
                  interval={0}
                  angle={isMobile ? -45 : 0}
                  textAnchor={isMobile ? 'end' : 'middle'}
                  height={isMobile ? 60 : 30}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: axisColor }}
                  tickFormatter={(v) => CURRENCY_SHORT_FMT.format(v)}
                  axisLine={{ stroke: gridColor }}
                  tickLine={false}
                  width={isDesktop ? 70 : 55}
                  label={isDesktop ? {
                    value: 'Ticket Medio (R$)',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 10,
                    style: { fontSize: 11, fill: axisColor }
                  } : undefined}
                />
                <Tooltip
                  content={<ChartTooltip isDark={isDark} />}
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
                />
                <Bar
                  dataKey="avg_ticket"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                >
                  {chartData.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={barColors[idx % barColors.length]}
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* COUPON TABLE (Desktop) / CARD LIST (Mobile)                       */}
      {/* ----------------------------------------------------------------- */}
      <div className="mb-4">
        <p className="text-xs font-medium tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          Detalhamento por Cupom
        </p>

        {isMobile ? (
          /* ---- Mobile: Card List ---- */
          <div className="space-y-3">
            {coupons.map((coupon) => (
              <CouponCard
                key={coupon.codigo_cupom}
                coupon={coupon}
                isBest={coupon.codigo_cupom === bestCouponCode}
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
                      Cupom
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400">
                      Campanha
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400">
                      Resgates
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400">
                      Clientes
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400">
                      Receita
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400">
                      Ticket Medio
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400">
                      Desconto
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon, idx) => {
                    const isBest = coupon.codigo_cupom === bestCouponCode;
                    const isEven = idx % 2 === 0;

                    return (
                      <tr
                        key={coupon.codigo_cupom}
                        className={`
                          ${isBest ? 'border-l-[3px] border-l-emerald-500' : 'border-l-[3px] border-l-transparent'}
                          ${isEven
                            ? (isDark ? 'bg-space-dust/20' : 'bg-white')
                            : (isDark ? 'bg-space-dust/40' : 'bg-slate-50/60')}
                          hover:${isDark ? 'bg-space-dust/60' : 'bg-slate-100/80'}
                          transition-colors duration-150
                        `}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-slate-900 dark:text-white">
                              {coupon.codigo_cupom}
                            </span>
                            {isBest && (
                              <Award className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                          {coupon.campaign_name || '--'}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900 dark:text-white">
                          {NUMBER_FMT.format(coupon.redemptions)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                          {NUMBER_FMT.format(coupon.unique_customers)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900 dark:text-white">
                          {CURRENCY_FMT.format(coupon.total_revenue)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                          {CURRENCY_FMT.format(coupon.avg_ticket)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`
                              inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                              ${isDark
                                ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30'
                                : 'bg-purple-50 text-purple-700 ring-1 ring-purple-200'}
                            `}
                          >
                            {coupon.discount_percent}%
                          </span>
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
        <Info className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 flex-shrink-0" aria-hidden="true" />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Dados da view coupon_effectiveness &bull; Receita atribuida por codigo de cupom resgatado
        </p>
      </div>
    </div>
  );
};

export default CouponEffectiveness;
