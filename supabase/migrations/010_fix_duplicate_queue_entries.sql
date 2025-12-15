-- Migration 010: Fix duplicate queue entries
-- Version: 3.19 (2025-12-15)
--
-- Problem: When a customer is manually included in an automation queue,
-- and the scheduler runs processAutomationRules(), it creates a DUPLICATE
-- contact_tracking record instead of updating the existing queued entry.
--
-- Solution: Update record_automation_contact() to check for existing queued
-- entries and UPDATE them instead of INSERT.
--
-- Example before fix:
--   id=200: status='queued', priority_source='manual_inclusion', twilio_sid=NULL
--   id=220: status='pending', priority_source=NULL, twilio_sid='MM...' (duplicate!)
--
-- Example after fix:
--   id=200: status='pending', priority_source='manual_inclusion', twilio_sid='MM...' (updated)

-- Drop and recreate the function with the fix
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
  v_existing_queued_id INT;
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

  -- v3.19: Check for existing QUEUED entry (from manual inclusion)
  -- If found, UPDATE it instead of creating a duplicate
  SELECT id INTO v_existing_queued_id
  FROM contact_tracking
  WHERE customer_id = p_customer_id
    AND campaign_id = v_campaign_id
    AND status = 'queued'
  LIMIT 1;

  IF v_existing_queued_id IS NOT NULL THEN
    -- UPDATE existing queued entry instead of INSERT
    UPDATE contact_tracking SET
      status = 'pending',
      contacted_at = NOW(),
      expires_at = NOW() + (COALESCE(v_rule.cooldown_days, 14) || ' days')::INTERVAL,
      phone = p_phone,
      twilio_sid = p_message_sid,
      delivery_status = CASE WHEN p_message_sid IS NOT NULL THEN 'sent' ELSE 'pending' END,
      risk_level = v_risk_level,
      campaign_type = v_campaign_type,
      campaign_name = 'Auto: ' || v_rule.name,
      updated_at = NOW(),
      -- Keep priority_source as 'manual_inclusion' to track origin
      priority_source = COALESCE(priority_source, 'automation')
    WHERE id = v_existing_queued_id
    RETURNING id INTO v_contact_tracking_id;

    RAISE NOTICE 'record_automation_contact: Updated existing queued entry % for customer %', v_existing_queued_id, p_customer_id;
  ELSE
    -- 1. Create NEW contact tracking record (no existing queued entry)
    INSERT INTO contact_tracking (
      customer_id,
      customer_name,
      contact_method,
      campaign_id,
      campaign_name,
      campaign_type,
      status,
      expires_at,
      phone,
      twilio_sid,
      delivery_status,
      risk_level,
      priority_source
    ) VALUES (
      p_customer_id,
      p_customer_name,
      'whatsapp',
      v_campaign_id,
      'Auto: ' || v_rule.name,
      v_campaign_type,
      'pending',
      NOW() + (COALESCE(v_rule.cooldown_days, 14) || ' days')::INTERVAL,
      p_phone,
      p_message_sid,
      CASE WHEN p_message_sid IS NOT NULL THEN 'sent' ELSE 'pending' END,
      v_risk_level,
      'automation'  -- Mark as automation-created
    )
    RETURNING id INTO v_contact_tracking_id;
  END IF;

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

-- Add comment explaining the fix
COMMENT ON FUNCTION record_automation_contact IS
'Records an automation contact with full campaign tracking.
v3.19: Now checks for existing queued entries (from manual inclusion) and
UPDATES them instead of creating duplicates. This ensures manual inclusions
are properly fulfilled when the automation scheduler picks up the customer.';

-- Also add an index to speed up the queued entry lookup
CREATE INDEX IF NOT EXISTS idx_contact_tracking_queued_lookup
ON contact_tracking(customer_id, campaign_id, status)
WHERE status = 'queued';
