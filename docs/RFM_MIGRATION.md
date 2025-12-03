# RFM Processing Migration: Make.com → GitHub Actions

## Overview

This document describes the migration of RFM (Recency, Frequency, Monetary) segmentation processing from Make.com scenarios to GitHub Actions.

**Migration Date:** December 2025
**Status:** Complete

---

## Architecture Changes

### Before (Make.com)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  POS System │────▶│ Google Drive │────▶│    Make.com     │
│             │     │ customer.csv │     │  computeRFM.js  │
│             │     │  sales.csv   │     │ mergeRFMMaster  │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                   │
                                                   ▼
                                         ┌─────────────────┐
                                         │ Google Drive    │
                                         │ rfm.csv (master)│
                                         └────────┬────────┘
                                                   │
                                                   ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  React App  │◀────│ GitHub Pages │◀────│ GitHub Actions  │
│ csvLoader   │     │  /data/*.csv │     │ fetch-data.yml  │
└─────────────┘     └──────────────┘     └─────────────────┘
```

**Issues with this approach:**
- Make.com dependency (external platform)
- Additional cost for Make.com scenarios
- Multiple platforms to maintain (Make.com, Google Drive, GitHub)
- RFM scripts used Make.com-specific syntax (`input.*`)

### After (GitHub Actions)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────────────┐
│  POS System │────▶│ Google Drive │────▶│     GitHub Actions      │
│             │     │ customer.csv │     │ 1. fetch-sheets.cjs     │
│             │     │  sales.csv   │     │ 2. process-rfm.cjs      │
└─────────────┘     └──────────────┘     └───────────┬─────────────┘
                                                      │
                                                      ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  React App  │◀────│ GitHub Pages │◀────│   Git Commit    │
│ csvLoader   │     │  /data/*.csv │     │   rfm.csv       │
└─────────────┘     └──────────────┘     └─────────────────┘
```

**Benefits:**
- No external platform dependency
- Zero additional cost (GitHub Actions free tier)
- Single platform (everything in GitHub)
- Version-controlled RFM data
- Full audit trail via git history

---

## Files Changed

### New Files

| File | Purpose |
|------|---------|
| `.github/scripts/process-rfm.cjs` | Consolidated RFM calculation script |
| `docs/RFM_MIGRATION.md` | This documentation |

### Modified Files

| File | Changes |
|------|---------|
| `.github/workflows/fetch-data.yml` | Added "Process RFM Segmentation" step |
| `.github/scripts/fetch-sheets.cjs` | Removed rfm.csv from FILES_CONFIG |

### Deprecated Files (Keep for Reference)

| File | Status |
|------|--------|
| `src/utils/computeRFM.js` | Keep as reference, no longer used in production |
| `src/utils/mergeRFMMaster.js` | Keep as reference, no longer used in production |

---

## RFM Algorithm

### Scoring Thresholds (Laundromat-Optimized)

**Recency Score (R)** - Days since last purchase:
| Score | Days |
|-------|------|
| 5 | ≤21 days |
| 4 | ≤45 days |
| 3 | ≤90 days |
| 2 | ≤180 days |
| 1 | >180 days |

**Frequency Score (F)** - Number of transactions:
| Score | Transactions |
|-------|--------------|
| 5 | ≥10 |
| 4 | ≥6 |
| 3 | ≥3 |
| 2 | 2 |
| 1 | 1 |

**Monetary Score (M)** - Recent 90-day spending (BRL):
| Score | Amount |
|-------|--------|
| 5 | ≥250 |
| 4 | ≥150 |
| 3 | ≥75 |
| 2 | ≥36 |
| 1 | <36 |

### Segment Assignment

| Segment | Criteria |
|---------|----------|
| **New** | Registered ≤30 days AND ≤2 transactions |
| **Champion** | R=5, F≥4, M≥4 |
| **Loyal** | R≥4, F≥3, M≥3 |
| **Potential** | R≥3, F≥2, M≥2 |
| **AtRisk** | R=2 AND (F=2 OR M=2) |
| **Lost** | All others |

---

## Make.com Deprecation Steps

### Phase 1: Parallel Running (Recommended)

1. **Keep Make.com scenarios active** for 1-2 weeks
2. **Monitor GitHub Actions** workflow runs
3. **Compare outputs** to ensure consistency

### Phase 2: Disable Make.com

Once confident the new system works correctly:

1. **Disable** (don't delete) the Make.com scenarios:
   - `computeRFM` scenario
   - `mergeRFMMaster` scenario

2. **Keep scenarios archived** for 30 days as rollback option

### Phase 3: Cleanup

After 30 days of successful operation:

1. **Delete Make.com scenarios** (optional)
2. **Remove RFM_FILE_ID secret** from GitHub repository
3. **Delete rfm.csv from Google Drive** (optional, keep as backup)

---

## Monitoring & Troubleshooting

### GitHub Actions Logs

Check workflow runs at:
```
https://github.com/YOUR_REPO/actions/workflows/fetch-data.yml
```

### Expected Output

Successful run should show:
```
🔄 Starting RFM Processing...
📅 Processing date: YYYY-MM-DD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Loaded sales.csv
✅ Loaded customer.csv
✅ Loaded existing rfm.csv
📊 Sales rows: XXXX
📊 Customer rows: XXXX
📊 Existing RFM rows: XXXX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 Unique customers with sales: XXXX
✅ Calculated RFM for XXXX customers
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💾 Saved rfm.csv (XXXX rows)

📊 Segment Distribution:
   New          XX (X.X%)
   Champion     XX (X.X%)
   Loyal        XX (X.X%)
   Potential    XX (X.X%)
   AtRisk       XX (X.X%)
   Lost       XXXX (XX.X%)

🎉 RFM Processing complete!
```

### Common Issues

**Issue:** RFM file not updated
- Check that `sales.csv` and `customer.csv` were fetched successfully
- Verify `GOOGLE_CREDENTIALS` secret is valid

**Issue:** Wrong segment counts
- Compare with Make.com output during parallel running phase
- Check date parsing (Brazilian format DD/MM/YYYY)

**Issue:** lastContactDate lost
- Ensure existing `rfm.csv` was loaded
- Check file exists in `data/` folder

---

## Rollback Procedure

If issues arise, rollback by:

1. **Re-enable Make.com scenarios**

2. **Update fetch-sheets.cjs** - uncomment rfm.csv:
```javascript
{
  type: 'csv',
  fileId: process.env.RFM_FILE_ID || 'YOUR_RFM_FILE_ID',
  outputFile: 'rfm.csv'
},
```

3. **Update fetch-data.yml** - remove or comment the RFM processing step:
```yaml
# - name: Process RFM Segmentation
#   run: node .github/scripts/process-rfm.cjs
```

4. **Re-add RFM_FILE_ID** to workflow env vars

---

## Local Testing

To test the RFM processing locally:

```bash
cd /path/to/LavpopBusinessIntelligence
node .github/scripts/process-rfm.cjs
```

Requires `data/sales.csv`, `data/customer.csv`, and optionally `data/rfm.csv` to exist.

---

## Contact

For questions or issues, create a GitHub issue in the repository.
