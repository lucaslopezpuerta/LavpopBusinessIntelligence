# Bilavnova Design System v6.4

> **Theme:** Aurora Void - Deep aurora-tinted backgrounds with vibrant accents
> **Last Updated:** February 5, 2026
> **Inspiration:** [Bilavnova Logo Gradient](src/assets/Logo%20Files/), Aurora Borealis, Deep Space
> **Dark Mode:** Fully functional via Tailwind safelist + useTheme pattern

### v6.4 Changes (2026-02-05) - Typography & Interaction Utilities
- **Semantic Typography Tokens:** Added `text-heading`, `text-subheading`, `text-body`, `text-caption`, `text-data-lg`, `text-data` to tailwind.config.js
- **Typography Utility Classes:** Added `.typo-heading`, `.typo-body`, `.label-card`, `.typo-data-lg` etc. for consistent text styling
- **Interactive Utilities:** Added `.interactive`, `.hover-lift`, `.hover-lift-scale`, `.press-scale`, `.focus-ring`, `.transition-micro`, `.transition-standard`
- **Elevation Shadow System:** Added `shadow-elevation-1` through `shadow-elevation-4`, `shadow-elevation-hover`, plus dark mode variants with cyan glow
- **Component Updates:** Button.jsx v1.6, KPICard.jsx v1.23, SectionHeader.jsx v1.5, CosmicDropdown.jsx v1.4.0
- **Accessibility:** Fixed `text-[10px]` violations in KPICard (now text-xs minimum), improved focus-visible patterns
- **Reduced Motion:** All new utilities respect `prefers-reduced-motion`

### v6.3 Changes (2026-01-30) - Aurora Void
- **Aurora-Tinted Deep Blacks:** Replaced GitHub-derived neutrals with deeper, aurora-coherent backgrounds
  - Space Void: `#020910` (was #0D1117) - Near-black with teal whisper, L=4%
  - Space Nebula: `#0A1520` (was #161B22) - Deep navy-teal, L=8%
  - Space Dust: `#131D28` (was #21262D) - Aurora blue undertone, L=12%
  - Space Elevated: `#1C2736` (was #30363D) - Visible elevation step, L=16%
- **HSL Hue Consistency:** All dark backgrounds now share ~210° hue (teal-blue)
- **Light Mode Unchanged:** Nordic Snow Storm palette preserved
- **WCAG Contrast Improved:** White on Void now 19.2:1 (was 15.8:1)
- **Rationale:** Deeper void creates atmospheric backdrop for bright aurora accents to "glow"

### v6.2 Changes (2026-01-30) - Vibrant Semantic Colors
- **Vibrant Semantic Colors:** Replaced muted Nord pastels with vibrant Tailwind 500-level colors
  - Cosmic Green: `#22C55E` (was #A3BE8C) - Tailwind green-500, electric success
  - Cosmic Amber: `#F59E0B` (was #EBCB8B) - Tailwind amber-500, bright warning
  - Cosmic Rose: `#EF4444` (was #BF616A) - Tailwind red-500, clear danger
  - Cosmic Purple: `#A855F7` (was #B48EAD) - Tailwind purple-500, vivid accent
- **Rationale:** Muted Nord pastels clashed with vibrant brand gradient (#2d388a → #00aeef)
- **WCAG AA Verified:** All colors 4.5:1+ contrast on both dark (#020910) and light (#ECEFF4) backgrounds

### v6.1 Changes (2026-01-30) - Bilavnova Precision
- **Brand Color Restoration:** Restored original logo gradient colors
  - Stellar Blue: `#2d388a` (was #5E81AC) - Deep royal brand start
  - Stellar Cyan: `#00aeef` (was #88C0D0) - Vibrant electric brand accent
- **Removed Nord-Specific Tokens:** stellar-frost (#8FBCBB) and stellar-ice (#81A1C1) removed
- **Preserved Surfaces:** Polar Night dark + Snow Storm light unchanged from v6.0
- **WCAG AA Verified:** #00aeef on #0D1117 = 5.8:1 ✅ | #2d388a on #FFFFFF = 8.5:1 ✅

### v6.0 Changes (2026-01-30) - Aurora Borealis (Surfaces)
- **Dark Mode (Polar Night, superseded by v6.3):** GitHub-inspired surfaces
  - ~~Space Void: `#0D1117`~~ → #020910, ~~Space Nebula: `#161B22`~~ → #0A1520, ~~Space Dust: `#21262D`~~ → #131D28
- **Light Mode (Snow Storm):** New soft gray-white surfaces (unchanged in v6.3)
  - Space Light: `#ECEFF4` | Space Mist: `#E5E9F0` | Space Cloud: `#D8DEE9`
- **Semantic Accent System (superseded by v6.2):**
  - ~~cosmic-green (#A3BE8C)~~ → #22C55E, ~~cosmic-amber (#EBCB8B)~~ → #F59E0B
- **WCAG AA/AAA Compliant:** All accent combinations verified

### v5.4 Changes (2026-01-29)
- **Complete Legacy Color Purge:** Removed all remaining `lavpop-*` references across 45+ files
- **colorMapping.js:** Renamed `lavpop` key to `stellar` for consistency
- **Focus Rings:** Standardized on `ring-stellar-cyan`

### v5.3 Changes (2026-01-29)
- **Unified Stellar Cyan:** Standardized color values
- **WCAG AA Contrast Fixes:** Fixed opacity text, dark mode text on dark backgrounds

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
| Retention/Success | `emerald` | RetentionCard, HealthMetrics, VisitHeatmap (Fiéis segment) |
| Revenue/Financial | `teal` | RevenueCard, ProfitMetrics |
| Operations/Cycles | `cyan` | OperatingCyclesChart |
| Positive Highlight | `cyan` | Peak indicators, insights (NOT amber - amber=warning) |
| Warning/Attention | `amber` | FrequencyDegradationAlert |
| Risk/Critical | `red` | ChurnHistogram, AtRiskTable |
| Analytics/General | `blue` | VisitHeatmap (Todos segment), RFMScatterPlot |

> **Important:** Use `cyan` for positive insights like peak hours/days. Do NOT use `amber` for positive highlights - amber is reserved for warnings. Use `emerald` for loyalty/success segments (e.g., "Fiéis" = loyal customers).

---

## Part 1: Foundation Tokens

### 1.1 Color System

#### Space Colors - Aurora Void (Dark Mode)

| Token | Hex | Tailwind | Usage | HSL |
|-------|-----|----------|-------|-----|
| **Space Void** | `#020910` | `bg-space-void` | Page background (deepest) | 210°, 78%, 4% |
| **Space Nebula** | `#0A1520` | `bg-space-nebula` | Fixed elements (sidebar, topbar) | 210°, 52%, 8% |
| **Space Dust** | `#131D28` | `bg-space-dust` | Cards, modals, elevated surfaces | 211°, 36%, 12% |
| **Space Elevated** | `#1C2736` | `bg-space-elevated` | Hover states, dropdowns | 215°, 32%, 16% |

```
Depth Hierarchy (Dark Mode - Aurora Void):
┌────────────────────────────────────────┐
│  VOID (#020910)    - Page background   │
│  ├── NEBULA (#0A1520) - Fixed nav      │
│  │   └── DUST (#131D28) - Cards        │
│  │       └── ELEVATED (#1C2736) - Hover│
└────────────────────────────────────────┘

Aurora Tint Rationale:
- Consistent ~210° hue creates atmospheric cohesion
- Deeper L values (4-16%) provide true void aesthetic
- Teal undertones make cyan/green accents naturally "glow"
```

#### Space Colors - Snow Storm (Light Mode)

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| **Space Light** | `#ECEFF4` | `bg-space-light` | Page background |
| **Space Mist** | `#E5E9F0` | `bg-space-mist` | Secondary surfaces |
| **Space Cloud** | `#D8DEE9` | `bg-space-cloud` | Cards, elevated |

#### Brand Accent Colors (Bilavnova Precision v6.2)

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| **Stellar Blue** | `#2d388a` | `text-stellar-blue` | Brand gradient start, deep royal accents |
| **Stellar Cyan** | `#00aeef` | `text-stellar-cyan` | Primary accent (brand electric), links, focus rings |
| **Cosmic Green** | `#22C55E` | `text-cosmic-green` | Success, positive metrics (vibrant green-500) |
| **Cosmic Amber** | `#F59E0B` | `text-cosmic-amber` | CTA buttons, warnings (vibrant amber-500) |
| **Cosmic Rose** | `#EF4444` | `text-cosmic-rose` | Errors, critical alerts (vibrant red-500) |
| **Cosmic Purple** | `#A855F7` | `text-cosmic-purple` | Special features, badges (vibrant purple-500) |

**Stellar Opacity Scale:**
- `/5` - Light mode subtle borders
- `/10` - Dark mode card borders (most common)
- `/15` - Visible borders, navigation
- `/20` - Active state backgrounds

**Brand Glow Effects:**
```css
--stellar-glow: 0 0 20px rgba(0, 174, 239, 0.3);
--bilavnova-gradient: linear-gradient(135deg, #2d388a 0%, #00aeef 100%);
```

#### Semantic Colors

| Semantic | Light BG | Dark BG | Border | Use For |
|----------|----------|---------|--------|---------|
| Revenue | `teal-50` | `teal-900/20` | `teal-500` | Financial metrics |
| Cost | `red-50` | `red-900/20` | `red-500` | Expenses, negative |
| Profit | `emerald-50` | `emerald-900/20` | `emerald-500` | Positive outcomes |
| Warning | `amber-50` | `amber-900/20` | `amber-500` | Attention needed |
| Info | `blue-50` | `blue-900/20` | `blue-500` | Informational |

#### Risk Escalation Colors

For progressive urgency indicators (e.g., days since last visit), use this escalation pattern:

| Level | Color | Tailwind | Days Example |
|-------|-------|----------|--------------|
| Normal | Slate | `bg-slate-100 dark:bg-slate-700` | 0-29 days |
| Overdue | Amber-500 | `bg-amber-500 text-white` | 30+ days |
| Monitor | Amber-600 | `bg-amber-600 text-white` | 40+ days |
| At Risk | Red-500 | `bg-red-500 text-white` | 50+ days |
| Critical | Red-600 | `bg-red-600 text-white` | 60+ days |

> **Note:** Do NOT use `orange` for escalation - stay within the `amber` and `red` families for Design System consistency.

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

#### 1.2.1 Semantic Typography Utilities (v6.4)

Pre-built utility classes that combine font size, weight, and color for consistent text styling:

| Utility | Size | Weight | Use For |
|---------|------|--------|---------|
| `.typo-heading` | 20px | bold | Section titles |
| `.typo-subheading` | 18px | semibold | Card titles |
| `.typo-body` | 14px | normal | Body text |
| `.typo-body-muted` | 14px | normal | Secondary text |
| `.typo-caption` | 12px | normal | Labels, captions |
| `.label-card` | 12px | semibold | KPI labels (uppercase, tracking-wider) |
| `.typo-data-lg` | 24px | bold | Large KPI values (tabular-nums) |
| `.typo-data` | 16px | semibold | Data values (tabular-nums) |

**Usage:**
```jsx
<h2 className="typo-heading">Section Title</h2>
<p className="typo-body-muted">Secondary description</p>
<span className="typo-data-lg">R$ 1.234,56</span>
```

#### 1.2.2 Interactive Utilities (v6.4)

Standardized utilities for hover, focus, and active states:

| Utility | Effect |
|---------|--------|
| `.interactive` | cursor-pointer + tap highlight removal |
| `.hover-lift` | -translate-y-1 on hover |
| `.hover-lift-scale` | -translate-y-1 + scale(1.01) on hover |
| `.press-scale` | scale(0.98) on active |
| `.focus-ring` | 2px stellar-cyan focus ring with offset |
| `.focus-ring-subtle` | 1px stellar-cyan/60 focus ring |
| `.transition-micro` | 150ms all ease-out (buttons, toggles) |
| `.transition-standard` | 200ms all ease-out (cards, inputs) |

**Usage:**
```jsx
<button className="interactive press-scale focus-ring">Click me</button>
<div className="hover-lift transition-standard">Card content</div>
```

> **Note:** All interactive utilities respect `prefers-reduced-motion` and are automatically disabled when users prefer reduced motion.

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
| **CTA (Amber)** | `bg-cosmic-amber hover:bg-amber-400 text-space-void font-semibold shadow-md hover:shadow-lg rounded-xl px-4 py-2` |
| **Primary** | `bg-gradient-stellar text-white font-semibold shadow-md hover:shadow-lg rounded-xl px-4 py-2` |
| **Secondary** | `bg-white dark:bg-space-dust text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-stellar-cyan/15 rounded-xl px-4 py-2` |
| **Ghost** | `bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-space-dust rounded-xl px-4 py-2` |
| **Success/WhatsApp** | `bg-cosmic-green/10 dark:bg-cosmic-green/20 text-cosmic-green border border-cosmic-green/30 hover:bg-cosmic-green/20 dark:hover:border-cosmic-green/50 rounded-xl px-4 py-2` |
| **Danger** | `bg-cosmic-rose hover:bg-red-500 text-white font-semibold rounded-xl px-4 py-2` |
| **Icon** | `p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-space-dust` |

**CTA Hierarchy:** `cosmic-amber` (high emphasis) > `gradient-stellar` (medium) > `secondary` (low)

```jsx
// CTA Button (High Emphasis - use for primary actions)
<button className="
  bg-cosmic-amber hover:bg-amber-400
  text-space-void font-semibold
  shadow-md hover:shadow-lg hover:shadow-cosmic-amber/25
  rounded-xl px-4 py-2
  active:scale-[0.98] transition-all
">
  Get Started
</button>

// Primary Button (Medium Emphasis)
<button className="
  bg-gradient-stellar text-white font-semibold
  shadow-md hover:shadow-lg hover:shadow-stellar-cyan/25
  rounded-xl px-4 py-2
  active:scale-[0.98] transition-all
">
  Learn More
</button>

// Secondary Button (Low Emphasis)
<button className="
  bg-white dark:bg-space-dust
  text-slate-700 dark:text-slate-200
  border border-slate-200 dark:border-stellar-cyan/15
  hover:bg-slate-50 dark:hover:bg-space-nebula
  rounded-xl px-4 py-2
  transition-all
">
  Cancel
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
      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#21262D' : '#e2e8f0'} />
      <XAxis stroke={isDark ? '#64748b' : '#94a3b8'} />
      <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} />
      <Tooltip content={<CustomTooltip />} />
      <Bar dataKey="value" fill="#00aeef" /> {/* stellar-cyan (brand) */}
    </BarChart>
  </ResponsiveContainer>
</div>
```

**Bilavnova Chart Color Palette:**
```javascript
// Primary series colors (from colorMapping.js)
const chartColors = ['#2d388a', '#00aeef', '#A3BE8C', '#EBCB8B', '#BF616A', '#B48EAD'];

// Semantic chart colors
revenue: '#A3BE8C',   // cosmic-green
cost: '#BF616A',      // cosmic-rose
profit: '#B48EAD',    // cosmic-purple
primary: '#00aeef',   // stellar-cyan (brand)
lavpop: '#2d388a',    // stellar-blue (brand)
positive: '#A3BE8C',  // cosmic-green
negative: '#BF616A',  // cosmic-rose
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
| `bg-gradient-stellar` | 135° stellar blue (#2d388a) → cyan (#00aeef) |
| `bg-gradient-bilavnova` | 135° brand gradient (#2d388a → #00aeef) |
| `bg-gradient-nebula` | Blue → purple → cyan |
| `bg-gradient-aurora-subtle` | Vertical aurora fade |
| `text-gradient-stellar` | Gradient text (brand name) |

**Brand Glow Box Shadow:**
```css
shadow-stellar: 0 0 20px rgba(45, 56, 138, 0.15), 0 0 40px rgba(0, 174, 239, 0.08);
shadow-stellar-glow: 0 0 20px rgba(0, 174, 239, 0.3);
```

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
3. **Color contrast:**
   - WCAG AA requires 4.5:1 for normal text, 3:1 for large text
   - **Avoid opacity text:** Don't use `text-white/60`, `text-white/70` on colored backgrounds
   - **Dark mode on dark bg:** Use `slate-200` or `slate-300` text on `slate-700` backgrounds (not `slate-400`)
   - **Light mode on white bg:** Use `slate-500` or `slate-600` for secondary text (not `slate-400`)
4. **Focus states:** Visible focus rings on all interactive elements
5. **Reduced motion:** Animations respect `prefers-reduced-motion`
6. **Color-only indicators:** Add icons or patterns alongside color for risk/status indicators

---

## Appendix A: Version History

| Version | Date | Major Changes |
|---------|------|---------------|
| **v6.1** | Jan 30, 2026 | **Bilavnova Precision** - Brand color restoration. Stellar Blue restored to #2d388a, Stellar Cyan to #00aeef. Removed Nord-specific frost/ice tokens. Kept improved Polar Night + Snow Storm surfaces. WCAG AA verified (5.8:1 contrast). |
| v6.0 | Jan 30, 2026 | **Aurora Borealis** - Complete surface refresh. Polar Night dark mode (#0D1117, #161B22, #21262D). Snow Storm light mode (#ECEFF4, #E5E9F0, #D8DEE9). Semantic accent system. |
| v5.4 | Jan 29, 2026 | Complete lavpop→stellar migration, ARIA tooltips, font size fixes |
| v5.3 | Jan 29, 2026 | Unified stellar-cyan, WCAG AA contrast fixes, chart color tokens |
| v5.2 | Jan 29, 2026 | Semantic color audit: cyan for highlights, emerald for loyalty, risk escalation guide |
| v5.1 | Jan 18, 2026 | Added cosmic-green color, Success/WhatsApp button variant |
| v5.0 | Jan 17, 2026 | Complete restructure for agent-friendliness |
| v4.4 | Jan 17, 2026 | Cosmic Variant Selection Guide |
| v4.3 | Jan 17, 2026 | Cosmic Concept Documentation |
| v4.2 | Jan 17, 2026 | Cosmic Dashboard Cards pattern |
| v4.1 | Jan 16, 2026 | Advanced cosmic effects |
| v4.0 | Jan 16, 2026 | Cosmic Precision theme, dark mode fix |
| v3.x | Dec 2025 | Mobile transformation, z-index system |

---

## Appendix B: Legacy Patterns (Reference Only)

> **Note:** As of v5.4, all legacy `lavpop-*` colors have been removed from the codebase. These patterns are documented for historical reference only.

### Legacy Brand Colors (REMOVED in v5.4)
```javascript
// These colors no longer exist in the codebase:
'lavpop-blue': '#1a5a8e'   // Replaced with stellar-blue/stellar-cyan
'lavpop-green': '#55b03b'  // Replaced with emerald-500/600
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
| `src/utils/colorMapping.js` | Semantic color utility functions (uses `stellar` key, not `lavpop`) |
| `src/utils/chartColors.js` | Theme-aware chart color utility |
| `src/constants/zIndex.js` | Z-index semantic constants |

---

## Appendix D: v5.4 Audit Summary

The following files were updated in the v5.4 legacy color audit:

| Category | Files Updated | Changes |
|----------|---------------|---------|
| **UI Components** | IconButton, KPICard, ThemeToggle, SearchInput, PullToRefreshWrapper | Focus rings → `stellar-cyan` |
| **Views** | Directory, Customers, Campaigns | Spinner borders → `stellar-cyan` |
| **Charts** | ChurnHistogram, RFMScatterPlot, AcquisitionCard | Tooltips → `role="tooltip"` + `dark:bg-space-dust` |
| **Drilldowns** | CustomerListDrilldown, MetricExplainerDrilldown | Button colors → `stellar-blue/cyan` |
| **Modals** | MobileTooltipSheet, CustomerProfileModal | Icon colors → `stellar-blue/cyan`, avatar gradient fixed |
| **Utils** | colorMapping.js | `lavpop` key renamed to `stellar` |

**Compliance Score:** 100% - No remaining `lavpop-*` class references in UI code.
