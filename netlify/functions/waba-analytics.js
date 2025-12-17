// netlify/functions/waba-analytics.js
// WhatsApp Business API Analytics - Meta Graph API integration
//
// v1.0 (2025-12-17): Initial implementation
//   - Fetches conversation analytics (billable conversations + costs)
//   - Fetches message analytics (sent, delivered, read)
//   - Supports manual sync and daily automated sync
//   - Backfill support for historical data
//
// Environment variables required:
// - META_ACCESS_TOKEN: Meta Graph API access token
// - META_WABA_ID: WhatsApp Business Account ID
// - META_WHATSAPP_PHONE_ID: Campaign phone number ID (optional, filters by phone)
// - SUPABASE_URL: Supabase project URL
// - SUPABASE_SERVICE_KEY: Supabase service role key

const { createClient } = require('@supabase/supabase-js');

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_BASE = 'https://graph.facebook.com';

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
 * Fetch conversation analytics (billable conversations with costs)
 * @param {number} start - Start timestamp in epoch seconds
 * @param {number} end - End timestamp in epoch seconds
 * @param {string} wabaId - WhatsApp Business Account ID
 * @param {string} accessToken - Meta Graph API access token
 * @param {string} phoneNumberId - Optional phone number ID filter
 */
async function fetchConversationAnalytics(start, end, wabaId, accessToken, phoneNumberId = null) {
  // Build the fields parameter for conversation_analytics
  let fields = `conversation_analytics.start(${start}).end(${end}).granularity(DAILY).dimensions(["CONVERSATION_CATEGORY","COUNTRY"])`;

  // Add phone number filter if provided
  if (phoneNumberId) {
    fields = `conversation_analytics.start(${start}).end(${end}).granularity(DAILY).phone_numbers(["${phoneNumberId}"]).dimensions(["CONVERSATION_CATEGORY","COUNTRY"])`;
  }

  const url = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${wabaId}?fields=${encodeURIComponent(fields)}&access_token=${accessToken}`;

  console.log(`Fetching conversation analytics: ${start} to ${end}`);

  const response = await fetchWithRetry(url);
  const data = await response.json();

  if (!response.ok) {
    const errorInfo = parseMetaError(data);
    console.error('Conversation analytics API error:', errorInfo);
    throw new Error(`Meta API error: ${errorInfo.message} (code: ${errorInfo.code}, fbtrace_id: ${errorInfo.fbtrace_id})`);
  }

  return data.conversation_analytics || null;
}

/**
 * Fetch message analytics (sent, delivered, read)
 * @param {number} start - Start timestamp in epoch seconds
 * @param {number} end - End timestamp in epoch seconds
 * @param {string} wabaId - WhatsApp Business Account ID
 * @param {string} accessToken - Meta Graph API access token
 * @param {string} phoneNumberId - Optional phone number ID filter
 */
async function fetchMessageAnalytics(start, end, wabaId, accessToken, phoneNumberId = null) {
  // Build the fields parameter for analytics
  let fields = `analytics.start(${start}).end(${end}).granularity(DAILY).metrics(["SENT","DELIVERED","READ"])`;

  // Add phone number filter if provided
  if (phoneNumberId) {
    fields = `analytics.start(${start}).end(${end}).granularity(DAILY).phone_numbers(["${phoneNumberId}"]).metrics(["SENT","DELIVERED","READ"])`;
  }

  const url = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${wabaId}?fields=${encodeURIComponent(fields)}&access_token=${accessToken}`;

  console.log(`Fetching message analytics: ${start} to ${end}`);

  const response = await fetchWithRetry(url);
  const data = await response.json();

  if (!response.ok) {
    const errorInfo = parseMetaError(data);
    console.error('Message analytics API error:', errorInfo);
    throw new Error(`Meta API error: ${errorInfo.message} (code: ${errorInfo.code}, fbtrace_id: ${errorInfo.fbtrace_id})`);
  }

  return data.analytics || null;
}

/**
 * Normalize conversation analytics response to database rows
 */
function normalizeConversationData(analyticsData, wabaId, phoneNumberId) {
  const rows = [];

  if (!analyticsData || !analyticsData.data_points) {
    return rows;
  }

  for (const dataPoint of analyticsData.data_points) {
    const bucketDate = new Date(dataPoint.start * 1000).toISOString().split('T')[0];

    // Each data point has conversation_category and country breakdowns
    if (dataPoint.conversation_category && dataPoint.country) {
      rows.push({
        waba_id: wabaId,
        phone_number_id: phoneNumberId || null,
        bucket_date: bucketDate,
        conversation_category: dataPoint.conversation_category,
        country_code: dataPoint.country,
        conversation_count: dataPoint.conversation || 0,
        cost: dataPoint.cost || 0
      });
    } else {
      // Fallback for flat response structure
      rows.push({
        waba_id: wabaId,
        phone_number_id: phoneNumberId || null,
        bucket_date: bucketDate,
        conversation_category: dataPoint.conversation_category || 'UNKNOWN',
        country_code: dataPoint.country || null,
        conversation_count: dataPoint.conversation || 0,
        cost: dataPoint.cost || 0
      });
    }
  }

  return rows;
}

/**
 * Normalize message analytics response to database rows
 */
function normalizeMessageData(analyticsData, wabaId, phoneNumberId) {
  const rows = [];

  if (!analyticsData || !analyticsData.data_points) {
    return rows;
  }

  for (const dataPoint of analyticsData.data_points) {
    const bucketDate = new Date(dataPoint.start * 1000).toISOString().split('T')[0];

    rows.push({
      waba_id: wabaId,
      phone_number_id: phoneNumberId || null,
      bucket_date: bucketDate,
      sent: dataPoint.sent || 0,
      delivered: dataPoint.delivered || 0,
      read_count: dataPoint.read || 0
    });
  }

  return rows;
}

/**
 * Sync analytics data from Meta API to database
 * @param {number} startEpoch - Start timestamp in epoch seconds
 * @param {number} endEpoch - End timestamp in epoch seconds
 */
async function syncAnalytics(startEpoch, endEpoch) {
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
  const WABA_ID = process.env.META_WABA_ID;
  const PHONE_ID = process.env.META_WHATSAPP_PHONE_ID || null;

  if (!ACCESS_TOKEN || !WABA_ID) {
    throw new Error('Meta API credentials not configured (META_ACCESS_TOKEN, META_WABA_ID required)');
  }

  const supabase = getSupabase();
  const results = {
    conversations: { fetched: 0, upserted: 0 },
    messages: { fetched: 0, upserted: 0 }
  };

  // Fetch conversation analytics (billable)
  try {
    const convData = await fetchConversationAnalytics(startEpoch, endEpoch, WABA_ID, ACCESS_TOKEN, PHONE_ID);
    const convRows = normalizeConversationData(convData, WABA_ID, PHONE_ID);
    results.conversations.fetched = convRows.length;

    if (convRows.length > 0) {
      const { data, error } = await supabase.rpc('upsert_waba_conversations', {
        p_data: convRows
      });

      if (error) {
        console.error('Error upserting conversation data:', error);
        throw error;
      }

      results.conversations.upserted = data || convRows.length;
    }
  } catch (error) {
    console.error('Conversation analytics sync failed:', error.message);
    results.conversations.error = error.message;
  }

  // Fetch message analytics (delivery metrics)
  try {
    const msgData = await fetchMessageAnalytics(startEpoch, endEpoch, WABA_ID, ACCESS_TOKEN, PHONE_ID);
    const msgRows = normalizeMessageData(msgData, WABA_ID, PHONE_ID);
    results.messages.fetched = msgRows.length;

    if (msgRows.length > 0) {
      const { data, error } = await supabase.rpc('upsert_waba_messages', {
        p_data: msgRows
      });

      if (error) {
        console.error('Error upserting message data:', error);
        throw error;
      }

      results.messages.upserted = data || msgRows.length;
    }
  } catch (error) {
    console.error('Message analytics sync failed:', error.message);
    results.messages.error = error.message;
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

        const start = params.start ? parseInt(params.start, 10) : threeDaysAgo;
        const end = params.end ? parseInt(params.end, 10) : now;

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

      case 'backfill': {
        // Backfill from a specific date (December 9, 2024)
        const backfillStart = params.from
          ? new Date(params.from).getTime() / 1000
          : new Date('2024-12-09').getTime() / 1000;

        const now = Math.floor(Date.now() / 1000);

        // Process in 7-day chunks to avoid timeouts
        const chunkSize = 7 * 24 * 60 * 60; // 7 days in seconds
        const allResults = [];
        let currentStart = backfillStart;

        while (currentStart < now) {
          const currentEnd = Math.min(currentStart + chunkSize, now);

          console.log(`Backfill chunk: ${new Date(currentStart * 1000).toISOString()} to ${new Date(currentEnd * 1000).toISOString()}`);

          const chunkResults = await syncAnalytics(currentStart, currentEnd);
          allResults.push({
            period: {
              start: new Date(currentStart * 1000).toISOString(),
              end: new Date(currentEnd * 1000).toISOString()
            },
            results: chunkResults
          });

          currentStart = currentEnd;

          // Small delay between chunks to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Update backfill cursor
        const supabase = getSupabase();
        await supabase
          .from('app_settings')
          .update({ waba_backfill_cursor: new Date().toISOString().split('T')[0] })
          .eq('id', 'default');

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            chunks: allResults.length,
            results: allResults
          })
        };
      }

      case 'status': {
        // Return sync status
        const supabase = getSupabase();

        const { data: settings } = await supabase
          .from('app_settings')
          .select('waba_last_sync, waba_backfill_cursor')
          .eq('id', 'default')
          .single();

        const { data: convCount } = await supabase
          .from('waba_conversation_analytics')
          .select('*', { count: 'exact', head: true });

        const { data: msgCount } = await supabase
          .from('waba_message_analytics')
          .select('*', { count: 'exact', head: true });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            lastSync: settings?.waba_last_sync,
            backfillCursor: settings?.waba_backfill_cursor,
            recordCounts: {
              conversations: convCount,
              messages: msgCount
            }
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
