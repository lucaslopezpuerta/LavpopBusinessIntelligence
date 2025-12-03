// campaignService.js v1.1
// Campaign management and WhatsApp messaging service
// Integrates with Netlify function for Twilio WhatsApp API
//
// v1.1 (2025-12-03): Added Brazilian mobile phone validation
//   - Validates phone numbers before sending to avoid Twilio errors
//   - Uses shared phoneUtils for consistent validation across app

import {
  normalizePhone,
  isValidBrazilianMobile,
  getPhoneValidationError,
  getCampaignRecipients
} from './phoneUtils';

const TWILIO_FUNCTION_URL = '/.netlify/functions/twilio-whatsapp';

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

/**
 * Validate a list of customers for campaign readiness
 * Returns stats and filtered lists for UI preview
 *
 * @param {Array<object>} customers - Customer list
 * @returns {object} { ready, invalid, stats }
 */
export function validateCampaignAudience(customers) {
  const { valid, invalid, stats } = getCampaignRecipients(customers);

  return {
    ready: valid,           // Customers ready for WhatsApp
    invalid: invalid,       // Customers with invalid phones
    stats: {
      ...stats,
      readyCount: valid.length,
      invalidCount: invalid.length
    }
  };
}
