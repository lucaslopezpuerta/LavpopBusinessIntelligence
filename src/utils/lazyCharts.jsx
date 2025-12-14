// lazyCharts.jsx v1.0
// Utility for lazy loading chart components
//
// CHANGELOG:
// v1.0 (2025-12-14): Initial implementation
//   - LazyChartWrapper component for Suspense boundaries
//   - ChartLoadingFallback for loading states
//   - Pre-defined lazy imports for all chart components

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

// Section loading fallback (for full section components like ProfitabilitySection)
export const SectionLoadingFallback = ({ className = '' }) => (
  <div
    className={`
      bg-white dark:bg-slate-800
      rounded-2xl shadow-sm
      border border-gray-100 dark:border-slate-700
      p-6
      ${className}
    `}
  >
    {/* Header skeleton */}
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
      <div className="space-y-2">
        <div className="w-32 h-5 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="w-48 h-3 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
      </div>
    </div>
    {/* Chart skeleton */}
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
export const LazyProfitabilitySection = lazy(() =>
  import('../components/intelligence/ProfitabilitySection')
);

export const LazyWeatherImpactSection = lazy(() =>
  import('../components/intelligence/WeatherImpactSection')
);

export const LazyGrowthTrendsSection = lazy(() =>
  import('../components/intelligence/GrowthTrendsSection')
);

export const LazyCampaignROISection = lazy(() =>
  import('../components/intelligence/CampaignROISection')
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
