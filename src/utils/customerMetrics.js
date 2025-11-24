// Customer Metrics Calculator v2.2.0 - INTELLIGENCE HUB ANALYTICS
// ✅ Brazilian number parsing added (handles comma decimals)
// ✅ Cashback rate corrected (7.5%)
// ✅ Cashback start date corrected (June 1, 2024)
// ✅ NEW: Intelligence Hub analytics functions (v2.2.0 - 2025-11-23)
//     - getRFMCoordinates: Maps customers to RFM scatter plot coordinates
//     - getChurnHistogramData: Creates time-to-churn distribution buckets
//     - getRetentionCohorts: Calculates actual return rates (30/60/90 days)
//     - getAcquisitionTrend: Tracks new customer acquisition over time

import { parseBrDate } from './dateUtils';

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

// Normalize document number (CPF) - pad to 11 digits
function normalizeDoc(doc) {
  if (!doc) return '';
  const cleaned = String(doc).replace(/\D/g, '');
  if (cleaned.length > 0 && cleaned.length <= 11) {
    return cleaned.padStart(11, '0');
  }
  return cleaned;
};

const LOST_THRESHOLD = 120; // Days until customer is considered "Lost"
const CASHBACK_RATE = 0.075; // 7.5% cashback
const CASHBACK_START = new Date(2024, 5, 1); // June 1, 2024

// RFM segment bonus multipliers for return likelihood
const SEGMENT_BONUS = {
  'Champion': 1.2,
  'Loyal': 1.1,
  'Potential': 1.0,
  'At Risk': 0.8,
  'Need Attention': 0.8,
  'AtRisk': 0.8,
  'Lost': 0.5,
  'New': 0.9,
  'Unclassified': 1.0
};

// Risk level thresholds
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
export function calculateCustomerMetrics(salesData, rfmData = []) {
  const customers = {};
  const rfmMap = {};
  const now = new Date();

  // Build RFM lookup - with safety check
  if (Array.isArray(rfmData) && rfmData.length > 0) {
    rfmData.forEach(row => {
      const doc = normalizeDoc(row.Doc_Cliente || row.col2 || row.doc || '');
      if (doc) {
        rfmMap[doc] = {
          segment: row.segment || row.col1 || row.Segment || 'Unclassified',
          name: row['client name'] || row.name || row.Name || row.cliente || null,
          phone: row['phone number'] || row.phone || row.Phone || null,
          lastContactDate: row.col5 || row.lastContactDate || null
        };
      }
    });
  }

  console.log('RFM map built with', Object.keys(rfmMap).length, 'entries');
  console.log('Sample RFM entry:', Object.values(rfmMap)[0]);

  // Process sales data
  salesData.forEach(row => {
    const doc = normalizeDoc(row.Doc_Cliente || row.document || row.doc || '');
    if (!doc) return;

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
        name: row.Nome || row.Cliente || row.name || `Customer ${doc.slice(-4)}`,
        transactions: 0,
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
        lastContactDate: null
      };
    }

    const customer = customers[doc];
    customer.transactions++;
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

  // Calculate risk levels (V2.1 algorithm)
  Object.values(customers).forEach(customer => {
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

    customer.servicesPerVisit = (customer.totalServices / customer.transactions).toFixed(1);

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
      customer.phone = rfmInfo.phone;
      customer.lastContactDate = rfmInfo.lastContactDate;
    } else {
      customer.segment = 'Unclassified';
    }

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

  // Aggregate metrics
  const allCustomers = Object.values(customers);
  const activeCustomers = allCustomers.filter(c => c.riskLevel !== 'Lost');
  const lostCustomers = allCustomers.filter(c => c.riskLevel === 'Lost');

  const healthyCount = activeCustomers.filter(c => c.riskLevel === 'Healthy').length;
  const monitorCount = activeCustomers.filter(c => c.riskLevel === 'Monitor').length;
  const atRiskCount = activeCustomers.filter(c => c.riskLevel === 'At Risk').length;
  const churningCount = activeCustomers.filter(c => c.riskLevel === 'Churning').length;
  const newCustomerCount = activeCustomers.filter(c => c.riskLevel === 'New Customer').length;

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
    newCustomerCount,
    healthRate,

    // Lists
    allCustomers,
    activeCustomers,
    lostCustomers
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
 */
export function getRFMCoordinates(customers) {
  return customers.map(c => ({
    id: c.doc,
    name: c.name,
    x: c.daysSinceLastVisit, // Recency (Days ago)
    y: c.netTotal,           // Monetary (Total Spend)
    r: c.transactions,       // Radius (Frequency)
    status: c.riskLevel,
    segment: c.segment
  }));
}

/**
 * 2. Churn Histogram Data (Danger Zone)
 * Creates buckets for "Days Between Visits" to visualize drop-off
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
      label: i < 30 ? 'Safe' : i < 60 ? 'Warning' : 'Danger'
    });
  }

  // Fill buckets
  validCustomers.forEach(c => {
    const days = c.avgDaysBetween;
    const bucketIndex = Math.min(
      Math.floor(days / bucketSize),
      buckets.length - 1
    );
    buckets[bucketIndex].count++;
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
  const getRowDoc = (row) => normalizeDoc(row.Doc_Cliente || row.document || row.doc || '');

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

    // Window to check for return: Target Date -> Target Date + 30 days
    const windowEnd = new Date(targetDate);
    windowEnd.setDate(windowEnd.getDate() + 30);

    // Tolerance for "Active at Target Date": Target Date +/- 15 days
    const activeStart = new Date(targetDate);
    activeStart.setDate(activeStart.getDate() - 15);
    const activeEnd = new Date(targetDate);
    activeEnd.setDate(activeEnd.getDate() + 15);

    let eligible = 0;
    let returned = 0;

    Object.values(customerVisits).forEach(visits => {
      // Was customer active around the target date?
      const wasActive = visits.some(d => d >= activeStart && d <= activeEnd);

      if (wasActive) {
        eligible++;
        // Did they return AFTER the target date (within 30 days)?
        const didReturn = visits.some(d => d > targetDate && d <= windowEnd);
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
 */
export function getAcquisitionTrend(customers, days = 30) {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  const dailyCounts = {};

  // Initialize all days with 0
  for (let i = 0; i <= days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
    dailyCounts[dateStr] = {
      date: dateStr,
      displayDate: `${d.getDate()}/${d.getMonth() + 1}`,
      count: 0
    };
  }

  // Count new customers
  customers.forEach(c => {
    if (c.firstVisit && c.firstVisit >= startDate) {
      const dateStr = c.firstVisit.toISOString().split('T')[0];
      if (dailyCounts[dateStr]) {
        dailyCounts[dateStr].count++;
      }
    }
  });

  return Object.values(dailyCounts);
}
