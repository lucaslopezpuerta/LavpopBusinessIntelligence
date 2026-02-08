// blacklistService.js v3.1
// WhatsApp blacklist management service
// Integrates with Twilio API for automatic opt-out and undelivered detection
// Backend-only storage (Supabase) - no localStorage for data
//
// CHANGELOG:
// v3.1 (2025-12-19): Fixed customer name mapping for blacklist sync
//   - buildCustomerNameMap now handles both naming conventions:
//     - Supabase format: Telefone, Nome (from loadCustomersFromSupabase)
//     - Generic format: phone, name
//   - Fixes issue where customer names weren't linked to blacklist entries
// v3.0 (2025-12-12): Removed localStorage data storage - backend only
//   - All blacklist data now stored exclusively in Supabase
//   - Removed localStorage fallbacks for data operations
//   - Only localStorage used is for last sync timestamp (UI helper)
//   - All public functions are now async
// v2.1 (2025-12-12): Fixed Twilio sync not saving to Supabase backend
//   - syncWithTwilio now uses addToBlacklistAsync to save to backend
//   - Previously only saved to localStorage, making sync appear broken
//   - Pre-fetches existing blacklist to avoid duplicates
// v2.0 (2025-12-08): Added Supabase backend support
//   - Primary storage in Supabase database
//   - Falls back to localStorage when backend unavailable
//   - Async-aware API for backend operations
// v1.1 (2025-12-08): Consolidated phone normalization
// v1.0 (2025-12-08): Initial implementation

import { normalizePhone } from './phoneUtils';
import { api, getHeaders } from './apiService';

const TWILIO_FUNCTION_URL = '/.netlify/functions/twilio-whatsapp';
const BLACKLIST_SYNC_KEY = 'lavpop_blacklist_last_sync';

// Re-export normalizePhone as normalizeBlacklistPhone for backwards compatibility
export const normalizeBlacklistPhone = normalizePhone;

// ==================== BLACKLIST STORAGE (BACKEND ONLY) ====================

/**
 * Get blacklist as array for UI display (from backend)
 * @returns {Promise<Array<object>>} Sorted array of blacklist entries
 */
export async function getBlacklistArray() {
  try {
    const entries = await api.blacklist.getAll();

    // Transform to UI format and sort
    const formatted = entries.map(e => ({
      phone: e.phone,
      name: e.customer_name || '',
      reason: e.reason || '',
      addedAt: e.added_at || '',
      source: e.source || 'manual'
    }));

    // Sort by reason (opt-out first, then undelivered, then manual)
    const reasonOrder = { 'opt-out': 0, 'number-blocked': 1, 'undelivered': 2, 'manual': 3 };
    formatted.sort((a, b) => {
      const orderA = reasonOrder[a.reason] ?? 99;
      const orderB = reasonOrder[b.reason] ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return (a.name || '').localeCompare(b.name || '');
    });

    return formatted;
  } catch (error) {
    console.error('Failed to get blacklist from backend:', error);
    return [];
  }
}

/**
 * Check if a phone number is blacklisted (async - from backend)
 * @param {string} phone - Phone number to check
 * @returns {Promise<boolean>} True if blacklisted
 */
export async function isBlacklisted(phone) {
  const normalized = normalizeBlacklistPhone(phone);
  if (!normalized) return false;

  try {
    return await api.blacklist.check(normalized);
  } catch (error) {
    console.error('Failed to check blacklist:', error);
    return false;
  }
}

/**
 * Add a phone to the blacklist (async - to backend)
 * @param {string} phone - Phone number
 * @param {object} data - { name, reason, source }
 * @returns {Promise<boolean>} Success
 */
export async function addToBlacklist(phone, data = {}) {
  const normalized = normalizeBlacklistPhone(phone);
  if (!normalized) return false;

  try {
    await api.blacklist.add(normalized, {
      customer_name: data.name,
      reason: data.reason || 'manual',
      source: data.source || 'manual',
      error_code: data.errorCode
    });
    return true;
  } catch (error) {
    console.error('Failed to add to blacklist:', error);
    return false;
  }
}

/**
 * Remove a phone from the blacklist (async - from backend)
 * @param {string} phone - Phone number
 * @returns {Promise<boolean>} Success
 */
export async function removeFromBlacklist(phone) {
  const normalized = normalizeBlacklistPhone(phone);
  if (!normalized) return false;

  try {
    await api.blacklist.remove(normalized);
    return true;
  } catch (error) {
    console.error('Failed to remove from blacklist:', error);
    return false;
  }
}

/**
 * Clear entire blacklist (async - from backend)
 * @returns {Promise<boolean>} Success
 */
export async function clearBlacklist() {
  localStorage.removeItem(BLACKLIST_SYNC_KEY);
  try {
    await api.blacklist.clear();
    return true;
  } catch (error) {
    console.error('Failed to clear blacklist:', error);
    return false;
  }
}

// ==================== TWILIO SYNC ====================

/**
 * Get last sync timestamp
 * @returns {string|null} ISO date string or null
 */
export function getLastSyncTime() {
  return localStorage.getItem(BLACKLIST_SYNC_KEY);
}

/**
 * Fetch message logs from Twilio and update blacklist (backend only)
 * @param {object} options - { dateSentAfter, customerMap }
 * @returns {Promise<object>} Sync results
 */
export async function syncWithTwilio(options = {}) {
  const { dateSentAfter, customerMap = {} } = options;

  // Default to last sync time or 30 days ago
  const lastSync = getLastSyncTime();
  const startDate = dateSentAfter || lastSync ||
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const results = {
    success: false,
    newOptOuts: 0,
    newUndelivered: 0,
    totalProcessed: 0,
    errors: []
  };

  try {
    let hasMore = true;
    let pageToken = null;
    let allOptOuts = [];
    let allUndelivered = [];

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

      // Collect candidates
      allOptOuts.push(...(data.blacklistCandidates?.optOuts || []));
      allUndelivered.push(...(data.blacklistCandidates?.undelivered || []));
      results.totalProcessed += data.summary?.totalFetched || 0;

      // Check for more pages
      hasMore = data.pagination?.hasMore || false;
      pageToken = data.pagination?.nextPageToken;

      // Safety limit: max 10 pages (5000 messages)
      if (results.totalProcessed >= 5000) {
        console.warn('Reached message fetch limit (5000)');
        break;
      }
    }

    // Fetch existing blacklist from backend to check for duplicates
    let existingPhones = new Set();
    try {
      const existingEntries = await getBlacklistArray();
      existingPhones = new Set(existingEntries.map(e => e.phone));
    } catch (err) {
      console.warn('Could not fetch existing blacklist, will add all entries:', err.message);
    }

    // Process opt-outs
    for (const entry of allOptOuts) {
      const normalized = normalizeBlacklistPhone(entry.phone);
      if (!normalized) continue;

      const isNew = !existingPhones.has(normalized);
      if (isNew) {
        results.newOptOuts++;

        const entryData = {
          name: customerMap[normalized] || '',
          reason: 'opt-out',
          addedAt: entry.dateSent || new Date().toISOString(),
          source: 'twilio-sync',
          messageSid: entry.messageSid,
          originalMessage: entry.body?.substring(0, 100)
        };

        await addToBlacklist(normalized, entryData);
        existingPhones.add(normalized); // Track as processed
      }
    }

    // Process undelivered
    for (const entry of allUndelivered) {
      const normalized = normalizeBlacklistPhone(entry.phone);
      if (!normalized) continue;

      // Only add if not already in blacklist (opt-out takes priority)
      const isNew = !existingPhones.has(normalized);
      if (isNew) {
        results.newUndelivered++;

        const entryData = {
          name: customerMap[normalized] || '',
          reason: entry.reason || 'undelivered',
          addedAt: entry.dateSent || new Date().toISOString(),
          source: 'twilio-sync',
          errorCode: entry.errorCode,
          errorMessage: entry.errorMessage
        };

        await addToBlacklist(normalized, entryData);
        existingPhones.add(normalized); // Track as processed
      }
    }

    // Update last sync time
    localStorage.setItem(BLACKLIST_SYNC_KEY, new Date().toISOString());

    results.success = true;
    results.totalInBlacklist = existingPhones.size;
    results.newEntries = results.newOptOuts + results.newUndelivered;

    // Blacklist sync complete

  } catch (error) {
    console.error('Blacklist sync error:', error);
    results.errors.push(error.message);
  }

  return results;
}

// ==================== CAMPAIGN FILTERING ====================

/**
 * Filter recipients to exclude blacklisted numbers (async - from backend)
 * @param {Array<object>} recipients - Array of { phone, name, ... }
 * @returns {Promise<object>} { allowed, blocked, stats }
 */
export async function filterBlacklistedRecipients(recipients) {
  // Build a map from backend blacklist for quick lookup
  const blacklistEntries = await getBlacklistArray();
  const blacklistMap = new Map(blacklistEntries.map(e => [e.phone, e]));

  const allowed = [];
  const blocked = [];

  for (const recipient of recipients) {
    const normalized = normalizeBlacklistPhone(recipient.phone);

    if (!normalized) {
      // Invalid phone - handled separately by phone validation
      continue;
    }

    const blacklistEntry = blacklistMap.get(normalized);
    if (blacklistEntry) {
      blocked.push({
        ...recipient,
        normalizedPhone: normalized,
        blacklistReason: blacklistEntry.reason
      });
    } else {
      allowed.push({
        ...recipient,
        normalizedPhone: normalized
      });
    }
  }

  return {
    allowed,
    blocked,
    stats: {
      total: recipients.length,
      allowedCount: allowed.length,
      blockedCount: blocked.length,
      blockedByOptOut: blocked.filter(b => b.blacklistReason === 'opt-out').length,
      blockedByUndelivered: blocked.filter(b => ['undelivered', 'number-blocked'].includes(b.blacklistReason)).length
    }
  };
}

/**
 * Build customer name map from RFM/customer data
 * Used to enrich blacklist entries with customer names
 * @param {Array<object>} customers - Customer array with phone and name
 * @returns {object} Map of normalized phone -> name
 */
export function buildCustomerNameMap(customers) {
  const nameMap = {};

  for (const customer of customers || []) {
    // Support both naming conventions:
    // - CSV/Supabase format: Telefone, Nome (from loadCustomersFromSupabase)
    // - Generic format: phone, name
    const phone = customer.Telefone || customer.telefone || customer.phone || customer['phone number'];
    const name = customer.Nome || customer.nome || customer.name || customer['client name'];

    const normalized = normalizeBlacklistPhone(phone);
    if (normalized && name) {
      nameMap[normalized] = name;
    }
  }

  return nameMap;
}

// ==================== IMPORT/EXPORT ====================

/**
 * Export blacklist as CSV (async - from backend)
 * @returns {Promise<string>} CSV content
 */
export async function exportBlacklistCSV() {
  const entries = await getBlacklistArray();
  const lines = ['client name,phone number,reason'];

  for (const entry of entries) {
    // Escape CSV fields
    const name = (entry.name || '').replace(/"/g, '""');
    lines.push(`"${name}",${entry.phone},${entry.reason}`);
  }

  return lines.join('\n');
}

/**
 * Import blacklist from CSV (async - to backend)
 * @param {string} csvContent - CSV content
 * @param {boolean} merge - If true, merge with existing; if false, replace
 * @returns {Promise<object>} Import results
 */
export async function importBlacklistCSV(csvContent, merge = true) {
  const results = {
    imported: 0,
    skipped: 0,
    errors: []
  };

  try {
    const lines = csvContent.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) {
      results.errors.push('CSV must have header and at least one data row');
      return results;
    }

    // If not merging, clear existing blacklist first
    if (!merge) {
      await clearBlacklist();
    }

    // Get existing entries to avoid duplicates when merging
    let existingPhones = new Set();
    if (merge) {
      const existing = await getBlacklistArray();
      existingPhones = new Set(existing.map(e => e.phone));
    }

    // Parse and import each line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Simple CSV parsing (handles quoted fields)
      const match = line.match(/^"?([^",]*)"?,\s*([^,]+),\s*(.*)$/);

      if (!match) {
        results.skipped++;
        continue;
      }

      const [, name, phone, reason] = match;
      const normalized = normalizeBlacklistPhone(phone);

      if (!normalized) {
        results.skipped++;
        continue;
      }

      // Skip if already exists when merging
      if (merge && existingPhones.has(normalized)) {
        results.skipped++;
        continue;
      }

      await addToBlacklist(normalized, {
        name: name?.trim() || '',
        reason: reason?.trim() || 'csv-import',
        source: 'csv-import'
      });

      existingPhones.add(normalized);
      results.imported++;
    }

    results.totalInBlacklist = existingPhones.size;

  } catch (error) {
    results.errors.push(error.message);
  }

  return results;
}

// ==================== STATS ====================

/**
 * Get blacklist statistics (async - from backend)
 * @returns {Promise<object>} Stats summary
 */
export async function getBlacklistStats() {
  const entries = await getBlacklistArray();

  return {
    total: entries.length,
    byReason: {
      optOut: entries.filter(e => e.reason === 'opt-out').length,
      undelivered: entries.filter(e => e.reason === 'undelivered').length,
      numberBlocked: entries.filter(e => e.reason === 'number-blocked').length,
      manual: entries.filter(e => e.reason === 'manual').length,
      other: entries.filter(e => !['opt-out', 'undelivered', 'number-blocked', 'manual'].includes(e.reason)).length
    },
    bySource: {
      twilioSync: entries.filter(e => e.source === 'twilio-sync').length,
      manual: entries.filter(e => e.source === 'manual').length,
      csvImport: entries.filter(e => e.source === 'csv-import').length
    },
    lastSync: getLastSyncTime()
  };
}

// ==================== BACKWARDS COMPATIBILITY ALIASES ====================
// These aliases maintain backwards compatibility with code using the old *Async naming

/**
 * @deprecated Use getBlacklistArray() instead
 */
export const getBlacklistAsync = getBlacklistArray;

/**
 * @deprecated Use addToBlacklist() instead
 */
export const addToBlacklistAsync = addToBlacklist;

/**
 * @deprecated Use removeFromBlacklist() instead
 */
export const removeFromBlacklistAsync = removeFromBlacklist;

/**
 * @deprecated Use isBlacklisted() instead
 */
export const isBlacklistedAsync = isBlacklisted;

/**
 * @deprecated Use getBlacklistStats() instead
 */
export const getBlacklistStatsAsync = getBlacklistStats;

/**
 * @deprecated Use importBlacklistCSV() instead
 */
export const importBlacklistAsync = async (entries, merge = true) => {
  // Convert array format to CSV and use importBlacklistCSV
  const csvLines = ['client name,phone number,reason'];
  for (const e of entries) {
    const name = (e.name || e.customer_name || '').replace(/"/g, '""');
    csvLines.push(`"${name}",${e.phone},${e.reason || 'imported'}`);
  }
  return importBlacklistCSV(csvLines.join('\n'), merge);
};
