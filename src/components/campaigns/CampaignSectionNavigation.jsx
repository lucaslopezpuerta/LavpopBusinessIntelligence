// CampaignSectionNavigation.jsx v2.8 - SIDEBAR AWARENESS
// Tab navigation for Campaigns view
// Design System v4.0 compliant
//
// CHANGELOG:
// v2.8 (2026-01-12): Sidebar awareness
//   - Added useSidebar hook to detect mobile drawer state
//   - Returns null when mobile sidebar is open to prevent z-index conflicts
//   - Same pattern as SocialMediaNavigation v1.4
// v2.7 (2026-01-09): Active state enhancement
//   - Added scale-[1.02] transform on active tab for premium feel
//   - Enhanced visual feedback with scale + shadow combination
// v2.6 (2026-01-09): Robust click handler
//   - Added preventDefault and stopPropagation to click handler
//   - Guard check for onSectionChange callback existence
//   - Ensures click events are not captured by parent elements
// v2.5 (2026-01-09): Fix button click handling
//   - Added relative z-20 to scrollable container (above fade indicators z-10)
//   - Added explicit type="button" to prevent form submission behavior
//   - Removed sticky positioning to fix z-index conflicts
//   - Navigation now scrolls with content
// v2.3 (2025-12-19): Moved Blacklist to Social Media view
//   - Removed 'blacklist' tab (now in SocialMediaNavigation)
//   - Blacklist logically belongs with WhatsApp messaging
// v2.2 (2025-12-18): Moved WhatsApp to Social Media view
//   - Removed 'whatsapp' tab (now in SocialMediaNavigation)
// v2.1 (2025-12-17): Added WhatsApp analytics tab
//   - New 'whatsapp' section for WABA analytics
//   - Shows conversation costs and delivery metrics
// v2.0 (2025-12-11): Design System v4.0 mobile improvements
//   - Active tab uses gradient styling with shadow
//   - Improved touch targets (min 44px height)
//   - Better visual hierarchy with icon-only on small mobile
//   - Scroll fade indicators on edges
//   - Smoother transitions
// v1.1 (2025-12-08): Added Blacklist section

import React, { useRef, useState, useEffect } from 'react';
import { Target, Zap, Users, MessageSquare, History } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';

const CampaignSectionNavigation = ({ activeSection, onSectionChange }) => {
  // Get sidebar state to hide nav when mobile sidebar is open
  const { isMobileOpen } = useSidebar();
  const scrollRef = useRef(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);

  const sections = [
    { id: 'overview', label: 'Visão Geral', icon: Target, mobileLabel: 'Geral' },
    { id: 'automations', label: 'Automações', icon: Zap, mobileLabel: 'Auto' },
    { id: 'audience', label: 'Audiência', icon: Users, mobileLabel: 'Público' },
    { id: 'templates', label: 'Mensagens', icon: MessageSquare, mobileLabel: 'Msgs' },
    { id: 'history', label: 'Histórico', icon: History, mobileLabel: 'Hist' }
  ];

  // Check scroll position for fade indicators
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftFade(scrollLeft > 8);
      setShowRightFade(scrollLeft < scrollWidth - clientWidth - 8);
    }
  };

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', checkScroll);
      // Initial check
      checkScroll();
      // Check on resize
      window.addEventListener('resize', checkScroll);
      return () => {
        scrollEl.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, []);

  // Scroll active tab into view on mount/change
  useEffect(() => {
    if (scrollRef.current) {
      const activeButton = scrollRef.current.querySelector('[aria-current="true"]');
      if (activeButton) {
        activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeSection]);

  // Hide nav when mobile sidebar is open to prevent z-index conflicts
  if (isMobileOpen) {
    return null;
  }

  return (
    <nav
      className="-mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 py-2 sm:py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800"
      aria-label="Navegação de seções de campanhas"
    >
      <div className="relative">
        {/* Left fade indicator */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-50 dark:from-slate-900 to-transparent z-10 pointer-events-none transition-opacity duration-200 ${showLeftFade ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Right fade indicator */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-50 dark:from-slate-900 to-transparent z-10 pointer-events-none transition-opacity duration-200 ${showRightFade ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Scrollable container - z-20 ensures buttons are above fade indicators */}
        <div
          ref={scrollRef}
          className="relative z-20 flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
        >
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            const handleClick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onSectionChange) {
                onSectionChange(section.id);
              }
            };

            return (
              <button
                type="button"
                key={section.id}
                onClick={handleClick}
                className={`
                  flex items-center justify-center gap-1.5 sm:gap-2
                  min-w-[44px] sm:min-w-0 px-3 sm:px-4 py-2.5 sm:py-2
                  rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap
                  transition-all duration-200
                  ${isActive
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/25 scale-[1.02]'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 hover:text-purple-600 dark:hover:text-purple-400'
                  }
                `}
                aria-current={isActive ? 'true' : undefined}
              >
                <Icon className="w-4 h-4 flex-shrink-0 hidden sm:block" aria-hidden="true" />
                <span className="hidden sm:inline">{section.label}</span>
                <span className="sm:hidden">{section.mobileLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default CampaignSectionNavigation;
