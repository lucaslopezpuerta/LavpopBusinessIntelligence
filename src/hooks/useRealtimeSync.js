/**
 * useRealtimeSync - Supabase Realtime subscription for live updates
 * v1.6 - TRANSACTIONS SUBSCRIPTION
 *
 * Subscribes to:
 * - contact_tracking: All events (critical for Customers/Campaigns mobile UX)
 * - transactions: INSERT only (triggers cache invalidation for fresh data)
 *
 * Benefits:
 * - Near-instant contact status updates (WebSocket, not HTTP polling)
 * - Auto-refresh when new transactions inserted (no manual sync needed)
 * - Minimal data transfer (only changed records)
 * - No rate limits (single persistent connection per table)
 * - Works great on mobile (low battery/data usage)
 * - Free tier compatible (uses ~2 connections)
 * - Auto-reconnects on disconnect with exponential backoff
 * - Graceful degradation when realtime unavailable
 * - Auto-reconnects when returning to tab after idle
 *
 * CHANGELOG:
 * v1.6 (2026-01-12): Transactions subscription
 *   - Added second channel for transactions table (INSERT only)
 *   - New callback: onTransactionInsert for cache invalidation
 *   - Dispatches 'transactionUpdate' custom event for App.jsx
 *   - Keeps existing contact_tracking subscription unchanged
 * v1.5 (2025-12-26): Fix reconnection loop
 *   - ROOT CAUSE: cleanupChannel() triggers CLOSED status, which schedules retry
 *   - FIX: Add intentionalDisconnectRef flag to skip CLOSED handler during cleanup
 *   - Prevents infinite loop: setupRealtime -> cleanupChannel -> CLOSED -> retry -> setupRealtime
 * v1.4 (2025-12-26): Visibility-based reconnection
 *   - Added visibility change listener to reconnect when tab becomes visible
 *   - Resets retry counter and "gave up" flag when returning to app
 *   - Fixes connection loss after long idle periods in background tabs
 *   - Browsers throttle background tabs, breaking WebSocket heartbeats
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
 *     onContactChange: (payload) => { ... },
 *     onTransactionInsert: (payload) => { ... }
 *   });
 *
 * SETUP REQUIRED:
 * 1. Go to Supabase Dashboard → Database → Replication
 * 2. Enable realtime for "contact_tracking" table
 * 3. Enable realtime for "transactions" table
 * 4. That's it! Free tier includes Realtime at no extra cost
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
  onTransactionInsert,
  enabled = true
} = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const channelRef = useRef(null);
  const transactionChannelRef = useRef(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef(null);
  const mountedRef = useRef(true);
  const connectedAtRef = useRef(null); // Track when connection was established
  const stableTimeoutRef = useRef(null); // Timer for stable connection check
  const gaveUpRef = useRef(false); // Flag to stop logging after max attempts
  const setupRealtimeRef = useRef(null); // Ref to hold latest setupRealtime function
  const intentionalDisconnectRef = useRef(false); // Flag to skip CLOSED handler during intentional cleanup

  // Store callbacks in refs to break dependency chain (stable references)
  const onContactChangeRef = useRef(onContactChange);
  const onTransactionInsertRef = useRef(onTransactionInsert);

  // Keep refs in sync with latest props
  useEffect(() => {
    onContactChangeRef.current = onContactChange;
  }, [onContactChange]);

  useEffect(() => {
    onTransactionInsertRef.current = onTransactionInsert;
  }, [onTransactionInsert]);

  // Debounce rapid updates to prevent UI thrashing
  const pendingUpdates = useRef([]);
  const flushTimeoutRef = useRef(null);

  // Stable callback - uses ref to avoid dependency chain
  const flushUpdates = useCallback(() => {
    const updates = pendingUpdates.current;

    if (updates.length > 0 && onContactChangeRef.current) {
      onContactChangeRef.current(updates);
    }

    // Reset pending
    pendingUpdates.current = [];
    setLastUpdate(new Date());
  }, []); // Empty deps - uses ref

  // Stable callback - uses ref to avoid dependency chain
  const queueUpdate = useCallback((payload) => {
    pendingUpdates.current.push(payload);

    // Debounce: flush after 300ms of no new updates (faster for contacts)
    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current);
    }
    flushTimeoutRef.current = setTimeout(flushUpdates, 300);
  }, [flushUpdates]);

  // Handle transaction INSERT - stable callback using ref
  const handleTransactionInsert = useCallback((payload) => {
    console.info('[useRealtimeSync] Transaction INSERT detected:', payload.new?.id || 'batch');

    // Dispatch custom event for App.jsx to invalidate cache
    window.dispatchEvent(new CustomEvent('transactionUpdate', {
      detail: { type: 'INSERT', data: payload.new }
    }));

    // Call provided callback if any (via ref for stability)
    onTransactionInsertRef.current?.(payload);

    setLastUpdate(new Date());
  }, []); // Empty deps - uses ref

  // Cleanup existing channels before reconnecting
  const cleanupChannels = useCallback(async () => {
    // Set flag to prevent CLOSED handler from triggering reconnection
    intentionalDisconnectRef.current = true;

    // Clean up contact_tracking channel
    if (channelRef.current) {
      try {
        await channelRef.current.unsubscribe();
      } catch {
        // Ignore unsubscribe errors
      }
      channelRef.current = null;
    }

    // Clean up transactions channel
    if (transactionChannelRef.current) {
      try {
        await transactionChannelRef.current.unsubscribe();
      } catch {
        // Ignore unsubscribe errors
      }
      transactionChannelRef.current = null;
    }

    // Reset flag after cleanup
    intentionalDisconnectRef.current = false;
  }, []);

  // Setup realtime subscriptions
  const setupRealtime = useCallback(async () => {
    if (!mountedRef.current) return;

    const supabase = await getSupabase();
    if (!supabase || !mountedRef.current) return;

    // Clean up any existing channels first
    await cleanupChannels();

    // Status handler shared between channels
    const handleStatus = (channelName) => (status) => {
      if (!mountedRef.current) return;

      console.debug(`[useRealtimeSync] ${channelName} status: ${status}`);

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

        // Skip reconnection if this was an intentional disconnect (during cleanup before reconnect)
        if (intentionalDisconnectRef.current) return;

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
    };

    // Channel 1: contact_tracking (all events)
    // Critical table for Customers/Campaigns real-time UX
    const contactChannel = supabase
      .channel('contact-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contact_tracking' },
        (payload) => {
          queueUpdate(payload);
        }
      )
      .subscribe(handleStatus('contact_tracking'));

    channelRef.current = contactChannel;

    // Channel 2: transactions (INSERT only)
    // Triggers cache invalidation when new transactions are inserted
    // DB trigger auto-updates customer metrics, so we only need INSERT
    const transactionChannel = supabase
      .channel('transaction-inserts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        (payload) => {
          handleTransactionInsert(payload);
        }
      )
      .subscribe(handleStatus('transactions'));

    transactionChannelRef.current = transactionChannel;
  }, [queueUpdate, handleTransactionInsert, cleanupChannels]);

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

    // Visibility change handler: reconnect when returning to app after idle
    // Browsers throttle background tabs, which breaks WebSocket heartbeats
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mountedRef.current) {
        // Reset retry state when user returns to app - fresh start
        retryCountRef.current = 0;
        gaveUpRef.current = false;

        // Check if connection is still alive
        if (!connectedAtRef.current) {
          console.info('[useRealtimeSync] Tab visible, reconnecting...');
          // Clear any pending retry timeout
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
          }
          // Reconnect immediately
          if (setupRealtimeRef.current) {
            setupRealtimeRef.current();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mountedRef.current = false;

      document.removeEventListener('visibilitychange', handleVisibilityChange);

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

      // Cleanup channels directly without calling cleanupChannels()
      // This avoids triggering CLOSED status which would increment retry counter
      if (channelRef.current) {
        channelRef.current.unsubscribe().catch(() => {});
        channelRef.current = null;
      }
      if (transactionChannelRef.current) {
        transactionChannelRef.current.unsubscribe().catch(() => {});
        transactionChannelRef.current = null;
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
