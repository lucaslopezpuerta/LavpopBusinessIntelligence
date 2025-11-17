// Analytics Metrics Calculator v1.0
// Calculate trends, growth rates, and historical performance
//
// CHANGELOG:
// v1.0 (2025-11-16): Initial implementation
//   - Revenue trends with monthly/weekly aggregation
//   - Service volume trends
//   - Utilization trends
//   - Growth rate calculations
//   - Period-over-period comparisons

import { parseSalesRecords } from './transactionParser';
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
 */
function calculateGroupMetrics(records, activeDays) {
  // Filter out Recarga for service counts but include in revenue
  const serviceRecords = records.filter(r => r.tipo !== 3);
  
  // Calculate revenue (includes Type 1 and Type 3)
  const revenue = records.reduce((sum, r) => sum + r.netRevenue, 0);
  
  // Count services (excludes Type 3 - Recarga)
  const totalServices = serviceRecords.length;
  const washServices = serviceRecords.filter(r => 
    r.washerServices > 0 || r.tipo === 1
  ).length;
  const dryServices = serviceRecords.filter(r => 
    r.dryerServices > 0 || r.tipo === 2
  ).length;
  
  // Calculate utilization using TIME-BASED formula
  const totalMachineMinutes = (
    BUSINESS_PARAMS.TOTAL_WASHERS * BUSINESS_PARAMS.WASHER_CYCLE_MINUTES +
    BUSINESS_PARAMS.TOTAL_DRYERS * BUSINESS_PARAMS.DRYER_CYCLE_MINUTES
  ) * activeDays;
  
  const usedWasherMinutes = washServices * BUSINESS_PARAMS.WASHER_CYCLE_MINUTES;
  const usedDryerMinutes = dryServices * BUSINESS_PARAMS.DRYER_CYCLE_MINUTES;
  const usedMachineMinutes = usedWasherMinutes + usedDryerMinutes;
  
  const utilization = totalMachineMinutes > 0 
    ? (usedMachineMinutes / totalMachineMinutes) * 100 
    : 0;
  
  return {
    revenue: Math.round(revenue * 100) / 100,
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
