-- Migration 006: Merge campaign_contacts into contact_tracking
-- Date: 2025-12-14
-- Purpose: Eliminate redundant bridge table by adding delivery fields to contact_tracking
--
-- PROBLEM:
-- Two tables storing overlapping data with 1:1 relationship:
-- - contact_tracking: return tracking (customer_id, campaign_id, status, return_revenue)
-- - campaign_contacts: delivery tracking (twilio_sid, delivery_status, contact_tracking_id FK)
--
-- This caused:
-- 1. Data inconsistency (some records in one table but not the other)
-- 2. Complex queries requiring JOINs/UNIONs
-- 3. Automations sometimes not creating campaign_contacts records
--
-- SOLUTION:
-- Add delivery fields directly to contact_tracking table.
-- This creates a single source of truth for both return AND delivery tracking.
--
-- MIGRATION STEPS:
-- 1. Add new columns to contact_tracking
-- 2. Backfill from existing campaign_contacts data
-- 3. Create indexes for webhook lookups
-- 4. Update record_automation_contact() function
-- 5. Create new record_campaign_contact_unified() function
-- 6. Update campaign_delivery_metrics view
-- 7. Keep campaign_contacts for backward compatibility (deprecated)
--
-- ROLLBACK: This migration is non-destructive. campaign_contacts table is preserved.

-- ==================== STEP 1: ADD COLUMNS TO CONTACT_TRACKING ====================

-- Phone number for display (contact_tracking didn't have this)
ALTER TABLE contact_tracking ADD COLUMN IF NOT EXISTS phone TEXT;

-- Twilio message SID for webhook linking (CRITICAL for delivery tracking)
ALTER TABLE contact_tracking ADD COLUMN IF NOT EXISTS twilio_sid TEXT;

-- Delivery status (separate from return status)
-- Values: pending, sent, delivered, read, failed, undelivered
ALTER TABLE contact_tracking ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending';

-- Error tracking for failed deliveries
ALTER TABLE contact_tracking ADD COLUMN IF NOT EXISTS delivery_error_code INT;
ALTER TABLE contact_tracking ADD COLUMN IF NOT EXISTS delivery_error_message TEXT;

COMMENT ON COLUMN contact_tracking.phone IS 'Recipient phone number (normalized)';
COMMENT ON COLUMN contact_tracking.twilio_sid IS 'Twilio message SID for webhook delivery tracking';
COMMENT ON COLUMN contact_tracking.delivery_status IS 'Message delivery status: pending/sent/delivered/read/failed/undelivered';
COMMENT ON COLUMN contact_tracking.delivery_error_code IS 'Twilio error code if delivery failed';
COMMENT ON COLUMN contact_tracking.delivery_error_message IS 'Error message if delivery failed';

-- ==================== STEP 2: BACKFILL FROM CAMPAIGN_CONTACTS ====================

-- Copy delivery data from campaign_contacts to contact_tracking
-- Uses the contact_tracking_id FK to match records
UPDATE contact_tracking ct
SET
  phone = cc.phone,
  twilio_sid = cc.twilio_sid,
  delivery_status = COALESCE(cc.delivery_status, 'pending'),
  delivery_error_code = cc.error_code,
  delivery_error_message = cc.error_message
FROM campaign_contacts cc
WHERE cc.contact_tracking_id = ct.id
  AND cc.twilio_sid IS NOT NULL;

-- For contact_tracking records without campaign_contacts, try to match by customer_id + campaign_id
-- This catches automation sends that created contact_tracking but not campaign_contacts
UPDATE contact_tracking ct
SET
  phone = cc.phone,
  twilio_sid = cc.twilio_sid,
  delivery_status = COALESCE(cc.delivery_status, ct.delivery_status, 'pending'),
  delivery_error_code = COALESCE(cc.error_code, ct.delivery_error_code),
  delivery_error_message = COALESCE(cc.error_message, ct.delivery_error_message)
FROM campaign_contacts cc
WHERE ct.twilio_sid IS NULL  -- Only update if not already set
  AND cc.customer_id = ct.customer_id
  AND cc.campaign_id = ct.campaign_id
  AND cc.twilio_sid IS NOT NULL;

-- ==================== STEP 3: CREATE INDEXES ====================

-- Index for webhook lookups by twilio_sid (CRITICAL for performance)
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_tracking_twilio_sid
ON contact_tracking(twilio_sid) WHERE twilio_sid IS NOT NULL;

-- Index for delivery status queries
CREATE INDEX IF NOT EXISTS idx_contact_tracking_delivery_status
ON contact_tracking(delivery_status);

-- Composite index for campaign delivery metrics
CREATE INDEX IF NOT EXISTS idx_contact_tracking_campaign_delivery
ON contact_tracking(campaign_id, delivery_status) WHERE campaign_id IS NOT NULL;

-- ==================== STEP 4: UPDATE RECORD_AUTOMATION_CONTACT FUNCTION ====================

-- Updated function now populates delivery fields directly in contact_tracking
-- No longer creates campaign_contacts bridge record (deprecated)
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

  -- 1. Create contact tracking record WITH delivery fields (unified!)
  INSERT INTO contact_tracking (
    customer_id,
    customer_name,
    contact_method,
    campaign_id,
    campaign_name,
    campaign_type,
    status,
    expires_at,
    -- NEW: Delivery fields
    phone,
    twilio_sid,
    delivery_status
  ) VALUES (
    p_customer_id,
    p_customer_name,
    'whatsapp',
    v_campaign_id,
    'Auto: ' || v_rule.name,
    v_campaign_type,
    'pending',
    NOW() + (COALESCE(v_rule.cooldown_days, 14) || ' days')::INTERVAL,
    -- NEW: Delivery fields
    p_phone,
    p_message_sid,
    CASE WHEN p_message_sid IS NOT NULL THEN 'sent' ELSE 'pending' END
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
Creates: contact_tracking (with delivery fields), campaign_contacts (deprecated), automation_sends.
v2.0: Now populates phone, twilio_sid, delivery_status directly in contact_tracking.';

-- ==================== STEP 5: NEW UNIFIED FUNCTION FOR MANUAL CAMPAIGNS ====================

-- This function is called by the JavaScript API for manual campaign sends
-- It creates a contact_tracking record with delivery fields (no campaign_contacts needed)
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
BEGIN
  -- Get campaign name
  SELECT name INTO v_campaign_name FROM campaigns WHERE id = p_campaign_id;
  v_campaign_name := COALESCE(v_campaign_name, p_campaign_id);

  -- Calculate expiry: coupon validity + 3 day buffer
  v_expiry_days := p_coupon_validity_days + 3;

  -- Create unified contact_tracking record with delivery fields
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
    delivery_status
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
    CASE WHEN p_twilio_sid IS NOT NULL THEN 'sent' ELSE 'pending' END
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
Replaces the old record_campaign_contact flow that required separate campaign_contacts insert.
v1.0: Creates contact_tracking with delivery fields + campaign_contacts (deprecated).';

-- ==================== STEP 6: UPDATE DELIVERY STATUS FROM WEBHOOK ====================

-- Function to update delivery status in contact_tracking (called by webhook)
-- This is the NEW path - update contact_tracking directly
CREATE OR REPLACE FUNCTION update_contact_delivery_status(
  p_twilio_sid TEXT,
  p_status TEXT,
  p_error_code INT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
  v_updated INT := 0;
BEGIN
  -- Update contact_tracking directly (new unified approach)
  UPDATE contact_tracking
  SET
    delivery_status = p_status,
    delivery_error_code = COALESCE(p_error_code, delivery_error_code),
    delivery_error_message = COALESCE(p_error_message, delivery_error_message),
    updated_at = NOW()
  WHERE twilio_sid = p_twilio_sid;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  -- Also update campaign_contacts for backward compatibility
  UPDATE campaign_contacts
  SET
    delivery_status = p_status,
    error_code = COALESCE(p_error_code, error_code),
    error_message = COALESCE(p_error_message, error_message)
  WHERE twilio_sid = p_twilio_sid;

  RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_contact_delivery_status IS
'Updates delivery status in contact_tracking from Twilio webhook.
Also updates campaign_contacts for backward compatibility.';

-- ==================== STEP 7: UPDATE CAMPAIGN_DELIVERY_METRICS VIEW ====================

-- Simplified view that queries contact_tracking directly (no more UNION!)
DROP VIEW IF EXISTS campaign_delivery_metrics CASCADE;

CREATE OR REPLACE VIEW campaign_delivery_metrics AS
SELECT
  ct.campaign_id,
  c.name as campaign_name,
  COUNT(DISTINCT ct.id) as total_sent,
  COUNT(DISTINCT CASE WHEN ct.delivery_status = 'delivered' THEN ct.id END) as delivered,
  COUNT(DISTINCT CASE WHEN ct.delivery_status = 'read' THEN ct.id END) as read,
  COUNT(DISTINCT CASE WHEN ct.delivery_status IN ('failed', 'undelivered') THEN ct.id END) as failed,
  ROUND(
    COUNT(DISTINCT CASE WHEN ct.delivery_status = 'delivered' THEN ct.id END)::NUMERIC /
    NULLIF(COUNT(DISTINCT ct.id), 0) * 100,
    1
  ) as delivery_rate,
  ROUND(
    COUNT(DISTINCT CASE WHEN ct.delivery_status = 'read' THEN ct.id END)::NUMERIC /
    NULLIF(COUNT(DISTINCT CASE WHEN ct.delivery_status = 'delivered' THEN ct.id END), 0) * 100,
    1
  ) as read_rate
FROM contact_tracking ct
JOIN campaigns c ON c.id = ct.campaign_id
WHERE ct.campaign_id IS NOT NULL
GROUP BY ct.campaign_id, c.name;

COMMENT ON VIEW campaign_delivery_metrics IS
'Campaign delivery metrics from contact_tracking (unified).
No longer uses UNION with webhook_events - all data in contact_tracking.';

-- ==================== STEP 8: GRANT PERMISSIONS ====================

GRANT SELECT ON campaign_delivery_metrics TO authenticated;
GRANT SELECT ON campaign_delivery_metrics TO anon;

-- ==================== VERIFICATION QUERIES ====================
-- Run these after migration to verify success:

-- Check backfill results:
-- SELECT
--   COUNT(*) as total_contacts,
--   COUNT(twilio_sid) as with_twilio_sid,
--   COUNT(phone) as with_phone,
--   COUNT(CASE WHEN delivery_status != 'pending' THEN 1 END) as with_delivery_status
-- FROM contact_tracking;

-- Compare old vs new delivery metrics:
-- SELECT campaign_id, campaign_name, total_sent, delivered, delivery_rate
-- FROM campaign_delivery_metrics
-- ORDER BY total_sent DESC
-- LIMIT 10;

-- Check for any orphaned campaign_contacts (should decrease over time):
-- SELECT COUNT(*) FROM campaign_contacts cc
-- WHERE NOT EXISTS (
--   SELECT 1 FROM contact_tracking ct WHERE ct.id = cc.contact_tracking_id
-- );
