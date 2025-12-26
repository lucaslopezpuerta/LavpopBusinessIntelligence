-- Migration 030: Rate limits table for API rate limiting
-- Version: 1.0 (2025-12-26)
-- Purpose: Store rate limit counters for serverless functions

-- Create rate_limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,                          -- Format: "endpoint:ip_address"
  request_count INTEGER NOT NULL DEFAULT 0,      -- Number of requests in current window
  window_start BIGINT NOT NULL,                  -- Unix timestamp (ms) when window started
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for cleanup queries (expired entries)
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start);

-- Add comment
COMMENT ON TABLE rate_limits IS 'Rate limiting counters for API endpoints (sliding window)';

-- Function to clean up expired rate limit entries (older than 5 minutes)
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
  five_minutes_ago BIGINT;
BEGIN
  -- Calculate timestamp 5 minutes ago (in milliseconds)
  five_minutes_ago := (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT - (5 * 60 * 1000);

  -- Delete expired entries
  DELETE FROM rate_limits
  WHERE window_start < five_minutes_ago;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$;

-- Grant access to service role
GRANT ALL ON rate_limits TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_rate_limits() TO service_role;

-- RLS: Only service role can access (API functions use service key)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- No public access - only service role
CREATE POLICY "Service role has full access to rate_limits" ON rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
