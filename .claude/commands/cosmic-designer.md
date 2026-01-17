---
packageVersion: 1.0.0
packageId: design-system
---

# /cosmic-designer Command

Apply the Bilavnova Cosmic Precision design system to a component. This command guides you through variant selection and implements the appropriate cosmic styling.

## What This Command Does

1. Analyzes the target component's current styling
2. Asks clarifying questions to determine the correct cosmic variant
3. Applies the appropriate cosmic styling based on Design System v5.0 rules
4. Updates the component with proper dark mode support

## Usage

`/cosmic-designer [component-path]`

**Examples:**
- `/cosmic-designer src/components/MyCard.jsx`
- `/cosmic-designer` (will ask for component path)

---

## AGENT INSTRUCTIONS

When this command is invoked, follow these steps precisely:

### Step 1: Identify Target Component

If a component path is provided as `$ARGUMENTS`, read that file. Otherwise, ask the user:
- "Which component would you like to apply cosmic styling to? Please provide the file path."

### Step 2: Read Required Context

Read these files to understand the design system rules:
1. `src/Design System.md` - Focus on "Quick Start" and "Part 2: The Cosmic Variants"
2. The target component file

### Step 3: Analyze Current State

Examine the component and note:
- Current background classes (look for `bg-white`, `bg-slate-*`, `dark:bg-*`)
- Current border classes
- Whether it uses `useTheme()` hook
- Component type (card, modal, navigation, etc.)

### Step 4: Ask Variant Selection Questions

Use the AskUserQuestion tool to ask these questions IN A SINGLE CALL (batch all questions together):

**Question 1: Component Purpose**
- Header: "Purpose"
- Question: "What is the primary purpose of this component?"
- Options:
  - "Reusable UI primitive (Button, Input, Badge)" → Variant A
  - "Data display widget (KPI card, metric card)" → Leads to Q2
  - "Dashboard analytics card (charts, tables)" → Leads to Q3
  - "Navigation or overlay (sidebar, modal, dropdown)" → Variant D

**Question 2: Semantic Category** (if applicable based on Q1)
- Header: "Category"
- Question: "Does this component have a fixed semantic category?"
- Options:
  - "Yes - Acquisition/New (purple)"
  - "Yes - Retention/Success (emerald)"
  - "Yes - Revenue/Financial (teal)"
  - "Yes - Warning/Attention (amber)"
  - "Yes - Risk/Critical (red)"
  - "Yes - Operations/Cycles (cyan)"
  - "Yes - Analytics/General (blue)"
  - "No - Neutral/Dynamic content"

**Question 3: Confirm Variant**
- Header: "Confirm"
- Question: "Based on your answers, I recommend [VARIANT X]. Proceed with this variant?"
- Options:
  - "Yes, apply [Variant X]"
  - "No, let me choose differently"

### Step 5: Apply Cosmic Styling

Based on the selected variant, apply these patterns:

#### VARIANT A: Solid Cosmic
```jsx
// Container classes
className="
  bg-white dark:bg-space-dust
  border border-slate-200 dark:border-stellar-cyan/10
  rounded-xl
"
```

#### VARIANT B: Accent-Tinted Cosmic
Replace `{accent}` with the semantic color (purple, emerald, teal, amber, red, cyan, blue):
```jsx
className="
  bg-gradient-to-br from-{accent}-50/40 via-white to-white
  dark:from-{accent}-900/10 dark:via-space-nebula dark:to-space-nebula
  border border-slate-200/80 dark:border-stellar-cyan/10
  border-l-4 border-l-{accent}-500 dark:border-l-{accent}-400
  rounded-2xl
"
```

#### VARIANT C: Neutral Dashboard Cosmic
```jsx
className="
  bg-gradient-to-br from-slate-50/60 via-white to-white
  dark:from-space-dust/40 dark:via-space-nebula dark:to-space-nebula
  border border-slate-200/80 dark:border-stellar-cyan/10
  rounded-2xl
"
```

#### VARIANT D: Glassmorphism Cosmic
Requires `useTheme()` hook:
```jsx
import { useTheme } from '../contexts/ThemeContext';

const { isDark } = useTheme();

// For navigation/fixed elements:
className={`
  ${isDark ? 'bg-space-nebula/90' : 'bg-white/95'}
  backdrop-blur-xl
  border ${isDark ? 'border-stellar-cyan/15' : 'border-slate-200'}
  rounded-xl
`}

// For modals/dropdowns:
className={`
  ${isDark ? 'bg-space-dust/95' : 'bg-white/98'}
  backdrop-blur-xl
  border ${isDark ? 'border-stellar-cyan/20' : 'border-slate-200'}
  shadow-2xl
  rounded-2xl
`}
```

#### VARIANT E: Premium Cosmic
Full cosmic experience with starfield and aurora:
```jsx
import { useTheme } from '../contexts/ThemeContext';

const { isDark } = useTheme();

// Outer container
className={`
  min-h-screen relative overflow-hidden
  ${isDark ? 'bg-space-void' : 'bg-gradient-to-br from-slate-50 to-blue-50'}
`}

// Add starfield (dark mode only)
{isDark && (
  <div className="absolute inset-0 bg-starfield opacity-60 pointer-events-none" />
)}

// Add aurora overlay
<div className="aurora-overlay pointer-events-none" />

// Content card
className={`
  ${isDark ? 'bg-space-dust/80' : 'bg-white/90'}
  backdrop-blur-2xl
  border ${isDark ? 'border-stellar-cyan/20' : 'border-white/50'}
  shadow-2xl
  rounded-3xl
`}
```

### Step 6: Update Internal Elements

After updating the main container, also update internal elements:

**Text colors:**
- Primary headings: `text-slate-900 dark:text-white`
- Secondary text: `text-slate-600 dark:text-slate-300`
- Muted text: `text-slate-500 dark:text-slate-400`

**Internal borders/dividers:**
- `border-slate-200 dark:border-stellar-cyan/10`

**Tooltips/Popovers inside the component:**
- `bg-white dark:bg-space-dust border-slate-200 dark:border-stellar-cyan/10`

**Buttons inside the component:**
- Follow existing Button.jsx patterns

### Step 7: Update Component Changelog

Add a changelog entry at the top of the file:
```jsx
// CHANGELOG:
// vX.X (YYYY-MM-DD): Cosmic Precision upgrade
//   - Applied Variant [A/B/C/D/E]: [Variant Name]
//   - [List specific changes made]
//   - Cosmic compliant: Design System v5.0
```

### Step 8: Verify & Report

After making changes:
1. List all modifications made
2. Confirm the variant applied
3. Note any manual adjustments needed (e.g., adding useTheme import)

---

## Variant Quick Reference

| Variant | Name | Key Pattern | Use For |
|---------|------|-------------|---------|
| A | Solid Cosmic | `dark:bg-space-dust` | Reusable primitives |
| B | Accent-Tinted | `from-{accent}-50/40 dark:via-space-nebula` | Semantic widgets |
| C | Neutral Dashboard | `from-slate-50/60 dark:via-space-nebula` | Dynamic content |
| D | Glassmorphism | `backdrop-blur-xl` + `useTheme()` | Navigation, modals |
| E | Premium | Starfield + aurora + void | Hero/branding |

## Accent Color Reference

| Semantic Category | Accent Color |
|-------------------|--------------|
| Acquisition/New customers | `purple` |
| Retention/Success | `emerald` |
| Revenue/Financial | `teal` |
| Warning/Attention | `amber` |
| Risk/Critical/Churn | `red` |
| Operations/Cycles | `cyan` |
| Analytics/General data | `blue` |
