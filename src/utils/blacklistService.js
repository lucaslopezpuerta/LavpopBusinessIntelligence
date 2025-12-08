// blacklistService.js v1.0
// WhatsApp blacklist management service
// Integrates with Twilio API for automatic opt-out and undelivered detection
//
// CHANGELOG:
// v1.0 (2025-12-08): Initial implementation
//   - Syncs with Twilio message logs via Netlify function
//   - Detects opt-outs and undelivered/blocked numbers
//   - Local storage persistence with customer name merging
//   - Manual add/remove capabilities

// Note: phoneUtils normalizePhone not used here - we have our own normalization for blacklist format

const TWILIO_FUNCTION_URL = '/.netlify/functions/twilio-whatsapp';
const BLACKLIST_STORAGE_KEY = 'lavpop_blacklist';
const BLACKLIST_SYNC_KEY = 'lavpop_blacklist_last_sync';

// ==================== PHONE NORMALIZATION ====================

/**
 * Normalize phone number for blacklist storage
 * Handles various Brazilian formats: +55, 55, DDD+number
 * @param {string} phone - Phone number in any format
 * @returns {string|null} Normalized phone (+55XXXXXXXXXXX) or null if invalid
 */
export function normalizeBlacklistPhone(phone) {
  if (!phone) return null;

  // Remove whatsapp: prefix if present
  const withoutPrefix = (phone || '').replace(/^whatsapp:/, '');
  const d = withoutPrefix.replace(/\D/g, '');

  // 13 digits starting with 55: already full format
  if (d.length === 13 && d.startsWith('55')) {
    return '+55' + d.slice(2);
  }

  // 11 digits: DDD (2) + 9 + number (8) = local mobile
  if (d.length === 11) {
    return '+55' + d;
  }

  // 10 digits: DDD (2) + number (8) = old format, add 9
  if (d.length === 10) {
    return '+55' + d.substring(0, 2) + '9' + d.substring(2);
  }

  // 12 digits starting with 55: missing the 9
  if (d.length === 12 && d.startsWith('55')) {
    return '+55' + d.substring(2, 4) + '9' + d.substring(4);
  }

  return null;
}

// ==================== BLACKLIST STORAGE ====================

/**
 * Get blacklist from localStorage
 * @returns {Map<string, object>} Map of phone -> { name, reason, addedAt, source }
 */
export function getBlacklist() {
  try {
    const stored = localStorage.getItem(BLACKLIST_STORAGE_KEY);
    if (!stored) return new Map();

    const entries = JSON.parse(stored);
    return new Map(entries);
  } catch {
    return new Map();
  }
}

/**
 * Save blacklist to localStorage
 * @param {Map<string, object>} blacklist - Blacklist map
 */
function saveBlacklist(blacklist) {
  try {
    const entries = Array.from(blacklist.entries());
    localStorage.setItem(BLACKLIST_STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('Failed to save blacklist:', error);
  }
}

/**
 * Get blacklist as array for UI display
 * @returns {Array<object>} Sorted array of blacklist entries
 */
export function getBlacklistArray() {
  const blacklist = getBlacklist();
  const entries = [];

  blacklist.forEach((value, phone) => {
    entries.push({
      phone,
      name: value.name || '',
      reason: value.reason || '',
      addedAt: value.addedAt || '',
      source: value.source || 'manual'
    });
  });

  // Sort by reason (opt-out first, then undelivered, then manual)
  const reasonOrder = { 'opt-out': 0, 'number-blocked': 1, 'undelivered': 2, 'manual': 3 };
  entries.sort((a, b) => {
    const orderA = reasonOrder[a.reason] ?? 99;
    const orderB = reasonOrder[b.reason] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return (a.name || '').localeCompare(b.name || '');
  });

  return entries;
}

/**
 * Check if a phone number is blacklisted
 * @param {string} phone - Phone number to check
 * @returns {boolean} True if blacklisted
 */
export function isBlacklisted(phone) {
  const normalized = normalizeBlacklistPhone(phone);
  if (!normalized) return false;

  const blacklist = getBlacklist();
  return blacklist.has(normalized);
}

/**
 * Add a phone to the blacklist
 * @param {string} phone - Phone number
 * @param {object} data - { name, reason, source }
 * @returns {boolean} Success
 */
export function addToBlacklist(phone, data = {}) {
  const normalized = normalizeBlacklistPhone(phone);
  if (!normalized) return false;

  const blacklist = getBlacklist();
  const existing = blacklist.get(normalized) || {};

  blacklist.set(normalized, {
    name: data.name || existing.name || '',
    reason: data.reason || existing.reason || 'manual',
    addedAt: existing.addedAt || new Date().toISOString(),
    source: data.source || existing.source || 'manual',
    updatedAt: new Date().toISOString()
  });

  saveBlacklist(blacklist);
  return true;
}

/**
 * Remove a phone from the blacklist
 * @param {string} phone - Phone number
 * @returns {boolean} Success
 */
export function removeFromBlacklist(phone) {
  const normalized = normalizeBlacklistPhone(phone);
  if (!normalized) return false;

  const blacklist = getBlacklist();
  const deleted = blacklist.delete(normalized);

  if (deleted) {
    saveBlacklist(blacklist);
  }

  return deleted;
}

/**
 * Clear entire blacklist
 */
export function clearBlacklist() {
  localStorage.removeItem(BLACKLIST_STORAGE_KEY);
  localStorage.removeItem(BLACKLIST_SYNC_KEY);
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
 * Fetch message logs from Twilio and update blacklist
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
        headers: { 'Content-Type': 'application/json' },
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

    // Process opt-outs
    const blacklist = getBlacklist();
    const beforeCount = blacklist.size;

    for (const entry of allOptOuts) {
      const normalized = normalizeBlacklistPhone(entry.phone);
      if (!normalized) continue;

      if (!blacklist.has(normalized)) {
        results.newOptOuts++;
      }

      blacklist.set(normalized, {
        name: customerMap[normalized] || blacklist.get(normalized)?.name || '',
        reason: 'opt-out',
        addedAt: entry.dateSent || new Date().toISOString(),
        source: 'twilio-sync',
        messageSid: entry.messageSid,
        originalMessage: entry.body?.substring(0, 100)
      });
    }

    // Process undelivered
    for (const entry of allUndelivered) {
      const normalized = normalizeBlacklistPhone(entry.phone);
      if (!normalized) continue;

      // Only add if not already in blacklist (opt-out takes priority)
      if (!blacklist.has(normalized)) {
        results.newUndelivered++;
        blacklist.set(normalized, {
          name: customerMap[normalized] || '',
          reason: entry.reason || 'undelivered',
          addedAt: entry.dateSent || new Date().toISOString(),
          source: 'twilio-sync',
          errorCode: entry.errorCode,
          errorMessage: entry.errorMessage
        });
      }
    }

    // Save updated blacklist
    saveBlacklist(blacklist);

    // Update last sync time
    localStorage.setItem(BLACKLIST_SYNC_KEY, new Date().toISOString());

    results.success = true;
    results.totalInBlacklist = blacklist.size;
    results.newEntries = blacklist.size - beforeCount;

    console.log(`Blacklist sync complete: ${results.newOptOuts} opt-outs, ${results.newUndelivered} undelivered`);

  } catch (error) {
    console.error('Blacklist sync error:', error);
    results.errors.push(error.message);
  }

  return results;
}

// ==================== CAMPAIGN FILTERING ====================

/**
 * Filter recipients to exclude blacklisted numbers
 * @param {Array<object>} recipients - Array of { phone, name, ... }
 * @returns {object} { allowed, blocked, stats }
 */
export function filterBlacklistedRecipients(recipients) {
  const blacklist = getBlacklist();
  const allowed = [];
  const blocked = [];

  for (const recipient of recipients) {
    const normalized = normalizeBlacklistPhone(recipient.phone);

    if (!normalized) {
      // Invalid phone - handled separately by phone validation
      continue;
    }

    const blacklistEntry = blacklist.get(normalized);
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
    const normalized = normalizeBlacklistPhone(customer.phone);
    if (normalized && customer.name) {
      nameMap[normalized] = customer.name;
    }
  }

  return nameMap;
}

// ==================== IMPORT/EXPORT ====================

/**
 * Export blacklist as CSV
 * @returns {string} CSV content
 */
export function exportBlacklistCSV() {
  const entries = getBlacklistArray();
  const lines = ['client name,phone number,reason'];

  for (const entry of entries) {
    // Escape CSV fields
    const name = (entry.name || '').replace(/"/g, '""');
    lines.push(`"${name}",${entry.phone},${entry.reason}`);
  }

  return lines.join('\n');
}

/**
 * Import blacklist from CSV
 * @param {string} csvContent - CSV content
 * @param {boolean} merge - If true, merge with existing; if false, replace
 * @returns {object} Import results
 */
export function importBlacklistCSV(csvContent, merge = true) {
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

    // Skip header
    const blacklist = merge ? getBlacklist() : new Map();

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

      blacklist.set(normalized, {
        name: name?.trim() || '',
        reason: reason?.trim() || 'imported',
        addedAt: new Date().toISOString(),
        source: 'csv-import'
      });

      results.imported++;
    }

    saveBlacklist(blacklist);
    results.totalInBlacklist = blacklist.size;

  } catch (error) {
    results.errors.push(error.message);
  }

  return results;
}

// ==================== STATS ====================

/**
 * Get blacklist statistics
 * @returns {object} Stats summary
 */
export function getBlacklistStats() {
  const entries = getBlacklistArray();

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
