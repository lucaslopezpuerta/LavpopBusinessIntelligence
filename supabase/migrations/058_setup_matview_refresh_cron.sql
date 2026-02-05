-- Migration: 058_setup_matview_refresh_cron.sql
-- Purpose: Set up automatic refresh of mv_daily_revenue materialized view
-- Requires: pg_cron extension

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing jobs if any (idempotent)
SELECT cron.unschedule('refresh-mv-daily-revenue') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'refresh-mv-daily-revenue'
);
SELECT cron.unschedule('refresh-mv-daily-revenue-4h') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'refresh-mv-daily-revenue-4h'
);

-- Schedule automatic refresh of mv_daily_revenue
-- Primary: Runs daily at 6 AM Brazil time (9 AM UTC) after POS data sync
SELECT cron.schedule(
  'refresh-mv-daily-revenue',
  '0 9 * * *',  -- 9 AM UTC = 6 AM BRT
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_revenue$$
);

-- Secondary: Refresh every 4 hours to match frontend cache TTL
SELECT cron.schedule(
  'refresh-mv-daily-revenue-4h',
  '0 */4 * * *',  -- Every 4 hours at :00
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_revenue$$
);

-- VERIFICATION:
-- SELECT * FROM cron.job;
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- ROLLBACK:
-- SELECT cron.unschedule('refresh-mv-daily-revenue');
-- SELECT cron.unschedule('refresh-mv-daily-revenue-4h');
