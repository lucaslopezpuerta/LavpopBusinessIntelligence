/**
 * Tests for Customer Metrics Calculator
 * @module customerMetrics.test
 *
 * Tests RFM segmentation, churn prediction, and customer analytics
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateCustomerMetrics,
  getSegmentStats,
  getTopAtRiskCustomers,
  getRFMCoordinates,
  getChurnHistogramData,
  getRetentionCohorts,
  getAcquisitionTrend,
  RISK_LABELS,
  RFM_SEGMENT_LABELS
} from '../utils/customerMetrics';

// Mock the logger to avoid console noise
vi.mock('../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('RISK_LABELS', () => {
  it('should have all expected risk levels', () => {
    expect(RISK_LABELS).toHaveProperty('Healthy');
    expect(RISK_LABELS).toHaveProperty('Monitor');
    expect(RISK_LABELS).toHaveProperty('At Risk');
    expect(RISK_LABELS).toHaveProperty('Churning');
    expect(RISK_LABELS).toHaveProperty('New Customer');
    expect(RISK_LABELS).toHaveProperty('Lost');
  });

  it('should have Portuguese translations', () => {
    expect(RISK_LABELS['Healthy'].pt).toBe('Saudável');
    expect(RISK_LABELS['Monitor'].pt).toBe('Monitorar');
    expect(RISK_LABELS['At Risk'].pt).toBe('Em Risco');
    expect(RISK_LABELS['Churning'].pt).toBe('Crítico');
    expect(RISK_LABELS['New Customer'].pt).toBe('Novo');
    expect(RISK_LABELS['Lost'].pt).toBe('Perdido');
  });

  it('should have color and CSS class properties', () => {
    const healthyLabel = RISK_LABELS['Healthy'];
    expect(healthyLabel.color).toBe('green');
    expect(healthyLabel.bgClass).toBe('bg-green-100');
    expect(healthyLabel.textClass).toBe('text-green-700');
    expect(healthyLabel.borderColor).toBe('#10b981');
  });
});

describe('RFM_SEGMENT_LABELS', () => {
  it('should have all Portuguese segment names', () => {
    expect(RFM_SEGMENT_LABELS).toHaveProperty('VIP');
    expect(RFM_SEGMENT_LABELS).toHaveProperty('Frequente');
    expect(RFM_SEGMENT_LABELS).toHaveProperty('Promissor');
    expect(RFM_SEGMENT_LABELS).toHaveProperty('Novato');
    expect(RFM_SEGMENT_LABELS).toHaveProperty('Esfriando');
    expect(RFM_SEGMENT_LABELS).toHaveProperty('Inativo');
  });

  it('should have English equivalents', () => {
    expect(RFM_SEGMENT_LABELS['VIP'].en).toBe('Champion');
    expect(RFM_SEGMENT_LABELS['Frequente'].en).toBe('Loyal');
    expect(RFM_SEGMENT_LABELS['Promissor'].en).toBe('Potential');
    expect(RFM_SEGMENT_LABELS['Novato'].en).toBe('New');
    expect(RFM_SEGMENT_LABELS['Esfriando'].en).toBe('At Risk');
    expect(RFM_SEGMENT_LABELS['Inativo'].en).toBe('Lost');
  });
});

describe('calculateCustomerMetrics', () => {
  // Create test sales data with Brazilian date format
  const createSalesData = (doc, dates, values) => {
    return dates.map((date, i) => ({
      Doc_Cliente: doc,
      Data: date,
      Valor_Venda: values[i] || '50,00',
      Valor_Pago: values[i] || '50,00',
      Maquina: 'Lavadora 1'
    }));
  };

  describe('basic customer processing', () => {
    it('should return zero counts for empty sales data', () => {
      const result = calculateCustomerMetrics([]);
      expect(result.totalCustomers).toBe(0);
      expect(result.activeCount).toBe(0);
      expect(result.lostCount).toBe(0);
    });

    it('should identify unique customers by CPF', () => {
      const salesData = [
        ...createSalesData('12345678901', ['01/12/2024'], ['100,00']),
        ...createSalesData('98765432100', ['01/12/2024'], ['50,00']),
        ...createSalesData('12345678901', ['15/12/2024'], ['75,00'])
      ];

      const result = calculateCustomerMetrics(salesData);
      expect(result.totalCustomers).toBe(2);
    });

    it('should calculate total spending per customer', () => {
      const salesData = [
        ...createSalesData('12345678901', ['01/12/2024', '15/12/2024'], ['100,00', '50,00'])
      ];

      const result = calculateCustomerMetrics(salesData);
      const customer = result.allCustomers[0];
      expect(customer.grossTotal).toBe(150);
    });

    it('should parse Brazilian number format correctly', () => {
      const salesData = [{
        Doc_Cliente: '12345678901',
        Data: '01/12/2024',
        Valor_Venda: '1.234,56', // Brazilian format: 1,234.56
        Valor_Pago: '1.234,56',
        Maquina: ''
      }];

      const result = calculateCustomerMetrics(salesData);
      expect(result.allCustomers[0].grossTotal).toBe(1234.56);
    });
  });

  describe('risk level classification', () => {
    it('should classify single-visit customers as New Customer', () => {
      // Use a date from yesterday (recent enough to not be Lost)
      const yesterday = formatTestDate(daysAgo(new Date(), 1));
      const salesData = createSalesData('12345678901', [yesterday], ['50,00']);
      const result = calculateCustomerMetrics(salesData);
      expect(result.allCustomers[0].riskLevel).toBe('New Customer');
    });

    it('should count new customers correctly', () => {
      // Two single-visit customers with recent dates
      const yesterday = formatTestDate(daysAgo(new Date(), 1));
      const twoDaysAgo = formatTestDate(daysAgo(new Date(), 2));
      const salesData = [
        ...createSalesData('12345678901', [yesterday], ['50,00']),
        ...createSalesData('98765432100', [twoDaysAgo], ['50,00'])
      ];
      const result = calculateCustomerMetrics(salesData);
      expect(result.newCustomerCount).toBe(2);
    });
  });

  describe('visit tracking', () => {
    it('should count unique visit days', () => {
      // Same customer, multiple transactions on same day should count as 1 visit
      const day1 = formatTestDate(daysAgo(new Date(), 10));
      const day2 = formatTestDate(daysAgo(new Date(), 5));
      const salesData = [
        { Doc_Cliente: '12345678901', Data: day1, Valor_Venda: '50,00', Valor_Pago: '50,00', Maquina: '' },
        { Doc_Cliente: '12345678901', Data: day1, Valor_Venda: '30,00', Valor_Pago: '30,00', Maquina: '' },
        { Doc_Cliente: '12345678901', Data: day2, Valor_Venda: '40,00', Valor_Pago: '40,00', Maquina: '' }
      ];

      const result = calculateCustomerMetrics(salesData);
      const customer = result.allCustomers[0];
      expect(customer.visits).toBe(2); // 2 unique days
      expect(customer.transactions).toBe(3); // 3 total transactions
    });

    it('should calculate services per visit using unique visits', () => {
      const day1 = formatTestDate(daysAgo(new Date(), 10));
      const day2 = formatTestDate(daysAgo(new Date(), 5));
      const salesData = [
        { Doc_Cliente: '12345678901', Data: day1, Valor_Venda: '50,00', Valor_Pago: '50,00', Maquina: 'Lavadora 1, Secadora 1' },
        { Doc_Cliente: '12345678901', Data: day1, Valor_Venda: '30,00', Valor_Pago: '30,00', Maquina: 'Lavadora 2' },
        { Doc_Cliente: '12345678901', Data: day2, Valor_Venda: '40,00', Valor_Pago: '40,00', Maquina: 'Secadora 2' }
      ];

      const result = calculateCustomerMetrics(salesData);
      const customer = result.allCustomers[0];
      // 4 total services / 2 visits = 2.0 services per visit
      expect(parseFloat(customer.servicesPerVisit)).toBe(2.0);
    });
  });

  describe('machine counting', () => {
    it('should count wash and dry machines separately', () => {
      const recentDate = formatTestDate(daysAgo(new Date(), 3));
      const salesData = [{
        Doc_Cliente: '12345678901',
        Data: recentDate,
        Valor_Venda: '50,00',
        Valor_Pago: '50,00',
        Maquina: 'Lavadora 1, Lavadora 2, Secadora 1'
      }];

      const result = calculateCustomerMetrics(salesData);
      const customer = result.allCustomers[0];
      expect(customer.washServices).toBe(2);
      expect(customer.dryServices).toBe(1);
      expect(customer.totalServices).toBe(3);
    });

    it('should calculate wash/dry percentages', () => {
      const recentDate = formatTestDate(daysAgo(new Date(), 3));
      const salesData = [{
        Doc_Cliente: '12345678901',
        Data: recentDate,
        Valor_Venda: '50,00',
        Valor_Pago: '50,00',
        Maquina: 'Lavadora 1, Secadora 1'
      }];

      const result = calculateCustomerMetrics(salesData);
      const customer = result.allCustomers[0];
      expect(parseFloat(customer.washPercentage)).toBe(50.0);
      expect(parseFloat(customer.dryPercentage)).toBe(50.0);
    });
  });

  describe('phone validation', () => {
    it('should track valid phone count', () => {
      const recentDate = formatTestDate(daysAgo(new Date(), 3));
      const rfmData = [
        { Doc_Cliente: '12345678901', 'phone number': '54996923504', segment: 'VIP' },
        { Doc_Cliente: '98765432100', 'phone number': '123', segment: 'Novato' } // invalid
      ];
      const salesData = [
        ...createSalesData('12345678901', [recentDate], ['50,00']),
        ...createSalesData('98765432100', [recentDate], ['50,00'])
      ];

      const result = calculateCustomerMetrics(salesData, rfmData);
      expect(result.validPhoneCount).toBe(1);
    });
  });

  describe('RFM segment merging', () => {
    it('should merge RFM segment from rfmData', () => {
      const recentDate = formatTestDate(daysAgo(new Date(), 3));
      const rfmData = [{
        Doc_Cliente: '12345678901',
        segment: 'VIP',
        'client name': 'Maria Silva'
      }];
      const salesData = createSalesData('12345678901', [recentDate], ['50,00']);

      const result = calculateCustomerMetrics(salesData, rfmData);
      expect(result.allCustomers[0].segment).toBe('VIP');
    });

    it('should use name from RFM when sales name is auto-generated', () => {
      const recentDate = formatTestDate(daysAgo(new Date(), 3));
      const rfmData = [{
        Doc_Cliente: '12345678901',
        segment: 'VIP',
        'client name': 'Maria Silva'
      }];
      // Sales data without name
      const salesData = [{
        Doc_Cliente: '12345678901',
        Data: recentDate,
        Valor_Venda: '50,00',
        Valor_Pago: '50,00',
        Maquina: ''
      }];

      const result = calculateCustomerMetrics(salesData, rfmData);
      expect(result.allCustomers[0].name).toBe('Maria Silva');
    });
  });
});

describe('getSegmentStats', () => {
  it('should calculate segment distribution', () => {
    const customerMetrics = {
      activeCount: 3,
      activeCustomers: [
        { segment: 'VIP', netTotal: 500, totalServices: 10 },
        { segment: 'VIP', netTotal: 300, totalServices: 6 },
        { segment: 'Novato', netTotal: 100, totalServices: 2 }
      ]
    };

    const stats = getSegmentStats(customerMetrics);

    const vipStats = stats.find(s => s.segment === 'VIP');
    expect(vipStats.count).toBe(2);
    expect(vipStats.totalSpending).toBe(800);
    expect(vipStats.avgSpending).toBe(400);
  });

  it('should calculate percentage correctly', () => {
    const customerMetrics = {
      activeCount: 4,
      activeCustomers: [
        { segment: 'VIP', netTotal: 100, totalServices: 2 },
        { segment: 'VIP', netTotal: 100, totalServices: 2 },
        { segment: 'Novato', netTotal: 50, totalServices: 1 },
        { segment: 'Novato', netTotal: 50, totalServices: 1 }
      ]
    };

    const stats = getSegmentStats(customerMetrics);
    expect(stats[0].percentage).toBe(50); // Each segment is 50%
  });

  it('should sort by count descending', () => {
    const customerMetrics = {
      activeCount: 4,
      activeCustomers: [
        { segment: 'Novato', netTotal: 50, totalServices: 1 },
        { segment: 'VIP', netTotal: 100, totalServices: 2 },
        { segment: 'VIP', netTotal: 100, totalServices: 2 },
        { segment: 'VIP', netTotal: 100, totalServices: 2 }
      ]
    };

    const stats = getSegmentStats(customerMetrics);
    expect(stats[0].segment).toBe('VIP'); // VIP has 3, Novato has 1
  });
});

describe('getTopAtRiskCustomers', () => {
  it('should return at-risk and churning customers sorted by spending', () => {
    const customerMetrics = {
      activeCustomers: [
        { riskLevel: 'Healthy', netTotal: 1000 },
        { riskLevel: 'At Risk', netTotal: 500 },
        { riskLevel: 'Churning', netTotal: 800 },
        { riskLevel: 'At Risk', netTotal: 200 }
      ]
    };

    const result = getTopAtRiskCustomers(customerMetrics, 10);

    expect(result).toHaveLength(3); // Only At Risk and Churning
    expect(result[0].netTotal).toBe(800); // Highest spending first
    expect(result[1].netTotal).toBe(500);
    expect(result[2].netTotal).toBe(200);
  });

  it('should respect limit parameter', () => {
    const customerMetrics = {
      activeCustomers: [
        { riskLevel: 'At Risk', netTotal: 500 },
        { riskLevel: 'Churning', netTotal: 800 },
        { riskLevel: 'At Risk', netTotal: 200 }
      ]
    };

    const result = getTopAtRiskCustomers(customerMetrics, 2);
    expect(result).toHaveLength(2);
  });
});

describe('getRFMCoordinates', () => {
  it('should map customers to RFM coordinates', () => {
    const customers = [{
      doc: '12345678901',
      name: 'Maria',
      daysSinceLastVisit: 15,
      netTotal: 500,
      visits: 10,
      riskLevel: 'Healthy',
      segment: 'VIP',
      phone: '+5554996923504'
    }];

    const coords = getRFMCoordinates(customers);

    expect(coords).toHaveLength(1);
    expect(coords[0]).toEqual({
      id: '12345678901',
      name: 'Maria',
      x: 15,           // Recency
      y: 500,          // Monetary
      r: 10,           // Frequency (visits)
      status: 'Healthy',
      segment: 'VIP',
      phone: '+5554996923504'
    });
  });
});

describe('getChurnHistogramData', () => {
  it('should create buckets of 10 days each', () => {
    const customers = [
      { avgDaysBetween: 5 },
      { avgDaysBetween: 15 },
      { avgDaysBetween: 25 },
      { avgDaysBetween: 55 }
    ];

    const buckets = getChurnHistogramData(customers);

    expect(buckets[0].bin).toBe('0-10');
    expect(buckets[0].count).toBe(1); // 5 days
    expect(buckets[1].bin).toBe('10-20');
    expect(buckets[1].count).toBe(1); // 15 days
    expect(buckets[2].bin).toBe('20-30');
    expect(buckets[2].count).toBe(1); // 25 days
  });

  it('should label buckets by risk zone', () => {
    const buckets = getChurnHistogramData([]);

    expect(buckets[0].label).toBe('Safe');    // 0-10
    expect(buckets[2].label).toBe('Safe');    // 20-30
    expect(buckets[3].label).toBe('Warning'); // 30-40
    expect(buckets[5].label).toBe('Warning'); // 50-60
    expect(buckets[6].label).toBe('Danger');  // 60-70
  });

  it('should filter out customers without avgDaysBetween', () => {
    const customers = [
      { avgDaysBetween: 10 },
      { avgDaysBetween: null },
      { avgDaysBetween: 0 },
      { avgDaysBetween: 20 }
    ];

    const buckets = getChurnHistogramData(customers);
    const totalCount = buckets.reduce((sum, b) => sum + b.count, 0);
    expect(totalCount).toBe(2); // Only 10 and 20 are valid
  });

  it('should track customer IDs per bucket', () => {
    const customers = [
      { doc: 'A', avgDaysBetween: 5 },
      { doc: 'B', avgDaysBetween: 8 }
    ];

    const buckets = getChurnHistogramData(customers);
    expect(buckets[0].customerIds).toContain('A');
    expect(buckets[0].customerIds).toContain('B');
  });
});

describe('getRetentionCohorts', () => {
  it('should return zeros for empty data', () => {
    const result = getRetentionCohorts([]);
    expect(result).toEqual({ rate30: 0, rate60: 0, rate90: 0 });
  });

  it('should return retention rates object', () => {
    // Create sample data that spans enough time for cohort analysis
    const salesData = [];
    const today = new Date();

    // Customer A: visited 45 days ago, returned 20 days ago
    const customer1Doc = '12345678901';
    salesData.push({
      Doc_Cliente: customer1Doc,
      Data_Hora: formatTestDate(daysAgo(today, 45))
    });
    salesData.push({
      Doc_Cliente: customer1Doc,
      Data_Hora: formatTestDate(daysAgo(today, 20))
    });

    const result = getRetentionCohorts(salesData);

    expect(result).toHaveProperty('rate30');
    expect(result).toHaveProperty('rate60');
    expect(result).toHaveProperty('rate90');
    expect(typeof result.rate30).toBe('number');
  });
});

describe('getAcquisitionTrend', () => {
  it('should return daily acquisition counts', () => {
    const today = new Date();
    const customers = [
      { firstVisit: daysAgo(today, 5), doc: 'A' },
      { firstVisit: daysAgo(today, 5), doc: 'B' },
      { firstVisit: daysAgo(today, 10), doc: 'C' }
    ];

    const result = getAcquisitionTrend(customers, 30);

    expect(result).toHaveProperty('daily');
    expect(result).toHaveProperty('newCustomerIds');
    expect(result.newCustomerIds).toContain('A');
    expect(result.newCustomerIds).toContain('B');
    expect(result.newCustomerIds).toContain('C');
  });

  it('should filter to specified day range', () => {
    const today = new Date();
    const customers = [
      { firstVisit: daysAgo(today, 5), doc: 'A' },
      { firstVisit: daysAgo(today, 40), doc: 'B' } // Outside 30-day range
    ];

    const result = getAcquisitionTrend(customers, 30);

    expect(result.newCustomerIds).toContain('A');
    expect(result.newCustomerIds).not.toContain('B');
  });

  it('should track customer IDs per day', () => {
    const today = new Date();
    const targetDate = daysAgo(today, 5);
    const customers = [
      { firstVisit: targetDate, doc: 'A' },
      { firstVisit: targetDate, doc: 'B' }
    ];

    const result = getAcquisitionTrend(customers, 30);

    // Find the day entry that should have the customers
    const dayEntry = result.daily.find(d => d.count > 0);
    expect(dayEntry).toBeDefined();
    expect(dayEntry.customerIds).toContain('A');
    expect(dayEntry.customerIds).toContain('B');
  });
});

// Helper functions for date manipulation in tests
function daysAgo(fromDate, days) {
  const date = new Date(fromDate);
  date.setDate(date.getDate() - days);
  return date;
}

function formatTestDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
