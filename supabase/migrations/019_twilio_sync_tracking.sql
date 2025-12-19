-- Migration 019: Twilio & Blacklist Sync Tracking
-- Version: 3.27 (2025-12-19)
--
-- Adds sync tracking columns to app_settings table:
-- - twilio_last_sync: Twilio engagement/cost sync (campaign-scheduler.js)
-- - blacklist_last_sync: Blacklist sync (opt-outs + undelivered)
--
-- Both syncs run every 4 hours via campaign-scheduler.js
--
-- Run in Supabase SQL Editor

-- ==================== APP SETTINGS COLUMNS ====================

-- Twilio engagement/cost sync tracking
ALTER TABLE app_settings
ADD COLUMN IF NOT EXISTS twilio_last_sync TIMESTAMPTZ;

COMMENT ON COLUMN app_settings.twilio_last_sync IS 'Timestamp of last Twilio engagement/cost sync. Scheduler syncs every 4 hours.';

-- Blacklist sync tracking (opt-outs + undelivered)
ALTER TABLE app_settings
ADD COLUMN IF NOT EXISTS blacklist_last_sync TIMESTAMPTZ;

COMMENT ON COLUMN app_settings.blacklist_last_sync IS 'Timestamp of last blacklist sync (opt-outs + undelivered). Scheduler syncs every 4 hours.';
