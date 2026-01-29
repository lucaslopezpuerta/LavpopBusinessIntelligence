// nativeActionSheet.js v1.0
// Native action sheet utility with Capacitor integration
//
// FEATURES:
// - Native action sheet on Android/iOS (Capacitor)
// - Web fallback using custom modal (for browser testing)
// - Pre-built action sheets for common customer actions
// - Async/await API
//
// USAGE:
// import { showCustomerActions } from '../utils/nativeActionSheet';
// const action = await showCustomerActions(customer);
// if (action === 'profile') { ... }
//
// CHANGELOG:
// v1.0 (2026-01-28): Initial implementation

import { Capacitor } from '@capacitor/core';

// Lazy-load ActionSheet to avoid bundle bloat on web
let ActionSheetModule = null;

/**
 * Check if running on native platform
 */
const isNative = () => {
  return Capacitor.isNativePlatform();
};

/**
 * Get the Capacitor ActionSheet module (lazy-loaded)
 */
const getActionSheet = async () => {
  if (!ActionSheetModule && isNative()) {
    try {
      ActionSheetModule = await import('@capacitor/action-sheet');
    } catch (e) {
      ActionSheetModule = null;
    }
  }
  return ActionSheetModule;
};

/**
 * Show a native action sheet with options
 * @param {Object} options - Action sheet options
 * @param {string} options.title - Title of the action sheet
 * @param {string} options.message - Optional message
 * @param {Array<{title: string, style?: 'DEFAULT'|'DESTRUCTIVE'|'CANCEL'}>} options.options - Action options
 * @returns {Promise<{action: string|null, index: number}>} - Selected action title and index, or null if cancelled
 */
export const showActionSheet = async ({ title, message, options }) => {
  if (isNative()) {
    const module = await getActionSheet();
    if (module?.ActionSheet) {
      try {
        const result = await module.ActionSheet.showActions({
          title,
          message,
          options: options.map(opt => ({
            title: opt.title,
            style: opt.style === 'DESTRUCTIVE'
              ? module.ActionSheetButtonStyle.Destructive
              : opt.style === 'CANCEL'
                ? module.ActionSheetButtonStyle.Cancel
                : module.ActionSheetButtonStyle.Default
          }))
        });

        // Return the selected option (index-based)
        if (result.index >= 0 && result.index < options.length) {
          return {
            action: options[result.index].title,
            index: result.index
          };
        }
        return { action: null, index: -1 };
      } catch (e) {
        // Fall through to web fallback
      }
    }
  }

  // Web fallback - use browser confirm for simple yes/no
  // For more complex cases, the component should provide its own UI
  return new Promise((resolve) => {
    // Simple fallback: show first non-cancel option as confirm
    const mainOption = options.find(opt => opt.style !== 'CANCEL');
    if (mainOption && window.confirm(`${title}\n\n${mainOption.title}?`)) {
      const index = options.indexOf(mainOption);
      resolve({ action: mainOption.title, index });
    } else {
      resolve({ action: null, index: -1 });
    }
  });
};

/**
 * Show customer action sheet with standard options
 * @param {Object} customer - Customer object with name, phone, etc.
 * @param {Object} options - Additional options
 * @param {boolean} options.canWhatsApp - Whether WhatsApp is available
 * @param {boolean} options.canCall - Whether calling is available
 * @param {boolean} options.isBlacklisted - Whether customer is blacklisted
 * @returns {Promise<'profile'|'whatsapp'|'call'|null>} - Selected action or null
 */
export const showCustomerActions = async (customer, { canWhatsApp = false, canCall = false, isBlacklisted = false } = {}) => {
  const actions = [
    { title: 'Ver Perfil', id: 'profile' }
  ];

  if (!isBlacklisted) {
    if (canWhatsApp) {
      actions.push({ title: 'WhatsApp', id: 'whatsapp' });
    }
    if (canCall) {
      actions.push({ title: 'Ligar', id: 'call' });
    }
  }

  actions.push({ title: 'Cancelar', style: 'CANCEL', id: 'cancel' });

  const result = await showActionSheet({
    title: customer.name || 'Cliente',
    message: isBlacklisted ? 'Cliente bloqueado' : undefined,
    options: actions
  });

  // Map index back to action id
  if (result.index >= 0 && result.index < actions.length) {
    const selectedAction = actions[result.index];
    return selectedAction.id === 'cancel' ? null : selectedAction.id;
  }
  return null;
};

/**
 * Check if native action sheets are supported
 */
export const isActionSheetSupported = () => {
  return isNative();
};

export default {
  showActionSheet,
  showCustomerActions,
  isActionSheetSupported
};
