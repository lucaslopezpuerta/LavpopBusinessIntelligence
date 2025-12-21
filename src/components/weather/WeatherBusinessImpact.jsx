// WeatherBusinessImpact.jsx v2.0
// Forward-looking weather business impact with OLS regression model
//
// v2.0 (2025-12-21): Backend OLS regression model
//   - Uses Netlify function for predictions (revenue-predict.js)
//   - Features: rev_lag_1, rev_lag_7, is_weekend, drying_pain, rain indicators
//   - Shows predicted revenue per day with confidence intervals
//   - R² typically > 0.80 (vs ~10-20% with simple correlation)
// v1.1 (2025-12-21): Dynamic impact calculation using Pearson regression
// v1.0 (2025-12-20): Initial implementation

import React, { useMemo } from 'react';
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
  FlaskConical
} from 'lucide-react';
import AnimatedWeatherIcon from './AnimatedWeatherIcon';
import useRevenuePrediction, { calculateWeeklySummary } from '../../hooks/useRevenuePrediction';
import { formatDateShort, getDayNamePt } from '../../utils/weatherUtils';

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

  return (
    <div className={`
      p-3 rounded-lg text-center transition-shadow hover:shadow-md
      ${isToday ? 'ring-2 ring-sky-400 dark:ring-sky-500' : ''}
      ${config.bgClass}
    `}>
      {/* Day name */}
      <div className={`text-sm font-semibold ${isToday ? 'text-sky-600 dark:text-sky-400' : 'text-slate-900 dark:text-white'}`}>
        {dayName}
      </div>

      {/* Date */}
      <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
        {prediction?.date ? formatDateShort(prediction.date) : '—'}
      </div>

      {/* Weather icon */}
      <div className="flex justify-center mb-2">
        <AnimatedWeatherIcon
          icon={icon}
          size="sm"
          animated={isToday}
        />
      </div>

      {/* Predicted revenue */}
      <div className="text-base font-bold text-slate-900 dark:text-white mb-1">
        {formatCurrencyCompact(prediction?.predicted_revenue)}
      </div>

      {/* Weather impact percentage */}
      <div className={`flex items-center justify-center gap-1 text-xs font-medium ${impactColor}`}>
        <TrendIcon className="w-3 h-3" />
        {formatImpact(impact)}
      </div>
    </div>
  );
};

/**
 * Dynamic insight card based on upcoming predictions
 */
const InsightCard = ({ predictions }) => {
  const significantDay = useMemo(() => {
    if (!predictions?.length) return null;

    const next3Days = predictions.slice(0, 3);

    // Find rainy day with highest impact
    const rainyDay = next3Days.find(d => d.category === 'rainy');
    if (rainyDay && rainyDay.weather_impact_pct !== null) {
      const dayName = getDayNamePt(rainyDay.date, { short: false });
      return {
        type: 'rainy',
        day: rainyDay,
        title: `Chuva prevista para ${dayName}`,
        message: rainyDay.weather_impact_pct >= 0
          ? `Dificuldade de secar roupa aumenta movimento (~${Math.round(rainyDay.weather_impact_pct)}%)`
          : `Prepare-se para movimento ligeiramente reduzido`
      };
    }

    // Find cold day
    const coldDay = next3Days.find(d => d.category === 'cold');
    if (coldDay && coldDay.weather_impact_pct !== null) {
      const dayName = getDayNamePt(coldDay.date, { short: false });
      return {
        type: 'cold',
        day: coldDay,
        title: `Frente fria chegando ${dayName}`,
        message: coldDay.weather_impact_pct >= 0
          ? `Dias frios trazem cobertores e roupas pesadas`
          : `Espere movimento dentro da média`
      };
    }

    // Find weekend with high prediction
    const weekendDay = next3Days.find(d => d.features?.is_weekend);
    if (weekendDay) {
      const dayName = getDayNamePt(weekendDay.date, { short: false });
      return {
        type: 'normal',
        day: weekendDay,
        title: `Final de semana vem aí (${dayName})`,
        message: 'Finais de semana tendem a ter maior movimento'
      };
    }

    // No significant pattern
    return {
      type: 'normal',
      day: null,
      title: 'Semana estável',
      message: 'Receita dentro da média esperada para os próximos dias'
    };
  }, [predictions]);

  if (!significantDay) return null;

  const iconMap = {
    rainy: CloudRain,
    cold: Thermometer,
    normal: Calendar
  };
  const Icon = iconMap[significantDay.type];

  return (
    <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg mb-4">
      <div className="p-2 bg-white dark:bg-slate-700 rounded-lg flex-shrink-0">
        <Icon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
          {significantDay.title}
        </h4>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
          {significantDay.message}
        </p>
      </div>
    </div>
  );
};

/**
 * Model accuracy badge
 */
const ModelBadge = ({ modelInfo }) => {
  if (!modelInfo) return null;

  const rSquaredPct = Math.round((modelInfo.r_squared || 0) * 100);

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
      <FlaskConical className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
        Modelo: {rSquaredPct}%
      </span>
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
  // Fetch predictions from backend
  const {
    predictions,
    modelInfo,
    loading,
    error,
    refresh,
    hasData
  } = useRevenuePrediction();

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

  // Loading state
  if (loading && !hasData) {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm ${className}`}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
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
      <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm ${className}`}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
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
      <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm ${className}`}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
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
    <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Impacto no Negócio
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Previsão baseada em {modelInfo?.n_training_samples || 0} dias de histórico
            </p>
          </div>
          <ModelBadge modelInfo={modelInfo} />
        </div>
      </div>

      <div className="p-4">
        {/* Dynamic Insight */}
        <InsightCard predictions={mergedData} />

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
    </div>
  );
};

export default WeatherBusinessImpact;
