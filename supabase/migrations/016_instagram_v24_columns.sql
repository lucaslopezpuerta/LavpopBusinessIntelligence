-- Migration 016: Add Instagram API v24.0 columns
-- Version: 1.2 (2025-12-18)
--
-- Adds ALL missing columns for Meta Graph API v24.0 metrics.
-- This migration handles tables created with earlier schemas.
--
-- Columns added:
-- - views: Replaces deprecated 'impressions' metric
-- - profile_views, website_clicks: Traffic metrics
-- - accounts_engaged, total_interactions: Engagement metrics
-- - likes, comments, shares, saves: Engagement breakdown
-- - replies: Story replies (text + quick reactions)
-- - follows_and_unfollows, profile_links_taps: Growth metrics
--
-- Safe to run multiple times (uses IF NOT EXISTS)

-- ==================== DROP EXISTING VIEW ====================
-- Must drop view before altering table columns it depends on
DROP VIEW IF EXISTS instagram_metrics_with_growth;

-- ==================== ADD ALL MISSING COLUMNS ====================

-- Core insight metrics
ALTER TABLE instagram_daily_metrics
ADD COLUMN IF NOT EXISTS views INTEGER NOT NULL DEFAULT 0;

ALTER TABLE instagram_daily_metrics
ADD COLUMN IF NOT EXISTS profile_views INTEGER NOT NULL DEFAULT 0;

ALTER TABLE instagram_daily_metrics
ADD COLUMN IF NOT EXISTS website_clicks INTEGER NOT NULL DEFAULT 0;

ALTER TABLE instagram_daily_metrics
ADD COLUMN IF NOT EXISTS accounts_engaged INTEGER NOT NULL DEFAULT 0;

ALTER TABLE instagram_daily_metrics
ADD COLUMN IF NOT EXISTS total_interactions INTEGER NOT NULL DEFAULT 0;

-- Engagement breakdown
ALTER TABLE instagram_daily_metrics
ADD COLUMN IF NOT EXISTS likes INTEGER NOT NULL DEFAULT 0;

ALTER TABLE instagram_daily_metrics
ADD COLUMN IF NOT EXISTS comments INTEGER NOT NULL DEFAULT 0;

ALTER TABLE instagram_daily_metrics
ADD COLUMN IF NOT EXISTS shares INTEGER NOT NULL DEFAULT 0;

ALTER TABLE instagram_daily_metrics
ADD COLUMN IF NOT EXISTS saves INTEGER NOT NULL DEFAULT 0;

ALTER TABLE instagram_daily_metrics
ADD COLUMN IF NOT EXISTS replies INTEGER NOT NULL DEFAULT 0;

-- Growth & actions
ALTER TABLE instagram_daily_metrics
ADD COLUMN IF NOT EXISTS follows_and_unfollows INTEGER NOT NULL DEFAULT 0;

ALTER TABLE instagram_daily_metrics
ADD COLUMN IF NOT EXISTS profile_links_taps INTEGER NOT NULL DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN instagram_daily_metrics.views IS 'Content views (v24.0) - replaces deprecated impressions metric';
COMMENT ON COLUMN instagram_daily_metrics.profile_views IS 'Number of profile views';
COMMENT ON COLUMN instagram_daily_metrics.website_clicks IS 'Clicks on website link in bio';
COMMENT ON COLUMN instagram_daily_metrics.accounts_engaged IS 'Unique accounts that interacted';
COMMENT ON COLUMN instagram_daily_metrics.total_interactions IS 'Total likes, comments, saves, shares, replies';
COMMENT ON COLUMN instagram_daily_metrics.likes IS 'Total likes on posts';
COMMENT ON COLUMN instagram_daily_metrics.comments IS 'Total comments on posts';
COMMENT ON COLUMN instagram_daily_metrics.shares IS 'Total shares of posts';
COMMENT ON COLUMN instagram_daily_metrics.saves IS 'Total saves of posts';
COMMENT ON COLUMN instagram_daily_metrics.replies IS 'Story replies including text and quick reactions (v24.0)';
COMMENT ON COLUMN instagram_daily_metrics.follows_and_unfollows IS 'Net follower change';
COMMENT ON COLUMN instagram_daily_metrics.profile_links_taps IS 'Taps on profile external links';

-- ==================== UPDATE UPSERT FUNCTION ====================

-- Drop and recreate function to include new columns
CREATE OR REPLACE FUNCTION upsert_instagram_daily_metrics(p_data JSONB)
RETURNS INTEGER AS $$
DECLARE
  v_row JSONB;
  v_count INTEGER := 0;
BEGIN
  FOR v_row IN SELECT * FROM jsonb_array_elements(p_data)
  LOOP
    INSERT INTO instagram_daily_metrics (
      account_id, bucket_date, followers, following, posts,
      reach, views, profile_views, website_clicks, accounts_engaged, total_interactions,
      likes, comments, shares, saves, replies, follows_and_unfollows, profile_links_taps,
      engagement_rate, updated_at
    ) VALUES (
      v_row->>'account_id',
      (v_row->>'bucket_date')::DATE,
      COALESCE((v_row->>'followers')::INTEGER, 0),
      COALESCE((v_row->>'following')::INTEGER, 0),
      COALESCE((v_row->>'posts')::INTEGER, 0),
      COALESCE((v_row->>'reach')::INTEGER, 0),
      COALESCE((v_row->>'views')::INTEGER, 0),
      COALESCE((v_row->>'profile_views')::INTEGER, 0),
      COALESCE((v_row->>'website_clicks')::INTEGER, 0),
      COALESCE((v_row->>'accounts_engaged')::INTEGER, 0),
      COALESCE((v_row->>'total_interactions')::INTEGER, 0),
      COALESCE((v_row->>'likes')::INTEGER, 0),
      COALESCE((v_row->>'comments')::INTEGER, 0),
      COALESCE((v_row->>'shares')::INTEGER, 0),
      COALESCE((v_row->>'saves')::INTEGER, 0),
      COALESCE((v_row->>'replies')::INTEGER, 0),
      COALESCE((v_row->>'follows_and_unfollows')::INTEGER, 0),
      COALESCE((v_row->>'profile_links_taps')::INTEGER, 0),
      COALESCE((v_row->>'engagement_rate')::DECIMAL, 0),
      NOW()
    )
    ON CONFLICT (account_id, bucket_date) DO UPDATE SET
      followers = EXCLUDED.followers,
      following = EXCLUDED.following,
      posts = EXCLUDED.posts,
      reach = EXCLUDED.reach,
      views = EXCLUDED.views,
      profile_views = EXCLUDED.profile_views,
      website_clicks = EXCLUDED.website_clicks,
      accounts_engaged = EXCLUDED.accounts_engaged,
      total_interactions = EXCLUDED.total_interactions,
      likes = EXCLUDED.likes,
      comments = EXCLUDED.comments,
      shares = EXCLUDED.shares,
      saves = EXCLUDED.saves,
      replies = EXCLUDED.replies,
      follows_and_unfollows = EXCLUDED.follows_and_unfollows,
      profile_links_taps = EXCLUDED.profile_links_taps,
      engagement_rate = EXCLUDED.engagement_rate,
      updated_at = NOW();
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION upsert_instagram_daily_metrics IS 'Idempotent upsert for Instagram daily metrics (v24.0 with views and replies).';

-- ==================== RECREATE VIEW WITH GROWTH CALCULATIONS ====================

-- Recreate view with new columns (views_change)
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
  -- Day-over-day views growth (NEW v24.0)
  LAG(m.views) OVER (PARTITION BY m.account_id ORDER BY m.bucket_date) AS prev_views,
  m.views - COALESCE(LAG(m.views) OVER (PARTITION BY m.account_id ORDER BY m.bucket_date), m.views) AS views_change,
  -- Day-over-day engagement growth
  LAG(m.total_interactions) OVER (PARTITION BY m.account_id ORDER BY m.bucket_date) AS prev_interactions,
  m.total_interactions - COALESCE(LAG(m.total_interactions) OVER (PARTITION BY m.account_id ORDER BY m.bucket_date), m.total_interactions) AS interactions_change
FROM instagram_daily_metrics m
ORDER BY m.bucket_date DESC;

COMMENT ON VIEW instagram_metrics_with_growth IS 'Instagram metrics with day-over-day growth calculations for followers, reach, views, and engagement (v24.0).';

-- ==================== GRANTS ====================

GRANT SELECT, INSERT, UPDATE, DELETE ON instagram_daily_metrics TO authenticated;
GRANT SELECT ON instagram_metrics_with_growth TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_instagram_daily_metrics TO authenticated;
