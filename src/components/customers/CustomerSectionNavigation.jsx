// CustomerSectionNavigation.jsx v1.1
// Sticky section navigation tabs for Customers tab
// Design System v3.1 compliant
//
// CHANGELOG:
// v1.1 (2025-12-16): Removed Diretório, added progress indicator
//   - Diretório moved to separate route (/diretorio)
//   - Added progress dots showing current section
//   - Sections: Resumo, Ação, Análise
// v1.0 (2025-12-01): Initial implementation
//   - Sticky header with section tabs
//   - Smooth scroll to section
//   - Active section indicator

import React, { useState, useEffect, useCallback } from 'react';
import { LayoutGrid, AlertTriangle, BarChart3 } from 'lucide-react';

const SECTIONS = [
  { id: 'resumo-section', label: 'Resumo', shortLabel: 'Resumo', icon: LayoutGrid },
  { id: 'acao-section', label: 'Ação Imediata', shortLabel: 'Ação', icon: AlertTriangle },
  { id: 'analise-section', label: 'Análise', shortLabel: 'Análise', icon: BarChart3 }
];

const CustomerSectionNavigation = ({ className = '', hasAtRisk = true }) => {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const [isSticky, setIsSticky] = useState(false);

  // Filter sections based on whether there are at-risk customers
  const visibleSections = hasAtRisk
    ? SECTIONS
    : SECTIONS.filter(s => s.id !== 'acao-section');

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
    visibleSections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [visibleSections]);

  // Track sticky state - activate after scrolling past header
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 150);
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
        border-b border-slate-200/80 dark:border-slate-700/80
        transition-all duration-200
        -mx-3 sm:-mx-6 px-3 sm:px-6
        ${className}
      `}
      aria-label="Navegação de seções"
    >
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide py-2">
          {visibleSections.map(({ id, label, shortLabel, icon: Icon }) => {
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
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-700 dark:hover:text-slate-300'
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

          {/* Progress Indicator Dots */}
          <div className="hidden sm:flex items-center gap-1 ml-auto pr-2">
            {visibleSections.map(({ id }, idx) => {
              const isActive = activeSection === id;
              const isPast = visibleSections.findIndex(s => s.id === activeSection) > idx;

              return (
                <button
                  key={`dot-${id}`}
                  onClick={() => scrollToSection(id)}
                  className={`
                    w-2 h-2 rounded-full transition-all duration-300
                    ${isActive
                      ? 'w-6 bg-lavpop-blue dark:bg-blue-400'
                      : isPast
                      ? 'bg-lavpop-blue/50 dark:bg-blue-400/50'
                      : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
                    }
                  `}
                  aria-label={`Ir para ${visibleSections[idx].label}`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default CustomerSectionNavigation;
