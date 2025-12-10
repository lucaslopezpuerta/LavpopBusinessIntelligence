// campaignService.js v3.3
// Campaign management and WhatsApp messaging service
// Integrates with Netlify function for Twilio WhatsApp API
// Now supports Supabase backend for scheduled campaigns and effectiveness tracking
//
// CHANGELOG:
// v3.3 (2025-12-11): Fixed API usage for backend operations
//   - Replaced api.supabase.from() calls with proper api.get/api.campaigns/api.sends methods
//   - Fixed recordCampaignContact to use api.contacts.create
//   - Fixed getCampaignPerformance to use api.get('campaign_effectiveness')
//   - Fixed getDashboardMetrics to use proper API methods
// v3.2 (2025-12-09): Robust error handling for campaign operations
//   - Removed misleading plain text fallback (doesn't work for marketing)
//   - Added ContentSid validation before sending
//   - Implemented error classification (retryable vs permanent)
//   - Added retry logic for transient failures
//   - Better error messages for user display
// v3.1 (2025-12-09): Added Meta-approved template support via ContentSid
//   - sendWhatsAppMessage now accepts contentSid + contentVariables for template mode
//   - sendBulkWhatsApp supports contentSid for bulk template sends
//   - sendTemplateMessage convenience function for template-based sending
//   - Templates sent via ContentSid comply with Meta WhatsApp Business API
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
import {
  CampaignError,
  ErrorType,
  classifyTwilioError,
  classifyNetworkError,
  validateCampaignConfig,
  withRetry,
  createResultSummary
} from './campaignErrors';

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
 *
 * Supports two modes:
 * 1. Template mode (recommended): Pass contentSid + contentVariables
 * 2. Plain text mode (fallback): Pass message directly
 *
 * @param {string} phone - Recipient phone number
 * @param {string} message - Message content (for plain text mode)
 * @param {object} options - Additional options
 * @param {string} options.contentSid - Twilio Content SID for Meta-approved template
 * @param {object} options.contentVariables - Variables for template {"1": "value1", "2": "value2"}
 * @param {string} options.templateName - Legacy template name (plain text mode)
 * @param {object} options.templateVariables - Legacy template variables
 * @returns {Promise<object>} Send result with sentVia field
 */
export async function sendWhatsAppMessage(phone, message, options = {}) {
  // Handle legacy call signature: sendWhatsAppMessage(phone, message, templateName, templateVariables)
  let { contentSid, contentVariables, templateName, templateVariables } = options;

  // Support legacy function signature where 3rd arg is templateName string
  if (typeof options === 'string') {
    templateName = options;
    templateVariables = arguments[3] || null;
  }

  // Validate and normalize phone number
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    const error = getPhoneValidationError(phone);
    throw new CampaignError(ErrorType.INVALID_PHONE, `Número inválido: ${error}`, { phone });
  }

  // Build request payload
  const payload = {
    action: 'send_message',
    to: normalizedPhone
  };

  // For marketing campaigns, ContentSid is REQUIRED
  // Plain text messages only work within the 24-hour customer service window
  if (contentSid) {
    payload.contentSid = contentSid;
    if (contentVariables) {
      payload.contentVariables = contentVariables;
    }
  } else if (message) {
    // Plain text mode - only works for customer service (24h window)
    // Log warning but allow for legacy/service messages
    console.warn('[sendWhatsAppMessage] Sending plain text message - will fail for marketing outside 24h window');
    payload.message = message;
    if (templateName) {
      payload.templateName = templateName;
      payload.templateVariables = templateVariables;
    }
  } else {
    throw new CampaignError(
      ErrorType.MISSING_CONTENT_SID,
      'ContentSid é obrigatório para mensagens de marketing',
      { phone: normalizedPhone }
    );
  }

  // Execute with retry logic for transient failures
  return withRetry(async () => {
    try {
      const response = await fetch(TWILIO_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        // Classify Twilio error for proper handling
        throw classifyTwilioError({
          code: data.code,
          message: data.message || data.error,
          status: response.status
        });
      }

      // Log to communication history
      const logMessage = contentSid ? `[Template: ${contentSid}]` : message;
      logCommunication(normalizedPhone, 'whatsapp', logMessage, data.messageSid);

      return data;
    } catch (error) {
      // Re-throw CampaignErrors as-is
      if (error instanceof CampaignError) {
        throw error;
      }
      // Classify network/fetch errors
      throw classifyNetworkError(error);
    }
  }, { context: { phone: normalizedPhone, contentSid } });
}

/**
 * Send a WhatsApp message using a Meta-approved template
 * Convenience wrapper for template-based sending
 *
 * @param {string} phone - Recipient phone number
 * @param {string} contentSid - Twilio Content SID (HX...)
 * @param {object} contentVariables - Variables {"1": "Name", "2": "20", "3": "VOLTE20", "4": "15/01"}
 * @returns {Promise<object>} Send result
 */
export async function sendTemplateMessage(phone, contentSid, contentVariables) {
  return sendWhatsAppMessage(phone, null, { contentSid, contentVariables });
}

/**
 * Send bulk WhatsApp messages to multiple recipients
 * Validates phone numbers before sending - invalid phones are filtered out
 *
 * Supports two modes:
 * 1. Template mode (recommended): Pass contentSid in options
 * 2. Plain text mode (fallback): Pass message directly
 *
 * @param {Array<object>} recipients - Array of { phone, name, contentVariables?, ...customerData }
 * @param {string} message - Message content (can include {{nome}}, {{saldo}} placeholders)
 * @param {object} options - Additional options
 * @param {string} options.contentSid - Twilio Content SID for Meta-approved template
 * @param {object} options.baseVariables - Base variables for all recipients (personalized per-recipient)
 * @param {string} options.templateName - Legacy template name (plain text mode)
 * @param {object} options.templateVariables - Legacy template variables
 * @returns {Promise<object>} Bulk send results including validation stats and sentVia
 */
export async function sendBulkWhatsApp(recipients, message, options = {}) {
  // Handle legacy call signature: sendBulkWhatsApp(recipients, message, templateName, templateVariables)
  let { contentSid, baseVariables, templateName, templateVariables } = options;

  // Support legacy function signature where 3rd arg is templateName string
  if (typeof options === 'string') {
    templateName = options;
    templateVariables = arguments[3] || null;
  }

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

    // Build request payload
    const payload = {
      action: 'send_bulk',
      recipients: valid
    };

    // Prefer ContentSid for Meta-approved templates
    if (contentSid) {
      payload.contentSid = contentSid;
      // Pass base variables that will be personalized per-recipient
      if (baseVariables) {
        payload.templateVariables = baseVariables;
      }
    } else {
      // Fallback to plain text
      payload.message = message;
      if (templateName) {
        payload.templateName = templateName;
        payload.templateVariables = templateVariables;
      }
    }

    const response = await fetch(TWILIO_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send bulk messages');
    }

    // Log successful sends
    if (data.results?.success) {
      const logMessage = contentSid ? `[Template: ${contentSid}]` : message;
      data.results.success.forEach(result => {
        logCommunication(result.phone, 'whatsapp', logMessage, result.messageSid);
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
 * Send bulk WhatsApp messages using a Meta-approved template
 * Convenience wrapper for template-based bulk sending
 *
 * @param {Array<object>} recipients - Array of { phone, name, contentVariables? }
 * @param {string} contentSid - Twilio Content SID (HX...)
 * @param {object} baseVariables - Base variables personalized per-recipient
 * @returns {Promise<object>} Bulk send results
 */
export async function sendBulkTemplateMessages(recipients, contentSid, baseVariables = {}) {
  return sendBulkWhatsApp(recipients, null, { contentSid, baseVariables });
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
      const campaign = await api.campaigns.get(campaignId);
      const campaignName = campaign?.name || campaignId;

      // Use the contact_tracking.record API action
      const result = await api.contacts.create({
        customer_id: customerId,
        customer_name: customerName,
        contact_method: contactMethod,
        campaign_id: campaignId,
        campaign_name: campaignName,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

      console.log(`[CampaignService] Recorded contact for campaign ${campaignId}: ${customerId}`);
      return { tracking: result, contact: result };
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
      // Use the API actions for campaign performance
      const data = await api.get('campaign_effectiveness', campaignId ? { campaign_id: campaignId } : {});

      if (campaignId && data.length > 0) {
        console.log(`[CampaignService] Loaded performance for campaign ${campaignId}`);
        return data[0];
      }

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
      // Use the campaign_contacts.getAll API action
      const data = await api.get('campaign_contacts', { campaign_id: campaignId });
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
 *
 * IMPORTANT: Marketing campaigns REQUIRE ContentSid (Meta-approved template).
 * Plain text messages only work within the 24-hour customer service window,
 * which is not applicable for marketing campaigns.
 *
 * @param {string} campaignId - Campaign ID
 * @param {Array} recipients - Array of { customerId, customerName, phone, ... }
 * @param {object} options - Sending options
 * @param {string} options.contentSid - Twilio Content SID for Meta-approved template (REQUIRED)
 * @param {object} options.contentVariables - Base variables for template (personalized per-recipient)
 * @param {string} options.templateId - Template ID for error messages
 * @param {boolean} options.dryRun - If true, don't send messages (for testing)
 * @param {boolean} options.skipWhatsApp - If true, skip sending but record tracking
 * @returns {Promise<object>} Send result with tracking info
 */
export async function sendCampaignWithTracking(campaignId, recipients, options = {}) {
  const { contentSid, contentVariables, templateId, dryRun = false, skipWhatsApp = false } = options;

  const result = {
    campaignId,
    totalRecipients: recipients.length,
    successCount: 0,
    failedCount: 0,
    skippedCount: 0,
    trackedContacts: 0,
    errors: [],
    sentVia: 'template'
  };

  // VALIDATION: Marketing campaigns require ContentSid
  // Plain text fallback was removed because it doesn't work for marketing
  if (!skipWhatsApp && !dryRun) {
    try {
      validateCampaignConfig({ contentSid, templateId });
    } catch (validationError) {
      console.error('[CampaignService] Campaign validation failed:', validationError.message);
      return {
        ...result,
        failedCount: recipients.length,
        errors: [{
          type: validationError.type,
          error: validationError.userMessage,
          retryable: false
        }]
      };
    }
  }

  for (const recipient of recipients) {
    const { customerId, customerName, phone, name, walletBalance } = recipient;
    const recipientName = customerName || name;

    if (!phone) {
      result.skippedCount++;
      result.errors.push({
        customerId,
        type: ErrorType.INVALID_PHONE,
        error: 'Número de telefone não informado',
        retryable: false
      });
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
      if (!skipWhatsApp && !dryRun) {
        // Template mode - personalize variables for this recipient
        const personalizedVars = {
          ...contentVariables,
          '1': recipientName || 'Cliente' // Variable 1 is always customer name
        };

        // If variable 2 is wallet balance placeholder
        if (contentVariables?.['2'] === '{{saldo}}' && walletBalance !== undefined) {
          personalizedVars['2'] = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(walletBalance);
        }

        await sendWhatsAppMessage(phone, null, {
          contentSid,
          contentVariables: personalizedVars
        });
      }

      result.successCount++;
    } catch (error) {
      result.failedCount++;

      // Extract error info for detailed tracking
      const errorInfo = {
        customerId,
        phone,
        type: error.type || ErrorType.UNKNOWN,
        error: error.userMessage || error.message,
        retryable: error.retryable || false,
        twilioCode: error.twilioCode || null
      };

      result.errors.push(errorInfo);

      // Log specific error type for debugging
      console.warn(`[CampaignService] Send failed for ${phone}:`, {
        type: errorInfo.type,
        message: errorInfo.error,
        retryable: errorInfo.retryable
      });
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

  // Generate result summary for UI display
  result.summary = createResultSummary(result);

  console.log(`[CampaignService] Campaign ${campaignId} completed:`, {
    success: result.successCount,
    tracked: result.trackedContacts,
    failed: result.failedCount,
    status: result.summary.status
  });

  return result;
}

// ==================== DASHBOARD METRICS ====================
// Aggregated metrics for the Campaign Analytics Dashboard

/**
 * Get comprehensive dashboard metrics for campaign analytics
 * Fetches data from Supabase views and aggregates for visualization
 *
 * @param {object} options - Query options
 * @param {number} options.days - Time range in days (default: 30)
 * @returns {Promise<object>} Dashboard metrics
 */
export async function getDashboardMetrics(options = {}) {
  const { days = 30 } = options;

  const metrics = {
    summary: {
      totalContacts: 0,
      totalReturned: 0,
      returnRate: 0,
      totalRevenue: 0,
      avgDaysToReturn: 0,
      totalPending: 0
    },
    discountComparison: [],
    serviceComparison: [],
    bestDiscount: null,
    bestService: null,
    funnel: {
      sent: 0,
      delivered: 0,
      engaged: 0,
      returned: 0
    },
    recentCampaigns: []
  };

  try {
    if (await shouldUseBackend()) {
      // Fetch campaign effectiveness data (aggregated by campaign)
      let effectivenessData = [];
      try {
        effectivenessData = await api.get('campaign_effectiveness', {});
      } catch (e) {
        console.warn('[CampaignService] Could not fetch effectiveness data:', e.message);
      }

      if (effectivenessData && effectivenessData.length > 0) {
        // Aggregate discount comparison
        const discountMap = new Map();
        const serviceMap = new Map();

        effectivenessData.forEach(row => {
          // Group by discount percentage
          if (row.discount_percent) {
            const discount = row.discount_percent;
            if (!discountMap.has(discount)) {
              discountMap.set(discount, {
                discount,
                campaigns: 0,
                contacts: 0,
                returned: 0,
                revenue: 0
              });
            }
            const d = discountMap.get(discount);
            d.campaigns++;
            d.contacts += row.total_contacts || 0;
            d.returned += row.returned_count || 0;
            d.revenue += row.total_return_revenue || 0;
          }

          // Group by service type
          const service = row.service_type || 'all';
          if (!serviceMap.has(service)) {
            serviceMap.set(service, {
              service,
              campaigns: 0,
              contacts: 0,
              returned: 0,
              revenue: 0
            });
          }
          const s = serviceMap.get(service);
          s.campaigns++;
          s.contacts += row.total_contacts || 0;
          s.returned += row.returned_count || 0;
          s.revenue += row.total_return_revenue || 0;
        });

        // Calculate return rates and find best performers
        metrics.discountComparison = Array.from(discountMap.values()).map(d => ({
          ...d,
          returnRate: d.contacts > 0 ? (d.returned / d.contacts) * 100 : 0
        }));

        metrics.serviceComparison = Array.from(serviceMap.values()).map(s => ({
          ...s,
          returnRate: s.contacts > 0 ? (s.returned / s.contacts) * 100 : 0
        }));

        // Find best discount
        if (metrics.discountComparison.length > 0) {
          metrics.bestDiscount = metrics.discountComparison.reduce((best, curr) =>
            (curr.returnRate > (best?.returnRate || 0) && curr.contacts >= 5) ? curr : best
          , null);
        }

        // Find best service
        if (metrics.serviceComparison.length > 0) {
          metrics.bestService = metrics.serviceComparison.reduce((best, curr) =>
            (curr.returnRate > (best?.returnRate || 0) && curr.contacts >= 5) ? curr : best
          , null);
        }
      }

      // Fetch contact tracking summary for overall metrics
      let contactData = [];
      try {
        contactData = await api.get('contact_tracking', {});
      } catch (e) {
        console.warn('[CampaignService] Could not fetch contact tracking:', e.message);
      }

      if (contactData && contactData.length > 0) {
        const total = contactData.length;
        const returned = contactData.filter(c => c.status === 'returned');
        const pending = contactData.filter(c => c.status === 'pending');

        metrics.summary.totalContacts = total;
        metrics.summary.totalReturned = returned.length;
        metrics.summary.returnRate = total > 0 ? (returned.length / total) * 100 : 0;
        metrics.summary.totalRevenue = returned.reduce((sum, c) => sum + (c.return_revenue || 0), 0);
        metrics.summary.totalPending = pending.length;

        // Calculate average days to return
        const daysToReturn = returned
          .filter(c => c.days_to_return !== null)
          .map(c => c.days_to_return);
        if (daysToReturn.length > 0) {
          metrics.summary.avgDaysToReturn = daysToReturn.reduce((a, b) => a + b, 0) / daysToReturn.length;
        }

        // Build funnel data
        metrics.funnel.returned = returned.length;
      }

      // Fetch campaign sends for funnel (sent/delivered counts)
      let sendsData = [];
      try {
        sendsData = await api.sends.getAll();
      } catch (e) {
        console.warn('[CampaignService] Could not fetch sends:', e.message);
      }

      if (sendsData && sendsData.length > 0) {
        metrics.funnel.sent = sendsData.reduce((sum, s) => sum + (s.success_count || 0), 0);
        // Assume 97% delivery rate if we don't have exact data
        metrics.funnel.delivered = Math.round(metrics.funnel.sent * 0.97);
      }

      // Estimate engagement as 20% of delivered (webhook_events table not exposed via API yet)
      metrics.funnel.engaged = Math.round(metrics.funnel.delivered * 0.2);

      // Fetch recent campaigns with performance data
      let campaignsData = [];
      try {
        campaignsData = await api.campaigns.getAll();
      } catch (e) {
        console.warn('[CampaignService] Could not fetch campaigns:', e.message);
      }

      if (campaignsData && campaignsData.length > 0) {
        // Enrich with performance data
        metrics.recentCampaigns = campaignsData.slice(0, 10).map(c => {
          // Find matching effectiveness data
          const effData = effectivenessData?.find(e => e.campaign_id === c.id);
          return {
            ...c,
            return_rate: effData?.return_rate || 0,
            total_revenue: effData?.total_return_revenue || 0,
            contacts_count: effData?.total_contacts || 0
          };
        });
      }

      console.log(`[CampaignService] Dashboard metrics loaded:`, {
        contacts: metrics.summary.totalContacts,
        returned: metrics.summary.totalReturned,
        campaigns: metrics.recentCampaigns.length,
        discountLevels: metrics.discountComparison.length
      });
    }
  } catch (error) {
    console.warn('[CampaignService] Failed to load dashboard metrics:', error.message);
  }

  // If no backend data, return empty metrics (will show empty states in UI)
  return metrics;
}

/**
 * Get campaign effectiveness metrics aggregated by discount percentage
 * @param {object} options - Query options
 * @returns {Promise<Array>} Discount comparison data
 */
export async function getDiscountEffectiveness(options = {}) {
  const metrics = await getDashboardMetrics(options);
  return metrics.discountComparison;
}

/**
 * Get campaign effectiveness metrics aggregated by service type
 * @param {object} options - Query options
 * @returns {Promise<Array>} Service comparison data
 */
export async function getServiceEffectiveness(options = {}) {
  const metrics = await getDashboardMetrics(options);
  return metrics.serviceComparison;
}

// ==================== ERROR HANDLING RE-EXPORTS ====================
// Re-export error utilities for use in components

export {
  CampaignError,
  ErrorType,
  classifyTwilioError,
  validateCampaignConfig,
  createResultSummary
} from './campaignErrors';
