# Bilavnova Design System Application Guide

Apply the Bilavnova "Cosmic Precision" design system patterns to React components. This skill ensures consistent theming with reliable dark mode support.

## Quick Start

When applying the design system to a component:

1. Import the theme hook: `import { useTheme } from '../contexts/ThemeContext';`
2. Get the dark mode state: `const { isDark } = useTheme();`
3. Apply conditional classes: `className={isDark ? 'dark-class' : 'light-class'}`

---

## 1. Theme Setup

### The useTheme Pattern

For reliable dark mode styling, use JavaScript conditionals instead of Tailwind's `dark:` prefix:

```jsx
import { useTheme } from '../contexts/ThemeContext';

const MyComponent = () => {
  const { isDark } = useTheme();

  return (
    <div className={`
      ${isDark ? 'bg-space-nebula' : 'bg-white/95'}
      ${isDark ? 'border-stellar-cyan/10' : 'border-stellar-cyan/5'}
      backdrop-blur-xl
    `}>
      <h2 className={isDark ? 'text-white' : 'text-slate-900'}>
        Title
      </h2>
      <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
        Description
      </p>
    </div>
  );
};
```

### When to Use Each Approach

| Approach | Use When |
|----------|----------|
| `useTheme + isDark` | Navigation, headers, glassmorphism, complex borders |
| `dark:` prefix | Simple components, status badges, semantic colors |

**Note:** The `dark:` prefix works for most cases thanks to the Tailwind safelist in `tailwind.config.js`. Use `useTheme` for critical UI components where styling must be 100% reliable.

---

## 2. Color Tokens

### Space Colors (Dark Mode Backgrounds)

| Token | Hex | Tailwind Class | Usage |
|-------|-----|----------------|-------|
| `space-void` | `#050816` | `bg-space-void` | Primary dark background |
| `space-nebula` | `#0a0f1e` | `bg-space-nebula` | Card/surface background |
| `space-dust` | `#1a1f35` | `bg-space-dust` | Hover states, elevated surfaces |
| `space-light` | `#f8fafc` | `bg-space-light` | Light mode background |

### Stellar Colors (Brand Accents)

| Token | Hex | Tailwind Class | Usage |
|-------|-----|----------------|-------|
| `stellar-blue` | `#2d388a` | `bg-stellar-blue` | Gradient start, deep accents |
| `stellar-cyan` | `#00aeef` | `text-stellar-cyan` | Active states, focus, links |
| `stellar-glow` | `rgba(0,174,239,0.5)` | - | Glow effects |

### Opacity Variants

Use these opacity suffixes with stellar-cyan:
- `/5` - Subtle borders (light mode)
- `/10` - Subtle borders (dark mode)
- `/15` - Visible borders
- `/20` - Active state backgrounds

```jsx
// Border examples
className={isDark ? 'border-stellar-cyan/10' : 'border-stellar-cyan/5'}

// Background examples
className={isActive ? (isDark ? 'bg-stellar-cyan/20' : 'bg-stellar-cyan/15') : ''}
```

---

## 3. Component Patterns

### Containers & Backgrounds

**App/Page Background:**
```jsx
<div className={`min-h-screen ${isDark ? 'bg-space-void' : 'bg-slate-50'}`}>
```

**Glassmorphism Container:**
```jsx
<div className={`
  ${isDark ? 'bg-space-nebula' : 'bg-white/95'}
  backdrop-blur-xl
  border
  ${isDark ? 'border-stellar-cyan/10' : 'border-stellar-cyan/5'}
  rounded-xl
`}>
```

**Elevated Surface (Cards):**
```jsx
<div className={`
  ${isDark ? 'bg-space-dust' : 'bg-white'}
  border
  ${isDark ? 'border-stellar-cyan/15' : 'border-slate-200'}
  rounded-xl
  shadow-sm
`}>
```

**Dropdown/Popover:**
```jsx
<div className={`
  ${isDark ? 'bg-space-dust' : 'bg-white/95'}
  backdrop-blur-xl
  rounded-xl
  shadow-xl
  border
  ${isDark ? 'border-stellar-cyan/20' : 'border-stellar-cyan/10'}
`}>
```

### Navigation Items

**Active State:**
```jsx
className={isActive
  ? 'bg-gradient-stellar-horizontal text-white shadow-md shadow-bilavnova'
  : isDark
    ? 'text-slate-400 hover:bg-white/5'
    : 'text-slate-600 hover:bg-slate-100'
}
```

**Bottom Nav Item:**
```jsx
// Icon container
className={`
  ${isActive
    ? (isDark ? 'bg-stellar-cyan/20' : 'bg-stellar-cyan/15')
    : (isDark ? 'group-active:bg-slate-800' : 'group-active:bg-slate-100')
  }
`}

// Text color
className={isActive
  ? 'text-stellar-cyan'
  : isDark
    ? 'text-slate-400 active:text-stellar-cyan'
    : 'text-slate-500 active:text-stellar-cyan'
}
```

### Cards & Surfaces

**Standard Card:**
```jsx
<div className={`
  ${isDark ? 'bg-space-dust/80' : 'bg-white'}
  border
  ${isDark ? 'border-stellar-cyan/10' : 'border-slate-200'}
  rounded-xl
  p-6
`}>
```

**Interactive Card (Hover):**
```jsx
<div className={`
  ${isDark ? 'bg-space-dust' : 'bg-white'}
  ${isDark ? 'hover:bg-space-dust/80' : 'hover:bg-slate-50'}
  border
  ${isDark ? 'border-stellar-cyan/10' : 'border-slate-200'}
  ${isDark ? 'hover:border-stellar-cyan/20' : 'hover:border-stellar-cyan/10'}
  rounded-xl
  cursor-pointer
  transition-all duration-200
`}>
```

### Text Hierarchy

| Level | Dark Mode | Light Mode |
|-------|-----------|------------|
| Primary Heading | `text-white` | `text-slate-900` |
| Secondary Heading | `text-slate-200` | `text-slate-800` |
| Body Text | `text-slate-300` | `text-slate-700` |
| Secondary Text | `text-slate-400` | `text-slate-600` |
| Muted Text | `text-slate-500` | `text-slate-500` |
| Active/Link | `text-stellar-cyan` | `text-stellar-cyan` |

```jsx
// Heading
<h2 className={isDark ? 'text-white' : 'text-slate-900'}>

// Body
<p className={isDark ? 'text-slate-300' : 'text-slate-700'}>

// Secondary
<span className={isDark ? 'text-slate-400' : 'text-slate-600'}>

// Active state
<span className="text-stellar-cyan">
```

### Borders & Dividers

**Standard Border:**
```jsx
className={`border ${isDark ? 'border-stellar-cyan/10' : 'border-slate-200'}`}
```

**Header/Section Divider:**
```jsx
className={`border-b ${isDark ? 'border-stellar-cyan/10' : 'border-stellar-cyan/5'}`}
```

**Divider Line:**
```jsx
<div className={`my-2 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`} />
```

### Shadows & Glows

**Theme-Aware Shadow:**
```jsx
// Dark mode: cyan-tinted shadow
// Light mode: neutral shadow
className={isDark
  ? 'shadow-[0_-4px_24px_-4px_rgba(0,174,239,0.1)]'
  : 'shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)]'
}
```

**Active State Glow:**
```jsx
className="shadow-md shadow-bilavnova"
```

**Focus Ring:**
```jsx
className="focus:ring-2 focus:ring-stellar-cyan/20 focus:border-stellar-cyan"
```

---

## 4. Migration Checklist

When converting a component to use the design system:

- [ ] Import `useTheme` from `../contexts/ThemeContext`
- [ ] Extract `isDark` from the hook
- [ ] Replace `dark:bg-*` with `isDark ? 'bg-space-*' : 'bg-white/*'`
- [ ] Replace `dark:border-*` with `isDark ? 'border-stellar-cyan/*' : 'border-*'`
- [ ] Replace `dark:text-*` with `isDark ? 'text-slate-*' : 'text-slate-*'`
- [ ] Ensure shadows use theme-aware colors
- [ ] Test in both light and dark modes

---

## 5. Common Patterns Reference

### Header/Top Bar

```jsx
<header className={`
  sticky top-0 z-40
  ${isDark ? 'bg-space-nebula' : 'bg-white/85'}
  backdrop-blur-xl
  border-b
  ${isDark ? 'border-stellar-cyan/10' : 'border-stellar-cyan/5'}
  shadow-sm
  transition-all duration-300
  safe-area-top
`}>
```

### Sidebar Navigation

```jsx
<aside className={`
  ${isDark ? 'bg-space-nebula' : 'bg-white/95'}
  backdrop-blur-xl
  border-r
  ${isDark ? 'border-stellar-cyan/10' : 'border-stellar-cyan/5'}
  flex flex-col
`}>
```

### Bottom Navigation Bar

```jsx
<nav className={`
  fixed bottom-0 inset-x-0 z-40
  ${isDark ? 'bg-space-dust' : 'bg-white/90'}
  backdrop-blur-xl
  border-t
  ${isDark ? 'border-stellar-cyan/15' : 'border-stellar-cyan/10'}
  ${isDark
    ? 'shadow-[0_-4px_24px_-4px_rgba(0,174,239,0.1)]'
    : 'shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)]'
  }
  safe-area-bottom
`}>
```

### Modal Container

```jsx
<div className={`
  ${isDark ? 'bg-space-dust' : 'bg-white'}
  rounded-2xl
  shadow-2xl
  border
  ${isDark ? 'border-stellar-cyan/20' : 'border-slate-200'}
  max-w-2xl w-full
  max-h-[90vh]
  overflow-hidden
`}>
```

### Button Variants

**Primary (Gradient):**
```jsx
<button className="
  bg-gradient-stellar-horizontal
  hover:opacity-90
  text-white
  font-semibold
  rounded-xl
  px-6 py-3
  shadow-md shadow-bilavnova
  active:scale-[0.98]
  transition-all duration-200
">
```

**Secondary:**
```jsx
<button className={`
  ${isDark ? 'bg-space-dust hover:bg-space-dust/80' : 'bg-slate-100 hover:bg-slate-200'}
  ${isDark ? 'text-slate-200' : 'text-slate-700'}
  rounded-xl
  px-4 py-2
  transition-all duration-200
`}>
```

### Input Fields

```jsx
<input className={`
  w-full h-11 px-4
  ${isDark ? 'bg-space-dust' : 'bg-slate-50'}
  border
  ${isDark ? 'border-stellar-cyan/10' : 'border-slate-200'}
  rounded-xl
  text-sm
  ${isDark ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'}
  focus:outline-none
  focus:ring-2
  focus:ring-stellar-cyan/20
  focus:border-stellar-cyan
  transition-all
`} />
```

---

## 6. Gradients Reference

| Gradient | Class | Usage |
|----------|-------|-------|
| Stellar Diagonal | `bg-gradient-stellar` | Buttons, headers |
| Stellar Horizontal | `bg-gradient-stellar-horizontal` | Nav items, pills |
| Stellar Vertical | `bg-gradient-stellar-vertical` | Cards, sections |
| Aurora Overlay | `aurora-overlay` | Background decoration |

---

## 7. CSS Utility Classes

Available in `index.css`:

| Class | Usage |
|-------|-------|
| `glass` | Apply glassmorphism with CSS variables |
| `text-gradient-stellar` | Gradient text effect |
| `bg-starfield` | Animated star background (dark mode) |
| `bg-grid-light` | Grid pattern (light mode) |
| `aurora-overlay` | Radial gradient overlay |
| `safe-area-top` | iOS notch padding |
| `safe-area-bottom` | iOS home indicator padding |
| `touch-target` | 44px minimum touch target |

---

## 8. Example: Full Component

```jsx
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ExampleCard = ({ title, description, isActive, onClick }) => {
  const { isDark } = useTheme();

  return (
    <div
      onClick={onClick}
      className={`
        ${isDark ? 'bg-space-dust' : 'bg-white'}
        ${isDark ? 'hover:bg-space-dust/80' : 'hover:bg-slate-50'}
        border
        ${isActive
          ? 'border-stellar-cyan shadow-md shadow-bilavnova'
          : isDark
            ? 'border-stellar-cyan/10'
            : 'border-slate-200'
        }
        rounded-xl
        p-6
        cursor-pointer
        transition-all duration-200
      `}
    >
      <h3 className={`
        text-lg font-semibold
        ${isActive
          ? 'text-stellar-cyan'
          : isDark
            ? 'text-white'
            : 'text-slate-900'
        }
      `}>
        {title}
      </h3>
      <p className={`
        mt-2 text-sm
        ${isDark ? 'text-slate-400' : 'text-slate-600'}
      `}>
        {description}
      </p>
    </div>
  );
};

export default ExampleCard;
```
