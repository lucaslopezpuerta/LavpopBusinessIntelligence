// Dashboard.jsx v7.1 - TAILWIND MIGRATION
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
import { processBusinessMetrics } from '../utils/businessMetrics';
import { processCustomerMetrics } from '../utils/customerMetrics';

const Dashboard = () => {
  const [salesData, setSalesData] = useState([]);
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
      const response = await fetch('/data/vendas.csv');
      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setSalesData(results.data);
          setLastUpdated(new Date());
          setLoading(false);
        },
        error: (error) => {
          console.error('Erro ao carregar CSV:', error);
          setLoading(false);
        }
      });
    } catch (error) {
      console.error('Erro ao buscar arquivo:', error);
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

    const business = processBusinessMetrics(salesData);
    const customers = processCustomerMetrics(salesData);

    return { business, customers };
  }, [salesData]);

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
      {/* HEADER BAND */}
      <div className="bg-gradient-to-r from-slate-900 to-lavpop-blue shadow-lg">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">

            {/* Left: Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                <span className="text-xl font-bold text-white tracking-tight">
                  LAVPOP<span className="text-lavpop-green">BI</span>
                </span>
              </div>
              <div className="hidden md:block h-8 w-px bg-white/20"></div>
              <div className="hidden md:flex flex-col">
                <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
                  Business Intelligence
                </span>
                <span className="text-sm font-semibold text-white">
                  Dashboard Executivo
                </span>
              </div>
            </div>

            {/* Center: Widgets (Desktop) */}
            <div className="hidden xl:flex items-center gap-4">
              <WeatherWidget />
              <div className="h-6 w-px bg-white/20"></div>
              <GoogleBusinessWidget />
              <div className="h-6 w-px bg-white/20"></div>
              <SocialMediaWidget />
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="bg-white/10 rounded-lg p-1 flex items-center backdrop-blur-sm">
                <button
                  onClick={() => setViewMode('complete')}
                  className={`
                    px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200
                    ${viewMode === 'complete'
                      ? 'bg-white text-lavpop-blue shadow-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/5'}
                  `}
                >
                  Visão Geral
                </button>
                <button
                  onClick={() => setViewMode('current')}
                  className={`
                    px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1.5
                    ${viewMode === 'current'
                      ? 'bg-white text-lavpop-blue shadow-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/5'}
                  `}
                >
                  <Calendar className="w-3 h-3" />
                  Semana Atual
                </button>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors backdrop-blur-sm"
                title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Refresh Button */}
              <button
                onClick={loadData}
                className="p-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors backdrop-blur-sm"
                title="Atualizar Dados"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE WIDGETS (Visible only on small screens) */}
      <div className="xl:hidden bg-slate-800 border-b border-slate-700/50">
        <div className="max-w-[1920px] mx-auto px-4 py-3 flex flex-wrap gap-3 justify-center">
          <WeatherWidget />
          <GoogleBusinessWidget />
          <SocialMediaWidget />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

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
          Lavpop BI v7.1
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
