import React, { useMemo } from 'react';
import KPICards from '../components/KPICards_v2.0';
import RevenueTrendChart from '../components/RevenueTrendChart_v1.0';
import AtRiskCustomersTable from '../components/AtRiskCustomersTable_v1.0';
import TopPerformersSegment from '../components/TopPerformersSegment_v1.0';
import NewClientsChart from '../components/NewClientsChart_v1.0';
import WeeklyPerformanceSummary from '../components/WeeklyPerformanceSummary_v1.0';
import UtilizationHeatmap from '../components/UtilizationHeatmap_v1.0';
import CustomerRetentionScore from '../components/CustomerRetentionScore_v1.0';
import ServiceMixIndicator from '../components/ServiceMixIndicator_v1.0';
import QuickActionsPanel from '../components/QuickActionsPanel_v1.0';
import { calculateBusinessMetrics } from '../utils/businessMetrics';
import { calculateCustomerMetrics } from '../utils/customerMetrics';

const Dashboard = ({ data, onNavigate }) => {
  // Calculate business metrics (revenue, utilization, services)
  const businessMetrics = useMemo(() => {
    if (!data?.sales) {
      console.log('No sales data');
      return null;
    }
    console.log('Calculating business metrics, sales rows:', data.sales.length);
    try {
      const result = calculateBusinessMetrics(data.sales);
      console.log('Business metrics result:', result);
      return result;
    } catch (err) {
      console.error('Business metrics error:', err);
      return null;
    }
  }, [data?.sales]);

  // Calculate customer metrics (V2.1 risk logic)
  const customerMetrics = useMemo(() => {
    if (!data?.sales || !data?.rfm) return null;
    return calculateCustomerMetrics(data.sales, data.rfm);
  }, [data?.sales, data?.rfm]);

  const handleQuickAction = (actionId) => {
    switch(actionId) {
      case 'view-customers':
        onNavigate && onNavigate('customers');
        break;
      case 'analytics':
        onNavigate && onNavigate('analytics');
        break;
      case 'operations':
        onNavigate && onNavigate('operations');
        break;
      default:
        console.log('Action:', actionId);
    }
  };

  if (!businessMetrics || !customerMetrics) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px'
      }}>
        <div style={{ color: '#6b7280', fontSize: '16px' }}>
          Loading dashboard metrics...
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
          Dashboard
        </h1>
        <p style={{ fontSize: '15px', color: '#6b7280' }}>
          Week of {businessMetrics.windows.weekly.startDate} - {businessMetrics.windows.weekly.endDate}
        </p>
      </div>

      {/* KPI Cards Row */}
      <div style={{ marginBottom: '1.5rem' }}>
        <KPICards 
          businessMetrics={businessMetrics}
          customerMetrics={customerMetrics}
        />
      </div>

      {/* Dashboard Grid Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '1.5rem'
      }}>
        {/* Full Width: Revenue Trend Chart */}
        <div style={{ gridColumn: '1 / -1' }}>
          <RevenueTrendChart salesData={data.sales} />
        </div>

        {/* Row 2: Weekly Performance + Quick Actions */}
        <div style={{ gridColumn: 'span 6' }}>
          <WeeklyPerformanceSummary businessMetrics={businessMetrics} />
        </div>
        <div style={{ gridColumn: 'span 6' }}>
          <QuickActionsPanel onAction={handleQuickAction} />
        </div>

        {/* Row 3: At-Risk Customers + New Clients */}
        <div style={{ gridColumn: 'span 7' }}>
          <AtRiskCustomersTable customerMetrics={customerMetrics} />
        </div>
        <div style={{ gridColumn: 'span 5' }}>
          <NewClientsChart salesData={data.sales} />
        </div>

        {/* Row 4: Top Performers by Segment (Full Width) */}
        <div style={{ gridColumn: '1 / -1' }}>
          <TopPerformersSegment customerMetrics={customerMetrics} />
        </div>

        {/* Row 5: Utilization Heatmap (Full Width) */}
        <div style={{ gridColumn: '1 / -1' }}>
          <UtilizationHeatmap salesData={data.sales} />
        </div>

        {/* Row 6: Retention Score + Service Mix */}
        <div style={{ gridColumn: 'span 6' }}>
          <CustomerRetentionScore salesData={data.sales} />
        </div>
        <div style={{ gridColumn: 'span 6' }}>
          <ServiceMixIndicator businessMetrics={businessMetrics} />
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

export default Dashboard;
