-- Migration: Add enhanced automation control columns (v6.0)
-- Date: 2025-12-12
-- Purpose: Enable send windows, day restrictions, daily limits, and targeting filters
--
-- New columns:
--   - send_window_start/end: Time window for sending (Brazil timezone)
--   - send_days: Days of week when sending is allowed (1=Mon, 7=Sun)
--   - max_daily_sends: Daily rate limit per automation
--   - daily_sends_count/last_daily_reset: Daily tracking with auto-reset
--   - exclude_recent_days: Exclude customers who visited recently
--   - min_total_spent: Minimum lifetime spend threshold
--   - wallet_balance_max: Maximum wallet balance for wallet_reminder

-- ==================== ADD COLUMNS ====================

-- Send time window (checked by scheduler in Brazil timezone)
ALTER TABLE automation_rules
ADD COLUMN IF NOT EXISTS send_window_start TIME DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS send_window_end TIME DEFAULT '20:00';

-- Day of week restrictions (1=Mon, 2=Tue, ..., 7=Sun)
-- Default: weekdays only (Mon-Fri)
ALTER TABLE automation_rules
ADD COLUMN IF NOT EXISTS send_days INTEGER[] DEFAULT '{1,2,3,4,5}';

-- Daily rate limiting
ALTER TABLE automation_rules
ADD COLUMN IF NOT EXISTS max_daily_sends INTEGER,
ADD COLUMN IF NOT EXISTS daily_sends_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_daily_reset DATE;

-- Exclude recent visitors (days since last visit to exclude)
-- null = don't exclude (for welcome, wallet_reminder, post_visit)
ALTER TABLE automation_rules
ADD COLUMN IF NOT EXISTS exclude_recent_days INTEGER;

-- Minimum spend threshold
ALTER TABLE automation_rules
ADD COLUMN IF NOT EXISTS min_total_spent DECIMAL(10,2);

-- Wallet balance range (for wallet_reminder)
ALTER TABLE automation_rules
ADD COLUMN IF NOT EXISTS wallet_balance_max DECIMAL(10,2);

-- ==================== SET DEFAULTS PER RULE TYPE ====================

-- winback_30: exclude visitors from last 3 days, default time window
UPDATE automation_rules
SET send_window_start = '09:00',
    send_window_end = '20:00',
    send_days = '{1,2,3,4,5}',
    exclude_recent_days = 3
WHERE id = 'winback_30' AND send_window_start IS NULL;

-- winback_45: exclude visitors from last 3 days, require min spend of R$50
UPDATE automation_rules
SET send_window_start = '09:00',
    send_window_end = '20:00',
    send_days = '{1,2,3,4,5}',
    exclude_recent_days = 3,
    min_total_spent = 50.00
WHERE id = 'winback_45' AND send_window_start IS NULL;

-- welcome_new: NO exclude_recent_days (targets new customers!)
UPDATE automation_rules
SET send_window_start = '09:00',
    send_window_end = '20:00',
    send_days = '{1,2,3,4,5}',
    exclude_recent_days = NULL
WHERE id = 'welcome_new' AND send_window_start IS NULL;

-- wallet_reminder: NO exclude_recent_days, add wallet_balance_max
UPDATE automation_rules
SET send_window_start = '09:00',
    send_window_end = '20:00',
    send_days = '{1,2,3,4,5}',
    exclude_recent_days = NULL,
    wallet_balance_max = 200.00
WHERE id = 'wallet_reminder' AND send_window_start IS NULL;

-- post_visit: NO exclude_recent_days (targets recent visitors!), all days
UPDATE automation_rules
SET send_window_start = '09:00',
    send_window_end = '20:00',
    send_days = '{1,2,3,4,5,6,7}',
    exclude_recent_days = NULL
WHERE id = 'post_visit' AND send_window_start IS NULL;

-- ==================== ADD COMMENTS ====================

COMMENT ON COLUMN automation_rules.send_window_start IS 'Start time for sending (Brazil timezone, HH:MM)';
COMMENT ON COLUMN automation_rules.send_window_end IS 'End time for sending (Brazil timezone, HH:MM)';
COMMENT ON COLUMN automation_rules.send_days IS 'Days of week allowed for sending (1=Mon, 7=Sun)';
COMMENT ON COLUMN automation_rules.max_daily_sends IS 'Maximum messages per day (null = unlimited)';
COMMENT ON COLUMN automation_rules.daily_sends_count IS 'Current daily send count (reset by scheduler)';
COMMENT ON COLUMN automation_rules.last_daily_reset IS 'Date when daily count was last reset';
COMMENT ON COLUMN automation_rules.exclude_recent_days IS 'Exclude customers who visited within X days (null = dont exclude)';
COMMENT ON COLUMN automation_rules.min_total_spent IS 'Minimum lifetime spend required (null = no minimum)';
COMMENT ON COLUMN automation_rules.wallet_balance_max IS 'Maximum wallet balance to target (for wallet_reminder)';

-- ==================== CREATE INDEX ====================

-- Index for efficient filtering by send_days (GIN for array containment)
CREATE INDEX IF NOT EXISTS idx_automation_rules_send_days ON automation_rules USING GIN (send_days);
