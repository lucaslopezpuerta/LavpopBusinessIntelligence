// App.jsx v8.16.0 - THEME-AWARE COLORS FIX
// ✅ Premium loading screen with animated data source indicators
// ✅ Smart error categorization with user-friendly messages
// ✅ Minimalist icon sidebar with hover expansion
// ✅ Compact top bar with widgets (60px to match sidebar)
// ✅ Mobile drawer with backdrop overlay
// ✅ Maximized horizontal space for data visualizations
// ✅ Mobile breadcrumb shows current tab
// ✅ Smart data refresh with visibility detection
// ✅ Auto-refresh every 30 minutes when active (fallback only)
// ✅ Separate Directory route for customer browsing
// ✅ Data freshness footer with CSV upload, sync time, build version
// ✅ View-specific skeleton loading states for better perceived performance
// ✅ URL-based routing with deep linking support
// ✅ Sidebar pin toggle for always-visible labels
// ✅ Keyboard shortcuts for power users
// ✅ Accessibility: prefers-reduced-motion support
// ✅ Real CSV/PDF export per view
// ✅ SWR caching: instant load from IndexedDB, silent cache refresh
// ✅ Mobile navigation via bottom nav bar + side menu
// ✅ Data completeness validation with console warnings
// ✅ Cache error recovery with auto-refresh
// ✅ Defensive data rendering - prevents empty white tabs after idle
// ✅ Realtime transaction updates - auto-refresh when new data inserted
//
// CHANGELOG:
// v8.16.0 (2026-01-16): Theme-aware colors fix
//   - Converted Tailwind dark: prefixes to JavaScript conditionals
//   - Uses useTheme hook for reliable dark mode detection
//   - Matches proven LoadingScreen pattern for consistent theming
// v8.15.0 (2026-01-12): Navigation scroll-to-top fix
//   - Added scroll-to-top when navigating between views
//   - Fixes bug where new view opened at previous scroll position
//   - Uses useEffect on activeTab change
// v8.14.0 (2026-01-12): Realtime transaction updates
//   - Added transactionUpdate event listener for auto-refresh
//   - When new transactions are inserted via Supabase realtime, triggers silent refresh
//   - 2s delay to let DB triggers update customer metrics
//   - Works in conjunction with useRealtimeSync hook
// v8.13.0 (2026-01-12): Removed swipe view navigation
//   - REMOVED: useSwipeNavigation hook integration (caused conflicts with row swipes)
//   - REMOVED: isChildSwiping state and callback props
//   - Mobile navigation now exclusively via bottom nav bar + side menu
//   - Row swipe actions (call/WhatsApp) now work without conflicts
// v8.12.0 (2025-12-26): Admin authentication
//   - Added AuthProvider for Supabase authentication
//   - Added /login route with LoginPage component
//   - Protected all routes with ProtectedRoute wrapper
//   - Redirects to login if not authenticated
// v8.11.3 (2025-12-26): Dynamic bottom nav clearance
//   - Content wrapper padding now uses CSS calc to match nav height + safe area
//   - Ensures proper clearance on all devices including notched phones
// v8.11.2 (2025-12-26): Fixed footer visibility with bottom nav
//   - Added pb-20 to content wrapper for bottom nav clearance
//   - Footer now fully visible when scrolling to bottom
//   - Removed redundant mb-16 from footer
// v8.11.1 (2025-12-26): Fixed bottom nav positioning
//   - Moved BottomNavBar outside content wrapper div
//   - Ensures fixed positioning works relative to viewport
//   - Prevents nav bar from scrolling with content
// v8.11.0 (2025-12-23): Defensive data rendering
//   - FIXED: Empty white tabs after idle/navigation
//   - Preserves existing valid data when silent refresh fails
//   - Shows skeleton fallback when data is invalid instead of white screen
//   - Double-check data validity before rendering views
// v8.10.0 (2025-12-23): Cache error recovery
//   - Added listener for cacheError events from dataCache.js
//   - Auto-triggers recovery refresh when IndexedDB cache fails
//   - Debounced 2s delay to prevent multiple simultaneous refreshes
// v8.9.1 (2025-12-23): Data completeness validation
//   - Added warning log when required data tables are missing
//   - Helps debug empty render issues caused by incomplete data
// v8.9 (2025-12-22): Stable tab navigation
//   - FIXED: Removed lastRefreshed from motion.div key
//   - Prevents unnecessary remounts on data refresh
//   - Tab animations now only trigger on actual navigation
//   - Eliminates animation flicker during background refresh
// v8.8 (2025-12-22): Swipe navigation + UX improvements
//   - Enabled swipe left/right between main tabs on mobile
//   - Swipe works on Dashboard, Clientes, Diretório, Campanhas
//   - Haptic feedback on successful swipe
//   - Uses useSwipeNavigation hook with Framer Motion
// v8.7 (2025-12-21): Fix browser crash on SWR background update
//   - Removed background state update (was crashing during navigation)
//   - Cache still updates silently in background
//   - Next page load gets fresh cached data
// v8.6 (2025-12-21): Stale-While-Revalidate caching
//   - Instant render from IndexedDB cache on page load
//   - Background fetch updates data silently
//   - 24-hour cache TTL with automatic revalidation
//   - Offline support via cached data
// v8.5 (2025-12-20): Enhanced loading & error screens
//   - New LoadingScreen with animated data source indicators
//   - New ErrorScreen with smart error categorization
//   - User-friendly error messages and recovery suggestions
//   - Dark mode support for both screens
// v8.4 (2025-12-17): CSV/PDF export
//   - Export modal with format selection (CSV/PDF)
//   - View-specific export options (customers, transactions, KPIs, etc.)
//   - jsPDF + jspdf-autotable for PDF reports
//   - papaparse for CSV with UTF-8 BOM (Excel compatible)
// v8.3 (2025-12-17): Reduced motion support
//   - Respects prefers-reduced-motion system preference
//   - Disables all Framer Motion animations when enabled
//   - View transitions simplified for accessibility
// v8.2 (2025-12-17): Keyboard shortcuts
//   - Press 1-7 to navigate between views
//   - Press , to open settings modal
//   - Shortcuts disabled when typing in inputs
// v8.1 (2025-12-17): Sidebar pin toggle support
//   - Content area padding dynamically adjusts when sidebar is pinned
//   - Smooth 300ms transition for padding changes
//   - Works seamlessly with all views
// v8.0 (2025-12-16): URL routing with React Router
//   - Added BrowserRouter for client-side routing
//   - URLs now reflect current view (/, /customers, /campaigns, etc.)
//   - Browser back/forward navigation works
//   - Bookmarks and deep links supported
//   - Refresh maintains current view
// v7.3 (2025-12-16): View-specific loading skeletons
//   - Each view now has a matching skeleton during lazy load
//   - Better perceived performance and less layout shift
//   - Skeletons match the exact layout of each view
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
// v6.1 (2025-11-27): Added Bilavnova logo to loading/error screens
// v6.0 (2025-11-27): Sidebar layout implementation
// v5.0 (2025-11-23): Error boundaries + code splitting
// v4.2 (2025-11-21): Reload button added

import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Upload, Clock, Code } from 'lucide-react';

// Build timestamp injected by Vite at build time
const BUILD_TIME = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : null;
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { useReducedMotion } from './hooks/useReducedMotion';

// Loading and Error screens
import LoadingScreen from './components/ui/LoadingScreen';
import ErrorScreen from './components/ui/ErrorScreen';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { SidebarProvider, useSidebar } from './contexts/SidebarContext';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
import { DataFreshnessProvider } from './contexts/DataFreshnessContext';
import { RealtimeSyncProvider } from './contexts/RealtimeSyncContext';
import { AppSettingsProvider } from './contexts/AppSettingsContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/auth/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { loadAllData } from './utils/supabaseLoader';
import './utils/apiService'; // Register migration utilities on window
import IconSidebar from './components/IconSidebar';
import Backdrop from './components/Backdrop';
import MinimalTopBar from './components/MinimalTopBar';
import BottomNavBar from './components/navigation/BottomNavBar';
import OfflineIndicator from './components/OfflineIndicator';
import ErrorBoundary from './components/ErrorBoundary';
import AppSettingsModal from './components/AppSettingsModal';
import ExportModal from './components/ExportModal';
import {
  DashboardLoadingSkeleton,
  CustomersLoadingSkeleton,
  DirectoryLoadingSkeleton,
  CampaignsLoadingSkeleton,
  WeatherLoadingSkeleton,
  OperationsLoadingSkeleton,
  IntelligenceLoadingSkeleton
} from './components/ui/Skeleton';

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
const SocialMedia = lazy(() => import('./views/SocialMedia'));
const Weather = lazy(() => import('./views/Weather'));
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

// View-specific loading skeletons map
const VIEW_SKELETONS = {
  dashboard: DashboardLoadingSkeleton,
  customers: CustomersLoadingSkeleton,
  diretorio: DirectoryLoadingSkeleton,
  campaigns: CampaignsLoadingSkeleton,
  social: CampaignsLoadingSkeleton, // Reuse campaigns skeleton (similar layout)
  weather: WeatherLoadingSkeleton,
  intelligence: IntelligenceLoadingSkeleton,
  operations: OperationsLoadingSkeleton,
  // Upload view uses generic fallback (simple form)
  upload: null
};

// Generic fallback for views without specific skeleton
const GenericLoadingFallback = () => {
  const { isDark } = useTheme();
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-stellar-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Carregando...</p>
      </div>
    </div>
  );
};

// View-specific loading fallback selector
const getLoadingFallback = (tabId) => {
  const SkeletonComponent = VIEW_SKELETONS[tabId];
  return SkeletonComponent ? <SkeletonComponent /> : <GenericLoadingFallback />;
};

function AppContent() {
  const { activeTab, navigateTo } = useNavigation();
  const { isPinned } = useSidebar();
  const { isDark } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadProgress, setLoadProgress] = useState({ loaded: 0, total: 3, percent: 0, tableStates: {} });
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('complete');
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);

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
      return;
    }

    // Prevent too-frequent refreshes (unless initial or forced)
    if (!isInitial && !skipCache) {
      const timeSinceLastAttempt = Date.now() - lastRefreshAttemptRef.current;
      if (timeSinceLastAttempt < MIN_REFRESH_GAP) {
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

      // SWR: No background state update - cache updates silently, next load gets fresh data
      // Background setState was causing browser crashes during navigation
      const loadedData = await loadAllData(
        (progress) => {
          if (isInitial) {
            setLoadProgress(progress);
          }
        },
        skipCache,
        null // No background callback - cache updates silently
      );

      // Validate that all required data tables are present
      // Views depend on: sales, rfm, customer, campaigns, weather
      const requiredTables = ['sales', 'rfm', 'customer'];
      const missingTables = requiredTables.filter(table => !loadedData?.[table]?.length);

      // CRITICAL: Only update data if we have valid data
      // Prevents overwriting good cached data with empty/failed refresh data
      if (missingTables.length > 0) {
        console.warn(`[App] Data loaded but missing tables: ${missingTables.join(', ')}`);

        // If this is a silent refresh (not initial load) and we have existing valid data,
        // keep the existing data instead of overwriting with incomplete data
        if (!isInitial && data?.sales?.length > 0) {
          console.info('[App] Keeping existing data - refresh returned incomplete data');
          return; // Don't update state with bad data
        }
      }

      setData(loadedData);
      setLastRefreshed(Date.now());

      // Brief pause at 100% so user sees completed state before transition
      if (isInitial) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }

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
      if (document.visibilityState === 'visible' && !loading && isStale()) {
        loadData({ skipCache: true, silent: true });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loading, isStale, loadData]);

  // Cache error recovery: refetch data when IndexedDB cache fails
  useEffect(() => {
    const handleCacheError = (event) => {
      const { operation, key, error } = event.detail || {};
      console.warn(`[App] Cache ${operation} error for ${key}: ${error}`);

      // Trigger recovery refresh after a short delay (debounce multiple errors)
      if (!loading && !refreshingRef.current) {
        setTimeout(() => {
          if (!refreshingRef.current) {
            console.info('[App] Triggering recovery refresh due to cache error');
            loadData({ skipCache: true, silent: true });
          }
        }, 2000);
      }
    };

    window.addEventListener('cacheError', handleCacheError);
    return () => window.removeEventListener('cacheError', handleCacheError);
  }, [loading, loadData]);

  // Real-time transaction updates: refresh data when new transactions are inserted
  // Event dispatched by useRealtimeSync when Supabase detects INSERT on transactions table
  useEffect(() => {
    const handleTransactionUpdate = (event) => {
      const { type, data: txData } = event.detail || {};
      console.info(`[App] Transaction ${type} detected via realtime:`, txData?.id || 'batch');

      // Trigger silent refresh to pick up new data
      // Note: DB triggers auto-update customer metrics, so full refresh gets both
      if (!loading && !refreshingRef.current) {
        // Small delay to let DB triggers complete
        setTimeout(() => {
          if (!refreshingRef.current) {
            console.info('[App] Triggering data refresh after transaction INSERT');
            loadData({ skipCache: true, silent: true });
          }
        }, 2000);
      }
    };

    window.addEventListener('transactionUpdate', handleTransactionUpdate);
    return () => window.removeEventListener('transactionUpdate', handleTransactionUpdate);
  }, [loading, loadData]);

  // Auto-refresh interval: refresh every 30 minutes while tab is active (fallback only)
  useEffect(() => {
    if (loading) return;

    const intervalId = setInterval(() => {
      // Only auto-refresh if tab is visible
      if (document.visibilityState === 'visible') {
        loadData({ skipCache: true, silent: true });
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [loading, loadData]);

  // Keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Don't trigger if modifier keys are pressed (except for ?)
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      const shortcuts = {
        '1': 'dashboard',
        '2': 'customers',
        '3': 'diretorio',
        '4': 'campaigns',
        '5': 'social',
        '6': 'weather',
        '7': 'intelligence',
        '8': 'operations',
        '9': 'upload',
      };

      const tabId = shortcuts[e.key];
      if (tabId) {
        e.preventDefault();
        navigateTo(tabId);
      }

      // Comma opens settings
      if (e.key === ',') {
        e.preventDefault();
        setShowSettings(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateTo]);

  // Scroll to top when navigating between views
  // Fixes bug where new view opened at previous scroll position
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  // Note: Realtime sync for contact_tracking is handled by useContactTracking hook
  // which listens to 'contactTrackingUpdate' events dispatched by RealtimeSyncProvider
  // This provides instant contact status updates on mobile without full data refresh

  // Map tab IDs to components
  const tabComponents = {
    dashboard: Dashboard,
    customers: Customers,
    diretorio: Directory,
    campaigns: Campaigns,
    social: SocialMedia,
    weather: Weather,
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
    loadData({ skipCache: true, silent: false });
  }, [loadData]);

  // Refresh after user action (e.g., campaign sent)
  const refreshAfterAction = useCallback(async () => {
    // Small delay to let backend process
    await new Promise(resolve => setTimeout(resolve, 1000));
    return loadData({ skipCache: true, silent: true });
  }, [loadData]);

  const handleRetry = () => {
    window.location.reload();
  };

  // Loading Screen
  if (loading) {
    return <LoadingScreen progress={loadProgress} />;
  }

  // Error Screen
  if (error) {
    return <ErrorScreen error={error} onRetry={handleRetry} />;
  }

  // Main App
  return (
    <MotionConfig reducedMotion={prefersReducedMotion ? 'always' : 'never'}>
      <div className={`min-h-screen ${isDark ? 'bg-space-void' : 'bg-slate-50'} transition-colors duration-300`}>
        {/* Sidebar Navigation */}
        <IconSidebar activeTab={activeTab} onNavigate={handleTabChange} />

        {/* Mobile Backdrop */}
        <Backdrop />

        {/* Offline Indicator */}
        <OfflineIndicator lastSyncTime={lastRefreshed} />

        {/* Main Content Area - with sidebar offset (dynamic when pinned) */}
        {/* pb-bottom-nav: 80px + safe-area-inset on mobile, 0 on desktop (lg+) */}
        <div className={`min-h-screen flex flex-col transition-[padding] duration-300 pb-bottom-nav ${isPinned ? 'lg:pl-[240px]' : 'lg:pl-16'}`}>
          {/* Top Bar */}
          <MinimalTopBar
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onOpenSettings={() => setShowSettings(true)}
            onOpenExport={() => setShowExport(true)}
          />

          {/* Main Content - Full width with edge-to-edge support */}
          {/* pb-24 on mobile for bottom nav clearance (64px nav + 16px breathing room) */}
          <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 pb-24 lg:pb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -10 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
              >
                <Suspense fallback={getLoadingFallback(activeTab)}>
                  {/* Defensive check: show skeleton if data is missing/invalid */}
                  {/* Exception: 'upload' view doesn't need data - it's a standalone form */}
                  {(activeTab !== 'upload' && (!data || !data.sales || data.sales.length === 0)) ? (
                    getLoadingFallback(activeTab)
                  ) : (
                    <ActiveComponent
                      data={data}
                      onNavigate={handleTabChange}
                      viewMode={viewMode}
                      setViewMode={setViewMode}
                      onDataChange={refreshAfterAction}
                    />
                  )}
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </main>

        {/* Footer */}
        <footer className={`border-t ${isDark ? 'border-stellar-cyan/10' : 'border-slate-200'} ${isDark ? 'bg-space-void' : 'bg-white/50'} backdrop-blur-sm mt-auto`}>
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-2 sm:py-3">
            {/* Mobile: Compact with labels */}
            <div className={`flex sm:hidden items-center justify-center gap-4 text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              <span>Dados: {formatBrDateOnly(data?.lastImportedAt)}</span>
              <span>•</span>
              <span>Build: {formatBrDateOnly(BUILD_TIME)}</span>
            </div>

            {/* Desktop: Full details with company name */}
            <div className={`hidden sm:flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
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
              <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>•</span>
              <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Nova Lopez Lavanderia Ltd.</span>
            </div>
          </div>
        </footer>
      </div>

        {/* Bottom Navigation Bar (mobile only) - MUST be outside content wrapper for proper fixed positioning */}
        <BottomNavBar />

        {/* Settings Modal */}
        <AppSettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />

        {/* Export Modal */}
        <ExportModal
          isOpen={showExport}
          onClose={() => setShowExport(false)}
          activeView={activeTab}
          data={data}
        />
      </div>
    </MotionConfig>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <Routes>
              {/* Public route: Login */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected routes: Everything else */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <SidebarProvider>
                      <NavigationProvider>
                        <DataFreshnessProvider>
                          <RealtimeSyncProvider>
                            <AppSettingsProvider>
                              <AppContent />
                            </AppSettingsProvider>
                          </RealtimeSyncProvider>
                        </DataFreshnessProvider>
                      </NavigationProvider>
                    </SidebarProvider>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
