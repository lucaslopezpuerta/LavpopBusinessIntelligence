// Dashboard.jsx v8.3 - HEADER REDESIGN & LAYOUT OPTIMIZATION
// ✅ Integrated date range into header (no more fighting banner)
// ✅ Optimized spacing to minimize scrolling
// ✅ Restored Quick Actions Card
// ✅ Full dark/light theme support
//
// CHANGELOG:
// v8.3 (2025-11-23): Header redesign & layout optimization
// v8.2 (2025-11-21): Operating cycles chart integration

import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { Calendar, CheckCircle2, BarChart3 } from 'lucide-react';

// Components
import KPICards from '../components/KPICards';
import AtRiskCustomersTable from '../components/AtRiskCustomersTable';
import WeatherWidget from '../components/WeatherWidget_API';
import GoogleBusinessWidget from '../components/GoogleBusinessWidget';
import SocialMediaWidget from '../components/SocialMediaWidget';
import OperatingCyclesChart from '../components/OperatingCyclesChart';
import QuickActionsCard from '../components/QuickActionsCard';

// Utils
import { calculateBusinessMetrics } from '../utils/businessMetrics';
import { calculateCustomerMetrics } from '../utils/customerMetrics';

const Dashboard = (props) => {
  const [salesData, setSalesData] = useState([]);
  const [rfmData, setRfmData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [viewMode, setViewMode] = useState('complete');

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
    return { business, customers };
  }, [salesData, rfmData]);

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 pb-8">
      {/* HEADER */}
      <div className="bg-gradient-to-br from-lavpop-blue via-blue-600 to-blue-800 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950 shadow-xl">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-4">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="bg-slate-800/60 dark:bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                <span className="text-xl font-bold text-white tracking-tight">
                  LAVPOP<span className="text-lavpop-green">BI</span>
                </span>
              </div>
              <div className="hidden md:block h-8 w-px bg-white/20"></div>
              <div className="hidden md:flex flex-col">
                <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
                  CAXIAS DO SUL
                </span>
                <span className="text-sm font-semibold text-white">
                  Dashboard Executivo
                </span>
              </div>
            </div>

            {/* Widgets (Desktop) */}
            <div className="hidden xl:flex items-center gap-4">
              <WeatherWidget />
              <div className="h-6 w-px bg-white/20"></div>
              <GoogleBusinessWidget />
              <div className="h-6 w-px bg-white/20"></div>
              <SocialMediaWidget />
            </div>

            {/* Date Range + Toggle */}
            <div className="flex items-center gap-3">
              {/* Desktop Date Range Pill - Hidden on mobile, kept for desktop layout balance if needed, 
                  but we are integrating it below. Let's keep the toggle. */}

              <div className="bg-white/10 rounded-lg p-1 flex items-center backdrop-blur-sm border border-white/10 h-9">
                <button
                  onClick={() => setViewMode('complete')}
                  className={`
                    px-3 h-7 rounded-md text-xs font-semibold 
                    transition-all duration-200 
                    flex items-center gap-1.5
                    ${viewMode === 'complete'
                      ? 'bg-white text-lavpop-blue shadow-md'
                      : 'text-white/70 hover:text-white hover:bg-white/5'}
                  `}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Anterior</span>
                  <span className="sm:hidden">Ant</span>
                </button>
                <button
                  onClick={() => setViewMode('current')}
                  className={`
                    px-3 h-7 rounded-md text-xs font-semibold 
                    transition-all duration-200 
                    flex items-center gap-1.5
                    ${viewMode === 'current'
                      ? 'bg-white text-lavpop-blue shadow-md'
                      : 'text-white/70 hover:text-white hover:bg-white/5'}
                  `}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Atual</span>
                  <span className="sm:hidden">Hoje</span>
                </button>
              </div>
            </div>
          </div>

          {/* Date Range Info Bar - Integrated below main header */}
          {dateRange && (
            <div className="border-t border-white/10 py-2">
              <div className="flex items-center justify-center gap-2 text-white/90 text-xs">
                <Calendar className="w-3.5 h-3.5" />
                <span className="font-medium">
                  {dateRange.start} - {dateRange.end}
                </span>
                <span className="text-white/60">•</span>
                <span className="font-medium">
                  {dateRange.label}
                </span>
                <span className="hidden sm:inline text-white/60">•</span>
                <span className="hidden sm:inline">
                  {viewMode === 'current' ? 'Semana Atual' : 'Semana Anterior'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Widgets */}
      <div className="xl:hidden bg-slate-800 dark:bg-slate-900 border-b border-slate-700/50">
        <div className="max-w-[1920px] mx-auto px-4 py-3 flex flex-wrap gap-3 justify-center">
          <WeatherWidget />
          <GoogleBusinessWidget />
          <SocialMediaWidget />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        {/* KPI Cards */}
        {metrics && (
          <KPICards
            businessMetrics={metrics.business}
            customerMetrics={metrics.customers}
            salesData={salesData}
            viewMode={viewMode}
            onNavigate={props.onNavigate}
          />
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 2xl:grid-cols-[1fr_440px] gap-4">
          {/* Operating Cycles Chart */}
          <OperatingCyclesChart salesData={salesData} />

          {/* Right Column: At-Risk Table + Quick Actions */}
          <div className="space-y-4">
            {/* At-Risk Table */}
            {metrics?.customers && (
              <AtRiskCustomersTable
                customerMetrics={metrics.customers}
                salesData={salesData}
              />
            )}

            {/* Quick Actions Card */}
            <QuickActionsCard
              onRefresh={() => window.location.reload()}
              onExportReport={() => alert('Funcionalidade de exportação em breve!')}
              onSendCampaign={() => alert('Funcionalidade de campanha em breve!')}
              onOpenSettings={() => alert('Configurações em breve!')}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 dark:text-slate-500 mt-8">
          Última atualização: {lastUpdated ? lastUpdated.toLocaleTimeString() : '-'} • Lavpop BI v8.3
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
