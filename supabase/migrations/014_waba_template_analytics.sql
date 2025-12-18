-- Migration 014: WhatsApp Template Analytics
-- Version: 3.23 (2025-12-18)
--
-- Adds per-template analytics with READ metrics (not available at account level)
-- Enables template performance comparison
--
-- Tables:
-- - waba_templates: Cache of template metadata from Meta API
-- - waba_template_analytics: Per-template daily metrics (sent, delivered, read)
--
-- Design:
-- - Templates fetched dynamically via GET /{WABA_ID}/message_templates
-- - Analytics fetched per-template via GET /{TEMPLATE_ID}?fields=analytics...
-- - READ metric only available at template level (not account level)

-- ==================== TEMPLATES CACHE TABLE ====================

CREATE TABLE IF NOT EXISTS waba_templates (
  id TEXT PRIMARY KEY,                    -- Meta template UUID
  waba_id TEXT NOT NULL,
  name TEXT NOT NULL,                     -- e.g., 'lavpop_winback_desconto'
  status TEXT DEFAULT 'APPROVED',         -- APPROVED, PENDING, REJECTED
  category TEXT,                          -- MARKETING, UTILITY
  language TEXT DEFAULT 'pt_BR',
  local_template_id TEXT,                 -- Maps to messageTemplates.js (e.g., 'winback_discount')
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waba_templates_waba ON waba_templates(waba_id);
CREATE INDEX IF NOT EXISTS idx_waba_templates_name ON waba_templates(name);
CREATE INDEX IF NOT EXISTS idx_waba_templates_local ON waba_templates(local_template_id) WHERE local_template_id IS NOT NULL;

COMMENT ON TABLE waba_templates IS 'Cached WhatsApp message templates from Meta API. Maps Meta template IDs to local template configuration.';

-- ==================== TEMPLATE ANALYTICS TABLE ====================

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

-- Unique constraint prevents duplicates on re-sync
CREATE UNIQUE INDEX IF NOT EXISTS idx_waba_template_analytics_unique
ON waba_template_analytics(template_id, bucket_date);

CREATE INDEX IF NOT EXISTS idx_waba_template_analytics_date
ON waba_template_analytics(bucket_date);

CREATE INDEX IF NOT EXISTS idx_waba_template_analytics_waba
ON waba_template_analytics(waba_id);

COMMENT ON TABLE waba_template_analytics IS 'Per-template WhatsApp analytics with READ metrics from Meta Graph API.';

-- ==================== SYNC TRACKING ====================

ALTER TABLE app_settings
ADD COLUMN IF NOT EXISTS waba_template_last_sync TIMESTAMPTZ;

COMMENT ON COLUMN app_settings.waba_template_last_sync IS 'Timestamp of last WABA template analytics sync';

-- ==================== UPSERT FUNCTION: TEMPLATES ====================

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

-- ==================== UPSERT FUNCTION: TEMPLATE ANALYTICS ====================

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

-- ==================== VIEW: TEMPLATE ANALYTICS WITH NAMES ====================

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

-- ==================== GRANTS ====================

GRANT SELECT, INSERT, UPDATE, DELETE ON waba_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON waba_template_analytics TO authenticated;
GRANT SELECT ON waba_template_analytics_view TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_waba_templates TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_waba_template_analytics TO authenticated;
