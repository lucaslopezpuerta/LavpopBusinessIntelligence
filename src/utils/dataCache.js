// dataCache.js v2.2 - ERROR EVENT DISPATCH
// ✅ Cache CSV data with timestamp
// ✅ Configurable cache duration
// ✅ Cache invalidation support
// ✅ Fallback to fetch if cache is stale
// ✅ Uses IndexedDB to avoid QuotaExceededError
// ✅ Dispatches cacheError events for monitoring/recovery
//
// CHANGELOG:
// v2.2 (2025-12-23): Error event dispatch
//   - Dispatches 'cacheError' custom event on cache read/write failures
//   - Enables App.jsx to listen and trigger recovery
// v2.1 (2025-12-23): Converted debug logs to logger utility
// v2.0 (2025-11-23): Migrated to IndexedDB
// v1.0 (2025-11-23): Initial implementation (localStorage)

import idb from './idbStorage';
import { logger } from './logger';

const CACHE_PREFIX = 'lavpop_data_';
const DEFAULT_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours (data updates daily)

/**
 * Get data from cache
 * @param {string} key - Cache key
 * @param {number} maxAge - Maximum age in milliseconds (default: 24 hours)
 * @returns {Promise<any|null>} - Cached data or null if not found/expired
 */
export const getCachedData = async (key, maxAge = DEFAULT_CACHE_DURATION) => {
    try {
        const cacheKey = `${CACHE_PREFIX}${key}`;
        const cached = await idb.get(cacheKey);

        if (!cached) {
            return null;
        }

        const { data, timestamp } = cached;
        const age = Date.now() - timestamp;

        // Check if cache is still valid
        if (age < maxAge) {
            logger.debug('Cache', 'HIT', { key, ageSeconds: Math.round(age / 1000) });
            return data;
        }

        // Cache is stale, remove it
        logger.debug('Cache', 'EXPIRED', { key, ageSeconds: Math.round(age / 1000) });
        await idb.del(cacheKey);
        return null;
    } catch (error) {
        console.error('Error reading from cache:', error);
        // Dispatch error event for monitoring/recovery
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('cacheError', {
                detail: { operation: 'read', key, error: error.message || String(error) }
            }));
        }
        return null;
    }
};

/**
 * Save data to cache
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @returns {Promise<void>}
 */
export const setCachedData = async (key, data) => {
    try {
        const cacheKey = `${CACHE_PREFIX}${key}`;
        const cacheData = {
            data,
            timestamp: Date.now(),
        };

        await idb.set(cacheKey, cacheData);
        logger.debug('Cache', 'SET', { key });
    } catch (error) {
        console.error('Error writing to cache:', error);
        // Dispatch error event for monitoring/recovery
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('cacheError', {
                detail: { operation: 'write', key, error: error.message || String(error) }
            }));
        }
    }
};

/**
 * Invalidate a specific cache entry
 * @param {string} key - Cache key to invalidate
 * @returns {Promise<void>}
 */
export const invalidateCache = async (key) => {
    try {
        const cacheKey = `${CACHE_PREFIX}${key}`;
        await idb.del(cacheKey);
        logger.debug('Cache', 'INVALIDATE', { key });
    } catch (error) {
        console.error('Error invalidating cache:', error);
    }
};

/**
 * Clear all Lavpop cache entries
 * @returns {Promise<void>}
 */
export const clearAllCache = async () => {
    try {
        const allKeys = await idb.keys();
        const keysToRemove = allKeys.filter(key => key.startsWith(CACHE_PREFIX));

        // Remove them
        await Promise.all(keysToRemove.map(key => idb.del(key)));
        logger.debug('Cache', 'CLEAR', { entriesCleared: keysToRemove.length });
    } catch (error) {
        console.error('Error clearing cache:', error);
    }
};

/**
 * Get cache statistics
 * @returns {Promise<object>} - Cache statistics
 */
export const getCacheStats = async () => {
    try {
        const stats = {
            totalEntries: 0,
            totalSize: 0, // Size estimation is harder with IDB, might skip or estimate
            entries: [],
        };

        const allKeys = await idb.keys();

        for (const key of allKeys) {
            if (key.startsWith(CACHE_PREFIX)) {
                const value = await idb.get(key);
                // Rough size estimation
                const size = JSON.stringify(value).length;
                const { timestamp } = value;
                const age = Date.now() - timestamp;

                stats.totalEntries++;
                stats.totalSize += size;
                stats.entries.push({
                    key: key.replace(CACHE_PREFIX, ''),
                    size,
                    age: Math.round(age / 1000), // in seconds
                    timestamp: new Date(timestamp).toLocaleString(),
                });
            }
        }

        return stats;
    } catch (error) {
        console.error('Error getting cache stats:', error);
        return null;
    }
};
