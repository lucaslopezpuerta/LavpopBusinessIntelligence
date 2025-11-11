import React, { useMemo } from 'react';
import KPICards from '../components/KPICards';
import { calculateBusinessMetrics } from '../utils/businessMetrics';
import { calculateCustomerMetrics } from '../utils/customerMetrics';

const Dashboard = ({ data }) => {
  // Calculate business metrics (revenue, utilization, services)
  const businessMetrics = useMemo(() => {
    if (!data?.sales) return null;
    return calculateBusinessMetrics(data.sales);
  }, [data?.sales]);

  // Calculate customer metrics (V2.1 risk logic)
  const customerMetrics = useMemo(() => {
    if (!data?.sales || !data?.rfm) return null;
    return calculateCustomerMetrics(data.sales, data.rfm);
  }, [data?.sales, data?.rfm]);

  if (!businessMetrics || !customerMetrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading metrics...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Week of {businessMetrics.windows.weekly.startDate} - {businessMetrics.windows.weekly.endDate}
        </p>
      </div>

      {/* KPI Cards */}
      <KPICards 
        businessMetrics={businessMetrics}
        customerMetrics={customerMetrics}
      />

      {/* Revenue Trend Chart - Coming Next */}
      {/* Customer Segment Distribution - Coming Next */}
      {/* Risk Alerts Section - Coming Next */}
    </div>
  );
};

export default Dashboard;
