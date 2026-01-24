# Meta WhatsApp Business Manager - Templates Guide

This guide lists all WhatsApp message templates that need to be submitted to Meta for approval.
Each template includes the exact text to copy/paste into WhatsApp Business Manager.

## Overview

| Template Name | Meta Template ID | Category | Audience |
|---------------|------------------|----------|----------|
| Win-back com Desconto | `lavpop_winback_desconto` | MARKETING | Clientes Inativos |
| Win-back Lavagem | `lavpop_winback_lavagem` | MARKETING | Clientes Inativos |
| Win-back Secagem | `lavpop_winback_secagem` | MARKETING | Clientes Inativos |
| Boas-vindas | `lavpop_boasvindas` | MARKETING | Novos Clientes |
| Lembrete de Saldo | `lavpop_saldo_carteira` | UTILITY | Com Saldo |
| Promocao Geral | `lavpop_promocao` | MARKETING | Todos |
| Promocao Secagem | `lavpop_promo_secagem` | MARKETING | Todos |
| Complete com Secagem | `lavpop_complete_secagem` | MARKETING | Upsell |
| Win-back Urgente (45d) | `lavpop_winback_urgente` | MARKETING | Clientes Criticos |
| Pos-Visita | `lavpop_pos_visita` | UTILITY | Todos (24h apos) |
| Cliente VIP | `lavpop_cliente_vip` | MARKETING | VIP/Frequente |
| Clima Perfeito | `lavpop_clima_perfeito` | MARKETING | Weather-triggered |
| Aniversário de Cadastro | `lavpop_aniversario_cadastro` | MARKETING | Anniversary |
| Última Chance | `lavpop_ultima_chance` | MARKETING | Churned (60-120d) |

---

## Template 1: Win-back com Desconto

**Template Name:** `lavpop_winback_desconto`
**Category:** MARKETING
**Language:** Portuguese (BR) - pt_BR

### Header (TEXT)
```
Sentimos sua falta!
```

### Body
```
Olá {{1}}!

Faz tempo que não nos vemos na Lavpop. Suas roupas merecem o melhor cuidado!

Preparamos uma oferta especial para você:
🎁 *{{2}}% de desconto* no seu próximo ciclo

Use o cupom *{{3}}* até {{4}}.

Te esperamos! 💙
```

### Footer
```
Lavpop Caxias do Sul - Lavanderia Autosserviço
```

### Buttons (Quick Reply)
| Button Text | Button ID |
|-------------|-----------|
| Quero usar! | `winback_accept` |
| Não tenho interesse | `optout` ⚠️ |

> ⚠️ **Opt-out Button**: When user clicks `optout`, add them to blacklist automatically.

### Variable Descriptions
| Variable | Description | Example |
|----------|-------------|---------|
| `{{1}}` | Nome do cliente | Maria |
| `{{2}}` | Desconto (%) | 20 |
| `{{3}}` | Código do cupom | VOLTE20 |
| `{{4}}` | Data de validade | 15/12 |

### POS Coupon Configuration
- Tipo: Cupom Desconto
- Permitido para: Lavadoras e Secadoras
- Ciclos por cliente: 1
- Pré-requisito: Nenhum

---

## Template 2: Win-back Lavagem

**Template Name:** `lavpop_winback_lavagem`
**Category:** MARKETING
**Language:** Portuguese (BR) - pt_BR

### Header (TEXT)
```
Oferta especial em lavagem!
```

### Body
```
Olá {{1}}!

Sentimos sua falta! Temos uma oferta especial para você:

🎁 *{{2}}% OFF* na sua próxima lavagem
📋 Cupom: *{{3}}*
📅 Válido até {{4}}

*Oferta válida apenas para lavadoras.

Te esperamos! 💙
```

### Footer
```
Lavpop Caxias do Sul - Lavanderia Autosserviço
```

### Buttons (Quick Reply)
| Button Text | Button ID |
|-------------|-----------|
| Vou aproveitar! | `lavagem_accept` |
| Não tenho interesse | `optout` ⚠️ |

> ⚠️ **Opt-out Button**: When user clicks `optout`, add them to blacklist automatically.

### Variable Descriptions
| Variable | Description | Example |
|----------|-------------|---------|
| `{{1}}` | Nome do cliente | João |
| `{{2}}` | Desconto (%) | 25 |
| `{{3}}` | Código do cupom | LAVA25 |
| `{{4}}` | Data de validade | 20/12 |

### POS Coupon Configuration
- Tipo: Cupom Desconto
- Permitido para: **Lavadoras** (apenas)
- Ciclos por cliente: 1
- Pré-requisito: Nenhum

---

## Template 3: Win-back Secagem

**Template Name:** `lavpop_winback_secagem`
**Category:** MARKETING
**Language:** Portuguese (BR) - pt_BR

### Header (TEXT)
```
Oferta especial em secagem! ☀️
```

### Body
```
Olá {{1}}!

Sentimos sua falta! Temos uma oferta especial de *secagem* para você:

🎁 *{{2}}% OFF* na sua próxima secagem
📋 Cupom: *{{3}}*
📅 Válido até {{4}}

*Oferta válida apenas para secadoras.

Te esperamos! 💙
```

### Footer
```
Lavpop Caxias do Sul - Lavanderia Autosserviço
```

### Buttons (Quick Reply)
| Button Text | Button ID |
|-------------|-----------|
| Vou aproveitar! | `secagem_wb_accept` |
| Não tenho interesse | `optout` ⚠️ |

> ⚠️ **Opt-out Button**: When user clicks `optout`, add them to blacklist automatically.

### Variable Descriptions
| Variable | Description | Example |
|----------|-------------|---------|
| `{{1}}` | Nome do cliente | Pedro |
| `{{2}}` | Desconto (%) | 25 |
| `{{3}}` | Código do cupom | SECA25 |
| `{{4}}` | Data de validade | 20/12 |

### POS Coupon Configuration
- Tipo: Cupom Desconto
- Permitido para: **Secadoras** (apenas)
- Ciclos por cliente: 1
- Pré-requisito: Nenhum

---

## Template 4: Boas-vindas

**Template Name:** `lavpop_boasvindas`
**Category:** MARKETING
**Language:** Portuguese (BR) - pt_BR

### Header (TEXT)
```
Bem-vindo à Lavpop! 🎉
```

### Body
```
Olá {{1}}!

Obrigado por escolher a Lavpop! Esperamos que sua experiência tenha sido incrível.

🎁 Na sua próxima visita, use o cupom *{{2}}* e ganhe *{{3}}% OFF*!

📅 Válido até {{4}}

Qualquer dúvida, estamos aqui! 💙
+55 54 98120-0363
```

### Footer
```
Lavpop Caxias do Sul - Lavanderia Autosserviço
```

### Buttons (Quick Reply)
| Button Text | Button ID |
|-------------|-----------|
| Obrigado! | `welcome_thanks` |
| Não quero receber | `optout` ⚠️ |

> ⚠️ **Opt-out Button**: When user clicks `optout`, add them to blacklist automatically.

### Variable Descriptions
| Variable | Description | Example |
|----------|-------------|---------|
| `{{1}}` | Nome do cliente | Ana |
| `{{2}}` | Código do cupom | BEM10 |
| `{{3}}` | Desconto (%) | 10 |
| `{{4}}` | Data de validade | 25/12 |

### POS Coupon Configuration
- Tipo: Cupom Desconto
- Permitido para: Lavadoras e Secadoras
- Ciclos por cliente: 1
- Pré-requisito: Lavou e Secou (deve ter completado primeira visita)

---

## Template 5: Lembrete de Saldo

**Template Name:** `lavpop_saldo_carteira`
**Category:** UTILITY
**Language:** Portuguese (BR) - pt_BR

### Header (TEXT)
```
Você tem saldo!
```

### Body
```
Olá {{1}}!

Você tem R${{2}} de saldo na sua carteira Lavpop!

Não deixe seu saldo parado. Use na sua próxima visita e economize.

🕐 Funcionamos das 8h às 23h, todos os dias.

Te esperamos! 💙
```

### Footer
```
Lavpop Caxias do Sul - Lavanderia Autosserviço
```

### Buttons (Quick Reply)
| Button Text | Button ID |
|-------------|-----------|
| Vou usar! | `wallet_accept` |
| Não quero receber | `optout` ⚠️ |

> ⚠️ **Opt-out Button**: When user clicks `optout`, add them to blacklist automatically.

### Variable Descriptions
| Variable | Description | Example |
|----------|-------------|---------|
| `{{1}}` | Nome do cliente | Carlos |
| `{{2}}` | Saldo (R$) | R$ 45,00 |

### POS Coupon Configuration
- Nenhum cupom necessário (usa saldo da carteira)

---

## Template 6: Promocao Geral

**Template Name:** `lavpop_promocao`
**Category:** MARKETING
**Language:** Portuguese (BR) - pt_BR

### Header (TEXT)
```
🎁 Promoção Especial!
```

### Body
```
Olá {{1}}!

Temos uma promoção especial para você:

🎁 *{{2}}% de desconto*
📋 Cupom: *{{3}}*
📅 Válido até {{4}}

Funcionamos das 8h às 23h, todos os dias.

Aproveite! 💙
```

### Footer
```
Lavpop Caxias do Sul - Lavanderia Autosserviço
```

### Buttons (Quick Reply)
| Button Text | Button ID |
|-------------|-----------|
| Vou aproveitar! | `promo_accept` |
| Não tenho interesse | `optout` ⚠️ |

> ⚠️ **Opt-out Button**: When user clicks `optout`, add them to blacklist automatically.

### Variable Descriptions
| Variable | Description | Example |
|----------|-------------|---------|
| `{{1}}` | Nome do cliente | Paula |
| `{{2}}` | Desconto (%) | 15 |
| `{{3}}` | Código do cupom | PROMO15 |
| `{{4}}` | Data de validade | 31/12 |

### POS Coupon Configuration
- Tipo: Cupom Desconto
- Permitido para: Lavadoras e Secadoras
- Ciclos por cliente: 1
- Pré-requisito: Nenhum

---

## Template 7: Promocao Secagem

**Template Name:** `lavpop_promo_secagem`
**Category:** MARKETING
**Language:** Portuguese (BR) - pt_BR

### Header (TEXT)
```
☀️ Promoção de Secagem!
```

### Body
```
Olá {{1}}!

Temos uma oferta especial para você:

🎁 *{{2}}% OFF* na sua próxima secagem
📋 Cupom: *{{3}}*
📅 Válido até {{4}}

*Oferta válida apenas para secadoras.

Funcionamos das 8h às 23h, todos os dias.

Aproveite! 💙
```

### Footer
```
Lavpop Caxias do Sul - Lavanderia Autosserviço
```

### Buttons (Quick Reply)
| Button Text | Button ID |
|-------------|-----------|
| Vou aproveitar! | `secagem_accept` |
| Não tenho interesse | `optout` ⚠️ |

> ⚠️ **Opt-out Button**: When user clicks `optout`, add them to blacklist automatically.

### Variable Descriptions
| Variable | Description | Example |
|----------|-------------|---------|
| `{{1}}` | Nome do cliente | Roberto |
| `{{2}}` | Desconto (%) | 20 |
| `{{3}}` | Código do cupom | PSEC20 |
| `{{4}}` | Data de validade | 15/12 |

### POS Coupon Configuration
- Tipo: Cupom Desconto
- Permitido para: **Secadoras** (apenas)
- Ciclos por cliente: 1
- Pré-requisito: Nenhum

---

## Template 8: Complete com Secagem (Upsell)

**Template Name:** `lavpop_complete_secagem`
**Category:** MARKETING
**Language:** Portuguese (BR) - pt_BR

### Header (TEXT)
```
Complete seu ciclo!
```

### Body
```
Olá {{1}}!

Vimos que você lavou suas roupas conosco. Que tal completar o ciclo com nossa secagem profissional?

🎁 *{{2}}% OFF* na secagem
📋 Cupom: *{{3}}*
📅 Válido até {{4}}

Roupas secas em minutos, sem preocupação! 💙
```

### Footer
```
Lavpop Caxias do Sul - Lavanderia Autosserviço
```

### Buttons (Quick Reply)
| Button Text | Button ID |
|-------------|-----------|
| Vou secar! | `upsell_accept` |
| Não tenho interesse | `optout` ⚠️ |

> ⚠️ **Opt-out Button**: When user clicks `optout`, add them to blacklist automatically.

### Variable Descriptions
| Variable | Description | Example |
|----------|-------------|---------|
| `{{1}}` | Nome do cliente | Fernanda |
| `{{2}}` | Desconto (%) | 15 |
| `{{3}}` | Código do cupom | SEQUE15 |
| `{{4}}` | Data de validade | 18/12 |

### POS Coupon Configuration
- Tipo: Cupom Desconto
- Permitido para: **Secadoras** (apenas)
- Ciclos por cliente: 1
- Pré-requisito: **Lavou** (cupom só ativa após cliente usar lavadora)

---

## Template 9: Win-back Urgente (45 dias)

**Template Name:** `lavpop_winback_urgente`
**Category:** MARKETING
**Language:** Portuguese (BR) - pt_BR
**Code ID:** `winback_critical`

> **Purpose:** Urgent win-back for customers at high risk of churning (45+ days inactive). More aggressive offer than standard win-back.

### Header (TEXT)
```
Sentimos muito sua falta!
```

### Body
```
Olá {{1}}!

Já faz {{2}} dias desde sua última visita na Lavpop. Queremos muito te ver de volta!

Preparamos uma oferta ESPECIAL só para você:
🎁 *{{3}}% de desconto* em qualquer serviço

Use o cupom *{{4}}* até {{5}}.

Não deixe essa oportunidade passar! 💙
```

### Footer
```
Lavpop Caxias do Sul - Lavanderia Autosserviço
```

### Buttons (Quick Reply)
| Button Text | Button ID |
|-------------|-----------|
| Quero voltar! | `critical_accept` |
| Não tenho interesse | `optout` |

### Variable Descriptions
| Variable | Description | Example |
|----------|-------------|---------|
| `{{1}}` | Nome do cliente | Roberto |
| `{{2}}` | Dias sem visita | 47 |
| `{{3}}` | Desconto (%) | 30 |
| `{{4}}` | Código do cupom | VOLTE30 |
| `{{5}}` | Data de validade | 20/12 |

### POS Coupon Configuration
- Tipo: Cupom Desconto
- Permitido para: Lavadoras e Secadoras
- Ciclos por cliente: 1
- Pré-requisito: Nenhum

### Automation Trigger
- **Trigger Type:** `days_since_visit`
- **Trigger Value:** 45
- **Priority:** Critical (highest urgency)

---

## Template 10: Pós-Visita (Agradecimento)

**Template Name:** `lavpop_pos_visita`
**Category:** UTILITY
**Language:** Portuguese (BR) - pt_BR
**Code ID:** `post_visit_thanks`

> **Purpose:** Thank customers after their visit and request feedback/Google review. Sent automatically 24 hours after visit.

### Header (TEXT)
```
Obrigado pela visita!
```

### Body
```
Olá {{1}}!

Obrigado por visitar a Lavpop! Esperamos que tenha gostado do nosso serviço.

A gente quer muito saber o que você achou! Conta pra gente como foi a sua experiência?

⭐ Avalie no Google: https://g.page/r/Cf2AHwdGi7vCEAE/review

Qualquer dúvida, estamos aqui! 💙
+55 54 98120-0363
```

### Footer
```
Lavpop Caxias do Sul - Lavanderia Autosserviço
```

### Buttons (Quick Reply)
| Button Text | Button ID |
|-------------|-----------|
| Bora avaliar! | `feedback_excellent` |
| Precisa melhorar | `feedback_improve` |
| Não quero receber | `optout` |

### Variable Descriptions
| Variable | Description | Example |
|----------|-------------|---------|
| `{{1}}` | Nome do cliente | Carla |

### POS Coupon Configuration
- Nenhum cupom necessário (apenas feedback)

### Automation Trigger
- **Trigger Type:** `hours_after_visit`
- **Trigger Value:** 24
- **Priority:** Medium

---

## Template 11: Cliente VIP (Fidelidade)

**Template Name:** `lavpop_cliente_vip`
**Category:** MARKETING
**Language:** Portuguese (BR) - pt_BR
**Code ID:** `rfm_loyalty_vip`

> **Purpose:** Monthly reward for VIP and Frequente customers. Offers 10% discount, 20% discount, or a Lavpop branded bag.

### Header (TEXT)
```
Você é especial para nós!
```

### Body
```
Olá {{1}}!

Você é um dos nossos clientes mais fiéis e queremos agradecer!

🎁 Presente exclusivo para você:
{{2}}

📅 Válido até {{3}}

Obrigado por fazer parte da família Lavpop! 💙
```

### Footer
```
Lavpop Caxias do Sul - Lavanderia Autosserviço
```

### Buttons (Quick Reply)
| Button Text | Button ID |
|-------------|-----------|
| Adorei! | `vip_accept` |
| Não quero receber | `optout` |

### Variable Descriptions
| Variable | Description | Example Values |
|----------|-------------|----------------|
| `{{1}}` | Nome do cliente | Maria |
| `{{2}}` | Descrição do presente | "10% OFF com cupom VIP10" / "20% OFF com cupom VIP20" / "Bolsa Lavpop exclusiva - retire na loja!" |
| `{{3}}` | Data de validade | 31/01 |

### POS Coupon Configuration
| Código | Desconto | Descrição |
|--------|----------|-----------|
| `VIP10` | 10% | 10% off all services |
| `VIP20` | 20% | 20% off all services |
| `BOLSA` | 0% | Branded bag redemption (tracked manually) |

### Automation Trigger
- **Trigger Type:** `rfm_segment`
- **Trigger Value:** `['VIP', 'Frequente']`
- **Cooldown:** 30 days (monthly)
- **Priority:** High

---

## Template 12: Clima Perfeito (Weather)

**Template Name:** `lavpop_clima_perfeito`
**Category:** MARKETING
**Language:** Portuguese (BR) - pt_BR
**Code ID:** `weather_promo`

> **Purpose:** Weather-triggered promotion when drying conditions are poor (high humidity, precipitation, or cloud cover).

### Header (TEXT)
```
Dia perfeito para lavar!
```

### Body
```
Olá {{1}}!

Com esse tempo, secar roupa em casa é complicado, né?

Aproveite nossa promoção especial de hoje:
🎁 *{{2}}% OFF* em qualquer serviço
📋 Cupom: *{{3}}*
📅 Válido até {{4}}

Venha aproveitar nossas secadoras profissionais! 💙
```

### Footer
```
Lavpop Caxias do Sul - Lavanderia Autosserviço
```

### Buttons (Quick Reply)
| Button Text | Button ID |
|-------------|-----------|
| Vou aproveitar! | `clima_accept` |
| Não tenho interesse | `optout` |

### Variable Descriptions
| Variable | Description | Example |
|----------|-------------|---------|
| `{{1}}` | Nome do cliente | João |
| `{{2}}` | Desconto (%) | 15 |
| `{{3}}` | Código do cupom | CLIMA15 |
| `{{4}}` | Data de validade | 20/01 |

### POS Coupon Configuration
| Código | Desconto | Descrição |
|--------|----------|-----------|
| `CLIMA10` | 10% | Weather promo 10% |
| `CLIMA15` | 15% | Weather promo 15% |
| `CLIMA20` | 20% | Weather promo 20% |

### Automation Trigger
- **Trigger Type:** `weather_drying_pain`
- **Weather Thresholds:** Humidity ≥75% OR Precipitation ≥5mm OR Cloud cover ≥80%
- **Cooldown:** 14 days (weather-specific)
- **Daily Limit:** 50 customers
- **Priority:** Medium

---

## Template 13: Aniversário de Cadastro

**Template Name:** `lavpop_aniversario_cadastro`
**Category:** MARKETING
**Language:** Portuguese (BR) - pt_BR
**Code ID:** `registration_anniversary`

> **Purpose:** Celebrate customer's registration anniversary using `data_cadastro`. Bypasses global cooldown (special occasion).

### Header (TEXT)
```
Feliz Aniversário de Cadastro!
```

### Body
```
Olá {{1}}!

Hoje faz {{2}} que você está com a gente! 🎂

Para comemorar, preparamos um presente especial:
🎁 *{{3}}% de desconto* no seu próximo ciclo
📋 Cupom: *{{4}}*
📅 Válido até {{5}}

Obrigado por confiar na Lavpop! 💙
```

### Footer
```
Lavpop Caxias do Sul - Lavanderia Autosserviço
```

### Buttons (Quick Reply)
| Button Text | Button ID |
|-------------|-----------|
| Que legal! | `aniver_accept` |
| Não quero receber | `optout` |

### Variable Descriptions
| Variable | Description | Example |
|----------|-------------|---------|
| `{{1}}` | Nome do cliente | Ana |
| `{{2}}` | Tempo de cadastro | "1 ano" / "2 anos" / "3 anos" |
| `{{3}}` | Desconto (%) | 20 |
| `{{4}}` | Código do cupom | ANIVER20 |
| `{{5}}` | Data de validade | 15/02 |

### POS Coupon Configuration (Tiered by Years)
| Código | Desconto | Anos | Descrição |
|--------|----------|------|-----------|
| `ANIVER15` | 15% | 1 ano | Anniversary 15% (1 year) |
| `ANIVER20` | 20% | 2 anos | Anniversary 20% (2 years) |
| `ANIVER25` | 25% | 3+ anos | Anniversary 25% (3+ years) |

### Automation Trigger
- **Trigger Type:** `registration_anniversary`
- **Window:** ±3 days from anniversary date
- **Cooldown:** 365 days (annual)
- **Bypass Global Cooldown:** Yes (special occasion)
- **Priority:** High

---

## Template 14: Última Chance (Churned Recovery)

**Template Name:** `lavpop_ultima_chance`
**Category:** MARKETING
**Language:** Portuguese (BR) - pt_BR
**Code ID:** `churned_recovery`

> **Purpose:** Aggressive win-back for churned customers (60-120 days inactive). Offers 50% discount or free cycle.

### Header (TEXT)
```
Não queremos te perder!
```

### Body
```
Olá {{1}}!

Faz {{2}} dias que não te vemos na Lavpop e sentimos muito sua falta!

Preparamos uma oferta EXCLUSIVA para você voltar:
🎁 {{3}}

Use o cupom *{{4}}* até {{5}}.

Esta é nossa melhor oferta - não deixe passar! 💙
```

### Footer
```
Lavpop Caxias do Sul - Lavanderia Autosserviço
```

### Buttons (Quick Reply)
| Button Text | Button ID |
|-------------|-----------|
| Quero voltar! | `ultima_accept` |
| Não tenho interesse | `optout` |

### Variable Descriptions
| Variable | Description | Example |
|----------|-------------|---------|
| `{{1}}` | Nome do cliente | Carlos |
| `{{2}}` | Dias sem visita | 75 |
| `{{3}}` | Descrição da oferta | "*50% OFF* em qualquer serviço" / "*1 CICLO GRÁTIS* (lavagem ou secagem)" |
| `{{4}}` | Código do cupom | VOLTA50 / GRATIS |
| `{{5}}` | Data de validade | 10/02 |

### POS Coupon Configuration
| Código | Desconto | Descrição |
|--------|----------|-----------|
| `VOLTA50` | 50% | 50% off all services |
| `GRATIS` | 100% | Free cycle (1 wash OR 1 dry, limit 1 per customer) |

### Automation Trigger
- **Trigger Type:** `churned_days`
- **Target:** Lost customers (60-120 days since last visit)
- **Cooldown:** 21 days (aggressive follow-up)
- **Daily Limit:** 30 customers
- **Min Total Spent:** R$50 (target valuable customers)
- **Priority:** Critical

---

## Button ID Reference

| Template | Button Text | Button ID | Action |
|----------|-------------|-----------|--------|
| Win-back Desconto | Quero usar! | `winback_accept` | Track engagement |
| Win-back Desconto | Não tenho interesse | `optout` | **Add to blacklist** |
| Win-back Lavagem | Vou aproveitar! | `lavagem_accept` | Track engagement |
| Win-back Lavagem | Não tenho interesse | `optout` | **Add to blacklist** |
| Win-back Secagem | Vou aproveitar! | `secagem_wb_accept` | Track engagement |
| Win-back Secagem | Não tenho interesse | `optout` | **Add to blacklist** |
| Boas-vindas | Obrigado! | `welcome_thanks` | Track engagement |
| Boas-vindas | Não quero receber | `optout` | **Add to blacklist** |
| Lembrete Saldo | Vou usar! | `wallet_accept` | Track engagement |
| Lembrete Saldo | Não quero receber | `optout` | **Add to blacklist** |
| Promocao Geral | Quero aproveitar! | `promo_accept` | Track engagement |
| Promocao Geral | Não tenho interesse | `optout` | **Add to blacklist** |
| Promocao Secagem | Vou aproveitar! | `secagem_accept` | Track engagement |
| Promocao Secagem | Não tenho interesse | `optout` | **Add to blacklist** |
| Complete Secagem | Quero secar! | `upsell_accept` | Track engagement |
| Complete Secagem | Não tenho interesse | `optout` | **Add to blacklist** |
| Win-back Urgente | Quero voltar! | `critical_accept` | Track engagement |
| Win-back Urgente | Não tenho interesse | `optout` | **Add to blacklist** |
| Pós-Visita | Excelente! | `feedback_excellent` | Track positive feedback |
| Pós-Visita | Precisa melhorar | `feedback_improve` | Track improvement feedback |
| Pós-Visita | Não quero receber | `optout` | **Add to blacklist** |
| Cliente VIP | Adorei! | `vip_accept` | Track VIP engagement |
| Cliente VIP | Não quero receber | `optout` | **Add to blacklist** |
| Clima Perfeito | Vou aproveitar! | `clima_accept` | Track weather promo engagement |
| Clima Perfeito | Não tenho interesse | `optout` | **Add to blacklist** |
| Aniversário | Que legal! | `aniver_accept` | Track anniversary engagement |
| Aniversário | Não quero receber | `optout` | **Add to blacklist** |
| Última Chance | Quero voltar! | `ultima_accept` | Track churned recovery engagement |
| Última Chance | Não tenho interesse | `optout` | **Add to blacklist** |

> **Note**: The `optout` button ID is used across all templates for opt-out functionality. When your webhook receives this ID, automatically add the phone number to the blacklist. This is a **Meta requirement** for marketing messages.

---

## Submission Instructions

### Step 1: Access WhatsApp Business Manager
1. Go to [Meta Business Suite](https://business.facebook.com)
2. Navigate to **WhatsApp Manager** > **Message Templates**

### Step 2: Create New Template
1. Click **Create Template**
2. Select **Category** (MARKETING or UTILITY)
3. Enter **Template Name** exactly as shown (e.g., `lavpop_winback_desconto`)
4. Select **Language**: Portuguese (BR)

### Step 3: Add Content
1. **Header**: Select "Text" and paste the header text
2. **Body**: Paste the body text with `{{1}}`, `{{2}}`, etc. placeholders
3. **Footer**: Paste the footer text
4. **Buttons**: Add Quick Reply buttons with:
   - **Button text**: The user-visible text (e.g., "Quero usar!")
   - **Button ID**: The webhook identifier (e.g., `winback_accept`) - lowercase, no spaces/accents

### Step 4: Add Sample Values
When prompted for sample content, use the examples in the Variable Descriptions tables.

### Step 5: Submit for Review
Templates typically take 24-48 hours for approval.

---

## POS Coupon Configuration

### Strategy: Comprehensive A/B Testing Coupon Matrix

The campaign system supports **dynamic discount selection** for A/B testing effectiveness analysis. A complete set of 24 coupon codes covers all discount levels across all campaign types.

### Naming Convention (Customer-Friendly)

| Prefix | Meaning | Campaign Type | Service Type |
|--------|---------|---------------|--------------|
| `VOLTE` | "Volte" (come back) | Win-back | Todos (Wash + Dry) |
| `LAVA` | "Lava" (wash) | Win-back | Só Lavagem |
| `SECA` | "Seca" (dry) | Win-back | Só Secagem |
| `BEM` | "Bem-vindo" (welcome) | Welcome | Todos |
| `PROMO` | Promocional | Promo | Todos |
| `PSEC` | Promo Secagem | Promo | Só Secagem |
| `SEQUE` | "Seque" (dry) | Upsell | Só Secagem |

**Number suffix = discount percentage** (e.g., VOLTE20 = 20% off)

---

### Complete 24-Coupon Matrix

#### Win-back Coupons (12 total)
*For customers who haven't returned recently*

| Código | Desconto | Permitido Para | Válido se já | Descrição |
|--------|----------|----------------|--------------|-----------|
| `VOLTE15` | 15% | Lavadoras e Secadoras | - | Win-back 15% todos os serviços |
| `VOLTE20` | 20% | Lavadoras e Secadoras | - | Win-back 20% todos os serviços |
| `VOLTE25` | 25% | Lavadoras e Secadoras | - | Win-back 25% todos os serviços |
| `VOLTE30` | 30% | Lavadoras e Secadoras | - | Win-back 30% todos os serviços |
| `LAVA15` | 15% | Lavadoras | - | Win-back 15% só lavagem |
| `LAVA20` | 20% | Lavadoras | - | Win-back 20% só lavagem |
| `LAVA25` | 25% | Lavadoras | - | Win-back 25% só lavagem |
| `LAVA30` | 30% | Lavadoras | - | Win-back 30% só lavagem |
| `SECA15` | 15% | Secadoras | - | Win-back 15% só secagem |
| `SECA20` | 20% | Secadoras | - | Win-back 20% só secagem |
| `SECA25` | 25% | Secadoras | - | Win-back 25% só secagem |
| `SECA30` | 30% | Secadoras | - | Win-back 30% só secagem |

#### Welcome Coupons (3 total)
*For first-time or new customers*

| Código | Desconto | Permitido Para | Válido se já | Descrição |
|--------|----------|----------------|--------------|-----------|
| `BEM10` | 10% | Lavadoras e Secadoras | Lavou e Secou | Boas-vindas 10% |
| `BEM15` | 15% | Lavadoras e Secadoras | Lavou e Secou | Boas-vindas 15% |
| `BEM20` | 20% | Lavadoras e Secadoras | Lavou e Secou | Boas-vindas 20% |

#### Promotional Coupons (6 total)
*For seasonal/special promotions*

| Código | Desconto | Permitido Para | Válido se já | Descrição |
|--------|----------|----------------|--------------|-----------|
| `PROMO10` | 10% | Lavadoras e Secadoras | - | Promoção 10% geral |
| `PROMO15` | 15% | Lavadoras e Secadoras | - | Promoção 15% geral |
| `PROMO20` | 20% | Lavadoras e Secadoras | - | Promoção 20% geral |
| `PROMO25` | 25% | Lavadoras e Secadoras | - | Promoção 25% geral |
| `PSEC15` | 15% | Secadoras | - | Promoção 15% secagem |
| `PSEC20` | 20% | Secadoras | - | Promoção 20% secagem |

#### Upsell Coupons (3 total)
*For customers who only washed - encourage drying*

| Código | Desconto | Permitido Para | Válido se já | Descrição |
|--------|----------|----------------|--------------|-----------|
| `SEQUE10` | 10% | Secadoras | Lavou | Upsell 10% secagem |
| `SEQUE15` | 15% | Secadoras | Lavou | Upsell 15% secagem |
| `SEQUE20` | 20% | Secadoras | Lavou | Upsell 20% secagem |

#### VIP/Loyalty Coupons (3 total) - NEW v6.3
*Monthly rewards for VIP and Frequente customers*

| Código | Desconto | Permitido Para | Válido se já | Descrição |
|--------|----------|----------------|--------------|-----------|
| `VIP10` | 10% | Lavadoras e Secadoras | - | VIP reward 10% |
| `VIP20` | 20% | Lavadoras e Secadoras | - | VIP reward 20% |
| `BOLSA` | 0% (brinde) | N/A | - | Bolsa Lavpop exclusiva (retirar na loja) |

#### Weather Coupons (3 total) - NEW v6.3
*Weather-triggered promotions for high drying pain days*

| Código | Desconto | Permitido Para | Válido se já | Descrição |
|--------|----------|----------------|--------------|-----------|
| `CLIMA10` | 10% | Lavadoras e Secadoras | - | Weather promo 10% |
| `CLIMA15` | 15% | Lavadoras e Secadoras | - | Weather promo 15% |
| `CLIMA20` | 20% | Lavadoras e Secadoras | - | Weather promo 20% |

#### Anniversary Coupons (3 total) - NEW v6.3
*Registration anniversary celebration (tiered by years)*

| Código | Desconto | Permitido Para | Válido se já | Descrição |
|--------|----------|----------------|--------------|-----------|
| `ANIVER15` | 15% | Lavadoras e Secadoras | - | Aniversário 15% (1 ano) |
| `ANIVER20` | 20% | Lavadoras e Secadoras | - | Aniversário 20% (2 anos) |
| `ANIVER25` | 25% | Lavadoras e Secadoras | - | Aniversário 25% (3+ anos) |

#### Churned Recovery Coupons (2 total) - NEW v6.3
*Aggressive recovery for lost customers (60-120 days)*

| Código | Desconto | Permitido Para | Válido se já | Descrição |
|--------|----------|----------------|--------------|-----------|
| `VOLTA50` | 50% | Lavadoras e Secadoras | - | Recuperação 50% (agressivo) |
| `GRATIS` | 100% | Lavadoras OU Secadoras | - | 1 ciclo grátis (limite 1 por cliente) |

---

### Step-by-Step POS Setup Checklist

For **each coupon** in the matrix above:

```
☐ 1. Tipo de cupom: Cupom Parceria
☐ 2. Código do cupom: [code from table]
☐ 3. Desconto: [percentage]%
☐ 4. Data de expiração: 31/12/2026 (ou deixar vazio)
☐ 5. Quantidade total de ciclos: 0 (ilimitado)
☐ 6. Quantidade de ciclos por cliente: 1
☐ 7. Permitido para: [Lavadoras, Secadoras, ou ambos]
☐ 8. O cupom é válido somente se o cliente já: [Lavou / Lavou e Secou / -]
☐ 9. Dias desde a compra (validade): 1
☐ 10. Válido das: 00:00 até 23:59
☐ 11. Todos os dias: ✓ Selecionado
☐ 12. Adicionar loja: [selecionar loja(s)]
☐ 13. Ativo?: ✓ Ativar
```

### POS Creation Order (Priority)

**Create these first (most commonly used):**
1. `VOLTE20` - Main win-back
2. `BEM10` - Welcome new customers
3. `PROMO15` - General promo
4. `SEQUE15` - Upsell dryer

**Then add variants for A/B testing:**
5. `VOLTE15`, `VOLTE25`, `VOLTE30` - Win-back discount variants
6. `LAVA20`, `LAVA25` - Wash-only variants
7. `BEM15`, `BEM20` - Welcome variants
8. `SEQUE10`, `SEQUE20` - Upsell variants

**Add remaining as needed:**
9. All remaining codes from the matrix

---

### Handling Expiration Dates in Messages

The `{{4}}` variable (expiration date) in messages is calculated dynamically:
- Current app behavior: **7 days from send date**
- Example: Campaign sent on 08/12 → message shows "válido até 15/12"

This date is **psychological urgency** only. The actual coupon control is:
- 1 use per customer (enforced by POS)
- Customer can only use once, regardless of date

---

### Template-to-Coupon Mapping

| Template | Default Discount | Default Coupon | Available Options |
|----------|------------------|----------------|-------------------|
| Win-back com Desconto | 20% | `VOLTE20` | 15-30%, Todos/Lavagem/Secagem |
| Win-back Lavagem | 25% | `LAVA25` | 15-30%, Só Lavagem |
| Win-back Secagem | 25% | `SECA25` | 15-30%, Só Secagem |
| **Win-back Urgente (45d)** | 30% | `VOLTE30` | 25-35%, Todos |
| Boas-vindas | 10% | `BEM10` | 10-20%, Todos |
| Lembrete de Saldo | - | *(sem cupom)* | - |
| Promoção Geral | 15% | `PROMO15` | 10-25%, Todos/Secagem |
| Promoção Secagem | 20% | `PSEC20` | 15-20%, Só Secagem |
| Complete com Secagem | 15% | `SEQUE15` | 10-20%, Só Secagem |
| **Pós-Visita** | - | *(sem cupom)* | - |

### A/B Testing Examples

**Test 1: Discount Level Effectiveness**
- Campaign A: Win-back with `VOLTE15` (15% off)
- Campaign B: Win-back with `VOLTE25` (25% off)
- Compare: Return rate vs. Net Return Value

**Test 2: Service-Specific vs. General**
- Campaign A: `VOLTE20` (all services, 20%)
- Campaign B: `LAVA25` (wash only, 25%)
- Compare: Which generates more total revenue

**Test 3: Welcome Discount Optimization**
- Campaign A: New customers get `BEM10` (10%)
- Campaign B: New customers get `BEM15` (15%)
- Compare: Second visit rate and customer lifetime value
