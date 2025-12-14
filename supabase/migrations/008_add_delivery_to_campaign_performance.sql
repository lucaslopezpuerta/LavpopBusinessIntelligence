-- Migration 008: Add delivery metrics to campaign_performance view
-- Date: 2025-12-14
-- Purpose: Include delivery metrics (delivered, read, failed) directly in campaign_performance view
--
-- PROBLEM:
-- Dashboard was making two separate queries:
-- 1. campaign_performance (for return metrics)
-- 2. campaign_delivery_metrics (for delivery metrics)
-- Then merging by campaign_id. If no match in campaign_delivery_metrics, dashboard showed "-"
--
-- SOLUTION:
-- Add delivery_status counts directly to campaign_performance view.
-- Single source of truth - no separate fetch or merge needed.
--
-- NOTE: Removed c.delivered from campaigns table (legacy/unused).
-- The new computed `delivered` column from contact_tracking is the real metric.
--
-- DELIVERY_STATUS VALUES:
-- - pending: Message queued but not sent yet
-- - sent: Message sent to Twilio
-- - delivered: Twilio confirmed delivery to recipient's device
-- - read: Recipient opened/read the message
-- - failed: Twilio failed to send
-- - undelivered: Message sent but couldn't be delivered
-- - not_sent: Message was never sent (legacy cleanup)

-- ==================== DROP AND RECREATE VIEW ====================

DROP VIEW IF EXISTS campaign_performance CASCADE;

CREATE OR REPLACE VIEW campaign_performance AS
SELECT
  -- ===== IDENTITY =====
  c.id,
  c.name,
  c.status,

  -- ===== TIMESTAMPS =====
  c.created_at,
  c.last_sent_at,

  -- ===== CAMPAIGN CONFIG =====
  c.audience,
  c.contact_method,
  c.discount_percent,
  c.coupon_code,
  c.service_type,

  -- ===== SEND VOLUME =====
  c.sends,
  COUNT(DISTINCT ct.id) as contacts_tracked,

  -- ===== DELIVERY METRICS (message delivery from Twilio webhooks) =====
  COUNT(DISTINCT CASE WHEN ct.delivery_status = 'delivered' THEN ct.id END) as delivered,
  COUNT(DISTINCT CASE WHEN ct.delivery_status = 'read' THEN ct.id END) as read,
  COUNT(DISTINCT CASE WHEN ct.delivery_status IN ('failed', 'undelivered') THEN ct.id END) as failed,
  COUNT(DISTINCT CASE WHEN ct.delivery_status = 'sent' THEN ct.id END) as sent_pending,
  ROUND(
    CASE
      WHEN COUNT(DISTINCT ct.id) > 0
      THEN (COUNT(DISTINCT CASE WHEN ct.delivery_status IN ('delivered', 'read') THEN ct.id END)::DECIMAL / COUNT(DISTINCT ct.id)) * 100
      ELSE 0
    END, 1
  ) as delivery_rate,
  ROUND(
    CASE
      WHEN COUNT(DISTINCT CASE WHEN ct.delivery_status IN ('delivered', 'read') THEN ct.id END) > 0
      THEN (COUNT(DISTINCT CASE WHEN ct.delivery_status = 'read' THEN ct.id END)::DECIMAL /
            COUNT(DISTINCT CASE WHEN ct.delivery_status IN ('delivered', 'read') THEN ct.id END)) * 100
      ELSE 0
    END, 1
  ) as read_rate,
  CASE
    WHEN COUNT(DISTINCT CASE WHEN ct.delivery_status IS NOT NULL AND ct.delivery_status != 'pending' THEN ct.id END) > 0
    THEN TRUE
    ELSE FALSE
  END as has_delivery_data,

  -- ===== RETURN METRICS (customer return tracking) =====
  COUNT(DISTINCT CASE WHEN ct.status = 'returned' THEN ct.id END) as contacts_returned,
  ROUND(
    CASE
      WHEN COUNT(DISTINCT ct.id) > 0
      THEN (COUNT(DISTINCT CASE WHEN ct.status = 'returned' THEN ct.id END)::DECIMAL / COUNT(DISTINCT ct.id)) * 100
      ELSE 0
    END, 1
  ) as return_rate,
  COALESCE(SUM(ct.return_revenue), 0) as total_revenue_recovered,
  ROUND(AVG(ct.days_to_return), 1) as avg_days_to_return

FROM campaigns c
LEFT JOIN contact_tracking ct ON c.id = ct.campaign_id
GROUP BY c.id, c.name, c.status, c.created_at, c.last_sent_at, c.audience, c.contact_method, c.discount_percent, c.coupon_code, c.service_type, c.sends;

-- ==================== GRANT PERMISSIONS ====================

GRANT SELECT ON campaign_performance TO authenticated;
GRANT SELECT ON campaign_performance TO anon;

-- ==================== BACKFILL DELIVERY STATUS FROM WEBHOOK_EVENTS ====================
-- The webhook was only updating webhook_events table before v1.5
-- Now we need to sync that data back to contact_tracking for the view to show metrics

-- Update contact_tracking.delivery_status from webhook_events using message_sid
-- webhook_events stores the latest status (delivered, read, etc.) in the payload column
-- Note: we.error_code is TEXT, delivery_error_code is INTEGER - cast needed
UPDATE contact_tracking ct
SET
  delivery_status = we.payload,
  delivery_error_code = NULLIF(we.error_code, '')::INTEGER,
  updated_at = NOW()
FROM webhook_events we
WHERE ct.twilio_sid = we.message_sid
  AND we.event_type = 'delivery_status'
  AND we.payload IS NOT NULL
  AND ct.delivery_status IN ('pending', 'sent')  -- Only update if not already final status
  AND we.payload IN ('delivered', 'read', 'failed', 'undelivered');

-- Also update from campaign_contacts for any legacy data
-- (in case webhook_events doesn't have the record)
UPDATE contact_tracking ct
SET
  delivery_status = cc.delivery_status,
  updated_at = NOW()
FROM campaign_contacts cc
WHERE cc.contact_tracking_id = ct.id
  AND cc.delivery_status IS NOT NULL
  AND ct.delivery_status IN ('pending', 'sent')
  AND cc.delivery_status IN ('delivered', 'read', 'failed', 'undelivered');

-- ==================== VERIFICATION QUERIES ====================
-- Run these after migration to verify the fix worked:

-- Check delivery metrics in campaign_performance:
-- SELECT
--   id, name, sends, contacts_tracked,
--   delivered, read, failed,
--   delivery_rate, read_rate, has_delivery_data
-- FROM campaign_performance
-- WHERE contacts_tracked > 0
-- ORDER BY created_at DESC
-- LIMIT 10;

-- Compare with old campaign_delivery_metrics view:
-- SELECT * FROM campaign_delivery_metrics LIMIT 10;

-- Check delivery_status distribution in contact_tracking:
-- SELECT
--   delivery_status,
--   COUNT(*) as count,
--   ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 1) as pct
-- FROM contact_tracking
-- WHERE campaign_id IS NOT NULL
-- GROUP BY delivery_status
-- ORDER BY count DESC;
