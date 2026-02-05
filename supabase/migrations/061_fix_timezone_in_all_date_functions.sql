-- Migration: 061_fix_timezone_in_all_date_functions.sql
-- Date: 2026-02-04
-- Purpose: Fix timezone handling in ALL date extraction operations
--
-- PROBLEM DISCOVERED IN AUDIT:
-- Several functions and views use DATE(data_hora) without timezone conversion.
-- This causes transactions after 9 PM Brazil time to be grouped on the wrong day.
--
-- AFFECTED COMPONENTS:
-- 1. daily_revenue view (Migration 025) - ❌ No timezone
-- 2. calculate_avg_days_between function (Migration 002) - ❌ No timezone
-- 3. calculate_avg_days_between_trigger function (Migration 032) - ❌ No timezone
-- 4. update_customer_after_transaction trigger (Migration 031) - ❌ No timezone
--
-- CORRECT PATTERN:
-- DATE(data_hora AT TIME ZONE 'America/Sao_Paulo')
--
-- This ensures a transaction at 23:00 Brazil time (02:00 UTC next day)
-- is grouped on the correct Brazil calendar day.

-- ============================================================
-- FIX 1: Recreate daily_revenue view with timezone conversion
-- ============================================================

DROP VIEW IF EXISTS daily_revenue;

CREATE VIEW daily_revenue AS
SELECT
  DATE(data_hora AT TIME ZONE 'America/Sao_Paulo') as date,
  -- Transaction counts
  COUNT(*) FILTER (WHERE NOT is_recarga) as transactions,
  COUNT(*) FILTER (WHERE is_recarga) as recargas,
  -- Service counts
  COALESCE(SUM(total_services), 0) as total_services,
  COALESCE(SUM(wash_count), 0) as washes,
  COALESCE(SUM(dry_count), 0) as drys,
  -- Revenue breakdown
  COALESCE(SUM(net_value) FILTER (WHERE NOT is_recarga), 0) as service_revenue,
  COALESCE(SUM(valor_pago) FILTER (WHERE is_recarga), 0) as recarga_revenue,
  -- Total revenue (service + recarga)
  COALESCE(SUM(net_value) FILTER (WHERE NOT is_recarga), 0) +
    COALESCE(SUM(valor_pago) FILTER (WHERE is_recarga), 0) as total_revenue,
  -- Other metrics
  COALESCE(SUM(cashback_amount), 0) as cashback_given,
  COUNT(*) FILTER (WHERE usou_cupom) as coupon_uses
FROM transactions
GROUP BY DATE(data_hora AT TIME ZONE 'America/Sao_Paulo')
ORDER BY date DESC;

COMMENT ON VIEW daily_revenue IS 'Daily revenue aggregation using Brazil timezone (America/Sao_Paulo) for correct date grouping. Matches mv_daily_revenue output.';

-- Grant permissions
GRANT SELECT ON daily_revenue TO authenticated;
GRANT SELECT ON daily_revenue TO anon;

-- ============================================================
-- FIX 2: Update calculate_avg_days_between function
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_avg_days_between(p_customer_id TEXT)
RETURNS NUMERIC AS $$
DECLARE
  v_avg_days NUMERIC;
BEGIN
  -- Calculate average days between visits from transaction history
  -- FIXED: Use Brazil timezone for date extraction
  WITH visit_dates AS (
    SELECT DISTINCT DATE(data_hora AT TIME ZONE 'America/Sao_Paulo') as visit_date
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

-- ============================================================
-- FIX 3: Update calculate_avg_days_between_trigger function
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_avg_days_between_trigger(p_customer_id TEXT)
RETURNS NUMERIC AS $$
DECLARE
  v_avg_days NUMERIC;
BEGIN
  -- FIXED: Use Brazil timezone for date extraction
  SELECT
    CASE
      WHEN COUNT(DISTINCT DATE(data_hora AT TIME ZONE 'America/Sao_Paulo')) > 1
      THEN (MAX(DATE(data_hora AT TIME ZONE 'America/Sao_Paulo')) - MIN(DATE(data_hora AT TIME ZONE 'America/Sao_Paulo')))::NUMERIC
           / NULLIF(COUNT(DISTINCT DATE(data_hora AT TIME ZONE 'America/Sao_Paulo')) - 1, 0)
      ELSE 30 -- Default for new customers
    END
  INTO v_avg_days
  FROM transactions
  WHERE doc_cliente = p_customer_id
    AND NOT is_recarga;  -- Exclude wallet recharges

  RETURN COALESCE(v_avg_days, 30);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FIX 4: Update update_customer_after_transaction trigger
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
  -- FIXED: Use Brazil timezone for date extraction
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
    risk_level = calculate_risk_level_trigger(
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

-- ============================================================
-- VERIFICATION
-- ============================================================

-- After running this migration, verify both views return identical results:
--
-- SELECT date, washes, drys, total_revenue
-- FROM daily_revenue WHERE date >= '2026-02-01' ORDER BY date;
--
-- SELECT date, washes, drys, total_revenue
-- FROM mv_daily_revenue WHERE date >= '2026-02-01' ORDER BY date;
--
-- Results should be IDENTICAL. If not, refresh the materialized view:
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_revenue;

-- ============================================================
-- ROLLBACK (if needed)
-- ============================================================

-- To rollback to UTC-based date grouping (NOT recommended):
--
-- DROP VIEW IF EXISTS daily_revenue;
-- CREATE VIEW daily_revenue AS
-- SELECT DATE(data_hora) as date, ... FROM transactions GROUP BY DATE(data_hora);
--
-- Note: This would reintroduce the timezone bug.

DO $$
BEGIN
  RAISE NOTICE 'Migration 061 complete: Fixed timezone handling in all date extraction operations';
  RAISE NOTICE 'All DATE() calls now use AT TIME ZONE America/Sao_Paulo';
END $$;
