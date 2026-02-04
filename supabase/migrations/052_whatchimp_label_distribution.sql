-- Migration 052: WhatChimp Label Distribution RPC
-- Creates a function to get label distribution for WhatChimp Analytics tab
--
-- Returns:
--   - rfm_segments: Object with segment name -> count
--   - risk_levels: Object with risk level -> count
--   - total: Total customers with valid phone

-- Drop if exists (for re-run safety)
DROP FUNCTION IF EXISTS get_whatchimp_label_distribution();

-- Create the RPC function
CREATE OR REPLACE FUNCTION get_whatchimp_label_distribution()
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'rfm_segments', (
      SELECT COALESCE(json_object_agg(segment, cnt), '{}'::json)
      FROM (
        SELECT COALESCE(rfm_segment, 'Sem Segmento') as segment, COUNT(*) as cnt
        FROM customer_summary
        WHERE normalized_phone IS NOT NULL
        GROUP BY rfm_segment
        ORDER BY cnt DESC
      ) t
    ),
    'risk_levels', (
      SELECT COALESCE(json_object_agg(level, cnt), '{}'::json)
      FROM (
        SELECT COALESCE(risk_level, 'Sem Nível') as level, COUNT(*) as cnt
        FROM customer_summary
        WHERE normalized_phone IS NOT NULL
        GROUP BY risk_level
        ORDER BY cnt DESC
      ) t
    ),
    'total', (
      SELECT COUNT(*) FROM customer_summary WHERE normalized_phone IS NOT NULL
    )
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION get_whatchimp_label_distribution() TO anon;
GRANT EXECUTE ON FUNCTION get_whatchimp_label_distribution() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_whatchimp_label_distribution() IS 'Returns WhatChimp sync label distribution for analytics dashboard';
