-- Migration: Fix expires_at to use coupon_validity_days instead of cooldown_days
-- Date: 2025-12-13
-- Version: 3.13
--
-- Purpose: Contact tracking expiry should match coupon validity for accurate return attribution
--
-- Problem: record_automation_contact() was using cooldown_days (inter-message interval)
--          instead of coupon_validity_days (actual coupon validity period)
--
-- Fix: Use coupon_validity_days + 3 day buffer for expires_at
--      This allows detecting late returns (customer returns after coupon expires)
--
-- Changes:
-- 1. Update record_automation_contact() to use coupon_validity_days + 3 days buffer
-- 2. Add RETURN_ATTRIBUTION_BUFFER constant (3 days)

-- ==================== STEP 1: Update record_automation_contact() ====================

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
  v_expiry_days INT;
  RETURN_ATTRIBUTION_BUFFER CONSTANT INT := 3;  -- Extra days to catch late returns
BEGIN
  -- Get the rule and ensure campaign exists
  SELECT * INTO v_rule FROM automation_rules WHERE id = p_rule_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Automation rule % not found', p_rule_id;
  END IF;

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

  -- Calculate expiry days: coupon_validity_days + buffer (for late returns)
  -- If no coupon, use cooldown_days as fallback
  -- v3.13: Changed from cooldown_days to coupon_validity_days for accurate return attribution
  v_expiry_days := COALESCE(v_rule.coupon_validity_days, v_rule.cooldown_days, 14) + RETURN_ATTRIBUTION_BUFFER;

  -- Ensure campaign record exists
  IF v_rule.campaign_id IS NULL THEN
    v_campaign_id := sync_automation_campaign(p_rule_id);
  ELSE
    v_campaign_id := v_rule.campaign_id;
  END IF;

  -- 1. Create contact tracking record WITH campaign_type
  -- v3.13: expires_at now uses coupon_validity_days + buffer instead of cooldown_days
  INSERT INTO contact_tracking (
    customer_id,
    customer_name,
    contact_method,
    campaign_id,
    campaign_name,
    campaign_type,
    status,
    expires_at
  ) VALUES (
    p_customer_id,
    p_customer_name,
    'whatsapp',
    v_campaign_id,
    'Auto: ' || v_rule.name,
    v_campaign_type,
    'pending',
    NOW() + (v_expiry_days || ' days')::INTERVAL
  )
  RETURNING id INTO v_contact_tracking_id;

  -- 2. Create campaign_contacts bridge record
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

  -- 3. Create automation_sends record (for legacy cooldown tracking)
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
'Record an automation contact with proper expiry for return attribution.
v3.13: Uses coupon_validity_days + 3 day buffer instead of cooldown_days.
This ensures we can attribute customer returns even if they come back
a few days after the coupon expires.';

-- ==================== STEP 2: Verification ====================

DO $$
BEGIN
  RAISE NOTICE 'Migration complete: Fixed expires_at calculation v3.13';
  RAISE NOTICE '  - record_automation_contact() now uses coupon_validity_days';
  RAISE NOTICE '  - Added 3-day buffer for late return attribution';
  RAISE NOTICE '  - Falls back to cooldown_days if no coupon configured';
END $$;
