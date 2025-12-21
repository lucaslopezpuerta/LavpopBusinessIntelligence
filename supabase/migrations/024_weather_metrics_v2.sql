-- Weather Daily Metrics V2 Migration
-- Version: 2.0 (2025-12-20)
-- Purpose: Drop and recreate weather schema to match Visual Crossing API response
--
-- Changes from V1:
-- - wind_direction: INTEGER → DECIMAL(5,1) (API returns 17.8, not 17)
-- - cloud_cover: INTEGER → DECIMAL(5,1) (API returns 13.6, not 13)
-- - uv_index: INTEGER → DECIMAL(3,1) (API returns 10.0)
-- - precip_probability: INTEGER → DECIMAL(5,1) (API returns 54.8)
-- - sunrise/sunset: TIME → TEXT (API returns "05:22:16" string)
-- - Added description field from API

-- ============================================
-- 1. DROP EXISTING OBJECTS (if they exist)
-- ============================================

-- Drop policies, trigger safely (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'weather_daily_metrics') THEN
    DROP POLICY IF EXISTS "Allow read access to weather data" ON weather_daily_metrics;
    DROP POLICY IF EXISTS "Allow service role to manage weather data" ON weather_daily_metrics;
    DROP POLICY IF EXISTS "weather_read_all" ON weather_daily_metrics;
    DROP POLICY IF EXISTS "weather_insert_authenticated" ON weather_daily_metrics;
    DROP POLICY IF EXISTS "weather_update_authenticated" ON weather_daily_metrics;
    DROP TRIGGER IF EXISTS update_weather_timestamp ON weather_daily_metrics;
  END IF;
END $$;

-- Drop views
DROP VIEW IF EXISTS weather_comfort_analytics;
DROP VIEW IF EXISTS weather_forecast;

-- Drop functions (with various signatures that may exist)
DROP FUNCTION IF EXISTS upsert_weather_daily_metrics_batch(JSONB);
DROP FUNCTION IF EXISTS upsert_weather_daily_metrics(
  DATE, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, INTEGER,
  DECIMAL, INTEGER, DECIMAL, INTEGER, DECIMAL, INTEGER, TEXT, TEXT, TEXT, TIME, TIME, TEXT
);
DROP FUNCTION IF EXISTS upsert_weather_daily_metrics(
  DATE, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL,
  DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL,
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
);

-- Drop table (CASCADE handles remaining dependencies)
DROP TABLE IF EXISTS weather_daily_metrics CASCADE;

-- ============================================
-- 2. CREATE WEATHER TABLE (V2)
-- ============================================

CREATE TABLE weather_daily_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,

  -- Core temperature metrics (from Visual Crossing API)
  temp_avg DECIMAL(4,1),              -- Average temperature (°C) - from "temp"
  temp_min DECIMAL(4,1),              -- Minimum temperature - from "tempmin"
  temp_max DECIMAL(4,1),              -- Maximum temperature - from "tempmax"
  feels_like DECIMAL(4,1),            -- Feels like temperature - from "feelslike"

  -- Humidity & Precipitation
  humidity_avg DECIMAL(5,1),          -- Average humidity (%) - from "humidity"
  precipitation DECIMAL(6,2),         -- Precipitation total (mm) - from "precip"
  precip_probability DECIMAL(5,1),    -- Precipitation probability (%) - from "precipprob"

  -- Wind
  wind_speed DECIMAL(5,1),            -- Wind speed (km/h) - from "windspeed"
  wind_gust DECIMAL(5,1),             -- Wind gust (km/h) - from "windgust"
  wind_direction DECIMAL(5,1),        -- Wind direction (degrees 0-360) - from "winddir"

  -- Atmospheric
  pressure DECIMAL(6,1),              -- Atmospheric pressure (hPa) - from "pressure"
  visibility DECIMAL(5,1),            -- Visibility (km) - from "visibility"
  cloud_cover DECIMAL(5,1),           -- Cloud cover (%) - from "cloudcover"
  uv_index DECIMAL(3,1),              -- UV index (0-11+) - from "uvindex"
  dew_point DECIMAL(4,1),             -- Dew point (°C) - from "dew"

  -- Condition classification
  conditions TEXT,                    -- e.g., "Clear", "Rain, Overcast" - from "conditions"
  description TEXT,                   -- Full description - from "description"
  icon TEXT,                          -- Icon code (clear-day, rain, etc.) - from "icon"
  comfort_category TEXT,              -- Computed: abafado, quente, frio, ameno, umido, chuvoso

  -- Solar data (stored as TEXT since API returns "05:22:16" format)
  sunrise TEXT,                       -- Sunrise time "HH:MM:SS" - from "sunrise"
  sunset TEXT,                        -- Sunset time "HH:MM:SS" - from "sunset"

  -- Metadata
  source TEXT DEFAULT 'visual_crossing', -- 'csv_import', 'visual_crossing', 'obs', 'fcst'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE weather_daily_metrics IS 'Daily weather data for Caxias do Sul, Brazil. Historical from INMET CSV, daily updates from Visual Crossing API.';
COMMENT ON COLUMN weather_daily_metrics.comfort_category IS 'Thermal comfort: abafado (feels>=27), quente (temp>=23), frio (temp<=10), chuvoso (precip>5mm), umido (humidity>=80+precip), ameno (default)';
COMMENT ON COLUMN weather_daily_metrics.source IS 'Data source: csv_import (INMET historical), visual_crossing (API sync), obs (observed), fcst (forecast)';

-- ============================================
-- 3. CREATE INDEXES
-- ============================================

CREATE INDEX idx_weather_date ON weather_daily_metrics(date DESC);
CREATE INDEX idx_weather_comfort ON weather_daily_metrics(comfort_category);
CREATE INDEX idx_weather_source ON weather_daily_metrics(source);
-- Note: Partial index with CURRENT_DATE removed (non-immutable function not allowed in index predicate)
-- The idx_weather_date index above is sufficient for date range queries

-- ============================================
-- 4. AUTO-UPDATE TIMESTAMP TRIGGER
-- ============================================

-- Create function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_weather_timestamp
  BEFORE UPDATE ON weather_daily_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. UPSERT FUNCTION FOR WEATHER DATA
-- ============================================

CREATE OR REPLACE FUNCTION upsert_weather_daily_metrics(
  p_date DATE,
  p_temp_avg DECIMAL DEFAULT NULL,
  p_temp_min DECIMAL DEFAULT NULL,
  p_temp_max DECIMAL DEFAULT NULL,
  p_feels_like DECIMAL DEFAULT NULL,
  p_humidity_avg DECIMAL DEFAULT NULL,
  p_precipitation DECIMAL DEFAULT NULL,
  p_precip_probability DECIMAL DEFAULT NULL,
  p_wind_speed DECIMAL DEFAULT NULL,
  p_wind_gust DECIMAL DEFAULT NULL,
  p_wind_direction DECIMAL DEFAULT NULL,
  p_pressure DECIMAL DEFAULT NULL,
  p_visibility DECIMAL DEFAULT NULL,
  p_cloud_cover DECIMAL DEFAULT NULL,
  p_uv_index DECIMAL DEFAULT NULL,
  p_dew_point DECIMAL DEFAULT NULL,
  p_conditions TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_icon TEXT DEFAULT NULL,
  p_comfort_category TEXT DEFAULT NULL,
  p_sunrise TEXT DEFAULT NULL,
  p_sunset TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'visual_crossing'
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO weather_daily_metrics (
    date, temp_avg, temp_min, temp_max, feels_like, humidity_avg,
    precipitation, precip_probability, wind_speed, wind_gust, wind_direction,
    pressure, visibility, cloud_cover, uv_index, dew_point,
    conditions, description, icon, comfort_category, sunrise, sunset, source
  ) VALUES (
    p_date, p_temp_avg, p_temp_min, p_temp_max, p_feels_like, p_humidity_avg,
    p_precipitation, p_precip_probability, p_wind_speed, p_wind_gust, p_wind_direction,
    p_pressure, p_visibility, p_cloud_cover, p_uv_index, p_dew_point,
    p_conditions, p_description, p_icon, p_comfort_category, p_sunrise, p_sunset, p_source
  )
  ON CONFLICT (date) DO UPDATE SET
    temp_avg = COALESCE(EXCLUDED.temp_avg, weather_daily_metrics.temp_avg),
    temp_min = COALESCE(EXCLUDED.temp_min, weather_daily_metrics.temp_min),
    temp_max = COALESCE(EXCLUDED.temp_max, weather_daily_metrics.temp_max),
    feels_like = COALESCE(EXCLUDED.feels_like, weather_daily_metrics.feels_like),
    humidity_avg = COALESCE(EXCLUDED.humidity_avg, weather_daily_metrics.humidity_avg),
    precipitation = COALESCE(EXCLUDED.precipitation, weather_daily_metrics.precipitation),
    precip_probability = COALESCE(EXCLUDED.precip_probability, weather_daily_metrics.precip_probability),
    wind_speed = COALESCE(EXCLUDED.wind_speed, weather_daily_metrics.wind_speed),
    wind_gust = COALESCE(EXCLUDED.wind_gust, weather_daily_metrics.wind_gust),
    wind_direction = COALESCE(EXCLUDED.wind_direction, weather_daily_metrics.wind_direction),
    pressure = COALESCE(EXCLUDED.pressure, weather_daily_metrics.pressure),
    visibility = COALESCE(EXCLUDED.visibility, weather_daily_metrics.visibility),
    cloud_cover = COALESCE(EXCLUDED.cloud_cover, weather_daily_metrics.cloud_cover),
    uv_index = COALESCE(EXCLUDED.uv_index, weather_daily_metrics.uv_index),
    dew_point = COALESCE(EXCLUDED.dew_point, weather_daily_metrics.dew_point),
    conditions = COALESCE(EXCLUDED.conditions, weather_daily_metrics.conditions),
    description = COALESCE(EXCLUDED.description, weather_daily_metrics.description),
    icon = COALESCE(EXCLUDED.icon, weather_daily_metrics.icon),
    comfort_category = COALESCE(EXCLUDED.comfort_category, weather_daily_metrics.comfort_category),
    sunrise = COALESCE(EXCLUDED.sunrise, weather_daily_metrics.sunrise),
    sunset = COALESCE(EXCLUDED.sunset, weather_daily_metrics.sunset),
    source = EXCLUDED.source,
    updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION upsert_weather_daily_metrics IS 'Upsert a single weather record. Uses COALESCE to preserve existing data when new values are NULL.';

-- ============================================
-- 6. BATCH UPSERT FOR CSV MIGRATION
-- ============================================

CREATE OR REPLACE FUNCTION upsert_weather_daily_metrics_batch(
  p_records JSONB
)
RETURNS INTEGER AS $$
DECLARE
  v_record JSONB;
  v_count INTEGER := 0;
BEGIN
  FOR v_record IN SELECT * FROM jsonb_array_elements(p_records)
  LOOP
    INSERT INTO weather_daily_metrics (
      date, temp_avg, temp_min, temp_max, feels_like,
      humidity_avg, precipitation, precip_probability,
      wind_speed, wind_gust, wind_direction,
      pressure, visibility, cloud_cover, uv_index, dew_point,
      conditions, description, icon, comfort_category,
      sunrise, sunset, source
    ) VALUES (
      (v_record->>'date')::DATE,
      (v_record->>'temp_avg')::DECIMAL,
      (v_record->>'temp_min')::DECIMAL,
      (v_record->>'temp_max')::DECIMAL,
      (v_record->>'feels_like')::DECIMAL,
      (v_record->>'humidity_avg')::DECIMAL,
      (v_record->>'precipitation')::DECIMAL,
      (v_record->>'precip_probability')::DECIMAL,
      (v_record->>'wind_speed')::DECIMAL,
      (v_record->>'wind_gust')::DECIMAL,
      (v_record->>'wind_direction')::DECIMAL,
      (v_record->>'pressure')::DECIMAL,
      (v_record->>'visibility')::DECIMAL,
      (v_record->>'cloud_cover')::DECIMAL,
      (v_record->>'uv_index')::DECIMAL,
      (v_record->>'dew_point')::DECIMAL,
      v_record->>'conditions',
      v_record->>'description',
      v_record->>'icon',
      v_record->>'comfort_category',
      v_record->>'sunrise',
      v_record->>'sunset',
      COALESCE(v_record->>'source', 'csv_import')
    )
    ON CONFLICT (date) DO UPDATE SET
      temp_avg = COALESCE(EXCLUDED.temp_avg, weather_daily_metrics.temp_avg),
      temp_min = COALESCE(EXCLUDED.temp_min, weather_daily_metrics.temp_min),
      temp_max = COALESCE(EXCLUDED.temp_max, weather_daily_metrics.temp_max),
      feels_like = COALESCE(EXCLUDED.feels_like, weather_daily_metrics.feels_like),
      humidity_avg = COALESCE(EXCLUDED.humidity_avg, weather_daily_metrics.humidity_avg),
      precipitation = COALESCE(EXCLUDED.precipitation, weather_daily_metrics.precipitation),
      precip_probability = COALESCE(EXCLUDED.precip_probability, weather_daily_metrics.precip_probability),
      wind_speed = COALESCE(EXCLUDED.wind_speed, weather_daily_metrics.wind_speed),
      wind_gust = COALESCE(EXCLUDED.wind_gust, weather_daily_metrics.wind_gust),
      wind_direction = COALESCE(EXCLUDED.wind_direction, weather_daily_metrics.wind_direction),
      pressure = COALESCE(EXCLUDED.pressure, weather_daily_metrics.pressure),
      visibility = COALESCE(EXCLUDED.visibility, weather_daily_metrics.visibility),
      cloud_cover = COALESCE(EXCLUDED.cloud_cover, weather_daily_metrics.cloud_cover),
      uv_index = COALESCE(EXCLUDED.uv_index, weather_daily_metrics.uv_index),
      dew_point = COALESCE(EXCLUDED.dew_point, weather_daily_metrics.dew_point),
      conditions = COALESCE(EXCLUDED.conditions, weather_daily_metrics.conditions),
      description = COALESCE(EXCLUDED.description, weather_daily_metrics.description),
      icon = COALESCE(EXCLUDED.icon, weather_daily_metrics.icon),
      comfort_category = COALESCE(EXCLUDED.comfort_category, weather_daily_metrics.comfort_category),
      sunrise = COALESCE(EXCLUDED.sunrise, weather_daily_metrics.sunrise),
      sunset = COALESCE(EXCLUDED.sunset, weather_daily_metrics.sunset),
      source = CASE
        WHEN weather_daily_metrics.source = 'visual_crossing' THEN weather_daily_metrics.source
        ELSE COALESCE(EXCLUDED.source, weather_daily_metrics.source)
      END,
      updated_at = NOW();

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION upsert_weather_daily_metrics_batch IS 'Batch upsert weather records from JSON array. Preserves visual_crossing source.';

-- ============================================
-- 7. COMFORT ANALYTICS VIEW
-- ============================================

CREATE OR REPLACE VIEW weather_comfort_analytics AS
SELECT
  comfort_category,
  COUNT(*) AS days_count,
  ROUND(AVG(temp_avg)::numeric, 1) AS avg_temp,
  ROUND(AVG(humidity_avg)::numeric, 1) AS avg_humidity,
  ROUND(AVG(precipitation)::numeric, 2) AS avg_precipitation,
  ROUND(AVG(wind_speed)::numeric, 1) AS avg_wind_speed,
  ROUND(AVG(uv_index)::numeric, 1) AS avg_uv_index,
  MIN(date) AS first_date,
  MAX(date) AS last_date
FROM weather_daily_metrics
WHERE comfort_category IS NOT NULL
  AND date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY comfort_category
ORDER BY days_count DESC;

COMMENT ON VIEW weather_comfort_analytics IS 'Aggregated weather metrics by comfort category for the last 90 days';

-- ============================================
-- 8. WEATHER FORECAST VIEW (next 7 days)
-- ============================================

CREATE OR REPLACE VIEW weather_forecast AS
SELECT
  date,
  temp_avg,
  temp_min,
  temp_max,
  feels_like,
  humidity_avg,
  precipitation,
  precip_probability,
  wind_speed,
  conditions,
  description,
  icon,
  comfort_category,
  sunrise,
  sunset
FROM weather_daily_metrics
WHERE date >= CURRENT_DATE
  AND date <= CURRENT_DATE + INTERVAL '7 days'
ORDER BY date ASC;

COMMENT ON VIEW weather_forecast IS '7-day weather forecast from stored API data';

-- ============================================
-- 9. ADD WEATHER SYNC TRACKING TO APP_SETTINGS
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_settings' AND column_name = 'weather_last_sync'
  ) THEN
    ALTER TABLE app_settings ADD COLUMN weather_last_sync TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================
-- 10. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE weather_daily_metrics ENABLE ROW LEVEL SECURITY;

-- Allow read access for everyone (public weather data)
CREATE POLICY "weather_read_all"
  ON weather_daily_metrics
  FOR SELECT
  USING (true);

-- Allow insert/update for authenticated users and service role
CREATE POLICY "weather_insert_authenticated"
  ON weather_daily_metrics
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "weather_update_authenticated"
  ON weather_daily_metrics
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 11. GRANT PERMISSIONS
-- ============================================

GRANT SELECT ON weather_daily_metrics TO anon;
GRANT SELECT ON weather_daily_metrics TO authenticated;
GRANT ALL ON weather_daily_metrics TO service_role;

GRANT SELECT ON weather_comfort_analytics TO anon;
GRANT SELECT ON weather_comfort_analytics TO authenticated;

GRANT SELECT ON weather_forecast TO anon;
GRANT SELECT ON weather_forecast TO authenticated;

GRANT EXECUTE ON FUNCTION upsert_weather_daily_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_weather_daily_metrics TO service_role;
GRANT EXECUTE ON FUNCTION upsert_weather_daily_metrics_batch TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_weather_daily_metrics_batch TO service_role;
