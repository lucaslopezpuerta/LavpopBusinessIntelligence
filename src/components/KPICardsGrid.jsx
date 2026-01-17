// KPICardsGrid.jsx v3.8 - TOOLTIP HELP ICONS
// Restructured KPI display with visual hierarchy and trend sparklines
// Design System v3.2 compliant
//
// CHANGELOG:
// v3.8 (2026-01-07): Tooltip help icons (Plan Item 1.2)
//   - Added METRIC_TOOLTIPS import from constants
//   - All hero and secondary KPIs now have tooltip prop
//   - Pass tooltip prop to all card component renders
// v3.7 (2025-12-23): 4-column layout for both compact and expanded
//   - Hero cards: 4-column row in both layouts
//   - Secondary cards: 4-column row in both layouts
//   - Consistent column count across view modes
// v3.6 (2025-12-23): Compact mode for single-glance dashboard
//   - Added compact prop for dashboard layout
//   - Tighter gaps: gap-2 instead of gap-3/4
//   - Passes compact prop to child cards
// v3.5 (2025-12-22): Utilization sparkline shows % (not machine-minutes)
//   - FIXED: Sparkline now shows daily utilization % matching drilldown
//   - Uses BUSINESS_PARAMS for accurate capacity calculation
// v3.4 (2025-12-22): Utilization card uses financial drilldown
//   - Changed utilization drilldownType from 'explainer' to 'financial'
//   - Added machineMinutes calculation for utilization sparkline
//   - Sparkline now shows daily machine-minutes trend
// v3.3 (2025-12-22): MTD Revenue hero card + 4-column layout
//   - NEW: 4th hero card showing MTD Gross Revenue with YoY comparison
//   - Desktop: 4 hero cards in 12-col grid (span 3 each)
//   - Mobile: 2x2 grid for hero cards
//   - Added mtdDaily sparkline calculation
// v3.2 (2025-12-16): Use parseSalesRecords for sparkline calculation
//   - REFACTORED: Use shared parseSalesRecords from transactionParser
//   - Consistent with FinancialDrilldown calculation approach
//   - Cleaner code with pre-parsed netValue, washCount, dryCount
// v3.1 (2025-12-16): Fixed sparkline data calculation
//   - FIXED: Calculate sparklineData from salesData (not businessMetrics.daily)
//   - Aggregates last 7 days of sales for trend visualization
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

import { useState, useMemo, useCallback } from 'react';
import {
  DollarSign, WashingMachine, Percent, Droplet, Flame,
  AlertCircle, Heart, CalendarDays
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent, getTrendData } from '../utils/formatters';
import { formatDate } from '../utils/dateUtils';
import { parseSalesRecords } from '../utils/transactionParser';
import { BUSINESS_PARAMS } from '../utils/operationsMetrics';
import { METRIC_TOOLTIPS } from '../constants/metricTooltips';
import { getMetricStatus } from '../constants/metricThresholds';
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
  viewMode = 'complete',
  compact = false
}) => {
  const [selectedKPI, setSelectedKPI] = useState(null);

  // Loading state - 4 hero cards + 4 secondary cards
  if (!businessMetrics || !customerMetrics) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 lg:h-32 bg-slate-200 dark:bg-slate-700 rounded-xl" />
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
  // Total active customers for percentage calculations
  const totalActiveCustomers = customerMetrics.activeCustomers?.length || 0;
  const atRiskPercent = totalActiveCustomers > 0
    ? Math.round((needsAttentionCount / totalActiveCustomers) * 100)
    : 0;

  // Service breakdown
  const washCount = metricsSource.washServices || 0;
  const dryCount = metricsSource.dryServices || 0;
  const totalServices = washCount + dryCount;
  const washPercent = totalServices > 0 ? ((washCount / totalServices) * 100).toFixed(0) : 0;
  const dryPercent = totalServices > 0 ? ((dryCount / totalServices) * 100).toFixed(0) : 0;

  // Calculate sparkline data using parseSalesRecords (same as FinancialDrilldown)
  const sparklineData = useMemo(() => {
    if (!salesData || salesData.length === 0) return {};

    // Use shared parser for consistent date/value handling
    const records = parseSalesRecords(salesData);

    // Get last 7 days window
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Initialize dailyMap for last 7 days using formatDate (local timezone)
    const dailyMap = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateKey = formatDate(d); // YYYY-MM-DD in local timezone
      dailyMap[dateKey] = { revenue: 0, wash: 0, dry: 0 };
    }

    // Aggregate from parsed records (uses dateStr which matches formatDate)
    records.forEach(record => {
      if (record.date >= sevenDaysAgo && record.date <= today) {
        const dateKey = record.dateStr;
        if (dailyMap[dateKey]) {
          dailyMap[dateKey].revenue += record.netValue;
          dailyMap[dateKey].wash += record.washCount || 0;
          dailyMap[dateKey].dry += record.dryCount || 0;
        }
      }
    });

    // Convert to sorted arrays
    const sortedDays = Object.keys(dailyMap).sort();

    // Calculate daily utilization % using business parameters
    const operatingHours = BUSINESS_PARAMS.OPERATING_HOURS.end - BUSINESS_PARAMS.OPERATING_HOURS.start;
    const minutesPerDay = operatingHours * 60;
    const efficiencyFactor = BUSINESS_PARAMS.EFFICIENCY_FACTOR;
    const washerMinutesAvailable = BUSINESS_PARAMS.TOTAL_WASHERS * minutesPerDay * efficiencyFactor;
    const dryerMinutesAvailable = BUSINESS_PARAMS.TOTAL_DRYERS * minutesPerDay * efficiencyFactor;
    const totalMachines = BUSINESS_PARAMS.TOTAL_WASHERS + BUSINESS_PARAMS.TOTAL_DRYERS;

    const utilizationData = sortedDays.map(k => {
      const day = dailyMap[k];
      const washerMinutesUsed = day.wash * BUSINESS_PARAMS.WASHER_CYCLE_MINUTES;
      const dryerMinutesUsed = day.dry * BUSINESS_PARAMS.DRYER_CYCLE_MINUTES;
      const washerUtil = washerMinutesAvailable > 0 ? (washerMinutesUsed / washerMinutesAvailable) * 100 : 0;
      const dryerUtil = dryerMinutesAvailable > 0 ? (dryerMinutesUsed / dryerMinutesAvailable) * 100 : 0;
      return Math.round(((washerUtil * BUSINESS_PARAMS.TOTAL_WASHERS) + (dryerUtil * BUSINESS_PARAMS.TOTAL_DRYERS)) / totalMachines * 10) / 10;
    });

    // Calculate MTD daily data (current month only)
    const mtdMap = {};
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const mtdStart = new Date(currentYear, currentMonth, 1);
    mtdStart.setHours(0, 0, 0, 0);

    // Initialize mtdMap for current month (up to today)
    for (let d = new Date(mtdStart); d <= today; d.setDate(d.getDate() + 1)) {
      const dateKey = formatDate(d);
      mtdMap[dateKey] = { grossRevenue: 0 };
    }

    // Aggregate MTD from parsed records
    records.forEach(record => {
      if (record.date >= mtdStart && record.date <= today) {
        const dateKey = record.dateStr;
        if (mtdMap[dateKey]) {
          mtdMap[dateKey].grossRevenue += record.grossValue || record.netValue || 0;
        }
      }
    });

    const sortedMtdDays = Object.keys(mtdMap).sort();

    return {
      revenue: sortedDays.map(k => Math.max(0, Math.round(dailyMap[k].revenue * 100) / 100)),
      cycles: sortedDays.map(k => dailyMap[k].wash + dailyMap[k].dry),
      wash: sortedDays.map(k => dailyMap[k].wash),
      dry: sortedDays.map(k => dailyMap[k].dry),
      // Daily utilization % for sparkline
      utilization: utilizationData,
      // MTD daily gross revenue
      mtdDaily: sortedMtdDays.map(k => Math.max(0, Math.round(mtdMap[k].grossRevenue * 100) / 100)),
    };
  }, [salesData]);

  // Time subtitle - memoized to avoid recalculation
  const timeSubtitle = useMemo(() => {
    if (viewMode === 'current' && businessMetrics.windows?.currentWeek) {
      const days = businessMetrics.windows.currentWeek.daysElapsed || 1;
      return `${days} ${days === 1 ? 'dia' : 'dias'}`;
    }
    return '7 dias';
  }, [viewMode, businessMetrics.windows?.currentWeek]);

  // Modal handlers - memoized to prevent re-renders in child components
  const handleCardClick = useCallback((kpi) => {
    if (kpi.drilldownType) {
      setSelectedKPI(kpi);
    }
  }, []);

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

  // Hero KPIs (primary metrics) - memoized to prevent recreation on every render
  // Now includes 4 cards: Revenue, Cycles, Utilization, MTD Revenue
  const heroKPIs = useMemo(() => [
    {
      id: 'revenue',
      title: 'Receita Líquida',
      shortTitle: 'Receita',
      value: metricsSource.netRevenue || 0,
      displayValue: formatCurrency(metricsSource.netRevenue),
      trend: showTrends ? getTrendData(wow.netRevenue) : null,
      subtitle: timeSubtitle,
      icon: DollarSign,
      color: 'green',
      drilldownType: 'financial',
      metricType: 'revenue',
      sparklineData: sparklineData.revenue,
      tooltip: METRIC_TOOLTIPS.revenue,
    },
    {
      id: 'services',
      title: 'Total de Ciclos',
      shortTitle: 'Ciclos',
      value: metricsSource.totalServices || 0,
      displayValue: formatNumber(metricsSource.totalServices),
      trend: showTrends ? getTrendData(wow.totalServices) : null,
      subtitle: timeSubtitle,
      icon: WashingMachine,
      color: 'blue',
      drilldownType: 'financial',
      metricType: 'cycles',
      sparklineData: sparklineData.cycles,
      tooltip: METRIC_TOOLTIPS.cycles,
    },
    {
      id: 'utilization',
      title: 'Utilização Geral',
      shortTitle: 'Utiliz.',
      value: Math.round(operationsMetrics?.utilization?.totalUtilization || 0),
      displayValue: formatPercent(operationsMetrics?.utilization?.totalUtilization || 0),
      trend: showTrends ? getTrendData(wow.utilization) : null,
      subtitle: timeSubtitle,
      icon: Percent,
      color: 'purple',
      drilldownType: 'financial',
      metricType: 'utilization',
      sparklineData: sparklineData.utilization,
      tooltip: METRIC_TOOLTIPS.utilization,
      // Status based on utilization thresholds (70-85% is good)
      status: getMetricStatus('utilizacao', operationsMetrics?.utilization?.totalUtilization || 0),
    },
    {
      id: 'mtd-revenue',
      title: 'Receita MTD',
      shortTitle: 'MTD',
      value: businessMetrics?.monthToDate?.grossRevenue || 0,
      displayValue: formatCurrency(businessMetrics?.monthToDate?.grossRevenue),
      // MTD uses YoY comparison (vs same month last year)
      trend: getTrendData(businessMetrics?.monthToDate?.yearOverYearChange),
      subtitle: `${businessMetrics?.monthToDate?.daysElapsed || 0} dias (${businessMetrics?.monthToDate?.monthName || ''})`,
      icon: CalendarDays,
      color: 'amber',
      drilldownType: 'financial',
      metricType: 'mtd',
      sparklineData: sparklineData.mtdDaily,
      tooltip: METRIC_TOOLTIPS.mtdRevenue,
    }
  ], [metricsSource, showTrends, wow, timeSubtitle, sparklineData, operationsMetrics, businessMetrics?.monthToDate]);

  // Secondary KPIs (compact) - memoized to prevent recreation on every render
  const secondaryKPIs = useMemo(() => [
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
      tooltip: METRIC_TOOLTIPS.washPercent,
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
      tooltip: METRIC_TOOLTIPS.dryPercent,
    },
    {
      id: 'atrisk',
      title: 'Em Risco',
      displayValue: formatNumber(needsAttentionCount),
      subtitle: atRiskPercent > 0 ? `${atRiskPercent}% da base` : 'Nenhum em risco',
      icon: AlertCircle,
      color: 'red',
      drilldownType: 'customer',
      customerType: 'atrisk',
      tooltip: METRIC_TOOLTIPS.atRisk,
      // Status based on at-risk % thresholds (0-10% is good)
      status: getMetricStatus('atRiskPercent', atRiskPercent),
      // No sparkline for customer count (not time-series)
    },
    {
      id: 'health',
      title: 'Taxa de Saúde',
      displayValue: formatPercent(healthRate),
      subtitle: `${totalActiveCustomers} clientes ativos`,
      icon: Heart,
      color: 'green',
      drilldownType: 'explainer',
      metricType: 'health',
      tooltip: METRIC_TOOLTIPS.healthRate,
      // No sparkline for health rate (not time-series)
    }
  ], [washCount, washPercent, dryCount, dryPercent, showTrends, wow, sparklineData, needsAttentionCount, atRiskPercent, healthRate, totalActiveCustomers]);

  return (
    <>
      {compact ? (
        /* COMPACT LAYOUT: Tighter spacing for single-glance dashboard */
        <div className="space-y-2">
          {/* Hero cards: 4-column row */}
          <div className="grid grid-cols-4 gap-2">
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
                tooltip={kpi.tooltip}
                status={kpi.status}
                compact={true}
                onClick={() => handleCardClick(kpi)}
              />
            ))}
          </div>
          {/* Secondary cards: 4-column row */}
          <div className="grid grid-cols-4 gap-2">
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
                tooltip={kpi.tooltip}
                status={kpi.status}
                compact={true}
                onClick={() => handleCardClick(kpi)}
              />
            ))}
          </div>
        </div>
      ) : (
        /* EXPANDED LAYOUT: Original full layout */
        <>
          {/* Mobile & Tablet Layout (< lg): Stacked grids */}
          <div className="lg:hidden space-y-4">
            {/* Hero cards: 2x2 grid for 4 cards */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
                  tooltip={kpi.tooltip}
                  status={kpi.status}
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
                  tooltip={kpi.tooltip}
                  status={kpi.status}
                  onClick={() => handleCardClick(kpi)}
                />
              ))}
            </div>
          </div>

          {/* Desktop Layout (lg+): Unified 12-column grid */}
          <div className="hidden lg:block space-y-4">
            {/* Hero cards: span 3 cols each (4 × 3 = 12) */}
            <div className="grid grid-cols-12 gap-4">
              {heroKPIs.map(kpi => (
                <div key={kpi.id} className="col-span-3">
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
                    tooltip={kpi.tooltip}
                    status={kpi.status}
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
                    tooltip={kpi.tooltip}
                    status={kpi.status}
                    onClick={() => handleCardClick(kpi)}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

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
