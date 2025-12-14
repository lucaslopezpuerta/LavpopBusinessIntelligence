// Intelligence.jsx v3.8.0 - IMPROVED LAYOUT
// Refactored with unified components and Health Score
// Design System v3.1 compliant with dark mode support
//
// CHANGELOG:
// v3.8.0 (2025-12-02): Layout improvements
//   - RevenueForecast now full-width (removed max-w-xl constraint)
//   - Better horizontal space usage on desktop screens
//   - RevenueForecast component redesigned with two-column lg layout
// v3.7.0 (2025-12-02): Removed GoalProgress component
//   - GoalProgress was redundant (ProfitabilitySection has dynamic break-even)
//   - Static goals (from settings) less useful than dynamic break-even
//   - Cleaner layout, less visual clutter
// v3.6.0 (2025-12-02): Weighted projection integration
//   - Imports calculateWeightedProjection from intelligenceCalculations
//   - Calculates weighted projection using sales + weather data
//   - Passes weightedProjection to RevenueForecast component
//   - Enables day-of-week + temperature-adjusted revenue forecasting
// v3.5.0 (2025-12-02): Quick Stats KPI refinements
//   - Moved MoM trend badge to bottom-right (saves vertical space)
//   - Fixed "Ticket Médio" subtitle: shows comparison vs previous month
//   - Differentiated subtitles: no longer duplicate with Ciclos/Dia
// v3.4.0 (2025-12-02): Quick Stats KPI audit fixes
//   - Added MoM trend indicator to "Receita do Mês" (compares daily averages)
//   - Fixed "Mês Anterior" subtitle: shows month name instead of cycles
//   - Added current month name to "Receita do Mês" subtitle
//   - Fixed "Ciclos/Dia" subtitle: shows total cycles context
//   - Fair MoM comparison: daily averages account for partial months
// v3.3.0 (2025-12-02): Consistent layout with other views
//   - Moved SectionNavigation below header (like Customers.jsx)
//   - Removed gradient background wrapper
//   - Using same container pattern as other views (max-w-[1600px])
//   - Removed redundant margin classes (parent space-y handles it)
// v3.2.0 (2025-12-02): Unified header design
//   - Simplified header to match other views
//   - Added icon box with left border accent (emerald)
//   - Removed elaborate badge system
//   - Settings button hidden label on mobile
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

import React, { useState, useMemo, Suspense } from 'react';
import { Settings, Calendar, TrendingUp, Zap, DollarSign, Lightbulb } from 'lucide-react';

// Business logic
import BusinessSettingsModal, { useBusinessSettings } from '../components/BusinessSettingsModal';
import {
  calculateProfitability,
  calculateWeatherImpact,
  calculateComfortWeatherImpact,
  calculateGrowthTrends,
  calculateCampaignROI,
  calculateHealthScore,
  getCurrentMonthMetrics,
  getPreviousMonthMetrics,
  calculateWeightedProjection
} from '../utils/intelligenceCalculations';

// UI components
import KPICard, { KPIGrid } from '../components/ui/KPICard';
import { IntelligenceLoadingSkeleton } from '../components/ui/Skeleton';

// Lazy-loaded section components (contain charts)
import {
  LazyProfitabilitySection,
  LazyWeatherImpactSection,
  LazyGrowthTrendsSection,
  LazyCampaignROISection,
  SectionLoadingFallback
} from '../utils/lazyCharts';

// UX Enhancement components
import RevenueForecast from '../components/intelligence/RevenueForecast';
import SectionNavigation from '../components/intelligence/SectionNavigation';

// ==================== MAIN COMPONENT ====================

const Intelligence = ({ data }) => {
  const [showSettings, setShowSettings] = useState(false);
  const settings = useBusinessSettings();

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

  // Comfort-based weather impact (heat index classification)
  const comfortWeatherImpact = useMemo(() => {
    if (!data?.sales || !data?.weather) return null;
    try {
      return calculateComfortWeatherImpact(data.sales, data.weather);
    } catch (error) {
      console.error('Comfort weather impact calculation error:', error);
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

  // Weighted Projection - Combines day-of-week patterns + temperature correlation
  const weightedProjection = useMemo(() => {
    if (!data?.sales || !data?.weather || !currentMonth) return null;
    try {
      return calculateWeightedProjection(data.sales, data.weather, currentMonth);
    } catch (error) {
      console.error('Weighted projection calculation error:', error);
      return null;
    }
  }, [data?.sales, data?.weather, currentMonth]);

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

  // Month names in Portuguese
  const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Calculate derived metrics for Quick Stats
  const avgTicket = currentMonth && currentMonth.services > 0
    ? currentMonth.revenue / currentMonth.services
    : 0;
  const dailyCycles = currentMonth && currentMonth.daysElapsed > 0
    ? currentMonth.services / currentMonth.daysElapsed
    : 0;

  // Get month names for display
  const now = new Date();
  const currentMonthName = MONTH_NAMES[now.getMonth()];
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthName = MONTH_NAMES[prevMonthDate.getMonth()];
  const daysInPreviousMonth = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0).getDate();

  // Calculate MoM trend based on daily averages (fair comparison for partial month)
  const currentDailyAvg = currentMonth && currentMonth.daysElapsed > 0
    ? currentMonth.revenue / currentMonth.daysElapsed
    : 0;
  const previousDailyAvg = previousMonth && daysInPreviousMonth > 0
    ? previousMonth.revenue / daysInPreviousMonth
    : 0;
  const momTrend = previousDailyAvg > 0
    ? ((currentDailyAvg - previousDailyAvg) / previousDailyAvg) * 100
    : null;

  // Calculate previous month's average ticket for comparison
  const prevAvgTicket = previousMonth && previousMonth.services > 0
    ? previousMonth.revenue / previousMonth.services
    : 0;

  return (
    <>
      <div className="p-3 sm:p-6 max-w-[1600px] mx-auto space-y-6 sm:space-y-8 animate-fade-in">

          {/* Header */}
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center border-l-4 border-emerald-500">
                <Lightbulb className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Inteligência
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Análise estratégica de negócio
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              aria-label="Abrir configurações de negócio"
            >
              <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" aria-hidden="true" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:inline">
                Configurações
              </span>
            </button>
          </header>

          {/* Section Navigation - Sticky */}
          <SectionNavigation />

          {/* Health Score Hero Card */}
          {healthScore && (
            <section aria-labelledby="health-score-heading">
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
                          {score.toFixed(1)}
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
          <section aria-labelledby="quick-stats-heading">
            <h2 id="quick-stats-heading" className="sr-only">Resumo rápido de métricas</h2>
            <KPIGrid columns={4}>
              <KPICard
                label="Receita do Mês"
                value={formatCurrency(currentMonth?.revenue || 0)}
                subtitle={`${currentMonthName} • ${currentMonth?.daysElapsed || 0} dias`}
                trend={momTrend !== null ? { value: momTrend } : undefined}
                trendPosition="bottom-right"
                icon={Calendar}
                color="blue"
              />
              <KPICard
                label="Mês Anterior"
                value={formatCurrency(previousMonth?.revenue || 0)}
                subtitle={previousMonthName}
                icon={TrendingUp}
                color="neutral"
              />
              <KPICard
                label="Ticket Médio"
                value={formatCurrency(avgTicket)}
                subtitle={prevAvgTicket > 0 ? `vs ${formatCurrency(prevAvgTicket)} anterior` : `${currentMonth?.services || 0} ciclos`}
                icon={DollarSign}
                color="revenue"
              />
              <KPICard
                label="Ciclos/Dia"
                value={dailyCycles.toFixed(1)}
                subtitle={`${currentMonth?.services || 0} ciclos total`}
                icon={Zap}
                color="profit"
              />
            </KPIGrid>
          </section>

          {/* Revenue Forecast */}
          <RevenueForecast
            currentMonth={currentMonth}
            weightedProjection={weightedProjection}
            formatCurrency={formatCurrency}
          />

          {/* Section 1: Profitability */}
          <Suspense fallback={<SectionLoadingFallback />}>
            <LazyProfitabilitySection
              profitability={profitability}
              formatCurrency={formatCurrency}
              formatPercent={formatPercent}
            />
          </Suspense>

          {/* Section 2: Weather Impact (Comfort-based) */}
          <Suspense fallback={<SectionLoadingFallback />}>
            <LazyWeatherImpactSection
              weatherImpact={weatherImpact}
              comfortWeatherImpact={comfortWeatherImpact}
              formatCurrency={formatCurrency}
              formatPercent={formatPercent}
            />
          </Suspense>

          {/* Section 3: Growth & Trends */}
          <Suspense fallback={<SectionLoadingFallback />}>
            <LazyGrowthTrendsSection
              growthTrends={growthTrends}
              formatCurrency={formatCurrency}
              formatPercent={formatPercent}
            />
          </Suspense>

          {/* Section 4: Campaign Effectiveness */}
          <Suspense fallback={<SectionLoadingFallback />}>
            <LazyCampaignROISection
              campaignROI={campaignROI}
              formatCurrency={formatCurrency}
              formatPercent={formatPercent}
            />
          </Suspense>

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
