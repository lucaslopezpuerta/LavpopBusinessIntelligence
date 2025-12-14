-- Migration 007: Backfill risk_level and phone in contact_tracking
-- Date: 2025-12-14
-- Purpose: Complete the data backfill from migration 006 and fix risk_level capture
--
-- PROBLEMS FIXED:
-- 1. phone column empty for some records (especially automation sends)
-- 2. delivery_status = 'pending' for records that never had a message sent (no twilio_sid)
-- 3. risk_level column NEVER populated (should capture customer risk at time of contact)
-- 4. Functions don't capture risk_level when creating contact_tracking records
--
-- DATA SOURCES:
-- - phone: First try campaign_contacts, then customers table
-- - risk_level: customers table (snapshot of current risk, best available)
--
-- NOTE: risk_level backfill uses CURRENT customer risk_level, not historical.
-- For future contacts, risk_level will be captured at time of send.

-- ==================== STEP 1: BACKFILL PHONE FROM CUSTOMERS TABLE ====================

-- For contact_tracking records without phone, get from customers table
-- This catches automation sends where campaign_contacts wasn't created
UPDATE contact_tracking ct
SET phone = c.telefone
FROM customers c
WHERE ct.phone IS NULL
  AND ct.customer_id = c.doc
  AND c.telefone IS NOT NULL;

-- ==================== STEP 2: MARK OLD RECORDS WITHOUT TWILIO_SID ====================

-- Records with campaign_contacts but NULL twilio_sid = message was never sent
-- Mark these as 'not_sent' so they don't appear as "pending" forever
UPDATE contact_tracking ct
SET delivery_status = 'not_sent'
WHERE ct.twilio_sid IS NULL
  AND ct.delivery_status = 'pending'
  AND EXISTS (
    SELECT 1 FROM campaign_contacts cc
    WHERE cc.contact_tracking_id = ct.id
    AND cc.twilio_sid IS NULL
  );

-- Records without any campaign_contacts record AND no twilio_sid
-- These are orphaned records - also mark as 'not_sent'
UPDATE contact_tracking ct
SET delivery_status = 'not_sent'
WHERE ct.twilio_sid IS NULL
  AND ct.delivery_status = 'pending'
  AND NOT EXISTS (
    SELECT 1 FROM campaign_contacts cc
    WHERE cc.contact_tracking_id = ct.id
  )
  AND ct.contacted_at < NOW() - INTERVAL '1 day';  -- Only old records

-- ==================== STEP 3: BACKFILL RISK_LEVEL FROM CUSTOMERS TABLE ====================

-- IMPORTANT: This uses CURRENT risk_level (best available approximation)
-- For historical accuracy, we'd need to re-calculate based on contacted_at date
-- Future sends will capture risk_level at time of contact

UPDATE contact_tracking ct
SET risk_level = c.risk_level
FROM customers c
WHERE ct.risk_level IS NULL
  AND ct.customer_id = c.doc
  AND c.risk_level IS NOT NULL;

-- ==================== STEP 4: UPDATE RECORD_AUTOMATION_CONTACT FUNCTION ====================

-- Now captures risk_level from customers table at time of send
CREATE OR REPLACE FUNCTION record_automation_contact(
  p_rule_id TEXT,
  p_customer_id TEXT,
  p_customer_name TEXT,
  p_phone TEXT,
  p_message_sid TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_campaign_id TEXT;
  v_contact_tracking_id INT;
  v_automation_send_id UUID;
  v_rule RECORD;
  v_campaign_type TEXT;
  v_risk_level TEXT;
BEGIN
  -- Get the rule and ensure campaign exists
  SELECT * INTO v_rule FROM automation_rules WHERE id = p_rule_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Automation rule % not found', p_rule_id;
  END IF;

  -- Get customer's current risk_level (snapshot at time of contact)
  SELECT risk_level INTO v_risk_level FROM customers WHERE doc = p_customer_id;

  -- Determine campaign_type from action_template
  v_campaign_type := CASE v_rule.action_template
    WHEN 'winback_discount' THEN 'winback'
    WHEN 'winback_critical' THEN 'winback'
    WHEN 'welcome_new' THEN 'welcome'
    WHEN 'wallet_reminder' THEN 'wallet'
    WHEN 'post_visit_thanks' THEN 'post_visit'
    WHEN 'upsell_secagem' THEN 'upsell'
    ELSE 'other'
  END;

  -- Ensure campaign record exists
  IF v_rule.campaign_id IS NULL THEN
    v_campaign_id := sync_automation_campaign(p_rule_id);
  ELSE
    v_campaign_id := v_rule.campaign_id;
  END IF;

  -- 1. Create contact tracking record WITH delivery fields AND risk_level
  INSERT INTO contact_tracking (
    customer_id,
    customer_name,
    contact_method,
    campaign_id,
    campaign_name,
    campaign_type,
    status,
    expires_at,
    -- Delivery fields
    phone,
    twilio_sid,
    delivery_status,
    -- v3.16: Risk level snapshot
    risk_level
  ) VALUES (
    p_customer_id,
    p_customer_name,
    'whatsapp',
    v_campaign_id,
    'Auto: ' || v_rule.name,
    v_campaign_type,
    'pending',
    NOW() + (COALESCE(v_rule.cooldown_days, 14) || ' days')::INTERVAL,
    -- Delivery fields
    p_phone,
    p_message_sid,
    CASE WHEN p_message_sid IS NOT NULL THEN 'sent' ELSE 'pending' END,
    -- v3.16: Risk level snapshot
    v_risk_level
  )
  RETURNING id INTO v_contact_tracking_id;

  -- 2. DEPRECATED: campaign_contacts bridge record
  -- Keeping for backward compatibility with existing queries
  -- Will be removed in future migration
  INSERT INTO campaign_contacts (
    campaign_id,
    contact_tracking_id,
    customer_id,
    customer_name,
    phone,
    delivery_status,
    twilio_sid
  ) VALUES (
    v_campaign_id,
    v_contact_tracking_id,
    p_customer_id,
    p_customer_name,
    p_phone,
    'sent',
    p_message_sid
  );

  -- 3. Create automation_sends record (for cooldown tracking)
  INSERT INTO automation_sends (
    rule_id,
    customer_id,
    customer_name,
    phone,
    status,
    message_sid
  ) VALUES (
    p_rule_id,
    p_customer_id,
    p_customer_name,
    p_phone,
    'sent',
    p_message_sid
  )
  RETURNING id INTO v_automation_send_id;

  -- 4. Update campaign send count
  UPDATE campaigns SET
    sends = sends + 1,
    last_sent_at = NOW(),
    status = 'active'
  WHERE id = v_campaign_id;

  RETURN v_automation_send_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION record_automation_contact IS
'Records an automation send with unified tracking in contact_tracking.
Creates: contact_tracking (with delivery fields + risk_level), campaign_contacts (deprecated), automation_sends.
v2.1: Now captures customer risk_level at time of contact for analytics.';

-- ==================== STEP 5: UPDATE RECORD_CAMPAIGN_CONTACT_UNIFIED FUNCTION ====================

-- Now captures risk_level from customers table at time of send
CREATE OR REPLACE FUNCTION record_campaign_contact_unified(
  p_campaign_id TEXT,
  p_customer_id TEXT,
  p_customer_name TEXT,
  p_phone TEXT,
  p_twilio_sid TEXT DEFAULT NULL,
  p_contact_method TEXT DEFAULT 'whatsapp',
  p_campaign_type TEXT DEFAULT NULL,
  p_coupon_validity_days INT DEFAULT 7
)
RETURNS INT AS $$
DECLARE
  v_contact_tracking_id INT;
  v_campaign_name TEXT;
  v_expiry_days INT;
  v_risk_level TEXT;
BEGIN
  -- Get campaign name
  SELECT name INTO v_campaign_name FROM campaigns WHERE id = p_campaign_id;
  v_campaign_name := COALESCE(v_campaign_name, p_campaign_id);

  -- Get customer's current risk_level (snapshot at time of contact)
  SELECT risk_level INTO v_risk_level FROM customers WHERE doc = p_customer_id;

  -- Calculate expiry: coupon validity + 3 day buffer
  v_expiry_days := p_coupon_validity_days + 3;

  -- Create unified contact_tracking record with delivery fields AND risk_level
  INSERT INTO contact_tracking (
    customer_id,
    customer_name,
    contact_method,
    campaign_id,
    campaign_name,
    campaign_type,
    status,
    expires_at,
    -- Delivery fields
    phone,
    twilio_sid,
    delivery_status,
    -- v3.16: Risk level snapshot
    risk_level
  ) VALUES (
    p_customer_id,
    p_customer_name,
    p_contact_method,
    p_campaign_id,
    v_campaign_name,
    p_campaign_type,
    'pending',
    NOW() + (v_expiry_days || ' days')::INTERVAL,
    -- Delivery fields
    p_phone,
    p_twilio_sid,
    CASE WHEN p_twilio_sid IS NOT NULL THEN 'sent' ELSE 'pending' END,
    -- v3.16: Risk level snapshot
    v_risk_level
  )
  RETURNING id INTO v_contact_tracking_id;

  -- DEPRECATED: Also create campaign_contacts for backward compatibility
  INSERT INTO campaign_contacts (
    campaign_id,
    contact_tracking_id,
    customer_id,
    customer_name,
    phone,
    delivery_status,
    twilio_sid
  ) VALUES (
    p_campaign_id,
    v_contact_tracking_id,
    p_customer_id,
    p_customer_name,
    p_phone,
    CASE WHEN p_twilio_sid IS NOT NULL THEN 'sent' ELSE 'pending' END,
    p_twilio_sid
  );

  RETURN v_contact_tracking_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION record_campaign_contact_unified IS
'Records a manual campaign contact with unified tracking in contact_tracking.
v1.1: Now captures customer risk_level at time of contact for analytics.';

-- ==================== VERIFICATION QUERIES ====================
-- Run these after migration to verify success:

-- Check backfill results:
-- SELECT
--   COUNT(*) as total_contacts,
--   COUNT(phone) as with_phone,
--   COUNT(risk_level) as with_risk_level,
--   COUNT(twilio_sid) as with_twilio_sid,
--   COUNT(CASE WHEN delivery_status = 'not_sent' THEN 1 END) as marked_not_sent
-- FROM contact_tracking;

-- Check risk_level distribution:
-- SELECT
--   risk_level,
--   COUNT(*) as contact_count,
--   COUNT(CASE WHEN status = 'returned' THEN 1 END) as returned_count
-- FROM contact_tracking
-- WHERE risk_level IS NOT NULL
-- GROUP BY risk_level
-- ORDER BY contact_count DESC;

-- Check phone coverage:
-- SELECT
--   COUNT(*) as total,
--   COUNT(phone) as with_phone,
--   ROUND(100.0 * COUNT(phone) / COUNT(*), 1) as phone_coverage_pct
-- FROM contact_tracking;

-- Check delivery_status distribution:
-- SELECT
--   delivery_status,
--   COUNT(*) as count,
--   ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 1) as pct
-- FROM contact_tracking
-- GROUP BY delivery_status
-- ORDER BY count DESC;
