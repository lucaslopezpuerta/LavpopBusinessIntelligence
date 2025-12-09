// contactTrackingService.js v1.0
// Contact tracking with outcome measurement for campaign effectiveness
// Tracks customer outreach and measures return rates
//
// CHANGELOG:
// v1.0 (2025-12-08): Initial implementation
//   - Backend-first with localStorage fallback
//   - Outcome tracking (pending, returned, expired, cleared)
//   - Campaign linking for attribution
//   - Effectiveness metrics calculation

import { api, isBackendAvailable } from './apiService';

// Storage keys for localStorage fallback
const STORAGE_KEY = 'lavpop_contact_tracking';
const METRICS_CACHE_KEY = 'lavpop_contact_metrics_cache';

// Expiry duration (7 days in milliseconds)
const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

// Backend availability cache
let useBackend = null;

async function shouldUseBackend() {
  if (useBackend === null) {
    useBackend = await isBackendAvailable();
  }
  return useBackend;
}

// ==================== LOCAL STORAGE HELPERS ====================

function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save contact tracking data:', e);
  }
}

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
    notes = null
  } = params;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + EXPIRY_MS);

  const record = {
    customer_id: customerId,
    customer_name: customerName,
    risk_level: riskLevel,
    contact_method: contactMethod,
    campaign_id: campaignId,
    campaign_name: campaignName,
    contacted_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    status: 'pending',
    notes
  };

  try {
    if (await shouldUseBackend()) {
      const result = await api.post('contact_tracking', record);
      return result;
    }
  } catch (error) {
    console.warn('Backend create failed, using localStorage:', error.message);
  }

  // Fallback to localStorage
  const data = loadFromStorage();
  const localRecord = {
    ...record,
    id: `LOCAL_${Date.now()}`,
    created_at: now.toISOString()
  };
  data.push(localRecord);
  saveToStorage(data);

  // Dispatch event for UI sync
  window.dispatchEvent(new CustomEvent('contactTrackingUpdate', {
    detail: { action: 'created', record: localRecord }
  }));

  return localRecord;
}

/**
 * Get pending contacts for a customer
 * @param {string} customerId - Customer doc/ID
 * @returns {Promise<Array>} Pending contact records
 */
export async function getPendingContacts(customerId) {
  try {
    if (await shouldUseBackend()) {
      return await api.get('contact_tracking', {
        customer_id: customerId,
        status: 'pending'
      });
    }
  } catch (error) {
    console.warn('Backend fetch failed, using localStorage:', error.message);
  }

  // Fallback to localStorage
  const data = loadFromStorage();
  const now = Date.now();
  return data.filter(r =>
    r.customer_id === customerId &&
    r.status === 'pending' &&
    new Date(r.expires_at).getTime() > now
  );
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
  try {
    if (await shouldUseBackend()) {
      const records = await api.get('contact_tracking', { status: 'pending' });
      const map = {};
      records.forEach(r => {
        map[r.customer_id] = r;
      });
      return map;
    }
  } catch (error) {
    console.warn('Backend fetch failed, using localStorage:', error.message);
  }

  // Fallback to localStorage
  const data = loadFromStorage();
  const now = Date.now();
  const map = {};
  data.forEach(r => {
    if (r.status === 'pending' && new Date(r.expires_at).getTime() > now) {
      map[r.customer_id] = r;
    }
  });
  return map;
}

/**
 * Mark customer as returned (outcome tracking)
 * @param {string} customerId - Customer doc/ID
 * @param {Date} returnDate - Date of return visit
 * @param {number} revenue - Revenue from return visit
 * @returns {Promise<number>} Number of records updated
 */
export async function markCustomerReturned(customerId, returnDate, revenue = 0) {
  try {
    if (await shouldUseBackend()) {
      const result = await api.rpc('mark_customer_returned', {
        p_customer_id: customerId,
        p_return_date: returnDate.toISOString(),
        p_revenue: revenue
      });
      return result;
    }
  } catch (error) {
    console.warn('Backend update failed, using localStorage:', error.message);
  }

  // Fallback to localStorage
  const data = loadFromStorage();
  let updated = 0;

  data.forEach(r => {
    if (
      r.customer_id === customerId &&
      r.status === 'pending' &&
      new Date(r.contacted_at) < returnDate
    ) {
      r.status = 'returned';
      r.returned_at = returnDate.toISOString();
      r.days_to_return = Math.floor(
        (returnDate - new Date(r.contacted_at)) / (24 * 60 * 60 * 1000)
      );
      r.return_revenue = (r.return_revenue || 0) + revenue;
      updated++;
    }
  });

  if (updated > 0) {
    saveToStorage(data);
    window.dispatchEvent(new CustomEvent('contactTrackingUpdate', {
      detail: { action: 'returned', customerId }
    }));
  }

  return updated;
}

/**
 * Clear contact status (manual unmark)
 * @param {string} customerId - Customer doc/ID
 * @returns {Promise<boolean>} Success
 */
export async function clearContactStatus(customerId) {
  try {
    if (await shouldUseBackend()) {
      await api.patch('contact_tracking', {
        status: 'cleared'
      }, {
        customer_id: customerId,
        status: 'pending'
      });
      return true;
    }
  } catch (error) {
    console.warn('Backend update failed, using localStorage:', error.message);
  }

  // Fallback to localStorage
  const data = loadFromStorage();
  let found = false;

  data.forEach(r => {
    if (r.customer_id === customerId && r.status === 'pending') {
      r.status = 'cleared';
      found = true;
    }
  });

  if (found) {
    saveToStorage(data);
    window.dispatchEvent(new CustomEvent('contactTrackingUpdate', {
      detail: { action: 'cleared', customerId }
    }));
  }

  return found;
}

/**
 * Expire old contacts (called periodically)
 * @returns {Promise<number>} Number of records expired
 */
export async function expireOldContacts() {
  try {
    if (await shouldUseBackend()) {
      return await api.rpc('expire_old_contacts');
    }
  } catch (error) {
    console.warn('Backend expire failed, using localStorage:', error.message);
  }

  // Fallback to localStorage
  const data = loadFromStorage();
  const now = Date.now();
  let expired = 0;

  data.forEach(r => {
    if (r.status === 'pending' && new Date(r.expires_at).getTime() < now) {
      r.status = 'expired';
      expired++;
    }
  });

  if (expired > 0) {
    saveToStorage(data);
  }

  return expired;
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
  const { days = 30, campaignId = null } = options;
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    if (await shouldUseBackend()) {
      // Use the view for aggregated metrics
      const params = {};
      if (campaignId) {
        params.campaign_id = campaignId;
      }

      const [campaignMetrics, summaryMetrics] = await Promise.all([
        api.get('campaign_effectiveness', params),
        api.get('contact_effectiveness_summary')
      ]);

      return {
        byCampaign: campaignMetrics,
        byMethod: summaryMetrics,
        summary: calculateSummary(campaignMetrics, summaryMetrics)
      };
    }
  } catch (error) {
    console.warn('Backend metrics failed, using localStorage:', error.message);
  }

  // Fallback to localStorage calculation
  return calculateLocalMetrics(cutoffDate, campaignId);
}

/**
 * Calculate metrics from localStorage data
 */
function calculateLocalMetrics(cutoffDate, campaignId = null) {
  const data = loadFromStorage();

  // Filter by date and optionally campaign
  const filtered = data.filter(r => {
    const contactDate = new Date(r.contacted_at);
    if (contactDate < cutoffDate) return false;
    if (campaignId && r.campaign_id !== campaignId) return false;
    return true;
  });

  // Group by campaign
  const byCampaign = {};
  const byMethod = {};

  filtered.forEach(r => {
    // By campaign
    const campKey = r.campaign_id || 'manual';
    if (!byCampaign[campKey]) {
      byCampaign[campKey] = {
        campaign_id: r.campaign_id,
        campaign_name: r.campaign_name || 'Contato Manual',
        total_contacts: 0,
        returned_count: 0,
        expired_count: 0,
        pending_count: 0,
        cleared_count: 0,
        total_return_revenue: 0,
        days_to_return_sum: 0
      };
    }
    byCampaign[campKey].total_contacts++;
    byCampaign[campKey][`${r.status}_count`]++;
    if (r.status === 'returned') {
      byCampaign[campKey].total_return_revenue += r.return_revenue || 0;
      byCampaign[campKey].days_to_return_sum += r.days_to_return || 0;
    }

    // By method
    const method = r.contact_method || 'unknown';
    const source = r.campaign_id ? 'campaign' : 'manual';
    const methodKey = `${method}_${source}`;
    if (!byMethod[methodKey]) {
      byMethod[methodKey] = {
        method,
        source,
        total_contacts: 0,
        returned_count: 0,
        total_revenue: 0
      };
    }
    byMethod[methodKey].total_contacts++;
    if (r.status === 'returned') {
      byMethod[methodKey].returned_count++;
      byMethod[methodKey].total_revenue += r.return_revenue || 0;
    }
  });

  // Calculate rates
  Object.values(byCampaign).forEach(c => {
    c.return_rate = c.total_contacts > 0
      ? Math.round(100 * c.returned_count / c.total_contacts * 10) / 10
      : 0;
    c.avg_days_to_return = c.returned_count > 0
      ? Math.round(c.days_to_return_sum / c.returned_count * 10) / 10
      : null;
  });

  Object.values(byMethod).forEach(m => {
    m.return_rate = m.total_contacts > 0
      ? Math.round(100 * m.returned_count / m.total_contacts * 10) / 10
      : 0;
  });

  const campaignMetrics = Object.values(byCampaign);
  const methodMetrics = Object.values(byMethod);

  return {
    byCampaign: campaignMetrics,
    byMethod: methodMetrics,
    summary: calculateSummary(campaignMetrics, methodMetrics)
  };
}

/**
 * Calculate summary metrics from campaign and method data
 */
function calculateSummary(byCampaign, byMethod) {
  const totalContacts = byCampaign.reduce((sum, c) => sum + (c.total_contacts || 0), 0);
  const totalReturned = byCampaign.reduce((sum, c) => sum + (c.returned_count || 0), 0);
  const totalRevenue = byCampaign.reduce((sum, c) => sum + (c.total_return_revenue || 0), 0);
  const totalPending = byCampaign.reduce((sum, c) => sum + (c.pending_count || 0), 0);

  // Calculate average days to return (weighted)
  let totalDays = 0;
  let returnedWithDays = 0;
  byCampaign.forEach(c => {
    if (c.avg_days_to_return && c.returned_count) {
      totalDays += c.avg_days_to_return * c.returned_count;
      returnedWithDays += c.returned_count;
    }
  });

  // Method comparison
  const callMetrics = byMethod.filter(m => m.method === 'call');
  const whatsappMetrics = byMethod.filter(m => m.method === 'whatsapp');

  const callTotal = callMetrics.reduce((sum, m) => sum + m.total_contacts, 0);
  const callReturned = callMetrics.reduce((sum, m) => sum + m.returned_count, 0);
  const whatsappTotal = whatsappMetrics.reduce((sum, m) => sum + m.total_contacts, 0);
  const whatsappReturned = whatsappMetrics.reduce((sum, m) => sum + m.returned_count, 0);

  return {
    totalContacts,
    totalReturned,
    totalPending,
    returnRate: totalContacts > 0
      ? Math.round(100 * totalReturned / totalContacts * 10) / 10
      : 0,
    totalRevenue,
    avgDaysToReturn: returnedWithDays > 0
      ? Math.round(totalDays / returnedWithDays * 10) / 10
      : null,
    methodComparison: {
      call: {
        total: callTotal,
        returned: callReturned,
        rate: callTotal > 0 ? Math.round(100 * callReturned / callTotal * 10) / 10 : 0
      },
      whatsapp: {
        total: whatsappTotal,
        returned: whatsappReturned,
        rate: whatsappTotal > 0 ? Math.round(100 * whatsappReturned / whatsappTotal * 10) / 10 : 0
      }
    }
  };
}

// ==================== AUTO-DETECT RETURNS ====================

/**
 * Process customer data to auto-detect returns
 * Call this when new transaction data is loaded
 * @param {Array} customers - Customer data with lastVisit dates
 * @returns {Promise<Object>} Results of auto-detection
 */
export async function autoDetectReturns(customers) {
  if (!customers || customers.length === 0) {
    return { checked: 0, updated: 0 };
  }

  // Get all pending contacts
  const pendingMap = await getAllPendingContacts();
  const pendingIds = Object.keys(pendingMap);

  if (pendingIds.length === 0) {
    return { checked: 0, updated: 0 };
  }

  let updated = 0;

  // Check each pending contact against customer data
  for (const customerId of pendingIds) {
    const contact = pendingMap[customerId];
    const customer = customers.find(c => c.doc === customerId);

    if (!customer) continue;

    // Check if customer has visited after being contacted
    const contactDate = new Date(contact.contacted_at);
    const lastVisit = customer.lastVisit instanceof Date
      ? customer.lastVisit
      : new Date(customer.lastVisit);

    if (lastVisit > contactDate) {
      // Customer returned! Calculate revenue from recent visits
      const returnRevenue = customer.recentRevenue || customer.netTotal / (customer.transactions || 1);

      await markCustomerReturned(customerId, lastVisit, returnRevenue);
      updated++;
    }
  }

  // Also expire any old contacts
  await expireOldContacts();

  return {
    checked: pendingIds.length,
    updated
  };
}

// ==================== CONTACT HISTORY ====================

/**
 * Get contact history for a customer
 * @param {string} customerId - Customer doc/ID
 * @param {number} [limit=10] - Max records to return
 * @returns {Promise<Array>} Contact history
 */
export async function getContactHistory(customerId, limit = 10) {
  try {
    if (await shouldUseBackend()) {
      return await api.get('contact_tracking', {
        customer_id: customerId,
        order: 'contacted_at.desc',
        limit
      });
    }
  } catch (error) {
    console.warn('Backend fetch failed, using localStorage:', error.message);
  }

  // Fallback to localStorage
  const data = loadFromStorage();
  return data
    .filter(r => r.customer_id === customerId)
    .sort((a, b) => new Date(b.contacted_at) - new Date(a.contacted_at))
    .slice(0, limit);
}

// Export for testing
export const __testing = {
  loadFromStorage,
  saveToStorage,
  calculateLocalMetrics,
  calculateSummary
};
