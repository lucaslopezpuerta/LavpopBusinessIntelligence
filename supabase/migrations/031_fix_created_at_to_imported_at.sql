-- Migration 031: Fix created_at → imported_at in customer functions
-- Fixes error: column "created_at" of relation "customers" does not exist
--
-- Root cause: Two functions reference 'created_at' but customers table uses 'imported_at'
-- Affected functions:
--   1. update_customer_after_transaction() - trigger on transactions INSERT
--   2. upsert_customer_profile() - called by upsert_customer_profiles_batch()
--
-- Run this migration in Supabase SQL Editor to fix the error

-- Fix 1: update_customer_after_transaction trigger function
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
  v_tx_date := DATE(NEW.data_hora);
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
    risk_level = calculate_risk_level_trigger(
      CURRENT_DATE - GREATEST(COALESCE(last_visit, v_tx_date), v_tx_date),
      v_avg_days,
      COALESCE(transaction_count, 0) + 1
    ),
    updated_at = NOW()
  WHERE doc = v_customer_id;

  IF NOT FOUND THEN
    -- FIX: Changed 'created_at' to 'imported_at' to match customers table schema
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

-- Fix 2: upsert_customer_profile function
CREATE OR REPLACE FUNCTION upsert_customer_profile(
  p_doc TEXT,
  p_nome TEXT DEFAULT NULL,
  p_telefone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_data_cadastro TIMESTAMPTZ DEFAULT NULL,
  p_saldo_carteira NUMERIC DEFAULT 0,
  p_first_visit DATE DEFAULT NULL,
  p_last_visit DATE DEFAULT NULL,
  p_transaction_count INTEGER DEFAULT 0,
  p_total_spent NUMERIC DEFAULT 0,
  p_source TEXT DEFAULT 'manual_upload'
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_action TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM customers WHERE doc = p_doc) THEN
    UPDATE customers SET
      nome = COALESCE(p_nome, nome),
      telefone = COALESCE(p_telefone, telefone),
      email = COALESCE(p_email, email),
      data_cadastro = COALESCE(p_data_cadastro, data_cadastro),
      saldo_carteira = COALESCE(p_saldo_carteira, saldo_carteira),
      first_visit = COALESCE(
        LEAST(COALESCE(first_visit, p_first_visit), COALESCE(p_first_visit, first_visit)),
        first_visit,
        p_first_visit
      ),
      last_visit = GREATEST(
        COALESCE(last_visit, p_last_visit),
        COALESCE(p_last_visit, last_visit)
      ),
      transaction_count = GREATEST(
        COALESCE(transaction_count, 0),
        COALESCE(p_transaction_count, 0)
      ),
      total_spent = GREATEST(
        COALESCE(total_spent, 0),
        COALESCE(p_total_spent, 0)
      ),
      updated_at = NOW()
    WHERE doc = p_doc;

    v_action := 'updated';
  ELSE
    -- FIX: Changed 'created_at' to 'imported_at' to match customers table schema
    INSERT INTO customers (
      doc, nome, telefone, email, data_cadastro, saldo_carteira,
      first_visit, last_visit, transaction_count, total_spent,
      source, imported_at, updated_at
    ) VALUES (
      p_doc, p_nome, p_telefone, p_email, p_data_cadastro,
      COALESCE(p_saldo_carteira, 0), p_first_visit, p_last_visit,
      COALESCE(p_transaction_count, 0), COALESCE(p_total_spent, 0),
      p_source, NOW(), NOW()
    );

    v_action := 'inserted';
  END IF;

  v_result := jsonb_build_object('doc', p_doc, 'action', v_action);
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Verify the fix worked
DO $$
BEGIN
  RAISE NOTICE 'Migration 031 complete: Fixed created_at → imported_at in customer functions';
END $$;
