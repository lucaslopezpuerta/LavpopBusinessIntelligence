// communicationLog.js v3.2 - ID FIX
// Utility for logging customer communications across the app
// Used by CustomerProfileModal, CustomerListDrilldown, AtRiskCustomersTable, etc.
//
// CHANGELOG:
// v3.2 (2026-02-03): Fix missing id in log entries
//   - Added id field to transformation (was missing, broke delete)
// v3.1 (2026-02-03): Delete support
//   - Added deleteCommunicationEntry() for removing log entries
//   - Dispatches communicationLogUpdate event on delete
// v3.0 (2025-12-12): Backend only - removed localStorage
//   - All communication logs now stored exclusively in Supabase
//   - Removed localStorage fallbacks
//   - All functions are now async
// v2.0 (2025-12-08): Supabase backend integration
//   - Async functions with localStorage fallback
//   - Campaign context support for attribution
//   - Integration with contact tracking for effectiveness metrics
// v1.0 (2025-12-01): Initial implementation

import { api } from './apiService';

/**
 * Add a communication entry to a customer's log (backend only)
 * @param {string} customerId - Customer document/ID
 * @param {string} method - Communication method: 'call', 'whatsapp', 'email', 'note'
 * @param {string} notes - Description of the communication
 * @param {Object} [options] - Additional options
 * @param {string} [options.campaignId] - Campaign ID if from a campaign
 * @param {string} [options.campaignName] - Campaign name for display
 * @returns {Promise<Object>} The created entry
 */
export const addCommunicationEntry = async (customerId, method, notes, options = {}) => {
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

  try {
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
  } catch (error) {
    console.error('Failed to add communication entry:', error.message);
  }

  // Dispatch custom event for same-window sync
  window.dispatchEvent(new CustomEvent('communicationLogUpdate', {
    detail: { customerId, entry }
  }));

  return entry;
};

/**
 * @deprecated Use addCommunicationEntry() instead (now async)
 */
export const addCommunicationEntryAsync = addCommunicationEntry;

/**
 * Get all communication entries for a customer (backend only)
 * @param {string} customerId - Customer document/ID
 * @param {Object} [options] - Options
 * @param {number} [options.limit=50] - Max entries to return
 * @returns {Promise<Array>} Communication log entries
 */
export const getCommunicationLog = async (customerId, options = {}) => {
  if (!customerId) return [];

  const { limit = 50 } = options;

  try {
    // Fetch from backend - show all communications (manual + automation)
    const result = await api.logs.getAll({
      customer_id: customerId,
      limit
    });

    // Transform to UI format (MUST include id for delete functionality)
    const entries = (result.logs || []).map(e => ({
      id: e.id,  // Required for delete
      date: e.sent_at || e.date,
      method: e.method || e.channel,
      notes: e.notes || e.message,
      timestamp: new Date(e.sent_at || e.date).getTime(),
      campaign_id: e.campaign_id,
      campaign_name: e.campaign_name
    }));

    // Sort by date descending
    entries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    return entries.slice(0, limit);
  } catch (error) {
    console.error('Failed to get communication log:', error.message);
    return [];
  }
};

/**
 * @deprecated Use getCommunicationLog() instead (now async)
 */
export const getCommunicationLogAsync = getCommunicationLog;

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
 * Get communication stats for a customer (backend only)
 * @param {string} customerId - Customer document/ID
 * @returns {Promise<Object>} Stats including counts by method
 */
export const getCommunicationStats = async (customerId) => {
  const log = await getCommunicationLog(customerId);

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

/**
 * Delete a communication entry by ID (backend only)
 * @param {string|number} entryId - The log entry ID
 * @param {string} customerId - Customer ID for event dispatch
 * @returns {Promise<boolean>} Success status
 */
export const deleteCommunicationEntry = async (entryId, customerId) => {
  if (!entryId) return false;

  try {
    await api.logs.delete(entryId);

    // Dispatch event for UI update
    window.dispatchEvent(new CustomEvent('communicationLogUpdate', {
      detail: { customerId, deleted: entryId }
    }));

    return true;
  } catch (error) {
    console.error('Failed to delete communication entry:', error.message);
    return false;
  }
};
