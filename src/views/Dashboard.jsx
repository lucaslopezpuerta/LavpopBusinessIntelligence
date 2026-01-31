// Dashboard.jsx v10.4 - STELLAR CASCADE TRANSITIONS
// ✅ Compact (stacked rows) and Expanded (vertical) layouts
// ✅ DateControl integrated in header for both layouts
// ✅ Layout preference from ThemeContext (localStorage)
// ✅ Hero cards for primary metrics
// ✅ Secondary cards in compact grid
// ✅ Optimized layout spacing
// ✅ Consistent header matching all views
// ✅ Data readiness check with skeleton fallback
// ✅ Orchestrated entrance animations with AnimatedView
//
// CHANGELOG:
// v10.4 (2026-01-27): Stellar Cascade transitions
//   - Added AnimatedView, AnimatedHeader, AnimatedSection wrappers
//   - Content cascades in layered sequence (~250ms total)
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
import StaleDataIndicator from '../components/ui/StaleDataIndicator';
import PullToRefreshWrapper from '../components/ui/PullToRefreshWrapper';
import { AnimatedView, AnimatedHeader, AnimatedSection } from '../components/ui/AnimatedView';
import { useDataRefresh } from '../contexts/DataFreshnessContext';

const Dashboard = ({ data, viewMode, setViewMode, onDataChange }) => {
  // Get layout preference from ThemeContext
  const { dashboardLayout, isDark } = useTheme();
  const isMobile = useIsMobile();
  // Data freshness for stale indicator
  const { lastRefreshed, refreshing, triggerRefresh } = useDataRefresh();
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
      <AnimatedView className={isCompact ? '!space-y-4' : ''}>
        {/* SHARED HEADER - Cosmic Precision Design v2.1 */}
        <AnimatedHeader className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Icon Container - Glassmorphism (consistent size) */}
              <div
                className={`
                  w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0
                  ${isDark
                    ? 'bg-space-dust/70 border border-stellar-cyan/20'
                    : 'bg-white border border-stellar-blue/10 shadow-md'}
                `}
                style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
              >
                <LayoutDashboard className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? 'text-stellar-cyan' : 'text-stellar-blue'}`} />
              </div>
              {/* Title & Subtitle */}
              <div>
                <h1
                  className="text-lg sm:text-xl font-bold tracking-wider"
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  <span className="text-gradient-stellar">VISÃO GERAL</span>
                </h1>
                <p className={`text-xs tracking-wide mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Métricas principais da sua lavanderia
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StaleDataIndicator
                lastUpdated={lastRefreshed}
                isRefreshing={refreshing}
                onRefresh={() => triggerRefresh({ reason: 'manual' })}
              />
              <DashboardDateControl
                viewMode={viewMode}
                setViewMode={setViewMode}
                dateRange={dateRange}
                inline={true}
              />
            </div>
          </div>
        </AnimatedHeader>

        {/* LAYOUT-SPECIFIC CONTENT */}
        {isCompact ? (
          /* COMPACT LAYOUT: Stacked rows - KPIs full width, then chart full width */
          <>
            {/* Row 1: KPIs - Full width */}
            <AnimatedSection ariaLabel="Indicadores Principais de Performance">
              <KPICardsGrid
                businessMetrics={businessMetrics}
                customerMetrics={customerMetrics}
                operationsMetrics={operationsMetrics}
                salesData={salesData}
                viewMode={viewMode}
                compact={true}
              />
            </AnimatedSection>

            {/* Row 2: Chart - Full width */}
            <AnimatedSection ariaLabel="Operações">
              <div className="bg-white dark:bg-space-dust rounded-2xl shadow-sm border border-slate-200 dark:border-stellar-cyan/10 p-4">
                <Suspense fallback={<ChartLoadingFallback height="h-48" />}>
                  <LazyOperatingCyclesChart salesData={salesData} compact={true} />
                </Suspense>
              </div>
            </AnimatedSection>
          </>
        ) : (
          /* EXPANDED LAYOUT: Vertical stacked (original) */
          <>
            {/* KPI Cards Section - Hero + Secondary Grid */}
            <AnimatedSection ariaLabel="Indicadores Principais de Performance">
              <KPICardsGrid
                businessMetrics={businessMetrics}
                customerMetrics={customerMetrics}
                operationsMetrics={operationsMetrics}
                salesData={salesData}
                viewMode={viewMode}
              />
            </AnimatedSection>

            {/* Operations Chart */}
            <AnimatedSection ariaLabel="Operações">
              <div className="bg-white dark:bg-space-dust rounded-2xl shadow-sm border border-slate-200 dark:border-stellar-cyan/10 p-6">
                <Suspense fallback={<ChartLoadingFallback height="h-96" />}>
                  <LazyOperatingCyclesChart salesData={salesData} />
                </Suspense>
              </div>
            </AnimatedSection>
          </>
        )}
      </AnimatedView>
    </PullToRefreshWrapper>
  );
};

export default Dashboard;
