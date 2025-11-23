/**
 * CSV Loader - Fetches and parses CSV files from /data folder
 * Uses PapaParse for robust CSV parsing
 * 
 * VERSION: 2.1
 * 
 * CHANGELOG:
 * v2.1 (2025-11-23): Migrated to IndexedDB (async cache)
 * v2.0 (2025-11-23): Added localStorage caching for performance
 * v1.2 (2025-11-15): Added auto-delimiter detection
 * v1.1 (Previous): Fixed base path and added detailed error messages
 * v1.0 (Previous): Initial implementation
 */

import Papa from 'papaparse';
import { getCachedData, setCachedData } from './dataCache';

/**
 * Load a single CSV file
 * @param {string} filename - CSV filename
 * @param {boolean} skipCache - Skip cache and force fresh fetch
 */
export const loadCSV = async (filename, skipCache = false) => {
  try {
    // Check cache first (unless skipping)
    if (!skipCache) {
      const cachedData = await getCachedData(filename);
      if (cachedData) {
        return cachedData;
      }
    }

    // Use base path from Vite config (/LavpopBusinessIntelligence/)
    const basePath = import.meta.env.BASE_URL;
    const url = `${basePath}data/${filename}`;

    console.log(`Loading ${filename} from ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Não foi possível carregar ${filename}. URL: ${url}`);
    }

    const csvText = await response.text();

    if (!csvText || csvText.trim().length === 0) {
      throw new Error(`${filename} está vazio`);
    }

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        delimiter: "", // Auto-detect delimiter (works with both , and ;)
        delimitersToGuess: [',', ';', '\t', '|'], // Support multiple delimiters
        transformHeader: (header) => header.trim(),
        complete: async (results) => {
          if (results.errors.length > 0) {
            console.warn(`Avisos ao processar ${filename}:`, results.errors);
          }

          if (!results.data || results.data.length === 0) {
            reject(new Error(`${filename} não contém dados válidos`));
            return;
          }

          console.log(`✓ Loaded ${filename}: ${results.data.length} rows`);

          // Cache the parsed data (async now)
          await setCachedData(filename, results.data);

          resolve(results.data);
        },
        error: (error) => {
          reject(new Error(`Erro ao processar ${filename}: ${error.message}`));
        }
      });
    });
  } catch (error) {
    console.error(`Erro ao carregar ${filename}:`, error);
    throw error;
  }
};

/**
 * Load all required CSV files
 * @param {function} onProgress - Progress callback
 * @param {boolean} skipCache - Skip cache and force fresh fetch
 */
export const loadAllData = async (onProgress, skipCache = false) => {
  const files = [
    'sales.csv',
    'rfm.csv',
    'customer.csv',
    'blacklist.csv',
    'twilio.csv',
    'weather.csv',
    'campaigns.csv'
  ];

  const data = {};
  let loaded = 0;

  for (const file of files) {
    try {
      const key = file.replace('.csv', '');
      data[key] = await loadCSV(file, skipCache);
      loaded++;

      if (onProgress) {
        onProgress({
          file,
          loaded,
          total: files.length,
          percent: Math.round((loaded / files.length) * 100)
        });
      }
    } catch (error) {
      // Re-throw with more context
      throw new Error(`Falha ao carregar ${file}: ${error.message}`);
    }
  }

  return data;
};

/**
 * Normalize document (CPF) format
 */
export const normalizeDoc = (doc) => {
  if (!doc) return '';
  const cleaned = String(doc).replace(/\D/g, '');
  if (cleaned.length > 0 && cleaned.length <= 11) {
    return cleaned.padStart(11, '0');
  }
  return cleaned;
};

/**
 * Count machines from string
 * Example: "Lavadora: 1, Secadora: 2" -> { wash: 1, dry: 2, total: 3 }
 */
export const countMachines = (str) => {
  if (!str) return { wash: 0, dry: 0, total: 0 };

  const machineStr = String(str).toLowerCase().trim();
  const machines = machineStr.split(',').map(m => m.trim());

  let wash = 0, dry = 0;

  machines.forEach(m => {
    if (m.includes('lavadora')) wash++;
    else if (m.includes('secadora')) dry++;
  });

  return { wash, dry, total: wash + dry };
};

/**
 * Format phone number
 * +5554999233909 -> +55 54 99923-3909
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 13) { // +55 + 11 digits
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
  }

  return phone;
};

/**
 * Export data to CSV
 */
export const exportToCSV = (data, filename) => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};
