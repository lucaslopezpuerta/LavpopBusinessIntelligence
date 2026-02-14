-- Migration: 069_unify_risk_algorithm_b.sql
-- Date: 2026-02-14
-- Purpose: Unify risk_level computation on Algorithm B (exponential decay + segment bonus)
--
-- BACKGROUND:
-- The DB had two risk calculation functions:
--   1. calculate_risk_level() — simple ratio thresholds (Algorithm A, from Migration 002)
--   2. calculate_customer_risk() — exponential decay + segment bonus (Algorithm B, from add_risk_level_column.sql)
--
-- The triggers called Algorithm A, but the frontend (customerMetrics.js v3.8.0) and
-- refresh_customer_metrics() used Algorithm B. This caused eligible count mismatches
-- in AutomationRules.jsx vs campaign-scheduler.js.
--
-- CHANGES:
--   1. Updated calculate_customer_risk() with v3.8.0 segment bonuses (VIP=1.4, Frequente=1.2)
--   2. Added time-based new customer likelihood (70/50/30/15/5 instead of flat 50)
--   3. Updated calculate_customer_risk_on_insert() trigger to use Algorithm B
--   4. Updated update_customer_after_transaction() trigger to use Algorithm B
--   5. Backfilled all customers via refresh_customer_metrics()
--   6. Dropped old calculate_risk_level() function
--
-- RESULT:
-- DB risk_level now uses same algorithm as frontend. "Monitor" category added.
-- Campaign scheduler targeting (risk_level IN ('At Risk', 'Churning')) unchanged.

-- ==================== 1. UPDATE RISK FUNCTION (Algorithm B v3.8.0) ====================

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
  -- Segment bonuses matching customerMetrics.js v3.8.0
  v_segment_bonus := CASE COALESCE(p_rfm_segment, 'Unclassified')
    WHEN 'VIP' THEN 1.4
    WHEN 'Frequente' THEN 1.2
    WHEN 'Promissor' THEN 1.0
    WHEN 'Novato' THEN 0.9
    WHEN 'Esfriando' THEN 0.8
    WHEN 'Inativo' THEN 0.5
    WHEN 'Champion' THEN 1.4
    WHEN 'Loyal' THEN 1.2
    WHEN 'Potential' THEN 1.0
    WHEN 'New' THEN 0.9
    WHEN 'At Risk' THEN 0.8
    WHEN 'Need Attention' THEN 0.8
    WHEN 'Lost' THEN 0.5
    ELSE 1.0
  END;

  -- Case 1: Lost (>60 days)
  IF COALESCE(p_days_since_last_visit, 999) > v_lost_threshold THEN
    v_risk_level := 'Lost';
    v_likelihood := 0;

  -- Case 2: New Customer (1 transaction) — time-based likelihood (v3.8.0)
  ELSIF COALESCE(p_transaction_count, 0) <= 1 THEN
    v_risk_level := 'New Customer';
    v_likelihood := CASE
      WHEN COALESCE(p_days_since_last_visit, 0) <= 7 THEN 70
      WHEN p_days_since_last_visit <= 14 THEN 50
      WHEN p_days_since_last_visit <= 30 THEN 30
      WHEN p_days_since_last_visit <= 60 THEN 15
      ELSE 5
    END;

  -- Case 3: Exponential decay
  ELSIF p_avg_days_between IS NOT NULL AND p_avg_days_between > 0 THEN
    v_ratio := COALESCE(p_days_since_last_visit, 0)::DECIMAL / p_avg_days_between;
    v_likelihood := EXP(-GREATEST(0, v_ratio - 1)) * 100;
    v_likelihood := LEAST(100, v_likelihood * v_segment_bonus);

    IF v_likelihood > 60 THEN v_risk_level := 'Healthy';
    ELSIF v_likelihood > 30 THEN v_risk_level := 'Monitor';
    ELSIF v_likelihood > 15 THEN v_risk_level := 'At Risk';
    ELSE v_risk_level := 'Churning';
    END IF;

  -- Case 4: Fallback
  ELSE
    v_risk_level := 'Monitor';
    v_likelihood := 40;
  END IF;

  RETURN QUERY SELECT v_risk_level, ROUND(v_likelihood)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ==================== 2. UPDATE INSERT/UPDATE TRIGGER ====================

CREATE OR REPLACE FUNCTION calculate_customer_risk_on_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_risk RECORD;
BEGIN
  IF NEW.last_visit IS NOT NULL THEN
    NEW.days_since_last_visit := CURRENT_DATE - NEW.last_visit;
  END IF;

  SELECT * INTO v_risk FROM calculate_customer_risk(
    NEW.days_since_last_visit,
    COALESCE(NEW.transaction_count, 1),
    COALESCE(NEW.avg_days_between, 30),
    COALESCE(NEW.rfm_segment, 'Inativo')
  );

  NEW.risk_level := v_risk.risk_level;
  NEW.return_likelihood := v_risk.return_likelihood;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================== 3. UPDATE TRANSACTION TRIGGER ====================

CREATE OR REPLACE FUNCTION update_customer_after_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_id TEXT;
  v_tx_date DATE;
  v_tx_value NUMERIC;
  v_avg_days NUMERIC;
  v_days_since INTEGER;
  v_rfm_segment TEXT;
  v_risk RECORD;
BEGIN
  v_customer_id := NEW.doc_cliente;
  v_tx_date := DATE(NEW.data_hora AT TIME ZONE 'America/Sao_Paulo');
  v_tx_value := COALESCE(NEW.valor_venda, 0);

  IF v_customer_id IS NULL OR v_customer_id = '' THEN
    RETURN NEW;
  END IF;

  v_avg_days := calculate_avg_days_between_trigger(v_customer_id);

  -- Fetch current rfm_segment for risk calculation
  SELECT rfm_segment INTO v_rfm_segment FROM customers WHERE doc = v_customer_id;

  v_days_since := CURRENT_DATE - GREATEST(
    COALESCE((SELECT last_visit FROM customers WHERE doc = v_customer_id), v_tx_date),
    v_tx_date
  );

  -- Calculate risk using Algorithm B (exponential decay + segment bonus)
  SELECT * INTO v_risk FROM calculate_customer_risk(
    v_days_since,
    COALESCE((SELECT transaction_count FROM customers WHERE doc = v_customer_id), 0) + 1,
    v_avg_days,
    COALESCE(v_rfm_segment, 'Inativo')
  );

  UPDATE customers
  SET
    last_visit = GREATEST(COALESCE(last_visit, v_tx_date), v_tx_date),
    transaction_count = COALESCE(transaction_count, 0) + 1,
    total_spent = CASE
      WHEN NEW.transaction_type IN ('TYPE_1', 'TYPE_3')
      THEN COALESCE(total_spent, 0) + v_tx_value
      ELSE COALESCE(total_spent, 0)
    END,
    avg_days_between = v_avg_days,
    days_since_last_visit = v_days_since,
    risk_level = v_risk.risk_level,
    return_likelihood = v_risk.return_likelihood,
    updated_at = NOW()
  WHERE doc = v_customer_id;

  IF NOT FOUND THEN
    INSERT INTO customers (
      doc, nome, telefone, first_visit, last_visit,
      transaction_count, total_spent, avg_days_between,
      days_since_last_visit, risk_level, return_likelihood, source, imported_at, updated_at
    ) VALUES (
      v_customer_id, NEW.nome_cliente, NEW.telefone, v_tx_date, v_tx_date,
      1, CASE WHEN NEW.transaction_type IN ('TYPE_1', 'TYPE_3') THEN v_tx_value ELSE 0 END,
      30, v_days_since, 'New Customer', 70, 'auto_created', NOW(), NOW()
    )
    ON CONFLICT (doc) DO UPDATE SET
      last_visit = GREATEST(customers.last_visit, EXCLUDED.last_visit),
      transaction_count = customers.transaction_count + 1,
      total_spent = customers.total_spent + EXCLUDED.total_spent,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================== 4. BACKFILL ====================

SELECT refresh_customer_metrics();

-- ==================== 5. DROP OLD FUNCTION ====================

DROP FUNCTION IF EXISTS calculate_risk_level(INTEGER, NUMERIC, INTEGER);

-- ==================== VERIFICATION ====================

-- SELECT risk_level, COUNT(*), ROUND(AVG(return_likelihood)) as avg_likelihood
-- FROM customers
-- WHERE risk_level IS NOT NULL
-- GROUP BY risk_level
-- ORDER BY count DESC;
