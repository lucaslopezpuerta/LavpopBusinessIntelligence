// apiService.js v2.0
// Unified API service for Supabase backend communication
// Provides fallback to localStorage when backend is unavailable
//
// Version: 2.0 (2025-12-10) - Security hardening
//   - Added API key authentication (X-Api-Key header)
//   - Key read from VITE_API_KEY environment variable
//
// Usage:
//   import { api, isBackendAvailable } from './apiService';
//   const blacklist = await api.blacklist.getAll();

const API_URL = '/.netlify/functions/supabase-api';

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
    const response = await fetch(API_URL, {
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
  try {
    const options = {
      method,
      headers: getHeaders()
    };

    if (method === 'POST') {
      options.body = JSON.stringify({ action, ...data });
    }

    const url = method === 'GET' && Object.keys(data).length > 0
      ? `${API_URL}?action=${action}&${new URLSearchParams(data)}`
      : API_URL;

    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'API request failed');
    }

    return result;
  } catch (error) {
    console.error(`API error [${action}]:`, error);
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
      const filters = { status: 'pending' };
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
     * Get raw webhook events for debugging
     */
    async getEvents(limit = 100, eventType = null) {
      const params = { limit };
      if (eventType) params.event_type = eventType;
      const result = await apiRequest('webhook_events.getAll', params, 'GET');
      return result.events || [];
    }
  },

  // ==================== MIGRATION ====================
  migrate: {
    async importFromLocalStorage(data) {
      return await apiRequest('migrate.import', { data });
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
  console.log('Starting migration to Supabase...');

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

  console.log('Data to migrate:', summary);

  if (Object.values(summary).every(v => v === 0)) {
    console.log('No data to migrate');
    return { success: true, message: 'No data to migrate' };
  }

  try {
    const result = await api.migrate.importFromLocalStorage(data);
    console.log('Migration complete:', result);

    // Clear localStorage after successful migration (optional)
    // Uncomment if you want to clear after migration
    // clearMigratedLocalStorage();

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
    console.log(`Cleared: ${key}`);
  });
}

// Expose migration function globally for console access
if (typeof window !== 'undefined') {
  window.migrateToSupabase = migrateToSupabase;
  window.collectLocalStorageData = collectLocalStorageData;
  window.clearMigratedLocalStorage = clearMigratedLocalStorage;
}

export default api;
