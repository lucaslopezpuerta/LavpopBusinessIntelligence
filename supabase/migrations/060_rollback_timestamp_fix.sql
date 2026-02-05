-- Migration: 060_rollback_timestamp_fix.sql
-- Purpose: Fix timestamp issues discovered through careful POS comparison
--
-- TIMELINE OF FIXES:
-- 1. Migration 059 added +3 hours assuming data was "Brazil time labeled as UTC" - WRONG
-- 2. Rollback -3 hours to restore original state
-- 3. Analysis revealed TWO different issues by source:
--    - manual_upload: timestamps were CORRECT
--    - automated_upload: timestamps were 6 HOURS BEHIND
--
-- ROOT CAUSE:
-- The automated POS scraper (POS_automation.py) runs in an environment that
-- introduces a 6-hour offset (likely double timezone conversion).
-- Manual uploads via browser don't have this issue.
--
-- FIX APPLIED:
-- 1. Rolled back migration 059 (-3 hours)
-- 2. Added +6 hours ONLY to automated_upload transactions
-- 3. Materialized view uses AT TIME ZONE for correct Brazil date grouping
--
-- VERIFICATION (compare to POS screenshot):
-- SELECT to_char(data_hora AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI'), nome_cliente
-- FROM transactions WHERE data_hora >= '2026-02-03' ORDER BY data_hora DESC LIMIT 30;

-- CORRECTION HISTORY (applied via Supabase MCP):
-- 1. Initially added +6 hours to automated_upload (OVER-CORRECTED)
-- 2. Subtracted 3 hours to fix: net result is +3 hours
-- UPDATE transactions SET data_hora = data_hora + INTERVAL '6 hours' WHERE source_file = 'automated_upload';
-- UPDATE transactions SET data_hora = data_hora - INTERVAL '3 hours' WHERE source_file = 'automated_upload';
--
-- NET EFFECT: automated_upload timestamps shifted by +3 hours total

-- Materialized view with proper timezone conversion
DROP MATERIALIZED VIEW IF EXISTS mv_daily_revenue;

CREATE MATERIALIZED VIEW mv_daily_revenue AS
SELECT
  DATE(data_hora AT TIME ZONE 'America/Sao_Paulo') as date,
  COUNT(*) FILTER (WHERE NOT is_recarga) as transactions,
  COUNT(*) FILTER (WHERE is_recarga) as recargas,
  COALESCE(SUM(total_services), 0) as total_services,
  COALESCE(SUM(wash_count), 0) as washes,
  COALESCE(SUM(dry_count), 0) as drys,
  COALESCE(SUM(net_value) FILTER (WHERE NOT is_recarga), 0) as service_revenue,
  COALESCE(SUM(valor_pago) FILTER (WHERE is_recarga), 0) as recarga_revenue,
  COALESCE(SUM(net_value) FILTER (WHERE NOT is_recarga), 0) +
    COALESCE(SUM(valor_pago) FILTER (WHERE is_recarga), 0) as total_revenue,
  COALESCE(SUM(cashback_amount), 0) as cashback_given,
  COUNT(*) FILTER (WHERE usou_cupom) as coupon_uses
FROM transactions
GROUP BY DATE(data_hora AT TIME ZONE 'America/Sao_Paulo')
ORDER BY date DESC;

CREATE UNIQUE INDEX idx_mv_daily_revenue_date ON mv_daily_revenue(date);
GRANT SELECT ON mv_daily_revenue TO authenticated;
GRANT SELECT ON mv_daily_revenue TO anon;

-- FUTURE: Monitor automated uploads for continued 6-hour offset
-- If new automated uploads are still wrong, fix the POS_automation.py environment
