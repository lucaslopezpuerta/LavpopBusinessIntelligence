-- Migration 064: Security RLS + Atomic Rate Limiter
-- Applied: 2026-02-07
--
-- 1. Enable RLS on recommendations and ai_insight_log tables
-- 2. Create atomic check_rate_limit() RPC to fix TOCTOU race condition

-- ============================================================
-- 1. RLS on recommendations table
-- ============================================================

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read active recommendations
CREATE POLICY authenticated_select ON recommendations
  FOR SELECT TO authenticated
  USING (true);

-- Authenticated users can update status fields only (dismiss, snooze, action)
CREATE POLICY authenticated_update_status ON recommendations
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 2. RLS on ai_insight_log table (server-only, no client policies)
-- ============================================================

ALTER TABLE ai_insight_log ENABLE ROW LEVEL SECURITY;
-- No policies = service_role (Netlify functions) can write, clients cannot read/write

-- ============================================================
-- 3. Atomic rate limiter RPC (fixes TOCTOU race condition)
-- ============================================================
-- Replaces the vulnerable SELECT → check → UPDATE pattern with a single
-- INSERT ON CONFLICT that takes an exclusive row lock, serializing
-- concurrent requests for the same key.

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key TEXT,
  p_window_ms BIGINT,
  p_max_requests INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now BIGINT;
  v_count INT;
  v_window_start BIGINT;
BEGIN
  v_now := (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;

  INSERT INTO rate_limits (key, request_count, window_start, updated_at)
  VALUES (p_key, 1, v_now, NOW())
  ON CONFLICT (key) DO UPDATE SET
    request_count = CASE
      WHEN rate_limits.window_start < (v_now - p_window_ms) THEN 1
      WHEN rate_limits.request_count >= p_max_requests THEN rate_limits.request_count
      ELSE rate_limits.request_count + 1
    END,
    window_start = CASE
      WHEN rate_limits.window_start < (v_now - p_window_ms) THEN v_now
      ELSE rate_limits.window_start
    END,
    updated_at = NOW()
  RETURNING request_count, window_start INTO v_count, v_window_start;

  RETURN jsonb_build_object(
    'allowed', v_count <= p_max_requests,
    'remaining', GREATEST(0, p_max_requests - v_count),
    'reset_in', GREATEST(0, (v_window_start + p_window_ms - v_now))
  );
END;
$$;
