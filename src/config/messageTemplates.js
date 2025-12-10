// messageTemplates.js v2.0
// Centralized WhatsApp message templates configuration
// Meta Business API compliant with {{1}}, {{2}} placeholder format
//
// These templates are designed to work with Lavpop POS coupon system:
// - Discount percentage coupons (see couponConfig.js for full list)
// - Valid for: Lavadoras, Secadoras, or both
// - Prerequisite: None, Lavou, Secou, Lavou e Secou
// - Per-customer and total cycle limits
// - Date/time validity windows
//
// IMPORTANT: Templates must be submitted to Meta WhatsApp Business Manager
// for approval before use. Use the exact text from 'metaSubmission' field.

// Import coupon configuration for dynamic discount/coupon selection
import {
  CAMPAIGN_TYPES,
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS,
  getDiscountOptionsForTemplate,
  getServiceOptionsForTemplate,
  getCouponForTemplate,
  getDefaultCouponForTemplate,
  TEMPLATE_CAMPAIGN_TYPE_MAP
} from './couponConfig.js';

// Re-export for convenience
export {
  CAMPAIGN_TYPES,
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS,
  getDiscountOptionsForTemplate,
  getServiceOptionsForTemplate,
  getCouponForTemplate,
  getDefaultCouponForTemplate
};

// Icons for UI (imported where used)
// Heart, Sparkles, Wallet, Gift, Calendar, Clock from 'lucide-react'

/**
 * Template Variables Mapping:
 * {{1}} = Customer first name
 * {{2}} = Discount percentage OR wallet balance
 * {{3}} = Coupon code
 * {{4}} = Expiration date (formatted as DD/MM)
 * {{5}} = Service type (lavagem, secagem, etc.) - when applicable
 */

export const MESSAGE_TEMPLATES = [
  // ============================================================
  // WIN-BACK TEMPLATES (Clientes Inativos)
  // ============================================================
  {
    id: 'winback_discount',
    name: 'Win-back com Desconto',
    category: 'MARKETING',
    campaignType: CAMPAIGN_TYPES.WINBACK,
    icon: 'Heart',
    color: 'amber',
    description: 'Para clientes que não visitam há 30+ dias',
    audience: 'atRisk',

    // Meta template name (must match what's registered in Business Manager)
    metaTemplateName: 'lavpop_winback_desconto',
    twilioContentSid: 'HX58267edb5948cfa0fb5c3ba73ea1d767',

    // Template structure
    header: {
      type: 'TEXT',
      text: 'Sentimos sua falta! 🧺'
    },

    body: `Olá {{1}}!

Faz tempo que não nos vemos na Lavpop. Suas roupas merecem o melhor cuidado!

Preparamos uma oferta especial para você:
🎁 *{{2}}% de desconto* no seu próximo ciclo

Use o cupom *{{3}}* até {{4}}.

Te esperamos! 💙`,

    footer: 'Lavpop - Lavanderia Self-Service',

    // Variables configuration
    variables: [
      { position: 1, key: 'customerName', label: 'Nome do cliente', source: 'customer.name', fallback: 'Cliente' },
      { position: 2, key: 'discount', label: 'Desconto (%)', source: 'campaign.discount', fallback: '20' },
      { position: 3, key: 'couponCode', label: 'Código do cupom', source: 'campaign.couponCode', required: true },
      { position: 4, key: 'expirationDate', label: 'Data de validade', source: 'campaign.expirationDate', format: 'DD/MM' }
    ],

    // Buttons (optional)
    buttons: [
      { type: 'QUICK_REPLY', text: 'Quero usar!' },
      { type: 'QUICK_REPLY', text: 'Não tenho interesse' }
    ],

    // For Meta submission - exact text to copy
    metaSubmission: {
      header: 'Sentimos sua falta! 🧺',
      body: 'Olá {{1}}!\n\nFaz tempo que não nos vemos na Lavpop. Suas roupas merecem o melhor cuidado!\n\nPreparamos uma oferta especial para você:\n🎁 *{{2}}% de desconto* no seu próximo ciclo\n\nUse o cupom *{{3}}* até {{4}}.\n\nTe esperamos! 💙',
      footer: 'Lavpop - Lavanderia Self-Service',
      buttons: ['Quero usar!', 'Não tenho interesse']
    },

    // POS coupon configuration suggestion
    posCouponConfig: {
      tipo: 'Cupom Desconto',
      permitidoPara: 'Lavadoras e Secadoras',
      ciclosPorCliente: 1,
      validoSomenteSe: null // No prerequisite
    },

    // A/B Testing defaults (stored with campaign for analysis)
    discountDefaults: {
      discountPercent: 20,
      couponCode: 'VOLTE20',
      serviceType: 'both' // 'wash', 'dry', or 'both'
    }
  },

  {
    id: 'winback_wash_only',
    name: 'Win-back Lavagem',
    category: 'MARKETING',
    campaignType: CAMPAIGN_TYPES.WINBACK,
    icon: 'Heart',
    color: 'blue',
    description: 'Desconto apenas para lavagem (mais margem)',
    audience: 'atRisk',

    metaTemplateName: 'lavpop_winback_lavagem',
    twilioContentSid: 'HX6d31e447e8af840368b1167573ec9d6f',

    header: {
      type: 'TEXT',
      text: 'Oferta especial em lavagem! 🧺'
    },

    body: `Olá {{1}}!

Sentimos sua falta! Temos uma oferta especial de *lavagem* para você:

🎁 *{{2}}% OFF* na sua próxima lavagem
📋 Cupom: *{{3}}*
📅 Válido até {{4}}

*Oferta válida apenas para lavadoras.

Esperamos você! 💙`,

    footer: 'Lavpop - Lavanderia Self-Service',

    variables: [
      { position: 1, key: 'customerName', label: 'Nome do cliente', source: 'customer.name', fallback: 'Cliente' },
      { position: 2, key: 'discount', label: 'Desconto (%)', source: 'campaign.discount', fallback: '25' },
      { position: 3, key: 'couponCode', label: 'Código do cupom', source: 'campaign.couponCode', required: true },
      { position: 4, key: 'expirationDate', label: 'Data de validade', source: 'campaign.expirationDate', format: 'DD/MM' }
    ],

    buttons: [
      { type: 'QUICK_REPLY', text: 'Vou aproveitar!' },
      { type: 'QUICK_REPLY', text: 'Não tenho interesse' }
    ],

    metaSubmission: {
      header: 'Oferta especial em lavagem! 🧺',
      body: 'Olá {{1}}!\n\nSentimos sua falta! Temos uma oferta especial de *lavagem* para você:\n\n🎁 *{{2}}% OFF* na sua próxima lavagem\n📋 Cupom: *{{3}}*\n📅 Válido até {{4}}\n\n*Oferta válida apenas para lavadoras.\n\nEsperamos você! 💙',
      footer: 'Lavpop - Lavanderia Self-Service',
      buttons: ['Vou aproveitar!', 'Não tenho interesse']
    },

    posCouponConfig: {
      tipo: 'Cupom Desconto',
      permitidoPara: 'Lavadoras',
      ciclosPorCliente: 1,
      validoSomenteSe: null
    },

    discountDefaults: {
      discountPercent: 25,
      couponCode: 'LAVA25',
      serviceType: 'wash'
    }
  },

  {
    id: 'winback_dry_only',
    name: 'Win-back Secagem',
    category: 'MARKETING',
    campaignType: CAMPAIGN_TYPES.WINBACK,
    icon: 'Sun',
    color: 'orange',
    description: 'Desconto apenas para secagem (mais margem)',
    audience: 'atRisk',

    metaTemplateName: 'lavpop_winback_secagem',
    twilioContentSid: 'HX8c3003c64f58c33aaf4c3cbef308cefd',

    header: {
      type: 'TEXT',
      text: 'Oferta especial em secagem! ☀️'
    },

    body: `Olá {{1}}!

Sentimos sua falta! Temos uma oferta especial de *secagem* para você:

🎁 *{{2}}% OFF* na sua próxima secagem
📋 Cupom: *{{3}}*
📅 Válido até {{4}}

*Oferta válida apenas para secadoras.

Esperamos você! 💙`,

    footer: 'Lavpop - Lavanderia Self-Service',

    variables: [
      { position: 1, key: 'customerName', label: 'Nome do cliente', source: 'customer.name', fallback: 'Cliente' },
      { position: 2, key: 'discount', label: 'Desconto (%)', source: 'campaign.discount', fallback: '25' },
      { position: 3, key: 'couponCode', label: 'Código do cupom', source: 'campaign.couponCode', required: true },
      { position: 4, key: 'expirationDate', label: 'Data de validade', source: 'campaign.expirationDate', format: 'DD/MM' }
    ],

    buttons: [
      { type: 'QUICK_REPLY', text: 'Vou aproveitar!' },
      { type: 'QUICK_REPLY', text: 'Não tenho interesse' }
    ],

    metaSubmission: {
      header: 'Oferta especial em secagem! ☀️',
      body: 'Olá {{1}}!\n\nSentimos sua falta! Temos uma oferta especial de *secagem* para você:\n\n🎁 *{{2}}% OFF* na sua próxima secagem\n📋 Cupom: *{{3}}*\n📅 Válido até {{4}}\n\n*Oferta válida apenas para secadoras.\n\nEsperamos você! 💙',
      footer: 'Lavpop - Lavanderia Self-Service',
      buttons: ['Vou aproveitar!', 'Não tenho interesse']
    },

    posCouponConfig: {
      tipo: 'Cupom Desconto',
      permitidoPara: 'Secadoras',
      ciclosPorCliente: 1,
      validoSomenteSe: null
    },

    discountDefaults: {
      discountPercent: 25,
      couponCode: 'SECA25',
      serviceType: 'dry'
    }
  },

  // ============================================================
  // WELCOME TEMPLATES (Novos Clientes)
  // ============================================================
  {
    id: 'welcome_new',
    name: 'Boas-vindas',
    category: 'MARKETING',
    campaignType: CAMPAIGN_TYPES.WELCOME,
    icon: 'Sparkles',
    color: 'purple',
    description: 'Para novos clientes após primeira visita',
    audience: 'newCustomers',

    metaTemplateName: 'lavpop_boasvindas',
    twilioContentSid: 'HX2ae8ce2a72d92866fd28516aca9d76c3',

    header: {
      type: 'TEXT',
      text: 'Bem-vindo à Lavpop! 🎉'
    },

    body: `Olá {{1}}!

Obrigado por escolher a Lavpop! Esperamos que sua experiência tenha sido incrível.

🎁 Na sua próxima visita, use o cupom *{{2}}* e ganhe *{{3}}% OFF*!

📅 Válido até {{4}}

Dicas:
✨ Horários tranquilos: 7h-9h e 14h-16h
📱 Acompanhe suas lavagens pelo app

Qualquer dúvida, estamos aqui! 💙`,

    footer: 'Lavpop - Lavanderia Self-Service',

    variables: [
      { position: 1, key: 'customerName', label: 'Nome do cliente', source: 'customer.name', fallback: 'Cliente' },
      { position: 2, key: 'couponCode', label: 'Código do cupom', source: 'campaign.couponCode', fallback: 'BEM10' },
      { position: 3, key: 'discount', label: 'Desconto (%)', source: 'campaign.discount', fallback: '10' },
      { position: 4, key: 'expirationDate', label: 'Data de validade', source: 'campaign.expirationDate', format: 'DD/MM' }
    ],

    buttons: [
      { type: 'QUICK_REPLY', text: 'Obrigado!' },
      { type: 'QUICK_REPLY', text: 'Não quero receber' }
    ],

    metaSubmission: {
      header: 'Bem-vindo à Lavpop! 🎉',
      body: 'Olá {{1}}!\n\nObrigado por escolher a Lavpop! Esperamos que sua experiência tenha sido incrível.\n\n🎁 Na sua próxima visita, use o cupom *{{2}}* e ganhe *{{3}}% OFF*!\n\n📅 Válido até {{4}}\n\nDicas:\n✨ Horários tranquilos: 7h-9h e 14h-16h\n📱 Acompanhe suas lavagens pelo app\n\nQualquer dúvida, estamos aqui! 💙',
      footer: 'Lavpop - Lavanderia Self-Service',
      buttons: ['Obrigado!', 'Não quero receber']
    },

    posCouponConfig: {
      tipo: 'Cupom Desconto',
      permitidoPara: 'Lavadoras e Secadoras',
      ciclosPorCliente: 1,
      totalCiclos: 0, // Unlimited for welcome
      validoSomenteSe: 'Lavou e Secou' // Must have completed first visit
    },

    discountDefaults: {
      discountPercent: 10,
      couponCode: 'BEM10',
      serviceType: 'both'
    }
  },

  // ============================================================
  // WALLET REMINDER (Clientes com Saldo)
  // ============================================================
  {
    id: 'wallet_reminder',
    name: 'Lembrete de Saldo',
    category: 'UTILITY',
    campaignType: null, // No coupon - wallet reminder only
    icon: 'Wallet',
    color: 'emerald',
    description: 'Para clientes com saldo na carteira digital',
    audience: 'withWallet',

    metaTemplateName: 'lavpop_saldo_carteira',
    twilioContentSid: 'HXa1f6a3f3c586acd36cb25a2d98a766fc',

    header: {
      type: 'TEXT',
      text: 'Você tem créditos! 💰'
    },

    body: `Olá {{1}}!

Você tem *{{2}}* de crédito na sua carteira Lavpop!

Não deixe seu saldo parado. Use na sua próxima lavagem e economize.

🕐 Funcionamos das 7h às 21h, todos os dias.

Te esperamos! 💙`,

    footer: 'Lavpop - Lavanderia Self-Service',

    variables: [
      { position: 1, key: 'customerName', label: 'Nome do cliente', source: 'customer.name', fallback: 'Cliente' },
      { position: 2, key: 'walletBalance', label: 'Saldo (R$)', source: 'customer.walletBalance', format: 'currency' }
    ],

    buttons: [
      { type: 'QUICK_REPLY', text: 'Vou usar!' },
      { type: 'QUICK_REPLY', text: 'Não quero receber' }
    ],

    metaSubmission: {
      header: 'Você tem créditos! 💰',
      body: 'Olá {{1}}!\n\nVocê tem *{{2}}* de crédito na sua carteira Lavpop!\n\nNão deixe seu saldo parado. Use na sua próxima lavagem e economize.\n\n🕐 Funcionamos das 7h às 21h, todos os dias.\n\nTe esperamos! 💙',
      footer: 'Lavpop - Lavanderia Self-Service',
      buttons: ['Vou usar!', 'Não quero receber']
    },

    posCouponConfig: null, // No coupon needed - uses wallet balance

    discountDefaults: {
      discountPercent: 0, // No discount - reminder only
      couponCode: null,
      serviceType: null
    }
  },

  // ============================================================
  // PROMOTIONAL TEMPLATES (Campanhas Sazonais)
  // ============================================================
  {
    id: 'promo_general',
    name: 'Promoção Geral',
    category: 'MARKETING',
    campaignType: CAMPAIGN_TYPES.PROMO,
    icon: 'Gift',
    color: 'rose',
    description: 'Promoção para todos os clientes',
    audience: 'all',

    metaTemplateName: 'lavpop_promocao',
    twilioContentSid: 'HX32e16980d7a2e88895bdddd9cd029f90',

    header: {
      type: 'TEXT',
      text: '🎁 Promoção Especial!'
    },

    body: `Olá {{1}}!

Temos uma promoção especial para você:

🎁 *{{2}}% de desconto*
📋 Cupom: *{{3}}*
📅 Válido até {{4}}

Aproveite! 💙`,

    footer: 'Lavpop - Lavanderia Self-Service',

    variables: [
      { position: 1, key: 'customerName', label: 'Nome do cliente', source: 'customer.name', fallback: 'Cliente' },
      { position: 2, key: 'discount', label: 'Desconto (%)', source: 'campaign.discount', fallback: '15' },
      { position: 3, key: 'couponCode', label: 'Código do cupom', source: 'campaign.couponCode', required: true },
      { position: 4, key: 'expirationDate', label: 'Data de validade', source: 'campaign.expirationDate', format: 'DD/MM' }
    ],

    buttons: [
      { type: 'QUICK_REPLY', text: 'Quero aproveitar!' },
      { type: 'QUICK_REPLY', text: 'Não tenho interesse' }
    ],

    metaSubmission: {
      header: '🎁 Promoção Especial!',
      body: 'Olá {{1}}!\n\nTemos uma promoção especial para você:\n\n🎁 *{{2}}% de desconto*\n📋 Cupom: *{{3}}*\n📅 Válido até {{4}}\n\nAproveite! 💙',
      footer: 'Lavpop - Lavanderia Self-Service',
      buttons: ['Quero aproveitar!', 'Não tenho interesse']
    },

    posCouponConfig: {
      tipo: 'Cupom Desconto',
      permitidoPara: 'Lavadoras e Secadoras',
      ciclosPorCliente: 1,
      validoSomenteSe: null
    },

    discountDefaults: {
      discountPercent: 15,
      couponCode: 'PROMO15',
      serviceType: 'both'
    }
  },

  {
    id: 'promo_secagem',
    name: 'Promoção Secagem',
    category: 'MARKETING',
    campaignType: CAMPAIGN_TYPES.PROMO,
    icon: 'Gift',
    color: 'orange',
    description: 'Desconto apenas para secagem',
    audience: 'all',

    metaTemplateName: 'lavpop_promo_secagem',
    twilioContentSid: 'HXb7e5791f7738f73741b99ef39363deb9',

    header: {
      type: 'TEXT',
      text: '☀️ Promoção de Secagem!'
    },

    body: `Olá {{1}}!

Promoção especial de *secagem*:

🎁 *{{2}}% OFF* na secadora
📋 Cupom: *{{3}}*
📅 Válido até {{4}}

*Válido apenas para secadoras.

Aproveite! 💙`,

    footer: 'Lavpop - Lavanderia Self-Service',

    variables: [
      { position: 1, key: 'customerName', label: 'Nome do cliente', source: 'customer.name', fallback: 'Cliente' },
      { position: 2, key: 'discount', label: 'Desconto (%)', source: 'campaign.discount', fallback: '20' },
      { position: 3, key: 'couponCode', label: 'Código do cupom', source: 'campaign.couponCode', required: true },
      { position: 4, key: 'expirationDate', label: 'Data de validade', source: 'campaign.expirationDate', format: 'DD/MM' }
    ],

    buttons: [
      { type: 'QUICK_REPLY', text: 'Vou aproveitar!' },
      { type: 'QUICK_REPLY', text: 'Não tenho interesse' }
    ],

    metaSubmission: {
      header: '☀️ Promoção de Secagem!',
      body: 'Olá {{1}}!\n\nPromoção especial de *secagem*:\n\n🎁 *{{2}}% OFF* na secadora\n📋 Cupom: *{{3}}*\n📅 Válido até {{4}}\n\n*Válido apenas para secadoras.\n\nAproveite! 💙',
      footer: 'Lavpop - Lavanderia Self-Service',
      buttons: ['Vou aproveitar!', 'Não tenho interesse']
    },

    posCouponConfig: {
      tipo: 'Cupom Desconto',
      permitidoPara: 'Secadoras',
      ciclosPorCliente: 1,
      validoSomenteSe: null
    },

    discountDefaults: {
      discountPercent: 20,
      couponCode: 'PSEC20',
      serviceType: 'dry'
    }
  },

  // ============================================================
  // UPSELL TEMPLATE (Complete o ciclo)
  // ============================================================
  {
    id: 'upsell_secagem',
    name: 'Complete com Secagem',
    category: 'MARKETING',
    campaignType: CAMPAIGN_TYPES.UPSELL,
    icon: 'Gift',
    color: 'sky',
    description: 'Para clientes que só lavaram (incentivar secagem)',
    audience: 'all', // Filtered manually by behavior

    metaTemplateName: 'lavpop_complete_secagem',
    twilioContentSid: 'HX0b7b6d4c5de6f842f0c72a0802452b40',

    header: {
      type: 'TEXT',
      text: 'Complete seu ciclo! ☀️'
    },

    body: `Olá {{1}}!

Vimos que você lavou suas roupas conosco. Que tal completar o ciclo com nossa secagem profissional?

🎁 *{{2}}% OFF* na secagem
📋 Cupom: *{{3}}*
📅 Válido até {{4}}

Roupas secas em minutos, sem preocupação! 💙`,

    footer: 'Lavpop - Lavanderia Self-Service',

    variables: [
      { position: 1, key: 'customerName', label: 'Nome do cliente', source: 'customer.name', fallback: 'Cliente' },
      { position: 2, key: 'discount', label: 'Desconto (%)', source: 'campaign.discount', fallback: '15' },
      { position: 3, key: 'couponCode', label: 'Código do cupom', source: 'campaign.couponCode', required: true },
      { position: 4, key: 'expirationDate', label: 'Data de validade', source: 'campaign.expirationDate', format: 'DD/MM' }
    ],

    buttons: [
      { type: 'QUICK_REPLY', text: 'Quero secar!' },
      { type: 'QUICK_REPLY', text: 'Não tenho interesse' }
    ],

    metaSubmission: {
      header: 'Complete seu ciclo! ☀️',
      body: 'Olá {{1}}!\n\nVimos que você lavou suas roupas conosco. Que tal completar o ciclo com nossa secagem profissional?\n\n🎁 *{{2}}% OFF* na secagem\n📋 Cupom: *{{3}}*\n📅 Válido até {{4}}\n\nRoupas secas em minutos, sem preocupação! 💙',
      footer: 'Lavpop - Lavanderia Self-Service',
      buttons: ['Quero secar!', 'Não tenho interesse']
    },

    posCouponConfig: {
      tipo: 'Cupom Desconto',
      permitidoPara: 'Secadoras',
      ciclosPorCliente: 1,
      validoSomenteSe: 'Lavou' // Must have washed first
    },

    discountDefaults: {
      discountPercent: 15,
      couponCode: 'SEQUE15',
      serviceType: 'dry'
    }
  }
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get template by ID
 */
export function getTemplateById(templateId) {
  return MESSAGE_TEMPLATES.find(t => t.id === templateId) || null;
}

/**
 * Get templates by audience
 */
export function getTemplatesByAudience(audience) {
  if (audience === 'all') return MESSAGE_TEMPLATES;
  return MESSAGE_TEMPLATES.filter(t => t.audience === audience || t.audience === 'all');
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category) {
  return MESSAGE_TEMPLATES.filter(t => t.category === category);
}

/**
 * Format template body with variables
 * @param {object} template - Template object
 * @param {object} data - Data object with variable values
 * @returns {string} Formatted message body
 */
export function formatTemplateBody(template, data) {
  let body = template.body;

  template.variables.forEach(variable => {
    const placeholder = `{{${variable.position}}}`;
    let value = data[variable.key];

    // Apply formatting
    if (variable.format === 'currency' && typeof value === 'number') {
      value = `R$ ${value.toFixed(2).replace('.', ',')}`;
    } else if (variable.format === 'DD/MM' && value instanceof Date) {
      value = value.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }

    // Use fallback if no value
    if (!value && variable.fallback) {
      value = variable.fallback;
    }

    body = body.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value || '');
  });

  return body;
}

/**
 * Validate template data has all required variables
 */
export function validateTemplateData(template, data) {
  const missing = [];

  template.variables.forEach(variable => {
    if (variable.required && !data[variable.key]) {
      missing.push(variable.label);
    }
  });

  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Export for Meta submission - generates text to copy/paste
 */
export function getMetaSubmissionText(templateId) {
  const template = getTemplateById(templateId);
  if (!template) return null;

  return `
TEMPLATE NAME: ${template.metaTemplateName}
CATEGORY: ${template.category}
LANGUAGE: pt_BR

HEADER:
${template.metaSubmission.header}

BODY:
${template.metaSubmission.body}

FOOTER:
${template.metaSubmission.footer}

BUTTONS:
${template.metaSubmission.buttons.map((b, i) => `${i + 1}. ${b}`).join('\n')}

VARIABLES:
${template.variables.map(v => `{{${v.position}}} = ${v.label}`).join('\n')}
`;
}

export default MESSAGE_TEMPLATES;
