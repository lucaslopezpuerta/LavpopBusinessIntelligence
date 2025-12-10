# Deprecated Scripts

These scripts were used in the original CSV-based data pipeline but are no longer needed after the Supabase migration (December 2025).

## Files

### `fetch-sheets.cjs`
- **Purpose**: Fetched data from Google Sheets (sales, customer, blacklist, twilio, weather, campaigns)
- **Replaced by**: Manual CSV uploads via web app "Importar" tab → Supabase

### `process-rfm.cjs`
- **Purpose**: Calculated RFM segmentation from sales.csv and customer.csv
- **Replaced by**: `refresh_customer_metrics()` PostgreSQL function in Supabase

## New Data Flow

```
POS System → Manual Export → Web App Upload → Supabase → React App
                                                 ↓
                                         refresh_customer_metrics()
                                                 ↓
                                         Computed fields (risk_level, etc.)
```

## If You Need to Restore

These scripts can be moved back to `.github/scripts/` if needed, but the GitHub Actions workflow (`fetch-data.yml`) has been disabled and modified.

To restore the original pipeline:
1. Move scripts back to `.github/scripts/`
2. Uncomment the cron schedule in `.github/workflows/fetch-data.yml`
3. Restore the original workflow steps
4. Update `App.jsx` to use `csvLoader` instead of `supabaseLoader`
