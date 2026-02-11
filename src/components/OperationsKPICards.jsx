// OPERATIONS KPI CARDS V7.0 - COSMIC GLASSMORPHISM
// ✅ Math: Absolute pp trend change (not relative %)
// ✅ Math: Capacity adapts to date window (partial week support)
// ✅ Math: Service diff hidden for currentWeek (partial vs full unfair)
// ✅ UX: Progress bar scaled to 50% max (25% = excellent visual)
// ✅ UX: Subtle threshold legend (footnote style)
// ✅ UX: Glassmorphic card surfaces with status accent stripe
// ✅ UX: Comparison label adapts to dateWindow
// ✅ UX: Skeleton loading matches glassmorphic layout
// ✅ Design System v6.4: Variant D glassmorphism via useTheme()
// ✅ Mobile: Responsive text sizing with sm: breakpoints
// ✅ Accessibility: WCAG AA contrast, solid icon wells, reduced motion
//
// CHANGELOG:
// v7.0 (2026-02-10): Cosmic glassmorphism redesign
//   - Variant D glassmorphic cards (bg-space-dust/50 dark, bg-white/80 light)
//   - useTheme() isDark pattern replaces dark: prefix for card surfaces
//   - Status accent: left stripe + subtle top glow instead of thick border
//   - Glass skeleton loading state
//   - Threshold legend with glass backdrop
// v6.9.1 (2026-01-31): Skeleton loading state
// v6.9.0 (2026-01-29): Yellow to amber color migration
// v6.8.0 (2026-01-29): Migrated orange colors to yellow
// v6.7.0 (2026-01-29): Migrated amber colors to orange
// v6.6.0 (2026-01-28): Solid icon backgrounds for WCAG AA
// v6.5.0 (2026-01-27): Accessibility improvements
// v6.4.0 (2026-01-09): Design System v4.0 Framer Motion compliance
// v6.3.0 (2025-11-30): Fix partial week comparison display
// v6.0.0 (2025-11-30): Comprehensive audit fixes

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Droplet, Flame, Gauge, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BUSINESS_PARAMS, UTILIZATION_THRESHOLDS } from '../utils/operationsMetrics';
import useReducedMotion from '../hooks/useReducedMotion';
import { useTheme } from '../contexts/ThemeContext';
import { TWEEN } from '../constants/animations';

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
  const prefersReducedMotion = useReducedMotion();
  const { isDark } = useTheme();

  // Get adaptive labels and comparison text based on date filter
  const periodConfig = useMemo(() => {
    switch(dateWindow) {
      case 'currentWeek':
        return {
          current: 'Semana Atual',
          previous: 'Semana Passada',
          comparison: 'vs sem. passada',
          showComparison: true,
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
      const absoluteChange = current - previous;
      return {
        absolutePP: absoluteChange,
        direction: absoluteChange > 0 ? 'up' : absoluteChange < 0 ? 'down' : 'stable'
      };
    };

    return {
      wash: calculateTrend(currentData.wash.utilization, previousData.wash.utilization),
      dry: calculateTrend(currentData.dry.utilization, previousData.dry.utilization),
      total: calculateTrend(currentData.total.utilization, previousData.total.utilization)
    };
  }, [currentData, previousData]);

  // Skeleton loading state
  if (!currentData) {
    return (
      <div className="space-y-4 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className={`rounded-xl p-4 sm:p-5 animate-pulse ${
                isDark
                  ? 'bg-space-dust/50 border border-white/[0.06]'
                  : 'bg-white/80 border border-slate-200/60'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg ${isDark ? 'bg-space-elevated/60' : 'bg-slate-200'}`} />
                <div className="flex-1">
                  <div className={`h-4 rounded w-24 mb-1 ${isDark ? 'bg-space-elevated/60' : 'bg-slate-200'}`} />
                  <div className={`h-3 rounded w-16 ${isDark ? 'bg-space-elevated/60' : 'bg-slate-200'}`} />
                </div>
              </div>
              <div className="mb-3">
                <div className={`h-9 rounded w-20 mb-2 ${isDark ? 'bg-space-elevated/60' : 'bg-slate-200'}`} />
                <div className={`h-3 rounded w-32 ${isDark ? 'bg-space-elevated/60' : 'bg-slate-200'}`} />
              </div>
              <div className={`h-2.5 rounded-full mb-6 ${isDark ? 'bg-space-elevated/60' : 'bg-slate-200'}`} />
              <div className={`pt-2 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-200/60'}`}>
                <div className={`h-3 rounded w-full mb-1 ${isDark ? 'bg-space-elevated/60' : 'bg-slate-200'}`} />
                <div className={`h-3 rounded w-3/4 ${isDark ? 'bg-space-elevated/60' : 'bg-slate-200'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Status determination with threshold-based styling
  const getStatus = (utilization) => {
    if (utilization >= THRESHOLDS.excellent) return {
      label: 'Excelente',
      colorClass: isDark ? 'text-emerald-400' : 'text-emerald-600',
      bgClass: isDark ? 'bg-emerald-500' : 'bg-emerald-600',
      iconColorClass: 'text-white',
      gradientFrom: 'from-emerald-500',
      gradientTo: 'to-green-500',
      accentColor: isDark ? '#10b981' : '#059669',
      glowColor: 'rgba(16, 185, 129, 0.15)',
    };
    if (utilization >= THRESHOLDS.good) return {
      label: 'Bom',
      colorClass: isDark ? 'text-teal-400' : 'text-teal-600',
      bgClass: isDark ? 'bg-teal-500' : 'bg-teal-600',
      iconColorClass: 'text-white',
      gradientFrom: 'from-teal-500',
      gradientTo: 'to-cyan-500',
      accentColor: isDark ? '#14b8a6' : '#0d9488',
      glowColor: 'rgba(20, 184, 166, 0.15)',
    };
    if (utilization >= THRESHOLDS.fair) return {
      label: 'Razoável',
      colorClass: isDark ? 'text-amber-400' : 'text-amber-600',
      bgClass: isDark ? 'bg-amber-500' : 'bg-amber-600',
      iconColorClass: 'text-white',
      gradientFrom: 'from-amber-500',
      gradientTo: 'to-amber-600',
      accentColor: isDark ? '#f59e0b' : '#d97706',
      glowColor: 'rgba(245, 158, 11, 0.15)',
    };
    return {
      label: 'Baixo',
      colorClass: isDark ? 'text-red-400' : 'text-red-600',
      bgClass: isDark ? 'bg-red-500' : 'bg-red-600',
      iconColorClass: 'text-white',
      gradientFrom: 'from-red-500',
      gradientTo: 'to-rose-500',
      accentColor: isDark ? '#ef4444' : '#dc2626',
      glowColor: 'rgba(239, 68, 68, 0.15)',
    };
  };

  // Trend indicator with ABSOLUTE pp change display
  const getTrendIndicator = (trend) => {
    if (!trend) return null;

    const pp = trend.absolutePP;
    if (Math.abs(pp) < 0.5) return null;

    const displayText = `${pp > 0 ? '+' : ''}${pp.toFixed(0)}pp`;

    if (pp > 2) {
      return {
        Icon: TrendingUp,
        colorClass: isDark ? 'text-emerald-400' : 'text-emerald-600',
        text: displayText
      };
    }
    if (pp < -2) {
      return {
        Icon: TrendingDown,
        colorClass: isDark ? 'text-red-400' : 'text-red-600',
        text: displayText
      };
    }
    return {
      Icon: Minus,
      colorClass: isDark ? 'text-slate-400' : 'text-slate-500',
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

  // Glassmorphic KPI Card Component
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
    const scaledProgress = Math.min((utilization / PROGRESS_BAR_SCALE) * 100, 100);

    return (
      <motion.div
        whileHover={prefersReducedMotion ? {} : { y: -2 }}
        transition={prefersReducedMotion ? { duration: 0 } : TWEEN.HOVER}
        className={`relative overflow-hidden rounded-xl p-4 sm:p-5 ${
          isDark
            ? 'bg-space-dust/50 border border-white/[0.06] hover:border-white/10'
            : 'bg-white/80 border border-slate-200/60 hover:border-slate-300 shadow-sm hover:shadow-md'
        } transition-colors duration-200`}
      >
        {/* Status accent — left stripe */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px]"
          style={{ backgroundColor: status.accentColor }}
        />

        {/* Subtle top glow from status color */}
        <div
          className="absolute top-0 left-0 right-0 h-16 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, ${status.glowColor}, transparent)`
          }}
        />

        {/* Card content */}
        <div className="relative">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className={`
              w-10 h-10 sm:w-11 sm:h-11 rounded-lg ${status.bgClass}
              flex items-center justify-center flex-shrink-0
            `}>
              <CardIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${status.iconColorClass}`} />
            </div>
            <div className="min-w-0">
              <h3 className={`text-sm sm:text-base font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {title}
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
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

            {trend && periodConfig.showComparison && (
              <div className="flex items-center gap-1.5 mt-1">
                <trend.Icon className={`w-4 h-4 ${trend.colorClass}`} aria-hidden="true" />
                <span className={`text-xs sm:text-sm font-medium ${trend.colorClass}`}>
                  {trend.text}
                </span>
                <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {periodConfig.comparison}
                </span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className={`w-full h-2.5 rounded-full overflow-hidden ${
              isDark ? 'bg-white/[0.06]' : 'bg-slate-200'
            }`}>
              <div
                className={`h-full bg-gradient-to-r ${status.gradientFrom} ${status.gradientTo} transition-all duration-500 rounded-full`}
                style={{ width: `${scaledProgress}%` }}
                role="progressbar"
                aria-valuenow={utilization}
                aria-valuemin={0}
                aria-valuemax={PROGRESS_BAR_SCALE}
              />
            </div>
            {/* Threshold markers */}
            <div className={`relative w-full h-4 mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              <span className="absolute left-0">0%</span>
              <span className="absolute left-[10%] -translate-x-1/2">5%</span>
              <span className={`absolute left-[20%] -translate-x-1/2 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>10%</span>
              <span className={`absolute left-[30%] -translate-x-1/2 ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>15%</span>
              <span className={`absolute left-[40%] -translate-x-1/2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>20%</span>
              <span className={`absolute left-[50%] -translate-x-1/2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>25%+</span>
              <span className="absolute right-0">50%</span>
            </div>
          </div>

          {/* Service Counts */}
          <div className={`pt-2 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-200/60'}`}>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                {periodConfig.current}:
              </span>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {services.current} serviços
                {services.text && periodConfig.showServiceDiff && (
                  <span className={`ml-1.5 ${services.diff > 0
                    ? (isDark ? 'text-emerald-400' : 'text-emerald-600')
                    : (isDark ? 'text-red-400' : 'text-red-600')
                  }`}>
                    ({services.text})
                  </span>
                )}
              </span>
            </div>
            <div className={`flex items-center justify-between text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              <span>Capacidade ({periodConfig.days}d):</span>
              <span>{maxCapacity} ciclos</span>
            </div>
          </div>
        </div>
      </motion.div>
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

      {/* Threshold Legend */}
      <div className={`flex flex-wrap items-center justify-center gap-x-2 sm:gap-x-4 gap-y-1 text-xs pt-2 pb-2 ${
        isDark ? 'text-slate-500' : 'text-slate-400'
      }`}>
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
