// App.jsx v4.0 - COMPLETE TAILWIND REDESIGN
// Full Tailwind migration with dark/light theme support
//
// FEATURES:
// ✅ 100% Tailwind CSS (no custom CSS)
// ✅ Dark/Light theme toggle
// ✅ Responsive mobile design
// ✅ Smooth animations
// ✅ Lavpop brand colors (#1a5a8e / #55b03b)
// ✅ Loading states with skeleton
// ✅ Error handling with retry
//
// CHANGELOG:
// v4.0 (2025-11-20): Complete Tailwind redesign
//   - Removed all custom CSS classes
//   - Added ThemeProvider integration
//   - Responsive header with mobile menu
//   - Brand color consistency
//   - Loading skeleton animation
// v3.0 (2025-11-18): Intelligence Tab integrated
// v2.1 (2025-11-16): Analytics tab added
// v2.0 (2025-11-15): Header redesign

import React, { useState, useEffect } from 'react';
import { BarChart3, Users, TrendingUp, Settings, Menu, X } from 'lucide-react';
import { ThemeProvider } from './contexts/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import { loadAllData } from './utils/csvLoader';
import Logo from './assets/Logo1.png';

// Import views
import Dashboard from './views/Dashboard';
import Customers from './views/Customers';
import Operations from './views/Operations';
import Intelligence from './views/Intelligence';

const BRAND_COLORS = {
  primary: '#1a5a8e',
  accent: '#55b03b',
};

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadProgress, setLoadProgress] = useState({ loaded: 0, total: 7, percent: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const loadedData = await loadAllData((progress) => {
          setLoadProgress(progress);
        });
        setData(loadedData);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

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
    setMobileMenuOpen(false); // Close mobile menu on tab change
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lavpop-blue to-lavpop-green">
        <div className="text-center text-white px-4">
          {/* Logo Animation */}
          <div className="mb-8 inline-block">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl font-bold animate-pulse-slow">
              L
            </div>
          </div>
          
          {/* Title */}
          <h2 className="text-3xl font-bold mb-8">Carregando Lavpop BI</h2>
          
          {/* Progress Bar */}
          <div className="w-80 max-w-full mx-auto">
            <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-4">
              <div 
                className="h-full bg-white rounded-full transition-all duration-300 ease-out shadow-lg"
                style={{ width: `${loadProgress.percent}%` }}
              />
            </div>
            <p className="text-sm opacity-90">
              {loadProgress.loaded} de {loadProgress.total} arquivos carregados ({loadProgress.percent}%)
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
        <div className="text-center max-w-md">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Erro ao carregar dados
            </h2>
            
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Não foi possível carregar os dados do dashboard. Por favor, tente novamente.
            </p>
            
            {/* Error Details */}
            <div className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-4 mb-6 text-left">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Detalhes do erro:
              </p>
              <pre className="text-xs text-slate-600 dark:text-slate-400 overflow-auto">
                {error}
              </pre>
            </div>
            
            <button
              onClick={handleRetry}
              className="w-full py-3 px-6 bg-lavpop-blue hover:bg-lavpop-blue-600 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main App
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300">
        <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* Logo Section */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <img 
                src={Logo} 
                alt="Lavpop Logo" 
                className="h-12 w-auto object-contain"
              />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-lavpop-blue dark:text-lavpop-blue-400">
                  Lavpop BI
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Business Intelligence
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-2 flex-1 justify-center">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                      transition-all duration-200
                      ${isActive
                        ? 'bg-lavpop-blue text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right Section: Theme Toggle + Mobile Menu */}
            <div className="flex items-center gap-2">
              <ThemeToggle className="no-print" />
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-slate-200 dark:border-slate-700 animate-slide-down">
              <nav className="flex flex-col gap-2">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm
                        transition-all duration-200
                        ${isActive
                          ? 'bg-lavpop-blue text-white shadow-md'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="animate-fade-in">
          <ActiveComponent data={data} />
        </div>
      </main>
    </div>
  );
}

// Wrap with ThemeProvider
function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
