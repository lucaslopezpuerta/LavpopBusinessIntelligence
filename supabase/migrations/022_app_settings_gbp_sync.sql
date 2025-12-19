-- ============================================================
-- Migration 022: Add GBP sync tracking to app_settings
-- Version: 1.0 (2025-12-19)
--
-- Purpose: Create app_settings table if not exists and add
-- Google Business Profile sync timestamp column.
-- ============================================================

-- Create app_settings table if it doesn't exist
-- NOTE: Original migration 011 creates this table with id TEXT DEFAULT 'default'
-- This CREATE is only for fresh databases; existing ones skip due to IF NOT EXISTS
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Sync timestamps
  blacklist_last_sync TIMESTAMPTZ,
  twilio_last_sync TIMESTAMPTZ,
  instagram_last_sync TIMESTAMPTZ,
  gbp_last_sync TIMESTAMPTZ,

  -- Location tracking
  gbp_location_id TEXT
);

-- Insert default row if not exists
INSERT INTO app_settings (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

-- Add columns if table already existed without them
DO $$
BEGIN
  -- Add gbp_last_sync if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_settings' AND column_name = 'gbp_last_sync'
  ) THEN
    ALTER TABLE app_settings ADD COLUMN gbp_last_sync TIMESTAMPTZ;
  END IF;

  -- Add gbp_location_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_settings' AND column_name = 'gbp_location_id'
  ) THEN
    ALTER TABLE app_settings ADD COLUMN gbp_location_id TEXT;
  END IF;

  -- Add other sync columns if missing (for completeness)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_settings' AND column_name = 'blacklist_last_sync'
  ) THEN
    ALTER TABLE app_settings ADD COLUMN blacklist_last_sync TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_settings' AND column_name = 'twilio_last_sync'
  ) THEN
    ALTER TABLE app_settings ADD COLUMN twilio_last_sync TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_settings' AND column_name = 'instagram_last_sync'
  ) THEN
    ALTER TABLE app_settings ADD COLUMN instagram_last_sync TIMESTAMPTZ;
  END IF;
END $$;

-- Permissions
GRANT SELECT, UPDATE ON app_settings TO authenticated;
GRANT SELECT ON app_settings TO anon;

COMMENT ON TABLE app_settings IS 'Application-wide settings and sync timestamps. Single row table.';
COMMENT ON COLUMN app_settings.gbp_last_sync IS 'Last successful Google Business Profile sync timestamp';
COMMENT ON COLUMN app_settings.gbp_location_id IS 'Auto-discovered GBP location ID for caching';
