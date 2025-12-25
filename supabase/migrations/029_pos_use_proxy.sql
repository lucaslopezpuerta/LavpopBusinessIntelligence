-- Migration 029: POS Automation Proxy Setting
-- Version: 3.28 (2025-12-25)
--
-- Adds pos_use_proxy column to app_settings table.
-- Controls whether POS automation uses residential proxy for CAPTCHA solving.
--
-- Options:
-- - true: Use residential proxy (DataImpulse) for reliable CAPTCHA solving
-- - false: Use ProxyLess mode (direct connection, faster but may be blocked)
--
-- Default is true (use proxy) for maximum reliability.

-- ==================== ADD POS_USE_PROXY COLUMN ====================

ALTER TABLE app_settings
ADD COLUMN IF NOT EXISTS pos_use_proxy BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN app_settings.pos_use_proxy IS 'Whether POS automation uses residential proxy for CAPTCHA solving. true=proxy (reliable), false=proxyless (faster).';
