// netlify/functions/twilio-webhook.js v1.5
// Twilio WhatsApp Webhook Handler for Button Callbacks
//
// CHANGELOG:
// v1.5 (2025-12-14): Update contact_tracking.delivery_status for dashboard metrics
//   - trackDeliveryStatus now updates contact_tracking.delivery_status directly
//   - This enables campaign_performance view to show real delivery metrics
//   - Fixes "Entregues" and "Lidas" columns showing "-" in dashboard
// v1.4 (2025-12-12): Fixed campaign linking, button detection, and blacklist issues
//   - trackDeliveryStatus now looks up campaign_id from comm_logs via message_sid
//   - Button clicks now detected via ButtonText field (not just ButtonPayload)
//   - Known button texts (Portuguese) detected as engagement or opt-out
//   - ErrorCode comparison now handles both string and number types
//   - Added comprehensive logging for debugging webhook issues
//   - Inbound messages now logged to webhook_events for analytics
// v1.3 (2025-12-12): Fixed delivery tracking error causing HTTP 500
//   - Replaced upsert with explicit select-then-update/insert pattern
//   - Added better error handling to prevent function crashes
//   - Fixed null phone handling that could cause .replace() to fail
//   - All Supabase errors now logged without throwing
// v1.2 (2025-12-12): Fixed status callback routing bug
//   - Status callbacks were incorrectly routed to handleInboundMessage
//   - Now checks MessageStatus BEFORE checking Direction
//   - This ensures delivery tracking actually works
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
// 3. URL: https://wondrous-medovik-7f51be.netlify.app/.netlify/functions/twilio-webhook
//
// Environment variables required:
// - TWILIO_AUTH_TOKEN: For webhook signature validation
// - SUPABASE_URL: For blacklist database
// - SUPABASE_SERVICE_KEY: For database writes

const { createClient } = require('@supabase/supabase-js');
// Note: crypto was imported for future webhook signature validation but not yet implemented

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

    // Log ALL webhook fields for debugging
    console.log('[TwilioWebhook] Received webhook:', {
      messageSid: webhookData.MessageSid,
      from: webhookData.From,
      to: webhookData.To,
      body: webhookData.Body,
      buttonPayload: webhookData.ButtonPayload,
      buttonText: webhookData.ButtonText,
      status: webhookData.MessageStatus,
      errorCode: webhookData.ErrorCode,
      direction: webhookData.Direction
    });

    // Extract phone number (remove whatsapp: prefix)
    const phone = (webhookData.From || '').replace(/^whatsapp:/, '');
    const messageBody = (webhookData.Body || '').toLowerCase().trim();
    const buttonPayload = webhookData.ButtonPayload || '';
    const buttonText = webhookData.ButtonText || '';

    // Handle button clicks - check ButtonPayload OR ButtonText
    // Meta templates may not always set ButtonPayload, but ButtonText is always present
    if (buttonPayload || buttonText) {
      return await handleButtonClick(phone, buttonPayload || buttonText, webhookData, headers);
    }

    // Handle status updates FIRST (they don't have Direction field)
    // Must check before inbound messages to avoid routing bug
    if (webhookData.MessageStatus) {
      return await handleStatusUpdate(webhookData, headers);
    }

    // Handle inbound messages (check for opt-out keywords)
    // Only reaches here if no MessageStatus (true inbound message)
    if (webhookData.Direction === 'inbound' || !webhookData.Direction) {
      return await handleInboundMessage(phone, messageBody, webhookData, headers);
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
 * Also detects button clicks via ButtonText when ButtonPayload is not configured
 */
async function handleButtonClick(phone, buttonPayload, webhookData, headers) {
  const normalizedPayload = buttonPayload.toLowerCase().trim();
  console.log(`[TwilioWebhook] Button click from ${phone}: "${buttonPayload}"`);

  // Check for opt-out buttons (payloads AND Portuguese button texts)
  const optOutPatterns = [
    // Payloads
    'optout', 'opt_out', 'opt-out', 'unsubscribe',
    // Portuguese button texts from our templates
    'não quero', 'nao quero', 'cancelar', 'parar', 'sair',
    'não, obrigado', 'nao, obrigado', 'sem interesse'
  ];
  const isOptOut = optOutPatterns.some(p => normalizedPayload.includes(p));

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

  // Track engagement for positive buttons (payloads AND Portuguese button texts)
  const engagementPatterns = [
    // Payloads
    'winback_accept', 'lavagem_accept', 'secagem_accept', 'secagem_wb_accept',
    'welcome_thanks', 'wallet_accept', 'promo_accept', 'upsell_accept',
    // Portuguese button texts from our templates
    'quero usar', 'quero aproveitar', 'quero o desconto', 'quero!', 'vou usar',
    'obrigado', 'valeu', 'usar agora', 'agendar', 'sim', 'aceito',
    'quero conhecer', 'me interessa', 'quero saber mais'
  ];

  const isEngagement = engagementPatterns.some(p => normalizedPayload.includes(p));

  // Always track button clicks as engagement events for analytics
  await trackEngagement(phone, buttonPayload, webhookData);

  if (isEngagement) {
    console.log(`[TwilioWebhook] Tracked positive engagement from ${phone}: ${buttonPayload}`);
  } else {
    console.log(`[TwilioWebhook] Tracked button click from ${phone}: ${buttonPayload}`);
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

    // Log opt-out event
    await logInboundMessage(phone, messageBody, 'opt_out', webhookData);

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

  // Log all inbound messages for analytics
  await logInboundMessage(phone, messageBody, 'inbound_message', webhookData);
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

  console.log(`[TwilioWebhook] Status update: ${MessageSid} -> ${MessageStatus}${ErrorCode ? ` (error: ${ErrorCode})` : ''}`);

  // Track ALL status updates for delivery metrics
  await trackDeliveryStatus(MessageSid, phone, MessageStatus, ErrorCode);

  // Track failed/undelivered messages for potential blacklisting
  if (MessageStatus === 'failed' || MessageStatus === 'undelivered') {
    // Error codes that indicate opt-out (use == for string/number flexibility)
    // 63024 = number has opted out via WhatsApp
    // 63016 = recipient blocked sender
    const optOutErrorCodes = ['63024', '63016', 63024, 63016];
    const isOptOutError = optOutErrorCodes.some(code => ErrorCode == code);

    if (isOptOutError) {
      await addToBlacklist(phone, 'undelivered', `Twilio error ${ErrorCode}: Number blocked/opted-out`);
      console.log(`[TwilioWebhook] Added ${phone} to blacklist - WhatsApp opt-out (error ${ErrorCode})`);
    } else {
      console.log(`[TwilioWebhook] Message ${MessageSid} to ${phone} ${MessageStatus}: Error ${ErrorCode || 'unknown'}`);
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
 * Stores in webhook_events AND updates contact_tracking.delivery_status
 * Updates existing record if message_sid exists (for status progression: sent → delivered → read)
 * IMPORTANT: Links to campaign_id by looking up comm_logs via message_sid
 * v1.5: Now updates contact_tracking.delivery_status so campaign_performance view shows metrics
 */
async function trackDeliveryStatus(messageSid, phone, status, errorCode = null) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey || !messageSid) {
    console.log('[TwilioWebhook] Skipping delivery tracking - missing credentials or messageSid');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const normalizedPhone = (phone || '').replace(/\D/g, '');

    // ===== STEP 1: Update contact_tracking.delivery_status (for campaign_performance view) =====
    // This is the critical update that enables dashboard delivery metrics
    try {
      const { data: ctUpdated, error: ctError } = await supabase
        .from('contact_tracking')
        .update({
          delivery_status: status,
          delivery_error_code: errorCode || null,
          updated_at: new Date().toISOString()
        })
        .eq('twilio_sid', messageSid)
        .select('id, campaign_id');

      if (ctError) {
        console.error('[TwilioWebhook] Error updating contact_tracking:', ctError.message);
      } else if (ctUpdated && ctUpdated.length > 0) {
        console.log(`[TwilioWebhook] Updated contact_tracking.delivery_status: ${messageSid} -> ${status} (${ctUpdated.length} records, campaign: ${ctUpdated[0]?.campaign_id || 'unknown'})`);
      } else {
        console.log(`[TwilioWebhook] No contact_tracking record found for twilio_sid: ${messageSid}`);
      }
    } catch (ctErr) {
      console.error('[TwilioWebhook] contact_tracking update failed:', ctErr.message);
    }

    // ===== STEP 2: Update campaign_contacts for backward compatibility =====
    try {
      const { error: ccError } = await supabase
        .from('campaign_contacts')
        .update({
          delivery_status: status,
          error_code: errorCode || null
        })
        .eq('twilio_sid', messageSid);

      if (ccError) {
        // Ignore errors - campaign_contacts is deprecated
        console.log('[TwilioWebhook] campaign_contacts update skipped:', ccError.message);
      }
    } catch (ccErr) {
      // Ignore - deprecated table
    }

    // ===== STEP 3: Update webhook_events table (for analytics/debugging) =====
    // First, try to update existing record (for status progression)
    const { data: existing, error: selectError } = await supabase
      .from('webhook_events')
      .select('id, payload, campaign_id')
      .eq('message_sid', messageSid)
      .maybeSingle();

    if (selectError) {
      console.error('[TwilioWebhook] Error checking existing record:', selectError.message);
    }

    if (existing) {
      // Update existing record with new status (sent → delivered → read)
      const { error: updateError } = await supabase
        .from('webhook_events')
        .update({
          payload: status,
          error_code: errorCode,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('[TwilioWebhook] Error updating delivery status:', updateError.message);
      } else {
        console.log(`[TwilioWebhook] Updated webhook_events: ${messageSid} ${existing.payload} -> ${status}`);
      }
    } else {
      // Look up campaign_id from contact_tracking using twilio_sid
      let campaignId = null;
      try {
        // Try contact_tracking first (unified table, always has campaign_id)
        const { data: ctRecord } = await supabase
          .from('contact_tracking')
          .select('campaign_id')
          .eq('twilio_sid', messageSid)
          .maybeSingle();

        if (ctRecord?.campaign_id) {
          campaignId = ctRecord.campaign_id;
          console.log(`[TwilioWebhook] Found campaign_id ${campaignId} in contact_tracking for ${messageSid}`);
        } else {
          // Fallback: try campaign_contacts (deprecated but may have older data)
          const { data: campaignContact } = await supabase
            .from('campaign_contacts')
            .select('campaign_id')
            .eq('twilio_sid', messageSid)
            .maybeSingle();

          if (campaignContact?.campaign_id) {
            campaignId = campaignContact.campaign_id;
            console.log(`[TwilioWebhook] Found campaign_id ${campaignId} in campaign_contacts for ${messageSid}`);
          }
        }

        if (!campaignId) {
          console.log(`[TwilioWebhook] No campaign found for message ${messageSid} - webhook event won't be linked`);
        }
      } catch (lookupError) {
        console.error('[TwilioWebhook] Error looking up campaign_id:', lookupError.message);
      }

      // Insert new record with campaign_id if found
      const { error: insertError } = await supabase
        .from('webhook_events')
        .insert({
          message_sid: messageSid,
          phone: normalizedPhone,
          event_type: 'delivery_status',
          payload: status,
          error_code: errorCode,
          campaign_id: campaignId,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('[TwilioWebhook] Error inserting delivery status:', insertError.message);
      } else {
        console.log(`[TwilioWebhook] Tracked new delivery: ${messageSid} -> ${status} (campaign: ${campaignId || 'unknown'})`);
      }
    }
  } catch (error) {
    // Catch-all to prevent function crash
    console.error('[TwilioWebhook] Failed to track delivery status:', error.message || error);
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
    return false;
  }

  if (!phone) {
    console.warn('[TwilioWebhook] No phone provided for blacklist');
    return false;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Normalize phone number (remove all non-digits)
    const normalizedPhone = phone.replace(/\D/g, '');

    if (!normalizedPhone || normalizedPhone.length < 10) {
      console.warn(`[TwilioWebhook] Invalid phone number for blacklist: ${phone} -> ${normalizedPhone}`);
      return false;
    }

    console.log(`[TwilioWebhook] Adding to blacklist: ${normalizedPhone} (reason: ${reason})`);

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
      })
      .select();

    if (error) {
      console.error('[TwilioWebhook] Blacklist insert error:', error.message, error.details);
      return false;
    }

    console.log(`[TwilioWebhook] Successfully added ${normalizedPhone} to blacklist`);
    return true;
  } catch (error) {
    console.error('[TwilioWebhook] Failed to add to blacklist:', error.message || error);
    return false;
  }
}

/**
 * Log inbound messages to webhook_events for analytics
 */
async function logInboundMessage(phone, messageBody, eventType, webhookData) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const normalizedPhone = (phone || '').replace(/\D/g, '');

    await supabase
      .from('webhook_events')
      .insert({
        phone: normalizedPhone,
        event_type: eventType,
        payload: messageBody.substring(0, 500), // Truncate long messages
        message_sid: webhookData.MessageSid,
        created_at: new Date().toISOString()
      });

    console.log(`[TwilioWebhook] Logged inbound message: ${eventType} from ${normalizedPhone}`);
  } catch (error) {
    console.error('[TwilioWebhook] Failed to log inbound message:', error.message);
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
