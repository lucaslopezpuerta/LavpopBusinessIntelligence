// OPERATIONS TAB V4.1.0
// ✅ Centralized week-based date filtering
// ✅ Explicit date ranges in UI
// ✅ Single source of truth for all components
// ✅ Tailwind CSS styling (Design System v3.0)
// ✅ Dark mode support
// ✅ Responsive grid layout
//
// CHANGELOG:
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

import React, { useMemo, useState } from 'react';
import OperationsKPICards from '../components/OperationsKPICards';
import UtilizationHeatmap from '../components/UtilizationHeatmap';
import PeakHoursSummary from '../components/PeakHoursSummary';
import WashVsDryChart from '../components/WashVsDryChart';
import DayOfWeekChart from '../components/DayOfWeekChart';
import MachinePerformanceTable from '../components/MachinePerformanceTable';
import DateRangeSelector from '../components/DateRangeSelector';
import { calculateBusinessMetrics } from '../utils/businessMetrics';
import { calculateOperationsMetrics } from '../utils/operationsMetrics';
import { getDateWindows } from '../utils/dateWindows';

const Operations = ({ data }) => {
  // Centralized date filter - single source of truth
  const [dateFilter, setDateFilter] = useState('currentWeek');
  
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
    <div className="max-w-[100rem] mx-auto p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Operações
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Eficiência das Máquinas e Análise Operacional
        </p>
      </div>

      {/* Centralized Date Filter - Single Source of Truth */}
      <div className="mb-6">
        <DateRangeSelector
          value={dateFilter}
          onChange={setDateFilter}
          dateWindow={dateWindow}
        />
      </div>

      {/* Utilization KPI Cards + Revenue Breakdown */}
      <OperationsKPICards 
        businessMetrics={businessMetrics} 
        operationsMetrics={operationsMetrics}
        previousWeekMetrics={previousWeekMetrics}
        dateWindow={dateFilter}
      />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Full Width: Utilization Heatmap */}
        <div className="col-span-12">
          <UtilizationHeatmap
            salesData={data.sales}
            dateFilter={dateFilter}
            dateWindow={dateWindow}
          />
        </div>

        {/* Row 2: Peak Hours Summary (Full Width) */}
        <div className="col-span-12">
          <PeakHoursSummary
            peakHours={operationsMetrics.peakHours}
            dateWindow={dateWindow}
          />
        </div>

        {/* Row 3: Wash vs Dry Chart + Day of Week Chart */}
        <div className="col-span-12 lg:col-span-6">
          <WashVsDryChart
            washVsDry={operationsMetrics.washVsDry}
            dateWindow={dateWindow}
          />
        </div>
        <div className="col-span-12 lg:col-span-6">
          <DayOfWeekChart
            dayPatterns={operationsMetrics.dayPatterns}
            dateFilter={dateFilter}
            dateWindow={dateWindow}
          />
        </div>

        {/* Row 4: Machine Performance Table (Full Width) */}
        <div className="col-span-12">
          <MachinePerformanceTable
            machinePerformance={operationsMetrics.machinePerformance}
            dateFilter={dateFilter}
            dateWindow={dateWindow}
            revenueBreakdown={operationsMetrics.revenueBreakdown}
          />
        </div>
      </div>
    </div>
  );
};

export default Operations;
