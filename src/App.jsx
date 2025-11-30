// App.jsx v6.2 - SIDEBAR LAYOUT + MINIMALIST DESIGN
// ✅ Added minimalist icon sidebar with hover expansion
// ✅ Compact top bar with widgets (60px to match sidebar)
// ✅ Mobile drawer with backdrop overlay
// ✅ Maximized horizontal space for data visualizations
// ✅ Integrated Lavpop logo in loading and error screens
// ✅ Mobile breadcrumb shows current tab
//
// CHANGELOG:
// v6.2 (2025-11-30): Mobile improvements
//   - Pass activeTab to MinimalTopBar for mobile breadcrumb
//   - Header height aligned with sidebar (60px)
// v6.1 (2025-11-27): Added Lavpop logo to loading/error screens
// v6.0 (2025-11-27): Sidebar layout implementation
// v5.0 (2025-11-23): Error boundaries + code splitting
// v4.2 (2025-11-21): Reload button added

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { RefreshCw, XCircle } from 'lucide-react';
import LogoNoBackground from './assets/LogoNoBackground.svg';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './contexts/ThemeContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { loadAllData } from './utils/csvLoader';
import IconSidebar from './components/IconSidebar';
import Backdrop from './components/Backdrop';
import MinimalTopBar from './components/MinimalTopBar';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load tab components for code splitting
const Dashboard = lazy(() => import('./views/Dashboard'));
const Customers = lazy(() => import('./views/Customers'));
const Operations = lazy(() => import('./views/Operations'));
const Intelligence = lazy(() => import('./views/Intelligence'));

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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadProgress, setLoadProgress] = useState({ loaded: 0, total: 7, percent: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('complete');

  const loadData = async (skipCache = false) => {
    try {
      setLoading(true);
      setError(null);
      const loadedData = await loadAllData((progress) => {
        setLoadProgress(progress);
      }, skipCache);
      setData(loadedData);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Map tab IDs to components
  const tabComponents = {
    dashboard: Dashboard,
    customers: Customers,
    intelligence: Intelligence,
    operations: Operations
  };

  const ActiveComponent = tabComponents[activeTab] || Dashboard;

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(true); // Skip cache on manual refresh
  };

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
              {loadProgress.loaded} de {loadProgress.total} arquivos carregados
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

        {/* Main Content */}
        <main className="flex-1 max-w-[100rem] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
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
              />
            </Suspense>
          </motion.div>
        </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm mt-auto">
          <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
              Powered by <span className="font-semibold text-slate-700 dark:text-slate-300">Nova Lopez Lavanderia Ltd.</span>
            </p>
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
          <AppContent />
        </SidebarProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
