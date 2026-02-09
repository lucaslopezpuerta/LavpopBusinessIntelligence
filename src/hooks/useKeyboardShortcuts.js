// useKeyboardShortcuts.js v1.0 - Global keyboard shortcuts
// Provides Ctrl+1-7 view navigation, Ctrl+R refresh, Ctrl+E export
//
// USAGE:
// useKeyboardShortcuts({ onNavigate, onRefresh });
//
// SHORTCUTS:
// Ctrl+1: Dashboard
// Ctrl+2: Customers
// Ctrl+3: Campaigns
// Ctrl+4: Intelligence
// Ctrl+5: Operations
// Ctrl+6: Social Media
// Ctrl+7: Insights
// Ctrl+R: Refresh data (prevents browser refresh)
//
// CHANGELOG:
// v1.0 (2026-02-09): Initial implementation

import { useEffect, useCallback } from 'react';

// Tab ID mapping for Ctrl+number shortcuts (matches NavigationContext tab IDs)
const TAB_MAP = {
  '1': 'dashboard',
  '2': 'customers',
  '3': 'campaigns',
  '4': 'intelligence',
  '5': 'operations',
  '6': 'social',
  '7': 'insights',
};

/**
 * Global keyboard shortcuts hook
 * @param {Object} options
 * @param {Function} options.onNavigate - React Router navigate function
 * @param {Function} options.onRefresh - Data refresh callback
 */
export function useKeyboardShortcuts({ onNavigate, onRefresh } = {}) {
  const handleKeyDown = useCallback((e) => {
    // Only respond to Ctrl/Cmd + key combos
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    if (!isCtrlOrCmd) return;

    // Ignore when focused on input elements
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) {
      return;
    }

    // Ctrl+1-7: Navigate to view
    if (TAB_MAP[e.key] && onNavigate) {
      e.preventDefault();
      onNavigate(TAB_MAP[e.key]);
      return;
    }

    // Ctrl+R: Refresh data (override browser refresh)
    if (e.key === 'r' && onRefresh) {
      e.preventDefault();
      onRefresh();
      return;
    }
  }, [onNavigate, onRefresh]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export default useKeyboardShortcuts;
