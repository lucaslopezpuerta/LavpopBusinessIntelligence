// DailyForecast.jsx v1.1
// 7-day forecast display with expandable day cards
//
// v1.1 (2025-12-21): Mobile-first responsive improvements
//   - Compact mobile layout with stacked day/date
//   - Responsive padding, font sizes, and gaps
//   - Improved touch targets
//   - Better temperature range visibility on small screens
// v1.0 (2025-12-20): Initial implementation
//   - 7-day forecast cards
//   - Temperature range bars
//   - Precipitation indicators
//   - Expandable details

import React, { useState } from 'react';
import { Droplets, Sunrise, Sunset, ChevronDown, ChevronUp } from 'lucide-react';
import AnimatedWeatherIcon from './AnimatedWeatherIcon';
import {
  formatTemperature,
  formatTempRange,
  formatTime,
  formatDateShort,
  getWeatherCardBg
} from '../../utils/weatherUtils';

/**
 * Temperature range bar visualization
 */
const TempRangeBar = ({ min, max, dayMin, dayMax }) => {
  // Calculate position within weekly range
  const range = dayMax - dayMin;
  const leftPercent = range > 0 ? ((min - dayMin) / range) * 100 : 0;
  const widthPercent = range > 0 ? ((max - min) / range) * 100 : 50;

  return (
    <div className="relative h-1 sm:h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
      <div
        className="absolute h-full rounded-full bg-gradient-to-r from-blue-400 via-amber-400 to-red-400"
        style={{
          left: `${leftPercent}%`,
          width: `${Math.max(widthPercent, 15)}%`
        }}
      />
    </div>
  );
};

/**
 * Single day forecast card
 */
const DayCard = ({ day, isToday, weeklyMin, weeklyMax, expanded, onToggle }) => {
  const bgClass = isToday
    ? 'bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/30 dark:to-blue-900/30 ring-1 ring-sky-200 dark:ring-sky-800'
    : 'bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/50';

  return (
    <div className={`rounded-lg sm:rounded-xl transition-all duration-200 ${bgClass}`}>
      {/* Main row - touch-friendly min height */}
      <button
        onClick={onToggle}
        className="w-full p-3 sm:p-4 flex items-center gap-2 sm:gap-4 text-left min-h-[56px] sm:min-h-0"
      >
        {/* Day name - compact on mobile */}
        <div className="w-14 sm:w-20 flex-shrink-0">
          <div className={`text-sm sm:text-base font-semibold ${isToday ? 'text-sky-600 dark:text-sky-400' : 'text-slate-900 dark:text-white'}`}>
            {day.dayName}
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
            {formatDateShort(day.date)}
          </div>
        </div>

        {/* Weather icon - smaller on mobile */}
        <div className="flex-shrink-0">
          <AnimatedWeatherIcon
            icon={day.icon}
            size="sm"
            className="scale-90 sm:scale-100"
            animated={isToday}
          />
        </div>

        {/* Precipitation - compact on mobile */}
        <div className="w-10 sm:w-14 flex-shrink-0 text-center">
          {day.precipProb > 0 ? (
            <div className="flex items-center justify-center gap-0.5 sm:gap-1 text-blue-500 dark:text-blue-400">
              <Droplets className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="text-xs sm:text-sm font-medium">{Math.round(day.precipProb)}%</span>
            </div>
          ) : (
            <span className="text-xs sm:text-sm text-slate-400 dark:text-slate-500">—</span>
          )}
        </div>

        {/* Temperature range */}
        <div className="flex-1 flex items-center gap-1.5 sm:gap-3">
          <span className="text-xs sm:text-sm text-blue-500 dark:text-blue-400 w-6 sm:w-8 text-right font-medium">
            {formatTemperature(day.tempMin, false)}
          </span>
          <div className="flex-1">
            <TempRangeBar
              min={day.tempMin}
              max={day.tempMax}
              dayMin={weeklyMin}
              dayMax={weeklyMax}
            />
          </div>
          <span className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 w-6 sm:w-8 font-medium">
            {formatTemperature(day.tempMax, false)}
          </span>
        </div>

        {/* Expand button */}
        <div className="flex-shrink-0 text-slate-400">
          {expanded ? (
            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0 border-t border-slate-100 dark:border-slate-700/50">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-3">
            {/* Condition */}
            <div>
              <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">Condição</div>
              <div className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white capitalize">
                {day.conditions || 'Parcialmente nublado'}
              </div>
            </div>

            {/* Humidity */}
            <div>
              <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">Umidade</div>
              <div className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white">
                {day.humidity}%
              </div>
            </div>

            {/* Sunrise */}
            <div>
              <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1 flex items-center gap-1">
                <Sunrise className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                Nascer
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white">
                {formatTime(day.sunrise) || '—'}
              </div>
            </div>

            {/* Sunset */}
            <div>
              <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1 flex items-center gap-1">
                <Sunset className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                Pôr do sol
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white">
                {formatTime(day.sunset) || '—'}
              </div>
            </div>
          </div>

          {/* Description */}
          {day.description && (
            <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              {day.description}
            </div>
          )}

          {/* Precipitation amount */}
          {day.precipitation > 0 && (
            <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-blue-600 dark:text-blue-400">
              Precipitação: {day.precipitation.toFixed(1)} mm
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * DailyForecast Component
 *
 * @param {Object} props
 * @param {Array} props.daily - Daily forecast data from useWeatherForecast
 * @param {string} props.className - Additional CSS classes
 */
const DailyForecast = ({ daily = [], className = '' }) => {
  const [expandedDay, setExpandedDay] = useState(null);

  if (!daily.length) {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 ${className}`}>
        <div className="text-center text-slate-500 dark:text-slate-400 py-6 sm:py-8 text-sm sm:text-base">
          Carregando previsão semanal...
        </div>
      </div>
    );
  }

  // Calculate weekly min/max for temperature bars
  const temps = daily.flatMap(d => [d.tempMin, d.tempMax]);
  const weeklyMin = Math.min(...temps);
  const weeklyMax = Math.max(...temps);

  const toggleDay = (date) => {
    setExpandedDay(prev => prev === date ? null : date);
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-3 py-3 sm:p-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
          Previsão 7 dias
        </h3>
      </div>

      {/* Day cards */}
      <div className="p-1.5 sm:p-2 space-y-0.5 sm:space-y-1">
        {daily.slice(0, 7).map((day, idx) => (
          <DayCard
            key={day.date}
            day={day}
            isToday={idx === 0}
            weeklyMin={weeklyMin}
            weeklyMax={weeklyMax}
            expanded={expandedDay === day.date}
            onToggle={() => toggleDay(day.date)}
          />
        ))}
      </div>

      {/* Weekly summary */}
      <div className="px-3 py-3 sm:p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-slate-500 dark:text-slate-400">
            Variação da semana
          </span>
          <span className="font-medium text-slate-900 dark:text-white">
            {formatTempRange(weeklyMax, weeklyMin)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DailyForecast;
