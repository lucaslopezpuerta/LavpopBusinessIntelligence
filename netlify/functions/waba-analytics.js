// netlify/functions/waba-analytics.js
// WhatsApp Business API Analytics - Meta Graph API integration
//
// v1.6 (2026-02-09): Fix critical Meta API parameter bugs + protect existing data
//   - Fix: metrics → metric_types (correct Meta parameter name)
//   - Fix: Template IDs unquoted [id1,id2] not JSON-stringified ["id1","id2"]
//   - Fix: use_waba_timezone=true with YYYY-MM-DD dates (avoids UTC midnight offset)
//   - Fix: Template name prefix matching for Twilio-suffixed names (e.g. lavpop_winback_desconto_hx...)
//   - Add: ensureInsightsEnabled() — confirms template analytics on WABA (one-time, irreversible)
//   - Add: enable-insights action for manual trigger
//   - Protect: Skip upsert for zero-value rows to preserve existing good data
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
 * Ensure template analytics are enabled on the WABA.
 * Per Meta docs: "You must confirm template analytics on your WhatsApp Business Account
 * before you can get template analytics. Once confirmed, template analytics cannot be disabled."
 *
 * Caches the confirmation in app_settings.waba_insights_enabled so we only call once.
 */
async function ensureInsightsEnabled(wabaId, accessToken) {
  const supabase = getSupabase();

  // Check if already confirmed
  const { data: settings } = await supabase
    .from('app_settings')
    .select('waba_insights_enabled')
    .eq('id', 'default')
    .single();

  if (settings?.waba_insights_enabled) {
    console.log('Template insights already enabled on WABA (cached).');
    return { alreadyEnabled: true };
  }

  // POST to enable insights
  const url = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${wabaId}?is_enabled_for_insights=true&access_token=${accessToken}`;
  console.log('Enabling template insights on WABA...');

  const response = await fetchWithRetry(url, { method: 'POST' });
  const data = await response.json();

  if (!response.ok) {
    const errorInfo = parseMetaError(data);
    throw new Error(`Failed to enable insights: ${errorInfo.message} (code: ${errorInfo.code})`);
  }

  console.log('Template insights enabled successfully:', JSON.stringify(data));

  // Cache the confirmation
  const { error: updateError } = await supabase
    .from('app_settings')
    .update({ waba_insights_enabled: true })
    .eq('id', 'default');

  if (updateError) {
    console.warn('Failed to cache insights enabled flag:', updateError.message);
  }

  return { enabled: true, response: data };
}

/**
 * Convert epoch seconds to YYYY-MM-DD string in business timezone.
 * Used for template_analytics start/end parameters with use_waba_timezone=true.
 */
function epochToDateString(epochSeconds) {
  const date = new Date(epochSeconds * 1000);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(date); // Returns YYYY-MM-DD
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
 * GET /{WABA_ID}?fields=template_analytics.start().end().granularity(DAILY).metric_types(["SENT","DELIVERED","READ"]).template_ids([...])&use_waba_timezone=true
 *
 * @param {string[]} templateIds - Array of template IDs to fetch analytics for
 * @param {string} startDate - Start date in YYYY-MM-DD format (used with use_waba_timezone)
 * @param {string} endDate - End date in YYYY-MM-DD format (used with use_waba_timezone)
 * @param {string} wabaId - WhatsApp Business Account ID
 * @param {string} accessToken - Meta access token
 * @returns {Object|null} Template analytics data or null on error
 */
async function fetchAllTemplateAnalytics(templateIds, startDate, endDate, wabaId, accessToken) {
  // Template IDs must be unquoted numbers: [id1,id2] NOT ["id1","id2"]
  const templateIdsParam = `[${templateIds.join(',')}]`;
  // Use metric_types (not metrics) per Meta docs; use YYYY-MM-DD dates with use_waba_timezone
  const fields = `template_analytics.start(${startDate}).end(${endDate}).granularity(${TEMPLATE_GRANULARITY}).metric_types(["SENT","DELIVERED","READ"]).template_ids(${templateIdsParam})`;
  const url = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${wabaId}?fields=${encodeURIComponent(fields)}&use_waba_timezone=true&access_token=${accessToken}`;

  console.log('Template analytics request URL:', url.replace(accessToken, 'TOKEN_HIDDEN'));

  const response = await fetchWithRetry(url);
  const data = await response.json();

  // Structured diagnostic logging
  const hasTemplateAnalytics = !!data.template_analytics;
  const dataWrapper = data.template_analytics?.data || [];
  const dataPoints = dataWrapper[0]?.data_points || [];
  const nonZeroPoints = dataPoints.filter(dp => (dp.sent || 0) + (dp.delivered || 0) + (dp.read || 0) > 0);

  console.log('Template analytics response diagnostics:', JSON.stringify({
    hasTemplateAnalytics,
    topLevelKeys: Object.keys(data),
    dataWrapperLength: dataWrapper.length,
    dataPointsCount: dataPoints.length,
    nonZeroPointsCount: nonZeroPoints.length,
    samplePoint: dataPoints[0] || null,
    granularity: dataWrapper[0]?.granularity || null,
    productType: dataWrapper[0]?.product_type || null
  }));

  // Log first non-zero point for debugging
  if (nonZeroPoints.length > 0) {
    console.log('First non-zero data point:', JSON.stringify(nonZeroPoints[0]));
  } else if (dataPoints.length > 0) {
    console.warn('WARNING: All template data points are zeros. First point:', JSON.stringify(dataPoints[0]));
  }

  if (!response.ok) {
    const errorInfo = parseMetaError(data);
    console.warn(`Template analytics error: ${errorInfo.message} (code: ${errorInfo.code})`);
    return null;
  }

  return data.template_analytics || null;
}

/**
 * Get local template ID using prefix matching.
 * Meta returns Twilio-suffixed names (e.g. "lavpop_winback_desconto_hx58267edb...")
 * but our mapping uses short names (e.g. "lavpop_winback_desconto").
 */
function getLocalTemplateId(metaTemplateName) {
  if (!metaTemplateName) return null;
  // Try exact match first
  if (META_TO_LOCAL_TEMPLATE[metaTemplateName]) {
    return META_TO_LOCAL_TEMPLATE[metaTemplateName];
  }
  // Fall back to prefix matching for Twilio-suffixed names
  for (const [metaName, localId] of Object.entries(META_TO_LOCAL_TEMPLATE)) {
    if (metaTemplateName.startsWith(metaName)) return localId;
  }
  return null;
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
    local_template_id: getLocalTemplateId(t.name)
  }));
}

/**
 * Normalize template analytics data for database
 * Handles the template_analytics response format from WABA endpoint
 *
 * With use_waba_timezone=true, data_point.start is still an epoch but aligned
 * to the WABA's timezone (São Paulo). We still convert via epochToLocalDate()
 * for consistency, but the alignment should now be correct without day-shift issues.
 */
function normalizeTemplateAnalyticsData(analyticsData, wabaId) {
  if (!analyticsData) return [];

  // v24.0: data is an array with one element containing data_points
  const dataWrapper = analyticsData.data || [];
  if (dataWrapper.length === 0) return [];

  // Get the actual data points from the first element
  const dataPoints = dataWrapper[0]?.data_points || [];
  if (dataPoints.length === 0) return [];

  return dataPoints.map(dataPoint => {
    // start can be epoch (number) or date string depending on API version
    let bucketDate;
    if (typeof dataPoint.start === 'string' && dataPoint.start.includes('-')) {
      // Already YYYY-MM-DD
      bucketDate = dataPoint.start;
    } else if (dataPoint.start) {
      bucketDate = epochToLocalDate(dataPoint.start);
    } else {
      bucketDate = new Date().toISOString().split('T')[0];
    }

    return {
      template_id: dataPoint.template_id || dataPoint.hsm_id,
      waba_id: wabaId,
      bucket_date: bucketDate,
      sent: dataPoint.sent || 0,
      delivered: dataPoint.delivered || 0,
      read_count: dataPoint.read || 0
    };
  });
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

  // Step 0: Ensure insights are enabled on the WABA
  try {
    await ensureInsightsEnabled(WABA_ID, ACCESS_TOKEN);
  } catch (err) {
    console.warn('Could not confirm insights enabled:', err.message);
    // Continue anyway — insights may already be enabled
  }

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
      // Convert epoch seconds to YYYY-MM-DD for use_waba_timezone mode
      const startDate = epochToDateString(startEpoch);
      const endDate = epochToDateString(endEpoch);
      const analytics = await fetchAllTemplateAnalytics(templateIds, startDate, endDate, WABA_ID, ACCESS_TOKEN);

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

  // Step 3: Upsert all analytics rows (only non-zero to preserve existing good data)
  if (allAnalyticsRows.length > 0) {
    const validRows = allAnalyticsRows.filter(r =>
      r.template_id && (r.sent > 0 || r.delivered > 0 || r.read_count > 0)
    );
    console.log(`Template analytics: ${allAnalyticsRows.length} total rows, ${validRows.length} non-zero rows to upsert`);

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

      case 'enable-insights': {
        // Enable template analytics on the WABA (one-time, irreversible)
        const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
        const WABA_ID = process.env.META_WABA_ID;

        if (!ACCESS_TOKEN || !WABA_ID) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Meta API credentials not configured' })
          };
        }

        const result = await ensureInsightsEnabled(WABA_ID, ACCESS_TOKEN);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, ...result })
        };
      }

      case 'sync-templates': {
        // Sync templates and per-template analytics
        // Use 30-day window (vs 3-day for message analytics) because Meta's
        // template_analytics endpoint has longer data processing delays
        const now = Math.floor(Date.now() / 1000);
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60);

        const start = params.start ? Number(params.start) : thirtyDaysAgo;
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
exports.syncWabaTemplateAnalytics = syncTemplateAnalytics;
