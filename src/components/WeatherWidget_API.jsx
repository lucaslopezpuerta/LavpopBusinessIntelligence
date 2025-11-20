// WeatherWidget.jsx v4.0 - Tailwind Redesign
// - Glass widget for header (dark background)
//
// CHANGELOG:
// v4.0 (2025-11-20): Complete Tailwind Redesign
// v3.0 (2025-11-16): Standardized design for header consistency
//  - Consistent with all other header widgets
//  - Transparent blur background matching header style
//  - Compact 36px height
//  - Updates every 30 minutes
// v2.0 (previous): API version with white background

import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, Droplets, Loader } from 'lucide-react';

const WEATHER_API_URL =
  'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/caxias%20do%20sul/today?unitGroup=metric&key=FTYV4SM9NMMTJKVFLEGRCGWJ9&contentType=json';

const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(WEATHER_API_URL);
        if (!response.ok) throw new Error('Falha ao buscar dados do clima');

        const data = await response.json();
        const today = data.days[0];

        setWeather({
          temp: today.temp.toFixed(1),
          humidity: Math.round(today.humidity),
          conditions: today.conditions,
          icon: today.icon,
        });
      } catch (err) {
        console.error('Erro ao buscar clima:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = (iconName) => {
    if (!iconName) return Cloud;
    const iconMap = {
      'clear-day': Sun,
      'clear-night': Cloud,
      'partly-cloudy-day': Cloud,
      'partly-cloudy-night': Cloud,
      cloudy: Cloud,
      rain: CloudRain,
      'showers-day': CloudRain,
      'showers-night': CloudRain,
    };
    return iconMap[iconName] || Cloud;
  };

  if (loading || !weather) {
    return (
      <div className="flex h-9 min-w-[140px] items-center gap-2 rounded-lg border border-white/25 bg-white/15 px-3 backdrop-blur-md">
        <Loader className="w-3.5 h-3.5 text-white animate-spin" />
        <span className="text-[11px] text-white/90 font-medium">
          Clima...
        </span>
      </div>
    );
  }

  const Icon = getWeatherIcon(weather.icon);

  return (
    <div
      className="flex h-9 items-center gap-2 rounded-lg border border-white/25 bg-white/15 px-3 backdrop-blur-md transition-all hover:bg-white/25 hover:-translate-y-[1px]"
      title={`Clima: ${weather.conditions}`}
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/20 flex-shrink-0">
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="flex flex-col gap-[2px]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-white">
            {weather.temp}°C
          </span>
          <span className="text-[10px] text-white/80 flex items-center gap-1">
            <Droplets className="w-3 h-3" />
            {weather.humidity}%
          </span>
        </div>
        <div className="text-[9px] uppercase tracking-[0.16em] text-white/70">
          Caxias do Sul
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
