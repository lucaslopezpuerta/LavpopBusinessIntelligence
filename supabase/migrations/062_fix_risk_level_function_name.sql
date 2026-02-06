-- Migration: 062_fix_risk_level_function_name.sql
-- Date: 2026-02-05
-- Purpose: Fix typo in update_customer_after_transaction trigger function
--
-- BUG: Migration 061 introduced a typo on line 152:
--   Called: calculate_risk_level_trigger(integer, numeric, integer)
--   Should be: calculate_risk_level(integer, numeric, integer)
--
-- The function calculate_risk_level() was created in Migration 002.
-- This caused CSV uploads to fail with:
--   "function calculate_risk_level_trigger(integer, numeric, integer) does not exist"

-- ============================================================
-- FIX: Recreate update_customer_after_transaction with correct function name
-- ============================================================

CREATE OR REPLACE FUNCTION update_customer_after_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_id TEXT;
  v_tx_date DATE;
  v_tx_value NUMERIC;
  v_avg_days NUMERIC;
  v_days_since INTEGER;
BEGIN
  v_customer_id := NEW.doc_cliente;
  -- Use Brazil timezone for date extraction
  v_tx_date := DATE(NEW.data_hora AT TIME ZONE 'America/Sao_Paulo');
  v_tx_value := COALESCE(NEW.valor_venda, 0);

  IF v_customer_id IS NULL OR v_customer_id = '' THEN
    RETURN NEW;
  END IF;

  v_avg_days := calculate_avg_days_between_trigger(v_customer_id);
  v_days_since := CURRENT_DATE - v_tx_date;

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
    days_since_last_visit = CURRENT_DATE - GREATEST(COALESCE(last_visit, v_tx_date), v_tx_date),
    -- FIX: Changed from calculate_risk_level_trigger to calculate_risk_level
    risk_level = calculate_risk_level(
      CURRENT_DATE - GREATEST(COALESCE(last_visit, v_tx_date), v_tx_date),
      v_avg_days,
      COALESCE(transaction_count, 0) + 1
    ),
    updated_at = NOW()
  WHERE doc = v_customer_id;

  IF NOT FOUND THEN
    INSERT INTO customers (
      doc, nome, telefone, first_visit, last_visit,
      transaction_count, total_spent, avg_days_between,
      days_since_last_visit, risk_level, source, imported_at, updated_at
    ) VALUES (
      v_customer_id, NEW.nome_cliente, NEW.telefone, v_tx_date, v_tx_date,
      1, CASE WHEN NEW.transaction_type IN ('TYPE_1', 'TYPE_3') THEN v_tx_value ELSE 0 END,
      30, v_days_since, 'New Customer', 'auto_created', NOW(), NOW()
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

DO $$
BEGIN
  RAISE NOTICE 'Migration 062 complete: Fixed calculate_risk_level_trigger -> calculate_risk_level typo';
END $$;
