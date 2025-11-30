// Dashboard.jsx v8.6 - NEW KPI LAYOUT
// ✅ Integrated KPICardsGrid with visual hierarchy
// ✅ Hero cards for primary metrics
// ✅ Secondary cards in compact grid
// ✅ Optimized layout spacing
//
// CHANGELOG:
// v8.6 (2025-11-30): KPICardsGrid integration
//   - Replaced KPICards with KPICardsGrid
//   - Cleaner visual hierarchy (3 hero + 6 secondary)
//   - Non-gradient design per Design System audit
// v8.5: Fixed layout & metrics
import React, { useState, useEffect, useMemo } from 'react';
import KPICardsGrid from '../components/KPICardsGrid';
import OperatingCyclesChart from '../components/OperatingCyclesChart';
import AtRiskCustomersTable from '../components/AtRiskCustomersTable';
import QuickActionsCard from '../components/QuickActionsCard';
import DashboardDateControl from '../components/DashboardDateControl';
import { calculateBusinessMetrics } from '../utils/businessMetrics';
import { calculateCustomerMetrics } from '../utils/customerMetrics';
import { calculateOperationsMetrics } from '../utils/operationsMetrics';

const Dashboard = ({ data, viewMode, setViewMode, ...props }) => {
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

  const metrics = useMemo(() => {
    if (!salesData.length) return null;
    const business = calculateBusinessMetrics(salesData);
    const customers = calculateCustomerMetrics(salesData, rfmData, customerData);
    const operations = calculateOperationsMetrics(salesData);
    return { business, customers, operations };
  }, [salesData, rfmData, customerData]);

  // Handle tab navigation from drill-downs
  const handleTabChange = (tabId) => {
    if (props.onNavigate) {
      props.onNavigate(tabId);
    }
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
    <div className="space-y-6">
      {/* Date Control */}
      <DashboardDateControl
        viewMode={viewMode}
        setViewMode={setViewMode}
        dateRange={dateRange}
      />

      {/* KPI Cards Section - Hero + Secondary Grid */}
      <KPICardsGrid
        businessMetrics={businessMetrics}
        customerMetrics={customerMetrics}
        salesData={salesData}
        viewMode={viewMode}
        onNavigate={handleTabChange}
      />

      {/* Charts & Operations Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Operating Cycles (2/3 width) */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="w-full">
            <OperatingCyclesChart salesData={salesData} />
          </div>
        </div>

        {/* Right Column: Table & Quick Actions (1/3 width) */}
        <div className="space-y-6">
          <AtRiskCustomersTable
            customerMetrics={customerMetrics}
            salesData={salesData}
            maxRows={5}
          />
          <QuickActionsCard />
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 dark:text-slate-500 mt-8 pb-4">
        Última atualização: {lastUpdated ? lastUpdated.toLocaleTimeString() : '-'} • Lavpop BI v8.6
      </div>
    </div>
  );
};

export default Dashboard;
