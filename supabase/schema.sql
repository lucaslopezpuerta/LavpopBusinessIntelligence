-- Lavpop Business Intelligence - Supabase Schema
-- Run this SQL in your Supabase SQL Editor to set up the database
-- Version: 3.25 (2025-12-19)
--
-- v3.25: Engagement & Cost Tracking
--   - Added engagement_type and engaged_at columns to contact_tracking
--   - Added message_cost and message_cost_currency columns to contact_tracking
--   - Added twilio_daily_costs table for aggregated cost reporting
--   - Added upsert_twilio_daily_costs() function
--   - Enables tracking: button clicks, positive engagement, messaging costs
--   - See migrations/018_engagement_and_cost_tracking.sql
--
-- v3.24: Instagram Analytics (Meta Graph API v24.0)
--   - Added instagram_daily_metrics table for historical tracking
--   - Added instagram_metrics_with_growth view with day-over-day growth
--   - Added upsert_instagram_daily_metrics() function for idempotent inserts
--   - Added instagram_last_sync column to app_settings
--   - Metrics: followers, reach, views, engagement, likes, comments, shares, saves, replies
--   - See migrations/015_instagram_analytics.sql and 016_instagram_v24_columns.sql
--
-- v3.23: WhatsApp Template Analytics
--   - Added waba_templates table (cache of Meta API templates)
--   - Added waba_template_analytics table (per-template metrics with READ)
--   - Added waba_template_analytics_view for UI display
--   - Added upsert_waba_templates() and upsert_waba_template_analytics() functions
--   - Added waba_template_last_sync column to app_settings
--   - See migrations/014_waba_template_analytics.sql
--
-- v3.22: WABA Analytics Cleanup
--   - Removed waba_conversation_analytics table (Meta API doesn't return data)
--   - Removed upsert_waba_conversations() function
--   - Removed waba_backfill_cursor column from app_settings
--   - Simplified views to message-only (sent, delivered)
--   - See migrations/013_waba_cleanup.sql
--
-- v3.21: WhatsApp Business API Analytics (WABA)
--   - Added waba_message_analytics table for delivery metrics (sent, delivered)
--   - Note: Read metrics not available at account level (only per-template via Meta API)
--   - Added waba_analytics_summary and waba_daily_metrics views
--   - Added upsert_waba_messages() function
--   - Added waba_last_sync column to app_settings
--   - See migrations/012_waba_analytics.sql
--
-- v3.20: App Settings Table
--   - Added app_settings table for centralized configuration
--   - Stores business settings (service price, cashback, fixed costs, maintenance)
--   - Replaces localStorage-based settings from BusinessSettingsModal
--   - Single-row table (id='default') for simplicity
--   - Auto-updates updated_at timestamp on changes
--   - See migrations/011_app_settings.sql
--
-- v3.19: Fix Duplicate Queue Entries
--   - record_automation_contact() now checks for existing queued entries
--   - If a queued entry exists (from manual inclusion), it UPDATES instead of INSERT
--   - Prevents duplicate contact_tracking records for same customer+campaign
--   - Added index idx_contact_tracking_queued_lookup for efficient lookups
--   - See migrations/010_fix_duplicate_queue_entries.sql
--
-- v3.18: Manual Inclusion Priority Queue
--   - Added priority_source column to contact_tracking table
--   - Supports 'manual_inclusion' (user clicked Incluir), 'automation' (scheduler), NULL (legacy)
--   - Scheduler processes queued entries every 5 minutes
--   - Enforces eligibility checks (7-day global cooldown, 30-day same-type cooldown)
--   - See migrations/009_add_priority_source.sql
--
-- v3.17: Delivery Metrics in campaign_performance View
--   - campaign_performance view now includes delivery metrics directly
--   - Added: delivered, read, failed, sent_pending columns (computed from contact_tracking.delivery_status)
--   - Added: delivery_rate, read_rate, has_delivery_data computed fields
--   - Removed: c.delivered from campaigns table (legacy/unused)
--   - Dashboard no longer needs separate campaign_delivery_metrics query
--   - Single source of truth for both return AND delivery metrics
--   - See migrations/008_add_delivery_to_campaign_performance.sql
--
-- v3.16: Risk Level Capture at Time of Contact
--   - record_automation_contact() now captures risk_level from customers table
--   - record_campaign_contact_unified() now captures risk_level from customers table
--   - Backfill migration 007 populates risk_level for existing records
--   - Phone backfill from customers table for records without campaign_contacts
--   - Analytics can now answer: "What was the customer's risk when we contacted them?"
--
-- v3.15: Unified contact_tracking with delivery fields
--   - Added phone, twilio_sid, delivery_status, delivery_error_* to contact_tracking
--   - contact_tracking is now single source of truth for both return AND delivery tracking
--   - campaign_contacts table deprecated (kept for backward compatibility)
--   - Updated record_automation_contact() to populate delivery fields
--   - Added record_campaign_contact_unified() for manual campaigns
--   - Simplified campaign_delivery_metrics view (no more UNION)
--   - See migrations/006_merge_campaign_contacts_into_contact_tracking.sql
--
-- v3.14: Auto-refresh Triggers + Smart Customer Upsert
--   - Added auto-refresh triggers on transactions table (see migrations/002_auto_refresh_triggers.sql)
--   - Triggers automatically update customer metrics when transactions are inserted
--   - Added upsert_customer_profile() and upsert_customer_profiles_batch() for smart CSV imports
--   - Smart upsert uses GREATEST for dates/counts to prevent data regression
--   - Eliminates need for manual "Sincronizar Metricas" clicks after transaction imports
--
-- v3.13: Schema Cleanup (audit-driven)
--   - REMOVED: campaigns.recipient_snapshot (never populated)
--   - REMOVED: campaigns.created_by (no user auth system)
--   - REMOVED: campaigns.error_message (errors tracked in campaign_contacts)
--   - REMOVED: campaigns.scheduled_for (uses scheduled_campaigns table instead)
--   - REMOVED: campaigns.opened (never updated, no webhook tracking)
--   - REMOVED: campaigns.converted (never updated, no conversion tracking)
--   - REMOVED: comm_logs.expires_at (expiration in contact_tracking instead)
--   - ADDED: Unique index on campaign_contacts.twilio_sid for webhook lookups
--   - See supabase/migrations/001_schema_cleanup.sql for migration
--
-- v3.12: Unified Contact Eligibility System
--   - Added campaign_type column to contact_tracking for type-based cooldowns
--   - Created is_customer_contactable() function - single source of truth for eligibility
--   - Created check_customers_eligibility() function for batch checking
--   - Updated record_automation_contact() to include campaign_type
--   - Enforces: 7-day global cooldown, 30-day same-type cooldown, 90-day opt-out
--
-- v3.11: Fix return detection for same-day returns
--   - Changed > to >= to detect same-day returns
--   - Revenue now sums ALL transactions within 7 days after contact
--   - Added GREATEST(0, ...) to prevent negative days_to_return
--
-- v3.10: Added eligibility indexes for contact_tracking
--
-- v3.9: Enhanced Webhook Campaign Linking
--   - Added campaign_id column to webhook_events for direct campaign linking
--   - Updated campaign_delivery_metrics view with UNION to include both linking methods
--   - Webhook now looks up campaign_id from campaign_contacts or automation_sends
--   - Better delivery metrics accuracy for automations
--
-- v3.8: Webhook Events for Delivery Tracking
--   - Added webhook_events table to store Twilio delivery status updates
--   - Added campaign_delivery_metrics view for real delivery rate calculations
--   - Enables tracking: sent → delivered → read → failed/undelivered
--   - Links to campaign_contacts via message_sid (twilio_sid)
--
-- v3.7: Enhanced Automation Controls
--   - Send time window (send_window_start, send_window_end)
--   - Day of week restrictions (send_days array)
--   - Daily rate limit (max_daily_sends)
--   - Exclude recent visitors (exclude_recent_days)
--   - Minimum spend threshold (min_total_spent)
--   - Wallet balance max (wallet_balance_max)
--
-- v3.6: Unified Risk Level Computation (Option A)
--   - Added risk_level and return_likelihood columns to customers table
--   - Added calculate_customer_risk() function matching frontend algorithm exactly
--   - Updated refresh_customer_metrics() to compute risk_level
--   - Automations now use risk_level column for consistent audience targeting
--   - Algorithm: Exponential decay with RFM segment bonus
--
-- v3.5: Unified Automation-Campaign Model
--   - Added campaign_id column to automation_rules (links to campaigns table)
--   - Added sync_automation_campaign() function to create campaign records for automations
--   - Added record_automation_contact() function for unified tracking
--   - Automations now appear in campaign_performance and campaign_effectiveness views
--   - Trigger auto-syncs campaign when automation rule changes
--
-- v3.4: Fixed avg_days_between computation
--   - Added avg_days_between calculation to refresh_customer_metrics()
--   - Formula: (last_visit - first_visit) / (distinct_visit_days - 1)
--   - Uses distinct visit days (not transaction count) for laundromat accuracy
--
-- v3.3: Added automation_sends table
--   - Tracks individual automation sends for history and cooldown enforcement
--   - Indexes for rule_id, customer_id, sent_at, and cooldown queries
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
-- WHATSAPP BUSINESS ANALYTICS (v3.23):
-- - waba_message_analytics: Account-level delivery metrics (sent, delivered)
-- - waba_templates: Cache of Meta API message templates
-- - waba_template_analytics: Per-template metrics with READ data
--
-- Views:
-- - campaign_performance: Campaign metrics with return rates AND delivery metrics (v3.17)
-- - campaign_effectiveness: Aggregated by campaign for effectiveness metrics
-- - contact_effectiveness_summary: Overall contact tracking summary
-- - campaign_delivery_metrics: Per-campaign delivery stats (legacy, use campaign_performance instead)
-- - waba_analytics_summary: WABA message totals (v3.22)
-- - waba_daily_metrics: WABA daily message metrics (v3.22)
-- - waba_template_analytics_view: Per-template metrics with names (v3.23)
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

  -- v3.6: Churn Risk (computed by refresh_customer_metrics, matching frontend algorithm)
  -- Risk levels: Healthy, Monitor, At Risk, Churning, New Customer, Lost
  -- Uses exponential decay formula with RFM segment bonus
  risk_level TEXT,                          -- Churn risk level (matches customerMetrics.js)
  return_likelihood INTEGER,                -- 0-100% likelihood of return

  -- Metadata
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'pos_import'          -- pos_import, manual, api
);

-- v3.6: Add risk_level columns for migration
ALTER TABLE customers ADD COLUMN IF NOT EXISTS risk_level TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS return_likelihood INTEGER;

-- Indexes for customer queries
CREATE INDEX IF NOT EXISTS idx_customers_rfm_segment ON customers(rfm_segment);
CREATE INDEX IF NOT EXISTS idx_customers_last_visit ON customers(last_visit DESC);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(telefone) WHERE telefone IS NOT NULL;
-- v3.6: Index for automation targeting by risk level
CREATE INDEX IF NOT EXISTS idx_customers_risk_level ON customers(risk_level);

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
-- v3.13: Removed unused columns (recipient_snapshot, created_by, error_message,
--        scheduled_for, opened, converted) - see migrations/001_schema_cleanup.sql

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,              -- Format: CAMP_1234567890
  name TEXT NOT NULL,
  template_id TEXT,                 -- References MESSAGE_TEMPLATES
  audience TEXT,                    -- atRisk, newCustomers, healthy, withWallet, all
  audience_count INT DEFAULT 0,
  status TEXT DEFAULT 'draft',      -- draft, active, paused, completed, scheduled
  sends INT DEFAULT 0,              -- Total successful sends
  delivered INT DEFAULT 0,          -- Confirmed deliveries (used in campaign_performance view)
  -- Enhanced fields for full campaign management
  message_body TEXT,                -- The actual WhatsApp message to send
  contact_method TEXT DEFAULT 'whatsapp',  -- whatsapp, sms, email
  target_segments JSONB,            -- {"segments": ["atRisk"], "walletMin": 10}
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
-- v3.15: Now unified table for BOTH return tracking AND delivery tracking
-- Previously delivery data was in campaign_contacts (now deprecated)

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
  campaign_type TEXT,                     -- v3.12: Campaign type for type-based cooldowns (winback, welcome, promo, wallet, upsell, post_visit)

  -- v3.15: Delivery tracking (moved from campaign_contacts)
  phone TEXT,                             -- Recipient phone number (normalized)
  twilio_sid TEXT,                        -- Twilio message SID for webhook linking
  delivery_status TEXT DEFAULT 'pending', -- pending, sent, delivered, read, failed, undelivered
  delivery_error_code INT,                -- Twilio error code if failed
  delivery_error_message TEXT,            -- Error details if failed

  -- Outcome tracking (return attribution)
  status TEXT DEFAULT 'pending',          -- pending, returned, expired, cleared
  returned_at TIMESTAMPTZ,                -- When customer came back
  days_to_return INT,                     -- Calculated: returned_at - contacted_at
  return_revenue DECIMAL(10,2),           -- Revenue from return visit(s)

  -- Expiration (7 days from contact)
  expires_at TIMESTAMPTZ,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- v3.18: Priority queue for manual inclusions
  priority_source TEXT,                   -- 'manual_inclusion' (user clicked Incluir), 'automation' (scheduler), NULL (legacy)

  -- v3.25: Engagement tracking
  engagement_type TEXT,                   -- button_positive, button_optout, other
  engaged_at TIMESTAMPTZ,                 -- When customer responded

  -- v3.25: Cost tracking per message
  message_cost DECIMAL(10,6),             -- Cost in currency (from Twilio price field)
  message_cost_currency TEXT              -- Currency code (usually USD)
);

CREATE INDEX IF NOT EXISTS idx_contact_tracking_customer ON contact_tracking(customer_id);
CREATE INDEX IF NOT EXISTS idx_contact_tracking_status ON contact_tracking(status);
CREATE INDEX IF NOT EXISTS idx_contact_tracking_campaign ON contact_tracking(campaign_id);
CREATE INDEX IF NOT EXISTS idx_contact_tracking_contacted_at ON contact_tracking(contacted_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_tracking_expires ON contact_tracking(expires_at) WHERE status = 'pending';

-- v3.12: Indexes for eligibility queries
CREATE INDEX IF NOT EXISTS idx_contact_tracking_eligibility
ON contact_tracking (customer_id, status, contacted_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_tracking_type
ON contact_tracking (customer_id, campaign_type, contacted_at DESC);

-- v3.12: Add campaign_type column for migration
ALTER TABLE contact_tracking ADD COLUMN IF NOT EXISTS campaign_type TEXT;

-- v3.15: Add delivery tracking columns (moved from campaign_contacts)
ALTER TABLE contact_tracking ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE contact_tracking ADD COLUMN IF NOT EXISTS twilio_sid TEXT;
ALTER TABLE contact_tracking ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending';
ALTER TABLE contact_tracking ADD COLUMN IF NOT EXISTS delivery_error_code INT;
ALTER TABLE contact_tracking ADD COLUMN IF NOT EXISTS delivery_error_message TEXT;

-- v3.15: Index for webhook lookups by twilio_sid (CRITICAL for performance)
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_tracking_twilio_sid
ON contact_tracking(twilio_sid) WHERE twilio_sid IS NOT NULL;

-- v3.15: Index for delivery status queries
CREATE INDEX IF NOT EXISTS idx_contact_tracking_delivery_status
ON contact_tracking(delivery_status);

-- v3.15: Composite index for campaign delivery metrics
CREATE INDEX IF NOT EXISTS idx_contact_tracking_campaign_delivery
ON contact_tracking(campaign_id, delivery_status) WHERE campaign_id IS NOT NULL;

-- v3.18: Add priority_source column for manual inclusion queue
ALTER TABLE contact_tracking ADD COLUMN IF NOT EXISTS priority_source TEXT;

-- v3.18: Index for efficient priority queue queries
CREATE INDEX IF NOT EXISTS idx_contact_tracking_priority_queue
ON contact_tracking(priority_source, status)
WHERE priority_source = 'manual_inclusion' AND status = 'queued';

-- ==================== CAMPAIGN CONTACTS TABLE (DEPRECATED) ====================
-- DEPRECATED in v3.15: Use contact_tracking instead for unified tracking
-- This table is kept for backward compatibility but will be removed in future versions
-- Previously: Links campaigns to contact_tracking for effectiveness measurement

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
-- v3.13: Unique index for webhook lookups by Twilio message SID
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_contacts_twilio_sid
ON campaign_contacts(twilio_sid) WHERE twilio_sid IS NOT NULL;

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
-- v3.13: Removed expires_at (expiration logic in contact_tracking table)

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
  notes TEXT                        -- Communication notes/description
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

  -- Configurable automation controls
  valid_until TIMESTAMPTZ,          -- Stop date (null = runs forever)
  cooldown_days INTEGER DEFAULT 14, -- Days before same customer can be targeted again
  max_total_sends INTEGER,          -- Lifetime send limit (null = unlimited)
  total_sends_count INTEGER DEFAULT 0, -- Current count of sends

  -- Coupon configuration
  coupon_code TEXT,                 -- Specific coupon code for this rule (e.g., VOLTE20)
  discount_percent INTEGER,         -- Discount percentage (e.g., 20)
  coupon_validity_days INTEGER DEFAULT 7, -- Days until coupon expires in message

  -- v3.7: Enhanced automation controls
  -- Send time window (Brazil timezone - checked by scheduler)
  send_window_start TIME DEFAULT '09:00',  -- Start time (e.g., 09:00)
  send_window_end TIME DEFAULT '20:00',    -- End time (e.g., 20:00)

  -- Day of week restrictions (1=Mon, 2=Tue, ..., 7=Sun)
  -- Default: weekdays only (Mon-Fri)
  send_days INTEGER[] DEFAULT '{1,2,3,4,5}',

  -- Daily rate limit (null = unlimited, uses max_per_execution in scheduler)
  max_daily_sends INTEGER,
  daily_sends_count INTEGER DEFAULT 0,     -- Reset daily by scheduler
  last_daily_reset DATE,                   -- Track when count was last reset

  -- Exclude recent visitors (days since last visit to exclude)
  -- null = don't exclude (for welcome, wallet_reminder, post_visit)
  exclude_recent_days INTEGER,

  -- Minimum spend threshold (only target customers who spent >= this amount)
  min_total_spent DECIMAL(10,2),

  -- Wallet balance range (for wallet_reminder - max balance to target)
  wallet_balance_max DECIMAL(10,2),

  -- v3.5: Unified Campaign Model - Links automation to its campaign record
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for campaign_id lookups
CREATE INDEX IF NOT EXISTS idx_automation_rules_campaign_id ON automation_rules(campaign_id);

-- v3.7: Add new automation control columns for migration
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS send_window_start TIME DEFAULT '09:00';
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS send_window_end TIME DEFAULT '20:00';
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS send_days INTEGER[] DEFAULT '{1,2,3,4,5}';
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS max_daily_sends INTEGER;
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS daily_sends_count INTEGER DEFAULT 0;
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS last_daily_reset DATE;
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS exclude_recent_days INTEGER;
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS min_total_spent DECIMAL(10,2);
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS wallet_balance_max DECIMAL(10,2);

-- ==================== AUTOMATION SENDS TABLE ====================
-- Tracks individual automation sends for history and cooldown enforcement

CREATE TABLE IF NOT EXISTS automation_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id TEXT NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL,              -- Customer doc (CPF)
  customer_name TEXT,                     -- For display
  phone TEXT NOT NULL,                    -- Phone number sent to
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent',             -- sent, delivered, read, failed
  message_sid TEXT,                       -- Twilio message SID
  error_code INT,                         -- Twilio error code if failed
  error_message TEXT,                     -- Error details
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for automation_sends
CREATE INDEX IF NOT EXISTS idx_automation_sends_rule_id ON automation_sends(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_sends_customer_id ON automation_sends(customer_id);
CREATE INDEX IF NOT EXISTS idx_automation_sends_sent_at ON automation_sends(sent_at DESC);
-- Index for cooldown check: find recent sends per customer per rule
CREATE INDEX IF NOT EXISTS idx_automation_sends_cooldown ON automation_sends(rule_id, customer_id, sent_at DESC);

-- ==================== WEBHOOK EVENTS TABLE (v3.8) ====================
-- Stores Twilio webhook events for delivery tracking and engagement metrics
-- Enables real delivery rate calculation instead of estimates

CREATE TABLE IF NOT EXISTS webhook_events (
  id SERIAL PRIMARY KEY,
  message_sid TEXT NOT NULL,           -- Twilio Message SID (unique per message)
  phone TEXT,                          -- Phone number (normalized, digits only)
  event_type TEXT NOT NULL,            -- 'delivery_status', 'button_click', etc.
  payload TEXT,                        -- For delivery_status: sent/delivered/read/failed/undelivered
  error_code TEXT,                     -- Twilio error code if failed (e.g., 63024)
  campaign_id TEXT,                    -- v3.9: Direct campaign linking (fallback for non-campaign_contacts messages)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for looking up by message_sid (for upserts)
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_message_sid
ON webhook_events (message_sid);

-- Index for querying by phone
CREATE INDEX IF NOT EXISTS idx_webhook_events_phone
ON webhook_events (phone);

-- Index for querying by event_type and status
CREATE INDEX IF NOT EXISTS idx_webhook_events_type_payload
ON webhook_events (event_type, payload);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at
ON webhook_events (created_at DESC);

-- v3.9: Index for querying by campaign_id (direct campaign linking)
CREATE INDEX IF NOT EXISTS idx_webhook_events_campaign_id
ON webhook_events (campaign_id);

-- v3.9: Add campaign_id column for migration
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS campaign_id TEXT;

COMMENT ON TABLE webhook_events IS 'Stores Twilio webhook events for delivery tracking and engagement metrics';
COMMENT ON COLUMN webhook_events.message_sid IS 'Twilio Message SID - unique identifier for each message';
COMMENT ON COLUMN webhook_events.phone IS 'Recipient phone number (normalized, digits only)';
COMMENT ON COLUMN webhook_events.event_type IS 'Event type: delivery_status, button_click, etc.';
COMMENT ON COLUMN webhook_events.payload IS 'For delivery_status: sent/delivered/read/failed/undelivered. For button_click: the payload.';
COMMENT ON COLUMN webhook_events.error_code IS 'Twilio error code for failed messages (e.g., 63024)';
COMMENT ON COLUMN webhook_events.campaign_id IS 'Campaign ID for direct linking (alternative to joining via campaign_contacts)';

-- ==================== TWILIO DAILY COSTS TABLE (v3.25) ====================
-- Aggregated daily costs for budget tracking

CREATE TABLE IF NOT EXISTS twilio_daily_costs (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,                    -- The day
  outbound_count INT DEFAULT 0,          -- Number of outbound messages
  outbound_cost DECIMAL(10,4) DEFAULT 0, -- Total outbound cost
  inbound_count INT DEFAULT 0,           -- Number of inbound messages
  inbound_cost DECIMAL(10,4) DEFAULT 0,  -- Total inbound cost (usually $0)
  currency TEXT DEFAULT 'USD',           -- Currency (from Twilio)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT twilio_daily_costs_date_key UNIQUE (date)
);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_twilio_daily_costs_date
ON twilio_daily_costs (date DESC);

-- Function to upsert daily costs (called after fetching Twilio data)
CREATE OR REPLACE FUNCTION upsert_twilio_daily_costs(
  p_date DATE,
  p_outbound_count INT DEFAULT 0,
  p_outbound_cost DECIMAL DEFAULT 0,
  p_inbound_count INT DEFAULT 0,
  p_inbound_cost DECIMAL DEFAULT 0,
  p_currency TEXT DEFAULT 'USD'
)
RETURNS twilio_daily_costs AS $$
DECLARE
  result twilio_daily_costs;
BEGIN
  INSERT INTO twilio_daily_costs (date, outbound_count, outbound_cost, inbound_count, inbound_cost, currency)
  VALUES (p_date, p_outbound_count, p_outbound_cost, p_inbound_count, p_inbound_cost, p_currency)
  ON CONFLICT (date) DO UPDATE SET
    outbound_count = twilio_daily_costs.outbound_count + EXCLUDED.outbound_count,
    outbound_cost = twilio_daily_costs.outbound_cost + EXCLUDED.outbound_cost,
    inbound_count = twilio_daily_costs.inbound_count + EXCLUDED.inbound_count,
    inbound_cost = twilio_daily_costs.inbound_cost + EXCLUDED.inbound_cost,
    updated_at = NOW()
  RETURNING * INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE twilio_daily_costs IS 'Aggregated daily messaging costs from Twilio for budget tracking';

-- ==================== APP SETTINGS TABLE (v3.20) ====================
-- Centralized app configuration settings
-- Replaces localStorage-based settings from BusinessSettingsModal

CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',

  -- Business Settings (Pricing)
  service_price DECIMAL(10,2) DEFAULT 17.90,
  cashback_percent DECIMAL(5,2) DEFAULT 7.5,
  cashback_start_date DATE DEFAULT '2024-06-01',

  -- Fixed Costs (Monthly)
  rent_cost DECIMAL(10,2) DEFAULT 2000,
  electricity_cost DECIMAL(10,2) DEFAULT 500,
  water_cost DECIMAL(10,2) DEFAULT 200,
  internet_cost DECIMAL(10,2) DEFAULT 100,
  other_fixed_costs DECIMAL(10,2) DEFAULT 200,

  -- Maintenance
  maintenance_interval_days INTEGER DEFAULT 45,
  maintenance_downtime_hours INTEGER DEFAULT 6,
  maintenance_cost_per_session DECIMAL(10,2) DEFAULT 300,

  -- v3.21: WABA Analytics Sync Tracking
  waba_last_sync TIMESTAMPTZ,             -- Last successful WABA analytics sync from Meta API
  waba_template_last_sync TIMESTAMPTZ,    -- Last successful template analytics sync (v3.23)

  -- v3.24: Instagram Analytics Sync Tracking
  instagram_last_sync TIMESTAMPTZ,        -- Last successful Instagram analytics sync from Meta API

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- v3.21: Add WABA sync tracking column (for migration)
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS waba_last_sync TIMESTAMPTZ;
-- v3.23: Add template sync tracking column
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS waba_template_last_sync TIMESTAMPTZ;
-- v3.24: Add Instagram sync tracking column
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS instagram_last_sync TIMESTAMPTZ;

-- Initialize with defaults if table is empty
INSERT INTO app_settings (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

-- Trigger to update updated_at on changes
CREATE OR REPLACE FUNCTION update_app_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS app_settings_updated_at ON app_settings;
CREATE TRIGGER app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_app_settings_timestamp();

COMMENT ON TABLE app_settings IS 'App-wide settings including business parameters, costs, and maintenance configuration. Single-row table (id=default).';

-- ==================== WABA MESSAGE ANALYTICS TABLE (v3.21) ====================
-- WhatsApp Business message delivery analytics from Meta Graph API
-- Tracks sent, delivered, and read counts per day

CREATE TABLE IF NOT EXISTS waba_message_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Identifiers
  waba_id TEXT NOT NULL,
  phone_number_id TEXT DEFAULT '',  -- Campaign phone number (empty string for account-level)

  -- Time bucket
  bucket_date DATE NOT NULL,

  -- Metrics
  sent INTEGER NOT NULL DEFAULT 0,
  delivered INTEGER NOT NULL DEFAULT 0,
  read_count INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique index to prevent duplicates on re-sync
CREATE UNIQUE INDEX IF NOT EXISTS idx_waba_msg_unique
ON waba_message_analytics(waba_id, bucket_date, phone_number_id);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_waba_msg_date ON waba_message_analytics(bucket_date);

COMMENT ON TABLE waba_message_analytics IS 'WhatsApp Business message delivery analytics from Meta Graph API. Tracks sent and delivered counts. Note: read_count is always 0 (not available at account level).';

-- ==================== WABA TEMPLATES CACHE TABLE (v3.23) ====================

CREATE TABLE IF NOT EXISTS waba_templates (
  id TEXT PRIMARY KEY,                    -- Meta template UUID
  waba_id TEXT NOT NULL,
  name TEXT NOT NULL,                     -- e.g., 'lavpop_winback_desconto'
  status TEXT DEFAULT 'APPROVED',         -- APPROVED, PENDING, REJECTED
  category TEXT,                          -- MARKETING, UTILITY
  language TEXT DEFAULT 'pt_BR',
  local_template_id TEXT,                 -- Maps to messageTemplates.js
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waba_templates_waba ON waba_templates(waba_id);
CREATE INDEX IF NOT EXISTS idx_waba_templates_name ON waba_templates(name);
CREATE INDEX IF NOT EXISTS idx_waba_templates_local ON waba_templates(local_template_id) WHERE local_template_id IS NOT NULL;

COMMENT ON TABLE waba_templates IS 'Cached WhatsApp message templates from Meta API.';

-- ==================== WABA TEMPLATE ANALYTICS TABLE (v3.23) ====================

CREATE TABLE IF NOT EXISTS waba_template_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id TEXT NOT NULL REFERENCES waba_templates(id) ON DELETE CASCADE,
  waba_id TEXT NOT NULL,
  bucket_date DATE NOT NULL,
  sent INTEGER NOT NULL DEFAULT 0,
  delivered INTEGER NOT NULL DEFAULT 0,
  read_count INTEGER NOT NULL DEFAULT 0,  -- Available at template level!
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_waba_template_analytics_unique
ON waba_template_analytics(template_id, bucket_date);

CREATE INDEX IF NOT EXISTS idx_waba_template_analytics_date
ON waba_template_analytics(bucket_date);

COMMENT ON TABLE waba_template_analytics IS 'Per-template WhatsApp analytics with READ metrics.';

-- ==================== INSTAGRAM DAILY METRICS TABLE (v3.24) ====================
-- Stores daily Instagram account metrics from Meta Graph API
-- Synced every 4 hours via campaign-scheduler.js

CREATE TABLE IF NOT EXISTS instagram_daily_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id TEXT NOT NULL,                    -- Meta Instagram Account ID
  bucket_date DATE NOT NULL,

  -- Profile metrics
  followers INTEGER NOT NULL DEFAULT 0,
  following INTEGER NOT NULL DEFAULT 0,
  posts INTEGER NOT NULL DEFAULT 0,

  -- Core insights metrics (daily values)
  reach INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,                  -- v24.0: replaces impressions
  profile_views INTEGER NOT NULL DEFAULT 0,
  website_clicks INTEGER NOT NULL DEFAULT 0,
  accounts_engaged INTEGER NOT NULL DEFAULT 0,
  total_interactions INTEGER NOT NULL DEFAULT 0,

  -- Engagement breakdown
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  replies INTEGER NOT NULL DEFAULT 0,                -- v24.0: story replies

  -- Growth & actions
  follows_and_unfollows INTEGER NOT NULL DEFAULT 0,  -- Net follower change
  profile_links_taps INTEGER NOT NULL DEFAULT 0,     -- External link taps

  -- Computed metrics
  engagement_rate DECIMAL(5,2) DEFAULT 0,      -- (interactions / followers) * 100

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint prevents duplicates on re-sync
CREATE UNIQUE INDEX IF NOT EXISTS idx_instagram_metrics_unique
ON instagram_daily_metrics(account_id, bucket_date);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_instagram_metrics_date
ON instagram_daily_metrics(bucket_date);

COMMENT ON TABLE instagram_daily_metrics IS 'Daily Instagram account metrics from Meta Graph API. Enables historical trend analysis.';

-- ==================== VIEWS ====================
-- Drop existing views first to allow column changes
-- (CREATE OR REPLACE VIEW cannot rename columns)
DROP VIEW IF EXISTS contact_effectiveness_summary CASCADE;
DROP VIEW IF EXISTS campaign_effectiveness CASCADE;
DROP VIEW IF EXISTS campaign_performance CASCADE;
DROP VIEW IF EXISTS customer_summary CASCADE;

-- Campaign performance view with effectiveness metrics
-- v3.17: Now includes delivery metrics directly (no separate campaign_delivery_metrics query needed)
-- Columns organized by: Identity → Timestamps → Config → Volume → Delivery → Returns
CREATE OR REPLACE VIEW campaign_performance AS
SELECT
  -- ===== IDENTITY =====
  c.id,
  c.name,
  c.status,

  -- ===== TIMESTAMPS =====
  c.created_at,
  c.last_sent_at,

  -- ===== CAMPAIGN CONFIG =====
  c.audience,
  c.contact_method,
  c.discount_percent,
  c.coupon_code,
  c.service_type,

  -- ===== SEND VOLUME =====
  c.sends,
  COUNT(DISTINCT ct.id) as contacts_tracked,

  -- ===== DELIVERY METRICS (message delivery from Twilio webhooks) =====
  COUNT(DISTINCT CASE WHEN ct.delivery_status = 'delivered' THEN ct.id END) as delivered,
  COUNT(DISTINCT CASE WHEN ct.delivery_status = 'read' THEN ct.id END) as read,
  COUNT(DISTINCT CASE WHEN ct.delivery_status IN ('failed', 'undelivered') THEN ct.id END) as failed,
  COUNT(DISTINCT CASE WHEN ct.delivery_status = 'sent' THEN ct.id END) as sent_pending,
  ROUND(
    CASE
      WHEN COUNT(DISTINCT ct.id) > 0
      THEN (COUNT(DISTINCT CASE WHEN ct.delivery_status IN ('delivered', 'read') THEN ct.id END)::DECIMAL / COUNT(DISTINCT ct.id)) * 100
      ELSE 0
    END, 1
  ) as delivery_rate,
  ROUND(
    CASE
      WHEN COUNT(DISTINCT CASE WHEN ct.delivery_status IN ('delivered', 'read') THEN ct.id END) > 0
      THEN (COUNT(DISTINCT CASE WHEN ct.delivery_status = 'read' THEN ct.id END)::DECIMAL /
            COUNT(DISTINCT CASE WHEN ct.delivery_status IN ('delivered', 'read') THEN ct.id END)) * 100
      ELSE 0
    END, 1
  ) as read_rate,
  CASE
    WHEN COUNT(DISTINCT CASE WHEN ct.delivery_status IS NOT NULL AND ct.delivery_status != 'pending' THEN ct.id END) > 0
    THEN TRUE
    ELSE FALSE
  END as has_delivery_data,

  -- ===== RETURN METRICS (customer return tracking) =====
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
LEFT JOIN contact_tracking ct ON c.id = ct.campaign_id
GROUP BY c.id, c.name, c.status, c.created_at, c.last_sent_at, c.audience, c.contact_method, c.discount_percent, c.coupon_code, c.service_type, c.sends;

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

-- Campaign delivery metrics view (v3.15) - Real delivery rates from contact_tracking
-- v3.15: Simplified to query contact_tracking directly (has delivery_status now)
-- No more UNION needed - all delivery data is in contact_tracking
CREATE OR REPLACE VIEW campaign_delivery_metrics AS
SELECT
  ct.campaign_id,
  c.name as campaign_name,
  COUNT(DISTINCT ct.id) as total_sent,
  COUNT(DISTINCT CASE WHEN ct.delivery_status = 'delivered' THEN ct.id END) as delivered,
  COUNT(DISTINCT CASE WHEN ct.delivery_status = 'read' THEN ct.id END) as read,
  COUNT(DISTINCT CASE WHEN ct.delivery_status IN ('failed', 'undelivered') THEN ct.id END) as failed,
  ROUND(
    COUNT(DISTINCT CASE WHEN ct.delivery_status = 'delivered' THEN ct.id END)::NUMERIC /
    NULLIF(COUNT(DISTINCT ct.id), 0) * 100,
    1
  ) as delivery_rate,
  ROUND(
    COUNT(DISTINCT CASE WHEN ct.delivery_status = 'read' THEN ct.id END)::NUMERIC /
    NULLIF(COUNT(DISTINCT CASE WHEN ct.delivery_status = 'delivered' THEN ct.id END), 0) * 100,
    1
  ) as read_rate
FROM contact_tracking ct
JOIN campaigns c ON c.id = ct.campaign_id
WHERE ct.campaign_id IS NOT NULL
GROUP BY ct.campaign_id, c.name;

-- ==================== WABA ANALYTICS SUMMARY VIEW (v3.22) ====================
-- Aggregated WABA message analytics summary. Use for KPI cards.

CREATE OR REPLACE VIEW waba_analytics_summary AS
SELECT
  -- Date range
  MIN(bucket_date) AS first_date,
  MAX(bucket_date) AS last_date,

  -- Message metrics
  SUM(sent) AS total_sent,
  SUM(delivered) AS total_delivered,

  -- Delivery rate
  CASE
    WHEN SUM(sent) > 0
    THEN ROUND(SUM(delivered)::DECIMAL / SUM(sent) * 100, 1)
    ELSE 0
  END AS delivery_rate

FROM waba_message_analytics;

COMMENT ON VIEW waba_analytics_summary IS 'Aggregated WABA message analytics summary. Use for KPI cards.';

-- ==================== WABA DAILY METRICS VIEW (v3.22) ====================
-- Daily WABA message metrics for time series charts.

CREATE OR REPLACE VIEW waba_daily_metrics AS
SELECT
  bucket_date,

  -- Message metrics (aggregated by date in case of multiple phone numbers)
  SUM(sent) AS sent,
  SUM(delivered) AS delivered,

  -- Daily delivery rate
  CASE
    WHEN SUM(sent) > 0
    THEN ROUND(SUM(delivered)::DECIMAL / SUM(sent) * 100, 1)
    ELSE 0
  END AS delivery_rate

FROM waba_message_analytics
GROUP BY bucket_date
ORDER BY bucket_date DESC;

COMMENT ON VIEW waba_daily_metrics IS 'Daily WABA message metrics for time series charts.';

-- ==================== WABA TEMPLATE ANALYTICS VIEW (v3.23) ====================

CREATE OR REPLACE VIEW waba_template_analytics_view AS
SELECT
  ta.id,
  ta.template_id,
  t.name AS template_name,
  t.local_template_id,
  t.category,
  t.status,
  ta.waba_id,
  ta.bucket_date,
  ta.sent,
  ta.delivered,
  ta.read_count,
  CASE WHEN ta.sent > 0
    THEN ROUND(ta.delivered::DECIMAL / ta.sent * 100, 1)
    ELSE 0
  END AS delivery_rate,
  CASE WHEN ta.delivered > 0
    THEN ROUND(ta.read_count::DECIMAL / ta.delivered * 100, 1)
    ELSE 0
  END AS read_rate,
  ta.created_at,
  ta.updated_at
FROM waba_template_analytics ta
JOIN waba_templates t ON ta.template_id = t.id
ORDER BY ta.bucket_date DESC, t.name;

COMMENT ON VIEW waba_template_analytics_view IS 'Template analytics with template names and computed rates.';

-- ==================== INSTAGRAM METRICS WITH GROWTH VIEW (v3.24) ====================

CREATE OR REPLACE VIEW instagram_metrics_with_growth AS
SELECT
  m.*,
  -- Day-over-day follower growth
  LAG(m.followers) OVER (PARTITION BY m.account_id ORDER BY m.bucket_date) AS prev_followers,
  m.followers - COALESCE(LAG(m.followers) OVER (PARTITION BY m.account_id ORDER BY m.bucket_date), m.followers) AS followers_change,
  CASE
    WHEN LAG(m.followers) OVER (PARTITION BY m.account_id ORDER BY m.bucket_date) > 0
    THEN ROUND(
      ((m.followers - LAG(m.followers) OVER (PARTITION BY m.account_id ORDER BY m.bucket_date))::DECIMAL
      / LAG(m.followers) OVER (PARTITION BY m.account_id ORDER BY m.bucket_date)) * 100, 2
    )
    ELSE 0
  END AS followers_growth_pct,
  -- Day-over-day reach growth
  LAG(m.reach) OVER (PARTITION BY m.account_id ORDER BY m.bucket_date) AS prev_reach,
  m.reach - COALESCE(LAG(m.reach) OVER (PARTITION BY m.account_id ORDER BY m.bucket_date), m.reach) AS reach_change,
  -- Day-over-day views growth
  LAG(m.views) OVER (PARTITION BY m.account_id ORDER BY m.bucket_date) AS prev_views,
  m.views - COALESCE(LAG(m.views) OVER (PARTITION BY m.account_id ORDER BY m.bucket_date), m.views) AS views_change,
  -- Day-over-day engagement growth
  LAG(m.total_interactions) OVER (PARTITION BY m.account_id ORDER BY m.bucket_date) AS prev_interactions,
  m.total_interactions - COALESCE(LAG(m.total_interactions) OVER (PARTITION BY m.account_id ORDER BY m.bucket_date), m.total_interactions) AS interactions_change
FROM instagram_daily_metrics m
ORDER BY m.bucket_date DESC;

COMMENT ON VIEW instagram_metrics_with_growth IS 'Instagram metrics with day-over-day growth calculations for followers, reach, views, and engagement.';

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

-- ==================== UNIFIED AUTOMATION-CAMPAIGN MODEL (v3.5) ====================
-- Functions to treat automations as campaigns for unified metrics

-- Function to create or update campaign record for an automation rule
-- Called when: rule is enabled, rule config changes, or on first send
CREATE OR REPLACE FUNCTION sync_automation_campaign(p_rule_id TEXT)
RETURNS TEXT AS $$
DECLARE
  v_rule RECORD;
  v_campaign_id TEXT;
  v_audience TEXT;
BEGIN
  -- Get the rule
  SELECT * INTO v_rule FROM automation_rules WHERE id = p_rule_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Automation rule % not found', p_rule_id;
  END IF;

  -- Determine audience based on trigger type
  v_audience := CASE v_rule.trigger_type
    WHEN 'days_since_visit' THEN 'atRisk'
    WHEN 'first_purchase' THEN 'newCustomers'
    WHEN 'wallet_balance' THEN 'withWallet'
    WHEN 'hours_after_visit' THEN 'all'
    ELSE 'all'
  END;

  -- Check if campaign already exists
  IF v_rule.campaign_id IS NOT NULL THEN
    -- Update existing campaign
    UPDATE campaigns SET
      name = 'Auto: ' || v_rule.name,
      template_id = v_rule.action_template,
      audience = v_audience,
      status = CASE WHEN v_rule.enabled THEN 'active' ELSE 'paused' END,
      discount_percent = v_rule.discount_percent,
      coupon_code = v_rule.coupon_code,
      service_type = 'both',
      contact_method = v_rule.action_channel,
      updated_at = NOW()
    WHERE id = v_rule.campaign_id;

    RETURN v_rule.campaign_id;
  ELSE
    -- Create new campaign for this automation
    v_campaign_id := 'AUTO_' || p_rule_id;

    INSERT INTO campaigns (
      id,
      name,
      template_id,
      audience,
      status,
      contact_method,
      discount_percent,
      coupon_code,
      service_type,
      created_at
    ) VALUES (
      v_campaign_id,
      'Auto: ' || v_rule.name,
      v_rule.action_template,
      v_audience,
      CASE WHEN v_rule.enabled THEN 'active' ELSE 'draft' END,
      COALESCE(v_rule.action_channel, 'whatsapp'),
      v_rule.discount_percent,
      v_rule.coupon_code,
      'both',
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      template_id = EXCLUDED.template_id,
      audience = EXCLUDED.audience,
      status = EXCLUDED.status,
      discount_percent = EXCLUDED.discount_percent,
      coupon_code = EXCLUDED.coupon_code,
      updated_at = NOW();

    -- Link the campaign to the rule
    UPDATE automation_rules SET campaign_id = v_campaign_id WHERE id = p_rule_id;

    RETURN v_campaign_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to sync campaign when automation rule changes
CREATE OR REPLACE FUNCTION trigger_sync_automation_campaign()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync if rule is enabled or was just enabled
  IF NEW.enabled = true OR (OLD IS NOT NULL AND OLD.enabled = true) THEN
    PERFORM sync_automation_campaign(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to record an automation send with full campaign tracking
-- Creates entries in: automation_sends, contact_tracking, campaign_contacts
-- v3.12: Added campaign_type for unified eligibility tracking
-- v3.15: Added phone, twilio_sid, delivery_status to contact_tracking (unified delivery tracking)
-- v3.16: Added risk_level snapshot from customers table at time of contact
-- v3.19: Check for existing queued entries and UPDATE instead of INSERT (prevents duplicates)
CREATE OR REPLACE FUNCTION record_automation_contact(
  p_rule_id TEXT,
  p_customer_id TEXT,
  p_customer_name TEXT,
  p_phone TEXT,
  p_message_sid TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_campaign_id TEXT;
  v_contact_tracking_id INT;
  v_existing_queued_id INT;
  v_automation_send_id UUID;
  v_rule RECORD;
  v_campaign_type TEXT;
  v_risk_level TEXT;
BEGIN
  -- Get the rule and ensure campaign exists
  SELECT * INTO v_rule FROM automation_rules WHERE id = p_rule_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Automation rule % not found', p_rule_id;
  END IF;

  -- Get customer's current risk_level (snapshot at time of contact)
  SELECT risk_level INTO v_risk_level FROM customers WHERE doc = p_customer_id;

  -- Determine campaign_type from action_template
  v_campaign_type := CASE v_rule.action_template
    WHEN 'winback_discount' THEN 'winback'
    WHEN 'winback_critical' THEN 'winback'
    WHEN 'welcome_new' THEN 'welcome'
    WHEN 'wallet_reminder' THEN 'wallet'
    WHEN 'post_visit_thanks' THEN 'post_visit'
    WHEN 'upsell_secagem' THEN 'upsell'
    ELSE 'other'
  END;

  -- Ensure campaign record exists
  IF v_rule.campaign_id IS NULL THEN
    v_campaign_id := sync_automation_campaign(p_rule_id);
  ELSE
    v_campaign_id := v_rule.campaign_id;
  END IF;

  -- v3.19: Check for existing QUEUED entry (from manual inclusion)
  -- If found, UPDATE it instead of creating a duplicate
  SELECT id INTO v_existing_queued_id
  FROM contact_tracking
  WHERE customer_id = p_customer_id
    AND campaign_id = v_campaign_id
    AND status = 'queued'
  LIMIT 1;

  IF v_existing_queued_id IS NOT NULL THEN
    -- UPDATE existing queued entry instead of INSERT
    UPDATE contact_tracking SET
      status = 'pending',
      contacted_at = NOW(),
      expires_at = NOW() + (COALESCE(v_rule.cooldown_days, 14) || ' days')::INTERVAL,
      phone = p_phone,
      twilio_sid = p_message_sid,
      delivery_status = CASE WHEN p_message_sid IS NOT NULL THEN 'sent' ELSE 'pending' END,
      risk_level = v_risk_level,
      campaign_type = v_campaign_type,
      campaign_name = 'Auto: ' || v_rule.name,
      updated_at = NOW(),
      -- Keep priority_source as 'manual_inclusion' to track origin
      priority_source = COALESCE(priority_source, 'automation')
    WHERE id = v_existing_queued_id
    RETURNING id INTO v_contact_tracking_id;

    RAISE NOTICE 'record_automation_contact: Updated existing queued entry % for customer %', v_existing_queued_id, p_customer_id;
  ELSE
    -- 1. Create NEW contact tracking record (no existing queued entry)
    INSERT INTO contact_tracking (
      customer_id,
      customer_name,
      contact_method,
      campaign_id,
      campaign_name,
      campaign_type,
      status,
      expires_at,
      phone,
      twilio_sid,
      delivery_status,
      risk_level,
      priority_source
    ) VALUES (
      p_customer_id,
      p_customer_name,
      'whatsapp',
      v_campaign_id,
      'Auto: ' || v_rule.name,
      v_campaign_type,
      'pending',
      NOW() + (COALESCE(v_rule.cooldown_days, 14) || ' days')::INTERVAL,
      p_phone,
      p_message_sid,
      CASE WHEN p_message_sid IS NOT NULL THEN 'sent' ELSE 'pending' END,
      v_risk_level,
      'automation'  -- Mark as automation-created
    )
    RETURNING id INTO v_contact_tracking_id;
  END IF;

  -- 2. DEPRECATED: campaign_contacts bridge record
  -- Keeping for backward compatibility with existing queries
  -- Will be removed in future migration
  INSERT INTO campaign_contacts (
    campaign_id,
    contact_tracking_id,
    customer_id,
    customer_name,
    phone,
    delivery_status,
    twilio_sid
  ) VALUES (
    v_campaign_id,
    v_contact_tracking_id,
    p_customer_id,
    p_customer_name,
    p_phone,
    'sent',
    p_message_sid
  );

  -- 3. Create automation_sends record (for cooldown tracking)
  INSERT INTO automation_sends (
    rule_id,
    customer_id,
    customer_name,
    phone,
    status,
    message_sid
  ) VALUES (
    p_rule_id,
    p_customer_id,
    p_customer_name,
    p_phone,
    'sent',
    p_message_sid
  )
  RETURNING id INTO v_automation_send_id;

  -- 4. Update campaign send count
  UPDATE campaigns SET
    sends = sends + 1,
    last_sent_at = NOW(),
    status = 'active'
  WHERE id = v_campaign_id;

  RETURN v_automation_send_id;
END;
$$ LANGUAGE plpgsql;

-- v3.19: Index for efficient queued entry lookup (prevents duplicates)
CREATE INDEX IF NOT EXISTS idx_contact_tracking_queued_lookup
ON contact_tracking(customer_id, campaign_id, status)
WHERE status = 'queued';

-- v3.25: Index for engagement analytics
CREATE INDEX IF NOT EXISTS idx_contact_tracking_engagement
ON contact_tracking (engagement_type, engaged_at DESC)
WHERE engagement_type IS NOT NULL;

-- ==================== UNIFIED CONTACT ELIGIBILITY (v3.12) ====================
-- Functions to check if a customer is eligible for campaign contact
-- Used by both manual campaigns (UI) and automations (scheduler)

-- Function to check if a single customer is eligible for contact
-- Enforces cooldown rules to prevent customer fatigue and WhatsApp spam complaints
CREATE OR REPLACE FUNCTION is_customer_contactable(
  p_customer_id TEXT,
  p_campaign_type TEXT DEFAULT NULL,
  p_min_days_global INT DEFAULT 7,
  p_min_days_same_type INT DEFAULT 30
)
RETURNS TABLE (
  is_eligible BOOLEAN,
  reason TEXT,
  last_contact_date TIMESTAMPTZ,
  last_campaign_type TEXT,
  last_campaign_name TEXT,
  days_since_contact INT,
  days_until_eligible INT
) AS $$
DECLARE
  v_last_contact RECORD;
  v_last_same_type RECORD;
  v_days_since INT;
  v_days_until INT;
BEGIN
  -- Find most recent contact (any type)
  SELECT ct.contacted_at, ct.campaign_type, ct.campaign_name
  INTO v_last_contact
  FROM contact_tracking ct
  WHERE ct.customer_id = p_customer_id
    AND ct.status IN ('pending', 'returned')  -- Don't count expired/cleared
  ORDER BY ct.contacted_at DESC
  LIMIT 1;

  -- If no previous contact, customer is eligible
  IF v_last_contact IS NULL THEN
    RETURN QUERY SELECT
      TRUE::BOOLEAN,
      'Nenhum contato anterior'::TEXT,
      NULL::TIMESTAMPTZ,
      NULL::TEXT,
      NULL::TEXT,
      NULL::INT,
      0::INT;
    RETURN;
  END IF;

  -- Calculate days since last contact
  v_days_since := EXTRACT(DAY FROM NOW() - v_last_contact.contacted_at)::INT;

  -- Check global cooldown (any campaign type)
  IF v_days_since < p_min_days_global THEN
    v_days_until := p_min_days_global - v_days_since;
    RETURN QUERY SELECT
      FALSE::BOOLEAN,
      format('Contactado há %s dias. Aguarde mais %s dias.', v_days_since, v_days_until)::TEXT,
      v_last_contact.contacted_at,
      v_last_contact.campaign_type,
      v_last_contact.campaign_name,
      v_days_since,
      v_days_until;
    RETURN;
  END IF;

  -- Check same campaign type cooldown (if type specified)
  IF p_campaign_type IS NOT NULL THEN
    SELECT ct.contacted_at, ct.campaign_type, ct.campaign_name
    INTO v_last_same_type
    FROM contact_tracking ct
    WHERE ct.customer_id = p_customer_id
      AND ct.campaign_type = p_campaign_type
      AND ct.status IN ('pending', 'returned')
    ORDER BY ct.contacted_at DESC
    LIMIT 1;

    IF v_last_same_type IS NOT NULL THEN
      v_days_since := EXTRACT(DAY FROM NOW() - v_last_same_type.contacted_at)::INT;

      IF v_days_since < p_min_days_same_type THEN
        v_days_until := p_min_days_same_type - v_days_since;
        RETURN QUERY SELECT
          FALSE::BOOLEAN,
          format('Já recebeu campanha "%s" há %s dias. Aguarde mais %s dias.',
                 p_campaign_type, v_days_since, v_days_until)::TEXT,
          v_last_same_type.contacted_at,
          v_last_same_type.campaign_type,
          v_last_same_type.campaign_name,
          v_days_since,
          v_days_until;
        RETURN;
      END IF;
    END IF;
  END IF;

  -- Check for recent opt-out button clicks (90 day cooldown)
  IF EXISTS (
    SELECT 1 FROM webhook_events we
    JOIN campaign_contacts cc ON cc.twilio_sid = we.message_sid
    JOIN contact_tracking ct ON ct.id = cc.contact_tracking_id
    WHERE ct.customer_id = p_customer_id
      AND we.event_type = 'button_click'
      AND LOWER(we.payload) LIKE '%não%interesse%'
      AND we.created_at > NOW() - INTERVAL '90 days'
  ) THEN
    RETURN QUERY SELECT
      FALSE::BOOLEAN,
      'Cliente clicou "Não tenho interesse" nos últimos 90 dias'::TEXT,
      v_last_contact.contacted_at,
      v_last_contact.campaign_type,
      v_last_contact.campaign_name,
      v_days_since,
      NULL::INT;
    RETURN;
  END IF;

  -- Customer is eligible
  RETURN QUERY SELECT
    TRUE::BOOLEAN,
    'Elegível para contato'::TEXT,
    v_last_contact.contacted_at,
    v_last_contact.campaign_type,
    v_last_contact.campaign_name,
    v_days_since,
    0::INT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION is_customer_contactable IS
'Check if a customer is eligible for campaign contact based on cooldown rules.
Returns eligibility status, reason, and last contact info.
Used by both manual campaigns (UI) and automations (scheduler).';

-- Function to batch check eligibility for multiple customers
-- More efficient than calling is_customer_contactable() in a loop
CREATE OR REPLACE FUNCTION check_customers_eligibility(
  p_customer_ids TEXT[],
  p_campaign_type TEXT DEFAULT NULL,
  p_min_days_global INT DEFAULT 7,
  p_min_days_same_type INT DEFAULT 30
)
RETURNS TABLE (
  customer_id TEXT,
  is_eligible BOOLEAN,
  reason TEXT,
  last_contact_date TIMESTAMPTZ,
  days_since_contact INT,
  days_until_eligible INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cid,
    (e).is_eligible,
    (e).reason,
    (e).last_contact_date,
    (e).days_since_contact,
    (e).days_until_eligible
  FROM unnest(p_customer_ids) AS cid
  CROSS JOIN LATERAL is_customer_contactable(
    cid,
    p_campaign_type,
    p_min_days_global,
    p_min_days_same_type
  ) AS e;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_customers_eligibility IS
'Batch check eligibility for multiple customers.
More efficient than calling is_customer_contactable() in a loop.';

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

-- ==================== CHURN RISK CALCULATION (v3.6) ====================
-- Calculates risk level using the EXACT same algorithm as customerMetrics.js
-- This ensures 100% consistency between frontend display and backend automation targeting
--
-- Algorithm:
-- 1. Lost: daysSinceLastVisit > 60 (LOST_THRESHOLD)
-- 2. New Customer: transaction_count = 1
-- 3. Likelihood-based (for customers with avg_days_between):
--    - ratio = daysSinceLastVisit / avgDaysBetween
--    - likelihood = exp(-max(0, ratio - 1)) * 100
--    - likelihood *= segment_bonus (VIP=1.2, Frequente=1.1, etc.)
--    - Healthy: >60%, Monitor: >30%, At Risk: >15%, Churning: ≤15%
-- 4. Fallback: Monitor with 40% likelihood

CREATE OR REPLACE FUNCTION calculate_customer_risk(
  p_days_since_last_visit INTEGER,
  p_transaction_count INTEGER,
  p_avg_days_between DECIMAL,
  p_rfm_segment TEXT
)
RETURNS TABLE (
  risk_level TEXT,
  return_likelihood INTEGER
) AS $$
DECLARE
  v_lost_threshold INTEGER := 60;
  v_risk_level TEXT;
  v_likelihood DECIMAL;
  v_ratio DECIMAL;
  v_segment_bonus DECIMAL;
BEGIN
  -- Get segment bonus (matches SEGMENT_BONUS in customerMetrics.js)
  v_segment_bonus := CASE COALESCE(p_rfm_segment, 'Unclassified')
    WHEN 'VIP' THEN 1.2
    WHEN 'Frequente' THEN 1.1
    WHEN 'Promissor' THEN 1.0
    WHEN 'Novato' THEN 0.9
    WHEN 'Esfriando' THEN 0.8
    WHEN 'Inativo' THEN 0.5
    -- English legacy names
    WHEN 'Champion' THEN 1.2
    WHEN 'Loyal' THEN 1.1
    WHEN 'Potential' THEN 1.0
    WHEN 'New' THEN 0.9
    WHEN 'At Risk' THEN 0.8
    WHEN 'Need Attention' THEN 0.8
    WHEN 'Lost' THEN 0.5
    ELSE 1.0
  END;

  -- Case 1: Lost (>60 days since last visit)
  IF COALESCE(p_days_since_last_visit, 999) > v_lost_threshold THEN
    v_risk_level := 'Lost';
    v_likelihood := 0;

  -- Case 2: New Customer (only 1 transaction)
  ELSIF COALESCE(p_transaction_count, 0) = 1 THEN
    v_risk_level := 'New Customer';
    v_likelihood := 50;

  -- Case 3: Likelihood-based (has avgDaysBetween)
  ELSIF p_avg_days_between IS NOT NULL AND p_avg_days_between > 0 THEN
    v_ratio := COALESCE(p_days_since_last_visit, 0)::DECIMAL / p_avg_days_between;

    -- Exponential decay formula: exp(-max(0, ratio - 1)) * 100
    v_likelihood := EXP(-GREATEST(0, v_ratio - 1)) * 100;

    -- Apply segment bonus
    v_likelihood := v_likelihood * v_segment_bonus;

    -- Cap at 100%
    v_likelihood := LEAST(100, v_likelihood);

    -- Classify by likelihood thresholds (matches RISK_THRESHOLDS in customerMetrics.js)
    IF v_likelihood > 60 THEN
      v_risk_level := 'Healthy';
    ELSIF v_likelihood > 30 THEN
      v_risk_level := 'Monitor';
    ELSIF v_likelihood > 15 THEN
      v_risk_level := 'At Risk';
    ELSE
      v_risk_level := 'Churning';
    END IF;

  -- Case 4: Fallback (no pattern data)
  ELSE
    v_risk_level := 'Monitor';
    v_likelihood := 40;
  END IF;

  RETURN QUERY SELECT v_risk_level, ROUND(v_likelihood)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update customer metrics from transactions
-- Computes RFM scores, segment, and risk level
-- v3.6: Now also computes risk_level and return_likelihood (matching frontend algorithm)
-- v3.4: Added avg_days_between calculation
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
    avg_days_between = sub.avg_days_between,
    recent_monetary_90d = sub.recent_monetary_90d,
    r_score = rfm.r_score,
    f_score = rfm.f_score,
    m_score = rfm.m_score,
    rfm_segment = rfm.segment,
    -- v3.6: Set risk level from calculate_customer_risk
    risk_level = risk.risk_level,
    return_likelihood = risk.return_likelihood,
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
      -- avg_days_between: (last - first) / (distinct_visits - 1)
      -- Uses distinct visit DAYS, not transaction count (multiple txns per visit is common)
      CASE
        WHEN COUNT(DISTINCT t.data_hora::DATE) FILTER (WHERE NOT t.is_recarga) > 1
        THEN ROUND(
          (MAX(t.data_hora)::DATE - MIN(t.data_hora)::DATE)::DECIMAL /
          (COUNT(DISTINCT t.data_hora::DATE) FILTER (WHERE NOT t.is_recarga) - 1),
          1
        )
        ELSE NULL
      END as avg_days_between,
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
  -- v3.6: Compute risk level using RFM segment for bonus multiplier
  CROSS JOIN LATERAL calculate_customer_risk(
    sub.days_since_last_visit,
    sub.transaction_count::INTEGER,
    sub.avg_days_between,
    rfm.segment
  ) risk
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

-- ==================== RETURN DETECTION (v3.9) ====================
-- Functions to automatically detect customer returns and link coupon redemptions
-- These complete the campaign effectiveness feedback loop

-- Function to detect customer returns by comparing last_visit with contacted_at
-- Runs periodically via scheduler to mark contacts as "returned" when customer revisits
-- Returns number of contacts updated
--
-- v3.11 (2025-12-13): Fixed same-day returns and multi-visit revenue
--   - Changed > to >= to detect same-day returns
--   - Revenue now sums ALL transactions within 7 days after contact (not just last_visit)
CREATE OR REPLACE FUNCTION detect_customer_returns()
RETURNS INT AS $$
DECLARE
  v_updated INT := 0;
BEGIN
  -- Update pending contacts where customer has visited ON OR AFTER being contacted
  -- Uses >= to catch same-day returns (customer contacted in morning, returns in afternoon)
  UPDATE contact_tracking ct
  SET
    status = 'returned',
    returned_at = c.last_visit::TIMESTAMPTZ,
    days_to_return = GREATEST(0, (c.last_visit - ct.contacted_at::DATE)),
    -- Calculate return revenue from ALL transactions within 7 days after contact
    -- Not just the last_visit date - captures multiple return visits
    return_revenue = COALESCE((
      SELECT SUM(t.net_value)
      FROM transactions t
      WHERE t.doc_cliente = ct.customer_id
        AND t.data_hora::DATE >= ct.contacted_at::DATE
        AND t.data_hora::DATE <= ct.contacted_at::DATE + INTERVAL '7 days'
        AND NOT t.is_recarga
    ), 0),
    updated_at = NOW()
  FROM customers c
  WHERE ct.customer_id = c.doc
    AND ct.status = 'pending'
    AND c.last_visit IS NOT NULL
    AND c.last_visit >= ct.contacted_at::DATE;  -- Changed > to >= for same-day returns

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  -- Log the result
  IF v_updated > 0 THEN
    RAISE NOTICE 'detect_customer_returns: Updated % contacts as returned', v_updated;
  END IF;

  RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

-- Function to link coupon redemptions from transactions to campaigns
-- Scans transactions with usou_cupom=true that aren't yet linked
-- Returns number of redemptions created
CREATE OR REPLACE FUNCTION link_pending_coupon_redemptions()
RETURNS INT AS $$
DECLARE
  v_created INT := 0;
  v_txn RECORD;
  v_campaign_id TEXT;
BEGIN
  -- Process transactions with coupons that don't have redemption records yet
  FOR v_txn IN
    SELECT t.id, t.codigo_cupom, t.doc_cliente, t.data_hora, t.net_value
    FROM transactions t
    WHERE t.usou_cupom = true
      AND t.codigo_cupom IS NOT NULL
      AND LOWER(t.codigo_cupom) != 'n/d'
      AND NOT EXISTS (
        SELECT 1 FROM coupon_redemptions cr WHERE cr.transaction_id = t.id
      )
  LOOP
    -- Find matching campaign for this coupon code
    v_campaign_id := find_campaign_by_coupon(v_txn.codigo_cupom);

    -- Create redemption record
    INSERT INTO coupon_redemptions (
      transaction_id, codigo_cupom, campaign_id, customer_doc,
      redeemed_at, discount_value
    ) VALUES (
      v_txn.id,
      v_txn.codigo_cupom,
      v_campaign_id,
      v_txn.doc_cliente,
      v_txn.data_hora,
      NULL  -- discount_value calculated later if needed
    );

    v_created := v_created + 1;

    -- Also mark customer as returned if they have a pending contact for this campaign
    IF v_campaign_id IS NOT NULL THEN
      UPDATE contact_tracking
      SET
        status = 'returned',
        returned_at = v_txn.data_hora,
        days_to_return = EXTRACT(DAY FROM v_txn.data_hora - contacted_at)::INT,
        return_revenue = COALESCE(return_revenue, 0) + COALESCE(v_txn.net_value, 0),
        updated_at = NOW()
      WHERE customer_id = v_txn.doc_cliente
        AND campaign_id = v_campaign_id
        AND status = 'pending'
        AND contacted_at < v_txn.data_hora;
    END IF;
  END LOOP;

  IF v_created > 0 THEN
    RAISE NOTICE 'link_pending_coupon_redemptions: Created % redemption records', v_created;
  END IF;

  RETURN v_created;
END;
$$ LANGUAGE plpgsql;

-- Convenience function that runs all return detection logic
-- Call this periodically from the scheduler
CREATE OR REPLACE FUNCTION process_campaign_returns()
RETURNS TABLE (
  returns_detected INT,
  coupons_linked INT,
  contacts_expired INT
) AS $$
DECLARE
  v_returns INT;
  v_coupons INT;
  v_expired INT;
BEGIN
  -- 1. Link any unlinked coupon redemptions
  v_coupons := link_pending_coupon_redemptions();

  -- 2. Detect returns from visit dates
  v_returns := detect_customer_returns();

  -- 3. Expire old contacts
  v_expired := expire_old_contacts();

  RETURN QUERY SELECT v_returns, v_coupons, v_expired;
END;
$$ LANGUAGE plpgsql;

-- ==================== AUTO-REFRESH TRIGGERS (v3.14) ====================
-- Automatically update customer metrics when transactions are inserted
-- Eliminates the need for manual "Sincronizar Metricas" clicks

-- Helper function: Calculate avg_days_between for a customer
CREATE OR REPLACE FUNCTION calculate_avg_days_between_trigger(p_customer_id TEXT)
RETURNS NUMERIC AS $$
DECLARE
  v_avg_days NUMERIC;
BEGIN
  WITH visit_dates AS (
    SELECT DISTINCT DATE(data_hora) as visit_date
    FROM transactions
    WHERE doc_cliente = p_customer_id
      AND data_hora IS NOT NULL
    ORDER BY visit_date
  ),
  visit_gaps AS (
    SELECT
      visit_date,
      LAG(visit_date) OVER (ORDER BY visit_date) as prev_visit,
      visit_date - LAG(visit_date) OVER (ORDER BY visit_date) as days_gap
    FROM visit_dates
  )
  SELECT COALESCE(AVG(days_gap), 30) INTO v_avg_days
  FROM visit_gaps
  WHERE days_gap IS NOT NULL AND days_gap > 0;

  RETURN COALESCE(v_avg_days, 30);
END;
$$ LANGUAGE plpgsql;

-- Helper function: Calculate risk_level for triggers
CREATE OR REPLACE FUNCTION calculate_risk_level_trigger(
  p_days_since_last_visit INTEGER,
  p_avg_days_between NUMERIC,
  p_transaction_count INTEGER
)
RETURNS TEXT AS $$
DECLARE
  v_ratio NUMERIC;
BEGIN
  IF p_transaction_count <= 1 THEN
    RETURN 'New Customer';
  END IF;

  IF p_days_since_last_visit IS NULL THEN
    RETURN 'Unknown';
  END IF;

  v_ratio := p_days_since_last_visit::NUMERIC / NULLIF(p_avg_days_between, 0);

  IF v_ratio <= 1.2 THEN
    RETURN 'Healthy';
  ELSIF v_ratio <= 2.0 THEN
    RETURN 'At Risk';
  ELSIF v_ratio <= 3.0 THEN
    RETURN 'Churning';
  ELSE
    RETURN 'Lost';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger function: Update customer after transaction insert
CREATE OR REPLACE FUNCTION update_customer_after_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_id TEXT;
  v_tx_date DATE;
  v_tx_value NUMERIC;
  v_avg_days NUMERIC;
  v_days_since INTEGER;
BEGIN
  v_customer_id := NEW.doc_cliente;
  v_tx_date := DATE(NEW.data_hora);
  v_tx_value := COALESCE(NEW.valor_venda, 0);

  IF v_customer_id IS NULL OR v_customer_id = '' THEN
    RETURN NEW;
  END IF;

  v_avg_days := calculate_avg_days_between_trigger(v_customer_id);
  v_days_since := CURRENT_DATE - v_tx_date;

  UPDATE customers
  SET
    last_visit = GREATEST(COALESCE(last_visit, v_tx_date), v_tx_date),
    transaction_count = COALESCE(transaction_count, 0) + 1,
    total_spent = CASE
      WHEN NEW.transaction_type IN ('TYPE_1', 'TYPE_3')
      THEN COALESCE(total_spent, 0) + v_tx_value
      ELSE COALESCE(total_spent, 0)
    END,
    avg_days_between = v_avg_days,
    days_since_last_visit = CURRENT_DATE - GREATEST(COALESCE(last_visit, v_tx_date), v_tx_date),
    risk_level = calculate_risk_level_trigger(
      CURRENT_DATE - GREATEST(COALESCE(last_visit, v_tx_date), v_tx_date),
      v_avg_days,
      COALESCE(transaction_count, 0) + 1
    ),
    updated_at = NOW()
  WHERE doc = v_customer_id;

  IF NOT FOUND THEN
    INSERT INTO customers (
      doc, nome, telefone, first_visit, last_visit,
      transaction_count, total_spent, avg_days_between,
      days_since_last_visit, risk_level, source, created_at, updated_at
    ) VALUES (
      v_customer_id, NEW.nome_cliente, NEW.telefone, v_tx_date, v_tx_date,
      1, CASE WHEN NEW.transaction_type IN ('TYPE_1', 'TYPE_3') THEN v_tx_value ELSE 0 END,
      30, v_days_since, 'New Customer', 'auto_created', NOW(), NOW()
    )
    ON CONFLICT (doc) DO UPDATE SET
      last_visit = GREATEST(customers.last_visit, EXCLUDED.last_visit),
      transaction_count = customers.transaction_count + 1,
      total_spent = customers.total_spent + EXCLUDED.total_spent,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function: Calculate customer risk on insert/update
CREATE OR REPLACE FUNCTION calculate_customer_risk_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_visit IS NOT NULL THEN
    NEW.days_since_last_visit := CURRENT_DATE - NEW.last_visit;
  END IF;

  NEW.risk_level := calculate_risk_level_trigger(
    NEW.days_since_last_visit,
    COALESCE(NEW.avg_days_between, 30),
    COALESCE(NEW.transaction_count, 1)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================== SMART CUSTOMER UPSERT (v3.14) ====================
-- Handles full customer list uploads without regressing computed data
-- Profile fields: always update
-- Date fields: use GREATEST (won't regress to older dates)
-- Count fields: use GREATEST (won't regress to lower values)
-- Computed fields: never touch (triggers handle)

CREATE OR REPLACE FUNCTION upsert_customer_profile(
  p_doc TEXT,
  p_nome TEXT DEFAULT NULL,
  p_telefone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_data_cadastro TIMESTAMPTZ DEFAULT NULL,
  p_saldo_carteira NUMERIC DEFAULT 0,
  p_first_visit DATE DEFAULT NULL,
  p_last_visit DATE DEFAULT NULL,
  p_transaction_count INTEGER DEFAULT 0,
  p_total_spent NUMERIC DEFAULT 0,
  p_source TEXT DEFAULT 'manual_upload'
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_action TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM customers WHERE doc = p_doc) THEN
    UPDATE customers SET
      nome = COALESCE(p_nome, nome),
      telefone = COALESCE(p_telefone, telefone),
      email = COALESCE(p_email, email),
      data_cadastro = COALESCE(p_data_cadastro, data_cadastro),
      saldo_carteira = COALESCE(p_saldo_carteira, saldo_carteira),
      first_visit = COALESCE(
        LEAST(COALESCE(first_visit, p_first_visit), COALESCE(p_first_visit, first_visit)),
        first_visit,
        p_first_visit
      ),
      last_visit = GREATEST(
        COALESCE(last_visit, p_last_visit),
        COALESCE(p_last_visit, last_visit)
      ),
      transaction_count = GREATEST(
        COALESCE(transaction_count, 0),
        COALESCE(p_transaction_count, 0)
      ),
      total_spent = GREATEST(
        COALESCE(total_spent, 0),
        COALESCE(p_total_spent, 0)
      ),
      updated_at = NOW()
    WHERE doc = p_doc;

    v_action := 'updated';
  ELSE
    INSERT INTO customers (
      doc, nome, telefone, email, data_cadastro, saldo_carteira,
      first_visit, last_visit, transaction_count, total_spent,
      source, created_at, updated_at
    ) VALUES (
      p_doc, p_nome, p_telefone, p_email, p_data_cadastro,
      COALESCE(p_saldo_carteira, 0), p_first_visit, p_last_visit,
      COALESCE(p_transaction_count, 0), COALESCE(p_total_spent, 0),
      p_source, NOW(), NOW()
    );

    v_action := 'inserted';
  END IF;

  v_result := jsonb_build_object('doc', p_doc, 'action', v_action);
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Batch version for better performance
CREATE OR REPLACE FUNCTION upsert_customer_profiles_batch(p_customers JSONB)
RETURNS JSONB AS $$
DECLARE
  v_customer JSONB;
  v_inserted INTEGER := 0;
  v_updated INTEGER := 0;
  v_result JSONB;
BEGIN
  FOR v_customer IN SELECT * FROM jsonb_array_elements(p_customers)
  LOOP
    SELECT upsert_customer_profile(
      p_doc := v_customer->>'doc',
      p_nome := v_customer->>'nome',
      p_telefone := v_customer->>'telefone',
      p_email := v_customer->>'email',
      p_data_cadastro := (v_customer->>'data_cadastro')::TIMESTAMPTZ,
      p_saldo_carteira := COALESCE((v_customer->>'saldo_carteira')::NUMERIC, 0),
      p_first_visit := (v_customer->>'first_visit')::DATE,
      p_last_visit := (v_customer->>'last_visit')::DATE,
      p_transaction_count := COALESCE((v_customer->>'transaction_count')::INTEGER, 0),
      p_total_spent := COALESCE((v_customer->>'total_spent')::NUMERIC, 0),
      p_source := COALESCE(v_customer->>'source', 'manual_upload')
    ) INTO v_result;

    IF v_result->>'action' = 'inserted' THEN
      v_inserted := v_inserted + 1;
    ELSE
      v_updated := v_updated + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'inserted', v_inserted,
    'updated', v_updated,
    'total', v_inserted + v_updated
  );
END;
$$ LANGUAGE plpgsql;

-- ==================== WABA UPSERT FUNCTION (v3.21) ====================

-- Idempotent upsert for WABA message analytics
-- Safe to call multiple times with same data (uses ON CONFLICT)
CREATE OR REPLACE FUNCTION upsert_waba_messages(p_data JSONB)
RETURNS INTEGER AS $$
DECLARE
  v_row JSONB;
  v_count INTEGER := 0;
BEGIN
  -- p_data is an array of message records:
  -- [{waba_id, phone_number_id, bucket_date, sent, delivered, read_count}, ...]

  FOR v_row IN SELECT * FROM jsonb_array_elements(p_data)
  LOOP
    INSERT INTO waba_message_analytics (
      waba_id,
      phone_number_id,
      bucket_date,
      sent,
      delivered,
      read_count,
      updated_at
    ) VALUES (
      v_row->>'waba_id',
      COALESCE(v_row->>'phone_number_id', ''),
      (v_row->>'bucket_date')::DATE,
      COALESCE((v_row->>'sent')::INTEGER, 0),
      COALESCE((v_row->>'delivered')::INTEGER, 0),
      COALESCE((v_row->>'read_count')::INTEGER, 0),
      NOW()
    )
    ON CONFLICT (waba_id, bucket_date, phone_number_id)
    DO UPDATE SET
      sent = EXCLUDED.sent,
      delivered = EXCLUDED.delivered,
      read_count = EXCLUDED.read_count,
      updated_at = NOW();

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION upsert_waba_messages IS 'Idempotent upsert for WABA message analytics. Safe to call multiple times with same data.';

-- ==================== WABA TEMPLATE UPSERT FUNCTIONS (v3.23) ====================

-- Idempotent upsert for WABA templates cache
CREATE OR REPLACE FUNCTION upsert_waba_templates(p_data JSONB)
RETURNS INTEGER AS $$
DECLARE
  v_row JSONB;
  v_count INTEGER := 0;
BEGIN
  FOR v_row IN SELECT * FROM jsonb_array_elements(p_data)
  LOOP
    INSERT INTO waba_templates (
      id, waba_id, name, status, category, language, local_template_id, updated_at
    ) VALUES (
      v_row->>'id',
      v_row->>'waba_id',
      v_row->>'name',
      COALESCE(v_row->>'status', 'APPROVED'),
      v_row->>'category',
      COALESCE(v_row->>'language', 'pt_BR'),
      v_row->>'local_template_id',
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      status = EXCLUDED.status,
      category = EXCLUDED.category,
      language = EXCLUDED.language,
      local_template_id = EXCLUDED.local_template_id,
      updated_at = NOW();
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION upsert_waba_templates IS 'Idempotent upsert for WABA templates cache.';

-- Idempotent upsert for per-template WABA analytics
CREATE OR REPLACE FUNCTION upsert_waba_template_analytics(p_data JSONB)
RETURNS INTEGER AS $$
DECLARE
  v_row JSONB;
  v_count INTEGER := 0;
BEGIN
  FOR v_row IN SELECT * FROM jsonb_array_elements(p_data)
  LOOP
    INSERT INTO waba_template_analytics (
      template_id, waba_id, bucket_date, sent, delivered, read_count, updated_at
    ) VALUES (
      v_row->>'template_id',
      v_row->>'waba_id',
      (v_row->>'bucket_date')::DATE,
      COALESCE((v_row->>'sent')::INTEGER, 0),
      COALESCE((v_row->>'delivered')::INTEGER, 0),
      COALESCE((v_row->>'read_count')::INTEGER, 0),
      NOW()
    )
    ON CONFLICT (template_id, bucket_date) DO UPDATE SET
      sent = EXCLUDED.sent,
      delivered = EXCLUDED.delivered,
      read_count = EXCLUDED.read_count,
      updated_at = NOW();
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION upsert_waba_template_analytics IS 'Idempotent upsert for per-template WABA analytics.';

-- ==================== INSTAGRAM UPSERT FUNCTION (v3.24) ====================

-- Idempotent upsert for Instagram daily metrics
CREATE OR REPLACE FUNCTION upsert_instagram_daily_metrics(p_data JSONB)
RETURNS INTEGER AS $$
DECLARE
  v_row JSONB;
  v_count INTEGER := 0;
BEGIN
  FOR v_row IN SELECT * FROM jsonb_array_elements(p_data)
  LOOP
    INSERT INTO instagram_daily_metrics (
      account_id, bucket_date, followers, following, posts,
      reach, views, profile_views, website_clicks, accounts_engaged, total_interactions,
      likes, comments, shares, saves, replies, follows_and_unfollows, profile_links_taps,
      engagement_rate, updated_at
    ) VALUES (
      v_row->>'account_id',
      (v_row->>'bucket_date')::DATE,
      COALESCE((v_row->>'followers')::INTEGER, 0),
      COALESCE((v_row->>'following')::INTEGER, 0),
      COALESCE((v_row->>'posts')::INTEGER, 0),
      COALESCE((v_row->>'reach')::INTEGER, 0),
      COALESCE((v_row->>'views')::INTEGER, 0),
      COALESCE((v_row->>'profile_views')::INTEGER, 0),
      COALESCE((v_row->>'website_clicks')::INTEGER, 0),
      COALESCE((v_row->>'accounts_engaged')::INTEGER, 0),
      COALESCE((v_row->>'total_interactions')::INTEGER, 0),
      COALESCE((v_row->>'likes')::INTEGER, 0),
      COALESCE((v_row->>'comments')::INTEGER, 0),
      COALESCE((v_row->>'shares')::INTEGER, 0),
      COALESCE((v_row->>'saves')::INTEGER, 0),
      COALESCE((v_row->>'replies')::INTEGER, 0),
      COALESCE((v_row->>'follows_and_unfollows')::INTEGER, 0),
      COALESCE((v_row->>'profile_links_taps')::INTEGER, 0),
      COALESCE((v_row->>'engagement_rate')::DECIMAL, 0),
      NOW()
    )
    ON CONFLICT (account_id, bucket_date) DO UPDATE SET
      followers = EXCLUDED.followers,
      following = EXCLUDED.following,
      posts = EXCLUDED.posts,
      reach = EXCLUDED.reach,
      views = EXCLUDED.views,
      profile_views = EXCLUDED.profile_views,
      website_clicks = EXCLUDED.website_clicks,
      accounts_engaged = EXCLUDED.accounts_engaged,
      total_interactions = EXCLUDED.total_interactions,
      likes = EXCLUDED.likes,
      comments = EXCLUDED.comments,
      shares = EXCLUDED.shares,
      saves = EXCLUDED.saves,
      replies = EXCLUDED.replies,
      follows_and_unfollows = EXCLUDED.follows_and_unfollows,
      profile_links_taps = EXCLUDED.profile_links_taps,
      engagement_rate = EXCLUDED.engagement_rate,
      updated_at = NOW();
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION upsert_instagram_daily_metrics IS 'Idempotent upsert for Instagram daily metrics (v24.0 with views and replies).';

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

-- v3.5: Trigger to sync campaign when automation rule changes
DROP TRIGGER IF EXISTS sync_automation_campaign_trigger ON automation_rules;
CREATE TRIGGER sync_automation_campaign_trigger
  AFTER INSERT OR UPDATE ON automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_automation_campaign();

-- v3.14: Auto-refresh triggers for customer metrics
DROP TRIGGER IF EXISTS trg_update_customer_after_transaction ON transactions;
CREATE TRIGGER trg_update_customer_after_transaction
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_after_transaction();

DROP TRIGGER IF EXISTS trg_calculate_customer_risk ON customers;
CREATE TRIGGER trg_calculate_customer_risk
  BEFORE INSERT OR UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION calculate_customer_risk_on_insert();

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
-- Default automation rules with v3.7 enhanced controls
-- Note: exclude_recent_days is NULL for welcome, wallet_reminder, post_visit (they target recent visitors)

INSERT INTO automation_rules (
  id, name, enabled, trigger_type, trigger_value, action_template, action_channel,
  cooldown_days, coupon_code, discount_percent, coupon_validity_days,
  send_window_start, send_window_end, send_days, max_daily_sends,
  exclude_recent_days, min_total_spent, wallet_balance_max
)
VALUES
  -- Win-back 30 days: Exclude visitors in last 3 days, require min R$30 spend
  ('winback_30', 'Win-back 30 dias', false, 'days_since_visit', 30, 'winback_discount', 'whatsapp',
   30, 'VOLTE20', 20, 7,
   '09:00', '20:00', '{1,2,3,4,5}', 50,
   3, 30.00, NULL),

  -- Win-back 45 days (critical): Exclude visitors in last 3 days, require min R$50 spend
  ('winback_45', 'Win-back Critico', false, 'days_since_visit', 45, 'winback_critical', 'whatsapp',
   21, 'VOLTE30', 30, 7,
   '09:00', '20:00', '{1,2,3,4,5}', 30,
   3, 50.00, NULL),

  -- Welcome: No exclusions (targets new customers), no min spend
  ('welcome_new', 'Boas-vindas', false, 'first_purchase', 1, 'welcome_new', 'whatsapp',
   365, 'BEM10', 10, 14,
   '09:00', '20:00', '{1,2,3,4,5}', 20,
   NULL, NULL, NULL),

  -- Wallet reminder: No recent exclusion, target balances R$20-R$200
  ('wallet_reminder', 'Lembrete de saldo', false, 'wallet_balance', 20, 'wallet_reminder', 'whatsapp',
   14, NULL, NULL, NULL,
   '09:00', '20:00', '{1,2,3,4,5}', 30,
   NULL, NULL, 200.00),

  -- Post-visit: No exclusions (targets recent visitors by design)
  ('post_visit', 'Pos-Visita', false, 'hours_after_visit', 24, 'post_visit_thanks', 'whatsapp',
   7, NULL, NULL, NULL,
   '10:00', '19:00', '{1,2,3,4,5}', 50,
   NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ==================== GRANTS ====================
-- Grant permissions to authenticated and anon roles (adjust as needed)

GRANT SELECT, INSERT, UPDATE, DELETE ON blacklist TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON campaign_sends TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON scheduled_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON comm_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON automation_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON automation_sends TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON contact_tracking TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON campaign_contacts TO authenticated;
-- v3.8: Webhook events for delivery tracking
GRANT SELECT, INSERT, UPDATE ON webhook_events TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE webhook_events_id_seq TO authenticated;
-- v3.20: App settings
GRANT SELECT, INSERT, UPDATE ON app_settings TO authenticated;
-- v3.21: WABA analytics table
GRANT SELECT, INSERT, UPDATE, DELETE ON waba_message_analytics TO authenticated;
-- v3.23: WABA template analytics tables
GRANT SELECT, INSERT, UPDATE, DELETE ON waba_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON waba_template_analytics TO authenticated;
-- v3.24: Instagram analytics table
GRANT SELECT, INSERT, UPDATE, DELETE ON instagram_daily_metrics TO authenticated;

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
-- v3.8: Delivery metrics view
GRANT SELECT ON campaign_delivery_metrics TO authenticated;
-- v3.21: WABA analytics views
GRANT SELECT ON waba_analytics_summary TO authenticated;
GRANT SELECT ON waba_daily_metrics TO authenticated;
-- v3.23: WABA template analytics view
GRANT SELECT ON waba_template_analytics_view TO authenticated;
-- v3.24: Instagram analytics view
GRANT SELECT ON instagram_metrics_with_growth TO authenticated;

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
GRANT EXECUTE ON FUNCTION calculate_customer_risk TO authenticated;
GRANT EXECUTE ON FUNCTION find_campaign_by_coupon TO authenticated;
GRANT EXECUTE ON FUNCTION process_coupon_redemption TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_customer TO authenticated;
GRANT EXECUTE ON FUNCTION generate_transaction_hash TO authenticated;
-- v3.5: Unified automation-campaign functions
GRANT EXECUTE ON FUNCTION sync_automation_campaign TO authenticated;
GRANT EXECUTE ON FUNCTION record_automation_contact TO authenticated;
-- v3.9: Return detection functions
GRANT EXECUTE ON FUNCTION detect_customer_returns TO authenticated;
GRANT EXECUTE ON FUNCTION link_pending_coupon_redemptions TO authenticated;
GRANT EXECUTE ON FUNCTION process_campaign_returns TO authenticated;
-- v3.12: Unified eligibility functions
GRANT EXECUTE ON FUNCTION is_customer_contactable TO authenticated;
GRANT EXECUTE ON FUNCTION check_customers_eligibility TO authenticated;
-- v3.14: Auto-refresh trigger functions
GRANT EXECUTE ON FUNCTION calculate_avg_days_between_trigger TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_risk_level_trigger TO authenticated;
GRANT EXECUTE ON FUNCTION update_customer_after_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_customer_risk_on_insert TO authenticated;
-- v3.14: Smart customer upsert functions
GRANT EXECUTE ON FUNCTION upsert_customer_profile TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_customer_profiles_batch TO authenticated;
-- v3.20: App settings trigger function
GRANT EXECUTE ON FUNCTION update_app_settings_timestamp TO authenticated;
-- v3.21: WABA analytics function
GRANT EXECUTE ON FUNCTION upsert_waba_messages TO authenticated;
-- v3.23: WABA template analytics functions
GRANT EXECUTE ON FUNCTION upsert_waba_templates TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_waba_template_analytics TO authenticated;
-- v3.24: Instagram analytics function
GRANT EXECUTE ON FUNCTION upsert_instagram_daily_metrics TO authenticated;
