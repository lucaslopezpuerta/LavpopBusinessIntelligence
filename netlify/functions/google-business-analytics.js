// netlify/functions/google-business-analytics.js
// Google Business Profile Analytics API
//
// v1.2 (2025-12-19): Restored app_settings sync tracking
//   - Uses app_settings.gbp_last_sync for sync timestamp
//   - Cache discovered location ID in app_settings.gbp_location_id
// v1.1 (2025-12-19): Auto-discovery and bug fixes
//   - Auto-discover location ID when not configured or using Place ID
//   - Better error handling for missing accounts/locations
// v1.0 (2025-12-19): Initial implementation
//   - OAuth 2.0 flow with token storage in Supabase
//   - Profile data: business name, address, hours, rating
//   - Reviews: list with pagination, reply capability
//   - Performance metrics: views, searches, actions
//   - Historical tracking with Supabase storage
//
// Environment variables required:
// - GOOGLE_CLIENT_ID: OAuth Client ID
// - GOOGLE_CLIENT_SECRET: OAuth Client Secret
// - GOOGLE_REDIRECT_URI: OAuth callback URL
// - GBP_ACCOUNT_ID: Google Business Account ID (optional, auto-detected)
// - GBP_LOCATION_ID: Google Business Location ID
// - SUPABASE_URL: Supabase project URL
// - SUPABASE_SERVICE_KEY: Supabase service role key

const { createClient } = require('@supabase/supabase-js');

// ==================== CONFIGURATION ====================

const CONFIG = {
  // Google API endpoints
  OAUTH_TOKEN_URL: 'https://oauth2.googleapis.com/token',
  OAUTH_AUTH_URL: 'https://accounts.google.com/o/oauth2/v2/auth',
  ACCOUNT_API_BASE: 'https://mybusinessaccountmanagement.googleapis.com/v1',
  GBP_API_BASE: 'https://mybusinessbusinessinformation.googleapis.com/v1',
  PERFORMANCE_API_BASE: 'https://businessprofileperformance.googleapis.com/v1',

  // OAuth settings
  SCOPES: 'https://www.googleapis.com/auth/business.manage',

  // Cache durations (seconds)
  CACHE_PROFILE: 3600,      // 1 hour
  CACHE_REVIEWS: 1800,      // 30 minutes
  CACHE_METRICS: 14400,     // 4 hours
};

// ==================== CORS HEADERS ====================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// ==================== SUPABASE CLIENT ====================

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
}

// ==================== OAUTH TOKEN MANAGEMENT ====================

/**
 * Get a valid access token, refreshing if necessary
 */
async function getValidAccessToken() {
  const supabase = getSupabase();

  // Fetch stored tokens
  const { data: tokens, error } = await supabase
    .from('google_oauth_tokens')
    .select('*')
    .eq('id', 'gbp_default')
    .single();

  if (error || !tokens) {
    throw new Error('OAuth not configured. Visit the dashboard to connect Google Business Profile.');
  }

  // Check if token is expired (with 5 min buffer)
  const expiresAt = new Date(tokens.expires_at);
  const now = new Date();
  const bufferMs = 5 * 60 * 1000; // 5 minutes

  if (expiresAt <= new Date(now.getTime() + bufferMs)) {
    // Token expired or expiring soon - refresh it
    console.log('GBP: Access token expired, refreshing...');
    return await refreshAccessToken(tokens.refresh_token);
  }

  return tokens.access_token;
}

/**
 * Refresh the access token using the refresh token
 */
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
    console.error('GBP: Token refresh failed:', error);
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

  console.log('GBP: Access token refreshed successfully');
  return data.access_token;
}

// ==================== API HELPERS ====================

/**
 * Fetch from Google API with authentication
 */
async function fetchGoogleAPI(url, accessToken, options = {}) {
  console.log(`GBP API call: ${options.method || 'GET'} ${url}`);

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  console.log(`GBP API response: ${response.status} ${response.statusText}`);

  // Check content type to handle HTML error pages
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    console.error(`GBP API returned non-JSON (${response.status}):`, text.substring(0, 500));

    // Common causes of HTML responses
    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
      if (response.status === 404) {
        throw new Error(`API endpoint not found (404). The location ID may be invalid or Performance API quota is 0. Check Quotas in Google Cloud Console.`);
      }
      if (response.status === 403) {
        throw new Error(`Access denied (403). Request API access at: https://developers.google.com/my-business/content/prereqs#request-access`);
      }
      throw new Error(`Google API returned HTML error page (HTTP ${response.status}). Check API quotas and access permissions.`);
    }
    throw new Error(`Unexpected response format from Google API: ${response.status}`);
  }

  const data = await response.json();

  if (!response.ok) {
    console.error(`GBP API error: ${response.status}`, JSON.stringify(data));
    throw new Error(data.error?.message || `Google API error: ${response.status}`);
  }

  return data;
}

/**
 * Convert Google star rating string to number
 */
function parseStarRating(rating) {
  const ratingMap = {
    'ONE': 1,
    'TWO': 2,
    'THREE': 3,
    'FOUR': 4,
    'FIVE': 5
  };
  return ratingMap[rating] || 0;
}

// ==================== GBP API FUNCTIONS ====================

/**
 * Get list of accounts
 */
async function getAccounts(accessToken) {
  const url = `${CONFIG.ACCOUNT_API_BASE}/accounts`;
  return fetchGoogleAPI(url, accessToken);
}

/**
 * Get list of locations for an account
 */
async function getLocations(accessToken, accountName) {
  const url = `${CONFIG.GBP_API_BASE}/${accountName}/locations`;
  return fetchGoogleAPI(url, accessToken);
}

/**
 * Get location details
 */
async function getLocationDetails(accessToken, locationName) {
  const readMask = 'name,title,phoneNumbers,categories,storefrontAddress,websiteUri,regularHours,specialHours,profile,metadata,latlng';
  const url = `${CONFIG.GBP_API_BASE}/${locationName}?readMask=${readMask}`;
  return fetchGoogleAPI(url, accessToken);
}

/**
 * Get reviews for a location
 */
async function getReviews(accessToken, locationName, pageSize = 20, pageToken = null) {
  let url = `${CONFIG.GBP_API_BASE}/${locationName}/reviews?pageSize=${pageSize}`;
  if (pageToken) url += `&pageToken=${pageToken}`;
  return fetchGoogleAPI(url, accessToken);
}

/**
 * Reply to a review
 */
async function replyToReview(accessToken, reviewName, comment) {
  const url = `${CONFIG.GBP_API_BASE}/${reviewName}/reply`;
  return fetchGoogleAPI(url, accessToken, {
    method: 'PUT',
    body: JSON.stringify({ comment })
  });
}

/**
 * Delete a review reply
 */
async function deleteReviewReply(accessToken, reviewName) {
  const url = `${CONFIG.GBP_API_BASE}/${reviewName}/reply`;
  return fetchGoogleAPI(url, accessToken, { method: 'DELETE' });
}

/**
 * Get performance metrics (daily time series)
 */
async function getPerformanceMetrics(accessToken, locationName, startDate, endDate) {
  const url = `${CONFIG.PERFORMANCE_API_BASE}/${locationName}:getDailyMetricsTimeSeries`;

  const body = {
    dailyMetrics: [
      'BUSINESS_IMPRESSIONS_DESKTOP_MAPS',
      'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH',
      'BUSINESS_IMPRESSIONS_MOBILE_MAPS',
      'BUSINESS_IMPRESSIONS_MOBILE_SEARCH',
      'BUSINESS_DIRECTION_REQUESTS',
      'CALL_CLICKS',
      'WEBSITE_CLICKS'
    ],
    dailyRange: {
      startDate: {
        year: startDate.getFullYear(),
        month: startDate.getMonth() + 1,
        day: startDate.getDate()
      },
      endDate: {
        year: endDate.getFullYear(),
        month: endDate.getMonth() + 1,
        day: endDate.getDate()
      }
    }
  };

  return fetchGoogleAPI(url, accessToken, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

// ==================== DATA TRANSFORMATION ====================

/**
 * Transform location data for frontend
 */
function transformLocationData(location) {
  const address = location.storefrontAddress || {};
  const addressLines = address.addressLines || [];

  return {
    name: location.name,
    title: location.title || 'Unknown Business',
    phone: location.phoneNumbers?.primaryPhone || null,
    website: location.websiteUri || null,
    address: {
      lines: addressLines,
      city: address.locality || '',
      state: address.administrativeArea || '',
      postalCode: address.postalCode || '',
      country: address.regionCode || 'BR',
      formatted: addressLines.join(', ') + (address.locality ? `, ${address.locality}` : '')
    },
    categories: location.categories?.primaryCategory?.displayName || null,
    regularHours: location.regularHours?.periods || [],
    latlng: location.latlng || null,
    metadata: location.metadata || {}
  };
}

/**
 * Transform review data for frontend
 */
function transformReviewData(review) {
  return {
    name: review.name,
    reviewId: review.reviewId,
    reviewer: {
      displayName: review.reviewer?.displayName || 'Anonymous',
      profilePhotoUrl: review.reviewer?.profilePhotoUrl || null
    },
    starRating: parseStarRating(review.starRating),
    comment: review.comment || '',
    createTime: review.createTime,
    updateTime: review.updateTime,
    reply: review.reviewReply ? {
      comment: review.reviewReply.comment,
      updateTime: review.reviewReply.updateTime
    } : null
  };
}

/**
 * Transform metrics data into daily records
 */
function transformMetricsData(metricsResponse, locationId) {
  const dailyData = {};

  // Process each metric time series
  if (metricsResponse.timeSeries) {
    metricsResponse.timeSeries.forEach(series => {
      const metricName = series.dailyMetric;

      if (series.dailySubEntityType?.dayOfWeek) {
        // Skip day-of-week breakdowns for now
        return;
      }

      (series.timeSeries?.datedValues || []).forEach(dv => {
        const dateKey = `${dv.date.year}-${String(dv.date.month).padStart(2, '0')}-${String(dv.date.day).padStart(2, '0')}`;

        if (!dailyData[dateKey]) {
          dailyData[dateKey] = {
            location_id: locationId,
            bucket_date: dateKey,
            views_maps: 0,
            views_search: 0,
            actions_website: 0,
            actions_phone: 0,
            actions_driving_directions: 0
          };
        }

        const value = parseInt(dv.value || '0', 10);

        switch (metricName) {
          case 'BUSINESS_IMPRESSIONS_DESKTOP_MAPS':
          case 'BUSINESS_IMPRESSIONS_MOBILE_MAPS':
            dailyData[dateKey].views_maps += value;
            break;
          case 'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH':
          case 'BUSINESS_IMPRESSIONS_MOBILE_SEARCH':
            dailyData[dateKey].views_search += value;
            break;
          case 'WEBSITE_CLICKS':
            dailyData[dateKey].actions_website += value;
            break;
          case 'CALL_CLICKS':
            dailyData[dateKey].actions_phone += value;
            break;
          case 'BUSINESS_DIRECTION_REQUESTS':
            dailyData[dateKey].actions_driving_directions += value;
            break;
        }
      });
    });
  }

  return Object.values(dailyData);
}

// ==================== SYNC FUNCTIONS ====================

/**
 * Sync metrics from Google API to database
 */
async function syncMetricsToDatabase(accessToken, locationName, locationId, days = 30) {
  const supabase = getSupabase();

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  console.log(`GBP: Syncing metrics from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

  // Fetch metrics from Google
  const metricsResponse = await getPerformanceMetrics(accessToken, locationName, startDate, endDate);

  // Transform to daily records
  const dailyRecords = transformMetricsData(metricsResponse, locationId);

  if (dailyRecords.length === 0) {
    console.log('GBP: No metrics data to sync');
    return { synced: 0 };
  }

  // Upsert to database
  const { error } = await supabase
    .from('google_business_daily_metrics')
    .upsert(dailyRecords, { onConflict: 'location_id,bucket_date' });

  if (error) {
    console.error('GBP: Database sync error:', error);
    throw new Error(`Database sync failed: ${error.message}`);
  }

  // Update last sync time in app_settings
  await supabase
    .from('app_settings')
    .update({
      gbp_last_sync: new Date().toISOString(),
      gbp_location_id: locationId,
      updated_at: new Date().toISOString()
    })
    .eq('id', 1);

  console.log(`GBP: Synced ${dailyRecords.length} daily records`);
  return { synced: dailyRecords.length };
}

/**
 * Sync reviews to database
 */
async function syncReviewsToDatabase(accessToken, locationName, locationId) {
  const supabase = getSupabase();

  // Fetch all reviews (paginated)
  let allReviews = [];
  let pageToken = null;

  do {
    const response = await getReviews(accessToken, locationName, 50, pageToken);
    const reviews = (response.reviews || []).map(r => ({
      location_id: locationId,
      review_id: r.name,
      reviewer_name: r.reviewer?.displayName || 'Anonymous',
      reviewer_photo_url: r.reviewer?.profilePhotoUrl || null,
      star_rating: parseStarRating(r.starRating),
      comment: r.comment || '',
      create_time: r.createTime,
      update_time: r.updateTime || null,
      reply_comment: r.reviewReply?.comment || null,
      reply_update_time: r.reviewReply?.updateTime || null
    }));

    allReviews = allReviews.concat(reviews);
    pageToken = response.nextPageToken;
  } while (pageToken);

  if (allReviews.length === 0) {
    return { synced: 0 };
  }

  // Upsert to database
  const { error } = await supabase
    .from('google_business_reviews')
    .upsert(allReviews, { onConflict: 'review_id' });

  if (error) {
    console.error('GBP: Reviews sync error:', error);
    throw new Error(`Reviews sync failed: ${error.message}`);
  }

  console.log(`GBP: Synced ${allReviews.length} reviews`);
  return { synced: allReviews.length };
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
    const locationId = process.env.GBP_LOCATION_ID;

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

        // Return JSON with auth URL for frontend to redirect
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ authUrl: authUrl.toString() })
        };
      }

      case 'oauth-callback': {
        const { code, error: oauthError } = params;

        if (oauthError) {
          console.error('GBP OAuth error:', oauthError);
          return {
            statusCode: 302,
            headers: { ...corsHeaders, Location: '/social?tab=google&error=' + encodeURIComponent(oauthError) },
            body: ''
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
          console.error('GBP Token exchange failed:', error);
          return {
            statusCode: 302,
            headers: { ...corsHeaders, Location: '/social?tab=google&error=token_exchange_failed' },
            body: ''
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

        console.log('GBP: OAuth tokens stored successfully');

        // Redirect to dashboard with success
        return {
          statusCode: 302,
          headers: { ...corsHeaders, Location: '/social?tab=google&oauth=success' },
          body: ''
        };
      }

      case 'oauth-status': {
        const supabase = getSupabase();
        const { data: tokens } = await supabase
          .from('google_oauth_tokens')
          .select('expires_at, updated_at')
          .eq('id', 'gbp_default')
          .single();

        const hasValidTokens = !!tokens && !!tokens.expires_at;

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            authenticated: hasValidTokens,
            configured: hasValidTokens,
            expiresAt: tokens?.expires_at,
            updatedAt: tokens?.updated_at
          })
        };
      }

      // ==================== DATA ACTIONS ====================

      case 'dashboard': {
        const accessToken = await getValidAccessToken();

        // Auto-discover location if not properly configured
        let resolvedLocationId = locationId;
        let resolvedLocationName;

        if (!locationId || locationId.startsWith('ChIJ')) {
          console.log('GBP: Location ID not configured or is a Place ID, attempting auto-discovery...');

          const accountsData = await getAccounts(accessToken);
          const accounts = accountsData.accounts || [];

          if (accounts.length === 0) {
            return {
              statusCode: 200,
              headers: corsHeaders,
              body: JSON.stringify({
                profile: null,
                reviews: [],
                totalReviewCount: 0,
                averageRating: 0,
                history: [],
                lastSync: null,
                needsSetup: true,
                error: 'No Google Business Profile accounts found'
              })
            };
          }

          const firstAccount = accounts[0];
          const locationsData = await getLocations(accessToken, firstAccount.name);
          const locations = locationsData.locations || [];

          if (locations.length === 0) {
            return {
              statusCode: 200,
              headers: corsHeaders,
              body: JSON.stringify({
                profile: null,
                reviews: [],
                totalReviewCount: 0,
                averageRating: 0,
                history: [],
                lastSync: null,
                needsSetup: true,
                error: 'No locations found in your account'
              })
            };
          }

          resolvedLocationName = locations[0].name;
          resolvedLocationId = resolvedLocationName.replace('locations/', '');
          console.log(`GBP: Auto-discovered location: ${resolvedLocationName}`);
        } else {
          resolvedLocationName = `locations/${resolvedLocationId}`;
        }

        // Fetch profile and reviews in parallel
        const [locationData, reviewsData] = await Promise.all([
          getLocationDetails(accessToken, resolvedLocationName).catch(err => {
            console.warn('GBP: Location fetch failed:', err.message);
            return null;
          }),
          getReviews(accessToken, resolvedLocationName, 10).catch(err => {
            console.warn('GBP: Reviews fetch failed:', err.message);
            return { reviews: [], totalReviewCount: 0, averageRating: 0 };
          })
        ]);

        // Get historical data and settings from database
        const supabase = getSupabase();
        const [historyResult, settingsResult] = await Promise.all([
          supabase
            .from('google_business_daily_metrics')
            .select('*')
            .eq('location_id', resolvedLocationId)
            .order('bucket_date', { ascending: false })
            .limit(30),
          supabase
            .from('app_settings')
            .select('gbp_last_sync')
            .eq('id', 1)
            .single()
        ]);

        const history = historyResult.data || [];
        const lastSync = settingsResult.data?.gbp_last_sync || null;

        // Transform reviews
        const reviews = (reviewsData.reviews || []).map(transformReviewData);

        return {
          statusCode: 200,
          headers: {
            ...corsHeaders,
            'Cache-Control': `public, max-age=${CONFIG.CACHE_PROFILE}`
          },
          body: JSON.stringify({
            profile: locationData ? transformLocationData(locationData) : null,
            reviews,
            totalReviewCount: reviewsData.totalReviewCount || reviews.length,
            averageRating: reviewsData.averageRating || 0,
            history,
            lastSync,
            locationId: resolvedLocationId
          })
        };
      }

      case 'profile': {
        const accessToken = await getValidAccessToken();
        const locationName = `locations/${locationId}`;
        const locationData = await getLocationDetails(accessToken, locationName);

        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Cache-Control': `public, max-age=${CONFIG.CACHE_PROFILE}` },
          body: JSON.stringify(transformLocationData(locationData))
        };
      }

      case 'reviews': {
        const accessToken = await getValidAccessToken();
        const locationName = `locations/${locationId}`;
        const pageSize = parseInt(params.pageSize) || 20;
        const pageToken = params.pageToken || null;

        const data = await getReviews(accessToken, locationName, pageSize, pageToken);
        const reviews = (data.reviews || []).map(transformReviewData);

        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Cache-Control': `public, max-age=${CONFIG.CACHE_REVIEWS}` },
          body: JSON.stringify({
            reviews,
            nextPageToken: data.nextPageToken,
            totalReviewCount: data.totalReviewCount,
            averageRating: data.averageRating
          })
        };
      }

      case 'reply': {
        if (event.httpMethod !== 'POST') {
          return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Method not allowed. Use POST.' })
          };
        }

        const body = JSON.parse(event.body || '{}');
        const { reviewName, comment } = body;

        if (!reviewName || !comment) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'reviewName and comment are required' })
          };
        }

        const accessToken = await getValidAccessToken();
        const result = await replyToReview(accessToken, reviewName, comment);

        // Update review in database
        const supabase = getSupabase();
        await supabase
          .from('google_business_reviews')
          .update({
            reply_comment: comment,
            reply_update_time: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('review_id', reviewName);

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ success: true, reply: result })
        };
      }

      case 'sync': {
        const accessToken = await getValidAccessToken();
        const days = parseInt(params.days) || 30;

        // Auto-discover location if not properly configured
        let resolvedLocationId = locationId;
        let resolvedLocationName;

        if (!locationId || locationId.startsWith('ChIJ')) {
          // Location ID is missing or is a Place ID - need to discover
          console.log('GBP: Location ID not configured or is a Place ID, attempting auto-discovery...');

          const accountsData = await getAccounts(accessToken);
          const accounts = accountsData.accounts || [];

          if (accounts.length === 0) {
            throw new Error('No Google Business Profile accounts found. Please verify you have access to a Business Profile.');
          }

          // Get first account's locations
          const firstAccount = accounts[0];
          console.log(`GBP: Found account: ${firstAccount.name}`);

          const locationsData = await getLocations(accessToken, firstAccount.name);
          const locations = locationsData.locations || [];

          if (locations.length === 0) {
            throw new Error('No locations found in your Google Business Profile account.');
          }

          // Use first location
          resolvedLocationName = locations[0].name;
          resolvedLocationId = resolvedLocationName.replace('locations/', '');
          console.log(`GBP: Auto-discovered location: ${resolvedLocationName}`);
        } else {
          resolvedLocationName = `locations/${resolvedLocationId}`;
        }

        // Sync metrics and reviews
        const [metricsResult, reviewsResult] = await Promise.all([
          syncMetricsToDatabase(accessToken, resolvedLocationName, resolvedLocationId, days),
          syncReviewsToDatabase(accessToken, resolvedLocationName, resolvedLocationId)
        ]);

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            success: true,
            metricsSynced: metricsResult.synced,
            reviewsSynced: reviewsResult.synced,
            locationId: resolvedLocationId,
            syncedAt: new Date().toISOString()
          })
        };
      }

      case 'history': {
        const supabase = getSupabase();
        const days = params.days === 'all' ? null : parseInt(params.days) || 30;

        let query = supabase
          .from('google_business_daily_metrics')
          .select('*')
          .eq('location_id', locationId)
          .order('bucket_date', { ascending: false });

        if (days) {
          const fromDate = new Date();
          fromDate.setDate(fromDate.getDate() - days);
          query = query.gte('bucket_date', fromDate.toISOString().split('T')[0]);
        }

        const { data, error } = await query;

        if (error) {
          throw new Error(`Database query failed: ${error.message}`);
        }

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ history: data || [] })
        };
      }

      case 'status': {
        const supabase = getSupabase();

        const [settingsResult, tokensResult, metricsResult] = await Promise.all([
          supabase.from('app_settings').select('gbp_last_sync, gbp_location_id').eq('id', 1).single(),
          supabase.from('google_oauth_tokens').select('expires_at, updated_at').eq('id', 'gbp_default').single(),
          supabase.from('google_business_daily_metrics').select('bucket_date').order('bucket_date', { ascending: false }).limit(1)
        ]);

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            lastSync: settingsResult.data?.gbp_last_sync,
            locationId: settingsResult.data?.gbp_location_id,
            oauthConfigured: !!tokensResult.data,
            tokenExpiresAt: tokensResult.data?.expires_at,
            latestMetricDate: metricsResult.data?.[0]?.bucket_date
          })
        };
      }

      // ==================== DISCOVERY ACTIONS ====================

      case 'accounts': {
        // List available accounts (for setup/debugging)
        const accessToken = await getValidAccessToken();
        const accounts = await getAccounts(accessToken);

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(accounts)
        };
      }

      case 'locations': {
        // List locations for an account (for setup/debugging)
        const accessToken = await getValidAccessToken();
        const accountId = params.accountId || process.env.GBP_ACCOUNT_ID;

        if (!accountId) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'accountId required' })
          };
        }

        const locations = await getLocations(accessToken, `accounts/${accountId}`);

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(locations)
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

    // Check for OAuth-related errors
    if (error.message.includes('OAuth not configured') || error.message.includes('Token refresh failed')) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({
          error: error.message,
          oauthRequired: true,
          oauthInitUrl: '/.netlify/functions/google-business-analytics?action=oauth-init'
        })
      };
    }

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// ==================== EXPORTED FUNCTIONS ====================

/**
 * Sync function for scheduled jobs (campaign-scheduler.js)
 */
async function syncGoogleBusinessAnalytics() {
  const locationId = process.env.GBP_LOCATION_ID;

  if (!locationId) {
    console.log('GBP: No location ID configured, skipping sync');
    return { skipped: true };
  }

  try {
    const accessToken = await getValidAccessToken();
    const locationName = `locations/${locationId}`;

    const [metricsResult, reviewsResult] = await Promise.all([
      syncMetricsToDatabase(accessToken, locationName, locationId, 7),
      syncReviewsToDatabase(accessToken, locationName, locationId)
    ]);

    return {
      success: true,
      metricsSynced: metricsResult.synced,
      reviewsSynced: reviewsResult.synced
    };
  } catch (error) {
    console.error('GBP scheduled sync error:', error);
    return { success: false, error: error.message };
  }
}

module.exports.syncGoogleBusinessAnalytics = syncGoogleBusinessAnalytics;
