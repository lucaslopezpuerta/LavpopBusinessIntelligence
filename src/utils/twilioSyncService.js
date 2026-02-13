// twilioSyncService.js v1.2
// Twilio engagement and cost sync service
// Follows the same database-cached pattern as WABA analytics and blacklistService.js
//
// CHANGELOG:
// v1.2 (2025-12-19): Fixed cost data doubling on each sync
//   - Changed store_costs to use freshLoad: true (replace mode)
//   - Since we fetch complete data each sync, we should replace not add
//   - Previously was using incremental mode (adds to existing), causing data to double
// v1.1 (2025-12-19): Fixed date parsing for Twilio RFC 2822 format
//   - Twilio returns dates like "Fri, 19 Dec 2025 00:12:24 +0000"
//   - Was incorrectly splitting by 'T' (ISO format), resulting in null dateKeys
//   - Now properly parses RFC 2822 dates to YYYY-MM-DD format
// v1.0 (2025-12-19): Initial implementation
//   - Syncs engagement data (positive, opt-out, other) to contact_tracking
//   - Syncs cost data to twilio_daily_costs table
//   - Follows blacklistService.js pattern: fetch from API, store to Supabase
//   - Supports manual trigger and scheduled sync
//
// DATA FLOW:
// 1. User clicks "Atualizar" or scheduler triggers sync
// 2. This service fetches messages from Twilio API
// 3. Data is processed and stored in Supabase:
//    - Engagement: contact_tracking (engagement_type, engaged_at, message_cost)
//    - Costs: twilio_daily_costs (aggregated by day)
// 4. UI reads from Supabase (fast, cached)

import { api, getHeaders } from './apiService';
import { normalizePhone } from './phoneUtils';
import { toBrazilDateString } from './dateUtils';

const TWILIO_FUNCTION_URL = '/.netlify/functions/twilio-whatsapp';

/**
 * Parse Twilio RFC 2822 date format to YYYY-MM-DD
 * Input: "Fri, 19 Dec 2025 00:12:24 +0000"
 * Output: "2025-12-19"
 * @param {string} dateStr - Date string from Twilio API
 * @returns {string|null} - YYYY-MM-DD format or null if invalid
 */
function parseTwilioDate(dateStr) {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return toBrazilDateString(date);
  } catch {
    return null;
  }
}

const TWILIO_SYNC_KEY = 'lavpop_twilio_engagement_last_sync';

// ==================== SYNC TIMESTAMP ====================

/**
 * Get last engagement sync timestamp
 * @returns {string|null} ISO date string or null
 */
export function getLastSyncTime() {
  return localStorage.getItem(TWILIO_SYNC_KEY);
}

/**
 * Set last sync timestamp
 * @param {string} timestamp - ISO date string
 */
function setLastSyncTime(timestamp) {
  localStorage.setItem(TWILIO_SYNC_KEY, timestamp);
}

// ==================== MAIN SYNC FUNCTION ====================

/**
 * Sync engagement and cost data from Twilio to Supabase
 * This is the main function that fetches from Twilio API and stores to database
 *
 * @param {object} options - Sync options
 * @param {string} options.dateSentAfter - Start date (YYYY-MM-DD), defaults to last sync or 30 days ago
 * @param {boolean} options.force - Force full sync even if recently synced
 * @returns {Promise<object>} Sync results
 */
export async function syncEngagementAndCosts(options = {}) {
  const { dateSentAfter, force = false } = options;

  // Check if we should skip (recently synced)
  const lastSync = getLastSyncTime();
  if (!force && lastSync) {
    const hoursSinceSync = (Date.now() - new Date(lastSync).getTime()) / (1000 * 60 * 60);
    if (hoursSinceSync < 1) {
      console.log('Twilio sync skipped: recently synced', hoursSinceSync.toFixed(1), 'hours ago');
      return {
        success: true,
        skipped: true,
        reason: 'Recently synced',
        lastSync
      };
    }
  }

  // Default to last sync time or 30 days ago
  const startDate = dateSentAfter || lastSync?.split('T')[0] ||
    toBrazilDateString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

  const results = {
    success: false,
    engagementsSynced: 0,
    costDaysSynced: 0,
    totalMessagesProcessed: 0,
    errors: []
  };

  try {
    let hasMore = true;
    let pageToken = null;
    let allInboundMessages = [];
    let costByDay = {}; // { 'YYYY-MM-DD': { outbound: { count, cost }, inbound: { count, cost } } }

    // Fetch all pages of messages
    while (hasMore) {
      const response = await fetch(TWILIO_FUNCTION_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          action: 'fetch_messages',
          dateSentAfter: startDate,
          pageSize: 500,
          pageToken
        })
      });

      const data = await response.json();

      if (!response.ok) {
        results.errors.push(data.error || 'Failed to fetch messages');
        break;
      }

      // Collect inbound messages for engagement tracking
      allInboundMessages.push(...(data.blacklistCandidates?.inboundMessages || []));

      // Process all messages for cost aggregation
      for (const msg of data.blacklistCandidates?.allMessages || []) {
        // Parse RFC 2822 date format (e.g., "Fri, 19 Dec 2025 00:12:24 +0000") to YYYY-MM-DD
        const dateKey = parseTwilioDate(msg.dateSent);
        if (!dateKey) continue;

        if (!costByDay[dateKey]) {
          costByDay[dateKey] = {
            outbound: { count: 0, cost: 0 },
            inbound: { count: 0, cost: 0 },
            currency: msg.priceUnit || 'USD'
          };
        }

        const direction = msg.direction?.startsWith('outbound') ? 'outbound' : 'inbound';
        costByDay[dateKey][direction].count++;
        costByDay[dateKey][direction].cost += msg.price || 0;
      }

      results.totalMessagesProcessed += data.summary?.totalFetched || 0;

      // Check for more pages
      hasMore = data.pagination?.hasMore || false;
      pageToken = data.pagination?.nextPageToken;

      // Safety limit: max 10 pages (5000 messages)
      if (results.totalMessagesProcessed >= 5000) {
        console.warn('Reached message fetch limit (5000)');
        break;
      }
    }

    // Store engagement data via Netlify function (which handles Supabase storage)
    if (allInboundMessages.length > 0) {
      const storeResponse = await fetch(TWILIO_FUNCTION_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          action: 'store_engagement',
          engagements: allInboundMessages
        })
      });

      const storeData = await storeResponse.json();
      if (storeResponse.ok) {
        results.engagementsStored = storeData.stored || 0;  // New records from customer lookup
        results.engagementsUpdated = storeData.updated || 0; // Existing records updated
        results.engagementsSynced = (storeData.stored || 0) + (storeData.updated || 0);
        results.engagementsSkipped = storeData.skipped || 0;
      } else {
        results.errors.push(storeData.error || 'Failed to store engagement data');
      }
    }

    // Store cost data via Netlify function
    // Use freshLoad: true since we fetch complete data each sync (not incremental)
    if (Object.keys(costByDay).length > 0) {
      const costResponse = await fetch(TWILIO_FUNCTION_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          action: 'store_costs',
          costsByDay: costByDay,
          freshLoad: true  // Replace existing data for these dates (not add)
        })
      });

      const costData = await costResponse.json();
      if (costResponse.ok) {
        results.costDaysSynced = costData.daysStored || 0;
      } else {
        results.errors.push(costData.error || 'Failed to store cost data');
      }
    }

    // Update last sync time
    setLastSyncTime(new Date().toISOString());

    results.success = results.errors.length === 0;
    results.lastSync = new Date().toISOString();

    console.log(`Twilio sync complete: ${results.engagementsSynced} engagements (${results.engagementsStored || 0} stored, ${results.engagementsUpdated || 0} updated, ${results.engagementsSkipped || 0} skipped), ${results.costDaysSynced} cost days`);

  } catch (error) {
    console.error('Twilio sync error:', error);
    results.errors.push(error.message);
  }

  return results;
}

// ==================== READ FROM DATABASE ====================

/**
 * Get engagement summary from database
 * @param {string} dateFrom - Start date (YYYY-MM-DD)
 * @param {string} dateTo - End date (YYYY-MM-DD)
 * @returns {Promise<object>} Engagement summary
 */
export async function getEngagementSummary(dateFrom, dateTo) {
  try {
    const response = await fetch(TWILIO_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_engagement_summary',
        dateFrom,
        dateTo
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get engagement summary');
    }

    return data;
  } catch (error) {
    console.error('Failed to get engagement summary:', error);
    return {
      positiveCount: 0,
      optOutCount: 0,
      otherCount: 0,
      totalResponses: 0,
      engagements: [],
      lastSync: getLastSyncTime()
    };
  }
}

/**
 * Get cost summary from database
 * @param {string} dateFrom - Start date (YYYY-MM-DD)
 * @param {string} dateTo - End date (YYYY-MM-DD)
 * @returns {Promise<object>} Cost summary
 */
export async function getCostSummary(dateFrom, dateTo) {
  try {
    const response = await fetch(TWILIO_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_cost_summary',
        dateFrom,
        dateTo
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get cost summary');
    }

    return data;
  } catch (error) {
    console.error('Failed to get cost summary:', error);
    return {
      outboundCount: 0,
      outboundCost: 0,
      inboundCount: 0,
      inboundCost: 0,
      totalCost: 0,
      currency: 'USD',
      dailyCosts: [],
      lastSync: getLastSyncTime()
    };
  }
}

/**
 * Get combined engagement and cost data from database
 * This is the main function the UI should use
 * @param {string} dateFrom - Start date (YYYY-MM-DD)
 * @param {string} dateTo - End date (YYYY-MM-DD)
 * @returns {Promise<object>} Combined engagement and cost data
 */
export async function getStoredEngagementAndCosts(dateFrom, dateTo) {
  try {
    const response = await fetch(TWILIO_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_stored_data',
        dateFrom,
        dateTo
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get stored data');
    }

    return {
      ...data,
      lastSync: getLastSyncTime()
    };
  } catch (error) {
    console.error('Failed to get stored engagement and costs:', error);
    return {
      engagements: [],
      optOuts: [],
      inboundMessages: [],
      costSummary: {
        outboundCount: 0,
        outboundCost: 0,
        inboundCount: 0,
        inboundCost: 0,
        currency: 'USD'
      },
      dailyCosts: [],
      lastSync: getLastSyncTime()
    };
  }
}

// ==================== COMBINED SYNC (WITH BLACKLIST) ====================

/**
 * Sync all Twilio data: blacklist + engagement + costs
 * This can be called by a scheduler to keep all data in sync
 * @param {object} options - Sync options
 * @returns {Promise<object>} Combined sync results
 */
export async function syncAllTwilioData(options = {}) {
  // Import blacklistService dynamically to avoid circular deps
  const { syncWithTwilio: syncBlacklist } = await import('./blacklistService');

  const results = {
    blacklist: null,
    engagementAndCosts: null,
    success: true,
    errors: []
  };

  try {
    // Run both syncs in parallel
    const [blacklistResult, engagementResult] = await Promise.all([
      syncBlacklist(options),
      syncEngagementAndCosts(options)
    ]);

    results.blacklist = blacklistResult;
    results.engagementAndCosts = engagementResult;

    // Check for errors
    if (!blacklistResult.success) {
      results.success = false;
      results.errors.push(...(blacklistResult.errors || ['Blacklist sync failed']));
    }
    if (!engagementResult.success && !engagementResult.skipped) {
      results.success = false;
      results.errors.push(...(engagementResult.errors || ['Engagement sync failed']));
    }
  } catch (error) {
    results.success = false;
    results.errors.push(error.message);
  }

  return results;
}

// ==================== EXPORTS ====================

export default {
  getLastSyncTime,
  syncEngagementAndCosts,
  getEngagementSummary,
  getCostSummary,
  getStoredEngagementAndCosts,
  syncAllTwilioData
};
