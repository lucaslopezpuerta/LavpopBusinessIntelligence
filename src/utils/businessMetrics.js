// Business Metrics Calculator v2.4 - WITH PREVIOUS WEEK DISPLAY
// ✅ No per-transaction rounding (matches Make.com exactly)
// ✅ Proper active days calculation from window boundaries
// ✅ Brazilian number parsing
// ✅ Local timezone dateStr for debugging
// ✅ NEW: Previous week metrics for WeeklyPerformanceSummary component

import { parseBrDate } from './dateUtils';

// CASHBACK CONFIGURATION
const CASHBACK_RATE = 0.075; // 7.5%
const CASHBACK_START_DATE = new Date(2024, 5, 1); // June 1, 2024

/**
 * Parse Brazilian number format (handles comma as decimal separator)
 */
function parseBrNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  
  const str = String(value).trim();
  
  // Format: 1.234,56 → 1234.56
  if (str.includes('.') && str.includes(',')) {
    return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
  }
  
  // Format: 17,90 → 17.90
  if (str.includes(',')) {
    return parseFloat(str.replace(',', '.')) || 0;
  }
  
  // Format: 17.90 or 17 or 0
  return parseFloat(str) || 0;
}

/**
 * Get date windows for calculations
 * 
 * WINDOW DEFINITIONS:
 * 
 * 1. CURRENT WEEK (weekly)
 *    Purpose: Show this week's performance in KPI cards
 *    Range: Most recent Sunday 00:00:00 → Most recent Saturday 23:59:59
 *    Example: If today is Wed Nov 13, then Sun Nov 10 → Sat Nov 16
 * 
 * 2. PREVIOUS WEEK (previousWeekly)
 *    Purpose: Show last week's completed performance in WeeklyPerformanceSummary
 *    Range: 7-13 days ago (previous Sunday → previous Saturday)
 *    Example: If current week is Nov 10-16, then Sun Nov 3 → Sat Nov 9
 * 
 * 3. TWO WEEKS AGO (twoWeeksAgo)
 *    Purpose: Calculate week-over-week change for previous week
 *    Range: 14-20 days ago (Sunday → Saturday, 2 weeks before current)
 *    Example: If current week is Nov 10-16, then Sun Oct 27 → Sat Nov 2
 * 
 * 4. FOUR WEEK WINDOW (fourWeek)
 *    Purpose: Monthly/rolling 4-week metrics
 *    Range: 21 days before current week start → current Saturday
 * 
 * WHY THESE WINDOWS?
 * - Current Week: Live, up-to-date metrics for decision making
 * - Previous Week: Completed week review (no partial data)
 * - Two Weeks Ago: Baseline for measuring previous week improvement
 * - Week-over-Week Comparisons: Shows momentum and trends
 * 
 * Sunday-Saturday business weeks align with Brazilian weekend patterns
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
  
  // PREVIOUS WEEK: Previous Sunday → Previous Saturday (7-13 days ago)
  let prevWeekEnd = new Date(startSunday);
  prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
  prevWeekEnd.setHours(23, 59, 59, 999);
  
  let prevWeekStart = new Date(prevWeekEnd);
  prevWeekStart.setDate(prevWeekStart.getDate() - 6);
  prevWeekStart.setHours(0, 0, 0, 0);
  
  // TWO WEEKS AGO: 2 weeks before current week (14-20 days ago)
  let twoWeeksAgoEnd = new Date(prevWeekStart);
  twoWeeksAgoEnd.setDate(twoWeeksAgoEnd.getDate() - 1);
  twoWeeksAgoEnd.setHours(23, 59, 59, 999);
  
  let twoWeeksAgoStart = new Date(twoWeeksAgoEnd);
  twoWeeksAgoStart.setDate(twoWeeksAgoStart.getDate() - 6);
  twoWeeksAgoStart.setHours(0, 0, 0, 0);
  
  // FOUR WEEK WINDOW: 4 weeks before current week start → current Saturday
  let fourWeekStart = new Date(startSunday);
  fourWeekStart.setDate(fourWeekStart.getDate() - 21);
  
  const formatDate = (d) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };
  
  return {
    // Current week (for KPI cards)
    weekly: { 
      start: startSunday, 
      end: lastSaturday,
      startDate: formatDate(startSunday),
      endDate: formatDate(lastSaturday)
    },
    // Previous week (for WeeklyPerformanceSummary component)
    previousWeekly: { 
      start: prevWeekStart, 
      end: prevWeekEnd,
      startDate: formatDate(prevWeekStart),
      endDate: formatDate(prevWeekEnd)
    },
    // Two weeks ago (for comparison baseline)
    twoWeeksAgo: { 
      start: twoWeeksAgoStart, 
      end: twoWeeksAgoEnd 
    },
    // Four week rolling window
    fourWeek: { 
      start: fourWeekStart, 
      end: lastSaturday 
    }
  };
};

const BUSINESS_PARAMS = {
  TOTAL_WASHERS: 3,
  TOTAL_DRYERS: 5,
  OPERATING_HOURS: { start: 8, end: 23 }, // 8 AM to 11 PM
  WASHER_CYCLE_MINUTES: 30,
  DRYER_CYCLE_MINUTES: 45
};

const OPERATING_HOURS_PER_DAY = BUSINESS_PARAMS.OPERATING_HOURS.end - BUSINESS_PARAMS.OPERATING_HOURS.start;

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
 * ✅ NO per-transaction rounding - keeps full precision like Make.com
 */
function parseSalesRecords(salesData) {
  const records = [];
  
  salesData.forEach(row => {
    const date = parseBrDate(row.Data || row.Data_Hora || row.date || '');
    if (!date) return;

    // Parse values with full precision
    let grossValue = parseBrNumber(row.Valor_Venda || row.gross_value || 0);
    let netValue = parseBrNumber(row.Valor_Pago || row.net_value || 0);
    let discountAmount = grossValue - netValue; // Coupon discount only (at first)
    let cashbackAmount = 0;
    
    // ✅ CRITICAL FIX: NO rounding per transaction!
    // Calculate cashback with full precision, just like Make.com
    if (date >= CASHBACK_START_DATE) {
      cashbackAmount = grossValue * CASHBACK_RATE; // Keep full precision!
      netValue = netValue - cashbackAmount; // No rounding
      discountAmount = discountAmount + cashbackAmount; // No rounding
    }
    
    const machineInfo = countMachines(row.Maquinas || row.machine || '');
    
    // Create dateStr in LOCAL timezone (for debugging/grouping)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    records.push({
      date,
      dateStr,
      hour: date.getHours(),
      grossValue,
      netValue, // Includes coupon discount AND cashback deduction
      discountAmount, // Includes coupon discount AND cashback
      cashbackAmount, // For debugging
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
 * ✅ Rounds only AFTER summing (not per-transaction)
 * ✅ Active days calculated from window boundaries
 */
function calculateTotals(records, window = null) {
  const sum = (arr, fn) => arr.reduce((s, x) => s + fn(x), 0);
  
  // ✅ PROPER FIX: Calculate days from window boundaries
  // This works for weekly, previous week, and four week windows
  let activeDays;
  if (window && window.start && window.end) {
    // Calculate milliseconds between start and end
    const msPerDay = 1000 * 60 * 60 * 24;
    const diffMs = window.end.getTime() - window.start.getTime();
    
    // Example: Nov 2 00:00:00 to Nov 8 23:59:59.999
    // diffMs = 6 days + 23:59:59.999 = ~7 days worth of milliseconds
    // Math.round(diffMs / msPerDay) = 7
    activeDays = Math.round(diffMs / msPerDay);
    
    // If we get 6 somehow (shouldn't happen), add 1 for inclusive end
    if (activeDays < 7 && window.end.getDate() - window.start.getDate() === 6) {
      activeDays = 7;
    }
  } else {
    // Fallback: count unique dates (shouldn't be needed if window is passed)
    activeDays = new Set(records.map(r => r.dateStr)).size;
  }
  
  // ✅ Sum first, THEN round - matches Make.com exactly
  return {
    transactions: records.length,
    grossRevenue: Math.round(sum(records, r => r.grossValue) * 100) / 100,
    netRevenue: Math.round(sum(records, r => r.netValue) * 100) / 100,
    discountAmount: Math.round(sum(records, r => r.discountAmount) * 100) / 100,
    cashbackAmount: Math.round(sum(records, r => r.cashbackAmount) * 100) / 100,
    washServices: sum(records, r => r.washCount),
    dryServices: sum(records, r => r.dryCount),
    totalServices: sum(records, r => r.totalServices),
    activeDays: activeDays
  };
}

/**
 * Calculate machine utilization
 * ✅ Uses same active days logic as calculateTotals
 */
function calculateUtilization(records, window = null) {
  const sum = (arr, fn) => arr.reduce((s, x) => s + fn(x), 0);
  
  const operatingRecords = records.filter(r =>
    r.hour >= BUSINESS_PARAMS.OPERATING_HOURS.start &&
    r.hour < BUSINESS_PARAMS.OPERATING_HOURS.end
  );

  const operatingWashCount = sum(operatingRecords, r => r.washCount);
  const operatingDryCount = sum(operatingRecords, r => r.dryCount);
  
  // ✅ Same logic as calculateTotals
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

  // Capacity = machines × hours/day × days × cycles/hour
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
 * 
 * WHAT IT CALCULATES:
 * Percent change from one time period to another
 * Formula: ((current / previous) - 1) * 100
 * 
 * EXAMPLES:
 * - Current: R$ 1,000, Previous: R$ 800 → +25% (grew by 25%)
 * - Current: 50 txns, Previous: 60 txns → -16.7% (dropped by 16.7%)
 * - Current: 0, Previous: 100 → null (can't calculate from zero)
 * 
 * FOR UTILIZATION:
 * We show absolute difference, not percentage
 * Example: Current: 15%, Previous: 12% → +3.0 percentage points
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
 * 
 * RETURNS STRUCTURE:
 * {
 *   weekly: { metrics for current week - used by KPI cards },
 *   previousWeekly: { metrics for last completed week - used by WeeklyPerformanceSummary },
 *   fourWeek: { metrics for rolling 4-week period },
 *   weekOverWeek: { % changes: current week vs previous week - used by KPI cards },
 *   previousWeekOverWeek: { % changes: previous week vs 2 weeks ago - used by WeeklyPerformanceSummary },
 *   windows: { date ranges for all periods }
 * }
 * 
 * METRIC DEFINITIONS:
 * - transactions: Total number of sales/visits
 * - grossRevenue: Total before discounts (Valor_Venda)
 * - netRevenue: After coupons AND cashback (what you actually keep)
 * - discountAmount: Sum of coupon discounts + cashback given
 * - washServices: Total wash machine uses
 * - dryServices: Total dry machine uses
 * - totalServices: Total machine uses (wash + dry)
 * - activeDays: Number of days in the period (always 7 for weeks)
 * - servicesPerTransaction: Avg machines used per customer visit
 * - washUtilization: % of wash capacity used during operating hours
 * - dryUtilization: % of dry capacity used during operating hours
 * - totalUtilization: Weighted average utilization
 */
export function calculateBusinessMetrics(salesData) {
  console.log('=== BUSINESS METRICS v2.4 DEBUG ===');
  console.log('Input sales rows:', salesData.length);
  
  const records = parseSalesRecords(salesData);
  console.log('Parsed records:', records.length);
  
  const windows = getDateWindows();
  console.log('Date windows:', {
    weekly: `${windows.weekly.startDate} - ${windows.weekly.endDate}`,
    previousWeekly: `${windows.previousWeekly.startDate} - ${windows.previousWeekly.endDate}`,
    twoWeeksAgo: `${windows.twoWeeksAgo.start.toLocaleDateString('pt-BR')} - ${windows.twoWeeksAgo.end.toLocaleDateString('pt-BR')}`,
    fourWeek: `${windows.fourWeek.start.toLocaleDateString('pt-BR')} - ${windows.fourWeek.end.toLocaleDateString('pt-BR')}`
  });

  // Filter records for each time window
  const weekRecords = filterByWindow(records, windows.weekly);
  const prevWeekRecords = filterByWindow(records, windows.previousWeekly);
  const twoWeeksAgoRecords = filterByWindow(records, windows.twoWeeksAgo);
  const fourWeekRecords = filterByWindow(records, windows.fourWeek);
  
  console.log('Filtered records:', {
    currentWeek: weekRecords.length,
    previousWeek: prevWeekRecords.length,
    twoWeeksAgo: twoWeeksAgoRecords.length,
    fourWeek: fourWeekRecords.length
  });

  // Calculate totals for each period
  const weeklyTotals = calculateTotals(weekRecords, windows.weekly);
  const prevWeeklyTotals = calculateTotals(prevWeekRecords, windows.previousWeekly);
  const twoWeeksAgoTotals = calculateTotals(twoWeeksAgoRecords, windows.twoWeeksAgo);
  const fourWeekTotals = calculateTotals(fourWeekRecords, windows.fourWeek);

  // Calculate utilization for each period
  const weeklyUtil = calculateUtilization(weekRecords, windows.weekly);
  const prevWeeklyUtil = calculateUtilization(prevWeekRecords, windows.previousWeekly);
  const twoWeeksAgoUtil = calculateUtilization(twoWeeksAgoRecords, windows.twoWeeksAgo);
  const fourWeekUtil = calculateUtilization(fourWeekRecords, windows.fourWeek);

  // Calculate week-over-week changes
  // 1. Current week vs Previous week (for KPI cards)
  const weekOverWeek = calculateWeekOverWeek(
    weeklyTotals, prevWeeklyTotals, weeklyUtil, prevWeeklyUtil
  );
  
  // 2. Previous week vs Two weeks ago (for WeeklyPerformanceSummary)
  const previousWeekOverWeek = calculateWeekOverWeek(
    prevWeeklyTotals, twoWeeksAgoTotals, prevWeeklyUtil, twoWeeksAgoUtil
  );

  console.log('Week-over-week changes:', weekOverWeek);
  console.log('Previous week changes:', previousWeekOverWeek);

  return {
    // CURRENT WEEK METRICS (used by KPI cards)
    weekly: {
      ...weeklyTotals,
      ...weeklyUtil,
      servicesPerTransaction: weeklyTotals.transactions > 0
        ? weeklyTotals.totalServices / weeklyTotals.transactions : 0
    },
    
    // PREVIOUS WEEK METRICS (used by WeeklyPerformanceSummary)
    previousWeekly: {
      ...prevWeeklyTotals,
      ...prevWeeklyUtil,
      servicesPerTransaction: prevWeeklyTotals.transactions > 0
        ? prevWeeklyTotals.totalServices / prevWeeklyTotals.transactions : 0
    },
    
    // FOUR WEEK ROLLING METRICS
    fourWeek: {
      ...fourWeekTotals,
      ...fourWeekUtil,
      servicesPerTransaction: fourWeekTotals.transactions > 0
        ? fourWeekTotals.totalServices / fourWeekTotals.transactions : 0
    },
    
    // CHANGES: Current week vs Previous week (for KPI cards)
    weekOverWeek,
    
    // CHANGES: Previous week vs Two weeks ago (for WeeklyPerformanceSummary)
    previousWeekOverWeek,
    
    // DATE RANGES (for display in UI)
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
