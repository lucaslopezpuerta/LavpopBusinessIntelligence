-- Migration: 059_fix_transaction_timestamps.sql
-- Purpose: Fix timestamps that were stored without timezone (treated as UTC but were Brazil time)
--
-- Problem: POS exports "10:22:00" (Brazil local time), parser stored as "10:22:00" without TZ
--          PostgreSQL assumed UTC, so "10:22 UTC" displays as "07:22 Brazil" (wrong!)
--
-- Fix: Add 3 hours to convert Brazil local time to actual UTC
--      "10:22 Brazil" = "13:22 UTC" → displays as "10:22 Brazil" ✓
--
-- Note: The supabase_uploader.py has been updated to include -03:00 timezone
--       in all future imports, so this migration only fixes historical data.

-- Step 1: Fix transactions table (add 3 hours to convert Brazil→UTC)
UPDATE transactions
SET data_hora = data_hora + INTERVAL '3 hours'
WHERE data_hora IS NOT NULL;

-- Step 2: Fix customers table
UPDATE customers
SET data_cadastro = data_cadastro + INTERVAL '3 hours'
WHERE data_cadastro IS NOT NULL;

-- Step 3: Refresh materialized view
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_revenue;

-- Verification (run after migration):
-- SELECT
--   EXTRACT(HOUR FROM data_hora AT TIME ZONE 'America/Sao_Paulo') as brazil_hour,
--   COUNT(*) as transactions
-- FROM transactions
-- WHERE data_hora >= NOW() - INTERVAL '7 days'
-- GROUP BY brazil_hour
-- ORDER BY brazil_hour;
--
-- Expected: Hours should match business hours (8-23 for 8 AM - 11 PM)
