# Meta WhatsApp Business Manager - Templates Guide

This guide lists all WhatsApp message templates that need to be submitted to Meta for approval.
Each template includes the exact text to copy/paste into WhatsApp Business Manager.

## Overview

| Template Name | Meta Template ID | Category | Audience |
|---------------|------------------|----------|----------|
| Win-back com Desconto | `lavpop_winback_desconto` | MARKETING | Clientes Inativos |
| Win-back Lavagem | `lavpop_winback_lavagem` | MARKETING | Clientes Inativos |
| Boas-vindas | `lavpop_boasvindas` | MARKETING | Novos Clientes |
| Lembrete de Saldo | `lavpop_saldo_carteira` | UTILITY | Com Saldo |
| Promocao Geral | `lavpop_promocao` | MARKETING | Todos |
| Promocao Secagem | `lavpop_promo_secagem` | MARKETING | Todos |
| Complete com Secagem | `lavpop_complete_secagem` | MARKETING | Upsell |

---

## Template 1: Win-back com Desconto

**Template Name:** `lavpop_winback_desconto`
**Category:** MARKETING
**Language:** Portuguese (BR) - pt_BR

### Header (TEXT)
```
Sentimos sua falta! 🧺
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
Lavpop - Lavanderia Self-Service
```

### Buttons (Quick Reply)
1. `Quero usar!`
2. `Não tenho interesse`

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
Oferta especial em lavagem! 🧺
```

### Body
```
Olá {{1}}!

Sentimos sua falta! Temos uma oferta especial de *lavagem* para você:

🎁 *{{2}}% OFF* na sua próxima lavagem
📋 Cupom: *{{3}}*
📅 Válido até {{4}}

*Oferta válida apenas para lavadoras.

Esperamos você! 💙
```

### Footer
```
Lavpop - Lavanderia Self-Service
```

### Buttons (Quick Reply)
1. `Vou aproveitar!`

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

## Template 3: Boas-vindas

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

Dicas:
✨ Horários tranquilos: 7h-9h e 14h-16h
📱 Acompanhe suas lavagens pelo app

Qualquer dúvida, estamos aqui! 💙
```

### Footer
```
Lavpop - Lavanderia Self-Service
```

### Buttons (Quick Reply)
1. `Obrigado!`

### Variable Descriptions
| Variable | Description | Example |
|----------|-------------|---------|
| `{{1}}` | Nome do cliente | Ana |
| `{{2}}` | Código do cupom | BEMVINDO10 |
| `{{3}}` | Desconto (%) | 10 |
| `{{4}}` | Data de validade | 25/12 |

### POS Coupon Configuration
- Tipo: Cupom Desconto
- Permitido para: Lavadoras e Secadoras
- Ciclos por cliente: 1
- Pré-requisito: Lavou e Secou (deve ter completado primeira visita)

---

## Template 4: Lembrete de Saldo

**Template Name:** `lavpop_saldo_carteira`
**Category:** UTILITY
**Language:** Portuguese (BR) - pt_BR

### Header (TEXT)
```
Você tem créditos! 💰
```

### Body
```
Olá {{1}}!

Você tem *{{2}}* de crédito na sua carteira Lavpop!

Não deixe seu saldo parado. Use na sua próxima lavagem e economize.

🕐 Funcionamos das 7h às 21h, todos os dias.

Te esperamos! 💙
```

### Footer
```
Lavpop - Lavanderia Self-Service
```

### Buttons (Quick Reply)
1. `Vou usar!`

### Variable Descriptions
| Variable | Description | Example |
|----------|-------------|---------|
| `{{1}}` | Nome do cliente | Carlos |
| `{{2}}` | Saldo (R$) | R$ 45,00 |

### POS Coupon Configuration
- Nenhum cupom necessário (usa saldo da carteira)

---

## Template 5: Promocao Geral

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

Aproveite! 💙
```

### Footer
```
Lavpop - Lavanderia Self-Service
```

### Buttons (Quick Reply)
1. `Quero aproveitar!`

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

## Template 6: Promocao Secagem

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

Promoção especial de *secagem*:

🎁 *{{2}}% OFF* na secadora
📋 Cupom: *{{3}}*
📅 Válido até {{4}}

*Válido apenas para secadoras.

Aproveite! 💙
```

### Footer
```
Lavpop - Lavanderia Self-Service
```

### Buttons (Quick Reply)
1. `Vou aproveitar!`

### Variable Descriptions
| Variable | Description | Example |
|----------|-------------|---------|
| `{{1}}` | Nome do cliente | Roberto |
| `{{2}}` | Desconto (%) | 20 |
| `{{3}}` | Código do cupom | SECA20 |
| `{{4}}` | Data de validade | 15/12 |

### POS Coupon Configuration
- Tipo: Cupom Desconto
- Permitido para: **Secadoras** (apenas)
- Ciclos por cliente: 1
- Pré-requisito: Nenhum

---

## Template 7: Complete com Secagem (Upsell)

**Template Name:** `lavpop_complete_secagem`
**Category:** MARKETING
**Language:** Portuguese (BR) - pt_BR

### Header (TEXT)
```
Complete seu ciclo! ☀️
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
Lavpop - Lavanderia Self-Service
```

### Buttons (Quick Reply)
1. `Quero secar!`

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
4. **Buttons**: Add Quick Reply buttons as listed

### Step 4: Add Sample Values
When prompted for sample content, use the examples in the Variable Descriptions tables.

### Step 5: Submit for Review
Templates typically take 24-48 hours for approval.

---

## POS Coupon Setup Checklist

For each campaign, create matching coupons in the POS system:

| Campaign | Coupon Code | Discount | Valid For | Prerequisite |
|----------|-------------|----------|-----------|--------------|
| Win-back | VOLTE20 | 20% | Lav + Sec | None |
| Win-back Lavagem | LAVA25 | 25% | Lavadoras | None |
| Boas-vindas | BEMVINDO10 | 10% | Lav + Sec | Lavou e Secou |
| Promocao Geral | PROMO15 | 15% | Lav + Sec | None |
| Promocao Secagem | SECA20 | 20% | Secadoras | None |
| Upsell Secagem | SEQUE15 | 15% | Secadoras | Lavou |

Remember to set:
- **Validity period**: Match the campaign duration
- **Cycles per client**: Usually 1
- **Total cycles**: Set limit based on campaign budget
