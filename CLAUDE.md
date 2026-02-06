# CLAUDE.md

This file provides guidance for Claude Code when working with this repository.

## Project Overview

Bilavnova Business Intelligence is a React-based business analytics dashboard for a Brazilian laundromat chain (formerly branded as Lavpop). It provides real-time insights into customer behavior, revenue, operations, and marketing campaigns.

**Live site:** https://www.bilavnova.com/

## Tech Stack

### Frontend
- **React 18** with Vite 7
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Framer Motion** for animations
- **Lucide React** for icons
- **React Router DOM** for navigation

### Backend/Infrastructure
- **Supabase** for database and real-time sync
- **Netlify Functions** for serverless APIs
- **Capacitor** for Android native app
- **Sentry** for error tracking

### Python Automation
- **Selenium** for POS data scraping (POS_automation.py)
- **Google APIs** for Drive integration

## Project Structure

```
├── src/
│   ├── components/          # React components organized by feature
│   │   ├── auth/           # Authentication (LoginPage, ProtectedRoute)
│   │   ├── campaigns/      # Campaign management
│   │   ├── customers/      # Customer-related components
│   │   ├── drilldowns/     # Detail/drill-down views
│   │   ├── intelligence/   # Analytics and forecasting
│   │   ├── modals/         # Modal dialogs
│   │   ├── navigation/     # Bottom nav, sidebar
│   │   ├── social/         # Social media analytics
│   │   ├── ui/             # Reusable UI components
│   │   └── weather/        # Weather widgets
│   ├── views/              # Main page views
│   │   ├── Dashboard.jsx   # Main dashboard
│   │   ├── Customers.jsx   # Customer lifecycle tool
│   │   ├── Campaigns.jsx   # Campaign management
│   │   ├── Intelligence.jsx # Business intelligence
│   │   ├── Operations.jsx  # Operational metrics
│   │   ├── Weather.jsx     # Weather correlation
│   │   └── SocialMedia.jsx # Social analytics
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.jsx
│   │   ├── ThemeContext.jsx
│   │   ├── RealtimeSyncContext.jsx
│   │   └── DataFreshnessContext.jsx
│   ├── hooks/              # Custom React hooks (13)
│   │   ├── useRevenuePrediction.js  # ML revenue predictions with caching
│   │   ├── useWeatherForecast.js    # Weather data fetching
│   │   ├── useContactTracking.js    # Contact history
│   │   ├── useBlacklist.js          # Blacklist management
│   │   ├── useActiveCampaigns.js    # Campaign state
│   │   ├── useMediaQuery.js         # Responsive breakpoints
│   │   ├── useReducedMotion.js      # Accessibility
│   │   ├── usePullToRefresh.js      # Mobile gesture
│   │   ├── useSwipeToClose.js       # Mobile gesture
│   │   ├── useTouchTooltip.js       # Mobile tooltips
│   │   ├── useLongPress.js          # Mobile gesture
│   │   ├── useScrollLock.js         # Modal support
│   │   └── useRealtimeSync.js       # Supabase realtime
│   ├── utils/              # Utility functions
│   │   ├── supabaseClient.js
│   │   ├── supabaseLoader.js
│   │   ├── dateUtils.js    # Brazilian date handling
│   │   ├── numberUtils.js  # Brazilian number formatting
│   │   ├── calculations.js # Business metrics
│   │   └── formatters.js
│   ├── constants/          # App constants
│   ├── config/             # Configuration
│   └── test/               # Test setup
├── netlify/functions/      # Serverless functions
│   ├── twilio-whatsapp.js  # WhatsApp messaging
│   ├── twilio-webhook.js   # Webhook handler
│   ├── campaign-scheduler.js # Scheduled campaigns
│   ├── weather-sync.js     # Weather data sync
│   ├── revenue-predict.js  # ML predictions
│   └── supabase-api.js     # Database API
├── supabase/
│   ├── schema.sql          # Database schema
│   └── migrations/         # SQL migrations
├── android/                # Capacitor Android app
├── public/                 # Static assets
└── data/                   # Local CSV data files
```

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test              # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage

# Build
npm run build         # Production build
npm run preview       # Preview production build

# Native app
npm run build:native  # Build + Capacitor sync
npm run cap:android   # Open Android Studio
npm run cap:sync      # Sync web assets to native

# Linting
npm run lint
```

## Testing

- **Framework:** Vitest with React Testing Library
- **Environment:** jsdom
- **Test files:** `src/**/*.{test,spec}.{js,jsx}`
- **Setup file:** `src/test/setup.js`

## Environment Variables

Set in Netlify dashboard or `.env` for local development:

```
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx (server-side only)

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_WHATSAPP_NUMBER=+5554xxx

# APIs
GOOGLE_API_KEY=xxx
VITE_SENTRY_DSN=xxx
```

## Brazilian Localization

This app uses Brazilian standards throughout:

### Date Formatting
- Format: DD/MM/YYYY
- Business week: Sunday through Saturday
- Timezone: America/Sao_Paulo
- Use `src/utils/dateUtils.js` for all date operations

### Number Formatting
- Decimal separator: comma (,)
- Thousands separator: period (.)
- Currency: R$ 1.234,56
- Use `src/utils/numberUtils.js` for all number formatting

### Examples
```javascript
// Correct
formatCurrency(1234.56)  // "R$ 1.234,56"
formatDate(date)         // "07/01/2026"

// Parsing
parseNumber("1.234,56")  // 1234.56
parseDate("07/01/2026")  // Date object
```

## Architecture

### State Management (Context-Based)

The app uses React Context API for state management (no Redux/Zustand). The context hierarchy in `App.jsx`:

```
BrowserRouter
├── ThemeProvider        → isDark, dashboardLayout, toggleTheme()
├── AuthProvider         → user, session, signIn(), signOut()
├── ProtectedRoute       → Auth guard (redirects to /login)
│   ├── SidebarProvider      → isPinned, togglePin()
│   ├── NavigationProvider   → activeTab, navigateTo()
│   ├── DataFreshnessProvider → refresh timing
│   ├── RealtimeSyncProvider  → WebSocket status, update counts
│   └── AppSettingsProvider   → User preferences
└── AppContent           → Main app shell, data loading
```

### Data Fetching & Caching

**Stale-While-Revalidate (SWR) Pattern:**

```
Initial Load:
├── Check IndexedDB cache (4-hour TTL)
│   └── IF HIT: render immediately
└── Background fetch from Supabase
    └── Update IndexedDB silently

Realtime Updates:
├── Supabase Realtime subscriptions (2 tables)
│   ├── contact_tracking → all events
│   └── transactions → all events
└── Custom event dispatch triggers UI refresh

Visibility-Based Refresh:
└── IF stale (>15 min) AND tab visible → silent refresh
```

**Cache Layer:** `src/utils/dataCache.js` + `src/utils/idbStorage.js`
- Backend: IndexedDB (handles large datasets, quota-safe)
- TTL: 4 hours for main data tables
- Invalidation: `invalidateCache()`, `clearAllCache()`

### Component Composition

**Container + Presentational Pattern:**

1. **Smart Components** (data-aware, fetch/subscribe)
   - Views: `Dashboard.jsx`, `Customers.jsx`, `Campaigns.jsx`
   - Features: `AcquisitionCard.jsx`, `RFMScatterPlot.jsx`

2. **Presentational Components** (pure props-based)
   - UI Primitives: `KPICard.jsx`, `Button.jsx`, `StatCard.jsx`
   - Cosmic Components: `CosmicDropdown.jsx`, `CosmicDatePicker.jsx`

3. **Feature Modules** (domain-organized)
   - `campaigns/` (13 files) - Automation, analytics, funnels
   - `intelligence/` (5 files) - Forecasting, scoring
   - `weather/` (9 files) - Weather correlation widgets

### Mobile Architecture

**Responsive Breakpoints:**
- `xs: 475px` (small phones)
- `sm: 640px` (phones)
- `md: 768px` (tablets)
- `lg: 1024px` (desktops)
- `xl: 1280px` (large screens)

**Mobile Patterns:**
- Bottom navigation (64px fixed) on mobile
- Icon sidebar (60px) on desktop, 240px when pinned
- Pull-to-refresh gesture via `usePullToRefresh`
- Swipe-to-close modals via `useSwipeToClose`
- Touch tooltips via `useTouchTooltip`
- Capacitor native Android integration

### Error Handling (Multi-Layer)

```
Layer 1: ErrorBoundary     → React render errors, Sentry tracking
Layer 2: App.jsx           → Data loading errors, ErrorScreen component
Layer 3: apiService.js     → API errors with retry logic, Portuguese messages
Layer 4: supabaseLoader.js → Data validation, defensive caching
Layer 5: Individual utils  → Service-specific errors, graceful degradation
```

### Performance Optimizations

1. **Code Splitting**
   - Views lazy-loaded via `React.lazy()`
   - ExportModal lazy-loaded (saves 170KB)
   - Charts via `src/utils/lazyCharts.jsx`

2. **Memoization**
   - `useMemo()` for expensive metric calculations
   - `useCallback()` for event handlers
   - Split memoization (each metric recalcs independently)

3. **Bundle Optimization**
   - Tailwind CSS purged (only used classes)
   - Dynamic imports for heavy components

## Design System

The application uses the **Cosmic Precision Design System v5.1** (documented in `src/Design System.md`).

### Theme Colors

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Space Void | `#050816` | `bg-space-void` | Page background (deepest) |
| Space Nebula | `#0a0f1e` | `bg-space-nebula` | Fixed elements (sidebar, topbar) |
| Space Dust | `#1a1f35` | `bg-space-dust` | Cards, elevated surfaces |
| Stellar Cyan | `#00aeef` | `text-stellar-cyan` | Active states, accents |
| Cosmic Green | `#00d68f` | `text-cosmic-green` | Success, WhatsApp |

### Component Variants

| Variant | Usage | Pattern |
|---------|-------|---------|
| **A (Solid)** | Buttons, inputs, KPICards | `bg-white dark:bg-space-dust border-slate-200 dark:border-stellar-cyan/10` |
| **B (Accent-Tinted)** | Semantic widgets (Acquisition=purple, Retention=emerald) | `from-{accent}-50/40 dark:via-space-nebula` |
| **C (Neutral)** | Dynamic content widgets | `from-slate-50/60 dark:via-space-nebula` |
| **D (Glassmorphism)** | Navigation, modals, dropdowns | `backdrop-blur-xl` + `useTheme()` |
| **E (Premium)** | Login, loading screens | `bg-space-void` + starfield + aurora |

### Dark Mode Pattern (useTheme)

For Variant D/E components, use the ThemeContext instead of Tailwind's `dark:` prefix:

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

## Notable Components

### Intelligence Components
- `PriorityMatrix.jsx` (v1.9) - 4-dimension business scoring (Profitability, Growth, Break-even, Momentum) with collapsible recommended actions
- `RevenueForecast.jsx` (v2.5) - ML-based revenue projections with contingency guidance

### Cosmic UI Primitives
- `CosmicDropdown.jsx` (v1.1.0) - Accessible dropdown with keyboard navigation, drop-up support
- `CosmicDatePicker.jsx` (v1.2) - Full calendar popup with cosmic styling
- `CosmicTimePicker.jsx` - 24h time selection with scroll columns

## Database Schema

**Schema Version:** 3.35 (2026-01-23)

### Core Data Tables
- `transactions` - POS sales data with computed fields (net_value, cashback)
- `customers` - Customer master data with RFM scores and risk levels
- `coupon_redemptions` - Links coupon usage to campaigns for attribution

### Campaign Management
- `campaigns` - Campaign definitions with A/B testing fields (discount_percent, coupon_code)
- `contact_tracking` - Unified delivery + return tracking (single source of truth)
- `scheduled_campaigns` - Future campaign executions
- `automation_rules` - Automation configs with send windows, rate limits, cooldowns
- `automation_sends` - Individual automation sends for history
- `blacklist` - WhatsApp opt-outs and undelivered numbers

### Analytics Tables
- `webhook_events` - Twilio delivery status updates
- `twilio_daily_costs` - Aggregated daily messaging costs
- `waba_message_analytics` - WhatsApp Business delivery metrics
- `waba_templates` - Meta API message template cache
- `waba_template_analytics` - Per-template metrics with READ data
- `instagram_daily_metrics` - Instagram metrics from Meta Graph API
- `weather_daily_metrics` - Weather data for Caxias do Sul

### ML/Prediction Tables
- `model_coefficients` - OLS regression coefficients with OOS metrics
- `model_training_history` - Training runs for drift detection
- `revenue_predictions` - Daily predictions vs actuals for accuracy tracking

### Configuration Tables
- `app_settings` - Centralized app configuration (single-row, id='default')
- `upload_history` - Data import tracking (manual + automated)
- `rate_limits` - API rate limiting counters

### Key Views
- `campaign_performance` - Campaign metrics with delivery AND return rates
- `daily_revenue` - Daily revenue aggregations (used by ML model)
- `prediction_accuracy` - Rolling 30-day MAE/MAPE metrics
- `instagram_metrics_with_growth` - Instagram with day-over-day growth

Migrations are in `supabase/migrations/` (63 files, latest 061).

## Netlify Functions

Scheduled functions:
- `campaign-scheduler` - Runs every 5 minutes for campaign dispatch
- `weather-sync` - Runs daily at 06:00 Brazil time

API functions:
- `twilio-whatsapp` - Send WhatsApp messages
- `twilio-webhook` - Handle delivery receipts
- `supabase-api` - Database operations
- `revenue-predict` - ML revenue predictions

## Python Automation

`POS_automation.py` scrapes POS data from the laundromat management system:
- Uses Selenium for browser automation
- Uploads data to Supabase via `supabase_uploader.py`
- Dependencies in `requirements.txt`

## Code Style

- ESLint configuration in `eslint.config.js`
- Prefer functional components
- Use destructuring for props
- Keep components focused and small
- Use custom hooks to extract reusable logic

### File Naming Conventions
- Components: PascalCase (`AcquisitionCard.jsx`)
- Utils/Hooks: camelCase (`dateUtils.js`, `useRealtimeSync.js`)
- Styles: Tailwind classes only (no CSS files except `index.css`)

### Component File Structure

```jsx
// 1. Imports (React, libs, utils, components)
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

// 2. Constants & Config
const ANIMATION_DURATION = 0.3;

// 3. Component Definition
const MyComponent = ({ prop1, prop2 }) => {
  // 4. Hooks (state, context, custom)
  const { isDark } = useTheme();
  const [state, setState] = useState(null);

  // 5. Derived values (useMemo, useCallback)
  const memoizedValue = useMemo(() => calc(), [dep]);

  // 6. Effects
  useEffect(() => { ... }, [dep]);

  // 7. Event handlers
  const handleClick = useCallback(() => { ... }, [dep]);

  // 8. Early returns (loading, error)
  if (!data) return <Skeleton />;

  // 9. Render
  return <div>...</div>;
};

export default MyComponent;
```

### Version Comments

Components include version headers for tracking changes:

```jsx
// ComponentName.jsx v2.1 - SHORT DESCRIPTION
// ✅ Feature 1
// ✅ Feature 2
//
// CHANGELOG:
// v2.1 (2026-01-20): Feature addition
// v2.0 (2026-01-15): Major refactor
```

## Gotchas & Common Mistakes

### Timezone Handling (Critical)

All date operations must account for Brazil timezone (America/Sao_Paulo):

**Database:** All SQL date extraction MUST use `AT TIME ZONE`:
```sql
-- Correct
DATE(data_hora AT TIME ZONE 'America/Sao_Paulo')

-- Wrong - will offset dates incorrectly
DATE(data_hora)
```

**Frontend:** Use `dateUtils.js` functions that handle timezone internally:
```javascript
import { parseBrDate, isToday } from './utils/dateUtils';

// parseBrDate returns .brazil property with preserved Brazil time
const date = parseBrDate('23/01/2026 14:30:00');
date.brazil.hour  // 14 (Brazil time, not UTC)
```

**Python automation:** Scripts must set `TZ=America/Sao_Paulo` before imports.

See migrations 059-061 for the comprehensive timezone fix.
