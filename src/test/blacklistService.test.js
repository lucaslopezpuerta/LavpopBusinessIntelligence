/**
 * Tests for WhatsApp Blacklist Service
 * @module blacklistService.test
 *
 * Note: All blacklist functions are async (backed by Supabase API)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  normalizeBlacklistPhone,
  getBlacklistArray,
  isBlacklisted,
  addToBlacklist,
  removeFromBlacklist,
  clearBlacklist,
  buildCustomerNameMap,
  getLastSyncTime
} from '../utils/blacklistService';

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

describe('Blacklist Storage (async API)', () => {
  beforeEach(async () => {
    await clearBlacklist();
  });

  describe('getBlacklistArray', () => {
    it('should return empty array when no blacklist exists', async () => {
      const result = await getBlacklistArray();
      expect(result).toEqual([]);
    });
  });

  describe('isBlacklisted', () => {
    it('should return false for phones not in blacklist', async () => {
      const result = await isBlacklisted('54996923504');
      expect(result).toBe(false);
    });

    it('should return false for invalid phones', async () => {
      expect(await isBlacklisted(null)).toBe(false);
      expect(await isBlacklisted('123')).toBe(false);
    });
  });

  describe('addToBlacklist', () => {
    it('should add phone to blacklist with data', async () => {
      const result = await addToBlacklist('54996923504', {
        name: 'Maria',
        reason: 'opt-out'
      });

      expect(result).toBe(true);
    });

    it('should return false for invalid phones', async () => {
      expect(await addToBlacklist('123')).toBe(false);
      expect(await addToBlacklist(null)).toBe(false);
    });
  });

  describe('removeFromBlacklist', () => {
    it('should remove phone from blacklist', async () => {
      await addToBlacklist('54996923504');
      const result = await removeFromBlacklist('54996923504');
      expect(result).toBe(true);
    });
  });

  describe('clearBlacklist', () => {
    it('should clear without errors', async () => {
      await addToBlacklist('54996923504');
      await addToBlacklist('54996923505');

      const result = await clearBlacklist();
      expect(result).toBe(true);
    });
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

  it('should handle Supabase format (Telefone, Nome)', () => {
    const customers = [
      { Telefone: '54996923504', Nome: 'Maria' },
      { Telefone: '54996923505', Nome: 'João' }
    ];

    const map = buildCustomerNameMap(customers);

    expect(map['+5554996923504']).toBe('Maria');
    expect(map['+5554996923505']).toBe('João');
  });
});

describe('getLastSyncTime', () => {
  it('should return null when never synced', () => {
    expect(getLastSyncTime()).toBeNull();
  });
});
