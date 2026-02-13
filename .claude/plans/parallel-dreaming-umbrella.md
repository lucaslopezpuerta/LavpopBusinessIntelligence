# Loading & Refresh Indicator Consistency Plan

## Context

The app has 5 different mechanisms for showing loading/refresh state, but they're applied inconsistently:

1. **`StaleDataIndicator`** (header badge) — exists on 5/9 views but **never works** because `DataFreshnessContext` is not wired in App.jsx (`registerRefreshCallback`/`markFresh` are never called, so `lastUpdated` stays `null` and the component returns `null` at line 60)
2. **`BackgroundRefreshIndicator`** — App.jsx shows `variant="floating"` (bottom-right badge), but Campaigns and Intelligence ALSO show `variant="overlay"` (full-screen card), causing **dual overlay stacking** during refresh
3. **Intelligence.jsx** has a 100-line custom `SyncStatusButton` (lines 191-297) that duplicates `StaleDataIndicator` with different styling
4. **Raw spinners** — Sub-components use ad-hoc `Loader2`/`RefreshCw` with inconsistent sizes (`w-6`, `w-8`, `w-10`) and colors (`text-purple-500`, `text-slate-400`, `text-slate-500`)
5. **Missing `StaleDataIndicator`** on Campaigns, SocialMedia, and Directory views

---

## Phase 0 — Wire `DataFreshnessContext` in App.jsx (Prerequisite)

**Problem**: `DataFreshnessProvider` wraps the app but nobody calls `registerRefreshCallback` or `markFresh`, so `lastRefreshed` stays null and `StaleDataIndicator` is invisible everywhere.

**Fix** in [App.jsx](src/App.jsx):
1. Import `useDataRefresh` from `DataFreshnessContext`
2. Inside `AppContent`, call:
   ```js
   const { registerRefreshCallback, markFresh } = useDataRefresh();
   ```
3. Register the refresh callback after `loadData` is defined:
   ```js
   useEffect(() => {
     registerRefreshCallback(() => loadData({ skipCache: true, silent: true }));
   }, [registerRefreshCallback, loadData]);
   ```
4. Call `markFresh()` after successful data load (line ~401, after `setLastRefreshed(Date.now())`):
   ```js
   setLastRefreshed(Date.now());
   markFresh();  // ← add this
   ```

**Result**: All existing `StaleDataIndicator` instances (Dashboard, Customers, Operations, Weather, Insights) will start working immediately.

---

## Phase 1 — Add `StaleDataIndicator` to 3 Missing Views

### 1.1 [Campaigns.jsx](src/views/Campaigns.jsx)
- Import `StaleDataIndicator` and `useDataRefresh`
- Add `StaleDataIndicator` in the header area (near the section navigation)
- Wire `lastUpdated`, `isRefreshing`, `onRefresh` from DataFreshnessContext

### 1.2 [SocialMedia.jsx](src/views/SocialMedia.jsx)
- Same pattern: import + add to header area
- Wire via `useDataRefresh`

### 1.3 Directory view
- Same pattern if it has a header

---

## Phase 2 — Replace Intelligence.jsx Custom `SyncStatusButton`

**Problem**: Intelligence.jsx (lines 187-297) has a custom `SyncStatusButton` component with ~110 lines that duplicates `StaleDataIndicator` but with different styling (motion buttons, haptic feedback, glassmorphism borders).

**Fix** in [Intelligence.jsx](src/views/Intelligence.jsx):
1. Delete the entire `SyncStatusButton` component (lines 187-297) and `STALE_THRESHOLD_MS` constant (line 189)
2. Import `StaleDataIndicator` from `../components/ui/StaleDataIndicator`
3. Replace the `<SyncStatusButton ... />` usage (where it's rendered in the header) with `<StaleDataIndicator lastUpdated={lastUpdated} isRefreshing={isRefreshing} onRefresh={handleRefresh} />`
4. Remove unused imports that were only needed by SyncStatusButton (`CheckCircle`)

**Result**: ~100 lines deleted, consistent indicator across all views.

---

## Phase 3 — Remove Dual Overlay Stacking

**Problem**: When refreshing, users see BOTH:
- App.jsx's `BackgroundRefreshIndicator variant="floating"` (bottom-right badge)
- View-level `BackgroundRefreshIndicator variant="overlay"` (full-screen centered card) in Campaigns and Intelligence

These stack: a semi-transparent full-screen overlay PLUS a floating badge.

**Fix**:
1. **[Campaigns.jsx](src/views/Campaigns.jsx)**: Remove the `<BackgroundRefreshIndicator isRefreshing={isRefreshing} variant="overlay" />` (line 350-354) and its import
2. **[Intelligence.jsx](src/views/Intelligence.jsx)**: Remove the `<BackgroundRefreshIndicator isRefreshing={isRefreshing} variant="overlay" />` (lines 751-755) and its import

**Keep**: App.jsx floating badge (non-intrusive, universal). Sub-component API-sync overlays in WhatChimpAnalytics, InstagramAnalytics, GoogleBusinessAnalytics, WhatsAppAnalytics (these are independent API syncs, not the main data refresh — they should keep their own overlays).

**Result**: One consistent, non-intrusive floating badge for main data refresh. Sub-components keep overlays for their own independent API syncs.

---

## Phase 4 — Create `SectionLoadingState` Component

**Problem**: Sub-components use bare `Loader2`/`RefreshCw` with inconsistent styling:
- `Loader2 w-6 h-6 text-slate-400 animate-spin` (BlacklistManager:233)
- `Loader2 w-8 h-8 text-purple-500 animate-spin` (BlacklistManager:721)
- `Loader2 w-10 h-10 text-purple-500 animate-spin mb-4` (AutomationRules:859)
- `RefreshCw w-6 h-6 text-purple-500 animate-spin` (CampaignList:354)
- `RefreshCw w-5 h-5 text-purple-500 animate-spin` (CampaignDetailsModal:598)
- `Loader2 w-8 h-8 text-slate-500 animate-spin` (WhatsAppAnalytics:496)

**Fix** in [Skeleton.jsx](src/components/ui/Skeleton.jsx):
Add a `SectionLoadingState` component:
```jsx
const SectionLoadingState = ({ message = 'Carregando...', size = 'md' }) => {
  const sizes = { sm: 'w-5 h-5', md: 'w-7 h-7', lg: 'w-9 h-9' };
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className={`${sizes[size]} border-3 border-stellar-cyan border-t-transparent rounded-full animate-spin`} />
      <p className="text-xs text-slate-400 dark:text-slate-500">{message}</p>
    </div>
  );
};
```

Export alongside `ModalLoadingFallback` and `InlineLoadingFallback`.

---

## Phase 5 — Replace Raw Spinners in Sub-Components

Replace ad-hoc loading states with `SectionLoadingState`:

| File | Line | Current | Replacement |
|------|------|---------|-------------|
| [AutomationRules.jsx](src/components/campaigns/AutomationRules.jsx) | 859 | `Loader2 w-10 text-purple-500` | `<SectionLoadingState message="Carregando regras..." />` |
| [BlacklistManager.jsx](src/components/campaigns/BlacklistManager.jsx) | 721 | `Loader2 w-8 text-purple-500` | `<SectionLoadingState message="Carregando lista..." />` |
| [CampaignList.jsx](src/components/campaigns/CampaignList.jsx) | 354 | `RefreshCw w-6 text-purple-500` | `<SectionLoadingState message="Carregando campanhas..." />` |
| [CampaignDetailsModal.jsx](src/components/campaigns/CampaignDetailsModal.jsx) | 598 | `RefreshCw w-5 text-purple-500` | `<SectionLoadingState message="Carregando detalhes..." />` |
| [WhatsAppAnalytics.jsx](src/components/campaigns/WhatsAppAnalytics.jsx) | 496 | `Loader2 w-8 text-slate-500` | `<SectionLoadingState message="Carregando analytics..." />` |

**Note**: Button-inline spinners (e.g., `Loader2 w-4 h-4 animate-spin` inside buttons like BlacklistManager:233, WhatsAppAnalytics:447) and header-inline refresh icons (RefreshCw with conditional `animate-spin` on buttons) are LEFT AS-IS — they are contextually correct for their button/header positions.

---

## Critical Files

| File | Phase | Changes |
|------|-------|---------|
| `src/App.jsx` | 0 | Wire `registerRefreshCallback` + `markFresh` from DataFreshnessContext |
| `src/views/Campaigns.jsx` | 1, 3 | Add StaleDataIndicator, remove overlay |
| `src/views/SocialMedia.jsx` | 1 | Add StaleDataIndicator |
| `src/views/Intelligence.jsx` | 2, 3 | Delete SyncStatusButton (~100 lines), use StaleDataIndicator, remove overlay |
| `src/components/ui/Skeleton.jsx` | 4 | Add SectionLoadingState component |
| `src/components/campaigns/AutomationRules.jsx` | 5 | Replace raw spinner |
| `src/components/campaigns/BlacklistManager.jsx` | 5 | Replace raw spinner |
| `src/components/campaigns/CampaignList.jsx` | 5 | Replace raw spinner |
| `src/components/campaigns/CampaignDetailsModal.jsx` | 5 | Replace raw spinner |
| `src/components/campaigns/WhatsAppAnalytics.jsx` | 5 | Replace raw spinner |

**Referenced (read-only)**:
- `src/contexts/DataFreshnessContext.jsx` — `registerRefreshCallback`, `markFresh`, `useDataRefresh`
- `src/components/ui/StaleDataIndicator.jsx` — Reused across all views
- `src/components/ui/BackgroundRefreshIndicator.jsx` — Floating variant kept in App.jsx

---

## Verification

1. `npm run build` — builds without errors
2. Open dev server → check Dashboard/Customers/Operations/Weather/Insights headers: StaleDataIndicator should show "agora" timestamp and turn amber after 5 minutes
3. Click StaleDataIndicator → should trigger refresh, show spinning cyan state
4. Check Campaigns/SocialMedia headers: same StaleDataIndicator behavior
5. Check Intelligence: no custom SyncStatusButton, uses StaleDataIndicator instead
6. During refresh: only floating badge appears (no full-screen overlay on Campaigns/Intelligence)
7. Navigate to AutomationRules, BlacklistManager, CampaignList → loading states should show consistent `SectionLoadingState` with stellar-cyan spinner and Portuguese message
8. Sub-component API syncs (WhatChimp, Instagram, Google, WhatsApp) still show their own overlays independently
