// WeatherMetricsGrid.jsx v1.0
// Detailed weather metrics display grid
//
// v1.0 (2025-12-20): Initial implementation
//   - UV Index with level indicator
//   - Wind speed and direction
//   - Atmospheric pressure
//   - Visibility
//   - Cloud cover
//   - Sunrise/Sunset times

import React from 'react';
import {
  Sun,
  Sunrise,
  Sunset,
  Wind,
  Gauge,
  Eye,
  Cloud,
  Compass
} from 'lucide-react';
import {
  getUVLevel,
  getUVColorClass,
  getWindDirection,
  getWindDirectionPt,
  formatWindSpeed,
  formatPressure,
  formatVisibility,
  formatTime
} from '../../utils/weatherUtils';

/**
 * Single metric card component
 */
const MetricCard = ({
  icon: Icon,
  title,
  value,
  subtitle,
  colorClass = 'text-slate-600 dark:text-slate-400',
  bgClass = ''
}) => (
  <div className={`
    p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50
    ${bgClass}
  `}>
    <div className="flex items-start justify-between mb-2">
      <div className={`p-2 rounded-lg bg-white dark:bg-slate-700 ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>

    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
      {title}
    </div>

    <div className="text-xl font-bold text-slate-900 dark:text-white">
      {value}
    </div>

    {subtitle && (
      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
        {subtitle}
      </div>
    )}
  </div>
);

/**
 * UV Index card with level indicator
 */
const UVCard = ({ uvIndex }) => {
  const { label, color } = getUVLevel(uvIndex);
  const colorClass = getUVColorClass(uvIndex);

  // UV level bar
  const uvPercent = Math.min((uvIndex / 11) * 100, 100);

  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-lg ${colorClass}`}>
          <Sun className="w-5 h-5" />
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorClass}`}>
          {label}
        </span>
      </div>

      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
        Índice UV
      </div>

      <div className="text-xl font-bold text-slate-900 dark:text-white">
        {uvIndex !== null && uvIndex !== undefined ? uvIndex : '—'}
      </div>

      {/* UV level bar */}
      <div className="mt-3 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-green-400 via-yellow-400 via-orange-400 to-purple-500"
          style={{ width: `${uvPercent}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-slate-400 mt-1">
        <span>0</span>
        <span>11+</span>
      </div>
    </div>
  );
};

/**
 * Wind card with compass direction
 */
const WindCard = ({ speed, direction }) => {
  const cardinal = getWindDirection(direction);
  const cardinalPt = getWindDirectionPt(direction);

  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
      <div className="flex items-start justify-between mb-2">
        <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
          <Wind className="w-5 h-5" />
        </div>
        <div
          className="p-2 rounded-lg bg-white dark:bg-slate-700 text-slate-500"
          style={{ transform: `rotate(${direction}deg)` }}
        >
          <Compass className="w-4 h-4" />
        </div>
      </div>

      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
        Vento
      </div>

      <div className="text-xl font-bold text-slate-900 dark:text-white">
        {formatWindSpeed(speed)}
      </div>

      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
        {cardinalPt} ({cardinal})
      </div>
    </div>
  );
};

/**
 * Sunrise/Sunset combined card
 */
const SunTimesCard = ({ sunrise, sunset }) => {
  // Calculate day length
  const getDayLength = () => {
    if (!sunrise || !sunset) return null;

    const [sunriseH, sunriseM] = sunrise.split(':').map(Number);
    const [sunsetH, sunsetM] = sunset.split(':').map(Number);

    const sunriseMinutes = sunriseH * 60 + sunriseM;
    const sunsetMinutes = sunsetH * 60 + sunsetM;
    const dayMinutes = sunsetMinutes - sunriseMinutes;

    const hours = Math.floor(dayMinutes / 60);
    const minutes = dayMinutes % 60;

    return `${hours}h ${minutes}m`;
  };

  const dayLength = getDayLength();

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
      <div className="flex items-center gap-4">
        {/* Sunrise */}
        <div className="flex-1">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
            <Sunrise className="w-4 h-4" />
            <span className="text-xs">Nascer</span>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {formatTime(sunrise) || '—'}
          </div>
        </div>

        {/* Divider */}
        <div className="h-10 w-px bg-amber-200 dark:bg-amber-800" />

        {/* Sunset */}
        <div className="flex-1">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-1">
            <Sunset className="w-4 h-4" />
            <span className="text-xs">Pôr do sol</span>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {formatTime(sunset) || '—'}
          </div>
        </div>
      </div>

      {/* Day length */}
      {dayLength && (
        <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800 text-center">
          <span className="text-xs text-amber-700 dark:text-amber-300">
            Duração do dia: <strong>{dayLength}</strong>
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * WeatherMetricsGrid Component
 *
 * @param {Object} props
 * @param {Object} props.current - Current weather conditions
 * @param {string} props.className - Additional CSS classes
 */
const WeatherMetricsGrid = ({ current, className = '' }) => {
  if (!current) {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-xl p-6 ${className}`}>
        <div className="text-center text-slate-500 dark:text-slate-400 py-8">
          Carregando métricas...
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Métricas detalhadas
        </h3>
      </div>

      {/* Metrics grid */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* UV Index */}
        <UVCard uvIndex={current.uvIndex} />

        {/* Wind */}
        <WindCard
          speed={current.windSpeed}
          direction={current.windDirection}
        />

        {/* Pressure */}
        <MetricCard
          icon={Gauge}
          title="Pressão"
          value={formatPressure(current.pressure)}
          subtitle="Atmosférica"
          colorClass="text-violet-600 dark:text-violet-400"
        />

        {/* Visibility */}
        <MetricCard
          icon={Eye}
          title="Visibilidade"
          value={formatVisibility(current.visibility)}
          subtitle={`${Math.round(current.visibility)} km`}
          colorClass="text-sky-600 dark:text-sky-400"
        />

        {/* Cloud cover */}
        <MetricCard
          icon={Cloud}
          title="Cobertura de nuvens"
          value={`${current.cloudCover || 0}%`}
          colorClass="text-slate-500 dark:text-slate-400"
        />

        {/* Sunrise/Sunset */}
        <SunTimesCard
          sunrise={current.sunrise}
          sunset={current.sunset}
        />
      </div>
    </div>
  );
};

export default WeatherMetricsGrid;
