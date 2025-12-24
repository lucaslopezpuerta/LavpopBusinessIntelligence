/**
 * useRealtimeSync - Supabase Realtime subscription for live updates
 * v1.3 - FIXED INFINITE RECONNECTION LOOP
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
 * - Auto-reconnects on disconnect with exponential backoff
 * - Graceful degradation when realtime unavailable
 *
 * CHANGELOG:
 * v1.3 (2025-12-23): Fixed infinite reconnection loop
 *   - ROOT CAUSE: useEffect dependency array included unstable callbacks
 *   - FIX: Use ref pattern to break the dependency cycle
 *   - Main effect now only depends on `enabled` (stable)
 *   - setupRealtimeRef holds latest function without triggering re-runs
 *   - Cleanup no longer triggers CLOSED status unnecessarily
 * v1.2 (2025-12-23): Stable connection detection
 *   - Only resets retry counter after 5s of stable connection
 *   - Prevents infinite reconnection loops from flapping connections
 *   - Adds "gave up" flag to stop console spam after max attempts
 *   - App continues working with cached data when realtime unavailable
 * v1.1 (2025-12-23): Reconnection logic
 *   - Added exponential backoff for reconnection attempts
 *   - Handles CHANNEL_ERROR and CLOSED status
 *   - Max 5 retry attempts before giving up
 *   - Logs connection status changes for debugging
 * v1.0: Initial implementation
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
import { getSupabaseClient } from '../utils/supabaseClient';

// Use shared Supabase client to avoid multiple GoTrueClient instances
const getSupabase = getSupabaseClient;

// Reconnection configuration
const MAX_RETRY_ATTEMPTS = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 30000; // 30 seconds
const STABLE_CONNECTION_THRESHOLD = 5000; // 5 seconds before considering connection stable

export function useRealtimeSync({
  onContactChange,
  enabled = true
} = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const channelRef = useRef(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef(null);
  const mountedRef = useRef(true);
  const connectedAtRef = useRef(null); // Track when connection was established
  const stableTimeoutRef = useRef(null); // Timer for stable connection check
  const gaveUpRef = useRef(false); // Flag to stop logging after max attempts
  const setupRealtimeRef = useRef(null); // Ref to hold latest setupRealtime function

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

  // Cleanup existing channel before reconnecting
  const cleanupChannel = useCallback(async () => {
    if (channelRef.current) {
      try {
        await channelRef.current.unsubscribe();
      } catch {
        // Ignore unsubscribe errors
      }
      channelRef.current = null;
    }
  }, []);

  // Setup realtime subscription
  const setupRealtime = useCallback(async () => {
    if (!mountedRef.current) return;

    const supabase = await getSupabase();
    if (!supabase || !mountedRef.current) return;

    // Clean up any existing channel first
    await cleanupChannel();

    // Subscribe ONLY to contact_tracking (optimized for free tier)
    // This is the critical table for Customers/Campaigns real-time UX
    const channel = supabase
      .channel('contact-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contact_tracking' },
        (payload) => {
          queueUpdate(payload);
        }
      )
      .subscribe((status) => {
        if (!mountedRef.current) return;

        console.debug(`[useRealtimeSync] Status: ${status}`);

        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          connectedAtRef.current = Date.now();

          // Only reset retry count after connection is stable for STABLE_CONNECTION_THRESHOLD
          if (stableTimeoutRef.current) {
            clearTimeout(stableTimeoutRef.current);
          }
          stableTimeoutRef.current = setTimeout(() => {
            // Check connectedAtRef instead of isConnected state to avoid stale closure
            if (mountedRef.current && connectedAtRef.current) {
              retryCountRef.current = 0;
              gaveUpRef.current = false;
              console.debug('[useRealtimeSync] Connection stable, retry counter reset');
            }
          }, STABLE_CONNECTION_THRESHOLD);
        } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          setIsConnected(false);
          connectedAtRef.current = null;

          // Clear stable connection timer
          if (stableTimeoutRef.current) {
            clearTimeout(stableTimeoutRef.current);
            stableTimeoutRef.current = null;
          }

          // Skip if already gave up
          if (gaveUpRef.current) return;

          // Attempt reconnection with exponential backoff
          if (retryCountRef.current < MAX_RETRY_ATTEMPTS && mountedRef.current) {
            const delay = Math.min(
              INITIAL_RETRY_DELAY * Math.pow(2, retryCountRef.current),
              MAX_RETRY_DELAY
            );
            retryCountRef.current++;

            console.warn(
              `[useRealtimeSync] Connection lost. Reconnecting in ${delay / 1000}s (attempt ${retryCountRef.current}/${MAX_RETRY_ATTEMPTS})`
            );

            retryTimeoutRef.current = setTimeout(() => {
              if (mountedRef.current && setupRealtimeRef.current) {
                setupRealtimeRef.current();
              }
            }, delay);
          } else if (retryCountRef.current >= MAX_RETRY_ATTEMPTS && !gaveUpRef.current) {
            gaveUpRef.current = true;
            console.warn(
              `[useRealtimeSync] Max reconnection attempts (${MAX_RETRY_ATTEMPTS}) reached. Realtime sync disabled - app will continue working with cached data.`
            );
          }
        }
      });

    channelRef.current = channel;
  }, [queueUpdate, cleanupChannel]);

  // Keep setupRealtimeRef in sync with the latest setupRealtime function
  // This allows the retry logic to call the latest version without dependency issues
  useEffect(() => {
    setupRealtimeRef.current = setupRealtime;
  }, [setupRealtime]);

  // Main effect: only runs when `enabled` changes (typically once on mount)
  // Using ref for setupRealtime prevents the infinite re-subscription loop
  useEffect(() => {
    if (!enabled) return;

    mountedRef.current = true;

    // Call setupRealtime via ref to avoid dependency issues
    if (setupRealtimeRef.current) {
      setupRealtimeRef.current();
    }

    return () => {
      mountedRef.current = false;

      // Clear all timeouts
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (stableTimeoutRef.current) {
        clearTimeout(stableTimeoutRef.current);
      }

      // Cleanup channel directly without calling cleanupChannel()
      // This avoids triggering CLOSED status which would increment retry counter
      if (channelRef.current) {
        channelRef.current.unsubscribe().catch(() => {});
        channelRef.current = null;
      }
    };
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

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
