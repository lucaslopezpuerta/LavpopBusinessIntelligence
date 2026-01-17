# Bilavnova Design System v5.0

> **Theme:** Cosmic Precision - Space-age aesthetics with stellar gradients
> **Last Updated:** January 17, 2026
> **Dark Mode:** Fully functional via Tailwind safelist + useTheme pattern

---

## Quick Start (Agent TL;DR)

### The One Decision: Which Variant?

```
What are you styling?
│
├─► Primitive (Button, Input, Badge, Tooltip)     → VARIANT A
├─► Container (KPICard, SectionCard)              → VARIANT A
├─► Dashboard widget WITH semantic category       → VARIANT B (pick accent color)
├─► Dashboard widget, neutral/dynamic content     → VARIANT C
├─► Navigation or Overlay (Sidebar, Modal)        → VARIANT D
└─► Hero/Branding (Login, Loading)                → VARIANT E
```

### Complete Component → Variant Matrix

| Component | Variant | Container Classes |
|-----------|---------|-------------------|
| **Button** | A | `bg-white dark:bg-space-dust border-slate-200 dark:border-stellar-cyan/10` |
| **Input/Select** | A | `bg-white dark:bg-space-dust border-slate-200 dark:border-stellar-cyan/10` |
| **Badge** | A | `bg-white dark:bg-space-dust border-slate-200 dark:border-stellar-cyan/10` |
| **Tooltip** | A | `bg-white dark:bg-space-dust border-slate-200 dark:border-stellar-cyan/10` |
| **KPICard** | A | `bg-white dark:bg-space-dust border-slate-200 dark:border-stellar-cyan/10` |
| **SectionCard** | A | `bg-white dark:bg-space-dust border-slate-200 dark:border-stellar-cyan/10` |
| **AcquisitionCard** | B | `from-purple-50/40 dark:via-space-nebula border-l-purple-500` |
| **RetentionCard** | B | `from-emerald-50/40 dark:via-space-nebula border-l-emerald-500` |
| **ChurnCard** | B | `from-red-50/40 dark:via-space-nebula border-l-red-500` |
| **Generic Dashboard** | C | `from-slate-50/60 dark:via-space-nebula` |
| **Sidebar** | D | `bg-space-nebula/90 backdrop-blur-xl border-stellar-cyan/10` |
| **TopBar** | D | `bg-white/95 dark:bg-space-nebula/90 backdrop-blur-xl` |
| **Modal** | D | `bg-white/98 dark:bg-space-dust/95 backdrop-blur-xl` |
| **Dropdown** | D | `bg-white/95 dark:bg-space-dust backdrop-blur-xl` |
| **Login Page** | E | `bg-space-void` + starfield + aurora |
| **Loading Screen** | E | `bg-space-void` + orbital animation |

### Semantic Accent Colors (for Variant B)

| Category | Accent | Example Components |
|----------|--------|--------------------|
| Acquisition/New | `purple` | AcquisitionCard, NewCustomers |
| Retention/Success | `emerald` | RetentionCard, HealthMetrics |
| Revenue/Financial | `teal` | RevenueCard, ProfitMetrics |
| Operations/Cycles | `cyan` | OperatingCyclesChart |
| Warning/Attention | `amber` | FrequencyDegradationAlert |
| Risk/Critical | `red` | ChurnHistogram, AtRiskTable |
| Analytics/General | `blue` | VisitHeatmap, RFMScatterPlot |

---

## Part 1: Foundation Tokens

### 1.1 Color System

#### Space Colors (Dark Backgrounds)

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| **Space Void** | `#050816` | `bg-space-void` | Page background (deepest) |
| **Space Nebula** | `#0a0f1e` | `bg-space-nebula` | Fixed elements (sidebar, topbar) |
| **Space Dust** | `#1a1f35` | `bg-space-dust` | Cards, modals, elevated surfaces |
| **Space Light** | `#f8fafc` | `bg-space-light` | Light mode page background |

```
Depth Hierarchy (Dark Mode):
┌────────────────────────────────────────┐
│  VOID (#050816)    - Page background   │
│  ├── NEBULA (#0a0f1e) - Fixed nav      │
│  │   └── DUST (#1a1f35) - Cards        │
└────────────────────────────────────────┘
```

#### Stellar Colors (Accents)

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| **Stellar Blue** | `#2d388a` | `text-stellar-blue` | Gradient start, deep accents |
| **Stellar Cyan** | `#00aeef` | `text-stellar-cyan` | Active states, links, focus |

**Stellar Cyan Opacity Scale:**
- `/5` - Light mode subtle borders
- `/10` - Dark mode card borders (most common)
- `/15` - Visible borders, navigation
- `/20` - Active state backgrounds

#### Semantic Colors

| Semantic | Light BG | Dark BG | Border | Use For |
|----------|----------|---------|--------|---------|
| Revenue | `teal-50` | `teal-900/20` | `teal-500` | Financial metrics |
| Cost | `red-50` | `red-900/20` | `red-500` | Expenses, negative |
| Profit | `emerald-50` | `emerald-900/20` | `emerald-500` | Positive outcomes |
| Warning | `amber-50` | `amber-900/20` | `amber-500` | Attention needed |
| Info | `blue-50` | `blue-900/20` | `blue-500` | Informational |

### 1.2 Typography

**Fonts:**
- **Primary:** Inter (body text)
- **Display:** Orbitron (brand name only)
- **Monospace:** JetBrains Mono (code, data)

**Size Scale:**
| Name | Class | Size | Usage |
|------|-------|------|-------|
| Display | `text-2xl` | 24px | Page titles, hero headings |
| Heading | `text-xl` | 20px | Section titles |
| Subheading | `text-lg` | 18px | Card titles |
| Body | `text-sm` | 14px | Standard text |
| Small | `text-xs` | 12px | Labels, captions (MINIMUM) |

> **Rule:** Never use `text-[10px]` or smaller. Minimum is `text-xs` (12px).

**Text Color Hierarchy:**

| Level | Light Mode | Dark Mode |
|-------|------------|-----------|
| Primary | `text-slate-900` | `text-white` |
| Secondary | `text-slate-700` | `text-slate-200` |
| Body | `text-slate-600` | `text-slate-300` |
| Muted | `text-slate-500` | `text-slate-400` |
| Subtle | `text-slate-400` | `text-slate-500` |

### 1.3 Spacing & Layout

**Breakpoints:**
```javascript
xs: '475px'   // Large phones
sm: '640px'   // Mobile landscape
md: '768px'   // Tablets
lg: '1024px'  // Desktop
xl: '1280px'  // Large desktop
```

**Z-Index System:**
| Layer | Z-Index | Tailwind | Use For |
|-------|---------|----------|---------|
| Dropdown | 40 | `z-40` | Dropdowns, popovers |
| Sidebar | 40 | `z-40` | Icon sidebar |
| Modal | 50 | `z-50` | Primary modals |
| Child Modal | 60 | `z-[60]` | Modal over modal |
| Alert | 70 | `z-[70]` | Confirmation dialogs |
| Toast | 80 | `z-[80]` | Notifications |

**Spacing Scale:**
```
gap-1  (4px)  - Tight
gap-2  (8px)  - Compact
gap-3  (12px) - Standard
gap-4  (16px) - Comfortable
gap-6  (24px) - Spacious
gap-8  (32px) - Sections
```

**Border Radius:**
```
rounded-lg   (8px)  - Buttons, inputs
rounded-xl   (12px) - Cards, containers
rounded-2xl  (16px) - Large cards, modals
rounded-3xl  (24px) - Hero elements
```

---

## Part 2: The Cosmic Variants

### 2.1 Variant A: Solid Cosmic

**Use for:** Reusable primitives, containers, simple cards

**Characteristics:**
- Clean solid backgrounds
- No gradients, maximum reusability
- Works in any context

```jsx
// VARIANT A - Complete Template
<div className="
  bg-white dark:bg-space-dust
  border border-slate-200 dark:border-stellar-cyan/10
  rounded-xl
  p-4
">
  <h3 className="text-base font-bold text-slate-800 dark:text-white">
    Title
  </h3>
  <p className="text-sm text-slate-600 dark:text-slate-400">
    Content
  </p>
</div>
```

**Reference:** `KPICard.jsx`, `SectionCard.jsx`, `Button.jsx`

---

### 2.2 Variant B: Accent-Tinted Cosmic

**Use for:** Dashboard widgets with semantic category

**Characteristics:**
- Accent-tinted gradient background
- Permanent left border stripe
- Strong category identity

```jsx
// VARIANT B - Complete Template
// Replace {accent} with: purple, emerald, teal, cyan, amber, red, blue
<div className="
  bg-gradient-to-br from-{accent}-50/40 via-white to-white
  dark:from-{accent}-900/10 dark:via-space-nebula dark:to-space-nebula
  border border-slate-200/80 dark:border-stellar-cyan/10
  border-l-4 border-l-{accent}-500 dark:border-l-{accent}-400
  rounded-2xl
  p-4 sm:p-5
">
  {/* Header with icon */}
  <div className="flex items-center gap-2 mb-3">
    <div className="p-2 bg-{accent}-100 dark:bg-{accent}-900/40 rounded-lg">
      <Icon className="w-5 h-5 text-{accent}-600 dark:text-{accent}-400" />
    </div>
    <div>
      <h3 className="text-base font-bold text-slate-800 dark:text-white">
        Card Title
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Subtitle
      </p>
    </div>
  </div>

  {/* Content */}
  <div className="mt-4">
    {children}
  </div>
</div>
```

**Reference:** `AcquisitionCard.jsx`, `RetentionCard.jsx`, `ChurnHistogram.jsx`

---

### 2.3 Variant C: Neutral Dashboard Cosmic

**Use for:** Dashboard widgets with dynamic/mixed content

**Characteristics:**
- Neutral gradient (no accent tint)
- Flexible for status-based styling
- Optional dynamic accent border

```jsx
// VARIANT C - Complete Template
<div className="
  bg-gradient-to-br from-slate-50/60 via-white to-white
  dark:from-space-dust/40 dark:via-space-nebula dark:to-space-nebula
  border border-slate-200/80 dark:border-stellar-cyan/10
  rounded-2xl
  p-4 sm:p-5
">
  <h3 className="text-base font-bold text-slate-800 dark:text-white">
    Card Title
  </h3>
  <p className="text-sm text-slate-600 dark:text-slate-400">
    Dynamic content here
  </p>
</div>

// With dynamic accent border:
<div className={`
  bg-gradient-to-br from-slate-50/60 via-white to-white
  dark:from-space-dust/40 dark:via-space-nebula dark:to-space-nebula
  border border-slate-200/80 dark:border-stellar-cyan/10
  ${status === 'warning' ? 'border-l-4 border-l-amber-500' : ''}
  rounded-2xl p-4
`}>
```

**Reference:** `AtRiskCustomersTable.jsx`, `FirstVisitConversionCard.jsx`

---

### 2.4 Variant D: Glassmorphism Cosmic

**Use for:** Navigation, modals, dropdowns, overlays

**Characteristics:**
- Semi-transparent background
- Backdrop blur effect
- Requires `useTheme()` hook

```jsx
// VARIANT D - Complete Template
import { useTheme } from '../contexts/ThemeContext';

const MyOverlay = () => {
  const { isDark } = useTheme();

  // For NAVIGATION (sidebar, topbar):
  return (
    <div className={`
      ${isDark ? 'bg-space-nebula/90' : 'bg-white/95'}
      backdrop-blur-xl
      border-r ${isDark ? 'border-stellar-cyan/10' : 'border-slate-200'}
      ${isDark ? 'shadow-[0_0_24px_rgba(0,174,239,0.05)]' : 'shadow-sm'}
    `}>
      {/* Navigation content */}
    </div>
  );

  // For MODALS:
  return (
    <div className={`
      ${isDark ? 'bg-space-dust/95' : 'bg-white/98'}
      backdrop-blur-xl
      border ${isDark ? 'border-stellar-cyan/20' : 'border-slate-200'}
      shadow-2xl
      rounded-2xl
      p-6
    `}>
      <h2 className={isDark ? 'text-white' : 'text-slate-900'}>
        Modal Title
      </h2>
      {/* Modal content */}
    </div>
  );

  // For DROPDOWNS:
  return (
    <div className={`
      ${isDark ? 'bg-space-dust' : 'bg-white/95'}
      backdrop-blur-xl
      border ${isDark ? 'border-stellar-cyan/15' : 'border-slate-200'}
      shadow-xl
      rounded-xl
      p-2
    `}>
      {/* Dropdown items */}
    </div>
  );
};
```

**Reference:** `IconSidebar.jsx`, `BottomNavBar.jsx`, `KPIDetailModal.jsx`

---

### 2.5 Variant E: Premium Cosmic

**Use for:** Login, loading, splash, hero sections

**Characteristics:**
- Full cosmic experience
- Starfield background (dark mode)
- Aurora overlay effects
- Maximum visual impact

```jsx
// VARIANT E - Complete Template
import { useTheme } from '../contexts/ThemeContext';

const MyHeroPage = () => {
  const { isDark } = useTheme();

  return (
    <div className={`
      min-h-screen relative overflow-hidden
      ${isDark ? 'bg-space-void' : 'bg-gradient-to-br from-slate-50 to-blue-50'}
    `}>
      {/* Starfield - dark mode only */}
      {isDark && (
        <div className="absolute inset-0 bg-starfield opacity-60 pointer-events-none" />
      )}

      {/* Aurora overlay */}
      <div className="aurora-overlay pointer-events-none" />

      {/* Content card */}
      <div className={`
        relative z-10 mx-auto max-w-md
        ${isDark ? 'bg-space-dust/80' : 'bg-white/90'}
        backdrop-blur-2xl
        border ${isDark ? 'border-stellar-cyan/20' : 'border-white/50'}
        shadow-2xl
        rounded-3xl
        p-8
      `}>
        {/* Brand text with gradient */}
        <h1 className="text-gradient-stellar font-display text-4xl text-center">
          BILAVNOVA
        </h1>

        {/* Content */}
        {children}
      </div>
    </div>
  );
};
```

**Reference:** `LoginPage.jsx`, `LoadingScreen.jsx`

---

## Part 3: Component Catalog

### 3.1 Buttons

**Variant:** A (Solid Cosmic)

| Type | Classes |
|------|---------|
| **Primary** | `bg-gradient-stellar text-white font-semibold shadow-md hover:shadow-lg rounded-xl px-4 py-2` |
| **Secondary** | `bg-white dark:bg-space-dust text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-stellar-cyan/15 rounded-xl px-4 py-2` |
| **Ghost** | `bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-space-dust rounded-xl px-4 py-2` |
| **Danger** | `bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold rounded-xl px-4 py-2` |
| **Icon** | `p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-space-dust` |

```jsx
// Primary Button
<button className="
  bg-gradient-stellar text-white font-semibold
  shadow-md hover:shadow-lg hover:shadow-stellar-cyan/25
  rounded-xl px-4 py-2
  active:scale-[0.98] transition-all
">
  Primary Action
</button>

// Secondary Button
<button className="
  bg-white dark:bg-space-dust
  text-slate-700 dark:text-slate-200
  border border-slate-200 dark:border-stellar-cyan/15
  hover:bg-slate-50 dark:hover:bg-space-nebula
  rounded-xl px-4 py-2
  transition-all
">
  Secondary Action
</button>
```

**Reference:** `Button.jsx`

---

### 3.2 Cards

**KPICard (Variant A):**
```jsx
<div className="
  bg-white dark:bg-space-dust
  border border-slate-200 dark:border-stellar-cyan/10
  rounded-xl p-4
">
  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
    Label
  </p>
  <p className="text-2xl font-bold text-slate-900 dark:text-white">
    Value
  </p>
  <p className="text-xs text-slate-500 dark:text-slate-400">
    Subtitle
  </p>
</div>
```

**SectionCard (Variant A):**
```jsx
<section className="
  bg-white dark:bg-space-dust
  border border-slate-200 dark:border-stellar-cyan/10
  rounded-2xl p-6
">
  {/* Section header */}
  <div className="flex items-center gap-3 mb-4">
    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg border-l-4 border-emerald-500">
      <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    </div>
    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
      Section Title
    </h2>
  </div>
  {/* Content */}
  {children}
</section>
```

**Dashboard Card (Variant B/C):** See Part 2.2 and 2.3

**Reference:** `KPICard.jsx`, `SectionCard.jsx`, `AcquisitionCard.jsx`

---

### 3.3 Navigation

**Sidebar (Variant D):**
```jsx
const { isDark } = useTheme();

<aside className={`
  fixed left-0 top-0 h-full w-[60px] hover:w-[240px]
  ${isDark ? 'bg-space-nebula' : 'bg-white/95'}
  backdrop-blur-xl
  border-r ${isDark ? 'border-stellar-cyan/10' : 'border-slate-200'}
  z-40 transition-all duration-300
`}>
  {/* Logo */}
  <div className="p-4">
    <span className={isDark ? 'text-white' : 'text-slate-900'}>BILAV</span>
    <span className="text-stellar-cyan">NOVA</span>
  </div>

  {/* Nav items */}
  <nav className="mt-4">
    {/* Active item */}
    <a className="
      flex items-center gap-3 px-4 py-3
      bg-gradient-stellar-horizontal text-white
      shadow-md shadow-bilavnova
    ">
      <Icon className="w-5 h-5" />
      <span>Dashboard</span>
    </a>

    {/* Inactive item */}
    <a className={`
      flex items-center gap-3 px-4 py-3
      ${isDark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100'}
    `}>
      <Icon className="w-5 h-5" />
      <span>Customers</span>
    </a>
  </nav>
</aside>
```

**TopBar (Variant D):**
```jsx
<header className={`
  sticky top-0 z-40 h-14
  ${isDark ? 'bg-space-nebula/90' : 'bg-white/85'}
  backdrop-blur-xl
  border-b ${isDark ? 'border-stellar-cyan/10' : 'border-slate-200'}
`}>
  {/* Content */}
</header>
```

**BottomNavBar (Variant D):**
```jsx
<nav className={`
  fixed bottom-0 left-0 right-0
  ${isDark ? 'bg-space-dust' : 'bg-white/90'}
  backdrop-blur-xl
  border-t ${isDark ? 'border-stellar-cyan/15' : 'border-slate-200'}
  ${isDark
    ? 'shadow-[0_-4px_24px_-4px_rgba(0,174,239,0.1)]'
    : 'shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)]'
  }
  safe-area-bottom
`}>
  {/* 5 nav items */}
</nav>
```

**Reference:** `IconSidebar.jsx`, `MinimalTopBar.jsx`, `BottomNavBar.jsx`

---

### 3.4 Modals & Overlays

**Modal (Variant D):**
```jsx
const { isDark } = useTheme();

{/* Backdrop */}
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />

{/* Modal */}
<div className={`
  fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
  w-full max-w-lg max-h-[90vh] overflow-auto
  ${isDark ? 'bg-space-dust' : 'bg-white'}
  border ${isDark ? 'border-stellar-cyan/15' : 'border-slate-200'}
  shadow-2xl rounded-2xl
  z-50 p-6
`}>
  {/* Header */}
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
      Modal Title
    </h2>
    <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-space-nebula">
      <X className="w-5 h-5" />
    </button>
  </div>

  {/* Content */}
  {children}

  {/* Footer */}
  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-stellar-cyan/10">
    <Button variant="secondary">Cancel</Button>
    <Button variant="primary">Confirm</Button>
  </div>
</div>
```

**Dropdown (Variant D):**
```jsx
<div className={`
  absolute top-full right-0 mt-2 w-56
  ${isDark ? 'bg-space-dust' : 'bg-white/95'}
  backdrop-blur-xl
  border ${isDark ? 'border-stellar-cyan/15' : 'border-slate-200'}
  shadow-xl rounded-xl
  z-40 p-1
`}>
  {/* Items */}
  <button className={`
    w-full text-left px-3 py-2 rounded-lg
    ${isDark ? 'hover:bg-white/5 text-slate-200' : 'hover:bg-slate-100 text-slate-700'}
  `}>
    Menu Item
  </button>
</div>
```

**Reference:** `KPIDetailModal.jsx`, `CustomerSegmentModal.jsx`, `CosmicDropdown.jsx`

---

### 3.5 Forms & Inputs

**Variant:** A (Solid Cosmic)

**Text Input:**
```jsx
<input
  type="text"
  className="
    w-full px-4 py-2.5
    bg-white dark:bg-space-dust
    border border-slate-200 dark:border-stellar-cyan/10
    rounded-xl
    text-slate-900 dark:text-white
    placeholder:text-slate-400 dark:placeholder:text-slate-500
    focus:outline-none focus:ring-2 focus:ring-stellar-cyan focus:border-transparent
    transition-all
  "
  placeholder="Enter text..."
/>
```

**Select:**
```jsx
<select className="
  w-full px-4 py-2.5
  bg-white dark:bg-space-dust
  border border-slate-200 dark:border-stellar-cyan/10
  rounded-xl
  text-slate-900 dark:text-white
  focus:outline-none focus:ring-2 focus:ring-stellar-cyan
">
  <option>Option 1</option>
</select>
```

**Checkbox:**
```jsx
<label className="flex items-center gap-2 cursor-pointer">
  <input
    type="checkbox"
    className="
      w-4 h-4 rounded
      border-slate-300 dark:border-stellar-cyan/20
      text-stellar-cyan
      focus:ring-stellar-cyan focus:ring-offset-0
      dark:bg-space-dust
    "
  />
  <span className="text-sm text-slate-700 dark:text-slate-300">
    Label
  </span>
</label>
```

---

### 3.6 Tables & Data

**Variant:** A (Solid Cosmic)

```jsx
<div className="
  bg-white dark:bg-space-dust
  border border-slate-200 dark:border-stellar-cyan/10
  rounded-xl overflow-hidden
">
  <table className="w-full">
    <thead>
      <tr className="border-b border-slate-200 dark:border-stellar-cyan/10">
        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
          Column
        </th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b border-slate-100 dark:border-stellar-cyan/5 hover:bg-slate-50 dark:hover:bg-white/5">
        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
          Data
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

### 3.7 Charts & Visualization

**Chart Container:**
```jsx
<div className="
  bg-white dark:bg-space-dust
  border border-slate-200 dark:border-stellar-cyan/10
  rounded-xl p-4
">
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
      <XAxis stroke={isDark ? '#64748b' : '#94a3b8'} />
      <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} />
      <Tooltip content={<CustomTooltip />} />
      <Bar dataKey="value" fill="#00aeef" />
    </BarChart>
  </ResponsiveContainer>
</div>
```

**Chart Tooltip (Variant A):**
```jsx
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload) return null;

  return (
    <div className="
      bg-white dark:bg-space-dust
      border border-slate-200 dark:border-stellar-cyan/10
      rounded-lg shadow-lg p-3
    ">
      <p className="text-sm font-semibold text-slate-900 dark:text-white">
        {payload[0].value}
      </p>
    </div>
  );
};
```

**Reference:** `src/utils/chartColors.js` for theme-aware chart colors

---

### 3.8 Tooltips

**Static Tooltip (Variant A):**
```jsx
<div className="
  bg-white dark:bg-space-dust
  border border-slate-200 dark:border-stellar-cyan/10
  rounded-lg shadow-lg
  px-3 py-2
  text-sm text-slate-700 dark:text-slate-300
">
  Tooltip content
</div>
```

**Touch Tooltip (Charts):**
```jsx
// Use useTouchTooltip hook for mobile chart interactions
import { useTouchTooltip } from '../hooks/useTouchTooltip';

// First tap: show tooltip
// Second tap (same element): trigger action
// Tap elsewhere: dismiss
```

---

## Part 4: Advanced Cosmic Effects

> Use sparingly. Maximum 2-3 animated effects visible at once.

### Glow Borders
```jsx
// Animated gradient border
<div className="border-glow rounded-xl p-6 bg-space-dust">
  Premium Feature
</div>

// Pulsing glow
<button className="border-pulse-glow rounded-lg">Active</button>
```

### Cosmic Dividers
```jsx
// Static gradient divider
<div className="divider-cosmic my-8" />

// Animated flowing divider
<div className="divider-cosmic-animated my-8" />
```

### Hover Effects
```jsx
// Cyan glow on hover
<div className="hover-stellar-glow rounded-xl p-6 transition-all">
  Hover me
</div>
```

### Background Effects
```jsx
// Nebula clouds (hero backgrounds)
<section className="bg-space-void bg-nebula-clouds min-h-screen">

// Starfield (dark mode)
{isDark && <div className="absolute inset-0 bg-starfield opacity-60" />}

// Aurora overlay
<div className="aurora-overlay" />
```

### Special Gradients
| Class | Effect |
|-------|--------|
| `bg-gradient-stellar` | 135° stellar blue → cyan |
| `bg-gradient-nebula` | Blue → purple → cyan |
| `bg-gradient-aurora-subtle` | Vertical aurora fade |
| `text-gradient-stellar` | Gradient text (brand name) |

---

## Part 5: Technical Reference

### useTheme Pattern

Required for Variant D and E components:

```jsx
import { useTheme } from '../contexts/ThemeContext';

const MyComponent = () => {
  const { isDark } = useTheme();

  return (
    <div className={`
      ${isDark ? 'bg-space-dust' : 'bg-white'}
      ${isDark ? 'border-stellar-cyan/10' : 'border-slate-200'}
    `}>
      {/* Content */}
    </div>
  );
};
```

**When to use:**
- `useTheme + isDark`: Navigation, modals, glassmorphism (100% reliable)
- `dark:` prefix: Simple components, badges (95% reliable)

### Tailwind Safelist

Classes stored in JavaScript objects must be in `tailwind.config.js` safelist:

```javascript
safelist: [
  'bg-space-void', 'bg-space-nebula', 'bg-space-dust',
  'dark:bg-space-void', 'dark:bg-space-nebula', 'dark:bg-space-dust',
  'border-stellar-cyan/5', 'border-stellar-cyan/10', 'border-stellar-cyan/15',
  // ... etc
]
```

### Accessibility Requirements

1. **Minimum touch target:** 44x44px (`min-h-[44px] min-w-[44px]`)
2. **Minimum font size:** 12px (`text-xs`)
3. **Color contrast:** Don't rely solely on color
4. **Focus states:** Visible focus rings on all interactive elements
5. **Reduced motion:** Animations respect `prefers-reduced-motion`

---

## Appendix A: Version History

| Version | Date | Major Changes |
|---------|------|---------------|
| v5.0 | Jan 17, 2026 | Complete restructure for agent-friendliness |
| v4.4 | Jan 17, 2026 | Cosmic Variant Selection Guide |
| v4.3 | Jan 17, 2026 | Cosmic Concept Documentation |
| v4.2 | Jan 17, 2026 | Cosmic Dashboard Cards pattern |
| v4.1 | Jan 16, 2026 | Advanced cosmic effects |
| v4.0 | Jan 16, 2026 | Cosmic Precision theme, dark mode fix |
| v3.x | Dec 2025 | Mobile transformation, z-index system |

---

## Appendix B: Legacy Patterns (Backwards Compatibility)

> **Warning:** These patterns are deprecated. Use Cosmic patterns for new components.

### Legacy Brand Colors
```javascript
'lavpop-blue': '#1a5a8e'   // Use stellar-blue instead
'lavpop-green': '#55b03b'  // Use emerald-500 instead
```

### Legacy Dark Backgrounds
```jsx
// AVOID - Legacy pattern
<div className="bg-white dark:bg-slate-800">

// USE - Cosmic pattern
<div className="bg-white dark:bg-space-dust">
```

### Legacy Borders
```jsx
// AVOID - Legacy pattern
<div className="border dark:border-slate-700">

// USE - Cosmic pattern
<div className="border border-slate-200 dark:border-stellar-cyan/10">
```

---

## Appendix C: Migration Guide

### Background Migration
```jsx
// Before
dark:bg-slate-800 → dark:bg-space-dust
dark:bg-slate-900 → dark:bg-space-nebula (fixed elements)
dark:bg-gray-900  → dark:bg-space-void (page backgrounds)
```

### Border Migration
```jsx
// Before
dark:border-slate-700 → dark:border-stellar-cyan/10
dark:border-slate-600 → dark:border-stellar-cyan/15
```

### Button Migration
```jsx
// Before
<button className="bg-gradient-to-r from-lavpop-blue to-blue-600">

// After
<button className="bg-gradient-stellar">
```

### Modal Migration
```jsx
// Before
<div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl">

// After
const { isDark } = useTheme();
<div className={`
  ${isDark ? 'bg-space-dust' : 'bg-white'}
  backdrop-blur-xl rounded-2xl shadow-2xl
  border ${isDark ? 'border-stellar-cyan/15' : 'border-slate-200'}
`}>
```

---

## Related Files

| File | Description |
|------|-------------|
| `tailwind.config.js` | Color tokens, safelist, custom utilities |
| `src/index.css` | CSS custom properties, aurora-overlay, starfield |
| `src/contexts/ThemeContext.jsx` | Theme provider and useTheme hook |
| `src/utils/colorMapping.js` | Semantic color utility functions |
| `src/utils/chartColors.js` | Theme-aware chart color utility |
| `src/constants/zIndex.js` | Z-index semantic constants |
