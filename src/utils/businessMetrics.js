// Business Metrics Calculator v2.0 - FIXED
// ✅ Cashback calculation added (7.5% from June 1, 2024)
// ✅ Operating hours corrected (8 AM - 11 PM = 15 hours)
// ✅ Active days calculation fixed (always 7 for weekly window)
// Revenue, utilization, services - NO customer calculations

import { parseBrDate } from './dateUtils';

// CASHBACK CONFIGURATION - Matches Make.com Calculate_Metrics.js
const CASHBACK_RATE = 0.075; // 7.5%
const CASHBACK_START_DATE = new Date(2024, 5, 1); // June 1, 2024 (month is 0-indexed)

/**
 * Get date windows for current week, previous week, and 4-week period
 * Sunday-Saturday business weeks
 */
function getDateWindows() {
  const currentDate = new Date();
  
  // Find most recent Saturday (end of current week)
  let lastSaturday = new Date(currentDate);
  const daysFromSaturday = (currentDate.getDay() + 1) % 7;
  lastSaturday.setDate(lastSaturday.getDate() - daysFromSaturday);
  lastSaturday.setHours(23, 59, 59, 999);
  
  // Sunday that starts this week
  let startSunday = new Date(lastSaturday);
  startSunday.setDate(startSunday.getDate() - 6);
  startSunday.setHours(0, 0, 0, 0);
  
  // Previous week
  let prevWeekEnd = new Date(startSunday);
  prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
  prevWeekEnd.setHours(23, 59, 59, 999);
  
  let prevWeekStart = new Date(prevWeekEnd);
  prevWeekStart.setDate(prevWeekStart.getDate() - 6);
  prevWeekStart.setHours(0, 0, 0, 0);
  
  // Four week window
  let fourWeekStart = new Date(startSunday);
  fourWeekStart.setDate(fourWeekStart.getDate() - 21);
  
  const formatDate = (d) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };
  
  return {
    weekly: { 
      start: startSunday, 
      end: lastSaturday,
      startDate: formatDate(startSunday),
      endDate: formatDate(lastSaturday)
    },
    previousWeek: { 
      start: prevWeekStart, 
      end: prevWeekEnd 
    },
    fourWeek: { 
      start: fourWeekStart, 
      end: lastSaturday 
    }
  };
};

const BUSINESS_PARAMS = {
  TOTAL_WASHERS: 3,
  TOTAL_DRYERS: 5,
  OPERATING_HOURS: { start: 8, end: 23 }, // ✅ FIXED: 8 AM to 11 PM (was 10 PM)
  WASHER_CYCLE_MINUTES: 30,
  DRYER_CYCLE_MINUTES: 45
};

const OPERATING_HOURS_PER_DAY = BUSINESS_PARAMS.OPERATING_HOURS.end - BUSINESS_PARAMS.OPERATING_HOURS.start;
const TOTAL_MACHINES = BUSINESS_PARAMS.TOTAL_WASHERS + BUSINESS_PARAMS.TOTAL_DRYERS;

/**
 * Count machines from transaction
 */
function countMachines(str) {
  if (!str) return { wash: 0, dry: 0, total: 0 };
  const machines = String(str).toLowerCase().split(',').map(m => m.trim());
  let wash = 0, dry = 0;
  machines.forEach(m => {
    if (m.includes('lavadora')) wash++;
    else if (m.includes('secadora')) dry++;
  });
  return { wash, dry, total: wash + dry };
}

/**
 * Parse sales data into records with cashback calculation
 * ✅ NEW: Applies 7.5% cashback to net revenue from June 1, 2024
 */
function parseSalesRecords(salesData) {
  const records = [];
  
  salesData.forEach(row => {
    const date = parseBrDate(row.Data || row.Data_Hora || row.date || '');
    if (!date) return;

    let grossValue = parseFloat(row.Valor_Venda || row.gross_value || 0) || 0;
    let netValue = parseFloat(row.Valor_Pago || row.net_value || 0) || 0;
    let discountAmount = grossValue - netValue;
    let cashbackAmount = 0;
    
    // ✅ CASHBACK CALCULATION - Matches Calculate_Metrics.js line 564-569
    if (date >= CASHBACK_START_DATE) {
      cashbackAmount = Math.round(grossValue * CASHBACK_RATE * 100) / 100;
      netValue = Math.round((netValue - cashbackAmount) * 100) / 100;
      discountAmount = Math.round((discountAmount + cashbackAmount) * 100) / 100;
    }
    
    const machineInfo = countMachines(row.Maquinas || row.machine || '');
    
    records.push({
      date,
      dateStr: date.toISOString().split('T')[0],
      hour: date.getHours(),
      grossValue,
      netValue,
      discountAmount,
      cashbackAmount, // Track cashback separately for debugging
      washCount: machineInfo.wash,
      dryCount: machineInfo.dry,
      totalServices: machineInfo.total
    });
  });
  
  return records;
}

/**
 * Filter records by date window
 */
function filterByWindow(records, window) {
  return records.filter(r => r.date >= window.start && r.date <= window.end);
}

/**
 * Calculate totals from records
 * ✅ FIXED: Active days calculation now uses window boundaries for weekly metrics
 */
function calculateTotals(records, window = null) {
  const sum = (arr, fn) => arr.reduce((s, x) => s + fn(x), 0);
  
  // ✅ FIX: If window provided (for weekly), calculate exactly 7 days
  let activeDays;
  if (window && window.start && window.end) {
    // Calculate days between start and end (inclusive)
    const diffTime = Math.abs(window.end - window.start);
    activeDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  } else {
    // For fourWeek window, count unique dates in data
    activeDays = new Set(records.map(r => r.dateStr)).size;
  }
  
  return {
    transactions: records.length,
    grossRevenue: Math.round(sum(records, r => r.grossValue) * 100) / 100,
    netRevenue: Math.round(sum(records, r => r.netValue) * 100) / 100,
    discountAmount: Math.round(sum(records, r => r.discountAmount) * 100) / 100,
    cashbackAmount: Math.round(sum(records, r => r.cashbackAmount || 0) * 100) / 100,
    washServices: sum(records, r => r.washCount),
    dryServices: sum(records, r => r.dryCount),
    totalServices: sum(records, r => r.totalServices),
    activeDays: activeDays
  };
}

/**
 * Calculate machine utilization
 * ✅ FIXED: Now uses 15 operating hours per day (8 AM - 11 PM)
 */
function calculateUtilization(records, window = null) {
  const sum = (arr, fn) => arr.reduce((s, x) => s + fn(x), 0);
  
  const operatingRecords = records.filter(r =>
    r.hour >= BUSINESS_PARAMS.OPERATING_HOURS.start &&
    r.hour < BUSINESS_PARAMS.OPERATING_HOURS.end
  );

  const operatingWashCount = sum(operatingRecords, r => r.washCount);
  const operatingDryCount = sum(operatingRecords, r => r.dryCount);
  
  // ✅ FIX: Use exact day count from window for weekly calculations
  let activeDays;
  if (window && window.start && window.end) {
    const diffTime = Math.abs(window.end - window.start);
    activeDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  } else {
    activeDays = new Set(records.map(r => r.dateStr)).size;
  }

  // Capacity = machines × hours/day × days × cycles/hour
  // ✅ Now uses 15 hours (was 14)
  const maxWashServices = BUSINESS_PARAMS.TOTAL_WASHERS * OPERATING_HOURS_PER_DAY * activeDays * 2;
  const maxDryServices = BUSINESS_PARAMS.TOTAL_DRYERS * OPERATING_HOURS_PER_DAY * activeDays * 1.33;

  const washUtilization = maxWashServices > 0 ? (operatingWashCount / maxWashServices) * 100 : 0;
  const dryUtilization = maxDryServices > 0 ? (operatingDryCount / maxDryServices) * 100 : 0;

  const totalServices = operatingWashCount + operatingDryCount;
  const totalUtilization = totalServices > 0
    ? ((operatingWashCount * washUtilization) + (operatingDryCount * dryUtilization)) / totalServices
    : 0;

  return {
    washUtilization: Math.round(washUtilization * 10) / 10,
    dryUtilization: Math.round(dryUtilization * 10) / 10,
    totalUtilization: Math.round(totalUtilization * 10) / 10
  };
}

/**
 * Calculate week-over-week changes
 */
function calculateWeekOverWeek(currentTotals, prevTotals, currentUtil, prevUtil) {
  const percentChange = (current, previous) =>
    current > 0 && previous > 0 ? ((current / previous) - 1) * 100 : null;

  const currentSPT = currentTotals.transactions > 0
    ? currentTotals.totalServices / currentTotals.transactions : 0;
  const prevSPT = prevTotals.transactions > 0
    ? prevTotals.totalServices / prevTotals.transactions : 0;

  return {
    grossRevenue: percentChange(currentTotals.grossRevenue, prevTotals.grossRevenue),
    netRevenue: percentChange(currentTotals.netRevenue, prevTotals.netRevenue),
    transactions: percentChange(currentTotals.transactions, prevTotals.transactions),
    totalServices: percentChange(currentTotals.totalServices, prevTotals.totalServices),
    servicesPerTransaction: percentChange(currentSPT, prevSPT),
    utilization: currentUtil.totalUtilization > 0 && prevUtil.totalUtilization > 0
      ? currentUtil.totalUtilization - prevUtil.totalUtilization : null,
    washUtilization: currentUtil.washUtilization > 0 && prevUtil.washUtilization > 0
      ? currentUtil.washUtilization - prevUtil.washUtilization : null,
    dryUtilization: currentUtil.dryUtilization > 0 && prevUtil.dryUtilization > 0
      ? currentUtil.dryUtilization - prevUtil.dryUtilization : null
  };
}

/**
 * Main function - Calculate all business metrics
 * ✅ v2.0: Now includes cashback, correct hours, and fixed active days
 */
export function calculateBusinessMetrics(salesData) {
  console.log('=== BUSINESS METRICS v2.0 DEBUG ===');
  console.log('Input sales rows:', salesData.length);
  
  const records = parseSalesRecords(salesData);
  console.log('Parsed records:', records.length);
  console.log('Sample record:', records[0]);
  
  const windows = getDateWindows();
  console.log('Date windows:', {
    weekly: `${windows.weekly.startDate} - ${windows.weekly.endDate}`,
    prevWeek: `${windows.previousWeek.start.toISOString()} - ${windows.previousWeek.end.toISOString()}`,
    fourWeek: `${windows.fourWeek.start.toISOString()} - ${windows.fourWeek.end.toISOString()}`
  });

  const weekRecords = filterByWindow(records, windows.weekly);
  const prevWeekRecords = filterByWindow(records, windows.previousWeek);
  const fourWeekRecords = filterByWindow(records, windows.fourWeek);
  
  console.log('Filtered records:', {
    week: weekRecords.length,
    prevWeek: prevWeekRecords.length,
    fourWeek: fourWeekRecords.length
  });

  // ✅ Pass window to calculateTotals for accurate day count
  const weeklyTotals = calculateTotals(weekRecords, windows.weekly);
  console.log('Weekly totals:', weeklyTotals);
  const prevWeekTotals = calculateTotals(prevWeekRecords, windows.previousWeek);
  console.log('Prev. Weekly totals:', prevWeekTotals);
  const fourWeekTotals = calculateTotals(fourWeekRecords);
  console.log('Four Weekly totals:', fourWeekTotals);

  // ✅ Pass window to calculateUtilization for accurate day count
  const weeklyUtil = calculateUtilization(weekRecords, windows.weekly);
  console.log('Weekly Util:', weeklyUtil);
  const prevWeekUtil = calculateUtilization(prevWeekRecords, windows.previousWeek);
  console.log('Prev Weekly Util:', prevWeekUtil);
  const fourWeekUtil = calculateUtilization(fourWeekRecords);
  console.log('Four Weekly Util:', fourWeekUtil);

  const weekOverWeek = calculateWeekOverWeek(
    weeklyTotals, prevWeekTotals, weeklyUtil, prevWeekUtil
  );

  return {
    weekly: {
      ...weeklyTotals,
      ...weeklyUtil,
      servicesPerTransaction: weeklyTotals.transactions > 0
        ? weeklyTotals.totalServices / weeklyTotals.transactions : 0
    },
    previousWeek: {
      ...prevWeekTotals,
      ...prevWeekUtil,
      servicesPerTransaction: prevWeekTotals.transactions > 0
        ? prevWeekTotals.totalServices / prevWeekTotals.transactions : 0
    },
    fourWeek: {
      ...fourWeekTotals,
      ...fourWeekUtil,
      servicesPerTransaction: fourWeekTotals.transactions > 0
        ? fourWeekTotals.totalServices / fourWeekTotals.transactions : 0
    },
    weekOverWeek,
    windows
  };
}

/**
 * Get daily revenue for charts
 * ✅ Now includes cashback deduction in revenue calculations
 */
export function getDailyRevenue(salesData, days = 30) {
  const records = parseSalesRecords(salesData);
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - days);

  const dailyMap = {};

  records.forEach(r => {
    if (r.date < startDate) return;
    
    if (!dailyMap[r.dateStr]) {
      dailyMap[r.dateStr] = {
        date: r.dateStr,
        revenue: 0,
        transactions: 0
      };
    }
    
    dailyMap[r.dateStr].revenue += r.netValue;
    dailyMap[r.dateStr].transactions++;
  });

  const dailyArray = Object.values(dailyMap).sort((a, b) =>
    new Date(a.date) - new Date(b.date)
  );

  // 7-day moving average
  dailyArray.forEach((day, i) => {
    if (i < 6) {
      day.movingAvg = null;
    } else {
      const sum = dailyArray.slice(i - 6, i + 1).reduce((acc, d) => acc + d.revenue, 0);
      day.movingAvg = sum / 7;
    }
  });

  return dailyArray;
}
