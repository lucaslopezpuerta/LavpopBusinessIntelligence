// netlify/functions/revenue-predict.js
// Revenue prediction using Ridge regression with weather features
//
// v4.2 (2026-01-23): Empirically-calibrated prediction intervals
//   - Replaced statistical SE_pred with empirical percentage-based intervals
//   - Calibrated to achieve ~80% coverage (was 94% with 186% width)
//   - Now: 76% coverage with 100% width (±50% of prediction)
//   - Min R$80, max R$350 bounds based on error percentiles
//
// v4.1 (2026-01-23): Enhanced feature engineering
//   - Added 7-day moving average (trend capture)
//   - Added 14-day revenue volatility
//   - Added cyclical day-of-week encoding (sin/cos)
//   - OOS metrics cached at training time (not prediction time)
//   - Full model now has 16 features (was 12)
//
// v4.0 (2026-01-20): Ridge regression & schema consolidation
//   - Replace OLS with Ridge regression (L2 regularization) for stability
//   - Add z-score feature standardization to handle scale differences
//   - Add outlier winsorization (cap extreme values)
//   - Lambda selection via 5-fold cross-validation
//   - Model storage consolidated to app_settings.revenue_model
//   - Removed dependency on model_coefficients table
//
// v3.0 (2026-01-20): Prediction tracking & validation
//   - Save predictions to revenue_predictions table for accuracy tracking
//   - Walk-forward cross-validation for honest out-of-sample metrics
//   - Configurable drying pain weights (preparing for optimization)
//   - Return OOS MAE/MAPE alongside in-sample metrics
//
// v2.0 (2025-12-21): Enhanced features & data quality
//   - Brazilian holiday detection (fixed + Easter-based moveable)
//   - Interaction terms: weekend×drying, weekend×rain, holiday×drying
//   - Data quality tracking: missing weather, outliers, fallbacks
//   - Tiered model complexity based on sample count
//   - IQR-based outlier detection (flagged, not removed)
//
// v1.2 (2025-12-21): Cached model coefficients
//   - Loads trained coefficients from model_coefficients table
//   - Falls back to on-the-fly training if no cached model (>48h old)
//   - Scheduled training runs at midnight via campaign-scheduler.js
//
// v1.1 (2025-12-21): Use total_revenue instead of service_revenue
//   - total_revenue = service_revenue + recarga_revenue (full daily cash flow)
//
// v1.0 (2025-12-21): Initial implementation
//   - Time-aware OLS regression model
//   - Features: rev_lag_1, rev_lag_7, is_weekend, drying_pain, rain indicators
//
// Model formula (FULL - 12 features):
// Revenueₜ = β₀ + β₁·Revₜ₋₁ + β₂·Revₜ₋₇ + β₃·is_weekend + β₄·drying_pain
//          + β₅·is_rainy + β₆·heavy_rain + β₇·is_holiday + β₈·is_holiday_eve
//          + β₉·(weekend×drying) + β₁₀·(weekend×rain) + β₁₁·(holiday×drying)
//
// Based on WeatherImpactPrediction.md methodology

const { createClient } = require('@supabase/supabase-js');
const { isHoliday, isHolidayEve, isClosedDay } = require('./lib/brazilHolidays');

// Configuration
const BUSINESS_TIMEZONE = 'America/Sao_Paulo';
const TRAINING_DAYS = 365; // Use all available data (up to 1 year)
const MIN_TRAINING_SAMPLES = 14; // Absolute minimum for any prediction

// Tiered model complexity thresholds
// More data = more features = better accuracy
// v4.1: Full model now has 16 features, reduced has 8
const MODEL_TIERS = {
  FULL: { minSamples: 60, features: 16, name: 'full' },     // All 16 features (v4.1)
  REDUCED: { minSamples: 30, features: 8, name: 'reduced' }, // Core 8 features
  MINIMAL: { minSamples: 14, features: 3, name: 'minimal' }, // intercept + lags only
  FALLBACK: { minSamples: 0, features: 1, name: 'fallback' } // Mean-only
};

// Feature names for each tier
// v4.1: Added trend features (rev_ma_7, rev_volatility) and day-of-week cyclical encoding
const FEATURE_NAMES = {
  full: ['intercept', 'rev_lag_1', 'rev_lag_7', 'rev_ma_7', 'rev_volatility',
         'dow_sin', 'dow_cos', 'is_weekend', 'drying_pain',
         'is_rainy', 'heavy_rain', 'is_holiday', 'is_holiday_eve',
         'weekend_x_drying', 'weekend_x_rain', 'holiday_x_drying'],
  reduced: ['intercept', 'rev_lag_1', 'rev_lag_7', 'rev_ma_7', 'is_weekend', 'drying_pain', 'is_rainy', 'heavy_rain'],
  minimal: ['intercept', 'rev_lag_1', 'rev_lag_7'],
  fallback: ['intercept']
};

// Default drying pain weights (can be optimized via grid search)
const DEFAULT_DRYING_WEIGHTS = {
  humidity: 0.03,
  precip: 0.08,
  sunDeficit: 0.20
};

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
 * Get current date in São Paulo timezone (YYYY-MM-DD)
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
 * Get day of week from date string (Mon=0, Sun=6)
 */
function getDayOfWeek(dateStr) {
  const date = new Date(dateStr + 'T12:00:00Z');
  return (date.getUTCDay() + 6) % 7; // Convert Sun=0 to Mon=0
}

/**
 * Check if date is weekend (Sat=5, Sun=6)
 */
function isWeekend(dateStr) {
  const dow = getDayOfWeek(dateStr);
  return dow >= 5;
}

/**
 * Calculate cyclical day-of-week encoding
 * Uses sin/cos transformation to capture cyclical nature of weekdays
 * This allows the model to understand that Sunday is close to Monday
 *
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {Object} { dowSin, dowCos } values in range [-1, 1]
 */
function getDayOfWeekCyclical(dateStr) {
  const dow = getDayOfWeek(dateStr); // 0=Mon, 6=Sun
  const angle = (2 * Math.PI * dow) / 7;
  return {
    dowSin: Math.sin(angle),
    dowCos: Math.cos(angle)
  };
}

/**
 * Calculate 7-day moving average of revenue
 *
 * @param {Object} revenueMap - Map of date -> revenue
 * @param {Array} dates - Sorted array of dates
 * @param {number} currentIndex - Current date index in dates array
 * @returns {number} 7-day moving average (or null if insufficient data)
 */
function calculate7DayMA(revenueMap, dates, currentIndex) {
  if (currentIndex < 7) return null;

  let sum = 0;
  let count = 0;
  for (let i = currentIndex - 7; i < currentIndex; i++) {
    const rev = revenueMap[dates[i]];
    if (rev !== undefined && rev > 0) {
      sum += rev;
      count++;
    }
  }

  return count >= 5 ? sum / count : null; // Require at least 5 of 7 days
}

/**
 * Calculate revenue volatility (standard deviation over past 14 days)
 * Higher volatility indicates less predictable revenue patterns
 *
 * @param {Object} revenueMap - Map of date -> revenue
 * @param {Array} dates - Sorted array of dates
 * @param {number} currentIndex - Current date index in dates array
 * @returns {number} Standard deviation of revenue (or null if insufficient data)
 */
function calculateVolatility(revenueMap, dates, currentIndex) {
  if (currentIndex < 14) return null;

  const values = [];
  for (let i = currentIndex - 14; i < currentIndex; i++) {
    const rev = revenueMap[dates[i]];
    if (rev !== undefined && rev > 0) {
      values.push(rev);
    }
  }

  if (values.length < 10) return null; // Require at least 10 of 14 days

  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

// ============== FEATURE ENGINEERING ==============

/**
 * Calculate Drying Pain Index
 * Measures how hard it is to dry clothes outdoors
 * Higher values = more customers come to laundromat
 *
 * Formula: w.humidity * humidity + w.precip * precipitation + w.sunDeficit * sunDeficit
 *
 * @param {Object} weather - Weather data object
 * @param {Object} weights - Weight coefficients { humidity, precip, sunDeficit }
 * @returns {number} Drying pain index value
 */
function calculateDryingPain(weather, weights = DEFAULT_DRYING_WEIGHTS) {
  const humidity = parseFloat(weather.humidity_avg) || 60;
  const precip = parseFloat(weather.precipitation) || 0;
  const cloudCover = parseFloat(weather.cloud_cover) || 50;

  // Estimate sun hours from cloud cover (max 8 hours of useful sun)
  const sunHoursEst = Math.max(0, 8 - (cloudCover / 100) * 8);
  const sunDeficit = Math.max(0, 8 - sunHoursEst);

  return weights.humidity * humidity + weights.precip * precip + weights.sunDeficit * sunDeficit;
}

/**
 * Classify weather category for display
 */
function classifyWeatherCategory(weather) {
  const precip = parseFloat(weather.precipitation) || 0;
  const precipProb = parseFloat(weather.precip_probability) || 0;
  const temp = parseFloat(weather.temp_avg) || 20;

  if (precip > 5 || precipProb > 50) return 'rainy';
  if (temp <= 12) return 'cold';
  return 'normal';
}

/**
 * Detect outliers using IQR method
 * Returns { isOutlier, bounds: { lower, upper } }
 */
function detectOutliers(values) {
  if (values.length < 4) return { outlierIndices: [], bounds: null };

  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;

  const outlierIndices = [];
  values.forEach((v, i) => {
    if (v < lower || v > upper) outlierIndices.push(i);
  });

  return { outlierIndices, bounds: { lower, upper, q1, q3, iqr } };
}

/**
 * Build feature matrix for training
 * Joins revenue data with weather data by date
 * Returns { features, dataQuality }
 *
 * @param {Array} revenueRows - Revenue data rows
 * @param {Array} weatherRows - Weather data rows
 * @param {Object} options - Options { tier, dryingPainWeights }
 * @returns {Object} { features, dataQuality }
 */
function buildTrainingFeatures(revenueRows, weatherRows, options = {}) {
  const { tier = 'full', dryingPainWeights = DEFAULT_DRYING_WEIGHTS } = options;

  // Create date-keyed maps
  const revenueMap = {};
  revenueRows.forEach(r => {
    revenueMap[r.date] = parseFloat(r.total_revenue) || 0;
  });

  const weatherMap = {};
  weatherRows.forEach(w => {
    weatherMap[w.date] = w;
  });

  // Sort dates
  const dates = Object.keys(revenueMap).sort();

  // Data quality tracking
  const dataQuality = {
    totalDays: dates.length,
    missingWeather: 0,
    missingLags: 0,
    usableDays: 0,
    outlierCount: 0,
    fallbacksUsed: 0,
    holidaysInRange: 0
  };

  // Build training data (skip first 14 days for lags and moving averages)
  // Need 14 days for volatility calculation
  const features = [];
  const revenues = [];
  const minStartIndex = tier === 'full' ? 14 : 7; // Full tier needs more history

  for (let i = minStartIndex; i < dates.length; i++) {
    const date = dates[i];
    const w = weatherMap[date];

    // Track missing weather
    if (!w) {
      dataQuality.missingWeather++;
      continue;
    }

    const revenue = revenueMap[date];
    const revLag1 = revenueMap[dates[i - 1]];
    const revLag7 = revenueMap[dates[i - 7]];

    // Track missing lags
    if (revLag1 === undefined || revLag1 === 0 ||
        revLag7 === undefined || revLag7 === 0) {
      dataQuality.missingLags++;
      continue;
    }

    // Calculate enhanced features (v4.1)
    const revMA7 = calculate7DayMA(revenueMap, dates, i);
    const revVolatility = calculateVolatility(revenueMap, dates, i);
    const { dowSin, dowCos } = getDayOfWeekCyclical(date);

    // Skip if required features missing for full tier
    if (tier === 'full' && (revMA7 === null || revVolatility === null)) {
      dataQuality.missingLags++;
      continue;
    }

    // Calculate weather features
    const dryingPain = calculateDryingPain(w, dryingPainWeights);
    const precip = parseFloat(w.precipitation) || 0;
    const isWknd = isWeekend(date);
    const isRainy = precip >= 2;
    const heavyRain = precip >= 10;

    // Holiday features
    const holidayInfo = isHoliday(date);
    const holidayEveInfo = isHolidayEve(date);
    const isHolidayFlag = holidayInfo.isHoliday;
    const isHolidayEveFlag = holidayEveInfo.isHolidayEve;

    if (isHolidayFlag) dataQuality.holidaysInRange++;

    // Interaction terms
    const weekendXDrying = isWknd ? dryingPain : 0;
    const weekendXRain = (isWknd && isRainy) ? 1 : 0;
    const holidayXDrying = isHolidayFlag ? dryingPain : 0;

    // Build feature vector based on tier
    let x, featureObj;

    if (tier === 'full') {
      // v4.1: Enhanced feature set with trend and cyclical encoding
      x = [
        1,                          // β₀ intercept
        revLag1,                    // β₁ yesterday's revenue
        revLag7,                    // β₂ same day last week
        revMA7,                     // β₃ 7-day moving average (trend)
        revVolatility,              // β₄ 14-day volatility
        dowSin,                     // β₅ day-of-week sin component
        dowCos,                     // β₆ day-of-week cos component
        isWknd ? 1 : 0,             // β₇ weekend indicator
        dryingPain,                 // β₈ drying pain index
        isRainy ? 1 : 0,            // β₉ rain indicator
        heavyRain ? 1 : 0,          // β₁₀ heavy rain indicator
        isHolidayFlag ? 1 : 0,      // β₁₁ holiday indicator
        isHolidayEveFlag ? 1 : 0,   // β₁₂ holiday eve indicator
        weekendXDrying,             // β₁₃ weekend × drying interaction
        weekendXRain,               // β₁₄ weekend × rain interaction
        holidayXDrying              // β₁₅ holiday × drying interaction
      ];
      featureObj = {
        rev_lag_1: revLag1,
        rev_lag_7: revLag7,
        rev_ma_7: Math.round(revMA7),
        rev_volatility: Math.round(revVolatility),
        dow_sin: Math.round(dowSin * 1000) / 1000,
        dow_cos: Math.round(dowCos * 1000) / 1000,
        is_weekend: isWknd,
        drying_pain: Math.round(dryingPain * 100) / 100,
        is_rainy: isRainy,
        heavy_rain: heavyRain,
        is_holiday: isHolidayFlag,
        holiday_name: holidayInfo.name,
        is_holiday_eve: isHolidayEveFlag,
        holiday_eve_name: holidayEveInfo.holidayName,
        weekend_x_drying: Math.round(weekendXDrying * 100) / 100,
        weekend_x_rain: weekendXRain,
        holiday_x_drying: Math.round(holidayXDrying * 100) / 100
      };
    } else if (tier === 'reduced') {
      // v4.1: Added 7-day MA for reduced tier
      x = [
        1, revLag1, revLag7,
        revMA7 || revLag7, // Fallback to lag7 if MA not available
        isWknd ? 1 : 0, dryingPain,
        isRainy ? 1 : 0, heavyRain ? 1 : 0
      ];
      featureObj = {
        rev_lag_1: revLag1,
        rev_lag_7: revLag7,
        rev_ma_7: Math.round(revMA7 || revLag7),
        is_weekend: isWknd,
        drying_pain: Math.round(dryingPain * 100) / 100,
        is_rainy: isRainy,
        heavy_rain: heavyRain
      };
    } else if (tier === 'minimal') {
      x = [1, revLag1, revLag7];
      featureObj = { rev_lag_1: revLag1, rev_lag_7: revLag7 };
    } else {
      // fallback: just intercept
      x = [1];
      featureObj = {};
    }

    features.push({
      date,
      y: revenue,
      x,
      features: featureObj
    });
    revenues.push(revenue);
  }

  // Outlier detection on revenues
  if (revenues.length >= 4) {
    const { outlierIndices } = detectOutliers(revenues);
    dataQuality.outlierCount = outlierIndices.length;
    // Flag outliers (don't remove - model is more robust with data)
    outlierIndices.forEach(idx => {
      if (features[idx]) features[idx].isOutlier = true;
    });
  }

  dataQuality.usableDays = features.length;

  return { features, dataQuality };
}

// ============== OLS REGRESSION (Pure JS) ==============

/**
 * Matrix transpose
 */
function transpose(A) {
  const rows = A.length;
  const cols = A[0].length;
  const T = [];

  for (let j = 0; j < cols; j++) {
    T[j] = [];
    for (let i = 0; i < rows; i++) {
      T[j][i] = A[i][j];
    }
  }

  return T;
}

/**
 * Matrix multiplication
 */
function multiply(A, B) {
  const rowsA = A.length;
  const colsA = A[0].length;
  const colsB = B[0].length;
  const C = [];

  for (let i = 0; i < rowsA; i++) {
    C[i] = [];
    for (let j = 0; j < colsB; j++) {
      let sum = 0;
      for (let k = 0; k < colsA; k++) {
        sum += A[i][k] * B[k][j];
      }
      C[i][j] = sum;
    }
  }

  return C;
}

/**
 * Matrix-vector multiplication
 */
function multiplyMV(A, v) {
  const rows = A.length;
  const cols = A[0].length;
  const result = [];

  for (let i = 0; i < rows; i++) {
    let sum = 0;
    for (let j = 0; j < cols; j++) {
      sum += A[i][j] * v[j];
    }
    result[i] = sum;
  }

  return result;
}

/**
 * Matrix inversion using Gaussian elimination
 * For small matrices (7x7 in our case)
 */
function invert(A) {
  const n = A.length;

  // Create augmented matrix [A | I]
  const aug = [];
  for (let i = 0; i < n; i++) {
    aug[i] = [...A[i]];
    for (let j = 0; j < n; j++) {
      aug[i][n + j] = i === j ? 1 : 0;
    }
  }

  // Gaussian elimination with partial pivoting
  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) {
        maxRow = row;
      }
    }

    // Swap rows
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    // Check for singular matrix
    if (Math.abs(aug[col][col]) < 1e-10) {
      throw new Error('Matrix is singular or nearly singular');
    }

    // Scale pivot row
    const pivot = aug[col][col];
    for (let j = 0; j < 2 * n; j++) {
      aug[col][j] /= pivot;
    }

    // Eliminate column
    for (let row = 0; row < n; row++) {
      if (row !== col) {
        const factor = aug[row][col];
        for (let j = 0; j < 2 * n; j++) {
          aug[row][j] -= factor * aug[col][j];
        }
      }
    }
  }

  // Extract inverse from right side
  const inv = [];
  for (let i = 0; i < n; i++) {
    inv[i] = aug[i].slice(n);
  }

  return inv;
}

/**
 * Fit OLS regression model
 * β = (X'X)^(-1) X'y
 *
 * Returns: { beta, mae, rSquared, rmse, n }
 */
function fitOLS(data) {
  const n = data.length;
  const p = data[0].x.length;

  // Build X matrix and y vector
  const X = data.map(d => d.x);
  const y = data.map(d => d.y);

  // Calculate X'X
  const Xt = transpose(X);
  const XtX = multiply(Xt, X);

  // Calculate (X'X)^(-1)
  const XtX_inv = invert(XtX);

  // Calculate X'y
  const Xty = multiplyMV(Xt, y);

  // Calculate beta = (X'X)^(-1) X'y
  const beta = multiplyMV(XtX_inv, Xty);

  // Calculate predictions and residuals
  const yHat = data.map(d => {
    let pred = 0;
    for (let j = 0; j < p; j++) {
      pred += beta[j] * d.x[j];
    }
    return pred;
  });

  // Calculate metrics
  const meanY = y.reduce((s, v) => s + v, 0) / n;

  let ssRes = 0;  // Sum of squared residuals
  let ssTot = 0;  // Total sum of squares
  let absErrors = [];

  for (let i = 0; i < n; i++) {
    const residual = y[i] - yHat[i];
    ssRes += residual * residual;
    ssTot += (y[i] - meanY) * (y[i] - meanY);
    absErrors.push(Math.abs(residual));
  }

  const rSquared = 1 - (ssRes / ssTot);
  const rmse = Math.sqrt(ssRes / n);
  const mae = absErrors.reduce((s, v) => s + v, 0) / n;

  // Calculate standard error for confidence intervals
  const mse = ssRes / (n - p);
  const se = Math.sqrt(mse);

  return {
    beta,
    mae: Math.round(mae),
    rmse: Math.round(rmse),
    rSquared: Math.round(rSquared * 1000) / 1000,
    n,
    meanRevenue: Math.round(meanY),
    standardError: Math.round(se)
  };
}

/**
 * Make prediction using trained model
 */
function predict(beta, x) {
  let pred = 0;
  for (let j = 0; j < beta.length; j++) {
    pred += beta[j] * x[j];
  }
  return pred;
}

// ============== FEATURE STANDARDIZATION ==============

/**
 * Standardize features using z-score normalization
 * z = (x - mean) / std
 *
 * Note: Intercept column (index 0) is NOT standardized
 *
 * @param {Array} data - Training data array with { x: features, y: target }
 * @returns {Object} { scaledData, scaler: { means, stds } }
 */
function standardizeFeatures(data) {
  const n = data.length;
  const p = data[0].x.length;

  // Initialize means and stds (keep intercept as-is)
  const means = new Array(p).fill(0);
  const stds = new Array(p).fill(1);

  // Calculate means (skip intercept at index 0)
  for (let j = 1; j < p; j++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += data[i].x[j];
    }
    means[j] = sum / n;
  }

  // Calculate standard deviations
  for (let j = 1; j < p; j++) {
    let sumSq = 0;
    for (let i = 0; i < n; i++) {
      sumSq += Math.pow(data[i].x[j] - means[j], 2);
    }
    stds[j] = Math.sqrt(sumSq / n);
    // Avoid division by zero for constant features
    if (stds[j] < 1e-10) stds[j] = 1;
  }

  // Scale the data
  const scaledData = data.map(d => {
    const scaledX = d.x.map((val, j) => {
      if (j === 0) return 1; // Keep intercept as 1
      return (val - means[j]) / stds[j];
    });
    return { ...d, x: scaledX };
  });

  return {
    scaledData,
    scaler: { means, stds }
  };
}

/**
 * Apply saved scaler to new prediction features
 * Used when making predictions after training
 */
function applyScaler(x, scaler) {
  if (!scaler || !scaler.means || !scaler.stds) return x;

  return x.map((val, j) => {
    if (j === 0) return 1; // Keep intercept
    return (val - scaler.means[j]) / scaler.stds[j];
  });
}

/**
 * Back-transform standardized coefficients to original scale for display
 *
 * When features are standardized (z-score), coefficients are in "per standard deviation" units.
 * To make them interpretable, we divide by the feature's std to get "per original unit".
 *
 * For lag features (rev_lag_1, rev_lag_7): coefficient / std gives "per R$1 of revenue"
 * For binary features (is_weekend, etc): coefficient stays as-is (effect in R$)
 *
 * @param {Array} beta - Standardized coefficients
 * @param {Object} scaler - Scaler with { means, stds }
 * @param {Array} featureNames - Feature names for context
 * @returns {Array} Coefficients in original scale
 */
function backTransformCoefficients(beta, scaler, featureNames = []) {
  if (!scaler || !scaler.stds) return beta;

  return beta.map((b, j) => {
    if (j === 0) return b; // Intercept stays as-is

    const std = scaler.stds[j];
    if (!std || std < 1e-10) return b;

    // For lag features (rev_lag_1, rev_lag_7), divide by std to get per-R$ coefficient
    // For binary/small-range features, the std is small so effect is preserved
    return b / std;
  });
}

// ============== OUTLIER HANDLING ==============

/**
 * Winsorize revenue values to cap extreme outliers
 * Replaces values outside [Q1-1.5*IQR, Q3+1.5*IQR] with boundary values
 * This preserves sample size while reducing outlier influence
 *
 * @param {Array} data - Training data with { y: revenue, ... }
 * @returns {Array} Data with winsorized y values
 */
function winsorizeRevenue(data) {
  const revenues = data.map(d => d.y);
  const sorted = [...revenues].sort((a, b) => a - b);

  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;

  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;

  return data.map(d => ({
    ...d,
    y: Math.max(lower, Math.min(upper, d.y)),
    originalY: d.y,
    wasWinsorized: d.y < lower || d.y > upper
  }));
}

// ============== RIDGE REGRESSION ==============

/**
 * Fit Ridge regression model with L2 regularization
 * beta = (X'X + lambda*I)^(-1) X'y
 *
 * Ridge regression handles multicollinearity by shrinking correlated
 * coefficient estimates toward zero, producing more stable predictions.
 *
 * @param {Array} data - Training data with { x: features, y: target }
 * @param {number} lambda - Regularization strength (0.01 to 10.0 typical)
 * @returns {Object} { beta, mae, rSquared, rmse, n, standardError, lambda, XtX_inv }
 */
function fitRidge(data, lambda = 1.0) {
  const n = data.length;
  const p = data[0].x.length;

  // Build X matrix and y vector
  const X = data.map(d => d.x);
  const y = data.map(d => d.y);

  // Calculate X'X
  const Xt = transpose(X);
  const XtX = multiply(Xt, X);

  // Add lambda to diagonal (except intercept at position 0)
  // This is the Ridge penalty: (X'X + lambda*I)
  for (let i = 1; i < p; i++) {
    XtX[i][i] += lambda;
  }

  // Calculate (X'X + lambda*I)^(-1)
  const XtX_inv = invert(XtX);

  // Calculate X'y
  const Xty = multiplyMV(Xt, y);

  // Calculate beta = (X'X + lambda*I)^(-1) X'y
  const beta = multiplyMV(XtX_inv, Xty);

  // Calculate predictions and residuals
  const yHat = data.map(d => {
    let pred = 0;
    for (let j = 0; j < p; j++) {
      pred += beta[j] * d.x[j];
    }
    return pred;
  });

  // Calculate metrics
  const meanY = y.reduce((s, v) => s + v, 0) / n;

  let ssRes = 0;  // Sum of squared residuals
  let ssTot = 0;  // Total sum of squares
  let absErrors = [];

  for (let i = 0; i < n; i++) {
    const residual = y[i] - yHat[i];
    ssRes += residual * residual;
    ssTot += (y[i] - meanY) * (y[i] - meanY);
    absErrors.push(Math.abs(residual));
  }

  const rSquared = 1 - (ssRes / ssTot);
  const rmse = Math.sqrt(ssRes / n);
  const mae = absErrors.reduce((s, v) => s + v, 0) / n;

  // Calculate standard error for confidence intervals
  // MSE = SSRes / (n - p) is the unbiased estimator of residual variance
  const mse = ssRes / (n - p);
  const se = Math.sqrt(mse);

  return {
    beta,
    mae: Math.round(mae),
    rmse: Math.round(rmse),
    rSquared: Math.round(rSquared * 1000) / 1000,
    n,
    p, // Number of parameters (for degrees of freedom)
    meanRevenue: Math.round(meanY),
    standardError: Math.round(se),
    mse, // Keep raw MSE for prediction intervals
    lambda,
    XtX_inv // Keep for calculating prediction standard errors
  };
}

/**
 * Calculate prediction standard error for a new observation
 * SE_pred = sqrt(MSE * (1 + x' * (X'X)^-1 * x))
 *
 * This gives the standard error for an individual prediction,
 * accounting for both estimation uncertainty and residual variance.
 *
 * @param {Array} x - Feature vector for new observation
 * @param {number} mse - Mean squared error from training
 * @param {Array} XtX_inv - Inverse of (X'X + lambda*I) from training
 * @returns {number} Standard error for this prediction
 */
function calculatePredictionSE(x, mse, XtX_inv) {
  if (!XtX_inv || !mse) return null;

  // Calculate x' * (X'X)^-1 * x (quadratic form)
  // First: (X'X)^-1 * x
  const XtX_inv_x = multiplyMV(XtX_inv, x);

  // Then: x' * (X'X)^-1 * x (dot product)
  let quadForm = 0;
  for (let i = 0; i < x.length; i++) {
    quadForm += x[i] * XtX_inv_x[i];
  }

  // SE_pred = sqrt(MSE * (1 + x'(X'X)^-1 x))
  // The "1" accounts for residual variance, quadForm for estimation uncertainty
  const variance = mse * (1 + quadForm);
  return Math.sqrt(variance);
}

/**
 * Select optimal lambda via k-fold cross-validation
 * Tests multiple lambda values and returns the one with lowest CV error
 *
 * @param {Array} data - Scaled training data
 * @param {number} k - Number of folds (default 5)
 * @returns {Object} { lambda, cvMAE }
 */
function selectLambdaCV(data, k = 5) {
  const lambdas = [0.01, 0.1, 0.5, 1.0, 2.0, 5.0, 10.0];
  const n = data.length;
  const foldSize = Math.floor(n / k);

  let bestLambda = 1.0;
  let bestMAE = Infinity;

  for (const lambda of lambdas) {
    let totalMAE = 0;
    let validFolds = 0;

    for (let fold = 0; fold < k; fold++) {
      const testStart = fold * foldSize;
      const testEnd = Math.min(testStart + foldSize, n);

      const trainData = [...data.slice(0, testStart), ...data.slice(testEnd)];
      const testData = data.slice(testStart, testEnd);

      if (trainData.length < 10 || testData.length === 0) continue;

      try {
        const model = fitRidge(trainData, lambda);

        // Calculate MAE on test fold
        let foldMAE = 0;
        for (const d of testData) {
          const pred = predict(model.beta, d.x);
          foldMAE += Math.abs(d.y - pred);
        }
        totalMAE += foldMAE / testData.length;
        validFolds++;
      } catch (e) {
        // Skip if model fails
        continue;
      }
    }

    if (validFolds > 0) {
      const avgMAE = totalMAE / validFolds;
      if (avgMAE < bestMAE) {
        bestMAE = avgMAE;
        bestLambda = lambda;
      }
    }
  }

  return { lambda: bestLambda, cvMAE: Math.round(bestMAE) };
}

/**
 * Walk-forward cross-validation for honest out-of-sample metrics
 * Uses expanding window: train on days 1..t, predict day t+1
 * This provides realistic estimates of prediction accuracy
 *
 * @param {Array} trainingData - Array of { x, y } training samples
 * @param {number} minTrainSize - Minimum samples before starting validation
 * @param {number} stepSize - Step between validation points (1 = every day)
 * @returns {Object|null} { oosMAE, oosMAPE, oosBias, nPoints } or null if insufficient data
 */
function walkForwardValidation(trainingData, minTrainSize = 30, stepSize = 1) {
  const errors = [];
  const absErrors = [];
  const pctErrors = [];

  // Need at least minTrainSize days before we can validate
  for (let t = minTrainSize; t < trainingData.length; t += stepSize) {
    // Train on days 0..t-1
    const trainSet = trainingData.slice(0, t);

    // Test on day t
    const testPoint = trainingData[t];

    try {
      const model = fitRidge(trainSet, 1.0);
      const predicted = predict(model.beta, testPoint.x);
      const actual = testPoint.y;

      const error = actual - predicted;
      errors.push(error);
      absErrors.push(Math.abs(error));
      if (actual > 0) {
        pctErrors.push(Math.abs(error / actual) * 100);
      }
    } catch (e) {
      // Skip if model fails (e.g., singular matrix with too few samples)
      continue;
    }
  }

  // Need at least 10 validation points for meaningful metrics
  if (absErrors.length < 10) {
    return null;
  }

  // Calculate out-of-sample metrics
  const oosMAE = absErrors.reduce((a, b) => a + b, 0) / absErrors.length;
  const oosMAPE = pctErrors.length > 0
    ? pctErrors.reduce((a, b) => a + b, 0) / pctErrors.length
    : 0;
  const oosBias = errors.reduce((a, b) => a + b, 0) / errors.length;

  return {
    oosMAE: Math.round(oosMAE),
    oosMAPE: Math.round(oosMAPE * 10) / 10,
    oosBias: Math.round(oosBias),
    nPoints: absErrors.length
  };
}

/**
 * Save trained model to Supabase app_settings.revenue_model
 * Called after on-the-fly training to avoid retraining on every request
 *
 * @param {Object} supabase - Supabase client
 * @param {Object} model - Trained model { beta, mae, rmse, rSquared, n, meanRevenue, scaler, lambda, XtX_inv, mse }
 * @param {string} tier - Model tier (full, reduced, minimal, fallback)
 * @param {Object} metadata - Additional metadata { trainingStart, trainingEnd }
 */
async function saveModelToCache(supabase, model, tier, metadata = {}) {
  try {
    const revenueModel = {
      beta: model.beta,
      feature_names: FEATURE_NAMES[tier] || [],
      mae: model.mae,
      rmse: model.rmse,
      r_squared: model.rSquared,
      n_training_samples: model.n,
      n_parameters: model.p || model.beta.length,
      mean_revenue: model.meanRevenue,
      model_complexity: tier,
      trained_at: new Date().toISOString(),
      training_period_start: metadata.trainingStart || null,
      training_period_end: metadata.trainingEnd || null,
      // Ridge-specific fields
      regression_type: 'ridge',
      lambda: model.lambda || 1.0,
      scaler: model.scaler || null,
      // Prediction interval components (for proper statistical intervals)
      mse: model.mse || null,
      XtX_inv: model.XtX_inv || null,
      // OOS metrics (cached at training time - Priority 5)
      oos_mae: model.oosMAE || null,
      oos_mape: model.oosMAPE || null,
      oos_bias: model.oosBias || null,
      oos_points: model.oosPoints || null
    };

    const { error } = await supabase
      .from('app_settings')
      .update({ revenue_model: revenueModel })
      .eq('id', 1);

    if (error) {
      console.error('Failed to cache model:', error.message);
    } else {
      console.log('Model cached to app_settings.revenue_model');
    }
  } catch (saveError) {
    console.error('Error saving model to cache:', saveError.message);
  }
}

/**
 * Train a new Ridge regression model with the full pipeline:
 * 1. Winsorize outliers
 * 2. Standardize features (z-score)
 * 3. Select optimal lambda via CV
 * 4. Fit Ridge regression
 * 5. Run walk-forward validation for OOS metrics
 *
 * @param {Array} trainingData - Raw training data
 * @returns {Object} Trained model with { beta, scaler, lambda, XtX_inv, mse, ... }
 */
function trainRidgeModel(trainingData) {
  // Step 1: Winsorize outliers
  const winsorizedData = winsorizeRevenue(trainingData);
  const winsorizedCount = winsorizedData.filter(d => d.wasWinsorized).length;
  if (winsorizedCount > 0) {
    console.log(`Winsorized ${winsorizedCount} outliers`);
  }

  // Step 2: Standardize features
  const { scaledData, scaler } = standardizeFeatures(winsorizedData);

  // Step 3: Select optimal lambda via cross-validation
  const { lambda, cvMAE } = selectLambdaCV(scaledData, 5);
  console.log(`Selected lambda=${lambda} via CV (CV MAE=R$${cvMAE})`);

  // Step 4: Fit Ridge regression with selected lambda
  const model = fitRidge(scaledData, lambda);

  // Step 5: Run walk-forward validation for OOS metrics (cache at training time)
  let oosMetrics = null;
  if (scaledData.length >= 40) {
    oosMetrics = walkForwardValidation(scaledData, 30, 3);
    if (oosMetrics) {
      console.log(`Training OOS: MAE=R$${oosMetrics.oosMAE}, MAPE=${oosMetrics.oosMAPE}%`);
    }
  }

  // Return model with scaler and prediction interval components
  return {
    ...model,
    scaler,
    lambda,
    winsorizedCount,
    // OOS metrics computed at training time (Priority 5: cache during training)
    oosMAE: oosMetrics?.oosMAE || null,
    oosMAPE: oosMetrics?.oosMAPE || null,
    oosBias: oosMetrics?.oosBias || null,
    oosPoints: oosMetrics?.nPoints || null
  };
}

/**
 * Load trained model from app_settings.revenue_model
 * Falls back to on-the-fly training if no cached model or stale (>48h)
 * Uses Ridge regression with feature standardization
 *
 * @param {Object} supabase - Supabase client
 * @param {Array} trainingData - Pre-built training data for fallback
 * @param {string} tier - Model tier for saving
 * @param {Object} metadata - Additional metadata { trainingStart, trainingEnd }
 * @returns {Object} Model object with beta, scaler, mae, rSquared, etc.
 */
async function loadOrTrainModel(supabase, trainingData, tier = 'full', metadata = {}) {
  try {
    // Try to load cached model from app_settings.revenue_model
    const { data: appSettings, error } = await supabase
      .from('app_settings')
      .select('revenue_model')
      .eq('id', 1)
      .single();

    if (error) {
      console.log('Failed to load app_settings:', error.message);
      console.log('Training new Ridge model...');
      const model = trainRidgeModel(trainingData);
      await saveModelToCache(supabase, model, tier, metadata);
      return model;
    }

    const cached = appSettings?.revenue_model;

    // Check if cached model exists and has coefficients
    if (!cached || !cached.beta) {
      console.log('No cached model in app_settings.revenue_model, training...');
      const model = trainRidgeModel(trainingData);
      await saveModelToCache(supabase, model, tier, metadata);
      return model;
    }

    // Parse beta array
    let beta;
    try {
      beta = typeof cached.beta === 'string' ? JSON.parse(cached.beta) : cached.beta;
    } catch (parseError) {
      console.log('Failed to parse cached coefficients, training...');
      const model = trainRidgeModel(trainingData);
      await saveModelToCache(supabase, model, tier, metadata);
      return model;
    }

    // Check if beta is valid
    if (!Array.isArray(beta) || beta.length === 0) {
      console.log('Invalid cached coefficients, training...');
      const model = trainRidgeModel(trainingData);
      await saveModelToCache(supabase, model, tier, metadata);
      return model;
    }

    // Check if model is stale (>48 hours old)
    const trainedAt = new Date(cached.trained_at);
    const age = Date.now() - trainedAt.getTime();
    const maxAge = 48 * 60 * 60 * 1000; // 48 hours

    if (age > maxAge) {
      console.log(`Cached model is stale (${Math.round(age / 3600000)}h old), training...`);
      const model = trainRidgeModel(trainingData);
      await saveModelToCache(supabase, model, tier, metadata);
      return model;
    }

    // Check if cached model uses Ridge (not old OLS)
    if (cached.regression_type !== 'ridge') {
      console.log('Cached model is OLS, upgrading to Ridge...');
      const model = trainRidgeModel(trainingData);
      await saveModelToCache(supabase, model, tier, metadata);
      return model;
    }

    console.log(`Using cached Ridge model (trained ${Math.round(age / 3600000)}h ago, λ=${cached.lambda}, R²=${cached.r_squared})`);

    // Return cached model in the expected format
    return {
      beta,
      mae: cached.mae || 0,
      rmse: cached.rmse || 0,
      rSquared: cached.r_squared || 0,
      n: cached.n_training_samples || 0,
      p: cached.n_parameters || beta.length,
      meanRevenue: cached.mean_revenue || 0,
      standardError: cached.mae ? Math.round(cached.mae * 1.25) : 100,
      // Ridge-specific
      scaler: cached.scaler || null,
      lambda: cached.lambda || 1.0,
      regressionType: cached.regression_type || 'ridge',
      // Prediction interval components
      mse: cached.mse || null,
      XtX_inv: cached.XtX_inv || null,
      // OOS metrics (cached at training time)
      oosMAE: cached.oos_mae || null,
      oosMAPE: cached.oos_mape || null,
      oosBias: cached.oos_bias || null,
      oosPoints: cached.oos_points || null
    };
  } catch (loadError) {
    console.warn('Error loading cached model:', loadError.message);
    console.log('Falling back to on-the-fly Ridge training...');
    const model = trainRidgeModel(trainingData);
    await saveModelToCache(supabase, model, tier, metadata);
    return model;
  }
}

/**
 * Determine appropriate model tier based on sample count
 */
function selectModelTier(sampleCount) {
  if (sampleCount >= MODEL_TIERS.FULL.minSamples) return 'full';
  if (sampleCount >= MODEL_TIERS.REDUCED.minSamples) return 'reduced';
  if (sampleCount >= MODEL_TIERS.MINIMAL.minSamples) return 'minimal';
  return 'fallback';
}

/**
 * Get tier message for frontend display
 */
function getTierMessage(tier) {
  const messages = {
    full: null,
    reduced: 'Modelo simplificado (poucos dados)',
    minimal: 'Modelo mínimo (dados insuficientes)',
    fallback: 'Usando média histórica'
  };
  return messages[tier] || null;
}

/**
 * Save prediction to database for later accuracy tracking
 * Called when generating predictions to enable comparison with actual outcomes
 *
 * @param {Object} supabase - Supabase client
 * @param {Object} prediction - Prediction object with date, predicted_revenue, etc.
 * @param {string} tier - Model tier used
 * @param {number} inSampleR2 - In-sample R-squared for reference
 */
async function savePrediction(supabase, prediction, tier, inSampleR2 = null) {
  try {
    const { error } = await supabase
      .from('revenue_predictions')
      .upsert({
        prediction_date: prediction.date,
        predicted_revenue: prediction.predicted_revenue,
        confidence_low: prediction.confidence_low,
        confidence_high: prediction.confidence_high,
        model_tier: tier,
        in_sample_r_squared: inSampleR2,
        features: prediction.features
      }, { onConflict: 'prediction_date' });

    if (error) {
      console.warn(`Failed to save prediction for ${prediction.date}:`, error.message);
    }
  } catch (err) {
    // Non-blocking - prediction still works even if saving fails
    console.warn('Error saving prediction:', err.message);
  }
}

/**
 * Load recent prediction accuracy metrics from database
 *
 * @param {Object} supabase - Supabase client
 * @returns {Object|null} { avgMae, avgMape, predictions } or null if no data
 */
async function loadPredictionAccuracy(supabase) {
  try {
    const { data, error } = await supabase
      .from('prediction_accuracy')
      .select('*')
      .single();

    if (error || !data) return null;

    return {
      avgMae: data.avg_mae,
      avgMape: data.avg_mape,
      medianAe: data.median_ae,
      maeStd: data.mae_std,
      totalPredictions: data.total_predictions
    };
  } catch (err) {
    console.warn('Error loading prediction accuracy:', err.message);
    return null;
  }
}

/**
 * Calculate weather contribution to prediction
 * Shows how much weather features affect the prediction vs baseline
 * Supports different model tiers
 * v4.1: Updated indices for new feature set (16 features in full tier)
 */
function calculateWeatherImpact(beta, features, meanRevenue, tier = 'full') {
  let weatherContrib = 0;

  if (tier === 'full' && beta.length >= 16) {
    // Full model v4.1 (16 features):
    // β₈·drying + β₉·rain + β₁₀·heavy + β₁₁·holiday + β₁₂·eve + β₁₃·wknd×dry + β₁₄·wknd×rain + β₁₅·hol×dry
    weatherContrib =
      beta[8] * (features.drying_pain || 0) +
      beta[9] * (features.is_rainy ? 1 : 0) +
      beta[10] * (features.heavy_rain ? 1 : 0) +
      beta[11] * (features.is_holiday ? 1 : 0) +
      beta[12] * (features.is_holiday_eve ? 1 : 0) +
      beta[13] * (features.weekend_x_drying || 0) +
      beta[14] * (features.weekend_x_rain || 0) +
      beta[15] * (features.holiday_x_drying || 0);
  } else if (tier === 'full' && beta.length >= 12) {
    // Legacy full model (12 features) - backward compatibility
    weatherContrib =
      beta[4] * (features.drying_pain || 0) +
      beta[5] * (features.is_rainy ? 1 : 0) +
      beta[6] * (features.heavy_rain ? 1 : 0) +
      beta[7] * (features.is_holiday ? 1 : 0) +
      beta[8] * (features.is_holiday_eve ? 1 : 0) +
      beta[9] * (features.weekend_x_drying || 0) +
      beta[10] * (features.weekend_x_rain || 0) +
      beta[11] * (features.holiday_x_drying || 0);
  } else if (tier === 'reduced' && beta.length >= 8) {
    // Reduced model v4.1 (8 features): β₅·drying + β₆·rain + β₇·heavy
    weatherContrib =
      beta[5] * (features.drying_pain || 0) +
      beta[6] * (features.is_rainy ? 1 : 0) +
      beta[7] * (features.heavy_rain ? 1 : 0);
  } else if (tier === 'reduced' && beta.length >= 7) {
    // Legacy reduced model (7 features) - backward compatibility
    weatherContrib =
      beta[4] * (features.drying_pain || 0) +
      beta[5] * (features.is_rainy ? 1 : 0) +
      beta[6] * (features.heavy_rain ? 1 : 0);
  }
  // minimal/fallback have no weather features

  // Convert to percentage of mean revenue
  return meanRevenue > 0 ? (weatherContrib / meanRevenue) * 100 : 0;
}

// ============== PREDICTION LOGIC ==============

/**
 * Build prediction features for future days
 * Uses recursive prediction for lag features
 * Supports different model tiers
 * v4.1: Added trend features (7-day MA, volatility) and cyclical day-of-week
 */
function buildPredictionFeatures(forecastWeather, recentRevenue, dayIndex, previousPredictions, tier = 'full') {
  const date = forecastWeather.date;

  // Get lag features
  // For day 0: use actual recent revenue
  // For day 1+: use mix of actual and predicted
  let revLag1, revLag7;

  if (dayIndex === 0) {
    // Yesterday's actual revenue (total_revenue = service + recarga)
    revLag1 = recentRevenue[0]?.total_revenue || recentRevenue[0] || 0;
    revLag7 = recentRevenue[6]?.total_revenue || recentRevenue[6] || 0;
  } else {
    // Use previous prediction for lag1
    revLag1 = previousPredictions[dayIndex - 1]?.predicted_revenue || revLag1;

    // For lag7, mix actual and predicted
    if (dayIndex < 7) {
      revLag7 = recentRevenue[6 - dayIndex]?.total_revenue || recentRevenue[6 - dayIndex] || 0;
    } else {
      revLag7 = previousPredictions[dayIndex - 7]?.predicted_revenue || revLag7;
    }
  }

  // Parse revenue values if they're objects
  revLag1 = typeof revLag1 === 'object' ? parseFloat(revLag1.total_revenue) || 0 : parseFloat(revLag1) || 0;
  revLag7 = typeof revLag7 === 'object' ? parseFloat(revLag7.total_revenue) || 0 : parseFloat(revLag7) || 0;

  // Calculate 7-day moving average from recent revenue
  // Use actual historical data for day 0, blend with predictions for later days
  let revMA7 = 0;
  let maValues = [];
  for (let i = 0; i < 7 && i < recentRevenue.length; i++) {
    const val = recentRevenue[i]?.total_revenue || recentRevenue[i] || 0;
    if (typeof val === 'number' && val > 0) {
      maValues.push(val);
    }
  }
  // Add predictions for days that have already been predicted
  for (let i = 0; i < dayIndex && i < 7 - maValues.length; i++) {
    if (previousPredictions[i]?.predicted_revenue > 0) {
      maValues.push(previousPredictions[i].predicted_revenue);
    }
  }
  revMA7 = maValues.length > 0 ? maValues.reduce((s, v) => s + v, 0) / maValues.length : revLag7;

  // Calculate volatility from recent revenue (simplified for prediction)
  // Use standard deviation of last 14 days (or available data)
  let revVolatility = 0;
  let volValues = [];
  for (let i = 0; i < 14 && i < recentRevenue.length; i++) {
    const val = recentRevenue[i]?.total_revenue || recentRevenue[i] || 0;
    if (typeof val === 'number' && val > 0) {
      volValues.push(val);
    }
  }
  if (volValues.length >= 5) {
    const mean = volValues.reduce((s, v) => s + v, 0) / volValues.length;
    const variance = volValues.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / volValues.length;
    revVolatility = Math.sqrt(variance);
  }

  // Cyclical day-of-week encoding
  const { dowSin, dowCos } = getDayOfWeekCyclical(date);

  const dryingPain = calculateDryingPain(forecastWeather);
  const precip = parseFloat(forecastWeather.precipitation) || 0;
  const isWknd = isWeekend(date);
  const isRainy = precip >= 2;
  const heavyRain = precip >= 10;

  // Holiday detection for forecast days
  const holidayInfo = isHoliday(date);
  const holidayEveInfo = isHolidayEve(date);
  const isHolidayFlag = holidayInfo.isHoliday;
  const isHolidayEveFlag = holidayEveInfo.isHolidayEve;

  // Interaction terms
  const weekendXDrying = isWknd ? dryingPain : 0;
  const weekendXRain = (isWknd && isRainy) ? 1 : 0;
  const holidayXDrying = isHolidayFlag ? dryingPain : 0;

  // Build feature vector based on tier
  let x, features;

  if (tier === 'full') {
    // v4.1: Enhanced feature set with trend and cyclical encoding
    x = [
      1,                          // β₀ intercept
      revLag1,                    // β₁ yesterday
      revLag7,                    // β₂ last week
      revMA7,                     // β₃ 7-day moving average
      revVolatility,              // β₄ 14-day volatility
      dowSin,                     // β₅ day-of-week sin
      dowCos,                     // β₆ day-of-week cos
      isWknd ? 1 : 0,             // β₇ weekend
      dryingPain,                 // β₈ drying pain
      isRainy ? 1 : 0,            // β₉ rain
      heavyRain ? 1 : 0,          // β₁₀ heavy rain
      isHolidayFlag ? 1 : 0,      // β₁₁ holiday
      isHolidayEveFlag ? 1 : 0,   // β₁₂ holiday eve
      weekendXDrying,             // β₁₃ weekend × drying
      weekendXRain,               // β₁₄ weekend × rain
      holidayXDrying              // β₁₅ holiday × drying
    ];
    features = {
      rev_lag_1: Math.round(revLag1),
      rev_lag_7: Math.round(revLag7),
      rev_ma_7: Math.round(revMA7),
      rev_volatility: Math.round(revVolatility),
      dow_sin: Math.round(dowSin * 1000) / 1000,
      dow_cos: Math.round(dowCos * 1000) / 1000,
      is_weekend: isWknd,
      drying_pain: Math.round(dryingPain * 100) / 100,
      is_rainy: isRainy,
      heavy_rain: heavyRain,
      is_holiday: isHolidayFlag,
      holiday_name: holidayInfo.name,
      is_holiday_eve: isHolidayEveFlag,
      holiday_eve_name: holidayEveInfo.holidayName,
      weekend_x_drying: Math.round(weekendXDrying * 100) / 100,
      weekend_x_rain: weekendXRain,
      holiday_x_drying: Math.round(holidayXDrying * 100) / 100
    };
  } else if (tier === 'reduced') {
    // v4.1: Added 7-day MA for reduced tier
    x = [1, revLag1, revLag7, revMA7, isWknd ? 1 : 0, dryingPain, isRainy ? 1 : 0, heavyRain ? 1 : 0];
    features = {
      rev_lag_1: Math.round(revLag1),
      rev_lag_7: Math.round(revLag7),
      rev_ma_7: Math.round(revMA7),
      is_weekend: isWknd,
      drying_pain: Math.round(dryingPain * 100) / 100,
      is_rainy: isRainy,
      heavy_rain: heavyRain
    };
  } else if (tier === 'minimal') {
    x = [1, revLag1, revLag7];
    features = {
      rev_lag_1: Math.round(revLag1),
      rev_lag_7: Math.round(revLag7)
    };
  } else {
    // fallback
    x = [1];
    features = {};
  }

  return { x, features };
}

/**
 * Generate predictions for next 7 days
 */
async function generatePredictions(supabase) {
  const today = getLocalDate(0);
  const trainingStart = getLocalDate(-TRAINING_DAYS);
  const forecastEnd = getLocalDate(7);

  console.log(`Training period: ${trainingStart} to ${today}`);
  console.log(`Forecast period: ${today} to ${forecastEnd}`);

  // Fetch historical revenue data (total_revenue = service + recarga)
  // Uses mv_daily_revenue materialized view for better performance
  const { data: revenue, error: revError } = await supabase
    .from('mv_daily_revenue')
    .select('date, total_revenue')
    .gte('date', trainingStart)
    .lte('date', today)
    .order('date');

  if (revError) throw new Error(`Failed to fetch revenue: ${revError.message}`);

  console.log(`Fetched ${revenue?.length || 0} revenue records`);

  // Fetch historical weather data
  const { data: weatherData, error: weatherError } = await supabase
    .from('weather_daily_metrics')
    .select('date, temp_avg, humidity_avg, precipitation, cloud_cover, precip_probability, conditions, icon')
    .gte('date', trainingStart)
    .lte('date', today)
    .order('date');

  if (weatherError) throw new Error(`Failed to fetch weather: ${weatherError.message}`);
  console.log(`Fetched ${weatherData?.length || 0} weather records`);

  // Fetch forecast weather (next 7 days)
  const { data: forecastData, error: forecastError } = await supabase
    .from('weather_daily_metrics')
    .select('date, temp_avg, humidity_avg, precipitation, cloud_cover, precip_probability, conditions, icon')
    .gte('date', today)
    .lte('date', forecastEnd)
    .order('date');

  if (forecastError) throw new Error(`Failed to fetch forecast: ${forecastError.message}`);
  console.log(`Fetched ${forecastData?.length || 0} forecast records`);

  // Determine model tier based on available data
  // First pass: check how many usable samples we'll have
  const initialBuild = buildTrainingFeatures(revenue, weatherData, { tier: 'full' });
  const sampleCount = initialBuild.features.length;
  const tier = selectModelTier(sampleCount);

  console.log(`Sample count: ${sampleCount}, Selected tier: ${tier}`);

  // Build training features with appropriate tier
  const { features: trainingData, dataQuality } = buildTrainingFeatures(
    revenue,
    weatherData,
    { tier }
  );

  console.log(`Built ${trainingData.length} training samples (tier: ${tier})`);
  console.log(`Data quality:`, JSON.stringify(dataQuality));

  // Check for absolute minimum
  if (trainingData.length < MIN_TRAINING_SAMPLES) {
    return {
      success: false,
      error: `Insufficient training data: ${trainingData.length} samples (need ${MIN_TRAINING_SAMPLES})`,
      predictions: [],
      data_quality: dataQuality,
      model_tier: 'none'
    };
  }

  // For fallback tier, just use mean
  let model;
  if (tier === 'fallback') {
    const meanRev = trainingData.reduce((s, d) => s + d.y, 0) / trainingData.length;
    // Calculate MAE for fallback model (how far is each day from mean)
    const fallbackMAE = trainingData.reduce((s, d) => s + Math.abs(d.y - meanRev), 0) / trainingData.length;
    model = {
      beta: [meanRev],
      mae: Math.round(fallbackMAE),
      rmse: 0,
      rSquared: 0,
      n: trainingData.length,
      meanRevenue: Math.round(meanRev),
      standardError: Math.round(fallbackMAE * 1.25)
    };
  } else {
    // Load cached model or train on-the-fly (and save to cache)
    const trainingMetadata = {
      trainingStart,
      trainingEnd: today
    };
    model = await loadOrTrainModel(supabase, trainingData, tier, trainingMetadata);
  }

  console.log(`Model ready: R²=${model.rSquared}, MAE=R$${model.mae}, tier=${tier}`);

  // OOS metrics are now computed at training time (Priority 5 optimization)
  // No need to run walk-forward validation at prediction time
  if (model.oosMAE) {
    console.log(`Using cached OOS metrics: MAE=R$${model.oosMAE}, MAPE=${model.oosMAPE}%`);
  }

  // Load historical prediction accuracy from tracked predictions
  const predictionAccuracy = await loadPredictionAccuracy(supabase);
  if (predictionAccuracy) {
    console.log(`Historical accuracy (30d): MAE=R$${predictionAccuracy.avgMae}, MAPE=${predictionAccuracy.avgMape}%`);
  }

  // Get recent revenue for lag features
  const recentRevenue = revenue.slice(-8).reverse(); // Last 8 days, newest first

  // Generate predictions
  const predictions = [];

  for (let i = 0; i < forecastData.length && i < 7; i++) {
    const forecastDay = forecastData[i];
    const { x, features } = buildPredictionFeatures(
      forecastDay,
      recentRevenue,
      i,
      predictions,
      tier
    );

    // Check if this is a closed day (laundromat not operating)
    const closedInfo = isClosedDay(forecastDay.date);

    let predictedRevenue, weatherImpact, margin;

    if (closedInfo.isClosed) {
      // Closed day: override with R$0
      predictedRevenue = 0;
      weatherImpact = 0;
      margin = 0;
    } else {
      // Apply scaler to features before prediction (Ridge model)
      const scaledX = model.scaler ? applyScaler(x, model.scaler) : x;
      predictedRevenue = predict(model.beta, scaledX);
      weatherImpact = calculateWeatherImpact(model.beta, features, model.meanRevenue, tier);

      // Calculate prediction interval using empirically-calibrated approach
      // Based on historical backfill analysis (578 predictions, 2024-05 to 2026-01):
      //   - Median absolute error: R$114
      //   - 75th percentile: R$203, 80th: R$225, 90th: R$327
      //   - Median MAPE: 31%, 75th pctile: 53%, 90th: 100%
      //
      // Target ~80% coverage - a practical balance between accuracy and usefulness

      // Use empirically-calibrated percentage-based intervals
      // These values are set to achieve ~80% coverage based on historical analysis
      const marginPercent = {
        full: 0.50,     // ±50% for full model (~80% coverage from MAPE analysis)
        reduced: 0.55,  // ±55% for reduced model
        minimal: 0.65,  // ±65% for minimal model
        fallback: 0.75  // ±75% for fallback (mean only)
      }[tier] || 0.55;

      margin = predictedRevenue * marginPercent;

      // Apply reasonable bounds:
      // - Minimum R$80 for low predictions (covers median error of R$114)
      // - Maximum R$350 (covers 90th percentile of R$327)
      margin = Math.max(80, Math.min(margin, 350));
    }

    // Build prediction object
    const predictionObj = {
      date: forecastDay.date,
      predicted_revenue: Math.round(Math.max(0, predictedRevenue)),
      confidence_low: Math.round(Math.max(0, predictedRevenue - margin)),
      confidence_high: Math.round(predictedRevenue + margin),
      weather_impact_pct: Math.round(weatherImpact * 10) / 10,
      category: classifyWeatherCategory(forecastDay),
      conditions: forecastDay.conditions,
      icon: forecastDay.icon,
      features
    };

    // Add closed day info
    if (closedInfo.isClosed) {
      predictionObj.is_closed = true;
      predictionObj.closed_reason = closedInfo.reason;
    }

    // Add holiday info if present
    if (features.is_holiday) {
      predictionObj.holiday_name = features.holiday_name;
    }
    if (features.is_holiday_eve) {
      predictionObj.holiday_eve_name = features.holiday_eve_name;
    }

    predictions.push(predictionObj);

    // Save today's prediction for accuracy tracking (only first day = today)
    if (i === 0 && !closedInfo.isClosed) {
      await savePrediction(supabase, predictionObj, tier, model.rSquared);
    }
  }

  // Build response
  const tierMessage = getTierMessage(tier);

  return {
    success: true,
    predictions,
    model_info: {
      // In-sample metrics (fitting quality)
      r_squared: model.rSquared,
      mae: model.mae,
      rmse: model.rmse,
      n_training_samples: model.n,
      mean_daily_revenue: model.meanRevenue,
      last_trained: new Date().toISOString(),
      feature_names: FEATURE_NAMES[tier],
      // Back-transform coefficients from standardized to original scale for display
      coefficients: backTransformCoefficients(model.beta, model.scaler, FEATURE_NAMES[tier])
        .map(b => Math.round(b * 100) / 100),
      model_tier: tier,
      tier_message: tierMessage,

      // Ridge regression parameters
      regression_type: model.regressionType || 'ridge',
      lambda: model.lambda || null,
      standardized: model.scaler ? true : false,

      // Prediction interval method
      // 'statistical' = proper SE_pred calculation, 'percentage' = fallback
      interval_method: (model.mse && model.XtX_inv) ? 'statistical' : 'percentage',

      // Out-of-sample metrics (prediction quality - THESE ARE THE HONEST METRICS)
      // Cached at training time for performance (Priority 5)
      oos_mae: model.oosMAE || null,
      oos_mape: model.oosMAPE || null,
      oos_bias: model.oosBias || null,
      oos_validation_points: model.oosPoints || null,

      // Historical tracking (actual vs predicted from past predictions)
      tracked_mae: predictionAccuracy?.avgMae || null,
      tracked_mape: predictionAccuracy?.avgMape || null,
      tracked_predictions: predictionAccuracy?.totalPredictions || 0
    },
    data_quality: dataQuality
  };
}

// ============== CORS CONFIGURATION ==============

const ALLOWED_ORIGINS = [
  'https://bilavnova.com',
  'https://www.bilavnova.com',
  'https://localhost',           // Capacitor Android
  'capacitor://localhost',       // Capacitor iOS
  'http://localhost:5173',       // Local dev (Vite)
  'http://localhost:5174',       // Local dev alt port
  'http://localhost:8888'        // Netlify dev
];

function getCorsOrigin(event) {
  const origin = event.headers.origin || event.headers.Origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  return 'https://www.bilavnova.com';
}

function validateApiKey(event) {
  const apiKey = event.headers['x-api-key'] || event.headers['X-Api-Key'];
  const API_SECRET = process.env.API_SECRET_KEY;
  if (!API_SECRET) {
    console.error('SECURITY: API_SECRET_KEY not configured. All requests denied.');
    return false;
  }
  return apiKey === API_SECRET;
}

// ============== NETLIFY HANDLER ==============

exports.handler = async (event, context) => {
  console.log('Revenue prediction triggered');

  // Base CORS headers
  const corsOrigin = getCorsOrigin(event);
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (!validateApiKey(event)) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: 'Unauthorized' })
    };
  }

  try {
    const supabase = getSupabase();
    const result = await generatePredictions(supabase);

    // Only cache successful responses
    const headers = {
      ...corsHeaders,
      'Cache-Control': result.success ? 'public, max-age=3600' : 'no-cache'
    };

    return {
      statusCode: result.success ? 200 : 400,
      headers,
      body: JSON.stringify({
        ...result,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Prediction error:', error);

    // Never cache errors
    const errorHeaders = {
      ...corsHeaders,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    };

    return {
      statusCode: 500,
      headers: errorHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Prediction service temporarily unavailable',
        timestamp: new Date().toISOString()
      })
    };
  }
};
