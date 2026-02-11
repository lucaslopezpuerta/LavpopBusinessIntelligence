// netlify/functions/waba-analytics.js
// WhatsApp Business API Analytics - Meta Graph API integration
//
// v2.0 (2026-02-09): Remove Meta template analytics (replaced by Twilio webhook data)
//   - Removed: syncTemplateAnalytics(), fetchAllTemplateAnalytics(), fetchMessageTemplates()
//   - Removed: ensureInsightsEnabled(), normalizeTemplateData(), normalizeTemplateAnalyticsData()
//   - Removed: sync-templates and enable-insights action handlers
//   - Removed: syncWabaTemplateAnalytics export (campaign-scheduler no longer calls it)
//   - Removed: waba_template_last_sync from status response
//   - Template read/delivery metrics now come from twilio_template_performance view
//     (SQL view on webhook_events + automation_rules — see migration 065)
//   - Stale Meta objects dropped: waba_templates, waba_template_analytics, waba_template_analytics_view
//
// v1.6 (2026-02-09): Fix critical Meta API parameter bugs + protect existing data
//
// v1.5 (2026-02-09): Fix template analytics data gap
//   - Widened sync window from 3 days to 30 days (Meta has processing delays)
//   - Fixed timezone mismatch: template analytics now uses epochToLocalDate() (São Paulo)
//     instead of epochToUtcDate() (UTC) to align with message analytics
//   - Added structured diagnostic logging for template_analytics response
//
// v1.4 (2025-12-18): Profile caching for faster loads
//   - Added Cache-Control header to profile endpoint (1 hour, like Instagram)
//   - Reduces redundant Meta API calls on page refresh
// v1.3 (2025-12-18): Business profile fetching
//   - Added fetchBusinessProfile to get WABA profile data
//   - Returns: verified_name, quality_rating, messaging_limit_tier, profile_picture_url, about
//   - Used for ProfileHeader component similar to Instagram
//
// v1.2 (2025-12-18): Per-template analytics with READ metrics
//   - Added template sync functions to fetch template list and per-template analytics
//   - READ metrics now available via per-template analytics (not at account level)
//   - Caches templates in waba_templates table for UI display
//   - Per-template metrics stored in waba_template_analytics table
//
// v1.1 (2025-12-17): Production cleanup
//   - Message analytics: sent, delivered metrics from Meta API
//   - Note: Read metrics not available at account level (only per-template)
//   - Note: Conversation costs not returned by Meta API for this account
//
// Environment variables required:
// - META_ACCESS_TOKEN: Meta Graph API access token
// - META_WABA_ID: WhatsApp Business Account ID
// - SUPABASE_URL: Supabase project URL
// - SUPABASE_SERVICE_KEY: Supabase service role key

const { createClient } = require('@supabase/supabase-js');

const GRAPH_API_VERSION = 'v24.0';
const GRAPH_API_BASE = 'https://graph.facebook.com';

// Granularity for message analytics endpoint
const MSG_GRANULARITY = 'DAY';

// Business timezone for date bucket alignment
const BUSINESS_TIMEZONE = 'America/Sao_Paulo';

/**
 * Convert epoch seconds to local date string (YYYY-MM-DD) in business timezone
 * Avoids UTC day-shift issues for São Paulo (UTC-3)
 */
function epochToLocalDate(epochSeconds) {
  const date = new Date(epochSeconds * 1000);
  // Format in São Paulo timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(date); // Returns YYYY-MM-DD
}

// Initialize Supabase client
function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(url, key);
}

// Retry fetch with exponential backoff
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Handle rate limiting (429)
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10);
        console.warn(`Rate limited. Waiting ${retryAfter}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }

      // Handle server errors (5xx) with retry
      if (response.status >= 500) {
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.warn(`Server error ${response.status}. Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;
      const waitTime = Math.pow(2, attempt) * 1000;
      console.warn(`Fetch error: ${error.message}. Retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

// Parse Meta Graph API error response
function parseMetaError(errorData) {
  const error = errorData.error || {};
  return {
    message: error.message || 'Unknown Meta API error',
    code: error.code,
    subcode: error.error_subcode,
    fbtrace_id: error.fbtrace_id,
    type: error.type
  };
}



/**
 * Fetch message analytics (sent, delivered)
 * Note: READ metrics not available at account level (only per-template)
 */
async function fetchMessageAnalytics(start, end, wabaId, accessToken) {
  const fields = `analytics.start(${start}).end(${end}).granularity(${MSG_GRANULARITY}).metrics(["SENT","DELIVERED"])`;
  const url = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${wabaId}?fields=${encodeURIComponent(fields)}&access_token=${accessToken}`;

  const response = await fetchWithRetry(url);
  const data = await response.json();

  if (!response.ok) {
    const errorInfo = parseMetaError(data);
    throw new Error(`Meta API error: ${errorInfo.message} (code: ${errorInfo.code}, fbtrace_id: ${errorInfo.fbtrace_id})`);
  }

  return data.analytics || null;
}

/**
 * Normalize message analytics response to database rows
 */
function normalizeMessageData(analyticsData, wabaId, phoneNumberId) {
  if (!analyticsData) return [];

  const dataArray = analyticsData.data_points || analyticsData.data || [];
  if (dataArray.length === 0) return [];

  return dataArray.map(dataPoint => ({
    waba_id: wabaId,
    phone_number_id: phoneNumberId || '',
    bucket_date: dataPoint.start
      ? epochToLocalDate(dataPoint.start)
      : new Date().toISOString().split('T')[0],
    sent: dataPoint.sent || 0,
    delivered: dataPoint.delivered || 0,
    read_count: 0 // Not available at account level
  }));
}

/**
 * Sync message analytics from Meta API to database
 */
async function syncAnalytics(startEpoch, endEpoch) {
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
  const WABA_ID = process.env.META_WABA_ID;
  const PHONE_NUMBER_ID = process.env.META_WHATSAPP_PHONE_ID || '';

  if (!ACCESS_TOKEN || !WABA_ID) {
    throw new Error('Meta API credentials not configured (META_ACCESS_TOKEN, META_WABA_ID required)');
  }

  const supabase = getSupabase();
  const results = { messages: { fetched: 0, upserted: 0 } };

  // Fetch message analytics (sent, delivered)
  const msgData = await fetchMessageAnalytics(startEpoch, endEpoch, WABA_ID, ACCESS_TOKEN);
  const msgRows = normalizeMessageData(msgData, WABA_ID, PHONE_NUMBER_ID);
  results.messages.fetched = msgRows.length;

  if (msgRows.length > 0) {
    const { data, error } = await supabase.rpc('upsert_waba_messages', {
      p_data: msgRows
    });

    if (error) throw error;
    results.messages.upserted = data || msgRows.length;
  }

  // Update last sync timestamp
  const { error: updateError } = await supabase
    .from('app_settings')
    .update({ waba_last_sync: new Date().toISOString() })
    .eq('id', 'default');

  if (updateError) {
    console.error('Failed to update waba_last_sync:', updateError.message);
  }

  return results;
}

// ==================== BUSINESS PROFILE ====================

/**
 * Fetch WhatsApp Business profile data
 * GET /{phone-number-id}?fields=verified_name,display_phone_number,quality_rating,messaging_limit_tier
 * GET /{phone-number-id}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical
 */
async function fetchBusinessProfile(wabaId, phoneNumberId, accessToken) {
  // First, get phone number info (verified name, quality, etc.)
  const phoneFields = 'verified_name,display_phone_number,quality_rating,messaging_limit_tier,name_status';
  const phoneUrl = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${phoneNumberId}?fields=${phoneFields}&access_token=${accessToken}`;

  const phoneResponse = await fetchWithRetry(phoneUrl);
  const phoneData = await phoneResponse.json();

  if (!phoneResponse.ok) {
    const errorInfo = parseMetaError(phoneData);
    throw new Error(`Meta API error fetching phone info: ${errorInfo.message} (code: ${errorInfo.code})`);
  }

  // Then, get business profile (about, profile picture, etc.)
  const profileFields = 'about,address,description,email,profile_picture_url,websites,vertical';
  const profileUrl = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${phoneNumberId}/whatsapp_business_profile?fields=${profileFields}&access_token=${accessToken}`;

  const profileResponse = await fetchWithRetry(profileUrl);
  const profileData = await profileResponse.json();

  // Profile data is optional - some accounts may not have it configured
  let businessProfile = {};
  if (profileResponse.ok && profileData.data && profileData.data.length > 0) {
    businessProfile = profileData.data[0];
  }

  // Combine both responses
  return {
    verifiedName: phoneData.verified_name || null,
    displayPhoneNumber: phoneData.display_phone_number || null,
    qualityRating: phoneData.quality_rating || null,
    messagingLimitTier: phoneData.messaging_limit_tier || null,
    nameStatus: phoneData.name_status || null,
    // From business profile
    about: businessProfile.about || null,
    description: businessProfile.description || null,
    email: businessProfile.email || null,
    profilePictureUrl: businessProfile.profile_picture_url || null,
    websites: businessProfile.websites || [],
    address: businessProfile.address || null,
    vertical: businessProfile.vertical || null
  };
}

/**
 * Get phone number IDs associated with WABA
 * GET /{WABA_ID}/phone_numbers
 */
async function fetchPhoneNumbers(wabaId, accessToken) {
  const url = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${wabaId}/phone_numbers?access_token=${accessToken}`;

  const response = await fetchWithRetry(url);
  const data = await response.json();

  if (!response.ok) {
    const errorInfo = parseMetaError(data);
    throw new Error(`Meta API error fetching phone numbers: ${errorInfo.message} (code: ${errorInfo.code})`);
  }

  return data.data || [];
}


// Allowed origins for CORS
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
  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
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

/**
 * Main handler
 */
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

  // Parse query parameters
  const params = event.queryStringParameters || {};
  const action = params.action || 'sync';

  try {
    switch (action) {
      case 'sync': {
        // Sync last 3 days (default) or custom range
        const now = Math.floor(Date.now() / 1000);
        const threeDaysAgo = now - (3 * 24 * 60 * 60);

        const start = params.start ? Number(params.start) : threeDaysAgo;
        const end = params.end ? Number(params.end) : now;

        // Validate: start/end must be valid numbers
        if (!Number.isFinite(start) || !Number.isFinite(end)) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid start or end timestamp' })
          };
        }

        // Validate: start must be within 365 days
        const maxLookback = now - (365 * 24 * 60 * 60);
        if (start < maxLookback) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              error: 'Start date must be within the last 365 days',
              maxLookback: new Date(maxLookback * 1000).toISOString()
            })
          };
        }

        console.log(`Syncing WABA analytics from ${new Date(start * 1000).toISOString()} to ${new Date(end * 1000).toISOString()}`);

        const results = await syncAnalytics(start, end);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            period: {
              start: new Date(start * 1000).toISOString(),
              end: new Date(end * 1000).toISOString()
            },
            results
          })
        };
      }

      case 'status': {
        const supabase = getSupabase();

        const { data: settings } = await supabase
          .from('app_settings')
          .select('waba_last_sync')
          .eq('id', 'default')
          .single();

        const { count: msgCount } = await supabase
          .from('waba_message_analytics')
          .select('*', { count: 'exact', head: true });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            lastSync: settings?.waba_last_sync,
            messageRecords: msgCount
          })
        };
      }

      case 'profile': {
        // Fetch WhatsApp Business profile
        const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
        const WABA_ID = process.env.META_WABA_ID;
        const PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;

        if (!ACCESS_TOKEN || !WABA_ID) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Meta API credentials not configured' })
          };
        }

        // Get phone numbers if not configured
        let phoneNumberId = PHONE_NUMBER_ID;
        if (!phoneNumberId) {
          const phoneNumbers = await fetchPhoneNumbers(WABA_ID, ACCESS_TOKEN);
          if (phoneNumbers.length === 0) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'No phone numbers found for this WABA' })
            };
          }
          phoneNumberId = phoneNumbers[0].id;
        }

        const profile = await fetchBusinessProfile(WABA_ID, phoneNumberId, ACCESS_TOKEN);

        return {
          statusCode: 200,
          headers: { ...headers, 'Cache-Control': 'private, max-age=3600' }, // 1 hour cache like Instagram
          body: JSON.stringify({ profile })
        };
      }

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: `Unknown action: ${action}` })
        };
    }
  } catch (error) {
    console.error('WABA analytics error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'WhatsApp analytics temporarily unavailable'
      })
    };
  }
};

/**
 * Exported for use by campaign-scheduler.js
 */
exports.syncWabaAnalytics = syncAnalytics;
