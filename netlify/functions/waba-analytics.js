// netlify/functions/waba-analytics.js
// WhatsApp Business API Analytics - Meta Graph API integration
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

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_BASE = 'https://graph.facebook.com';

// Granularity for message analytics (HALF_HOUR, DAY, MONTH)
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
function normalizeMessageData(analyticsData, wabaId) {
  if (!analyticsData) return [];

  const dataArray = analyticsData.data_points || analyticsData.data || [];
  if (dataArray.length === 0) return [];

  return dataArray.map(dataPoint => ({
    waba_id: wabaId,
    phone_number_id: '',
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

  if (!ACCESS_TOKEN || !WABA_ID) {
    throw new Error('Meta API credentials not configured (META_ACCESS_TOKEN, META_WABA_ID required)');
  }

  const supabase = getSupabase();
  const results = { messages: { fetched: 0, upserted: 0 } };

  // Fetch message analytics (sent, delivered)
  const msgData = await fetchMessageAnalytics(startEpoch, endEpoch, WABA_ID, ACCESS_TOKEN);
  const msgRows = normalizeMessageData(msgData, WABA_ID);
  results.messages.fetched = msgRows.length;

  if (msgRows.length > 0) {
    const { data, error } = await supabase.rpc('upsert_waba_messages', {
      p_data: msgRows
    });

    if (error) throw error;
    results.messages.upserted = data || msgRows.length;
  }

  // Update last sync timestamp
  await supabase
    .from('app_settings')
    .update({ waba_last_sync: new Date().toISOString() })
    .eq('id', 'default');

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
