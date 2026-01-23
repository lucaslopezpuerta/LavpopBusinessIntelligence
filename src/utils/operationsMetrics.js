// Operations Metrics Calculator v3.8 - PRODUCTION LOGGING
// v3.8 (2025-12-23): Production logging cleanup
//   - Converted verbose console.log to logger.debug (dev-only)
//   - Cleaner console output in production
// v3.7
// ✅ Uses shared transactionParser for consistent cashback handling
// ✅ Uses centralized dateWindows.js for date calculations
// ✅ Includes Recarga in total revenue (Day of Week, Hourly)
// ✅ Excludes Recarga from machine-specific metrics (Wash vs Dry, Machine Performance)
// ✅ TIME-BASED utilization formula (machine-minutes)
// ✅ FIXED v3.7: Timezone-independent day-of-week calculation
//
// CHANGELOG:
// v3.7 (2025-12-10): CRITICAL FIX - Timezone-independent day-of-week
//   - calculateDayOfWeekPatterns uses date.brazil components
//   - Ensures correct day-of-week regardless of viewer's browser timezone
// v3.6 (2025-11-15): CRITICAL BUG FIX - Machine Performance Table
//   - Fixed calculateMachinePerformance to use r.machineStr instead of r.machines
//   - Was causing 0 machines to be detected
//   - Added peak vs off-peak utilization calculations
//   - Added previous period comparison for trends
// v3.5 (2025-11-15): Added calculateOverallUtilization function
// v3.4 (2025-11-15): Fixed ReferenceError - changed 'period' to 'dateFilter'
// v3.3 (2025-11-15): Integrated centralized dateWindows.js
// v3.2 (Previous): Added Recarga handling and revenue breakdown
// v3.1 (Previous): TIME-BASED utilization calculations
// v3.0 (Previous): Shared transactionParser integration

import { parseSalesRecords, filterWithServices, parseBrNumber } from './transactionParser';
import { getDateWindows } from './dateWindows';
import { logger } from './logger';

// UNIFIED BUSINESS PARAMS - Single source of truth
// Export for use in other modules (OperationsKPICards, businessMetrics)
export const BUSINESS_PARAMS = {
  TOTAL_WASHERS: 3,
  TOTAL_DRYERS: 5,
  OPERATING_HOURS: { start: 8, end: 23 }, // 8 AM to 11 PM (15 hours)
  WASHER_CYCLE_MINUTES: 30,
  DRYER_CYCLE_MINUTES: 45,
  PEAK_HOURS: { start: 14, end: 20 }, // 2 PM to 8 PM

  // Efficiency factor accounts for realistic idle time between cycles
  // 0.80 = 20% idle time (customer transitions, setup, breaks)
  // This aligns utilization % with displayed "realistic capacity"
  EFFICIENCY_FACTOR: 0.80
};

// UNIFIED UTILIZATION THRESHOLDS - Single source of truth
// Used by OperationsKPICards, PeakHoursSummary, and other components
// These thresholds are for OVERALL utilization classification
export const UTILIZATION_THRESHOLDS = {
  excellent: 25,  // ≥25% = Excelente (green) - strong profitability
  good: 15,       // ≥15% = Bom (teal) - healthy operation
  fair: 10        // ≥10% = Razoável (amber), <10% = Baixo (red)
};

// HOURLY UTILIZATION THRESHOLDS - For peak hour analysis
// Higher thresholds since we're measuring specific hours, not overall
export const HOURLY_THRESHOLDS = {
  critical: 50,   // ≥50% = Pico crítico - monitor for issues
  high: 30,       // ≥30% = Alta demanda - check machines before
  moderate: 15    // ≥15% = Fluxo moderado, <15% = Baixa demanda
};

// DAILY UTILIZATION THRESHOLDS - For day-of-week analysis
// Moderate thresholds aligned with business reality
export const DAILY_THRESHOLDS = {
  excellent: 35,  // ≥35% = Excelente (green) - very busy day
  good: 25,       // ≥25% = Bom (blue) - healthy day
  fair: 15        // ≥15% = Razoável (amber), <15% = Baixo (red)
};

const DAYS_OF_WEEK = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/**
 * Calculate overall utilization for the filtered period
 * ✅ TIME-BASED calculation using operating hours
 * ✅ Accounts for actual days with data
 * ✅ NEW v3.6: Separates peak vs off-peak utilization
 * @param {Array} salesData - Sales data array
 * @param {string} dateFilter - Date filter option
 */
export function calculateOverallUtilization(salesData, dateFilter = 'currentWeek') {
  const records = parseSalesRecords(salesData);
  const window = getDateWindows(dateFilter);
  const windowRecords = records.filter(r => 
    r.date >= window.start && 
    r.date <= window.end &&
    !r.isRecarga // Exclude Recarga from service counts
  );
  
  // Count total services and unique days
  let totalWash = 0;
  let totalDry = 0;
  let peakWash = 0;
  let peakDry = 0;
  let offPeakWash = 0;
  let offPeakDry = 0;
  const uniqueDates = new Set();
  
  windowRecords.forEach(r => {
    totalWash += r.washCount;
    totalDry += r.dryCount;
    uniqueDates.add(r.dateStr);
    
    // Separate peak vs off-peak
    const isPeakHour = r.hour >= BUSINESS_PARAMS.PEAK_HOURS.start && 
                       r.hour < BUSINESS_PARAMS.PEAK_HOURS.end;
    if (isPeakHour) {
      peakWash += r.washCount;
      peakDry += r.dryCount;
    } else {
      offPeakWash += r.washCount;
      offPeakDry += r.dryCount;
    }
  });
  
  const activeDays = uniqueDates.size || 1;
  const operatingHoursPerDay = BUSINESS_PARAMS.OPERATING_HOURS.end - BUSINESS_PARAMS.OPERATING_HOURS.start;
  const totalOperatingMinutes = activeDays * operatingHoursPerDay * 60;
  
  // Peak hours per day
  const peakHoursPerDay = BUSINESS_PARAMS.PEAK_HOURS.end - BUSINESS_PARAMS.PEAK_HOURS.start;
  const offPeakHoursPerDay = operatingHoursPerDay - peakHoursPerDay;
  const peakOperatingMinutes = activeDays * peakHoursPerDay * 60;
  const offPeakOperatingMinutes = activeDays * offPeakHoursPerDay * 60;
  
  // Calculate maximum possible cycles WITH EFFICIENCY FACTOR
  // This gives realistic capacity (accounting for idle time between cycles)
  const efficiencyFactor = BUSINESS_PARAMS.EFFICIENCY_FACTOR;

  const maxWashCycles = (totalOperatingMinutes / BUSINESS_PARAMS.WASHER_CYCLE_MINUTES) * BUSINESS_PARAMS.TOTAL_WASHERS * efficiencyFactor;
  const maxDryCycles = (totalOperatingMinutes / BUSINESS_PARAMS.DRYER_CYCLE_MINUTES) * BUSINESS_PARAMS.TOTAL_DRYERS * efficiencyFactor;

  const maxPeakWashCycles = (peakOperatingMinutes / BUSINESS_PARAMS.WASHER_CYCLE_MINUTES) * BUSINESS_PARAMS.TOTAL_WASHERS * efficiencyFactor;
  const maxPeakDryCycles = (peakOperatingMinutes / BUSINESS_PARAMS.DRYER_CYCLE_MINUTES) * BUSINESS_PARAMS.TOTAL_DRYERS * efficiencyFactor;

  const maxOffPeakWashCycles = (offPeakOperatingMinutes / BUSINESS_PARAMS.WASHER_CYCLE_MINUTES) * BUSINESS_PARAMS.TOTAL_WASHERS * efficiencyFactor;
  const maxOffPeakDryCycles = (offPeakOperatingMinutes / BUSINESS_PARAMS.DRYER_CYCLE_MINUTES) * BUSINESS_PARAMS.TOTAL_DRYERS * efficiencyFactor;
  
  // Calculate utilization percentages
  const washUtilization = (totalWash / maxWashCycles) * 100;
  const dryUtilization = (totalDry / maxDryCycles) * 100;
  
  const peakWashUtil = (peakWash / maxPeakWashCycles) * 100;
  const peakDryUtil = (peakDry / maxPeakDryCycles) * 100;
  
  const offPeakWashUtil = (offPeakWash / maxOffPeakWashCycles) * 100;
  const offPeakDryUtil = (offPeakDry / maxOffPeakDryCycles) * 100;
  
  // Weighted total utilization (proportional to machine count)
  const totalMachines = BUSINESS_PARAMS.TOTAL_WASHERS + BUSINESS_PARAMS.TOTAL_DRYERS;
  const washWeight = BUSINESS_PARAMS.TOTAL_WASHERS / totalMachines;
  const dryWeight = BUSINESS_PARAMS.TOTAL_DRYERS / totalMachines;
  const totalUtilization = (washUtilization * washWeight) + (dryUtilization * dryWeight);
  const peakTotalUtil = (peakWashUtil * washWeight) + (peakDryUtil * dryWeight);
  const offPeakTotalUtil = (offPeakWashUtil * washWeight) + (offPeakDryUtil * dryWeight);
  
  logger.debug('Operations', 'Overall Utilization', {
    dateFilter,
    dateRange: window.dateRange,
    activeDays,
    totalWash,
    totalDry,
    peakWash,
    offPeakWash,
    maxWashCycles: Math.round(maxWashCycles),
    maxDryCycles: Math.round(maxDryCycles),
    washUtilization: `${Math.round(washUtilization)}%`,
    dryUtilization: `${Math.round(dryUtilization)}%`,
    totalUtilization: `${Math.round(totalUtilization)}%`,
    peakUtil: `${Math.round(peakTotalUtil)}%`,
    offPeakUtil: `${Math.round(offPeakTotalUtil)}%`
  });
  
  return {
    // Overall metrics
    washUtilization: Math.round(washUtilization * 10) / 10,
    dryUtilization: Math.round(dryUtilization * 10) / 10,
    totalUtilization: Math.round(totalUtilization * 10) / 10,
    totalWashServices: totalWash,
    totalDryServices: totalDry,
    totalServices: totalWash + totalDry,
    activeDays,
    maxWashCycles: Math.round(maxWashCycles),
    maxDryCycles: Math.round(maxDryCycles),
    
    // Peak vs Off-Peak breakdown
    peak: {
      washUtilization: Math.round(peakWashUtil * 10) / 10,
      dryUtilization: Math.round(peakDryUtil * 10) / 10,
      totalUtilization: Math.round(peakTotalUtil * 10) / 10,
      washServices: peakWash,
      dryServices: peakDry,
      totalServices: peakWash + peakDry,
      hours: `${BUSINESS_PARAMS.PEAK_HOURS.start}h-${BUSINESS_PARAMS.PEAK_HOURS.end}h`
    },
    offPeak: {
      washUtilization: Math.round(offPeakWashUtil * 10) / 10,
      dryUtilization: Math.round(offPeakDryUtil * 10) / 10,
      totalUtilization: Math.round(offPeakTotalUtil * 10) / 10,
      washServices: offPeakWash,
      dryServices: offPeakDry,
      totalServices: offPeakWash + offPeakDry,
      hours: `${BUSINESS_PARAMS.OPERATING_HOURS.start}h-${BUSINESS_PARAMS.PEAK_HOURS.start}h, ${BUSINESS_PARAMS.PEAK_HOURS.end}h-${BUSINESS_PARAMS.OPERATING_HOURS.end}h`
    }
  };
}

/**
 * Calculate hourly utilization patterns
 * ✅ INCLUDES all revenue (Type 1 + Type 3 Recarga)
 * ✅ Service counts exclude Recarga
 * @param {Array} salesData - Sales data array
 * @param {string} dateFilter - Date filter option (currentWeek, lastWeek, last4Weeks, allTime)
 */
export function calculateHourlyPatterns(salesData, dateFilter = 'currentWeek') {
  const records = parseSalesRecords(salesData);
  const window = getDateWindows(dateFilter);
  const windowRecords = records.filter(r => r.date >= window.start && r.date <= window.end);
  
  const hourlyData = {};
  const hourCounts = {};
  
  for (let hour = BUSINESS_PARAMS.OPERATING_HOURS.start; hour < BUSINESS_PARAMS.OPERATING_HOURS.end; hour++) {
    hourlyData[hour] = { wash: 0, dry: 0, total: 0, revenue: 0 };
    hourCounts[hour] = new Set();
  }
  
  windowRecords.forEach(r => {
    const hour = r.hour;
    if (hour < BUSINESS_PARAMS.OPERATING_HOURS.start || hour >= BUSINESS_PARAMS.OPERATING_HOURS.end) return;
    
    // Services (exclude Recarga)
    if (!r.isRecarga) {
      hourlyData[hour].wash += r.washCount;
      hourlyData[hour].dry += r.dryCount;
      hourlyData[hour].total += r.totalServices;
    }
    
    // Revenue (include ALL - Type 1 + Type 3)
    hourlyData[hour].revenue += r.netValue;
    
    hourCounts[hour].add(r.dateStr);
  });
  
  const hoursArray = [];
  const operatingHoursPerDay = BUSINESS_PARAMS.OPERATING_HOURS.end - BUSINESS_PARAMS.OPERATING_HOURS.start;

  // Calculate weights based on machine count (consistent with calculateOverallUtilization)
  const totalMachinesHourly = BUSINESS_PARAMS.TOTAL_WASHERS + BUSINESS_PARAMS.TOTAL_DRYERS;
  const washWeightHourly = BUSINESS_PARAMS.TOTAL_WASHERS / totalMachinesHourly;
  const dryWeightHourly = BUSINESS_PARAMS.TOTAL_DRYERS / totalMachinesHourly;

  for (let hour = BUSINESS_PARAMS.OPERATING_HOURS.start; hour < BUSINESS_PARAMS.OPERATING_HOURS.end; hour++) {
    const uniqueDays = hourCounts[hour].size || 1;
    const avgWash = hourlyData[hour].wash / uniqueDays;
    const avgDry = hourlyData[hour].dry / uniqueDays;
    const avgTotal = hourlyData[hour].total / uniqueDays;

    // Apply efficiency factor for realistic hourly capacity
    const efficiencyFactor = BUSINESS_PARAMS.EFFICIENCY_FACTOR;
    const washCapacityPerHour = BUSINESS_PARAMS.TOTAL_WASHERS * 2 * efficiencyFactor;
    const dryCapacityPerHour = BUSINESS_PARAMS.TOTAL_DRYERS * (60 / 45) * efficiencyFactor;

    const washUtil = (avgWash / washCapacityPerHour) * 100;
    const dryUtil = (avgDry / dryCapacityPerHour) * 100;
    // Use weighted average based on machine count (3 washers vs 5 dryers)
    const totalUtil = (washUtil * washWeightHourly) + (dryUtil * dryWeightHourly);

    hoursArray.push({
      hour,
      hourLabel: `${hour}:00`,
      avgWash: Math.round(avgWash * 10) / 10,
      avgDry: Math.round(avgDry * 10) / 10,
      avgTotal: Math.round(avgTotal * 10) / 10,
      avgRevenue: hourlyData[hour].revenue / uniqueDays,
      washUtilization: Math.round(washUtil * 10) / 10,
      dryUtilization: Math.round(dryUtil * 10) / 10,
      totalUtilization: Math.round(totalUtil * 10) / 10,
      daysInSample: uniqueDays
    });
  }
  
  return hoursArray;
}

/**
 * Find peak and off-peak hours
 */
export function identifyPeakHours(hourlyPatterns) {
  if (!hourlyPatterns || hourlyPatterns.length === 0) {
    return { peak: [], offPeak: [] };
  }

  const sorted = [...hourlyPatterns].sort((a, b) => b.totalUtilization - a.totalUtilization);

  const peak = sorted.slice(0, 5).map(h => ({
    hour: h.hour,
    hourLabel: h.hourLabel,
    utilization: h.totalUtilization,
    avgServices: h.avgTotal,
    revenue: h.avgRevenue
  }));

  const offPeak = sorted.slice(-5).reverse().map(h => ({
    hour: h.hour,
    hourLabel: h.hourLabel,
    utilization: h.totalUtilization,
    avgServices: h.avgTotal,
    revenue: h.avgRevenue
  }));

  return { peak, offPeak };
}

/**
 * Calculate hourly patterns from day-of-week grid (matches UtilizationHeatmap calculation)
 * This aggregates by (hour, day-of-week) first, then averages across day-of-week cells.
 * Better reflects business patterns as it preserves day-of-week variations.
 * ✅ Used by PeakHoursSummary for consistency with heatmap
 * @param {Array} salesData - Sales data array
 * @param {string} dateFilter - Date filter option
 */
export function calculateHourlyPatternsFromGrid(salesData, dateFilter = 'currentWeek') {
  const records = parseSalesRecords(salesData);
  const window = getDateWindows(dateFilter);
  const windowRecords = records.filter(r =>
    r.date >= window.start &&
    r.date <= window.end &&
    !r.isRecarga
  );

  const { start: HOUR_START, end: HOUR_END } = BUSINESS_PARAMS.OPERATING_HOURS;

  // Capacity calculation (same as heatmap)
  const efficiencyFactor = BUSINESS_PARAMS.EFFICIENCY_FACTOR;
  const washCapacityPerHour = BUSINESS_PARAMS.TOTAL_WASHERS * (60 / BUSINESS_PARAMS.WASHER_CYCLE_MINUTES) * efficiencyFactor;
  const dryCapacityPerHour = BUSINESS_PARAMS.TOTAL_DRYERS * (60 / BUSINESS_PARAMS.DRYER_CYCLE_MINUTES) * efficiencyFactor;

  // Weights based on machine count
  const totalMachines = BUSINESS_PARAMS.TOTAL_WASHERS + BUSINESS_PARAMS.TOTAL_DRYERS;
  const washWeight = BUSINESS_PARAMS.TOTAL_WASHERS / totalMachines;
  const dryWeight = BUSINESS_PARAMS.TOTAL_DRYERS / totalMachines;

  // Initialize grid: [hour][day] - track wash and dry separately
  const grid = {};
  const daysSeen = {};
  const revenueGrid = {};

  for (let hour = HOUR_START; hour < HOUR_END; hour++) {
    grid[hour] = {};
    daysSeen[hour] = {};
    revenueGrid[hour] = {};
    for (let day = 0; day < 7; day++) {
      grid[hour][day] = { wash: 0, dry: 0, total: 0 };
      daysSeen[hour][day] = new Set();
      revenueGrid[hour][day] = 0;
    }
  }

  // Also track revenue (including Recarga) separately
  const allWindowRecords = records.filter(r => r.date >= window.start && r.date <= window.end);

  // Process services (exclude Recarga)
  windowRecords.forEach(r => {
    const hour = r.hour;
    if (hour < HOUR_START || hour >= HOUR_END) return;

    const dayOfWeek = r.date.brazil
      ? new Date(r.date.brazil.year, r.date.brazil.month - 1, r.date.brazil.day).getDay()
      : r.date.getDay();

    grid[hour][dayOfWeek].wash += r.washCount;
    grid[hour][dayOfWeek].dry += r.dryCount;
    grid[hour][dayOfWeek].total += r.totalServices;
    daysSeen[hour][dayOfWeek].add(r.dateStr);
  });

  // Process revenue (include ALL including Recarga)
  allWindowRecords.forEach(r => {
    const hour = r.hour;
    if (hour < HOUR_START || hour >= HOUR_END) return;

    const dayOfWeek = r.date.brazil
      ? new Date(r.date.brazil.year, r.date.brazil.month - 1, r.date.brazil.day).getDay()
      : r.date.getDay();

    revenueGrid[hour][dayOfWeek] += r.netValue;
  });

  // Calculate hourly averages from day-of-week cells
  const hoursArray = [];

  for (let hour = HOUR_START; hour < HOUR_END; hour++) {
    let totalUtilization = 0;
    let totalServices = 0;
    let totalRevenue = 0;
    let cellsWithData = 0;

    for (let day = 0; day < 7; day++) {
      const uniqueDays = daysSeen[hour][day].size;
      if (uniqueDays === 0) continue;

      const avgWash = grid[hour][day].wash / uniqueDays;
      const avgDry = grid[hour][day].dry / uniqueDays;
      const avgServices = grid[hour][day].total / uniqueDays;
      const avgRevenue = revenueGrid[hour][day] / uniqueDays;

      // Weighted utilization (same as heatmap)
      const washUtil = (avgWash / washCapacityPerHour) * 100;
      const dryUtil = (avgDry / dryCapacityPerHour) * 100;
      const cellUtilization = (washUtil * washWeight) + (dryUtil * dryWeight);

      totalUtilization += cellUtilization;
      totalServices += avgServices;
      totalRevenue += avgRevenue;
      cellsWithData++;
    }

    // Average across day-of-week cells that have data
    const avgUtilization = cellsWithData > 0 ? totalUtilization / cellsWithData : 0;
    const avgServices = cellsWithData > 0 ? totalServices / cellsWithData : 0;
    const avgRevenue = cellsWithData > 0 ? totalRevenue / cellsWithData : 0;

    hoursArray.push({
      hour,
      hourLabel: `${hour}:00`,
      totalUtilization: Math.round(avgUtilization * 10) / 10,
      avgTotal: Math.round(avgServices * 10) / 10,
      avgRevenue: Math.round(avgRevenue * 100) / 100,
      daysWithData: cellsWithData
    });
  }

  return hoursArray;
}

/**
 * Find peak and off-peak hours from grid-based calculation
 * Uses calculateHourlyPatternsFromGrid for consistency with heatmap
 */
export function identifyPeakHoursFromGrid(salesData, dateFilter = 'currentWeek') {
  const hourlyPatterns = calculateHourlyPatternsFromGrid(salesData, dateFilter);

  if (!hourlyPatterns || hourlyPatterns.length === 0) {
    return { peak: [], offPeak: [] };
  }

  const sorted = [...hourlyPatterns].sort((a, b) => b.totalUtilization - a.totalUtilization);

  const peak = sorted.slice(0, 5).map(h => ({
    hour: h.hour,
    hourLabel: h.hourLabel,
    utilization: h.totalUtilization,
    avgServices: h.avgTotal,
    revenue: h.avgRevenue
  }));

  const offPeak = sorted.slice(-5).reverse().map(h => ({
    hour: h.hour,
    hourLabel: h.hourLabel,
    utilization: h.totalUtilization,
    avgServices: h.avgTotal,
    revenue: h.avgRevenue
  }));

  return { peak, offPeak };
}

/**
 * Calculate day-of-week utilization patterns
 * ✅ INCLUDES all revenue (Type 1 + Type 3 Recarga)
 * ✅ Service counts exclude Recarga
 * @param {Array} salesData - Sales data array
 * @param {string} dateFilter - Date filter option
 */
export function calculateDayOfWeekPatterns(salesData, dateFilter = 'currentWeek') {
  const records = parseSalesRecords(salesData);
  const window = getDateWindows(dateFilter);
  const windowRecords = records.filter(r => r.date >= window.start && r.date <= window.end);
  
  const dayData = {};
  const dayCounts = {};
  
  for (let day = 0; day < 7; day++) {
    dayData[day] = { wash: 0, dry: 0, total: 0, revenue: 0, transactions: 0 };
    dayCounts[day] = new Set();
  }
  
  windowRecords.forEach(r => {
    // Use date.brazil components for timezone-independent day-of-week
    // This ensures correct day categorization regardless of viewer's browser timezone
    const dayOfWeek = r.date.brazil
      ? new Date(r.date.brazil.year, r.date.brazil.month - 1, r.date.brazil.day).getDay()
      : r.date.getDay();

    // Services (exclude Recarga)
    if (!r.isRecarga) {
      dayData[dayOfWeek].wash += r.washCount;
      dayData[dayOfWeek].dry += r.dryCount;
      dayData[dayOfWeek].total += r.totalServices;
    }

    // Revenue (include ALL)
    dayData[dayOfWeek].revenue += r.netValue;
    dayData[dayOfWeek].transactions += 1;

    dayCounts[dayOfWeek].add(r.dateStr);
  });
  
  const daysArray = [];
  const operatingHoursPerDay = BUSINESS_PARAMS.OPERATING_HOURS.end - BUSINESS_PARAMS.OPERATING_HOURS.start;
  
  // Calculate weights based on machine count (consistent with calculateOverallUtilization)
  const totalMachines = BUSINESS_PARAMS.TOTAL_WASHERS + BUSINESS_PARAMS.TOTAL_DRYERS;
  const washWeight = BUSINESS_PARAMS.TOTAL_WASHERS / totalMachines;
  const dryWeight = BUSINESS_PARAMS.TOTAL_DRYERS / totalMachines;

  for (let day = 0; day < 7; day++) {
    const uniqueDays = dayCounts[day].size || 1;
    const avgWash = dayData[day].wash / uniqueDays;
    const avgDry = dayData[day].dry / uniqueDays;
    const avgTotal = dayData[day].total / uniqueDays;

    // Apply efficiency factor for realistic daily capacity
    const efficiencyFactor = BUSINESS_PARAMS.EFFICIENCY_FACTOR;
    const washCapacityPerDay = BUSINESS_PARAMS.TOTAL_WASHERS * 2 * operatingHoursPerDay * efficiencyFactor;
    const dryCapacityPerDay = BUSINESS_PARAMS.TOTAL_DRYERS * (60 / 45) * operatingHoursPerDay * efficiencyFactor;

    const washUtil = (avgWash / washCapacityPerDay) * 100;
    const dryUtil = (avgDry / dryCapacityPerDay) * 100;
    // Use weighted average based on machine count (3 washers vs 5 dryers)
    const totalUtilization = (washUtil * washWeight) + (dryUtil * dryWeight);
    
    daysArray.push({
      day,
      dayName: DAYS_OF_WEEK[day],
      dayShort: DAYS_SHORT[day],
      avgWash: Math.round(avgWash * 10) / 10,
      avgDry: Math.round(avgDry * 10) / 10,
      avgTotal: Math.round(avgTotal * 10) / 10,
      avgRevenue: dayData[day].revenue / uniqueDays,
      avgTransactions: dayData[day].transactions / uniqueDays,
      washUtilization: Math.round(washUtil * 10) / 10,
      dryUtilization: Math.round(dryUtil * 10) / 10,
      totalUtilization: Math.round(totalUtilization * 10) / 10,
      daysInSample: uniqueDays
    });
  }
  
  return daysArray;
}

/**
 * Calculate wash vs dry service comparison
 * ✅ EXCLUDES Recarga (machine-attributed revenue only)
 * @param {Array} salesData - Sales data array
 * @param {string} dateFilter - Date filter option
 */
export function calculateWashVsDry(salesData, dateFilter = 'currentWeek') {
  const records = parseSalesRecords(salesData);
  const window = getDateWindows(dateFilter);
  const windowRecords = records.filter(r => 
    r.date >= window.start && 
    r.date <= window.end &&
    !r.isRecarga
  );
  
  let washServices = 0;
  let dryServices = 0;
  let washRevenue = 0;
  let dryRevenue = 0;
  let transactions = 0;
  
  windowRecords.forEach(r => {
    washServices += r.washCount;
    dryServices += r.dryCount;
    
    // Proportional revenue attribution
    const totalMachines = r.totalServices;
    if (totalMachines > 0) {
      washRevenue += (r.washCount / totalMachines) * r.netValue;
      dryRevenue += (r.dryCount / totalMachines) * r.netValue;
    }
    
    transactions += 1;
  });
  
  const totalServices = washServices + dryServices;
  const totalRevenue = washRevenue + dryRevenue;
  
  return {
    wash: {
      services: washServices,
      revenue: washRevenue,
      avgPerService: washServices > 0 ? washRevenue / washServices : 0,
      percentOfServices: totalServices > 0 ? (washServices / totalServices) * 100 : 0,
      percentOfRevenue: totalRevenue > 0 ? (washRevenue / totalRevenue) * 100 : 0
    },
    dry: {
      services: dryServices,
      revenue: dryRevenue,
      avgPerService: dryServices > 0 ? dryRevenue / dryServices : 0,
      percentOfServices: totalServices > 0 ? (dryServices / totalServices) * 100 : 0,
      percentOfRevenue: totalRevenue > 0 ? (dryRevenue / totalRevenue) * 100 : 0
    },
    total: {
      services: totalServices,
      revenue: totalRevenue,
      transactions
    }
  };
}

/**
 * Calculate machine-by-machine performance
 * ✅ EXCLUDES Recarga (only machine-attributed services and revenue)
 * ✅ FIXED v3.6: Uses r.machineStr instead of r.machines
 * @param {Array} salesData - Sales data array
 * @param {string} dateFilter - Date filter option
 */
export function calculateMachinePerformance(salesData, dateFilter = 'currentWeek') {
  const records = parseSalesRecords(salesData);
  const window = getDateWindows(dateFilter);
  const windowRecords = records.filter(r => 
    r.date >= window.start && 
    r.date <= window.end &&
    !r.isRecarga
  );
  
  const machines = {};
  
  windowRecords.forEach(r => {
    // FIXED: Use r.machineStr instead of r.machines
    const machinesList = String(r.machineStr || '').split(',').map(m => m.trim()).filter(m => m);
    const totalMachines = machinesList.length;
    
    if (totalMachines === 0) return;
    
    const revenuePerMachine = r.netValue / totalMachines;
    
    machinesList.forEach(machine => {
      const machineLower = machine.toLowerCase();
      if (!machines[machine]) {
        machines[machine] = {
          name: machine,
          type: machineLower.includes('lavadora') ? 'wash' : 'dry',
          uses: 0,
          revenue: 0
        };
      }
      
      machines[machine].uses += 1;
      machines[machine].revenue += revenuePerMachine;
    });
  });
  
  logger.debug('Operations', 'Machine Performance', {
    dateFilter,
    totalMachines: Object.keys(machines).length,
    windowRecords: windowRecords.length
  });
  
  return Object.values(machines).map(m => ({
    ...m,
    avgRevenuePerUse: m.uses > 0 ? m.revenue / m.uses : 0
  })).sort((a, b) => b.uses - a.uses);
}

/**
 * Main function: Calculate all operations metrics
 * @param {Array} salesData - Sales data array
 * @param {string} dateFilter - Date filter option (currentWeek, lastWeek, last4Weeks, allTime)
 */
export function calculateOperationsMetrics(salesData, dateFilter = 'currentWeek') {
  const window = getDateWindows(dateFilter);
  const overallUtilization = calculateOverallUtilization(salesData, dateFilter);
  const hourlyPatterns = calculateHourlyPatterns(salesData, dateFilter);
  const peakHours = identifyPeakHours(hourlyPatterns);
  // NEW v3.8: Grid-based peak hours (matches heatmap calculation, used by PeakHoursSummary)
  const peakHoursGrid = identifyPeakHoursFromGrid(salesData, dateFilter);
  const dayPatterns = calculateDayOfWeekPatterns(salesData, dateFilter);
  const washVsDry = calculateWashVsDry(salesData, dateFilter);
  const machinePerformance = calculateMachinePerformance(salesData, dateFilter);

  // Calculate revenue breakdown
  const records = parseSalesRecords(salesData);
  const windowRecords = records.filter(r => r.date >= window.start && r.date <= window.end);

  const machineRevenue = windowRecords.filter(r => !r.isRecarga).reduce((sum, r) => sum + r.netValue, 0);
  const recargaRevenue = windowRecords.filter(r => r.isRecarga).reduce((sum, r) => sum + r.netValue, 0);
  const totalRevenue = machineRevenue + recargaRevenue;

  return {
    // NEW v3.5: Overall utilization for the filtered period
    utilization: overallUtilization,

    hourlyPatterns,
    peakHours,
    // NEW v3.8: Grid-based peak hours for PeakHoursSummary (matches heatmap)
    peakHoursGrid,
    dayPatterns,
    washVsDry,
    machinePerformance,
    period: dateFilter, // Keep 'period' key for backward compatibility
    dateFilter,
    dateRange: window.dateRange,
    revenueBreakdown: {
      machineRevenue: Math.round(machineRevenue * 100) / 100,
      recargaRevenue: Math.round(recargaRevenue * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100
    }
  };
}
