/**
 * Tests for CSV Loader
 * @module csvLoader.test
 *
 * Tests CSV parsing, machine counting, and data formatting
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  normalizeDoc,
  countMachines,
  formatPhone,
  exportToCSV,
  loadCSV,
  loadAllData
} from '../utils/csvLoader';

// Mock the data cache
vi.mock('../utils/dataCache', () => ({
  getCachedData: vi.fn(() => null),
  setCachedData: vi.fn(() => Promise.resolve())
}));

// Mock PapaParse for loadCSV tests
vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn((csvText, options) => {
      // Simulate parsing
      const data = [
        { col1: 'value1', col2: 'value2' },
        { col1: 'value3', col2: 'value4' }
      ];
      options.complete({ data, errors: [] });
    }),
    unparse: vi.fn((data) => {
      // Simple CSV conversion for testing
      if (!data || data.length === 0) return '';
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => Object.values(row).join(','));
      return [headers, ...rows].join('\n');
    })
  }
}));

describe('normalizeDoc (CPF normalization)', () => {
  it('should remove non-digit characters', () => {
    expect(normalizeDoc('123.456.789-01')).toBe('12345678901');
  });

  it('should pad short CPFs with leading zeros', () => {
    expect(normalizeDoc('12345678901')).toBe('12345678901');
    expect(normalizeDoc('1234567890')).toBe('01234567890'); // 10 digits -> pad
  });

  it('should handle numeric input', () => {
    expect(normalizeDoc(12345678901)).toBe('12345678901');
  });

  it('should return empty string for invalid input', () => {
    expect(normalizeDoc(null)).toBe('');
    expect(normalizeDoc(undefined)).toBe('');
    expect(normalizeDoc('')).toBe('');
  });

  it('should handle CPF with spaces', () => {
    expect(normalizeDoc(' 123.456.789-01 ')).toBe('12345678901');
  });
});

describe('countMachines', () => {
  describe('washing machine counting', () => {
    it('should count single washer', () => {
      const result = countMachines('Lavadora 1');
      expect(result.wash).toBe(1);
      expect(result.dry).toBe(0);
      expect(result.total).toBe(1);
    });

    it('should count multiple washers', () => {
      const result = countMachines('Lavadora 1, Lavadora 2, Lavadora 3');
      expect(result.wash).toBe(3);
    });
  });

  describe('dryer counting', () => {
    it('should count single dryer', () => {
      const result = countMachines('Secadora 1');
      expect(result.dry).toBe(1);
      expect(result.wash).toBe(0);
      expect(result.total).toBe(1);
    });

    it('should count multiple dryers', () => {
      const result = countMachines('Secadora 1, Secadora 2');
      expect(result.dry).toBe(2);
    });
  });

  describe('mixed machine counting', () => {
    it('should count both washers and dryers', () => {
      const result = countMachines('Lavadora 1, Secadora 1, Lavadora 2');
      expect(result.wash).toBe(2);
      expect(result.dry).toBe(1);
      expect(result.total).toBe(3);
    });

    it('should handle various formats', () => {
      const result = countMachines('LAVADORA 1, SECADORA 2');
      expect(result.wash).toBe(1);
      expect(result.dry).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should return zeros for null/undefined', () => {
      expect(countMachines(null)).toEqual({ wash: 0, dry: 0, total: 0 });
      expect(countMachines(undefined)).toEqual({ wash: 0, dry: 0, total: 0 });
    });

    it('should return zeros for empty string', () => {
      expect(countMachines('')).toEqual({ wash: 0, dry: 0, total: 0 });
    });

    it('should return zeros for unrecognized machine types', () => {
      const result = countMachines('Recarga');
      expect(result.wash).toBe(0);
      expect(result.dry).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should handle whitespace', () => {
      const result = countMachines('  Lavadora 1 , Secadora 2  ');
      expect(result.wash).toBe(1);
      expect(result.dry).toBe(1);
    });
  });
});

describe('formatPhone', () => {
  describe('Brazilian phone formatting', () => {
    it('should format 13-digit phone (with country code)', () => {
      const result = formatPhone('+5554999233909');
      expect(result).toBe('+55 54 99923-3909');
    });

    it('should format number without plus sign', () => {
      const result = formatPhone('5554999233909');
      expect(result).toBe('+55 54 99923-3909');
    });
  });

  describe('edge cases', () => {
    it('should return empty string for null/undefined', () => {
      expect(formatPhone(null)).toBe('');
      expect(formatPhone(undefined)).toBe('');
    });

    it('should return original for non-standard lengths', () => {
      expect(formatPhone('12345')).toBe('12345');
      expect(formatPhone('123456789012345')).toBe('123456789012345');
    });

    it('should strip non-digit characters before processing', () => {
      const result = formatPhone('+55 (54) 99923-3909');
      expect(result).toBe('+55 54 99923-3909');
    });
  });
});

describe('exportToCSV', () => {
  let mockCreateElement;
  let mockCreateObjectURL;
  let mockRevokeObjectURL;
  let mockClick;

  beforeEach(() => {
    mockClick = vi.fn();
    mockCreateElement = vi.fn(() => ({
      click: mockClick,
      href: '',
      download: ''
    }));
    mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
    mockRevokeObjectURL = vi.fn();

    // Mock DOM APIs
    global.document = { createElement: mockCreateElement };
    global.window = {
      URL: {
        createObjectURL: mockCreateObjectURL,
        revokeObjectURL: mockRevokeObjectURL
      }
    };
    global.Blob = class MockBlob {
      constructor(content, options) {
        this.content = content;
        this.options = options;
      }
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create and click download link', () => {
    const data = [{ name: 'John', age: 30 }];
    exportToCSV(data, 'test.csv');

    expect(mockCreateElement).toHaveBeenCalledWith('a');
    expect(mockClick).toHaveBeenCalled();
  });

  it('should set correct filename', () => {
    const data = [{ name: 'John' }];
    exportToCSV(data, 'export.csv');

    const anchor = mockCreateElement.mock.results[0].value;
    expect(anchor.download).toBe('export.csv');
  });

  it('should create blob URL', () => {
    const data = [{ name: 'John' }];
    exportToCSV(data, 'test.csv');

    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it('should revoke blob URL after click', () => {
    const data = [{ name: 'John' }];
    exportToCSV(data, 'test.csv');

    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});

describe('loadCSV', () => {
  let mockFetch;

  beforeEach(() => {
    // Mock import.meta.env
    vi.stubGlobal('import', {
      meta: {
        env: {
          BASE_URL: '/'
        }
      }
    });

    mockFetch = vi.fn(() => Promise.resolve({
      ok: true,
      text: () => Promise.resolve('col1,col2\nvalue1,value2')
    }));
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return cached data if available', async () => {
    const { getCachedData } = await import('../utils/dataCache');
    getCachedData.mockResolvedValueOnce([{ cached: true }]);

    const result = await loadCSV('test.csv');

    expect(result).toEqual([{ cached: true }]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should fetch when cache is skipped', async () => {
    const { getCachedData } = await import('../utils/dataCache');
    getCachedData.mockResolvedValueOnce([{ cached: true }]);

    await loadCSV('test.csv', true); // skipCache = true

    expect(mockFetch).toHaveBeenCalled();
  });

  it('should throw on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    });

    await expect(loadCSV('notfound.csv')).rejects.toThrow('HTTP 404');
  });

  it('should throw on empty CSV', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('')
    });

    await expect(loadCSV('empty.csv')).rejects.toThrow('vazio');
  });
});

describe('loadAllData', () => {
  let mockFetch;

  beforeEach(() => {
    mockFetch = vi.fn(() => Promise.resolve({
      ok: true,
      text: () => Promise.resolve('col1,col2\nvalue1,value2')
    }));
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call progress callback for each file', async () => {
    const onProgress = vi.fn();

    await loadAllData(onProgress, true);

    // Should have been called 4 times (sales, rfm, customer, weather)
    expect(onProgress).toHaveBeenCalledTimes(4);
  });

  it('should report progress percentage', async () => {
    const progressCalls = [];
    const onProgress = (progress) => progressCalls.push(progress);

    await loadAllData(onProgress, true);

    // Check first call (25%)
    expect(progressCalls[0].percent).toBe(25);
    // Check last call (100%)
    expect(progressCalls[3].percent).toBe(100);
  });

  it('should return object with data keys', async () => {
    const result = await loadAllData(null, true);

    expect(result).toHaveProperty('sales');
    expect(result).toHaveProperty('rfm');
    expect(result).toHaveProperty('customer');
    expect(result).toHaveProperty('weather');
  });

  it('should throw with file context on error', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('col1\nvalue1')
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500
      });

    await expect(loadAllData(null, true)).rejects.toThrow('Falha ao carregar');
  });
});
