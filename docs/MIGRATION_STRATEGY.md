# Seamless Migration Strategy: CSV to Supabase

This document outlines how to migrate from the current CSV-based data flow to Supabase without breaking the application.

## Current Data Flow

```
POS System → Google Drive → Apps Script → Make.com → GitHub Actions → Web App
                                              ↓
                                     fetch-sheets.cjs
                                              ↓
                                     process-rfm.cjs
                                              ↓
                                     CSV files in repo
                                              ↓
                                     public/data/*.csv
                                              ↓
                                     csvLoader.js
                                              ↓
                                     React App
```

**Files involved:**
- `.github/workflows/fetch-data.yml` - Daily cron job at 1 AM UTC
- `.github/scripts/fetch-sheets.cjs` - Fetches from Google Drive
- `.github/scripts/process-rfm.cjs` - Calculates RFM segmentation
- `src/utils/csvLoader.js` - Loads CSV for web app
- `data/*.csv` - Raw data files

---

## Target Data Flow

```
POS System → Manual Export → Web App Upload → Supabase → React App
                                                 ↓
                                         Database triggers
                                                 ↓
                                         Computed fields
```

**Advantages:**
- No dependency on Google Drive, Apps Script, or Make.com
- Real-time data updates (no 24-hour delay)
- Better data integrity with deduplication
- Campaign attribution via coupon codes
- Direct SQL queries for analytics

---

## Migration Phases

### Phase 1: Historical Migration (NOW)

**Goal:** Load 8 months of existing CSV data into Supabase

**Steps:**
1. Ensure Supabase schema is deployed:
   ```bash
   # In Supabase dashboard, run supabase/schema.sql
   ```

2. Run historical migration:
   ```bash
   cd c:\Projects\LavpopBusinessIntelligence
   node scripts/migrate-csv-to-supabase.cjs
   ```

3. Verify data:
   ```sql
   SELECT COUNT(*) FROM transactions;  -- Should match sales.csv rows
   SELECT COUNT(*) FROM customers;     -- Should match customer.csv rows
   ```

**Impact:** None. GitHub Actions continues running. Web app still uses CSV.

---

### Phase 2: Parallel Sync (OPTIONAL)

**Goal:** Keep Supabase synchronized with daily CSV updates

**Option A: Modify GitHub Actions**

Add to `.github/workflows/fetch-data.yml`:
```yaml
- name: Sync to Supabase
  env:
    SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
    SUPABASE_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
  run: node scripts/sync-csv-to-supabase.cjs
```

**Option B: Skip this phase**

If you're ready to switch to manual uploads, skip to Phase 3.

---

### Phase 3: Add Manual Upload UI

**Goal:** Allow direct CSV upload through the web app

**Implementation:**
1. Create upload component with auto-detect (sales vs customer)
2. Parse CSV client-side using same logic as migration script
3. Upsert to Supabase via API
4. Provide upload status and error reporting

**Files to create:**
- `src/components/DataUpload.jsx` - Upload UI component
- `src/utils/supabaseUploader.js` - Upload logic

**Sample flow:**
```javascript
// 1. User selects file
// 2. Auto-detect: check headers
//    - "Data_Hora,Valor_Venda,..." → Sales file
//    - "Nome;Documento;..." → Customer file
// 3. Parse with appropriate logic
// 4. Upsert to Supabase
// 5. Show results (inserted, updated, errors)
```

---

### Phase 4: Switch Data Source

**Goal:** Web app reads from Supabase instead of CSV

**Option A: Gradual switch with fallback**

Modify `src/utils/csvLoader.js`:
```javascript
import { supabase } from './supabaseClient';

export async function loadSalesData() {
  // Try Supabase first
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('data_hora', { ascending: false });

  if (!error && data.length > 0) {
    return transformSupabaseToCSVFormat(data);
  }

  // Fallback to CSV
  console.warn('Supabase unavailable, falling back to CSV');
  return loadFromCSV('/data/sales.csv');
}
```

**Option B: Clean switch**

Replace `csvLoader.js` with `supabaseLoader.js`:
```javascript
export async function loadSalesData() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*');

  if (error) throw new Error(`Failed to load sales: ${error.message}`);
  return data;
}
```

Update `App.jsx` to use new loader.

---

### Phase 5: Retire GitHub Actions

**Goal:** Remove automated CSV sync, use only manual uploads

**Steps:**
1. Disable `fetch-data.yml` workflow:
   ```yaml
   # Rename or add:
   # on:
   #   workflow_dispatch: # Manual only
   ```

2. Remove Google Drive dependency from settings

3. Archive CSV files (optional):
   ```bash
   git mv data/ archive/csv-backup/
   ```

4. Update documentation

---

## Data Format Compatibility

The Supabase tables store data in a format compatible with existing frontend utilities.

**Transaction fields mapping:**
| CSV Column | Supabase Column | Notes |
|------------|-----------------|-------|
| Data_Hora | data_hora | TIMESTAMPTZ |
| Valor_Venda | valor_venda | DECIMAL |
| Valor_Pago | valor_pago | DECIMAL |
| Meio_de_Pagamento | meio_de_pagamento | TEXT |
| Doc_Cliente | doc_cliente | TEXT (normalized CPF) |
| Maquinas | maquinas | TEXT |
| Usou_Cupom | usou_cupom | BOOLEAN |
| Codigo_Cupom | codigo_cupom | TEXT |

**Customer fields mapping:**
| CSV Column | Supabase Column | Notes |
|------------|-----------------|-------|
| Nome | nome | TEXT |
| Documento | doc | TEXT (PK, normalized) |
| Telefone | telefone | TEXT |
| Email | email | TEXT |
| Data_Cadastro | data_cadastro | TIMESTAMPTZ |
| Saldo_Carteira | saldo_carteira | DECIMAL |

---

## What Stays the Same

During transition, these components remain unchanged:
- `src/utils/transactionParser.js` - Still parses data the same way
- `src/utils/customerMetrics.js` - Still calculates metrics
- `src/utils/businessMetrics.js` - Still aggregates for Dashboard
- `src/views/*.jsx` - All views work with same data structure

The only change is **where** the data comes from, not **how** it's processed.

---

## Rollback Plan

If issues occur after switching to Supabase:

1. **Immediate:** Re-enable GitHub Actions workflow
2. **Web app:** Revert csvLoader.js to CSV-only
3. **Data:** CSV files still in repo as backup

---

## Timeline Recommendation

1. **Day 1:** Run historical migration (Phase 1)
2. **Day 2-3:** Build upload UI (Phase 3)
3. **Day 4:** Test uploads with real daily exports
4. **Day 5-7:** Monitor both systems running in parallel
5. **Week 2:** Switch data source (Phase 4)
6. **Week 3:** Retire GitHub Actions (Phase 5)

---

## Verification Checklist

After migration, verify:

- [ ] Transaction count matches CSV
- [ ] Customer count matches CSV
- [ ] Dashboard metrics match
- [ ] Operations metrics match
- [ ] Customer tab shows correct risk levels
- [ ] Intelligence tab calculations work
- [ ] Campaign attribution works with coupon codes
- [ ] Upload UI accepts both file types
- [ ] Deduplication prevents duplicate imports
