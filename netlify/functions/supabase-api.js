// netlify/functions/supabase-api.js
// Unified API for Supabase database operations
// Handles campaigns, blacklist, communication logs, and scheduled campaigns
//
// Version: 3.0 (2025-12-13) - Campaign performance view integration
//   - Added campaign_performance.getAll to fetch all campaigns with return metrics
//   - Used by CampaignList to display campaigns (replaces campaign_effectiveness query)
//
// Version: 2.9 (2025-12-13) - Fixed contacts.getAll response key mismatch
//   - getContactTracking now returns both 'contacts' and 'contact_tracking' keys
//   - Fixes checkmarks not showing (frontend expects 'contacts', backend returned 'contact_tracking')
//
// Version: 2.8 (2025-12-13) - Configurable coupon validity for manual campaigns
//   - recordCampaignContactWithTracking now accepts couponValidityDays parameter
//   - expires_at calculated as couponValidityDays + 3 day buffer (matches SQL function)
//   - Default 7 days for backwards compatibility
//   - Enables accurate return attribution for configurable coupon validity
//
// Version: 2.7 (2025-12-13) - Backend-only checkmarks
//   - Added contacts.getAll, contacts.create, contacts.clear aliases
//   - createContactTracking now calculates expires_at (7 days for manual, 14 for campaigns)
//   - clearContactStatus marks pending contacts as 'cleared' for manual uncheck
//   - Supports campaign_type='manual' for UI checkmarks
//   - Removes localStorage dependency - contact_tracking is single source of truth
//
// Version: 2.6 (2025-12-13) - Unified manual campaign tracking (matches automation flow)
//   - Added campaign_contacts.record action for manual campaigns
//   - Creates contact_tracking + campaign_contacts WITH twilio_sid in one call
//   - Mirrors the SQL record_automation_contact() function behavior
//   - Enables delivery metrics tracking for manual campaigns
//
// Version: 2.5 (2025-12-12) - Fixed comm_logs customer filtering bug
//   - getCommLogs now receives body params for POST requests (was only receiving query params)
//   - This fixes the bug where all customers' logs were shown instead of just the current customer
//
// Version: 2.4 (2025-12-12) - v6.0 Enhanced automation controls
//   - saveAutomationRules now includes send_window_start/end, send_days, max_daily_sends
//   - Also includes exclude_recent_days, min_total_spent, wallet_balance_max
//   - Updated getDefaultAutomationRules with v6.0 defaults
//
// Version: 2.3 (2025-12-11) - Fixed automation rules save
//   - saveAutomationRules now includes all fields (cooldown, valid_until, max_sends, coupon)
//
// Version: 2.2 (2025-12-11) - Added webhook events for delivery metrics
//   - Added webhook_events.getDeliveryStats for real delivery rates
//   - Added webhook_events.getAll for debugging
//
// Version: 2.1 (2025-12-11) - Added missing contact tracking actions
//   - Added contact_tracking.getAll, contact_tracking.create, contact_tracking.update
//   - Added rpc.expire_old_contacts, rpc.mark_customer_returned
//
// Version: 2.0 (2025-12-10) - Security hardening
//
// Environment variables required:
// - SUPABASE_URL: Your Supabase project URL
// - SUPABASE_SERVICE_KEY: Your Supabase service role key (for server-side)
// - API_SECRET_KEY: Secret key for API authentication
//
// SECURITY FEATURES:
// - API key authentication required for all requests
// - CORS restricted to production domain + localhost dev
// - Sanitized error messages (no internal details exposed)

const { createClient } = require('@supabase/supabase-js');

// ==================== SECURITY CONFIGURATION ====================

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://bilavnova.com',
  'https://www.bilavnova.com',
  'http://localhost:5173',  // Vite dev server
  'http://localhost:3000'   // Alt dev server
];

// Get CORS origin (only allow whitelisted domains)
function getCorsOrigin(event) {
  const origin = event.headers.origin || event.headers.Origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  // Default to production domain for security
  return 'https://bilavnova.com';
}

// Validate API key from request header
function validateApiKey(event) {
  const apiKey = event.headers['x-api-key'] || event.headers['X-Api-Key'];
  const API_SECRET = process.env.API_SECRET_KEY;

  // If no secret configured server-side, warn but allow (for initial setup only)
  if (!API_SECRET) {
    console.warn('⚠️ WARNING: API_SECRET_KEY not configured. API is unprotected!');
    return true;
  }

  return apiKey === API_SECRET;
}

// Sanitize error message (don't expose internal details to client)
function sanitizeError(error) {
  const safeMessages = [
    'Phone number required',
    'campaign_id required',
    'customerId required',
    'Invalid action',
    'No pending contact found for customer'
  ];

  if (safeMessages.includes(error.message)) {
    return error.message;
  }

  // Log full error server-side for debugging
  console.error('API Error:', error);

  // Return generic message to client
  return 'An error occurred processing your request';
}

// Initialize Supabase client
function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error('Database configuration error');
  }

  return createClient(url, key);
}

// ==================== MAIN HANDLER ====================

exports.handler = async (event, context) => {
  const corsOrigin = getCorsOrigin(event);

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // ==================== AUTHENTICATION CHECK ====================
  if (!validateApiKey(event)) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  try {
    const supabase = getSupabase();
    const body = event.httpMethod !== 'GET' ? JSON.parse(event.body || '{}') : {};
    const { action, table, data, filters, id } = body;

    // Parse query params for GET requests
    const params = event.queryStringParameters || {};
    const getAction = params.action || action;
    const getTable = params.table || table;

    switch (getAction || action) {
      // ==================== BLACKLIST OPERATIONS ====================
      case 'blacklist.getAll':
        return await getBlacklist(supabase, headers);

      case 'blacklist.add':
        return await addToBlacklist(supabase, data, headers);

      case 'blacklist.remove':
        return await removeFromBlacklist(supabase, data.phone, headers);

      case 'blacklist.check':
        return await checkBlacklist(supabase, data.phone, headers);

      case 'blacklist.import':
        return await importBlacklist(supabase, data.entries, data.merge, headers);

      case 'blacklist.stats':
        return await getBlacklistStats(supabase, headers);

      // ==================== CAMPAIGN OPERATIONS ====================
      case 'campaigns.getAll':
        return await getCampaigns(supabase, headers);

      case 'campaigns.get':
        return await getCampaign(supabase, id || params.id, headers);

      case 'campaigns.create':
        return await createCampaign(supabase, data, headers);

      case 'campaigns.update':
        return await updateCampaign(supabase, id || data.id, data, headers);

      case 'campaigns.delete':
        return await deleteCampaign(supabase, id || data.id, headers);

      // ==================== CAMPAIGN SENDS ====================
      case 'sends.getAll':
        return await getCampaignSends(supabase, params.campaign_id, headers);

      case 'sends.record':
        return await recordCampaignSend(supabase, data, headers);

      // ==================== SCHEDULED CAMPAIGNS ====================
      case 'scheduled.getAll':
        return await getScheduledCampaigns(supabase, headers);

      case 'scheduled.create':
        return await createScheduledCampaign(supabase, data, headers);

      case 'scheduled.cancel':
        return await cancelScheduledCampaign(supabase, id || data.id, headers);

      // ==================== COMMUNICATION LOGS ====================
      case 'logs.getAll':
        // Merge body params with query params (POST body takes precedence)
        return await getCommLogs(supabase, { ...params, ...body }, headers);

      case 'logs.add':
        return await addCommLog(supabase, data, headers);

      case 'logs.getByPhone':
        return await getLogsByPhone(supabase, params.phone, headers);

      // ==================== AUTOMATION RULES ====================
      case 'automation.getAll':
        return await getAutomationRules(supabase, headers);

      case 'automation.save':
        return await saveAutomationRules(supabase, data, headers);

      // ==================== CAMPAIGN EFFECTIVENESS ====================
      case 'campaign_effectiveness.getAll':
        return await getCampaignEffectiveness(supabase, params, headers);

      case 'contact_effectiveness_summary.getAll':
        return await getContactEffectivenessSummary(supabase, headers);

      case 'campaign_contacts.getAll':
        // Merge body params with query params (POST body takes precedence)
        return await getCampaignContacts(supabase, body.campaign_id || params.campaign_id, headers);

      case 'campaign_contacts.record':
        return await recordCampaignContactWithTracking(supabase, data, headers);

      case 'campaign_performance.getAll':
        return await getAllCampaignPerformance(supabase, body, headers);

      case 'campaign_performance.get':
        return await getCampaignPerformance(supabase, params.campaign_id || id, headers);

      // ==================== CONTACT TRACKING ====================
      case 'contact_tracking.getAll':
      case 'contacts.getAll':  // Alias for frontend compatibility
        return await getContactTracking(supabase, body, headers);

      case 'contact_tracking.create':
      case 'contacts.create':  // Alias for frontend compatibility
        return await createContactTracking(supabase, data, headers);

      case 'contact_tracking.update':
        return await updateContactTracking(supabase, body, headers);

      case 'contact_tracking.record':
        return await recordContactTracking(supabase, data, headers);

      case 'contact_tracking.markReturned':
        return await markContactReturned(supabase, data, headers);

      case 'contacts.clear':  // Mark pending contact as 'cleared' (manual uncheck)
        return await clearContactStatus(supabase, body, headers);

      // ==================== CONTACT ELIGIBILITY ====================
      case 'eligibility.check':
        return await checkCustomerEligibility(supabase, data, headers);

      case 'eligibility.checkBatch':
        return await checkCustomersEligibilityBatch(supabase, data, headers);

      // ==================== WEBHOOK EVENTS (Delivery Metrics) ====================
      case 'webhook_events.getDeliveryStats':
        return await getDeliveryStats(supabase, params, headers);

      case 'webhook_events.getAll':
        return await getWebhookEvents(supabase, params, headers);

      case 'webhook_events.getCampaignDeliveryMetrics':
        return await getCampaignDeliveryMetrics(supabase, headers);

      // ==================== RPC FUNCTIONS ====================
      case 'rpc.expire_old_contacts':
        return await expireOldContacts(supabase, headers);

      case 'rpc.mark_customer_returned':
        return await markCustomerReturnedRpc(supabase, body, headers);

      // ==================== DATA MIGRATION ====================
      case 'migrate.import':
        return await migrateFromLocalStorage(supabase, data, headers);

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Invalid action',
            availableActions: [
              'blacklist.getAll', 'blacklist.add', 'blacklist.remove', 'blacklist.check', 'blacklist.import', 'blacklist.stats',
              'campaigns.getAll', 'campaigns.get', 'campaigns.create', 'campaigns.update', 'campaigns.delete',
              'sends.getAll', 'sends.record',
              'scheduled.getAll', 'scheduled.create', 'scheduled.cancel',
              'logs.getAll', 'logs.add', 'logs.getByPhone',
              'automation.getAll', 'automation.save',
              'campaign_effectiveness.getAll', 'contact_effectiveness_summary.getAll',
              'campaign_contacts.getAll', 'campaign_contacts.record',
              'campaign_performance.getAll', 'campaign_performance.get',
              'contact_tracking.getAll', 'contact_tracking.create', 'contact_tracking.update',
              'contact_tracking.record', 'contact_tracking.markReturned',
              'contacts.getAll', 'contacts.create', 'contacts.clear',  // v2.7: Backend-only checkmarks
              'eligibility.check', 'eligibility.checkBatch',
              'webhook_events.getDeliveryStats', 'webhook_events.getAll', 'webhook_events.getCampaignDeliveryMetrics',
              'rpc.expire_old_contacts', 'rpc.mark_customer_returned',
              'migrate.import'
            ]
          })
        };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: sanitizeError(error) })
    };
  }
};

// ==================== BLACKLIST FUNCTIONS ====================

async function getBlacklist(supabase, headers) {
  const { data, error } = await supabase
    .from('blacklist')
    .select('*')
    .order('added_at', { ascending: false });

  if (error) throw error;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ entries: data })
  };
}

async function addToBlacklist(supabase, entry, headers) {
  const { phone, customer_name, reason, source, error_code } = entry;

  if (!phone) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Phone number required' })
    };
  }

  // Upsert - update if exists, insert if not
  const { data, error } = await supabase
    .from('blacklist')
    .upsert({
      phone,
      customer_name,
      reason: reason || 'manual',
      source: source || 'manual',
      error_code,
      updated_at: new Date().toISOString()
    }, { onConflict: 'phone' })
    .select()
    .single();

  if (error) throw error;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, entry: data })
  };
}

async function removeFromBlacklist(supabase, phone, headers) {
  const { error } = await supabase
    .from('blacklist')
    .delete()
    .eq('phone', phone);

  if (error) throw error;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true })
  };
}

async function checkBlacklist(supabase, phone, headers) {
  const { data, error } = await supabase
    .from('blacklist')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  if (error) throw error;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      isBlacklisted: !!data,
      entry: data
    })
  };
}

async function importBlacklist(supabase, entries, merge, headers) {
  if (!merge) {
    // Clear existing blacklist
    await supabase.from('blacklist').delete().neq('phone', '');
  }

  // Insert all entries
  const { data, error } = await supabase
    .from('blacklist')
    .upsert(entries.map(e => ({
      phone: e.phone,
      customer_name: e.customer_name || e.name,
      reason: e.reason || 'csv-import',
      source: 'csv-import',
      added_at: e.added_at || new Date().toISOString()
    })), { onConflict: 'phone' });

  if (error) throw error;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      imported: entries.length
    })
  };
}

async function getBlacklistStats(supabase, headers) {
  const { data, error } = await supabase
    .from('blacklist')
    .select('reason, source');

  if (error) throw error;

  const stats = {
    total: data.length,
    byReason: {
      optOut: data.filter(e => e.reason === 'opt-out').length,
      undelivered: data.filter(e => e.reason === 'undelivered').length,
      numberBlocked: data.filter(e => e.reason === 'number-blocked').length,
      manual: data.filter(e => e.reason === 'manual').length
    },
    bySource: {
      twilioSync: data.filter(e => e.source === 'twilio-sync').length,
      manual: data.filter(e => e.source === 'manual').length,
      csvImport: data.filter(e => e.source === 'csv-import').length
    }
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(stats)
  };
}

// ==================== CAMPAIGN FUNCTIONS ====================

async function getCampaigns(supabase, headers) {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ campaigns: data })
  };
}

async function getCampaign(supabase, id, headers) {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ campaign: data })
  };
}

async function createCampaign(supabase, campaignData, headers) {
  const campaign = {
    id: `CAMP_${Date.now()}`,
    name: campaignData.name,
    template_id: campaignData.templateId,
    audience: campaignData.audience,
    audience_count: campaignData.audienceCount,
    status: 'draft',
    sends: 0,
    delivered: 0,
    // Note: 'opened' and 'converted' columns removed in schema cleanup v3.13
    // Store full campaign details for analytics
    message_body: campaignData.messageBody || null,
    contact_method: campaignData.contactMethod || 'whatsapp',
    target_segments: campaignData.targetSegments || null,
    // A/B Testing fields for discount effectiveness analysis
    discount_percent: campaignData.discountPercent || null,
    coupon_code: campaignData.couponCode || null,
    service_type: campaignData.serviceType || null
  };

  const { data, error } = await supabase
    .from('campaigns')
    .insert(campaign)
    .select()
    .single();

  if (error) throw error;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ campaign: data })
  };
}

async function updateCampaign(supabase, id, updates, headers) {
  const { data, error } = await supabase
    .from('campaigns')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ campaign: data })
  };
}

async function deleteCampaign(supabase, id, headers) {
  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', id);

  if (error) throw error;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true })
  };
}

// ==================== CAMPAIGN SENDS ====================

async function getCampaignSends(supabase, campaignId, headers) {
  let query = supabase
    .from('campaign_sends')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(100);

  if (campaignId) {
    query = query.eq('campaign_id', campaignId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ sends: data })
  };
}

async function recordCampaignSend(supabase, sendData, headers) {
  const send = {
    campaign_id: sendData.campaignId,
    recipients: sendData.recipients,
    success_count: sendData.successCount,
    failed_count: sendData.failedCount
  };

  const { data, error } = await supabase
    .from('campaign_sends')
    .insert(send)
    .select()
    .single();

  if (error) throw error;

  // Update campaign stats
  if (sendData.campaignId) {
    await supabase.rpc('increment_campaign_sends', {
      campaign_id: sendData.campaignId,
      send_count: sendData.successCount || 0
    });
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ send: data })
  };
}

// ==================== SCHEDULED CAMPAIGNS ====================

async function getScheduledCampaigns(supabase, headers) {
  const { data, error } = await supabase
    .from('scheduled_campaigns')
    .select('*')
    .order('scheduled_for', { ascending: true });

  if (error) throw error;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ scheduled: data })
  };
}

async function createScheduledCampaign(supabase, campaignData, headers) {
  const scheduled = {
    id: `SCHED_${Date.now()}`,
    campaign_id: campaignData.campaignId,
    template_id: campaignData.templateId,
    audience: campaignData.audience,
    message_body: campaignData.messageBody,
    recipients: campaignData.recipients,
    scheduled_for: campaignData.scheduledFor,
    status: 'scheduled'
  };

  const { data, error } = await supabase
    .from('scheduled_campaigns')
    .insert(scheduled)
    .select()
    .single();

  if (error) throw error;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ scheduled: data })
  };
}

async function cancelScheduledCampaign(supabase, id, headers) {
  const { data, error } = await supabase
    .from('scheduled_campaigns')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('status', 'scheduled') // Only cancel if still scheduled
    .select()
    .single();

  if (error) throw error;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, scheduled: data })
  };
}

// ==================== COMMUNICATION LOGS ====================

async function getCommLogs(supabase, params, headers) {
  const limit = parseInt(params.limit) || 100;
  const offset = parseInt(params.offset) || 0;

  let query = supabase
    .from('comm_logs')
    .select('*', { count: 'exact' })
    .order('sent_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Filter by customer_id (required for per-customer logs)
  if (params.customer_id) {
    query = query.eq('customer_id', params.customer_id);
  }

  if (params.phone) {
    query = query.eq('phone', params.phone);
  }

  if (params.channel) {
    query = query.eq('channel', params.channel);
  }

  if (params.type) {
    query = query.eq('type', params.type);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ logs: data, total: count })
  };
}

async function addCommLog(supabase, logData, headers) {
  // Build message with campaign context if available
  let message = logData.message || logData.notes || '';
  if (logData.campaign_name && !message.includes(logData.campaign_name)) {
    message = `${logData.campaign_name}: ${message}`.substring(0, 500);
  }

  const log = {
    phone: logData.phone,
    customer_id: logData.customer_id || logData.customerId, // Support both snake_case and camelCase
    channel: logData.channel || 'whatsapp',
    direction: logData.direction || 'outbound',
    message: message.substring(0, 500), // Truncate
    external_id: logData.externalId || logData.external_id,
    status: logData.status || 'sent',
    // Additional fields from schema
    type: logData.type || 'communication',
    method: logData.method,
    notes: logData.notes
  };

  const { data, error } = await supabase
    .from('comm_logs')
    .insert(log)
    .select()
    .single();

  if (error) throw error;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ log: data })
  };
}

async function getLogsByPhone(supabase, phone, headers) {
  const { data, error } = await supabase
    .from('comm_logs')
    .select('*')
    .eq('phone', phone)
    .order('sent_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ logs: data })
  };
}

// ==================== AUTOMATION RULES ====================

async function getAutomationRules(supabase, headers) {
  const { data, error } = await supabase
    .from('automation_rules')
    .select('*')
    .order('id');

  if (error) {
    // If table doesn't exist or is empty, return defaults
    if (error.code === 'PGRST116') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ rules: getDefaultAutomationRules() })
      };
    }
    throw error;
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ rules: data.length > 0 ? data : getDefaultAutomationRules() })
  };
}

async function saveAutomationRules(supabase, rules, headers) {
  // Upsert all rules with ALL configurable fields (including v6.0 enhanced controls)
  const { data, error } = await supabase
    .from('automation_rules')
    .upsert(rules.map(r => ({
      id: r.id,
      name: r.name,
      enabled: r.enabled,
      trigger_type: r.trigger?.type,
      trigger_value: r.trigger?.value,
      action_template: r.action?.template,
      action_channel: r.action?.channel,
      // Configurable automation controls
      cooldown_days: r.cooldown_days,
      valid_until: r.valid_until,
      max_total_sends: r.max_total_sends,
      // Coupon configuration
      coupon_code: r.coupon_code,
      discount_percent: r.discount_percent,
      coupon_validity_days: r.coupon_validity_days,
      // v6.0: Enhanced automation controls
      send_window_start: r.send_window_start,
      send_window_end: r.send_window_end,
      send_days: r.send_days,
      max_daily_sends: r.max_daily_sends,
      exclude_recent_days: r.exclude_recent_days,
      min_total_spent: r.min_total_spent,
      wallet_balance_max: r.wallet_balance_max
    })), { onConflict: 'id' });

  if (error) throw error;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true })
  };
}

function getDefaultAutomationRules() {
  return [
    {
      id: 'winback_30',
      name: 'Win-back 30 dias',
      enabled: false,
      trigger: { type: 'days_since_visit', value: 30 },
      action: { template: 'winback_discount', channel: 'whatsapp' },
      cooldown_days: 30,
      coupon_code: 'VOLTE20',
      discount_percent: 20,
      coupon_validity_days: 7,
      // v6.0: Enhanced controls
      send_window_start: '09:00',
      send_window_end: '20:00',
      send_days: [1, 2, 3, 4, 5],
      max_daily_sends: null,
      exclude_recent_days: 3,
      min_total_spent: null,
      wallet_balance_max: null
    },
    {
      id: 'winback_45',
      name: 'Win-back Crítico',
      enabled: false,
      trigger: { type: 'days_since_visit', value: 45 },
      action: { template: 'winback_critical', channel: 'whatsapp' },
      cooldown_days: 21,
      coupon_code: 'VOLTE30',
      discount_percent: 30,
      coupon_validity_days: 7,
      // v6.0: Enhanced controls
      send_window_start: '09:00',
      send_window_end: '20:00',
      send_days: [1, 2, 3, 4, 5],
      max_daily_sends: null,
      exclude_recent_days: 3,
      min_total_spent: 50,
      wallet_balance_max: null
    },
    {
      id: 'welcome_new',
      name: 'Boas-vindas',
      enabled: false,
      trigger: { type: 'first_purchase', value: 1 },
      action: { template: 'welcome_new', channel: 'whatsapp' },
      cooldown_days: 365,
      coupon_code: 'BEM10',
      discount_percent: 10,
      coupon_validity_days: 14,
      // v6.0: Enhanced controls
      send_window_start: '09:00',
      send_window_end: '20:00',
      send_days: [1, 2, 3, 4, 5],
      max_daily_sends: null,
      exclude_recent_days: null,
      min_total_spent: null,
      wallet_balance_max: null
    },
    {
      id: 'wallet_reminder',
      name: 'Lembrete de saldo',
      enabled: false,
      trigger: { type: 'wallet_balance', value: 20 },
      action: { template: 'wallet_reminder', channel: 'whatsapp' },
      cooldown_days: 14,
      // v6.0: Enhanced controls
      send_window_start: '09:00',
      send_window_end: '20:00',
      send_days: [1, 2, 3, 4, 5],
      max_daily_sends: null,
      exclude_recent_days: null,
      min_total_spent: null,
      wallet_balance_max: 200
    },
    {
      id: 'post_visit',
      name: 'Pós-Visita',
      enabled: false,
      trigger: { type: 'hours_after_visit', value: 24 },
      action: { template: 'post_visit_thanks', channel: 'whatsapp' },
      cooldown_days: 7,
      // v6.0: Enhanced controls
      send_window_start: '09:00',
      send_window_end: '20:00',
      send_days: [1, 2, 3, 4, 5, 6, 7],
      max_daily_sends: null,
      exclude_recent_days: null,
      min_total_spent: null,
      wallet_balance_max: null
    }
  ];
}

// ==================== DATA MIGRATION ====================

async function migrateFromLocalStorage(supabase, data, headers) {
  const results = {
    blacklist: { imported: 0, errors: [] },
    campaigns: { imported: 0, errors: [] },
    campaignSends: { imported: 0, errors: [] },
    scheduledCampaigns: { imported: 0, errors: [] },
    commLogs: { imported: 0, errors: [] },
    automationRules: { imported: 0, errors: [] }
  };

  // Migrate blacklist
  if (data.blacklist && data.blacklist.length > 0) {
    try {
      const { error } = await supabase
        .from('blacklist')
        .upsert(data.blacklist.map(([phone, entry]) => ({
          phone,
          customer_name: entry.name,
          reason: entry.reason,
          source: entry.source || 'migration',
          error_code: entry.errorCode,
          added_at: entry.addedAt || new Date().toISOString()
        })), { onConflict: 'phone' });

      if (error) throw error;
      results.blacklist.imported = data.blacklist.length;
    } catch (e) {
      results.blacklist.errors.push(e.message);
    }
  }

  // Migrate campaigns
  // Note: 'opened' and 'converted' columns removed in schema cleanup v3.13
  if (data.campaigns && data.campaigns.length > 0) {
    try {
      const { error } = await supabase
        .from('campaigns')
        .upsert(data.campaigns.map(c => ({
          id: c.id,
          name: c.name,
          template_id: c.templateId,
          audience: c.audience,
          audience_count: c.audienceCount,
          status: c.status,
          sends: c.sends,
          delivered: c.delivered,
          created_at: c.createdAt,
          updated_at: c.updatedAt,
          last_sent_at: c.lastSentAt
        })), { onConflict: 'id' });

      if (error) throw error;
      results.campaigns.imported = data.campaigns.length;
    } catch (e) {
      results.campaigns.errors.push(e.message);
    }
  }

  // Migrate campaign sends
  if (data.campaignSends && data.campaignSends.length > 0) {
    try {
      const { error } = await supabase
        .from('campaign_sends')
        .insert(data.campaignSends.map(s => ({
          campaign_id: s.campaignId,
          recipients: s.recipients,
          success_count: s.successCount,
          failed_count: s.failedCount,
          sent_at: s.timestamp
        })));

      if (error) throw error;
      results.campaignSends.imported = data.campaignSends.length;
    } catch (e) {
      results.campaignSends.errors.push(e.message);
    }
  }

  // Migrate scheduled campaigns
  if (data.scheduledCampaigns && data.scheduledCampaigns.length > 0) {
    try {
      const { error } = await supabase
        .from('scheduled_campaigns')
        .upsert(data.scheduledCampaigns.map(s => ({
          id: s.id,
          campaign_id: s.campaignId,
          template_id: s.templateId,
          audience: s.audience,
          message_body: s.messageBody,
          recipients: s.recipients,
          scheduled_for: s.scheduledFor,
          status: s.status,
          created_at: s.createdAt
        })), { onConflict: 'id' });

      if (error) throw error;
      results.scheduledCampaigns.imported = data.scheduledCampaigns.length;
    } catch (e) {
      results.scheduledCampaigns.errors.push(e.message);
    }
  }

  // Migrate comm logs
  if (data.commLogs && data.commLogs.length > 0) {
    try {
      const { error } = await supabase
        .from('comm_logs')
        .insert(data.commLogs.map(l => ({
          phone: l.phone,
          customer_id: l.customerId,
          channel: l.channel,
          direction: 'outbound',
          message: l.message?.substring(0, 500),
          external_id: l.externalId,
          status: l.status || 'sent',
          sent_at: l.timestamp
        })));

      if (error) throw error;
      results.commLogs.imported = data.commLogs.length;
    } catch (e) {
      results.commLogs.errors.push(e.message);
    }
  }

  // Migrate automation rules
  if (data.automationRules && data.automationRules.length > 0) {
    try {
      const { error } = await supabase
        .from('automation_rules')
        .upsert(data.automationRules.map(r => ({
          id: r.id,
          name: r.name,
          enabled: r.enabled,
          trigger_type: r.trigger?.type,
          trigger_value: r.trigger?.value,
          action_template: r.action?.template,
          action_channel: r.action?.channel
        })), { onConflict: 'id' });

      if (error) throw error;
      results.automationRules.imported = data.automationRules.length;
    } catch (e) {
      results.automationRules.errors.push(e.message);
    }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      results
    })
  };
}

// ==================== CAMPAIGN EFFECTIVENESS FUNCTIONS ====================

async function getCampaignEffectiveness(supabase, params, headers) {
  // Query the campaign_effectiveness view
  let query = supabase
    .from('campaign_effectiveness')
    .select('*');

  if (params.campaign_id) {
    query = query.eq('campaign_id', params.campaign_id);
  }

  const { data, error } = await query;

  if (error) {
    // If view doesn't exist, return empty array (graceful fallback)
    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([])
      };
    }
    throw error;
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(data || [])
  };
}

async function getContactEffectivenessSummary(supabase, headers) {
  // Query the contact_effectiveness_summary view
  const { data, error } = await supabase
    .from('contact_effectiveness_summary')
    .select('*');

  if (error) {
    // If view doesn't exist, return empty array (graceful fallback)
    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([])
      };
    }
    throw error;
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(data || [])
  };
}

async function getCampaignContacts(supabase, campaignId, headers) {
  if (!campaignId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'campaign_id required' })
    };
  }

  // Query contact_tracking directly by campaign_id
  // This works for both manual campaigns AND automations (which don't use campaign_contacts bridge)
  const { data, error } = await supabase
    .from('contact_tracking')
    .select(`
      id,
      campaign_id,
      customer_id,
      customer_name,
      contact_method,
      status,
      contacted_at,
      expires_at,
      return_date,
      return_revenue,
      days_to_return
    `)
    .eq('campaign_id', campaignId)
    .order('contacted_at', { ascending: false });

  if (error) {
    // If table doesn't exist, return empty array
    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ campaign_contacts: [] })
      };
    }
    throw error;
  }

  // Transform data to match expected format (contact_tracking embedded in each record)
  const transformed = (data || []).map(ct => ({
    id: ct.id,
    campaign_id: ct.campaign_id,
    customer_id: ct.customer_id,
    customer_name: ct.customer_name,
    phone: null, // contact_tracking doesn't store phone directly
    sent_at: ct.contacted_at,
    contact_tracking: {
      status: ct.status,
      return_date: ct.return_date,
      return_revenue: ct.return_revenue,
      days_to_return: ct.days_to_return
    }
  }));

  console.log(`[API] getCampaignContacts: Loaded ${transformed.length} contacts for campaign ${campaignId} (from contact_tracking)`);

  // Return with key matching table name for api.get() compatibility
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ campaign_contacts: transformed })
  };
}

/**
 * Get all campaigns with performance metrics from campaign_performance view
 * Used by CampaignList to display campaigns with return rates
 * @param {object} filters - Optional filters (id, audience, etc.)
 */
async function getAllCampaignPerformance(supabase, filters = {}, headers) {
  // Query the campaign_performance view
  let query = supabase
    .from('campaign_performance')
    .select('*');

  // Apply id filter if provided (for single campaign fetch)
  if (filters?.id) {
    query = query.eq('id', filters.id);
  }

  // Apply other optional filters
  if (filters?.audience) {
    query = query.eq('audience', filters.audience);
  }

  // Order by creation date
  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    // If view doesn't exist, return empty array (graceful fallback)
    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
      console.log('[API] campaign_performance view not found, returning empty array');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ campaign_performance: [] })
      };
    }
    throw error;
  }

  console.log(`[API] getAllCampaignPerformance: Loaded ${data?.length || 0} campaigns${filters?.id ? ` (filtered by id: ${filters.id})` : ''}`);

  // Return with key matching table name for api.get() compatibility
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ campaign_performance: data || [] })
  };
}

async function getCampaignPerformance(supabase, campaignId, headers) {
  if (!campaignId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'campaign_id required' })
    };
  }

  // Get campaign performance from the view
  const { data, error } = await supabase
    .from('campaign_performance')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (error) {
    // If view doesn't exist or campaign not found, return null
    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(null)
      };
    }
    throw error;
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(data)
  };
}

// ==================== CONTACT TRACKING FUNCTIONS ====================

/**
 * Record a campaign contact with full tracking (mirrors record_automation_contact SQL function)
 * Creates entries in: contact_tracking, campaign_contacts (with twilio_sid)
 * Updates campaign sends count
 *
 * This is the unified flow for manual campaigns - send first, then record with message_sid
 */
async function recordCampaignContactWithTracking(supabase, data, headers) {
  const {
    campaignId,
    customerId,
    customerName,
    phone,
    twilioSid,
    contactMethod = 'whatsapp',
    campaignType = null,  // For unified cooldown tracking
    couponValidityDays = 7  // v2.8: Configurable coupon validity for expires_at
  } = data;

  if (!campaignId || !customerId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'campaignId and customerId required' })
    };
  }

  try {
    // 1. Get campaign info for the contact_tracking record
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('name, template_id')
      .eq('id', campaignId)
      .single();

    const campaignName = campaign?.name || campaignId;

    // Infer campaign_type from template_id or name if not provided
    let inferredType = campaignType;
    if (!inferredType && campaign) {
      const templateId = campaign.template_id || '';
      const name = (campaign.name || '').toLowerCase();
      if (templateId.includes('winback') || name.includes('win') || name.includes('volte')) {
        inferredType = 'winback';
      } else if (templateId.includes('welcome') || name.includes('boas') || name.includes('bem-vindo')) {
        inferredType = 'welcome';
      } else if (templateId.includes('wallet') || name.includes('saldo') || name.includes('carteira')) {
        inferredType = 'wallet';
      } else if (templateId.includes('promo') || name.includes('promo') || name.includes('desconto')) {
        inferredType = 'promo';
      } else if (templateId.includes('upsell') || name.includes('secagem') || name.includes('complete')) {
        inferredType = 'upsell';
      } else if (templateId.includes('post_visit') || name.includes('pós') || name.includes('visita')) {
        inferredType = 'post_visit';
      } else {
        inferredType = 'other';
      }
    }

    // 2. Create contact_tracking record WITH campaign_type
    // v2.8: expires_at uses couponValidityDays + 3 day buffer (matches SQL record_automation_contact)
    const RETURN_ATTRIBUTION_BUFFER = 3;  // Extra days to catch late returns
    const expiryDays = couponValidityDays + RETURN_ATTRIBUTION_BUFFER;

    const { data: tracking, error: trackingError } = await supabase
      .from('contact_tracking')
      .insert({
        customer_id: customerId,
        customer_name: customerName,
        contact_method: contactMethod,
        campaign_id: campaignId,
        campaign_name: campaignName,
        campaign_type: inferredType,  // Include campaign_type for cooldowns
        status: 'pending',
        contacted_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (trackingError) {
      console.error('[API] Error creating contact_tracking:', trackingError);
      throw trackingError;
    }

    // 3. Create campaign_contacts bridge record WITH twilio_sid
    const { data: contactRecord, error: contactError } = await supabase
      .from('campaign_contacts')
      .insert({
        campaign_id: campaignId,
        contact_tracking_id: tracking.id,
        customer_id: customerId,
        customer_name: customerName,
        phone: phone,
        delivery_status: 'sent',
        twilio_sid: twilioSid || null,
        sent_at: new Date().toISOString()
      })
      .select()
      .single();

    if (contactError) {
      console.error('[API] Error creating campaign_contacts:', contactError);
      // Don't throw - tracking record was created successfully
    }

    // 4. Update campaign sends count
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({
        sends: supabase.rpc ? undefined : 1, // Will use increment below
        last_sent_at: new Date().toISOString(),
        status: 'active'
      })
      .eq('id', campaignId);

    // Increment sends count using RPC or manual update
    await supabase.rpc('increment_campaign_sends', {
      p_campaign_id: campaignId,
      p_send_count: 1
    }).catch(async (rpcErr) => {
      // Fallback: read-then-write if RPC fails
      const { data: currentCampaign } = await supabase
        .from('campaigns')
        .select('sends')
        .eq('id', campaignId)
        .single();

      await supabase
        .from('campaigns')
        .update({ sends: (currentCampaign?.sends || 0) + 1 })
        .eq('id', campaignId);
    });

    console.log(`[API] Recorded campaign contact: campaign=${campaignId}, customer=${customerId}, twilio_sid=${twilioSid || 'none'}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        tracking,
        contact: contactRecord,
        campaignId
      })
    };
  } catch (error) {
    console.error('[API] recordCampaignContactWithTracking failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}

async function recordContactTracking(supabase, trackingData, headers) {
  const { customerId, campaignId, customerName, phone, contactMethod } = trackingData;

  if (!customerId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'customerId required' })
    };
  }

  // Insert into contact_tracking
  const { data: tracking, error: trackingError } = await supabase
    .from('contact_tracking')
    .upsert({
      customer_id: customerId,
      contact_method: contactMethod || 'whatsapp',
      status: 'pending',
      contacted_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }, { onConflict: 'customer_id' })
    .select()
    .single();

  if (trackingError) throw trackingError;

  // If campaign, also insert into campaign_contacts
  if (campaignId) {
    await supabase
      .from('campaign_contacts')
      .insert({
        campaign_id: campaignId,
        customer_id: customerId,
        customer_name: customerName,
        phone: phone
      });
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, tracking })
  };
}

async function markContactReturned(supabase, data, headers) {
  const { customerId, revenue } = data;

  if (!customerId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'customerId required' })
    };
  }

  // Find the contact tracking record
  const { data: existing, error: findError } = await supabase
    .from('contact_tracking')
    .select('*')
    .eq('customer_id', customerId)
    .eq('status', 'pending')
    .single();

  if (findError || !existing) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'No pending contact found for customer' })
    };
  }

  // Calculate days to return
  const contactedAt = new Date(existing.contacted_at);
  const now = new Date();
  const daysToReturn = Math.floor((now - contactedAt) / (24 * 60 * 60 * 1000));

  // Update the record
  const { data: updated, error: updateError } = await supabase
    .from('contact_tracking')
    .update({
      status: 'returned',
      return_date: now.toISOString(),
      return_revenue: revenue || 0,
      days_to_return: daysToReturn
    })
    .eq('id', existing.id)
    .select()
    .single();

  if (updateError) throw updateError;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, tracking: updated })
  };
}

// ==================== CONTACT TRACKING CRUD ====================

async function getContactTracking(supabase, params, headers) {
  let query = supabase
    .from('contact_tracking')
    .select('*')
    .order('contacted_at', { ascending: false });

  // Apply filters
  if (params.customer_id) {
    query = query.eq('customer_id', params.customer_id);
  }
  if (params.status) {
    query = query.eq('status', params.status);
  }
  if (params.campaign_id) {
    query = query.eq('campaign_id', params.campaign_id);
  }
  if (params.limit) {
    query = query.limit(parseInt(params.limit));
  }

  const { data, error } = await query;

  if (error) {
    // If table doesn't exist, return empty array
    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ contact_tracking: [] })
      };
    }
    throw error;
  }

  return {
    statusCode: 200,
    headers,
    // Return both keys for compatibility: contact_tracking (legacy) and contacts (v2.7+)
    body: JSON.stringify({ contact_tracking: data || [], contacts: data || [] })
  };
}

async function createContactTracking(supabase, data, headers) {
  // Calculate defaults for required fields
  const now = new Date();
  const expiryDays = data.campaign_type === 'manual' ? 7 : 14; // Manual contacts expire in 7 days
  const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);

  const record = {
    customer_id: data.customer_id,
    customer_name: data.customer_name,
    contact_method: data.contact_method || 'manual',
    campaign_id: data.campaign_id || null,
    campaign_name: data.campaign_name || (data.campaign_id ? null : 'Contato Manual'),
    campaign_type: data.campaign_type || (data.campaign_id ? null : 'manual'),
    risk_level: data.risk_level || null,
    status: data.status || 'pending',
    contacted_at: data.contacted_at || now.toISOString(),
    expires_at: data.expires_at || expiresAt.toISOString(),
    notes: data.notes || null
  };

  const { data: created, error } = await supabase
    .from('contact_tracking')
    .insert(record)
    .select()
    .single();

  if (error) throw error;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ contact_tracking: created, contact: created })
  };
}

async function updateContactTracking(supabase, body, headers) {
  const { data: updateData, filters } = body;

  let query = supabase
    .from('contact_tracking')
    .update(updateData);

  // Apply filters
  if (filters?.customer_id) {
    query = query.eq('customer_id', filters.customer_id);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.id) {
    query = query.eq('id', filters.id);
  }

  const { data, error } = await query.select();

  if (error) throw error;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, updated: data?.length || 0 })
  };
}

/**
 * Clear contact status - mark pending contact as 'cleared'
 * Used when user manually unchecks the "contacted" checkbox
 */
async function clearContactStatus(supabase, body, headers) {
  const customerId = body.customer_id || body.customerId;

  if (!customerId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'customerId required' })
    };
  }

  // Update pending contacts for this customer to 'cleared'
  const { data, error } = await supabase
    .from('contact_tracking')
    .update({
      status: 'cleared',
      updated_at: new Date().toISOString()
    })
    .eq('customer_id', customerId)
    .eq('status', 'pending')
    .select();

  if (error) throw error;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      cleared: data?.length || 0,
      customerId
    })
  };
}

// ==================== RPC FUNCTIONS ====================

async function expireOldContacts(supabase, headers) {
  const now = new Date().toISOString();

  // Update all pending contacts where expires_at has passed
  const { data, error } = await supabase
    .from('contact_tracking')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('expires_at', now)
    .select();

  if (error) {
    // If table doesn't exist, return 0
    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ data: 0 })
      };
    }
    throw error;
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ data: data?.length || 0 })
  };
}

async function markCustomerReturnedRpc(supabase, body, headers) {
  const { p_customer_id, p_return_date, p_revenue } = body;

  if (!p_customer_id) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'customerId required' })
    };
  }

  // Find pending contacts for this customer that were created before the return date
  const { data: pending, error: findError } = await supabase
    .from('contact_tracking')
    .select('*')
    .eq('customer_id', p_customer_id)
    .eq('status', 'pending')
    .lt('contacted_at', p_return_date);

  if (findError) {
    if (findError.code === 'PGRST116' || findError.message?.includes('does not exist')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ data: 0 })
      };
    }
    throw findError;
  }

  if (!pending || pending.length === 0) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ data: 0 })
    };
  }

  // Update all matching records
  let updated = 0;
  for (const record of pending) {
    const contactedAt = new Date(record.contacted_at);
    const returnDate = new Date(p_return_date);
    const daysToReturn = Math.floor((returnDate - contactedAt) / (24 * 60 * 60 * 1000));

    const { error: updateError } = await supabase
      .from('contact_tracking')
      .update({
        status: 'returned',
        returned_at: p_return_date,
        days_to_return: daysToReturn,
        return_revenue: (record.return_revenue || 0) + (p_revenue || 0)
      })
      .eq('id', record.id);

    if (!updateError) {
      updated++;
    }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ data: updated })
  };
}

// ==================== WEBHOOK EVENTS FUNCTIONS ====================

/**
 * Get delivery statistics from webhook_events
 * Used to calculate real delivery rates instead of estimates
 */
async function getDeliveryStats(supabase, params, headers) {
  const days = parseInt(params.days) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    // Get all delivery status events in the time range
    const { data, error } = await supabase
      .from('webhook_events')
      .select('payload, created_at')
      .eq('event_type', 'delivery_status')
      .gte('created_at', startDate.toISOString());

    if (error) {
      // Graceful fallback if table doesn't exist
      if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            stats: { sent: 0, delivered: 0, read: 0, failed: 0, undelivered: 0 },
            deliveryRate: 0,
            readRate: 0,
            hasRealData: false
          })
        };
      }
      throw error;
    }

    // Count status occurrences (payload stores the status: sent, delivered, read, failed, undelivered)
    const stats = {
      sent: 0,
      queued: 0,
      delivered: 0,
      read: 0,
      failed: 0,
      undelivered: 0
    };

    (data || []).forEach(event => {
      const status = (event.payload || '').toLowerCase();
      if (stats.hasOwnProperty(status)) {
        stats[status]++;
      }
    });

    // Calculate rates
    const totalSent = stats.sent + stats.queued + stats.delivered + stats.read + stats.failed + stats.undelivered;
    const totalDelivered = stats.delivered + stats.read; // read implies delivered
    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const readRate = totalDelivered > 0 ? (stats.read / totalDelivered) * 100 : 0;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        stats,
        totalSent,
        totalDelivered,
        deliveryRate: Math.round(deliveryRate * 10) / 10,
        readRate: Math.round(readRate * 10) / 10,
        hasRealData: totalSent > 0
      })
    };
  } catch (error) {
    console.error('[getDeliveryStats] Error:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        stats: { sent: 0, delivered: 0, read: 0, failed: 0, undelivered: 0 },
        deliveryRate: 0,
        readRate: 0,
        hasRealData: false,
        error: 'Failed to fetch delivery stats'
      })
    };
  }
}

/**
 * Get raw webhook events for debugging/analysis
 */
async function getWebhookEvents(supabase, params, headers) {
  const limit = Math.min(parseInt(params.limit) || 100, 500);
  const eventType = params.event_type;

  let query = supabase
    .from('webhook_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (eventType) {
    query = query.eq('event_type', eventType);
  }

  const { data, error } = await query;

  if (error) {
    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ events: [], message: 'webhook_events table not found' })
      };
    }
    throw error;
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ events: data || [] })
  };
}

/**
 * Get per-campaign delivery metrics from campaign_delivery_metrics view
 * Returns delivered/read counts and rates for each campaign
 */
async function getCampaignDeliveryMetrics(supabase, headers) {
  try {
    const { data, error } = await supabase
      .from('campaign_delivery_metrics')
      .select('*');

    if (error) {
      // Graceful fallback if view doesn't exist
      if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ metrics: [], hasView: false })
        };
      }
      throw error;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ metrics: data || [], hasView: true })
    };
  } catch (error) {
    console.error('[getCampaignDeliveryMetrics] Error:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ metrics: [], hasView: false, error: 'Failed to fetch delivery metrics' })
    };
  }
}

// ==================== CONTACT ELIGIBILITY FUNCTIONS ====================

/**
 * Check if a single customer is eligible for campaign contact
 * Uses the is_customer_contactable() SQL function for unified logic
 *
 * @param {Object} data - { customerId, campaignType?, minDaysGlobal?, minDaysSameType? }
 * @returns {Object} Eligibility result with reason
 */
async function checkCustomerEligibility(supabase, data, headers) {
  const {
    customerId,
    campaignType = null,
    minDaysGlobal = 7,
    minDaysSameType = 30
  } = data;

  if (!customerId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'customerId required' })
    };
  }

  try {
    // Try to use the SQL function first
    const { data: result, error } = await supabase.rpc('is_customer_contactable', {
      p_customer_id: customerId,
      p_campaign_type: campaignType,
      p_min_days_global: minDaysGlobal,
      p_min_days_same_type: minDaysSameType
    });

    if (error) {
      console.warn('[API] is_customer_contactable RPC failed, using fallback:', error.message);
      // Fallback: query contact_tracking directly
      return await checkEligibilityFallback(supabase, customerId, campaignType, minDaysGlobal, minDaysSameType, headers);
    }

    // RPC returns array, get first row
    const eligibility = Array.isArray(result) ? result[0] : result;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        customerId,
        isEligible: eligibility?.is_eligible ?? true,
        reason: eligibility?.reason || 'Elegível para contato',
        lastContactDate: eligibility?.last_contact_date || null,
        lastCampaignType: eligibility?.last_campaign_type || null,
        lastCampaignName: eligibility?.last_campaign_name || null,
        daysSinceContact: eligibility?.days_since_contact || null,
        daysUntilEligible: eligibility?.days_until_eligible || 0
      })
    };
  } catch (error) {
    console.error('[API] checkCustomerEligibility error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}

/**
 * Fallback eligibility check using direct queries
 * Used when is_customer_contactable() SQL function isn't available
 */
async function checkEligibilityFallback(supabase, customerId, campaignType, minDaysGlobal, minDaysSameType, headers) {
  try {
    // Find most recent contact
    const { data: contacts, error } = await supabase
      .from('contact_tracking')
      .select('contacted_at, campaign_type, campaign_name, status')
      .eq('customer_id', customerId)
      .in('status', ['pending', 'returned'])
      .order('contacted_at', { ascending: false })
      .limit(1);

    if (error && !error.message?.includes('does not exist')) {
      throw error;
    }

    // No previous contact = eligible
    if (!contacts || contacts.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          customerId,
          isEligible: true,
          reason: 'Nenhum contato anterior',
          lastContactDate: null,
          lastCampaignType: null,
          daysSinceContact: null,
          daysUntilEligible: 0
        })
      };
    }

    const lastContact = contacts[0];
    const daysSince = Math.floor(
      (Date.now() - new Date(lastContact.contacted_at).getTime()) / (24 * 60 * 60 * 1000)
    );

    // Check global cooldown
    if (daysSince < minDaysGlobal) {
      const daysUntil = minDaysGlobal - daysSince;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          customerId,
          isEligible: false,
          reason: `Contactado há ${daysSince} dias. Aguarde mais ${daysUntil} dias.`,
          lastContactDate: lastContact.contacted_at,
          lastCampaignType: lastContact.campaign_type,
          lastCampaignName: lastContact.campaign_name,
          daysSinceContact: daysSince,
          daysUntilEligible: daysUntil
        })
      };
    }

    // Check same campaign type cooldown
    if (campaignType && lastContact.campaign_type === campaignType) {
      if (daysSince < minDaysSameType) {
        const daysUntil = minDaysSameType - daysSince;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            customerId,
            isEligible: false,
            reason: `Já recebeu campanha "${campaignType}" há ${daysSince} dias. Aguarde mais ${daysUntil} dias.`,
            lastContactDate: lastContact.contacted_at,
            lastCampaignType: lastContact.campaign_type,
            lastCampaignName: lastContact.campaign_name,
            daysSinceContact: daysSince,
            daysUntilEligible: daysUntil
          })
        };
      }
    }

    // Eligible
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        customerId,
        isEligible: true,
        reason: 'Elegível para contato',
        lastContactDate: lastContact.contacted_at,
        lastCampaignType: lastContact.campaign_type,
        lastCampaignName: lastContact.campaign_name,
        daysSinceContact: daysSince,
        daysUntilEligible: 0
      })
    };
  } catch (error) {
    console.error('[API] checkEligibilityFallback error:', error);
    // On error, assume eligible (don't block campaigns due to errors)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        customerId,
        isEligible: true,
        reason: 'Erro ao verificar - assumindo elegível',
        error: error.message
      })
    };
  }
}

/**
 * Batch check eligibility for multiple customers
 * More efficient than checking one by one
 *
 * @param {Object} data - { customerIds: string[], campaignType?, minDaysGlobal?, minDaysSameType? }
 * @returns {Object} Map of customerId -> eligibility result
 */
async function checkCustomersEligibilityBatch(supabase, data, headers) {
  const {
    customerIds,
    campaignType = null,
    minDaysGlobal = 7,
    minDaysSameType = 30
  } = data;

  if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'customerIds array required' })
    };
  }

  // Limit batch size to prevent timeouts
  const MAX_BATCH = 500;
  const idsToCheck = customerIds.slice(0, MAX_BATCH);

  try {
    // Try to use the batch SQL function
    const { data: result, error } = await supabase.rpc('check_customers_eligibility', {
      p_customer_ids: idsToCheck,
      p_campaign_type: campaignType,
      p_min_days_global: minDaysGlobal,
      p_min_days_same_type: minDaysSameType
    });

    if (error) {
      console.warn('[API] check_customers_eligibility RPC failed, using fallback:', error.message);
      // Fallback: check each one individually
      return await checkBatchEligibilityFallback(supabase, idsToCheck, campaignType, minDaysGlobal, minDaysSameType, headers);
    }

    // Build response map
    const eligibilityMap = {};
    const eligible = [];
    const ineligible = [];

    for (const row of (result || [])) {
      const entry = {
        customerId: row.customer_id,
        isEligible: row.is_eligible,
        reason: row.reason,
        lastContactDate: row.last_contact_date,
        daysSinceContact: row.days_since_contact,
        daysUntilEligible: row.days_until_eligible
      };
      eligibilityMap[row.customer_id] = entry;

      if (row.is_eligible) {
        eligible.push(row.customer_id);
      } else {
        ineligible.push(entry);
      }
    }

    // Fill in any missing IDs as eligible (no contact history)
    for (const id of idsToCheck) {
      if (!eligibilityMap[id]) {
        eligibilityMap[id] = {
          customerId: id,
          isEligible: true,
          reason: 'Nenhum contato anterior',
          daysUntilEligible: 0
        };
        eligible.push(id);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        total: idsToCheck.length,
        eligibleCount: eligible.length,
        ineligibleCount: ineligible.length,
        eligible,
        ineligible,
        eligibilityMap,
        truncated: customerIds.length > MAX_BATCH
      })
    };
  } catch (error) {
    console.error('[API] checkCustomersEligibilityBatch error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}

/**
 * Fallback batch eligibility check using direct queries
 */
async function checkBatchEligibilityFallback(supabase, customerIds, campaignType, minDaysGlobal, minDaysSameType, headers) {
  try {
    // Get all recent contacts for these customers
    const { data: contacts, error } = await supabase
      .from('contact_tracking')
      .select('customer_id, contacted_at, campaign_type, campaign_name, status')
      .in('customer_id', customerIds)
      .in('status', ['pending', 'returned'])
      .order('contacted_at', { ascending: false });

    if (error && !error.message?.includes('does not exist')) {
      throw error;
    }

    // Group contacts by customer (most recent first)
    const contactsByCustomer = {};
    for (const contact of (contacts || [])) {
      if (!contactsByCustomer[contact.customer_id]) {
        contactsByCustomer[contact.customer_id] = contact;
      }
    }

    // Check eligibility for each customer
    const eligibilityMap = {};
    const eligible = [];
    const ineligible = [];

    for (const customerId of customerIds) {
      const lastContact = contactsByCustomer[customerId];

      if (!lastContact) {
        // No previous contact = eligible
        eligibilityMap[customerId] = {
          customerId,
          isEligible: true,
          reason: 'Nenhum contato anterior',
          daysUntilEligible: 0
        };
        eligible.push(customerId);
        continue;
      }

      const daysSince = Math.floor(
        (Date.now() - new Date(lastContact.contacted_at).getTime()) / (24 * 60 * 60 * 1000)
      );

      // Check global cooldown
      if (daysSince < minDaysGlobal) {
        const daysUntil = minDaysGlobal - daysSince;
        const entry = {
          customerId,
          isEligible: false,
          reason: `Contactado há ${daysSince} dias. Aguarde mais ${daysUntil} dias.`,
          lastContactDate: lastContact.contacted_at,
          daysSinceContact: daysSince,
          daysUntilEligible: daysUntil
        };
        eligibilityMap[customerId] = entry;
        ineligible.push(entry);
        continue;
      }

      // Check same campaign type cooldown
      if (campaignType && lastContact.campaign_type === campaignType && daysSince < minDaysSameType) {
        const daysUntil = minDaysSameType - daysSince;
        const entry = {
          customerId,
          isEligible: false,
          reason: `Já recebeu campanha "${campaignType}" há ${daysSince} dias.`,
          lastContactDate: lastContact.contacted_at,
          daysSinceContact: daysSince,
          daysUntilEligible: daysUntil
        };
        eligibilityMap[customerId] = entry;
        ineligible.push(entry);
        continue;
      }

      // Eligible
      eligibilityMap[customerId] = {
        customerId,
        isEligible: true,
        reason: 'Elegível para contato',
        lastContactDate: lastContact.contacted_at,
        daysSinceContact: daysSince,
        daysUntilEligible: 0
      };
      eligible.push(customerId);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        total: customerIds.length,
        eligibleCount: eligible.length,
        ineligibleCount: ineligible.length,
        eligible,
        ineligible,
        eligibilityMap
      })
    };
  } catch (error) {
    console.error('[API] checkBatchEligibilityFallback error:', error);
    // On error, assume all eligible
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        total: customerIds.length,
        eligibleCount: customerIds.length,
        ineligibleCount: 0,
        eligible: customerIds,
        ineligible: [],
        eligibilityMap: Object.fromEntries(
          customerIds.map(id => [id, { customerId: id, isEligible: true, reason: 'Erro ao verificar - assumindo elegível' }])
        ),
        error: error.message
      })
    };
  }
}
