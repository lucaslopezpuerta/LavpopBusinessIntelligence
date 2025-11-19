// intelligenceCalculations.js v2.0 - FIXED VERSION
// ✅ Uses existing transactionParser.js for consistent data handling
// ✅ Uses existing businessMetrics.js patterns
// ✅ Reuses proven math instead of reinventing
// Strategic business intelligence calculations
// Profitability, Weather Impact, Campaign ROI, Growth Analysis

import { parseSalesRecords, filterWithServices } from './transactionParser';
import { parseBrDate } from './dateUtils';

/**
 * Parse weather data CSV
 */
export function parseWeatherData(weatherData) {
  if (!weatherData || weatherData.length === 0) return [];
  
  return weatherData.map(row => {
    const precip = parseFloat(row['PRECIPITACAO TOTAL, DIARIO(mm)'] || row.precipitation || 0);
    
    return {
      date: new Date(row['Data Medicao'] || row.date),
      precipitation: precip,
      temperature: parseFloat(row['TEMPERATURA MEDIA COMPENSADA, DIARIA(°C)'] || row.temperature || 0),
      humidity: parseFloat(row['UMIDADE RELATIVA DO AR, MEDIA DIARIA(%)'] || row.humidity || 0),
      isRainy: precip > 5,
      isCloudy: precip > 0 && precip <= 5,
      isSunny: precip === 0
    };
  });
}

/**
 * Parse campaign data CSV
 */
export function parseCampaignData(campaignData) {
  if (!campaignData || campaignData.length === 0) return [];
  
  return campaignData.map(row => ({
    id: row['Campaign ID'] || row.id,
    code: (row['Coupon Code'] || row.code || '').toLowerCase().trim(),
    discountPercent: parseFloat(row['Discount Percentage'] || row.discount || 0),
    startDate: parseBrDate(row['Start Date'] || row.startDate),
    endDate: parseBrDate(row['End Date'] || row.endDate),
    maxCyclesPerCustomer: parseInt(row['Max Cycles per Customer'] || row.maxPerCustomer || 0),
    totalCyclesAvailable: parseInt(row['Total Cycles Available'] || row.totalAvailable || 0),
    creationDate: parseBrDate(row['Creation Date'] || row.createdAt)
  })).filter(c => c.startDate && c.endDate);
}

/**
 * Calculate profitability metrics
 * ✅ Uses existing transactionParser for data handling
 */
export function calculateProfitability(salesData, businessSettings, dateRange = null) {
  // ✅ Use existing proven parser
  const records = parseSalesRecords(salesData);
  let filteredRecords = records;
  
  // Apply date filter if provided
  if (dateRange) {
    filteredRecords = records.filter(r => 
      r.date >= dateRange.start && r.date <= dateRange.end
    );
  }
  
  // ✅ Use existing sum pattern from businessMetrics.js
  const sum = (arr, fn) => arr.reduce((s, x) => s + fn(x), 0);
  
  // Calculate totals (following businessMetrics.js pattern)
  const totalGrossRevenue = Math.round(sum(filteredRecords, r => r.grossValue) * 100) / 100;
  const totalNetRevenue = Math.round(sum(filteredRecords, r => r.netValue) * 100) / 100;
  const totalCashback = Math.round(sum(filteredRecords, r => r.cashbackAmount) * 100) / 100;
  
  // ✅ Use existing filterWithServices to exclude Recarga
  const serviceRecords = filterWithServices(filteredRecords);
  const totalServices = sum(serviceRecords, r => r.totalServices);
  
  // Calculate costs
  const daysInPeriod = dateRange 
    ? Math.ceil((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24)) + 1
    : 30;
  
  const monthlyFactor = daysInPeriod / 30;
  
  const fixedCosts = (
    businessSettings.rentCost +
    businessSettings.electricityCost +
    businessSettings.waterCost +
    businessSettings.internetCost +
    businessSettings.otherFixedCosts
  ) * monthlyFactor;
  
  const maintenanceCosts = businessSettings.maintenanceCostPerSession * 
    (daysInPeriod / businessSettings.maintenanceIntervalDays);
  
  const totalCosts = fixedCosts + maintenanceCosts;
  const netProfit = totalNetRevenue - totalCosts;
  const profitMargin = totalNetRevenue > 0 ? (netProfit / totalNetRevenue) * 100 : 0;
  
  // Calculate break-even
  const serviceAfterCashback = businessSettings.servicePrice * 
    (1 - businessSettings.cashbackPercent / 100);
  const breakEvenServices = Math.ceil(totalCosts / serviceAfterCashback);
  
  const isAboveBreakEven = totalServices >= breakEvenServices;
  const breakEvenBuffer = totalServices > 0 
    ? ((totalServices - breakEvenServices) / breakEvenServices) * 100 
    : -100;
  
  return {
    // Revenue
    totalRevenue: totalNetRevenue,
    totalCashback,
    grossRevenue: totalGrossRevenue,
    
    // Costs
    fixedCosts,
    maintenanceCosts,
    totalCosts,
    
    // Profitability
    netProfit,
    profitMargin,
    
    // Break-even
    breakEvenServices,
    actualServices: totalServices,
    isAboveBreakEven,
    breakEvenBuffer,
    
    // Period
    daysInPeriod,
    dailyAverage: totalNetRevenue / daysInPeriod
  };
}

/**
 * Calculate weather impact on business
 * ✅ Uses existing transactionParser for data handling
 */
export function calculateWeatherImpact(salesData, weatherData) {
  // ✅ Use existing proven parser
  const records = parseSalesRecords(salesData);
  const weather = parseWeatherData(weatherData);
  
  // Create date -> weather map
  const weatherMap = new Map();
  weather.forEach(w => {
    const dateKey = w.date.toISOString().split('T')[0];
    weatherMap.set(dateKey, w);
  });
  
  // Categorize sales by weather
  const salesByWeather = {
    sunny: [],
    cloudy: [],
    rainy: []
  };
  
  records.forEach(record => {
    const dateKey = record.date.toISOString().split('T')[0];
    const w = weatherMap.get(dateKey);
    
    if (w) {
      if (w.isSunny) salesByWeather.sunny.push(record);
      else if (w.isRainy) salesByWeather.rainy.push(record);
      else if (w.isCloudy) salesByWeather.cloudy.push(record);
    }
  });
  
  // Calculate averages (using businessMetrics.js pattern)
  const sum = (arr, fn) => arr.reduce((s, x) => s + fn(x), 0);
  
  const calculateAverage = (salesArray) => {
    if (salesArray.length === 0) return { revenue: 0, services: 0, days: 0 };
    
    // Group by date
    const dayMap = new Map();
    salesArray.forEach(record => {
      const dateKey = record.dateStr;
      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, { revenue: 0, services: 0 });
      }
      const day = dayMap.get(dateKey);
      day.revenue += record.netValue;
      if (!record.isRecarga) {
        day.services += record.totalServices;
      }
    });
    
    const days = dayMap.size;
    const totalRevenue = sum(Array.from(dayMap.values()), d => d.revenue);
    const totalServices = sum(Array.from(dayMap.values()), d => d.services);
    
    return {
      revenue: totalRevenue / days,
      services: totalServices / days,
      days
    };
  };
  
  const sunnyAvg = calculateAverage(salesByWeather.sunny);
  const cloudyAvg = calculateAverage(salesByWeather.cloudy);
  const rainyAvg = calculateAverage(salesByWeather.rainy);
  
  // Calculate impact percentages
  const rainyImpact = sunnyAvg.revenue > 0 
    ? ((rainyAvg.revenue - sunnyAvg.revenue) / sunnyAvg.revenue) * 100 
    : 0;
  
  const cloudyImpact = sunnyAvg.revenue > 0 
    ? ((cloudyAvg.revenue - sunnyAvg.revenue) / sunnyAvg.revenue) * 100 
    : 0;
  
  return {
    sunny: { ...sunnyAvg, label: 'Dias de Sol' },
    cloudy: { ...cloudyAvg, label: 'Dias Nublados', impact: cloudyImpact },
    rainy: { ...rainyAvg, label: 'Dias Chuvosos', impact: rainyImpact },
    
    // Summary
    worstCaseScenario: rainyAvg.revenue,
    bestCaseScenario: sunnyAvg.revenue,
    averageImpact: (rainyImpact + cloudyImpact) / 2
  };
}

/**
 * Calculate campaign effectiveness
 * ✅ Uses existing transactionParser for data handling
 */
export function calculateCampaignROI(salesData, campaignData) {
  // ✅ Use existing proven parser
  const records = parseSalesRecords(salesData);
  const campaigns = parseCampaignData(campaignData);
  
  const campaignPerformance = campaigns.map(campaign => {
    // Find sales using this coupon
    // Note: We need to check raw sales data for coupon codes
    // Since parseSalesRecords doesn't include coupon field, we need to cross-reference
    const campaignSales = [];
    
    salesData.forEach((rawRow, index) => {
      const coupon = (rawRow.Cupom || rawRow.coupon || '').toLowerCase().trim();
      if (coupon === campaign.code) {
        // Find matching parsed record by index
        if (records[index]) {
          const record = records[index];
          if (record.date >= campaign.startDate && record.date <= campaign.endDate) {
            campaignSales.push(record);
          }
        }
      }
    });
    
    const sum = (arr, fn) => arr.reduce((s, x) => s + fn(x), 0);
    
    const totalGrossRevenue = sum(campaignSales, r => r.grossValue);
    const totalDiscount = totalGrossRevenue * (campaign.discountPercent / 100);
    const netRevenue = sum(campaignSales, r => r.netValue);
    const redemptions = campaignSales.length;
    
    const redemptionRate = campaign.totalCyclesAvailable > 0 
      ? (redemptions / campaign.totalCyclesAvailable) * 100 
      : 0;
    
    const roi = totalDiscount > 0 
      ? ((netRevenue - totalDiscount) / totalDiscount) * 100 
      : 0;
    
    // Determine status
    let status = 'poor';
    if (redemptionRate >= 50 && roi > 100) status = 'excellent';
    else if (redemptionRate >= 30 && roi > 50) status = 'good';
    else if (redemptionRate >= 10 || roi > 0) status = 'fair';
    
    // Generate recommendation
    let recommendation = '';
    if (status === 'excellent') {
      recommendation = 'Renovar! Alta conversão e ROI positivo';
    } else if (status === 'good') {
      recommendation = 'Continuar monitorando. Bom desempenho';
    } else if (status === 'fair') {
      recommendation = 'Considere ajustar desconto ou público-alvo';
    } else {
      recommendation = 'CANCELAR. Desconto não está atraindo clientes';
    }
    
    return {
      ...campaign,
      redemptions,
      redemptionRate,
      totalRevenue: totalGrossRevenue,
      totalDiscount,
      netRevenue,
      roi,
      status,
      recommendation,
      isActive: new Date() >= campaign.startDate && new Date() <= campaign.endDate
    };
  });
  
  // Sort by ROI descending
  campaignPerformance.sort((a, b) => b.roi - a.roi);
  
  return {
    campaigns: campaignPerformance,
    totalCampaigns: campaigns.length,
    activeCampaigns: campaignPerformance.filter(c => c.isActive).length,
    bestPerforming: campaignPerformance[0],
    worstPerforming: campaignPerformance[campaignPerformance.length - 1]
  };
}

/**
 * Calculate month-over-month growth trends
 * ✅ Uses existing transactionParser for data handling
 */
export function calculateGrowthTrends(salesData) {
  // ✅ Use existing proven parser
  const records = parseSalesRecords(salesData);
  const sum = (arr, fn) => arr.reduce((s, x) => s + fn(x), 0);
  
  // Group by month
  const monthlyData = new Map();
  
  records.forEach(record => {
    const monthKey = `${record.date.getFullYear()}-${String(record.date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, {
        month: monthKey,
        revenue: 0,
        services: 0,
        customers: new Set()
      });
    }
    
    const month = monthlyData.get(monthKey);
    month.revenue += record.netValue;
    
    if (!record.isRecarga) {
      month.services += record.totalServices;
    }
  });
  
  // Convert to array and sort
  const monthlyArray = Array.from(monthlyData.values())
    .map(m => ({
      ...m,
      customerCount: m.customers.size
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
  
  // Calculate MoM growth
  const monthlyWithGrowth = monthlyArray.map((month, index) => {
    if (index === 0) {
      return { ...month, momGrowth: null, yoyGrowth: null };
    }
    
    const prevMonth = monthlyArray[index - 1];
    const momGrowth = prevMonth.revenue > 0 
      ? ((month.revenue - prevMonth.revenue) / prevMonth.revenue) * 100 
      : 0;
    
    // YoY growth (if data exists)
    const yearAgoIndex = index - 12;
    let yoyGrowth = null;
    if (yearAgoIndex >= 0) {
      const yearAgo = monthlyArray[yearAgoIndex];
      yoyGrowth = yearAgo.revenue > 0 
        ? ((month.revenue - yearAgo.revenue) / yearAgo.revenue) * 100 
        : 0;
    }
    
    return { ...month, momGrowth, yoyGrowth };
  });
  
  // Calculate average growth rate (last 6 months)
  const last6Months = monthlyWithGrowth.slice(-6);
  const avgGrowth = last6Months.length > 0
    ? last6Months.reduce((sum, m) => sum + (m.momGrowth || 0), 0) / last6Months.filter(m => m.momGrowth !== null).length
    : 0;
  
  // Identify trend
  const recentGrowth = last6Months.slice(-3).map(m => m.momGrowth || 0);
  const trend = recentGrowth.every(g => g > 0) ? 'increasing' : 
                recentGrowth.every(g => g < 0) ? 'decreasing' : 'stable';
  
  return {
    monthly: monthlyWithGrowth,
    avgGrowth,
    trend,
    bestMonth: monthlyWithGrowth.reduce((best, month) => 
      month.revenue > best.revenue ? month : best, monthlyWithGrowth[0]),
    worstMonth: monthlyWithGrowth.reduce((worst, month) => 
      month.revenue < worst.revenue ? month : worst, monthlyWithGrowth[0])
  };
}

/**
 * Get current month metrics
 * ✅ Uses existing transactionParser for data handling
 */
export function getCurrentMonthMetrics(salesData) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  
  // ✅ Use existing proven parser
  const records = parseSalesRecords(salesData);
  const currentMonthRecords = records.filter(r => 
    r.date >= startOfMonth && r.date <= endOfMonth
  );
  
  const sum = (arr, fn) => arr.reduce((s, x) => s + fn(x), 0);
  const revenue = Math.round(sum(currentMonthRecords, r => r.netValue) * 100) / 100;
  
  // ✅ Use existing filterWithServices
  const serviceRecords = filterWithServices(currentMonthRecords);
  const services = sum(serviceRecords, r => r.totalServices);
  
  return {
    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    revenue,
    services,
    daysElapsed: now.getDate(),
    dailyAverage: revenue / now.getDate()
  };
}

/**
 * Get previous month metrics
 * ✅ Uses existing transactionParser for data handling
 */
export function getPreviousMonthMetrics(salesData) {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
  const endOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0, 23, 59, 59);
  
  // ✅ Use existing proven parser
  const records = parseSalesRecords(salesData);
  const lastMonthRecords = records.filter(r => 
    r.date >= startOfMonth && r.date <= endOfMonth
  );
  
  const sum = (arr, fn) => arr.reduce((s, x) => s + fn(x), 0);
  const revenue = Math.round(sum(lastMonthRecords, r => r.netValue) * 100) / 100;
  
  // ✅ Use existing filterWithServices
  const serviceRecords = filterWithServices(lastMonthRecords);
  const services = sum(serviceRecords, r => r.totalServices);
  
  return {
    month: `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`,
    revenue,
    services
  };
}
