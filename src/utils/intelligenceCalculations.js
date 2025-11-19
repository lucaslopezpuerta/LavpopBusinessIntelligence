// intelligenceCalculations.js v1.0.0
// Strategic business intelligence calculations
// Profitability, Weather Impact, Campaign ROI, Growth Analysis
// Uses proven math from businessMetrics.js

import { parseSalesRecords, filterWithServices } from './transactionParser';
import { parseBrDate } from './dateUtils';

/**
 * Parse weather data CSV
 */
export function parseWeatherData(weatherData) {
  if (!weatherData || weatherData.length === 0) return [];
  
  return weatherData.map(row => ({
    date: new Date(row['Data Medicao'] || row.date),
    precipitation: parseFloat(row['PRECIPITACAO TOTAL, DIARIO(mm)'] || row.precipitation || 0),
    temperature: parseFloat(row['TEMPERATURA MEDIA COMPENSADA, DIARIA(°C)'] || row.temperature || 0),
    humidity: parseFloat(row['UMIDADE RELATIVA DO AR, MEDIA DIARIA(%)'] || row.humidity || 0),
    isRainy: parseFloat(row['PRECIPITACAO TOTAL, DIARIO(mm)'] || row.precipitation || 0) > 5,
    isCloudy: parseFloat(row['PRECIPITACAO TOTAL, DIARIO(mm)'] || row.precipitation || 0) > 0 && 
              parseFloat(row['PRECIPITACAO TOTAL, DIARIO(mm)'] || row.precipitation || 0) <= 5,
    isSunny: parseFloat(row['PRECIPITACAO TOTAL, DIARIO(mm)'] || row.precipitation || 0) === 0
  }));
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
 */
export function calculateProfitability(salesData, businessSettings, dateRange = null) {
  const records = parseSalesRecords(salesData);
  let filteredRecords = records;
  
  // Apply date filter if provided
  if (dateRange) {
    filteredRecords = records.filter(r => 
      r.date >= dateRange.start && r.date <= dateRange.end
    );
  }
  
  // Calculate totals
  const totalRevenue = filteredRecords.reduce((sum, r) => sum + r.netRevenue, 0);
  const totalCashback = filteredRecords.reduce((sum, r) => sum + r.cashbackAmount, 0);
  const totalServices = filterWithServices(filteredRecords).length;
  
  // Calculate costs
  const daysInPeriod = dateRange 
    ? Math.ceil((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24))
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
  const netProfit = totalRevenue - totalCosts;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  
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
    totalRevenue,
    totalCashback,
    grossRevenue: totalRevenue + totalCashback,
    
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
    dailyAverage: totalRevenue / daysInPeriod
  };
}

/**
 * Calculate weather impact on business
 */
export function calculateWeatherImpact(salesData, weatherData) {
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
  
  // Calculate averages
  const calculateAverage = (salesArray) => {
    if (salesArray.length === 0) return { revenue: 0, services: 0, days: 0 };
    
    // Group by date
    const dayMap = new Map();
    salesArray.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, { revenue: 0, services: 0 });
      }
      const day = dayMap.get(dateKey);
      day.revenue += record.netRevenue;
      if (record.tipo !== 'Recarga') {
        day.services++;
      }
    });
    
    const days = dayMap.size;
    const totalRevenue = Array.from(dayMap.values()).reduce((sum, d) => sum + d.revenue, 0);
    const totalServices = Array.from(dayMap.values()).reduce((sum, d) => sum + d.services, 0);
    
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
 */
export function calculateCampaignROI(salesData, campaignData) {
  const records = parseSalesRecords(salesData);
  const campaigns = parseCampaignData(campaignData);
  
  const campaignPerformance = campaigns.map(campaign => {
    // Find sales using this coupon
    const campaignSales = records.filter(record => {
      const recordCoupon = (record.cupom || '').toLowerCase().trim();
      return recordCoupon === campaign.code &&
             record.date >= campaign.startDate &&
             record.date <= campaign.endDate;
    });
    
    const totalRevenue = campaignSales.reduce((sum, r) => sum + r.grossRevenue, 0);
    const totalDiscount = totalRevenue * (campaign.discountPercent / 100);
    const netRevenue = totalRevenue - totalDiscount;
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
      totalRevenue,
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
 */
export function calculateGrowthTrends(salesData) {
  const records = parseSalesRecords(salesData);
  
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
    month.revenue += record.netRevenue;
    
    if (record.tipo !== 'Recarga') {
      month.services++;
    }
    
    if (record.cpf) {
      month.customers.add(record.cpf);
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
 */
export function getCurrentMonthMetrics(salesData) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  
  const records = parseSalesRecords(salesData);
  const currentMonthRecords = records.filter(r => 
    r.date >= startOfMonth && r.date <= endOfMonth
  );
  
  const revenue = currentMonthRecords.reduce((sum, r) => sum + r.netRevenue, 0);
  const services = filterWithServices(currentMonthRecords).length;
  
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
 */
export function getPreviousMonthMetrics(salesData) {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
  const endOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0, 23, 59, 59);
  
  const records = parseSalesRecords(salesData);
  const lastMonthRecords = records.filter(r => 
    r.date >= startOfMonth && r.date <= endOfMonth
  );
  
  const revenue = lastMonthRecords.reduce((sum, r) => sum + r.netRevenue, 0);
  const services = filterWithServices(lastMonthRecords).length;
  
  return {
    month: `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`,
    revenue,
    services
  };
}
