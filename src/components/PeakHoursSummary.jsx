// PEAK HOURS SUMMARY V3.2.0
// Peak and off-peak hours analysis with self-service recommendations
//
// CHANGELOG:
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

const PeakHoursSummary = ({ peakHours, dateWindow }) => {
  if (!peakHours || !peakHours.peak || !peakHours.offPeak) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 text-center text-slate-600 dark:text-slate-400">
        Loading peak hours data...
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
  const getRecommendation = (util) => {
    if (util >= HOURLY_THRESHOLDS.critical) return {
      text: "Pico crítico - monitore remotamente para problemas",
      Icon: Flame,
      colorClass: "text-red-600 dark:text-red-400",
      bgClass: "bg-red-50 dark:bg-red-900/20",
      borderClass: "border-red-200 dark:border-red-800"
    };
    if (util >= HOURLY_THRESHOLDS.high) return {
      text: "Alta demanda - verifique máquinas antes do período",
      Icon: Zap,
      colorClass: "text-emerald-600 dark:text-emerald-400",
      bgClass: "bg-emerald-50 dark:bg-emerald-900/20",
      borderClass: "border-emerald-200 dark:border-emerald-800"
    };
    if (util >= HOURLY_THRESHOLDS.moderate) return {
      text: "Fluxo moderado - período de operação normal",
      Icon: CheckCircle,
      colorClass: "text-blue-600 dark:text-blue-400",
      bgClass: "bg-blue-50 dark:bg-blue-900/20",
      borderClass: "border-blue-200 dark:border-blue-800"
    };
    return {
      text: "Baixa demanda - ideal para manutenção preventiva",
      Icon: Wrench,
      colorClass: "text-amber-600 dark:text-amber-400",
      bgClass: "bg-amber-50 dark:bg-amber-900/20",
      borderClass: "border-amber-200 dark:border-amber-800"
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
          w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white
          ${isPeak ? 'bg-emerald-500' : 'bg-red-500'}
        `}>
          {index + 1}
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-white">
            {hour.hourLabel}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {hour.avgServices.toFixed(1)} serviços/h
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className={`text-sm font-bold ${isPeak ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {hour.utilization.toFixed(1)}%
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400">
          {formatCurrency(hour.revenue)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-5 h-5 text-lavpop-blue dark:text-blue-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Melhores e Piores Horários
          </h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Período: {dateWindow?.dateRange || 'Carregando...'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Peak Hours */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
              Horários de Pico
            </h4>
          </div>

          {topPeak.map((hour, index) => (
            <HourRow key={hour.hour} hour={hour} index={index} isPeak={true} />
          ))}

          <div className={`mt-4 p-3 ${peakRec.bgClass} rounded-lg border ${peakRec.borderClass}`}>
            <div className={`flex items-start gap-2 text-xs ${peakRec.colorClass} font-semibold`}>
              <peakRec.Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{peakRec.text}</span>
            </div>
          </div>
        </div>

        {/* Off-Peak Hours */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-4.5 h-4.5 text-red-600 dark:text-red-400" />
            <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
              Horários de Vale
            </h4>
          </div>

          {bottomOffPeak.map((hour, index) => (
            <HourRow key={hour.hour} hour={hour} index={index} isPeak={false} />
          ))}

          <div className={`mt-4 p-3 ${offPeakRec.bgClass} rounded-lg border ${offPeakRec.borderClass}`}>
            <div className={`flex items-start gap-2 text-xs ${offPeakRec.colorClass} font-semibold`}>
              <offPeakRec.Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{offPeakRec.text}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Capacity Footer */}
      <div className="mt-3 flex flex-col items-center gap-1 text-xs text-slate-500 dark:text-slate-500">
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
