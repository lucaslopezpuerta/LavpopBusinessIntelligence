// IconSidebar.jsx v4.0 - SETTINGS BUTTON INTEGRATION
// Modern sidebar with navigation groups, hero branding, and polished mobile drawer
//
// CHANGELOG:
// v4.0 (2026-01-23): Settings button moved from TopBar
//   - Added Settings button to desktop sidebar footer
//   - Added Settings button to mobile drawer footer
//   - Changed Operations icon from Settings to Wrench (frees gear icon)
//   - Added onOpenSettings prop
// v3.9 (2026-01-23): Relocated realtime indicator to header
//   - Moved RealtimeStatusIndicator from footer to header (next to BILAVNOVA)
//   - Better visibility and cleaner footer layout
// v3.8 (2026-01-23): Realtime status indicator
//   - Added RealtimeStatusIndicator to mobile drawer footer
//   - Shows connection status for mobile users
// v3.7 (2026-01-18): Height alignment with TopBar
//   - Desktop header: 72px → 60px to match TopBar
//   - Mobile header: 64px → 56px (h-14) to match TopBar mobile
//   - Logo size reduced from w-10 h-10 to w-8 h-8
//   - Better visual symmetry with app chrome
// v3.6 (2026-01-16): Theme-aware colors fix
//   - Added useTheme hook for reliable dark mode detection
//   - Converted all Tailwind dark: prefixes to JavaScript conditionals
//   - Matches proven LoadingScreen pattern for consistent theming
// v3.5 (2026-01-15): Use favicon.ico for sidebar logo
//   - Simplified to use single favicon.ico from public folder
// v3.4 (2026-01-15): Theme-aware logo (reverted)
// v3.3 (2026-01-12): Safe area compliance
//   - Added safe-area-right to mobile drawer for landscape/foldable devices
// v3.2 (2025-12-26): PNG logo update
//   - Changed from SVG to PNG logo for consistency with LoadingScreen/LoginPage
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
//   - Branding: "Bilavnova"
// v2.0 (2025-12-22): Focus trap & collapse delay
// v1.x: Previous implementations

import { useRef, useEffect, useCallback } from 'react';
import { BarChart3, Users, TrendingUp, Settings, MessageSquare, Upload, Search, Pin, PinOff, Share2, CloudSun, X, ChevronRight, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import FocusTrap from 'focus-trap-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '../contexts/SidebarContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';
import RealtimeStatusIndicator from './ui/RealtimeStatusIndicator';

// Sidebar logo from public folder
const BilavnovaLogo = '/pwa-192x192.png';

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
      { id: 'intelligence', label: 'Planejamento', icon: TrendingUp, path: '/intelligence' },
      { id: 'operations', label: 'Operações', icon: Wrench, path: '/operations' },
    ]
  }
];

// Utility items (separate from main navigation)
const utilityItem = { id: 'upload', label: 'Importar', icon: Upload, path: '/upload' };
const settingsItem = { id: 'settings', label: 'Configurações', icon: Settings };

const IconSidebar = ({ activeTab, onNavigate, onOpenSettings }) => {
  const { isHovered, setIsHovered, isMobileOpen, setIsMobileOpen, toggleMobileSidebar, isPinned, togglePinned } = useSidebar();
  const prefersReducedMotion = useReducedMotion();
  const { isDark } = useTheme();
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

  // Close sidebar (not toggle) - prevents double-toggle issues with FocusTrap
  const closeMobileSidebar = useCallback(() => {
    setIsMobileOpen(false);
  }, [setIsMobileOpen]);

  const handleMobileNavigate = () => {
    if (isMobileOpen) {
      closeMobileSidebar();
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

  // Nav item component for reuse - supports both Link (with path) and button (with onClick)
  const NavItem = ({ item, isMobile = false, onClick }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const isButton = !item.path;

    const className = `relative w-full flex items-center gap-3 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan focus-visible:ring-offset-2 ${isMobile ? 'h-11 px-3' : `h-10 ${isExpanded ? 'px-3' : 'justify-center'}`} ${isActive ? 'bg-gradient-stellar-horizontal text-white shadow-md shadow-bilavnova' : isDark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100'}`;

    const content = (
      <>
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
      </>
    );

    if (isButton) {
      return (
        <button
          type="button"
          onClick={() => {
            onClick?.();
            if (isMobile) handleMobileNavigate();
          }}
          className={`${className} appearance-none bg-transparent border-0`}
          title={(!isExpanded && !isMobile) ? item.label : undefined}
          aria-label={item.label}
        >
          {content}
        </button>
      );
    }

    return (
      <Link
        to={item.path}
        onClick={isMobile ? handleMobileNavigate : handleDesktopNavigate}
        aria-current={isActive ? 'page' : undefined}
        className={className}
        title={(!isExpanded && !isMobile) ? item.label : undefined}
      >
        {content}
      </Link>
    );
  };

  // Desktop Sidebar (no safe-area needed - desktop browsers don't have status bar insets)
  const DesktopSidebar = () => (
    <motion.aside
      className={`hidden lg:flex fixed left-0 top-0 h-screen ${isDark ? 'bg-space-nebula' : 'bg-white/95'} backdrop-blur-xl border-r ${isDark ? 'border-stellar-cyan/10' : 'border-stellar-cyan/5'} z-50 flex-col`}
      initial={false}
      animate={{ width: isExpanded ? 240 : 64 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeInOut' }}
      onMouseEnter={() => !isPinned && setIsHovered(true)}
      onMouseLeave={() => !isPinned && setIsHovered(false)}
    >
      {/* Hero Logo Header (60px - matches TopBar) */}
      <div className={`h-[60px] px-3 flex items-center justify-between border-b ${isDark ? 'border-stellar-cyan/10' : 'border-stellar-cyan/5'} flex-shrink-0`}>
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Logo with glow effect */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-stellar-cyan/20 blur-xl rounded-full scale-150" />
            <img
              src={BilavnovaLogo}
              alt="Bilavnova"
              className="relative w-8 h-8 object-contain"
            />
          </div>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="flex flex-col min-w-0"
            >
              <span className="font-display text-lg font-bold leading-tight tracking-wide" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                <span className={isDark ? 'text-white' : 'text-slate-900'}>BILAV</span><span className="text-stellar-cyan">NOVA</span>
              </span>
              <span className={`text-[10px] leading-tight ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
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
            className={`p-1.5 rounded-md transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan ${isPinned ? 'text-stellar-cyan bg-stellar-cyan/10' : isDark ? 'text-slate-400 hover:bg-stellar-cyan/10 hover:text-slate-300' : 'text-slate-400 hover:bg-stellar-cyan/5 hover:text-slate-600'}`}
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
                className={`px-5 mb-2 text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
              >
                {group.label}
              </motion.p>
            )}
            {/* Section divider when collapsed */}
            {!isExpanded && groupIndex > 0 && (
              <div className={`mx-4 mb-2 border-t ${isDark ? 'border-stellar-cyan/10' : 'border-slate-200'}`} />
            )}
            {/* Navigation items */}
            <div className="space-y-1 px-2">
              {group.items.map(item => (
                <NavItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Utility Items (Importar + Settings) */}
      <div className={`py-2 px-2 border-t ${isDark ? 'border-stellar-cyan/10' : 'border-stellar-cyan/5'} flex-shrink-0 space-y-1`}>
        <NavItem item={utilityItem} />
        <NavItem item={settingsItem} onClick={onOpenSettings} />
      </div>

      {/* Expand indicator when collapsed and hovered */}
      {!isExpanded && (
        <motion.div
          className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 pointer-events-none"
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: isHovered ? 0.6 : 0, x: isHovered ? 0 : -4 }}
          transition={{ duration: 0.2 }}
        >
          <div className={`${isDark ? 'bg-space-dust' : 'bg-white'} rounded-full p-1 shadow-md border ${isDark ? 'border-stellar-cyan/20' : 'border-slate-200'}`}>
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
            onClick={closeMobileSidebar}
            aria-hidden="true"
          />

          {/* Drawer with rounded corners */}
          <FocusTrap
            active={isMobileOpen}
            focusTrapOptions={{
              allowOutsideClick: true,
              escapeDeactivates: true,
              onDeactivate: closeMobileSidebar,
              initialFocus: false,
              returnFocusOnDeactivate: true,
            }}
          >
            <motion.aside
              className={`lg:hidden fixed left-0 top-0 bottom-0 w-[280px] ${isDark ? 'bg-space-nebula' : 'bg-white/95'} backdrop-blur-xl z-50 rounded-r-2xl shadow-2xl flex flex-col safe-area-top safe-area-bottom safe-area-left safe-area-right`}
              initial={prefersReducedMotion ? false : { x: -300 }}
              animate={{ x: 0 }}
              exit={prefersReducedMotion ? undefined : { x: -300 }}
              transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 300 }}
              role="dialog"
              aria-modal="true"
              aria-label="Menu de navegacao"
            >
              {/* Header with close button (h-14 matches TopBar mobile) */}
              <div className={`h-14 px-4 flex items-center justify-between border-b ${isDark ? 'border-stellar-cyan/10' : 'border-stellar-cyan/5'} flex-shrink-0`}>
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="absolute inset-0 bg-stellar-cyan/20 blur-lg rounded-full scale-150" />
                    <img
                      src={BilavnovaLogo}
                      alt="Bilavnova"
                      className="relative w-8 h-8 object-contain"
                    />
                  </div>
                  <span className="font-display text-lg font-bold tracking-wide" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    <span className={isDark ? 'text-white' : 'text-slate-900'}>BILAV</span><span className="text-stellar-cyan">NOVA</span>
                  </span>
                  <RealtimeStatusIndicator />
                </div>
                <button
                  onClick={closeMobileSidebar}
                  className="p-2 -mr-2 rounded-lg text-slate-500 hover:bg-stellar-cyan/10 hover:text-stellar-cyan transition-colors"
                  aria-label="Fechar menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation with sections */}
              <nav className="flex-1 py-4 px-3 overflow-y-auto">
                {navigationGroups.map((group, groupIndex) => (
                  <div key={group.id} className={groupIndex > 0 ? 'mt-5' : ''}>
                    <p className={`px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
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

              {/* Utility footer with Settings and ThemeToggle */}
              <div className={`p-3 border-t ${isDark ? 'border-stellar-cyan/10' : 'border-stellar-cyan/5'} flex-shrink-0 space-y-1`}>
                <NavItem item={utilityItem} isMobile />
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <NavItem item={settingsItem} isMobile onClick={onOpenSettings} />
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
