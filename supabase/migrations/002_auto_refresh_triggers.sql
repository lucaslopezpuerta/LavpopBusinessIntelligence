-- Migration: Auto-refresh Triggers v1.0
-- Date: 2025-12-13
-- Purpose: Automatically update customer computed columns when data changes
--
-- This migration creates triggers that:
-- 1. Update customer metrics when transactions are inserted
-- 2. Recalculate risk_level, avg_days_between after new transactions
-- 3. Eliminate the need for manual "Sincronizar Metricas" clicks
--
-- BENEFITS:
-- - Real-time metric updates (no manual sync needed)
-- - Consistent data across all views
-- - Better user experience in dashboards
--
-- PERFORMANCE NOTES:
-- - Trigger runs per-row on transaction insert
-- - Only updates the affected customer (not all customers)
-- - Uses efficient single-customer update query

-- ==================== HELPER FUNCTION: Calculate avg_days_between ====================

CREATE OR REPLACE FUNCTION calculate_avg_days_between(p_customer_id TEXT)
RETURNS NUMERIC AS $$
DECLARE
  v_avg_days NUMERIC;
BEGIN
  -- Calculate average days between visits from transaction history
  WITH visit_dates AS (
    SELECT DISTINCT DATE(data_hora) as visit_date
    FROM transactions
    WHERE doc_cliente = p_customer_id
      AND data_hora IS NOT NULL
    ORDER BY visit_date
  ),
  visit_gaps AS (
    SELECT
      visit_date,
      LAG(visit_date) OVER (ORDER BY visit_date) as prev_visit,
      visit_date - LAG(visit_date) OVER (ORDER BY visit_date) as days_gap
    FROM visit_dates
  )
  SELECT COALESCE(AVG(days_gap), 30) INTO v_avg_days
  FROM visit_gaps
  WHERE days_gap IS NOT NULL AND days_gap > 0;

  -- Default to 30 days if no gaps calculated
  RETURN COALESCE(v_avg_days, 30);
END;
$$ LANGUAGE plpgsql;

-- ==================== HELPER FUNCTION: Calculate risk_level ====================

CREATE OR REPLACE FUNCTION calculate_risk_level(
  p_days_since_last_visit INTEGER,
  p_avg_days_between NUMERIC,
  p_transaction_count INTEGER
)
RETURNS TEXT AS $$
DECLARE
  v_ratio NUMERIC;
BEGIN
  -- New customer (1 transaction)
  IF p_transaction_count <= 1 THEN
    RETURN 'New Customer';
  END IF;

  -- No visits yet
  IF p_days_since_last_visit IS NULL THEN
    RETURN 'Unknown';
  END IF;

  -- Calculate ratio of days since last visit to average pattern
  v_ratio := p_days_since_last_visit::NUMERIC / NULLIF(p_avg_days_between, 0);

  -- Risk levels based on exponential decay model
  -- Matches frontend customerMetrics.js algorithm
  IF v_ratio <= 1.2 THEN
    RETURN 'Healthy';
  ELSIF v_ratio <= 2.0 THEN
    RETURN 'At Risk';
  ELSIF v_ratio <= 3.0 THEN
    RETURN 'Churning';
  ELSE
    RETURN 'Lost';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ==================== TRIGGER FUNCTION: Update customer after transaction ====================

CREATE OR REPLACE FUNCTION update_customer_after_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_id TEXT;
  v_tx_date DATE;
  v_tx_value NUMERIC;
  v_avg_days NUMERIC;
  v_days_since INTEGER;
  v_risk TEXT;
BEGIN
  -- Get transaction details
  v_customer_id := NEW.doc_cliente;
  v_tx_date := DATE(NEW.data_hora);
  v_tx_value := COALESCE(NEW.valor_venda, 0);

  -- Skip if no customer ID
  IF v_customer_id IS NULL OR v_customer_id = '' THEN
    RETURN NEW;
  END IF;

  -- Calculate avg_days_between for this customer
  v_avg_days := calculate_avg_days_between(v_customer_id);

  -- Calculate days since last visit
  v_days_since := CURRENT_DATE - v_tx_date;

  -- Update customer record with new metrics
  UPDATE customers
  SET
    -- Update last_visit if this transaction is more recent
    last_visit = GREATEST(COALESCE(last_visit, v_tx_date), v_tx_date),

    -- Increment transaction count
    transaction_count = COALESCE(transaction_count, 0) + 1,

    -- Add to total spent (only for actual sales, not recargas used)
    total_spent = CASE
      WHEN NEW.transaction_type IN ('TYPE_1', 'TYPE_3')
      THEN COALESCE(total_spent, 0) + v_tx_value
      ELSE COALESCE(total_spent, 0)
    END,

    -- Update computed columns
    avg_days_between = v_avg_days,
    days_since_last_visit = CURRENT_DATE - GREATEST(COALESCE(last_visit, v_tx_date), v_tx_date),

    -- Recalculate risk level
    risk_level = calculate_risk_level(
      CURRENT_DATE - GREATEST(COALESCE(last_visit, v_tx_date), v_tx_date),
      v_avg_days,
      COALESCE(transaction_count, 0) + 1
    ),

    -- Update timestamp
    updated_at = NOW()
  WHERE doc = v_customer_id;

  -- If customer doesn't exist, create a minimal record
  IF NOT FOUND THEN
    INSERT INTO customers (
      doc,
      nome,
      telefone,
      first_visit,
      last_visit,
      transaction_count,
      total_spent,
      avg_days_between,
      days_since_last_visit,
      risk_level,
      source,
      created_at,
      updated_at
    ) VALUES (
      v_customer_id,
      NEW.nome_cliente,
      NEW.telefone,
      v_tx_date,
      v_tx_date,
      1,
      CASE WHEN NEW.transaction_type IN ('TYPE_1', 'TYPE_3') THEN v_tx_value ELSE 0 END,
      30, -- Default avg days
      v_days_since,
      'New Customer',
      'auto_created',
      NOW(),
      NOW()
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

-- ==================== CREATE TRIGGER ====================

-- Drop existing trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS trg_update_customer_after_transaction ON transactions;

-- Create trigger on transaction insert
CREATE TRIGGER trg_update_customer_after_transaction
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_after_transaction();

-- ==================== OPTIONAL: Trigger for customer insert ====================
-- This ensures risk_level is calculated when customer is first created

CREATE OR REPLACE FUNCTION calculate_customer_risk_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate days since last visit
  IF NEW.last_visit IS NOT NULL THEN
    NEW.days_since_last_visit := CURRENT_DATE - NEW.last_visit;
  END IF;

  -- Calculate risk level
  NEW.risk_level := calculate_risk_level(
    NEW.days_since_last_visit,
    COALESCE(NEW.avg_days_between, 30),
    COALESCE(NEW.transaction_count, 1)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trg_calculate_customer_risk ON customers;

-- Create trigger on customer insert/update
CREATE TRIGGER trg_calculate_customer_risk
  BEFORE INSERT OR UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION calculate_customer_risk_on_insert();

-- ==================== VERIFICATION ====================

-- After running this migration, verify triggers are created:
--
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE trigger_schema = 'public';
--
-- Expected output:
-- - trg_update_customer_after_transaction | INSERT | transactions
-- - trg_calculate_customer_risk | INSERT | customers
-- - trg_calculate_customer_risk | UPDATE | customers

-- ==================== ROLLBACK (if needed) ====================

-- To rollback:
-- DROP TRIGGER IF EXISTS trg_update_customer_after_transaction ON transactions;
-- DROP TRIGGER IF EXISTS trg_calculate_customer_risk ON customers;
-- DROP FUNCTION IF EXISTS update_customer_after_transaction();
-- DROP FUNCTION IF EXISTS calculate_customer_risk_on_insert();
-- DROP FUNCTION IF EXISTS calculate_risk_level(INTEGER, NUMERIC, INTEGER);
-- DROP FUNCTION IF EXISTS calculate_avg_days_between(TEXT);

-- ==================== NOTES ====================

-- PERFORMANCE:
-- - Triggers run per-row, so large batch inserts will be slower
-- - For initial data migration, consider disabling triggers temporarily:
--   ALTER TABLE transactions DISABLE TRIGGER trg_update_customer_after_transaction;
--   -- ... do bulk insert ...
--   ALTER TABLE transactions ENABLE TRIGGER trg_update_customer_after_transaction;
--   -- Then run refresh_customer_metrics() once
--
-- MANUAL SYNC STILL AVAILABLE:
-- - The refresh_customer_metrics() function remains available for:
--   - Initial data migration
--   - Fixing any data inconsistencies
--   - Bulk recalculation if needed
