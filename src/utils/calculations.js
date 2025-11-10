/**
 * Core Business Calculations
 * Ported from Calculate_Metrics.js
 */

import { parseBrDate, isWithinRange, daysBetween } from './dateUtils';
import { toNum, sum, avg } from './numberUtils';
import { normalizeDoc, countMachines } from './csvLoader';

/**
 * Calculate correlation between two arrays
 */
export const calculateCorrelation = (X, Y) => {
  if (!X || !Y || X.length < 2 || Y.length < 2 || X.length !== Y.length) return null;
  
  try {
    const n = X.length;
    const mX = sum(X) / n;
    const mY = sum(Y) / n;
    
    let num = 0, dX = 0, dY = 0;
    for (let i = 0; i < n; i++) {
      const dx = X[i] - mX;
      const dy = Y[i] - mY;
      num += dx * dy;
      dX += dx * dx;
      dY += dy * dy;
    }
    
    return dX && dY ? num / Math.sqrt(dX * dY) : null;
  } catch (e) {
    return null;
  }
};

/**
 * Brazilian heat index calculation
 */
export const calculateHeatIndex = (tempC, humidity) => {
  if (humidity < 40) return tempC;
  const vaporPressure = 6.11 * Math.exp((17.27 * tempC) / (tempC + 237.3)) * (humidity / 100);
  return tempC + 0.33 * (vaporPressure - 10);
};

/**
 * Process sales data with date filtering
 */
export const processSales = (salesData, dateRange = { start: null, end: null }) => {
  const { start, end } = dateRange;
  
  const filtered = salesData.filter(sale => {
    const date = parseBrDate(sale.Data_Hora);
    return isWithinRange(date, start, end);
  });
  
  const processed = filtered.map(sale => {
    const date = parseBrDate(sale.Data_Hora);
    const value = toNum(sale.Valor_Venda);
    const machines = countMachines(sale.Maquinas);
    const doc = normalizeDoc(sale.Doc_Cliente);
    
    return {
      ...sale,
      date,
      dateStr: sale.Data_Hora,
      value,
      machines,
      doc,
      dayOfWeek: date.getDay(),
      hour: date.getHours(),
      isWeekend: date.getDay() === 0 || date.getDay() === 6
    };
  });
  
  return processed;
};

/**
 * Calculate sales metrics
 */
export const calculateSalesMetrics = (sales) => {
  if (!sales || sales.length === 0) {
    return {
      totalRevenue: 0,
      totalTransactions: 0,
      avgTicket: 0,
      totalWash: 0,
      totalDry: 0,
      totalMachines: 0
    };
  }
  
  const totalRevenue = sum(sales, s => s.value);
  const totalTransactions = sales.length;
  const avgTicket = totalRevenue / totalTransactions;
  
  const machines = sales.map(s => s.machines);
  const totalWash = sum(machines, m => m.wash);
  const totalDry = sum(machines, m => m.dry);
  const totalMachines = totalWash + totalDry;
  
  return {
    totalRevenue,
    totalTransactions,
    avgTicket,
    totalWash,
    totalDry,
    totalMachines,
    washRevenue: sum(sales.filter(s => s.machines.wash > 0), s => s.value),
    dryRevenue: sum(sales.filter(s => s.machines.dry > 0), s => s.value)
  };
};

/**
 * Group sales by date
 */
export const groupSalesByDate = (sales) => {
  const grouped = {};
  
  sales.forEach(sale => {
    const dateKey = sale.date.toISOString().split('T')[0];
    if (!grouped[dateKey]) {
      grouped[dateKey] = {
        date: sale.date,
        dateKey,
        sales: [],
        revenue: 0,
        transactions: 0
      };
    }
    
    grouped[dateKey].sales.push(sale);
    grouped[dateKey].revenue += sale.value;
    grouped[dateKey].transactions++;
  });
  
  return Object.values(grouped).sort((a, b) => a.date - b.date);
};

/**
 * Group sales by hour
 */
export const groupSalesByHour = (sales) => {
  const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    revenue: 0,
    transactions: 0,
    avgTicket: 0
  }));
  
  sales.forEach(sale => {
    const hour = sale.hour;
    hourlyData[hour].revenue += sale.value;
    hourlyData[hour].transactions++;
  });
  
  hourlyData.forEach(h => {
    h.avgTicket = h.transactions > 0 ? h.revenue / h.transactions : 0;
  });
  
  return hourlyData;
};

/**
 * Group sales by day of week
 */
export const groupSalesByDayOfWeek = (sales) => {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  const weekData = Array.from({ length: 7 }, (_, day) => ({
    day,
    dayName: days[day],
    revenue: 0,
    transactions: 0,
    avgTicket: 0
  }));
  
  sales.forEach(sale => {
    const day = sale.dayOfWeek;
    weekData[day].revenue += sale.value;
    weekData[day].transactions++;
  });
  
  weekData.forEach(d => {
    d.avgTicket = d.transactions > 0 ? d.revenue / d.transactions : 0;
  });
  
  return weekData;
};

/**
 * Calculate customer lifetime metrics (ALL TIME data)
 */
export const calculateCustomerMetrics = (salesData, customerDoc) => {
  const customerSales = salesData
    .filter(s => normalizeDoc(s.Doc_Cliente) === normalizeDoc(customerDoc))
    .map(s => ({
      date: parseBrDate(s.Data_Hora),
      value: toNum(s.Valor_Venda),
      machines: countMachines(s.Maquinas)
    }))
    .sort((a, b) => a.date - b.date);
  
  if (customerSales.length === 0) {
    return {
      totalVisits: 0,
      totalSpent: 0,
      avgTicket: 0,
      firstVisit: null,
      lastVisit: null,
      daysSinceFirst: 0,
      daysSinceLast: 0,
      visitFrequency: 0
    };
  }
  
  const totalVisits = customerSales.length;
  const totalSpent = sum(customerSales, s => s.value);
  const avgTicket = totalSpent / totalVisits;
  
  const firstVisit = customerSales[0].date;
  const lastVisit = customerSales[customerSales.length - 1].date;
  const now = new Date();
  
  const daysSinceFirst = daysBetween(firstVisit, now);
  const daysSinceLast = daysBetween(lastVisit, now);
  
  // Calculate visit frequency (excluding same-day visits)
  let uniqueVisitDays = 1;
  for (let i = 1; i < customerSales.length; i++) {
    const prevDate = customerSales[i - 1].date.toISOString().split('T')[0];
    const currDate = customerSales[i].date.toISOString().split('T')[0];
    if (prevDate !== currDate) {
      uniqueVisitDays++;
    }
  }
  
  const visitFrequency = daysSinceFirst > 0 ? uniqueVisitDays / (daysSinceFirst / 7) : 0;
  
  return {
    totalVisits,
    totalSpent,
    avgTicket,
    firstVisit,
    lastVisit,
    daysSinceFirst,
    daysSinceLast,
    visitFrequency,
    uniqueVisitDays
  };
};

/**
 * Calculate risk score (exponential decay with RFM bonus)
 */
export const calculateRiskScore = (daysSinceLast, rfmSegment) => {
  // RFM bonus multipliers
  const rfmBonus = {
    'Champion': 0.5,
    'Loyal': 0.6,
    'Potential': 0.7,
    'New': 0.8,
    'Promising': 0.75,
    'Need Attention': 1.2,
    'At Risk': 1.5,
    'Cant Lose': 1.8,
    'Lost': 2.0
  };
  
  const multiplier = rfmBonus[rfmSegment] || 1.0;
  
  // Exponential decay: risk increases exponentially with days inactive
  const baseRisk = 1 - Math.exp(-daysSinceLast / 30);
  const adjustedRisk = Math.min(baseRisk * multiplier, 1.0);
  
  return Math.round(adjustedRisk * 100);
};

/**
 * Get risk level from score
 */
export const getRiskLevel = (riskScore) => {
  if (riskScore >= 80) return { level: 'high', label: 'Alto', color: '#dc2626' };
  if (riskScore >= 50) return { level: 'medium', label: 'Médio', color: '#f59e0b' };
  return { level: 'low', label: 'Baixo', color: '#10b981' };
};

/**
 * Calculate machine utilization
 */
export const calculateMachineUtilization = (sales, totalWashers = 3, totalDryers = 5) => {
  const totalHours = 24; // Operating hours per day
  const daysInPeriod = 30; // Default to 30 days
  
  const totalWashUses = sum(sales, s => s.machines.wash);
  const totalDryUses = sum(sales, s => s.machines.dry);
  
  const maxWashCapacity = totalWashers * totalHours * daysInPeriod;
  const maxDryCapacity = totalDryers * totalHours * daysInPeriod;
  
  const washUtilization = (totalWashUses / maxWashCapacity) * 100;
  const dryUtilization = (totalDryUses / maxDryCapacity) * 100;
  
  return {
    wash: {
      uses: totalWashUses,
      capacity: maxWashCapacity,
      utilization: washUtilization
    },
    dry: {
      uses: totalDryUses,
      capacity: maxDryCapacity,
      utilization: dryUtilization
    }
  };
};
