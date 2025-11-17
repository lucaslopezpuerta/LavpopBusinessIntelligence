// Analytics Metrics Calculator v1.1 - FIXED
// ✅ Reuses proven calculation logic from businessMetrics.js
// ✅ Uses correct field names from transactionParser
// ✅ Same formulas for revenue, services, and utilization
//
// CHANGELOG:
// v1.1 (2025-11-16): Fixed to use proven calculation functions
// v1.0 (2025-11-16): Initial implementation (had wrong field names)

import { parseSalesRecords, filterWithServices } from './transactionParser';
import { getShortMonthName } from './analyticsDateUtils';

const BUSINESS_PARAMS = {
  TOTAL_WASHERS: 3,
  TOTAL_DRYERS: 5,
  OPERATING_HOURS: { start: 8, end: 23 },
  WASHER_CYCLE_MINUTES: 30,
  DRYER_CYCLE_MINUTES: 45
};

const OPERATING_HOURS_PER_DAY = BUSINESS_PARAMS.OPERATING_HOURS.end - BUSINESS_PARAMS.OPERATING_HOURS.start;

/**
 * Filter records by date range
 */
function filterByDateRange(records, startDate, endDate) {
  return records.filter(r => r.date >= startDate && r.date <= endDate);
}

/**
 * Group records by month
 * @returns Array of { month, year, label, records, startDate, endDate }
 */
function groupByMonth(records, startDate, endDate) {
  const groups = {};
  
  records.forEach(record => {
    const month = record.date.getMonth();
    const year = record.date.getFullYear();
    const key = `${year}-${month}`;
    
    if (!groups[key]) {
      groups[key] = {
        month,
        year,
        label: `${getShortMonthName(month)} ${year}`,
        records: [],
        startDate: new Date(year, month, 1),
        endDate: new Date(year, month + 1, 0, 23, 59, 59, 999)
      };
    }
    
    groups[key].records.push(record);
  });
  
  // Convert to sorted array
  return Object.values(groups).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
}

/**
 * Group records by week
 * @returns Array of { weekStart, weekEnd, label, records }
 */
function groupByWeek(records, startDate, endDate) {
  const groups = [];
  let currentWeekStart = new Date(startDate);
  currentWeekStart.setHours(0, 0, 0, 0);
  
  // Align to Sunday
  const dayOfWeek = currentWeekStart.getDay();
  if (dayOfWeek !== 0) {
    currentWeekStart.setDate(currentWeekStart.getDate() - dayOfWeek);
  }
  
  while (currentWeekStart <= endDate) {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    const weekRecords = records.filter(r => 
      r.date >= currentWeekStart && r.date <= weekEnd
    );
    
    if (weekRecords.length > 0 || (currentWeekStart >= startDate && weekEnd <= endDate)) {
      const day = String(currentWeekStart.getDate()).padStart(2, '0');
      const month = String(currentWeekStart.getMonth() + 1).padStart(2, '0');
      
      groups.push({
        weekStart: new Date(currentWeekStart),
        weekEnd: new Date(weekEnd),
        label: `${day}/${month}`,
        records: weekRecords
      });
    }
    
    // Move to next week
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }
  
  return groups;
}

/**
 * Group records by day
 * @returns Array of { date, label, records }
 */
function groupByDay(records, startDate, endDate) {
  const groups = [];
  let currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  
  while (currentDate <= endDate) {
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dayRecords = records.filter(r => 
      r.date >= currentDate && r.date <= dayEnd
    );
    
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    
    groups.push({
      date: new Date(currentDate),
      label: `${day}/${month}`,
      records: dayRecords
    });
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return groups;
}

/**
 * Calculate metrics for a group of records
 * ✅ REUSES PROVEN LOGIC from businessMetrics.js
 * ✅ Uses correct field names: netValue, washCount, dryCount
 */
function calculateGroupMetrics(records, activeDays) {
  const sum = (arr, fn) => arr.reduce((s, x) => s + fn(x), 0);
  
  // Filter out Recarga for service counts (use proven filterWithServices)
  const serviceRecords = filterWithServices(records);
  
  // Calculate revenue (includes Type 1 and Type 3)
  // ✅ CORRECT: Use netValue field (proven to work)
  const revenue = Math.round(sum(records, r => r.netValue) * 100) / 100;
  
  // Count services (excludes Type 3 - Recarga)
  // ✅ CORRECT: Use washCount, dryCount, totalServices fields
  const washServices = sum(serviceRecords, r => r.washCount);
  const dryServices = sum(serviceRecords, r => r.dryCount);
  const totalServices = sum(serviceRecords, r => r.totalServices);
  
  // Calculate utilization using TIME-BASED formula (proven)
  // Filter for operating hours
  const operatingRecords = records.filter(r =>
    r.hour >= BUSINESS_PARAMS.OPERATING_HOURS.start &&
    r.hour < BUSINESS_PARAMS.OPERATING_HOURS.end &&
    !r.isRecarga
  );
  
  const operatingWashCount = sum(operatingRecords, r => r.washCount);
  const operatingDryCount = sum(operatingRecords, r => r.dryCount);
  
  // TIME-BASED UTILIZATION: Calculate machine-minutes used
  const washMinutesUsed = operatingWashCount * BUSINESS_PARAMS.WASHER_CYCLE_MINUTES;
  const dryMinutesUsed = operatingDryCount * BUSINESS_PARAMS.DRYER_CYCLE_MINUTES;
  const totalMinutesUsed = washMinutesUsed + dryMinutesUsed;
  
  // Total available machine-minutes per period
  const washMinutesAvailable = BUSINESS_PARAMS.TOTAL_WASHERS * OPERATING_HOURS_PER_DAY * activeDays * 60;
  const dryMinutesAvailable = BUSINESS_PARAMS.TOTAL_DRYERS * OPERATING_HOURS_PER_DAY * activeDays * 60;
  const totalMinutesAvailable = washMinutesAvailable + dryMinutesAvailable;
  
  const utilization = totalMinutesAvailable > 0 
    ? (totalMinutesUsed / totalMinutesAvailable) * 100 
    : 0;
  
  return {
    revenue,
    totalServices,
    washServices,
    dryServices,
    utilization: Math.round(utilization * 10) / 10
  };
}

/**
 * Calculate revenue trend with appropriate granularity
 * - Days: for periods < 14 days
 * - Weeks: for periods 14-90 days
 * - Months: for periods > 90 days
 */
export function calculateRevenueTrend(salesData, startDate, endDate) {
  const records = parseSalesRecords(salesData);
  const filteredRecords = filterByDateRange(records, startDate, endDate);
  
  const daysInRange = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  
  let groups;
  let granularity;
  
  if (daysInRange <= 14) {
    // Daily granularity
    groups = groupByDay(filteredRecords, startDate, endDate);
    granularity = 'day';
  } else if (daysInRange <= 90) {
    // Weekly granularity
    groups = groupByWeek(filteredRecords, startDate, endDate);
    granularity = 'week';
  } else {
    // Monthly granularity
    groups = groupByMonth(filteredRecords, startDate, endDate);
    granularity = 'month';
  }
  
  // Calculate metrics for each group
  const trendData = groups.map(group => {
    const activeDays = granularity === 'day' ? 1 :
                       granularity === 'week' ? 7 :
                       Math.ceil((group.endDate - group.startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    const metrics = calculateGroupMetrics(group.records, activeDays);
    
    return {
      label: group.label,
      date: group.date || group.weekStart || group.startDate,
      ...metrics
    };
  });
  
  return {
    data: trendData,
    granularity,
    totalRevenue: trendData.reduce((sum, d) => sum + d.revenue, 0),
    totalServices: trendData.reduce((sum, d) => sum + d.totalServices, 0),
    avgUtilization: trendData.length > 0 
      ? Math.round((trendData.reduce((sum, d) => sum + d.utilization, 0) / trendData.length) * 10) / 10 
      : 0
  };
}

/**
 * Calculate growth rate between two periods
 */
export function calculateGrowthRate(currentValue, previousValue) {
  if (previousValue === 0) return currentValue > 0 ? 100 : 0;
  return Math.round(((currentValue - previousValue) / previousValue) * 1000) / 10;
}

/**
 * Calculate summary statistics for the period
 */
export function calculatePeriodSummary(salesData, startDate, endDate) {
  const records = parseSalesRecords(salesData);
  const filteredRecords = filterByDateRange(records, startDate, endDate);
  
  const daysInRange = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  const metrics = calculateGroupMetrics(filteredRecords, daysInRange);
  
  // Calculate daily averages
  const avgDailyRevenue = daysInRange > 0 ? metrics.revenue / daysInRange : 0;
  const avgDailyServices = daysInRange > 0 ? metrics.totalServices / daysInRange : 0;
  
  return {
    ...metrics,
    daysInRange,
    avgDailyRevenue: Math.round(avgDailyRevenue * 100) / 100,
    avgDailyServices: Math.round(avgDailyServices * 10) / 10
  };
}

/**
 * Compare current period vs previous period (same duration)
 */
export function calculatePeriodComparison(salesData, startDate, endDate) {
  const currentPeriod = calculatePeriodSummary(salesData, startDate, endDate);
  
  // Calculate previous period (same duration)
  const periodDuration = endDate - startDate;
  const previousEnd = new Date(startDate);
  previousEnd.setMilliseconds(-1); // End of previous period
  const previousStart = new Date(previousEnd - periodDuration);
  
  const previousPeriod = calculatePeriodSummary(salesData, previousStart, previousEnd);
  
  return {
    current: currentPeriod,
    previous: previousPeriod,
    growth: {
      revenue: calculateGrowthRate(currentPeriod.revenue, previousPeriod.revenue),
      services: calculateGrowthRate(currentPeriod.totalServices, previousPeriod.totalServices),
      utilization: calculateGrowthRate(currentPeriod.utilization, previousPeriod.utilization)
    }
  };
}

/**
 * Identify peak and low periods
 */
export function identifyPeakPeriods(trendData) {
  if (trendData.length === 0) return { peak: null, low: null };
  
  const sortedByRevenue = [...trendData].sort((a, b) => b.revenue - a.revenue);
  
  return {
    peak: sortedByRevenue[0],
    low: sortedByRevenue[sortedByRevenue.length - 1]
  };
}

/**
 * Calculate trend direction (increasing, decreasing, stable)
 */
export function calculateTrendDirection(trendData) {
  if (trendData.length < 3) return 'insufficient_data';
  
  const recentData = trendData.slice(-5); // Last 5 periods
  const olderData = trendData.slice(0, 5); // First 5 periods
  
  const recentAvg = recentData.reduce((sum, d) => sum + d.revenue, 0) / recentData.length;
  const olderAvg = olderData.reduce((sum, d) => sum + d.revenue, 0) / olderData.length;
  
  const growth = calculateGrowthRate(recentAvg, olderAvg);
  
  if (growth > 10) return 'increasing';
  if (growth < -10) return 'decreasing';
  return 'stable';
}
