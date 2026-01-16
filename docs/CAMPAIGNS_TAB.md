# Campaigns Tab - Technical Documentation

**Version:** 3.6.0
**Last Updated:** 2026-01-08
**File:** `src/views/Campaigns.jsx`

## Changelog

**v3.6.0 (2026-01-08):**
- **Phase 6 - Dashboard Enhancements:**
  - CampaignDashboard v2.6: Added 4 new columns to Recent Campaigns table
  - Status column: Shows campaign status badge (Ativa/Concluída/Rascunho/Agendada)
  - Retornados column: Absolute count of returned customers (not just percentage)
  - Período column: Tracking window showing created date → validity days
  - Tempo column: Average days to return with color coding (green ≤3d, blue ≤7d)
  - Responsive breakpoints: Mobile (4) → Tablet (7) → Desktop (10) → XL (13)
- **Phase 8 - AudienceFilterBuilder:**
  - New component for custom audience filtering in campaign creation
  - Mode toggle in wizard Step 1: "Segmentos" vs "Filtro Avançado"
  - Time-based filters: last visit range (7/14/30/60/90 days, or inactive >30/60/90 days)
  - Financial filters: min/max total spend, wallet balance range
  - Behavior filters: RFM segment multiselect, risk level multiselect, visit count
  - Live preview of filtered customer count with WhatsApp validation
  - Replaces preset audiences when using custom filters
  - messageTemplates.js v2.3: getTemplatesByAudience handles 'customFiltered' audience

**v3.5.0 (2025-12-15):**
- **Manual Inclusion Priority Queue (Schema v3.18):**
  - Users can now manually add customers to automation queues from CustomerSegmentModal
  - New `priority_source` column in `contact_tracking` table (`manual_inclusion`, `automation`, or `null`)
  - Scheduler processes queued entries via new `processPriorityQueue()` function
  - Respects eligibility cooldowns (7-day global, 30-day same-type) - no bypass
  - Duplicate entries are prevented at the API level
  - See [Manual Inclusion Flow](#manual-inclusion-flow) for details

**v3.4.0 (2025-12-13):**
- **Auto-refresh Triggers (Schema v3.14):**
  - Customer metrics now update automatically when transactions are inserted
  - No more manual "Sincronizar Metricas" clicks required after sales uploads
  - Triggers: `trg_update_customer_after_transaction`, `trg_calculate_customer_risk`
  - Computes: `last_visit`, `transaction_count`, `total_spent`, `avg_days_between`, `risk_level`
- **Smart Customer Upsert:**
  - Handles full customer list uploads (entire POS export) without data regression
  - Profile fields (nome, telefone, email, saldo_carteira): Always update
  - Date fields (first_visit, last_visit): Use GREATEST (won't regress to older dates)
  - Count fields (transaction_count, total_spent): Use GREATEST (won't regress to lower values)
  - Computed fields (risk_level, avg_days_between): Never touched (triggers handle)
  - Falls back to simple upsert if RPC not available
- **Smart Data Refresh (App.jsx v7.0):**
  - Visibility-based refresh: Auto-refresh when returning to tab after 5+ minutes
  - Auto-refresh every 10 minutes while tab is active
  - Silent background refresh (no loading spinner)
  - DataFreshnessProvider for app-wide refresh triggers

**v3.3.0 (2025-12-13):**
- **Unified Manual Campaign Flow:**
  - Manual campaigns now use the same flow as automations: SEND FIRST, then RECORD
  - `sendCampaignWithTracking` now stores `twilio_sid` in `campaign_contacts`
  - New `campaign_contacts.record` API action mirrors SQL `record_automation_contact()`
  - Webhook can now link delivery events to manual campaigns via `twilio_sid`
  - Delivery metrics (delivered/read) now work for manual campaigns

**v3.2.0 (2025-12-12):**
- **Enhanced Automation Controls (v6.0):**
  - Send time window: Only send messages between configurable hours (Brazil timezone)
  - Day of week restrictions: Individual checkboxes for each day (Seg, Ter, Qua, Qui, Sex, Sáb, Dom)
  - Daily rate limiting: Maximum messages per day per automation
  - Exclude recent visitors: Don't send to customers who visited recently (except welcome/wallet/post-visit)
  - Minimum total spent threshold: Only target customers who spent above a certain amount
  - Wallet balance range: For wallet_reminder, set a max balance to target
- AutomationRules UI v6.0 with new control sections
- campaign-scheduler.js v2.2 with enhanced filtering and Brazil timezone checks

**v3.1.0 (2025-12-12):**
- Added `risk_level` column to customers table for consistent automation targeting
- Risk level computed in Supabase using same algorithm as frontend (exponential decay with RFM bonus)
- Automations now use `risk_level IN ('At Risk', 'Churning')` instead of custom ratio calculation
- 100% consistency between manual campaign UI and automation targeting

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Flow](#data-flow)
4. [User Flows](#user-flows)
5. [Components](#components)
   - [AutomationRules](#automationrules-auto-tab)
6. [Backend Integration](#backend-integration)
   - [Database Tables](#database-tables-supabase)
7. [Templates & Configuration](#templates--configuration)
8. [A/B Testing](#ab-testing)
9. [Key Features](#key-features)

---

## Overview

The Campaigns tab is the WhatsApp marketing and customer retention center for Bilavnova. It enables:

- **Campaign Analytics** - Track return rates, revenue recovered, and A/B test results
- **Audience Targeting** - Segment customers by churn risk or RFM scores
- **Message Templates** - Browse Meta-approved WhatsApp templates
- **Campaign Creation** - Step-by-step wizard with scheduling support
- **Blacklist Management** - Track opt-outs and undeliverable numbers
- **Automation Rules** - Configure automated win-back and welcome campaigns

---

## Architecture

### Component Hierarchy

```
Campaigns.jsx (Main View)
├── CampaignSectionNavigation (Tab Navigation)
├── CampaignDashboard (Overview Tab)
│   ├── KPICard (Hero metrics)
│   ├── DiscountComparisonCard (A/B testing)
│   ├── CampaignFunnel (Conversion visualization)
│   └── RecentCampaignsTable
├── AutomationRules (Automations Tab)
├── AudienceSelector (Audiences Tab)
├── MessageComposer (Messages Tab)
├── BlacklistManager (Blacklist Tab)
├── CampaignList (History Tab)
└── NewCampaignModal (Campaign Creation Wizard)
    └── 4-step wizard: Audience → Template → Preview → Send
```

### State Management

```javascript
// Main state in Campaigns.jsx
const [activeSection, setActiveSection] = useState('overview');  // Current tab
const [showNewCampaign, setShowNewCampaign] = useState(false);   // Wizard visibility
const [selectedAudience, setSelectedAudience] = useState(null);  // Selected audience ID
const [initialTemplate, setInitialTemplate] = useState(null);    // Pre-selected template for wizard
```

---

## Data Flow

### Customer Metrics Calculation

```
data.sales + data.rfm + data.customer
        ↓
calculateCustomerMetrics()
        ↓
customerMetrics.allCustomers
        ↓
audienceSegments (filtered by risk/RFM)
```

### Audience Segments

| Segment ID | Filter Logic | Use Case |
|------------|--------------|----------|
| `atRisk` | `riskLevel IN ('At Risk', 'Churning')` | Win-back campaigns |
| `newCustomers` | `riskLevel = 'New Customer'` | Welcome campaigns |
| `healthy` | `riskLevel = 'Healthy'` | Loyalty rewards |
| `vip` | `segment = 'VIP'` | Premium offers |
| `frequent` | `segment = 'Frequente'` | Engagement |
| `promising` | `segment = 'Promissor'` | Growth campaigns |
| `cooling` | `segment = 'Esfriando'` | Re-engagement |
| `inactive` | `segment = 'Inativo'` | Win-back |
| `withWallet` | `walletBalance >= R$10` | Wallet reminders |
| `all` | All customers with phone | Mass campaigns |

**Important:** `riskLevel` values are stored as English keys (`'At Risk'`, `'Churning'`), not Portuguese display names.

---

## User Flows

### Flow 1: Nova Campanha Wizard (Primary)

```
┌─────────────────────────────────────────────────────────────┐
│  Click "Nova Campanha" button                               │
│           ↓                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         NEW CAMPAIGN WIZARD MODAL                    │   │
│  │                                                      │   │
│  │  Step 1: SELECT AUDIENCE                            │   │
│  │  ├── Retention audiences (At Risk, New, Healthy)    │   │
│  │  └── Marketing audiences (VIP, Frequent, etc.)      │   │
│  │           ↓                                         │   │
│  │  Step 2: SELECT TEMPLATE (filtered by audience)     │   │
│  │  ├── Shows recommended templates                    │   │
│  │  └── Configure A/B testing (discount %, service)    │   │
│  │           ↓                                         │   │
│  │  Step 3: PREVIEW                                    │   │
│  │  ├── Phone mockup preview                           │   │
│  │  └── Text preview with variables filled             │   │
│  │           ↓                                         │   │
│  │  Step 4: SEND                                       │   │
│  │  ├── Send Now: Immediate via Twilio                 │   │
│  │  └── Schedule: Save for future execution            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Flow 2: Browse → Use Template (Secondary)

```
┌─────────────────────────────────────────────────────────────┐
│  Audiences Tab                                              │
│  ├── Browse audience cards                                  │
│  └── Select audience → sets selectedAudience               │
│           ↓                                                 │
│  Messages Tab                                               │
│  ├── Templates filtered by selected audience               │
│  ├── Preview with sample customer data                     │
│  └── Click "Usar este template"                            │
│           ↓                                                 │
│  Wizard opens at Step 2 with template pre-selected         │
│  ├── Audience already set from Audiences tab               │
│  └── Continue: A/B config → Preview → Send                 │
└─────────────────────────────────────────────────────────────┘
```

### Why Two Flows?

| Feature | Wizard (Primary) | Tabs (Browse) |
|---------|------------------|---------------|
| **Purpose** | Complete campaign creation | Explore & learn |
| **Sending** | ✅ Full send capability | ❌ No direct send |
| **A/B Testing** | ✅ Configure discount/service | ❌ View only |
| **Scheduling** | ✅ Immediate or scheduled | ❌ Not available |
| **Tracking** | ✅ Full contact tracking | ❌ N/A |
| **Best For** | Taking action | Learning the system |

---

## Components

### CampaignDashboard (`overview` tab)

**Purpose:** Real-time campaign analytics and insights

**Data Source:** `getDashboardMetrics()` from `campaignService.js`

**Sections:**
- **Hero KPIs:** Return Rate, Revenue Recovered, At-Risk Count, Best Discount
- **A/B Testing:** Discount comparison chart, Service type comparison
- **Funnel:** Sent → Delivered → Engaged → Returned
- **Recent Campaigns:** Table with performance metrics

### AudienceSelector (`audience` tab)

**Purpose:** Browse and select customer segments for targeting

**Features:**
- Category filter (Retention / Marketing / All)
- Visual cards with customer counts
- Only shows customers with valid Brazilian mobile phones
- Selection persists across tabs

### MessageComposer (`templates` tab)

**Purpose:** Browse and preview Meta-approved WhatsApp templates

**Features:**
- Templates filtered by selected audience
- Phone mockup preview
- Sample customer cycling (see how message looks for different customers)
- "Usar este template" → Opens wizard with pre-selection

**Does NOT:**
- Send campaigns directly (removed in v4.0)
- Configure A/B testing (handled by wizard)

### NewCampaignModal (Wizard)

**Purpose:** Complete campaign creation with all features

**File:** `src/components/campaigns/NewCampaignModal.jsx` (v5.1)

**Props:**
```javascript
{
  isOpen: boolean,           // Modal visibility
  onClose: function,         // Close handler
  audienceSegments: object,  // All audience data
  initialTemplate: object,   // Pre-selected template (optional)
  initialAudience: string    // Pre-selected audience ID (optional)
}
```

**Steps:**
1. **Audience** - Select target segment (v5.1: now with mode toggle)
2. **Template** - Choose message + configure A/B testing
3. **Preview** - Review personalized message
4. **Send** - Execute or schedule campaign

### AudienceFilterBuilder (v1.0)

**Purpose:** Custom audience filtering for campaign creation (Phase 8)

**File:** `src/components/campaigns/AudienceFilterBuilder.jsx`

**Features:**
- Time-based filters (last visit range)
- Financial filters (spend, wallet balance)
- Behavior filters (visit count, RFM segments, risk levels)
- Live preview of filtered customer count
- Collapsible filter sections

**Integration Points:**
- Works alongside predefined segments (tabbed interface in Step 1)
- Filtered customers passed to `sendCampaignWithTracking()`
- Template filtering shows all templates for custom audiences (`customFiltered`)
- No conflict with AudienceSelector (browse-only) or Directory FAB

**Props:**
```javascript
{
  allCustomers: array,           // Full customer list (typically audienceSegments.withPhone)
  onFilteredCustomers: function, // Callback with filtered results
  initialFilters: object,        // Optional pre-set filters
  className: string              // Optional CSS classes
}
```

**Filter Categories:**

| Category | Filters | Description |
|----------|---------|-------------|
| **Time** | lastVisitRange | Recent (7/14/30/60/90 days) or Inactive (>30/60/90 days) |
| **Financial** | minSpend, maxSpend | Total spend range |
| **Financial** | minWalletBalance, maxWalletBalance | Wallet balance range |
| **Behavior** | minVisits, maxVisits | Visit count range |
| **Behavior** | rfmSegments | Multiselect: VIP, Frequente, Promissor, Esfriando, Inativo |
| **Behavior** | riskLevels | Multiselect: Saudavel, Monitorar, Em Risco, Critico, Novo, Perdido |

**Data Flow:**
```
AudienceFilterBuilder
  → Build filter criteria
  → Filter allCustomers locally (useMemo)
  → Filter to valid WhatsApp phones
  → Call onFilteredCustomers(validPhoneCustomers)
  → Parent sets selectedAudience='customFiltered'
  → Templates: getTemplatesByAudience('customFiltered') returns all
```

### BlacklistManager (`blacklist` tab)

**Purpose:** Manage opt-outs and undeliverable numbers

**Features:**
- View blacklisted numbers with reasons
- Manual add/remove
- Twilio sync for automatic updates
- Export/import functionality

### AutomationRules (`auto` tab)

**Purpose:** Configure automated campaigns that trigger based on customer behavior

**File:** `src/components/campaigns/AutomationRules.jsx` (v6.0)

**Unified Campaign Model (v3.0):**

Automations are now treated as **"Auto Campaigns"** - they create corresponding records in the `campaigns` table and use the same tracking infrastructure as manual campaigns. This provides:

- **Unified Metrics:** Manual + Auto campaigns appear in the same dashboard
- **A/B Testing Data:** Automation coupons tracked for effectiveness analysis
- **Complete Funnel Visibility:** Sent → Delivered → Returned metrics
- **Contact Return Tracking:** Unified tracking across all campaign types

**Features:**
- Enable/disable individual automation rules
- Configure cooldown periods (days between sends to same customer)
- Set stop dates (automation end date in Brazil timezone)
- Define maximum send limits per automation
- Configure coupon codes and validity periods
- **View campaign metrics:** Return rate, revenue recovered per automation

**v6.0 Enhanced Controls:**
- **Send Time Window:** Only send messages between configurable hours (default 09:00-20:00 Brazil time)
- **Day of Week Restrictions:** Select which days automations can send (default Mon-Fri)
- **Daily Rate Limit:** Maximum messages per day per automation (prevents spamming)
- **Exclude Recent Visitors:** Skip customers who visited within X days (for winback automations)
- **Minimum Total Spent:** Only target customers with lifetime spend ≥ threshold
- **Wallet Balance Max:** For wallet_reminder, only target balances up to X (avoid alerting high-balance customers)

#### Available Automation Rules

| Rule ID | Trigger | Default Cooldown | Default Coupon |
|---------|---------|------------------|----------------|
| `winback_30` | Customer inactive 30+ days | 30 days | VOLTE20 (20%) |
| `winback_45` | Customer inactive 45+ days | 21 days | VOLTE25 (25%) |
| `welcome` | First purchase | 365 days | BEM10 (10%) |
| `wallet_reminder` | Balance ≥ R$20 | 14 days | None |
| `post_visit` | 24h after visit | 7 days | None |

#### Configurable Parameters

```javascript
{
  id: 'winback_30',
  enabled: true,

  // Timing Controls
  cooldown_days: 30,           // Days before same customer can be targeted again
  valid_until: '2025-12-31',   // Stop date (null = runs forever)

  // Send Limits
  max_total_sends: 1000,       // Lifetime limit (null = unlimited)
  total_sends_count: 245,      // Current count (auto-incremented)

  // Coupon Configuration
  coupon_code: 'VOLTE20',      // Must exist in POS system
  discount_percent: 20,        // Display only (coupon handles actual discount)
  coupon_validity_days: 7,     // Days shown in message as expiration

  // v6.0: Enhanced Controls
  send_window_start: '09:00',  // Start time for sending (Brazil timezone)
  send_window_end: '20:00',    // End time for sending (Brazil timezone)
  send_days: [1,2,3,4,5],      // Days allowed (1=Mon, 7=Sun) - default Mon-Fri
  max_daily_sends: 50,         // Max messages per day (null = unlimited)
  exclude_recent_days: 3,      // Skip customers who visited within X days (null = don't exclude)
  min_total_spent: 50.00,      // Only target customers who spent >= R$50 (null = no minimum)
  wallet_balance_max: 200.00   // For wallet_reminder: only target balances <= R$200 (null = no max)
}
```

**Per-Rule Default Settings:**

| Rule | exclude_recent_days | min_total_spent | wallet_balance_max | send_days |
|------|---------------------|-----------------|-------------------|-----------|
| `winback_30` | 3 | null | null | Mon-Fri |
| `winback_45` | 3 | R$50 | null | Mon-Fri |
| `welcome_new` | null* | null | null | Mon-Fri |
| `wallet_reminder` | null* | null | R$200 | Mon-Fri |
| `post_visit` | null* | null | null | All days |

*\* These automations target recent visitors, so `exclude_recent_days` should be null.*

#### Status States

| Status | Description | Visual |
|--------|-------------|--------|
| `active` | Enabled and running | Green pill |
| `inactive` | Manually disabled | Gray pill |
| `expired` | Past `valid_until` date | Orange pill |
| `limit_reached` | Hit `max_total_sends` | Blue pill |

#### Cooldown Logic

The cooldown prevents messaging the same customer too frequently:

```
Customer last contacted: 2025-12-01
Cooldown days: 30
Today: 2025-12-15

Days since contact: 14
Cooldown remaining: 16 days
Result: Customer NOT eligible (must wait 16 more days)
```

#### Execution Flow

Automations are executed by a Netlify scheduled function:

```
netlify/functions/campaign-scheduler.js v2.2 (runs every 5 minutes)
    ↓
For each enabled automation_rule:
├── Ensure campaign record exists:
│   └── Call sync_automation_campaign(rule_id) if campaign_id is null
├── Check valid_until (if set, skip if passed)
├── Check max_total_sends (if set, skip if reached)
├── v2.2: Check send_window_start/end (Brazil timezone)
│   └── Skip if current Brazil time outside window
├── v2.2: Check send_days (day of week restrictions)
│   └── Skip if today not in allowed days (1=Mon, 7=Sun)
├── v2.2: Check max_daily_sends (daily rate limit)
│   └── Skip if daily_sends_count >= max_daily_sends (reset daily)
├── Query eligible customers (v3.6 unified targeting):
│   ├── days_since_visit: WHERE risk_level IN ('At Risk', 'Churning')
│   │                     AND days_since_last_visit >= trigger_value
│   ├── first_purchase: WHERE risk_level = 'New Customer'
│   │                   AND transaction_count = 1
│   ├── v2.2: exclude_recent_days: WHERE days_since_last_visit > X (if set)
│   ├── v2.2: min_total_spent: WHERE total_spent >= X (if set)
│   ├── v2.2: wallet_balance_max: WHERE saldo_carteira <= X (for wallet_reminder)
│   ├── Has valid Brazilian mobile
│   ├── Not in blacklist
│   └── Not contacted within cooldown_days (checked via automation_sends)
├── For each eligible customer:
│   ├── Send WhatsApp via Twilio
│   ├── Call record_automation_contact() which:
│   │   ├── Creates contact_tracking record
│   │   ├── Creates campaign_contacts bridge record
│   │   ├── Creates automation_sends record
│   │   └── Updates campaign sends count
│   └── Increment rule total_sends_count + daily_sends_count
└── Log execution results
```

#### Manual Inclusion Flow

Users can manually add customers to automation queues via the "Incluir em Automação" button in the CustomerSegmentModal. This is useful for:
- Adding specific customers to an automation who don't meet the automatic trigger criteria
- Re-engaging customers who were previously skipped due to cooldowns (after cooldown expires)
- Testing automation templates with specific customers

**UI Flow:**

```
CustomerSegmentModal (customer details)
    ↓
Click "Incluir em Automação" button
    ↓
Shows dropdown with matching automations
├── Filtered by audience type (e.g., At Risk customer sees winback automations)
└── Shows automation name + template type
    ↓
Select automation → API creates contact_tracking entry
├── priority_source: 'manual_inclusion'
├── status: 'queued'
├── campaign_id: 'AUTO_{rule_id}'
└── customer_id, customer_name
```

**Backend Processing:**

```
campaign-scheduler.js (runs every 5 minutes)
    ↓
processPriorityQueue(supabase)
    ↓
1. Query contact_tracking WHERE priority_source='manual_inclusion' AND status='queued' (limit 50)
    ↓
2. Check eligibility via check_customers_eligibility() RPC
├── 7-day global cooldown enforced
├── 30-day same-type cooldown enforced
└── NO bypass for manual inclusions
    ↓
3. For each queued entry:
├── Skip if not eligible → status='cleared', notes='Skipped: cooldown active'
├── Skip if no phone → status='cleared', notes='Skipped: no valid phone'
├── Skip if blacklisted → status='cleared', notes='Skipped: blacklisted'
├── Get automation rule from campaign_id (AUTO_{rule_id})
├── Get ContentSid from AUTOMATION_TEMPLATE_SIDS
└── Send via sendAutomationMessage()
    ↓
4. Update contact_tracking:
├── Success → status='pending', twilio_sid, delivery_status='sent'
└── Failure → status='cleared', delivery_status='failed', notes='Failed: {error}'
```

**Status Flow:**

```
Manual Inclusion:
  queued → pending → returned/expired
             ↓
          cleared (if ineligible/blacklisted/failed)

Automation (for comparison):
  (created as pending) → returned/expired
```

**Key Design Decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Processing | Async (5-min scheduler) | Consistent with automation flow |
| Eligibility | Enforced (no bypass) | Prevents spam, respects customer preferences |
| Duplicates | Skipped at API level | Same customer can't be queued twice |
| Tracking | Uses contact_tracking | Single source of truth, analytics work automatically |

**Database Column:**

```sql
-- contact_tracking.priority_source
'manual_inclusion' -- User clicked "Incluir em Automação"
'automation'       -- Scheduler created automatically
NULL               -- Legacy or manual campaign
```

**Why risk_level Column (v3.6)?**

Previously, automations used a simple ratio calculation (`days_since_last_visit > avg_days_between * 1.3`) to determine if a customer was "at risk". This differed from the frontend's exponential decay algorithm, causing inconsistencies:

| Customer | avg_days_between | days_since | Frontend | Backend (old) | Backend (new) |
|----------|------------------|------------|----------|---------------|---------------|
| A | 7 | 35 | At Risk | Not targeted | At Risk ✓ |
| B | 60 | 35 | Healthy | Targeted ✗ | Healthy ✓ |

The `risk_level` column is now computed by `calculate_customer_risk()` in Supabase using the exact same algorithm as `customerMetrics.js`:

```sql
-- Exponential decay formula (matches frontend)
likelihood = exp(-max(0, (days_since / avg_days_between) - 1)) * 100
likelihood = likelihood * segment_bonus  -- VIP=1.2, Frequente=1.1, etc.

-- Classification thresholds
IF likelihood > 60 THEN 'Healthy'
ELSIF likelihood > 30 THEN 'Monitor'
ELSIF likelihood > 15 THEN 'At Risk'
ELSE 'Churning'
```

#### SQL Functions for Unified Tracking

**calculate_customer_risk(p_days_since_last_visit, p_transaction_count, p_avg_days_between, p_rfm_segment)** *(v3.6)*
- Computes risk level using the exact same algorithm as frontend's `customerMetrics.js`
- Returns `(risk_level TEXT, return_likelihood INTEGER)`
- Called by `refresh_customer_metrics()` to populate customers.risk_level
- Immutable function for consistent results

**sync_automation_campaign(p_rule_id TEXT)**
- Creates or updates a campaign record for an automation rule
- Campaign ID format: `AUTO_{rule_id}` (e.g., `AUTO_winback_30`)
- Maps trigger types to audiences (days_since_visit → atRisk, first_purchase → newCustomers, etc.)
- Syncs status: enabled rule → 'active' campaign, disabled → 'paused'

**record_automation_contact(p_rule_id, p_customer_id, p_customer_name, p_phone, p_message_sid)**
- Creates unified tracking records across all relevant tables:
  1. `contact_tracking` - For return tracking with campaign attribution
  2. `campaign_contacts` - Bridges campaign ↔ contact_tracking
  3. `automation_sends` - For cooldown tracking
- Updates campaign sends count
- Returns automation_send UUID for reference

---

## Backend Integration

### Service Layer

All campaign operations go through `src/utils/campaignService.js`:

```javascript
// Campaign CRUD
createCampaignAsync(campaignData)      // Create campaign record
getCampaignsAsync()                    // List all campaigns

// Sending
sendCampaignWithTracking(campaignId, recipients, options)
  ├── recordCampaignContact()          // Track each recipient
  ├── sendWhatsAppMessage()            // Send via Twilio
  └── recordCampaignSendAsync()        // Update stats

// Scheduling
createScheduledCampaignAsync(data)     // Save for future execution

// Analytics
getDashboardMetrics({ days })          // Aggregate metrics
```

### Database Tables (Supabase)

| Table | Purpose |
|-------|---------|
| `customers` | Customer data with risk_level + return_likelihood *(v3.6)* |
| `campaigns` | Campaign metadata + A/B config |
| `campaign_contacts` | Recipients per campaign |
| `contact_tracking` | Message delivery + engagement |
| `campaign_effectiveness` | Aggregated performance |
| `blacklist` | Opt-outs and blocked numbers |
| `scheduled_campaigns` | Future campaigns |
| `automation_rules` | Automation configuration |
| `automation_sends` | Automation execution history |
| `webhook_events` | Twilio delivery status events |

#### Customers Table Risk Columns *(v3.6)*

```sql
-- Risk level classification (computed by refresh_customer_metrics)
risk_level TEXT,           -- 'Healthy', 'Monitor', 'At Risk', 'Churning', 'New Customer', 'Lost'
return_likelihood INTEGER  -- 0-100% likelihood of return

-- Index for efficient automation queries
CREATE INDEX idx_customers_risk_level ON customers(risk_level);
```

> **Note:** Legacy CSV files (`campaigns.csv`, `blacklist.csv`, `twilio.csv`) have been deprecated. All campaign data is now stored in Supabase.

#### automation_rules Schema

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Rule identifier (e.g., `winback_30`) |
| `name` | TEXT | Display name |
| `description` | TEXT | Rule description |
| `enabled` | BOOLEAN | Whether rule is active |
| `template_id` | TEXT | Associated message template |
| `twilio_content_sid` | TEXT | Twilio template ID |
| `valid_until` | TIMESTAMPTZ | Stop date (null = forever) |
| `cooldown_days` | INTEGER | Days between sends to same customer (default: 14) |
| `max_total_sends` | INTEGER | Lifetime send limit (null = unlimited) |
| `total_sends_count` | INTEGER | Current send count (default: 0) |
| `coupon_code` | TEXT | Coupon code for message |
| `discount_percent` | INTEGER | Discount percentage |
| `coupon_validity_days` | INTEGER | Days until coupon expires (default: 7) |
| `campaign_id` | TEXT | **FK to campaigns.id** - Links rule to its campaign record (v3.0) |
| `created_at` | TIMESTAMPTZ | Rule creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last modification timestamp |

> **Note (v3.0):** The `campaign_id` column links each automation rule to a corresponding campaign record. Auto-generated campaign IDs follow the format `AUTO_{rule_id}`. This is populated automatically by the `sync_automation_campaign_trigger` when rules are enabled.

#### automation_sends Schema

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Send record ID |
| `rule_id` | TEXT | Reference to automation_rules.id |
| `customer_id` | TEXT | Customer who received message |
| `phone` | TEXT | Phone number sent to |
| `sent_at` | TIMESTAMPTZ | When message was sent |
| `status` | TEXT | Delivery status |
| `message_sid` | TEXT | Twilio message SID |

#### webhook_events Schema

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Auto-increment primary key |
| `message_sid` | TEXT | Twilio message SID (unique) |
| `phone` | TEXT | Normalized phone number |
| `event_type` | TEXT | Event type (`delivery_status`) |
| `payload` | TEXT | Status value (`sent`, `delivered`, `read`, `failed`) |
| `error_code` | TEXT | Twilio error code (if failed) |
| `created_at` | TIMESTAMPTZ | Event timestamp |

### Delivery Status Tracking

Twilio sends webhook events when message status changes. These are persisted in `webhook_events` for analytics.

**Webhook Flow:**

```
WhatsApp Message Sent
    ↓
Twilio Status Callback → /.netlify/functions/twilio-webhook
    ↓
trackDeliveryStatus() → Upsert to webhook_events table
    ↓
Dashboard fetches via api.delivery.getStats()
```

**Status Progression:**

```
queued → sent → delivered → read
                    ↓
                  failed (with error_code)
```

**API Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `webhook_events.getDeliveryStats` | GET | Aggregated delivery metrics |
| `webhook_events.getAll` | GET | Raw webhook events |

**Service Methods:**

```javascript
// Get aggregated delivery stats
const stats = await api.delivery.getStats(days);
// Returns: { totalSent, totalDelivered, deliveryRate, readRate, hasRealData }

// Get raw events
const events = await api.delivery.getEvents(limit, eventType);
```

**Dashboard Integration:**

The `CampaignDashboard` uses real delivery data when available:

```javascript
if (deliveryStats.hasRealData) {
  metrics.deliveryRate = deliveryStats.deliveryRate;  // Real rate from webhook events
  metrics.readRate = deliveryStats.readRate;
} else {
  metrics.deliveryRate = 97;  // Fallback estimate
}
```

### Twilio Integration

Messages are sent via Netlify function → Twilio WhatsApp API:

```
NewCampaignModal
    ↓
sendCampaignWithTracking()
    ↓
sendWhatsAppMessage(phone, contentSid, contentVariables)
    ↓
/.netlify/functions/twilio-whatsapp
    ↓
Twilio Content API (uses twilioContentSid for Meta-approved template)
```

**Important:** All marketing messages MUST use `twilioContentSid` (Meta-approved template ID), not plain text.

---

## Templates & Configuration

### Template Structure (`src/config/messageTemplates.js`)

```javascript
{
  id: 'winback_discount',
  name: 'Win-back com Desconto',
  category: 'MARKETING',
  campaignType: CAMPAIGN_TYPES.WINBACK,
  audience: 'atRisk',                    // Recommended audience

  // Meta WhatsApp Business API
  metaTemplateName: 'lavpop_winback_desconto',
  twilioContentSid: 'HX58267edb...',     // Required for sending

  // Message content
  header: { type: 'TEXT', text: 'Sentimos sua falta! 🧺' },
  body: 'Olá {{1}}! ... {{2}}% de desconto ... cupom *{{3}}* até {{4}}',
  footer: 'Lavpop - Lavanderia Self-Service',

  // Variables mapping
  variables: [
    { position: 1, key: 'customerName', source: 'customer.name' },
    { position: 2, key: 'discount', source: 'campaign.discount' },
    { position: 3, key: 'couponCode', source: 'campaign.couponCode' },
    { position: 4, key: 'expirationDate', format: 'DD/MM' }
  ],

  // A/B testing defaults
  discountDefaults: {
    discountPercent: 20,
    couponCode: 'VOLTE20',
    serviceType: 'both'
  }
}
```

### Available Templates

| ID | Name | Audience | Has Coupon |
|----|------|----------|------------|
| `winback_discount` | Win-back com Desconto | atRisk | ✅ |
| `winback_wash_only` | Win-back Lavagem | atRisk | ✅ |
| `winback_dry_only` | Win-back Secagem | atRisk | ✅ |
| `welcome_new` | Boas-vindas | newCustomers | ✅ |
| `wallet_reminder` | Lembrete de Saldo | withWallet | ❌ |
| `promo_general` | Promoção Geral | all | ✅ |
| `promo_secagem` | Promoção Secagem | all | ✅ |
| `upsell_secagem` | Complete com Secagem | all | ✅ |

### Template Filtering

Both wizard and Messages tab filter templates by audience:

```javascript
// Returns templates matching audience + "all" templates
getTemplatesByAudience(selectedAudience)
```

---

## A/B Testing

### Configuration Flow

```
Step 2 (Template Selection)
    ↓
Template has discountDefaults?
    ↓ Yes
Show A/B Configuration Panel:
├── Discount % selector (10%, 15%, 20%, 25%, 30%)
├── Service type selector (Lavagem, Secagem, Ambos)
└── Coupon code display (auto-generated from config)
    ↓
Selected values stored with campaign:
├── discount_percent
├── coupon_code
└── service_type
```

### Coupon Resolution (`src/config/couponConfig.js`)

```javascript
getCouponForTemplate(templateId, discountPercent, serviceType)
// Returns: { code: 'VOLTE20', ... } or null
```

### Analytics

Campaign dashboard shows:
- **Discount Comparison:** Return rate by discount % (bar chart)
- **Service Comparison:** Return rate by service type
- **Best Performing:** Highlighted optimal configuration
- **Dynamic Insights:** AI-generated recommendations

---

## Key Features

### 1. Phone Validation

Only customers with valid Brazilian mobile phones are included:

```javascript
import { isValidBrazilianMobile } from '../../utils/phoneUtils';

// Filters: +55 (11-99) 9XXXX-XXXX format
customers.filter(c => isValidBrazilianMobile(c.phone))
```

### 2. Contact Tracking

Every sent message is tracked for effectiveness:

```javascript
await recordCampaignContact(campaignId, {
  customerId,
  phone,
  contactMethod: 'whatsapp',
  contactDate: new Date()
});
```

### 3. Scheduling

Campaigns can be scheduled for future execution:

```javascript
import { createBrazilDateTime } from '../utils/dateUtils';

// User selects date/time (always interpreted as Brazil time)
const scheduledDateTime = createBrazilDateTime('2025-12-25', '09:00');

await createScheduledCampaignAsync({
  scheduledFor: scheduledDateTime.toISOString(), // UTC for storage
  contentSid: template.twilioContentSid,
  contentVariables: { ... },
  recipients: [...]
});
```

**Timezone Handling:**

All scheduling uses Brazil/São Paulo timezone (`America/Sao_Paulo`), regardless of the user's browser location.

| Function | Purpose |
|----------|---------|
| `createBrazilDateTime(date, time)` | Creates Date from Brazil time input |
| `formatBrazilTime(date, options)` | Displays Date in Brazil timezone |
| `getBrazilNow()` | Gets current Brazil date/time |
| `isBrazilTimeFuture(date, time)` | Validates future Brazil time |

**Data Flow:**
```
User Input (Brazil time) → createBrazilDateTime() → ISO UTC → Supabase → Executor compares to UTC now
```

### 4. Error Handling

Sending errors are classified and handled:

- **Blacklisted:** Number opted out
- **Invalid:** Phone format incorrect
- **Rate Limited:** Twilio throttling
- **Failed:** Delivery failure

### 5. Dark Mode

All components support dark mode via Tailwind classes:

```jsx
className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
```

### 6. Mobile Responsive

- **CampaignFunnel:** Vertical on mobile, horizontal on desktop
- **Tables:** Horizontal scroll with `overflow-x-auto`
- **Touch targets:** Minimum 44px (iOS guidelines)
- **Form inputs:** `text-base` to prevent iOS zoom

---

## File References

| File | Purpose |
|------|---------|
| `src/views/Campaigns.jsx` | Main view component |
| `src/components/campaigns/*.jsx` | All campaign components |
| `src/components/campaigns/AutomationRules.jsx` | Automation configuration UI |
| `src/components/campaigns/AudienceFilterBuilder.jsx` | Custom audience filtering (v1.0) |
| `src/components/campaigns/NewCampaignModal.jsx` | Campaign creation wizard (v5.1) |
| `src/components/campaigns/CampaignDashboard.jsx` | Analytics dashboard (v2.6) |
| `src/config/messageTemplates.js` | Template definitions (v2.3) |
| `src/config/couponConfig.js` | Coupon/discount configuration |
| `src/utils/campaignService.js` | Backend service layer (v3.4) |
| `src/utils/apiService.js` | API client with delivery methods |
| `src/utils/phoneUtils.js` | Phone validation |
| `src/utils/dateUtils.js` | Brazil timezone utilities |
| `src/utils/supabaseUploader.js` | CSV upload with smart customer upsert (v1.1) |
| `src/contexts/DataFreshnessContext.jsx` | App-wide data refresh context (v1.0) |
| `src/App.jsx` | Smart data refresh system (v7.0) |
| `netlify/functions/twilio-whatsapp.js` | Twilio send API integration |
| `netlify/functions/twilio-webhook.js` | Twilio delivery status webhook (v1.1) |
| `netlify/functions/supabase-api.js` | Supabase API endpoints (v2.7) - duplicate check for manual inclusions |
| `netlify/functions/campaign-scheduler.js` | Scheduled campaign & automation executor (v2.9) - priority queue processing |
| `supabase/schema.sql` | Main database schema (v3.18) |
| `supabase/migrations/001_schema_cleanup.sql` | Schema cleanup migration |
| `supabase/migrations/002_auto_refresh_triggers.sql` | Auto-refresh triggers for customer metrics |
| `supabase/migrations/003_smart_customer_upsert.sql` | Smart customer upsert functions |
| `supabase/migrations/009_add_priority_source.sql` | Priority source column for manual inclusions |
| `src/components/modals/CustomerSegmentModal.jsx` | Customer details modal with "Incluir em Automação" button |
| `src/hooks/useActiveCampaigns.js` | Hook to fetch active automations by audience |

---

## Changelog Summary

| Version | Date | Changes |
|---------|------|---------|
| v3.6.0 | 2026-01-08 | **Phase 6 + Phase 8**: Dashboard enhancements (Status, Retornados, Período, Tempo columns), AudienceFilterBuilder for custom audience filtering, mode toggle in campaign wizard Step 1 |
| v3.5.0 | 2025-12-15 | **Manual Inclusion Priority Queue**: Users can add customers to automation queues via "Incluir em Automação" button, scheduler processes queued entries, eligibility cooldowns enforced, duplicate prevention |
| v3.4.0 | 2025-12-13 | **Auto-refresh Triggers + Smart Upsert**: Customer metrics auto-update on transaction insert, smart customer upsert prevents data regression, App.jsx v7.0 visibility-based refresh |
| v3.3.0 | 2025-12-13 | **Unified Manual Campaign Flow**: Manual campaigns now use same flow as automations (send first, then record), twilio_sid stored in campaign_contacts, delivery metrics work for manual campaigns |
| v3.2.0 | 2025-12-12 | **Enhanced Automation Controls (v6.0)**: Send time windows, day-of-week restrictions, daily rate limits, exclude recent visitors, min spend threshold, wallet balance max |
| v3.1.0 | 2025-12-12 | **Unified risk_level targeting**: risk_level column computed by Supabase, 100% consistency with frontend |
| v3.0.0 | 2025-12-12 | **Unified Automation-Campaign Model**: Automations create campaign records, unified tracking via SQL functions, AutomationRules v5.0 with campaign metrics display |
| v2.5.0 | 2025-12-11 | Delivery tracking via Twilio webhook, deprecated legacy CSV files, CampaignList v3.0 backend-only |
| v2.4.0 | 2025-12-11 | Automation enhancements: configurable cooldowns, stop dates, send limits, coupon configuration |
| v2.3.0 | 2025-12-11 | Brazil timezone scheduling, coupon config improvements |
| v2.2.0 | 2025-12-11 | Unified flows, Messages tab browse-only |
| v2.1.1 | 2025-12-11 | Fixed audience filters (English keys) |
| v2.1.0 | 2025-12-10 | RFM segment integration |
| v2.0.0 | 2025-12-10 | CampaignDashboard, Supabase migration |
| v1.3.0 | 2025-12-08 | Campaign effectiveness metrics |
| v1.2.0 | 2025-12-08 | Nova Campanha wizard |
| v1.1.0 | 2025-12-08 | Blacklist management |
| v1.0.0 | 2025-12-03 | Initial implementation |
