// scripts/verify-whatchimp.js v1.1
// Comprehensive WhatChimp sync verification
// Verifies: subscriber name, RFM labels, Risk labels, and saldo_carteira
// v1.1: Now excludes blacklisted numbers (they're intentionally not synced)
//
// Usage:
//   node scripts/verify-whatchimp.js           # Check 10 random customers
//   node scripts/verify-whatchimp.js --all     # Check all customers (slow)
//   node scripts/verify-whatchimp.js --count 20 # Check 20 customers
//   node scripts/verify-whatchimp.js --phone 5551999999999  # Check specific phone

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// WhatChimp Label ID mapping
const LABEL_MAP = {
  'VIP': 248609,
  'Frequente': 249390,
  'Promissor': 249391,
  'Novato': 249392,
  'Esfriando': 249393,
  'Inativo': 249394,
  'Healthy': 249396,
  'At Risk': 249397,
  'Churning': 249399,
  'Lost': 249400,
  'New Customer': 249401
};

// Parse CLI arguments
const args = process.argv.slice(2);
const CHECK_ALL = args.includes('--all');
const countIndex = args.indexOf('--count');
const COUNT = countIndex !== -1 ? parseInt(args[countIndex + 1], 10) : 10;
const phoneIndex = args.indexOf('--phone');
const SPECIFIC_PHONE = phoneIndex !== -1 ? args[phoneIndex + 1] : null;

async function whatChimpRequest(endpoint, params = {}) {
  const apiKey = process.env.WHATCHIMP_API_KEY || process.env.WhatChimp_API_KEY;
  const phoneNumberId = process.env.WHATCHIMP_PHONE_NUMBER_ID || process.env.META_WHATSAPP_PHONE_ID;

  const url = `https://app.whatchimp.com/api/v1/whatsapp/${endpoint}`;
  const body = new URLSearchParams({
    apiToken: apiKey,
    phone_number_id: phoneNumberId,
    ...params
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  return response.json();
}

function parseCustomFields(cfString) {
  if (!cfString) return {};
  const result = {};
  cfString.split(',').forEach(pair => {
    const colonIndex = pair.indexOf(':');
    if (colonIndex > 0) {
      const key = pair.substring(0, colonIndex).trim();
      const value = pair.substring(colonIndex + 1).trim();
      result[key] = value;
    }
  });
  return result;
}

function parseLabelNames(labelString) {
  if (!labelString) return [];
  return labelString.split(',').map(l => l.trim()).filter(l => l);
}

// Normalize label names for comparison (WhatChimp removes spaces)
function normalizeLabel(label) {
  return label.replace(/\s+/g, '');
}

async function main() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  console.log('='.repeat(70));
  console.log('WhatChimp Sync Verification');
  console.log('='.repeat(70));

  // Load blacklist (sync excludes these, so we should too)
  const { data: blacklist } = await supabase.from('blacklist').select('phone');
  const blacklistedPhones = new Set((blacklist || []).map(b => b.phone));

  // Helper to check if phone is blacklisted
  const isBlacklisted = (phone) => {
    const normalized = phone?.replace(/\D/g, '');
    return blacklistedPhones.has(normalized) || blacklistedPhones.has('+' + normalized);
  };

  // Build query
  let query = supabase
    .from('customer_summary')
    .select('doc, nome, normalized_phone, saldo_carteira, rfm_segment, risk_level')
    .not('normalized_phone', 'is', null);

  if (SPECIFIC_PHONE) {
    const phone = SPECIFIC_PHONE.replace(/\D/g, '');
    query = query.or(`normalized_phone.eq.${phone},normalized_phone.eq.+${phone}`);
    console.log(`\nChecking specific phone: ${phone}\n`);
  } else if (CHECK_ALL) {
    console.log(`\nChecking ALL customers (this may take a while)...\n`);
  } else {
    // Get a diverse sample: mix of segments (excluding blacklisted)
    const samples = [];

    // Get some from each segment (fetch more to account for blacklist filtering)
    for (const segment of ['VIP', 'Frequente', 'Promissor', 'Inativo']) {
      const { data } = await supabase
        .from('customer_summary')
        .select('doc, nome, normalized_phone, saldo_carteira, rfm_segment, risk_level')
        .not('normalized_phone', 'is', null)
        .eq('rfm_segment', segment)
        .limit(Math.ceil(COUNT / 4) * 2);  // Fetch extra to account for blacklist
      if (data) {
        // Filter out blacklisted
        const eligible = data.filter(c => !isBlacklisted(c.normalized_phone));
        samples.push(...eligible.slice(0, Math.ceil(COUNT / 4)));
      }
    }

    // Dedupe and limit
    const seen = new Set();
    const customers = samples.filter(c => {
      if (seen.has(c.doc)) return false;
      seen.add(c.doc);
      return true;
    }).slice(0, COUNT);

    console.log(`\nChecking ${customers.length} customers across segments (${blacklistedPhones.size} blacklisted excluded)...\n`);

    // Process these customers directly
    await processCustomers(customers);
    return;
  }

  const { data: customers, error } = await query;

  if (error) {
    console.error('Failed to fetch customers:', error);
    process.exit(1);
  }

  if (!customers || customers.length === 0) {
    console.log('No customers found.');
    return;
  }

  // Filter out blacklisted customers
  const eligible = customers.filter(c => !isBlacklisted(c.normalized_phone));
  const toCheck = CHECK_ALL ? eligible : eligible.slice(0, COUNT);

  if (SPECIFIC_PHONE) {
    await processCustomers(toCheck);
  } else {
    console.log(`\nChecking ${toCheck.length} customers (${blacklistedPhones.size} blacklisted excluded)...\n`);
    await processCustomers(toCheck);
  }
}

async function processCustomers(customers) {
  const results = {
    total: customers.length,
    passed: 0,
    failed: 0,
    notFound: 0,
    details: {
      name: { ok: 0, fail: 0 },
      rfm: { ok: 0, fail: 0, na: 0 },
      risk: { ok: 0, fail: 0, na: 0 },
      saldo: { ok: 0, fail: 0 }
    }
  };

  const failures = [];

  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    const phone = customer.normalized_phone.replace(/\D/g, '');
    const expectedSaldo = customer.saldo_carteira != null ? String(customer.saldo_carteira) : '0.00';
    const expectedRfm = customer.rfm_segment;
    const expectedRisk = customer.risk_level;

    const result = await whatChimpRequest('subscriber/get', { phone_number: phone });

    if (result.status !== '1' || !result.message?.[0]) {
      results.notFound++;
      results.failed++;
      failures.push({ customer: customer.nome, phone, reason: 'NOT_FOUND' });
      continue;
    }

    const subscriber = result.message[0];
    const actualName = subscriber.first_name || '';
    const actualLabels = parseLabelNames(subscriber.label_names);
    const normalizedLabels = actualLabels.map(normalizeLabel);
    const fields = parseCustomFields(subscriber.custom_fields);
    const actualSaldo = fields['saldo_carteira'] || 'NOT SET';

    // Check name (partial match OK - first name match)
    const expectedFirstName = (customer.nome || 'Cliente').split(' ')[0].toLowerCase();
    const actualFirstName = actualName.split(' ')[0].toLowerCase();
    const nameOk = actualFirstName === expectedFirstName ||
                   actualName.toLowerCase().includes(expectedFirstName) ||
                   (customer.nome || '').toLowerCase().includes(actualFirstName);

    // Check RFM label
    let rfmOk = true;
    if (expectedRfm && LABEL_MAP[expectedRfm]) {
      rfmOk = actualLabels.includes(expectedRfm) || normalizedLabels.includes(normalizeLabel(expectedRfm));
      if (rfmOk) results.details.rfm.ok++;
      else results.details.rfm.fail++;
    } else {
      results.details.rfm.na++;
    }

    // Check Risk label
    let riskOk = true;
    if (expectedRisk && LABEL_MAP[expectedRisk]) {
      riskOk = actualLabels.includes(expectedRisk) || normalizedLabels.includes(normalizeLabel(expectedRisk));
      if (riskOk) results.details.risk.ok++;
      else results.details.risk.fail++;
    } else {
      results.details.risk.na++;
    }

    // Check saldo
    const saldoOk = actualSaldo === expectedSaldo ||
                    (actualSaldo === 'NOT SET' && expectedSaldo === '0.00') ||
                    (actualSaldo === '0.00' && expectedSaldo === 'NOT SET');

    // Update counters
    if (nameOk) results.details.name.ok++;
    else results.details.name.fail++;

    if (saldoOk) results.details.saldo.ok++;
    else results.details.saldo.fail++;

    const allOk = nameOk && rfmOk && riskOk && saldoOk;
    if (allOk) {
      results.passed++;
    } else {
      results.failed++;
      failures.push({
        customer: customer.nome,
        phone,
        expected: { rfm: expectedRfm, risk: expectedRisk, saldo: expectedSaldo },
        actual: { name: actualName, labels: actualLabels, saldo: actualSaldo },
        issues: [
          !nameOk && 'NAME',
          !rfmOk && 'RFM',
          !riskOk && 'RISK',
          !saldoOk && 'SALDO'
        ].filter(Boolean)
      });
    }

    // Progress indicator
    if ((i + 1) % 50 === 0 || i === customers.length - 1) {
      console.log(`Progress: ${i + 1}/${customers.length} - Passed: ${results.passed}, Failed: ${results.failed}`);
    }

    await new Promise(r => setTimeout(r, 100));
  }

  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(70));

  console.log(`\nTotal Checked: ${results.total}`);
  console.log(`Passed: ${results.passed} (${(results.passed / results.total * 100).toFixed(1)}%)`);
  console.log(`Failed: ${results.failed} (${(results.failed / results.total * 100).toFixed(1)}%)`);
  if (results.notFound > 0) {
    console.log(`Not Found: ${results.notFound}`);
  }

  console.log(`\nBreakdown:`);
  console.log(`  Name:  ${results.details.name.ok} OK, ${results.details.name.fail} fail`);
  console.log(`  RFM:   ${results.details.rfm.ok} OK, ${results.details.rfm.fail} fail, ${results.details.rfm.na} N/A`);
  console.log(`  Risk:  ${results.details.risk.ok} OK, ${results.details.risk.fail} fail, ${results.details.risk.na} N/A`);
  console.log(`  Saldo: ${results.details.saldo.ok} OK, ${results.details.saldo.fail} fail`);

  if (failures.length > 0) {
    console.log(`\nFailures (first 10):`);
    for (const f of failures.slice(0, 10)) {
      console.log(`  ${f.customer} (${f.phone}): ${f.issues?.join(', ') || f.reason}`);
      if (f.expected) {
        console.log(`    Expected: RFM=${f.expected.rfm}, Risk=${f.expected.risk}, Saldo=${f.expected.saldo}`);
        console.log(`    Actual:   Labels=[${f.actual.labels.join(', ')}], Saldo=${f.actual.saldo}`);
      }
    }
  }

  console.log('\n' + '='.repeat(70));
  if (results.passed === results.total) {
    console.log('✅ ALL CHECKS PASSED');
  } else if (results.failed <= results.total * 0.05) {
    console.log('⚠️ MOSTLY PASSED (>95% success rate)');
  } else {
    console.log('❌ VERIFICATION FAILED - Review the failures above');
  }
  console.log('='.repeat(70));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
