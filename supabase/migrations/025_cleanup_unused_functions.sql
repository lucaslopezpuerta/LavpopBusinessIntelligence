-- Cleanup Unused Functions Migration
-- Version: 1.0 (2025-12-22)
-- Purpose: Remove batch upsert function that was used for one-time CSV import
--
-- The upsert_weather_daily_metrics_batch function was created for importing
-- historical INMET weather data. Now that the import is complete, this function
-- is no longer needed. The daily weather-sync.js uses individual upserts.

DROP FUNCTION IF EXISTS upsert_weather_daily_metrics_batch(JSONB);

COMMENT ON TABLE weather_daily_metrics IS 'Daily weather data for Caxias do Sul, Brazil. Historical data imported from INMET CSV, daily updates from Visual Crossing API via weather-sync.js.';
