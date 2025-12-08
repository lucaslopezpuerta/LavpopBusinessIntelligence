-- Lavpop Business Intelligence - Supabase Schema
-- Run this SQL in your Supabase SQL Editor to set up the database
--
-- Tables:
-- - blacklist: WhatsApp opt-outs and undelivered numbers
-- - campaigns: Campaign definitions and stats
-- - campaign_sends: Individual send events
-- - scheduled_campaigns: Future campaign executions
-- - comm_logs: Communication audit trail
-- - automation_rules: Automation configurations

-- ==================== BLACKLIST TABLE ====================
-- Stores phone numbers that should not receive WhatsApp messages

CREATE TABLE IF NOT EXISTS blacklist (
  phone TEXT PRIMARY KEY,           -- Normalized format: +5554996923504
  customer_name TEXT,               -- Customer name for reference
  reason TEXT NOT NULL DEFAULT 'manual',  -- opt-out, undelivered, number-blocked, manual
  source TEXT DEFAULT 'manual',     -- twilio-sync, manual, csv-import
  error_code INT,                   -- Twilio error code (e.g., 63024)
  error_message TEXT,               -- Detailed error message
  message_sid TEXT,                 -- Original message SID that caused the block
  added_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for filtering by reason
CREATE INDEX IF NOT EXISTS idx_blacklist_reason ON blacklist(reason);
CREATE INDEX IF NOT EXISTS idx_blacklist_added_at ON blacklist(added_at DESC);

-- ==================== CAMPAIGNS TABLE ====================
-- Campaign definitions and aggregate statistics

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,              -- Format: CAMP_1234567890
  name TEXT NOT NULL,
  template_id TEXT,                 -- References MESSAGE_TEMPLATES
  audience TEXT,                    -- atRisk, newCustomers, healthy, withWallet, all
  audience_count INT DEFAULT 0,
  status TEXT DEFAULT 'draft',      -- draft, active, paused, completed
  sends INT DEFAULT 0,              -- Total successful sends
  delivered INT DEFAULT 0,          -- Confirmed deliveries
  opened INT DEFAULT 0,             -- Opens (if trackable)
  converted INT DEFAULT 0,          -- Conversions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  last_sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);

-- ==================== CAMPAIGN SENDS TABLE ====================
-- Individual send events for analytics

CREATE TABLE IF NOT EXISTS campaign_sends (
  id SERIAL PRIMARY KEY,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
  recipients INT DEFAULT 0,
  success_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_sends_campaign_id ON campaign_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_sent_at ON campaign_sends(sent_at DESC);

-- ==================== SCHEDULED CAMPAIGNS TABLE ====================
-- Campaigns scheduled for future execution

CREATE TABLE IF NOT EXISTS scheduled_campaigns (
  id TEXT PRIMARY KEY,              -- Format: SCHED_1234567890
  campaign_id TEXT,                 -- Optional reference to campaigns table
  template_id TEXT NOT NULL,
  audience TEXT NOT NULL,
  message_body TEXT NOT NULL,       -- Pre-rendered message template
  recipients JSONB NOT NULL,        -- Array of {phone, name, wallet, etc.}
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled',  -- scheduled, processing, sent, failed, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ,
  execution_result JSONB            -- Result details from execution
);

CREATE INDEX IF NOT EXISTS idx_scheduled_status_time ON scheduled_campaigns(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_created_at ON scheduled_campaigns(created_at DESC);

-- ==================== COMMUNICATION LOGS TABLE ====================
-- Audit trail of all communications

CREATE TABLE IF NOT EXISTS comm_logs (
  id SERIAL PRIMARY KEY,
  phone TEXT NOT NULL,              -- Recipient phone
  customer_id TEXT,                 -- Internal customer ID
  channel TEXT DEFAULT 'whatsapp',  -- whatsapp, sms, email
  direction TEXT DEFAULT 'outbound', -- outbound, inbound
  message TEXT,                     -- Message content (truncated)
  external_id TEXT,                 -- Twilio message SID
  status TEXT DEFAULT 'sent',       -- sent, delivered, read, failed
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comm_logs_phone ON comm_logs(phone);
CREATE INDEX IF NOT EXISTS idx_comm_logs_sent_at ON comm_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_comm_logs_customer_id ON comm_logs(customer_id);

-- ==================== AUTOMATION RULES TABLE ====================
-- Automation configuration

CREATE TABLE IF NOT EXISTS automation_rules (
  id TEXT PRIMARY KEY,              -- e.g., winback_30, welcome_new
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT FALSE,
  trigger_type TEXT,                -- days_since_visit, first_purchase, wallet_balance
  trigger_value INT,                -- Threshold value
  action_template TEXT,             -- Template ID to use
  action_channel TEXT DEFAULT 'whatsapp',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== HELPER FUNCTIONS ====================

-- Function to increment campaign send count
CREATE OR REPLACE FUNCTION increment_campaign_sends(
  p_campaign_id TEXT,
  p_send_count INT
)
RETURNS VOID AS $$
BEGIN
  UPDATE campaigns
  SET
    sends = sends + p_send_count,
    status = 'active',
    last_sent_at = NOW(),
    updated_at = NOW()
  WHERE id = p_campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_blacklist_updated_at ON blacklist;
CREATE TRIGGER update_blacklist_updated_at
  BEFORE UPDATE ON blacklist
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_automation_rules_updated_at ON automation_rules;
CREATE TRIGGER update_automation_rules_updated_at
  BEFORE UPDATE ON automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==================== ROW LEVEL SECURITY (Optional) ====================
-- Uncomment these if you want to enable RLS

-- ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE campaign_sends ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE scheduled_campaigns ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE comm_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

-- Policy for service role (full access)
-- CREATE POLICY "Service role full access" ON blacklist FOR ALL USING (true);

-- ==================== SAMPLE DATA (Optional) ====================
-- Default automation rules

INSERT INTO automation_rules (id, name, enabled, trigger_type, trigger_value, action_template, action_channel)
VALUES
  ('winback_30', 'Win-back 30 dias', false, 'days_since_visit', 30, 'winback_30days', 'whatsapp'),
  ('welcome_new', 'Boas-vindas', false, 'first_purchase', 1, 'welcome_new', 'whatsapp'),
  ('wallet_reminder', 'Lembrete de saldo', false, 'wallet_balance', 20, 'wallet_reminder', 'whatsapp')
ON CONFLICT (id) DO NOTHING;

-- ==================== GRANTS ====================
-- Grant permissions to authenticated and anon roles (adjust as needed)

GRANT SELECT, INSERT, UPDATE, DELETE ON blacklist TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON campaign_sends TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON scheduled_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON comm_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON automation_rules TO authenticated;

GRANT USAGE, SELECT ON SEQUENCE campaign_sends_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE comm_logs_id_seq TO authenticated;
