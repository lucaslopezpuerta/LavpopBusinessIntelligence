// netlify/functions/twilio-whatsapp.js
// Twilio WhatsApp Business API integration for campaign messaging
//
// Environment variables required:
// - TWILIO_ACCOUNT_SID: Your Twilio Account SID
// - TWILIO_AUTH_TOKEN: Your Twilio Auth Token
// - TWILIO_WHATSAPP_NUMBER: Your approved WhatsApp number (format: +5554999999999)

exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

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

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action. Use: send_message, send_bulk, check_status' })
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};

/**
 * Send a single WhatsApp message
 */
async function sendMessage(body, accountSid, authToken, from, headers) {
  const { to, message, templateName, templateVariables } = body;

  if (!to || (!message && !templateName)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing required fields: to, message or templateName' })
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

  // Prepare message body
  let messageBody = message;
  if (templateName && templateVariables) {
    messageBody = formatTemplate(templateName, templateVariables);
  }

  // Call Twilio API
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const params = new URLSearchParams();
  params.append('From', `whatsapp:${from}`);
  params.append('To', `whatsapp:${toNumber}`);
  params.append('Body', messageBody);

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
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    throw new Error(`Twilio request failed: ${error.message}`);
  }
}

/**
 * Send bulk WhatsApp messages (with rate limiting)
 */
async function sendBulkMessages(body, accountSid, authToken, from, headers) {
  const { recipients, message, templateName, templateVariables } = body;

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
      const result = await sendMessage(
        {
          to: recipient.phone,
          message: personalizeMessage(message, recipient),
          templateName,
          templateVariables: personalizeVariables(templateVariables, recipient)
        },
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
          messageSid: resultBody.messageSid
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
        total: results.total
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
 * Format currency (BRL)
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}
