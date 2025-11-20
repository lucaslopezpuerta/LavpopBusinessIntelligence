// CurrentWeekBanner.jsx v2.0 TAILWIND
//
//
// CHANGELOG:
// v2.0 (2025-11-20): Complete Tailwind Redesign
// v1.0 (2025-11-19): Initial implementation
//   - Real-time current week summary with projection
//   - Current week summary (revenue, services, utilization)
//   - Weekly projection with confidence indicator
//   - Comparison to last complete week
//   - Responsive design (desktop 1-line, mobile 2-lines)
//   - Shows current partial week metrics (Sunday → Today)
//   - Projects full week performance based on current pace
//   - Compares projection to last complete week
//   - Smart confidence indicators based on days elapsed
//   - Compact single-line or two-line layout

// CurrentWeekBanner.jsx - Highlight panel for current vs historical performance

import React, { useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

const BRAND = {
  primary: '#0c4a6e',
  accent: '#4ac02a',
};

const formatCurrency = (value) =>
  `R$ ${Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatPercent = (value) =>
  `${Number(value || 0).toFixed(0)}%`;

const CurrentWeekBanner = ({ businessMetrics }) => {
  const {
    currentRevenue,
    projectedRevenue,
    currentUtilization,
    fourWeekRevenue,
    deltaRevenue,
    deltaDirection,
  } = useMemo(() => {
    const weekly = businessMetrics?.weekly || {};
    const current = businessMetrics?.currentWeek || {};
    const fourWeek = businessMetrics?.fourWeek || {};

    const currentRevenue = current.totalRevenue ?? current.revenue ?? 0;
    const currentUtilization = current.totalUtilization ?? 0;
    const fourWeekRevenue = fourWeek.totalRevenue ?? fourWeek.revenue ?? 0;

    let projectedRevenue = null;
    const daysElapsed = businessMetrics?.windows?.currentWeek?.daysElapsed;
    const totalDays =
      businessMetrics?.windows?.currentWeek?.totalDays || 7;
    if (daysElapsed && daysElapsed > 0) {
      projectedRevenue =
        (currentRevenue / daysElapsed) * totalDays;
    }

    const delta = fourWeekRevenue
      ? ((currentRevenue - fourWeekRevenue / 4) / (fourWeekRevenue / 4)) *
        100
      : 0;

    return {
      currentRevenue,
      projectedRevenue,
      currentUtilization,
      fourWeekRevenue,
      deltaRevenue: delta,
      deltaDirection: delta >= 0 ? 'up' : 'down',
    };
  }, [businessMetrics]);

  return (
    <div className="rounded-2xl bg-gradient-to-r from-[#0c4a6e] via-[#0c4a6e]/90 to-[#4ac02a] text-white shadow-md px-4 py-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70 mb-1">
            Semana Atual - Visão Rápida
          </div>
          <div className="text-lg font-semibold">
            Como está hoje em relação às últimas semanas?
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3 flex-1 md:max-w-xl">
          {/* Receita atual */}
          <div className="rounded-xl bg-black/10 border border-white/10 px-3 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
              Receita acumulada
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg font-bold">
                {formatCurrency(currentRevenue)}
              </span>
            </div>
            {projectedRevenue != null && (
              <div className="mt-1 text-[11px] text-white/80">
                Projeção até fim da semana:{' '}
                <span className="font-semibold">
                  {formatCurrency(projectedRevenue)}
                </span>
              </div>
            )}
          </div>

          {/* Utilização */}
          <div className="rounded-xl bg-black/10 border border-white/10 px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
                Utilização média
              </div>
              <Activity className="w-4 h-4 text-white/80" />
            </div>
            <div className="mt-1 text-lg font-bold">
              {formatPercent(currentUtilization)}
            </div>
            <div className="mt-1 text-[11px] text-white/80">
              Considera todos os ciclos da semana atual.
            </div>
          </div>

          {/* Comparação 4 semanas */}
          <div className="rounded-xl bg-black/10 border border-white/10 px-3 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
              vs. média 4 semanas
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg font-bold">
                {deltaRevenue > 0 ? '+' : ''}
                {deltaRevenue.toFixed(1)}%
              </span>
              {deltaDirection === 'up' ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-300" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-rose-300" />
              )}
            </div>
            <div className="mt-1 text-[11px] text-white/80">
              Baseado na média de receita das últimas 4 semanas.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentWeekBanner;
