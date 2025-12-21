-- Weather Daily Metrics Migration
-- Version: 1.0 (2025-12-20)
-- Purpose: Store historical and daily weather data for Caxias do Sul
-- Replaces CSV-based weather loading with Supabase-native data

-- ============================================
-- 1. CREATE WEATHER TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS weather_daily_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,

  -- Core metrics (from CSV + Visual Crossing)
  temp_avg DECIMAL(4,1),              -- Average temperature (°C)
  temp_min DECIMAL(4,1),              -- Minimum temperature
  temp_max DECIMAL(4,1),              -- Maximum temperature
  feels_like DECIMAL(4,1),            -- Feels like temperature
  humidity_avg DECIMAL(4,1),          -- Average humidity (%)
  precipitation DECIMAL(6,2),         -- Precipitation (mm)
  precip_probability INTEGER,         -- Precipitation probability (%)

  -- Extended metrics (Visual Crossing API)
  wind_speed DECIMAL(4,1),            -- Wind speed (km/h)
  wind_direction INTEGER,             -- Wind direction (degrees 0-360)
  pressure DECIMAL(6,1),              -- Atmospheric pressure (hPa)
  uv_index INTEGER,                   -- UV index (0-11+)
  visibility DECIMAL(4,1),            -- Visibility (km)
  cloud_cover INTEGER,                -- Cloud cover (%)

  -- Condition classification
  conditions TEXT,                    -- e.g., "Parcialmente nublado"
  icon TEXT,                          -- Visual Crossing icon code (clear-day, rain, etc.)
  comfort_category TEXT,              -- Computed: abafado, quente, frio, ameno, umido, chuvoso

  -- Solar data
  sunrise TIME,
  sunset TIME,

  -- Metadata
  source TEXT DEFAULT 'visual_crossing', -- 'csv_import' or 'visual_crossing'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE weather_daily_metrics IS 'Daily weather data for Caxias do Sul, Brazil. Historical data from INMET CSV, daily updates from Visual Crossing API.';
COMMENT ON COLUMN weather_daily_metrics.comfort_category IS 'Thermal comfort classification: abafado (feels_like>=27), quente (temp>=23), frio (temp<=10), ameno (10-23), umido (humidity>=80+precip), chuvoso (precip>5mm)';

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

-- Index for date range queries (most common access pattern)
CREATE INDEX IF NOT EXISTS idx_weather_date ON weather_daily_metrics(date DESC);

-- Index for comfort-based analytics
CREATE INDEX IF NOT EXISTS idx_weather_comfort ON weather_daily_metrics(comfort_category);

-- Index for source filtering (csv_import vs visual_crossing)
CREATE INDEX IF NOT EXISTS idx_weather_source ON weather_daily_metrics(source);

-- ============================================
-- 3. AUTO-UPDATE TIMESTAMP TRIGGER
-- ============================================

-- Reuse existing update_updated_at_column function if available
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $$;

CREATE TRIGGER update_weather_timestamp
  BEFORE UPDATE ON weather_daily_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. UPSERT FUNCTION FOR WEATHER DATA
-- ============================================

CREATE OR REPLACE FUNCTION upsert_weather_daily_metrics(
  p_date DATE,
  p_temp_avg DECIMAL(4,1) DEFAULT NULL,
  p_temp_min DECIMAL(4,1) DEFAULT NULL,
  p_temp_max DECIMAL(4,1) DEFAULT NULL,
  p_feels_like DECIMAL(4,1) DEFAULT NULL,
  p_humidity_avg DECIMAL(4,1) DEFAULT NULL,
  p_precipitation DECIMAL(6,2) DEFAULT NULL,
  p_precip_probability INTEGER DEFAULT NULL,
  p_wind_speed DECIMAL(4,1) DEFAULT NULL,
  p_wind_direction INTEGER DEFAULT NULL,
  p_pressure DECIMAL(6,1) DEFAULT NULL,
  p_uv_index INTEGER DEFAULT NULL,
  p_visibility DECIMAL(4,1) DEFAULT NULL,
  p_cloud_cover INTEGER DEFAULT NULL,
  p_conditions TEXT DEFAULT NULL,
  p_icon TEXT DEFAULT NULL,
  p_comfort_category TEXT DEFAULT NULL,
  p_sunrise TIME DEFAULT NULL,
  p_sunset TIME DEFAULT NULL,
  p_source TEXT DEFAULT 'visual_crossing'
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO weather_daily_metrics (
    date, temp_avg, temp_min, temp_max, feels_like, humidity_avg,
    precipitation, precip_probability, wind_speed, wind_direction,
    pressure, uv_index, visibility, cloud_cover, conditions, icon,
    comfort_category, sunrise, sunset, source
  ) VALUES (
    p_date, p_temp_avg, p_temp_min, p_temp_max, p_feels_like, p_humidity_avg,
    p_precipitation, p_precip_probability, p_wind_speed, p_wind_direction,
    p_pressure, p_uv_index, p_visibility, p_cloud_cover, p_conditions, p_icon,
    p_comfort_category, p_sunrise, p_sunset, p_source
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
    wind_direction = COALESCE(EXCLUDED.wind_direction, weather_daily_metrics.wind_direction),
    pressure = COALESCE(EXCLUDED.pressure, weather_daily_metrics.pressure),
    uv_index = COALESCE(EXCLUDED.uv_index, weather_daily_metrics.uv_index),
    visibility = COALESCE(EXCLUDED.visibility, weather_daily_metrics.visibility),
    cloud_cover = COALESCE(EXCLUDED.cloud_cover, weather_daily_metrics.cloud_cover),
    conditions = COALESCE(EXCLUDED.conditions, weather_daily_metrics.conditions),
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
-- 5. BATCH UPSERT FOR CSV MIGRATION
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
      date, temp_avg, humidity_avg, precipitation, comfort_category, source
    ) VALUES (
      (v_record->>'date')::DATE,
      (v_record->>'temp_avg')::DECIMAL(4,1),
      (v_record->>'humidity_avg')::DECIMAL(4,1),
      (v_record->>'precipitation')::DECIMAL(6,2),
      v_record->>'comfort_category',
      COALESCE(v_record->>'source', 'csv_import')
    )
    ON CONFLICT (date) DO UPDATE SET
      temp_avg = COALESCE(EXCLUDED.temp_avg, weather_daily_metrics.temp_avg),
      humidity_avg = COALESCE(EXCLUDED.humidity_avg, weather_daily_metrics.humidity_avg),
      precipitation = COALESCE(EXCLUDED.precipitation, weather_daily_metrics.precipitation),
      comfort_category = COALESCE(EXCLUDED.comfort_category, weather_daily_metrics.comfort_category),
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

COMMENT ON FUNCTION upsert_weather_daily_metrics_batch IS 'Batch upsert for CSV migration. Preserves visual_crossing source if already set.';

-- ============================================
-- 6. COMFORT ANALYTICS VIEW
-- ============================================

CREATE OR REPLACE VIEW weather_comfort_analytics AS
SELECT
  comfort_category,
  COUNT(*) AS days_count,
  ROUND(AVG(temp_avg)::numeric, 1) AS avg_temp,
  ROUND(AVG(humidity_avg)::numeric, 1) AS avg_humidity,
  ROUND(AVG(precipitation)::numeric, 2) AS avg_precipitation,
  MIN(date) AS first_date,
  MAX(date) AS last_date
FROM weather_daily_metrics
WHERE comfort_category IS NOT NULL
  AND date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY comfort_category
ORDER BY days_count DESC;

COMMENT ON VIEW weather_comfort_analytics IS 'Aggregated weather metrics by comfort category for the last 90 days';

-- ============================================
-- 7. ADD WEATHER SYNC TRACKING TO APP_SETTINGS
-- ============================================

-- Add weather_last_sync column to app_settings if it doesn't exist
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
-- 8. GRANT PERMISSIONS (for anon/authenticated)
-- ============================================

-- Enable RLS
ALTER TABLE weather_daily_metrics ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
CREATE POLICY "Allow read access to weather data"
  ON weather_daily_metrics
  FOR SELECT
  USING (true);

-- Allow insert/update via service role (for sync function)
CREATE POLICY "Allow service role to manage weather data"
  ON weather_daily_metrics
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Grant function execution
GRANT EXECUTE ON FUNCTION upsert_weather_daily_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_weather_daily_metrics TO service_role;
GRANT EXECUTE ON FUNCTION upsert_weather_daily_metrics_batch TO service_role;
