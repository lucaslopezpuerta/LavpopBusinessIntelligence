// netlify/functions/instagram-analytics.js
// Instagram Analytics API - Meta Graph API v24.0
//
// v1.6 (2025-12-18): Historical backfill
//   - Added backfill action to fetch past N days of data
//   - Added fetchInsightsForDate() for date-specific queries
//   - Uses since/until parameters for historical data
//
// v1.5 (2025-12-18): Debug logging for insights
//   - Added console logging to debug metric parsing
//   - Improved total_value parsing for different response formats
//
// v1.4 (2025-12-18): Fixed metric name
//   - Changed 'saved' to 'saves' (correct v24.0 metric name)
//
// v1.3 (2025-12-18): Upgraded to API v24.0
//   - Upgraded from v21.0 to v24.0 (latest)
//   - Added 'views' metric (replaces deprecated impressions)
//   - Added 'replies' metric (story replies)
//   - Prepared for demographic metrics support
//
// v1.2 (2025-12-18): Extended metrics
//   - Added 12 metrics from Meta Graph API
//   - Engagement breakdown: likes, comments, shares, saves
//   - Growth tracking: follows_and_unfollows, profile_links_taps
//   - Removed invalid 'impressions' metric (deprecated in v22.0)
//
// v1.1 (2025-12-18): Historical tracking with Supabase
//   - Added syncInstagramAnalytics() for daily snapshots
//   - Added 'sync' action for manual/scheduled sync
//   - Added 'history' action for historical data retrieval
//   - Stores metrics in instagram_daily_metrics table
//   - Exported sync function for campaign-scheduler.js
//
// v1.0 (2025-12-18): Initial implementation
//   - Profile data: followers, following, posts, bio, website
//   - Account insights: reach, profile views, engagement
//   - Media list: recent posts with engagement metrics
//   - Per-media insights: individual post performance
//   - Comments: recent comments across posts
//   - Messages count: DM conversation count (read-only)
//
// Environment variables required:
// - META_ACCESS_TOKEN: Meta Graph API access token
// - META_INSTAGRAM_ACCOUNT_ID: Instagram Business Account ID
//
// Permissions required:
// - instagram_basic
// - instagram_manage_insights
// - instagram_manage_comments
// - instagram_manage_messages

const GRAPH_API_BASE = 'https://graph.facebook.com';
const GRAPH_API_VERSION = 'v24.0';

/**
 * Fetch with retry logic for rate limiting
 */
async function fetchWithRetry(url, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url);

    if (response.status === 429) {
      // Rate limited - wait and retry
      const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10);
      console.warn(`Rate limited, retrying after ${retryAfter}s (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      continue;
    }

    return response;
  }

  throw new Error('Max retries exceeded');
}

/**
 * Parse Meta API error response
 */
function parseMetaError(errorData) {
  const error = errorData.error || {};
  return {
    message: error.message || 'Unknown Meta API error',
    code: error.code,
    subcode: error.error_subcode,
    type: error.type
  };
}

/**
 * Get Supabase client (for future database caching if needed)
 */
function getSupabase() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
}

// ==================== API FUNCTIONS ====================

/**
 * Fetch Instagram profile data
 */
async function fetchProfile(accountId, accessToken) {
  const fields = 'id,username,name,followers_count,follows_count,media_count,profile_picture_url,biography,website';
  const url = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${accountId}?fields=${fields}&access_token=${accessToken}`;

  const response = await fetchWithRetry(url);
  const data = await response.json();

  if (!response.ok) {
    const errorInfo = parseMetaError(data);
    throw new Error(`Profile fetch error: ${errorInfo.message}`);
  }

  return {
    id: data.id,
    username: data.username,
    name: data.name || data.username,
    followers: data.followers_count || 0,
    following: data.follows_count || 0,
    posts: data.media_count || 0,
    picture: data.profile_picture_url,
    bio: data.biography || '',
    website: data.website || '',
    url: `https://www.instagram.com/${data.username}/`
  };
}

/**
 * Fetch account-level insights
 * Available metrics with instagram_manage_insights permission (v24.0):
 * - reach: Unique accounts that have seen any content
 * - views: Times content was played/displayed (replaces impressions)
 * - profile_views: Number of profile views
 * - website_clicks: Clicks on website link
 * - accounts_engaged: Unique accounts that interacted
 * - total_interactions: Total likes, comments, saves, shares, replies
 * - likes: Total likes on posts
 * - comments: Total comments on posts
 * - shares: Total shares of posts
 * - saves: Total saves of posts
 * - replies: Story replies (text + quick reactions)
 * - follows_and_unfollows: Net follower change
 * - profile_links_taps: Taps on profile link
 *
 * Note: 'impressions' deprecated in v22.0, use 'views' instead
 */
async function fetchInsights(accountId, accessToken) {
  // All available metrics for Instagram Business accounts (v24.0)
  // See: https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights
  const metrics = [
    'reach',
    'views',              // NEW in v24.0 - replaces impressions
    'profile_views',
    'website_clicks',
    'accounts_engaged',
    'total_interactions',
    'likes',
    'comments',
    'shares',
    'saves',
    'replies',            // NEW - story replies
    'follows_and_unfollows',
    'profile_links_taps'
  ].join(',');

  const url = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${accountId}/insights?metric=${metrics}&period=day&metric_type=total_value&access_token=${accessToken}`;

  const response = await fetchWithRetry(url);
  const data = await response.json();

  if (!response.ok) {
    const errorInfo = parseMetaError(data);
    console.warn(`Insights fetch warning: ${errorInfo.message}`);
    return null;
  }

  // Parse insights from response
  const insights = {};
  console.log(`Instagram insights raw response: ${data.data?.length || 0} metrics received`);

  if (data.data && data.data.length > 0) {
    data.data.forEach(metric => {
      let value = 0;

      if (metric.total_value !== undefined) {
        // total_value can be { value: X } or { breakdowns: [...] }
        if (typeof metric.total_value === 'object' && metric.total_value.value !== undefined) {
          value = metric.total_value.value;
        } else if (typeof metric.total_value === 'number') {
          value = metric.total_value;
        }
      } else if (metric.values && metric.values.length > 0) {
        // Time-series format - get latest value
        const latestValue = metric.values[metric.values.length - 1];
        value = latestValue?.value || 0;
      }

      insights[metric.name] = value;
      console.log(`  ${metric.name}: ${value}`);
    });
  }

  return {
    // Core metrics
    reach: insights.reach || 0,
    views: insights.views || 0,           // NEW - replaces impressions
    profileViews: insights.profile_views || 0,
    websiteClicks: insights.website_clicks || 0,
    accountsEngaged: insights.accounts_engaged || 0,
    totalInteractions: insights.total_interactions || 0,
    // Engagement breakdown
    likes: insights.likes || 0,
    comments: insights.comments || 0,
    shares: insights.shares || 0,
    saves: insights.saves || 0,
    replies: insights.replies || 0,       // NEW - story replies
    // Growth & actions
    followsAndUnfollows: insights.follows_and_unfollows || 0,
    profileLinksTaps: insights.profile_links_taps || 0
  };
}

/**
 * Fetch recent media (posts)
 */
async function fetchMedia(accountId, accessToken, limit = 25) {
  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count';
  const url = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${accountId}/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`;

  const response = await fetchWithRetry(url);
  const data = await response.json();

  if (!response.ok) {
    const errorInfo = parseMetaError(data);
    throw new Error(`Media fetch error: ${errorInfo.message}`);
  }

  return (data.data || []).map(post => ({
    id: post.id,
    caption: post.caption || '',
    type: post.media_type, // IMAGE, VIDEO, CAROUSEL_ALBUM
    mediaUrl: post.media_url,
    thumbnail: post.thumbnail_url || post.media_url,
    permalink: post.permalink,
    timestamp: post.timestamp,
    likes: post.like_count || 0,
    comments: post.comments_count || 0,
    // Calculate engagement (likes + comments)
    engagement: (post.like_count || 0) + (post.comments_count || 0)
  }));
}

/**
 * Fetch insights for a specific media item
 */
async function fetchMediaInsights(mediaId, accessToken) {
  // Available metrics for media insights
  const metrics = 'engagement,impressions,reach,saved';
  const url = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${mediaId}/insights?metric=${metrics}&access_token=${accessToken}`;

  const response = await fetchWithRetry(url);
  const data = await response.json();

  if (!response.ok) {
    const errorInfo = parseMetaError(data);
    console.warn(`Media insights warning for ${mediaId}: ${errorInfo.message}`);
    return null;
  }

  const insights = {};
  if (data.data && data.data.length > 0) {
    data.data.forEach(metric => {
      insights[metric.name] = metric.values?.[0]?.value || 0;
    });
  }

  return {
    engagement: insights.engagement || 0,
    impressions: insights.impressions || 0,
    reach: insights.reach || 0,
    saved: insights.saved || 0
  };
}

/**
 * Fetch comments from recent posts
 */
async function fetchRecentComments(accountId, accessToken, limit = 50) {
  // First get recent media
  const mediaUrl = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${accountId}/media?fields=id,permalink,thumbnail_url&limit=10&access_token=${accessToken}`;
  const mediaResponse = await fetchWithRetry(mediaUrl);
  const mediaData = await mediaResponse.json();

  if (!mediaResponse.ok || !mediaData.data) {
    return [];
  }

  const allComments = [];
  const commentsPerPost = Math.ceil(limit / mediaData.data.length);

  // Fetch comments from each post
  for (const post of mediaData.data) {
    try {
      const commentsUrl = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${post.id}/comments?fields=id,text,timestamp,username&limit=${commentsPerPost}&access_token=${accessToken}`;
      const commentsResponse = await fetchWithRetry(commentsUrl);
      const commentsData = await commentsResponse.json();

      if (commentsResponse.ok && commentsData.data) {
        commentsData.data.forEach(comment => {
          allComments.push({
            id: comment.id,
            text: comment.text,
            timestamp: comment.timestamp,
            username: comment.username,
            postId: post.id,
            postUrl: post.permalink,
            postThumbnail: post.thumbnail_url
          });
        });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (err) {
      console.warn(`Failed to fetch comments for post ${post.id}:`, err.message);
    }
  }

  // Sort by timestamp (newest first) and limit
  return allComments
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

/**
 * Fetch DM conversation count
 */
async function fetchMessagesCount(accountId, accessToken) {
  const url = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${accountId}/conversations?fields=id&access_token=${accessToken}`;

  const response = await fetchWithRetry(url);
  const data = await response.json();

  if (!response.ok) {
    const errorInfo = parseMetaError(data);
    console.warn(`Messages count warning: ${errorInfo.message}`);
    return { count: 0, error: errorInfo.message };
  }

  return {
    count: data.data?.length || 0,
    // Note: This only returns conversations, not individual message count
    // Full message access requires additional API calls per conversation
  };
}

/**
 * Fetch all data for dashboard (combined endpoint)
 */
async function fetchDashboardData(accountId, accessToken) {
  // Fetch profile, insights, and media in parallel
  const [profile, insights, media] = await Promise.all([
    fetchProfile(accountId, accessToken),
    fetchInsights(accountId, accessToken).catch(err => {
      console.warn('Insights fetch failed:', err.message);
      return null;
    }),
    fetchMedia(accountId, accessToken, 12).catch(err => {
      console.warn('Media fetch failed:', err.message);
      return [];
    })
  ]);

  // Calculate engagement rate if we have the data
  let engagementRate = 0;
  if (profile.followers > 0 && insights?.totalInteractions) {
    engagementRate = (insights.totalInteractions / profile.followers) * 100;
  }

  // Sort media by engagement to get top posts
  const topPosts = [...media]
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 5);

  return {
    profile,
    insights: insights ? {
      ...insights,
      engagementRate: Math.round(engagementRate * 100) / 100
    } : null,
    media,
    topPosts
  };
}

// ==================== SYNC & HISTORY FUNCTIONS ====================

/**
 * Get today's date in São Paulo timezone (YYYY-MM-DD)
 */
function getTodayDate() {
  const now = new Date();
  // São Paulo is UTC-3
  const spTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
  return spTime.toISOString().split('T')[0];
}

/**
 * Fetch insights for a specific date range
 * @param {string} accountId - Instagram account ID
 * @param {string} accessToken - Meta access token
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {object|null} Insights data for that date
 */
async function fetchInsightsForDate(accountId, accessToken, dateStr) {
  // Convert date to Unix timestamps (start and end of day in UTC)
  const startDate = new Date(dateStr + 'T00:00:00Z');
  const endDate = new Date(dateStr + 'T23:59:59Z');
  const since = Math.floor(startDate.getTime() / 1000);
  const until = Math.floor(endDate.getTime() / 1000);

  const metrics = [
    'reach',
    'views',
    'profile_views',
    'website_clicks',
    'accounts_engaged',
    'total_interactions',
    'likes',
    'comments',
    'shares',
    'saves',
    'replies',
    'follows_and_unfollows',
    'profile_links_taps'
  ].join(',');

  const url = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${accountId}/insights?metric=${metrics}&period=day&metric_type=total_value&since=${since}&until=${until}&access_token=${accessToken}`;

  try {
    const response = await fetchWithRetry(url);
    const data = await response.json();

    if (!response.ok) {
      console.warn(`Insights fetch for ${dateStr} failed:`, data.error?.message);
      return null;
    }

    const insights = {};
    if (data.data && data.data.length > 0) {
      data.data.forEach(metric => {
        let value = 0;
        if (metric.values && metric.values.length > 0) {
          // Time-series format - sum all values for the day
          value = metric.values.reduce((sum, v) => sum + (v.value || 0), 0);
        } else if (metric.total_value !== undefined) {
          if (typeof metric.total_value === 'object' && metric.total_value.value !== undefined) {
            value = metric.total_value.value;
          }
        }
        insights[metric.name] = value;
      });
    }

    return {
      reach: insights.reach || 0,
      views: insights.views || 0,
      profileViews: insights.profile_views || 0,
      websiteClicks: insights.website_clicks || 0,
      accountsEngaged: insights.accounts_engaged || 0,
      totalInteractions: insights.total_interactions || 0,
      likes: insights.likes || 0,
      comments: insights.comments || 0,
      shares: insights.shares || 0,
      saves: insights.saves || 0,
      replies: insights.replies || 0,
      followsAndUnfollows: insights.follows_and_unfollows || 0,
      profileLinksTaps: insights.profile_links_taps || 0
    };
  } catch (error) {
    console.warn(`Error fetching insights for ${dateStr}:`, error.message);
    return null;
  }
}

/**
 * Backfill historical Instagram data
 * Fetches insights for past N days and stores in database
 * @param {number} days - Number of days to backfill (max 30 for Meta API)
 */
async function backfillInstagramAnalytics(days = 7) {
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
  const INSTAGRAM_ID = process.env.META_INSTAGRAM_ACCOUNT_ID;

  if (!ACCESS_TOKEN || !INSTAGRAM_ID) {
    throw new Error('Instagram API not configured');
  }

  const supabase = getSupabase();
  const results = [];

  // Get current profile data (followers count is current, not historical)
  const profile = await fetchProfile(INSTAGRAM_ID, ACCESS_TOKEN);

  console.log(`Backfilling Instagram data for last ${days} days...`);

  // Loop through each day (starting from yesterday, going back)
  for (let i = 1; i <= days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    console.log(`  Fetching data for ${dateStr}...`);

    const insights = await fetchInsightsForDate(INSTAGRAM_ID, ACCESS_TOKEN, dateStr);

    if (insights) {
      // Calculate engagement rate
      let engagementRate = 0;
      if (profile.followers > 0 && insights.totalInteractions) {
        engagementRate = (insights.totalInteractions / profile.followers) * 100;
      }

      const metricsRow = [{
        account_id: INSTAGRAM_ID,
        bucket_date: dateStr,
        followers: profile.followers, // Note: current followers, not historical
        following: profile.following,
        posts: profile.posts,
        reach: insights.reach,
        views: insights.views,
        profile_views: insights.profileViews,
        website_clicks: insights.websiteClicks,
        accounts_engaged: insights.accountsEngaged,
        total_interactions: insights.totalInteractions,
        likes: insights.likes,
        comments: insights.comments,
        shares: insights.shares,
        saves: insights.saves,
        replies: insights.replies,
        follows_and_unfollows: insights.followsAndUnfollows,
        profile_links_taps: insights.profileLinksTaps,
        engagement_rate: Math.round(engagementRate * 100) / 100
      }];

      const { error } = await supabase.rpc('upsert_instagram_daily_metrics', {
        p_data: metricsRow
      });

      if (error) {
        console.warn(`  Error saving ${dateStr}:`, error.message);
        results.push({ date: dateStr, success: false, error: error.message });
      } else {
        console.log(`  Saved ${dateStr}: reach=${insights.reach}, views=${insights.views}, interactions=${insights.totalInteractions}`);
        results.push({ date: dateStr, success: true, insights });
      }
    } else {
      results.push({ date: dateStr, success: false, error: 'No insights data' });
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return {
    daysProcessed: days,
    results,
    successCount: results.filter(r => r.success).length,
    failCount: results.filter(r => !r.success).length
  };
}

/**
 * Sync Instagram analytics to database
 * Creates a daily snapshot of profile and insights metrics
 */
async function syncInstagramAnalytics() {
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
  const INSTAGRAM_ID = process.env.META_INSTAGRAM_ACCOUNT_ID;

  if (!ACCESS_TOKEN || !INSTAGRAM_ID) {
    throw new Error('Instagram API not configured (META_ACCESS_TOKEN, META_INSTAGRAM_ACCOUNT_ID required)');
  }

  const supabase = getSupabase();
  const bucketDate = getTodayDate();

  console.log(`Syncing Instagram analytics for ${bucketDate}...`);

  // Fetch current data from Meta API
  const [profile, insights] = await Promise.all([
    fetchProfile(INSTAGRAM_ID, ACCESS_TOKEN),
    fetchInsights(INSTAGRAM_ID, ACCESS_TOKEN).catch(err => {
      console.warn('Insights fetch failed during sync:', err.message);
      return null;
    })
  ]);

  // Calculate engagement rate
  let engagementRate = 0;
  if (profile.followers > 0 && insights?.totalInteractions) {
    engagementRate = (insights.totalInteractions / profile.followers) * 100;
  }

  // Prepare row for database
  const metricsRow = [{
    account_id: INSTAGRAM_ID,
    bucket_date: bucketDate,
    // Profile metrics
    followers: profile.followers,
    following: profile.following,
    posts: profile.posts,
    // Core insights
    reach: insights?.reach || 0,
    views: insights?.views || 0,                    // NEW v24.0
    profile_views: insights?.profileViews || 0,
    website_clicks: insights?.websiteClicks || 0,
    accounts_engaged: insights?.accountsEngaged || 0,
    total_interactions: insights?.totalInteractions || 0,
    // Engagement breakdown
    likes: insights?.likes || 0,
    comments: insights?.comments || 0,
    shares: insights?.shares || 0,
    saves: insights?.saves || 0,
    replies: insights?.replies || 0,                // NEW v24.0
    // Growth & actions
    follows_and_unfollows: insights?.followsAndUnfollows || 0,
    profile_links_taps: insights?.profileLinksTaps || 0,
    // Computed
    engagement_rate: Math.round(engagementRate * 100) / 100
  }];

  // Upsert to database
  const { data, error } = await supabase.rpc('upsert_instagram_daily_metrics', {
    p_data: metricsRow
  });

  if (error) throw error;

  // Update last sync timestamp
  await supabase
    .from('app_settings')
    .update({ instagram_last_sync: new Date().toISOString() })
    .eq('id', 'default');

  console.log(`Instagram analytics synced for ${bucketDate}`);

  return {
    date: bucketDate,
    metrics: metricsRow[0],
    rowsUpserted: data || 1
  };
}

/**
 * Get historical metrics from database
 * @param {number|null} days - Number of days to fetch, or null for all data
 */
async function getHistoricalMetrics(days = 30) {
  const supabase = getSupabase();
  const INSTAGRAM_ID = process.env.META_INSTAGRAM_ACCOUNT_ID;

  let query = supabase
    .from('instagram_metrics_with_growth')
    .select('*')
    .eq('account_id', INSTAGRAM_ID);

  // If days is specified (not null), filter by date
  if (days !== null) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    query = query.gte('bucket_date', fromDate.toISOString().split('T')[0]);
  }

  const { data, error } = await query.order('bucket_date', { ascending: true });

  if (error) throw error;

  return data || [];
}

// ==================== CORS CONFIGURATION ====================

const ALLOWED_ORIGINS = [
  'https://bilavnova.com',
  'https://www.bilavnova.com',
  'https://localhost',           // Capacitor Android
  'capacitor://localhost',       // Capacitor iOS
  'http://localhost:5173',       // Local dev (Vite)
  'http://localhost:5174',       // Local dev alt port
  'http://localhost:8888'        // Netlify dev
];

function getCorsOrigin(event) {
  const origin = event.headers.origin || event.headers.Origin || '';
  // Allow all Capacitor and localhost origins
  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  // Default to production for non-matching origins
  return 'https://www.bilavnova.com';
}

// Validate API key from request header
function validateApiKey(event) {
  const apiKey = event.headers['x-api-key'] || event.headers['X-Api-Key'];
  const API_SECRET = process.env.API_SECRET_KEY;
  if (!API_SECRET) {
    console.error('SECURITY: API_SECRET_KEY not configured. All requests denied.');
    return false;
  }
  return apiKey === API_SECRET;
}

// ==================== MAIN HANDLER ====================

exports.handler = async (event, context) => {
  // Allow internal calls from campaign-scheduler (no event headers)
  const isScheduledCall = event.httpMethod === undefined;

  const corsOrigin = getCorsOrigin(event);
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // API key authentication (skip for scheduled/internal calls)
  if (!isScheduledCall && !validateApiKey(event)) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
  const INSTAGRAM_ID = process.env.META_INSTAGRAM_ACCOUNT_ID;

  if (!ACCESS_TOKEN || !INSTAGRAM_ID) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Instagram API not configured (META_ACCESS_TOKEN, META_INSTAGRAM_ACCOUNT_ID required)' })
    };
  }

  // Parse query parameters
  const params = event.queryStringParameters || {};
  const action = params.action || 'dashboard';

  try {
    switch (action) {
      case 'profile': {
        const profile = await fetchProfile(INSTAGRAM_ID, ACCESS_TOKEN);
        return {
          statusCode: 200,
          headers: { ...headers, 'Cache-Control': 'private, max-age=3600' },
          body: JSON.stringify({ profile })
        };
      }

      case 'insights': {
        const insights = await fetchInsights(INSTAGRAM_ID, ACCESS_TOKEN);
        return {
          statusCode: 200,
          headers: { ...headers, 'Cache-Control': 'private, max-age=14400' },
          body: JSON.stringify({ insights })
        };
      }

      case 'media': {
        const limit = parseInt(params.limit || '25', 10);
        const media = await fetchMedia(INSTAGRAM_ID, ACCESS_TOKEN, Math.min(limit, 50));
        return {
          statusCode: 200,
          headers: { ...headers, 'Cache-Control': 'private, max-age=3600' },
          body: JSON.stringify({ media })
        };
      }

      case 'media-insights': {
        const mediaId = params.mediaId;
        if (!mediaId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'mediaId parameter required' })
          };
        }
        const mediaInsights = await fetchMediaInsights(mediaId, ACCESS_TOKEN);
        return {
          statusCode: 200,
          headers: { ...headers, 'Cache-Control': 'private, max-age=3600' },
          body: JSON.stringify({ insights: mediaInsights })
        };
      }

      case 'comments': {
        const limit = parseInt(params.limit || '50', 10);
        const comments = await fetchRecentComments(INSTAGRAM_ID, ACCESS_TOKEN, Math.min(limit, 100));
        return {
          statusCode: 200,
          headers: { ...headers, 'Cache-Control': 'private, max-age=1800' },
          body: JSON.stringify({ comments })
        };
      }

      case 'messages-count': {
        const messagesData = await fetchMessagesCount(INSTAGRAM_ID, ACCESS_TOKEN);
        return {
          statusCode: 200,
          headers: { ...headers, 'Cache-Control': 'private, max-age=1800' },
          body: JSON.stringify({ messages: messagesData })
        };
      }

      case 'sync': {
        // Sync current metrics to database
        console.log('Manual Instagram sync triggered');
        const syncResult = await syncInstagramAnalytics();
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            ...syncResult
          })
        };
      }

      case 'backfill': {
        // Backfill historical data from Meta API
        const days = parseInt(params.days || '7', 10);
        const maxDays = Math.min(days, 30); // Meta API limit
        console.log(`Backfill requested for ${maxDays} days`);
        const backfillResult = await backfillInstagramAnalytics(maxDays);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            ...backfillResult
          })
        };
      }

      case 'history': {
        // Get historical metrics from database
        // 'all' or null = fetch all data, otherwise limit to specified days
        const daysParam = params.days;
        const days = (daysParam === 'all' || daysParam === 'null' || daysParam === null)
          ? null
          : parseInt(daysParam || '30', 10);
        const history = await getHistoricalMetrics(days);

        // Calculate summary stats
        const summary = history.length > 0 ? {
          currentFollowers: history[history.length - 1]?.followers || 0,
          startFollowers: history[0]?.followers || 0,
          totalGrowth: (history[history.length - 1]?.followers || 0) - (history[0]?.followers || 0),
          avgReach: Math.round(history.reduce((sum, d) => sum + (d.reach || 0), 0) / history.length),
          avgEngagement: Math.round(history.reduce((sum, d) => sum + (d.engagement_rate || 0), 0) / history.length * 100) / 100,
          daysTracked: history.length
        } : null;

        return {
          statusCode: 200,
          headers: { ...headers, 'Cache-Control': 'private, max-age=3600' },
          body: JSON.stringify({
            history,
            summary,
            count: history.length
          })
        };
      }

      case 'status': {
        // Get sync status
        const supabase = getSupabase();
        const { data: settings } = await supabase
          .from('app_settings')
          .select('instagram_last_sync')
          .eq('id', 'default')
          .single();

        const { count } = await supabase
          .from('instagram_daily_metrics')
          .select('*', { count: 'exact', head: true });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            lastSync: settings?.instagram_last_sync,
            recordCount: count
          })
        };
      }

      case 'dashboard':
      default: {
        // Combined dashboard data
        const dashboardData = await fetchDashboardData(INSTAGRAM_ID, ACCESS_TOKEN);
        return {
          statusCode: 200,
          headers: { ...headers, 'Cache-Control': 'private, max-age=3600' },
          body: JSON.stringify({
            ...dashboardData,
            fetchedAt: new Date().toISOString()
          })
        };
      }
    }
  } catch (error) {
    console.error('Instagram Analytics API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Instagram analytics temporarily unavailable'
      })
    };
  }
};

/**
 * Exported for use by campaign-scheduler.js
 */
exports.syncInstagramAnalytics = syncInstagramAnalytics;
