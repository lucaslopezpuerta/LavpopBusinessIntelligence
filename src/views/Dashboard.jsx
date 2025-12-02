// Dashboard.jsx v9.1 - UNIFIED HEADER
// ✅ Integrated KPICardsGrid with visual hierarchy
// ✅ Hero cards for primary metrics
// ✅ Secondary cards in compact grid
// ✅ Optimized layout spacing
// ✅ Consistent header matching all views
//
// CHANGELOG:
// v9.1 (2025-12-02): Unified header design
//   - Added header with icon box and left border accent
//   - Consistent styling across all app views
//   - Title: "Visão Geral" with subtitle
// v9.0 (2025-12-01): Moved AtRiskCustomersTable to Customers view
//   - Removed AtRiskCustomersTable from Dashboard
//   - Simplified Operations section layout
//   - At-risk customers now accessible via Customers tab
// v8.9 (2025-12-01): Fixed utilization calculation
//   - operationsMetrics now recalculates based on viewMode
//   - Maps viewMode to correct dateFilter (complete→lastWeek, current→currentWeek)
// v8.8 (2025-12-01): Layout cleanup
//   - Removed QuickActionsCard (actions moved to header)
//   - Simplified right column layout
// v8.7 (2025-11-30): Accessibility & structure improvements
//   - Added semantic section elements with headings
//   - Improved screen reader context
//   - Enhanced footer visibility
// v8.6 (2025-11-30): KPICardsGrid integration
//   - Replaced KPICards with KPICardsGrid
//   - Cleaner visual hierarchy (3 hero + 6 secondary)
//   - Non-gradient design per Design System audit
// v8.5: Fixed layout & metrics
import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard } from 'lucide-react';
import KPICardsGrid from '../components/KPICardsGrid';
import OperatingCyclesChart from '../components/OperatingCyclesChart';
import DashboardDateControl from '../components/DashboardDateControl';
import { calculateBusinessMetrics } from '../utils/businessMetrics';
import { calculateCustomerMetrics } from '../utils/customerMetrics';
import { calculateOperationsMetrics } from '../utils/operationsMetrics';
import { useNavigation } from '../contexts/NavigationContext';

const Dashboard = ({ data, viewMode, setViewMode }) => {
  const { navigateTo } = useNavigation();
  const [lastUpdated, setLastUpdated] = useState(null);

  // Extract data from props
  const salesData = data?.sales || [];
  const rfmData = data?.rfm || [];
  const customerData = data?.customer || [];

  useEffect(() => {
    if (data) {
      setLastUpdated(new Date());
    }
  }, [data]);

  // Split memoization for better performance
  // Each calculation only recalculates when its specific dependencies change
  const businessMetricsCalc = useMemo(() => {
    if (!salesData.length) return null;
    return calculateBusinessMetrics(salesData);
  }, [salesData]);

  const customerMetricsCalc = useMemo(() => {
    if (!salesData.length) return null;
    return calculateCustomerMetrics(salesData, rfmData, customerData);
  }, [salesData, rfmData, customerData]);

  // Map viewMode to operationsMetrics dateFilter
  // 'complete' = last 7 complete days → 'lastWeek'
  // 'current' = current week so far → 'currentWeek'
  const operationsDateFilter = viewMode === 'current' ? 'currentWeek' : 'lastWeek';

  const operationsMetricsCalc = useMemo(() => {
    if (!salesData.length) return null;
    return calculateOperationsMetrics(salesData, operationsDateFilter);
  }, [salesData, operationsDateFilter]);

  // Combined metrics object for backwards compatibility
  const metrics = useMemo(() => {
    if (!businessMetricsCalc) return null;
    return {
      business: businessMetricsCalc,
      customers: customerMetricsCalc,
      operations: operationsMetricsCalc
    };
  }, [businessMetricsCalc, customerMetricsCalc, operationsMetricsCalc]);

  // Handle tab navigation from drill-downs
  const handleTabChange = (tabId) => {
    navigateTo(tabId);
  };



  // Get date range based on view mode
  const getDateRange = () => {
    if (!metrics?.business?.windows) return null;

    if (viewMode === 'current' && metrics.business.windows.currentWeek) {
      const w = metrics.business.windows.currentWeek;
      const days = w.daysElapsed || 0;
      return {
        start: w.startDate,
        end: w.endDate,
        days: days,
        label: `${days} ${days === 1 ? 'dia' : 'dias'}`
      };
    }

    if (metrics.business.windows.weekly) {
      const w = metrics.business.windows.weekly;
      return {
        start: w.startDate,
        end: w.endDate,
        days: w.activeDays || 7,
        label: '7 dias'
      };
    }

    return null;
  };

  const dateRange = getDateRange();
  const businessMetrics = metrics?.business;
  const customerMetrics = metrics?.customers;
  const operationsMetrics = metrics?.operations;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-lavpop-blue/10 dark:bg-lavpop-blue/20 flex items-center justify-center border-l-4 border-lavpop-blue">
          <LayoutDashboard className="w-5 h-5 text-lavpop-blue" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Visão Geral
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Métricas principais do seu negócio
          </p>
        </div>
      </header>

      {/* Date Control */}
      <DashboardDateControl
        viewMode={viewMode}
        setViewMode={setViewMode}
        dateRange={dateRange}
      />

      {/* KPI Cards Section - Hero + Secondary Grid */}
      <section aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="sr-only">Indicadores Principais de Performance</h2>
        <KPICardsGrid
          businessMetrics={businessMetrics}
          customerMetrics={customerMetrics}
          operationsMetrics={operationsMetrics}
          salesData={salesData}
          viewMode={viewMode}
        />
      </section>

      {/* Operations Section */}
      <section aria-labelledby="operations-heading">
        <h2 id="operations-heading" className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-lavpop-blue rounded-full"></span>
          Operações
        </h2>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <OperatingCyclesChart salesData={salesData} />
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 dark:text-slate-400 mt-8 pb-4 border-t border-slate-200 dark:border-slate-700 pt-4">
        Última atualização: {lastUpdated ? lastUpdated.toLocaleTimeString('pt-BR') : '-'} • Lavpop BI v9.0
      </footer>
    </div>
  );
};

export default Dashboard;
