// netlify/functions/twilio-whatsapp.js v2.0
// Twilio WhatsApp Business API integration for campaign messaging
//
// CHANGELOG:
// v2.0 (2025-12-26): Added rate limiting
//   - Strict rate limit: 20 requests/minute per IP
//   - Uses Supabase rate_limits table for state
//   - Includes X-RateLimit-* headers in responses
// v1.9 (2025-12-19): Separate inbound messages from contact_tracking
//   - NEW: All inbound messages stored in twilio_inbound_messages table
//   - storeEngagement only UPDATES contact_tracking (no INSERT)
//   - contact_tracking stays clean: only outbound campaign recipients
//   - getStoredData reads from twilio_inbound_messages for inbound data
//   - Better separation of concerns for analytics
// v1.8 (2025-12-19): Enhanced engagement storage with customer lookup
//   - storeEngagement looks for contact_tracking records with twilio_sid (outbound msgs)
//   - Uses flexible phone matching (last 10-11 digits) to handle format differences
//   - Falls back to customers table lookup if no contact_tracking match
//   - Can INSERT new records for known customers (from customers table)
//   - Returns stored/updated/skipped counts for debugging
// v1.7 (2025-12-19): Fixed engagement data storage
//   - storeEngagement now uses created_at (not sent_at which doesn't exist)
// v1.6 (2025-12-19): Fixed cost data overwrite bug + added clear_costs action
//   - storeCosts supports freshLoad mode for batch replace vs incremental add
//   - Added clear_costs action to reset corrupted data before repopulating
// v1.5 (2025-12-19): Database-cached engagement and cost sync
//   - Added store_engagement action: stores engagement data to contact_tracking
//   - Added store_costs action: stores cost data to twilio_daily_costs
//   - Added get_stored_data action: reads engagement/cost from Supabase
//   - Follows same pattern as WABA analytics (sync to DB, read from DB)
// v1.4 (2025-12-14): Fixed false positive opt-out detection
//   - Removed "quero" (I want) from opt-out keywords - it's a positive word
//   - "Quero usar" was being incorrectly flagged as opt-out
//   - Added proper negative phrases: "não quero", "nao quero", "desinscrever"
//   - Aligned keywords with twilio-webhook.js for consistency
// v1.3 (2025-12-12): Fixed blacklist sync not detecting error 63024 messages
//   - Bug fix: error_code was compared as string vs number (strict equality failed)
//   - Now properly parses error_code to integer before comparison
// v1.2 (2025-12-09): Added Meta-approved template support via ContentSid
//   - sendMessage now accepts contentSid + contentVariables for template mode
//   - sendBulkMessages supports contentSid for bulk template sends
//   - Added personalizeContentVariables for recipient-specific variable mapping
//   - Plain text Body mode retained as fallback
//   - Response includes sentVia field ('template' or 'plaintext')
// v1.1 (2025-12-08): Added fetch_messages action for blacklist sync
//   - Fetches message logs from Twilio API
//   - Identifies opt-out messages (inbound with keywords)
//   - Identifies undelivered/blocked numbers (error 63024)
//   - Supports pagination for large message volumes
// v1.0: Initial implementation with send_message, send_bulk, check_status
//
// Environment variables required:
// - TWILIO_ACCOUNT_SID: Your Twilio Account SID
// - TWILIO_AUTH_TOKEN: Your Twilio Auth Token
// - TWILIO_WHATSAPP_NUMBER: Your approved WhatsApp number (format: +5554999999999)
// - SUPABASE_URL: Supabase project URL
// - SUPABASE_SERVICE_KEY: Supabase service role key

const { createClient } = require('@supabase/supabase-js');
const { checkRateLimit, getRateLimitHeaders, rateLimitResponse } = require('./utils/rateLimit');

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
  const origin = event.headers.origin || event.headers.Origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  return 'https://www.bilavnova.com';
}

// Validate API key from request header
function validateApiKey(event) {
  const apiKey = event.headers['x-api-key'] || event.headers['X-Api-Key'];
  const API_SECRET = process.env.API_SECRET_KEY;
  if (!API_SECRET) {
    console.error('SECURITY: API_SECRET_KEY not configured. All requests denied.');
    return false;
  }
  return apiKey === API_SECRET;
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

exports.handler = async (event, context) => {
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

  // API key authentication
  if (!validateApiKey(event)) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  // Rate limit check (strict: 20 requests/minute for message sending)
  const rateLimit = await checkRateLimit(event, 'twilio-whatsapp', 'strict');
  if (!rateLimit.allowed) {
    return rateLimitResponse(headers, rateLimit);
  }
  Object.assign(headers, getRateLimitHeaders(rateLimit, 'strict'));

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed. Use POST.' })
    };
  }

  // Get environment variables
  const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!ACCOUNT_SID || !AUTH_TOKEN || !WHATSAPP_FROM) {
    console.error('Missing Twilio credentials');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Twilio credentials not configured' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { action } = body;

    switch (action) {
      case 'send_message':
        return await sendMessage(body, ACCOUNT_SID, AUTH_TOKEN, WHATSAPP_FROM, headers);

      case 'send_bulk':
        return await sendBulkMessages(body, ACCOUNT_SID, AUTH_TOKEN, WHATSAPP_FROM, headers);

      case 'check_status':
        return await checkMessageStatus(body, ACCOUNT_SID, AUTH_TOKEN, headers);

      case 'fetch_messages':
        return await fetchMessages(body, ACCOUNT_SID, AUTH_TOKEN, headers);

      case 'store_engagement':
        return await storeEngagement(body, headers);

      case 'store_costs':
        return await storeCosts(body, headers);

      case 'get_stored_data':
        return await getStoredData(body, headers);

      case 'clear_costs':
        return await clearCosts(body, headers);

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action. Use: send_message, send_bulk, check_status, fetch_messages, store_engagement, store_costs, get_stored_data, clear_costs' })
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

/**
 * Send a single WhatsApp message
 *
 * Supports two modes:
 * 1. Template mode (Meta-approved): Uses ContentSid + ContentVariables
 * 2. Plain text mode (fallback): Uses Body parameter
 *
 * For Meta WhatsApp Business API compliance, always prefer template mode.
 */
async function sendMessage(body, accountSid, authToken, from, headers) {
  const { to, message, templateName, templateVariables, contentSid, contentVariables } = body;

  // Validate: need either contentSid (template) or message/templateName (plain text)
  if (!to || (!message && !templateName && !contentSid)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing required fields: to, and one of: contentSid, message, or templateName' })
    };
  }

  // Format phone number for WhatsApp
  const toNumber = formatPhoneNumber(to);
  if (!toNumber) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid phone number format' })
    };
  }

  // Call Twilio API
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const params = new URLSearchParams();
  params.append('From', `whatsapp:${from}`);
  params.append('To', `whatsapp:${toNumber}`);

  // Use ContentSid for Meta-approved templates (preferred method)
  if (contentSid) {
    params.append('ContentSid', contentSid);

    // ContentVariables must be a JSON string with numbered keys: {"1": "value1", "2": "value2"}
    if (contentVariables) {
      const varsJson = typeof contentVariables === 'string'
        ? contentVariables
        : JSON.stringify(contentVariables);
      params.append('ContentVariables', varsJson);
    }
  } else {
    // Fallback to plain text Body (not recommended for marketing messages)
    let messageBody = message;
    if (templateName && templateVariables) {
      messageBody = formatTemplate(templateName, templateVariables);
    }
    params.append('Body', messageBody);
  }

  try {
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: 'Twilio API error',
          code: data.code,
          message: data.message
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        messageSid: data.sid,
        status: data.status,
        to: toNumber,
        timestamp: new Date().toISOString(),
        // Include metadata about how message was sent
        sentVia: contentSid ? 'template' : 'plaintext',
        contentSid: contentSid || null
      })
    };
  } catch (error) {
    throw new Error(`Twilio request failed: ${error.message}`);
  }
}

/**
 * Send bulk WhatsApp messages (with rate limiting)
 *
 * Supports two modes:
 * 1. Template mode: Pass contentSid + contentVariables for each recipient
 * 2. Plain text mode: Pass message or templateName + templateVariables
 *
 * For template mode, each recipient object can include:
 * - phone: Phone number
 * - name: Customer name
 * - contentVariables: Object with {"1": "value1", "2": "value2", ...}
 */
async function sendBulkMessages(body, accountSid, authToken, from, headers) {
  const { recipients, message, templateName, templateVariables, contentSid } = body;

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing or invalid recipients array' })
    };
  }

  // Limit to 100 messages per request to avoid timeout
  const MAX_BATCH = 100;
  if (recipients.length > MAX_BATCH) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: `Too many recipients. Maximum ${MAX_BATCH} per request.`,
        received: recipients.length
      })
    };
  }

  const results = {
    success: [],
    failed: [],
    total: recipients.length
  };

  // Send messages with 100ms delay between each (Twilio rate limit)
  for (const recipient of recipients) {
    try {
      // Build message payload
      const messagePayload = {
        to: recipient.phone
      };

      // Use ContentSid if provided (Meta-approved template mode)
      if (contentSid) {
        messagePayload.contentSid = contentSid;
        // Personalize content variables for this recipient
        messagePayload.contentVariables = personalizeContentVariables(
          recipient.contentVariables || templateVariables,
          recipient
        );
      } else {
        // Plain text mode (fallback)
        messagePayload.message = personalizeMessage(message, recipient);
        messagePayload.templateName = templateName;
        messagePayload.templateVariables = personalizeVariables(templateVariables, recipient);
      }

      const result = await sendMessage(
        messagePayload,
        accountSid,
        authToken,
        from,
        headers
      );

      const resultBody = JSON.parse(result.body);

      if (result.statusCode === 200) {
        results.success.push({
          phone: recipient.phone,
          name: recipient.name,
          messageSid: resultBody.messageSid,
          sentVia: resultBody.sentVia
        });
      } else {
        results.failed.push({
          phone: recipient.phone,
          name: recipient.name,
          error: resultBody.message || resultBody.error
        });
      }

      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      results.failed.push({
        phone: recipient.phone,
        name: recipient.name,
        error: error.message
      });
    }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      results,
      summary: {
        sent: results.success.length,
        failed: results.failed.length,
        total: results.total,
        sentVia: contentSid ? 'template' : 'plaintext'
      }
    })
  };
}

/**
 * Check message delivery status
 */
async function checkMessageStatus(body, accountSid, authToken, headers) {
  const { messageSid } = body;

  if (!messageSid) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing messageSid' })
    };
  }

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages/${messageSid}.json`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  try {
    const response = await fetch(twilioUrl, {
      headers: {
        'Authorization': `Basic ${credentials}`
      }
    });

    const data = await response.json();

    return {
      statusCode: response.ok ? 200 : response.status,
      headers,
      body: JSON.stringify({
        messageSid: data.sid,
        status: data.status,
        errorCode: data.error_code,
        errorMessage: data.error_message,
        dateSent: data.date_sent,
        dateUpdated: data.date_updated
      })
    };
  } catch (error) {
    throw new Error(`Status check failed: ${error.message}`);
  }
}

/**
 * Fetch message logs from Twilio for blacklist processing
 * Retrieves both inbound (opt-outs) and outbound (undelivered) messages
 */
async function fetchMessages(body, accountSid, authToken, headers) {
  const { dateSentAfter, pageSize = 100, pageToken } = body;

  // Default to last 7 days if no date specified
  const startDate = dateSentAfter || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  try {
    // Build query parameters
    const params = new URLSearchParams();
    params.append('PageSize', Math.min(pageSize, 1000).toString());
    params.append('DateSent>', startDate);

    if (pageToken) {
      params.append('PageToken', pageToken);
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json?${params.toString()}`;

    const response = await fetch(twilioUrl, {
      headers: {
        'Authorization': `Basic ${credentials}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: 'Twilio API error',
          code: data.code,
          message: data.message
        })
      };
    }

    // Process messages to identify blacklist candidates and engagement
    const blacklistCandidates = {
      optOuts: [],        // Inbound messages with opt-out keywords
      engagements: [],    // Inbound messages with positive engagement (button clicks)
      undelivered: [],    // Outbound messages that failed
      allMessages: [],    // Raw message data with body and price
      inboundMessages: [] // All inbound messages for analysis
    };

    // Cost tracking
    const costSummary = {
      outboundCount: 0,
      outboundCost: 0,
      inboundCount: 0,
      inboundCost: 0,
      currency: 'USD'
    };

    // Opt-out keywords - must be negative phrases, not positive words like "quero" (I want)
    // "Quero usar" = positive; "Não quero" / "Não tenho interesse" = negative opt-out
    // Must match the opt-out button texts from meta-whatsapp-templates.md
    const optOutKeywords = [
      'parar', 'pare', 'stop', 'cancelar', 'sair', 'remover', 'desinscrever', 'unsubscribe',
      'nao quero', 'nao tenho interesse'  // Quick reply opt-out button texts (normalized without accents)
    ];

    // Positive engagement keywords - quick reply button texts indicating interest
    // Must match the positive button texts from messageTemplates.js
    const positiveKeywords = [
      'quero usar', 'vou aproveitar', 'quero', 'sim', 'interessado', 'aceito',
      'quero saber', 'me conta', 'como funciona'
    ];

    const normalizeText = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

    for (const msg of data.messages || []) {
      const direction = (msg.direction || '').toLowerCase();
      const status = (msg.status || '').toLowerCase();
      // IMPORTANT: Twilio returns error_code as string, so convert to number for comparison
      const errorCode = msg.error_code ? parseInt(msg.error_code, 10) : null;
      const body = normalizeText(msg.body);
      const from = (msg.from || '').replace(/^whatsapp:/, '');
      const to = (msg.to || '').replace(/^whatsapp:/, '');

      // Track costs (price is negative string like "-0.00750")
      const price = msg.price ? Math.abs(parseFloat(msg.price)) : 0;
      const priceUnit = msg.price_unit || 'USD';
      if (priceUnit && costSummary.currency === 'USD') {
        costSummary.currency = priceUnit;
      }

      // Check for inbound messages (customer responses)
      if (direction === 'inbound') {
        const hasOptOutKeyword = optOutKeywords.some(kw => body.includes(kw));
        const hasPositiveKeyword = positiveKeywords.some(kw => body.includes(kw));

        // Track all inbound messages
        const inboundData = {
          phone: from,
          body: msg.body,
          dateSent: msg.date_sent,
          messageSid: msg.sid,
          engagementType: hasOptOutKeyword ? 'button_optout' : (hasPositiveKeyword ? 'button_positive' : 'other'),
          price: price,
          priceUnit: priceUnit
        };
        blacklistCandidates.inboundMessages.push(inboundData);

        // Cost tracking for inbound
        costSummary.inboundCount++;
        costSummary.inboundCost += price;

        // Categorize by engagement type
        if (hasOptOutKeyword) {
          blacklistCandidates.optOuts.push({
            phone: from,
            body: msg.body,
            dateSent: msg.date_sent,
            messageSid: msg.sid,
            reason: 'opt-out'
          });
        } else if (hasPositiveKeyword) {
          blacklistCandidates.engagements.push({
            phone: from,
            body: msg.body,
            dateSent: msg.date_sent,
            messageSid: msg.sid,
            reason: 'positive-engagement'
          });
        }
      } else if (direction.startsWith('outbound')) {
        // Cost tracking for outbound
        costSummary.outboundCount++;
        costSummary.outboundCost += price;
      }

      // Check for undelivered outbound messages
      if (direction.startsWith('outbound') && (status === 'undelivered' || status === 'failed' || errorCode === 63024 || errorCode === 63031 || errorCode === 63049 || errorCode === 63032)) {
        blacklistCandidates.undelivered.push({
          phone: to,
          status: status,
          errorCode: errorCode,
          errorMessage: msg.error_message,
          dateSent: msg.date_sent,
          messageSid: msg.sid,
          reason: errorCode === 63024 ? 'number-blocked' : 'undelivered'
        });
      }

      // Store all messages with body and price for analytics
      blacklistCandidates.allMessages.push({
        sid: msg.sid,
        direction: direction,
        status: status,
        from: from,
        to: to,
        body: msg.body,
        errorCode: errorCode,
        dateSent: msg.date_sent,
        price: price,
        priceUnit: priceUnit
      });
    }

    // Get next page token if available
    let nextPageToken = null;
    if (data.next_page_uri) {
      const nextUrl = new URL(`https://api.twilio.com${data.next_page_uri}`);
      nextPageToken = nextUrl.searchParams.get('PageToken');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        blacklistCandidates,
        pagination: {
          pageSize: data.page_size,
          currentPage: data.page,
          hasMore: !!data.next_page_uri,
          nextPageToken
        },
        summary: {
          totalFetched: data.messages?.length || 0,
          optOutsFound: blacklistCandidates.optOuts.length,
          engagementsFound: blacklistCandidates.engagements.length,
          inboundMessagesFound: blacklistCandidates.inboundMessages.length,
          undeliveredFound: blacklistCandidates.undelivered.length,
          startDate
        },
        costSummary
      })
    };
  } catch (error) {
    throw new Error(`Fetch messages failed: ${error.message}`);
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Format Brazilian phone number for WhatsApp
 * Input: "54996923504" or "+5554996923504" or "5554996923504"
 * Output: "+5554996923504"
 */
function formatPhoneNumber(phone) {
  if (!phone) return null;

  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');

  // Handle different formats
  if (cleaned.length === 10 || cleaned.length === 11) {
    // Brazilian local format (DDD + number)
    cleaned = '55' + cleaned;
  }

  // Validate length (55 + DDD + number = 12 or 13 digits)
  if (cleaned.length < 12 || cleaned.length > 13) {
    return null;
  }

  return '+' + cleaned;
}

/**
 * Format template with variables
 * Template syntax: {{1}}, {{2}}, etc.
 */
function formatTemplate(templateName, variables) {
  // Template library (matches MessageComposer.jsx templates)
  const templates = {
    winback_30days: `Olá {{1}}!

Faz tempo que não nos vemos. Sabemos que a vida fica corrida, mas suas roupas merecem o melhor cuidado!

Volte à Lavpop e aproveite nossa oferta especial:
🎁 *{{2}}% de desconto* no seu próximo ciclo

Use o cupom *{{3}}* até {{4}}.

Esperamos você! 💙

_Lavpop - Lavanderia Self-Service_`,

    welcome_new: `Olá {{1}}!

Obrigado por escolher a Lavpop! Esperamos que sua primeira experiência tenha sido incrível.

Aqui estão algumas dicas:
✨ Horários de menor movimento: 7h-9h e 14h-16h
💳 Você ganhou *{{2}}* de cashback na sua carteira digital
📱 Baixe nosso app para acompanhar suas lavagens

Na sua próxima visita, use o cupom *BEMVINDO10* e ganhe 10% OFF!

Qualquer dúvida, estamos aqui. 💙

_Lavpop - Lavanderia Self-Service_`,

    wallet_reminder: `Olá {{1}}!

Você sabia que tem *{{2}}* de crédito na sua carteira Lavpop?

Não deixe seu saldo parado! Use seus créditos na próxima lavagem e economize.

🕐 Funcionamos das 7h às 21h, todos os dias.

Te esperamos! 💙

_Lavpop - Lavanderia Self-Service_`
  };

  let template = templates[templateName];
  if (!template) {
    return variables.message || 'Mensagem da Lavpop';
  }

  // Replace variables
  if (Array.isArray(variables)) {
    variables.forEach((value, index) => {
      template = template.replace(new RegExp(`\\{\\{${index + 1}\\}\\}`, 'g'), value);
    });
  } else if (typeof variables === 'object') {
    Object.entries(variables).forEach(([key, value], index) => {
      template = template.replace(new RegExp(`\\{\\{${index + 1}\\}\\}`, 'g'), value);
    });
  }

  return template;
}

/**
 * Personalize message for recipient
 */
function personalizeMessage(message, recipient) {
  if (!message) return message;

  return message
    .replace(/\{\{nome\}\}/gi, recipient.name || 'Cliente')
    .replace(/\{\{saldo\}\}/gi, formatCurrency(recipient.wallet))
    .replace(/\{\{dias\}\}/gi, recipient.daysSinceLastVisit || '');
}

/**
 * Personalize template variables for recipient
 */
function personalizeVariables(variables, recipient) {
  if (!variables) return variables;

  const personalized = { ...variables };

  // Common personalizations
  if (personalized.nome_cliente !== undefined) {
    personalized.nome_cliente = recipient.name || 'Cliente';
  }
  if (personalized.saldo !== undefined) {
    personalized.saldo = formatCurrency(recipient.wallet);
  }

  return personalized;
}

/**
 * Personalize content variables for Meta templates
 *
 * ContentVariables format: {"1": "value1", "2": "value2", ...}
 * Maps to template placeholders {{1}}, {{2}}, etc.
 *
 * Common variable mappings:
 * - "1" = Customer name
 * - "2" = Discount % or wallet balance
 * - "3" = Coupon code
 * - "4" = Expiration date (DD/MM)
 */
function personalizeContentVariables(baseVariables, recipient) {
  if (!baseVariables) return null;

  const personalized = { ...baseVariables };

  // Variable 1 is typically customer name
  if (personalized['1'] === undefined || personalized['1'] === '{{nome}}') {
    personalized['1'] = recipient.name || 'Cliente';
  }

  // If variable 2 is a wallet balance placeholder
  if (personalized['2'] === '{{saldo}}' && recipient.wallet !== undefined) {
    personalized['2'] = formatCurrency(recipient.wallet);
  }

  return personalized;
}

/**
 * Format currency (BRL)
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}

// ==================== DATABASE SYNC FUNCTIONS ====================

/**
 * Store engagement data from inbound Twilio messages
 * Called by twilioSyncService.js after fetching from Twilio API
 *
 * v1.9: Two-table approach:
 * 1. ALL inbound messages → twilio_inbound_messages (for analytics display)
 * 2. If matching outbound exists → UPDATE contact_tracking engagement fields
 *
 * This keeps contact_tracking clean (only outbound campaign recipients)
 * while still capturing all inbound messages for analytics.
 */
async function storeEngagement(body, headers) {
  const { engagements } = body;

  if (!engagements || !Array.isArray(engagements) || engagements.length === 0) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, stored: 0, message: 'No engagements to store' })
    };
  }

  try {
    const supabase = getSupabaseClient();
    let stored = 0;   // Inbound messages stored in twilio_inbound_messages
    let updated = 0;  // Existing contact_tracking records updated
    let skipped = 0;  // Duplicate message_sid (already in DB)
    let errors = [];

    // Process each engagement (inbound message)
    for (const eng of engagements) {
      const phone = normalizePhoneForDb(eng.phone);
      if (!phone) continue;

      const messageSid = eng.messageSid;
      const receivedAt = eng.dateSent;

      // 1. ALWAYS insert into twilio_inbound_messages (dedupe by message_sid)
      // First check if already exists
      if (messageSid) {
        const { data: existingMsg } = await supabase
          .from('twilio_inbound_messages')
          .select('id')
          .eq('message_sid', messageSid)
          .single();

        if (existingMsg) {
          skipped++;
          continue; // Already stored this message
        }
      }

      // Look up customer by phone for name/ID enrichment
      const phoneDigits = phone.replace(/\D/g, '');
      const last11 = phoneDigits.slice(-11);
      const last10 = phoneDigits.slice(-10);

      const { data: customer } = await supabase
        .from('customers')
        .select('doc, nome')
        .or(`telefone.ilike.%${last11},telefone.ilike.%${last10}`)
        .limit(1)
        .single();

      // Try to find matching outbound contact_tracking record
      // Must be: same phone, has twilio_sid, sent BEFORE the inbound was received
      let linkedContactTrackingId = null;
      const { data: existingOutbound } = await supabase
        .from('contact_tracking')
        .select('id')
        .not('twilio_sid', 'is', null)
        .or(`phone.ilike.%${last11},phone.ilike.%${last10}`)
        .lt('created_at', receivedAt)  // Outbound must be before inbound reply
        .order('created_at', { ascending: false })  // Get most recent before inbound
        .limit(1)
        .single();

      if (existingOutbound) {
        linkedContactTrackingId = existingOutbound.id;
      }

      // Insert into twilio_inbound_messages
      const { error: insertError } = await supabase
        .from('twilio_inbound_messages')
        .insert({
          message_sid: messageSid,
          phone: phone,
          customer_name: customer?.nome || null,
          customer_id: customer?.doc || null,
          body: eng.body ? eng.body.substring(0, 500) : null, // Truncate for privacy
          engagement_type: eng.engagementType,
          received_at: receivedAt,
          linked_contact_tracking_id: linkedContactTrackingId
        });

      if (insertError) {
        errors.push({ phone, error: `Insert inbound: ${insertError.message}` });
      } else {
        stored++;
      }

      // 2. If we found a matching outbound record, UPDATE its engagement fields
      if (existingOutbound) {
        const { error: updateError } = await supabase
          .from('contact_tracking')
          .update({
            engagement_type: eng.engagementType,
            engaged_at: receivedAt,
            message_cost: eng.price || null,
            message_cost_currency: eng.priceUnit || 'USD'
          })
          .eq('id', existingOutbound.id);

        if (updateError) {
          errors.push({ phone, error: `Update contact_tracking: ${updateError.message}` });
        } else {
          updated++;
        }
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        stored,   // Inbound messages stored in twilio_inbound_messages
        updated,  // Existing contact_tracking records updated with engagement
        skipped,  // Duplicate message_sid (already in DB)
        total: engagements.length,
        errors: errors.length > 0 ? errors : undefined
      })
    };
  } catch (error) {
    console.error('Store engagement error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to store engagement data', details: undefined })
    };
  }
}

/**
 * Store daily cost data to twilio_daily_costs table
 * Called by twilioSyncService.js after fetching from Twilio API
 *
 * Modes:
 * - freshLoad=true: Direct insert/upsert (replaces existing data) - faster for bulk loads
 * - freshLoad=false: Uses RPC to ADD to existing values (for incremental syncs)
 */
async function storeCosts(body, headers) {
  const { costsByDay, freshLoad = false } = body;

  if (!costsByDay || Object.keys(costsByDay).length === 0) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, daysStored: 0, message: 'No costs to store' })
    };
  }

  try {
    const supabase = getSupabaseClient();
    let daysStored = 0;
    let errors = [];

    if (freshLoad) {
      // Fresh load mode: batch upsert (replaces existing data)
      // Much faster for initial loads or after clearing
      const records = Object.entries(costsByDay).map(([dateKey, costs]) => ({
        date: dateKey,
        outbound_count: costs.outbound?.count || 0,
        outbound_cost: costs.outbound?.cost || 0,
        inbound_count: costs.inbound?.count || 0,
        inbound_cost: costs.inbound?.cost || 0,
        currency: costs.currency || 'USD'
      }));

      const { error: upsertError } = await supabase
        .from('twilio_daily_costs')
        .upsert(records, { onConflict: 'date' });

      if (upsertError) {
        console.error('Batch upsert error:', upsertError);
        errors.push({ error: upsertError.message });
      } else {
        daysStored = records.length;
      }
    } else {
      // Incremental mode: use RPC to ADD to existing values
      for (const [dateKey, costs] of Object.entries(costsByDay)) {
        const { error: upsertError } = await supabase.rpc('upsert_twilio_daily_costs', {
          p_date: dateKey,
          p_outbound_count: costs.outbound?.count || 0,
          p_outbound_cost: costs.outbound?.cost || 0,
          p_inbound_count: costs.inbound?.count || 0,
          p_inbound_cost: costs.inbound?.cost || 0,
          p_currency: costs.currency || 'USD'
        });

        if (upsertError) {
          console.error(`Cost upsert error for ${dateKey}:`, upsertError);
          errors.push({ date: dateKey, error: upsertError.message });
        } else {
          daysStored++;
        }
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        daysStored,
        total: Object.keys(costsByDay).length,
        mode: freshLoad ? 'fresh' : 'incremental',
        errors: errors.length > 0 ? errors : undefined
      })
    };
  } catch (error) {
    console.error('Store costs error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to store cost data', details: undefined })
    };
  }
}

/**
 * Clear all cost data from twilio_daily_costs table
 * Used to reset corrupted data before repopulating
 */
async function clearCosts(body, headers) {
  try {
    const supabase = getSupabaseClient();

    // Delete all rows from twilio_daily_costs
    const { error } = await supabase
      .from('twilio_daily_costs')
      .delete()
      .gte('date', '2000-01-01'); // Delete all dates (required filter for delete)

    if (error) {
      console.error('Clear costs error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to clear costs', details: undefined })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'All cost data cleared' })
    };
  } catch (error) {
    console.error('Clear costs error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to clear costs', details: undefined })
    };
  }
}

/**
 * Get stored engagement and cost data from Supabase
 * Called by UI to read cached data instead of fetching from Twilio
 *
 * v1.9: Reads inbound messages from twilio_inbound_messages table
 * This matches the UI's expected format for WhatsAppAnalytics.jsx
 */
async function getStoredData(body, headers) {
  const { dateFrom, dateTo } = body;

  try {
    const supabase = getSupabaseClient();

    // Build date filter
    const fromDate = dateFrom || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = dateTo || new Date().toISOString().split('T')[0];

    // Fetch inbound messages from twilio_inbound_messages (NEW in v1.9)
    let inboundQuery = supabase
      .from('twilio_inbound_messages')
      .select('id, message_sid, phone, customer_name, body, engagement_type, received_at');

    if (fromDate) {
      inboundQuery = inboundQuery.gte('received_at', fromDate);
    }
    if (toDate) {
      inboundQuery = inboundQuery.lte('received_at', toDate + 'T23:59:59');
    }

    const { data: inboundData, error: inboundError } = await inboundQuery
      .order('received_at', { ascending: false })
      .limit(500);

    if (inboundError) {
      console.error('Inbound messages query error:', inboundError);
    }

    // Fetch cost data from twilio_daily_costs
    let costQuery = supabase
      .from('twilio_daily_costs')
      .select('*');

    if (fromDate) {
      costQuery = costQuery.gte('date', fromDate);
    }
    if (toDate) {
      costQuery = costQuery.lte('date', toDate);
    }

    const { data: costData, error: costError } = await costQuery
      .order('date', { ascending: false });

    if (costError) {
      console.error('Cost query error:', costError);
    }

    // Process inbound messages for UI
    // Maps to WhatsAppAnalytics.jsx expected format:
    // - messageSid, phone, dateSent, body, engagementType
    const inboundMessages = (inboundData || []).map(m => ({
      messageSid: m.message_sid,
      phone: m.phone,
      dateSent: m.received_at,
      body: m.body || '',
      engagementType: m.engagement_type,
      customerName: m.customer_name
    }));

    // Filter by engagement type for KPI calculations
    const engagements = inboundMessages.filter(m => m.engagementType === 'button_positive');
    const optOuts = inboundMessages.filter(m => m.engagementType === 'button_optout');

    // Aggregate cost summary
    const costSummary = (costData || []).reduce((acc, day) => {
      acc.outboundCount += day.outbound_count || 0;
      acc.outboundCost += parseFloat(day.outbound_cost) || 0;
      acc.inboundCount += day.inbound_count || 0;
      acc.inboundCost += parseFloat(day.inbound_cost) || 0;
      acc.currency = day.currency || 'USD';
      return acc;
    }, {
      outboundCount: 0,
      outboundCost: 0,
      inboundCount: 0,
      inboundCost: 0,
      currency: 'USD'
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        engagements,
        optOuts,
        inboundMessages,
        costSummary,
        dailyCosts: costData || [],
        dateRange: { from: fromDate, to: toDate }
      })
    };
  } catch (error) {
    console.error('Get stored data error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get stored data', details: undefined })
    };
  }
}

/**
 * Normalize phone number for database storage
 * Removes whatsapp: prefix and ensures +55 format
 */
// Brazilian mobile phone pattern: 55 + [1-9][1-9] + 9 + 8 digits
const BR_MOBILE_PATTERN = /^55[1-9]{2}9\d{8}$/;

/**
 * Normalize phone to +55XXXXXXXXXXX format
 * Matches src/utils/phoneUtils.js normalizePhone() exactly
 * Handles legacy formats by adding missing 9 prefix when needed
 *
 * @param {string} phone - Raw phone input (may include whatsapp: prefix)
 * @returns {string|null} Normalized phone or null if invalid
 */
function normalizePhoneForDb(phone) {
  if (!phone) return null;

  // Remove whatsapp: prefix and all non-digits
  let digits = String(phone).replace(/^whatsapp:/i, '').replace(/\D/g, '');

  // Handle different length formats
  switch (digits.length) {
    case 13:
      // Already full format: 55 AA 9 NNNNNNNN
      if (!digits.startsWith('55')) return null;
      break;

    case 12:
      // 55 AA NNNNNNNN - missing 9 prefix
      if (digits.startsWith('55')) {
        // Insert 9 after area code: 55 AA -> 55 AA 9
        digits = digits.slice(0, 4) + '9' + digits.slice(4);
      } else {
        return null;
      }
      break;

    case 11:
      // AA 9 NNNNNNNN - missing country code
      digits = '55' + digits;
      break;

    case 10:
      // AA NNNNNNNN - missing country code AND 9 prefix
      // Add 55 and insert 9: AA -> 55 AA 9
      digits = '55' + digits.slice(0, 2) + '9' + digits.slice(2);
      break;

    default:
      return null;
  }

  // Validate against Brazilian mobile pattern
  if (!BR_MOBILE_PATTERN.test(digits)) {
    return null;
  }

  return '+' + digits;
}
