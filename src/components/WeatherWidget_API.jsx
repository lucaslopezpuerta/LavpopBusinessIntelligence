// WeatherWidget_API.jsx v5.0 - COMPACT MODE
// ✅ Added compact prop for header integration
// ✅ Compact: Icon + Temp + Humidity only
// ✅ Full: Original design with location
// ✅ Glassmorphism styling
import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, Loader, Droplets, Thermometer } from 'lucide-react';

const WEATHER_API_URL = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/caxias%20do%20sul/today?unitGroup=metric&key=FTYV4SM9NMMTJKVFLEGRCGWJ9&contentType=json';

const WeatherWidget = ({ compact = false }) => {
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
          feelsLike: today.feelslike.toFixed(1),
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
      <div className={`
        ${compact
          ? 'bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5'
          : 'bg-white/15 backdrop-blur-md px-3 py-2 border border-white/25'}
        rounded-lg flex items-center gap-2 h-9
      `}>
        <Loader className={`w-3.5 h-3.5 ${compact ? 'text-slate-400 dark:text-slate-500' : 'text-white'} animate-spin`} />
        <div className={`text-[11px] font-medium ${compact ? 'text-slate-600 dark:text-slate-400' : 'text-white/90'}`}>
          Clima...
        </div>
      </div>
    );
  }

  const Icon = getWeatherIcon(weather.icon);

  // Compact Mode for App Header
  if (compact) {
    return (
      <div
        className="
          bg-slate-100 dark:bg-slate-800
          rounded-lg px-2.5 py-1.5
          flex items-center gap-2
          cursor-default
          transition-all duration-200
          h-9
          hover:bg-slate-200 dark:hover:bg-slate-700
        "
        title={`${weather.conditions} • Sensação: ${weather.feelsLike}°C`}
      >
        {/* Weather Icon */}
        <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-orange-500 dark:text-orange-400" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {weather.temp}°
            </span>
          </div>
          <div className="w-px h-3 bg-slate-300 dark:bg-slate-600" />
          <div className="flex items-center gap-1">
            <Droplets className="w-3 h-3 text-blue-500 dark:text-blue-400" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {weather.humidity}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Full Mode for Dashboard Banner
  return (
    <div
      className="
        bg-white/15 backdrop-blur-md 
        rounded-lg px-3 py-2 
        border border-white/25 
        flex items-center gap-2.5 
        cursor-default 
        transition-all duration-200 
        h-9
        hover:bg-white/25 hover:-translate-y-px
      "
      title={`Clima: ${weather.conditions}`}
    >
      {/* Icon Container */}
      <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center shrink-0">
        <Icon className="w-[15px] h-[15px] text-white" />
      </div>

      {/* Weather Info */}
      <div className="flex flex-col gap-px">
        <div className="text-xs font-bold text-white leading-none">
          CLIMA CAXIAS
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-white/90">
            {weather.temp}°C
          </span>
          <span className="text-[10px] text-white/80">
            ☁️ {weather.humidity}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
