// WeatherHero.jsx v1.0
// Hero section displaying current weather conditions with animated elements
// Dynamic gradient backgrounds based on weather condition and temperature
//
// v1.0 (2025-12-20): Initial implementation
//   - Large temperature display with feels-like
//   - Animated weather icon
//   - Quick metrics row
//   - Dynamic gradient background
//   - Refresh indicator

import React from 'react';
import { RefreshCw, Droplets, Wind, Sun, Eye, Clock } from 'lucide-react';
import AnimatedWeatherIcon from './AnimatedWeatherIcon';
import {
  formatTemperature,
  getWindDirection,
  formatWindSpeed,
  getUVLevel,
  getWeatherGradient,
  formatTime
} from '../../utils/weatherUtils';

/**
 * Quick metric badge component
 */
const MetricBadge = ({ icon: Icon, label, value, className = '' }) => (
  <div className={`
    flex items-center gap-2 px-3 py-1.5 rounded-full
    bg-white/20 dark:bg-black/20 backdrop-blur-sm
    text-white/90 text-sm font-medium
    ${className}
  `}>
    <Icon className="w-4 h-4" />
    <span>{label}:</span>
    <span className="font-semibold">{value}</span>
  </div>
);

/**
 * WeatherHero Component
 *
 * @param {Object} props
 * @param {Object} props.current - Current weather conditions from useWeatherForecast
 * @param {Object} props.location - Location info
 * @param {Date} props.lastUpdated - Last update timestamp
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.isStale - Data staleness indicator
 * @param {Function} props.onRefresh - Refresh callback
 */
const WeatherHero = ({
  current,
  location,
  lastUpdated,
  loading = false,
  isStale = false,
  onRefresh
}) => {
  if (!current) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-slate-400 to-slate-600 p-8 text-white">
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin opacity-50" />
            <p className="text-white/70">Carregando dados do clima...</p>
          </div>
        </div>
      </div>
    );
  }

  // Dynamic gradient based on weather condition and temperature
  const heroGradient = getWeatherGradient(current.icon, current.temp);

  // Format last updated time
  const lastUpdateText = lastUpdated
    ? `Atualizado às ${lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    : '';

  // UV level info
  const uvInfo = getUVLevel(current.uvIndex);

  return (
    <div className={`
      relative overflow-hidden rounded-2xl ${heroGradient} p-6 md:p-8
      shadow-lg shadow-black/10
    `}>
      {/* Background pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header row */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white">
              {location?.name || 'Caxias do Sul'}
            </h2>
            <p className="text-white/70 text-sm">
              {location?.region || 'Rio Grande do Sul'}
            </p>
          </div>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full
              bg-white/20 hover:bg-white/30 backdrop-blur-sm
              text-white text-sm font-medium
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${loading ? 'animate-pulse' : ''}
            `}
            title={lastUpdateText}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">
              {loading ? 'Atualizando...' : 'Atualizar'}
            </span>
          </button>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Left: Temperature and icon */}
          <div className="flex items-center gap-4 md:gap-6">
            <AnimatedWeatherIcon
              icon={current.icon}
              size="2xl"
              colorOverride="text-white"
            />

            <div>
              <div className="text-6xl md:text-7xl font-bold text-white tracking-tight">
                {formatTemperature(current.temp, false)}
              </div>
              <div className="text-white/80 text-lg mt-1">
                Sensação {formatTemperature(current.feelsLike, false)}
              </div>
            </div>
          </div>

          {/* Right: Condition and details */}
          <div className="space-y-4">
            <div>
              <p className="text-2xl md:text-3xl font-semibold text-white capitalize">
                {current.conditions || 'Parcialmente nublado'}
              </p>
              <div className="flex items-center gap-3 text-white/70 text-sm mt-2">
                <span className="flex items-center gap-1">
                  <Sun className="w-4 h-4" />
                  {formatTime(current.sunrise)}
                </span>
                <span>—</span>
                <span>{formatTime(current.sunset)}</span>
              </div>
            </div>

            {/* Stale data warning */}
            {isStale && (
              <div className="flex items-center gap-2 text-amber-200 text-sm">
                <Clock className="w-4 h-4" />
                <span>Dados podem estar desatualizados</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick metrics row */}
        <div className="flex flex-wrap gap-2 md:gap-3 mt-6">
          <MetricBadge
            icon={Droplets}
            label="Umidade"
            value={`${current.humidity}%`}
          />
          <MetricBadge
            icon={Wind}
            label="Vento"
            value={`${formatWindSpeed(current.windSpeed)} ${getWindDirection(current.windDirection)}`}
          />
          <MetricBadge
            icon={Sun}
            label="UV"
            value={`${current.uvIndex} (${uvInfo.label})`}
          />
          <MetricBadge
            icon={Eye}
            label="Visibilidade"
            value={`${Math.round(current.visibility)} km`}
          />
        </div>

        {/* Last updated footer */}
        {lastUpdateText && (
          <div className="mt-4 text-white/50 text-xs text-right">
            {lastUpdateText}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherHero;
