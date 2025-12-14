// useContactTracking.js v3.0
// Backend-only contact tracking hook
// No localStorage - single source of truth is contact_tracking table
//
// CHANGELOG:
// v3.0 (2025-12-13): Backend-only architecture
//   - Removed all localStorage logic
//   - Checkmark state = contact_tracking.status === 'pending'
//   - Manual toggle creates/clears backend records
//   - Uses campaign_type='manual' for manual checkmarks
//   - Uses is_customer_contactable() for eligibility (not just pending status)
// v2.0 (2025-12-08): Backend integration + outcome tracking
// v1.0 (2025-12-01): Initial localStorage-based implementation

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { api } from '../utils/apiService';

const CUSTOM_EVENT = 'contactTrackingUpdate';

/**
 * Hook for tracking contacted customers (backend-only)
 * Checkmark = customer has pending contact_tracking record
 *
 * @param {Object} [options] - Options
 * @param {Array} [options.customers] - Customer data (for auto-refresh on customer changes)
 * @param {string[]} [options.customerIds] - Specific customer IDs to track (optimization)
 * @returns {Object} Contact tracking utilities
 */
export function useContactTracking(options = {}) {
  const { customers, customerIds } = options;

  // Map of customer_id -> contact record for pending contacts
  const [pendingContacts, setPendingContacts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastFetchRef = useRef(0);
  const isMountedRef = useRef(true);

  // Load pending contacts from backend
  const loadPendingContacts = useCallback(async (force = false) => {
    // Debounce: don't fetch more than once per second unless forced
    const now = Date.now();
    if (!force && now - lastFetchRef.current < 1000) {
      return;
    }
    lastFetchRef.current = now;

    try {
      setError(null);
      const contacts = await api.contacts.getPending();

      if (!isMountedRef.current) return;

      // Convert to map for quick lookup
      const contactMap = {};
      contacts.forEach(c => {
        contactMap[c.customer_id] = c;
      });

      setPendingContacts(contactMap);
    } catch (err) {
      console.error('Failed to load pending contacts:', err);
      if (isMountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    isMountedRef.current = true;
    loadPendingContacts(true);

    return () => {
      isMountedRef.current = false;
    };
  }, [loadPendingContacts]);

  // Reload when customers change (to detect returns)
  useEffect(() => {
    if (customers && customers.length > 0 && !isLoading) {
      // Backend auto-detects returns via detect_customer_returns()
      // We just need to refresh our local state
      loadPendingContacts();
    }
  }, [customers, isLoading, loadPendingContacts]);

  // Listen for cross-component updates
  useEffect(() => {
    const handleUpdate = () => {
      loadPendingContacts(true);
    };

    window.addEventListener(CUSTOM_EVENT, handleUpdate);
    return () => window.removeEventListener(CUSTOM_EVENT, handleUpdate);
  }, [loadPendingContacts]);

  // Set of pending contact IDs for quick lookup
  const contactedIds = useMemo(() => {
    return new Set(Object.keys(pendingContacts));
  }, [pendingContacts]);

  /**
   * Check if a customer has a pending contact (shows checkmark)
   * @param {string} customerId - Customer doc/ID
   * @returns {boolean}
   */
  const isContacted = useCallback((customerId) => {
    if (!customerId) return false;
    return contactedIds.has(String(customerId));
  }, [contactedIds]);

  /**
   * Mark a customer as contacted (creates backend record)
   * Uses campaign_type='manual' for manual UI checkmarks
   *
   * @param {string} customerId - Customer doc/ID
   * @param {string} [method='manual'] - Contact method
   * @param {Object} [context] - Additional context
   * @param {string} [context.customerName] - Customer name
   * @param {string} [context.riskLevel] - Customer risk level
   * @param {string} [context.campaignId] - Campaign ID (null for manual)
   * @param {string} [context.campaignName] - Campaign name
   */
  const markContacted = useCallback(async (customerId, method = 'manual', context = {}) => {
    if (!customerId) return;

    const id = String(customerId);
    const {
      customerName = null,
      riskLevel = null,
      campaignId = null,
      campaignName = null
    } = context;

    // Optimistic update - show checkmark immediately
    const optimisticRecord = {
      customer_id: id,
      customer_name: customerName,
      contact_method: method,
      campaign_id: campaignId,
      campaign_name: campaignName || 'Contato Manual',
      campaign_type: campaignId ? null : 'manual', // 'manual' for UI checkmarks
      status: 'pending',
      contacted_at: new Date().toISOString()
    };

    setPendingContacts(prev => ({
      ...prev,
      [id]: optimisticRecord
    }));

    try {
      // Create backend record
      await api.contacts.create({
        customer_id: id,
        customer_name: customerName,
        risk_level: riskLevel,
        contact_method: method,
        campaign_id: campaignId,
        campaign_name: campaignName || 'Contato Manual',
        campaign_type: campaignId ? null : 'manual',
        status: 'pending'
      });

      // Notify other components
      window.dispatchEvent(new CustomEvent(CUSTOM_EVENT));
    } catch (err) {
      console.error('Failed to create contact record:', err);
      // Revert optimistic update on error
      setPendingContacts(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      throw err;
    }
  }, []);

  /**
   * Remove contacted status (marks as 'cleared' in backend)
   * @param {string} customerId - Customer doc/ID
   */
  const unmarkContacted = useCallback(async (customerId) => {
    if (!customerId) return;

    const id = String(customerId);

    // Optimistic update - remove checkmark immediately
    setPendingContacts(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });

    try {
      // Update backend - mark as cleared
      await api.contacts.clear(id);

      // Notify other components
      window.dispatchEvent(new CustomEvent(CUSTOM_EVENT));
    } catch (err) {
      console.error('Failed to clear contact status:', err);
      // Reload to restore correct state
      loadPendingContacts(true);
      throw err;
    }
  }, [loadPendingContacts]);

  /**
   * Toggle contact status for a customer
   * @param {string} customerId - Customer doc/ID
   * @param {string} [method='manual'] - Contact method if marking as contacted
   * @param {Object} [context] - Additional context for tracking
   * @returns {Promise<boolean>} - New contacted status
   */
  const toggleContacted = useCallback(async (customerId, method = 'manual', context = {}) => {
    if (!customerId) return false;

    const id = String(customerId);
    const wasContacted = contactedIds.has(id);

    if (wasContacted) {
      await unmarkContacted(id);
      return false;
    } else {
      await markContacted(id, method, context);
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
    return pendingContacts[String(customerId)] || null;
  }, [pendingContacts]);

  /**
   * Get count of contacted customers
   * @returns {number}
   */
  const getContactedCount = useCallback(() => {
    return Object.keys(pendingContacts).length;
  }, [pendingContacts]);

  /**
   * Refresh contact data from backend
   */
  const refresh = useCallback(() => {
    return loadPendingContacts(true);
  }, [loadPendingContacts]);

  return {
    isContacted,
    markContacted,
    unmarkContacted,
    toggleContacted,
    getContactInfo,
    getContactedCount,
    contactedIds,
    pendingContacts,
    isLoading,
    error,
    refresh
  };
}

export default useContactTracking;
