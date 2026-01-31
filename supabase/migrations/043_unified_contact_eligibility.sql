-- Migration: Unified Contact Eligibility System
-- Date: 2025-12-13
-- Version: 3.12
--
-- Purpose: Implement unified cooldown/eligibility checks for both manual and automatic campaigns
-- to prevent customer fatigue and WhatsApp spam complaints.
--
-- Changes:
-- 1. Add campaign_type column to contact_tracking for type-based cooldowns
-- 2. Create is_customer_contactable() function - single source of truth for eligibility
-- 3. Create check_customers_eligibility() function for batch checking
-- 4. Update indexes for efficient eligibility queries

-- ==================== STEP 1: Add campaign_type to contact_tracking ====================

-- Add campaign_type column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contact_tracking' AND column_name = 'campaign_type'
  ) THEN
    ALTER TABLE contact_tracking ADD COLUMN campaign_type TEXT;
    COMMENT ON COLUMN contact_tracking.campaign_type IS 'Campaign type for type-based cooldowns: winback, welcome, promo, wallet, upsell, post_visit';
  END IF;
END $$;

-- Backfill campaign_type from existing campaign names (best effort)
UPDATE contact_tracking ct
SET campaign_type = CASE
  WHEN LOWER(campaign_name) LIKE '%win%back%' OR LOWER(campaign_name) LIKE '%volte%' THEN 'winback'
  WHEN LOWER(campaign_name) LIKE '%boas%vindas%' OR LOWER(campaign_name) LIKE '%welcome%' THEN 'welcome'
  WHEN LOWER(campaign_name) LIKE '%saldo%' OR LOWER(campaign_name) LIKE '%wallet%' THEN 'wallet'
  WHEN LOWER(campaign_name) LIKE '%promo%' OR LOWER(campaign_name) LIKE '%desconto%' THEN 'promo'
  WHEN LOWER(campaign_name) LIKE '%pós%visita%' OR LOWER(campaign_name) LIKE '%post%visit%' THEN 'post_visit'
  WHEN LOWER(campaign_name) LIKE '%secagem%' OR LOWER(campaign_name) LIKE '%upsell%' THEN 'upsell'
  ELSE 'other'
END
WHERE campaign_type IS NULL;

-- Create index for eligibility queries
CREATE INDEX IF NOT EXISTS idx_contact_tracking_eligibility
ON contact_tracking (customer_id, status, contacted_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_tracking_type
ON contact_tracking (customer_id, campaign_type, contacted_at DESC);

-- ==================== STEP 2: Create is_customer_contactable() function ====================

-- Drop existing function if exists (to handle signature changes)
DROP FUNCTION IF EXISTS is_customer_contactable(TEXT, TEXT, INT, INT);

CREATE OR REPLACE FUNCTION is_customer_contactable(
  p_customer_id TEXT,
  p_campaign_type TEXT DEFAULT NULL,
  p_min_days_global INT DEFAULT 7,
  p_min_days_same_type INT DEFAULT 30
)
RETURNS TABLE (
  is_eligible BOOLEAN,
  reason TEXT,
  last_contact_date TIMESTAMPTZ,
  last_campaign_type TEXT,
  last_campaign_name TEXT,
  days_since_contact INT,
  days_until_eligible INT
) AS $$
DECLARE
  v_last_contact RECORD;
  v_last_same_type RECORD;
  v_days_since INT;
  v_days_until INT;
BEGIN
  -- Find most recent contact (any type)
  SELECT ct.contacted_at, ct.campaign_type, ct.campaign_name
  INTO v_last_contact
  FROM contact_tracking ct
  WHERE ct.customer_id = p_customer_id
    AND ct.status IN ('pending', 'returned')  -- Don't count expired/cleared
  ORDER BY ct.contacted_at DESC
  LIMIT 1;

  -- If no previous contact, customer is eligible
  IF v_last_contact IS NULL THEN
    RETURN QUERY SELECT
      TRUE::BOOLEAN,
      'Nenhum contato anterior'::TEXT,
      NULL::TIMESTAMPTZ,
      NULL::TEXT,
      NULL::TEXT,
      NULL::INT,
      0::INT;
    RETURN;
  END IF;

  -- Calculate days since last contact
  v_days_since := EXTRACT(DAY FROM NOW() - v_last_contact.contacted_at)::INT;

  -- Check global cooldown (any campaign type)
  IF v_days_since < p_min_days_global THEN
    v_days_until := p_min_days_global - v_days_since;
    RETURN QUERY SELECT
      FALSE::BOOLEAN,
      format('Contactado há %s dias. Aguarde mais %s dias.', v_days_since, v_days_until)::TEXT,
      v_last_contact.contacted_at,
      v_last_contact.campaign_type,
      v_last_contact.campaign_name,
      v_days_since,
      v_days_until;
    RETURN;
  END IF;

  -- Check same campaign type cooldown (if type specified)
  IF p_campaign_type IS NOT NULL THEN
    SELECT ct.contacted_at, ct.campaign_type, ct.campaign_name
    INTO v_last_same_type
    FROM contact_tracking ct
    WHERE ct.customer_id = p_customer_id
      AND ct.campaign_type = p_campaign_type
      AND ct.status IN ('pending', 'returned')
    ORDER BY ct.contacted_at DESC
    LIMIT 1;

    IF v_last_same_type IS NOT NULL THEN
      v_days_since := EXTRACT(DAY FROM NOW() - v_last_same_type.contacted_at)::INT;

      IF v_days_since < p_min_days_same_type THEN
        v_days_until := p_min_days_same_type - v_days_since;
        RETURN QUERY SELECT
          FALSE::BOOLEAN,
          format('Já recebeu campanha "%s" há %s dias. Aguarde mais %s dias.',
                 p_campaign_type, v_days_since, v_days_until)::TEXT,
          v_last_same_type.contacted_at,
          v_last_same_type.campaign_type,
          v_last_same_type.campaign_name,
          v_days_since,
          v_days_until;
        RETURN;
      END IF;
    END IF;
  END IF;

  -- Check for recent opt-out button clicks (90 day cooldown)
  IF EXISTS (
    SELECT 1 FROM webhook_events we
    JOIN campaign_contacts cc ON cc.twilio_sid = we.message_sid
    JOIN contact_tracking ct ON ct.id = cc.contact_tracking_id
    WHERE ct.customer_id = p_customer_id
      AND we.event_type = 'button_click'
      AND LOWER(we.payload) LIKE '%não%interesse%'
      AND we.created_at > NOW() - INTERVAL '90 days'
  ) THEN
    RETURN QUERY SELECT
      FALSE::BOOLEAN,
      'Cliente clicou "Não tenho interesse" nos últimos 90 dias'::TEXT,
      v_last_contact.contacted_at,
      v_last_contact.campaign_type,
      v_last_contact.campaign_name,
      v_days_since,
      NULL::INT;
    RETURN;
  END IF;

  -- Customer is eligible
  RETURN QUERY SELECT
    TRUE::BOOLEAN,
    'Elegível para contato'::TEXT,
    v_last_contact.contacted_at,
    v_last_contact.campaign_type,
    v_last_contact.campaign_name,
    v_days_since,
    0::INT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION is_customer_contactable IS
'Check if a customer is eligible for campaign contact based on cooldown rules.
Returns eligibility status, reason, and last contact info.
Used by both manual campaigns (UI) and automations (scheduler).';

-- ==================== STEP 3: Create batch eligibility check function ====================

CREATE OR REPLACE FUNCTION check_customers_eligibility(
  p_customer_ids TEXT[],
  p_campaign_type TEXT DEFAULT NULL,
  p_min_days_global INT DEFAULT 7,
  p_min_days_same_type INT DEFAULT 30
)
RETURNS TABLE (
  customer_id TEXT,
  is_eligible BOOLEAN,
  reason TEXT,
  last_contact_date TIMESTAMPTZ,
  days_since_contact INT,
  days_until_eligible INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cid,
    (e).is_eligible,
    (e).reason,
    (e).last_contact_date,
    (e).days_since_contact,
    (e).days_until_eligible
  FROM unnest(p_customer_ids) AS cid
  CROSS JOIN LATERAL is_customer_contactable(
    cid,
    p_campaign_type,
    p_min_days_global,
    p_min_days_same_type
  ) AS e;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_customers_eligibility IS
'Batch check eligibility for multiple customers.
More efficient than calling is_customer_contactable() in a loop.';

-- ==================== STEP 4: Update record functions to include campaign_type ====================

-- Update recordCampaignContactWithTracking equivalent to include campaign_type
-- (The actual update is in supabase-api.js, but we need the SQL function too)

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

  -- Ensure campaign record exists
  IF v_rule.campaign_id IS NULL THEN
    v_campaign_id := sync_automation_campaign(p_rule_id);
  ELSE
    v_campaign_id := v_rule.campaign_id;
  END IF;

  -- 1. Create contact tracking record WITH campaign_type
  INSERT INTO contact_tracking (
    customer_id,
    customer_name,
    contact_method,
    campaign_id,
    campaign_name,
    campaign_type,  -- NEW: Include campaign_type
    status,
    expires_at
  ) VALUES (
    p_customer_id,
    p_customer_name,
    'whatsapp',
    v_campaign_id,
    'Auto: ' || v_rule.name,
    v_campaign_type,  -- NEW
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

-- ==================== STEP 5: Verification ====================

DO $$
BEGIN
  RAISE NOTICE 'Migration complete: Unified Contact Eligibility System v3.12';
  RAISE NOTICE '  - Added campaign_type column to contact_tracking';
  RAISE NOTICE '  - Created is_customer_contactable() function';
  RAISE NOTICE '  - Created check_customers_eligibility() batch function';
  RAISE NOTICE '  - Updated record_automation_contact() with campaign_type';
END $$;
