// zIndex.js v1.0
// Centralized z-index management for consistent layering
//
// CHANGELOG:
// v1.0 (2025-12-16): Initial implementation
//   - Semantic z-index layers for modals, dropdowns, tooltips
//   - Prevents z-index conflicts across components
//   - Single source of truth for stacking order

/**
 * Z-Index Layer System
 *
 * Usage:
 *   import { Z_INDEX } from '../constants/zIndex';
 *   className={`... z-[${Z_INDEX.MODAL_PRIMARY}]`}
 *
 * Stacking Order (lowest to highest):
 *   DROPDOWN (40) < MODAL_PRIMARY (50) < MODAL_CHILD (60) < ALERT (70) < TOAST (80)
 */

export const Z_INDEX = {
  // Dropdowns, popovers, select menus
  DROPDOWN: 40,

  // Primary modals (CustomerSegmentModal, NewCampaignModal, etc.)
  MODAL_PRIMARY: 50,

  // Child modals opened from within another modal (CustomerProfileModal)
  MODAL_CHILD: 60,

  // Alerts, confirmations, critical dialogs
  ALERT: 70,

  // Toast notifications
  TOAST: 80,
};

// Tailwind class mappings for convenience
export const Z_CLASS = {
  DROPDOWN: 'z-40',
  MODAL_PRIMARY: 'z-50',
  MODAL_CHILD: 'z-[60]',
  ALERT: 'z-[70]',
  TOAST: 'z-[80]',
};

export default Z_INDEX;
