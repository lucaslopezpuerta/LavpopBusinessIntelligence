// scripts/whatchimp-clean-blacklist.js v1.0
// Deletes blacklisted subscribers from WhatChimp
// Uses subscriber/delete endpoint
//
// Usage:
//   node scripts/whatchimp-clean-blacklist.js           # Delete all blacklisted
//   node scripts/whatchimp-clean-blacklist.js --dry     # Dry run (no deletions)
//   node scripts/whatchimp-clean-blacklist.js --limit 10  # Delete up to 10

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry');
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

async function main() {
  console.log('='.repeat(60));
  console.log('WhatChimp Blacklist Cleanup');
  console.log('='.repeat(60));

  if (DRY_RUN) {
    console.log('MODE: DRY RUN (no deletions will be made)\n');
  }

  const supabase = getSupabaseClient();

  // Get all blacklisted phone numbers
  const { data: blacklist, error } = await supabase
    .from('blacklist')
    .select('phone, reason');

  if (error) {
    console.error('Failed to fetch blacklist:', error);
    process.exit(1);
  }

  console.log(`Found ${blacklist.length} blacklisted numbers\n`);

  if (blacklist.length === 0) {
    console.log('No blacklisted numbers to clean.');
    return;
  }

  // Apply limit if specified
  const toDelete = LIMIT ? blacklist.slice(0, LIMIT) : blacklist;
  console.log(`Processing ${toDelete.length} numbers...\n`);

  const results = {
    deleted: 0,
    notFound: 0,
    failed: 0,
    errors: []
  };

  for (let i = 0; i < toDelete.length; i++) {
    const entry = toDelete[i];
    // Normalize phone - remove + and non-numeric characters
    const phone = entry.phone.replace(/\D/g, '');

    if (DRY_RUN) {
      console.log(`[DRY] Would delete: ${phone} (${entry.reason || 'no reason'})`);
      results.deleted++;
      continue;
    }

    // Check if subscriber exists first
    const existing = await whatChimpRequest('subscriber/get', { phone_number: phone });

    if (existing.status !== '1' || !existing.message?.length) {
      results.notFound++;
      continue;
    }

    // Delete the subscriber
    const deleteResult = await whatChimpRequest('subscriber/delete', {
      phone_number: phone
    });

    if (deleteResult.status === '1') {
      results.deleted++;
      console.log(`Deleted: ${phone}`);
    } else {
      results.failed++;
      results.errors.push({ phone, error: deleteResult.message });
      console.log(`Failed: ${phone} - ${deleteResult.message}`);
    }

    // Progress indicator
    if ((i + 1) % 20 === 0) {
      console.log(`Progress: ${i + 1}/${toDelete.length}`);
    }

    // Small delay between requests
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\n' + '='.repeat(60));
  console.log('CLEANUP COMPLETE');
  console.log('='.repeat(60));
  console.log(`Deleted: ${results.deleted}`);
  console.log(`Not found in WhatChimp: ${results.notFound}`);
  console.log(`Failed: ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.slice(0, 10).forEach(e => {
      console.log(`  ${e.phone}: ${e.error}`);
    });
  }

  if (DRY_RUN) {
    console.log('\nThis was a DRY RUN. No deletions were made.');
    console.log('Run without --dry flag to perform actual deletions.');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
