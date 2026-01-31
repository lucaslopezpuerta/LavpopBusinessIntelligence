// OPERATIONS TAB V6.1.0 - STELLAR CASCADE TRANSITIONS
// ✅ Centralized week-based date filtering
// ✅ Explicit date ranges in UI
// ✅ Single source of truth for all components
// ✅ Tailwind CSS styling (Design System v3.4)
// ✅ Dark mode support
// ✅ Responsive grid layout
// ✅ Actionability-first component order
// ✅ Operations-optimized date options (no allTime)
// ✅ Consistent header matching all views
// ✅ Sticky date control matching Dashboard
// ✅ Reusable SectionHeader component (Design System v3.4)
// ✅ Category-level naming for future expansion
// ✅ Full-width layout consistent with other views
// ✅ Loading skeleton fallback for data readiness
//
// CHANGELOG:
// v6.1.0 (2026-01-27): Stellar Cascade transitions
//   - Added AnimatedView, AnimatedHeader, AnimatedSection wrappers
//   - Content cascades in layered sequence (~250ms total)
// v6.0.0 (2026-01-23): Simplified layout
//   - Removed section headers (Equipamentos, Utilização, Padrões Temporais)
//   - Components now have their own headers with icon badges
//   - Cleaner visual hierarchy with less redundant titles
// v5.9.0 (2026-01-12): Pull-to-refresh support
//   - Added PullToRefreshWrapper for mobile swipe-to-refresh gesture
//   - Accepts onDataChange prop for refresh callback
// v5.8.0 (2026-01-07): SectionHeader refactor
//   - Replaced inline section headers with SectionHeader component
//   - Reduces code duplication, improves consistency
//   - Design System v3.4 compliant
// v5.7.0 (2025-12-23): Loading skeleton
//   - Replaced hardcoded "Loading..." message with OperationsLoadingSkeleton
//   - Prevents empty renders after idle periods
// v5.6.0 (2025-12-16): Full-width layout
//   - REMOVED: max-w-[100rem] constraint for full-width
//   - REMOVED: Redundant padding (now uses App.jsx padding)
//   - Consistent with Dashboard.jsx and Customers.jsx layout
// v5.5.0 (2025-12-02): Categorical section header naming
//   - Renamed sections to general categories for future expansion
//   - "Desempenho de Máquinas" → "Equipamentos" (allows: maintenance, health)
//   - "Mapa de Calor" → "Utilização" (allows: capacity, efficiency)
//   - External headers = Category level, Internal headers = Specific
// v5.4.0 (2025-12-02): Unified section headers
//   - Added section headers with icons for all sections
//   - Consistent with Customers.jsx and Intelligence.jsx
//   - Uses amber accent color for Operations theme
// v5.3.0 (2025-12-02): Unified date control
//   - DateRangeSelector now uses sticky positioning
//   - Consistent compact style matching DashboardDateControl
// v5.2.0 (2025-12-02): Unified header design
//   - Added icon box with left border accent (amber)
//   - Consistent styling across all app views
// v5.1.0 (2025-11-30): Date range optimization for operations
//   - Changed default from currentWeek to lastWeek (complete data)
//   - Removed "Todo Período" option (not actionable for operations)
//   - Pass excludeAllTime={true} to DateRangeSelector
// v5.0.0 (2025-11-30): Layout restructure for actionability
//   - REMOVED: WashVsDryChart (low actionability, informational only)
//   - MOVED UP: MachinePerformanceTable to position 1 (most actionable)
//   - PAIRED: PeakHoursSummary + DayOfWeekChart (both time patterns)
//   - New order: KPIs → Machine Table → Heatmap → Peak+Day paired
//   - Better space efficiency with paired time-based components
// v4.2.0 (2025-11-30): Mobile width optimization
//   - Reduced mobile padding: p-6 → px-3 py-4 (gains ~24px horizontal space)
//   - Reduced mobile grid gap: gap-6 → gap-4 sm:gap-6
//   - Keeps comfortable padding for sm+ screens
// v4.1 (2025-11-30): Production cleanup
//   - Removed all console.log statements
//   - Clean error handling without debug output
// v4.0 (2025-11-26): Design System alignment
//   - Replaced all inline styles with Tailwind CSS
//   - Added dark mode support
//   - Removed styled-jsx media queries
//   - Updated responsive breakpoints (lg:)
//   - Aligned with Design System v3.0
// v3.1 (2025-11-15): Icons Change, New useMemo Added, Component Call Changed
// v3.0 (2025-11-15): Unified date filtering system
//   - Added DateRangeSelector component as single control
//   - Replaced machinePeriod with dateFilter state
//   - Pass dateFilter and dateWindow to all child components
//   - Removed individual period handlers
//   - All charts synchronized to single filter
// v2.0 (Previous): Added machine performance tracking
// v1.0 (Previous): Initial Operations tab

import React, { useMemo, useState, Suspense } from 'react';
import { Wrench } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import OperationsKPICards from '../components/OperationsKPICards';
import UtilizationHeatmap from '../components/UtilizationHeatmap';
import PeakHoursSummary from '../components/PeakHoursSummary';
import MachinePerformanceTable from '../components/MachinePerformanceTable';
import DateRangeSelector from '../components/DateRangeSelector';
import { LazyDayOfWeekChart, ChartLoadingFallback } from '../utils/lazyCharts';
import { calculateBusinessMetrics } from '../utils/businessMetrics';
import { calculateOperationsMetrics } from '../utils/operationsMetrics';
import { getDateWindows } from '../utils/dateWindows';
import { OperationsLoadingSkeleton } from '../components/ui/Skeleton';
import StaleDataIndicator from '../components/ui/StaleDataIndicator';
import PullToRefreshWrapper from '../components/ui/PullToRefreshWrapper';
import { AnimatedView, AnimatedHeader, AnimatedSection } from '../components/ui/AnimatedView';
import { useDataRefresh } from '../contexts/DataFreshnessContext';

const Operations = ({ data, onDataChange }) => {
  // Theme context for Cosmic Precision styling
  const { isDark } = useTheme();
  // Data freshness for stale indicator
  const { lastRefreshed, refreshing, triggerRefresh } = useDataRefresh();

  // Centralized date filter - single source of truth
  // Default to lastWeek for complete data (currentWeek is partial)
  const [dateFilter, setDateFilter] = useState('lastWeek');
  
  // Calculate date window once
  const dateWindow = useMemo(() => 
    getDateWindows(dateFilter), [dateFilter]
  );

  const businessMetrics = useMemo(() => {
    if (!data?.sales) return null;
    try {
      return calculateBusinessMetrics(data.sales);
    } catch {
      return null;
    }
  }, [data?.sales]);

  const operationsMetrics = useMemo(() => {
    if (!data?.sales) return null;
    try {
      return calculateOperationsMetrics(data.sales, dateFilter);
    } catch {
      return null;
    }
  }, [data?.sales, dateFilter, dateWindow]);

  // Calculate previous period metrics for comparison
  const previousWeekMetrics = useMemo(() => {
    if (!data?.sales || dateFilter === 'allTime') return null;

    // Determine which previous period to compare against
    const comparisonFilterMap = {
      currentWeek: 'lastWeek',
      lastWeek: 'twoWeeksAgo',
      last4Weeks: 'previous4Weeks',
    };

    const comparisonFilter = comparisonFilterMap[dateFilter];
    if (!comparisonFilter) return null;

    try {
      return calculateOperationsMetrics(data.sales, comparisonFilter);
    } catch {
      return null;
    }
  }, [data?.sales, dateFilter]);

  // Data readiness check - show skeleton if data not ready
  if (!businessMetrics || !operationsMetrics) {
    return <OperationsLoadingSkeleton />;
  }

  return (
    <PullToRefreshWrapper onRefresh={onDataChange}>
      <AnimatedView>
        {/* Header - Cosmic Precision Design v2.1 */}
        <AnimatedHeader className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Icon Container - Glassmorphism */}
            <div
              className={`
                w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0
                ${isDark
                  ? 'bg-space-dust/70 border border-stellar-cyan/20'
                  : 'bg-white border border-stellar-blue/10 shadow-md'}
              `}
              style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            >
              <Wrench className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? 'text-stellar-cyan' : 'text-stellar-blue'}`} />
            </div>
            {/* Title & Subtitle */}
            <div>
              <h1
                className="text-lg sm:text-xl font-bold tracking-wider"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                <span className="text-gradient-stellar">OPERAÇÕES</span>
              </h1>
              <p className={`text-xs tracking-wide mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Eficiência e análise operacional
              </p>
            </div>
          </div>
          <StaleDataIndicator
            lastUpdated={lastRefreshed}
            isRefreshing={refreshing}
            onRefresh={() => triggerRefresh({ reason: 'manual' })}
          />
        </div>

        </AnimatedHeader>

        {/* Centralized Date Filter - Single Source of Truth */}
        <AnimatedSection>
          <DateRangeSelector
        value={dateFilter}
        onChange={setDateFilter}
        dateWindow={dateWindow}
        excludeAllTime={true}
        sticky={true}
      />

      {/* Utilization KPI Cards + Revenue Breakdown */}
      <OperationsKPICards 
        businessMetrics={businessMetrics} 
        operationsMetrics={operationsMetrics}
        previousWeekMetrics={previousWeekMetrics}
        dateWindow={dateFilter}
      />

      {/* Section 1: Machine Performance (Most Actionable) */}
      <section id="maquinas-section" className="mb-6">
        <MachinePerformanceTable
          machinePerformance={operationsMetrics.machinePerformance}
          dateFilter={dateFilter}
          dateWindow={dateWindow}
          revenueBreakdown={operationsMetrics.revenueBreakdown}
        />
      </section>

      {/* Section 2: Utilization Heatmap */}
      <section id="heatmap-section" className="mb-6">
        <UtilizationHeatmap
          salesData={data.sales}
          dateFilter={dateFilter}
          dateWindow={dateWindow}
        />
      </section>

      {/* Section 3: Time Patterns */}
      <section id="padroes-section">
        <div className="grid grid-cols-12 gap-4 sm:gap-6">
          <div className="col-span-12 lg:col-span-6">
            <PeakHoursSummary
              peakHours={operationsMetrics.peakHoursGrid}
              dateWindow={dateWindow}
            />
          </div>
          <div className="col-span-12 lg:col-span-6">
            <Suspense fallback={<ChartLoadingFallback height="h-80" />}>
              <LazyDayOfWeekChart
                dayPatterns={operationsMetrics.dayPatterns}
                dateFilter={dateFilter}
                dateWindow={dateWindow}
              />
            </Suspense>
          </div>
        </div>
        </section>
        </AnimatedSection>
      </AnimatedView>
    </PullToRefreshWrapper>
  );
};

export default Operations;
