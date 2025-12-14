/**
 * Shared Supabase client singleton
 *
 * Prevents "Multiple GoTrueClient instances" warning by ensuring
 * only one Supabase client exists across the entire app.
 *
 * Used by:
 * - supabaseLoader.js (data fetching)
 * - useRealtimeSync.js (realtime subscriptions)
 * - Any future modules needing Supabase access
 */

let supabaseClient = null;
let initPromise = null;

/**
 * Get the shared Supabase client instance
 * Lazy-loads the client on first call
 * @returns {Promise<import('@supabase/supabase-js').SupabaseClient | null>}
 */
export async function getSupabaseClient() {
  // Return existing client if already initialized
  if (supabaseClient) {
    return supabaseClient;
  }

  // If initialization is in progress, wait for it
  if (initPromise) {
    return initPromise;
  }

  // Initialize the client
  initPromise = (async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('[SupabaseClient] Credentials not configured');
      return null;
    }

    const { createClient } = await import('@supabase/supabase-js');
    supabaseClient = createClient(supabaseUrl, supabaseKey);

    console.log('[SupabaseClient] Initialized');
    return supabaseClient;
  })();

  return initPromise;
}

export default getSupabaseClient;
