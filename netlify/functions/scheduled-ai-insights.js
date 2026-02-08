// netlify/functions/scheduled-ai-insights.js v2.2 - MEDIUM SEVERITY FIXES
// Generates daily AI insights — delegates context gathering to ai-insights.js
// Scheduled to run daily at 6am Brazil time (9am UTC)
//
// CHANGELOG:
// v2.2 (2026-02-06): Medium severity fixes
//   - 'Today' check uses Brazil timezone (America/Sao_Paulo) instead of UTC
// v2.1 (2026-02-06): High severity fixes
//   - Supabase singleton (reused across warm invocations, matches ai-insights.js)
//   - Single retry on transient failure (OpenAI timeout, rate limit)
// v2.0 (2026-02-06): Simplified — delegates to ai-insights.js for context gathering
//   - Removed local gatherContext() (now in ai-insights.js)
//   - Sends only insightType, server gathers context from Supabase
//   - Handles { skipped: true } response for insufficient data
// v1.0 (2026-02-06): Initial implementation
//   - Gathers weekly business context from Supabase
//   - Generates daily summary insight
//   - Checks for revenue anomalies

const { createClient } = require('@supabase/supabase-js');

// Schedule: daily at 9am UTC (6am Brazil)
exports.config = {
  schedule: '0 9 * * *'
};

// Supabase singleton (reused across warm invocations)
let supabaseInstance = null;
function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
  }
  return supabaseInstance;
}

// Get Brazil date string (YYYY-MM-DD) — same pattern as ai-insights.js / dateUtils.js
function getBrazilDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}

// Call ai-insights handler and parse response
async function callAiInsights() {
  const aiInsightsHandler = require('./ai-insights').handler;
  const result = await aiInsightsHandler({
    httpMethod: 'POST',
    body: JSON.stringify({ insightType: 'weekly_summary' })
  });
  return { statusCode: result.statusCode, body: JSON.parse(result.body) };
}

exports.handler = async function(event) {
  if (!process.env.OPENAI_API_KEY) {
    console.log('OPENAI_API_KEY not configured, skipping AI insights');
    return { statusCode: 200, body: 'Skipped: no API key' };
  }

  const supabase = getSupabase();

  try {
    // Check if we already generated today (Brazil timezone)
    const today = getBrazilDate();
    const { data: existing } = await supabase
      .from('ai_insight_log')
      .select('id')
      .eq('insight_type', 'weekly_summary')
      .gte('created_at', `${today}T00:00:00Z`)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log('Already generated insight today, skipping');
      return { statusCode: 200, body: 'Already generated today' };
    }

    // Attempt 1
    let response;
    try {
      response = await callAiInsights();
    } catch (firstError) {
      // Single retry after 2s delay (covers transient OpenAI timeouts / rate limits)
      console.warn('AI insight attempt 1 failed, retrying in 2s:', firstError.message);
      await new Promise(r => setTimeout(r, 2000));
      response = await callAiInsights();
    }

    if (response.body.skipped) {
      console.log('AI insight skipped: insufficient data');
      return { statusCode: 200, body: 'Skipped: insufficient data' };
    }

    console.log('AI insight generated:', response.statusCode);
    return { statusCode: 200, body: 'Insight generated successfully' };
  } catch (error) {
    console.error('Scheduled AI insights failed after retry:', error);
    return { statusCode: 500, body: error.message };
  }
};
