-- 028_upload_history.sql
-- Migration to create the upload_history table for tracking data imports
--
-- This table logs all uploads (manual and automated) for transparency
-- Both Python (POS_automation.py) and JS (supabaseUploader.js) log here

-- Create upload_history table
CREATE TABLE IF NOT EXISTS upload_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  file_type TEXT NOT NULL,           -- 'sales' or 'customers'
  file_name TEXT,                     -- Original filename
  records_total INT DEFAULT 0,
  records_inserted INT DEFAULT 0,
  records_updated INT DEFAULT 0,
  records_skipped INT DEFAULT 0,
  errors TEXT[],                      -- Array of error messages
  source TEXT DEFAULT 'manual',       -- 'manual' or 'automated'
  duration_ms INT,                    -- Upload duration in milliseconds
  status TEXT DEFAULT 'success'       -- 'success', 'partial', 'failed'
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_upload_history_uploaded_at
ON upload_history(uploaded_at DESC);

-- Enable Row Level Security
ALTER TABLE upload_history ENABLE ROW LEVEL SECURITY;

-- Policy to allow all authenticated users to read
CREATE POLICY "Allow read access" ON upload_history
  FOR SELECT USING (true);

-- Policy to allow inserts
CREATE POLICY "Allow insert" ON upload_history
  FOR INSERT WITH CHECK (true);

-- Policy to allow deletes
CREATE POLICY "Allow delete" ON upload_history
  FOR DELETE USING (true);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON upload_history TO authenticated;
GRANT SELECT, INSERT, DELETE ON upload_history TO anon;
GRANT SELECT, INSERT, DELETE ON upload_history TO service_role;

-- Comment on table
COMMENT ON TABLE upload_history IS 'Tracks all data imports (manual and automated) for transparency and debugging';
