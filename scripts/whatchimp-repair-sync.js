// scripts/whatchimp-repair-sync.js v1.0
// Repairs customers with missing data in WhatChimp
// Runs slower and with verification to ensure data is applied
//
// Usage:
//   node scripts/whatchimp-repair-sync.js           # Repair all missing
//   node scripts/whatchimp-repair-sync.js --limit 50  # Repair up to 50

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

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

const ALL_MANAGED_LABELS = [
  248609, 249390, 249391, 249392, 249393, 249394,
  249396, 249397, 249399, 249400, 249401
];

const args = process.argv.slice(2);
const limitIndex = args.indexOf('--limit');
const LIMIT = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : null;

function getSupabaseClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

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

// Sync with verification and retry
async function syncAndVerify(customer, maxRetries = 2) {
  const phone = customer.normalized_phone.replace(/\D/g, '');
  const labelIds = getCustomerLabelIds(customer);
  const saldo = customer.saldo_carteira != null ? String(customer.saldo_carteira) : '0.00';

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Remove labels
      const removeResult = await whatChimpRequest('subscriber/chat/remove-labels', {
        phone_number: phone,
        label_ids: ALL_MANAGED_LABELS.join(',')
      });
      if (removeResult.status !== '1') {
        if (attempt < maxRetries) { await new Promise(r => setTimeout(r, 500)); continue; }
        return { success: false, error: 'remove-labels', details: removeResult };
      }

      await new Promise(r => setTimeout(r, 100));

      // Assign labels
      if (labelIds.length > 0) {
        const assignResult = await whatChimpRequest('subscriber/chat/assign-labels', {
          phone_number: phone,
          label_ids: labelIds.join(',')
        });
        if (assignResult.status !== '1') {
          if (attempt < maxRetries) { await new Promise(r => setTimeout(r, 500)); continue; }
          return { success: false, error: 'assign-labels', details: assignResult };
        }
      }

      await new Promise(r => setTimeout(r, 100));

      // Assign saldo
      const saldoResult = await whatChimpRequest('subscriber/chat/assign-custom-fields', {
        phone_number: phone,
        custom_fields: JSON.stringify({ saldo_carteira: saldo })
      });
      if (saldoResult.status !== '1') {
        if (attempt < maxRetries) { await new Promise(r => setTimeout(r, 500)); continue; }
        return { success: false, error: 'assign-custom-fields', details: saldoResult };
      }

      await new Promise(r => setTimeout(r, 200));

      // Verify
      const verify = await whatChimpRequest('subscriber/get', { phone_number: phone });
      const sub = verify.message?.[0];

      if (!sub) {
        if (attempt < maxRetries) { await new Promise(r => setTimeout(r, 500)); continue; }
        return { success: false, error: 'verification', details: 'subscriber not found' };
      }

      const hasLabels = sub.label_names && sub.label_names.trim() !== '';
      const hasSaldo = sub.custom_fields && sub.custom_fields.includes('saldo_carteira');

      if (hasLabels && hasSaldo) {
        return { success: true, retries: attempt };
      }

      // Data not applied yet, retry
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }

      return { success: false, error: 'verification', details: `Labels=${hasLabels}, Saldo=${hasSaldo}` };

    } catch (err) {
      if (attempt < maxRetries) { await new Promise(r => setTimeout(r, 500)); continue; }
      return { success: false, error: 'exception', details: err.message };
    }
  }

  return { success: false, error: 'max-retries' };
}

async function main() {
  console.log('='.repeat(60));
  console.log('WhatChimp Repair Sync');
  console.log('='.repeat(60));

  const supabase = getSupabaseClient();
  const startTime = Date.now();

  // Get all customers
  console.log('\nFetching customers from Supabase...');
  let allCustomers = [];
  const pageSize = 1000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data: batch } = await supabase
      .from('customer_summary')
      .select('doc, nome, normalized_phone, rfm_segment, risk_level, saldo_carteira')
      .not('normalized_phone', 'is', null)
      .range(offset, offset + pageSize - 1);

    if (batch && batch.length > 0) {
      allCustomers = allCustomers.concat(batch);
      offset += pageSize;
      hasMore = batch.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  console.log(`Total customers: ${allCustomers.length}`);

  // Get blacklist
  const { data: blacklist } = await supabase.from('blacklist').select('phone');
  const blacklistedPhones = new Set((blacklist || []).map(b => b.phone));

  // Filter eligible
  const eligible = allCustomers.filter(c => {
    const phone = c.normalized_phone?.replace(/\D/g, '');
    return phone && !blacklistedPhones.has(phone) && !blacklistedPhones.has('+' + phone);
  });

  console.log(`Eligible for check: ${eligible.length}`);

  // Find customers with missing data
  console.log('\nScanning for missing data...');
  const missing = [];

  for (let i = 0; i < eligible.length; i++) {
    const c = eligible[i];
    const phone = c.normalized_phone.replace(/\D/g, '');

    const result = await whatChimpRequest('subscriber/get', { phone_number: phone });
    const sub = result.message?.[0];

    if (!sub) {
      missing.push({ ...c, phone, reason: 'NOT_FOUND' });
    } else {
      const hasLabels = sub.label_names && sub.label_names.trim() !== '';
      const hasSaldo = sub.custom_fields && sub.custom_fields.includes('saldo_carteira');

      if (!hasLabels || !hasSaldo) {
        missing.push({ ...c, phone, reason: !hasLabels ? 'NO_LABELS' : 'NO_SALDO' });
      }
    }

    if ((i + 1) % 100 === 0) {
      console.log(`  Scanned ${i + 1}/${eligible.length} - Found ${missing.length} missing`);
    }

    await new Promise(r => setTimeout(r, 50));
  }

  console.log(`\nFound ${missing.length} customers with missing data`);

  if (missing.length === 0) {
    console.log('\n✅ All customers are synced correctly!');
    return;
  }

  // Apply limit
  const toRepair = LIMIT ? missing.slice(0, LIMIT) : missing;
  console.log(`Repairing ${toRepair.length} customers...\n`);

  const results = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < toRepair.length; i++) {
    const c = toRepair[i];
    const result = await syncAndVerify(c);

    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push({ phone: c.phone, name: c.nome, ...result });
    }

    if ((i + 1) % 20 === 0 || i === toRepair.length - 1) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      console.log(`Progress: ${i + 1}/${toRepair.length} - Success: ${results.success}, Failed: ${results.failed} (${elapsed}s)`);
    }

    // Slower pace for reliability
    await new Promise(r => setTimeout(r, 300));
  }

  const duration = Math.round((Date.now() - startTime) / 1000);

  console.log('\n' + '='.repeat(60));
  console.log('REPAIR COMPLETE');
  console.log('='.repeat(60));
  console.log(`Duration: ${duration} seconds`);
  console.log(`Total repaired: ${results.success}`);
  console.log(`Failed: ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('\nFailed repairs (first 10):');
    results.errors.slice(0, 10).forEach(e => {
      console.log(`  ${e.name} (${e.phone}): ${e.error} - ${JSON.stringify(e.details)}`);
    });
  }

  if (results.failed === 0) {
    console.log('\n✅ All repairs successful!');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
