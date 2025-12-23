// contactTrackingService.js v2.0
// Backend-only contact tracking service
// No localStorage fallback - contact_tracking table is the single source of truth
//
// CHANGELOG:
// v2.0 (2025-12-13): Backend-only architecture
//   - Removed all localStorage fallback logic
//   - Added campaign_type support ('manual' for UI checkmarks)
//   - Simplified to pure API wrapper
//   - Local storage cleanup function for migration
// v1.0 (2025-12-08): Initial implementation with localStorage fallback

import { api } from './apiService';

// ==================== CONTACT MANAGEMENT ====================

/**
 * Create a contact tracking record
 * @param {Object} params - Contact parameters
 * @param {string} params.customerId - Customer doc/ID
 * @param {string} params.customerName - Customer name
 * @param {string} params.riskLevel - Customer risk level at time of contact
 * @param {string} params.contactMethod - call, whatsapp, email, manual
 * @param {string} [params.campaignId] - Optional campaign ID
 * @param {string} [params.campaignName] - Optional campaign name
 * @param {string} [params.campaignType] - Campaign type (manual, winback, welcome, etc.)
 * @param {string} [params.notes] - Optional notes
 * @returns {Promise<Object>} Created contact record
 */
export async function createContactRecord(params) {
  const {
    customerId,
    customerName,
    riskLevel,
    contactMethod,
    campaignId = null,
    campaignName = null,
    campaignType = null,
    notes = null
  } = params;

  // Determine campaign_type: use 'manual' for non-campaign contacts
  const effectiveCampaignType = campaignType || (campaignId ? null : 'manual');

  const record = {
    customer_id: customerId,
    customer_name: customerName,
    risk_level: riskLevel,
    contact_method: contactMethod,
    campaign_id: campaignId,
    campaign_name: campaignName || (campaignId ? null : 'Contato Manual'),
    campaign_type: effectiveCampaignType,
    status: 'pending',
    notes
  };

  return await api.contacts.create(record);
}

/**
 * Get pending contacts for a customer
 * @param {string} customerId - Customer doc/ID
 * @returns {Promise<Array>} Pending contact records
 */
export async function getPendingContacts(customerId) {
  return await api.contacts.getPending(customerId);
}

/**
 * Check if customer has an active (pending) contact
 * @param {string} customerId - Customer doc/ID
 * @returns {Promise<boolean>}
 */
export async function isCustomerContacted(customerId) {
  const pending = await getPendingContacts(customerId);
  return pending.length > 0;
}

/**
 * Get all pending contacts (for display in At Risk table)
 * @returns {Promise<Object>} Map of customerId -> contact record
 */
export async function getAllPendingContacts() {
  const records = await api.contacts.getPending();
  const map = {};
  records.forEach(r => {
    map[r.customer_id] = r;
  });
  return map;
}

/**
 * Mark customer as returned (outcome tracking)
 * @param {string} customerId - Customer doc/ID
 * @param {Date} returnDate - Date of return visit
 * @param {number} revenue - Revenue from return visit
 * @returns {Promise<Object>} Update result
 */
export async function markCustomerReturned(customerId, returnDate, revenue = 0) {
  return await api.contacts.markReturned(
    customerId,
    returnDate.toISOString(),
    revenue
  );
}

/**
 * Clear contact status (manual unmark) - marks as 'cleared'
 * @param {string} customerId - Customer doc/ID
 * @returns {Promise<boolean>} Success
 */
export async function clearContactStatus(customerId) {
  await api.contacts.clear(customerId);
  return true;
}

/**
 * Expire old contacts (called periodically by backend)
 * @returns {Promise<number>} Number of records expired
 */
export async function expireOldContacts() {
  return await api.contacts.expire();
}

// ==================== EFFECTIVENESS METRICS ====================

/**
 * Get campaign effectiveness metrics
 * @param {Object} [options] - Filter options
 * @param {number} [options.days=30] - Number of days to look back
 * @param {string} [options.campaignId] - Filter by specific campaign
 * @returns {Promise<Object>} Effectiveness metrics
 */
export async function getEffectivenessMetrics(options = {}) {
  return await api.contacts.getEffectiveness(options);
}

// ==================== AUTO-DETECT RETURNS ====================

/**
 * Process customer data to auto-detect returns
 * Note: This is now handled by backend detect_customer_returns() function
 * Called by campaign-scheduler.js periodically
 *
 * Frontend only needs to refresh pending contacts after customer data loads
 *
 * @param {Array} customers - Customer data (not used in v2.0)
 * @returns {Promise<Object>} Results (always returns 0 since backend handles this)
 */
export async function autoDetectReturns(customers) {
  // Backend handles this via detect_customer_returns() SQL function
  // Frontend just needs to refresh pending contacts
  return { checked: 0, updated: 0 };
}

// ==================== CONTACT HISTORY ====================

/**
 * Get contact history for a customer
 * @param {string} customerId - Customer doc/ID
 * @param {number} [limit=10] - Max records to return
 * @returns {Promise<Array>} Contact history
 */
export async function getContactHistory(customerId, limit = 10) {
  return await api.contacts.getHistory(customerId, limit);
}

// ==================== MIGRATION ====================

/**
 * Clean up old localStorage data (one-time migration)
 * Call this to remove deprecated localStorage entries
 */
export function cleanupLocalStorage() {
  const keysToRemove = [
    'lavpop_contact_tracking',
    'lavpop_contact_metrics_cache',
    'lavpop_contacted_customers'
  ];

  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Ignore errors
    }
  });
}

// Auto-cleanup on module load (one-time)
if (typeof window !== 'undefined') {
  try {
    const migrationKey = 'lavpop_contact_tracking_v3_migrated';
    if (!localStorage.getItem(migrationKey)) {
      cleanupLocalStorage();
      localStorage.setItem(migrationKey, 'true');
    }
  } catch (e) {
    // Ignore errors
  }
}
