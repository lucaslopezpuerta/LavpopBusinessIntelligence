// PEAK HOURS SUMMARY V3.0.0
// Peak and off-peak hours analysis with self-service recommendations
//
// CHANGELOG:
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

import React from 'react';
import { Clock, TrendingUp, TrendingDown, Flame, Zap, CheckCircle, Wrench, Lightbulb, Info } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

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

  // Self-service recommendations based on utilization
  const getRecommendation = (util) => {
    if (util >= 50) return {
      text: "Pico crítico - monitore remotamente para problemas",
      Icon: Flame,
      colorClass: "text-red-600 dark:text-red-400",
      bgClass: "bg-red-50 dark:bg-red-900/20"
    };
    if (util >= 30) return {
      text: "Alta demanda - verifique máquinas antes do período",
      Icon: Zap,
      colorClass: "text-emerald-600 dark:text-emerald-400",
      bgClass: "bg-emerald-50 dark:bg-emerald-900/20"
    };
    if (util >= 15) return {
      text: "Fluxo moderado - período de operação normal",
      Icon: CheckCircle,
      colorClass: "text-blue-600 dark:text-blue-400",
      bgClass: "bg-blue-50 dark:bg-blue-900/20"
    };
    return {
      text: "Baixa demanda - ideal para manutenção preventiva",
      Icon: Wrench,
      colorClass: "text-amber-600 dark:text-amber-400",
      bgClass: "bg-amber-50 dark:bg-amber-900/20"
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

          <div className={`mt-4 p-3 ${peakRec.bgClass} rounded-lg border ${peakRec.bgClass.replace('bg-', 'border-').replace('/20', '')}`}>
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

          <div className={`mt-4 p-3 ${offPeakRec.bgClass} rounded-lg border ${offPeakRec.bgClass.replace('bg-', 'border-').replace('/20', '')}`}>
            <div className={`flex items-start gap-2 text-xs ${offPeakRec.colorClass} font-semibold`}>
              <offPeakRec.Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{offPeakRec.text}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Self-Service Strategy Insights */}
      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white mb-3">
          <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          Estratégias para Autosserviço:
        </div>
        <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <div>
            <strong className="text-slate-900 dark:text-white">Horários de Pico:</strong> Configure alertas remotos para monitorar filas e problemas de máquinas
          </div>
          <div>
            <strong className="text-slate-900 dark:text-white">Horários de Vale:</strong> Execute manutenção preventiva, limpeza profunda ou lance promoções via WhatsApp
          </div>
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-200 dark:border-slate-600 text-[10px] text-slate-600 dark:text-slate-400 italic">
            <Info className="w-3.5 h-3.5" />
            Receita inclui vendas de crédito (Recarga)
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeakHoursSummary;
