-- Migration: Campaign Feedback Loop
-- Version: 3.9.1 (2025-12-12)
--
-- This migration adds the complete campaign effectiveness feedback loop:
-- 1. Adds missing columns to coupon_redemptions (transaction_value, days_to_redeem)
-- 2. Drops and recreates views that need column changes
-- 3. Creates/updates functions for return detection and coupon linking
-- 4. Enables the scheduler to track: returns, coupon redemptions, expired contacts
--
-- Run this in Supabase SQL Editor to complete the campaign tracking system.

-- ============================================================================
-- PART 1: TABLE ALTERATIONS
-- ============================================================================

-- Add transaction_value column to coupon_redemptions (stores the sale amount)
ALTER TABLE coupon_redemptions
ADD COLUMN IF NOT EXISTS transaction_value DECIMAL(10,2);

-- Add days_to_redeem column (days between campaign sent and coupon used)
ALTER TABLE coupon_redemptions
ADD COLUMN IF NOT EXISTS days_to_redeem INTEGER;

-- Backfill transaction_value from linked transactions
UPDATE coupon_redemptions cr
SET transaction_value = t.net_value
FROM transactions t
WHERE cr.transaction_id = t.id
  AND cr.transaction_value IS NULL;

-- Backfill days_to_redeem from campaign last_sent_at
UPDATE coupon_redemptions cr
SET days_to_redeem = EXTRACT(DAY FROM cr.redeemed_at - c.last_sent_at)::INT
FROM campaigns c
WHERE cr.campaign_id = c.id
  AND c.last_sent_at IS NOT NULL
  AND cr.days_to_redeem IS NULL;

-- ============================================================================
-- PART 2: DROP VIEWS THAT NEED COLUMN CHANGES
-- ============================================================================

-- Must drop views before recreating with different column structure
-- (CREATE OR REPLACE VIEW cannot change column names)
DROP VIEW IF EXISTS coupon_effectiveness;

-- ============================================================================
-- PART 3: RECREATE VIEWS
-- ============================================================================

-- Coupon effectiveness view for A/B testing and ROI analysis
-- Shows redemption counts, revenue, and timing metrics per coupon code
CREATE VIEW coupon_effectiveness AS
SELECT
  c.id AS campaign_id,
  c.name AS campaign_name,
  c.coupon_code,
  c.discount_percent,
  c.service_type,
  c.last_sent_at AS sent_at,
  c.audience_count AS target_count,
  COUNT(cr.id) AS redemptions,
  COUNT(DISTINCT cr.customer_doc) AS unique_customers,
  SUM(cr.transaction_value) AS total_revenue,
  ROUND(
    CASE WHEN c.audience_count > 0
    THEN (COUNT(cr.id)::DECIMAL / c.audience_count) * 100
    ELSE 0 END,
    2
  ) AS redemption_rate,
  ROUND(AVG(cr.transaction_value), 2) AS avg_ticket,
  ROUND(AVG(cr.days_to_redeem), 1) AS avg_days_to_redeem,
  MIN(cr.redeemed_at) AS first_redemption,
  MAX(cr.redeemed_at) AS last_redemption
FROM campaigns c
LEFT JOIN coupon_redemptions cr ON cr.campaign_id = c.id
WHERE c.coupon_code IS NOT NULL
GROUP BY c.id, c.name, c.coupon_code, c.discount_percent, c.service_type, c.last_sent_at, c.audience_count;

-- ============================================================================
-- PART 4: FUNCTIONS FOR CAMPAIGN FEEDBACK LOOP
-- ============================================================================

-- Function to find campaign by coupon code (case-insensitive)
CREATE OR REPLACE FUNCTION find_campaign_by_coupon(p_coupon_code TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT id FROM campaigns
    WHERE LOWER(coupon_code) = LOWER(p_coupon_code)
    ORDER BY last_sent_at DESC NULLS LAST
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to expire old pending contacts (>30 days without return)
CREATE OR REPLACE FUNCTION expire_old_contacts()
RETURNS INT AS $$
DECLARE
  v_expired INT := 0;
BEGIN
  UPDATE contact_tracking
  SET
    status = 'expired',
    updated_at = NOW()
  WHERE status = 'pending'
    AND contacted_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS v_expired = ROW_COUNT;

  IF v_expired > 0 THEN
    RAISE NOTICE 'expire_old_contacts: Expired % contacts', v_expired;
  END IF;

  RETURN v_expired;
END;
$$ LANGUAGE plpgsql;

-- Function to detect customer returns by comparing last_visit with contacted_at
-- Runs periodically via scheduler to mark contacts as "returned" when customer revisits
CREATE OR REPLACE FUNCTION detect_customer_returns()
RETURNS INT AS $$
DECLARE
  v_updated INT := 0;
BEGIN
  -- Update pending contacts where customer has visited AFTER being contacted
  UPDATE contact_tracking ct
  SET
    status = 'returned',
    returned_at = c.last_visit::TIMESTAMPTZ,
    days_to_return = (c.last_visit - ct.contacted_at::DATE),
    -- Calculate return revenue from transactions on the return day
    return_revenue = COALESCE((
      SELECT SUM(t.net_value)
      FROM transactions t
      WHERE t.doc_cliente = ct.customer_id
        AND t.data_hora::DATE = c.last_visit
        AND NOT t.is_recarga
    ), 0),
    updated_at = NOW()
  FROM customers c
  WHERE ct.customer_id = c.doc
    AND ct.status = 'pending'
    AND c.last_visit IS NOT NULL
    AND c.last_visit > ct.contacted_at::DATE;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated > 0 THEN
    RAISE NOTICE 'detect_customer_returns: Updated % contacts as returned', v_updated;
  END IF;

  RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

-- Function to link coupon redemptions from transactions to campaigns
-- Scans transactions with usou_cupom=true that aren't yet linked
CREATE OR REPLACE FUNCTION link_pending_coupon_redemptions()
RETURNS INT AS $$
DECLARE
  v_created INT := 0;
  v_txn RECORD;
  v_campaign_id TEXT;
  v_campaign_sent TIMESTAMPTZ;
BEGIN
  -- Process transactions with coupons that don't have redemption records yet
  FOR v_txn IN
    SELECT t.id, t.codigo_cupom, t.doc_cliente, t.data_hora, t.net_value
    FROM transactions t
    WHERE t.usou_cupom = true
      AND t.codigo_cupom IS NOT NULL
      AND LOWER(t.codigo_cupom) != 'n/d'
      AND NOT EXISTS (
        SELECT 1 FROM coupon_redemptions cr WHERE cr.transaction_id = t.id
      )
  LOOP
    -- Find matching campaign for this coupon code
    v_campaign_id := find_campaign_by_coupon(v_txn.codigo_cupom);

    -- Get campaign last_sent_at for days_to_redeem calculation
    SELECT last_sent_at INTO v_campaign_sent
    FROM campaigns WHERE id = v_campaign_id;

    -- Create redemption record with transaction_value and days_to_redeem
    INSERT INTO coupon_redemptions (
      transaction_id, codigo_cupom, campaign_id, customer_doc,
      redeemed_at, discount_value, transaction_value, days_to_redeem
    ) VALUES (
      v_txn.id,
      v_txn.codigo_cupom,
      v_campaign_id,
      v_txn.doc_cliente,
      v_txn.data_hora,
      NULL,  -- discount_value calculated later if needed
      v_txn.net_value,
      CASE WHEN v_campaign_sent IS NOT NULL
           THEN EXTRACT(DAY FROM v_txn.data_hora - v_campaign_sent)::INT
           ELSE NULL END
    );

    v_created := v_created + 1;

    -- Also mark customer as returned if they have a pending contact for this campaign
    IF v_campaign_id IS NOT NULL THEN
      UPDATE contact_tracking
      SET
        status = 'returned',
        returned_at = v_txn.data_hora,
        days_to_return = EXTRACT(DAY FROM v_txn.data_hora - contacted_at)::INT,
        return_revenue = COALESCE(return_revenue, 0) + COALESCE(v_txn.net_value, 0),
        updated_at = NOW()
      WHERE customer_id = v_txn.doc_cliente
        AND campaign_id = v_campaign_id
        AND status = 'pending'
        AND contacted_at < v_txn.data_hora;
    END IF;
  END LOOP;

  IF v_created > 0 THEN
    RAISE NOTICE 'link_pending_coupon_redemptions: Created % redemption records', v_created;
  END IF;

  RETURN v_created;
END;
$$ LANGUAGE plpgsql;

-- Master function that runs all return detection logic
-- Called periodically from the campaign scheduler
CREATE OR REPLACE FUNCTION process_campaign_returns()
RETURNS TABLE (
  returns_detected INT,
  coupons_linked INT,
  contacts_expired INT
) AS $$
DECLARE
  v_returns INT;
  v_coupons INT;
  v_expired INT;
BEGIN
  -- 1. Link any unlinked coupon redemptions
  v_coupons := link_pending_coupon_redemptions();

  -- 2. Detect returns from visit dates
  v_returns := detect_customer_returns();

  -- 3. Expire old contacts (>30 days)
  v_expired := expire_old_contacts();

  RETURN QUERY SELECT v_returns, v_coupons, v_expired;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 5: GRANT PERMISSIONS (if using RLS)
-- ============================================================================

-- Ensure the functions can be called via RPC
GRANT EXECUTE ON FUNCTION find_campaign_by_coupon(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION expire_old_contacts() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION detect_customer_returns() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION link_pending_coupon_redemptions() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION process_campaign_returns() TO anon, authenticated, service_role;

-- Grant access to the view
GRANT SELECT ON coupon_effectiveness TO anon, authenticated, service_role;

-- ============================================================================
-- VERIFICATION QUERIES (run these to confirm migration success)
-- ============================================================================

-- Check that coupon_redemptions has the new columns:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'coupon_redemptions' ORDER BY ordinal_position;

-- Check that the view exists:
-- SELECT * FROM coupon_effectiveness LIMIT 5;

-- Test the master function (should return zeros if no pending data):
-- SELECT * FROM process_campaign_returns();

-- Check pending contacts waiting for return detection:
-- SELECT COUNT(*) FROM contact_tracking WHERE status = 'pending';

-- Check transactions with coupons not yet linked:
-- SELECT COUNT(*) FROM transactions t
-- WHERE t.usou_cupom = true AND t.codigo_cupom IS NOT NULL
-- AND NOT EXISTS (SELECT 1 FROM coupon_redemptions cr WHERE cr.transaction_id = t.id);
