// useBlacklist.js v1.0
// Hook for managing blacklist data and checking customer status
//
// CHANGELOG:
// v1.0 (2025-12-14): Initial implementation
//   - Fetches blacklist from Supabase on mount
//   - Provides isBlacklisted(phone) check function
//   - Returns blacklist reason for display
//   - Caches data to avoid repeated fetches

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { api } from '../utils/apiService';

// Cache blacklist data across hook instances
let cachedBlacklist = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Hook to check if customers are blacklisted
 * @returns {Object} { isBlacklisted, getBlacklistReason, blacklistedPhones, isLoading, error, refresh }
 */
export function useBlacklist() {
  const [blacklist, setBlacklist] = useState(cachedBlacklist || []);
  const [isLoading, setIsLoading] = useState(!cachedBlacklist);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  // Fetch blacklist from API
  const fetchBlacklist = useCallback(async (force = false) => {
    // Use cache if available and not expired
    if (!force && cachedBlacklist && Date.now() - cacheTimestamp < CACHE_DURATION) {
      if (isMountedRef.current) {
        setBlacklist(cachedBlacklist);
        setIsLoading(false);
      }
      return;
    }

    if (isMountedRef.current) {
      setIsLoading(true);
      setError(null);
    }

    try {
      // api.blacklist.getAll() returns the entries array directly
      const data = await api.blacklist.getAll();

      // Update cache
      cachedBlacklist = data;
      cacheTimestamp = Date.now();

      if (isMountedRef.current) {
        setBlacklist(data);
      }
    } catch (err) {
      console.error('[useBlacklist] Failed to fetch blacklist:', err);
      if (isMountedRef.current) {
        setError(err.message);
      }
      // Keep existing data on error
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    isMountedRef.current = true;
    fetchBlacklist();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchBlacklist]);

  // Create a Set of normalized phone numbers for fast lookup
  const blacklistedPhones = useMemo(() => {
    const phones = new Set();
    blacklist.forEach(entry => {
      if (entry.phone) {
        // Normalize phone: remove non-digits
        const normalized = String(entry.phone).replace(/\D/g, '');
        phones.add(normalized);
        // Also add without country code if it starts with 55
        if (normalized.startsWith('55') && normalized.length > 11) {
          phones.add(normalized.slice(2));
        }
        // Also add with country code if it doesn't have one
        if (!normalized.startsWith('55') && normalized.length <= 11) {
          phones.add('55' + normalized);
        }
      }
    });
    return phones;
  }, [blacklist]);

  // Create a map of phone -> entry for reason lookup
  const blacklistMap = useMemo(() => {
    const map = new Map();
    blacklist.forEach(entry => {
      if (entry.phone) {
        const normalized = String(entry.phone).replace(/\D/g, '');
        map.set(normalized, entry);
        if (normalized.startsWith('55') && normalized.length > 11) {
          map.set(normalized.slice(2), entry);
        }
        if (!normalized.startsWith('55') && normalized.length <= 11) {
          map.set('55' + normalized, entry);
        }
      }
    });
    return map;
  }, [blacklist]);

  // Check if a phone number is blacklisted
  const isBlacklisted = useCallback((phone) => {
    if (!phone) return false;
    const normalized = String(phone).replace(/\D/g, '');
    return blacklistedPhones.has(normalized);
  }, [blacklistedPhones]);

  // Get blacklist reason for a phone number
  const getBlacklistReason = useCallback((phone) => {
    if (!phone) return null;
    const normalized = String(phone).replace(/\D/g, '');
    const entry = blacklistMap.get(normalized);
    if (!entry) return null;

    // Format reason for display
    const reason = entry.reason || 'unknown';
    const reasonLabels = {
      'opt-out': 'Optou por sair',
      'undeliverable': 'Número inválido',
      'blocked': 'Bloqueado pelo usuário',
      'manual': 'Bloqueio manual',
      'unknown': 'Bloqueado'
    };

    return {
      reason: reasonLabels[reason] || reason,
      notes: entry.notes || null,
      createdAt: entry.created_at ? new Date(entry.created_at) : null
    };
  }, [blacklistMap]);

  // Force refresh blacklist
  const refresh = useCallback(() => {
    fetchBlacklist(true);
  }, [fetchBlacklist]);

  return {
    isBlacklisted,
    getBlacklistReason,
    blacklistedPhones,
    blacklistCount: blacklist.length,
    isLoading,
    error,
    refresh
  };
}

export default useBlacklist;
