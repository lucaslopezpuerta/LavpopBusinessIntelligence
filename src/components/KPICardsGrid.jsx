// KPICardsGrid.jsx v3.0 - SPARKLINES + FULL WIDTH
// Restructured KPI display with visual hierarchy and trend sparklines
// Design System v3.2 compliant
//
// CHANGELOG:
// v3.0 (2025-12-16): Sparklines + visual enhancements
//   - NEW: Sparkline data calculation for all metrics
//   - NEW: Pass sparklineData to HeroKPICard and SecondaryKPICard
//   - Uses daily data from businessMetrics for trend visualization
//   - Full-width layout support
// v2.2 (2025-12-01): Optimized modal width for customer lists
// v2.1 (2025-12-01): Badge prop for customer modals
// v2.0 (2025-12-01): Metric-specific drilldowns for wash/dry
// v1.9 (2025-12-01): Enhanced modal with metric context
// v1.8 (2025-12-01): Simplified desktop layout
// v1.7 (2025-12-01): Improved desktop grid distribution
// v1.6 (2025-12-01): Hide WoW badges on partial week
// v1.5 (2025-12-01): Hero card mobile titles
// v1.4 (2025-12-01): Mobile responsive hero cards
// v1.3 (2025-12-01): Utilization source fix
// v1.2 (2025-12-01): Customer cards relocated
// v1.1 (2025-11-30): Prop standardization & responsive fix
// v1.0 (2025-11-30): Initial implementation

import { useState, useMemo } from 'react';
import {
  DollarSign, WashingMachine, Percent, Droplet, Flame,
  AlertCircle, Heart
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent, getTrendData } from '../utils/formatters';
import HeroKPICard from './ui/HeroKPICard';
import SecondaryKPICard from './ui/SecondaryKPICard';
import KPIDetailModal from './modals/KPIDetailModal';
import FinancialDrilldown from './drilldowns/FinancialDrilldown';
import CustomerListDrilldown from './drilldowns/CustomerListDrilldown';
import MetricExplainerDrilldown from './drilldowns/MetricExplainerDrilldown';
const KPICardsGrid = ({
  businessMetrics,
  customerMetrics,
  operationsMetrics,
  salesData,
  viewMode = 'complete'
}) => {
  const [selectedKPI, setSelectedKPI] = useState(null);

  // Loading state
  if (!businessMetrics || !customerMetrics) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Get metrics source based on view mode
  const metricsSource = viewMode === 'current' && businessMetrics.currentWeek
    ? businessMetrics.currentWeek
    : businessMetrics.weekly;

  if (!metricsSource) {
    return (
      <div className="p-4 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        Erro ao carregar métricas.
      </div>
    );
  }

  const wow = businessMetrics.weekOverWeek || {};
  // Use combined count (At Risk + Churning) to match drilldown list
  const needsAttentionCount = customerMetrics.needsAttentionCount || 0;
  const healthRate = customerMetrics.healthRate || 0;

  // Service breakdown
  const washCount = metricsSource.washServices || 0;
  const dryCount = metricsSource.dryServices || 0;
  const totalServices = washCount + dryCount;
  const washPercent = totalServices > 0 ? ((washCount / totalServices) * 100).toFixed(0) : 0;
  const dryPercent = totalServices > 0 ? ((dryCount / totalServices) * 100).toFixed(0) : 0;

  // Calculate sparkline data from daily metrics (last 7 days)
  const sparklineData = useMemo(() => {
    const dailyData = businessMetrics.daily || [];
    if (!dailyData.length) return {};

    // Sort by date and take last 7 entries
    const sortedDaily = [...dailyData].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA - dateB;
    }).slice(-7);

    return {
      revenue: sortedDaily.map(d => d.netRevenue || d.revenue || 0),
      cycles: sortedDaily.map(d => (d.washServices || 0) + (d.dryServices || 0) || d.totalServices || 0),
      utilization: sortedDaily.map(d => d.utilization || 0),
      wash: sortedDaily.map(d => d.washServices || 0),
      dry: sortedDaily.map(d => d.dryServices || 0),
    };
  }, [businessMetrics.daily]);

  // Time subtitle
  const getTimeSubtitle = () => {
    if (viewMode === 'current' && businessMetrics.windows?.currentWeek) {
      const days = businessMetrics.windows.currentWeek.daysElapsed || 1;
      return `${days} ${days === 1 ? 'dia' : 'dias'}`;
    }
    return '7 dias';
  };

  // Modal handlers
  const handleCardClick = (kpi) => {
    if (kpi.drilldownType) {
      setSelectedKPI(kpi);
    }
  };

  const handleCloseModal = () => setSelectedKPI(null);

  // Get customers for drill-down
  const getDrilldownCustomers = (type) => {
    if (!customerMetrics?.activeCustomers) return [];

    switch (type) {
      case 'atrisk':
        return customerMetrics.activeCustomers
          .filter(c => c.riskLevel === 'At Risk' || c.riskLevel === 'Churning')
          .sort((a, b) => b.netTotal - a.netTotal);
      default:
        return customerMetrics.activeCustomers
          .sort((a, b) => b.netTotal - a.netTotal);
    }
  };

  // Only show WoW trends for complete week (not partial/current)
  const showTrends = viewMode === 'complete';

  // Hero KPIs (primary metrics) - with sparkline data
  const heroKPIs = [
    {
      id: 'revenue',
      title: 'Receita Líquida',
      shortTitle: 'Receita',
      value: metricsSource.netRevenue || 0,
      displayValue: formatCurrency(metricsSource.netRevenue),
      trend: showTrends ? getTrendData(wow.netRevenue) : null,
      subtitle: getTimeSubtitle(),
      icon: DollarSign,
      color: 'green',
      drilldownType: 'financial',
      metricType: 'revenue',
      sparklineData: sparklineData.revenue,
    },
    {
      id: 'services',
      title: 'Total de Ciclos',
      shortTitle: 'Ciclos',
      value: metricsSource.totalServices || 0,
      displayValue: formatNumber(metricsSource.totalServices),
      trend: showTrends ? getTrendData(wow.totalServices) : null,
      subtitle: getTimeSubtitle(),
      icon: WashingMachine,
      color: 'blue',
      drilldownType: 'financial',
      metricType: 'cycles',
      sparklineData: sparklineData.cycles,
    },
    {
      id: 'utilization',
      title: 'Utilização Geral',
      shortTitle: 'Utiliz.',
      value: Math.round(operationsMetrics?.utilization?.totalUtilization || 0),
      displayValue: formatPercent(operationsMetrics?.utilization?.totalUtilization || 0),
      trend: showTrends ? getTrendData(wow.utilization) : null,
      subtitle: getTimeSubtitle(),
      icon: Percent,
      color: 'purple',
      drilldownType: 'explainer',
      metricType: 'utilization',
      sparklineData: sparklineData.utilization,
    }
  ];

  // Secondary KPIs (compact) - with sparkline data
  const secondaryKPIs = [
    {
      id: 'wash',
      title: 'Lavagens',
      displayValue: formatNumber(washCount),
      subtitle: `${washPercent}% do total`,
      trend: showTrends ? getTrendData(wow.washServices) : null,
      icon: Droplet,
      color: 'cyan',
      drilldownType: 'financial',
      metricType: 'wash',
      sparklineData: sparklineData.wash,
    },
    {
      id: 'dry',
      title: 'Secagens',
      displayValue: formatNumber(dryCount),
      subtitle: `${dryPercent}% do total`,
      trend: showTrends ? getTrendData(wow.dryServices) : null,
      icon: Flame,
      color: 'orange',
      drilldownType: 'financial',
      metricType: 'dry',
      sparklineData: sparklineData.dry,
    },
    {
      id: 'atrisk',
      title: 'Em Risco',
      displayValue: formatNumber(needsAttentionCount),
      subtitle: 'Precisam atenção',
      icon: AlertCircle,
      color: 'red',
      drilldownType: 'customer',
      customerType: 'atrisk',
      // No sparkline for customer count (not time-series)
    },
    {
      id: 'health',
      title: 'Taxa de Saúde',
      displayValue: formatPercent(healthRate),
      subtitle: 'Clientes saudáveis',
      icon: Heart,
      color: 'green',
      drilldownType: 'explainer',
      metricType: 'health',
      // No sparkline for health rate (not time-series)
    }
  ];

  return (
    <>
      {/* Mobile & Tablet Layout (< lg): Stacked grids */}
      <div className="lg:hidden space-y-4">
        {/* Hero cards: 3 columns */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {heroKPIs.map(kpi => (
            <HeroKPICard
              key={kpi.id}
              title={kpi.title}
              shortTitle={kpi.shortTitle}
              value={kpi.value}
              displayValue={kpi.displayValue}
              subtitle={kpi.subtitle}
              trend={kpi.trend}
              icon={kpi.icon}
              color={kpi.color}
              sparklineData={kpi.sparklineData}
              onClick={() => handleCardClick(kpi)}
            />
          ))}
        </div>
        {/* Secondary cards: 2 columns on mobile, 4 on sm */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {secondaryKPIs.map(kpi => (
            <SecondaryKPICard
              key={kpi.id}
              title={kpi.title}
              displayValue={kpi.displayValue}
              subtitle={kpi.subtitle}
              trend={kpi.trend}
              icon={kpi.icon}
              color={kpi.color}
              sparklineData={kpi.sparklineData}
              onClick={() => handleCardClick(kpi)}
            />
          ))}
        </div>
      </div>

      {/* Desktop Layout (lg+): Unified 12-column grid */}
      <div className="hidden lg:block space-y-4">
        {/* Hero cards: span 4 cols each (3 × 4 = 12) */}
        <div className="grid grid-cols-12 gap-4">
          {heroKPIs.map(kpi => (
            <div key={kpi.id} className="col-span-4">
              <HeroKPICard
                title={kpi.title}
                shortTitle={kpi.shortTitle}
                value={kpi.value}
                displayValue={kpi.displayValue}
                subtitle={kpi.subtitle}
                trend={kpi.trend}
                icon={kpi.icon}
                color={kpi.color}
                sparklineData={kpi.sparklineData}
                onClick={() => handleCardClick(kpi)}
              />
            </div>
          ))}
        </div>
        {/* Secondary cards: span 3 cols each (4 × 3 = 12) */}
        <div className="grid grid-cols-12 gap-4">
          {secondaryKPIs.map(kpi => (
            <div key={kpi.id} className="col-span-3">
              <SecondaryKPICard
                title={kpi.title}
                displayValue={kpi.displayValue}
                subtitle={kpi.subtitle}
                trend={kpi.trend}
                icon={kpi.icon}
                color={kpi.color}
                sparklineData={kpi.sparklineData}
                onClick={() => handleCardClick(kpi)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Drill-down Modal */}
      {(() => {
        // Calculate badge for customer drilldowns
        const customers = selectedKPI?.drilldownType === 'customer'
          ? getDrilldownCustomers(selectedKPI.customerType)
          : [];
        const badge = selectedKPI?.drilldownType === 'customer' && customers.length > 0
          ? `${customers.length} cliente${customers.length !== 1 ? 's' : ''}`
          : null;

        // Customer modals use narrower width for better desktop density
        const maxWidth = selectedKPI?.drilldownType === 'customer' ? 'max-w-lg' : 'max-w-2xl';

        return (
          <KPIDetailModal
            isOpen={!!selectedKPI}
            onClose={handleCloseModal}
            title={selectedKPI?.title}
            icon={selectedKPI?.icon}
            color={selectedKPI?.color}
            badge={badge}
            maxWidth={maxWidth}
          >
            {selectedKPI?.drilldownType === 'financial' && (
              <FinancialDrilldown
                salesData={salesData}
                metricType={selectedKPI.metricType}
              />
            )}

            {selectedKPI?.drilldownType === 'customer' && (
              <CustomerListDrilldown
                customers={customers}
                type={selectedKPI.customerType}
              />
            )}

            {selectedKPI?.drilldownType === 'explainer' && (
              <MetricExplainerDrilldown
                metricType={selectedKPI.metricType}
              />
            )}
          </KPIDetailModal>
        );
      })()}
    </>
  );
};

export default KPICardsGrid;
