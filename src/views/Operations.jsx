// OPERATIONS TAB V3.1.1
// ✅ Centralized week-based date filtering
// ✅ Explicit date ranges in UI
// ✅ Single source of truth for all components
//
// CHANGELOG:
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
    if (!data?.sales) {
      console.log('No sales data for operations');
      return null;
    }
    console.log('Calculating business metrics for operations, sales rows:', data.sales.length);
    try {
      const result = calculateBusinessMetrics(data.sales);
      console.log('✅ Business metrics (TIME-BASED UTIL):', result);
      return result;
    } catch (err) {
      console.error('Business metrics error:', err);
      return null;
    }
  }, [data?.sales]);

  const operationsMetrics = useMemo(() => {
    if (!data?.sales) {
      console.log('No sales data for operations metrics');
      return null;
    }
    console.log('🔄 RECALCULATING operations metrics, sales rows:', data.sales.length, 'filter:', dateFilter);
    console.log('📅 Date window:', {
      start: dateWindow.start.toLocaleDateString('pt-BR'),
      end: dateWindow.end.toLocaleDateString('pt-BR'),
      label: dateWindow.label
    });
    try {
      const result = calculateOperationsMetrics(data.sales, dateFilter);
      console.log('✅ Operations metrics (v3.2):', {
        period: result.period,
        machineCount: result.machinePerformance?.length,
        revenueBreakdown: result.revenueBreakdown
      });
      return result;
    } catch (err) {
      console.error('❌ Operations metrics error:', err);
      return null;
    }
  }, [data?.sales, dateFilter, dateWindow]);

  // Calculate previous period metrics for comparison
  const previousWeekMetrics = useMemo(() => {
    if (!data?.sales || dateFilter === 'allTime') {
      return null; // No previous period for all-time view
    }
    
    // Determine which previous period to compare against
    let comparisonFilter;
    switch(dateFilter) {
      case 'currentWeek':
        comparisonFilter = 'lastWeek'; // Compare current week to last week
        break;
      case 'lastWeek':
        comparisonFilter = 'twoWeeksAgo'; // Compare last week to week before
        break;
      case 'last4Weeks':
        comparisonFilter = 'previous4Weeks'; // Compare last 4 weeks to previous 4 weeks
        break;
      default:
        return null;
    }
    
    try {
      console.log(`📊 Calculating comparison period: ${comparisonFilter} for dateFilter: ${dateFilter}`);
      const result = calculateOperationsMetrics(data.sales, comparisonFilter);
      return result;
    } catch (err) {
      console.error('❌ Previous period metrics error:', err);
      return null;
    }
  }, [data?.sales, dateFilter]);

  if (!businessMetrics || !operationsMetrics) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px'
      }}>
        <div style={{ color: '#6b7280', fontSize: '16px' }}>
          Loading operations metrics...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#10306B',
          marginBottom: '0.5rem'
        }}>
          Operações
        </h1>
        <p style={{ fontSize: '15px', color: '#6b7280' }}>
          Eficiência das Máquinas e Análise Operacional
        </p>
      </div>

      {/* Centralized Date Filter - Single Source of Truth */}
      <div style={{ marginBottom: '2rem' }}>
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
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '1.5rem'
      }}>
        {/* Full Width: Utilization Heatmap */}
        <div style={{ gridColumn: '1 / -1' }}>
          <UtilizationHeatmap 
            salesData={data.sales} 
            dateFilter={dateFilter}
            dateWindow={dateWindow}
          />
        </div>

        {/* Row 2: Peak Hours Summary (Full Width) */}
        <div style={{ gridColumn: '1 / -1' }}>
          <PeakHoursSummary 
            peakHours={operationsMetrics.peakHours}
            dateWindow={dateWindow}
          />
        </div>

        {/* Row 3: Wash vs Dry Chart + Day of Week Chart */}
        <div style={{ gridColumn: 'span 6' }}>
          <WashVsDryChart 
            washVsDry={operationsMetrics.washVsDry}
            dateWindow={dateWindow}
          />
        </div>
        <div style={{ gridColumn: 'span 6' }}>
          <DayOfWeekChart 
            dayPatterns={operationsMetrics.dayPatterns}
            dateFilter={dateFilter}
            dateWindow={dateWindow}
          />
        </div>

        {/* Row 4: Machine Performance Table (Full Width) */}
        <div style={{ gridColumn: '1 / -1' }}>
          <MachinePerformanceTable 
            machinePerformance={operationsMetrics.machinePerformance}
            dateFilter={dateFilter}
            dateWindow={dateWindow}
            revenueBreakdown={operationsMetrics.revenueBreakdown}
          />
        </div>
      </div>

      {/* Mobile Responsive Override */}
      <style jsx>{`
        @media (max-width: 1023px) {
          div[style*="gridColumn"] {
            grid-column: 1 / -1 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Operations;
