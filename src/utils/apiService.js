// apiService.js v2.10
// Unified API service for Supabase backend communication
// Provides fallback to localStorage when backend is unavailable
//
// Version: 2.10 (2025-12-26) - Added debug logging for native app troubleshooting
//   - Logs platform detection and API URL selection
//   - Helps diagnose connectivity issues in native apps
//
// Version: 2.9 (2025-12-26) - Fixed native app URL detection timing
//   - API URL now evaluated at request time, not module load time
//   - Ensures Capacitor is fully available before detecting platform
//
// Version: 2.8 (2025-12-26) - Native app support
//   - API calls now use production URL when running on native devices
//   - Uses platform detection to determine if native (Capacitor)
//   - Falls back to relative URLs for web deployment
//
// Version: 2.7 (2025-12-19) - Google Business Profile analytics
//   - Added api.googleBusiness.* namespace for GBP API integration
//   - OAuth flow, metrics, reviews, historical tracking
//
// Version: 2.6 (2025-12-19) - App settings API
//   - Added api.settings.get() - fetch app_settings (sync timestamps)
//   - Used by BlacklistManager to display scheduled sync time
//
// Version: 2.5 (2025-12-19) - Twilio database-cached sync
//   - Added api.twilio.getStoredEngagementAndCosts() - read from DB (fast)
//   - Added api.twilio.triggerSync() - manual sync to DB
//   - Added api.twilio.getCostSummary() - aggregated cost data
//   - Follows same pattern as WABA and Instagram analytics
//
// Version: 2.4 (2025-12-18) - Instagram historical tracking
//   - Added api.instagram.getHistory() - historical metrics from DB
//   - Added api.instagram.triggerSync() - manual sync trigger
//   - Added api.instagram.getStatus() - last sync timestamp
//
// Version: 2.3 (2025-12-18) - Instagram analytics
//   - Added api.instagram.getDashboard() - combined profile, insights, media
//   - Added api.instagram.getProfile() - basic profile data
//   - Added api.instagram.getInsights() - account-level metrics
//   - Added api.instagram.getMedia() - recent posts
//   - Added api.instagram.getMediaInsights() - per-post metrics
//   - Added api.instagram.getComments() - recent comments
//   - Added api.instagram.getMessagesCount() - DM conversation count
//
// Version: 2.2 (2025-12-17) - WABA analytics
//   - Added api.waba.getSummary() - aggregated KPIs
//   - Added api.waba.getDailyMetrics() - time series data
//   - Added api.waba.getConversations() - billable conversations
//   - Added api.waba.getMessages() - delivery metrics
//   - Added api.waba.triggerSync() - manual sync
//   - Added api.waba.triggerBackfill() - historical data backfill
//
// Version: 2.1 (2025-12-13) - Unified campaign contact tracking
//   - Added campaignContacts.record for manual campaigns
//   - Matches automation flow: send first, then record with twilio_sid
//
// Version: 2.0 (2025-12-10) - Security hardening
//   - Added API key authentication (X-Api-Key header)
//   - Key read from VITE_API_KEY environment variable
//
// Usage:
//   import { api, isBackendAvailable } from './apiService';
//   const blacklist = await api.blacklist.getAll();

import { isNative, isCapacitorAvailable, getPlatform } from './platform';

// Production URL for native apps (they can't use relative paths)
// Note: Using non-www to avoid redirect issues with CORS preflight
const PRODUCTION_BASE = 'https://bilavnova.com';

// Debug flag - set to true to see API URL resolution in console
const DEBUG_API = true;

// Dynamically determine API base URL
// Native apps need full URL, web can use relative paths
function getApiBaseUrl() {
  const capacitorAvailable = isCapacitorAvailable();
  const native = isNative();
  const platform = getPlatform();

  if (DEBUG_API) {
    console.log('[API] Platform detection:', {
      capacitorAvailable,
      isNative: native,
      platform,
      windowCapacitor: typeof window !== 'undefined' ? !!window.Capacitor : 'N/A'
    });
  }

  if (native) {
    const url = `${PRODUCTION_BASE}/.netlify/functions/supabase-api`;
    if (DEBUG_API) console.log('[API] Using production URL:', url);
    return url;
  }

  if (DEBUG_API) console.log('[API] Using relative URL: /.netlify/functions/supabase-api');
  return '/.netlify/functions/supabase-api';
}

// Get base URL for other Netlify functions
export function getNetlifyFunctionUrl(functionName) {
  const native = isNative();
  let url;

  if (native) {
    url = `${PRODUCTION_BASE}/.netlify/functions/${functionName}`;
  } else {
    url = `/.netlify/functions/${functionName}`;
  }

  if (DEBUG_API) {
    console.log(`[API] getNetlifyFunctionUrl(${functionName}):`, { native, url });
  }

  return url;
}

// NOTE: Don't cache API_URL as a constant - Capacitor might not be available at module load time
// Call getApiBaseUrl() at request time instead

// API key for authentication (set in Netlify environment variables)
const API_KEY = import.meta.env.VITE_API_KEY || '';

// Track backend availability
let backendAvailable = null;
let lastCheck = 0;
const CHECK_INTERVAL = 60000; // Re-check every minute

// Build headers with API key for authentication
function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (API_KEY) {
    headers['X-Api-Key'] = API_KEY;
  }
  return headers;
}

/**
 * Check if the Supabase backend is available
 */
export async function isBackendAvailable(forceCheck = false) {
  const now = Date.now();

  // Use cached result if recent
  if (!forceCheck && backendAvailable !== null && (now - lastCheck) < CHECK_INTERVAL) {
    return backendAvailable;
  }

  try {
    const response = await fetch(getApiBaseUrl(), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'blacklist.stats' })
    });

    backendAvailable = response.ok;
    lastCheck = now;

    if (!response.ok) {
      console.warn('Backend not available, using localStorage fallback');
    }

    return backendAvailable;
  } catch (error) {
    backendAvailable = false;
    lastCheck = now;
    console.warn('Backend unreachable, using localStorage fallback:', error.message);
    return false;
  }
}

/**
 * Make API request with error handling and authentication
 */
async function apiRequest(action, data = {}, method = 'POST') {
  const apiUrl = getApiBaseUrl();
  const url = method === 'GET' && Object.keys(data).length > 0
    ? `${apiUrl}?action=${action}&${new URLSearchParams(data)}`
    : apiUrl;

  if (DEBUG_API) {
    console.log(`[API] Request: ${action}`, { method, url });
  }

  try {
    const options = {
      method,
      headers: getHeaders()
    };

    if (method === 'POST') {
      options.body = JSON.stringify({ action, ...data });
    }

    const response = await fetch(url, options);

    if (DEBUG_API) {
      console.log(`[API] Response: ${action}`, {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'API request failed');
    }

    return result;
  } catch (error) {
    console.error(`[API] Error [${action}]:`, error.message, { url });
    throw error;
  }
}

/**
 * API client with all available operations
 */
export const api = {
  // ==================== BLACKLIST ====================
  blacklist: {
    async getAll() {
      const result = await apiRequest('blacklist.getAll');
      return result.entries || [];
    },

    async add(phone, data = {}) {
      return await apiRequest('blacklist.add', {
        data: { phone, ...data }
      });
    },

    async remove(phone) {
      return await apiRequest('blacklist.remove', {
        data: { phone }
      });
    },

    async check(phone) {
      const result = await apiRequest('blacklist.check', {
        data: { phone }
      });
      return result.isBlacklisted;
    },

    async import(entries, merge = true) {
      return await apiRequest('blacklist.import', {
        data: { entries, merge }
      });
    },

    async getStats() {
      return await apiRequest('blacklist.stats');
    },

    async clear() {
      return await apiRequest('blacklist.clear');
    }
  },

  // ==================== CAMPAIGNS ====================
  campaigns: {
    async getAll() {
      const result = await apiRequest('campaigns.getAll');
      return result.campaigns || [];
    },

    async get(id) {
      const result = await apiRequest('campaigns.get', { id });
      return result.campaign;
    },

    async create(campaignData) {
      const result = await apiRequest('campaigns.create', {
        data: campaignData
      });
      return result.campaign;
    },

    async update(id, updates) {
      const result = await apiRequest('campaigns.update', {
        id,
        data: updates
      });
      return result.campaign;
    },

    async delete(id) {
      return await apiRequest('campaigns.delete', { id });
    }
  },

  // ==================== CAMPAIGN SENDS ====================
  sends: {
    async getAll(campaignId = null) {
      const result = await apiRequest('sends.getAll', {
        campaign_id: campaignId
      });
      return result.sends || [];
    },

    async record(sendData) {
      return await apiRequest('sends.record', {
        data: sendData
      });
    }
  },

  // ==================== SCHEDULED CAMPAIGNS ====================
  scheduled: {
    async getAll() {
      const result = await apiRequest('scheduled.getAll');
      return result.scheduled || [];
    },

    async create(campaignData) {
      const result = await apiRequest('scheduled.create', {
        data: campaignData
      });
      return result.scheduled;
    },

    async cancel(id) {
      return await apiRequest('scheduled.cancel', { id });
    }
  },

  // ==================== COMMUNICATION LOGS ====================
  logs: {
    async getAll(filters = {}) {
      const result = await apiRequest('logs.getAll', filters);
      return { logs: result.logs || [], total: result.total || 0 };
    },

    async add(logData) {
      return await apiRequest('logs.add', {
        data: logData
      });
    },

    async getByPhone(phone) {
      const result = await apiRequest('logs.getByPhone', { phone });
      return result.logs || [];
    }
  },

  // ==================== AUTOMATION RULES ====================
  automation: {
    async getAll() {
      const result = await apiRequest('automation.getAll');
      return result.rules || [];
    },

    async save(rules) {
      return await apiRequest('automation.save', {
        data: rules
      });
    }
  },

  // ==================== CONTACT TRACKING ====================
  contacts: {
    async getAll(filters = {}) {
      const result = await apiRequest('contacts.getAll', filters);
      return result.contacts || [];
    },

    async getPending(customerId = null) {
      // v1.1: Include both 'pending' and 'queued' statuses
      // - pending: message sent, waiting for return
      // - queued: manual inclusion, waiting for scheduler to send
      const filters = { status: ['pending', 'queued'] };
      if (customerId) filters.customer_id = customerId;
      const result = await apiRequest('contacts.getAll', filters);
      return result.contacts || [];
    },

    async create(contactData) {
      const result = await apiRequest('contacts.create', {
        data: contactData
      });
      return result.contact;
    },

    async update(id, updates) {
      return await apiRequest('contacts.update', {
        id,
        data: updates
      });
    },

    async markReturned(customerId, returnDate, revenue) {
      return await apiRequest('contacts.markReturned', {
        customer_id: customerId,
        return_date: returnDate,
        revenue
      });
    },

    async clear(customerId) {
      return await apiRequest('contacts.clear', {
        customer_id: customerId
      });
    },

    async expire() {
      return await apiRequest('contacts.expire');
    },

    async getEffectiveness(options = {}) {
      const result = await apiRequest('contacts.effectiveness', options);
      return result;
    },

    async getHistory(customerId, limit = 10) {
      const result = await apiRequest('contacts.history', {
        customer_id: customerId,
        limit
      });
      return result.contacts || [];
    }
  },

  // ==================== CAMPAIGN CONTACTS ====================
  // Unified tracking for manual campaigns (mirrors automation flow)
  campaignContacts: {
    /**
     * Record a campaign contact with full tracking
     * Creates contact_tracking + campaign_contacts with twilio_sid
     * This is the unified flow: send first, then record with message_sid
     *
     * @param {object} data - { campaignId, customerId, customerName, phone, twilioSid }
     */
    async record(data) {
      const result = await apiRequest('campaign_contacts.record', { data });
      return result;
    },

    /**
     * Get all contacts for a campaign
     */
    async getAll(campaignId) {
      const result = await apiRequest('campaign_contacts.getAll', { campaign_id: campaignId });
      return result || [];
    }
  },

  // ==================== DELIVERY METRICS ====================
  delivery: {
    /**
     * Get delivery statistics from Twilio webhook events
     * Returns real delivery/read rates instead of estimates
     */
    async getStats(days = 30) {
      try {
        const result = await apiRequest('webhook_events.getDeliveryStats', { days }, 'GET');
        return result;
      } catch (error) {
        // Graceful fallback - return empty stats
        return {
          stats: { sent: 0, delivered: 0, read: 0, failed: 0, undelivered: 0 },
          deliveryRate: 0,
          readRate: 0,
          hasRealData: false
        };
      }
    },

    /**
     * Get per-campaign delivery metrics from webhook_events
     * Returns delivered/read counts and rates for each campaign
     */
    async getCampaignMetrics() {
      try {
        const result = await apiRequest('webhook_events.getCampaignDeliveryMetrics');
        return result.metrics || [];
      } catch (error) {
        console.error('Failed to fetch campaign delivery metrics:', error);
        return [];
      }
    },

    /**
     * Get raw webhook events for debugging
     */
    async getEvents(limit = 100, eventType = null) {
      const params = { limit };
      if (eventType) params.event_type = eventType;
      const result = await apiRequest('webhook_events.getAll', params, 'GET');
      return result.events || [];
    },

    /**
     * Get engagement statistics (button clicks, opt-outs, auto-replies)
     * Used for the campaign funnel "Engaged" stage
     */
    async getEngagementStats(days = 30) {
      try {
        const result = await apiRequest('webhook_events.getEngagementStats', { days }, 'GET');
        return result;
      } catch (error) {
        console.error('Failed to fetch engagement stats:', error);
        return {
          stats: { buttonPositive: 0, buttonOptout: 0, autoReply: 0, customMessage: 0, total: 0 },
          totalPositiveEngagement: 0,
          totalOptOuts: 0,
          hasRealData: false
        };
      }
    }
  },

  // ==================== CONTACT ELIGIBILITY ====================
  // Unified cooldown checks for manual and automatic campaigns
  eligibility: {
    /**
     * Check if a single customer is eligible for campaign contact
     * Enforces global cooldown (7 days) and same-type cooldown (30 days)
     *
     * @param {string} customerId - Customer document/ID
     * @param {object} options - { campaignType?, minDaysGlobal?, minDaysSameType? }
     * @returns {Promise<object>} { isEligible, reason, lastContactDate, daysUntilEligible }
     */
    async check(customerId, options = {}) {
      try {
        const result = await apiRequest('eligibility.check', {
          customerId,
          campaignType: options.campaignType || null,
          minDaysGlobal: options.minDaysGlobal || 7,
          minDaysSameType: options.minDaysSameType || 30
        });
        return result;
      } catch (error) {
        console.error('Failed to check eligibility:', error);
        // On error, assume eligible (don't block campaigns)
        return {
          customerId,
          isEligible: true,
          reason: 'Erro ao verificar - assumindo elegível',
          error: error.message
        };
      }
    },

    /**
     * Batch check eligibility for multiple customers
     * More efficient than checking one by one
     *
     * @param {string[]} customerIds - Array of customer IDs
     * @param {object} options - { campaignType?, minDaysGlobal?, minDaysSameType? }
     * @returns {Promise<object>} { total, eligibleCount, ineligibleCount, eligible, ineligible, eligibilityMap }
     */
    async checkBatch(customerIds, options = {}) {
      if (!customerIds || customerIds.length === 0) {
        return {
          total: 0,
          eligibleCount: 0,
          ineligibleCount: 0,
          eligible: [],
          ineligible: [],
          eligibilityMap: {}
        };
      }

      try {
        const result = await apiRequest('eligibility.checkBatch', {
          customerIds,
          campaignType: options.campaignType || null,
          minDaysGlobal: options.minDaysGlobal || 7,
          minDaysSameType: options.minDaysSameType || 30
        });
        return result;
      } catch (error) {
        console.error('Failed to check batch eligibility:', error);
        // On error, assume all eligible
        return {
          total: customerIds.length,
          eligibleCount: customerIds.length,
          ineligibleCount: 0,
          eligible: customerIds,
          ineligible: [],
          eligibilityMap: Object.fromEntries(
            customerIds.map(id => [id, { customerId: id, isEligible: true, reason: 'Erro ao verificar' }])
          ),
          error: error.message
        };
      }
    },

    /**
     * Filter recipients based on eligibility (convenience method)
     * Returns only eligible recipients and stats about filtered ones
     *
     * @param {Array} recipients - Array of { customerId, ... }
     * @param {object} options - { campaignType?, minDaysGlobal?, minDaysSameType? }
     * @returns {Promise<object>} { eligible, ineligible, stats }
     */
    async filterRecipients(recipients, options = {}) {
      if (!recipients || recipients.length === 0) {
        return { eligible: [], ineligible: [], stats: { total: 0, eligible: 0, ineligible: 0 } };
      }

      const customerIds = recipients.map(r => r.customerId || r.doc).filter(Boolean);
      const result = await this.checkBatch(customerIds, options);

      // Map back to original recipients
      const eligibleSet = new Set(result.eligible);
      const eligible = recipients.filter(r => eligibleSet.has(r.customerId || r.doc));
      const ineligible = recipients
        .filter(r => !eligibleSet.has(r.customerId || r.doc))
        .map(r => ({
          ...r,
          eligibilityInfo: result.eligibilityMap[r.customerId || r.doc]
        }));

      return {
        eligible,
        ineligible,
        stats: {
          total: recipients.length,
          eligible: result.eligibleCount,
          ineligible: result.ineligibleCount
        }
      };
    }
  },

  // ==================== MIGRATION ====================
  migrate: {
    async importFromLocalStorage(data) {
      return await apiRequest('migrate.import', { data });
    }
  },

  // ==================== WABA ANALYTICS ====================
  // WhatsApp Business API analytics from Meta Graph API
  waba: {
    /**
     * Get aggregated WABA analytics summary (KPIs)
     * Returns total conversations, costs, delivery rates
     */
    async getSummary() {
      try {
        const result = await apiRequest('waba.getSummary');
        return result;
      } catch (error) {
        console.error('Failed to fetch WABA summary:', error);
        return { hasData: false, summary: null };
      }
    },

    /**
     * Get daily WABA metrics for time series charts
     * @param {string} from - Start date (YYYY-MM-DD)
     * @param {string} to - End date (YYYY-MM-DD)
     */
    async getDailyMetrics(from = null, to = null) {
      try {
        const params = {};
        if (from) params.from = from;
        if (to) params.to = to;
        const result = await apiRequest('waba.getDailyMetrics', params, 'GET');
        return result;
      } catch (error) {
        console.error('Failed to fetch WABA daily metrics:', error);
        return { metrics: [], count: 0 };
      }
    },

    /**
     * Get conversation analytics (billable conversations)
     * @param {object} filters - { from, to, category, country }
     */
    async getConversations(filters = {}) {
      try {
        const result = await apiRequest('waba.getConversations', filters, 'GET');
        return result;
      } catch (error) {
        console.error('Failed to fetch WABA conversations:', error);
        return { data: [], count: 0, summary: { totalConversations: 0, totalCost: 0, byCategory: {} } };
      }
    },

    /**
     * Get message analytics (delivery metrics)
     * @param {string} from - Start date (YYYY-MM-DD)
     * @param {string} to - End date (YYYY-MM-DD)
     */
    async getMessages(from = null, to = null) {
      try {
        const params = {};
        if (from) params.from = from;
        if (to) params.to = to;
        const result = await apiRequest('waba.getMessages', params, 'GET');
        return result;
      } catch (error) {
        console.error('Failed to fetch WABA messages:', error);
        return { data: [], count: 0, summary: { totalSent: 0, totalDelivered: 0, totalRead: 0, deliveryRate: 0, readRate: 0 } };
      }
    },

    /**
     * Trigger manual sync of WABA analytics (calls waba-analytics function)
     */
    async triggerSync() {
      try {
        const response = await fetch(`${getNetlifyFunctionUrl('waba-analytics')}?action=sync`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
      } catch (error) {
        console.error('Failed to trigger WABA sync:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Trigger backfill of WABA analytics from a specific date
     * @param {string} from - Start date (YYYY-MM-DD), defaults to 2025-12-09
     */
    async triggerBackfill(from = '2025-12-09') {
      try {
        const response = await fetch(`${getNetlifyFunctionUrl('waba-analytics')}?action=backfill&from=${from}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
      } catch (error) {
        console.error('Failed to trigger WABA backfill:', error);
        return { success: false, error: error.message };
      }
    },

    // ==================== TEMPLATE ANALYTICS ====================

    /**
     * Get cached templates list from Meta API
     */
    async getTemplates() {
      try {
        const result = await apiRequest('waba.getTemplates');
        return result;
      } catch (error) {
        console.error('Failed to fetch WABA templates:', error);
        return { templates: [], count: 0 };
      }
    },

    /**
     * Get raw per-template analytics data
     * @param {string} from - Start date (YYYY-MM-DD)
     * @param {string} to - End date (YYYY-MM-DD)
     * @param {string} templateId - Optional template ID filter
     */
    async getTemplateAnalytics(from = null, to = null, templateId = null) {
      try {
        const params = {};
        if (from) params.from = from;
        if (to) params.to = to;
        if (templateId) params.templateId = templateId;
        const result = await apiRequest('waba.getTemplateAnalytics', params, 'GET');
        return result;
      } catch (error) {
        console.error('Failed to fetch WABA template analytics:', error);
        return { analytics: [] };
      }
    },

    /**
     * Get aggregated template analytics summary with rates
     * @param {string} from - Start date (YYYY-MM-DD)
     * @param {string} to - End date (YYYY-MM-DD)
     */
    async getTemplateAnalyticsSummary(from = null, to = null) {
      try {
        const params = {};
        if (from) params.from = from;
        if (to) params.to = to;
        const result = await apiRequest('waba.getTemplateAnalyticsSummary', params, 'GET');
        return result;
      } catch (error) {
        console.error('Failed to fetch WABA template summary:', error);
        return {
          templates: [],
          summary: { totalSent: 0, totalDelivered: 0, totalRead: 0, deliveryRate: 0, readRate: 0, templateCount: 0 }
        };
      }
    },

    /**
     * Trigger manual sync of template analytics (calls waba-analytics function)
     */
    async triggerTemplateSync() {
      try {
        const response = await fetch(`${getNetlifyFunctionUrl('waba-analytics')}?action=sync-templates`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
      } catch (error) {
        console.error('Failed to trigger WABA template sync:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Get WhatsApp Business profile data
     * Returns: verified name, phone number, quality rating, messaging tier, about, profile picture
     */
    async getProfile() {
      try {
        const response = await fetch(`${getNetlifyFunctionUrl('waba-analytics')}?action=profile`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        return data.profile || null;
      } catch (error) {
        console.error('Failed to fetch WABA profile:', error);
        return null;
      }
    }
  },

  // ==================== TWILIO ENGAGEMENT & COST ====================
  // Direct Twilio message analytics (engagement, costs)
  twilio: {
    /**
     * Fetch messages with engagement classification and cost data
     * @param {object} options - { dateSentAfter, dateSentBefore, pageSize, pageToken }
     * @returns {Promise<object>} { engagements, optOuts, inboundMessages, costSummary, summary }
     */
    async getEngagementAndCosts(options = {}) {
      try {
        const body = {
          action: 'fetch_messages',
          dateSentAfter: options.dateSentAfter || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          pageSize: options.pageSize || 100
        };
        if (options.dateSentBefore) body.dateSentBefore = options.dateSentBefore;
        if (options.pageToken) body.pageToken = options.pageToken;

        const response = await fetch(getNetlifyFunctionUrl('twilio-whatsapp'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch Twilio data');
        }

        return {
          engagements: data.blacklistCandidates?.engagements || [],
          optOuts: data.blacklistCandidates?.optOuts || [],
          inboundMessages: data.blacklistCandidates?.inboundMessages || [],
          costSummary: data.costSummary || { outboundCount: 0, outboundCost: 0, inboundCount: 0, inboundCost: 0, currency: 'USD' },
          summary: data.summary || {},
          pagination: data.pagination || {}
        };
      } catch (error) {
        console.error('Failed to fetch Twilio engagement/costs:', error);
        return {
          engagements: [],
          optOuts: [],
          inboundMessages: [],
          costSummary: { outboundCount: 0, outboundCost: 0, inboundCount: 0, inboundCost: 0, currency: 'USD' },
          summary: {},
          pagination: {},
          error: error.message
        };
      }
    },

    /**
     * Fetch all pages of engagement data for comprehensive analytics
     * @param {string} dateSentAfter - Start date (YYYY-MM-DD)
     * @returns {Promise<object>} Aggregated engagement and cost data
     */
    async getAllEngagementAndCosts(dateSentAfter) {
      let allEngagements = [];
      let allOptOuts = [];
      let allInbound = [];
      let totalOutboundCount = 0;
      let totalOutboundCost = 0;
      let totalInboundCount = 0;
      let currency = 'USD';
      let pageToken = null;
      let hasMore = true;

      while (hasMore) {
        const result = await this.getEngagementAndCosts({
          dateSentAfter,
          pageSize: 100,
          pageToken
        });

        allEngagements = [...allEngagements, ...result.engagements];
        allOptOuts = [...allOptOuts, ...result.optOuts];
        allInbound = [...allInbound, ...result.inboundMessages];
        totalOutboundCount += result.costSummary.outboundCount;
        totalOutboundCost += result.costSummary.outboundCost;
        totalInboundCount += result.costSummary.inboundCount;
        currency = result.costSummary.currency;

        hasMore = result.pagination?.hasMore || false;
        pageToken = result.pagination?.nextPageToken || null;

        // Safety limit to prevent infinite loops
        if (allEngagements.length + allOptOuts.length + allInbound.length > 1000) {
          break;
        }
      }

      return {
        engagements: allEngagements,
        optOuts: allOptOuts,
        inboundMessages: allInbound,
        costSummary: {
          outboundCount: totalOutboundCount,
          outboundCost: totalOutboundCost,
          inboundCount: totalInboundCount,
          inboundCost: 0, // Inbound is typically free
          currency
        }
      };
    },

    // ==================== DATABASE-CACHED METHODS ====================
    // These methods read from Supabase (fast) instead of Twilio API (slow)
    // Use triggerSync() to refresh the database cache

    /**
     * Get engagement and cost data from database (fast, cached)
     * Reads from contact_tracking and twilio_daily_costs tables
     * @param {string} dateFrom - Start date (YYYY-MM-DD)
     * @param {string} dateTo - End date (YYYY-MM-DD)
     * @returns {Promise<object>} { engagements, optOuts, inboundMessages, costSummary, dailyCosts }
     */
    async getStoredEngagementAndCosts(dateFrom = null, dateTo = null) {
      try {
        const response = await fetch(getNetlifyFunctionUrl('twilio-whatsapp'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get_stored_data',
            dateFrom,
            dateTo
          })
        });
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to get stored data');
        }

        return data;
      } catch (error) {
        console.error('Failed to get stored Twilio data:', error);
        return {
          engagements: [],
          optOuts: [],
          inboundMessages: [],
          costSummary: { outboundCount: 0, outboundCost: 0, inboundCount: 0, inboundCost: 0, currency: 'USD' },
          dailyCosts: [],
          error: error.message
        };
      }
    },

    /**
     * Trigger sync of Twilio data to database
     * Fetches from Twilio API and stores to Supabase
     * @param {object} options - { dateSentAfter, force }
     * @returns {Promise<object>} Sync results
     */
    async triggerSync(options = {}) {
      try {
        // Import sync service dynamically
        const { syncEngagementAndCosts } = await import('./twilioSyncService');
        return await syncEngagementAndCosts(options);
      } catch (error) {
        console.error('Failed to trigger Twilio sync:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Get daily cost breakdown from database
     * @param {string} dateFrom - Start date (YYYY-MM-DD)
     * @param {string} dateTo - End date (YYYY-MM-DD)
     * @returns {Promise<object>} { dailyCosts, summary }
     */
    async getCostSummary(dateFrom = null, dateTo = null) {
      try {
        const data = await this.getStoredEngagementAndCosts(dateFrom, dateTo);
        return {
          dailyCosts: data.dailyCosts || [],
          summary: data.costSummary || { outboundCount: 0, outboundCost: 0, inboundCount: 0, inboundCost: 0, currency: 'USD' }
        };
      } catch (error) {
        console.error('Failed to get cost summary:', error);
        return {
          dailyCosts: [],
          summary: { outboundCount: 0, outboundCost: 0, inboundCount: 0, inboundCost: 0, currency: 'USD' },
          error: error.message
        };
      }
    }
  },

  // ==================== INSTAGRAM ANALYTICS ====================
  // Instagram Business API analytics from Meta Graph API
  instagram: {
    /**
     * Get combined dashboard data (profile, insights, media, top posts)
     * This is the recommended endpoint for the dashboard view
     */
    async getDashboard() {
      try {
        const response = await fetch(`${getNetlifyFunctionUrl('instagram-analytics')}?action=dashboard`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch Instagram dashboard:', error);
        return { profile: null, insights: null, media: [], topPosts: [] };
      }
    },

    /**
     * Get Instagram profile data
     */
    async getProfile() {
      try {
        const response = await fetch(`${getNetlifyFunctionUrl('instagram-analytics')}?action=profile`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch Instagram profile:', error);
        return { profile: null };
      }
    },

    /**
     * Get account-level insights (reach, impressions, engagement)
     */
    async getInsights() {
      try {
        const response = await fetch(`${getNetlifyFunctionUrl('instagram-analytics')}?action=insights`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch Instagram insights:', error);
        return { insights: null };
      }
    },

    /**
     * Get recent media (posts)
     * @param {number} limit - Max posts to fetch (default 25, max 50)
     */
    async getMedia(limit = 25) {
      try {
        const response = await fetch(`${getNetlifyFunctionUrl('instagram-analytics')}?action=media&limit=${limit}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch Instagram media:', error);
        return { media: [] };
      }
    },

    /**
     * Get per-post insights
     * @param {string} mediaId - Instagram media ID
     */
    async getMediaInsights(mediaId) {
      try {
        const response = await fetch(`${getNetlifyFunctionUrl('instagram-analytics')}?action=media-insights&mediaId=${mediaId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch media insights:', error);
        return { insights: null };
      }
    },

    /**
     * Get recent comments across posts
     * @param {number} limit - Max comments to fetch (default 50, max 100)
     */
    async getComments(limit = 50) {
      try {
        const response = await fetch(`${getNetlifyFunctionUrl('instagram-analytics')}?action=comments&limit=${limit}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch Instagram comments:', error);
        return { comments: [] };
      }
    },

    /**
     * Get DM conversation count (read-only)
     */
    async getMessagesCount() {
      try {
        const response = await fetch(`${getNetlifyFunctionUrl('instagram-analytics')}?action=messages-count`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch messages count:', error);
        return { messages: { count: 0 } };
      }
    },

    // ==================== HISTORICAL DATA ====================

    /**
     * Get historical Instagram metrics from database
     * @param {number|null} days - Number of days to fetch, or null for all data
     * @returns {Promise<object>} { history: [...], summary: {...}, count: number }
     */
    async getHistory(days = 30) {
      try {
        // Add cache buster to ensure fresh data on filter change
        const cacheBuster = Date.now();
        // Use 'all' for null to fetch all available history
        const daysParam = days === null ? 'all' : days;
        const response = await fetch(`${getNetlifyFunctionUrl('instagram-analytics')}?action=history&days=${daysParam}&_t=${cacheBuster}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Failed to fetch Instagram history:', error);
        return { history: [], summary: null, count: 0 };
      }
    },

    /**
     * Trigger manual sync of Instagram analytics
     * Stores current metrics in database for historical tracking
     */
    async triggerSync() {
      try {
        const response = await fetch(`${getNetlifyFunctionUrl('instagram-analytics')}?action=sync`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
      } catch (error) {
        console.error('Failed to trigger Instagram sync:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Get sync status (last sync timestamp)
     */
    async getStatus() {
      try {
        const response = await fetch(`${getNetlifyFunctionUrl('instagram-analytics')}?action=status`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch Instagram sync status:', error);
        return { lastSync: null };
      }
    }
  },

  // ==================== GOOGLE BUSINESS PROFILE ====================
  // Google Business Profile API analytics with OAuth
  googleBusiness: {
    /**
     * Get combined dashboard data (profile, metrics, reviews, summary)
     * This is the recommended endpoint for the dashboard view
     */
    async getDashboard() {
      try {
        const response = await fetch(`${getNetlifyFunctionUrl('google-business-analytics')}?action=dashboard`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch Google Business dashboard:', error);
        return { profile: null, metrics: [], reviews: [], summary: null };
      }
    },

    /**
     * Get business profile data (name, address, hours, photos)
     */
    async getProfile() {
      try {
        const response = await fetch(`${getNetlifyFunctionUrl('google-business-analytics')}?action=profile`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch Google Business profile:', error);
        return { profile: null };
      }
    },

    /**
     * Get reviews with pagination
     * @param {number} pageSize - Number of reviews per page (default 10, max 50)
     * @param {string} pageToken - Token for next page
     */
    async getReviews(pageSize = 10, pageToken = null) {
      try {
        let url = `${getNetlifyFunctionUrl('google-business-analytics')}?action=reviews&pageSize=${pageSize}`;
        if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch Google Business reviews:', error);
        return { reviews: [], nextPageToken: null };
      }
    },

    /**
     * Reply to a review
     * @param {string} reviewId - Google review ID
     * @param {string} comment - Reply text
     */
    async replyToReview(reviewId, comment) {
      try {
        const response = await fetch(getNetlifyFunctionUrl('google-business-analytics'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'reply',
            reviewId,
            comment
          })
        });
        return await response.json();
      } catch (error) {
        console.error('Failed to reply to review:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Get historical metrics from database
     * @param {number|null} days - Number of days to fetch, or null for all data
     */
    async getHistory(days = 30) {
      try {
        const daysParam = days === null ? 'all' : days;
        const cacheBuster = Date.now();
        const response = await fetch(`${getNetlifyFunctionUrl('google-business-analytics')}?action=history&days=${daysParam}&_t=${cacheBuster}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch Google Business history:', error);
        return { history: [], summary: null, count: 0 };
      }
    },

    /**
     * Trigger manual sync of GBP analytics
     * Stores current metrics in database for historical tracking
     */
    async triggerSync() {
      try {
        const response = await fetch(`${getNetlifyFunctionUrl('google-business-analytics')}?action=sync`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
      } catch (error) {
        console.error('Failed to trigger Google Business sync:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Get sync status (last sync timestamp)
     */
    async getStatus() {
      try {
        const response = await fetch(`${getNetlifyFunctionUrl('google-business-analytics')}?action=status`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch Google Business sync status:', error);
        return { lastSync: null };
      }
    },

    // ==================== OAUTH MANAGEMENT ====================

    /**
     * Get OAuth authorization URL
     * Redirects user to Google consent screen
     */
    async getOAuthUrl() {
      try {
        const response = await fetch(`${getNetlifyFunctionUrl('google-business-analytics')}?action=oauth-init`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
      } catch (error) {
        console.error('Failed to get OAuth URL:', error);
        return { authUrl: null, error: error.message };
      }
    },

    /**
     * Check OAuth token status
     * Returns whether tokens exist and are valid
     */
    async getOAuthStatus() {
      try {
        const response = await fetch(`${getNetlifyFunctionUrl('google-business-analytics')}?action=oauth-status`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
      } catch (error) {
        console.error('Failed to check OAuth status:', error);
        return { authenticated: false, error: error.message };
      }
    },

    /**
     * Get list of GBP accounts (for account selection)
     */
    async getAccounts() {
      try {
        const response = await fetch(`${getNetlifyFunctionUrl('google-business-analytics')}?action=accounts`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch GBP accounts:', error);
        return { accounts: [] };
      }
    },

    /**
     * Get locations for an account
     * @param {string} accountId - GBP account ID
     */
    async getLocations(accountId) {
      try {
        const response = await fetch(`${getNetlifyFunctionUrl('google-business-analytics')}?action=locations&accountId=${accountId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch GBP locations:', error);
        return { locations: [] };
      }
    }
  },

  // ==================== APP SETTINGS ====================
  // App-wide settings from app_settings table
  settings: {
    /**
     * Get app settings (sync timestamps, etc.)
     * @returns {Promise<object>} Settings object with blacklist_last_sync, twilio_last_sync, etc.
     */
    async get() {
      try {
        const result = await apiRequest('settings.get');
        return result.settings || {};
      } catch (error) {
        console.error('Failed to fetch app settings:', error);
        return {};
      }
    }
  },

  // ==================== GENERIC METHODS ====================
  // For direct table access (used by services)
  async get(table, filters = {}) {
    const result = await apiRequest(`${table}.getAll`, filters);
    return result[table] || result.data || [];
  },

  async post(table, data) {
    const result = await apiRequest(`${table}.create`, { data });
    return result[table] || result.data || result;
  },

  async patch(table, data, filters = {}) {
    const result = await apiRequest(`${table}.update`, { data, filters });
    return result;
  },

  async rpc(functionName, params = {}) {
    const result = await apiRequest(`rpc.${functionName}`, params);
    return result.data || result;
  }
};

/**
 * Collect all localStorage data for migration
 */
export function collectLocalStorageData() {
  const data = {};

  // Blacklist
  try {
    const blacklistRaw = localStorage.getItem('lavpop_blacklist');
    if (blacklistRaw) {
      data.blacklist = JSON.parse(blacklistRaw);
    }
  } catch (e) {
    console.error('Error reading blacklist:', e);
  }

  // Campaigns
  try {
    const campaignsRaw = localStorage.getItem('lavpop_campaigns');
    if (campaignsRaw) {
      data.campaigns = JSON.parse(campaignsRaw);
    }
  } catch (e) {
    console.error('Error reading campaigns:', e);
  }

  // Campaign sends
  try {
    const sendsRaw = localStorage.getItem('lavpop_campaign_sends');
    if (sendsRaw) {
      data.campaignSends = JSON.parse(sendsRaw);
    }
  } catch (e) {
    console.error('Error reading campaign sends:', e);
  }

  // Scheduled campaigns
  try {
    const scheduledRaw = localStorage.getItem('lavpop_scheduled_campaigns');
    if (scheduledRaw) {
      data.scheduledCampaigns = JSON.parse(scheduledRaw);
    }
  } catch (e) {
    console.error('Error reading scheduled campaigns:', e);
  }

  // Comm logs
  try {
    const logsRaw = localStorage.getItem('lavpop_comm_log');
    if (logsRaw) {
      data.commLogs = JSON.parse(logsRaw);
    }
  } catch (e) {
    console.error('Error reading comm logs:', e);
  }

  // Automation rules
  try {
    const rulesRaw = localStorage.getItem('lavpop_automation_rules');
    if (rulesRaw) {
      data.automationRules = JSON.parse(rulesRaw);
    }
  } catch (e) {
    console.error('Error reading automation rules:', e);
  }

  return data;
}

/**
 * Migrate all localStorage data to Supabase
 */
export async function migrateToSupabase() {
  const data = collectLocalStorageData();

  // Check what we have
  const summary = {
    blacklist: data.blacklist?.length || 0,
    campaigns: data.campaigns?.length || 0,
    campaignSends: data.campaignSends?.length || 0,
    scheduledCampaigns: data.scheduledCampaigns?.length || 0,
    commLogs: data.commLogs?.length || 0,
    automationRules: data.automationRules?.length || 0
  };

  if (Object.values(summary).every(v => v === 0)) {
    return { success: true, message: 'No data to migrate' };
  }

  try {
    const result = await api.migrate.importFromLocalStorage(data);
    return result;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

/**
 * Clear localStorage after successful migration
 */
export function clearMigratedLocalStorage() {
  const keysToRemove = [
    'lavpop_blacklist',
    'lavpop_blacklist_last_sync',
    'lavpop_campaigns',
    'lavpop_campaign_sends',
    'lavpop_scheduled_campaigns',
    'lavpop_comm_log',
    'lavpop_automation_rules'
  ];

  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
}

// Expose migration function globally for console access
if (typeof window !== 'undefined') {
  window.migrateToSupabase = migrateToSupabase;
  window.collectLocalStorageData = collectLocalStorageData;
  window.clearMigratedLocalStorage = clearMigratedLocalStorage;
}

export default api;
