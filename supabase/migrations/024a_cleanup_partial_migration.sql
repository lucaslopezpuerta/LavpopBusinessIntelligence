-- Cleanup script for partial migration failure
-- Run this FIRST if 024_weather_metrics_v2.sql failed partway through
-- Then re-run 024_weather_metrics_v2.sql

-- Drop any indexes that may have been created
DROP INDEX IF EXISTS idx_weather_date;
DROP INDEX IF EXISTS idx_weather_comfort;
DROP INDEX IF EXISTS idx_weather_source;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_weather_timestamp ON weather_daily_metrics;

-- Drop table (this will also drop any remaining indexes)
DROP TABLE IF EXISTS weather_daily_metrics CASCADE;

-- Now you can run 024_weather_metrics_v2.sql safely
