-- Migration 035: Prediction Tracking for Revenue Model Improvement
-- Version: 3.30 (2026-01-20)
--
-- Purpose: Enable feedback loop for revenue prediction model
--   - Store daily predictions for later comparison with actuals
--   - Track out-of-sample (OOS) metrics for honest accuracy reporting
--   - Support drift detection by comparing recent vs baseline errors
--
-- Related files:
--   - netlify/functions/revenue-predict.js (saves predictions)
--   - netlify/functions/campaign-scheduler.js (evaluates predictions)
--   - src/components/weather/ModelDiagnostics.jsx (displays OOS metrics)

-- ==================== PREDICTION TRACKING TABLE ====================
-- Stores daily revenue predictions for comparison with actual outcomes

CREATE TABLE IF NOT EXISTS revenue_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Prediction identification
  prediction_date DATE NOT NULL,
  predicted_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prediction values
  predicted_revenue DECIMAL(10,2) NOT NULL,
  confidence_low DECIMAL(10,2),
  confidence_high DECIMAL(10,2),

  -- Model metadata at prediction time
  model_tier TEXT,                          -- full, reduced, minimal, fallback
  in_sample_r_squared DECIMAL(5,4),         -- R² from training (for reference)

  -- Features used (for debugging and analysis)
  features JSONB,

  -- Actual outcome (populated after the day ends by campaign-scheduler.js)
  actual_revenue DECIMAL(10,2),
  error DECIMAL(10,2),                       -- actual - predicted (signed)
  abs_error DECIMAL(10,2),                   -- |actual - predicted|
  pct_error DECIMAL(5,2),                    -- ((actual - predicted) / actual) * 100
  evaluated_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One prediction per day (today's prediction for day X)
  CONSTRAINT unique_daily_prediction UNIQUE (prediction_date)
);

-- Index for efficient date-based queries
CREATE INDEX IF NOT EXISTS idx_revenue_predictions_date
ON revenue_predictions(prediction_date DESC);

-- Index for finding unevaluated predictions
CREATE INDEX IF NOT EXISTS idx_revenue_predictions_pending
ON revenue_predictions(prediction_date)
WHERE actual_revenue IS NULL;

-- Index for drift detection queries (recent errors)
CREATE INDEX IF NOT EXISTS idx_revenue_predictions_evaluated
ON revenue_predictions(evaluated_at DESC)
WHERE evaluated_at IS NOT NULL;

COMMENT ON TABLE revenue_predictions IS
'Daily revenue predictions stored for comparison with actual outcomes. Enables honest out-of-sample accuracy metrics and drift detection.';

-- ==================== PREDICTION ACCURACY VIEW ====================
-- Rolling 30-day accuracy metrics for dashboard display

CREATE OR REPLACE VIEW prediction_accuracy AS
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

COMMENT ON VIEW prediction_accuracy IS
'Rolling 30-day prediction accuracy metrics. MAE = Mean Absolute Error, MAPE = Mean Absolute Percentage Error.';

-- ==================== WEEKLY ACCURACY VIEW ====================
-- Week-by-week accuracy for trend analysis

CREATE OR REPLACE VIEW prediction_accuracy_weekly AS
SELECT
  DATE_TRUNC('week', prediction_date)::DATE as week_start,
  COUNT(*) as predictions,
  ROUND(AVG(abs_error)::NUMERIC, 0) as avg_mae,
  ROUND(AVG(ABS(pct_error))::NUMERIC, 1) as avg_mape,
  ROUND(STDDEV(error)::NUMERIC, 0) as error_std,
  -- Bias: positive = underpredicting, negative = overpredicting
  ROUND(AVG(error)::NUMERIC, 0) as avg_bias
FROM revenue_predictions
WHERE actual_revenue IS NOT NULL
  AND prediction_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE_TRUNC('week', prediction_date)
ORDER BY week_start DESC;

COMMENT ON VIEW prediction_accuracy_weekly IS
'Weekly prediction accuracy trends for drift detection. Tracks MAE, MAPE, and bias over time.';

-- ==================== MODEL COEFFICIENTS EXTENSIONS ====================
-- Add out-of-sample metrics to existing model_coefficients table

ALTER TABLE model_coefficients
ADD COLUMN IF NOT EXISTS oos_mae DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS oos_mape DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS oos_r_squared DECIMAL(5,4),
ADD COLUMN IF NOT EXISTS validation_points INTEGER,
ADD COLUMN IF NOT EXISTS drift_detected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS drift_ratio DECIMAL(5,2);

COMMENT ON COLUMN model_coefficients.oos_mae IS
'Out-of-sample Mean Absolute Error from walk-forward cross-validation (honest metric)';
COMMENT ON COLUMN model_coefficients.oos_mape IS
'Out-of-sample Mean Absolute Percentage Error (honest metric)';
COMMENT ON COLUMN model_coefficients.oos_r_squared IS
'Out-of-sample R-squared (typically lower than in-sample)';
COMMENT ON COLUMN model_coefficients.drift_detected IS
'True if recent prediction errors significantly exceed baseline';
COMMENT ON COLUMN model_coefficients.drift_ratio IS
'Ratio of recent MAE to baseline MAE (>1.5 indicates drift)';

-- ==================== HELPER FUNCTION ====================
-- Function to evaluate yesterday's prediction (called by campaign-scheduler)

CREATE OR REPLACE FUNCTION evaluate_prediction(p_date DATE)
RETURNS TABLE (
  prediction_id UUID,
  predicted DECIMAL,
  actual DECIMAL,
  error DECIMAL,
  pct_error DECIMAL
) AS $$
DECLARE
  v_actual DECIMAL;
  v_prediction RECORD;
BEGIN
  -- Get actual revenue for the date
  SELECT total_revenue INTO v_actual
  FROM daily_revenue
  WHERE date = p_date;

  IF v_actual IS NULL THEN
    RETURN; -- No revenue data for this date
  END IF;

  -- Find and update the prediction
  UPDATE revenue_predictions rp
  SET
    actual_revenue = v_actual,
    error = v_actual - rp.predicted_revenue,
    abs_error = ABS(v_actual - rp.predicted_revenue),
    pct_error = CASE
      WHEN v_actual > 0 THEN ((v_actual - rp.predicted_revenue) / v_actual) * 100
      ELSE NULL
    END,
    evaluated_at = NOW()
  WHERE rp.prediction_date = p_date
    AND rp.actual_revenue IS NULL
  RETURNING
    rp.id,
    rp.predicted_revenue,
    rp.actual_revenue,
    rp.error,
    rp.pct_error
  INTO v_prediction;

  IF FOUND THEN
    RETURN QUERY SELECT
      v_prediction.id,
      v_prediction.predicted_revenue,
      v_prediction.actual_revenue,
      v_prediction.error,
      v_prediction.pct_error;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION evaluate_prediction IS
'Evaluates a prediction by comparing it to actual revenue. Called nightly by campaign-scheduler.js.';
