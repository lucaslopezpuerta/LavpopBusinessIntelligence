// Dashboard.jsx v8.0 - TAILWIND MIGRATION + DARK MODE
// ✅ Full Tailwind CSS with dark mode support
// ✅ Integrated all migrated components
// ✅ Responsive layout with gradient header
// ✅ All math/metrics logic preserved

import React, { useMemo, useState } from 'react';
import KPICards from '../components/KPICards';
import CurrentWeekBanner from '../components/CurrentWeekBanner';
import WeatherWidget from '../components/WeatherWidget_API';
import SocialMediaWidget from '../components/SocialMediaWidget';
import GoogleBusinessWidget from '../components/GoogleBusinessWidget';
import AtRiskCustomersTable from '../components/AtRiskCustomersTable';
import { calculateBusinessMetrics } from '../utils/businessMetrics';
import { calculateCustomerMetrics } from '../utils/customerMetrics';

const Dashboard = ({ data, onNavigate }) => {
  const [viewMode, setViewMode] = useState('complete'); // 'complete' | 'current'

  const businessMetrics = useMemo(() => {
    if (!data?.sales) return null;
    try {
      return calculateBusinessMetrics(data.sales);
    } catch (err) {
      console.error('Business metrics error:', err);
      return null;
    }
  }, [data?.sales]);

  const customerMetrics = useMemo(() => {
    if (!data?.sales || !data?.rfm) return null;
    try {
      return calculateCustomerMetrics(data.sales, data.rfm);
    } catch (err) {
      console.error('Customer metrics error:', err);
      return null;
    }
  }, [data?.sales, data?.rfm]);

  if (!businessMetrics || !customerMetrics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-slate-500 dark:text-slate-400 text-base">
          Carregando dashboard...
        </div>
      </div>
    );
  }

  const getDateRange = () => {
    if (viewMode === 'current' && businessMetrics?.windows?.currentWeek) {
      return {
        start: businessMetrics.windows.currentWeek.startDate,
        end: businessMetrics.windows.currentWeek.endDate,
        label: `Semana Atual (${businessMetrics.windows.currentWeek.daysElapsed} dias)`,
      };
    }

    return {
      start: businessMetrics.windows.weekly?.startDate,
      end: businessMetrics.windows.weekly?.endDate,
      label: 'Última Semana Completa',
    };
  };

  const dateRange = getDateRange();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Header with Gradient */}
      <div className="
        bg-gradient-to-r 
        from-lavpop-blue 
        via-lavpop-blue-700 
        to-lavpop-blue-800 
        dark:from-lavpop-blue-900 
        dark:via-lavpop-blue-800 
        dark:to-lavpop-blue-900 
        px-4 sm:px-6 lg:px-8 
        py-6 
        shadow-lg
      ">
        <div className="max-w-[100rem] mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
                Dashboard Lavpop
              </h1>
              <p className="text-white/80 text-sm">
                Visão geral do negócio
              </p>
            </div>

            {/* Widgets Row */}
            <div className="flex items-center gap-3 flex-wrap">
              <WeatherWidget />
              <GoogleBusinessWidget rating={4.9} reviews={150} />
              <SocialMediaWidget instagramFollowers={1250} facebookFollowers={0} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Current Week Banner */}
        <CurrentWeekBanner
          dateRange={dateRange}
          viewMode={viewMode}
          onToggleView={() => setViewMode(viewMode === 'complete' ? 'current' : 'complete')}
        />

        {/* KPI Cards */}
        <KPICards
          businessMetrics={businessMetrics}
          customerMetrics={customerMetrics}
          salesData={data.sales}
          viewMode={viewMode}
        />

        {/* At-Risk Customers Table */}
        <AtRiskCustomersTable
          customerMetrics={customerMetrics}
          salesData={data.sales}
          maxRows={5}
        />
      </div>
    </div>
  );
};

export default Dashboard;
