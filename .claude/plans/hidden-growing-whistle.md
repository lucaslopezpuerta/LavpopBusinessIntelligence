# Fix AutomationPerformance.jsx Zero Metrics

## Context

`AutomationPerformance.jsx` shows 502 sends but 0% delivery, 0% return, and R$0 revenue. The data **does exist** in the database — the component simply has broken join logic. Verified via Supabase MCP:

- **Delivery data exists**: `contact_tracking.delivery_status` has 386 "read" + 259 "delivered" (~84% rate)
- **Return data exists**: 146 customers returned, generating R$2,241.63 in recovered revenue
- **The component reads from the wrong columns/uses wrong keys**

## Root Causes (3 bugs)

### Bug 1: Delivery rate reads from `automation_sends.status` (always 'sent')
- All 726 `automation_sends` records have `status = 'sent'` — webhooks never update this table
- Webhooks update `contact_tracking.delivery_status` instead (which has real data)
- **Component line 590**: filters for `status === 'delivered' || 'read'` → finds 0

### Bug 2: Campaign ID mismatch (missing `AUTO_` prefix)
- `contact_tracking.campaign_id` = `'AUTO_winback_30'`, `'AUTO_post_visit'`, etc.
- `automation_rules.id` = `'winback_30'`, `'post_visit'`, etc.
- **Component line 599**: `contactsByCampaign[rule.id]` looks for `'winback_30'` but DB has `'AUTO_winback_30'`

### Bug 3: `trigger_type` vs `campaign_type` value mismatch
- `automation_rules.trigger_type`: `days_since_visit`, `first_purchase`, `hours_after_visit`, `wallet_balance`
- `contact_tracking.campaign_type`: `winback`, `welcome`, `post_visit`, `wallet`
- **Component line 598**: `contactsByType[rule.trigger_type]` → always empty

## Fix Plan

### File: `src/components/campaigns/AutomationPerformance.jsx`

#### Step 1: Fix the contact_tracking join key (Bug 2 + Bug 3)

In `processedRules` useMemo (~line 577), change the `contactsByCampaign` indexing to use the `AUTO_` prefix:

```javascript
// Index contacts by campaign_id — campaign_id in contact_tracking uses 'AUTO_' prefix
const contactsByCampaign = {};
for (const contact of contacts) {
  const cid = contact.campaign_id;
  if (!cid) continue;
  if (!contactsByCampaign[cid]) contactsByCampaign[cid] = [];
  contactsByCampaign[cid].push(contact);
}
```

Then in the per-rule mapping (~line 597), replace both strategies with the correct `AUTO_` prefixed lookup:

```javascript
// Match contacts via campaign_id = 'AUTO_' + rule.id
const matchedContacts = contactsByCampaign['AUTO_' + rule.ruleId] || contactsByCampaign['AUTO_' + rule.id] || [];
```

Remove the broken `contactsByType` strategy entirely (it was matching on incompatible value domains).

#### Step 2: Fix delivery rate to use contact_tracking (Bug 1)

Instead of reading delivery status from `automation_sends.status` (never updated), derive it from `contact_tracking.delivery_status` (updated by Twilio webhooks).

In the per-rule mapping, replace the delivery calculation:

```javascript
// Delivery stats from contact_tracking (webhooks update this, not automation_sends)
const delivered = contactList.filter(
  (c) => c.delivery_status === 'delivered' || c.delivery_status === 'read'
).length;
const failed = contactList.filter(
  (c) => c.delivery_status === 'failed' || c.delivery_status === 'undelivered'
).length;
const deliveryRate = contactList.length > 0 ? (delivered / contactList.length) * 100 : 0;
```

#### Step 3: Add `delivery_status` to the contact_tracking query

Update the Supabase query (~line 526) to include `delivery_status`:

```javascript
client
  .from('contact_tracking')
  .select('campaign_id, customer_id, returned_at, return_revenue, campaign_type, delivery_status')
  .not('campaign_type', 'is', null)
  .gte('created_at', cutoff)
```

#### Step 4: Clean up unused code

- Remove the `contactsByType` map construction (lines 568-574) since we no longer match by `campaign_type` ↔ `trigger_type`
- Remove the `sends`-based delivery/failed counting (the `_sends` field can stay for the timeline chart)
- `totalSends` should still come from `automation_sends` (for the timeline chart), but delivery metrics now come from `contact_tracking`

## Expected Results After Fix

Based on actual DB data:

| Rule | Sends | Delivery | Return | Revenue |
|------|-------|----------|--------|---------|
| Win-back 30 dias | 502 | ~84% | 11.6% (61/525) | R$888.88 |
| Pos-Visita | 104 | ~84% | 45.2% (47/104) | R$697.00 |
| Boas-vindas | 73 | ~84% | 41.1% (30/73) | R$639.19 |
| Lembrete de Saldo | 47 | ~84% | 17.0% (8/47) | R$16.56 |

## Verification

1. Run `npm run dev` and navigate to Campaigns → AutomationPerformance section
2. Confirm delivery rates show ~84% instead of 0%
3. Confirm return rates show non-zero values matching the table above
4. Confirm revenue shows ~R$2,242 total instead of R$0
5. Confirm the "Melhor Automacao" highlight card appears (Pos-Visita likely best by return rate)
6. Confirm the timeline chart still works correctly (it uses `automation_sends` data which is unaffected)
