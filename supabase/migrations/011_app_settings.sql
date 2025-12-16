-- Migration 011: App Settings Table
-- Version: 3.20 (2025-12-16)
--
-- Creates a centralized settings table for app configuration.
-- Replaces localStorage-based settings from BusinessSettingsModal.
--
-- Settings stored:
-- - Business: service price, cashback, fixed costs, maintenance
-- - Future: Additional app-wide settings can be added here
--
-- Design:
-- - Single-row table (id='default') for simplicity
-- - Supports multi-tenant later by adding more rows with different IDs
-- - All settings have sensible defaults matching previous localStorage values

-- ==================== APP SETTINGS TABLE ====================

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

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Add comment for documentation
COMMENT ON TABLE app_settings IS 'App-wide settings including business parameters, costs, and maintenance configuration. Single-row table (id=default).';
