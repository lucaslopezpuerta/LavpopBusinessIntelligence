# Daily Revenue Forecasting Using Weather (Laundromat)

Predict **tomorrow’s laundromat revenue** using:
- historical revenue
- daily weather data from Supabase
- tomorrow’s weather forecast

This project uses a **time-aware linear regression** with laundromat-specific weather logic.

---

## 1. Problem Definition

You have:
- Daily revenue history
- Daily weather history (Supabase table)
- Tomorrow’s weather forecast

You want:
> A numeric prediction of **tomorrow’s revenue**

This is a **time-series regression** problem.

---

## 2. Why Regression (Not Correlation)

Correlation only measures association
It is symmetric and non-predictive
It ignores time dependence
**Prediction requires regression**, because revenue depends heavily on:
- yesterday
- last week
- weekly patterns

Weather is an *adjustment*, not the main driver.

---

## 3. Correct Model Framing

Revenueₜ depends on:

Revenueₜ₋₁ (momentum)
Revenueₜ₋₇ (weekly rhythm)
Calendar effects
Weatherₜ (forecastable)
Formalized as:

Revenueₜ = f(
  Revenueₜ₋₁,
  Revenueₜ₋₇,
  Calendarₜ,
  Weatherₜ
)

Any model without revenue lags will underperform.

---

## 4. Laundromat-Specific Weather Logic

Laundromats respond to **drying constraints**, not comfort temperature.

### Key effects
1. High humidity → harder to dry clothes
2. Rain → people bring laundry inside
3. Low sun → outdoor drying impossible
4. Extreme rain → fewer visits (stay-home effect)

---

## 5. Weather and Transactions Tables (Supabase)



⸻

Engineered FeaturesCalendar
    •    dow (Monday=0)
    •    is_weekend

Revenue lags (mandatory)
    •    rev_lag_1
    •    rev_lag_7

Weather (from Supabase)
    •    is_rainy → precipitation ≥ 2 mm
    •    heavy_rain → precipitation ≥ 10 mm

Drying Pain Index (core laundromat signal)

drying_pain =
  0.03 × humidity_avg
+ 0.08 × precipitation
+ 0.20 × (8 − sun_hours_estimate)

If sun hours are unavailable:
    •    estimate from cloud cover

Interactions
    •    drying_pain × weekend
    •    rain × weekend

⸻

Model
Time-aware multiple linear regression

Revenueₜ =
    •    β₀
    •        •    β₁ · Revenueₜ₋₁
    •        •    β₂ · Revenueₜ₋₇
    •        •    β₃ · is_weekend
    •        •    β₄ · drying_pain
    •        •    β₅ · rain_thresholds
    •        •    εₜ

⸻

Training Rules • Always sort by date • Never shuffle • Use last N days as test • Metric: MAE
Expected variance explanation:
    •    Lagged revenue: 60–85%
    •    Weather: 5–20%
    •    Calendar: remainder

⸻

Node.js Reference Implementation (Supabase)
Dependencies

npm i @supabase/supabase-js ml-matrix

src/model.js

import { createClient } from "@supabase/supabase-js";
import { Matrix } from "ml-matrix";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ---------- Helpers ----------
function dowUTC(dateStr) {
  const d = new Date(dateStr + "T00:00:00Z");
  return (d.getUTCDay() + 6) % 7; // Mon=0
}

function dryingPain(w) {
  const humidity = Number(w.humidity_avg ?? 60);
  const rain = Number(w.precipitation ?? 0);
  const cloud = Number(w.cloud_cover ?? 50);
  const sunEst = Math.max(0, 8 - (cloud / 100) * 8);

  return (
    0.03 * humidity +
    0.08 * rain +
    0.20 * Math.max(0, 8 - sunEst)
  );
}

// ---------- Load data ----------
export async function loadData() {
  const { data: weather } = await supabase
    .from("weather")
    .select("*")
    .order("date");

  const { data: revenue } = await supabase
    .from("revenue")
    .select("date, revenue")
    .order("date");

  return weather.map((w, i) => ({
    ...w,
    revenue: Number(revenue[i]?.revenue ?? null)
  }));
}

// ---------- Feature engineering ----------
export function buildFeatures(rows) {
  return rows.map((r, i) => {
    if (i < 7) return null;

    const rain = Number(r.precipitation ?? 0);
    const pain = dryingPain(r);

    return {
      y: r.revenue,
      x: [
        1,
        rows[i - 1].revenue,
        rows[i - 7].revenue,
        dowUTC(r.date) >= 5 ? 1 : 0,
        pain,
        rain >= 2 ? 1 : 0,
        rain >= 10 ? 1 : 0
      ]
    };
  }).filter(Boolean);
}

// ---------- OLS ----------
export function fitOLS(data) {
  const X = new Matrix(data.map(d => d.x));
  const y = new Matrix(data.map(d => [d.y]));

  const beta = X.transpose()
    .mmul(X)
    .inverse()
    .mmul(X.transpose())
    .mmul(y);

  return beta.to1DArray();
}

export function predict(beta, x) {
  return beta.reduce((s, b, i) => s + b * x[i], 0);
}

⸻

Predicting Tomorrow
To predict tomorrow:
    1.    Fetch today + last 7 days
    2.    Fetch tomorrow’s weather forecast
    3.    Build the feature vector
    4.    Apply predict(beta, x)

⸻

Interpretation Rules • Large rev_lag_1 → momentum dominates • Stable rev_lag_7 → weekly rhythm • Positive drying_pain → drying constraints drive demand • Rain effects often nonlinear
If weather coefficients are unstable → weather barely matters.

⸻

Operational Checklist
Before training:
    •    ≥ 3 months of daily data
    •    Revenue lags present
    •    Weather aligned by date

Before deployment:
    •    Forecast source reliable
    •    Retrain monthly or quarterly
    •    Monitor MAE drift

⸻

Final Recommendation Use a time-aware regression with:
 • lagged revenue 
 • calendar effects 
 • laundromat-specific weather features
Anything simpler will mislead.

# Areas worth reconsidering:

## 1 Data alignment is fragile — The loadData function assumes weather[i] and revenue[i] correspond by array position. A date-keyed join would be safer:

js   const revenueMap = Object.fromEntries(revenue.map(r => [r.date, r.revenue]));
   return weather.map(w => ({ ...w, revenue: revenueMap[w.date] ?? null }));

## 2 No gap handling 
— If you're missing a day of revenue, your lag features break silently. Worth adding validation or interpolation logic.

## 3 Seasonality beyond weekly 
— Laundromats likely have monthly patterns (paycheck cycles) and yearly patterns (winter vs. summer drying conditions). A month feature or yearly lag might help.

## 4 OLS without regularization 
— With correlated features like rev_lag_1 and rev_lag_7, coefficients can become unstable. Ridge regression would be a small addition with meaningful stability gains.

## 5 No prediction intervals 
— A point estimate of "tomorrow's revenue is X"islessusefulthan"X" is less useful than "X" is less useful than "X ± $Y with 80% confidence."