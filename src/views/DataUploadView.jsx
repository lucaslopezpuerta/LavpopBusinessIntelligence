// DataUploadView.jsx v2.1 - UNIFIED HEADER DESIGN
// View wrapper for the data upload functionality with history tab
//
// This view allows manual CSV uploads to Supabase:
//   - sales.csv: Transaction data
//   - customer.csv: Customer data
//
// Tabs:
//   - Upload: Drag & drop CSV import
//   - Historico: View past uploads from upload_history table
//
// Features:
//   - Cosmic Precision Design System v5.1 compliant
//   - Accessible tab navigation with ARIA roles
//   - Keyboard navigation support (Arrow keys, Home, End)
//   - Animated tab indicator
//   - Mobile-optimized layout
//
// CHANGELOG:
// v2.1 (2026-01-24): Unified header design
//   - Header now matches other views (stellar-cyan accent)
//   - Removed Quick Tips panel (info moved to DataUpload component)
//   - Cleaner, more consistent layout
// v2.0 (2026-01-24): Complete Cosmic Precision redesign
//   - Redesigned header with glassmorphism icon container
//   - Animated tab indicator with Framer Motion
//   - Added ARIA roles and keyboard navigation for accessibility
//   - Improved mobile responsiveness with larger touch targets
//   - Tab transitions with AnimatePresence
//   - Removed duplicate header from DataUpload child component
// v1.3 (2025-12-26): Mobile-friendly tab navigation
// v1.2 (2025-12-24): Added upload history tab
// v1.1 (2025-12-13): Pass onDataChange for auto-refresh after upload

import React, { useState, useCallback, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Clock, Shield } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import DataUpload from '../components/DataUpload';
import UploadHistoryTab from '../components/UploadHistoryTab';
const DataQualityPanel = lazy(() => import('../components/ui/DataQualityPanel'));

// Tab configuration for cleaner rendering
const TABS = [
  {
    id: 'upload',
    label: 'Upload',
    icon: Upload,
    description: 'Importar arquivos CSV'
  },
  {
    id: 'history',
    label: 'Histórico',
    icon: Clock,
    description: 'Ver uploads anteriores'
  },
  {
    id: 'quality',
    label: 'Qualidade',
    icon: Shield,
    description: 'Monitorar qualidade dos dados'
  }
];

const DataUploadView = ({ onDataChange }) => {
  // Theme context for Cosmic Precision styling
  const { isDark } = useTheme();

  const [activeTab, setActiveTab] = useState('upload');
  const [historyRefresh, setHistoryRefresh] = useState(0);

  // Refs for keyboard navigation
  const tabListRef = useRef(null);
  const tabRefs = useRef({});

  // Wrapper for onDataChange that also triggers history refresh
  const handleDataChange = useCallback((source) => {
    // Trigger history refresh
    setHistoryRefresh(prev => prev + 1);
    // Call original handler
    if (onDataChange) {
      onDataChange(source);
    }
  }, [onDataChange]);

  // Keyboard navigation handler for tabs
  const handleKeyDown = useCallback((e) => {
    const currentIndex = TABS.findIndex(tab => tab.id === activeTab);
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : TABS.length - 1;
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        newIndex = currentIndex < TABS.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = TABS.length - 1;
        break;
      default:
        return;
    }

    const newTab = TABS[newIndex];
    setActiveTab(newTab.id);
    tabRefs.current[newTab.id]?.focus();
  }, [activeTab]);

  // Get current tab index for indicator positioning
  const activeTabIndex = TABS.findIndex(tab => tab.id === activeTab);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header - Cosmic Precision Design v2.1 */}
      <header className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Icon Container - Glassmorphism */}
            <div
              className={`
                w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0
                ${isDark
                  ? 'bg-space-dust/70 border border-stellar-cyan/20'
                  : 'bg-white border border-stellar-blue/10 shadow-md'}
              `}
              style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            >
              <Upload className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? 'text-stellar-cyan' : 'text-stellar-blue'}`} />
            </div>
            {/* Title & Subtitle */}
            <div>
              <h1
                className="text-lg sm:text-xl font-bold tracking-wider"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                <span className="text-gradient-stellar">UPLOAD DE DADOS</span>
              </h1>
              <p className={`text-xs tracking-wide mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Importar dados de vendas e clientes
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation - Accessible with ARIA roles */}
      <div
        className={`
          relative p-1.5 rounded-xl
          ${isDark ? 'bg-space-dust/80' : 'bg-slate-100'}
        `}
        style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      >
        <div
          ref={tabListRef}
          role="tablist"
          aria-label="Secoes de upload"
          className="relative flex gap-1"
          onKeyDown={handleKeyDown}
        >
          {/* Animated Tab Indicator */}
          <motion.div
            className={`
              absolute top-0 bottom-0 rounded-lg
              ${isDark
                ? 'bg-space-nebula shadow-sm shadow-stellar-cyan/10'
                : 'bg-white shadow-md'}
            `}
            initial={false}
            animate={{
              left: `calc(${activeTabIndex * (100 / TABS.length)}% + 2px)`,
              width: `calc(${100 / TABS.length}% - 4px)`
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />

          {/* Tab Buttons */}
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                ref={el => tabRefs.current[tab.id] = el}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                id={`tab-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative z-10 flex-1 flex items-center justify-center gap-2
                  px-4 py-3 sm:py-2.5 rounded-lg
                  text-sm font-medium transition-colors duration-200
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan focus-visible:ring-offset-2
                  ${isDark ? 'focus-visible:ring-offset-space-dust' : 'focus-visible:ring-offset-slate-100'}
                  ${isActive
                    ? isDark
                      ? 'text-white'
                      : 'text-slate-900'
                    : isDark
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-500 hover:text-slate-700'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content with transitions */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === 'upload' && (
            <motion.div
              key="upload"
              id="tabpanel-upload"
              role="tabpanel"
              aria-labelledby="tab-upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <DataUpload onDataChange={handleDataChange} hideHeader />
            </motion.div>
          )}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              id="tabpanel-history"
              role="tabpanel"
              aria-labelledby="tab-history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <UploadHistoryTab refreshTrigger={historyRefresh} />
            </motion.div>
          )}
          {activeTab === 'quality' && (
            <motion.div
              key="quality"
              id="tabpanel-quality"
              role="tabpanel"
              aria-labelledby="tab-quality"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={<div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-stellar-cyan border-t-transparent rounded-full animate-spin" /></div>}>
                <DataQualityPanel />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DataUploadView;
