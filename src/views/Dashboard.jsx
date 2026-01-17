// Dashboard.jsx v10.3 - PULL TO REFRESH
// ✅ Compact (stacked rows) and Expanded (vertical) layouts
// ✅ DateControl integrated in header for both layouts
// ✅ Layout preference from ThemeContext (localStorage)
// ✅ Hero cards for primary metrics
// ✅ Secondary cards in compact grid
// ✅ Optimized layout spacing
// ✅ Consistent header matching all views
// ✅ Data readiness check with skeleton fallback
//
// CHANGELOG:
// v10.3 (2026-01-12): Pull-to-refresh support
//   - Added PullToRefreshWrapper for mobile swipe-to-refresh gesture
//   - Accepts onDataChange prop for refresh callback
// v10.2 (2025-12-23): Data readiness check
//   - Added DashboardLoadingSkeleton fallback when data not ready
//   - Prevents empty renders after idle periods
// v10.1 (2025-12-23): Compact layout revision
//   - Changed compact from 2-column to stacked rows
//   - Row 1: KPIs full width, Row 2: Chart full width
//   - Better use of horizontal space for chart
// v10.0 (2025-12-23): Dual layout support
//   - Added compact/expanded layout toggle via ThemeContext
//   - DateControl integrated into header for both layouts
// v9.3 (2025-12-16): Simplified layout
//   - Removed Operations section title
//   - Updated subtitle to "lavanderia"
// v9.2 (2025-12-16): Removed footer
//   - Removed "Última atualização" footer
//   - Cleaned up unused imports and state
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
import { useMemo, Suspense } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useIsMobile } from '../hooks/useMediaQuery';
import KPICardsGrid from '../components/KPICardsGrid';
import DashboardDateControl from '../components/DashboardDateControl';
import { LazyOperatingCyclesChart, ChartLoadingFallback } from '../utils/lazyCharts';
import { calculateBusinessMetrics } from '../utils/businessMetrics';
import { calculateCustomerMetrics } from '../utils/customerMetrics';
import { calculateOperationsMetrics } from '../utils/operationsMetrics';
import { DashboardLoadingSkeleton } from '../components/ui/Skeleton';
import PullToRefreshWrapper from '../components/ui/PullToRefreshWrapper';

const Dashboard = ({ data, viewMode, setViewMode, onDataChange }) => {
  // Get layout preference from ThemeContext
  const { dashboardLayout } = useTheme();
  const isMobile = useIsMobile();
  // Compact mode only on desktop - mobile always shows expanded layout
  const isCompact = dashboardLayout === 'compact' && !isMobile;

  // Extract data from props
  const salesData = data?.sales || [];
  const rfmData = data?.rfm || [];
  const customerData = data?.customer || [];

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

  // Data readiness check - show skeleton if data not ready
  const isDataReady = data?.sales?.length > 0;
  if (!isDataReady || !metrics?.business) {
    return <DashboardLoadingSkeleton />;
  }

  return (
    <PullToRefreshWrapper onRefresh={onDataChange}>
      <div className={isCompact ? 'space-y-4' : 'space-y-6 sm:space-y-8'}>
        {/* SHARED HEADER - DateControl integrated for both layouts */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`${isCompact ? 'w-8 h-8' : 'w-10 h-10'} rounded-xl bg-lavpop-blue/10 dark:bg-lavpop-blue/20 flex items-center justify-center border-l-4 border-lavpop-blue`}>
            <LayoutDashboard className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'} text-lavpop-blue`} />
          </div>
          <div>
            <h1 className={`${isCompact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'} font-bold text-slate-900 dark:text-white`}>
              Visão Geral
            </h1>
            {!isCompact && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Métricas principais da sua lavanderia
              </p>
            )}
          </div>
        </div>
        <DashboardDateControl
          viewMode={viewMode}
          setViewMode={setViewMode}
          dateRange={dateRange}
          inline={true}
        />
      </header>

      {/* LAYOUT-SPECIFIC CONTENT */}
      {isCompact ? (
        /* COMPACT LAYOUT: Stacked rows - KPIs full width, then chart full width */
        <div className="space-y-4">
          {/* Row 1: KPIs - Full width */}
          <section aria-labelledby="kpi-heading-compact">
            <h2 id="kpi-heading-compact" className="sr-only">Indicadores Principais de Performance</h2>
            <KPICardsGrid
              businessMetrics={businessMetrics}
              customerMetrics={customerMetrics}
              operationsMetrics={operationsMetrics}
              salesData={salesData}
              viewMode={viewMode}
              compact={true}
            />
          </section>

          {/* Row 2: Chart - Full width */}
          <section aria-labelledby="operations-heading-compact">
            <h2 id="operations-heading-compact" className="sr-only">Operações</h2>
            <div className="bg-gradient-to-br from-cyan-50/40 via-white to-white dark:from-cyan-900/10 dark:via-space-nebula dark:to-space-nebula rounded-2xl shadow-sm border border-slate-200/80 dark:border-stellar-cyan/10 border-l-4 border-l-cyan-500 dark:border-l-cyan-400 p-4">
              <Suspense fallback={<ChartLoadingFallback height="h-48" />}>
                <LazyOperatingCyclesChart salesData={salesData} compact={true} />
              </Suspense>
            </div>
          </section>
        </div>
      ) : (
        /* EXPANDED LAYOUT: Vertical stacked (original) */
        <>
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

          {/* Operations Chart */}
          <section aria-labelledby="operations-heading">
            <h2 id="operations-heading" className="sr-only">Operações</h2>
            <div className="bg-gradient-to-br from-cyan-50/40 via-white to-white dark:from-cyan-900/10 dark:via-space-nebula dark:to-space-nebula rounded-2xl shadow-sm border border-slate-200/80 dark:border-stellar-cyan/10 border-l-4 border-l-cyan-500 dark:border-l-cyan-400 p-6">
              <Suspense fallback={<ChartLoadingFallback height="h-96" />}>
                <LazyOperatingCyclesChart salesData={salesData} />
              </Suspense>
            </div>
          </section>
        </>
      )}
      </div>
    </PullToRefreshWrapper>
  );
};

export default Dashboard;
