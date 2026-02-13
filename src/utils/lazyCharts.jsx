// lazyCharts.jsx v2.0 - COMPONENT-SPECIFIC FALLBACK SKELETONS
// Cosmic shimmer fallbacks that match actual component layouts
//
// CHANGELOG:
// v2.0 (2026-02-11): Skeleton audit — component-matched fallbacks
//   - ChartLoadingFallback: upgraded to cosmic shimmer (skeleton-cosmic + skeleton-bar-wave)
//   - SectionLoadingFallback: upgraded to cosmic shimmer + Premium Glass styling
//   - NEW: AcquisitionCardFallback, HeatmapFallback, ScatterPlotFallback
//   - NEW: HistogramFallback, CohortTableFallback
//   - NEW: OperatingCyclesChartFallback, DayOfWeekChartFallback
//   - NEW: SectionCardFallback (configurable variant)
// v1.1 (2025-12-22): Fix HMR Fast Refresh warning
// v1.0 (2025-12-14): Initial implementation

// @refresh reset
import React, { Suspense } from 'react';
import lazyRetry from './lazyRetry';

// Chart loading fallback component
export const ChartLoadingFallback = ({ height = 'h-64', className = '' }) => (
  <div className={className}>
    <div className={`${height} flex items-end justify-between gap-2 px-4 bg-slate-100 dark:bg-space-dust/30 rounded-xl`}>
      {[40, 65, 45, 80, 55, 70, 50, 75, 60, 85, 55, 90].map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t skeleton-cosmic skeleton-bar-wave"
          style={{ height: `${h}%`, animationDelay: `${i * 80}ms, 0ms` }}
        />
      ))}
    </div>
  </div>
);

// KPI card skeleton for grid layouts
const KPICardSkeleton = () => (
  <div className="bg-slate-50 dark:bg-space-dust/40 rounded-xl p-3 sm:p-4 border border-slate-200 dark:border-stellar-cyan/5">
    <div className="flex items-start justify-between gap-2 mb-2">
      <div className="w-16 h-3 rounded skeleton-cosmic" />
      <div className="w-6 h-6 rounded skeleton-cosmic" />
    </div>
    <div className="w-20 h-6 rounded skeleton-cosmic mb-1" />
    <div className="w-12 h-3 rounded skeleton-cosmic" />
  </div>
);

// Section loading fallback (for full section components like ProfitabilitySection)
export const SectionLoadingFallback = ({ className = '' }) => (
  <div className={`bg-white/80 dark:bg-space-dust/40 backdrop-blur-xl rounded-2xl ring-1 ring-slate-200/80 dark:ring-white/[0.05] p-4 sm:p-6 lg:p-8 ${className}`}>
    <div className="flex items-center gap-2 mb-4 sm:mb-6">
      <div className="w-10 h-10 rounded-xl skeleton-cosmic" />
      <div className="space-y-1.5">
        <div className="w-32 h-5 rounded skeleton-cosmic" />
        <div className="w-48 h-3 rounded skeleton-cosmic" />
      </div>
    </div>
    <div className="rounded-xl p-4 bg-slate-100 dark:bg-slate-700/50 mb-5 sm:mb-6">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 rounded skeleton-cosmic flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="w-24 h-4 rounded skeleton-cosmic" />
          <div className="w-full h-3 rounded skeleton-cosmic" />
          <div className="w-3/4 h-3 rounded skeleton-cosmic" />
        </div>
      </div>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
      {[...Array(6)].map((_, i) => (
        <KPICardSkeleton key={i} />
      ))}
    </div>
    <ChartLoadingFallback height="h-64 sm:h-80" />
  </div>
);

// AcquisitionCardFallback — matches AcquisitionCard.jsx v2.7 layout
export const AcquisitionCardFallback = () => (
  <div className="bg-white/80 dark:bg-space-dust/40 backdrop-blur-xl rounded-2xl p-4 sm:p-5 ring-1 ring-slate-200/80 dark:ring-white/[0.05]">
    <div className="flex items-start gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl skeleton-cosmic" />
      <div className="flex-1 space-y-2">
        <div className="w-32 h-5 rounded skeleton-cosmic" />
        <div className="w-48 h-3 rounded skeleton-cosmic" />
      </div>
    </div>
    {/* Hero metric + sparkline */}
    <div className="flex items-center gap-4 mb-4">
      <div className="w-20 h-10 rounded skeleton-cosmic" />
      <div className="flex-1 h-12 flex items-end justify-between gap-1">
        {[30, 50, 40, 70, 60, 80, 55].map((h, i) => (
          <div key={i} className="flex-1 rounded-t skeleton-cosmic skeleton-bar-wave" style={{ height: `${h}%`, animationDelay: `${i * 60}ms, 0ms` }} />
        ))}
      </div>
    </div>
    {/* Status pills */}
    <div className="flex gap-2 mb-4">
      <div className="h-6 w-24 rounded-full skeleton-cosmic" />
      <div className="h-6 w-20 rounded-full skeleton-cosmic" />
    </div>
    {/* Chart */}
    <ChartLoadingFallback height="h-[180px]" />
  </div>
);

// HeatmapFallback — matches VisitHeatmap.jsx layout (7x15 grid)
export const HeatmapFallback = () => (
  <div className="bg-white/80 dark:bg-space-dust/40 backdrop-blur-xl rounded-2xl p-4 sm:p-5 ring-1 ring-slate-200/80 dark:ring-white/[0.05]">
    <div className="flex items-start gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl skeleton-cosmic" />
      <div className="flex-1 space-y-2">
        <div className="w-36 h-5 rounded skeleton-cosmic" />
        <div className="w-52 h-3 rounded skeleton-cosmic" />
      </div>
    </div>
    <div className="flex gap-2 mb-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-8 w-20 rounded-lg skeleton-cosmic" />
      ))}
    </div>
    <div className="space-y-0.5">
      <div className="grid gap-0.5" style={{ gridTemplateColumns: '32px repeat(15, 1fr)' }}>
        <div />
        {[...Array(15)].map((_, i) => (
          <div key={i} className="h-4 rounded skeleton-cosmic" />
        ))}
      </div>
      {[...Array(7)].map((_, row) => (
        <div key={row} className="grid gap-0.5" style={{ gridTemplateColumns: '32px repeat(15, 1fr)' }}>
          <div className="h-6 sm:h-8 w-8 rounded skeleton-cosmic" />
          {[...Array(15)].map((_, col) => (
            <div key={col} className="h-6 sm:h-8 flex items-center justify-center">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-lg skeleton-cosmic" />
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

// ScatterPlotFallback — matches RFMScatterPlot.jsx v5.8 layout
export const ScatterPlotFallback = () => (
  <div className="bg-white/80 dark:bg-space-dust/40 backdrop-blur-xl rounded-2xl p-4 sm:p-5 ring-1 ring-slate-200/80 dark:ring-white/[0.05]">
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl skeleton-cosmic" />
        <div className="space-y-1">
          <div className="w-36 h-5 rounded skeleton-cosmic" />
          <div className="w-52 h-3 rounded skeleton-cosmic" />
        </div>
      </div>
      <div className="h-9 w-28 rounded-full skeleton-cosmic" />
    </div>
    {/* Legend */}
    <div className="flex items-center gap-3 mb-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full skeleton-cosmic" />
          <div className="w-14 h-3 rounded skeleton-cosmic" />
        </div>
      ))}
    </div>
    {/* Scatter area */}
    <div className="h-[280px] sm:h-[350px] relative bg-slate-50 dark:bg-space-dust/30 rounded-xl">
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full skeleton-cosmic"
          style={{
            width: `${10 + (i % 3) * 4}px`,
            height: `${10 + (i % 3) * 4}px`,
            left: `${8 + (i * 5.5) % 80}%`,
            top: `${10 + (i * 6) % 75}%`,
          }}
        />
      ))}
    </div>
  </div>
);

// HistogramFallback — matches ChurnHistogram.jsx v4.2 layout
export const HistogramFallback = () => (
  <div className="bg-white/80 dark:bg-space-dust/40 backdrop-blur-xl rounded-2xl p-5 ring-1 ring-slate-200/80 dark:ring-white/[0.05] h-full flex flex-col">
    <div className="flex items-start gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl skeleton-cosmic" />
      <div className="flex-1 space-y-2">
        <div className="w-32 h-5 rounded skeleton-cosmic" />
        <div className="w-48 h-3 rounded skeleton-cosmic" />
      </div>
    </div>
    <div className="h-8 w-48 rounded-lg skeleton-cosmic mb-4" />
    <div className="flex-1 min-h-[250px]">
      <ChartLoadingFallback height="h-full" />
    </div>
  </div>
);

// CohortTableFallback — matches CohortRetentionChart.jsx v1.0 layout
export const CohortTableFallback = () => (
  <div className="bg-white/80 dark:bg-space-dust/40 backdrop-blur-xl rounded-xl p-4 sm:p-5 ring-1 ring-slate-200/80 dark:ring-white/[0.05]">
    <div className="flex items-start gap-3 mb-4">
      <div className="w-9 h-9 rounded-lg skeleton-cosmic" />
      <div className="flex-1 space-y-1.5">
        <div className="w-36 h-5 rounded skeleton-cosmic" />
        <div className="w-52 h-3 rounded skeleton-cosmic" />
      </div>
    </div>
    <div className="overflow-x-auto">
      <div className="min-w-[400px] space-y-1">
        <div className="grid gap-1" style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}>
          <div />
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-4 rounded skeleton-cosmic" />
          ))}
        </div>
        {[7, 6, 5, 4, 3, 2].map((cols, row) => (
          <div key={row} className="grid gap-1" style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}>
            <div className="h-7 w-16 rounded skeleton-cosmic" />
            {[...Array(7)].map((_, col) => (
              <div key={col}>
                {col < cols ? <div className="h-7 rounded skeleton-cosmic" /> : <div className="h-7" />}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// OperatingCyclesChartFallback — matches OperatingCyclesChart.jsx v6.0 layout
export const OperatingCyclesChartFallback = ({ compact = false }) => (
  <div className="bg-white/80 dark:bg-space-dust/40 backdrop-blur-xl rounded-2xl p-4 sm:p-5 ring-1 ring-slate-200/80 dark:ring-white/[0.05]">
    {/* Header + filter controls */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div className="space-y-1">
        <div className="w-40 h-5 rounded skeleton-cosmic" />
        <div className="w-28 h-3 rounded skeleton-cosmic" />
      </div>
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-8 w-16 rounded-lg skeleton-cosmic" />
        ))}
      </div>
    </div>
    {/* Legend */}
    <div className="flex flex-wrap items-center gap-3 mb-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded skeleton-cosmic" />
          <div className="w-14 h-3 rounded skeleton-cosmic" />
        </div>
      ))}
    </div>
    {/* Chart */}
    <ChartLoadingFallback height={compact ? 'h-[280px]' : 'h-[280px] sm:h-[350px] lg:h-[400px]'} />
    {/* Footer stats */}
    <div className="grid grid-cols-3 gap-4 mt-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="text-center space-y-1">
          <div className="w-20 h-6 rounded skeleton-cosmic mx-auto" />
          <div className="w-14 h-3 rounded skeleton-cosmic mx-auto" />
        </div>
      ))}
    </div>
  </div>
);

// DayOfWeekChartFallback — matches DayOfWeekChart.jsx v3.6 layout
export const DayOfWeekChartFallback = () => (
  <div className="bg-white/80 dark:bg-space-dust/40 backdrop-blur-xl rounded-2xl p-5 ring-1 ring-slate-200/80 dark:ring-white/[0.05] h-full flex flex-col">
    <div className="flex items-start gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl skeleton-cosmic" />
      <div className="flex-1 space-y-2">
        <div className="w-52 h-5 rounded skeleton-cosmic" />
        <div className="w-32 h-3 rounded skeleton-cosmic" />
      </div>
    </div>
    <ChartLoadingFallback height="h-56" />
    <div className="grid grid-cols-2 gap-3 mt-4">
      <div className="h-28 rounded-xl skeleton-cosmic" />
      <div className="h-28 rounded-xl skeleton-cosmic" />
    </div>
  </div>
);

// SectionCardFallback — generic section fallback replacing bare spinners
export const SectionCardFallback = () => (
  <div className="bg-white/80 dark:bg-space-dust/40 backdrop-blur-xl rounded-2xl p-5 ring-1 ring-slate-200/80 dark:ring-white/[0.05]">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl skeleton-cosmic" />
      <div className="space-y-1.5">
        <div className="w-36 h-5 rounded skeleton-cosmic" />
        <div className="w-48 h-3 rounded skeleton-cosmic" />
      </div>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      {[...Array(4)].map((_, i) => (
        <KPICardSkeleton key={i} />
      ))}
    </div>
    <ChartLoadingFallback height="h-48" />
  </div>
);

// Generic wrapper for lazy-loaded chart components
export const LazyChartWrapper = ({
  children,
  fallback = <ChartLoadingFallback />,
}) => (
  <Suspense fallback={fallback}>
    {children}
  </Suspense>
);

// ==================== LAZY CHART COMPONENT IMPORTS ====================
// These can be used directly in views with LazyChartWrapper

// Dashboard charts
export const LazyOperatingCyclesChart = lazyRetry(() =>
  import('../components/OperatingCyclesChart')
);

// Customer charts
export const LazyRFMScatterPlot = lazyRetry(() =>
  import('../components/RFMScatterPlot')
);

export const LazyChurnHistogram = lazyRetry(() =>
  import('../components/ChurnHistogram')
);

export const LazyNewClientsChart = lazyRetry(() =>
  import('../components/NewClientsChart')
);

export const LazyVisitHeatmap = lazyRetry(() =>
  import('../components/VisitHeatmap')
);

export const LazyAcquisitionCard = lazyRetry(() =>
  import('../components/AcquisitionCard')
);

// Operations charts
export const LazyDayOfWeekChart = lazyRetry(() =>
  import('../components/DayOfWeekChart')
);

// Intelligence sections (these include charts)
// Note: WeatherImpactSection moved to Weather tab as WeatherImpactAnalytics
export const LazyProfitabilitySection = lazyRetry(() =>
  import('../components/intelligence/ProfitabilitySection')
);

export const LazyGrowthTrendsSection = lazyRetry(() =>
  import('../components/intelligence/GrowthTrendsSection')
);

export const LazyModelHealthDashboard = lazyRetry(() =>
  import('../components/intelligence/ModelHealthDashboard')
);

// Campaign sections
export const LazyCouponEffectiveness = lazyRetry(() =>
  import('../components/campaigns/CouponEffectiveness')
);

// Social media sections
export const LazyInstagramGrowthAnalytics = lazyRetry(() =>
  import('../components/social/InstagramGrowthAnalytics')
);

// Drilldown charts
export const LazyFinancialDrilldown = lazyRetry(() =>
  import('../components/drilldowns/FinancialDrilldown')
);
