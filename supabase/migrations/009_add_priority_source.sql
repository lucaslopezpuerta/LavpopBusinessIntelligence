-- Migration 009: Add priority_source column to contact_tracking
-- Date: 2025-12-15
-- Purpose: Support manual inclusion of customers into automation queues
--
-- This enables the "Incluir em Automação" feature where users can manually
-- add customers to an automation's queue from the customer segment modal.
--
-- Flow:
-- 1. User clicks "Incluir" → contact_tracking created with priority_source='manual_inclusion', status='queued'
-- 2. Scheduler picks up queued entries every 5 minutes
-- 3. Checks eligibility (cooldowns enforced)
-- 4. Sends message using automation's template
-- 5. Updates status to 'pending' for return tracking

-- Add priority_source column to contact_tracking
ALTER TABLE contact_tracking ADD COLUMN IF NOT EXISTS priority_source TEXT;

-- Add index for efficient queue queries
-- Partial index only includes rows that need processing
CREATE INDEX IF NOT EXISTS idx_contact_tracking_priority_queue
ON contact_tracking(priority_source, status)
WHERE priority_source = 'manual_inclusion' AND status = 'queued';

-- Add comment explaining the column
COMMENT ON COLUMN contact_tracking.priority_source IS
'Source of contact entry: manual_inclusion (user clicked Incluir), automation (scheduler created), NULL (legacy/manual campaign)';

-- Verify the column was added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contact_tracking' AND column_name = 'priority_source'
  ) THEN
    RAISE NOTICE 'Migration 009: priority_source column added successfully';
  ELSE
    RAISE EXCEPTION 'Migration 009: Failed to add priority_source column';
  END IF;
END $$;
