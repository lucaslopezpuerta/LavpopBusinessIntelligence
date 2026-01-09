-- Migration: 033_tracking_failures.sql
-- Version: 3.30 (2026-01-08)
-- Purpose: Create tracking_failures table for manual campaign error recovery
--
-- This table stores failed contact_tracking inserts for manual recovery.
-- The supabase-api.js v3.9 fallback chain logs here when Level 1 and Level 2 fail.

-- Create tracking_failures table for error recovery
CREATE TABLE IF NOT EXISTS tracking_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  customer_name TEXT,
  phone TEXT,
  twilio_sid TEXT,
  error_message TEXT,
  error_code TEXT,
  full_context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  resolution_notes TEXT
);

-- Index for finding unresolved failures
CREATE INDEX IF NOT EXISTS idx_tracking_failures_unresolved
ON tracking_failures (campaign_id, created_at)
WHERE resolved_at IS NULL;

-- Index for looking up by twilio_sid (for recovery via webhook)
CREATE INDEX IF NOT EXISTS idx_tracking_failures_twilio_sid
ON tracking_failures (twilio_sid)
WHERE twilio_sid IS NOT NULL;

-- Comment explaining the table purpose
COMMENT ON TABLE tracking_failures IS 'Stores failed contact_tracking inserts for manual recovery. Populated by supabase-api.js v3.9 fallback chain.';

-- Function to retry failed tracking (can be called manually from Supabase Dashboard)
CREATE OR REPLACE FUNCTION retry_failed_tracking(p_failure_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_failure RECORD;
  v_tracking_id UUID;
BEGIN
  -- Get the failure record
  SELECT * INTO v_failure FROM tracking_failures WHERE id = p_failure_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Failure record not found');
  END IF;

  IF v_failure.resolved_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already resolved');
  END IF;

  -- Try to insert into contact_tracking
  INSERT INTO contact_tracking (
    customer_id,
    customer_name,
    contact_method,
    campaign_id,
    status,
    contacted_at,
    expires_at,
    phone,
    twilio_sid,
    delivery_status
  )
  VALUES (
    v_failure.customer_id,
    COALESCE(v_failure.customer_name, 'Unknown'),
    'whatsapp',
    v_failure.campaign_id,
    'pending',
    v_failure.created_at,
    v_failure.created_at + INTERVAL '10 days',
    v_failure.phone,
    v_failure.twilio_sid,
    CASE WHEN v_failure.twilio_sid IS NOT NULL THEN 'sent' ELSE 'pending' END
  )
  RETURNING id INTO v_tracking_id;

  -- Mark as resolved
  UPDATE tracking_failures
  SET
    resolved_at = NOW(),
    resolved_by = 'retry_failed_tracking',
    resolution_notes = 'Successfully created contact_tracking record: ' || v_tracking_id::TEXT
  WHERE id = p_failure_id;

  RETURN jsonb_build_object(
    'success', true,
    'tracking_id', v_tracking_id,
    'message', 'Successfully created contact_tracking record'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', 'Insert still failing - may need manual intervention'
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION retry_failed_tracking(UUID) TO service_role;

-- Add helpful view for monitoring unresolved failures
CREATE OR REPLACE VIEW tracking_failures_pending AS
SELECT
  id,
  campaign_id,
  customer_id,
  customer_name,
  phone,
  twilio_sid,
  error_message,
  created_at,
  DATE_PART('hour', NOW() - created_at) AS hours_ago
FROM tracking_failures
WHERE resolved_at IS NULL
ORDER BY created_at DESC;

COMMENT ON VIEW tracking_failures_pending IS 'Shows unresolved tracking failures for manual review';
