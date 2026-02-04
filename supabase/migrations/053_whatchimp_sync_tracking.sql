-- ============================================================
-- Migration 053: Add WhatChimp sync tracking to app_settings
-- Version: 1.0 (2026-02-03)
--
-- Purpose: Add whatchimp_last_sync JSONB column to store
-- sync history including results and timing.
--
-- Stored data:
-- {
--   "timestamp": "2026-02-03T10:00:00Z",
--   "total": 1862,
--   "created": 0,
--   "updated": 1860,
--   "failed": 2,
--   "duration_seconds": 902
-- }
-- ============================================================

-- Add whatchimp_last_sync column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_settings' AND column_name = 'whatchimp_last_sync'
  ) THEN
    ALTER TABLE app_settings ADD COLUMN whatchimp_last_sync JSONB;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN app_settings.whatchimp_last_sync IS 'Last WhatChimp sync results: {timestamp, total, created, updated, failed, duration_seconds}';
