// useMediaQuery.js v1.0
// Custom hook for responsive design using matchMedia API
// More performant than window resize listeners
//
// CHANGELOG:
// v1.0 (2025-11-30): Initial implementation
//   - Uses matchMedia API for better performance
//   - SSR safe with fallback
//   - Includes preset breakpoints matching Tailwind

import { useState, useEffect } from 'react';

/**
 * Custom hook that uses matchMedia API for responsive design
 * @param {string} query - Media query string (e.g., '(max-width: 768px)')
 * @returns {boolean} - Whether the media query matches
 */
export function useMediaQuery(query) {
  // SSR safe: default to false on server
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQueryList = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQueryList.matches);

    // Modern approach: use addEventListener
    const handleChange = (event) => {
      setMatches(event.matches);
    };

    // Use the modern API if available, fallback to deprecated addListener
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleChange);
      return () => mediaQueryList.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQueryList.addListener(handleChange);
      return () => mediaQueryList.removeListener(handleChange);
    }
  }, [query]);

  return matches;
}

// Preset breakpoints matching Tailwind CSS defaults
export const breakpoints = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
};

/**
 * Hook to check if screen is mobile (<768px)
 * @returns {boolean}
 */
export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)');
}

/**
 * Hook to check if screen is tablet (768px - 1023px)
 * @returns {boolean}
 */
export function useIsTablet() {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

/**
 * Hook to check if screen is desktop (≥1024px)
 * @returns {boolean}
 */
export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)');
}

export default useMediaQuery;
