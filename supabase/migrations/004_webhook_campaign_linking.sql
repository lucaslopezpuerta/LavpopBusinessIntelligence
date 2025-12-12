-- Migration: Add campaign_id to webhook_events for direct campaign linking
-- Date: 2025-12-12
-- Version: 004
--
-- Purpose: Enable direct campaign linking in webhook_events table
-- Previously, delivery metrics relied solely on joining campaign_contacts.twilio_sid
-- with webhook_events.message_sid. This adds direct campaign_id storage for:
-- 1. Faster queries (no join needed)
-- 2. Fallback when campaign_contacts doesn't have the twilio_sid
-- 3. Better debugging (can see campaign_id directly in webhook_events)

-- ==================== ADD CAMPAIGN_ID COLUMN ====================

-- Add campaign_id column to webhook_events (nullable for backwards compatibility)
ALTER TABLE webhook_events
ADD COLUMN IF NOT EXISTS campaign_id TEXT;

-- Index for querying by campaign
CREATE INDEX IF NOT EXISTS idx_webhook_events_campaign_id
ON webhook_events (campaign_id);

-- ==================== UPDATE VIEW ====================

-- Drop and recreate the view to include both join methods
DROP VIEW IF EXISTS campaign_delivery_metrics;

-- Recreated view with UNION to include both:
-- 1. Messages linked via campaign_contacts.twilio_sid (original method)
-- 2. Messages linked via webhook_events.campaign_id (new direct method)
CREATE OR REPLACE VIEW campaign_delivery_metrics AS
WITH delivery_data AS (
  -- Method 1: Join via campaign_contacts (for messages with campaign_contacts records)
  SELECT
    cc.campaign_id,
    cc.id as contact_id,
    we.message_sid,
    we.payload as status
  FROM campaign_contacts cc
  LEFT JOIN webhook_events we ON we.message_sid = cc.twilio_sid
    AND we.event_type = 'delivery_status'
  WHERE cc.twilio_sid IS NOT NULL

  UNION

  -- Method 2: Direct campaign_id in webhook_events (for messages without campaign_contacts)
  SELECT
    we.campaign_id,
    NULL as contact_id,
    we.message_sid,
    we.payload as status
  FROM webhook_events we
  WHERE we.campaign_id IS NOT NULL
    AND we.event_type = 'delivery_status'
    AND NOT EXISTS (
      SELECT 1 FROM campaign_contacts cc WHERE cc.twilio_sid = we.message_sid
    )
)
SELECT
  dd.campaign_id,
  c.name as campaign_name,
  COUNT(DISTINCT COALESCE(dd.contact_id::TEXT, dd.message_sid)) as total_sent,
  COUNT(DISTINCT CASE WHEN dd.status = 'delivered' THEN dd.message_sid END) as delivered,
  COUNT(DISTINCT CASE WHEN dd.status = 'read' THEN dd.message_sid END) as read,
  COUNT(DISTINCT CASE WHEN dd.status IN ('failed', 'undelivered') THEN dd.message_sid END) as failed,
  ROUND(
    COUNT(DISTINCT CASE WHEN dd.status = 'delivered' THEN dd.message_sid END)::NUMERIC /
    NULLIF(COUNT(DISTINCT COALESCE(dd.contact_id::TEXT, dd.message_sid)), 0) * 100,
    1
  ) as delivery_rate,
  ROUND(
    COUNT(DISTINCT CASE WHEN dd.status = 'read' THEN dd.message_sid END)::NUMERIC /
    NULLIF(COUNT(DISTINCT CASE WHEN dd.status = 'delivered' THEN dd.message_sid END), 0) * 100,
    1
  ) as read_rate
FROM delivery_data dd
JOIN campaigns c ON c.id = dd.campaign_id
GROUP BY dd.campaign_id, c.name;

-- Grant permissions
GRANT SELECT ON campaign_delivery_metrics TO authenticated;

-- ==================== BACKFILL EXISTING DATA ====================

-- Update existing webhook_events with campaign_id from campaign_contacts
UPDATE webhook_events we
SET campaign_id = cc.campaign_id
FROM campaign_contacts cc
WHERE we.message_sid = cc.twilio_sid
  AND we.campaign_id IS NULL
  AND cc.campaign_id IS NOT NULL;

-- ==================== COMMENTS ====================

COMMENT ON COLUMN webhook_events.campaign_id IS 'Campaign ID for direct linking (alternative to joining via campaign_contacts)';

-- ==================== VERIFICATION ====================
-- Run these to verify migration success:
--
-- Check column exists:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'webhook_events' AND column_name = 'campaign_id';
--
-- Check view works:
-- SELECT * FROM campaign_delivery_metrics;
--
-- Check backfill worked:
-- SELECT COUNT(*) FROM webhook_events WHERE campaign_id IS NOT NULL;
