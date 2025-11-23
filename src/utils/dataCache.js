// dataCache.js v1.0 - LOCAL STORAGE CACHING
// ✅ Cache CSV data with timestamp
// ✅ Configurable cache duration
// ✅ Cache invalidation support
// ✅ Fallback to fetch if cache is stale
//
// CHANGELOG:
// v1.0 (2025-11-23): Initial implementation

const CACHE_PREFIX = 'lavpop_data_';
const DEFAULT_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours (data updates daily)

/**
 * Get data from cache
 * @param {string} key - Cache key
 * @param {number} maxAge - Maximum age in milliseconds (default: 5 minutes)
 * @returns {any|null} - Cached data or null if not found/expired
 */
export const getCachedData = (key, maxAge = DEFAULT_CACHE_DURATION) => {
    try {
        const cacheKey = `${CACHE_PREFIX}${key}`;
        const cached = localStorage.getItem(cacheKey);

        if (!cached) {
            return null;
        }

        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;

        // Check if cache is still valid
        if (age < maxAge) {
            console.log(`✅ Cache HIT for ${key} (age: ${Math.round(age / 1000)}s)`);
            return data;
        }

        // Cache is stale, remove it
        console.log(`⏰ Cache EXPIRED for ${key} (age: ${Math.round(age / 1000)}s)`);
        localStorage.removeItem(cacheKey);
        return null;
    } catch (error) {
        console.error('Error reading from cache:', error);
        return null;
    }
};

/**
 * Save data to cache
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 */
export const setCachedData = (key, data) => {
    try {
        const cacheKey = `${CACHE_PREFIX}${key}`;
        const cacheData = {
            data,
            timestamp: Date.now(),
        };

        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        console.log(`💾 Cached data for ${key}`);
    } catch (error) {
        console.error('Error writing to cache:', error);
        // If localStorage is full, clear old cache entries
        if (error.name === 'QuotaExceededError') {
            clearAllCache();
            // Try again
            try {
                const cacheKey = `${CACHE_PREFIX}${key}`;
                const cacheData = {
                    data,
                    timestamp: Date.now(),
                };
                localStorage.setItem(cacheKey, JSON.stringify(cacheData));
            } catch (retryError) {
                console.error('Still cannot write to cache after clearing:', retryError);
            }
        }
    }
};

/**
 * Invalidate a specific cache entry
 * @param {string} key - Cache key to invalidate
 */
export const invalidateCache = (key) => {
    try {
        const cacheKey = `${CACHE_PREFIX}${key}`;
        localStorage.removeItem(cacheKey);
        console.log(`🗑️ Invalidated cache for ${key}`);
    } catch (error) {
        console.error('Error invalidating cache:', error);
    }
};

/**
 * Clear all Lavpop cache entries
 */
export const clearAllCache = () => {
    try {
        const keysToRemove = [];

        // Find all Lavpop cache keys
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                keysToRemove.push(key);
            }
        }

        // Remove them
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`🧹 Cleared ${keysToRemove.length} cache entries`);
    } catch (error) {
        console.error('Error clearing cache:', error);
    }
};

/**
 * Get cache statistics
 * @returns {object} - Cache statistics
 */
export const getCacheStats = () => {
    try {
        const stats = {
            totalEntries: 0,
            totalSize: 0,
            entries: [],
        };

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                const value = localStorage.getItem(key);
                const size = new Blob([value]).size;
                const { timestamp } = JSON.parse(value);
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
