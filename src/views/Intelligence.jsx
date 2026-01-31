// Intelligence.jsx v3.21.1 - SECTION SPACING FIX
// Refactored with Priority Matrix, auto-refresh, collapsible sections
// Design System v5.1 compliant - Cosmic Precision
//
// CHANGELOG:
// v3.21.1 (2026-01-29): Section spacing fix
//   - Added space-y-6 to main AnimatedSection for proper card separation
// v3.21.0 (2026-01-29): Mode-aware warning badges
//   - StaleDataIndicator: Soft tinted amber in light mode
//   - StaleDataIndicator: Solid amber in dark mode
// v3.20.2 (2026-01-29): Orange→Yellow color migration (superseded by v3.21.0)
// v3.20.1 (2026-01-29): Amber→Orange color migration
//   - StaleDataIndicator stale state now uses orange-600/orange-500
//   - StaleDataIndicator stale border now uses orange-700/orange-400
// v3.20.0 (2026-01-28): Solid color badges for WCAG AA compliance
//   - StaleDataIndicator stale state now uses solid amber with white text
// v3.19.0 (2026-01-27): Stellar Cascade transitions
//   - Added AnimatedView, AnimatedHeader, AnimatedSection wrappers
//   - Content cascades in layered sequence (~250ms total)
// v3.18.0 (2026-01-17): Cosmic Precision upgrade
//   - Updated StaleDataIndicator: dark:bg-space-dust, dark:border-stellar-cyan/10
//   - Cosmic compliant: Design System v5.0
// v3.17.0 (2026-01-12): Pull-to-refresh wrapper integration
//   - REPLACED: Custom pull-to-refresh with PullToRefreshWrapper component
//   - REMOVED: pullDistance, isPulling, touchStartY state vars
//   - REMOVED: handleTouchStart/Move/End handlers
//   - Consistent pull-to-refresh UX across all views
// v3.16.0 (2026-01-07): Tooltip help icons (Plan Item 1.2)
//   - Added METRIC_TOOLTIPS import from constants
//   - All 4 Quick Stats KPICards now have tooltip prop
// v3.15.0 (2025-12-28): Preloaded dailyRevenue data
//   - CHANGED: Uses preloaded dailyRevenue from app initialization
//   - REMOVED: Separate fetch on mount (now uses data.dailyRevenue)
//   - KEPT: Refresh mechanisms for stale data handling
// v3.14.0 (2025-12-28): Major UX enhancements
//   - REMOVED: Campaign ROI section (deprecated, file deleted)
//   - ADDED: Auto-refresh every 5 minutes + tab visibility refresh
//   - ADDED: Stale data indicator with last updated timestamp
//   - ADDED: Pull-to-refresh for mobile devices
//   - ADDED: Collapsible sections for better navigation
//   - CHANGED: Manutenção KPI → Custo por Ciclo
//   - CHANGED: Best/Worst Month → YoY Growth comparison
// v3.13.1 (2025-12-28): Enhanced context and explanations
//   - ADDED: dataContext prop to PriorityMatrix for date range display
//   - Priority Matrix now shows which month data is based on
// v3.13.0 (2025-12-28): Priority Matrix implementation
//   - REPLACED: Health Score with Priority Matrix (4 dimensions + actions)
//   - ADDED: Service breakdown from daily_revenue Supabase view
//   - ADDED: fetchDailyRevenue async loading with useEffect
//   - ADDED: calculatePriorityMatrix and calculateServiceBreakdown
//   - More actionable insights with specific recommendations
// v3.12.1 (2025-12-23): Fix empty render on navigation
//   - Added check for derived calculations (profitability, growthTrends, currentMonth)
//   - Shows skeleton until ALL required data and calculations are ready
// v3.12.0 (2025-12-23): Removed SectionNavigation
//   - REMOVED: SectionNavigation component (sticky nav bar)
//   - Cleaner layout without redundant navigation
// v3.11.0 (2025-12-20): Weather Impact moved to Weather tab
//   - REMOVED: WeatherImpactSection (now in Weather tab)
//   - REMOVED: weatherImpact and comfortWeatherImpact calculations
//   - Weather analytics now uses Supabase weather data
// v3.10.0 (2025-12-16): Migrated to centralized AppSettings
//   - REMOVED: Local Settings button (now in top bar via AppSettingsModal)
//   - REMOVED: Local BusinessSettingsModal import and render
//   - CHANGED: useBusinessSettings → useAppSettings (from AppSettingsContext)
//   - Settings now persist to Supabase instead of localStorage
// v3.9.0 (2025-12-16): Full-width layout
//   - REMOVED: Redundant padding (now uses App.jsx padding)
//   - REMOVED: max-w-[1600px] constraint for full-width
//   - Consistent with Dashboard.jsx layout pattern
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

import React, { useMemo, useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { Calendar, TrendingUp, Zap, DollarSign, Lightbulb, RefreshCw, Clock } from 'lucide-react';
import { useIsMobile } from '../hooks/useMediaQuery';
import { useTheme } from '../contexts/ThemeContext';

// Business logic
import { useAppSettings } from '../contexts/AppSettingsContext';
import {
  calculateProfitability,
  calculateGrowthTrends,
  getCurrentMonthMetrics,
  getPreviousMonthMetrics,
  calculateWeightedProjection,
  calculateServiceBreakdown,
  calculatePriorityMatrix,
  calculateForecastContingency,
  calculateOptimizationLevers
} from '../utils/intelligenceCalculations';
import { fetchDailyRevenue } from '../utils/supabaseLoader';
import { getBrazilDateParts } from '../utils/dateUtils';

// UI components
import KPICard, { KPIGrid } from '../components/ui/KPICard';
import { METRIC_TOOLTIPS } from '../constants/metricTooltips';
import { IntelligenceLoadingSkeleton } from '../components/ui/Skeleton';
import PullToRefreshWrapper from '../components/ui/PullToRefreshWrapper';
import { AnimatedView, AnimatedHeader, AnimatedSection } from '../components/ui/AnimatedView';

// Lazy-loaded section components (contain charts)
import {
  LazyProfitabilitySection,
  LazyGrowthTrendsSection,
  SectionLoadingFallback
} from '../utils/lazyCharts';

// UX Enhancement components
import RevenueForecast from '../components/intelligence/RevenueForecast';
import PriorityMatrix from '../components/intelligence/PriorityMatrix';

// ==================== STALE DATA INDICATOR ====================

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

const StaleDataIndicator = ({ lastUpdated, isRefreshing, onRefresh, isMobile }) => {
  const [, forceUpdate] = useState(0);

  // Update the "time ago" display every minute
  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!lastUpdated) return null;

  const now = Date.now();
  const elapsed = now - lastUpdated;
  const isStale = elapsed > STALE_THRESHOLD_MS;

  // Format time ago
  const minutes = Math.floor(elapsed / 60000);
  const timeAgo = minutes < 1 ? 'agora' : minutes < 60 ? `${minutes}min` : `${Math.floor(minutes / 60)}h`;

  return (
    <button
      onClick={onRefresh}
      disabled={isRefreshing}
      className={`
        flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
        transition-all duration-200
        ${isStale
          ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500 dark:text-white dark:border-amber-400'
          : 'bg-slate-100 dark:bg-space-dust text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-stellar-cyan/10'
        }
        hover:bg-slate-200 dark:hover:bg-space-nebula
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      title={isRefreshing ? 'Atualizando...' : 'Clique para atualizar'}
    >
      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
      {!isMobile && <Clock className="w-3 h-3" />}
      <span>{isRefreshing ? 'Atualizando...' : timeAgo}</span>
    </button>
  );
};

// ==================== MAIN COMPONENT ====================

const Intelligence = ({ data, onDataChange }) => {
  const { settings } = useAppSettings();
  const isMobile = useIsMobile();
  const { isDark } = useTheme();

  // State for daily revenue data (preloaded from app init, or fetched on demand)
  const [dailyRevenueData, setDailyRevenueData] = useState(data?.dailyRevenue || null);
  const [lastUpdated, setLastUpdated] = useState(data?.dailyRevenue ? Date.now() : null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Collapsible sections state (persists which sections are collapsed)
  const [collapsedSections, setCollapsedSections] = useState({});

  // Toggle handler for collapsible sections
  const handleToggleSection = useCallback((sectionId) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);


  // Fetch daily revenue data
  const loadDailyRevenue = useCallback(async () => {
    try {
      // Get last 60 days to cover current + previous month
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 60);

      const revenueData = await fetchDailyRevenue(startDate, endDate);
      setDailyRevenueData(revenueData);
      setLastUpdated(Date.now());
    } catch (error) {
      console.error('Failed to load daily revenue:', error);
    }
  }, []);

  // Manual refresh handler - parallelized for ~30% faster refresh
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      // Run both refreshes in parallel (independent operations)
      await Promise.all([
        onDataChange?.() || Promise.resolve(),
        loadDailyRevenue()
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, onDataChange, loadDailyRevenue]);


  // Fallback fetch on mount - only if not preloaded
  // (preloaded data is set in state initialization above)
  useEffect(() => {
    if (!data?.dailyRevenue && !dailyRevenueData) {
      loadDailyRevenue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Sync with parent data when it refreshes
  useEffect(() => {
    if (data?.dailyRevenue) {
      setDailyRevenueData(data.dailyRevenue);
      setLastUpdated(Date.now());
    }
  }, [data?.dailyRevenue]);

  // Auto-refresh on tab visibility change (when data is stale)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && lastUpdated) {
        const elapsed = Date.now() - lastUpdated;
        if (elapsed > STALE_THRESHOLD_MS) {
          loadDailyRevenue();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [lastUpdated, loadDailyRevenue]);

  // Auto-refresh every 5 minutes (for monitoring use case)
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastUpdated) {
        const elapsed = Date.now() - lastUpdated;
        if (elapsed > STALE_THRESHOLD_MS) {
          loadDailyRevenue();
        }
      }
    }, STALE_THRESHOLD_MS);

    return () => clearInterval(interval);
  }, [lastUpdated, loadDailyRevenue]);

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

  // Note: Weather impact analysis moved to Weather tab

  const growthTrends = useMemo(() => {
    if (!data?.sales) return null;
    try {
      return calculateGrowthTrends(data.sales);
    } catch (error) {
      console.error('Growth trends calculation error:', error);
      return null;
    }
  }, [data?.sales]);

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

  // Service Breakdown - Wash/Dry/Recarga analysis from daily_revenue view
  const serviceBreakdown = useMemo(() => {
    if (!dailyRevenueData || dailyRevenueData.length === 0) return null;
    try {
      const brazilNow = getBrazilDateParts();
      const currentMonthKey = `${brazilNow.year}-${String(brazilNow.month).padStart(2, '0')}`;
      const prevMonth = brazilNow.month === 1 ? 12 : brazilNow.month - 1;
      const prevYear = brazilNow.month === 1 ? brazilNow.year - 1 : brazilNow.year;
      const previousMonthKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

      return calculateServiceBreakdown(dailyRevenueData, currentMonthKey, previousMonthKey);
    } catch (error) {
      console.error('Service breakdown calculation error:', error);
      return null;
    }
  }, [dailyRevenueData]);

  // Priority Matrix - Replaces Health Score with actionable 4-dimension analysis
  const priorityMatrix = useMemo(() => {
    if (!profitability || !growthTrends || !currentMonth) return null;
    try {
      return calculatePriorityMatrix(
        profitability,
        growthTrends,
        currentMonth,
        previousMonth,
        serviceBreakdown
      );
    } catch (error) {
      console.error('Priority matrix calculation error:', error);
      return null;
    }
  }, [profitability, growthTrends, currentMonth, previousMonth, serviceBreakdown]);

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

  // Forecast Contingency - Year-over-year comparison for recovery planning
  const forecastContingency = useMemo(() => {
    if (!currentMonth || !data?.sales) return null;
    try {
      return calculateForecastContingency(currentMonth, data.sales);
    } catch (error) {
      console.error('Forecast contingency calculation error:', error);
      return null;
    }
  }, [currentMonth, data?.sales]);

  // Optimization Levers - Three ways to improve profitability
  const optimizationLevers = useMemo(() => {
    if (!profitability) return null;
    try {
      return calculateOptimizationLevers(profitability);
    } catch (error) {
      console.error('Optimization levers calculation error:', error);
      return null;
    }
  }, [profitability]);

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

  // Additional check: ensure core calculations succeeded
  // This prevents empty render when settings or derived metrics are unavailable
  if (!profitability || !growthTrends || !currentMonth) {
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
    <PullToRefreshWrapper onRefresh={handleRefresh}>
      <AnimatedView>
        {/* Header - Cosmic Precision Design v2.1 */}
        <AnimatedHeader className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Icon Container - Glassmorphism */}
                <div
                  className={`
                    w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0
                    ${isDark
                      ? 'bg-space-dust/70 border border-stellar-cyan/20'
                      : 'bg-white border border-stellar-blue/10 shadow-md'}
                  `}
                  style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                >
                  <Lightbulb className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? 'text-stellar-cyan' : 'text-stellar-blue'}`} />
                </div>
                {/* Title & Subtitle */}
                <div>
                  <h1
                    className="text-lg sm:text-xl font-bold tracking-wider"
                    style={{ fontFamily: "'Orbitron', sans-serif" }}
                  >
                    <span className="text-gradient-stellar">PLANEJAMENTO</span>
                  </h1>
                  <p className={`text-xs tracking-wide mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Análise estratégica de negócio
                  </p>
                </div>
              </div>

              {/* Stale Data Indicator */}
              <StaleDataIndicator
                lastUpdated={lastUpdated}
                isRefreshing={isRefreshing}
                onRefresh={handleRefresh}
                isMobile={isMobile}
              />
            </div>

        </AnimatedHeader>

        {/* Quick Stats Overview - Moved to top for immediate visibility */}
        <AnimatedSection ariaLabel="Resumo rápido de métricas">
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
                tooltip={METRIC_TOOLTIPS.monthRevenue}
              />
              <KPICard
                label="Mês Anterior"
                value={formatCurrency(previousMonth?.revenue || 0)}
                subtitle={previousMonthName}
                icon={TrendingUp}
                color="neutral"
                tooltip={METRIC_TOOLTIPS.prevMonthRevenue}
              />
              <KPICard
                label="Ticket Médio"
                value={formatCurrency(avgTicket)}
                subtitle={prevAvgTicket > 0 ? `vs ${formatCurrency(prevAvgTicket)} anterior` : `${currentMonth?.services || 0} ciclos`}
                icon={DollarSign}
                color="revenue"
                tooltip={METRIC_TOOLTIPS.avgTicket}
              />
              <KPICard
                label="Ciclos/Dia"
                value={dailyCycles.toFixed(1)}
                subtitle={`${currentMonth?.services || 0} ciclos total`}
                icon={Zap}
                color="profit"
                tooltip={METRIC_TOOLTIPS.cyclesPerDay}
              />
            </KPIGrid>
        </AnimatedSection>

        {/* Priority Matrix - Replaces Health Score with actionable 4-dimension analysis */}
        <AnimatedSection className="space-y-6">
          {priorityMatrix && (
            <PriorityMatrix
              dimensions={priorityMatrix.dimensions}
              priority={priorityMatrix.priority}
              actions={priorityMatrix.actions}
              overallScore={priorityMatrix.overallScore}
              dataContext={priorityMatrix.dataContext}
            />
          )}

          {/* Revenue Forecast */}
          <RevenueForecast
            currentMonth={currentMonth}
            weightedProjection={weightedProjection}
            forecastContingency={forecastContingency}
            formatCurrency={formatCurrency}
          />

          {/* Section 1: Profitability */}
          <Suspense fallback={<SectionLoadingFallback />}>
            <LazyProfitabilitySection
              profitability={profitability}
              optimizationLevers={optimizationLevers}
              formatCurrency={formatCurrency}
              formatPercent={formatPercent}
              collapsible
              isCollapsed={collapsedSections['profitability']}
              onToggle={() => handleToggleSection('profitability')}
            />
          </Suspense>

          {/* Section 2: Growth & Trends */}
          <Suspense fallback={<SectionLoadingFallback />}>
            <LazyGrowthTrendsSection
              growthTrends={growthTrends}
              serviceBreakdown={serviceBreakdown}
              formatCurrency={formatCurrency}
              formatPercent={formatPercent}
              collapsible
              isCollapsed={collapsedSections['growth']}
              onToggle={() => handleToggleSection('growth')}
            />
          </Suspense>
        </AnimatedSection>

      </AnimatedView>
    </PullToRefreshWrapper>
  );
};

export default Intelligence;
