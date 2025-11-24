// App.jsx v5.0 - ERROR BOUNDARIES + CODE SPLITTING
// ✅ Added ErrorBoundary for graceful error handling
// ✅ Implemented lazy loading for tab components
// ✅ Added Suspense with loading fallback
//
// CHANGELOG:
// v5.0 (2025-11-23): Error boundaries + code splitting
// v4.2 (2025-11-21): Reload button added

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BarChart3, Users, TrendingUp, Settings, Menu, X, RefreshCw, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './contexts/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import { loadAllData } from './utils/csvLoader';
import WeatherWidget from './components/WeatherWidget_API';
import GoogleBusinessWidget from './components/GoogleBusinessWidget';
import SocialMediaWidget from './components/SocialMediaWidget';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, component: Dashboard },
    { id: 'customers', label: 'Clientes', icon: Users, component: Customers },
    { id: 'intelligence', label: 'Inteligência', icon: TrendingUp, component: Intelligence },
    { id: 'operations', label: 'Operações', icon: Settings, component: Operations }
  ];

  const activeTabData = tabs.find(t => t.id === activeTab);
  const ActiveComponent = activeTabData?.component || Dashboard;

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
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
            <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-5xl font-bold shadow-2xl border border-white/20">
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                L
              </motion.span>
            </div>
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
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <X className="w-10 h-10 text-red-500 dark:text-red-400" />
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
      {/* Header - Glassmorphism */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-all duration-300">
        <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Logo + Location */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-start"
              >
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                  Lavpop<span className="text-lavpop-blue">BI</span>
                </h1>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin className="w-2.5 h-2.5 text-lavpop-blue dark:text-blue-400" />
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                    Caxias do Sul
                  </span>
                </div>
              </motion.div>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
              <WeatherWidget compact />
            </div>

            {/* Desktop Navigation - Sliding Pill */}
            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-full border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`
                      relative flex items-center gap-2 px-5 py-2 rounded-full font-medium text-sm
                      transition-colors duration-200 z-10
                      ${isActive
                        ? 'text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }
                    `}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-lavpop-blue to-blue-600 rounded-full shadow-md"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Right: Widgets + Controls */}
            <div className="flex items-center gap-2">
              {/* Widgets - Google & Social only */}
              <div className="flex items-center gap-2">
                <GoogleBusinessWidget compact />
                <SocialMediaWidget compact />
                <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-700" />
              </div>

              {/* Reload Button - Hidden on mobile */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="hidden sm:flex p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-lavpop-blue dark:hover:text-lavpop-blue transition-all disabled:opacity-50 active:scale-95"
                title="Atualizar Dados"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

              {/* Theme Toggle - Hidden on mobile */}
              <div className="hidden sm:block">
                <ThemeToggle className="no-print" />
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="lg:hidden overflow-hidden border-t border-slate-100 dark:border-slate-800"
              >
                <nav className="flex flex-col gap-2 py-4">
                  {/* Mobile Controls */}
                  <div className="flex items-center justify-around px-4 py-3 mx-2 mb-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                      title="Atualizar Dados"
                    >
                      <RefreshCw className={`w-5 h-5 text-slate-600 dark:text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
                      <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Atualizar</span>
                    </button>
                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                    <div className="flex flex-col items-center gap-1">
                      <ThemeToggle />
                      <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Tema</span>
                    </div>
                  </div>

                  {/* Navigation Tabs */}
                  {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`
                          flex items-center gap-3 
                          px-4 py-3.5 mx-2
                          rounded-xl font-semibold text-base
                          transition-all duration-200
                          ${isActive
                            ? 'bg-lavpop-blue text-white shadow-lg shadow-blue-500/20'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }
                        `}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{tab.label}</span>
                        {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
                      </button>
                    );
                  })}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Powered by <span className="font-semibold text-slate-700 dark:text-slate-300">Nova Lopez Lavanderia Ltd.</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
