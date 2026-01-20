// WeatherBusinessImpact.jsx v3.0 - DESIGN SYSTEM v5.1
// Forward-looking weather business impact with Ridge regression model
//
// CHANGELOG:
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
  if (!low && !high) return null;
  const lowStr = formatCurrencyCompact(low);
  const highStr = formatCurrencyCompact(high);
  return `${lowStr} - ${highStr}`;
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

  // Confidence interval
  const confidenceLow = prediction?.confidence_low;
  const confidenceHigh = prediction?.confidence_high;
  const hasConfidence = confidenceLow && confidenceHigh && !isClosed;

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

      {/* Confidence range */}
      {hasConfidence && (
        <div className="text-[10px] text-slate-400 dark:text-slate-500 mb-1">
          {formatConfidenceRange(confidenceLow, confidenceHigh)}
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
    if (insight.type === 'closed') return { bg: 'bg-red-100 dark:bg-red-900/30', color: 'text-red-600 dark:text-red-400' };
    if (insight.type === 'holiday') return { bg: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400' };
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
    if (mape <= 25) return { label: 'Excelente', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', metric: `MAPE ${Math.round(mape)}%` };
    if (mape <= 40) return { label: 'Bom', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', metric: `MAPE ${Math.round(mape)}%` };
    if (mape <= 55) return { label: 'Razoável', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', metric: `MAPE ${Math.round(mape)}%` };
    return { label: 'Baixa', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', metric: `MAPE ${Math.round(mape)}%` };
  }

  // Fallback to R² if no OOS metrics
  const rSquared = modelInfo?.r_squared || 0;
  const rSquaredPct = Math.round(rSquared * 100);
  if (rSquared >= 0.85) return { label: 'Excelente', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', metric: `R² ${rSquaredPct}%` };
  if (rSquared >= 0.75) return { label: 'Bom', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', metric: `R² ${rSquaredPct}%` };
  if (rSquared >= 0.60) return { label: 'Razoável', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', metric: `R² ${rSquaredPct}%` };
  return { label: 'Baixa', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', metric: `R² ${rSquaredPct}%` };
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
        <div className="absolute right-0 top-full mt-2 w-72 p-3 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-10">
          <p className="text-xs font-semibold text-slate-900 dark:text-white mb-2">
            Precisão do Modelo {modelInfo.regression_type === 'ridge' ? '(Ridge)' : ''}
          </p>
          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            {/* OOS metrics (most important) */}
            {hasOOSMetrics && (
              <>
                <p className="font-medium text-slate-900 dark:text-white">
                  Métricas Reais (fora da amostra):
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

            {/* In-sample metrics */}
            <p className={hasOOSMetrics ? 'mt-2 font-medium text-slate-700 dark:text-slate-300' : ''}>
              {hasOOSMetrics ? 'Métricas de Treinamento:' : ''}
            </p>
            <p>
              <span className="font-medium">R² = {rSquaredPct}%</span> — Ajuste do modelo aos dados
            </p>
            <p>
              <span className="font-medium">MAE = R${modelInfo.mae}</span> — Erro médio (treino)
            </p>
            <p>
              <span className="font-medium">{modelInfo.n_training_samples} dias</span> de treinamento
            </p>

            {/* Ridge parameters */}
            {modelInfo.lambda && (
              <p className="text-slate-500">
                Regularização: λ = {modelInfo.lambda}
              </p>
            )}

            {modelInfo.model_tier && modelInfo.model_tier !== 'full' && (
              <p className="text-amber-600 dark:text-amber-400">
                Modelo simplificado devido a dados limitados
              </p>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-500 italic">
            Clique para ver detalhes completos
          </p>
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
  <div className="animate-pulse">
    <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4" />
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-lg" />
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
          <p className="text-slate-500 dark:text-slate-500 text-xs mt-2">
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

        {/* Model MAE indicator */}
        {modelInfo?.mae && (
          <div className="mt-3 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Margem de erro: ±R$ {modelInfo.mae}/dia
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
