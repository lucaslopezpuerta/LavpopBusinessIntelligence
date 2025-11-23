// Dashboard.jsx v8.5 - FIXED LAYOUT & METRICS
// ✅ Integrated WeatherWidget_API
// ✅ Optimized layout spacing
// ✅ Fixed operations metrics calculation
// ✅ Fixed AtRiskCustomersTable props
import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import KPICards from '../components/KPICards';
import OperatingCyclesChart from '../components/OperatingCyclesChart';
import AtRiskCustomersTable from '../components/AtRiskCustomersTable';
import QuickActionsCard from '../components/QuickActionsCard';
import DashboardDateControl from '../components/DashboardDateControl';
import { calculateBusinessMetrics } from '../utils/businessMetrics';
import { calculateCustomerMetrics } from '../utils/customerMetrics';
import { calculateOperationsMetrics } from '../utils/operationsMetrics';

const Dashboard = ({ viewMode, setViewMode, ...props }) => {
  const [salesData, setSalesData] = useState([]);
  const [rfmData, setRfmData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [salesRes, rfmRes] = await Promise.all([
        fetch('/data/sales.csv'),
        fetch('/data/rfm.csv')
      ]);

      if (!salesRes.ok || !rfmRes.ok) {
        throw new Error('Falha ao carregar arquivos de dados');
      }

      const salesText = await salesRes.text();
      const rfmText = await rfmRes.text();

      Papa.parse(salesText, {
        header: true,
        skipEmptyLines: true,
        complete: (salesResults) => {
          Papa.parse(rfmText, {
            header: true,
            skipEmptyLines: true,
            complete: (rfmResults) => {
              setSalesData(salesResults.data);
              setRfmData(rfmResults.data);
              setLastUpdated(new Date());
              setLoading(false);
            },
            error: (err) => console.error('Erro parsing RFM:', err)
          });
        },
        error: (err) => console.error('Erro parsing Sales:', err)
      });
    } catch (error) {
      console.error('Erro ao buscar arquivos:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const metrics = useMemo(() => {
    if (!salesData.length) return null;
    const business = calculateBusinessMetrics(salesData);
    const customers = calculateCustomerMetrics(salesData, rfmData);
    const operations = calculateOperationsMetrics(salesData);
    return { business, customers, operations };
  }, [salesData, rfmData]);

  // Handle tab navigation from drill-downs
  const handleTabChange = (tabId) => {
    if (props.onNavigate) {
      props.onNavigate(tabId);
    }
  };

  if (loading && !salesData.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-lavpop-blue border-t-transparent rounded-full animate-spin" />
          <div className="text-slate-500 dark:text-slate-400 font-medium">
            Carregando dados...
          </div>
        </div>
      </div>
    );
  }

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

      {/* KPI Cards Section */}
      <div className="w-full">
        <KPICards
          businessMetrics={businessMetrics}
          customerMetrics={customerMetrics}
          salesData={salesData}
          viewMode={viewMode}
          onNavigate={handleTabChange}
        />
      </div>

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
        Última atualização: {lastUpdated ? lastUpdated.toLocaleTimeString() : '-'} • Lavpop BI v8.5
      </div>
    </div>
  );
};

export default Dashboard;
