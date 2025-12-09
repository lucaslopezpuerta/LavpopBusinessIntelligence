// campaignService.js v3.0
// Campaign management and WhatsApp messaging service
// Integrates with Netlify function for Twilio WhatsApp API
// Now supports Supabase backend for scheduled campaigns and effectiveness tracking
//
// CHANGELOG:
// v3.0 (2025-12-08): Added campaign effectiveness tracking
//   - recordCampaignContact links campaigns to contact_tracking
//   - getCampaignPerformance retrieves effectiveness metrics
//   - getCampaignContacts shows individual contact outcomes
//   - New campaign_contacts table bridges campaigns ↔ contact_tracking
// v2.0 (2025-12-08): Added Supabase backend support
//   - Scheduled campaigns now stored in database
//   - Backend executor runs scheduled campaigns automatically
//   - Async API with localStorage fallback
// v1.2 (2025-12-08): Added blacklist integration
//   - validateCampaignAudience now filters blacklisted numbers
//   - Exports isBlacklisted for component use
//   - Supports opt-out, undelivered, and manually blocked numbers
// v1.1 (2025-12-03): Added Brazilian mobile phone validation
//   - Validates phone numbers before sending to avoid Twilio errors
//   - Uses shared phoneUtils for consistent validation across app

import {
  normalizePhone,
  isValidBrazilianMobile,
  getPhoneValidationError,
  getCampaignRecipients
} from './phoneUtils';
import { api, isBackendAvailable } from './apiService';

const TWILIO_FUNCTION_URL = '/.netlify/functions/twilio-whatsapp';

// Storage keys
const SCHEDULED_CAMPAIGNS_KEY = 'lavpop_scheduled_campaigns';

// Backend availability cache
let useBackend = null;

async function shouldUseBackend() {
  if (useBackend === null) {
    useBackend = await isBackendAvailable();
  }
  return useBackend;
}

// ==================== WHATSAPP MESSAGING ====================

/**
 * Send a single WhatsApp message
 * @param {string} phone - Recipient phone number
 * @param {string} message - Message content
 * @param {string} templateName - Optional template name
 * @param {object} templateVariables - Optional template variables
 * @returns {Promise<object>} Send result
 */
export async function sendWhatsAppMessage(phone, message, templateName = null, templateVariables = null) {
  try {
    // Validate and normalize phone number
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      const error = getPhoneValidationError(phone);
      throw new Error(`Número inválido: ${error}`);
    }

    const response = await fetch(TWILIO_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send_message',
        to: normalizedPhone,
        message,
        templateName,
        templateVariables
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send message');
    }

    // Log to communication history
    logCommunication(normalizedPhone, 'whatsapp', message, data.messageSid);

    return data;
  } catch (error) {
    console.error('WhatsApp send error:', error);
    throw error;
  }
}

/**
 * Send bulk WhatsApp messages to multiple recipients
 * Validates phone numbers before sending - invalid phones are filtered out
 *
 * @param {Array<object>} recipients - Array of { phone, name, ...customerData }
 * @param {string} message - Message content (can include {{nome}}, {{saldo}} placeholders)
 * @param {string} templateName - Optional template name
 * @param {object} templateVariables - Optional template variables
 * @returns {Promise<object>} Bulk send results including validation stats
 */
export async function sendBulkWhatsApp(recipients, message, templateName = null, templateVariables = null) {
  try {
    // Validate and normalize all phone numbers
    const { valid, invalid, stats } = getCampaignRecipients(recipients);

    if (valid.length === 0) {
      return {
        success: false,
        error: 'Nenhum destinatário com número válido',
        validation: { ...stats, invalidRecipients: invalid }
      };
    }

    console.log(`📱 Sending to ${valid.length} valid recipients (${invalid.length} invalid filtered)`);

    const response = await fetch(TWILIO_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send_bulk',
        recipients: valid,
        message,
        templateName,
        templateVariables
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send bulk messages');
    }

    // Log successful sends
    if (data.results?.success) {
      data.results.success.forEach(result => {
        logCommunication(result.phone, 'whatsapp', message, result.messageSid);
      });
    }

    // Include validation stats in response
    return {
      ...data,
      validation: {
        ...stats,
        invalidRecipients: invalid
      }
    };
  } catch (error) {
    console.error('Bulk WhatsApp send error:', error);
    throw error;
  }
}

/**
 * Check message delivery status
 * @param {string} messageSid - Twilio message SID
 * @returns {Promise<object>} Message status
 */
export async function checkMessageStatus(messageSid) {
  try {
    const response = await fetch(TWILIO_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'check_status',
        messageSid
      })
    });

    return await response.json();
  } catch (error) {
    console.error('Status check error:', error);
    throw error;
  }
}

// ==================== CAMPAIGN MANAGEMENT ====================

const CAMPAIGNS_STORAGE_KEY = 'lavpop_campaigns';
const CAMPAIGN_SENDS_KEY = 'lavpop_campaign_sends';

/**
 * Get all saved campaigns
 * @returns {Array<object>} Campaigns list
 */
export function getCampaigns() {
  try {
    const stored = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save a new campaign
 * @param {object} campaign - Campaign data
 * @returns {object} Saved campaign with ID
 */
export function saveCampaign(campaign) {
  const campaigns = getCampaigns();
  const newCampaign = {
    ...campaign,
    id: `CAMP_${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'draft',
    sends: 0,
    delivered: 0,
    opened: 0,
    converted: 0
  };

  campaigns.push(newCampaign);
  localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));

  return newCampaign;
}

/**
 * Update campaign status
 * @param {string} campaignId - Campaign ID
 * @param {object} updates - Fields to update
 * @returns {object|null} Updated campaign
 */
export function updateCampaign(campaignId, updates) {
  const campaigns = getCampaigns();
  const index = campaigns.findIndex(c => c.id === campaignId);

  if (index === -1) return null;

  campaigns[index] = { ...campaigns[index], ...updates, updatedAt: new Date().toISOString() };
  localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));

  return campaigns[index];
}

/**
 * Record a campaign send event
 * @param {string} campaignId - Campaign ID
 * @param {object} sendData - Send details { recipients, successCount, failedCount }
 */
export function recordCampaignSend(campaignId, sendData) {
  // Update campaign stats
  const campaigns = getCampaigns();
  const campaign = campaigns.find(c => c.id === campaignId);

  if (campaign) {
    campaign.sends = (campaign.sends || 0) + sendData.successCount;
    campaign.lastSentAt = new Date().toISOString();
    campaign.status = 'active';
    localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
  }

  // Log send event
  const sends = getCampaignSends();
  sends.push({
    campaignId,
    timestamp: new Date().toISOString(),
    ...sendData
  });
  localStorage.setItem(CAMPAIGN_SENDS_KEY, JSON.stringify(sends.slice(-100))); // Keep last 100
}

/**
 * Get campaign send history
 * @param {string} campaignId - Optional filter by campaign
 * @returns {Array<object>} Send events
 */
export function getCampaignSends(campaignId = null) {
  try {
    const stored = localStorage.getItem(CAMPAIGN_SENDS_KEY);
    const sends = stored ? JSON.parse(stored) : [];
    return campaignId ? sends.filter(s => s.campaignId === campaignId) : sends;
  } catch {
    return [];
  }
}

// ==================== AUTOMATION RULES ====================

const AUTOMATION_RULES_KEY = 'lavpop_automation_rules';

/**
 * Get automation rules configuration
 * @returns {Array<object>} Automation rules
 */
export function getAutomationRules() {
  try {
    const stored = localStorage.getItem(AUTOMATION_RULES_KEY);
    return stored ? JSON.parse(stored) : getDefaultAutomationRules();
  } catch {
    return getDefaultAutomationRules();
  }
}

/**
 * Save automation rules configuration
 * @param {Array<object>} rules - Rules to save
 */
export function saveAutomationRules(rules) {
  localStorage.setItem(AUTOMATION_RULES_KEY, JSON.stringify(rules));
}

/**
 * Get default automation rules
 */
function getDefaultAutomationRules() {
  return [
    {
      id: 'winback_30',
      name: 'Win-back 30 dias',
      enabled: false,
      trigger: { type: 'days_since_visit', value: 30 },
      action: { template: 'winback_30days', channel: 'whatsapp' }
    },
    {
      id: 'winback_45',
      name: 'Win-back Crítico',
      enabled: false,
      trigger: { type: 'days_since_visit', value: 45 },
      action: { template: 'winback_critical', channel: 'whatsapp' }
    },
    {
      id: 'welcome_new',
      name: 'Boas-vindas',
      enabled: false,
      trigger: { type: 'first_purchase', value: 1 },
      action: { template: 'welcome_new', channel: 'whatsapp' }
    },
    {
      id: 'wallet_reminder',
      name: 'Lembrete de Saldo',
      enabled: false,
      trigger: { type: 'wallet_balance', value: 20 },
      action: { template: 'wallet_reminder', channel: 'whatsapp' }
    }
  ];
}

/**
 * Find customers matching automation rule trigger
 * Only returns customers with valid Brazilian mobile phones (WhatsApp-capable)
 *
 * @param {object} rule - Automation rule
 * @param {Array<object>} customers - Customer list
 * @returns {Array<object>} Matching customers with valid phones
 */
export function findAutomationTargets(rule, customers) {
  // Helper to check valid WhatsApp phone
  const hasValidWhatsApp = (c) => isValidBrazilianMobile(c.phone);

  switch (rule.trigger.type) {
    case 'days_since_visit':
      return customers.filter(c =>
        c.daysSinceLastVisit >= rule.trigger.value &&
        hasValidWhatsApp(c)
      );

    case 'first_purchase':
      // New customers (first visit within last 24 hours)
      return customers.filter(c =>
        c.riskLevel === 'New Customer' &&
        hasValidWhatsApp(c)
      );

    case 'wallet_balance':
      return customers.filter(c =>
        (c.walletBalance || 0) >= rule.trigger.value &&
        c.daysSinceLastVisit >= 14 &&
        hasValidWhatsApp(c)
      );

    case 'hours_after_visit':
      // Post-visit automation (customers who visited recently)
      return customers.filter(c =>
        c.daysSinceLastVisit === 0 && // Visited today
        hasValidWhatsApp(c)
      );

    default:
      return [];
  }
}

// ==================== COMMUNICATION LOG ====================

const COMM_LOG_KEY = 'lavpop_comm_log';

/**
 * Log a communication event
 * @param {string} phone - Customer phone
 * @param {string} channel - Communication channel (whatsapp, email, sms)
 * @param {string} message - Message content
 * @param {string} externalId - External reference (messageSid, etc.)
 */
function logCommunication(phone, channel, message, externalId = null) {
  try {
    const logs = JSON.parse(localStorage.getItem(COMM_LOG_KEY) || '[]');
    logs.push({
      phone,
      channel,
      message: message?.substring(0, 100), // Store truncated message
      externalId,
      timestamp: new Date().toISOString(),
      status: 'sent'
    });
    // Keep last 500 entries
    localStorage.setItem(COMM_LOG_KEY, JSON.stringify(logs.slice(-500)));
  } catch (error) {
    console.error('Failed to log communication:', error);
  }
}

/**
 * Get communication logs for a phone number
 * @param {string} phone - Customer phone
 * @returns {Array<object>} Communication logs
 */
export function getCommunicationLogs(phone) {
  try {
    const logs = JSON.parse(localStorage.getItem(COMM_LOG_KEY) || '[]');
    return phone ? logs.filter(l => l.phone === phone) : logs;
  } catch {
    return [];
  }
}

// ==================== MESSAGE TEMPLATES ====================

export const MESSAGE_TEMPLATES = {
  winback_30days: {
    name: 'Win-back 30 dias',
    variables: ['nome_cliente', 'desconto', 'cupom', 'data_validade'],
    category: 'MARKETING'
  },
  welcome_new: {
    name: 'Boas-vindas',
    variables: ['nome_cliente', 'cashback'],
    category: 'MARKETING'
  },
  wallet_reminder: {
    name: 'Lembrete de Saldo',
    variables: ['nome_cliente', 'saldo'],
    category: 'UTILITY'
  },
  promo_seasonal: {
    name: 'Promoção Sazonal',
    variables: ['nome_cliente', 'titulo_promo', 'descricao', 'data_validade'],
    category: 'MARKETING'
  }
};

/**
 * Get template configuration
 * @param {string} templateName - Template identifier
 * @returns {object|null} Template config
 */
export function getTemplate(templateName) {
  return MESSAGE_TEMPLATES[templateName] || null;
}

// ==================== PHONE VALIDATION RE-EXPORTS ====================
// Re-export phone validation utilities for use in components

export {
  normalizePhone,
  isValidBrazilianMobile,
  getPhoneValidationError,
  getCampaignRecipients
} from './phoneUtils';

// Import blacklist utilities
import { isBlacklisted, filterBlacklistedRecipients } from './blacklistService';

/**
 * Validate a list of customers for campaign readiness
 * Returns stats and filtered lists for UI preview
 * Now includes blacklist filtering (v1.1)
 *
 * @param {Array<object>} customers - Customer list
 * @returns {object} { ready, invalid, blacklisted, stats }
 */
export function validateCampaignAudience(customers) {
  const { valid, invalid, stats } = getCampaignRecipients(customers);

  // Filter blacklisted from valid recipients
  const { allowed, blocked, stats: blacklistStats } = filterBlacklistedRecipients(valid);

  return {
    ready: allowed,           // Customers ready for WhatsApp (valid phone, not blacklisted)
    invalid: invalid,         // Customers with invalid phones
    blacklisted: blocked,     // Customers with valid phones but blacklisted
    stats: {
      ...stats,
      readyCount: allowed.length,
      invalidCount: invalid.length,
      blacklistedCount: blocked.length,
      blacklistedByOptOut: blacklistStats.blockedByOptOut,
      blacklistedByUndelivered: blacklistStats.blockedByUndelivered
    }
  };
}

/**
 * Check if a single phone is blacklisted
 * @param {string} phone - Phone number
 * @returns {boolean} True if blacklisted
 */
export { isBlacklisted };

// ==================== SCHEDULED CAMPAIGNS ====================

/**
 * Get scheduled campaigns from localStorage
 * @returns {Array} Scheduled campaigns
 */
export function getScheduledCampaigns() {
  try {
    const stored = localStorage.getItem(SCHEDULED_CAMPAIGNS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save scheduled campaign to localStorage
 * @param {object} campaign - Campaign data
 * @returns {object} Saved campaign
 */
export function saveScheduledCampaign(campaign) {
  const campaigns = getScheduledCampaigns();
  const newCampaign = {
    ...campaign,
    id: `SCHED_${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'scheduled'
  };
  campaigns.push(newCampaign);
  localStorage.setItem(SCHEDULED_CAMPAIGNS_KEY, JSON.stringify(campaigns));
  return newCampaign;
}

/**
 * Cancel a scheduled campaign
 * @param {string} id - Campaign ID
 * @returns {boolean} Success
 */
export function cancelScheduledCampaign(id) {
  const campaigns = getScheduledCampaigns();
  const index = campaigns.findIndex(c => c.id === id && c.status === 'scheduled');
  if (index === -1) return false;

  campaigns[index].status = 'cancelled';
  localStorage.setItem(SCHEDULED_CAMPAIGNS_KEY, JSON.stringify(campaigns));
  return true;
}

// ==================== ASYNC BACKEND OPERATIONS ====================
// These functions use Supabase backend with localStorage fallback

/**
 * Get scheduled campaigns with backend support
 * @returns {Promise<Array>} Scheduled campaigns
 */
export async function getScheduledCampaignsAsync() {
  try {
    if (await shouldUseBackend()) {
      return await api.scheduled.getAll();
    }
  } catch (error) {
    console.warn('Backend fetch failed, using localStorage:', error.message);
  }
  return getScheduledCampaigns();
}

/**
 * Create scheduled campaign with backend support
 * @param {object} campaignData - Campaign data
 * @returns {Promise<object>} Created campaign
 */
export async function createScheduledCampaignAsync(campaignData) {
  try {
    if (await shouldUseBackend()) {
      return await api.scheduled.create({
        templateId: campaignData.templateId,
        audience: campaignData.audience,
        messageBody: campaignData.messageBody,
        recipients: campaignData.recipients,
        scheduledFor: campaignData.scheduledFor
      });
    }
  } catch (error) {
    console.warn('Backend create failed, using localStorage:', error.message);
  }
  return saveScheduledCampaign(campaignData);
}

/**
 * Cancel scheduled campaign with backend support
 * @param {string} id - Campaign ID
 * @returns {Promise<boolean>} Success
 */
export async function cancelScheduledCampaignAsync(id) {
  try {
    if (await shouldUseBackend()) {
      await api.scheduled.cancel(id);
      return true;
    }
  } catch (error) {
    console.warn('Backend cancel failed, using localStorage:', error.message);
  }
  return cancelScheduledCampaign(id);
}

/**
 * Get campaigns with backend support
 * @returns {Promise<Array>} Campaigns
 */
export async function getCampaignsAsync() {
  try {
    if (await shouldUseBackend()) {
      return await api.campaigns.getAll();
    }
  } catch (error) {
    console.warn('Backend fetch failed, using localStorage:', error.message);
  }
  return getCampaigns();
}

/**
 * Create campaign with backend support
 * @param {object} campaignData - Campaign data
 * @returns {Promise<object>} Created campaign
 */
export async function createCampaignAsync(campaignData) {
  try {
    if (await shouldUseBackend()) {
      return await api.campaigns.create(campaignData);
    }
  } catch (error) {
    console.warn('Backend create failed, using localStorage:', error.message);
  }
  return saveCampaign(campaignData);
}

/**
 * Record campaign send with backend support
 * @param {string} campaignId - Campaign ID
 * @param {object} sendData - Send details
 * @returns {Promise<void>}
 */
export async function recordCampaignSendAsync(campaignId, sendData) {
  try {
    if (await shouldUseBackend()) {
      await api.sends.record({
        campaignId,
        recipients: sendData.recipients,
        successCount: sendData.successCount,
        failedCount: sendData.failedCount
      });
      return;
    }
  } catch (error) {
    console.warn('Backend record failed, using localStorage:', error.message);
  }
  recordCampaignSend(campaignId, sendData);
}

/**
 * Get automation rules with backend support
 * @returns {Promise<Array>} Automation rules
 */
export async function getAutomationRulesAsync() {
  try {
    if (await shouldUseBackend()) {
      return await api.automation.getAll();
    }
  } catch (error) {
    console.warn('Backend fetch failed, using localStorage:', error.message);
  }
  return getAutomationRules();
}

/**
 * Save automation rules with backend support
 * @param {Array} rules - Rules to save
 * @returns {Promise<void>}
 */
export async function saveAutomationRulesAsync(rules) {
  try {
    if (await shouldUseBackend()) {
      await api.automation.save(rules);
      return;
    }
  } catch (error) {
    console.warn('Backend save failed, using localStorage:', error.message);
  }
  saveAutomationRules(rules);
}

// ==================== CAMPAIGN EFFECTIVENESS TRACKING ====================
// These functions link campaigns to contact_tracking for measuring return rates

/**
 * Record a campaign contact for effectiveness tracking
 * Creates entries in both contact_tracking and campaign_contacts tables
 * @param {string} campaignId - Campaign ID
 * @param {object} contactData - { customerId, customerName, phone, contactMethod }
 * @returns {Promise<object>} Created records
 */
export async function recordCampaignContact(campaignId, contactData) {
  const { customerId, customerName, phone, contactMethod = 'whatsapp' } = contactData;

  try {
    if (await shouldUseBackend()) {
      // Get campaign name for the contact_tracking record
      const campaign = await api.campaigns.getById(campaignId);
      const campaignName = campaign?.name || campaignId;

      // Create contact_tracking record
      const { data: trackingData, error: trackingError } = await api.supabase
        .from('contact_tracking')
        .insert([{
          customer_id: customerId,
          customer_name: customerName,
          contact_method: contactMethod,
          campaign_id: campaignId,
          campaign_name: campaignName,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }])
        .select()
        .single();

      if (trackingError) throw trackingError;

      // Create campaign_contacts link
      const { data: contactRecord, error: contactError } = await api.supabase
        .from('campaign_contacts')
        .insert([{
          campaign_id: campaignId,
          contact_tracking_id: trackingData.id,
          customer_id: customerId,
          customer_name: customerName,
          phone: phone,
          delivery_status: 'pending'
        }])
        .select()
        .single();

      if (contactError) throw contactError;

      console.log(`[CampaignService] Recorded contact for campaign ${campaignId}: ${customerId}`);
      return { tracking: trackingData, contact: contactRecord };
    }
  } catch (error) {
    console.warn('[CampaignService] Failed to record campaign contact:', error.message);
  }

  // Fallback: store in localStorage
  const sends = JSON.parse(localStorage.getItem(CAMPAIGN_SENDS_KEY) || '[]');
  const localRecord = {
    id: Date.now(),
    campaign_id: campaignId,
    customer_id: customerId,
    customer_name: customerName,
    phone: phone,
    contact_method: contactMethod,
    sent_at: new Date().toISOString(),
    status: 'pending'
  };
  sends.push(localRecord);
  localStorage.setItem(CAMPAIGN_SENDS_KEY, JSON.stringify(sends.slice(-500)));

  return { tracking: null, contact: localRecord };
}

/**
 * Get campaign performance metrics with effectiveness data
 * @param {string} campaignId - Optional specific campaign ID
 * @returns {Promise<Array|object>} Performance metrics
 */
export async function getCampaignPerformance(campaignId = null) {
  try {
    if (await shouldUseBackend()) {
      let query = api.supabase
        .from('campaign_performance')
        .select('*');

      if (campaignId) {
        const { data, error } = await query.eq('id', campaignId).single();
        if (error) throw error;
        return data;
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      console.log(`[CampaignService] Loaded performance for ${data.length} campaigns`);
      return data;
    }
  } catch (error) {
    console.warn('[CampaignService] Could not load campaign performance:', error.message);
  }

  // Fallback: return basic campaign data
  const campaigns = getCampaigns();
  if (campaignId) {
    return campaigns.find(c => c.id === campaignId) || null;
  }
  return campaigns;
}

/**
 * Get contacts for a specific campaign with their tracking outcomes
 * @param {string} campaignId - Campaign ID
 * @returns {Promise<Array>} Contacts with outcomes
 */
export async function getCampaignContacts(campaignId) {
  try {
    if (await shouldUseBackend()) {
      const { data, error } = await api.supabase
        .from('campaign_contacts')
        .select(`
          *,
          contact_tracking (
            status,
            returned_at,
            days_to_return,
            return_revenue
          )
        `)
        .eq('campaign_id', campaignId)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.warn('[CampaignService] Could not load campaign contacts:', error.message);
  }

  // Fallback: return sends from localStorage
  const sends = JSON.parse(localStorage.getItem(CAMPAIGN_SENDS_KEY) || '[]');
  return sends.filter(s => s.campaign_id === campaignId);
}

/**
 * Send campaign and record contacts for effectiveness tracking
 * Enhanced version that links to contact_tracking
 * @param {string} campaignId - Campaign ID
 * @param {Array} recipients - Array of { customerId, customerName, phone, ... }
 * @param {object} options - { messageBody, dryRun, skipWhatsApp }
 * @returns {Promise<object>} Send result with tracking info
 */
export async function sendCampaignWithTracking(campaignId, recipients, options = {}) {
  const { messageBody, dryRun = false, skipWhatsApp = false } = options;

  const result = {
    campaignId,
    totalRecipients: recipients.length,
    successCount: 0,
    failedCount: 0,
    skippedCount: 0,
    trackedContacts: 0,
    errors: []
  };

  // Get campaign for message body
  const campaign = await getCampaignsAsync().then(c => c.find(x => x.id === campaignId));
  const message = messageBody || campaign?.messageBody;

  for (const recipient of recipients) {
    const { customerId, customerName, phone, name } = recipient;
    const recipientName = customerName || name;

    if (!phone) {
      result.skippedCount++;
      result.errors.push({ customerId, error: 'No phone number' });
      continue;
    }

    try {
      // Record contact for tracking (before sending WhatsApp)
      if (!dryRun) {
        await recordCampaignContact(campaignId, {
          customerId,
          customerName: recipientName,
          phone,
          contactMethod: 'whatsapp'
        });
        result.trackedContacts++;
      }

      // Send WhatsApp if not skipped
      if (!skipWhatsApp && !dryRun && message) {
        const personalizedMessage = message
          .replace(/\{\{nome\}\}/gi, recipientName || 'Cliente')
          .replace(/\{\{name\}\}/gi, recipientName || 'Cliente');

        await sendWhatsAppMessage(phone, personalizedMessage);
      }

      result.successCount++;
    } catch (error) {
      result.failedCount++;
      result.errors.push({ customerId, error: error.message });
    }
  }

  // Update campaign stats
  if (!dryRun && result.successCount > 0) {
    await recordCampaignSendAsync(campaignId, {
      recipients: result.totalRecipients,
      successCount: result.successCount,
      failedCount: result.failedCount
    });
  }

  console.log(`[CampaignService] Campaign ${campaignId} sent with tracking:`, {
    success: result.successCount,
    tracked: result.trackedContacts,
    failed: result.failedCount
  });

  return result;
}
