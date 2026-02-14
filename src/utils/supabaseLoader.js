/**
 * Supabase Loader - Loads all data from Supabase
 *
 * VERSION: 3.4
 *
 * CHANGELOG:
 * v3.4 (2026-01-12): Reduced cache TTL for realtime updates
 *   - CACHE_TTL reduced from 24h to 4h
 *   - Works with new realtime transaction subscription
 *   - Data stays fresher with 1-2x daily POS updates
 * v3.3 (2025-12-28): Preload dailyRevenue during app initialization
 *   - dailyRevenue now included in loadAllData output
 *   - Eliminates separate fetch on Intelligence tab navigation
 *   - Last 60 days of daily_revenue preloaded for service breakdown
 * v3.2 (2025-12-28): Added fetchDailyRevenue for service breakdown
 *   - New export: fetchDailyRevenue(startDate, endDate)
 *   - Uses daily_revenue Supabase view (pre-aggregated wash/dry/recarga)
 * v3.1 (2025-12-21): Stale-While-Revalidate caching
 *   - Return cached data immediately if available (instant render)
 *   - Background fetch updates cache silently
 *   - 24-hour cache TTL (data updates daily anyway)
 *   - Offline support via IndexedDB cache
 * v3.0 (2025-12-20): Removed all CSV/localStorage loading
 *   - All data now comes exclusively from Supabase
 *   - Removed loadCSVFile fallback function
 *   - Weather data loaded via useWeatherHistory hook from weather_daily_metrics
 * v2.6 (2025-12-20): Removed weather CSV loading
 * v2.5 (2025-12-16): Added lastImportedAt metadata
 * v2.4 (2025-12-14): Parallel data loading for mobile performance
 * v2.3 (2025-12-10): Timezone-independent time display
 * v2.1 (2025-12-10): Fixed pagination - fetch ALL records
 * v2.0 (2025-12-10): Portuguese RFM segment names
 *
 * Tables used:
 * - transactions → sales data
 * - customers → customer data + RFM segments
 * - weather_daily_metrics → weather data (via useWeatherHistory hook)
 *
 * Data flow:
 * - Sales, Customer, RFM from Supabase (parallel loading)
 * - Weather: useWeatherHistory hook (not in loadAllData)
 * - Blacklist/Campaigns: separate services (apiService.js)
 *
 * RFM Segments (Portuguese):
 * - VIP, Frequente, Promissor, Novato, Esfriando, Inativo
 *
 * Churn Risk Levels (customerMetrics.js):
 * - Healthy, Monitor, At Risk, Churning, Lost, New Customer
 */

import Papa from 'papaparse';
import { normalizeCpf } from './cpfUtils';
import { getSupabaseClient } from './supabaseClient';
import { toBrazilDateString } from './dateUtils';
import { getCachedData, setCachedData } from './dataCache';

// Use shared Supabase client to avoid multiple GoTrueClient instances
const getSupabase = getSupabaseClient;

// ============== CACHE CONFIGURATION ==============
const CACHE_KEY_SALES = 'supabase_transactions';
const CACHE_KEY_CUSTOMERS = 'supabase_customers';
const CACHE_KEY_RFM = 'supabase_rfm_v2'; // v2: added risk_level, saldo_carteira columns
const CACHE_KEY_DAILY_REVENUE = 'supabase_daily_revenue';
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours (data updates 1-2x daily, realtime fills gaps)

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
    recent_monetary_90d,
    welcome_sent_at,
    post_visit_sent_at,
    risk_level,
    saldo_carteira,
    visit_count
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
    welcomeSentAt: row.welcome_sent_at || null,
    postVisitSentAt: row.post_visit_sent_at || null,
    dbRiskLevel: row.risk_level || null,
    dbWalletBalance: row.saldo_carteira || 0,
    dbVisitCount: row.visit_count || 0,

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

/**
 * Fetch daily revenue data for service breakdown analysis
 * Uses the daily_revenue Supabase view which pre-aggregates:
 * - washes, drys, recargas counts
 * - service_revenue, recarga_revenue, total_revenue
 * - cashback_given, coupon_uses
 *
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @returns {Promise<Array>} Daily revenue records
 */
export async function fetchDailyRevenue(startDate, endDate) {
  const client = await getSupabase();
  if (!client) {
    throw new Error('Supabase not configured');
  }

  const startStr = toBrazilDateString(startDate);
  const endStr = toBrazilDateString(endDate);

  console.log(`[fetchDailyRevenue] Fetching ${startStr} to ${endStr}...`);

  // Use materialized view for better performance
  const { data, error } = await client
    .from('mv_daily_revenue')
    .select('*')
    .gte('date', startStr)
    .lte('date', endStr)
    .order('date', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch mv_daily_revenue: ${error.message}`);
  }

  console.log(`✓ Loaded mv_daily_revenue: ${data?.length || 0} days`);
  return data || [];
}

/**
 * Fetch last 60 days of daily revenue for app initialization
 * Used to preload data for Intelligence tab service breakdown
 * @returns {Promise<Array>} Daily revenue records
 */
async function loadDailyRevenueForInit() {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 60);
  return fetchDailyRevenue(startDate, endDate);
}

// ============== FORMAT HELPERS ==============

/**
 * Format ISO timestamp to Brazilian DD/MM/YYYY HH:mm:ss format.
 *
 * Converts UTC timestamp to Brazil timezone (America/Sao_Paulo, UTC-3).
 * This ensures the displayed time matches when the customer actually visited.
 *
 * Example: "2026-02-02T00:46:00+00" (UTC) → "01/02/2026 21:46:00" (Brazil)
 * (00:46 UTC = 21:46 Brazil previous day)
 *
 * Note: Uses Intl.DateTimeFormat which handles DST correctly,
 * though Brazil suspended DST in 2019.
 */
function formatDateForCSV(isoDate) {
  if (!isoDate) return '';

  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return '';

    // Convert UTC to Brazil timezone using Intl API
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const parts = formatter.formatToParts(date);
    const p = {};
    parts.forEach(({ type, value }) => p[type] = value);

    return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}:${p.second}`;
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

// ============== METADATA LOADERS ==============

/**
 * Get the last CSV import date from transactions table
 * Returns the most recent imported_at timestamp
 */
async function getLastImportDate() {
  try {
    const client = await getSupabase();
    if (!client) return null;

    const { data, error } = await client
      .from('transactions')
      .select('imported_at')
      .order('imported_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .single();

    if (error || !data?.imported_at) return null;
    return data.imported_at;
  } catch {
    return null;
  }
}

// ============== MAIN LOADER ==============

/**
 * Load all required data with Stale-While-Revalidate caching
 * - Returns cached data immediately if available (instant render)
 * - Background fetch updates cache silently
 * - 24-hour cache TTL
 *
 * Note: Weather data is now loaded via useWeatherHistory hook directly
 * from Supabase weather_daily_metrics table (not in this loader).
 *
 * Note: blacklist and campaigns are managed separately via apiService.js
 * and blacklistService.js - they're not loaded here.
 *
 * Progress callback receives:
 * {
 *   tableName: string,      // 'transactions', 'customers', 'rfm'
 *   status: string,         // 'loading', 'complete'
 *   rowCount: number|null,  // Number of rows loaded (null while loading)
 *   loaded: number,         // Tables completed so far
 *   total: number,          // Total tables to load
 *   percent: number,        // Overall progress percentage
 *   fromCache: boolean      // True if data came from cache
 * }
 *
 * @param {function} onProgress - Progress callback
 * @param {boolean} skipCache - Skip cache and force fresh fetch
 * @param {function} onBackgroundUpdate - Called when background fetch completes (SWR pattern)
 * @returns {Object} { sales, rfm, customer, dailyRevenue, lastImportedAt, fromCache }
 */
export const loadAllData = async (onProgress, skipCache = false, onBackgroundUpdate = null) => {
  const totalSteps = 4; // transactions, customers, rfm, daily_revenue

  // ============== SWR: Check cache first ==============
  if (!skipCache) {
    try {
      const [cachedSales, cachedCustomers, cachedRfm, cachedDailyRevenue] = await Promise.all([
        getCachedData(CACHE_KEY_SALES, CACHE_TTL),
        getCachedData(CACHE_KEY_CUSTOMERS, CACHE_TTL),
        getCachedData(CACHE_KEY_RFM, CACHE_TTL),
        getCachedData(CACHE_KEY_DAILY_REVENUE, CACHE_TTL)
      ]);

      // If ALL cached data exists, return immediately and revalidate in background
      if (cachedSales && cachedCustomers && cachedRfm && cachedDailyRevenue) {
        console.log('[supabaseLoader] Cache HIT - returning cached data, fetching in background');

        // Signal progress as complete (from cache)
        if (onProgress) {
          onProgress({
            loaded: totalSteps,
            total: totalSteps,
            percent: 100,
            fromCache: true,
            tableStates: {
              transactions: { status: 'complete', rowCount: cachedSales.length },
              customers: { status: 'complete', rowCount: cachedCustomers.length },
              rfm: { status: 'complete', rowCount: cachedRfm.length },
              daily_revenue: { status: 'complete', rowCount: cachedDailyRevenue.length }
            }
          });
        }

        // Start background revalidation (fire and forget)
        fetchAndCacheAll(null, onBackgroundUpdate).catch(err => {
          console.warn('[supabaseLoader] Background revalidation failed:', err.message);
        });

        return {
          sales: cachedSales,
          customer: cachedCustomers,
          rfm: cachedRfm,
          dailyRevenue: cachedDailyRevenue,
          lastImportedAt: null, // Will be updated on background fetch
          fromCache: true
        };
      }

      console.log('[supabaseLoader] Cache MISS - fetching from Supabase');
    } catch (cacheError) {
      console.warn('[supabaseLoader] Cache check failed:', cacheError.message);
    }
  } else {
    console.log('[supabaseLoader] Cache SKIP - forced refresh');
  }

  // ============== Cache miss or forced refresh: fetch from Supabase ==============
  return fetchAndCacheAll(onProgress, null);
};

/**
 * Fetch all data from Supabase and update cache
 * @param {function} onProgress - Progress callback (null for background fetch)
 * @param {function} onComplete - Called when fetch completes (for SWR background update)
 * @returns {Object} { sales, rfm, customer, dailyRevenue, lastImportedAt, fromCache: false }
 */
async function fetchAndCacheAll(onProgress, onComplete) {
  const data = {};
  let loaded = 0;
  const totalSteps = 4;

  // Track loading state for each table
  const tableStates = {
    transactions: { status: 'pending', rowCount: null },
    customers: { status: 'pending', rowCount: null },
    rfm: { status: 'pending', rowCount: null },
    daily_revenue: { status: 'pending', rowCount: null }
  };

  const updateProgress = (tableName, status, rowCount = null) => {
    tableStates[tableName] = { status, rowCount };

    if (status === 'complete') {
      loaded++;
    }

    if (onProgress) {
      onProgress({
        tableName,
        status,
        rowCount,
        loaded,
        total: totalSteps,
        percent: Math.round((loaded / totalSteps) * 100),
        fromCache: false,
        tableStates: { ...tableStates }
      });
    }
  };

  try {
    // Load all data in PARALLEL for faster mobile performance
    console.log('[supabaseLoader] Starting parallel data fetch...');
    const startTime = performance.now();

    // Signal loading started for all tables
    if (onProgress) {
      updateProgress('transactions', 'loading');
      updateProgress('customers', 'loading');
      updateProgress('rfm', 'loading');
      updateProgress('daily_revenue', 'loading');
    }

    const [salesResult, rfmResult, customerResult, dailyRevenueResult, lastImportedAt] = await Promise.all([
      // 1. Load sales from Supabase (transactions table)
      loadSalesFromSupabase().then(result => {
        updateProgress('transactions', 'complete', result.length);
        return result;
      }),

      // 2. Load RFM from Supabase (computed from customers)
      loadRFMFromSupabase().then(result => {
        updateProgress('rfm', 'complete', result.length);
        return result;
      }),

      // 3. Load customers from Supabase
      loadCustomersFromSupabase().then(result => {
        updateProgress('customers', 'complete', result.length);
        return result;
      }),

      // 4. Load daily revenue for Intelligence tab (last 60 days)
      loadDailyRevenueForInit().then(result => {
        updateProgress('daily_revenue', 'complete', result.length);
        return result;
      }),

      // 5. Get last CSV import date (metadata, no progress update)
      getLastImportDate()
    ]);

    data.sales = salesResult;
    data.rfm = rfmResult;
    data.customer = customerResult;
    data.dailyRevenue = dailyRevenueResult;
    data.lastImportedAt = lastImportedAt;
    data.fromCache = false;

    const elapsed = Math.round(performance.now() - startTime);
    console.log(`[supabaseLoader] Parallel fetch completed in ${elapsed}ms`);

    // ============== Save to IndexedDB cache ==============
    try {
      await Promise.all([
        setCachedData(CACHE_KEY_SALES, salesResult),
        setCachedData(CACHE_KEY_CUSTOMERS, customerResult),
        setCachedData(CACHE_KEY_RFM, rfmResult),
        setCachedData(CACHE_KEY_DAILY_REVENUE, dailyRevenueResult)
      ]);
      console.log('[supabaseLoader] Cache updated');
    } catch (cacheError) {
      console.warn('[supabaseLoader] Failed to update cache:', cacheError.message);
    }

    // ============== Call background update callback (SWR) ==============
    if (onComplete) {
      onComplete(data);
    }

    return data;
  } catch (error) {
    console.error('[supabaseLoader] Failed to load data:', error);
    throw error;
  }
}

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
