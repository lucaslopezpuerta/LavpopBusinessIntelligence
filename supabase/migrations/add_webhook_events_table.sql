-- Migration: Add webhook_events table for Twilio delivery tracking
-- Date: 2025-12-12
-- Purpose: Store delivery status updates from Twilio webhooks
--          Enables real delivery rate calculation instead of estimates

-- ==================== CREATE TABLE ====================

CREATE TABLE IF NOT EXISTS webhook_events (
  id SERIAL PRIMARY KEY,
  message_sid TEXT NOT NULL,           -- Twilio Message SID (unique per message)
  phone TEXT,                          -- Phone number (normalized)
  event_type TEXT NOT NULL,            -- 'delivery_status', 'button_click', etc.
  payload TEXT,                        -- Status: 'sent', 'delivered', 'read', 'failed', 'undelivered'
  error_code TEXT,                     -- Twilio error code if failed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== INDEXES ====================

-- Index for looking up by message_sid (for upserts)
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_message_sid
ON webhook_events (message_sid);

-- Index for querying by phone
CREATE INDEX IF NOT EXISTS idx_webhook_events_phone
ON webhook_events (phone);

-- Index for querying by event_type and status
CREATE INDEX IF NOT EXISTS idx_webhook_events_type_payload
ON webhook_events (event_type, payload);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at
ON webhook_events (created_at DESC);

-- ==================== COMMENTS ====================

COMMENT ON TABLE webhook_events IS 'Stores Twilio webhook events for delivery tracking and engagement metrics';
COMMENT ON COLUMN webhook_events.message_sid IS 'Twilio Message SID - unique identifier for each message';
COMMENT ON COLUMN webhook_events.phone IS 'Recipient phone number (normalized, digits only)';
COMMENT ON COLUMN webhook_events.event_type IS 'Event type: delivery_status, button_click, etc.';
COMMENT ON COLUMN webhook_events.payload IS 'For delivery_status: sent/delivered/read/failed/undelivered. For button_click: the payload.';
COMMENT ON COLUMN webhook_events.error_code IS 'Twilio error code for failed messages (e.g., 63024)';

-- ==================== GRANTS ====================

-- Allow authenticated users to read/write
GRANT SELECT, INSERT, UPDATE ON webhook_events TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE webhook_events_id_seq TO authenticated;

-- ==================== HELPER VIEW ====================

-- View for delivery metrics by campaign
CREATE OR REPLACE VIEW campaign_delivery_metrics AS
SELECT
  cc.campaign_id,
  c.name as campaign_name,
  COUNT(DISTINCT cc.id) as total_sent,
  COUNT(DISTINCT CASE WHEN we.payload = 'delivered' THEN we.message_sid END) as delivered,
  COUNT(DISTINCT CASE WHEN we.payload = 'read' THEN we.message_sid END) as read,
  COUNT(DISTINCT CASE WHEN we.payload IN ('failed', 'undelivered') THEN we.message_sid END) as failed,
  ROUND(
    COUNT(DISTINCT CASE WHEN we.payload = 'delivered' THEN we.message_sid END)::NUMERIC /
    NULLIF(COUNT(DISTINCT cc.id), 0) * 100,
    1
  ) as delivery_rate,
  ROUND(
    COUNT(DISTINCT CASE WHEN we.payload = 'read' THEN we.message_sid END)::NUMERIC /
    NULLIF(COUNT(DISTINCT CASE WHEN we.payload = 'delivered' THEN we.message_sid END), 0) * 100,
    1
  ) as read_rate
FROM campaign_contacts cc
JOIN campaigns c ON c.id = cc.campaign_id
LEFT JOIN webhook_events we ON we.message_sid = cc.twilio_sid
  AND we.event_type = 'delivery_status'
GROUP BY cc.campaign_id, c.name;

GRANT SELECT ON campaign_delivery_metrics TO authenticated;
