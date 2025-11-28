// IconSidebar.jsx v1.0
// Minimalist icon-only sidebar with hover-to-expand functionality
//
// CHANGELOG:
// v1.0 (2025-11-27): Initial implementation
//   - Icon-only sidebar (60px collapsed, 240px expanded on hover)
//   - Smooth transitions with Framer Motion
//   - Mobile drawer mode (full screen)
//   - Active state indicators with lavpop-blue accent
//   - Dark mode support
//   - Tooltip fallback for collapsed state

import React from 'react';
import { BarChart3, Users, TrendingUp, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '../contexts/SidebarContext';

const IconSidebar = ({ activeTab, onNavigate }) => {
  const { isHovered, setIsHovered, isMobileOpen, toggleMobileSidebar } = useSidebar();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'intelligence', label: 'Inteligência', icon: TrendingUp },
    { id: 'operations', label: 'Operações', icon: Settings }
  ];

  const handleNavigate = (tabId) => {
    onNavigate(tabId);
    if (isMobileOpen) {
      toggleMobileSidebar();
    }
  };

  // Desktop Sidebar
  const DesktopSidebar = () => (
    <motion.aside
      className="hidden lg:flex fixed left-0 top-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex-col"
      initial={{ width: 60 }}
      animate={{ width: isHovered ? 240 : 60 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <motion.div
          className="flex items-center gap-2 overflow-hidden"
          initial={false}
          animate={{ justifyContent: isHovered ? 'flex-start' : 'center' }}
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-lavpop-blue to-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  Lavpop<span className="text-lavpop-blue">BI</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-6 px-2 overflow-y-auto">
        <div className="flex flex-col gap-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`
                  relative flex items-center gap-3 h-10 rounded-lg
                  transition-all duration-200
                  ${isActive
                    ? 'bg-lavpop-blue text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }
                `}
                title={!isHovered ? item.label : undefined}
              >
                <div className={`flex items-center justify-center ${isHovered ? 'ml-3' : 'mx-auto'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <AnimatePresence>
                  {isHovered && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden whitespace-nowrap text-sm font-medium"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && !isHovered && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-l-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
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
          {/* Logo */}
          <div className="h-16 flex items-center px-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-lavpop-blue to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">L</span>
              </div>
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
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg
                      transition-all duration-200 text-sm font-medium
                      ${isActive
                        ? 'bg-lavpop-blue text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
                  </button>
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
