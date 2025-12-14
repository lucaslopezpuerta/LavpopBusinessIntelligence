/**
 * useRealtimeSync - Supabase Realtime subscription for live updates
 *
 * OPTIMIZED FOR FREE TIER: Only subscribes to contact_tracking table
 * (the most critical for Customers/Campaigns mobile UX)
 *
 * Benefits:
 * - Near-instant contact status updates (WebSocket, not HTTP polling)
 * - Minimal data transfer (only changed records)
 * - No rate limits (single persistent connection)
 * - Works great on mobile (low battery/data usage)
 * - Free tier compatible (uses ~1 connection)
 *
 * Usage:
 *   const { lastUpdate, isConnected } = useRealtimeSync({
 *     onContactChange: (payload) => { ... }
 *   });
 *
 * SETUP REQUIRED:
 * 1. Go to Supabase Dashboard → Database → Replication
 * 2. Enable realtime for "contact_tracking" table only
 * 3. That's it! Free tier includes Realtime at no extra cost
 */

import { useEffect, useState, useRef, useCallback } from 'react';

// Supabase client (lazy loaded to match supabaseLoader.js pattern)
let supabaseClient = null;

async function getSupabase() {
  if (!supabaseClient) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('[useRealtimeSync] Supabase credentials not configured');
      return null;
    }

    const { createClient } = await import('@supabase/supabase-js');
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseClient;
}

export function useRealtimeSync({
  onContactChange,
  enabled = true
} = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const channelRef = useRef(null);

  // Debounce rapid updates to prevent UI thrashing
  const pendingUpdates = useRef([]);
  const flushTimeoutRef = useRef(null);

  const flushUpdates = useCallback(() => {
    const updates = pendingUpdates.current;

    if (updates.length > 0 && onContactChange) {
      onContactChange(updates);
    }

    // Reset pending
    pendingUpdates.current = [];
    setLastUpdate(new Date());
  }, [onContactChange]);

  const queueUpdate = useCallback((payload) => {
    pendingUpdates.current.push(payload);

    // Debounce: flush after 300ms of no new updates (faster for contacts)
    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current);
    }
    flushTimeoutRef.current = setTimeout(flushUpdates, 300);
  }, [flushUpdates]);

  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    async function setupRealtime() {
      const supabase = await getSupabase();
      if (!supabase || !mounted) return;

      // Subscribe ONLY to contact_tracking (optimized for free tier)
      // This is the critical table for Customers/Campaigns real-time UX
      const channel = supabase
        .channel('contact-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'contact_tracking' },
          (payload) => {
            console.log('[Realtime] Contact change:', payload.eventType, payload.new?.status || '');
            queueUpdate(payload);
          }
        )
        .subscribe((status) => {
          console.log('[Realtime] Connection status:', status);
          setIsConnected(status === 'SUBSCRIBED');
        });

      channelRef.current = channel;
    }

    setupRealtime();

    return () => {
      mounted = false;
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [enabled, queueUpdate]);

  return { isConnected, lastUpdate };
}

/**
 * useIncrementalSync - Fetch only records changed since last sync
 *
 * For initial load + periodic sync, fetches only new/updated records
 * instead of the entire table.
 *
 * Requires tables to have `updated_at` timestamp column.
 */
export function useIncrementalSync(table, lastSyncTime) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const sync = useCallback(async () => {
    const supabase = await getSupabase();
    if (!supabase) return;

    setLoading(true);
    try {
      let query = supabase.from(table).select('*');

      // Only fetch records updated after last sync
      if (lastSyncTime) {
        query = query.gt('updated_at', lastSyncTime.toISOString());
      }

      const { data: newRecords, error } = await query;

      if (error) throw error;

      if (newRecords && newRecords.length > 0) {
        setData(prev => {
          // Merge new records with existing (update or add)
          const merged = [...prev];
          newRecords.forEach(newRecord => {
            const existingIndex = merged.findIndex(r => r.id === newRecord.id);
            if (existingIndex >= 0) {
              merged[existingIndex] = newRecord; // Update
            } else {
              merged.push(newRecord); // Add
            }
          });
          return merged;
        });
      }
    } catch (error) {
      console.error(`[IncrementalSync] Error syncing ${table}:`, error);
    } finally {
      setLoading(false);
    }
  }, [table, lastSyncTime]);

  return { data, loading, sync };
}

export default useRealtimeSync;
