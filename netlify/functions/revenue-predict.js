// netlify/functions/revenue-predict.js
// Revenue prediction using OLS regression with weather features
//
// v1.2 (2025-12-21): Cached model coefficients
//   - Loads trained coefficients from model_coefficients table
//   - Falls back to on-the-fly training if no cached model (>48h old)
//   - Scheduled training runs at midnight via campaign-scheduler.js
//   - Fixed: Removed invalid .catch() on Supabase query builder
//   - Fixed: Error responses now have no-cache headers (prevent browser caching 500s)
//
// v1.1 (2025-12-21): Use total_revenue instead of service_revenue
//   - total_revenue = service_revenue + recarga_revenue (full daily cash flow)
//   - service_revenue was only ~12% of daily take, missing recarga top-ups
//
// v1.0 (2025-12-21): Initial implementation
//   - Time-aware OLS regression model
//   - Features: rev_lag_1, rev_lag_7, is_weekend, drying_pain, rain indicators
//   - Returns 7-day predictions with confidence intervals
//
// Model formula:
// Revenueₜ = β₀ + β₁·Revₜ₋₁ + β₂·Revₜ₋₇ + β₃·is_weekend + β₄·drying_pain + β₅·is_rainy + β₆·heavy_rain
//
// Based on WeatherImpactPrediction.md methodology

const { createClient } = require('@supabase/supabase-js');

// Configuration
const BUSINESS_TIMEZONE = 'America/Sao_Paulo';
const TRAINING_DAYS = 90; // Use last 90 days for training
const MIN_TRAINING_SAMPLES = 30; // Minimum samples required

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
 * Formula: 0.03 * humidity + 0.08 * precipitation + 0.20 * (8 - sun_hours_est)
 */
function calculateDryingPain(weather) {
  const humidity = parseFloat(weather.humidity_avg) || 60;
  const precip = parseFloat(weather.precipitation) || 0;
  const cloudCover = parseFloat(weather.cloud_cover) || 50;

  // Estimate sun hours from cloud cover (max 8 hours of useful sun)
  const sunHoursEst = Math.max(0, 8 - (cloudCover / 100) * 8);

  return 0.03 * humidity + 0.08 * precip + 0.20 * Math.max(0, 8 - sunHoursEst);
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
 * Build feature matrix for training
 * Joins revenue data with weather data by date
 */
function buildTrainingFeatures(revenueRows, weatherRows) {
  // Create date-keyed maps
  // Use total_revenue (service + recarga) for full daily cash flow
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

  // Build training data (skip first 7 days for lags)
  const features = [];

  for (let i = 7; i < dates.length; i++) {
    const date = dates[i];
    const w = weatherMap[date];

    // Skip if no weather data
    if (!w) continue;

    const revenue = revenueMap[date];
    const revLag1 = revenueMap[dates[i - 1]] || revenue;
    const revLag7 = revenueMap[dates[i - 7]] || revenue;

    // Skip if lags are zero (missing data)
    if (revLag1 === 0 || revLag7 === 0) continue;

    const dryingPain = calculateDryingPain(w);
    const precip = parseFloat(w.precipitation) || 0;

    features.push({
      date,
      y: revenue,
      x: [
        1,                          // intercept (β₀)
        revLag1,                    // yesterday's revenue (β₁)
        revLag7,                    // same day last week (β₂)
        isWeekend(date) ? 1 : 0,    // weekend indicator (β₃)
        dryingPain,                 // drying pain index (β₄)
        precip >= 2 ? 1 : 0,        // rain indicator (β₅)
        precip >= 10 ? 1 : 0        // heavy rain indicator (β₆)
      ],
      features: {
        rev_lag_1: revLag1,
        rev_lag_7: revLag7,
        is_weekend: isWeekend(date),
        drying_pain: Math.round(dryingPain * 100) / 100,
        is_rainy: precip >= 2,
        heavy_rain: precip >= 10
      }
    });
  }

  return features;
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
 * Load trained model coefficients from Supabase
 * Falls back to on-the-fly training if no cached model or stale (>48h)
 *
 * @param {Object} supabase - Supabase client
 * @param {Array} trainingData - Pre-built training data for fallback
 * @returns {Object} Model object with beta, mae, rSquared, etc.
 */
async function loadOrTrainModel(supabase, trainingData) {
  try {
    // Try to load cached coefficients
    const { data: cached, error } = await supabase
      .from('model_coefficients')
      .select('*')
      .eq('id', 'revenue_prediction')
      .single();

    if (error) {
      console.log('No cached model found, training on-the-fly...');
      return fitOLS(trainingData);
    }

    // Check if cached model exists and has coefficients
    if (!cached || !cached.beta) {
      console.log('Cached model has no coefficients, training on-the-fly...');
      return fitOLS(trainingData);
    }

    // Parse beta array
    let beta;
    try {
      beta = typeof cached.beta === 'string' ? JSON.parse(cached.beta) : cached.beta;
    } catch (parseError) {
      console.log('Failed to parse cached coefficients, training on-the-fly...');
      return fitOLS(trainingData);
    }

    // Check if beta is valid
    if (!Array.isArray(beta) || beta.length === 0) {
      console.log('Invalid cached coefficients, training on-the-fly...');
      return fitOLS(trainingData);
    }

    // Check if model is stale (>48 hours old)
    const trainedAt = new Date(cached.trained_at);
    const age = Date.now() - trainedAt.getTime();
    const maxAge = 48 * 60 * 60 * 1000; // 48 hours

    if (age > maxAge) {
      console.log(`Cached model is stale (${Math.round(age / 3600000)}h old), training on-the-fly...`);
      return fitOLS(trainingData);
    }

    console.log(`Using cached model (trained ${Math.round(age / 3600000)}h ago, R²=${cached.r_squared})`);

    // Return cached model in the expected format
    return {
      beta,
      mae: cached.mae || 0,
      rmse: cached.rmse || 0,
      rSquared: cached.r_squared || 0,
      n: cached.n_training_samples || 0,
      meanRevenue: cached.mean_revenue || 0,
      standardError: cached.mae ? Math.round(cached.mae * 1.25) : 100 // Approximate SE from MAE
    };
  } catch (loadError) {
    console.warn('Error loading cached model:', loadError.message);
    console.log('Falling back to on-the-fly training...');
    return fitOLS(trainingData);
  }
}

/**
 * Calculate weather contribution to prediction
 * Shows how much weather features affect the prediction vs baseline
 */
function calculateWeatherImpact(beta, features, meanRevenue) {
  // Weather contribution = β₄·drying_pain + β₅·is_rainy + β₆·heavy_rain
  const weatherContrib = beta[4] * features.drying_pain +
    beta[5] * (features.is_rainy ? 1 : 0) +
    beta[6] * (features.heavy_rain ? 1 : 0);

  // Convert to percentage of mean revenue
  return meanRevenue > 0 ? (weatherContrib / meanRevenue) * 100 : 0;
}

// ============== PREDICTION LOGIC ==============

/**
 * Build prediction features for future days
 * Uses recursive prediction for lag features
 */
function buildPredictionFeatures(forecastWeather, recentRevenue, dayIndex, previousPredictions) {
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

  return {
    x: [
      1,                          // intercept
      revLag1,                    // yesterday
      revLag7,                    // last week
      isWeekend(date) ? 1 : 0,    // weekend
      dryingPain,                 // drying pain
      precip >= 2 ? 1 : 0,        // rain
      precip >= 10 ? 1 : 0        // heavy rain
    ],
    features: {
      rev_lag_1: Math.round(revLag1),
      rev_lag_7: Math.round(revLag7),
      is_weekend: isWeekend(date),
      drying_pain: Math.round(dryingPain * 100) / 100,
      is_rainy: precip >= 2,
      heavy_rain: precip >= 10
    }
  };
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

  // Build training features
  const trainingData = buildTrainingFeatures(revenue, weatherData);
  console.log(`Built ${trainingData.length} training samples`);

  if (trainingData.length < MIN_TRAINING_SAMPLES) {
    return {
      success: false,
      error: `Insufficient training data: ${trainingData.length} samples (need ${MIN_TRAINING_SAMPLES})`,
      predictions: []
    };
  }

  // Load cached model or train on-the-fly
  const model = await loadOrTrainModel(supabase, trainingData);
  console.log(`Model ready: R²=${model.rSquared}, MAE=R$${model.mae}`);

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
      predictions
    );

    const predictedRevenue = predict(model.beta, x);
    const weatherImpact = calculateWeatherImpact(model.beta, features, model.meanRevenue);

    // Calculate confidence interval (±1.96 * SE for 95% CI)
    const margin = 1.96 * model.standardError;

    predictions.push({
      date: forecastDay.date,
      predicted_revenue: Math.round(Math.max(0, predictedRevenue)),
      confidence_low: Math.round(Math.max(0, predictedRevenue - margin)),
      confidence_high: Math.round(predictedRevenue + margin),
      weather_impact_pct: Math.round(weatherImpact * 10) / 10,
      category: classifyWeatherCategory(forecastDay),
      conditions: forecastDay.conditions,
      icon: forecastDay.icon,
      features
    });
  }

  return {
    success: true,
    predictions,
    model_info: {
      r_squared: model.rSquared,
      mae: model.mae,
      rmse: model.rmse,
      n_training_samples: model.n,
      mean_daily_revenue: model.meanRevenue,
      last_trained: new Date().toISOString(),
      feature_names: ['intercept', 'rev_lag_1', 'rev_lag_7', 'is_weekend', 'drying_pain', 'is_rainy', 'heavy_rain'],
      coefficients: model.beta.map(b => Math.round(b * 100) / 100)
    }
  };
}

// ============== NETLIFY HANDLER ==============

exports.handler = async (event, context) => {
  console.log('Revenue prediction triggered');

  // Base CORS headers
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
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
