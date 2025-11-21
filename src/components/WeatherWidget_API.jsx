// WeatherWidget_API.jsx v4.0 - TAILWIND MIGRATION + DARK MODE
// ✅ Full Tailwind CSS with dark mode support
// ✅ Transparent glass-morphism design
// ✅ Consistent header widget styling
// ✅ Updates every 30 minutes

import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, Droplets, Loader, AlertCircle } from 'lucide-react';

const WEATHER_API_URL = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/caxias%20do%20sul/today?unitGroup=metric&key=FTYV4SM9NMMTJKVFLEGRCGWJ9&contentType=json';

const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(WEATHER_API_URL);
        
        if (!response.ok) {
          throw new Error('Falha ao buscar dados do clima');
        }
        
        const data = await response.json();
        const today = data.days[0];
        
        setWeather({
          temp: today.temp.toFixed(1),
          humidity: Math.round(today.humidity),
          conditions: today.conditions,
          icon: today.icon
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
      'cloudy': Cloud,
      'rain': CloudRain,
      'showers-day': CloudRain,
      'showers-night': CloudRain
    };
    return iconMap[iconName] || Cloud;
  };

  if (loading || error) {
    return (
      <div className="
        bg-white/15 dark:bg-slate-800/30 
        backdrop-blur-md 
        rounded-lg 
        px-3 py-2 
        border border-white/25 dark:border-slate-700/50 
        flex items-center gap-2 
        min-w-[120px] 
        h-9
      ">
        <Loader className="w-3.5 h-3.5 text-white dark:text-slate-300 animate-spin" />
        <div className="text-[11px] text-white/90 dark:text-slate-300 font-medium">
          Carregando...
        </div>
      </div>
    );
  }

  const Icon = getWeatherIcon(weather.icon);

  return (
    <div 
      className="
        bg-white/15 dark:bg-slate-800/30 
        backdrop-blur-md 
        rounded-lg 
        px-3 py-2 
        border border-white/25 dark:border-slate-700/50 
        flex items-center gap-2.5 
        cursor-default 
        transition-all duration-200 
        h-9
        hover:bg-white/25 dark:hover:bg-slate-800/40 
        hover:-translate-y-px
      "
      title={`Clima: ${weather.conditions}`}
    >
      {/* Icon Container */}
      <div className="
        w-7 h-7 
        rounded-md 
        bg-white/20 dark:bg-slate-700/50 
        flex items-center justify-center 
        flex-shrink-0
      ">
        <Icon className="w-4 h-4 text-white dark:text-slate-200" />
      </div>

      {/* Weather Info */}
      <div className="flex flex-col gap-px">
        <div className="text-xs font-bold text-white dark:text-slate-200 leading-none">
          CLIMA CAXIAS
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-white/90 dark:text-slate-300">
            {weather.temp}°C
          </span>
          <span className="text-[10px] text-white/80 dark:text-slate-400">
            ☁️ {weather.humidity}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
