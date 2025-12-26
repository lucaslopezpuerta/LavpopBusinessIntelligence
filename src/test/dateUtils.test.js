/**
 * Tests for Brazilian Date Utilities
 * @module dateUtils.test
 */

import { describe, it, expect } from 'vitest';
import {
  parseBrDate,
  formatDate,
  formatBrDate,
  daysBetween,
  isWithinRange,
  formatMonthKey,
  getDaysInMonth,
  getBrazilDateParts
} from '../utils/dateUtils';

describe('parseBrDate', () => {
  describe('DD/MM/YYYY format', () => {
    it('should parse date without time', () => {
      const date = parseBrDate('25/12/2024');
      expect(date.brazil.day).toBe(25);
      expect(date.brazil.month).toBe(12);
      expect(date.brazil.year).toBe(2024);
    });

    it('should parse date with time', () => {
      const date = parseBrDate('25/12/2024 14:30:45');
      expect(date.brazil.day).toBe(25);
      expect(date.brazil.month).toBe(12);
      expect(date.brazil.year).toBe(2024);
      expect(date.brazil.hour).toBe(14);
      expect(date.brazil.minute).toBe(30);
      expect(date.brazil.second).toBe(45);
    });

    it('should handle 2-digit year', () => {
      const date = parseBrDate('01/06/24');
      expect(date.brazil.year).toBe(2024);
    });
  });

  describe('DD-MM-YYYY format (RFM CSV)', () => {
    it('should parse hyphenated Brazilian date', () => {
      const date = parseBrDate('15-06-2024');
      expect(date.brazil.day).toBe(15);
      expect(date.brazil.month).toBe(6);
      expect(date.brazil.year).toBe(2024);
    });
  });

  describe('ISO format', () => {
    it('should parse YYYY-MM-DD', () => {
      const date = parseBrDate('2024-12-25');
      expect(date.brazil.day).toBe(25);
      expect(date.brazil.month).toBe(12);
      expect(date.brazil.year).toBe(2024);
    });

    it('should parse YYYY-MM-DDTHH:mm:ss', () => {
      const date = parseBrDate('2024-12-25T10:30:00');
      expect(date.brazil.hour).toBe(10);
      expect(date.brazil.minute).toBe(30);
    });
  });

  describe('error handling', () => {
    it('should return fallback for null/undefined', () => {
      const date = parseBrDate(null);
      expect(date.brazil.year).toBe(1970);
    });

    it('should return fallback for empty string', () => {
      const date = parseBrDate('');
      expect(date.brazil.year).toBe(1970);
    });

    it('should return fallback for invalid format', () => {
      const date = parseBrDate('invalid-date');
      expect(date.brazil.year).toBe(1970);
    });
  });
});

describe('formatDate', () => {
  it('should format date to YYYY-MM-DD', () => {
    const date = new Date(2024, 11, 25); // Dec 25, 2024
    expect(formatDate(date)).toBe('2024-12-25');
  });

  it('should pad single digit months and days', () => {
    const date = new Date(2024, 0, 5); // Jan 5, 2024
    expect(formatDate(date)).toBe('2024-01-05');
  });

  it('should return empty string for invalid date', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(new Date('invalid'))).toBe('');
  });
});

describe('formatBrDate', () => {
  it('should format date to DD/MM/YYYY', () => {
    const date = new Date(2024, 11, 25); // Dec 25, 2024
    expect(formatBrDate(date)).toBe('25/12/2024');
  });

  it('should pad single digit months and days', () => {
    const date = new Date(2024, 0, 5); // Jan 5, 2024
    expect(formatBrDate(date)).toBe('05/01/2024');
  });
});

describe('daysBetween', () => {
  it('should calculate days between two dates', () => {
    const date1 = new Date(2024, 0, 1);
    const date2 = new Date(2024, 0, 11);
    expect(daysBetween(date1, date2)).toBe(10);
  });

  it('should return absolute difference', () => {
    const date1 = new Date(2024, 0, 11);
    const date2 = new Date(2024, 0, 1);
    expect(daysBetween(date1, date2)).toBe(10);
  });

  it('should handle same date', () => {
    const date = new Date(2024, 0, 1);
    expect(daysBetween(date, date)).toBe(0);
  });
});

describe('isWithinRange', () => {
  const testDate = new Date(2024, 5, 15); // June 15, 2024

  it('should return true when date is within range', () => {
    const start = new Date(2024, 5, 1);
    const end = new Date(2024, 5, 30);
    expect(isWithinRange(testDate, start, end)).toBe(true);
  });

  it('should return false when date is before start', () => {
    const start = new Date(2024, 5, 20);
    const end = new Date(2024, 5, 30);
    expect(isWithinRange(testDate, start, end)).toBe(false);
  });

  it('should return false when date is after end', () => {
    const start = new Date(2024, 5, 1);
    const end = new Date(2024, 5, 10);
    expect(isWithinRange(testDate, start, end)).toBe(false);
  });

  it('should return true when no range specified', () => {
    expect(isWithinRange(testDate, null, null)).toBe(true);
  });

  it('should handle open-ended ranges', () => {
    const start = new Date(2024, 5, 1);
    expect(isWithinRange(testDate, start, null)).toBe(true);
    expect(isWithinRange(testDate, null, new Date(2024, 5, 30))).toBe(true);
  });
});

describe('formatMonthKey', () => {
  it('should format to tiny format (N24)', () => {
    expect(formatMonthKey('2024-11', 'tiny')).toBe('N24');
    expect(formatMonthKey('2024-01', 'tiny')).toBe('J24');
  });

  it('should format to medium format (Nov 2024)', () => {
    const result = formatMonthKey('2024-11', 'medium');
    expect(result).toContain('2024');
  });

  it('should handle invalid input', () => {
    expect(formatMonthKey(null)).toBe(null);
    expect(formatMonthKey('')).toBe('');
    expect(formatMonthKey('invalid')).toBe('invalid');
  });
});

describe('getDaysInMonth', () => {
  it('should return correct days for each month', () => {
    expect(getDaysInMonth('2024-01')).toBe(31); // January
    expect(getDaysInMonth('2024-02')).toBe(29); // February (leap year)
    expect(getDaysInMonth('2023-02')).toBe(28); // February (non-leap)
    expect(getDaysInMonth('2024-04')).toBe(30); // April
    expect(getDaysInMonth('2024-12')).toBe(31); // December
  });

  it('should return 30 for invalid input', () => {
    expect(getDaysInMonth(null)).toBe(30);
    expect(getDaysInMonth('')).toBe(30);
  });
});

describe('getBrazilDateParts', () => {
  it('should return all date parts', () => {
    const parts = getBrazilDateParts(new Date('2024-12-25T12:00:00Z'));
    expect(parts).toHaveProperty('year');
    expect(parts).toHaveProperty('month');
    expect(parts).toHaveProperty('day');
    expect(parts).toHaveProperty('hour');
    expect(parts).toHaveProperty('minute');
    expect(parts).toHaveProperty('second');
    expect(parts).toHaveProperty('dayOfWeek');
  });

  it('should return valid day of week (0-6)', () => {
    const parts = getBrazilDateParts();
    expect(parts.dayOfWeek).toBeGreaterThanOrEqual(0);
    expect(parts.dayOfWeek).toBeLessThanOrEqual(6);
  });
});
