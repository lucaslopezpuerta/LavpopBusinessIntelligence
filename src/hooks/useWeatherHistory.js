// useWeatherHistory.js v1.1
// React hook for fetching historical weather data from Supabase
// Replaces CSV-based weather loading
//
// v1.1 (2025-12-20): Simplified - removed comfort computation
//   - Comfort impact now computed in WeatherSection with sales data
//   - This hook just fetches raw weather data from Supabase
// v1.0 (2025-12-20): Initial implementation
//   - Fetches weather data from Supabase weather_daily_metrics table
//   - Provides comfort category analytics
//   - Caches data to avoid redundant fetches
//   - Returns loading, error, and refetch states

import { useState, useEffect, useCallback } from 'react';
import {
  getWeatherHistory,
  getLastSyncTimestamp
} from '../utils/weatherService';

/**
 * Hook to fetch historical weather data from Supabase
 *
 * @param {Object} options - Configuration options
 * @param {number} options.days - Number of days to fetch (default: 90)
 * @param {boolean} options.autoFetch - Fetch on mount (default: true)
 * @returns {Object} Weather data, loading state, error, and utilities
 */
export function useWeatherHistory(options = {}) {
  const {
    days = 90,
    autoFetch = true
  } = options;

  const [weatherData, setWeatherData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  /**
   * Fetch weather data from Supabase
   */
  const fetchWeatherData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch primary window (90 days)
      const data = await getWeatherHistory({ days });
      setWeatherData(data);

      // Fetch last sync timestamp
      const syncTime = await getLastSyncTimestamp();
      setLastSync(syncTime);

    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError(err.message || 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  }, [days]);

  // Fetch on mount if autoFetch is enabled
  useEffect(() => {
    if (autoFetch) {
      fetchWeatherData();
    }
  }, [autoFetch, fetchWeatherData]);

  /**
   * Get weather data for a specific date range
   */
  const getDataForRange = useCallback((startDate, endDate) => {
    return weatherData.filter(d => {
      const date = new Date(d.date);
      return date >= new Date(startDate) && date <= new Date(endDate);
    });
  }, [weatherData]);

  /**
   * Get weather for a specific date
   */
  const getWeatherForDate = useCallback((date) => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    return weatherData.find(d => d.date === dateStr);
  }, [weatherData]);

  return {
    // Data
    weatherData,

    // State
    loading,
    error,
    lastSync,

    // Actions
    refetch: fetchWeatherData,

    // Utilities
    getDataForRange,
    getWeatherForDate,

    // Metadata
    totalDays: weatherData.length,
    hasData: weatherData.length > 0
  };
}

/**
 * Lightweight hook for just checking if weather data exists
 */
export function useWeatherDataStatus() {
  const [hasData, setHasData] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      try {
        const syncTime = await getLastSyncTimestamp();
        setLastSync(syncTime);
        setHasData(!!syncTime);
      } catch (err) {
        console.error('Error checking weather status:', err);
      } finally {
        setLoading(false);
      }
    }

    checkStatus();
  }, []);

  return { hasData, lastSync, loading };
}

export default useWeatherHistory;
