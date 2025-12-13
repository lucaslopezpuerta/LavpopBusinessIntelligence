-- Migration: Schema Cleanup v1.0
-- Date: 2025-12-13
-- Purpose: Remove unused columns identified in schema audit
--
-- This migration removes columns that have no code reading or writing to them.
-- All DROP COLUMN statements use IF EXISTS for safety (idempotent).
--
-- AUDIT FINDINGS:
-- - campaigns.recipient_snapshot: Never populated, was for storing recipients at send time
-- - campaigns.created_by: Never populated, no user auth system
-- - campaigns.error_message: Never populated, errors tracked in campaign_contacts instead
-- - campaigns.scheduled_for: Redundant, scheduling uses scheduled_campaigns table
-- - campaigns.opened: Initialized to 0 but never updated (no webhook tracking)
-- - campaigns.converted: Initialized to 0 but never updated (no conversion tracking)
-- - comm_logs.expires_at: Expiration handled in contact_tracking.expires_at instead
--
-- KEPT (has dependencies):
-- - campaigns.delivered: Used in campaign_performance view and frontend UI
--
-- RUN THIS MIGRATION:
-- Execute in Supabase SQL Editor or via CLI

-- ==================== CAMPAIGNS TABLE CLEANUP ====================

-- Remove recipient_snapshot (never populated)
ALTER TABLE campaigns DROP COLUMN IF EXISTS recipient_snapshot;

-- Remove created_by (never populated, no user auth)
ALTER TABLE campaigns DROP COLUMN IF EXISTS created_by;

-- Remove error_message (errors tracked in campaign_contacts.error_message instead)
ALTER TABLE campaigns DROP COLUMN IF EXISTS error_message;

-- Remove scheduled_for (scheduling uses scheduled_campaigns table)
ALTER TABLE campaigns DROP COLUMN IF EXISTS scheduled_for;

-- Remove opened (initialized but never updated - no webhook tracking for opens)
ALTER TABLE campaigns DROP COLUMN IF EXISTS opened;

-- Remove converted (initialized but never updated - no conversion tracking implemented)
ALTER TABLE campaigns DROP COLUMN IF EXISTS converted;

-- ==================== COMM_LOGS TABLE CLEANUP ====================

-- Remove expires_at (expiration logic is in contact_tracking.expires_at)
ALTER TABLE comm_logs DROP COLUMN IF EXISTS expires_at;

-- ==================== ADD MISSING INDEX ====================

-- Add unique index on campaign_contacts.twilio_sid for faster webhook lookups
-- This column is used to link Twilio delivery status webhooks to campaign contacts
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_contacts_twilio_sid
ON campaign_contacts(twilio_sid) WHERE twilio_sid IS NOT NULL;

-- ==================== VERIFICATION ====================

-- After running this migration, verify the cleanup:
--
-- Check campaigns table columns:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'campaigns' ORDER BY ordinal_position;
--
-- Check comm_logs table columns:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'comm_logs' ORDER BY ordinal_position;
--
-- Check the new index:
-- SELECT indexname FROM pg_indexes WHERE tablename = 'campaign_contacts';

-- ==================== ROLLBACK (if needed) ====================
-- To rollback, add the columns back (data will be lost):
--
-- ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS recipient_snapshot JSONB;
-- ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS created_by TEXT;
-- ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS error_message TEXT;
-- ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;
-- ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS opened INT DEFAULT 0;
-- ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS converted INT DEFAULT 0;
-- ALTER TABLE comm_logs ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
