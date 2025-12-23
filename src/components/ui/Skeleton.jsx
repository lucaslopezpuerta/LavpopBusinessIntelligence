// Skeleton.jsx v2.1
// Skeleton loading components for better UX
// Design System v3.2 compliant
//
// CHANGELOG:
// v2.1 (2025-12-23): Full-width layout fixes
//   - WeatherLoadingSkeleton: Restructured to match WeatherSection.jsx v1.6
//     - Row 1: Hero (1/2) + Metrics Grid (1/2)
//     - Row 2-4: Full-width sections (Hourly, Daily, BusinessImpact)
//   - IntelligenceLoadingSkeleton: Matches Intelligence.jsx v3.12.0
//     - Removed max-w-7xl constraint for full-width
//     - Removed Section Navigation (removed from view)
//     - Added Health Score Hero, Revenue Forecast
// v2.0 (2025-12-16): View-specific loading skeletons
//   - DashboardLoadingSkeleton: KPI grid + chart
//   - CustomersLoadingSkeleton: Hero cards + scatter + table/charts
//   - DirectoryLoadingSkeleton: Filter bar + customer cards grid
//   - CampaignsLoadingSkeleton: Section nav + dashboard cards
//   - OperationsLoadingSkeleton: Date filter + KPIs + sections
//   - All skeletons match their respective view layouts
// v1.0 (2025-11-30): Initial implementation
//   - Base Skeleton component
//   - SkeletonCard for stat cards
//   - SkeletonChart for charts
//   - SkeletonText for text lines
//   - Dark mode support

import React from 'react';

// Base skeleton with shimmer animation
const Skeleton = ({ className = '', children }) => (
  <div
    className={`
      animate-pulse bg-gray-200 dark:bg-slate-700
      ${className}
    `}
    aria-hidden="true"
  >
    {children}
  </div>
);

// Text line skeleton
const SkeletonText = ({ width = 'w-full', height = 'h-4', className = '' }) => (
  <Skeleton className={`rounded ${width} ${height} ${className}`} />
);

// Circle skeleton (for avatars, icons)
const SkeletonCircle = ({ size = 'w-10 h-10', className = '' }) => (
  <Skeleton className={`rounded-full ${size} ${className}`} />
);

// Stat card skeleton
const SkeletonCard = ({ className = '' }) => (
  <div
    className={`
      bg-white dark:bg-slate-800
      rounded-xl shadow-soft
      p-4 sm:p-6
      border border-gray-100 dark:border-slate-700
      ${className}
    `}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1 space-y-3">
        <SkeletonText width="w-20" height="h-3" />
        <SkeletonText width="w-32" height="h-8" />
        <SkeletonText width="w-24" height="h-3" />
      </div>
      <SkeletonCircle size="w-12 h-12" className="rounded-lg" />
    </div>
  </div>
);

// Chart skeleton
const SkeletonChart = ({ height = 'h-64', className = '' }) => (
  <div className={`${className}`}>
    <div className="flex items-end justify-between gap-2 px-4" style={{ height }}>
      {[40, 65, 45, 80, 55, 70, 50, 75, 60, 85, 55, 90].map((h, i) => (
        <Skeleton
          key={i}
          className="flex-1 rounded-t"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  </div>
);

// Section skeleton (full section with header)
const SkeletonSection = ({ className = '' }) => (
  <div
    className={`
      bg-white dark:bg-slate-800
      rounded-2xl shadow-soft
      p-4 sm:p-6 lg:p-8
      ${className}
    `}
  >
    {/* Header */}
    <div className="flex items-center gap-3 mb-6">
      <SkeletonCircle size="w-10 h-10" className="rounded-lg" />
      <div className="space-y-2">
        <SkeletonText width="w-40" height="h-6" />
        <SkeletonText width="w-56" height="h-3" />
      </div>
    </div>

    {/* KPI Grid */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg space-y-2">
          <SkeletonText width="w-16" height="h-3" />
          <SkeletonText width="w-24" height="h-7" />
          <SkeletonText width="w-20" height="h-3" />
        </div>
      ))}
    </div>

    {/* Chart */}
    <SkeletonChart height="h-48" />
  </div>
);

// Table row skeleton
const SkeletonTableRow = ({ columns = 5 }) => (
  <tr className="animate-pulse">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <SkeletonText width={i === 0 ? 'w-24' : 'w-16'} height="h-4" />
      </td>
    ))}
  </tr>
);

// Intelligence skeleton - matches Intelligence.jsx full-width layout (v3.12.0)
const IntelligenceLoadingSkeleton = () => (
  <div className="space-y-6 sm:space-y-8 animate-pulse">
    {/* Header */}
    <SkeletonHeader color="green" />

    {/* Health Score Hero Card */}
    <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl" />
          <div className="space-y-2">
            <SkeletonText width="w-24" height="h-3" />
            <SkeletonText width="w-20" height="h-7" />
          </div>
        </div>
        <div className="flex-1 sm:border-l sm:border-slate-200 dark:sm:border-slate-600 sm:pl-6 space-y-2">
          <SkeletonText width="w-full max-w-md" height="h-4" />
          <SkeletonText width="w-3/4 max-w-sm" height="h-3" />
        </div>
      </div>
    </div>

    {/* Quick stats - 4 column KPI grid */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {[1, 2, 3, 4].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </div>

    {/* Revenue Forecast */}
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <SkeletonText width="w-40" height="h-5" />
        <SkeletonText width="w-24" height="h-4" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex justify-between">
              <SkeletonText width="w-28" height="h-4" />
              <SkeletonText width="w-20" height="h-5" />
            </div>
          ))}
        </div>
        <SkeletonChart height="h-40" />
      </div>
    </div>

    {/* Section skeletons */}
    <SkeletonSection />
    <SkeletonSection />
  </div>
);

// ==================== VIEW-SPECIFIC SKELETONS ====================

// Shared header skeleton component (icon box + title + subtitle)
const SkeletonHeader = ({ color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 border-blue-500',
    purple: 'bg-purple-100 dark:bg-purple-900/30 border-purple-500',
    amber: 'bg-amber-100 dark:bg-amber-900/30 border-amber-500',
    green: 'bg-green-100 dark:bg-green-900/30 border-green-500',
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-l-4 ${colorClasses[color]}`}>
        <SkeletonCircle size="w-5 h-5" />
      </div>
      <div className="space-y-1.5">
        <SkeletonText width="w-32" height="h-6" />
        <SkeletonText width="w-48" height="h-3" />
      </div>
    </div>
  );
};

// Hero KPI Card skeleton (larger, with sparkline area)
const SkeletonHeroCard = () => (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-5">
    <div className="flex items-start justify-between mb-3">
      <div className="space-y-2">
        <SkeletonText width="w-24" height="h-4" />
        <SkeletonText width="w-16" height="h-8" />
        <SkeletonText width="w-20" height="h-3" />
      </div>
      <SkeletonCircle size="w-10 h-10" className="rounded-lg" />
    </div>
    {/* Sparkline area */}
    <div className="h-12 mt-2">
      <div className="flex items-end justify-between gap-1 h-full">
        {[30, 50, 40, 70, 60, 80, 55].map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  </div>
);

// Dashboard skeleton - matches Dashboard.jsx layout
const DashboardLoadingSkeleton = () => (
  <div className="space-y-6 sm:space-y-8 animate-pulse">
    {/* Header */}
    <SkeletonHeader color="blue" />

    {/* Date Control */}
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-32 rounded-lg" />
      <Skeleton className="h-10 w-32 rounded-lg" />
      <Skeleton className="h-6 w-40 rounded-lg" />
    </div>

    {/* KPI Cards Grid - 3 hero cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <SkeletonHeroCard key={i} />
      ))}
    </div>

    {/* Secondary KPI cards - 2x3 grid */}
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
          <SkeletonText width="w-16" height="h-3" className="mb-2" />
          <SkeletonText width="w-12" height="h-6" className="mb-1" />
          <SkeletonText width="w-20" height="h-3" />
        </div>
      ))}
    </div>

    {/* Chart section */}
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <SkeletonText width="w-40" height="h-5" />
        <SkeletonText width="w-24" height="h-8" className="rounded-lg" />
      </div>
      <SkeletonChart height="h-80" />
    </div>
  </div>
);

// Customers skeleton - matches Customers.jsx layout
const CustomersLoadingSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    {/* Header with pills */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <SkeletonHeader color="purple" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-32 rounded-full" />
      </div>
    </div>

    {/* Hero KPI Cards - 2 columns */}
    <div className="grid grid-cols-2 gap-4">
      <SkeletonHeroCard />
      <SkeletonHeroCard />
    </div>

    {/* RFM Scatter Plot - Full Width Hero */}
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-1">
          <SkeletonText width="w-48" height="h-5" />
          <SkeletonText width="w-64" height="h-3" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>
      <div className="h-[400px] flex items-center justify-center">
        {/* Scatter plot dots simulation */}
        <div className="relative w-full h-full">
          {[...Array(20)].map((_, i) => (
            <SkeletonCircle
              key={i}
              size="w-3 h-3"
              className="absolute"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
              }}
            />
          ))}
        </div>
      </div>
    </div>

    {/* Table + Charts Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Table skeleton - 3/5 width */}
      <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <SkeletonText width="w-40" height="h-5" className="mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <SkeletonCircle size="w-10 h-10" />
              <div className="flex-1 space-y-2">
                <SkeletonText width="w-32" height="h-4" />
                <SkeletonText width="w-24" height="h-3" />
              </div>
              <SkeletonText width="w-16" height="h-6" />
            </div>
          ))}
        </div>
      </div>

      {/* Charts skeleton - 2/5 width */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <SkeletonText width="w-32" height="h-4" className="mb-3" />
          <SkeletonChart height="h-36" />
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <SkeletonText width="w-32" height="h-4" className="mb-3" />
          <SkeletonChart height="h-36" />
        </div>
      </div>
    </div>
  </div>
);

// Directory skeleton - matches Directory.jsx layout
const DirectoryLoadingSkeleton = () => (
  <div className="space-y-6 sm:space-y-8 animate-pulse">
    {/* Header with stats */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <SkeletonHeader color="blue" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>
    </div>

    {/* Main content card */}
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Filter bar */}
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-10 flex-1 min-w-[200px] max-w-md rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </div>

      {/* Customer cards grid */}
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <SkeletonCircle size="w-12 h-12" />
                <div className="flex-1 space-y-1.5">
                  <SkeletonText width="w-28" height="h-4" />
                  <SkeletonText width="w-20" height="h-3" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <SkeletonText width="w-16" height="h-5" className="rounded-full" />
                <SkeletonText width="w-20" height="h-4" />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                <div>
                  <SkeletonText width="w-12" height="h-3" className="mb-1" />
                  <SkeletonText width="w-16" height="h-4" />
                </div>
                <div>
                  <SkeletonText width="w-12" height="h-3" className="mb-1" />
                  <SkeletonText width="w-14" height="h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <SkeletonText width="w-32" height="h-4" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-8 rounded-lg" />
            ))}
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Campaigns skeleton - matches Campaigns.jsx layout
const CampaignsLoadingSkeleton = () => (
  <div className="space-y-6 sm:space-y-8 animate-pulse">
    {/* Header with button */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <SkeletonHeader color="purple" />
      <Skeleton className="h-10 w-36 rounded-xl" />
    </div>

    {/* Section navigation */}
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} className="h-9 w-28 rounded-lg flex-shrink-0" />
      ))}
    </div>

    {/* Dashboard cards - 4 column grid */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <SkeletonText width="w-20" height="h-3" className="mb-2" />
          <SkeletonText width="w-16" height="h-7" className="mb-1" />
          <SkeletonText width="w-24" height="h-3" />
        </div>
      ))}
    </div>

    {/* Main content area - charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <SkeletonText width="w-40" height="h-5" className="mb-4" />
        <SkeletonChart height="h-64" />
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <SkeletonText width="w-40" height="h-5" className="mb-4" />
        <SkeletonChart height="h-64" />
      </div>
    </div>

    {/* Insights row */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <SkeletonCircle size="w-8 h-8" className="rounded-lg" />
            <div className="flex-1 space-y-2">
              <SkeletonText width="w-24" height="h-4" />
              <SkeletonText width="w-full" height="h-3" />
              <SkeletonText width="w-3/4" height="h-3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Weather skeleton - matches WeatherSection.jsx layout (v1.6)
// Row 1: Hero (1/2) + Metrics (1/2)
// Row 2: HourlyForecast (full width)
// Row 3: DailyForecast (full width)
// Row 4: BusinessImpact (full width)
const WeatherLoadingSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    {/* Header */}
    <div className="space-y-2">
      <SkeletonText width="w-32" height="h-8" />
      <SkeletonText width="w-56" height="h-4" />
    </div>

    {/* Row 1: Hero (1/2) + Metrics Grid (1/2) */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Weather Hero */}
      <Skeleton className="h-48 sm:h-56 rounded-2xl" />

      {/* Metrics Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 h-full">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl space-y-2">
              <SkeletonCircle size="w-8 h-8" className="rounded-lg" />
              <SkeletonText width="w-14" height="h-3" />
              <SkeletonText width="w-10" height="h-5" />
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Row 2: Hourly Forecast - full width */}
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <SkeletonText width="w-36" height="h-5" />
      </div>
      <div className="p-4">
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex-shrink-0 w-16 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl space-y-2">
              <SkeletonText width="w-10" height="h-3" />
              <SkeletonCircle size="w-6 h-6" className="mx-auto" />
              <SkeletonText width="w-8" height="h-4" className="mx-auto" />
            </div>
          ))}
        </div>
        <div className="h-32 mt-4">
          <SkeletonChart height="h-full" />
        </div>
      </div>
    </div>

    {/* Row 3: Daily Forecast - full width */}
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <SkeletonText width="w-32" height="h-5" />
      </div>
      <div className="p-2 space-y-1">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
            <SkeletonText width="w-16" height="h-4" />
            <SkeletonCircle size="w-6 h-6" />
            <SkeletonText width="w-12" height="h-4" />
            <div className="flex-1">
              <Skeleton className="h-1.5 rounded-full" />
            </div>
            <SkeletonText width="w-8" height="h-4" />
          </div>
        ))}
      </div>
    </div>

    {/* Row 4: Business Impact - full width */}
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <SkeletonText width="w-48" height="h-6" className="mb-4" />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl space-y-2">
            <SkeletonText width="w-12" height="h-3" />
            <SkeletonCircle size="w-8 h-8" className="mx-auto" />
            <SkeletonText width="w-14" height="h-4" className="mx-auto" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Operations skeleton - matches Operations.jsx layout
const OperationsLoadingSkeleton = () => (
  <div className="space-y-6 sm:space-y-8 animate-pulse">
    {/* Header */}
    <SkeletonHeader color="amber" />

    {/* Date Range Selector */}
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-8 w-28 rounded-lg" />
      ))}
      <Skeleton className="h-6 w-48 rounded-lg ml-auto" />
    </div>

    {/* KPI Cards - 4 column grid */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </div>

    {/* Section 1: Equipamentos */}
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 border-l-4 border-amber-500 flex items-center justify-center">
          <SkeletonCircle size="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <SkeletonText width="w-28" height="h-4" />
          <SkeletonText width="w-48" height="h-3" />
        </div>
      </div>
      {/* Machine table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonText key={i} width="w-20" height="h-4" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 flex gap-4">
              {[1, 2, 3, 4, 5].map((j) => (
                <SkeletonText key={j} width="w-20" height="h-4" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Section 2: Utilização */}
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 border-l-4 border-amber-500 flex items-center justify-center">
          <SkeletonCircle size="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <SkeletonText width="w-24" height="h-4" />
          <SkeletonText width="w-40" height="h-3" />
        </div>
      </div>
      {/* Heatmap */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="grid grid-cols-8 gap-2">
          {[...Array(56)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded" />
          ))}
        </div>
      </div>
    </section>

    {/* Section 3: Padrões Temporais */}
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 border-l-4 border-amber-500 flex items-center justify-center">
          <SkeletonCircle size="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <SkeletonText width="w-36" height="h-4" />
          <SkeletonText width="w-52" height="h-3" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <SkeletonText width="w-32" height="h-5" className="mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <SkeletonText width="w-20" height="h-4" />
                <SkeletonText width="w-16" height="h-5" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <SkeletonText width="w-32" height="h-5" className="mb-4" />
          <SkeletonChart height="h-64" />
        </div>
      </div>
    </section>
  </div>
);

export {
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  SkeletonCard,
  SkeletonChart,
  SkeletonSection,
  SkeletonTableRow,
  SkeletonHeader,
  SkeletonHeroCard,
  // View-specific skeletons
  IntelligenceLoadingSkeleton,
  DashboardLoadingSkeleton,
  CustomersLoadingSkeleton,
  DirectoryLoadingSkeleton,
  CampaignsLoadingSkeleton,
  WeatherLoadingSkeleton,
  OperationsLoadingSkeleton,
};

export default Skeleton;
