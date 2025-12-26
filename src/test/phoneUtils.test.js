/**
 * Tests for Brazilian Phone Number Utilities
 * @module phoneUtils.test
 */

import { describe, it, expect } from 'vitest';
import {
  cleanPhone,
  isValidBrazilianMobile,
  normalizePhone,
  normalizePhoneStrict,
  formatPhoneDisplay,
  getPhoneValidationError,
  filterValidPhones,
  getCampaignRecipients
} from '../utils/phoneUtils';

describe('cleanPhone', () => {
  it('should remove all non-digit characters', () => {
    expect(cleanPhone('+55 54 99692-3504')).toBe('5554996923504');
    expect(cleanPhone('(54) 99692-3504')).toBe('54996923504');
    expect(cleanPhone('54.99692.3504')).toBe('54996923504');
  });

  it('should handle whatsapp: prefix', () => {
    expect(cleanPhone('whatsapp:+5554996923504')).toBe('5554996923504');
    expect(cleanPhone('WHATSAPP:+5554996923504')).toBe('5554996923504');
  });

  it('should return empty string for null/undefined', () => {
    expect(cleanPhone(null)).toBe('');
    expect(cleanPhone(undefined)).toBe('');
    expect(cleanPhone('')).toBe('');
  });
});

describe('isValidBrazilianMobile', () => {
  it('should validate complete format (13 digits with 55)', () => {
    expect(isValidBrazilianMobile('5554996923504')).toBe(true);
    expect(isValidBrazilianMobile('+5554996923504')).toBe(true);
  });

  it('should validate 11-digit format (AA 9 NNNNNNNN)', () => {
    expect(isValidBrazilianMobile('54996923504')).toBe(true);
    expect(isValidBrazilianMobile('11999887766')).toBe(true);
  });

  it('should reject landlines (no 9 prefix)', () => {
    expect(isValidBrazilianMobile('5496923504')).toBe(false);
    expect(isValidBrazilianMobile('555496923504')).toBe(false);
  });

  it('should reject invalid area codes starting with 0', () => {
    expect(isValidBrazilianMobile('5509996923504')).toBe(false);
    expect(isValidBrazilianMobile('09996923504')).toBe(false);
  });

  it('should reject numbers that are too short or too long', () => {
    expect(isValidBrazilianMobile('549969235')).toBe(false);
    expect(isValidBrazilianMobile('554996923504999')).toBe(false);
  });
});

describe('normalizePhone', () => {
  describe('valid formats', () => {
    it('should handle complete 13-digit format', () => {
      expect(normalizePhone('5554996923504')).toBe('+5554996923504');
      expect(normalizePhone('+5554996923504')).toBe('+5554996923504');
    });

    it('should handle 11-digit format (adds 55)', () => {
      expect(normalizePhone('54996923504')).toBe('+5554996923504');
      expect(normalizePhone('11999887766')).toBe('+5511999887766');
    });

    it('should handle 10-digit legacy format (adds 55 and 9)', () => {
      expect(normalizePhone('5496923504')).toBe('+5554996923504');
      expect(normalizePhone('1188776655')).toBe('+5511988776655');
    });

    it('should handle 12-digit format with 55 (adds 9)', () => {
      expect(normalizePhone('555496923504')).toBe('+5554996923504');
      expect(normalizePhone('551188776655')).toBe('+5511988776655');
    });

    it('should handle whatsapp: prefix', () => {
      expect(normalizePhone('whatsapp:+5554996923504')).toBe('+5554996923504');
    });
  });

  describe('invalid formats', () => {
    it('should return null for empty/null values', () => {
      expect(normalizePhone(null)).toBeNull();
      expect(normalizePhone('')).toBeNull();
      expect(normalizePhone(undefined)).toBeNull();
    });

    it('should return null for numbers too short', () => {
      expect(normalizePhone('549969235')).toBeNull();
      expect(normalizePhone('123456')).toBeNull();
    });

    it('should return null for numbers too long', () => {
      expect(normalizePhone('55549969235041234')).toBeNull();
    });

    it('should return null for invalid area codes', () => {
      expect(normalizePhone('5509996923504')).toBeNull();
    });
  });
});

describe('normalizePhoneStrict', () => {
  it('should NOT add missing 9 prefix', () => {
    expect(normalizePhoneStrict('5496923504')).toBeNull();
    expect(normalizePhoneStrict('555496923504')).toBeNull();
  });

  it('should accept already valid formats', () => {
    expect(normalizePhoneStrict('5554996923504')).toBe('+5554996923504');
    expect(normalizePhoneStrict('54996923504')).toBe('+5554996923504');
  });
});

describe('formatPhoneDisplay', () => {
  it('should format 13-digit phones correctly', () => {
    expect(formatPhoneDisplay('+5554996923504')).toBe('+55 54 99692-3504');
    expect(formatPhoneDisplay('5554996923504')).toBe('+55 54 99692-3504');
  });

  it('should format 11-digit phones correctly', () => {
    expect(formatPhoneDisplay('54996923504')).toBe('54 99692-3504');
  });

  it('should return original for unrecognized formats', () => {
    expect(formatPhoneDisplay('123')).toBe('123');
  });

  it('should handle empty values', () => {
    expect(formatPhoneDisplay('')).toBe('');
    expect(formatPhoneDisplay(null)).toBe('');
  });
});

describe('getPhoneValidationError', () => {
  it('should return null for valid phones', () => {
    expect(getPhoneValidationError('54996923504')).toBeNull();
    expect(getPhoneValidationError('5554996923504')).toBeNull();
  });

  it('should return error for missing phone', () => {
    expect(getPhoneValidationError(null)).toBe('Telefone não informado');
    expect(getPhoneValidationError('')).toBe('Telefone não informado');
  });

  it('should return error for short numbers', () => {
    expect(getPhoneValidationError('123456789')).toBe('Número muito curto');
  });

  it('should return error for long numbers', () => {
    expect(getPhoneValidationError('12345678901234')).toBe('Número muito longo');
  });

  it('should return error for invalid area code', () => {
    const error = getPhoneValidationError('09996923504');
    expect(error).toContain('DDD inválido');
  });

  it('should return error for numbers with invalid DDD', () => {
    // 10-digit numbers now get 9 prefix added automatically
    // So test explicitly invalid DDDs instead
    const error = getPhoneValidationError('00996923504'); // DDD 00 is invalid
    expect(error).not.toBeNull();
  });
});

describe('filterValidPhones', () => {
  const customers = [
    { id: 1, name: 'Maria', phone: '54996923504' },
    { id: 2, name: 'João', phone: '5436923504' }, // landline
    { id: 3, name: 'Ana', phone: '+5511999887766' },
    { id: 4, name: 'Pedro', phone: null },
    { id: 5, name: 'Lucia', phone: '' }
  ];

  it('should filter only customers with valid mobile phones', () => {
    const result = filterValidPhones(customers);
    expect(result).toHaveLength(2);
    expect(result.map(c => c.name)).toEqual(['Maria', 'Ana']);
  });

  it('should work with custom phone field', () => {
    const customCustomers = [
      { id: 1, name: 'Test', mobile: '54996923504' }
    ];
    const result = filterValidPhones(customCustomers, 'mobile');
    expect(result).toHaveLength(1);
  });
});

describe('getCampaignRecipients', () => {
  const customers = [
    { id: 1, name: 'Maria', phone: '54996923504' },
    { id: 2, name: 'João', phone: '5436923504' }, // landline - will be converted
    { id: 3, name: 'Ana', phone: '+5511999887766' },
    { id: 4, name: 'Pedro', phone: null },
    { id: 5, name: 'Lucia', phone: '123' } // too short
  ];

  it('should separate valid and invalid recipients', () => {
    const result = getCampaignRecipients(customers);

    // Maria, João (converted), Ana are valid
    expect(result.valid.length).toBe(3);
    // Pedro (null), Lucia (too short) are invalid
    expect(result.invalid.length).toBe(2);
  });

  it('should normalize phone numbers in valid recipients', () => {
    const result = getCampaignRecipients(customers);

    const maria = result.valid.find(c => c.name === 'Maria');
    expect(maria.phone).toBe('+5554996923504');
    expect(maria.originalPhone).toBe('54996923504');
  });

  it('should include error messages for invalid recipients', () => {
    const result = getCampaignRecipients(customers);

    const pedro = result.invalid.find(c => c.name === 'Pedro');
    expect(pedro.error).toBe('Telefone não informado');

    const lucia = result.invalid.find(c => c.name === 'Lucia');
    expect(lucia.error).toBe('Número muito curto');
  });

  it('should calculate correct stats', () => {
    const result = getCampaignRecipients(customers);

    expect(result.stats.total).toBe(5);
    expect(result.stats.validCount).toBe(3);
    expect(result.stats.invalidCount).toBe(2);
    expect(result.stats.validRate).toBe(60);
  });

  it('should handle empty array', () => {
    const result = getCampaignRecipients([]);

    expect(result.valid).toEqual([]);
    expect(result.invalid).toEqual([]);
    expect(result.stats.total).toBe(0);
    expect(result.stats.validRate).toBe(0);
  });
});
