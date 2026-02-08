-- Migration 063: Smart Recommendations Engine
-- Creates tables for AI-enhanced recommendation system
-- Three-layer architecture: Rule-based + Existing ML + LLM (OpenAI GPT-4)

CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '💡',
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_model TEXT,
  ai_confidence DECIMAL(4,3),
  action_type TEXT,
  action_label TEXT,
  action_data JSONB,
  priority INT DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  actioned_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,
  fingerprint TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS ai_insight_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type TEXT NOT NULL,
  prompt_tokens INT,
  completion_tokens INT,
  model TEXT DEFAULT 'gpt-4-turbo',
  cost_usd DECIMAL(6,4),
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommendations_active ON recommendations(created_at DESC)
  WHERE dismissed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_recommendations_category ON recommendations(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_fingerprint ON recommendations(fingerprint);
CREATE INDEX IF NOT EXISTS idx_ai_insight_log_type ON ai_insight_log(insight_type, created_at DESC);

CREATE OR REPLACE VIEW active_recommendations AS
SELECT *
FROM recommendations
WHERE dismissed_at IS NULL
  AND (snoozed_until IS NULL OR snoozed_until < NOW())
  AND (expires_at IS NULL OR expires_at > NOW())
ORDER BY priority DESC, created_at DESC;
