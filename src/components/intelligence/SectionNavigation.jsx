// SectionNavigation.jsx v1.1
// Sticky section navigation tabs for Intelligence tab
// Design System v3.0 compliant
//
// CHANGELOG:
// v1.1 (2025-11-30): Fixed positioning
//   - Positioned below app header (top-14 mobile, top-[60px] desktop)
//   - Uses z-30 to stay below app header (z-40)
//   - More subtle design that doesn't intrude
// v1.0 (2025-11-30): Initial implementation
//   - Sticky header with section tabs
//   - Smooth scroll to section
//   - Active section indicator

import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Cloud, TrendingUp, Target } from 'lucide-react';

const SECTIONS = [
  { id: 'profitability-section', label: 'Rentabilidade', shortLabel: 'Rent.', icon: DollarSign },
  { id: 'weather-section', label: 'Clima', shortLabel: 'Clima', icon: Cloud },
  { id: 'growth-section', label: 'Crescimento', shortLabel: 'Cresc.', icon: TrendingUp },
  { id: 'campaigns-section', label: 'Campanhas', shortLabel: 'Camp.', icon: Target }
];

const SectionNavigation = ({ className = '' }) => {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const [isSticky, setIsSticky] = useState(false);

  // Track which section is in view
  useEffect(() => {
    const observerOptions = {
      root: null,
      // Adjust for both app header (60px) and this nav (~44px)
      rootMargin: '-120px 0px -60% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    // Observe all sections
    SECTIONS.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  // Track sticky state - activate after scrolling past hero section
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll to section
  const scrollToSection = useCallback((sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // Account for app header (60px) + this nav (~44px) + some padding
      const headerOffset = 120;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  return (
    <nav
      className={`
        ${isSticky
          ? 'sticky top-14 lg:top-[60px] z-30 shadow-sm'
          : 'relative'
        }
        bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm
        border-b border-gray-200/80 dark:border-slate-700/80
        transition-all duration-200
        ${className}
      `}
      aria-label="Navegação de seções"
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide py-2">
          {SECTIONS.map(({ id, label, shortLabel, icon: Icon }) => {
            const isActive = activeSection === id;

            return (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className={`
                  flex items-center gap-1.5 sm:gap-2
                  px-2.5 sm:px-3 py-1.5 sm:py-2
                  rounded-lg
                  text-xs sm:text-sm font-medium
                  whitespace-nowrap
                  transition-all duration-200
                  ${isActive
                    ? 'bg-lavpop-blue/10 dark:bg-lavpop-blue/20 text-lavpop-blue dark:text-blue-400'
                    : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/50 hover:text-gray-700 dark:hover:text-slate-300'
                  }
                `}
                aria-current={isActive ? 'true' : undefined}
              >
                <Icon
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                    isActive ? 'text-lavpop-blue dark:text-blue-400' : ''
                  }`}
                  aria-hidden="true"
                />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default SectionNavigation;
