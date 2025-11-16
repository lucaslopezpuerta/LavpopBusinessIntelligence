// WeatherWidget.jsx v3.0 - STANDARDIZED HEADER DESIGN
// ✅ Consistent with all other header widgets
// ✅ Transparent blur background matching header style
// ✅ Compact 36px height
// ✅ Updates every 30 minutes
//
// CHANGELOG:
// v3.0 (2025-11-16): Standardized design for header consistency
// v2.0 (previous): API version with white background

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
      <div style={{
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(10px)',
        borderRadius: '8px',
        padding: '0.5rem 0.75rem',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        minWidth: '120px',
        height: '36px'
      }}>
        <Loader style={{ width: '14px', height: '14px', color: 'white' }} className="animate-spin" />
        <div style={{
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.9)',
          fontWeight: '500'
        }}>
          Carregando...
        </div>
      </div>
    );
  }

  const Icon = getWeatherIcon(weather.icon);

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.15)',
      backdropFilter: 'blur(10px)',
      borderRadius: '8px',
      padding: '0.5rem 0.75rem',
      border: '1px solid rgba(255, 255, 255, 0.25)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.625rem',
      cursor: 'default',
      transition: 'all 0.2s',
      height: '36px'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
      e.currentTarget.style.transform = 'translateY(-1px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
    title={`Clima: ${weather.conditions}`}
    >
      {/* Icon Container */}
      <div style={{
        width: '28px',
        height: '28px',
        borderRadius: '6px',
        background: 'rgba(255, 255, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <Icon style={{ width: '15px', height: '15px', color: 'white' }} />
      </div>

      {/* Weather Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        <div style={{
          fontSize: '12px',
          fontWeight: '700',
          color: 'white',
          lineHeight: 1
        }}>
          CLIMA CAXIAS
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.9)'
          }}>
            {weather.temp}°C
          </span>
          <span style={{
            fontSize: '10px',
            color: 'rgba(255, 255, 255, 0.8)'
          }}>
            ☁️ {weather.humidity}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
