// SocialMediaNavigation.jsx v1.5 - WHATCHIMP TAB
// Tab navigation for Social Media view
// Design System v4.0 compliant
//
// CHANGELOG:
// v1.5 (2026-02-03): Added WhatChimp tab
//   - New WhatChimp Sync Analytics tab with cyan/teal theme
//   - Uses Zap icon for sync/automation concept
// v1.4 (2026-01-12): Sidebar awareness + non-sticky
//   - Removed sticky positioning (nav scrolls with content)
//   - Added sidebar awareness - hides when mobile sidebar is open
//   - Top bar already handles safe area, no pt-safe needed here
// v1.3 (2025-12-19): Added Google Business tab
//   - Google Business Profile analytics integration
//   - Google-branded blue color scheme
// v1.2 (2025-12-19): Added Blacklist tab
//   - Moved BlacklistManager from Campaigns view
//   - Blacklist logically belongs with WhatsApp messaging
// v1.1 (2025-12-18): Added WhatsApp tab
//   - Moved WhatsApp analytics from Campaigns view
//   - WhatsApp Business API metrics now under Social Media
// v1.0 (2025-12-18): Initial implementation
//   - Instagram tab (active)
//   - Facebook tab (placeholder for future)
//   - Same design pattern as CampaignSectionNavigation

import React, { useRef, useState, useEffect } from 'react';
import { Instagram, Facebook, MessageCircle, ShieldOff, Building2, Zap } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';

const SocialMediaNavigation = ({ activeSection, onSectionChange }) => {
  const scrollRef = useRef(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  // Get sidebar state to hide nav when mobile sidebar is open
  const { isMobileOpen } = useSidebar();

  const sections = [
    {
      id: 'instagram',
      label: 'Instagram',
      icon: Instagram,
      mobileLabel: 'IG',
      available: true,
      colors: {
        active: 'bg-gradient-to-r from-pink-500 to-rose-500 shadow-pink-500/25',
        hover: 'hover:border-pink-300 dark:hover:border-pink-700 hover:text-pink-600 dark:hover:text-pink-400'
      }
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      mobileLabel: 'WA',
      available: true,
      colors: {
        active: 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-green-500/25',
        hover: 'hover:border-green-300 dark:hover:border-green-700 hover:text-green-600 dark:hover:text-green-400'
      }
    },
    {
      id: 'whatchimp',
      label: 'WhatChimp',
      icon: Zap,
      mobileLabel: 'WC',
      available: true,
      colors: {
        active: 'bg-gradient-to-r from-cyan-500 to-teal-500 shadow-cyan-500/25',
        hover: 'hover:border-cyan-300 dark:hover:border-cyan-700 hover:text-cyan-600 dark:hover:text-cyan-400'
      }
    },
    {
      id: 'blacklist',
      label: 'Blacklist',
      icon: ShieldOff,
      mobileLabel: 'BL',
      available: true,
      colors: {
        active: 'bg-gradient-to-r from-red-500 to-rose-500 shadow-red-500/25',
        hover: 'hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400'
      }
    },
    {
      id: 'google',
      label: 'Google Business',
      icon: Building2,
      mobileLabel: 'GMB',
      available: true,
      colors: {
        // Google blue: #4285F4
        active: 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-500/25',
        hover: 'hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400'
      }
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: Facebook,
      mobileLabel: 'FB',
      available: false,
      colors: {
        active: 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-blue-500/25',
        hover: 'hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400'
      }
    }
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
      checkScroll();
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

  // Hide nav when mobile sidebar is open (z-40 would overlap with sidebar z-40)
  if (isMobileOpen) {
    return null;
  }

  return (
    <nav
      className="-mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 py-2 sm:py-3 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800"
      aria-label="Navegação de plataformas sociais"
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
                onClick={() => section.available && onSectionChange(section.id)}
                disabled={!section.available}
                className={`
                  flex items-center justify-center gap-1.5 sm:gap-2
                  min-w-[44px] sm:min-w-0 px-3 sm:px-4 py-2.5 sm:py-2
                  rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap
                  transition-all duration-200
                  ${!section.available
                    ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                    : isActive
                      ? `${section.colors.active} text-white shadow-lg`
                      : `bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 ${section.colors.hover}`
                  }
                `}
                aria-current={isActive ? 'true' : undefined}
              >
                <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">{section.label}</span>
                <span className="sm:hidden">{section.mobileLabel}</span>
                {!section.available && (
                  <span className="hidden sm:inline text-[10px] opacity-70 ml-1">(Em breve)</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default SocialMediaNavigation;
