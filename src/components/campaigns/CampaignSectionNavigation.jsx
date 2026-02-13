// CampaignSectionNavigation.jsx v3.0 - FRAMER MOTION LAYOUT ANIMATION
// Tab navigation for Campaigns view
// Design System v6.4 compliant - Variant D (Glassmorphism)
//
// CHANGELOG:
// v3.0 (2026-02-12): Framer Motion layoutId for smooth tab sliding
//   - Active indicator uses motion.div with layoutId="campaign-nav-active"
//   - Per-tab colors via semanticColors from colorMapping.js (no hardcoded hex)
//   - useTheme() hook replaces Tailwind dark: prefix (Variant D pattern)
//   - Icon-only on mobile, icon+label on desktop
//   - Spring physics for snappy, natural tab sliding
//   - Fixed checkScroll useCallback + useEffect dependency
//   - Fixed showRightFade initial state (false, not true)
//   - Removed static bg/border nav wrapper (clean py-2 sm:py-3)
//   - Fade indicators use inline isDark styles (#020910/#ECEFF4)
// v2.8 (2026-01-12): Sidebar awareness
//   - Added useSidebar hook to detect mobile drawer state
//   - Returns null when mobile sidebar is open to prevent z-index conflicts
//   - Same pattern as SocialMediaNavigation v1.4
// v2.7 (2026-01-09): Active state enhancement
// v2.6 (2026-01-09): Robust click handler
// v2.5 (2026-01-09): Fix button click handling
// v2.3 (2025-12-19): Moved Blacklist to Social Media view
// v2.2 (2025-12-18): Moved WhatsApp to Social Media view
// v2.0 (2025-12-11): Design System v4.0 mobile improvements
// v1.1 (2025-12-08): Added Blacklist section

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { Target, Zap, Users, MessageSquare, History, Activity } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';
import { useTheme } from '../../contexts/ThemeContext';
import { semanticColors, hexToRgba } from '../../utils/colorMapping';

const CampaignSectionNavigation = ({ activeSection, onSectionChange }) => {
  const { isMobileOpen } = useSidebar();
  const { isDark } = useTheme();
  const scrollRef = useRef(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const sections = [
    { id: 'overview', label: 'Visão Geral', icon: Target, colorKey: 'blue' },
    { id: 'automations', label: 'Automações', icon: Zap, colorKey: 'revenue' },
    { id: 'audience', label: 'Audiência', icon: Users, colorKey: 'profit' },
    { id: 'templates', label: 'Mensagens', icon: MessageSquare, colorKey: 'cyan' },
    { id: 'history', label: 'Histórico', icon: History, colorKey: 'warning' },
    { id: 'monitor', label: 'Monitor', icon: Activity, colorKey: 'cost' }
  ];

  // Check scroll position for fade indicators
  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftFade(scrollLeft > 8);
      setShowRightFade(scrollLeft < scrollWidth - clientWidth - 8);
    }
  }, []);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', checkScroll, { passive: true });
      checkScroll();
      window.addEventListener('resize', checkScroll);
      return () => {
        scrollEl.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [checkScroll]);

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
      className="py-2 sm:py-3"
      aria-label="Navegação de seções de campanhas"
    >
      <div className="relative">
        {/* Left fade indicator */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none transition-opacity duration-200 ${showLeftFade ? 'opacity-100' : 'opacity-0'}`}
          style={{
            background: isDark
              ? 'linear-gradient(to right, #020910, transparent)'
              : 'linear-gradient(to right, #ECEFF4, transparent)'
          }}
        />

        {/* Right fade indicator */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none transition-opacity duration-200 ${showRightFade ? 'opacity-100' : 'opacity-0'}`}
          style={{
            background: isDark
              ? 'linear-gradient(to left, #020910, transparent)'
              : 'linear-gradient(to left, #ECEFF4, transparent)'
          }}
        />

        {/* Scrollable container */}
        <LayoutGroup>
          <div
            ref={scrollRef}
            className="relative z-20 flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
          >
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              const colors = semanticColors[section.colorKey];

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onSectionChange) {
                      onSectionChange(section.id);
                    }
                  }}
                  className={`
                    relative flex items-center justify-center
                    w-10 h-10 sm:w-auto sm:h-auto sm:gap-2 sm:px-5 sm:py-2.5
                    rounded-xl text-sm font-medium whitespace-nowrap
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan focus-visible:ring-offset-2
                    ${isDark ? 'focus-visible:ring-offset-space-dust' : 'focus-visible:ring-offset-white'}
                    ${isActive
                      ? 'text-white'
                      : isDark
                        ? 'bg-space-dust/50 text-slate-300 border border-white/[0.06] hover:bg-space-elevated/60 hover:text-white hover:border-white/10 transition-colors duration-150'
                        : 'bg-white/80 text-slate-600 border border-slate-200/60 hover:bg-white hover:text-slate-900 hover:border-slate-300 transition-colors duration-150'
                    }
                  `}
                  aria-label={section.label}
                  aria-current={isActive ? 'true' : undefined}
                >
                  {/* Animated active background — slides between tabs */}
                  {isActive && (
                    <motion.div
                      layoutId="campaign-nav-active"
                      className={`absolute inset-0 rounded-xl bg-gradient-to-r ${colors.gradient}`}
                      style={{
                        boxShadow: `0 10px 15px -3px ${hexToRgba(colors.accentColor[isDark ? 'dark' : 'light'], 0.25)}`,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 35,
                      }}
                    />
                  )}

                  {/* Content — layered above animated background */}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">{section.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      </div>
    </nav>
  );
};

export default CampaignSectionNavigation;
