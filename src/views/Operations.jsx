import React, { useMemo, useState } from 'react';
import OperationsKPICards from '../components/OperationsKPICards';
import UtilizationHeatmap from '../components/UtilizationHeatmap';
import PeakHoursSummary from '../components/PeakHoursSummary';
import WashVsDryChart from '../components/WashVsDryChart';
import DayOfWeekChart from '../components/DayOfWeekChart';
import MachinePerformanceTable from '../components/MachinePerformanceTable';
import { calculateBusinessMetrics } from '../utils/businessMetrics';
import { calculateOperationsMetrics } from '../utils/operationsMetrics';

const Operations = ({ data }) => {
  // Date filter state for machine performance table
  const [machinePeriod, setMachinePeriod] = useState('currentWeek');

  // Calculate business metrics for utilization KPIs
  const businessMetrics = useMemo(() => {
    if (!data?.sales) {
      console.log('No sales data for operations');
      return null;
    }
    console.log('Calculating business metrics for operations, sales rows:', data.sales.length);
    try {
      const result = calculateBusinessMetrics(data.sales);
      console.log('Business metrics result:', result);
      return result;
    } catch (err) {
      console.error('Business metrics error:', err);
      return null;
    }
  }, [data?.sales]);

  // Calculate operations-specific metrics with date filtering
  const operationsMetrics = useMemo(() => {
    if (!data?.sales) {
      console.log('No sales data for operations metrics');
      return null;
    }
    console.log('🔄 RECALCULATING operations metrics, sales rows:', data.sales.length, 'period:', machinePeriod);
    try {
      const result = calculateOperationsMetrics(data.sales, machinePeriod);
      console.log('✅ Operations metrics calculated:', {
        period: result.period,
        machineCount: result.machinePerformance?.length
      });
      return result;
    } catch (err) {
      console.error('❌ Operations metrics error:', err);
      return null;
    }
  }, [data?.sales, machinePeriod]); // Re-calculate when period changes

  const handlePeriodChange = (newPeriod) => {
    console.log('📅 Period change requested:', machinePeriod, '→', newPeriod);
    setMachinePeriod(newPeriod);
  };

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
          Eficiência das Máquinas - Semana de {businessMetrics.windows.weekly.startDate} a {businessMetrics.windows.weekly.endDate}
        </p>
      </div>

      {/* Utilization KPI Cards */}
      <div style={{ marginBottom: '1.5rem' }}>
        <OperationsKPICards businessMetrics={businessMetrics} />
      </div>

      {/* Main Grid Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '1.5rem'
      }}>
        {/* Full Width: Utilization Heatmap */}
        <div style={{ gridColumn: '1 / -1' }}>
          <UtilizationHeatmap salesData={data.sales} />
        </div>

        {/* Row 2: Peak Hours Summary (Full Width) */}
        <div style={{ gridColumn: '1 / -1' }}>
          <PeakHoursSummary peakHours={operationsMetrics.peakHours} />
        </div>

        {/* Row 3: Wash vs Dry Chart + Day of Week Chart */}
        <div style={{ gridColumn: 'span 6' }}>
          <WashVsDryChart washVsDry={operationsMetrics.washVsDry} />
        </div>
        <div style={{ gridColumn: 'span 6' }}>
          <DayOfWeekChart 
            dayPatterns={operationsMetrics.dayPatterns}
            period={machinePeriod}
            onPeriodChange={handlePeriodChange}
          />
        </div>

        {/* Row 4: Machine Performance Table (Full Width) */}
        <div style={{ gridColumn: '1 / -1' }}>
          <MachinePerformanceTable 
            machinePerformance={operationsMetrics.machinePerformance}
            period={machinePeriod}
            onPeriodChange={handlePeriodChange}
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
