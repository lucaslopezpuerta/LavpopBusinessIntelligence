// OfflineIndicator.jsx v1.0
// Banner component that shows when the user is offline
//
// FEATURES:
// - Detects online/offline status via navigator.onLine
// - Animated slide-in/out banner
// - Shows last sync time when offline
// - Auto-hides when back online
// - Dark mode support
//
// USAGE:
// <OfflineIndicator lastSyncTime={timestamp} />
//
// CHANGELOG:
// v1.0 (2025-12-18): Initial implementation

import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Format time for display (e.g., "há 5 minutos")
 */
const formatTimeAgo = (timestamp) => {
  if (!timestamp) return null;

  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return 'agora mesmo';
  if (minutes < 60) return `há ${minutes} min`;
  if (hours < 24) return `há ${hours}h`;
  return 'há mais de 24h';
};

/**
 * Offline indicator banner
 * @param {number} lastSyncTime - Timestamp of last successful data sync
 */
const OfflineIndicator = ({ lastSyncTime }) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Keep banner visible briefly to show reconnection
      setTimeout(() => setShowBanner(false), 2000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className={`
            fixed top-0 inset-x-0 z-50
            safe-area-top
            ${isOffline
              ? 'bg-amber-500 dark:bg-amber-600'
              : 'bg-green-500 dark:bg-green-600'
            }
          `}
        >
          <div className="flex items-center justify-center gap-2 px-4 py-2 text-white">
            {isOffline ? (
              <>
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Você está offline
                </span>
                {lastSyncTime && (
                  <span className="text-sm opacity-90">
                    • Última sincronização: {formatTimeAgo(lastSyncTime)}
                  </span>
                )}
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">
                  Reconectado! Sincronizando...
                </span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;
