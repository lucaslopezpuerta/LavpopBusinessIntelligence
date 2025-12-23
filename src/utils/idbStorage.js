/**
 * idbStorage.js v2.0 - CONNECTION SINGLETON
 * Lightweight wrapper for IndexedDB to replace localStorage
 * Allows storing large datasets (blobs, large strings) without quota limits
 *
 * CHANGELOG:
 * v2.0 (2025-12-23): Connection singleton pattern
 *   - Reuses single connection across all operations
 *   - Prevents connection pool exhaustion after long idle periods
 *   - Auto-reconnects if connection is closed
 *   - Cleans up on page unload
 * v1.0: Initial implementation
 */

const DB_NAME = 'LavpopBI_DB';
const DB_VERSION = 1;
const STORE_NAME = 'key_value_store';

// Singleton connection state
let dbInstance = null;
let connectionPromise = null;

/**
 * Check if the database connection is healthy
 * @param {IDBDatabase} db
 * @returns {boolean}
 */
const isConnectionHealthy = (db) => {
    try {
        // Check if db exists and has the expected object store
        return db && db.objectStoreNames && db.objectStoreNames.contains(STORE_NAME);
    } catch {
        return false;
    }
};

/**
 * Open or reuse the database connection (singleton)
 * @returns {Promise<IDBDatabase>}
 */
const openDB = () => {
    // Return existing healthy connection
    if (dbInstance && isConnectionHealthy(dbInstance)) {
        return Promise.resolve(dbInstance);
    }

    // Return pending connection promise if one is in progress
    if (connectionPromise) {
        return connectionPromise;
    }

    // Create new connection
    connectionPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = (event) => {
            dbInstance = event.target.result;

            // Handle unexpected connection close
            dbInstance.onclose = () => {
                console.warn('[idbStorage] Connection closed unexpectedly');
                dbInstance = null;
                connectionPromise = null;
            };

            // Handle version change (e.g., another tab upgraded the DB)
            dbInstance.onversionchange = () => {
                console.warn('[idbStorage] Database version changed, closing connection');
                dbInstance.close();
                dbInstance = null;
                connectionPromise = null;
            };

            connectionPromise = null;
            resolve(dbInstance);
        };

        request.onerror = (event) => {
            connectionPromise = null;
            dbInstance = null;
            reject(`IndexedDB error: ${event.target.errorCode}`);
        };
    });

    return connectionPromise;
};

// Clean up connection on page unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        if (dbInstance) {
            dbInstance.close();
            dbInstance = null;
        }
    });
}

/**
 * Get a value by key
 * @param {string} key 
 * @returns {Promise<any>}
 */
export const get = async (key) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
};

/**
 * Set a value by key
 * @param {string} key 
 * @param {any} value 
 * @returns {Promise<void>}
 */
export const set = async (key, value) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(value, key);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
};

/**
 * Delete a value by key
 * @param {string} key 
 * @returns {Promise<void>}
 */
export const del = async (key) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(key);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
};

/**
 * Clear all data in the store
 * @returns {Promise<void>}
 */
export const clear = async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
};

/**
 * Get all keys in the store
 * @returns {Promise<string[]>}
 */
export const keys = async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAllKeys();

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
};

export default { get, set, del, clear, keys };
