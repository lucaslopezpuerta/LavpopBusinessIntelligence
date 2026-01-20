// scripts/backfill-predictions.cjs
// Historical prediction backfill using walk-forward simulation
//
// v2.0 (2026-01-20): Ridge regression & feature standardization
//   - Replace OLS with Ridge regression (L2 regularization)
//   - Add z-score feature standardization
//   - Add outlier winsorization
//   - Lambda selection via 5-fold cross-validation
//   - Matches revenue-predict.js v4.0 methodology
//
// This script backfills revenue_predictions table with historical predictions
// by simulating what the model would have predicted on each day using only
// data that was available at that time (walk-forward cross-validation).
//
// Usage: node scripts/backfill-predictions.cjs
//
// Prerequisites:
// - .env file with SUPABASE_URL and SUPABASE_SERVICE_KEY
// - Migration 035_prediction_tracking.sql must be applied
// - Historical revenue data in daily_revenue view
// - Historical weather data in weather_daily_metrics table

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// ============== CONFIGURATION ==============

const START_DATE = '2024-05-01';  // First predictable day (data starts April 24, need 7 days for lags)
const BATCH_SIZE = 50;           // Days per progress report
const MIN_TRAINING_SAMPLES = 14; // Absolute minimum for any prediction

// Tiered model complexity thresholds
const MODEL_TIERS = {
  FULL: { minSamples: 60, features: 12, name: 'full' },
  REDUCED: { minSamples: 30, features: 7, name: 'reduced' },
  MINIMAL: { minSamples: 14, features: 3, name: 'minimal' },
  FALLBACK: { minSamples: 0, features: 1, name: 'fallback' }
};

// Default drying pain weights
const DEFAULT_DRYING_WEIGHTS = {
  humidity: 0.03,
  precip: 0.08,
  sunDeficit: 0.20
};

// ============== BRAZILIAN HOLIDAYS ==============
// Copied from netlify/functions/lib/brazilHolidays.js

const FIXED_HOLIDAYS = {
  '01-01': 'Confraternização Universal',
  '04-21': 'Tiradentes',
  '05-01': 'Dia do Trabalho',
  '09-07': 'Independência do Brasil',
  '09-20': 'Revolução Farroupilha',  // RS state holiday
  '10-12': 'Nossa Senhora Aparecida',
  '11-02': 'Finados',
  '11-15': 'Proclamação da República',
  '11-20': 'Consciência Negra',
  '12-25': 'Natal'
};

const EASTER_OFFSETS = {
  '-48': 'Carnaval (segunda)',
  '-47': 'Carnaval (terça)',
  '-46': 'Quarta-Feira de Cinzas',
  '-2': 'Sexta-Feira Santa',
  '60': 'Corpus Christi'
};

function getEasterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function formatDateStr(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isHoliday(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    return { isHoliday: false, name: null, type: null };
  }

  const monthDay = dateStr.slice(5);
  const year = parseInt(dateStr.slice(0, 4), 10);

  if (FIXED_HOLIDAYS[monthDay]) {
    return { isHoliday: true, name: FIXED_HOLIDAYS[monthDay], type: 'fixed' };
  }

  const easter = getEasterSunday(year);
  for (const [offset, name] of Object.entries(EASTER_OFFSETS)) {
    const holidayDate = new Date(easter);
    holidayDate.setDate(holidayDate.getDate() + parseInt(offset, 10));
    const holidayStr = formatDateStr(holidayDate);
    if (holidayStr === dateStr) {
      return { isHoliday: true, name, type: 'moveable' };
    }
  }

  return { isHoliday: false, name: null, type: null };
}

function isHolidayEve(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    return { isHolidayEve: false, holidayName: null };
  }

  const date = new Date(dateStr + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + 1);
  const tomorrowStr = formatDateStr(date);
  const holidayInfo = isHoliday(tomorrowStr);

  return {
    isHolidayEve: holidayInfo.isHoliday,
    holidayName: holidayInfo.name
  };
}

// ============== DATE UTILITIES ==============

function getLocalDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(date);
}

function getDayOfWeek(dateStr) {
  const date = new Date(dateStr + 'T12:00:00Z');
  return (date.getUTCDay() + 6) % 7;
}

function isWeekend(dateStr) {
  const dow = getDayOfWeek(dateStr);
  return dow >= 5;
}

function generateDateRange(startDate, endDate) {
  const dates = [];
  const current = new Date(startDate + 'T12:00:00Z');
  const end = new Date(endDate + 'T12:00:00Z');

  while (current <= end) {
    dates.push(formatDateStr(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

// ============== FEATURE ENGINEERING ==============

function calculateDryingPain(weather, weights = DEFAULT_DRYING_WEIGHTS) {
  const humidity = parseFloat(weather.humidity_avg) || 60;
  const precip = parseFloat(weather.precipitation) || 0;
  const cloudCover = parseFloat(weather.cloud_cover) || 50;

  const sunHoursEst = Math.max(0, 8 - (cloudCover / 100) * 8);
  const sunDeficit = Math.max(0, 8 - sunHoursEst);

  return weights.humidity * humidity + weights.precip * precip + weights.sunDeficit * sunDeficit;
}

function buildTrainingFeatures(revenueRows, weatherRows, options = {}) {
  const { tier = 'full', dryingPainWeights = DEFAULT_DRYING_WEIGHTS } = options;

  const revenueMap = {};
  revenueRows.forEach(r => {
    revenueMap[r.date] = parseFloat(r.total_revenue) || 0;
  });

  const weatherMap = {};
  weatherRows.forEach(w => {
    weatherMap[w.date] = w;
  });

  const dates = Object.keys(revenueMap).sort();

  const dataQuality = {
    totalDays: dates.length,
    missingWeather: 0,
    missingLags: 0,
    usableDays: 0,
    outlierCount: 0,
    fallbacksUsed: 0,
    holidaysInRange: 0
  };

  const features = [];

  for (let i = 7; i < dates.length; i++) {
    const date = dates[i];
    const w = weatherMap[date];

    if (!w) {
      dataQuality.missingWeather++;
      continue;
    }

    const revenue = revenueMap[date];
    const revLag1 = revenueMap[dates[i - 1]];
    const revLag7 = revenueMap[dates[i - 7]];

    if (revLag1 === undefined || revLag1 === 0 ||
        revLag7 === undefined || revLag7 === 0) {
      dataQuality.missingLags++;
      continue;
    }

    const dryingPain = calculateDryingPain(w, dryingPainWeights);
    const precip = parseFloat(w.precipitation) || 0;
    const isWknd = isWeekend(date);
    const isRainy = precip >= 2;
    const heavyRain = precip >= 10;

    const holidayInfo = isHoliday(date);
    const holidayEveInfo = isHolidayEve(date);
    const isHolidayFlag = holidayInfo.isHoliday;
    const isHolidayEveFlag = holidayEveInfo.isHolidayEve;

    if (isHolidayFlag) dataQuality.holidaysInRange++;

    const weekendXDrying = isWknd ? dryingPain : 0;
    const weekendXRain = (isWknd && isRainy) ? 1 : 0;
    const holidayXDrying = isHolidayFlag ? dryingPain : 0;

    let x, featureObj;

    if (tier === 'full') {
      x = [
        1, revLag1, revLag7,
        isWknd ? 1 : 0, dryingPain,
        isRainy ? 1 : 0, heavyRain ? 1 : 0,
        isHolidayFlag ? 1 : 0, isHolidayEveFlag ? 1 : 0,
        weekendXDrying, weekendXRain, holidayXDrying
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
      x = [1, revLag1, revLag7, isWknd ? 1 : 0, dryingPain, isRainy ? 1 : 0, heavyRain ? 1 : 0];
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
      x = [1];
      featureObj = {};
    }

    features.push({ date, y: revenue, x, features: featureObj });
  }

  dataQuality.usableDays = features.length;
  return { features, dataQuality };
}

// ============== MATRIX OPERATIONS ==============

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

function invert(A) {
  const n = A.length;
  const aug = [];
  for (let i = 0; i < n; i++) {
    aug[i] = [...A[i]];
    for (let j = 0; j < n; j++) {
      aug[i][n + j] = i === j ? 1 : 0;
    }
  }

  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) {
        maxRow = row;
      }
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    if (Math.abs(aug[col][col]) < 1e-10) {
      throw new Error('Matrix is singular or nearly singular');
    }

    const pivot = aug[col][col];
    for (let j = 0; j < 2 * n; j++) {
      aug[col][j] /= pivot;
    }

    for (let row = 0; row < n; row++) {
      if (row !== col) {
        const factor = aug[row][col];
        for (let j = 0; j < 2 * n; j++) {
          aug[row][j] -= factor * aug[col][j];
        }
      }
    }
  }

  const inv = [];
  for (let i = 0; i < n; i++) {
    inv[i] = aug[i].slice(n);
  }
  return inv;
}

// ============== FEATURE STANDARDIZATION ==============

function standardizeFeatures(data) {
  const n = data.length;
  const p = data[0].x.length;

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
    if (stds[j] < 1e-10) stds[j] = 1;
  }

  // Scale the data
  const scaledData = data.map(d => {
    const scaledX = d.x.map((val, j) => {
      if (j === 0) return 1;
      return (val - means[j]) / stds[j];
    });
    return { ...d, x: scaledX };
  });

  return { scaledData, scaler: { means, stds } };
}

function applyScaler(x, scaler) {
  if (!scaler || !scaler.means || !scaler.stds) return x;
  return x.map((val, j) => {
    if (j === 0) return 1;
    return (val - scaler.means[j]) / scaler.stds[j];
  });
}

// ============== OUTLIER HANDLING ==============

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

function fitRidge(data, lambda = 1.0) {
  const n = data.length;
  const p = data[0].x.length;

  const X = data.map(d => d.x);
  const y = data.map(d => d.y);

  const Xt = transpose(X);
  const XtX = multiply(Xt, X);

  // Add lambda to diagonal (except intercept)
  for (let i = 1; i < p; i++) {
    XtX[i][i] += lambda;
  }

  const XtX_inv = invert(XtX);
  const Xty = multiplyMV(Xt, y);
  const beta = multiplyMV(XtX_inv, Xty);

  const yHat = data.map(d => {
    let pred = 0;
    for (let j = 0; j < p; j++) {
      pred += beta[j] * d.x[j];
    }
    return pred;
  });

  const meanY = y.reduce((s, v) => s + v, 0) / n;
  let ssRes = 0;
  let ssTot = 0;
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
  const mse = ssRes / (n - p);
  const se = Math.sqrt(mse);

  return {
    beta,
    mae: Math.round(mae),
    rmse: Math.round(rmse),
    rSquared: Math.round(rSquared * 1000) / 1000,
    n,
    meanRevenue: Math.round(meanY),
    standardError: Math.round(se),
    lambda
  };
}

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

        let foldMAE = 0;
        for (const d of testData) {
          const pred = predict(model.beta, d.x);
          foldMAE += Math.abs(d.y - pred);
        }
        totalMAE += foldMAE / testData.length;
        validFolds++;
      } catch (e) {
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

function trainRidgeModel(trainingData) {
  // Step 1: Winsorize outliers
  const winsorizedData = winsorizeRevenue(trainingData);

  // Step 2: Standardize features
  const { scaledData, scaler } = standardizeFeatures(winsorizedData);

  // Step 3: Select optimal lambda via cross-validation
  const { lambda } = selectLambdaCV(scaledData, 5);

  // Step 4: Fit Ridge regression with selected lambda
  const model = fitRidge(scaledData, lambda);

  return { ...model, scaler, lambda };
}

function predict(beta, x) {
  let pred = 0;
  for (let j = 0; j < beta.length; j++) {
    pred += beta[j] * x[j];
  }
  return pred;
}

function selectModelTier(sampleCount) {
  if (sampleCount >= MODEL_TIERS.FULL.minSamples) return 'full';
  if (sampleCount >= MODEL_TIERS.REDUCED.minSamples) return 'reduced';
  if (sampleCount >= MODEL_TIERS.MINIMAL.minSamples) return 'minimal';
  return 'fallback';
}

// ============== PREDICTION FEATURE BUILDER ==============

function buildPredictionFeatures(predictDate, revenueMap, weatherMap, tier = 'full') {
  const w = weatherMap[predictDate];
  if (!w) {
    return null; // No weather data for this date
  }

  // Get sorted dates up to prediction date
  const dates = Object.keys(revenueMap).filter(d => d < predictDate).sort();
  if (dates.length < 7) {
    return null; // Not enough lag data
  }

  // Get lag values from actual revenue
  const revLag1 = revenueMap[dates[dates.length - 1]] || 0;
  const revLag7 = revenueMap[dates[dates.length - 7]] || 0;

  if (revLag1 === 0 || revLag7 === 0) {
    return null; // Missing lag data
  }

  const dryingPain = calculateDryingPain(w);
  const precip = parseFloat(w.precipitation) || 0;
  const isWknd = isWeekend(predictDate);
  const isRainy = precip >= 2;
  const heavyRain = precip >= 10;

  const holidayInfo = isHoliday(predictDate);
  const holidayEveInfo = isHolidayEve(predictDate);
  const isHolidayFlag = holidayInfo.isHoliday;
  const isHolidayEveFlag = holidayEveInfo.isHolidayEve;

  const weekendXDrying = isWknd ? dryingPain : 0;
  const weekendXRain = (isWknd && isRainy) ? 1 : 0;
  const holidayXDrying = isHolidayFlag ? dryingPain : 0;

  let x, features;

  if (tier === 'full') {
    x = [
      1, revLag1, revLag7,
      isWknd ? 1 : 0, dryingPain,
      isRainy ? 1 : 0, heavyRain ? 1 : 0,
      isHolidayFlag ? 1 : 0, isHolidayEveFlag ? 1 : 0,
      weekendXDrying, weekendXRain, holidayXDrying
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
    features = { rev_lag_1: Math.round(revLag1), rev_lag_7: Math.round(revLag7) };
  } else {
    x = [1];
    features = {};
  }

  return { x, features };
}

// ============== MAIN BACKFILL LOGIC ==============

async function backfillPredictions() {
  console.log('=== Revenue Prediction Backfill ===\n');

  // Initialize Supabase client
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Fetch ALL revenue data at once
  console.log('Fetching all revenue data...');
  const { data: allRevenue, error: revError } = await supabase
    .from('daily_revenue')
    .select('date, total_revenue')
    .order('date');

  if (revError) {
    console.error('Error fetching revenue:', revError.message);
    process.exit(1);
  }
  console.log(`  Found ${allRevenue.length} revenue records`);

  // 2. Fetch ALL weather data at once
  console.log('Fetching all weather data...');
  const { data: allWeather, error: weatherError } = await supabase
    .from('weather_daily_metrics')
    .select('date, temp_avg, humidity_avg, precipitation, cloud_cover')
    .order('date');

  if (weatherError) {
    console.error('Error fetching weather:', weatherError.message);
    process.exit(1);
  }
  console.log(`  Found ${allWeather.length} weather records`);

  // Create lookup maps
  const revenueMap = {};
  allRevenue.forEach(r => {
    revenueMap[r.date] = parseFloat(r.total_revenue) || 0;
  });

  const weatherMap = {};
  allWeather.forEach(w => {
    weatherMap[w.date] = w;
  });

  // 3. Determine date range
  const yesterday = getLocalDate(-1);
  const dates = generateDateRange(START_DATE, yesterday);
  console.log(`\nBackfilling ${dates.length} days (${START_DATE} to ${yesterday})\n`);

  // 4. Process each day
  let processed = 0;
  let saved = 0;
  let skipped = 0;
  let errors = 0;

  for (const predictDate of dates) {
    try {
      // Filter data to simulate what was known at prediction time
      const knownRevenue = allRevenue.filter(r => r.date < predictDate);
      const knownWeather = allWeather.filter(w => w.date <= predictDate);

      // Build training features using only known data
      const initialBuild = buildTrainingFeatures(knownRevenue, knownWeather, { tier: 'full' });
      const sampleCount = initialBuild.features.length;
      const tier = selectModelTier(sampleCount);

      // Check minimum samples
      if (sampleCount < MIN_TRAINING_SAMPLES) {
        skipped++;
        processed++;
        if (processed % BATCH_SIZE === 0) {
          console.log(`Progress: ${processed}/${dates.length} (${saved} saved, ${skipped} skipped, ${errors} errors)`);
        }
        continue;
      }

      // Rebuild with selected tier
      const { features: trainingData } = buildTrainingFeatures(knownRevenue, knownWeather, { tier });

      // Train model using Ridge regression (or use mean for fallback)
      let model;
      if (tier === 'fallback') {
        const meanRev = trainingData.reduce((s, d) => s + d.y, 0) / trainingData.length;
        model = {
          beta: [meanRev],
          rSquared: 0,
          standardError: 0,
          scaler: null
        };
      } else {
        try {
          model = trainRidgeModel(trainingData);
        } catch (ridgeError) {
          // Matrix singularity - fall back to mean
          const meanRev = trainingData.reduce((s, d) => s + d.y, 0) / trainingData.length;
          model = {
            beta: [meanRev],
            rSquared: 0,
            standardError: 0,
            scaler: null
          };
        }
      }

      // Build prediction features for this day
      const predFeatures = buildPredictionFeatures(predictDate, revenueMap, weatherMap, tier);
      if (!predFeatures) {
        skipped++;
        processed++;
        continue;
      }

      // Apply scaler and make prediction (Ridge model)
      const scaledX = model.scaler ? applyScaler(predFeatures.x, model.scaler) : predFeatures.x;
      const predictedRevenue = predict(model.beta, scaledX);

      // Calculate confidence interval using PERCENTAGE-based approach (matches revenue-predict.js)
      const marginPercent = {
        full: 0.30,     // ±30% for full model
        reduced: 0.40,  // ±40% for reduced model
        minimal: 0.50,  // ±50% for minimal model
        fallback: 0.60  // ±60% for fallback
      }[tier] || 0.40;
      const margin = Math.max(50, predictedRevenue * marginPercent);

      // Get actual revenue (we know this now)
      const actualRevenue = revenueMap[predictDate] || null;

      // Calculate errors if we have actual data
      let error = null;
      let absError = null;
      let pctError = null;

      if (actualRevenue !== null && actualRevenue > 0) {
        error = actualRevenue - predictedRevenue;
        absError = Math.abs(error);
        pctError = (error / actualRevenue) * 100;
        // Cap values to fit DECIMAL column constraints
        error = Math.max(-9999999.99, Math.min(9999999.99, error));
        absError = Math.max(0, Math.min(9999999.99, absError));
        pctError = Math.max(-999.99, Math.min(999.99, pctError));
      }

      // Ensure prediction values don't overflow DECIMAL(10,2)
      const safePredictedRevenue = Math.max(0, Math.min(99999999.99, predictedRevenue));
      const safeConfidenceLow = Math.max(0, Math.min(99999999.99, predictedRevenue - margin));
      const safeConfidenceHigh = Math.max(0, Math.min(99999999.99, predictedRevenue + margin));

      // Upsert to database
      const { error: upsertError } = await supabase
        .from('revenue_predictions')
        .upsert({
          prediction_date: predictDate,
          predicted_at: new Date(predictDate + 'T03:00:00-03:00').toISOString(),
          predicted_revenue: Math.round(safePredictedRevenue),
          confidence_low: Math.round(safeConfidenceLow),
          confidence_high: Math.round(safeConfidenceHigh),
          model_tier: tier,
          in_sample_r_squared: model.rSquared !== null ? Math.min(0.9999, Math.max(0, model.rSquared)) : null,
          features: predFeatures.features,
          actual_revenue: actualRevenue,
          error: error !== null ? Math.round(error * 100) / 100 : null,
          abs_error: absError !== null ? Math.round(absError * 100) / 100 : null,
          // Cap pct_error AFTER rounding to fit DECIMAL(5,2) range
          pct_error: pctError !== null ? Math.max(-999.9, Math.min(999.9, Math.round(pctError * 10) / 10)) : null,
          evaluated_at: actualRevenue !== null ? new Date().toISOString() : null,
          // Closure day flag: revenue < R$100 indicates closure/anomaly (excluded from main accuracy metrics)
          is_closure: actualRevenue !== null && actualRevenue < 100
        }, { onConflict: 'prediction_date' });

      if (upsertError) {
        console.error(`  Error saving ${predictDate}:`, upsertError.message);
        errors++;
      } else {
        saved++;
      }
    } catch (err) {
      console.error(`  Error on ${predictDate}:`, err.message);
      errors++;
    }

    processed++;

    // Progress report
    if (processed % BATCH_SIZE === 0) {
      console.log(`Progress: ${processed}/${dates.length} (${saved} saved, ${skipped} skipped, ${errors} errors)`);
    }
  }

  // 5. Print summary
  console.log('\n=== Backfill Complete ===');
  console.log(`Total days processed: ${processed}`);
  console.log(`Predictions saved: ${saved}`);
  console.log(`Skipped (insufficient data): ${skipped}`);
  console.log(`Errors: ${errors}`);

  // 6. Query and display accuracy metrics
  console.log('\n=== Accuracy Metrics ===');

  const { data: accuracy, error: accError } = await supabase
    .from('prediction_accuracy')
    .select('*')
    .single();

  if (accError) {
    console.log('Could not fetch accuracy metrics:', accError.message);
  } else if (accuracy) {
    console.log(`30-Day Rolling Accuracy:`);
    console.log(`  MAE: R$ ${accuracy.avg_mae}`);
    console.log(`  Median AE: R$ ${accuracy.median_ae}`);
    console.log(`  MAPE: ${accuracy.avg_mape}%`);
    console.log(`  Predictions: ${accuracy.total_predictions}`);
    console.log(`  Period: ${accuracy.period_start} to ${accuracy.period_end}`);
  }

  // Weekly breakdown
  const { data: weekly, error: weeklyError } = await supabase
    .from('prediction_accuracy_weekly')
    .select('*')
    .order('week_start', { ascending: false })
    .limit(8);

  if (!weeklyError && weekly && weekly.length > 0) {
    console.log('\nWeekly Breakdown (last 8 weeks):');
    console.log('Week Start  | Predictions | MAE    | MAPE   | Bias');
    console.log('------------|-------------|--------|--------|------');
    for (const w of weekly) {
      const weekStart = w.week_start.slice(0, 10);
      const predictions = String(w.predictions).padStart(11);
      const mae = `R$${w.avg_mae}`.padStart(6);
      const mape = `${w.avg_mape}%`.padStart(6);
      const bias = (w.avg_bias >= 0 ? '+' : '') + w.avg_bias;
      console.log(`${weekStart} |${predictions} |${mae} |${mape} | ${bias}`);
    }
  }

  console.log('\nBackfill complete. The ModelDiagnostics modal will now show real OOS metrics.');
}

// Run the backfill
backfillPredictions().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
