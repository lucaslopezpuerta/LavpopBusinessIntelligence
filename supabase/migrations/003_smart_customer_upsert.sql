-- Migration: Smart Customer Upsert v1.0
-- Date: 2025-12-13
-- Purpose: Handle full customer list uploads without regressing computed data
--
-- PROBLEM:
-- POS exports the ENTIRE customer list every time (not incremental).
-- Simple upsert would overwrite last_visit, transaction_count, total_spent
-- with potentially stale POS data, regressing metrics that transaction
-- triggers have already calculated correctly.
--
-- SOLUTION:
-- Smart upsert function that:
-- 1. Profile fields (nome, telefone, email, saldo_carteira): Always update
-- 2. Date fields (first_visit, last_visit): Use GREATEST (only if CSV is more recent)
-- 3. Count fields (transaction_count, total_spent): Use GREATEST (only if CSV is higher)
-- 4. Computed fields: Never touch (let triggers handle)

-- ==================== SMART CUSTOMER UPSERT FUNCTION ====================

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
  -- Check if customer exists
  IF EXISTS (SELECT 1 FROM customers WHERE doc = p_doc) THEN
    -- UPDATE existing customer with smart merge logic
    UPDATE customers SET
      -- Profile fields: Always update from CSV
      nome = COALESCE(p_nome, nome),
      telefone = COALESCE(p_telefone, telefone),
      email = COALESCE(p_email, email),
      data_cadastro = COALESCE(p_data_cadastro, data_cadastro),
      saldo_carteira = COALESCE(p_saldo_carteira, saldo_carteira),

      -- Date fields: Use GREATEST (only update if CSV is more recent or existing is null)
      first_visit = COALESCE(
        LEAST(COALESCE(first_visit, p_first_visit), COALESCE(p_first_visit, first_visit)),
        first_visit,
        p_first_visit
      ),
      last_visit = GREATEST(
        COALESCE(last_visit, p_last_visit),
        COALESCE(p_last_visit, last_visit)
      ),

      -- Count fields: Use GREATEST (only update if CSV is higher)
      transaction_count = GREATEST(
        COALESCE(transaction_count, 0),
        COALESCE(p_transaction_count, 0)
      ),
      total_spent = GREATEST(
        COALESCE(total_spent, 0),
        COALESCE(p_total_spent, 0)
      ),

      -- Timestamp
      updated_at = NOW()

      -- NOTE: avg_days_between, days_since_last_visit, risk_level
      -- are NOT updated here - they're computed by triggers

    WHERE doc = p_doc;

    v_action := 'updated';
  ELSE
    -- INSERT new customer with all provided data
    INSERT INTO customers (
      doc,
      nome,
      telefone,
      email,
      data_cadastro,
      saldo_carteira,
      first_visit,
      last_visit,
      transaction_count,
      total_spent,
      source,
      created_at,
      updated_at
    ) VALUES (
      p_doc,
      p_nome,
      p_telefone,
      p_email,
      p_data_cadastro,
      COALESCE(p_saldo_carteira, 0),
      p_first_visit,
      p_last_visit,
      COALESCE(p_transaction_count, 0),
      COALESCE(p_total_spent, 0),
      p_source,
      NOW(),
      NOW()
    );

    v_action := 'inserted';
  END IF;

  v_result := jsonb_build_object(
    'doc', p_doc,
    'action', v_action
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ==================== BATCH UPSERT FUNCTION ====================
-- For better performance with large uploads

CREATE OR REPLACE FUNCTION upsert_customer_profiles_batch(
  p_customers JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_customer JSONB;
  v_inserted INTEGER := 0;
  v_updated INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Process each customer in the batch
  FOR v_customer IN SELECT * FROM jsonb_array_elements(p_customers)
  LOOP
    SELECT upsert_customer_profile(
      p_doc := v_customer->>'doc',
      p_nome := v_customer->>'nome',
      p_telefone := v_customer->>'telefone',
      p_email := v_customer->>'email',
      p_data_cadastro := (v_customer->>'data_cadastro')::TIMESTAMPTZ,
      p_saldo_carteira := COALESCE((v_customer->>'saldo_carteira')::NUMERIC, 0),
      p_first_visit := (v_customer->>'first_visit')::DATE,
      p_last_visit := (v_customer->>'last_visit')::DATE,
      p_transaction_count := COALESCE((v_customer->>'transaction_count')::INTEGER, 0),
      p_total_spent := COALESCE((v_customer->>'total_spent')::NUMERIC, 0),
      p_source := COALESCE(v_customer->>'source', 'manual_upload')
    ) INTO v_result;

    IF v_result->>'action' = 'inserted' THEN
      v_inserted := v_inserted + 1;
    ELSE
      v_updated := v_updated + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'inserted', v_inserted,
    'updated', v_updated,
    'total', v_inserted + v_updated
  );
END;
$$ LANGUAGE plpgsql;

-- ==================== VERIFICATION ====================

-- After running this migration, test with:
--
-- SELECT upsert_customer_profile(
--   '12345678901',
--   'Test Customer',
--   '11999999999',
--   'test@example.com',
--   NOW(),
--   100.00,
--   '2024-01-01',
--   '2024-12-01',
--   5,
--   500.00
-- );
--
-- Then upload the same customer again with older dates -
-- the older dates should NOT overwrite the newer ones.

-- ==================== ROLLBACK ====================

-- To rollback:
-- DROP FUNCTION IF EXISTS upsert_customer_profiles_batch(JSONB);
-- DROP FUNCTION IF EXISTS upsert_customer_profile(TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, NUMERIC, DATE, DATE, INTEGER, NUMERIC, TEXT);
