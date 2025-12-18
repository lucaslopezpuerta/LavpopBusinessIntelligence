// ScrollIndicator.jsx v1.0
// Horizontal scroll indicator for wide content on mobile
//
// FEATURES:
// - Shows scroll arrows when content overflows
// - Fades arrows based on scroll position
// - Touch-friendly scroll behavior
// - Dark mode support
// - Auto-hides when not needed
//
// USAGE:
// <ScrollIndicator>
//   <table>...</table>
// </ScrollIndicator>
//
// CHANGELOG:
// v1.0 (2025-12-18): Initial implementation

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Horizontal scroll indicator wrapper
 */
const ScrollIndicator = ({
  children,
  className = '',
  showHint = true,
  hintText = 'Deslize para ver mais',
}) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(false);

  // Check scroll position and update indicators
  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const hasOverflow = scrollWidth > clientWidth;

    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    setShowScrollHint(hasOverflow && showHint);
  }, [showHint]);

  // Scroll by amount
  const scroll = useCallback((direction) => {
    const el = scrollRef.current;
    if (!el) return;

    const scrollAmount = el.clientWidth * 0.5;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  // Setup scroll listener
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  // Hide hint after user scrolls
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let hasScrolled = false;
    const handleScroll = () => {
      if (!hasScrolled) {
        hasScrolled = true;
        setShowScrollHint(false);
      }
    };

    el.addEventListener('scroll', handleScroll, { once: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Left scroll indicator */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="
            absolute left-0 top-0 bottom-0 z-10
            w-8 flex items-center justify-center
            bg-gradient-to-r from-white via-white/80 to-transparent
            dark:from-slate-800 dark:via-slate-800/80
            transition-opacity duration-200
          "
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
      )}

      {/* Right scroll indicator */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="
            absolute right-0 top-0 bottom-0 z-10
            w-8 flex items-center justify-center
            bg-gradient-to-l from-white via-white/80 to-transparent
            dark:from-slate-800 dark:via-slate-800/80
            transition-opacity duration-200
          "
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
      )}

      {/* Scroll hint */}
      {showScrollHint && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 lg:hidden">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 dark:bg-slate-700/90 text-white text-xs rounded-full shadow-lg backdrop-blur-sm animate-pulse">
            <ChevronLeft className="w-3 h-3" />
            <span>{hintText}</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {children}
      </div>
    </div>
  );
};

export default ScrollIndicator;
