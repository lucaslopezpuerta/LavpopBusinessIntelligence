// Analytics Calculator v2.0 - Strategic Metrics
// ✅ REUSES proven functions from businessMetrics.js and operationsMetrics.js
// ✅ Adds ONLY new functions for strategic analysis
// ✅ Focus: Monthly trends, MoM/YoY growth, forecasting, seasonal patterns
//
// CHANGELOG:
// v2.0 (2025-11-16): Complete redesign - strategic focus
//   - Reuses calculateTotals() and calculateUtilization()
//   - Adds monthly aggregation
//   - Adds MoM/QoQ/YoY calculations
//   - Adds seasonal indexing
//   - Adds revenue forecasting

import { parseSalesRecords, filterWithServices } from './transactionParser';
import { getShortMonthName, getMonthName } from './analyticsDateUtils';

const BUSINESS_PARAMS = {
  TOTAL_WASHERS: 3,
  TOTAL_DRYERS: 5,
  OPERATING_HOURS: { start: 8, end: 23 },
  WASHER_CYCLE_MINUTES: 30,
  DRYER_CYCLE_MINUTES: 45
};

const OPERATING_HOURS_PER_DAY = BUSINESS_PARAMS.OPERATING_HOURS.end - BUSINESS_PARAMS.OPERATING_HOURS.start;

/**
 * Calculate totals for a set of records
 * ✅ REUSES proven logic from businessMetrics.js
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
  
  // Sum first, THEN round (proven logic)
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
 * Calculate utilization
 * ✅ REUSES proven logic from businessMetrics.js
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

  // TIME-BASED UTILIZATION (proven formula)
  const washMinutesUsed = operatingWashCount * BUSINESS_PARAMS.WASHER_CYCLE_MINUTES;
  const dryMinutesUsed = operatingDryCount * BUSINESS_PARAMS.DRYER_CYCLE_MINUTES;
  const totalMinutesUsed = washMinutesUsed + dryMinutesUsed;
  
  const washMinutesAvailable = BUSINESS_PARAMS.TOTAL_WASHERS * OPERATING_HOURS_PER_DAY * activeDays * 60;
  const dryMinutesAvailable = BUSINESS_PARAMS.TOTAL_DRYERS * OPERATING_HOURS_PER_DAY * activeDays * 60;
  const totalMinutesAvailable = washMinutesAvailable + dryMinutesAvailable;
  
  const totalUtilization = totalMinutesAvailable > 0 
    ? (totalMinutesUsed / totalMinutesAvailable) * 100 
    : 0;

  return {
    totalUtilization: Math.round(totalUtilization * 10) / 10
  };
}

/**
 * Aggregate records by calendar month
 * NEW FUNCTION for Analytics tab
 */
export function aggregateByMonth(salesData) {
  const records = parseSalesRecords(salesData);
  const monthGroups = {};
  
  records.forEach(record => {
    const year = record.date.getFullYear();
    const month = record.date.getMonth();
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    
    if (!monthGroups[key]) {
      monthGroups[key] = {
        year,
        month,
        label: `${getShortMonthName(month)} ${year}`,
        fullLabel: `${getMonthName(month)} ${year}`,
        startDate: new Date(year, month, 1, 0, 0, 0, 0),
        endDate: new Date(year, month + 1, 0, 23, 59, 59, 999),
        records: []
      };
    }
    
    monthGroups[key].records.push(record);
  });
  
  // Convert to sorted array
  const monthArray = Object.values(monthGroups).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
  
  // Calculate metrics for each month
  return monthArray.map(monthGroup => {
    const window = { start: monthGroup.startDate, end: monthGroup.endDate };
    const totals = calculateTotals(monthGroup.records, window);
    const utilization = calculateUtilization(monthGroup.records, window);
    
    return {
      year: monthGroup.year,
      month: monthGroup.month,
      label: monthGroup.label,
      fullLabel: monthGroup.fullLabel,
      startDate: monthGroup.startDate,
      endDate: monthGroup.endDate,
      revenue: totals.netRevenue,
      services: totals.totalServices,
      washServices: totals.washServices,
      dryServices: totals.dryServices,
      utilization: utilization.totalUtilization,
      activeDays: totals.activeDays
    };
  });
}

/**
 * Calculate growth rates (MoM, QoQ, YoY)
 */
export function calculateGrowthRate(current, previous) {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/**
 * Calculate Month-over-Month growth for time series
 */
export function calculateMoMGrowth(monthlyData) {
  return monthlyData.map((month, index) => {
    if (index === 0) return { ...month, momGrowth: null };
    
    const prevMonth = monthlyData[index - 1];
    const momGrowth = calculateGrowthRate(month.revenue, prevMonth.revenue);
    
    return { ...month, momGrowth };
  });
}

/**
 * Calculate Year-over-Year growth
 */
export function calculateYoYGrowth(monthlyData) {
  return monthlyData.map((month, index) => {
    // Find same month last year
    const lastYear = monthlyData.find(m => 
      m.month === month.month && m.year === month.year - 1
    );
    
    if (!lastYear) return { ...month, yoyGrowth: null };
    
    const yoyGrowth = calculateGrowthRate(month.revenue, lastYear.revenue);
    
    return { ...month, yoyGrowth };
  });
}

/**
 * Get current month metrics
 */
export function getCurrentMonthMetrics(salesData) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  
  const records = parseSalesRecords(salesData);
  const currentMonthRecords = records.filter(r => 
    r.date.getFullYear() === currentYear && 
    r.date.getMonth() === currentMonth
  );
  
  const startDate = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
  const endDate = today;
  const window = { start: startDate, end: endDate };
  
  const totals = calculateTotals(currentMonthRecords, window);
  const utilization = calculateUtilization(currentMonthRecords, window);
  
  return {
    revenue: totals.netRevenue,
    services: totals.totalServices,
    utilization: utilization.totalUtilization,
    activeDays: totals.activeDays
  };
}

/**
 * Get previous month metrics
 */
export function getPreviousMonthMetrics(salesData) {
  const today = new Date();
  const prevMonth = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
  const prevYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
  
  const records = parseSalesRecords(salesData);
  const prevMonthRecords = records.filter(r => 
    r.date.getFullYear() === prevYear && 
    r.date.getMonth() === prevMonth
  );
  
  const startDate = new Date(prevYear, prevMonth, 1, 0, 0, 0, 0);
  const endDate = new Date(prevYear, prevMonth + 1, 0, 23, 59, 59, 999);
  const window = { start: startDate, end: endDate };
  
  const totals = calculateTotals(prevMonthRecords, window);
  const utilization = calculateUtilization(prevMonthRecords, window);
  
  return {
    revenue: totals.netRevenue,
    services: totals.totalServices,
    utilization: utilization.totalUtilization,
    activeDays: totals.activeDays,
    monthName: getMonthName(prevMonth),
    year: prevYear
  };
}

/**
 * Get same month last year metrics
 */
export function getSameMonthLastYearMetrics(salesData) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const lastYear = today.getFullYear() - 1;
  
  const records = parseSalesRecords(salesData);
  const lastYearRecords = records.filter(r => 
    r.date.getFullYear() === lastYear && 
    r.date.getMonth() === currentMonth
  );
  
  if (lastYearRecords.length === 0) return null;
  
  const startDate = new Date(lastYear, currentMonth, 1, 0, 0, 0, 0);
  const endDate = new Date(lastYear, currentMonth + 1, 0, 23, 59, 59, 999);
  const window = { start: startDate, end: endDate };
  
  const totals = calculateTotals(lastYearRecords, window);
  const utilization = calculateUtilization(lastYearRecords, window);
  
  return {
    revenue: totals.netRevenue,
    services: totals.totalServices,
    utilization: utilization.totalUtilization,
    activeDays: totals.activeDays,
    monthName: getMonthName(currentMonth),
    year: lastYear
  };
}

/**
 * Calculate seasonal index (which months are strongest)
 */
export function calculateSeasonalIndex(monthlyData) {
  // Group by month (0-11) across all years
  const monthlyAverages = {};
  
  for (let m = 0; m < 12; m++) {
    const monthRecords = monthlyData.filter(d => d.month === m);
    if (monthRecords.length === 0) continue;
    
    const avgRevenue = monthRecords.reduce((sum, d) => sum + d.revenue, 0) / monthRecords.length;
    
    monthlyAverages[m] = {
      month: m,
      monthName: getMonthName(m),
      avgRevenue: Math.round(avgRevenue * 100) / 100,
      count: monthRecords.length
    };
  }
  
  // Convert to array and sort by revenue
  const seasonalData = Object.values(monthlyAverages).sort((a, b) => b.avgRevenue - a.avgRevenue);
  
  // Calculate overall average
  const overallAvg = seasonalData.reduce((sum, d) => sum + d.avgRevenue, 0) / seasonalData.length;
  
  // Calculate index (100 = average, >100 = above average)
  return seasonalData.map(d => ({
    ...d,
    index: Math.round((d.avgRevenue / overallAvg) * 100),
    performance: d.avgRevenue > overallAvg * 1.1 ? 'strong' :
                 d.avgRevenue < overallAvg * 0.9 ? 'weak' : 'average'
  }));
}

/**
 * Simple linear forecast for next 3 months
 * Uses last 6 months trend
 */
export function forecastRevenue(monthlyData) {
  if (monthlyData.length < 6) return [];
  
  // Use last 6 months for trend
  const recentMonths = monthlyData.slice(-6);
  
  // Calculate linear regression
  const n = recentMonths.length;
  const sumX = recentMonths.reduce((sum, _, i) => sum + i, 0);
  const sumY = recentMonths.reduce((sum, d) => sum + d.revenue, 0);
  const sumXY = recentMonths.reduce((sum, d, i) => sum + (i * d.revenue), 0);
  const sumXX = recentMonths.reduce((sum, _, i) => sum + (i * i), 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Project next 3 months
  const lastMonth = monthlyData[monthlyData.length - 1];
  const forecasts = [];
  
  for (let i = 1; i <= 3; i++) {
    const futureMonth = (lastMonth.month + i) % 12;
    const futureYear = lastMonth.year + Math.floor((lastMonth.month + i) / 12);
    const projectedRevenue = Math.max(0, Math.round((intercept + slope * (n + i - 1)) * 100) / 100);
    
    forecasts.push({
      month: futureMonth,
      year: futureYear,
      label: `${getShortMonthName(futureMonth)} ${futureYear}`,
      revenue: projectedRevenue,
      isForecast: true
    });
  }
  
  return forecasts;
}

/**
 * Calculate average growth rate over last N months
 */
export function calculateAverageGrowth(monthlyData, months = 6) {
  if (monthlyData.length < months + 1) return null;
  
  const recentData = monthlyData.slice(-months);
  let totalGrowth = 0;
  let count = 0;
  
  for (let i = 1; i < recentData.length; i++) {
    const growth = calculateGrowthRate(recentData[i].revenue, recentData[i - 1].revenue);
    if (growth !== null && !isNaN(growth)) {
      totalGrowth += growth;
      count++;
    }
  }
  
  return count > 0 ? Math.round((totalGrowth / count) * 10) / 10 : null;
}

/**
 * Identify best and worst performing months
 */
export function identifyPeakMonths(monthlyData) {
  if (monthlyData.length === 0) return { best: null, worst: null };
  
  const sorted = [...monthlyData].sort((a, b) => b.revenue - a.revenue);
  
  return {
    best: sorted[0],
    worst: sorted[sorted.length - 1]
  };
}

/**
 * Calculate customer acquisition trend
 * NEW customers per month
 */
export function calculateCustomerAcquisition(salesData, customerData) {
  // This will be implemented when we add customer analytics section
  // For now, return placeholder
  return [];
}
