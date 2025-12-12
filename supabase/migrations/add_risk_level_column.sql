-- Migration: Add risk_level column to customers table (Option A)
-- Version: 3.6 (2025-12-12)
--
-- This migration adds the risk_level and return_likelihood columns to the customers table
-- and creates the calculate_customer_risk() function that matches the frontend algorithm.
--
-- Purpose: Ensure 100% consistency between manual campaign UI and automation targeting
-- by computing risk_level in Supabase using the same exponential decay algorithm
-- as customerMetrics.js in the frontend.

-- ==================== 1. ADD COLUMNS ====================
ALTER TABLE customers ADD COLUMN IF NOT EXISTS risk_level TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS return_likelihood INTEGER;

-- Create index for efficient risk_level queries (used by automations)
CREATE INDEX IF NOT EXISTS idx_customers_risk_level ON customers(risk_level);

-- ==================== 2. CREATE RISK CALCULATION FUNCTION ====================
-- This function matches the EXACT algorithm from src/utils/customerMetrics.js
--
-- Algorithm:
-- 1. Lost: daysSinceLastVisit > 60 (LOST_THRESHOLD)
-- 2. New Customer: transaction_count = 1
-- 3. Likelihood-based (for customers with avg_days_between):
--    - ratio = daysSinceLastVisit / avgDaysBetween
--    - likelihood = exp(-max(0, ratio - 1)) * 100
--    - likelihood *= segment_bonus (VIP=1.2, Frequente=1.1, etc.)
--    - Healthy: >60%, Monitor: >30%, At Risk: >15%, Churning: ≤15%
-- 4. Fallback: Monitor with 40% likelihood

CREATE OR REPLACE FUNCTION calculate_customer_risk(
  p_days_since_last_visit INTEGER,
  p_transaction_count INTEGER,
  p_avg_days_between DECIMAL,
  p_rfm_segment TEXT
)
RETURNS TABLE (
  risk_level TEXT,
  return_likelihood INTEGER
) AS $$
DECLARE
  v_lost_threshold INTEGER := 60;
  v_risk_level TEXT;
  v_likelihood DECIMAL;
  v_ratio DECIMAL;
  v_segment_bonus DECIMAL;
BEGIN
  -- Get segment bonus (matches SEGMENT_BONUS in customerMetrics.js)
  v_segment_bonus := CASE COALESCE(p_rfm_segment, 'Unclassified')
    WHEN 'VIP' THEN 1.2
    WHEN 'Frequente' THEN 1.1
    WHEN 'Promissor' THEN 1.0
    WHEN 'Novato' THEN 0.9
    WHEN 'Esfriando' THEN 0.8
    WHEN 'Inativo' THEN 0.5
    -- English legacy names
    WHEN 'Champion' THEN 1.2
    WHEN 'Loyal' THEN 1.1
    WHEN 'Potential' THEN 1.0
    WHEN 'New' THEN 0.9
    WHEN 'At Risk' THEN 0.8
    WHEN 'Need Attention' THEN 0.8
    WHEN 'Lost' THEN 0.5
    ELSE 1.0
  END;

  -- Case 1: Lost (>60 days since last visit)
  IF COALESCE(p_days_since_last_visit, 999) > v_lost_threshold THEN
    v_risk_level := 'Lost';
    v_likelihood := 0;

  -- Case 2: New Customer (only 1 transaction)
  ELSIF COALESCE(p_transaction_count, 0) = 1 THEN
    v_risk_level := 'New Customer';
    v_likelihood := 50;

  -- Case 3: Likelihood-based (has avgDaysBetween)
  ELSIF p_avg_days_between IS NOT NULL AND p_avg_days_between > 0 THEN
    v_ratio := COALESCE(p_days_since_last_visit, 0)::DECIMAL / p_avg_days_between;

    -- Exponential decay formula: exp(-max(0, ratio - 1)) * 100
    v_likelihood := EXP(-GREATEST(0, v_ratio - 1)) * 100;

    -- Apply segment bonus
    v_likelihood := v_likelihood * v_segment_bonus;

    -- Cap at 100%
    v_likelihood := LEAST(100, v_likelihood);

    -- Classify by likelihood thresholds (matches RISK_THRESHOLDS in customerMetrics.js)
    IF v_likelihood > 60 THEN
      v_risk_level := 'Healthy';
    ELSIF v_likelihood > 30 THEN
      v_risk_level := 'Monitor';
    ELSIF v_likelihood > 15 THEN
      v_risk_level := 'At Risk';
    ELSE
      v_risk_level := 'Churning';
    END IF;

  -- Case 4: Fallback (no pattern data)
  ELSE
    v_risk_level := 'Monitor';
    v_likelihood := 40;
  END IF;

  RETURN QUERY SELECT v_risk_level, ROUND(v_likelihood)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION calculate_customer_risk TO authenticated;

-- ==================== 3. UPDATE refresh_customer_metrics FUNCTION ====================
-- Add risk_level computation to the existing function

CREATE OR REPLACE FUNCTION refresh_customer_metrics(p_customer_doc TEXT DEFAULT NULL)
RETURNS INT AS $$
DECLARE
  v_updated INT := 0;
BEGIN
  UPDATE customers c
  SET
    first_visit = sub.first_visit,
    last_visit = sub.last_visit,
    transaction_count = sub.transaction_count,
    total_spent = sub.total_spent,
    total_services = sub.total_services,
    days_since_last_visit = sub.days_since_last_visit,
    avg_days_between = sub.avg_days_between,
    recent_monetary_90d = sub.recent_monetary_90d,
    r_score = rfm.r_score,
    f_score = rfm.f_score,
    m_score = rfm.m_score,
    rfm_segment = rfm.segment,
    -- v3.6: Set risk level from calculate_customer_risk
    risk_level = risk.risk_level,
    return_likelihood = risk.return_likelihood,
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
      -- avg_days_between: (last - first) / (distinct_visits - 1)
      -- Uses distinct visit DAYS, not transaction count (multiple txns per visit is common)
      CASE
        WHEN COUNT(DISTINCT t.data_hora::DATE) FILTER (WHERE NOT t.is_recarga) > 1
        THEN ROUND(
          (MAX(t.data_hora)::DATE - MIN(t.data_hora)::DATE)::DECIMAL /
          (COUNT(DISTINCT t.data_hora::DATE) FILTER (WHERE NOT t.is_recarga) - 1),
          1
        )
        ELSE NULL
      END as avg_days_between,
      COALESCE(SUM(t.net_value) FILTER (
        WHERE NOT t.is_recarga AND t.data_hora >= CURRENT_DATE - INTERVAL '90 days'
      ), 0) as recent_monetary_90d,
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
  -- v3.6: Compute risk level using RFM segment for bonus multiplier
  CROSS JOIN LATERAL calculate_customer_risk(
    sub.days_since_last_visit,
    sub.transaction_count::INTEGER,
    sub.avg_days_between,
    rfm.segment
  ) risk
  WHERE c.doc = sub.doc_cliente;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

-- ==================== 4. BACKFILL EXISTING CUSTOMERS ====================
-- Run refresh_customer_metrics to populate risk_level for all existing customers
-- This will compute risk_level using the new function

SELECT refresh_customer_metrics();

-- ==================== VERIFICATION ====================
-- Check that risk_level was populated correctly
-- Expected distribution should match frontend's segmentation

-- SELECT risk_level, COUNT(*) as count
-- FROM customers
-- WHERE risk_level IS NOT NULL
-- GROUP BY risk_level
-- ORDER BY count DESC;
