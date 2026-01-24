-- Migration: 038_new_automation_triggers.sql
-- Date: 2026-01-24
-- Description: Add support for new automation types and one-time send tracking
--
-- Changes:
--   1. Add one-time tracking columns for welcome and post_visit campaigns
--   2. Add weather campaign cooldown tracking
--   3. Add anniversary milestone tracking
--   4. Add bypass_global_cooldown flag to automation_rules
--   5. Update is_customer_contactable() to support bypass and new campaign types
--   6. Change default global cooldown from 7 to 5 days
--   7. Add indexes for efficient queries

-- =====================================================
-- Part A: One-time automation tracking
-- =====================================================
-- These columns track whether one-time campaigns have been sent to each customer

ALTER TABLE customers ADD COLUMN IF NOT EXISTS welcome_sent_at TIMESTAMPTZ;
COMMENT ON COLUMN customers.welcome_sent_at IS 'Timestamp when welcome message was sent (one-time only)';

ALTER TABLE customers ADD COLUMN IF NOT EXISTS post_visit_sent_at TIMESTAMPTZ;
COMMENT ON COLUMN customers.post_visit_sent_at IS 'Timestamp when post-visit feedback request was sent (one-time only)';

-- =====================================================
-- Part B: New automation tracking columns
-- =====================================================

-- Weather campaign cooldown (separate from global cooldown)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_weather_campaign_date DATE;
COMMENT ON COLUMN customers.last_weather_campaign_date IS 'Date of last weather-triggered campaign (14-day cooldown)';

-- Anniversary milestone tracking (to know which year we last celebrated)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_anniversary_year INTEGER DEFAULT 0;
COMMENT ON COLUMN customers.last_anniversary_year IS 'Last anniversary year celebrated (1, 2, 3, etc.)';

-- =====================================================
-- Part C: Automation rules enhancement
-- =====================================================

-- Allow certain automations (like anniversary) to bypass global cooldown
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS bypass_global_cooldown BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN automation_rules.bypass_global_cooldown IS 'If true, this automation ignores global cooldown (for special occasions)';

-- =====================================================
-- Part D: Update is_customer_contactable() function
-- =====================================================

-- Drop ALL existing function variants first (signature changed with new p_bypass_global parameter)
-- Using CASCADE to handle any dependent objects
DROP FUNCTION IF EXISTS is_customer_contactable(TEXT) CASCADE;
DROP FUNCTION IF EXISTS is_customer_contactable(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS is_customer_contactable(TEXT, TEXT, INT) CASCADE;
DROP FUNCTION IF EXISTS is_customer_contactable(TEXT, TEXT, INT, INT) CASCADE;
DROP FUNCTION IF EXISTS is_customer_contactable(TEXT, TEXT, INT, INT, BOOLEAN) CASCADE;

CREATE OR REPLACE FUNCTION is_customer_contactable(
  p_customer_id TEXT,
  p_campaign_type TEXT DEFAULT NULL,
  p_min_days_global INT DEFAULT 5,  -- CHANGED: was 7, now 5 (better for 22-day avg visit cycle)
  p_min_days_same_type INT DEFAULT 30,
  p_bypass_global BOOLEAN DEFAULT FALSE  -- NEW: allows skipping global cooldown for special occasions
)
RETURNS TABLE (
  is_contactable BOOLEAN,
  reason TEXT,
  last_contact_date DATE,
  days_since_contact INTEGER
) AS $$
DECLARE
  v_last_global_contact DATE;
  v_last_same_type_contact DATE;
  v_days_global INTEGER;
  v_days_same_type INTEGER;
  v_is_blacklisted BOOLEAN;
  v_opted_out_at TIMESTAMPTZ;
BEGIN
  -- Check blacklist first
  SELECT EXISTS(
    SELECT 1 FROM blacklist
    WHERE phone = (SELECT telefone FROM customers WHERE doc = p_customer_id)
  ) INTO v_is_blacklisted;

  IF v_is_blacklisted THEN
    RETURN QUERY SELECT FALSE, 'Customer is blacklisted'::TEXT, NULL::DATE, NULL::INTEGER;
    RETURN;
  END IF;

  -- Check for opt-out button click (90 day block)
  SELECT MAX(contacted_at) INTO v_opted_out_at
  FROM contact_tracking
  WHERE customer_id = p_customer_id
    AND button_clicked = 'optout'
    AND contacted_at > CURRENT_TIMESTAMP - INTERVAL '90 days';

  IF v_opted_out_at IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, 'Customer opted out recently'::TEXT, v_opted_out_at::DATE,
      EXTRACT(DAY FROM CURRENT_TIMESTAMP - v_opted_out_at)::INTEGER;
    RETURN;
  END IF;

  -- Get last contact date for ANY campaign type (global cooldown)
  SELECT MAX(contacted_at::DATE),
         CURRENT_DATE - MAX(contacted_at::DATE)
  INTO v_last_global_contact, v_days_global
  FROM contact_tracking
  WHERE customer_id = p_customer_id
    AND status NOT IN ('failed', 'cancelled');

  -- Check global cooldown (unless bypassed for special occasions like anniversary)
  IF NOT p_bypass_global AND v_days_global IS NOT NULL AND v_days_global < p_min_days_global THEN
    RETURN QUERY SELECT FALSE,
      format('Global cooldown: %s days since last contact (min: %s)', v_days_global, p_min_days_global)::TEXT,
      v_last_global_contact, v_days_global;
    RETURN;
  END IF;

  -- If campaign type specified, check same-type cooldown
  IF p_campaign_type IS NOT NULL THEN
    -- Determine same-type cooldown based on campaign type
    DECLARE
      v_type_cooldown INTEGER;
    BEGIN
      v_type_cooldown := CASE p_campaign_type
        WHEN 'winback' THEN 21      -- CHANGED: was 30, now 21 (faster re-engagement)
        WHEN 'welcome' THEN 365     -- One-time (enforced via column, but kept as fallback)
        WHEN 'wallet' THEN 14
        WHEN 'post_visit' THEN 365  -- One-time (enforced via column, but kept as fallback)
        WHEN 'rfm_loyalty' THEN 30  -- NEW: Monthly VIP recognition
        WHEN 'weather' THEN 14      -- NEW: Weather-specific cooldown
        WHEN 'anniversary' THEN 365 -- NEW: Annual event
        WHEN 'churned' THEN 21      -- NEW: Aggressive recovery
        ELSE p_min_days_same_type
      END;

      SELECT MAX(contacted_at::DATE),
             CURRENT_DATE - MAX(contacted_at::DATE)
      INTO v_last_same_type_contact, v_days_same_type
      FROM contact_tracking
      WHERE customer_id = p_customer_id
        AND campaign_type = p_campaign_type
        AND status NOT IN ('failed', 'cancelled');

      IF v_days_same_type IS NOT NULL AND v_days_same_type < v_type_cooldown THEN
        RETURN QUERY SELECT FALSE,
          format('Same-type cooldown: %s days since last %s campaign (min: %s)',
                 v_days_same_type, p_campaign_type, v_type_cooldown)::TEXT,
          v_last_same_type_contact, v_days_same_type;
        RETURN;
      END IF;
    END;
  END IF;

  -- Customer is contactable
  RETURN QUERY SELECT TRUE, 'Customer is eligible for contact'::TEXT,
    COALESCE(v_last_global_contact, v_last_same_type_contact),
    COALESCE(v_days_global, v_days_same_type);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION is_customer_contactable IS 'Check if customer can be contacted based on cooldown rules. v2.0: Added bypass_global parameter, new campaign types, reduced global cooldown to 5 days, reduced winback cooldown to 21 days';

-- =====================================================
-- Part E: Batch eligibility check (updated)
-- =====================================================

-- Drop ALL existing function variants first (signature changed with new p_bypass_global parameter)
-- Using CASCADE to handle any dependent objects
DROP FUNCTION IF EXISTS check_customers_eligibility(TEXT[]) CASCADE;
DROP FUNCTION IF EXISTS check_customers_eligibility(TEXT[], TEXT) CASCADE;
DROP FUNCTION IF EXISTS check_customers_eligibility(TEXT[], TEXT, INT) CASCADE;
DROP FUNCTION IF EXISTS check_customers_eligibility(TEXT[], TEXT, INT, INT) CASCADE;
DROP FUNCTION IF EXISTS check_customers_eligibility(TEXT[], TEXT, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS check_customers_eligibility(TEXT[], TEXT, INT, INT, BOOLEAN) CASCADE;

CREATE OR REPLACE FUNCTION check_customers_eligibility(
  p_customer_ids TEXT[],
  p_campaign_type TEXT DEFAULT NULL,
  p_bypass_global BOOLEAN DEFAULT FALSE  -- NEW parameter
)
RETURNS TABLE (
  customer_id TEXT,
  is_contactable BOOLEAN,
  reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cid,
    (is_customer_contactable(cid, p_campaign_type, 5, 30, p_bypass_global)).is_contactable,
    (is_customer_contactable(cid, p_campaign_type, 5, 30, p_bypass_global)).reason
  FROM unnest(p_customer_ids) AS cid;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION check_customers_eligibility IS 'Batch check customer eligibility for campaigns. v2.0: Added bypass_global parameter';

-- =====================================================
-- Part F: Indexes for efficient queries
-- =====================================================

-- Weather cooldown queries
CREATE INDEX IF NOT EXISTS idx_customers_weather_cooldown
  ON customers(last_weather_campaign_date)
  WHERE last_weather_campaign_date IS NOT NULL;

-- RFM segment + risk level queries (for rfm_loyalty automation)
CREATE INDEX IF NOT EXISTS idx_customers_rfm_segment
  ON customers(rfm_segment, risk_level);

-- Registration date queries (for anniversary automation)
CREATE INDEX IF NOT EXISTS idx_customers_registration
  ON customers(data_cadastro)
  WHERE data_cadastro IS NOT NULL;

-- One-time send queries (find customers who haven't received welcome/post_visit)
CREATE INDEX IF NOT EXISTS idx_customers_welcome_sent
  ON customers(welcome_sent_at)
  WHERE welcome_sent_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_customers_post_visit_sent
  ON customers(post_visit_sent_at)
  WHERE post_visit_sent_at IS NULL;

-- Lost customers for churned_recovery (60-120 days)
CREATE INDEX IF NOT EXISTS idx_customers_churned_recovery
  ON customers(risk_level, days_since_last_visit)
  WHERE risk_level = 'Lost';

-- =====================================================
-- Part G: Helper function for weather check
-- =====================================================

DROP FUNCTION IF EXISTS is_weather_campaign_eligible(TEXT) CASCADE;
DROP FUNCTION IF EXISTS is_weather_campaign_eligible(TEXT, INT) CASCADE;

CREATE OR REPLACE FUNCTION is_weather_campaign_eligible(
  p_customer_id TEXT,
  p_min_days_since_weather INT DEFAULT 14
)
RETURNS BOOLEAN AS $$
DECLARE
  v_last_weather DATE;
BEGIN
  SELECT last_weather_campaign_date INTO v_last_weather
  FROM customers WHERE doc = p_customer_id;

  IF v_last_weather IS NULL THEN
    RETURN TRUE;
  END IF;

  RETURN (CURRENT_DATE - v_last_weather) >= p_min_days_since_weather;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION is_weather_campaign_eligible IS 'Check if customer is eligible for weather campaign (14-day specific cooldown)';

-- =====================================================
-- Part H: Helper function for anniversary check
-- =====================================================

DROP FUNCTION IF EXISTS get_customer_anniversary_year(TEXT) CASCADE;

CREATE OR REPLACE FUNCTION get_customer_anniversary_year(
  p_customer_id TEXT
)
RETURNS TABLE (
  years_since_registration INTEGER,
  already_celebrated BOOLEAN,
  registration_date DATE
) AS $$
DECLARE
  v_registration_date DATE;
  v_years INTEGER;
  v_last_celebrated INTEGER;
BEGIN
  SELECT data_cadastro, last_anniversary_year
  INTO v_registration_date, v_last_celebrated
  FROM customers WHERE doc = p_customer_id;

  IF v_registration_date IS NULL THEN
    RETURN;
  END IF;

  -- Calculate years since registration
  v_years := EXTRACT(YEAR FROM age(CURRENT_DATE, v_registration_date))::INTEGER;

  RETURN QUERY SELECT
    v_years,
    (v_last_celebrated >= v_years),
    v_registration_date;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_customer_anniversary_year IS 'Get customer anniversary info for anniversary automation';

-- Done!
SELECT 'Migration 038_new_automation_triggers.sql completed successfully' AS status;
