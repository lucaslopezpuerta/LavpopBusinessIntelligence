# Hooks Directory

Custom React hooks for the Bilavnova Business Intelligence application.

## Overview

This directory contains 13 custom hooks organized by category:
- **Data Fetching** - API calls, caching, real-time sync
- **Mobile Gestures** - Touch interactions for native-like UX
- **Responsive** - Breakpoint detection, media queries
- **Accessibility** - Motion preferences, scroll lock

## Hooks by Category

### Data Fetching & State

| Hook | Purpose | Cache |
|------|---------|-------|
| `useRevenuePrediction` | ML revenue forecasts from Netlify function | 1h localStorage |
| `useWeatherForecast` | Weather data for business correlation | - |
| `useContactTracking` | WhatsApp delivery tracking (realtime) | - |
| `useBlacklist` | Opt-out management | - |
| `useActiveCampaigns` | Campaign state management | - |
| `useRealtimeSync` | Supabase WebSocket subscriptions | - |

### Mobile Gestures

| Hook | Purpose | Platform |
|------|---------|----------|
| `usePullToRefresh` | Pull-down to refresh data | Mobile only |
| `useSwipeToClose` | Swipe gesture to dismiss modals | Mobile only |
| `useTouchTooltip` | Long-press to show tooltips | Mobile only |
| `useLongPress` | Long-press detection | Mobile only |

### Responsive & Accessibility

| Hook | Purpose |
|------|---------|
| `useMediaQuery` | Match media query (SSR-safe) |
| `useReducedMotion` | Respects `prefers-reduced-motion` |
| `useScrollLock` | Lock body scroll for modals |

## Common Patterns

### 1. Version Header Pattern

All hooks include version headers for tracking:

```javascript
// useExample.js v1.2 - SHORT DESCRIPTION
//
// FEATURES:
// - Feature 1
// - Feature 2
//
// CHANGELOG:
// v1.2 (2026-01-20): Added new feature
// v1.1 (2026-01-15): Bug fix
// v1.0 (2026-01-10): Initial implementation
```

### 2. Caching Pattern

Hooks that fetch data implement localStorage caching with TTL:

```javascript
const CACHE_KEY = 'hook_data';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const getCachedData = () => {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;

  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp < CACHE_TTL_MS) {
    return data; // Valid cache
  }
  localStorage.removeItem(CACHE_KEY); // Expired
  return null;
};
```

### 3. SSR Safety Pattern

Hooks using browser APIs check for `window`:

```javascript
const [matches, setMatches] = useState(() => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(query).matches;
});
```

### 4. Mobile-Only Pattern

Gesture hooks disable themselves on desktop:

```javascript
const isMobile = useMediaQuery('(max-width: 1023px)');

const handlers = isMobile ? {
  onTouchStart: handleTouchStart,
  onTouchMove: handleTouchMove,
  onTouchEnd: handleTouchEnd,
} : {};

return { ...state, handlers };
```

### 5. Options Pattern

Configurable hooks accept an options object:

```javascript
export default function useExample(options = {}) {
  const {
    autoFetch = true,
    useCache = true,
    debounceMs = 300
  } = options;
  // ...
}
```

## Creating a New Hook

1. **File naming:** `useFeatureName.js` (camelCase with `use` prefix)

2. **Structure:**
   ```javascript
   // useFeatureName.js v1.0 - PURPOSE
   //
   // FEATURES:
   // - Feature list
   //
   // USAGE:
   // const { data, loading } = useFeatureName(options);
   //
   // CHANGELOG:
   // v1.0 (YYYY-MM-DD): Initial implementation

   import { useState, useEffect, useCallback } from 'react';

   /**
    * Hook description
    * @param {Object} options - Configuration options
    * @returns {Object} Hook state and methods
    */
   export function useFeatureName(options = {}) {
     // 1. Destructure options with defaults
     const { option1 = defaultValue } = options;

     // 2. State declarations
     const [data, setData] = useState(null);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState(null);

     // 3. Callbacks (memoized)
     const refresh = useCallback(() => { ... }, [deps]);

     // 4. Effects
     useEffect(() => { ... }, [deps]);

     // 5. Return object
     return {
       data,
       loading,
       error,
       refresh,
       // Convenience getters
       hasData: data !== null,
     };
   }

   export default useFeatureName;
   ```

3. **Export pattern:** Named export + default export for flexibility

4. **Add to CLAUDE.md hooks list** (root level) after creation

## Breakpoint Reference

Matching Tailwind CSS defaults (from `useMediaQuery.js`):

```javascript
sm: '(min-width: 640px)'   // Small devices
md: '(min-width: 768px)'   // Tablets
lg: '(min-width: 1024px)'  // Desktops
xl: '(min-width: 1280px)'  // Large screens
2xl: '(min-width: 1536px)' // Extra large
```

## Dependencies

- React hooks: `useState`, `useEffect`, `useCallback`, `useRef`, `useMemo`
- Internal: `useMediaQuery` (for mobile detection in gesture hooks)
- Utils: `haptics.js` (for native haptic feedback)
