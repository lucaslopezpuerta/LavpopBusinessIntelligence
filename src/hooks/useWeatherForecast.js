// useWeatherForecast.js v1.1
// React hook for fetching real-time weather forecast from Visual Crossing API
// Used by WeatherHero, HourlyForecast, DailyForecast components
//
// CHANGELOG:
// v1.1 (2025-12-20): Brazil timezone support
//   - Uses getBrazilDateParts() for "now" calculations
//   - Ensures consistent time filtering regardless of browser timezone
// v1.0 (2025-12-20): Initial implementation
//   - Fetches current conditions + 24h hourly + 7-day forecast
//   - 30-minute caching via localStorage
//   - Auto-refresh capability
//   - Loading, error, and stale data states

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getBrazilDateParts, toBrazilDateString } from '../utils/dateUtils';

// Configuration
const VISUAL_CROSSING_BASE = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline';
const LOCATION = 'caxias%20do%20sul';
const API_KEY = 'FTYV4SM9NMMTJKVFLEGRCGWJ9'; // From existing WeatherWidget_API.jsx
const CACHE_KEY = 'weather_forecast_cache';
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// ============== TYPES ==============

/**
 * @typedef {Object} CurrentConditions
 * @property {number} temp - Current temperature (°C)
 * @property {number} feelsLike - Feels like temperature
 * @property {number} humidity - Humidity (%)
 * @property {number} precipProb - Precipitation probability (%)
 * @property {number} windSpeed - Wind speed (km/h)
 * @property {number} windDirection - Wind direction (degrees)
 * @property {number} pressure - Atmospheric pressure (hPa)
 * @property {number} uvIndex - UV index
 * @property {number} visibility - Visibility (km)
 * @property {number} cloudCover - Cloud cover (%)
 * @property {string} conditions - Weather conditions text
 * @property {string} icon - Weather icon code
 * @property {string} sunrise - Sunrise time (HH:MM)
 * @property {string} sunset - Sunset time (HH:MM)
 */

/**
 * @typedef {Object} HourlyForecast
 * @property {string} hour - Hour in HH:00 format
 * @property {number} temp - Temperature
 * @property {number} feelsLike - Feels like temperature
 * @property {number} humidity - Humidity
 * @property {number} precipProb - Precipitation probability
 * @property {string} icon - Weather icon code
 * @property {string} conditions - Weather conditions
 */

/**
 * @typedef {Object} DailyForecast
 * @property {string} date - Date in YYYY-MM-DD format
 * @property {string} dayName - Day name (e.g., "Segunda")
 * @property {number} tempMax - Maximum temperature
 * @property {number} tempMin - Minimum temperature
 * @property {number} humidity - Average humidity
 * @property {number} precipProb - Precipitation probability
 * @property {string} icon - Weather icon code
 * @property {string} conditions - Weather conditions
 * @property {string} sunrise - Sunrise time
 * @property {string} sunset - Sunset time
 * @property {string} description - Day description
 */

// ============== HELPER FUNCTIONS ==============

/**
 * Get day name in Portuguese
 */
function getDayName(dateStr, isToday = false) {
  if (isToday) return 'Hoje';

  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const date = new Date(dateStr + 'T12:00:00');
  return days[date.getDay()];
}

/**
 * Format time string (remove seconds if present)
 */
function formatTime(timeStr) {
  if (!timeStr) return '';
  return timeStr.substring(0, 5); // Keep HH:MM
}

/**
 * Check if cache is still valid
 */
function isCacheValid(timestamp) {
  if (!timestamp) return false;
  return Date.now() - timestamp < CACHE_DURATION_MS;
}

/**
 * Get cached forecast from localStorage
 */
function getCachedForecast() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (!isCacheValid(timestamp)) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return { data, timestamp, isStale: false };
  } catch (e) {
    return null;
  }
}

/**
 * Save forecast to localStorage cache
 */
function setCachedForecast(data) {
  try {
    const cacheEntry = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
  } catch (e) {
    console.warn('Failed to cache weather data:', e);
  }
}

// ============== DATA TRANSFORMATION ==============

/**
 * Transform Visual Crossing API response to normalized format
 * Uses Brazil timezone for "now" calculations
 */
function transformWeatherData(apiData) {
  const brazilParts = getBrazilDateParts();
  const today = toBrazilDateString();

  // Current conditions (from currentConditions or first day)
  const currentRaw = apiData.currentConditions || apiData.days?.[0];
  const current = currentRaw ? {
    temp: Math.round(currentRaw.temp * 10) / 10,
    feelsLike: Math.round(currentRaw.feelslike * 10) / 10,
    humidity: Math.round(currentRaw.humidity),
    precipProb: currentRaw.precipprob || 0,
    windSpeed: Math.round(currentRaw.windspeed * 10) / 10,
    windGust: currentRaw.windgust ? Math.round(currentRaw.windgust * 10) / 10 : null,
    windDirection: currentRaw.winddir || 0,
    pressure: currentRaw.pressure || 0,
    uvIndex: currentRaw.uvindex || 0,
    visibility: currentRaw.visibility || 0,
    cloudCover: currentRaw.cloudcover || 0,
    dewPoint: currentRaw.dew ? Math.round(currentRaw.dew * 10) / 10 : null,
    conditions: currentRaw.conditions || '',
    icon: currentRaw.icon || 'cloudy',
    sunrise: formatTime(currentRaw.sunrise),
    sunset: formatTime(currentRaw.sunset)
  } : null;

  // Hourly forecast (next 24 hours)
  const hourly = [];
  if (apiData.days) {
    // Use Brazil timezone for "now" comparison
    const now = new Date(brazilParts.year, brazilParts.month - 1, brazilParts.day, brazilParts.hour, brazilParts.minute, brazilParts.second);
    const currentHour = brazilParts.hour;

    for (const day of apiData.days.slice(0, 2)) {
      if (!day.hours) continue;

      for (const hour of day.hours) {
        const hourNum = parseInt(hour.datetime.split(':')[0], 10);
        const hourDate = new Date(day.datetime + 'T' + hour.datetime);

        // Skip past hours
        if (hourDate < now) continue;

        // Only take next 24 hours
        if (hourly.length >= 24) break;

        hourly.push({
          hour: hour.datetime.substring(0, 5),
          datetime: day.datetime + 'T' + hour.datetime,
          temp: Math.round(hour.temp * 10) / 10,
          feelsLike: Math.round(hour.feelslike * 10) / 10,
          humidity: Math.round(hour.humidity),
          precipProb: hour.precipprob || 0,
          icon: hour.icon || 'cloudy',
          conditions: hour.conditions || ''
        });
      }
    }
  }

  // Daily forecast (7 days)
  const daily = (apiData.days || []).slice(0, 7).map((day, index) => ({
    date: day.datetime,
    dayName: getDayName(day.datetime, index === 0),
    tempMax: Math.round(day.tempmax * 10) / 10,
    tempMin: Math.round(day.tempmin * 10) / 10,
    temp: Math.round(day.temp * 10) / 10,
    feelsLike: day.feelslike ? Math.round(day.feelslike * 10) / 10 : null,
    humidity: Math.round(day.humidity),
    precipProb: day.precipprob || 0,
    precipitation: day.precip || 0,
    windSpeed: day.windspeed ? Math.round(day.windspeed * 10) / 10 : null,
    windGust: day.windgust ? Math.round(day.windgust * 10) / 10 : null,
    pressure: day.pressure || null,
    uvIndex: day.uvindex || null,
    cloudCover: day.cloudcover || null,
    dewPoint: day.dew ? Math.round(day.dew * 10) / 10 : null,
    icon: day.icon || 'cloudy',
    conditions: day.conditions || '',
    sunrise: formatTime(day.sunrise),
    sunset: formatTime(day.sunset),
    description: day.description || ''
  }));

  return {
    location: {
      name: 'Caxias do Sul',
      region: 'Rio Grande do Sul',
      country: 'Brasil',
      timezone: apiData.timezone || 'America/Sao_Paulo'
    },
    current,
    hourly,
    daily,
    lastUpdated: new Date().toISOString()
  };
}

// ============== API FETCHING ==============

/**
 * Fetch weather data from Visual Crossing API
 */
async function fetchWeatherForecast() {
  const url = new URL(`${VISUAL_CROSSING_BASE}/${LOCATION}`);
  url.searchParams.set('unitGroup', 'metric');
  url.searchParams.set('key', API_KEY);
  url.searchParams.set('contentType', 'json');
  url.searchParams.set('include', 'hours,days,current');
  url.searchParams.set('elements', [
    'datetime', 'temp', 'tempmin', 'tempmax', 'feelslike',
    'humidity', 'precip', 'precipprob', 'windspeed', 'windgust', 'winddir',
    'pressure', 'uvindex', 'visibility', 'cloudcover', 'dew',
    'conditions', 'icon', 'sunrise', 'sunset', 'description'
  ].join(','));

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const data = await response.json();
  return transformWeatherData(data);
}

// ============== MAIN HOOK ==============

/**
 * Hook to fetch real-time weather forecast from Visual Crossing API
 *
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoFetch - Fetch on mount (default: true)
 * @param {boolean} options.useCache - Use localStorage cache (default: true)
 * @param {number} options.refreshInterval - Auto-refresh interval in ms (default: 0 = disabled)
 * @returns {Object} Weather data, loading state, error, and utilities
 */
export function useWeatherForecast(options = {}) {
  const {
    autoFetch = true,
    useCache = true,
    refreshInterval = 0
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  /**
   * Fetch weather data
   */
  const fetchData = useCallback(async (bypassCache = false) => {
    // Check cache first (unless bypassing)
    if (useCache && !bypassCache) {
      const cached = getCachedForecast();
      if (cached) {
        setData(cached.data);
        setLastFetched(new Date(cached.timestamp));
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const weatherData = await fetchWeatherForecast();
      setData(weatherData);
      setLastFetched(new Date());

      // Cache the result
      if (useCache) {
        setCachedForecast(weatherData);
      }
    } catch (err) {
      console.error('Error fetching weather forecast:', err);
      setError(err.message || 'Failed to fetch weather data');

      // If we have cached data, use it as fallback
      if (useCache) {
        const cached = getCachedForecast();
        if (cached) {
          setData(cached.data);
          setLastFetched(new Date(cached.timestamp));
        }
      }
    } finally {
      setLoading(false);
    }
  }, [useCache]);

  // Fetch on mount if autoFetch is enabled
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchData(true); // Bypass cache for refresh
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, fetchData]);

  /**
   * Check if data is stale (older than cache duration)
   */
  const isStale = useMemo(() => {
    if (!lastFetched) return true;
    return Date.now() - lastFetched.getTime() > CACHE_DURATION_MS;
  }, [lastFetched]);

  /**
   * Time until next refresh
   */
  const timeUntilRefresh = useMemo(() => {
    if (!lastFetched) return 0;
    const remaining = CACHE_DURATION_MS - (Date.now() - lastFetched.getTime());
    return Math.max(0, remaining);
  }, [lastFetched]);

  /**
   * Force refresh (bypass cache)
   */
  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  return {
    // Data
    data,
    current: data?.current || null,
    hourly: data?.hourly || [],
    daily: data?.daily || [],
    location: data?.location || null,

    // State
    loading,
    error,
    isStale,

    // Metadata
    lastFetched,
    lastUpdated: data?.lastUpdated,
    timeUntilRefresh,

    // Actions
    refresh,
    refetch: fetchData,

    // Computed
    hasData: !!data
  };
}

export default useWeatherForecast;
