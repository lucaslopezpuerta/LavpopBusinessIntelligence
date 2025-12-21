-- Migration: 026_model_coefficients.sql
-- Date: 2025-12-21
-- Description: Create tables for revenue prediction model persistence
--
-- Phase 2 of the OLS regression model implementation:
--   - model_coefficients: Stores current trained model (single-row table)
--   - model_training_history: Historical training runs for drift detection
--   - app_settings.revenue_model_last_trained: Track last training time

-- ============================================================================
-- 1. Model Coefficients Table (stores current trained model)
-- ============================================================================

CREATE TABLE IF NOT EXISTS model_coefficients (
  id TEXT PRIMARY KEY DEFAULT 'revenue_prediction',

  -- Model coefficients (JSON array: [β₀, β₁, β₂, β₃, β₄, β₅, β₆])
  beta JSONB NOT NULL DEFAULT '[]',
  feature_names JSONB NOT NULL DEFAULT '[]',  -- ['intercept', 'rev_lag_1', 'rev_lag_7', ...]

  -- Model metrics
  r_squared DECIMAL(5,4),        -- e.g., 0.8523
  mae DECIMAL(10,2),             -- Mean Absolute Error in R$
  rmse DECIMAL(10,2),            -- Root Mean Square Error
  mean_revenue DECIMAL(10,2),    -- Training data mean (for baseline comparison)
  n_training_samples INTEGER,    -- Number of samples used

  -- Training metadata
  trained_at TIMESTAMPTZ DEFAULT NOW(),
  training_period_start DATE,
  training_period_end DATE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize with empty coefficients (will be populated on first training)
INSERT INTO model_coefficients (id, beta, feature_names)
VALUES ('revenue_prediction', '[]', '[]')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE model_coefficients IS 'Stores trained OLS regression model coefficients for revenue prediction. Single-row table like app_settings.';
COMMENT ON COLUMN model_coefficients.beta IS 'Array of β coefficients: [intercept, rev_lag_1, rev_lag_7, is_weekend, drying_pain, is_rainy, heavy_rain]';
COMMENT ON COLUMN model_coefficients.r_squared IS 'Coefficient of determination (0-1). Target: >0.80';
COMMENT ON COLUMN model_coefficients.mae IS 'Mean Absolute Error in R$. Target: <R$200/day';

-- ============================================================================
-- 2. Model Training History Table (for drift detection)
-- ============================================================================

CREATE TABLE IF NOT EXISTS model_training_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id TEXT NOT NULL DEFAULT 'revenue_prediction',

  -- Metrics at time of training
  r_squared DECIMAL(5,4),
  mae DECIMAL(10,2),
  rmse DECIMAL(10,2),
  n_training_samples INTEGER,

  -- Training details
  training_period_start DATE,
  training_period_end DATE,
  trained_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying recent history
CREATE INDEX IF NOT EXISTS idx_model_training_history_date
ON model_training_history(trained_at DESC);

COMMENT ON TABLE model_training_history IS 'Historical training runs for monitoring model drift over time.';

-- ============================================================================
-- 3. Cleanup function for old training history (keep 90 days)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_training_history()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM model_training_history
  WHERE trained_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_training_history IS 'Removes training history older than 90 days. Call monthly to keep table size manageable.';

-- ============================================================================
-- 4. Add revenue_model_last_trained to app_settings
-- ============================================================================

ALTER TABLE app_settings
ADD COLUMN IF NOT EXISTS revenue_model_last_trained TIMESTAMPTZ;

COMMENT ON COLUMN app_settings.revenue_model_last_trained IS 'Timestamp of last revenue model training run. Used by scheduler to determine if daily retrain is needed.';
