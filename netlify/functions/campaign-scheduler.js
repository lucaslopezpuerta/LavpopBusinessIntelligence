// netlify/functions/campaign-scheduler.js
// Scheduled function to execute pending campaigns and automation rules
// Runs every 5 minutes via Netlify Scheduled Functions
//
// v2.8 (2025-12-14): Improved failure logging + hourly return processing
//   - Added summary log after each rule showing failures with error messages
//   - Shows last 4 digits of phone + error reason (e.g., "63016: Template not found")
//   - Added separate log for blacklist skips
//   - Changed return processing from 4x daily to every hour (faster feedback loop)
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

// Template ContentSid mapping for automation rules
// Must match messageTemplates.js twilioContentSid values
const AUTOMATION_TEMPLATE_SIDS = {
  winback_discount: 'HX58267edb5948cfa0fb5c3ba73ea1d767',
  winback_critical: 'HXd4e8e8b1588f01c549446c0e157154bb',
  welcome_new: 'HX2ae8ce2a72d92866fd28516aca9d76c3',  // Fixed: was using winback_wash_only SID
  wallet_reminder: 'HXa1f6a3f3c586acd36cb25a2d98a766fc',
  post_visit_thanks: 'HX62540533ed5cf7f251377cf3b4adbd8a'
};

// Map automation templates to campaign types for eligibility checks
// Used by the unified is_customer_contactable() function
const TEMPLATE_TO_CAMPAIGN_TYPE = {
  winback_discount: 'winback',
  winback_critical: 'winback',
  welcome_new: 'welcome',
  wallet_reminder: 'wallet',
  post_visit_thanks: 'post_visit',
  upsell_secagem: 'upsell'
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

exports.handler = async (event, context) => {
  console.log('Campaign scheduler running at:', new Date().toISOString());

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

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Processed ${results.length} campaigns, ${automationResults.processed} automation rules${returnResults.skipped ? '' : `, ${returnResults.returns_detected} returns detected`}`,
        campaigns: results,
        automation: automationResults,
        returns: returnResults
      })
    };

  } catch (error) {
    console.error('Campaign scheduler error:', error);
    return {
      statusCode: 500,
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
      query = query
        .eq('transaction_count', 1)
        .eq('risk_level', 'New Customer')
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
      const hoursAgo = new Date();
      hoursAgo.setHours(hoursAgo.getHours() - trigger_value);
      const targetDate = hoursAgo.toISOString().split('T')[0];
      // For simplicity, treat as "visited yesterday" for 24h rule
      query = query.eq('last_visit', targetDate);
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
  // This checks global cooldown (7 days) and same-type cooldown (30 days)
  const customerIds = customers.map(c => c.doc);

  try {
    // Call the batch eligibility check RPC
    const { data: eligibilityResults, error: eligError } = await supabase.rpc('check_customers_eligibility', {
      p_customer_ids: customerIds,
      p_campaign_type: campaignType,
      p_min_days_global: 7,
      p_min_days_same_type: 30
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
  }

  return variables;
}

/**
 * Normalize phone number to E.164 format (+55XXXXXXXXXXX)
 */
function normalizePhone(phone) {
  if (!phone) return null;

  // Remove non-digits
  const digits = phone.replace(/\D/g, '');

  // Handle Brazilian numbers
  if (digits.length === 11) {
    return `+55${digits}`;
  } else if (digits.length === 13 && digits.startsWith('55')) {
    return `+${digits}`;
  } else if (digits.length === 12 && digits.startsWith('55')) {
    // Missing the 9 digit
    return `+${digits}`;
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
