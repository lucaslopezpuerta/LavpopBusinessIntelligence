// Operations Metrics Calculator v1.0
// Focused on machine efficiency, utilization, and resource optimization

import { parseBrDate } from './dateUtils';

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
 * Count machines from transaction string
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
 * Parse Brazilian number format
 */
function parseBrNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  const str = String(value).trim();
  if (str.includes('.') && str.includes(',')) {
    return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
  }
  if (str.includes(',')) {
    return parseFloat(str.replace(',', '.')) || 0;
  }
  return parseFloat(str) || 0;
}

/**
 * Get current week boundaries (Sunday to Saturday)
 */
function getCurrentWeekWindow() {
  const currentDate = new Date();
  
  let lastSaturday = new Date(currentDate);
  const daysFromSaturday = (currentDate.getDay() + 1) % 7;
  lastSaturday.setDate(lastSaturday.getDate() - daysFromSaturday);
  lastSaturday.setHours(23, 59, 59, 999);
  
  let startSunday = new Date(lastSaturday);
  startSunday.setDate(startSunday.getDate() - 6);
  startSunday.setHours(0, 0, 0, 0);
  
  return { start: startSunday, end: lastSaturday };
}

/**
 * Calculate hourly utilization patterns
 * Returns average services per hour across all days in the window
 */
export function calculateHourlyPatterns(salesData) {
  const window = getCurrentWeekWindow();
  const hourlyData = {};
  const hourCounts = {};
  
  // Initialize hours
  for (let hour = BUSINESS_PARAMS.OPERATING_HOURS.start; hour < BUSINESS_PARAMS.OPERATING_HOURS.end; hour++) {
    hourlyData[hour] = { wash: 0, dry: 0, total: 0, revenue: 0 };
    hourCounts[hour] = new Set(); // Track unique days we have data for
  }
  
  salesData.forEach(row => {
    const date = parseBrDate(row.Data || row.Data_Hora || row.date || '');
    if (!date || date < window.start || date > window.end) return;
    
    const hour = date.getHours();
    if (hour < BUSINESS_PARAMS.OPERATING_HOURS.start || hour >= BUSINESS_PARAMS.OPERATING_HOURS.end) return;
    
    const machines = countMachines(row.Maquinas || row.machine || '');
    const netValue = parseBrNumber(row.Valor_Pago || row.net_value || 0);
    
    hourlyData[hour].wash += machines.wash;
    hourlyData[hour].dry += machines.dry;
    hourlyData[hour].total += machines.total;
    hourlyData[hour].revenue += netValue;
    
    // Track this day
    const dateStr = date.toISOString().split('T')[0];
    hourCounts[hour].add(dateStr);
  });
  
  // Calculate averages and utilization
  const hoursArray = [];
  const operatingHoursPerDay = BUSINESS_PARAMS.OPERATING_HOURS.end - BUSINESS_PARAMS.OPERATING_HOURS.start;
  
  for (let hour = BUSINESS_PARAMS.OPERATING_HOURS.start; hour < BUSINESS_PARAMS.OPERATING_HOURS.end; hour++) {
    const uniqueDays = hourCounts[hour].size || 1;
    const avgWash = hourlyData[hour].wash / uniqueDays;
    const avgDry = hourlyData[hour].dry / uniqueDays;
    const avgTotal = hourlyData[hour].total / uniqueDays;
    
    // Calculate utilization per hour (what % of machines were used on average)
    const washCapacityPerHour = BUSINESS_PARAMS.TOTAL_WASHERS * 2; // 2 cycles per hour (30 min cycles)
    const dryCapacityPerHour = BUSINESS_PARAMS.TOTAL_DRYERS * (60 / 45); // 1.33 cycles per hour (45 min cycles)
    
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
  
  // Sort by total utilization
  const sorted = [...hourlyPatterns].sort((a, b) => b.totalUtilization - a.totalUtilization);
  
  // Top 5 hours are peak
  const peak = sorted.slice(0, 5).map(h => ({
    hour: h.hour,
    hourLabel: h.hourLabel,
    utilization: h.totalUtilization,
    avgServices: h.avgTotal,
    revenue: h.avgRevenue
  }));
  
  // Bottom 5 hours are off-peak
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
 */
export function calculateDayOfWeekPatterns(salesData) {
  const window = getCurrentWeekWindow();
  const dayData = {};
  const dayCounts = {};
  
  // Initialize days (0 = Sunday, 6 = Saturday)
  for (let day = 0; day < 7; day++) {
    dayData[day] = { wash: 0, dry: 0, total: 0, revenue: 0, transactions: 0 };
    dayCounts[day] = new Set();
  }
  
  salesData.forEach(row => {
    const date = parseBrDate(row.Data || row.Data_Hora || row.date || '');
    if (!date || date < window.start || date > window.end) return;
    
    const dayOfWeek = date.getDay();
    const machines = countMachines(row.Maquinas || row.machine || '');
    const netValue = parseBrNumber(row.Valor_Pago || row.net_value || 0);
    
    dayData[dayOfWeek].wash += machines.wash;
    dayData[dayOfWeek].dry += machines.dry;
    dayData[dayOfWeek].total += machines.total;
    dayData[dayOfWeek].revenue += netValue;
    dayData[dayOfWeek].transactions += 1;
    
    const dateStr = date.toISOString().split('T')[0];
    dayCounts[dayOfWeek].add(dateStr);
  });
  
  // Calculate averages and utilization
  const daysArray = [];
  const operatingHoursPerDay = BUSINESS_PARAMS.OPERATING_HOURS.end - BUSINESS_PARAMS.OPERATING_HOURS.start;
  
  for (let day = 0; day < 7; day++) {
    const uniqueDays = dayCounts[day].size || 1;
    const avgWash = dayData[day].wash / uniqueDays;
    const avgDry = dayData[day].dry / uniqueDays;
    const avgTotal = dayData[day].total / uniqueDays;
    
    // Daily capacity = machines * hours * cycles per hour
    const washCapacityPerDay = BUSINESS_PARAMS.TOTAL_WASHERS * operatingHoursPerDay * 2;
    const dryCapacityPerDay = BUSINESS_PARAMS.TOTAL_DRYERS * operatingHoursPerDay * (60 / 45);
    
    const washUtil = (avgWash / washCapacityPerDay) * 100;
    const dryUtil = (avgDry / dryCapacityPerDay) * 100;
    
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
      totalUtilization: Math.round(((washUtil + dryUtil) / 2) * 10) / 10,
      daysInSample: uniqueDays
    });
  }
  
  return daysArray;
}

/**
 * Calculate wash vs dry service comparison
 */
export function calculateWashVsDry(salesData) {
  const window = getCurrentWeekWindow();
  
  let washServices = 0;
  let dryServices = 0;
  let washRevenue = 0;
  let dryRevenue = 0;
  let transactions = 0;
  
  salesData.forEach(row => {
    const date = parseBrDate(row.Data || row.Data_Hora || row.date || '');
    if (!date || date < window.start || date > window.end) return;
    
    const machines = countMachines(row.Maquinas || row.machine || '');
    const netValue = parseBrNumber(row.Valor_Pago || row.net_value || 0);
    
    washServices += machines.wash;
    dryServices += machines.dry;
    
    // Proportional revenue attribution
    const totalMachines = machines.total;
    if (totalMachines > 0) {
      washRevenue += (machines.wash / totalMachines) * netValue;
      dryRevenue += (machines.dry / totalMachines) * netValue;
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
 * Note: This requires individual machine IDs in the data
 */
export function calculateMachinePerformance(salesData) {
  const window = getCurrentWeekWindow();
  const machines = {};
  
  salesData.forEach(row => {
    const date = parseBrDate(row.Data || row.Data_Hora || row.date || '');
    if (!date || date < window.start || date > window.end) return;
    
    const machineStr = row.Maquinas || row.machine || '';
    const netValue = parseBrNumber(row.Valor_Pago || row.net_value || 0);
    
    // Parse individual machines
    const machineList = String(machineStr).split(',').map(m => m.trim()).filter(m => m);
    const revenuePerMachine = machineList.length > 0 ? netValue / machineList.length : 0;
    
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
  
  // Convert to array and calculate additional metrics
  return Object.values(machines).map(m => ({
    ...m,
    avgRevenuePerUse: m.uses > 0 ? m.revenue / m.uses : 0
  })).sort((a, b) => b.uses - a.uses);
}

/**
 * Main function: Calculate all operations metrics
 */
export function calculateOperationsMetrics(salesData) {
  const hourlyPatterns = calculateHourlyPatterns(salesData);
  const peakHours = identifyPeakHours(hourlyPatterns);
  const dayPatterns = calculateDayOfWeekPatterns(salesData);
  const washVsDry = calculateWashVsDry(salesData);
  const machinePerformance = calculateMachinePerformance(salesData);
  
  return {
    hourlyPatterns,
    peakHours,
    dayPatterns,
    washVsDry,
    machinePerformance
  };
}
