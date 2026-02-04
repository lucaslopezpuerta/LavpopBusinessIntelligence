// useReducedMotion.js v1.1
// Hook to detect user's reduced motion preference
//
// Usage:
//   const prefersReducedMotion = useReducedMotion();
//   <motion.div animate={prefersReducedMotion ? {} : { x: 100 }} />
//
// CHANGELOG:
// v1.1 (2026-02-02): Synchronous initialization
//   - Initialize with actual value on client to prevent flash
//   - Matches useMediaQuery pattern for consistency
// v1.0 (2025-12-17): Initial implementation
//   - Detects prefers-reduced-motion media query
//   - Updates on system preference change
//   - SSR-safe with initial false value

import { useState, useEffect } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export function useReducedMotion() {
  // Initialize with actual value on client, false for SSR
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(QUERY);

    // Listen for changes
    const handleChange = (event) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Legacy browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return prefersReducedMotion;
}

export default useReducedMotion;
