-- Migration: 054_add_missing_fk_indexes.sql
-- Purpose: Add indexes for unindexed foreign keys to speed up JOINs
-- Risk: NONE - indexes are additive and don't change behavior
-- Rollback: DROP INDEX statements at bottom

-- campaign_contacts.contact_tracking_id (656 rows, used in JOINs)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_contacts_tracking_id
ON campaign_contacts(contact_tracking_id);

-- coupon_redemptions.customer_doc (529 rows, JOIN to customers)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupon_redemptions_customer_doc
ON coupon_redemptions(customer_doc);

-- coupon_redemptions.transaction_id (529 rows, JOIN to transactions)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupon_redemptions_transaction_id
ON coupon_redemptions(transaction_id);

-- twilio_inbound_messages.linked_contact_tracking_id (117 rows)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_twilio_inbound_linked_tracking
ON twilio_inbound_messages(linked_contact_tracking_id);

-- ROLLBACK:
-- DROP INDEX CONCURRENTLY IF EXISTS idx_campaign_contacts_tracking_id;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_coupon_redemptions_customer_doc;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_coupon_redemptions_transaction_id;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_twilio_inbound_linked_tracking;
