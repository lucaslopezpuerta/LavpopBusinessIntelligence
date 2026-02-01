// WeatherBusinessImpact.jsx v3.8 - MODE-AWARE AMBER BADGE MIGRATION
// Forward-looking weather business impact with Ridge regression model
//
// CHANGELOG:
// v3.8 (2026-01-29): Mode-aware amber badge migration
//   - Replaced bg-yellow-600 dark:bg-yellow-500 with mode-aware amber badge styling
//   - Updated getIconStyle (holiday) and getConfidenceQuality (Razoavel badge)
//   - New pattern: bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500 dark:text-white dark:border-amber-400
// v3.7 (2026-01-29): Orange to yellow color migration
//   - Updated orange-600/orange-500 to yellow-600/yellow-500 in getIconStyle (holiday)
//   - Updated orange-600/orange-500 to yellow-600/yellow-500 in getConfidenceQuality (Razoavel badge)
// v3.6 (2026-01-29): Amber to orange color migration
//   - Updated amber-600/amber-500 to orange-600/orange-500 in getIconStyle (holiday)
//   - Updated amber-600/amber-500 to orange-600/orange-500 in getConfidenceQuality (Razoavel badge)
// v3.5 (2026-01-29): Solid color badge migration
//   - Updated getConfidenceQuality badge colors from opacity-based to solid
//   - Updated getIconStyle icon-well colors from opacity-based to solid
//   - Badge pattern: bg-{color}-600 dark:bg-{color}-500 text-white
// v3.4 (2026-01-28): Cosmic shimmer skeleton migration
//   - Replaced animate-pulse inline skeleton with Skeleton component (cosmic-shimmer)
//   - Added stagger props for cascading reveal animation
// v3.3 (2026-01-23): Confidence bar bugfix
//   - Fixed hasConfidence check treating 0 as falsy (0 is valid lower bound)
//   - Fixed getConfidenceBarWidth treating 0 as falsy
//   - Added tooltip explaining bar meaning ("Barra mais larga = maior confiança")
// v3.2 (2026-01-23): Enhanced prediction UX
//   - Added confidence bar visualization on day cards
//   - Added "Entenda a previsão" explanation panel
//   - Enhanced ModelBadge tooltip with feature list
//   - Shows interval method (statistical vs percentage)
// v3.1 (2026-01-20): Removed left border stripe per user request
// v3.0 (2026-01-20): Cosmic Precision upgrade
//   - Applied Variant C: Neutral Dashboard Cosmic (teal tint)
//   - Replaced glass card with gradient from-teal-50/40 via-white
//   - Dark mode: from-teal-900/10 via-space-nebula
//   - Updated header icon to teal accent
//   - Cosmic compliant: Design System v5.1
// v2.5 (2026-01-20): Design System v5.1 - no glow animations
//   - Removed cyan outer glow per user request
//   - Kept clean glass card with subtle shadow
//   - Maintained backdrop-blur-xl and ring styling
// v2.4 (2026-01-20): Cosmic Glass Card design
//   - Applied premium glass card pattern (bg-space-dust/40 dark, bg-white/80 light)
//   - Added backdrop-blur-xl for glassmorphism
//   - Added soft glow ring and layered shadows
//   - Theme-aware styling with useTheme hook
// v2.3 (2026-01-20): Confidence range indicators on day cards
//   - Shows confidence interval range (R$ X - R$ Y) on each prediction
//   - Uses OOS metrics (tracked_mape, oos_mape) for confidence badges
//   - Supports Ridge regression model from revenue-predict.js v4.0
// v2.2 (2025-12-22): Added haptic feedback on diagnostics modal
// v2.1 (2025-12-21): Enhanced UX with confidence badges and holiday display
//   - Confidence quality badge (Excelente/Bom/Razoável/Baixa based on R²)
//   - Holiday indicator on prediction cards
//   - Enhanced insights with actionable recommendations
//   - Tier message display when using reduced model
//   - Data quality indicator tooltip
// v2.0 (2025-12-21): Backend OLS regression model
//   - Uses Netlify function for predictions (revenue-predict.js)
//   - Features: rev_lag_1, rev_lag_7, is_weekend, drying_pain, rain indicators
//   - Shows predicted revenue per day with confidence intervals
//   - R² typically > 0.80 (vs ~10-20% with simple correlation)
// v1.1 (2025-12-21): Dynamic impact calculation using Pearson regression
// v1.0 (2025-12-20): Initial implementation

import React, { useMemo, useState } from 'react';
import {
  CloudRain,
  Thermometer,
  Sun,
  Cloud,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Calendar,
  RefreshCw,
  FlaskConical,
  PartyPopper,
  Info
} from 'lucide-react';
import AnimatedWeatherIcon from './AnimatedWeatherIcon';
import ModelDiagnostics from './ModelDiagnostics';
import useRevenuePrediction, { calculateWeeklySummary } from '../../hooks/useRevenuePrediction';
import { formatDateShort, getDayNamePt } from '../../utils/weatherUtils';
import { haptics } from '../../utils/haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { Skeleton } from '../ui/Skeleton';

// ============== SUB-COMPONENTS ==============

/**
 * Category label and icon configuration
 */
const CATEGORY_CONFIG = {
  rainy: {
    label: 'Chuvoso',
    Icon: CloudRain,
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-900/20'
  },
  cold: {
    label: 'Frio',
    Icon: Thermometer,
    colorClass: 'text-cyan-600 dark:text-cyan-400',
    bgClass: 'bg-cyan-50 dark:bg-cyan-900/20'
  },
  normal: {
    label: 'Normal',
    Icon: Sun,
    colorClass: 'text-slate-600 dark:text-slate-400',
    bgClass: 'bg-slate-50 dark:bg-slate-800/50'
  }
};

/**
 * Get impact color class based on percentage
 */
function getImpactColorClass(impact) {
  if (impact === null || impact === undefined) return 'text-slate-400';
  if (impact >= 5) return 'text-emerald-600 dark:text-emerald-400';
  if (impact <= -5) return 'text-red-600 dark:text-red-400';
  return 'text-slate-500 dark:text-slate-400';
}

/**
 * Get trend icon based on impact
 */
function getTrendIcon(impact) {
  if (impact === null || impact === undefined) return Minus;
  if (impact >= 5) return TrendingUp;
  if (impact <= -5) return TrendingDown;
  return Minus;
}

/**
 * Format impact percentage for display
 */
function formatImpact(impact) {
  if (impact === null || impact === undefined) return '—';
  const sign = impact >= 0 ? '+' : '';
  return `${sign}${Math.round(impact)}%`;
}

/**
 * Format currency for display
 */
function formatCurrencyCompact(value) {
  if (value === null || value === undefined) return '—';
  if (value >= 1000) {
    return `R$${(value / 1000).toFixed(1)}k`;
  }
  return `R$${Math.round(value)}`;
}

/**
 * Format confidence range for display
 */
function formatConfidenceRange(low, high) {
  // Use explicit null checks (0 is a valid lower bound)
  if (low == null && high == null) return null;
  const lowStr = formatCurrencyCompact(low ?? 0);
  const highStr = formatCurrencyCompact(high);
  return `${lowStr} - ${highStr}`;
}

/**
 * Calculate confidence bar width as percentage
 * Shows relative uncertainty - wider bar = more certain
 */
function getConfidenceBarWidth(predicted, low, high) {
  // Use explicit null/undefined checks (0 is a valid value)
  if (predicted == null || low == null || high == null || predicted <= 0) return 0;

  // Calculate the relative spread as % of predicted value
  const spread = high - low;
  const spreadPct = (spread / predicted) * 100;

  // Invert and scale: narrower spread (more confident) = wider bar
  // Map 0-100% spread to 100-20% bar width
  const barWidth = Math.max(20, Math.min(100, 100 - (spreadPct * 0.8)));
  return barWidth;
}

/**
 * Single day prediction card
 */
const DayPredictionCard = ({ prediction, forecast, isToday = false }) => {
  const category = prediction?.category || 'normal';
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.normal;
  const impact = prediction?.weather_impact_pct;
  const impactColor = getImpactColorClass(impact);
  const TrendIcon = getTrendIcon(impact);

  // Get day name from date
  const dayName = prediction?.date
    ? getDayNamePt(prediction.date, { short: true })
    : forecast?.dayName || '—';

  // Use forecast icon if available
  const icon = forecast?.icon || prediction?.icon || 'partly-cloudy-day';

  // Check for closed day
  const isClosed = prediction?.is_closed;
  const closedReason = prediction?.closed_reason;

  // Check for holiday
  const isHoliday = prediction?.features?.is_holiday || prediction?.holiday_name;
  const isHolidayEve = prediction?.features?.is_holiday_eve || prediction?.holiday_eve_name;
  const holidayName = prediction?.holiday_name || prediction?.features?.holiday_name;
  const holidayEveName = prediction?.holiday_eve_name || prediction?.features?.holiday_eve_name;

  // Build tooltip text: "Véspera de X" for eves, just "X" for holidays
  const tooltipText = isHoliday ? holidayName : isHolidayEve ? `Véspera de ${holidayEveName}` : null;

  // Confidence interval - use explicit null checks (0 is a valid lower bound)
  const confidenceLow = prediction?.confidence_low;
  const confidenceHigh = prediction?.confidence_high;
  const hasConfidence = confidenceLow != null && confidenceHigh != null && !isClosed;

  return (
    <div className={`
      p-3 rounded-lg text-center transition-shadow hover:shadow-md relative
      ${isToday ? 'ring-2 ring-sky-400 dark:ring-sky-500' : ''}
      ${isClosed ? 'ring-2 ring-red-400 dark:ring-red-500 bg-red-50 dark:bg-red-900/20' : isHoliday ? 'ring-2 ring-amber-400 dark:ring-amber-500' : ''}
      ${!isClosed ? config.bgClass : ''}
    `}>
      {/* Holiday/Eve indicator */}
      {(isHoliday || isHolidayEve) && !isClosed && (
        <div className="absolute -top-1 -right-1 p-1 bg-amber-400 dark:bg-amber-500 rounded-full" title={tooltipText}>
          <PartyPopper className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Day name */}
      <div className={`text-sm font-semibold ${isToday ? 'text-sky-600 dark:text-sky-400' : isClosed ? 'text-red-600 dark:text-red-400' : isHoliday ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
        {dayName}
      </div>

      {/* Date, holiday name, or closed reason */}
      <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
        {isClosed ? (
          <span className="text-red-600 dark:text-red-400 font-medium">
            Fechado
          </span>
        ) : isHoliday ? (
          <span className="text-amber-600 dark:text-amber-400 font-medium truncate block max-w-full" title={holidayName}>
            {holidayName?.length > 12 ? holidayName.slice(0, 10) + '...' : holidayName}
          </span>
        ) : (
          prediction?.date ? formatDateShort(prediction.date) : '—'
        )}
      </div>

      {/* Weather icon */}
      <div className="flex justify-center mb-2">
        <AnimatedWeatherIcon
          icon={icon}
          size="sm"
          animated={isToday}
        />
      </div>

      {/* Predicted revenue or closed message */}
      <div className="text-base font-bold text-slate-900 dark:text-white mb-0.5">
        {isClosed ? (
          <span className="text-red-500 dark:text-red-400">—</span>
        ) : (
          formatCurrencyCompact(prediction?.predicted_revenue)
        )}
      </div>

      {/* Confidence range with visual bar */}
      {hasConfidence && (
        <div className="mb-1" title="Barra mais larga = maior confiança na previsão">
          {/* Visual confidence bar - wider = more confident */}
          <div className="relative h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-0.5">
            <div
              className="absolute inset-y-0 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-400/60 via-emerald-500 to-emerald-400/60 dark:from-emerald-500/60 dark:via-emerald-400 dark:to-emerald-500/60 rounded-full transition-all duration-300"
              style={{ width: `${getConfidenceBarWidth(prediction?.predicted_revenue, confidenceLow, confidenceHigh)}%` }}
            />
          </div>
          {/* Text range */}
          <div className="text-[10px] text-slate-400 dark:text-slate-400">
            {formatConfidenceRange(confidenceLow, confidenceHigh)}
          </div>
        </div>
      )}

      {/* Weather impact percentage or closed indicator */}
      {isClosed ? (
        <div className="text-xs text-red-500 dark:text-red-400 font-medium">
          {closedReason}
        </div>
      ) : (
        <div className={`flex items-center justify-center gap-1 text-xs font-medium ${impactColor}`}>
          <TrendIcon className="w-3 h-3" />
          {formatImpact(impact)}
        </div>
      )}
    </div>
  );
};

/**
 * Dynamic insight card based on upcoming predictions
 */
const InsightCard = ({ predictions, modelInfo }) => {
  const insight = useMemo(() => {
    if (!predictions?.length) return null;

    const next3Days = predictions.slice(0, 3);

    // Priority 0: Check for closed days
    const closedDay = next3Days.find(d => d.is_closed);
    if (closedDay) {
      const dayName = getDayNamePt(closedDay.date, { short: false });
      return {
        type: 'closed',
        day: closedDay,
        title: `Fechado (${dayName})`,
        message: `Lavanderia fechada - ${closedDay.closed_reason}`,
        action: null,
        priority: 'high'
      };
    }

    // Priority 1: Check for holidays (not closed)
    const holidayDay = next3Days.find(d => (d.features?.is_holiday || d.holiday_name) && !d.is_closed);
    if (holidayDay) {
      const dayName = getDayNamePt(holidayDay.date, { short: false });
      const holidayName = holidayDay.holiday_name || holidayDay.features?.holiday_name;
      return {
        type: 'holiday',
        day: holidayDay,
        title: `${holidayName} (${dayName})`,
        message: 'Verifique horário de funcionamento e disponibilidade das máquinas',
        action: 'Confirme estoque de produtos e troco nas máquinas',
        priority: 'high'
      };
    }

    // Priority 2: Check for holiday eve
    const holidayEveDay = next3Days.find(d => d.features?.is_holiday_eve || d.holiday_eve_name);
    if (holidayEveDay) {
      const dayName = getDayNamePt(holidayEveDay.date, { short: false });
      const eveName = holidayEveDay.holiday_eve_name || holidayEveDay.features?.holiday_eve_name;
      return {
        type: 'holiday',
        day: holidayEveDay,
        title: `Véspera de ${eveName} (${dayName})`,
        message: 'Vésperas de feriado costumam ter maior movimento',
        action: 'Verifique estoque de sabão e amaciante nas vending',
        priority: 'medium'
      };
    }

    // Priority 3: Find rainy day
    const rainyDay = next3Days.find(d => d.category === 'rainy');
    if (rainyDay && rainyDay.weather_impact_pct !== null) {
      const dayName = getDayNamePt(rainyDay.date, { short: false });
      const isPositiveImpact = rainyDay.weather_impact_pct >= 0;
      return {
        type: 'rainy',
        day: rainyDay,
        title: `Chuva prevista para ${dayName}`,
        message: isPositiveImpact
          ? `Dificuldade de secar roupa aumenta movimento (~${Math.round(rainyDay.weather_impact_pct)}%)`
          : `Prepare-se para movimento ligeiramente reduzido`,
        action: isPositiveImpact
          ? 'Garanta que secadoras estejam funcionando'
          : null,
        priority: isPositiveImpact ? 'medium' : 'low'
      };
    }

    // Priority 4: Find cold day
    const coldDay = next3Days.find(d => d.category === 'cold');
    if (coldDay && coldDay.weather_impact_pct !== null) {
      const dayName = getDayNamePt(coldDay.date, { short: false });
      return {
        type: 'cold',
        day: coldDay,
        title: `Frente fria chegando ${dayName}`,
        message: coldDay.weather_impact_pct >= 0
          ? `Dias frios trazem cobertores e roupas pesadas`
          : `Espere movimento dentro da média`,
        action: coldDay.weather_impact_pct >= 0
          ? 'Máquinas de maior capacidade terão mais uso'
          : null,
        priority: 'low'
      };
    }

    // Priority 5: Find weekend
    const weekendDay = next3Days.find(d => d.features?.is_weekend);
    if (weekendDay) {
      const dayName = getDayNamePt(weekendDay.date, { short: false });
      return {
        type: 'normal',
        day: weekendDay,
        title: `Final de semana vem aí (${dayName})`,
        message: 'Finais de semana tendem a ter maior movimento',
        action: 'Verifique funcionamento de todas as máquinas',
        priority: 'low'
      };
    }

    // Check model quality warning
    if (modelInfo?.r_squared < 0.6) {
      return {
        type: 'warning',
        day: null,
        title: 'Modelo com precisão reduzida',
        message: 'As previsões podem ter maior margem de erro do que o normal',
        action: 'Mais dados melhorarão a precisão automaticamente',
        priority: 'low'
      };
    }

    // Default: stable week
    return {
      type: 'normal',
      day: null,
      title: 'Semana estável',
      message: 'Receita dentro da média esperada para os próximos dias',
      action: null,
      priority: 'low'
    };
  }, [predictions, modelInfo]);

  if (!insight) return null;

  const iconMap = {
    rainy: CloudRain,
    cold: Thermometer,
    normal: Calendar,
    holiday: PartyPopper,
    closed: AlertCircle,
    warning: AlertCircle
  };
  const Icon = iconMap[insight.type] || Calendar;

  const priorityColors = {
    high: insight.type === 'closed' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-amber-500',
    medium: 'border-l-4 border-l-blue-500',
    low: ''
  };

  // Icon background and color based on type
  const getIconStyle = () => {
    if (insight.type === 'closed') return { bg: 'bg-red-600 dark:bg-red-500', color: 'text-white' };
    if (insight.type === 'holiday') return { bg: 'bg-amber-50 border border-amber-200 dark:bg-amber-500 dark:border-amber-400', color: 'text-amber-800 dark:text-white' };
    return { bg: 'bg-white dark:bg-slate-700', color: 'text-slate-600 dark:text-slate-300' };
  };
  const iconStyle = getIconStyle();

  return (
    <div className={`flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg mb-4 ${priorityColors[insight.priority]}`}>
      <div className={`p-2 rounded-lg flex-shrink-0 ${iconStyle.bg}`}>
        <Icon className={`w-5 h-5 ${iconStyle.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
          {insight.title}
        </h4>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
          {insight.message}
        </p>
        {insight.action && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5 font-medium">
            → {insight.action}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Get confidence quality based on OOS MAPE (or fallback to R²)
 * Lower MAPE = better predictions
 */
function getConfidenceQuality(modelInfo) {
  // Prefer tracked MAPE (actual predictions vs actuals), then OOS MAPE, then R²
  const mape = modelInfo?.tracked_mape || modelInfo?.oos_mape;

  if (mape !== null && mape !== undefined) {
    // MAPE-based quality (lower is better)
    // Thresholds adjusted for revenue prediction domain where:
    // - Daily revenue has high variance (closures, holidays, weather)
    // - 45-50% MAPE is a good result given inherent unpredictability
    if (mape <= 25) return { label: 'Excelente', color: 'text-white', bg: 'bg-emerald-600 dark:bg-emerald-500', metric: `MAPE ${Math.round(mape)}%` };
    if (mape <= 40) return { label: 'Bom', color: 'text-white', bg: 'bg-blue-600 dark:bg-blue-500', metric: `MAPE ${Math.round(mape)}%` };
    if (mape <= 55) return { label: 'Razoável', color: 'text-amber-800 dark:text-white', bg: 'bg-amber-50 border border-amber-200 dark:bg-amber-500 dark:border-amber-400', metric: `MAPE ${Math.round(mape)}%` };
    return { label: 'Baixa', color: 'text-white', bg: 'bg-red-600 dark:bg-red-500', metric: `MAPE ${Math.round(mape)}%` };
  }

  // Fallback to R² if no OOS metrics
  const rSquared = modelInfo?.r_squared || 0;
  const rSquaredPct = Math.round(rSquared * 100);
  if (rSquared >= 0.85) return { label: 'Excelente', color: 'text-white', bg: 'bg-emerald-600 dark:bg-emerald-500', metric: `R² ${rSquaredPct}%` };
  if (rSquared >= 0.75) return { label: 'Bom', color: 'text-white', bg: 'bg-blue-600 dark:bg-blue-500', metric: `R² ${rSquaredPct}%` };
  if (rSquared >= 0.60) return { label: 'Razoável', color: 'text-amber-800 dark:text-white', bg: 'bg-amber-50 border border-amber-200 dark:bg-amber-500 dark:border-amber-400', metric: `R² ${rSquaredPct}%` };
  return { label: 'Baixa', color: 'text-white', bg: 'bg-red-600 dark:bg-red-500', metric: `R² ${rSquaredPct}%` };
}

/**
 * Model accuracy badge with tooltip
 */
const ModelBadge = ({ modelInfo, onClick }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!modelInfo) return null;

  const quality = getConfidenceQuality(modelInfo);
  const hasOOSMetrics = modelInfo.tracked_mape || modelInfo.oos_mape;
  const trackedMAPE = modelInfo.tracked_mape;
  const trackedMAE = modelInfo.tracked_mae;
  const rSquaredPct = Math.round((modelInfo.r_squared || 0) * 100);
  const intervalMethod = modelInfo.interval_method || 'percentage';
  const featureCount = modelInfo.feature_names?.length || 0;

  return (
    <div className="relative">
      <button
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors cursor-pointer ${quality.bg} hover:opacity-80`}
      >
        <FlaskConical className={`w-3.5 h-3.5 ${quality.color}`} />
        <span className={`text-xs font-medium ${quality.color}`}>
          {quality.label} ({quality.metric})
        </span>
        <Info className="w-3 h-3 text-slate-400" />
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 w-80 p-3 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-10">
          <p className="text-xs font-semibold text-slate-900 dark:text-white mb-2">
            Modelo Ridge {featureCount > 0 && `(${featureCount} variáveis)`}
          </p>
          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            {/* OOS metrics (most important) */}
            {hasOOSMetrics && (
              <>
                <p className="font-medium text-slate-900 dark:text-white">
                  Precisão Real (fora da amostra):
                </p>
                {trackedMAPE && (
                  <p>
                    <span className="font-medium">MAPE = {Math.round(trackedMAPE)}%</span> — Erro percentual médio
                  </p>
                )}
                {trackedMAE && (
                  <p>
                    <span className="font-medium">MAE = R${trackedMAE}</span> — Erro absoluto médio
                  </p>
                )}
                {modelInfo.tracked_predictions > 0 && (
                  <p className="text-slate-500">
                    Baseado em {modelInfo.tracked_predictions} previsões verificadas
                  </p>
                )}
              </>
            )}

            {/* Model features highlight */}
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">
                Variáveis do modelo:
              </p>
              <div className="flex flex-wrap gap-1">
                {modelInfo.feature_names?.slice(1, 7).map((name, idx) => (
                  <span key={idx} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px]">
                    {name.replace(/_/g, ' ')}
                  </span>
                ))}
                {featureCount > 7 && (
                  <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px]">
                    +{featureCount - 7} mais
                  </span>
                )}
              </div>
            </div>

            {/* Interval method */}
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <p>
                <span className="font-medium">Intervalos:</span> {intervalMethod === 'statistical' ? 'Estatísticos (SE)' : 'Baseados em %'}
              </p>
              <p>
                <span className="font-medium">R² = {rSquaredPct}%</span> — Ajuste aos dados
              </p>
              <p>
                <span className="font-medium">{modelInfo.n_training_samples} dias</span> de histórico
              </p>
            </div>

            {modelInfo.model_tier && modelInfo.model_tier !== 'full' && (
              <p className="mt-2 text-amber-600 dark:text-amber-400">
                Modelo simplificado devido a dados limitados
              </p>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 italic">
            Clique para ver diagnósticos completos
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Prediction explanation panel
 * Shows what factors are driving the predictions
 */
const PredictionExplanation = ({ predictions, modelInfo }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!predictions?.length || !modelInfo) return null;

  // Analyze key drivers across predictions
  const drivers = useMemo(() => {
    const result = {
      lagInfluence: 0,
      weatherInfluence: 0,
      weekendDays: 0,
      holidayDays: 0,
      rainyDays: 0,
      avgTrend: 0
    };

    predictions.forEach(pred => {
      if (pred.is_closed) return;

      // Count special days
      if (pred.features?.is_weekend) result.weekendDays++;
      if (pred.features?.is_holiday || pred.features?.is_holiday_eve) result.holidayDays++;
      if (pred.features?.is_rainy) result.rainyDays++;

      // Estimate trend from MA vs lag7
      if (pred.features?.rev_ma_7 && pred.features?.rev_lag_7) {
        const trendPct = ((pred.features.rev_ma_7 - pred.features.rev_lag_7) / pred.features.rev_lag_7) * 100;
        result.avgTrend += trendPct;
      }

      // Accumulate weather impact
      result.weatherInfluence += Math.abs(pred.weather_impact_pct || 0);
    });

    // Average out trend
    const activeDays = predictions.filter(p => !p.is_closed).length;
    if (activeDays > 0) {
      result.avgTrend = result.avgTrend / activeDays;
      result.weatherInfluence = result.weatherInfluence / activeDays;
    }

    return result;
  }, [predictions]);

  // Generate explanation text
  const explanations = useMemo(() => {
    const items = [];

    // Trend explanation
    if (Math.abs(drivers.avgTrend) > 5) {
      items.push({
        icon: drivers.avgTrend > 0 ? TrendingUp : TrendingDown,
        text: drivers.avgTrend > 0
          ? `Tendência de alta: receita ~${Math.round(drivers.avgTrend)}% acima da semana anterior`
          : `Tendência de queda: receita ~${Math.abs(Math.round(drivers.avgTrend))}% abaixo da semana anterior`,
        color: drivers.avgTrend > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
      });
    }

    // Weekend influence
    if (drivers.weekendDays > 0) {
      items.push({
        icon: Calendar,
        text: `${drivers.weekendDays} dia${drivers.weekendDays > 1 ? 's' : ''} de fim de semana (maior movimento)`,
        color: 'text-blue-600 dark:text-blue-400'
      });
    }

    // Holiday influence
    if (drivers.holidayDays > 0) {
      items.push({
        icon: PartyPopper,
        text: `${drivers.holidayDays} dia${drivers.holidayDays > 1 ? 's' : ''} de feriado/véspera no período`,
        color: 'text-amber-600 dark:text-amber-400'
      });
    }

    // Weather influence
    if (drivers.rainyDays > 0) {
      items.push({
        icon: CloudRain,
        text: `${drivers.rainyDays} dia${drivers.rainyDays > 1 ? 's' : ''} com chuva prevista (impacto nas secadoras)`,
        color: 'text-blue-600 dark:text-blue-400'
      });
    }

    // Model info
    if (modelInfo.interval_method === 'statistical') {
      items.push({
        icon: FlaskConical,
        text: 'Intervalos calculados com erro padrão estatístico',
        color: 'text-slate-500 dark:text-slate-400'
      });
    }

    return items;
  }, [drivers, modelInfo]);

  if (explanations.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
      <button
        onClick={() => { haptics.light(); setIsExpanded(!isExpanded); }}
        className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors w-full"
      >
        <Info className="w-4 h-4" />
        <span>Entenda a previsão</span>
        <svg
          className={`w-4 h-4 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {explanations.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs">
              <item.icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${item.color}`} />
              <span className="text-slate-600 dark:text-slate-400">{item.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Weekly summary row
 */
const WeeklySummary = ({ predictions, formatCurrency }) => {
  const summary = useMemo(() => {
    return calculateWeeklySummary(predictions);
  }, [predictions]);

  if (!summary || summary.days === 0) return null;

  const impactColor = getImpactColorClass(summary.avgImpact);

  return (
    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
      <span className="text-sm text-slate-600 dark:text-slate-400">
        Projeção semanal ({summary.days} dias)
      </span>
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold text-slate-900 dark:text-white">
          {formatCurrency(summary.totalRevenue)}
        </span>
        <span className={`text-sm font-medium ${impactColor}`}>
          ({formatImpact(summary.avgImpact)} clima)
        </span>
      </div>
    </div>
  );
};

/**
 * Loading skeleton
 */
const LoadingSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-16 rounded-lg" stagger staggerIndex={0} />
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
      {[...Array(7)].map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-lg" stagger staggerIndex={Math.min(1 + i, 7)} />
      ))}
    </div>
  </div>
);

// ============== MAIN COMPONENT ==============

/**
 * WeatherBusinessImpact Component
 *
 * Forward-looking weather business impact display using OLS regression model.
 * Fetches predictions from backend Netlify function.
 *
 * @param {Object} props
 * @param {Array} props.forecast - 7-day forecast from useWeatherForecast (for icons)
 * @param {Function} props.formatCurrency - Currency formatter
 * @param {string} props.className - Additional CSS classes
 */
const WeatherBusinessImpact = ({
  forecast = [],
  formatCurrency = (v) => `R$ ${Math.round(v || 0)}`,
  className = ''
}) => {
  const { isDark } = useTheme();

  // Fetch predictions from backend
  const {
    predictions,
    modelInfo,
    dataQuality,
    loading,
    error,
    refresh,
    hasData
  } = useRevenuePrediction();

  // State for diagnostics modal - must be before any early returns
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Merge predictions with forecast data (for icons, day names)
  const mergedData = useMemo(() => {
    if (!predictions?.length) return [];

    return predictions.map((pred, idx) => {
      // Find matching forecast day
      const forecastDay = forecast.find(f => f.date === pred.date) || forecast[idx];

      return {
        ...pred,
        dayName: forecastDay?.dayName || getDayNamePt(pred.date, { short: true }),
        icon: forecastDay?.icon || pred.icon || 'partly-cloudy-day'
      };
    });
  }, [predictions, forecast]);

  // Variant C: Neutral Dashboard Cosmic (teal tint)
  const cosmicCardClasses = `
    bg-gradient-to-br from-teal-50/40 via-white to-white
    dark:from-teal-900/10 dark:via-space-nebula dark:to-space-nebula
    border border-slate-200/80 dark:border-stellar-cyan/10
    rounded-2xl
  `;

  // Loading state
  if (loading && !hasData) {
    return (
      <div className={`${cosmicCardClasses} ${className}`}>
        <div className="p-4 border-b border-slate-200/80 dark:border-stellar-cyan/10">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Impacto no Negócio
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Carregando modelo de previsão...
          </p>
        </div>
        <div className="p-4">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  // Error state
  if (error && !hasData) {
    return (
      <div className={`${cosmicCardClasses} ${className}`}>
        <div className="p-4 border-b border-slate-200/80 dark:border-stellar-cyan/10">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Impacto no Negócio
          </h3>
        </div>
        <div className="p-6 text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 text-amber-500" />
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">
            {error || 'Erro ao carregar previsões'}
          </p>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!hasData) {
    return (
      <div className={`${cosmicCardClasses} ${className}`}>
        <div className="p-4 border-b border-slate-200/80 dark:border-stellar-cyan/10">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Impacto no Negócio
          </h3>
        </div>
        <div className="p-6 text-center">
          <Cloud className="w-8 h-8 mx-auto mb-3 text-slate-400" />
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Coletando dados para o modelo de previsão...
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-2">
            São necessários pelo menos 30 dias de dados
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${cosmicCardClasses} ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-200/80 dark:border-stellar-cyan/10">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/40 rounded-lg flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                Impacto no Negócio
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Previsão baseada em {modelInfo?.n_training_samples || 0} dias de histórico
                {modelInfo?.tier_message && (
                  <span className="ml-2 text-amber-600 dark:text-amber-400">
                    ({modelInfo.tier_message})
                  </span>
                )}
              </p>
            </div>
          </div>
          <ModelBadge modelInfo={modelInfo} onClick={() => { haptics.light(); setShowDiagnostics(true); }} />
        </div>
      </div>

      <div className="p-4">
        {/* Dynamic Insight */}
        <InsightCard predictions={mergedData} modelInfo={modelInfo} />

        {/* 7-day prediction grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {mergedData.map((pred, idx) => (
            <DayPredictionCard
              key={pred.date}
              prediction={pred}
              forecast={forecast[idx]}
              isToday={idx === 0}
            />
          ))}
        </div>

        {/* Weekly Summary */}
        <WeeklySummary
          predictions={predictions}
          formatCurrency={formatCurrency}
        />

        {/* Prediction Explanation Panel */}
        <PredictionExplanation
          predictions={mergedData}
          modelInfo={modelInfo}
        />

        {/* Model MAE indicator */}
        {modelInfo?.mae && (
          <div className="mt-3 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-400">
              Margem de erro: ±R$ {modelInfo.mae}/dia
              {modelInfo.interval_method === 'statistical' && (
                <span className="ml-1 text-emerald-500">• estatístico</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Model Diagnostics Modal */}
      <ModelDiagnostics
        isOpen={showDiagnostics}
        onClose={() => setShowDiagnostics(false)}
        modelInfo={modelInfo}
        dataQuality={dataQuality}
      />
    </div>
  );
};

export default WeatherBusinessImpact;
