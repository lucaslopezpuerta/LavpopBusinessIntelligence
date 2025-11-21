// CurrentWeekBanner.jsx v2.2 - MOBILE OVERFLOW FIXES
// ✅ Fixed text overflow on mobile
// ✅ Better responsive spacing
// ✅ Improved truncation handling
// ✅ Design System color compliance
// ✅ No logic changes
//
// CHANGELOG:
// v2.2 (2025-11-21): Mobile overflow fixes
// v2.1 (2025-11-21): Dark mode & UX improvements
// v2.0 (2025-11-20): Tailwind migration

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
    if (!projection.canProject) return { colorClass: 'text-slate-300', icon: AlertCircle };

    switch (projection.confidence) {
      case 'very_low':
        return { colorClass: 'text-red-300', icon: AlertCircle };
      case 'low':
        return { colorClass: 'text-amber-300', icon: AlertCircle };
      case 'medium':
        return { colorClass: 'text-blue-300', icon: TrendingUp };
      case 'high':
        return { colorClass: 'text-emerald-300', icon: TrendingUp };
      default:
        return { colorClass: 'text-slate-300', icon: Minus };
    }
  };

  // Trend icon and color
  const getTrendIcon = () => {
    if (!projection.canProject) return null;

    if (projection.trend === 'up') {
      return <TrendingUp className="w-5 h-5 text-emerald-300" />;
    } else if (projection.trend === 'down') {
      return <TrendingDown className="w-5 h-5 text-red-300" />;
    } else {
      return <Minus className="w-5 h-5 text-slate-300" />;
    }
  };

  const confidenceStyle = getConfidenceStyle();
  const ConfidenceIcon = confidenceStyle.icon;

  return (
    <div className="bg-gradient-to-br from-blue-700 via-lavpop-blue to-blue-900 dark:from-blue-900 dark:via-slate-800 dark:to-slate-900 rounded-2xl p-4 sm:p-6 text-white shadow-xl border border-blue-600/20 dark:border-slate-700/50">
      {/* Header - Fixed Mobile Overflow */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider block truncate">
              Semana Atual
            </span>
            <span className="text-[10px] sm:text-xs opacity-90 font-medium block truncate">
              {window.startDate} - {window.endDate} • {window.daysElapsed} {window.daysElapsed === 1 ? 'dia' : 'dias'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] sm:text-xs opacity-90 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-sm self-start sm:self-auto flex-shrink-0">
          <ConfidenceIcon className="w-3.5 h-3.5" />
          <span className="font-medium">{window.dayOfWeek}</span>
        </div>
      </div>

      {/* Metrics Grid - Better Mobile Stacking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Current Week Stats */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] sm:text-[11px] opacity-80 uppercase tracking-wide mb-1 font-semibold truncate">
                Receita
              </div>
              <div className="text-xl sm:text-3xl font-extrabold leading-tight truncate">
                {formatCurrency(currentWeek.netRevenue)}
              </div>
            </div>

            <div className="w-px h-8 sm:h-12 bg-white/20 flex-shrink-0" />

            <div className="flex-1 min-w-0">
              <div className="text-[10px] sm:text-[11px] opacity-80 uppercase tracking-wide mb-1 font-semibold truncate">
                Ciclos
              </div>
              <div className="text-xl sm:text-3xl font-extrabold leading-tight truncate">
                {formatNumber(currentWeek.totalServices)}
              </div>
            </div>

            <div className="w-px h-8 sm:h-12 bg-white/20 flex-shrink-0" />

            <div className="flex-1 min-w-0">
              <div className="text-[10px] sm:text-[11px] opacity-80 uppercase tracking-wide mb-1 font-semibold truncate">
                Utilização
              </div>
              <div className="text-xl sm:text-3xl font-extrabold leading-tight">
                {Math.round(currentWeek.totalUtilization)}%
              </div>
            </div>
          </div>
        </div>

        {/* Projection Panel */}
        {projection.canProject && (
          <div className="bg-gradient-to-br from-lavpop-green/20 to-emerald-600/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-lavpop-green/30">
            <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
              <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold flex items-center gap-2 truncate">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Projeção Semana Completa</span>
              </span>
              <span className="flex-shrink-0">{getTrendIcon()}</span>
            </div>

            <div className="flex flex-col gap-1 sm:gap-2">
              <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
                <span className="text-2xl sm:text-3xl font-extrabold truncate">
                  {formatCurrency(projection.projectedRevenue)}
                </span>
                <span className="text-xs sm:text-sm opacity-90 font-medium flex-shrink-0">
                  • {formatNumber(projection.projectedServices)} ciclos
                </span>
              </div>

              <div className="flex items-center gap-2 text-[10px] sm:text-xs flex-wrap">
                <span className={`font-semibold ${projection.revenueVsLast >= 0 ? 'text-emerald-200' : 'text-red-200'}`}>
                  {projection.revenueVsLast > 0 ? '+' : ''}{projection.revenueVsLast.toFixed(1)}% vs última semana
                </span>
                {projection.confidence === 'very_low' && (
                  <span className="text-[10px] bg-red-500/30 px-2 py-0.5 rounded-md font-bold flex-shrink-0">
                    Volátil
                  </span>
                )}
                {projection.confidence === 'low' && (
                  <span className="text-[10px] bg-amber-500/30 px-2 py-0.5 rounded-md font-bold flex-shrink-0">
                    Preliminar
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {!projection.canProject && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 flex items-center justify-center">
            <div className="text-sm opacity-80 italic text-center">
              {projection.message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentWeekBanner;
