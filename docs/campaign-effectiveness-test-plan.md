# Campaign Effectiveness System - Test Plan

## Overview

This test plan covers the campaign effectiveness tracking system that links WhatsApp campaigns to customer return outcomes.

**Scope**: Supabase backend integration, contact tracking, effectiveness metrics, A/B testing, Twilio WhatsApp integration, and UI components.

**Key Files**:
- `src/views/Campaigns.jsx` - Main campaigns view (v2.1.0)
- `src/components/campaigns/NewCampaignModal.jsx` - 4-step wizard (v4.2)
- `src/components/campaigns/CampaignList.jsx` - Campaign history (v2.2)
- `src/components/campaigns/CampaignDashboard.jsx` - Analytics KPIs (v1.0)
- `src/components/campaigns/BlacklistManager.jsx` - Opt-out management (v2.0)
- `src/config/messageTemplates.js` - 8 Meta-compliant templates (v2.0)
- `src/utils/blacklistService.js` - Blacklist CRUD with Twilio sync (v2.0)
- `supabase/schema.sql` - Database schema (v3.2)

---

## 1. Database Schema Tests

### 1.1 Run Schema in Supabase

**What to test**: Execute the consolidated `schema.sql` in Supabase SQL Editor.

**Steps**:
1. Open Supabase Dashboard > SQL Editor
2. Copy content from `supabase/schema.sql`
3. Execute the SQL

**Expected Results**:
- [ ] All tables created:
  - Core: `transactions`, `customers`, `coupon_redemptions`
  - Campaign: `blacklist`, `campaigns`, `campaign_sends`, `contact_tracking`, `campaign_contacts`, `scheduled_campaigns`, `comm_logs`, `automation_rules`
- [ ] All views created: `campaign_performance`, `campaign_effectiveness`, `contact_effectiveness_summary`, `coupon_effectiveness`, `customer_summary`, `daily_revenue`
- [ ] All functions created: `create_campaign`, `record_campaign_contact`, `update_campaign_stats`, `mark_customer_returned`, `expire_old_contacts`, `find_campaign_by_coupon`, `process_coupon_redemption`, `calculate_rfm_segment`, `refresh_customer_metrics`
- [ ] Triggers applied for `updated_at` columns
- [ ] No SQL errors

### 1.2 Verify Views

**Test the views return correct data**:

```sql
-- Should return empty or existing campaigns with metrics
SELECT * FROM campaign_performance LIMIT 5;

-- Should return campaign effectiveness grouped by campaign (includes A/B testing fields)
SELECT campaign_id, campaign_name, return_rate, discount_percent, coupon_code, net_return_value
FROM campaign_effectiveness LIMIT 5;

-- Should return contact summary (last 30 days)
SELECT * FROM contact_effectiveness_summary;

-- Should return coupon effectiveness for A/B analysis
SELECT * FROM coupon_effectiveness;
```

### 1.3 Verify A/B Testing Schema Fields

```sql
-- Verify campaigns table has A/B testing columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'campaigns'
AND column_name IN ('discount_percent', 'coupon_code', 'service_type');

-- Expected: 3 rows (discount_percent NUMERIC, coupon_code TEXT, service_type TEXT)
```

---

## 2. Campaign Creation Flow (NewCampaignModal)

### 2.1 Step 1: Audience Selection

**Steps**:
1. Open Campaigns tab
2. Click "Nova Campanha"
3. Test each audience filter combination

**Test Items**:
- [ ] Churn Risk Level filters work (Em Risco, Crítico, Novo, Saudável)
- [ ] RFM Segment filters work (VIP, Frequente, Promissor, Esfriando, Inativo)
- [ ] Combined filters show correct intersection
- [ ] Recipient count updates dynamically
- [ ] "Próximo" button disabled when 0 recipients

### 2.2 Step 2: Template Selection

**Test Items**:
- [ ] All 8 templates display correctly:
  - `winback_30days`, `winback_60days`, `winback_90days`
  - `welcome_new`
  - `wallet_reminder`, `wallet_low`
  - `promo_seasonal`
  - `upsell_dryer`
- [ ] Template preview shows actual message text
- [ ] Discount percentage selector (10%, 15%, 20%, 25%) appears
- [ ] Coupon code auto-populates based on template + discount (e.g., VOLTE20)
- [ ] Service type selector (lavagem, secagem, ambos) appears where relevant

### 2.3 Step 3: Preview & Personalization

**Test Items**:
- [ ] Message preview shows variables replaced: `{{1}}` → customer name, `{{2}}` → discount
- [ ] Recipient list shows all selected customers
- [ ] Phone numbers display in normalized format (+5554...)
- [ ] Blacklisted numbers are excluded (with warning count)
- [ ] Invalid phone numbers filtered out

### 2.4 Step 4: Send / Schedule

**Test Items**:
- [ ] "Enviar Agora" sends immediately
- [ ] "Agendar" opens date/time picker
- [ ] Scheduled campaigns appear with correct status
- [ ] Dry Run mode creates records without Twilio calls
- [ ] Success toast shows send count
- [ ] Error handling for Twilio failures

### 2.5 Verify Campaign Record in Database

```sql
-- Check campaign was created with A/B testing fields
SELECT id, name, audience, status, sends, contact_method,
       discount_percent, coupon_code, service_type
FROM campaigns
ORDER BY created_at DESC
LIMIT 1;
```

---

## 3. Contact Tracking Flow

### 3.1 Send Campaign with Tracking

**Scenario**: Send a campaign and verify contact tracking records are created.

**Steps**:
1. Create and send a campaign to 2-3 test customers
2. Check the database for contact_tracking entries

**Verification Query**:
```sql
-- Check contact_tracking records
SELECT ct.id, ct.customer_id, ct.customer_name, ct.campaign_id, ct.status, ct.expires_at
FROM contact_tracking ct
WHERE ct.campaign_id = 'YOUR_CAMPAIGN_ID'
ORDER BY ct.contacted_at DESC;

-- Check campaign_contacts links (includes Twilio SID)
SELECT cc.id, cc.customer_id, cc.phone, cc.delivery_status, cc.twilio_sid, ct.status as tracking_status
FROM campaign_contacts cc
LEFT JOIN contact_tracking ct ON cc.contact_tracking_id = ct.id
WHERE cc.campaign_id = 'YOUR_CAMPAIGN_ID';
```

**Expected Results**:
- [ ] `contact_tracking` record created for each recipient
- [ ] `campaign_contacts` record created and linked to tracking
- [ ] Status is 'pending', expires_at is 7 days from now
- [ ] `twilio_sid` populated for successful sends

### 3.2 View Campaign Details Modal

**Steps**:
1. Go to Campaign History
2. Click "Ver Detalhes dos Contatos" on a campaign
3. Review the contact list

**Expected Results**:
- [ ] Modal opens showing campaign metrics
- [ ] Contact list shows all recipients
- [ ] Each contact shows status (Pendente/Retornou/Expirado)
- [ ] Filter buttons work (Todos, Retornaram, Pendentes, Expirados)

---

## 4. Return Detection Flow

### 4.1 Simulate Customer Return

**Scenario**: A customer who was contacted returns to the laundry. Test that the system detects this.

**Manual Database Update** (simulating data sync detecting a return):
```sql
-- First, find a pending contact
SELECT id, customer_id, customer_name FROM contact_tracking WHERE status = 'pending' LIMIT 1;

-- Simulate that customer returned (replace ID and customer_id)
SELECT mark_customer_returned(
  'CUSTOMER_CPF_HERE',  -- customer_id
  NOW(),                -- return date
  75.50                 -- revenue from visit
);
```

**Verification**:
```sql
SELECT id, customer_id, status, returned_at, days_to_return, return_revenue
FROM contact_tracking
WHERE customer_id = 'CUSTOMER_CPF_HERE';
```

**Expected Results**:
- [ ] Status changed from 'pending' to 'returned'
- [ ] `returned_at` timestamp set
- [ ] `days_to_return` calculated correctly
- [ ] `return_revenue` recorded

### 4.2 Verify Campaign Performance Updates

After marking returns, check the campaign_performance view:

```sql
SELECT
  id, name, sends, contacts_tracked, contacts_returned,
  return_rate, total_revenue_recovered, avg_days_to_return
FROM campaign_performance
WHERE id = 'YOUR_CAMPAIGN_ID';
```

**Expected Results**:
- [ ] `contacts_returned` increased
- [ ] `return_rate` calculated correctly (returned/tracked * 100)
- [ ] `total_revenue_recovered` shows sum of return revenues

---

## 5. Expiration Flow

### 5.1 Test Contact Expiration

**Scenario**: After 7 days, pending contacts should be marked as expired.

**Manually test by backdating a contact**:
```sql
-- Backdate expires_at to simulate 7 days passed
UPDATE contact_tracking
SET expires_at = NOW() - INTERVAL '1 hour'
WHERE status = 'pending'
LIMIT 1;

-- Run expiration function
SELECT expire_old_contacts();

-- Verify status changed
SELECT id, status, expires_at FROM contact_tracking ORDER BY updated_at DESC LIMIT 5;
```

**Expected Results**:
- [ ] Function returns number of updated rows
- [ ] Backdated contact status changed to 'expired'

---

## 6. A/B Testing & Coupon Attribution

### 6.1 Test Coupon-Campaign Linkage

**Scenario**: When a customer uses a campaign coupon at POS, verify attribution works.

```sql
-- Create a campaign with specific coupon
INSERT INTO campaigns (id, name, audience, status, discount_percent, coupon_code, service_type, created_at)
VALUES ('CAMP_AB_TEST', 'A/B Test 20%', 'atRisk', 'active', 20.00, 'VOLTE20', 'both', NOW());

-- Verify find_campaign_by_coupon works
SELECT find_campaign_by_coupon('VOLTE20');
-- Expected: 'CAMP_AB_TEST'

-- Simulate coupon redemption
SELECT process_coupon_redemption(
  NULL,           -- transaction_id (NULL for test)
  'VOLTE20',      -- coupon code
  '12345678901',  -- customer CPF
  NOW(),          -- redemption time
  15.00           -- discount value
);

-- Verify coupon_redemptions record
SELECT * FROM coupon_redemptions WHERE codigo_cupom = 'VOLTE20';
```

### 6.2 Verify A/B Testing Analytics View

```sql
-- Check campaign_effectiveness includes A/B metrics
SELECT
  campaign_name,
  total_contacts,
  returned_count,
  return_rate,
  discount_percent,
  coupon_code,
  total_return_revenue,
  net_return_value,
  avg_revenue_per_return
FROM campaign_effectiveness
WHERE discount_percent IS NOT NULL
ORDER BY return_rate DESC;
```

**Expected Results**:
- [ ] `net_return_value` = revenue * (1 - discount_percent/100)
- [ ] Can compare ROI across different discount percentages
- [ ] `coupon_effectiveness` view shows redemption counts

---

## 7. Blacklist Management (BlacklistManager.jsx)

### 7.1 Manual Blacklist Operations

**Test Items**:
- [ ] Add phone manually (+ button)
- [ ] Phone normalized to +5554... format
- [ ] Reason dropdown works (opt-out, undelivered, number-blocked, manual)
- [ ] Remove phone (trash icon)
- [ ] Confirmation dialog appears before delete
- [ ] Search/filter by phone number works
- [ ] Pagination works (if >10 entries)

### 7.2 Twilio Sync

**Test Items**:
- [ ] "Sincronizar com Twilio" button visible
- [ ] Sync fetches undelivered messages from Twilio API
- [ ] New blocked numbers added with reason='undelivered' and source='twilio-sync'
- [ ] Error codes (63024, etc.) stored in `error_code` column
- [ ] Sync shows count of new entries added
- [ ] Duplicate phones not re-added

### 7.3 Import/Export

**Test Items**:
- [ ] Export downloads CSV with all blacklist entries
- [ ] Import accepts CSV file
- [ ] Import validates phone format
- [ ] Import shows success/error count

### 7.4 Verify Blacklist in Database

```sql
-- Check blacklist entries
SELECT phone, customer_name, reason, source, error_code, added_at
FROM blacklist
ORDER BY added_at DESC
LIMIT 10;

-- Verify indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'blacklist';
```

---

## 8. Campaign Dashboard (CampaignDashboard.jsx)

### 8.1 KPI Cards

**Test Items**:
- [ ] "Taxa de Retorno" shows overall return percentage
- [ ] "Receita Recuperada" shows total revenue from returned customers
- [ ] "Clientes Em Risco" shows count of at-risk customers
- [ ] "Melhor Desconto" shows most effective discount percentage
- [ ] All KPIs load without errors
- [ ] Trend indicators (up/down arrows) display correctly

### 8.2 A/B Testing Insights Panel

**Test Items**:
- [ ] Shows comparison of discount effectiveness (10% vs 15% vs 20% vs 25%)
- [ ] Best performing discount highlighted
- [ ] ROI calculation displayed (revenue - discount cost)
- [ ] Sample size shown for statistical significance

### 8.3 Campaign Funnel

**Test Items**:
- [ ] Shows: Enviados → Entregues → Retornaram
- [ ] Percentages calculated correctly
- [ ] Visual funnel renders properly

### 8.4 Recent Campaigns Table

**Test Items**:
- [ ] Lists last 5-10 campaigns
- [ ] Shows name, date, audience, sends, return rate
- [ ] Clickable to view details
- [ ] Sorted by most recent first

---

## 9. Message Templates (messageTemplates.js)

### 9.1 Template Configuration Validation

**Test Items** (verify in code/console):
- [ ] Each template has `twilioContentSid` (Meta-approved template ID)
- [ ] Each template has `variables` array mapping positions to data fields
- [ ] Each template has `couponCodes` object mapping discount percentages to POS codes
- [ ] 8 templates total: winback_30days, winback_60days, winback_90days, welcome_new, wallet_reminder, wallet_low, promo_seasonal, upsell_dryer

### 9.2 Variable Substitution

**Test** (in browser console):
```javascript
import { MESSAGE_TEMPLATES } from './config/messageTemplates';

const template = MESSAGE_TEMPLATES.winback_30days;
console.log('Template:', template);
console.log('Variables:', template.variables);
console.log('Coupon for 20%:', template.couponCodes['20']);
```

**Expected**:
- [ ] `variables` includes `['nome', 'desconto']` or similar
- [ ] `couponCodes['20']` returns correct POS code (e.g., 'VOLTE20')

### 9.3 Meta WhatsApp Template Compliance

**Reference**: `docs/meta-whatsapp-templates.md`

- [ ] All templates follow Meta's variable format: `{{1}}`, `{{2}}`
- [ ] No prohibited content (spam, adult, etc.)
- [ ] Call-to-action buttons configured if required

---

## 10. UI Component Tests

### 10.1 Campaign List (CampaignList.jsx)

**Test Items**:
- [ ] Shows loading spinner while fetching
- [ ] Displays backend campaigns with "Backend" badge
- [ ] Shows effectiveness metrics: Rastreados, Retornaram, Taxa Retorno
- [ ] "Ver Detalhes dos Contatos" button only on backend campaigns
- [ ] Search filter works
- [ ] Status filter works (Todas, Ativas, Concluídas, Rascunhos)
- [ ] Refresh button reloads data

### 10.2 Campaign Details Modal (CampaignDetailsModal.jsx)

**Test Items**:
- [ ] Opens when clicking "Ver Detalhes dos Contatos"
- [ ] Shows campaign summary metrics
- [ ] Lists all contacts with status icons
- [ ] Color coding: green=returned, amber=pending, gray=expired
- [ ] Shows return details (days, revenue) for returned contacts
- [ ] Filter buttons work correctly
- [ ] Refresh button reloads contact data
- [ ] Close button works

### 10.3 Campaigns Main View (Campaigns.jsx)

**Test Items**:
- [ ] Tab navigation works (Visão Geral, Automações, Audiência, Templates, Blacklist, Histórico)
- [ ] "Nova Campanha" button opens modal
- [ ] All sections render without errors
- [ ] Dark mode styling correct

---

## 11. API/Service Tests

### 11.1 campaignService.js Functions

Test these functions with browser console:

```javascript
// Test getCampaignPerformance
const campaigns = await getCampaignPerformance();
console.log('Campaigns:', campaigns);

// Test getCampaignContacts
const contacts = await getCampaignContacts('CAMP_12345');
console.log('Contacts:', contacts);

// Test recordCampaignContact (dry run - creates records)
const result = await recordCampaignContact('CAMP_TEST', {
  customerId: 'TEST_001',
  customerName: 'Test Customer',
  phone: '+5551999999999',
  contactMethod: 'whatsapp'
});
console.log('Record result:', result);
```

### 11.2 blacklistService.js Functions

```javascript
import { getBlacklist, addToBlacklist, syncTwilioBlacklist } from './utils/blacklistService';

// Test getBlacklist
const blacklist = await getBlacklist();
console.log('Blacklist count:', blacklist.length);

// Test addToBlacklist
const added = await addToBlacklist('+5551999999999', 'Test User', 'manual');
console.log('Added:', added);

// Test syncTwilioBlacklist (requires Twilio credentials)
const syncResult = await syncTwilioBlacklist();
console.log('Sync result:', syncResult);
```

---

## 12. Integration Test Scenarios

### 12.1 End-to-End: Full Campaign Cycle

**Steps**:
1. Create a new campaign targeting "Em Risco" customers with 20% discount
2. Select template "winback_30days"
3. Preview recipients (should show valid phones, exclude blacklisted)
4. Verify coupon code is "VOLTE20"
5. Send campaign (dryRun: false, skipWhatsApp: true for testing)
6. Verify campaign appears in history with correct discount_percent
7. Verify contact_tracking records created
8. Click to view campaign details
9. Simulate some customers returning (via SQL)
10. Refresh campaign details
11. Verify return rate and revenue updated
12. Check campaign_effectiveness view shows A/B data

### 12.2 Backend Fallback Test

**Test localStorage fallback when Supabase unavailable**:
1. Temporarily disconnect Supabase (wrong URL or offline)
2. Try creating a campaign
3. Should fall back to localStorage
4. Reconnect Supabase
5. Future campaigns should use backend

### 12.3 Blacklist Enforcement Test

**Steps**:
1. Add a test phone to blacklist
2. Create campaign targeting customer with that phone
3. Verify phone is excluded from recipient list
4. Verify warning message shows excluded count

---

## 13. Data Validation Tests

### 13.1 Phone Validation

- [ ] Invalid phones are filtered before sending
- [ ] Blacklisted phones are excluded
- [ ] Normalized phone format (+5554...) used everywhere
- [ ] Phones without country code get +55 prefix

### 13.2 Date/Time Handling

- [ ] All timestamps use TIMESTAMPTZ (timezone-aware)
- [ ] Dates display correctly in pt-BR format
- [ ] Expiration calculated correctly (7 days)
- [ ] Scheduled campaigns respect timezone

### 13.3 Coupon Code Validation

- [ ] Coupon codes map correctly to templates and discounts
- [ ] 24 unique codes across all template/discount combinations
- [ ] POS system recognizes all coupon codes

---

## 14. Performance Tests

### 14.1 Query Performance

```sql
-- Check indexes are being used
EXPLAIN ANALYZE SELECT * FROM campaign_performance WHERE id = 'CAMP_12345';
EXPLAIN ANALYZE SELECT * FROM contact_tracking WHERE campaign_id = 'CAMP_12345' AND status = 'pending';
EXPLAIN ANALYZE SELECT * FROM coupon_redemptions WHERE codigo_cupom = 'VOLTE20';
```

### 14.2 UI Performance

- [ ] Campaign list loads within 2 seconds
- [ ] Details modal opens within 1 second
- [ ] No UI freezing when loading large contact lists
- [ ] NewCampaignModal steps transition smoothly

---

## Test Data Setup

### Quick Test Data Script

Run this in Supabase SQL Editor to create test data:

```sql
-- Create test campaign with A/B testing fields
INSERT INTO campaigns (id, name, audience, status, sends, contact_method, message_body, discount_percent, coupon_code, service_type, created_at)
VALUES ('CAMP_TEST_001', 'Test Campaign 20%', 'atRisk', 'active', 5, 'whatsapp', 'Olá {{1}}! Volte com {{2}}% de desconto!', 20.00, 'VOLTE20', 'both', NOW());

-- Create another campaign for A/B comparison
INSERT INTO campaigns (id, name, audience, status, sends, contact_method, message_body, discount_percent, coupon_code, service_type, created_at)
VALUES ('CAMP_TEST_002', 'Test Campaign 15%', 'atRisk', 'active', 5, 'whatsapp', 'Olá {{1}}! Volte com {{2}}% de desconto!', 15.00, 'VOLTE15', 'both', NOW() - INTERVAL '1 day');

-- Create test contacts for campaign 1
INSERT INTO contact_tracking (customer_id, customer_name, contact_method, campaign_id, campaign_name, status, expires_at)
VALUES
  ('CPF_001', 'Maria Silva', 'whatsapp', 'CAMP_TEST_001', 'Test Campaign 20%', 'pending', NOW() + INTERVAL '7 days'),
  ('CPF_002', 'João Santos', 'whatsapp', 'CAMP_TEST_001', 'Test Campaign 20%', 'returned', NOW() + INTERVAL '7 days'),
  ('CPF_003', 'Ana Costa', 'whatsapp', 'CAMP_TEST_001', 'Test Campaign 20%', 'expired', NOW() - INTERVAL '1 day');

-- Create test contacts for campaign 2
INSERT INTO contact_tracking (customer_id, customer_name, contact_method, campaign_id, campaign_name, status, expires_at)
VALUES
  ('CPF_004', 'Pedro Lima', 'whatsapp', 'CAMP_TEST_002', 'Test Campaign 15%', 'pending', NOW() + INTERVAL '7 days'),
  ('CPF_005', 'Lucia Rocha', 'whatsapp', 'CAMP_TEST_002', 'Test Campaign 15%', 'returned', NOW() + INTERVAL '7 days');

-- Update returned contacts with outcome
UPDATE contact_tracking
SET returned_at = NOW() - INTERVAL '2 days', days_to_return = 3, return_revenue = 85.50
WHERE customer_id = 'CPF_002';

UPDATE contact_tracking
SET returned_at = NOW() - INTERVAL '3 days', days_to_return = 4, return_revenue = 65.00
WHERE customer_id = 'CPF_005';

-- Link to campaign_contacts
INSERT INTO campaign_contacts (campaign_id, contact_tracking_id, customer_id, customer_name, phone)
SELECT campaign_id, id, customer_id, customer_name, '+5551999999999'
FROM contact_tracking WHERE campaign_id LIKE 'CAMP_TEST%';

-- Add test blacklist entry
INSERT INTO blacklist (phone, customer_name, reason, source)
VALUES ('+5551988888888', 'Blocked User', 'opt-out', 'manual')
ON CONFLICT (phone) DO NOTHING;

-- Create test coupon redemption
INSERT INTO coupon_redemptions (codigo_cupom, campaign_id, customer_doc, redeemed_at, discount_value)
VALUES ('VOLTE20', 'CAMP_TEST_001', 'CPF_002', NOW() - INTERVAL '2 days', 17.10);
```

---

## Cleanup

After testing, clean up test data:

```sql
-- Remove test data
DELETE FROM coupon_redemptions WHERE campaign_id LIKE 'CAMP_TEST%';
DELETE FROM campaign_contacts WHERE campaign_id LIKE 'CAMP_TEST%';
DELETE FROM contact_tracking WHERE campaign_id LIKE 'CAMP_TEST%';
DELETE FROM campaigns WHERE id LIKE 'CAMP_TEST%';
DELETE FROM blacklist WHERE phone = '+5551988888888';
```

---

## Summary Checklist

| Component | Status |
|-----------|--------|
| Schema deployed to Supabase | [ ] |
| Views return correct data | [ ] |
| A/B testing fields present | [ ] |
| Campaign creation works | [ ] |
| 4-step wizard flows correctly | [ ] |
| Template selection works | [ ] |
| Discount/coupon selection works | [ ] |
| Contact tracking records created | [ ] |
| Return detection works | [ ] |
| Expiration function works | [ ] |
| Coupon attribution works | [ ] |
| Blacklist management works | [ ] |
| Twilio sync works | [ ] |
| CampaignList UI works | [ ] |
| CampaignDashboard KPIs work | [ ] |
| CampaignDetailsModal UI works | [ ] |
| Performance acceptable | [ ] |

---

*Document Version: 2.0 (2025-12-10)*
*Enhanced with: A/B testing, BlacklistManager, NewCampaignModal steps, CampaignDashboard, Message Templates, Coupon Attribution*
