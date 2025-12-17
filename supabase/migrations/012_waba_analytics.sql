-- Migration 012: WhatsApp Business API Analytics
-- Version: 3.21 (2025-12-17)
--
-- Stores WhatsApp Business analytics from Meta Graph API for:
-- - Message delivery metrics (sent, delivered) - Primary use case
-- - Billable conversation tracking (may not be available for all accounts)
--
-- Note: Read metrics not available at account level (only per-template via Meta API)
--
-- Tables:
-- - waba_message_analytics: Message delivery metrics (sent, delivered)
-- - waba_conversation_analytics: Billable conversations (data availability varies by account)
--
-- Design:
-- - Daily granularity for metrics tracking
-- - Unique indexes prevent duplicate data on re-sync
-- - Idempotent upsert functions for safe sync operations

-- ==================== CONVERSATION ANALYTICS (BILLABLE) ====================

CREATE TABLE IF NOT EXISTS waba_conversation_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Identifiers
  waba_id TEXT NOT NULL,
  phone_number_id TEXT DEFAULT '',  -- Campaign phone number (empty string for account-level)

  -- Time bucket
  bucket_date DATE NOT NULL,

  -- Dimensions
  conversation_category TEXT NOT NULL,  -- MARKETING, UTILITY, AUTHENTICATION, SERVICE
  country_code TEXT DEFAULT '',          -- ISO 3166-1 alpha-2 (e.g., 'BR'), empty if not specified

  -- Metrics
  conversation_count INTEGER NOT NULL DEFAULT 0,
  cost DECIMAL(10,4) NOT NULL DEFAULT 0,  -- Cost in account currency (BRL)

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique index to prevent duplicates on re-sync
CREATE UNIQUE INDEX IF NOT EXISTS idx_waba_conv_unique
ON waba_conversation_analytics(waba_id, bucket_date, conversation_category, country_code, phone_number_id);

-- Indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_waba_conv_date ON waba_conversation_analytics(bucket_date);
CREATE INDEX IF NOT EXISTS idx_waba_conv_category ON waba_conversation_analytics(conversation_category);
CREATE INDEX IF NOT EXISTS idx_waba_conv_country ON waba_conversation_analytics(country_code) WHERE country_code != '';

COMMENT ON TABLE waba_conversation_analytics IS 'WhatsApp Business billable conversation analytics from Meta Graph API. Tracks conversation counts and costs by category and country.';

-- ==================== MESSAGE ANALYTICS (DELIVERY METRICS) ====================

CREATE TABLE IF NOT EXISTS waba_message_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Identifiers
  waba_id TEXT NOT NULL,
  phone_number_id TEXT DEFAULT '',  -- Campaign phone number (empty string for account-level)

  -- Time bucket
  bucket_date DATE NOT NULL,

  -- Metrics
  sent INTEGER NOT NULL DEFAULT 0,
  delivered INTEGER NOT NULL DEFAULT 0,
  read_count INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique index to prevent duplicates on re-sync
CREATE UNIQUE INDEX IF NOT EXISTS idx_waba_msg_unique
ON waba_message_analytics(waba_id, bucket_date, phone_number_id);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_waba_msg_date ON waba_message_analytics(bucket_date);

COMMENT ON TABLE waba_message_analytics IS 'WhatsApp Business message delivery analytics from Meta Graph API. Tracks sent and delivered counts. Note: read_count is always 0 (not available at account level).';

-- ==================== SYNC TRACKING (in app_settings) ====================

ALTER TABLE app_settings
ADD COLUMN IF NOT EXISTS waba_last_sync TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS waba_backfill_cursor DATE;

COMMENT ON COLUMN app_settings.waba_last_sync IS 'Timestamp of last WABA analytics sync from Meta API';
COMMENT ON COLUMN app_settings.waba_backfill_cursor IS '(Deprecated) Progress marker for WABA backfill job';

-- ==================== UPSERT FUNCTION: CONVERSATIONS ====================

CREATE OR REPLACE FUNCTION upsert_waba_conversations(p_data JSONB)
RETURNS INTEGER AS $$
DECLARE
  v_row JSONB;
  v_count INTEGER := 0;
BEGIN
  -- p_data is an array of conversation records:
  -- [{waba_id, phone_number_id, bucket_date, conversation_category, country_code, conversation_count, cost}, ...]

  FOR v_row IN SELECT * FROM jsonb_array_elements(p_data)
  LOOP
    INSERT INTO waba_conversation_analytics (
      waba_id,
      phone_number_id,
      bucket_date,
      conversation_category,
      country_code,
      conversation_count,
      cost,
      updated_at
    ) VALUES (
      v_row->>'waba_id',
      v_row->>'phone_number_id',
      (v_row->>'bucket_date')::DATE,
      v_row->>'conversation_category',
      v_row->>'country_code',
      COALESCE((v_row->>'conversation_count')::INTEGER, 0),
      COALESCE((v_row->>'cost')::DECIMAL, 0),
      NOW()
    )
    ON CONFLICT (waba_id, bucket_date, conversation_category, country_code, phone_number_id)
    DO UPDATE SET
      conversation_count = EXCLUDED.conversation_count,
      cost = EXCLUDED.cost,
      updated_at = NOW();

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION upsert_waba_conversations IS 'Idempotent upsert for WABA conversation analytics. Safe to call multiple times with same data.';

-- ==================== UPSERT FUNCTION: MESSAGES ====================

CREATE OR REPLACE FUNCTION upsert_waba_messages(p_data JSONB)
RETURNS INTEGER AS $$
DECLARE
  v_row JSONB;
  v_count INTEGER := 0;
BEGIN
  -- p_data is an array of message records:
  -- [{waba_id, phone_number_id, bucket_date, sent, delivered, read_count}, ...]

  FOR v_row IN SELECT * FROM jsonb_array_elements(p_data)
  LOOP
    INSERT INTO waba_message_analytics (
      waba_id,
      phone_number_id,
      bucket_date,
      sent,
      delivered,
      read_count,
      updated_at
    ) VALUES (
      v_row->>'waba_id',
      v_row->>'phone_number_id',
      (v_row->>'bucket_date')::DATE,
      COALESCE((v_row->>'sent')::INTEGER, 0),
      COALESCE((v_row->>'delivered')::INTEGER, 0),
      COALESCE((v_row->>'read_count')::INTEGER, 0),
      NOW()
    )
    ON CONFLICT (waba_id, bucket_date, phone_number_id)
    DO UPDATE SET
      sent = EXCLUDED.sent,
      delivered = EXCLUDED.delivered,
      read_count = EXCLUDED.read_count,
      updated_at = NOW();

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION upsert_waba_messages IS 'Idempotent upsert for WABA message analytics. Safe to call multiple times with same data.';

-- ==================== SUMMARY VIEW ====================

CREATE OR REPLACE VIEW waba_analytics_summary AS
SELECT
  -- Date range
  MIN(c.bucket_date) AS first_date,
  MAX(c.bucket_date) AS last_date,

  -- Conversation metrics (billable)
  SUM(c.conversation_count) AS total_conversations,
  SUM(c.cost) AS total_cost,

  -- By category
  SUM(CASE WHEN c.conversation_category = 'MARKETING' THEN c.conversation_count ELSE 0 END) AS marketing_conversations,
  SUM(CASE WHEN c.conversation_category = 'MARKETING' THEN c.cost ELSE 0 END) AS marketing_cost,
  SUM(CASE WHEN c.conversation_category = 'UTILITY' THEN c.conversation_count ELSE 0 END) AS utility_conversations,
  SUM(CASE WHEN c.conversation_category = 'UTILITY' THEN c.cost ELSE 0 END) AS utility_cost,
  SUM(CASE WHEN c.conversation_category = 'SERVICE' THEN c.conversation_count ELSE 0 END) AS service_conversations,
  SUM(CASE WHEN c.conversation_category = 'SERVICE' THEN c.cost ELSE 0 END) AS service_cost,

  -- Message metrics
  (SELECT SUM(sent) FROM waba_message_analytics) AS total_sent,
  (SELECT SUM(delivered) FROM waba_message_analytics) AS total_delivered,
  (SELECT SUM(read_count) FROM waba_message_analytics) AS total_read,

  -- Delivery rates
  CASE
    WHEN (SELECT SUM(sent) FROM waba_message_analytics) > 0
    THEN ROUND((SELECT SUM(delivered)::DECIMAL FROM waba_message_analytics) / (SELECT SUM(sent) FROM waba_message_analytics) * 100, 1)
    ELSE 0
  END AS delivery_rate,
  CASE
    WHEN (SELECT SUM(delivered) FROM waba_message_analytics) > 0
    THEN ROUND((SELECT SUM(read_count)::DECIMAL FROM waba_message_analytics) / (SELECT SUM(delivered) FROM waba_message_analytics) * 100, 1)
    ELSE 0
  END AS read_rate

FROM waba_conversation_analytics c;

COMMENT ON VIEW waba_analytics_summary IS 'Aggregated WABA analytics summary across all time. Use for KPI cards.';

-- ==================== DAILY METRICS VIEW ====================

CREATE OR REPLACE VIEW waba_daily_metrics AS
SELECT
  COALESCE(c.bucket_date, m.bucket_date) AS bucket_date,

  -- Conversation metrics
  COALESCE(SUM(c.conversation_count), 0) AS conversations,
  COALESCE(SUM(c.cost), 0) AS cost,

  -- Category breakdown
  COALESCE(SUM(CASE WHEN c.conversation_category = 'MARKETING' THEN c.conversation_count ELSE 0 END), 0) AS marketing_conversations,
  COALESCE(SUM(CASE WHEN c.conversation_category = 'MARKETING' THEN c.cost ELSE 0 END), 0) AS marketing_cost,

  -- Message metrics
  COALESCE(m.sent, 0) AS sent,
  COALESCE(m.delivered, 0) AS delivered,
  COALESCE(m.read_count, 0) AS read_count,

  -- Daily rates
  CASE WHEN m.sent > 0 THEN ROUND(m.delivered::DECIMAL / m.sent * 100, 1) ELSE 0 END AS delivery_rate,
  CASE WHEN m.delivered > 0 THEN ROUND(m.read_count::DECIMAL / m.delivered * 100, 1) ELSE 0 END AS read_rate

FROM waba_conversation_analytics c
FULL OUTER JOIN (
  SELECT bucket_date, SUM(sent) as sent, SUM(delivered) as delivered, SUM(read_count) as read_count
  FROM waba_message_analytics
  GROUP BY bucket_date
) m ON c.bucket_date = m.bucket_date
GROUP BY COALESCE(c.bucket_date, m.bucket_date), m.sent, m.delivered, m.read_count
ORDER BY bucket_date DESC;

COMMENT ON VIEW waba_daily_metrics IS 'Daily WABA metrics for time series charts. Joins conversation and message analytics.';
