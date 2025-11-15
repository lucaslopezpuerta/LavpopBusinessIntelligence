// WeatherWidget.jsx v2.0 - API Version
// Uses Visual Crossing Weather API for real-time data
// Caxias do Sul, RS, Brazil

import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, Droplets, Wind, Loader, AlertCircle } from 'lucide-react';

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
        
        // Visual Crossing API structure
        const today = data.days[0];
        
        setWeather({
          temp: today.temp.toFixed(1),
          feelsLike: today.feelslike.toFixed(1),
          humidity: Math.round(today.humidity),
          precip: today.precip.toFixed(1),
          conditions: today.conditions,
          icon: today.icon,
          description: today.description
        });
        
      } catch (err) {
        console.error('Erro ao buscar clima:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = (iconName) => {
    // Map Visual Crossing icons to Lucide icons
    if (!iconName) return Cloud;
    
    const iconMap = {
      'clear-day': Sun,
      'clear-night': Cloud,
      'partly-cloudy-day': Cloud,
      'partly-cloudy-night': Cloud,
      'cloudy': Cloud,
      'rain': CloudRain,
      'showers-day': CloudRain,
      'showers-night': CloudRain,
      'snow': CloudRain,
      'wind': Wind,
      'fog': Cloud
    };
    
    return iconMap[iconName] || Cloud;
  };

  const getIconColor = (iconName, temp) => {
    if (iconName && iconName.includes('rain')) return '#3b82f6';
    if (iconName && iconName.includes('clear')) return '#f59e0b';
    if (temp > 25) return '#f59e0b';
    return '#6b7280';
  };

  if (loading) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        minWidth: '180px'
      }}>
        <Loader style={{ width: '20px', height: '20px', color: '#6b7280' }} className="animate-spin" />
        <div style={{ fontSize: '13px', color: '#6b7280' }}>
          Carregando clima...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #fee2e2',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        minWidth: '180px'
      }}>
        <AlertCircle style={{ width: '20px', height: '20px', color: '#dc2626' }} />
        <div style={{ fontSize: '11px', color: '#dc2626' }}>
          Erro ao carregar
        </div>
      </div>
    );
  }

  if (!weather) return null;

  const WeatherIcon = getWeatherIcon(weather.icon);
  const iconColor = getIconColor(weather.icon, parseFloat(weather.temp));
  const hasRain = parseFloat(weather.precip) > 0.5;

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      padding: '0.75rem 1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      minWidth: '200px'
    }}
    title={weather.description} // Tooltip with full description
    >
      {/* Weather Icon */}
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        background: `${iconColor}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <WeatherIcon style={{ width: '24px', height: '24px', color: iconColor }} />
      </div>

      {/* Weather Info */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '11px',
          fontWeight: '600',
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '2px'
        }}>
          Clima Caxias
        </div>
        <div style={{
          fontSize: '20px',
          fontWeight: '700',
          color: '#10306B',
          lineHeight: '1'
        }}>
          {weather.temp}°C
        </div>
        <div style={{
          fontSize: '11px',
          color: '#6b7280',
          marginTop: '2px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {hasRain && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Droplets style={{ width: '12px', height: '12px' }} />
              {weather.precip}mm
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <Wind style={{ width: '12px', height: '12px' }} />
            {weather.humidity}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
