# UI/UX Hybrid Card Design Plan

## Overview
Comprehensive redesign of all KPI cards and UI components across the entire application to ensure coherent design, mobile-friendliness, and alignment with the app's Design System v4.0.

**Scope full codebase audit on 2026-01-09.**

---

## Phase 0: Hybrid Card Design Strategy

### Design Decision
After analyzing the Design System (HeroKPICard, SecondaryKPICard, KPICardsGrid) and comparing approaches, we adopt a **hybrid card design**:

| Card Type | Background | Use Case |
|-----------|------------|----------|
| **Hero Cards** | Gradient (`from-X via-Y to-Z`) | Max 4 primary KPIs per section |
| **Secondary Cards** | Light (`bg-white dark:bg-slate-800`) + status border | Stats, metrics, supporting info |
| **Selection Cards** | Light with ring highlight on select | Audience picker, template browser |
| **List Cards** | Light with left status border | Campaign cards in lists |

### Benefits
- **Visual hierarchy**: Gradients draw attention to key metrics only
- **Readability**: Light backgrounds improve text legibility
- **Consistency**: Matches Intelligence.jsx and KPICardsGrid.jsx patterns
- **Accessibility**: Better dark mode contrast with light card backgrounds

### Card Anatomy Specifications

#### Hero Card (Gradient) - Primary KPIs Only
```
┌─────────────────────────────────────────────┐
│  LABEL ⓘ                        ↑26.6%     │  ← Row 1: Label (left) + Trend Badge (right)
│                                             │
│  R$ 1.579                         ╭───╮    │  ← Row 2: Value (left, large) + Sparkline (right)
│  7 dias                           ╰───╯    │  ← Row 3: Subtitle (left) + Sparkline continues
└─────────────────────────────────────────────┘
```

| Element | Position | Styling |
|---------|----------|---------|
| **Label** | Top-left | `text-white/80 text-xs font-medium uppercase tracking-wide` |
| **Info Icon** | After label | `text-white/60 w-3.5 h-3.5` |
| **Trend Badge** | Top-right | `text-xs font-semibold` + arrow icon (↑ green-tint / ↓ red-tint) |
| **Value** | Middle-left | `text-2xl sm:text-3xl font-bold text-white` |
| **Sparkline** | Right side | `w-16 h-10` SVG, `stroke-white/40` |
| **Subtitle** | Bottom-left | `text-white/70 text-xs` |

```jsx
<motion.div
  whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}
  transition={{ type: 'tween', duration: 0.2 }}
  className="relative p-4 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white shadow-lg overflow-hidden"
>
  {/* Row 1: Label + Trend */}
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-1.5">
      <span className="text-white/80 text-xs font-medium uppercase tracking-wide">RECEITA</span>
      <Info className="w-3.5 h-3.5 text-white/60" />
    </div>
    <span className="text-xs font-semibold flex items-center gap-0.5">
      <TrendingUp className="w-3 h-3" />26.6%
    </span>
  </div>

  {/* Row 2-3: Value + Sparkline */}
  <div className="flex items-end justify-between">
    <div>
      <p className="text-2xl sm:text-3xl font-bold">R$ 1.579</p>
      <p className="text-white/70 text-xs mt-1">7 dias</p>
    </div>
    <Sparkline data={trendData} className="w-16 h-10 stroke-white/40" />
  </div>
</motion.div>
```

#### Secondary Card (Light) - Supporting Metrics
```
┌─────────────────────────────────────────────┐
│  RECEITA DO MÊS ⓘ                    ┌───┐ │  ← Row 1: Label (left) + Icon (right)
│                                      │ 📅 │ │
│  R$ 1.485                            └───┘ │  ← Row 2: Value (left, large)
│  Janeiro • 9 dias  ↓ -41.0%                │  ← Row 3: Subtitle + Trend Badge (inline)
└─────────────────────────────────────────────┘
```

| Element | Position | Styling |
|---------|----------|---------|
| **Label** | Top-left | `text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide` |
| **Info Icon** | After label | `text-slate-400 dark:text-slate-500 w-3.5 h-3.5` |
| **Accent Icon** | Top-right | `w-10 h-10 rounded-xl bg-gradient-to-br from-X to-Y` with white icon inside |
| **Value** | Middle-left | `text-xl sm:text-2xl font-bold text-slate-900 dark:text-white` |
| **Subtitle** | Bottom-left | `text-slate-500 dark:text-slate-400 text-xs` |
| **Trend Badge** | After subtitle | `text-xs font-medium` + color (emerald for +, rose for -) |

```jsx
<motion.div
  whileHover={{ y: -2 }}
  transition={{ type: 'tween', duration: 0.2 }}
  className="p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700"
>
  {/* Row 1: Label + Icon */}
  <div className="flex items-start justify-between mb-3">
    <div className="flex items-center gap-1.5">
      <span className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide">
        RECEITA DO MÊS
      </span>
      <Info className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
    </div>
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
      <Calendar className="w-5 h-5 text-white" />
    </div>
  </div>

  {/* Row 2: Value */}
  <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">R$ 1.485</p>

  {/* Row 3: Subtitle + Trend */}
  <div className="flex items-center gap-2 mt-1">
    <span className="text-slate-500 dark:text-slate-400 text-xs">Janeiro • 9 dias</span>
    <span className="text-xs font-medium text-rose-500 flex items-center gap-0.5">
      <TrendingDown className="w-3 h-3" />-41.0%
    </span>
  </div>
</motion.div>
```

#### Selection Card (Light + Ring) - Picker Items
```
┌─────────────────────────────────────────────┐
│  ┌───┐  Clientes Inativos                   │  ← Row 1: Icon + Title
│  │ 👥 │  Última visita > 60 dias            │  ← Row 2: Icon + Subtitle
│  └───┘                                      │
│         127 clientes        Prioridade: Alta│  ← Row 3: Count + Priority Badge
└─────────────────────────────────────────────┘
  ↑ ring-2 ring-purple-500 when selected
```

| Element | Position | Styling |
|---------|----------|---------|
| **Icon Container** | Left | `w-12 h-12 rounded-xl bg-gradient-to-br` with semantic color |
| **Title** | Top-right of icon | `text-sm font-semibold text-slate-900 dark:text-white` |
| **Subtitle** | Below title | `text-xs text-slate-500 dark:text-slate-400` |
| **Count** | Bottom-left | `text-xs font-medium text-slate-600 dark:text-slate-300` |
| **Priority Badge** | Bottom-right | `text-xs px-2 py-0.5 rounded-full` + semantic bg color |
| **Selection Ring** | Border | `ring-2 ring-purple-500 ring-offset-2` when selected |

```jsx
<motion.button
  whileHover={{ y: -2 }}
  whileTap={{ scale: 0.98 }}
  onClick={() => { haptics.light(); onSelect(audience); }}
  className={`
    w-full p-4 rounded-xl text-left transition-all
    bg-white dark:bg-slate-800
    border border-slate-200 dark:border-slate-700
    shadow-sm hover:shadow-md
    ${isSelected ? 'ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-slate-900' : ''}
  `}
>
  <div className="flex gap-3">
    {/* Icon */}
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
      <Users className="w-6 h-6 text-white" />
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
        Clientes Inativos
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
        Última visita {'>'} 60 dias
      </p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
          127 clientes
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400">
          Prioridade: Alta
        </span>
      </div>
    </div>
  </div>
</motion.button>
```

#### List Card (Light + Status Border) - Campaign Items
```
┌────────────────────────────────────────────────────────┐
│ ▌ Campanha Black Friday                    12/01/2026 │  ← Status border + Title + Date
│ ▌ Enviado: 245  •  Entregue: 98%  •  Retorno: 18%    │  ← Metrics row
│ ▌ ████████░░ 18% taxa de retorno                      │  ← Progress bar + Label
└────────────────────────────────────────────────────────┘
  ↑ border-l-4 border-emerald-500 (good) / amber-500 (warning) / rose-500 (danger)
```

| Element | Position | Styling |
|---------|----------|---------|
| **Status Border** | Left edge | `border-l-4` + emerald/amber/rose based on return rate |
| **Title** | Top-left | `text-sm font-semibold text-slate-900 dark:text-white` |
| **Date** | Top-right | `text-xs text-slate-500 dark:text-slate-400` |
| **Metrics** | Middle row | `text-xs text-slate-600 dark:text-slate-300` with dot separators |
| **Progress Bar** | Bottom | `h-1.5 rounded-full bg-slate-200 dark:bg-slate-700` |
| **Progress Fill** | Inside bar | Semantic color matching status border |

```jsx
<motion.div
  whileHover={{ y: -2 }}
  transition={{ type: 'tween', duration: 0.2 }}
  className={`
    p-4 rounded-xl bg-white dark:bg-slate-800
    border-l-4 ${getStatusBorder(campaign.returnRate)}
    shadow-sm hover:shadow-md cursor-pointer
  `}
>
  {/* Row 1: Title + Date */}
  <div className="flex items-center justify-between mb-2">
    <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
      {campaign.name}
    </h3>
    <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0 ml-2">
      {formatDate(campaign.date)}
    </span>
  </div>

  {/* Row 2: Metrics */}
  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 mb-3">
    <span>Enviado: {campaign.sent}</span>
    <span className="text-slate-300 dark:text-slate-600">•</span>
    <span>Entregue: {campaign.deliveryRate}%</span>
    <span className="text-slate-300 dark:text-slate-600">•</span>
    <span>Retorno: {campaign.returnRate}%</span>
  </div>

  {/* Row 3: Progress Bar */}
  <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
    <div
      className={`h-full rounded-full ${getStatusColor(campaign.returnRate)}`}
      style={{ width: `${campaign.returnRate}%` }}
    />
  </div>
</motion.div>
```

### Status Border Color Logic
```jsx
const getStatusBorder = (returnRate) => {
  if (returnRate >= 15) return 'border-l-emerald-500';
  if (returnRate >= 5) return 'border-l-amber-500';
  return 'border-l-rose-500';
};

const getStatusColor = (returnRate) => {
  if (returnRate >= 15) return 'bg-emerald-500';
  if (returnRate >= 5) return 'bg-amber-500';
  return 'bg-rose-500';
};
```

### Icon Gradient Colors by Semantic Type

colorMapping.js


## Card Design Analysis & Recommendations

### Existing Design System Cards (Best Practices)

**HeroKPICard.jsx & SecondaryKPICard.jsx** demonstrate premium UI patterns:

| Feature | Implementation | Benefit |
|---------|---------------|---------|
| Hover animation | Framer Motion `y: -2` + shadow lift | Premium, tactile feel |
| Gradients | 3-stop `from-X via-Y to-Z` | Rich, modern appearance |
| Status borders | `border-l-4` (success/warning/danger) | Quick health indication |
| Tooltips | ContextHelp component | Discoverability |
| Haptic feedback | `haptics.light()` on click | Native app feel |
| Sparklines | SVG mini-charts | Trend at a glance |
| Focus rings | Dynamic color matching | Accessibility |


### Recommendations for Campaign Cards

#### 1. Gradient Consistency
Update all gradients to use 3-stop `via-` pattern:

### Implementation Priority

1. **High**: Add Framer Motion hover to selection cards (user-facing)
2. **Medium**: Update gradients to 3-stop pattern
3. **Low**: Add haptic feedback to all interactive cards

## Components to Modify

### Core Components
1. `src/views/Campaigns.jsx` - Main view
2. `src/components/campaigns/CampaignList.jsx` (v3.6)
3. `src/components/campaigns/CampaignDashboard.jsx` (v3.10)
4. `src/components/campaigns/CampaignFunnel.jsx` (v3.3)
5. `src/components/campaigns/CampaignSectionNavigation.jsx` (v2.6)
6. `src/components/campaigns/AudienceSelector.jsx` (v3.0)
7. `src/components/campaigns/MessageComposer.jsx` (v5.0)
8. `src/components/campaigns/AutomationRules.jsx` (v6.0)
9. `src/components/campaigns/NewCampaignModal.jsx` (v5.1)
10. `@src/components/ui/HeroKPICard.jsx`
11. `@src/components/ui/SecondaryKPICard.jsx`
12. `@src/components/ui/SectionCard.jsx`
13. `@src/components/ui/KPIGrid.jsx`

### Secondary Components
14. `src/components/campaigns/AudienceFilterBuilder.jsx`
15. `src/components/campaigns/BlacklistManager.jsx`
16. `src/components/campaigns/CampaignDetailsModal.jsx`
17. `src/components/campaigns/DiscountComparisonCard.jsx`
18. `src/components/campaigns/WhatsAppAnalytics.jsx`
19. `src/components/campaigns/InstagramAnalytics.jsx`
20. `src/components/campaigns/blacklistManager.jsx`
21. `src/components/intelligence/GrowthTrendsSection.jsx`
22. `src/components/intelligence/ProfitabilitySection.jsx`
23. `src/components/intelligence/RevenueForecast.jsx
---

## Phase 1: Foundation Fixes (All Components)

### 1.1 Dark Mode Contrast Fix
**Issue**: `text-slate-400/500` labels have poor contrast in dark mode (~3:1 vs required 4.5:1)

**Pattern to apply across all components**:
```jsx
// Before
text-slate-400 dark:text-slate-400

// After
text-slate-500 dark:text-slate-300
```

**Files**: All 23 components

### 1.2 Shadow Consistency
Standardize elevation levels:
- Cards: `shadow-sm` (subtle) or `shadow-soft`
- Hover: `hover:shadow-md`
- Modals: `shadow-2xl`
- Gradient buttons: `shadow-lg shadow-{color}-500/25`

---

## Risk Mitigation
- **Preserve functionality**: Only modify UI/styling, not data logic
- **Mobile-first**: Always test on 375px viewport first

---


## Full Codebase KPI Card Audit Summary

### Audit Scope
Complete audit of all views and components using KPI cards to verify Design System v4.0 compliance.


### Design System Adoption Status

**Using Design System KPICard/HeroKPICard ✅:**
- Intelligence.jsx
- GrowthTrendsSection.jsx
- ProfitabilitySection.jsx
- Customers.jsx
- WhatsAppAnalytics.jsx
- Operations.jsx
- OperationsKPICards.jsx

**Using Custom/Local KPICard ⚠️ (needs migration):**
- InstagramAnalytics.jsx - Has local KPICard component (lines 320-347)
- BlacklistManager.jsx - Custom gradient stats cards
- RevenueForecast.jsx - Custom gradient card
- CustomerCard.jsx - Custom card implementation

---

## Phase 2: Extend Hybrid Card Design to Other Views (PENDING)

### Scope
Apply the Hybrid Card Design patterns to remaining views.

### Views to Update

#### 10.1 Social Media View (`src/views/SocialMedia.jsx`)
- **BlacklistManager.jsx** - Customer list cards could use List Card pattern (light + status border)
- **Social widgets** - Any stat cards should use Secondary Card pattern

#### 10.2 Operations View (`src/views/Operations.jsx`)
- **OperationsKPICards.jsx** - Verify uses HeroKPICard/SecondaryKPICard patterns
- Any custom cards should be migrated to Design System cards