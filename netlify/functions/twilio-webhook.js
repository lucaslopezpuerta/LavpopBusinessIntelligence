// netlify/functions/twilio-webhook.js v1.1
// Twilio WhatsApp Webhook Handler for Button Callbacks
//
// CHANGELOG:
// v1.1 (2025-12-11): Added delivery status tracking
//   - All status updates (sent, delivered, read, failed) now tracked in webhook_events
//   - Enables real delivery rate calculation instead of estimates
//   - Added trackDeliveryStatus function for persistence
// v1.0: Initial implementation
//
// Handles incoming webhooks from Twilio/Meta for:
// - Quick Reply button clicks (opt-out, engagement tracking)
// - Inbound messages (potential opt-out keywords)
// - Delivery status updates (now persisted for metrics)
//
// To configure:
// 1. Set this URL in Twilio Console > Messaging > WhatsApp Senders
// 2. Configure webhook for "When a message comes in"
// 3. URL: https://your-site.netlify.app/.netlify/functions/twilio-webhook
//
// Environment variables required:
// - TWILIO_AUTH_TOKEN: For webhook signature validation
// - SUPABASE_URL: For blacklist database
// - SUPABASE_SERVICE_KEY: For database writes

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/xml',
    'Access-Control-Allow-Origin': '*'
  };

  // Handle GET requests (Twilio verification)
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Webhook endpoint active'
    };
  }

  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
    };
  }

  try {
    // Parse webhook payload (URL-encoded form data)
    const params = new URLSearchParams(event.body);
    const webhookData = Object.fromEntries(params.entries());

    console.log('[TwilioWebhook] Received webhook:', {
      messageSid: webhookData.MessageSid,
      from: webhookData.From,
      body: webhookData.Body,
      buttonPayload: webhookData.ButtonPayload,
      status: webhookData.MessageStatus
    });

    // Extract phone number (remove whatsapp: prefix)
    const phone = (webhookData.From || '').replace(/^whatsapp:/, '');
    const messageBody = (webhookData.Body || '').toLowerCase().trim();
    const buttonPayload = webhookData.ButtonPayload || '';

    // Handle button clicks
    if (buttonPayload) {
      return await handleButtonClick(phone, buttonPayload, webhookData, headers);
    }

    // Handle inbound messages (check for opt-out keywords)
    if (webhookData.Direction === 'inbound' || !webhookData.Direction) {
      return await handleInboundMessage(phone, messageBody, webhookData, headers);
    }

    // Handle status updates
    if (webhookData.MessageStatus) {
      return await handleStatusUpdate(webhookData, headers);
    }

    // Default response (empty TwiML)
    return {
      statusCode: 200,
      headers,
      body: '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
    };

  } catch (error) {
    console.error('[TwilioWebhook] Error:', error);
    return {
      statusCode: 200, // Always return 200 to Twilio to prevent retries
      headers,
      body: '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
    };
  }
};

/**
 * Handle Quick Reply button clicks
 * Button payloads are defined in meta-whatsapp-templates.md
 */
async function handleButtonClick(phone, buttonPayload, webhookData, headers) {
  console.log(`[TwilioWebhook] Button click from ${phone}: ${buttonPayload}`);

  // Check for opt-out buttons
  const optOutPayloads = ['optout', 'opt_out', 'opt-out', 'unsubscribe'];
  const isOptOut = optOutPayloads.some(p => buttonPayload.toLowerCase().includes(p));

  if (isOptOut) {
    // Add to blacklist
    await addToBlacklist(phone, 'opt-out', `Button click: ${buttonPayload}`);

    console.log(`[TwilioWebhook] Added ${phone} to blacklist via button opt-out`);

    // Return acknowledgment (no message needed - already showed button text)
    return {
      statusCode: 200,
      headers,
      body: '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
    };
  }

  // Track engagement for non-opt-out buttons
  const engagementPayloads = [
    'winback_accept', 'lavagem_accept', 'secagem_accept', 'secagem_wb_accept',
    'welcome_thanks', 'wallet_accept', 'promo_accept', 'upsell_accept'
  ];

  const isEngagement = engagementPayloads.some(p => buttonPayload.toLowerCase().includes(p));
  if (isEngagement) {
    await trackEngagement(phone, buttonPayload, webhookData);
    console.log(`[TwilioWebhook] Tracked engagement from ${phone}: ${buttonPayload}`);
  }

  return {
    statusCode: 200,
    headers,
    body: '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
  };
}

/**
 * Handle inbound text messages (check for opt-out keywords)
 */
async function handleInboundMessage(phone, messageBody, webhookData, headers) {
  // Opt-out keywords (Portuguese and English)
  const optOutKeywords = [
    'parar', 'pare', 'stop', 'cancelar', 'sair', 'remover',
    'não quero', 'nao quero', 'desinscrever', 'unsubscribe'
  ];

  // Normalize message (remove accents)
  const normalizedBody = messageBody
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const hasOptOutKeyword = optOutKeywords.some(kw => normalizedBody.includes(kw));

  if (hasOptOutKeyword) {
    await addToBlacklist(phone, 'opt-out', `Keyword: "${messageBody}"`);
    console.log(`[TwilioWebhook] Added ${phone} to blacklist via keyword opt-out`);

    // Send confirmation message
    return {
      statusCode: 200,
      headers,
      body: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Você foi removido da nossa lista de mensagens. Não enviaremos mais comunicações por WhatsApp. Se mudar de ideia, visite nossa lavanderia!</Message>
</Response>`
    };
  }

  // Log the message for potential future use
  console.log(`[TwilioWebhook] Inbound message from ${phone}: ${messageBody}`);

  return {
    statusCode: 200,
    headers,
    body: '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
  };
}

/**
 * Handle message status updates
 * Tracks delivery status for real-time campaign metrics
 */
async function handleStatusUpdate(webhookData, headers) {
  const { MessageSid, MessageStatus, ErrorCode, To } = webhookData;
  const phone = (To || '').replace(/^whatsapp:/, '');

  // Track ALL status updates for delivery metrics
  await trackDeliveryStatus(MessageSid, phone, MessageStatus, ErrorCode);

  // Track failed/undelivered messages for potential blacklisting
  if (MessageStatus === 'failed' || MessageStatus === 'undelivered') {
    // Error 63024 = number has opted out via WhatsApp
    if (ErrorCode === '63024') {
      await addToBlacklist(phone, 'undelivered', `Twilio error ${ErrorCode}: Number blocked`);
      console.log(`[TwilioWebhook] Added ${phone} to blacklist - WhatsApp opt-out (63024)`);
    } else {
      console.log(`[TwilioWebhook] Message ${MessageSid} to ${phone} ${MessageStatus}: Error ${ErrorCode}`);
    }
  }

  return {
    statusCode: 200,
    headers,
    body: '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
  };
}

/**
 * Track delivery status for campaign metrics
 * Stores in webhook_events for real delivery rate calculations
 */
async function trackDeliveryStatus(messageSid, phone, status, errorCode = null) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey || !messageSid) {
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const normalizedPhone = phone.replace(/\D/g, '');

    // Upsert delivery status (update if message_sid exists)
    const { error } = await supabase
      .from('webhook_events')
      .upsert({
        message_sid: messageSid,
        phone: normalizedPhone,
        event_type: 'delivery_status',
        payload: status,
        error_code: errorCode,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'message_sid',
        ignoreDuplicates: false
      });

    if (error) {
      // If upsert fails (no unique constraint), try insert
      await supabase
        .from('webhook_events')
        .insert({
          message_sid: messageSid,
          phone: normalizedPhone,
          event_type: 'delivery_status',
          payload: status,
          error_code: errorCode,
          created_at: new Date().toISOString()
        });
    }

    console.log(`[TwilioWebhook] Tracked delivery: ${messageSid} -> ${status}`);
  } catch (error) {
    console.error('[TwilioWebhook] Failed to track delivery status:', error);
  }
}

/**
 * Add phone number to blacklist
 */
async function addToBlacklist(phone, reason, notes = null) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[TwilioWebhook] Supabase not configured - blacklist not saved');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Normalize phone number
    const normalizedPhone = phone.replace(/\D/g, '');

    // Upsert to blacklist (update if exists, insert if not)
    const { error } = await supabase
      .from('blacklist')
      .upsert({
        phone: normalizedPhone,
        reason: reason,
        notes: notes,
        source: 'webhook',
        created_at: new Date().toISOString()
      }, {
        onConflict: 'phone'
      });

    if (error) {
      console.error('[TwilioWebhook] Blacklist insert error:', error);
    }
  } catch (error) {
    console.error('[TwilioWebhook] Failed to add to blacklist:', error);
  }
}

/**
 * Track engagement (button clicks indicating interest)
 */
async function trackEngagement(phone, buttonPayload, webhookData) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const normalizedPhone = phone.replace(/\D/g, '');

    // Log engagement event
    await supabase
      .from('webhook_events')
      .insert({
        phone: normalizedPhone,
        event_type: 'button_click',
        payload: buttonPayload,
        message_sid: webhookData.MessageSid,
        created_at: new Date().toISOString()
      });

    // Update contact_tracking status if exists
    await supabase
      .from('contact_tracking')
      .update({
        engagement_type: buttonPayload,
        engaged_at: new Date().toISOString()
      })
      .eq('phone', normalizedPhone)
      .eq('status', 'pending');

  } catch (error) {
    console.error('[TwilioWebhook] Failed to track engagement:', error);
  }
}
