// KeyboardHints.jsx v1.0 - KEYBOARD SHORTCUT DISCOVERY
// Shows available keyboard shortcuts in a tooltip/popover
//
// FEATURES:
// - Shows all navigation shortcuts (1-9)
// - Shows settings shortcut (,)
// - Hidden on mobile (keyboard shortcuts not applicable)
// - Accessible with aria labels
//
// CHANGELOG:
// v1.0 (2025-12-22): Initial implementation

import React, { useState } from 'react';
import { Keyboard, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SHORTCUTS = [
  { key: '1', label: 'Dashboard' },
  { key: '2', label: 'Clientes' },
  { key: '3', label: 'Diretório' },
  { key: '4', label: 'Campanhas' },
  { key: '5', label: 'Redes Sociais' },
  { key: '6', label: 'Clima' },
  { key: '7', label: 'Inteligência' },
  { key: '8', label: 'Operações' },
  { key: '9', label: 'Importar' },
  { key: ',', label: 'Configurações' },
];

const KeyboardHints = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative hidden lg:block">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        title="Atalhos de Teclado"
        aria-label="Atalhos de teclado"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Keyboard className="w-5 h-5" />
      </button>

      {/* Popover */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Popover Content */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
              role="dialog"
              aria-label="Atalhos de teclado"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-lavpop-blue" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Atalhos de Teclado
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </button>
              </div>

              {/* Shortcuts List */}
              <div className="p-2 max-h-80 overflow-y-auto">
                <div className="grid gap-1">
                  {SHORTCUTS.map(({ key, label }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        {label}
                      </span>
                      <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-xs font-mono font-semibold text-slate-700 dark:text-slate-200 shadow-sm">
                        {key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-200 dark:border-slate-700">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
                  Pressione a tecla para navegar
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KeyboardHints;
