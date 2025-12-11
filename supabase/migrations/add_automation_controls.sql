-- Migration: Add automation control columns to automation_rules table
-- Date: 2025-12-11
-- Purpose: Enable configurable cooldowns, stop dates, send limits, and coupon settings

-- Add new columns for automation controls
ALTER TABLE automation_rules
ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cooldown_days INTEGER DEFAULT 14,
ADD COLUMN IF NOT EXISTS max_total_sends INTEGER,
ADD COLUMN IF NOT EXISTS total_sends_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS coupon_code TEXT,
ADD COLUMN IF NOT EXISTS discount_percent INTEGER,
ADD COLUMN IF NOT EXISTS coupon_validity_days INTEGER DEFAULT 7;

-- Update existing rules with sensible defaults based on rule type
-- winback_30: 30 day cooldown, VOLTE20 coupon
UPDATE automation_rules
SET cooldown_days = 30,
    coupon_code = 'VOLTE20',
    discount_percent = 20,
    coupon_validity_days = 7
WHERE id = 'winback_30' AND cooldown_days IS NULL;

-- winback_45: 21 day cooldown (since these are longer-lapsed customers)
UPDATE automation_rules
SET cooldown_days = 21,
    coupon_code = 'VOLTE25',
    discount_percent = 25,
    coupon_validity_days = 7
WHERE id = 'winback_45' AND cooldown_days IS NULL;

-- welcome: 365 day cooldown (only welcome once per year)
UPDATE automation_rules
SET cooldown_days = 365,
    coupon_code = 'BEM10',
    discount_percent = 10,
    coupon_validity_days = 14
WHERE id = 'welcome' AND cooldown_days IS NULL;

-- wallet_reminder: 14 day cooldown
UPDATE automation_rules
SET cooldown_days = 14,
    coupon_validity_days = 7
WHERE id = 'wallet_reminder' AND cooldown_days IS NULL;

-- post_visit: 7 day cooldown (frequent but not annoying)
UPDATE automation_rules
SET cooldown_days = 7,
    coupon_validity_days = 7
WHERE id = 'post_visit' AND cooldown_days IS NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN automation_rules.valid_until IS 'Stop date for automation (null = runs forever)';
COMMENT ON COLUMN automation_rules.cooldown_days IS 'Days before same customer can be targeted again';
COMMENT ON COLUMN automation_rules.max_total_sends IS 'Lifetime send limit for this rule (null = unlimited)';
COMMENT ON COLUMN automation_rules.total_sends_count IS 'Current count of sends for this rule';
COMMENT ON COLUMN automation_rules.coupon_code IS 'Specific coupon code for this rule (e.g., VOLTE20)';
COMMENT ON COLUMN automation_rules.discount_percent IS 'Discount percentage (e.g., 20)';
COMMENT ON COLUMN automation_rules.coupon_validity_days IS 'Days until coupon expires in message';
