// RevenueForecast.jsx v3.2.0 - MODE-AWARE WARNING BADGES
// Revenue projection card for Intelligence tab
// Design System v5.1 compliant - Premium Glass
//
// CHANGELOG:
// v3.2.0 (2026-01-29): Mode-aware warning badges
//   - Confidence badge amber state now light-friendly (amber-50/amber-500)
//   - Amber text now mode-aware (amber-800 light, white dark)
//   - Amber dot now mode-aware (amber-500 light, white/80 dark)
//   - Amber border now mode-aware (amber-200 light, amber-400 dark)
//   - Gap alert icon well changed to amber-600/amber-500
// v3.1.2 (2026-01-29): Orange→Yellow color migration
//   - Confidence badge amber state now uses yellow-600/yellow-500
//   - Confidence badge amber border now uses yellow-700/yellow-400
//   - Gap alert icon well now uses yellow-600/yellow-500
// v3.1.1 (2026-01-29): Amber→Orange color migration
//   - Confidence badge amber state now uses orange-600/orange-500
//   - Confidence badge amber border now uses orange-700/orange-400
//   - Gap alert icon well now uses orange-600/orange-500
// v3.1.0 (2026-01-28): Solid color badges for WCAG AA compliance
//   - Confidence badge now uses solid colors with white text
//   - Alert icon wells updated to solid colors with white icons
// v3.0.3 (2026-01-24): Removed colored left border
// v3.0.2 (2026-01-24): Mobile layout improvements
//   - Confidence badge always on right side of header (row layout)
//   - Shorter mobile label text, compact badge padding
//   - Progress bar full width on mobile (col-span-2)
//   - Temperature card full width on mobile (col-span-2)
// v3.0.1 (2026-01-24): Stats cards contrast and sizing
//   - Improved stats cards contrast (bg-slate-800/80 dark, bg-white light)
//   - Stronger ring borders and added shadow-sm
//   - Increased text sizes (labels: text-sm, values: text-xl on desktop)
//   - Better label contrast (text-slate-600/text-slate-300)
//   - Taller progress bar (h-2.5), bigger percentage (text-lg)
//   - Gap/Success boxes: larger icons (w-9), bigger text (text-base/text-sm)
// v3.0.0 (2026-01-23): Premium Glass upgrade + UX simplification
//   - Migrated to Premium Glass styling (backdrop-blur, ring-1, glow shadows)
//   - Changed accent from indigo/purple to teal (revenue category)
//   - Added useTheme() hook for theme-aware styling
//   - Added useMediaQuery() for responsive text sizing
//   - Modernized icon badge (w-10 h-10 rounded-xl bg-teal-500)
//   - Upgraded stats cards with Premium Glass depth
//   - Enhanced progress bar with glow effect
//   - Improved confidence badge with glassmorphism
//   - Removed framer-motion hover animation
//   - Removed static recovery options (ContingencyOption component)
//   - Kept year-over-year gap indicator and success message
// v2.5 (2026-01-09): Design System v4.0 Framer Motion compliance
//   - Added Framer Motion hover to main card container
//   - Added Framer Motion hover to ContingencyOption cards
// v2.4 (2025-12-28): Contingency guidance
//   - Added forecastContingency prop for year-over-year comparison
//   - Shows gap vs same month last year with recovery options
//   - Success message when ahead of target
// v2.3 (2025-12-20): Brazil timezone support
//   - Uses getBrazilDateParts() for current month/year
//   - Ensures consistent month display regardless of browser timezone
// v2.2 (2025-12-02): Improved data distribution layout
// v2.1 (2025-12-02): Horizontal layout for desktop
// v2.0 (2025-12-02): Weighted projection support
// v1.2 (2025-12-02): UX clarity improvements
// v1.1 (2025-11-30): Accessibility fix
// v1.0 (2025-11-30): Initial implementation

import React from 'react';
import { Target, AlertCircle, Info, Thermometer, CheckCircle, AlertTriangle } from 'lucide-react';
import { getBrazilDateParts } from '../../utils/dateUtils';
import { useTheme } from '../../contexts/ThemeContext';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const RevenueForecast = ({
  currentMonth,
  weightedProjection, // Calculated by parent using calculateWeightedProjection
  forecastContingency, // Year-over-year comparison from calculateForecastContingency
  formatCurrency,
  className = ''
}) => {
  const { isDark } = useTheme();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

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

  // Solid colors for confidence badges (WCAG AA compliant)
  const confidenceColors = {
    green: {
      bg: 'bg-emerald-600 dark:bg-emerald-500',
      text: 'text-white',
      dot: 'bg-white/80',
      border: 'ring-emerald-700 dark:ring-emerald-400'
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-500',
      text: 'text-amber-800 dark:text-white',
      dot: 'bg-amber-500 dark:bg-white/80',
      border: 'ring-amber-200 dark:ring-amber-400'
    },
    red: {
      bg: 'bg-red-600 dark:bg-red-500',
      text: 'text-white',
      dot: 'bg-white/80',
      border: 'ring-red-700 dark:ring-red-400'
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
        ${isDark ? 'bg-space-dust/40' : 'bg-white/80'}
        backdrop-blur-xl rounded-2xl p-5
        ${isDark
          ? 'ring-1 ring-white/[0.05] shadow-[0_0_20px_-5px_rgba(20,184,166,0.15),inset_0_1px_1px_rgba(255,255,255,0.10)]'
          : 'ring-1 ring-slate-200/80 shadow-[0_8px_32px_-12px_rgba(100,116,139,0.15),inset_0_1px_0_rgba(255,255,255,0.8)]'
        }
        overflow-hidden
        ${className}
      `}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3 mb-5">
        {/* Left: Icon Badge + Title + Projection */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-teal-500 dark:bg-teal-600 flex items-center justify-center shadow-sm shrink-0">
            <Target className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className={`${isDesktop ? 'text-base' : 'text-sm'} font-bold text-slate-800 dark:text-white`}>
              Projeção de Receita
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {currentMonthName} • {currentMonth.daysElapsed} dias
            </p>
            <p className={`${isDesktop ? 'text-3xl' : 'text-2xl'} font-bold text-teal-600 dark:text-teal-400 mt-2`}>
              {formatCurrency(projectedRevenue)}
            </p>
          </div>
        </div>

        {/* Right: Confidence Badge */}
        <div className={`
          flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shrink-0
          backdrop-blur-sm ring-1 ${confStyle.bg} ${confStyle.border}
        `}>
          <div className={`w-2 h-2 rounded-full ${confStyle.dot} animate-pulse`} aria-hidden="true" />
          <span className={`text-xs font-medium ${confStyle.text} whitespace-nowrap`}>
            {isDesktop ? `Confiança ${confidence.label}` : confidence.label}
          </span>
          {confidence.level === 'low' && (
            <AlertCircle className={`w-3.5 h-3.5 ${confStyle.text}`} aria-hidden="true" />
          )}
        </div>
      </div>

      {/* Stats Grid - Adaptive columns */}
      <div className={`grid gap-3 mb-5 ${showTempInsight ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-3'}`}>
        {/* Daily Average */}
        <div className={`
          p-3.5 rounded-xl
          ${isDark ? 'bg-slate-800/80' : 'bg-white'}
          ring-1 ${isDark ? 'ring-white/[0.08]' : 'ring-slate-200'}
          shadow-sm
        `}>
          <p className={`${isDesktop ? 'text-sm' : 'text-xs'} text-slate-600 dark:text-slate-300 mb-1`}>
            Média Diária
          </p>
          <p className={`${isDesktop ? 'text-xl' : 'text-lg'} font-bold text-slate-900 dark:text-white`}>
            {formatCurrency(dailyAverage)}
          </p>
        </div>

        {/* Days Remaining */}
        <div className={`
          p-3.5 rounded-xl
          ${isDark ? 'bg-slate-800/80' : 'bg-white'}
          ring-1 ${isDark ? 'ring-white/[0.08]' : 'ring-slate-200'}
          shadow-sm
        `}>
          <p className={`${isDesktop ? 'text-sm' : 'text-xs'} text-slate-600 dark:text-slate-300 mb-1`}>
            Dias Restantes
          </p>
          <p className={`${isDesktop ? 'text-xl' : 'text-lg'} font-bold text-slate-900 dark:text-white`}>
            {daysRemaining}
          </p>
        </div>

        {/* Month Progress - Full width on mobile */}
        <div className={`
          col-span-2 lg:col-span-1
          p-3.5 rounded-xl
          ${isDark ? 'bg-slate-800/80' : 'bg-white'}
          ring-1 ${isDark ? 'ring-white/[0.08]' : 'ring-slate-200'}
          shadow-sm
        `}>
          <p className={`${isDesktop ? 'text-sm' : 'text-xs'} text-slate-600 dark:text-slate-300 mb-2`}>
            Progresso do Mês
          </p>
          <div className="flex items-center gap-2">
            <div
              className={`
                flex-1 h-2.5 rounded-full overflow-hidden
                ${isDark ? 'bg-slate-700' : 'bg-slate-200'}
              `}
              role="progressbar"
              aria-valuenow={monthProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progresso do mês: ${monthProgress.toFixed(0)}%`}
            >
              <div
                className={`
                  h-full bg-gradient-to-r from-teal-500 to-cyan-400
                  transition-all duration-500
                  ${isDark ? 'shadow-[0_0_8px_rgba(20,184,166,0.4)]' : ''}
                `}
                style={{ width: `${monthProgress}%` }}
              />
            </div>
            <span className={`${isDesktop ? 'text-lg' : 'text-base'} font-bold text-slate-900 dark:text-white min-w-[3rem] text-right`}>
              {monthProgress.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Temperature Effect - Only show if significant correlation */}
        {showTempInsight && (
          <div className={`
            col-span-2 lg:col-span-1
            p-3.5 rounded-xl
            ${isDark ? 'bg-blue-900/50' : 'bg-blue-50'}
            ring-1 ${isDark ? 'ring-blue-400/20' : 'ring-blue-200'}
            shadow-sm
          `}>
            <div className="flex items-center gap-1.5 mb-1">
              <Thermometer className="w-4 h-4 text-blue-500 dark:text-blue-400" aria-hidden="true" />
              <p className={`${isDesktop ? 'text-sm' : 'text-xs'} text-blue-700 dark:text-blue-300`}>
                Fator Clima
              </p>
            </div>
            <p className={`${isDesktop ? 'text-xl' : 'text-lg'} font-bold text-blue-800 dark:text-blue-200`}>
              {getTempEffectText()}
            </p>
          </div>
        )}
      </div>

      {/* Year-over-year Comparison Section */}
      {forecastContingency && forecastContingency.lastYearRevenue > 0 && (
        <div className="mb-4">
          {/* Behind last year - show gap indicator */}
          {forecastContingency.gap > 0 && (
            <div className={`
              p-4 rounded-xl
              ${isDark ? 'bg-amber-900/20' : 'bg-amber-50/80'}
              ring-1 ${isDark ? 'ring-amber-500/20' : 'ring-amber-200'}
            `}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-600 dark:bg-amber-500 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h4 className={`${isDesktop ? 'text-base' : 'text-sm'} font-semibold text-amber-800 dark:text-amber-200`}>
                    Gap vs {forecastContingency.lastYearMonthName}: {formatCurrency(forecastContingency.gap)}
                  </h4>
                  <p className={`${isDesktop ? 'text-sm' : 'text-xs'} text-amber-700 dark:text-amber-300 mt-1`}>
                    Para igualar o mesmo período do ano passado ({formatCurrency(forecastContingency.lastYearRevenue)}),
                    você precisa de mais {formatCurrency(forecastContingency.gap)}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Ahead of last year - success message */}
          {forecastContingency.gap <= 0 && forecastContingency.surplusPercent > 5 && (
            <div className={`
              p-4 rounded-xl
              ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-50/80'}
              ring-1 ${isDark ? 'ring-emerald-500/20' : 'ring-emerald-200'}
            `}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h4 className={`${isDesktop ? 'text-base' : 'text-sm'} font-semibold text-emerald-800 dark:text-emerald-200`}>
                    Acima da meta em {forecastContingency.surplusPercent.toFixed(0)}%
                  </h4>
                  <p className={`${isDesktop ? 'text-sm' : 'text-xs'} text-emerald-700 dark:text-emerald-300 mt-1`}>
                    Projeção de {formatCurrency(projectedRevenue)} vs {formatCurrency(forecastContingency.lastYearRevenue)} no ano passado.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Methodology Footer */}
      <div className={`
        flex items-center gap-1.5 pt-3
        border-t ${isDark ? 'border-white/[0.05]' : 'border-slate-200/50'}
      `}>
        <Info className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400 flex-shrink-0" aria-hidden="true" />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {methodologyText}
        </p>
      </div>
    </div>
  );
};

export default RevenueForecast;
