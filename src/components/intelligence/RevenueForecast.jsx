// RevenueForecast.jsx v1.0
// Revenue projection card for Intelligence tab
// Design System v3.0 compliant
//
// CHANGELOG:
// v1.0 (2025-11-30): Initial implementation
//   - Projects end-of-month revenue based on daily average
//   - Confidence indicator based on days elapsed
//   - Comparison with previous month
//   - Mobile responsive

import React from 'react';
import { TrendingUp, TrendingDown, Target, AlertCircle } from 'lucide-react';

const RevenueForecast = ({
  currentMonth,
  previousMonth,
  formatCurrency,
  className = ''
}) => {
  if (!currentMonth || !currentMonth.daysElapsed || currentMonth.daysElapsed === 0) {
    return null;
  }

  // Calculate projections
  const dailyAverage = currentMonth.revenue / currentMonth.daysElapsed;
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - currentMonth.daysElapsed;
  const projectedRevenue = currentMonth.revenue + (dailyAverage * daysRemaining);

  // Confidence level based on data points
  const getConfidence = () => {
    if (currentMonth.daysElapsed >= 20) return { level: 'high', label: 'Alta', color: 'green' };
    if (currentMonth.daysElapsed >= 10) return { level: 'medium', label: 'Média', color: 'amber' };
    return { level: 'low', label: 'Baixa', color: 'red' };
  };

  const confidence = getConfidence();

  // Compare with previous month
  const previousMonthRevenue = previousMonth?.revenue || 0;
  const projectedGrowth = previousMonthRevenue > 0
    ? ((projectedRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
    : 0;
  const isGrowthPositive = projectedGrowth > 0;

  // Progress through month
  const monthProgress = (currentMonth.daysElapsed / daysInMonth) * 100;

  const confidenceColors = {
    green: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-300',
      dot: 'bg-green-500'
    },
    amber: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-300',
      dot: 'bg-amber-500'
    },
    red: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-300',
      dot: 'bg-red-500'
    }
  };

  const confStyle = confidenceColors[confidence.color];

  return (
    <div
      className={`
        bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-50
        dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-indigo-900/20
        border border-indigo-200 dark:border-indigo-800
        rounded-xl p-4 sm:p-6
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <div className="p-1.5 sm:p-2 bg-indigo-200 dark:bg-indigo-800/50 rounded-lg">
          <Target className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-indigo-900 dark:text-indigo-100">
            Projeção do Mês
          </h3>
          <p className="text-[10px] sm:text-xs text-indigo-700 dark:text-indigo-400">
            Baseado em {currentMonth.daysElapsed} dias de dados
          </p>
        </div>
      </div>

      {/* Projected Revenue */}
      <div className="mb-4">
        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-indigo-900 dark:text-indigo-100">
          {formatCurrency(projectedRevenue)}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          <span className="text-xs sm:text-sm text-indigo-700 dark:text-indigo-400">
            Receita projetada para fim do mês
          </span>
          {previousMonthRevenue > 0 && (
            <span
              className={`inline-flex items-center gap-1 text-xs sm:text-sm font-semibold ${
                isGrowthPositive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {isGrowthPositive ? (
                <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              {isGrowthPositive ? '+' : ''}{projectedGrowth.toFixed(1)}% vs mês anterior
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
        <div className="p-2.5 sm:p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
          <p className="text-[10px] sm:text-xs text-indigo-700 dark:text-indigo-400 mb-0.5">
            Média Diária
          </p>
          <p className="text-sm sm:text-lg font-bold text-indigo-900 dark:text-indigo-100">
            {formatCurrency(dailyAverage)}
          </p>
        </div>
        <div className="p-2.5 sm:p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
          <p className="text-[10px] sm:text-xs text-indigo-700 dark:text-indigo-400 mb-0.5">
            Dias Restantes
          </p>
          <p className="text-sm sm:text-lg font-bold text-indigo-900 dark:text-indigo-100">
            {daysRemaining} dias
          </p>
        </div>
      </div>

      {/* Month Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] sm:text-xs text-indigo-700 dark:text-indigo-400 mb-1.5">
          <span>Progresso do mês</span>
          <span>{monthProgress.toFixed(0)}%</span>
        </div>
        <div
          className="h-2 bg-white/50 dark:bg-slate-800/50 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={monthProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progresso do mês: ${monthProgress.toFixed(0)}%`}
        >
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${monthProgress}%` }}
          />
        </div>
      </div>

      {/* Confidence Indicator */}
      <div className={`flex items-center gap-2 p-2.5 sm:p-3 rounded-lg ${confStyle.bg}`}>
        <div className={`w-2 h-2 rounded-full ${confStyle.dot} animate-pulse`} aria-hidden="true" />
        <span className={`text-xs sm:text-sm font-medium ${confStyle.text}`}>
          Confiança: {confidence.label}
        </span>
        {confidence.level === 'low' && (
          <div className="flex items-center gap-1 ml-auto">
            <AlertCircle className={`w-3.5 h-3.5 ${confStyle.text}`} aria-hidden="true" />
            <span className={`text-[10px] sm:text-xs ${confStyle.text}`}>
              Poucos dados
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueForecast;
