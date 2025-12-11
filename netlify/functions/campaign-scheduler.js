// netlify/functions/campaign-scheduler.js
// Scheduled function to execute pending campaigns and automation rules
// Runs every 5 minutes via Netlify Scheduled Functions
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
  welcome_new: 'HX6d31e447e8af840368b1167573ec9d6f',
  wallet_reminder: 'HXa1f6a3f3c586acd36cb25a2d98a766fc',
  post_visit_thanks: 'HX62540533ed5cf7f251377cf3b4adbd8a'
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

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Processed ${results.length} campaigns, ${automationResults.processed} automation rules`,
        campaigns: results,
        automation: automationResults
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

    // Filter out expired rules and rules that hit max sends
    const now = new Date();
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

      // Update total_sends_count in database
      if (ruleResult.sent > 0) {
        await supabase
          .from('automation_rules')
          .update({
            total_sends_count: (rule.total_sends_count || 0) + ruleResult.sent,
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
 */
async function processAutomationRule(supabase, rule, blacklistedPhones) {
  console.log(`Processing rule: ${rule.id} (${rule.name})`);

  const result = {
    ruleId: rule.id,
    ruleName: rule.name,
    sent: 0,
    failed: 0,
    skipped: 0,
    targets: []
  };

  try {
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

    return result;

  } catch (error) {
    console.error(`Error processing rule ${rule.id}:`, error);
    result.error = error.message;
    return result;
  }
}

/**
 * Find customers matching automation rule criteria
 * Excludes customers already contacted for this rule within cooldown period
 */
async function findAutomationTargets(supabase, rule) {
  const { trigger_type, trigger_value, id: ruleId, cooldown_days } = rule;

  // Use configurable cooldown_days (default 14 if not set)
  const cooldownPeriod = cooldown_days || 14;
  const cooldownDate = new Date();
  cooldownDate.setDate(cooldownDate.getDate() - cooldownPeriod);

  const { data: recentContacts } = await supabase
    .from('contact_tracking')
    .select('customer_id')
    .eq('campaign_id', ruleId)
    .gte('contacted_at', cooldownDate.toISOString());

  const recentlyContacted = new Set((recentContacts || []).map(c => c.customer_id));

  // Build query based on trigger type
  let query = supabase
    .from('customers')
    .select('doc, nome, telefone, saldo_carteira, days_since_last_visit, last_visit, transaction_count')
    .not('telefone', 'is', null);

  switch (trigger_type) {
    case 'days_since_visit':
      // Customers inactive for X+ days
      query = query.gte('days_since_last_visit', trigger_value);
      break;

    case 'first_purchase':
      // New customers (transaction_count = 1) registered in last X days
      query = query
        .eq('transaction_count', 1)
        .gte('last_visit', new Date(Date.now() - trigger_value * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      break;

    case 'wallet_balance':
      // Customers with wallet balance >= X
      query = query.gte('saldo_carteira', trigger_value);
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

  const { data: customers, error } = await query.limit(100);

  if (error) {
    console.error('Error finding automation targets:', error);
    return [];
  }

  // Filter out recently contacted
  return (customers || []).filter(c => !recentlyContacted.has(c.doc));
}

/**
 * Send a single automation message via Twilio
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
      // Record contact tracking (use cooldown_days for expiration)
      const expirationDays = rule.cooldown_days || 14;
      await supabase.from('contact_tracking').insert({
        customer_id: target.doc,
        customer_name: target.nome,
        contact_method: 'whatsapp',
        campaign_id: rule.id,
        status: 'pending',
        expires_at: new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString()
      });

      // Record comm log
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
      console.error('Twilio error:', data);
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
