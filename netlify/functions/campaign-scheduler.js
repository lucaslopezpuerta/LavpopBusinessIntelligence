// netlify/functions/campaign-scheduler.js
// Scheduled function to execute pending campaigns
// Runs every 5 minutes via Netlify Scheduled Functions
//
// Environment variables required:
// - TWILIO_ACCOUNT_SID: Your Twilio Account SID
// - TWILIO_AUTH_TOKEN: Your Twilio Auth Token
// - TWILIO_WHATSAPP_NUMBER: Your approved WhatsApp number
// - SUPABASE_URL: Your Supabase project URL
// - SUPABASE_SERVICE_KEY: Your Supabase service role key

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(url, key);
}

exports.handler = async (event, context) => {
  console.log('Campaign scheduler running at:', new Date().toISOString());

  const supabase = getSupabase();

  try {
    // Find campaigns due for sending
    const now = new Date().toISOString();

    const { data: dueCampaigns, error: fetchError } = await supabase
      .from('scheduled_campaigns')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true })
      .limit(10); // Process max 10 at a time to avoid timeout

    if (fetchError) {
      console.error('Error fetching scheduled campaigns:', fetchError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch campaigns' })
      };
    }

    if (!dueCampaigns || dueCampaigns.length === 0) {
      console.log('No campaigns due for execution');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No campaigns to process' })
      };
    }

    console.log(`Found ${dueCampaigns.length} campaigns to execute`);

    const results = [];

    for (const campaign of dueCampaigns) {
      try {
        // Mark as processing
        await supabase
          .from('scheduled_campaigns')
          .update({ status: 'processing' })
          .eq('id', campaign.id);

        // Execute the campaign
        const sendResult = await executeCampaign(campaign);

        // Update status based on result
        await supabase
          .from('scheduled_campaigns')
          .update({
            status: sendResult.success ? 'sent' : 'failed',
            executed_at: new Date().toISOString(),
            execution_result: sendResult
          })
          .eq('id', campaign.id);

        // Log the send to campaign_sends
        if (sendResult.success) {
          await supabase
            .from('campaign_sends')
            .insert({
              campaign_id: campaign.campaign_id,
              recipients: campaign.recipients?.length || 0,
              success_count: sendResult.sent || 0,
              failed_count: sendResult.failed || 0
            });
        }

        results.push({
          campaignId: campaign.id,
          success: sendResult.success,
          sent: sendResult.sent,
          failed: sendResult.failed
        });

        console.log(`Campaign ${campaign.id} executed:`, sendResult);

      } catch (campaignError) {
        console.error(`Error executing campaign ${campaign.id}:`, campaignError);

        // Mark as failed
        await supabase
          .from('scheduled_campaigns')
          .update({
            status: 'failed',
            executed_at: new Date().toISOString(),
            execution_result: { error: campaignError.message }
          })
          .eq('id', campaign.id);

        results.push({
          campaignId: campaign.id,
          success: false,
          error: campaignError.message
        });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Processed ${results.length} campaigns`,
        results
      })
    };

  } catch (error) {
    console.error('Campaign scheduler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

/**
 * Execute a campaign by sending WhatsApp messages
 */
async function executeCampaign(campaign) {
  const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!ACCOUNT_SID || !AUTH_TOKEN || !WHATSAPP_FROM) {
    throw new Error('Twilio credentials not configured');
  }

  const recipients = campaign.recipients || [];
  const messageBody = campaign.message_body;

  if (recipients.length === 0) {
    return { success: true, sent: 0, failed: 0, message: 'No recipients' };
  }

  const results = { success: [], failed: [] };
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`;
  const credentials = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');

  for (const recipient of recipients) {
    try {
      // Personalize message
      const personalizedMessage = messageBody
        .replace(/\{\{nome\}\}/gi, recipient.name || 'Cliente')
        .replace(/\{\{saldo\}\}/gi, formatCurrency(recipient.wallet));

      const params = new URLSearchParams();
      params.append('From', `whatsapp:${WHATSAPP_FROM}`);
      params.append('To', `whatsapp:${recipient.phone}`);
      params.append('Body', personalizedMessage);

      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const data = await response.json();

      if (response.ok) {
        results.success.push({ phone: recipient.phone, sid: data.sid });
      } else {
        results.failed.push({ phone: recipient.phone, error: data.message });
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      results.failed.push({ phone: recipient.phone, error: error.message });
    }
  }

  return {
    success: true,
    sent: results.success.length,
    failed: results.failed.length,
    details: results
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}
