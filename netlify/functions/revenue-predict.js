// netlify/functions/revenue-predict.js
// Revenue prediction using OLS regression with weather features
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
const MODEL_TIERS = {
  FULL: { minSamples: 60, features: 12, name: 'full' },      // All 12 features
  REDUCED: { minSamples: 30, features: 7, name: 'reduced' }, // Core 7 features
  MINIMAL: { minSamples: 14, features: 3, name: 'minimal' }, // intercept + lags only
  FALLBACK: { minSamples: 0, features: 1, name: 'fallback' } // Mean-only
};

// Feature names for each tier
const FEATURE_NAMES = {
  full: ['intercept', 'rev_lag_1', 'rev_lag_7', 'is_weekend', 'drying_pain',
         'is_rainy', 'heavy_rain', 'is_holiday', 'is_holiday_eve',
         'weekend_x_drying', 'weekend_x_rain', 'holiday_x_drying'],
  reduced: ['intercept', 'rev_lag_1', 'rev_lag_7', 'is_weekend', 'drying_pain', 'is_rainy', 'heavy_rain'],
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

  // Build training data (skip first 7 days for lags)
  const features = [];
  const revenues = [];

  for (let i = 7; i < dates.length; i++) {
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

    // Calculate features
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
      x = [
        1,                          // β₀ intercept
        revLag1,                    // β₁ yesterday's revenue
        revLag7,                    // β₂ same day last week
        isWknd ? 1 : 0,             // β₃ weekend indicator
        dryingPain,                 // β₄ drying pain index
        isRainy ? 1 : 0,            // β₅ rain indicator
        heavyRain ? 1 : 0,          // β₆ heavy rain indicator
        isHolidayFlag ? 1 : 0,      // β₇ holiday indicator
        isHolidayEveFlag ? 1 : 0,   // β₈ holiday eve indicator
        weekendXDrying,             // β₉ weekend × drying interaction
        weekendXRain,               // β₁₀ weekend × rain interaction
        holidayXDrying              // β₁₁ holiday × drying interaction
      ];
      featureObj = {
        rev_lag_1: revLag1,
        rev_lag_7: revLag7,
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
      x = [
        1, revLag1, revLag7,
        isWknd ? 1 : 0, dryingPain,
        isRainy ? 1 : 0, heavyRain ? 1 : 0
      ];
      featureObj = {
        rev_lag_1: revLag1,
        rev_lag_7: revLag7,
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
      const model = fitOLS(trainSet);
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
 * Save trained model to Supabase for caching
 * Called after on-the-fly training to avoid retraining on every request
 *
 * @param {Object} supabase - Supabase client
 * @param {Object} model - Trained model { beta, mae, rmse, rSquared, n, meanRevenue }
 * @param {string} tier - Model tier (full, reduced, minimal, fallback)
 * @param {Object} metadata - Additional metadata { trainingStart, trainingEnd }
 */
async function saveModelToCache(supabase, model, tier, metadata = {}) {
  try {
    const { error } = await supabase
      .from('model_coefficients')
      .upsert({
        id: 'revenue_prediction',
        beta: model.beta,
        feature_names: FEATURE_NAMES[tier] || [],
        mae: model.mae,
        rmse: model.rmse,
        r_squared: model.rSquared,
        n_training_samples: model.n,
        mean_revenue: model.meanRevenue,
        model_complexity: tier,
        trained_at: new Date().toISOString(),
        training_period_start: metadata.trainingStart || null,
        training_period_end: metadata.trainingEnd || null,
        optimal_training_days: TRAINING_DAYS,
        drying_pain_weights: { precip: 0.08, humidity: 0.03, sunDeficit: 0.20 }
      }, { onConflict: 'id' });

    if (error) {
      console.error('Failed to cache model:', error.message);
    } else {
      console.log('Model cached successfully');
    }
  } catch (saveError) {
    console.error('Error saving model to cache:', saveError.message);
  }
}

/**
 * Load trained model coefficients from Supabase
 * Falls back to on-the-fly training if no cached model or stale (>48h)
 * Saves the model to cache after training for faster subsequent requests
 *
 * @param {Object} supabase - Supabase client
 * @param {Array} trainingData - Pre-built training data for fallback
 * @param {string} tier - Model tier for saving
 * @param {Object} metadata - Additional metadata { trainingStart, trainingEnd }
 * @returns {Object} Model object with beta, mae, rSquared, etc.
 */
async function loadOrTrainModel(supabase, trainingData, tier = 'full', metadata = {}) {
  try {
    // Try to load cached coefficients
    const { data: cached, error } = await supabase
      .from('model_coefficients')
      .select('*')
      .eq('id', 'revenue_prediction')
      .single();

    if (error) {
      console.log('No cached model found, training on-the-fly...');
      const model = fitOLS(trainingData);
      await saveModelToCache(supabase, model, tier, metadata);
      return model;
    }

    // Check if cached model exists and has coefficients
    if (!cached || !cached.beta) {
      console.log('Cached model has no coefficients, training on-the-fly...');
      const model = fitOLS(trainingData);
      await saveModelToCache(supabase, model, tier, metadata);
      return model;
    }

    // Parse beta array
    let beta;
    try {
      beta = typeof cached.beta === 'string' ? JSON.parse(cached.beta) : cached.beta;
    } catch (parseError) {
      console.log('Failed to parse cached coefficients, training on-the-fly...');
      const model = fitOLS(trainingData);
      await saveModelToCache(supabase, model, tier, metadata);
      return model;
    }

    // Check if beta is valid
    if (!Array.isArray(beta) || beta.length === 0) {
      console.log('Invalid cached coefficients, training on-the-fly...');
      const model = fitOLS(trainingData);
      await saveModelToCache(supabase, model, tier, metadata);
      return model;
    }

    // Check if model is stale (>48 hours old)
    const trainedAt = new Date(cached.trained_at);
    const age = Date.now() - trainedAt.getTime();
    const maxAge = 48 * 60 * 60 * 1000; // 48 hours

    if (age > maxAge) {
      console.log(`Cached model is stale (${Math.round(age / 3600000)}h old), training on-the-fly...`);
      const model = fitOLS(trainingData);
      await saveModelToCache(supabase, model, tier, metadata);
      return model;
    }

    console.log(`Using cached model (trained ${Math.round(age / 3600000)}h ago, R²=${cached.r_squared})`);

    // Return cached model in the expected format
    // Include drift detection info from model_coefficients (set by campaign-scheduler)
    return {
      beta,
      mae: cached.mae || 0,
      rmse: cached.rmse || 0,
      rSquared: cached.r_squared || 0,
      n: cached.n_training_samples || 0,
      meanRevenue: cached.mean_revenue || 0,
      standardError: cached.mae ? Math.round(cached.mae * 1.25) : 100, // Approximate SE from MAE
      // Drift detection (populated by campaign-scheduler nightly)
      driftDetected: cached.drift_detected || false,
      driftRatio: cached.drift_ratio || null,
      oosMAE: cached.oos_mae || null,
      oosMAPE: cached.oos_mape || null
    };
  } catch (loadError) {
    console.warn('Error loading cached model:', loadError.message);
    console.log('Falling back to on-the-fly training...');
    const model = fitOLS(trainingData);
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
 */
function calculateWeatherImpact(beta, features, meanRevenue, tier = 'full') {
  let weatherContrib = 0;

  if (tier === 'full' && beta.length >= 12) {
    // Full model: β₄·drying + β₅·rain + β₆·heavy + β₇·holiday + β₈·eve + interactions
    weatherContrib =
      beta[4] * (features.drying_pain || 0) +
      beta[5] * (features.is_rainy ? 1 : 0) +
      beta[6] * (features.heavy_rain ? 1 : 0) +
      beta[7] * (features.is_holiday ? 1 : 0) +
      beta[8] * (features.is_holiday_eve ? 1 : 0) +
      beta[9] * (features.weekend_x_drying || 0) +
      beta[10] * (features.weekend_x_rain || 0) +
      beta[11] * (features.holiday_x_drying || 0);
  } else if (tier === 'reduced' && beta.length >= 7) {
    // Reduced model: β₄·drying + β₅·rain + β₆·heavy
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
    x = [
      1,                          // β₀ intercept
      revLag1,                    // β₁ yesterday
      revLag7,                    // β₂ last week
      isWknd ? 1 : 0,             // β₃ weekend
      dryingPain,                 // β₄ drying pain
      isRainy ? 1 : 0,            // β₅ rain
      heavyRain ? 1 : 0,          // β₆ heavy rain
      isHolidayFlag ? 1 : 0,      // β₇ holiday
      isHolidayEveFlag ? 1 : 0,   // β₈ holiday eve
      weekendXDrying,             // β₉ weekend × drying
      weekendXRain,               // β₁₀ weekend × rain
      holidayXDrying              // β₁₁ holiday × drying
    ];
    features = {
      rev_lag_1: Math.round(revLag1),
      rev_lag_7: Math.round(revLag7),
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
    x = [1, revLag1, revLag7, isWknd ? 1 : 0, dryingPain, isRainy ? 1 : 0, heavyRain ? 1 : 0];
    features = {
      rev_lag_1: Math.round(revLag1),
      rev_lag_7: Math.round(revLag7),
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
  const { data: revenue, error: revError } = await supabase
    .from('daily_revenue')
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
    model = {
      beta: [meanRev],
      mae: 0,
      rmse: 0,
      rSquared: 0,
      n: trainingData.length,
      meanRevenue: Math.round(meanRev),
      standardError: 0
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

  // Run walk-forward cross-validation for honest out-of-sample metrics
  // Skip every 3rd day to reduce computation time (stepSize = 3)
  let oosMetrics = null;
  if (tier !== 'fallback' && trainingData.length >= 40) {
    oosMetrics = walkForwardValidation(trainingData, 30, 3);
    if (oosMetrics) {
      console.log(`OOS validation: MAE=R$${oosMetrics.oosMAE}, MAPE=${oosMetrics.oosMAPE}%, bias=${oosMetrics.oosBias}, n=${oosMetrics.nPoints}`);
    }
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
      predictedRevenue = predict(model.beta, x);
      weatherImpact = calculateWeatherImpact(model.beta, features, model.meanRevenue, tier);
      // Calculate confidence interval (±1.96 * SE for 95% CI)
      margin = 1.96 * model.standardError;
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
      coefficients: model.beta.map(b => Math.round(b * 100) / 100),
      model_tier: tier,
      tier_message: tierMessage,

      // Out-of-sample metrics (prediction quality - THESE ARE THE HONEST METRICS)
      // Prefer cached OOS metrics from model_coefficients (more stable), fall back to computed
      oos_mae: model.oosMAE || oosMetrics?.oosMAE || null,
      oos_mape: model.oosMAPE || oosMetrics?.oosMAPE || null,
      oos_bias: oosMetrics?.oosBias || null,
      oos_validation_points: oosMetrics?.nPoints || null,

      // Drift detection (populated by campaign-scheduler nightly)
      drift_detected: model.driftDetected || false,
      drift_ratio: model.driftRatio || null,

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

// ============== NETLIFY HANDLER ==============

exports.handler = async (event, context) => {
  console.log('Revenue prediction triggered');

  // Base CORS headers
  const corsOrigin = getCorsOrigin(event);
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
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
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
