-- Migration 032: Add missing calculate_avg_days_between_trigger function
-- Fixes error: function calculate_avg_days_between_trigger(text) does not exist
--
-- Root cause: The update_customer_after_transaction() trigger calls this function,
-- but it was never created in the database.
--
-- Run this migration in Supabase SQL Editor to fix the error

-- Function to calculate average days between visits for a specific customer
-- Used by the update_customer_after_transaction() trigger
-- Formula: (last_visit - first_visit) / (distinct_visit_days - 1)
CREATE OR REPLACE FUNCTION calculate_avg_days_between_trigger(p_customer_id TEXT)
RETURNS NUMERIC AS $$
DECLARE
  v_avg_days NUMERIC;
BEGIN
  SELECT
    CASE
      WHEN COUNT(DISTINCT DATE(data_hora)) > 1
      THEN (MAX(DATE(data_hora)) - MIN(DATE(data_hora)))::NUMERIC / NULLIF(COUNT(DISTINCT DATE(data_hora)) - 1, 0)
      ELSE 30 -- Default for new customers
    END
  INTO v_avg_days
  FROM transactions
  WHERE doc_cliente = p_customer_id
    AND NOT is_recarga;  -- Exclude wallet recharges

  RETURN COALESCE(v_avg_days, 30);
END;
$$ LANGUAGE plpgsql;

-- Verify the function was created
DO $$
BEGIN
  RAISE NOTICE 'Migration 032 complete: Added calculate_avg_days_between_trigger function';
END $$;
