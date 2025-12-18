-- Migration 015: Instagram Analytics Historical Tracking
-- Version: 3.26 (2025-12-18)
--
-- Stores daily Instagram metrics for trend analysis
-- Synced every 4 hours via campaign-scheduler.js
--
-- Tables:
-- - instagram_daily_metrics: Daily snapshots of account metrics
--
-- Design:
-- - Fetches from Meta Graph API via instagram-analytics.js
-- - One row per day per account
-- - Enables follower growth charts, engagement trends
--
-- Available Meta API Metrics (v24.0):
-- - reach, views (new, replaces impressions), profile_views, website_clicks
-- - accounts_engaged, total_interactions
-- - likes, comments, shares, saved, replies (new)
-- - follows_and_unfollows, profile_links_taps

-- ==================== DAILY METRICS TABLE ====================

CREATE TABLE IF NOT EXISTS instagram_daily_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id TEXT NOT NULL,                    -- Meta Instagram Account ID
  bucket_date DATE NOT NULL,

  -- Profile metrics
  followers INTEGER NOT NULL DEFAULT 0,
  following INTEGER NOT NULL DEFAULT 0,
  posts INTEGER NOT NULL DEFAULT 0,

  -- Core insights metrics (daily values)
  reach INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,                  -- NEW v24.0: replaces impressions
  profile_views INTEGER NOT NULL DEFAULT 0,
  website_clicks INTEGER NOT NULL DEFAULT 0,
  accounts_engaged INTEGER NOT NULL DEFAULT 0,
  total_interactions INTEGER NOT NULL DEFAULT 0,

  -- Engagement breakdown
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  replies INTEGER NOT NULL DEFAULT 0,                -- NEW v24.0: story replies

  -- Growth & actions
  follows_and_unfollows INTEGER NOT NULL DEFAULT 0,  -- Net follower change
  profile_links_taps INTEGER NOT NULL DEFAULT 0,     -- External link taps

  -- Computed metrics
  engagement_rate DECIMAL(5,2) DEFAULT 0,      -- (interactions / followers) * 100

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint prevents duplicates on re-sync
CREATE UNIQUE INDEX IF NOT EXISTS idx_instagram_metrics_unique
ON instagram_daily_metrics(account_id, bucket_date);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_instagram_metrics_date
ON instagram_daily_metrics(bucket_date);

COMMENT ON TABLE instagram_daily_metrics IS 'Daily Instagram account metrics from Meta Graph API. Enables historical trend analysis.';

-- ==================== SYNC TRACKING (in app_settings) ====================

ALTER TABLE app_settings
ADD COLUMN IF NOT EXISTS instagram_last_sync TIMESTAMPTZ;

COMMENT ON COLUMN app_settings.instagram_last_sync IS 'Timestamp of last Instagram analytics sync from Meta API';

-- ==================== UPSERT FUNCTION ====================

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

COMMENT ON FUNCTION upsert_instagram_daily_metrics IS 'Idempotent upsert for Instagram daily metrics.';

-- ==================== VIEW: METRICS WITH GROWTH ====================

CREATE OR REPLACE VIEW instagram_metrics_with_growth AS
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
  -- Day-over-day views growth (NEW)
  LAG(m.views) OVER (PARTITION BY m.account_id ORDER BY m.bucket_date) AS prev_views,
  m.views - COALESCE(LAG(m.views) OVER (PARTITION BY m.account_id ORDER BY m.bucket_date), m.views) AS views_change,
  -- Day-over-day engagement growth
  LAG(m.total_interactions) OVER (PARTITION BY m.account_id ORDER BY m.bucket_date) AS prev_interactions,
  m.total_interactions - COALESCE(LAG(m.total_interactions) OVER (PARTITION BY m.account_id ORDER BY m.bucket_date), m.total_interactions) AS interactions_change
FROM instagram_daily_metrics m
ORDER BY m.bucket_date DESC;

COMMENT ON VIEW instagram_metrics_with_growth IS 'Instagram metrics with day-over-day growth calculations for followers, reach, views, and engagement.';

-- ==================== GRANTS ====================

GRANT SELECT, INSERT, UPDATE, DELETE ON instagram_daily_metrics TO authenticated;
GRANT SELECT ON instagram_metrics_with_growth TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_instagram_daily_metrics TO authenticated;
