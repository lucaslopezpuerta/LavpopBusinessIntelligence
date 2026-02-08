// useRevenuePrediction.js
// React hook for fetching revenue predictions from backend
//
// v1.1 (2026-01-20): Added data quality and OOS metrics support
//   - Now exposes dataQuality from API response
//   - Supports drift_detected and oos_* fields in modelInfo
//
// v1.0 (2025-12-21): Initial implementation
//   - Fetches 7-day predictions from Netlify function
//   - Handles loading, error, and refresh states
//   - Caches results with configurable TTL

import { useState, useEffect, useCallback } from 'react';

// Cache configuration
const CACHE_KEY = 'revenue_predictions';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * useRevenuePrediction Hook
 *
 * Fetches revenue predictions from the backend OLS model.
 * Returns 7-day predictions with weather impact analysis.
 *
 * @param {Object} options
 * @param {boolean} options.autoFetch - Auto-fetch on mount (default: true)
 * @param {boolean} options.useCache - Use localStorage cache (default: true)
 *
 * @returns {Object} {
 *   predictions: Array of daily predictions,
 *   modelInfo: Model metrics (R², MAE, etc.),
 *   loading: boolean,
 *   error: string | null,
 *   refresh: function to force refresh
 * }
 */
export default function useRevenuePrediction(options = {}) {
  const {
    autoFetch = true,
    useCache = true
  } = options;

  const [predictions, setPredictions] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [dataQuality, setDataQuality] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  /**
   * Check if cached data is still valid
   */
  const getCachedData = useCallback(() => {
    if (!useCache) return null;

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      if (age < CACHE_TTL_MS) {
        console.log('[useRevenuePrediction] Using cached data');
        return data;
      }

      // Cache expired
      localStorage.removeItem(CACHE_KEY);
      return null;
    } catch (e) {
      console.warn('[useRevenuePrediction] Cache read error:', e);
      return null;
    }
  }, [useCache]);

  /**
   * Save data to cache
   */
  const setCachedData = useCallback((data) => {
    if (!useCache) return;

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('[useRevenuePrediction] Cache write error:', e);
    }
  }, [useCache]);

  /**
   * Fetch predictions from backend
   */
  const fetchPredictions = useCallback(async (skipCache = false) => {
    // Check cache first (unless forced refresh)
    if (!skipCache) {
      const cached = getCachedData();
      if (cached) {
        setPredictions(cached.predictions);
        setModelInfo(cached.model_info);
        setDataQuality(cached.data_quality || null);
        setLoading(false);
        setLastFetched(new Date(cached.timestamp));
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Use relative URL for Netlify function
      // Add cache-busting param to bypass browser HTTP cache
      const cacheBuster = `?_t=${Date.now()}`;
      const apiKey = import.meta.env.VITE_API_KEY;
      const response = await fetch(`/.netlify/functions/revenue-predict${cacheBuster}`, {
        headers: {
          ...(apiKey && { 'X-Api-Key': apiKey })
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Prediction failed');
      }

      setPredictions(data.predictions);
      setModelInfo(data.model_info);
      setDataQuality(data.data_quality || null);
      setLastFetched(new Date(data.timestamp));

      // Cache the result
      setCachedData(data);

    } catch (err) {
      console.error('[useRevenuePrediction] Fetch error:', err);
      setError(err.message || 'Failed to fetch predictions');

      // Try to use stale cache as fallback
      const staleCache = getCachedData();
      if (staleCache) {
        console.log('[useRevenuePrediction] Using stale cache as fallback');
        setPredictions(staleCache.predictions);
        setModelInfo(staleCache.model_info);
        setDataQuality(staleCache.data_quality || null);
      }
    } finally {
      setLoading(false);
    }
  }, [getCachedData, setCachedData]);

  /**
   * Force refresh (bypasses cache)
   */
  const refresh = useCallback(() => {
    return fetchPredictions(true);
  }, [fetchPredictions]);

  /**
   * Auto-fetch on mount
   */
  useEffect(() => {
    if (autoFetch) {
      fetchPredictions();
    }
  }, [autoFetch, fetchPredictions]);

  return {
    predictions,
    modelInfo,
    dataQuality,
    loading,
    error,
    lastFetched,
    refresh,
    // Convenience getters
    hasData: predictions && predictions.length > 0,
    isStale: lastFetched && (Date.now() - lastFetched.getTime() > CACHE_TTL_MS)
  };
}

/**
 * Get prediction for a specific date
 *
 * @param {Array} predictions - Array of predictions from useRevenuePrediction
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Object|null} Prediction for that date or null
 */
export function getPredictionForDate(predictions, date) {
  if (!predictions || !date) return null;
  return predictions.find(p => p.date === date) || null;
}

/**
 * Calculate weekly summary from predictions
 *
 * @param {Array} predictions - Array of predictions
 * @returns {Object} { totalRevenue, avgRevenue, avgImpact }
 */
export function calculateWeeklySummary(predictions) {
  if (!predictions || predictions.length === 0) {
    return { totalRevenue: 0, avgRevenue: 0, avgImpact: 0, days: 0 };
  }

  const totalRevenue = predictions.reduce((sum, p) => sum + (p.predicted_revenue || 0), 0);
  const avgRevenue = totalRevenue / predictions.length;
  const avgImpact = predictions.reduce((sum, p) => sum + (p.weather_impact_pct || 0), 0) / predictions.length;

  return {
    totalRevenue: Math.round(totalRevenue),
    avgRevenue: Math.round(avgRevenue),
    avgImpact: Math.round(avgImpact * 10) / 10,
    days: predictions.length
  };
}
