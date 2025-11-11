// Business Metrics Calculator - Ported from Calculate_Metrics.js
// Revenue, utilization, services - NO customer calculations

import { parseBrDate } from './dateUtils';

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
  OPERATING_HOURS: { start: 8, end: 22 }, // 8 AM to 10 PM
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
 * Parse sales data into records
 */
function parseSalesRecords(salesData) {
  const records = [];
  
  salesData.forEach(row => {
    const date = parseBrDate(row.Data || row.Data_Hora || row.date || '');
    if (!date) return;

    const grossValue = parseFloat(row.Valor_Venda || row.gross_value || 0) || 0;
    const netValue = parseFloat(row.Valor_Pago || row.net_value || 0) || 0;
    const discountAmount = grossValue - netValue;
    
    const machineInfo = countMachines(row.Maquinas || row.machine || '');
    
    records.push({
      date,
      dateStr: date.toISOString().split('T')[0],
      hour: date.getHours(),
      grossValue,
      netValue,
      discountAmount,
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
 */
function calculateTotals(records) {
  const sum = (arr, fn) => arr.reduce((s, x) => s + fn(x), 0);
  
  return {
    transactions: records.length,
    grossRevenue: Math.round(sum(records, r => r.grossValue) * 100) / 100,
    netRevenue: Math.round(sum(records, r => r.netValue) * 100) / 100,
    discountAmount: Math.round(sum(records, r => r.discountAmount) * 100) / 100,
    washServices: sum(records, r => r.washCount),
    dryServices: sum(records, r => r.dryCount),
    totalServices: sum(records, r => r.totalServices),
    activeDays: new Set(records.map(r => r.dateStr)).size
  };
}

/**
 * Calculate machine utilization
 */
function calculateUtilization(records) {
  const sum = (arr, fn) => arr.reduce((s, x) => s + fn(x), 0);
  
  const operatingRecords = records.filter(r =>
    r.hour >= BUSINESS_PARAMS.OPERATING_HOURS.start &&
    r.hour < BUSINESS_PARAMS.OPERATING_HOURS.end
  );

  const operatingWashCount = sum(operatingRecords, r => r.washCount);
  const operatingDryCount = sum(operatingRecords, r => r.dryCount);
  const activeDays = new Set(records.map(r => r.dateStr)).size;

  // Capacity = machines * hours/day * days * cycles/hour
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
 */
export function calculateBusinessMetrics(salesData) {
  console.log('=== BUSINESS METRICS DEBUG ===');
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

  const weeklyTotals = calculateTotals(weekRecords);
  console.log('Weekly totals:', weeklyTotals);
  const prevWeekTotals = calculateTotals(prevWeekRecords);
   console.log('Prev. Weekly totals:', prevWeekTotals);
  const fourWeekTotals = calculateTotals(fourWeekRecords);
   console.log('Four Weekly totals:', fourWeekTotals);

  const weeklyUtil = calculateUtilization(weekRecords);
  console.log('Weekly Util:', weeklyUtil);
  const prevWeekUtil = calculateUtilization(prevWeekRecords);
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
