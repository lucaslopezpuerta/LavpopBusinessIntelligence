// WeatherWidget.jsx v1.0
// Displays today's weather from weather.csv data
// Portuguese labels, compact design for header placement

import React, { useMemo } from 'react';
import { Cloud, CloudRain, Sun, Droplets, Wind } from 'lucide-react';

const WeatherWidget = ({ weatherData }) => {
  const todayWeather = useMemo(() => {
    if (!weatherData || weatherData.length === 0) return null;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Find today's weather or most recent data
    let closestWeather = weatherData[weatherData.length - 1]; // Default to most recent
    
    for (let i = weatherData.length - 1; i >= 0; i--) {
      const row = weatherData[i];
      const dateField = row['Data Medicao'] || row['Data'] || row['date'];
      if (dateField) {
        const weatherDate = dateField.split(' ')[0]; // Handle "YYYY-MM-DD HH:MM:SS"
        if (weatherDate === todayStr) {
          closestWeather = row;
          break;
        }
      }
    }

    const temp = parseFloat(closestWeather['TEMPERATURA MEDIA COMPENSADA, DIARIA(°C)'] || closestWeather.temperatura || 0);
    const rain = parseFloat(closestWeather['PRECIPITACAO TOTAL, DIARIO(mm)'] || closestWeather.chuva || 0);
    const humidity = parseFloat(closestWeather['UMIDADE RELATIVA DO AR, MEDIA DIARIA(%)'] || closestWeather.umidade || 0);

    return {
      temp: temp.toFixed(1),
      rain: rain.toFixed(1),
      humidity: humidity.toFixed(0),
      hasRain: rain > 0.5
    };
  }, [weatherData]);

  if (!todayWeather) {
    return null;
  }

  const getWeatherIcon = () => {
    if (todayWeather.hasRain) return CloudRain;
    if (todayWeather.temp > 25) return Sun;
    return Cloud;
  };

  const WeatherIcon = getWeatherIcon();
  const iconColor = todayWeather.hasRain ? '#3b82f6' : todayWeather.temp > 25 ? '#f59e0b' : '#6b7280';

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
      {/* Weather Icon */}
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        background: `${iconColor}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
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
          Clima Hoje
        </div>
        <div style={{
          fontSize: '20px',
          fontWeight: '700',
          color: '#10306B',
          lineHeight: '1'
        }}>
          {todayWeather.temp}°C
        </div>
        <div style={{
          fontSize: '11px',
          color: '#6b7280',
          marginTop: '2px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {todayWeather.hasRain && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Droplets style={{ width: '12px', height: '12px' }} />
              {todayWeather.rain}mm
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <Wind style={{ width: '12px', height: '12px' }} />
            {todayWeather.humidity}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
