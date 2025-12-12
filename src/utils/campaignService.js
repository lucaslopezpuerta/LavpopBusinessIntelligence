// campaignService.js v4.1
// Campaign management and WhatsApp messaging service
// Integrates with Netlify function for Twilio WhatsApp API
// Backend-only storage (Supabase) - no localStorage for data
//
// CHANGELOG:
// v4.1 (2025-12-12): Fixed getDashboardMetrics and validateCampaignAudience
//   - Removed orphan shouldUseBackend() check that broke dashboard
//   - Made validateCampaignAudience async (uses async filterBlacklistedRecipients)
// v4.0 (2025-12-12): Backend only - removed localStorage
//   - All campaign data now stored exclusively in Supabase
//   - Removed localStorage fallbacks
//   - Deprecated sync functions replaced with async backend calls
// v3.7 (2025-12-12): Fixed funnel sent count to include automations
//   - funnel.sent now uses campaigns.sends column (includes automations)
//   - Previously only counted manual sends from campaign_sends table
// v3.6 (2025-12-12): Per-campaign delivery metrics from webhook_events
// v3.5 (2025-12-12): Added comm_logs insert for manual campaigns
// v3.4 (2025-12-11): Real delivery metrics from Twilio webhook
// v3.3 (2025-12-11): Fixed API usage for backend operations
// v3.2 (2025-12-09): Robust error handling for campaign operations
// v3.1 (2025-12-09): Added Meta-approved template support via ContentSid
// v3.0 (2025-12-08): Added campaign effectiveness tracking
// v2.0 (2025-12-08): Added Supabase backend support
// v1.2 (2025-12-08): Added blacklist integration
// v1.1 (2025-12-03): Added Brazilian mobile phone validation

import {
  normalizePhone,
  isValidBrazilianMobile,
  getPhoneValidationError,
  getCampaignRecipients
} from './phoneUtils';
import { api } from './apiService';
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

// ==================== CAMPAIGN MANAGEMENT (BACKEND ONLY) ====================

/**
 * Get all saved campaigns (backend only)
 * @returns {Promise<Array<object>>} Campaigns list
 */
export async function getCampaigns() {
  try {
    return await api.campaigns.getAll();
  } catch (error) {
    console.error('Failed to get campaigns:', error.message);
    return [];
  }
}

/**
 * Save a new campaign (backend only)
 * @param {object} campaign - Campaign data
 * @returns {Promise<object>} Saved campaign with ID
 */
export async function saveCampaign(campaign) {
  try {
    return await api.campaigns.create(campaign);
  } catch (error) {
    console.error('Failed to save campaign:', error.message);
    // Return a local object so the UI doesn't break
    return {
      ...campaign,
      id: `CAMP_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'draft',
      sends: 0
    };
  }
}

/**
 * Update campaign status (backend only)
 * @param {string} campaignId - Campaign ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object|null>} Updated campaign
 */
export async function updateCampaign(campaignId, updates) {
  try {
    return await api.campaigns.update(campaignId, updates);
  } catch (error) {
    console.error('Failed to update campaign:', error.message);
    return null;
  }
}

/**
 * Record a campaign send event (backend only)
 * @param {string} campaignId - Campaign ID
 * @param {object} sendData - Send details { recipients, successCount, failedCount }
 * @returns {Promise<void>}
 */
export async function recordCampaignSend(campaignId, sendData) {
  try {
    await api.sends.record({
      campaignId,
      recipients: sendData.recipients,
      successCount: sendData.successCount,
      failedCount: sendData.failedCount
    });
  } catch (error) {
    console.error('Failed to record campaign send:', error.message);
  }
}

/**
 * Get campaign send history (backend only)
 * @param {string} campaignId - Optional filter by campaign
 * @returns {Promise<Array<object>>} Send events
 */
export async function getCampaignSends(campaignId = null) {
  try {
    return await api.sends.getAll(campaignId ? { campaignId } : {});
  } catch (error) {
    console.error('Failed to get campaign sends:', error.message);
    return [];
  }
}

// ==================== AUTOMATION RULES (BACKEND ONLY) ====================

/**
 * Get automation rules configuration (backend only)
 * @returns {Promise<Array<object>>} Automation rules
 */
export async function getAutomationRules() {
  try {
    const rules = await api.automation.getAll();
    return rules.length > 0 ? rules : getDefaultAutomationRules();
  } catch (error) {
    console.error('Failed to get automation rules:', error.message);
    return getDefaultAutomationRules();
  }
}

/**
 * Save automation rules configuration (backend only)
 * @param {Array<object>} rules - Rules to save
 * @returns {Promise<void>}
 */
export async function saveAutomationRules(rules) {
  try {
    await api.automation.save(rules);
  } catch (error) {
    console.error('Failed to save automation rules:', error.message);
  }
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
      action: { template: 'winback_discount', channel: 'whatsapp' },
      cooldown_days: 30,
      coupon_code: 'VOLTE20',
      discount_percent: 20,
      coupon_validity_days: 7
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
      coupon_validity_days: 7
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
      coupon_validity_days: 14
    },
    {
      id: 'wallet_reminder',
      name: 'Lembrete de Saldo',
      enabled: false,
      trigger: { type: 'wallet_balance', value: 20 },
      action: { template: 'wallet_reminder', channel: 'whatsapp' },
      cooldown_days: 14
    },
    {
      id: 'post_visit',
      name: 'Pós-Visita',
      enabled: false,
      trigger: { type: 'hours_after_visit', value: 24 },
      action: { template: 'post_visit_thanks', channel: 'whatsapp' },
      cooldown_days: 7
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

// ==================== COMMUNICATION LOG (BACKEND ONLY) ====================

/**
 * Log a communication event (backend only)
 * @param {string} phone - Customer phone
 * @param {string} channel - Communication channel (whatsapp, email, sms)
 * @param {string} message - Message content
 * @param {string} externalId - External reference (messageSid, etc.)
 */
async function logCommunication(phone, channel, message, externalId = null) {
  try {
    await api.logs.add({
      phone,
      channel,
      message: message?.substring(0, 100), // Store truncated message
      external_id: externalId,
      direction: 'outbound',
      type: 'campaign'
    });
  } catch (error) {
    console.error('Failed to log communication:', error.message);
  }
}

/**
 * Get communication logs for a phone number (backend only)
 * @param {string} phone - Customer phone
 * @returns {Promise<Array<object>>} Communication logs
 */
export async function getCommunicationLogs(phone) {
  try {
    const result = await api.logs.getAll(phone ? { phone } : {});
    return result.logs || [];
  } catch (error) {
    console.error('Failed to get communication logs:', error.message);
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
 * @returns {Promise<object>} { ready, invalid, blacklisted, stats }
 */
export async function validateCampaignAudience(customers) {
  const { valid, invalid, stats } = getCampaignRecipients(customers);

  // Filter blacklisted from valid recipients (async - from backend)
  const { allowed, blocked, stats: blacklistStats } = await filterBlacklistedRecipients(valid);

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

// ==================== SCHEDULED CAMPAIGNS (BACKEND ONLY) ====================

/**
 * Get scheduled campaigns (backend only)
 * @returns {Promise<Array>} Scheduled campaigns
 */
export async function getScheduledCampaigns() {
  try {
    return await api.scheduled.getAll();
  } catch (error) {
    console.error('Failed to get scheduled campaigns:', error.message);
    return [];
  }
}

/**
 * Save scheduled campaign (backend only)
 * @param {object} campaign - Campaign data
 * @returns {Promise<object>} Saved campaign
 */
export async function saveScheduledCampaign(campaign) {
  try {
    return await api.scheduled.create({
      templateId: campaign.templateId,
      audience: campaign.audience,
      messageBody: campaign.messageBody,
      recipients: campaign.recipients,
      scheduledFor: campaign.scheduledFor
    });
  } catch (error) {
    console.error('Failed to save scheduled campaign:', error.message);
    return {
      ...campaign,
      id: `SCHED_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'scheduled'
    };
  }
}

/**
 * Cancel a scheduled campaign (backend only)
 * @param {string} id - Campaign ID
 * @returns {Promise<boolean>} Success
 */
export async function cancelScheduledCampaign(id) {
  try {
    await api.scheduled.cancel(id);
    return true;
  } catch (error) {
    console.error('Failed to cancel scheduled campaign:', error.message);
    return false;
  }
}

// ==================== BACKWARDS COMPATIBILITY ALIASES ====================
// These aliases maintain backwards compatibility with code using the old *Async naming

/**
 * @deprecated Use getScheduledCampaigns() instead (now async)
 */
export const getScheduledCampaignsAsync = getScheduledCampaigns;

/**
 * @deprecated Use saveScheduledCampaign() instead (now async)
 */
export const createScheduledCampaignAsync = saveScheduledCampaign;

/**
 * @deprecated Use cancelScheduledCampaign() instead (now async)
 */
export const cancelScheduledCampaignAsync = cancelScheduledCampaign;

/**
 * @deprecated Use getCampaigns() instead (now async)
 */
export const getCampaignsAsync = getCampaigns;

/**
 * @deprecated Use saveCampaign() instead (now async)
 */
export const createCampaignAsync = saveCampaign;

/**
 * @deprecated Use recordCampaignSend() instead (now async)
 */
export const recordCampaignSendAsync = recordCampaignSend;

/**
 * @deprecated Use getAutomationRules() instead (now async)
 */
export const getAutomationRulesAsync = getAutomationRules;

/**
 * @deprecated Use saveAutomationRules() instead (now async)
 */
export const saveAutomationRulesAsync = saveAutomationRules;

// ==================== CAMPAIGN EFFECTIVENESS TRACKING (BACKEND ONLY) ====================
// These functions link campaigns to contact_tracking for measuring return rates

/**
 * Record a campaign contact for effectiveness tracking (backend only)
 * Creates entries in both contact_tracking and campaign_contacts tables
 * @param {string} campaignId - Campaign ID
 * @param {object} contactData - { customerId, customerName, phone, contactMethod }
 * @returns {Promise<object>} Created records
 */
export async function recordCampaignContact(campaignId, contactData) {
  const { customerId, customerName, phone, contactMethod = 'whatsapp' } = contactData;

  try {
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
  } catch (error) {
    console.error('[CampaignService] Failed to record campaign contact:', error.message);
    return { tracking: null, contact: null };
  }
}

/**
 * Get campaign performance metrics with effectiveness data (backend only)
 * @param {string} campaignId - Optional specific campaign ID
 * @returns {Promise<Array|object>} Performance metrics
 */
export async function getCampaignPerformance(campaignId = null) {
  try {
    // Use the API actions for campaign performance
    const data = await api.get('campaign_effectiveness', campaignId ? { campaign_id: campaignId } : {});

    if (campaignId && data.length > 0) {
      console.log(`[CampaignService] Loaded performance for campaign ${campaignId}`);
      return data[0];
    }

    console.log(`[CampaignService] Loaded performance for ${data.length} campaigns`);
    return data;
  } catch (error) {
    console.error('[CampaignService] Could not load campaign performance:', error.message);
    return campaignId ? null : [];
  }
}

/**
 * Get contacts for a specific campaign with their tracking outcomes (backend only)
 * @param {string} campaignId - Campaign ID
 * @returns {Promise<Array>} Contacts with outcomes
 */
export async function getCampaignContacts(campaignId) {
  try {
    // Use the campaign_contacts.getAll API action
    const data = await api.get('campaign_contacts', { campaign_id: campaignId });
    return data;
  } catch (error) {
    console.error('[CampaignService] Could not load campaign contacts:', error.message);
    return [];
  }
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

        const sendResult = await sendWhatsAppMessage(phone, null, {
          contentSid,
          contentVariables: personalizedVars
        });

        // Record to comm_logs for audit trail (parity with automation flow)
        try {
          await api.logs.add({
            phone: normalizePhone(phone),
            customer_id: customerId,
            channel: 'whatsapp',
            direction: 'outbound',
            message: `Campaign: ${campaignId} [Template: ${contentSid}]`,
            external_id: sendResult?.messageSid || null,
            status: 'sent'
          });
        } catch (logError) {
          console.warn('[CampaignService] Failed to log to comm_logs:', logError.message);
          // Don't fail the send if logging fails
        }
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

      // Fetch all campaigns to get total sends (includes automations)
      // The campaigns.sends column is updated by both manual sends AND record_automation_contact()
      let campaignsForFunnel = [];
      try {
        campaignsForFunnel = await api.campaigns.getAll();
      } catch (e) {
        console.warn('[CampaignService] Could not fetch campaigns for funnel:', e.message);
      }

      if (campaignsForFunnel && campaignsForFunnel.length > 0) {
        // Sum up all sends from campaigns (this includes automation sends)
        metrics.funnel.sent = campaignsForFunnel.reduce((sum, c) => sum + (c.sends || 0), 0);
      }

      // Fetch real delivery stats from Twilio webhook events
      try {
        const deliveryStats = await api.delivery.getStats(days);
        if (deliveryStats.hasRealData) {
          // Use real delivery data from webhook events
          metrics.funnel.delivered = deliveryStats.totalDelivered;
          metrics.funnel.engaged = deliveryStats.stats.read; // "read" status indicates engagement
          metrics.deliveryRate = deliveryStats.deliveryRate;
          metrics.readRate = deliveryStats.readRate;
          metrics.hasRealDeliveryData = true;
        } else {
          // Fallback to estimates if no real data yet
          metrics.funnel.delivered = Math.round(metrics.funnel.sent * 0.97);
          metrics.funnel.engaged = Math.round(metrics.funnel.delivered * 0.2);
          metrics.hasRealDeliveryData = false;
        }
      } catch (e) {
        console.warn('[CampaignService] Could not fetch delivery stats:', e.message);
        // Fallback to estimates
        metrics.funnel.delivered = Math.round(metrics.funnel.sent * 0.97);
        metrics.funnel.engaged = Math.round(metrics.funnel.delivered * 0.2);
        metrics.hasRealDeliveryData = false;
      }

      // Fetch recent campaigns with performance data
      let campaignsData = [];
      try {
        campaignsData = await api.campaigns.getAll();
      } catch (e) {
        console.warn('[CampaignService] Could not fetch campaigns:', e.message);
      }

      // Fetch per-campaign delivery metrics from webhook_events
      let deliveryMetrics = [];
      try {
        deliveryMetrics = await api.delivery.getCampaignMetrics();
      } catch (e) {
        console.warn('[CampaignService] Could not fetch campaign delivery metrics:', e.message);
      }

      if (campaignsData && campaignsData.length > 0) {
        // Enrich with performance data AND delivery metrics
        metrics.recentCampaigns = campaignsData.slice(0, 10).map(c => {
          // Find matching effectiveness data
          const effData = effectivenessData?.find(e => e.campaign_id === c.id);
          // Find matching delivery metrics from webhook_events
          const delData = deliveryMetrics?.find(d => d.campaign_id === c.id);

          return {
            ...c,
            return_rate: effData?.return_rate || 0,
            total_revenue: effData?.total_return_revenue || 0,
            contacts_count: effData?.total_contacts || 0,
            // Real delivery metrics from webhook events
            delivered: delData?.delivered || 0,
            read: delData?.read || 0,
            failed: delData?.failed || 0,
            delivery_rate: delData?.delivery_rate || null,
            read_rate: delData?.read_rate || null,
            has_delivery_data: !!delData
          };
        });
      }

    console.log(`[CampaignService] Dashboard metrics loaded:`, {
      contacts: metrics.summary.totalContacts,
      returned: metrics.summary.totalReturned,
      campaigns: metrics.recentCampaigns.length,
      discountLevels: metrics.discountComparison.length
    });
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
