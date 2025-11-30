// Skeleton.jsx v1.0
// Skeleton loading components for better UX
// Design System v3.0 compliant
//
// CHANGELOG:
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

// Full page loading skeleton for Intelligence
const IntelligenceLoadingSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header skeleton */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <SkeletonText width="w-24" height="h-6" className="rounded-full" />
              <SkeletonText width="w-40" height="h-4" />
            </div>
            <SkeletonText width="w-64" height="h-10" />
            <SkeletonText width="w-96 max-w-full" height="h-4" />
          </div>
          <Skeleton className="w-32 h-10 rounded-lg" />
        </div>
      </div>

      {/* Quick stats skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Sections skeleton */}
      <SkeletonSection className="mb-6 sm:mb-8" />
      <SkeletonSection className="mb-6 sm:mb-8" />
    </div>
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
  IntelligenceLoadingSkeleton
};

export default Skeleton;
