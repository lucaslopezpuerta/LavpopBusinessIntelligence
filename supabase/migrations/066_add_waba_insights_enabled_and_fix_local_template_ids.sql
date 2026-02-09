-- Migration 066: Add waba_insights_enabled column + fix local_template_id mappings
-- Applied: 2026-02-09
--
-- Context: waba-analytics.js v1.6 needs a waba_insights_enabled flag in app_settings
-- to cache the one-time Meta API call to enable template analytics on the WABA.
-- Also fixes all local_template_id values that were NULL because Meta returns
-- Twilio-suffixed names (e.g. lavpop_winback_desconto_hx58267edb...) that didn't
-- match our exact-match mapping.

-- Add waba_insights_enabled column to app_settings
ALTER TABLE app_settings
ADD COLUMN IF NOT EXISTS waba_insights_enabled boolean DEFAULT false;

-- Fix local_template_id for all existing Twilio-suffixed template names using prefix matching
UPDATE waba_templates SET local_template_id = 'winback_discount' WHERE name LIKE 'lavpop_winback_desconto%' AND local_template_id IS NULL;
UPDATE waba_templates SET local_template_id = 'winback_wash_only' WHERE name LIKE 'lavpop_winback_lavagem%' AND local_template_id IS NULL;
UPDATE waba_templates SET local_template_id = 'winback_dry_only' WHERE name LIKE 'lavpop_winback_secagem%' AND local_template_id IS NULL;
UPDATE waba_templates SET local_template_id = 'winback_critical' WHERE name LIKE 'lavpop_winback_urgente%' AND local_template_id IS NULL;
UPDATE waba_templates SET local_template_id = 'welcome_new' WHERE name LIKE 'lavpop_boasvindas%' AND local_template_id IS NULL;
UPDATE waba_templates SET local_template_id = 'wallet_reminder' WHERE name LIKE 'lavpop_saldo_carteira%' AND local_template_id IS NULL;
UPDATE waba_templates SET local_template_id = 'promo_general' WHERE name LIKE 'lavpop_promocao%' AND local_template_id IS NULL;
UPDATE waba_templates SET local_template_id = 'promo_secagem' WHERE name LIKE 'lavpop_promo_secagem%' AND local_template_id IS NULL;
UPDATE waba_templates SET local_template_id = 'upsell_secagem' WHERE name LIKE 'lavpop_complete_secagem%' AND local_template_id IS NULL;
UPDATE waba_templates SET local_template_id = 'post_visit_thanks' WHERE name LIKE 'lavpop_pos_visita%' AND local_template_id IS NULL;
