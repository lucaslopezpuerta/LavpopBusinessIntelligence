-- Migration: 027_model_improvements.sql
-- Date: 2025-12-21
-- Description: Add columns for model improvements and cross-validation
--
-- Adds:
--   - optimal_training_days: Cross-validated optimal training window (currently fixed at 90)
--   - drying_pain_weights: Data-driven weights for Drying Pain Index calculation
--   - window_optimization_results: Full CV results for debugging/analysis
--   - window_optimized_at: Timestamp of last window optimization
--   - data_quality_metrics: Track missing data, outliers, etc.
--   - app_settings.window_last_optimized: Track when CV was last run
--
-- Part of the Weather Business Impact Prediction Refinement

-- ============================================================================
-- 1. Add optimal training window columns to model_coefficients
-- ============================================================================

-- Optimal training window (days) determined by cross-validation
-- Default 90 days, but CV may find different optimal value
ALTER TABLE model_coefficients
ADD COLUMN IF NOT EXISTS optimal_training_days INTEGER DEFAULT 90;

COMMENT ON COLUMN model_coefficients.optimal_training_days IS 'Optimal training window in days determined by time-series cross-validation. Recalculated weekly. Default: 90 days.';

-- Data-driven weights for Drying Pain Index
-- Default weights are ad-hoc: { humidity: 0.03, precip: 0.08, sunDeficit: 0.20 }
-- Grid search during training optimizes these weights
ALTER TABLE model_coefficients
ADD COLUMN IF NOT EXISTS drying_pain_weights JSONB DEFAULT '{"humidity": 0.03, "precip": 0.08, "sunDeficit": 0.20}';

COMMENT ON COLUMN model_coefficients.drying_pain_weights IS 'Data-driven weights for Drying Pain Index calculation. Format: { humidity: 0.03, precip: 0.08, sunDeficit: 0.20 }. Updated during model training via grid search.';

-- Full cross-validation results for analysis and debugging
ALTER TABLE model_coefficients
ADD COLUMN IF NOT EXISTS window_optimization_results JSONB;

COMMENT ON COLUMN model_coefficients.window_optimization_results IS 'Full cross-validation results including MAE/RMSE for each tested window size. Used for analysis and model diagnostics.';

-- Timestamp of last window optimization
ALTER TABLE model_coefficients
ADD COLUMN IF NOT EXISTS window_optimized_at TIMESTAMPTZ;

COMMENT ON COLUMN model_coefficients.window_optimized_at IS 'Timestamp of last cross-validation run for window optimization. CV runs weekly on Sundays.';

-- ============================================================================
-- 2. Add data quality tracking columns to model_coefficients
-- ============================================================================

-- Track data quality metrics from training
ALTER TABLE model_coefficients
ADD COLUMN IF NOT EXISTS data_quality JSONB;

COMMENT ON COLUMN model_coefficients.data_quality IS 'Data quality metrics from training: { totalDays, missingWeather, missingLags, usableDays, outlierCount, fallbacksUsed }';

-- Track model complexity level used (based on sample count)
-- 'full' (60+ samples), 'reduced' (30-59), 'minimal' (14-29), 'fallback' (<14)
ALTER TABLE model_coefficients
ADD COLUMN IF NOT EXISTS model_complexity TEXT DEFAULT 'full';

COMMENT ON COLUMN model_coefficients.model_complexity IS 'Model complexity tier based on available training data: full (60+ samples), reduced (30-59), minimal (14-29), fallback (<14)';

-- ============================================================================
-- 3. Add window optimization tracking to app_settings
-- ============================================================================

ALTER TABLE app_settings
ADD COLUMN IF NOT EXISTS window_last_optimized TIMESTAMPTZ;

COMMENT ON COLUMN app_settings.window_last_optimized IS 'Timestamp of last cross-validation run for optimal window determination. Used by scheduler to trigger weekly CV.';

-- ============================================================================
-- 4. Add training history columns for richer analytics
-- ============================================================================

-- Add optimal window and complexity to training history for trend analysis
ALTER TABLE model_training_history
ADD COLUMN IF NOT EXISTS optimal_training_days INTEGER;

ALTER TABLE model_training_history
ADD COLUMN IF NOT EXISTS model_complexity TEXT;

ALTER TABLE model_training_history
ADD COLUMN IF NOT EXISTS data_quality JSONB;

-- ============================================================================
-- 5. Create index for efficient data quality queries
-- ============================================================================

-- Index on model_complexity for filtering training history by complexity
CREATE INDEX IF NOT EXISTS idx_model_training_history_complexity
ON model_training_history(model_complexity);

-- ============================================================================
-- 6. Update existing row with default values
-- ============================================================================

UPDATE model_coefficients
SET
  optimal_training_days = COALESCE(optimal_training_days, 90),
  drying_pain_weights = COALESCE(drying_pain_weights, '{"humidity": 0.03, "precip": 0.08, "sunDeficit": 0.20}'::JSONB),
  model_complexity = COALESCE(model_complexity, 'full')
WHERE id = 'revenue_prediction';

-- ============================================================================
-- 7. Add helpful view for model status dashboard
-- ============================================================================

CREATE OR REPLACE VIEW model_status AS
SELECT
  mc.id,
  mc.r_squared,
  mc.mae,
  mc.rmse,
  mc.n_training_samples,
  mc.mean_revenue,
  mc.optimal_training_days,
  mc.model_complexity,
  mc.trained_at,
  mc.window_optimized_at,
  mc.data_quality,
  mc.drying_pain_weights,
  EXTRACT(EPOCH FROM (NOW() - mc.trained_at)) / 3600 AS hours_since_training,
  EXTRACT(EPOCH FROM (NOW() - mc.window_optimized_at)) / 3600 AS hours_since_cv,
  -- Model health indicators
  CASE
    WHEN mc.r_squared >= 0.85 THEN 'excellent'
    WHEN mc.r_squared >= 0.75 THEN 'good'
    WHEN mc.r_squared >= 0.60 THEN 'fair'
    ELSE 'poor'
  END AS model_health,
  CASE
    WHEN mc.trained_at > NOW() - INTERVAL '24 hours' THEN 'fresh'
    WHEN mc.trained_at > NOW() - INTERVAL '48 hours' THEN 'recent'
    ELSE 'stale'
  END AS training_status
FROM model_coefficients mc
WHERE mc.id = 'revenue_prediction';

COMMENT ON VIEW model_status IS 'Dashboard view showing current model status, health indicators, and training freshness.';
