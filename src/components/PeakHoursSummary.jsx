// PEAK HOURS SUMMARY V4.1.0
// Peak and off-peak hours analysis with self-service recommendations
//
// CHANGELOG:
// v4.1.0 (2026-01-23): Responsive text sizing for desktop readability
//   - Added useMediaQuery hook for desktop detection
//   - Larger text on desktop: text-base/text-lg vs text-sm/text-xs
//   - Larger icons on desktop: w-5 h-5 vs w-4 h-4
//   - Larger rank badges on desktop: w-9 h-9 vs w-8 h-8
// v4.0.0 (2026-01-23): Premium Glass styling (consistency with DayOfWeekChart v3.6)
//   - Upgraded to Premium Glass card (backdrop-blur, ring-1, glow shadows)
//   - Header icon badge: cyan bg with white icon
//   - Added Framer Motion hover animation
//   - Implemented useTheme() for theme-aware styling
//   - Loading skeleton animation
//   - Glassmorphism on recommendation boxes
// v3.2.0 (2025-11-30): Removed redundant InsightBox
//   - Inline recommendations (peakRec/offPeakRec) are dynamic and sufficient
//   - InsightBox was static/generic and duplicated the inline advice
// v3.1.0 (2025-11-30): Threshold unification + Design System fixes
//   - Imported HOURLY_THRESHOLDS and BUSINESS_PARAMS from operationsMetrics.js
//   - Fixed text-[10px] → text-xs (Design System minimum 12px)
//   - Replaced hacky border class generation with proper Tailwind classes
//   - Added capacity context to footer
// v3.0.0 (2025-11-26): Design System alignment
//   - Replaced all inline styles with Tailwind CSS
//   - Added dark mode support throughout
//   - Removed COLORS object (using Tailwind classes)
//   - Replaced emoji icons with Lucide React icons
//   - Improved responsive design
//   - Aligned with Design System v3.0
// v2.1 (2025-11-15): Added date window display
//   - Now receives dateWindow prop from parent
//   - Displays explicit date range in subtitle
//   - Synchronized with Operations tab DateRangeSelector
// v2.0 (Previous): Added self-service recommendations
// v1.0 (Previous): Initial implementation

import React, { useMemo } from 'react';
import { Clock, TrendingUp, TrendingDown, Flame, Zap, CheckCircle, Wrench, Info } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { BUSINESS_PARAMS, HOURLY_THRESHOLDS } from '../utils/operationsMetrics';
import { useTheme } from '../contexts/ThemeContext';
import { useMediaQuery } from '../hooks/useMediaQuery';

const PeakHoursSummary = ({ peakHours, dateWindow }) => {
  const { isDark } = useTheme();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  if (!peakHours || !peakHours.peak || !peakHours.offPeak) {
    return (
      <div
        className={`
          ${isDark ? 'bg-space-dust/40' : 'bg-white/80'}
          backdrop-blur-xl rounded-2xl p-5
          ${isDark
            ? 'ring-1 ring-white/[0.05] shadow-[0_0_20px_-5px_rgba(103,232,249,0.15),inset_0_1px_1px_rgba(255,255,255,0.10)]'
            : 'ring-1 ring-slate-200/80 shadow-[0_8px_32px_-12px_rgba(100,116,139,0.15),inset_0_1px_0_rgba(255,255,255,0.8)]'
          }
          overflow-hidden h-full flex flex-col
        `}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500 dark:bg-cyan-600 flex items-center justify-center shadow-sm shrink-0">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              Melhores e Piores Horários
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Carregando dados...
            </p>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
          {[0, 1].map((col) => (
            <div key={col} className="space-y-3">
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex items-center gap-3 p-3">
                  <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                  </div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12"></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show top 3 peak and bottom 3 off-peak only
  const topPeak = peakHours.peak.slice(0, 3);
  const bottomOffPeak = peakHours.offPeak.slice(0, 3);

  // Calculate max services per hour for capacity context
  const maxServicesPerHour = useMemo(() => {
    const washCyclesPerHour = BUSINESS_PARAMS.TOTAL_WASHERS * (60 / BUSINESS_PARAMS.WASHER_CYCLE_MINUTES);
    const dryCyclesPerHour = BUSINESS_PARAMS.TOTAL_DRYERS * (60 / BUSINESS_PARAMS.DRYER_CYCLE_MINUTES);
    return Math.round((washCyclesPerHour + dryCyclesPerHour) * BUSINESS_PARAMS.EFFICIENCY_FACTOR * 10) / 10;
  }, []);

  // Self-service recommendations based on utilization (uses HOURLY_THRESHOLDS)
  // Updated for glassmorphism styling with theme-aware classes
  const getRecommendation = (util) => {
    if (util >= HOURLY_THRESHOLDS.critical) return {
      text: "Pico crítico - monitore remotamente para problemas",
      Icon: Flame,
      colorClass: "text-red-600 dark:text-red-400",
      bgLight: "bg-red-50/80",
      bgDark: "bg-red-950/30",
      ringLight: "ring-red-200",
      ringDark: "ring-red-500/20"
    };
    if (util >= HOURLY_THRESHOLDS.high) return {
      text: "Alta demanda - verifique máquinas antes do período",
      Icon: Zap,
      colorClass: "text-emerald-600 dark:text-emerald-400",
      bgLight: "bg-emerald-50/80",
      bgDark: "bg-emerald-950/30",
      ringLight: "ring-emerald-200",
      ringDark: "ring-emerald-500/20"
    };
    if (util >= HOURLY_THRESHOLDS.moderate) return {
      text: "Fluxo moderado - período de operação normal",
      Icon: CheckCircle,
      colorClass: "text-blue-600 dark:text-blue-400",
      bgLight: "bg-blue-50/80",
      bgDark: "bg-blue-950/30",
      ringLight: "ring-blue-200",
      ringDark: "ring-blue-500/20"
    };
    return {
      text: "Baixa demanda - ideal para manutenção preventiva",
      Icon: Wrench,
      colorClass: "text-amber-600 dark:text-amber-400",
      bgLight: "bg-amber-50/80",
      bgDark: "bg-amber-950/30",
      ringLight: "ring-amber-200",
      ringDark: "ring-amber-500/20"
    };
  };

  const peakRec = getRecommendation(topPeak[0]?.utilization || 0);
  const offPeakRec = getRecommendation(bottomOffPeak[0]?.utilization || 0);

  const HourRow = ({ hour, index, isPeak }) => (
    <div className={`
      flex items-center justify-between px-4 py-3 rounded-lg mb-2
      ${index === 0
        ? isPeak
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
          : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        : 'border border-transparent'
      }
    `}>
      <div className="flex items-center gap-3 flex-1">
        <div className={`
          ${isDesktop ? 'w-9 h-9 text-sm' : 'w-8 h-8 text-xs'} rounded-lg flex items-center justify-center font-bold text-white
          ${isPeak ? 'bg-emerald-500' : 'bg-red-500'}
        `}>
          {index + 1}
        </div>
        <div>
          <div className={`${isDesktop ? 'text-base' : 'text-sm'} font-semibold text-slate-900 dark:text-white`}>
            {hour.hourLabel}
          </div>
          <div className={`${isDesktop ? 'text-sm' : 'text-xs'} text-slate-600 dark:text-slate-400`}>
            {hour.avgServices.toFixed(1)} serviços/h
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className={`${isDesktop ? 'text-lg' : 'text-sm'} font-bold ${isPeak ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {hour.utilization.toFixed(1)}%
        </div>
        <div className={`${isDesktop ? 'text-sm' : 'text-xs'} text-slate-600 dark:text-slate-400`}>
          {formatCurrency(hour.revenue)}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`
        ${isDark ? 'bg-space-dust/40' : 'bg-white/80'}
        backdrop-blur-xl rounded-2xl p-5
        ${isDark
          ? 'ring-1 ring-white/[0.05] shadow-[0_0_20px_-5px_rgba(103,232,249,0.15),inset_0_1px_1px_rgba(255,255,255,0.10)]'
          : 'ring-1 ring-slate-200/80 shadow-[0_8px_32px_-12px_rgba(100,116,139,0.15),inset_0_1px_0_rgba(255,255,255,0.8)]'
        }
        overflow-hidden h-full flex flex-col
      `}
    >
      {/* Header with Icon Badge */}
      <div className="mb-4">
        <div className="flex items-start gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-cyan-500 dark:bg-cyan-600 flex items-center justify-center shadow-sm shrink-0">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              Melhores e Piores Horários
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Período: {dateWindow?.dateRange || 'Carregando...'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Peak Hours */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className={`${isDesktop ? 'w-5 h-5' : 'w-4.5 h-4.5'} text-emerald-600 dark:text-emerald-400`} />
            <h4 className={`${isDesktop ? 'text-base' : 'text-sm'} font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide`}>
              Horários de Pico
            </h4>
          </div>

          {topPeak.map((hour, index) => (
            <HourRow key={hour.hour} hour={hour} index={index} isPeak={true} />
          ))}

          <div className={`
            mt-4 p-3 rounded-xl backdrop-blur-sm ring-1
            ${isDark ? peakRec.bgDark : peakRec.bgLight}
            ${isDark ? peakRec.ringDark : peakRec.ringLight}
          `}>
            <div className={`flex items-start gap-2 ${isDesktop ? 'text-sm' : 'text-xs'} ${peakRec.colorClass} font-semibold`}>
              <peakRec.Icon className={`${isDesktop ? 'w-5 h-5' : 'w-4 h-4'} flex-shrink-0 mt-0.5`} />
              <span>{peakRec.text}</span>
            </div>
          </div>
        </div>

        {/* Off-Peak Hours */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className={`${isDesktop ? 'w-5 h-5' : 'w-4.5 h-4.5'} text-red-600 dark:text-red-400`} />
            <h4 className={`${isDesktop ? 'text-base' : 'text-sm'} font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide`}>
              Horários de Vale
            </h4>
          </div>

          {bottomOffPeak.map((hour, index) => (
            <HourRow key={hour.hour} hour={hour} index={index} isPeak={false} />
          ))}

          <div className={`
            mt-4 p-3 rounded-xl backdrop-blur-sm ring-1
            ${isDark ? offPeakRec.bgDark : offPeakRec.bgLight}
            ${isDark ? offPeakRec.ringDark : offPeakRec.ringLight}
          `}>
            <div className={`flex items-start gap-2 ${isDesktop ? 'text-sm' : 'text-xs'} ${offPeakRec.colorClass} font-semibold`}>
              <offPeakRec.Icon className={`${isDesktop ? 'w-5 h-5' : 'w-4 h-4'} flex-shrink-0 mt-0.5`} />
              <span>{offPeakRec.text}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Capacity Footer */}
      <div className="mt-3 flex flex-col items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        <p>Capacidade: {maxServicesPerHour} serviços/hora</p>
        <p className="flex items-center gap-1.5 italic">
          <Info className="w-3.5 h-3.5" aria-hidden="true" />
          Receita inclui vendas de crédito (Recarga)
        </p>
      </div>
    </div>
  );
};

export default PeakHoursSummary;
