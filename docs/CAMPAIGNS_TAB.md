# Campaigns Tab - Technical Documentation

**Version:** 2.5.0
**Last Updated:** 2025-12-11
**File:** `src/views/Campaigns.jsx`

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

The Campaigns tab is the WhatsApp marketing and customer retention center for Lavpop. It enables:

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
1. **Audience** - Select target segment
2. **Template** - Choose message + configure A/B testing
3. **Preview** - Review personalized message
4. **Send** - Execute or schedule campaign

### BlacklistManager (`blacklist` tab)

**Purpose:** Manage opt-outs and undeliverable numbers

**Features:**
- View blacklisted numbers with reasons
- Manual add/remove
- Twilio sync for automatic updates
- Export/import functionality

### AutomationRules (`auto` tab)

**Purpose:** Configure automated campaigns that trigger based on customer behavior

**File:** `src/components/campaigns/AutomationRules.jsx`

**Features:**
- Enable/disable individual automation rules
- Configure cooldown periods (days between sends to same customer)
- Set stop dates (automation end date in Brazil timezone)
- Define maximum send limits per automation
- Configure coupon codes and validity periods

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
  coupon_validity_days: 7      // Days shown in message as expiration
}
```

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
netlify/functions/campaign-scheduler.js (runs every 15 minutes)
    ↓
For each enabled automation_rule:
├── Check valid_until (if set, skip if passed)
├── Check max_total_sends (if set, skip if reached)
├── Query eligible customers:
│   ├── Match trigger criteria (e.g., inactive 30+ days)
│   ├── Has valid Brazilian mobile
│   ├── Not in blacklist
│   └── Not contacted within cooldown_days
├── For each eligible customer:
│   ├── Send WhatsApp via Twilio
│   ├── Increment total_sends_count
│   └── Record in automation_sends table
└── Log execution results
```

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
| `campaigns` | Campaign metadata + A/B config |
| `campaign_contacts` | Recipients per campaign |
| `contact_tracking` | Message delivery + engagement |
| `campaign_effectiveness` | Aggregated performance |
| `blacklist` | Opt-outs and blocked numbers |
| `scheduled_campaigns` | Future campaigns |
| `automation_rules` | Automation configuration |
| `automation_sends` | Automation execution history |
| `webhook_events` | Twilio delivery status events |

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
| `created_at` | TIMESTAMPTZ | Rule creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last modification timestamp |

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
| `src/config/messageTemplates.js` | Template definitions |
| `src/config/couponConfig.js` | Coupon/discount configuration |
| `src/utils/campaignService.js` | Backend service layer (v3.4) |
| `src/utils/apiService.js` | API client with delivery methods |
| `src/utils/phoneUtils.js` | Phone validation |
| `src/utils/dateUtils.js` | Brazil timezone utilities |
| `netlify/functions/twilio-whatsapp.js` | Twilio send API integration |
| `netlify/functions/twilio-webhook.js` | Twilio delivery status webhook (v1.1) |
| `netlify/functions/supabase-api.js` | Supabase API endpoints (v2.2) |
| `netlify/functions/campaign-scheduler.js` | Scheduled campaign & automation executor |
| `supabase/migrations/add_automation_controls.sql` | Automation schema migration |

---

## Changelog Summary

| Version | Date | Changes |
|---------|------|---------|
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
