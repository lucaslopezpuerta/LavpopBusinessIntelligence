// BottomNavBar.jsx v1.5 - THEME-AWARE COLORS FIX
// Mobile bottom navigation bar with 5 tabs
//
// FEATURES:
// - 5 primary navigation tabs
// - Fixed position at bottom with safe-area support
// - "Mais" tab opens sidebar drawer for secondary routes
// - Active state with stellar-cyan indicator
// - Backdrop blur with dark mode support
// - Only renders on mobile (< lg breakpoint)
// - Haptic feedback on tap (v1.1)
// - Landscape mode: reduced height, icon-only (v1.4)
//
// TABS (matches desktop sidebar order):
// 1. Dashboard (/)
// 2. Clientes (/customers)
// 3. Diretório (/diretorio)
// 4. Campanhas (/campaigns)
// 5. Mais (opens drawer)
//
// CHANGELOG:
// v1.5 (2026-01-16): Theme-aware colors fix
//   - Added useTheme hook for reliable dark mode detection
//   - Converted Tailwind dark: prefixes to JavaScript conditionals
//   - Matches proven LoadingScreen pattern for consistent theming
// v1.4 (2026-01-12): Landscape mode optimization
//   - Detects landscape orientation on mobile (max-height: 500px)
//   - Reduces nav height from 64px to 48px in landscape
//   - Passes isLandscape prop to BottomNavItem children
//   - Maximizes vertical screen space for content
// v1.3 (2025-12-26): Reliable safe area handling
//   - Added explicit height calc for nav container
//   - Background extends to screen edge (covers home indicator area)
//   - Nav content positioned above safe area
//   - Prevents content appearing below nav bar
// v1.2 (2025-12-22): Reordered tabs to match desktop sidebar (Clientes before Diretório)
// v1.1 (2025-12-18): Added haptic feedback on tab tap
// v1.0 (2025-12-18): Initial implementation

import React, { useCallback } from 'react';
import { haptics } from '../../utils/haptics';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { BarChart3, Search, Users, MessageSquare, Menu } from 'lucide-react';
import { useNavigation } from '../../contexts/NavigationContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useTheme } from '../../contexts/ThemeContext';
import BottomNavItem from './BottomNavItem';

// Navigation items for bottom bar (5 tabs)
// Order matches desktop sidebar: Dashboard → Clientes → Diretório → Campanhas
const BOTTOM_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/' },
  { id: 'customers', label: 'Clientes', icon: Users, path: '/customers' },
  { id: 'diretorio', label: 'Diretório', icon: Search, path: '/diretorio' },
  { id: 'campaigns', label: 'Campanhas', icon: MessageSquare, path: '/campaigns' },
];

// Routes accessible via "More" drawer
const MORE_ROUTES = ['social', 'weather', 'intelligence', 'operations', 'upload'];

const BottomNavBar = () => {
  const { activeTab } = useNavigation();
  const { toggleMobileSidebar } = useSidebar();
  const { isDark } = useTheme();

  // Detect landscape orientation on mobile devices
  // Only triggers when height is below 500px (excludes tablets in landscape)
  const isLandscape = useMediaQuery('(orientation: landscape) and (max-height: 500px)');

  // Check if current tab is one of the "More" routes
  const isMoreActive = MORE_ROUTES.includes(activeTab);

  // Wrap sidebar toggle with haptic feedback
  const handleMoreClick = useCallback(() => {
    haptics.light();
    toggleMobileSidebar();
  }, [toggleMobileSidebar]);

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40"
      aria-label="Navegação principal"
      style={{
        // Height = nav content + safe area inset
        // Landscape mode uses 48px, portrait uses 64px
        height: isLandscape
          ? 'calc(48px + env(safe-area-inset-bottom, 0px))'
          : 'calc(64px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Background layer - extends to screen edge */}
      <div className={`absolute inset-0 ${isDark ? 'bg-space-dust' : 'bg-white/90'} backdrop-blur-xl border-t ${isDark ? 'border-stellar-cyan/15' : 'border-stellar-cyan/10'} ${isDark ? 'shadow-[0_-4px_24px_-4px_rgba(0,174,239,0.1)]' : 'shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)]'}`} />

      {/* Nav content - positioned at top, above safe area */}
      {/* Landscape mode uses h-12 (48px), portrait uses h-16 (64px) */}
      <div className={`relative flex items-center justify-around ${isLandscape ? 'h-12' : 'h-16'} px-1`}>
        {/* Main navigation items */}
        {BOTTOM_NAV_ITEMS.map((item) => (
          <BottomNavItem
            key={item.id}
            id={item.id}
            label={item.label}
            icon={item.icon}
            path={item.path}
            isActive={activeTab === item.id}
            isLandscape={isLandscape}
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
          isLandscape={isLandscape}
        />
      </div>
    </nav>
  );
};

export default BottomNavBar;
