// netlify/functions/waba-analytics.js
// WhatsApp Business API Analytics - Meta Graph API integration
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

// Granularity for analytics endpoints (Meta API is inconsistent!)
// Message analytics: HALF_HOUR, DAY, MONTH
// Template analytics: HALF_HOUR, DAILY, MONTHLY
const MSG_GRANULARITY = 'DAY';
const TEMPLATE_GRANULARITY = 'DAILY';

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

// ==================== TEMPLATE ANALYTICS (READ metrics) ====================

/**
 * Mapping from Meta template names to local template IDs (messageTemplates.js)
 * Used to link Meta API templates with our local configuration
 */
const META_TO_LOCAL_TEMPLATE = {
  'lavpop_winback_desconto': 'winback_discount',
  'lavpop_winback_lavagem': 'winback_wash_only',
  'lavpop_winback_secagem': 'winback_dry_only',
  'lavpop_winback_urgente': 'winback_critical',
  'lavpop_boasvindas': 'welcome_new',
  'lavpop_saldo_carteira': 'wallet_reminder',
  'lavpop_promocao': 'promo_general',
  'lavpop_promo_secagem': 'promo_secagem',
  'lavpop_complete_secagem': 'upsell_secagem',
  'lavpop_pos_visita': 'post_visit_thanks'
};

/**
 * Fetch message templates from Meta API
 * GET /{WABA_ID}/message_templates
 */
async function fetchMessageTemplates(wabaId, accessToken) {
  const url = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${wabaId}/message_templates?access_token=${accessToken}`;

  const response = await fetchWithRetry(url);
  const data = await response.json();

  if (!response.ok) {
    const errorInfo = parseMetaError(data);
    throw new Error(`Meta API error fetching templates: ${errorInfo.message} (code: ${errorInfo.code})`);
  }

  return data.data || [];
}

/**
 * Fetch per-template analytics (sent, delivered, READ) for ALL templates at once
 * Uses WABA-level template_analytics endpoint (not per-template)
 * GET /{WABA_ID}?fields=template_analytics.start().end().granularity(DAY).template_ids([...]).metrics(["SENT","DELIVERED","READ"])
 *
 * @param {string[]} templateIds - Array of template IDs to fetch analytics for
 * @param {number} start - Start epoch timestamp
 * @param {number} end - End epoch timestamp
 * @param {string} wabaId - WhatsApp Business Account ID
 * @param {string} accessToken - Meta access token
 * @returns {Object|null} Template analytics data or null on error
 */
async function fetchAllTemplateAnalytics(templateIds, start, end, wabaId, accessToken) {
  const templateIdsParam = JSON.stringify(templateIds);
  const fields = `template_analytics.start(${start}).end(${end}).granularity(${TEMPLATE_GRANULARITY}).template_ids(${templateIdsParam}).metrics(["SENT","DELIVERED","READ"])`;
  const url = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${wabaId}?fields=${encodeURIComponent(fields)}&access_token=${accessToken}`;

  console.log('Template analytics request URL:', url.replace(accessToken, 'TOKEN_HIDDEN'));

  const response = await fetchWithRetry(url);
  const data = await response.json();

  console.log('Template analytics raw response:', JSON.stringify(data, null, 2).substring(0, 2000));

  if (!response.ok) {
    const errorInfo = parseMetaError(data);
    console.warn(`Template analytics error: ${errorInfo.message} (code: ${errorInfo.code})`);
    return null;
  }

  return data.template_analytics || null;
}

/**
 * Normalize template data for database
 */
function normalizeTemplateData(templates, wabaId) {
  return templates.map(t => ({
    id: t.id,
    waba_id: wabaId,
    name: t.name,
    status: t.status || 'APPROVED',
    category: t.category || null,
    language: t.language || 'pt_BR',
    local_template_id: META_TO_LOCAL_TEMPLATE[t.name] || null
  }));
}

/**
 * Convert epoch seconds to UTC date string (YYYY-MM-DD)
 * Used for template analytics where Meta returns UTC midnight timestamps
 */
function epochToUtcDate(epochSeconds) {
  const date = new Date(epochSeconds * 1000);
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD in UTC
}

/**
 * Normalize template analytics data for database
 * Handles the template_analytics response format from WABA endpoint
 *
 * Response structure (v24.0):
 * {
 *   data: [{
 *     granularity: "DAILY",
 *     product_type: "cloud_api",
 *     data_points: [
 *       { template_id: "...", start: epoch, sent: N, delivered: N, read: N, ... },
 *       ...
 *     ]
 *   }]
 * }
 *
 * NOTE: Template analytics uses UTC midnight timestamps, so we use UTC dates
 * to align with message analytics (which uses business timezone-aligned timestamps)
 */
function normalizeTemplateAnalyticsData(analyticsData, wabaId) {
  if (!analyticsData) return [];

  // v24.0: data is an array with one element containing data_points
  const dataWrapper = analyticsData.data || [];
  if (dataWrapper.length === 0) return [];

  // Get the actual data points from the first element
  const dataPoints = dataWrapper[0]?.data_points || [];
  if (dataPoints.length === 0) return [];

  return dataPoints.map(dataPoint => ({
    template_id: dataPoint.template_id || dataPoint.hsm_id,
    waba_id: wabaId,
    // Use UTC date since Meta returns UTC midnight timestamps for template analytics
    bucket_date: dataPoint.start
      ? epochToUtcDate(dataPoint.start)
      : new Date().toISOString().split('T')[0],
    sent: dataPoint.sent || 0,
    delivered: dataPoint.delivered || 0,
    read_count: dataPoint.read || 0 // Available at template level!
  }));
}

/**
 * Sync templates and per-template analytics from Meta API
 */
async function syncTemplateAnalytics(startEpoch, endEpoch) {
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
  const WABA_ID = process.env.META_WABA_ID;

  if (!ACCESS_TOKEN || !WABA_ID) {
    throw new Error('Meta API credentials not configured (META_ACCESS_TOKEN, META_WABA_ID required)');
  }

  const supabase = getSupabase();
  const results = {
    templates: { fetched: 0, upserted: 0 },
    analytics: { templatesProcessed: 0, rowsUpserted: 0, errors: [] }
  };

  // Step 1: Fetch and cache templates
  console.log('Fetching message templates from Meta API...');
  const templates = await fetchMessageTemplates(WABA_ID, ACCESS_TOKEN);
  results.templates.fetched = templates.length;

  if (templates.length > 0) {
    const templateRows = normalizeTemplateData(templates, WABA_ID);
    const { data, error } = await supabase.rpc('upsert_waba_templates', {
      p_data: templateRows
    });

    if (error) throw error;
    results.templates.upserted = data || templateRows.length;
    console.log(`Cached ${results.templates.upserted} templates to database`);
  }

  // Step 2: Fetch per-template analytics (batch request via WABA endpoint)
  let allAnalyticsRows = [];

  if (templates.length > 0) {
    try {
      const templateIds = templates.map(t => t.id);
      const analytics = await fetchAllTemplateAnalytics(templateIds, startEpoch, endEpoch, WABA_ID, ACCESS_TOKEN);

      if (analytics) {
        allAnalyticsRows = normalizeTemplateAnalyticsData(analytics, WABA_ID);
        const templatesWithData = new Set(allAnalyticsRows.map(r => r.template_id));
        results.analytics.templatesProcessed = templatesWithData.size;
      }
    } catch (err) {
      console.warn(`Failed to fetch template analytics: ${err.message}`);
      results.analytics.errors.push({ error: err.message });
    }
  }

  // Step 3: Upsert all analytics rows
  if (allAnalyticsRows.length > 0) {
    const validRows = allAnalyticsRows.filter(r => r.template_id);

    if (validRows.length > 0) {
      const { data, error } = await supabase.rpc('upsert_waba_template_analytics', {
        p_data: validRows
      });

      if (error) {
        console.error('Template analytics upsert error:', error.message);
        results.analytics.errors.push({ error: error.message });
      } else {
        results.analytics.rowsUpserted = data || validRows.length;
      }
    }
  }

  // Update last sync timestamp
  const { error: updateError } = await supabase
    .from('app_settings')
    .update({ waba_template_last_sync: new Date().toISOString() })
    .eq('id', 'default');

  if (updateError) {
    console.error('Failed to update waba_template_last_sync:', updateError.message);
  }

  return results;
}

/**
 * Main handler
 */
exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
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
          .select('waba_last_sync, waba_template_last_sync')
          .eq('id', 'default')
          .single();

        const { count: msgCount } = await supabase
          .from('waba_message_analytics')
          .select('*', { count: 'exact', head: true });

        const { count: templateCount } = await supabase
          .from('waba_templates')
          .select('*', { count: 'exact', head: true });

        const { count: templateAnalyticsCount } = await supabase
          .from('waba_template_analytics')
          .select('*', { count: 'exact', head: true });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            lastSync: settings?.waba_last_sync,
            lastTemplateSync: settings?.waba_template_last_sync,
            messageRecords: msgCount,
            templates: templateCount,
            templateAnalyticsRecords: templateAnalyticsCount
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

      case 'sync-templates': {
        // Sync templates and per-template analytics
        const now = Math.floor(Date.now() / 1000);
        const threeDaysAgo = now - (3 * 24 * 60 * 60);

        const start = params.start ? Number(params.start) : threeDaysAgo;
        const end = params.end ? Number(params.end) : now;

        // Validate timestamps
        if (!Number.isFinite(start) || !Number.isFinite(end)) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid start or end timestamp' })
          };
        }

        console.log(`Syncing WABA templates from ${new Date(start * 1000).toISOString()} to ${new Date(end * 1000).toISOString()}`);

        const results = await syncTemplateAnalytics(start, end);

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

      case 'debug-templates': {
        // Debug endpoint to see raw template analytics response
        const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
        const WABA_ID = process.env.META_WABA_ID;

        if (!ACCESS_TOKEN || !WABA_ID) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing credentials' }) };
        }

        // Get templates first
        const templates = await fetchMessageTemplates(WABA_ID, ACCESS_TOKEN);
        const templateIds = templates.map(t => t.id);

        // Fetch analytics with raw response
        const now = Math.floor(Date.now() / 1000);
        const threeDaysAgo = now - (3 * 24 * 60 * 60);
        const templateIdsParam = JSON.stringify(templateIds);
        const fields = `template_analytics.start(${threeDaysAgo}).end(${now}).granularity(${TEMPLATE_GRANULARITY}).template_ids(${templateIdsParam}).metrics(["SENT","DELIVERED","READ"])`;
        const url = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${WABA_ID}?fields=${encodeURIComponent(fields)}&access_token=${ACCESS_TOKEN}`;

        const response = await fetch(url);
        const rawData = await response.json();

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            templateCount: templates.length,
            templateIds: templateIds,
            rawResponse: rawData,
            hasTemplateAnalytics: !!rawData.template_analytics
          }, null, 2)
        };
      }

      case 'diagnose': {
        // Diagnostic endpoint to debug sync issues
        const supabase = getSupabase();
        const diagnostics = {
          timestamp: new Date().toISOString(),
          environment: {
            hasMetaAccessToken: !!process.env.META_ACCESS_TOKEN,
            hasWabaId: !!process.env.META_WABA_ID,
            wabaId: process.env.META_WABA_ID || 'NOT_SET'
          },
          appSettings: null,
          latestData: null,
          metaApiTest: null
        };

        // Check app_settings
        try {
          const { data: settings, error: settingsError } = await supabase
            .from('app_settings')
            .select('id, waba_last_sync, waba_template_last_sync')
            .eq('id', 'default')
            .single();

          if (settingsError) {
            diagnostics.appSettings = { error: settingsError.message, code: settingsError.code };
          } else {
            diagnostics.appSettings = settings;
          }
        } catch (e) {
          diagnostics.appSettings = { error: e.message };
        }

        // Check latest data
        try {
          const { data: latestMsg } = await supabase
            .from('waba_message_analytics')
            .select('bucket_date, updated_at')
            .order('bucket_date', { ascending: false })
            .limit(1)
            .single();

          diagnostics.latestData = latestMsg || { message: 'No data found' };
        } catch (e) {
          diagnostics.latestData = { error: e.message };
        }

        // Test Meta API connectivity
        if (process.env.META_ACCESS_TOKEN && process.env.META_WABA_ID) {
          try {
            const testUrl = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${process.env.META_WABA_ID}?fields=id,name&access_token=${process.env.META_ACCESS_TOKEN}`;
            const response = await fetch(testUrl);
            const data = await response.json();

            if (response.ok) {
              diagnostics.metaApiTest = { success: true, wabaName: data.name };
            } else {
              const errorInfo = parseMetaError(data);
              diagnostics.metaApiTest = { success: false, error: errorInfo.message, code: errorInfo.code };
            }
          } catch (e) {
            diagnostics.metaApiTest = { success: false, error: e.message };
          }
        } else {
          diagnostics.metaApiTest = { skipped: true, reason: 'Missing credentials' };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(diagnostics, null, 2)
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
        error: error.message,
        details: error.code ? { code: error.code } : undefined
      })
    };
  }
};

/**
 * Exported for use by campaign-scheduler.js
 */
exports.syncWabaAnalytics = syncAnalytics;
exports.syncWabaTemplateAnalytics = syncTemplateAnalytics;
