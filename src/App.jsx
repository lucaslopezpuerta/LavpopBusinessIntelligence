// App.jsx v7.2 - DATA FRESHNESS FOOTER
// ✅ Added minimalist icon sidebar with hover expansion
// ✅ Compact top bar with widgets (60px to match sidebar)
// ✅ Mobile drawer with backdrop overlay
// ✅ Maximized horizontal space for data visualizations
// ✅ Integrated Lavpop logo in loading and error screens
// ✅ Mobile breadcrumb shows current tab
// ✅ Smart data refresh with visibility detection
// ✅ Auto-refresh every 10 minutes when active
// ✅ Separate Directory route for customer browsing
// ✅ Data freshness footer with CSV upload, sync time, build version
//
// CHANGELOG:
// v7.2 (2025-12-16): Data freshness footer
//   - Shows CSV upload date (last imported_at from transactions)
//   - Shows frontend sync time (when data was last refreshed)
//   - Shows build timestamp (auto-generated at build time)
// v7.1 (2025-12-16): Added Directory route
//   - New /diretorio tab for customer browsing
//   - Extracted from Customers view for better UX
// v7.0 (2025-12-13): Smart data refresh system
//   - Visibility-based refresh (when returning to tab after 5+ min)
//   - Auto-refresh every 10 minutes while tab is active
//   - DataFreshnessProvider for app-wide refresh triggers
//   - Prevents duplicate refreshes with debouncing
//   - Silent background refresh (no loading spinner)
// v6.2 (2025-11-30): Mobile improvements
//   - Pass activeTab to MinimalTopBar for mobile breadcrumb
//   - Header height aligned with sidebar (60px)
// v6.1 (2025-11-27): Added Lavpop logo to loading/error screens
// v6.0 (2025-11-27): Sidebar layout implementation
// v5.0 (2025-11-23): Error boundaries + code splitting
// v4.2 (2025-11-21): Reload button added

import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { RefreshCw, XCircle, Upload, Clock, Code } from 'lucide-react';

// Build timestamp injected by Vite at build time
const BUILD_TIME = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : null;
import LogoNoBackground from './assets/LogoNoBackground.svg';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './contexts/ThemeContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
import { DataFreshnessProvider } from './contexts/DataFreshnessContext';
import { RealtimeSyncProvider } from './contexts/RealtimeSyncContext';
import { loadAllData } from './utils/supabaseLoader';
import './utils/apiService'; // Register migration utilities on window
import IconSidebar from './components/IconSidebar';
import Backdrop from './components/Backdrop';
import MinimalTopBar from './components/MinimalTopBar';
import ErrorBoundary from './components/ErrorBoundary';

// Data freshness configuration
// With Supabase Realtime, polling is now a fallback - increase intervals
const STALE_TIME = 15 * 60 * 1000;        // 15 minutes - data considered stale (realtime handles fresh data)
const REFRESH_INTERVAL = 30 * 60 * 1000;  // 30 minutes - auto-refresh interval (fallback only)
const MIN_REFRESH_GAP = 60 * 1000;        // 60 seconds - minimum between refreshes

// Lazy load tab components for code splitting
const Dashboard = lazy(() => import('./views/Dashboard'));
const Customers = lazy(() => import('./views/Customers'));
const Directory = lazy(() => import('./views/Directory'));
const Campaigns = lazy(() => import('./views/Campaigns'));
const Operations = lazy(() => import('./views/Operations'));
const Intelligence = lazy(() => import('./views/Intelligence'));
const DataUploadView = lazy(() => import('./views/DataUploadView'));

// Format date in Brazilian format (DD/MM/YYYY HH:mm)
const formatBrDate = (isoDate) => {
  if (!isoDate) return '—';
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return '—';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return '—';
  }
};

// Format timestamp as date only for build version
const formatBrDateOnly = (isoDate) => {
  if (!isoDate) return '—';
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return '—';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '—';
  }
};

// Loading fallback component
const TabLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-lavpop-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-slate-600 dark:text-slate-400 font-medium">Carregando...</p>
    </div>
  </div>
);

function AppContent() {
  const { activeTab, navigateTo } = useNavigation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadProgress, setLoadProgress] = useState({ loaded: 0, total: 7, percent: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('complete');

  // Smart refresh state
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const refreshingRef = useRef(false);
  const lastRefreshAttemptRef = useRef(0);

  // Check if data is stale
  const isStale = useCallback(() => {
    if (!lastRefreshed) return true;
    return Date.now() - lastRefreshed > STALE_TIME;
  }, [lastRefreshed]);

  // Core data loading function
  const loadData = useCallback(async (options = {}) => {
    const { skipCache = false, silent = false, isInitial = false } = options;

    // Prevent duplicate refreshes (unless initial load)
    if (!isInitial && refreshingRef.current) {
      console.log('[App] Refresh already in progress, skipping');
      return;
    }

    // Prevent too-frequent refreshes (unless initial or forced)
    if (!isInitial && !skipCache) {
      const timeSinceLastAttempt = Date.now() - lastRefreshAttemptRef.current;
      if (timeSinceLastAttempt < MIN_REFRESH_GAP) {
        console.log('[App] Too soon since last refresh, skipping');
        return;
      }
    }

    try {
      refreshingRef.current = true;
      lastRefreshAttemptRef.current = Date.now();

      if (isInitial) {
        setLoading(true);
      }
      if (!silent) {
        setRefreshing(true);
      }
      setError(null);

      console.log(`[App] Loading data (skipCache: ${skipCache}, silent: ${silent})...`);
      const loadedData = await loadAllData((progress) => {
        if (isInitial) {
          setLoadProgress(progress);
        }
      }, skipCache);

      setData(loadedData);
      setLastRefreshed(Date.now());
      console.log('[App] Data loaded successfully');

    } catch (err) {
      console.error('[App] Failed to load data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      refreshingRef.current = false;
    }
  }, []);

  // Remove the HTML initial loader when React mounts
  useEffect(() => {
    if (window.removeInitialLoader) {
      window.removeInitialLoader();
    }
  }, []);

  // Initial data load
  useEffect(() => {
    loadData({ isInitial: true });
  }, [loadData]);

  // Visibility-based refresh: refresh when tab becomes visible (if stale)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !loading) {
        console.log('[App] Tab became visible, checking data freshness...');
        if (isStale()) {
          console.log('[App] Data is stale, triggering background refresh');
          loadData({ skipCache: true, silent: true });
        } else {
          console.log('[App] Data is still fresh');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loading, isStale, loadData]);

  // Auto-refresh interval: refresh every 30 minutes while tab is active (fallback only)
  useEffect(() => {
    if (loading) return;

    console.log(`[App] Setting up auto-refresh every ${REFRESH_INTERVAL / 1000}s (fallback for realtime)`);

    const intervalId = setInterval(() => {
      // Only auto-refresh if tab is visible
      if (document.visibilityState === 'visible') {
        console.log('[App] Auto-refresh triggered (fallback)');
        loadData({ skipCache: true, silent: true });
      } else {
        console.log('[App] Skipping auto-refresh (tab hidden)');
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [loading, loadData]);

  // Note: Realtime sync for contact_tracking is handled by useContactTracking hook
  // which listens to 'contactTrackingUpdate' events dispatched by RealtimeSyncProvider
  // This provides instant contact status updates on mobile without full data refresh

  // Map tab IDs to components
  const tabComponents = {
    dashboard: Dashboard,
    customers: Customers,
    diretorio: Directory,
    campaigns: Campaigns,
    intelligence: Intelligence,
    operations: Operations,
    upload: DataUploadView
  };

  const ActiveComponent = tabComponents[activeTab] || Dashboard;

  const handleTabChange = (tabId) => {
    navigateTo(tabId);
  };

  // Manual refresh handler (button click)
  const handleRefresh = useCallback(() => {
    console.log('[App] Manual refresh triggered');
    loadData({ skipCache: true, silent: false });
  }, [loadData]);

  // Refresh after user action (e.g., campaign sent)
  const refreshAfterAction = useCallback(async (actionName = 'action') => {
    console.log(`[App] Refreshing after ${actionName}...`);
    // Small delay to let backend process
    await new Promise(resolve => setTimeout(resolve, 1000));
    return loadData({ skipCache: true, silent: true });
  }, [loadData]);

  const handleRetry = () => {
    window.location.reload();
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lavpop-blue to-lavpop-green">
        <div className="text-center text-white px-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8 inline-block"
          >
            <motion.div
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl border border-white/20 p-3"
            >
              <img
                src={LogoNoBackground}
                alt="Lavpop"
                className="w-full h-full object-contain"
              />
            </motion.div>
          </motion.div>

          <h2 className="text-3xl font-bold mb-8 tracking-tight">Carregando Lavpop BI</h2>

          <div className="w-80 max-w-full mx-auto">
            <div className="h-2 bg-black/20 rounded-full overflow-hidden mb-4 backdrop-blur-sm">
              <motion.div
                className="h-full bg-white rounded-full shadow-lg"
                initial={{ width: 0 }}
                animate={{ width: `${loadProgress.percent}%` }}
                transition={{ type: "spring", stiffness: 50 }}
              />
            </div>
            <p className="text-sm font-medium opacity-90">
              {loadProgress.loaded} de {loadProgress.total} dados sincronizados
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error Screen
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center max-w-md w-full"
        >
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-100 dark:border-slate-700">
            {/* Logo */}
            <div className="w-16 h-16 mx-auto mb-4">
              <img
                src={LogoNoBackground}
                alt="Lavpop"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-500 dark:text-red-400" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Erro ao carregar dados
            </h2>

            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              Não foi possível carregar os dados do dashboard. Verifique sua conexão e tente novamente.
            </p>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 mb-8 text-left border border-slate-100 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Detalhes do erro
              </p>
              <pre className="text-xs text-slate-700 dark:text-slate-300 overflow-auto font-mono">
                {error}
              </pre>
            </div>

            <button
              onClick={handleRetry}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-lavpop-blue to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
            >
              Tentar Novamente
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main App
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Sidebar Navigation */}
      <IconSidebar activeTab={activeTab} onNavigate={handleTabChange} />

      {/* Mobile Backdrop */}
      <Backdrop />

      {/* Main Content Area - with sidebar offset */}
      <div className="lg:pl-[60px] min-h-screen flex flex-col">
        {/* Top Bar */}
        <MinimalTopBar refreshing={refreshing} onRefresh={handleRefresh} activeTab={activeTab} />

        {/* Main Content - Full width with edge-to-edge support */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Suspense fallback={<TabLoadingFallback />}>
                <ActiveComponent
                  data={data}
                  onNavigate={handleTabChange}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  onDataChange={refreshAfterAction}
                />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm mt-auto">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-2 sm:py-3">
            {/* Mobile: Compact with labels */}
            <div className="flex sm:hidden items-center justify-center gap-4 text-[10px] text-slate-400 dark:text-slate-500">
              <span>Dados: {formatBrDateOnly(data?.lastImportedAt)}</span>
              <span>•</span>
              <span>Build: {formatBrDateOnly(BUILD_TIME)}</span>
            </div>

            {/* Desktop: Full details with company name */}
            <div className="hidden sm:flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
              {/* CSV Upload Date */}
              <div className="flex items-center gap-1.5" title="Última importação de dados CSV">
                <Upload className="w-3.5 h-3.5" />
                <span>Dados: {formatBrDate(data?.lastImportedAt)}</span>
              </div>

              {/* Frontend Sync Time */}
              <div className="flex items-center gap-1.5" title="Última sincronização do frontend">
                <Clock className="w-3.5 h-3.5" />
                <span>Sync: {lastRefreshed ? formatBrDate(lastRefreshed) : '—'}</span>
              </div>

              {/* Build Version */}
              <div className="flex items-center gap-1.5" title="Data do deploy">
                <Code className="w-3.5 h-3.5" />
                <span>Build: {formatBrDateOnly(BUILD_TIME)}</span>
              </div>

              {/* Company Name */}
              <span className="text-slate-400 dark:text-slate-500">•</span>
              <span className="font-medium text-slate-600 dark:text-slate-300">Nova Lopez Lavanderia Ltd.</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SidebarProvider>
          <NavigationProvider>
            <DataFreshnessProvider>
              <RealtimeSyncProvider>
                <AppContent />
              </RealtimeSyncProvider>
            </DataFreshnessProvider>
          </NavigationProvider>
        </SidebarProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
