-- Migration: 057_daily_revenue_materialized.sql
-- Purpose: Create materialized view for daily revenue (used by ML predictions)
-- Risk: NONE - creates NEW object, doesn't replace existing daily_revenue view
-- Benefit: Pre-computed aggregation eliminates full table scan on every query
--
-- IMPORTANT: Uses Brazil timezone (America/Sao_Paulo) for date grouping
-- This ensures transactions at 11 PM Brazil time appear on the correct day,
-- not shifted to the next UTC day.

-- Drop if exists (for re-running migration)
DROP MATERIALIZED VIEW IF EXISTS mv_daily_revenue;

-- Create materialized view matching original daily_revenue columns exactly
-- Uses Brazil timezone for correct date grouping
CREATE MATERIALIZED VIEW mv_daily_revenue AS
SELECT
  DATE(data_hora AT TIME ZONE 'America/Sao_Paulo') as date,
  -- Transaction counts
  COUNT(*) FILTER (WHERE NOT is_recarga) as transactions,
  COUNT(*) FILTER (WHERE is_recarga) as recargas,
  -- Service counts
  COALESCE(SUM(total_services), 0) as total_services,
  COALESCE(SUM(wash_count), 0) as washes,
  COALESCE(SUM(dry_count), 0) as drys,
  -- Revenue breakdown
  COALESCE(SUM(net_value) FILTER (WHERE NOT is_recarga), 0) as service_revenue,
  COALESCE(SUM(valor_pago) FILTER (WHERE is_recarga), 0) as recarga_revenue,
  -- Total revenue (service + recarga) - for prediction models
  COALESCE(SUM(net_value) FILTER (WHERE NOT is_recarga), 0) +
    COALESCE(SUM(valor_pago) FILTER (WHERE is_recarga), 0) as total_revenue,
  -- Other metrics
  COALESCE(SUM(cashback_amount), 0) as cashback_given,
  COUNT(*) FILTER (WHERE usou_cupom) as coupon_uses
FROM transactions
GROUP BY DATE(data_hora AT TIME ZONE 'America/Sao_Paulo')
ORDER BY date DESC;

-- Create unique index for REFRESH CONCURRENTLY support
CREATE UNIQUE INDEX idx_mv_daily_revenue_date ON mv_daily_revenue(date);

-- Grant same permissions as original view
GRANT SELECT ON mv_daily_revenue TO authenticated;
GRANT SELECT ON mv_daily_revenue TO anon;

-- USAGE NOTES:
-- This materialized view is a drop-in replacement for daily_revenue
-- To refresh after bulk imports:
--   REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_revenue;
--
-- ROLLBACK:
-- DROP MATERIALIZED VIEW IF EXISTS mv_daily_revenue;
