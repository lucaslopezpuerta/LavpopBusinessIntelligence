-- Migration: Fix return detection for same-day returns and multi-visit revenue
-- Date: 2025-12-13
-- Version: 3.11
--
-- Changes:
-- 1. Changed > to >= to detect same-day returns (customer contacted in morning, returns in afternoon)
-- 2. Revenue now sums ALL transactions within 7 days after contact, not just last_visit date
-- 3. Added GREATEST(0, ...) to prevent negative days_to_return

-- Drop and recreate the function
CREATE OR REPLACE FUNCTION detect_customer_returns()
RETURNS INT AS $$
DECLARE
  v_updated INT := 0;
BEGIN
  -- Update pending contacts where customer has visited ON OR AFTER being contacted
  -- Uses >= to catch same-day returns (customer contacted in morning, returns in afternoon)
  UPDATE contact_tracking ct
  SET
    status = 'returned',
    returned_at = c.last_visit::TIMESTAMPTZ,
    days_to_return = GREATEST(0, (c.last_visit - ct.contacted_at::DATE)),
    -- Calculate return revenue from ALL transactions within 7 days after contact
    -- Not just the last_visit date - captures multiple return visits
    return_revenue = COALESCE((
      SELECT SUM(t.net_value)
      FROM transactions t
      WHERE t.doc_cliente = ct.customer_id
        AND t.data_hora::DATE >= ct.contacted_at::DATE
        AND t.data_hora::DATE <= ct.contacted_at::DATE + INTERVAL '7 days'
        AND NOT t.is_recarga
    ), 0),
    updated_at = NOW()
  FROM customers c
  WHERE ct.customer_id = c.doc
    AND ct.status = 'pending'
    AND c.last_visit IS NOT NULL
    AND c.last_visit >= ct.contacted_at::DATE;  -- Changed > to >= for same-day returns

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  -- Log the result
  IF v_updated > 0 THEN
    RAISE NOTICE 'detect_customer_returns: Updated % contacts as returned', v_updated;
  END IF;

  RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

-- Verify the function was created
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: detect_customer_returns() updated to v3.11';
END $$;
