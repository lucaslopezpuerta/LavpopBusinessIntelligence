// IconSidebar.jsx v3.1 - THEME TOGGLE IN MOBILE FOOTER
// Modern sidebar with navigation groups, hero branding, and polished mobile drawer
//
// CHANGELOG:
// v3.1 (2025-12-22): Theme toggle in mobile drawer footer
//   - Added ThemeToggle to mobile drawer footer (right of Importar)
//   - Moved from MinimalTopBar for better mobile UX
// v3.0 (2025-12-22): Complete redesign
//   - NEW: Hero logo header (72px) with glow effect
//   - NEW: Navigation grouped into sections (Principal, Marketing, Analise)
//   - NEW: Section labels visible when expanded
//   - NEW: Pin button moved to header
//   - NEW: Mobile drawer with blur backdrop and rounded corners
//   - NEW: Spring animation for mobile drawer
//   - Branding: "Bilavnova" (was LavpopBI)
// v2.0 (2025-12-22): Focus trap & collapse delay
// v1.x: Previous implementations

import { useRef, useEffect } from 'react';
import { BarChart3, Users, TrendingUp, Settings, MessageSquare, Upload, Search, Pin, PinOff, Share2, CloudSun, X, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import FocusTrap from 'focus-trap-react';
import LogoNoBackground from '../assets/LogoNoBackground.svg';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '../contexts/SidebarContext';
import ThemeToggle from './ThemeToggle';

// Navigation grouped by section
const navigationGroups = [
  {
    id: 'principal',
    label: 'Principal',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/' },
      { id: 'customers', label: 'Clientes', icon: Users, path: '/customers' },
      { id: 'diretorio', label: 'Diretorio', icon: Search, path: '/diretorio' },
    ]
  },
  {
    id: 'marketing',
    label: 'Marketing',
    items: [
      { id: 'campaigns', label: 'Campanhas', icon: MessageSquare, path: '/campaigns' },
      { id: 'social', label: 'Redes Sociais', icon: Share2, path: '/social' },
    ]
  },
  {
    id: 'analysis',
    label: 'Analise',
    items: [
      { id: 'weather', label: 'Clima', icon: CloudSun, path: '/weather' },
      { id: 'intelligence', label: 'Inteligencia', icon: TrendingUp, path: '/intelligence' },
      { id: 'operations', label: 'Operacoes', icon: Settings, path: '/operations' },
    ]
  }
];

// Utility item (separate from main navigation)
const utilityItem = { id: 'upload', label: 'Importar', icon: Upload, path: '/upload' };

const IconSidebar = ({ activeTab, onNavigate }) => {
  const { isHovered, setIsHovered, isMobileOpen, toggleMobileSidebar, isPinned, togglePinned } = useSidebar();
  const collapseTimeoutRef = useRef(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, []);

  // Sidebar is expanded when pinned OR hovered
  const isExpanded = isPinned || isHovered;

  const handleMobileNavigate = () => {
    if (isMobileOpen) {
      toggleMobileSidebar();
    }
  };

  // Collapse sidebar after clicking a nav item (unless pinned)
  const handleDesktopNavigate = () => {
    if (!isPinned) {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
      collapseTimeoutRef.current = setTimeout(() => {
        setIsHovered(false);
      }, 300);
    }
  };

  // Nav item component for reuse
  const NavItem = ({ item, isMobile = false }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <Link
        to={item.path}
        onClick={isMobile ? handleMobileNavigate : handleDesktopNavigate}
        aria-current={isActive ? 'page' : undefined}
        className={`
          relative flex items-center gap-3 rounded-lg transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavpop-blue focus-visible:ring-offset-2
          ${isMobile ? 'h-11 px-3' : `h-10 ${isExpanded ? 'mx-2 px-3' : 'mx-2 justify-center'}`}
          ${isActive
            ? 'bg-gradient-to-r from-lavpop-blue via-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/25'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
          }
        `}
        title={(!isExpanded && !isMobile) ? item.label : undefined}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {(isExpanded || isMobile) && (
          <span className="whitespace-nowrap text-sm font-medium">
            {item.label}
          </span>
        )}
        {isActive && isMobile && (
          <div className="ml-auto">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          </div>
        )}
      </Link>
    );
  };

  // Desktop Sidebar
  const DesktopSidebar = () => (
    <motion.aside
      className="hidden lg:flex fixed left-0 top-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex-col"
      initial={false}
      animate={{ width: isExpanded ? 240 : 64 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      onMouseEnter={() => !isPinned && setIsHovered(true)}
      onMouseLeave={() => !isPinned && setIsHovered(false)}
    >
      {/* Hero Logo Header (72px) */}
      <div className="h-[72px] px-3 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-700/50 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Logo with glow effect */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-lavpop-blue/20 blur-xl rounded-full scale-150" />
            <img
              src={LogoNoBackground}
              alt="Bilavnova"
              className="relative w-10 h-10 object-contain"
            />
          </div>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="flex flex-col min-w-0"
            >
              <span className="text-lg font-bold leading-tight">
                <span className="text-slate-900 dark:text-white">BILAV</span><span className="text-lavpop-blue">NOVA</span>
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                Business Intelligence
              </span>
            </motion.div>
          )}
        </div>
        {/* Pin button in header when expanded */}
        {isExpanded && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            onClick={togglePinned}
            className={`
              p-1.5 rounded-md transition-colors flex-shrink-0
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavpop-blue
              ${isPinned
                ? 'text-lavpop-blue bg-lavpop-blue/10'
                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300'
              }
            `}
            title={isPinned ? 'Desafixar menu' : 'Fixar menu'}
            aria-label={isPinned ? 'Desafixar menu' : 'Fixar menu'}
          >
            {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          </motion.button>
        )}
      </div>

      {/* Navigation with Groups */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navigationGroups.map((group, groupIndex) => (
          <div key={group.id} className={groupIndex > 0 ? 'mt-4' : ''}>
            {/* Section label - only visible when expanded */}
            {isExpanded && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="px-5 mb-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider"
              >
                {group.label}
              </motion.p>
            )}
            {/* Section divider when collapsed */}
            {!isExpanded && groupIndex > 0 && (
              <div className="mx-4 mb-2 border-t border-slate-200 dark:border-slate-700" />
            )}
            {/* Navigation items */}
            <div className="space-y-1">
              {group.items.map(item => (
                <NavItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Utility Item (Importar) */}
      <div className="p-2 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
        <NavItem item={utilityItem} />
      </div>

      {/* Expand indicator when collapsed and hovered */}
      {!isExpanded && (
        <motion.div
          className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 pointer-events-none"
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: isHovered ? 0.6 : 0, x: isHovered ? 0 : -4 }}
          transition={{ duration: 0.2 }}
        >
          <div className="bg-white dark:bg-slate-800 rounded-full p-1 shadow-md border border-slate-200 dark:border-slate-700">
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </div>
        </motion.div>
      )}
    </motion.aside>
  );

  // Mobile Drawer with blur backdrop
  const MobileDrawer = () => (
    <AnimatePresence>
      {isMobileOpen && (
        <>
          {/* Blur backdrop */}
          <motion.div
            className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={toggleMobileSidebar}
            aria-hidden="true"
          />

          {/* Drawer with rounded corners */}
          <FocusTrap
            active={isMobileOpen}
            focusTrapOptions={{
              allowOutsideClick: true,
              escapeDeactivates: true,
              onDeactivate: toggleMobileSidebar,
              initialFocus: false,
              returnFocusOnDeactivate: true,
            }}
          >
            <motion.aside
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-white dark:bg-slate-900 z-50 rounded-r-2xl shadow-2xl flex flex-col safe-area-left"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              role="dialog"
              aria-modal="true"
              aria-label="Menu de navegacao"
            >
              {/* Header with close button */}
              <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-lavpop-blue/20 blur-lg rounded-full scale-150" />
                    <img
                      src={LogoNoBackground}
                      alt="Bilavnova"
                      className="relative w-9 h-9 object-contain"
                    />
                  </div>
                  <span className="text-lg font-bold">
                    <span className="text-slate-900 dark:text-white">BILAV</span><span className="text-lavpop-blue">NOVA</span>
                  </span>
                </div>
                <button
                  onClick={toggleMobileSidebar}
                  className="p-2 -mr-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  aria-label="Fechar menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation with sections */}
              <nav className="flex-1 py-4 px-3 overflow-y-auto">
                {navigationGroups.map((group, groupIndex) => (
                  <div key={group.id} className={groupIndex > 0 ? 'mt-5' : ''}>
                    <p className="px-3 mb-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {group.label}
                    </p>
                    <div className="space-y-1">
                      {group.items.map(item => (
                        <NavItem key={item.id} item={item} isMobile />
                      ))}
                    </div>
                  </div>
                ))}
              </nav>

              {/* Utility footer with ThemeToggle */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <NavItem item={utilityItem} isMobile />
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            </motion.aside>
          </FocusTrap>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <DesktopSidebar />
      <MobileDrawer />
    </>
  );
};

export default IconSidebar;
