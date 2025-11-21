// KPICards.jsx v4.1 - DARK MODE & READABILITY IMPROVEMENTS
// ✅ Enhanced dark mode text contrast
// ✅ Improved color hierarchy
// ✅ Better icon visibility
// ✅ Preserved all logic and safety checks from v4.0
//
// CHANGELOG:
// v4.1 (2025-11-21): Dark mode readability improvements
// v4.0 (2025-11-20): Tailwind migration & Dark Mode

import React, { useMemo } from 'react';
import { Activity, Users, AlertCircle, Heart, Droplet, Flame, UserPlus } from 'lucide-react';
import { parseBrDate } from '../utils/dateUtils';

function normalizeDoc(doc) {
  if (!doc) return '';
  const cleaned = String(doc).replace(/\D/g, '');
  if (cleaned.length > 0 && cleaned.length <= 11) {
    return cleaned.padStart(11, '0');
  }
  return cleaned;
}

const KPICards = ({ businessMetrics, customerMetrics, salesData, viewMode = 'complete' }) => {
  const newClientsData = useMemo(() => {
    console.log('\n=== NEW CUSTOMERS CALCULATION (KPICards v4.1) ===');

    if (!salesData || salesData.length === 0) {
      return { count: 0, weekOverWeek: null };
    }

    if (!businessMetrics?.windows) {
      return { count: 0, weekOverWeek: null };
    }

    // ✅ Safe window selection with fallback
    let currentWindow;
    if (viewMode === 'current' && businessMetrics.windows.currentWeek) {
      currentWindow = businessMetrics.windows.currentWeek;
    } else if (businessMetrics.windows.weekly) {
      currentWindow = businessMetrics.windows.weekly;
    } else {
      return { count: 0, weekOverWeek: null };
    }

    const previousWindow = businessMetrics.windows.previousWeekly;

    if (!previousWindow) {
      return { count: 0, weekOverWeek: null };
    }

    // ✅ Validate that Date objects exist
    if (!currentWindow.start || !currentWindow.end || !previousWindow.start || !previousWindow.end) {
      return { count: 0, weekOverWeek: null };
    }

    const customerFirstPurchase = {};

    salesData.forEach(row => {
      const dateStr = row.Data || row.Data_Hora || row.date;
      if (!dateStr) return;

      const saleDate = parseBrDate(dateStr);
      if (!saleDate) return;

      const cpf = normalizeDoc(row.Doc_Cliente || row.document || row.doc);
      if (!cpf) return;

      if (!customerFirstPurchase[cpf] || saleDate < customerFirstPurchase[cpf]) {
        customerFirstPurchase[cpf] = saleDate;
      }
    });

    let currentPeriodNew = 0;
    let lastPeriodNew = 0;

    Object.values(customerFirstPurchase).forEach(firstDate => {
      if (firstDate >= currentWindow.start && firstDate <= currentWindow.end) {
        currentPeriodNew++;
      } else if (firstDate >= previousWindow.start && firstDate <= previousWindow.end) {
        lastPeriodNew++;
      }
    });

    let periodOverPeriodChange = null;
    if (lastPeriodNew > 0) {
      periodOverPeriodChange = ((currentPeriodNew - lastPeriodNew) / lastPeriodNew) * 100;
    } else if (currentPeriodNew > 0) {
      periodOverPeriodChange = 100;
    }

    return {
      count: currentPeriodNew,
      weekOverWeek: periodOverPeriodChange
    };
  }, [salesData, businessMetrics?.windows, viewMode]);

  if (!businessMetrics || !customerMetrics) {
    return (
      <div className="p-4 text-slate-500 dark:text-slate-400">
        Carregando KPIs...
      </div>
    );
  }

  // ✅ Safe data source selection
  let metricsSource;
  if (viewMode === 'current') {
    if (businessMetrics.currentWeek) {
      metricsSource = businessMetrics.currentWeek;
    } else {
      metricsSource = businessMetrics.weekly;
    }
  } else {
    metricsSource = businessMetrics.weekly;
  }

  if (!metricsSource) {
    return (
      <div className="p-4 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
        ⚠️ Erro ao carregar métricas. Verifique o console (F12) para detalhes.
      </div>
    );
  }

  const wow = businessMetrics.weekOverWeek || {};

  const activeCount = customerMetrics.activeCount || 0;
  const atRiskCount = customerMetrics.atRiskCount || 0;
  const healthRate = customerMetrics.healthRate || 0;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
  };

  const getTrendData = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return { show: false };
    }

    const absValue = Math.abs(value);
    if (absValue < 0.5) {
      return {
        show: true,
        text: '→',
        colorClass: 'text-slate-600 dark:text-slate-300',
        bgClass: 'bg-slate-100 dark:bg-slate-600',
        label: 'vs semana passada'
      };
    }

    if (value > 0) {
      return {
        show: true,
        text: `↑${value.toFixed(1)}%`,
        colorClass: 'text-emerald-700 dark:text-emerald-300',
        bgClass: 'bg-emerald-50 dark:bg-emerald-900/40',
        label: 'vs semana passada'
      };
    }

    return {
      show: true,
      text: `↓${absValue.toFixed(1)}%`,
      colorClass: 'text-red-700 dark:text-red-300',
      bgClass: 'bg-red-50 dark:bg-red-900/40',
      label: 'vs semana passada'
    };
  };

  // ✅ Get appropriate subtitle based on view mode
  const getTimeSubtitle = () => {
    if (viewMode === 'current' && businessMetrics.windows?.currentWeek) {
      const days = businessMetrics.windows.currentWeek.daysElapsed || 1;
      return `${days} ${days === 1 ? 'dia' : 'dias'}`;
    }
    return '7 dias';
  };

  // ✅ Safe access with fallbacks
  const washCount = metricsSource.washServices || 0;
  const dryCount = metricsSource.dryServices || 0;
  const totalServices = washCount + dryCount;
  const washPercent = totalServices > 0 ? ((washCount / totalServices) * 100).toFixed(0) : 0;
  const dryPercent = totalServices > 0 ? ((dryCount / totalServices) * 100).toFixed(0) : 0;

  const kpis = [
    {
      id: 'revenue',
      title: 'Receita Líquida',
      value: formatCurrency(metricsSource.netRevenue),
      trend: getTrendData(wow.netRevenue),
      subtitle: getTimeSubtitle(),
      icon: Activity,
      colorClass: 'text-lavpop-blue dark:text-blue-300',
      iconBgClass: 'bg-blue-50 dark:bg-blue-900/50',
      valueClass: 'text-lavpop-blue dark:text-white'
    },
    {
      id: 'services',
      title: 'Total de Ciclos',
      value: formatNumber(metricsSource.totalServices),
      trend: getTrendData(wow.totalServices),
      subtitle: getTimeSubtitle(),
      icon: Activity,
      colorClass: 'text-lavpop-blue dark:text-blue-300',
      iconBgClass: 'bg-blue-50 dark:bg-blue-900/50',
      valueClass: 'text-lavpop-blue dark:text-white'
    },
    {
      id: 'utilization',
      title: 'Utilização Geral',
      value: `${Math.round(metricsSource.totalUtilization || 0)}%`,
      trend: getTrendData(wow.utilization),
      subtitle: getTimeSubtitle(),
      icon: Flame,
      colorClass: 'text-amber-600 dark:text-amber-300',
      iconBgClass: 'bg-amber-50 dark:bg-amber-900/50',
      valueClass: 'text-amber-600 dark:text-amber-200'
    },
    {
      id: 'wash',
      title: 'Lavagens',
      value: formatNumber(washCount),
      subtitle: `${washPercent}% do total`,
      trend: getTrendData(wow.washServices),
      icon: Droplet,
      colorClass: 'text-blue-600 dark:text-blue-300',
      iconBgClass: 'bg-blue-50 dark:bg-blue-900/50',
      valueClass: 'text-blue-600 dark:text-blue-200'
    },
    {
      id: 'dry',
      title: 'Secagens',
      value: formatNumber(dryCount),
      subtitle: `${dryPercent}% do total`,
      trend: getTrendData(wow.dryServices),
      icon: Flame,
      colorClass: 'text-orange-600 dark:text-orange-300',
      iconBgClass: 'bg-orange-50 dark:bg-orange-900/50',
      valueClass: 'text-orange-600 dark:text-orange-200'
    },
    {
      id: 'newclients',
      title: 'Novos Clientes',
      value: formatNumber(newClientsData.count),
      subtitle: getTimeSubtitle(),
      trend: getTrendData(newClientsData.weekOverWeek),
      icon: UserPlus,
      colorClass: 'text-lavpop-green dark:text-green-300',
      iconBgClass: 'bg-green-50 dark:bg-green-900/50',
      valueClass: 'text-lavpop-green dark:text-green-200'
    },
    {
      id: 'active',
      title: 'Clientes Ativos',
      value: formatNumber(activeCount),
      subtitle: 'Não perdidos',
      icon: Users,
      colorClass: 'text-lavpop-blue dark:text-blue-300',
      iconBgClass: 'bg-blue-50 dark:bg-blue-900/50',
      valueClass: 'text-lavpop-blue dark:text-white'
    },
    {
      id: 'atrisk',
      title: 'Clientes em Risco',
      value: formatNumber(atRiskCount),
      subtitle: 'Precisam atenção',
      icon: AlertCircle,
      colorClass: 'text-red-600 dark:text-red-300',
      iconBgClass: 'bg-red-50 dark:bg-red-900/50',
      valueClass: 'text-red-600 dark:text-red-200'
    },
    {
      id: 'health',
      title: 'Taxa de Saúde',
      value: `${Math.round(healthRate)}%`,
      subtitle: 'Clientes saudáveis',
      icon: Heart,
      colorClass: 'text-lavpop-green dark:text-green-300',
      iconBgClass: 'bg-green-50 dark:bg-green-900/50',
      valueClass: 'text-lavpop-green dark:text-green-200'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-9 gap-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;

        return (
          <div
            key={kpi.id}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 transition-all duration-200 hover:shadow-lg dark:hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden flex flex-col group"
          >
            {/* Header with Title and Icon */}
            <div className="mb-3 flex justify-between items-start">
              <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider mt-1">
                {kpi.title}
              </h3>

              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.iconBgClass} group-hover:scale-110 transition-transform`}>
                <Icon className={`w-5 h-5 ${kpi.colorClass}`} />
              </div>
            </div>

            {/* Value */}
            <div className="mb-2 flex-1">
              <div className={`text-[28px] font-extrabold leading-[1.1] ${kpi.valueClass}`}>
                {kpi.value}
              </div>
            </div>

            {/* Footer: Subtitle + WoW Badge */}
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {kpi.subtitle}
              </div>

              {/* WoW Badge */}
              {kpi.trend?.show && (
                <div className={`text-xs font-bold px-2 py-0.5 rounded-md tracking-wide whitespace-nowrap ${kpi.trend.colorClass} ${kpi.trend.bgClass}`}>
                  {kpi.trend.text}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KPICards;
