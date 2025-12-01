// useContactTracking.js v1.0
// Shared hook for tracking contacted customers across the app
// Persists to localStorage and syncs across components
//
// CHANGELOG:
// v1.0 (2025-12-01): Initial implementation
//   - localStorage persistence with weekly expiry
//   - Cross-component sync via storage events
//   - Custom event dispatch for same-window updates
//   - Functions: isContacted, markContacted, toggleContacted, clearExpired

import { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'lavpop_contacted_customers';
const CUSTOM_EVENT = 'contactTrackingUpdate';

// Entry expires after 7 days (one business week)
const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Get the current week identifier (ISO week)
 * Used to auto-clear contacts at the start of each week
 */
const getCurrentWeekId = () => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
};

/**
 * Load contacted customers from localStorage
 * Filters out expired entries
 */
const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};

    const data = JSON.parse(stored);
    const now = Date.now();

    // Filter out expired entries
    const filtered = {};
    Object.entries(data).forEach(([id, entry]) => {
      if (entry.timestamp && (now - entry.timestamp) < EXPIRY_MS) {
        filtered[id] = entry;
      }
    });

    return filtered;
  } catch (e) {
    console.warn('Failed to load contact tracking data:', e);
    return {};
  }
};

/**
 * Save contacted customers to localStorage
 */
const saveToStorage = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // Dispatch custom event for same-window updates
    window.dispatchEvent(new CustomEvent(CUSTOM_EVENT, { detail: data }));
  } catch (e) {
    console.warn('Failed to save contact tracking data:', e);
  }
};

/**
 * Hook for tracking contacted customers
 * Syncs across all components using this hook
 *
 * @returns {Object} Contact tracking utilities
 * @property {Function} isContacted - Check if customer was contacted this week
 * @property {Function} markContacted - Mark a customer as contacted
 * @property {Function} toggleContacted - Toggle contact status
 * @property {Function} getContactedCount - Get total contacted count
 * @property {Set} contactedIds - Set of currently contacted customer IDs
 */
export function useContactTracking() {
  const [contactedData, setContactedData] = useState(loadFromStorage);

  // Listen for storage changes (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY) {
        setContactedData(loadFromStorage());
      }
    };

    // Listen for custom events (same-window sync)
    const handleCustomEvent = (e) => {
      setContactedData(e.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(CUSTOM_EVENT, handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(CUSTOM_EVENT, handleCustomEvent);
    };
  }, []);

  // Set of contacted IDs for quick lookup
  const contactedIds = useMemo(() => {
    return new Set(Object.keys(contactedData));
  }, [contactedData]);

  /**
   * Check if a customer has been contacted
   * @param {string} customerId - Customer doc/ID
   * @returns {boolean}
   */
  const isContacted = useCallback((customerId) => {
    if (!customerId) return false;
    return contactedIds.has(String(customerId));
  }, [contactedIds]);

  /**
   * Mark a customer as contacted
   * @param {string} customerId - Customer doc/ID
   * @param {string} [method] - Contact method (phone, whatsapp, etc.)
   */
  const markContacted = useCallback((customerId, method = 'unknown') => {
    if (!customerId) return;

    const id = String(customerId);
    const newData = {
      ...contactedData,
      [id]: {
        timestamp: Date.now(),
        method,
        week: getCurrentWeekId()
      }
    };

    setContactedData(newData);
    saveToStorage(newData);
  }, [contactedData]);

  /**
   * Remove contacted status from a customer
   * @param {string} customerId - Customer doc/ID
   */
  const unmarkContacted = useCallback((customerId) => {
    if (!customerId) return;

    const id = String(customerId);
    const newData = { ...contactedData };
    delete newData[id];

    setContactedData(newData);
    saveToStorage(newData);
  }, [contactedData]);

  /**
   * Toggle contact status for a customer
   * @param {string} customerId - Customer doc/ID
   * @param {string} [method] - Contact method if marking as contacted
   * @returns {boolean} - New contacted status
   */
  const toggleContacted = useCallback((customerId, method = 'unknown') => {
    if (!customerId) return false;

    const id = String(customerId);
    const wasContacted = contactedIds.has(id);

    if (wasContacted) {
      unmarkContacted(id);
      return false;
    } else {
      markContacted(id, method);
      return true;
    }
  }, [contactedIds, markContacted, unmarkContacted]);

  /**
   * Get contact info for a customer
   * @param {string} customerId - Customer doc/ID
   * @returns {Object|null} Contact info or null
   */
  const getContactInfo = useCallback((customerId) => {
    if (!customerId) return null;
    return contactedData[String(customerId)] || null;
  }, [contactedData]);

  /**
   * Get count of contacted customers
   * @returns {number}
   */
  const getContactedCount = useCallback(() => {
    return Object.keys(contactedData).length;
  }, [contactedData]);

  /**
   * Clear all expired entries (manual cleanup)
   */
  const clearExpired = useCallback(() => {
    const now = Date.now();
    const filtered = {};

    Object.entries(contactedData).forEach(([id, entry]) => {
      if (entry.timestamp && (now - entry.timestamp) < EXPIRY_MS) {
        filtered[id] = entry;
      }
    });

    setContactedData(filtered);
    saveToStorage(filtered);
  }, [contactedData]);

  return {
    isContacted,
    markContacted,
    unmarkContacted,
    toggleContacted,
    getContactInfo,
    getContactedCount,
    clearExpired,
    contactedIds
  };
}

export default useContactTracking;
