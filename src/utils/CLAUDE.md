# Utils Directory

Utility functions and services for the Bilavnova Business Intelligence application.

## Overview

This directory contains 42 utility files organized by category:
- **Data & API** - Supabase client, loaders, API services
- **Metrics & Calculations** - Business logic and analytics
- **Localization** - Brazilian date/number/phone formatting
- **Services** - External integrations (Twilio, Weather)
- **Caching** - IndexedDB and localStorage caching
- **Visualization** - Chart colors and themes

## Files by Category

### Data & API Layer

| File | Purpose | Version |
|------|---------|---------|
| `supabaseClient.js` | Shared Supabase client singleton | - |
| `supabaseLoader.js` | SWR data loading with caching | v3.4 |
| `supabaseUploader.js` | CSV import to Supabase | - |
| `apiService.js` | Unified API layer (campaigns, messages) | v5.7 |
| `campaignService.js` | Campaign CRUD operations | v5.6 |
| `dataCache.js` | IndexedDB caching layer | v2.2 |
| `idbStorage.js` | IndexedDB abstraction | - |

### Metrics & Calculations

| File | Purpose |
|------|---------|
| `businessMetrics.js` | Revenue, AOV, transaction counts |
| `customerMetrics.js` | RFM segments, churn risk, lifetime value |
| `operationsMetrics.js` | Machine utilization, cycles, hours |
| `intelligenceCalculations.js` | ML scoring, forecasting (63KB) |
| `calculations.js` | Shared calculation utilities |

### Brazilian Localization

| File | Purpose | Pattern |
|------|---------|---------|
| `dateUtils.js` | Brazilian dates (DD/MM/YYYY) | `parseBrDate()` returns `.brazil` property |
| `dateWindows.js` | Date range calculations | `getDateWindows()` for period comparison |
| `numberUtils.js` | Brazilian numbers (1.234,56) | `formatCurrency()`, `parseNumber()` |
| `cpfUtils.js` | CPF validation/normalization | `normalizeCpf()`, `formatCpf()` |
| `phoneUtils.js` | Phone validation/parsing | `normalizePhone()`, `formatPhone()` |
| `formatters.js` | General formatting utilities | - |

### External Services

| File | Purpose |
|------|---------|
| `weatherService.js` | Weather API integration |
| `weatherUtils.js` | Weather data utilities |
| `twilioSyncService.js` | Twilio webhook sync |
| `contactTrackingService.js` | WhatsApp delivery tracking |
| `blacklistService.js` | Opt-out management |
| `errorTracking.js` | Sentry integration |

### Visualization

| File | Purpose |
|------|---------|
| `chartColors.js` | Recharts color schemes |
| `chartThemes.js` | Theme-aware chart configs |
| `colorMapping.js` | Semantic color system |
| `lazyCharts.jsx` | Code-split chart components |

### PDF Export System (v2.0)

| File | Purpose |
|------|---------|
| `exportUtils.js` | Main PDF/CSV export functions (Executive Summary, Complete Report, Customer Health) |
| `pdfSectionBuilders.js` | Modular PDF section renderers (hero, KPI grid, narratives, gauges, charts) |
| `pdfInsightGenerator.js` | Narrative & insight generation in Portuguese |
| `reportConfigs.js` | Design System v6.3 colors and report template configurations |

### Platform & Mobile

| File | Purpose |
|------|---------|
| `platform.js` | Platform detection (web/native) |
| `nativeStatusBar.js` | Capacitor status bar styling |
| `haptics.js` | Haptic feedback (native) |

### Deprecated

| File | Status |
|------|--------|
| `csvLoader.js` | Legacy - replaced by Supabase |
| `DriveSalesMasterFolderWatch.js` | Legacy - not in use |
| `DriveCustomerMasterFolderWatch.js` | Legacy - not in use |

## Key Patterns

### 1. Version Headers

All significant utilities include version tracking:

```javascript
/**
 * Module Name v2.1
 * Short description
 *
 * CHANGELOG:
 * v2.1 (2026-01-20): Added feature X
 * v2.0 (2026-01-15): Major refactor
 */
```

### 2. Brazilian Date Handling

The `.brazil` property pattern preserves raw time values:

```javascript
import { parseBrDate } from './dateUtils';

const date = parseBrDate('23/01/2026 14:30:00');

// For display (timezone-independent):
date.brazil.hour   // 14 (always Brazil time)
date.brazil.day    // 23
date.brazil.month  // 1

// For sorting/comparison:
date.getTime()     // milliseconds since epoch
```

### 3. Supabase Loading (SWR Pattern)

Data loading follows Stale-While-Revalidate:

```javascript
import { loadAllData, invalidateCache } from './supabaseLoader';

// Initial load - returns cached if available, fetches in background
const { sales, customer, rfm, dailyRevenue } = await loadAllData();

// Force fresh data
await invalidateCache();
const freshData = await loadAllData();
```

### 4. Service Layer Pattern

Services wrap Supabase operations with error handling:

```javascript
// Pattern for service functions
export async function getItems(filters) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('table')
    .select('*')
    .match(filters);

  if (error) {
    console.error('[ServiceName] Error:', error);
    throw new Error(error.message);
  }

  return data;
}
```

### 5. Cache Layer Pattern

IndexedDB caching with TTL:

```javascript
import { getCachedData, setCachedData } from './dataCache';

const CACHE_KEY = 'my_data';
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

// Check cache first
const cached = await getCachedData(CACHE_KEY, CACHE_TTL);
if (cached) return cached;

// Fetch fresh data
const data = await fetchFromAPI();

// Update cache
await setCachedData(CACHE_KEY, data);
return data;
```

## Important Notes

### Brazilian Number Formatting

Always use the utils for Brazilian standards:

```javascript
import { formatCurrency, parseNumber } from './numberUtils';

// Correct
formatCurrency(1234.56)   // "R$ 1.234,56"
parseNumber("1.234,56")   // 1234.56

// Wrong - don't use Intl directly
new Intl.NumberFormat().format() // Uses browser locale
```

### Timezone Handling

All timestamps represent Brazil business time (America/Sao_Paulo):

```javascript
import { parseBrDate, formatBrDate, isToday } from './dateUtils';

// parseBrDate preserves Brazil time in .brazil property
// Use .brazil.hour for peak hour analysis, NOT .getHours()

// isToday() checks against Brazil's current date
if (isToday(date)) { ... }
```

### Error Handling

Use the logger for consistent error tracking:

```javascript
import { logger } from './logger';

try {
  await operation();
} catch (error) {
  logger.error('Operation failed', { error, context: data });
  throw error; // Re-throw for caller handling
}
```

## Dependencies

- `@supabase/supabase-js` - Database client
- `papaparse` - CSV parsing (legacy)
- `date-fns` - Date utilities (some files)
- `@capacitor/haptics` - Native haptic feedback
