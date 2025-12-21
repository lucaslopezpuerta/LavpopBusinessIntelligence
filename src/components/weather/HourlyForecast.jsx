// HourlyForecast.jsx v1.0
// 24-hour forecast display with scrollable cards and temperature chart
//
// v1.0 (2025-12-20): Initial implementation
//   - Horizontal scrollable hour cards
//   - Temperature + precipitation area chart
//   - Animated weather icons
//   - Responsive design

import React, { useRef } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { ChevronLeft, ChevronRight, Droplets } from 'lucide-react';
import AnimatedWeatherIcon from './AnimatedWeatherIcon';
import { formatTemperature } from '../../utils/weatherUtils';

/**
 * Single hour card component
 */
const HourCard = ({ hour, isNow = false }) => (
  <div className={`
    flex-shrink-0 w-20 p-3 rounded-xl text-center
    transition-all duration-200
    ${isNow
      ? 'bg-sky-100 dark:bg-sky-900/40 ring-2 ring-sky-400 dark:ring-sky-500'
      : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50'
    }
  `}>
    <div className={`text-sm font-medium mb-2 ${isNow ? 'text-sky-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'}`}>
      {isNow ? 'Agora' : hour.hour}
    </div>

    <AnimatedWeatherIcon
      icon={hour.icon}
      size="sm"
      animated={isNow}
    />

    <div className="text-lg font-bold text-slate-900 dark:text-white mt-2">
      {formatTemperature(hour.temp, false)}
    </div>

    {hour.precipProb > 0 && (
      <div className="flex items-center justify-center gap-1 text-xs text-blue-500 dark:text-blue-400 mt-1">
        <Droplets className="w-3 h-3" />
        <span>{Math.round(hour.precipProb)}%</span>
      </div>
    )}
  </div>
);

/**
 * Custom chart tooltip
 */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-3 border border-slate-200 dark:border-slate-700">
      <div className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
        {label}
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-sm text-slate-900 dark:text-white">
            {formatTemperature(data.temp)}
          </span>
        </div>
        {data.precipProb > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-sm text-slate-600 dark:text-slate-300">
              {Math.round(data.precipProb)}% chuva
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * HourlyForecast Component
 *
 * @param {Object} props
 * @param {Array} props.hourly - Hourly forecast data from useWeatherForecast
 * @param {string} props.className - Additional CSS classes
 */
const HourlyForecast = ({ hourly = [], className = '' }) => {
  const scrollRef = useRef(null);

  // Scroll handlers
  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -240, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 240, behavior: 'smooth' });
  };

  if (!hourly.length) {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-xl p-6 ${className}`}>
        <div className="text-center text-slate-500 dark:text-slate-400 py-8">
          Carregando previsão horária...
        </div>
      </div>
    );
  }

  // Prepare chart data with formatted hours
  const chartData = hourly.slice(0, 24).map((h, idx) => ({
    ...h,
    name: h.hour,
    isNow: idx === 0
  }));

  // Find min/max for Y axis
  const temps = chartData.map(d => d.temp);
  const minTemp = Math.floor(Math.min(...temps)) - 2;
  const maxTemp = Math.ceil(Math.max(...temps)) + 2;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Próximas 24 horas
        </h3>

        {/* Scroll buttons */}
        <div className="flex gap-1">
          <button
            onClick={scrollLeft}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={scrollRight}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable hour cards */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-2 p-4 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {chartData.map((hour, idx) => (
            <HourCard
              key={hour.datetime || idx}
              hour={hour}
              isNow={idx === 0}
            />
          ))}
        </div>
      </div>

      {/* Temperature chart */}
      <div className="px-4 pb-4">
        <div className="h-40 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="precipGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                interval={3}
              />

              <YAxis
                domain={[minTemp, maxTemp]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={(v) => `${v}°`}
              />

              <Tooltip content={<ChartTooltip />} />

              {/* Precipitation probability bars (background) */}
              <Area
                type="stepAfter"
                dataKey="precipProb"
                stroke="none"
                fill="url(#precipGradient)"
                yAxisId={0}
                // Scale to fit in temp range
                style={{ opacity: 0.5 }}
              />

              {/* Temperature line */}
              <Area
                type="monotone"
                dataKey="temp"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#tempGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
              />

              {/* Current time indicator */}
              <ReferenceLine
                x={chartData[0]?.name}
                stroke="#0ea5e9"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Chart legend */}
        <div className="flex justify-center gap-6 mt-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-amber-500 rounded" />
            <span>Temperatura</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-sky-500/30 rounded" />
            <span>Prob. chuva</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HourlyForecast;
