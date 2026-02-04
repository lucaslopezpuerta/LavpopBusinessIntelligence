// src/utils/deduplicateCustomers.js
// Robust duplicate phone handling for WhatChimp sync
//
// When multiple customers share the same phone number, this utility:
// 1. Detects duplicates before syncing
// 2. Picks primary customer (highest transaction_count)
// 3. Returns list of duplicates for logging/monitoring
//
// Usage:
//   const { customers, duplicates } = deduplicateByPhone(customerList);

/**
 * Deduplicate customers by normalized_phone, keeping the primary customer.
 * Primary = customer with highest transaction_count (most activity).
 *
 * @param {Array} customers - Array of customer objects from customer_summary
 * @returns {Object} { customers: Array, duplicates: Array }
 */
function deduplicateByPhone(customers) {
  const phoneMap = new Map();
  const duplicates = [];

  customers.forEach(customer => {
    const phone = customer.normalized_phone;
    if (!phone) return;

    if (!phoneMap.has(phone)) {
      phoneMap.set(phone, customer);
    } else {
      const existing = phoneMap.get(phone);
      // Keep customer with more transactions (more active = primary)
      const existingTxns = existing.transaction_count || 0;
      const currentTxns = customer.transaction_count || 0;

      if (currentTxns > existingTxns) {
        // Current customer is primary, existing becomes secondary
        duplicates.push({
          phone,
          kept: { doc: customer.doc, nome: customer.nome, txns: currentTxns },
          skipped: { doc: existing.doc, nome: existing.nome, txns: existingTxns }
        });
        phoneMap.set(phone, customer);
      } else {
        // Existing customer remains primary, current is secondary
        duplicates.push({
          phone,
          kept: { doc: existing.doc, nome: existing.nome, txns: existingTxns },
          skipped: { doc: customer.doc, nome: customer.nome, txns: currentTxns }
        });
      }
    }
  });

  return {
    customers: Array.from(phoneMap.values()),
    duplicates
  };
}

// Support both ESM and CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { deduplicateByPhone };
}

export { deduplicateByPhone };
