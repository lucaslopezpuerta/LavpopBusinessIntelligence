// WeatherWidget_API.jsx v5.3 - COSMIC DESIGN SYSTEM
// Weather widget for header and dashboard integration
// Design System v5.1 compliant - Variant D (Glassmorphism Cosmic)
//
// FEATURES:
// - Compact mode: Temp + Humidity for header (no condition icon)
// - Full mode: Glassmorphism card with location for banner
// - Auto-refresh every 30 minutes
//
// CHANGELOG:
// v5.3 (2026-02-13): Compact mode simplification + typography fixes
//   - Removed weather condition icon from compact mode (Temp + Humidity only)
//   - Fixed text-[11px] → text-xs in loading state and full mode
//   - Fixed text-[10px] → text-xs in full mode humidity
// v5.2 (2026-01-18): Cosmic Design System overhaul
//   - Dark mode: space-dust background, stellar-cyan borders
//   - Icon backgrounds use stellar-cyan tints
//   - Hover states with cosmic transitions
//   - Full mode uses cosmic glassmorphism panel
// v5.1: Compact mode for header integration
// v5.0: Initial glassmorphism styling
import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, Loader, Droplets, Thermometer } from 'lucide-react';

const WEATHER_API_URL = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/caxias%20do%20sul/today?unitGroup=metric&key=FTYV4SM9NMMTJKVFLEGRCGWJ9&contentType=json';

const WeatherWidget = ({ compact = false, showLocation = false }) => {
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
          ? 'bg-slate-100 dark:bg-space-dust px-2 py-1.5 border border-transparent dark:border-stellar-cyan/10'
          : 'bg-white/15 backdrop-blur-md px-3 py-2 border border-white/25'}
        rounded-lg flex items-center gap-2 h-9
      `}>
        <Loader className={`w-3.5 h-3.5 ${compact ? 'text-slate-400 dark:text-stellar-cyan/60' : 'text-white'} animate-spin`} />
        <div className={`text-xs font-medium ${compact ? 'text-slate-600 dark:text-slate-300' : 'text-white/90'}`}>
          {showLocation && compact ? 'Caxias do Sul...' : 'Clima...'}
        </div>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  const Icon = getWeatherIcon(weather.icon);

  // Compact Mode for App Header - Cosmic styling
  if (compact) {
    return (
      <div
        className="
          bg-slate-100 dark:bg-space-dust
          rounded-lg px-2 py-1.5
          flex items-center gap-1.5
          cursor-default
          transition-all duration-200
          h-9
          border border-transparent dark:border-stellar-cyan/10
          hover:bg-slate-200 dark:hover:bg-space-nebula
        "
        title={`${weather.conditions} • ${weather.temp}°C • ${weather.humidity}% umidade • Sensação: ${weather.feelsLike}°C`}
      >
        <div className="flex items-center gap-0.5">
          <Thermometer className="w-2.5 h-2.5 text-orange-500 dark:text-orange-400" />
          <span className="text-xs font-bold text-slate-700 dark:text-white">
            {weather.temp}°
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <Droplets className="w-2.5 h-2.5 text-stellar-cyan" />
          <span className="text-xs font-bold text-slate-700 dark:text-white">
            {weather.humidity}%
          </span>
        </div>
      </div>
    );
  }

  // Full Mode for Dashboard Banner - Cosmic glassmorphism
  return (
    <div
      className="
        bg-white/15 backdrop-blur-md
        rounded-xl px-3 py-2
        border border-stellar-cyan/20
        flex items-center gap-2.5
        cursor-default
        transition-all duration-200
        h-9
        hover:bg-white/25 hover:border-stellar-cyan/30 hover:-translate-y-px
        shadow-sm shadow-stellar-cyan/10
      "
      title={`Clima: ${weather.conditions}`}
    >
      {/* Icon Container - Cosmic glow */}
      <div className="w-7 h-7 rounded-lg bg-stellar-cyan/20 flex items-center justify-center shrink-0">
        <Icon className="w-[15px] h-[15px] text-white" />
      </div>

      {/* Weather Info */}
      <div className="flex flex-col gap-px">
        <div className="text-xs font-bold text-white leading-none tracking-wide">
          CLIMA CAXIAS
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white/90">
            {weather.feelsLike}°C
          </span>
          <span className="text-xs text-white/80">
            💧 {weather.humidity}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
