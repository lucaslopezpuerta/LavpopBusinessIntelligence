// CampaignSectionNavigation.jsx v2.1
// Tab navigation for Campaigns view
// Design System v4.0 compliant
//
// CHANGELOG:
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
import { Target, Zap, Users, MessageSquare, History, ShieldOff, MessageCircle } from 'lucide-react';

const CampaignSectionNavigation = ({ activeSection, onSectionChange }) => {
  const scrollRef = useRef(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);

  const sections = [
    { id: 'overview', label: 'Visão Geral', icon: Target, mobileLabel: 'Geral' },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, mobileLabel: 'WA' },
    { id: 'automations', label: 'Automações', icon: Zap, mobileLabel: 'Auto' },
    { id: 'audience', label: 'Audiência', icon: Users, mobileLabel: 'Público' },
    { id: 'templates', label: 'Mensagens', icon: MessageSquare, mobileLabel: 'Msgs' },
    { id: 'blacklist', label: 'Blacklist', icon: ShieldOff, mobileLabel: 'Block' },
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

  return (
    <nav
      className="sticky top-14 lg:top-[60px] z-40 -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 py-2 sm:py-3 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800"
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

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
        >
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`
                  flex items-center justify-center gap-1.5 sm:gap-2
                  min-w-[44px] sm:min-w-0 px-3 sm:px-4 py-2.5 sm:py-2
                  rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap
                  transition-all duration-200
                  ${isActive
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/25'
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
