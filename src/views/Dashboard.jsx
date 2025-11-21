// Dashboard.jsx v7.3 - TAILWIND MIGRATION
// ✅ Replaced inline styles with Tailwind classes
// ✅ Added dark mode support
// ✅ Responsive layout integration
// ✅ Preserved all data loading and processing logic
//
// CHANGELOG:
// v7.1 (2025-11-20): Tailwind migration & Dark Mode
// v7.0 (2025-11-19): Full integration

import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { RefreshCw, Moon, Sun, Calendar } from 'lucide-react';

// Components
import KPICards from '../components/KPICards';
import AtRiskCustomersTable from '../components/AtRiskCustomersTable';
import WeatherWidget from '../components/WeatherWidget_API';
import GoogleBusinessWidget from '../components/GoogleBusinessWidget';
import SocialMediaWidget from '../components/SocialMediaWidget';
import CurrentWeekBanner from '../components/CurrentWeekBanner';

// Utils
import { calculateBusinessMetrics } from '../utils/businessMetrics';
import { calculateCustomerMetrics } from '../utils/customerMetrics';

const Dashboard = () => {
  const [salesData, setSalesData] = useState([]);
  const [rfmData, setRfmData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [viewMode, setViewMode] = useState('complete'); // 'complete' or 'current'
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Theme Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Load both Sales and RFM data
      const [salesRes, rfmRes] = await Promise.all([
        fetch('/data/sales.csv'),
        fetch('/data/rfm.csv')
      ]);

      if (!salesRes.ok || !rfmRes.ok) {
        throw new Error('Falha ao carregar arquivos de dados');
      }

      const salesText = await salesRes.text();
      const rfmText = await rfmRes.text();

      // Parse Sales
      Papa.parse(salesText, {
        header: true,
        skipEmptyLines: true,
        complete: (salesResults) => {
          // Parse RFM
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
    const interval = setInterval(loadData, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  const metrics = useMemo(() => {
    if (!salesData.length) return null;

    // ✅ Corrected function calls and arguments
    const business = calculateBusinessMetrics(salesData);
    const customers = calculateCustomerMetrics(salesData, rfmData);

    return { business, customers };
  }, [salesData, rfmData]);

  if (loading && !salesData.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-lavpop-blue animate-spin" />
          <div className="text-slate-500 dark:text-slate-400 font-medium">
            Carregando dados...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 pb-8">
      {/* Header Band - Enhanced Branding */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 sm:h-20 flex items-center justify-between">

          {/* Left: Logo & Title */}
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Logo Container - Resized for Mobile */}
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-lavpop-blue to-lavpop-green rounded-xl opacity-0 group-hover:opacity-20 blur transition duration-500"></div>
              <div className="relative bg-lavpop-blue p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-lavpop transform transition duration-300 group-hover:scale-105">
                <img
                  src="/logo.png"
                  alt="Lavpop"
                  className="h-6 sm:h-8 w-auto object-contain brightness-0 invert"
                />
              </div>
            </div>

            {/* Title - Hidden on very small screens */}
            <div className="hidden xs:block">
              <h1 className="text-lg sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight leading-none">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-lavpop-blue to-blue-600 dark:from-blue-400 dark:to-blue-200">
                  LAVPOP
                </span>
                <span className="text-lavpop-green dark:text-green-400 ml-0.5">BI</span>
              </h1>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <TrendingUp className="w-3 h-3 text-lavpop-green" />
                Intelligence Dashboard
              </div>
            </div>
          </div>

          {/* Right: Controls & Toggles */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* View Toggle - Mobile Optimized */}
            <div className="bg-slate-100 dark:bg-slate-700/50 rounded-lg sm:rounded-xl p-1 flex items-center border border-slate-200 dark:border-slate-600">
              <button
                onClick={() => setViewMode('complete')}
                className={`
                    px-2 sm:px-3 py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-200 flex items-center gap-1.5
                    ${viewMode === 'complete'
                    ? 'bg-white dark:bg-slate-600 text-lavpop-blue dark:text-white shadow-sm scale-105'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-600/50'}
                  `}
              >
                <span className="hidden sm:inline">Última Semana Completa</span>
                <span className="sm:hidden">Última</span>
              </button>
              <button
                onClick={() => setViewMode('current')}
                className={`
                    px-2 sm:px-3 py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-200 flex items-center gap-1.5
                    ${viewMode === 'current'
                    ? 'bg-white dark:bg-slate-600 text-lavpop-blue dark:text-white shadow-sm scale-105'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-600/50'}
                  `}
              >
                <Calendar className="w-3 h-3" />
                <span className="hidden sm:inline">Semana Atual</span>
                <span className="sm:hidden">Atual</span>
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600"
              aria-label="Alternar tema"
            >
              {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 pb-8 space-y-4 sm:space-y-6 mt-4 sm:mt-6">

        {/* Mobile Widgets (Collapsible) */}
        <div className="lg:hidden">
          <button
            onClick={() => setShowMobileWidgets(!showMobileWidgets)}
            className="w-full bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm font-bold text-slate-600 dark:text-slate-300"
          >
            <span className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-lavpop-blue" />
              Clima & Redes Sociais
            </span>
            {showMobileWidgets ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showMobileWidgets && (
            <div className="mt-3 grid grid-cols-1 gap-3 animate-in slide-in-from-top-2 duration-200">
              <WeatherWidget />
              <div className="grid grid-cols-2 gap-3">
                <GoogleBusinessWidget />
                <SocialMediaWidget />
              </div>
            </div>
          )}
        </div>

        {/* Desktop Widgets (Visible only on large screens) */}
        <div className="hidden lg:grid grid-cols-3 gap-6">
          <WeatherWidget />
          <GoogleBusinessWidget />
          <SocialMediaWidget />
        </div>

        {/* Current Week Banner (Conditional) */}
        {viewMode === 'current' && metrics?.business && (
          <CurrentWeekBanner businessMetrics={metrics.business} />
        )}

        {/* KPI Cards */}
        {metrics && (
          <KPICards
            businessMetrics={metrics.business}
            customerMetrics={metrics.customers}
            salesData={salesData}
            viewMode={viewMode}
          />
        )}

        {/* Main Grid: Charts & Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: Charts (Placeholder for future migration) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 
              NOTE: Charts are not part of this migration batch but should be placed here.
              For now, we keep the layout structure ready.
            */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm min-h-[400px] flex items-center justify-center text-slate-400">
              Área de Gráficos (Próxima Etapa)
            </div>
          </div>

          {/* Right Column: Tables */}
          <div className="space-y-6">
            {metrics?.customers && (
              <AtRiskCustomersTable
                customerMetrics={metrics.customers}
                salesData={salesData}
              />
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-xs text-slate-400 dark:text-slate-500 mt-8 pb-4">
          Última atualização: {lastUpdated ? lastUpdated.toLocaleTimeString() : '-'} •
          Lavpop BI v7.3
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
