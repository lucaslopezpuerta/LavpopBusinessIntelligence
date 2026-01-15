# LavpopBI Design System v3.5

> **Last Updated:** January 15, 2026
> **Status:** Active - All components aligned with this system
> **Audit Completed:** Design System Reconciliation Audit (Documentation vs Implementation)

## 📋 Changelog

### v3.5 (January 15, 2026) - Dark Mode Contrast Fix
- **FIXED:** Section Title dark mode color corrected to `dark:text-white` (was `dark:text-slate-200`)
- **FIXED:** Card Title dark mode color corrected to `dark:text-white` (was `dark:text-slate-300`)
- **ADDED:** Card Title (Muted) variant for secondary cards using `dark:text-slate-200`
- **ADDED:** Blue text dark mode guidance - use `dark:text-blue-400` for lavpop-blue text
- **ADDED:** Color mapping table entries for headings and blue text
- **ADDED:** Warning notes about dark mode contrast requirements
- **ALIGNED:** Documentation now matches actual component implementations

### v3.4 (January 7, 2026) - Design System Reconciliation
- **FIXED:** Brand green color corrected to `#55b03b` (was incorrectly documented as emerald `#10b981`)
- **CLARIFIED:** Dual green usage - `#55b03b` for brand, emerald for semantic success states
- **FIXED:** Primary font corrected to Inter (was documented as System UI Stack)
- **ADDED:** `xs: 475px` breakpoint to documentation
- **ADDED:** Soft shadow utilities (`shadow-soft`, `shadow-soft-lg`, `shadow-soft-xl`)
- **ADDED:** Glow effects (`glow-blue`, `glow-green`, `glow-amber`)
- **ADDED:** colorMapping.js utility reference section
- **ADDED:** Tailwind z-index utilities documentation (1000-1070 scale)
- **ADDED:** KPI Card selection decision tree
- **ADDED:** SectionHeader component for consistent view headers
- **UPDATED:** Touch target implementation patterns

### v3.3 (December 18, 2025) - Mobile App Transformation
- **NEW:** Bottom Navigation Bar - 5-tab mobile navigation (`BottomNavBar.jsx`)
- **NEW:** Safe Area CSS utilities for notched devices (iPhone X+, Android)
- **NEW:** Offline Indicator component with connection status banner
- **NEW:** Swipe Navigation hook (`useSwipeNavigation.js`) for gesture-based tab switching
- **NEW:** Pull-to-Refresh hook (`usePullToRefresh.js`) for mobile refresh pattern
- **UPDATED:** Viewport meta tag with `viewport-fit=cover` for safe areas
- **UPDATED:** Touch targets - all interactive elements now 44px minimum
- **UPDATED:** Top bar redesigned - removed breadcrumb, widgets visible on mobile
- **UPDATED:** Tooltips now use tap-to-toggle pattern (no longer hover-only)
- **FIXED:** Hover-only interactions in AutomationRules and WeatherImpactSection

### v3.2 (December 16, 2025)
- **BREAKING:** Removed `text-[10px]` from allowed font sizes (minimum is now `text-xs`/12px)
- **NEW:** Z-Index system with semantic layer constants
- **NEW:** Mobile touch tooltip pattern for charts (tap-to-preview, tap-again-to-action)
- **NEW:** Icon sidebar navigation with hover expansion
- **NEW:** Modal UX requirements (escape key, click-outside, portal rendering)
- **NEW:** RetentionPulse compact widget component
- **UPDATED:** Chart tooltip mobile support with visual hints
- **UPDATED:** Modal stacking guidelines with standardized z-index values

---

## 🎨 Brand Identity

### Brand Colors

```javascript
// Primary Brand Colors
'lavpop-blue': {
  DEFAULT: '#1a5a8e',  // Primary brand blue
  50: '#e8f1f8',
  100: '#d1e3f1',
  200: '#a3c7e3',
  300: '#75abd5',
  400: '#478fc7',
  500: '#1a5a8e',      // Base
  600: '#154872',
  700: '#103656',
  800: '#0b243a',
  900: '#06121d'
}

'lavpop-green': {
  DEFAULT: '#55b03b',  // Brand green (custom Lavpop green)
  50: '#f0f9ed',
  100: '#e1f3db',
  200: '#c3e7b7',
  300: '#a5db93',
  400: '#87cf6f',
  500: '#55b03b',      // Base
  600: '#448d2f',
  700: '#336a23',
  800: '#224618',
  900: '#11230c'
}
```

> **Green Color Usage Guide:**
> - **`#55b03b` (lavpop-green):** Use for brand elements, logos, primary accent colors
> - **`#10b981` (emerald-500):** Use for semantic success states, positive trends, health indicators
>
> The emerald color palette is available via Tailwind's built-in `emerald-*` classes.

### Typography

**Primary Font:** Inter (with System UI fallback)
```css
font-family: 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"',
             'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif';
```

**Monospace Font:** JetBrains Mono (for code/data)
```css
font-family: '"JetBrains Mono"', '"Fira Code"', 'Consolas', 'Monaco',
             '"Courier New"', 'monospace';
```

**Font Sizes:**
- **Display:** `text-2xl` (24px) - Logo, major headings
- **Heading:** `text-xl` (20px) - Section titles
- **Body:** `text-sm` (14px) - Standard text
- **Small:** `text-xs` (12px) - Labels, captions, minimum allowed size

> ⚠️ **IMPORTANT:** The minimum font size is `text-xs` (12px). Never use `text-[10px]` or smaller.
> This ensures readability on all devices and accessibility compliance.

---

## 📐 Layout System

### Responsive Breakpoints

```javascript
xs: '475px'   // Large phones (custom breakpoint)
sm: '640px'   // Mobile landscape, small tablets
md: '768px'   // Tablets
lg: '1024px'  // Desktop
xl: '1280px'  // Large desktop
2xl: '1536px' // Extra large screens
```

### Container Widths

```css
max-w-[100rem]  /* 1600px - Main app container */
max-w-7xl       /* 1280px - Content sections */
max-w-md        /* 448px - Modals, cards */
```

### Spacing Scale

```javascript
gap-1    // 4px  - Tight spacing
gap-2    // 8px  - Compact elements
gap-3    // 12px - Standard spacing
gap-4    // 16px - Section spacing
gap-6    // 24px - Large spacing
gap-8    // 32px - Major sections
```

### Z-Index System

Use semantic z-index layers from `src/constants/zIndex.js`:

```javascript
// Z-Index Constants (src/constants/zIndex.js)
export const Z_INDEX = {
  // Base layers
  DROPDOWN: 40,        // Dropdowns, popovers

  // Modal layers (50-69)
  MODAL_PRIMARY: 50,   // Primary modals (KPIDetailModal, CustomerSegmentModal)
  MODAL_CHILD: 60,     // Child modals opened from primary (CustomerProfileModal)

  // Alert layers (70+)
  ALERT: 70,           // Confirmation dialogs, alerts
  TOAST: 80,           // Toast notifications
};
```

**Usage Guidelines:**

| Layer | Z-Index | Tailwind | Use Case |
|-------|---------|----------|----------|
| Sidebar | 40 | `z-40` | Icon sidebar navigation |
| Dropdown | 40 | `z-40` | Dropdown menus, popovers |
| Primary Modal | 50 | `z-50` | Main modals (CustomerSegmentModal, KPIDetailModal) |
| Child Modal | 60 | `z-[60]` | Modals opened from other modals (CustomerProfileModal) |
| Alert | 70 | `z-[70]` | Confirmation dialogs |
| Toast | 80 | `z-[80]` | Toast notifications |

> ⚠️ **IMPORTANT:** For component z-index, use the semantic constants above. Arbitrary values like `z-[1050]` should be avoided.

### Tailwind Z-Index Utilities

The `tailwind.config.js` also defines extended z-index utilities for compatibility:

```javascript
// Extended z-index in tailwind.config.js
zIndex: {
  'dropdown': '1000',
  'sticky': '1020',
  'modal-backdrop': '1040',
  'modal': '1050',
  'tooltip': '1060',
  'notification': '1070',
}
```

> **Note:** Prefer semantic constants from `src/constants/zIndex.js` for new components. The Tailwind utilities exist for legacy compatibility.

### Box Shadows

**Soft Shadows (Cards & Surfaces):**
```css
shadow-soft      /* 0 2px 8px -2px rgba(0,0,0,0.08), 0 4px 12px -4px rgba(0,0,0,0.04) */
shadow-soft-lg   /* 0 4px 16px -4px rgba(0,0,0,0.1), 0 8px 24px -8px rgba(0,0,0,0.06) */
shadow-soft-xl   /* 0 8px 24px -6px rgba(0,0,0,0.12), 0 12px 32px -8px rgba(0,0,0,0.08) */
```

**Brand Shadows:**
```css
shadow-lavpop    /* 0 4px 14px 0 rgba(26,90,142,0.15) */
shadow-lavpop-lg /* 0 10px 40px -10px rgba(26,90,142,0.25) */
```

**Glow Effects (Emphasis):**
```css
shadow-glow-blue  /* 0 0 20px rgba(26,90,142,0.15) */
shadow-glow-green /* 0 0 20px rgba(85,176,59,0.15) */
shadow-glow-amber /* 0 0 20px rgba(245,158,11,0.15) */
```

---

## 🎯 Component Patterns

### Navigation System

#### Icon Sidebar (Desktop - `IconSidebar.jsx`)

**Collapsed State (60px):**
```
[Logo]
[Icon] ← Hover to expand
[Icon]
[Icon]
...
[Theme Toggle]
```

**Expanded State (240px on hover):**
```
[Logo + Title]
[Icon] [Label] ← Full width with label
[Icon] [Label]
[Icon] [Label]
...
[Theme Toggle]
```

**Specifications:**
- Collapsed width: `w-[60px]`
- Expanded width: `w-[240px]`
- Background: `bg-white dark:bg-slate-900`
- Border: `border-r border-slate-200 dark:border-slate-700`
- Position: `fixed left-0 top-0 h-full z-40`
- Transition: `transition-all duration-300`

#### Top Bar (Desktop - `MinimalTopBar.jsx`)

**Layout:**
```
[Breadcrumb] | [Retention Pulse] [Widgets] [Google] [Instagram]
```

**Specifications:**
- Height: `h-[60px]`
- Background: `bg-white/80 dark:bg-slate-900/80 backdrop-blur-md`
- Border: `border-b border-slate-200/50 dark:border-slate-700/50`
- Position: `sticky top-0 z-30`

#### Mobile Navigation

**Mobile Layout (< 1024px):**
```
Top Bar:  [Location] [Weather] | [Settings] [Refresh] [Theme]
Bottom:   [Dashboard] [Diretório] [Clientes] [Campanhas] [Mais]
```

**Bottom Navigation Bar (`BottomNavBar.jsx`):**
- Fixed at bottom of viewport with safe area support
- 5 primary tabs: Dashboard, Diretório, Clientes, Campanhas, Mais
- "Mais" tab opens drawer for secondary routes (Inteligência, Operações, Upload)
- Active state: lavpop-blue gradient background on icon
- 64px height + safe-area-inset-bottom
- Backdrop blur with dark mode support

```jsx
// Bottom Nav Specification
{
  tabs: [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/' },
    { id: 'diretorio', label: 'Diretório', icon: Search, path: '/diretorio' },
    { id: 'customers', label: 'Clientes', icon: Users, path: '/customers' },
    { id: 'campaigns', label: 'Campanhas', icon: MessageSquare, path: '/campaigns' },
    { id: 'more', label: 'Mais', icon: Menu, onClick: toggleMobileSidebar }
  ]
}
```

**Mobile Drawer (Secondary Navigation):**
- Full-screen overlay with backdrop blur
- Slide-in animation from left
- Contains secondary routes: Inteligência, Operações, Upload
- Close on backdrop tap or X button

### Compact Widgets

**Mobile Display (< 640px):**
- **Weather:** Temperature only (`20.5°`)
- **Google:** Rating + star (`4.9 ⭐`)
- **Instagram:** Follower count (`2.5k`)

**Desktop Display (≥ 640px):**
- **Weather:** Icon + temp + humidity
- **Google:** Map pin + rating + reviews + status
- **Instagram:** Icon + followers

**Widget Styling:**
```css
bg-slate-100 dark:bg-slate-800
rounded-lg px-2 py-1.5
h-9
hover:bg-slate-200 dark:hover:bg-slate-700
transition-all duration-200
```

### Navigation Pills (Desktop)

**Container:**
```css
bg-slate-100/50 dark:bg-slate-800/50
p-1.5 rounded-full
border border-slate-200/50 dark:border-slate-700/50
backdrop-blur-sm
```

**Active Tab:**
```css
bg-gradient-to-r from-lavpop-blue to-blue-600
text-white
rounded-full
shadow-md
```

**Inactive Tab:**
```css
text-slate-600 dark:text-slate-400
hover:text-slate-900 dark:hover:text-slate-200
```

### Mobile Menu

**Controls Section:**
```css
bg-slate-50 dark:bg-slate-800
rounded-xl
border border-slate-200 dark:border-slate-700
px-4 py-3
```

**Navigation Items:**
```css
/* Active */
bg-lavpop-blue text-white
shadow-lg shadow-blue-500/20

/* Inactive */
text-slate-600 dark:text-slate-400
hover:bg-slate-50 dark:hover:bg-slate-800
```

### Cards & Containers

**Standard Card:**
```css
bg-white dark:bg-slate-800
rounded-xl
shadow-sm
border border-slate-200 dark:border-slate-700
p-6
```

**Glassmorphism Card:**
```css
bg-white/80 dark:bg-slate-800/80
backdrop-blur-md
border border-slate-200/50 dark:border-slate-700/50
rounded-xl
shadow-sm
```

**KPI Card:**
```css
bg-gradient-to-br from-{color}-500 to-{color}-600
text-white
rounded-xl
shadow-lg
p-6
```

### Section Headers

Use the `SectionHeader` component for consistent section headers within views:

```jsx
import SectionHeader from '../components/ui/SectionHeader';
import { Gauge } from 'lucide-react';

<SectionHeader
  title="Equipamentos"
  subtitle="Análise de máquinas e equipamentos"
  icon={Gauge}
  color="amber"
  id="equipment-heading"
/>
```

**Available Colors:** `amber`, `emerald`, `blue`, `lavpop`, `purple`, `red`, `slate`, `teal`, `cyan`, `indigo`

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `title` | string | Section title (required) |
| `subtitle` | string | Optional description text |
| `icon` | LucideIcon | Lucide icon component (required) |
| `color` | string | Color theme key (default: amber) |
| `id` | string | ID for h2 element (for aria-labelledby) |

**Usage Pattern:**
```jsx
<section id="section-id" aria-labelledby="section-heading">
  <SectionHeader
    title="Section Title"
    subtitle="Description"
    icon={IconComponent}
    color="amber"
    id="section-heading"
  />
  {/* Section content */}
</section>
```

### Buttons

**Primary Button:**
```css
bg-gradient-to-r from-lavpop-blue to-blue-600
hover:from-blue-600 hover:to-blue-700
text-white font-bold
rounded-xl
px-6 py-3.5
shadow-lg hover:shadow-blue-500/25
active:scale-[0.98]
transition-all duration-200
```

**Secondary Button:**
```css
bg-slate-100 dark:bg-slate-800
hover:bg-slate-200 dark:hover:bg-slate-700
text-slate-700 dark:text-slate-300
rounded-xl
px-4 py-2
transition-all duration-200
```

**Icon Button:**
```css
p-2.5 rounded-xl
text-slate-500 dark:text-slate-400
hover:bg-slate-100 dark:hover:bg-slate-800
hover:text-lavpop-blue
transition-all
active:scale-95
```

---

## 🌓 Dark Mode

### Color Mappings

| Light Mode | Dark Mode | Usage |
|------------|-----------|-------|
| `bg-white` | `bg-slate-900` | App background |
| `bg-slate-50` | `bg-slate-800` | Card backgrounds |
| `bg-slate-100` | `bg-slate-800` | Widget backgrounds |
| `text-slate-900` | `text-white` | Primary text |
| `text-slate-800` | `text-white` | Headings, card titles |
| `text-slate-600` | `text-slate-400` | Secondary text |
| `text-lavpop-blue` | `text-blue-400` | Brand blue text, links |
| `text-blue-600` | `text-blue-400` | Interactive blue text |
| `border-slate-200` | `border-slate-700` | Borders |

> ⚠️ **Blue Text in Dark Mode:** The base `lavpop-blue` (#1a5a8e) is too dark for dark mode backgrounds.
> Always pair with `dark:text-blue-400` (#60a5fa) or `dark:text-lavpop-blue-400` (#478fc7) for proper contrast.

### Implementation

```jsx
// Always use paired classes
className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white"

// Opacity variants for dark mode
className="bg-white/80 dark:bg-slate-900/80"
```

---

## 📱 Mobile-First Principles

### 1. **Progressive Enhancement**
- Start with mobile layout
- Add desktop features with `sm:`, `lg:`, `xl:` breakpoints
- Hide non-essential elements on mobile

### 2. **Touch Targets**
- **Minimum size: 44x44px** for all interactive elements (Apple HIG)
- Use `min-h-[44px] min-w-[44px]` or `touch-target` CSS class
- Adequate spacing between clickable items (minimum 8px gap)
- For Material Design compliance: 48x48dp (`touch-target-lg` class)

### 3. **Content Priority**
- Show essential data first (temperature, not icon)
- Use hamburger menu for secondary controls
- Collapse complex layouts into vertical stacks

### 4. **Performance**
- Use `backdrop-blur-md` sparingly
- Lazy load off-screen content
- Optimize images and icons

---

## 🎭 Animation & Transitions

### Standard Transitions

```css
transition-all duration-200  /* Standard hover/state changes */
transition-colors duration-300  /* Theme switching */
```

### Framer Motion Patterns

**Page Transitions:**
```jsx
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -10 }}
transition={{ duration: 0.3 }}
```

**Tab Indicator:**
```jsx
<motion.div
  layoutId="activeTab"
  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
/>
```

**Scale Feedback:**
```css
active:scale-95      /* Buttons */
active:scale-[0.98]  /* Large buttons */
hover:scale-105      /* Cards (optional) */
```

---

## 🔤 Text Styles

### Headings

```jsx
// Page Title
<h1 className="text-2xl font-bold text-slate-900 dark:text-white">

// Section Title
<h2 className="text-xl font-semibold text-slate-800 dark:text-white">

// Card Title (Standard)
<h3 className="text-base font-bold text-slate-800 dark:text-white">

// Card Title (Muted) - for secondary cards
<h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
```

> ⚠️ **Dark Mode Contrast:** Always use `dark:text-white` for primary headings.
> Avoid `dark:text-slate-300` or lighter which has poor contrast against dark backgrounds.

### Body Text

```jsx
// Primary
<p className="text-sm text-slate-700 dark:text-slate-300">

// Secondary
<p className="text-xs text-slate-600 dark:text-slate-400">

// Muted
<p className="text-xs text-slate-500 dark:text-slate-500">
```

### Labels & Captions

```jsx
// Label
<span className="text-xs font-semibold text-slate-700 dark:text-slate-300">

// Caption (minimum size - never use text-[10px])
<span className="text-xs font-medium text-slate-600 dark:text-slate-400">
```

> ⚠️ Never use `text-[10px]` for captions. Use `text-xs` (12px) as the minimum.

---

## 📊 Data Visualization

### Chart Colors

```javascript
// Primary data series
colors: ['#1a5a8e', '#10b981', '#f59e0b', '#ef4444']

// Gradient bars
from-lavpop-blue to-blue-600
from-lavpop-green to-emerald-600
```

### Chart Styling

```css
/* Container */
bg-white dark:bg-slate-800
rounded-xl
border border-slate-200 dark:border-slate-700
p-6

/* Responsive height */
h-64 sm:h-80 lg:h-96
```

### Chart Best Practices

**1. Color Selection**
- Use semantic colors: Green for positive, Red for negative, Blue for neutral
- Maintain consistent color mapping across all charts
- Ensure sufficient contrast in dark mode

**2. Data Presentation**
- Limit to 4-5 data series per chart for readability
- Use gradients for visual appeal but maintain clarity
- Include legends for multi-series charts

**3. Responsive Design**
- Reduce chart height on mobile: `h-48 sm:h-64 lg:h-80`
- Simplify labels on small screens
- Consider horizontal scrolling for dense data

**4. Accessibility**
- Don't rely solely on color to convey information
- Include text labels and values
- Provide alternative data views (tables)

### Chart Tooltip Styling

All chart tooltips (Recharts & Nivo) should follow this pattern:

```jsx
/* Use the ChartTooltip component from src/components/ui/ChartTooltip.jsx */
import ChartTooltip from './ui/ChartTooltip';

/* Container Classes */
bg-white dark:bg-slate-800
border border-slate-200 dark:border-slate-700
rounded-lg
p-3
shadow-lg
min-w-[140px]

/* Title */
text-sm font-semibold text-slate-900 dark:text-white

/* Data Items */
text-xs
label: text-slate-600 dark:text-slate-400 font-medium
value: font-bold text-slate-900 dark:text-white

/* Color Indicator */
w-2 h-2 rounded-sm (square for bars)
w-2 h-2 rounded-full (circle for lines)
```

### Chart Color Utility

Use the centralized chart colors from `src/utils/chartColors.js`:

```javascript
import { getChartColors, chartGradients, getSeriesColors } from '../utils/chartColors';

// In component
const { isDark } = useTheme();
const colors = useMemo(() => getChartColors(isDark), [isDark]);
```

### Semantic Color Mapping (colorMapping.js)

For programmatic color access with built-in dark mode support, use the centralized color mapping utility:

```javascript
import { getSemanticColor, getValueColor, semanticColors } from '../utils/colorMapping';

// Get color object by semantic type
const colors = getSemanticColor('revenue');
// Returns: { bg, bgGradient, border, text, textMuted, textSubtle, icon, iconBg, gradient, ring, solidGradient }

// Get color based on value (positive/negative)
const trendColor = getValueColor(percentChange);
// Returns positive (emerald) or negative (red) colors

// Get confidence level colors
import { getConfidenceColor } from '../utils/colorMapping';
const confidenceColors = getConfidenceColor(85); // Returns high/medium/low colors
```

**Available Color Categories:**

| Category | Keys | Usage |
|----------|------|-------|
| Business | `revenue`, `cost`, `profit` | Financial metrics |
| Trends | `positive`, `negative`, `neutral`, `warning` | Trend indicators |
| Weather | `sunny`, `cloudy`, `rainy`, `muggy`, `hot`, `cold`, `mild`, `humid` | Weather conditions |
| Comfort | `abafado`, `quente`, `ameno`, `frio`, `umido`, `chuvoso` | Thermal comfort (PT) |
| Confidence | `high`, `medium`, `low` | Certainty levels |
| Campaign | `excellent`, `good`, `fair`, `poor` | Performance status |
| Brand | `blue`, `lavpop`, `indigo`, `purple`, `whatsapp`, `whatsappTeal` | Brand colors |

**Usage in Components:**
```jsx
const colors = getSemanticColor('revenue');

<div className={`${colors.bg} ${colors.border} border rounded-xl p-4`}>
  <span className={colors.icon}><TrendingUp /></span>
  <p className={colors.text}>Revenue increased</p>
</div>
```

---

## 🎨 Card Color Palette

### KPI Cards (Gradient Backgrounds)

**Revenue/Financial (Teal/Emerald):**
```css
bg-gradient-to-br from-teal-500 to-emerald-600
hover:from-teal-600 hover:to-emerald-700
```
**Usage:** Revenue, sales, financial metrics

**Customer/Growth (Blue/Indigo):**
```css
bg-gradient-to-br from-blue-500 to-indigo-600
hover:from-blue-600 hover:to-indigo-700
```
**Usage:** Customer count, growth metrics, engagement

**Operations (Purple/Violet):**
```css
bg-gradient-to-br from-purple-500 to-violet-600
hover:from-purple-600 hover:to-violet-700
```
**Usage:** Operational metrics, efficiency, cycles

**Performance (Orange/Amber):**
```css
bg-gradient-to-br from-orange-500 to-amber-600
hover:from-orange-600 hover:to-amber-700
```
**Usage:** Performance indicators, utilization, capacity

**Alert/Warning (Red/Rose):**
```css
bg-gradient-to-br from-red-500 to-rose-600
hover:from-red-600 hover:to-rose-700
```
**Usage:** At-risk customers, warnings, critical metrics

**Success/Positive (Green/Emerald):**
```css
bg-gradient-to-br from-green-500 to-emerald-600
hover:from-green-600 hover:to-emerald-700
```
**Usage:** Achievements, positive trends, goals met

---

## 🎴 KPI Card System

### KPI Card Props Standard

Both Hero and Secondary KPI cards use consistent prop naming:

| Prop | Type | Description |
|------|------|-------------|
| `title` | string | Card title |
| `value` | number | Raw numeric value |
| `displayValue` | string | Formatted display string |
| `subtitle` | string | Secondary text |
| `trend` | TrendData | Trend badge configuration |
| `icon` | LucideIcon | Icon component |
| `color` | string | Color key from palette |
| `onClick` | function | Click handler |
| `className` | string | Additional classes |

### KPI Card Selection Guide

Use this decision tree to choose the right card component:

```
Which KPI card should I use?
│
├─ Need sparkline mini-chart?
│   ├─ Yes, primary metric → HeroKPICard
│   └─ Yes, secondary metric → SecondaryKPICard
│
├─ Need vibrant gradient background with white text?
│   └─ Yes → KPICard variant="gradient"
│
├─ Compact dashboard view?
│   ├─ Primary metrics → HeroKPICard compact={true}
│   └─ Secondary metrics → SecondaryKPICard compact={true}
│
└─ Basic metric display?
    └─ KPICard (default variant)
```

**Component Files:**
- `src/components/ui/KPICard.jsx` - Unified card (default, hero, compact, gradient variants)
- `src/components/ui/HeroKPICard.jsx` - Premium gradient with sparklines
- `src/components/ui/SecondaryKPICard.jsx` - Compact gradient with sparklines

### Secondary KPI Card Color Mapping

| Color Key | Gradient | Use Case |
|-----------|----------|----------|
| `cyan` | cyan-500 → blue-600 | Water/Wash metrics |
| `orange` | orange-500 → red-600 | Heat/Dry metrics |
| `purple` | purple-500 → violet-600 | New customers |
| `blue` | blue-500 → indigo-600 | Active customers, general blue |
| `amber` | amber-500 → yellow-600 | Warnings, attention needed |
| `red` | red-500 → rose-600 | At-risk, alerts |
| `green` | green-500 → emerald-600 | Health, positive metrics |
| `slate` | slate-500 → gray-600 | Neutral/disabled |

### Hero KPI Card Color Mapping (Icon Background)

| Color Key | Background | Use Case |
|-----------|------------|----------|
| `blue` | blue-100 / blue-900 | Cycles, operations |
| `green` | emerald-100 / emerald-900 | Revenue, financial |
| `purple` | purple-100 / purple-900 | Utilization, percentage |
| `amber` | amber-100 / amber-900 | Performance, warnings |
| `red` | red-100 / red-900 | Alerts, critical |
| `slate` | slate-100 / slate-700 | Neutral |

---

### Information Cards (Neutral Backgrounds)

**Standard Card:**
```css
bg-white dark:bg-slate-800
border border-slate-200 dark:border-slate-700
```

**Highlighted Card:**
```css
bg-slate-50 dark:bg-slate-800/50
border border-slate-200 dark:border-slate-700
```

**Interactive Card:**
```css
bg-white dark:bg-slate-800
hover:bg-slate-50 dark:hover:bg-slate-700
border border-slate-200 dark:border-slate-700
hover:border-lavpop-blue dark:hover:border-blue-500
cursor-pointer
transition-all duration-200
```

### Status Indicators

**Success:**
```css
bg-emerald-50 dark:bg-emerald-900/20
text-emerald-700 dark:text-emerald-400
border-emerald-200 dark:border-emerald-800
```

**Warning:**
```css
bg-amber-50 dark:bg-amber-900/20
text-amber-700 dark:text-amber-400
border-amber-200 dark:border-amber-800
```

**Error:**
```css
bg-red-50 dark:bg-red-900/20
text-red-700 dark:text-red-400
border-red-200 dark:border-red-800
```

**Info:**
```css
bg-blue-50 dark:bg-blue-900/20
text-blue-700 dark:text-blue-400
border-blue-200 dark:border-blue-800
```

---

## 🪟 Modals & Overlays

### Modal UX Requirements

All modals MUST implement these behaviors:

| Requirement | Implementation | Priority |
|-------------|----------------|----------|
| Escape key close | `useEffect` with `keydown` listener | Required |
| Click-outside close | Backdrop `onClick` handler | Required |
| Portal rendering | `createPortal(modal, document.body)` | Required for child modals |
| Body scroll lock | `document.body.style.overflow = 'hidden'` | Required |
| Focus trap | Focus stays within modal | Recommended |
| ARIA attributes | `role="dialog"`, `aria-modal="true"` | Recommended |

### Modal Container

```jsx
import { createPortal } from 'react-dom';

const Modal = ({ isOpen, onClose, children }) => {
  // Escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Click-outside handler
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="
          relative z-10
          bg-white dark:bg-slate-800
          rounded-2xl shadow-2xl
          border border-slate-200 dark:border-slate-700
          max-w-2xl w-full max-h-[90vh]
          overflow-hidden
        "
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );

  // Use portal for child modals (z-[60])
  return createPortal(modalContent, document.body);
};
```

### Modal Sizes

```css
/* Small - Confirmations, alerts */
max-w-md

/* Medium - Forms, details */
max-w-2xl

/* Large - Complex data, tables */
max-w-4xl

/* Full - Image viewers, detailed reports */
max-w-6xl
```

### Modal Header

```jsx
<div className="
  flex items-center justify-between
  px-6 py-4
  border-b border-slate-200 dark:border-slate-700
  bg-gradient-to-r from-lavpop-blue to-blue-600
">
  <h2 className="text-xl font-bold text-white">
    Modal Title
  </h2>
  <button className="
    p-2 rounded-lg
    text-white/80 hover:text-white
    hover:bg-white/10
    transition-colors
  ">
    <X className="w-5 h-5" />
  </button>
</div>
```

### Modal Body

```jsx
<div className="
  px-6 py-4
  overflow-y-auto
  max-h-[calc(90vh-8rem)]
">
  {/* Scrollable content */}
</div>
```

### Modal Footer

```jsx
<div className="
  flex items-center justify-end gap-3
  px-6 py-4
  border-t border-slate-200 dark:border-slate-700
  bg-slate-50 dark:bg-slate-900/50
">
  <button className="secondary-button">Cancel</button>
  <button className="primary-button">Confirm</button>
</div>
```

### Modal Animation (Framer Motion)

```jsx
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {/* Modal content */}
    </motion.div>
  )}
</AnimatePresence>
```

---

## 💬 Tooltips

### Tooltip Component Structure

```jsx
<div className="relative group">
  {/* Trigger element */}
  <button>Hover me</button>
  
  {/* Tooltip */}
  <div className="
    absolute bottom-full left-1/2 -translate-x-1/2 mb-2
    px-3 py-2
    bg-slate-900 dark:bg-slate-700
    text-white text-xs font-medium
    rounded-lg
    shadow-lg
    opacity-0 group-hover:opacity-100
    pointer-events-none
    transition-opacity duration-200
    whitespace-nowrap
    z-50
  ">
    Tooltip text
    {/* Arrow */}
    <div className="
      absolute top-full left-1/2 -translate-x-1/2
      w-0 h-0
      border-l-4 border-l-transparent
      border-r-4 border-r-transparent
      border-t-4 border-t-slate-900 dark:border-t-slate-700
    " />
  </div>
</div>
```

### Tooltip Positions

**Top (default):**
```css
bottom-full left-1/2 -translate-x-1/2 mb-2
```

**Bottom:**
```css
top-full left-1/2 -translate-x-1/2 mt-2
```

**Left:**
```css
right-full top-1/2 -translate-y-1/2 mr-2
```

**Right:**
```css
left-full top-1/2 -translate-y-1/2 ml-2
```

### Tooltip Variants

**Standard (Dark):**
```css
bg-slate-900 dark:bg-slate-700
text-white
```

**Light:**
```css
bg-white dark:bg-slate-800
text-slate-900 dark:text-white
border border-slate-200 dark:border-slate-700
shadow-xl
```

**Info:**
```css
bg-blue-600 dark:bg-blue-700
text-white
```

**Warning:**
```css
bg-amber-600 dark:bg-amber-700
text-white
```

**Error:**
```css
bg-red-600 dark:bg-red-700
text-white
```

### Tooltip Best Practices

1. **Keep it concise** - Max 1-2 lines
2. **Use for clarification** - Not for essential information
3. **Delay appearance** - 300-500ms hover delay
4. **Portal rendering** - Use React Portal for z-index issues
5. **Mobile alternative** - Use the touch tooltip pattern below

---

## 📱 Mobile Touch Tooltips (Charts)

Charts with interactive tooltips need special handling on touch devices. Use the **tap-to-preview, tap-again-to-action** pattern.

### Pattern Overview

| Action | Desktop | Mobile |
|--------|---------|--------|
| Show tooltip | Hover | First tap |
| Perform action | Click | Second tap (same element) |
| Dismiss | Mouse leave | Tap elsewhere / Auto-dismiss (5s) |

### Implementation

Use the `useTouchTooltip` hook from `src/hooks/useTouchTooltip.js`:

```jsx
// Touch device detection
const isTouchDevice = useRef(false);
const [activeTouch, setActiveTouch] = useState(null);
const touchTimeoutRef = useRef(null);

// Detect touch device
useEffect(() => {
  const handleTouchStart = () => {
    isTouchDevice.current = true;
  };
  window.addEventListener('touchstart', handleTouchStart, { once: true });
  return () => window.removeEventListener('touchstart', handleTouchStart);
}, []);

// Auto-dismiss after 5 seconds
useEffect(() => {
  if (activeTouch) {
    touchTimeoutRef.current = setTimeout(() => setActiveTouch(null), 5000);
    return () => clearTimeout(touchTimeoutRef.current);
  }
}, [activeTouch]);

// Click handler with touch support
const handleClick = useCallback((item) => {
  if (isTouchDevice.current) {
    if (activeTouch === item.id) {
      // Second tap - perform action
      setActiveTouch(null);
      performAction(item);
    } else {
      // First tap - show tooltip only
      setActiveTouch(item.id);
    }
  } else {
    // Desktop - direct action
    performAction(item);
  }
}, [activeTouch]);
```

### Mobile Hint in Tooltip

When an item is "active" from first tap, show a visual hint:

```jsx
const CustomTooltip = ({ payload }) => {
  const isActive = activeTouch === payload[0].payload.id;

  return (
    <div className="tooltip">
      {/* Normal tooltip content */}
      <p>{payload[0].payload.name}</p>

      {/* Mobile hint - shows only when active from first tap */}
      {isActive && (
        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          <p className="text-blue-600 dark:text-blue-400 text-xs font-medium text-center animate-pulse">
            👆 Toque novamente para ver detalhes
          </p>
        </div>
      )}
    </div>
  );
};
```

### Components Using This Pattern

| Component | Action on Second Tap |
|-----------|---------------------|
| `RFMScatterPlot` | Opens CustomerProfileModal |
| `ChurnHistogram` | Opens CustomerSegmentModal for bin |
| `NewClientsChart` | Opens CustomerSegmentModal for day |

---

## 📋 Tables & Data Grids

### Table Container

```jsx
<div className="
  overflow-x-auto
  rounded-xl
  border border-slate-200 dark:border-slate-700
">
  <table className="w-full">
    {/* Table content */}
  </table>
</div>
```

### Table Header

```css
bg-slate-50 dark:bg-slate-800/50
border-b border-slate-200 dark:border-slate-700
text-xs font-semibold text-slate-700 dark:text-slate-300
uppercase tracking-wider
```

### Table Rows

**Standard:**
```css
border-b border-slate-200 dark:border-slate-700
hover:bg-slate-50 dark:hover:bg-slate-800/50
transition-colors
```

**Striped:**
```css
even:bg-slate-50 dark:even:bg-slate-800/30
```

**Interactive:**
```css
cursor-pointer
hover:bg-blue-50 dark:hover:bg-blue-900/20
active:bg-blue-100 dark:active:bg-blue-900/30
```

### Table Cells

```css
px-4 py-3
text-sm text-slate-700 dark:text-slate-300
```

---

## 🎯 Design Patterns for Tabs

### Tab Content Layout

**Standard Tab Structure:**
```jsx
<div className="space-y-6">
  {/* Header Section */}
  <div className="flex items-center justify-between">
    <h1 className="text-2xl font-bold">Tab Title</h1>
    <div className="flex items-center gap-3">
      {/* Actions */}
    </div>
  </div>

  {/* Main Content Grid */}
  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
    {/* Cards */}
  </div>

  {/* Data Section */}
  <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
    {/* Charts, tables, etc. */}
  </div>
</div>
```

### Consistent Spacing

```css
/* Between sections */
space-y-6

/* Card grids */
gap-6

/* Internal card padding */
p-6

/* Compact elements */
gap-3
```

### Loading States

```jsx
<div className="flex items-center justify-center h-64">
  <div className="text-center">
    <Loader className="w-8 h-8 animate-spin text-lavpop-blue mx-auto mb-3" />
    <p className="text-sm text-slate-600 dark:text-slate-400">
      Loading data...
    </p>
  </div>
</div>
```

### Empty States

```jsx
<div className="flex flex-col items-center justify-center h-64 text-center">
  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
    <Icon className="w-8 h-8 text-slate-400" />
  </div>
  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
    No data available
  </h3>
  <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm">
    Description of why there's no data and what to do next.
  </p>
</div>
```

---

## ✅ Accessibility

### Color Contrast
- Text on background: Minimum 4.5:1 ratio
- Large text (18px+): Minimum 3:1 ratio
- Interactive elements: Clear focus states

### Focus States

```css
focus:outline-none
focus:ring-2
focus:ring-lavpop-blue
focus:ring-offset-2
```

### ARIA Labels

```jsx
<button aria-label="Menu">
<nav aria-label="Main navigation">
<div role="status" aria-live="polite">
```

---

## 🎯 Best Practices

### 1. **Consistency**
- Use design tokens from `tailwind.config.js`
- Follow established component patterns
- Maintain spacing rhythm

### 2. **Performance**
- Minimize re-renders with `useMemo`, `useCallback`
- Use CSS transforms for animations
- Lazy load heavy components

### 3. **Maintainability**
- Extract repeated patterns into components
- Document complex logic
- Use semantic HTML

### 4. **Responsiveness**
- Test on multiple screen sizes
- Use relative units (`rem`, `%`, `vh/vw`)
- Provide fallbacks for older browsers

---

## 📱 Mobile View Best Practices

### Viewport & Scaling

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

**Guidelines:**
- `viewport-fit=cover` enables safe area CSS variables
- Allow zoom for accessibility (don't use `user-scalable=no`)
- Set initial scale to 1.0

### Safe Area Support (Notched Devices)

For iPhone X+, Android devices with notches/cutouts, use safe area insets:

```css
/* Safe Area CSS Utilities (src/index.css) */
.safe-area-top {
  padding-top: env(safe-area-inset-top, 0px);
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.bottom-nav-safe {
  padding-bottom: max(0.75rem, env(safe-area-inset-bottom, 0px));
}

/* Touch Target Utilities */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}

.touch-target-lg {
  min-height: 48px;
  min-width: 48px;
}
```

**Usage:**
```jsx
// Top bar with notch support
<header className="safe-area-top">

// Bottom nav with home indicator support
<nav className="bottom-nav-safe">

// Button with proper touch target
<button className="touch-target">
```

### Offline Indicator (`OfflineIndicator.jsx`)

Shows banner when user loses connection:

```jsx
// Automatically detects online/offline status
<OfflineIndicator lastSyncTime={timestamp} />

// Features:
// - Animated slide-in banner (amber for offline, green for reconnecting)
// - Shows "última sincronização: há X min" when offline
// - Auto-hides when connection restored
// - Uses safe-area-top for notched devices
```

### Preventing Horizontal Scroll

**1. Container Constraints:**
```css
/* Always constrain width */
max-w-full
overflow-x-hidden

/* For the body/root */
<body className="overflow-x-hidden">
```

**2. Responsive Images:**
```css
/* Images */
max-w-full h-auto

/* Background images */
bg-cover bg-center
```

**3. Tables & Wide Content:**
```jsx
<div className="overflow-x-auto -mx-4 px-4">
  <table className="min-w-full">
    {/* Table content */}
  </table>
</div>
```

**4. Fixed Width Elements:**
```css
/* Avoid fixed widths, use max-width instead */
❌ w-[500px]
✅ max-w-[500px] w-full
```

### Touch Targets

**Minimum Sizes:**
```css
/* Buttons, links, interactive elements */
min-h-[44px] min-w-[44px]  /* iOS guideline */
min-h-[48px] min-w-[48px]  /* Android guideline */

/* Standard touch target */
h-11 px-4  /* 44px height */
```

**Spacing Between Targets:**
```css
/* Minimum 8px gap between interactive elements */
gap-2  /* 8px */
gap-3  /* 12px - preferred */
```

### Mobile Navigation Patterns

**1. Bottom Navigation (Primary - `BottomNavBar.jsx`):**
```jsx
<nav className="
  lg:hidden fixed bottom-0 inset-x-0 z-40
  bg-white/95 dark:bg-slate-900/95
  backdrop-blur-lg
  border-t border-slate-200/80 dark:border-slate-800/80
  bottom-nav-safe
">
  <div className="flex items-center justify-around h-16 px-1">
    {/* 5 nav items: Dashboard, Diretório, Clientes, Campanhas, Mais */}
  </div>
</nav>
```

**2. Secondary Navigation (Drawer via "Mais" tab):**
- Accessible via "Mais" tab in bottom nav
- Contains: Inteligência, Operações, Upload
- Full-screen overlay with backdrop

### Mobile Gesture Hooks

**1. Swipe Navigation (`useSwipeNavigation.js`):**
```jsx
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';

const { handlers, isSwipeable } = useSwipeNavigation();

// Wrap content with swipe handlers
<motion.div {...handlers}>
  {/* View content - swipe left/right to navigate */}
</motion.div>

// Configuration:
// - Swipe threshold: 50px
// - Velocity threshold: 500px/s
// - Only active on mobile (< lg breakpoint)
// - Navigates between: dashboard, diretorio, customers, campaigns
```

**2. Pull-to-Refresh (`usePullToRefresh.js`):**
```jsx
import { usePullToRefresh } from '../hooks/usePullToRefresh';

const { pullDistance, isPulling, isRefreshing, progress, handlers } = usePullToRefresh(onRefresh);

// Wrap scrollable content
<div {...handlers}>
  {/* Pull indicator */}
  {showIndicator && (
    <div style={{ height: pullDistance }}>
      <RefreshCw className={isRefreshing ? 'animate-spin' : ''} />
    </div>
  )}
  {/* Content */}
</div>

// Configuration:
// - Pull threshold: 80px
// - Resistance factor: 2.5
// - Only triggers when at top of scroll
```

### Mobile Typography

```css
/* Reduce font sizes on mobile */
text-2xl sm:text-3xl lg:text-4xl  /* Headings */
text-sm sm:text-base              /* Body */
text-xs sm:text-sm                /* Small text */
```

### Mobile Spacing

```css
/* Reduce padding on mobile */
p-4 sm:p-6 lg:p-8
gap-4 sm:gap-6 lg:gap-8

/* Reduce margins */
space-y-4 sm:space-y-6
```

### Mobile Forms

**Input Styling:**
```css
/* Larger inputs for touch */
h-12 px-4
text-base  /* Prevents zoom on iOS */
rounded-xl
```

**Input Types:**
```jsx
{/* Use appropriate input types for mobile keyboards */}
<input type="email" inputMode="email" />
<input type="tel" inputMode="tel" />
<input type="number" inputMode="numeric" />
```

### Mobile Performance

**1. Reduce Animations:**
```jsx
// Disable complex animations on mobile
const shouldAnimate = useMediaQuery('(min-width: 1024px)');

<motion.div
  animate={shouldAnimate ? { ... } : undefined}
>
```

**2. Lazy Loading:**
```jsx
// Load heavy components only when needed
const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<Loader />}>
  <HeavyComponent />
</Suspense>
```

**3. Image Optimization:**
```jsx
<img
  src="image.jpg"
  srcSet="image-small.jpg 640w, image-medium.jpg 1024w, image-large.jpg 1920w"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  loading="lazy"
  alt="Description"
/>
```

---

## 🎠 Card Carousels (Embla)

### Basic Carousel Setup

```jsx
import useEmblaCarousel from 'embla-carousel-react';

const MyCarousel = ({ items }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: false,
    loop: false,
  });

  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex gap-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333%] min-w-0"
          >
            {/* Card content */}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Carousel Configuration

**Options:**
```javascript
{
  align: 'start',        // 'start', 'center', 'end'
  containScroll: 'trimSnaps',  // Prevents blank space
  dragFree: false,       // Snap to slides
  loop: false,           // Infinite loop
  skipSnaps: false,      // Skip empty snaps
  slidesToScroll: 1,     // Number of slides per scroll
}
```

### Responsive Slide Widths

```css
/* Mobile: 1 card */
flex-[0_0_100%]

/* Tablet: 2 cards */
sm:flex-[0_0_50%]

/* Desktop: 3 cards */
lg:flex-[0_0_33.333%]

/* Large desktop: 4 cards */
xl:flex-[0_0_25%]
```

### Carousel Navigation

```jsx
const [emblaRef, emblaApi] = useEmblaCarousel();
const [canScrollPrev, setCanScrollPrev] = useState(false);
const [canScrollNext, setCanScrollNext] = useState(false);

useEffect(() => {
  if (!emblaApi) return;

  const onSelect = () => {
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  };

  emblaApi.on('select', onSelect);
  onSelect();

  return () => emblaApi.off('select', onSelect);
}, [emblaApi]);

// Navigation buttons
<button
  onClick={() => emblaApi?.scrollPrev()}
  disabled={!canScrollPrev}
  className="carousel-button"
>
  <ChevronLeft />
</button>
```

### Carousel Dots

```jsx
const [selectedIndex, setSelectedIndex] = useState(0);
const [scrollSnaps, setScrollSnaps] = useState([]);

useEffect(() => {
  if (!emblaApi) return;

  setScrollSnaps(emblaApi.scrollSnapList());
  
  const onSelect = () => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
  };

  emblaApi.on('select', onSelect);
  onSelect();

  return () => emblaApi.off('select', onSelect);
}, [emblaApi]);

// Dots
<div className="flex justify-center gap-2 mt-4">
  {scrollSnaps.map((_, index) => (
    <button
      key={index}
      onClick={() => emblaApi?.scrollTo(index)}
      className={`
        w-2 h-2 rounded-full transition-all
        ${index === selectedIndex
          ? 'bg-lavpop-blue w-6'
          : 'bg-slate-300 dark:bg-slate-600'}
      `}
    />
  ))}
</div>
```

### Carousel Best Practices

1. **Always set min-w-0** - Prevents flex items from overflowing
2. **Use gap instead of margin** - Better spacing control
3. **Disable on desktop when not needed** - Show grid instead
4. **Add touch feedback** - Visual indication of draggability
5. **Preload adjacent slides** - Better performance

### When to Use Carousels

**✅ Good Use Cases:**
- KPI cards on mobile (limited screen space)
- Image galleries
- Product showcases
- Testimonials

**❌ Avoid Carousels For:**
- Critical information (users might miss it)
- Long lists (use pagination or infinite scroll)
- Desktop layouts with plenty of space

---

## 🔍 Search & Filtering

### Search Input

```jsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
  <input
    type="search"
    placeholder="Search..."
    className="
      w-full h-11 pl-10 pr-4
      bg-slate-50 dark:bg-slate-800
      border border-slate-200 dark:border-slate-700
      rounded-xl
      text-sm
      placeholder:text-slate-400
      focus:outline-none focus:ring-2 focus:ring-lavpop-blue
      transition-all
    "
  />
</div>
```

### Filter Chips

```jsx
<div className="flex flex-wrap gap-2">
  {filters.map(filter => (
    <button
      key={filter.id}
      className={`
        px-3 py-1.5 rounded-full text-xs font-medium
        transition-all
        ${filter.active
          ? 'bg-lavpop-blue text-white'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}
      `}
    >
      {filter.label}
      {filter.active && (
        <X className="inline-block w-3 h-3 ml-1" />
      )}
    </button>
  ))}
</div>
```

---

## 📊 Data States

### Loading Skeleton

```jsx
<div className="animate-pulse space-y-4">
  <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
</div>
```

### Error State

```jsx
<div className="flex flex-col items-center justify-center h-64 text-center">
  <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
    <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
  </div>
  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
    Error loading data
  </h3>
  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 max-w-sm">
    {errorMessage}
  </p>
  <button onClick={retry} className="primary-button">
    Try Again
  </button>
</div>
```

---

## 🎨 Micro-interactions

### Button Press Feedback

```css
active:scale-95
transition-transform duration-100
```

### Hover Lift

```css
hover:-translate-y-1
hover:shadow-lg
transition-all duration-200
```

### Ripple Effect (CSS only)

```css
relative overflow-hidden
before:absolute before:inset-0
before:bg-white/20
before:scale-0 before:rounded-full
hover:before:scale-100
before:transition-transform before:duration-500
```

### Loading Spinner

```jsx
<div className="relative">
  <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-lavpop-blue rounded-full animate-spin" />
</div>
```

---

## 🔐 Security & Privacy

### Data Handling

1. **Never log sensitive data** to console in production
2. **Sanitize user inputs** before displaying
3. **Use HTTPS** for all API calls
4. **Implement CORS** properly on backend

### Local Storage

```javascript
// Encrypt sensitive data before storing
const encryptedData = encrypt(sensitiveData);
localStorage.setItem('key', encryptedData);

// Clear on logout
const clearUserData = () => {
  localStorage.clear();
  sessionStorage.clear();
};
```

---

## 📦 Component Checklist

When creating new components, ensure:

**Core Requirements:**
- [ ] Responsive design (mobile-first)
- [ ] Dark mode support (all `bg-*` have `dark:bg-*` pair)
- [ ] Minimum font size `text-xs` (never `text-[10px]`)
- [ ] Proper spacing and typography
- [ ] Smooth transitions

**Accessibility:**
- [ ] Accessible markup and labels (`aria-*` attributes)
- [ ] Keyboard navigation (focus states, escape key for modals)
- [ ] **Minimum touch target size: 44x44px** (use `touch-target` class)
- [ ] Focus-visible states for keyboard users

**Mobile Requirements (v3.3+):**
- [ ] Safe area support for fixed elements (`safe-area-top`, `bottom-nav-safe`)
- [ ] Touch-friendly tooltips (tap-to-toggle, no hover-only)
- [ ] Bottom nav clearance (`pb-24 lg:pb-6` for main content)
- [ ] Works offline (graceful degradation)

**Interactive Elements:**
- [ ] Loading and error states
- [ ] Touch-friendly on mobile (tap-to-preview for charts)
- [ ] Click-outside to close (for modals/dropdowns)
- [ ] No hover-only interactions (always provide tap fallback)

**Architecture:**
- [ ] Use semantic z-index from constants (never arbitrary values)
- [ ] Portal rendering for modals that can be stacked
- [ ] Consistent with design system patterns

---

## 🔗 Related Files

### Configuration
- **Tailwind Config:** `tailwind.config.js`
- **Z-Index Constants:** `src/constants/zIndex.js`
- **Global CSS:** `src/index.css` (safe areas, touch targets)

### Contexts & Hooks
- **Theme Context:** `src/contexts/ThemeContext.jsx`
- **Sidebar Context:** `src/contexts/SidebarContext.jsx`
- **Navigation Context:** `src/contexts/NavigationContext.jsx`
- **Touch Tooltip Hook:** `src/hooks/useTouchTooltip.js`
- **Swipe Navigation Hook:** `src/hooks/useSwipeNavigation.js` *(NEW v3.3)*
- **Pull-to-Refresh Hook:** `src/hooks/usePullToRefresh.js` *(NEW v3.3)*
- **Media Query Hook:** `src/hooks/useMediaQuery.js`

### Navigation
- **Main App:** `src/App.jsx`
- **Icon Sidebar:** `src/components/IconSidebar.jsx`
- **Top Bar:** `src/components/MinimalTopBar.jsx`
- **Bottom Nav Bar:** `src/components/navigation/BottomNavBar.jsx` *(NEW v3.3)*
- **Bottom Nav Item:** `src/components/navigation/BottomNavItem.jsx` *(NEW v3.3)*
- **Mobile Backdrop:** `src/components/Backdrop.jsx`

### Mobile Components
- **Offline Indicator:** `src/components/OfflineIndicator.jsx` *(NEW v3.3)*

### Modals
- **KPI Detail Modal:** `src/components/modals/KPIDetailModal.jsx`
- **Customer Segment Modal:** `src/components/modals/CustomerSegmentModal.jsx`
- **Customer Profile Modal:** `src/components/CustomerProfileModal.jsx`

### Charts (with Mobile Touch Support)
- **RFM Scatter Plot:** `src/components/RFMScatterPlot.jsx`
- **Churn Histogram:** `src/components/ChurnHistogram.jsx`
- **New Clients Chart:** `src/components/NewClientsChart.jsx`

### Widgets
- **Retention Pulse:** `src/components/RetentionPulse.jsx`
- **Secondary KPI Card:** `src/components/ui/SecondaryKPICard.jsx`
- **Hero KPI Card:** `src/components/ui/HeroKPICard.jsx`
- **Section Header:** `src/components/ui/SectionHeader.jsx` *(NEW v3.4)*
- **Context Help:** `src/components/ContextHelp.jsx`

### Utilities
- **Color Mapping:** `src/utils/colorMapping.js`
- **Metric Tooltips:** `src/constants/metricTooltips.js`

### Documentation
- **Mobile App Audit:** `docs/mobile-app-audit.md` *(NEW v3.3)*

---

**Powered by Nova Lopez Lavanderia Ltd.**
