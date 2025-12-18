-- Migration 017: Recreate Instagram metrics view
-- Version: 1.0 (2025-12-18)
--
-- Drops and recreates the instagram_metrics_with_growth view
-- Run AFTER migration 016 to ensure view uses all new columns
--
-- Safe to run multiple times

-- ==================== DROP EXISTING VIEW ====================
DROP VIEW IF EXISTS instagram_metrics_with_growth;

-- ==================== RECREATE VIEW WITH ALL COLUMNS ====================
CREATE VIEW instagram_metrics_with_growth AS
SELECT
  m.*,
  -- Day-over-day follower growth
  LAG(m.followers) OVER (PARTITION BY m.account_id ORDER BY m.bucket_date) AS prev_followers,
  m.followers - COALESCE(LAG(m.followers) OVER (PARTITION BY m.account_id ORDER BY m.bucket_date), m.followers) AS followers_change,
  CASE
    WHEN LAG(m.followers) OVER (PARTITION BY m.account_id ORDER BY m.bucket_date) > 0
    THEN ROUND(
      ((m.followers - LAG(m.followers) OVER (PARTITION BY m.account_id ORDER BY m.bucket_date))::DECIMAL
      / LAG(m.followers) OVER (PARTITION BY m.account_id ORDER BY m.bucket_date)) * 100, 2
    )
    ELSE 0
  END AS followers_growth_pct,
  -- Day-over-day reach growth
  LAG(m.reach) OVER (PARTITION BY m.account_id ORDER BY m.bucket_date) AS prev_reach,
  m.reach - COALESCE(LAG(m.reach) OVER (PARTITION BY m.account_id ORDER BY m.bucket_date), m.reach) AS reach_change,
  -- Day-over-day views growth
  LAG(m.views) OVER (PARTITION BY m.account_id ORDER BY m.bucket_date) AS prev_views,
  m.views - COALESCE(LAG(m.views) OVER (PARTITION BY m.account_id ORDER BY m.bucket_date), m.views) AS views_change,
  -- Day-over-day engagement growth
  LAG(m.total_interactions) OVER (PARTITION BY m.account_id ORDER BY m.bucket_date) AS prev_interactions,
  m.total_interactions - COALESCE(LAG(m.total_interactions) OVER (PARTITION BY m.account_id ORDER BY m.bucket_date), m.total_interactions) AS interactions_change
FROM instagram_daily_metrics m
ORDER BY m.bucket_date DESC;

COMMENT ON VIEW instagram_metrics_with_growth IS 'Instagram metrics with day-over-day growth calculations for followers, reach, views, and engagement (v24.0).';

-- ==================== GRANTS ====================
GRANT SELECT ON instagram_metrics_with_growth TO authenticated;
