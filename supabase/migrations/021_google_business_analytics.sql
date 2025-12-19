-- ============================================================
-- Migration 021: Google Business Profile Analytics
-- Version: 1.0 (2025-12-19)
--
-- Purpose: Store Google Business Profile metrics, reviews, and OAuth tokens
-- for the Google Business Analytics dashboard.
--
-- Tables:
--   - google_business_daily_metrics: Daily performance snapshots
--   - google_business_reviews: Customer reviews with reply tracking
--   - google_oauth_tokens: Secure OAuth token storage
--
-- Run in Supabase SQL Editor
-- ============================================================

-- ==================== DAILY METRICS TABLE ====================
-- Stores daily snapshots of GBP performance metrics

CREATE TABLE IF NOT EXISTS google_business_daily_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id TEXT NOT NULL,
  bucket_date DATE NOT NULL,

  -- Business snapshot
  business_name TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,

  -- Search metrics (how people find your business)
  queries_direct INTEGER DEFAULT 0,      -- Direct searches (business name)
  queries_indirect INTEGER DEFAULT 0,    -- Discovery searches (category/product)
  queries_chain INTEGER DEFAULT 0,       -- Chain searches (brand)

  -- View metrics (where people see your business)
  views_maps INTEGER DEFAULT 0,          -- Views on Google Maps
  views_search INTEGER DEFAULT 0,        -- Views on Google Search

  -- Action metrics (what people do)
  actions_website INTEGER DEFAULT 0,     -- Website clicks
  actions_phone INTEGER DEFAULT 0,       -- Phone calls
  actions_driving_directions INTEGER DEFAULT 0, -- Direction requests

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate entries per day
  UNIQUE(location_id, bucket_date)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_gbp_metrics_date
ON google_business_daily_metrics(bucket_date DESC);

CREATE INDEX IF NOT EXISTS idx_gbp_metrics_location
ON google_business_daily_metrics(location_id);

-- ==================== REVIEWS TABLE ====================
-- Stores individual reviews for display and management

CREATE TABLE IF NOT EXISTS google_business_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id TEXT NOT NULL,
  review_id TEXT UNIQUE NOT NULL,       -- Google's review ID

  -- Reviewer info
  reviewer_name TEXT,
  reviewer_photo_url TEXT,

  -- Review content
  star_rating INTEGER NOT NULL CHECK (star_rating >= 1 AND star_rating <= 5),
  comment TEXT,

  -- Timestamps
  create_time TIMESTAMPTZ NOT NULL,     -- When review was posted
  update_time TIMESTAMPTZ,              -- When review was edited

  -- Reply info (if owner responded)
  reply_comment TEXT,
  reply_update_time TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gbp_reviews_location
ON google_business_reviews(location_id);

CREATE INDEX IF NOT EXISTS idx_gbp_reviews_date
ON google_business_reviews(create_time DESC);

CREATE INDEX IF NOT EXISTS idx_gbp_reviews_rating
ON google_business_reviews(star_rating);

-- ==================== OAUTH TOKENS TABLE ====================
-- Secure storage for OAuth refresh tokens

CREATE TABLE IF NOT EXISTS google_oauth_tokens (
  id TEXT PRIMARY KEY DEFAULT 'gbp_default',
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security - only service role can access
ALTER TABLE google_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- No policies = only service role (used by Netlify functions) can access
-- This keeps tokens secure from client-side access

-- ==================== APP SETTINGS EXTENSION ====================
-- Add GBP sync tracking to existing app_settings table

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_settings' AND column_name = 'gbp_last_sync'
  ) THEN
    ALTER TABLE app_settings ADD COLUMN gbp_last_sync TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_settings' AND column_name = 'gbp_location_id'
  ) THEN
    ALTER TABLE app_settings ADD COLUMN gbp_location_id TEXT;
  END IF;
END $$;

-- ==================== HELPER FUNCTIONS ====================

-- Upsert daily metrics (prevents duplicates on re-sync)
CREATE OR REPLACE FUNCTION upsert_gbp_daily_metrics(p_data JSONB)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_row JSONB;
BEGIN
  FOR v_row IN SELECT * FROM jsonb_array_elements(p_data)
  LOOP
    INSERT INTO google_business_daily_metrics (
      location_id, bucket_date, business_name, rating, review_count,
      queries_direct, queries_indirect, queries_chain,
      views_maps, views_search,
      actions_website, actions_phone, actions_driving_directions,
      updated_at
    ) VALUES (
      v_row->>'location_id',
      (v_row->>'bucket_date')::DATE,
      v_row->>'business_name',
      COALESCE((v_row->>'rating')::DECIMAL, 0),
      COALESCE((v_row->>'review_count')::INTEGER, 0),
      COALESCE((v_row->>'queries_direct')::INTEGER, 0),
      COALESCE((v_row->>'queries_indirect')::INTEGER, 0),
      COALESCE((v_row->>'queries_chain')::INTEGER, 0),
      COALESCE((v_row->>'views_maps')::INTEGER, 0),
      COALESCE((v_row->>'views_search')::INTEGER, 0),
      COALESCE((v_row->>'actions_website')::INTEGER, 0),
      COALESCE((v_row->>'actions_phone')::INTEGER, 0),
      COALESCE((v_row->>'actions_driving_directions')::INTEGER, 0),
      NOW()
    )
    ON CONFLICT (location_id, bucket_date) DO UPDATE SET
      business_name = EXCLUDED.business_name,
      rating = EXCLUDED.rating,
      review_count = EXCLUDED.review_count,
      queries_direct = EXCLUDED.queries_direct,
      queries_indirect = EXCLUDED.queries_indirect,
      queries_chain = EXCLUDED.queries_chain,
      views_maps = EXCLUDED.views_maps,
      views_search = EXCLUDED.views_search,
      actions_website = EXCLUDED.actions_website,
      actions_phone = EXCLUDED.actions_phone,
      actions_driving_directions = EXCLUDED.actions_driving_directions,
      updated_at = NOW();

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Upsert reviews function
CREATE OR REPLACE FUNCTION upsert_gbp_reviews(p_data JSONB)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_row JSONB;
BEGIN
  FOR v_row IN SELECT * FROM jsonb_array_elements(p_data)
  LOOP
    INSERT INTO google_business_reviews (
      location_id, review_id, reviewer_name, reviewer_photo_url,
      star_rating, comment, create_time, update_time,
      reply_comment, reply_update_time, updated_at
    ) VALUES (
      v_row->>'location_id',
      v_row->>'review_id',
      v_row->>'reviewer_name',
      v_row->>'reviewer_photo_url',
      (v_row->>'star_rating')::INTEGER,
      v_row->>'comment',
      (v_row->>'create_time')::TIMESTAMPTZ,
      (v_row->>'update_time')::TIMESTAMPTZ,
      v_row->>'reply_comment',
      (v_row->>'reply_update_time')::TIMESTAMPTZ,
      NOW()
    )
    ON CONFLICT (review_id) DO UPDATE SET
      reviewer_name = EXCLUDED.reviewer_name,
      reviewer_photo_url = EXCLUDED.reviewer_photo_url,
      star_rating = EXCLUDED.star_rating,
      comment = EXCLUDED.comment,
      update_time = EXCLUDED.update_time,
      reply_comment = EXCLUDED.reply_comment,
      reply_update_time = EXCLUDED.reply_update_time,
      updated_at = NOW();

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ==================== VIEWS ====================

-- Metrics with computed totals
CREATE OR REPLACE VIEW google_business_metrics_summary AS
SELECT
  m.*,
  -- Computed totals
  (m.queries_direct + m.queries_indirect + m.queries_chain) AS total_searches,
  (m.views_maps + m.views_search) AS total_views,
  (m.actions_website + m.actions_phone + m.actions_driving_directions) AS total_actions
FROM google_business_daily_metrics m
ORDER BY m.bucket_date DESC;

-- ==================== PERMISSIONS ====================

GRANT SELECT, INSERT, UPDATE ON google_business_daily_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE ON google_business_reviews TO authenticated;
GRANT SELECT ON google_business_metrics_summary TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON google_business_daily_metrics TO anon;
GRANT SELECT ON google_business_reviews TO anon;

-- ==================== COMMENTS ====================

COMMENT ON TABLE google_business_daily_metrics IS
'Daily snapshots of Google Business Profile performance metrics.
Synced from Google Business Profile API.
v1.0: Initial schema for GBP analytics dashboard.';

COMMENT ON TABLE google_business_reviews IS
'Customer reviews from Google Business Profile with reply tracking.
v1.0: Initial schema for review management.';

COMMENT ON TABLE google_oauth_tokens IS
'Secure storage for Google OAuth tokens (service role access only).
Access tokens auto-refresh using stored refresh token.';

COMMENT ON COLUMN google_business_daily_metrics.queries_direct IS 'Direct searches: people searching for your business name';
COMMENT ON COLUMN google_business_daily_metrics.queries_indirect IS 'Discovery searches: people searching for a category, product, or service';
COMMENT ON COLUMN google_business_daily_metrics.queries_chain IS 'Chain searches: people searching for a brand related to your business';
COMMENT ON COLUMN google_business_daily_metrics.views_maps IS 'Views on Google Maps';
COMMENT ON COLUMN google_business_daily_metrics.views_search IS 'Views on Google Search';
COMMENT ON COLUMN google_business_daily_metrics.actions_website IS 'Clicks to visit your website';
COMMENT ON COLUMN google_business_daily_metrics.actions_phone IS 'Clicks to call your business';
COMMENT ON COLUMN google_business_daily_metrics.actions_driving_directions IS 'Requests for directions to your business';
