// communicationLog.js v2.0 - BACKEND INTEGRATION
// Utility for logging customer communications across the app
// Used by CustomerProfileModal, CustomerListDrilldown, AtRiskCustomersTable, etc.
//
// CHANGELOG:
// v2.0 (2025-12-08): Supabase backend integration
//   - Async functions with localStorage fallback
//   - Campaign context support for attribution
//   - Integration with contact tracking for effectiveness metrics
// v1.0 (2025-12-01): Initial implementation
//   - addCommunicationEntry: Add entry to customer's communication log
//   - getCommunicationLog: Get all entries for a customer
//   - Syncs with CustomerProfileModal's localStorage format

import { api, isBackendAvailable } from './apiService';

const STORAGE_PREFIX = 'comm_log_';

// Backend availability cache
let useBackend = null;

async function shouldUseBackend() {
  if (useBackend === null) {
    useBackend = await isBackendAvailable();
  }
  return useBackend;
}

/**
 * Add a communication entry to a customer's log (async with backend support)
 * @param {string} customerId - Customer document/ID
 * @param {string} method - Communication method: 'call', 'whatsapp', 'email', 'note'
 * @param {string} notes - Description of the communication
 * @param {Object} [options] - Additional options
 * @param {string} [options.campaignId] - Campaign ID if from a campaign
 * @param {string} [options.campaignName] - Campaign name for display
 * @returns {Promise<Object>} The created entry
 */
export const addCommunicationEntryAsync = async (customerId, method, notes, options = {}) => {
  if (!customerId) return null;

  const { campaignId = null, campaignName = null } = options;

  const entry = {
    date: new Date().toISOString(),
    method,
    notes,
    timestamp: Date.now(),
    campaign_id: campaignId,
    campaign_name: campaignName
  };

  // Try backend first
  try {
    if (await shouldUseBackend()) {
      await api.logs.add({
        customer_id: customerId,
        channel: method,
        direction: 'outbound',
        message: notes,
        type: 'communication',
        method,
        notes,
        campaign_id: campaignId,
        campaign_name: campaignName
      });
    }
  } catch (error) {
    console.warn('Backend log failed, using localStorage:', error.message);
  }

  // Always save to localStorage for immediate UI sync
  const storageKey = `${STORAGE_PREFIX}${customerId}`;
  const existing = localStorage.getItem(storageKey);
  const log = existing ? JSON.parse(existing) : [];
  const updated = [entry, ...log];
  localStorage.setItem(storageKey, JSON.stringify(updated));

  // Dispatch custom event for same-window sync
  window.dispatchEvent(new CustomEvent('communicationLogUpdate', {
    detail: { customerId, entry }
  }));

  return entry;
};

/**
 * Add a communication entry (synchronous - for backwards compatibility)
 * @param {string} customerId - Customer document/ID
 * @param {string} method - Communication method: 'call', 'whatsapp', 'email', 'note'
 * @param {string} notes - Description of the communication
 * @returns {Object} The created entry
 */
export const addCommunicationEntry = (customerId, method, notes) => {
  if (!customerId) return null;

  const entry = {
    date: new Date().toISOString(),
    method,
    notes,
    timestamp: Date.now(),
  };

  // Save to localStorage
  const storageKey = `${STORAGE_PREFIX}${customerId}`;
  const existing = localStorage.getItem(storageKey);
  const log = existing ? JSON.parse(existing) : [];
  const updated = [entry, ...log];
  localStorage.setItem(storageKey, JSON.stringify(updated));

  // Dispatch custom event for same-window sync
  window.dispatchEvent(new CustomEvent('communicationLogUpdate', {
    detail: { customerId, entry }
  }));

  // Also save to backend asynchronously (fire and forget)
  addCommunicationEntryAsync(customerId, method, notes).catch(() => {});

  return entry;
};

/**
 * Get all communication entries for a customer (async with backend support)
 * @param {string} customerId - Customer document/ID
 * @param {Object} [options] - Options
 * @param {number} [options.limit=50] - Max entries to return
 * @returns {Promise<Array>} Communication log entries
 */
export const getCommunicationLogAsync = async (customerId, options = {}) => {
  if (!customerId) return [];

  const { limit = 50 } = options;

  try {
    if (await shouldUseBackend()) {
      // Don't filter by type - show all communications (manual + automation)
      const result = await api.logs.getAll({
        customer_id: customerId,
        limit
      });

      // Merge with localStorage entries (in case backend is behind)
      const localEntries = getCommunicationLog(customerId);

      // Deduplicate by timestamp
      const seen = new Set();
      const merged = [];

      // Add backend entries first
      (result.logs || []).forEach(e => {
        const key = `${e.sent_at || e.date}_${e.method || e.channel}`;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push({
            date: e.sent_at || e.date,
            method: e.method || e.channel,
            notes: e.notes || e.message,
            timestamp: new Date(e.sent_at || e.date).getTime(),
            campaign_id: e.campaign_id,
            campaign_name: e.campaign_name
          });
        }
      });

      // Add local entries that aren't in backend
      localEntries.forEach(e => {
        const key = `${e.date}_${e.method}`;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(e);
        }
      });

      // Sort by date descending
      merged.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      return merged.slice(0, limit);
    }
  } catch (error) {
    console.warn('Backend fetch failed, using localStorage:', error.message);
  }

  return getCommunicationLog(customerId);
};

/**
 * Get all communication entries for a customer (synchronous - localStorage only)
 * @param {string} customerId - Customer document/ID
 * @returns {Array} Communication log entries
 */
export const getCommunicationLog = (customerId) => {
  if (!customerId) return [];

  const storageKey = `${STORAGE_PREFIX}${customerId}`;
  const stored = localStorage.getItem(storageKey);
  return stored ? JSON.parse(stored) : [];
};

/**
 * Get default notes for a communication method
 * @param {string} method - Communication method
 * @returns {string} Default note text in Portuguese
 */
export const getDefaultNotes = (method) => {
  switch (method) {
    case 'call':
    case 'phone':
      return 'Ligação realizada';
    case 'whatsapp':
      return 'Mensagem WhatsApp enviada';
    case 'email':
      return 'Email enviado';
    default:
      return 'Contato realizado';
  }
};

/**
 * Add communication entry with campaign context
 * @param {string} customerId - Customer document/ID
 * @param {string} method - Communication method
 * @param {string} notes - Description
 * @param {string} campaignId - Campaign ID
 * @param {string} campaignName - Campaign name
 * @returns {Promise<Object>} Created entry
 */
export const addCampaignCommunication = async (customerId, method, notes, campaignId, campaignName) => {
  return addCommunicationEntryAsync(customerId, method, notes, {
    campaignId,
    campaignName
  });
};

/**
 * Get communication stats for a customer
 * @param {string} customerId - Customer document/ID
 * @returns {Object} Stats including counts by method
 */
export const getCommunicationStats = (customerId) => {
  const log = getCommunicationLog(customerId);

  const stats = {
    total: log.length,
    byMethod: {},
    lastContact: null,
    lastMethod: null
  };

  log.forEach(entry => {
    const method = entry.method || 'unknown';
    stats.byMethod[method] = (stats.byMethod[method] || 0) + 1;

    if (!stats.lastContact || new Date(entry.date) > new Date(stats.lastContact)) {
      stats.lastContact = entry.date;
      stats.lastMethod = method;
    }
  });

  return stats;
};
