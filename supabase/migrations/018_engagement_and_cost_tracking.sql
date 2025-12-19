-- Migration 018: Engagement and Cost Tracking
-- Version: 3.25 (2025-12-19)
--
-- This migration adds:
-- 1. engagement_type and engaged_at columns to contact_tracking
-- 2. message_cost columns for per-message cost tracking
-- 3. twilio_daily_costs table for aggregated cost reporting
--
-- Run in Supabase SQL Editor

-- ==================== CONTACT TRACKING COLUMNS ====================

-- v3.25.1: Add engagement tracking columns
-- engagement_type: The button/response type (button_positive, button_optout, other)
-- engaged_at: Timestamp when customer responded
ALTER TABLE contact_tracking
ADD COLUMN IF NOT EXISTS engagement_type TEXT,
ADD COLUMN IF NOT EXISTS engaged_at TIMESTAMPTZ;

-- v3.25.2: Add cost tracking columns per message
-- message_cost: Cost in the currency (from Twilio price field)
-- message_cost_currency: Currency code (usually USD)
ALTER TABLE contact_tracking
ADD COLUMN IF NOT EXISTS message_cost DECIMAL(10,6),
ADD COLUMN IF NOT EXISTS message_cost_currency TEXT;

-- Index for engagement analytics
CREATE INDEX IF NOT EXISTS idx_contact_tracking_engagement
ON contact_tracking (engagement_type, engaged_at DESC)
WHERE engagement_type IS NOT NULL;

-- ==================== TWILIO DAILY COSTS TABLE ====================

-- Aggregated daily costs for budget tracking
-- This avoids storing every message cost in detail
CREATE TABLE IF NOT EXISTS twilio_daily_costs (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,                    -- The day
  outbound_count INT DEFAULT 0,          -- Number of outbound messages
  outbound_cost DECIMAL(10,4) DEFAULT 0, -- Total outbound cost
  inbound_count INT DEFAULT 0,           -- Number of inbound messages
  inbound_cost DECIMAL(10,4) DEFAULT 0,  -- Total inbound cost (usually $0)
  currency TEXT DEFAULT 'USD',           -- Currency (from Twilio)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT twilio_daily_costs_date_key UNIQUE (date)
);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_twilio_daily_costs_date
ON twilio_daily_costs (date DESC);

-- ==================== UPSERT FUNCTION ====================

-- Function to upsert daily costs (called after fetching Twilio data)
CREATE OR REPLACE FUNCTION upsert_twilio_daily_costs(
  p_date DATE,
  p_outbound_count INT DEFAULT 0,
  p_outbound_cost DECIMAL DEFAULT 0,
  p_inbound_count INT DEFAULT 0,
  p_inbound_cost DECIMAL DEFAULT 0,
  p_currency TEXT DEFAULT 'USD'
)
RETURNS twilio_daily_costs AS $$
DECLARE
  result twilio_daily_costs;
BEGIN
  INSERT INTO twilio_daily_costs (date, outbound_count, outbound_cost, inbound_count, inbound_cost, currency)
  VALUES (p_date, p_outbound_count, p_outbound_cost, p_inbound_count, p_inbound_cost, p_currency)
  ON CONFLICT (date) DO UPDATE SET
    outbound_count = twilio_daily_costs.outbound_count + EXCLUDED.outbound_count,
    outbound_cost = twilio_daily_costs.outbound_cost + EXCLUDED.outbound_cost,
    inbound_count = twilio_daily_costs.inbound_count + EXCLUDED.inbound_count,
    inbound_cost = twilio_daily_costs.inbound_cost + EXCLUDED.inbound_cost,
    updated_at = NOW()
  RETURNING * INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ==================== COMMENT ====================

COMMENT ON COLUMN contact_tracking.engagement_type IS 'Type of customer engagement: button_positive (wants offer), button_optout (declined), other (free text)';
COMMENT ON COLUMN contact_tracking.engaged_at IS 'Timestamp when customer responded to the message';
COMMENT ON COLUMN contact_tracking.message_cost IS 'Cost of sending this message in currency (from Twilio price field)';
COMMENT ON COLUMN contact_tracking.message_cost_currency IS 'Currency code for message_cost (usually USD)';
COMMENT ON TABLE twilio_daily_costs IS 'Aggregated daily messaging costs from Twilio for budget tracking';
