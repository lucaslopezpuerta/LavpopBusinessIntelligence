-- Migration 065: Replace Meta template analytics with Twilio webhook-based metrics
--
-- Context: Meta's Cloud API template_analytics endpoint cannot track messages sent
-- via Twilio BSP (product_type: cloud_api only). The 15 rows from Dec 9-17 in
-- waba_template_analytics were the only data Meta ever provided.
--
-- Solution: Build per-template metrics from webhook_events (Twilio status callbacks).
-- We already have 663+ messages with delivery_status events including "read" receipts,
-- linked to templates via campaign_id → automation_rules.
--
-- Changes:
-- 1. Create twilio_template_performance view (live, per-template, per-day metrics)
-- 2. Drop stale Meta template objects (view, tables, RPC functions)

-- Step 1: Create the new view
CREATE OR REPLACE VIEW twilio_template_performance AS
WITH per_msg AS (
  SELECT
    message_sid,
    campaign_id,
    MAX(CASE WHEN payload IN ('delivered', 'read') THEN 1 ELSE 0 END) as was_delivered,
    MAX(CASE WHEN payload = 'read' THEN 1 ELSE 0 END) as was_read,
    MAX(CASE WHEN payload = 'undelivered' THEN 1 ELSE 0 END) as was_failed,
    (MIN(created_at) AT TIME ZONE 'America/Sao_Paulo')::date as event_date
  FROM webhook_events
  WHERE event_type = 'delivery_status' AND campaign_id IS NOT NULL
  GROUP BY message_sid, campaign_id
)
SELECT
  ar.campaign_id as template_id,
  ar.name as template_name,
  ar.id as local_template_id,
  'MARKETING' as category,
  'APPROVED' as status,
  pm.event_date as bucket_date,
  COUNT(*)::int as sent,
  SUM(was_delivered)::int as delivered,
  SUM(was_read)::int as read_count,
  CASE WHEN COUNT(*) > 0
    THEN ROUND(SUM(was_delivered)::numeric / COUNT(*) * 100, 1)
    ELSE 0 END as delivery_rate,
  CASE WHEN SUM(was_delivered) > 0
    THEN ROUND(SUM(was_read)::numeric / SUM(was_delivered) * 100, 1)
    ELSE 0 END as read_rate
FROM per_msg pm
JOIN automation_rules ar ON ar.campaign_id = pm.campaign_id
GROUP BY ar.campaign_id, ar.name, ar.id, pm.event_date
ORDER BY pm.event_date DESC, ar.name;

-- Step 2: Drop stale Meta template objects
DROP VIEW IF EXISTS waba_template_analytics_view;
DROP TABLE IF EXISTS waba_template_analytics;
DROP TABLE IF EXISTS waba_templates;
DROP FUNCTION IF EXISTS upsert_waba_templates(jsonb);
DROP FUNCTION IF EXISTS upsert_waba_template_analytics(jsonb);
