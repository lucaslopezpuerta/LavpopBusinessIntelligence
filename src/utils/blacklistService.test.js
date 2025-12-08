/**
 * Tests for WhatsApp Blacklist Service
 * @module blacklistService.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  normalizeBlacklistPhone,
  getBlacklist,
  getBlacklistArray,
  isBlacklisted,
  addToBlacklist,
  removeFromBlacklist,
  clearBlacklist,
  filterBlacklistedRecipients,
  buildCustomerNameMap,
  exportBlacklistCSV,
  importBlacklistCSV,
  getBlacklistStats,
  getLastSyncTime
} from './blacklistService';

describe('normalizeBlacklistPhone', () => {
  // normalizeBlacklistPhone is re-exported from phoneUtils
  // These tests verify the integration works correctly

  it('should normalize various Brazilian phone formats', () => {
    expect(normalizeBlacklistPhone('54996923504')).toBe('+5554996923504');
    expect(normalizeBlacklistPhone('+5554996923504')).toBe('+5554996923504');
    expect(normalizeBlacklistPhone('5554996923504')).toBe('+5554996923504');
  });

  it('should handle whatsapp: prefix from Twilio', () => {
    expect(normalizeBlacklistPhone('whatsapp:+5554996923504')).toBe('+5554996923504');
  });

  it('should return null for invalid phones', () => {
    expect(normalizeBlacklistPhone(null)).toBeNull();
    expect(normalizeBlacklistPhone('')).toBeNull();
    expect(normalizeBlacklistPhone('123')).toBeNull();
  });
});

describe('Blacklist Storage', () => {
  beforeEach(() => {
    clearBlacklist();
  });

  describe('getBlacklist', () => {
    it('should return empty Map when no blacklist exists', () => {
      const result = getBlacklist();
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });
  });

  describe('getBlacklistArray', () => {
    it('should return empty array when no blacklist exists', () => {
      const result = getBlacklistArray();
      expect(result).toEqual([]);
    });

    it('should return sorted array of entries', () => {
      addToBlacklist('54996923504', { name: 'Maria', reason: 'manual' });
      addToBlacklist('54996923505', { name: 'João', reason: 'opt-out' });

      const result = getBlacklistArray();
      expect(result).toHaveLength(2);
      // opt-out should come before manual in sort order
      expect(result[0].reason).toBe('opt-out');
      expect(result[1].reason).toBe('manual');
    });
  });

  describe('isBlacklisted', () => {
    it('should return false for phones not in blacklist', () => {
      expect(isBlacklisted('54996923504')).toBe(false);
    });

    it('should return true for blacklisted phones', () => {
      addToBlacklist('54996923504', { reason: 'opt-out' });
      expect(isBlacklisted('54996923504')).toBe(true);
    });

    it('should normalize phone before checking', () => {
      addToBlacklist('54996923504');
      expect(isBlacklisted('+5554996923504')).toBe(true);
      expect(isBlacklisted('5554996923504')).toBe(true);
    });

    it('should return false for invalid phones', () => {
      expect(isBlacklisted(null)).toBe(false);
      expect(isBlacklisted('123')).toBe(false);
    });
  });

  describe('addToBlacklist', () => {
    it('should add phone to blacklist with data', () => {
      const result = addToBlacklist('54996923504', {
        name: 'Maria',
        reason: 'opt-out'
      });

      expect(result).toBe(true);
      expect(isBlacklisted('54996923504')).toBe(true);

      const entries = getBlacklistArray();
      expect(entries[0].name).toBe('Maria');
      expect(entries[0].reason).toBe('opt-out');
    });

    it('should update existing entry, preserving original addedAt', () => {
      addToBlacklist('54996923504', { name: 'Maria', reason: 'manual' });

      const firstEntry = getBlacklistArray()[0];
      const originalAddedAt = firstEntry.addedAt;

      // Update the entry
      addToBlacklist('54996923504', { reason: 'opt-out' });

      const updatedEntry = getBlacklistArray()[0];
      expect(updatedEntry.reason).toBe('opt-out');
      expect(updatedEntry.name).toBe('Maria'); // Name preserved
      expect(updatedEntry.addedAt).toBe(originalAddedAt); // Original date preserved
    });

    it('should return false for invalid phones', () => {
      expect(addToBlacklist('123')).toBe(false);
      expect(addToBlacklist(null)).toBe(false);
    });

    it('should set default reason to manual', () => {
      addToBlacklist('54996923504');
      const entry = getBlacklistArray()[0];
      expect(entry.reason).toBe('manual');
    });
  });

  describe('removeFromBlacklist', () => {
    it('should remove phone from blacklist', () => {
      addToBlacklist('54996923504');
      expect(isBlacklisted('54996923504')).toBe(true);

      const result = removeFromBlacklist('54996923504');
      expect(result).toBe(true);
      expect(isBlacklisted('54996923504')).toBe(false);
    });

    it('should return false if phone was not in blacklist', () => {
      const result = removeFromBlacklist('54996923504');
      expect(result).toBe(false);
    });

    it('should normalize phone before removing', () => {
      addToBlacklist('54996923504');
      const result = removeFromBlacklist('+5554996923504');
      expect(result).toBe(true);
    });
  });

  describe('clearBlacklist', () => {
    it('should remove all entries', () => {
      addToBlacklist('54996923504');
      addToBlacklist('54996923505');
      expect(getBlacklistArray()).toHaveLength(2);

      clearBlacklist();
      expect(getBlacklistArray()).toHaveLength(0);
    });
  });
});

describe('filterBlacklistedRecipients', () => {
  beforeEach(() => {
    clearBlacklist();
    addToBlacklist('54996923504', { reason: 'opt-out' });
    addToBlacklist('54996923505', { reason: 'undelivered' });
  });

  it('should separate allowed and blocked recipients', () => {
    const recipients = [
      { phone: '54996923504', name: 'Maria' }, // blacklisted (opt-out)
      { phone: '54996923505', name: 'João' },  // blacklisted (undelivered)
      { phone: '54996923506', name: 'Ana' }    // allowed
    ];

    const result = filterBlacklistedRecipients(recipients);

    expect(result.allowed).toHaveLength(1);
    expect(result.allowed[0].name).toBe('Ana');

    expect(result.blocked).toHaveLength(2);
    expect(result.blocked.map(b => b.name)).toContain('Maria');
    expect(result.blocked.map(b => b.name)).toContain('João');
  });

  it('should include blacklist reason in blocked recipients', () => {
    const recipients = [
      { phone: '54996923504', name: 'Maria' }
    ];

    const result = filterBlacklistedRecipients(recipients);
    expect(result.blocked[0].blacklistReason).toBe('opt-out');
  });

  it('should calculate correct stats', () => {
    const recipients = [
      { phone: '54996923504', name: 'Maria' },
      { phone: '54996923505', name: 'João' },
      { phone: '54996923506', name: 'Ana' }
    ];

    const result = filterBlacklistedRecipients(recipients);

    expect(result.stats.total).toBe(3);
    expect(result.stats.allowedCount).toBe(1);
    expect(result.stats.blockedCount).toBe(2);
    expect(result.stats.blockedByOptOut).toBe(1);
    expect(result.stats.blockedByUndelivered).toBe(1);
  });

  it('should add normalized phone to results', () => {
    const recipients = [{ phone: '54996923506', name: 'Ana' }];
    const result = filterBlacklistedRecipients(recipients);

    expect(result.allowed[0].normalizedPhone).toBe('+5554996923506');
  });
});

describe('buildCustomerNameMap', () => {
  it('should create map of normalized phone to name', () => {
    const customers = [
      { phone: '54996923504', name: 'Maria' },
      { phone: '54996923505', name: 'João' }
    ];

    const map = buildCustomerNameMap(customers);

    expect(map['+5554996923504']).toBe('Maria');
    expect(map['+5554996923505']).toBe('João');
  });

  it('should skip customers without names', () => {
    const customers = [
      { phone: '54996923504', name: 'Maria' },
      { phone: '54996923505', name: null }
    ];

    const map = buildCustomerNameMap(customers);
    expect(Object.keys(map)).toHaveLength(1);
  });

  it('should skip customers with invalid phones', () => {
    const customers = [
      { phone: '123', name: 'Invalid' },
      { phone: '54996923504', name: 'Valid' }
    ];

    const map = buildCustomerNameMap(customers);
    expect(Object.keys(map)).toHaveLength(1);
  });

  it('should handle empty array', () => {
    const map = buildCustomerNameMap([]);
    expect(map).toEqual({});
  });
});

describe('CSV Import/Export', () => {
  beforeEach(() => {
    clearBlacklist();
  });

  describe('exportBlacklistCSV', () => {
    it('should export blacklist as CSV with headers', () => {
      addToBlacklist('54996923504', { name: 'Maria', reason: 'opt-out' });

      const csv = exportBlacklistCSV();
      const lines = csv.split('\n');

      expect(lines[0]).toBe('client name,phone number,reason');
      expect(lines[1]).toContain('Maria');
      expect(lines[1]).toContain('+5554996923504');
      expect(lines[1]).toContain('opt-out');
    });

    it('should escape quotes in names', () => {
      addToBlacklist('54996923504', { name: 'Maria "Mia"', reason: 'manual' });

      const csv = exportBlacklistCSV();
      expect(csv).toContain('""Mia""');
    });

    it('should handle empty blacklist', () => {
      const csv = exportBlacklistCSV();
      expect(csv).toBe('client name,phone number,reason');
    });
  });

  describe('importBlacklistCSV', () => {
    it('should import valid CSV', () => {
      const csv = `client name,phone number,reason
"Maria",+5554996923504,opt-out
"João",+5554996923505,manual`;

      const result = importBlacklistCSV(csv);

      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(0);
      expect(isBlacklisted('54996923504')).toBe(true);
      expect(isBlacklisted('54996923505')).toBe(true);
    });

    it('should skip invalid phone numbers', () => {
      const csv = `client name,phone number,reason
"Maria",123,manual
"João",+5554996923505,manual`;

      const result = importBlacklistCSV(csv);

      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(1);
    });

    it('should merge with existing when merge=true', () => {
      addToBlacklist('54996923504', { name: 'Existing', reason: 'opt-out' });

      const csv = `client name,phone number,reason
"New",+5554996923505,manual`;

      importBlacklistCSV(csv, true);

      expect(getBlacklistArray()).toHaveLength(2);
    });

    it('should replace existing when merge=false', () => {
      addToBlacklist('54996923504', { name: 'Existing', reason: 'opt-out' });

      const csv = `client name,phone number,reason
"New",+5554996923505,manual`;

      importBlacklistCSV(csv, false);

      expect(getBlacklistArray()).toHaveLength(1);
      expect(isBlacklisted('54996923504')).toBe(false);
    });

    it('should return error for CSV with only header', () => {
      const csv = 'client name,phone number,reason';
      const result = importBlacklistCSV(csv);

      expect(result.errors).toContain('CSV must have header and at least one data row');
    });
  });
});

describe('getBlacklistStats', () => {
  beforeEach(() => {
    clearBlacklist();
  });

  it('should return correct stats for empty blacklist', () => {
    const stats = getBlacklistStats();

    expect(stats.total).toBe(0);
    expect(stats.byReason.optOut).toBe(0);
    expect(stats.byReason.manual).toBe(0);
  });

  it('should count entries by reason', () => {
    addToBlacklist('54996923501', { reason: 'opt-out' });
    addToBlacklist('54996923502', { reason: 'opt-out' });
    addToBlacklist('54996923503', { reason: 'undelivered' });
    addToBlacklist('54996923504', { reason: 'manual' });

    const stats = getBlacklistStats();

    expect(stats.total).toBe(4);
    expect(stats.byReason.optOut).toBe(2);
    expect(stats.byReason.undelivered).toBe(1);
    expect(stats.byReason.manual).toBe(1);
  });
});

describe('getLastSyncTime', () => {
  it('should return null when never synced', () => {
    expect(getLastSyncTime()).toBeNull();
  });
});
