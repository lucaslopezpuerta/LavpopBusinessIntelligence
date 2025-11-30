// intelligenceCalculations.js v3.0 - AUDIT FIXES
// ✅ Uses existing transactionParser.js for consistent data handling
// ✅ Uses existing businessMetrics.js patterns
// ✅ Reuses proven math instead of reinventing
// Strategic business intelligence calculations
// Profitability, Weather Impact, Campaign ROI, Growth Analysis
//
// CHANGELOG:
// v3.0 (2025-11-30): Audit fixes
//   - Fixed avgGrowth to properly exclude null values
//   - Added date range filtering (90 days weather, 12 months growth, 6 months campaigns)
//   - Profitability uses calendar month by default
//   - Campaign ROI shows incremental ROI as primary metric
// v2.0: Initial refactor with Health Score

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
    averageImpact: (rainyImpact + cloudyImpact) / 2,

    // Context
    dataRangeDays: 90,
    totalDaysAnalyzed: sunnyAvg.days + cloudyAvg.days + rainyAvg.days
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

  // Calculate baseline average ticket from non-coupon transactions
  // This helps us understand what customers would pay without coupons
  const nonCouponRecords = [];
  const couponRecords = [];

  salesData.forEach((rawRow, index) => {
    const coupon = (rawRow.Codigo_Cupom || rawRow.coupon || '').toLowerCase().trim();
    if (records[index]) {
      if (coupon && coupon.length > 0) {
        couponRecords.push(records[index]);
      } else {
        nonCouponRecords.push(records[index]);
      }
    }
  });

  // Calculate baseline average ticket (what customers pay without coupons)
  const avgTicketBaseline = nonCouponRecords.length > 0
    ? sum(nonCouponRecords, r => r.grossValue) / nonCouponRecords.length
    : (businessSettings?.servicePrice || 25); // Fallback to default service price

  const campaignPerformance = campaigns.map(campaign => {
    // Find sales using this coupon
    const campaignSales = [];

    salesData.forEach((rawRow, index) => {
      const coupon = (rawRow.Codigo_Cupom || rawRow.coupon || '').toLowerCase().trim();
      if (coupon === campaign.code) {
        if (records[index]) {
          const record = records[index];
          if (record.date >= campaign.startDate && record.date <= campaign.endDate) {
            campaignSales.push(record);
          }
        }
      }
    });

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

    // ✅ IMPROVED: Status based on incremental ROI and redemption rate
    let status = 'poor';
    if (redemptionRate >= 40 && roi > 0) status = 'excellent';
    else if (redemptionRate >= 25 && roi > -50) status = 'good';
    else if (redemptionRate >= 10 || roi > -100) status = 'fair';

    // Generate recommendation based on analysis
    let recommendation = '';
    if (status === 'excellent') {
      recommendation = 'Renovar! Alta conversao e retorno positivo sobre o desconto.';
    } else if (status === 'good') {
      recommendation = 'Bom desempenho. Mantenha ativo e monitore.';
    } else if (status === 'fair') {
      if (redemptionRate < 15) {
        recommendation = 'Baixa adesao. Divulgue mais ou aumente o desconto.';
      } else if (roi < -50) {
        recommendation = 'Desconto muito alto para o retorno. Reduza o percentual.';
      } else {
        recommendation = 'Considere ajustar o percentual de desconto para otimizar retorno.';
      }
    } else {
      recommendation = 'Desempenho fraco. Avalie cancelar ou reformular a campanha.';
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
