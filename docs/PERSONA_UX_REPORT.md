# LAVPOP-BI Persona UX Report
**Generated:** January 2026
**Methodology:** Persona-based cognitive walkthrough of 5 core user flows

---

## Primary Persona: Roberto & Carla Silva

### Demographics
| Attribute | Value |
|-----------|-------|
| **Age** | 45 & 42 |
| **Location** | Porto Alegre, RS, Brazil |
| **Role** | Co-owners, Lavpop franchise laundromat |
| **Business tenure** | 18 months |
| **Tech comfort** | Medium-high |
| **Business analytics knowledge** | Beginner (learning RFM, churn, CLV) |

### Psychographic Profile
- **Background:** Former corporate professionals who invested life savings
- **Primary anxiety:** Revenue uncertainty, silent customer churn
- **Core need:** Trustworthy metrics → clear actions → revenue increase
- **Usage pattern:** Quick morning checks (mobile), deep dives 2-3x/week (desktop)

### Jobs To Be Done
1. "Is my business healthy TODAY?" → Quick pulse check
2. "Are customers coming back?" → Retention visibility
3. "What should I do to improve revenue?" → Actionable insights
4. "Am I making the right marketing investments?" → ROI clarity

---

## Flow-by-Flow Evaluation

### Scoring Summary

| Flow | Clarity | Trust | Actionability | Overall |
|------|---------|-------|---------------|---------|
| Dashboard (Visão Geral) | 3/5 | 4/5 | 2/5 | **3.0** |
| Customers (Clientes) | 2/5 | 3/5 | 4/5 | **3.0** |
| Campaigns (Campanhas) | 4/5 | 4/5 | 5/5 | **4.3** |
| Intelligence (Inteligência) | 3/5 | 3/5 | 4/5 | **3.3** |
| Operations (Operações) | 5/5 | 5/5 | 5/5 | **5.0** |

**Overall UX Score: 6.5/10**

---

### Flow 1: Dashboard (Visão Geral)

**Roberto's Verdict:** "Dá um panorama rápido, mas não me diz se estou indo bem ou mal, nem o que fazer."

**Key Pain Points:**
- "Semana atual" vs "7 dias completos" toggle confuses users
- WoW trend badges (+5%, -2%) lack comparison context
- "Utilização 68%" meaningless without explanation
- No goal/target reference to benchmark performance
- Sparklines too small on mobile

**Delights:**
- Operating cycles chart clearly shows daily patterns
- Revenue number prominently displayed
- Mobile layout works well

**Critical Missing:**
- Goal comparison ("You're R$ 800 from monthly target")
- Plain language metric explanations
- Suggested actions based on data

---

### Flow 2: Customers (Clientes)

**Roberto's Verdict:** "A tabela de risco é super útil e os botões são perfeitos, mas tem muita coisa técnica que não entendo."

**Key Pain Points:**
- RFM Scatter Plot too technical ("Recency vs Frequency" axes)
- "Retention Pulse 7.2" lacks scale context (7.2 of what?)
- Churn histogram abstract ("30-45 days until churn")
- Swipe-to-WhatsApp hidden gesture, not discoverable

**Delights:**
- At-Risk table with direct Call/WhatsApp buttons (GOLD)
- Color-coded urgency (red = critical)
- "Sem contato" badge helps prioritization
- Batch selection for multi-customer messaging

**Critical Missing:**
- Plain language RFM explanation via tooltips
- Success rate context ("35% of contacted customers returned")
- Template suggestions for outreach messages

---

### Flow 3: Campaigns (Campanhas)

**Roberto's Verdict:** "Finalmente algo que me diz O QUE FAZER! Os insights são claros e os botões funcionam."

**Key Pain Points:**
- Multi-step wizard feels lengthy
- "Entregues" vs "Enviadas" discrepancy unexplained
- Cannot easily resend/duplicate past campaigns
- Optimal send time not suggested

**Delights:**
- "Desconto Ideal 15%" provides ready decision
- "Taxa de Retorno 18.5%" simple, understandable metric
- Campaign status (Lidas: 22) provides visibility
- Clear "Nova Campanha" CTA

**Critical Missing:**
- Campaign cost transparency
- Failure reason breakdown
- Simplified ROI display

---

### Flow 4: Intelligence (Inteligência)

**Roberto's Verdict:** "Tem informações valiosas mas muito complexo. Gosto das projeções e ações recomendadas, mas precisa ser mais simples."

**Key Pain Points:**
- Priority Matrix dimensions too abstract
- "Break-even", "Momentum" jargon intimidating
- Score 6.8/10 methodology opaque
- Projections lack confidence explanation

**Delights:**
- End-of-month revenue projection helps planning
- Gap vs previous period with recovery options
- "Ações Recomendadas" with impact/effort tags
- Tooltip help icons where present

**Critical Missing:**
- Plain Portuguese for all business terms
- More specific action recommendations
- Benchmark comparisons (vs Lavpop network average)

---

### Flow 5: Operations (Operações)

**Roberto's Verdict:** "ISSO É ÚTIL! Tabela clara, vejo problemas na hora, sei o que fazer. Melhor tela do sistema."

**Key Pain Points:**
- R$/Uso column hidden on mobile
- "Utilização 68%" still lacks context
- Heatmap color scheme counterintuitive
- Capacity calculation detail overwhelming

**Delights:**
- Machine table with green/red highlighting
- Best/Worst badges immediately visible
- Peak hours clearly identified
- Day-of-week pattern chart actionable

**Critical Missing:**
- Maintenance alerts with last service date
- Week-over-week comparison
- Demand forecast for next day

---

## Top 5 Redesign Priorities

### Priority 1: Add Goal Tracking Everywhere
**Impact:** HIGH (Trust & Action)
**Effort:** Medium

**Problem:** Roberto sees numbers but doesn't know if they're good or bad.

**Solution:**
- Dashboard: "Você fez R$ 3.200 (80% da meta semanal)"
- Intelligence: Progress bar toward monthly goal
- Visual indicators: green check when on track, red alert when behind

**Implementation:**
1. Add `goal_revenue_monthly` to `app_settings` table
2. Create `GoalProgressBar` component
3. Show on Dashboard header and Intelligence quick stats

---

### Priority 2: Simplify Technical Language
**Impact:** HIGH (Clarity)
**Effort:** Low

**Problem:** "RFM", "MTD", "Break-even" alienate non-analyst users.

**Solution:**
| Current | Proposed |
|---------|----------|
| RFM Scatter Plot | Mapa de Clientes por Valor |
| MTD Revenue | Receita do Mês até Hoje |
| Break-even | Ponto de Equilíbrio (dias para cobrir custos) |
| Retention Pulse | Índice de Fidelização |
| Churn Histogram | Clientes em Risco de Sair |

**Implementation:**
1. Update all label strings in components
2. Add `<Tooltip>` wrappers with plain explanations
3. Create glossary modal accessible from help icon

---

### Priority 3: Make Actions More Specific
**Impact:** HIGH (Action)
**Effort:** Medium

**Problem:** "Aumentar eficiência operacional" is too vague.

**Solution:**
- Link recommendations to specific entities:
  - "Lavadora 3 está 30% abaixo. Verifique manutenção."
  - "Envie campanha de 15% desconto para 8 clientes em risco"
- Provide one-click action buttons alongside recommendations

**Implementation:**
1. Enhance `calculatePriorityMatrix` to reference specific machines/customers
2. Add action buttons that navigate to Campaigns/Operations with pre-filters
3. Create `ActionableInsight` component with built-in CTA

---

### Priority 4: Add Context to All Metrics
**Impact:** MEDIUM (Trust & Clarity)
**Effort:** Low

**Problem:** "Utilização 68%" means nothing without baseline.

**Solution:**
- Add ranges: "68% (Ideal: 70-85%)"
- Add comparisons: "vs 65% semana passada"
- Color-code: green/yellow/red based on thresholds

**Implementation:**
1. Define thresholds in `src/constants/metricThresholds.js`
2. Update KPICard to accept `range` and `status` props
3. Apply status coloring consistently

---

### Priority 5: Dashboard "Status Board" Section
**Impact:** MEDIUM (Action & Trust)
**Effort:** Medium

**Problem:** Dashboard shows data but no synthesis or priorities.

**Solution:**
Add hero section at top:
```
🟢 TUDO OK | 🟡 ATENÇÃO NECESSÁRIA | 🔴 AÇÃO URGENTE

Hoje: Receita no ritmo, máquinas funcionando bem.
⚠️ 8 clientes em risco - envie campanha esta semana [Enviar]
⚠️ Lavadora 3 com desempenho baixo [Ver Detalhes]
```

**Implementation:**
1. Create `StatusBoard` component
2. Aggregate alerts from customer metrics, operations metrics
3. Display at top of Dashboard with action buttons

---

## Quick Wins (< 1 week each)

| Fix | Effort | Impact |
|-----|--------|--------|
| Add "?" tooltip icons to all metrics | 1 day | High |
| Default to "7 dias completos" (hide current week) | 1 hour | Medium |
| Add success/warning color badges to KPIs | 2 days | High |
| Pre-fill campaign wizard with best defaults | 1 day | High |
| Show R$/Uso on mobile (collapsible) | 3 hours | Medium |
| Rename "Inteligência" to "Planejamento" | 5 min | Low |

---

## Strategic Improvements (> 2 weeks each)

### 1. Guided Onboarding Wizard
**Effort:** 2 weeks

First login flow:
1. "Qual sua meta de receita mensal?"
2. "Quantos novos clientes você quer por mês?"
3. "Qual dia/horário você prefere ver relatórios?"

Customize dashboard to show progress toward THEIR goals.

### 2. Weekly Insights Digest
**Effort:** 1 week

Every Monday 8am via email/WhatsApp:
- "Resumo da semana: Receita R$ 3.200 (↑5%)"
- "8 clientes em risco"
- Direct action links

### 3. Action Hub
**Effort:** 2 weeks

Consolidated notification center:
- 🔴 Urgente: Clientes em risco
- 🟡 Importante: Manutenção necessária
- 🟢 Sugestão: Promoção para dia fraco

Each with one-click action.

### 4. Benchmarking Dashboard
**Effort:** 3 weeks + data pipeline

Show percentile comparisons:
- "Sua receita está no TOP 30% das lavanderias Lavpop"
- "Sua taxa de retorno (18%) está ACIMA da média (12%)"

---

## Success Metrics

Track these post-redesign:

| Metric | Current Baseline | Target |
|--------|------------------|--------|
| Time to first action | Unknown | < 60 seconds |
| Help tooltip interactions | 0 | > 50/week |
| Campaign creation completion rate | Unknown | > 80% |
| Daily active users | Unknown | +20% |
| User-reported confidence (survey) | Unknown | > 4/5 |

---

## Appendix: Roberto's Final Quote

> "Eu quero abrir o sistema e em 30 segundos saber: (1) Estou ganhando dinheiro? (2) Tem algum problema urgente? (3) O que devo fazer hoje? O sistema tem MUITA informação boa, mas precisa ser mais direto. Eu não sou analista de dados - sou dono de lavanderia tentando pagar as contas e crescer o negócio. Me dê os números importantes com contexto claro e me diga exatamente o que fazer. A tela de Operações é perfeita nesse sentido - o resto deveria ser assim também."

---

*Report generated through persona-based cognitive walkthrough methodology. Roberto & Carla Silva represent the primary user archetype for LAVPOP-BI.*
