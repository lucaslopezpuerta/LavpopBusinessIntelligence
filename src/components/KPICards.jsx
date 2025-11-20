// KPICards.jsx v4.0 - Modern KPI grid
// - Uses businessMetrics + customerMetrics
// - Respects viewMode: 'complete' vs 'current'
// - Full Tailwind integration
//
// CHANGELOG:
// v4.0 (2025-11-20): Complete Visuals Redesign
// v3.3.1 (2025-11-19): 
//   - Added safety checks for missing viewMode prop
//   - Added fallbacks for undefined currentWeek data
//   - Fixed utilization/wash/dry services access
//   - More detailed error logging
// v3.3 (2025-11-19): HYBRID VIEW SUPPORT

//businessMetrics.weekly              // LAST COMPLETE WEEK (Sun-Sat just ended)
//businessMetrics.currentWeek         // CURRENT PARTIAL WEEK (Sun-Today)
//businessMetrics.previousWeekly      // TWO WEEKS AGO


import React, { useMemo } from 'react';
import { Users, Activity, WashingMachine, AlertTriangle, Coins } from 'lucide-react';

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

const KPICards = ({ businessMetrics, customerMetrics, salesData, viewMode }) => {
  const { sourceWeek, label } = useMemo(() => {
    const weekly = businessMetrics?.weekly || {};
    const current = businessMetrics?.currentWeek || null;

    if (viewMode === 'current' && current) {
      return { sourceWeek: current, label: 'Semana Atual' };
    }
    return { sourceWeek: weekly, label: 'Última Semana Completa' };
  }, [businessMetrics, viewMode]);

  const revenue = sourceWeek?.totalRevenue ?? sourceWeek?.revenue ?? 0;
  const totalCycles =
    sourceWeek?.totalCycles ?? sourceWeek?.totalServices ?? 0;
  const utilization = sourceWeek?.totalUtilization ?? 0;
  const avgTicket =
    sourceWeek?.avgTicket ?? sourceWeek?.averageTicket ?? 0;

  const activeCustomers = customerMetrics?.activeCount ?? 0;
  const atRiskCount = customerMetrics?.atRiskCount ?? 0;
  const healthRate = customerMetrics?.healthRate ?? 0;

  const cards = [
    {
      id: 'revenue',
      label: 'Receita da Semana',
      value: formatCurrency(revenue),
      helper: label,
      icon: Coins,
      accent: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'cycles',
      label: 'Total de Ciclos',
      value: totalCycles.toLocaleString('pt-BR'),
      helper: 'Lavagens + Secagens',
      icon: WashingMachine,
      accent: 'bg-sky-100 text-sky-800',
    },
    {
      id: 'utilization',
      label: 'Utilização Máx. Equipamentos',
      value: formatPercent(utilization),
      helper: label,
      icon: Activity,
      accent: 'bg-violet-100 text-violet-800',
    },
    {
      id: 'avgTicket',
      label: 'Ticket Médio',
      value: formatCurrency(avgTicket),
      helper: 'Por transação',
      icon: Coins,
      accent: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'activeCustomers',
      label: 'Clientes Ativos',
      value: activeCustomers.toLocaleString('pt-BR'),
      helper: 'Com visitas recentes',
      icon: Users,
      accent: 'bg-indigo-100 text-indigo-800',
    },
    {
      id: 'atRisk',
      label: 'Clientes em Risco',
      value: atRiskCount.toLocaleString('pt-BR'),
      helper: `Saúde da base: ${formatPercent(healthRate)} OK`,
      icon: AlertTriangle,
      accent: 'bg-rose-100 text-rose-800',
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {cards.map(({ id, label, value, helper, icon: Icon, accent }) => (
        <div
          key={id}
          className="relative overflow-hidden rounded-xl bg-white border border-slate-200 shadow-sm transition-transform hover:-translate-y-[2px] hover:shadow-md"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0c4a6e] via-[#0c4a6e]/80 to-[#4ac02a]" />
          <div className="flex items-start gap-3 px-4 pt-3 pb-3">
            <div
              className={`mt-0.5 inline-flex items-center justify-center rounded-md px-2 py-1 text-[11px] font-semibold ${accent}`}
            >
              <Icon className="w-3.5 h-3.5 mr-1" />
              {helper}
            </div>
          </div>
          <div className="px-4 pb-3 flex flex-col gap-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {label}
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPICards;
