-- Migration: Backfill Automation Tracking Records
-- Date: 2025-12-13
-- Purpose: Create missing contact_tracking and campaign_contacts records
--          for automation_sends that were created before proper tracking
--
-- PROBLEM:
-- Automations sent messages and recorded to automation_sends table,
-- but the record_automation_contact() RPC may have failed, leaving
-- no contact_tracking or campaign_contacts records.
-- This causes campaign_performance view to show "Rastreados: 0"
--
-- SOLUTION:
-- 1. Find automation_sends without matching contact_tracking records
-- 2. Create contact_tracking records for each
-- 3. Create campaign_contacts bridge records linking them

-- ==================== BACKFILL FUNCTION ====================

CREATE OR REPLACE FUNCTION backfill_automation_tracking()
RETURNS TABLE(
  automation_sends_processed INT,
  contact_tracking_created INT,
  campaign_contacts_created INT,
  errors TEXT[]
) AS $$
DECLARE
  v_send RECORD;
  v_rule RECORD;
  v_campaign_id TEXT;
  v_campaign_type TEXT;
  v_contact_tracking_id INT;
  v_processed INT := 0;
  v_tracking_created INT := 0;
  v_contacts_created INT := 0;
  v_errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Find automation_sends without corresponding contact_tracking
  FOR v_send IN
    SELECT
      a.id,
      a.rule_id,
      a.customer_id,
      a.customer_name,
      a.phone,
      a.message_sid,
      a.sent_at
    FROM automation_sends a
    LEFT JOIN contact_tracking ct
      ON ct.customer_id = a.customer_id
      AND ct.contacted_at::date = a.sent_at::date
      AND ct.campaign_id LIKE 'AUTO_%'
    WHERE ct.id IS NULL
    ORDER BY a.sent_at
  LOOP
    v_processed := v_processed + 1;

    BEGIN
      -- Get rule info
      SELECT * INTO v_rule FROM automation_rules WHERE id = v_send.rule_id;

      IF NOT FOUND THEN
        v_errors := array_append(v_errors, 'Rule not found: ' || v_send.rule_id);
        CONTINUE;
      END IF;

      -- Get or create campaign_id
      v_campaign_id := COALESCE(v_rule.campaign_id, 'AUTO_' || v_send.rule_id);

      -- Determine campaign_type from template
      v_campaign_type := CASE v_rule.action_template
        WHEN 'winback_discount' THEN 'winback'
        WHEN 'winback_critical' THEN 'winback'
        WHEN 'welcome_new' THEN 'welcome'
        WHEN 'wallet_reminder' THEN 'wallet'
        WHEN 'post_visit_thanks' THEN 'post_visit'
        WHEN 'upsell_secagem' THEN 'upsell'
        ELSE 'other'
      END;

      -- Create contact_tracking record
      INSERT INTO contact_tracking (
        customer_id,
        customer_name,
        contact_method,
        campaign_id,
        campaign_name,
        campaign_type,
        status,
        contacted_at,
        expires_at
      ) VALUES (
        v_send.customer_id,
        v_send.customer_name,
        'whatsapp',
        v_campaign_id,
        'Auto: ' || v_rule.name,
        v_campaign_type,
        'pending',  -- Will be updated by processCampaignReturns if customer returned
        v_send.sent_at,
        v_send.sent_at + (COALESCE(v_rule.cooldown_days, 14) || ' days')::INTERVAL
      )
      RETURNING id INTO v_contact_tracking_id;

      v_tracking_created := v_tracking_created + 1;

      -- Create campaign_contacts bridge record
      INSERT INTO campaign_contacts (
        campaign_id,
        contact_tracking_id,
        customer_id,
        customer_name,
        phone,
        delivery_status,
        twilio_sid,
        sent_at
      ) VALUES (
        v_campaign_id,
        v_contact_tracking_id,
        v_send.customer_id,
        v_send.customer_name,
        v_send.phone,
        'sent',
        v_send.message_sid,
        v_send.sent_at
      );

      v_contacts_created := v_contacts_created + 1;

    EXCEPTION WHEN OTHERS THEN
      v_errors := array_append(v_errors,
        'Error for send ' || v_send.id::text || ': ' || SQLERRM);
    END;
  END LOOP;

  RETURN QUERY SELECT v_processed, v_tracking_created, v_contacts_created, v_errors;
END;
$$ LANGUAGE plpgsql;

-- ==================== RUN THE BACKFILL ====================

-- Execute the backfill and show results
SELECT * FROM backfill_automation_tracking();

-- ==================== VERIFY RESULTS ====================

-- Check campaign_performance view now shows correct counts
-- SELECT id, name, sends, contacts_tracked, contacts_returned, return_rate
-- FROM campaign_performance
-- WHERE id LIKE 'AUTO_%'
-- ORDER BY created_at DESC;

-- ==================== CLEANUP ====================

-- Optionally drop the function after use (uncomment to run)
-- DROP FUNCTION IF EXISTS backfill_automation_tracking();

-- ==================== GRANT PERMISSIONS ====================

GRANT EXECUTE ON FUNCTION backfill_automation_tracking TO authenticated;
