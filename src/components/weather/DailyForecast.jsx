// DailyForecast.jsx v1.0
// 7-day forecast display with expandable day cards
//
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
    <div className="relative h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
      <div
        className="absolute h-full rounded-full bg-gradient-to-r from-blue-400 via-amber-400 to-red-400"
        style={{
          left: `${leftPercent}%`,
          width: `${Math.max(widthPercent, 10)}%`
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
    <div className={`rounded-xl transition-all duration-200 ${bgClass}`}>
      {/* Main row */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-4 text-left"
      >
        {/* Day name */}
        <div className="w-20 flex-shrink-0">
          <div className={`font-semibold ${isToday ? 'text-sky-600 dark:text-sky-400' : 'text-slate-900 dark:text-white'}`}>
            {day.dayName}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {formatDateShort(day.date)}
          </div>
        </div>

        {/* Weather icon */}
        <div className="flex-shrink-0">
          <AnimatedWeatherIcon
            icon={day.icon}
            size="sm"
            animated={isToday}
          />
        </div>

        {/* Precipitation */}
        <div className="w-14 flex-shrink-0 text-center">
          {day.precipProb > 0 ? (
            <div className="flex items-center justify-center gap-1 text-blue-500 dark:text-blue-400">
              <Droplets className="w-3.5 h-3.5" />
              <span className="text-sm font-medium">{Math.round(day.precipProb)}%</span>
            </div>
          ) : (
            <span className="text-sm text-slate-400 dark:text-slate-500">—</span>
          )}
        </div>

        {/* Temperature range */}
        <div className="flex-1 flex items-center gap-3">
          <span className="text-sm text-blue-500 dark:text-blue-400 w-8 text-right">
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
          <span className="text-sm text-amber-600 dark:text-amber-400 w-8">
            {formatTemperature(day.tempMax, false)}
          </span>
        </div>

        {/* Expand button */}
        <div className="flex-shrink-0 text-slate-400">
          {expanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-slate-700/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
            {/* Condition */}
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Condição</div>
              <div className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                {day.conditions || 'Parcialmente nublado'}
              </div>
            </div>

            {/* Humidity */}
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Umidade</div>
              <div className="text-sm font-medium text-slate-900 dark:text-white">
                {day.humidity}%
              </div>
            </div>

            {/* Sunrise */}
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Sunrise className="w-3 h-3" />
                Nascer
              </div>
              <div className="text-sm font-medium text-slate-900 dark:text-white">
                {formatTime(day.sunrise) || '—'}
              </div>
            </div>

            {/* Sunset */}
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Sunset className="w-3 h-3" />
                Pôr do sol
              </div>
              <div className="text-sm font-medium text-slate-900 dark:text-white">
                {formatTime(day.sunset) || '—'}
              </div>
            </div>
          </div>

          {/* Description */}
          {day.description && (
            <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              {day.description}
            </div>
          )}

          {/* Precipitation amount */}
          {day.precipitation > 0 && (
            <div className="mt-3 text-sm text-blue-600 dark:text-blue-400">
              Precipitação esperada: {day.precipitation.toFixed(1)} mm
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
      <div className={`bg-white dark:bg-slate-900 rounded-xl p-6 ${className}`}>
        <div className="text-center text-slate-500 dark:text-slate-400 py-8">
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
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Previsão 7 dias
        </h3>
      </div>

      {/* Day cards */}
      <div className="p-2 space-y-1">
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
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between text-sm">
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
