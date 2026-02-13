# Campaigns View - Mobile Redesign Plan

## Context

The Campaigns view is information-dense and designed primarily for desktop. On mobile (both web and Android via Capacitor), several UX issues degrade the experience: undersized touch targets, icon-only tabs without labels, a primary CTA outside the thumb zone, cramped table layouts, and no progressive disclosure for long scrolls. This plan addresses each with targeted, incremental changes that follow existing codebase patterns.

---

## 1. Sticky Labeled Tab Navigation (Highest Impact)

**File:** `src/components/campaigns/CampaignSectionNavigation.jsx` (v3.0 -> v3.1)

- **Fix touch targets**: Change mobile buttons from `w-10 h-10` (40px) to `min-w-[44px] min-h-[44px]`
- **Add mobile labels**: Show short labels below icons on mobile (stacked layout with `flex-col gap-0.5`). Short labels: "Geral", "Auto", "Publico", "Msgs", "Lista", "Monitor". Keep full labels on `sm:` (horizontal layout)
- **Make sticky**: Add `sticky top-0 z-30` with glassmorphic background (`backdrop-blur-md`) and page-matching bg color via `isDark`
- **Reduce tab gap**: `gap-1.5` on mobile (from `gap-2`) to fit more tabs in view

Existing `layoutId="campaign-nav-active"` Framer Motion animation handles shape transitions automatically.

---

## 2. Floating Action Button for "Nova Campanha"

**File:** `src/views/Campaigns.jsx` (v2.9.0 -> v3.0)

- **Desktop**: Keep current inline button in header (add `hidden sm:flex`)
- **Mobile**: Add fixed FAB at `bottom-20 right-4` (above 64px BottomNavBar + safe area)
  - 56px circular button, purple gradient, Plus icon
  - `z-40`, hidden when NewCampaignModal is open
  - `whileTap={{ scale: 0.92 }}` + `haptics.medium()` on press
  - `aria-label="Nova Campanha"`
- Import `useIsMobile` from existing `useMediaQuery` hook and `motion` from framer-motion

---

## 3. Mobile Campaign Cards (Replace Table)

**File:** `src/components/campaigns/CampaignDashboard.jsx` (v3.18 -> v3.19)

### A. Fix time filter touch targets
- Change `min-h-[36px] min-w-[36px]` to `min-h-[44px] min-w-[44px]`

### B. Mobile card layout for RecentCampaignsTable
- Use `useIsMobile()` to conditionally render cards vs table
- Desktop: keep existing table unchanged
- Mobile: render card-based list (reuse pattern from `CouponCard` in CouponEffectiveness)

**Card structure per campaign:**
```
[Type Icon] Campaign Name              [Status Badge]
            Audience                   [Return Rate %]
---
Enviados: 42  |  Retornaram: 5  |  R$ 250
(Failed warning if applicable)
```

- `border-l-4` color based on return rate (emerald/amber/rose) - matches existing CampaignList pattern
- `p-4 rounded-xl space-y-3` between cards
- Reuse existing helpers: `getDeliveryMetrics`, `isAutomated`, `hasTrackingIssue`, `getStatusColor`

---

## 4. MessageFlowMonitor Touch Targets & Text Fixes

**File:** `src/components/campaigns/MessageFlowMonitor.jsx` (v2.1 -> v2.2)

- **FilterPill touch targets**: Add `min-h-[44px]` and `py-2` on mobile (keep compact on desktop via `sm:min-h-0 sm:py-1.5`)
- **Fix text-[10px] violations**: Change all `text-[10px]` to `text-xs` (12px minimum per Design System)
- **Pagination per-page buttons**: Add `min-h-[44px]` for consistency

---

## 5. Progressive Disclosure on Overview Tab

**File:** `src/views/Campaigns.jsx` (same v3.0 changes)

- On mobile, CouponEffectiveness and SegmentCampaignMatrix start **collapsed**
- CampaignDashboard always visible (primary content)
- Show "Ver analise detalhada" expand button below CampaignDashboard on mobile
- Use `AnimatePresence` + height animation for smooth expand/collapse
- Desktop: always show all sections (no change)
- Reduces initial mobile scroll depth by ~60%

---

## 6. Minor Improvements (Low Priority)

**CouponEffectiveness** (`src/components/campaigns/CouponEffectiveness.jsx`):
- Add `interval="preserveStartEnd"` to bar chart XAxis to prevent label overlap on narrow screens

**SegmentCampaignMatrix** (`src/components/campaigns/SegmentCampaignMatrix.jsx`):
- No changes needed - already well-optimized with mobile card layout

---

## Implementation Order

| # | Component | Effort | Impact |
|---|-----------|--------|--------|
| 1 | CampaignSectionNavigation (sticky + labels + touch) | Small | Very High |
| 2 | Campaigns.jsx (FAB button) | Small | High |
| 3 | CampaignDashboard (mobile cards + filter touch) | Medium | High |
| 4 | MessageFlowMonitor (touch + text fixes) | Small | Medium |
| 5 | Campaigns.jsx (progressive disclosure) | Medium | Medium |
| 6 | CouponEffectiveness (chart label fix) | Tiny | Low |

## Existing Utilities to Reuse

- `useIsMobile()` / `useIsDesktop()` from `src/hooks/useMediaQuery.js`
- `useReducedMotion()` from `src/hooks/useReducedMotion.js`
- `haptics` from `src/utils/haptics.js`
- `isDark` from `useTheme()` in `src/contexts/ThemeContext.jsx`
- `AnimatePresence`, `motion` from `framer-motion`
- `CouponCard` pattern in CouponEffectiveness as reference for mobile campaign cards

## No New Files Needed

All changes are within existing component files. The mobile campaign card is an inline sub-component within `RecentCampaignsTable`.

## Verification

1. **Visual**: Test on 375px (iPhone SE), 390px (iPhone 14), and 412px (Pixel 7) viewport widths
2. **Touch targets**: Inspect all interactive elements with DevTools to verify >= 44px hit areas
3. **Sticky nav**: Scroll long overview tab content and verify tabs stay fixed at top
4. **FAB**: Verify it clears the BottomNavBar, respects safe areas, and hides when modal opens
5. **Progressive disclosure**: Verify expand/collapse animation on overview tab (mobile only)
6. **Desktop regression**: Verify no visual changes on desktop (>= 1024px)
7. **Dark mode**: Verify all new/modified elements in both light and dark themes
8. **Reduced motion**: Verify animations are disabled when `prefers-reduced-motion: reduce` is set
