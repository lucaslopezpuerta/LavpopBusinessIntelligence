# Fix: Empty Views After Navigating Away from Campaigns/SocialMedia

## Context

After visiting the Campaigns or SocialMedia views and navigating to any other view, the destination view renders empty. This happens consistently because `AnimatePresence mode="wait"` in App.jsx blocks mounting the new view until the exit animation completes — and the exit animation gets stuck.

**Root cause:** `AnimatePresence mode="wait"` (App.jsx line 653) requires the exiting view's animation to complete before mounting the new view. Campaigns (6 lazy components) and SocialMedia (7 lazy components) have many `<Suspense>` boundaries with lazy-loaded sub-components. When those components finish loading or trigger state updates during the 80ms exit phase, React re-renders the exiting tree, which disrupts Framer Motion v11.18.2's exit animation tracking. The exit never "completes" → the new view never mounts → empty page.

Other views (Dashboard: 1, Weather: 0, Intelligence: 3 lazy components) rarely trigger this because they have far fewer async boundaries.

## Fix: Remove AnimatePresence from Page Transitions

**Single file change:** `src/App.jsx`

Each view already has rich entrance animations via `AnimatedView`'s Stellar Cascade (120ms container fade + staggered header/sections ~250ms). These trigger on mount regardless of AnimatePresence. Removing AnimatePresence eliminates the exit-blocking bug while preserving visual transition quality.

### Step 1: Remove unused imports (line 160)

```jsx
// Before:
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';

// After:
import { MotionConfig } from 'framer-motion';
```

Also remove the `PAGE_TRANSITION` / `PAGE_TRANSITION_REDUCED` imports (line 162) if still present — they're unused.

### Step 2: Remove pageVariants (lines 314-321)

Delete the entire `pageVariants` declaration:
```jsx
// DELETE this block:
const pageVariants = prefersReducedMotion
  ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } }
  : {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { duration: 0.1, ease: 'easeOut' } },
      exit: { opacity: 0, transition: { duration: 0.08, ease: 'easeIn' } }
    };
```

### Step 3: Replace AnimatePresence + motion.div block (lines 653-681)

```jsx
// Before:
<AnimatePresence mode="wait" initial={false}>
  <motion.div
    key={activeTab}
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
  >
    <ViewErrorBoundary key={activeTab} fallback={...}>
      <Suspense fallback={...}>
        {/* view content */}
      </Suspense>
    </ViewErrorBoundary>
  </motion.div>
</AnimatePresence>

// After:
<ViewErrorBoundary key={activeTab} fallback={getLoadingFallback(activeTab)}>
  <Suspense fallback={getLoadingFallback(activeTab)}>
    {(activeTab !== 'upload' && (!data || !data.sales || data.sales.length === 0)) ? (
      getLoadingFallback(activeTab)
    ) : (
      <ActiveComponent
        data={data}
        onNavigate={handleTabChange}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onDataChange={refreshAfterAction}
      />
    )}
  </Suspense>
</ViewErrorBoundary>
```

`key={activeTab}` on ViewErrorBoundary forces full remount on navigation, triggering AnimatedView's Stellar Cascade entrance.

## What's Preserved

- **Entrance animations**: AnimatedView's Stellar Cascade (container fade + staggered sections) fires on every mount
- **Reduced motion**: `<MotionConfig reducedMotion={...}>` still wraps the app
- **Error boundaries**: ViewErrorBoundary with key={activeTab} still resets per view
- **Scroll-to-top**: useEffect on activeTab still fires
- **View-specific skeletons**: Suspense fallbacks remain

## What's Removed

- **80ms exit fade-out**: Imperceptible at that duration. The Stellar Cascade entrance (~250ms) provides the visual transition cue.

## Verification

1. `npm run dev` — start dev server
2. Navigate to Campaigns → verify it renders correctly
3. Navigate to Dashboard → verify it renders (not empty)
4. Navigate to SocialMedia → verify it renders
5. Navigate to Customers → verify it renders (not empty)
6. Rapid-fire navigation: click through all tabs quickly — no empty views
7. `npm run build` — verify production build succeeds
