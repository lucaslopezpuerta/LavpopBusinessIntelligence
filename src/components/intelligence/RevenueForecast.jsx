// RevenueForecast.jsx v2.3
// Revenue projection card for Intelligence tab
// Design System v3.1 compliant
//
// CHANGELOG:
// v2.3 (2025-12-20): Brazil timezone support
//   - Uses getBrazilDateParts() for current month/year
//   - Ensures consistent month display regardless of browser timezone
// v2.2 (2025-12-02): Improved data distribution layout
//   - Temperature insight now integrated as stat card (not separate box)
//   - Cleaner 3-4 column stats grid on desktop
//   - Progress bar and confidence in footer row
//   - Better visual balance across all screen sizes
// v2.1 (2025-12-02): Horizontal layout for desktop
//   - Two-column layout on lg screens (main | details)
//   - Better use of horizontal space when full-width
//   - Temperature insight moved to main column
//   - Progress + confidence in details column
// v2.0 (2025-12-02): Weighted projection support
//   - Now uses weighted projection (day-of-week + temperature)
//   - Accepts weightedProjection prop from parent
//   - Shows temperature correlation info when available
//   - Dynamic methodology note based on data availability
// v1.2 (2025-12-02): UX clarity improvements
//   - Added month name to header ("Projeção de Dezembro")
//   - Removed misleading growth comparison (projected vs actual)
//   - Added methodology note in footer ("projeção linear")
// v1.1 (2025-11-30): Accessibility fix
//   - Changed text-[10px] to text-xs (min 12px font)
// v1.0 (2025-11-30): Initial implementation
//   - Projects end-of-month revenue based on daily average
//   - Confidence indicator based on days elapsed
//   - Mobile responsive

import React from 'react';
import { Target, AlertCircle, Info, Thermometer } from 'lucide-react';
import { getBrazilDateParts } from '../../utils/dateUtils';

const RevenueForecast = ({
  currentMonth,
  weightedProjection, // New: calculated by parent using calculateWeightedProjection
  formatCurrency,
  className = ''
}) => {
  if (!currentMonth || !currentMonth.daysElapsed || currentMonth.daysElapsed === 0) {
    return null;
  }

  // Month names in Portuguese
  const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Use Brazil timezone for current month calculations
  const brazilParts = getBrazilDateParts();
  const currentMonthName = MONTH_NAMES[brazilParts.month - 1];
  const daysInMonth = new Date(brazilParts.year, brazilParts.month, 0).getDate();
  const daysRemaining = daysInMonth - currentMonth.daysElapsed;

  // Use weighted projection if available, otherwise fallback to linear
  const hasWeightedData = weightedProjection !== null && weightedProjection !== undefined;
  const projectedRevenue = hasWeightedData
    ? weightedProjection.weightedProjection
    : currentMonth.revenue + ((currentMonth.revenue / currentMonth.daysElapsed) * daysRemaining);

  const dailyAverage = currentMonth.revenue / currentMonth.daysElapsed;
  const monthProgress = (currentMonth.daysElapsed / daysInMonth) * 100;

  // Confidence from weighted projection or calculate
  const getConfidence = () => {
    if (hasWeightedData) {
      return {
        level: weightedProjection.confidenceLevel,
        label: weightedProjection.confidenceLevel === 'high' ? 'Alta'
          : weightedProjection.confidenceLevel === 'medium' ? 'Média' : 'Baixa',
        color: weightedProjection.confidenceLevel === 'high' ? 'green'
          : weightedProjection.confidenceLevel === 'medium' ? 'amber' : 'red'
      };
    }
    if (currentMonth.daysElapsed >= 20) return { level: 'high', label: 'Alta', color: 'green' };
    if (currentMonth.daysElapsed >= 10) return { level: 'medium', label: 'Média', color: 'amber' };
    return { level: 'low', label: 'Baixa', color: 'red' };
  };

  const confidence = getConfidence();

  // Temperature correlation info
  const tempCorr = hasWeightedData ? weightedProjection.temperatureCorrelation : null;
  const hasTemperatureData = tempCorr?.hasEnoughData;
  const showTempInsight = hasTemperatureData && Math.abs(tempCorr.correlation) > 0.1;

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

  // Methodology text
  const methodologyText = hasWeightedData
    ? weightedProjection.methodology
    : 'Projeção linear baseada na média diária';

  // Temperature effect text
  const getTempEffectText = () => {
    if (!showTempInsight) return null;
    const isInverse = tempCorr.correlation < 0;
    const effect = Math.abs(tempCorr.percentPerDegree).toFixed(1);
    return isInverse
      ? `+${effect}%/°C frio`
      : `+${effect}%/°C quente`;
  };

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
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        {/* Left: Title + Projection */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-200 dark:bg-indigo-800/50 rounded-lg flex-shrink-0">
            <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-indigo-900 dark:text-indigo-100">
              Projeção de {currentMonthName}
            </h3>
            <p className="text-2xl sm:text-3xl font-bold text-indigo-900 dark:text-indigo-100 mt-1">
              {formatCurrency(projectedRevenue)}
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
              Baseado em {currentMonth.daysElapsed} dias de dados
            </p>
          </div>
        </div>

        {/* Right: Confidence Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${confStyle.bg} self-start`}>
          <div className={`w-2 h-2 rounded-full ${confStyle.dot} animate-pulse`} aria-hidden="true" />
          <span className={`text-xs font-medium ${confStyle.text}`}>
            {confidence.label}
          </span>
          {confidence.level === 'low' && (
            <AlertCircle className={`w-3.5 h-3.5 ${confStyle.text}`} aria-hidden="true" />
          )}
        </div>
      </div>

      {/* Stats Grid - Adaptive columns */}
      <div className={`grid gap-3 mb-4 ${showTempInsight ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'}`}>
        {/* Daily Average */}
        <div className="p-3 bg-white/60 dark:bg-slate-800/50 rounded-lg">
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-0.5">
            Média Diária
          </p>
          <p className="text-base sm:text-lg font-bold text-indigo-900 dark:text-indigo-100">
            {formatCurrency(dailyAverage)}
          </p>
        </div>

        {/* Days Remaining */}
        <div className="p-3 bg-white/60 dark:bg-slate-800/50 rounded-lg">
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-0.5">
            Dias Restantes
          </p>
          <p className="text-base sm:text-lg font-bold text-indigo-900 dark:text-indigo-100">
            {daysRemaining}
          </p>
        </div>

        {/* Month Progress */}
        <div className="p-3 bg-white/60 dark:bg-slate-800/50 rounded-lg">
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-1">
            Progresso
          </p>
          <div className="flex items-center gap-2">
            <div
              className="flex-1 h-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full overflow-hidden"
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
            <span className="text-sm font-bold text-indigo-900 dark:text-indigo-100 min-w-[2.5rem] text-right">
              {monthProgress.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Temperature Effect - Only show if significant correlation */}
        {showTempInsight && (
          <div className="p-3 bg-blue-50/80 dark:bg-blue-900/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
            <div className="flex items-center gap-1 mb-0.5">
              <Thermometer className="w-3 h-3 text-blue-500 dark:text-blue-400" aria-hidden="true" />
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Fator Clima
              </p>
            </div>
            <p className="text-base sm:text-lg font-bold text-blue-700 dark:text-blue-300">
              {getTempEffectText()}
            </p>
          </div>
        )}
      </div>

      {/* Methodology Footer */}
      <div className="flex items-center gap-1.5 pt-3 border-t border-indigo-200/50 dark:border-indigo-700/50">
        <Info className="w-3 h-3 text-indigo-400 dark:text-indigo-500 flex-shrink-0" aria-hidden="true" />
        <p className="text-xs text-indigo-500 dark:text-indigo-400">
          {methodologyText}
        </p>
      </div>
    </div>
  );
};

export default RevenueForecast;
