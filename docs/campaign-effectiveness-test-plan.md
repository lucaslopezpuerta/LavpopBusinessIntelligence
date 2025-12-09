# Campaign Effectiveness System - Test Plan

## Overview

This test plan covers the campaign effectiveness tracking system that links WhatsApp campaigns to customer return outcomes.

**Scope**: Supabase backend integration, contact tracking, effectiveness metrics, and UI components.

---

## 1. Database Schema Tests

### 1.1 Run Schema in Supabase

**What to test**: Execute the consolidated `schema.sql` in Supabase SQL Editor.

**Steps**:
1. Open Supabase Dashboard > SQL Editor
2. Copy content from `supabase/schema.sql`
3. Execute the SQL

**Expected Results**:
- [ ] All tables created: `blacklist`, `campaigns`, `campaign_sends`, `contact_tracking`, `campaign_contacts`, `scheduled_campaigns`, `comm_logs`, `automation_rules`
- [ ] All views created: `campaign_performance`, `campaign_effectiveness`, `contact_effectiveness_summary`
- [ ] All functions created: `create_campaign`, `record_campaign_contact`, `update_campaign_stats`, `mark_customer_returned`, `expire_old_contacts`
- [ ] Triggers applied for `updated_at` columns
- [ ] No SQL errors

### 1.2 Verify Views

**Test the views return correct data**:

```sql
-- Should return empty or existing campaigns with metrics
SELECT * FROM campaign_performance LIMIT 5;

-- Should return campaign effectiveness grouped by campaign
SELECT * FROM campaign_effectiveness LIMIT 5;

-- Should return contact summary (last 30 days)
SELECT * FROM contact_effectiveness_summary;
```

---

## 2. Campaign Creation Flow

### 2.1 Create New Campaign via UI

**Steps**:
1. Open Campaigns tab
2. Click "Nova Campanha"
3. Select audience (e.g., "Em Risco")
4. Edit message template
5. Click "Enviar Agora" (or use dryRun mode)

**Expected Results**:
- [ ] Campaign created in Supabase `campaigns` table
- [ ] Campaign appears in Campaign History list with "Backend" badge
- [ ] `campaign_performance` view returns the new campaign

### 2.2 Verify Campaign Record in Database

```sql
-- Check campaign was created
SELECT id, name, audience, status, sends, contact_method
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

-- Check campaign_contacts links
SELECT cc.id, cc.customer_id, cc.phone, cc.delivery_status, ct.status as tracking_status
FROM campaign_contacts cc
LEFT JOIN contact_tracking ct ON cc.contact_tracking_id = ct.id
WHERE cc.campaign_id = 'YOUR_CAMPAIGN_ID';
```

**Expected Results**:
- [ ] `contact_tracking` record created for each recipient
- [ ] `campaign_contacts` record created and linked to tracking
- [ ] Status is 'pending', expires_at is 7 days from now

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

## 6. UI Component Tests

### 6.1 Campaign List (CampaignList.jsx)

**Test Items**:
- [ ] Shows loading spinner while fetching
- [ ] Displays backend campaigns with "Backend" badge
- [ ] Shows effectiveness metrics: Rastreados, Retornaram, Taxa Retorno
- [ ] "Ver Detalhes dos Contatos" button only on backend campaigns
- [ ] Search filter works
- [ ] Status filter works (Todas, Ativas, Concluídas, Rascunhos)
- [ ] Refresh button reloads data

### 6.2 Campaign Details Modal (CampaignDetailsModal.jsx)

**Test Items**:
- [ ] Opens when clicking "Ver Detalhes dos Contatos"
- [ ] Shows campaign summary metrics
- [ ] Lists all contacts with status icons
- [ ] Color coding: green=returned, amber=pending, gray=expired
- [ ] Shows return details (days, revenue) for returned contacts
- [ ] Filter buttons work correctly
- [ ] Refresh button reloads contact data
- [ ] Close button works

### 6.3 Campaign Effectiveness (CampaignEffectiveness.jsx)

**Test Items**:
- [ ] Displays overall effectiveness stats
- [ ] Shows return rate trends
- [ ] Charts update with data

---

## 7. API/Service Tests

### 7.1 campaignService.js Functions

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

---

## 8. Integration Test Scenarios

### 8.1 End-to-End: Full Campaign Cycle

**Steps**:
1. Create a new campaign targeting "Em Risco" customers
2. Preview recipients (should show valid phones, exclude blacklisted)
3. Send campaign (dryRun: false, skipWhatsApp: true for testing)
4. Verify campaign appears in history
5. Verify contact_tracking records created
6. Click to view campaign details
7. Simulate some customers returning (via SQL)
8. Refresh campaign details
9. Verify return rate updated

### 8.2 Backend Fallback Test

**Test localStorage fallback when Supabase unavailable**:
1. Temporarily disconnect Supabase (wrong URL or offline)
2. Try creating a campaign
3. Should fall back to localStorage
4. Reconnect Supabase
5. Future campaigns should use backend

---

## 9. Data Validation Tests

### 9.1 Phone Validation

- [ ] Invalid phones are filtered before sending
- [ ] Blacklisted phones are excluded
- [ ] Normalized phone format (+5554...) used everywhere

### 9.2 Date/Time Handling

- [ ] All timestamps use TIMESTAMPTZ (timezone-aware)
- [ ] Dates display correctly in pt-BR format
- [ ] Expiration calculated correctly (7 days)

---

## 10. Performance Tests

### 10.1 Query Performance

```sql
-- Check indexes are being used
EXPLAIN ANALYZE SELECT * FROM campaign_performance WHERE id = 'CAMP_12345';
EXPLAIN ANALYZE SELECT * FROM contact_tracking WHERE campaign_id = 'CAMP_12345' AND status = 'pending';
```

### 10.2 UI Performance

- [ ] Campaign list loads within 2 seconds
- [ ] Details modal opens within 1 second
- [ ] No UI freezing when loading large contact lists

---

## Test Data Setup

### Quick Test Data Script

Run this in Supabase SQL Editor to create test data:

```sql
-- Create test campaign
INSERT INTO campaigns (id, name, audience, status, sends, contact_method, message_body, created_at)
VALUES ('CAMP_TEST_001', 'Test Campaign', 'atRisk', 'active', 5, 'whatsapp', 'Test message {{nome}}', NOW());

-- Create test contacts
INSERT INTO contact_tracking (customer_id, customer_name, contact_method, campaign_id, campaign_name, status, expires_at)
VALUES
  ('CPF_001', 'Maria Silva', 'whatsapp', 'CAMP_TEST_001', 'Test Campaign', 'pending', NOW() + INTERVAL '7 days'),
  ('CPF_002', 'João Santos', 'whatsapp', 'CAMP_TEST_001', 'Test Campaign', 'returned', NOW() + INTERVAL '7 days'),
  ('CPF_003', 'Ana Costa', 'whatsapp', 'CAMP_TEST_001', 'Test Campaign', 'expired', NOW() - INTERVAL '1 day');

-- Update returned contact with outcome
UPDATE contact_tracking
SET returned_at = NOW(), days_to_return = 3, return_revenue = 85.50
WHERE customer_id = 'CPF_002';

-- Link to campaign_contacts
INSERT INTO campaign_contacts (campaign_id, contact_tracking_id, customer_id, customer_name, phone)
SELECT 'CAMP_TEST_001', id, customer_id, customer_name, '+5551999999999'
FROM contact_tracking WHERE campaign_id = 'CAMP_TEST_001';
```

---

## Cleanup

After testing, clean up test data:

```sql
-- Remove test data
DELETE FROM campaign_contacts WHERE campaign_id LIKE 'CAMP_TEST%';
DELETE FROM contact_tracking WHERE campaign_id LIKE 'CAMP_TEST%';
DELETE FROM campaigns WHERE id LIKE 'CAMP_TEST%';
```

---

## Summary Checklist

| Component | Status |
|-----------|--------|
| Schema deployed to Supabase | [ ] |
| Views return correct data | [ ] |
| Campaign creation works | [ ] |
| Contact tracking records created | [ ] |
| Return detection works | [ ] |
| Expiration function works | [ ] |
| CampaignList UI works | [ ] |
| CampaignDetailsModal UI works | [ ] |
| Performance acceptable | [ ] |

---

*Document Version: 1.0 (2025-12-08)*
