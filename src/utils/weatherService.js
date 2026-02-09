// weatherService.js v2.2
// Supabase operations for weather data
// Used by useWeatherHistory hook and WeatherImpactAnalytics component
//
// v2.2 (2025-12-20): Brazil timezone support
//   - daysAgo() now uses Brazil timezone for consistent date filtering
// v2.1 (2025-12-20): Fixed async Supabase client
//   - All functions now properly await getSupabaseClient()
// v2.0 (2025-12-20): Updated for Visual Crossing API schema
//   - Added wind_gust, dew_point, description fields
//   - Updated getComfortAnalytics() with new metrics
//   - Fixed field names to match new schema
// v1.0 (2025-12-20): Initial implementation
//   - getWeatherHistory() - Fetch historical weather data
//   - getComfortAnalytics() - Get aggregated comfort category metrics
//   - getWeatherCorrelation() - Calculate temp/humidity correlations with revenue
//   - getLastSyncTimestamp() - Get last weather sync time

import { getSupabaseClient } from './supabaseClient';
import { getBrazilDateParts } from './dateUtils';

// ============== DATE UTILITIES ==============

/**
 * Get date string in YYYY-MM-DD format
 */
function formatDate(date) {
  if (!date) return null;
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0];
}

/**
 * Get date N days ago (using Brazil timezone)
 */
function daysAgo(days) {
  const brazil = getBrazilDateParts();
  const date = new Date(brazil.year, brazil.month - 1, brazil.day);
  date.setDate(date.getDate() - days);
  return formatDate(date);
}

// ============== WEATHER DATA FETCHING ==============

/**
 * Fetch weather history from Supabase
 * @param {Object} options - Query options
 * @param {string} options.startDate - Start date (YYYY-MM-DD)
 * @param {string} options.endDate - End date (YYYY-MM-DD)
 * @param {number} options.days - Alternative: fetch last N days
 * @param {boolean} options.includeForecasts - Include future dates
 * @returns {Promise<Array>} Array of weather records
 */
export async function getWeatherHistory(options = {}) {
  const client = await getSupabaseClient();
  if (!client) {
    console.warn('Supabase not configured, cannot fetch weather history');
    return [];
  }

  const {
    startDate,
    endDate,
    days = 90,
    includeForecasts = false
  } = options;

  // Build query
  let query = client
    .from('weather_daily_metrics')
    .select('*')
    .order('date', { ascending: true });

  // Apply date filters
  if (startDate) {
    query = query.gte('date', formatDate(startDate));
  } else if (days) {
    query = query.gte('date', daysAgo(days));
  }

  if (endDate) {
    query = query.lte('date', formatDate(endDate));
  } else if (!includeForecasts) {
    // Exclude future dates by default
    query = query.lte('date', formatDate(new Date()));
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching weather history:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch comfort category analytics from Supabase view
 * @param {number} days - Number of days to analyze
 * @returns {Promise<Object>} Comfort analytics by category
 */
export async function getComfortAnalytics(days = 90) {
  const client = await getSupabaseClient();
  if (!client) {
    console.warn('Supabase not configured');
    return null;
  }

  // Fetch raw weather data for the period
  const weatherData = await getWeatherHistory({ days });

  if (!weatherData.length) {
    return null;
  }

  // Aggregate by comfort category
  const categories = {};

  for (const day of weatherData) {
    const cat = day.comfort_category || 'unknown';

    if (!categories[cat]) {
      categories[cat] = {
        key: cat,
        label: getCategoryLabel(cat),
        emoji: getCategoryEmoji(cat),
        days: 0,
        totalTemp: 0,
        totalHumidity: 0,
        totalPrecip: 0,
        totalWindSpeed: 0,
        totalUvIndex: 0
      };
    }

    categories[cat].days++;
    categories[cat].totalTemp += day.temp_avg || 0;
    categories[cat].totalHumidity += day.humidity_avg || 0;
    categories[cat].totalPrecip += day.precipitation || 0;
    categories[cat].totalWindSpeed += day.wind_speed || 0;
    categories[cat].totalUvIndex += day.uv_index || 0;
  }

  // Calculate averages
  Object.values(categories).forEach(cat => {
    cat.avgTemp = cat.days > 0 ? Math.round((cat.totalTemp / cat.days) * 10) / 10 : 0;
    cat.avgHumidity = cat.days > 0 ? Math.round(cat.totalHumidity / cat.days) : 0;
    cat.avgPrecip = cat.days > 0 ? Math.round((cat.totalPrecip / cat.days) * 100) / 100 : 0;
    cat.avgWindSpeed = cat.days > 0 ? Math.round((cat.totalWindSpeed / cat.days) * 10) / 10 : 0;
    cat.avgUvIndex = cat.days > 0 ? Math.round((cat.totalUvIndex / cat.days) * 10) / 10 : 0;

    // Cleanup temp fields
    delete cat.totalTemp;
    delete cat.totalHumidity;
    delete cat.totalPrecip;
    delete cat.totalWindSpeed;
    delete cat.totalUvIndex;
  });

  return {
    categories,
    totalDays: weatherData.length,
    dateRange: {
      start: weatherData[0]?.date,
      end: weatherData[weatherData.length - 1]?.date
    }
  };
}

/**
 * Get 7-day weather forecast (future dates from Supabase)
 * @returns {Promise<Array>} Array of forecast records
 */
export async function getWeatherForecast() {
  const client = await getSupabaseClient();
  if (!client) {
    console.warn('Supabase not configured');
    return [];
  }

  const today = formatDate(new Date());
  const nextWeek = daysAgo(-7);

  const { data, error } = await client
    .from('weather_daily_metrics')
    .select('*')
    .gte('date', today)
    .lte('date', nextWeek)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching weather forecast:', error);
    return [];
  }

  return data || [];
}

/**
 * Get last weather sync timestamp from app_settings
 * @returns {Promise<string|null>} ISO timestamp or null
 */
export async function getLastSyncTimestamp() {
  const client = await getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('app_settings')
    .select('weather_last_sync')
    .eq('id', 'default')
    .single();

  if (error || !data) return null;

  return data.weather_last_sync;
}

/**
 * Manually trigger weather sync (calls Netlify function)
 * @returns {Promise<Object>} Sync result
 */
export async function triggerWeatherSync() {
  try {
    const apiKey = import.meta.env.VITE_API_KEY;
    const response = await fetch('/.netlify/functions/weather-sync', {
      method: 'POST',
      headers: {
        ...(apiKey && { 'X-Api-Key': apiKey })
      }
    });

    return await response.json();
  } catch (error) {
    console.error('Error triggering weather sync:', error);
    return { success: false, message: error.message };
  }
}

// ============== HELPER FUNCTIONS ==============

/**
 * Get human-readable label for comfort category
 */
function getCategoryLabel(category) {
  const labels = {
    abafado: 'Abafado',
    quente: 'Quente',
    frio: 'Frio',
    ameno: 'Ameno',
    umido: 'Úmido',
    chuvoso: 'Chuvoso',
    unknown: 'Desconhecido'
  };
  return labels[category] || category;
}

/**
 * Get emoji for comfort category
 */
function getCategoryEmoji(category) {
  const emojis = {
    abafado: '🥵',
    quente: '☀️',
    frio: '❄️',
    ameno: '😌',
    umido: '💧',
    chuvoso: '🌧️',
    unknown: '❓'
  };
  return emojis[category] || '🌤️';
}

/**
 * Get description for comfort category
 */
export function getCategoryDescription(category) {
  const descriptions = {
    abafado: 'Sensação térmica ≥27°C - Calor opressivo',
    quente: 'Temperatura ≥23°C - Clima quente',
    frio: 'Temperatura ≤10°C - Clima frio',
    ameno: 'Temperatura entre 10-23°C - Clima agradável',
    umido: 'Umidade ≥80% com precipitação - Úmido',
    chuvoso: 'Precipitação >5mm - Dia chuvoso'
  };
  return descriptions[category] || '';
}

/**
 * Compute comfort category from raw weather data
 * (mirrors logic in weather-sync.js and migrate-weather-csv.cjs)
 */
export function computeComfortCategory(temp, humidity, precipitation, feelsLike = null) {
  const effectiveFeelsLike = feelsLike !== null ? feelsLike : temp;

  if (effectiveFeelsLike >= 27) return 'abafado';
  if (temp >= 23) return 'quente';
  if (temp <= 10) return 'frio';
  if (precipitation > 5) return 'chuvoso';
  if (humidity >= 80 && precipitation > 0) return 'umido';

  return 'ameno';
}

// ============== EXPORT HELPERS ==============

export {
  getCategoryLabel,
  getCategoryEmoji,
  formatDate,
  daysAgo
};
