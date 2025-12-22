// Customer Metrics Calculator v3.6.0 - DISTINCT PORTUGUESE RFM SEGMENTS
// ✅ Brazilian number parsing added (handles comma decimals)
// ✅ Cashback rate corrected (7.5%)
// ✅ Cashback start date corrected (June 1, 2024)
// ✅ v3.6.0 (2025-12-22): Added visits metric (unique visit days)
//     - transactions = raw row count (for financial context)
//     - visits = unique days customer visited (for behavior context)
//     - servicesPerVisit now uses visits as denominator
//     - getRFMCoordinates.r now uses visits (was transactions)
// ✅ v3.5.0 (2025-12-15): getRFMCoordinates includes phone for blacklist filtering
//     - CustomerSegmentModal from RFMScatterPlot now correctly filters blacklisted
// ✅ v3.4.0 (2025-12-10): Distinct Portuguese RFM segment names
//     - RFM segments: VIP, Frequente, Promissor, Novato, Esfriando, Inativo
//     - Names are DISTINCT from Churn Risk Levels to avoid confusion
//     - Churn Risk: Saudável, Monitorar, Em Risco, Crítico, Novo, Perdido
//     - RFM computed in Supabase, churn risk computed client-side
// ✅ v3.3.0 (2025-12-10): Portuguese RFM segment support
// ✅ FIX v3.2.1 (2025-12-03): Customer name from customer.csv
//     - Fixed: Name was not being extracted from customer.csv
//     - Now merges name when auto-generated "Customer XXXX" is detected
// ✅ v3.2.0 (2025-12-03): Unified CPF utilities
//     - Uses shared cpfUtils.js for consistent normalization
//     - CPF padding/validation applied at data load time
//     - Eliminates duplicate implementations
// ✅ v3.1.0 (2025-12-03): Phone validation & CPF standardization
//     - Added Brazilian mobile phone validation (WhatsApp-ready)
//     - Standardized CPF column lookups across all CSV formats
//     - Added hasValidPhone flag for campaign targeting
// ✅ v3.0.0 (2025-11-24): Laundromat-optimized churn thresholds
//     - Updated LOST_THRESHOLD: 120 → 60 days (realistic for laundromat)
//     - New DAY_THRESHOLDS: 20/30/45/60 days for risk classification
//     - Added RISK_LABELS constant for unified Portuguese translations
// ✅ Intelligence Hub analytics functions (v2.2.0 - 2025-11-23)
//     - getRFMCoordinates, getChurnHistogramData, getRetentionCohorts, getAcquisitionTrend

import { parseBrDate, formatDate } from './dateUtils';
import { normalizePhone, isValidBrazilianMobile } from './phoneUtils';
import { normalizeCpf, extractCpf, isValidCpf } from './cpfUtils';

/**
 * Parse Brazilian number format (handles comma as decimal separator)
 * Examples: "17,90" → 17.90, "2.378,85" → 2378.85, "17.90" → 17.90
 */
function parseBrNumber(value) {
  if (value === null || value === undefined || value === '') return 0;

  const str = String(value).trim();

  // If it has both period and comma, it's format: 1.234,56 → 1234.56
  if (str.includes('.') && str.includes(',')) {
    return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
  }

  // If it only has comma, it's decimal: 17,90 → 17.90
  if (str.includes(',')) {
    return parseFloat(str.replace(',', '.')) || 0;
  }

  // Otherwise parse as-is (handles: "17.90", "17", "0")
  return parseFloat(str) || 0;
}

// CPF normalization and extraction now handled by cpfUtils.js
// See: normalizeCpf(), extractCpf(), isValidCpf()
const CPF_COLUMNS = ['Doc_Cliente', 'Documento', 'doc', 'document', 'CPF', 'cpf', 'col2'];

/**
 * Extract CPF from a CSV row using all known column name variations
 * Wrapper around cpfUtils.extractCpf for backward compatibility
 */
function extractCPF(row) {
  return extractCpf(row, CPF_COLUMNS);
}

/**
 * Extract phone from a CSV row using all known column name variations
 */
function extractPhone(row) {
  const phoneColumns = [
    'phone number',     // rfm.csv
    'Telefone',         // customer.csv
    'phone',            // generic
    'Phone',            // capitalized
    'tel',              // abbreviated
    'celular',          // portuguese
    'mobile',           // english
  ];

  for (const col of phoneColumns) {
    if (row[col]) {
      return row[col];
    }
  }
  return null;
}

/**
 * Extract name from a CSV row using all known column name variations
 */
function extractName(row) {
  const nameColumns = [
    'client name',      // rfm.csv
    'Nome',             // customer.csv
    'name',             // generic
    'Name',             // capitalized
    'Cliente',          // portuguese
    'cliente',          // lowercase
  ];

  for (const col of nameColumns) {
    if (row[col]) {
      return row[col];
    }
  }
  return null;
}

// LAUNDROMAT-OPTIMIZED THRESHOLDS (v3.0.0)
// Based on business reality: customers typically visit every 7-14 days
const LOST_THRESHOLD = 60; // Days until customer is considered "Lost" (was 120)
const CASHBACK_RATE = 0.075; // 7.5% cashback
const CASHBACK_START = new Date(2024, 5, 1); // June 1, 2024

// Day-based thresholds for risk classification
const DAY_THRESHOLDS = {
  HEALTHY: 20,    // 0-20 days: Normal laundry cycle (weekly/bi-weekly)
  MONITOR: 30,    // 21-30 days: Slightly overdue, worth monitoring
  AT_RISK: 45,    // 31-45 days: Missing their cycle, intervention needed
  CHURNING: 60,   // 46-60 days: Likely found another laundromat
  LOST: 60        // 60+ days: Definitively churned
};

// Unified Risk Labels (English keys, Portuguese values)
// Use this constant across ALL components for consistency
// Design System v3.0: Added borderColor hex values, removed emoji icons
export const RISK_LABELS = {
  'Healthy': { pt: 'Saudável', color: 'green', borderColor: '#10b981', bgClass: 'bg-green-100', textClass: 'text-green-700' },
  'Monitor': { pt: 'Monitorar', color: 'blue', borderColor: '#3b82f6', bgClass: 'bg-blue-100', textClass: 'text-blue-700' },
  'At Risk': { pt: 'Em Risco', color: 'amber', borderColor: '#f59e0b', bgClass: 'bg-amber-100', textClass: 'text-amber-700' },
  'Churning': { pt: 'Crítico', color: 'red', borderColor: '#ef4444', bgClass: 'bg-red-100', textClass: 'text-red-700' },
  'New Customer': { pt: 'Novo', color: 'purple', borderColor: '#a855f7', bgClass: 'bg-purple-100', textClass: 'text-purple-700' },
  'Lost': { pt: 'Perdido', color: 'slate', borderColor: '#64748b', bgClass: 'bg-slate-100', textClass: 'text-slate-700' }
};

// RFM segment bonus multipliers for return likelihood
// Supports Portuguese (current) and English (legacy) segment names
// Portuguese names are DISTINCT from Churn Risk Level names
const SEGMENT_BONUS = {
  // Portuguese RFM segment names (from Supabase - v3.4.0)
  'VIP': 1.2,           // Champion - best customers, top tier
  'Frequente': 1.1,     // Loyal - regular visitors
  'Promissor': 1.0,     // Potential - growing customers
  'Novato': 0.9,        // New customer - newcomers
  'Esfriando': 0.8,     // At Risk - cooling off, needs attention
  'Inativo': 0.5,       // Lost - no recent engagement

  // English segment names (legacy compatibility)
  'Champion': 1.2,
  'Loyal': 1.1,
  'Potential': 1.0,
  'New': 0.9,
  'At Risk': 0.8,
  'Need Attention': 0.8,
  'AtRisk': 0.8,
  'Lost': 0.5,
  'Unclassified': 1.0
};

// RFM Segment Labels (Portuguese marketing names - DISTINCT from Churn Risk Levels)
// Used for display in UI components
// Names: VIP, Frequente, Promissor, Novato, Esfriando, Inativo
export const RFM_SEGMENT_LABELS = {
  'VIP': { en: 'Champion', color: 'amber', bgClass: 'bg-amber-100', textClass: 'text-amber-700', borderColor: '#f59e0b' },
  'Frequente': { en: 'Loyal', color: 'blue', bgClass: 'bg-blue-100', textClass: 'text-blue-700', borderColor: '#3b82f6' },
  'Promissor': { en: 'Potential', color: 'cyan', bgClass: 'bg-cyan-100', textClass: 'text-cyan-700', borderColor: '#06b6d4' },
  'Novato': { en: 'New', color: 'purple', bgClass: 'bg-purple-100', textClass: 'text-purple-700', borderColor: '#a855f7' },
  'Esfriando': { en: 'At Risk', color: 'orange', bgClass: 'bg-orange-100', textClass: 'text-orange-700', borderColor: '#f97316' },
  'Inativo': { en: 'Lost', color: 'slate', bgClass: 'bg-slate-100', textClass: 'text-slate-700', borderColor: '#64748b' }
};

// Risk level thresholds (likelihood-based, used in conjunction with day thresholds)
const RISK_THRESHOLDS = {
  HEALTHY: 60,      // >60% likelihood
  MONITOR: 30,      // >30% likelihood
  AT_RISK: 15       // >15% likelihood, ≤15% is Churning
};

/**
 * Count machines from string like "Lavadora 1, Secadora 2"
 */
function countMachines(str) {
  if (!str) return { wash: 0, dry: 0, total: 0 };
  const machineStr = String(str).toLowerCase().trim();
  const machines = machineStr.split(',').map(m => m.trim());
  let wash = 0, dry = 0;
  machines.forEach(m => {
    if (m.includes('lavadora')) wash++;
    else if (m.includes('secadora')) dry++;
  });
  return { wash, dry, total: wash + dry };
}

/**
 * Calculate all customer metrics using V2.1 algorithm
 * ✅ Now uses parseBrNumber() for proper Brazilian number format
 * @param {Array} salesData - Sales CSV rows
 * @param {Array} rfmData - RFM segmentation rows
 * @returns {Object} Customer metrics and lists
 */
export function calculateCustomerMetrics(salesData, rfmData = [], customerData = []) {
  const customers = {};
  const rfmMap = {};
  const customerCSVMap = {}; // NEW: For customer.csv data
  const now = new Date();

  // Build RFM lookup - with safety check
  if (Array.isArray(rfmData) && rfmData.length > 0) {
    rfmData.forEach(row => {
      const doc = extractCPF(row);
      if (doc) {
        const rawPhone = extractPhone(row);
        const validatedPhone = normalizePhone(rawPhone);

        rfmMap[doc] = {
          segment: row.segment || row.col1 || row.Segment || 'Unclassified',
          name: extractName(row),
          phone: validatedPhone,           // Normalized and validated
          rawPhone: rawPhone,              // Original for debugging
          hasValidPhone: !!validatedPhone, // Flag for filtering
          lastContactDate: row.col5 || row.lastContactDate || null
        };
      }
    });
  }

  // Build customer.csv lookup - NEW: Separate from RFM
  if (Array.isArray(customerData) && customerData.length > 0) {
    customerData.forEach(row => {
      const doc = extractCPF(row);
      if (doc) {
        const rawPhone = extractPhone(row);
        const validatedPhone = normalizePhone(rawPhone);

        customerCSVMap[doc] = {
          name: extractName(row),          // Customer name from CSV
          email: row.Email || row.email || null,
          phone: validatedPhone,           // Normalized and validated
          rawPhone: rawPhone,              // Original for debugging
          hasValidPhone: !!validatedPhone, // Flag for filtering
          walletBalance: parseBrNumber(row.Saldo_Carteira || row.saldo || '0'),
          registrationDate: parseBrDate(row.Data_Cadastro || ''),
          lastPurchaseDate: parseBrDate(row.Data_Ultima_Compra || ''),
          totalSpent: parseBrNumber(row.Total_Compras || '0'),
          purchaseCount: parseInt(row.Quantidade_Compras || '0', 10) || 0
        };
      }
    });
  }

  console.log('RFM map built with', Object.keys(rfmMap).length, 'entries');
  console.log('Customer CSV map built with', Object.keys(customerCSVMap).length, 'entries');
  console.log('Sample RFM entry:', Object.values(rfmMap)[0]);
  console.log('Sample CSV entry:', Object.values(customerCSVMap)[0]);

  // Process sales data
  let skippedInvalidCpf = 0;
  salesData.forEach(row => {
    const doc = extractCPF(row);
    if (!doc) return;

    // Skip invalid CPF patterns (all same digit)
    if (!isValidCpf(doc)) {
      skippedInvalidCpf++;
      return;
    }

    const date = parseBrDate(row.Data || row.Data_Hora || row.date || '');
    if (!date) return;

    // ✅ USE parseBrNumber instead of parseFloat
    const grossValue = parseBrNumber(row.Valor_Venda || row.gross_value || 0);
    const netValue = parseBrNumber(row.Valor_Pago || row.net_value || 0);
    const machineInfo = countMachines(row.Maquina || row.machine || row.Maquinas || '');

    // Cashback calculation with corrected rate and start date
    let cashback = 0;
    if (date >= CASHBACK_START) {
      cashback = grossValue * CASHBACK_RATE;
    }

    if (!customers[doc]) {
      customers[doc] = {
        doc,
        name: extractName(row) || `Customer ${doc.slice(-4)}`,
        transactions: 0,
        visitDates: new Set(), // Track unique visit days
        netTotal: 0,
        grossTotal: 0,
        totalCashback: 0,
        dates: [],
        totalServices: 0,
        washServices: 0,
        dryServices: 0,
        washRevenue: 0,
        dryRevenue: 0,
        phone: null,
        rawPhone: null,
        hasValidPhone: false,
        lastContactDate: null
      };
    }

    const customer = customers[doc];
    customer.transactions++;
    // Track unique visit days (YYYY-MM-DD key)
    const dateKey = formatDate(date);
    customer.visitDates.add(dateKey);
    customer.netTotal += netValue;
    customer.grossTotal += grossValue;
    customer.totalCashback += cashback;
    customer.dates.push(date);
    customer.totalServices += machineInfo.total;
    customer.washServices += machineInfo.wash;
    customer.dryServices += machineInfo.dry;

    if (machineInfo.total > 0) {
      customer.washRevenue += (netValue * machineInfo.wash) / machineInfo.total;
      customer.dryRevenue += (netValue * machineInfo.dry) / machineInfo.total;
    }
  });

  console.log(`Processed ${Object.keys(customers).length} unique customers from sales`);
  if (skippedInvalidCpf > 0) {
    console.log(`⚠️ Skipped ${skippedInvalidCpf} sales with invalid CPF patterns`);
  }

  // Calculate risk levels (V2.1 algorithm)
  Object.values(customers).forEach(customer => {
    // Calculate visits (unique days) from Set and cleanup
    customer.visits = customer.visitDates.size;
    delete customer.visitDates; // Memory cleanup

    customer.dates.sort((a, b) => a - b);

    customer.firstVisit = customer.dates[0];
    customer.lastVisit = customer.dates[customer.dates.length - 1];

    // Calculate avgDaysBetween - filter same-day visits
    customer.avgDaysBetween = null;
    if (customer.dates.length > 1) {
      const intervals = [];
      for (let i = 1; i < customer.dates.length; i++) {
        const days = Math.round((customer.dates[i] - customer.dates[i - 1]) / (1000 * 60 * 60 * 24));
        if (days > 0) {
          intervals.push(days);
        }
      }

      if (intervals.length > 0) {
        customer.avgDaysBetween = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
      }
    }

    const daysSinceLastVisit = Math.round((now - customer.lastVisit) / (1000 * 60 * 60 * 24));
    customer.daysSinceLastVisit = daysSinceLastVisit;

    // servicesPerVisit uses visits (unique days), not transactions (raw rows)
    customer.servicesPerVisit = customer.visits > 0
      ? (customer.totalServices / customer.visits).toFixed(1)
      : '0.0';

    if (customer.totalServices > 0) {
      customer.washPercentage = ((customer.washServices / customer.totalServices) * 100).toFixed(1);
      customer.dryPercentage = ((customer.dryServices / customer.totalServices) * 100).toFixed(1);
    } else {
      customer.washPercentage = '0.0';
      customer.dryPercentage = '0.0';
    }

    // Merge RFM data
    const rfmInfo = rfmMap[customer.doc];
    if (rfmInfo && rfmInfo.segment) {
      customer.segment = rfmInfo.segment;
      if (customer.name.includes('Customer') && rfmInfo.name) {
        customer.name = rfmInfo.name;
      }
      // Use validated phone from RFM
      customer.phone = rfmInfo.phone;
      customer.rawPhone = rfmInfo.rawPhone;
      customer.hasValidPhone = rfmInfo.hasValidPhone;
      customer.lastContactDate = rfmInfo.lastContactDate;
    } else {
      customer.segment = 'Unclassified';
    }

    // NEW: Merge customer.csv data
    const csvData = customerCSVMap[customer.doc];
    if (csvData) {
      // Use name from customer.csv if current name is auto-generated
      if (customer.name.includes('Customer') && csvData.name) {
        customer.name = csvData.name;
      }
      customer.email = csvData.email;
      customer.walletBalance = csvData.walletBalance; // REAL wallet balance from CSV!
      customer.registrationDate = csvData.registrationDate;
      customer.lastPurchaseDate = csvData.lastPurchaseDate;
      customer.totalSpentCSV = csvData.totalSpent; // From CSV (may differ from calculated)
      customer.purchaseCount = csvData.purchaseCount; // Total purchases (not visits!)

      // If no phone from RFM, try to get from customer.csv
      if (!customer.phone && csvData.phone) {
        customer.phone = csvData.phone;
        customer.rawPhone = csvData.rawPhone;
        customer.hasValidPhone = csvData.hasValidPhone;
      }
    }

    // ==========================================
    // CHURN CLASSIFICATION LOGIC (v3.0.0)
    // ==========================================
    // This uses a DUAL-THRESHOLD SYSTEM for maximum accuracy:
    //
    // 1. DAY-BASED THRESHOLDS (Absolute):
    //    - 60+ days = "Lost" (regardless of pattern)
    //    - 1 visit only = "New Customer"
    //
    // 2. LIKELIHOOD-BASED (Individual Patterns):
    //    - Compares daysSinceLastVisit to avgDaysBetween
    //    - Considers RFM segment bonus
    //    - Result: Healthy/Monitor/At Risk/Churning
    //
    // WHY THIS WORKS:
    // - Customer A: Visits every 7 days, 14 days late → At Risk ⚠️
    // - Customer B: Visits every 90 days, 60 days late → Healthy ✅
    // - Both are 60 days since last visit, but different risk levels!
    //
    // This is why "healthy" customers can appear in the "danger zone"
    // on the RFM scatter plot - they naturally visit less frequently.
    // ==========================================

    // Risk calculation (V2.1 exact algorithm)
    if (daysSinceLastVisit > LOST_THRESHOLD) {
      customer.returnLikelihood = 0;
      customer.riskLevel = 'Lost';
      customer.daysOverdue = customer.avgDaysBetween ? daysSinceLastVisit - customer.avgDaysBetween : 0;
    }
    else if (customer.transactions === 1) {
      customer.returnLikelihood = 50;
      customer.riskLevel = 'New Customer';
      customer.daysOverdue = 0;
    }
    else if (customer.avgDaysBetween && customer.avgDaysBetween > 0) {
      const ratio = daysSinceLastVisit / customer.avgDaysBetween;
      let likelihood = Math.exp(-Math.max(0, ratio - 1)) * 100;

      likelihood *= (SEGMENT_BONUS[customer.segment] || 1.0);
      likelihood = Math.min(100, likelihood);
      customer.returnLikelihood = Math.round(likelihood);
      customer.daysOverdue = Math.max(0, daysSinceLastVisit - customer.avgDaysBetween);

      if (likelihood > RISK_THRESHOLDS.HEALTHY) customer.riskLevel = 'Healthy';
      else if (likelihood > RISK_THRESHOLDS.MONITOR) customer.riskLevel = 'Monitor';
      else if (likelihood > RISK_THRESHOLDS.AT_RISK) customer.riskLevel = 'At Risk';
      else customer.riskLevel = 'Churning';
    } else {
      customer.returnLikelihood = 40;
      customer.riskLevel = 'Monitor';
      customer.daysOverdue = 0;
    }
  });

  // MEMORY OPTIMIZATION: Delete dates array after processing
  // We've already extracted firstVisit, lastVisit, avgDaysBetween, and daysSinceLastVisit
  // The raw dates array is no longer needed and can consume significant memory
  Object.values(customers).forEach(customer => {
    delete customer.dates;
  });

  // Aggregate metrics
  const allCustomers = Object.values(customers);
  const activeCustomers = allCustomers.filter(c => c.riskLevel !== 'Lost');
  const lostCustomers = allCustomers.filter(c => c.riskLevel === 'Lost');

  const healthyCount = activeCustomers.filter(c => c.riskLevel === 'Healthy').length;
  const monitorCount = activeCustomers.filter(c => c.riskLevel === 'Monitor').length;
  const atRiskCount = activeCustomers.filter(c => c.riskLevel === 'At Risk').length;
  const churningCount = activeCustomers.filter(c => c.riskLevel === 'Churning').length;
  const newCustomerCount = activeCustomers.filter(c => c.riskLevel === 'New Customer').length;
  // Combined count for "At Risk" + "Churning" - both need proactive outreach
  const needsAttentionCount = atRiskCount + churningCount;

  // Phone validation counts (for campaign targeting)
  const validPhoneCount = allCustomers.filter(c => c.hasValidPhone).length;
  const activeWithPhone = activeCustomers.filter(c => c.hasValidPhone).length;

  const healthRate = activeCustomers.length > 0
    ? (healthyCount / activeCustomers.length) * 100
    : 0;

  return {
    // Counts
    totalCustomers: allCustomers.length,
    activeCount: activeCustomers.length,
    lostCount: lostCustomers.length,
    healthyCount,
    monitorCount,
    atRiskCount,
    churningCount,
    needsAttentionCount, // Combined: At Risk + Churning
    newCustomerCount,
    healthRate,

    // Phone validation counts (for campaigns)
    validPhoneCount,        // Total customers with valid WhatsApp numbers
    activeWithPhone,        // Active customers with valid WhatsApp numbers
    phoneValidationRate: allCustomers.length > 0
      ? Math.round((validPhoneCount / allCustomers.length) * 100)
      : 0,

    // Lists
    allCustomers,
    activeCustomers,
    lostCustomers,
    // Campaign-ready lists
    campaignReady: activeCustomers.filter(c => c.hasValidPhone)
  };
}

/**
 * Get segment distribution stats
 */
export function getSegmentStats(customerMetrics) {
  const segmentMap = {};

  customerMetrics.activeCustomers.forEach(c => {
    if (!segmentMap[c.segment]) {
      segmentMap[c.segment] = {
        segment: c.segment,
        count: 0,
        totalSpending: 0,
        totalServices: 0
      };
    }
    segmentMap[c.segment].count++;
    segmentMap[c.segment].totalSpending += c.netTotal;
    segmentMap[c.segment].totalServices += c.totalServices;
  });

  return Object.values(segmentMap).map(seg => ({
    ...seg,
    avgSpending: seg.totalSpending / seg.count,
    avgServices: seg.totalServices / seg.count,
    percentage: (seg.count / customerMetrics.activeCount) * 100
  })).sort((a, b) => b.count - a.count);
}

/**
 * Get top at-risk customers by spending
 */
export function getTopAtRiskCustomers(customerMetrics, limit = 10) {
  const atRisk = customerMetrics.activeCustomers.filter(
    c => c.riskLevel === 'At Risk' || c.riskLevel === 'Churning'
  );

  return atRisk
    .sort((a, b) => b.netTotal - a.netTotal)
    .slice(0, limit);
}

// ==========================================
// NEW ANALYTICS FUNCTIONS FOR INTELLIGENCE HUB
// ==========================================

/**
 * 1. RFM Coordinates for Scatter Plot (Risk Map)
 * Maps customers to X (Recency) and Y (Monetary) coordinates
 * v2.1: Added phone field for blacklist filtering in CustomerSegmentModal
 */
export function getRFMCoordinates(customers) {
  return customers.map(c => ({
    id: c.doc,
    name: c.name,
    x: c.daysSinceLastVisit, // Recency (Days ago)
    y: c.netTotal,           // Monetary (Total Spend)
    r: c.visits,             // Radius (Frequency = unique visit days)
    status: c.riskLevel,
    segment: c.segment,
    phone: c.phone           // For blacklist filtering
  }));
}

/**
 * 2. Churn Histogram Data (Danger Zone)
 * Creates buckets for "Days Between Visits" to visualize drop-off
 * v2.0: Now includes customerIds per bucket for contact tracking integration
 */
export function getChurnHistogramData(customers) {
  // Filter for customers with > 1 visit to have a valid interval
  const validCustomers = customers.filter(c => c.avgDaysBetween && c.avgDaysBetween > 0);

  // Define buckets (0-10, 11-20, etc.)
  const bucketSize = 10;
  const maxDays = 120; // Cap at 120 days
  const buckets = [];

  for (let i = 0; i < maxDays; i += bucketSize) {
    buckets.push({
      bin: `${i}-${i + bucketSize}`,
      min: i,
      max: i + bucketSize,
      count: 0,
      customerIds: [], // v2.0: Track which customers are in each bucket
      label: i < 30 ? 'Safe' : i < 60 ? 'Warning' : 'Danger'
    });
  }

  // Fill buckets with customer IDs
  validCustomers.forEach(c => {
    const days = c.avgDaysBetween;
    const bucketIndex = Math.min(
      Math.floor(days / bucketSize),
      buckets.length - 1
    );
    buckets[bucketIndex].count++;
    buckets[bucketIndex].customerIds.push(c.doc || c.id);
  });

  return buckets;
}

/**
 * 3. Retention Cohorts (Survival Score)
 * Calculates actual return rates for 30/60/90 day windows
 */
export function getRetentionCohorts(salesData) {
  if (!salesData || salesData.length === 0) return { rate30: 0, rate60: 0, rate90: 0 };

  const now = new Date();

  // Helper to parse date from row
  const getRowDate = (row) => parseBrDate(row.Data || row.Data_Hora || row.date || '');
  const getRowDoc = (row) => extractCPF(row);

  // Group visits by customer
  const customerVisits = {};
  salesData.forEach(row => {
    const doc = getRowDoc(row);
    const date = getRowDate(row);
    if (doc && date) {
      if (!customerVisits[doc]) customerVisits[doc] = [];
      customerVisits[doc].push(date);
    }
  });

  // Calculate rate for a specific lookback period
  const calculateRate = (lookbackDays) => {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() - lookbackDays);

    // Window to check for return: starts AFTER active window ends
    // Active window: targetDate - 15 days to targetDate (not overlapping with return window)
    const activeStart = new Date(targetDate);
    activeStart.setDate(activeStart.getDate() - 15);
    const activeEnd = new Date(targetDate); // End at target date, not +15 (fixes overlap)

    // Return window: day after targetDate to targetDate + 30 days
    const returnStart = new Date(targetDate);
    returnStart.setDate(returnStart.getDate() + 1); // Start day after target
    const returnEnd = new Date(targetDate);
    returnEnd.setDate(returnEnd.getDate() + 30);

    let eligible = 0;
    let returned = 0;

    Object.values(customerVisits).forEach(visits => {
      // Was customer active in the window BEFORE target date?
      const wasActive = visits.some(d => d >= activeStart && d <= activeEnd);

      if (wasActive) {
        eligible++;
        // Did they return in the non-overlapping window AFTER the target date?
        const didReturn = visits.some(d => d >= returnStart && d <= returnEnd);
        if (didReturn) returned++;
      }
    });

    return eligible > 0 ? Math.round((returned / eligible) * 100) : 0;
  };

  return {
    rate30: calculateRate(30),
    rate60: calculateRate(60),
    rate90: calculateRate(90)
  };
}

/**
 * 4. Acquisition Trend (New Clients)
 * Groups new customers by their first visit date
 * v2.0: Now includes customerIds per day for welcome campaign tracking
 *       Also returns newCustomerIds for total new customer list
 */
export function getAcquisitionTrend(customers, days = 30) {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  const dailyCounts = {};
  const newCustomerIds = []; // v2.0: Track all new customer IDs

  // Initialize all days with 0
  for (let i = 0; i <= days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    // Use formatDate for consistent local-timezone date keys
    const dateStr = formatDate(d);
    dailyCounts[dateStr] = {
      date: dateStr,
      displayDate: `${d.getDate()}/${d.getMonth() + 1}`,
      count: 0,
      customerIds: [] // v2.0: Track which customers started on this day
    };
  }

  // Count new customers and collect IDs
  customers.forEach(c => {
    if (c.firstVisit && c.firstVisit >= startDate) {
      const customerId = c.doc || c.id;
      newCustomerIds.push(customerId);

      // Use formatDate for consistent local-timezone date keys
      const dateStr = formatDate(c.firstVisit);
      if (dailyCounts[dateStr]) {
        dailyCounts[dateStr].count++;
        dailyCounts[dateStr].customerIds.push(customerId);
      }
    }
  });

  // Return object with both daily data and total new customer list
  return {
    daily: Object.values(dailyCounts),
    newCustomerIds
  };
}
