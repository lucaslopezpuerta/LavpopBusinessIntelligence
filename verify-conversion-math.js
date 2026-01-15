/**
 * Verification Script: First Visit Conversion Math
 * Compares calculated metrics against UI display
 * Run: node verify-conversion-math.js
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
    if (orderColumn) url += `&order=${orderColumn}.asc`;

    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Range': `${offset}-${offset + PAGE_SIZE - 1}`,
        'Prefer': 'count=exact'
      }
    });

    if (!response.ok) throw new Error(`Supabase error: ${response.status}`);
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

function parseBrDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr.includes('T') || dateStr.includes('-')) return new Date(dateStr);
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s*(\d{2})?:?(\d{2})?:?(\d{2})?/);
  if (match) {
    const [, day, month, year, hour = 0, min = 0, sec = 0] = match;
    return new Date(year, month - 1, day, hour, min, sec);
  }
  return null;
}

function isValidCpf(doc) {
  if (!doc) return false;
  const cleaned = doc.replace(/\D/g, '');
  return cleaned.length === 11;
}

async function main() {
  console.log('='.repeat(70));
  console.log('VERIFICATION: First Visit Conversion Math');
  console.log('='.repeat(70));

  // Fetch transactions
  console.log('\nFetching transactions...');
  const transactions = await fetchAllFromSupabase('transactions', 'doc_cliente,data_hora,valor_venda', 'data_hora');
  console.log(`Total transactions: ${transactions.length}`);

  // Fetch contact tracking for welcome campaigns
  console.log('\nFetching contact tracking...');
  const contacts = await fetchAllFromSupabase('contact_tracking', 'customer_id,campaign_type,status');
  console.log(`Total contact records: ${contacts.length}`);

  // Build welcomeContactedIds set
  const welcomeContactedIds = new Set();
  contacts.forEach(c => {
    if (c.campaign_type === 'welcome' || c.campaign_type === 'post_visit') {
      welcomeContactedIds.add(c.customer_id);
    }
  });
  console.log(`Customers with welcome campaign: ${welcomeContactedIds.size}`);

  // Build customer visits
  const now = new Date();
  const customerVisits = {};

  transactions.forEach(t => {
    const doc = t.doc_cliente?.replace(/\D/g, '');
    const date = parseBrDate(t.data_hora);
    if (!doc || !date || !isValidCpf(doc)) return;
    if (!customerVisits[doc]) customerVisits[doc] = [];
    customerVisits[doc].push(date);
  });

  // Sort visits
  Object.values(customerVisits).forEach(visits => visits.sort((a, b) => a - b));

  const totalCustomers = Object.keys(customerVisits).length;
  console.log(`\nUnique customers with valid CPF: ${totalCustomers}`);

  // Algorithm parameters
  const RETURN_WINDOW = 30;
  const SEED_START = 60;
  const SEED_END = 31;
  const PENDING_LOOKBACK = 30;

  const seedStartDate = new Date(now);
  seedStartDate.setDate(seedStartDate.getDate() - SEED_START);
  const seedEndDate = new Date(now);
  seedEndDate.setDate(seedEndDate.getDate() - SEED_END);
  const pendingDate = new Date(now);
  pendingDate.setDate(pendingDate.getDate() - PENDING_LOOKBACK);

  console.log(`\nDate ranges:`);
  console.log(`  Today: ${now.toISOString().split('T')[0]}`);
  console.log(`  Seed window: ${seedStartDate.toISOString().split('T')[0]} to ${seedEndDate.toISOString().split('T')[0]}`);
  console.log(`  Pending window: ${pendingDate.toISOString().split('T')[0]} to today`);

  // Calculate metrics
  let totalNewCustomers = 0;
  let converted = 0;
  let notConverted = 0;
  let pending = 0;
  let withWelcome = { total: 0, converted: 0 };
  let withoutWelcome = { total: 0, converted: 0 };
  const daysToReturn = [];
  const seedWindowCustomers = [];
  const pendingCustomers = [];

  Object.entries(customerVisits).forEach(([customerId, visits]) => {
    const firstVisit = visits[0];
    const hasWelcome = welcomeContactedIds.has(customerId);

    const isInSeedWindow = firstVisit >= seedStartDate && firstVisit <= seedEndDate;
    const isInPendingWindow = firstVisit >= pendingDate;

    if (isInSeedWindow) {
      totalNewCustomers++;
      seedWindowCustomers.push({ id: customerId, firstVisit, visits: visits.length, hasWelcome });

      if (hasWelcome) {
        withWelcome.total++;
      } else {
        withoutWelcome.total++;
      }

      if (visits.length >= 2) {
        const secondVisit = visits[1];
        const daysToSecond = Math.floor((secondVisit - firstVisit) / (1000 * 60 * 60 * 24));

        if (daysToSecond <= RETURN_WINDOW) {
          converted++;
          daysToReturn.push(daysToSecond);
          if (hasWelcome) withWelcome.converted++;
          else withoutWelcome.converted++;
        } else {
          notConverted++;
        }
      } else {
        notConverted++;
      }
    } else if (isInPendingWindow && visits.length === 1) {
      pending++;
      pendingCustomers.push({ id: customerId, firstVisit, hasWelcome });
    }
  });

  // Calculate rates
  const completedCohort = converted + notConverted;
  const conversionRate = completedCohort > 0 ? Math.round((converted / completedCohort) * 100) : 0;
  const withWelcomeRate = withWelcome.total > 0 ? Math.round((withWelcome.converted / withWelcome.total) * 100) : 0;
  const withoutWelcomeRate = withoutWelcome.total > 0 ? Math.round((withoutWelcome.converted / withoutWelcome.total) * 100) : 0;
  const welcomeLift = withWelcomeRate - withoutWelcomeRate;
  const avgDays = daysToReturn.length > 0 ? Math.round(daysToReturn.reduce((a,b)=>a+b,0)/daysToReturn.length*10)/10 : 0;

  console.log('\n' + '='.repeat(70));
  console.log('CALCULATED METRICS');
  console.log('='.repeat(70));
  console.log(`\nCOMPLETED COHORT (first visit 31-60 days ago):`);
  console.log(`  Total new customers in cohort: ${totalNewCustomers}`);
  console.log(`  Converted (returned within 30d): ${converted}`);
  console.log(`  Not converted: ${notConverted}`);
  console.log(`  CONVERSION RATE: ${conversionRate}% (${converted} of ${completedCohort})`);
  console.log(`  Avg days to 2nd visit: ${avgDays}`);

  console.log(`\nWELCOME CAMPAIGN COMPARISON:`);
  console.log(`  With welcome: ${withWelcome.converted} of ${withWelcome.total} = ${withWelcomeRate}%`);
  console.log(`  Without welcome: ${withoutWelcome.converted} of ${withoutWelcome.total} = ${withoutWelcomeRate}%`);
  console.log(`  LIFT: ${welcomeLift > 0 ? '+' : ''}${welcomeLift}%`);

  console.log(`\nPENDING (first visit in last 30 days, no 2nd visit yet):`);
  console.log(`  Pending customers: ${pending}`);

  console.log('\n' + '='.repeat(70));
  console.log('COMPARISON WITH UI SCREENSHOT');
  console.log('='.repeat(70));
  console.log('\nUI shows:');
  console.log('  82% conversion (31 of 38 returned)');
  console.log('  +6 pending');
  console.log('  With welcome: 6 de 6 (100%)');
  console.log('  Without welcome: 25 de 32 (78%)');
  console.log('  +22% lift');
  console.log('\nCalculated:');
  console.log(`  ${conversionRate}% conversion (${converted} of ${completedCohort} returned)`);
  console.log(`  +${pending} pending`);
  console.log(`  With welcome: ${withWelcome.converted} de ${withWelcome.total} (${withWelcomeRate}%)`);
  console.log(`  Without welcome: ${withoutWelcome.converted} de ${withoutWelcome.total} (${withoutWelcomeRate}%)`);
  console.log(`  ${welcomeLift > 0 ? '+' : ''}${welcomeLift}% lift`);

  // Check if numbers match
  console.log('\n' + '='.repeat(70));
  console.log('VERIFICATION RESULT');
  console.log('='.repeat(70));
  const matches = conversionRate === 82 && converted === 31 && completedCohort === 38 && pending === 6;
  console.log(matches ? '✅ MATH VERIFIED - Numbers match!' : '❌ DISCREPANCY FOUND - See details above');

  // Show sample of seed window customers for debugging
  console.log('\n' + '='.repeat(70));
  console.log('SAMPLE DATA (first 10 seed window customers)');
  console.log('='.repeat(70));
  seedWindowCustomers.slice(0, 10).forEach(c => {
    console.log(`  ${c.id.slice(-4)}: first=${c.firstVisit.toISOString().split('T')[0]}, visits=${c.visits}, welcome=${c.hasWelcome}`);
  });

  // ========================================
  // FREQUENCY DEGRADATION VERIFICATION
  // ========================================
  console.log('\n\n' + '='.repeat(70));
  console.log('VERIFICATION: Frequency Degradation Math');
  console.log('='.repeat(70));

  // Fetch customers for segment info
  console.log('\nFetching customer segments...');
  const customers = await fetchAllFromSupabase('customers', 'doc,nome,rfm_segment');
  console.log(`Total customers in DB: ${customers.length}`);

  const customerSegments = {};
  customers.forEach(c => {
    if (c.doc) customerSegments[c.doc] = c.rfm_segment || 'Unknown';
  });

  // Degradation parameters
  const minVisits = 4;
  const degradationThreshold = 50;
  const maxDaysSince = 30;
  const focusSegments = ['VIP', 'Frequente'];

  const degradingCustomers = [];

  const calcAvgInterval = (dates) => {
    if (dates.length < 2) return null;
    const intervals = [];
    for (let i = 1; i < dates.length; i++) {
      const days = Math.round((dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24));
      if (days > 0) intervals.push(days);
    }
    return intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : null;
  };

  Object.entries(customerVisits).forEach(([customerId, visits]) => {
    if (visits.length < minVisits) return;

    const segment = customerSegments[customerId] || 'Unknown';
    const lastVisit = visits[visits.length - 1];
    const daysSinceLastVisit = Math.floor((now - lastVisit) / (1000 * 60 * 60 * 24));

    if (daysSinceLastVisit > maxDaysSince) return;

    const splitIndex = Math.floor(visits.length * 0.8);
    if (splitIndex < 2) return;

    const historicalDates = visits.slice(0, splitIndex);
    const recentDates = visits.slice(splitIndex - 1);

    const historicalAvg = calcAvgInterval(historicalDates);
    const recentAvg = calcAvgInterval(recentDates);

    if (!historicalAvg || !recentAvg || historicalAvg === 0) return;

    const degradationPct = ((recentAvg - historicalAvg) / historicalAvg) * 100;

    if (degradationPct >= degradationThreshold) {
      degradingCustomers.push({
        id: customerId,
        segment,
        historicalAvg: Math.round(historicalAvg * 10) / 10,
        recentAvg: Math.round(recentAvg * 10) / 10,
        degradationPct: Math.round(degradationPct),
        isPriority: focusSegments.includes(segment)
      });
    }
  });

  // Sort by priority then severity
  degradingCustomers.sort((a, b) => {
    if (a.isPriority !== b.isPriority) return b.isPriority - a.isPriority;
    return b.degradationPct - a.degradationPct;
  });

  const priorityCount = degradingCustomers.filter(c => c.isPriority).length;

  console.log(`\nDEGRADATION METRICS:`);
  console.log(`  Total degrading customers: ${degradingCustomers.length}`);
  console.log(`  Priority (VIP/Frequente): ${priorityCount}`);

  console.log('\nUI shows:');
  console.log('  20 clientes');
  console.log('  2 VIPs');

  console.log('\nCalculated:');
  console.log(`  ${degradingCustomers.length} clientes`);
  console.log(`  ${priorityCount} VIPs/Frequentes`);

  console.log('\n' + '='.repeat(70));
  console.log('TOP 5 DEGRADING CUSTOMERS');
  console.log('='.repeat(70));
  degradingCustomers.slice(0, 5).forEach(c => {
    console.log(`  ${c.id.slice(-4)} (${c.segment}): ${c.historicalAvg}d -> ${c.recentAvg}d (+${c.degradationPct}%)`);
  });

  const degradationMatches = degradingCustomers.length === 20 && priorityCount === 2;
  console.log('\n' + '='.repeat(70));
  console.log('DEGRADATION VERIFICATION');
  console.log('='.repeat(70));
  console.log(degradationMatches ? '✅ DEGRADATION MATH VERIFIED!' : '❌ DEGRADATION DISCREPANCY FOUND');
}

main().catch(console.error);
