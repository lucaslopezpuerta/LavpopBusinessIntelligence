-- Migration 067: Fix detect_customer_returns() false positives
--
-- BUG: The function used `c.last_visit >= ct.contacted_at::DATE` which matched
-- the TRIGGERING visit as a "return" for welcome/post_visit messages (same-day).
-- Also set `returned_at = c.last_visit::TIMESTAMPTZ` which converted DATE to
-- midnight UTC, displaying as the PREVIOUS day in Brazil timezone.
--
-- FIX: Use actual transaction timestamps (t.data_hora > ct.contacted_at) to
-- ensure only visits AFTER the message was sent count as returns.
-- Sets returned_at to the actual first return transaction timestamp.
--
-- AFFECTED: 41 records where returned_at < contacted_at (false positives)

-- Step 1: Replace detect_customer_returns() with transaction-based logic
CREATE OR REPLACE FUNCTION detect_customer_returns()
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated INT := 0;
BEGIN
  -- Update pending contacts where customer has a transaction AFTER the message was sent
  UPDATE contact_tracking ct
  SET
    status = 'returned',
    returned_at = return_info.first_return_visit,
    days_to_return = GREATEST(0,
      DATE(return_info.first_return_visit AT TIME ZONE 'America/Sao_Paulo')
      - DATE(ct.contacted_at AT TIME ZONE 'America/Sao_Paulo')
    ),
    return_revenue = return_info.revenue,
    updated_at = NOW()
  FROM (
    SELECT
      ct2.id AS ct_id,
      MIN(t.data_hora) AS first_return_visit,
      COALESCE(SUM(t.net_value) FILTER (
        WHERE t.data_hora <= ct2.contacted_at + INTERVAL '30 days'
      ), 0) AS revenue
    FROM contact_tracking ct2
    JOIN transactions t ON t.doc_cliente = ct2.customer_id
    WHERE ct2.status = 'pending'
      AND t.data_hora > ct2.contacted_at  -- strictly AFTER the message was sent
      AND NOT t.is_recarga
    GROUP BY ct2.id
  ) return_info
  WHERE ct.id = return_info.ct_id
    AND ct.status = 'pending';

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated > 0 THEN
    RAISE NOTICE 'detect_customer_returns: Updated % contacts as returned', v_updated;
  END IF;

  RETURN v_updated;
END;
$$;

-- Step 2: Repair existing false positives (returned_at < contacted_at)
-- Reset to 'pending' first, then let the corrected function re-evaluate them
UPDATE contact_tracking
SET
  status = 'pending',
  returned_at = NULL,
  days_to_return = NULL,
  return_revenue = 0,
  updated_at = NOW()
WHERE status = 'returned'
  AND returned_at < contacted_at;

-- Step 3: Re-run detection on the reset records (now uses corrected logic)
SELECT detect_customer_returns();
