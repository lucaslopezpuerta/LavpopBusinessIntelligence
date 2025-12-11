-- Lavpop Business Intelligence - Supabase Schema
-- Run this SQL in your Supabase SQL Editor to set up the database
-- Version: 3.2 (2025-12-10)
--
-- v3.2: Cleanup deprecated items
--   - Removed risk_level column from customers (now computed client-side)
--   - Removed classify_customer_risk() function
--   - Updated customer_summary view without risk_level
--   - RFM segments: VIP, Frequente, Promissor, Novato, Esfriando, Inativo
--
-- v3.1: RFM Segmentation with Portuguese names
--   - Added r_score, f_score, m_score, recent_monetary_90d columns to customers
--   - New calculate_rfm_segment() function for proper RFM classification
--   - Updated refresh_customer_metrics() to compute RFM scores
--
-- Tables:
-- CORE DATA (NEW in v3.0):
-- - transactions: POS sales data (replaces sales.csv)
-- - customers: Customer master data (replaces customer.csv)
-- - coupon_redemptions: Links coupon usage to campaigns
--
-- CAMPAIGN MANAGEMENT:
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
-- - customer_summary: Customer metrics computed from transactions (NEW in v3.0)

-- ==================== TRANSACTIONS TABLE (NEW v3.0) ====================
-- Stores POS sales data (replaces sales.csv)
-- Each row = one machine cycle or wallet top-up (Recarga)
--
-- Transaction Types:
-- TYPE_1: Machine + Card payment (Valor_Venda > 0, Valor_Pago = 0)
-- TYPE_2: Machine + Wallet payment (Valor_Venda = 0, Meio_de_Pagamento = 'Saldo da carteira')
-- TYPE_3: Recarga / wallet top-up (Maquinas = 'Recarga', Valor_Pago > 0)

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Raw POS fields (exactly as exported from POS)
  data_hora TIMESTAMPTZ NOT NULL,           -- DD/MM/YYYY HH:mm:ss → parsed to timestamp
  valor_venda DECIMAL(10,2) DEFAULT 0,      -- Gross sale value (17,90 → 17.90)
  valor_pago DECIMAL(10,2) DEFAULT 0,       -- Amount paid (0 for card, > 0 for wallet/recarga)
  meio_de_pagamento TEXT,                   -- 'Cartão de débito', 'Pix', 'Saldo da carteira'
  comprovante_cartao TEXT,                  -- Card receipt (may be URL-encoded)
  bandeira_cartao TEXT,                     -- VISA, MASTERCARD, ELO, PIX, n/d
  loja TEXT,                                -- Store name (for future multi-store support)
  nome_cliente TEXT,                        -- Customer name
  doc_cliente TEXT NOT NULL,                -- CPF (will be normalized to 11 digits)
  telefone TEXT,                            -- Phone number (will be normalized)
  maquinas TEXT,                            -- 'Lavadora: 1', 'Secadora: 2', 'Recarga'
  usou_cupom BOOLEAN DEFAULT false,         -- 'Sim' → true, 'Não' → false
  codigo_cupom TEXT,                        -- 'n/d' → NULL, actual code otherwise

  -- Computed fields (calculated during import)
  transaction_type TEXT,                    -- TYPE_1, TYPE_2, TYPE_3
  is_recarga BOOLEAN DEFAULT false,         -- true if Maquinas = 'Recarga'
  wash_count INTEGER DEFAULT 0,             -- Count of Lavadora machines
  dry_count INTEGER DEFAULT 0,              -- Count of Secadora machines
  total_services INTEGER DEFAULT 0,         -- wash_count + dry_count
  net_value DECIMAL(10,2) DEFAULT 0,        -- After cashback deduction
  cashback_amount DECIMAL(10,2) DEFAULT 0,  -- 7.5% cashback (from June 2024)

  -- Deduplication and import tracking
  import_hash TEXT,                         -- Hash of key fields for deduplication
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  source_file TEXT,                         -- Original CSV filename

  -- Constraints
  CONSTRAINT transactions_hash_unique UNIQUE (import_hash)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_data_hora ON transactions(data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_doc_cliente ON transactions(doc_cliente);
CREATE INDEX IF NOT EXISTS idx_transactions_cupom ON transactions(codigo_cupom) WHERE codigo_cupom IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
-- Note: DATE(data_hora) index removed - DATE() on TIMESTAMPTZ is not IMMUTABLE
-- Use idx_transactions_data_hora for date-based queries instead

-- ==================== CUSTOMERS TABLE (NEW v3.0) ====================
-- Customer master data (replaces customer.csv)
-- Updated by triggers when transactions are inserted

CREATE TABLE IF NOT EXISTS customers (
  doc TEXT PRIMARY KEY,                     -- CPF normalized to 11 digits with leading zeros

  -- Raw POS fields
  nome TEXT,
  telefone TEXT,                            -- Will be normalized to +55...
  email TEXT,
  data_cadastro TIMESTAMPTZ,
  saldo_carteira DECIMAL(10,2) DEFAULT 0,   -- Wallet balance from POS

  -- Computed from transactions (updated by trigger or batch job)
  first_visit DATE,                         -- MIN(data_hora) from transactions
  last_visit DATE,                          -- MAX(data_hora) from transactions
  transaction_count INTEGER DEFAULT 0,      -- COUNT of non-recarga transactions
  total_spent DECIMAL(10,2) DEFAULT 0,      -- SUM of net_value
  total_services INTEGER DEFAULT 0,         -- SUM of total_services
  avg_days_between DECIMAL(5,1),            -- Average days between visits
  days_since_last_visit INTEGER,            -- Computed: TODAY - last_visit

  -- RFM classification (computed by refresh_customer_metrics)
  r_score INTEGER,                          -- Recency score (1-5)
  f_score INTEGER,                          -- Frequency score (1-5)
  m_score INTEGER,                          -- Monetary score (1-5)
  recent_monetary_90d DECIMAL(10,2) DEFAULT 0, -- Total spending in last 90 days
  rfm_segment TEXT,                         -- RFM segment: VIP, Frequente, Promissor, Novato, Esfriando, Inativo
  -- NOTE: risk_level removed in v3.2 - Churn risk now computed client-side in customerMetrics.js

  -- Metadata
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'pos_import'          -- pos_import, manual, api
);

-- Indexes for customer queries
CREATE INDEX IF NOT EXISTS idx_customers_rfm_segment ON customers(rfm_segment);
CREATE INDEX IF NOT EXISTS idx_customers_last_visit ON customers(last_visit DESC);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(telefone) WHERE telefone IS NOT NULL;

-- ==================== COUPON REDEMPTIONS TABLE (NEW v3.0) ====================
-- Links coupon usage in transactions to campaigns for attribution

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  codigo_cupom TEXT NOT NULL,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE SET NULL,  -- NULL if coupon not from a campaign
  customer_doc TEXT REFERENCES customers(doc) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ NOT NULL,
  discount_value DECIMAL(10,2),             -- Calculated discount amount
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for coupon analysis
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_cupom ON coupon_redemptions(codigo_cupom);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_campaign ON coupon_redemptions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_date ON coupon_redemptions(redeemed_at DESC);

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
  trigger_type TEXT,                -- days_since_visit, first_purchase, wallet_balance, hours_after_visit
  trigger_value INT,                -- Threshold value
  action_template TEXT,             -- Template ID to use
  action_channel TEXT DEFAULT 'whatsapp',

  -- NEW: Configurable automation controls
  valid_until TIMESTAMPTZ,          -- Stop date (null = runs forever)
  cooldown_days INTEGER DEFAULT 14, -- Days before same customer can be targeted again
  max_total_sends INTEGER,          -- Lifetime send limit (null = unlimited)
  total_sends_count INTEGER DEFAULT 0, -- Current count of sends

  -- NEW: Coupon configuration
  coupon_code TEXT,                 -- Specific coupon code for this rule (e.g., VOLTE20)
  discount_percent INTEGER,         -- Discount percentage (e.g., 20)
  coupon_validity_days INTEGER DEFAULT 7, -- Days until coupon expires in message

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== VIEWS ====================
-- Drop existing views first to allow column changes
-- (CREATE OR REPLACE VIEW cannot rename columns)
DROP VIEW IF EXISTS contact_effectiveness_summary CASCADE;
DROP VIEW IF EXISTS campaign_effectiveness CASCADE;
DROP VIEW IF EXISTS campaign_performance CASCADE;
DROP VIEW IF EXISTS customer_summary CASCADE;

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

-- Customer summary view (aggregated from transactions) - v3.2 (removed risk_level)
CREATE VIEW customer_summary AS
SELECT
  c.doc,
  c.nome,
  c.telefone,
  c.email,
  c.saldo_carteira,
  c.rfm_segment,
  c.r_score,
  c.f_score,
  c.m_score,
  c.recent_monetary_90d,
  -- Transaction stats
  COUNT(t.id) FILTER (WHERE NOT t.is_recarga) as transaction_count,
  COUNT(t.id) FILTER (WHERE t.is_recarga) as recarga_count,
  COALESCE(SUM(t.net_value) FILTER (WHERE NOT t.is_recarga), 0) as total_spent,
  COALESCE(SUM(t.total_services), 0) as total_services,
  COALESCE(SUM(t.wash_count), 0) as total_washes,
  COALESCE(SUM(t.dry_count), 0) as total_drys,
  COALESCE(SUM(t.cashback_amount), 0) as total_cashback,
  -- Date stats
  MIN(t.data_hora)::DATE as first_visit,
  MAX(t.data_hora)::DATE as last_visit,
  (CURRENT_DATE - MAX(t.data_hora)::DATE) as days_since_last_visit,
  -- Coupon usage
  COUNT(t.id) FILTER (WHERE t.usou_cupom) as coupon_uses,
  -- Average ticket
  ROUND(
    COALESCE(SUM(t.net_value) FILTER (WHERE NOT t.is_recarga), 0) /
    NULLIF(COUNT(t.id) FILTER (WHERE NOT t.is_recarga), 0),
    2
  ) as avg_ticket
FROM customers c
LEFT JOIN transactions t ON c.doc = t.doc_cliente
GROUP BY c.doc, c.nome, c.telefone, c.email, c.saldo_carteira, c.rfm_segment, c.r_score, c.f_score, c.m_score, c.recent_monetary_90d;

-- Coupon effectiveness view (for A/B testing analysis) - NEW v3.0
CREATE OR REPLACE VIEW coupon_effectiveness AS
SELECT
  cr.codigo_cupom,
  c.name as campaign_name,
  c.discount_percent,
  c.service_type,
  COUNT(DISTINCT cr.transaction_id) as redemptions,
  COUNT(DISTINCT cr.customer_doc) as unique_customers,
  COALESCE(SUM(t.net_value), 0) as total_revenue,
  ROUND(AVG(t.net_value), 2) as avg_ticket,
  MIN(cr.redeemed_at) as first_redemption,
  MAX(cr.redeemed_at) as last_redemption
FROM coupon_redemptions cr
LEFT JOIN campaigns c ON cr.campaign_id = c.id
LEFT JOIN transactions t ON cr.transaction_id = t.id
GROUP BY cr.codigo_cupom, c.name, c.discount_percent, c.service_type;

-- Daily revenue summary view - NEW v3.0
CREATE OR REPLACE VIEW daily_revenue AS
SELECT
  DATE(data_hora) as date,
  COUNT(*) FILTER (WHERE NOT is_recarga) as transactions,
  COUNT(*) FILTER (WHERE is_recarga) as recargas,
  SUM(total_services) as total_services,
  SUM(wash_count) as washes,
  SUM(dry_count) as drys,
  COALESCE(SUM(net_value) FILTER (WHERE NOT is_recarga), 0) as service_revenue,
  COALESCE(SUM(valor_pago) FILTER (WHERE is_recarga), 0) as recarga_revenue,
  COALESCE(SUM(cashback_amount), 0) as cashback_given,
  COUNT(*) FILTER (WHERE usou_cupom) as coupon_uses
FROM transactions
GROUP BY DATE(data_hora)
ORDER BY date DESC;

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

-- ==================== RFM SEGMENTATION (v3.2) ====================
-- RFM Segments (Portuguese - Marketing Focus):
-- These names are DISTINCT from Churn Risk Levels to avoid confusion.
--
-- Segments:
-- - VIP: Champion (R=5, F≥4, M≥4) - Best customers, top tier
-- - Frequente: Loyal (R≥4, F≥3, M≥3) - Regular visitors
-- - Promissor: Potential (R≥3, F≥2, M≥2) - Growing customers
-- - Novato: New (registered ≤30 days AND ≤2 transactions) - Newcomers
-- - Esfriando: At Risk (R=2, F=2 OR M=2) - Cooling off, needs attention
-- - Inativo: Lost - No recent engagement
--
-- Scoring Thresholds (laundromat-optimized):
-- Recency (days since last visit): 5=≤21d, 4=≤45d, 3=≤90d, 2=≤180d, 1=>180d
-- Frequency (transaction count): 5=≥10, 4=≥6, 3=≥3, 2=2, 1=1
-- Monetary (90-day spending R$): 5=≥250, 4=≥150, 3=≥75, 2=≥36, 1=<36
--
-- Note: Churn Risk Levels (Saudável, Monitorar, Em Risco, Crítico, Perdido, Novo)
-- are computed client-side in customerMetrics.js using personalized patterns.
-- These are DIFFERENT from RFM segments!

-- Function to calculate RFM scores and segment (Portuguese names)
CREATE OR REPLACE FUNCTION calculate_rfm_segment(
  p_recency_days INTEGER,
  p_frequency INTEGER,
  p_monetary_90d DECIMAL,
  p_registration_days INTEGER
)
RETURNS TABLE (
  r_score INTEGER,
  f_score INTEGER,
  m_score INTEGER,
  segment TEXT
) AS $$
DECLARE
  v_r_score INTEGER;
  v_f_score INTEGER;
  v_m_score INTEGER;
  v_segment TEXT;
BEGIN
  -- Recency Score (R): Days since last purchase
  v_r_score := CASE
    WHEN p_recency_days IS NULL THEN 1
    WHEN p_recency_days <= 21 THEN 5
    WHEN p_recency_days <= 45 THEN 4
    WHEN p_recency_days <= 90 THEN 3
    WHEN p_recency_days <= 180 THEN 2
    ELSE 1
  END;

  -- Frequency Score (F): Number of transactions
  v_f_score := CASE
    WHEN p_frequency >= 10 THEN 5
    WHEN p_frequency >= 6 THEN 4
    WHEN p_frequency >= 3 THEN 3
    WHEN p_frequency = 2 THEN 2
    ELSE 1
  END;

  -- Monetary Score (M): Recent 90-day spending (R$)
  v_m_score := CASE
    WHEN p_monetary_90d >= 250 THEN 5
    WHEN p_monetary_90d >= 150 THEN 4
    WHEN p_monetary_90d >= 75 THEN 3
    WHEN p_monetary_90d >= 36 THEN 2
    ELSE 1
  END;

  -- Segment Assignment (Portuguese marketing names - distinct from Churn Risk Levels)
  IF p_registration_days IS NOT NULL AND p_registration_days <= 30 AND p_frequency <= 2 THEN
    v_segment := 'Novato';      -- Newcomer (not "Novo" which is a Churn Risk Level)
  ELSIF v_r_score = 5 AND v_f_score >= 4 AND v_m_score >= 4 THEN
    v_segment := 'VIP';         -- Champion - top tier customers
  ELSIF v_r_score >= 4 AND v_f_score >= 3 AND v_m_score >= 3 THEN
    v_segment := 'Frequente';   -- Loyal - regular visitors
  ELSIF v_r_score >= 3 AND v_f_score >= 2 AND v_m_score >= 2 THEN
    v_segment := 'Promissor';   -- Potential - growing customers
  ELSIF v_r_score = 2 AND (v_f_score = 2 OR v_m_score = 2) THEN
    v_segment := 'Esfriando';   -- Cooling off (not "Em Risco" which is a Churn Risk Level)
  ELSE
    v_segment := 'Inativo';     -- Inactive (not "Perdido" which is a Churn Risk Level)
  END IF;

  RETURN QUERY SELECT v_r_score, v_f_score, v_m_score, v_segment;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update customer metrics from transactions
-- Computes RFM scores and segment (Portuguese names)
CREATE OR REPLACE FUNCTION refresh_customer_metrics(p_customer_doc TEXT DEFAULT NULL)
RETURNS INT AS $$
DECLARE
  v_updated INT := 0;
BEGIN
  UPDATE customers c
  SET
    first_visit = sub.first_visit,
    last_visit = sub.last_visit,
    transaction_count = sub.transaction_count,
    total_spent = sub.total_spent,
    total_services = sub.total_services,
    days_since_last_visit = sub.days_since_last_visit,
    recent_monetary_90d = sub.recent_monetary_90d,
    r_score = rfm.r_score,
    f_score = rfm.f_score,
    m_score = rfm.m_score,
    rfm_segment = rfm.segment,
    updated_at = NOW()
  FROM (
    SELECT
      t.doc_cliente,
      MIN(t.data_hora)::DATE as first_visit,
      MAX(t.data_hora)::DATE as last_visit,
      COUNT(*) FILTER (WHERE NOT t.is_recarga) as transaction_count,
      COALESCE(SUM(t.net_value) FILTER (WHERE NOT t.is_recarga), 0) as total_spent,
      COALESCE(SUM(t.total_services), 0) as total_services,
      CURRENT_DATE - MAX(t.data_hora)::DATE as days_since_last_visit,
      COALESCE(SUM(t.net_value) FILTER (
        WHERE NOT t.is_recarga AND t.data_hora >= CURRENT_DATE - INTERVAL '90 days'
      ), 0) as recent_monetary_90d,
      CURRENT_DATE - c2.data_cadastro::DATE as registration_days
    FROM transactions t
    LEFT JOIN customers c2 ON c2.doc = t.doc_cliente
    WHERE p_customer_doc IS NULL OR t.doc_cliente = p_customer_doc
    GROUP BY t.doc_cliente, c2.data_cadastro
  ) sub
  CROSS JOIN LATERAL calculate_rfm_segment(
    sub.days_since_last_visit,
    sub.transaction_count::INTEGER,
    sub.recent_monetary_90d,
    sub.registration_days
  ) rfm
  WHERE c.doc = sub.doc_cliente;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

-- Function to match coupon code to campaign
-- Returns campaign_id if found, NULL otherwise
CREATE OR REPLACE FUNCTION find_campaign_by_coupon(p_coupon_code TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT id FROM campaigns
    WHERE LOWER(coupon_code) = LOWER(p_coupon_code)
    ORDER BY created_at DESC
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- Function to process coupon redemption from a transaction
-- Creates coupon_redemptions record and links to campaign if found
CREATE OR REPLACE FUNCTION process_coupon_redemption(
  p_transaction_id UUID,
  p_coupon_code TEXT,
  p_customer_doc TEXT,
  p_redeemed_at TIMESTAMPTZ,
  p_discount_value DECIMAL DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_campaign_id TEXT;
  v_redemption_id UUID;
BEGIN
  -- Skip if no coupon
  IF p_coupon_code IS NULL OR LOWER(p_coupon_code) = 'n/d' THEN
    RETURN NULL;
  END IF;

  -- Find matching campaign
  v_campaign_id := find_campaign_by_coupon(p_coupon_code);

  -- Insert redemption record
  INSERT INTO coupon_redemptions (
    transaction_id, codigo_cupom, campaign_id, customer_doc,
    redeemed_at, discount_value
  ) VALUES (
    p_transaction_id, p_coupon_code, v_campaign_id, p_customer_doc,
    p_redeemed_at, p_discount_value
  )
  RETURNING id INTO v_redemption_id;

  RETURN v_redemption_id;
END;
$$ LANGUAGE plpgsql;

-- Function to upsert a customer record
-- Used during import to create or update customer
CREATE OR REPLACE FUNCTION upsert_customer(
  p_doc TEXT,
  p_nome TEXT,
  p_telefone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_data_cadastro TIMESTAMPTZ DEFAULT NULL,
  p_saldo_carteira DECIMAL DEFAULT 0
)
RETURNS TEXT AS $$
BEGIN
  INSERT INTO customers (doc, nome, telefone, email, data_cadastro, saldo_carteira, source)
  VALUES (p_doc, p_nome, p_telefone, p_email, p_data_cadastro, p_saldo_carteira, 'pos_import')
  ON CONFLICT (doc) DO UPDATE SET
    nome = COALESCE(EXCLUDED.nome, customers.nome),
    telefone = COALESCE(EXCLUDED.telefone, customers.telefone),
    email = COALESCE(EXCLUDED.email, customers.email),
    saldo_carteira = EXCLUDED.saldo_carteira,
    updated_at = NOW();

  RETURN p_doc;
END;
$$ LANGUAGE plpgsql;

-- Function to generate import hash for deduplication
-- Hash = MD5(data_hora + doc_cliente + valor_venda + maquinas)
CREATE OR REPLACE FUNCTION generate_transaction_hash(
  p_data_hora TIMESTAMPTZ,
  p_doc_cliente TEXT,
  p_valor_venda DECIMAL,
  p_maquinas TEXT
)
RETURNS TEXT AS $$
BEGIN
  RETURN MD5(
    COALESCE(p_data_hora::TEXT, '') ||
    COALESCE(p_doc_cliente, '') ||
    COALESCE(p_valor_venda::TEXT, '0') ||
    COALESCE(p_maquinas, '')
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

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

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
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

INSERT INTO automation_rules (
  id, name, enabled, trigger_type, trigger_value, action_template, action_channel,
  cooldown_days, coupon_code, discount_percent, coupon_validity_days
)
VALUES
  ('winback_30', 'Win-back 30 dias', false, 'days_since_visit', 30, 'winback_discount', 'whatsapp',
   30, 'VOLTE20', 20, 7),
  ('winback_45', 'Win-back Critico', false, 'days_since_visit', 45, 'winback_critical', 'whatsapp',
   21, 'VOLTE30', 30, 7),
  ('welcome_new', 'Boas-vindas', false, 'first_purchase', 1, 'welcome_new', 'whatsapp',
   365, 'BEM10', 10, 14),
  ('wallet_reminder', 'Lembrete de saldo', false, 'wallet_balance', 20, 'wallet_reminder', 'whatsapp',
   14, NULL, NULL, NULL),
  ('post_visit', 'Pos-Visita', false, 'hours_after_visit', 24, 'post_visit_thanks', 'whatsapp',
   7, NULL, NULL, NULL)
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

-- NEW v3.0: Core data tables
GRANT SELECT, INSERT, UPDATE, DELETE ON transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON coupon_redemptions TO authenticated;

GRANT USAGE, SELECT ON SEQUENCE campaign_sends_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE comm_logs_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE contact_tracking_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE campaign_contacts_id_seq TO authenticated;

-- Grant select on views
GRANT SELECT ON campaign_performance TO authenticated;
GRANT SELECT ON campaign_effectiveness TO authenticated;
GRANT SELECT ON contact_effectiveness_summary TO authenticated;
-- NEW v3.0: Data views
GRANT SELECT ON customer_summary TO authenticated;
GRANT SELECT ON coupon_effectiveness TO authenticated;
GRANT SELECT ON daily_revenue TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION update_updated_at_column TO authenticated;
GRANT EXECUTE ON FUNCTION increment_campaign_sends TO authenticated;
GRANT EXECUTE ON FUNCTION create_campaign TO authenticated;
GRANT EXECUTE ON FUNCTION record_campaign_contact TO authenticated;
GRANT EXECUTE ON FUNCTION update_campaign_stats TO authenticated;
GRANT EXECUTE ON FUNCTION mark_customer_returned TO authenticated;
GRANT EXECUTE ON FUNCTION expire_old_contacts TO authenticated;
-- NEW v3.0: Data functions
GRANT EXECUTE ON FUNCTION refresh_customer_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_rfm_segment TO authenticated;
GRANT EXECUTE ON FUNCTION find_campaign_by_coupon TO authenticated;
GRANT EXECUTE ON FUNCTION process_coupon_redemption TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_customer TO authenticated;
GRANT EXECUTE ON FUNCTION generate_transaction_hash TO authenticated;
