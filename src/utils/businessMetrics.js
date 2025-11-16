// Business Metrics Calculator v2.5 - FIXED VERSION
// ✅ Uses shared transactionParser for consistent cashback handling
// ✅ TIME-BASED utilization formula (machine-minutes, not service-weighted)
// ✅ Excludes Recarga from service counts
// ✅ Includes Recarga in revenue totals

import { parseSalesRecords, filterByType, filterWithServices } from './transactionParser';

const BUSINESS_PARAMS = {
  TOTAL_WASHERS: 3,
  TOTAL_DRYERS: 5,
  OPERATING_HOURS: { start: 8, end: 23 }, // 8 AM to 11 PM
  WASHER_CYCLE_MINUTES: 30,
  DRYER_CYCLE_MINUTES: 45
};

const OPERATING_HOURS_PER_DAY = BUSINESS_PARAMS.OPERATING_HOURS.end - BUSINESS_PARAMS.OPERATING_HOURS.start;

/**
 * Get date windows for calculations
 */
function getDateWindows() {
  const currentDate = new Date();
  
  // CURRENT WEEK: Most recent Sunday → Most recent Saturday
  let lastSaturday = new Date(currentDate);
  const daysFromSaturday = (currentDate.getDay() + 1) % 7;
  lastSaturday.setDate(lastSaturday.getDate() - daysFromSaturday);
  lastSaturday.setHours(23, 59, 59, 999);
  
  let startSunday = new Date(lastSaturday);
  startSunday.setDate(startSunday.getDate() - 6);
  startSunday.setHours(0, 0, 0, 0);
  
  // PREVIOUS WEEK
  let prevWeekEnd = new Date(startSunday);
  prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
  prevWeekEnd.setHours(23, 59, 59, 999);
  
  let prevWeekStart = new Date(prevWeekEnd);
  prevWeekStart.setDate(prevWeekStart.getDate() - 6);
  prevWeekStart.setHours(0, 0, 0, 0);
  
  // TWO WEEKS AGO
  let twoWeeksAgoEnd = new Date(prevWeekStart);
  twoWeeksAgoEnd.setDate(twoWeeksAgoEnd.getDate() - 1);
  twoWeeksAgoEnd.setHours(23, 59, 59, 999);
  
  let twoWeeksAgoStart = new Date(twoWeeksAgoEnd);
  twoWeeksAgoStart.setDate(twoWeeksAgoStart.getDate() - 6);
  twoWeeksAgoStart.setHours(0, 0, 0, 0);
  
  // FOUR WEEK WINDOW
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
    previousWeekly: { 
      start: prevWeekStart, 
      end: prevWeekEnd,
      startDate: formatDate(prevWeekStart),
      endDate: formatDate(prevWeekEnd)
    },
    twoWeeksAgo: { 
      start: twoWeeksAgoStart, 
      end: twoWeeksAgoEnd 
    },
    fourWeek: { 
      start: fourWeekStart, 
      end: lastSaturday 
    }
  };
}

/**
 * Filter records by date window
 */
function filterByWindow(records, window) {
  return records.filter(r => r.date >= window.start && r.date <= window.end);
}

/**
 * Calculate totals from records
 * ✅ Rounds only AFTER summing (not per-transaction)
 * ✅ Active days calculated from window boundaries
 * ✅ Includes all revenue (Type 1 + Type 3)
 * ✅ Excludes Recarga from service counts
 */
function calculateTotals(records, window = null) {
  const sum = (arr, fn) => arr.reduce((s, x) => s + fn(x), 0);
  
  // Calculate days from window boundaries
  let activeDays;
  if (window && window.start && window.end) {
    const msPerDay = 1000 * 60 * 60 * 24;
    const diffMs = window.end.getTime() - window.start.getTime();
    activeDays = Math.round(diffMs / msPerDay);
    
    if (activeDays < 7 && window.end.getDate() - window.start.getDate() === 6) {
      activeDays = 7;
    }
  } else {
    activeDays = new Set(records.map(r => r.dateStr)).size;
  }
  
  // Filter for service counts (exclude Recarga)
  const serviceRecords = filterWithServices(records);
  
  // Sum first, THEN round
  return {
    transactions: records.length,
    grossRevenue: Math.round(sum(records, r => r.grossValue) * 100) / 100,
    netRevenue: Math.round(sum(records, r => r.netValue) * 100) / 100,
    discountAmount: Math.round(sum(records, r => r.discountAmount) * 100) / 100,
    cashbackAmount: Math.round(sum(records, r => r.cashbackAmount) * 100) / 100,
    washServices: sum(serviceRecords, r => r.washCount),
    dryServices: sum(serviceRecords, r => r.dryCount),
    totalServices: sum(serviceRecords, r => r.totalServices),
    activeDays: activeDays
  };
}

/**
 * Calculate machine utilization - TIME-BASED FORMULA
 * ✅ Uses machine-minutes (accounts for different cycle times)
 * ✅ Same logic as operationsMetrics.js
 */
function calculateUtilization(records, window = null) {
  const sum = (arr, fn) => arr.reduce((s, x) => s + fn(x), 0);
  
  // Filter for operating hours and exclude Recarga
  const operatingRecords = records.filter(r =>
    r.hour >= BUSINESS_PARAMS.OPERATING_HOURS.start &&
    r.hour < BUSINESS_PARAMS.OPERATING_HOURS.end &&
    !r.isRecarga
  );

  const operatingWashCount = sum(operatingRecords, r => r.washCount);
  const operatingDryCount = sum(operatingRecords, r => r.dryCount);
  
  // Calculate active days
  let activeDays;
  if (window && window.start && window.end) {
    const msPerDay = 1000 * 60 * 60 * 24;
    const diffMs = window.end.getTime() - window.start.getTime();
    activeDays = Math.round(diffMs / msPerDay);
    
    if (activeDays < 7 && window.end.getDate() - window.start.getDate() === 6) {
      activeDays = 7;
    }
  } else {
    activeDays = new Set(records.map(r => r.dateStr)).size;
  }

  // TIME-BASED UTILIZATION: Calculate machine-minutes used
  const washMinutesUsed = operatingWashCount * BUSINESS_PARAMS.WASHER_CYCLE_MINUTES;
  const dryMinutesUsed = operatingDryCount * BUSINESS_PARAMS.DRYER_CYCLE_MINUTES;
  const totalMinutesUsed = washMinutesUsed + dryMinutesUsed;
  
  // Total available machine-minutes per period
  const washMinutesAvailable = BUSINESS_PARAMS.TOTAL_WASHERS * OPERATING_HOURS_PER_DAY * activeDays * 60;
  const dryMinutesAvailable = BUSINESS_PARAMS.TOTAL_DRYERS * OPERATING_HOURS_PER_DAY * activeDays * 60;
  const totalMinutesAvailable = washMinutesAvailable + dryMinutesAvailable;
  
  // Calculate utilization percentages
  const washUtilization = washMinutesAvailable > 0 
    ? (washMinutesUsed / washMinutesAvailable) * 100 
    : 0;
  const dryUtilization = dryMinutesAvailable > 0 
    ? (dryMinutesUsed / dryMinutesAvailable) * 100 
    : 0;
  const totalUtilization = totalMinutesAvailable > 0 
    ? (totalMinutesUsed / totalMinutesAvailable) * 100 
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
    washServices: percentChange(currentTotals.washServices, prevTotals.washServices),
    dryServices: percentChange(currentTotals.dryServices, prevTotals.dryServices),
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
 */
export function calculateBusinessMetrics(salesData) {
  console.log('=== BUSINESS METRICS v2.5 (FIXED) ===');
  console.log('Input sales rows:', salesData.length);
  
  const records = parseSalesRecords(salesData);
  console.log('Parsed records:', records.length);
  
  // Count transaction types
  const type1 = records.filter(r => r.type === 'TYPE_1').length;
  const type2 = records.filter(r => r.type === 'TYPE_2').length;
  const type3 = records.filter(r => r.type === 'TYPE_3').length;
  console.log('Transaction types:', { TYPE_1: type1, TYPE_2: type2, TYPE_3: type3 });
  
  const windows = getDateWindows();
  console.log('Date windows:', {
    weekly: `${windows.weekly.startDate} - ${windows.weekly.endDate}`,
    previousWeekly: `${windows.previousWeekly.startDate} - ${windows.previousWeekly.endDate}`
  });

  // Filter records for each time window
  const weekRecords = filterByWindow(records, windows.weekly);
  const prevWeekRecords = filterByWindow(records, windows.previousWeekly);
  const twoWeeksAgoRecords = filterByWindow(records, windows.twoWeeksAgo);
  const fourWeekRecords = filterByWindow(records, windows.fourWeek);
  
  console.log('Filtered records:', {
    currentWeek: weekRecords.length,
    previousWeek: prevWeekRecords.length,
    fourWeek: fourWeekRecords.length
  });

  // Calculate totals for each period
  const weeklyTotals = calculateTotals(weekRecords, windows.weekly);
  const prevWeeklyTotals = calculateTotals(prevWeekRecords, windows.previousWeekly);
  const twoWeeksAgoTotals = calculateTotals(twoWeeksAgoRecords, windows.twoWeeksAgo);
  const fourWeekTotals = calculateTotals(fourWeekRecords, windows.fourWeek);

  // Calculate utilization for each period (TIME-BASED)
  const weeklyUtil = calculateUtilization(weekRecords, windows.weekly);
  const prevWeeklyUtil = calculateUtilization(prevWeekRecords, windows.previousWeekly);
  const twoWeeksAgoUtil = calculateUtilization(twoWeeksAgoRecords, windows.twoWeeksAgo);
  const fourWeekUtil = calculateUtilization(fourWeekRecords, windows.fourWeek);

  console.log('✅ Utilization (TIME-BASED):', {
    weekly: `${weeklyUtil.totalUtilization}%`,
    wash: `${weeklyUtil.washUtilization}%`,
    dry: `${weeklyUtil.dryUtilization}%`
  });

  // Calculate week-over-week changes
  const weekOverWeek = calculateWeekOverWeek(
    weeklyTotals, prevWeeklyTotals, weeklyUtil, prevWeeklyUtil
  );
  
  const previousWeekOverWeek = calculateWeekOverWeek(
    prevWeeklyTotals, twoWeeksAgoTotals, prevWeeklyUtil, twoWeeksAgoUtil
  );

  return {
    weekly: {
      ...weeklyTotals,
      ...weeklyUtil,
      servicesPerTransaction: weeklyTotals.transactions > 0
        ? weeklyTotals.totalServices / weeklyTotals.transactions : 0
    },
    previousWeekly: {
      ...prevWeeklyTotals,
      ...prevWeeklyUtil,
      servicesPerTransaction: prevWeeklyTotals.transactions > 0
        ? prevWeeklyTotals.totalServices / prevWeeklyTotals.transactions : 0
    },
    fourWeek: {
      ...fourWeekTotals,
      ...fourWeekUtil,
      servicesPerTransaction: fourWeekTotals.transactions > 0
        ? fourWeekTotals.totalServices / fourWeekTotals.transactions : 0
    },
    weekOverWeek,
    previousWeekOverWeek,
    windows: {
      weekly: {
        startDate: windows.weekly.startDate,
        endDate: windows.weekly.endDate
      },
      previousWeekly: {
        startDate: windows.previousWeekly.startDate,
        endDate: windows.previousWeekly.endDate
      }
    }
  };
}

/**
 * Get daily revenue for charts
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
