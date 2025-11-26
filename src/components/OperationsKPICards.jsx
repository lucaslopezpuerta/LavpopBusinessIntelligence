// OPERATIONS KPI CARDS V5.0.0 - DESIGN SYSTEM ALIGNED
// ✅ Tailwind CSS styling (Design System v3.0)
// ✅ Dark mode support
// ✅ Replaced emojis with Lucide React icons
// ✅ Gradient backgrounds for KPI cards
// ✅ Business-appropriate icons (Droplet for wash, Flame for dry)
// ✅ Larger titles with metric names
// ✅ Adaptive service count labels based on date filter
// ✅ Fixed capacity calculation for total
// ✅ Realistic capacity with 20% idle time efficiency factor
//
// CHANGELOG:
// v5.0.0 (2025-11-26): Design System alignment
//   - Replaced all inline styles with Tailwind CSS
//   - Added dark mode support throughout
//   - Removed COLORS object (using Tailwind classes)
//   - Replaced emoji status indicators with TrendingUp/Down icons
//   - Replaced emoji insights with BarChart2/Lightbulb icons
//   - Updated gradient backgrounds per design system
//   - Improved responsive design
// v4.2.0 (2025-11-15): Icon + Efficiency Updates
//   - Changed: Droplet icon for washers (water theme)
//   - Changed: Flame icon for dryers (heat theme)
//   - Added: 20% efficiency factor (0.80) for realistic idle time
//   - Updated: Operating hours confirmed as 15h/day (8 AM - 11 PM)
//   - Fixed: Capacity calculations now show realistic maximums
// v4.1.0 (2025-11-15): UI/UX Enhancements + Math Fix
//   - Changed: Better icons (WashingMachine, Wind, Gauge)
//   - Enhanced: Larger card titles (16px) with metric name
//   - Fixed: Service count labels adapt to dateWindow selection
//   - Fixed: Total capacity calculation (sum of washer + dryer, not average)
//   - Added: dateWindow prop for context-aware labels

import React, { useMemo } from 'react';
import { Droplet, Flame, Gauge, TrendingUp, TrendingDown, Minus, BarChart2, Lightbulb } from 'lucide-react';

// REALISTIC THRESHOLDS (aligned with 25% profitability target)
const THRESHOLDS = {
  excellent: 25,
  good: 15,
  fair: 10
};

// MACHINE CONFIGURATION
// Operating hours: 8 AM - 11 PM = 15 hours/day
// Efficiency factor: 0.80 (accounts for 20% idle time between customers)
const MACHINE_CONFIG = {
  washers: {
    count: 3,
    cyclesPerHour: 2,        // 30-minute wash cycle
    hoursPerDay: 15,         // 8 AM - 11 PM
    daysPerWeek: 7,
    efficiencyFactor: 0.80   // 20% idle time
  },
  dryers: {
    count: 5,
    cyclesPerHour: 1.33,     // 45-minute dry cycle  
    hoursPerDay: 15,         // 8 AM - 11 PM
    daysPerWeek: 7,
    efficiencyFactor: 0.80   // 20% idle time
  }
};

// Calculate max REALISTIC capacity per week (with efficiency factor)
const MAX_CAPACITY = {
  // Theoretical: 3 × 2 × 15 × 7 = 630, Realistic: 630 × 0.80 = 504
  washers: Math.round(
    MACHINE_CONFIG.washers.count * 
    MACHINE_CONFIG.washers.cyclesPerHour * 
    MACHINE_CONFIG.washers.hoursPerDay * 
    MACHINE_CONFIG.washers.daysPerWeek *
    MACHINE_CONFIG.washers.efficiencyFactor
  ), // 504 cycles/week
  
  // Theoretical: 5 × 1.33 × 15 × 7 = 698, Realistic: 698 × 0.80 = 558
  dryers: Math.round(
    MACHINE_CONFIG.dryers.count * 
    MACHINE_CONFIG.dryers.cyclesPerHour * 
    MACHINE_CONFIG.dryers.hoursPerDay * 
    MACHINE_CONFIG.dryers.daysPerWeek *
    MACHINE_CONFIG.dryers.efficiencyFactor
  ), // 558 cycles/week
  
  get total() { 
    return this.washers + this.dryers; // 504 + 558 = 1,062 cycles/week
  }
};

const OperationsKPICards = ({ 
  businessMetrics, 
  operationsMetrics, 
  previousWeekMetrics,
  dateWindow = 'currentWeek' // NEW: for adaptive labels
}) => {
  console.log('🎯 KPI Cards received:', {
    hasBusinessMetrics: !!businessMetrics,
    hasOperationsMetrics: !!operationsMetrics,
    hasPreviousWeek: !!previousWeekMetrics,
    currentUtil: operationsMetrics?.utilization,
    dateWindow
  });

  // Get adaptive labels for service counts based on date filter
  const getServiceLabels = (dateWindow) => {
    switch(dateWindow) {
      case 'currentWeek':
        return {
          current: 'Semana Atual',
          previous: 'Semana Passada',
          showComparison: true
        };
      case 'lastWeek':
        return {
          current: 'Semana Passada',
          previous: 'Semana Anterior',
          showComparison: true
        };
      case 'last4Weeks':
        return {
          current: 'Últimas 4 Semanas',
          previous: '4 Semanas Anteriores',
          showComparison: true
        };
      case 'allTime':
        return {
          current: 'Todo Período',
          previous: null,
          showComparison: false
        };
      default:
        return {
          current: 'Período Atual',
          previous: 'Período Anterior',
          showComparison: true
        };
    }
  };

  const serviceLabels = getServiceLabels(dateWindow);

  // Get current week data from operationsMetrics
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
      }
    };
  }, [operationsMetrics]);

  // Get previous week data
  const previousData = useMemo(() => {
    if (!previousWeekMetrics?.utilization) return null;
    
    const util = previousWeekMetrics.utilization;
    return {
      wash: {
        utilization: util.washUtilization || 0,
        services: util.totalWashServices || 0
      },
      dry: {
        utilization: util.dryUtilization || 0,
        services: util.totalDryServices || 0
      },
      total: {
        utilization: util.totalUtilization || 0,
        services: util.totalServices || 0
      }
    };
  }, [previousWeekMetrics]);

  // Calculate trends
  const trends = useMemo(() => {
    if (!currentData || !previousData) return { wash: null, dry: null, total: null };
    
    const calculateTrend = (current, previous) => {
      if (!previous || previous === 0) return null;
      return {
        percent: ((current - previous) / previous) * 100,
        absolute: current - previous
      };
    };
    
    return {
      wash: calculateTrend(currentData.wash.utilization, previousData.wash.utilization),
      dry: calculateTrend(currentData.dry.utilization, previousData.dry.utilization),
      total: calculateTrend(currentData.total.utilization, previousData.total.utilization)
    };
  }, [currentData, previousData]);

  // Get dynamic peak hour labels
  const peakHourLabels = useMemo(() => {
    if (!operationsMetrics?.peakHours?.peak || operationsMetrics.peakHours.peak.length === 0) {
      return '10-12h, 14-15h, 18-19h'; // Fallback
    }
    
    const peakHours = operationsMetrics.peakHours.peak.map(h => h.hour).sort((a, b) => a - b);
    
    // Group consecutive hours into ranges
    const ranges = [];
    let start = peakHours[0];
    let prev = peakHours[0];
    
    for (let i = 1; i < peakHours.length; i++) {
      if (peakHours[i] !== prev + 1) {
        ranges.push(start === prev ? `${start}h` : `${start}-${prev + 1}h`);
        start = peakHours[i];
      }
      prev = peakHours[i];
    }
    ranges.push(start === prev ? `${start}h` : `${start}-${prev + 1}h`);
    
    return ranges.join(', ');
  }, [operationsMetrics]);

  if (!currentData) {
    return (
      <div className="text-slate-600 dark:text-slate-400 p-4">
        Loading KPI metrics...
      </div>
    );
  }

  const getStatus = (utilization) => {
    if (utilization >= THRESHOLDS.excellent) return {
      label: 'Excelente',
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-emerald-500/20 dark:bg-emerald-500/30',
      gradientFrom: 'from-emerald-500',
      gradientTo: 'to-green-600',
      borderClass: 'border-emerald-500 dark:border-emerald-400'
    };
    if (utilization >= THRESHOLDS.good) return {
      label: 'Bom',
      colorClass: 'text-green-600 dark:text-green-400',
      bgClass: 'bg-green-500/20 dark:bg-green-500/30',
      gradientFrom: 'from-green-500',
      gradientTo: 'to-emerald-600',
      borderClass: 'border-green-500 dark:border-green-400'
    };
    if (utilization >= THRESHOLDS.fair) return {
      label: 'Razoável',
      colorClass: 'text-amber-600 dark:text-amber-400',
      bgClass: 'bg-amber-500/20 dark:bg-amber-500/30',
      gradientFrom: 'from-amber-500',
      gradientTo: 'to-orange-600',
      borderClass: 'border-amber-500 dark:border-amber-400'
    };
    return {
      label: 'Baixo',
      colorClass: 'text-red-600 dark:text-red-400',
      bgClass: 'bg-red-500/20 dark:bg-red-500/30',
      gradientFrom: 'from-red-500',
      gradientTo: 'to-rose-600',
      borderClass: 'border-red-500 dark:border-red-400'
    };
  };

  const getTrendIndicator = (trend) => {
    if (!trend || trend.percent === null || trend.percent === undefined) return null;

    const percent = trend.percent;
    if (Math.abs(percent) < 0.1) return null; // Skip if no change

    if (percent > 5) {
      return {
        Icon: TrendingUp,
        colorClass: 'text-emerald-600 dark:text-emerald-400',
        text: `+${percent.toFixed(0)}%`
      };
    }
    if (percent < -5) {
      return {
        Icon: TrendingDown,
        colorClass: 'text-red-600 dark:text-red-400',
        text: `${percent.toFixed(0)}%`
      };
    }
    return {
      Icon: Minus,
      colorClass: 'text-slate-600 dark:text-slate-400',
      text: `${percent >= 0 ? '+' : ''}${percent.toFixed(0)}%`
    };
  };

  const formatServiceCount = (current, previous) => {
    const diff = current - previous;
    const sign = diff > 0 ? '+' : '';
    return { current, previous, diff, text: `${sign}${diff}` };
  };

  const washStatus = getStatus(currentData.wash.utilization);
  const dryStatus = getStatus(currentData.dry.utilization);
  const totalStatus = getStatus(currentData.total.utilization);

  const washTrend = getTrendIndicator(trends.wash);
  const dryTrend = getTrendIndicator(trends.dry);
  const totalTrend = getTrendIndicator(trends.total);

  const washServices = formatServiceCount(
    currentData.wash.services,
    previousData?.wash.services || 0
  );
  const dryServices = formatServiceCount(
    currentData.dry.services,
    previousData?.dry.services || 0
  );

  const KPICard = ({
    title,
    metricName,
    icon: Icon,
    utilization,
    status,
    capacity,
    services,
    trend,
    peakOffPeakData,
    maxCyclesPerWeek
  }) => {
    const progressWidth = Math.min(utilization, 100);

    return (
      <div className={`
        bg-white dark:bg-slate-800 rounded-xl p-6
        border-2 ${status.borderClass}
        shadow-sm hover:shadow-lg
        hover:-translate-y-1
        transition-all duration-200
      `}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`
              w-9 h-9 rounded-lg ${status.bgClass}
              flex items-center justify-center
            `}>
              <Icon className={`w-5 h-5 ${status.colorClass}`} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-wide leading-tight">
                {title}
              </h3>
              <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                {metricName}
              </div>
            </div>
          </div>
        </div>

        {/* Utilization % + Trend */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-bold ${status.colorClass}`}>
              {utilization.toFixed(0)}%
            </span>
            {trend && (
              <div className="flex items-center gap-1">
                <trend.Icon className={`w-5 h-5 ${trend.colorClass}`} />
                <span className={`text-sm font-semibold ${trend.colorClass}`}>
                  {trend.text}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-sm font-semibold ${status.colorClass}`}>
              {status.label}
            </span>
            {trend && (
              <span className="text-[10px] text-slate-600 dark:text-slate-400">
                vs semana passada
              </span>
            )}
          </div>
        </div>

        {/* Peak/Off-Peak Breakdown */}
        {peakOffPeakData && peakOffPeakData.peak > 0 && (
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-900 dark:text-white mb-2 uppercase tracking-wider">
              <BarChart2 className="w-3.5 h-3.5" />
              Distribuição da Demanda
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span>├─ Pico ({peakHourLabels}):</span>
                <strong className={peakOffPeakData.peak >= 15 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}>
                  {peakOffPeakData.peak.toFixed(0)}%
                </strong>
              </div>
              <div className="flex justify-between">
                <span>└─ Fora de pico:</span>
                <strong className="text-slate-600 dark:text-slate-400">
                  {peakOffPeakData.offPeak.toFixed(0)}%
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Service Counts */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3 border border-blue-200 dark:border-blue-800">
          <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span>{serviceLabels.current}:</span>
              <strong className="text-slate-900 dark:text-white">{services.current} serviços</strong>
            </div>
            {serviceLabels.showComparison && serviceLabels.previous && (
              <div className="flex justify-between">
                <span>{serviceLabels.previous}:</span>
                <strong className="text-slate-600 dark:text-slate-400">
                  {services.previous} serviços
                  {services.diff !== 0 && (
                    <span className={services.diff > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400 ml-1'}>
                      ({services.text})
                    </span>
                  )}
                </strong>
              </div>
            )}
          </div>
        </div>

        {/* Data-Driven Insight */}
        {peakOffPeakData && peakOffPeakData.peak > 0 && (
          <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-[10px] text-slate-700 dark:text-slate-300 leading-relaxed border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                {peakOffPeakData.peak - peakOffPeakData.offPeak > 8 ? (
                  <>Demanda concentrada nos picos. Promova fora de pico com desconto.</>
                ) : peakOffPeakData.peak - peakOffPeakData.offPeak > 3 ? (
                  <>Boa distribuição. Continue monitorando padrões.</>
                ) : (
                  <>Distribuição equilibrada. Oportunidade de aumentar picos.</>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Capacity Info */}
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="text-[10px] text-slate-600 dark:text-slate-400 mb-2">
            {capacity} - {Math.round(maxCyclesPerWeek)} ciclos possíveis/semana
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${status.gradientFrom} ${status.gradientTo} transition-all duration-500`}
              style={{ width: `${progressWidth}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[9px] text-slate-500 dark:text-slate-500">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
      {/* Washers KPI */}
      <KPICard
        title="LAVADORAS"
        metricName="Utilização"
        icon={Droplet}
        utilization={currentData.wash.utilization}
        status={washStatus}
        capacity={`${MACHINE_CONFIG.washers.count} máquinas`}
        services={washServices}
        trend={washTrend}
        peakOffPeakData={{
          peak: currentData.wash.peak,
          offPeak: currentData.wash.offPeak
        }}
        maxCyclesPerWeek={MAX_CAPACITY.washers}
      />

      {/* Dryers KPI */}
      <KPICard
        title="SECADORAS"
        metricName="Utilização"
        icon={Flame}
        utilization={currentData.dry.utilization}
        status={dryStatus}
        capacity={`${MACHINE_CONFIG.dryers.count} máquinas`}
        services={dryServices}
        trend={dryTrend}
        peakOffPeakData={{
          peak: currentData.dry.peak,
          offPeak: currentData.dry.offPeak
        }}
        maxCyclesPerWeek={MAX_CAPACITY.dryers}
      />

      {/* Total Utilization KPI */}
      <KPICard
        title="UTILIZAÇÃO TOTAL"
        metricName="Combinada"
        icon={Gauge}
        utilization={currentData.total.utilization}
        status={totalStatus}
        capacity={`${MACHINE_CONFIG.washers.count + MACHINE_CONFIG.dryers.count} máquinas`}
        services={{
          current: washServices.current + dryServices.current,
          previous: washServices.previous + dryServices.previous,
          diff: washServices.diff + dryServices.diff,
          text: `${washServices.diff + dryServices.diff >= 0 ? '+' : ''}${washServices.diff + dryServices.diff}`
        }}
        trend={totalTrend}
        peakOffPeakData={{
          peak: currentData.total.peak,
          offPeak: currentData.total.offPeak
        }}
        maxCyclesPerWeek={MAX_CAPACITY.total}
      />
    </div>
  );
};

export default OperationsKPICards;
