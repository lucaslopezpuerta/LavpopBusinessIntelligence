// netlify/functions/ai-insights.js v3.8 - PRE-COMPUTE AT-RISK RECOVERY
// Generates AI-powered business insights using OpenAI GPT-4o
// Context gathered from Supabase — frontend sends only insightType
//
// CHANGELOG:
// v3.8 (2026-02-07): Pre-compute at-risk recovery potential server-side
//   - atRiskRecoveryPotential calculated in buildPrompt (10% × atRisk × spend × 4)
//   - Eliminates GPT multi-step math errors (wrote ×4 but computed without it)
//   - Both recovery potentials now pre-computed and tagged [INCREMENTAL]
// v3.7 (2026-02-07): Fix existing vs incremental revenue logic error
//   - New rule: distinguish EXISTENTE (already flowing) from INCREMENTAL (new with action)
//   - EXEMPLO BOM updated: labels existing revenue as "não é ganho novo"
//   - Derived metrics tagged [EXISTENTE]/[INCREMENTAL] to prevent miscomparison
// v3.6 (2026-02-06): Switch to gpt-4o for better instruction following + cost savings
//   - gpt-4-turbo-preview → gpt-4o (4x cheaper, faster, different topic biases)
// v3.5 (2026-02-06): Fix topic bias, vague adjectives, math unit errors
//   - Random 2-3 question selection per day (not all 4) — breaks topic bias
//   - Broader vague language ban: adjective class rule, not 3-word list
//   - Explicit unit tracking: every R$ must have /semana or /mês label
//   - EXEMPLO BOM updated with unit-labeled step-by-step calculation
// v3.4 (2026-02-06): Fix diversity, math opacity, description clipping
//   - Shuffle analytical questions with day-based seed (fixes Q4 always winning)
//   - Enrich Q1-Q3 with R$ values for concreteness parity
//   - Add math transparency rule: "Mostre cálculos: [dado] × [fator] = R$"
//   - Change "3-5 frases" → "2-4 frases densas" in JSON schema
// v3.3 (2026-02-06): Fix few-shot contamination + add per-segment revenue data
//   - Defused example: placeholder values so GPT copies structure, not numbers
//   - Added get_segment_weekly_revenue() RPC — real per-segment R$/week data
//   - Prompt now includes VIP R$27/wk, Frequente R$16/wk etc. from actual DB
//   - GPT can no longer fabricate R$ values by copying from the example
// v3.2 (2026-02-06): Fix customer counts capped at 1000 by Supabase row limit
//   - Replaced .from('customers').select().limit(5000) with RPC get_customer_segment_counts()
//   - RPC does GROUP BY server-side, returns accurate totals (2082 vs 1000 before)
//   - No more client-side counting — all segment counts from single RPC call
// v3.1 (2026-02-06): Few-shot examples + self-verification prompt engineering
//   - Good/bad example in system prompt forces R$ calculations over vague language
//   - Self-validation step: GPT checks output for ≥2 calculated R$ values
//   - Anti-vague-language rule: explicit ban on "considerável", "significativo" etc.
//   - Temperature lowered 0.7 → 0.4 for more analytical output
// v3.0 (2026-02-06): Prompt engineering overhaul — real analysis, not paraphrasing
//   - System prompt: anti-paraphrasing rules, cross-referencing guidance, financial impact
//   - buildPrompt: pre-computed derived metrics (ticket médio, ROI, recovery potential, volatility)
//   - Analytical questions that force cross-referencing between data sections
//   - Bumped MAX_PROMPT_CHARS to 5000 for richer prompt with derived metrics
// v2.5 (2026-02-06): Fix prompt spacing in buildPrompt()
//   - Array-based section building eliminates empty lines from falsy conditionals
//   - Consistent double-newline separation between sections
//   - Conditional sections (top campaigns, daily trend) only appear when data exists
// v2.4 (2026-02-06): Fix snoozed/dismissed recommendations not reappearing
//   - Upsert now sets dismissed_at: null, snoozed_until: null to ensure freshly
//     generated insights always appear in active_recommendations view
// v2.3 (2026-02-06): Medium severity fixes
//   - contact_tracking query uses Brazil date instead of UTC Date.now() math
//   - DB saves (log + recommendation) wrapped in try/catch — returns insight even if save fails
//   - Removed unused exports.gatherContext (scheduled function calls handler directly)
// v2.2 (2026-02-06): High severity fixes
//   - Customers query safety cap (.limit(5000))
//   - Prompt length guard (truncates to ~4000 chars to stay within token budget)
//   - Default case prompt truncated (no raw JSON.stringify of full context)
// v2.1 (2026-02-06): Security hardening from code review
//   - Added X-Api-Key authentication (same as supabase-api.js)
//   - Added strict rate limiting (10 req/min via shared rateLimit.js)
//   - Sanitized error responses (no OpenAI internals leaked)
//   - insightType validated against whitelist
//   - OpenAI fetch with 15s timeout via AbortController
//   - Brazil timezone for date calculations (America/Sao_Paulo)
// v2.0 (2026-02-06): Server-side Supabase context gathering
//   - Added gatherContext() with 5 parallel Supabase queries
//   - Context validation gate: skip OpenAI if no data
//   - Dynamic ai_confidence based on data completeness
//   - Richer prompt with revenue trend, customer segments, campaign ROI, weather
//   - Frontend no longer sends metrics (just insightType)
// v1.0 (2026-02-06): Initial implementation
//   - Supports weekly_summary, churn_analysis, anomaly_explanation
//   - Saves insights to recommendations table
//   - Tracks API usage in ai_insight_log

const { createClient } = require('@supabase/supabase-js');
const { checkRateLimit, getRateLimitHeaders, rateLimitResponse } = require('./utils/rateLimit');

// Allowed insight types (whitelist)
const ALLOWED_INSIGHT_TYPES = ['weekly_summary', 'churn_analysis', 'anomaly_explanation'];

const INSIGHT_TYPES = {
  WEEKLY_SUMMARY: 'weekly_summary',
  CHURN_ANALYSIS: 'churn_analysis',
  ANOMALY_EXPLANATION: 'anomaly_explanation'
};

// Context fields used for confidence calculation
const CONFIDENCE_FIELDS = [
  'weeklyRevenue', 'lastWeekRevenue', 'weeklyTransactions',
  'totalCustomers', 'healthyCount', 'atRiskCount', 'churningCount', 'vipCount',
  'campaignsSent', 'campaignsDelivered', 'campaignReturns',
  'revenueRecovered'
];

// OpenAI fetch timeout (15 seconds — Netlify function timeout is 26s on paid)
const OPENAI_TIMEOUT_MS = 15000;

// Max prompt characters (~5000 chars ≈ ~1250 tokens, well within GPT-4-turbo 128K limit)
const MAX_PROMPT_CHARS = 5000;

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://bilavnova.com',
  'https://www.bilavnova.com',
  'https://localhost',           // Capacitor Android
  'capacitor://localhost',       // Capacitor iOS
  'http://localhost:5173',       // Local dev (Vite)
  'http://localhost:5174',       // Local dev alt port
  'http://localhost:8888'        // Netlify dev
];

function getCorsOrigin(event) {
  const origin = event.headers?.origin || event.headers?.Origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  return 'https://www.bilavnova.com';
}

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

// Validate API key (same pattern as supabase-api.js)
function validateApiKey(event) {
  const apiKey = event.headers['x-api-key'] || event.headers['X-Api-Key'];
  const API_SECRET = process.env.API_SECRET_KEY;
  if (!API_SECRET) {
    console.error('[AI Insights] API_SECRET_KEY not configured');
    return false;
  }
  return apiKey === API_SECRET;
}

// Sanitize error messages — never expose OpenAI internals to client
function sanitizeError(error) {
  console.error('[AI Insights] Full error:', error);

  const msg = error.message || '';
  if (msg.includes('rate limit') || msg.includes('429')) {
    return 'Serviço de IA temporariamente indisponível. Tente novamente em alguns minutos.';
  }
  if (msg.includes('insufficient_quota') || msg.includes('billing')) {
    return 'Serviço de análise IA temporariamente indisponível.';
  }
  if (msg.includes('timeout') || msg.includes('abort')) {
    return 'A análise demorou muito. Tente novamente.';
  }
  return 'Erro ao gerar análise. Tente novamente mais tarde.';
}

// Get Brazil date string (YYYY-MM-DD) accounting for timezone
function getBrazilDate(daysAgo = 0) {
  const now = new Date();
  // Format in Brazil timezone to get the correct date
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(now).split('-');
  const brazilDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  brazilDate.setDate(brazilDate.getDate() - daysAgo);
  return brazilDate.toISOString().split('T')[0];
}

exports.handler = async function(event) {
  const corsOrigin = getCorsOrigin(event);
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // ==================== AUTHENTICATION ====================
  // Allow internal calls from scheduled-ai-insights (no event headers)
  const isInternalCall = !event.headers || Object.keys(event.headers).length === 0;
  if (!isInternalCall && !validateApiKey(event)) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  // ==================== RATE LIMITING ====================
  // Strict: 10 requests per minute (OpenAI is expensive)
  if (!isInternalCall) {
    const rateLimit = await checkRateLimit(event, 'ai-insights', 'strict');
    if (!rateLimit.allowed) {
      return rateLimitResponse(headers, rateLimit);
    }
    Object.assign(headers, getRateLimitHeaders(rateLimit, 'strict'));
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'AI service not configured' }) };
  }

  const supabase = getSupabase();

  // ==================== PARSE & VALIDATE INPUT ====================
  let insightType, context;
  try {
    const body = JSON.parse(event.body);
    insightType = body.insightType;
    context = body.context; // Optional: if provided (by scheduled function), use it
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  if (!insightType || !ALLOWED_INSIGHT_TYPES.includes(insightType)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid insightType' }) };
  }

  // Gather context from Supabase if not provided
  if (!context) {
    try {
      context = await gatherContext(supabase);
    } catch (err) {
      console.error('[AI Insights] Failed to gather context:', err);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to gather business context' }) };
    }
  }

  // Validation gate: skip OpenAI if insufficient data
  const hasRevenue = (context.weeklyRevenue || 0) > 0 || (context.lastWeekRevenue || 0) > 0;
  const hasCustomers = (context.totalCustomers || 0) > 0;
  if (!hasRevenue && !hasCustomers) {
    console.log('[AI Insights] Insufficient data, skipping');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ skipped: true, reason: 'insufficient_data' })
    };
  }

  // Calculate dynamic confidence based on data completeness
  const filledFields = CONFIDENCE_FIELDS.filter(f => context[f] != null && context[f] > 0).length;
  const aiConfidence = Math.max(0.30, Math.round((filledFields / CONFIDENCE_FIELDS.length) * 90) / 100);

  // Build the prompt (truncated to stay within token budget)
  let prompt = buildPrompt(insightType, context);
  if (prompt.length > MAX_PROMPT_CHARS) {
    prompt = prompt.substring(0, MAX_PROMPT_CHARS) + '\n\n[Dados truncados por limite de tamanho]';
  }
  const systemPrompt = `Você é um consultor sênior de negócios para Bilavnova, uma lavanderia self-service em Caxias do Sul, RS.

REGRAS CRÍTICAS:
- NÃO repita ou parafraseie os números enviados. O dono já os vê no painel.
- Foque em CONEXÕES entre os dados que não são óbvias à primeira vista.
- NUNCA use adjetivos vagos para descrever valores (ex: significativo, considerável, expressivo, importante, substancial, relevante). Substitua SEMPRE por um número R$ calculado.
- SEMPRE mostre cálculos com unidades: [N] clientes × R$[X]/semana × 4 semanas = R$[Y]/mês. Nunca omita se é /semana ou /mês.
- Toda recomendação deve ter: QUEM segmentar, O QUE fazer, e QUANTO esperar em R$.
- Distingua receita EXISTENTE (que já entra sem ação) de receita INCREMENTAL (ganho novo com ação). Nunca compare o total de um segmento ativo contra o potencial de recuperação — compare apenas ganhos incrementais entre opções.
- Português do Brasil.

EXEMPLO RUIM (não faça):
"A receita subiu 31% e os VIPs contribuem com receita considerável. A base de clientes está crescendo."
→ Problema: repete variação do painel, usa "considerável" em vez de calcular, não compara segmentos.

EXEMPLO BOM (faça assim):
"Os [N] VIPs já geram R$[total]/mês (receita existente — não é ganho novo). Recuperar 10% dos [N] em risco: [N]×0.1 = [X] clientes × R$[valor]/semana × 4 = +R$[total]/mês de receita NOVA. Isso é [X]% a mais sobre a receita atual. Priorize em risco — taxa de retorno de campanhas é [X]%."
→ Correto: distingue EXISTENTE de INCREMENTAL. SEMPRE inclui /semana ou /mês em cada R$. Mostra cálculo passo a passo.
IMPORTANTE: Use SOMENTE os números dos dados abaixo. NUNCA invente valores.

AUTOVALIDAÇÃO: Antes de responder, confirme que seu texto contém pelo menos 2 valores R$ calculados dos dados fornecidos. Se não contém, reescreva.

Responda em JSON:
{
  "title": "Insight não óbvio (max 60 chars)",
  "description": "2-4 frases densas: (1) oportunidade oculta com R$ calculado, (2) comparação entre segmentos, (3) ação com resultado esperado. Mostre a conta.",
  "actionLabel": "Verbo + objeto (max 20 chars)",
  "actionType": "create_campaign|view_customers|view_dashboard",
  "priority": 7
}`;

  try {
    // Call OpenAI API with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

    let response;
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens: 1024,
          temperature: 0.4,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ]
        })
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      // Log full error server-side, throw generic message
      const errBody = await response.text();
      console.error(`[AI Insights] OpenAI error ${response.status}:`, errBody);
      throw new Error(`OpenAI request failed with status ${response.status}`);
    }

    const completion = await response.json();
    const content = completion.choices[0].message.content;
    const usage = completion.usage || {};

    // Parse structured response
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        title: content.substring(0, 60),
        description: content,
        actionLabel: 'Ver Detalhes',
        actionType: 'view_dashboard',
        priority: 7
      };
    }

    // Calculate cost (GPT-4-turbo pricing)
    const inputCost = (usage.prompt_tokens || 0) * 0.00001;
    const outputCost = (usage.completion_tokens || 0) * 0.00003;
    const totalCost = inputCost + outputCost;

    // Build recommendation object
    // IMPORTANT: Reset snoozed_until/dismissed_at so freshly generated insights always appear
    const fingerprint = `AI-${insightType}-${getBrazilDate()}`;
    const recommendation = {
      rule_id: `AI-${insightType.toUpperCase()}`,
      category: 'ai_insight',
      icon: '🤖',
      title: parsed.title || 'Insight da IA',
      description: parsed.description || content,
      action_type: parsed.actionType || 'view_dashboard',
      action_label: parsed.actionLabel || 'Ver Detalhes',
      action_data: { insightType },
      priority: parsed.priority || 7,
      ai_generated: true,
      ai_model: 'gpt-4-turbo',
      ai_confidence: aiConfidence,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      fingerprint,
      dismissed_at: null,
      snoozed_until: null
    };

    // Persist to DB (best-effort — return insight to client even if DB save fails)
    let dbError = null;
    try {
      await Promise.all([
        supabase.from('ai_insight_log').insert({
          insight_type: insightType,
          prompt_tokens: usage.prompt_tokens || 0,
          completion_tokens: usage.completion_tokens || 0,
          model: 'gpt-4o',
          cost_usd: totalCost,
          success: true
        }),
        supabase
          .from('recommendations')
          .upsert(recommendation, { onConflict: 'fingerprint' })
      ]);
    } catch (saveErr) {
      console.error('[AI Insights] DB save failed (insight still returned):', saveErr.message);
      dbError = 'Insight gerado, mas não foi salvo no banco';
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        recommendation,
        ...(dbError && { warning: dbError }),
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          costUsd: totalCost.toFixed(4)
        }
      })
    };
  } catch (error) {
    // Log failure to DB (best-effort)
    await supabase.from('ai_insight_log').insert({
      insight_type: insightType,
      model: 'gpt-4o',
      success: false,
      error_message: error.message
    }).catch(() => {});

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: sanitizeError(error) })
    };
  }
};

// ============================================
// GATHER CONTEXT FROM SUPABASE
// ============================================

async function gatherContext(supabase) {
  const today = getBrazilDate();
  const weekAgo = getBrazilDate(7);
  const twoWeeksAgo = getBrazilDate(14);
  const monthAgo = getBrazilDate(30);

  // Run 6 queries in parallel for speed
  const [revenueResult, segmentCountsResult, segmentRevenueResult, campaignsResult, topCampaignsResult, trendResult] = await Promise.all([
    // Query 1: Revenue (last 14 days for this week vs last week comparison)
    supabase
      .from('daily_revenue')
      .select('date, total_revenue, transactions, washes, drys, coupon_uses')
      .gte('date', twoWeeksAgo)
      .lte('date', today),

    // Query 2: Customer segment counts via RPC (avoids Supabase 1000-row default limit)
    supabase.rpc('get_customer_segment_counts'),

    // Query 3: Per-segment weekly revenue via RPC (real data for GPT calculations)
    supabase.rpc('get_segment_weekly_revenue'),

    // Query 4: Campaign performance (last 7 days, Brazil timezone boundary)
    supabase
      .from('contact_tracking')
      .select('delivery_status, status, return_revenue, days_to_return')
      .gte('contacted_at', `${weekAgo}T00:00:00-03:00`),

    // Query 5: Top campaigns (last 30 days)
    supabase
      .from('campaign_performance')
      .select('name, return_rate, delivery_rate, total_revenue_recovered')
      .gte('last_sent_at', monthAgo)
      .order('total_revenue_recovered', { ascending: false })
      .limit(3),

    // Query 6: Daily trend (last 7 days)
    supabase
      .from('daily_revenue')
      .select('date, total_revenue, transactions')
      .gte('date', weekAgo)
      .order('date', { ascending: false })
  ]);

  // Process revenue data
  const revenueRows = revenueResult?.data || [];

  let weeklyRevenue = 0, lastWeekRevenue = 0, weeklyTransactions = 0, weeklyServices = 0, weeklyCouponUses = 0;
  for (const row of revenueRows) {
    if (row.date >= weekAgo) {
      weeklyRevenue += parseFloat(row.total_revenue || 0);
      weeklyTransactions += parseInt(row.transactions || 0);
      weeklyServices += parseInt(row.washes || 0) + parseInt(row.drys || 0);
      weeklyCouponUses += parseInt(row.coupon_uses || 0);
    } else {
      lastWeekRevenue += parseFloat(row.total_revenue || 0);
    }
  }

  // Process customer segment counts (from RPC — no row limit issues)
  const segmentData = segmentCountsResult?.data || {};
  const riskCounts = segmentData.risk_levels || {};
  const segmentCounts = segmentData.rfm_segments || {};
  const totalCustomers = segmentData.total || 0;

  // Per-segment weekly revenue (e.g. { VIP: 27, Frequente: 16, ... })
  const segmentRevenue = segmentRevenueResult?.data || {};

  // Process campaign data
  const campaignRows = campaignsResult?.data || [];
  const campaignsSent = campaignRows.length;
  const campaignsDelivered = campaignRows.filter(c =>
    c.delivery_status === 'delivered' || c.delivery_status === 'read'
  ).length;
  const campaignReturns = campaignRows.filter(c => c.status === 'returned').length;
  const revenueRecovered = campaignRows.reduce((sum, c) => sum + parseFloat(c.return_revenue || 0), 0);
  const returnDays = campaignRows.filter(c => c.days_to_return).map(c => parseInt(c.days_to_return));
  const avgDaysToReturn = returnDays.length > 0
    ? Math.round(returnDays.reduce((a, b) => a + b, 0) / returnDays.length)
    : null;

  // Process top campaigns
  const topCampaigns = (topCampaignsResult?.data || []).map(c => ({
    name: c.name,
    returnRate: parseFloat(c.return_rate || 0),
    deliveryRate: parseFloat(c.delivery_rate || 0),
    revenueRecovered: parseFloat(c.total_revenue_recovered || 0)
  }));

  // Process daily trend
  const dailyTrend = (trendResult?.data || []).map(d => ({
    date: d.date,
    revenue: parseFloat(d.total_revenue || 0),
    transactions: parseInt(d.transactions || 0)
  }));

  return {
    weeklyRevenue: Math.round(weeklyRevenue),
    lastWeekRevenue: Math.round(lastWeekRevenue),
    weeklyTransactions,
    weeklyServices,
    weeklyCouponUses,
    totalCustomers,
    healthyCount: riskCounts['Healthy'] || 0,
    atRiskCount: (riskCounts['At Risk'] || 0) + (riskCounts['Churning'] || 0),
    churningCount: riskCounts['Churning'] || 0,
    lostCount: riskCounts['Lost'] || 0,
    newCustomerCount: riskCounts['New Customer'] || 0,
    vipCount: segmentCounts['VIP'] || 0,
    frequenteCount: segmentCounts['Frequente'] || 0,
    promissorCount: segmentCounts['Promissor'] || 0,
    campaignsSent,
    campaignsDelivered,
    campaignReturns,
    revenueRecovered: Math.round(revenueRecovered),
    avgDaysToReturn,
    avgDeliveryRate: campaignsSent > 0 ? Math.round((campaignsDelivered / campaignsSent) * 100) : 0,
    topCampaigns,
    dailyTrend,
    segmentRevenue
  };
}

// ============================================
// BUILD PROMPTS
// ============================================

function buildPrompt(type, ctx) {
  switch (type) {
    case INSIGHT_TYPES.WEEKLY_SUMMARY: {
      const revenueChange = ctx.lastWeekRevenue > 0
        ? Math.round(((ctx.weeklyRevenue - ctx.lastWeekRevenue) / ctx.lastWeekRevenue) * 100)
        : null;

      // Pre-compute derived metrics that reveal non-obvious insights
      const activeCustomers = ctx.totalCustomers - (ctx.lostCount || 0);
      const revenuePerTransaction = ctx.weeklyTransactions > 0
        ? (ctx.weeklyRevenue / ctx.weeklyTransactions).toFixed(1) : null;
      const avgRevenuePerActiveCustomer = activeCustomers > 0
        ? (ctx.weeklyRevenue / activeCustomers).toFixed(1) : null;
      const lostRecoveryPotential = avgRevenuePerActiveCustomer && ctx.lostCount > 0
        ? Math.round(ctx.lostCount * 0.05 * parseFloat(avgRevenuePerActiveCustomer) * 4) : null;
      // Pre-compute at-risk recovery (10% of at-risk × their weekly spend × 4 weeks)
      const seg = ctx.segmentRevenue || {};
      const atRiskWeeklySpend = parseFloat(seg.Esfriando || seg.Inativo || 0);
      const atRiskRecoveryPotential = ctx.atRiskCount > 0 && atRiskWeeklySpend > 0
        ? Math.round(ctx.atRiskCount * 0.10 * atRiskWeeklySpend * 4) : null;
      const campaignROI = ctx.campaignsSent > 0 && ctx.revenueRecovered > 0
        ? (ctx.revenueRecovered / ctx.campaignsSent).toFixed(1) : null;
      const campaignReturnRate = ctx.campaignsSent > 0
        ? ((ctx.campaignReturns / ctx.campaignsSent) * 100).toFixed(1) : null;
      const activeRatio = ctx.totalCustomers > 0
        ? Math.round(((ctx.healthyCount + (ctx.vipCount || 0) + (ctx.frequenteCount || 0)) / ctx.totalCustomers) * 100) : null;

      // Daily revenue volatility (coefficient of variation)
      const dailyRevenues = (ctx.dailyTrend || []).map(d => d.revenue);
      let revenueVolatility = null;
      if (dailyRevenues.length >= 3) {
        const mean = dailyRevenues.reduce((a, b) => a + b, 0) / dailyRevenues.length;
        const variance = dailyRevenues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / dailyRevenues.length;
        revenueVolatility = mean > 0 ? Math.round((Math.sqrt(variance) / mean) * 100) : null;
      }

      // Best and worst days
      const bestDay = dailyRevenues.length > 0
        ? ctx.dailyTrend.reduce((max, d) => d.revenue > max.revenue ? d : max) : null;
      const worstDay = dailyRevenues.length > 0
        ? ctx.dailyTrend.reduce((min, d) => d.revenue < min.revenue ? d : min) : null;

      // Build sections as arrays, then join — avoids empty lines from falsy conditionals
      const sections = [];

      // Section 1: Raw data (compact, for reference — GPT should NOT restate these)
      const revenueLines = [
        'DADOS DE REFERÊNCIA (NÃO repita estes números na resposta):',
        '',
        'Receita:',
        `- Semana atual: R$${ctx.weeklyRevenue} | Semana anterior: R$${ctx.lastWeekRevenue}`
      ];
      if (revenueChange !== null) {
        revenueLines.push(`- Variação: ${revenueChange > 0 ? '+' : ''}${revenueChange}%`);
      }
      revenueLines.push(
        `- ${ctx.weeklyTransactions} transações, ${ctx.weeklyServices} serviços, ${ctx.weeklyCouponUses} cupons`
      );
      revenueLines.push(
        '',
        `Clientes (${ctx.totalCustomers} total): ${ctx.healthyCount} saudáveis, ${ctx.vipCount} VIPs, ${ctx.frequenteCount} frequentes, ${ctx.promissorCount} promissores, ${ctx.atRiskCount} em risco, ${ctx.lostCount} perdidos, ${ctx.newCustomerCount} novos`
      );

      const campaignLine = [`Campanhas (7 dias): ${ctx.campaignsSent} enviadas, ${ctx.campaignsDelivered} entregues (${ctx.avgDeliveryRate}%), ${ctx.campaignReturns} retornos, R$${ctx.revenueRecovered} recuperados`];
      if (ctx.avgDaysToReturn) {
        campaignLine.push(`(média ${ctx.avgDaysToReturn} dias para retorno)`);
      }
      revenueLines.push('', campaignLine.join(' '));

      if (ctx.topCampaigns && ctx.topCampaigns.length > 0) {
        revenueLines.push('', 'Melhores campanhas (30 dias):');
        for (const c of ctx.topCampaigns) {
          revenueLines.push(`- ${c.name}: ${c.returnRate}% retorno, R$${c.revenueRecovered} recuperados`);
        }
      }

      if (ctx.dailyTrend && ctx.dailyTrend.length > 0) {
        revenueLines.push('', 'Tendência diária:');
        for (const d of ctx.dailyTrend) {
          revenueLines.push(`  ${d.date}: R$${d.revenue} (${d.transactions} tx)`);
        }
      }
      sections.push(revenueLines.join('\n'));

      // Section 2: Derived metrics (the interesting stuff GPT should reason about)
      const derivedLines = ['MÉTRICAS DERIVADAS (use estes valores para calcular na sua análise):'];
      if (revenuePerTransaction) derivedLines.push(`- Ticket médio: R$${revenuePerTransaction}/transação`);
      if (activeRatio !== null) derivedLines.push(`- Base ativa: ${activeRatio}% do total (saudáveis+VIPs+frequentes vs total)`);
      // Per-segment revenue (real data — prevents GPT from fabricating values)
      if (seg.VIP) derivedLines.push(`- Gasto VIP: R$${seg.VIP}/semana por cliente (${ctx.vipCount} VIPs = R$${Math.round(seg.VIP * ctx.vipCount)}/semana total) [EXISTENTE]`);
      if (seg.Frequente) derivedLines.push(`- Gasto Frequente: R$${seg.Frequente}/semana por cliente`);
      if (seg.Promissor) derivedLines.push(`- Gasto Promissor: R$${seg.Promissor}/semana por cliente`);
      if (seg.Esfriando || seg.Inativo) derivedLines.push(`- Gasto Esfriando/Inativo: R$${seg.Esfriando || seg.Inativo}/semana por cliente (valor antes de parar) [BASE P/ CÁLCULO INCREMENTAL]`);
      if (lostRecoveryPotential) derivedLines.push(`- Potencial recuperação perdidos: ~R$${lostRecoveryPotential}/mês se recuperar 5% dos ${ctx.lostCount} perdidos [INCREMENTAL]`);
      if (atRiskRecoveryPotential) derivedLines.push(`- Potencial recuperação em risco: ~R$${atRiskRecoveryPotential}/mês se engajar 10% dos ${ctx.atRiskCount} em risco (${ctx.atRiskCount}×0.1×R$${atRiskWeeklySpend}/sem×4) [INCREMENTAL]`);
      if (campaignROI) derivedLines.push(`- ROI por mensagem: R$${campaignROI} recuperados por mensagem enviada`);
      if (campaignReturnRate) derivedLines.push(`- Funil de campanha: ${ctx.avgDeliveryRate}% entrega → ${campaignReturnRate}% retorno`);
      if (revenueVolatility !== null) derivedLines.push(`- Volatilidade diária: ${revenueVolatility}% (variação entre dias da semana)`);
      if (bestDay && worstDay) derivedLines.push(`- Melhor dia: ${bestDay.date} (R$${bestDay.revenue}) | Pior: ${worstDay.date} (R$${worstDay.revenue})`);
      sections.push(derivedLines.join('\n'));

      // Section 3: Analytical questions — enriched with R$ + shuffled for diversity
      const analyticalQuestions = [];
      if (activeRatio !== null && ctx.lostCount > 0) {
        const netGrowth = (ctx.newCustomerCount || 0) - (ctx.lostCount || 0);
        analyticalQuestions.push(
          `Com ${ctx.lostCount} perdidos vs ${ctx.newCustomerCount} novos (saldo: ${netGrowth > 0 ? '+' : ''}${netGrowth}), a base sustenta a receita atual de R$${ctx.weeklyRevenue}/semana?`
        );
      }
      if (campaignReturnRate && ctx.campaignReturns > 0) {
        const revenuePerReturn = (ctx.revenueRecovered / ctx.campaignReturns).toFixed(0);
        analyticalQuestions.push(
          `Cada retorno por campanha gera R$${revenuePerReturn} em média. Com ${campaignReturnRate}% taxa de retorno, vale investir em volume ou em conversão?`
        );
      }
      if (revenueVolatility !== null && revenueVolatility > 30 && bestDay && worstDay) {
        const gap = Math.round(bestDay.revenue - worstDay.revenue);
        analyticalQuestions.push(
          `Gap de R$${gap} entre melhor e pior dia (volatilidade ${revenueVolatility}%). O negócio depende de poucos dias fortes?`
        );
      }
      if (ctx.vipCount > 0 && ctx.atRiskCount > 0) {
        analyticalQuestions.push(
          `Com apenas ${ctx.vipCount} VIPs e ${ctx.atRiskCount} em risco, qual segmento dá mais retorno por esforço de engajamento?`
        );
      }

      // Select 2-3 questions per day (not all 4) — breaks topic bias
      // GPT always picks segment comparison when all 4 are present; removing it some days forces variety
      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
      const selectCount = analyticalQuestions.length <= 2
        ? analyticalQuestions.length
        : 2 + (dayOfYear % 2); // alternates between 2 and 3 questions
      const selectedQuestions = [];
      for (let i = 0; i < selectCount && i < analyticalQuestions.length; i++) {
        const idx = (dayOfYear + i) % analyticalQuestions.length;
        selectedQuestions.push(analyticalQuestions[idx]);
      }

      const questions = ['ANALISE cruzando os dados acima e responda A PERGUNTA MAIS RELEVANTE:'];
      selectedQuestions.forEach((q, i) => questions.push(`${i + 1}. ${q}`));
      questions.push('', 'Responda SOMENTE a pergunta mais impactante. Mostre o cálculo passo a passo com unidades (/semana ou /mês).');
      sections.push(questions.join('\n'));

      return 'Dados semanais da lavanderia Bilavnova:\n\n' + sections.join('\n\n');
    }

    case INSIGHT_TYPES.CHURN_ANALYSIS:
      return `Analise por que clientes estão saindo da lavanderia Bilavnova:

CLIENTES EM RISCO:
- Em risco + Esfriando: ${ctx.atRiskCount}
- Perdidos: ${ctx.lostCount}
- Total de clientes: ${ctx.totalCustomers}

CAMPANHAS DE RETENÇÃO:
- Retornos por campanhas (7 dias): ${ctx.campaignReturns}
- Receita recuperada: R$${ctx.revenueRecovered}

Identifique:
1. Padrões comuns entre clientes que saem
2. Sinais de alerta para monitorar
3. Uma intervenção que pode salvar mais receita`;

    case INSIGHT_TYPES.ANOMALY_EXPLANATION:
      return `Explique esta anomalia de receita na lavanderia Bilavnova:

ANOMALIA:
- Data: ${ctx.date || 'N/A'}
- Receita real: R$${ctx.actual || 0}
- Receita esperada: R$${ctx.expected || 0}
- Desvio: ${ctx.deviation > 0 ? '+' : ''}${ctx.deviation || 0}%

CONTEXTO:
- Dia da semana: ${ctx.dayOfWeek || 'N/A'}
- Clima: ${ctx.weather || 'N/A'}
- Transações: ${ctx.transactionCount || 0}
- Clientes únicos: ${ctx.uniqueCustomers || 0}

O que provavelmente causou ${(ctx.deviation || 0) > 0 ? 'esse pico' : 'essa queda'}?
Dê 2-3 explicações possíveis ordenadas por probabilidade.`;

    default: {
      // Truncate context to prevent token overflow — only include key numeric fields
      const summary = Object.entries(ctx)
        .filter(([, v]) => typeof v === 'number' || typeof v === 'string')
        .slice(0, 20)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      return `Analise estes dados e forneça insights acionáveis: ${summary}`;
    }
  }
}

