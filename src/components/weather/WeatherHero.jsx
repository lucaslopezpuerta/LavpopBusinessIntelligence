// WeatherHero.jsx v1.4
// Hero section displaying current weather conditions with animated elements
// Dynamic gradient backgrounds based on weather condition and temperature
//
// v1.4 (2025-12-21): Larger desktop content
//   - Increased font sizes on lg breakpoint (temp 8xl, condition 4xl, high/low 2xl)
//   - Larger icons (lg:scale-[2], lg:w-6 h-6)
//   - More padding and spacing on desktop
// v1.3 (2025-12-21): Enhanced desktop layout
//   - Added today's high/low temperatures
//   - Three-column layout on desktop (temp | high-low | details)
//   - Better space utilization in 1/2 width mode
// v1.2 (2025-12-21): Simplified metrics, removed redundancy
//   - Removed pill badges for design consistency
//   - Removed UV, Wind, Visibility (shown in WeatherMetricsGrid)
//   - Integrated Humidity and Precip % as inline text
//   - Cleaner, more focused hero design
// v1.1 (2025-12-21): UX improvements
//   - Skeleton loading state
//   - Relative time display ("2 min atrás")
//   - Touch-friendly refresh button
//   - Day/Night visual indicator
//   - Precipitation probability alert
//   - Accessibility improvements (aria-labels, sr-only)
// v1.0 (2025-12-20): Initial implementation

import { useMemo } from 'react';
import { RefreshCw, Droplets, Sun, Clock, CloudRain, Moon, TrendingUp, TrendingDown } from 'lucide-react';
import AnimatedWeatherIcon from './AnimatedWeatherIcon';
import {
  formatTemperature,
  getWeatherGradient,
  formatTime
} from '../../utils/weatherUtils';

/**
 * Get relative time string in Portuguese
 */
const getRelativeTime = (date) => {
  if (!date) return '';
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'Agora mesmo';
  if (mins === 1) return '1 min atrás';
  if (mins < 60) return `${mins} min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return '1 hora atrás';
  if (hours < 24) return `${hours} horas atrás`;
  return 'Mais de 1 dia';
};

/**
 * Skeleton loading component
 */
const WeatherHeroSkeleton = () => (
  <div className="rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-400 to-slate-500 p-4 sm:p-6 md:p-8">
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="flex justify-between mb-4 sm:mb-6">
        <div className="space-y-2">
          <div className="h-5 sm:h-6 w-28 sm:w-36 bg-white/20 rounded" />
          <div className="h-3 sm:h-4 w-24 sm:w-28 bg-white/20 rounded" />
        </div>
        <div className="h-8 sm:h-9 w-10 sm:w-24 bg-white/20 rounded-full" />
      </div>

      {/* Main content skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-center">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-14 h-14 sm:w-20 sm:h-20 bg-white/20 rounded-full" />
          <div className="space-y-2">
            <div className="h-12 sm:h-16 w-20 sm:w-28 bg-white/20 rounded" />
            <div className="h-4 sm:h-5 w-28 sm:w-36 bg-white/20 rounded" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-6 sm:h-8 w-36 sm:w-48 bg-white/20 rounded" />
          <div className="h-4 w-32 bg-white/20 rounded" />
          <div className="h-4 w-28 bg-white/20 rounded" />
        </div>
      </div>
    </div>
  </div>
);

/**
 * WeatherHero Component
 *
 * @param {Object} props
 * @param {Object} props.current - Current weather conditions from useWeatherForecast
 * @param {Object} props.location - Location info
 * @param {number} props.tempMax - Today's maximum temperature
 * @param {number} props.tempMin - Today's minimum temperature
 * @param {Date} props.lastUpdated - Last update timestamp
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.isStale - Data staleness indicator
 * @param {Function} props.onRefresh - Refresh callback
 */
const WeatherHero = ({
  current,
  location,
  tempMax,
  tempMin,
  lastUpdated,
  loading = false,
  isStale = false,
  onRefresh
}) => {
  // Show skeleton while loading
  if (!current) {
    return <WeatherHeroSkeleton />;
  }

  // Dynamic gradient based on weather condition and temperature
  const heroGradient = getWeatherGradient(current.icon, current.temp);

  // Relative time display
  const relativeTime = useMemo(() => getRelativeTime(lastUpdated), [lastUpdated]);

  // Full timestamp for accessibility
  const lastUpdateText = lastUpdated
    ? `Atualizado às ${lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    : '';

  // Check if it's currently night time
  const isNightTime = useMemo(() => {
    if (!current.sunrise || !current.sunset) return false;
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinutes;

    const [sunriseH, sunriseM] = current.sunrise.split(':').map(Number);
    const [sunsetH, sunsetM] = current.sunset.split(':').map(Number);
    const sunriseTime = sunriseH * 60 + sunriseM;
    const sunsetTime = sunsetH * 60 + sunsetM;

    return currentTime < sunriseTime || currentTime >= sunsetTime;
  }, [current.sunrise, current.sunset]);

  // Precipitation probability
  const precipProb = current.precipProb || 0;
  const showRainAlert = precipProb >= 30;

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl sm:rounded-2xl ${heroGradient} p-4 sm:p-6 lg:p-8
        shadow-lg shadow-black/10 h-full
      `}
      role="region"
      aria-label="Condições climáticas atuais"
    >
      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Temperatura atual: {current.temp} graus celsius, sensação de {current.feelsLike} graus.
        {tempMax !== undefined && ` Máxima de ${tempMax} graus.`}
        {tempMin !== undefined && ` Mínima de ${tempMin} graus.`}
        Condição: {current.conditions || 'Parcialmente nublado'}.
        Umidade: {current.humidity}%.
        {showRainAlert && ` Atenção: ${precipProb}% de chance de chuva.`}
      </div>

      {/* Background pattern overlay */}
      <div className="absolute inset-0 opacity-10" aria-hidden="true">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4 sm:mb-6 lg:mb-8">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">
              {location?.name || 'Caxias do Sul'}
            </h2>
            <p className="text-white/70 text-xs sm:text-sm lg:text-base">
              {location?.region || 'Rio Grande do Sul'}
            </p>
          </div>

          {/* Refresh button - Touch friendly */}
          <button
            onClick={onRefresh}
            disabled={loading}
            aria-label={loading ? 'Atualizando dados do clima' : `Atualizar dados do clima. ${relativeTime}`}
            className={`
              flex items-center justify-center gap-1.5 sm:gap-2
              min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0
              px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full
              bg-white/20 hover:bg-white/30 active:bg-white/40 backdrop-blur-sm
              text-white text-xs sm:text-sm font-medium
              transition-all duration-200 ml-2 flex-shrink-0
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-white/50
              ${loading ? 'animate-pulse' : ''}
            `}
            title={lastUpdateText}
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">
              {loading ? 'Atualizando...' : 'Atualizar'}
            </span>
          </button>
        </div>

        {/* Main content grid - 3 columns on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-8 items-center">
          {/* Column 1: Temperature and icon */}
          <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
            <AnimatedWeatherIcon
              icon={current.icon}
              size="xl"
              className="sm:scale-110 lg:scale-[2] origin-center flex-shrink-0"
              colorOverride="text-white"
            />

            <div className="min-w-0">
              <div className="text-5xl sm:text-5xl lg:text-8xl font-bold text-white tracking-tight">
                {formatTemperature(current.temp, false)}
              </div>
              <div className="text-white/80 text-xs sm:text-sm lg:text-lg mt-0.5 lg:mt-2">
                Sensação {formatTemperature(current.feelsLike, false)}
              </div>
            </div>
          </div>

          {/* Column 2: High/Low + Condition */}
          <div className="flex flex-col gap-2 sm:gap-3 lg:gap-5">
            {/* Weather condition */}
            <p className="text-lg sm:text-xl lg:text-4xl font-semibold text-white capitalize leading-tight">
              {current.conditions || 'Parcialmente nublado'}
            </p>

            {/* High/Low temperatures */}
            {(tempMax !== undefined || tempMin !== undefined) && (
              <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 text-white/90">
                {tempMax !== undefined && (
                  <span className="flex items-center gap-1 lg:gap-2">
                    <TrendingUp className="w-4 h-4 lg:w-6 lg:h-6 text-orange-300" aria-hidden="true" />
                    <span className="text-sm sm:text-base lg:text-2xl font-medium">
                      {formatTemperature(tempMax, false)}
                    </span>
                  </span>
                )}
                {tempMin !== undefined && (
                  <span className="flex items-center gap-1 lg:gap-2">
                    <TrendingDown className="w-4 h-4 lg:w-6 lg:h-6 text-sky-300" aria-hidden="true" />
                    <span className="text-sm sm:text-base lg:text-2xl font-medium">
                      {formatTemperature(tempMin, false)}
                    </span>
                  </span>
                )}
              </div>
            )}

            {/* Humidity + Precipitation */}
            <div className="flex items-center flex-wrap gap-x-3 lg:gap-x-5 gap-y-1 text-white/80 text-xs sm:text-sm lg:text-lg">
              <span className="flex items-center gap-1.5 lg:gap-2">
                <Droplets className="w-3.5 h-3.5 lg:w-5 lg:h-5" aria-hidden="true" />
                <span>{current.humidity}%</span>
              </span>

              {precipProb > 0 && (
                <span className={`flex items-center gap-1.5 lg:gap-2 ${showRainAlert ? 'text-sky-200' : ''}`}>
                  <CloudRain
                    className={`w-3.5 h-3.5 lg:w-5 lg:h-5 ${showRainAlert ? 'animate-pulse' : ''}`}
                    aria-hidden="true"
                  />
                  <span>{precipProb}%</span>
                </span>
              )}
            </div>
          </div>

          {/* Column 3: Sunrise/Sunset + Status */}
          <div className="flex flex-col gap-2 sm:gap-3 lg:gap-5 sm:col-span-2 lg:col-span-1">
            {/* Sunrise/Sunset with day/night indicator */}
            <div className="flex items-center gap-3 lg:gap-5 text-white/80 text-sm lg:text-lg">
              <span className={`flex items-center gap-1.5 lg:gap-2 transition-colors ${!isNightTime ? 'text-amber-200' : ''}`}>
                <Sun className="w-4 h-4 lg:w-6 lg:h-6" aria-hidden="true" />
                <span>{formatTime(current.sunrise)}</span>
              </span>
              <span aria-hidden="true" className="text-white/40">—</span>
              <span className={`flex items-center gap-1.5 lg:gap-2 transition-colors ${isNightTime ? 'text-indigo-200' : ''}`}>
                <Moon className="w-4 h-4 lg:w-6 lg:h-6" aria-hidden="true" />
                <span>{formatTime(current.sunset)}</span>
              </span>
            </div>

            {/* Stale data warning */}
            {isStale && (
              <div className="flex items-center gap-2 text-amber-200 text-xs sm:text-sm lg:text-lg">
                <Clock className="w-3.5 h-3.5 lg:w-5 lg:h-5" aria-hidden="true" />
                <span>Dados desatualizados</span>
              </div>
            )}
          </div>
        </div>

        {/* Last updated footer with relative time */}
        {lastUpdated && (
          <div className="mt-4 sm:mt-6 text-white/50 text-[10px] sm:text-xs text-right">
            <span title={lastUpdateText}>{relativeTime}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherHero;
