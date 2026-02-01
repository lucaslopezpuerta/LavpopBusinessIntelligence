// LongPressMenu.jsx v1.0 - REUSABLE ACTION SHEET FOR LONG-PRESS
// Renders native ActionSheet on Capacitor, glassmorphism bottom sheet on web
// Design System v5.1 compliant - Cosmic Precision
//
// FEATURES:
// - Native ActionSheet on Android/iOS (via @capacitor/action-sheet)
// - Glassmorphism bottom sheet on web with swipe-to-close
// - Staggered menu item entrance animations
// - Keyboard accessible (Arrow keys, Enter, Escape)
// - Reduced motion support
// - Dark/light mode
//
// USAGE:
// <LongPressMenu
//   isOpen={isOpen}
//   onClose={close}
//   title="Campaign Name"
//   actions={[
//     { id: 'duplicate', label: 'Duplicar', icon: Copy, onSelect: handleDuplicate },
//     { id: 'export', label: 'Exportar', icon: Download, onSelect: handleExport },
//     { id: 'delete', label: 'Excluir', icon: Trash2, color: 'danger', onSelect: handleDelete }
//   ]}
// />
//
// CHANGELOG:
// v1.0 (2026-01-31): Initial implementation
//   - Native ActionSheet integration via nativeActionSheet.js
//   - Web bottom sheet with MOBILE_SHEET animations
//   - Staggered item entrance via LONG_PRESS_MENU animations
//   - Full keyboard navigation

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import useReducedMotion from '../../hooks/useReducedMotion';
import { useSwipeToClose } from '../../hooks/useSwipeToClose';
import { useScrollLock } from '../../hooks/useScrollLock';
import { MOBILE_SHEET, LONG_PRESS_MENU, SPRING } from '../../constants/animations';
import { haptics } from '../../utils/haptics';
import { showActionSheet, isActionSheetSupported } from '../../utils/nativeActionSheet';
import { Capacitor } from '@capacitor/core';

/**
 * Long Press Menu Component
 *
 * @param {boolean} isOpen - Whether the menu is open
 * @param {Function} onClose - Callback to close the menu
 * @param {string} title - Optional menu title
 * @param {string} subtitle - Optional subtitle
 * @param {Array} actions - Menu actions
 * @param {string} actions[].id - Unique action ID
 * @param {string} actions[].label - Display label
 * @param {LucideIcon} actions[].icon - Optional Lucide icon component
 * @param {'default'|'danger'|'success'} actions[].color - Color variant
 * @param {Function} actions[].onSelect - Callback when selected
 * @param {boolean} actions[].disabled - Whether action is disabled
 */
const LongPressMenu = ({
  isOpen = false,
  onClose,
  title,
  subtitle,
  actions = []
}) => {
  const { isDark } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const menuRef = useRef(null);
  const firstActionRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Lock body scroll when open
  useScrollLock(isOpen);

  // Swipe-to-close for web
  const { handlers: swipeHandlers, style: swipeStyle, isDragging } = useSwipeToClose({
    onClose,
    threshold: 40,
    resistance: 0.5,
    disabled: !isOpen
  });

  // Handle native action sheet on Capacitor
  useEffect(() => {
    if (!isOpen || actions.length === 0) return;

    // Use native action sheet on mobile platforms
    if (Capacitor.isNativePlatform() && isActionSheetSupported()) {
      const showNative = async () => {
        const result = await showActionSheet({
          title: title || undefined,
          message: subtitle || undefined,
          options: [
            ...actions.map(action => ({
              title: action.label,
              style: action.color === 'danger' ? 'DESTRUCTIVE' : 'DEFAULT'
            })),
            { title: 'Cancelar', style: 'CANCEL' }
          ]
        });

        if (result.index >= 0 && result.index < actions.length) {
          const selectedAction = actions[result.index];
          if (!selectedAction.disabled) {
            haptics.light();
            selectedAction.onSelect?.();
          }
        }
        onClose?.();
      };

      showNative();
    }
  }, [isOpen, actions, title, subtitle, onClose]);

  // Focus first action when opened (web only)
  useEffect(() => {
    if (isOpen && !Capacitor.isNativePlatform() && firstActionRef.current) {
      const timer = setTimeout(() => {
        firstActionRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    const enabledActions = actions.filter(a => !a.disabled);
    const enabledCount = enabledActions.length;
    if (enabledCount === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => (prev + 1) % enabledCount);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => (prev - 1 + enabledCount) % enabledCount);
        break;
      case 'Escape':
        e.preventDefault();
        onClose?.();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        const action = enabledActions[focusedIndex];
        if (action) {
          haptics.light();
          action.onSelect?.();
          onClose?.();
        }
        break;
      default:
        break;
    }
  }, [actions, focusedIndex, onClose]);

  // Handle action click
  const handleActionClick = useCallback((action) => {
    if (action.disabled) return;
    haptics.light();
    action.onSelect?.();
    onClose?.();
  }, [onClose]);

  // Color classes by variant
  const getColorClasses = (color, disabled) => {
    if (disabled) {
      return isDark
        ? 'text-slate-500 bg-slate-800/50'
        : 'text-slate-400 bg-slate-100';
    }

    switch (color) {
      case 'danger':
        return isDark
          ? 'text-red-400 hover:bg-red-500/10 active:bg-red-500/20'
          : 'text-red-600 hover:bg-red-50 active:bg-red-100';
      case 'success':
        return isDark
          ? 'text-cosmic-green hover:bg-cosmic-green/10 active:bg-cosmic-green/20'
          : 'text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100';
      default:
        return isDark
          ? 'text-slate-200 hover:bg-white/5 active:bg-white/10'
          : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100';
    }
  };

  // Don't render web UI on native (handled by native action sheet)
  if (Capacitor.isNativePlatform()) {
    return null;
  }

  // Animation variants
  const containerVariants = prefersReducedMotion
    ? LONG_PRESS_MENU.CONTAINER_REDUCED
    : LONG_PRESS_MENU.CONTAINER;

  const itemVariants = prefersReducedMotion
    ? LONG_PRESS_MENU.ITEM_REDUCED
    : LONG_PRESS_MENU.ITEM;

  const sheetVariants = prefersReducedMotion
    ? MOBILE_SHEET.SLIDE_UP_REDUCED
    : MOBILE_SHEET.SLIDE_UP;

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="long-press-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Menu Sheet */}
          <motion.div
            ref={menuRef}
            key="long-press-menu"
            role="menu"
            aria-modal="true"
            aria-label={title ? `Ações para ${title}` : 'Menu de ações'}
            initial={sheetVariants.initial}
            animate={sheetVariants.animate}
            exit={sheetVariants.exit}
            style={isDragging ? swipeStyle : undefined}
            onKeyDown={handleKeyDown}
            {...swipeHandlers}
            data-long-press-menu
            className={`
              fixed bottom-0 left-0 right-0 z-[60]
              mx-2 mb-2 rounded-2xl
              overflow-hidden
              backdrop-blur-xl
              border
              ${isDark
                ? 'bg-space-dust/95 border-stellar-cyan/10'
                : 'bg-white/95 border-slate-200'
              }
              shadow-2xl
              touch-pan-y
            `}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div
                className={`
                  w-12 h-1.5 rounded-full
                  ${isDark ? 'bg-stellar-cyan/20' : 'bg-slate-300'}
                `}
              />
            </div>

            {/* Header */}
            {(title || subtitle) && (
              <div className="px-4 pb-3 border-b border-slate-200/10">
                {title && (
                  <h2
                    className={`
                      text-base font-semibold truncate
                      ${isDark ? 'text-white' : 'text-slate-900'}
                    `}
                  >
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p
                    className={`
                      text-sm mt-0.5 truncate
                      ${isDark ? 'text-slate-400' : 'text-slate-500'}
                    `}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="py-2"
            >
              {actions.map((action, index) => {
                const Icon = action.icon;
                const isDisabled = action.disabled;
                const isFocused = index === focusedIndex;

                return (
                  <motion.button
                    key={action.id}
                    ref={index === 0 ? firstActionRef : undefined}
                    variants={itemVariants}
                    role="menuitem"
                    tabIndex={isFocused ? 0 : -1}
                    disabled={isDisabled}
                    onClick={() => handleActionClick(action)}
                    onFocus={() => setFocusedIndex(index)}
                    className={`
                      w-full flex items-center gap-3
                      px-4 py-3
                      text-left text-sm font-medium
                      transition-colors duration-150
                      focus:outline-none
                      ${isFocused && !isDisabled ? (isDark ? 'ring-2 ring-inset ring-stellar-cyan/50' : 'ring-2 ring-inset ring-blue-500/50') : ''}
                      ${getColorClasses(action.color, isDisabled)}
                      ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    aria-disabled={isDisabled}
                  >
                    {Icon && (
                      <Icon
                        className="w-5 h-5 flex-shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    <span className="flex-1 truncate">{action.label}</span>
                  </motion.button>
                );
              })}
            </motion.div>

            {/* Cancel Button */}
            <div className="px-2 pb-2">
              <button
                onClick={onClose}
                className={`
                  w-full py-3 rounded-xl
                  text-sm font-semibold
                  transition-colors duration-150
                  ${isDark
                    ? 'text-stellar-cyan bg-stellar-cyan/10 hover:bg-stellar-cyan/20 active:bg-stellar-cyan/30'
                    : 'text-blue-600 bg-blue-50 hover:bg-blue-100 active:bg-blue-200'
                  }
                `}
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default LongPressMenu;
