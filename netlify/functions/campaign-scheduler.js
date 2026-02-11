// netlify/functions/campaign-scheduler.js
// Scheduled function to execute pending campaigns and automation rules
// Runs every 5 minutes via Netlify Scheduled Functions
//
// v3.2 (2026-01-24): New automation types and one-time sends
//   - Added 4 new trigger types: rfm_segment, weather_drying_pain, registration_anniversary, churned_days
//   - Added template SIDs and campaign type mappings for new automations
//   - Added one-time send enforcement for welcome (welcome_sent_at) and post_visit (post_visit_sent_at)
//   - Added tracking updates: last_weather_campaign_date, last_anniversary_year
//   - Added buildContentVariables handlers for new templates
//   - Anniversary automation bypasses global cooldown (special occasion)
//
// v3.1 (2026-01-20): Schema consolidation
//   - Model storage consolidated to app_settings.revenue_model
//   - Removed model_coefficients and model_training_history writes
//   - Drift detection now updates app_settings.revenue_model directly
//
// v3.0 (2026-01-20): Prediction tracking and drift detection
//   - Added evaluatePredictions() to compare yesterday's prediction with actual
//   - Added checkModelDrift() to detect when recent errors exceed baseline
//   - Updated runRevenueModelTraining() to run evaluation and drift checks
//   - Enables honest out-of-sample accuracy metrics in ModelDiagnostics UI
//
// v2.17 (2025-12-21): Enhanced model training with holidays & tiered complexity
//   - Added Brazilian holiday detection (fixed + Easter-based)
//   - Interaction terms: weekend×drying, weekend×rain, holiday×drying
//   - Tiered model complexity: full (12 features), reduced (7), minimal (3), fallback (mean)
//   - Data quality tracking: missing weather, outliers, holidays in range
//   - Prepares for weekly cross-validation (window optimization)
//
// v2.16 (2025-12-21): Revenue model training
//   - Added daily model retraining at midnight Brazil time (03:00 UTC)
//   - Uses OLS regression with lag features (matches revenue-predict.js)
//
// v2.15 (2025-12-19): Blacklist sync
//   - Added automatic sync of Twilio blacklist (opt-outs + undelivered) every 4 hours
//   - Detects opt-out keywords in inbound messages
//   - Detects undelivered/failed outbound messages
//   - Stores to blacklist table with reason and source
//   - Uses blacklist_last_sync in app_settings for scheduling
//
// v2.14 (2025-12-19): Twilio engagement & cost sync
//   - Added automatic sync of Twilio engagement and cost data every 4 hours
//   - Stores engagement data to contact_tracking table
//   - Stores cost data to twilio_daily_costs table
//   - Follows same pattern as WABA and Instagram sync
//   - Uses syncTwilioEngagementAndCosts from twilio-whatsapp.js
//
// v2.13 (2025-12-18): Instagram analytics sync
//   - Added automatic sync of Instagram metrics every 4 hours
//   - Stores daily snapshots in instagram_daily_metrics table
//   - Enables follower growth charts and engagement trends
//   - Uses syncInstagramAnalytics from instagram-analytics.js
//
// v2.12 (2025-12-18): WABA template analytics sync (REMOVED in v2.13)
//   - Template analytics now served by twilio_template_performance SQL view
//   - Meta template sync removed — Twilio webhooks provide live data
//
// v2.11 (2025-12-17): WABA analytics sync
//   - Added automatic sync of WhatsApp Business analytics every 4 hours
//   - Syncs conversation analytics (billable conversations + costs)
//   - Syncs message analytics (sent, delivered, read counts)
//   - Requires META_WABA_ID and META_ACCESS_TOKEN env vars
//   - Uses waba-analytics.js module for API calls and DB upserts
//
// v2.10 (2025-12-15): Duplicate prevention for automation sends
//   - Added check for existing contact_tracking records before sending
//   - Prevents duplicates when manual inclusion was created via CustomerSegmentModal
//   - Skips customers with 'queued' or 'pending' status for same campaign_id
//
// v2.9 (2025-12-15): Priority queue for manual inclusions
//   - Added processPriorityQueue() to handle "Incluir em Automação" entries
//   - Processes contact_tracking entries with priority_source='manual_inclusion', status='queued'
//   - Respects eligibility cooldowns (7 days global, 30 days same-type)
//   - Skips blacklisted phones and invalid entries
//   - Updates contact_tracking status to 'pending' after successful send
//   - Returns priorityQueue results in scheduler response
//
// v2.8 (2025-12-14): Improved failure logging + hourly returns + old phone format support
//   - Added summary log after each rule showing failures with error messages
//   - Shows last 4 digits of phone + error reason (e.g., "63016: Template not found")
//   - Added separate log for blacklist skips
//   - Changed return processing from 4x daily to every hour (faster feedback loop)
//   - normalizePhone() now handles 10-digit old format (pre-2012) by adding "9" after DDD
//
// v2.7 (2025-12-13): Fixed fallback tracking for automation sends
//   - Fallback now creates contact_tracking + campaign_contacts records
//   - Previously only updated campaigns.sends (causing "Rastreados" to show 0)
//   - Added getCampaignTypeFromTemplate() helper for campaign type mapping
//   - Ensures campaign_performance view shows correct tracked contacts
//
// v2.6 (2025-12-13): Scheduled return processing (4x daily)
//   - Changed processCampaignReturns() to run only 4 times per day
//   - Runs at 00:00, 06:00, 12:00, 18:00 Brazil time
//   - Added shouldRunReturnsProcessing() helper function
//   - Reduces database load while maintaining timely return detection
//
// v2.5 (2025-12-13): Unified eligibility for automations
//   - Replaced automation_sends-based cooldown with unified is_customer_contactable()
//   - Uses check_customers_eligibility() RPC for batch eligibility checking
//   - Enforces global cooldown (7 days) and same-type cooldown (30 days)
//   - Includes opt-out button click detection (90 days)
//   - Aligns automation eligibility with manual campaign eligibility
//
// v2.4 (2025-12-12): Campaign return detection & coupon linking
//   - Added processCampaignReturns() to run after each scheduler execution
//   - Calls process_campaign_returns() SQL function to:
//     1. Link coupon redemptions (transactions with usou_cupom=true → coupon_redemptions)
//     2. Detect customer returns (last_visit > contacted_at → contact_tracking.status='returned')
//     3. Expire old pending contacts (> 30 days)
//   - Closes the feedback loop for campaign effectiveness metrics
//   - Campaign ROI, return rates, and A/B testing now have real data
//
// v2.3 (2025-12-12): Fallback mechanism for send tracking
//   - When record_automation_contact() fails, now falls back to:
//     1. increment_campaign_sends RPC
//     2. Direct campaign.sends update (read-then-write)
//     3. automation_sends table insert for cooldown tracking
//   - Fixes issue where campaign sends count showed 0 despite messages being sent
//
// v2.2 (2025-12-12): Enhanced automation controls
//   - Send time window (send_window_start, send_window_end) - Brazil timezone
//   - Day of week restrictions (send_days array: 1=Mon, 7=Sun)
//   - Daily rate limiting (max_daily_sends with auto-reset)
//   - Exclude recent visitors (exclude_recent_days)
//   - Minimum spend threshold (min_total_spent)
//   - Wallet balance max (wallet_balance_max for wallet_reminder)
//
// v2.1 (2025-12-12): Unified risk_level targeting (Option A)
//   - Now uses risk_level column for consistent audience targeting
//   - risk_level computed by Supabase using same algorithm as frontend
//   - 100% consistency between manual campaign UI and automations
//   - days_since_visit trigger uses: WHERE risk_level IN ('At Risk', 'Churning')
//   - first_purchase trigger uses: WHERE risk_level = 'New Customer'
//
// v2.0 (2025-12-12): Unified automations as campaigns
//   - Automations now create/use campaign records for unified metrics
//   - Uses record_automation_contact() SQL function for proper tracking
//   - Automations visible in campaign_performance and campaign_effectiveness views
//   - A/B testing metrics work for automation coupons
//   - Full funnel visibility (sent → delivered → returned)
//
// v1.3 (2025-12-12): Smart audience targeting (superseded by v2.1)
//   - Added behavior-based "at risk" filtering for days_since_visit triggers
//   - Now considers avg_days_between (customer's natural visit pattern)
//   - Aligns backend targeting with frontend segmentation logic
//   - Added logging for raw vs filtered target counts
//
// v1.2 (2025-12-11): Bug fixes for automation sends
//   - Added insert to automation_sends table (was missing!)
//   - Added self-send prevention (Twilio error 63031)
//   - Added detailed error logging for debugging
//
// v1.1 (2025-12-11): Fixed bug where automation rules were skipped
//   - Removed early return when no scheduled campaigns exist
//   - Automations now always process regardless of scheduled campaigns
//
// Environment variables required:
// - TWILIO_ACCOUNT_SID: Your Twilio Account SID
// - TWILIO_AUTH_TOKEN: Your Twilio Auth Token
// - TWILIO_WHATSAPP_NUMBER: Your approved WhatsApp number
// - SUPABASE_URL: Your Supabase project URL
// - SUPABASE_SERVICE_KEY: Your Supabase service role key

const { createClient } = require('@supabase/supabase-js');
const { syncWabaAnalytics } = require('./waba-analytics');
const { syncInstagramAnalytics } = require('./instagram-analytics');
const { isHoliday, isHolidayEve } = require('./lib/brazilHolidays');

// Template ContentSid mapping for automation rules
// Must match messageTemplates.js twilioContentSid values
const AUTOMATION_TEMPLATE_SIDS = {
  winback_discount: 'HX58267edb5948cfa0fb5c3ba73ea1d767',
  winback_critical: 'HXd4e8e8b1588f01c549446c0e157154bb',
  welcome_new: 'HX2ae8ce2a72d92866fd28516aca9d76c3',  // Fixed: was using winback_wash_only SID
  wallet_reminder: 'HXa1f6a3f3c586acd36cb25a2d98a766fc',
  post_visit_thanks: 'HX62540533ed5cf7f251377cf3b4adbd8a',
  // v3.2: New automation templates (SIDs updated after Meta approval)
  rfm_loyalty_vip: 'HX_PLACEHOLDER_RFM_LOYALTY',      // lavpop_cliente_vip
  weather_promo: 'HX_PLACEHOLDER_WEATHER',            // lavpop_clima_perfeito
  registration_anniversary: 'HX_PLACEHOLDER_ANIVER', // lavpop_aniversario_cadastro
  churned_recovery: 'HX_PLACEHOLDER_CHURNED'         // lavpop_ultima_chance
};

// Map automation templates to campaign types for eligibility checks
// Used by the unified is_customer_contactable() function
const TEMPLATE_TO_CAMPAIGN_TYPE = {
  winback_discount: 'winback',
  winback_critical: 'winback',
  welcome_new: 'welcome',
  wallet_reminder: 'wallet',
  post_visit_thanks: 'post_visit',
  upsell_secagem: 'upsell',
  // v3.2: New automation campaign types
  rfm_loyalty_vip: 'rfm_loyalty',
  weather_promo: 'weather',
  registration_anniversary: 'anniversary',
  churned_recovery: 'churned'
};

// Initialize Supabase client
function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(url, key);
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
  const origin = event.headers?.origin || event.headers?.Origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  return 'https://www.bilavnova.com';
}

exports.handler = async (event, context) => {
  console.log('Campaign scheduler running at:', new Date().toISOString());

  // CORS headers for manual HTTP triggers (scheduled invocations don't have httpMethod)
  const isScheduled = event.httpMethod === undefined;
  const corsHeaders = isScheduled ? {} : {
    'Access-Control-Allow-Origin': getCorsOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  const supabase = getSupabase();

  try {
    // Find campaigns due for sending
    const now = new Date().toISOString();

    const { data: dueCampaigns, error: fetchError } = await supabase
      .from('scheduled_campaigns')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true })
      .limit(10); // Process max 10 at a time to avoid timeout

    if (fetchError) {
      console.error('Error fetching scheduled campaigns:', fetchError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        body: JSON.stringify({ error: 'Failed to fetch campaigns' })
      };
    }

    const results = [];

    if (!dueCampaigns || dueCampaigns.length === 0) {
      console.log('No scheduled campaigns due for execution');
    } else {
      console.log(`Found ${dueCampaigns.length} campaigns to execute`);

      for (const campaign of dueCampaigns) {
      try {
        // Mark as processing
        await supabase
          .from('scheduled_campaigns')
          .update({ status: 'processing' })
          .eq('id', campaign.id);

        // Execute the campaign
        const sendResult = await executeCampaign(campaign);

        // Update status based on result
        await supabase
          .from('scheduled_campaigns')
          .update({
            status: sendResult.success ? 'sent' : 'failed',
            executed_at: new Date().toISOString(),
            execution_result: sendResult
          })
          .eq('id', campaign.id);

        // Log the send to campaign_sends
        if (sendResult.success) {
          await supabase
            .from('campaign_sends')
            .insert({
              campaign_id: campaign.campaign_id,
              recipients: campaign.recipients?.length || 0,
              success_count: sendResult.sent || 0,
              failed_count: sendResult.failed || 0
            });
        }

        results.push({
          campaignId: campaign.id,
          success: sendResult.success,
          sent: sendResult.sent,
          failed: sendResult.failed
        });

        console.log(`Campaign ${campaign.id} executed:`, sendResult);

      } catch (campaignError) {
        console.error(`Error executing campaign ${campaign.id}:`, campaignError);

        // Mark as failed
        await supabase
          .from('scheduled_campaigns')
          .update({
            status: 'failed',
            executed_at: new Date().toISOString(),
            execution_result: { error: campaignError.message }
          })
          .eq('id', campaign.id);

        results.push({
          campaignId: campaign.id,
          success: false,
          error: campaignError.message
        });
      }
      }
    }

    // v2.9: Process priority queue first (manual inclusions from "Incluir em Automação" button)
    const priorityResults = await processPriorityQueue(supabase);

    // Process automation rules after scheduled campaigns
    const automationResults = await processAutomationRules(supabase);

    // v2.4 + v2.6: Run campaign return detection and coupon linking
    // Now runs only 4 times per day (00:00, 06:00, 12:00, 18:00 Brazil time)
    // This closes the feedback loop by:
    // 1. Detecting customer returns (comparing last_visit with contacted_at)
    // 2. Linking coupon redemptions to campaigns
    // 3. Expiring old pending contacts
    let returnResults = { returns_detected: 0, coupons_linked: 0, contacts_expired: 0, skipped: false };
    if (shouldRunReturnsProcessing()) {
      console.log('Running campaign return processing (hourly)...');
      returnResults = await processCampaignReturns(supabase);
    } else {
      returnResults.skipped = true;
      console.log('Skipping campaign return processing (not scheduled time)');
    }

    // v2.11: Sync WABA analytics every 4 hours
    let wabaResults = { skipped: true };
    if (await shouldSyncWabaAnalytics(supabase)) {
      wabaResults = await runWabaSync();
    } else {
      console.log('Skipping WABA analytics sync (not due yet or not configured)');
    }

    // v2.13: Sync Instagram analytics every 4 hours
    let instagramResults = { skipped: true };
    if (await shouldSyncInstagramAnalytics(supabase)) {
      instagramResults = await runInstagramSync();
    } else {
      console.log('Skipping Instagram sync (not due yet or not configured)');
    }

    // v2.14: Sync Twilio engagement & cost data every 4 hours
    let twilioResults = { skipped: true };
    if (await shouldSyncTwilioEngagement(supabase)) {
      twilioResults = await runTwilioSync(supabase);
    } else {
      console.log('Skipping Twilio sync (not due yet or not configured)');
    }

    // v2.15: Sync blacklist (opt-outs + undelivered) every 4 hours
    let blacklistResults = { skipped: true };
    if (await shouldSyncBlacklist(supabase)) {
      blacklistResults = await runBlacklistSync(supabase);
    } else {
      console.log('Skipping blacklist sync (not due yet or not configured)');
    }

    // v2.16: Train revenue prediction model (daily at midnight Brazil time)
    let modelTrainingResults = { skipped: true };
    modelTrainingResults = await runRevenueModelTraining(supabase);
    if (!modelTrainingResults.skipped) {
      console.log('Revenue model training:', modelTrainingResults.success ? 'completed' : 'failed');
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      body: JSON.stringify({
        message: `Processed ${results.length} campaigns, ${priorityResults.sent} manual inclusions, ${automationResults.processed} automation rules${returnResults.skipped ? '' : `, ${returnResults.returns_detected} returns detected`}${wabaResults.skipped ? '' : ', WABA synced'}${instagramResults.skipped ? '' : ', Instagram synced'}${twilioResults.skipped ? '' : ', Twilio synced'}${blacklistResults.skipped ? '' : ', blacklist synced'}${modelTrainingResults.skipped ? '' : ', model trained'}`,
        campaigns: results,
        priorityQueue: priorityResults,
        automation: automationResults,
        returns: returnResults,
        waba: wabaResults,
        instagram: instagramResults,
        twilio: twilioResults,
        blacklist: blacklistResults,
        modelTraining: modelTrainingResults
      })
    };

  } catch (error) {
    console.error('Campaign scheduler error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      body: JSON.stringify({ error: error.message })
    };
  }
};

/**
 * Execute a campaign by sending WhatsApp messages
 */
async function executeCampaign(campaign) {
  const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!ACCOUNT_SID || !AUTH_TOKEN || !WHATSAPP_FROM) {
    throw new Error('Twilio credentials not configured');
  }

  const recipients = campaign.recipients || [];
  const messageBody = campaign.message_body;

  if (recipients.length === 0) {
    return { success: true, sent: 0, failed: 0, message: 'No recipients' };
  }

  const results = { success: [], failed: [] };
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`;
  const credentials = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');

  for (const recipient of recipients) {
    try {
      // Personalize message
      const personalizedMessage = messageBody
        .replace(/\{\{nome\}\}/gi, recipient.name || 'Cliente')
        .replace(/\{\{saldo\}\}/gi, formatCurrency(recipient.wallet));

      const params = new URLSearchParams();
      params.append('From', `whatsapp:${WHATSAPP_FROM}`);
      params.append('To', `whatsapp:${recipient.phone}`);
      params.append('Body', personalizedMessage);

      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const data = await response.json();

      if (response.ok) {
        results.success.push({ phone: recipient.phone, sid: data.sid });
      } else {
        results.failed.push({ phone: recipient.phone, error: data.message });
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      results.failed.push({ phone: recipient.phone, error: error.message });
    }
  }

  return {
    success: true,
    sent: results.success.length,
    failed: results.failed.length,
    details: results
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Map template name to campaign type for eligibility tracking
 * @param {string} template - Template name (e.g., 'winback_discount')
 * @returns {string} Campaign type (e.g., 'winback')
 */
function getCampaignTypeFromTemplate(template) {
  const templateMap = {
    'winback_discount': 'winback',
    'winback_critical': 'winback',
    'welcome_new': 'welcome',
    'wallet_reminder': 'wallet',
    'post_visit_thanks': 'post_visit',
    'upsell_secagem': 'upsell'
  };
  return templateMap[template] || 'other';
}

// ==================== BRAZIL TIMEZONE HELPERS (v2.2) ====================

/**
 * Get current time in Brazil (São Paulo) timezone
 * @returns {Date} Current time adjusted to Brazil timezone
 */
function getBrazilNow() {
  // Create date in UTC, then get Brazil time components
  const now = new Date();
  const brazilOffset = -3; // Brazil is UTC-3 (no DST)
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * brazilOffset));
}

/**
 * Check if current Brazil time is within the send window
 * @param {string} startTime - Start time in "HH:MM" format (e.g., "09:00")
 * @param {string} endTime - End time in "HH:MM" format (e.g., "20:00")
 * @returns {boolean} True if current time is within window
 */
function isWithinSendWindow(startTime, endTime) {
  if (!startTime || !endTime) return true; // No window configured = always allowed

  const brazilNow = getBrazilNow();
  const currentMinutes = brazilNow.getHours() * 60 + brazilNow.getMinutes();

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

/**
 * Check if current Brazil day of week is in the allowed days
 * @param {number[]} sendDays - Array of allowed days (1=Mon, 2=Tue, ..., 7=Sun)
 * @returns {boolean} True if today is an allowed day
 */
function isSendDayAllowed(sendDays) {
  if (!sendDays || sendDays.length === 0) return true; // No days configured = always allowed

  const brazilNow = getBrazilNow();
  // JavaScript: 0=Sun, 1=Mon, ..., 6=Sat
  // Our format: 1=Mon, 2=Tue, ..., 7=Sun
  const jsDay = brazilNow.getDay();
  const ourDay = jsDay === 0 ? 7 : jsDay; // Convert Sunday from 0 to 7

  return sendDays.includes(ourDay);
}

/**
 * Get today's date in Brazil timezone as YYYY-MM-DD string
 * Used for daily rate limit tracking
 */
function getBrazilDateString() {
  const brazilNow = getBrazilNow();
  return brazilNow.toISOString().split('T')[0];
}

/**
 * Check if it's time to run campaign return processing
 * Runs every hour (24x per day) in the first 5-minute window
 * Since scheduler runs every 5 minutes, we trigger when minutes < 5
 * @returns {boolean} True if it's time to run return processing
 */
function shouldRunReturnsProcessing() {
  const brazilNow = getBrazilNow();
  const minute = brazilNow.getMinutes();

  // Run in the first 5-minute window of every hour
  return minute < 5;
}

/**
 * Check if WABA analytics sync should run
 * Runs every 4 hours (at 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 Brazil time)
 * @param {Object} supabase - Supabase client
 * @returns {Promise<boolean>} True if it's time to sync WABA analytics
 */
async function shouldSyncWabaAnalytics(supabase) {
  try {
    // Check if META_WABA_ID is configured
    if (!process.env.META_WABA_ID || !process.env.META_ACCESS_TOKEN) {
      return false;
    }

    // Get last sync time from app_settings
    const { data: settings } = await supabase
      .from('app_settings')
      .select('waba_last_sync')
      .eq('id', 'default')
      .single();

    if (!settings?.waba_last_sync) {
      // Never synced, should sync
      return true;
    }

    // Check if 4 hours have passed
    const lastSync = new Date(settings.waba_last_sync);
    const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);

    return hoursSinceSync >= 4;
  } catch (error) {
    console.warn('Error checking WABA sync status:', error.message);
    return false;
  }
}

/**
 * Sync WABA analytics from Meta API
 * Fetches last 3 days of data to catch any finalization delays
 */
async function runWabaSync() {
  try {
    const now = Math.floor(Date.now() / 1000);
    const threeDaysAgo = now - (3 * 24 * 60 * 60);

    console.log('Syncing WABA analytics (last 3 days)...');
    const results = await syncWabaAnalytics(threeDaysAgo, now);

    return {
      success: true,
      conversations: results.conversations,
      messages: results.messages
    };
  } catch (error) {
    console.error('WABA sync error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if WABA template analytics sync should run
 * Runs every 4 hours (same schedule as account analytics)
 * @param {Object} supabase - Supabase client
 * @returns {Promise<boolean>} True if it's time to sync template analytics
 */

/**
 * Check if Instagram analytics sync should run
 * Runs every 4 hours (same schedule as WABA analytics)
 * @param {Object} supabase - Supabase client
 * @returns {Promise<boolean>} True if it's time to sync Instagram analytics
 */
async function shouldSyncInstagramAnalytics(supabase) {
  try {
    // Check if META_INSTAGRAM_ACCOUNT_ID is configured
    if (!process.env.META_INSTAGRAM_ACCOUNT_ID || !process.env.META_ACCESS_TOKEN) {
      return false;
    }

    // Get last sync time from app_settings
    const { data: settings } = await supabase
      .from('app_settings')
      .select('instagram_last_sync')
      .eq('id', 'default')
      .single();

    if (!settings?.instagram_last_sync) {
      // Never synced, should sync
      return true;
    }

    // Check if 4 hours have passed
    const lastSync = new Date(settings.instagram_last_sync);
    const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);

    return hoursSinceSync >= 4;
  } catch (error) {
    console.warn('Error checking Instagram sync status:', error.message);
    return false;
  }
}

/**
 * Sync Instagram analytics from Meta Graph API
 * Stores daily metrics for historical trend analysis
 */
async function runInstagramSync() {
  try {
    console.log('Syncing Instagram analytics...');
    const results = await syncInstagramAnalytics();

    return {
      success: true,
      date: results.date,
      metrics: results.metrics
    };
  } catch (error) {
    console.error('Instagram sync error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if Twilio engagement/cost sync should run
 * Runs every 4 hours (same schedule as WABA and Instagram)
 * @param {Object} supabase - Supabase client
 * @returns {Promise<boolean>} True if it's time to sync Twilio data
 */
async function shouldSyncTwilioEngagement(supabase) {
  try {
    // Check if TWILIO_ACCOUNT_SID is configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return false;
    }

    // Get last sync time from app_settings
    const { data: settings } = await supabase
      .from('app_settings')
      .select('twilio_last_sync')
      .eq('id', 'default')
      .single();

    if (!settings?.twilio_last_sync) {
      // Never synced, should sync
      return true;
    }

    // Check if 4 hours have passed
    const lastSync = new Date(settings.twilio_last_sync);
    const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);

    return hoursSinceSync >= 4;
  } catch (error) {
    console.warn('Error checking Twilio sync status:', error.message);
    return false;
  }
}

/**
 * Sync Twilio engagement and cost data
 * Fetches from Twilio API and stores to Supabase
 * @param {Object} supabase - Supabase client
 */
async function runTwilioSync(supabase) {
  try {
    console.log('Syncing Twilio engagement & cost data...');

    // Fetch last 7 days of messages from Twilio
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
    const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const credentials = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');

    let hasMore = true;
    let pageToken = null;
    let allInboundMessages = [];
    let costByDay = {};
    let totalProcessed = 0;

    // Fetch all pages of messages
    while (hasMore) {
      const params = new URLSearchParams();
      params.append('PageSize', '500');
      params.append('DateSent>', startDate);
      if (pageToken) params.append('PageToken', pageToken);

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json?${params.toString()}`,
        { headers: { 'Authorization': `Basic ${credentials}` } }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Twilio API error');
      }

      // Process messages for engagement and cost
      const optOutKeywords = ['parar', 'pare', 'stop', 'cancelar', 'sair', 'remover', 'desinscrever', 'unsubscribe', 'nao quero', 'nao tenho interesse'];
      const positiveKeywords = ['quero usar', 'vou aproveitar', 'quero', 'sim', 'interessado', 'aceito', 'quero saber', 'me conta', 'como funciona'];
      const normalizeText = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

      for (const msg of data.messages || []) {
        const direction = (msg.direction || '').toLowerCase();
        const body = normalizeText(msg.body);
        const from = (msg.from || '').replace(/^whatsapp:/, '');
        const dateKey = msg.date_sent?.split('T')[0];
        const price = msg.price ? Math.abs(parseFloat(msg.price)) : 0;
        const priceUnit = msg.price_unit || 'USD';

        // Track costs by day
        if (dateKey) {
          if (!costByDay[dateKey]) {
            costByDay[dateKey] = { outbound: { count: 0, cost: 0 }, inbound: { count: 0, cost: 0 }, currency: priceUnit };
          }
          const dir = direction.startsWith('outbound') ? 'outbound' : 'inbound';
          costByDay[dateKey][dir].count++;
          costByDay[dateKey][dir].cost += price;
        }

        // Track inbound messages for engagement
        if (direction === 'inbound') {
          const hasOptOut = optOutKeywords.some(kw => body.includes(kw));
          const hasPositive = positiveKeywords.some(kw => body.includes(kw));
          allInboundMessages.push({
            phone: from,
            engagementType: hasOptOut ? 'button_optout' : (hasPositive ? 'button_positive' : 'other'),
            dateSent: msg.date_sent,
            price,
            priceUnit
          });
        }
      }

      totalProcessed += data.messages?.length || 0;
      hasMore = !!data.next_page_uri;
      if (data.next_page_uri) {
        const nextUrl = new URL(`https://api.twilio.com${data.next_page_uri}`);
        pageToken = nextUrl.searchParams.get('PageToken');
      }

      // Safety limit
      if (totalProcessed >= 5000) break;
    }

    // Store engagement data to contact_tracking
    let engagementsStored = 0;
    for (const eng of allInboundMessages) {
      const phone = normalizePhoneForSync(eng.phone);
      if (!phone) continue;

      // Find and update existing contact_tracking record
      const { data: existing } = await supabase
        .from('contact_tracking')
        .select('id')
        .eq('phone', phone)
        .order('contacted_at', { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        await supabase
          .from('contact_tracking')
          .update({
            engagement_type: eng.engagementType,
            engaged_at: eng.dateSent,
            message_cost: eng.price || null,
            message_cost_currency: eng.priceUnit || 'USD'
          })
          .eq('id', existing.id);
        engagementsStored++;
      }
    }

    // Store cost data to twilio_daily_costs
    let costDaysStored = 0;
    for (const [dateKey, costs] of Object.entries(costByDay)) {
      const { error } = await supabase
        .from('twilio_daily_costs')
        .upsert({
          date: dateKey,
          outbound_count: costs.outbound?.count || 0,
          outbound_cost: costs.outbound?.cost || 0,
          inbound_count: costs.inbound?.count || 0,
          inbound_cost: costs.inbound?.cost || 0,
          currency: costs.currency || 'USD',
          updated_at: new Date().toISOString()
        }, { onConflict: 'date' });

      if (!error) costDaysStored++;
    }

    // Update last sync time
    await supabase
      .from('app_settings')
      .update({ twilio_last_sync: new Date().toISOString() })
      .eq('id', 'default');

    console.log(`Twilio sync complete: ${engagementsStored} engagements, ${costDaysStored} cost days stored`);

    return {
      success: true,
      messagesProcessed: totalProcessed,
      engagementsStored,
      costDaysStored
    };
  } catch (error) {
    console.error('Twilio sync error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Normalize phone for sync (same logic as twilio-whatsapp.js)
 */
function normalizePhoneForSync(phone) {
  if (!phone) return null;
  let cleaned = phone.replace(/^whatsapp:/, '').replace(/\D/g, '');
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = '55' + cleaned;
  }
  return '+' + cleaned;
}

/**
 * Check if blacklist sync should run
 * Runs every 4 hours (same schedule as WABA, Instagram, Twilio)
 * @param {Object} supabase - Supabase client
 * @returns {Promise<boolean>} True if it's time to sync blacklist
 */
async function shouldSyncBlacklist(supabase) {
  try {
    // Check if TWILIO_ACCOUNT_SID is configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return false;
    }

    // Get last sync time from app_settings
    const { data: settings } = await supabase
      .from('app_settings')
      .select('blacklist_last_sync')
      .eq('id', 'default')
      .single();

    if (!settings?.blacklist_last_sync) {
      // Never synced, should sync
      return true;
    }

    // Check if 4 hours have passed
    const lastSync = new Date(settings.blacklist_last_sync);
    const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);

    return hoursSinceSync >= 4;
  } catch (error) {
    console.warn('Error checking blacklist sync status:', error.message);
    return false;
  }
}

/**
 * Sync blacklist from Twilio (opt-outs + undelivered messages)
 * Detects opt-out keywords in inbound messages and failed/undelivered outbound messages
 * @param {Object} supabase - Supabase client
 */
async function runBlacklistSync(supabase) {
  try {
    console.log('Syncing blacklist (opt-outs + undelivered)...');

    // Fetch last 7 days of messages from Twilio
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
    const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const credentials = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');

    let hasMore = true;
    let pageToken = null;
    let optOuts = [];
    let undelivered = [];
    let totalProcessed = 0;

    // Opt-out keywords (same as blacklistService.js)
    const optOutKeywords = ['parar', 'pare', 'stop', 'cancelar', 'sair', 'remover', 'desinscrever', 'unsubscribe', 'nao quero', 'nao tenho interesse'];
    const normalizeText = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

    // Fetch all pages of messages
    while (hasMore) {
      const params = new URLSearchParams();
      params.append('PageSize', '500');
      params.append('DateSent>', startDate);
      if (pageToken) params.append('PageToken', pageToken);

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json?${params.toString()}`,
        { headers: { 'Authorization': `Basic ${credentials}` } }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Twilio API error');
      }

      // Process messages for opt-outs and undelivered
      for (const msg of data.messages || []) {
        const direction = (msg.direction || '').toLowerCase();
        const status = (msg.status || '').toLowerCase();
        const body = normalizeText(msg.body);
        const from = (msg.from || '').replace(/^whatsapp:/, '');
        const to = (msg.to || '').replace(/^whatsapp:/, '');
        const errorCode = msg.error_code;

        // Check for opt-out in inbound messages
        if (direction === 'inbound') {
          const isOptOut = optOutKeywords.some(kw => body.includes(kw));
          if (isOptOut) {
            optOuts.push({
              phone: from,
              reason: 'opt-out',
              dateSent: msg.date_sent,
              messageSid: msg.sid,
              body: (msg.body || '').substring(0, 100)
            });
          }
        }

        // Check for undelivered/failed outbound messages
        if (direction.startsWith('outbound') && ['undelivered', 'failed'].includes(status)) {
          // Check if it's a number-blocked error (63016, 63018, 63032)
          const blockedCodes = ['63016', '63018', '63032', '21211', '21214', '21217'];
          const isBlocked = blockedCodes.includes(String(errorCode));

          undelivered.push({
            phone: to,
            reason: isBlocked ? 'number-blocked' : 'undelivered',
            dateSent: msg.date_sent,
            messageSid: msg.sid,
            errorCode: errorCode,
            errorMessage: msg.error_message
          });
        }
      }

      totalProcessed += data.messages?.length || 0;
      hasMore = !!data.next_page_uri;
      if (data.next_page_uri) {
        const nextUrl = new URL(`https://api.twilio.com${data.next_page_uri}`);
        pageToken = nextUrl.searchParams.get('PageToken');
      }

      // Safety limit
      if (totalProcessed >= 5000) break;
    }

    // Get existing blacklist to avoid duplicates
    const { data: existingBlacklist } = await supabase
      .from('blacklist')
      .select('phone');
    const existingPhones = new Set((existingBlacklist || []).map(b => b.phone));

    // Store opt-outs to blacklist
    let optOutsStored = 0;
    for (const entry of optOuts) {
      const phone = normalizePhoneForSync(entry.phone);
      if (!phone || existingPhones.has(phone)) continue;

      const { error } = await supabase
        .from('blacklist')
        .insert({
          phone,
          reason: 'opt-out',
          source: 'scheduled-sync',
          added_at: entry.dateSent || new Date().toISOString(),
          notes: entry.body ? `Message: ${entry.body}` : null
        });

      if (!error) {
        optOutsStored++;
        existingPhones.add(phone);
      }
    }

    // Store undelivered to blacklist
    let undeliveredStored = 0;
    for (const entry of undelivered) {
      const phone = normalizePhoneForSync(entry.phone);
      if (!phone || existingPhones.has(phone)) continue;

      const { error } = await supabase
        .from('blacklist')
        .insert({
          phone,
          reason: entry.reason,
          source: 'scheduled-sync',
          added_at: entry.dateSent || new Date().toISOString(),
          error_code: entry.errorCode,
          notes: entry.errorMessage ? `Error: ${entry.errorMessage}` : null
        });

      if (!error) {
        undeliveredStored++;
        existingPhones.add(phone);
      }
    }

    // Update last sync time
    await supabase
      .from('app_settings')
      .update({ blacklist_last_sync: new Date().toISOString() })
      .eq('id', 'default');

    console.log(`Blacklist sync complete: ${optOutsStored} opt-outs, ${undeliveredStored} undelivered stored`);

    return {
      success: true,
      messagesProcessed: totalProcessed,
      optOutsStored,
      undeliveredStored,
      totalNewEntries: optOutsStored + undeliveredStored
    };
  } catch (error) {
    console.error('Blacklist sync error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== REVENUE MODEL TRAINING (v2.16 → v2.17) ====================
// v2.17: Added holiday features, interaction terms, tiered model complexity,
//        data quality tracking, and weekly cross-validation

/**
 * Configuration for revenue prediction model
 */
const DEFAULT_TRAINING_DAYS = 365; // Use all available data (up to 1 year)
const MIN_TRAINING_SAMPLES = 14; // Absolute minimum for any prediction

// Tiered model complexity based on sample count
const MODEL_TIERS = {
  FULL: { minSamples: 60, features: 12, name: 'full' },      // All 12 features
  REDUCED: { minSamples: 30, features: 7, name: 'reduced' }, // Core 7 features
  MINIMAL: { minSamples: 14, features: 3, name: 'minimal' }, // intercept + lags only
  FALLBACK: { minSamples: 0, features: 1, name: 'fallback' } // Mean-only
};

// Feature names for each tier
const FEATURE_NAMES = {
  full: ['intercept', 'rev_lag_1', 'rev_lag_7', 'is_weekend', 'drying_pain',
         'is_rainy', 'heavy_rain', 'is_holiday', 'is_holiday_eve',
         'weekend_x_drying', 'weekend_x_rain', 'holiday_x_drying'],
  reduced: ['intercept', 'rev_lag_1', 'rev_lag_7', 'is_weekend', 'drying_pain', 'is_rainy', 'heavy_rain'],
  minimal: ['intercept', 'rev_lag_1', 'rev_lag_7'],
  fallback: ['intercept']
};

/**
 * Get local date in São Paulo timezone
 */
function getLocalDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  return formatter.format(date);
}

/**
 * Check if date is weekend (Sat/Sun)
 */
function isWeekendDay(dateStr) {
  const date = new Date(dateStr + 'T12:00:00Z');
  const dow = (date.getUTCDay() + 6) % 7; // Mon=0, Sun=6
  return dow >= 5;
}

/**
 * Calculate Drying Pain Index
 * Measures difficulty of drying clothes outdoors
 */
function calculateDryingPain(weather) {
  const humidity = parseFloat(weather.humidity_avg) || 60;
  const precip = parseFloat(weather.precipitation) || 0;
  const cloudCover = parseFloat(weather.cloud_cover) || 50;
  const sunHoursEst = Math.max(0, 8 - (cloudCover / 100) * 8);
  return 0.03 * humidity + 0.08 * precip + 0.20 * Math.max(0, 8 - sunHoursEst);
}

/**
 * Determine appropriate model tier based on sample count
 */
function selectModelTier(sampleCount) {
  if (sampleCount >= MODEL_TIERS.FULL.minSamples) return 'full';
  if (sampleCount >= MODEL_TIERS.REDUCED.minSamples) return 'reduced';
  if (sampleCount >= MODEL_TIERS.MINIMAL.minSamples) return 'minimal';
  return 'fallback';
}

/**
 * Detect outliers using IQR method
 */
function detectOutliers(values) {
  if (values.length < 4) return { outlierIndices: [], bounds: null };

  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;

  const outlierIndices = [];
  values.forEach((v, i) => {
    if (v < lower || v > upper) outlierIndices.push(i);
  });

  return { outlierIndices, bounds: { lower, upper, q1, q3, iqr } };
}

/**
 * Build training features from revenue and weather data
 * Returns { features, dataQuality }
 */
function buildTrainingFeatures(revenueRows, weatherRows, options = {}) {
  const { tier = 'full' } = options;

  const revenueMap = {};
  revenueRows.forEach(r => {
    revenueMap[r.date] = parseFloat(r.total_revenue) || 0;
  });

  const weatherMap = {};
  weatherRows.forEach(w => {
    weatherMap[w.date] = w;
  });

  const dates = Object.keys(revenueMap).sort();

  // Data quality tracking
  const dataQuality = {
    totalDays: dates.length,
    missingWeather: 0,
    missingLags: 0,
    usableDays: 0,
    outlierCount: 0,
    fallbacksUsed: 0,
    holidaysInRange: 0
  };

  const features = [];
  const revenues = [];

  for (let i = 7; i < dates.length; i++) {
    const date = dates[i];
    const w = weatherMap[date];

    if (!w) {
      dataQuality.missingWeather++;
      continue;
    }

    const revenue = revenueMap[date];
    const revLag1 = revenueMap[dates[i - 1]];
    const revLag7 = revenueMap[dates[i - 7]];

    if (revLag1 === undefined || revLag1 === 0 ||
        revLag7 === undefined || revLag7 === 0) {
      dataQuality.missingLags++;
      continue;
    }

    // Calculate features
    const dryingPain = calculateDryingPain(w);
    const precip = parseFloat(w.precipitation) || 0;
    const isWknd = isWeekendDay(date);
    const isRainy = precip >= 2;
    const heavyRain = precip >= 10;

    // Holiday features
    const holidayInfo = isHoliday(date);
    const holidayEveInfo = isHolidayEve(date);
    const isHolidayFlag = holidayInfo.isHoliday;
    const isHolidayEveFlag = holidayEveInfo.isHolidayEve;

    if (isHolidayFlag) dataQuality.holidaysInRange++;

    // Interaction terms
    const weekendXDrying = isWknd ? dryingPain : 0;
    const weekendXRain = (isWknd && isRainy) ? 1 : 0;
    const holidayXDrying = isHolidayFlag ? dryingPain : 0;

    // Build feature vector based on tier
    let x;

    if (tier === 'full') {
      x = [
        1,                          // β₀ intercept
        revLag1,                    // β₁ yesterday's revenue
        revLag7,                    // β₂ same day last week
        isWknd ? 1 : 0,             // β₃ weekend indicator
        dryingPain,                 // β₄ drying pain index
        isRainy ? 1 : 0,            // β₅ rain indicator
        heavyRain ? 1 : 0,          // β₆ heavy rain indicator
        isHolidayFlag ? 1 : 0,      // β₇ holiday indicator
        isHolidayEveFlag ? 1 : 0,   // β₈ holiday eve indicator
        weekendXDrying,             // β₉ weekend × drying interaction
        weekendXRain,               // β₁₀ weekend × rain interaction
        holidayXDrying              // β₁₁ holiday × drying interaction
      ];
    } else if (tier === 'reduced') {
      x = [1, revLag1, revLag7, isWknd ? 1 : 0, dryingPain, isRainy ? 1 : 0, heavyRain ? 1 : 0];
    } else if (tier === 'minimal') {
      x = [1, revLag1, revLag7];
    } else {
      x = [1]; // fallback
    }

    features.push({ date, y: revenue, x });
    revenues.push(revenue);
  }

  // Outlier detection
  if (revenues.length >= 4) {
    const { outlierIndices } = detectOutliers(revenues);
    dataQuality.outlierCount = outlierIndices.length;
    outlierIndices.forEach(idx => {
      if (features[idx]) features[idx].isOutlier = true;
    });
  }

  dataQuality.usableDays = features.length;

  return { features, dataQuality };
}

/**
 * Matrix operations for OLS regression
 */
function transposeMatrix(A) {
  const rows = A.length;
  const cols = A[0].length;
  const T = [];
  for (let j = 0; j < cols; j++) {
    T[j] = [];
    for (let i = 0; i < rows; i++) {
      T[j][i] = A[i][j];
    }
  }
  return T;
}

function multiplyMatrices(A, B) {
  const rowsA = A.length;
  const colsA = A[0].length;
  const colsB = B[0].length;
  const C = [];
  for (let i = 0; i < rowsA; i++) {
    C[i] = [];
    for (let j = 0; j < colsB; j++) {
      let sum = 0;
      for (let k = 0; k < colsA; k++) {
        sum += A[i][k] * B[k][j];
      }
      C[i][j] = sum;
    }
  }
  return C;
}

function multiplyMatrixVector(A, v) {
  const rows = A.length;
  const cols = A[0].length;
  const result = [];
  for (let i = 0; i < rows; i++) {
    let sum = 0;
    for (let j = 0; j < cols; j++) {
      sum += A[i][j] * v[j];
    }
    result[i] = sum;
  }
  return result;
}

function invertMatrix(A) {
  const n = A.length;
  const aug = [];
  for (let i = 0; i < n; i++) {
    aug[i] = [...A[i]];
    for (let j = 0; j < n; j++) {
      aug[i][n + j] = i === j ? 1 : 0;
    }
  }

  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) {
        maxRow = row;
      }
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    if (Math.abs(aug[col][col]) < 1e-10) {
      throw new Error('Matrix is singular');
    }

    const pivot = aug[col][col];
    for (let j = 0; j < 2 * n; j++) {
      aug[col][j] /= pivot;
    }

    for (let row = 0; row < n; row++) {
      if (row !== col) {
        const factor = aug[row][col];
        for (let j = 0; j < 2 * n; j++) {
          aug[row][j] -= factor * aug[col][j];
        }
      }
    }
  }

  const inv = [];
  for (let i = 0; i < n; i++) {
    inv[i] = aug[i].slice(n);
  }
  return inv;
}

/**
 * Fit OLS regression model: β = (X'X)^(-1) X'y
 */
function fitOLSModel(data) {
  const n = data.length;
  const p = data[0].x.length;

  const X = data.map(d => d.x);
  const y = data.map(d => d.y);

  const Xt = transposeMatrix(X);
  const XtX = multiplyMatrices(Xt, X);
  const XtX_inv = invertMatrix(XtX);
  const Xty = multiplyMatrixVector(Xt, y);
  const beta = multiplyMatrixVector(XtX_inv, Xty);

  // Calculate metrics
  const meanY = y.reduce((s, v) => s + v, 0) / n;
  let ssRes = 0;
  let ssTot = 0;
  let absErrors = [];

  for (let i = 0; i < n; i++) {
    let pred = 0;
    for (let j = 0; j < p; j++) {
      pred += beta[j] * X[i][j];
    }
    const residual = y[i] - pred;
    ssRes += residual * residual;
    ssTot += (y[i] - meanY) * (y[i] - meanY);
    absErrors.push(Math.abs(residual));
  }

  const rSquared = 1 - (ssRes / ssTot);
  const rmse = Math.sqrt(ssRes / n);
  const mae = absErrors.reduce((s, v) => s + v, 0) / n;

  return {
    beta,
    mae: Math.round(mae),
    rmse: Math.round(rmse),
    rSquared: Math.round(rSquared * 1000) / 1000,
    n,
    meanRevenue: Math.round(meanY)
  };
}

/**
 * Check if revenue model should be retrained
 * Runs at midnight Brazil time (expanded to 1-hour window for reliability)
 */
async function shouldRetrainRevenueModel(supabase) {
  const brazilNow = getBrazilNow();
  const hour = brazilNow.getHours();

  // Only run in the midnight hour (00:00 - 00:59)
  if (hour !== 0) {
    return false;
  }

  try {
    // Get last training time
    const { data: settings } = await supabase
      .from('app_settings')
      .select('revenue_model_last_trained')
      .eq('id', 'default')
      .single();

    if (!settings?.revenue_model_last_trained) {
      return true; // Never trained
    }

    // Check if last training was before today (Brazil time)
    const lastTrained = new Date(settings.revenue_model_last_trained);
    const todayStart = new Date(brazilNow);
    todayStart.setHours(0, 0, 0, 0);

    return lastTrained < todayStart;
  } catch (error) {
    console.warn('Error checking model training status:', error.message);
    return false;
  }
}

/**
 * Train the revenue prediction model and store coefficients
 * v2.17: Added tiered training, data quality, holiday features
 */
async function trainRevenueModel(supabase, options = {}) {
  const { trainingDays = DEFAULT_TRAINING_DAYS } = options;
  console.log(`Training revenue prediction model (${trainingDays} days)...`);

  try {
    const today = getLocalDate(0);
    const trainingStart = getLocalDate(-trainingDays);

    // Fetch training data (uses materialized view for performance)
    const { data: revenueData, error: revError } = await supabase
      .from('mv_daily_revenue')
      .select('date, total_revenue')
      .gte('date', trainingStart)
      .lte('date', today)
      .order('date');

    if (revError) throw new Error(`Failed to fetch revenue: ${revError.message}`);

    const { data: weatherData, error: weatherError } = await supabase
      .from('weather_daily_metrics')
      .select('date, temp_avg, humidity_avg, precipitation, cloud_cover')
      .gte('date', trainingStart)
      .lte('date', today)
      .order('date');

    if (weatherError) throw new Error(`Failed to fetch weather: ${weatherError.message}`);

    // First pass: determine tier from full features
    const initialBuild = buildTrainingFeatures(revenueData, weatherData, { tier: 'full' });
    const sampleCount = initialBuild.features.length;
    const tier = selectModelTier(sampleCount);

    console.log(`Sample count: ${sampleCount}, Selected tier: ${tier}`);

    // Build training features with appropriate tier
    const { features: trainingData, dataQuality } = buildTrainingFeatures(
      revenueData,
      weatherData,
      { tier }
    );

    if (trainingData.length < MIN_TRAINING_SAMPLES) {
      console.log(`Insufficient training data: ${trainingData.length} samples (need ${MIN_TRAINING_SAMPLES})`);
      return {
        success: false,
        error: 'Insufficient data',
        n_samples: trainingData.length,
        data_quality: dataQuality
      };
    }

    // Train model (or use mean for fallback tier)
    let model;
    if (tier === 'fallback') {
      const meanRev = trainingData.reduce((s, d) => s + d.y, 0) / trainingData.length;
      model = {
        beta: [meanRev],
        mae: 0,
        rmse: 0,
        rSquared: 0,
        n: trainingData.length,
        meanRevenue: Math.round(meanRev)
      };
    } else {
      model = fitOLSModel(trainingData);
    }

    const featureNames = FEATURE_NAMES[tier];

    // Store model to app_settings.revenue_model (consolidated storage)
    const revenueModel = {
      beta: model.beta,
      feature_names: featureNames,
      r_squared: model.rSquared,
      mae: model.mae,
      rmse: model.rmse,
      mean_revenue: model.meanRevenue,
      n_training_samples: model.n,
      trained_at: new Date().toISOString(),
      training_period_start: trainingStart,
      training_period_end: today,
      model_complexity: tier,
      data_quality: dataQuality,
      optimal_training_days: trainingDays,
      // OLS model (campaign-scheduler still uses OLS for simplicity)
      regression_type: 'ols',
      lambda: null,
      scaler: null
    };

    const { error: settingsError } = await supabase
      .from('app_settings')
      .update({ revenue_model: revenueModel })
      .eq('id', 1);

    if (settingsError) {
      console.error('Failed to save model to app_settings:', settingsError);
      throw new Error(`Model save failed: ${settingsError.message}`);
    }

    console.log(`Model trained: R²=${model.rSquared}, MAE=R$${model.mae}, samples=${model.n}, tier=${tier}`);

    return {
      success: true,
      r_squared: model.rSquared,
      mae: model.mae,
      rmse: model.rmse,
      n_samples: model.n,
      model_tier: tier,
      data_quality: dataQuality
    };
  } catch (error) {
    console.error('Model training error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Evaluate yesterday's prediction against actual revenue
 * Called during midnight training run to close the feedback loop
 * @param {Object} supabase - Supabase client
 * @returns {Object} Evaluation result or null if no prediction/actual found
 */
async function evaluatePredictions(supabase) {
  const yesterday = getLocalDate(-1);
  console.log(`Evaluating prediction for ${yesterday}...`);

  try {
    // Get actual revenue for yesterday from materialized view
    const { data: actualData, error: actualError } = await supabase
      .from('mv_daily_revenue')
      .select('total_revenue')
      .eq('date', yesterday)
      .single();

    if (actualError || !actualData?.total_revenue) {
      console.log(`No actual revenue data for ${yesterday}`);
      return { evaluated: false, reason: 'no_actual_revenue' };
    }

    const actualRevenue = parseFloat(actualData.total_revenue);

    // Find the pending prediction for yesterday
    const { data: prediction, error: predError } = await supabase
      .from('revenue_predictions')
      .select('id, predicted_revenue')
      .eq('prediction_date', yesterday)
      .is('actual_revenue', null)
      .single();

    if (predError || !prediction) {
      console.log(`No pending prediction found for ${yesterday}`);
      return { evaluated: false, reason: 'no_pending_prediction' };
    }

    const predictedRevenue = parseFloat(prediction.predicted_revenue);
    const error = actualRevenue - predictedRevenue;
    const absError = Math.abs(error);
    const pctError = actualRevenue > 0
      ? ((error / actualRevenue) * 100)
      : null;

    // Closure day: revenue < R$100 (excluded from main accuracy metrics)
    const isClosure = actualRevenue < 100;

    // Update the prediction record with actual values
    const { error: updateError } = await supabase
      .from('revenue_predictions')
      .update({
        actual_revenue: actualRevenue,
        error: Math.round(error * 100) / 100,
        abs_error: Math.round(absError * 100) / 100,
        pct_error: pctError ? Math.round(pctError * 10) / 10 : null,
        evaluated_at: new Date().toISOString(),
        is_closure: isClosure
      })
      .eq('id', prediction.id);

    if (updateError) {
      console.error('Failed to update prediction:', updateError.message);
      return { evaluated: false, reason: 'update_failed', error: updateError.message };
    }

    console.log(`Prediction evaluated: predicted R$${predictedRevenue.toFixed(0)}, actual R$${actualRevenue.toFixed(0)}, error R$${error.toFixed(0)} (${pctError?.toFixed(1) || '—'}%)${isClosure ? ' [CLOSURE DAY - excluded from accuracy]' : ''}`);

    return {
      evaluated: true,
      date: yesterday,
      predicted: predictedRevenue,
      actual: actualRevenue,
      error: Math.round(error),
      pct_error: pctError ? Math.round(pctError * 10) / 10 : null
    };
  } catch (err) {
    console.error('Prediction evaluation error:', err.message);
    return { evaluated: false, reason: 'exception', error: err.message };
  }
}

/**
 * Check for model drift by comparing recent errors to baseline
 * Drift indicates the model may need retraining or investigation
 * @param {Object} supabase - Supabase client
 * @returns {Object} Drift detection result
 */
async function checkModelDrift(supabase) {
  console.log('Checking for model drift...');

  try {
    const today = getLocalDate(0);
    const sevenDaysAgo = getLocalDate(-7);
    const thirtySevenDaysAgo = getLocalDate(-37);

    // Get recent errors (last 7 days)
    const { data: recentPreds, error: recentError } = await supabase
      .from('revenue_predictions')
      .select('abs_error')
      .gte('prediction_date', sevenDaysAgo)
      .lt('prediction_date', today)
      .not('abs_error', 'is', null);

    if (recentError) {
      console.warn('Failed to fetch recent predictions:', recentError.message);
      return null;
    }

    // Get baseline errors (7-37 days ago, i.e., preceding 30 days)
    const { data: baselinePreds, error: baselineError } = await supabase
      .from('revenue_predictions')
      .select('abs_error')
      .gte('prediction_date', thirtySevenDaysAgo)
      .lt('prediction_date', sevenDaysAgo)
      .not('abs_error', 'is', null);

    if (baselineError) {
      console.warn('Failed to fetch baseline predictions:', baselineError.message);
      return null;
    }

    // Need at least 5 points in each period for meaningful comparison
    if (!recentPreds?.length || recentPreds.length < 5 || !baselinePreds?.length || baselinePreds.length < 5) {
      console.log(`Insufficient data for drift detection (recent: ${recentPreds?.length || 0}, baseline: ${baselinePreds?.length || 0})`);
      return { canCheck: false, reason: 'insufficient_data' };
    }

    const recentMAE = recentPreds.reduce((sum, p) => sum + parseFloat(p.abs_error), 0) / recentPreds.length;
    const baselineMAE = baselinePreds.reduce((sum, p) => sum + parseFloat(p.abs_error), 0) / baselinePreds.length;
    const driftRatio = baselineMAE > 0 ? recentMAE / baselineMAE : 1;

    // Drift threshold: 1.5x baseline MAE indicates significant degradation
    const isDrifting = driftRatio > 1.5;

    console.log(`Drift check: recent MAE=R$${recentMAE.toFixed(0)}, baseline MAE=R$${baselineMAE.toFixed(0)}, ratio=${driftRatio.toFixed(2)}, drifting=${isDrifting}`);

    // Update app_settings.revenue_model with drift info via SQL (partial JSON update)
    // We use rpc to update just the drift fields without overwriting the whole model
    try {
      const { data: appSettings } = await supabase
        .from('app_settings')
        .select('revenue_model')
        .eq('id', 1)
        .single();

      if (appSettings?.revenue_model) {
        const updatedModel = {
          ...appSettings.revenue_model,
          drift_detected: isDrifting,
          drift_ratio: Math.round(driftRatio * 100) / 100,
          oos_mae: Math.round(recentMAE),
          last_drift_check: new Date().toISOString()
        };

        await supabase
          .from('app_settings')
          .update({ revenue_model: updatedModel })
          .eq('id', 1);
      }
    } catch (updateErr) {
      console.warn('Failed to update drift info in app_settings:', updateErr.message);
    }

    return {
      canCheck: true,
      isDrifting,
      recentMAE: Math.round(recentMAE),
      baselineMAE: Math.round(baselineMAE),
      driftRatio: Math.round(driftRatio * 100) / 100,
      recentPoints: recentPreds.length,
      baselinePoints: baselinePreds.length
    };
  } catch (err) {
    console.error('Drift check error:', err.message);
    return { canCheck: false, reason: 'exception', error: err.message };
  }
}

/**
 * Run revenue model training (wrapper for scheduler)
 * v3.0: Also evaluates yesterday's prediction and checks for drift
 */
async function runRevenueModelTraining(supabase) {
  const results = {
    skipped: true,
    evaluation: null,
    drift: null,
    training: null
  };

  // Always try to evaluate yesterday's prediction (even if we don't retrain)
  results.evaluation = await evaluatePredictions(supabase);

  // Check for model drift
  results.drift = await checkModelDrift(supabase);

  // Run training if due
  if (await shouldRetrainRevenueModel(supabase)) {
    results.training = await trainRevenueModel(supabase);
    results.skipped = false;
  }

  return results;
}

/**
 * Process all enabled automation rules
 * Finds matching customers and sends appropriate messages
 */
async function processAutomationRules(supabase) {
  console.log('Processing automation rules...');

  const results = {
    processed: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    rules: []
  };

  try {
    // Get enabled automation rules
    const { data: rules, error: rulesError } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('enabled', true);

    if (rulesError) {
      console.error('Error fetching automation rules:', rulesError);
      return results;
    }

    if (!rules || rules.length === 0) {
      console.log('No enabled automation rules');
      return results;
    }

    // Filter out expired rules, rules that hit max sends, and rules outside send windows
    const now = new Date();
    const brazilDateStr = getBrazilDateString();

    const activeRules = rules.filter(rule => {
      // Check valid_until
      if (rule.valid_until && new Date(rule.valid_until) < now) {
        console.log(`Rule ${rule.id} expired (valid_until: ${rule.valid_until})`);
        return false;
      }
      // Check max_total_sends
      if (rule.max_total_sends !== null && rule.total_sends_count >= rule.max_total_sends) {
        console.log(`Rule ${rule.id} reached max sends (${rule.total_sends_count}/${rule.max_total_sends})`);
        return false;
      }
      // v2.2: Check send time window (Brazil timezone)
      if (!isWithinSendWindow(rule.send_window_start, rule.send_window_end)) {
        console.log(`Rule ${rule.id} outside send window (${rule.send_window_start}-${rule.send_window_end})`);
        return false;
      }
      // v2.2: Check day of week restrictions
      if (!isSendDayAllowed(rule.send_days)) {
        console.log(`Rule ${rule.id} not allowed today (send_days: ${rule.send_days})`);
        return false;
      }
      // v2.2: Check daily rate limit
      if (rule.max_daily_sends !== null) {
        // Reset counter if it's a new day
        const needsReset = rule.last_daily_reset !== brazilDateStr;
        const currentCount = needsReset ? 0 : (rule.daily_sends_count || 0);

        if (currentCount >= rule.max_daily_sends) {
          console.log(`Rule ${rule.id} hit daily limit (${currentCount}/${rule.max_daily_sends})`);
          return false;
        }
      }
      return true;
    });

    console.log(`Found ${activeRules.length} active automation rules (${rules.length - activeRules.length} filtered out)`);

    if (activeRules.length === 0) {
      console.log('No active automation rules to process');
      return results;
    }

    // Get blacklisted phones
    const { data: blacklist } = await supabase
      .from('blacklist')
      .select('phone');
    const blacklistedPhones = new Set((blacklist || []).map(b => b.phone));

    for (const rule of activeRules) {
      const ruleResult = await processAutomationRule(supabase, rule, blacklistedPhones);
      results.rules.push(ruleResult);
      results.processed++;
      results.sent += ruleResult.sent;
      results.failed += ruleResult.failed;
      results.skipped += ruleResult.skipped;

      // Update send counts in database (total + daily)
      if (ruleResult.sent > 0) {
        // v2.2: Track both total and daily send counts
        const needsDailyReset = rule.last_daily_reset !== brazilDateStr;
        const newDailyCount = needsDailyReset
          ? ruleResult.sent
          : (rule.daily_sends_count || 0) + ruleResult.sent;

        await supabase
          .from('automation_rules')
          .update({
            total_sends_count: (rule.total_sends_count || 0) + ruleResult.sent,
            daily_sends_count: newDailyCount,
            last_daily_reset: brazilDateStr,
            updated_at: new Date().toISOString()
          })
          .eq('id', rule.id);
      }
    }

    console.log(`Automation complete: ${results.sent} sent, ${results.failed} failed, ${results.skipped} skipped`);
    return results;

  } catch (error) {
    console.error('Automation processing error:', error);
    results.error = error.message;
    return results;
  }
}

/**
 * Process priority queue (manual inclusions)
 * Handles customers manually added to automations via "Incluir em Automação" button
 *
 * Flow:
 * 1. Query contact_tracking where priority_source='manual_inclusion' AND status='queued'
 * 2. Check eligibility (respects cooldowns - no bypass)
 * 3. Send message using automation's template
 * 4. Update status to 'pending' for return tracking
 */
async function processPriorityQueue(supabase) {
  console.log('Processing priority queue (manual inclusions)...');

  const results = { processed: 0, sent: 0, failed: 0, skipped: 0 };

  try {
    // 1. Query queued manual inclusions (no FK join - fetch customer data separately)
    const { data: queued, error: queueError } = await supabase
      .from('contact_tracking')
      .select('*')
      .eq('priority_source', 'manual_inclusion')
      .eq('status', 'queued')
      .limit(50);  // Process max 50 per run to avoid timeout

    if (queueError) {
      console.error('Error fetching priority queue:', queueError);
      return results;
    }

    if (!queued || queued.length === 0) {
      console.log('No manual inclusions in queue');
      return results;
    }

    console.log(`Found ${queued.length} manual inclusions to process`);

    // Fetch customer data for all queued entries
    const customerIds = queued.map(q => q.customer_id);
    const { data: customers, error: custError } = await supabase
      .from('customers')
      .select('doc, nome, telefone, risk_level, saldo_carteira, days_since_last_visit')
      .in('doc', customerIds);

    if (custError) {
      console.error('Error fetching customers:', custError);
    }

    // Create a map for quick lookup
    const customerMap = new Map((customers || []).map(c => [c.doc, c]));

    // Get blacklisted phones
    const { data: blacklist } = await supabase
      .from('blacklist')
      .select('phone');
    const blacklistedPhones = new Set((blacklist || []).map(b => b.phone));

    // 2. Check eligibility using unified RPC (respects cooldowns)
    const { data: eligibilityResults, error: eligError } = await supabase.rpc('check_customers_eligibility', {
      p_customer_ids: customerIds,
      p_campaign_type: null,  // Check global cooldown only
      p_min_days_global: 7,
      p_min_days_same_type: 30
    });

    if (eligError) {
      console.error('Error checking eligibility:', eligError);
      // Continue but treat all as eligible (fail open)
    }

    const eligibleIds = new Set(
      (eligibilityResults || [])
        .filter(e => e.is_eligible)
        .map(e => e.customer_id)
    );

    // If eligibility check failed, assume all are eligible
    const failedEligibilityCheck = !eligibilityResults;

    // 3. Process each queued entry
    for (const entry of queued) {
      results.processed++;

      // Get customer data from map
      const customer = customerMap.get(entry.customer_id);
      const phone = normalizePhone(customer?.telefone || entry.phone);
      const customerName = customer?.nome || entry.customer_name;

      // Skip if not eligible (unless eligibility check failed)
      if (!failedEligibilityCheck && !eligibleIds.has(entry.customer_id)) {
        console.log(`Queue ${entry.id}: Skipped - customer ${entry.customer_id} not eligible (cooldown)`);
        await supabase.from('contact_tracking')
          .update({
            status: 'cleared',
            notes: 'Skipped: cooldown active',
            contacted_at: new Date().toISOString()
          })
          .eq('id', entry.id);
        results.skipped++;
        continue;
      }

      // Skip if blacklisted or no phone
      if (!phone) {
        console.log(`Queue ${entry.id}: Skipped - no valid phone`);
        await supabase.from('contact_tracking')
          .update({
            status: 'cleared',
            notes: 'Skipped: no valid phone',
            contacted_at: new Date().toISOString()
          })
          .eq('id', entry.id);
        results.skipped++;
        continue;
      }

      if (blacklistedPhones.has(phone)) {
        console.log(`Queue ${entry.id}: Skipped - phone blacklisted`);
        await supabase.from('contact_tracking')
          .update({
            status: 'cleared',
            notes: 'Skipped: blacklisted',
            contacted_at: new Date().toISOString()
          })
          .eq('id', entry.id);
        results.skipped++;
        continue;
      }

      // Get automation rule from campaign_id
      // campaign_id can be:
      // - "AUTO_welcome_new" (correct format from automation system)
      // - "welcome_new" (just rule id from frontend)
      let ruleId = entry.campaign_id;
      if (!ruleId) {
        console.log(`Queue ${entry.id}: Skipped - no campaign_id`);
        await supabase.from('contact_tracking')
          .update({
            status: 'cleared',
            notes: 'Skipped: no campaign_id',
            contacted_at: new Date().toISOString()
          })
          .eq('id', entry.id);
        results.skipped++;
        continue;
      }

      // Strip AUTO_ prefix if present
      if (ruleId.startsWith('AUTO_')) {
        ruleId = ruleId.replace('AUTO_', '');
      }

      const { data: rule, error: ruleError } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('id', ruleId)
        .single();

      if (ruleError || !rule) {
        console.log(`Queue ${entry.id}: Skipped - automation rule ${ruleId} not found`);
        await supabase.from('contact_tracking')
          .update({
            status: 'cleared',
            notes: `Skipped: rule ${ruleId} not found`,
            contacted_at: new Date().toISOString()
          })
          .eq('id', entry.id);
        results.skipped++;
        continue;
      }

      // Ensure we have the correct campaign_id format for tracking
      const correctCampaignId = `AUTO_${rule.id}`;

      // Get ContentSid for template
      const contentSid = AUTOMATION_TEMPLATE_SIDS[rule.action_template];
      if (!contentSid) {
        console.log(`Queue ${entry.id}: Skipped - no template for ${rule.action_template}`);
        await supabase.from('contact_tracking')
          .update({
            status: 'cleared',
            notes: `Skipped: no template for ${rule.action_template}`,
            contacted_at: new Date().toISOString()
          })
          .eq('id', entry.id);
        results.skipped++;
        continue;
      }

      // Build target object for sendAutomationMessage
      const target = {
        doc: entry.customer_id,
        nome: customerName,
        telefone: phone,
        saldo_carteira: customer?.saldo_carteira || 0,
        days_since_last_visit: customer?.days_since_last_visit || 0
      };

      // Get campaign type from template for proper tracking
      const campaignType = getCampaignTypeFromTemplate(rule.action_template);

      // 4. Send message using automation's template
      const sendResult = await sendAutomationMessage(supabase, rule, target, contentSid);

      // 5. Update contact_tracking with result + fix any missing fields
      if (sendResult.success) {
        await supabase.from('contact_tracking')
          .update({
            status: 'pending',
            phone: phone,
            twilio_sid: sendResult.sid,
            delivery_status: 'sent',
            contacted_at: new Date().toISOString(),
            notes: 'Sent via manual inclusion',
            // Fix fields that may have been set incorrectly by frontend
            campaign_id: correctCampaignId,
            campaign_type: campaignType,
            risk_level: customer?.risk_level || entry.risk_level
          })
          .eq('id', entry.id);
        results.sent++;
        console.log(`Queue ${entry.id}: Sent to ${phone.slice(-4)} (SID: ${sendResult.sid})`);
      } else {
        await supabase.from('contact_tracking')
          .update({
            status: 'cleared',
            phone: phone,
            delivery_status: 'failed',
            contacted_at: new Date().toISOString(),
            notes: `Failed: ${sendResult.error}`,
            // Fix fields even on failure for consistency
            campaign_id: correctCampaignId,
            campaign_type: campaignType,
            risk_level: customer?.risk_level || entry.risk_level
          })
          .eq('id', entry.id);
        results.failed++;
        console.log(`Queue ${entry.id}: Failed - ${sendResult.error}`);
      }
    }

    console.log(`Priority queue complete: ${results.sent} sent, ${results.failed} failed, ${results.skipped} skipped`);
    return results;

  } catch (error) {
    console.error('Priority queue processing error:', error);
    results.error = error.message;
    return results;
  }
}

/**
 * Process a single automation rule
 * Ensures campaign record exists for unified tracking
 */
async function processAutomationRule(supabase, rule, blacklistedPhones) {
  console.log(`Processing rule: ${rule.id} (${rule.name})`);

  const result = {
    ruleId: rule.id,
    ruleName: rule.name,
    campaignId: rule.campaign_id,
    sent: 0,
    failed: 0,
    skipped: 0,
    targets: []
  };

  try {
    // Ensure campaign record exists (unified tracking)
    if (!rule.campaign_id) {
      console.log(`Creating campaign record for rule ${rule.id}`);
      const { data: campaignId, error: syncError } = await supabase.rpc('sync_automation_campaign', {
        p_rule_id: rule.id
      });

      if (syncError) {
        console.error(`Failed to sync campaign for rule ${rule.id}:`, syncError);
        // Continue anyway - the record_automation_contact function will handle it
      } else {
        result.campaignId = campaignId;
        console.log(`Created campaign ${campaignId} for rule ${rule.id}`);
      }
    }

    // Get ContentSid for template
    const contentSid = AUTOMATION_TEMPLATE_SIDS[rule.action_template];
    if (!contentSid) {
      console.error(`Template ${rule.action_template} not found for rule ${rule.id}`);
      result.error = `Template ${rule.action_template} not found`;
      return result;
    }

    // Find matching customers who haven't been contacted recently for this rule
    const targets = await findAutomationTargets(supabase, rule);

    if (!targets || targets.length === 0) {
      console.log(`No targets found for rule ${rule.id}`);
      return result;
    }

    console.log(`Found ${targets.length} targets for rule ${rule.id}`);

    // Filter out blacklisted phones
    const eligibleTargets = targets.filter(t => {
      if (!t.telefone) return false;
      const normalizedPhone = normalizePhone(t.telefone);
      if (blacklistedPhones.has(normalizedPhone)) {
        result.skipped++;
        return false;
      }
      return true;
    });

    // v2.10: Filter out customers who already have a contact_tracking record for this campaign
    // This prevents duplicates when a manual inclusion was created via CustomerSegmentModal
    const campaignId = rule.campaign_id || `AUTO_${rule.id}`;
    const customerIds = eligibleTargets.map(t => t.doc);

    if (customerIds.length > 0) {
      const { data: existingContacts } = await supabase
        .from('contact_tracking')
        .select('customer_id')
        .eq('campaign_id', campaignId)
        .in('customer_id', customerIds)
        .in('status', ['queued', 'pending']); // Don't exclude cleared/expired

      if (existingContacts?.length > 0) {
        const existingCustomerIds = new Set(existingContacts.map(c => c.customer_id));
        const beforeCount = eligibleTargets.length;
        const filteredTargets = eligibleTargets.filter(t => !existingCustomerIds.has(t.doc));
        const duplicatesSkipped = beforeCount - filteredTargets.length;

        if (duplicatesSkipped > 0) {
          console.log(`Rule ${rule.id}: Skipped ${duplicatesSkipped} customers with existing contact_tracking records`);
          result.skipped += duplicatesSkipped;
        }

        // Update eligibleTargets reference for the send loop
        eligibleTargets.length = 0;
        eligibleTargets.push(...filteredTargets);
      }
    }

    // Send messages (limit to 20 per rule execution to avoid timeouts)
    const maxPerExecution = 20;
    const toSend = eligibleTargets.slice(0, maxPerExecution);

    for (const target of toSend) {
      try {
        const sendResult = await sendAutomationMessage(supabase, rule, target, contentSid);
        if (sendResult.success) {
          result.sent++;
          result.targets.push({ phone: target.telefone, status: 'sent', sid: sendResult.sid });
        } else {
          result.failed++;
          result.targets.push({ phone: target.telefone, status: 'failed', error: sendResult.error });
        }

        // Rate limiting: 100ms between messages
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (sendError) {
        result.failed++;
        result.targets.push({ phone: target.telefone, status: 'error', error: sendError.message });
      }
    }

    // v2.8: Log failure summary if any failures occurred (helps debug Twilio/eligibility issues)
    if (result.failed > 0) {
      const failedTargets = result.targets.filter(t => t.status === 'failed' || t.status === 'error');
      console.log(`Rule ${rule.id} FAILURES (${result.failed}):`,
        failedTargets.slice(0, 5).map(t => ({
          phone: t.phone?.slice(-4) || '????',  // Last 4 digits for privacy
          error: t.error
        }))
      );
    }

    // Log skip summary if customers were blacklisted
    if (result.skipped > 0) {
      console.log(`Rule ${rule.id} SKIPPED: ${result.skipped} blacklisted numbers`);
    }

    return result;

  } catch (error) {
    console.error(`Error processing rule ${rule.id}:`, error);
    result.error = error.message;
    return result;
  }
}

/**
 * Find customers matching automation rule criteria
 * Uses unified eligibility system (is_customer_contactable) for cooldown tracking
 *
 * v2.5: Replaced automation_sends cooldown with unified eligibility system
 *       - Global cooldown: 7 days between any campaigns
 *       - Same-type cooldown: 30 days between campaigns of the same type
 *       - Opt-out button click detection: 90 days
 *
 * v3.6: For days_since_visit triggers, uses risk_level column (computed by Supabase)
 *       This ensures 100% consistency with frontend segmentation (same algorithm)
 *
 * v2.2: Added support for new filters:
 *       - exclude_recent_days: Skip customers who visited recently (null = don't exclude)
 *       - min_total_spent: Only target customers who spent >= this amount
 *       - wallet_balance_max: For wallet_reminder, only target balances <= this amount
 */
async function findAutomationTargets(supabase, rule) {
  const { trigger_type, trigger_value, id: ruleId } = rule;

  // Determine campaign type for eligibility checking
  const campaignType = TEMPLATE_TO_CAMPAIGN_TYPE[rule.action_template] || 'other';

  // Build query based on trigger type
  // v3.6: Now includes risk_level for consistent targeting
  // v2.2: Added total_spent for min_total_spent filter
  let query = supabase
    .from('customers')
    .select('doc, nome, telefone, saldo_carteira, days_since_last_visit, last_visit, transaction_count, avg_days_between, rfm_segment, risk_level, return_likelihood, total_spent')
    .not('telefone', 'is', null);

  // v2.2: Apply exclude_recent_days filter (if configured)
  // This excludes customers who visited recently
  // Note: Some automations (welcome_new, wallet_reminder, post_visit) should have NULL
  // for this field since they're meant for recent visitors
  if (rule.exclude_recent_days !== null && rule.exclude_recent_days !== undefined) {
    query = query.gt('days_since_last_visit', rule.exclude_recent_days);
    console.log(`Rule ${ruleId}: Excluding customers who visited within ${rule.exclude_recent_days} days`);
  }

  // v2.2: Apply min_total_spent filter (if configured)
  if (rule.min_total_spent !== null && rule.min_total_spent !== undefined) {
    query = query.gte('total_spent', rule.min_total_spent);
    console.log(`Rule ${ruleId}: Requiring min total spent >= R$${rule.min_total_spent}`);
  }

  switch (trigger_type) {
    case 'days_since_visit':
      // v3.6: Use risk_level column instead of custom ratio calculation
      // This ensures 100% consistency with frontend's "At Risk / Churning" audience
      // risk_level is computed by calculate_customer_risk() using the same
      // exponential decay algorithm as customerMetrics.js
      //
      // The trigger_value (e.g., 30 or 45 days) is now just a minimum safeguard
      query = query
        .gte('days_since_last_visit', trigger_value)
        .in('risk_level', ['At Risk', 'Churning']);
      break;

    case 'first_purchase':
      // New customers (transaction_count = 1) registered in last X days
      // Also verify risk_level = 'New Customer' for consistency
      // v3.2: ONE-TIME ONLY - check welcome_sent_at is null
      query = query
        .eq('transaction_count', 1)
        .eq('risk_level', 'New Customer')
        .is('welcome_sent_at', null) // v3.2: Only send once per customer
        .gte('last_visit', new Date(Date.now() - trigger_value * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      break;

    case 'wallet_balance':
      // Customers with wallet balance >= X (trigger_value is the minimum)
      query = query.gte('saldo_carteira', trigger_value);

      // v2.2: Apply wallet_balance_max filter (if configured)
      // For wallet_reminder, this lets you target balances in a range
      // e.g., trigger_value=50, wallet_balance_max=200 → targets R$50-R$200
      if (rule.wallet_balance_max !== null && rule.wallet_balance_max !== undefined) {
        query = query.lte('saldo_carteira', rule.wallet_balance_max);
        console.log(`Rule ${ruleId}: Targeting wallet balance R$${trigger_value} - R$${rule.wallet_balance_max}`);
      }
      break;

    case 'hours_after_visit':
      // Customers who visited in the last X hours
      // v3.2: ONE-TIME ONLY - check post_visit_sent_at is null
      const hoursAgo = new Date();
      hoursAgo.setHours(hoursAgo.getHours() - trigger_value);
      const targetDate = hoursAgo.toISOString().split('T')[0];
      // For simplicity, treat as "visited yesterday" for 24h rule
      query = query
        .eq('last_visit', targetDate)
        .is('post_visit_sent_at', null); // v3.2: Only send once per customer
      break;

    // =====================================================
    // v3.2: NEW AUTOMATION TRIGGERS
    // =====================================================

    case 'rfm_segment':
      // Target customers in specific RFM segments (e.g., VIP, Frequente)
      // trigger_value is an array of segment names
      const targetSegments = Array.isArray(trigger_value) ? trigger_value : [trigger_value];
      query = query
        .in('rfm_segment', targetSegments)
        .eq('risk_level', 'Healthy'); // Only healthy customers qualify for VIP rewards
      console.log(`Rule ${ruleId}: Targeting RFM segments: ${targetSegments.join(', ')}`);
      break;

    case 'weather_drying_pain':
      // Triggered by external weather check - target customers who haven't visited recently
      // Weather conditions are checked separately; this query finds eligible customers
      // trigger_value contains weather thresholds (not used in customer query)
      query = query
        .gte('days_since_last_visit', 7) // Only target customers who haven't visited in 7+ days
        .is('last_weather_campaign_date', null) // Respect 14-day weather cooldown
        .or(`last_weather_campaign_date.lt.${new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`);
      break;

    case 'registration_anniversary':
      // Target customers whose registration anniversary is today (±window_days)
      // trigger_value.window_days defines the acceptable window (default ±3 days)
      const windowDays = trigger_value?.window_days || 3;
      const today = new Date();
      const currentMonth = today.getMonth() + 1; // 1-indexed
      const currentDay = today.getDate();

      // Query customers registered on this day/month (any year)
      // Uses data_cadastro column
      query = supabase
        .from('customers')
        .select('doc, nome, telefone, saldo_carteira, days_since_last_visit, last_visit, transaction_count, avg_days_between, rfm_segment, risk_level, return_likelihood, total_spent, data_cadastro, last_anniversary_year')
        .not('telefone', 'is', null)
        .not('data_cadastro', 'is', null);

      // We'll filter by anniversary date in post-processing
      // This is because Supabase doesn't support EXTRACT in .filter()
      console.log(`Rule ${ruleId}: Looking for anniversaries around ${currentMonth}/${currentDay} (±${windowDays} days)`);
      break;

    case 'churned_days':
      // Target Lost customers within a specific day range (e.g., 60-120 days)
      const minDays = trigger_value?.min_days || 60;
      const maxDays = trigger_value?.max_days || 120;
      query = query
        .eq('risk_level', 'Lost')
        .gte('days_since_last_visit', minDays)
        .lte('days_since_last_visit', maxDays);
      console.log(`Rule ${ruleId}: Targeting Lost customers (${minDays}-${maxDays} days)`);
      break;

    default:
      console.warn(`Unknown trigger type: ${trigger_type}`);
      return [];
  }

  const { data: customers, error } = await query.limit(200);

  if (error) {
    console.error('Error finding automation targets:', error);
    return [];
  }

  if (!customers || customers.length === 0) {
    console.log(`Rule ${ruleId}: No matching customers found`);
    return [];
  }

  console.log(`Rule ${ruleId}: Found ${customers.length} matching customers, checking eligibility...`);

  // Use unified eligibility system for filtering
  // v3.2: Updated global cooldown from 7 to 5 days (better for 22-day avg visit cycle)
  // v3.2: Anniversary automation bypasses global cooldown (special occasion)
  const customerIds = customers.map(c => c.doc);
  const bypassGlobal = rule.bypass_global_cooldown === true || trigger_type === 'registration_anniversary';

  try {
    // Call the batch eligibility check RPC
    const { data: eligibilityResults, error: eligError } = await supabase.rpc('check_customers_eligibility', {
      p_customer_ids: customerIds,
      p_campaign_type: campaignType,
      p_bypass_global: bypassGlobal // v3.2: Pass bypass flag for anniversary
    });

    if (eligError) {
      // Fallback to legacy automation_sends check if RPC fails
      console.warn(`Rule ${ruleId}: Eligibility RPC failed, falling back to automation_sends:`, eligError.message);

      // Use automation_sends for cooldown as fallback
      const cooldownPeriod = rule.cooldown_days || 14;
      const cooldownDate = new Date();
      cooldownDate.setDate(cooldownDate.getDate() - cooldownPeriod);

      const { data: recentSends } = await supabase
        .from('automation_sends')
        .select('customer_id')
        .eq('rule_id', ruleId)
        .gte('sent_at', cooldownDate.toISOString());

      const recentlyContacted = new Set((recentSends || []).map(c => c.customer_id));
      const filtered = customers.filter(c => !recentlyContacted.has(c.doc));

      console.log(`Rule ${ruleId}: ${customers.length} → ${filtered.length} after fallback cooldown filter`);
      return filtered;
    }

    // Filter to only eligible customers
    const eligibleIds = new Set(
      (eligibilityResults || [])
        .filter(r => r.is_eligible === true)
        .map(r => r.customer_id)
    );

    const filtered = customers.filter(c => eligibleIds.has(c.doc));

    // Log ineligible reasons for debugging
    const ineligible = (eligibilityResults || []).filter(r => !r.is_eligible);
    if (ineligible.length > 0) {
      console.log(`Rule ${ruleId}: ${ineligible.length} customers ineligible:`,
        ineligible.slice(0, 3).map(r => ({ id: r.customer_id, reason: r.reason }))
      );
    }

    console.log(`Rule ${ruleId}: ${customers.length} → ${filtered.length} after eligibility check`);
    return filtered;

  } catch (eligCheckError) {
    // If eligibility check fails completely, use legacy fallback
    console.error(`Rule ${ruleId}: Eligibility check error:`, eligCheckError.message);

    // Fallback to automation_sends cooldown
    const cooldownPeriod = rule.cooldown_days || 14;
    const cooldownDate = new Date();
    cooldownDate.setDate(cooldownDate.getDate() - cooldownPeriod);

    const { data: recentSends } = await supabase
      .from('automation_sends')
      .select('customer_id')
      .eq('rule_id', ruleId)
      .gte('sent_at', cooldownDate.toISOString());

    const recentlyContacted = new Set((recentSends || []).map(c => c.customer_id));
    const filtered = customers.filter(c => !recentlyContacted.has(c.doc));

    console.log(`Rule ${ruleId}: ${customers.length} → ${filtered.length} after error fallback`);
    return filtered;
  }
}

/**
 * Send a single automation message via Twilio
 * Uses record_automation_contact() SQL function for unified campaign tracking
 */
async function sendAutomationMessage(supabase, rule, target, contentSid) {
  const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!ACCOUNT_SID || !AUTH_TOKEN || !WHATSAPP_FROM) {
    throw new Error('Twilio credentials not configured');
  }

  const normalizedPhone = normalizePhone(target.telefone);
  if (!normalizedPhone) {
    return { success: false, error: 'Invalid phone number' };
  }

  // Prevent sending to the same number as From (Twilio error 63031)
  const normalizedFrom = normalizePhone(WHATSAPP_FROM);
  if (normalizedPhone === WHATSAPP_FROM || normalizedPhone === normalizedFrom) {
    console.log(`Skipping self-send: ${normalizedPhone} matches Twilio number`);
    return { success: false, error: 'Cannot send to Twilio number itself' };
  }

  // Build content variables for the template
  const contentVariables = buildContentVariables(rule, target);

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`;
  const credentials = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');

  const params = new URLSearchParams();
  params.append('From', `whatsapp:${WHATSAPP_FROM}`);
  params.append('To', `whatsapp:${normalizedPhone}`);
  params.append('ContentSid', contentSid);
  params.append('ContentVariables', JSON.stringify(contentVariables));

  try {
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await response.json();

    if (response.ok) {
      // Use the unified record_automation_contact SQL function
      // This creates entries in: automation_sends, contact_tracking, campaign_contacts
      // And updates the campaign sends count
      const { error: rpcError } = await supabase.rpc('record_automation_contact', {
        p_rule_id: rule.id,
        p_customer_id: target.doc,
        p_customer_name: target.nome,
        p_phone: normalizedPhone,
        p_message_sid: data.sid
      });

      if (rpcError) {
        console.error('Error recording automation contact:', rpcError);
        // Tracking failure shouldn't fail the send, but we need to create tracking records
        // This ensures campaign_performance view shows correct "Rastreados" count

        const campaignId = rule.campaign_id || `AUTO_${rule.id}`;
        const campaignName = 'Auto: ' + rule.name;
        const campaignType = getCampaignTypeFromTemplate(rule.action_template);
        const expiresAt = new Date(Date.now() + (rule.cooldown_days || 14) * 24 * 60 * 60 * 1000).toISOString();

        // Fallback 1: Create contact_tracking record (required for campaign_performance view)
        let contactTrackingId = null;
        try {
          const { data: tracking, error: trackingErr } = await supabase
            .from('contact_tracking')
            .insert({
              customer_id: target.doc,
              customer_name: target.nome,
              contact_method: 'whatsapp',
              campaign_id: campaignId,
              campaign_name: campaignName,
              campaign_type: campaignType,
              status: 'pending',
              contacted_at: new Date().toISOString(),
              expires_at: expiresAt
            })
            .select('id')
            .single();

          if (!trackingErr && tracking) {
            contactTrackingId = tracking.id;
            console.log(`Fallback: Created contact_tracking ${contactTrackingId}`);
          } else {
            console.error('Fallback contact_tracking insert failed:', trackingErr);
          }
        } catch (trackErr) {
          console.error('Fallback contact_tracking insert error:', trackErr);
        }

        // Fallback 2: Create campaign_contacts bridge record (links to contact_tracking)
        if (contactTrackingId) {
          try {
            await supabase.from('campaign_contacts').insert({
              campaign_id: campaignId,
              contact_tracking_id: contactTrackingId,
              customer_id: target.doc,
              customer_name: target.nome,
              phone: normalizedPhone,
              delivery_status: 'sent',
              twilio_sid: data.sid,
              sent_at: new Date().toISOString()
            });
            console.log(`Fallback: Created campaign_contacts for tracking ${contactTrackingId}`);
          } catch (bridgeErr) {
            console.error('Fallback campaign_contacts insert failed:', bridgeErr);
          }
        }

        // Fallback 3: Try to increment campaign sends count using RPC
        try {
          const { error: rpcIncrErr } = await supabase.rpc('increment_campaign_sends', {
            p_campaign_id: campaignId,
            p_send_count: 1
          });

          if (rpcIncrErr) {
            console.error('increment_campaign_sends RPC failed:', rpcIncrErr);
            // Fallback 4: Direct update with read-then-write
            const { data: campaign } = await supabase
              .from('campaigns')
              .select('sends')
              .eq('id', campaignId)
              .single();

            if (campaign) {
              await supabase
                .from('campaigns')
                .update({
                  sends: (campaign.sends || 0) + 1,
                  last_sent_at: new Date().toISOString(),
                  status: 'active'
                })
                .eq('id', campaignId);
            }
          }
          console.log(`Fallback: Updated sends count for campaign ${campaignId}`);
        } catch (fallbackErr) {
          console.error('Fallback send count update also failed:', fallbackErr);
        }

        // Fallback 5: Record in automation_sends for cooldown tracking
        try {
          await supabase.from('automation_sends').insert({
            rule_id: rule.id,
            customer_id: target.doc,
            customer_name: target.nome,
            phone: normalizedPhone,
            status: 'sent',
            message_sid: data.sid
          });
        } catch (sendErr) {
          console.error('Fallback automation_sends insert also failed:', sendErr);
        }
      }

      // Record comm log (separate for detailed history)
      await supabase.from('comm_logs').insert({
        phone: normalizedPhone,
        customer_id: target.doc,
        channel: 'whatsapp',
        direction: 'outbound',
        message: `Automation: ${rule.name}`,
        external_id: data.sid,
        status: 'sent',
        type: 'automation'
      });

      // v3.2: Update one-time send tracking columns
      await updateOneTimeTracking(supabase, rule, target);

      return { success: true, sid: data.sid };
    } else {
      // Log detailed error for debugging
      console.error('Twilio error:', {
        code: data.code,
        message: data.message,
        to: normalizedPhone,
        from: WHATSAPP_FROM,
        targetPhone: target.telefone
      });
      return { success: false, error: data.message || 'Twilio error' };
    }

  } catch (error) {
    console.error('Send message error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * v3.2: Update one-time send tracking columns after successful sends
 * This ensures welcome and post_visit messages are only sent once per customer
 */
async function updateOneTimeTracking(supabase, rule, target) {
  const template = rule.action_template;

  try {
    // Welcome automation: mark welcome_sent_at
    if (template === 'welcome_new') {
      const { error } = await supabase
        .from('customers')
        .update({ welcome_sent_at: new Date().toISOString() })
        .eq('doc', target.doc);

      if (error) {
        console.error(`Failed to update welcome_sent_at for ${target.doc}:`, error.message);
      } else {
        console.log(`Marked welcome_sent_at for customer ${target.doc}`);
      }
    }

    // Post-visit automation: mark post_visit_sent_at
    if (template === 'post_visit_thanks') {
      const { error } = await supabase
        .from('customers')
        .update({ post_visit_sent_at: new Date().toISOString() })
        .eq('doc', target.doc);

      if (error) {
        console.error(`Failed to update post_visit_sent_at for ${target.doc}:`, error.message);
      } else {
        console.log(`Marked post_visit_sent_at for customer ${target.doc}`);
      }
    }

    // Weather promo: update last_weather_campaign_date
    if (template === 'weather_promo') {
      const { error } = await supabase
        .from('customers')
        .update({ last_weather_campaign_date: new Date().toISOString().split('T')[0] })
        .eq('doc', target.doc);

      if (error) {
        console.error(`Failed to update last_weather_campaign_date for ${target.doc}:`, error.message);
      }
    }

    // Anniversary: update last_anniversary_year
    if (template === 'registration_anniversary' && target.data_cadastro) {
      const registrationDate = new Date(target.data_cadastro);
      const yearsAsCustomer = Math.floor((Date.now() - registrationDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

      const { error } = await supabase
        .from('customers')
        .update({ last_anniversary_year: yearsAsCustomer })
        .eq('doc', target.doc);

      if (error) {
        console.error(`Failed to update last_anniversary_year for ${target.doc}:`, error.message);
      } else {
        console.log(`Marked ${yearsAsCustomer}-year anniversary for customer ${target.doc}`);
      }
    }
  } catch (err) {
    console.error('One-time tracking update error:', err.message);
    // Don't fail the send for tracking errors
  }
}

/**
 * Build content variables for template personalization
 * Uses rule's coupon configuration if available, otherwise falls back to defaults
 */
function buildContentVariables(rule, target) {
  const firstName = (target.nome || 'Cliente').split(' ')[0];

  // Get coupon config from rule (with fallbacks)
  const couponCode = rule.coupon_code;
  const discountPercent = rule.discount_percent;
  const validityDays = rule.coupon_validity_days || 7;

  // Base variables for all templates
  const variables = {
    '1': firstName  // {{1}} is always the customer name
  };

  // Add rule-specific variables
  switch (rule.action_template) {
    case 'winback_discount':
      // Win-back 30d: {{2}}=discount, {{3}}=coupon, {{4}}=expiration
      variables['2'] = String(discountPercent || 20);
      variables['3'] = couponCode || 'VOLTE20';
      variables['4'] = formatExpirationDate(validityDays);
      break;

    case 'winback_critical':
      // Win-back 45d: {{2}}=days_away, {{3}}=discount, {{4}}=coupon, {{5}}=expiration
      variables['2'] = String(target.days_since_last_visit || 45);
      variables['3'] = String(discountPercent || 30);
      variables['4'] = couponCode || 'VOLTE30';
      variables['5'] = formatExpirationDate(validityDays);
      break;

    case 'wallet_reminder':
      // Wallet reminder: {{2}}=balance
      variables['2'] = formatCurrency(target.saldo_carteira || 0);
      break;

    case 'welcome_new':
      // Welcome: {{2}}=coupon, {{3}}=discount, {{4}}=expiration
      variables['2'] = couponCode || 'BEM10';
      variables['3'] = String(discountPercent || 10);
      variables['4'] = formatExpirationDate(validityDays);
      break;

    case 'post_visit_thanks':
      // Post-visit: only {{1}}=name (single variable template)
      // No additional variables needed
      break;

    // =====================================================
    // v3.2: NEW AUTOMATION TEMPLATES
    // =====================================================

    case 'rfm_loyalty_vip':
      // VIP Loyalty: {{2}}=gift_description, {{3}}=expiration
      // Gift can be "10% OFF com cupom VIP10", "20% OFF com cupom VIP20", or "Bolsa Lavpop exclusiva"
      const vipCoupon = couponCode || 'VIP10';
      let giftDescription;
      if (vipCoupon === 'BOLSA') {
        giftDescription = 'Bolsa Lavpop exclusiva - retire na loja!';
      } else {
        giftDescription = `${discountPercent || 10}% OFF com cupom ${vipCoupon}`;
      }
      variables['2'] = giftDescription;
      variables['3'] = formatExpirationDate(validityDays);
      break;

    case 'weather_promo':
      // Weather promo: {{2}}=discount, {{3}}=coupon, {{4}}=expiration
      variables['2'] = String(discountPercent || 15);
      variables['3'] = couponCode || 'CLIMA15';
      variables['4'] = formatExpirationDate(validityDays);
      break;

    case 'registration_anniversary':
      // Anniversary: {{2}}=years_text, {{3}}=discount, {{4}}=coupon, {{5}}=expiration
      // Calculate years from data_cadastro
      let yearsText = '1 ano';
      if (target.data_cadastro) {
        const regDate = new Date(target.data_cadastro);
        const years = Math.floor((Date.now() - regDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        yearsText = years === 1 ? '1 ano' : `${years} anos`;
      }
      variables['2'] = yearsText;
      variables['3'] = String(discountPercent || 20);
      variables['4'] = couponCode || 'ANIVER20';
      variables['5'] = formatExpirationDate(validityDays);
      break;

    case 'churned_recovery':
      // Churned recovery: {{2}}=days_since_visit, {{3}}=offer_description, {{4}}=coupon, {{5}}=expiration
      variables['2'] = String(target.days_since_last_visit || 60);
      // Offer can be "50% OFF em qualquer serviço" or "1 CICLO GRÁTIS (lavagem ou secagem)"
      const churnedCoupon = couponCode || 'VOLTA50';
      let offerDescription;
      if (churnedCoupon === 'GRATIS') {
        offerDescription = '*1 CICLO GRÁTIS* (lavagem ou secagem)';
      } else {
        offerDescription = `*${discountPercent || 50}% OFF* em qualquer serviço`;
      }
      variables['3'] = offerDescription;
      variables['4'] = churnedCoupon;
      variables['5'] = formatExpirationDate(validityDays);
      break;
  }

  return variables;
}

/**
 * Normalize phone number to E.164 format (+55XXXXXXXXXXX)
 * Handles:
 * - 11 digits: Standard Brazilian mobile (DDD + 9 + 8 digits)
 * - 10 digits: Old format pre-2012 (DDD + 8 digits) - adds "9" after DDD
 * - 13 digits: With country code (55 + DDD + 9 + 8 digits)
 * - 12 digits: With country code, old format (55 + DDD + 8 digits)
 */
function normalizePhone(phone) {
  if (!phone) return null;

  // Remove non-digits
  const digits = phone.replace(/\D/g, '');

  // Handle Brazilian numbers
  if (digits.length === 11) {
    // Standard format: DDD (2) + 9 + 8 digits
    return `+55${digits}`;
  } else if (digits.length === 10) {
    // Old format pre-2012: DDD (2) + 8 digits
    // Insert "9" after the DDD to convert to new format
    const ddd = digits.slice(0, 2);
    const number = digits.slice(2);
    return `+55${ddd}9${number}`;
  } else if (digits.length === 13 && digits.startsWith('55')) {
    // With country code: 55 + DDD + 9 + 8 digits
    return `+${digits}`;
  } else if (digits.length === 12 && digits.startsWith('55')) {
    // With country code, old format: 55 + DDD + 8 digits
    // Insert "9" after the DDD
    const ddd = digits.slice(2, 4);
    const number = digits.slice(4);
    return `+55${ddd}9${number}`;
  }

  return null;
}

/**
 * Format expiration date as DD/MM
 */
function formatExpirationDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// ==================== CAMPAIGN RETURN DETECTION (v2.4) ====================

/**
 * Process campaign returns and coupon redemptions
 * Calls the process_campaign_returns() SQL function which:
 * 1. Links coupon redemptions from transactions to campaigns (usou_cupom=true → coupon_redemptions)
 * 2. Detects customer returns by comparing last_visit with contacted_at
 * 3. Expires old pending contacts (> 30 days)
 *
 * This closes the feedback loop for campaign effectiveness tracking:
 * - Return rates now update based on actual customer visits
 * - ROI can be calculated from coupon redemptions
 * - Campaign performance views show real data instead of 0%
 *
 * @param {Object} supabase - Supabase client
 * @returns {Object} Results with counts of returns detected, coupons linked, contacts expired
 */
async function processCampaignReturns(supabase) {
  console.log('Processing campaign returns and coupon redemptions...');

  const results = {
    returns_detected: 0,
    coupons_linked: 0,
    contacts_expired: 0,
    error: null
  };

  try {
    // Call the unified SQL function that handles all three operations
    const { data, error } = await supabase.rpc('process_campaign_returns');

    if (error) {
      console.error('Error processing campaign returns:', error);
      results.error = error.message;

      // Try individual functions as fallback
      console.log('Attempting individual return detection functions...');

      try {
        // 1. Link coupon redemptions
        const { data: couponsLinked, error: couponErr } = await supabase.rpc('link_pending_coupon_redemptions');
        if (!couponErr) {
          results.coupons_linked = couponsLinked || 0;
          console.log(`Linked ${results.coupons_linked} coupon redemptions`);
        } else {
          console.error('link_pending_coupon_redemptions failed:', couponErr);
        }
      } catch (e) {
        console.error('Coupon linking fallback failed:', e);
      }

      try {
        // 2. Detect returns
        const { data: returnsDetected, error: returnErr } = await supabase.rpc('detect_customer_returns');
        if (!returnErr) {
          results.returns_detected = returnsDetected || 0;
          console.log(`Detected ${results.returns_detected} customer returns`);
        } else {
          console.error('detect_customer_returns failed:', returnErr);
        }
      } catch (e) {
        console.error('Return detection fallback failed:', e);
      }

      try {
        // 3. Expire old contacts
        const { data: expired, error: expireErr } = await supabase.rpc('expire_old_contacts');
        if (!expireErr) {
          results.contacts_expired = expired || 0;
          console.log(`Expired ${results.contacts_expired} old contacts`);
        } else {
          console.error('expire_old_contacts failed:', expireErr);
        }
      } catch (e) {
        console.error('Contact expiration fallback failed:', e);
      }

      return results;
    }

    // Extract results from the unified function (returns a single row)
    if (data && data.length > 0) {
      results.coupons_linked = data[0].coupons_linked || 0;
      results.returns_detected = data[0].returns_detected || 0;
      results.contacts_expired = data[0].contacts_expired || 0;
    }

    console.log(`Campaign returns processed: ${results.returns_detected} returns, ${results.coupons_linked} coupons, ${results.contacts_expired} expired`);

    return results;

  } catch (error) {
    console.error('Campaign return processing error:', error);
    results.error = error.message;
    return results;
  }
}
