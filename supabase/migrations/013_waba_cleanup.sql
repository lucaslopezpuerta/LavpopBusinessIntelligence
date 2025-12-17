-- Migration 013: WABA Analytics Cleanup
-- Version: 3.22 (2025-12-17)
--
-- Removes unused WABA objects after production testing revealed:
-- - Conversation analytics: Meta API doesn't return data for this account
-- - Read metrics: Not available at account level (only per-template)
-- - Backfill: No longer needed, data already synced
--
-- This migration removes:
-- - waba_conversation_analytics table (and indexes)
-- - upsert_waba_conversations() function
-- - waba_backfill_cursor column from app_settings
-- - Updates views to only use message analytics

-- ==================== DROP CONVERSATION ANALYTICS ====================

-- Drop the conversation analytics table (will cascade to indexes)
DROP TABLE IF EXISTS waba_conversation_analytics CASCADE;

-- Drop the upsert function for conversations
DROP FUNCTION IF EXISTS upsert_waba_conversations(JSONB);

-- ==================== REMOVE BACKFILL CURSOR COLUMN ====================

-- Remove deprecated backfill cursor column from app_settings
ALTER TABLE app_settings DROP COLUMN IF EXISTS waba_backfill_cursor;

-- ==================== UPDATE VIEWS (MESSAGE-ONLY) ====================

-- Drop existing views first
DROP VIEW IF EXISTS waba_analytics_summary;
DROP VIEW IF EXISTS waba_daily_metrics;

-- Recreate summary view (message metrics only)
CREATE OR REPLACE VIEW waba_analytics_summary AS
SELECT
  -- Date range
  MIN(bucket_date) AS first_date,
  MAX(bucket_date) AS last_date,

  -- Message metrics
  SUM(sent) AS total_sent,
  SUM(delivered) AS total_delivered,

  -- Delivery rate
  CASE
    WHEN SUM(sent) > 0
    THEN ROUND(SUM(delivered)::DECIMAL / SUM(sent) * 100, 1)
    ELSE 0
  END AS delivery_rate

FROM waba_message_analytics;

COMMENT ON VIEW waba_analytics_summary IS 'Aggregated WABA message analytics summary. Use for KPI cards.';

-- Recreate daily metrics view (message metrics only)
CREATE OR REPLACE VIEW waba_daily_metrics AS
SELECT
  bucket_date,

  -- Message metrics (aggregated by date in case of multiple phone numbers)
  SUM(sent) AS sent,
  SUM(delivered) AS delivered,

  -- Daily delivery rate
  CASE
    WHEN SUM(sent) > 0
    THEN ROUND(SUM(delivered)::DECIMAL / SUM(sent) * 100, 1)
    ELSE 0
  END AS delivery_rate

FROM waba_message_analytics
GROUP BY bucket_date
ORDER BY bucket_date DESC;

COMMENT ON VIEW waba_daily_metrics IS 'Daily WABA message metrics for time series charts.';

-- ==================== UPDATE GRANTS ====================

-- Revoke grants on dropped objects (if they exist, this is a no-op if already dropped)
-- Note: DROP TABLE/FUNCTION CASCADE already handles this, but being explicit

-- Grant select on updated views
GRANT SELECT ON waba_analytics_summary TO authenticated;
GRANT SELECT ON waba_daily_metrics TO authenticated;

-- ==================== VERIFICATION ====================

-- Run these queries after migration to verify cleanup:
-- SELECT COUNT(*) FROM waba_message_analytics;  -- Should show your message data
-- SELECT * FROM waba_analytics_summary;          -- Should show message totals
-- SELECT * FROM waba_daily_metrics LIMIT 5;      -- Should show daily metrics
-- \d app_settings                                 -- Should NOT have waba_backfill_cursor
