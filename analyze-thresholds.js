/**
 * Customer Threshold Analysis Script
 * Analyzes 14k+ transactions from Supabase to provide data-driven
 * recommendations for customer classification thresholds.
 *
 * Run: node analyze-thresholds.js
 */

import { config } from 'dotenv';
config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function fetchAllFromSupabase(table, select = '*', orderColumn = null) {
  const PAGE_SIZE = 1000;
  let allData = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    let url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}`;

    if (orderColumn) {
      url += `&order=${orderColumn}.asc`;
    }

    // Pagination via Range header
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Range': `${offset}-${offset + PAGE_SIZE - 1}`,
        'Prefer': 'count=exact'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    if (data && data.length > 0) {
      allData = allData.concat(data);
      offset += PAGE_SIZE;
      hasMore = data.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  return allData;
}

// Parse Brazilian date format
function parseBrDate(dateStr) {
  if (!dateStr) return null;

  // Handle ISO format
  if (dateStr.includes('T') || dateStr.includes('-')) {
    return new Date(dateStr);
  }

  // Handle DD/MM/YYYY HH:MM:SS format
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s*(\d{2})?:?(\d{2})?:?(\d{2})?/);
  if (match) {
    const [, day, month, year, hour = 0, min = 0, sec = 0] = match;
    return new Date(year, month - 1, day, hour, min, sec);
  }

  return null;
}

// Validate CPF (11 digits)
function isValidCpf(doc) {
  if (!doc) return false;
  const cleaned = doc.replace(/\D/g, '');
  return cleaned.length === 11;
}

async function main() {
  console.log('='.repeat(80));
  console.log('CUSTOMER THRESHOLD ANALYSIS - LAVPOP LAUNDROMAT');
  console.log('='.repeat(80));
  console.log('');

  // Fetch all transactions
  console.log('Fetching transactions from Supabase...');
  const transactions = await fetchAllFromSupabase(
    'transactions',
    'doc_cliente,data_hora,valor_venda',
    'data_hora'
  );

  console.log(`Total transactions fetched: ${transactions.length}`);
  console.log('');

  // Fetch customers with RFM segments
  console.log('Fetching customer segments...');
  const customers = await fetchAllFromSupabase(
    'customers',
    'doc,nome,rfm_segment'
  );
  console.log(`Total customers in DB: ${customers.length}`);

  // Build customer map
  const customerSegments = {};
  customers.forEach(c => {
    if (c.doc) customerSegments[c.doc] = c.rfm_segment || 'Unknown';
  });

  // ============================================
  // ANALYSIS 1: VISIT FREQUENCY DISTRIBUTION
  // ============================================
  console.log('');
  console.log('='.repeat(80));
  console.log('1. VISIT FREQUENCY DISTRIBUTION');
  console.log('='.repeat(80));

  // Group transactions by customer
  const customerVisits = {};
  const now = new Date();

  transactions.forEach(t => {
    const doc = t.doc_cliente;
    const date = parseBrDate(t.data_hora);

    if (!doc || !date || !isValidCpf(doc)) return;

    if (!customerVisits[doc]) {
      customerVisits[doc] = [];
    }
    customerVisits[doc].push(date);
  });

  // Sort visits and calculate intervals
  const validCustomers = Object.keys(customerVisits);
  console.log(`\nUnique customers with valid CPF: ${validCustomers.length}`);

  const visitCounts = [];
  const avgIntervals = [];
  const daysSinceLastVisit = [];

  validCustomers.forEach(doc => {
    const visits = customerVisits[doc].sort((a, b) => a - b);
    visitCounts.push(visits.length);

    // Calculate average interval (only for customers with 2+ visits)
    if (visits.length >= 2) {
      const intervals = [];
      for (let i = 1; i < visits.length; i++) {
        const days = Math.round((visits[i] - visits[i-1]) / (1000 * 60 * 60 * 24));
        if (days > 0 && days < 365) { // Exclude outliers
          intervals.push(days);
        }
      }
      if (intervals.length > 0) {
        const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        avgIntervals.push(avg);
      }
    }

    // Days since last visit
    const lastVisit = visits[visits.length - 1];
    const daysSince = Math.round((now - lastVisit) / (1000 * 60 * 60 * 24));
    daysSinceLastVisit.push({ doc, daysSince, visitCount: visits.length });
  });

  // Visit count distribution
  const visitCountDist = {
    '1 visit': visitCounts.filter(v => v === 1).length,
    '2-3 visits': visitCounts.filter(v => v >= 2 && v <= 3).length,
    '4-10 visits': visitCounts.filter(v => v >= 4 && v <= 10).length,
    '11-20 visits': visitCounts.filter(v => v >= 11 && v <= 20).length,
    '21+ visits': visitCounts.filter(v => v > 20).length,
  };

  console.log('\nVisit Count Distribution:');
  Object.entries(visitCountDist).forEach(([range, count]) => {
    const pct = ((count / validCustomers.length) * 100).toFixed(1);
    console.log(`  ${range.padEnd(15)} ${count.toString().padStart(5)} customers (${pct}%)`);
  });

  // Average interval distribution (for customers with 2+ visits)
  if (avgIntervals.length > 0) {
    const sortedIntervals = [...avgIntervals].sort((a, b) => a - b);
    const median = sortedIntervals[Math.floor(sortedIntervals.length / 2)];
    const mean = avgIntervals.reduce((a, b) => a + b, 0) / avgIntervals.length;
    const min = Math.min(...avgIntervals);
    const max = Math.max(...avgIntervals);

    console.log('\nAverage Days Between Visits (customers with 2+ visits):');
    console.log(`  Customers analyzed: ${avgIntervals.length}`);
    console.log(`  Median: ${median.toFixed(1)} days`);
    console.log(`  Mean: ${mean.toFixed(1)} days`);
    console.log(`  Range: ${min.toFixed(0)} - ${max.toFixed(0)} days`);

    // Distribution buckets
    const intervalDist = {
      'Weekly (1-7 days)': avgIntervals.filter(d => d >= 1 && d <= 7).length,
      'Bi-weekly (8-14 days)': avgIntervals.filter(d => d > 7 && d <= 14).length,
      '3 weeks (15-21 days)': avgIntervals.filter(d => d > 14 && d <= 21).length,
      'Monthly (22-35 days)': avgIntervals.filter(d => d > 21 && d <= 35).length,
      'Occasional (36-60 days)': avgIntervals.filter(d => d > 35 && d <= 60).length,
      'Rare (60+ days)': avgIntervals.filter(d => d > 60).length,
    };

    console.log('\nVisit Frequency Categories:');
    Object.entries(intervalDist).forEach(([range, count]) => {
      const pct = ((count / avgIntervals.length) * 100).toFixed(1);
      const bar = '█'.repeat(Math.round(pct / 2));
      console.log(`  ${range.padEnd(25)} ${count.toString().padStart(4)} (${pct.padStart(5)}%) ${bar}`);
    });
  }

  // ============================================
  // ANALYSIS 2: RETURN RATES & CHURN CLIFF
  // ============================================
  console.log('');
  console.log('='.repeat(80));
  console.log('2. RETURN RATES & CHURN CLIFF ANALYSIS');
  console.log('='.repeat(80));

  // For customers who had gaps, did they return?
  // We'll analyze: for each gap length, what % returned?
  const gapReturns = {};

  validCustomers.forEach(doc => {
    const visits = customerVisits[doc].sort((a, b) => a - b);

    for (let i = 1; i < visits.length; i++) {
      const gapDays = Math.round((visits[i] - visits[i-1]) / (1000 * 60 * 60 * 24));

      if (gapDays > 0 && gapDays <= 180) {
        // Bucket the gap
        const bucket = Math.floor(gapDays / 7) * 7; // Round to nearest week
        if (!gapReturns[bucket]) {
          gapReturns[bucket] = { returned: 0, total: 0 };
        }
        gapReturns[bucket].returned++;
        gapReturns[bucket].total++;
      }
    }
  });

  // For customers who HAVEN'T returned yet, count as "not returned"
  daysSinceLastVisit.forEach(({ daysSince }) => {
    if (daysSince >= 7 && daysSince <= 180) {
      const bucket = Math.floor(daysSince / 7) * 7;
      if (!gapReturns[bucket]) {
        gapReturns[bucket] = { returned: 0, total: 0 };
      }
      gapReturns[bucket].total++;
    }
  });

  console.log('\nReturn Rate by Gap Length:');
  console.log('(What % of customers who were away X days eventually returned?)');
  console.log('');

  const buckets = Object.keys(gapReturns).map(Number).sort((a, b) => a - b);
  let cumulativeNotReturned = 0;
  let cumulativeTotal = 0;

  buckets.forEach(bucket => {
    const { returned, total } = gapReturns[bucket];
    const returnRate = total > 0 ? ((returned / total) * 100).toFixed(1) : '0.0';
    cumulativeTotal += total;
    cumulativeNotReturned += (total - returned);

    if (bucket <= 84) { // Show up to 12 weeks
      const bar = '█'.repeat(Math.round(parseFloat(returnRate) / 5));
      console.log(`  ${bucket.toString().padStart(2)}-${(bucket+6).toString().padStart(2)} days: ${returnRate.padStart(5)}% return rate (n=${total}) ${bar}`);
    }
  });

  // Find the "churn cliff" - where return rate drops below 50%
  console.log('\n** CHURN CLIFF ANALYSIS **');
  let churnCliff = null;
  buckets.forEach(bucket => {
    const { returned, total } = gapReturns[bucket];
    const returnRate = total > 0 ? (returned / total) * 100 : 0;
    if (!churnCliff && returnRate < 50 && total >= 10) {
      churnCliff = bucket;
    }
  });

  if (churnCliff) {
    console.log(`  Return rate drops below 50% at: ${churnCliff} days`);
    console.log(`  RECOMMENDATION: Set LOST_THRESHOLD around ${churnCliff} days`);
  }

  // ============================================
  // ANALYSIS 3: NEW CUSTOMER BEHAVIOR
  // ============================================
  console.log('');
  console.log('='.repeat(80));
  console.log('3. NEW CUSTOMER BEHAVIOR (1-VISIT CUSTOMERS)');
  console.log('='.repeat(80));

  const oneVisitCustomers = daysSinceLastVisit.filter(c => c.visitCount === 1);
  const multiVisitCustomers = daysSinceLastVisit.filter(c => c.visitCount >= 2);

  console.log(`\nTotal 1-visit customers: ${oneVisitCustomers.length} (${((oneVisitCustomers.length / validCustomers.length) * 100).toFixed(1)}%)`);
  console.log(`Multi-visit customers: ${multiVisitCustomers.length} (${((multiVisitCustomers.length / validCustomers.length) * 100).toFixed(1)}%)`);

  // When did 1-visit customers visit?
  const oneVisitByRecency = {
    'Last 7 days': oneVisitCustomers.filter(c => c.daysSince <= 7).length,
    '8-14 days ago': oneVisitCustomers.filter(c => c.daysSince > 7 && c.daysSince <= 14).length,
    '15-30 days ago': oneVisitCustomers.filter(c => c.daysSince > 14 && c.daysSince <= 30).length,
    '31-60 days ago': oneVisitCustomers.filter(c => c.daysSince > 30 && c.daysSince <= 60).length,
    '60+ days ago': oneVisitCustomers.filter(c => c.daysSince > 60).length,
  };

  console.log('\n1-Visit Customers by Recency:');
  Object.entries(oneVisitByRecency).forEach(([range, count]) => {
    const pct = ((count / oneVisitCustomers.length) * 100).toFixed(1);
    console.log(`  ${range.padEnd(20)} ${count.toString().padStart(4)} (${pct}%)`);
  });

  // Of multi-visit customers, how quickly did they return for their 2nd visit?
  const secondVisitGaps = [];
  validCustomers.forEach(doc => {
    const visits = customerVisits[doc].sort((a, b) => a - b);
    if (visits.length >= 2) {
      const gap = Math.round((visits[1] - visits[0]) / (1000 * 60 * 60 * 24));
      if (gap > 0 && gap < 365) {
        secondVisitGaps.push(gap);
      }
    }
  });

  if (secondVisitGaps.length > 0) {
    const sorted = [...secondVisitGaps].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const mean = secondVisitGaps.reduce((a, b) => a + b, 0) / secondVisitGaps.length;

    console.log('\nTime to 2nd Visit (customers who returned):');
    console.log(`  Median: ${median} days`);
    console.log(`  Mean: ${mean.toFixed(1)} days`);

    const returnedWithin = {
      '7 days': secondVisitGaps.filter(d => d <= 7).length,
      '14 days': secondVisitGaps.filter(d => d <= 14).length,
      '21 days': secondVisitGaps.filter(d => d <= 21).length,
      '30 days': secondVisitGaps.filter(d => d <= 30).length,
      '45 days': secondVisitGaps.filter(d => d <= 45).length,
      '60 days': secondVisitGaps.filter(d => d <= 60).length,
    };

    console.log('\nCumulative Return Rate (of those who returned):');
    Object.entries(returnedWithin).forEach(([days, count]) => {
      const pct = ((count / secondVisitGaps.length) * 100).toFixed(1);
      console.log(`  Within ${days.padEnd(8)}: ${pct}%`);
    });
  }

  // ============================================
  // ANALYSIS 4: SEGMENT PERFORMANCE
  // ============================================
  console.log('');
  console.log('='.repeat(80));
  console.log('4. SEGMENT PERFORMANCE');
  console.log('='.repeat(80));

  const segmentStats = {};

  validCustomers.forEach(doc => {
    const segment = customerSegments[doc] || 'Unknown';
    const visits = customerVisits[doc];
    const visitCount = visits.length;

    if (!segmentStats[segment]) {
      segmentStats[segment] = {
        count: 0,
        totalVisits: 0,
        intervals: [],
        daysSinceLastVisit: [],
      };
    }

    segmentStats[segment].count++;
    segmentStats[segment].totalVisits += visitCount;

    // Average interval
    if (visitCount >= 2) {
      const sortedVisits = visits.sort((a, b) => a - b);
      const intervals = [];
      for (let i = 1; i < sortedVisits.length; i++) {
        const days = Math.round((sortedVisits[i] - sortedVisits[i-1]) / (1000 * 60 * 60 * 24));
        if (days > 0 && days < 365) intervals.push(days);
      }
      if (intervals.length > 0) {
        const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        segmentStats[segment].intervals.push(avg);
      }
    }

    // Days since last
    const lastVisit = visits[visits.length - 1];
    const daysSince = Math.round((now - lastVisit) / (1000 * 60 * 60 * 24));
    segmentStats[segment].daysSinceLastVisit.push(daysSince);
  });

  console.log('\nBy RFM Segment:');
  console.log('-'.repeat(85));
  console.log('Segment'.padEnd(12) + 'Count'.padStart(7) + 'Avg Visits'.padStart(12) + 'Avg Interval'.padStart(14) + 'Avg Days Since'.padStart(16) + '  Status');
  console.log('-'.repeat(85));

  const segmentOrder = ['VIP', 'Frequente', 'Promissor', 'Novato', 'Esfriando', 'Inativo', 'Unknown'];
  segmentOrder.forEach(segment => {
    const stats = segmentStats[segment];
    if (!stats) return;

    const avgVisits = (stats.totalVisits / stats.count).toFixed(1);
    const avgInterval = stats.intervals.length > 0
      ? (stats.intervals.reduce((a, b) => a + b, 0) / stats.intervals.length).toFixed(1)
      : 'N/A';
    const avgDaysSince = (stats.daysSinceLastVisit.reduce((a, b) => a + b, 0) / stats.count).toFixed(0);

    let status = '';
    if (avgInterval !== 'N/A') {
      const ratio = parseFloat(avgDaysSince) / parseFloat(avgInterval);
      if (ratio < 1.5) status = '✅ Healthy';
      else if (ratio < 2.5) status = '⚠️ At Risk';
      else status = '🔴 Churning';
    }

    console.log(
      segment.padEnd(12) +
      stats.count.toString().padStart(7) +
      avgVisits.padStart(12) +
      (avgInterval === 'N/A' ? avgInterval : avgInterval + ' days').padStart(14) +
      (avgDaysSince + ' days').padStart(16) +
      '  ' + status
    );
  });

  // ============================================
  // ANALYSIS 5: WIN-BACK ANALYSIS
  // ============================================
  console.log('');
  console.log('='.repeat(80));
  console.log('5. WIN-BACK ANALYSIS (Customers who came back after long gaps)');
  console.log('='.repeat(80));

  // Find customers who had gaps of 45+ days but came back
  const winbackCases = [];

  validCustomers.forEach(doc => {
    const visits = customerVisits[doc].sort((a, b) => a - b);

    for (let i = 1; i < visits.length; i++) {
      const gapDays = Math.round((visits[i] - visits[i-1]) / (1000 * 60 * 60 * 24));

      if (gapDays >= 45) {
        winbackCases.push({
          gap: gapDays,
          segment: customerSegments[doc] || 'Unknown',
          visitCount: visits.length,
        });
      }
    }
  });

  console.log(`\nCustomers who returned after 45+ day gaps: ${winbackCases.length}`);

  if (winbackCases.length > 0) {
    const winbackByGap = {
      '45-60 days': winbackCases.filter(c => c.gap >= 45 && c.gap < 60).length,
      '60-90 days': winbackCases.filter(c => c.gap >= 60 && c.gap < 90).length,
      '90-120 days': winbackCases.filter(c => c.gap >= 90 && c.gap < 120).length,
      '120+ days': winbackCases.filter(c => c.gap >= 120).length,
    };

    console.log('\nWin-back Cases by Gap Length:');
    Object.entries(winbackByGap).forEach(([range, count]) => {
      const pct = ((count / winbackCases.length) * 100).toFixed(1);
      console.log(`  ${range.padEnd(15)} ${count.toString().padStart(4)} (${pct}%)`);
    });

    // Win-back by segment
    const winbackBySegment = {};
    winbackCases.forEach(c => {
      winbackBySegment[c.segment] = (winbackBySegment[c.segment] || 0) + 1;
    });

    console.log('\nWin-back by Segment:');
    Object.entries(winbackBySegment)
      .sort((a, b) => b[1] - a[1])
      .forEach(([segment, count]) => {
        console.log(`  ${segment.padEnd(15)} ${count}`);
      });
  }

  // ============================================
  // FINAL RECOMMENDATIONS
  // ============================================
  console.log('');
  console.log('='.repeat(80));
  console.log('RECOMMENDATIONS BASED ON DATA');
  console.log('='.repeat(80));

  // Calculate key metrics
  const medianInterval = avgIntervals.length > 0
    ? [...avgIntervals].sort((a, b) => a - b)[Math.floor(avgIntervals.length / 2)]
    : 14;

  console.log('\n1. LOST_THRESHOLD');
  console.log(`   Current: 60 days`);
  if (churnCliff) {
    console.log(`   Data suggests: ${churnCliff} days (where return rate drops below 50%)`);
    console.log(`   Recommendation: ${Math.min(60, churnCliff + 7)} days`);
  }

  console.log('\n2. HEALTHY Threshold (DAY_THRESHOLDS.HEALTHY)');
  console.log(`   Current: 20 days`);
  console.log(`   Median visit interval: ${medianInterval.toFixed(0)} days`);
  console.log(`   Recommendation: ${Math.round(medianInterval * 1.5)} days (1.5x median)`);

  console.log('\n3. One-Visit Customer Classification');
  const oneVisitPct = ((oneVisitCustomers.length / validCustomers.length) * 100).toFixed(1);
  console.log(`   ${oneVisitPct}% of customers have only 1 visit`);
  console.log(`   Of these, ${((oneVisitByRecency['60+ days ago'] / oneVisitCustomers.length) * 100).toFixed(0)}% visited 60+ days ago (unlikely to return)`);
  console.log(`   Recommendation: Time-based likelihood for 1-visit customers`);

  console.log('\n4. Segment Bonuses');
  const vipStats = segmentStats['VIP'];
  const freqStats = segmentStats['Frequente'];
  if (vipStats && vipStats.intervals.length > 0) {
    const vipAvgInterval = vipStats.intervals.reduce((a, b) => a + b, 0) / vipStats.intervals.length;
    const vipAvgVisits = vipStats.totalVisits / vipStats.count;
    console.log(`   VIP: Avg ${vipAvgVisits.toFixed(1)} visits, ${vipAvgInterval.toFixed(0)} day interval`);
  }
  if (freqStats && freqStats.intervals.length > 0) {
    const freqAvgInterval = freqStats.intervals.reduce((a, b) => a + b, 0) / freqStats.intervals.length;
    const freqAvgVisits = freqStats.totalVisits / freqStats.count;
    console.log(`   Frequente: Avg ${freqAvgVisits.toFixed(1)} visits, ${freqAvgInterval.toFixed(0)} day interval`);
  }
  console.log(`   Recommendation: VIP bonus 1.4x (was 1.2x), Frequente 1.2x (was 1.1x)`);

  console.log('\n' + '='.repeat(80));
  console.log('Analysis complete!');
  console.log('='.repeat(80));
}

main().catch(console.error);
