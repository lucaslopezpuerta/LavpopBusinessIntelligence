// lazyCharts.jsx v1.1
// Utility for lazy loading chart components
//
// CHANGELOG:
// v1.1 (2025-12-22): Fix HMR Fast Refresh warning
//   - Added @refresh reset directive for Vite compatibility
//   - This file mixes fallback components with lazy() exports,
//     which is incompatible with Fast Refresh's component detection
// v1.0 (2025-12-14): Initial implementation
//   - LazyChartWrapper component for Suspense boundaries
//   - ChartLoadingFallback for loading states
//   - Pre-defined lazy imports for all chart components

// @refresh reset
import React, { lazy, Suspense } from 'react';

// Chart loading fallback component
export const ChartLoadingFallback = ({ height = 'h-64', className = '' }) => (
  <div className={`${className}`}>
    <div
      className={`${height} flex items-end justify-between gap-2 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl`}
    >
      {[40, 65, 45, 80, 55, 70, 50, 75, 60, 85, 55, 90].map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t animate-pulse bg-slate-200 dark:bg-slate-700"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  </div>
);

// KPI card skeleton for grid layouts
const KPICardSkeleton = () => (
  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 sm:p-4 border border-slate-200 dark:border-slate-700">
    <div className="flex items-start justify-between gap-2 mb-2">
      <div className="w-16 h-3 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
      <div className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
    </div>
    <div className="w-20 h-6 rounded bg-slate-200 dark:bg-slate-700 animate-pulse mb-1" />
    <div className="w-12 h-3 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
  </div>
);

// Section loading fallback (for full section components like ProfitabilitySection)
export const SectionLoadingFallback = ({ className = '', variant = 'default' }) => (
  <div
    className={`
      bg-white dark:bg-slate-800
      rounded-2xl shadow-soft
      border border-slate-200 dark:border-slate-700
      p-4 sm:p-6 lg:p-8
      ${className}
    `}
  >
    {/* Header skeleton - matches SectionCard header */}
    <div className="flex items-center gap-2 mb-4 sm:mb-6">
      <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse border-l-4 border-slate-300 dark:border-slate-600" />
      <div className="space-y-1.5">
        <div className="w-32 h-5 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="w-48 h-3 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
      </div>
    </div>

    {/* InsightBox skeleton */}
    <div className="rounded-xl p-4 bg-slate-100 dark:bg-slate-700/50 mb-5 sm:mb-6">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-600 animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="w-24 h-4 rounded bg-slate-200 dark:bg-slate-600 animate-pulse" />
          <div className="w-full h-3 rounded bg-slate-200 dark:bg-slate-600 animate-pulse" />
          <div className="w-3/4 h-3 rounded bg-slate-200 dark:bg-slate-600 animate-pulse" />
        </div>
      </div>
    </div>

    {/* KPI Grid skeleton - 6 cards like ProfitabilitySection */}
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
      {[...Array(6)].map((_, i) => (
        <KPICardSkeleton key={i} />
      ))}
    </div>

    {/* Chart skeleton with proper height */}
    <ChartLoadingFallback height="h-64 sm:h-80" />
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
export const LazyOperatingCyclesChart = lazy(() =>
  import('../components/OperatingCyclesChart')
);

// Customer charts
export const LazyRFMScatterPlot = lazy(() =>
  import('../components/RFMScatterPlot')
);

export const LazyChurnHistogram = lazy(() =>
  import('../components/ChurnHistogram')
);

export const LazyNewClientsChart = lazy(() =>
  import('../components/NewClientsChart')
);

// Operations charts
export const LazyDayOfWeekChart = lazy(() =>
  import('../components/DayOfWeekChart')
);

// Intelligence sections (these include charts)
// Note: WeatherImpactSection moved to Weather tab as WeatherImpactAnalytics
export const LazyProfitabilitySection = lazy(() =>
  import('../components/intelligence/ProfitabilitySection')
);

export const LazyGrowthTrendsSection = lazy(() =>
  import('../components/intelligence/GrowthTrendsSection')
);

// Drilldown charts
export const LazyFinancialDrilldown = lazy(() =>
  import('../components/drilldowns/FinancialDrilldown')
);

// Other chart components
export const LazyRevenueTrendChart = lazy(() =>
  import('../components/RevenueTrendChart')
);

export const LazyServiceMixIndicator = lazy(() =>
  import('../components/ServiceMixIndicator')
);
