// OPERATIONS KPI CARDS V6.3.0 - AUDIT FIXES APPLIED
// ✅ Math: Absolute pp trend change (not relative %)
// ✅ Math: Capacity adapts to date window (partial week support)
// ✅ Math: Service diff hidden for currentWeek (partial vs full unfair)
// ✅ UX: Progress bar scaled to 50% max (25% = excellent visual)
// ✅ UX: Subtle threshold legend (footnote style)
// ✅ UX: Simplified card layout (cleaner, less overload)
// ✅ UX: Comparison label adapts to dateWindow
// ✅ Design System: Minimum 12px fonts (no text-[9px] or text-[10px])
// ✅ Mobile: Responsive text sizing with sm: breakpoints
// ✅ Accessibility: Proper color contrast and touch targets
//
// CHANGELOG:
// v6.3.0 (2025-11-30): Fix partial week comparison display
//   - Added showServiceDiff flag to periodConfig (false for currentWeek)
//   - Utilization % trend still shown (normalized by activeDays = fair)
//   - Service count diff hidden for currentWeek (partial vs full week unfair)
// v6.2.1 (2025-11-30): Legend spacing + mobile overflow fix
//   - Added bottom margin to container (mb-4 sm:mb-6) for section separation
//   - Reduced mobile gap (gap-x-2 sm:gap-x-4) to prevent overflow
//   - Hide percentage values on mobile (show only labels: Excelente, Bom, etc.)
//   - Added pb-2 for proper internal spacing
// v6.2.0 (2025-11-30): Legend layout refinement
//   - Removed intrusive "Metas:" label with Info icon
//   - Smaller dot indicators (w-2 → w-1.5)
//   - Subtle footnote style (text-slate-500, pt-2 spacing)
//   - Removed redundant font scaling (text-xs only, no sm:text-sm)
// v6.1.0 (2025-11-30): Threshold unification
//   - Import UTILIZATION_THRESHOLDS from operationsMetrics.js (single source of truth)
//   - Removed local THRESHOLDS definition
// v6.0.0 (2025-11-30): Comprehensive audit fixes
//   - MATH: Trend now shows absolute percentage point change (+5pp)
//   - MATH: Capacity calculation adapts to activeDays in date window
//   - UX: Progress bar uses 50% scale (25% fills half = visually "excellent")
//   - UX: Added threshold legend below progress bar
//   - UX: Removed redundant insight box (moved to tooltip on hover)
//   - UX: Comparison label now dynamic based on dateWindow
//   - DESIGN: All fonts minimum 12px (text-xs), responsive with sm:text-sm
//   - MOBILE: Better spacing, readable text, touch-friendly
// v5.0.0 (2025-11-26): Design System alignment

import React, { useMemo } from 'react';
import { Droplet, Flame, Gauge, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BUSINESS_PARAMS, UTILIZATION_THRESHOLDS } from '../utils/operationsMetrics';

// Use shared thresholds from operationsMetrics.js
const THRESHOLDS = UTILIZATION_THRESHOLDS;

// Progress bar scale - 50% max so 25% fills half the bar (visually "good")
const PROGRESS_BAR_SCALE = 50;

// Calculate operating hours per day from BUSINESS_PARAMS
const OPERATING_HOURS_PER_DAY = BUSINESS_PARAMS.OPERATING_HOURS.end - BUSINESS_PARAMS.OPERATING_HOURS.start;

/**
 * Calculate capacity for a given number of days (not just weekly)
 */
const getCapacityForDays = (days) => {
  const cyclesPerDayWash = BUSINESS_PARAMS.TOTAL_WASHERS *
    (60 / BUSINESS_PARAMS.WASHER_CYCLE_MINUTES) *
    OPERATING_HOURS_PER_DAY *
    BUSINESS_PARAMS.EFFICIENCY_FACTOR;

  const cyclesPerDayDry = BUSINESS_PARAMS.TOTAL_DRYERS *
    (60 / BUSINESS_PARAMS.DRYER_CYCLE_MINUTES) *
    OPERATING_HOURS_PER_DAY *
    BUSINESS_PARAMS.EFFICIENCY_FACTOR;

  return {
    washers: Math.round(cyclesPerDayWash * days),
    dryers: Math.round(cyclesPerDayDry * days),
    total: Math.round((cyclesPerDayWash + cyclesPerDayDry) * days)
  };
};

const OperationsKPICards = ({
  businessMetrics,
  operationsMetrics,
  previousWeekMetrics,
  dateWindow = 'currentWeek'
}) => {
  // Get adaptive labels and comparison text based on date filter
  const periodConfig = useMemo(() => {
    switch(dateWindow) {
      case 'currentWeek':
        return {
          current: 'Semana Atual',
          previous: 'Semana Passada',
          comparison: 'vs sem. passada',
          showComparison: true,
          // Service diff hidden: partial week vs full week is unfair
          // Utilization % still shown (normalized by activeDays)
          showServiceDiff: false,
          days: operationsMetrics?.utilization?.activeDays || 7
        };
      case 'lastWeek':
        return {
          current: 'Semana Passada',
          previous: 'Semana Anterior',
          comparison: 'vs sem. anterior',
          showComparison: true,
          showServiceDiff: true,
          days: 7
        };
      case 'last4Weeks':
        return {
          current: 'Últimas 4 Semanas',
          previous: '4 Sem. Anteriores',
          comparison: 'vs 4 sem. anteriores',
          showComparison: true,
          showServiceDiff: true,
          days: 28
        };
      case 'allTime':
        return {
          current: 'Todo Período',
          previous: null,
          comparison: null,
          showComparison: false,
          showServiceDiff: false,
          days: operationsMetrics?.utilization?.activeDays || 30
        };
      default:
        return {
          current: 'Período Atual',
          previous: 'Período Anterior',
          comparison: 'vs período anterior',
          showComparison: true,
          showServiceDiff: true,
          days: 7
        };
    }
  }, [dateWindow, operationsMetrics?.utilization?.activeDays]);

  // Calculate capacity based on actual days in period
  const capacity = useMemo(() => {
    return getCapacityForDays(periodConfig.days);
  }, [periodConfig.days]);

  // Get current period data from operationsMetrics
  const currentData = useMemo(() => {
    if (!operationsMetrics?.utilization) return null;

    const util = operationsMetrics.utilization;
    return {
      wash: {
        utilization: util.washUtilization || 0,
        services: util.totalWashServices || 0,
        peak: util.peak?.washUtilization || 0,
        offPeak: util.offPeak?.washUtilization || 0
      },
      dry: {
        utilization: util.dryUtilization || 0,
        services: util.totalDryServices || 0,
        peak: util.peak?.dryUtilization || 0,
        offPeak: util.offPeak?.dryUtilization || 0
      },
      total: {
        utilization: util.totalUtilization || 0,
        services: util.totalServices || 0,
        peak: util.peak?.totalUtilization || 0,
        offPeak: util.offPeak?.totalUtilization || 0
      },
      activeDays: util.activeDays || periodConfig.days
    };
  }, [operationsMetrics, periodConfig.days]);

  // Get previous period data
  const previousData = useMemo(() => {
    if (!previousWeekMetrics?.utilization) return null;

    const util = previousWeekMetrics.utilization;
    return {
      wash: { utilization: util.washUtilization || 0, services: util.totalWashServices || 0 },
      dry: { utilization: util.dryUtilization || 0, services: util.totalDryServices || 0 },
      total: { utilization: util.totalUtilization || 0, services: util.totalServices || 0 }
    };
  }, [previousWeekMetrics]);

  // Calculate trends with ABSOLUTE percentage point change (not relative %)
  const trends = useMemo(() => {
    if (!currentData || !previousData) return { wash: null, dry: null, total: null };

    const calculateTrend = (current, previous) => {
      if (previous === null || previous === undefined) return null;
      const absoluteChange = current - previous; // Percentage point change
      return {
        absolutePP: absoluteChange,  // e.g., 25% - 20% = +5pp
        direction: absoluteChange > 0 ? 'up' : absoluteChange < 0 ? 'down' : 'stable'
      };
    };

    return {
      wash: calculateTrend(currentData.wash.utilization, previousData.wash.utilization),
      dry: calculateTrend(currentData.dry.utilization, previousData.dry.utilization),
      total: calculateTrend(currentData.total.utilization, previousData.total.utilization)
    };
  }, [currentData, previousData]);

  if (!currentData) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-600 dark:text-slate-400">
        <div className="animate-pulse">Carregando métricas...</div>
      </div>
    );
  }

  // Status determination with threshold-based styling
  const getStatus = (utilization) => {
    if (utilization >= THRESHOLDS.excellent) return {
      label: 'Excelente',
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
      gradientFrom: 'from-emerald-500',
      gradientTo: 'to-green-500',
      borderClass: 'border-emerald-400 dark:border-emerald-500'
    };
    if (utilization >= THRESHOLDS.good) return {
      label: 'Bom',
      colorClass: 'text-teal-600 dark:text-teal-400',
      bgClass: 'bg-teal-100 dark:bg-teal-900/30',
      gradientFrom: 'from-teal-500',
      gradientTo: 'to-cyan-500',
      borderClass: 'border-teal-400 dark:border-teal-500'
    };
    if (utilization >= THRESHOLDS.fair) return {
      label: 'Razoável',
      colorClass: 'text-amber-600 dark:text-amber-400',
      bgClass: 'bg-amber-100 dark:bg-amber-900/30',
      gradientFrom: 'from-amber-500',
      gradientTo: 'to-orange-500',
      borderClass: 'border-amber-400 dark:border-amber-500'
    };
    return {
      label: 'Baixo',
      colorClass: 'text-red-600 dark:text-red-400',
      bgClass: 'bg-red-100 dark:bg-red-900/30',
      gradientFrom: 'from-red-500',
      gradientTo: 'to-rose-500',
      borderClass: 'border-red-400 dark:border-red-500'
    };
  };

  // Trend indicator with ABSOLUTE pp change display
  const getTrendIndicator = (trend) => {
    if (!trend) return null;

    const pp = trend.absolutePP;
    if (Math.abs(pp) < 0.5) return null; // Skip if negligible change

    const isPositive = pp > 0;
    const displayText = `${isPositive ? '+' : ''}${pp.toFixed(0)}pp`;

    if (pp > 2) {
      return {
        Icon: TrendingUp,
        colorClass: 'text-emerald-600 dark:text-emerald-400',
        text: displayText
      };
    }
    if (pp < -2) {
      return {
        Icon: TrendingDown,
        colorClass: 'text-red-600 dark:text-red-400',
        text: displayText
      };
    }
    return {
      Icon: Minus,
      colorClass: 'text-slate-500 dark:text-slate-400',
      text: displayText
    };
  };

  // Service count formatter
  const formatServices = (current, previous) => {
    const diff = current - (previous || 0);
    return {
      current,
      previous: previous || 0,
      diff,
      text: diff !== 0 ? `${diff > 0 ? '+' : ''}${diff}` : null
    };
  };

  const washStatus = getStatus(currentData.wash.utilization);
  const dryStatus = getStatus(currentData.dry.utilization);
  const totalStatus = getStatus(currentData.total.utilization);

  const washTrend = getTrendIndicator(trends.wash);
  const dryTrend = getTrendIndicator(trends.dry);
  const totalTrend = getTrendIndicator(trends.total);

  const washServices = formatServices(currentData.wash.services, previousData?.wash.services);
  const dryServices = formatServices(currentData.dry.services, previousData?.dry.services);

  // KPI Card Component (simplified, cleaner)
  const KPICard = ({
    title,
    icon: CardIcon,
    utilization,
    status,
    services,
    trend,
    maxCapacity,
    machineCount
  }) => {
    // Scale progress to 50% max so 25% = half filled (visually "good")
    const scaledProgress = Math.min((utilization / PROGRESS_BAR_SCALE) * 100, 100);

    return (
      <div className={`
        bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5
        border-2 ${status.borderClass}
        shadow-sm hover:shadow-md
        transition-all duration-200
      `}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`
            w-10 h-10 sm:w-11 sm:h-11 rounded-lg ${status.bgClass}
            flex items-center justify-center flex-shrink-0
          `}>
            <CardIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${status.colorClass}`} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {machineCount} máquinas
            </p>
          </div>
        </div>

        {/* Main Metric */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className={`text-3xl sm:text-4xl font-bold ${status.colorClass}`}>
              {utilization.toFixed(0)}%
            </span>
            <span className={`text-sm sm:text-base font-semibold ${status.colorClass}`}>
              {status.label}
            </span>
          </div>

          {/* Trend with absolute pp change */}
          {trend && periodConfig.showComparison && (
            <div className="flex items-center gap-1.5 mt-1">
              <trend.Icon className={`w-4 h-4 ${trend.colorClass}`} aria-hidden="true" />
              <span className={`text-xs sm:text-sm font-medium ${trend.colorClass}`}>
                {trend.text}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {periodConfig.comparison}
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar with 50% scale */}
        <div className="mb-2">
          <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${status.gradientFrom} ${status.gradientTo} transition-all duration-500 rounded-full`}
              style={{ width: `${scaledProgress}%` }}
              role="progressbar"
              aria-valuenow={utilization}
              aria-valuemin={0}
              aria-valuemax={PROGRESS_BAR_SCALE}
            />
          </div>
          {/* Threshold legend - positioned proportionally to 0-50% scale */}
          <div className="relative w-full h-4 mt-1 text-xs text-slate-500 dark:text-slate-500">
            <span className="absolute left-0">0%</span>
            <span className="absolute left-[10%] -translate-x-1/2">5%</span>
            <span className="absolute left-[20%] -translate-x-1/2 text-amber-600 dark:text-amber-400">10%</span>
            <span className="absolute left-[30%] -translate-x-1/2 text-teal-600 dark:text-teal-400">15%</span>
            <span className="absolute left-[40%] -translate-x-1/2 text-emerald-600 dark:text-emerald-400">20%</span>
            <span className="absolute left-[50%] -translate-x-1/2 text-emerald-600 dark:text-emerald-400">25%+</span>
            <span className="absolute right-0">50%</span>
          </div>
        </div>

        {/* Service Counts - simplified */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              {periodConfig.current}:
            </span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {services.current} serviços
              {services.text && periodConfig.showServiceDiff && (
                <span className={`ml-1.5 ${services.diff > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  ({services.text})
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-500 mt-0.5">
            <span>Capacidade ({periodConfig.days}d):</span>
            <span>{maxCapacity} ciclos</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 mb-4 sm:mb-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <KPICard
          title="LAVADORAS"
          icon={Droplet}
          utilization={currentData.wash.utilization}
          status={washStatus}
          services={washServices}
          trend={washTrend}
          maxCapacity={capacity.washers}
          machineCount={BUSINESS_PARAMS.TOTAL_WASHERS}
        />

        <KPICard
          title="SECADORAS"
          icon={Flame}
          utilization={currentData.dry.utilization}
          status={dryStatus}
          services={dryServices}
          trend={dryTrend}
          maxCapacity={capacity.dryers}
          machineCount={BUSINESS_PARAMS.TOTAL_DRYERS}
        />

        <KPICard
          title="UTILIZAÇÃO TOTAL"
          icon={Gauge}
          utilization={currentData.total.utilization}
          status={totalStatus}
          services={{
            current: washServices.current + dryServices.current,
            previous: washServices.previous + dryServices.previous,
            diff: washServices.diff + dryServices.diff,
            text: (washServices.diff + dryServices.diff) !== 0
              ? `${(washServices.diff + dryServices.diff) > 0 ? '+' : ''}${washServices.diff + dryServices.diff}`
              : null
          }}
          trend={totalTrend}
          maxCapacity={capacity.total}
          machineCount={BUSINESS_PARAMS.TOTAL_WASHERS + BUSINESS_PARAMS.TOTAL_DRYERS}
        />
      </div>

      {/* Threshold Legend - Subtle footnote style */}
      <div className="flex flex-wrap items-center justify-center gap-x-2 sm:gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-500 pt-2 pb-2">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span>
          <span className="hidden sm:inline">≥25%</span> Excelente
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500" aria-hidden="true"></span>
          <span className="hidden sm:inline">≥15%</span> Bom
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true"></span>
          <span className="hidden sm:inline">≥10%</span> Razoável
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" aria-hidden="true"></span>
          Baixo
        </span>
      </div>
    </div>
  );
};

export default OperationsKPICards;
