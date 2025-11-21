// CurrentWeekBanner.jsx v2.0 - TAILWIND MIGRATION
// ✅ Replaced inline styles with Tailwind classes
// ✅ Responsive design (mobile stack, desktop row)
// ✅ Preserved all logic and projection math
//
// CHANGELOG:
// v2.0 (2025-11-20): Tailwind migration
// v1.0 (2025-11-19): Initial implementation

import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle, Calendar } from 'lucide-react';

const CurrentWeekBanner = ({ businessMetrics }) => {
  if (!businessMetrics?.currentWeek) {
    return null;
  }

  const { currentWeek } = businessMetrics;
  const { window, projection } = currentWeek;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  // Confidence level styling
  const getConfidenceStyle = () => {
    if (!projection.canProject) return { colorClass: 'text-slate-400', icon: AlertCircle };

    switch (projection.confidence) {
      case 'very_low':
        return { colorClass: 'text-red-400', icon: AlertCircle };
      case 'low':
        return { colorClass: 'text-amber-400', icon: AlertCircle };
      case 'medium':
        return { colorClass: 'text-blue-400', icon: TrendingUp };
      case 'high':
        return { colorClass: 'text-lavpop-green', icon: TrendingUp };
      default:
        return { colorClass: 'text-slate-400', icon: Minus };
    }
  };

  // Trend icon and color
  const getTrendIcon = () => {
    if (!projection.canProject) return null;

    if (projection.trend === 'up') {
      return <TrendingUp className="w-[18px] h-[18px] text-lavpop-green" />;
    } else if (projection.trend === 'down') {
      return <TrendingDown className="w-[18px] h-[18px] text-red-400" />;
    } else {
      return <Minus className="w-[18px] h-[18px] text-slate-400" />;
    }
  };

  const confidenceStyle = getConfidenceStyle();
  const ConfidenceIcon = confidenceStyle.icon;

  return (
    <div className="
      bg-gradient-to-br from-lavpop-blue to-blue-600 
      rounded-xl p-4 sm:p-5 mb-3 
      text-white shadow-md
    ">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-wider">
            Semana Atual
          </span>
          <span className="text-[13px] opacity-90 font-medium">
            ({window.startDate} - {window.endDate}, {window.daysElapsed} {window.daysElapsed === 1 ? 'dia' : 'dias'})
          </span>
        </div>

        <div className="
          flex items-center gap-1.5 
          text-xs opacity-85 
          bg-white/15 
          px-2.5 py-1 
          rounded-md
        ">
          <ConfidenceIcon className="w-3.5 h-3.5" />
          <span>{window.dayOfWeek}</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-0">
        {/* Current Week Stats */}
        <div className="flex items-center gap-6 flex-1 w-full lg:w-auto">
          <div>
            <div className="text-[11px] opacity-85 uppercase tracking-wide mb-0.5">
              Receita
            </div>
            <div className="text-2xl font-bold leading-tight">
              {formatCurrency(currentWeek.netRevenue)}
            </div>
          </div>

          <div className="w-px h-10 bg-white/30" />

          <div>
            <div className="text-[11px] opacity-85 uppercase tracking-wide mb-0.5">
              Ciclos
            </div>
            <div className="text-2xl font-bold leading-tight">
              {formatNumber(currentWeek.totalServices)}
            </div>
          </div>

          <div className="w-px h-10 bg-white/30" />

          <div>
            <div className="text-[11px] opacity-85 uppercase tracking-wide mb-0.5">
              Utilização
            </div>
            <div className="text-2xl font-bold leading-tight">
              {Math.round(currentWeek.totalUtilization)}%
            </div>
          </div>
        </div>

        {/* Projection */}
        {projection.canProject && (
          <>
            <div className="hidden lg:block w-0.5 h-[50px] bg-white/40 mx-4" />
            <div className="block lg:hidden w-full h-px bg-white/20 my-2" />

            <div className="
              bg-white/15 
              rounded-lg p-3 sm:px-4 sm:py-3 
              w-full lg:min-w-[280px] lg:w-auto
            ">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-wider opacity-90 font-semibold">
                  Projeção Semana Completa
                </span>
                {getTrendIcon()}
              </div>

              <div className="flex items-baseline gap-3 mb-1.5">
                <span className="text-[22px] font-bold">
                  {formatCurrency(projection.projectedRevenue)}
                </span>
                <span className="text-sm opacity-90">
                  • {formatNumber(projection.projectedServices)} ciclos
                </span>
              </div>

              <div className="text-xs opacity-85 flex items-center gap-2">
                <span>
                  {projection.revenueVsLast > 0 ? '+' : ''}{projection.revenueVsLast.toFixed(1)}% vs última semana
                </span>
                {projection.confidence === 'very_low' && (
                  <span className="text-[11px] bg-red-600/30 px-1.5 py-0.5 rounded">
                    Volátil
                  </span>
                )}
                {projection.confidence === 'low' && (
                  <span className="text-[11px] bg-amber-500/30 px-1.5 py-0.5 rounded">
                    Preliminar
                  </span>
                )}
              </div>
            </div>
          </>
        )}

        {!projection.canProject && (
          <div className="text-[13px] opacity-80 italic px-4 py-2 bg-white/10 rounded-md w-full lg:w-auto">
            {projection.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentWeekBanner;
