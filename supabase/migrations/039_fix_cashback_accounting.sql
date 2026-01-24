-- Migration 039: Fix Cashback Accounting
-- =========================================
-- Problem: Cashback was incorrectly deducted from net_value at point of sale,
-- causing double-penalization when customers later use wallet credit (TYPE_2).
--
-- Solution: Recalculate net_value by adding back the cashback_amount that was
-- incorrectly deducted. Cashback should be tracked as a LIABILITY, not an expense.
--
-- After this migration:
-- - net_value = Valor_Pago (gross minus coupon discounts only)
-- - cashback_amount = 7.5% of gross (tracked separately as liability)
--
-- Date: 2026-01-24

-- Step 1: Create backup table for rollback safety
CREATE TABLE IF NOT EXISTS transactions_net_value_backup AS
SELECT id, net_value, cashback_amount, data_hora
FROM transactions
WHERE cashback_amount > 0;

-- Step 2: Recalculate net_value by adding back the incorrectly deducted cashback
-- Only affects transactions since cashback program started (June 1, 2024)
UPDATE transactions
SET net_value = net_value + cashback_amount
WHERE cashback_amount > 0
  AND data_hora >= '2024-06-01';

-- Step 3: Update column comment for clarity
COMMENT ON COLUMN transactions.net_value IS 'Amount after coupon discounts only (cashback tracked separately as liability)';
COMMENT ON COLUMN transactions.cashback_amount IS '7.5% cashback earned by customer (liability until redeemed)';

-- Step 4: Verification query (run manually to verify)
-- Expected: Sum of (net_value) should now be higher by the sum of cashback_amount
-- The ratio net_value/gross_value should be close to 1.0 (only coupon discounts)
/*
SELECT
  COUNT(*) as affected_transactions,
  SUM(cashback_amount) as total_cashback_restored,
  SUM(net_value) as new_net_total,
  SUM(valor_venda) as gross_total,
  ROUND(SUM(net_value) / NULLIF(SUM(valor_venda), 0) * 100, 2) as net_to_gross_ratio
FROM transactions
WHERE cashback_amount > 0
  AND data_hora >= '2024-06-01';
*/

-- Step 5: Rollback query (if needed)
-- To rollback this migration:
/*
UPDATE transactions t
SET net_value = b.net_value
FROM transactions_net_value_backup b
WHERE t.id = b.id;

DROP TABLE transactions_net_value_backup;
*/
