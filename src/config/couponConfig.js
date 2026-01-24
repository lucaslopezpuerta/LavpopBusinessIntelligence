/**
 * Comprehensive Coupon Configuration for Bilavnova Campaign System
 *
 * This file defines all available coupon codes for the self-service laundromat.
 * Customers enter these codes at the POS kiosk when paying for services.
 *
 * Naming Convention:
 * - VOLTE = "Volte" (come back) - Win-back campaigns, all services
 * - LAVA = "Lava" (wash) - Win-back campaigns, wash only
 * - SECA = "Seca" (dry) - Win-back campaigns, dry only
 * - BEM = "Bem-vindo" (welcome) - Welcome campaigns
 * - PROMO = Promotional campaigns, all services
 * - PSEC = Promotional campaigns, dry only
 * - SEQUE = "Seque" (dry) - Upsell campaigns for dry service
 *
 * Number suffix indicates discount percentage (e.g., VOLTE20 = 20% off)
 */

// Service type constants
export const SERVICE_TYPES = {
  WASH: 'wash',
  DRY: 'dry',
  BOTH: 'both'
};

// Campaign type constants
export const CAMPAIGN_TYPES = {
  WINBACK: 'winback',
  WELCOME: 'welcome',
  PROMO: 'promo',
  UPSELL: 'upsell',
  // New automation types (v2.4)
  RFM_LOYALTY: 'rfm_loyalty',
  WEATHER: 'weather',
  ANNIVERSARY: 'anniversary',
  CHURNED: 'churned'
};

// Available discount percentages by campaign type
export const DISCOUNT_OPTIONS = {
  [CAMPAIGN_TYPES.WINBACK]: [15, 20, 25, 30],
  [CAMPAIGN_TYPES.WELCOME]: [10, 15, 20],
  [CAMPAIGN_TYPES.PROMO]: [10, 15, 20, 25],
  [CAMPAIGN_TYPES.UPSELL]: [10, 15, 20],
  // New automation types (v2.4)
  [CAMPAIGN_TYPES.RFM_LOYALTY]: [10, 20, 0], // 0 = branded bag (no discount)
  [CAMPAIGN_TYPES.WEATHER]: [10, 15, 20],
  [CAMPAIGN_TYPES.ANNIVERSARY]: [15, 20, 25],
  [CAMPAIGN_TYPES.CHURNED]: [50, 100] // 100 = free cycle
};

// Service type labels for UI (Portuguese)
export const SERVICE_TYPE_LABELS = {
  [SERVICE_TYPES.BOTH]: 'Todos os Serviços',
  [SERVICE_TYPES.WASH]: 'Só Lavagem',
  [SERVICE_TYPES.DRY]: 'Só Secagem'
};

// Available service types by campaign type (fallback)
export const SERVICE_OPTIONS = {
  [CAMPAIGN_TYPES.WINBACK]: [SERVICE_TYPES.BOTH, SERVICE_TYPES.WASH, SERVICE_TYPES.DRY],
  [CAMPAIGN_TYPES.WELCOME]: [SERVICE_TYPES.BOTH], // Welcome always applies to all services
  [CAMPAIGN_TYPES.PROMO]: [SERVICE_TYPES.BOTH, SERVICE_TYPES.DRY],
  [CAMPAIGN_TYPES.UPSELL]: [SERVICE_TYPES.DRY], // Upsell is specifically for dry service
  // New automation types (v2.4)
  [CAMPAIGN_TYPES.RFM_LOYALTY]: [SERVICE_TYPES.BOTH],
  [CAMPAIGN_TYPES.WEATHER]: [SERVICE_TYPES.BOTH],
  [CAMPAIGN_TYPES.ANNIVERSARY]: [SERVICE_TYPES.BOTH],
  [CAMPAIGN_TYPES.CHURNED]: [SERVICE_TYPES.BOTH, SERVICE_TYPES.WASH, SERVICE_TYPES.DRY] // Free cycle can be wash OR dry
};

/**
 * Template-specific service options
 * Some templates are service-specific and should only allow certain service types
 * This overrides SERVICE_OPTIONS when a template has specific constraints
 */
export const TEMPLATE_SERVICE_OPTIONS = {
  // Win-back templates
  'winback_discount': [SERVICE_TYPES.BOTH, SERVICE_TYPES.WASH, SERVICE_TYPES.DRY], // General - all options
  'winback_wash_only': [SERVICE_TYPES.WASH], // Wash only - locked to wash
  'winback_dry_only': [SERVICE_TYPES.DRY], // Dry only - locked to dry

  // Welcome templates
  'welcome_new': [SERVICE_TYPES.BOTH], // Welcome - all services

  // Promo templates
  'promo_general': [SERVICE_TYPES.BOTH], // General promo - all services only (use promo_secagem for dry-only)
  'promo_secagem': [SERVICE_TYPES.DRY], // Secagem promo - locked to dry

  // Upsell templates
  'upsell_secagem': [SERVICE_TYPES.DRY], // Upsell dryer - locked to dry

  // Wallet reminder has no coupon
  'wallet_reminder': [],

  // New automation templates (v2.4)
  'rfm_loyalty_vip': [SERVICE_TYPES.BOTH], // VIP rewards - all services
  'weather_promo': [SERVICE_TYPES.BOTH], // Weather promo - all services
  'registration_anniversary': [SERVICE_TYPES.BOTH], // Anniversary - all services
  'churned_recovery': [SERVICE_TYPES.BOTH, SERVICE_TYPES.WASH, SERVICE_TYPES.DRY] // Free cycle can be wash OR dry
};

/**
 * Template-specific discount options
 * Ensures only valid coupon combinations are available
 * Based on the 24-coupon matrix in meta-whatsapp-templates.md
 */
export const TEMPLATE_DISCOUNT_OPTIONS = {
  // Win-back: VOLTE/LAVA/SECA 15-30%
  'winback_discount': [15, 20, 25, 30],
  'winback_wash_only': [15, 20, 25, 30],
  'winback_dry_only': [15, 20, 25, 30],

  // Welcome: BEM 10-20%
  'welcome_new': [10, 15, 20],

  // Promo: PROMO 10-25%, PSEC 15-20%
  'promo_general': [10, 15, 20, 25], // PROMO10, PROMO15, PROMO20, PROMO25
  'promo_secagem': [15, 20],          // PSEC15, PSEC20 only

  // Upsell: SEQUE 10-20%
  'upsell_secagem': [10, 15, 20],

  // No coupon
  'wallet_reminder': [],

  // New automation templates (v2.4)
  'rfm_loyalty_vip': [10, 20, 0], // VIP10, VIP20, BOLSA (0 = bag, no discount)
  'weather_promo': [10, 15, 20], // CLIMA10, CLIMA15, CLIMA20
  'registration_anniversary': [15, 20, 25], // ANIVER15, ANIVER20, ANIVER25
  'churned_recovery': [50, 100] // VOLTA50, GRATIS (100 = free cycle)
};

/**
 * Template-specific default discounts
 * Based on the Template-to-Coupon Mapping in meta-whatsapp-templates.md
 */
export const TEMPLATE_DEFAULT_DISCOUNTS = {
  'winback_discount': 20,   // VOLTE20
  'winback_wash_only': 25,  // LAVA25
  'winback_dry_only': 25,   // SECA25
  'welcome_new': 10,        // BEM10
  'promo_general': 15,      // PROMO15
  'promo_secagem': 20,      // PSEC20
  'upsell_secagem': 15,     // SEQUE15
  'wallet_reminder': 0,     // No coupon
  // New automation templates (v2.4)
  'rfm_loyalty_vip': 10,    // VIP10
  'weather_promo': 15,      // CLIMA15
  'registration_anniversary': 15, // ANIVER15
  'churned_recovery': 50    // VOLTA50
};

/**
 * Complete coupon matrix - 24 coupons total
 * Each coupon has:
 * - code: Customer-friendly code for POS entry
 * - campaignType: Type of campaign this coupon is for
 * - discountPercent: Discount percentage
 * - serviceType: Which services the discount applies to
 * - description: Human-readable description (Portuguese)
 * - prerequisite: Required previous service (for upsell campaigns)
 */
export const COUPON_MATRIX = {
  // ============================================
  // WIN-BACK COUPONS (12 total)
  // For customers who haven't returned recently
  // ============================================

  // Win-back - All Services (Lavagem + Secagem)
  VOLTE15: {
    code: 'VOLTE15',
    campaignType: CAMPAIGN_TYPES.WINBACK,
    discountPercent: 15,
    serviceType: SERVICE_TYPES.BOTH,
    description: '15% de desconto em todos os serviços (Win-back)',
    prerequisite: null
  },
  VOLTE20: {
    code: 'VOLTE20',
    campaignType: CAMPAIGN_TYPES.WINBACK,
    discountPercent: 20,
    serviceType: SERVICE_TYPES.BOTH,
    description: '20% de desconto em todos os serviços (Win-back)',
    prerequisite: null
  },
  VOLTE25: {
    code: 'VOLTE25',
    campaignType: CAMPAIGN_TYPES.WINBACK,
    discountPercent: 25,
    serviceType: SERVICE_TYPES.BOTH,
    description: '25% de desconto em todos os serviços (Win-back)',
    prerequisite: null
  },
  VOLTE30: {
    code: 'VOLTE30',
    campaignType: CAMPAIGN_TYPES.WINBACK,
    discountPercent: 30,
    serviceType: SERVICE_TYPES.BOTH,
    description: '30% de desconto em todos os serviços (Win-back)',
    prerequisite: null
  },

  // Win-back - Wash Only
  LAVA15: {
    code: 'LAVA15',
    campaignType: CAMPAIGN_TYPES.WINBACK,
    discountPercent: 15,
    serviceType: SERVICE_TYPES.WASH,
    description: '15% de desconto em lavagem (Win-back)',
    prerequisite: null
  },
  LAVA20: {
    code: 'LAVA20',
    campaignType: CAMPAIGN_TYPES.WINBACK,
    discountPercent: 20,
    serviceType: SERVICE_TYPES.WASH,
    description: '20% de desconto em lavagem (Win-back)',
    prerequisite: null
  },
  LAVA25: {
    code: 'LAVA25',
    campaignType: CAMPAIGN_TYPES.WINBACK,
    discountPercent: 25,
    serviceType: SERVICE_TYPES.WASH,
    description: '25% de desconto em lavagem (Win-back)',
    prerequisite: null
  },
  LAVA30: {
    code: 'LAVA30',
    campaignType: CAMPAIGN_TYPES.WINBACK,
    discountPercent: 30,
    serviceType: SERVICE_TYPES.WASH,
    description: '30% de desconto em lavagem (Win-back)',
    prerequisite: null
  },

  // Win-back - Dry Only
  SECA15: {
    code: 'SECA15',
    campaignType: CAMPAIGN_TYPES.WINBACK,
    discountPercent: 15,
    serviceType: SERVICE_TYPES.DRY,
    description: '15% de desconto em secagem (Win-back)',
    prerequisite: null
  },
  SECA20: {
    code: 'SECA20',
    campaignType: CAMPAIGN_TYPES.WINBACK,
    discountPercent: 20,
    serviceType: SERVICE_TYPES.DRY,
    description: '20% de desconto em secagem (Win-back)',
    prerequisite: null
  },
  SECA25: {
    code: 'SECA25',
    campaignType: CAMPAIGN_TYPES.WINBACK,
    discountPercent: 25,
    serviceType: SERVICE_TYPES.DRY,
    description: '25% de desconto em secagem (Win-back)',
    prerequisite: null
  },
  SECA30: {
    code: 'SECA30',
    campaignType: CAMPAIGN_TYPES.WINBACK,
    discountPercent: 30,
    serviceType: SERVICE_TYPES.DRY,
    description: '30% de desconto em secagem (Win-back)',
    prerequisite: null
  },

  // ============================================
  // WELCOME COUPONS (3 total)
  // For first-time or new customers
  // ============================================
  BEM10: {
    code: 'BEM10',
    campaignType: CAMPAIGN_TYPES.WELCOME,
    discountPercent: 10,
    serviceType: SERVICE_TYPES.BOTH,
    description: '10% de desconto de boas-vindas',
    prerequisite: 'Lavou e Secou' // Must have used wash+dry before
  },
  BEM15: {
    code: 'BEM15',
    campaignType: CAMPAIGN_TYPES.WELCOME,
    discountPercent: 15,
    serviceType: SERVICE_TYPES.BOTH,
    description: '15% de desconto de boas-vindas',
    prerequisite: 'Lavou e Secou'
  },
  BEM20: {
    code: 'BEM20',
    campaignType: CAMPAIGN_TYPES.WELCOME,
    discountPercent: 20,
    serviceType: SERVICE_TYPES.BOTH,
    description: '20% de desconto de boas-vindas',
    prerequisite: 'Lavou e Secou'
  },

  // ============================================
  // PROMOTIONAL COUPONS (6 total)
  // For seasonal/special promotions
  // ============================================

  // Promo - All Services
  PROMO10: {
    code: 'PROMO10',
    campaignType: CAMPAIGN_TYPES.PROMO,
    discountPercent: 10,
    serviceType: SERVICE_TYPES.BOTH,
    description: '10% de desconto promocional',
    prerequisite: null
  },
  PROMO15: {
    code: 'PROMO15',
    campaignType: CAMPAIGN_TYPES.PROMO,
    discountPercent: 15,
    serviceType: SERVICE_TYPES.BOTH,
    description: '15% de desconto promocional',
    prerequisite: null
  },
  PROMO20: {
    code: 'PROMO20',
    campaignType: CAMPAIGN_TYPES.PROMO,
    discountPercent: 20,
    serviceType: SERVICE_TYPES.BOTH,
    description: '20% de desconto promocional',
    prerequisite: null
  },
  PROMO25: {
    code: 'PROMO25',
    campaignType: CAMPAIGN_TYPES.PROMO,
    discountPercent: 25,
    serviceType: SERVICE_TYPES.BOTH,
    description: '25% de desconto promocional',
    prerequisite: null
  },

  // Promo - Dry Only (for seasonal dry promotions)
  PSEC15: {
    code: 'PSEC15',
    campaignType: CAMPAIGN_TYPES.PROMO,
    discountPercent: 15,
    serviceType: SERVICE_TYPES.DRY,
    description: '15% de desconto promocional em secagem',
    prerequisite: null
  },
  PSEC20: {
    code: 'PSEC20',
    campaignType: CAMPAIGN_TYPES.PROMO,
    discountPercent: 20,
    serviceType: SERVICE_TYPES.DRY,
    description: '20% de desconto promocional em secagem',
    prerequisite: null
  },

  // ============================================
  // UPSELL COUPONS (3 total)
  // For customers who only washed - encourage drying
  // ============================================
  SEQUE10: {
    code: 'SEQUE10',
    campaignType: CAMPAIGN_TYPES.UPSELL,
    discountPercent: 10,
    serviceType: SERVICE_TYPES.DRY,
    description: '10% de desconto em secagem (Upsell)',
    prerequisite: 'Lavou' // Must have used wash service
  },
  SEQUE15: {
    code: 'SEQUE15',
    campaignType: CAMPAIGN_TYPES.UPSELL,
    discountPercent: 15,
    serviceType: SERVICE_TYPES.DRY,
    description: '15% de desconto em secagem (Upsell)',
    prerequisite: 'Lavou'
  },
  SEQUE20: {
    code: 'SEQUE20',
    campaignType: CAMPAIGN_TYPES.UPSELL,
    discountPercent: 20,
    serviceType: SERVICE_TYPES.DRY,
    description: '20% de desconto em secagem (Upsell)',
    prerequisite: 'Lavou'
  },

  // ============================================
  // RFM LOYALTY COUPONS (3 total) - v2.4
  // For VIP and Frequente customers
  // ============================================
  VIP10: {
    code: 'VIP10',
    campaignType: CAMPAIGN_TYPES.RFM_LOYALTY,
    discountPercent: 10,
    serviceType: SERVICE_TYPES.BOTH,
    description: '10% de desconto para clientes VIP',
    prerequisite: null
  },
  VIP20: {
    code: 'VIP20',
    campaignType: CAMPAIGN_TYPES.RFM_LOYALTY,
    discountPercent: 20,
    serviceType: SERVICE_TYPES.BOTH,
    description: '20% de desconto para clientes VIP',
    prerequisite: null
  },
  BOLSA: {
    code: 'BOLSA',
    campaignType: CAMPAIGN_TYPES.RFM_LOYALTY,
    discountPercent: 0,
    serviceType: null, // Special: bag redemption, not a discount
    description: 'Bolsa Lavpop exclusiva - retire na loja!',
    prerequisite: null,
    isPhysicalReward: true
  },

  // ============================================
  // WEATHER PROMO COUPONS (3 total) - v2.4
  // For weather-triggered campaigns
  // ============================================
  CLIMA10: {
    code: 'CLIMA10',
    campaignType: CAMPAIGN_TYPES.WEATHER,
    discountPercent: 10,
    serviceType: SERVICE_TYPES.BOTH,
    description: '10% de desconto - Promoção Clima',
    prerequisite: null
  },
  CLIMA15: {
    code: 'CLIMA15',
    campaignType: CAMPAIGN_TYPES.WEATHER,
    discountPercent: 15,
    serviceType: SERVICE_TYPES.BOTH,
    description: '15% de desconto - Promoção Clima',
    prerequisite: null
  },
  CLIMA20: {
    code: 'CLIMA20',
    campaignType: CAMPAIGN_TYPES.WEATHER,
    discountPercent: 20,
    serviceType: SERVICE_TYPES.BOTH,
    description: '20% de desconto - Promoção Clima',
    prerequisite: null
  },

  // ============================================
  // ANNIVERSARY COUPONS (3 total) - v2.4
  // For registration anniversary celebration
  // ============================================
  ANIVER15: {
    code: 'ANIVER15',
    campaignType: CAMPAIGN_TYPES.ANNIVERSARY,
    discountPercent: 15,
    serviceType: SERVICE_TYPES.BOTH,
    description: '15% de desconto - Aniversário de 1 ano',
    prerequisite: null
  },
  ANIVER20: {
    code: 'ANIVER20',
    campaignType: CAMPAIGN_TYPES.ANNIVERSARY,
    discountPercent: 20,
    serviceType: SERVICE_TYPES.BOTH,
    description: '20% de desconto - Aniversário de 2 anos',
    prerequisite: null
  },
  ANIVER25: {
    code: 'ANIVER25',
    campaignType: CAMPAIGN_TYPES.ANNIVERSARY,
    discountPercent: 25,
    serviceType: SERVICE_TYPES.BOTH,
    description: '25% de desconto - Aniversário de 3+ anos',
    prerequisite: null
  },

  // ============================================
  // CHURNED RECOVERY COUPONS (2 total) - v2.4
  // Aggressive recovery for lost customers
  // ============================================
  VOLTA50: {
    code: 'VOLTA50',
    campaignType: CAMPAIGN_TYPES.CHURNED,
    discountPercent: 50,
    serviceType: SERVICE_TYPES.BOTH,
    description: '50% de desconto - Última Chance',
    prerequisite: null
  },
  GRATIS: {
    code: 'GRATIS',
    campaignType: CAMPAIGN_TYPES.CHURNED,
    discountPercent: 100,
    serviceType: SERVICE_TYPES.BOTH, // Can be used for wash OR dry
    description: '1 ciclo GRÁTIS (lavagem ou secagem)',
    prerequisite: null,
    maxCyclesPerCustomer: 1 // Important: limit to 1 free cycle
  }
};

/**
 * Maps template IDs to their campaign types
 * Used to determine which coupons are available for each template
 */
export const TEMPLATE_CAMPAIGN_TYPE_MAP = {
  // Win-back templates
  'winback_discount': CAMPAIGN_TYPES.WINBACK,
  'winback_wash_only': CAMPAIGN_TYPES.WINBACK,
  'winback_dry_only': CAMPAIGN_TYPES.WINBACK,
  'winback_critical': CAMPAIGN_TYPES.WINBACK, // v3.1: Added missing 45+ day urgent template
  'winback_gentle': CAMPAIGN_TYPES.WINBACK,
  'winback_urgency': CAMPAIGN_TYPES.WINBACK,
  'reactivation_long_absence': CAMPAIGN_TYPES.WINBACK,
  // Welcome templates
  'welcome_new': CAMPAIGN_TYPES.WELCOME,
  'welcome_first_visit': CAMPAIGN_TYPES.WELCOME,
  // Promo templates
  'promo_general': CAMPAIGN_TYPES.PROMO,
  'promo_secagem': CAMPAIGN_TYPES.PROMO,
  'promo_seasonal': CAMPAIGN_TYPES.PROMO,
  // Upsell templates
  'upsell_secagem': CAMPAIGN_TYPES.UPSELL,
  'upsell_dryer': CAMPAIGN_TYPES.UPSELL,
  // New automation templates (v2.4)
  'rfm_loyalty_vip': CAMPAIGN_TYPES.RFM_LOYALTY,
  'weather_promo': CAMPAIGN_TYPES.WEATHER,
  'registration_anniversary': CAMPAIGN_TYPES.ANNIVERSARY,
  'churned_recovery': CAMPAIGN_TYPES.CHURNED
  // Note: wallet_reminder and post_visit_thanks have campaignType: null (no coupon)
};

/**
 * Get the coupon code for a given campaign type, discount percentage, and service type
 * @param {string} campaignType - One of CAMPAIGN_TYPES
 * @param {number} discountPercent - Discount percentage
 * @param {string} serviceType - One of SERVICE_TYPES
 * @returns {object|null} Coupon object or null if not found
 */
export function getCoupon(campaignType, discountPercent, serviceType) {
  const coupon = Object.values(COUPON_MATRIX).find(
    c => c.campaignType === campaignType &&
         c.discountPercent === discountPercent &&
         c.serviceType === serviceType
  );
  return coupon || null;
}

/**
 * Get all coupons for a specific campaign type
 * @param {string} campaignType - One of CAMPAIGN_TYPES
 * @returns {object[]} Array of coupon objects
 */
export function getCouponsForCampaignType(campaignType) {
  return Object.values(COUPON_MATRIX).filter(c => c.campaignType === campaignType);
}

/**
 * Get available discount options for a template
 * Uses template-specific options if defined, otherwise falls back to campaign type
 * @param {string} templateId - Template identifier
 * @returns {number[]} Array of available discount percentages
 */
export function getDiscountOptionsForTemplate(templateId) {
  // First check template-specific options
  if (TEMPLATE_DISCOUNT_OPTIONS[templateId]) {
    return TEMPLATE_DISCOUNT_OPTIONS[templateId];
  }
  // Fall back to campaign type options
  const campaignType = TEMPLATE_CAMPAIGN_TYPE_MAP[templateId];
  return DISCOUNT_OPTIONS[campaignType] || [20];
}

/**
 * Get the default discount percentage for a template
 * @param {string} templateId - Template identifier
 * @returns {number} Default discount percentage
 */
export function getDefaultDiscountForTemplate(templateId) {
  if (TEMPLATE_DEFAULT_DISCOUNTS[templateId] !== undefined) {
    return TEMPLATE_DEFAULT_DISCOUNTS[templateId];
  }
  const campaignType = TEMPLATE_CAMPAIGN_TYPE_MAP[templateId];
  const campaignTypeDefaults = {
    [CAMPAIGN_TYPES.WINBACK]: 20,
    [CAMPAIGN_TYPES.WELCOME]: 10,
    [CAMPAIGN_TYPES.PROMO]: 15,
    [CAMPAIGN_TYPES.UPSELL]: 15
  };
  return campaignTypeDefaults[campaignType] || 20;
}

/**
 * Get available service options for a template
 * Uses template-specific options if defined, otherwise falls back to campaign type
 * @param {string} templateId - Template identifier
 * @returns {string[]} Array of available service types
 */
export function getServiceOptionsForTemplate(templateId) {
  // First check template-specific options
  if (TEMPLATE_SERVICE_OPTIONS[templateId]) {
    return TEMPLATE_SERVICE_OPTIONS[templateId];
  }
  // Fall back to campaign type options
  const campaignType = TEMPLATE_CAMPAIGN_TYPE_MAP[templateId];
  return SERVICE_OPTIONS[campaignType] || [SERVICE_TYPES.BOTH];
}

/**
 * Get the appropriate coupon for a template based on user selections
 * @param {string} templateId - Template identifier
 * @param {number} discountPercent - Selected discount percentage
 * @param {string} serviceType - Selected service type
 * @returns {object|null} Coupon object or null if not found
 */
export function getCouponForTemplate(templateId, discountPercent, serviceType) {
  const campaignType = TEMPLATE_CAMPAIGN_TYPE_MAP[templateId];
  return getCoupon(campaignType, discountPercent, serviceType);
}

/**
 * Get default coupon for a template (used as fallback)
 * Uses template-specific discount and service type from the mapping tables
 * @param {string} templateId - Template identifier
 * @returns {object} Default coupon for the template
 */
export function getDefaultCouponForTemplate(templateId) {
  const campaignType = TEMPLATE_CAMPAIGN_TYPE_MAP[templateId];

  // Get template-specific discount (or fall back to campaign type default)
  let discountPercent = TEMPLATE_DEFAULT_DISCOUNTS[templateId];
  if (discountPercent === undefined) {
    const campaignTypeDefaults = {
      [CAMPAIGN_TYPES.WINBACK]: 20,
      [CAMPAIGN_TYPES.WELCOME]: 10,
      [CAMPAIGN_TYPES.PROMO]: 15,
      [CAMPAIGN_TYPES.UPSELL]: 15
    };
    discountPercent = campaignTypeDefaults[campaignType];
  }

  // Get template-specific service type (first available option)
  const templateServiceOptions = TEMPLATE_SERVICE_OPTIONS[templateId];
  let serviceType;

  if (templateServiceOptions && templateServiceOptions.length > 0) {
    // Use the first available service type for this template
    serviceType = templateServiceOptions[0];
  } else {
    // Fall back to campaign type defaults
    const defaultServiceTypes = {
      [CAMPAIGN_TYPES.WINBACK]: SERVICE_TYPES.BOTH,
      [CAMPAIGN_TYPES.WELCOME]: SERVICE_TYPES.BOTH,
      [CAMPAIGN_TYPES.PROMO]: SERVICE_TYPES.BOTH,
      [CAMPAIGN_TYPES.UPSELL]: SERVICE_TYPES.DRY
    };
    serviceType = defaultServiceTypes[campaignType];
  }

  return getCoupon(
    campaignType,
    discountPercent,
    serviceType
  );
}

// Export all coupons as an array for iteration
export const ALL_COUPONS = Object.values(COUPON_MATRIX);

// Export coupon codes as a simple array for validation
export const VALID_COUPON_CODES = Object.keys(COUPON_MATRIX);
