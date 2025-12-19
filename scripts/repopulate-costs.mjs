// Script to repopulate twilio_daily_costs from Twilio API
// Run with: node scripts/repopulate-costs.mjs

const baseUrl = 'http://localhost:8888/.netlify/functions/twilio-whatsapp';

async function repopulateCosts() {
  const costsByDay = {};
  let pageToken = null;
  let totalProcessed = 0;

  console.log('Fetching Twilio messages...');

  // Fetch all pages
  do {
    const body = {
      action: 'fetch_messages',
      dateSentAfter: '2024-01-01',
      pageSize: 500
    };
    if (pageToken) body.pageToken = pageToken;

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!data.success) {
      console.error('Fetch failed:', data.error);
      break;
    }

    // Process messages for cost aggregation
    for (const msg of data.blacklistCandidates?.allMessages || []) {
      // Parse RFC 2822 date to YYYY-MM-DD
      const date = new Date(msg.dateSent);
      if (isNaN(date.getTime())) continue;
      const dateKey = date.toISOString().split('T')[0];

      if (!costsByDay[dateKey]) {
        costsByDay[dateKey] = {
          outbound: { count: 0, cost: 0 },
          inbound: { count: 0, cost: 0 },
          currency: msg.priceUnit || 'USD'
        };
      }

      const direction = msg.direction?.startsWith('outbound') ? 'outbound' : 'inbound';
      costsByDay[dateKey][direction].count++;
      costsByDay[dateKey][direction].cost += msg.price || 0;
    }

    totalProcessed += data.summary?.totalFetched || 0;
    console.log(`Processed ${totalProcessed} messages, ${Object.keys(costsByDay).length} days`);

    // Check for more pages
    pageToken = data.pagination?.nextPageToken;

    if (totalProcessed >= 5000) {
      console.log('Reached 5000 message limit');
      break;
    }
  } while (pageToken);

  console.log('\nCosts by day:');
  for (const [date, costs] of Object.entries(costsByDay).sort()) {
    console.log(`  ${date}: out=${costs.outbound.count} ($${costs.outbound.cost.toFixed(4)}), in=${costs.inbound.count} ($${costs.inbound.cost.toFixed(4)})`);
  }

  // Store costs (using freshLoad for fast batch insert)
  console.log('\nStoring costs to database (fresh load mode)...');
  const storeResponse = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'store_costs',
      costsByDay,
      freshLoad: true
    })
  });

  const storeResult = await storeResponse.json();
  console.log('Store result:', JSON.stringify(storeResult, null, 2));

  // Verify
  console.log('\nVerifying stored data...');
  const verifyResponse = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'get_stored_data',
      dateFrom: '2024-01-01'
    })
  });

  const verifyResult = await verifyResponse.json();
  console.log('Verification - Cost summary:', JSON.stringify(verifyResult.costSummary, null, 2));
  console.log('Total days in DB:', verifyResult.dailyCosts?.length || 0);
}

repopulateCosts().catch(console.error);
