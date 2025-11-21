// Dashboard.jsx v7.2 - BRANDING & UX IMPROVEMENTS
// ✅ Enhanced Lavpop branding with unforgettable presentation
// ✅ Mobile-friendly week toggle button
// ✅ Optimized layout for better space utilization
// ✅ Preserved all data loading and processing logic
//
// CHANGELOG:
// v7.2 (2025-11-21): Branding improvements & mobile UX
// v7.1 (2025-11-20): Tailwind migration & Dark Mode

import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { RefreshCw, Moon, Sun, Calendar, TrendingUp } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* HEADER BAND - Enhanced Branding */}
      <div className="bg-gradient-to-r from-slate-900 via-lavpop-blue to-blue-700 shadow-xl relative overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-lavpop-green rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="h-20 flex items-center justify-between">

            {/* Left: Enhanced Logo & Title */}
            <div className="flex items-center gap-4">
              {/* Logo with glow effect */}
              <div className="relative group">
                <div className="absolute inset-0 bg-lavpop-green/20 rounded-xl blur-xl group-hover:bg-lavpop-green/30 transition-all"></div>
                <div className="relative bg-white/95 dark:bg-white/90 p-3 rounded-xl shadow-lg backdrop-blur-sm transform group-hover:scale-105 transition-transform">
                  <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-lavpop-blue to-blue-600">
                    LAVPOP
                  </span>
                  <span className="text-2xl font-black text-lavpop-green">BI</span>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden md:block h-12 w-px bg-white/20"></div>

              {/* Title & Subtitle */}
              <div className="hidden md:flex flex-col">
                <span className="text-xs font-semibold text-white/70 uppercase tracking-widest">
                  Business Intelligence
                </span>
                <span className="text-base font-bold text-white flex items-center gap-2">
                  Dashboard Executivo
                  <TrendingUp className="w-4 h-4 text-lavpop-green" />
                </span>
              </div>
            </div>

            {/* Center: Widgets (Desktop) */}
            <div className="hidden xl:flex items-center gap-3">
              <WeatherWidget />
              <div className="h-6 w-px bg-white/20"></div>
              <GoogleBusinessWidget />
              <div className="h-6 w-px bg-white/20"></div>
              <SocialMediaWidget />
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-2">
              {/* View Toggle - Mobile Optimized */}
              <div className="bg-white/10 rounded-xl p-1 flex items-center backdrop-blur-sm border border-white/10">
                <button
                  onClick={() => setViewMode('complete')}
                  className={`
                    px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5
                    ${viewMode === 'complete'
                      ? 'bg-white text-lavpop-blue shadow-md scale-105'
                      : 'text-white/70 hover:text-white hover:bg-white/5'}
                  `}
                >
                  <span className="hidden sm:inline">Última Semana Completa</span>
                  <span className="sm:hidden">Última</span>
                </button>
                <button
                  onClick={() => setViewMode('current')}
                  className={`
                    px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5
                    ${viewMode === 'current'
                      ? 'bg-white text-lavpop-blue shadow-md scale-105'
                      : 'text-white/70 hover:text-white hover:bg-white/5'}
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
                className="p-2 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 hover:text-white hover:scale-105 transition-all backdrop-blur-sm border border-white/10"
                title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Refresh Button */}
              <button
                onClick={loadData}
                className="p-2 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 hover:text-white hover:scale-105 transition-all backdrop-blur-sm border border-white/10"
                title="Atualizar Dados"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE WIDGETS (Visible only on small screens) */}
      <div className="xl:hidden bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-900 dark:to-slate-800 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap gap-3 justify-center">
          <WeatherWidget />
          <GoogleBusinessWidget />
          <SocialMediaWidget />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Left Column: Charts (Placeholder for future migration) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm min-h-[400px] flex items-center justify-center text-slate-400">
              Área de Gráficos (Próxima Etapa)
            </div>
          </div>

          {/* Right Column: Tables */}
          <div className="space-y-4">
            {metrics?.customers && (
              <AtRiskCustomersTable
                customerMetrics={metrics.customers}
                salesData={salesData}
              />
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-xs text-slate-400 dark:text-slate-500 pt-4 pb-2">
          Última atualização: {lastUpdated ? lastUpdated.toLocaleTimeString() : '-'} •
          Lavpop BI v7.2
        </div>
      </main>
    </div >
  );
};

export default Dashboard;
