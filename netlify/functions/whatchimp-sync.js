// netlify/functions/whatchimp-sync.js v1.5
// Scheduled function - runs daily at 10:00 UTC (07:00 BRT)
// Syncs all customers from Supabase to WhatChimp with labels and saldo
//
// Schedule: 0 10 * * * (configured in netlify.toml)
// Runs 1 hour after POS customer sync (09:00 UTC)
//
// CHANGELOG:
// v1.5 (2026-02-03): Robust duplicate phone handling
//   - Deduplicates customers by phone before sync (prevents arbitrary selection)
//   - Keeps primary customer (highest transaction_count)
//   - Logs warnings when duplicates are found for monitoring
// v1.4 (2026-02-03): Reliability improvements
//   - Reduced CONCURRENCY from 10 to 5 (prevents silent failures)
//   - Added response verification (check status === '1')
//   - Added 100ms delays between API calls within syncCustomer
// v1.3 (2026-02-03): Parallel processing optimization
//   - Process 10 customers concurrently (10x faster)
//   - Reduced sync time from ~60 min to ~6 min
// v1.2 (2026-02-03): Added saldo_carteira custom field sync
//   - Sync saldo_carteira from Supabase to WhatChimp "saldo_carteira" field
//   - Uses assign-custom-fields endpoint (safe, doesn't affect labels)
// v1.1 (2026-02-02): Fixed label replacement bug
//   - Use remove-labels + assign-labels instead of update with label_ids
//   - Prevents label accumulation when customer segments change
// v1.0 (2026-02-02): Initial implementation

const { createClient } = require('@supabase/supabase-js');

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
    throw new Error('Supabase credentials not configured');
  }
  return createClient(url, key);
}

// WhatChimp API wrapper
async function whatChimpRequest(endpoint, params = {}) {
  const apiKey = process.env.WHATCHIMP_API_KEY || process.env.WhatChimp_API_KEY;
  const phoneNumberId = process.env.WHATCHIMP_PHONE_NUMBER_ID || process.env.META_WHATSAPP_PHONE_ID;

  if (!apiKey || !phoneNumberId) {
    throw new Error('WhatChimp credentials not configured');
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
async function syncCustomer(customer) {
  const phone = customer.normalized_phone.replace(/\D/g, '');
  const labelIds = getCustomerLabelIds(customer);
  const saldo = customer.saldo_carteira != null ? String(customer.saldo_carteira) : '0.00';

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

// Main handler
exports.handler = async (event, context) => {
  console.log('WhatChimp Sync started at', new Date().toISOString());

  const startTime = Date.now();
  const supabase = getSupabaseClient();

  try {
    // Get all customers with valid phone
    const { data: customers, error } = await supabase
      .from('customer_summary')
      .select('doc, nome, normalized_phone, rfm_segment, risk_level, saldo_carteira, transaction_count')
      .not('normalized_phone', 'is', null);

    if (error) {
      console.error('Failed to fetch customers:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch customers', details: error.message })
      };
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

    // Parallel processing configuration
    // Note: 10 concurrent was too aggressive - WhatChimp silently drops requests
    const CONCURRENCY = 5;

    if (duplicates.length > 0) {
      console.log(`Found ${duplicates.length} duplicate phones - using primary customer for each`);
      duplicates.forEach(d => {
        console.log(`  ${d.phone}: Syncing ${d.kept.nome} (${d.kept.txns} txns), skipping ${d.skipped.nome}`);
      });
    }
    console.log(`Processing ${eligibleCustomers.length} customers (${blacklistedPhones.size} blacklisted, ${CONCURRENCY} concurrent)`);

    const results = {
      total: eligibleCustomers.length,
      created: 0,
      updated: 0,
      failed: 0
    };

    // Process customers in parallel batches
    for (let i = 0; i < eligibleCustomers.length; i += CONCURRENCY) {
      const batch = eligibleCustomers.slice(i, i + CONCURRENCY);

      const batchResults = await Promise.all(
        batch.map(async (customer) => {
          try {
            return await syncCustomer(customer);
          } catch (err) {
            console.error(`Failed to sync ${customer.normalized_phone}:`, err.message);
            return { success: false };
          }
        })
      );

      for (const result of batchResults) {
        if (result.success) {
          if (result.action === 'created') results.created++;
          else if (result.action === 'updated') results.updated++;
        } else {
          results.failed++;
        }
      }

      // Log progress every 100 customers
      const processed = Math.min(i + CONCURRENCY, eligibleCustomers.length);
      if (processed % 100 === 0 || processed === eligibleCustomers.length) {
        console.log(`Progress: ${processed}/${eligibleCustomers.length}`);
      }

      // Small delay between batches
      if (i + CONCURRENCY < eligibleCustomers.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`WhatChimp Sync completed in ${duration}s:`, results);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        duration_seconds: duration,
        summary: results
      })
    };
  } catch (err) {
    console.error('WhatChimp Sync error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Sync failed', details: err.message })
    };
  }
};
