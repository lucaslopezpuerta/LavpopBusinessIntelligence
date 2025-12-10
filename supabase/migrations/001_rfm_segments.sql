-- Migration: Add proper RFM segmentation to customers table
-- Date: 2025-12-10
-- Version: 2.0 - Updated with distinct Portuguese segment names
--
-- This migration:
-- 1. Adds RFM scoring columns (r_score, f_score, m_score, recent_monetary_90d)
-- 2. Creates calculate_rfm_segment() function with Portuguese segment names
-- 3. Updates refresh_customer_metrics() to compute true RFM segments
-- 4. Removes simple risk_level classification (now done client-side)
--
-- RFM Segments (Portuguese - Marketing Focus):
-- These names are DISTINCT from Churn Risk Levels to avoid confusion!
--
-- - VIP: Champion (R=5, F≥4, M≥4) - Best customers, top tier
-- - Frequente: Loyal (R≥4, F≥3, M≥3) - Regular visitors
-- - Promissor: Potential (R≥3, F≥2, M≥2) - Growing customers
-- - Novato: New (registered ≤30 days AND ≤2 transactions) - Newcomers
-- - Esfriando: At Risk (R=2, F=2 OR M=2) - Cooling off, needs attention
-- - Inativo: Lost - No recent engagement
--
-- Churn Risk Levels (computed client-side - DIFFERENT from RFM!):
-- - Saudável (Healthy), Monitorar (Monitor), Em Risco (At Risk)
-- - Crítico (Churning), Perdido (Lost), Novo (New Customer)
--
-- Scoring Thresholds (laundromat-optimized):
-- Recency (days since last visit): 5=≤21d, 4=≤45d, 3=≤90d, 2=≤180d, 1=>180d
-- Frequency (transaction count): 5=≥10, 4=≥6, 3=≥3, 2=2, 1=1
-- Monetary (90-day spending R$): 5=≥250, 4=≥150, 3=≥75, 2=≥36, 1=<36

-- ==================== ADD RFM COLUMNS ====================

-- Add RFM scoring columns if they don't exist
ALTER TABLE customers ADD COLUMN IF NOT EXISTS r_score INTEGER;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS f_score INTEGER;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS m_score INTEGER;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS recent_monetary_90d DECIMAL(10,2) DEFAULT 0;

-- Add index for RFM segment queries
CREATE INDEX IF NOT EXISTS idx_customers_rfm_segment ON customers(rfm_segment);

-- ==================== RFM CALCULATION FUNCTION ====================

-- Function to calculate RFM scores and segment
-- Returns segment name in Portuguese (distinct from Churn Risk Levels)
CREATE OR REPLACE FUNCTION calculate_rfm_segment(
  p_recency_days INTEGER,
  p_frequency INTEGER,
  p_monetary_90d DECIMAL,
  p_registration_days INTEGER
)
RETURNS TABLE (
  r_score INTEGER,
  f_score INTEGER,
  m_score INTEGER,
  segment TEXT
) AS $$
DECLARE
  v_r_score INTEGER;
  v_f_score INTEGER;
  v_m_score INTEGER;
  v_segment TEXT;
BEGIN
  -- Recency Score (R): Days since last purchase
  -- Lower is better → higher score
  v_r_score := CASE
    WHEN p_recency_days IS NULL THEN 1
    WHEN p_recency_days <= 21 THEN 5
    WHEN p_recency_days <= 45 THEN 4
    WHEN p_recency_days <= 90 THEN 3
    WHEN p_recency_days <= 180 THEN 2
    ELSE 1
  END;

  -- Frequency Score (F): Number of transactions
  -- Higher is better → higher score
  v_f_score := CASE
    WHEN p_frequency >= 10 THEN 5
    WHEN p_frequency >= 6 THEN 4
    WHEN p_frequency >= 3 THEN 3
    WHEN p_frequency = 2 THEN 2
    ELSE 1
  END;

  -- Monetary Score (M): Recent 90-day spending (R$)
  -- Higher is better → higher score
  v_m_score := CASE
    WHEN p_monetary_90d >= 250 THEN 5
    WHEN p_monetary_90d >= 150 THEN 4
    WHEN p_monetary_90d >= 75 THEN 3
    WHEN p_monetary_90d >= 36 THEN 2
    ELSE 1
  END;

  -- Segment Assignment (Portuguese marketing names - distinct from Churn Risk Levels)
  -- Order matters: more specific conditions first

  -- Novato: New customer (registered ≤30 days AND ≤2 transactions)
  IF p_registration_days IS NOT NULL AND p_registration_days <= 30 AND p_frequency <= 2 THEN
    v_segment := 'Novato';      -- Newcomer (not "Novo" which is a Churn Risk Level)

  -- VIP: Champion (R=5, F≥4, M≥4) - Best customers, top tier
  ELSIF v_r_score = 5 AND v_f_score >= 4 AND v_m_score >= 4 THEN
    v_segment := 'VIP';

  -- Frequente: Loyal (R≥4, F≥3, M≥3) - Regular visitors
  ELSIF v_r_score >= 4 AND v_f_score >= 3 AND v_m_score >= 3 THEN
    v_segment := 'Frequente';

  -- Promissor: Potential (R≥3, F≥2, M≥2) - Growing customers
  ELSIF v_r_score >= 3 AND v_f_score >= 2 AND v_m_score >= 2 THEN
    v_segment := 'Promissor';

  -- Esfriando: At Risk (R=2 AND (F=2 OR M=2)) - Cooling off, needs attention
  ELSIF v_r_score = 2 AND (v_f_score = 2 OR v_m_score = 2) THEN
    v_segment := 'Esfriando';   -- Cooling off (not "Em Risco" which is a Churn Risk Level)

  -- Inativo: Lost - All others (no recent engagement)
  ELSE
    v_segment := 'Inativo';     -- Inactive (not "Perdido" which is a Churn Risk Level)
  END IF;

  RETURN QUERY SELECT v_r_score, v_f_score, v_m_score, v_segment;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ==================== UPDATED REFRESH FUNCTION ====================

-- Drop the old simple risk classifier (no longer needed)
DROP FUNCTION IF EXISTS classify_customer_risk(INTEGER, DATE);

-- Updated function to refresh customer metrics with RFM calculation
CREATE OR REPLACE FUNCTION refresh_customer_metrics(p_customer_doc TEXT DEFAULT NULL)
RETURNS INT AS $$
DECLARE
  v_updated INT := 0;
BEGIN
  -- Update customer metrics from transactions
  -- Now includes proper RFM scoring instead of simple risk_level
  UPDATE customers c
  SET
    -- Basic metrics from transactions
    first_visit = sub.first_visit,
    last_visit = sub.last_visit,
    transaction_count = sub.transaction_count,
    total_spent = sub.total_spent,
    total_services = sub.total_services,
    days_since_last_visit = sub.days_since_last_visit,
    recent_monetary_90d = sub.recent_monetary_90d,

    -- RFM scores and segment
    r_score = rfm.r_score,
    f_score = rfm.f_score,
    m_score = rfm.m_score,
    rfm_segment = rfm.segment,

    updated_at = NOW()
  FROM (
    SELECT
      t.doc_cliente,
      MIN(t.data_hora)::DATE as first_visit,
      MAX(t.data_hora)::DATE as last_visit,
      COUNT(*) FILTER (WHERE NOT t.is_recarga) as transaction_count,
      COALESCE(SUM(t.net_value) FILTER (WHERE NOT t.is_recarga), 0) as total_spent,
      COALESCE(SUM(t.total_services), 0) as total_services,
      CURRENT_DATE - MAX(t.data_hora)::DATE as days_since_last_visit,
      -- Recent 90-day spending for M score
      COALESCE(SUM(t.net_value) FILTER (
        WHERE NOT t.is_recarga
        AND t.data_hora >= CURRENT_DATE - INTERVAL '90 days'
      ), 0) as recent_monetary_90d,
      -- Registration days (from customer data_cadastro)
      CURRENT_DATE - c2.data_cadastro::DATE as registration_days
    FROM transactions t
    LEFT JOIN customers c2 ON c2.doc = t.doc_cliente
    WHERE p_customer_doc IS NULL OR t.doc_cliente = p_customer_doc
    GROUP BY t.doc_cliente, c2.data_cadastro
  ) sub
  CROSS JOIN LATERAL calculate_rfm_segment(
    sub.days_since_last_visit,
    sub.transaction_count::INTEGER,
    sub.recent_monetary_90d,
    sub.registration_days
  ) rfm
  WHERE c.doc = sub.doc_cliente;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

-- ==================== COMPUTED FIELDS VIEW (UPDATED) ====================

-- Must DROP first because we're changing column order/names
-- (CREATE OR REPLACE VIEW cannot change column names)
DROP VIEW IF EXISTS customer_summary CASCADE;

-- Recreate the customer_summary view with RFM data
CREATE VIEW customer_summary AS
SELECT
  c.doc,
  c.nome,
  c.telefone,
  c.email,
  c.data_cadastro,
  c.saldo_carteira,
  c.first_visit,
  c.last_visit,
  c.transaction_count,
  c.total_spent,
  c.total_services,
  c.days_since_last_visit,
  c.recent_monetary_90d,
  c.r_score,
  c.f_score,
  c.m_score,
  c.rfm_segment,
  -- Derived metrics
  CASE
    WHEN c.transaction_count > 0 THEN ROUND(c.total_spent / c.transaction_count, 2)
    ELSE 0
  END as avg_transaction_value,
  CASE
    WHEN c.transaction_count > 1 AND c.first_visit IS NOT NULL AND c.last_visit IS NOT NULL
    THEN ROUND((c.last_visit - c.first_visit)::NUMERIC / GREATEST(c.transaction_count - 1, 1), 1)
    ELSE NULL
  END as visit_frequency_days
FROM customers c;

-- Re-grant permissions on the recreated view
GRANT SELECT ON customer_summary TO authenticated;

-- ==================== COMMENTS ====================

COMMENT ON COLUMN customers.r_score IS 'Recency score (1-5): Days since last visit. 5=recent, 1=old';
COMMENT ON COLUMN customers.f_score IS 'Frequency score (1-5): Transaction count. 5=frequent, 1=rare';
COMMENT ON COLUMN customers.m_score IS 'Monetary score (1-5): 90-day spending. 5=high spender, 1=low spender';
COMMENT ON COLUMN customers.recent_monetary_90d IS 'Total spending in last 90 days (R$)';
COMMENT ON COLUMN customers.rfm_segment IS 'RFM segment: VIP, Frequente, Promissor, Novato, Esfriando, Inativo';
-- NOTE: risk_level column is dropped in 002_cleanup_deprecated.sql

COMMENT ON FUNCTION calculate_rfm_segment IS 'Calculates RFM scores and segment. Segments: VIP, Frequente, Promissor, Novato, Esfriando, Inativo';
COMMENT ON FUNCTION refresh_customer_metrics IS 'Updates customer metrics from transactions. Calculates RFM scores, 90-day spending, and segment assignment.';
