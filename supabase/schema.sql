-- Lavpop Business Intelligence - Supabase Schema
-- Run this SQL in your Supabase SQL Editor to set up the database
-- Version: 2.0 (2025-12-08)
--
-- Tables:
-- - blacklist: WhatsApp opt-outs and undelivered numbers
-- - campaigns: Campaign definitions and stats (enhanced with effectiveness fields)
-- - campaign_sends: Individual send events
-- - campaign_contacts: Links campaigns to contact_tracking for effectiveness
-- - scheduled_campaigns: Future campaign executions
-- - comm_logs: Communication audit trail
-- - contact_tracking: Customer contact outcome tracking
-- - automation_rules: Automation configurations
--
-- Views:
-- - campaign_performance: Campaign metrics with return rates
-- - campaign_effectiveness: Aggregated by campaign for effectiveness metrics
-- - contact_effectiveness_summary: Overall contact tracking summary

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
  status TEXT DEFAULT 'draft',      -- draft, active, paused, completed, scheduled
  sends INT DEFAULT 0,              -- Total successful sends
  delivered INT DEFAULT 0,          -- Confirmed deliveries
  opened INT DEFAULT 0,             -- Opens (if trackable)
  converted INT DEFAULT 0,          -- Conversions
  -- Enhanced fields for full campaign management
  message_body TEXT,                -- The actual WhatsApp message to send
  contact_method TEXT DEFAULT 'whatsapp',  -- whatsapp, sms, email
  target_segments JSONB,            -- {"segments": ["atRisk"], "walletMin": 10}
  scheduled_for TIMESTAMPTZ,        -- Scheduled execution time (null = immediate)
  recipient_snapshot JSONB,         -- Store recipient details at send time
  created_by TEXT,                  -- Who created the campaign
  error_message TEXT,               -- Error tracking for failed campaigns
  -- A/B Testing fields for discount effectiveness analysis
  discount_percent NUMERIC(5,2),    -- Discount % offered (e.g., 20.00)
  coupon_code TEXT,                 -- POS coupon code used (e.g., 'VOLTE20')
  service_type TEXT,                -- 'wash', 'dry', 'both' - what service the discount applies to
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  last_sent_at TIMESTAMPTZ
);

-- Add columns if they don't exist (for migration)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS service_type TEXT;

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

-- ==================== CONTACT TRACKING TABLE ====================
-- Tracks customer outreach and measures campaign effectiveness

CREATE TABLE IF NOT EXISTS contact_tracking (
  id SERIAL PRIMARY KEY,
  customer_id TEXT NOT NULL,              -- Customer doc (CPF)
  customer_name TEXT,                     -- For display
  risk_level TEXT,                        -- At Risk, Churning at time of contact

  -- Contact details
  contacted_at TIMESTAMPTZ DEFAULT NOW(),
  contact_method TEXT,                    -- call, whatsapp, email, manual

  -- Campaign link (null for manual contacts)
  campaign_id TEXT,                       -- Links to campaigns table
  campaign_name TEXT,                     -- For display without join

  -- Outcome tracking
  status TEXT DEFAULT 'pending',          -- pending, returned, expired, cleared
  returned_at TIMESTAMPTZ,                -- When customer came back
  days_to_return INT,                     -- Calculated: returned_at - contacted_at
  return_revenue DECIMAL(10,2),           -- Revenue from return visit(s)

  -- Expiration (7 days from contact)
  expires_at TIMESTAMPTZ,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_tracking_customer ON contact_tracking(customer_id);
CREATE INDEX IF NOT EXISTS idx_contact_tracking_status ON contact_tracking(status);
CREATE INDEX IF NOT EXISTS idx_contact_tracking_campaign ON contact_tracking(campaign_id);
CREATE INDEX IF NOT EXISTS idx_contact_tracking_contacted_at ON contact_tracking(contacted_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_tracking_expires ON contact_tracking(expires_at) WHERE status = 'pending';

-- ==================== CAMPAIGN CONTACTS TABLE ====================
-- Links campaigns to contact_tracking for effectiveness measurement

CREATE TABLE IF NOT EXISTS campaign_contacts (
  id SERIAL PRIMARY KEY,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_tracking_id INT REFERENCES contact_tracking(id) ON DELETE SET NULL,
  customer_id TEXT NOT NULL,
  customer_name TEXT,
  phone TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivery_status TEXT DEFAULT 'pending', -- pending, sent, delivered, failed, read
  twilio_sid TEXT,                         -- Twilio message SID
  error_code INT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_contacts_campaign_id ON campaign_contacts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_customer_id ON campaign_contacts(customer_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_status ON campaign_contacts(delivery_status);

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
  customer_id TEXT,                 -- Internal customer ID (CPF)
  channel TEXT DEFAULT 'whatsapp',  -- whatsapp, sms, email
  direction TEXT DEFAULT 'outbound', -- outbound, inbound
  message TEXT,                     -- Message content (truncated)
  external_id TEXT,                 -- Twilio message SID
  status TEXT DEFAULT 'sent',       -- sent, delivered, read, failed
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  -- Additional fields for contact tracking and communication logging
  type TEXT DEFAULT 'communication', -- communication, contact_tracking
  method TEXT,                      -- call, whatsapp, email, manual, note
  notes TEXT,                       -- Communication notes/description
  expires_at TIMESTAMPTZ            -- For contact tracking expiration (7 days)
);

CREATE INDEX IF NOT EXISTS idx_comm_logs_phone ON comm_logs(phone);
CREATE INDEX IF NOT EXISTS idx_comm_logs_sent_at ON comm_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_comm_logs_customer_id ON comm_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_comm_logs_type ON comm_logs(type);
CREATE INDEX IF NOT EXISTS idx_comm_logs_customer_type ON comm_logs(customer_id, type);

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

-- ==================== VIEWS ====================
-- Drop existing views first to allow column changes
-- (CREATE OR REPLACE VIEW cannot rename columns)
DROP VIEW IF EXISTS contact_effectiveness_summary CASCADE;
DROP VIEW IF EXISTS campaign_effectiveness CASCADE;
DROP VIEW IF EXISTS campaign_performance CASCADE;

-- Campaign performance view with effectiveness metrics
CREATE OR REPLACE VIEW campaign_performance AS
SELECT
  c.id,
  c.name,
  c.audience,
  c.status,
  c.contact_method,
  c.sends,
  c.delivered,
  c.created_at,
  c.last_sent_at,
  -- Contact tracking metrics
  COUNT(DISTINCT ct.id) as contacts_tracked,
  COUNT(DISTINCT CASE WHEN ct.status = 'returned' THEN ct.id END) as contacts_returned,
  ROUND(
    CASE
      WHEN COUNT(DISTINCT ct.id) > 0
      THEN (COUNT(DISTINCT CASE WHEN ct.status = 'returned' THEN ct.id END)::DECIMAL / COUNT(DISTINCT ct.id)) * 100
      ELSE 0
    END, 1
  ) as return_rate,
  COALESCE(SUM(ct.return_revenue), 0) as total_revenue_recovered,
  ROUND(AVG(ct.days_to_return), 1) as avg_days_to_return
FROM campaigns c
LEFT JOIN campaign_contacts cc ON c.id = cc.campaign_id
LEFT JOIN contact_tracking ct ON cc.contact_tracking_id = ct.id
GROUP BY c.id, c.name, c.audience, c.status, c.contact_method, c.sends, c.delivered, c.created_at, c.last_sent_at;

-- Campaign effectiveness summary view (grouped by campaign)
-- Enhanced with A/B testing metrics for discount effectiveness analysis
CREATE OR REPLACE VIEW campaign_effectiveness AS
SELECT
  ct.campaign_id,
  ct.campaign_name,
  ct.contact_method,
  -- Contact metrics
  COUNT(*) as total_contacts,
  COUNT(*) FILTER (WHERE ct.status = 'returned') as returned_count,
  COUNT(*) FILTER (WHERE ct.status = 'expired') as expired_count,
  COUNT(*) FILTER (WHERE ct.status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE ct.status = 'cleared') as cleared_count,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE ct.status = 'returned') / NULLIF(COUNT(*), 0),
    1
  ) as return_rate,
  ROUND(AVG(ct.days_to_return) FILTER (WHERE ct.status = 'returned'), 1) as avg_days_to_return,
  -- Revenue metrics
  COALESCE(SUM(ct.return_revenue) FILTER (WHERE ct.status = 'returned'), 0) as total_return_revenue,
  -- A/B Testing metrics (from campaigns table)
  c.discount_percent,
  c.coupon_code,
  c.service_type,
  -- Net Return Value = Revenue - Discount Cost
  -- Discount cost = Revenue * (discount_percent / 100)
  ROUND(
    COALESCE(SUM(ct.return_revenue) FILTER (WHERE ct.status = 'returned'), 0) *
    (1 - COALESCE(c.discount_percent, 0) / 100),
    2
  ) as net_return_value,
  -- ROI metrics
  ROUND(
    CASE
      WHEN COUNT(*) FILTER (WHERE ct.status = 'returned') > 0
      THEN COALESCE(SUM(ct.return_revenue) FILTER (WHERE ct.status = 'returned'), 0) /
           COUNT(*) FILTER (WHERE ct.status = 'returned')
      ELSE 0
    END,
    2
  ) as avg_revenue_per_return,
  MIN(ct.contacted_at) as first_contact,
  MAX(ct.contacted_at) as last_contact
FROM contact_tracking ct
LEFT JOIN campaigns c ON ct.campaign_id = c.id
GROUP BY ct.campaign_id, ct.campaign_name, ct.contact_method, c.discount_percent, c.coupon_code, c.service_type;

-- Overall effectiveness (all contacts, with and without campaigns)
CREATE OR REPLACE VIEW contact_effectiveness_summary AS
SELECT
  COALESCE(contact_method, 'unknown') as method,
  CASE WHEN campaign_id IS NOT NULL THEN 'campaign' ELSE 'manual' END as source,
  COUNT(*) as total_contacts,
  COUNT(*) FILTER (WHERE status = 'returned') as returned_count,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE status = 'returned') / NULLIF(COUNT(*), 0),
    1
  ) as return_rate,
  ROUND(AVG(days_to_return) FILTER (WHERE status = 'returned'), 1) as avg_days_to_return,
  COALESCE(SUM(return_revenue) FILTER (WHERE status = 'returned'), 0) as total_revenue
FROM contact_tracking
WHERE contacted_at >= NOW() - INTERVAL '30 days'
GROUP BY
  COALESCE(contact_method, 'unknown'),
  CASE WHEN campaign_id IS NOT NULL THEN 'campaign' ELSE 'manual' END;

-- ==================== HELPER FUNCTIONS ====================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- Function to create a campaign and return its ID
CREATE OR REPLACE FUNCTION create_campaign(
  p_name TEXT,
  p_template_id TEXT,
  p_audience TEXT,
  p_audience_count INT,
  p_message_body TEXT,
  p_contact_method TEXT DEFAULT 'whatsapp',
  p_target_segments JSONB DEFAULT NULL,
  p_scheduled_for TIMESTAMPTZ DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_campaign_id TEXT;
BEGIN
  v_campaign_id := 'CAMP_' || EXTRACT(EPOCH FROM NOW())::BIGINT;

  INSERT INTO campaigns (
    id, name, template_id, audience, audience_count,
    message_body, contact_method, target_segments,
    scheduled_for, status, created_at
  ) VALUES (
    v_campaign_id, p_name, p_template_id, p_audience, p_audience_count,
    p_message_body, p_contact_method, p_target_segments,
    p_scheduled_for,
    CASE WHEN p_scheduled_for IS NOT NULL THEN 'scheduled' ELSE 'draft' END,
    NOW()
  );

  RETURN v_campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record a campaign contact (links campaign to contact tracking)
CREATE OR REPLACE FUNCTION record_campaign_contact(
  p_campaign_id TEXT,
  p_customer_id TEXT,
  p_customer_name TEXT,
  p_phone TEXT,
  p_contact_method TEXT DEFAULT 'whatsapp'
)
RETURNS INT AS $$
DECLARE
  v_contact_tracking_id INT;
  v_campaign_contact_id INT;
BEGIN
  -- First, create a contact tracking record
  INSERT INTO contact_tracking (
    customer_id, customer_name, contact_method,
    campaign_id, campaign_name, status, expires_at
  )
  SELECT
    p_customer_id, p_customer_name, p_contact_method,
    p_campaign_id, c.name, 'pending',
    NOW() + INTERVAL '7 days'
  FROM campaigns c WHERE c.id = p_campaign_id
  RETURNING id INTO v_contact_tracking_id;

  -- Then link it to campaign_contacts
  INSERT INTO campaign_contacts (
    campaign_id, contact_tracking_id, customer_id, customer_name, phone
  ) VALUES (
    p_campaign_id, v_contact_tracking_id, p_customer_id, p_customer_name, p_phone
  )
  RETURNING id INTO v_campaign_contact_id;

  RETURN v_campaign_contact_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update campaign send statistics
CREATE OR REPLACE FUNCTION update_campaign_stats(
  p_campaign_id TEXT,
  p_success_count INT,
  p_failed_count INT
)
RETURNS VOID AS $$
BEGIN
  UPDATE campaigns
  SET
    sends = sends + p_success_count,
    status = 'active',
    last_sent_at = NOW(),
    updated_at = NOW()
  WHERE id = p_campaign_id;

  -- Also insert into campaign_sends for history
  INSERT INTO campaign_sends (campaign_id, recipients, success_count, failed_count)
  VALUES (p_campaign_id, p_success_count + p_failed_count, p_success_count, p_failed_count);
END;
$$ LANGUAGE plpgsql;

-- Function to mark customer as returned
CREATE OR REPLACE FUNCTION mark_customer_returned(
  p_customer_id TEXT,
  p_return_date TIMESTAMPTZ,
  p_revenue DECIMAL
)
RETURNS INT AS $$
DECLARE
  v_updated INT := 0;
BEGIN
  UPDATE contact_tracking
  SET
    status = 'returned',
    returned_at = p_return_date,
    days_to_return = EXTRACT(DAY FROM p_return_date - contacted_at)::INT,
    return_revenue = COALESCE(return_revenue, 0) + p_revenue,
    updated_at = NOW()
  WHERE
    customer_id = p_customer_id
    AND status = 'pending'
    AND contacted_at < p_return_date;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

-- Function to expire old contacts
CREATE OR REPLACE FUNCTION expire_old_contacts()
RETURNS INT AS $$
DECLARE
  v_updated INT := 0;
BEGIN
  UPDATE contact_tracking
  SET
    status = 'expired',
    updated_at = NOW()
  WHERE
    status = 'pending'
    AND expires_at < NOW();

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

-- ==================== TRIGGERS ====================

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

DROP TRIGGER IF EXISTS update_contact_tracking_updated_at ON contact_tracking;
CREATE TRIGGER update_contact_tracking_updated_at
  BEFORE UPDATE ON contact_tracking
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
-- ALTER TABLE contact_tracking ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE campaign_contacts ENABLE ROW LEVEL SECURITY;

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
GRANT SELECT, INSERT, UPDATE, DELETE ON contact_tracking TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON campaign_contacts TO authenticated;

GRANT USAGE, SELECT ON SEQUENCE campaign_sends_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE comm_logs_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE contact_tracking_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE campaign_contacts_id_seq TO authenticated;

-- Grant select on views
GRANT SELECT ON campaign_performance TO authenticated;
GRANT SELECT ON campaign_effectiveness TO authenticated;
GRANT SELECT ON contact_effectiveness_summary TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION update_updated_at_column TO authenticated;
GRANT EXECUTE ON FUNCTION increment_campaign_sends TO authenticated;
GRANT EXECUTE ON FUNCTION create_campaign TO authenticated;
GRANT EXECUTE ON FUNCTION record_campaign_contact TO authenticated;
GRANT EXECUTE ON FUNCTION update_campaign_stats TO authenticated;
GRANT EXECUTE ON FUNCTION mark_customer_returned TO authenticated;
GRANT EXECUTE ON FUNCTION expire_old_contacts TO authenticated;
