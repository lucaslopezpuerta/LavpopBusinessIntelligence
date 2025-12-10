# Computed Fields Documentation

This document explains the computed fields in the Supabase database schema and how to update them when the frontend utility code changes.

## Overview

The database stores **computed fields** alongside raw POS data. These fields are calculated during import to:
1. Enable efficient SQL queries and aggregations
2. Support database-level views and reports
3. Provide consistency with frontend calculations

**Important:** The frontend currently uses its own utility functions (`transactionParser.js`, `customerMetrics.js`) to calculate values. The database computed fields are **redundant backups** that can be used for:
- Direct SQL queries
- Database views
- Future API endpoints
- Data validation

---

## Transaction Computed Fields

### Location in Schema
```sql
-- supabase/schema.sql - transactions table
transaction_type TEXT,      -- 'TYPE_1', 'TYPE_2', 'TYPE_3', 'UNKNOWN'
is_recarga BOOLEAN,         -- true if machine string contains 'recarga'
wash_count INTEGER,         -- count of 'lavadora' in machine string
dry_count INTEGER,          -- count of 'secadora' in machine string
total_services INTEGER,     -- wash_count + dry_count
net_value DECIMAL(10,2),    -- valor_pago minus cashback
cashback_amount DECIMAL(10,2)  -- 7.5% of valor_venda (after June 1, 2024)
```

### Calculation Logic

#### transaction_type
**Frontend source:** `src/utils/transactionParser.js:classifyTransaction()`

```javascript
// TYPE_3: Recarga (credit purchase)
if (machineStr.includes('recarga')) return 'TYPE_3';

// TYPE_2: Machine purchase with credit (R$0)
if (paymentMethod.includes('saldo da carteira') ||
    (grossValue === 0 && machineStr && !machineStr.includes('recarga'))) {
  return 'TYPE_2';
}

// TYPE_1: Machine purchase with card/pix
if (machineStr && !machineStr.includes('recarga') && grossValue > 0) {
  return 'TYPE_1';
}

return 'UNKNOWN';
```

**To update in database:**
```sql
UPDATE transactions SET transaction_type =
  CASE
    WHEN LOWER(maquinas) LIKE '%recarga%' THEN 'TYPE_3'
    WHEN LOWER(meio_de_pagamento) LIKE '%saldo da carteira%'
         OR (valor_venda = 0 AND maquinas IS NOT NULL AND LOWER(maquinas) NOT LIKE '%recarga%')
         THEN 'TYPE_2'
    WHEN maquinas IS NOT NULL AND LOWER(maquinas) NOT LIKE '%recarga%' AND valor_venda > 0
         THEN 'TYPE_1'
    ELSE 'UNKNOWN'
  END;
```

#### is_recarga
**Frontend source:** `src/utils/transactionParser.js:parseSalesRecords()`

```javascript
const isRecarga = machineStr.toLowerCase().includes('recarga');
```

**To update in database:**
```sql
UPDATE transactions SET is_recarga = (LOWER(maquinas) LIKE '%recarga%');
```

#### wash_count, dry_count, total_services
**Frontend source:** `src/utils/transactionParser.js:countMachines()`

```javascript
machines.forEach(m => {
  if (m.includes('lavadora')) wash++;
  else if (m.includes('secadora')) dry++;
});
return { wash, dry, total: wash + dry };
```

**To update in database:**
```sql
-- Using a helper function (already in schema)
CREATE OR REPLACE FUNCTION count_machines(p_machine_str TEXT)
RETURNS TABLE(wash_count INT, dry_count INT, total_services INT)
AS $$
DECLARE
  machines TEXT[];
  m TEXT;
  wash INT := 0;
  dry INT := 0;
BEGIN
  IF p_machine_str IS NULL OR p_machine_str = '' THEN
    RETURN QUERY SELECT 0, 0, 0;
    RETURN;
  END IF;

  machines := string_to_array(LOWER(p_machine_str), ',');
  FOREACH m IN ARRAY machines LOOP
    IF m LIKE '%lavadora%' THEN wash := wash + 1;
    ELSIF m LIKE '%secadora%' THEN dry := dry + 1;
    END IF;
  END LOOP;

  RETURN QUERY SELECT wash, dry, wash + dry;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update all transactions
UPDATE transactions t SET
  wash_count = mc.wash_count,
  dry_count = mc.dry_count,
  total_services = mc.total_services
FROM count_machines(t.maquinas) mc;
```

#### net_value, cashback_amount
**Frontend source:** `src/utils/transactionParser.js:parseSalesRecords()`

```javascript
const CASHBACK_RATE = 0.075; // 7.5%
const CASHBACK_START_DATE = new Date(2024, 5, 1); // June 1, 2024

if (date >= CASHBACK_START_DATE && grossValue > 0) {
  cashbackAmount = grossValue * CASHBACK_RATE;
  netValue = netValue - cashbackAmount;
}
```

**To update in database:**
```sql
UPDATE transactions SET
  cashback_amount = CASE
    WHEN data_hora >= '2024-06-01' AND valor_venda > 0
    THEN ROUND(valor_venda * 0.075, 2)
    ELSE 0
  END,
  net_value = valor_pago - CASE
    WHEN data_hora >= '2024-06-01' AND valor_venda > 0
    THEN ROUND(valor_venda * 0.075, 2)
    ELSE 0
  END;
```

---

## Customer Computed Fields

### Location in Schema
```sql
-- supabase/schema.sql - customers table
first_visit DATE,
last_visit DATE,
transaction_count INTEGER,
total_spent DECIMAL(10,2),
total_services INTEGER,
avg_days_between DECIMAL(5,1),
days_since_last_visit INTEGER,
risk_level TEXT,           -- 'Healthy', 'Monitor', 'At Risk', 'Churning', 'Lost', 'New Customer'
rfm_segment TEXT           -- 'New', 'Champion', 'Loyal', 'Potential', 'AtRisk', 'Lost'
```

### Calculation Logic

#### risk_level
**Frontend source:** `src/utils/customerMetrics.js:classifyCustomerRisk()`

```javascript
export function classifyCustomerRisk(daysSinceVisit, registrationDate = null) {
  const isNew = registrationDate &&
    (new Date() - new Date(registrationDate)) / (1000 * 60 * 60 * 24) <= 30;

  if (isNew) return 'New Customer';
  if (daysSinceVisit <= 14) return 'Healthy';
  if (daysSinceVisit <= 30) return 'Monitor';
  if (daysSinceVisit <= 45) return 'At Risk';
  if (daysSinceVisit <= 90) return 'Churning';
  return 'Lost';
}
```

**Database function (already in schema):**
```sql
CREATE OR REPLACE FUNCTION classify_customer_risk(
  p_days_since_visit INTEGER,
  p_first_visit DATE
) RETURNS TEXT AS $$
DECLARE
  days_since_registration INTEGER;
BEGIN
  IF p_first_visit IS NOT NULL THEN
    days_since_registration := CURRENT_DATE - p_first_visit;
    IF days_since_registration <= 30 THEN
      RETURN 'New Customer';
    END IF;
  END IF;

  IF p_days_since_visit IS NULL THEN RETURN 'Lost'; END IF;
  IF p_days_since_visit <= 14 THEN RETURN 'Healthy'; END IF;
  IF p_days_since_visit <= 30 THEN RETURN 'Monitor'; END IF;
  IF p_days_since_visit <= 45 THEN RETURN 'At Risk'; END IF;
  IF p_days_since_visit <= 90 THEN RETURN 'Churning'; END IF;
  RETURN 'Lost';
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

**To update all customers:**
```sql
UPDATE customers SET
  days_since_last_visit = CURRENT_DATE - last_visit,
  risk_level = classify_customer_risk(
    CURRENT_DATE - last_visit,
    first_visit
  );
```

#### rfm_segment
**Frontend source:** `.github/scripts/process-rfm.cjs:calculateRFM()`

```javascript
// Recency Score
const rScore = recencyDays <= 21 ? 5 : recencyDays <= 45 ? 4 :
               recencyDays <= 90 ? 3 : recencyDays <= 180 ? 2 : 1;

// Frequency Score
const fScore = frequency >= 10 ? 5 : frequency >= 6 ? 4 :
               frequency >= 3 ? 3 : frequency === 2 ? 2 : 1;

// Monetary Score (last 90 days)
const mScore = recentMonetary >= 250 ? 5 : recentMonetary >= 150 ? 4 :
               recentMonetary >= 75 ? 3 : recentMonetary >= 36 ? 2 : 1;

// Segment
if (registrationDays <= 30 && frequency <= 2) return 'New';
if (rScore === 5 && fScore >= 4 && mScore >= 4) return 'Champion';
if (rScore >= 4 && fScore >= 3 && mScore >= 3) return 'Loyal';
if (rScore >= 3 && fScore >= 2 && mScore >= 2) return 'Potential';
if (rScore === 2 && (fScore === 2 || mScore === 2)) return 'AtRisk';
return 'Lost';
```

**To update in database (complex, requires aggregation):**
```sql
-- Run this function to refresh all customer RFM segments
SELECT refresh_customer_metrics();
```

---

## How to Add New Computed Fields

### Step 1: Add column to schema
```sql
ALTER TABLE transactions ADD COLUMN new_field_name TYPE;
-- or
ALTER TABLE customers ADD COLUMN new_field_name TYPE;
```

### Step 2: Create update function (if complex)
```sql
CREATE OR REPLACE FUNCTION calculate_new_field(params...)
RETURNS TYPE AS $$
BEGIN
  -- Your calculation logic
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### Step 3: Update migration script
Edit `scripts/migrate-csv-to-supabase.cjs` to include the new field calculation.

### Step 4: Update schema.sql
Add the new column and any triggers to `supabase/schema.sql`.

### Step 5: Backfill existing data
```sql
UPDATE table_name SET new_field = calculate_new_field(...);
```

---

## Keeping Frontend and Database in Sync

When you modify calculation logic in the frontend utilities:

1. **Update this document** with the new logic
2. **Run the appropriate SQL** to update existing records
3. **Update migration script** for future imports
4. **Test** by comparing frontend calculations with database values

### Verification Query
```sql
-- Compare transaction counts by type
SELECT transaction_type, COUNT(*), SUM(net_value)
FROM transactions
GROUP BY transaction_type
ORDER BY transaction_type;

-- Compare customer risk distribution
SELECT risk_level, COUNT(*)
FROM customers
GROUP BY risk_level
ORDER BY risk_level;
```

---

## Scheduled Refresh (Future Enhancement)

Consider creating a daily cron job or Supabase Edge Function to refresh computed fields:

```sql
-- Refresh all customer metrics daily
SELECT refresh_customer_metrics();

-- Update days_since_last_visit (changes daily)
UPDATE customers SET
  days_since_last_visit = CURRENT_DATE - last_visit,
  risk_level = classify_customer_risk(CURRENT_DATE - last_visit, first_visit);
```

This ensures database values stay current even if the frontend isn't accessed.
