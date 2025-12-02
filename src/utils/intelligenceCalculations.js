// intelligenceCalculations.js v3.1 - WEIGHTED PROJECTION
// ✅ Uses existing transactionParser.js for consistent data handling
// ✅ Uses existing businessMetrics.js patterns
// ✅ Reuses proven math instead of reinventing
// Strategic business intelligence calculations
// Profitability, Weather Impact, Campaign ROI, Growth Analysis
//
// CHANGELOG:
// v3.1 (2025-12-02): Weighted revenue projection
//   - Added calculateTemperatureCorrelation() for temp-revenue relationship
//   - Added calculateWeightedProjection() combining day-of-week + temperature
//   - More accurate projections for seasonal laundromat business
// v3.0 (2025-11-30): Audit fixes
//   - Fixed avgGrowth to properly exclude null values
//   - Added date range filtering (90 days weather, 12 months growth, 6 months campaigns)
//   - Profitability uses calendar month by default
//   - Campaign ROI shows incremental ROI as primary metric
// v2.0: Initial refactor with Health Score

import { parseSalesRecords, filterWithServices } from './transactionParser';
import { parseBrDate, formatDate } from './dateUtils';

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
 * ✅ FIXED: Uses calendar month by default for consistency with Quick Stats
 */
export function calculateProfitability(salesData, businessSettings, dateRange = null) {
  // ✅ Use existing proven parser
  const records = parseSalesRecords(salesData);
  let filteredRecords = records;

  // ✅ FIXED: Default to current calendar month (not rolling 30 days)
  let periodStart, periodEnd, daysInPeriod;

  if (dateRange) {
    // Custom date range provided
    periodStart = dateRange.start;
    periodEnd = dateRange.end;
    daysInPeriod = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24)) + 1;
    filteredRecords = records.filter(r =>
      r.date >= periodStart && r.date <= periodEnd
    );
  } else {
    // Default: Current calendar month
    const now = new Date();
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    daysInPeriod = now.getDate(); // Days elapsed in current month

    filteredRecords = records.filter(r =>
      r.date >= periodStart && r.date <= periodEnd
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

  // Calculate costs - prorate based on days in period
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

  // Calculate break-even using ACTUAL average price per service (not static config)
  // This accounts for different service types (wash, dry, combo) at different prices
  const serviceNetRevenue = sum(serviceRecords, r => r.netValue); // Revenue from services only (excl. Recarga)
  const actualAvgPricePerService = totalServices > 0
    ? serviceNetRevenue / totalServices
    : businessSettings.servicePrice * (1 - businessSettings.cashbackPercent / 100); // Fallback to config

  const breakEvenServices = actualAvgPricePerService > 0
    ? Math.ceil(totalCosts / actualAvgPricePerService)
    : 0;

  const isAboveBreakEven = totalServices >= breakEvenServices;
  const breakEvenBuffer = breakEvenServices > 0
    ? ((totalServices - breakEvenServices) / breakEvenServices) * 100
    : (totalServices > 0 ? 100 : -100); // If no break-even target but has services, 100% buffer

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
    actualAvgPricePerService, // Average revenue per service from actual data

    // Period context
    daysInPeriod,
    dailyAverage: totalNetRevenue / daysInPeriod,
    periodStart,
    periodEnd,
    isCurrentMonth: !dateRange
  };
}

/**
 * Calculate weather impact on business
 * ✅ Uses existing transactionParser for data handling
 * ✅ FILTER: Uses last 90 days for seasonal relevance
 */
export function calculateWeatherImpact(salesData, weatherData) {
  // ✅ Use existing proven parser
  const allRecords = parseSalesRecords(salesData);
  const weather = parseWeatherData(weatherData);

  // ✅ FILTER: Only use last 90 days for seasonal relevance
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const records = allRecords.filter(r => r.date >= ninetyDaysAgo);

  // Create date -> weather map using consistent local-timezone date keys
  const weatherMap = new Map();
  weather.forEach(w => {
    const dateKey = formatDate(w.date);
    weatherMap.set(dateKey, w);
  });

  // Categorize sales by weather
  const salesByWeather = {
    sunny: [],
    cloudy: [],
    rainy: []
  };

  records.forEach(record => {
    // Use record.dateStr for consistent local-timezone matching
    const dateKey = record.dateStr;
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

  // Minimum sample size for reliable comparison (at least 5 days of each type)
  const MIN_SAMPLE_DAYS = 5;
  const hasReliableData = sunnyAvg.days >= MIN_SAMPLE_DAYS;
  const hasReliableRainyData = rainyAvg.days >= MIN_SAMPLE_DAYS;
  const hasReliableCloudyData = cloudyAvg.days >= MIN_SAMPLE_DAYS;

  // Calculate impact percentages (only if baseline is reliable)
  const rainyImpact = (hasReliableData && hasReliableRainyData && sunnyAvg.revenue > 0)
    ? ((rainyAvg.revenue - sunnyAvg.revenue) / sunnyAvg.revenue) * 100
    : null; // null indicates insufficient data

  const cloudyImpact = (hasReliableData && hasReliableCloudyData && sunnyAvg.revenue > 0)
    ? ((cloudyAvg.revenue - sunnyAvg.revenue) / sunnyAvg.revenue) * 100
    : null;

  // Calculate average impact only from valid comparisons
  const validImpacts = [rainyImpact, cloudyImpact].filter(i => i !== null);
  const averageImpact = validImpacts.length > 0
    ? validImpacts.reduce((a, b) => a + b, 0) / validImpacts.length
    : null;

  return {
    sunny: { ...sunnyAvg, label: 'Dias de Sol' },
    cloudy: { ...cloudyAvg, label: 'Dias Nublados', impact: cloudyImpact },
    rainy: { ...rainyAvg, label: 'Dias Chuvosos', impact: rainyImpact },

    // Summary
    worstCaseScenario: rainyAvg.revenue,
    bestCaseScenario: sunnyAvg.revenue,
    averageImpact,

    // Context & reliability
    dataRangeDays: 90,
    totalDaysAnalyzed: sunnyAvg.days + cloudyAvg.days + rainyAvg.days,
    hasReliableData,
    hasReliableRainyData,
    hasReliableCloudyData,
    minSampleDays: MIN_SAMPLE_DAYS,
    warning: !hasReliableData
      ? `Dados insuficientes: menos de ${MIN_SAMPLE_DAYS} dias de sol para comparacao`
      : (!hasReliableRainyData && !hasReliableCloudyData)
        ? `Dados insuficientes: menos de ${MIN_SAMPLE_DAYS} dias de chuva/nublado para comparacao`
        : null
  };
}

/**
 * Calculate campaign effectiveness
 * ✅ Uses existing transactionParser for data handling
 * ✅ FIXED: Now calculates true incremental ROI
 * ✅ FILTER: Only shows active + last 6 months campaigns
 * ✅ IMPROVED: Incremental ROI is now the primary metric
 */
export function calculateCampaignROI(salesData, campaignData, businessSettings = null) {
  // ✅ Use existing proven parser
  const records = parseSalesRecords(salesData);
  const allCampaigns = parseCampaignData(campaignData);

  // ✅ FILTER: Only show active campaigns + those ended within last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const now = new Date();

  const campaigns = allCampaigns.filter(c => {
    const isActive = now >= c.startDate && now <= c.endDate;
    const endedRecently = c.endDate >= sixMonthsAgo;
    return isActive || endedRecently;
  });

  const sum = (arr, fn) => arr.reduce((s, x) => s + fn(x), 0);

  // ✅ FIXED: Parse records with coupon info together instead of relying on index matching
  // Create enriched records with coupon data attached during parsing
  const enrichedRecords = [];
  salesData.forEach((rawRow) => {
    const coupon = (rawRow.Codigo_Cupom || rawRow.coupon || '').toLowerCase().trim();
    const date = parseBrDate(rawRow.Data || rawRow.Data_Hora || rawRow.date || '');
    if (!date) return; // Skip invalid records (same as parseSalesRecords)

    // Parse this individual row to get the record data
    const grossValue = parseFloat(String(rawRow.Valor_Venda || rawRow.gross_value || 0).replace(',', '.')) || 0;
    const netValue = parseFloat(String(rawRow.Valor_Pago || rawRow.net_value || 0).replace(',', '.')) || 0;

    enrichedRecords.push({
      date,
      coupon,
      grossValue,
      netValue,
      hasCoupon: coupon.length > 0
    });
  });

  // Calculate baseline average ticket from non-coupon transactions
  const nonCouponRecords = enrichedRecords.filter(r => !r.hasCoupon);
  const couponRecords = enrichedRecords.filter(r => r.hasCoupon);

  // Calculate baseline average ticket (what customers pay without coupons)
  const avgTicketBaseline = nonCouponRecords.length > 0
    ? sum(nonCouponRecords, r => r.grossValue) / nonCouponRecords.length
    : (businessSettings?.servicePrice || 25); // Fallback to default service price

  const campaignPerformance = campaigns.map(campaign => {
    // ✅ FIXED: Use enrichedRecords with pre-attached coupon data
    // No more index-based assumptions that could break if records are filtered
    const campaignSales = enrichedRecords.filter(record =>
      record.coupon === campaign.code &&
      record.date >= campaign.startDate &&
      record.date <= campaign.endDate
    );

    const totalGrossRevenue = sum(campaignSales, r => r.grossValue);
    const totalDiscount = totalGrossRevenue * (campaign.discountPercent / 100);
    const netRevenue = sum(campaignSales, r => r.netValue);
    const redemptions = campaignSales.length;

    const redemptionRate = campaign.totalCyclesAvailable > 0
      ? (redemptions / campaign.totalCyclesAvailable) * 100
      : 0;

    // ✅ FIXED ROI Calculation
    // True ROI = (Incremental Revenue - Discount Cost) / Discount Cost
    // Incremental Revenue = Actual Revenue - What they would have paid anyway
    const baselineRevenue = avgTicketBaseline * redemptions;
    const incrementalRevenue = netRevenue - baselineRevenue;

    // Standard ROI (kept for reference but NOT primary)
    const standardROI = totalDiscount > 0
      ? ((netRevenue - totalDiscount) / totalDiscount) * 100
      : 0;

    // ✅ TRUE incremental ROI (PRIMARY metric)
    const roi = totalDiscount > 0
      ? (incrementalRevenue / totalDiscount) * 100
      : 0;

    // Cost per acquisition
    const costPerRedemption = redemptions > 0 ? totalDiscount / redemptions : 0;

    // ✅ IMPROVED: Status with STRICTER ROI requirements
    // ROI is now a hard gatekeeper - significant losses cannot be rated "good" or higher
    let status = 'poor';
    if (roi < -50) {
      // Significant loss - always poor, regardless of redemption
      status = 'poor';
    } else if (redemptionRate >= 40 && roi > 0) {
      status = 'excellent';
    } else if (redemptionRate >= 25 && roi > -25) {
      status = 'good';
    } else if (redemptionRate >= 10 && roi > -50) {
      status = 'fair';
    }
    // Otherwise remains 'poor'

    // Generate recommendation based on analysis
    let recommendation = '';
    if (status === 'excellent') {
      recommendation = 'Renovar! Alta conversao e retorno positivo sobre o desconto.';
    } else if (status === 'good') {
      recommendation = 'Bom desempenho. Mantenha ativo e monitore.';
    } else if (status === 'fair') {
      if (redemptionRate < 15) {
        recommendation = 'Baixa adesao. Divulgue mais ou aumente o desconto.';
      } else if (roi < -25) {
        recommendation = 'ROI negativo. Reduza o percentual de desconto.';
      } else {
        recommendation = 'Considere ajustar o percentual de desconto para otimizar retorno.';
      }
    } else {
      // Poor status - give specific reason
      if (roi < -50) {
        recommendation = `Prejuizo significativo (ROI: ${roi.toFixed(0)}%). Cancele ou reduza drasticamente o desconto.`;
      } else if (redemptionRate < 10) {
        recommendation = 'Adesao muito baixa. Melhore a divulgacao ou reconsidere a campanha.';
      } else {
        recommendation = 'Desempenho fraco. Avalie cancelar ou reformular a campanha.';
      }
    }

    return {
      ...campaign,
      redemptions,
      redemptionRate,
      totalRevenue: totalGrossRevenue,
      totalDiscount,
      netRevenue,
      roi, // Now this IS incremental ROI
      standardROI, // Keep old ROI for reference
      incrementalRevenue,
      baselineRevenue,
      costPerRedemption,
      avgTicketBaseline,
      status,
      recommendation,
      isActive: now >= campaign.startDate && now <= campaign.endDate
    };
  });

  // Sort by incremental ROI descending
  campaignPerformance.sort((a, b) => b.roi - a.roi);

  // Calculate summary metrics
  const totalRedemptions = sum(campaignPerformance, c => c.redemptions);
  const totalDiscountGiven = sum(campaignPerformance, c => c.totalDiscount);
  const totalRevenueGenerated = sum(campaignPerformance, c => c.totalRevenue);
  const totalIncrementalRevenue = sum(campaignPerformance, c => c.incrementalRevenue);

  // ✅ Overall ROI is now incremental
  const overallROI = totalDiscountGiven > 0
    ? (totalIncrementalRevenue / totalDiscountGiven) * 100
    : 0;

  return {
    campaigns: campaignPerformance,
    totalCampaigns: campaigns.length,
    activeCampaigns: campaignPerformance.filter(c => c.isActive).length,
    bestPerforming: campaignPerformance[0] || null,
    worstPerforming: campaignPerformance[campaignPerformance.length - 1] || null,
    // Summary metrics
    summary: {
      totalRedemptions,
      totalDiscountGiven,
      totalRevenueGenerated,
      totalIncrementalRevenue,
      overallROI, // Now incremental ROI
      avgRedemptionRate: campaignPerformance.length > 0
        ? sum(campaignPerformance, c => c.redemptionRate) / campaignPerformance.length
        : 0,
    },
    // Context
    dataRangeMonths: 6,
    totalCampaignsInSystem: allCampaigns.length,
    filteredOutCampaigns: allCampaigns.length - campaigns.length
  };
}

/**
 * Calculate month-over-month growth trends
 * ✅ Uses existing transactionParser for data handling
 * ✅ FIXED: avgGrowth now properly excludes null values
 * ✅ Returns last 12 months for display relevance
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
  const allMonthlyArray = Array.from(monthlyData.values())
    .map(m => ({
      ...m,
      customerCount: m.customers.size
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Calculate MoM growth for ALL months (needed for accurate avgGrowth)
  const allMonthlyWithGrowth = allMonthlyArray.map((month, index) => {
    if (index === 0) {
      return { ...month, momGrowth: null, yoyGrowth: null };
    }

    const prevMonth = allMonthlyArray[index - 1];
    const momGrowth = prevMonth.revenue > 0
      ? ((month.revenue - prevMonth.revenue) / prevMonth.revenue) * 100
      : 0;

    // YoY growth (if data exists)
    const yearAgoIndex = index - 12;
    let yoyGrowth = null;
    if (yearAgoIndex >= 0) {
      const yearAgo = allMonthlyArray[yearAgoIndex];
      yoyGrowth = yearAgo.revenue > 0
        ? ((month.revenue - yearAgo.revenue) / yearAgo.revenue) * 100
        : 0;
    }

    return { ...month, momGrowth, yoyGrowth };
  });

  // ✅ FILTER: Only return last 12 months for display
  const monthlyWithGrowth = allMonthlyWithGrowth.slice(-12);

  // ✅ FIXED: Calculate average growth rate properly excluding nulls
  const last6Months = allMonthlyWithGrowth.slice(-6);
  const validGrowthMonths = last6Months.filter(m => m.momGrowth !== null);
  const avgGrowth = validGrowthMonths.length > 0
    ? validGrowthMonths.reduce((s, m) => s + m.momGrowth, 0) / validGrowthMonths.length
    : 0;

  // Identify trend (only from months with valid growth data)
  const recentValidGrowth = last6Months.slice(-3).filter(m => m.momGrowth !== null);
  const trend = recentValidGrowth.length >= 2
    ? (recentValidGrowth.every(m => m.momGrowth > 0) ? 'increasing' :
       recentValidGrowth.every(m => m.momGrowth < 0) ? 'decreasing' : 'stable')
    : 'stable';

  // Best/worst from displayed 12 months only
  const bestMonth = monthlyWithGrowth.length > 0
    ? monthlyWithGrowth.reduce((best, month) => month.revenue > best.revenue ? month : best, monthlyWithGrowth[0])
    : null;
  const worstMonth = monthlyWithGrowth.length > 0
    ? monthlyWithGrowth.reduce((worst, month) => month.revenue < worst.revenue ? month : worst, monthlyWithGrowth[0])
    : null;

  return {
    monthly: monthlyWithGrowth,
    avgGrowth,
    trend,
    bestMonth,
    worstMonth,
    // Additional context
    totalMonthsAnalyzed: allMonthlyWithGrowth.length,
    displayedMonths: monthlyWithGrowth.length
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

/**
 * Calculate Business Health Score
 * A composite score (0-10) that summarizes overall business health
 * ✅ Combines profitability, growth, and operational metrics
 *
 * @param {object} profitability - Profitability calculation results
 * @param {object} growthTrends - Growth trends calculation results
 * @param {object} currentMonth - Current month metrics
 * @param {object} previousMonth - Previous month metrics
 * @returns {object} Health score data
 */
export function calculateHealthScore(profitability, growthTrends, currentMonth, previousMonth) {
  const scores = {
    profitability: 0,
    growth: 0,
    breakEven: 0,
    momentum: 0,
  };

  const weights = {
    profitability: 0.35,
    growth: 0.25,
    breakEven: 0.25,
    momentum: 0.15,
  };

  // 1. Profitability Score (0-10)
  // Based on profit margin: 0% = 0, 10% = 5, 20%+ = 10
  if (profitability?.profitMargin !== undefined) {
    const margin = profitability.profitMargin;
    if (margin <= 0) {
      scores.profitability = Math.max(0, 2 + (margin / 10)); // Negative margins still get some score
    } else if (margin < 10) {
      scores.profitability = 2 + (margin / 10) * 5; // 0-10% margin = 2-7 score
    } else {
      scores.profitability = Math.min(10, 7 + (margin - 10) / 10 * 3); // 10-20%+ margin = 7-10 score
    }
  }

  // 2. Growth Score (0-10)
  // Based on average monthly growth: -10% = 0, 0% = 5, 10%+ = 10
  if (growthTrends?.avgGrowth !== undefined) {
    const growth = growthTrends.avgGrowth;
    if (growth <= -10) {
      scores.growth = 0;
    } else if (growth < 0) {
      scores.growth = 5 + (growth / 10) * 5; // -10% to 0% = 0-5 score
    } else if (growth < 10) {
      scores.growth = 5 + (growth / 10) * 3; // 0-10% = 5-8 score
    } else {
      scores.growth = Math.min(10, 8 + (growth - 10) / 10 * 2); // 10%+ = 8-10 score
    }
  }

  // 3. Break-even Score (0-10)
  // Based on buffer above break-even: -20% = 0, 0% = 5, 20%+ = 10
  if (profitability?.breakEvenBuffer !== undefined) {
    const buffer = profitability.breakEvenBuffer;
    if (buffer < -20) {
      scores.breakEven = 0;
    } else if (buffer < 0) {
      scores.breakEven = 2.5 + (buffer / 20) * 2.5; // -20% to 0% = 0-2.5 score
    } else if (buffer < 20) {
      scores.breakEven = 5 + (buffer / 20) * 3; // 0-20% = 5-8 score
    } else {
      scores.breakEven = Math.min(10, 8 + (buffer - 20) / 20 * 2); // 20%+ = 8-10 score
    }
  }

  // 4. Momentum Score (0-10)
  // Based on month-over-month change (current vs previous)
  if (currentMonth?.revenue && previousMonth?.revenue && previousMonth.revenue > 0) {
    const momChange = ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100;
    if (momChange <= -20) {
      scores.momentum = 0;
    } else if (momChange < 0) {
      scores.momentum = 5 + (momChange / 20) * 5;
    } else if (momChange < 20) {
      scores.momentum = 5 + (momChange / 20) * 3;
    } else {
      scores.momentum = Math.min(10, 8 + (momChange - 20) / 20 * 2);
    }
  } else {
    scores.momentum = 5; // Neutral if no comparison data
  }

  // Calculate weighted total
  const totalScore =
    scores.profitability * weights.profitability +
    scores.growth * weights.growth +
    scores.breakEven * weights.breakEven +
    scores.momentum * weights.momentum;

  // Round to 1 decimal
  const finalScore = Math.round(totalScore * 10) / 10;

  // Determine status and color
  let status, color, description;
  if (finalScore >= 8) {
    status = 'excellent';
    color = 'emerald';
    description = 'Saude excelente! Seu negocio esta crescendo e lucrativo.';
  } else if (finalScore >= 6) {
    status = 'good';
    color = 'blue';
    description = 'Boa saude. Negocio estavel com espaco para melhorar.';
  } else if (finalScore >= 4) {
    status = 'attention';
    color = 'amber';
    description = 'Atencao necessaria. Alguns indicadores precisam de melhoria.';
  } else {
    status = 'critical';
    color = 'red';
    description = 'Situacao critica. Acao imediata recomendada.';
  }

  // Generate improvement suggestions
  const suggestions = [];
  if (scores.profitability < 5) {
    suggestions.push({
      area: 'Rentabilidade',
      message: 'Revise custos fixos ou aumente precos para melhorar margem.',
      priority: 'high',
    });
  }
  if (scores.growth < 5) {
    suggestions.push({
      area: 'Crescimento',
      message: 'Invista em marketing ou campanhas para atrair novos clientes.',
      priority: scores.growth < 3 ? 'high' : 'medium',
    });
  }
  if (scores.breakEven < 5) {
    suggestions.push({
      area: 'Break-even',
      message: 'Aumente o volume de servicos ou reduza custos operacionais.',
      priority: 'high',
    });
  }
  if (scores.momentum < 5) {
    suggestions.push({
      area: 'Momentum',
      message: 'Receita em queda. Considere promocoes ou fidelizacao.',
      priority: 'medium',
    });
  }

  return {
    score: finalScore,
    maxScore: 10,
    status,
    color,
    description,
    breakdown: scores,
    weights,
    suggestions: suggestions.sort((a, b) =>
      a.priority === 'high' ? -1 : b.priority === 'high' ? 1 : 0
    ),
  };
}

/**
 * Calculate revenue forecast for end of month
 * @param {object} currentMonth - Current month metrics
 * @returns {object} Forecast data
 */
export function calculateRevenueForecast(currentMonth) {
  if (!currentMonth || !currentMonth.daysElapsed || currentMonth.daysElapsed === 0) {
    return null;
  }

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - currentMonth.daysElapsed;
  const dailyAverage = currentMonth.revenue / currentMonth.daysElapsed;

  // Project end-of-month revenue
  const projectedRevenue = currentMonth.revenue + (dailyAverage * daysRemaining);

  // Calculate confidence based on data points
  let confidence, confidenceLevel;
  if (currentMonth.daysElapsed >= 20) {
    confidence = 90;
    confidenceLevel = 'high';
  } else if (currentMonth.daysElapsed >= 10) {
    confidence = 70;
    confidenceLevel = 'medium';
  } else {
    confidence = 50;
    confidenceLevel = 'low';
  }

  // Calculate projection range (based on variance)
  const variance = confidenceLevel === 'high' ? 0.05 : confidenceLevel === 'medium' ? 0.10 : 0.20;
  const projectedLow = projectedRevenue * (1 - variance);
  const projectedHigh = projectedRevenue * (1 + variance);

  return {
    projectedRevenue,
    projectedLow,
    projectedHigh,
    dailyAverage,
    daysElapsed: currentMonth.daysElapsed,
    daysRemaining,
    daysInMonth,
    monthProgress: (currentMonth.daysElapsed / daysInMonth) * 100,
    confidence,
    confidenceLevel,
  };
}

/**
 * Calculate temperature-revenue correlation from all historical data
 * Uses ALL available data to find: "X% revenue change per 1°C temperature change"
 *
 * @param {Array} salesData - Sales records
 * @param {Array} weatherData - Weather records with temperature
 * @returns {object} Correlation data
 */
export function calculateTemperatureCorrelation(salesData, weatherData) {
  const records = parseSalesRecords(salesData);
  const weather = parseWeatherData(weatherData);

  if (records.length === 0 || weather.length === 0) {
    return { correlation: 0, percentPerDegree: 0, hasEnoughData: false };
  }

  // Create date -> weather map
  const weatherMap = new Map();
  weather.forEach(w => {
    const dateKey = formatDate(w.date);
    weatherMap.set(dateKey, w);
  });

  // Group sales by date and join with temperature
  const dailyData = new Map();

  records.forEach(record => {
    const dateKey = record.dateStr;
    const w = weatherMap.get(dateKey);

    if (w && w.temperature > 0) { // Only include days with valid temperature
      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, { revenue: 0, temperature: w.temperature });
      }
      dailyData.get(dateKey).revenue += record.netValue;
    }
  });

  const dataPoints = Array.from(dailyData.values());

  if (dataPoints.length < 30) {
    return {
      correlation: 0,
      percentPerDegree: 0,
      hasEnoughData: false,
      daysAnalyzed: dataPoints.length,
      message: 'Menos de 30 dias com dados de temperatura'
    };
  }

  // Calculate means
  const n = dataPoints.length;
  const meanRevenue = dataPoints.reduce((s, d) => s + d.revenue, 0) / n;
  const meanTemp = dataPoints.reduce((s, d) => s + d.temperature, 0) / n;

  // Calculate Pearson correlation and regression slope
  let sumXY = 0, sumX2 = 0, sumY2 = 0;

  dataPoints.forEach(d => {
    const xDiff = d.temperature - meanTemp;
    const yDiff = d.revenue - meanRevenue;
    sumXY += xDiff * yDiff;
    sumX2 += xDiff * xDiff;
    sumY2 += yDiff * yDiff;
  });

  // Pearson correlation coefficient (-1 to 1)
  const correlation = sumX2 > 0 && sumY2 > 0
    ? sumXY / Math.sqrt(sumX2 * sumY2)
    : 0;

  // Regression slope: revenue change per 1°C
  const slope = sumX2 > 0 ? sumXY / sumX2 : 0;

  // Convert to percentage: X% change per 1°C
  const percentPerDegree = meanRevenue > 0
    ? (slope / meanRevenue) * 100
    : 0;

  // Temperature range in data
  const temps = dataPoints.map(d => d.temperature);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);

  return {
    correlation: Math.round(correlation * 100) / 100,
    percentPerDegree: Math.round(percentPerDegree * 100) / 100,
    slope: Math.round(slope * 100) / 100, // R$ per 1°C
    meanRevenue: Math.round(meanRevenue),
    meanTemperature: Math.round(meanTemp * 10) / 10,
    temperatureRange: { min: minTemp, max: maxTemp },
    daysAnalyzed: n,
    hasEnoughData: true,
    // Interpretation
    interpretation: correlation < -0.3
      ? 'Forte correlação negativa: dias frios = mais receita'
      : correlation < -0.1
        ? 'Correlação negativa moderada: frio tende a aumentar receita'
        : correlation > 0.1
          ? 'Correlação positiva: calor tende a aumentar receita'
          : 'Sem correlação significativa com temperatura'
  };
}

/**
 * Calculate weighted revenue projection combining:
 * 1. Day-of-week patterns (from current month)
 * 2. Temperature adjustment (from all historical data)
 *
 * @param {Array} salesData - Sales records
 * @param {Array} weatherData - Weather records
 * @param {object} currentMonth - Current month metrics
 * @returns {object} Weighted projection data
 */
export function calculateWeightedProjection(salesData, weatherData, currentMonth) {
  if (!currentMonth || !currentMonth.daysElapsed || currentMonth.daysElapsed === 0) {
    return null;
  }

  const records = parseSalesRecords(salesData);
  const weather = parseWeatherData(weatherData);
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - currentMonth.daysElapsed;

  // --- 1. Calculate day-of-week averages from current month ---
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthRecords = records.filter(r => r.date >= startOfMonth);

  // Group by day of week (0=Sunday, 6=Saturday)
  const dayOfWeekRevenue = Array(7).fill(null).map(() => ({ total: 0, days: 0 }));
  const dayMap = new Map();

  currentMonthRecords.forEach(record => {
    const dateKey = record.dateStr;
    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, { revenue: 0, dayOfWeek: record.date.getDay() });
    }
    dayMap.get(dateKey).revenue += record.netValue;
  });

  dayMap.forEach(day => {
    dayOfWeekRevenue[day.dayOfWeek].total += day.revenue;
    dayOfWeekRevenue[day.dayOfWeek].days += 1;
  });

  // Calculate averages per day of week
  const dayOfWeekAvg = dayOfWeekRevenue.map((d, i) => ({
    dayOfWeek: i,
    average: d.days > 0 ? d.total / d.days : 0,
    sampleDays: d.days
  }));

  // Fallback: if a day-of-week has no data, use overall daily average
  const overallDailyAvg = currentMonth.revenue / currentMonth.daysElapsed;
  dayOfWeekAvg.forEach(d => {
    if (d.average === 0) d.average = overallDailyAvg;
  });

  // --- 2. Calculate temperature correlation ---
  const tempCorr = calculateTemperatureCorrelation(salesData, weatherData);

  // --- 3. Calculate current month's average temperature ---
  const weatherMap = new Map();
  weather.forEach(w => {
    const dateKey = formatDate(w.date);
    weatherMap.set(dateKey, w);
  });

  let currentMonthTempSum = 0, currentMonthTempDays = 0;
  dayMap.forEach((_, dateKey) => {
    const w = weatherMap.get(dateKey);
    if (w && w.temperature > 0) {
      currentMonthTempSum += w.temperature;
      currentMonthTempDays++;
    }
  });

  const currentMonthAvgTemp = currentMonthTempDays > 0
    ? currentMonthTempSum / currentMonthTempDays
    : tempCorr.meanTemperature || 20;

  // --- 4. Project remaining days ---
  // For each remaining day, get its day-of-week and apply the average
  let dayOfWeekProjection = 0;
  const remainingDaysBreakdown = [];

  for (let i = 1; i <= daysRemaining; i++) {
    const futureDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const dow = futureDate.getDay();
    const dayAvg = dayOfWeekAvg[dow].average;
    dayOfWeekProjection += dayAvg;
    remainingDaysBreakdown.push({
      date: futureDate,
      dayOfWeek: dow,
      projected: dayAvg
    });
  }

  // Base projection (day-of-week weighted)
  const baseProjection = currentMonth.revenue + dayOfWeekProjection;

  // --- 5. Apply temperature adjustment ---
  // Assume remaining days have similar temp to current month average
  // Compare to historical mean to get adjustment
  let temperatureAdjustment = 1; // Default: no adjustment
  let tempAdjustmentPercent = 0;

  if (tempCorr.hasEnoughData && tempCorr.percentPerDegree !== 0) {
    // Temperature difference from historical mean
    const tempDiff = currentMonthAvgTemp - tempCorr.meanTemperature;
    // Apply correlation: if negative correlation (cold=more revenue)
    // and current month is colder than average, we boost projection
    tempAdjustmentPercent = tempDiff * tempCorr.percentPerDegree;
    temperatureAdjustment = 1 + (tempAdjustmentPercent / 100);
  }

  // Final weighted projection
  const weightedProjection = baseProjection * temperatureAdjustment;

  // Simple linear projection for comparison
  const linearProjection = currentMonth.revenue + (overallDailyAvg * daysRemaining);

  // Confidence level
  let confidence, confidenceLevel;
  if (currentMonth.daysElapsed >= 20 && tempCorr.hasEnoughData) {
    confidence = 85;
    confidenceLevel = 'high';
  } else if (currentMonth.daysElapsed >= 10) {
    confidence = 65;
    confidenceLevel = 'medium';
  } else {
    confidence = 45;
    confidenceLevel = 'low';
  }

  return {
    // Main projections
    weightedProjection: Math.round(weightedProjection),
    linearProjection: Math.round(linearProjection),
    projectionDifference: Math.round(weightedProjection - linearProjection),

    // Day-of-week breakdown
    dayOfWeekAverages: dayOfWeekAvg,
    dayOfWeekProjection: Math.round(dayOfWeekProjection),

    // Temperature factors
    temperatureCorrelation: tempCorr,
    currentMonthAvgTemp: Math.round(currentMonthAvgTemp * 10) / 10,
    temperatureAdjustment: Math.round((temperatureAdjustment - 1) * 1000) / 10, // As percentage
    tempAdjustmentPercent: Math.round(tempAdjustmentPercent * 10) / 10,

    // Context
    daysElapsed: currentMonth.daysElapsed,
    daysRemaining,
    daysInMonth,
    monthProgress: Math.round((currentMonth.daysElapsed / daysInMonth) * 100),
    confidence,
    confidenceLevel,

    // Methodology
    methodology: tempCorr.hasEnoughData
      ? 'Ponderado (dia da semana + temperatura)'
      : 'Ponderado (dia da semana)',
    hasTemperatureData: tempCorr.hasEnoughData
  };
}
