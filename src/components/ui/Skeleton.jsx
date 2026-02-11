// Skeleton.jsx v3.6 - SKELETON AUDIT UPDATE
// Premium skeleton loading with stellar glow effects
// Design System v6.4 compliant
//
// CHANGELOG:
// v3.6 (2026-02-11): View skeleton audit — fix all page-level mismatches
//   - SkeletonHeader: Added rightContent prop for custom header buttons
//   - IntelligenceLoadingSkeleton: Removed Health Score Hero, added PriorityMatrix + 3 CollapsibleSectionSkeletons
//   - DashboardLoadingSkeleton: Fixed KPI counts (4+4), removed date row, header rightContent
//   - CustomersLoadingSkeleton: Added CohortRetentionChartSkeleton section
//   - SocialMediaLoadingSkeleton: Fixed tab count 5→6 (WhatChimp)
//   - CampaignsLoadingSkeleton: Fixed tab count 6→5
//   - DirectoryLoadingSkeleton: Added Smart Filter Presets, updated search/filter layout
//   - OperationsLoadingSkeleton: Fixed KPI count 4→3, added threshold legend
//   - NEW: CollapsibleSectionSkeleton, CohortRetentionChartSkeleton
// v3.5 (2026-02-11): InsightsLoadingSkeleton for Celestial Intelligence Command
//   - Matches Insights.jsx v2.0 + InsightsView.jsx v4.0 layout
//   - Header with glassmorphism icon + title + help button
//   - Category filter pills row (6 pills with active ring)
//   - Summary metrics strip (ativas, urgentes, IA counters)
//   - Dedicated AI panel (glassmorphic with Brain icon + Gerar button)
//   - 3x InsightCard skeletons with bottom accent stripe + action buttons
// v3.4 (2026-01-31): New skeleton variants for complex components
//   - RFMScatterPlotSkeleton: Scatter chart with quadrants, legend, and distributed dots
//   - VisitHeatmapSkeleton: Calendar heatmap grid (7x15) with variable cell sizes
//   - PriorityMatrixSkeleton: 4-quadrant business scoring with radial gauge
//   - All new variants support stagger animation and cosmic shimmer
// v3.3 (2026-01-28): Skeleton Component Type Audit
//   - SkeletonHeader: Redesigned to match Cosmic Precision v2.1 glassmorphism header
//     - Icon container: w-11 h-11 sm:w-12 sm:h-12 (was w-10 h-10 with border-l-4)
//     - Removed color prop (all views use unified glassmorphism pattern)
//     - Added responsive title/subtitle sizing and right-side pill placeholder
//   - NEW: SocialMediaLoadingSkeleton with platform tab navigation
//   - Updated App.jsx VIEW_SKELETONS: social now uses dedicated skeleton
// v3.2 (2026-01-27): Responsive layout verification fixes
//   - Fixed dynamic Tailwind class purge issue in CustomersLoadingSkeleton (RFM dots)
//   - DashboardLoadingSkeleton: Responsive chart height (h-56 sm:h-80)
//   - OperationsLoadingSkeleton: Reduced heatmap label column (36px -> 32px) for mobile
//   - DirectoryLoadingSkeleton: Responsive gap sizing (gap-4 sm:gap-5)
// v3.1 (2026-01-27): Complete view-specific skeleton upgrade
//   - All view skeletons now use cosmic shimmer (removed animate-pulse)
//   - Added stagger props to all individual skeleton elements
//   - CustomersLoadingSkeleton: Cascading reveal with heatmap grid
//   - DirectoryLoadingSkeleton: Customer cards with staggered appearance
//   - CampaignsLoadingSkeleton: Navigation tabs and charts cascade
//   - WeatherLoadingSkeleton: Weather data cards with wave charts
//   - OperationsLoadingSkeleton: Premium Glass cards with stagger
//   - SkeletonSection/SkeletonTableRow: Now use cosmic shimmer
// v3.0 (2026-01-27): Cosmic Shimmer Enhancement
//   - Replaced animate-pulse with cosmic-shimmer gradient wave
//   - Added stagger prop for cascading reveal animations (50ms delays)
//   - Added SkeletonChartAnimated with wave effect on bars
//   - Dark mode: stellar cyan glow on skeleton elements
//   - Integrated with new CSS keyframes in index.css v4.4
// v2.4 (2026-01-23): Skeleton layout matching actual components
//   - FirstVisitConversionCard: Added metric box, comparison bars, action buttons, insight
//   - RetentionCard: Added big metric, status badge, segment bars with re-engage buttons
//   - Both cards now accurately reflect their loaded state structure
// v2.3 (2026-01-23): Fixed skeleton dimensions to match actual components
//   - VisitHeatmap: Fixed grid to 7 rows × 15 columns (was 7×8)
//   - VisitHeatmap: Uses inline style gridTemplateColumns for proper layout
//   - VisitHeatmap: Added proper hour header row + day label column
//   - AcquisitionCard: Fixed chart height to h-[180px] (was h-40)
// v2.2 (2026-01-23): CustomersLoadingSkeleton layout update
//   - Updated to match Customers.jsx v5.14 layout
//   - Section 2: AcquisitionCard + VisitHeatmap (1/2 + 1/2)
//   - Section 3: FirstVisitConversionCard + RetentionCard (1/2 + 1/2)
//   - Section 4: ChurnHistogram + FrequencyDegradationAlert + AtRiskCustomersTable
//   - Section 5: RFMScatterPlot (full width, at bottom)
//   - Added proper header/icon skeletons for each card
//   - Added heatmap grid skeleton for VisitHeatmap
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

// Base skeleton with cosmic shimmer animation
// Props:
//   - stagger: boolean - Enable staggered reveal animation
//   - staggerIndex: number - Delay index (0-7) for cascade effect
const Skeleton = ({ className = '', stagger = false, staggerIndex = 0, style, children }) => {
  const staggerClass = stagger ? `skeleton-stagger-${Math.min(staggerIndex + 1, 8)}` : '';

  return (
    <div
      className={`
        skeleton-cosmic rounded
        ${staggerClass}
        ${className}
      `}
      style={style}
      aria-hidden="true"
    >
      {children}
    </div>
  );
};

// Animated chart skeleton with wave effect on bars
const SkeletonChartAnimated = ({ height = 'h-64', barCount = 12, className = '' }) => {
  const barHeights = [40, 65, 45, 80, 55, 70, 50, 75, 60, 85, 55, 90];

  return (
    <div className={className}>
      <div
        className={`
          ${height} flex items-end justify-between gap-2 px-4
          rounded-xl overflow-hidden
          bg-slate-50 dark:bg-space-dust/30
        `}
      >
        {barHeights.slice(0, barCount).map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t skeleton-cosmic skeleton-bar-wave"
            style={{
              height: `${h}%`,
              animationDelay: `${i * 80}ms, 0ms`
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Text line skeleton
const SkeletonText = ({ width = 'w-full', height = 'h-4', className = '', stagger = false, staggerIndex = 0 }) => (
  <Skeleton className={`rounded ${width} ${height} ${className}`} stagger={stagger} staggerIndex={staggerIndex} />
);

// Circle skeleton (for avatars, icons)
const SkeletonCircle = ({ size = 'w-10 h-10', className = '', stagger = false, staggerIndex = 0 }) => (
  <Skeleton className={`rounded-full ${size} ${className}`} stagger={stagger} staggerIndex={staggerIndex} />
);

// Stat card skeleton
const SkeletonCard = ({ className = '', staggerIndex = 0 }) => (
  <div
    className={`
      bg-white dark:bg-space-dust
      rounded-xl shadow-soft
      p-4 sm:p-6
      border border-slate-100 dark:border-slate-700
      ${className}
    `}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1 space-y-3">
        <SkeletonText width="w-20" height="h-3" stagger staggerIndex={staggerIndex} />
        <SkeletonText width="w-32" height="h-8" stagger staggerIndex={staggerIndex} />
        <SkeletonText width="w-24" height="h-3" stagger staggerIndex={staggerIndex} />
      </div>
      <SkeletonCircle size="w-12 h-12" className="rounded-lg" stagger staggerIndex={staggerIndex} />
    </div>
  </div>
);

// Chart skeleton - uses cosmic shimmer with bar wave animation
const SkeletonChart = ({ height = 'h-64', className = '' }) => (
  <div className={`${className}`}>
    <div className={`${height} flex items-end justify-between gap-2 px-4`}>
      {[40, 65, 45, 80, 55, 70, 50, 75, 60, 85, 55, 90].map((h, i) => (
        <Skeleton
          key={i}
          className="flex-1 rounded-t skeleton-bar-wave"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  </div>
);

// Section skeleton (full section with header)
// Uses cosmic shimmer with staggered reveal animations
const SkeletonSection = ({ className = '' }) => (
  <div
    className={`
      bg-white dark:bg-space-dust
      rounded-2xl shadow-soft
      p-4 sm:p-6 lg:p-8
      ${className}
    `}
  >
    {/* Header */}
    <div className="flex items-center gap-3 mb-6">
      <SkeletonCircle size="w-10 h-10" className="rounded-lg" stagger staggerIndex={0} />
      <div className="space-y-2">
        <SkeletonText width="w-40" height="h-6" stagger staggerIndex={0} />
        <SkeletonText width="w-56" height="h-3" stagger staggerIndex={1} />
      </div>
    </div>

    {/* KPI Grid */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg space-y-2">
          <SkeletonText width="w-16" height="h-3" stagger staggerIndex={1 + i} />
          <SkeletonText width="w-24" height="h-7" stagger staggerIndex={2 + i} />
          <SkeletonText width="w-20" height="h-3" stagger staggerIndex={2 + i} />
        </div>
      ))}
    </div>

    {/* Chart */}
    <SkeletonChartAnimated height="h-48" />
  </div>
);

// Table row skeleton - uses cosmic shimmer
const SkeletonTableRow = ({ columns = 5, staggerBase = 0 }) => (
  <tr>
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <SkeletonText width={i === 0 ? 'w-24' : 'w-16'} height="h-4" stagger staggerIndex={Math.min(staggerBase + i, 7)} />
      </td>
    ))}
  </tr>
);

// CollapsibleSectionSkeleton — for Intelligence view collapsible sections (v3.6)
// Matches ProfitabilitySection/GrowthTrendsSection/ModelHealthDashboard layout
const CollapsibleSectionSkeleton = ({ kpiCount = 4, chartHeight = 'h-40', staggerBase = 0 }) => (
  <div className="bg-white/80 dark:bg-space-dust/40 backdrop-blur-xl rounded-2xl p-5 ring-1 ring-slate-200/80 dark:ring-white/[0.05]">
    {/* Header with icon + title + chevron toggle */}
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" stagger staggerIndex={staggerBase} />
        <div className="space-y-1.5">
          <SkeletonText width="w-36" height="h-5" stagger staggerIndex={staggerBase} />
          <SkeletonText width="w-48" height="h-3" stagger staggerIndex={Math.min(staggerBase + 1, 7)} />
        </div>
      </div>
      <Skeleton className="w-5 h-5 rounded" stagger staggerIndex={Math.min(staggerBase + 1, 7)} />
    </div>
    {/* KPI grid */}
    <div className={`grid grid-cols-2 ${kpiCount >= 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-3 mb-4`}>
      {[...Array(kpiCount)].map((_, i) => (
        <div key={i} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <SkeletonText width="w-16" height="h-3" className="mb-2" stagger staggerIndex={Math.min(staggerBase + 2, 7)} />
          <SkeletonText width="w-12" height="h-6" className="mb-1" stagger staggerIndex={Math.min(staggerBase + 2 + i, 7)} />
          <SkeletonText width="w-10" height="h-3" stagger staggerIndex={Math.min(staggerBase + 3 + i, 7)} />
        </div>
      ))}
    </div>
    {/* Chart */}
    <SkeletonChartAnimated height={chartHeight} />
  </div>
);

// Intelligence skeleton - matches Intelligence.jsx v3.23.1 layout
// Header + 2 buttons → 4 KPIs → PriorityMatrix → RevenueForecast → 3 collapsible sections
const IntelligenceLoadingSkeleton = () => (
  <div className="space-y-6 sm:space-y-8">
    {/* Header with Comparar + SyncStatus buttons */}
    <SkeletonHeader rightContent={
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-24 rounded-lg" stagger staggerIndex={1} />
        <Skeleton className="h-8 w-28 rounded-lg" stagger staggerIndex={1} />
      </div>
    } />

    {/* Quick stats - 4 column KPI grid */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {[0, 1, 2, 3].map((i) => (
        <SkeletonCard key={i} staggerIndex={i + 2} />
      ))}
    </div>

    {/* PriorityMatrix skeleton (reuse existing component) */}
    <PriorityMatrixSkeleton />

    {/* Revenue Forecast */}
    <div className="bg-white dark:bg-space-dust rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <SkeletonText width="w-40" height="h-5" stagger staggerIndex={7} />
        <SkeletonText width="w-24" height="h-4" stagger staggerIndex={7} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex justify-between">
              <SkeletonText width="w-28" height="h-4" stagger staggerIndex={i} />
              <SkeletonText width="w-20" height="h-5" stagger staggerIndex={i} />
            </div>
          ))}
        </div>
        <SkeletonChartAnimated height="h-40" />
      </div>
    </div>

    {/* Collapsible sections — ModelHealth, Profitability, GrowthTrends */}
    <CollapsibleSectionSkeleton kpiCount={4} staggerBase={0} />
    <CollapsibleSectionSkeleton kpiCount={3} staggerBase={2} />
    <CollapsibleSectionSkeleton kpiCount={4} chartHeight="h-48" staggerBase={4} />
  </div>
);

// ==================== VIEW-SPECIFIC SKELETONS ====================

// Shared header skeleton component (icon box + title + subtitle)
const SkeletonHeader = ({ rightContent } = {}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <div className="flex items-center gap-3">
      {/* Glassmorphism icon — matches Cosmic Precision v2.1 */}
      <Skeleton
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex-shrink-0"
        stagger staggerIndex={0}
      />
      <div className="space-y-1.5">
        <SkeletonText width="w-32 sm:w-40" height="h-5 sm:h-6" stagger staggerIndex={0} />
        <SkeletonText width="w-44 sm:w-56" height="h-2.5 sm:h-3" stagger staggerIndex={0} />
      </div>
    </div>
    {rightContent || (
      <SkeletonText width="w-20" height="h-6" className="rounded-full hidden sm:block" stagger staggerIndex={1} />
    )}
  </div>
);

// Hero KPI Card skeleton (larger, with sparkline area)
const SkeletonHeroCard = ({ staggerIndex = 0 }) => (
  <div className="bg-white dark:bg-space-dust rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-5">
    <div className="flex items-start justify-between mb-3">
      <div className="space-y-2">
        <SkeletonText width="w-24" height="h-4" stagger staggerIndex={staggerIndex} />
        <SkeletonText width="w-16" height="h-8" stagger staggerIndex={staggerIndex} />
        <SkeletonText width="w-20" height="h-3" stagger staggerIndex={staggerIndex} />
      </div>
      <SkeletonCircle size="w-10 h-10" className="rounded-lg" stagger staggerIndex={staggerIndex} />
    </div>
    {/* Sparkline area */}
    <div className="h-12 mt-2">
      <div className="flex items-end justify-between gap-1 h-full">
        {[30, 50, 40, 70, 60, 80, 55].map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-t skeleton-bar-wave" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  </div>
);

// Dashboard skeleton - matches Dashboard.jsx v10.4 layout
// Uses cosmic shimmer with staggered reveal animations
const DashboardLoadingSkeleton = () => (
  <div className="space-y-6 sm:space-y-8">
    {/* Header with StaleData + DateControl */}
    <SkeletonHeader rightContent={
      <div className="flex items-center gap-2">
        <SkeletonText width="w-20" height="h-6" className="rounded-full" stagger staggerIndex={1} />
        <Skeleton className="h-9 w-40 rounded-lg" stagger staggerIndex={1} />
      </div>
    } />

    {/* Hero KPI Cards - 4 cards */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {[0, 1, 2, 3].map((i) => (
        <SkeletonHeroCard key={i} staggerIndex={i} />
      ))}
    </div>

    {/* Secondary KPI cards - 4 cards */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-space-dust rounded-xl border border-slate-200 dark:border-slate-700 p-3">
          <SkeletonText width="w-16" height="h-3" className="mb-2" stagger staggerIndex={i + 4} />
          <SkeletonText width="w-12" height="h-6" className="mb-1" stagger staggerIndex={i + 4} />
          <SkeletonText width="w-20" height="h-3" stagger staggerIndex={Math.min(i + 5, 7)} />
        </div>
      ))}
    </div>

    {/* Chart section */}
    <div className="bg-white dark:bg-space-dust rounded-2xl border border-slate-200 dark:border-stellar-cyan/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <SkeletonText width="w-40" height="h-5" stagger staggerIndex={6} />
        <SkeletonText width="w-24" height="h-8" className="rounded-lg" stagger staggerIndex={7} />
      </div>
      <SkeletonChartAnimated height="h-56 sm:h-80" />
    </div>
  </div>
);

// Customers skeleton - matches Customers.jsx v5.14 layout
// Uses cosmic shimmer with staggered reveal animations
const CustomersLoadingSkeleton = () => (
  <div className="space-y-6">
    {/* Header with HealthPill */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <SkeletonHeader />
      <Skeleton className="h-8 w-28 rounded-full" stagger staggerIndex={0} />
    </div>

    {/* Section 2: Acquisition + Visit Patterns (1/2 + 1/2) */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* AcquisitionCard skeleton */}
      <div className="bg-white dark:bg-space-dust rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-start gap-3 mb-4">
          <Skeleton className="w-10 h-10 rounded-xl" stagger staggerIndex={1} />
          <div className="flex-1 space-y-2">
            <SkeletonText width="w-32" height="h-5" stagger staggerIndex={1} />
            <SkeletonText width="w-48" height="h-3" stagger staggerIndex={1} />
          </div>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <SkeletonText width="w-20" height="h-10" stagger staggerIndex={2} />
          <div className="flex-1 h-12">
            <div className="flex items-end justify-between gap-1 h-full">
              {[30, 50, 40, 70, 60, 80, 55].map((h, i) => (
                <Skeleton key={i} className="flex-1 rounded-t skeleton-bar-wave" style={{ height: `${h}%`, animationDelay: `${i * 60}ms, 0ms` }} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-6 w-24 rounded-full" stagger staggerIndex={3} />
          <Skeleton className="h-6 w-20 rounded-full" stagger staggerIndex={3} />
        </div>
        <SkeletonChartAnimated height="h-[180px]" />
      </div>

      {/* VisitHeatmap skeleton */}
      <div className="bg-white dark:bg-space-dust rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-start gap-3 mb-4">
          <Skeleton className="w-10 h-10 rounded-xl" stagger staggerIndex={1} />
          <div className="flex-1 space-y-2">
            <SkeletonText width="w-36" height="h-5" stagger staggerIndex={1} />
            <SkeletonText width="w-52" height="h-3" stagger staggerIndex={1} />
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-lg" stagger staggerIndex={i + 1} />
          ))}
        </div>
        {/* Heatmap grid skeleton - 7 days × 15 hours (8h-22h) */}
        <div className="space-y-0.5">
          {/* Hour headers row */}
          <div className="grid gap-0.5" style={{ gridTemplateColumns: '32px repeat(15, 1fr)' }}>
            <div /> {/* Empty corner */}
            {[...Array(15)].map((_, i) => (
              <Skeleton key={i} className="h-4 rounded" stagger staggerIndex={Math.min(4 + Math.floor(i / 4), 7)} />
            ))}
          </div>
          {/* 7 day rows */}
          {[...Array(7)].map((_, row) => (
            <div key={row} className="grid gap-0.5" style={{ gridTemplateColumns: '32px repeat(15, 1fr)' }}>
              <Skeleton className="h-6 sm:h-8 w-8 rounded" stagger staggerIndex={Math.min(4 + row, 7)} /> {/* Day label */}
              {[...Array(15)].map((_, col) => (
                <div key={col} className="h-6 sm:h-8 flex items-center justify-center">
                  <Skeleton className="w-3 h-3 sm:w-4 sm:h-4 rounded-lg" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Section 3: Conversion (1/2 + 1/2) */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* FirstVisitConversionCard skeleton */}
      <div className="bg-white dark:bg-space-dust rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <Skeleton className="w-10 h-10 rounded-xl" stagger staggerIndex={0} />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2 mb-1">
              <SkeletonText width="w-40" height="h-5" stagger staggerIndex={0} />
              <Skeleton className="h-5 w-16 rounded-full" stagger staggerIndex={1} />
            </div>
            <SkeletonText width="w-56" height="h-3" stagger staggerIndex={1} />
          </div>
        </div>
        {/* Primary Metric Box */}
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg mb-4">
          <div className="flex items-baseline justify-between mb-2">
            <div className="flex items-baseline gap-2">
              <SkeletonText width="w-16" height="h-10" stagger staggerIndex={2} />
              <SkeletonText width="w-20" height="h-4" stagger staggerIndex={2} />
            </div>
            <SkeletonText width="w-12" height="h-4" stagger staggerIndex={2} />
          </div>
          <SkeletonText width="w-full" height="h-3" stagger staggerIndex={3} />
        </div>
        {/* Welcome Comparison */}
        <div className="mb-4 space-y-3">
          <SkeletonText width="w-32" height="h-3" stagger staggerIndex={3} />
          {[1, 2].map((i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SkeletonCircle size="w-4 h-4" stagger staggerIndex={3 + i} />
                  <SkeletonText width="w-24" height="h-3" stagger staggerIndex={3 + i} />
                </div>
                <SkeletonText width="w-8" height="h-4" stagger staggerIndex={3 + i} />
              </div>
              <Skeleton className="h-2 w-full rounded-full" stagger staggerIndex={4 + i} />
            </div>
          ))}
        </div>
        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Skeleton className="h-10 rounded-lg" stagger staggerIndex={6} />
          <Skeleton className="h-10 rounded-lg" stagger staggerIndex={6} />
        </div>
        {/* Insight */}
        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex gap-2">
          <SkeletonCircle size="w-4 h-4" stagger staggerIndex={7} />
          <div className="flex-1 space-y-1">
            <SkeletonText width="w-full" height="h-3" stagger staggerIndex={7} />
            <SkeletonText width="w-3/4" height="h-3" stagger staggerIndex={7} />
          </div>
        </div>
      </div>

      {/* RetentionCard skeleton */}
      <div className="bg-white dark:bg-space-dust rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <Skeleton className="w-10 h-10 rounded-xl" stagger staggerIndex={0} />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2 mb-1">
              <SkeletonText width="w-32" height="h-5" stagger staggerIndex={0} />
              <Skeleton className="w-20 h-8 rounded" stagger staggerIndex={1} /> {/* Sparkline */}
            </div>
            <SkeletonText width="w-40" height="h-3" stagger staggerIndex={1} />
          </div>
        </div>
        {/* Primary Metric */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline gap-2">
            <SkeletonText width="w-16" height="h-10" stagger staggerIndex={2} />
            <SkeletonText width="w-8" height="h-4" stagger staggerIndex={2} />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" stagger staggerIndex={2} /> {/* Status badge */}
        </div>
        {/* Segment label */}
        <SkeletonText width="w-28" height="h-3" className="mb-3" stagger staggerIndex={3} />
        {/* Segment comparison bars */}
        <div className="space-y-4 mb-4">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SkeletonCircle size="w-4 h-4" stagger staggerIndex={3 + i} />
                  <SkeletonText width="w-24" height="h-4" stagger staggerIndex={3 + i} />
                </div>
                <div className="flex items-center gap-2">
                  <SkeletonText width="w-8" height="h-4" stagger staggerIndex={3 + i} />
                  <SkeletonText width="w-12" height="h-3" stagger staggerIndex={3 + i} />
                </div>
              </div>
              <Skeleton className="h-2.5 w-full rounded-full" stagger staggerIndex={4 + i} />
              <Skeleton className="h-9 w-full rounded-lg" stagger staggerIndex={5 + i} /> {/* Re-engage button */}
            </div>
          ))}
        </div>
        {/* Insight */}
        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex gap-2">
          <SkeletonCircle size="w-4 h-4" stagger staggerIndex={7} />
          <div className="flex-1 space-y-1">
            <SkeletonText width="w-full" height="h-3" stagger staggerIndex={7} />
            <SkeletonText width="w-3/4" height="h-3" stagger staggerIndex={7} />
          </div>
        </div>
      </div>
    </div>

    {/* Section 4: Risk Management */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ChurnHistogram skeleton */}
      <div className="bg-white dark:bg-space-dust rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-start gap-3 mb-4">
          <Skeleton className="w-10 h-10 rounded-xl" stagger staggerIndex={0} />
          <div className="flex-1 space-y-2">
            <SkeletonText width="w-32" height="h-5" stagger staggerIndex={0} />
            <SkeletonText width="w-48" height="h-3" stagger staggerIndex={1} />
          </div>
        </div>
        <Skeleton className="h-8 w-48 rounded-lg mb-4" stagger staggerIndex={2} />
        <SkeletonChartAnimated height="h-48" />
      </div>

      {/* FrequencyDegradationAlert skeleton (optional, shown for layout) */}
      <div className="bg-white dark:bg-space-dust rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-start gap-3 mb-4">
          <Skeleton className="w-10 h-10 rounded-xl" stagger staggerIndex={0} />
          <div className="flex-1 space-y-2">
            <SkeletonText width="w-40" height="h-5" stagger staggerIndex={0} />
            <SkeletonText width="w-56" height="h-3" stagger staggerIndex={1} />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <SkeletonCircle size="w-8 h-8" stagger staggerIndex={i + 1} />
              <div className="flex-1 space-y-1">
                <SkeletonText width="w-28" height="h-4" stagger staggerIndex={i + 1} />
                <SkeletonText width="w-20" height="h-3" stagger staggerIndex={i + 2} />
              </div>
              <SkeletonText width="w-12" height="h-5" stagger staggerIndex={i + 2} />
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* AtRiskCustomersTable skeleton */}
    <div className="bg-white dark:bg-space-dust rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-5 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" stagger staggerIndex={0} />
            <div className="space-y-1">
              <SkeletonText width="w-32" height="h-5" stagger staggerIndex={0} />
              <SkeletonText width="w-48" height="h-3" stagger staggerIndex={1} />
            </div>
          </div>
          <Skeleton className="h-9 w-28 rounded-xl" stagger staggerIndex={1} />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-48 rounded-xl" stagger staggerIndex={2} />
          <Skeleton className="h-9 w-40 rounded-xl" stagger staggerIndex={2} />
        </div>
      </div>
      <div className="p-4 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
            <Skeleton className="w-4 h-4 rounded" stagger staggerIndex={Math.min(2 + i, 7)} />
            <SkeletonCircle size="w-9 h-9" stagger staggerIndex={Math.min(2 + i, 7)} />
            <div className="flex-1 space-y-1">
              <SkeletonText width="w-32" height="h-4" stagger staggerIndex={Math.min(2 + i, 7)} />
              <SkeletonText width="w-24" height="h-3" stagger staggerIndex={Math.min(3 + i, 7)} />
            </div>
            <SkeletonText width="w-16" height="h-6" className="rounded-md" stagger staggerIndex={Math.min(3 + i, 7)} />
            <SkeletonText width="w-20" height="h-5" stagger staggerIndex={Math.min(3 + i, 7)} />
          </div>
        ))}
      </div>
    </div>

    {/* Section 5: Cohort Retention (added v3.6) */}
    <CohortRetentionChartSkeleton />

    {/* Section 6: RFM Scatter Plot - Full Width */}
    <div className="bg-white dark:bg-space-dust rounded-xl border border-slate-200 dark:border-slate-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" stagger staggerIndex={0} />
          <div className="space-y-1">
            <SkeletonText width="w-40" height="h-5" stagger staggerIndex={0} />
            <SkeletonText width="w-56" height="h-3" stagger staggerIndex={1} />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" stagger staggerIndex={1} />
          <Skeleton className="h-8 w-8 rounded-lg" stagger staggerIndex={1} />
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-5 w-16 rounded" stagger staggerIndex={i} />
        ))}
      </div>
      <div className="h-[350px] relative">
        {/* Scatter plot dots simulation - use static size classes for Tailwind purge */}
        {(() => {
          const dotSizes = ['w-3 h-3', 'w-4 h-4', 'w-5 h-5'];
          return [...Array(25)].map((_, i) => (
            <SkeletonCircle
              key={i}
              size={dotSizes[i % 3]}
              className="absolute"
              stagger
              staggerIndex={Math.min(Math.floor(i / 4), 7)}
              style={{
                left: `${8 + (i * 3.5) % 85}%`,
                top: `${10 + (i * 7) % 75}%`,
              }}
            />
          ));
        })()}
      </div>
    </div>
  </div>
);

// Directory skeleton - matches Directory.jsx layout
// Uses cosmic shimmer with staggered reveal animations
const DirectoryLoadingSkeleton = () => (
  <div className="space-y-6 sm:space-y-8">
    {/* Header with stats */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <SkeletonHeader />
      <div className="flex items-center gap-2">
        <Skeleton className="h-7 w-20 rounded-full" stagger staggerIndex={0} />
        <Skeleton className="h-7 w-20 rounded-full" stagger staggerIndex={1} />
        <Skeleton className="h-7 w-24 rounded-full" stagger staggerIndex={1} />
      </div>
    </div>

    {/* Main content card */}
    <div className="bg-white dark:bg-space-dust rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Filter bar */}
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-space-dust/50">
        <div className="space-y-3">
          {/* Search + Filter toggle + Export */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 flex-1 min-w-[200px] rounded-xl" stagger staggerIndex={0} />
            <Skeleton className="h-12 w-28 rounded-xl" stagger staggerIndex={1} />
            <Skeleton className="h-12 w-28 rounded-xl hidden sm:block" stagger staggerIndex={2} />
          </div>
          {/* Smart Filter Presets */}
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-xl" stagger staggerIndex={Math.min(2 + i, 7)} />
            ))}
          </div>
        </div>
      </div>

      {/* Customer cards grid */}
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <SkeletonCircle size="w-12 h-12" stagger staggerIndex={Math.min(i, 7)} />
                <div className="flex-1 space-y-1.5">
                  <SkeletonText width="w-28" height="h-4" stagger staggerIndex={Math.min(i, 7)} />
                  <SkeletonText width="w-20" height="h-3" stagger staggerIndex={Math.min(i + 1, 7)} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <SkeletonText width="w-16" height="h-5" className="rounded-full" stagger staggerIndex={Math.min(i + 1, 7)} />
                <SkeletonText width="w-20" height="h-4" stagger staggerIndex={Math.min(i + 1, 7)} />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                <div>
                  <SkeletonText width="w-12" height="h-3" className="mb-1" stagger staggerIndex={Math.min(i + 2, 7)} />
                  <SkeletonText width="w-16" height="h-4" stagger staggerIndex={Math.min(i + 2, 7)} />
                </div>
                <div>
                  <SkeletonText width="w-12" height="h-3" className="mb-1" stagger staggerIndex={Math.min(i + 2, 7)} />
                  <SkeletonText width="w-14" height="h-4" stagger staggerIndex={Math.min(i + 2, 7)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <SkeletonText width="w-32" height="h-4" stagger staggerIndex={6} />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20 rounded-lg" stagger staggerIndex={6} />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-8 rounded-lg" stagger staggerIndex={6 + i} />
            ))}
            <Skeleton className="h-8 w-20 rounded-lg" stagger staggerIndex={7} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Campaigns skeleton - matches Campaigns.jsx layout
// Uses cosmic shimmer with staggered reveal animations
const CampaignsLoadingSkeleton = () => (
  <div className="space-y-6 sm:space-y-8">
    {/* Header with button */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <SkeletonHeader />
      <Skeleton className="h-10 w-36 rounded-xl" stagger staggerIndex={0} />
    </div>

    {/* Section navigation */}
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-9 w-28 rounded-lg flex-shrink-0" stagger staggerIndex={i} />
      ))}
    </div>

    {/* Dashboard cards - 4 column grid */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-space-dust rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <SkeletonText width="w-20" height="h-3" className="mb-2" stagger staggerIndex={i} />
          <SkeletonText width="w-16" height="h-7" className="mb-1" stagger staggerIndex={i + 1} />
          <SkeletonText width="w-24" height="h-3" stagger staggerIndex={i + 1} />
        </div>
      ))}
    </div>

    {/* Main content area - charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-space-dust rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <SkeletonText width="w-40" height="h-5" className="mb-4" stagger staggerIndex={5} />
        <SkeletonChartAnimated height="h-64" />
      </div>
      <div className="bg-white dark:bg-space-dust rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <SkeletonText width="w-40" height="h-5" className="mb-4" stagger staggerIndex={5} />
        <SkeletonChartAnimated height="h-64" />
      </div>
    </div>

    {/* Insights row */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <SkeletonCircle size="w-8 h-8" className="rounded-lg" stagger staggerIndex={6 + i} />
            <div className="flex-1 space-y-2">
              <SkeletonText width="w-24" height="h-4" stagger staggerIndex={6 + i} />
              <SkeletonText width="w-full" height="h-3" stagger staggerIndex={7} />
              <SkeletonText width="w-3/4" height="h-3" stagger staggerIndex={7} />
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
// Uses cosmic shimmer with staggered reveal animations
const WeatherLoadingSkeleton = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="space-y-2">
      <SkeletonText width="w-32" height="h-8" stagger staggerIndex={0} />
      <SkeletonText width="w-56" height="h-4" stagger staggerIndex={0} />
    </div>

    {/* Row 1: Hero (1/2) + Metrics Grid (1/2) */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Weather Hero */}
      <Skeleton className="h-48 sm:h-56 rounded-2xl" stagger staggerIndex={1} />

      {/* Metrics Grid */}
      <div className="bg-white dark:bg-space-dust rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 h-full">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl space-y-2">
              <SkeletonCircle size="w-8 h-8" className="rounded-lg" stagger staggerIndex={Math.min(1 + i, 7)} />
              <SkeletonText width="w-14" height="h-3" stagger staggerIndex={Math.min(2 + i, 7)} />
              <SkeletonText width="w-10" height="h-5" stagger staggerIndex={Math.min(2 + i, 7)} />
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Row 2: Hourly Forecast - full width */}
    <div className="bg-white dark:bg-space-dust rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <SkeletonText width="w-36" height="h-5" stagger staggerIndex={3} />
      </div>
      <div className="p-4">
        <div className="flex gap-2 overflow-hidden">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex-shrink-0 w-16 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl space-y-2">
              <SkeletonText width="w-10" height="h-3" stagger staggerIndex={Math.min(3 + Math.floor(i / 2), 7)} />
              <SkeletonCircle size="w-6 h-6" className="mx-auto" stagger staggerIndex={Math.min(4 + Math.floor(i / 2), 7)} />
              <SkeletonText width="w-8" height="h-4" className="mx-auto" stagger staggerIndex={Math.min(4 + Math.floor(i / 2), 7)} />
            </div>
          ))}
        </div>
        <div className="h-32 mt-4">
          <SkeletonChartAnimated height="h-full" barCount={8} />
        </div>
      </div>
    </div>

    {/* Row 3: Daily Forecast - full width */}
    <div className="bg-white dark:bg-space-dust rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <SkeletonText width="w-32" height="h-5" stagger staggerIndex={5} />
      </div>
      <div className="p-2 space-y-1">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
            <SkeletonText width="w-16" height="h-4" stagger staggerIndex={Math.min(5 + Math.floor(i / 2), 7)} />
            <SkeletonCircle size="w-6 h-6" stagger staggerIndex={Math.min(5 + Math.floor(i / 2), 7)} />
            <SkeletonText width="w-12" height="h-4" stagger staggerIndex={Math.min(6 + Math.floor(i / 2), 7)} />
            <div className="flex-1">
              <Skeleton className="h-1.5 rounded-full" stagger staggerIndex={Math.min(6 + Math.floor(i / 2), 7)} />
            </div>
            <SkeletonText width="w-8" height="h-4" stagger staggerIndex={Math.min(6 + Math.floor(i / 2), 7)} />
          </div>
        ))}
      </div>
    </div>

    {/* Row 4: Business Impact - full width */}
    <div className="bg-white dark:bg-space-dust rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <SkeletonText width="w-48" height="h-6" className="mb-4" stagger staggerIndex={6} />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl space-y-2">
            <SkeletonText width="w-12" height="h-3" stagger staggerIndex={Math.min(6 + Math.floor(i / 2), 7)} />
            <SkeletonCircle size="w-8 h-8" className="mx-auto" stagger staggerIndex={7} />
            <SkeletonText width="w-14" height="h-4" className="mx-auto" stagger staggerIndex={7} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Operations skeleton - matches Operations.jsx v6.0 layout (no section headers)
// Components have their own Premium Glass cards with cyan icon badges
// Uses cosmic shimmer with staggered reveal animations
const OperationsLoadingSkeleton = () => (
  <div className="space-y-6 sm:space-y-8">
    {/* Header */}
    <SkeletonHeader />

    {/* Date Range Selector */}
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-space-dust rounded-xl border border-slate-200 dark:border-slate-700">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-8 w-28 rounded-lg" stagger staggerIndex={i} />
      ))}
      <Skeleton className="h-6 w-48 rounded-lg ml-auto" stagger staggerIndex={3} />
    </div>

    {/* KPI Cards - 3 cards (Lavadoras, Secadoras, Total) */}
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
      {[0, 1, 2].map((i) => (
        <SkeletonCard key={i} staggerIndex={i} />
      ))}
    </div>
    {/* Threshold legend */}
    <div className="flex items-center justify-center gap-4 -mt-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-1">
          <Skeleton className="w-2 h-2 rounded-full" />
          <SkeletonText width="w-10" height="h-3" stagger staggerIndex={Math.min(3 + i, 7)} />
        </div>
      ))}
    </div>

    {/* MachinePerformanceTable - Premium Glass card */}
    <div className="bg-white/80 dark:bg-space-dust/40 backdrop-blur-xl rounded-2xl p-5 ring-1 ring-slate-200/80 dark:ring-white/[0.05]">
      {/* Header with cyan icon badge */}
      <div className="flex items-start gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-xl bg-cyan-200 dark:bg-cyan-900/50" stagger staggerIndex={0} />
        <div className="flex-1 space-y-2">
          <SkeletonText width="w-48" height="h-5" stagger staggerIndex={0} />
          <SkeletonText width="w-32" height="h-3" stagger staggerIndex={1} />
        </div>
      </div>
      {/* Table sections */}
      <div className="space-y-6">
        {/* Lavadoras */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <SkeletonCircle size="w-5 h-5" stagger staggerIndex={2} />
            <SkeletonText width="w-24" height="h-4" stagger staggerIndex={2} />
          </div>
          <div className="rounded-xl ring-1 ring-slate-200/50 dark:ring-white/[0.05] overflow-hidden">
            <div className="grid grid-cols-5 gap-2 p-3 bg-slate-50/90 dark:bg-slate-700/50">
              {[0, 1, 2, 3, 4].map((i) => (
                <SkeletonText key={i} width="w-full" height="h-3" stagger staggerIndex={Math.min(2 + i, 7)} />
              ))}
            </div>
            {[0, 1, 2].map((row) => (
              <div key={row} className="grid grid-cols-5 gap-2 p-3 border-t border-slate-100 dark:border-slate-700/50">
                {[0, 1, 2, 3, 4].map((col) => (
                  <SkeletonText key={col} width="w-full" height="h-4" stagger staggerIndex={Math.min(3 + row, 7)} />
                ))}
              </div>
            ))}
          </div>
        </div>
        {/* Secadoras */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <SkeletonCircle size="w-5 h-5" stagger staggerIndex={5} />
            <SkeletonText width="w-24" height="h-4" stagger staggerIndex={5} />
          </div>
          <div className="rounded-xl ring-1 ring-slate-200/50 dark:ring-white/[0.05] overflow-hidden">
            <div className="grid grid-cols-5 gap-2 p-3 bg-slate-50/90 dark:bg-slate-700/50">
              {[0, 1, 2, 3, 4].map((i) => (
                <SkeletonText key={i} width="w-full" height="h-3" stagger staggerIndex={Math.min(5 + i, 7)} />
              ))}
            </div>
            {[0, 1, 2].map((row) => (
              <div key={row} className="grid grid-cols-5 gap-2 p-3 border-t border-slate-100 dark:border-slate-700/50">
                {[0, 1, 2, 3, 4].map((col) => (
                  <SkeletonText key={col} width="w-full" height="h-4" stagger staggerIndex={Math.min(6 + row, 7)} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* UtilizationHeatmap - Premium Glass card */}
    <div className="bg-white/80 dark:bg-space-dust/40 backdrop-blur-xl rounded-2xl p-5 ring-1 ring-slate-200/80 dark:ring-white/[0.05]">
      {/* Header with cyan icon badge + view toggle */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <Skeleton className="w-10 h-10 rounded-xl bg-cyan-200 dark:bg-cyan-900/50" stagger staggerIndex={0} />
          <div className="space-y-2">
            <SkeletonText width="w-36" height="h-5" stagger staggerIndex={0} />
            <SkeletonText width="w-28" height="h-3" stagger staggerIndex={1} />
          </div>
        </div>
        <div className="flex gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.05]">
          <Skeleton className="h-8 w-20 rounded-md" stagger staggerIndex={1} />
          <Skeleton className="h-8 w-24 rounded-md" stagger staggerIndex={2} />
        </div>
      </div>
      {/* Heatmap grid - 7 days x 15 hours */}
      <div className="space-y-1">
        <div className="grid gap-1" style={{ gridTemplateColumns: '32px repeat(7, 1fr)' }}>
          <div />
          {[...Array(7)].map((_, i) => (
            <SkeletonText key={i} width="w-full" height="h-4" stagger staggerIndex={Math.min(2 + i, 7)} />
          ))}
        </div>
        {[...Array(12)].map((_, row) => (
          <div key={row} className="grid gap-1" style={{ gridTemplateColumns: '32px repeat(7, 1fr)' }}>
            <SkeletonText width="w-8" height="h-6" stagger staggerIndex={Math.min(3 + Math.floor(row / 3), 7)} />
            {[...Array(7)].map((_, col) => (
              <Skeleton key={col} className="h-6 sm:h-7 rounded-md" />
            ))}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="mt-4 flex flex-col items-center gap-2">
        <div className="flex items-center gap-3 w-full max-w-xs">
          <SkeletonText width="w-10" height="h-4" stagger staggerIndex={6} />
          <Skeleton className="flex-1 h-2.5 rounded-full" stagger staggerIndex={7} />
          <SkeletonText width="w-8" height="h-4" stagger staggerIndex={7} />
        </div>
      </div>
    </div>

    {/* PeakHoursSummary + DayOfWeekChart - Side by side */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* PeakHoursSummary - Premium Glass card */}
      <div className="bg-white/80 dark:bg-space-dust/40 backdrop-blur-xl rounded-2xl p-5 ring-1 ring-slate-200/80 dark:ring-white/[0.05]">
        {/* Header with cyan icon badge */}
        <div className="flex items-start gap-3 mb-4">
          <Skeleton className="w-10 h-10 rounded-xl bg-cyan-200 dark:bg-cyan-900/50" stagger staggerIndex={0} />
          <div className="flex-1 space-y-2">
            <SkeletonText width="w-48" height="h-5" stagger staggerIndex={0} />
            <SkeletonText width="w-32" height="h-3" stagger staggerIndex={1} />
          </div>
        </div>
        {/* Peak/Off-peak columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[0, 1].map((col) => (
            <div key={col}>
              <div className="flex items-center gap-2 mb-4">
                <SkeletonCircle size="w-4 h-4" stagger staggerIndex={1 + col} />
                <SkeletonText width="w-28" height="h-4" stagger staggerIndex={1 + col} />
              </div>
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex items-center justify-between p-3 rounded-lg mb-2 bg-slate-50 dark:bg-slate-700/30">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-lg" stagger staggerIndex={Math.min(2 + col + row, 7)} />
                    <div className="space-y-1">
                      <SkeletonText width="w-16" height="h-4" stagger staggerIndex={Math.min(2 + col + row, 7)} />
                      <SkeletonText width="w-20" height="h-3" stagger staggerIndex={Math.min(3 + col + row, 7)} />
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <SkeletonText width="w-12" height="h-5" stagger staggerIndex={Math.min(3 + col + row, 7)} />
                    <SkeletonText width="w-16" height="h-3" stagger staggerIndex={Math.min(4 + col + row, 7)} />
                  </div>
                </div>
              ))}
              {/* Recommendation box */}
              <Skeleton className="h-12 w-full rounded-xl mt-4" stagger staggerIndex={6 + col} />
            </div>
          ))}
        </div>
      </div>

      {/* DayOfWeekChart - Premium Glass card */}
      <div className="bg-white/80 dark:bg-space-dust/40 backdrop-blur-xl rounded-2xl p-5 ring-1 ring-slate-200/80 dark:ring-white/[0.05]">
        {/* Header with cyan icon badge */}
        <div className="flex items-start gap-3 mb-4">
          <Skeleton className="w-10 h-10 rounded-xl bg-cyan-200 dark:bg-cyan-900/50" stagger staggerIndex={0} />
          <div className="flex-1 space-y-2">
            <SkeletonText width="w-52" height="h-5" stagger staggerIndex={0} />
            <SkeletonText width="w-32" height="h-3" stagger staggerIndex={1} />
          </div>
        </div>
        {/* Chart area */}
        <SkeletonChartAnimated height="h-56" />
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Skeleton className="h-28 rounded-xl" stagger staggerIndex={5} />
          <Skeleton className="h-28 rounded-xl" stagger staggerIndex={6} />
        </div>
      </div>
    </div>
  </div>
);

// Social Media skeleton - matches SocialMedia.jsx v1.5 layout
// Platform tab navigation + Instagram-like default content
const SocialMediaLoadingSkeleton = () => {
  // Static tab widths to avoid dynamic Tailwind class purge issues
  const tabClasses = [
    'h-9 sm:h-10 w-20 rounded-lg flex-shrink-0',       // Instagram
    'h-9 sm:h-10 w-24 rounded-lg flex-shrink-0',       // WhatsApp
    'h-9 sm:h-10 w-24 rounded-lg flex-shrink-0',       // WhatChimp
    'h-9 sm:h-10 w-20 rounded-lg flex-shrink-0',       // Blacklist
    'h-9 sm:h-10 w-32 rounded-lg flex-shrink-0',       // Google Business
    'h-9 sm:h-10 w-24 rounded-lg flex-shrink-0',       // Facebook
  ];

  return (
    <div className="space-y-6">
      {/* Header - glassmorphism */}
      <SkeletonHeader />

      {/* Platform tab navigation - matches SocialMediaNavigation */}
      <div className="-mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 py-2 sm:py-3 bg-slate-50/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto">
          {tabClasses.map((cls, i) => (
            <Skeleton key={i} className={cls} stagger staggerIndex={i} />
          ))}
        </div>
      </div>

      {/* Default content skeleton (Instagram-like: KPI grid + charts) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i} staggerIndex={i + 2} />
        ))}
      </div>

      {/* Primary chart section */}
      <div className="bg-white dark:bg-space-dust rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="mb-4">
          <SkeletonText width="w-40" height="h-5" stagger staggerIndex={6} />
        </div>
        <SkeletonChartAnimated height="h-64" />
      </div>

      {/* Secondary chart section */}
      <div className="bg-white dark:bg-space-dust rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="mb-4">
          <SkeletonText width="w-36" height="h-5" stagger staggerIndex={7} />
        </div>
        <SkeletonChartAnimated height="h-48" />
      </div>
    </div>
  );
};

// CohortRetentionChartSkeleton — matches CohortRetentionChart.jsx v1.0 (v3.6)
const CohortRetentionChartSkeleton = () => (
  <div className="bg-white/80 dark:bg-space-dust/40 backdrop-blur-xl rounded-xl p-4 sm:p-5 ring-1 ring-slate-200/80 dark:ring-white/[0.05]">
    {/* Header */}
    <div className="flex items-start gap-3 mb-4">
      <Skeleton className="w-9 h-9 rounded-lg" stagger staggerIndex={0} />
      <div className="flex-1 space-y-1.5">
        <SkeletonText width="w-36" height="h-5" stagger staggerIndex={0} />
        <SkeletonText width="w-52" height="h-3" stagger staggerIndex={1} />
      </div>
    </div>
    {/* Triangular heatmap grid — 6 cohort rows × 7 month cols */}
    <div className="overflow-x-auto">
      <div className="min-w-[400px] space-y-1">
        {/* Column headers */}
        <div className="grid gap-1" style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}>
          <div />
          {['M+0', 'M+1', 'M+2', 'M+3', 'M+4', 'M+5', 'M+6'].map((_, i) => (
            <SkeletonText key={i} width="w-full" height="h-4" stagger staggerIndex={Math.min(1 + i, 7)} />
          ))}
        </div>
        {/* Cohort rows (triangular — fewer cells per older cohort) */}
        {[7, 6, 5, 4, 3, 2].map((cols, row) => (
          <div key={row} className="grid gap-1" style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}>
            <SkeletonText width="w-16" height="h-7" stagger staggerIndex={Math.min(2 + row, 7)} />
            {[...Array(7)].map((_, col) => (
              <div key={col}>
                {col < cols ? (
                  <Skeleton className="h-7 rounded" stagger staggerIndex={Math.min(2 + row, 7)} />
                ) : (
                  <div className="h-7" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
    {/* Legend */}
    <div className="flex items-center justify-center gap-3 mt-3">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-1">
          <Skeleton className="w-3 h-3 rounded" stagger staggerIndex={Math.min(5 + i, 7)} />
          <SkeletonText width="w-8" height="h-3" stagger staggerIndex={Math.min(5 + i, 7)} />
        </div>
      ))}
    </div>
  </div>
);

// RFMScatterPlotSkeleton - scatter chart with quadrants (v3.4)
// Matches RFMScatterPlot.jsx v5.8.1 layout
const RFMScatterPlotSkeleton = () => (
  <div className={`
    relative bg-white/80 dark:bg-space-dust/40
    backdrop-blur-xl rounded-2xl p-4 sm:p-5
    ring-1 ring-slate-200/80 dark:ring-white/[0.05]
  `}>
    {/* Header with icon and at-risk pill */}
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
      <div className="flex items-center gap-2.5">
        <Skeleton className="w-10 h-10 rounded-xl" stagger staggerIndex={0} />
        <div className="space-y-1">
          <SkeletonText width="w-36" height="h-5" stagger staggerIndex={0} />
          <SkeletonText width="w-52" height="h-3" stagger staggerIndex={1} />
        </div>
      </div>
      {/* At-risk pill placeholder */}
      <Skeleton className="h-9 w-28 rounded-full" stagger staggerIndex={1} />
    </div>

    {/* Legend row */}
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
      {['Saudável', 'Em Risco', 'Crítico'].map((_, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <Skeleton className="w-2.5 h-2.5 rounded-full" stagger staggerIndex={2} />
          <SkeletonText width="w-14" height="h-3" stagger staggerIndex={2 + i} />
        </div>
      ))}
      <div className="pl-2 border-l border-slate-300 dark:border-slate-600 flex items-center gap-1.5">
        <Skeleton className="w-3 h-3 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-500" stagger staggerIndex={4} />
        <SkeletonText width="w-20" height="h-3" stagger staggerIndex={4} />
      </div>
    </div>

    {/* Toolbar row */}
    <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700 mb-4">
      <Skeleton className="h-8 w-20 rounded-lg" stagger staggerIndex={5} />
      <div className="flex items-center gap-1">
        <Skeleton className="h-8 w-8 rounded-lg" stagger staggerIndex={5} />
        <SkeletonText width="w-8" height="h-4" stagger staggerIndex={5} />
        <Skeleton className="h-8 w-8 rounded-lg" stagger staggerIndex={5} />
      </div>
    </div>

    {/* Chart area with scatter dots */}
    <div className="h-[280px] sm:h-[350px] lg:h-[420px] relative bg-slate-50 dark:bg-space-dust/30 rounded-xl overflow-hidden">
      {/* Grid lines */}
      <div className="absolute inset-4 border-l border-b border-slate-200 dark:border-slate-700" />

      {/* Danger zone shaded area */}
      <div className="absolute right-0 top-0 bottom-0 w-1/4 bg-red-50/50 dark:bg-red-900/10" />

      {/* Reference line */}
      <div className="absolute right-1/4 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-red-300 dark:border-red-700" />

      {/* Scatter dots - distributed across the chart */}
      {[...Array(25)].map((_, i) => {
        const sizes = ['w-3 h-3', 'w-4 h-4', 'w-5 h-5'];
        return (
          <SkeletonCircle
            key={i}
            size={sizes[i % 3]}
            className="absolute"
            stagger
            staggerIndex={Math.min(5 + Math.floor(i / 5), 7)}
            style={{
              left: `${8 + (i * 3.5) % 85}%`,
              top: `${10 + (i * 7) % 75}%`,
            }}
          />
        );
      })}
    </div>
  </div>
);

// VisitHeatmapSkeleton - calendar heatmap grid (v3.4)
// Matches VisitHeatmap.jsx v3.4.0 layout
const VisitHeatmapSkeleton = () => (
  <div className={`
    bg-white/80 dark:bg-space-dust/40
    backdrop-blur-xl rounded-2xl
    ring-1 ring-slate-200/80 dark:ring-white/[0.05]
    px-3 py-3 sm:px-4 sm:py-4
  `}>
    {/* Header with segment toggle */}
    <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
      <div className="flex items-center gap-2.5">
        <Skeleton className="w-10 h-10 rounded-xl" stagger staggerIndex={0} />
        <div className="space-y-1">
          <SkeletonText width="w-28" height="h-5" stagger staggerIndex={0} />
          {/* Inline legend */}
          <div className="hidden sm:flex items-center gap-1">
            <SkeletonText width="w-6" height="h-2.5" stagger staggerIndex={1} />
            <div className="flex items-center gap-0.5">
              {[6, 8, 10, 12].map((s, i) => (
                <Skeleton key={i} className="rounded-sm" style={{ width: s, height: s }} />
              ))}
            </div>
            <SkeletonText width="w-6" height="h-2.5" stagger staggerIndex={1} />
          </div>
        </div>
      </div>
      {/* Segment toggle */}
      <Skeleton className="h-8 w-36 rounded-lg" stagger staggerIndex={1} />
    </div>

    {/* Peak indicator */}
    <SkeletonText width="w-44" height="h-3" className="mb-2" stagger staggerIndex={1} />

    {/* Heatmap grid - 7 days x 15 hours */}
    <div className="space-y-0.5">
      {/* Hour headers row */}
      <div className="grid gap-0.5" style={{ gridTemplateColumns: '32px repeat(15, 1fr)' }}>
        <div /> {/* Empty corner */}
        {[...Array(15)].map((_, i) => (
          <Skeleton key={i} className="h-3 rounded" stagger staggerIndex={Math.min(2 + Math.floor(i / 4), 7)} />
        ))}
      </div>

      {/* 7 day rows with cells */}
      {[...Array(7)].map((_, row) => (
        <div key={row} className="grid gap-0.5" style={{ gridTemplateColumns: '32px repeat(15, 1fr)' }}>
          {/* Day label */}
          <Skeleton className="h-6 sm:h-8 w-8 rounded" stagger staggerIndex={Math.min(2 + row, 7)} />
          {/* Hour cells with variable sizes */}
          {[...Array(15)].map((_, col) => {
            const sizeVariant = (row + col) % 4;
            const sizes = [6, 10, 14, 18];
            return (
              <div key={col} className="h-6 sm:h-8 flex items-center justify-center">
                <Skeleton
                  className="rounded-lg"
                  style={{
                    width: sizes[sizeVariant],
                    height: sizes[sizeVariant]
                  }}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>

    {/* Mobile legend */}
    <div className="sm:hidden mt-1.5 flex items-center justify-center gap-1">
      <SkeletonText width="w-6" height="h-3" />
      <div className="flex items-center gap-0.5">
        {[6, 8, 10, 12].map((s, i) => (
          <Skeleton key={i} className="rounded-sm" style={{ width: s, height: s }} />
        ))}
      </div>
      <SkeletonText width="w-6" height="h-3" />
    </div>

    {/* Footer date range */}
    <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700/50 text-center">
      <SkeletonText width="w-32" height="h-2.5" className="mx-auto" stagger staggerIndex={7} />
    </div>
  </div>
);

// InsightsLoadingSkeleton - matches Insights.jsx v2.0 + InsightsView.jsx v4.0 (v3.5)
// Celestial Intelligence Command: header + category pills + AI panel + priority cards
const InsightsLoadingSkeleton = () => (
  <div className="space-y-6 sm:space-y-8">
    {/* Header — icon + title + help button + StaleDataIndicator */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-3">
        {/* Glassmorphism icon container */}
        <Skeleton
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex-shrink-0"
          stagger staggerIndex={0}
        />
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <SkeletonText width="w-24 sm:w-28" height="h-5 sm:h-6" stagger staggerIndex={0} />
            {/* Help button placeholder */}
            <Skeleton className="w-3.5 h-3.5 rounded-full" stagger staggerIndex={0} />
          </div>
          <SkeletonText width="w-48 sm:w-60" height="h-2.5 sm:h-3" stagger staggerIndex={0} />
        </div>
      </div>
      {/* StaleDataIndicator placeholder */}
      <SkeletonText width="w-20" height="h-6" className="rounded-full hidden sm:block" stagger staggerIndex={1} />
    </div>

    {/* InsightsView container */}
    <div className="rounded-2xl border overflow-hidden bg-white dark:bg-space-dust/60 border-slate-200 dark:border-stellar-cyan/10">
      {/* Top-edge accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-200/40 dark:via-stellar-cyan/20 to-transparent" />

      {/* Glassmorphic category filter pills */}
      <div className="flex items-center gap-1.5 px-4 pt-4 pb-3 overflow-x-auto">
        {[
          { w: 'w-16', active: true },
          { w: 'w-24' },
          { w: 'w-18' },
          { w: 'w-20' },
          { w: 'w-24' },
          { w: 'w-12' },
        ].map((pill, i) => (
          <Skeleton
            key={i}
            className={`h-9 ${pill.w || 'w-20'} rounded-xl flex-shrink-0 ${
              pill.active ? 'ring-1 ring-slate-200/50 dark:ring-stellar-cyan/15' : ''
            }`}
            stagger
            staggerIndex={Math.min(1 + i, 7)}
          />
        ))}
      </div>

      {/* Summary metrics strip */}
      <div className="flex items-center gap-3 px-4 pb-3">
        <div className="flex items-center gap-1">
          <Skeleton className="w-1.5 h-1.5 rounded-full" />
          <SkeletonText width="w-14" height="h-3" stagger staggerIndex={2} />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="w-3 h-3 rounded" />
          <SkeletonText width="w-16" height="h-3" stagger staggerIndex={2} />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="w-3 h-3 rounded" />
          <SkeletonText width="w-10" height="h-3" stagger staggerIndex={3} />
        </div>
      </div>

      {/* Dedicated AI Panel — glassmorphic */}
      <div className="px-4 pb-3">
        <div className="rounded-xl border overflow-hidden bg-slate-50/80 dark:bg-gradient-to-br dark:from-purple-500/[0.03] dark:via-space-dust dark:to-space-dust border-slate-200/50 dark:border-purple-500/15">
          <div className="flex items-center gap-3 p-3.5">
            {/* Brain icon container */}
            <Skeleton
              className="w-9 h-9 rounded-xl flex-shrink-0"
              stagger staggerIndex={3}
            />
            {/* Title + status */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <SkeletonText width="w-24" height="h-3.5" stagger staggerIndex={3} />
              <SkeletonText width="w-32" height="h-3" stagger staggerIndex={4} />
            </div>
            {/* Gerar button */}
            <Skeleton
              className="h-8 w-20 rounded-lg flex-shrink-0"
              stagger staggerIndex={4}
            />
          </div>
        </div>
      </div>

      {/* Insight card skeletons with bottom accent stripes */}
      <div className="px-4 pb-4 space-y-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`
              relative rounded-xl border overflow-hidden p-3.5
              bg-white dark:bg-space-dust/80
              border-slate-200 dark:border-stellar-cyan/5
            `}
          >
            {/* Bottom accent stripe placeholder */}
            <Skeleton
              className="absolute bottom-0 left-0 right-0 h-[2px]"
              stagger staggerIndex={Math.min(4 + i, 7)}
            />
            {/* Card content */}
            <div className="flex gap-2.5">
              {/* Icon container */}
              <Skeleton
                className="w-8 h-8 rounded-xl flex-shrink-0 mt-0.5"
                stagger staggerIndex={Math.min(4 + i, 7)}
              />
              <div className="flex-1 space-y-2">
                {/* Title row with badge */}
                <div className="flex items-center gap-1.5">
                  <SkeletonText width="w-3/5" height="h-3.5" stagger staggerIndex={Math.min(5 + i, 7)} />
                  {i === 0 && (
                    <Skeleton className="h-4 w-14 rounded-full flex-shrink-0" stagger staggerIndex={5} />
                  )}
                </div>
                {/* Description lines */}
                <SkeletonText width="w-full" height="h-3" stagger staggerIndex={Math.min(5 + i, 7)} />
                <SkeletonText width="w-4/5" height="h-3" stagger staggerIndex={Math.min(6 + i, 7)} />
                {/* Action buttons row */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <Skeleton
                    className="h-7 w-28 rounded-lg"
                    stagger staggerIndex={Math.min(6 + i, 7)}
                  />
                  <Skeleton
                    className="h-7 w-16 rounded-lg"
                    stagger staggerIndex={Math.min(6 + i, 7)}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// PriorityMatrixSkeleton - 4-quadrant business scoring (v3.4)
// Matches PriorityMatrix.jsx v3.5.0 layout
const PriorityMatrixSkeleton = () => (
  <div className={`
    bg-white/80 dark:bg-space-dust/40
    backdrop-blur-xl rounded-2xl p-5
    ring-1 ring-slate-200/80 dark:ring-white/[0.05]
  `}>
    {/* Header */}
    <div className="flex items-start gap-3 mb-5">
      <Skeleton className="w-10 h-10 rounded-xl" stagger staggerIndex={0} />
      <div className="space-y-1">
        <SkeletonText width="w-40" height="h-5" stagger staggerIndex={0} />
        <SkeletonText width="w-28" height="h-3" stagger staggerIndex={1} />
      </div>
    </div>

    {/* Hero Section - Overall Score with Radial Gauge */}
    <div className="flex flex-col items-center mb-5 p-6 lg:p-8 bg-slate-50 dark:bg-space-dust/60 rounded-2xl">
      <SkeletonText width="w-24" height="h-4" className="mb-4" stagger staggerIndex={1} />

      {/* Radial gauge placeholder */}
      <div className="relative w-[160px] h-[160px] lg:w-[200px] lg:h-[200px]">
        {/* Outer ring */}
        <Skeleton className="w-full h-full rounded-full" stagger staggerIndex={2} />
        {/* Inner content */}
        <div className="absolute inset-4 flex flex-col items-center justify-center bg-white dark:bg-space-dust rounded-full">
          <SkeletonText width="w-14" height="h-10" stagger staggerIndex={3} />
          <SkeletonText width="w-8" height="h-3" className="mt-1" stagger staggerIndex={3} />
        </div>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-1.5 mt-4">
        <SkeletonCircle size="w-4 h-4" stagger staggerIndex={4} />
        <SkeletonText width="w-16" height="h-4" stagger staggerIndex={4} />
      </div>
    </div>

    {/* Dimension Grid - 4 cards with mini arcs */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-5">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl p-3 bg-slate-50 dark:bg-space-dust/60 flex flex-col items-center text-center">
          {/* Mini arc gauge */}
          <Skeleton className="w-[60px] lg:w-[70px] h-[35px] rounded mt-1" stagger staggerIndex={Math.min(4 + i, 7)} />

          {/* Score */}
          <div className="flex items-baseline gap-0.5 mt-1">
            <SkeletonText width="w-8" height="h-6" stagger staggerIndex={Math.min(5 + i, 7)} />
            <SkeletonText width="w-4" height="h-3" stagger staggerIndex={Math.min(5 + i, 7)} />
          </div>

          {/* Label */}
          <SkeletonText width="w-20" height="h-3" className="mt-1" stagger staggerIndex={Math.min(5 + i, 7)} />

          {/* Status with icon */}
          <div className="flex items-center gap-1 mt-1">
            <SkeletonCircle size="w-3 h-3" stagger staggerIndex={Math.min(6 + i, 7)} />
            <SkeletonText width="w-12" height="h-3" stagger staggerIndex={Math.min(6 + i, 7)} />
          </div>
        </div>
      ))}
    </div>

    {/* Priority Focus Alert */}
    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200 dark:ring-red-500/30 relative overflow-hidden">
      {/* Animated stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 via-rose-500 to-red-500" />

      <div className="flex items-center gap-4 ml-2">
        <div className="flex-1 min-w-0">
          <SkeletonText width="w-48" height="h-5" stagger staggerIndex={7} />
          <SkeletonText width="w-40" height="h-3" className="mt-1" stagger staggerIndex={7} />
        </div>
        <Skeleton className="w-16 h-10 rounded-lg shrink-0" stagger staggerIndex={7} />
      </div>
    </div>
  </div>
);

export {
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  SkeletonCard,
  SkeletonChart,
  SkeletonChartAnimated,
  SkeletonSection,
  SkeletonTableRow,
  SkeletonHeader,
  SkeletonHeroCard,
  // View-specific skeletons
  InsightsLoadingSkeleton,
  IntelligenceLoadingSkeleton,
  DashboardLoadingSkeleton,
  CustomersLoadingSkeleton,
  DirectoryLoadingSkeleton,
  CampaignsLoadingSkeleton,
  SocialMediaLoadingSkeleton,
  WeatherLoadingSkeleton,
  OperationsLoadingSkeleton,
  // Component-specific skeletons (v3.4+)
  RFMScatterPlotSkeleton,
  VisitHeatmapSkeleton,
  PriorityMatrixSkeleton,
  CollapsibleSectionSkeleton,
  CohortRetentionChartSkeleton,
};

export default Skeleton;
