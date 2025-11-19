// Business Metrics Calculator v2.6 - DASHBOARD VALIDATION FIX
// ✅ FIXED: Windows now include Date objects (start/end) for KPICards
// ✅ Uses shared transactionParser for consistent cashback handling
// ✅ TIME-BASED utilization formula (machine-minutes, not service-weighted)
// ✅ Excludes Recarga from service counts
// ✅ Includes Recarga in revenue totals
// ✅ Comprehensive console logging for validation
//
// CHANGELOG:
// v2.6 (2025-11-19): CRITICAL FIX - Added start/end Date objects to windows return
//   - Previous version only returned startDate/endDate strings
//   - This caused the New Customers KPI to always show zero
//   - Added detailed console logging for validation
//   - All KPIs now have proper date window access
// v2.5 (2025-11-16): Shared date windows, time-based utilization
// v2.4 (2025-11-15): Enhanced cashback handling

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
function calculateTotals(records, window) {
  const sum = (arr, fn) => arr.reduce((s, x) => s + fn(x), 0);
  
  // Filter to exclude Recarga for service counts
  const serviceRecords = filterWithServices(records);
  
  // Revenue calculations (include all records, including Recarga)
  const totalGrossRevenue = Math.round(sum(records, r => r.grossValue) * 100) / 100;
  const totalNetRevenue = Math.round(sum(records, r => r.netValue) * 100) / 100;
  const totalCashback = Math.round(sum(records, r => r.cashbackAmount) * 100) / 100;
  
  // Service counts (exclude Recarga - use serviceRecords)
  const totalServices = sum(serviceRecords, r => r.totalServices);
  const washServices = sum(serviceRecords, r => r.washServices);
  const dryServices = sum(serviceRecords, r => r.dryServices);
  
  // Calculate active days from window start/end (not from records)
  const activeDays = Math.ceil((window.end - window.start) / (1000 * 60 * 60 * 24)) + 1;
  
  return {
    netRevenue: totalNetRevenue,
    grossRevenue: totalGrossRevenue,
    cashback: totalCashback,
    totalServices,
    washServices,
    dryServices,
    activeDays,
    dailyAverage: totalNetRevenue / activeDays,
    recordCount: records.length,
    serviceRecordCount: serviceRecords.length
  };
}

/**
 * Calculate machine utilization using time-based formula
 * ✅ Based on machine-minutes, not service counts
 */
function calculateUtilization(records, window) {
  const serviceRecords = filterWithServices(records);
  
  const washers = serviceRecords.filter(r => r.washServices > 0);
  const dryers = serviceRecords.filter(r => r.dryServices > 0);
  
  // Calculate machine-minutes
  const washerMinutesUsed = washers.reduce((sum, r) => 
    sum + (r.washServices * BUSINESS_PARAMS.WASHER_CYCLE_MINUTES), 0
  );
  const dryerMinutesUsed = dryers.reduce((sum, r) => 
    sum + (r.dryServices * BUSINESS_PARAMS.DRYER_CYCLE_MINUTES), 0
  );
  
  // Calculate available machine-minutes
  const activeDays = Math.ceil((window.end - window.start) / (1000 * 60 * 60 * 24)) + 1;
  const minutesPerDay = OPERATING_HOURS_PER_DAY * 60;
  
  const washerMinutesAvailable = BUSINESS_PARAMS.TOTAL_WASHERS * minutesPerDay * activeDays;
  const dryerMinutesAvailable = BUSINESS_PARAMS.TOTAL_DRYERS * minutesPerDay * activeDays;
  
  // Calculate utilization percentages
  const washerUtilization = (washerMinutesUsed / washerMinutesAvailable) * 100;
  const dryerUtilization = (dryerMinutesUsed / dryerMinutesAvailable) * 100;
  
  // Total utilization (weighted by machine count)
  const totalMachines = BUSINESS_PARAMS.TOTAL_WASHERS + BUSINESS_PARAMS.TOTAL_DRYERS;
  const totalUtilization = (
    (washerUtilization * BUSINESS_PARAMS.TOTAL_WASHERS) +
    (dryerUtilization * BUSINESS_PARAMS.TOTAL_DRYERS)
  ) / totalMachines;
  
  return {
    totalUtilization,
    washerUtilization,
    dryerUtilization,
    washerMinutesUsed,
    dryerMinutesUsed,
    washerMinutesAvailable,
    dryerMinutesAvailable
  };
}

/**
 * Calculate week-over-week changes
 */
function calculateWoW(current, previous) {
  const calculateChange = (curr, prev) => {
    if (prev === 0 || prev === null || prev === undefined) {
      return curr > 0 ? 100 : 0;
    }
    return ((curr - prev) / prev) * 100;
  };
  
  return {
    netRevenue: calculateChange(current.netRevenue, previous.netRevenue),
    totalServices: calculateChange(current.totalServices, previous.totalServices),
    washServices: calculateChange(current.washServices, previous.washServices),
    dryServices: calculateChange(current.dryServices, previous.dryServices),
    utilization: calculateChange(current.totalUtilization, previous.totalUtilization)
  };
}

/**
 * Main calculation function
 * ✅ Returns windows with BOTH Date objects and formatted strings
 */
export function calculateBusinessMetrics(salesData) {
  if (!salesData || salesData.length === 0) {
    return null;
  }
  
  console.log('=== BUSINESS METRICS v2.6 - DASHBOARD VALIDATION ===');
  console.log('Total sales records:', salesData.length);
  
  const records = parseSalesRecords(salesData);
  console.log('Parsed records:', records.length);
  
  const windows = getDateWindows();
  console.log('Date windows:', {
    weekly: `${windows.weekly.startDate} - ${windows.weekly.endDate}`,
    previousWeekly: `${windows.previousWeekly.startDate} - ${windows.previousWeekly.endDate}`,
    weeklyDateObjects: {
      start: windows.weekly.start.toISOString(),
      end: windows.weekly.end.toISOString()
    }
  });
  
  const weekRecords = filterByWindow(records, windows.weekly);
  const prevWeekRecords = filterByWindow(records, windows.previousWeekly);
  const twoWeeksAgoRecords = filterByWindow(records, windows.twoWeeksAgo);
  const fourWeekRecords = filterByWindow(records, windows.fourWeek);
  
  console.log('Records per window:', {
    currentWeek: weekRecords.length,
    previousWeek: prevWeekRecords.length,
    twoWeeksAgo: twoWeeksAgoRecords.length,
    fourWeeks: fourWeekRecords.length
  });
  
  const weeklyTotals = calculateTotals(weekRecords, windows.weekly);
  const prevWeeklyTotals = calculateTotals(prevWeekRecords, windows.previousWeekly);
  const twoWeeksAgoTotals = calculateTotals(twoWeeksAgoRecords, windows.twoWeeksAgo);
  const fourWeekTotals = calculateTotals(fourWeekRecords, windows.fourWeek);
  
  const weeklyUtil = calculateUtilization(weekRecords, windows.weekly);
  const prevWeeklyUtil = calculateUtilization(prevWeekRecords, windows.previousWeekly);
  const twoWeeksAgoUtil = calculateUtilization(twoWeeksAgoRecords, windows.twoWeeksAgo);
  const fourWeekUtil = calculateUtilization(fourWeekRecords, windows.fourWeek);
  
  const weekOverWeek = calculateWoW(
    { ...weeklyTotals, ...weeklyUtil },
    { ...prevWeeklyTotals, ...prevWeeklyUtil }
  );
  
  console.log('Current Week Metrics:', {
    netRevenue: `R$ ${weeklyTotals.netRevenue.toFixed(2)}`,
    totalServices: weeklyTotals.totalServices,
    utilization: `${weeklyUtil.totalUtilization.toFixed(1)}%`,
    activeDays: weeklyTotals.activeDays,
    records: weeklyTotals.recordCount,
    serviceRecords: weeklyTotals.serviceRecordCount
  });
  
  console.log('Week-over-Week Changes:', {
    revenue: `${weekOverWeek.netRevenue > 0 ? '+' : ''}${weekOverWeek.netRevenue.toFixed(1)}%`,
    services: `${weekOverWeek.totalServices > 0 ? '+' : ''}${weekOverWeek.totalServices.toFixed(1)}%`,
    utilization: `${weekOverWeek.utilization > 0 ? '+' : ''}${weekOverWeek.utilization.toFixed(1)}%`
  });
  
  console.log('=== END BUSINESS METRICS ===\n');
  
  return {
    weekly: {
      ...weeklyTotals,
      ...weeklyUtil
    },
    previousWeekly: {
      ...prevWeeklyTotals,
      ...prevWeeklyUtil
    },
    twoWeeksAgo: {
      ...twoWeeksAgoTotals,
      ...twoWeeksAgoUtil
    },
    fourWeek: {
      ...fourWeekTotals,
      ...fourWeekUtil
    },
    weekOverWeek,
    
    // ✅ CRITICAL FIX: Include BOTH Date objects AND formatted strings
    windows: {
      weekly: {
        start: windows.weekly.start,      // ✅ Date object (NEW!)
        end: windows.weekly.end,          // ✅ Date object (NEW!)
        startDate: windows.weekly.startDate,  // String for display
        endDate: windows.weekly.endDate       // String for display
      },
      previousWeekly: {
        start: windows.previousWeekly.start,      // ✅ Date object (NEW!)
        end: windows.previousWeekly.end,          // ✅ Date object (NEW!)
        startDate: windows.previousWeekly.startDate,  // String for display
        endDate: windows.previousWeekly.endDate       // String for display
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

  records.forEach(record => {
    if (record.date >= startDate && record.date <= today) {
      const dateKey = record.date.toISOString().split('T')[0];
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = 0;
      }
      dailyMap[dateKey] += record.netValue;
    }
  });

  return Object.keys(dailyMap)
    .sort()
    .map(dateKey => ({
      date: dateKey,
      revenue: Math.round(dailyMap[dateKey] * 100) / 100
    }));
}
