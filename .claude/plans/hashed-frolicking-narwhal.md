# Fix: Brazil Timezone Handling Across Frontend & Backend

## Context

Audit revealed timezone bugs across the codebase. The core question: **"Are we subtracting those 3 hours correctly?"**

### The Current Data Flow (how the 3h offset is handled)

```
POS transaction at 22:30 Brazil time (Feb 13)
    │
    ▼ supabase_uploader.py: parse_br_date() appends "-03:00"
    │ Sends: "2026-02-13T22:30:00-03:00"
    │
    ▼ Supabase TIMESTAMPTZ column
    │ Stores internally as: 2026-02-14T01:30:00+00 (UTC, 3h ahead) ✅
    │
    ▼ Frontend: supabaseLoader.js: formatDateForCSV()
    │ Uses Intl.DateTimeFormat with timeZone: 'America/Sao_Paulo'
    │ Produces: "13/02/2026 22:30:00" (Brazil string) ✅
    │
    ▼ calculations.js: parseBrDate("13/02/2026 22:30:00")
    │ Creates: new Date(2026, 1, 13, 22, 30, 0) — browser-local interpretation
    │ Attaches: .brazil = { year: 2026, month: 2, day: 13, hour: 22, ... } ✅
    │
    ▼ groupSalesByDate: sale.date.toISOString().split('T')[0]
    │
    │ For Brazil user (UTC-3):
    │   Date(2026,1,13,22,30) → internal UTC = Feb 14 01:30
    │   toISOString = "2026-02-14T01:30:00Z"
    │   .split('T')[0] = "2026-02-14" ← ❌ WRONG! Should be Feb 13
    │
    │ The .brazil property DOES have the correct values:
    │   sale.date.brazil.day = 13 ← ✅ CORRECT
```

**Summary**: The 3h subtraction happens correctly in `formatDateForCSV()` → `parseBrDate()` stores it in `.brazil`. But then `toISOString().split('T')[0]` converts BACK to UTC, re-introducing the 3h offset for late-night transactions (21:00-23:59 Brazil).

### What has `.brazil` vs what doesn't

| Data source | Has `.brazil`? | Safe approach |
|---|---|---|
| `sale.date` (from parseBrDate) | **YES** | Use `.brazil.year/month/day` directly |
| Raw `new Date()` in components | No | Use `toBrazilDateString(date)` from dateUtils |
| Backend `new Date()` on Netlify | No | Use `getBrazilNow()` / `getLocalDate()` |
| TIMESTAMPTZ from Supabase in messageFlow | No | Use `Intl.DateTimeFormat` with `timeZone` |

---

## Tier 1: Frontend — Fix date grouping (uses `.brazil`) (HIGH)

These are the only frontend changes that touch core business calculations.

### File: `src/utils/calculations.js`

**1a. Line 135 — `groupSalesByDate()` uses UTC instead of `.brazil`**
```js
// BEFORE:
const dateKey = sale.date.toISOString().split('T')[0];

// AFTER (use .brazil — already parsed, always correct):
const b = sale.date.brazil;
const dateKey = `${b.year}-${String(b.month).padStart(2,'0')}-${String(b.day).padStart(2,'0')}`;
```

**1b. Lines 247-248 — Visit date comparison uses UTC**
```js
// BEFORE:
const prevDate = customerSales[i - 1].date.toISOString().split('T')[0];
const currDate = customerSales[i].date.toISOString().split('T')[0];

// AFTER:
const pb = customerSales[i - 1].date.brazil;
const prevDate = `${pb.year}-${String(pb.month).padStart(2,'0')}-${String(pb.day).padStart(2,'0')}`;
const cb = customerSales[i].date.brazil;
const currDate = `${cb.year}-${String(cb.month).padStart(2,'0')}-${String(cb.day).padStart(2,'0')}`;
```

To avoid repetition, add a small helper at the top of `calculations.js`:
```js
const brazilDateKey = (date) => {
  const b = date.brazil || {};
  return `${b.year}-${String(b.month).padStart(2,'0')}-${String(b.day).padStart(2,'0')}`;
};
```
Then use `brazilDateKey(sale.date)` at lines 135, 247, 248.

---

## Tier 2: Backend — Campaign logic bugs (HIGH)

Netlify functions run in UTC. `new Date()` returns UTC time. Between 21:00-23:59 Brazil, `getDate()`/`getHours()` are wrong.

Existing correct helpers (already in campaign-scheduler.js):
- `getBrazilNow()` — returns Date adjusted to Brazil (line 529)
- `getBrazilDateString()` — returns YYYY-MM-DD in Brazil (line 579)
- `getLocalDate(offset)` — returns YYYY-MM-DD via Intl.DateTimeFormat (line 1167)

### File: `netlify/functions/campaign-scheduler.js`

**2a. Lines 2457-2459 — `hours_after_visit` trigger uses UTC date**
```js
// BEFORE:
const hoursAgo = new Date();
hoursAgo.setHours(hoursAgo.getHours() - trigger_value);
const targetDate = hoursAgo.toISOString().split('T')[0];

// AFTER:
const hoursAgo = getBrazilNow();
hoursAgo.setHours(hoursAgo.getHours() - trigger_value);
const y = hoursAgo.getFullYear(), m = hoursAgo.getMonth()+1, d = hoursAgo.getDate();
const targetDate = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
```
Impact: Post-visit messages fail to match after 21:00 Brazil.

**2b. Lines 2494-2496 — Anniversary uses UTC month/day**
```js
// BEFORE:
const today = new Date();
const currentMonth = today.getMonth() + 1;
const currentDay = today.getDate();

// AFTER:
const today = getBrazilNow();
const currentMonth = today.getMonth() + 1;
const currentDay = today.getDate();
```

**2c. Lines 3042-3045 — `formatExpirationDate()` uses UTC**
```js
// BEFORE:
const date = new Date();

// AFTER:
const date = getBrazilNow();
```
Impact: Customer-facing expiration dates in WhatsApp messages wrong in evening.

**2d. Line 2487 — Weather cooldown date**
```js
// BEFORE:
new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

// AFTER:
getLocalDate(-14)
```

**2e. Line 2860 — Weather campaign date marker**
```js
// BEFORE:
new Date().toISOString().split('T')[0]

// AFTER:
getBrazilDateString()
```

**2f. Lines 2870-2872, 2971-2973 — Anniversary years calculation**
```js
// BEFORE:
const registrationDate = new Date(target.data_cadastro);

// AFTER:
const registrationDate = new Date(target.data_cadastro + 'T12:00:00-03:00');
```
Prevents midnight UTC from shifting the registration date to wrong day.

---

## Tier 3: Frontend display — Use explicit timezone (MEDIUM)

These changes add `timeZone: 'America/Sao_Paulo'` to display functions. They format TIMESTAMPTZ values from Supabase (not `.brazil` data), so they need Intl to convert correctly.

### File: `src/components/campaigns/messageFlowUtils.js`

**3a. Lines 54-68 — `formatDateTime()` and `formatTime()` use browser local time**

Currently uses `d.getHours()`/`d.getDate()` which shows browser-local time. For Brazil users this works by luck, but fails for any other timezone.

```js
// AFTER:
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(d);
  const p = {};
  parts.forEach(({ type, value }) => p[type] = value);
  return `${p.day}/${p.month} ${p.hour}:${p.minute}`;
};

export const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).format(d);
};
```

### File: `src/utils/formatters.js`

**3b. Line 72 — `formatDate()` uses browser timezone**
```js
// BEFORE:
return dateObj.toLocaleDateString('pt-BR', defaultOptions);

// AFTER:
return dateObj.toLocaleDateString('pt-BR', { ...defaultOptions, timeZone: 'America/Sao_Paulo' });
```

---

## Tier 4: Frontend analytics date ranges (MEDIUM)

These use `toISOString().split('T')[0]` but DON'T have `.brazil`. Use `toBrazilDateString()` from `dateUtils.js` (line 423).

### File: `src/utils/supabaseLoader.js`
**4a. Lines 326-327** — `toBrazilDateString(startDate)` / `toBrazilDateString(endDate)`

### File: `src/utils/recommendationEngine.js`
**4b. Line 293** — `toBrazilDateString()`

### File: `src/components/campaigns/WhatsAppAnalytics.jsx`
**4c. Lines 238, 243, 246, 744, 755, 787** — Replace all `toISOString().split('T')[0]` with `toBrazilDateString()`

### File: `src/utils/apiService.js`
**4d. Line 855** — `toBrazilDateString()`

### File: `src/utils/blacklistService.js`
**4e. Line 167** — `toBrazilDateString()`

### File: `src/utils/twilioSyncService.js`
**4f. Lines 45, 102** — `toBrazilDateString()`

### File: `src/components/ui/DataQualityPanel.jsx`
**4g. Lines 501, 599** — `toBrazilDateString()`

### File: `src/components/campaigns/TemplatePerformance.jsx`
**4h. Line 420** — `toBrazilDateString()`

### File: `src/components/social/InstagramGrowthAnalytics.jsx`
**4i. Line 387** — `toBrazilDateString()`

---

## Tier 5: SQL — Verify `is_customer_contactable()` (LOW)

- Uses `CURRENT_DATE` which may return UTC date on Supabase
- Query: `SELECT prosrc FROM pg_proc WHERE proname = 'is_customer_contactable';`
- If it uses `CURRENT_DATE` for day comparison, change to `(NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE`

---

## NOT changing (confirmed safe)

- **Line 252** (`scheduled_campaigns`): Compares TIMESTAMPTZ in UTC — correct
- **Lines 2561-2568, 2603-2610** (cooldown fallback): TIMESTAMPTZ comparison — 3h is negligible vs 14-day cooldowns
- **Lines 772, 977** (Twilio/blacklist sync): 7-day window, off by 1 day at boundary — negligible for sync
- **`ExportModal.jsx:376`**, **`BlacklistManager.jsx:610`**: File naming — cosmetic
- **`weatherService.js:30`**: Already uses `getBrazilDateParts()`-derived dates

---

## Verification

1. **Build check**: `npm run build` — no import errors
2. **Grep audit**: `grep -r "toISOString().split" src/` — should only remain in cosmetic files (ExportModal, BlacklistManager)
3. **SQL**: `SELECT COUNT(*) FROM contact_tracking WHERE status='returned' AND returned_at < contacted_at;` — should be 0
4. **Manual**: Open app, check dashboard daily chart for late-night transactions showing on correct date
5. **Backend**: Trigger scheduler, check anniversary/post_visit logs for correct Brazil dates

---

## Files Modified (summary)

| File | Changes | Approach | Tier |
|------|---------|----------|------|
| `src/utils/calculations.js` | 3 fixes + helper | Use `.brazil` property | 1 |
| `netlify/functions/campaign-scheduler.js` | 6 fixes | Use `getBrazilNow()`/`getLocalDate()` | 2 |
| `src/components/campaigns/messageFlowUtils.js` | 2 fixes | Use `Intl.DateTimeFormat` | 3 |
| `src/utils/formatters.js` | 1 fix | Add `timeZone` option | 3 |
| `src/utils/supabaseLoader.js` | 1 fix | Use `toBrazilDateString()` | 4 |
| `src/utils/recommendationEngine.js` | 1 fix | Use `toBrazilDateString()` | 4 |
| `src/components/campaigns/WhatsAppAnalytics.jsx` | 6 fixes | Use `toBrazilDateString()` | 4 |
| `src/utils/apiService.js` | 1 fix | Use `toBrazilDateString()` | 4 |
| `src/utils/blacklistService.js` | 1 fix | Use `toBrazilDateString()` | 4 |
| `src/utils/twilioSyncService.js` | 2 fixes | Use `toBrazilDateString()` | 4 |
| `src/components/ui/DataQualityPanel.jsx` | 2 fixes | Use `toBrazilDateString()` | 4 |
| `src/components/campaigns/TemplatePerformance.jsx` | 1 fix | Use `toBrazilDateString()` | 4 |
| `src/components/social/InstagramGrowthAnalytics.jsx` | 1 fix | Use `toBrazilDateString()` | 4 |
| SQL: `is_customer_contactable()` | Verify + fix | `AT TIME ZONE` | 5 |
