/**
 * Supabase Loader - Loads data from Supabase instead of CSV files
 *
 * VERSION: 2.3
 *
 * CHANGELOG:
 * v2.3 (2025-12-10): Timezone-independent time display
 *   - formatDateForCSV now extracts time directly from ISO string
 *   - NO timezone conversion - displays actual recorded purchase time
 *   - Works correctly regardless of viewer's browser timezone
 *   - Supabase stores Brazil time with +00 offset, we preserve it as-is
 * v2.2 (2025-12-10): Brazil timezone fix (superseded by v2.3)
 * v2.1 (2025-12-10): Fixed pagination - fetch ALL records, not just 1000
 *   - Added fetchAllRecords() helper with pagination
 *   - Updated all loaders to use pagination (Supabase defaults to 1000 rows)
 * v2.0 (2025-12-10): Portuguese RFM segment names
 *
 * This module provides the same interface as csvLoader but fetches
 * data from Supabase tables instead of CSV files.
 *
 * Tables used:
 * - transactions → sales data
 * - customers → customer data + RFM segments
 *
 * Data flow:
 * - Sales, Customer, RFM from Supabase
 * - Weather from CSV (not yet migrated)
 * - Blacklist/Campaigns managed via separate services
 *
 * RFM Segments (Portuguese marketing names - distinct from Churn Risk Levels):
 * - VIP: Champion (R=5, F≥4, M≥4) - Best customers, top tier
 * - Frequente: Loyal (R≥4, F≥3, M≥3) - Regular visitors
 * - Promissor: Potential (R≥3, F≥2, M≥2) - Growing customers
 * - Novato: New customer (≤30 days, ≤2 transactions) - Newcomers
 * - Esfriando: At Risk (R=2, F=2 or M=2) - Cooling off, needs attention
 * - Inativo: Lost (all others) - No recent engagement
 *
 * Churn Risk Levels (computed client-side in customerMetrics.js):
 * - Healthy, Monitor, At Risk, Churning, Lost, New Customer
 */

import Papa from 'papaparse';
import { getCachedData, setCachedData } from './dataCache';
import { normalizeCpf } from './cpfUtils';

// Supabase client (lazy loaded)
let supabase = null;

async function getSupabase() {
  if (!supabase) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase credentials not configured');
      return null;
    }

    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

// ============== CSV FALLBACK (for non-migrated files) ==============

/**
 * Load a CSV file from /data folder (fallback for non-migrated data)
 */
async function loadCSVFile(filename, skipCache = false) {
  // Check cache first
  if (!skipCache) {
    const cachedData = await getCachedData(filename);
    if (cachedData) {
      return cachedData;
    }
  }

  const basePath = import.meta.env.BASE_URL;
  const url = `${basePath}data/${filename}`;

  console.log(`Loading ${filename} from ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: Failed to load ${filename}`);
  }

  const csvText = await response.text();
  if (!csvText || csvText.trim().length === 0) {
    throw new Error(`${filename} is empty`);
  }

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      delimiter: "",
      delimitersToGuess: [',', ';', '\t', '|'],
      transformHeader: (header) => header.trim(),
      complete: async (results) => {
        if (!results.data || results.data.length === 0) {
          reject(new Error(`${filename} contains no valid data`));
          return;
        }
        console.log(`✓ Loaded ${filename}: ${results.data.length} rows`);
        await setCachedData(filename, results.data);
        resolve(results.data);
      },
      error: (error) => {
        reject(new Error(`Error parsing ${filename}: ${error.message}`));
      }
    });
  });
}

// ============== SUPABASE LOADERS ==============

/**
 * Fetch all records from a table with pagination
 * Supabase defaults to 1000 rows per query - this fetches ALL records
 * @param {object} client - Supabase client
 * @param {string} table - Table name
 * @param {string} select - Select clause (default '*')
 * @param {object} orderBy - Order by config { column, ascending }
 * @returns {Promise<Array>} All records from the table
 */
async function fetchAllRecords(client, table, select = '*', orderBy = null) {
  const PAGE_SIZE = 1000;
  let allData = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    let query = client
      .from(table)
      .select(select)
      .range(from, from + PAGE_SIZE - 1);

    if (orderBy) {
      query = query.order(orderBy.column, {
        ascending: orderBy.ascending ?? false,
        nullsFirst: orderBy.nullsFirst ?? false
      });
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch ${table}: ${error.message}`);
    }

    if (data && data.length > 0) {
      allData = allData.concat(data);
      from += PAGE_SIZE;
      hasMore = data.length === PAGE_SIZE; // If we got less than PAGE_SIZE, we're done
    } else {
      hasMore = false;
    }
  }

  return allData;
}

/**
 * Load sales data from Supabase transactions table
 * Transforms column names to match CSV format expected by app
 */
async function loadSalesFromSupabase() {
  const client = await getSupabase();
  if (!client) {
    throw new Error('Supabase not configured');
  }

  console.log('Loading sales from Supabase...');

  // Fetch ALL records with pagination (not just 1000)
  const data = await fetchAllRecords(client, 'transactions', '*', {
    column: 'data_hora',
    ascending: false
  });

  if (!data) {
    throw new Error('Failed to load transactions: no data returned');
  }

  // Transform Supabase format to CSV format expected by the app
  const sales = data.map(row => ({
    // Date/Time - format as DD/MM/YYYY HH:mm:ss for parseBrDate
    Data_Hora: formatDateForCSV(row.data_hora),

    // Values
    Valor_Venda: formatNumberForCSV(row.valor_venda),
    Valor_Pago: formatNumberForCSV(row.valor_pago),

    // Payment
    Meio_de_Pagamento: row.meio_de_pagamento || '',
    Comprovante_cartao: row.comprovante_cartao || '',
    Bandeira_Cartao: row.bandeira_cartao || '',

    // Store/Customer
    Loja: row.loja || '',
    Nome_Cliente: row.nome_cliente || '',
    Doc_Cliente: row.doc_cliente || '',
    Telefone: row.telefone || '',

    // Services
    Maquinas: row.maquinas || '',

    // Coupon
    Usou_Cupom: row.usou_cupom ? 'Sim' : 'Não',
    Codigo_Cupom: row.codigo_cupom || 'n/d'
  }));

  console.log(`✓ Loaded sales from Supabase: ${sales.length} rows`);
  return sales;
}

/**
 * Load customer data from Supabase customers table
 * Transforms column names to match CSV format expected by app
 */
async function loadCustomersFromSupabase() {
  const client = await getSupabase();
  if (!client) {
    throw new Error('Supabase not configured');
  }

  console.log('Loading customers from Supabase...');

  // Fetch ALL records with pagination (not just 1000)
  const data = await fetchAllRecords(client, 'customers', '*', {
    column: 'last_visit',
    ascending: false,
    nullsFirst: false
  });

  if (!data) {
    throw new Error('Failed to load customers: no data returned');
  }

  // Transform Supabase format to CSV format expected by the app
  const customers = data.map(row => ({
    // Identity
    Nome: row.nome || '',
    Documento: row.doc || '',
    Telefone: row.telefone || '',
    Email: row.email || '',

    // Dates - format as DD/MM/YYYY for parseBrDate
    Data_Cadastro: formatDateForCSV(row.data_cadastro),
    Data_Ultima_Compra: row.last_visit ? formatDateOnlyForCSV(row.last_visit) : '',

    // Financial
    Saldo_Carteira: formatNumberForCSV(row.saldo_carteira),
    Total_Compras: formatNumberForCSV(row.total_spent),
    Quantidade_Compras: String(row.transaction_count || 0),

    // Computed fields from Supabase
    risk_level: row.risk_level || '',
    days_since_last_visit: row.days_since_last_visit != null ? String(row.days_since_last_visit) : '',
    avg_transaction_value: formatNumberForCSV(row.avg_transaction_value),
    visit_frequency_days: row.visit_frequency_days != null ? String(row.visit_frequency_days) : ''
  }));

  console.log(`✓ Loaded customers from Supabase: ${customers.length} rows`);
  return customers;
}

/**
 * Load RFM data from customers table
 * RFM segments are computed in Supabase via refresh_customer_metrics()
 *
 * Returns data in the format expected by customerMetrics.js:
 * - segment: RFM segment (Portuguese: VIP, Frequente, Promissor, Novato, Esfriando, Inativo)
 * - Doc_Cliente: Customer CPF
 * - client name: Customer name
 * - phone number: Validated phone (for WhatsApp campaigns)
 * - lastContactDate: Last campaign contact date (preserved from contact_tracking)
 */
async function loadRFMFromSupabase() {
  const client = await getSupabase();
  if (!client) {
    throw new Error('Supabase not configured');
  }

  console.log('Loading RFM from Supabase...');

  // Fetch ALL records with pagination (not just 1000)
  // Use custom query with filter for rfm_segment not null
  const PAGE_SIZE = 1000;
  let allData = [];
  let from = 0;
  let hasMore = true;

  const selectFields = `
    doc,
    nome,
    telefone,
    rfm_segment,
    r_score,
    f_score,
    m_score,
    days_since_last_visit,
    transaction_count,
    total_spent,
    recent_monetary_90d
  `;

  while (hasMore) {
    const { data, error } = await client
      .from('customers')
      .select(selectFields)
      .not('rfm_segment', 'is', null)
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Failed to load RFM data: ${error.message}`);
    }

    if (data && data.length > 0) {
      allData = allData.concat(data);
      from += PAGE_SIZE;
      hasMore = data.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  const data = allData;

  if (!data) {
    throw new Error('Failed to load RFM data: no data returned');
  }

  // Transform to format expected by customerMetrics.js
  // Column names match what extractCPF, extractName, extractPhone look for
  const rfm = data.map(row => ({
    // Required fields for customerMetrics.js
    segment: row.rfm_segment || 'Inativo',
    Doc_Cliente: row.doc,
    'client name': row.nome || '',
    'phone number': row.telefone || '',
    lastContactDate: '', // TODO: Get from contact_tracking if needed

    // Additional RFM data for debugging/display
    r_score: row.r_score,
    f_score: row.f_score,
    m_score: row.m_score,
    Recency: String(row.days_since_last_visit || 0),
    Frequency: String(row.transaction_count || 0),
    Monetary: formatNumberForCSV(row.total_spent),
    Monetary_90d: formatNumberForCSV(row.recent_monetary_90d)
  }));

  console.log(`✓ Loaded RFM from Supabase: ${rfm.length} rows`);
  return rfm;
}

// ============== FORMAT HELPERS ==============

/**
 * Format ISO date to DD/MM/YYYY HH:mm:ss for parseBrDate
 *
 * IMPORTANT: Supabase timestamps represent ACTUAL Brazil purchase times,
 * but are stored with +00 offset. We extract the time components directly
 * from the ISO string WITHOUT any timezone conversion, so the displayed
 * time matches the actual purchase time regardless of viewer's location.
 *
 * Example: "2025-12-07 08:39:03+00" → "07/12/2025 08:39:03"
 * The customer purchased at 08:39 Brazil time, we display 08:39.
 */
function formatDateForCSV(isoDate) {
  if (!isoDate) return '';

  try {
    // Parse ISO string directly WITHOUT timezone conversion
    // Supabase format: "2025-12-07 08:39:03+00" or "2025-12-07T08:39:03+00:00"
    const isoStr = String(isoDate);

    // Extract date and time parts from ISO string directly
    // This preserves the actual recorded time without browser timezone conversion
    const match = isoStr.match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);

    if (match) {
      const [, year, month, day, hours, minutes, seconds] = match;
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }

    // Fallback: try parsing as Date (legacy support)
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return '';

    // Use UTC getters to avoid local timezone conversion
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch {
    return '';
  }
}

/**
 * Format date-only to DD/MM/YYYY
 */
function formatDateOnlyForCSV(dateStr) {
  if (!dateStr) return '';

  try {
    // Handle YYYY-MM-DD format
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('T')[0].split('-');
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  } catch {
    return '';
  }
}

/**
 * Format number with comma as decimal separator (Brazilian format)
 */
function formatNumberForCSV(value) {
  if (value === null || value === undefined) return '0';
  const num = parseFloat(value);
  if (isNaN(num)) return '0';
  return num.toFixed(2).replace('.', ',');
}

// Note: mapRiskLevelToSegment() removed in v2.0
// RFM segments are now computed directly in Supabase via calculate_rfm_segment()
// Portuguese segment names: VIP, Frequente, Promissor, Novato, Esfriando, Inativo

// ============== MAIN LOADER ==============

/**
 * Load all required data
 * - sales, customer, rfm from Supabase
 * - weather from CSV (not migrated to Supabase)
 *
 * Note: blacklist and campaigns are managed separately via apiService.js
 * and blacklistService.js - they're not loaded here.
 *
 * @param {function} onProgress - Progress callback
 * @param {boolean} skipCache - Skip cache and force fresh fetch
 */
export const loadAllData = async (onProgress, skipCache = false) => {
  const data = {};
  let loaded = 0;
  const totalSteps = 4; // sales, rfm, customer, weather

  const updateProgress = (file) => {
    loaded++;
    if (onProgress) {
      onProgress({
        file,
        loaded,
        total: totalSteps,
        percent: Math.round((loaded / totalSteps) * 100)
      });
    }
  };

  try {
    // 1. Load sales from Supabase
    data.sales = await loadSalesFromSupabase();
    updateProgress('sales (Supabase)');

    // 2. Load RFM from Supabase (computed from customers)
    data.rfm = await loadRFMFromSupabase();
    updateProgress('rfm (Supabase)');

    // 3. Load customers from Supabase
    data.customer = await loadCustomersFromSupabase();
    updateProgress('customer (Supabase)');

    // 4. Load weather from CSV (used by Intelligence.jsx for weather impact)
    try {
      data.weather = await loadCSVFile('weather.csv', skipCache);
      updateProgress('weather.csv');
    } catch (error) {
      console.warn('Warning: Could not load weather.csv:', error.message);
      data.weather = [];
      updateProgress('weather.csv');
    }

    return data;
  } catch (error) {
    console.error('Failed to load data:', error);
    throw error;
  }
};

// ============== RE-EXPORTS FOR COMPATIBILITY ==============

export const normalizeDoc = normalizeCpf;

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

export const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 13) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
  }
  return phone;
};

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
