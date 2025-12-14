// OPERATIONS TAB V5.5.0 - CATEGORICAL SECTION HEADERS
// ✅ Centralized week-based date filtering
// ✅ Explicit date ranges in UI
// ✅ Single source of truth for all components
// ✅ Tailwind CSS styling (Design System v3.0)
// ✅ Dark mode support
// ✅ Responsive grid layout
// ✅ Actionability-first component order
// ✅ Operations-optimized date options (no allTime)
// ✅ Consistent header matching all views
// ✅ Sticky date control matching Dashboard
// ✅ Section headers with icons (Design System v3.1)
// ✅ Category-level naming for future expansion
//
// CHANGELOG:
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
import { Wrench, Gauge, Grid3X3, Clock } from 'lucide-react';
import OperationsKPICards from '../components/OperationsKPICards';
import UtilizationHeatmap from '../components/UtilizationHeatmap';
import PeakHoursSummary from '../components/PeakHoursSummary';
import MachinePerformanceTable from '../components/MachinePerformanceTable';
import DateRangeSelector from '../components/DateRangeSelector';
import { LazyDayOfWeekChart, ChartLoadingFallback } from '../utils/lazyCharts';
import { calculateBusinessMetrics } from '../utils/businessMetrics';
import { calculateOperationsMetrics } from '../utils/operationsMetrics';
import { getDateWindows } from '../utils/dateWindows';

const Operations = ({ data }) => {
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

  if (!businessMetrics || !operationsMetrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-base text-slate-600 dark:text-slate-400">
          Loading operations metrics...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[100rem] mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:p-8">
      {/* Header */}
      <header className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center border-l-4 border-amber-500">
          <Wrench className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Operações
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Eficiência e análise operacional
          </p>
        </div>
      </header>

      {/* Centralized Date Filter - Single Source of Truth */}
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
      <section id="maquinas-section" aria-labelledby="maquinas-heading" className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center border-l-4 border-amber-500">
            <Gauge className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 id="maquinas-heading" className="text-base font-bold text-slate-900 dark:text-white">
              Equipamentos
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Análise de máquinas e equipamentos
            </p>
          </div>
        </div>
        <MachinePerformanceTable
          machinePerformance={operationsMetrics.machinePerformance}
          dateFilter={dateFilter}
          dateWindow={dateWindow}
          revenueBreakdown={operationsMetrics.revenueBreakdown}
        />
      </section>

      {/* Section 2: Utilization Heatmap */}
      <section id="heatmap-section" aria-labelledby="heatmap-heading" className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center border-l-4 border-amber-500">
            <Grid3X3 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 id="heatmap-heading" className="text-base font-bold text-slate-900 dark:text-white">
              Utilização
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ocupação e eficiência operacional
            </p>
          </div>
        </div>
        <UtilizationHeatmap
          salesData={data.sales}
          dateFilter={dateFilter}
          dateWindow={dateWindow}
        />
      </section>

      {/* Section 3: Time Patterns */}
      <section id="padroes-section" aria-labelledby="padroes-heading">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center border-l-4 border-amber-500">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 id="padroes-heading" className="text-base font-bold text-slate-900 dark:text-white">
              Padrões Temporais
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Horários de pico e distribuição semanal
            </p>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-4 sm:gap-6">
          <div className="col-span-12 lg:col-span-6">
            <PeakHoursSummary
              peakHours={operationsMetrics.peakHours}
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
    </div>
  );
};

export default Operations;
