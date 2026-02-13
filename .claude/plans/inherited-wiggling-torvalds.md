# Plan: Declutter Mobile TopBar

## Context

The mobile topbar (MinimalTopBar) crams **7 interactive elements** into a 375px-wide header:

```
LEFT:  [Saturn 40px] [Clock ~60px]
RIGHT: [Weather ~80px] [StaleData 44px] [Bell 44px] [Actions 44px] [Theme 44px]
       ─── ~256px + gaps ≈ 270px ───
```

**Total: ~380px on a 375px screen.** Items overflow, overlap, or compress. The result feels "piled" and cluttered.

Additionally, two of these items provide zero value on mobile:
- **NotificationBell**: Hardcoded `unreadCount=0`, onClick is a `// TODO` ([MinimalTopBar.jsx:607](src/components/MinimalTopBar.jsx#L607))
- **BrazilClockMobile**: Redundant — the user's phone already displays the time, and the user is in Brazil

**Goal:** Reduce mobile topbar to **3 right-side items** (Weather, StaleData, QuickActions). Move ThemeToggle into the QuickActions overflow menu. Fix typography violations in both files.

---

## Files to Modify

| File | Change |
|------|--------|
| [MinimalTopBar.jsx](src/components/MinimalTopBar.jsx) | Hide 3 items on mobile, add theme action to dropdown |
| [WeatherWidget_API.jsx](src/components/WeatherWidget_API.jsx) | Fix 3 typography violations |

---

## Implementation Steps

### Step 1: Hide BrazilClockMobile on mobile

**Line 636:** Change `hidden xs:block lg:hidden` → `hidden` (or remove the entire block).

The desktop clock already lives inside VitalsConsole (`hidden lg:flex`), so desktop is unaffected. Mobile users see their phone's clock.

Also fix the `text-[11px]` → `text-xs` on line 138 while we're here.

### Step 2: Hide NotificationBell on mobile

**Lines 659-665:** Wrap with `<div className="hidden lg:flex">`.

The Bell already exists inside QuickActions dropdown as "Alertas" (line 471-476), so no functionality is lost.

### Step 3: Hide standalone ThemeToggle on mobile

**Line 676:** Change `<ThemeToggle className="no-print" />` to be wrapped with `<div className="hidden lg:block">`.

Theme access on mobile will come from the QuickActions dropdown (Step 4).

### Step 4: Add theme toggle action to QuickActions dropdown

Inside the QuickActions component:
1. Destructure `toggleTheme` from `useTheme()` (line 346, already has `isDark`)
2. Import `Sun, Moon` — Sun is already imported (line 28 via `lucide-react`), Moon is not → add Moon import
3. Add a new ActionItem between "Alertas" and the divider above "Sair":

```jsx
<ActionItem
  icon={isDark ? Sun : Moon}
  label={isDark ? 'Modo claro' : 'Modo escuro'}
  onClick={() => { toggleTheme(); haptics.medium(); setIsOpen(false); }}
  isDark={isDark}
/>
```

This gives mobile users access to theme switching via the overflow menu.

### Step 5: Simplify WeatherWidget compact mode + fix typography

**Remove the weather condition icon** (Sun/Cloud/Rain in the cyan rounded square) from compact mode. Keep only Thermometer+temp and Droplets+humidity. This saves ~25px more on mobile.

Lines 118-121 (the icon container div with `w-5 h-5 rounded bg-stellar-cyan/10`): **Remove entirely.**

The result goes from `[☁️] [🌡 22°] [💧 65%]` → `[🌡 22° 💧 65%]`.

Also remove the outer wrapping `<div className="flex items-center gap-1.5">` (line 118) since it's no longer needed — the parent div already has `flex items-center gap-1.5`.

**Fix three typography violations:**

| Line | Current | Fix | Context |
|------|---------|-----|---------|
| 88 | `text-[11px]` | `text-xs` | Loading state label |
| 166 | `text-[11px]` | `text-xs` | Full mode feels-like temp |
| 169 | `text-[10px]` | `text-xs` | Full mode humidity |

### Step 6: Update version headers

- **MinimalTopBar.jsx**: v6.0 → v6.1, changelog: "Declutter mobile topbar"
- **WeatherWidget_API.jsx**: v5.2 → v5.3, changelog: "Fix text-[10px]/text-[11px] typography violations"

---

## What Changes on Mobile

**Before (375px):**
```
[Saturn] [13:42]  ...  [Weather] [Sync] [Bell] [Actions] [Theme]
  40      ~60            ~80      44     44      44       44    = ~380px
```

**After (375px):**
```
[Saturn]  .................  [🌡22° 💧65%] [Sync] [⋮]
  40                            ~55          44    44   = ~195px
```

**~185px freed.** Clean, spacious, breathable. Theme toggle accessible via QuickActions overflow menu.

---

## Desktop: No Changes

VitalsConsole (clock, weather, location, realtime), NotificationBell, ThemeToggle, CommandPalette — all remain visible on `lg:` (1024px+) exactly as-is.

---

## Verification

1. `npm run dev` → Chrome DevTools at 375px (iPhone SE)
2. Confirm topbar shows: Saturn logo | Weather | StaleData indicator | QuickActions (⋮)
3. Confirm clock, bell, and theme toggle are NOT visible on mobile
4. Tap QuickActions (⋮) → see "Modo claro"/"Modo escuro" action item
5. Toggle theme via dropdown → theme changes correctly
6. Resize to 1024px+ → all items reappear (bell, theme toggle, clock in VitalsConsole, CommandPalette)
7. `npm run build` → clean build, no errors
