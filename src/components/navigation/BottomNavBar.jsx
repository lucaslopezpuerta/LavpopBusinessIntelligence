// BottomNavBar.jsx v2.2 - TRANSITIONING FLAG SUPPORT
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
// - React Portal for isolation (v1.7)
// - Passes isTransitioning to children to disable CSS transitions during page animations (v2.2)
//
// TABS (matches desktop sidebar order):
// 1. Dashboard (/)
// 2. Clientes (/customers)
// 3. Diretório (/diretorio)
// 4. Campanhas (/campaigns)
// 5. Mais (opens drawer)
//
// CHANGELOG:
// v2.2 (2026-01-25): Transitioning flag support
//   - Gets isTransitioning from NavigationContext
//   - Passes isTransitioning to BottomNavItem children
//   - Fixes BottomNavBar fade during page transitions
// v2.1 (2026-01-25): Cleanup - removed unsuccessful fix attempts
//   - Removed extra CSS properties that didn't fix the fade issue
//   - Restored backdrop-blur (the issue is not caused by this)
//   - Kept Portal and memo (good architecture)
// v1.6 (2026-01-24): Memoized for transition stability
// v1.5 (2026-01-16): Theme-aware colors fix
// v1.4 (2026-01-12): Landscape mode optimization
// v1.3 (2025-12-26): Reliable safe area handling
// v1.2 (2025-12-22): Reordered tabs to match desktop sidebar
// v1.1 (2025-12-18): Added haptic feedback on tab tap
// v1.0 (2025-12-18): Initial implementation

import { useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
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
  const { activeTab, isTransitioning } = useNavigation();
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

  // Render nav content via Portal at document.body level
  const navContent = (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40"
      aria-label="Navegação principal"
      style={{
        height: isLandscape
          ? 'calc(48px + env(safe-area-inset-bottom, 0px))'
          : 'calc(64px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Background layer - extends to screen edge */}
      <div className={`absolute inset-0 ${isDark ? 'bg-space-dust' : 'bg-white/90'} backdrop-blur-xl border-t ${isDark ? 'border-stellar-cyan/15' : 'border-stellar-cyan/10'} ${isDark ? 'shadow-[0_-4px_24px_-4px_rgba(0,174,239,0.1)]' : 'shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)]'}`} />

      {/* Nav content - positioned at top, above safe area */}
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
            isTransitioning={isTransitioning}
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
          isTransitioning={isTransitioning}
        />
      </div>
    </nav>
  );

  // Portal renders outside the React tree
  return createPortal(navContent, document.body);
};

export default memo(BottomNavBar);
