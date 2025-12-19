// Backfill inbound messages to twilio_inbound_messages table
// Run with: node scripts/backfill-inbound.mjs

const baseUrl = 'http://localhost:8888/.netlify/functions/twilio-whatsapp';

async function backfill() {
  let totalStored = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let pageToken = null;
  let page = 0;

  console.log('Backfilling inbound messages from 2025-12-10...\n');

  do {
    page++;
    console.log(`Fetching page ${page}...`);

    const fetchBody = {
      action: 'fetch_messages',
      dateSentAfter: '2025-12-10',
      pageSize: 500
    };
    if (pageToken) fetchBody.pageToken = pageToken;

    const fetchRes = await fetch(baseUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(fetchBody)
    });
    const fetchData = await fetchRes.json();

    if (!fetchData.success) {
      console.error('Fetch failed:', fetchData.error);
      break;
    }

    const inbound = fetchData.blacklistCandidates?.inboundMessages || [];
    console.log(`  Found ${inbound.length} inbound messages`);

    if (inbound.length > 0) {
      const storeRes = await fetch(baseUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action: 'store_engagement', engagements: inbound})
      });
      const storeData = await storeRes.json();
      console.log(`  Stored: ${storeData.stored}, Updated: ${storeData.updated}, Skipped: ${storeData.skipped}`);
      if (storeData.errors) {
        console.log(`  Errors:`, storeData.errors.slice(0, 3));
      }
      totalStored += storeData.stored || 0;
      totalUpdated += storeData.updated || 0;
      totalSkipped += storeData.skipped || 0;
    }

    pageToken = fetchData.pagination?.nextPageToken;
  } while (pageToken);

  console.log('\n=== BACKFILL COMPLETE ===');
  console.log('Total stored:', totalStored);
  console.log('Total updated:', totalUpdated);
  console.log('Total skipped:', totalSkipped);
}

backfill().catch(console.error);
