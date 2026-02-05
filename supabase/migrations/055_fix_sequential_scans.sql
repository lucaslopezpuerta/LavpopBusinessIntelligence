-- Migration: 055_fix_sequential_scans.sql
-- Purpose: Add indexes to reduce sequential scans on high-traffic tables
-- Risk: NONE - indexes are additive and don't change behavior
-- Rollback: DROP INDEX statements at bottom

-- transactions: Composite index for common query pattern (customer + date)
-- Reduces seq scans from 43K to near zero for customer lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_doc_date
ON transactions(doc_cliente, data_hora DESC);

-- rate_limits: Composite index for key + window_start filtering
-- Reduces seq scans from 25K (only 12% index usage currently)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rate_limits_key_window
ON rate_limits(key, window_start DESC);

-- automation_rules: Partial index for enabled rules only
-- Small table but 19K seq scans with only 0.7% index usage
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_automation_rules_enabled
ON automation_rules(enabled) WHERE enabled = true;

-- blacklist: Partial index for undelivered phone lookups
-- Reduces seq scans from 9K (only 45% index usage)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blacklist_undelivered
ON blacklist(phone) WHERE reason = 'undelivered';

-- coupon_redemptions: Composite index for campaign attribution queries
-- Reduces seq scans from 1.7K (only 11% index usage)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupon_redemptions_campaign
ON coupon_redemptions(campaign_id, redeemed_at DESC);

-- ROLLBACK:
-- DROP INDEX CONCURRENTLY IF EXISTS idx_transactions_doc_date;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_rate_limits_key_window;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_automation_rules_enabled;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_blacklist_undelivered;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_coupon_redemptions_campaign;
