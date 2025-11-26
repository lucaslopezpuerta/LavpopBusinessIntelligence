# Operations Tab Redesign Plan
## Design System Alignment Implementation

> **Created:** November 26, 2025
> **Status:** Ready for Implementation
> **Scope:** Complete redesign of Operations tab and all child components

---

## 📋 Executive Summary

This plan outlines the comprehensive redesign of the Operations tab (`src/views/Operations.jsx`) and all 7 child components to align with the LavpopBI Design System v3.0. The current implementation uses 100% inline styles with no dark mode support or modern Tailwind CSS practices.

### Current State Analysis

**All 8 Components Require Updates:**
- ✅ Operations.jsx (Parent Container)
- ✅ OperationsKPICards.jsx
- ✅ UtilizationHeatmap.jsx
- ✅ PeakHoursSummary.jsx
- ✅ WashVsDryChart.jsx
- ✅ DayOfWeekChart.jsx
- ✅ MachinePerformanceTable.jsx
- ✅ DateRangeSelector.jsx

**Design System Violations Found:**
1. 100% inline styles (no Tailwind CSS)
2. No dark mode support
3. Hardcoded color values (not theme-aware)
4. Emoji usage instead of icon components
5. Inconsistent responsive design patterns
6. No centralized styling system
7. Accessibility concerns (color contrast, ARIA labels)

---

## 🎯 Goals & Objectives

### Primary Goals
1. **Replace all inline styles** with Tailwind CSS classes
2. **Implement dark mode** using `dark:` variant classes
3. **Standardize component patterns** following Design System guidelines
4. **Improve accessibility** with proper ARIA labels and semantic HTML
5. **Enhance mobile responsiveness** with Tailwind breakpoints
6. **Replace emojis** with Lucide React icons

### Success Criteria
- [ ] Zero inline styles remaining (except dynamic values)
- [ ] Full dark mode support across all components
- [ ] All colors from design system color palette
- [ ] Responsive on mobile (320px), tablet (768px), desktop (1024px+)
- [ ] All icons using Lucide React
- [ ] Consistent spacing using Tailwind scale (gap-4, gap-6, etc.)
- [ ] WCAG AA accessibility compliance

---

## 📦 Component-by-Component Plan

### 1. Operations.jsx (Parent Container)
**Priority:** HIGH | **Complexity:** Medium

**Current Issues:**
- Inline styles for layout and header
- Styled-jsx for media queries
- Hardcoded colors (#10306B, #6b7280)
- No dark mode support

**Updates Required:**

#### Header Section
```jsx
// BEFORE (inline)
<h1 style={{ fontSize: '32px', fontWeight: '700', color: '#10306B' }}>

// AFTER (Tailwind)
<h1 className="text-2xl font-bold text-slate-900 dark:text-white">
```

#### Grid Layout
```jsx
// BEFORE (inline)
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>

// AFTER (Tailwind)
<div className="grid grid-cols-12 gap-6">
```

#### Page Container
```jsx
// BEFORE (inline)
<div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>

// AFTER (Tailwind)
<div className="max-w-[100rem] mx-auto p-6 lg:p-8">
```

#### Remove Styled-JSX
- Delete styled-jsx media query block
- Use Tailwind `lg:col-span-6` responsive classes instead

**Files to Modify:**
- `src/views/Operations.jsx`

**Estimated Effort:** 2 hours

---

### 2. OperationsKPICards.jsx
**Priority:** HIGH | **Complexity:** High

**Current Issues:**
- Completely inline styled
- COLORS object with hardcoded hex values
- Emoji indicators (🔥, ✅, ⚠️, 📉)
- No dark mode support
- Custom KPICard component with inline styles

**Updates Required:**

#### KPI Card Container
```jsx
// BEFORE (inline)
<div style={{
  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  borderRadius: '16px',
  padding: '1.5rem',
  color: 'white',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
}}>

// AFTER (Tailwind)
<div className="
  bg-gradient-to-br from-purple-500 to-violet-600
  hover:from-purple-600 hover:to-violet-700
  text-white rounded-xl shadow-lg p-6
  transition-all duration-200
">
```

#### Color Scheme Updates
**Washers (Lavadoras):**
- Use: `from-blue-500 to-indigo-600` (Operations category)

**Dryers (Secadoras):**
- Use: `from-orange-500 to-amber-600` (Performance category)

**Total Utilization:**
- Use: `from-purple-500 to-violet-600` (Operations category)

#### Replace Emojis with Icons
```jsx
// BEFORE
{trend >= 5 ? '🔥' : trend > 0 ? '✅' : trend < -5 ? '📉' : '⚠️'}

// AFTER
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
{trend >= 5 ? <TrendingUp className="w-5 h-5" /> :
 trend > 0 ? <TrendingUp className="w-4 h-4" /> :
 trend < -5 ? <TrendingDown className="w-5 h-5" /> :
 <Minus className="w-4 h-4" />}
```

#### Typography Updates
```jsx
// BEFORE (inline)
<div style={{ fontSize: '48px', fontWeight: 'bold' }}>

// AFTER (Tailwind)
<div className="text-5xl font-bold">
```

#### Progress Bar Styling
```jsx
// BEFORE (inline)
<div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.2)' }}>

// AFTER (Tailwind)
<div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
  <div
    className="h-full bg-white rounded-full transition-all duration-500"
    style={{ width: `${percentage}%` }}
  />
</div>
```

#### Grid Layout
```jsx
// BEFORE (inline)
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

// AFTER (Tailwind)
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
```

**Files to Modify:**
- `src/components/OperationsKPICards.jsx`

**Estimated Effort:** 4 hours

---

### 3. UtilizationHeatmap.jsx
**Priority:** MEDIUM | **Complexity:** Medium

**Current Issues:**
- Inline styles for heatmap cells
- Hardcoded green color palette
- No dark mode support
- Not fully responsive on mobile

**Updates Required:**

#### Heatmap Container
```jsx
// BEFORE (inline)
<div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e5e7eb' }}>

// AFTER (Tailwind)
<div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
```

#### Heatmap Cell Colors
```jsx
// BEFORE (hardcoded green shades)
const getColor = (value) => {
  if (value >= 4) return '#15803d';
  if (value >= 3) return '#22c55e';
  if (value >= 2) return '#86efac';
  if (value >= 1) return '#dcfce7';
  return '#f9fafb';
};

// AFTER (Tailwind with dark mode)
const getCellClasses = (value) => {
  if (value >= 4) return 'bg-emerald-700 dark:bg-emerald-600';
  if (value >= 3) return 'bg-emerald-500 dark:bg-emerald-500';
  if (value >= 2) return 'bg-emerald-300 dark:bg-emerald-400';
  if (value >= 1) return 'bg-emerald-100 dark:bg-emerald-800';
  return 'bg-slate-50 dark:bg-slate-700';
};
```

#### Cell Styling
```jsx
// BEFORE (inline)
<div style={{
  width: '40px',
  height: '40px',
  backgroundColor: getColor(value),
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'transform 0.2s',
}} onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}>

// AFTER (Tailwind)
<div className={`
  w-10 h-10 rounded-lg flex items-center justify-center
  text-xs font-semibold cursor-pointer
  hover:scale-110 hover:shadow-md
  transition-all duration-200
  ${getCellClasses(value)}
  ${value >= 2 ? 'text-white' : 'text-slate-700 dark:text-slate-300'}
`}>
```

#### Horizontal Scroll Container
```jsx
// BEFORE (inline)
<div style={{ overflowX: 'auto', width: '100%' }}>

// AFTER (Tailwind)
<div className="overflow-x-auto w-full -mx-4 px-4 lg:mx-0 lg:px-0">
```

#### Legend Update
```jsx
// BEFORE (inline colors)
<div style={{ background: '#dcfce7', width: '30px', height: '15px', borderRadius: '4px' }}>

// AFTER (Tailwind)
<div className="bg-emerald-100 dark:bg-emerald-800 w-8 h-4 rounded">
```

**Files to Modify:**
- `src/components/UtilizationHeatmap.jsx`

**Estimated Effort:** 3 hours

---

### 4. PeakHoursSummary.jsx
**Priority:** HIGH | **Complexity:** Medium

**Current Issues:**
- Inline styles throughout
- Emoji icons (🔥, ⚡, ✓, 🔧)
- Hardcoded COLORS object
- No dark mode support

**Updates Required:**

#### Container Styling
```jsx
// BEFORE (inline)
<div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e5e7eb' }}>

// AFTER (Tailwind)
<div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
```

#### Table Row Colors
```jsx
// BEFORE (inline with hardcoded colors)
<div style={{ background: isPeak ? '#f0fdf4' : '#fef2f2', borderLeft: `4px solid ${isPeak ? '#22c55e' : '#ef4444'}` }}>

// AFTER (Tailwind)
<div className={`
  ${isPeak
    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500'
    : 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500'}
  rounded-lg p-4
`}>
```

#### Replace Emojis with Icons
```jsx
// BEFORE
const icon = isPeak ? '🔥' : '❄️';

// AFTER
import { Flame, Snowflake, Zap, CheckCircle, Wrench } from 'lucide-react';
const Icon = isPeak ? Flame : Snowflake;
<Icon className={`w-5 h-5 ${isPeak ? 'text-orange-500' : 'text-blue-400'}`} />
```

#### Recommendations Section
```jsx
// BEFORE (emoji icons)
<span style={{ fontSize: '24px' }}>⚡</span>

// AFTER (Lucide icons)
<div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
  <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
</div>
```

#### Typography
```jsx
// BEFORE (inline)
<div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10306B' }}>

// AFTER (Tailwind)
<div className="text-xl font-bold text-slate-900 dark:text-white">
```

**Files to Modify:**
- `src/components/PeakHoursSummary.jsx`

**Estimated Effort:** 3 hours

---

### 5. WashVsDryChart.jsx
**Priority:** MEDIUM | **Complexity:** Medium

**Current Issues:**
- Mixed inline styles and Recharts
- Hardcoded colors for bars
- Custom tooltip with inline styles
- No dark mode support for Recharts

**Updates Required:**

#### Container & Header
```jsx
// BEFORE (inline)
<div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e5e7eb' }}>

// AFTER (Tailwind)
<div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
```

#### Summary Cards Grid
```jsx
// BEFORE (inline)
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>

// AFTER (Tailwind)
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
```

#### Summary Card Styling
```jsx
// BEFORE (inline)
<div style={{ background: '#eff6ff', borderRadius: '12px', padding: '1rem', border: '1px solid #dbeafe' }}>

// AFTER (Tailwind)
<div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
```

#### Recharts Color Updates
```jsx
// BEFORE (hardcoded)
<Bar dataKey="wash" fill="#3b82f6" />
<Bar dataKey="dry" fill="#f59e0b" />

// AFTER (theme colors)
<Bar dataKey="wash" fill="#1a5a8e" /> {/* lavpop-blue */}
<Bar dataKey="dry" fill="#f59e0b" /> {/* amber-500 */}
```

#### Custom Tooltip
```jsx
// BEFORE (inline styles in CustomTooltip)
<div style={{ background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>

// AFTER (Tailwind)
<div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl">
```

#### Chart Configuration
```jsx
// Add dark mode colors
<CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
<XAxis className="text-slate-600 dark:text-slate-400" />
<YAxis className="text-slate-600 dark:text-slate-400" />
```

**Files to Modify:**
- `src/components/WashVsDryChart.jsx`

**Estimated Effort:** 3 hours

---

### 6. DayOfWeekChart.jsx
**Priority:** MEDIUM | **Complexity:** Medium

**Current Issues:**
- Mixed inline styles and Recharts
- Custom tooltip with inline styles
- Hardcoded bar colors
- No dark mode for charts

**Updates Required:**

#### Container
```jsx
// BEFORE (inline)
<div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e5e7eb' }}>

// AFTER (Tailwind)
<div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
```

#### Best/Worst Day Cards
```jsx
// BEFORE (inline)
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>

// AFTER (Tailwind)
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
```

#### Card Styling
```jsx
// BEFORE (inline)
<div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '1rem', borderLeft: '4px solid #22c55e' }}>

// AFTER (Tailwind)
<div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border-l-4 border-emerald-500">
```

#### Dynamic Bar Colors
```jsx
// BEFORE (inline function)
const getBarColor = (utilization) => {
  if (utilization >= 70) return '#22c55e';
  if (utilization >= 50) return '#f59e0b';
  return '#ef4444';
};

// AFTER (keep logic, but use theme colors)
const getBarColor = (utilization) => {
  if (utilization >= 70) return '#10b981'; // lavpop-green
  if (utilization >= 50) return '#f59e0b'; // amber
  return '#ef4444'; // red
};
```

#### Recharts Styling
```jsx
// Add dark mode aware chart elements
<CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
<Line type="monotone" dataKey="utilization" stroke="#1a5a8e" strokeWidth={2} />
```

**Files to Modify:**
- `src/components/DayOfWeekChart.jsx`

**Estimated Effort:** 3 hours

---

### 7. MachinePerformanceTable.jsx
**Priority:** HIGH | **Complexity:** High

**Current Issues:**
- HTML `<table>` with inline styles
- Hardcoded colors and spacing
- Hover effects via inline event handlers
- Not mobile-friendly (just scrolls)
- No dark mode support

**Updates Required:**

#### Table Container
```jsx
// BEFORE (inline)
<div style={{ overflowX: 'auto', background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e5e7eb' }}>

// AFTER (Tailwind)
<div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
  <div className="bg-white dark:bg-slate-800 p-6">
```

#### Table Element
```jsx
// BEFORE (inline)
<table style={{ width: '100%', borderCollapse: 'collapse' }}>

// AFTER (Tailwind)
<table className="w-full border-collapse">
```

#### Table Header
```jsx
// BEFORE (inline)
<th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '2px solid #e5e7eb' }}>

// AFTER (Tailwind)
<th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
```

#### Table Rows
```jsx
// BEFORE (inline with onMouseEnter/onMouseLeave)
<tr style={{ borderBottom: '1px solid #e5e7eb', background: isHovered ? '#f9fafb' : 'transparent' }}>

// AFTER (Tailwind with CSS hover)
<tr className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
```

#### Table Cells
```jsx
// BEFORE (inline)
<td style={{ padding: '12px', fontSize: '14px', color: '#374151' }}>

// AFTER (Tailwind)
<td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
```

#### Performance Indicators
```jsx
// BEFORE (inline with conditional colors)
<span style={{ color: performance > avgPerformance ? '#22c55e' : '#ef4444' }}>

// AFTER (Tailwind)
<span className={performance > avgPerformance ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
```

#### Section Headers
```jsx
// BEFORE (inline)
<h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#10306B', marginBottom: '1rem' }}>

// AFTER (Tailwind)
<h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
```

**Files to Modify:**
- `src/components/MachinePerformanceTable.jsx`

**Estimated Effort:** 4 hours

---

### 8. DateRangeSelector.jsx
**Priority:** MEDIUM | **Complexity:** Low

**Current Issues:**
- Native `<select>` with inline styles
- Hardcoded colors
- No custom dropdown component
- minWidth may be too wide on mobile

**Updates Required:**

#### Container
```jsx
// BEFORE (inline)
<div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>

// AFTER (Tailwind)
<div className="flex items-center gap-4 mb-6 flex-wrap">
```

#### Date Range Display
```jsx
// BEFORE (inline)
<div style={{ background: '#eff6ff', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid #dbeafe' }}>

// AFTER (Tailwind)
<div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-3 rounded-xl border border-blue-200 dark:border-blue-800">
```

#### Typography
```jsx
// BEFORE (inline)
<span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>

// AFTER (Tailwind)
<span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
```

#### Select Element
```jsx
// BEFORE (inline)
<select style={{ padding: '0.75rem 1rem', fontSize: '14px', borderRadius: '12px', border: '1px solid #d1d5db', background: 'white', color: '#374151', minWidth: '280px' }}>

// AFTER (Tailwind)
<select className="
  h-11 px-4 min-w-[200px] sm:min-w-[280px]
  bg-white dark:bg-slate-800
  border border-slate-200 dark:border-slate-700
  rounded-xl text-sm
  text-slate-700 dark:text-slate-300
  focus:outline-none focus:ring-2 focus:ring-lavpop-blue
  transition-all
">
```

**Optional Enhancement:**
Consider creating a custom dropdown component using Headless UI or Radix UI for better styling control and accessibility.

**Files to Modify:**
- `src/components/DateRangeSelector.jsx`

**Estimated Effort:** 2 hours

---

## 🎨 Design System Patterns to Apply

### Color Palette Usage

**KPI Cards (Gradient Backgrounds):**
- Washers/Customer metrics: `from-blue-500 to-indigo-600`
- Dryers/Performance: `from-orange-500 to-amber-600`
- Utilization/Operations: `from-purple-500 to-violet-600`
- Alerts/Critical: `from-red-500 to-rose-600`
- Success/Positive: `from-green-500 to-emerald-600`

**Status Indicators:**
- Success: `bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400`
- Warning: `bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400`
- Error: `bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400`
- Info: `bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400`

**Standard Cards:**
```jsx
bg-white dark:bg-slate-800
rounded-xl
shadow-sm
border border-slate-200 dark:border-slate-700
p-6
```

### Typography Scale

```jsx
// Page Title
text-2xl font-bold text-slate-900 dark:text-white

// Section Title
text-xl font-semibold text-slate-800 dark:text-slate-200

// Card Title
text-lg font-bold text-slate-700 dark:text-slate-300

// Body Text
text-sm text-slate-700 dark:text-slate-300

// Small Text / Labels
text-xs text-slate-600 dark:text-slate-400

// Micro Text (compact widgets)
text-[10px] font-medium text-slate-600 dark:text-slate-400
```

### Spacing System

```jsx
// Between sections
space-y-6

// Card grids
gap-6

// Internal card padding
p-6

// Compact elements
gap-3

// Margins
mb-6 (section spacing)
mb-4 (subsection spacing)
mb-2 (tight spacing)
```

### Responsive Breakpoints

```jsx
// Mobile first approach
grid-cols-1          // Mobile
sm:grid-cols-2       // Tablet (640px+)
lg:grid-cols-3       // Desktop (1024px+)
xl:grid-cols-4       // Large desktop (1280px+)
```

### Icon Usage (Lucide React)

**Common Icons Needed:**
```jsx
import {
  TrendingUp,      // Positive trends
  TrendingDown,    // Negative trends
  Minus,           // Neutral/no change
  AlertTriangle,   // Warnings
  Flame,           // Peak/hot
  Snowflake,       // Off-peak/cold
  Zap,             // Quick actions
  CheckCircle,     // Completed/success
  Wrench,          // Maintenance
  Calendar,        // Date/time
  Clock,           // Hours
  DollarSign,      // Revenue/money
  Activity,        // Performance
  BarChart2,       // Charts
  Package          // Services/cycles
} from 'lucide-react';
```

**Icon Sizing:**
```jsx
w-4 h-4    // Small inline icons
w-5 h-5    // Standard icons
w-6 h-6    // Larger icons
w-8 h-8    // Header/feature icons
```

---

## 🔧 Implementation Strategy

### Phase 1: Foundation (Week 1)
**Goal:** Update core containers and layout

1. **Operations.jsx** - Parent container
   - Update page layout to Tailwind
   - Remove styled-jsx
   - Implement responsive grid
   - Add dark mode classes

2. **DateRangeSelector.jsx** - Date filtering
   - Replace inline styles
   - Add dark mode support
   - Improve mobile responsiveness

**Deliverable:** Working layout with date filtering

---

### Phase 2: KPI & Summary Components (Week 1-2)
**Goal:** Update high-priority cards and summaries

3. **OperationsKPICards.jsx**
   - Replace inline styles with Tailwind
   - Implement gradient backgrounds from design system
   - Replace emojis with Lucide icons
   - Add dark mode support
   - Update progress bars

4. **PeakHoursSummary.jsx**
   - Replace inline styles
   - Update table row colors with Tailwind
   - Replace emoji icons
   - Add dark mode support

**Deliverable:** Beautiful KPI cards and peak hours summary

---

### Phase 3: Charts (Week 2)
**Goal:** Update visualization components

5. **WashVsDryChart.jsx**
   - Update container styling
   - Apply theme colors to Recharts
   - Update custom tooltip
   - Add dark mode to chart elements

6. **DayOfWeekChart.jsx**
   - Update container and cards
   - Apply theme colors
   - Update custom tooltip
   - Add dark mode support

7. **UtilizationHeatmap.jsx**
   - Replace inline cell styles
   - Update color palette with Tailwind
   - Improve mobile responsiveness
   - Add dark mode support

**Deliverable:** Themed, responsive charts

---

### Phase 4: Data Tables (Week 2-3)
**Goal:** Update complex table component

8. **MachinePerformanceTable.jsx**
   - Replace HTML table inline styles
   - Implement Tailwind table pattern
   - Remove inline hover handlers
   - Add dark mode support
   - Improve mobile table view

**Deliverable:** Modern, accessible table

---

### Phase 5: Testing & Refinement (Week 3)
**Goal:** Ensure quality and consistency

- Test all components on mobile, tablet, desktop
- Verify dark mode in all states
- Check accessibility (ARIA labels, color contrast)
- Performance testing
- Cross-browser testing
- User acceptance testing

**Deliverable:** Production-ready Operations tab

---

## ✅ Quality Assurance Checklist

### Visual Testing
- [ ] All components render correctly on mobile (320px - 640px)
- [ ] Tablet view (640px - 1024px) has proper layout
- [ ] Desktop view (1024px+) uses full grid layout
- [ ] Large desktop (1280px+) optimizes space
- [ ] Dark mode works in all components
- [ ] All gradients and colors match design system
- [ ] Icons render at proper sizes
- [ ] Typography is consistent and readable

### Functional Testing
- [ ] Date range selector updates all child components
- [ ] KPI cards show correct metrics and trends
- [ ] Heatmap cells are interactive
- [ ] Charts render responsively
- [ ] Tables scroll horizontally on mobile
- [ ] Hover states work correctly
- [ ] All animations are smooth

### Accessibility Testing
- [ ] Color contrast meets WCAG AA standards
- [ ] All interactive elements have ARIA labels
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Focus states are visible
- [ ] No color-only indicators (icons + color)

### Performance Testing
- [ ] No unnecessary re-renders
- [ ] Charts load efficiently
- [ ] No layout shift (CLS)
- [ ] Fast first paint
- [ ] Optimized images (if any)

### Code Quality
- [ ] No inline styles (except dynamic values)
- [ ] Consistent Tailwind class usage
- [ ] Proper component organization
- [ ] Clean imports (remove unused)
- [ ] Console.log statements removed
- [ ] PropTypes or TypeScript types defined

---

## 📊 Success Metrics

### Quantitative Metrics
- **Code Reduction:** Expect 30-40% reduction in lines of code
- **Bundle Size:** Minimal impact (Tailwind is already loaded)
- **Performance:** Maintain or improve Lighthouse score
- **Accessibility:** WCAG AA compliance (contrast ratio ≥ 4.5:1)

### Qualitative Metrics
- **Consistency:** All components use same design patterns
- **Maintainability:** Easier to update styles globally
- **Developer Experience:** Faster to build new components
- **User Experience:** Better dark mode, responsive design

---

## 🚧 Risks & Mitigation

### Risk 1: Breaking Existing Functionality
**Mitigation:**
- Test each component thoroughly before moving to next
- Keep original files as backup (.bak)
- Use git commits after each component update
- Regression testing after each phase

### Risk 2: Dark Mode Color Contrast Issues
**Mitigation:**
- Use design system recommended dark mode colors
- Test with color contrast checker tools
- Verify chart readability in both modes
- User testing with actual dark mode users

### Risk 3: Mobile Responsiveness Regressions
**Mitigation:**
- Test on real devices (iOS, Android)
- Use Chrome DevTools responsive mode
- Test landscape and portrait orientations
- Verify touch targets are ≥44px

### Risk 4: Recharts Dark Mode Complexity
**Mitigation:**
- Research Recharts dark mode best practices
- Create reusable theme configuration
- Test chart readability thoroughly
- Consider alternative chart libraries if needed

---

## 📁 File Structure

```
src/
├── views/
│   └── Operations.jsx                  ← Parent container
├── components/
│   ├── OperationsKPICards.jsx         ← KPI cards
│   ├── UtilizationHeatmap.jsx         ← Heatmap visualization
│   ├── PeakHoursSummary.jsx           ← Peak hours analysis
│   ├── WashVsDryChart.jsx             ← Service comparison chart
│   ├── DayOfWeekChart.jsx             ← Day pattern analysis
│   ├── MachinePerformanceTable.jsx    ← Machine metrics table
│   └── DateRangeSelector.jsx          ← Date filter control
├── utils/
│   ├── businessMetrics.js             ← Business calculations
│   ├── operationsMetrics.js           ← Operations calculations
│   └── dateWindows.js                 ← Date range logic
└── Design System.md                    ← Design system guide
```

---

## 🎓 Developer Resources

### Tailwind CSS Documentation
- [Tailwind Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Gradient Backgrounds](https://tailwindcss.com/docs/background-image)

### Lucide React Icons
- [Icon Gallery](https://lucide.dev/icons)
- [React Usage](https://lucide.dev/guide/packages/lucide-react)

### Recharts with Tailwind
- [Recharts Documentation](https://recharts.org/)
- [Styling Recharts](https://recharts.org/en-US/api)

### Accessibility
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

## 📝 Notes

- **Preserve Functionality:** All business logic and data calculations remain unchanged
- **Version Control:** Each component update should be a separate git commit
- **Testing Required:** Manual testing after each component update
- **Documentation:** Update component comments with new version numbers
- **User Feedback:** Gather feedback after Phase 3 before proceeding to Phase 4

---

## 🎯 Expected Outcomes

Upon completion of this plan:

1. **Modern Codebase**
   - All components use Tailwind CSS
   - Zero inline styles (except dynamic values)
   - Consistent design patterns

2. **Enhanced User Experience**
   - Full dark mode support
   - Better mobile responsiveness
   - Improved accessibility
   - Consistent visual language

3. **Improved Maintainability**
   - Easier to update styles globally
   - Faster to build new components
   - Better code organization
   - Reduced CSS complexity

4. **Design System Compliance**
   - Follows LavpopBI Design System v3.0
   - Matches other modernized tabs
   - Ready for future enhancements

---

**Document Version:** 1.0
**Last Updated:** November 26, 2025
**Next Review:** After Phase 3 completion
