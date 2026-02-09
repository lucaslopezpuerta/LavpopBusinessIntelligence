-- Migration 065: Cohort Retention Analysis RPC
-- Creates get_cohort_retention() function for triangular retention heatmap
-- All dates use Brazil timezone (America/Sao_Paulo) per project standards
--
-- Returns one row per cohort month with:
--   - cohort_month: the first-transaction month for the group
--   - cohort_size: number of unique customers whose first transaction was in that month
--   - month_N_pct: percentage of cohort customers who transacted in month +N
--
-- Customer identifier: doc_cliente (CPF)
-- Filters: is_recarga = false (service transactions only)

CREATE OR REPLACE FUNCTION get_cohort_retention(p_months_back INTEGER DEFAULT 12)
RETURNS TABLE (
  cohort_month DATE,
  cohort_size INTEGER,
  month_0_pct DECIMAL(5,1),
  month_1_pct DECIMAL(5,1),
  month_2_pct DECIMAL(5,1),
  month_3_pct DECIMAL(5,1),
  month_4_pct DECIMAL(5,1),
  month_5_pct DECIMAL(5,1),
  month_6_pct DECIMAL(5,1)
) AS $$
BEGIN
  RETURN QUERY
  WITH
  -- Step 1: Extract Brazil-local month for every service transaction
  tx_months AS (
    SELECT
      doc_cliente,
      DATE_TRUNC('month', DATE(data_hora AT TIME ZONE 'America/Sao_Paulo'))::DATE AS tx_month
    FROM transactions
    WHERE is_recarga = FALSE
      AND doc_cliente IS NOT NULL
      AND doc_cliente <> ''
    GROUP BY doc_cliente, DATE_TRUNC('month', DATE(data_hora AT TIME ZONE 'America/Sao_Paulo'))
  ),

  -- Step 2: Find each customer's first transaction month (cohort assignment)
  first_months AS (
    SELECT
      doc_cliente,
      MIN(tx_month) AS first_month
    FROM tx_months
    GROUP BY doc_cliente
  ),

  -- Step 3: Filter to cohorts within the requested lookback window
  cohort_customers AS (
    SELECT
      fm.doc_cliente,
      fm.first_month
    FROM first_months fm
    WHERE fm.first_month >= DATE_TRUNC('month', CURRENT_DATE AT TIME ZONE 'America/Sao_Paulo')::DATE
                            - (p_months_back || ' months')::INTERVAL
  ),

  -- Step 4: Join cohort customers with their activity months
  cohort_activity AS (
    SELECT
      cc.first_month,
      cc.doc_cliente,
      tm.tx_month,
      -- Month offset: number of months between cohort month and activity month
      EXTRACT(YEAR FROM AGE(tm.tx_month, cc.first_month)) * 12
        + EXTRACT(MONTH FROM AGE(tm.tx_month, cc.first_month)) AS month_offset
    FROM cohort_customers cc
    JOIN tx_months tm ON tm.doc_cliente = cc.doc_cliente
                     AND tm.tx_month >= cc.first_month
                     AND tm.tx_month <= cc.first_month + INTERVAL '6 months'
  ),

  -- Step 5: Aggregate per cohort
  cohort_agg AS (
    SELECT
      ca.first_month,
      COUNT(DISTINCT cc2.doc_cliente) AS total_customers,
      COUNT(DISTINCT ca.doc_cliente) FILTER (WHERE ca.month_offset = 0) AS m0,
      COUNT(DISTINCT ca.doc_cliente) FILTER (WHERE ca.month_offset = 1) AS m1,
      COUNT(DISTINCT ca.doc_cliente) FILTER (WHERE ca.month_offset = 2) AS m2,
      COUNT(DISTINCT ca.doc_cliente) FILTER (WHERE ca.month_offset = 3) AS m3,
      COUNT(DISTINCT ca.doc_cliente) FILTER (WHERE ca.month_offset = 4) AS m4,
      COUNT(DISTINCT ca.doc_cliente) FILTER (WHERE ca.month_offset = 5) AS m5,
      COUNT(DISTINCT ca.doc_cliente) FILTER (WHERE ca.month_offset = 6) AS m6
    FROM cohort_customers cc2
    LEFT JOIN cohort_activity ca ON ca.doc_cliente = cc2.doc_cliente
                                 AND ca.first_month = cc2.first_month
    GROUP BY ca.first_month
  )

  -- Step 6: Calculate percentages and return
  SELECT
    a.first_month AS cohort_month,
    a.total_customers::INTEGER AS cohort_size,
    ROUND(a.m0 * 100.0 / NULLIF(a.total_customers, 0), 1) AS month_0_pct,
    ROUND(a.m1 * 100.0 / NULLIF(a.total_customers, 0), 1) AS month_1_pct,
    ROUND(a.m2 * 100.0 / NULLIF(a.total_customers, 0), 1) AS month_2_pct,
    ROUND(a.m3 * 100.0 / NULLIF(a.total_customers, 0), 1) AS month_3_pct,
    ROUND(a.m4 * 100.0 / NULLIF(a.total_customers, 0), 1) AS month_4_pct,
    ROUND(a.m5 * 100.0 / NULLIF(a.total_customers, 0), 1) AS month_5_pct,
    ROUND(a.m6 * 100.0 / NULLIF(a.total_customers, 0), 1) AS month_6_pct
  FROM cohort_agg a
  WHERE a.first_month IS NOT NULL
  ORDER BY a.first_month ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant access to authenticated users (anon key)
GRANT EXECUTE ON FUNCTION get_cohort_retention(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_cohort_retention(INTEGER) TO authenticated;

COMMENT ON FUNCTION get_cohort_retention IS
  'Returns cohort retention data for a triangular heatmap. '
  'Groups customers by their first transaction month and calculates '
  'the percentage that returned in each subsequent month (M+0 through M+6). '
  'All dates use America/Sao_Paulo timezone.';
