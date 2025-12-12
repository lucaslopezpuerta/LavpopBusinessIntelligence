-- Migration: Unify Automations as Campaigns
-- Version: 3.5 (2025-12-12)
--
-- This migration treats automations as "auto campaigns" by:
-- 1. Adding campaign_id to automation_rules (links rule to its campaign record)
-- 2. Creating a function to sync automation rules with campaigns table
-- 3. Ensuring automations appear in campaign_performance and campaign_effectiveness views
--
-- Benefits:
-- - Unified metrics (manual + auto campaigns in same dashboard)
-- - A/B testing data for automation coupons
-- - Complete funnel visibility
-- - Contact return tracking unified

-- ==================== SCHEMA CHANGES ====================

-- Add campaign_id to automation_rules (links to campaigns table)
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS campaign_id TEXT REFERENCES campaigns(id) ON DELETE SET NULL;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_automation_rules_campaign_id ON automation_rules(campaign_id);

-- ==================== SYNC FUNCTION ====================

-- Function to create or update campaign record for an automation rule
-- Called when: rule is enabled, rule config changes, or on first send
CREATE OR REPLACE FUNCTION sync_automation_campaign(p_rule_id TEXT)
RETURNS TEXT AS $$
DECLARE
  v_rule RECORD;
  v_campaign_id TEXT;
  v_audience TEXT;
BEGIN
  -- Get the rule
  SELECT * INTO v_rule FROM automation_rules WHERE id = p_rule_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Automation rule % not found', p_rule_id;
  END IF;

  -- Determine audience based on trigger type
  v_audience := CASE v_rule.trigger_type
    WHEN 'days_since_visit' THEN 'atRisk'
    WHEN 'first_purchase' THEN 'newCustomers'
    WHEN 'wallet_balance' THEN 'withWallet'
    WHEN 'hours_after_visit' THEN 'all'
    ELSE 'all'
  END;

  -- Check if campaign already exists
  IF v_rule.campaign_id IS NOT NULL THEN
    -- Update existing campaign
    UPDATE campaigns SET
      name = 'Auto: ' || v_rule.name,
      template_id = v_rule.action_template,
      audience = v_audience,
      status = CASE WHEN v_rule.enabled THEN 'active' ELSE 'paused' END,
      discount_percent = v_rule.discount_percent,
      coupon_code = v_rule.coupon_code,
      service_type = 'both',  -- Automations apply to both services
      contact_method = v_rule.action_channel,
      updated_at = NOW()
    WHERE id = v_rule.campaign_id;

    RETURN v_rule.campaign_id;
  ELSE
    -- Create new campaign for this automation
    v_campaign_id := 'AUTO_' || p_rule_id;

    INSERT INTO campaigns (
      id,
      name,
      template_id,
      audience,
      status,
      contact_method,
      discount_percent,
      coupon_code,
      service_type,
      created_at
    ) VALUES (
      v_campaign_id,
      'Auto: ' || v_rule.name,
      v_rule.action_template,
      v_audience,
      CASE WHEN v_rule.enabled THEN 'active' ELSE 'draft' END,
      COALESCE(v_rule.action_channel, 'whatsapp'),
      v_rule.discount_percent,
      v_rule.coupon_code,
      'both',
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      template_id = EXCLUDED.template_id,
      audience = EXCLUDED.audience,
      status = EXCLUDED.status,
      discount_percent = EXCLUDED.discount_percent,
      coupon_code = EXCLUDED.coupon_code,
      updated_at = NOW();

    -- Link the campaign to the rule
    UPDATE automation_rules SET campaign_id = v_campaign_id WHERE id = p_rule_id;

    RETURN v_campaign_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ==================== TRIGGER FOR AUTO-SYNC ====================

-- Trigger function to sync campaign when automation rule changes
CREATE OR REPLACE FUNCTION trigger_sync_automation_campaign()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync if rule is enabled or was just enabled
  IF NEW.enabled = true OR (OLD IS NOT NULL AND OLD.enabled = true) THEN
    PERFORM sync_automation_campaign(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_automation_campaign_trigger ON automation_rules;

-- Create trigger
CREATE TRIGGER sync_automation_campaign_trigger
  AFTER INSERT OR UPDATE ON automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_automation_campaign();

-- ==================== RECORD AUTOMATION CONTACT ====================

-- Function to record an automation send with full campaign tracking
-- This creates entries in:
-- 1. automation_sends (for automation-specific tracking)
-- 2. contact_tracking (for return tracking)
-- 3. campaign_contacts (bridges campaign ↔ contact_tracking)
-- 4. Updates campaign sends count
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
BEGIN
  -- Get the rule and ensure campaign exists
  SELECT * INTO v_rule FROM automation_rules WHERE id = p_rule_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Automation rule % not found', p_rule_id;
  END IF;

  -- Ensure campaign record exists
  IF v_rule.campaign_id IS NULL THEN
    v_campaign_id := sync_automation_campaign(p_rule_id);
  ELSE
    v_campaign_id := v_rule.campaign_id;
  END IF;

  -- 1. Create contact tracking record
  INSERT INTO contact_tracking (
    customer_id,
    customer_name,
    contact_method,
    campaign_id,
    campaign_name,
    status,
    expires_at
  ) VALUES (
    p_customer_id,
    p_customer_name,
    'whatsapp',
    v_campaign_id,  -- Use campaign_id, not rule_id!
    'Auto: ' || v_rule.name,
    'pending',
    NOW() + (COALESCE(v_rule.cooldown_days, 14) || ' days')::INTERVAL
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

-- ==================== INITIALIZE EXISTING RULES ====================

-- Create campaign records for any existing enabled automation rules
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM automation_rules WHERE enabled = true AND campaign_id IS NULL
  LOOP
    PERFORM sync_automation_campaign(r.id);
  END LOOP;
END $$;

-- ==================== GRANTS ====================

GRANT EXECUTE ON FUNCTION sync_automation_campaign TO authenticated;
GRANT EXECUTE ON FUNCTION record_automation_contact TO authenticated;
