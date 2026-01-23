# UI Components Directory

Reusable UI primitives for the Bilavnova Business Intelligence application.

## Overview

This directory contains 24 UI primitive components following the **Cosmic Precision Design System v5.1**. These are the building blocks used across all views and features.

## Component Categories

### KPI Cards (Data Display)

| Component | Purpose | Variant |
|-----------|---------|---------|
| `KPICard.jsx` | Unified KPI display (v1.12) | A (Solid) |
| `HeroKPICard.jsx` | Large hero metrics | A (Solid) |
| `SecondaryKPICard.jsx` | Secondary metrics | A (Solid) |
| `CleanKPICard.jsx` | Minimal KPI card | A (Solid) |
| `StatCard.jsx` | Simple stat display | A (Solid) |

### Cosmic Inputs (Form Elements)

| Component | Purpose | Variant |
|-----------|---------|---------|
| `CosmicDropdown.jsx` | Custom select (v1.1.0) | D (Glassmorphism) |
| `CosmicDatePicker.jsx` | Date picker (v1.2) | D (Glassmorphism) |
| `CosmicTimePicker.jsx` | 24h time picker | D (Glassmorphism) |
| `SearchInput.jsx` | Search field | A (Solid) |
| `Button.jsx` | Action button (v1.1) | A (Solid) |
| `IconButton.jsx` | Icon-only button | A (Solid) |

### Feedback & Status

| Component | Purpose | Variant |
|-----------|---------|---------|
| `TrendBadge.jsx` | Trend indicator (up/down/neutral) | - |
| `ProgressBar.jsx` | Progress visualization | A (Solid) |
| `InsightBox.jsx` | Insight callout | B (Accent-Tinted) |
| `RealtimeStatusIndicator.jsx` | WebSocket status | - |

### Layout & Containers

| Component | Purpose | Variant |
|-----------|---------|---------|
| `SectionCard.jsx` | Section wrapper | A (Solid) |
| `SectionHeader.jsx` | Section title with actions | - |
| `PullToRefreshWrapper.jsx` | Mobile refresh gesture | - |
| `MobileTooltipSheet.jsx` | Mobile tooltip drawer | D (Glassmorphism) |

### States & Screens

| Component | Purpose | Variant |
|-----------|---------|---------|
| `LoadingScreen.jsx` | Full-page loading | E (Premium) |
| `ErrorScreen.jsx` | Error display | E (Premium) |
| `EmptyState.jsx` | No data state | C (Neutral) |
| `Skeleton.jsx` | View-specific skeletons | - |

### Branding

| Component | Purpose |
|-----------|---------|
| `BilavnovaLogo.jsx` | Brand logo component |

## Design System Compliance

All components follow **Cosmic Precision v5.1** variant patterns:

### Variant A (Solid) - Most UI Primitives
```jsx
className={`
  bg-white dark:bg-space-dust
  border border-slate-200 dark:border-stellar-cyan/10
  rounded-xl
`}
```

### Variant D (Glassmorphism) - Dropdowns, Pickers, Modals
```jsx
const { isDark } = useTheme();

className={`
  backdrop-blur-xl
  ${isDark ? 'bg-space-dust/90' : 'bg-white/95'}
  ${isDark ? 'border-stellar-cyan/20' : 'border-slate-200'}
`}
```

### Variant E (Premium) - Loading, Error Screens
```jsx
className={`
  bg-space-void
  /* starfield background */
  /* aurora gradient effects */
`}
```

## Component Patterns

### 1. Version Header Pattern

All components include version tracking with changelog:

```jsx
// ComponentName.jsx v1.12 - SHORT DESCRIPTION
// Design System v5.0 compliant - Tier X Category
//
// CHANGELOG:
// v1.12 (2026-01-18): Dark mode border colors
// v1.11 (2026-01-17): Cosmic Precision upgrade
```

### 2. Props Documentation Pattern

JSDoc comments before component definition:

```jsx
/**
 * Component description
 *
 * @param {string} label - Card label/title
 * @param {string} value - Main display value
 * @param {object} trend - Optional trend data { value: number, label?: string }
 * @param {React.ComponentType} icon - Optional Lucide icon
 * @param {string} color - Color theme key (blue, revenue, cost, etc.)
 * @param {string} variant - Card variant: 'default' | 'hero' | 'compact'
 * @param {function} onClick - Optional click handler
 */
const MyComponent = ({ ... }) => { ... };
```

### 3. Dark Mode with useTheme

For Variant D components, use `useTheme()` instead of Tailwind's `dark:`:

```jsx
import { useTheme } from '../../contexts/ThemeContext';

const CosmicComponent = () => {
  const { isDark } = useTheme();

  return (
    <div className={`
      backdrop-blur-xl
      ${isDark ? 'bg-space-dust/90' : 'bg-white/95'}
      ${isDark ? 'border-stellar-cyan/20' : 'border-slate-200'}
    `}>
      {/* Content */}
    </div>
  );
};
```

### 4. Framer Motion Animations

Components use Framer Motion for smooth animations:

```jsx
import { motion, AnimatePresence } from 'framer-motion';

// Hover animation config
const hoverAnimation = {
  rest: { y: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  hover: { y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }
};

// Smooth tween (avoids spring oscillation)
const hoverTransition = { type: 'tween', duration: 0.2, ease: 'easeOut' };
```

### 5. Accessibility Pattern

Components include proper ARIA attributes and keyboard support:

```jsx
<button
  role="combobox"
  aria-expanded={isOpen}
  aria-haspopup="listbox"
  aria-activedescendant={highlightedIndex >= 0 ? `option-${highlightedIndex}` : undefined}
  onClick={() => setIsOpen(!isOpen)}
>
```

## Color System

### Semantic Colors (from `colorMapping.js`)

```javascript
import { getSemanticColor } from '../../utils/colorMapping';

// Usage
const colors = getSemanticColor('revenue'); // { light, dark, gradient }
```

### Status Colors (KPICard)

```jsx
// Status prop for colored left border
<KPICard
  status="success"  // green border - good metrics
  status="warning"  // yellow border - attention needed
  status="danger"   // red border - critical metrics
  status="neutral"  // default gray
/>
```

## Mobile Support

### Touch Interactions

Components support haptic feedback on native:

```jsx
import { haptics } from '../../utils/haptics';

const handleSelect = (option) => {
  haptics.tap(); // Native haptic feedback
  onChange(option.value);
};
```

### Responsive Labels

KPICard supports mobile-specific shorter labels:

```jsx
<KPICard
  label="Revenue per Customer"
  mobileLabel="Rev/Customer"
  subtitle="Average transaction value"
  mobileSubtitle="Avg value"
/>
```

## Dependencies

- `framer-motion` - Animations
- `lucide-react` - Icons (TrendingUp, TrendingDown, ChevronDown, etc.)
- `../../contexts/ThemeContext` - Dark mode state
- `../../utils/colorMapping` - Semantic color system
- `../../utils/haptics` - Native haptic feedback
