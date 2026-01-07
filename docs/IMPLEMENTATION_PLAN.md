# LAVPOP-BI UX Implementation Plan

**Generated:** January 2026
**Based on:** Persona UX Report (Roberto & Carla Silva cognitive walkthrough)
**Target UX Score:** 8.5/10 (current: 6.0/10)

---

## Executive Summary

This plan translates the 8 redesign priorities and 20+ quick wins from the UX report into 4 development phases. The goal is to transform LAVPOP-BI from a data display tool into an **actionable business command center** following the "Data → Insight → Action" pattern exemplified by the Weather flow.

---

## Phase 1: Quick Wins (Week 1-2)

Low-effort, high-impact changes that can be shipped immediately.

### 1.1 Terminology & Labels (Day 1)

**Files to modify:**
- `src/views/Intelligence.jsx` - Rename tab from "Inteligência" to "Planejamento"
- `src/components/social/BlacklistTab.jsx` - Rename "Lista Negra" to "Não Contactáveis"
- `src/views/Dashboard.jsx` - Default to "7 dias completos" instead of "Semana atual"

**Changes:**
```jsx
// Intelligence.jsx - Update nav label
// Before: label: "Inteligência"
// After:  label: "Planejamento"

// BlacklistTab.jsx - Update tab name and heading
// Before: "Lista Negra"
// After:  "Não Contactáveis"
```

**Acceptance criteria:**
- [ ] Intelligence tab shows "Planejamento" in all navigation
- [ ] Social Media blacklist tab shows "Não Contactáveis"
- [ ] Dashboard defaults to completed week data

---

### 1.2 Metric Tooltips (Day 1-2)

**Files to create:**
- `src/components/ui/MetricTooltip.jsx` - Reusable tooltip component with "?" icon

**Files to modify:**
- `src/components/ui/KPICard.jsx` - Add optional `tooltip` prop
- `src/views/Dashboard.jsx` - Add tooltips to all KPIs
- `src/views/Customers.jsx` - Add tooltips to RFM metrics
- `src/views/Intelligence.jsx` - Add tooltips to all scores

**Tooltip content map:**
| Metric | Tooltip Text |
|--------|--------------|
| Utilização | "Percentual de tempo que as máquinas ficaram em uso. Ideal: 70-85%" |
| RFM Score | "Pontuação baseada em Recência (última visita), Frequência (quantas vezes veio) e Monetário (quanto gastou)" |
| Retention Pulse | "Índice de 0-10 que mede quantos clientes estão voltando. Acima de 6 é bom." |
| R² (Weather) | "Acurácia da previsão. 0.73 = acertamos 7 de cada 10 previsões" |
| Engagement Rate | "De cada 100 seguidores, X curtem ou comentam seus posts" |

**Acceptance criteria:**
- [ ] "?" icon appears next to all technical metrics
- [ ] Hover/tap shows plain Portuguese explanation
- [ ] Tooltips are accessible (keyboard focusable, aria-describedby)

---

### 1.3 Status Color Badges (Day 2-3)

**Files to create:**
- `src/constants/metricThresholds.js` - Define good/warning/critical ranges

**Files to modify:**
- `src/components/ui/KPICard.jsx` - Add `status` prop (success/warning/danger)
- `src/utils/colorMapping.js` - Add status badge colors

**Threshold definitions:**
```javascript
// metricThresholds.js
export const THRESHOLDS = {
  utilizacao: { good: [70, 85], warning: [50, 70], critical: [0, 50] },
  retentionPulse: { good: [6, 10], warning: [4, 6], critical: [0, 4] },
  campaignReturn: { good: [15, 100], warning: [8, 15], critical: [0, 8] },
  engagementRate: { good: [3, 100], warning: [1.5, 3], critical: [0, 1.5] }
};

export const getMetricStatus = (metric, value) => {
  const t = THRESHOLDS[metric];
  if (!t) return 'neutral';
  if (value >= t.good[0] && value <= t.good[1]) return 'success';
  if (value >= t.warning[0] && value < t.warning[1]) return 'warning';
  return 'danger';
};
```

**KPICard changes:**
```jsx
// Add colored dot/border based on status
const statusColors = {
  success: 'border-l-4 border-l-emerald-500',
  warning: 'border-l-4 border-l-amber-500',
  danger: 'border-l-4 border-l-red-500',
  neutral: ''
};
```

**Acceptance criteria:**
- [ ] KPIs show green/yellow/red accent based on thresholds
- [ ] User immediately knows if metric is good or bad
- [ ] Colors are consistent with existing design system

---

### 1.4 Weather Plain Language (Day 3)

**Files to modify:**
- `src/components/weather/WeatherInsightCard.jsx` - Replace R² with plain text

**Changes:**
```jsx
// Before:
<span>R² = {correlation.toFixed(2)}</span>

// After:
const getAccuracyLabel = (r2) => {
  if (r2 >= 0.7) return { label: 'Alta', detail: 'acertamos 8/10 previsões' };
  if (r2 >= 0.5) return { label: 'Moderada', detail: 'acertamos 6/10 previsões' };
  return { label: 'Baixa', detail: 'previsões menos confiáveis' };
};

<span>Acurácia: {accuracy.label} ({accuracy.detail})</span>
```

**Acceptance criteria:**
- [ ] No R² displayed to end user
- [ ] Accuracy shown as "Alta/Moderada/Baixa" with explanation
- [ ] Tooltip available for technical users who want R² value

---

### 1.5 Directory Bulk Action Button (Day 3-4)

**Files to modify:**
- `src/views/Directory.jsx` - Add floating action button when filters applied

**Changes:**
```jsx
// Add floating button when filteredCustomers.length > 0
{filteredCustomers.length > 0 && activeFilters && (
  <motion.button
    initial={{ y: 100, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    className="fixed bottom-20 lg:bottom-8 right-4 z-50
               bg-gradient-to-r from-lavpop-blue to-lavpop-green
               text-white px-6 py-3 rounded-full shadow-lg
               flex items-center gap-2"
    onClick={() => navigate('/campaigns', {
      state: { prefilledCustomers: filteredCustomers.map(c => c.id) }
    })}
  >
    <Send className="w-5 h-5" />
    Enviar Campanha para {filteredCustomers.length} clientes
  </motion.button>
)}
```

**Acceptance criteria:**
- [ ] Button appears when any filter is active
- [ ] Shows count of filtered customers
- [ ] Navigates to Campaigns with customer list pre-filled
- [ ] Hidden when no filters active

---

### 1.6 Directory Smart Presets (Day 4)

**Files to modify:**
- `src/views/Directory.jsx` - Add preset buttons above filter panel

**Preset definitions:**
```jsx
const FILTER_PRESETS = [
  {
    id: 'at-risk-not-contacted',
    label: 'Em Risco Não Contactados',
    icon: AlertTriangle,
    filters: { risk: 'at_risk', contacted: 'exclude' }
  },
  {
    id: 'vip-inactive',
    label: 'VIPs Inativos (30+ dias)',
    icon: Star,
    filters: { segment: 'vip', daysSinceVisit: 30 }
  },
  {
    id: 'new-customers',
    label: 'Novos (< 90 dias)',
    icon: UserPlus,
    filters: { segment: 'new' }
  },
  {
    id: 'high-value-churning',
    label: 'Alto Valor em Risco',
    icon: TrendingDown,
    filters: { segment: ['vip', 'loyal'], risk: ['at_risk', 'churning'] }
  }
];
```

**Acceptance criteria:**
- [ ] 4 preset buttons visible above advanced filters
- [ ] Each preset applies multiple filters at once
- [ ] Active preset highlighted
- [ ] "Limpar Filtros" resets to no preset

---

### 1.7 Social Media Benchmarks (Day 5)

**Files to create:**
- `src/constants/socialBenchmarks.js` - Industry benchmark values

**Files to modify:**
- `src/components/social/WhatsAppTab.jsx` - Add benchmark comparisons
- `src/components/social/InstagramTab.jsx` - Add benchmark comparisons

**Benchmark data:**
```javascript
// socialBenchmarks.js
export const BENCHMARKS = {
  whatsapp: {
    deliveryRate: { value: 95, label: 'Setor' },
    readRate: { value: 70, label: 'Setor' },
    responseRate: { value: 15, label: 'Setor' }
  },
  instagram: {
    engagementRate: { value: 2.5, label: 'Setor' },
    reachRate: { value: 10, label: 'Setor' }
  },
  google: {
    averageRating: { value: 4.2, label: 'Lavanderias' },
    reviewsPerMonth: { value: 3, label: 'Médio' }
  }
};
```

**Display format:**
```
Você: 3.8% | Setor: 2.5% ✓ Acima da média
```

**Acceptance criteria:**
- [ ] All key metrics show benchmark comparison
- [ ] Green checkmark when above benchmark
- [ ] Red arrow when below benchmark
- [ ] Benchmark source shown (e.g., "Setor", "Médio")

---

### 1.8 Weather Action Button (Day 5)

**Files to modify:**
- `src/components/weather/WeatherBusinessImpact.jsx` - Add campaign button

**Changes:**
```jsx
// After rainy day insight, add action button
{dayImpact.impact < -10 && (
  <button
    onClick={() => navigate('/campaigns', {
      state: {
        preset: 'weather-discount',
        targetDate: dayImpact.date,
        suggestedDiscount: 15
      }
    })}
    className="mt-3 px-4 py-2 bg-lavpop-blue text-white rounded-lg
               flex items-center gap-2 text-sm font-medium"
  >
    <Send className="w-4 h-4" />
    Criar Campanha de Desconto
  </button>
)}
```

**Acceptance criteria:**
- [ ] Button appears for days with >10% negative impact
- [ ] Links to Campaign creation with pre-filled date and suggested discount
- [ ] Button uses brand colors and matches design system

---

### 1.9 Operations Mobile Column (Day 5)

**Files to modify:**
- `src/views/Operations.jsx` - Make R$/Uso visible on mobile

**Changes:**
```jsx
// Change from hidden on mobile to collapsible accordion row
<tr className="sm:hidden">
  <td colSpan="4" className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50">
    <details>
      <summary className="text-xs text-slate-500 cursor-pointer">
        Ver detalhes
      </summary>
      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
        <span>R$/Uso: {formatCurrency(machine.revenuePerUse)}</span>
        <span>Ciclos: {machine.cycles}</span>
      </div>
    </details>
  </td>
</tr>
```

**Acceptance criteria:**
- [ ] R$/Uso accessible on mobile via expandable row
- [ ] Doesn't add horizontal scroll
- [ ] Maintains table readability

---

### 1.10 WhatsApp Failure Breakdown (Day 6)

**Files to modify:**
- `src/components/social/WhatsAppTab.jsx` - Show failure reasons

**Changes:**
```jsx
// Add failure reason breakdown
const failureReasons = useMemo(() => ({
  invalidNumber: messages.filter(m => m.error === 'invalid_number').length,
  blocked: messages.filter(m => m.error === 'blocked').length,
  networkError: messages.filter(m => m.error === 'network').length,
  unknown: messages.filter(m => m.error && !['invalid_number', 'blocked', 'network'].includes(m.error)).length
}), [messages]);

// Display
{failures > 0 && (
  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm">
    <p className="font-medium text-red-700 dark:text-red-300 mb-2">
      {failures} mensagens não entregues:
    </p>
    <ul className="space-y-1 text-red-600 dark:text-red-400">
      {failureReasons.invalidNumber > 0 && (
        <li>• {failureReasons.invalidNumber} números inválidos</li>
      )}
      {failureReasons.blocked > 0 && (
        <li>• {failureReasons.blocked} clientes bloquearam</li>
      )}
      {failureReasons.networkError > 0 && (
        <li>• {failureReasons.networkError} erros de rede</li>
      )}
    </ul>
  </div>
)}
```

**Acceptance criteria:**
- [ ] Failure breakdown shown when failures > 0
- [ ] Clear Portuguese labels for each reason
- [ ] Actionable (e.g., "números inválidos" suggests data cleanup)

---

## Phase 2: High-Impact Priorities (Week 3-5)

Major features that significantly improve the UX score.

### 2.1 Goal Tracking System

**Priority:** 2 from UX report
**Impact:** HIGH (Trust & Action)
**Estimated effort:** 1 week

#### Database Changes

**File:** `supabase/migrations/xxx_add_goals.sql`

```sql
-- Add goal columns to app_settings
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS goal_revenue_monthly DECIMAL(10,2);
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS goal_revenue_weekly DECIMAL(10,2);
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS goal_new_customers_monthly INTEGER;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS goal_set_at TIMESTAMPTZ;
```

#### New Components

**File:** `src/components/ui/GoalProgressBar.jsx`

```jsx
/**
 * GoalProgressBar - Visual progress toward revenue/customer goals
 *
 * Props:
 * - current: number - Current value
 * - goal: number - Target value
 * - label: string - "Receita Mensal", "Novos Clientes", etc.
 * - format: 'currency' | 'number' | 'percent'
 * - size: 'sm' | 'md' | 'lg'
 */
```

**File:** `src/components/dashboard/GoalSetupModal.jsx`

```jsx
/**
 * GoalSetupModal - First-time goal setting wizard
 *
 * Steps:
 * 1. "Qual sua meta de receita mensal?" (currency input)
 * 2. "Quantos novos clientes você quer por mês?" (number input)
 * 3. Confirmation with calculated weekly targets
 */
```

#### View Integration

**Files to modify:**
- `src/views/Dashboard.jsx` - Add GoalProgressBar to header
- `src/views/Intelligence.jsx` - Show goal progress in quick stats
- `src/contexts/DataContext.jsx` - Fetch goals on app load

**Dashboard header mockup:**
```
┌────────────────────────────────────────────────────┐
│ Meta Mensal: R$ 12.000                             │
│ ████████████████████░░░░░░ R$ 9.600 (80%)         │
│ Faltam R$ 2.400 em 8 dias                          │
└────────────────────────────────────────────────────┘
```

**Acceptance criteria:**
- [ ] User can set monthly revenue and customer goals
- [ ] Progress bar shown on Dashboard header
- [ ] Green when on track, yellow when behind, red when critical
- [ ] "Faltam X dias" countdown shows urgency
- [ ] Goals persist across sessions

---

### 2.2 Dashboard Status Board

**Priority:** 8 from UX report
**Impact:** MEDIUM-HIGH (Action & Trust)
**Estimated effort:** 1 week

#### New Components

**File:** `src/components/dashboard/StatusBoard.jsx`

```jsx
/**
 * StatusBoard - At-a-glance business health indicator
 *
 * States:
 * - 🟢 TUDO OK - No urgent issues
 * - 🟡 ATENÇÃO - Some items need attention
 * - 🔴 AÇÃO URGENTE - Critical issues require action
 *
 * Aggregates alerts from:
 * - At-risk customer count (from customers table)
 * - Machine performance issues (from operations data)
 * - Pending campaign responses
 * - Weather impact warnings
 */
```

**File:** `src/components/dashboard/StatusAlert.jsx`

```jsx
/**
 * StatusAlert - Individual alert item with action button
 *
 * Props:
 * - type: 'warning' | 'danger' | 'info'
 * - icon: LucideIcon
 * - message: string
 * - action: { label: string, onClick: () => void }
 */
```

**Integration:**
```jsx
// Dashboard.jsx - Add at top of page
<StatusBoard
  alerts={[
    customerAtRiskCount > 5 && {
      type: 'danger',
      icon: Users,
      message: `${customerAtRiskCount} clientes em risco de churn`,
      action: {
        label: 'Enviar Campanha',
        onClick: () => navigate('/campaigns', { state: { preset: 'at-risk' }})
      }
    },
    underperformingMachines.length > 0 && {
      type: 'warning',
      icon: Settings,
      message: `${underperformingMachines[0].name} com desempenho 30% abaixo`,
      action: {
        label: 'Ver Detalhes',
        onClick: () => navigate('/operations')
      }
    }
  ].filter(Boolean)}
/>
```

**Acceptance criteria:**
- [ ] Status indicator visible immediately on Dashboard load
- [ ] Aggregates data from multiple sources
- [ ] Each alert has clear action button
- [ ] Status updates in real-time with data changes

---

### 2.3 Actionable Insight Component

**Priority:** 4 from UX report
**Impact:** HIGH (Action)
**Estimated effort:** 4 days

#### New Components

**File:** `src/components/ui/ActionableInsight.jsx`

```jsx
/**
 * ActionableInsight - Combines insight with specific action
 *
 * Pattern: "X is happening" → "Do Y to improve" → [ACTION BUTTON]
 *
 * Props:
 * - insight: { title: string, description: string, impact: 'high' | 'medium' | 'low' }
 * - entity: { type: 'machine' | 'customer' | 'campaign', id: string, name: string }
 * - action: { label: string, onClick: () => void, icon: LucideIcon }
 * - effort: 'low' | 'medium' | 'high' (shows effort badge)
 */

// Example usage:
<ActionableInsight
  insight={{
    title: 'Lavadora 3 com baixo desempenho',
    description: 'Receita 30% abaixo da média nas últimas 2 semanas',
    impact: 'high'
  }}
  entity={{ type: 'machine', id: 'washer-3', name: 'Lavadora 3' }}
  action={{
    label: 'Verificar Manutenção',
    onClick: () => navigate('/operations', { state: { highlight: 'washer-3' }}),
    icon: Wrench
  }}
  effort="low"
/>
```

**Integration points:**
- `src/views/Intelligence.jsx` - Replace generic recommendations
- `src/components/dashboard/StatusBoard.jsx` - Use for alerts
- `src/views/Operations.jsx` - Machine-specific recommendations

**Acceptance criteria:**
- [ ] All recommendations link to specific entities
- [ ] Action buttons navigate with pre-filled context
- [ ] Impact and effort badges help prioritization

---

### 2.4 Social Media Overview Tab

**Priority:** 6 from UX report
**Impact:** MEDIUM (Clarity & Action)
**Estimated effort:** 1 week

#### New Components

**File:** `src/components/social/SocialMediaOverview.jsx`

```jsx
/**
 * SocialMediaOverview - Unified view of all social platforms
 *
 * Sections:
 * 1. Priority Alerts (reviews to respond, failed messages)
 * 2. ROI Summary (total cost vs attributed revenue)
 * 3. Platform Health Cards (green/yellow/red indicators)
 * 4. Quick Actions (respond to review, retry failed messages)
 */

const SocialMediaOverview = () => {
  return (
    <div className="space-y-6">
      {/* Priority Alerts */}
      <section>
        <h3>Ações Necessárias</h3>
        <div className="space-y-2">
          {pendingReviews > 0 && (
            <AlertCard
              icon={MessageCircle}
              message={`${pendingReviews} avaliações aguardando resposta`}
              action={{ label: 'Responder', onClick: () => setActiveTab('google') }}
            />
          )}
          {failedMessages > 0 && (
            <AlertCard
              icon={AlertTriangle}
              message={`${failedMessages} mensagens WhatsApp falharam`}
              action={{ label: 'Ver Detalhes', onClick: () => setActiveTab('whatsapp') }}
            />
          )}
        </div>
      </section>

      {/* ROI Summary */}
      <section>
        <h3>Retorno sobre Investimento</h3>
        <div className="grid grid-cols-3 gap-4">
          <KPICard label="Investido" value={formatCurrency(totalCost)} color="cost" />
          <KPICard label="Retorno" value={formatCurrency(attributedRevenue)} color="revenue" />
          <KPICard label="ROI" value={`${roi.toFixed(0)}%`} color={roi > 100 ? 'profit' : 'cost'} />
        </div>
      </section>

      {/* Platform Health */}
      <section>
        <h3>Saúde das Plataformas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {platforms.map(p => (
            <PlatformHealthCard
              key={p.id}
              name={p.name}
              icon={p.icon}
              status={p.status}
              metric={p.mainMetric}
              onClick={() => setActiveTab(p.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
```

**Files to modify:**
- `src/views/SocialMedia.jsx` - Add Overview as default tab

**Acceptance criteria:**
- [ ] Overview is default tab when entering Social Media
- [ ] Shows priority actions at top
- [ ] ROI summary connects costs to revenue
- [ ] Each platform shows health status (green/yellow/red)
- [ ] Click on platform card navigates to detail tab

---

## Phase 3: Medium-Impact Priorities (Week 6-8)

Features that polish the experience and address remaining gaps.

### 3.1 Technical Language Simplification

**Priority:** 3 from UX report
**Impact:** HIGH (Clarity)
**Estimated effort:** 3 days

**Files to modify:**
- `src/views/Customers.jsx` - Rename RFM visualizations
- `src/views/Intelligence.jsx` - Replace business jargon
- `src/components/charts/*.jsx` - Update axis labels

**Terminology changes:**

| Component | Current | Proposed |
|-----------|---------|----------|
| RFM Scatter Plot | "RFM Scatter Plot" | "Mapa de Valor dos Clientes" |
| X axis | "Recency" | "Dias desde última visita" |
| Y axis | "Frequency" | "Vezes que visitou" |
| Retention Pulse | "Retention Pulse" | "Índice de Fidelização" |
| Churn Histogram | "Churn Histogram" | "Clientes em Risco de Sair" |
| MTD Revenue | "MTD Revenue" | "Receita do Mês até Hoje" |
| Break-even | "Break-even" | "Dias para cobrir custos" |
| Momentum | "Momentum" | "Tendência de crescimento" |

**Acceptance criteria:**
- [ ] No English terms visible to end user
- [ ] No unexplained acronyms (RFM, MTD, WoW)
- [ ] All business terms have tooltips with explanations

---

### 3.2 Campaign Pre-fill Integration

**Impact:** HIGH (Action)
**Estimated effort:** 4 days

**Files to modify:**
- `src/views/Campaigns.jsx` - Accept pre-filled state from navigation
- `src/components/campaigns/CampaignWizard.jsx` - Auto-populate fields

**Integration points:**
1. **From Directory:** Pre-fill customer list from filtered results
2. **From Weather:** Pre-fill date and discount percentage
3. **From Dashboard alerts:** Pre-fill at-risk customer segment
4. **From Operations:** Pre-fill with customers who haven't visited on slow days

**Route state structure:**
```javascript
navigate('/campaigns', {
  state: {
    // Customer targeting
    prefilledCustomers: ['id1', 'id2'], // Specific customer IDs
    segment: 'at_risk', // Or filter by segment

    // Campaign details
    suggestedDiscount: 15,
    targetDate: '2026-01-15',

    // Template
    preset: 'weather-discount' | 'at-risk-winback' | 'vip-reward'
  }
});
```

**Acceptance criteria:**
- [ ] Campaign wizard auto-populates from navigation state
- [ ] User can modify pre-filled values
- [ ] Clear indicator showing "Pré-preenchido com X clientes"

---

### 3.3 Historical Weather Accuracy

**Impact:** HIGH (Trust)
**Estimated effort:** 3 days

**Database changes:**
```sql
-- Store predictions for accuracy tracking
CREATE TABLE weather_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prediction_date DATE NOT NULL,
  predicted_revenue DECIMAL(10,2),
  predicted_impact_percent DECIMAL(5,2),
  actual_revenue DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**New component:**
**File:** `src/components/weather/WeatherAccuracyChart.jsx`

```jsx
/**
 * WeatherAccuracyChart - Shows predicted vs actual revenue
 *
 * Chart: Line chart with two series
 * - Blue line: Predicted revenue
 * - Green line: Actual revenue
 * - Gray area: Confidence interval
 *
 * Summary: "Nas últimas 4 semanas, acertamos 8 de 10 previsões"
 */
```

**Acceptance criteria:**
- [ ] Chart shows last 4 weeks of predictions vs actual
- [ ] Plain language accuracy summary
- [ ] Builds trust in weather predictions

---

### 3.4 Improved Mobile Tables

**Impact:** MEDIUM (Accessibility)
**Estimated effort:** 4 days

**Files to modify:**
- `src/views/Operations.jsx` - Card-based machine display on mobile
- `src/views/Directory.jsx` - Denser customer cards on mobile
- `src/components/customers/AtRiskTable.jsx` - Swipeable card layout

**Mobile table pattern:**
```jsx
// Desktop: Traditional table
// Mobile: Card-based layout with key info visible

<div className="hidden sm:block">
  <table>...</table>
</div>

<div className="sm:hidden space-y-3">
  {machines.map(machine => (
    <MachineCard
      key={machine.id}
      name={machine.name}
      status={machine.status}
      utilization={machine.utilization}
      revenue={machine.revenue}
      onDetailsClick={() => openDetails(machine)}
    />
  ))}
</div>
```

**Acceptance criteria:**
- [ ] No horizontal scroll on mobile
- [ ] Key information visible without expansion
- [ ] Details accessible via tap/expand
- [ ] Touch targets meet 44px minimum

---

## Phase 4: Strategic Improvements (Week 9+)

Longer-term features requiring significant development.

### 4.1 Guided Onboarding Wizard

**Estimated effort:** 2 weeks

**Purpose:** Capture user goals on first login to personalize dashboard.

**Flow:**
1. Welcome screen with Lavpop branding
2. "Qual sua meta de receita mensal?" (currency input with suggestion)
3. "Quantos novos clientes você quer por mês?" (number input)
4. "Qual horário você costuma verificar o sistema?" (time picker)
5. Confirmation with personalized dashboard preview

**Files to create:**
- `src/components/onboarding/OnboardingWizard.jsx`
- `src/components/onboarding/GoalStep.jsx`
- `src/components/onboarding/PreferenceStep.jsx`
- `src/contexts/OnboardingContext.jsx`

**Database changes:**
```sql
ALTER TABLE app_settings ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE app_settings ADD COLUMN preferred_check_time TIME;
```

---

### 4.2 Weekly Insights Digest

**Estimated effort:** 1 week

**Purpose:** Proactive summary sent via email/WhatsApp every Monday.

**Content:**
```
📊 Resumo Semanal - Lavpop BI

Receita: R$ 3.200 (↑5% vs semana anterior)
Meta mensal: 75% atingida ✓

⚠️ 8 clientes em risco - envie campanha
⚠️ Lavadora 3 precisa manutenção

🌧️ Previsão: Quarta chuvosa (-15% esperado)
💡 Dica: Campanha de desconto pode recuperar R$ 180

[Ver Dashboard →]
```

**Files to create:**
- `netlify/functions/weekly-digest.js` (scheduled function)
- `src/utils/digestGenerator.js` (content generation)

**Integration:**
- Twilio WhatsApp for message delivery
- Email via SendGrid/Resend as fallback

---

### 4.3 Action Hub (Notification Center)

**Estimated effort:** 2 weeks

**Purpose:** Consolidated view of all pending actions across the system.

**Categories:**
- 🔴 Urgente: Clientes em risco (>10), failed campaigns
- 🟡 Importante: Machine maintenance, reviews to respond
- 🟢 Sugestão: Slow day campaigns, VIP rewards
- ✅ Concluído: Recently completed actions

**Files to create:**
- `src/views/ActionHub.jsx`
- `src/components/actions/ActionCard.jsx`
- `src/components/actions/ActionFilter.jsx`
- `src/hooks/useActions.js`

**Navigation integration:**
- Bell icon in TopBar with badge count
- Accessible from "Mais" menu on mobile

---

### 4.4 Benchmarking Dashboard

**Estimated effort:** 3 weeks + data pipeline

**Purpose:** Compare performance against Lavpop network averages.

**Requirements:**
- Aggregate anonymized metrics from all Lavpop franchises
- Calculate percentile rankings
- Privacy-safe data sharing

**Display:**
```
Sua receita está no TOP 30% das lavanderias Lavpop
Taxa de retorno: 18% (ACIMA da média de 12%)
Utilização: 68% (DENTRO da média 65-75%)
```

**Infrastructure:**
- Supabase edge function for cross-franchise aggregation
- Weekly batch processing
- Opt-in data sharing toggle

---

## Success Metrics

Track these metrics to measure implementation success:

| Metric | Baseline | Phase 1 Target | Phase 2 Target | Final Target |
|--------|----------|----------------|----------------|--------------|
| Time to first action | Unknown | < 2 min | < 90 sec | < 60 sec |
| Tooltip interactions | 0 | > 20/week | > 50/week | > 100/week |
| Campaign completion rate | Unknown | +10% | +25% | > 80% |
| Daily active users | Baseline | +5% | +15% | +20% |
| User confidence (survey) | Unknown | 3/5 | 3.5/5 | > 4/5 |

---

## Implementation Checklist

### Phase 1 Week 1
- [ ] Terminology changes (1.1)
- [ ] Metric tooltips (1.2)
- [ ] Status color badges (1.3)
- [ ] Weather plain language (1.4)

### Phase 1 Week 2
- [ ] Directory bulk action (1.5)
- [ ] Directory presets (1.6)
- [ ] Social media benchmarks (1.7)
- [ ] Weather action button (1.8)
- [ ] Operations mobile column (1.9)
- [ ] WhatsApp failure breakdown (1.10)

### Phase 2 Week 3-4
- [ ] Goal tracking system (2.1)
- [ ] Dashboard status board (2.2)

### Phase 2 Week 5
- [ ] Actionable insight component (2.3)
- [ ] Social media overview tab (2.4)

### Phase 3 Week 6-7
- [ ] Technical language simplification (3.1)
- [ ] Campaign pre-fill integration (3.2)

### Phase 3 Week 8
- [ ] Historical weather accuracy (3.3)
- [ ] Improved mobile tables (3.4)

### Phase 4 Week 9+
- [ ] Guided onboarding wizard (4.1)
- [ ] Weekly insights digest (4.2)
- [ ] Action hub (4.3)
- [ ] Benchmarking dashboard (4.4)

---

## Dependencies & Risks

| Risk | Mitigation |
|------|------------|
| Goal setting requires database migration | Can be feature-flagged behind setting |
| Benchmarking requires cross-franchise data | Start with anonymous aggregates |
| Weekly digest requires Twilio/email integration | Already have Twilio setup |
| Mobile table redesign may break existing layouts | Test on multiple devices before release |

---

## Related Documents

- [Persona UX Report](./PERSONA_UX_REPORT.md) - Full cognitive walkthrough analysis
- [CLAUDE.md](../CLAUDE.md) - Project technical documentation

---

*Implementation plan based on persona cognitive walkthrough. All phases should be validated with real user testing before full rollout.*
