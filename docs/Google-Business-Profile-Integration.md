# Google Business Profile Analytics Integration

Complete guide for implementing Google Business Profile analytics in the Bilavnova Business Intelligence dashboard.

---

## Table of Contents

1. [Overview](#overview)
2. [Google Cloud Setup](#google-cloud-setup)
3. [Database Schema](#database-schema)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [OAuth Flow](#oauth-flow)
7. [API Reference](#api-reference)

---

## Overview

### Features
- **Rating & Reviews**: Display star rating, review count, individual reviews with reply capability
- **Performance Metrics**: Search queries, views (Maps + Search), actions (website, phone, directions)
- **Historical Tracking**: Daily snapshots stored in Supabase for trend analysis
- **Review Management**: View and respond to customer reviews directly from dashboard

### Design
- Full-featured dashboard matching Instagram/WhatsApp patterns
- Google brand colors (Blue: `#4285F4`, Green: `#34A853`, Yellow: `#FBBC05`, Red: `#EA4335`)
- Mobile-friendly responsive layout
- Date filter: 7 dias, 30 dias, Tudo

### Architecture
```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  React Frontend │────▶│  Netlify Function    │────▶│  Google APIs    │
│  (Dashboard)    │     │  (OAuth + Proxy)     │     │  (GBP + Perf)   │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │    Supabase     │
                        │  (Storage +     │
                        │   OAuth Tokens) │
                        └─────────────────┘
```

---

## Google Cloud Setup

### Step 1: Create/Select Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one (e.g., "Lavpop Sales Project")

### Step 2: Enable Required APIs

Navigate to **APIs & Services > Library** and enable:

| API Name | Purpose |
|----------|---------|
| My Business Business Information API | Location info, hours, reviews |
| My Business Account Management API | Account/location listing |
| Business Profile Performance API | Search, views, actions metrics |

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Select **External** user type
3. Fill in required fields:
   - App name: `Lavpop Business Intelligence`
   - User support email: your email
   - Developer contact: your email
4. Add scope: `https://www.googleapis.com/auth/business.manage`
5. Add your email as a **Test user** (required while in Testing mode)

### Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services > Credentials**
2. Click **+ CREATE CREDENTIALS > OAuth client ID**
3. Select **Web application**
4. Configure:

**Name:** `Lavpop Business Intelligence`

**Authorized JavaScript origins:**
```
https://wondrous-medovik-7f51be.netlify.app
```

**Authorized redirect URIs:**
```
https://wondrous-medovik-7f51be.netlify.app/.netlify/functions/google-business-analytics?action=oauth-callback
```

5. Click **Create** and save the **Client ID** and **Client Secret**

### Step 5: Environment Variables

Add to Netlify (Site settings > Environment variables):

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | OAuth Client ID from Step 4 |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret from Step 4 |
| `GOOGLE_REDIRECT_URI` | `https://wondrous-medovik-7f51be.netlify.app/.netlify/functions/google-business-analytics?action=oauth-callback` |
| `GBP_ACCOUNT_ID` | Your GBP Account ID (found in GBP dashboard URL) |
| `GBP_LOCATION_ID` | Your GBP Location ID |

---

## Database Schema

### Migration File: `supabase/migrations/021_google_business_analytics.sql`

```sql
-- ============================================================
-- Migration 021: Google Business Profile Analytics
-- Version: 1.0 (2025-12-19)
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

ALTER TABLE app_settings
ADD COLUMN IF NOT EXISTS gbp_last_sync TIMESTAMPTZ;

ALTER TABLE app_settings
ADD COLUMN IF NOT EXISTS gbp_location_id TEXT;

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
      (v_row->>'rating')::DECIMAL,
      (v_row->>'review_count')::INTEGER,
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

-- ==================== VIEWS ====================

-- Metrics with computed totals and growth
CREATE OR REPLACE VIEW google_business_metrics_summary AS
SELECT
  m.*,
  -- Computed totals
  (m.queries_direct + m.queries_indirect + m.queries_chain) AS total_searches,
  (m.views_maps + m.views_search) AS total_views,
  (m.actions_website + m.actions_phone + m.actions_driving_directions) AS total_actions,
  -- Previous day values for growth calculation
  LAG(m.views_maps + m.views_search) OVER (
    PARTITION BY m.location_id ORDER BY m.bucket_date
  ) AS prev_total_views,
  LAG(m.queries_direct + m.queries_indirect + m.queries_chain) OVER (
    PARTITION BY m.location_id ORDER BY m.bucket_date
  ) AS prev_total_searches
FROM google_business_daily_metrics m
ORDER BY m.bucket_date DESC;

-- ==================== PERMISSIONS ====================

GRANT SELECT, INSERT, UPDATE ON google_business_daily_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE ON google_business_reviews TO authenticated;
GRANT SELECT ON google_business_metrics_summary TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ==================== COMMENTS ====================

COMMENT ON TABLE google_business_daily_metrics IS
'Daily snapshots of Google Business Profile performance metrics';

COMMENT ON TABLE google_business_reviews IS
'Customer reviews from Google Business Profile with reply tracking';

COMMENT ON TABLE google_oauth_tokens IS
'Secure storage for Google OAuth tokens (service role access only)';
```

---

## Backend Implementation

### Netlify Function: `netlify/functions/google-business-analytics.js`

```javascript
// google-business-analytics.js
// Google Business Profile Analytics API
// Handles OAuth, metrics, reviews, and sync

const { createClient } = require('@supabase/supabase-js');

// ==================== CONFIGURATION ====================

const CONFIG = {
  // Google API endpoints
  OAUTH_TOKEN_URL: 'https://oauth2.googleapis.com/token',
  OAUTH_AUTH_URL: 'https://accounts.google.com/o/oauth2/v2/auth',
  GBP_API_BASE: 'https://mybusinessbusinessinformation.googleapis.com/v1',
  PERFORMANCE_API_BASE: 'https://businessprofileperformance.googleapis.com/v1',
  ACCOUNT_API_BASE: 'https://mybusinessaccountmanagement.googleapis.com/v1',

  // OAuth settings
  SCOPES: 'https://www.googleapis.com/auth/business.manage',

  // Cache durations (seconds)
  CACHE_PROFILE: 3600,      // 1 hour
  CACHE_METRICS: 14400,     // 4 hours
  CACHE_REVIEWS: 1800,      // 30 minutes
};

// ==================== SUPABASE CLIENT ====================

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
}

// ==================== CORS HEADERS ====================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// ==================== OAUTH TOKEN MANAGEMENT ====================

async function getValidAccessToken() {
  const supabase = getSupabase();

  // Fetch stored tokens
  const { data: tokens, error } = await supabase
    .from('google_oauth_tokens')
    .select('*')
    .eq('id', 'gbp_default')
    .single();

  if (error || !tokens) {
    throw new Error('OAuth not configured. Visit /api/gbp/oauth/init to authorize.');
  }

  // Check if token is expired (with 5 min buffer)
  const expiresAt = new Date(tokens.expires_at);
  const now = new Date();
  const bufferMs = 5 * 60 * 1000; // 5 minutes

  if (expiresAt <= new Date(now.getTime() + bufferMs)) {
    // Token expired or expiring soon - refresh it
    console.log('Access token expired, refreshing...');
    return await refreshAccessToken(tokens.refresh_token);
  }

  return tokens.access_token;
}

async function refreshAccessToken(refreshToken) {
  const response = await fetch(CONFIG.OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const data = await response.json();

  // Update tokens in database
  const supabase = getSupabase();
  await supabase
    .from('google_oauth_tokens')
    .update({
      access_token: data.access_token,
      expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', 'gbp_default');

  console.log('Access token refreshed successfully');
  return data.access_token;
}

// ==================== API FETCH HELPERS ====================

async function fetchGoogleAPI(url, accessToken, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Google API error: ${response.status}`, error);
    throw new Error(`Google API error: ${response.status} - ${error}`);
  }

  return response.json();
}

// ==================== GBP API FUNCTIONS ====================

async function getAccounts(accessToken) {
  const url = `${CONFIG.ACCOUNT_API_BASE}/accounts`;
  return fetchGoogleAPI(url, accessToken);
}

async function getLocations(accessToken, accountId) {
  const url = `${CONFIG.GBP_API_BASE}/accounts/${accountId}/locations`;
  return fetchGoogleAPI(url, accessToken);
}

async function getLocationDetails(accessToken, locationName) {
  const readMask = 'name,title,phoneNumbers,categories,storefrontAddress,websiteUri,regularHours,specialHours,profile,metadata';
  const url = `${CONFIG.GBP_API_BASE}/${locationName}?readMask=${readMask}`;
  return fetchGoogleAPI(url, accessToken);
}

async function getReviews(accessToken, locationName, pageSize = 20, pageToken = null) {
  let url = `${CONFIG.GBP_API_BASE}/${locationName}/reviews?pageSize=${pageSize}`;
  if (pageToken) url += `&pageToken=${pageToken}`;
  return fetchGoogleAPI(url, accessToken);
}

async function replyToReview(accessToken, reviewName, comment) {
  const url = `${CONFIG.GBP_API_BASE}/${reviewName}/reply`;
  return fetchGoogleAPI(url, accessToken, {
    method: 'PUT',
    body: JSON.stringify({ comment })
  });
}

async function getPerformanceMetrics(accessToken, locationName, startDate, endDate) {
  const url = `${CONFIG.PERFORMANCE_API_BASE}/${locationName}:getDailyMetricsTimeSeries`;

  return fetchGoogleAPI(url, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      dailyMetrics: [
        'BUSINESS_IMPRESSIONS_DESKTOP_MAPS',
        'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH',
        'BUSINESS_IMPRESSIONS_MOBILE_MAPS',
        'BUSINESS_IMPRESSIONS_MOBILE_SEARCH',
        'BUSINESS_CONVERSATIONS',
        'BUSINESS_DIRECTION_REQUESTS',
        'CALL_CLICKS',
        'WEBSITE_CLICKS',
        'BUSINESS_BOOKINGS',
        'BUSINESS_FOOD_ORDERS',
        'BUSINESS_FOOD_MENU_CLICKS'
      ],
      dailyRange: {
        startDate: { year: startDate.getFullYear(), month: startDate.getMonth() + 1, day: startDate.getDate() },
        endDate: { year: endDate.getFullYear(), month: endDate.getMonth() + 1, day: endDate.getDate() }
      }
    })
  });
}

// ==================== MAIN HANDLER ====================

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  try {
    const params = event.queryStringParameters || {};
    const action = params.action || 'dashboard';

    console.log(`GBP Analytics: action=${action}`);

    switch (action) {
      // ==================== OAUTH ACTIONS ====================

      case 'oauth-init': {
        // Generate OAuth authorization URL
        const authUrl = new URL(CONFIG.OAUTH_AUTH_URL);
        authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID);
        authUrl.searchParams.set('redirect_uri', process.env.GOOGLE_REDIRECT_URI);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', CONFIG.SCOPES);
        authUrl.searchParams.set('access_type', 'offline');
        authUrl.searchParams.set('prompt', 'consent');

        return {
          statusCode: 302,
          headers: { ...corsHeaders, Location: authUrl.toString() },
          body: ''
        };
      }

      case 'oauth-callback': {
        // Exchange authorization code for tokens
        const { code, error: oauthError } = params;

        if (oauthError) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: `OAuth error: ${oauthError}` })
          };
        }

        if (!code) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'No authorization code provided' })
          };
        }

        // Exchange code for tokens
        const tokenResponse = await fetch(CONFIG.OAUTH_TOKEN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code'
          })
        });

        if (!tokenResponse.ok) {
          const error = await tokenResponse.text();
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: `Token exchange failed: ${error}` })
          };
        }

        const tokens = await tokenResponse.json();

        // Store tokens in Supabase
        const supabase = getSupabase();
        await supabase
          .from('google_oauth_tokens')
          .upsert({
            id: 'gbp_default',
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_type: tokens.token_type || 'Bearer',
            expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
            scope: tokens.scope,
            updated_at: new Date().toISOString()
          });

        // Redirect to dashboard
        return {
          statusCode: 302,
          headers: { ...corsHeaders, Location: '/social?tab=google&oauth=success' },
          body: ''
        };
      }

      // ==================== DATA ACTIONS ====================

      case 'dashboard': {
        const accessToken = await getValidAccessToken();
        const locationName = `locations/${process.env.GBP_LOCATION_ID}`;

        // Fetch profile, reviews, and recent metrics in parallel
        const [profile, reviewsData] = await Promise.all([
          getLocationDetails(accessToken, locationName),
          getReviews(accessToken, locationName, 5)
        ]);

        // Get historical data from database
        const supabase = getSupabase();
        const { data: history } = await supabase
          .from('google_business_daily_metrics')
          .select('*')
          .order('bucket_date', { ascending: false })
          .limit(30);

        return {
          statusCode: 200,
          headers: {
            ...corsHeaders,
            'Cache-Control': `public, max-age=${CONFIG.CACHE_PROFILE}`
          },
          body: JSON.stringify({
            profile,
            reviews: reviewsData.reviews || [],
            history: history || [],
            totalReviewCount: reviewsData.totalReviewCount || 0,
            averageRating: reviewsData.averageRating || 0
          })
        };
      }

      case 'profile': {
        const accessToken = await getValidAccessToken();
        const locationName = `locations/${process.env.GBP_LOCATION_ID}`;
        const profile = await getLocationDetails(accessToken, locationName);

        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Cache-Control': `public, max-age=${CONFIG.CACHE_PROFILE}` },
          body: JSON.stringify(profile)
        };
      }

      case 'reviews': {
        const accessToken = await getValidAccessToken();
        const locationName = `locations/${process.env.GBP_LOCATION_ID}`;
        const pageSize = parseInt(params.pageSize) || 20;
        const pageToken = params.pageToken || null;

        const data = await getReviews(accessToken, locationName, pageSize, pageToken);

        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Cache-Control': `public, max-age=${CONFIG.CACHE_REVIEWS}` },
          body: JSON.stringify(data)
        };
      }

      case 'reply': {
        if (event.httpMethod !== 'POST') {
          return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
        }

        const body = JSON.parse(event.body || '{}');
        const { reviewId, comment } = body;

        if (!reviewId || !comment) {
          return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'reviewId and comment required' }) };
        }

        const accessToken = await getValidAccessToken();
        const result = await replyToReview(accessToken, reviewId, comment);

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(result)
        };
      }

      case 'sync': {
        const accessToken = await getValidAccessToken();
        const locationName = `locations/${process.env.GBP_LOCATION_ID}`;

        // Get date range (last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        // Fetch metrics from Google
        const metrics = await getPerformanceMetrics(accessToken, locationName, startDate, endDate);

        // Transform and store in Supabase
        const supabase = getSupabase();
        // ... transform metrics to daily records and upsert

        // Update last sync time
        await supabase
          .from('app_settings')
          .update({ gbp_last_sync: new Date().toISOString() })
          .eq('id', 1);

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ success: true, message: 'Sync completed' })
        };
      }

      case 'history': {
        const days = params.days === 'all' ? null : parseInt(params.days) || 30;
        const supabase = getSupabase();

        let query = supabase
          .from('google_business_daily_metrics')
          .select('*')
          .order('bucket_date', { ascending: false });

        if (days) {
          const fromDate = new Date();
          fromDate.setDate(fromDate.getDate() - days);
          query = query.gte('bucket_date', fromDate.toISOString().split('T')[0]);
        }

        const { data, error } = await query;

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ history: data || [], error: error?.message })
        };
      }

      case 'status': {
        const supabase = getSupabase();

        const [{ data: settings }, { data: tokens }] = await Promise.all([
          supabase.from('app_settings').select('gbp_last_sync').single(),
          supabase.from('google_oauth_tokens').select('expires_at, updated_at').eq('id', 'gbp_default').single()
        ]);

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            lastSync: settings?.gbp_last_sync,
            oauthConfigured: !!tokens,
            tokenExpiresAt: tokens?.expires_at
          })
        };
      }

      default:
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: `Unknown action: ${action}` })
        };
    }

  } catch (error) {
    console.error('GBP Analytics error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

---

## Frontend Implementation

### Files to Modify

#### 1. `src/components/social/SocialMediaNavigation.jsx`

Add to the `sections` array:

```javascript
import { Building2 } from 'lucide-react';

// In sections array, add before facebook:
{
  id: 'google',
  label: 'Google Business',
  icon: Building2,
  mobileLabel: 'GMB',
  available: true,
  colors: {
    active: 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-500/25',
    hover: 'hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400'
  }
}
```

#### 2. `src/views/SocialMedia.jsx`

```javascript
// Add lazy import
const GoogleBusinessAnalytics = lazy(() => import('../components/social/GoogleBusinessAnalytics'));

// Add conditional render (after blacklist section)
{activeSection === 'google' && (
  <Suspense fallback={<LoadingFallback />}>
    <GoogleBusinessAnalytics />
  </Suspense>
)}
```

#### 3. `src/utils/apiService.js`

Add `googleBusiness` namespace:

```javascript
// ==================== GOOGLE BUSINESS ====================
googleBusiness: {
  async getDashboard() {
    const response = await fetch('/.netlify/functions/google-business-analytics?action=dashboard');
    if (!response.ok) throw new Error('Failed to fetch GBP dashboard');
    return response.json();
  },

  async getReviews(pageSize = 20, pageToken = null) {
    const params = new URLSearchParams({ action: 'reviews', pageSize });
    if (pageToken) params.append('pageToken', pageToken);
    const response = await fetch(`/.netlify/functions/google-business-analytics?${params}`);
    return response.json();
  },

  async replyToReview(reviewId, comment) {
    const response = await fetch('/.netlify/functions/google-business-analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reply', reviewId, comment })
    });
    return response.json();
  },

  async getHistory(days = 30) {
    const daysParam = days === null ? 'all' : days;
    const response = await fetch(`/.netlify/functions/google-business-analytics?action=history&days=${daysParam}`);
    return response.json();
  },

  async triggerSync() {
    const response = await fetch('/.netlify/functions/google-business-analytics?action=sync');
    return response.json();
  },

  async getStatus() {
    const response = await fetch('/.netlify/functions/google-business-analytics?action=status');
    return response.json();
  },

  getOAuthInitUrl() {
    return '/.netlify/functions/google-business-analytics?action=oauth-init';
  }
}
```

### New Component: `src/components/social/GoogleBusinessAnalytics.jsx`

Component structure (following Instagram/WhatsApp patterns):

```
GoogleBusinessAnalytics
├── ProfileHeader
│   ├── Business avatar (Google blue gradient)
│   ├── Business name + verified badge
│   ├── Address
│   ├── Star rating visualization
│   ├── Review count
│   └── Date filter + Sync button
├── KPIGrid (6 cards)
│   ├── Total Searches (queries_direct + indirect + chain)
│   ├── Total Views (views_maps + views_search)
│   ├── Website Clicks
│   ├── Phone Calls
│   ├── Direction Requests
│   └── Average Rating (with stars)
├── PerformanceChart
│   ├── Line: Views over time
│   ├── Line: Searches over time
│   └── Bars: Actions over time
├── Grid (2/3 + 1/3 layout)
│   ├── ReviewsSection (paginated)
│   │   ├── Review card with stars
│   │   ├── Reviewer name + date
│   │   ├── Review text
│   │   ├── Reply button
│   │   └── Existing reply (if any)
│   └── Sidebar
│       ├── BusinessHoursCard
│       └── SearchBreakdownChart (pie: direct/indirect/chain)
```

---

## OAuth Flow

### Initial Authorization (One-time)

1. User visits dashboard → sees "Connect Google Business" button
2. Click triggers redirect to `?action=oauth-init`
3. Function redirects to Google OAuth consent screen
4. User grants access
5. Google redirects back to `?action=oauth-callback&code=xxx`
6. Function exchanges code for tokens
7. Tokens stored in Supabase
8. User redirected to dashboard with success message

### Token Refresh (Automatic)

1. Every API call checks token expiry
2. If expired (or within 5 min), auto-refresh using refresh token
3. New access token stored in database
4. Original request proceeds with fresh token

### Flow Diagram

```
┌──────────────┐     ┌───────────────┐     ┌─────────────────┐
│    User      │────▶│ oauth-init    │────▶│ Google OAuth    │
│  (Browser)   │     │ (Netlify)     │     │ Consent Screen  │
└──────────────┘     └───────────────┘     └─────────────────┘
       ▲                                           │
       │                                           │ code
       │                                           ▼
       │              ┌───────────────┐     ┌─────────────────┐
       └──────────────│oauth-callback │◀────│ Google OAuth    │
         redirect     │ (Netlify)     │     │ Token Endpoint  │
                      └───────────────┘     └─────────────────┘
                             │
                             │ store tokens
                             ▼
                      ┌─────────────────┐
                      │    Supabase     │
                      │ (oauth_tokens)  │
                      └─────────────────┘
```

---

## API Reference

### Endpoints

| Action | Method | Description |
|--------|--------|-------------|
| `oauth-init` | GET | Start OAuth flow (redirects to Google) |
| `oauth-callback` | GET | Handle OAuth callback |
| `dashboard` | GET | Combined profile + reviews + history |
| `profile` | GET | Business location details |
| `reviews` | GET | Paginated reviews list |
| `reply` | POST | Reply to a review |
| `sync` | GET | Sync metrics from Google to database |
| `history` | GET | Historical metrics from database |
| `status` | GET | OAuth and sync status |

### Request Examples

```bash
# Get dashboard data
GET /.netlify/functions/google-business-analytics?action=dashboard

# Get reviews with pagination
GET /.netlify/functions/google-business-analytics?action=reviews&pageSize=10&pageToken=xxx

# Reply to a review
POST /.netlify/functions/google-business-analytics
Content-Type: application/json
{ "action": "reply", "reviewId": "accounts/xxx/locations/xxx/reviews/xxx", "comment": "Thank you!" }

# Get historical data (last 30 days)
GET /.netlify/functions/google-business-analytics?action=history&days=30

# Get all historical data
GET /.netlify/functions/google-business-analytics?action=history&days=all

# Trigger manual sync
GET /.netlify/functions/google-business-analytics?action=sync
```

### Response Formats

#### Dashboard Response
```json
{
  "profile": {
    "name": "locations/xxx",
    "title": "Lavpop Lavanderia",
    "phoneNumbers": { "primaryPhone": "+55 54 3025-4000" },
    "websiteUri": "https://lavpop.com.br",
    "regularHours": { /* opening hours */ }
  },
  "reviews": [
    {
      "name": "accounts/xxx/locations/xxx/reviews/xxx",
      "reviewer": { "displayName": "João Silva", "profilePhotoUrl": "..." },
      "starRating": "FIVE",
      "comment": "Excellent service!",
      "createTime": "2025-12-15T10:30:00Z",
      "reviewReply": { "comment": "Thank you!", "updateTime": "..." }
    }
  ],
  "history": [
    {
      "bucket_date": "2025-12-18",
      "rating": 4.8,
      "review_count": 127,
      "views_maps": 450,
      "views_search": 320,
      "actions_website": 45,
      "actions_phone": 12,
      "actions_driving_directions": 28
    }
  ],
  "totalReviewCount": 127,
  "averageRating": 4.8
}
```

---

## Implementation Checklist

- [ ] **Phase 1: Database**
  - [ ] Create migration `021_google_business_analytics.sql`
  - [ ] Run migration in Supabase
  - [ ] Verify tables created

- [ ] **Phase 2: OAuth Setup**
  - [ ] Enable Google APIs in Cloud Console
  - [ ] Configure OAuth consent screen
  - [ ] Create OAuth credentials
  - [ ] Add environment variables to Netlify

- [ ] **Phase 3: Backend**
  - [ ] Create `google-business-analytics.js` Netlify function
  - [ ] Test OAuth flow
  - [ ] Test all action handlers

- [ ] **Phase 4: Frontend**
  - [ ] Add API methods to `apiService.js`
  - [ ] Update `SocialMediaNavigation.jsx`
  - [ ] Create `GoogleBusinessAnalytics.jsx`
  - [ ] Update `SocialMedia.jsx`

- [ ] **Phase 5: Polish**
  - [ ] Add scheduled sync
  - [ ] Error handling
  - [ ] Mobile responsiveness
  - [ ] Loading states

---

## Troubleshooting

### OAuth Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `redirect_uri_mismatch` | URI doesn't match Cloud Console | Verify exact URI in OAuth credentials |
| `access_denied` | User denied consent | User must click "Allow" |
| `invalid_grant` | Code expired or already used | Restart OAuth flow |

### API Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `401 Unauthorized` | Token expired | Auto-refresh should handle; check refresh token |
| `403 Forbidden` | API not enabled or no access | Enable API in Cloud Console |
| `404 Not Found` | Wrong location ID | Verify `GBP_LOCATION_ID` env var |

### Common Issues

1. **"OAuth not configured"**: Run the OAuth init flow first
2. **No metrics data**: Metrics API only returns data for verified businesses
3. **Reviews not showing**: Business must have reviews and be verified owner
