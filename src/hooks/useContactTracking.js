// useContactTracking.js v2.0
// Shared hook for tracking contacted customers across the app
// Now with backend support and campaign effectiveness tracking
//
// CHANGELOG:
// v2.0 (2025-12-08): Backend integration + outcome tracking
//   - Uses contactTrackingService for backend persistence
//   - Tracks campaign context for attribution
//   - Supports outcome tracking (returned, expired, cleared)
//   - Auto-detect returns when customer data changes
// v1.0 (2025-12-01): Initial implementation
//   - localStorage persistence with weekly expiry
//   - Cross-component sync via storage events

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  createContactRecord,
  getAllPendingContacts,
  clearContactStatus,
  autoDetectReturns,
  expireOldContacts
} from '../utils/contactTrackingService';

const STORAGE_KEY = 'lavpop_contacted_customers';
const CUSTOM_EVENT = 'contactTrackingUpdate';

// Entry expires after 7 days (one business week)
const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Get the current week identifier (ISO week)
 */
const getCurrentWeekId = () => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
};

/**
 * Load contacted customers from localStorage (for immediate UI)
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
 * Hook for tracking contacted customers with campaign effectiveness
 * @param {Object} [options] - Options
 * @param {Array} [options.customers] - Customer data for auto-detecting returns
 * @returns {Object} Contact tracking utilities
 */
export function useContactTracking(options = {}) {
  const { customers } = options;
  const [contactedData, setContactedData] = useState(loadFromStorage);
  const [isLoading, setIsLoading] = useState(true);
  const [backendData, setBackendData] = useState({});
  const hasLoadedBackend = useRef(false);

  // Load from backend on mount
  useEffect(() => {
    const loadBackendData = async () => {
      try {
        const pending = await getAllPendingContacts();
        setBackendData(pending);

        // Merge backend data into local state
        const merged = { ...contactedData };
        Object.entries(pending).forEach(([id, record]) => {
          if (!merged[id]) {
            merged[id] = {
              timestamp: new Date(record.contacted_at).getTime(),
              method: record.contact_method,
              week: getCurrentWeekId(),
              campaignId: record.campaign_id,
              campaignName: record.campaign_name,
              riskLevel: record.risk_level
            };
          }
        });

        setContactedData(merged);
        saveToStorage(merged);
        hasLoadedBackend.current = true;
      } catch (error) {
        console.warn('Failed to load backend contact data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBackendData();
    // Run expiration on load
    expireOldContacts().catch(() => {});
  }, []);

  // Auto-detect returns when customer data changes
  useEffect(() => {
    if (customers && customers.length > 0 && hasLoadedBackend.current) {
      autoDetectReturns(customers).then(result => {
        if (result.updated > 0) {
          console.log(`Auto-detected ${result.updated} customer returns`);
          // Reload backend data
          getAllPendingContacts().then(pending => {
            setBackendData(pending);
            // Update local state - remove customers who returned
            const newData = { ...contactedData };
            Object.keys(newData).forEach(id => {
              if (!pending[id]) {
                delete newData[id];
              }
            });
            setContactedData(newData);
            saveToStorage(newData);
          });
        }
      }).catch(() => {});
    }
  }, [customers]);

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
   * Mark a customer as contacted with full tracking
   * @param {string} customerId - Customer doc/ID
   * @param {string} [method] - Contact method (phone, whatsapp, etc.)
   * @param {Object} [context] - Additional context
   * @param {string} [context.customerName] - Customer name
   * @param {string} [context.riskLevel] - Customer risk level
   * @param {string} [context.campaignId] - Campaign ID if from campaign
   * @param {string} [context.campaignName] - Campaign name
   */
  const markContacted = useCallback(async (customerId, method = 'unknown', context = {}) => {
    if (!customerId) return;

    const id = String(customerId);
    const {
      customerName = null,
      riskLevel = null,
      campaignId = null,
      campaignName = null
    } = context;

    // Update local state immediately for UI responsiveness
    const newData = {
      ...contactedData,
      [id]: {
        timestamp: Date.now(),
        method,
        week: getCurrentWeekId(),
        campaignId,
        campaignName,
        riskLevel
      }
    };

    setContactedData(newData);
    saveToStorage(newData);

    // Save to backend asynchronously
    try {
      await createContactRecord({
        customerId: id,
        customerName,
        riskLevel,
        contactMethod: method,
        campaignId,
        campaignName
      });
    } catch (error) {
      console.warn('Failed to save contact to backend:', error);
    }
  }, [contactedData]);

  /**
   * Remove contacted status from a customer
   * @param {string} customerId - Customer doc/ID
   */
  const unmarkContacted = useCallback(async (customerId) => {
    if (!customerId) return;

    const id = String(customerId);
    const newData = { ...contactedData };
    delete newData[id];

    setContactedData(newData);
    saveToStorage(newData);

    // Update backend
    try {
      await clearContactStatus(id);
    } catch (error) {
      console.warn('Failed to clear contact in backend:', error);
    }
  }, [contactedData]);

  /**
   * Toggle contact status for a customer
   * @param {string} customerId - Customer doc/ID
   * @param {string} [method] - Contact method if marking as contacted
   * @param {Object} [context] - Additional context for tracking
   * @returns {boolean} - New contacted status
   */
  const toggleContacted = useCallback((customerId, method = 'unknown', context = {}) => {
    if (!customerId) return false;

    const id = String(customerId);
    const wasContacted = contactedIds.has(id);

    if (wasContacted) {
      unmarkContacted(id);
      return false;
    } else {
      markContacted(id, method, context);
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
  const clearExpired = useCallback(async () => {
    const now = Date.now();
    const filtered = {};

    Object.entries(contactedData).forEach(([id, entry]) => {
      if (entry.timestamp && (now - entry.timestamp) < EXPIRY_MS) {
        filtered[id] = entry;
      }
    });

    setContactedData(filtered);
    saveToStorage(filtered);

    // Also expire in backend
    await expireOldContacts();
  }, [contactedData]);

  return {
    isContacted,
    markContacted,
    unmarkContacted,
    toggleContacted,
    getContactInfo,
    getContactedCount,
    clearExpired,
    contactedIds,
    isLoading
  };
}

export default useContactTracking;
