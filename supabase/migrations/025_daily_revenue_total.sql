-- Migration: 025_daily_revenue_total.sql
-- Date: 2025-12-21
-- Description: Add total_revenue column to daily_revenue view
--
-- The daily_revenue view previously had:
--   - service_revenue: Machine usage revenue (net_value from non-recarga transactions)
--   - recarga_revenue: Credit top-up revenue (valor_pago from recarga transactions)
--
-- For revenue prediction models, we need total daily cash flow, not just machine usage.
-- This migration adds total_revenue = service_revenue + recarga_revenue.

-- Drop and recreate the view (CREATE OR REPLACE can't add columns)
DROP VIEW IF EXISTS daily_revenue;

CREATE VIEW daily_revenue AS
SELECT
  DATE(data_hora) as date,
  -- Transaction counts
  COUNT(*) FILTER (WHERE NOT is_recarga) as transactions,
  COUNT(*) FILTER (WHERE is_recarga) as recargas,
  -- Service counts
  SUM(total_services) as total_services,
  SUM(wash_count) as washes,
  SUM(dry_count) as drys,
  -- Revenue breakdown
  COALESCE(SUM(net_value) FILTER (WHERE NOT is_recarga), 0) as service_revenue,
  COALESCE(SUM(valor_pago) FILTER (WHERE is_recarga), 0) as recarga_revenue,
  -- NEW: Total revenue (service + recarga)
  COALESCE(SUM(net_value) FILTER (WHERE NOT is_recarga), 0) +
    COALESCE(SUM(valor_pago) FILTER (WHERE is_recarga), 0) as total_revenue,
  -- Other metrics
  COALESCE(SUM(cashback_amount), 0) as cashback_given,
  COUNT(*) FILTER (WHERE usou_cupom) as coupon_uses
FROM transactions
GROUP BY DATE(data_hora)
ORDER BY date DESC;

COMMENT ON VIEW daily_revenue IS 'Daily revenue aggregation with service_revenue (machine usage), recarga_revenue (top-ups), and total_revenue (both combined). Used by weather impact prediction model.';
