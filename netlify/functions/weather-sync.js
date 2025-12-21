// netlify/functions/weather-sync.js
// Daily weather data sync from Visual Crossing API
// Runs daily at 09:00 UTC (06:00 Brazil time)
//
// v1.0 (2025-12-20): Initial implementation
//   - Fetches yesterday's actual weather + 7-day forecast
//   - Upserts to weather_daily_metrics table
//   - Computes comfort_category for each day
//   - Updates app_settings.weather_last_sync timestamp
//
// Environment variables required:
// - VISUAL_CROSSING_API_KEY: Visual Crossing API key
// - SUPABASE_URL: Supabase project URL
// - SUPABASE_SERVICE_KEY: Supabase service role key

const { createClient } = require('@supabase/supabase-js');

// Configuration
const VISUAL_CROSSING_BASE = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline';
const LOCATION = 'caxias%20do%20sul';
const UNIT_GROUP = 'metric';
const BUSINESS_TIMEZONE = 'America/Sao_Paulo';

// Fallback API key (from existing WeatherWidget_API.jsx)
const DEFAULT_API_KEY = 'FTYV4SM9NMMTJKVFLEGRCGWJ9';

// ============== SUPABASE CLIENT ==============

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(url, key);
}

// ============== DATE UTILITIES ==============

/**
 * Get date string in YYYY-MM-DD format for São Paulo timezone
 */
function getLocalDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  return formatter.format(date);
}

/**
 * Parse Visual Crossing time string (HH:MM:SS) to TIME format
 */
function parseTimeString(timeStr) {
  if (!timeStr) return null;
  // Visual Crossing returns times like "06:15:00"
  return timeStr.substring(0, 8); // Keep HH:MM:SS
}

// ============== COMFORT CATEGORY LOGIC ==============

/**
 * Classify weather into comfort categories based on thermal comfort
 * Matches the logic in WeatherImpactSection.jsx
 */
function computeComfortCategory(temp, humidity, precipitation, feelsLike = null) {
  const effectiveFeelsLike = feelsLike !== null ? feelsLike : temp;

  // Priority 1: Muggy/oppressive heat
  if (effectiveFeelsLike >= 27) {
    return 'abafado';
  }

  // Priority 2: Hot
  if (temp >= 23) {
    return 'quente';
  }

  // Priority 3: Cold
  if (temp <= 10) {
    return 'frio';
  }

  // Priority 4: Rainy (significant precipitation)
  if (precipitation > 5) {
    return 'chuvoso';
  }

  // Priority 5: Humid (high humidity with some precipitation)
  if (humidity >= 80 && precipitation > 0) {
    return 'umido';
  }

  // Default: Mild/pleasant weather
  return 'ameno';
}

// ============== VISUAL CROSSING API ==============

/**
 * Fetch weather data from Visual Crossing API
 * Returns data for the specified date range
 */
async function fetchWeatherData(startDate, endDate) {
  const apiKey = process.env.VISUAL_CROSSING_API_KEY || DEFAULT_API_KEY;

  const url = new URL(`${VISUAL_CROSSING_BASE}/${LOCATION}/${startDate}/${endDate}`);
  url.searchParams.set('unitGroup', UNIT_GROUP);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('contentType', 'json');
  url.searchParams.set('include', 'days');
  url.searchParams.set('elements', [
    'datetime', 'temp', 'tempmin', 'tempmax', 'feelslike',
    'humidity', 'precip', 'precipprob', 'windspeed', 'windgust', 'winddir',
    'pressure', 'uvindex', 'visibility', 'cloudcover', 'dew',
    'conditions', 'icon', 'sunrise', 'sunset', 'description'
  ].join(','));

  console.log(`Fetching weather: ${startDate} to ${endDate}`);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Visual Crossing API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Transform Visual Crossing day data to our database format
 */
function transformDayData(day, source = 'visual_crossing') {
  const temp = day.temp || 0;
  const humidity = day.humidity || 0;
  const precipitation = day.precip || 0;
  const feelsLike = day.feelslike || temp;

  return {
    date: day.datetime,
    temp_avg: temp,
    temp_min: day.tempmin || null,
    temp_max: day.tempmax || null,
    feels_like: feelsLike,
    humidity_avg: humidity,
    precipitation: precipitation,
    precip_probability: day.precipprob || null,
    wind_speed: day.windspeed || null,
    wind_gust: day.windgust || null,
    wind_direction: day.winddir || null,
    pressure: day.pressure || null,
    visibility: day.visibility || null,
    cloud_cover: day.cloudcover || null,
    uv_index: day.uvindex || null,
    dew_point: day.dew || null,
    conditions: day.conditions || null,
    description: day.description || null,
    icon: day.icon || null,
    comfort_category: computeComfortCategory(temp, humidity, precipitation, feelsLike),
    sunrise: parseTimeString(day.sunrise),
    sunset: parseTimeString(day.sunset),
    source
  };
}

// ============== SYNC FUNCTION ==============

/**
 * Main sync function - fetches and upserts weather data
 * Called by both scheduled handler and manual trigger
 */
async function syncWeatherData() {
  console.log('🌤️ Starting weather sync...');

  const supabase = getSupabase();

  // Get date range: yesterday through next 7 days
  const yesterday = getLocalDate(-1);
  const nextWeek = getLocalDate(7);

  try {
    // Fetch from Visual Crossing
    const data = await fetchWeatherData(yesterday, nextWeek);

    if (!data.days || data.days.length === 0) {
      console.log('No weather data returned from API');
      return { success: false, message: 'No data returned from API', synced: 0 };
    }

    console.log(`Received ${data.days.length} days of weather data`);

    // Transform and upsert each day
    let successCount = 0;
    let errorCount = 0;

    for (const day of data.days) {
      const record = transformDayData(day);

      const { error } = await supabase
        .from('weather_daily_metrics')
        .upsert(record, { onConflict: 'date' });

      if (error) {
        console.error(`Error upserting ${day.datetime}: ${error.message}`);
        errorCount++;
      } else {
        successCount++;
      }
    }

    // Update app_settings with sync timestamp
    await supabase
      .from('app_settings')
      .update({ weather_last_sync: new Date().toISOString() })
      .eq('id', 'default');

    console.log(`✅ Weather sync complete: ${successCount} records synced, ${errorCount} errors`);

    return {
      success: true,
      message: `Synced ${successCount} days of weather data`,
      synced: successCount,
      errors: errorCount,
      dateRange: { from: yesterday, to: nextWeek }
    };

  } catch (error) {
    console.error('❌ Weather sync failed:', error.message);
    return {
      success: false,
      message: error.message,
      synced: 0
    };
  }
}

// ============== NETLIFY HANDLER ==============

/**
 * Netlify function handler
 * Supports both scheduled execution and manual HTTP trigger
 */
exports.handler = async (event, context) => {
  // Log invocation type
  const isScheduled = event.httpMethod === undefined;
  console.log(`Weather sync triggered (${isScheduled ? 'scheduled' : 'manual'})`);

  try {
    const result = await syncWeatherData();

    return {
      statusCode: result.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        ...result,
        timestamp: new Date().toISOString(),
        invocationType: isScheduled ? 'scheduled' : 'manual'
      })
    };
  } catch (error) {
    console.error('Handler error:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// Export sync function for use by other modules (e.g., campaign-scheduler)
exports.syncWeatherData = syncWeatherData;
