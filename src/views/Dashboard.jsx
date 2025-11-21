// Dashboard.jsx v8.0 - UNIFIED HEADER DESIGN
// ✅ Combined header + banner into single component
// ✅ Design System color integration
// ✅ No horizontal overflow
// ✅ Responsive stacking
// ✅ No logic changes
//
// CHANGELOG:
// v8.0 (2025-11-21): Unified header design

import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { Calendar, CheckCircle2, BarChart3, TrendingUp } from 'lucide-react';

// Components
import KPICards from '../components/KPICards';
import AtRiskCustomersTable from '../components/AtRiskCustomersTable';
import WeatherWidget from '../components/WeatherWidget_API';
import GoogleBusinessWidget from '../components/GoogleBusinessWidget';
import SocialMediaWidget from '../components/SocialMediaWidget';

// Utils
import { calculateBusinessMetrics } from '../utils/businessMetrics';
import { calculateCustomerMetrics } from '../utils/customerMetrics';

const Dashboard = () => {
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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const currentWeek = viewMode === 'current' ? metrics?.business?.currentWeek : null;
  const showBanner = currentWeek && currentWeek.projection;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 pb-8">
      {/* UNIFIED HEADER */}
      <div className="bg-gradient-to-br from-lavpop-blue via-blue-600 to-blue-800 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950 shadow-xl">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Row */}
          <div className="h-16 flex items-center justify-between gap-4 border-b border-white/10">
            {/* Logo & Title */}
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

            {/* Widgets (Desktop) */}
            <div className="hidden xl:flex items-center gap-4">
              <WeatherWidget />
              <div className="h-6 w-px bg-white/20"></div>
              <GoogleBusinessWidget />
              <div className="h-6 w-px bg-white/20"></div>
              <SocialMediaWidget />
            </div>

            {/* View Toggle */}
            <div className="bg-white/10 rounded-xl p-1 flex items-center backdrop-blur-sm border border-white/10">
              <button
                onClick={() => setViewMode('complete')}
                className={`
                  px-3 py-2 sm:px-4 sm:py-2.5
                  rounded-lg text-sm font-semibold 
                  transition-all duration-200 
                  flex items-center gap-2
                  ${viewMode === 'complete'
                    ? 'bg-white text-lavpop-blue shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/5'}
                `}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span className="hidden sm:inline">Última Completa</span>
                <span className="sm:hidden">Última</span>
              </button>
              <button
                onClick={() => setViewMode('current')}
                className={`
                  px-3 py-2 sm:px-4 sm:py-2.5
                  rounded-lg text-sm font-semibold 
                  transition-all duration-200 
                  flex items-center gap-2
                  ${viewMode === 'current'
                    ? 'bg-white text-lavpop-blue shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/5'}
                `}
              >
                <Calendar className="w-4 h-4" />
                <span>Atual</span>
              </button>
            </div>
          </div>

          {/* Bottom Row - Week Stats (only show when "Atual" selected) */}
          {showBanner && (
            <div className="py-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                
                {/* Week Info */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-lavpop-green/20 backdrop-blur-sm flex items-center justify-center border border-lavpop-green/30">
                    <Calendar className="w-5 h-5 text-lavpop-green" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Semana Atual
                    </h3>
                    <p className="text-xs text-white/80">
                      {currentWeek.window.startDate} - {currentWeek.window.endDate} • {currentWeek.window.daysElapsed} dias
                    </p>
                  </div>
                </div>

                {/* Current Stats */}
                <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                  <div>
                    <div className="text-[10px] text-white/60 uppercase tracking-wide font-semibold mb-0.5">
                      Receita
                    </div>
                    <div className="text-2xl font-extrabold text-white">
                      {formatCurrency(currentWeek.netRevenue)}
                    </div>
                  </div>
                  <div className="w-px h-10 bg-white/20 hidden sm:block" />
                  <div>
                    <div className="text-[10px] text-white/60 uppercase tracking-wide font-semibold mb-0.5">
                      Ciclos
                    </div>
                    <div className="text-2xl font-extrabold text-white">
                      {formatNumber(currentWeek.totalServices)}
                    </div>
                  </div>
                  <div className="w-px h-10 bg-white/20 hidden sm:block" />
                  <div>
                    <div className="text-[10px] text-white/60 uppercase tracking-wide font-semibold mb-0.5">
                      Utilização
                    </div>
                    <div className="text-2xl font-extrabold text-white">
                      {Math.round(currentWeek.totalUtilization)}%
                    </div>
                  </div>
                </div>

                {/* Projection */}
                {currentWeek.projection.canProject && (
                  <div className="bg-lavpop-green/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-lavpop-green/30">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-lavpop-green" />
                      <span className="text-[10px] text-white uppercase tracking-wider font-bold">
                        Projeção
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-white">
                        {formatCurrency(currentWeek.projection.projectedRevenue)}
                      </span>
                      <span className={`text-xs font-semibold ${currentWeek.projection.revenueVsLast >= 0 ? 'text-lavpop-green' : 'text-red-300'}`}>
                        {currentWeek.projection.revenueVsLast > 0 ? '+' : ''}{currentWeek.projection.revenueVsLast.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
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
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Cards */}
        {metrics && (
          <KPICards
            businessMetrics={metrics.business}
            customerMetrics={metrics.customers}
            salesData={salesData}
            viewMode={viewMode}
          />
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 2xl:grid-cols-[1fr_440px] gap-6">
          {/* Chart Placeholder */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-lavpop-blue/20 dark:border-lavpop-blue/30 p-8 lg:p-12 shadow-sm min-h-[400px] flex items-center justify-center">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-lavpop-blue/10 to-lavpop-green/10 dark:from-lavpop-blue/20 dark:to-lavpop-green/20 flex items-center justify-center">
                <BarChart3 className="w-10 h-10 text-lavpop-blue dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Gráficos em Desenvolvimento
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Visualizações de tendências em breve
              </p>
            </div>
          </div>

          {/* At-Risk Table */}
          {metrics?.customers && (
            <AtRiskCustomersTable
              customerMetrics={metrics.customers}
              salesData={salesData}
            />
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 dark:text-slate-500 mt-8">
          Última atualização: {lastUpdated ? lastUpdated.toLocaleTimeString() : '-'} • Lavpop BI v8.0
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
