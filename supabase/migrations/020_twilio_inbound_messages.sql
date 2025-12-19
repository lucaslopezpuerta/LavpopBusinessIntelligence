-- Migration 020: Twilio Inbound Messages Table
-- Version: 3.26 (2025-12-19)
--
-- Purpose: Store inbound WhatsApp messages separately from contact_tracking.
-- contact_tracking should only track customers who RECEIVED outbound campaigns.
-- This table stores ALL inbound messages for analytics display.
--
-- Benefits:
-- 1. Clean separation: contact_tracking = outbound campaign tracking only
-- 2. No customer_id constraint: inbound messages may come from unknown numbers
-- 3. Proper schema for UI: matches WhatsAppAnalytics.jsx "Respostas Recebidas" section
-- 4. Fast queries: dedicated indexes for engagement analytics
--
-- Run in Supabase SQL Editor

-- ==================== CREATE TABLE ====================

CREATE TABLE IF NOT EXISTS twilio_inbound_messages (
  id SERIAL PRIMARY KEY,

  -- Message identification
  message_sid TEXT UNIQUE,           -- Twilio message SID (for deduplication)

  -- Sender info
  phone TEXT NOT NULL,               -- Normalized phone (+5554996923504)
  customer_name TEXT,                -- Customer name if matched
  customer_id TEXT,                  -- Customer ID if matched (NULL if unknown)

  -- Message content
  body TEXT,                         -- Message body (truncated for privacy)

  -- Classification
  engagement_type TEXT,              -- button_positive, button_optout, other

  -- Timestamps
  received_at TIMESTAMPTZ,           -- When message was received (from Twilio dateSent)
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Linked outbound message (if we found the corresponding send)
  linked_contact_tracking_id INT REFERENCES contact_tracking(id)
);

-- ==================== INDEXES ====================

-- Index for date-range queries (UI displays by date)
CREATE INDEX IF NOT EXISTS idx_twilio_inbound_received
ON twilio_inbound_messages(received_at DESC);

-- Index for engagement type filtering (KPI calculations)
CREATE INDEX IF NOT EXISTS idx_twilio_inbound_type
ON twilio_inbound_messages(engagement_type)
WHERE engagement_type IS NOT NULL;

-- Index for phone lookups (matching to customers)
CREATE INDEX IF NOT EXISTS idx_twilio_inbound_phone
ON twilio_inbound_messages(phone);

-- Index for customer matching (if customer_id is known)
CREATE INDEX IF NOT EXISTS idx_twilio_inbound_customer
ON twilio_inbound_messages(customer_id)
WHERE customer_id IS NOT NULL;

-- ==================== COMMENTS ====================

COMMENT ON TABLE twilio_inbound_messages IS
'Stores inbound WhatsApp messages from Twilio for engagement analytics.
Separate from contact_tracking which tracks outbound campaign recipients only.
v1.0: Created for proper inbound message storage.';

COMMENT ON COLUMN twilio_inbound_messages.message_sid IS 'Twilio message SID for deduplication';
COMMENT ON COLUMN twilio_inbound_messages.phone IS 'Sender phone number in normalized format (+5554996923504)';
COMMENT ON COLUMN twilio_inbound_messages.customer_name IS 'Customer name if matched from customers table';
COMMENT ON COLUMN twilio_inbound_messages.customer_id IS 'Customer ID if matched, NULL for unknown numbers';
COMMENT ON COLUMN twilio_inbound_messages.body IS 'Message body (may be truncated for privacy)';
COMMENT ON COLUMN twilio_inbound_messages.engagement_type IS 'Classification: button_positive, button_optout, or other';
COMMENT ON COLUMN twilio_inbound_messages.received_at IS 'When message was received (from Twilio dateSent field)';
COMMENT ON COLUMN twilio_inbound_messages.linked_contact_tracking_id IS 'FK to contact_tracking if we found the corresponding outbound message';

-- ==================== PERMISSIONS ====================

GRANT SELECT, INSERT, UPDATE ON twilio_inbound_messages TO authenticated;
GRANT SELECT ON twilio_inbound_messages TO anon;

