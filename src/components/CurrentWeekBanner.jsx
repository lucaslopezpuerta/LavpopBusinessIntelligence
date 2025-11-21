// CurrentWeekBanner.jsx v3.0 - COMPACT REDESIGN
// ✅ Single row layout (reduced height)
// ✅ Lavpop branding (blue/green)
// ✅ Better mobile stacking
// ✅ No logic changes
//
// CHANGELOG:
// v3.0 (2025-11-21): Compact redesign

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';

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

  const getTrendIcon = () => {
    if (!projection.canProject) return null;

    if (projection.trend === 'up') {
      return <TrendingUp className="w-4 h-4 text-lavpop-green" />;
    } else if (projection.trend === 'down') {
      return <TrendingDown className="w-4 h-4 text-red-400" />;
    } else {
      return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-700 via-lavpop-blue to-blue-900 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-4 sm:p-6 text-white shadow-lg border border-blue-600/30 dark:border-slate-700">
      
      {/* Single Row Layout */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        
        {/* Left: Title & Date */}
        <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold uppercase tracking-wider truncate">
              Semana Atual
            </h3>
            <p className="text-xs opacity-90 truncate">
              {window.startDate} - {window.endDate} • {window.daysElapsed} {window.daysElapsed === 1 ? 'dia' : 'dias'}
            </p>
          </div>
        </div>

        {/* Center: Current Stats */}
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap lg:flex-nowrap">
          <div className="min-w-0">
            <div className="text-[10px] opacity-80 uppercase tracking-wide font-semibold mb-0.5">
              Receita
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold truncate">
              {formatCurrency(currentWeek.netRevenue)}
            </div>
          </div>

          <div className="w-px h-10 bg-white/20 hidden sm:block" />

          <div className="min-w-0">
            <div className="text-[10px] opacity-80 uppercase tracking-wide font-semibold mb-0.5">
              Ciclos
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold truncate">
              {formatNumber(currentWeek.totalServices)}
            </div>
          </div>

          <div className="w-px h-10 bg-white/20 hidden sm:block" />

          <div className="min-w-0">
            <div className="text-[10px] opacity-80 uppercase tracking-wide font-semibold mb-0.5">
              Utilização
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold">
              {Math.round(currentWeek.totalUtilization)}%
            </div>
          </div>
        </div>

        {/* Right: Projection */}
        {projection.canProject && (
          <div className="bg-lavpop-green/20 dark:bg-lavpop-green/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-lavpop-green/30 flex-shrink-0">
            <div className="flex items-center gap-2 mb-1">
              {getTrendIcon()}
              <span className="text-[10px] uppercase tracking-wider font-bold">
                Projeção
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white">
                {formatCurrency(projection.projectedRevenue)}
              </span>
              <span className={`text-xs font-semibold ${projection.revenueVsLast >= 0 ? 'text-lavpop-green' : 'text-red-300'}`}>
                {projection.revenueVsLast > 0 ? '+' : ''}{projection.revenueVsLast.toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {!projection.canProject && (
          <div className="text-sm opacity-80 italic">
            {projection.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentWeekBanner;
