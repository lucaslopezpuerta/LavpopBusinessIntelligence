// scripts/whatchimp-full-sync.js v1.6
// Standalone script to sync all customers to WhatChimp with labels and saldo
// Run with: node scripts/whatchimp-full-sync.js
//
// Usage:
//   node scripts/whatchimp-full-sync.js          # Full sync
//   node scripts/whatchimp-full-sync.js --dry    # Dry run (no API calls)
//   node scripts/whatchimp-full-sync.js --limit 10  # Sync only 10 customers
//
// CHANGELOG:
// v1.6 (2026-02-03): Robust duplicate phone handling
//   - Deduplicates customers by phone before sync (prevents arbitrary selection)
//   - Keeps primary customer (highest transaction_count)
//   - Logs warnings when duplicates are found for monitoring
// v1.5 (2026-02-03): Reliability improvements
//   - Added 100ms inter-operation delays between API calls
//   - Reduces silent failures from WhatChimp under concurrent load
// v1.4 (2026-02-03): Fixed silent failure detection
//   - Now verifies API response (status === '1') for each API call
//   - Reports actual failures instead of false success
//   - Fixes ~32% "silent failure" rate from previous sync
// v1.3 (2026-02-03): Parallel processing optimization
//   - Process 10 customers concurrently (10x faster)
//   - Reduced sync time from ~60 min to ~6 min
// v1.2 (2026-02-03): Added saldo_carteira custom field sync
//   - Sync saldo_carteira from Supabase to WhatChimp "saldo_carteira" field
//   - Uses assign-custom-fields endpoint (safe, doesn't affect labels)
// v1.1 (2026-02-02): Fixed label replacement bug
//   - Use remove-labels + assign-labels instead of update with label_ids
//   - Prevents label accumulation when customer segments change
// v1.0 (2026-02-02): Initial implementation with pagination

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// WhatChimp Label ID mapping (verified via API)
const LABEL_MAP = {
  // RFM Segments
  'VIP': 248609,
  'Frequente': 249390,
  'Promissor': 249391,
  'Novato': 249392,
  'Esfriando': 249393,
  'Inativo': 249394,
  // Risk Levels
  'Healthy': 249396,
  'At Risk': 249397,
  'Churning': 249399,
  'Lost': 249400,
  'New Customer': 249401
};

// ALL managed label IDs - must remove these before assigning new ones
// to prevent label accumulation when segments change
const ALL_MANAGED_LABELS = [
  248609, 249390, 249391, 249392, 249393, 249394,  // RFM labels
  249396, 249397, 249399, 249400, 249401           // Risk labels
];

// Parse CLI arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry');
const limitIndex = args.indexOf('--limit');
const LIMIT = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : null;

// Deduplicate customers by phone, keeping primary (highest transaction_count)
function deduplicateByPhone(customers) {
  const phoneMap = new Map();
  const duplicates = [];

  customers.forEach(customer => {
    const phone = customer.normalized_phone;
    if (!phone) return;

    if (!phoneMap.has(phone)) {
      phoneMap.set(phone, customer);
    } else {
      const existing = phoneMap.get(phone);
      const existingTxns = existing.transaction_count || 0;
      const currentTxns = customer.transaction_count || 0;

      if (currentTxns > existingTxns) {
        duplicates.push({
          phone,
          kept: { doc: customer.doc, nome: customer.nome, txns: currentTxns },
          skipped: { doc: existing.doc, nome: existing.nome, txns: existingTxns }
        });
        phoneMap.set(phone, customer);
      } else {
        duplicates.push({
          phone,
          kept: { doc: existing.doc, nome: existing.nome, txns: existingTxns },
          skipped: { doc: customer.doc, nome: customer.nome, txns: currentTxns }
        });
      }
    }
  });

  return { customers: Array.from(phoneMap.values()), duplicates };
}

// Initialize Supabase client
function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error('Supabase credentials not configured (SUPABASE_URL, SUPABASE_SERVICE_KEY)');
  }
  return createClient(url, key);
}

// WhatChimp API wrapper
async function whatChimpRequest(endpoint, params = {}) {
  const apiKey = process.env.WHATCHIMP_API_KEY || process.env.WhatChimp_API_KEY;
  const phoneNumberId = process.env.WHATCHIMP_PHONE_NUMBER_ID || process.env.META_WHATSAPP_PHONE_ID;

  if (!apiKey || !phoneNumberId) {
    throw new Error('WhatChimp credentials not configured (WHATCHIMP_API_KEY, META_WHATSAPP_PHONE_ID)');
  }

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

// Get label IDs for a customer
function getCustomerLabelIds(customer) {
  const labelIds = [];

  if (customer.rfm_segment && LABEL_MAP[customer.rfm_segment]) {
    labelIds.push(LABEL_MAP[customer.rfm_segment]);
  }

  if (customer.risk_level && LABEL_MAP[customer.risk_level]) {
    labelIds.push(LABEL_MAP[customer.risk_level]);
  }

  return labelIds;
}

// Sync a single customer to WhatChimp
// Uses remove-labels + assign-labels pattern to prevent label accumulation
// Also syncs saldo custom field from saldo_carteira
// v1.4: Now verifies API responses to detect silent failures
async function syncCustomer(customer, dryRun = false) {
  const phone = customer.normalized_phone.replace(/\D/g, '');
  const labelIds = getCustomerLabelIds(customer);
  const saldo = customer.saldo_carteira != null ? String(customer.saldo_carteira) : '0.00';

  if (dryRun) {
    return {
      action: 'dry_run',
      phone,
      labels: labelIds.map(id => Object.keys(LABEL_MAP).find(k => LABEL_MAP[k] === id)),
      saldo,
      success: true
    };
  }

  const existing = await whatChimpRequest('subscriber/get', { phone_number: phone });

  if (existing.status === '1' && existing.message && existing.message.length > 0) {
    // EXISTING SUBSCRIBER: Remove ALL managed labels first (clean slate)
    const removeResult = await whatChimpRequest('subscriber/chat/remove-labels', {
      phone_number: phone,
      label_ids: ALL_MANAGED_LABELS.join(',')
    });
    if (removeResult.status !== '1') {
      return { action: 'failed', phone, success: false, error: 'remove-labels failed', details: removeResult };
    }

    // Inter-operation delay for reliability
    await new Promise(r => setTimeout(r, 100));

    // Assign correct labels (only if customer has labels)
    if (labelIds.length > 0) {
      const assignResult = await whatChimpRequest('subscriber/chat/assign-labels', {
        phone_number: phone,
        label_ids: labelIds.join(',')
      });
      if (assignResult.status !== '1') {
        return { action: 'failed', phone, success: false, error: 'assign-labels failed', details: assignResult };
      }

      // Inter-operation delay for reliability
      await new Promise(r => setTimeout(r, 100));
    }

    // Update saldo_carteira custom field
    const saldoResult = await whatChimpRequest('subscriber/chat/assign-custom-fields', {
      phone_number: phone,
      custom_fields: JSON.stringify({ saldo_carteira: saldo })
    });
    if (saldoResult.status !== '1') {
      return { action: 'failed', phone, success: false, error: 'assign-custom-fields failed', details: saldoResult };
    }

    return { action: 'updated', phone, success: true, labels: labelIds };
  } else {
    // NEW SUBSCRIBER: Create first, then assign labels
    const createResult = await whatChimpRequest('subscriber/create', {
      phoneNumber: phone,
      name: customer.nome || 'Cliente'
    });
    // Allow "already exist" as success (subscriber exists but wasn't found initially)
    if (createResult.status !== '1' && !createResult.message?.includes('already exist')) {
      return { action: 'failed', phone, success: false, error: 'create failed', details: createResult };
    }

    // Inter-operation delay for reliability
    await new Promise(r => setTimeout(r, 100));

    // Assign labels (only if customer has labels)
    if (labelIds.length > 0) {
      const assignResult = await whatChimpRequest('subscriber/chat/assign-labels', {
        phone_number: phone,
        label_ids: labelIds.join(',')
      });
      if (assignResult.status !== '1') {
        return { action: 'failed', phone, success: false, error: 'assign-labels failed (new)', details: assignResult };
      }

      // Inter-operation delay for reliability
      await new Promise(r => setTimeout(r, 100));
    }

    // Set saldo_carteira custom field
    const saldoResult = await whatChimpRequest('subscriber/chat/assign-custom-fields', {
      phone_number: phone,
      custom_fields: JSON.stringify({ saldo_carteira: saldo })
    });
    if (saldoResult.status !== '1') {
      return { action: 'failed', phone, success: false, error: 'assign-custom-fields failed (new)', details: saldoResult };
    }

    return { action: 'created', phone, success: true, labels: labelIds };
  }
}

// Main function
async function main() {
  console.log('='.repeat(60));
  console.log('WhatChimp Full Sync');
  console.log('='.repeat(60));

  if (DRY_RUN) {
    console.log('MODE: DRY RUN (no API calls will be made)');
  }
  if (LIMIT) {
    console.log(`LIMIT: Processing only ${LIMIT} customers`);
  }
  console.log('');

  const startTime = Date.now();
  const supabase = getSupabaseClient();

  // Get all customers with valid phone (paginated to handle >1000 rows)
  console.log('Fetching customers from Supabase...');

  let allCustomers = [];
  const pageSize = 1000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from('customer_summary')
      .select('doc, nome, normalized_phone, rfm_segment, risk_level, saldo_carteira, transaction_count')
      .not('normalized_phone', 'is', null)
      .range(offset, offset + pageSize - 1);

    const { data: batch, error: batchError } = await query;

    if (batchError) {
      console.error('Failed to fetch customers:', batchError);
      process.exit(1);
    }

    if (batch && batch.length > 0) {
      allCustomers = allCustomers.concat(batch);
      offset += pageSize;
      hasMore = batch.length === pageSize;
      console.log(`  Fetched ${allCustomers.length} customers...`);
    } else {
      hasMore = false;
    }
  }

  const customers = LIMIT ? allCustomers.slice(0, LIMIT) : allCustomers;
  const error = null;

  if (error) {
    console.error('Failed to fetch customers:', error);
    process.exit(1);
  }

  // Get blacklisted numbers
  const { data: blacklist } = await supabase
    .from('blacklist')
    .select('phone');

  const blacklistedPhones = new Set((blacklist || []).map(b => b.phone));

  // Filter out blacklisted
  const afterBlacklist = customers.filter(c => {
    const phone = c.normalized_phone?.replace(/\D/g, '');
    return phone && !blacklistedPhones.has(phone) && !blacklistedPhones.has('+' + phone);
  });

  // Deduplicate by phone (keeps customer with highest transaction_count)
  const { customers: eligibleCustomers, duplicates } = deduplicateByPhone(afterBlacklist);

  console.log(`Total customers: ${customers.length}`);
  console.log(`Blacklisted: ${blacklistedPhones.size}`);
  if (duplicates.length > 0) {
    console.log(`Duplicate phones: ${duplicates.length} (using primary customer for each)`);
  }
  console.log(`Eligible for sync: ${eligibleCustomers.length}`);
  console.log('');

  // Show segment distribution
  const segmentCounts = {};
  const riskCounts = {};
  eligibleCustomers.forEach(c => {
    segmentCounts[c.rfm_segment] = (segmentCounts[c.rfm_segment] || 0) + 1;
    riskCounts[c.risk_level] = (riskCounts[c.risk_level] || 0) + 1;
  });

  console.log('RFM Segment Distribution:');
  Object.entries(segmentCounts).sort((a, b) => b[1] - a[1]).forEach(([seg, count]) => {
    console.log(`  ${seg}: ${count}`);
  });
  console.log('');

  console.log('Risk Level Distribution:');
  Object.entries(riskCounts).sort((a, b) => b[1] - a[1]).forEach(([risk, count]) => {
    console.log(`  ${risk}: ${count}`);
  });
  console.log('');

  // Log duplicate phone details (for monitoring data quality)
  if (duplicates.length > 0) {
    console.log('Duplicate Phones Resolved:');
    duplicates.forEach(d => {
      console.log(`  ${d.phone}: Syncing ${d.kept.nome} (${d.kept.txns} txns), skipping ${d.skipped.nome} (${d.skipped.txns} txns)`);
    });
    console.log('');
  }

  const results = {
    total: eligibleCustomers.length,
    created: 0,
    updated: 0,
    failed: 0,
    errors: []
  };

  // Parallel processing configuration
  // Note: 10 concurrent was too aggressive - WhatChimp silently drops requests
  // Reduced to 5 for reliability
  const CONCURRENCY = 5; // Process 5 customers at a time

  console.log(`Starting sync (${CONCURRENCY} concurrent)...`);
  console.log('-'.repeat(60));

  // Process customers in parallel batches
  for (let i = 0; i < eligibleCustomers.length; i += CONCURRENCY) {
    const batch = eligibleCustomers.slice(i, i + CONCURRENCY);

    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map(async (customer) => {
        try {
          return await syncCustomer(customer, DRY_RUN);
        } catch (err) {
          return { success: false, phone: customer.normalized_phone, error: err.message };
        }
      })
    );

    // Aggregate results
    for (const result of batchResults) {
      if (result.success) {
        if (result.action === 'created') results.created++;
        else if (result.action === 'updated') results.updated++;
        else if (result.action === 'dry_run') results.updated++;
      } else {
        results.failed++;
        results.errors.push({ phone: result.phone, error: result.error || result.result });
      }
    }

    // Progress indicator
    const processed = Math.min(i + CONCURRENCY, eligibleCustomers.length);
    if (processed % 50 === 0 || processed === eligibleCustomers.length) {
      const elapsed = Math.round((Date.now() - startTime) / 1000) || 1;
      const rate = (processed / elapsed).toFixed(1);
      console.log(`Progress: ${processed}/${eligibleCustomers.length} (${rate}/sec) - Created: ${results.created}, Updated: ${results.updated}, Failed: ${results.failed}`);
    }

    // Small delay between batches (not between each request)
    if (!DRY_RUN && i + CONCURRENCY < eligibleCustomers.length) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  const duration = Math.round((Date.now() - startTime) / 1000);

  console.log('');
  console.log('='.repeat(60));
  console.log('SYNC COMPLETE');
  console.log('='.repeat(60));
  console.log(`Duration: ${duration} seconds`);
  console.log(`Total processed: ${results.total}`);
  console.log(`Created: ${results.created}`);
  console.log(`Updated: ${results.updated}`);
  console.log(`Failed: ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('');
    console.log('Errors (first 10):');
    results.errors.slice(0, 10).forEach(e => {
      console.log(`  ${e.phone}: ${JSON.stringify(e.error)}`);
    });
  }

  if (DRY_RUN) {
    console.log('');
    console.log('This was a DRY RUN. No changes were made to WhatChimp.');
    console.log('Run without --dry flag to perform actual sync.');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
