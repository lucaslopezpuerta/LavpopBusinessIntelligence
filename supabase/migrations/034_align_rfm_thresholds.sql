-- Migration: Align RFM Recency thresholds with DAY_THRESHOLDS v3.8.0
-- Date: 2026-01-13
--
-- RATIONALE:
-- Data analysis of 14k+ transactions revealed:
-- - Median visit interval: 22.5 days (not 14 as previously assumed)
-- - 71% of customers who return do so within 30 days
-- - Return rate stays above 50% until 119 days
--
-- CHANGES:
-- - R=5: 21 days -> 30 days (align with DAY_THRESHOLDS.HEALTHY)
-- - R=4: 45 days -> 50 days (align with DAY_THRESHOLDS.AT_RISK)
-- - R=3, R=2, R=1: unchanged
--
-- IMPACT:
-- - Customers with 22-30 days since last visit will now get R=5 (was R=4)
-- - Customers with 46-50 days since last visit will now get R=4 (was R=3)
-- - Some customers may be reclassified to higher RFM segments temporarily
--
-- This ensures consistency between:
-- - Client-side churn risk classification (customerMetrics.js)
-- - Server-side RFM segmentation (this function)

-- ==================== UPDATED RFM CALCULATION FUNCTION ====================

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
  -- v3.8.0 UPDATE: Aligned with DAY_THRESHOLDS from customerMetrics.js
  -- Previous: 5=<=21, 4=<=45
  -- New:      5=<=30 (HEALTHY), 4=<=50 (AT_RISK)
  v_r_score := CASE
    WHEN p_recency_days IS NULL THEN 1
    WHEN p_recency_days <= 30 THEN 5   -- v3.8.0: Was 21, now aligns with DAY_THRESHOLDS.HEALTHY
    WHEN p_recency_days <= 50 THEN 4   -- v3.8.0: Was 45, now aligns with DAY_THRESHOLDS.AT_RISK
    WHEN p_recency_days <= 90 THEN 3   -- Unchanged
    WHEN p_recency_days <= 180 THEN 2  -- Unchanged
    ELSE 1
  END;

  -- Frequency Score (F): Number of transactions
  -- Higher is better -> higher score
  -- Unchanged from v2.0
  v_f_score := CASE
    WHEN p_frequency >= 10 THEN 5
    WHEN p_frequency >= 6 THEN 4
    WHEN p_frequency >= 3 THEN 3
    WHEN p_frequency = 2 THEN 2
    ELSE 1
  END;

  -- Monetary Score (M): Recent 90-day spending (R$)
  -- Higher is better -> higher score
  -- Unchanged from v2.0
  v_m_score := CASE
    WHEN p_monetary_90d >= 250 THEN 5
    WHEN p_monetary_90d >= 150 THEN 4
    WHEN p_monetary_90d >= 75 THEN 3
    WHEN p_monetary_90d >= 36 THEN 2
    ELSE 1
  END;

  -- Segment Assignment (Portuguese marketing names - distinct from Churn Risk Levels)
  -- Order matters: more specific conditions first
  -- Unchanged from v2.0

  -- Novato: New customer (registered <=30 days AND <=2 transactions)
  IF p_registration_days IS NOT NULL AND p_registration_days <= 30 AND p_frequency <= 2 THEN
    v_segment := 'Novato';

  -- VIP: Champion (R=5, F>=4, M>=4) - Best customers, top tier
  ELSIF v_r_score = 5 AND v_f_score >= 4 AND v_m_score >= 4 THEN
    v_segment := 'VIP';

  -- Frequente: Loyal (R>=4, F>=3, M>=3) - Regular visitors
  ELSIF v_r_score >= 4 AND v_f_score >= 3 AND v_m_score >= 3 THEN
    v_segment := 'Frequente';

  -- Promissor: Potential (R>=3, F>=2, M>=2) - Growing customers
  ELSIF v_r_score >= 3 AND v_f_score >= 2 AND v_m_score >= 2 THEN
    v_segment := 'Promissor';

  -- Esfriando: At Risk (R=2 AND (F=2 OR M=2)) - Cooling off, needs attention
  ELSIF v_r_score = 2 AND (v_f_score = 2 OR v_m_score = 2) THEN
    v_segment := 'Esfriando';

  -- Inativo: Lost - All others (no recent engagement)
  ELSE
    v_segment := 'Inativo';
  END IF;

  RETURN QUERY SELECT v_r_score, v_f_score, v_m_score, v_segment;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ==================== RECALCULATE ALL CUSTOMER RFM SEGMENTS ====================

-- Trigger a full refresh of customer metrics to apply new thresholds
SELECT refresh_customer_metrics();

-- ==================== COMMENTS ====================

COMMENT ON FUNCTION calculate_rfm_segment IS
'RFM scoring function v3.8.0 - Recency thresholds aligned with DAY_THRESHOLDS.
R-score: 5=<=30d (HEALTHY), 4=<=50d (AT_RISK), 3=<=90d, 2=<=180d, 1=>180d
F-score: 5=>=10 txn, 4=>=6 txn, 3=>=3 txn, 2=2 txn, 1=1 txn
M-score: 5=>=R$250, 4=>=R$150, 3=>=R$75, 2=>=R$36, 1=<R$36
Segments: VIP, Frequente, Promissor, Novato, Esfriando, Inativo';
