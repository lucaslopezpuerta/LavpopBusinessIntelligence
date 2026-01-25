/**
 * AppSettingsContext - Centralized settings management
 *
 * VERSION: 1.1
 *
 * Replaces the localStorage-based useBusinessSettings hook with Supabase persistence.
 * Provides app-wide settings for business configuration (pricing, costs, maintenance).
 *
 * Features:
 * - Loads settings from Supabase on app start
 * - Optimistic UI updates (instant feedback, syncs in background)
 * - Falls back to defaults if Supabase unavailable
 * - One-time migration from localStorage to Supabase
 * - Same field names as old hook for backward compatibility
 * - Memoized context value (prevents unnecessary re-renders)
 *
 * CHANGELOG:
 * v1.1 (2026-01-25): Performance optimization
 *   - Memoized context value with useMemo
 * v1.0: Initial implementation
 *
 * Usage:
 *   import { useAppSettings } from '../contexts/AppSettingsContext';
 *   const { settings, updateSettings, isLoading, error } = useAppSettings();
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';

// Default settings (matching previous BusinessSettingsModal defaults)
const DEFAULT_SETTINGS = {
  // Pricing
  servicePrice: 17.90,
  cashbackPercent: 7.5,
  cashbackStartDate: '2024-06-01',

  // Fixed Costs (monthly)
  rentCost: 2000,
  electricityCost: 500,
  waterCost: 200,
  internetCost: 100,
  otherFixedCosts: 200,

  // Maintenance
  maintenanceIntervalDays: 45,
  maintenanceDowntimeHours: 6,
  maintenanceCostPerSession: 300,

  // POS Automation
  posUseProxy: true, // Use residential proxy for CAPTCHA solving
};

// Map camelCase (JS) to snake_case (DB)
const toSnakeCase = (settings) => ({
  service_price: settings.servicePrice,
  cashback_percent: settings.cashbackPercent,
  cashback_start_date: settings.cashbackStartDate,
  rent_cost: settings.rentCost,
  electricity_cost: settings.electricityCost,
  water_cost: settings.waterCost,
  internet_cost: settings.internetCost,
  other_fixed_costs: settings.otherFixedCosts,
  maintenance_interval_days: settings.maintenanceIntervalDays,
  maintenance_downtime_hours: settings.maintenanceDowntimeHours,
  maintenance_cost_per_session: settings.maintenanceCostPerSession,
  pos_use_proxy: settings.posUseProxy,
});

// Map snake_case (DB) to camelCase (JS)
const toCamelCase = (row) => ({
  servicePrice: parseFloat(row.service_price) || DEFAULT_SETTINGS.servicePrice,
  cashbackPercent: parseFloat(row.cashback_percent) || DEFAULT_SETTINGS.cashbackPercent,
  cashbackStartDate: row.cashback_start_date || DEFAULT_SETTINGS.cashbackStartDate,
  rentCost: parseFloat(row.rent_cost) || DEFAULT_SETTINGS.rentCost,
  electricityCost: parseFloat(row.electricity_cost) || DEFAULT_SETTINGS.electricityCost,
  waterCost: parseFloat(row.water_cost) || DEFAULT_SETTINGS.waterCost,
  internetCost: parseFloat(row.internet_cost) || DEFAULT_SETTINGS.internetCost,
  otherFixedCosts: parseFloat(row.other_fixed_costs) || DEFAULT_SETTINGS.otherFixedCosts,
  maintenanceIntervalDays: parseInt(row.maintenance_interval_days) || DEFAULT_SETTINGS.maintenanceIntervalDays,
  maintenanceDowntimeHours: parseInt(row.maintenance_downtime_hours) || DEFAULT_SETTINGS.maintenanceDowntimeHours,
  maintenanceCostPerSession: parseFloat(row.maintenance_cost_per_session) || DEFAULT_SETTINGS.maintenanceCostPerSession,
  posUseProxy: row.pos_use_proxy !== undefined ? row.pos_use_proxy : DEFAULT_SETTINGS.posUseProxy,
});

// Old localStorage key for migration
const OLD_STORAGE_KEY = 'lavpop_business_settings';

const AppSettingsContext = createContext(null);

export const AppSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const hasMigrated = useRef(false);

  // Load settings from Supabase on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const client = await getSupabaseClient();
      if (!client) {
        console.warn('[AppSettings] Supabase not available, using defaults');
        setSettings(DEFAULT_SETTINGS);
        return;
      }

      // Try to get settings from Supabase
      const { data, error: fetchError } = await client
        .from('app_settings')
        .select('*')
        .eq('id', 'default')
        .single();

      if (fetchError) {
        // Table might not exist yet - use defaults
        if (fetchError.code === 'PGRST116' || fetchError.code === '42P01') {
          console.warn('[AppSettings] Table not found, using defaults');
          setSettings(DEFAULT_SETTINGS);
          return;
        }
        throw fetchError;
      }

      if (data) {
        const loadedSettings = toCamelCase(data);
        setSettings(loadedSettings);

        // One-time migration from localStorage (if not already done)
        if (!hasMigrated.current) {
          await migrateFromLocalStorage(client, loadedSettings);
        }
      } else {
        // No data found, create default row
        await createDefaultSettings(client);
      }
    } catch (err) {
      console.error('[AppSettings] Failed to load:', err);
      setError(err.message);
      // Fall back to defaults on error
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  };

  // One-time migration from localStorage to Supabase
  const migrateFromLocalStorage = async (client, currentSupabaseSettings) => {
    hasMigrated.current = true;

    try {
      const stored = localStorage.getItem(OLD_STORAGE_KEY);
      if (!stored) return; // Nothing to migrate

      const localSettings = JSON.parse(stored);

      // Check if Supabase has default values (never modified)
      const isDefault =
        currentSupabaseSettings.servicePrice === DEFAULT_SETTINGS.servicePrice &&
        currentSupabaseSettings.rentCost === DEFAULT_SETTINGS.rentCost;

      if (isDefault && localSettings) {
        // Merge localStorage values into Supabase
        const merged = { ...DEFAULT_SETTINGS, ...localSettings };
        await saveToSupabase(client, merged);
        setSettings(merged);

        // Clear localStorage after successful migration
        localStorage.removeItem(OLD_STORAGE_KEY);
      }
    } catch (err) {
      console.warn('[AppSettings] Migration failed:', err);
      // Don't throw - migration failure is not critical
    }
  };

  // Create default settings row
  const createDefaultSettings = async (client) => {
    try {
      const { error: insertError } = await client
        .from('app_settings')
        .insert({ id: 'default', ...toSnakeCase(DEFAULT_SETTINGS) });

      if (insertError && insertError.code !== '23505') { // Ignore duplicate key
        throw insertError;
      }
    } catch (err) {
      console.warn('[AppSettings] Failed to create defaults:', err);
    }
  };

  // Save settings to Supabase
  const saveToSupabase = async (client, newSettings) => {
    const { error: updateError } = await client
      .from('app_settings')
      .upsert({
        id: 'default',
        ...toSnakeCase(newSettings)
      });

    if (updateError) {
      throw updateError;
    }
  };

  // Update settings (optimistic UI)
  // Uses functional setState to avoid dependency on settings object (prevents re-renders)
  const updateSettings = useCallback(async (newSettings) => {
    // Compute merged inside functional update to avoid settings dependency
    let merged;
    setSettings(prev => {
      merged = { ...prev, ...newSettings };
      return merged;
    });

    // Optimistic update already applied above
    setIsSaving(true);
    setError(null);

    try {
      const client = await getSupabaseClient();
      if (!client) {
        throw new Error('Supabase not available');
      }

      await saveToSupabase(client, merged);
    } catch (err) {
      console.error('[AppSettings] Failed to save:', err);
      setError(err.message);
      // Don't revert - keep the optimistic update for better UX
      // The user can try saving again
    } finally {
      setIsSaving(false);
    }
  }, []); // Empty deps - stable callback reference

  // Reset to defaults
  const resetToDefaults = useCallback(async () => {
    setSettings(DEFAULT_SETTINGS);
    setIsSaving(true);
    setError(null);

    try {
      const client = await getSupabaseClient();
      if (client) {
        await saveToSupabase(client, DEFAULT_SETTINGS);
      }
    } catch (err) {
      console.error('[AppSettings] Failed to reset:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Reload settings from Supabase
  const reloadSettings = useCallback(() => {
    loadSettings();
  }, []);

  // Memoized context value - only recreates when dependencies change
  const value = useMemo(() => ({
    settings,
    updateSettings,
    resetToDefaults,
    reloadSettings,
    isLoading,
    isSaving,
    error,
  }), [settings, updateSettings, resetToDefaults, reloadSettings, isLoading, isSaving, error]);

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
};

/**
 * Hook to access app settings
 * @returns {{
 *   settings: typeof DEFAULT_SETTINGS,
 *   updateSettings: (newSettings: Partial<typeof DEFAULT_SETTINGS>) => Promise<void>,
 *   resetToDefaults: () => Promise<void>,
 *   reloadSettings: () => void,
 *   isLoading: boolean,
 *   isSaving: boolean,
 *   error: string | null
 * }}
 */
export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within AppSettingsProvider');
  }
  return context;
};

// Export defaults for reference
export { DEFAULT_SETTINGS };

export default AppSettingsContext;
