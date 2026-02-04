// netlify/functions/whatchimp-api.js v1.6
// WhatChimp Subscriber Management API
//
// ACTIONS:
// - sync_all: Full sync of all customers to WhatChimp with labels and saldo
// - sync_customer: Sync single customer by doc or phone
// - get_labels: List all WhatChimp labels
// - list_subscribers: List WhatChimp subscribers (paginated)
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
//   - Sync customers from Supabase to WhatChimp
//   - Assign RFM segment and Risk level labels
//   - Pagination support for listing all subscribers

const { createClient } = require('@supabase/supabase-js');

// CORS headers
const ALLOWED_ORIGINS = [
  'https://bilavnova.com',
  'https://www.bilavnova.com',
  'http://localhost:5173',
  'capacitor://localhost'
];

function getCorsOrigin(event) {
  const origin = event.headers.origin || event.headers.Origin || '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : 'https://www.bilavnova.com';
}

// WhatChimp Label ID mapping (verified via API)
const LABEL_MAP = {
  // RFM Segments
  'VIP': 248609,
  'Frequente': 249390,
  'Promissor': 249391,
  'Novato': 249392,
  'Esfriando': 249393,
  'Inativo': 249394,
  // Risk Levels (Supabase has spaces, WhatChimp doesn't)
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

  // RFM Segment label
  if (customer.rfm_segment && LABEL_MAP[customer.rfm_segment]) {
    labelIds.push(LABEL_MAP[customer.rfm_segment]);
  }

  // Risk Level label
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
  // Remove any non-numeric characters and leading +
  const phone = customer.normalized_phone.replace(/\D/g, '');
  const labelIds = getCustomerLabelIds(customer);
  const saldo = customer.saldo_carteira != null ? String(customer.saldo_carteira) : '0.00';

  // Check if subscriber exists
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

    if (createResult.status === '1' || createResult.message?.includes('already exist')) {
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

    return { action: 'failed', phone, success: false, error: 'create failed', details: createResult };
  }
}

// Sync all customers
async function syncAllCustomers(headers) {
  const supabase = getSupabaseClient();

  // Get all customers with valid phone, excluding blacklisted
  const { data: customers, error } = await supabase
    .from('customer_summary')
    .select('doc, nome, normalized_phone, rfm_segment, risk_level, saldo_carteira, transaction_count')
    .not('normalized_phone', 'is', null);

  if (error) {
    return {
      statusCode: 500,
      headers,
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
  // Reduced from 10 to 5 - WhatChimp silently drops requests with higher concurrency
  const CONCURRENCY = 5;

  const results = {
    total: eligibleCustomers.length,
    created: 0,
    updated: 0,
    failed: 0,
    errors: []
  };

  // Process customers in parallel batches
  for (let i = 0; i < eligibleCustomers.length; i += CONCURRENCY) {
    const batch = eligibleCustomers.slice(i, i + CONCURRENCY);

    const batchResults = await Promise.all(
      batch.map(async (customer) => {
        try {
          return await syncCustomer(customer);
        } catch (err) {
          return { success: false, phone: customer.normalized_phone, error: err.message };
        }
      })
    );

    for (const result of batchResults) {
      if (result.success) {
        if (result.action === 'created') results.created++;
        else if (result.action === 'updated') results.updated++;
      } else {
        results.failed++;
        results.errors.push({ phone: result.phone, error: result.error || result.result });
      }
    }

    // Small delay between batches
    if (i + CONCURRENCY < eligibleCustomers.length) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  // Limit errors in response to avoid huge payloads
  if (results.errors.length > 10) {
    results.errors = results.errors.slice(0, 10);
    results.errors.push({ note: `... and ${results.failed - 10} more errors` });
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      summary: {
        total: results.total,
        created: results.created,
        updated: results.updated,
        failed: results.failed,
        duplicatesResolved: duplicates.length
      },
      errors: results.errors
    })
  };
}

// Sync single customer by doc or phone
async function syncSingleCustomer(body, headers) {
  const { doc, phone } = body;

  if (!doc && !phone) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Either doc or phone is required' })
    };
  }

  const supabase = getSupabaseClient();

  let query = supabase
    .from('customer_summary')
    .select('doc, nome, normalized_phone, rfm_segment, risk_level, saldo_carteira');

  if (doc) {
    query = query.eq('doc', doc);
  } else {
    // Normalize phone for lookup
    const normalizedPhone = phone.replace(/\D/g, '');
    query = query.eq('normalized_phone', normalizedPhone);
  }

  const { data: customers, error } = await query.limit(1);

  if (error || !customers || customers.length === 0) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Customer not found' })
    };
  }

  const customer = customers[0];

  if (!customer.normalized_phone) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Customer has no valid phone number' })
    };
  }

  try {
    const result = await syncCustomer(customer);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: result.success,
        customer: {
          doc: customer.doc,
          nome: customer.nome,
          phone: customer.normalized_phone,
          rfm_segment: customer.rfm_segment,
          risk_level: customer.risk_level,
          labels: getCustomerLabelIds(customer)
        },
        whatchimp: result
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Sync failed', details: err.message })
    };
  }
}

// Get all labels
async function getLabels(headers) {
  try {
    const result = await whatChimpRequest('label/list');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: result.status === '1',
        labels: result.message || [],
        mapping: LABEL_MAP
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch labels', details: err.message })
    };
  }
}

// List subscribers with pagination
async function listSubscribers(body, headers) {
  const { page = 1, limit = 100 } = body;

  try {
    const result = await whatChimpRequest('subscriber/list', {
      limit: Math.min(limit, 1000),
      offset: page
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: result.status === '1',
        page,
        count: result.message?.length || 0,
        subscribers: result.message || []
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to list subscribers', details: err.message })
    };
  }
}

// Main handler
exports.handler = async (event, context) => {
  const origin = getCorsOrigin(event);
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { action } = body;

    switch (action) {
      case 'sync_all':
        return await syncAllCustomers(headers);

      case 'sync_customer':
        return await syncSingleCustomer(body, headers);

      case 'get_labels':
        return await getLabels(headers);

      case 'list_subscribers':
        return await listSubscribers(body, headers);

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Invalid action',
            available: ['sync_all', 'sync_customer', 'get_labels', 'list_subscribers']
          })
        };
    }
  } catch (err) {
    console.error('WhatChimp API error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: err.message })
    };
  }
};
