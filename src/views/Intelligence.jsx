// Intelligence.jsx v2.2.0 - Business Intelligence Dashboard
// Refactored with extracted components for better maintainability
// Design System v3.0 compliant with dark mode support
//
// CHANGELOG:
// v2.2.0 (2025-11-30): UX refinements
//   - Removed Period Selector (not relevant for this tab)
//   - Fixed Section Navigation positioning to not overlap app header
// v2.1.0 (2025-11-30): UX Enhancements
//   - Added Revenue Forecast Card with projections
//   - Added Goal Progress tracking
//   - Added Section Navigation for quick jumps
//   - Added skeleton loading states
// v2.0.0 (2025-11-30): Major refactor - Component extraction
// v1.2.0 (2025-11-29): Design System v3.0 - Dark mode & Nivo theme
// v1.0.0 (2025-11-18): Complete redesign with Tailwind + Nivo

import React, { useState, useMemo } from 'react';
import { Settings, Calendar, TrendingUp, Percent, Target } from 'lucide-react';

// Business logic
import BusinessSettingsModal, { useBusinessSettings } from '../components/BusinessSettingsModal';
import { useTheme } from '../contexts/ThemeContext';
import { getLavpopNivoTheme } from '../utils/chartThemes';
import {
  calculateProfitability,
  calculateWeatherImpact,
  calculateGrowthTrends,
  calculateCampaignROI,
  getCurrentMonthMetrics,
  getPreviousMonthMetrics
} from '../utils/intelligenceCalculations';

// UI components
import StatCard from '../components/ui/StatCard';
import { IntelligenceLoadingSkeleton } from '../components/ui/Skeleton';

// Section components
import ProfitabilitySection from '../components/intelligence/ProfitabilitySection';
import WeatherImpactSection from '../components/intelligence/WeatherImpactSection';
import GrowthTrendsSection from '../components/intelligence/GrowthTrendsSection';
import CampaignROISection from '../components/intelligence/CampaignROISection';

// UX Enhancement components
import RevenueForecast from '../components/intelligence/RevenueForecast';
import GoalProgress from '../components/intelligence/GoalProgress';
import SectionNavigation from '../components/intelligence/SectionNavigation';

// ==================== MAIN COMPONENT ====================

const Intelligence = ({ data }) => {
  const [showSettings, setShowSettings] = useState(false);
  const settings = useBusinessSettings();
  const { isDark } = useTheme();
  const nivoTheme = useMemo(() => getLavpopNivoTheme(isDark), [isDark]);

  // Calculate all metrics
  const profitability = useMemo(() => {
    if (!data?.sales || !settings) return null;
    try {
      return calculateProfitability(data.sales, settings);
    } catch (error) {
      console.error('Profitability calculation error:', error);
      return null;
    }
  }, [data?.sales, settings]);

  const weatherImpact = useMemo(() => {
    if (!data?.sales || !data?.weather) return null;
    try {
      return calculateWeatherImpact(data.sales, data.weather);
    } catch (error) {
      console.error('Weather impact calculation error:', error);
      return null;
    }
  }, [data?.sales, data?.weather]);

  const growthTrends = useMemo(() => {
    if (!data?.sales) return null;
    try {
      return calculateGrowthTrends(data.sales);
    } catch (error) {
      console.error('Growth trends calculation error:', error);
      return null;
    }
  }, [data?.sales]);

  const campaignROI = useMemo(() => {
    if (!data?.sales || !data?.campaigns) return null;
    try {
      return calculateCampaignROI(data.sales, data.campaigns);
    } catch (error) {
      console.error('Campaign ROI calculation error:', error);
      return null;
    }
  }, [data?.sales, data?.campaigns]);

  const currentMonth = useMemo(() => {
    if (!data?.sales) return null;
    try {
      return getCurrentMonthMetrics(data.sales);
    } catch (error) {
      console.error('Current month calculation error:', error);
      return null;
    }
  }, [data?.sales]);

  const previousMonth = useMemo(() => {
    if (!data?.sales) return null;
    try {
      return getPreviousMonthMetrics(data.sales);
    } catch (error) {
      console.error('Previous month calculation error:', error);
      return null;
    }
  }, [data?.sales]);

  // Format helpers
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatPercent = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  // Loading state with skeleton
  if (!data || !data.sales) {
    return <IntelligenceLoadingSkeleton />;
  }

  // Calculate MoM growth
  const momGrowth = currentMonth && previousMonth && previousMonth.revenue > 0
    ? ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100
    : 0;
  const isGrowthPositive = momGrowth > 0;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800">
        {/* Section Navigation - Sticky below app header */}
        <SectionNavigation />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">

          {/* Hero Header - Mobile responsive */}
          <header className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                  <span className="px-2.5 sm:px-3 py-1 bg-gradient-to-r from-lavpop-blue to-lavpop-blue-700 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wide rounded-full">
                    Inteligência
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                    Análise Estratégica de Negócio
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                  Business Intelligence
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400 mt-1.5 sm:mt-2 max-w-2xl">
                  Insights acionáveis para tomada de decisão: rentabilidade, impacto climático,
                  tendências de crescimento e efetividade de campanhas.
                </p>
              </div>

              {/* Header Actions */}
              <button
                onClick={() => setShowSettings(true)}
                className="self-start flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                aria-label="Abrir configurações de negócio"
              >
                <Settings className="w-4 h-4 text-gray-600 dark:text-slate-400" aria-hidden="true" />
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  Configurações
                </span>
              </button>
            </div>
          </header>

          {/* Quick Stats Overview - Progressive breakpoints */}
          <section aria-labelledby="quick-stats-heading" className="mb-6 sm:mb-8">
            <h2 id="quick-stats-heading" className="sr-only">Resumo rápido de métricas</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              <StatCard
                label="Mês Atual"
                value={formatCurrency(currentMonth?.revenue || 0)}
                subtitle={`${currentMonth?.services || 0} ciclos em ${currentMonth?.daysElapsed || 0} dias`}
                icon={Calendar}
                color="blue"
              />
              <StatCard
                label="Mês Anterior"
                value={formatCurrency(previousMonth?.revenue || 0)}
                subtitle={`${previousMonth?.services || 0} ciclos no total`}
                icon={TrendingUp}
                color="green"
              />
              <StatCard
                label="Crescimento MoM"
                value={formatPercent(momGrowth)}
                subtitle={isGrowthPositive ? "Acima do mês anterior" : "Abaixo do mês anterior"}
                icon={Percent}
                color={isGrowthPositive ? "green" : "red"}
                trend={{
                  direction: isGrowthPositive ? 'up' : 'down',
                  value: isGrowthPositive ? 'Crescendo' : 'Caindo'
                }}
              />
              <StatCard
                label="Status Operacional"
                value={profitability?.isAboveBreakEven ? "Lucrativo" : "Atenção"}
                subtitle={
                  profitability?.isAboveBreakEven
                    ? `${formatPercent(profitability.breakEvenBuffer)} acima do break-even`
                    : "Abaixo do ponto de equilíbrio"
                }
                icon={Target}
                color={profitability?.isAboveBreakEven ? "green" : "amber"}
              />
            </div>
          </section>

          {/* Revenue Forecast & Goal Progress Row */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <RevenueForecast
              currentMonth={currentMonth}
              previousMonth={previousMonth}
              formatCurrency={formatCurrency}
            />
            <GoalProgress
              currentMonth={currentMonth}
              settings={settings}
              formatCurrency={formatCurrency}
              className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-soft border border-gray-100 dark:border-slate-700"
            />
          </section>

          {/* Section 1: Profitability */}
          <ProfitabilitySection
            profitability={profitability}
            formatCurrency={formatCurrency}
            formatPercent={formatPercent}
            nivoTheme={nivoTheme}
          />

          {/* Section 2: Weather Impact */}
          <WeatherImpactSection
            weatherImpact={weatherImpact}
            formatCurrency={formatCurrency}
            formatPercent={formatPercent}
            nivoTheme={nivoTheme}
          />

          {/* Section 3: Growth & Trends */}
          <GrowthTrendsSection
            growthTrends={growthTrends}
            formatCurrency={formatCurrency}
            formatPercent={formatPercent}
            nivoTheme={nivoTheme}
          />

          {/* Section 4: Campaign Effectiveness */}
          <CampaignROISection
            campaignROI={campaignROI}
            formatCurrency={formatCurrency}
            formatPercent={formatPercent}
          />

        </div>
      </div>

      {/* Settings Modal */}
      <BusinessSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={(newSettings) => {
          console.log('Settings saved:', newSettings);
          // Component will auto-reload with new settings via useBusinessSettings hook
        }}
      />
    </>
  );
};

export default Intelligence;
