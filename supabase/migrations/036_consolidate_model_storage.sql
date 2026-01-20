-- Migration 036: Consolidate Model Storage
-- Version: 3.31 (2026-01-20)
--
-- Purpose: Simplify model storage by consolidating to app_settings
--   - Move model coefficients from dedicated table to app_settings.revenue_model
--   - Drop unused model_training_history table (never read, only written)
--   - Drop model_coefficients table (single-row, now in app_settings)
--   - Clean up associated views and functions
--
-- This reduces complexity and unused tables in the schema.

-- ==================== STEP 1: ADD REVENUE_MODEL COLUMN ====================

ALTER TABLE app_settings
ADD COLUMN IF NOT EXISTS revenue_model JSONB DEFAULT '{}';

COMMENT ON COLUMN app_settings.revenue_model IS
'Cached revenue prediction model (Ridge regression). Contains: beta, feature_names,
r_squared, mae, rmse, n_training_samples, mean_revenue, model_complexity,
lambda, scaler, regression_type, trained_at';

-- ==================== STEP 2: MIGRATE EXISTING MODEL DATA ====================

UPDATE app_settings
SET revenue_model = COALESCE(
  (
    SELECT jsonb_build_object(
      'beta', mc.beta,
      'feature_names', mc.feature_names,
      'r_squared', mc.r_squared,
      'mae', mc.mae,
      'rmse', mc.rmse,
      'n_training_samples', mc.n_training_samples,
      'mean_revenue', mc.mean_revenue,
      'model_complexity', mc.model_complexity,
      'trained_at', mc.trained_at,
      'regression_type', 'ols',
      'lambda', 1.0,
      'scaler', NULL
    )
    FROM model_coefficients mc
    WHERE mc.id = 'revenue_prediction'
  ),
  '{}'::jsonb
)
WHERE revenue_model = '{}' OR revenue_model IS NULL;

-- ==================== STEP 3: DROP ASSOCIATED VIEWS ====================

DROP VIEW IF EXISTS model_status;

-- ==================== STEP 4: DROP ASSOCIATED FUNCTIONS ====================

DROP FUNCTION IF EXISTS cleanup_old_training_history();

-- ==================== STEP 5: DROP UNUSED TABLES ====================

-- model_training_history was never read, only written to
DROP TABLE IF EXISTS model_training_history;

-- model_coefficients is now consolidated into app_settings.revenue_model
DROP TABLE IF EXISTS model_coefficients;

-- ==================== STEP 6: CLEAN UP OLD APP_SETTINGS COLUMNS ====================

-- These columns were used for the old model_coefficients tracking
ALTER TABLE app_settings
DROP COLUMN IF EXISTS revenue_model_last_trained,
DROP COLUMN IF EXISTS window_last_optimized;

-- ==================== VERIFICATION ====================

-- After running this migration, verify with:
-- SELECT revenue_model FROM app_settings;
-- The revenue_model column should contain the migrated model data.

