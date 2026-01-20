-- Migration 037: Exclude Closure Days from Accuracy Metrics
-- Version: 3.32 (2026-01-20)
--
-- Purpose: Improve accuracy metrics by excluding unpredictable closure days
--   - Closure days (revenue < R$100) are fundamentally unpredictable
--   - They account for ~40% of total prediction error despite being ~17% of days
--   - Model predicts "normal operating day" revenue; closures need explicit indicators
--
-- Analysis showed:
--   - All days: MAE R$162, MAPE 141%
--   - Normal days only: MAE R$131, MAPE 47%
--   - Closure days: MAE R$256, MAPE 424%
--
-- This migration:
--   1. Updates prediction_accuracy view to exclude closure days
--   2. Adds closure_threshold column to revenue_predictions for flagging
--   3. Adds separate views for closure analysis

-- ==================== STEP 1: ADD CLOSURE FLAG TO PREDICTIONS ====================

ALTER TABLE revenue_predictions
ADD COLUMN IF NOT EXISTS is_closure BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN revenue_predictions.is_closure IS
'True if actual_revenue < R$100 (closure/anomaly day). These days are excluded from main accuracy metrics.';

-- Backfill existing predictions with closure flag
UPDATE revenue_predictions
SET is_closure = (actual_revenue IS NOT NULL AND actual_revenue < 100)
WHERE actual_revenue IS NOT NULL;

-- ==================== STEP 2: DROP AND RECREATE VIEWS ====================
-- Must drop first because we're changing column definitions

DROP VIEW IF EXISTS prediction_accuracy_weekly;
DROP VIEW IF EXISTS prediction_accuracy;

-- ==================== STEP 3: RECREATE MAIN ACCURACY VIEW ====================
-- Now excludes closure days for honest "normal operating day" accuracy

CREATE VIEW prediction_accuracy AS
SELECT
  COUNT(*) as total_predictions,
  ROUND(AVG(abs_error)::NUMERIC, 0) as avg_mae,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY abs_error)::NUMERIC, 0) as median_ae,
  ROUND(AVG(ABS(pct_error))::NUMERIC, 1) as avg_mape,
  ROUND(STDDEV(abs_error)::NUMERIC, 0) as mae_std,
  MIN(prediction_date) as period_start,
  MAX(prediction_date) as period_end,
  -- Additional context
  (SELECT COUNT(*) FROM revenue_predictions
   WHERE actual_revenue IS NOT NULL
   AND prediction_date >= CURRENT_DATE - INTERVAL '30 days') as days_total,
  (SELECT COUNT(*) FROM revenue_predictions
   WHERE actual_revenue IS NOT NULL
   AND is_closure = TRUE
   AND prediction_date >= CURRENT_DATE - INTERVAL '30 days') as days_excluded
FROM revenue_predictions
WHERE actual_revenue IS NOT NULL
  AND is_closure = FALSE  -- Exclude closure days
  AND prediction_date >= CURRENT_DATE - INTERVAL '30 days';

COMMENT ON VIEW prediction_accuracy IS
'Rolling 30-day prediction accuracy for NORMAL operating days (excludes closures where revenue < R$100). Closure days are fundamentally unpredictable without explicit business indicators.';

-- ==================== STEP 4: ADD ALL-DAYS ACCURACY VIEW ====================
-- For reference, shows accuracy including closure days

CREATE VIEW prediction_accuracy_all AS
SELECT
  COUNT(*) as total_predictions,
  ROUND(AVG(abs_error)::NUMERIC, 0) as avg_mae,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY abs_error)::NUMERIC, 0) as median_ae,
  ROUND(AVG(ABS(pct_error))::NUMERIC, 1) as avg_mape,
  ROUND(STDDEV(abs_error)::NUMERIC, 0) as mae_std,
  MIN(prediction_date) as period_start,
  MAX(prediction_date) as period_end
FROM revenue_predictions
WHERE actual_revenue IS NOT NULL
  AND prediction_date >= CURRENT_DATE - INTERVAL '30 days';

COMMENT ON VIEW prediction_accuracy_all IS
'Rolling 30-day prediction accuracy including ALL days (even closures). For reference only - main metrics use prediction_accuracy which excludes closure days.';

-- ==================== STEP 5: ADD CLOSURE ANALYSIS VIEW ====================

CREATE VIEW closure_day_analysis AS
SELECT
  COUNT(*) FILTER (WHERE is_closure = TRUE) as closure_days,
  COUNT(*) FILTER (WHERE is_closure = FALSE) as normal_days,
  COUNT(*) as total_days,
  ROUND(100.0 * COUNT(*) FILTER (WHERE is_closure = TRUE) / NULLIF(COUNT(*), 0), 1) as closure_pct,
  -- Closure day stats
  ROUND(AVG(abs_error) FILTER (WHERE is_closure = TRUE)::NUMERIC, 0) as closure_mae,
  ROUND(AVG(ABS(pct_error)) FILTER (WHERE is_closure = TRUE)::NUMERIC, 1) as closure_mape,
  -- Normal day stats
  ROUND(AVG(abs_error) FILTER (WHERE is_closure = FALSE)::NUMERIC, 0) as normal_mae,
  ROUND(AVG(ABS(pct_error)) FILTER (WHERE is_closure = FALSE)::NUMERIC, 1) as normal_mape
FROM revenue_predictions
WHERE actual_revenue IS NOT NULL
  AND prediction_date >= CURRENT_DATE - INTERVAL '30 days';

COMMENT ON VIEW closure_day_analysis IS
'Analysis of prediction accuracy split by closure (revenue < R$100) vs normal operating days.';

-- ==================== STEP 6: RECREATE WEEKLY ACCURACY VIEW ====================
-- Also exclude closure days from weekly trends

CREATE VIEW prediction_accuracy_weekly AS
SELECT
  DATE_TRUNC('week', prediction_date)::DATE as week_start,
  COUNT(*) as predictions,
  COUNT(*) FILTER (WHERE is_closure = FALSE) as normal_predictions,
  ROUND(AVG(abs_error) FILTER (WHERE is_closure = FALSE)::NUMERIC, 0) as avg_mae,
  ROUND(AVG(ABS(pct_error)) FILTER (WHERE is_closure = FALSE)::NUMERIC, 1) as avg_mape,
  ROUND(STDDEV(error) FILTER (WHERE is_closure = FALSE)::NUMERIC, 0) as error_std,
  ROUND(AVG(error) FILTER (WHERE is_closure = FALSE)::NUMERIC, 0) as avg_bias
FROM revenue_predictions
WHERE actual_revenue IS NOT NULL
  AND prediction_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE_TRUNC('week', prediction_date)
ORDER BY week_start DESC;

COMMENT ON VIEW prediction_accuracy_weekly IS
'Weekly prediction accuracy trends excluding closure days. Tracks MAE, MAPE, and bias over time.';

-- ==================== VERIFICATION ====================

-- After running this migration, verify with:
-- SELECT * FROM prediction_accuracy;
-- SELECT * FROM closure_day_analysis;

