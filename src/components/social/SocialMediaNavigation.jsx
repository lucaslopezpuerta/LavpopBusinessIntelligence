// SocialMediaNavigation.jsx v2.1 - FRAMER MOTION LAYOUT ANIMATION
// Tab navigation for Social Media view
// Design System v6.4 compliant - Variant D (Glassmorphism)
//
// CHANGELOG:
// v2.1 (2026-02-10): Framer Motion layoutId for glitch-free tab switching
//   - Active indicator uses motion.div with layoutId (slides between tabs)
//   - No more CSS gradient transitions (they can't interpolate)
//   - Button content layered above animated background
//   - Spring physics for snappy, natural tab sliding
// v2.0 (2026-02-10): Cosmic glassmorphism redesign
// v1.5 (2026-02-03): Added WhatChimp tab
// v1.4 (2026-01-12): Sidebar awareness + non-sticky
// v1.3 (2025-12-19): Added Google Business tab
// v1.2 (2025-12-19): Added Blacklist tab
// v1.1 (2025-12-18): Added WhatsApp tab
// v1.0 (2025-12-18): Initial implementation

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { Instagram, Facebook, MessageCircle, ShieldOff, Building2, Zap } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';
import { useTheme } from '../../contexts/ThemeContext';

const SocialMediaNavigation = ({ activeSection, onSectionChange }) => {
  const scrollRef = useRef(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const { isDark } = useTheme();
  const { isMobileOpen } = useSidebar();

  const sections = [
    {
      id: 'instagram',
      label: 'Instagram',
      icon: Instagram,
      available: true,
      activeGradient: 'linear-gradient(to right, #ec4899, #f43f5e)',
      activeShadow: '0 10px 15px -3px rgba(236, 72, 153, 0.25)',
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      available: true,
      activeGradient: 'linear-gradient(to right, #22c55e, #10b981)',
      activeShadow: '0 10px 15px -3px rgba(34, 197, 94, 0.25)',
    },
    {
      id: 'whatchimp',
      label: 'WhatChimp',
      icon: Zap,
      available: true,
      activeGradient: 'linear-gradient(to right, #06b6d4, #14b8a6)',
      activeShadow: '0 10px 15px -3px rgba(6, 182, 212, 0.25)',
    },
    {
      id: 'blacklist',
      label: 'Blacklist',
      icon: ShieldOff,
      available: true,
      activeGradient: 'linear-gradient(to right, #ef4444, #f43f5e)',
      activeShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.25)',
    },
    {
      id: 'google',
      label: 'Google Business',
      icon: Building2,
      available: true,
      activeGradient: 'linear-gradient(to right, #3b82f6, #2563eb)',
      activeShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.25)',
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: Facebook,
      available: false,
      activeGradient: 'linear-gradient(to right, #3b82f6, #6366f1)',
      activeShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.25)',
    }
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
      aria-label="Navegação de plataformas sociais"
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

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (section.available && onSectionChange) {
                      onSectionChange(section.id);
                    }
                  }}
                  disabled={!section.available}
                  className={`
                    relative flex items-center justify-center
                    w-10 h-10 sm:w-auto sm:h-auto sm:gap-2 sm:px-5 sm:py-2.5
                    rounded-xl text-sm font-medium whitespace-nowrap
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan focus-visible:ring-offset-2
                    ${isDark ? 'focus-visible:ring-offset-space-dust' : 'focus-visible:ring-offset-white'}
                    ${!section.available
                      ? isDark
                        ? 'bg-space-dust/30 text-slate-600 cursor-not-allowed opacity-50'
                        : 'bg-slate-100/60 text-slate-400 cursor-not-allowed opacity-50'
                      : isActive
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
                  {isActive && section.available && (
                    <motion.div
                      layoutId="social-nav-active"
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: section.activeGradient,
                        boxShadow: section.activeShadow,
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
                    {!section.available && (
                      <span className={`hidden sm:inline text-[10px] leading-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        (Em breve)
                      </span>
                    )}
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

export default SocialMediaNavigation;
