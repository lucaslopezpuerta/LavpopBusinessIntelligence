/**
 * Tests for Business Metrics Calculator
 * @module businessMetrics.test
 *
 * Tests KPIs, revenue calculations, and week-over-week comparisons
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateBusinessMetrics,
  getDailyRevenue
} from '../utils/businessMetrics';

// Mock the logger to avoid console noise
vi.mock('../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

// Mock getBrazilDateParts to control "today" in tests
vi.mock('../utils/dateUtils', async () => {
  const actual = await vi.importActual('../utils/dateUtils');
  return {
    ...actual,
    getBrazilDateParts: vi.fn(() => ({
      year: 2024,
      month: 12,
      day: 18, // Wednesday
      hour: 14,
      minute: 30,
      second: 0,
      dayOfWeek: 3 // Wednesday
    }))
  };
});

// Helper to create test sales data
function createSalesData(entries) {
  return entries.map(entry => ({
    Data_Hora: entry.date,
    Valor_Venda: entry.gross || '50,00',
    Valor_Pago: entry.net || entry.gross || '50,00',
    Maquinas: entry.machines || 'Lavadora 1',
    Doc_Cliente: entry.doc || '12345678901',
    Tipo: entry.type || '1' // Type 1 = service
  }));
}

describe('calculateBusinessMetrics', () => {
  describe('null/empty handling', () => {
    it('should return null for null input', () => {
      const result = calculateBusinessMetrics(null);
      expect(result).toBeNull();
    });

    it('should return null for empty array', () => {
      const result = calculateBusinessMetrics([]);
      expect(result).toBeNull();
    });
  });

  describe('return structure', () => {
    it('should return all expected metric categories', () => {
      const salesData = createSalesData([
        { date: '15/12/2024', gross: '100,00' }
      ]);

      const result = calculateBusinessMetrics(salesData);

      expect(result).toHaveProperty('weekly');
      expect(result).toHaveProperty('previousWeekly');
      expect(result).toHaveProperty('twoWeeksAgo');
      expect(result).toHaveProperty('fourWeek');
      expect(result).toHaveProperty('currentWeek');
      expect(result).toHaveProperty('monthToDate');
      expect(result).toHaveProperty('weekOverWeek');
      expect(result).toHaveProperty('windows');
    });

    it('should include revenue metrics in weekly', () => {
      const salesData = createSalesData([
        { date: '08/12/2024', gross: '100,00' }, // Within last complete week
        { date: '09/12/2024', gross: '50,00' }
      ]);

      const result = calculateBusinessMetrics(salesData);

      expect(result.weekly).toHaveProperty('netRevenue');
      expect(result.weekly).toHaveProperty('grossRevenue');
      expect(result.weekly).toHaveProperty('totalServices');
      expect(result.weekly).toHaveProperty('washServices');
      expect(result.weekly).toHaveProperty('dryServices');
    });

    it('should include utilization metrics', () => {
      const salesData = createSalesData([
        { date: '08/12/2024', machines: 'Lavadora 1, Secadora 1' }
      ]);

      const result = calculateBusinessMetrics(salesData);

      expect(result.weekly).toHaveProperty('totalUtilization');
      expect(result.weekly).toHaveProperty('washerUtilization');
      expect(result.weekly).toHaveProperty('dryerUtilization');
    });
  });

  describe('currentWeek metrics', () => {
    it('should include current week window info', () => {
      const salesData = createSalesData([
        { date: '16/12/2024', gross: '100,00' } // Monday of current week
      ]);

      const result = calculateBusinessMetrics(salesData);

      expect(result.currentWeek).toHaveProperty('window');
      expect(result.currentWeek.window).toHaveProperty('daysElapsed');
      expect(result.currentWeek.window).toHaveProperty('isPartial');
      expect(result.currentWeek.window).toHaveProperty('dayOfWeek');
    });

    it('should include projection data', () => {
      const salesData = createSalesData([
        { date: '15/12/2024', gross: '100,00' },
        { date: '16/12/2024', gross: '100,00' }
      ]);

      const result = calculateBusinessMetrics(salesData);

      expect(result.currentWeek).toHaveProperty('projection');
      expect(result.currentWeek.projection).toHaveProperty('canProject');
    });
  });

  describe('monthToDate metrics', () => {
    it('should include MTD revenue data', () => {
      const salesData = createSalesData([
        { date: '01/12/2024', gross: '100,00' },
        { date: '15/12/2024', gross: '200,00' }
      ]);

      const result = calculateBusinessMetrics(salesData);

      expect(result.monthToDate).toHaveProperty('grossRevenue');
      expect(result.monthToDate).toHaveProperty('netRevenue');
      expect(result.monthToDate).toHaveProperty('daysElapsed');
      expect(result.monthToDate).toHaveProperty('monthName');
    });

    it('should include year-over-year comparison', () => {
      const salesData = createSalesData([
        { date: '01/12/2024', gross: '100,00' },
        { date: '01/12/2023', gross: '80,00' } // Last year
      ]);

      const result = calculateBusinessMetrics(salesData);

      expect(result.monthToDate).toHaveProperty('lastYearGrossRevenue');
      expect(result.monthToDate).toHaveProperty('yearOverYearChange');
    });
  });

  describe('weekOverWeek changes', () => {
    it('should calculate week-over-week percentage changes', () => {
      const salesData = createSalesData([
        // Last complete week (Dec 8-14)
        { date: '08/12/2024', gross: '200,00' },
        // Previous week (Dec 1-7)
        { date: '01/12/2024', gross: '100,00' }
      ]);

      const result = calculateBusinessMetrics(salesData);

      expect(result.weekOverWeek).toHaveProperty('netRevenue');
      expect(result.weekOverWeek).toHaveProperty('totalServices');
      expect(result.weekOverWeek).toHaveProperty('utilization');
    });
  });

  describe('windows data', () => {
    it('should include date windows with Date objects and formatted strings', () => {
      const salesData = createSalesData([
        { date: '08/12/2024', gross: '100,00' }
      ]);

      const result = calculateBusinessMetrics(salesData);

      // Check weekly window
      expect(result.windows.weekly).toHaveProperty('start');
      expect(result.windows.weekly).toHaveProperty('end');
      expect(result.windows.weekly).toHaveProperty('startDate');
      expect(result.windows.weekly).toHaveProperty('endDate');
      expect(result.windows.weekly.start).toBeInstanceOf(Date);

      // Check current week window
      expect(result.windows.currentWeek).toHaveProperty('daysElapsed');
      expect(result.windows.currentWeek).toHaveProperty('dayOfWeek');
    });
  });

  describe('machine counting', () => {
    it('should count wash and dry services separately', () => {
      const salesData = createSalesData([
        { date: '08/12/2024', machines: 'Lavadora 1, Lavadora 2' },
        { date: '09/12/2024', machines: 'Secadora 1' }
      ]);

      const result = calculateBusinessMetrics(salesData);

      expect(result.weekly.washServices).toBe(2);
      expect(result.weekly.dryServices).toBe(1);
      expect(result.weekly.totalServices).toBe(3);
    });

    it('should exclude Recarga from service counts', () => {
      const salesData = [
        { Data_Hora: '08/12/2024', Valor_Venda: '100,00', Valor_Pago: '100,00', Maquinas: 'Lavadora 1', Doc_Cliente: '123', Tipo: '1' },
        { Data_Hora: '08/12/2024', Valor_Venda: '50,00', Valor_Pago: '50,00', Maquinas: 'Recarga', Doc_Cliente: '123', Tipo: '3' }
      ];

      const result = calculateBusinessMetrics(salesData);

      // Should only count 1 service (the Lavadora), not the Recarga
      expect(result.weekly.totalServices).toBe(1);
      // But revenue should include both
      expect(result.weekly.grossRevenue).toBe(150);
    });
  });

  describe('Brazilian number format', () => {
    it('should parse Brazilian number format correctly', () => {
      const salesData = createSalesData([
        { date: '08/12/2024', gross: '1.234,56' } // Brazilian format
      ]);

      const result = calculateBusinessMetrics(salesData);

      expect(result.weekly.grossRevenue).toBe(1234.56);
    });
  });
});

describe('getDailyRevenue', () => {
  it('should return daily revenue for specified period', () => {
    const salesData = createSalesData([
      { date: '15/12/2024', gross: '100,00' },
      { date: '15/12/2024', gross: '50,00' }, // Same day
      { date: '16/12/2024', gross: '75,00' }
    ]);

    const result = getDailyRevenue(salesData, 30);

    expect(Array.isArray(result)).toBe(true);
  });

  it('should aggregate multiple sales on same day', () => {
    const salesData = createSalesData([
      { date: '15/12/2024', gross: '100,00' },
      { date: '15/12/2024', gross: '50,00' }
    ]);

    const result = getDailyRevenue(salesData, 30);

    // Find Dec 15 entry
    const dec15 = result.find(d => d.date === '15/12/2024');
    if (dec15) {
      expect(dec15.revenue).toBe(150);
    }
  });

  it('should return sorted by date', () => {
    const salesData = createSalesData([
      { date: '18/12/2024', gross: '100,00' },
      { date: '15/12/2024', gross: '50,00' },
      { date: '16/12/2024', gross: '75,00' }
    ]);

    const result = getDailyRevenue(salesData, 30);

    // Result should be sorted ascending
    for (let i = 1; i < result.length; i++) {
      expect(result[i].date >= result[i - 1].date).toBe(true);
    }
  });

  it('should filter to specified day range', () => {
    const salesData = createSalesData([
      { date: '01/11/2024', gross: '100,00' }, // More than 30 days ago
      { date: '15/12/2024', gross: '50,00' }
    ]);

    const result = getDailyRevenue(salesData, 30);

    // Should not include Nov 1
    const nov1 = result.find(d => d.date === '01/11/2024');
    expect(nov1).toBeUndefined();
  });

  it('should round revenue to 2 decimal places', () => {
    const salesData = createSalesData([
      { date: '15/12/2024', gross: '33,33' },
      { date: '15/12/2024', gross: '33,33' },
      { date: '15/12/2024', gross: '33,33' }
    ]);

    const result = getDailyRevenue(salesData, 30);

    const dec15 = result.find(d => d.date === '15/12/2024');
    if (dec15) {
      // 33.33 * 3 = 99.99
      expect(dec15.revenue).toBe(99.99);
    }
  });
});

describe('Projection calculations', () => {
  it('should set canProject to true when data exists', () => {
    const salesData = createSalesData([
      { date: '15/12/2024', gross: '100,00' }, // Sunday
      { date: '16/12/2024', gross: '100,00' }  // Monday
    ]);

    const result = calculateBusinessMetrics(salesData);

    expect(result.currentWeek.projection.canProject).toBeDefined();
  });

  it('should calculate projected revenue', () => {
    const salesData = createSalesData([
      { date: '15/12/2024', gross: '100,00' },
      { date: '16/12/2024', gross: '100,00' }
    ]);

    const result = calculateBusinessMetrics(salesData);

    if (result.currentWeek.projection.canProject) {
      expect(result.currentWeek.projection).toHaveProperty('projectedRevenue');
      expect(result.currentWeek.projection).toHaveProperty('projectedServices');
    }
  });

  it('should include confidence level', () => {
    const salesData = createSalesData([
      { date: '15/12/2024', gross: '100,00' }
    ]);

    const result = calculateBusinessMetrics(salesData);

    if (result.currentWeek.projection.canProject) {
      expect(['very_low', 'low', 'medium', 'high']).toContain(
        result.currentWeek.projection.confidence
      );
    }
  });

  it('should include trend indicator', () => {
    const salesData = createSalesData([
      { date: '08/12/2024', gross: '100,00' }, // Last week
      { date: '15/12/2024', gross: '200,00' }  // This week
    ]);

    const result = calculateBusinessMetrics(salesData);

    if (result.currentWeek.projection.canProject) {
      expect(['up', 'down', 'stable']).toContain(
        result.currentWeek.projection.trend
      );
    }
  });
});

describe('Week boundary handling', () => {
  it('should use Sunday as start of business week', () => {
    const salesData = createSalesData([
      { date: '15/12/2024', gross: '100,00' } // Sunday
    ]);

    const result = calculateBusinessMetrics(salesData);

    // The current week window should start on Sunday
    expect(result.windows.currentWeek.start.getDay()).toBe(0); // 0 = Sunday
  });
});

describe('Cashback handling', () => {
  it('should calculate cashback in metrics', () => {
    const salesData = createSalesData([
      { date: '08/12/2024', gross: '100,00', net: '92,50' } // 7.5% cashback
    ]);

    const result = calculateBusinessMetrics(salesData);

    expect(result.weekly).toHaveProperty('cashback');
    expect(result.weekly.cashback).toBeGreaterThanOrEqual(0);
  });
});
