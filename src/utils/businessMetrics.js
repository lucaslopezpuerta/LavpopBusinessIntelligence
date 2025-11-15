// BUSINESS METRICS V2.6 ENHANCEMENTS
// Add these functions and updates to your existing businessMetrics.js
//
// CHANGELOG:
// v2.6 (2025-11-15): Operations KPI v4.0 Support
//   - Added previous week window calculation
//   - Added peak/off-peak breakdown (10-12h, 14-15h, 18-19h)
//   - Added week-over-week trend calculations
//   - Enhanced exports for KPI cards

// ==================== ADD THESE CONSTANTS ====================

const PEAK_HOURS = [10, 11, 12, 14, 15, 18, 19]; // Based on heatmap analysis

// ==================== ADD THESE NEW FUNCTIONS ====================

/**
 * Get previous week window (Sunday to Saturday)
 * @returns {Object} { start: Date, end: Date }
 */
function getPreviousWeekWindow() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday
  
  // Last week's Sunday
  const lastSunday = new Date(today);
  lastSunday.setDate(today.getDate() - dayOfWeek - 7);
  lastSunday.setHours(0, 0, 0, 0);
  
  // Last week's Saturday
  const lastSaturday = new Date(lastSunday);
  lastSaturday.setDate(lastSunday.getDate() + 6);
  lastSaturday.setHours(23, 59, 59, 999);
  
  return { start: lastSunday, end: lastSaturday };
}

/**
 * Calculate peak vs off-peak utilization
 * @param {Array} salesData - Sales transactions
 * @param {string} machineType - 'wash', 'dry', or 'total'
 * @param {Object} window - { start: Date, end: Date }
 * @returns {Object} { peak: number, offPeak: number }
 */
function calculatePeakOffPeak(salesData, machineType, window) {
  let peakServices = 0;
  let offPeakServices = 0;
  const seenPeakHours = new Set();
  const seenOffPeakHours = new Set();
  
  salesData.forEach(row => {
    const dt = DataUtils.parseBrDate(row.DATA);
    if (!dt || dt < window.start || dt > window.end) return;
    
    const hour = dt.getHours();
    const isPeak = PEAK_HOURS.includes(hour);
    
    const machineInfo = DataUtils.countMachines(row.MAQUINA || '');
    let services = 0;
    
    if (machineType === 'wash') {
      services = machineInfo.wash;
    } else if (machineType === 'dry') {
      services = machineInfo.dry;
    } else {
      services = machineInfo.total;
    }
    
    if (isPeak) {
      peakServices += services;
      seenPeakHours.add(hour);
    } else {
      offPeakServices += services;
      seenOffPeakHours.add(hour);
    }
  });
  
  // Calculate capacity
  let machineCount, cyclesPerHour;
  if (machineType === 'wash') {
    machineCount = 3;
    cyclesPerHour = 2; // 30-minute cycle
  } else if (machineType === 'dry') {
    machineCount = 5;
    cyclesPerHour = 1.33; // 45-minute cycle
  } else {
    machineCount = 8;
    cyclesPerHour = 1.6; // Weighted average
  }
  
  // Peak: 7 hours/day * 7 days
  const peakCapacity = PEAK_HOURS.length * 7 * machineCount * cyclesPerHour;
  
  // Off-peak: 8 hours/day * 7 days (8, 9, 13, 16, 17, 20, 21, 22)
  const offPeakCapacity = 8 * 7 * machineCount * cyclesPerHour;
  
  return {
    peak: peakCapacity > 0 ? (peakServices / peakCapacity) * 100 : 0,
    offPeak: offPeakCapacity > 0 ? (offPeakServices / offPeakCapacity) * 100 : 0
  };
}

/**
 * Count services for a specific machine type and window
 * @param {Array} salesData - Sales transactions
 * @param {string} machineType - 'wash' or 'dry'
 * @param {Object} window - { start: Date, end: Date }
 * @returns {number} Total services
 */
function countServices(salesData, machineType, window) {
  let total = 0;
  
  salesData.forEach(row => {
    const dt = DataUtils.parseBrDate(row.DATA);
    if (!dt || dt < window.start || dt > window.end) return;
    
    const machineInfo = DataUtils.countMachines(row.MAQUINA || '');
    total += machineType === 'wash' ? machineInfo.wash : machineInfo.dry;
  });
  
  return total;
}

/**
 * Calculate utilization for a specific window
 * (This may already exist - if so, skip this function)
 * @param {Array} salesData - Sales transactions
 * @param {string} machineType - 'wash', 'dry', or 'total'
 * @param {Object} window - { start: Date, end: Date }
 * @returns {number} Utilization percentage
 */
function calculateUtilizationForWindow(salesData, machineType, window) {
  let totalServices = 0;
  const uniqueDays = new Set();
  
  salesData.forEach(row => {
    const dt = DataUtils.parseBrDate(row.DATA);
    if (!dt || dt < window.start || dt > window.end) return;
    
    const dateKey = dt.toISOString().split('T')[0];
    uniqueDays.add(dateKey);
    
    const machineInfo = DataUtils.countMachines(row.MAQUINA || '');
    
    if (machineType === 'wash') {
      totalServices += machineInfo.wash;
    } else if (machineType === 'dry') {
      totalServices += machineInfo.dry;
    } else {
      totalServices += machineInfo.total;
    }
  });
  
  const daysWithData = uniqueDays.size;
  if (daysWithData === 0) return 0;
  
  let machineCount, cyclesPerHour;
  if (machineType === 'wash') {
    machineCount = 3;
    cyclesPerHour = 2;
  } else if (machineType === 'dry') {
    machineCount = 5;
    cyclesPerHour = 1.33;
  } else {
    machineCount = 8;
    cyclesPerHour = 1.6;
  }
  
  const operatingHours = 15; // 8 AM to 11 PM
  const maxCapacity = machineCount * operatingHours * cyclesPerHour * daysWithData;
  
  return maxCapacity > 0 ? (totalServices / maxCapacity) * 100 : 0;
}

// ==================== UPDATE YOUR MAIN FUNCTION ====================

// Find your existing calculateBusinessMetrics function and add these sections:

export function calculateBusinessMetrics(salesData) {
  // ... your existing code ...
  
  // === ADD THIS SECTION: Calculate current week metrics ===
  const currentWindow = getCurrentWeekWindow(); // Your existing function
  
  const currentUtilization = {
    wash: calculateUtilizationForWindow(salesData, 'wash', currentWindow),
    dry: calculateUtilizationForWindow(salesData, 'dry', currentWindow),
    total: calculateUtilizationForWindow(salesData, 'total', currentWindow)
  };
  
  const currentServices = {
    wash: countServices(salesData, 'wash', currentWindow),
    dry: countServices(salesData, 'dry', currentWindow)
  };
  
  // === ADD THIS SECTION: Calculate previous week metrics ===
  const prevWindow = getPreviousWeekWindow();
  
  const previousWeek = {
    utilization: {
      wash: calculateUtilizationForWindow(salesData, 'wash', prevWindow),
      dry: calculateUtilizationForWindow(salesData, 'dry', prevWindow),
      total: calculateUtilizationForWindow(salesData, 'total', prevWindow)
    },
    services: {
      wash: countServices(salesData, 'wash', prevWindow),
      dry: countServices(salesData, 'dry', prevWindow)
    }
  };
  
  // === ADD THIS SECTION: Calculate peak/off-peak breakdown ===
  const peakOffPeak = {
    wash: calculatePeakOffPeak(salesData, 'wash', currentWindow),
    dry: calculatePeakOffPeak(salesData, 'dry', currentWindow),
    total: calculatePeakOffPeak(salesData, 'total', currentWindow)
  };
  
  // === ADD THIS SECTION: Calculate trends ===
  const trends = {
    wash: {
      percent: previousWeek.utilization.wash > 0 
        ? ((currentUtilization.wash - previousWeek.utilization.wash) / previousWeek.utilization.wash) * 100 
        : null,
      absolute: currentUtilization.wash - previousWeek.utilization.wash,
      services: currentServices.wash - previousWeek.services.wash
    },
    dry: {
      percent: previousWeek.utilization.dry > 0 
        ? ((currentUtilization.dry - previousWeek.utilization.dry) / previousWeek.utilization.dry) * 100 
        : null,
      absolute: currentUtilization.dry - previousWeek.utilization.dry,
      services: currentServices.dry - previousWeek.services.dry
    },
    total: {
      percent: previousWeek.utilization.total > 0 
        ? ((currentUtilization.total - previousWeek.utilization.total) / previousWeek.utilization.total) * 100 
        : null,
      absolute: currentUtilization.total - previousWeek.utilization.total,
      services: (currentServices.wash + currentServices.dry) - (previousWeek.services.wash + previousWeek.services.dry)
    }
  };
  
  // === UPDATE YOUR RETURN STATEMENT ===
  return {
    // ... your existing returns (utilization, services, revenue, etc.) ...
    
    // ADD THESE NEW EXPORTS:
    previousWeek,
    peakOffPeak,
    trends
  };
}

// ==================== USAGE EXAMPLE ====================

/*
// After these changes, your businessMetrics will export:

{
  // Existing exports
  utilization: { wash: 13, dry: 8, total: 10 },
  services: { wash: 72, dry: 49, total: 121 },
  revenue: { gross, net, cashback },
  
  // NEW: Previous week data
  previousWeek: {
    utilization: { wash: 10.6, dry: 7.2, total: 8.5 },
    services: { wash: 59, dry: 43 }
  },
  
  // NEW: Peak vs off-peak breakdown
  peakOffPeak: {
    wash: { peak: 18, offPeak: 10 },
    dry: { peak: 11, offPeak: 7 },
    total: { peak: 15, offPeak: 8 }
  },
  
  // NEW: Week-over-week trends
  trends: {
    wash: { percent: 22.6, absolute: 2.4, services: 13 },
    dry: { percent: 11.1, absolute: 0.8, services: 6 },
    total: { percent: 17.6, absolute: 1.5, services: 19 }
  }
}
*/
