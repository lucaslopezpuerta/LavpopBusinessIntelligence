-- Migration: Fix campaign_performance view to join directly to contact_tracking
-- Date: 2025-12-14
-- Purpose: Remove dependency on campaign_contacts bridge table for performance metrics
--
-- PROBLEM:
-- The campaign_performance view was using a 2-step join:
--   campaigns -> campaign_contacts -> contact_tracking
-- But automation sends created contact_tracking records without always creating
-- campaign_contacts bridge records, causing "Rastreados: 0" despite contacts existing.
--
-- SOLUTION:
-- Join directly from campaigns to contact_tracking using campaign_id.
-- This matches how campaign_effectiveness view works and doesn't require the bridge table.
--
-- NOTE: campaign_contacts table still exists and is useful for tracking delivery status,
-- Twilio SID, and other messaging-specific data. This change only affects the performance view.
--
-- UPDATE v2: Added discount_percent, coupon_code, service_type for A/B testing display

-- ==================== DROP AND RECREATE VIEW ====================

DROP VIEW IF EXISTS campaign_performance CASCADE;

CREATE OR REPLACE VIEW campaign_performance AS
SELECT
  c.id,
  c.name,
  c.audience,
  c.status,
  c.contact_method,
  c.sends,
  c.delivered,
  c.created_at,
  c.last_sent_at,
  -- A/B testing fields (needed for dashboard display)
  c.discount_percent,
  c.coupon_code,
  c.service_type,
  -- Contact tracking metrics (now joined directly via campaign_id)
  COUNT(DISTINCT ct.id) as contacts_tracked,
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
GROUP BY c.id, c.name, c.audience, c.status, c.contact_method, c.sends, c.delivered, c.created_at, c.last_sent_at, c.discount_percent, c.coupon_code, c.service_type;

-- ==================== GRANT PERMISSIONS ====================

GRANT SELECT ON campaign_performance TO authenticated;
GRANT SELECT ON campaign_performance TO anon;

-- ==================== VERIFY ====================
-- Run this query to verify the fix worked:
-- SELECT id, name, sends, contacts_tracked, contacts_returned, return_rate
-- FROM campaign_performance
-- WHERE contacts_tracked > 0 OR sends > 0
-- ORDER BY created_at DESC;
