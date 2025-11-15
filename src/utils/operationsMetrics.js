// Operations Metrics Calculator v3.3
// ✅ Uses shared transactionParser for consistent cashback handling
// ✅ Includes Recarga in total revenue (Day of Week, Hourly)
// ✅ Excludes Recarga from machine-specific metrics (Wash vs Dry, Machine Performance)
// ✅ TIME-BASED utilization formula (machine-minutes)
// ✅ Uses centralized dateWindows.js for all date calculations

import { parseSalesRecords, filterWithServices, parseBrNumber } from './transactionParser';
import { getDateWindows } from './dateWindows';

const BUSINESS_PARAMS = {
  TOTAL_WASHERS: 3,
  TOTAL_DRYERS: 5,
  OPERATING_HOURS: { start: 8, end: 23 }, // 8 AM to 11 PM
  WASHER_CYCLE_MINUTES: 30,
  DRYER_CYCLE_MINUTES: 45
};

const DAYS_OF_WEEK = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/**
 * Calculate hourly utilization patterns
 * ✅ INCLUDES all revenue (Type 1 + Type 3 Recarga)
 * ✅ Service counts exclude Recarga
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
  
  for (let hour = BUSINESS_PARAMS.OPERATING_HOURS.start; hour < BUSINESS_PARAMS.OPERATING_HOURS.end; hour++) {
    const uniqueDays = hourCounts[hour].size || 1;
    const avgWash = hourlyData[hour].wash / uniqueDays;
    const avgDry = hourlyData[hour].dry / uniqueDays;
    const avgTotal = hourlyData[hour].total / uniqueDays;
    
    const washCapacityPerHour = BUSINESS_PARAMS.TOTAL_WASHERS * 2;
    const dryCapacityPerHour = BUSINESS_PARAMS.TOTAL_DRYERS * (60 / 45);
    
    const washUtil = (avgWash / washCapacityPerHour) * 100;
    const dryUtil = (avgDry / dryCapacityPerHour) * 100;
    
    hoursArray.push({
      hour,
      hourLabel: `${hour}:00`,
      avgWash: Math.round(avgWash * 10) / 10,
      avgDry: Math.round(avgDry * 10) / 10,
      avgTotal: Math.round(avgTotal * 10) / 10,
      avgRevenue: hourlyData[hour].revenue / uniqueDays,
      washUtilization: Math.round(washUtil * 10) / 10,
      dryUtilization: Math.round(dryUtil * 10) / 10,
      totalUtilization: Math.round(((washUtil + dryUtil) / 2) * 10) / 10,
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
 * Calculate day-of-week utilization patterns
 * ✅ INCLUDES all revenue (Type 1 + Type 3 Recarga)
 * ✅ Service counts exclude Recarga
 */
export function calculateDayOfWeekPatterns(salesData, period = 'currentWeek') {
  const records = parseSalesRecords(salesData);
  const window = getDateWindows(period);
  const windowRecords = records.filter(r => r.date >= window.start && r.date <= window.end);
  
  const dayData = {};
  const dayCounts = {};
  
  for (let day = 0; day < 7; day++) {
    dayData[day] = { wash: 0, dry: 0, total: 0, revenue: 0, transactions: 0 };
    dayCounts[day] = new Set();
  }
  
  windowRecords.forEach(r => {
    const dayOfWeek = r.date.getDay();
    
    // Services (exclude Recarga)
    if (!r.isRecarga) {
      dayData[dayOfWeek].wash += r.washCount;
      dayData[dayOfWeek].dry += r.dryCount;
      dayData[dayOfWeek].total += r.totalServices;
    }
    
    // Revenue (include ALL - Type 1 + Type 3)
    dayData[dayOfWeek].revenue += r.netValue;
    dayData[dayOfWeek].transactions += 1;
    
    dayCounts[dayOfWeek].add(r.dateStr);
  });
  
  const daysArray = [];
  const operatingHoursPerDay = BUSINESS_PARAMS.OPERATING_HOURS.end - BUSINESS_PARAMS.OPERATING_HOURS.start;
  const shouldAverage = period !== 'currentWeek';
  
  for (let day = 0; day < 7; day++) {
    const uniqueDays = shouldAverage ? (dayCounts[day].size || 1) : 1;
    const avgWash = dayData[day].wash / uniqueDays;
    const avgDry = dayData[day].dry / uniqueDays;
    const avgTotal = dayData[day].total / uniqueDays;
    
    // TIME-BASED UTILIZATION
    const washMinutesUsed = avgWash * BUSINESS_PARAMS.WASHER_CYCLE_MINUTES;
    const dryMinutesUsed = avgDry * BUSINESS_PARAMS.DRYER_CYCLE_MINUTES;
    const totalMinutesUsed = washMinutesUsed + dryMinutesUsed;
    
    const washMinutesAvailable = BUSINESS_PARAMS.TOTAL_WASHERS * operatingHoursPerDay * 60;
    const dryMinutesAvailable = BUSINESS_PARAMS.TOTAL_DRYERS * operatingHoursPerDay * 60;
    const totalMinutesAvailable = washMinutesAvailable + dryMinutesAvailable;
    
    const totalUtilization = (totalMinutesUsed / totalMinutesAvailable) * 100;
    const washUtil = (washMinutesUsed / washMinutesAvailable) * 100;
    const dryUtil = (dryMinutesUsed / dryMinutesAvailable) * 100;
    
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
 * ✅ EXCLUDES Recarga (machine-attributed revenue only)
 * ✅ Uses NET revenue (after cashback)
 */
export function calculateMachinePerformance(salesData, period = 'currentWeek') {
  const records = parseSalesRecords(salesData);
  const window = getDateWindows(period);
  const windowRecords = records.filter(r => 
    r.date >= window.start && 
    r.date <= window.end &&
    !r.isRecarga
  );
  
  const machines = {};
  
  windowRecords.forEach(r => {
    const machineList = String(r.machineStr)
      .split(',')
      .map(m => m.trim())
      .filter(m => m);
    
    if (machineList.length === 0) return;
    
    const revenuePerMachine = r.netValue / machineList.length;
    
    machineList.forEach(machine => {
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
  
  console.log('Machine Performance (v3.1 FIXED):', {
    period,
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
 */
export function calculateOperationsMetrics(salesData, period = 'currentWeek') {
  const hourlyPatterns = calculateHourlyPatterns(salesData, period);
  const peakHours = identifyPeakHours(hourlyPatterns);
  const dayPatterns = calculateDayOfWeekPatterns(salesData, period);
  const washVsDry = calculateWashVsDry(salesData, period);
  const machinePerformance = calculateMachinePerformance(salesData, period);
  
  // Calculate revenue breakdown
  const records = parseSalesRecords(salesData);
  const window = getDateWindows(period);
  const windowRecords = records.filter(r => r.date >= window.start && r.date <= window.end);
  
  const machineRevenue = windowRecords.filter(r => !r.isRecarga).reduce((sum, r) => sum + r.netValue, 0);
  const recargaRevenue = windowRecords.filter(r => r.isRecarga).reduce((sum, r) => sum + r.netValue, 0);
  const totalRevenue = machineRevenue + recargaRevenue;
  
  return {
    hourlyPatterns,
    peakHours,
    dayPatterns,
    washVsDry,
    machinePerformance,
    period,
    revenueBreakdown: {
      machineRevenue: Math.round(machineRevenue * 100) / 100,
      recargaRevenue: Math.round(recargaRevenue * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100
    }
  };
}
