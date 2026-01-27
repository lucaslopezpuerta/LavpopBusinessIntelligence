// ToastContainer.jsx v1.0 - Portal container for toast notifications
// Renders toasts at top-right with proper stacking and animations
//
// CHANGELOG:
// v1.0 (2026-01-27): Initial implementation
//   - Portal rendering at document.body
//   - AnimatePresence for smooth enter/exit animations
//   - Stacked layout with proper spacing
//   - ARIA region for accessibility

import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import { useToast } from '../../contexts/ToastContext';
import Toast from './Toast';

const ToastContainer = () => {
  const { toasts, dismissToast } = useToast();

  // Don't render anything if no toasts
  if (toasts.length === 0) {
    return null;
  }

  return createPortal(
    <div
      className="fixed top-4 right-4 z-[80] flex flex-col gap-3 pointer-events-none"
      role="region"
      aria-label="Notificacoes"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onDismiss={dismissToast} />
          </div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
};

export default ToastContainer;
