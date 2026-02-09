// useRecommendations.js v1.4 - CATEGORY COUNT FIX
// Generates and manages AI-powered recommendations
//
// CHANGELOG:
// v1.4 (2026-02-07): Fix categoryCounts/totalCount including dismissed items
//   - Shared `active` memo excludes dismissed before counting
//   - Badge counts now match visible cards after dismiss
// v1.3 (2026-02-06): High severity fixes from code review
//   - dismissedIds resets on regeneration (prevents unbounded Set growth)
// v1.2 (2026-02-06): Race condition fix
//   - useEffect with cancellation flag prevents stale state from concurrent generates
//   - generate() kept only for manual refresh (user-initiated, no race risk)
// v1.1 (2026-02-06): Fix dismiss/snooze removing all rule-based recs
//   - Rule-based recs have no DB id (only fingerprint)
//   - Fixed filter: only match on defined id/fingerprint, not undefined === undefined
// v1.0 (2026-02-06): Initial implementation
//   - Generates recommendations from rule-based + ML + LLM layers
//   - Dismiss, snooze, and action tracking
//   - Category filtering
//   - Refresh support

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  generateRecommendations,
  dismissRecommendation,
  snoozeRecommendation,
  markActioned
} from '../utils/recommendationEngine';

export function useRecommendations(data) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dismissedIds, setDismissedIds] = useState(new Set());
  const [activeCategory, setActiveCategory] = useState('all');

  // Build engine data from hook input
  const buildEngineData = useCallback(() => ({
    customers: data?.customers || [],
    salesData: data?.sales || data?.salesData || [],
    customerMap: data?.customerMap || {},
    revenueMetrics: data?.revenueMetrics || {}
  }), [data?.customers, data?.sales, data?.salesData, data?.customerMap, data?.revenueMetrics]);

  // Manual refresh (user-initiated — no cancellation needed)
  const refresh = useCallback(async () => {
    if (!data?.customers || data.customers.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const recs = await generateRecommendations(buildEngineData());
      setRecommendations(recs);
      setDismissedIds(new Set()); // Reset — DB-dismissed recs won't appear in fresh results
    } catch (err) {
      console.error('Recommendation generation failed:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [data?.customers, buildEngineData]);

  // Auto-generate on data change (with cancellation to prevent race conditions)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!data?.customers || data.customers.length === 0) {
        if (!cancelled) setLoading(false);
        return;
      }

      if (!cancelled) {
        setLoading(true);
        setError(null);
      }

      try {
        const recs = await generateRecommendations(buildEngineData());
        if (!cancelled) {
          setRecommendations(recs);
          setDismissedIds(new Set()); // Reset — fresh data means fresh dismissal state
        }
      } catch (err) {
        console.error('Recommendation generation failed:', err);
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [buildEngineData]);

  // Dismiss handler
  const dismiss = useCallback(async (recOrId) => {
    const id = typeof recOrId === 'string' ? recOrId : recOrId?.id;
    const fingerprint = typeof recOrId === 'object' ? recOrId?.fingerprint : null;

    // Optimistic update
    const key = id || fingerprint;
    if (key) setDismissedIds(prev => new Set([...prev, key]));
    setRecommendations(prev => prev.filter(r => {
      // Only match on defined values — undefined !== undefined would remove all rule-based recs
      if (id != null && r.id === id) return false;
      if (fingerprint != null && r.fingerprint === fingerprint) return false;
      return true;
    }));

    // Persist to DB if it has a UUID id
    if (id && id.includes('-')) {
      await dismissRecommendation(id);
    }
  }, []);

  // Snooze handler
  const snooze = useCallback(async (recOrId, hours = 24) => {
    const id = typeof recOrId === 'string' ? recOrId : recOrId?.id;
    const fingerprint = typeof recOrId === 'object' ? recOrId?.fingerprint : null;

    setRecommendations(prev => prev.filter(r => {
      if (id != null && r.id === id) return false;
      if (fingerprint != null && r.fingerprint === fingerprint) return false;
      return true;
    }));

    if (id && id.includes('-')) {
      await snoozeRecommendation(id, hours);
    }
  }, []);

  // Mark actioned handler
  const action = useCallback(async (recOrId) => {
    const id = typeof recOrId === 'string' ? recOrId : recOrId?.id;

    if (id && id.includes('-')) {
      await markActioned(id);
    }
  }, []);

  // Active recommendations (excludes dismissed)
  const active = useMemo(() =>
    recommendations.filter(r => !dismissedIds.has(r.id) && !dismissedIds.has(r.fingerprint)),
    [recommendations, dismissedIds]
  );

  // Filter by category
  const filtered = useMemo(() => {
    if (activeCategory === 'all') return active;
    return active.filter(r => r.category === activeCategory);
  }, [active, activeCategory]);

  // Category counts (from active, not raw — so badges match visible cards)
  const categoryCounts = useMemo(() => {
    const counts = { all: active.length };
    for (const rec of active) {
      counts[rec.category] = (counts[rec.category] || 0) + 1;
    }
    return counts;
  }, [active]);

  return {
    recommendations: filtered,
    allRecommendations: recommendations,
    loading,
    error,
    dismiss,
    snooze,
    action,
    refresh,
    activeCategory,
    setActiveCategory,
    categoryCounts,
    totalCount: active.length
  };
}

export default useRecommendations;
