// Customer Metrics Calculator v3.13.0 - DATA-DRIVEN THRESHOLDS
// ✅ v3.13.0 (2026-01-18): Added monthly service sparkline data
//     - NEW: washSparkline/drySparkline arrays on customer objects (last 6 months)
//     - Tracks monthly wash/dry service counts during salesData processing
//     - Enables mini sparkline charts in CustomerProfileModal Financial tab
// ✅ v3.12.0 (2026-01-14): Fixed visit counting in retention metrics
//     - CRITICAL BUG FIX: Both getRetentionMetrics() and getFirstVisitConversion() now
//       deduplicate visits by date (counts unique visit DAYS, not raw transactions)
//     - Before: Customer with 2 laundry loads on day 1 counted as "returned" (86% conversion!)
//     - After: Only counts as returned if they visit on a DIFFERENT day
//     - Also fixed getCustomerSegment() to use first-visit dates for "new" classification
// ✅ v3.11.0 (2026-01-14): Refined FrequencyDegradation reliability filters
//     - Lowered OUTLIER_MULTIPLIER from 10× to 4× for stricter win-back detection
//     - Added LAST_INTERVAL_MULTIPLIER (4×): Filter recent win-backs even if max < 4×
//     - Added MAX_HISTORICAL_AVG (45d): Skip sporadic customers (infrequent = unreliable)
//     - Added MAX_CV (1.5): Skip customers with inconsistent historical patterns
//     - Verified: Antonio, Carina, Katherine, Madhavah SHOWN (genuine degradation)
//     - Filtered: Luciano (122d gap), Osmar (328d), Flavia (sporadic), Isaias (inconsistent)
// ✅ v3.10.0 (2026-01-14): Multi-factor FrequencyDegradation pattern detection
//     - Win-back detection: Filter customers with max interval > historicalAvg × 10
//     - Recovery detection: Filter customers whose last interval AND last 3 avg are normal
//     - Uses ELEVATED_MULTIPLIER (1.5×) and OUTLIER_MULTIPLIER (10×) instead of fixed thresholds
//     - Test results: Alfredo (win-back) EXCLUDED, Daniele (recovered) EXCLUDED,
//       Antonio (just recovered, elevated recent) INCLUDED
// ✅ v3.9.0 (2026-01-14): FrequencyDegradation churn gap detection
//     - Added CHURN_GAP_THRESHOLD (50 days) to filter win-back customers
//     - Customers with any interval > 50 days are skipped (already churned and returned)
//     - Fixes false positives like Alfredo Christ case (586d gap = win-back, not degradation)
// ✅ v3.8.0 (2026-01-13): Adjusted thresholds based on 14k+ transaction analysis
//     - DAY_THRESHOLDS: HEALTHY 20→30, MONITOR 30→40, AT_RISK 45→50 (median interval: 22.5 days)
//     - SEGMENT_BONUS: VIP 1.2→1.4, Frequente 1.1→1.2 (VIP avg 90.7 visits)
//     - New customers: Time-based likelihood (70%→5%) instead of fixed 50%
//     - Analysis showed: 71% of customers who return do so within 30 days
// ✅ v3.7.0 (2025-12-23): Converted debug logs to logger utility
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
import { logger } from './logger';

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

// Day-based thresholds for risk classification (v3.8.0 - data-driven)
// Based on analysis of 14k+ transactions:
// - Median visit interval: 22.5 days (not 14 as assumed)
// - 71% of customers who return do so within 30 days
// - Return rate stays above 50% until 119 days
// EXPORTED: Used by AtRiskCustomersTable, ChurnHistogram for consistent threshold colors
export const DAY_THRESHOLDS = {
  HEALTHY: 30,    // 0-30 days: Normal cycle (1.3x median of 22.5 days)
  MONITOR: 40,    // 31-40 days: Slightly overdue, worth monitoring
  AT_RISK: 50,    // 41-50 days: Missing their cycle, intervention needed
  CHURNING: 60,   // 51-60 days: Likely found another laundromat
  LOST: 60        // 60+ days: Definitively churned (for early intervention)
};

// Unified Risk Labels (English keys, Portuguese values)
// Use this constant across ALL components for consistency
// Design System v4.0: Added icon property for WCAG accessibility (colorblind support)
// Icons provide alternative visual cue beyond color alone
export const RISK_LABELS = {
  'Healthy': { pt: 'Saudável', color: 'green', borderColor: '#10b981', bgClass: 'bg-green-100', textClass: 'text-green-700', icon: 'CheckCircle' },
  'Monitor': { pt: 'Monitorar', color: 'blue', borderColor: '#3b82f6', bgClass: 'bg-blue-100', textClass: 'text-blue-700', icon: 'Eye' },
  'At Risk': { pt: 'Em Risco', color: 'amber', borderColor: '#f59e0b', bgClass: 'bg-amber-100', textClass: 'text-amber-700', icon: 'AlertTriangle' },
  'Churning': { pt: 'Crítico', color: 'red', borderColor: '#ef4444', bgClass: 'bg-red-100', textClass: 'text-red-700', icon: 'XCircle' },
  'New Customer': { pt: 'Novo', color: 'purple', borderColor: '#a855f7', bgClass: 'bg-purple-100', textClass: 'text-purple-700', icon: 'Sparkles' },
  'Lost': { pt: 'Perdido', color: 'slate', borderColor: '#64748b', bgClass: 'bg-slate-100', textClass: 'text-slate-700', icon: 'MinusCircle' }
};

// RFM segment bonus multipliers for return likelihood (v3.8.0 - increased)
// Based on analysis: VIP customers avg 90.7 visits, Frequente avg 19.3 visits
// Increased bonuses to give loyal customers more grace period
// Portuguese names are DISTINCT from Churn Risk Level names
const SEGMENT_BONUS = {
  // Portuguese RFM segment names (from Supabase - v3.4.0)
  'VIP': 1.4,           // Champion - avg 90.7 visits, 12.6 day interval (was 1.2)
  'Frequente': 1.2,     // Loyal - avg 19.3 visits, 36.1 day interval (was 1.1)
  'Promissor': 1.0,     // Potential - growing customers
  'Novato': 0.9,        // New customer - newcomers
  'Esfriando': 0.8,     // At Risk - cooling off, needs attention
  'Inativo': 0.5,       // Lost - no recent engagement

  // English segment names (legacy compatibility)
  'Champion': 1.4,
  'Loyal': 1.2,
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
          lastContactDate: row.col5 || row.lastContactDate || null,
          welcomeSentAt: row.welcomeSentAt || null,
          postVisitSentAt: row.postVisitSentAt || null,
          dbRiskLevel: row.dbRiskLevel || null,
          dbWalletBalance: row.dbWalletBalance || 0,
          dbVisitCount: row.dbVisitCount || 0
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

  logger.debug('CustomerMetrics', 'Data maps built', {
    rfmEntries: Object.keys(rfmMap).length,
    csvEntries: Object.keys(customerCSVMap).length
  });

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
        monthlyServices: {}, // Track services per month for sparklines (YYYY-MM → { wash, dry })
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

    // Track monthly services for sparklines (YYYY-MM key)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!customer.monthlyServices[monthKey]) {
      customer.monthlyServices[monthKey] = { wash: 0, dry: 0 };
    }
    customer.monthlyServices[monthKey].wash += machineInfo.wash;
    customer.monthlyServices[monthKey].dry += machineInfo.dry;
  });

  logger.debug('CustomerMetrics', 'Processed customers', {
    uniqueCustomers: Object.keys(customers).length,
    skippedInvalidCpf
  });

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
      customer.welcomeSentAt = rfmInfo.welcomeSentAt;
      customer.postVisitSentAt = rfmInfo.postVisitSentAt;
      customer.dbRiskLevel = rfmInfo.dbRiskLevel;
      customer.dbWalletBalance = rfmInfo.dbWalletBalance;
      customer.dbVisitCount = rfmInfo.dbVisitCount;
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
      // Time-based likelihood for 1-visit customers (v3.8.0)
      // Based on analysis: 56.1% return by day 14, 71.3% by day 30
      // 95.8% of 1-visit customers who are 60+ days old never return
      if (daysSinceLastVisit <= 7) {
        customer.returnLikelihood = 70;  // Fresh, likely to return
      } else if (daysSinceLastVisit <= 14) {
        customer.returnLikelihood = 50;  // 56% return by this point
      } else if (daysSinceLastVisit <= 30) {
        customer.returnLikelihood = 30;  // 71% return by this point
      } else if (daysSinceLastVisit <= 60) {
        customer.returnLikelihood = 15;  // Getting unlikely
      } else {
        customer.returnLikelihood = 5;   // Almost certainly not returning
      }
      customer.riskLevel = 'New Customer';
      customer.daysOverdue = daysSinceLastVisit > 14 ? daysSinceLastVisit - 14 : 0;
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

  // Convert monthly services to sparkline arrays (last 6 months)
  // This provides trend data for UI visualization
  // Note: `now` already declared at function start
  const last6Months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    last6Months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  Object.values(customers).forEach(customer => {
    // Build sparkline arrays from monthly data
    customer.washSparkline = last6Months.map(key => customer.monthlyServices[key]?.wash || 0);
    customer.drySparkline = last6Months.map(key => customer.monthlyServices[key]?.dry || 0);
    // Clean up monthlyServices map (no longer needed)
    delete customer.monthlyServices;
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
    id: c.doc || c.id,       // Use doc (CPF) with id as fallback for consistency
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
 * 3. Retention Metrics v2.1 (Cohort-Based Algorithm)
 * Calculates retention rate using cohort analysis: "Of customers who visited X days ago, how many returned?"
 *
 * ALGORITHM:
 * 1. Find all customers who visited during the "seed window" (31-60 days ago)
 * 2. Check if each customer returned within 30 days after their seed visit
 * 3. Include ALL customers from seed window, even those who didn't return (they count as not retained)
 *
 * This avoids the selection bias of only counting customers who already returned.
 *
 * Example interpretation: "65% of customers who visited last month came back within 30 days"
 *
 * @param {Array} salesData - Raw sales transactions
 * @param {Object} customerMap - Customer metadata with segments (doc → customer object)
 * @returns {Object} Retention metrics with segment breakdown, trend, and history
 */
export function getRetentionMetrics(salesData, customerMap = {}) {
  if (!salesData || salesData.length === 0) {
    return {
      overall: { rate30: 0, eligible: 0, returned: 0, overdueCount: 0 },
      segments: {
        loyalists: { rate30: 0, eligible: 0, returned: 0, overdueCount: 0, overdueCustomers: [] },
        new: { rate30: 0, eligible: 0, returned: 0, overdueCount: 0, overdueCustomers: [] }
      },
      trend: { overall: 0, loyalists: 0, new: 0 },
      history: { labels: [], overall: [], loyalists: [], new: [] }
    };
  }

  const now = new Date();
  const OVERDUE_THRESHOLD = 21; // 3 weeks - customer is overdue if no visit in 21+ days
  const RETURN_WINDOW = 30;     // 30 days to return counts as "retained"
  const SEED_WINDOW_START = 60; // Seed window: 31-60 days ago (gives 30 days to return before "now")
  const SEED_WINDOW_END = 31;   // Must be > RETURN_WINDOW to have complete data

  // Threshold for "new" customers (first visit within last 60 days for segment classification)
  const newCustomerThreshold = new Date(now);
  newCustomerThreshold.setDate(newCustomerThreshold.getDate() - 60);

  // Helper to parse date from row
  const getRowDate = (row) => parseBrDate(row.Data || row.Data_Hora || row.date || '');
  const getRowDoc = (row) => extractCPF(row);

  // Group visits by customer (deduplicated by date)
  // CRITICAL: Count unique visit DAYS, not raw transactions
  // A customer with 2 laundry loads on day 1 should count as 1 visit, not 2
  const customerVisitSets = {};
  salesData.forEach(row => {
    const doc = getRowDoc(row);
    const date = getRowDate(row);
    if (doc && date && isValidCpf(doc)) {
      if (!customerVisitSets[doc]) customerVisitSets[doc] = new Set();
      const dateKey = formatDate(date);
      customerVisitSets[doc].add(dateKey);
    }
  });

  // Convert Sets to sorted Date arrays
  const customerVisits = {};
  Object.entries(customerVisitSets).forEach(([doc, dateSet]) => {
    customerVisits[doc] = Array.from(dateSet)
      .map(dateStr => parseBrDate(dateStr))
      .filter(d => d !== null)
      .sort((a, b) => a - b);
  });

  /**
   * Determine customer segment based on first visit date (v3.12.0)
   * Uses actual transaction data instead of segment classification for "new" customers
   * @param {string} customerId - Customer doc/ID
   * @returns {'loyalists' | 'new' | 'other'}
   */
  const getCustomerSegment = (customerId) => {
    const customer = customerMap[customerId];
    const visits = customerVisits[customerId];
    if (!customer || !visits || visits.length === 0) return 'other';

    const firstVisit = visits[0];

    // Loyalists: VIP or Frequente segments (established, high-value customers)
    if (customer.segment === 'VIP' || customer.segment === 'Frequente') {
      return 'loyalists';
    }

    // New: First visit within the analysis window (matches FirstVisitConversion logic)
    // Uses actual transaction data instead of Supabase segment classification
    if (firstVisit >= newCustomerThreshold) {
      return 'new';
    }

    return 'other';
  };

  /**
   * Calculate retention using cohort analysis
   * @param {number} seedStartDaysAgo - Start of seed window (days ago)
   * @param {number} seedEndDaysAgo - End of seed window (days ago)
   * @param {boolean} collectOverdue - Whether to collect overdue customer list
   * @returns {Object} Metrics per segment
   */
  const calculateCohortRetention = (seedStartDaysAgo, seedEndDaysAgo, collectOverdue = false) => {
    const metrics = {
      overall: { eligible: 0, returned: 0, overdueCount: 0 },
      loyalists: { eligible: 0, returned: 0, overdueCount: 0, overdueCustomers: [] },
      new: { eligible: 0, returned: 0, overdueCount: 0, overdueCustomers: [] }
    };

    // Define seed window (when customers must have visited to be in cohort)
    const seedStart = new Date(now);
    seedStart.setDate(seedStart.getDate() - seedStartDaysAgo);
    seedStart.setHours(0, 0, 0, 0);

    const seedEnd = new Date(now);
    seedEnd.setDate(seedEnd.getDate() - seedEndDaysAgo);
    seedEnd.setHours(23, 59, 59, 999);

    Object.entries(customerVisits).forEach(([customerId, visits]) => {
      // Find visits in the seed window
      const seedVisits = visits.filter(v => v >= seedStart && v <= seedEnd);

      if (seedVisits.length === 0) return; // Customer not in this cohort

      // Get the LAST visit in the seed window (this is the reference point)
      const seedVisit = seedVisits[seedVisits.length - 1];

      // Define return window: from day after seed visit to seed visit + 30 days
      const returnWindowStart = new Date(seedVisit);
      returnWindowStart.setDate(returnWindowStart.getDate() + 1);

      const returnWindowEnd = new Date(seedVisit);
      returnWindowEnd.setDate(returnWindowEnd.getDate() + RETURN_WINDOW);

      // Did they return in the window?
      const didReturn = visits.some(v => v >= returnWindowStart && v <= returnWindowEnd);

      // Get customer's last visit overall (for overdue calculation)
      const lastVisit = visits[visits.length - 1];
      const daysSinceLastVisit = Math.floor((now - lastVisit) / (1000 * 60 * 60 * 24));
      const isOverdue = daysSinceLastVisit >= OVERDUE_THRESHOLD;

      // Get segment
      const segment = getCustomerSegment(customerId);

      // Update overall metrics
      metrics.overall.eligible++;
      if (didReturn) metrics.overall.returned++;
      if (isOverdue) metrics.overall.overdueCount++;

      // Update segment-specific metrics
      if (segment === 'loyalists' || segment === 'new') {
        metrics[segment].eligible++;
        if (didReturn) metrics[segment].returned++;
        if (isOverdue) {
          metrics[segment].overdueCount++;
          if (collectOverdue) {
            const customer = customerMap[customerId];
            metrics[segment].overdueCustomers.push({
              id: customerId,
              doc: customerId,
              daysSinceLastVisit,
              name: customer?.name || `Cliente ${customerId.slice(-4)}`,
              phone: customer?.phone || null,
              segment: customer?.segment || 'Desconhecido',
              netTotal: customer?.netTotal || 0,
              visits: customer?.visits || 0,
              lastVisit
            });
          }
        }
      }
    });

    // Calculate rates
    const calcRate = (m) => m.eligible > 0 ? Math.round((m.returned / m.eligible) * 100) : 0;

    return {
      overall: { ...metrics.overall, rate30: calcRate(metrics.overall) },
      loyalists: { ...metrics.loyalists, rate30: calcRate(metrics.loyalists) },
      new: { ...metrics.new, rate30: calcRate(metrics.new) }
    };
  };

  // Current period: customers who visited 31-60 days ago, did they return within 30 days?
  const currentMetrics = calculateCohortRetention(SEED_WINDOW_START, SEED_WINDOW_END, true);

  // Previous period: customers who visited 61-90 days ago, did they return within 30 days?
  const prevMetrics = calculateCohortRetention(SEED_WINDOW_START + 30, SEED_WINDOW_END + 30, false);

  // Calculate trend (current - previous)
  const trend = {
    overall: currentMetrics.overall.rate30 - prevMetrics.overall.rate30,
    loyalists: currentMetrics.loyalists.rate30 - prevMetrics.loyalists.rate30,
    new: currentMetrics.new.rate30 - prevMetrics.new.rate30
  };

  // Calculate 6-month history for sparkline
  const history = { labels: [], overall: [], loyalists: [], new: [] };
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  for (let i = 5; i >= 0; i--) {
    // For each month, calculate retention of cohort that visited in that month
    // Seed window: the month itself
    // Return window: 30 days after their visit in that month
    const monthEnd = new Date(now);
    monthEnd.setMonth(monthEnd.getMonth() - i - 1); // Go back i+1 months
    monthEnd.setDate(0); // Last day of that month
    monthEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(monthEnd);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Days ago for the month
    const startDaysAgo = Math.ceil((now - monthStart) / (1000 * 60 * 60 * 24));
    const endDaysAgo = Math.ceil((now - monthEnd) / (1000 * 60 * 60 * 24));

    // Only calculate if we have complete return window data (at least 30 days since month end)
    if (endDaysAgo >= RETURN_WINDOW) {
      const monthMetrics = calculateCohortRetention(startDaysAgo, endDaysAgo, false);
      history.labels.push(monthNames[monthStart.getMonth()]);
      history.overall.push(monthMetrics.overall.rate30);
      history.loyalists.push(monthMetrics.loyalists.rate30);
      history.new.push(monthMetrics.new.rate30);
    } else {
      // Not enough data yet for this month
      history.labels.push(monthNames[monthStart.getMonth()]);
      history.overall.push(null);
      history.loyalists.push(null);
      history.new.push(null);
    }
  }

  // Sort overdue customers by days since last visit (most urgent first)
  currentMetrics.loyalists.overdueCustomers.sort((a, b) => b.daysSinceLastVisit - a.daysSinceLastVisit);
  currentMetrics.new.overdueCustomers.sort((a, b) => b.daysSinceLastVisit - a.daysSinceLastVisit);

  return {
    overall: currentMetrics.overall,
    segments: {
      loyalists: currentMetrics.loyalists,
      new: currentMetrics.new
    },
    trend,
    history
  };
}

/**
 * 3b. Health Rate Trend Calculator
 * Calculates health rate trend by comparing current period vs previous 30-day period
 *
 * @param {Object} currentMetrics - Result from calculateCustomerMetrics() for current state
 * @param {Array} salesData - Raw sales data (used to calculate previous period)
 * @param {Array} rfmData - RFM segment data
 * @param {Array} customerData - Customer CSV data
 * @returns {{ current: number, previous: number, trend: number }}
 */
export function getHealthTrend(currentMetrics, salesData, rfmData, customerData) {
  if (!currentMetrics || !salesData || salesData.length === 0) {
    return { current: 0, previous: 0, trend: 0 };
  }

  const currentHealthRate = currentMetrics.healthRate || 0;

  // Filter salesData to only include transactions from 30+ days ago
  // This simulates what the data looked like 30 days ago
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const previousPeriodSales = salesData.filter(row => {
    const date = parseBrDate(row.Data || row.Data_Hora || row.date || '');
    return date && date < thirtyDaysAgo;
  });

  // If not enough historical data, return current with no trend
  if (previousPeriodSales.length < 10) {
    return { current: Math.round(currentHealthRate), previous: 0, trend: 0 };
  }

  // Calculate metrics for the previous period
  // Note: We pass the same rfmData and customerData since segments don't change
  const previousMetrics = calculateCustomerMetrics(previousPeriodSales, rfmData, customerData);
  const previousHealthRate = previousMetrics?.healthRate || 0;

  const trend = Math.round(currentHealthRate) - Math.round(previousHealthRate);

  return {
    current: Math.round(currentHealthRate),
    previous: Math.round(previousHealthRate),
    trend
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

/**
 * 5. Visit Heatmap Data (State-of-the-Art)
 * Creates a 7x15 grid (days × hours 8-23) with segment filtering and quantile-based color scale
 *
 * @param {Array} salesData - Raw sales data with Data_Hora field
 * @param {Object} customerMap - Map of customer ID → customer object (includes segment, firstVisit)
 * @param {string} segment - 'all' | 'loyalists' | 'new'
 * @param {number} days - Number of days to analyze (default 30)
 * @returns {Object} { grid, quantiles, peak, totalVisits }
 */
export function getVisitHeatmapData(salesData, customerMap = {}, segment = 'all', days = 30) {
  const HOUR_START = 8;
  const HOUR_END = 23;
  const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const DAYS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  // Calculate date window
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  // Threshold for "new" customers (first visit within last 30 days)
  const newCustomerThreshold = new Date(now);
  newCustomerThreshold.setDate(newCustomerThreshold.getDate() - 30);

  // Initialize grid: [day][hour] with Sets to track unique customers per cell
  const grid = {};
  for (let day = 0; day < 7; day++) {
    grid[day] = {};
    for (let hour = HOUR_START; hour < HOUR_END; hour++) {
      grid[day][hour] = new Set(); // Track unique customer IDs
    }
  }

  // Process sales data
  salesData.forEach(row => {
    const date = parseBrDate(row.Data || row.Data_Hora || row.date || '');
    if (!date || date < startDate || date > now) return;

    const customerId = extractCpf(row, CPF_COLUMNS);
    if (!customerId) return;

    // Segment filtering
    if (segment !== 'all') {
      const customer = customerMap[customerId];
      if (!customer) return;

      if (segment === 'loyalists') {
        // VIP or Frequente segments
        if (customer.segment !== 'VIP' && customer.segment !== 'Frequente') return;
      } else if (segment === 'new') {
        // Novato segment OR first visit within last 30 days
        const isNovatoSegment = customer.segment === 'Novato';
        const isRecentFirstVisit = customer.firstVisit && customer.firstVisit >= newCustomerThreshold;
        if (!isNovatoSegment && !isRecentFirstVisit) return;
      }
    }

    // Extract hour and day using timezone-safe Brazil components
    const hour = date.brazil?.hour ?? date.getHours();
    const dayOfWeek = date.brazil
      ? new Date(date.brazil.year, date.brazil.month - 1, date.brazil.day).getDay()
      : date.getDay();

    // Only count visits within business hours
    if (hour >= HOUR_START && hour < HOUR_END) {
      grid[dayOfWeek][hour].add(customerId);
    }
  });

  // Convert Sets to counts and build processed grid
  const processedGrid = [];
  const allValues = [];
  let maxCount = 0;
  let peakDay = 0;
  let peakHour = HOUR_START;

  for (let day = 0; day < 7; day++) {
    const dayRow = {
      day,
      dayName: DAYS[day],
      dayNameFull: DAYS_FULL[day],
      cells: []
    };

    for (let hour = HOUR_START; hour < HOUR_END; hour++) {
      const count = grid[day][hour].size;
      allValues.push(count);

      if (count > maxCount) {
        maxCount = count;
        peakDay = day;
        peakHour = hour;
      }

      dayRow.cells.push({
        hour,
        count,
        customerIds: Array.from(grid[day][hour])
      });
    }

    processedGrid.push(dayRow);
  }

  // Calculate quantile thresholds for non-linear color scale
  // Filter out zeros for better distribution
  const nonZeroValues = allValues.filter(v => v > 0).sort((a, b) => a - b);
  const getQuantile = (arr, q) => {
    if (arr.length === 0) return 0;
    const idx = Math.floor(arr.length * q);
    return arr[Math.min(idx, arr.length - 1)];
  };

  const quantiles = {
    p50: getQuantile(nonZeroValues, 0.50),
    p75: getQuantile(nonZeroValues, 0.75),
    p90: getQuantile(nonZeroValues, 0.90),
    p95: getQuantile(nonZeroValues, 0.95),
    max: maxCount
  };

  return {
    grid: processedGrid,
    quantiles,
    peak: {
      day: peakDay,
      dayName: DAYS[peakDay],
      dayNameFull: DAYS_FULL[peakDay],
      hour: peakHour,
      count: maxCount
    },
    totalVisits: allValues.reduce((a, b) => a + b, 0),
    hourRange: { start: HOUR_START, end: HOUR_END },
    dateRange: { start: startDate, end: now }
  };
}

/**
 * 6. First-to-Second Visit Conversion Metrics
 * Tracks the critical 1st→2nd visit conversion - the moment with highest churn risk.
 *
 * ALGORITHM (Cohort-Based):
 * - SEED_WINDOW: Look at customers whose first visit was 31-60 days ago
 * - These customers have had a full 30-day window to make their second visit
 * - This avoids the bias of recent customers who haven't had time to convert
 *
 * @param {Array} salesData - Raw sales transactions
 * @param {Object} customerMap - Customer metadata with contact tracking
 * @param {Set} welcomeContactedIds - Customers who received welcome campaign
 * @returns {Object} Conversion metrics with welcome campaign comparison
 */
export function getFirstVisitConversion(salesData, customerMap = {}, welcomeContactedIds = new Set()) {
  if (!salesData || salesData.length === 0) {
    return {
      conversionRate: 0,
      totalNewCustomers: 0,
      converted: 0,
      notConverted: 0,
      pending: 0,
      avgDaysToSecondVisit: 0,
      withWelcome: { total: 0, converted: 0, rate: 0 },
      withoutWelcome: { total: 0, converted: 0, rate: 0 },
      welcomeLift: 0,
      pendingCustomers: [],
      lostCustomers: []
    };
  }

  const now = new Date();
  const RETURN_WINDOW = 30;      // 30 days to count as "converted"
  const SEED_START = 60;         // Seed window: first visit 31-60 days ago
  const SEED_END = 31;           // (gives full 30-day return window)
  const PENDING_LOOKBACK = 30;   // For pending: first visit in last 30 days

  // Helper to parse date from row
  const getRowDate = (row) => parseBrDate(row.Data || row.Data_Hora || row.date || '');
  const getRowDoc = (row) => extractCPF(row);

  // Build per-customer visit history (deduplicated by date)
  // CRITICAL: Count unique visit DAYS, not raw transactions
  // A customer with 2 laundry loads on day 1 should count as 1 visit, not 2
  const customerVisitSets = {};
  salesData.forEach(row => {
    const doc = getRowDoc(row);
    const date = getRowDate(row);
    if (!doc || !date || !isValidCpf(doc)) return;

    if (!customerVisitSets[doc]) customerVisitSets[doc] = new Set();
    const dateKey = formatDate(date);
    customerVisitSets[doc].add(dateKey);
  });

  // Convert Sets to sorted Date arrays
  const customerVisits = {};
  Object.entries(customerVisitSets).forEach(([doc, dateSet]) => {
    customerVisits[doc] = Array.from(dateSet)
      .map(dateStr => parseBrDate(dateStr))
      .filter(d => d !== null)
      .sort((a, b) => a - b);
  });

  // Define seed window (31-60 days ago) for completed cohort
  const seedStartDate = new Date(now);
  seedStartDate.setDate(seedStartDate.getDate() - SEED_START);
  const seedEndDate = new Date(now);
  seedEndDate.setDate(seedEndDate.getDate() - SEED_END);

  // Define pending window (0-30 days ago) for actionable customers
  const pendingDate = new Date(now);
  pendingDate.setDate(pendingDate.getDate() - PENDING_LOOKBACK);

  const metrics = {
    totalNewCustomers: 0,
    converted: 0,          // Made 2nd visit within window
    notConverted: 0,       // Past window, never returned
    pending: 0,            // Within return window (too early to judge)
    avgDaysToSecondVisit: 0,

    // Welcome campaign comparison (based on completed cohort)
    withWelcome: { total: 0, converted: 0, rate: 0 },
    withoutWelcome: { total: 0, converted: 0, rate: 0 },

    // Customers who need attention (for modal)
    pendingCustomers: [],  // Recent new customers who haven't returned yet
    lostCustomers: [],     // Customers from seed window who didn't convert
  };

  const daysToReturn = [];

  Object.entries(customerVisits).forEach(([customerId, visits]) => {
    const firstVisit = visits[0];
    const daysSinceFirst = Math.floor((now - firstVisit) / (1000 * 60 * 60 * 24));
    const hasWelcome = welcomeContactedIds.has(customerId);
    const customer = customerMap[customerId] || {};

    // Check if customer is in the COMPLETED COHORT (first visit 31-60 days ago)
    const isInSeedWindow = firstVisit >= seedStartDate && firstVisit <= seedEndDate;

    // Check if customer is PENDING (first visit in last 30 days, no 2nd visit yet)
    const isInPendingWindow = firstVisit >= pendingDate;

    if (isInSeedWindow) {
      // COMPLETED COHORT: These customers have had full 30 days to convert
      metrics.totalNewCustomers++;

      if (hasWelcome) {
        metrics.withWelcome.total++;
      } else {
        metrics.withoutWelcome.total++;
      }

      if (visits.length >= 2) {
        // Customer returned - check if within 30 days of first visit
        const secondVisit = visits[1];
        const daysToSecond = Math.floor((secondVisit - firstVisit) / (1000 * 60 * 60 * 24));

        if (daysToSecond <= RETURN_WINDOW) {
          metrics.converted++;
          daysToReturn.push(daysToSecond);

          if (hasWelcome) metrics.withWelcome.converted++;
          else metrics.withoutWelcome.converted++;
        } else {
          // Returned but after 30 days - counts as not converted
          metrics.notConverted++;
          metrics.lostCustomers.push({
            id: customerId,
            doc: customerId,
            daysSinceFirstVisit: daysSinceFirst,
            hasWelcome,
            name: customer.name || `Cliente ${customerId.slice(-4)}`,
            phone: customer.phone || null,
            segment: customer.segment || 'Novo',
            netTotal: customer.netTotal || 0,
            firstVisit,
            returnedLate: true
          });
        }
      } else {
        // Never returned
        metrics.notConverted++;
        metrics.lostCustomers.push({
          id: customerId,
          doc: customerId,
          daysSinceFirstVisit: daysSinceFirst,
          hasWelcome,
          name: customer.name || `Cliente ${customerId.slice(-4)}`,
          phone: customer.phone || null,
          segment: customer.segment || 'Novo',
          netTotal: customer.netTotal || 0,
          firstVisit,
          returnedLate: false
        });
      }
    } else if (isInPendingWindow && visits.length === 1) {
      // PENDING: Recent new customers who haven't made 2nd visit yet
      metrics.pending++;
      metrics.pendingCustomers.push({
        id: customerId,
        doc: customerId,
        daysSinceFirstVisit: daysSinceFirst,
        hasWelcome,
        name: customer.name || `Cliente ${customerId.slice(-4)}`,
        phone: customer.phone || null,
        segment: customer.segment || 'Novo',
        netTotal: customer.netTotal || 0,
        firstVisit
      });
    }
  });

  // Calculate conversion rate from completed cohort
  const completedCohort = metrics.converted + metrics.notConverted;
  metrics.conversionRate = completedCohort > 0
    ? Math.round((metrics.converted / completedCohort) * 100)
    : 0;

  metrics.avgDaysToSecondVisit = daysToReturn.length > 0
    ? Math.round(daysToReturn.reduce((a, b) => a + b, 0) / daysToReturn.length * 10) / 10
    : 0;

  // Calculate welcome campaign rates (from completed cohort only)
  metrics.withWelcome.rate = metrics.withWelcome.total > 0
    ? Math.round((metrics.withWelcome.converted / metrics.withWelcome.total) * 100)
    : 0;

  metrics.withoutWelcome.rate = metrics.withoutWelcome.total > 0
    ? Math.round((metrics.withoutWelcome.converted / metrics.withoutWelcome.total) * 100)
    : 0;

  // Welcome campaign lift
  metrics.welcomeLift = metrics.withWelcome.rate - metrics.withoutWelcome.rate;

  // Sort customers by days since first visit (most urgent first)
  metrics.pendingCustomers.sort((a, b) => b.daysSinceFirstVisit - a.daysSinceFirstVisit);
  metrics.lostCustomers.sort((a, b) => b.daysSinceFirstVisit - a.daysSinceFirstVisit);

  return metrics;
}

/**
 * 7. Frequency Degradation Detection (Early Churn Warning)
 * Detects customers whose visit intervals are growing - an early signal of churn risk
 * before they enter the At Risk threshold.
 *
 * NOTE: This function rebuilds visit dates from salesData because the dates array
 * is deleted from customer objects for memory optimization.
 *
 * @param {Array} salesData - Raw sales transactions (to rebuild visit dates)
 * @param {Object} customerMap - Customer metadata (doc → customer object)
 * @param {Object} options - Configuration options
 * @returns {Object} Degradation metrics and prioritized customer list
 */
export function getFrequencyDegradation(salesData, customerMap = {}, options = {}) {
  if (!salesData || salesData.length === 0) {
    return {
      customers: [],
      count: 0,
      priorityCount: 0,
      totalRevenue: 0,
      avgDegradation: 0
    };
  }

  const {
    minVisits = 4,              // Need history to detect pattern change
    degradationThreshold = 50,  // 50% interval increase = concerning
    maxDaysSince = 30,          // Only active customers (not already flagged)
    focusSegments = ['VIP', 'Frequente']  // Priority segments
  } = options;

  const now = new Date();

  // Helper to parse date from row
  const getRowDate = (row) => parseBrDate(row.Data || row.Data_Hora || row.date || '');
  const getRowDoc = (row) => extractCPF(row);

  // Rebuild visit dates per customer from salesData
  const customerVisits = {};
  salesData.forEach(row => {
    const doc = getRowDoc(row);
    const date = getRowDate(row);
    if (!doc || !date || !isValidCpf(doc)) return;

    if (!customerVisits[doc]) customerVisits[doc] = [];
    customerVisits[doc].push(date);
  });

  // Sort all customer visits by date
  Object.values(customerVisits).forEach(visits => {
    visits.sort((a, b) => a - b);
  });

  const degradingCustomers = [];

  // Calculate average intervals helper
  const calcAvgInterval = (dates) => {
    if (dates.length < 2) return null;
    const intervals = [];
    for (let i = 1; i < dates.length; i++) {
      const days = Math.round((dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24));
      if (days > 0) intervals.push(days);
    }
    return intervals.length > 0
      ? intervals.reduce((a, b) => a + b, 0) / intervals.length
      : null;
  };

  Object.entries(customerVisits).forEach(([customerId, sortedDates]) => {
    // Skip if not enough history
    if (sortedDates.length < minVisits) return;

    const customer = customerMap[customerId];
    if (!customer) return;

    // Calculate days since last visit
    const lastVisit = sortedDates[sortedDates.length - 1];
    const daysSinceLastVisit = Math.floor((now - lastVisit) / (1000 * 60 * 60 * 24));

    // Skip if already at risk or beyond threshold
    if (daysSinceLastVisit > maxDaysSince) return;
    if (customer.riskLevel === 'At Risk' || customer.riskLevel === 'Churning' || customer.riskLevel === 'Lost') return;

    // Split into historical (older 80%) and recent (newest 20%)
    const splitIndex = Math.floor(sortedDates.length * 0.8);
    if (splitIndex < 2) return; // Need at least 2 historical visits

    const historicalDates = sortedDates.slice(0, splitIndex);
    const recentDates = sortedDates.slice(splitIndex - 1); // Include overlap point

    const historicalAvg = calcAvgInterval(historicalDates);
    const recentAvg = calcAvgInterval(recentDates);

    if (!historicalAvg || !recentAvg || historicalAvg === 0) return;

    // === MULTI-FACTOR PATTERN DETECTION (v3.11.0) ===
    // Purpose: Filter win-backs, recovered, and sporadic customers - keep true degrading ones

    // Constants for pattern detection
    const OUTLIER_MULTIPLIER = 4;           // Was 5 - lowered to catch gaps like Luciano (122d > 25d*4=100d)
    const ELEVATED_MULTIPLIER = 1.5;        // Above avg × 1.5 = elevated interval
    const LAST_INTERVAL_MULTIPLIER = 4;     // If last interval > 4× historical = recent win-back
    const MAX_HISTORICAL_AVG = 45;          // Skip customers with >45d avg (inherently sporadic)
    const MAX_CV = 1.5;                     // Skip if coefficient of variation > 1.5 (inconsistent pattern)

    // 0. Filter SPORADIC customers - degradation detection unreliable for infrequent visitors
    if (historicalAvg > MAX_HISTORICAL_AVG) {
      return; // Skip - customer visits too infrequently for meaningful degradation detection
    }

    // Calculate historical intervals for consistency check
    const historicalIntervals = [];
    for (let i = 1; i < historicalDates.length; i++) {
      const days = Math.round((historicalDates[i] - historicalDates[i-1]) / (1000 * 60 * 60 * 24));
      if (days > 0) historicalIntervals.push(days);
    }

    // Filter INCONSISTENT patterns - if historical intervals vary wildly, baseline is unreliable
    if (historicalIntervals.length >= 2) {
      const variance = historicalIntervals.reduce((sum, x) => sum + Math.pow(x - historicalAvg, 2), 0) / historicalIntervals.length;
      const cv = Math.sqrt(variance) / historicalAvg;
      if (cv > MAX_CV) {
        return; // Skip - historical pattern too inconsistent to detect degradation reliably
      }
    }

    // Calculate ALL intervals for pattern analysis
    const allIntervals = [];
    for (let i = 1; i < sortedDates.length; i++) {
      const days = Math.round((sortedDates[i] - sortedDates[i-1]) / (1000 * 60 * 60 * 24));
      if (days > 0) allIntervals.push(days);
    }
    const maxInterval = allIntervals.length > 0 ? Math.max(...allIntervals) : 0;

    const elevatedThreshold = historicalAvg * ELEVATED_MULTIPLIER;
    const outlierThreshold = historicalAvg * OUTLIER_MULTIPLIER;

    // 1. Filter WIN-BACK customers (extreme outlier)
    // If max interval is 5× the historical average, they already churned and returned
    if (maxInterval > outlierThreshold) {
      return; // Skip - this is a win-back, not gradual degradation
    }

    // 2. Filter RECENT WIN-BACK (last interval alone is very large)
    const lastOverallInterval = allIntervals[allIntervals.length - 1];
    if (lastOverallInterval > historicalAvg * LAST_INTERVAL_MULTIPLIER) {
      return; // Skip - recent gap too large, likely win-back not gradual degradation
    }

    // 3. Check for RECOVERY in recent behavior
    // Calculate recent intervals to check if customer has recovered
    const recentIntervals = [];
    for (let i = 1; i < recentDates.length; i++) {
      const days = Math.round((recentDates[i] - recentDates[i-1]) / (1000 * 60 * 60 * 24));
      if (days > 0) recentIntervals.push(days);
    }

    if (recentIntervals.length > 0) {
      const lastInterval = recentIntervals[recentIntervals.length - 1];
      const last3 = recentIntervals.slice(-3);
      const last3Avg = last3.reduce((a, b) => a + b, 0) / last3.length;

      // Check if customer has recovered (back to normal patterns)
      const lastIsNormal = lastInterval <= elevatedThreshold;
      const last3Normal = last3Avg <= elevatedThreshold;

      // 4. Filter FULLY RECOVERED customers
      // If both last interval AND last 3 average are normal, they've recovered
      if (lastIsNormal && last3Normal) {
        return; // Skip - customer has fully recovered to normal patterns
      }
    }

    // Calculate degradation percentage
    const degradationPct = ((recentAvg - historicalAvg) / historicalAvg) * 100;

    if (degradationPct >= degradationThreshold) {
      // Get last 5 intervals for visual history (shows trend clarity)
      const recentGaps = allIntervals.slice(-5).map(d => Math.round(d));

      degradingCustomers.push({
        id: customerId,
        doc: customerId,
        name: customer.name,
        phone: customer.phone,
        segment: customer.segment,
        netTotal: customer.netTotal || 0,
        visits: customer.visits || sortedDates.length,
        daysSinceLastVisit,
        riskLevel: customer.riskLevel,
        historicalAvg: Math.round(historicalAvg * 10) / 10,
        recentAvg: Math.round(recentAvg * 10) / 10,
        degradationPct: Math.round(degradationPct),
        isPriority: focusSegments.includes(customer.segment),
        recentGaps  // Last 5 visit intervals for UI display
      });
    }
  });

  // Sort by priority (VIP first), then by degradation severity
  degradingCustomers.sort((a, b) => {
    if (a.isPriority !== b.isPriority) return b.isPriority - a.isPriority;
    return b.degradationPct - a.degradationPct;
  });

  // Summary metrics
  const priorityCount = degradingCustomers.filter(c => c.isPriority).length;
  const totalRevenue = degradingCustomers.reduce((sum, c) => sum + (c.netTotal || 0), 0);

  return {
    customers: degradingCustomers,
    count: degradingCustomers.length,
    priorityCount,
    totalRevenue,
    avgDegradation: degradingCustomers.length > 0
      ? Math.round(degradingCustomers.reduce((sum, c) => sum + c.degradationPct, 0) / degradingCustomers.length)
      : 0
  };
}
