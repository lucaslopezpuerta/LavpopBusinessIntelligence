-- Migration 064: Clean up zero-value template analytics rows
-- Context: 96.4% of rows (403 of 418) in waba_template_analytics were zeros.
-- These zeros come from Meta API returning all-zero data since Dec 17, 2025.
-- The sync stores all rows including zeros, bloating the table.
--
-- Changes:
-- 1. Delete zero-value rows from the table
-- 2. Add WHERE filter to the view to exclude zeros going forward

-- Delete zero-value rows from waba_template_analytics
DELETE FROM waba_template_analytics
WHERE sent = 0 AND delivered = 0 AND read_count = 0;

-- Recreate view with WHERE filter to exclude zero-value rows going forward
CREATE OR REPLACE VIEW waba_template_analytics_view AS
SELECT
  ta.id,
  ta.template_id,
  t.name AS template_name,
  t.local_template_id,
  t.category,
  t.status,
  ta.waba_id,
  ta.bucket_date,
  ta.sent,
  ta.delivered,
  ta.read_count,
  CASE
    WHEN ta.sent > 0 THEN round(ta.delivered::numeric / ta.sent::numeric * 100, 1)
    ELSE 0
  END AS delivery_rate,
  CASE
    WHEN ta.delivered > 0 THEN round(ta.read_count::numeric / ta.delivered::numeric * 100, 1)
    ELSE 0
  END AS read_rate,
  ta.created_at,
  ta.updated_at
FROM waba_template_analytics ta
JOIN waba_templates t ON ta.template_id = t.id
WHERE ta.sent > 0 OR ta.delivered > 0 OR ta.read_count > 0
ORDER BY ta.bucket_date DESC, t.name;
