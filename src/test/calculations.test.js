/**
 * Tests for Core Business Calculations
 * @module calculations.test
 *
 * Tests correlation, sales processing, metrics, and risk calculations
 */

import { describe, it, expect, vi } from 'vitest';
import {
  calculateCorrelation,
  calculateHeatIndex,
  processSales,
  calculateSalesMetrics,
  groupSalesByDate,
  groupSalesByHour,
  groupSalesByDayOfWeek,
  calculateCustomerMetrics,
  calculateRiskScore,
  getRiskLevel,
  calculateMachineUtilization
} from '../utils/calculations';

// Mock dateUtils to avoid timezone issues in tests
vi.mock('../utils/dateUtils', async () => {
  const actual = await vi.importActual('../utils/dateUtils');
  return {
    ...actual,
    getBrazilDateParts: () => ({
      year: 2024,
      month: 12,
      day: 25,
      hour: 12,
      minute: 0,
      second: 0,
      dayOfWeek: 3
    })
  };
});

describe('calculateCorrelation', () => {
  it('should return 1 for perfectly positively correlated data', () => {
    const X = [1, 2, 3, 4, 5];
    const Y = [2, 4, 6, 8, 10];
    const correlation = calculateCorrelation(X, Y);
    expect(correlation).toBeCloseTo(1, 5);
  });

  it('should return -1 for perfectly negatively correlated data', () => {
    const X = [1, 2, 3, 4, 5];
    const Y = [10, 8, 6, 4, 2];
    const correlation = calculateCorrelation(X, Y);
    expect(correlation).toBeCloseTo(-1, 5);
  });

  it('should return 0 for uncorrelated data', () => {
    // Perfectly uncorrelated: Y doesn't change with X
    const X = [1, 2, 3, 4, 5];
    const Y = [5, 5, 5, 5, 5];
    const correlation = calculateCorrelation(X, Y);
    expect(correlation).toBeNull(); // Division by zero (Y variance is 0)
  });

  it('should return null for arrays with less than 2 elements', () => {
    expect(calculateCorrelation([1], [2])).toBeNull();
    expect(calculateCorrelation([], [])).toBeNull();
  });

  it('should return null for arrays of different lengths', () => {
    expect(calculateCorrelation([1, 2, 3], [1, 2])).toBeNull();
  });

  it('should return null for null/undefined inputs', () => {
    expect(calculateCorrelation(null, [1, 2])).toBeNull();
    expect(calculateCorrelation([1, 2], undefined)).toBeNull();
  });
});

describe('calculateHeatIndex', () => {
  it('should return temperature unchanged when humidity < 40%', () => {
    expect(calculateHeatIndex(30, 35)).toBe(30);
    expect(calculateHeatIndex(25, 20)).toBe(25);
  });

  it('should increase perceived temperature at high humidity', () => {
    const tempC = 30;
    const humidity = 80;
    const heatIndex = calculateHeatIndex(tempC, humidity);
    expect(heatIndex).toBeGreaterThan(tempC);
  });

  it('should calculate Brazilian heat index correctly', () => {
    // At 30°C and 60% humidity
    const heatIndex = calculateHeatIndex(30, 60);
    expect(heatIndex).toBeGreaterThan(30);
    expect(heatIndex).toBeLessThan(40);
  });
});

describe('calculateSalesMetrics', () => {
  it('should return zeros for empty sales array', () => {
    const result = calculateSalesMetrics([]);
    expect(result.totalRevenue).toBe(0);
    expect(result.totalTransactions).toBe(0);
    expect(result.avgTicket).toBe(0);
  });

  it('should return zeros for null/undefined input', () => {
    const result = calculateSalesMetrics(null);
    expect(result.totalRevenue).toBe(0);
  });

  it('should calculate total revenue correctly', () => {
    const sales = [
      { value: 100, machines: { wash: 1, dry: 0 } },
      { value: 50, machines: { wash: 0, dry: 1 } },
      { value: 75, machines: { wash: 1, dry: 1 } }
    ];
    const result = calculateSalesMetrics(sales);
    expect(result.totalRevenue).toBe(225);
  });

  it('should calculate average ticket', () => {
    const sales = [
      { value: 100, machines: { wash: 1, dry: 0 } },
      { value: 200, machines: { wash: 1, dry: 0 } }
    ];
    const result = calculateSalesMetrics(sales);
    expect(result.avgTicket).toBe(150);
  });

  it('should count machine usage correctly', () => {
    const sales = [
      { value: 100, machines: { wash: 2, dry: 1 } },
      { value: 50, machines: { wash: 1, dry: 2 } }
    ];
    const result = calculateSalesMetrics(sales);
    expect(result.totalWash).toBe(3);
    expect(result.totalDry).toBe(3);
    expect(result.totalMachines).toBe(6);
  });

  it('should calculate wash and dry revenue', () => {
    const sales = [
      { value: 100, machines: { wash: 1, dry: 0 } },
      { value: 50, machines: { wash: 0, dry: 1 } }
    ];
    const result = calculateSalesMetrics(sales);
    expect(result.washRevenue).toBe(100);
    expect(result.dryRevenue).toBe(50);
  });
});

describe('groupSalesByHour', () => {
  it('should create 24 hour buckets', () => {
    const result = groupSalesByHour([]);
    expect(result).toHaveLength(24);
    expect(result[0].hour).toBe(0);
    expect(result[23].hour).toBe(23);
  });

  it('should aggregate sales by hour', () => {
    const sales = [
      { value: 100, hour: 9 },
      { value: 50, hour: 9 },
      { value: 75, hour: 14 }
    ];
    const result = groupSalesByHour(sales);

    expect(result[9].revenue).toBe(150);
    expect(result[9].transactions).toBe(2);
    expect(result[14].revenue).toBe(75);
    expect(result[14].transactions).toBe(1);
  });

  it('should calculate average ticket per hour', () => {
    const sales = [
      { value: 100, hour: 9 },
      { value: 200, hour: 9 }
    ];
    const result = groupSalesByHour(sales);
    expect(result[9].avgTicket).toBe(150);
  });

  it('should have zero avgTicket for hours with no transactions', () => {
    const result = groupSalesByHour([]);
    expect(result[0].avgTicket).toBe(0);
  });
});

describe('groupSalesByDayOfWeek', () => {
  it('should create 7 day buckets with Portuguese names', () => {
    const result = groupSalesByDayOfWeek([]);
    expect(result).toHaveLength(7);
    expect(result[0].dayName).toBe('Dom'); // Sunday
    expect(result[1].dayName).toBe('Seg'); // Monday
    expect(result[6].dayName).toBe('Sáb'); // Saturday
  });

  it('should aggregate sales by day of week', () => {
    const sales = [
      { value: 100, dayOfWeek: 1 }, // Monday
      { value: 50, dayOfWeek: 1 },
      { value: 200, dayOfWeek: 6 }  // Saturday
    ];
    const result = groupSalesByDayOfWeek(sales);

    expect(result[1].revenue).toBe(150);
    expect(result[1].transactions).toBe(2);
    expect(result[6].revenue).toBe(200);
  });
});

describe('groupSalesByDate', () => {
  it('should group sales by date key', () => {
    const date1 = new Date('2024-12-25');
    const date2 = new Date('2024-12-26');

    const sales = [
      { date: date1, value: 100 },
      { date: date1, value: 50 },
      { date: date2, value: 200 }
    ];

    const result = groupSalesByDate(sales);

    expect(result).toHaveLength(2);
    expect(result[0].revenue).toBe(150); // Dec 25
    expect(result[1].revenue).toBe(200); // Dec 26
  });

  it('should sort by date ascending', () => {
    const date1 = new Date('2024-12-26');
    const date2 = new Date('2024-12-25');

    const sales = [
      { date: date1, value: 100 },
      { date: date2, value: 50 }
    ];

    const result = groupSalesByDate(sales);
    expect(result[0].dateKey).toBe('2024-12-25');
    expect(result[1].dateKey).toBe('2024-12-26');
  });
});

describe('calculateRiskScore', () => {
  it('should return low score for recent activity', () => {
    const score = calculateRiskScore(5, 'VIP');
    expect(score).toBeLessThan(30);
  });

  it('should return high score for long inactivity', () => {
    const score = calculateRiskScore(90, 'Inativo');
    expect(score).toBeGreaterThan(80);
  });

  it('should apply RFM segment bonus (VIP = lower risk)', () => {
    const vipScore = calculateRiskScore(30, 'VIP');
    const lostScore = calculateRiskScore(30, 'Inativo');
    expect(vipScore).toBeLessThan(lostScore);
  });

  it('should support Portuguese segment names', () => {
    const vipScore = calculateRiskScore(30, 'VIP');
    const frequenteScore = calculateRiskScore(30, 'Frequente');
    const esfriandoScore = calculateRiskScore(30, 'Esfriando');

    expect(vipScore).toBeLessThan(frequenteScore);
    expect(frequenteScore).toBeLessThan(esfriandoScore);
  });

  it('should support English segment names for legacy', () => {
    const championScore = calculateRiskScore(30, 'Champion');
    const lostScore = calculateRiskScore(30, 'Lost');
    expect(championScore).toBeLessThan(lostScore);
  });

  it('should use default multiplier for unknown segments', () => {
    const unknownScore = calculateRiskScore(30, 'Unknown');
    const defaultScore = calculateRiskScore(30, null);
    expect(unknownScore).toBe(defaultScore);
  });

  it('should cap risk score at 100', () => {
    const score = calculateRiskScore(365, 'Inativo');
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('getRiskLevel', () => {
  it('should return high risk for scores >= 80', () => {
    const result = getRiskLevel(80);
    expect(result.level).toBe('high');
    expect(result.label).toBe('Alto');
    expect(result.color).toBe('#dc2626');
  });

  it('should return medium risk for scores >= 50', () => {
    const result = getRiskLevel(60);
    expect(result.level).toBe('medium');
    expect(result.label).toBe('Médio');
    expect(result.color).toBe('#f59e0b');
  });

  it('should return low risk for scores < 50', () => {
    const result = getRiskLevel(30);
    expect(result.level).toBe('low');
    expect(result.label).toBe('Baixo');
    expect(result.color).toBe('#10b981');
  });

  it('should handle boundary values', () => {
    expect(getRiskLevel(79).level).toBe('medium');
    expect(getRiskLevel(80).level).toBe('high');
    expect(getRiskLevel(49).level).toBe('low');
    expect(getRiskLevel(50).level).toBe('medium');
  });
});

describe('calculateMachineUtilization', () => {
  it('should calculate utilization percentages', () => {
    const sales = [
      { machines: { wash: 10, dry: 5 } },
      { machines: { wash: 5, dry: 10 } }
    ];

    const result = calculateMachineUtilization(sales, 3, 5);

    expect(result.wash.uses).toBe(15);
    expect(result.dry.uses).toBe(15);
    expect(result.wash.utilization).toBeGreaterThan(0);
    expect(result.dry.utilization).toBeGreaterThan(0);
  });

  it('should use default machine counts', () => {
    const sales = [{ machines: { wash: 1, dry: 1 } }];
    const result = calculateMachineUtilization(sales);

    // Default is 3 washers, 5 dryers
    expect(result.wash.capacity).toBe(3 * 24 * 30); // 3 washers * 24 hours * 30 days
    expect(result.dry.capacity).toBe(5 * 24 * 30);  // 5 dryers * 24 hours * 30 days
  });
});

describe('calculateCustomerMetrics (single customer)', () => {
  it('should return zeros for customer with no sales', () => {
    const result = calculateCustomerMetrics([], '12345678901');
    expect(result.totalVisits).toBe(0);
    expect(result.totalSpent).toBe(0);
    expect(result.avgTicket).toBe(0);
    expect(result.firstVisit).toBeNull();
    expect(result.lastVisit).toBeNull();
  });

  it('should calculate customer lifetime metrics', () => {
    const salesData = [
      { Doc_Cliente: '12345678901', Data_Hora: '01/11/2024', Valor_Venda: '100,00', Maquinas: 'Lavadora 1' },
      { Doc_Cliente: '12345678901', Data_Hora: '15/11/2024', Valor_Venda: '50,00', Maquinas: 'Secadora 1' },
      { Doc_Cliente: '98765432100', Data_Hora: '01/11/2024', Valor_Venda: '200,00', Maquinas: 'Lavadora 2' }
    ];

    const result = calculateCustomerMetrics(salesData, '12345678901');

    expect(result.totalVisits).toBe(2);
    expect(result.totalSpent).toBe(150);
    expect(result.avgTicket).toBe(75);
  });

  it('should track unique visit days', () => {
    const salesData = [
      { Doc_Cliente: '12345678901', Data_Hora: '01/11/2024 09:00', Valor_Venda: '50,00', Maquinas: '' },
      { Doc_Cliente: '12345678901', Data_Hora: '01/11/2024 14:00', Valor_Venda: '30,00', Maquinas: '' }, // Same day
      { Doc_Cliente: '12345678901', Data_Hora: '02/11/2024 10:00', Valor_Venda: '40,00', Maquinas: '' }
    ];

    const result = calculateCustomerMetrics(salesData, '12345678901');

    expect(result.totalVisits).toBe(3); // 3 transactions
    expect(result.uniqueVisitDays).toBe(2); // But only 2 unique days
  });
});

describe('processSales', () => {
  it('should process sales with Brazilian date format', () => {
    const salesData = [
      { Data_Hora: '25/12/2024 14:30', Valor_Venda: '100,50', Maquinas: 'Lavadora 1', Doc_Cliente: '12345678901' }
    ];

    const result = processSales(salesData);

    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(100.5);
    expect(result[0].hour).toBe(14);
  });

  it('should filter by date range', () => {
    const salesData = [
      { Data_Hora: '01/12/2024', Valor_Venda: '100', Maquinas: '', Doc_Cliente: '123' },
      { Data_Hora: '15/12/2024', Valor_Venda: '100', Maquinas: '', Doc_Cliente: '123' },
      { Data_Hora: '30/12/2024', Valor_Venda: '100', Maquinas: '', Doc_Cliente: '123' }
    ];

    const start = new Date(2024, 11, 10); // Dec 10
    const end = new Date(2024, 11, 20);   // Dec 20

    const result = processSales(salesData, { start, end });

    expect(result).toHaveLength(1);
  });

  it('should include isWeekend flag', () => {
    const salesData = [
      { Data_Hora: '21/12/2024', Valor_Venda: '100', Maquinas: '', Doc_Cliente: '123' }, // Saturday
      { Data_Hora: '23/12/2024', Valor_Venda: '100', Maquinas: '', Doc_Cliente: '123' }  // Monday
    ];

    const result = processSales(salesData);

    const saturday = result.find(s => s.dateStr === '21/12/2024');
    const monday = result.find(s => s.dateStr === '23/12/2024');

    expect(saturday.isWeekend).toBe(true);
    expect(monday.isWeekend).toBe(false);
  });
});
