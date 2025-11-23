// KPICards.jsx v6.0 - PREMIUM DESIGN ENHANCEMENT
// ✅ Premium gradients and depth
// ✅ Count-up animations with react-countup
// ✅ Card lift hover effects
// ✅ Improved mobile sizing
// ✅ Tooltips for context
//
// CHANGELOG:
// v6.0 (2025-11-23): Premium visual enhancement
// v5.1 (2025-11-21): Projection card positioning

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import CountUp from 'react-countup';
import useEmblaCarousel from 'embla-carousel-react';
import { Percent, Users, AlertCircle, Heart, Droplet, Flame, UserPlus, TrendingUp, TrendingDown, DollarSign, WashingMachine, ChevronLeft, ChevronRight, MousePointerClick } from 'lucide-react';
import { parseBrDate } from '../utils/dateUtils';
import Tooltip from './Tooltip';
import ContextHelp from './ContextHelp';

// Drill-down Components
import KPIDetailModal from './modals/KPIDetailModal';
import FinancialDrilldown from './drilldowns/FinancialDrilldown';
import CustomerListDrilldown from './drilldowns/CustomerListDrilldown';
import MetricExplainerDrilldown from './drilldowns/MetricExplainerDrilldown';

function normalizeDoc(doc) {
  if (!doc) return '';
  const cleaned = String(doc).replace(/\D/g, '');
  if (cleaned.length > 0 && cleaned.length <= 11) {
    return cleaned.padStart(11, '0');
  }
  return cleaned;
}

const KPICards = ({ businessMetrics, customerMetrics, salesData, viewMode = 'complete', onNavigate }) => {
  // Embla Carousel Setup
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start' });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);

  // Drill-down State
  const [selectedKPI, setSelectedKPI] = useState(null);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const newClientsData = useMemo(() => {
    if (!salesData || salesData.length === 0) {
      return { count: 0, weekOverWeek: null };
    }

    if (!businessMetrics?.windows) {
      return { count: 0, weekOverWeek: null };
    }

    let currentWindow;
    if (viewMode === 'current' && businessMetrics.windows.currentWeek) {
      currentWindow = businessMetrics.windows.currentWeek;
    } else if (businessMetrics.windows.weekly) {
      currentWindow = businessMetrics.windows.weekly;
    } else {
      return { count: 0, weekOverWeek: null };
    }

    const previousWindow = businessMetrics.windows.previousWeekly;

    if (!previousWindow || !currentWindow.start || !currentWindow.end || !previousWindow.start || !previousWindow.end) {
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
        ⚠️ Erro ao carregar métricas.
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
        colorClass: 'text-slate-600 dark:text-slate-200',
        bgClass: 'bg-slate-100 dark:bg-slate-600'
      };
    }

    if (value > 0) {
      return {
        show: true,
        text: `↑${value.toFixed(1)}%`,
        colorClass: 'text-emerald-700 dark:text-emerald-200',
        bgClass: 'bg-emerald-50 dark:bg-emerald-900/40'
      };
    }

    return {
      show: true,
      text: `↓${absValue.toFixed(1)}%`,
      colorClass: 'text-red-700 dark:text-red-200',
      bgClass: 'bg-red-50 dark:bg-red-900/40'
    };
  };

  const getTimeSubtitle = () => {
    if (viewMode === 'current' && businessMetrics.windows?.currentWeek) {
      const days = businessMetrics.windows.currentWeek.daysElapsed || 1;
      return `${days} ${days === 1 ? 'dia' : 'dias'}`;
    }
    return '7 dias';
  };

  const washCount = metricsSource.washServices || 0;
  const dryCount = metricsSource.dryServices || 0;
  const totalServices = washCount + dryCount;
  const washPercent = totalServices > 0 ? ((washCount / totalServices) * 100).toFixed(0) : 0;
  const dryPercent = totalServices > 0 ? ((dryCount / totalServices) * 100).toFixed(0) : 0;

  // Projection data (always available)
  const projectionData = businessMetrics.currentWeek?.projection || null;
  const hasProjection = projectionData?.canProject;
  const projectionIcon = hasProjection && projectionData.trend === 'down' ? TrendingDown : TrendingUp;
  const projectionValue = hasProjection ? projectionData.projectedRevenue : 0;
  const projectionSubtitle = hasProjection ? `${formatNumber(projectionData.projectedServices)} ciclos` : 'Aguardando dados';
  const projectionTrend = hasProjection ? getTrendData(projectionData.revenueVsLast) : { show: false };

  const kpis = [
    {
      id: 'revenue',
      title: 'Receita Líquida',
      value: metricsSource.netRevenue || 0,
      displayValue: formatCurrency(metricsSource.netRevenue),
      isCurrency: true,
      trend: getTrendData(wow.netRevenue),
      subtitle: getTimeSubtitle(),
      icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-600',
      gradientDark: 'dark:from-emerald-600 dark:to-teal-700',
      iconBgClass: 'bg-emerald-100 dark:bg-emerald-900/40',
      tooltip: 'Receita total após descontos e cupons',
      drilldownType: 'financial',
      metricType: 'revenue'
    },
    {
      id: 'services',
      title: 'Total de Ciclos',
      value: metricsSource.totalServices || 0,
      displayValue: formatNumber(metricsSource.totalServices),
      isCurrency: false,
      trend: getTrendData(wow.totalServices),
      subtitle: getTimeSubtitle(),
      icon: WashingMachine,
      gradient: 'from-blue-500 to-indigo-600',
      gradientDark: 'dark:from-blue-600 dark:to-indigo-700',
      iconBgClass: 'bg-blue-100 dark:bg-blue-900/40',
      tooltip: 'Soma de lavagens e secagens',
      drilldownType: 'financial',
      metricType: 'cycles'
    },
    {
      id: 'utilization',
      title: 'Utilização Geral',
      value: Math.round(metricsSource.totalUtilization || 0),
      displayValue: `${Math.round(metricsSource.totalUtilization || 0)}%`,
      isCurrency: false,
      trend: getTrendData(wow.utilization),
      subtitle: getTimeSubtitle(),
      icon: Percent,
      gradient: 'from-rose-500 to-pink-600',
      gradientDark: 'dark:from-rose-600 dark:to-pink-700',
      iconBgClass: 'bg-rose-100 dark:bg-rose-900/40',
      tooltip: 'Percentual de uso das máquinas',
      drilldownType: 'explainer',
      metricType: 'utilization'
    },
    {
      id: 'wash',
      title: 'Lavagens',
      value: washCount,
      displayValue: formatNumber(washCount),
      isCurrency: false,
      subtitle: `${washPercent}% do total`,
      trend: getTrendData(wow.washServices),
      icon: Droplet,
      gradient: 'from-cyan-500 to-blue-600',
      gradientDark: 'dark:from-cyan-600 dark:to-blue-700',
      iconBgClass: 'bg-cyan-100 dark:bg-cyan-900/40',
      tooltip: 'Ciclos de lavagem realizados',
      drilldownType: 'financial',
      metricType: 'cycles'
    },
    {
      id: 'dry',
      title: 'Secagens',
      value: dryCount,
      displayValue: formatNumber(dryCount),
      isCurrency: false,
      subtitle: `${dryPercent}% do total`,
      trend: getTrendData(wow.dryServices),
      icon: Flame,
      gradient: 'from-orange-500 to-red-600',
      gradientDark: 'dark:from-orange-600 dark:to-red-700',
      iconBgClass: 'bg-orange-100 dark:bg-orange-900/40',
      tooltip: 'Ciclos de secagem realizados',
      drilldownType: 'financial',
      metricType: 'cycles'
    },
    {
      id: 'newclients',
      title: 'Novos Clientes',
      value: newClientsData.count,
      displayValue: formatNumber(newClientsData.count),
      isCurrency: false,
      subtitle: getTimeSubtitle(),
      trend: getTrendData(newClientsData.weekOverWeek),
      icon: UserPlus,
      gradient: 'from-purple-500 to-violet-600',
      gradientDark: 'dark:from-purple-600 dark:to-violet-700',
      iconBgClass: 'bg-purple-100 dark:bg-purple-900/40',
      tooltip: 'Clientes que fizeram primeira compra',
      drilldownType: 'customer',
      customerType: 'newclients'
    },
    {
      id: 'projection',
      title: 'Projeção Atual',
      value: projectionValue,
      displayValue: hasProjection ? formatCurrency(projectionValue) : '—',
      isCurrency: true,
      subtitle: projectionSubtitle,
      trend: projectionTrend,
      icon: projectionIcon,
      gradient: 'from-slate-500 to-gray-600',
      gradientDark: 'dark:from-slate-600 dark:to-gray-700',
      iconBgClass: 'bg-slate-100 dark:bg-slate-800',
      tooltip: 'Projeção de receita para fim da semana',
      drilldownType: 'explainer',
      metricType: 'projection'
    },
    {
      id: 'active',
      title: 'Clientes Ativos',
      value: activeCount,
      displayValue: formatNumber(activeCount),
      isCurrency: false,
      subtitle: 'Não perdidos',
      icon: Users,
      gradient: 'from-amber-500 to-yellow-600',
      gradientDark: 'dark:from-amber-600 dark:to-yellow-700',
      iconBgClass: 'bg-amber-100 dark:bg-amber-900/40',
      tooltip: 'Clientes que visitaram nos últimos 90 dias',
      drilldownType: 'customer',
      customerType: 'active'
    },
    {
      id: 'atrisk',
      title: 'Clientes em Risco',
      value: atRiskCount,
      displayValue: formatNumber(atRiskCount),
      isCurrency: false,
      subtitle: 'Precisam atenção',
      icon: AlertCircle,
      gradient: 'from-red-500 to-rose-600',
      gradientDark: 'dark:from-red-600 dark:to-rose-700',
      iconBgClass: 'bg-red-100 dark:bg-red-900/40',
      tooltip: 'Clientes em risco de churn',
      drilldownType: 'customer',
      customerType: 'atrisk'
    },
    {
      id: 'health',
      title: 'Taxa de Saúde',
      value: Math.round(healthRate),
      displayValue: `${Math.round(healthRate)}%`,
      isCurrency: false,
      subtitle: 'Clientes saudáveis',
      icon: Heart,
      gradient: 'from-green-500 to-emerald-600',
      gradientDark: 'dark:from-green-600 dark:to-emerald-700',
      iconBgClass: 'bg-green-100 dark:bg-green-900/40',
      tooltip: 'Percentual de clientes com boa frequência',
      drilldownType: 'explainer',
      metricType: 'health'
    }
  ];

  const handleCardClick = (kpi) => {
    if (kpi.drilldownType) {
      setSelectedKPI(kpi);
    }
  };

  const handleCloseModal = () => {
    setSelectedKPI(null);
  };

  const handleNavigate = (tabId) => {
    handleCloseModal();
    if (onNavigate) onNavigate(tabId);
  };

  const KPICard = ({ kpi }) => {
    const Icon = kpi.icon;
    return (
      <div
        onClick={() => handleCardClick(kpi)}
        className={`
          relative overflow-hidden
          bg-gradient-to-br ${kpi.gradient} ${kpi.gradientDark}
          rounded-2xl p-5 
          shadow-md hover:shadow-xl
          transition-all duration-300
          card-lift
          group
          h-full
          cursor-pointer
        `}
      >
        {/* Subtle overlay for depth */}
        <div className="absolute inset-0 bg-white/10 dark:bg-black/10" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full justify-between">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-1.5">
              <h3 className="text-[11px] font-bold text-white/90 uppercase tracking-wider flex items-center gap-1">
                {kpi.title}
                {kpi.drilldownType && (
                  <MousePointerClick className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </h3>
              <ContextHelp
                title={kpi.title}
                description={kpi.tooltip}
                formula={kpi.metricType === 'health' ? 'Ativos / Total' : kpi.metricType === 'utilization' ? 'Uso / Capacidade' : null}
              />
            </div>

            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${kpi.iconBgClass} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Value with Count-Up Animation */}
          <div className="mb-3">
            <div className="text-3xl sm:text-4xl font-extrabold text-white leading-none font-mono">
              {kpi.isCurrency && 'R$ '}
              <CountUp
                end={kpi.value}
                duration={1.5}
                separator="."
                decimals={0}
                preserveValue={true}
              />
              {!kpi.isCurrency && kpi.displayValue.includes('%') && '%'}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-white/80 font-medium">
              {kpi.subtitle}
            </div>

            {kpi.trend?.show && (
              <div className={`text-xs font-bold px-2.5 py-1 rounded-md ${kpi.trend.colorClass} ${kpi.trend.bgClass} shadow-sm`}>
                {kpi.trend.text}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Helper to get customers for drill-down
  const getDrilldownCustomers = (type) => {
    if (!customerMetrics?.activeCustomers) return [];

    switch (type) {
      case 'atrisk':
        return customerMetrics.activeCustomers
          .filter(c => c.riskLevel === 'At Risk' || c.riskLevel === 'Churning')
          .sort((a, b) => b.netTotal - a.netTotal);
      case 'newclients':
        // This is an approximation as we don't have "isNew" flag on customer object easily available here
        // In a real app, we'd filter by first purchase date
        return customerMetrics.activeCustomers
          .sort((a, b) => {
            // Sort by most recent visit as proxy for now, or use total visits = 1
            return (a.totalVisits === 1 ? 1 : 0) - (b.totalVisits === 1 ? 1 : 0) || b.netTotal - a.netTotal;
          })
          .filter(c => c.totalVisits <= 2);
      case 'active':
      default:
        return customerMetrics.activeCustomers
          .sort((a, b) => b.netTotal - a.netTotal);
    }
  };

  return (
    <>
      {/* Mobile Carousel View */}
      <div className="lg:hidden -mx-4 px-4">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4 py-2">
            {kpis.map((kpi) => (
              <div key={kpi.id} className="flex-[0_0_85%] min-w-0 sm:flex-[0_0_45%]">
                <KPICard kpi={kpi} />
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mt-2">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              className={`
                w-2 h-2 rounded-full transition-all duration-300
                ${index === selectedIndex
                  ? 'bg-lavpop-blue w-4'
                  : 'bg-slate-300 dark:bg-slate-700'}
              `}
              onClick={() => emblaApi && emblaApi.scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Desktop Grid View */}
      <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      {/* Drill-down Modal */}
      <KPIDetailModal
        isOpen={!!selectedKPI}
        onClose={handleCloseModal}
        title={selectedKPI?.title}
      >
        {selectedKPI?.drilldownType === 'financial' && (
          <FinancialDrilldown
            salesData={salesData}
            metricType={selectedKPI.metricType}
            onNavigate={() => handleNavigate('intelligence')}
          />
        )}

        {selectedKPI?.drilldownType === 'customer' && (
          <CustomerListDrilldown
            customers={getDrilldownCustomers(selectedKPI.customerType)}
            type={selectedKPI.customerType}
            onNavigate={() => handleNavigate('customers')}
          />
        )}

        {selectedKPI?.drilldownType === 'explainer' && (
          <MetricExplainerDrilldown
            metricType={selectedKPI.metricType}
          />
        )}
      </KPIDetailModal>
    </>
  );
};

export default KPICards;
