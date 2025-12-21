// weatherUtils.js v2.1
// Weather utility functions for data transformation and formatting
//
// v2.1 (2025-12-20): Added simplified forecast classification
//   - classifyForecastDay: 3-category system (rainy, cold, normal) for forecast display
//   - getForecastImpact: Maps forecast category to historical revenue impact
// v2.0 (2025-12-20): Added weather impact calculations
//   - Migrated from intelligenceCalculations.js for better code organization
//   - calculateComfortWeatherImpact, calculateTemperatureCorrelation, calculateHumidityCorrelation
//   - parseWeatherData, classifyComfortCondition, calculateHeatIndex
// v1.0 (2025-12-20): Initial implementation
//   - Weather icon mapping
//   - Temperature formatting
//   - Wind direction utilities
//   - UV level classification
//   - Brazilian date/time formatting

import { parseSalesRecords, filterWithServices } from './transactionParser';
import { formatDate, getBrazilDateParts } from './dateUtils';

// ============== ICON MAPPING ==============

/**
 * Map Visual Crossing icon codes to Lucide icon names
 */
export const weatherIconMap = {
  'clear-day': 'Sun',
  'clear-night': 'Moon',
  'partly-cloudy-day': 'CloudSun',
  'partly-cloudy-night': 'CloudMoon',
  'cloudy': 'Cloud',
  'rain': 'CloudRain',
  'showers-day': 'CloudRain',
  'showers-night': 'CloudRain',
  'thunder-rain': 'CloudLightning',
  'thunder-showers-day': 'CloudLightning',
  'thunder-showers-night': 'CloudLightning',
  'snow': 'Snowflake',
  'snow-showers-day': 'Snowflake',
  'snow-showers-night': 'Snowflake',
  'fog': 'CloudFog',
  'wind': 'Wind',
  'hail': 'CloudHail',
  'sleet': 'CloudSnow'
};

/**
 * Get icon name for a weather condition
 */
export function getWeatherIconName(iconCode) {
  return weatherIconMap[iconCode] || 'Cloud';
}

// ============== TEMPERATURE FORMATTING ==============

/**
 * Format temperature with optional unit
 */
export function formatTemperature(temp, showUnit = true) {
  if (temp === null || temp === undefined) return '—';
  const rounded = Math.round(temp);
  return showUnit ? `${rounded}°C` : `${rounded}°`;
}

/**
 * Format temperature range (high/low)
 */
export function formatTempRange(high, low) {
  if (high === null || low === null) return '—';
  return `${Math.round(high)}° / ${Math.round(low)}°`;
}

/**
 * Get temperature color class based on value
 */
export function getTempColorClass(temp) {
  if (temp >= 30) return 'text-red-500 dark:text-red-400';
  if (temp >= 25) return 'text-orange-500 dark:text-orange-400';
  if (temp >= 20) return 'text-amber-500 dark:text-amber-400';
  if (temp >= 15) return 'text-emerald-500 dark:text-emerald-400';
  if (temp >= 10) return 'text-cyan-500 dark:text-cyan-400';
  return 'text-blue-500 dark:text-blue-400';
}

// ============== WIND UTILITIES ==============

/**
 * Convert wind direction in degrees to cardinal direction
 */
export function getWindDirection(degrees) {
  if (degrees === null || degrees === undefined) return '';

  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

/**
 * Get wind direction in Portuguese
 */
export function getWindDirectionPt(degrees) {
  const directionMap = {
    'N': 'Norte',
    'NE': 'Nordeste',
    'E': 'Leste',
    'SE': 'Sudeste',
    'S': 'Sul',
    'SW': 'Sudoeste',
    'W': 'Oeste',
    'NW': 'Noroeste'
  };
  const cardinal = getWindDirection(degrees);
  return directionMap[cardinal] || cardinal;
}

/**
 * Format wind speed
 */
export function formatWindSpeed(speed) {
  if (speed === null || speed === undefined) return '—';
  return `${Math.round(speed)} km/h`;
}

// ============== UV INDEX ==============

/**
 * Get UV level label in Portuguese
 */
export function getUVLevel(uvIndex) {
  if (uvIndex === null || uvIndex === undefined) return { label: '—', color: 'gray' };

  if (uvIndex <= 2) return { label: 'Baixo', color: 'green' };
  if (uvIndex <= 5) return { label: 'Moderado', color: 'yellow' };
  if (uvIndex <= 7) return { label: 'Alto', color: 'orange' };
  if (uvIndex <= 10) return { label: 'Muito Alto', color: 'red' };
  return { label: 'Extremo', color: 'purple' };
}

/**
 * Get UV color class
 */
export function getUVColorClass(uvIndex) {
  const { color } = getUVLevel(uvIndex);
  const colorMap = {
    green: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
    yellow: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
    red: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30',
    gray: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
  };
  return colorMap[color] || colorMap.gray;
}

// ============== DATE/TIME FORMATTING ==============

/**
 * Format time in Brazilian format (HH:MM)
 */
export function formatTime(timeStr) {
  if (!timeStr) return '—';
  // Handle both "HH:MM" and "HH:MM:SS" formats
  return timeStr.substring(0, 5);
}

/**
 * Get day name in Portuguese
 */
export function getDayNamePt(dateStr, options = {}) {
  const { short = false, today = true } = options;

  const date = new Date(dateStr + 'T12:00:00');
  const now = new Date();

  // Check if it's today
  if (today && date.toDateString() === now.toDateString()) {
    return 'Hoje';
  }

  // Check if it's tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Amanhã';
  }

  const days = short
    ? ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    : ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  return days[date.getDay()];
}

/**
 * Format date in Brazilian format (DD/MM)
 */
export function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}`;
}

// ============== WEATHER CONDITIONS ==============

/**
 * Get hero gradient class based on weather condition
 */
export function getWeatherGradient(icon, temp) {
  // Temperature-based gradients take priority for extreme temps
  if (temp >= 30) {
    return 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-500';
  }
  if (temp <= 10) {
    return 'bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600';
  }

  // Icon-based gradients
  const gradientMap = {
    'clear-day': 'bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600',
    'clear-night': 'bg-gradient-to-br from-indigo-600 via-purple-700 to-slate-800',
    'partly-cloudy-day': 'bg-gradient-to-br from-slate-300 via-blue-400 to-sky-500',
    'partly-cloudy-night': 'bg-gradient-to-br from-slate-500 via-indigo-600 to-purple-700',
    'cloudy': 'bg-gradient-to-br from-slate-400 via-gray-500 to-slate-600',
    'rain': 'bg-gradient-to-br from-slate-500 via-blue-600 to-cyan-700',
    'showers-day': 'bg-gradient-to-br from-slate-400 via-blue-500 to-cyan-600',
    'thunder-rain': 'bg-gradient-to-br from-slate-600 via-purple-700 to-indigo-800',
    'snow': 'bg-gradient-to-br from-slate-200 via-blue-200 to-cyan-300',
    'fog': 'bg-gradient-to-br from-slate-300 via-gray-400 to-slate-500',
    'wind': 'bg-gradient-to-br from-teal-400 via-cyan-500 to-sky-600'
  };

  return gradientMap[icon] || gradientMap['partly-cloudy-day'];
}

/**
 * Get background color class for weather cards based on icon
 */
export function getWeatherCardBg(icon) {
  const bgMap = {
    'clear-day': 'bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/30',
    'clear-night': 'bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/30',
    'partly-cloudy-day': 'bg-gradient-to-br from-sky-50 to-blue-100 dark:from-sky-900/20 dark:to-blue-900/30',
    'cloudy': 'bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-800/50 dark:to-gray-800/60',
    'rain': 'bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/30',
    'thunder-rain': 'bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/30',
    'snow': 'bg-gradient-to-br from-cyan-50 to-sky-100 dark:from-cyan-900/20 dark:to-sky-900/30',
    'fog': 'bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-800/50 dark:to-slate-800/60'
  };

  return bgMap[icon] || bgMap['cloudy'];
}

// ============== COMFORT CATEGORY ==============

/**
 * Compute comfort category from weather data
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

/**
 * Get comfort category info
 */
export function getComfortCategoryInfo(category) {
  const categories = {
    abafado: { label: 'Abafado', emoji: '🥵', description: 'Sensação térmica ≥27°C' },
    quente: { label: 'Quente', emoji: '☀️', description: 'Temperatura ≥23°C' },
    frio: { label: 'Frio', emoji: '❄️', description: 'Temperatura ≤10°C' },
    ameno: { label: 'Ameno', emoji: '😌', description: 'Temperatura 10-23°C' },
    umido: { label: 'Úmido', emoji: '💧', description: 'Umidade ≥80% com precipitação' },
    chuvoso: { label: 'Chuvoso', emoji: '🌧️', description: 'Precipitação >5mm' }
  };

  return categories[category] || categories.ameno;
}

// ============== PRECIPITATION ==============

/**
 * Format precipitation probability
 */
export function formatPrecipProb(prob) {
  if (prob === null || prob === undefined) return '—';
  return `${Math.round(prob)}%`;
}

/**
 * Format precipitation amount
 */
export function formatPrecipitation(mm) {
  if (mm === null || mm === undefined || mm === 0) return '0 mm';
  if (mm < 1) return `${(mm).toFixed(1)} mm`;
  return `${Math.round(mm)} mm`;
}

// ============== VISIBILITY ==============

/**
 * Format visibility
 */
export function formatVisibility(km) {
  if (km === null || km === undefined) return '—';
  if (km >= 10) return 'Excelente';
  if (km >= 5) return 'Boa';
  if (km >= 2) return 'Moderada';
  return 'Baixa';
}

// ============== PRESSURE ==============

/**
 * Format atmospheric pressure
 */
export function formatPressure(hPa) {
  if (hPa === null || hPa === undefined) return '—';
  return `${Math.round(hPa)} hPa`;
}

/**
 * Get pressure trend description
 */
export function getPressureTrend(current, previous) {
  if (!current || !previous) return 'Estável';
  const diff = current - previous;
  if (diff > 2) return 'Subindo';
  if (diff < -2) return 'Caindo';
  return 'Estável';
}

// ============== WEATHER IMPACT CALCULATIONS ==============
// Migrated from intelligenceCalculations.js for better code organization
// These functions analyze weather-sales correlations for business insights

/**
 * Parse weather data CSV
 */
export function parseWeatherData(weatherData) {
  if (!weatherData || weatherData.length === 0) return [];

  return weatherData.map(row => {
    const precip = parseFloat(row['PRECIPITACAO TOTAL, DIARIO(mm)'] || row.precipitation || 0);

    return {
      date: new Date(row['Data Medicao'] || row.date),
      precipitation: precip,
      temperature: parseFloat(row['TEMPERATURA MEDIA COMPENSADA, DIARIA(°C)'] || row.temperature || 0),
      humidity: parseFloat(row['UMIDADE RELATIVA DO AR, MEDIA DIARIA(%)'] || row.humidity || 0),
      isRainy: precip > 5,
      isCloudy: precip > 0 && precip <= 5,
      isSunny: precip === 0
    };
  });
}

/**
 * Calculate heat index (feels-like temperature)
 * Simplified Steadman formula for heat index
 * @param {number} T - Temperature in Celsius
 * @param {number} RH - Relative humidity in percent
 * @returns {number} Heat index in Celsius
 */
function calculateHeatIndex(T, RH) {
  // Heat index only applies when T >= 27°C and RH >= 40%
  if (T < 27 || RH < 40) return T;

  // Rothfusz regression (converted to Celsius)
  // Original formula is for Fahrenheit, so we convert
  const TF = T * 9/5 + 32;

  const HI_F = -42.379 + 2.04901523 * TF + 10.14333127 * RH
    - 0.22475541 * TF * RH - 0.00683783 * TF * TF
    - 0.05481717 * RH * RH + 0.00122874 * TF * TF * RH
    + 0.00085282 * TF * RH * RH - 0.00000199 * TF * TF * RH * RH;

  // Convert back to Celsius
  return (HI_F - 32) * 5/9;
}

/**
 * Classify weather condition by thermal comfort
 * Thresholds calibrated for Caxias do Sul, RS, Brazil:
 * - Subtropical highland climate (Cfb), elevation ~800m
 * - Average temperature: 16.5°C, range: 1.1°C to 26.5°C
 * - Thresholds based on local percentile analysis (P10/P90)
 *
 * @param {object} weather - Weather data point with temp, humidity, precipitation
 * @returns {string} Comfort category: 'muggy' | 'hot' | 'cold' | 'mild' | 'humid' | 'rainy'
 */
function classifyComfortCondition(weather) {
  const { temperature, humidity, precipitation } = weather;

  // Rain trumps all other conditions
  if (precipitation > 5) return 'rainy';

  // Calculate heat index for hot conditions
  const heatIndex = calculateHeatIndex(temperature, humidity);

  // Classify by thermal comfort (priority order matters)
  // Thresholds adjusted for Caxias do Sul climate:
  if (heatIndex >= 27) return 'muggy';      // Abafado: feels >= 27°C (local: rarely reaches 32°C)
  if (temperature >= 23) return 'hot';       // Quente: >= 23°C (local P90, was 28°C)
  if (temperature <= 10) return 'cold';      // Frio: <= 10°C (local P10, was 12°C)
  if (humidity >= 80 && precipitation > 0) return 'humid';  // Úmido: high humidity + some precip
  return 'mild';                             // Ameno: 10-23°C comfortable baseline
}

/**
 * Classify forecast day for business impact display
 * SIMPLIFIED 3-CATEGORY SYSTEM for user-facing display
 *
 * @param {object} forecastDay - Forecast day from Visual Crossing API
 * @returns {string} Simplified category: 'rainy' | 'cold' | 'normal'
 */
export function classifyForecastDay(forecastDay) {
  const temp = forecastDay.temp || (forecastDay.tempMax + forecastDay.tempMin) / 2;
  const precipitation = forecastDay.precipitation || 0;
  const precipProb = forecastDay.precipProb || 0;

  // Priority: Rain > Cold > Normal
  // Rainy: significant precipitation or high probability
  if (precipitation > 5 || precipProb > 50) return 'rainy';
  // Cold: temperature at or below 12°C (adjusted for Caxias do Sul)
  if (temp <= 12) return 'cold';
  // Normal: everything else (mild, hot, muggy, humid)
  return 'normal';
}

/**
 * Calculate forecast day impact using Pearson regression
 * Uses actual temperature values + rain modifier, not static category averages
 *
 * Formula: impact = (forecastTemp - meanTemp) * percentPerDegree + rainBonus
 *
 * @param {object} forecastDay - Forecast day from Visual Crossing
 * @param {object} historicalImpact - From calculateComfortWeatherImpact
 * @returns {object} { impact: number|null, hasData: boolean }
 */
export function calculateForecastDayImpact(forecastDay, historicalImpact) {
  if (!historicalImpact?.hasEnoughData) {
    return { impact: null, hasData: false };
  }

  const tempCorr = historicalImpact.temperatureCorrelation;
  const cats = historicalImpact.categories;

  // Get forecast temperature (use avg or calculate from min/max)
  const forecastTemp = forecastDay.temp ||
    ((forecastDay.tempMax + forecastDay.tempMin) / 2);

  // Get precipitation info
  const precipitation = forecastDay.precipitation || 0;
  const precipProb = forecastDay.precipProb || 0;
  const isRainy = precipitation > 5 || precipProb > 50;

  // Base impact from temperature regression
  // Impact% = (forecastTemp - meanTemp) * percentPerDegree
  let impact = 0;

  if (tempCorr?.hasEnoughData && tempCorr.percentPerDegree) {
    const tempDiff = forecastTemp - tempCorr.meanTemperature;
    impact = tempDiff * tempCorr.percentPerDegree;
  }

  // Add rain bonus if rainy day (rain impact is independent of temperature)
  if (isRainy && cats?.rainy?.hasEnoughData && cats.rainy.impact !== null) {
    // Rain impact is % relative to baseline, add it on top
    impact += cats.rainy.impact;
  }

  return {
    impact: Math.round(impact * 10) / 10, // Round to 1 decimal
    hasData: tempCorr?.hasEnoughData || false
  };
}

/**
 * Calculate temperature-revenue correlation from all historical data
 * Uses ALL available data to find: "X% revenue change per 1°C temperature change"
 *
 * @param {Array} salesData - Sales records
 * @param {Array} weatherData - Weather records with temperature
 * @returns {object} Correlation data
 */
export function calculateTemperatureCorrelation(salesData, weatherData) {
  const records = parseSalesRecords(salesData);
  const weather = parseWeatherData(weatherData);

  if (records.length === 0 || weather.length === 0) {
    return { correlation: 0, percentPerDegree: 0, hasEnoughData: false };
  }

  // Create date -> weather map
  const weatherMap = new Map();
  weather.forEach(w => {
    const dateKey = formatDate(w.date);
    weatherMap.set(dateKey, w);
  });

  // Group sales by date and join with temperature
  const dailyData = new Map();

  records.forEach(record => {
    const dateKey = record.dateStr;
    const w = weatherMap.get(dateKey);

    if (w && w.temperature > 0) { // Only include days with valid temperature
      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, { revenue: 0, temperature: w.temperature });
      }
      dailyData.get(dateKey).revenue += record.netValue;
    }
  });

  const dataPoints = Array.from(dailyData.values());

  if (dataPoints.length < 30) {
    return {
      correlation: 0,
      percentPerDegree: 0,
      hasEnoughData: false,
      daysAnalyzed: dataPoints.length,
      message: 'Menos de 30 dias com dados de temperatura'
    };
  }

  // Calculate means
  const n = dataPoints.length;
  const meanRevenue = dataPoints.reduce((s, d) => s + d.revenue, 0) / n;
  const meanTemp = dataPoints.reduce((s, d) => s + d.temperature, 0) / n;

  // Calculate Pearson correlation and regression slope
  let sumXY = 0, sumX2 = 0, sumY2 = 0;

  dataPoints.forEach(d => {
    const xDiff = d.temperature - meanTemp;
    const yDiff = d.revenue - meanRevenue;
    sumXY += xDiff * yDiff;
    sumX2 += xDiff * xDiff;
    sumY2 += yDiff * yDiff;
  });

  // Pearson correlation coefficient (-1 to 1)
  const correlation = sumX2 > 0 && sumY2 > 0
    ? sumXY / Math.sqrt(sumX2 * sumY2)
    : 0;

  // Regression slope: revenue change per 1°C
  const slope = sumX2 > 0 ? sumXY / sumX2 : 0;

  // Convert to percentage: X% change per 1°C
  const percentPerDegree = meanRevenue > 0
    ? (slope / meanRevenue) * 100
    : 0;

  // Temperature range in data
  const temps = dataPoints.map(d => d.temperature);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);

  return {
    correlation: Math.round(correlation * 100) / 100,
    percentPerDegree: Math.round(percentPerDegree * 100) / 100,
    slope: Math.round(slope * 100) / 100, // R$ per 1°C
    meanRevenue: Math.round(meanRevenue),
    meanTemperature: Math.round(meanTemp * 10) / 10,
    temperatureRange: { min: minTemp, max: maxTemp },
    daysAnalyzed: n,
    hasEnoughData: true,
    // Interpretation
    interpretation: correlation < -0.3
      ? 'Forte correlação negativa: dias frios = mais receita'
      : correlation < -0.1
        ? 'Correlação negativa moderada: frio tende a aumentar receita'
        : correlation > 0.1
          ? 'Correlação positiva: calor tende a aumentar receita'
          : 'Sem correlação significativa com temperatura'
  };
}

/**
 * Calculate humidity-revenue correlation
 * @param {Array} salesData - Sales records
 * @param {Array} weatherData - Weather records
 * @returns {object} Humidity correlation data
 */
export function calculateHumidityCorrelation(salesData, weatherData) {
  const records = parseSalesRecords(salesData);
  const weather = parseWeatherData(weatherData);

  if (records.length === 0 || weather.length === 0) {
    return { correlation: 0, percentPerPercent: 0, hasEnoughData: false };
  }

  // Create date -> weather map
  const weatherMap = new Map();
  weather.forEach(w => {
    const dateKey = formatDate(w.date);
    weatherMap.set(dateKey, w);
  });

  // Group sales by date and join with humidity
  const dailyData = new Map();

  records.forEach(record => {
    const dateKey = record.dateStr;
    const w = weatherMap.get(dateKey);

    if (w && w.humidity > 0) {
      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, { revenue: 0, humidity: w.humidity });
      }
      dailyData.get(dateKey).revenue += record.netValue;
    }
  });

  const dataPoints = Array.from(dailyData.values());

  if (dataPoints.length < 30) {
    return {
      correlation: 0,
      percentPerPercent: 0,
      hasEnoughData: false,
      daysAnalyzed: dataPoints.length
    };
  }

  // Calculate means
  const n = dataPoints.length;
  const meanRevenue = dataPoints.reduce((s, d) => s + d.revenue, 0) / n;
  const meanHumidity = dataPoints.reduce((s, d) => s + d.humidity, 0) / n;

  // Calculate Pearson correlation
  let sumXY = 0, sumX2 = 0, sumY2 = 0;

  dataPoints.forEach(d => {
    const xDiff = d.humidity - meanHumidity;
    const yDiff = d.revenue - meanRevenue;
    sumXY += xDiff * yDiff;
    sumX2 += xDiff * xDiff;
    sumY2 += yDiff * yDiff;
  });

  const correlation = sumX2 > 0 && sumY2 > 0
    ? sumXY / Math.sqrt(sumX2 * sumY2)
    : 0;

  const slope = sumX2 > 0 ? sumXY / sumX2 : 0;
  const percentPerPercent = meanRevenue > 0
    ? (slope / meanRevenue) * 100
    : 0;

  return {
    correlation: Math.round(correlation * 100) / 100,
    percentPerPercent: Math.round(percentPerPercent * 100) / 100,
    meanHumidity: Math.round(meanHumidity),
    daysAnalyzed: n,
    hasEnoughData: true,
    interpretation: correlation > 0.15
      ? 'Correlação positiva: umidade alta tende a aumentar receita'
      : correlation < -0.15
        ? 'Correlação negativa: umidade alta tende a reduzir receita'
        : 'Sem correlação significativa com umidade'
  };
}

/**
 * Calculate comfort-based weather impact on business
 * Uses heat index classification instead of just precipitation
 * ✅ Replaces simple sunny/cloudy/rainy with thermal comfort categories
 * ✅ ADAPTIVE WINDOW: 90 days default, extends to 180 days for rare conditions
 *
 * @param {Array} salesData - Sales records
 * @param {Array} weatherData - Weather records
 * @returns {object} Comfort weather impact data
 */
export function calculateComfortWeatherImpact(salesData, weatherData) {
  const allRecords = parseSalesRecords(salesData);
  const weather = parseWeatherData(weatherData);

  const MIN_SAMPLE_DAYS = 3;
  const PRIMARY_WINDOW_DAYS = 90;
  const EXTENDED_WINDOW_DAYS = 180;

  // Create date -> weather map
  const weatherMap = new Map();
  weather.forEach(w => {
    const dateKey = formatDate(w.date);
    weatherMap.set(dateKey, w);
  });

  // Helper: Categorize records within a date range
  const categorizeRecords = (records, weatherMap) => {
    const salesByComfort = {
      muggy: [], hot: [], cold: [], mild: [], humid: [], rainy: []
    };
    const weatherByComfort = {
      muggy: [], hot: [], cold: [], mild: [], humid: [], rainy: []
    };

    records.forEach(record => {
      const dateKey = record.dateStr;
      const w = weatherMap.get(dateKey);

      if (w) {
        const condition = classifyComfortCondition(w);
        salesByComfort[condition].push(record);

        // Track unique days with weather data
        if (!weatherByComfort[condition].some(d => formatDate(d.date) === dateKey)) {
          weatherByComfort[condition].push(w);
        }
      }
    });

    return { salesByComfort, weatherByComfort };
  };

  // Helper: Calculate category averages
  const sum = (arr, fn) => arr.reduce((s, x) => s + fn(x), 0);

  const calculateCategoryAverage = (salesArray, weatherArray) => {
    if (salesArray.length === 0) return { revenue: 0, services: 0, days: 0, avgTemp: 0, avgHumidity: 0 };

    // Group by date
    const dayMap = new Map();
    salesArray.forEach(record => {
      const dateKey = record.dateStr;
      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, { revenue: 0, services: 0 });
      }
      const day = dayMap.get(dateKey);
      day.revenue += record.netValue;
      if (!record.isRecarga) {
        day.services += record.totalServices;
      }
    });

    const days = dayMap.size;
    const totalRevenue = sum(Array.from(dayMap.values()), d => d.revenue);
    const totalServices = sum(Array.from(dayMap.values()), d => d.services);

    // Calculate average weather for this category
    const avgTemp = weatherArray.length > 0
      ? weatherArray.reduce((s, w) => s + w.temperature, 0) / weatherArray.length
      : 0;
    const avgHumidity = weatherArray.length > 0
      ? weatherArray.reduce((s, w) => s + w.humidity, 0) / weatherArray.length
      : 0;

    return {
      revenue: days > 0 ? totalRevenue / days : 0,
      services: days > 0 ? totalServices / days : 0,
      days,
      avgTemp: Math.round(avgTemp * 10) / 10,
      avgHumidity: Math.round(avgHumidity)
    };
  };

  // --- PASS 1: Primary window (90 days) using Brazil timezone ---
  const nowParts = getBrazilDateParts();
  const primaryCutoff = new Date(nowParts.year, nowParts.month - 1, nowParts.day);
  primaryCutoff.setDate(primaryCutoff.getDate() - PRIMARY_WINDOW_DAYS);
  const primaryRecords = allRecords.filter(r => r.date >= primaryCutoff);
  const { salesByComfort: primarySales, weatherByComfort: primaryWeather } = categorizeRecords(primaryRecords, weatherMap);

  // Calculate primary categories
  const categoryKeys = ['muggy', 'hot', 'cold', 'mild', 'humid', 'rainy'];
  const categories = {};
  const extendedWindowUsed = {};

  categoryKeys.forEach(key => {
    categories[key] = calculateCategoryAverage(primarySales[key], primaryWeather[key]);
    extendedWindowUsed[key] = false;
  });

  // --- PASS 2: Extended window (180 days) for categories with insufficient data ---
  const extendedCutoff = new Date(nowParts.year, nowParts.month - 1, nowParts.day);
  extendedCutoff.setDate(extendedCutoff.getDate() - EXTENDED_WINDOW_DAYS);
  const extendedRecords = allRecords.filter(r => r.date >= extendedCutoff);
  const { salesByComfort: extendedSales, weatherByComfort: extendedWeather } = categorizeRecords(extendedRecords, weatherMap);

  categoryKeys.forEach(key => {
    if (categories[key].days < MIN_SAMPLE_DAYS) {
      const extendedResult = calculateCategoryAverage(extendedSales[key], extendedWeather[key]);
      // Only use extended if it actually provides more data
      if (extendedResult.days > categories[key].days) {
        categories[key] = extendedResult;
        extendedWindowUsed[key] = true;
      }
    }
  });

  // Determine baseline: prefer 'mild', then find category with most data
  let baselineKey = 'mild';
  if (categories.mild.days < MIN_SAMPLE_DAYS || categories.mild.revenue === 0) {
    // Find category with most sample days as fallback
    const fallbackKey = categoryKeys
      .filter(k => categories[k].days >= MIN_SAMPLE_DAYS && categories[k].revenue > 0)
      .sort((a, b) => categories[b].days - categories[a].days)[0];
    baselineKey = fallbackKey || 'mild';
  }
  const baselineRevenue = categories[baselineKey].revenue;

  // Calculate impact percentages relative to baseline
  const calculateImpact = (cat) => {
    if (cat.days < MIN_SAMPLE_DAYS || baselineRevenue === 0) return null;
    return ((cat.revenue - baselineRevenue) / baselineRevenue) * 100;
  };

  // Add impact to each category
  Object.keys(categories).forEach(key => {
    categories[key].impact = calculateImpact(categories[key]);
    categories[key].hasEnoughData = categories[key].days >= MIN_SAMPLE_DAYS;
  });

  // Find best and worst conditions
  const validCategories = Object.entries(categories)
    .filter(([_, cat]) => cat.hasEnoughData)
    .sort((a, b) => b[1].revenue - a[1].revenue);

  const bestCondition = validCategories.length > 0 ? validCategories[0][0] : 'mild';
  const worstCondition = validCategories.length > 0 ? validCategories[validCategories.length - 1][0] : 'rainy';

  // Calculate temperature and humidity correlations
  const tempCorrelation = calculateTemperatureCorrelation(salesData, weatherData);
  const humidityCorrelation = calculateHumidityCorrelation(salesData, weatherData);

  // Total days analyzed
  const totalDaysAnalyzed = Object.values(categories).reduce((s, c) => s + c.days, 0);

  // Labels and emojis for UI
  // Descriptions reflect Caxias do Sul-specific thresholds
  const categoryLabels = {
    muggy: { label: 'Abafado', emoji: '🥵', description: 'Quente e úmido (sensação ≥27°C)' },
    hot: { label: 'Quente', emoji: '☀️', description: 'Temperatura ≥23°C' },
    cold: { label: 'Frio', emoji: '❄️', description: 'Temperatura ≤10°C' },
    mild: { label: 'Ameno', emoji: '😌', description: 'Temperatura 10-23°C' },
    humid: { label: 'Úmido', emoji: '💧', description: 'Alta umidade (≥80%)' },
    rainy: { label: 'Chuvoso', emoji: '🌧️', description: 'Precipitação >5mm' }
  };

  // Enrich categories with labels and extended window flag
  Object.keys(categories).forEach(key => {
    categories[key] = {
      ...categories[key],
      ...categoryLabels[key],
      extendedWindow: extendedWindowUsed[key]
    };
  });

  // Count how many categories used extended window
  const extendedCategories = Object.entries(extendedWindowUsed)
    .filter(([_, used]) => used)
    .map(([key]) => categoryLabels[key]?.label || key);

  return {
    // Comfort-based categories
    categories,

    // Best/worst conditions
    bestCondition,
    worstCondition,
    bestCaseScenario: categories[bestCondition]?.revenue || 0,
    worstCaseScenario: categories[worstCondition]?.revenue || 0,

    // Correlations
    temperatureCorrelation: tempCorrelation,
    humidityCorrelation,

    // Context
    primaryWindowDays: PRIMARY_WINDOW_DAYS,
    extendedWindowDays: EXTENDED_WINDOW_DAYS,
    totalDaysAnalyzed,
    minSampleDays: MIN_SAMPLE_DAYS,
    baselineCondition: baselineKey,

    // Adaptive window info
    extendedWindowUsed: extendedCategories.length > 0,
    extendedCategories,

    // Data quality
    hasEnoughData: totalDaysAnalyzed >= 30,
    warning: totalDaysAnalyzed < 30
      ? `Dados limitados: apenas ${totalDaysAnalyzed} dias analisados nos últimos 90 dias`
      : extendedCategories.length > 0
        ? `${extendedCategories.join(', ')}: janela estendida (180 dias) por dados insuficientes`
        : null
  };
}
