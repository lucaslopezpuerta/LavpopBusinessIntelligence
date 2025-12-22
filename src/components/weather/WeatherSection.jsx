// WeatherSection.jsx v1.6
// Main Weather Intelligence Section orchestrator
// Combines real-time forecast with backend revenue predictions
//
// v1.6 (2025-12-21): Balanced Hero + Metrics layout
//   - Hero 1/2 + MetricsGrid 1/2 (side by side, fills space)
//   - HourlyForecast full width (horizontal scroll UX)
//   - DailyForecast full width (7-day overview)
//   - WeatherBusinessImpact full width (business insights)
// v1.5 (2025-12-21): Hero-first layout redesign
// v1.4 (2025-12-21): Backend OLS model integration
//   - Removed frontend calculateComfortWeatherImpact (backend handles this)
//   - WeatherBusinessImpact now uses useRevenuePrediction hook
//   - Simplified props - no longer needs salesData for impact calculation
// v1.3 (2025-12-20): Replaced WeatherImpactAnalytics with WeatherBusinessImpact
//   - Forward-looking 7-day forecast impact grid
//   - Simplified 3-category system (Chuvoso, Frio, Normal)
//   - Cleaner design matching Weather tab aesthetic
// v1.2 (2025-12-20): Fixed Supabase field name mismatch
// v1.1 (2025-12-20): Integrated sales data for business impact
// v1.0 (2025-12-20): Initial implementation

import React, { useCallback } from 'react';
import { AlertCircle, CloudOff, RefreshCw } from 'lucide-react';
import useWeatherForecast from '../../hooks/useWeatherForecast';
import WeatherHero from './WeatherHero';
import HourlyForecast from './HourlyForecast';
import DailyForecast from './DailyForecast';
import WeatherMetricsGrid from './WeatherMetricsGrid';
import WeatherBusinessImpact from './WeatherBusinessImpact';

// Currency formatter for WeatherBusinessImpact
const formatCurrency = (value) => {
  if (value == null || isNaN(value)) return 'R$ 0';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

/**
 * Error state component
 */
const ErrorState = ({ error, onRetry }) => (
  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 text-center">
    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
      <CloudOff className="w-6 h-6 text-red-600 dark:text-red-400" />
    </div>
    <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
      Erro ao carregar dados do clima
    </h3>
    <p className="text-red-600 dark:text-red-300 text-sm mb-4">
      {error || 'Não foi possível conectar ao serviço de previsão do tempo.'}
    </p>
    <button
      onClick={onRetry}
      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
    >
      <RefreshCw className="w-4 h-4" />
      Tentar novamente
    </button>
  </div>
);

/**
 * Loading skeleton component
 */
const LoadingSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    {/* Hero + Metrics row skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-2xl bg-slate-200 dark:bg-slate-700 h-48 sm:h-56" />
      <div className="rounded-xl bg-slate-200 dark:bg-slate-700 h-48 sm:h-56" />
    </div>

    {/* Hourly forecast skeleton - full width */}
    <div className="rounded-xl bg-slate-200 dark:bg-slate-700 h-32 sm:h-40" />

    {/* Daily forecast skeleton - full width */}
    <div className="rounded-xl bg-slate-200 dark:bg-slate-700 h-64 sm:h-72" />

    {/* Business impact skeleton */}
    <div className="rounded-xl bg-slate-200 dark:bg-slate-700 h-48" />
  </div>
);

/**
 * Section header component
 */
const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-6">
    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
      {title}
    </h1>
    {subtitle && (
      <p className="text-slate-500 dark:text-slate-400 mt-1">
        {subtitle}
      </p>
    )}
  </div>
);

/**
 * WeatherSection Component
 *
 * Main orchestrator for the Weather Intelligence section.
 * Combines real-time forecast with backend revenue predictions.
 *
 * @param {Object} props
 * @param {boolean} props.showAnalytics - Show business impact analytics (default: true)
 * @param {boolean} props.showMetrics - Show detailed metrics grid (default: true)
 * @param {number} props.refreshInterval - Auto-refresh interval in ms (default: 30min)
 * @param {string} props.className - Additional CSS classes
 */
const WeatherSection = ({
  showAnalytics = true,
  showMetrics = true,
  refreshInterval = 30 * 60 * 1000, // 30 minutes
  className = ''
}) => {
  // Real-time forecast data
  const {
    current,
    hourly,
    daily,
    location,
    loading: forecastLoading,
    error: forecastError,
    isStale,
    lastFetched,
    refresh: refreshForecast,
    hasData: hasForecastData
  } = useWeatherForecast({
    autoFetch: true,
    useCache: true,
    refreshInterval
  });

  // Combined loading state
  const isLoading = forecastLoading && !hasForecastData;

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refreshForecast();
  }, [refreshForecast]);

  // Show error state if forecast failed and no data
  if (forecastError && !hasForecastData) {
    return (
      <div className={`p-4 md:p-6 ${className}`}>
        <SectionHeader
          title="Clima"
          subtitle="Caxias do Sul, RS"
        />
        <ErrorState
          error={forecastError}
          onRetry={handleRefresh}
        />
      </div>
    );
  }

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className={`p-4 md:p-6 ${className}`}>
        <SectionHeader
          title="Clima"
          subtitle="Carregando dados..."
        />
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-6 space-y-6 ${className}`}>
      {/* Section header */}
      <SectionHeader
        title="Clima"
        subtitle="Previsão e impacto nos negócios"
      />

      {/* Stale data warning */}
      {isStale && hasForecastData && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>Os dados podem estar desatualizados. </span>
          <button
            onClick={handleRefresh}
            className="font-medium underline hover:no-underline"
          >
            Atualizar agora
          </button>
        </div>
      )}

      {/* Row 1: Hero (1/2) + Metrics (1/2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeatherHero
          current={current}
          location={location}
          tempMax={daily[0]?.tempMax}
          tempMin={daily[0]?.tempMin}
          lastUpdated={lastFetched}
          loading={forecastLoading}
          isStale={isStale}
          onRefresh={handleRefresh}
        />

        {showMetrics && (
          <WeatherMetricsGrid current={current} />
        )}
      </div>

      {/* Row 2: Hourly Forecast - full width */}
      <HourlyForecast hourly={hourly} />

      {/* Row 3: Daily Forecast - full width */}
      <DailyForecast daily={daily} />

      {/* Business Impact Analytics - Forward-looking 7-day prediction from backend OLS model */}
      {showAnalytics && (
        <WeatherBusinessImpact
          forecast={daily}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
};

export default WeatherSection;
