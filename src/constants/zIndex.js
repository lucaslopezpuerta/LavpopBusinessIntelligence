// zIndex.js v1.1 - EXTENDED LAYERS
// Centralized z-index management for consistent layering
//
// CHANGELOG:
// v1.1 (2026-01-31): Extended z-index layers
//   - Added TOOLTIP (90) for floating tooltips and popovers
//   - Added PRIORITY_OVERLAY (95) for data visualization overlays
//   - Added REALTIME_INDICATOR (100) for persistent status indicators
//   - Consolidates arbitrary z-[9999] values to defined layers
// v1.0 (2025-12-16): Initial implementation
//   - Semantic z-index layers for modals, dropdowns, tooltips
//   - Prevents z-index conflicts across components
//   - Single source of truth for stacking order

/**
 * Z-Index Layer System
 *
 * Usage:
 *   import { Z_INDEX, Z_CLASS } from '../constants/zIndex';
 *   className={`... ${Z_CLASS.TOOLTIP}`}
 *   // or
 *   className={`... z-[${Z_INDEX.MODAL_PRIMARY}]`}
 *
 * Stacking Order (lowest to highest):
 *   DROPDOWN (40) < MODAL_PRIMARY (50) < MODAL_CHILD (60) < ALERT (70)
 *   < TOAST (80) < TOOLTIP (90) < PRIORITY_OVERLAY (95) < REALTIME_INDICATOR (100)
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

  // Floating tooltips (above modals for visibility)
  TOOLTIP: 90,

  // Data visualization overlays (PriorityMatrix, charts)
  PRIORITY_OVERLAY: 95,

  // Persistent realtime indicators (always visible)
  REALTIME_INDICATOR: 100,
};

// Tailwind class mappings for convenience
export const Z_CLASS = {
  DROPDOWN: 'z-40',
  MODAL_PRIMARY: 'z-50',
  MODAL_CHILD: 'z-[60]',
  ALERT: 'z-[70]',
  TOAST: 'z-[80]',
  TOOLTIP: 'z-[90]',
  PRIORITY_OVERLAY: 'z-[95]',
  REALTIME_INDICATOR: 'z-[100]',
};

export default Z_INDEX;
