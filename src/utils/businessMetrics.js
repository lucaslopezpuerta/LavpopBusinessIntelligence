// Business Metrics Calculator v2.7 - HYBRID VIEW WITH CURRENT WEEK
// ✅ NEW: Current partial week calculations (Sunday → Today)
// ✅ NEW: Weekly projection based on current pace
// ✅ FIXED: Windows include Date objects (start/end) for KPICards
// ✅ Uses shared transactionParser for consistent cashback handling
// ✅ TIME-BASED utilization formula (machine-minutes, not service-weighted)
// ✅ Excludes Recarga from service counts
// ✅ Includes Recarga in revenue totals
//
// CHANGELOG:
// v2.7 (2025-11-19): HYBRID VIEW - Current week + projection
//   - Added getCurrentPartialWeek() for real-time tracking
//   - Added projection calculations for the current week
//   - Returns both complete and current week metrics
//   - Smart projection logic (early week warning)
// v2.6 (2025-11-19): CRITICAL FIX - Added start/end Date objects to windows return
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
 * BUSINESS WEEK: Sunday 00:00 → Saturday 23:59
 */
function getDateWindows() {
  const currentDate = new Date();
  
  // LAST COMPLETE WEEK: Most recent Sunday → Most recent Saturday
  let lastSaturday = new Date(currentDate);
  const daysFromSaturday = (currentDate.getDay() + 1) % 7;
  lastSaturday.setDate(lastSaturday.getDate() - daysFromSaturday);
  lastSaturday.setHours(23, 59, 59, 999);
  
  let startSunday = new Date(lastSaturday);
  startSunday.setDate(startSunday.getDate() - 6);
  startSunday.setHours(0, 0, 0, 0);
  
  // PREVIOUS COMPLETE WEEK
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
 * Get current partial week window (Sunday → Today)
 * ✅ NEW in v2.7
 */
function getCurrentPartialWeek() {
  const now = new Date();
  
  // Find the start of current week (last or this Sunday)
  let currentWeekStart = new Date(now);
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  if (dayOfWeek === 0) {
    // Today is Sunday - start today
    currentWeekStart.setHours(0, 0, 0, 0);
  } else {
    // Go back to last Sunday
    currentWeekStart.setDate(now.getDate() - dayOfWeek);
    currentWeekStart.setHours(0, 0, 0, 0);
  }
  
  // End is now (today at current time)
  const currentWeekEnd = new Date(now);
  currentWeekEnd.setHours(23, 59, 59, 999);
  
  // Calculate days elapsed (including today as partial day)
  const daysElapsed = Math.floor((currentWeekEnd - currentWeekStart) / (1000 * 60 * 60 * 24)) + 1;
  
  const formatDate = (d) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };
  
  return {
    start: currentWeekStart,
    end: currentWeekEnd,
    startDate: formatDate(currentWeekStart),
    endDate: formatDate(currentWeekEnd),
    daysElapsed,
    isPartial: daysElapsed < 7,
    dayOfWeek: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dayOfWeek]
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
  const washServices = sum(serviceRecords, r => r.washCount);
  const dryServices = sum(serviceRecords, r => r.dryCount);
  
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
 * Calculate machine utilization using a time-based formula
 * ✅ Based on machine minutes, not service counts
 */
function calculateUtilization(records, window) {
  const serviceRecords = filterWithServices(records);
  
  const washers = serviceRecords.filter(r => r.washCount > 0);
  const dryers = serviceRecords.filter(r => r.dryCount > 0);
  
  // Calculate machine-minutes
  const washerMinutesUsed = washers.reduce((sum, r) => 
    sum + (r.washCount * BUSINESS_PARAMS.WASHER_CYCLE_MINUTES), 0
  );
  const dryerMinutesUsed = dryers.reduce((sum, r) => 
    sum + (r.dryCount * BUSINESS_PARAMS.DRYER_CYCLE_MINUTES), 0
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
 * Calculate projection for current partial week
 * ✅ NEW in v2.7
 */
function calculateProjection(currentWeekMetrics, currentWeekWindow, lastCompleteWeekMetrics) {
  const { daysElapsed } = currentWeekWindow;
  
  // Not enough data to project
  if (daysElapsed < 1) {
    return {
      canProject: false,
      confidence: 'none',
      message: 'Aguardando dados...'
    };
  }
  
  // Calculate daily average from current week
  const dailyRevenue = currentWeekMetrics.netRevenue / daysElapsed;
  const dailyServices = currentWeekMetrics.totalServices / daysElapsed;
  
  // Project to 7 days
  const projectedRevenue = Math.round(dailyRevenue * 7 * 100) / 100;
  const projectedServices = Math.round(dailyServices * 7);
  
  // Compare to last complete week
  const revenueVsLast = lastCompleteWeekMetrics.netRevenue > 0
    ? ((projectedRevenue - lastCompleteWeekMetrics.netRevenue) / lastCompleteWeekMetrics.netRevenue) * 100
    : 0;
  
  const servicesVsLast = lastCompleteWeekMetrics.totalServices > 0
    ? ((projectedServices - lastCompleteWeekMetrics.totalServices) / lastCompleteWeekMetrics.totalServices) * 100
    : 0;
  
  // Determine confidence level
  let confidence = 'low';
  let message = '';
  
  if (daysElapsed === 1) {
    confidence = 'very_low';
    message = 'Projeção baseada em apenas 1 dia (muito volátil)';
  } else if (daysElapsed <= 3) {
    confidence = 'low';
    message = 'Projeção preliminar (poucos dias)';
  } else if (daysElapsed <= 5) {
    confidence = 'medium';
    message = 'Projeção com confiança moderada';
  } else {
    confidence = 'high';
    message = 'Projeção confiável (semana quase completa)';
  }
  
  return {
    canProject: true,
    confidence,
    message,
    daysElapsed,
    dailyRevenue,
    dailyServices,
    projectedRevenue,
    projectedServices,
    revenueVsLast,
    servicesVsLast,
    trend: revenueVsLast > 5 ? 'up' : revenueVsLast < -5 ? 'down' : 'stable'
  };
}

/**
 * Main calculation function
 * ✅ Returns BOTH complete week and current week metrics
 * ✅ Includes projection for current week
 */
export function calculateBusinessMetrics(salesData) {
  if (!salesData || salesData.length === 0) {
    return null;
  }
  
  console.log('\n=== BUSINESS METRICS v2.7 - HYBRID VIEW ===');
  console.log('Total sales records:', salesData.length);
  
  const records = parseSalesRecords(salesData);
  console.log('Parsed records:', records.length);
  
  // Get windows
  const windows = getDateWindows();
  const currentPartialWeek = getCurrentPartialWeek();
  
  console.log('Date windows:', {
    lastCompleteWeek: `${windows.weekly.startDate} - ${windows.weekly.endDate}`,
    currentPartialWeek: `${currentPartialWeek.startDate} - ${currentPartialWeek.endDate} (${currentPartialWeek.daysElapsed} dias)`,
    today: currentPartialWeek.dayOfWeek
  });
  
  // Filter records for each window
  const weekRecords = filterByWindow(records, windows.weekly);
  const prevWeekRecords = filterByWindow(records, windows.previousWeekly);
  const twoWeeksAgoRecords = filterByWindow(records, windows.twoWeeksAgo);
  const fourWeekRecords = filterByWindow(records, windows.fourWeek);
  const currentWeekRecords = filterByWindow(records, currentPartialWeek);
  
  console.log('Records per window:', {
    lastCompleteWeek: weekRecords.length,
    previousWeek: prevWeekRecords.length,
    twoWeeksAgo: twoWeeksAgoRecords.length,
    fourWeeks: fourWeekRecords.length,
    currentPartialWeek: currentWeekRecords.length
  });
  
  // Calculate metrics for each window
  const weeklyTotals = calculateTotals(weekRecords, windows.weekly);
  const prevWeeklyTotals = calculateTotals(prevWeekRecords, windows.previousWeekly);
  const twoWeeksAgoTotals = calculateTotals(twoWeeksAgoRecords, windows.twoWeeksAgo);
  const fourWeekTotals = calculateTotals(fourWeekRecords, windows.fourWeek);
  const currentWeekTotals = calculateTotals(currentWeekRecords, currentPartialWeek);
  
  const weeklyUtil = calculateUtilization(weekRecords, windows.weekly);
  const prevWeeklyUtil = calculateUtilization(prevWeekRecords, windows.previousWeekly);
  const twoWeeksAgoUtil = calculateUtilization(twoWeeksAgoRecords, windows.twoWeeksAgo);
  const fourWeekUtil = calculateUtilization(fourWeekRecords, windows.fourWeek);
  const currentWeekUtil = calculateUtilization(currentWeekRecords, currentPartialWeek);
  
  const weekOverWeek = calculateWoW(
    { ...weeklyTotals, ...weeklyUtil },
    { ...prevWeeklyTotals, ...prevWeeklyUtil }
  );
  
  // ✅ NEW: Calculate projection for current week
  const projection = calculateProjection(
    { ...currentWeekTotals, ...currentWeekUtil },
    currentPartialWeek,
    { ...weeklyTotals, ...weeklyUtil }
  );
  
  console.log('Last Complete Week:', {
    revenue: `R$ ${weeklyTotals.netRevenue.toFixed(2)}`,
    services: weeklyTotals.totalServices,
    utilization: `${weeklyUtil.totalUtilization.toFixed(1)}%`
  });
  
  console.log('Current Partial Week:', {
    revenue: `R$ ${currentWeekTotals.netRevenue.toFixed(2)}`,
    services: currentWeekTotals.totalServices,
    utilization: `${currentWeekUtil.totalUtilization.toFixed(1)}%`,
    daysElapsed: currentPartialWeek.daysElapsed
  });
  
  if (projection.canProject) {
    console.log('Projection:', {
      projectedRevenue: `R$ ${projection.projectedRevenue.toFixed(2)}`,
      projectedServices: projection.projectedServices,
      vsLastWeek: `${projection.revenueVsLast > 0 ? '+' : ''}${projection.revenueVsLast.toFixed(1)}%`,
      confidence: projection.confidence,
      trend: projection.trend
    });
  }
  
  console.log('=== END BUSINESS METRICS ===\n');
  
  return {
    // Last complete week (for stable comparisons)
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
    
    // ✅ NEW: Current partial week (for real-time tracking)
    currentWeek: {
      ...currentWeekTotals,
      ...currentWeekUtil,
      window: currentPartialWeek,
      projection
    },
    
    weekOverWeek,
    
    // Windows with both Date objects and formatted strings
    windows: {
      weekly: {
        start: windows.weekly.start,
        end: windows.weekly.end,
        startDate: windows.weekly.startDate,
        endDate: windows.weekly.endDate
      },
      previousWeekly: {
        start: windows.previousWeekly.start,
        end: windows.previousWeekly.end,
        startDate: windows.previousWeekly.startDate,
        endDate: windows.previousWeekly.endDate
      },
      currentWeek: {
        start: currentPartialWeek.start,
        end: currentPartialWeek.end,
        startDate: currentPartialWeek.startDate,
        endDate: currentPartialWeek.endDate,
        daysElapsed: currentPartialWeek.daysElapsed,
        dayOfWeek: currentPartialWeek.dayOfWeek
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
