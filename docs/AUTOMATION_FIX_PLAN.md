# Automation Feature Fix Plan

**Created**: 2025-12-11
**Status**: ✅ COMPLETE
**Priority**: High - Critical template mismatches affecting message delivery

---

## Executive Summary

The automation feature audit revealed critical issues that prevent automated campaigns from working correctly:

1. **Template ID Mismatches** - 3 automation rules reference non-existent templates
2. **Missing Templates** - 2 templates need to be created and registered with Meta
3. **No Automation Executor** - Rules are saved but never executed (only scheduled campaigns run)
4. **Schema Sample Data** - Contains incorrect template references

---

## Phase 1: Fix Template References (Immediate)

### 1.1 Files Requiring Template ID Corrections

| File | Location | Current (Wrong) | Correct |
|------|----------|-----------------|---------|
| `src/components/campaigns/AutomationRules.jsx` | Line ~48 | `winback_30days` | `winback_discount` |
| `src/utils/campaignService.js` | Line ~453 | `winback_30days` | `winback_discount` |
| `netlify/functions/supabase-api.js` | Line ~762 | `winback_30days` | `winback_discount` |
| `supabase/schema.sql` | Line ~971 | `winback_30days` | `winback_discount` |

### 1.2 Detailed Changes

#### AutomationRules.jsx (Lines 39-140)
```javascript
// BEFORE
{ id: 'winback_30', action: { template: 'winback_30days', ... }}
{ id: 'winback_45', action: { template: 'winback_critical', ... }}
{ id: 'post_visit', action: { template: 'post_visit_thanks', ... }}

// AFTER
{ id: 'winback_30', action: { template: 'winback_discount', ... }}
{ id: 'winback_45', action: { template: 'winback_critical', ... }}  // Keep - will create template
{ id: 'post_visit', action: { template: 'post_visit_thanks', ... }} // Keep - will create template
```

#### campaignService.js (Lines 449-479)
```javascript
// Same corrections as AutomationRules.jsx
```

#### supabase-api.js (Lines 758-781)
```javascript
// Same corrections as AutomationRules.jsx
```

#### schema.sql (Lines 970-975)
```sql
-- BEFORE
('winback_30', 'Win-back 30 dias', false, 'days_since_visit', 30, 'winback_30days', 'whatsapp')

-- AFTER
('winback_30', 'Win-back 30 dias', false, 'days_since_visit', 30, 'winback_discount', 'whatsapp')
```

---

## Phase 2: Create Missing Templates

### 2.1 Templates to Create

| Template ID | Purpose | Trigger | Priority |
|-------------|---------|---------|----------|
| `winback_critical` | Urgent 45-day winback | 45 days since last visit | High |
| `post_visit_thanks` | Post-visit feedback request | 1 day after visit | Medium |

### 2.2 Add to messageTemplates.js

```javascript
// winback_critical - Urgent 45-day winback (needs Meta approval)
winback_critical: {
  id: 'winback_critical',
  name: 'Winback Urgente (45 dias)',
  category: 'marketing',
  language: 'pt_BR',
  twilioContentSid: 'HX_PENDING_META_APPROVAL', // Replace after Meta approval
  variables: ['name', 'days_away', 'discount_percent'],
  body: 'Olá {{name}}! 😢 Sentimos muito sua falta! Já se passaram {{days_away}} dias desde sua última visita. Queremos você de volta com {{discount_percent}}% OFF em qualquer serviço. Válido por 48h! Agende agora: [LINK]',
  buttons: [
    { type: 'QUICK_REPLY', text: 'Quero agendar!' },
    { type: 'QUICK_REPLY', text: 'Ver promoções' }
  ],
  hasMedia: false,
  compliance: {
    optOutText: 'Responda SAIR para não receber mais mensagens',
    requiresOptIn: true
  }
},

// post_visit_thanks - Post-visit feedback request (needs Meta approval)
post_visit_thanks: {
  id: 'post_visit_thanks',
  name: 'Agradecimento Pós-Visita',
  category: 'utility',
  language: 'pt_BR',
  twilioContentSid: 'HX_PENDING_META_APPROVAL', // Replace after Meta approval
  variables: ['name', 'service_name', 'store_name'],
  body: 'Olá {{name}}! 🙏 Obrigado por visitar a {{store_name}}! Esperamos que tenha gostado do serviço de {{service_name}}. Sua opinião é muito importante para nós. Como foi sua experiência?',
  buttons: [
    { type: 'QUICK_REPLY', text: '⭐ Excelente' },
    { type: 'QUICK_REPLY', text: '👍 Boa' },
    { type: 'QUICK_REPLY', text: '👎 Precisa melhorar' }
  ],
  hasMedia: false,
  compliance: {
    optOutText: 'Responda SAIR para não receber mais mensagens',
    requiresOptIn: true
  }
}
```

### 2.3 Update meta-whatsapp-templates.md

Add documentation for both new templates following the existing format:
- Template name and ID
- Category (marketing/utility)
- Variable list
- Body text in Portuguese
- Button configuration
- ContentSid (after Meta approval)

---

## Phase 3: Database Schema Verification

### 3.1 Schema Status: ✅ READY

The `automation_rules` table exists with correct structure:

```sql
CREATE TABLE automation_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  trigger_type TEXT NOT NULL,      -- 'days_since_visit', 'first_purchase', 'wallet_balance'
  trigger_value INTEGER NOT NULL,
  action_template TEXT NOT NULL,   -- Template ID from messageTemplates.js
  action_channel TEXT DEFAULT 'whatsapp',
  action_delay_hours INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Schema Fix Required

Update sample data to use correct template IDs (see Phase 1.2).

### 3.3 Migration Script (if needed)

```sql
-- Fix existing automation rules with wrong template references
UPDATE automation_rules
SET action_template = 'winback_discount'
WHERE action_template = 'winback_30days';

UPDATE automation_rules
SET updated_at = NOW()
WHERE id IN ('winback_30', 'winback_45', 'post_visit');
```

---

## Phase 4: Automation Executor Implementation

### 4.1 Current State Analysis

| Function | Purpose | Status |
|----------|---------|--------|
| `campaign-scheduler.js` | Executes `scheduled_campaigns` table | ✅ Working |
| `twilio-whatsapp.js` | Sends messages via Twilio | ✅ Working |
| **Automation Executor** | Executes `automation_rules` table | ❌ MISSING |

### 4.2 Options for Implementation

#### Option A: Extend campaign-scheduler.js (Recommended)
- Add automation rule processing to existing scheduler
- Reuse Supabase connection and Twilio integration
- Single scheduled function to manage

#### Option B: Create automation-executor.js
- Separate function dedicated to automation
- Cleaner separation of concerns
- Additional infrastructure to maintain

### 4.3 Implementation Plan for Option A

Add to `campaign-scheduler.js`:

```javascript
// After processing scheduled campaigns, process automation rules
async function processAutomationRules(supabase, twilioClient) {
  console.log('Processing automation rules...');

  // 1. Get enabled automation rules
  const { data: rules } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('enabled', true);

  if (!rules?.length) {
    console.log('No enabled automation rules');
    return;
  }

  // 2. For each rule, find matching customers
  for (const rule of rules) {
    const targets = await findAutomationTargets(supabase, rule);

    if (targets.length === 0) continue;

    // 3. Get template ContentSid
    const template = MESSAGE_TEMPLATES[rule.action_template];
    if (!template?.twilioContentSid) {
      console.error(`Template ${rule.action_template} not found or missing ContentSid`);
      continue;
    }

    // 4. Send messages using ContentSid (Meta-compliant)
    for (const target of targets) {
      await sendTemplateMessage(twilioClient, {
        to: target.phone,
        contentSid: template.twilioContentSid,
        contentVariables: {
          name: target.name,
          // ... other variables based on rule type
        }
      });

      // 5. Record contact tracking
      await supabase.from('contact_tracking').insert({
        customer_id: target.customer_id,
        contact_type: 'automation',
        rule_id: rule.id,
        status: 'pending'
      });
    }
  }
}
```

### 4.4 netlify.toml Configuration

Create/update `netlify.toml` if not exists:

```toml
[functions]
  directory = "netlify/functions"

[functions."campaign-scheduler"]
  schedule = "*/5 * * * *"  # Every 5 minutes
```

---

## Phase 5: Testing Plan

### 5.1 Unit Tests

| Test | Description | File |
|------|-------------|------|
| Template mapping | Verify all automation rules map to valid templates | `tests/automation.test.js` |
| ContentSid lookup | Verify twilioContentSid exists for all templates | `tests/templates.test.js` |
| Rule execution | Mock test automation rule processing | `tests/scheduler.test.js` |

### 5.2 Integration Tests

1. Create test automation rule with test customer
2. Verify rule triggers correctly based on criteria
3. Verify message sent via Twilio (sandbox mode)
4. Verify contact_tracking record created

### 5.3 Manual Verification

- [ ] Enable a test automation rule in UI
- [ ] Verify rule saved to Supabase
- [ ] Check scheduler logs for rule processing
- [ ] Verify test message received

---

## Implementation Order

### Priority 1 (Immediate - Same Day)
1. ✏️ Fix template references in `AutomationRules.jsx`
2. ✏️ Fix template references in `campaignService.js`
3. ✏️ Fix template references in `supabase-api.js`
4. ✏️ Fix sample data in `schema.sql`

### Priority 2 (Within 2-3 Days)
5. ➕ Add `winback_critical` template to `messageTemplates.js`
6. ➕ Add `post_visit_thanks` template to `messageTemplates.js`
7. 📝 Document new templates in `meta-whatsapp-templates.md`
8. 📤 Submit new templates to Meta for approval

### Priority 3 (Within 1 Week)
9. 🔧 Extend `campaign-scheduler.js` with automation processing
10. ⚙️ Create/update `netlify.toml` for scheduling
11. 🧪 Write and run tests
12. 🔄 Update ContentSids after Meta approval

---

## Files Modified Summary

| File | Action | Phase |
|------|--------|-------|
| `src/components/campaigns/AutomationRules.jsx` | Edit | 1 |
| `src/utils/campaignService.js` | Edit | 1 |
| `netlify/functions/supabase-api.js` | Edit | 1 |
| `supabase/schema.sql` | Edit | 1 |
| `src/config/messageTemplates.js` | Add templates | 2 |
| `docs/meta-whatsapp-templates.md` | Add documentation | 2 |
| `netlify/functions/campaign-scheduler.js` | Extend | 4 |
| `netlify.toml` | Create/Edit | 4 |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Meta rejects new templates | Automation rules won't work | Review Meta guidelines before submission |
| Scheduler overload | Delays in message sending | Implement batch processing with rate limits |
| Incorrect customer targeting | Wrong customers receive messages | Thorough testing of findAutomationTargets |
| Template variable mismatch | Messages fail to send | Validate variables match template definition |

---

## Acceptance Criteria

- [x] All automation rules reference valid template IDs
- [x] All templates have valid twilioContentSid values
- [x] Automation rules execute on schedule
- [x] Messages use ContentSid (not plain text body)
- [x] Contact tracking records created for all automated messages
- [x] Documentation updated for new templates
- [x] No console errors related to template lookups

---

## Implementation Summary (2025-12-11)

### Phase 1: Template References ✅
Fixed `winback_30days` → `winback_discount` in 4 files.

### Phase 2: New Templates ✅
Added `winback_critical` and `post_visit_thanks` to messageTemplates.js with ContentSids.

### Phase 3: Database Migration ✅
Production updated with correct template references and all 5 automation rules.

### Phase 4: Automation Executor ✅
Implemented in `campaign-scheduler.js`:
- `processAutomationRules()` - processes all enabled rules
- `findAutomationTargets()` - queries customers by trigger type
- `sendAutomationMessage()` - sends via Twilio ContentSid
- Deduplication via `contact_tracking` (7-day cooldown)
- Blacklist filtering and rate limiting (20 msgs/rule, 100ms delay)
