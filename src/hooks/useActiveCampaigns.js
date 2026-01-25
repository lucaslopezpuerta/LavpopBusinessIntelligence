// useActiveCampaigns.js v1.3 - CACHE INVALIDATION
// Hook for fetching and filtering active campaigns by audience type
// Separates automated campaigns from manual campaigns
//
// CHANGELOG:
// v1.3 (2026-01-25): Cache invalidation on campaign changes
//   - Export invalidateCampaignCache() for external cache clearing
//   - Listen for campaignCreated/Updated/Deleted events
//   - Prevents stale data after campaign operations
// v1.2 (2025-12-15): Fixed manual campaigns filter
//   - Excludes automation-generated campaigns (is_automated, AUTO_ prefix, Auto: name)
//   - Manual dropdown now only shows actual manual campaigns
// v1.1 (2025-12-15): Added debounce and race condition protection
//   - Added lastFetchRef for debouncing (matches useContactTracking pattern)
//   - Added isFetchingRef to prevent concurrent fetches
//   - Cache check moved before async boundary
// v1.0 (2025-12-15): Initial implementation
//   - Fetches campaigns and automation rules
//   - getCampaignsForAudience returns { automated, manual }
//   - Caches data for 5 minutes

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getCampaignPerformance, getAutomationRules } from '../utils/campaignService';

// Cache for campaigns and automation rules (shared across instances)
let cachedCampaigns = null;
let cachedAutomationRules = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Custom events for cache invalidation
const CAMPAIGN_EVENTS = ['campaignCreated', 'campaignUpdated', 'campaignDeleted'];

/**
 * Invalidate the campaign cache
 * Call this after creating, updating, or deleting campaigns
 */
export function invalidateCampaignCache() {
  cachedCampaigns = null;
  cachedAutomationRules = null;
  cacheTimestamp = 0;
}

// Mapping from customer segment type to matching automation rule IDs
const AUTOMATION_MAPPINGS = {
  atRisk: ['winback_30', 'winback_45'],
  churn: ['winback_30', 'winback_45'],
  newCustomers: ['welcome_new', 'post_visit'],
  welcome: ['welcome_new', 'post_visit'],
  wallet: ['wallet_reminder'],
  vip: ['winback_30'], // High-value customers also match winback
  retention: ['winback_30', 'winback_45', 'post_visit'], // Retention re-engage campaigns
};

// Mapping from customer segment type to matching campaign audience types
const AUDIENCE_MAPPINGS = {
  atRisk: ['atRisk', 'vip'],
  churn: ['atRisk'],
  newCustomers: ['newCustomers'],
  welcome: ['newCustomers'],
  healthy: ['healthy'],
  vip: ['vip', 'frequent'],
  frequent: ['frequent', 'vip'],
  champions: ['vip', 'frequent'],
  retention: ['atRisk', 'newCustomers', 'healthy'], // Show relevant campaigns for retention modal
};

/**
 * Hook to fetch and filter active campaigns by audience type
 * @returns {Object} { automatedCampaigns, manualCampaigns, getCampaignsForAudience, isLoading, error, refresh }
 */
export function useActiveCampaigns() {
  const [campaigns, setCampaigns] = useState(cachedCampaigns || []);
  const [automationRules, setAutomationRules] = useState(cachedAutomationRules || []);
  const [isLoading, setIsLoading] = useState(!cachedCampaigns);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);
  const lastFetchRef = useRef(0);
  const isFetchingRef = useRef(false);

  // Fetch data with debounce and race condition protection
  const fetchData = useCallback(async (force = false) => {
    // Debounce: don't fetch more than once per second unless forced
    const now = Date.now();
    if (!force && now - lastFetchRef.current < 1000) {
      return;
    }

    // Use cache if available and not expired (check before async boundary)
    if (!force && cachedCampaigns && cachedAutomationRules && now - cacheTimestamp < CACHE_DURATION) {
      if (isMountedRef.current) {
        setCampaigns(cachedCampaigns);
        setAutomationRules(cachedAutomationRules);
        setIsLoading(false);
      }
      return;
    }

    // Prevent concurrent fetches
    if (isFetchingRef.current && !force) {
      return;
    }

    lastFetchRef.current = now;
    isFetchingRef.current = true;

    if (isMountedRef.current) {
      setIsLoading(true);
      setError(null);
    }

    try {
      // Fetch both in parallel
      const [campaignsData, rulesData] = await Promise.all([
        getCampaignPerformance(),
        getAutomationRules()
      ]);

      // Update cache
      cachedCampaigns = campaignsData || [];
      cachedAutomationRules = rulesData || [];
      cacheTimestamp = Date.now();

      if (isMountedRef.current) {
        setCampaigns(cachedCampaigns);
        setAutomationRules(cachedAutomationRules);
      }
    } catch (err) {
      console.error('[useActiveCampaigns] Failed to fetch data:', err);
      if (isMountedRef.current) {
        setError(err.message);
      }
    } finally {
      isFetchingRef.current = false;
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  // Listen for campaign change events (invalidate cache and refetch)
  useEffect(() => {
    const handleCampaignChange = () => {
      invalidateCampaignCache();
      fetchData(true);
    };

    // Add listeners for all campaign events
    CAMPAIGN_EVENTS.forEach(event => {
      window.addEventListener(event, handleCampaignChange);
    });

    return () => {
      CAMPAIGN_EVENTS.forEach(event => {
        window.removeEventListener(event, handleCampaignChange);
      });
    };
  }, [fetchData]);

  // Filter active manual campaigns (exclude automation-generated campaigns)
  const manualCampaigns = useMemo(() => {
    return campaigns.filter(c =>
      c.status === 'active' &&
      !c.is_automated &&
      !c.id?.startsWith('AUTO_') &&
      !c.name?.startsWith('Auto:')
    );
  }, [campaigns]);

  // Filter enabled automation rules
  const automatedCampaigns = useMemo(() => {
    return automationRules.filter(r => r.enabled);
  }, [automationRules]);

  /**
   * Get campaigns that match a specific audience type
   * @param {string} audienceType - 'atRisk', 'newCustomers', 'vip', etc.
   * @returns {{ automated: Array, manual: Array }}
   */
  const getCampaignsForAudience = useCallback((audienceType) => {
    // Get matching automation rule IDs
    const matchingAutomationIds = AUTOMATION_MAPPINGS[audienceType] || [];
    const automated = automatedCampaigns.filter(r => matchingAutomationIds.includes(r.id));

    // Get matching campaign audience types
    const matchingAudienceTypes = AUDIENCE_MAPPINGS[audienceType] || [audienceType];
    const manual = manualCampaigns.filter(c => matchingAudienceTypes.includes(c.audience));

    return { automated, manual };
  }, [automatedCampaigns, manualCampaigns]);

  // Force refresh
  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return {
    automatedCampaigns,
    manualCampaigns,
    getCampaignsForAudience,
    isLoading,
    error,
    refresh
  };
}

export default useActiveCampaigns;
