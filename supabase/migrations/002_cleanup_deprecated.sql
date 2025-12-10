-- Migration: Cleanup deprecated columns, views, and functions
-- Date: 2025-12-10
-- Version: 1.0
--
-- This migration removes deprecated items after the RFM segmentation update:
-- 1. Drops risk_level column from customers (now computed client-side)
-- 2. Drops classify_customer_risk() function (replaced by calculate_rfm_segment)
-- 3. Updates customer_summary view to remove risk_level reference
-- 4. Removes deprecated indexes and grants

-- ==================== DROP DEPRECATED FUNCTION ====================

-- Drop the old risk classification function (replaced by calculate_rfm_segment)
DROP FUNCTION IF EXISTS classify_customer_risk(INTEGER, DATE);

-- ==================== UPDATE VIEWS ====================

-- Drop and recreate customer_summary view WITHOUT risk_level
DROP VIEW IF EXISTS customer_summary CASCADE;

CREATE OR REPLACE VIEW customer_summary AS
SELECT
  c.doc,
  c.nome,
  c.telefone,
  c.email,
  c.saldo_carteira,
  c.rfm_segment,
  c.r_score,
  c.f_score,
  c.m_score,
  c.recent_monetary_90d,
  -- Transaction stats
  COUNT(t.id) FILTER (WHERE NOT t.is_recarga) as transaction_count,
  COUNT(t.id) FILTER (WHERE t.is_recarga) as recarga_count,
  COALESCE(SUM(t.net_value) FILTER (WHERE NOT t.is_recarga), 0) as total_spent,
  COALESCE(SUM(t.total_services), 0) as total_services,
  COALESCE(SUM(t.wash_count), 0) as total_washes,
  COALESCE(SUM(t.dry_count), 0) as total_drys,
  COALESCE(SUM(t.cashback_amount), 0) as total_cashback,
  -- Date stats
  MIN(t.data_hora)::DATE as first_visit,
  MAX(t.data_hora)::DATE as last_visit,
  (CURRENT_DATE - MAX(t.data_hora)::DATE) as days_since_last_visit,
  -- Coupon usage
  COUNT(t.id) FILTER (WHERE t.usou_cupom) as coupon_uses,
  -- Average ticket
  ROUND(
    COALESCE(SUM(t.net_value) FILTER (WHERE NOT t.is_recarga), 0) /
    NULLIF(COUNT(t.id) FILTER (WHERE NOT t.is_recarga), 0),
    2
  ) as avg_ticket
FROM customers c
LEFT JOIN transactions t ON c.doc = t.doc_cliente
GROUP BY c.doc, c.nome, c.telefone, c.email, c.saldo_carteira, c.rfm_segment, c.r_score, c.f_score, c.m_score, c.recent_monetary_90d;

-- Grant permissions on recreated view
GRANT SELECT ON customer_summary TO authenticated;

-- ==================== DROP DEPRECATED COLUMN ====================

-- Drop the deprecated risk_level column from customers table
-- NOTE: This permanently removes the column - ensure you've backed up if needed
ALTER TABLE customers DROP COLUMN IF EXISTS risk_level;

-- ==================== DROP DEPRECATED INDEX ====================

-- Drop index on risk_level (if it exists)
DROP INDEX IF EXISTS idx_customers_risk;
DROP INDEX IF EXISTS idx_customers_risk_level;

-- ==================== COMMENTS ====================

COMMENT ON VIEW customer_summary IS 'Customer metrics aggregated from transactions. RFM segments: VIP, Frequente, Promissor, Novato, Esfriando, Inativo. Churn risk computed client-side.';
COMMENT ON TABLE customers IS 'Customer master data. RFM segments computed by refresh_customer_metrics(). Churn risk levels (Saudável, Monitorar, Em Risco, Crítico, Novo, Perdido) computed client-side in customerMetrics.js.';

-- ==================== VERIFICATION ====================

-- Verify the cleanup was successful
DO $$
DECLARE
  col_exists BOOLEAN;
  func_exists BOOLEAN;
BEGIN
  -- Check if risk_level column was dropped
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'risk_level'
  ) INTO col_exists;

  IF col_exists THEN
    RAISE WARNING 'risk_level column still exists in customers table';
  ELSE
    RAISE NOTICE 'SUCCESS: risk_level column removed from customers table';
  END IF;

  -- Check if classify_customer_risk function was dropped
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'classify_customer_risk'
  ) INTO func_exists;

  IF func_exists THEN
    RAISE WARNING 'classify_customer_risk function still exists';
  ELSE
    RAISE NOTICE 'SUCCESS: classify_customer_risk function removed';
  END IF;
END $$;
