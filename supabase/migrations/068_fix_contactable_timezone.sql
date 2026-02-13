-- Fix is_customer_contactable() to use Brazil timezone for date comparisons
-- CURRENT_DATE and contacted_at::DATE both use UTC on Supabase,
-- which can be off by 1 day during Brazil's evening hours (21:00-23:59).
-- Changes:
--   CURRENT_DATE → (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE
--   contacted_at::DATE → (contacted_at AT TIME ZONE 'America/Sao_Paulo')::DATE

CREATE OR REPLACE FUNCTION is_customer_contactable(
  p_customer_id TEXT,
  p_campaign_type TEXT DEFAULT NULL,
  p_min_days_global INTEGER DEFAULT 7,
  p_min_days_same_type INTEGER DEFAULT 14,
  p_bypass_global BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(is_contactable BOOLEAN, reason TEXT, last_contact_date DATE, days_since_contact INTEGER)
LANGUAGE plpgsql AS $$
DECLARE
  v_last_global_contact DATE;
  v_last_same_type_contact DATE;
  v_days_global INTEGER;
  v_days_same_type INTEGER;
  v_is_blacklisted BOOLEAN;
  v_opted_out_at TIMESTAMPTZ;
  v_today DATE := (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE;
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
  SELECT MAX(engaged_at) INTO v_opted_out_at
  FROM contact_tracking
  WHERE customer_id = p_customer_id
    AND engagement_type = 'button_optout'
    AND engaged_at > CURRENT_TIMESTAMP - INTERVAL '90 days';

  IF v_opted_out_at IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, 'Customer opted out recently'::TEXT, v_opted_out_at::DATE,
      EXTRACT(DAY FROM CURRENT_TIMESTAMP - v_opted_out_at)::INTEGER;
    RETURN;
  END IF;

  -- Get last contact date for ANY campaign type (global cooldown)
  SELECT MAX((contacted_at AT TIME ZONE 'America/Sao_Paulo')::DATE),
         v_today - MAX((contacted_at AT TIME ZONE 'America/Sao_Paulo')::DATE)
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
    DECLARE
      v_type_cooldown INTEGER;
    BEGIN
      -- Look up cooldown_days from automation_rules (user-configured in UI)
      SELECT COALESCE(MIN(ar.cooldown_days), p_min_days_same_type)
      INTO v_type_cooldown
      FROM automation_rules ar
      WHERE ar.enabled = true
        AND CASE p_campaign_type
          WHEN 'winback' THEN ar.action_template IN ('winback_discount', 'winback_critical')
          WHEN 'welcome' THEN ar.action_template = 'welcome_new'
          WHEN 'wallet' THEN ar.action_template = 'wallet_reminder'
          WHEN 'post_visit' THEN ar.action_template = 'post_visit_thanks'
          WHEN 'rfm_loyalty' THEN ar.action_template = 'rfm_loyalty_vip'
          WHEN 'weather' THEN ar.action_template = 'weather_promo'
          WHEN 'anniversary' THEN ar.action_template = 'registration_anniversary'
          WHEN 'churned' THEN ar.action_template = 'churned_recovery'
          ELSE FALSE
        END;

      SELECT MAX((contacted_at AT TIME ZONE 'America/Sao_Paulo')::DATE),
             v_today - MAX((contacted_at AT TIME ZONE 'America/Sao_Paulo')::DATE)
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
$$;
