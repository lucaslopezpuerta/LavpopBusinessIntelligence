// IconSidebar.jsx v1.9 - ACCESSIBILITY IMPROVEMENTS
// Minimalist icon-only sidebar with hover-to-expand functionality
//
// CHANGELOG:
// v1.9 (2025-12-17): Accessibility improvements
//   - Added aria-current="page" to active nav items
//   - Improves screen reader navigation
// v1.8 (2025-12-17): Remove label animations
//   - Removed AnimatePresence and motion.span from nav labels
//   - Labels now appear/disappear instantly with sidebar width
//   - Fixes flicker when clicking nav items while pinned
//   - Sidebar width transition still smooth (handled by aside)
// v1.7 (2025-12-17): Pinned hover flicker fix
//   - Skip hover state updates when sidebar is pinned (irrelevant)
//   - Added initial={false} to prevent mount animation
//   - Fixes flicker when hovering over pinned sidebar
// v1.6 (2025-12-17): Collapse on navigate fix
//   - Sidebar now collapses after clicking a nav item (when not pinned)
//   - Fixes issue where sidebar stayed expanded after navigation
//   - Better UX: click to navigate, sidebar gets out of the way
// v1.5 (2025-12-17): Pin toggle support
//   - Added pin button at bottom of sidebar
//   - When pinned, sidebar stays expanded (240px) regardless of hover
//   - Pin preference persists via SidebarContext (localStorage)
//   - Improves discoverability for users who prefer always-visible labels
// v1.4 (2025-12-16): URL routing support
//   - Added path property to navigation items for Link components
//   - Uses Link from react-router-dom for proper <a> tags
//   - Enables right-click "Open in new tab"
//   - Better accessibility and SEO
// v1.3 (2025-12-16): Added Diretório tab
//   - New navigation item for customer directory (search icon)
//   - Positioned after Clientes for logical grouping
// v1.2 (2025-11-30): UI improvements
//   - Header height h-[60px] to match top bar exactly
//   - More prominent active tab indicator (left accent bar)
//   - Added focus-visible states for accessibility
//   - Mobile drawer has improved active state
// v1.1 (2025-11-27): Added Lavpop logo
//   - Integrated LogoNoBackground.svg in header
//   - Logo adapts to collapsed/expanded states
// v1.0 (2025-11-27): Initial implementation
//   - Icon-only sidebar (60px collapsed, 240px expanded on hover)
//   - Smooth transitions with Framer Motion
//   - Mobile drawer mode (full screen)
//   - Active state indicators with lavpop-blue accent
//   - Dark mode support
//   - Tooltip fallback for collapsed state

import { BarChart3, Users, TrendingUp, Settings, MessageSquare, Upload, Search, Pin, PinOff, Share2, CloudSun } from 'lucide-react';
import { Link } from 'react-router-dom';
import LogoNoBackground from '../assets/LogoNoBackground.svg';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '../contexts/SidebarContext';

const IconSidebar = ({ activeTab, onNavigate }) => {
  const { isHovered, setIsHovered, isMobileOpen, toggleMobileSidebar, isPinned, togglePinned } = useSidebar();

  // Sidebar is expanded when pinned OR hovered
  const isExpanded = isPinned || isHovered;

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/' },
    { id: 'customers', label: 'Clientes', icon: Users, path: '/customers' },
    { id: 'diretorio', label: 'Diretório', icon: Search, path: '/diretorio' },
    { id: 'campaigns', label: 'Campanhas', icon: MessageSquare, path: '/campaigns' },
    { id: 'social', label: 'Redes Sociais', icon: Share2, path: '/social' },
    { id: 'weather', label: 'Clima', icon: CloudSun, path: '/weather' },
    { id: 'intelligence', label: 'Inteligência', icon: TrendingUp, path: '/intelligence' },
    { id: 'operations', label: 'Operações', icon: Settings, path: '/operations' },
    { id: 'upload', label: 'Importar', icon: Upload, path: '/upload' }
  ];

  const handleMobileNavigate = () => {
    if (isMobileOpen) {
      toggleMobileSidebar();
    }
  };

  // Collapse sidebar after clicking a nav item (unless pinned)
  const handleDesktopNavigate = () => {
    if (!isPinned) {
      setIsHovered(false);
    }
  };

  // Desktop Sidebar
  const DesktopSidebar = () => (
    <motion.aside
      className="hidden lg:flex fixed left-0 top-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex-col"
      initial={false}
      animate={{ width: isExpanded ? 240 : 60 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      onMouseEnter={() => !isPinned && setIsHovered(true)}
      onMouseLeave={() => !isPinned && setIsHovered(false)}
    >
      {/* Logo - Height matches top bar exactly (60px) */}
      <div className="h-[60px] flex items-center justify-center border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <motion.div
          className="flex items-center gap-2 overflow-hidden px-2"
          initial={false}
          animate={{ justifyContent: isExpanded ? 'flex-start' : 'center' }}
        >
          <img
            src={LogoNoBackground}
            alt="Lavpop"
            className="w-10 h-10 object-contain flex-shrink-0"
          />
          {isExpanded && (
            <motion.div
              initial={false}
              animate={{ opacity: 1, width: 'auto' }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                Lavpop<span className="text-lavpop-blue">BI</span>
              </span>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-6 px-2 overflow-y-auto">
        <div className="flex flex-col gap-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={handleDesktopNavigate}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  relative flex items-center gap-3 h-11 rounded-lg
                  transition-all duration-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavpop-blue focus-visible:ring-offset-2
                  ${isActive
                    ? 'bg-gradient-to-r from-lavpop-blue to-blue-600 text-white shadow-lg shadow-lavpop-blue/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }
                `}
                title={!isExpanded ? item.label : undefined}
              >
                {/* Active indicator - left accent bar when collapsed */}
                {isActive && !isExpanded && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-md" />
                )}
                <div className={`flex items-center justify-center ${isExpanded ? 'ml-3' : 'mx-auto'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {isExpanded && (
                  <span className="whitespace-nowrap text-sm font-semibold">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Pin Toggle Button */}
      <div className="p-2 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
        <button
          onClick={togglePinned}
          className={`
            w-full flex items-center gap-3 h-10 rounded-lg
            transition-all duration-200
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavpop-blue focus-visible:ring-offset-2
            ${isPinned
              ? 'text-lavpop-blue bg-lavpop-blue/10'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }
          `}
          title={!isExpanded ? (isPinned ? 'Desafixar menu' : 'Fixar menu') : undefined}
        >
          <div className={`flex items-center justify-center ${isExpanded ? 'ml-3' : 'mx-auto'}`}>
            {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          </div>
          {isExpanded && (
            <span className="whitespace-nowrap text-xs font-medium">
              {isPinned ? 'Desafixar menu' : 'Fixar menu'}
            </span>
          )}
        </button>
      </div>
    </motion.aside>
  );

  // Mobile Drawer
  const MobileDrawer = () => (
    <AnimatePresence>
      {isMobileOpen && (
        <motion.aside
          className="lg:hidden fixed left-0 top-0 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col"
          initial={{ x: -256 }}
          animate={{ x: 0 }}
          exit={{ x: -256 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {/* Logo - Height matches mobile top bar (56px = h-14) */}
          <div className="h-14 flex items-center px-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-2">
              <img
                src={LogoNoBackground}
                alt="Lavpop"
                className="w-10 h-10 object-contain"
              />
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                Lavpop<span className="text-lavpop-blue">BI</span>
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 py-6 px-3 overflow-y-auto">
            <div className="flex flex-col gap-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={handleMobileNavigate}
                    aria-current={isActive ? 'page' : undefined}
                    className={`
                      relative flex items-center gap-3 px-4 py-3 rounded-xl
                      transition-all duration-200 text-sm font-semibold
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavpop-blue
                      ${isActive
                        ? 'bg-gradient-to-r from-lavpop-blue to-blue-600 text-white shadow-lg shadow-lavpop-blue/25'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }
                    `}
                  >
                    {/* Active indicator - left accent bar */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                    )}
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                    {isActive && (
                      <div className="ml-auto flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        </motion.aside>
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
