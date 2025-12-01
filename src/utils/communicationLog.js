// communicationLog.js v1.0 - SHARED COMMUNICATION LOGGING
// Utility for logging customer communications across the app
// Used by CustomerProfileModal, CustomerListDrilldown, AtRiskCustomersTable, etc.
//
// CHANGELOG:
// v1.0 (2025-12-01): Initial implementation
//   - addCommunicationEntry: Add entry to customer's communication log
//   - getCommunicationLog: Get all entries for a customer
//   - Syncs with CustomerProfileModal's localStorage format

const STORAGE_PREFIX = 'comm_log_';

/**
 * Add a communication entry to a customer's log
 * @param {string} customerId - Customer document/ID
 * @param {string} method - Communication method: 'call', 'whatsapp', 'email', 'note'
 * @param {string} notes - Description of the communication
 * @returns {Object} The created entry
 */
export const addCommunicationEntry = (customerId, method, notes) => {
  if (!customerId) return null;

  const entry = {
    date: new Date().toISOString(),
    method,
    notes,
    timestamp: Date.now(),
  };

  // Get existing log
  const storageKey = `${STORAGE_PREFIX}${customerId}`;
  const existing = localStorage.getItem(storageKey);
  const log = existing ? JSON.parse(existing) : [];

  // Add new entry at the beginning
  const updated = [entry, ...log];

  // Save back to localStorage
  localStorage.setItem(storageKey, JSON.stringify(updated));

  // Dispatch custom event for same-window sync (if CustomerProfileModal is open)
  window.dispatchEvent(new CustomEvent('communicationLogUpdate', {
    detail: { customerId, entry }
  }));

  return entry;
};

/**
 * Get all communication entries for a customer
 * @param {string} customerId - Customer document/ID
 * @returns {Array} Communication log entries
 */
export const getCommunicationLog = (customerId) => {
  if (!customerId) return [];

  const storageKey = `${STORAGE_PREFIX}${customerId}`;
  const stored = localStorage.getItem(storageKey);
  return stored ? JSON.parse(stored) : [];
};

/**
 * Get default notes for a communication method
 * @param {string} method - Communication method
 * @returns {string} Default note text in Portuguese
 */
export const getDefaultNotes = (method) => {
  switch (method) {
    case 'call':
    case 'phone':
      return 'Ligação realizada';
    case 'whatsapp':
      return 'Mensagem WhatsApp enviada';
    case 'email':
      return 'Email enviado';
    default:
      return 'Contato realizado';
  }
};
