-- Migration: 056_remove_unused_indexes.sql
-- Purpose: Remove indexes with 0 usage (confirmed via pg_stat_user_indexes)
-- Risk: NONE - these indexes have never been used according to stats
-- Benefit: ~1MB storage freed, reduced write overhead
-- Rollback: See schema.sql for original CREATE INDEX statements

-- Customers table (6 unused indexes, ~464KB)
DROP INDEX CONCURRENTLY IF EXISTS idx_customers_phone;
DROP INDEX CONCURRENTLY IF EXISTS idx_customers_weather_cooldown;
DROP INDEX CONCURRENTLY IF EXISTS idx_customers_registration;
DROP INDEX CONCURRENTLY IF EXISTS idx_customers_welcome_sent;
DROP INDEX CONCURRENTLY IF EXISTS idx_customers_post_visit_sent;
DROP INDEX CONCURRENTLY IF EXISTS idx_customers_churned_recovery;

-- Analytics tables (low-traffic, indexes unnecessary)
DROP INDEX CONCURRENTLY IF EXISTS idx_instagram_metrics_date;
DROP INDEX CONCURRENTLY IF EXISTS idx_waba_templates_waba;
DROP INDEX CONCURRENTLY IF EXISTS idx_waba_templates_name;
DROP INDEX CONCURRENTLY IF EXISTS idx_waba_templates_local;
DROP INDEX CONCURRENTLY IF EXISTS idx_waba_template_analytics_waba;

-- Campaign tables
DROP INDEX CONCURRENTLY IF EXISTS idx_campaigns_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_campaign_sends_campaign_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_scheduled_created_at;

-- Other unused indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_comm_logs_type;
DROP INDEX CONCURRENTLY IF EXISTS idx_coupon_redemptions_cupom;
DROP INDEX CONCURRENTLY IF EXISTS idx_coupon_redemptions_date;
DROP INDEX CONCURRENTLY IF EXISTS idx_webhook_events_phone;
DROP INDEX CONCURRENTLY IF EXISTS idx_automation_rules_campaign_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_automation_rules_send_days;
DROP INDEX CONCURRENTLY IF EXISTS idx_weather_comfort;
DROP INDEX CONCURRENTLY IF EXISTS idx_weather_source;
DROP INDEX CONCURRENTLY IF EXISTS idx_twilio_inbound_type;
DROP INDEX CONCURRENTLY IF EXISTS idx_twilio_inbound_phone;
DROP INDEX CONCURRENTLY IF EXISTS idx_twilio_inbound_customer;
DROP INDEX CONCURRENTLY IF EXISTS idx_tracking_failures_twilio_sid;
DROP INDEX CONCURRENTLY IF EXISTS idx_revenue_predictions_evaluated;
DROP INDEX CONCURRENTLY IF EXISTS idx_rate_limits_window_start;

-- Google Business (empty tables)
DROP INDEX CONCURRENTLY IF EXISTS idx_gbp_reviews_location;
DROP INDEX CONCURRENTLY IF EXISTS idx_gbp_reviews_date;
DROP INDEX CONCURRENTLY IF EXISTS idx_gbp_reviews_rating;
