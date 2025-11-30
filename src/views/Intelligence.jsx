// Intelligence.jsx v3.1.0 - Business Intelligence Dashboard
// Refactored with unified components and Health Score
// Design System v3.1 compliant with dark mode support
//
// CHANGELOG:
// v3.1.0 (2025-11-30): Audit fixes
//   - Removed redundant Quick Stats (MoM, Status) - Health Score covers these
//   - Added Ticket Médio and Ciclos/Dia to Quick Stats (unique metrics)
//   - Section components now show data range context in subtitles
// v3.0.0 (2025-11-30): Major refactor with Design System v3.1
//   - Added Health Score composite metric
//   - Uses unified KPICard component
//   - Fixed accessibility (minimum 12px font)
//   - Improved visual hierarchy
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
import { Settings, Calendar, TrendingUp, Zap, DollarSign } from 'lucide-react';

// Business logic
import BusinessSettingsModal, { useBusinessSettings } from '../components/BusinessSettingsModal';
import { useTheme } from '../contexts/ThemeContext';
import { getLavpopNivoTheme } from '../utils/chartThemes';
import {
  calculateProfitability,
  calculateWeatherImpact,
  calculateGrowthTrends,
  calculateCampaignROI,
  calculateHealthScore,
  getCurrentMonthMetrics,
  getPreviousMonthMetrics
} from '../utils/intelligenceCalculations';

// UI components
import KPICard, { KPIGrid } from '../components/ui/KPICard';
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

  // Health Score - Composite business health metric
  const healthScore = useMemo(() => {
    if (!profitability || !growthTrends || !currentMonth || !previousMonth) return null;
    try {
      return calculateHealthScore(profitability, growthTrends, currentMonth, previousMonth);
    } catch (error) {
      console.error('Health score calculation error:', error);
      return null;
    }
  }, [profitability, growthTrends, currentMonth, previousMonth]);

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

  // Calculate derived metrics for Quick Stats
  const avgTicket = currentMonth && currentMonth.services > 0
    ? currentMonth.revenue / currentMonth.services
    : 0;
  const dailyCycles = currentMonth && currentMonth.daysElapsed > 0
    ? currentMonth.services / currentMonth.daysElapsed
    : 0;

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
                  <span className="px-2.5 sm:px-3 py-1 bg-gradient-to-r from-lavpop-blue to-lavpop-blue-700 text-white text-xs font-bold uppercase tracking-wide rounded-full">
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

          {/* Health Score Hero Card */}
          {healthScore && (
            <section aria-labelledby="health-score-heading" className="mb-6 sm:mb-8">
              <h2 id="health-score-heading" className="sr-only">Saúde do Negócio</h2>
              <div className={`
                p-5 sm:p-6 rounded-2xl border shadow-soft
                ${healthScore.color === 'positive'
                  ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/30 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800'
                  : healthScore.color === 'warning'
                    ? 'bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/30 dark:to-amber-800/20 border-amber-200 dark:border-amber-800'
                    : 'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/30 dark:to-red-800/20 border-red-200 dark:border-red-800'
                }
              `}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  {/* Score Display */}
                  <div className="flex items-center gap-4">
                    <div className={`
                      w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center
                      ${healthScore.color === 'positive'
                        ? 'bg-emerald-500'
                        : healthScore.color === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }
                    `}>
                      <span className="text-2xl sm:text-3xl font-bold text-white">
                        {healthScore.score.toFixed(1)}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-0.5">
                        Health Score
                      </p>
                      <p className={`text-xl sm:text-2xl font-bold ${
                        healthScore.color === 'positive'
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : healthScore.color === 'warning'
                            ? 'text-amber-700 dark:text-amber-300'
                            : 'text-red-700 dark:text-red-300'
                      }`}>
                        {healthScore.status}
                      </p>
                    </div>
                  </div>

                  {/* Description & Suggestion */}
                  <div className="flex-1 sm:border-l sm:border-gray-200 dark:sm:border-slate-600 sm:pl-6">
                    <p className="text-sm text-gray-700 dark:text-slate-300 mb-2">
                      {healthScore.description}
                    </p>
                    {healthScore.suggestions && healthScore.suggestions.length > 0 && (
                      <p className="text-xs text-gray-600 dark:text-slate-400">
                        <span className="font-semibold">Sugestão:</span> {healthScore.suggestions[0].message || healthScore.suggestions[0]}
                      </p>
                    )}
                  </div>

                  {/* Score Breakdown (Desktop) */}
                  <div className="hidden lg:flex gap-3">
                    {healthScore.breakdown && Object.entries(healthScore.breakdown).map(([key, score]) => (
                      <div key={key} className="text-center px-3">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {(score * 10).toFixed(0)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 capitalize">
                          {key === 'profitability' ? 'Lucro' :
                           key === 'growth' ? 'Crescimento' :
                           key === 'breakEven' ? 'Break-even' : 'Momentum'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Quick Stats Overview - Contextual metrics (Health Score handles derived insights) */}
          <section aria-labelledby="quick-stats-heading" className="mb-6 sm:mb-8">
            <h2 id="quick-stats-heading" className="sr-only">Resumo rápido de métricas</h2>
            <KPIGrid columns={4}>
              <KPICard
                label="Receita do Mês"
                value={formatCurrency(currentMonth?.revenue || 0)}
                subtitle={`${currentMonth?.daysElapsed || 0} dias decorridos`}
                icon={Calendar}
                color="blue"
              />
              <KPICard
                label="Mês Anterior"
                value={formatCurrency(previousMonth?.revenue || 0)}
                subtitle={`${previousMonth?.services || 0} ciclos no total`}
                icon={TrendingUp}
                color="neutral"
              />
              <KPICard
                label="Ticket Médio"
                value={formatCurrency(avgTicket)}
                subtitle={`${currentMonth?.services || 0} ciclos este mês`}
                icon={DollarSign}
                color="revenue"
              />
              <KPICard
                label="Ciclos/Dia"
                value={dailyCycles.toFixed(1)}
                subtitle="Média diária atual"
                icon={Zap}
                color="profit"
              />
            </KPIGrid>
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
