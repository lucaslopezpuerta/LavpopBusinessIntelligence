// BottomNavBar.jsx v1.1 - HAPTIC FEEDBACK
// Mobile bottom navigation bar with 5 tabs
//
// FEATURES:
// - 5 primary navigation tabs
// - Fixed position at bottom with safe-area support
// - "Mais" tab opens sidebar drawer for secondary routes
// - Active state with lavpop-blue indicator
// - Backdrop blur with dark mode support
// - Only renders on mobile (< lg breakpoint)
// - Haptic feedback on tap (v1.1)
//
// TABS:
// 1. Dashboard (/)
// 2. Diretório (/diretorio)
// 3. Clientes (/customers)
// 4. Campanhas (/campaigns)
// 5. Mais (opens drawer)
//
// CHANGELOG:
// v1.1 (2025-12-18): Added haptic feedback on tab tap
// v1.0 (2025-12-18): Initial implementation

import React, { useCallback } from 'react';
import { haptics } from '../../utils/haptics';
import { BarChart3, Search, Users, MessageSquare, Menu } from 'lucide-react';
import { useNavigation } from '../../contexts/NavigationContext';
import { useSidebar } from '../../contexts/SidebarContext';
import BottomNavItem from './BottomNavItem';

// Navigation items for bottom bar (5 tabs)
const BOTTOM_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/' },
  { id: 'diretorio', label: 'Diretório', icon: Search, path: '/diretorio' },
  { id: 'customers', label: 'Clientes', icon: Users, path: '/customers' },
  { id: 'campaigns', label: 'Campanhas', icon: MessageSquare, path: '/campaigns' },
];

// Routes accessible via "More" drawer
const MORE_ROUTES = ['social', 'weather', 'intelligence', 'operations', 'upload'];

const BottomNavBar = () => {
  const { activeTab } = useNavigation();
  const { toggleMobileSidebar } = useSidebar();

  // Check if current tab is one of the "More" routes
  const isMoreActive = MORE_ROUTES.includes(activeTab);

  // Wrap sidebar toggle with haptic feedback
  const handleMoreClick = useCallback(() => {
    haptics.light();
    toggleMobileSidebar();
  }, [toggleMobileSidebar]);

  return (
    <nav
      className="
        lg:hidden fixed bottom-0 inset-x-0 z-40
        bg-white/95 dark:bg-slate-900/95
        backdrop-blur-lg
        border-t border-slate-200/80 dark:border-slate-800/80
        shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]
        dark:shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.3)]
        bottom-nav-safe
      "
      aria-label="Navegação principal"
    >
      <div className="flex items-center justify-around h-16 px-1">
        {/* Main navigation items */}
        {BOTTOM_NAV_ITEMS.map((item) => (
          <BottomNavItem
            key={item.id}
            id={item.id}
            label={item.label}
            icon={item.icon}
            path={item.path}
            isActive={activeTab === item.id}
          />
        ))}

        {/* "Mais" button - opens drawer for secondary navigation */}
        <BottomNavItem
          id="more"
          label="Mais"
          icon={Menu}
          isActive={isMoreActive}
          isButton={true}
          onClick={handleMoreClick}
        />
      </div>
    </nav>
  );
};

export default BottomNavBar;
